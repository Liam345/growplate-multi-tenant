/**
 * Admin Feature Configuration
 * 
 * Centralized configuration for admin dashboard features.
 * This data-driven approach makes it easy to add, remove, or modify
 * features without changing the Dashboard component logic.
 */

import { ShoppingCart, Menu, Star } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { FeatureName } from '~/types/features';

// =====================================================================================
// TYPES AND INTERFACES
// =====================================================================================

export interface FeatureCardConfig {
  /** Unique feature key that maps to the feature flag */
  key: FeatureName;
  /** Lucide icon component for the feature */
  icon: LucideIcon;
  /** Display title for the feature card */
  title: string;
  /** Description text for the feature card */
  description: string;
  /** URL to navigate to when the card is clicked */
  href: string;
  /** Analytics event name for tracking */
  analyticsEvent: string;
  /** Optional roles that can access this feature */
  roles?: string[];
  /** Optional badge text (e.g., "New", "Beta") */
  badge?: string;
  /** Optional custom styling classes */
  className?: string;
}

// =====================================================================================
// FEATURE CONFIGURATION
// =====================================================================================

/**
 * Master configuration for all admin dashboard features
 * 
 * This array defines all available features in the admin dashboard.
 * Features are automatically filtered based on:
 * - Feature flags (enabled/disabled per tenant)
 * - User roles (if specified)
 * 
 * To add a new feature:
 * 1. Add the feature to this array
 * 2. Ensure the feature key exists in FeatureName type
 * 3. The Dashboard component will automatically render it
 */
export const ADMIN_FEATURES: FeatureCardConfig[] = [
  {
    key: 'orders',
    icon: ShoppingCart,
    title: 'Order Management',
    description: 'Manage incoming orders, track status, and process payments',
    href: '/admin/orders',
    analyticsEvent: 'order_management_accessed',
    roles: ['owner', 'staff'], // Both owners and staff can access orders
  },
  {
    key: 'menu',
    icon: Menu,
    title: 'Menu Management',
    description: 'Create and manage menu items, categories, and pricing',
    href: '/admin/menu',
    analyticsEvent: 'menu_management_accessed',
    roles: ['owner', 'staff'], // Both owners and staff can manage menu
  },
  {
    key: 'loyalty',
    icon: Star,
    title: 'Loyalty System',
    description: 'Configure rewards, view customer points, and manage loyalty programs',
    href: '/admin/loyalty',
    analyticsEvent: 'loyalty_system_accessed',
    roles: ['owner'], // Only owners can configure loyalty system
    badge: 'Pro', // Optional badge to indicate premium feature
  },
];

// =====================================================================================
// UTILITY FUNCTIONS
// =====================================================================================

/**
 * Get features filtered by feature flags and user role
 * 
 * @param features - Object containing feature flag states
 * @param userRole - Current user's role (optional)
 * @returns Array of enabled feature configurations
 */
export function getEnabledFeatures(
  features: Record<FeatureName, boolean>,
  userRole?: string
): FeatureCardConfig[] {
  return ADMIN_FEATURES.filter(feature => {
    // Check if feature is enabled via feature flags
    if (!features[feature.key]) {
      return false;
    }

    // Check if user has required role (if specified)
    if (feature.roles && feature.roles.length > 0) {
      if (!userRole || !feature.roles.includes(userRole)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Get feature configuration by key
 * 
 * @param featureKey - The feature key to lookup
 * @returns Feature configuration or undefined if not found
 */
export function getFeatureConfig(featureKey: FeatureName): FeatureCardConfig | undefined {
  return ADMIN_FEATURES.find(feature => feature.key === featureKey);
}

/**
 * Get analytics events for all features
 * 
 * @returns Array of all analytics event names
 */
export function getAllAnalyticsEvents(): string[] {
  return ADMIN_FEATURES.map(feature => feature.analyticsEvent);
}

/**
 * Check if a feature requires specific roles
 * 
 * @param featureKey - The feature key to check
 * @returns True if feature has role requirements
 */
export function featureRequiresRole(featureKey: FeatureName): boolean {
  const feature = getFeatureConfig(featureKey);
  return Boolean(feature?.roles && feature.roles.length > 0);
}

/**
 * Get features available to a specific role
 * 
 * @param userRole - User role to check
 * @returns Array of feature keys available to the role
 */
export function getFeaturesForRole(userRole: string): FeatureName[] {
  return ADMIN_FEATURES
    .filter(feature => {
      // If no roles specified, feature is available to all
      if (!feature.roles || feature.roles.length === 0) {
        return true;
      }
      // Check if user role is in the allowed roles
      return feature.roles.includes(userRole);
    })
    .map(feature => feature.key);
}

// =====================================================================================
// FEATURE METADATA
// =====================================================================================

/**
 * Feature categories for grouping and organization
 */
export const FEATURE_CATEGORIES = {
  OPERATIONS: 'operations',
  CONTENT: 'content', 
  ANALYTICS: 'analytics',
  SETTINGS: 'settings',
} as const;

/**
 * Feature category mapping
 */
export const FEATURE_CATEGORY_MAP: Record<FeatureName, string> = {
  orders: FEATURE_CATEGORIES.OPERATIONS,
  menu: FEATURE_CATEGORIES.CONTENT,
  loyalty: FEATURE_CATEGORIES.ANALYTICS,
};

/**
 * Get features by category
 * 
 * @param category - Feature category
 * @returns Array of features in the category
 */
export function getFeaturesByCategory(category: string): FeatureCardConfig[] {
  return ADMIN_FEATURES.filter(feature => {
    return FEATURE_CATEGORY_MAP[feature.key] === category;
  });
}

// =====================================================================================
// EXPORTS
// =====================================================================================

export default ADMIN_FEATURES;