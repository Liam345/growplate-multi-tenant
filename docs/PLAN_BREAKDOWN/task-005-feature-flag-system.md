# TASK-005: Feature Flag System - Detailed Plan Breakdown

## Task Overview
**Complexity**: Medium | **Estimated Time**: 45 min | **Dependencies**: TASK-004

**Description**: Implement feature flag system with database storage and caching for GrowPlate multi-tenant restaurant management platform.

**SCOPE**: Core feature flag functionality only - no authentication, UI components, or admin dashboard integration (handled in later tasks).

## Context & Background

### Product Context
GrowPlate is a multi-tenant restaurant management platform where each restaurant operates as a separate tenant with configurable features. The feature flag system enables selective activation of core modules:

- **Order Management**: Online ordering, payment processing, order tracking
- **Loyalty System**: Points accumulation, rewards, customer profiles  
- **Menu Management**: Menu creation, pricing, availability management

### Technical Context
- Built on Remix (React + TypeScript) with PostgreSQL database
- Domain-based tenant resolution already implemented (TASK-004)
- Redis caching layer available for performance optimization
- Database schema with `tenant_features` table available

### Task-005 Scope Limitations
**NOT INCLUDED** (handled in later tasks):
- JWT authentication system (TASK-006)
- Authorization middleware (TASK-006) 
- React hooks for frontend (TASK-007/008)
- UI components and admin dashboard (TASK-007/008)
- Feature toggle interface (TASK-008)

## Implementation Plan

### Step 1: Database Layer Implementation (15 min)

#### 1.1 Feature Types Definition
```typescript
// src/types/features.ts
export type FeatureName = 'orders' | 'loyalty' | 'menu';

export interface Features {
  orders: boolean;
  loyalty: boolean;
  menu: boolean;
}

export interface TenantFeature {
  id: string;
  tenantId: string;
  featureName: FeatureName;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeatureConfig {
  name: FeatureName;
  displayName: string;
  description: string;
  defaultEnabled: boolean;
}
```

#### 1.2 Database Operations
```typescript
// src/lib/features.ts
import { db } from './db';
import { redis } from './redis';
import type { Features, FeatureName, TenantFeature } from '../types/features';

const CACHE_TTL = 3600; // 1 hour
const CACHE_PREFIX = 'features:';

export class FeatureService {
  // Get tenant features with Redis caching
  async getTenantFeatures(tenantId: string): Promise<Features> {
    const cacheKey = `${CACHE_PREFIX}${tenantId}`;
    
    // Try cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Fallback to database
    const dbFeatures = await this.getFromDatabase(tenantId);
    
    // Cache result
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(dbFeatures));
    
    return dbFeatures;
  }
  
  // Update tenant features
  async updateTenantFeatures(tenantId: string, features: Partial<Features>): Promise<Features> {
    const updates = Object.entries(features);
    
    for (const [featureName, enabled] of updates) {
      await db.query(`
        INSERT INTO tenant_features (tenant_id, feature_name, enabled)
        VALUES ($1, $2, $3)
        ON CONFLICT (tenant_id, feature_name)
        DO UPDATE SET enabled = $3, updated_at = NOW()
      `, [tenantId, featureName, enabled]);
    }
    
    // Invalidate cache
    await redis.del(`${CACHE_PREFIX}${tenantId}`);
    
    return this.getTenantFeatures(tenantId);
  }
  
  private async getFromDatabase(tenantId: string): Promise<Features> {
    const result = await db.query(`
      SELECT feature_name, enabled 
      FROM tenant_features 
      WHERE tenant_id = $1
    `, [tenantId]);
    
    // Default features
    const features: Features = {
      orders: false,
      loyalty: false,
      menu: true // Menu enabled by default
    };
    
    // Override with database values
    result.rows.forEach(row => {
      features[row.feature_name as FeatureName] = row.enabled;
    });
    
    return features;
  }
}
```

### Step 2: API Implementation (15 min)

#### 2.1 Feature Management API
```typescript
// app/routes/api.features.ts
import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { FeatureService } from '~/lib/features';
import { requireAuth } from '~/middleware/auth';
import { requireTenant } from '~/middleware/tenant';

const featureService = new FeatureService();

// GET /api/features - Get tenant features
export async function loader({ request }: LoaderFunctionArgs) {
  const { tenant } = await requireTenant(request);
  const { user } = await requireAuth(request);
  
  // Only owners can view features
  if (user.role !== 'owner') {
    throw new Response('Forbidden', { status: 403 });
  }
  
  const features = await featureService.getTenantFeatures(tenant.id);
  
  return json({
    success: true,
    data: features
  });
}

// PUT /api/features - Update tenant features
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'PUT') {
    throw new Response('Method not allowed', { status: 405 });
  }
  
  const { tenant } = await requireTenant(request);
  const { user } = await requireAuth(request);
  
  // Only owners can modify features
  if (user.role !== 'owner') {
    throw new Response('Forbidden', { status: 403 });
  }
  
  const body = await request.json();
  const { features } = body;
  
  // Validate input
  if (!features || typeof features !== 'object') {
    return json({
      success: false,
      error: 'Invalid features object'
    }, { status: 400 });
  }
  
  try {
    const updatedFeatures = await featureService.updateTenantFeatures(tenant.id, features);
    
    return json({
      success: true,
      data: updatedFeatures
    });
  } catch (error) {
    return json({
      success: false,
      error: 'Failed to update features'
    }, { status: 500 });
  }
}
```

### Step 3: Frontend Integration (10 min)

#### 3.1 React Hook for Feature Flags
```typescript
// src/hooks/useFeatures.ts
import { useEffect, useState } from 'react';
import type { Features } from '~/types/features';

export function useFeatures() {
  const [features, setFeatures] = useState<Features>({
    orders: false,
    loyalty: false,
    menu: true
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchFeatures() {
      try {
        const response = await fetch('/api/features');
        const result = await response.json();
        
        if (result.success) {
          setFeatures(result.data);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError('Failed to load features');
      } finally {
        setLoading(false);
      }
    }
    
    fetchFeatures();
  }, []);
  
  const updateFeatures = async (newFeatures: Partial<Features>) => {
    try {
      const response = await fetch('/api/features', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ features: newFeatures }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setFeatures(result.data);
        return true;
      } else {
        setError(result.error);
        return false;
      }
    } catch (err) {
      setError('Failed to update features');
      return false;
    }
  };
  
  return {
    features,
    loading,
    error,
    updateFeatures,
    // Convenience getters
    hasOrders: features.orders,
    hasLoyalty: features.loyalty,
    hasMenu: features.menu,
  };
}
```

#### 3.2 Feature Toggle Component
```typescript
// src/components/admin/FeatureToggle.tsx
import { useState } from 'react';
import type { FeatureName } from '~/types/features';

interface FeatureToggleProps {
  featureName: FeatureName;
  displayName: string;
  description: string;
  enabled: boolean;
  onToggle: (featureName: FeatureName, enabled: boolean) => Promise<boolean>;
}

export function FeatureToggle({ 
  featureName, 
  displayName, 
  description, 
  enabled, 
  onToggle 
}: FeatureToggleProps) {
  const [isToggling, setIsToggling] = useState(false);
  
  const handleToggle = async () => {
    setIsToggling(true);
    const success = await onToggle(featureName, !enabled);
    if (!success) {
      // Handle error - could show toast notification
      console.error(`Failed to toggle ${featureName}`);
    }
    setIsToggling(false);
  };
  
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900">{displayName}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      
      <button
        onClick={handleToggle}
        disabled={isToggling}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
          ${enabled ? 'bg-blue-600' : 'bg-gray-200'}
          ${isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${enabled ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
    </div>
  );
}
```

### Step 4: Error Handling & Validation (5 min)

#### 4.1 Input Validation
```typescript
// src/lib/validation.ts
import type { Features, FeatureName } from '~/types/features';

const VALID_FEATURES: FeatureName[] = ['orders', 'loyalty', 'menu'];

export function validateFeatureUpdate(features: any): features is Partial<Features> {
  if (!features || typeof features !== 'object') {
    return false;
  }
  
  return Object.entries(features).every(([key, value]) => {
    return VALID_FEATURES.includes(key as FeatureName) && typeof value === 'boolean';
  });
}

export function sanitizeFeatures(features: any): Partial<Features> {
  const sanitized: Partial<Features> = {};
  
  VALID_FEATURES.forEach(feature => {
    if (feature in features && typeof features[feature] === 'boolean') {
      sanitized[feature] = features[feature];
    }
  });
  
  return sanitized;
}
```

#### 4.2 Error Handling Middleware
```typescript
// src/lib/features.ts (additional error handling)
export class FeatureService {
  async getTenantFeatures(tenantId: string): Promise<Features> {
    try {
      // ... existing implementation
    } catch (error) {
      console.error('Failed to get tenant features:', error);
      
      // Return default features on error
      return {
        orders: false,
        loyalty: false,
        menu: true
      };
    }
  }
  
  async updateTenantFeatures(tenantId: string, features: Partial<Features>): Promise<Features> {
    // Validate input
    const validatedFeatures = sanitizeFeatures(features);
    if (Object.keys(validatedFeatures).length === 0) {
      throw new Error('No valid features provided');
    }
    
    try {
      // ... existing implementation
    } catch (error) {
      console.error('Failed to update tenant features:', error);
      throw new Error('Database update failed');
    }
  }
}
```

## Quality Assurance

### Testing Strategy
1. **Unit Tests**: Feature service methods, validation functions
2. **Integration Tests**: API endpoints with authentication
3. **Cache Tests**: Redis caching behavior and invalidation
4. **E2E Tests**: Feature toggle functionality in admin dashboard

### Performance Considerations
- **Caching**: Redis cache with 1-hour TTL for frequently accessed features
- **Database Efficiency**: Upsert operations to minimize database calls
- **Error Recovery**: Graceful fallback to default features on cache/DB failure

### Security Measures
- **Authorization**: Only tenant owners can modify features
- **Input Validation**: Sanitize and validate all feature updates
- **Tenant Isolation**: All queries scoped to tenant ID

## Integration Points

### Dependencies
- **TASK-004**: Tenant resolution middleware provides tenant context
- **Database**: PostgreSQL with `tenant_features` table
- **Cache**: Redis for performance optimization
- **Auth**: JWT middleware for API protection

### Integration with Other Features
- **Dashboard**: Admin dashboard will use feature flags for conditional rendering
- **Menu Management**: Will check `menu` feature flag before showing UI
- **Order System**: Will check `orders` feature flag before enabling functionality
- **Loyalty System**: Will check `loyalty` feature flag before showing rewards

## Risk Assessment

### Technical Risks
1. **Cache Inconsistency**: Mitigated by proper cache invalidation on updates
2. **Database Performance**: Mitigated by efficient queries and caching
3. **Feature Rollback**: Mitigated by maintaining feature state history

### Business Risks
1. **Feature Dependencies**: Document which features depend on others
2. **Data Integrity**: Ensure disabling features doesn't break existing data
3. **User Experience**: Provide clear messaging when features are disabled

## Success Metrics

### Functional Requirements
- [ ] Features can be enabled/disabled per tenant via API
- [ ] Feature flags are cached efficiently (sub-100ms response)
- [ ] Only authorized users can modify features
- [ ] Default features work correctly for new tenants

### Performance Requirements
- [ ] API response time < 200ms (cached)
- [ ] Database queries optimized with proper indexing
- [ ] Cache hit ratio > 90% for feature lookups
- [ ] No N+1 query problems

### Security Requirements
- [ ] Role-based access control enforced
- [ ] All inputs validated and sanitized
- [ ] Tenant isolation maintained
- [ ] No unauthorized feature access

This plan provides a comprehensive implementation strategy for the feature flag system that integrates seamlessly with the existing GrowPlate architecture while maintaining performance, security, and scalability requirements.