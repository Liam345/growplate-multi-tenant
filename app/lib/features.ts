/**
 * Feature Flag System - Core Service
 * 
 * Implements feature flag operations with database storage and Redis caching
 * for the multi-tenant GrowPlate platform.
 * 
 * TASK-005: Feature Flag System Implementation
 */

import { tenantQuery, tenantQueryMany } from "~/lib/db";
import { getTenantCache, setTenantCache, deleteTenantCache, CACHE_TTL } from "~/lib/redis";
import type { Features, FeatureName, TenantFeatures } from "~/types/features";

// Cache configuration
const FEATURES_CACHE_KEY = "features";
const FEATURES_CACHE_TTL = CACHE_TTL.LONG; // 2 hours

// Default feature configuration - only 3 core features for Task-005
const DEFAULT_FEATURES: Features = {
  orders: false,
  loyalty: false, 
  menu: true, // Menu enabled by default
};

// Valid feature names for Task-005 scope
const VALID_FEATURES: FeatureName[] = ['orders', 'loyalty', 'menu'];

/**
 * Feature Service Class
 * Handles all feature flag operations with caching and tenant isolation
 */
export class FeatureService {
  /**
   * Get tenant features with Redis caching
   */
  async getTenantFeatures(tenantId: string): Promise<Features> {
    if (!tenantId) {
      throw new Error("Tenant ID is required");
    }

    try {
      // Try cache first
      const cached = await getTenantCache<Features>(tenantId, FEATURES_CACHE_KEY);
      if (cached) {
        return cached;
      }

      // Fallback to database
      const dbFeatures = await this.getFromDatabase(tenantId);
      
      // Cache result
      await setTenantCache(tenantId, FEATURES_CACHE_KEY, dbFeatures, { 
        ttl: FEATURES_CACHE_TTL 
      });
      
      return dbFeatures;
    } catch (error) {
      console.error('Failed to get tenant features:', error);
      
      // Return default features on error for graceful degradation
      return { ...DEFAULT_FEATURES };
    }
  }

  /**
   * Update tenant features with cache invalidation
   */
  async updateTenantFeatures(tenantId: string, features: Partial<Features>): Promise<Features> {
    if (!tenantId) {
      throw new Error("Tenant ID is required");
    }

    if (!features || typeof features !== 'object') {
      throw new Error("Features object is required");
    }

    try {
      // Update database for each feature
      const updates = Object.entries(features).filter(([key, value]) => 
        VALID_FEATURES.includes(key as FeatureName) && typeof value === 'boolean'
      );

      if (updates.length === 0) {
        throw new Error("No valid features provided");
      }

      for (const [featureName, enabled] of updates) {
        await tenantQuery(tenantId, `
          INSERT INTO tenant_features (tenant_id, feature_name, enabled)
          VALUES ($1, $2, $3)
          ON CONFLICT (tenant_id, feature_name)
          DO UPDATE SET enabled = $3, updated_at = NOW()
        `, [tenantId, featureName, enabled]);
      }

      // Invalidate cache
      await deleteTenantCache(tenantId, FEATURES_CACHE_KEY);

      // Return updated features
      return await this.getTenantFeatures(tenantId);
    } catch (error) {
      console.error('Failed to update tenant features:', error);
      throw new Error('Database update failed');
    }
  }

  /**
   * Get features from database with defaults
   * Private method for internal use
   */
  private async getFromDatabase(tenantId: string): Promise<Features> {
    try {
      const result = await tenantQueryMany<{ feature_name: string; enabled: boolean }>(
        tenantId,
        `SELECT feature_name, enabled FROM tenant_features WHERE tenant_id = $1`,
        [tenantId]
      );

      // Start with default features
      const features: Features = { ...DEFAULT_FEATURES };

      // Override with database values
      result.forEach(row => {
        const featureName = row.feature_name as FeatureName;
        if (VALID_FEATURES.includes(featureName)) {
          features[featureName] = row.enabled;
        }
      });

      return features;
    } catch (error) {
      console.error('Database query failed:', error);
      throw error;
    }
  }

  /**
   * Check if a specific feature is enabled for a tenant
   * Convenience method for feature checking
   */
  async isFeatureEnabled(tenantId: string, featureName: FeatureName): Promise<boolean> {
    const features = await this.getTenantFeatures(tenantId);
    return features[featureName] || false;
  }

  /**
   * Initialize default features for a new tenant
   * Called when a new tenant is created
   */
  async initializeTenantFeatures(tenantId: string): Promise<Features> {
    if (!tenantId) {
      throw new Error("Tenant ID is required");
    }

    try {
      // Insert default features
      for (const [featureName, enabled] of Object.entries(DEFAULT_FEATURES)) {
        await tenantQuery(tenantId, `
          INSERT INTO tenant_features (tenant_id, feature_name, enabled)
          VALUES ($1, $2, $3)
          ON CONFLICT (tenant_id, feature_name) DO NOTHING
        `, [tenantId, featureName, enabled]);
      }

      // Cache the default features
      await setTenantCache(tenantId, FEATURES_CACHE_KEY, DEFAULT_FEATURES, {
        ttl: FEATURES_CACHE_TTL
      });

      return { ...DEFAULT_FEATURES };
    } catch (error) {
      console.error('Failed to initialize tenant features:', error);
      throw new Error('Feature initialization failed');
    }
  }

  /**
   * Clear feature cache for a tenant
   * Useful for cache management
   */
  async clearFeatureCache(tenantId: string): Promise<boolean> {
    if (!tenantId) {
      return false;
    }

    try {
      return await deleteTenantCache(tenantId, FEATURES_CACHE_KEY);
    } catch (error) {
      console.error('Failed to clear feature cache:', error);
      return false;
    }
  }
}

// Export singleton instance
export const featureService = new FeatureService();

// Export default features for reference
export { DEFAULT_FEATURES, VALID_FEATURES };