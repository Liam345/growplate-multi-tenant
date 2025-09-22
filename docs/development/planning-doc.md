# GrowPlate - Multi-Tenant Restaurant Management Platform

## Project Overview

GrowPlate is a multi-tenant restaurant management platform that provides order management, loyalty systems, and menu management for restaurants. Each restaurant operates as a separate tenant with their own domain while sharing the same underlying infrastructure.

## Architecture Overview

### Core Principles
- **Multi-tenancy**: Domain-based tenant resolution with shared database
- **Feature Flags**: Configurable feature toggles per tenant
- **Extensibility**: Plugin-based architecture for easy feature additions
- **Scalability**: Designed to handle 10-50 restaurants initially, scaling to 10,000+

### Technology Stack

#### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with full-text search
- **Cache**: Redis for tenant configs and frequent queries
- **Payments**: Stripe for multi-tenant payment processing

#### Frontend
- **Framework**: Remix (React + TypeScript)
- **Rendering**: Server-side rendering with progressive enhancement
- **Styling**: TailwindCSS (recommended)
- **State Management**: React Context/Zustand

#### Infrastructure
- **Deployment**: Docker containers
- **Monitoring**: Application and database monitoring
- **Security**: JWT-based authentication with tenant scoping

## Multi-Tenancy Strategy

### Domain-Based Tenant Resolution
- Each restaurant gets their own domain (e.g., `pizza-palace.com`, `burger-spot.com`)
- Backend API identifies tenant by incoming domain
- All domains point to the same application infrastructure
- Tenant-specific branding and configuration

### Data Isolation
- **Shared Database**: Single PostgreSQL instance
- **Tenant ID**: Every table includes tenant_id for row-level filtering
- **Code-Level Isolation**: Middleware ensures queries are tenant-scoped
- **No Strict Compliance**: Business data isolation without regulatory requirements

### Example Implementation
```typescript
// Middleware for tenant resolution
app.use(async (req, res, next) => {
  const tenant = await getTenantByDomain(req.hostname);
  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found' });
  }
  req.tenant = tenant;
  next();
});

// All database queries include tenant filter
const getOrders = (tenantId: string) => {
  return db.query('SELECT * FROM orders WHERE tenant_id = $1', [tenantId]);
};
```

## Feature Flag System

### Simple On/Off Toggles
- Each tenant can have features enabled or disabled
- No percentage rollouts or complex targeting
- Runtime configuration changes without code deployment

### Database Schema
```sql
CREATE TABLE tenant_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  feature_name VARCHAR(50) NOT NULL,
  enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, feature_name)
);
```

### Core Features
1. **Order Management**: Online ordering, order tracking, payment processing
2. **Loyalty System**: Points accumulation, rewards, customer profiles
3. **Menu Management**: Menu creation, pricing, availability management

## Database Schema Design

### Core Entities

#### Tenants
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) UNIQUE NOT NULL,
  subdomain VARCHAR(100) UNIQUE,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address JSONB,
  settings JSONB DEFAULT '{}',
  stripe_account_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Users (Multi-role)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(20) CHECK (role IN ('owner', 'staff', 'customer')),
  phone VARCHAR(20),
  loyalty_points INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);
```

#### Menu Management
```sql
CREATE TABLE menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  category_id UUID REFERENCES menu_categories(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url VARCHAR(500),
  is_available BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  search_vector tsvector, -- For full-text search
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Full-text search index
CREATE INDEX idx_menu_items_search ON menu_items USING gin(search_vector);
```

#### Order Management
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  customer_id UUID REFERENCES users(id),
  order_number VARCHAR(50) NOT NULL,
  status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
  order_type VARCHAR(20) CHECK (order_type IN ('dine_in', 'takeout', 'delivery')),
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  tip_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  stripe_payment_intent_id VARCHAR(255),
  customer_notes TEXT,
  estimated_ready_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, order_number)
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  special_instructions TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Loyalty System
```sql
CREATE TABLE loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  customer_id UUID NOT NULL REFERENCES users(id),
  order_id UUID REFERENCES orders(id),
  transaction_type VARCHAR(20) CHECK (transaction_type IN ('earned', 'redeemed', 'expired', 'adjusted')),
  points INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE loyalty_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  reward_type VARCHAR(20) CHECK (reward_type IN ('discount_percent', 'discount_amount', 'free_item')),
  reward_value DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## API Architecture

### RESTful API Design
- **Base URL**: `https://api.growplate.com`
- **Tenant Resolution**: Via Host header or subdomain
- **Authentication**: JWT tokens with tenant scope
- **Versioning**: URL-based versioning (`/api/v1/`)

### Core API Endpoints

#### Tenant Management
```
GET    /api/v1/tenant              # Get current tenant info
PUT    /api/v1/tenant              # Update tenant settings
GET    /api/v1/tenant/features     # Get enabled features
PUT    /api/v1/tenant/features     # Update feature flags
```

#### Menu Management
```
GET    /api/v1/menu/categories     # List categories
POST   /api/v1/menu/categories     # Create category
GET    /api/v1/menu/items          # List menu items
POST   /api/v1/menu/items          # Create menu item
PUT    /api/v1/menu/items/:id      # Update menu item
DELETE /api/v1/menu/items/:id      # Delete menu item
GET    /api/v1/menu/search?q=pizza # Search menu items
```

#### Order Management
```
GET    /api/v1/orders              # List orders
POST   /api/v1/orders              # Create order
GET    /api/v1/orders/:id          # Get order details
PUT    /api/v1/orders/:id/status   # Update order status
POST   /api/v1/orders/:id/payment  # Process payment
```

#### Loyalty System
```
GET    /api/v1/loyalty/points      # Get customer points
POST   /api/v1/loyalty/redeem      # Redeem points
GET    /api/v1/loyalty/rewards     # List available rewards
GET    /api/v1/loyalty/history     # Point transaction history
```

## Frontend Architecture

### Remix Application Structure
```
app/
├── components/          # Reusable UI components
│   ├── ui/              # Basic UI components
│   ├── forms/           # Form components
│   └── layout/          # Layout components
├── routes/              # Remix routes
│   ├── api/             # API resource routes
│   ├── admin/           # Restaurant admin dashboard
│   ├── menu/            # Public menu pages
│   └── orders/          # Customer order pages
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
├── store/               # State management
└── styles/              # CSS and styling
```

### Feature-Conditional Rendering
```typescript
// Hook for feature flags
const useFeatures = () => {
  const { tenant } = useTenant();
  return {
    hasOrders: tenant.features.includes('orders'),
    hasLoyalty: tenant.features.includes('loyalty'),
    hasMenu: tenant.features.includes('menu'),
  };
};

// Component with conditional rendering
const Dashboard = () => {
  const { hasOrders, hasLoyalty } = useFeatures();
  
  return (
    <div>
      {hasOrders && <OrdersSection />}
      {hasLoyalty && <LoyaltySection />}
    </div>
  );
};
```

## Development Phases

### Phase 1: Foundation & Tenant Management (Week 1-2)
**Goal**: Basic multi-tenant infrastructure with domain resolution

**Tasks**:
1. Setup Remix project with TypeScript configuration
2. Configure PostgreSQL database with tenant schema
3. Setup Redis caching layer
4. Implement domain-based tenant resolution middleware
5. Create tenant management API endpoints
6. Build feature flag system (database + API)
7. Setup JWT authentication with tenant scoping
8. Create basic admin dashboard layout

**Deliverables**:
- Working multi-tenant infrastructure
- Domain-based tenant resolution
- Feature flag system
- Basic authentication

### Phase 2: Menu Management (Week 3-4)
**Goal**: Complete menu management system for restaurant owners

**Tasks**:
1. Implement menu database schema (categories, items)
2. Create menu CRUD API endpoints
3. Build restaurant admin dashboard for menu management
4. Add PostgreSQL full-text search for menu items
5. Create public menu display for customers
6. Implement image upload for menu items
7. Add menu item availability toggles
8. Create menu preview functionality

**Deliverables**:
- Menu management dashboard
- Public menu display
- Search functionality
- Image management

### Phase 3: Order Management (Week 5-7)
**Goal**: Complete online ordering system with payment processing

**Tasks**:
1. Implement order database schema
2. Create order API endpoints with real-time updates
3. Integrate Stripe payment processing
4. Build customer ordering interface
5. Create restaurant order management dashboard
6. Add order status tracking system
7. Implement order notifications
8. Add order history and receipts

**Deliverables**:
- Customer ordering interface
- Payment processing
- Order management dashboard
- Real-time order tracking

### Phase 4: Loyalty System (Week 8-9)
**Goal**: Customer loyalty and rewards system

**Tasks**:
1. Implement loyalty database schema
2. Create loyalty API endpoints
3. Build customer loyalty dashboard
4. Create restaurant loyalty configuration interface
5. Integrate loyalty points with order system
6. Add reward redemption functionality
7. Create loyalty analytics dashboard
8. Implement point expiration rules

**Deliverables**:
- Customer loyalty dashboard
- Reward system
- Loyalty analytics
- Point management

## AI Implementation Strategy

### Task Breakdown for Async AI Implementation

Each phase is broken down into independent, AI-implementable tasks:

#### Atomic Task Structure
- **Clear Requirements**: Each task has specific, measurable outcomes
- **Minimal Dependencies**: Tasks can be implemented independently
- **Interface Contracts**: Clear API contracts between components
- **Test-Driven**: Each task includes test requirements

#### Implementation Approach
1. **Schema-First**: Database schema defines the contracts
2. **API-First**: API endpoints define the interfaces
3. **Component-Driven**: Frontend components are self-contained
4. **Feature-Flagged**: All features are behind toggles

#### Quality Assurance
- TypeScript for type safety
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical user flows

## Security Considerations

### Data Protection
- **Tenant Isolation**: Row-level security in database queries
- **Authentication**: JWT tokens with tenant and role scoping
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: Comprehensive input sanitization

### Payment Security
- **PCI Compliance**: Use Stripe for payment processing
- **No Card Storage**: Never store payment information
- **Webhook Security**: Verify Stripe webhook signatures

### API Security
- **Rate Limiting**: Prevent API abuse
- **CORS Configuration**: Restrict cross-origin requests
- **SQL Injection**: Use parameterized queries
- **XSS Protection**: Sanitize user inputs

## Performance Optimization

### Database Optimization
- **Indexing**: Proper indexes on tenant_id and search fields
- **Query Optimization**: Efficient queries with tenant filtering
- **Connection Pooling**: Manage database connections
- **Full-Text Search**: PostgreSQL search for menu items

### Caching Strategy
- **Redis Caching**: Tenant configurations and frequent queries
- **CDN**: Static assets and images
- **Application Caching**: In-memory caching for hot data

### Frontend Performance
- **Server-Side Rendering**: Remix SSR with progressive enhancement for SEO and performance
- **Code Splitting**: Dynamic imports for feature modules
- **Image Optimization**: Remix with optimized image handling
- **Bundle Optimization**: Tree shaking and minification

## Monitoring and Analytics

### Application Monitoring
- **Error Tracking**: Comprehensive error logging and alerting
- **Performance Monitoring**: Response time and throughput metrics
- **Health Checks**: Service availability monitoring

### Business Analytics
- **Order Analytics**: Revenue, order volume, popular items
- **Customer Analytics**: Retention, loyalty engagement
- **Tenant Analytics**: Feature usage, performance metrics

## Deployment Strategy

### Docker Containerization
```dockerfile
# Multi-stage build for Remix
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Configuration
- **Development**: Local PostgreSQL and Redis
- **Staging**: Cloud database with production-like data
- **Production**: Highly available setup with monitoring

This planning document serves as the comprehensive guide for implementing the GrowPlate multi-tenant restaurant management platform. Each phase builds upon the previous one, ensuring a solid foundation while maintaining the flexibility to add new features through the feature flag system.