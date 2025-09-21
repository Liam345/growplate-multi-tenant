/**
 * Feature Flag Types
 *
 * Type definitions for the feature flag system.
 */

export type FeatureName = 'menu' | 'orders' | 'loyalty';

export type Features = Record<FeatureName, boolean>;

export interface FeatureFlag {
  name: FeatureName;
  enabled: boolean;
  description: string;
}

export interface TenantFeatures {
  tenantId: string;
  features: Features;
  lastUpdated: Date;
}
