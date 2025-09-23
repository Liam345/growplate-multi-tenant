/**
 * Feature Flag Types
 * 
 * Type definitions for the feature flag system.
 * TASK-005: Core feature flag system with 3 main features only
 */

// Core feature names for Task-005 scope
export type FeatureName = 'orders' | 'loyalty' | 'menu';

// Features type - explicit interface for better type safety
export interface Features {
  orders: boolean;
  loyalty: boolean;
  menu: boolean;
}

// Individual feature flag interface
export interface FeatureFlag {
  name: FeatureName;
  enabled: boolean;
  description: string;
}

// Tenant feature context interface
export interface TenantFeatures {
  tenantId: string;
  features: Features;
  lastUpdated: Date;
}

// Feature configuration interface for defaults
export interface FeatureConfig {
  name: FeatureName;
  displayName: string;
  description: string;
  defaultEnabled: boolean;
}
