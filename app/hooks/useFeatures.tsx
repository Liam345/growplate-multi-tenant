/**
 * Feature Flag Hook for Layout Components
 * 
 * Provides feature flag state management for conditional rendering
 * in layout components. Integrates with the existing feature flag system.
 */

import { useContext, createContext, useMemo, useCallback, type ReactNode } from 'react';
import type { Features, FeatureName } from '~/types/features';

// =====================================================================================
// CONTEXT DEFINITIONS
// =====================================================================================

interface FeatureContextType {
  features: Features;
  hasFeature: (feature: FeatureName) => boolean;
  hasOrders: boolean;
  hasLoyalty: boolean;
  hasMenu: boolean;
}

const FeatureContext = createContext<FeatureContextType | null>(null);

// =====================================================================================
// FEATURE PROVIDER COMPONENT
// =====================================================================================

interface FeatureProviderProps {
  children: ReactNode;
  features: Features;
}

/**
 * Feature Provider component to wrap layout components with feature context
 * 
 * @param children - Child components
 * @param features - Feature flags object from tenant
 */
export function FeatureProvider({ children, features }: FeatureProviderProps) {
  const hasFeature = useCallback((feature: FeatureName): boolean => {
    return features[feature] ?? false;
  }, [features]);

  const contextValue: FeatureContextType = useMemo(() => ({
    features,
    hasFeature,
    hasOrders: hasFeature('orders'),
    hasLoyalty: hasFeature('loyalty'),
    hasMenu: hasFeature('menu'),
  }), [features, hasFeature]);

  return (
    <FeatureContext.Provider value={contextValue}>
      {children}
    </FeatureContext.Provider>
  );
}

// =====================================================================================
// FEATURE HOOK
// =====================================================================================

/**
 * Hook to access feature flags in layout components
 * 
 * @returns Feature flag utilities and boolean flags for each feature
 * 
 * @example
 * ```tsx
 * const { hasOrders, hasLoyalty, hasMenu, hasFeature } = useFeatures();
 * 
 * return (
 *   <nav>
 *     {hasMenu && <MenuLink />}
 *     {hasOrders && <OrdersLink />}
 *     {hasLoyalty && <LoyaltyLink />}
 *   </nav>
 * );
 * ```
 */
export function useFeatures(): FeatureContextType {
  const context = useContext(FeatureContext);
  
  if (!context) {
    // Provide fallback for development/testing
    console.warn('useFeatures must be used within a FeatureProvider. Falling back to default features.');
    
    const defaultFeatures: Features = {
      orders: true,
      loyalty: false,
      menu: true,
    };
    
    return {
      features: defaultFeatures,
      hasFeature: (feature: FeatureName) => defaultFeatures[feature] ?? false,
      hasOrders: defaultFeatures.orders,
      hasLoyalty: defaultFeatures.loyalty,
      hasMenu: defaultFeatures.menu,
    };
  }
  
  return context;
}

// =====================================================================================
// FEATURE UTILITIES
// =====================================================================================

/**
 * Utility function to check if any features are enabled
 * 
 * @param features - Feature flags object
 * @returns True if at least one feature is enabled
 */
export function hasAnyFeatures(features: Features): boolean {
  return Object.values(features).some(Boolean);
}

/**
 * Utility function to get enabled feature names
 * 
 * @param features - Feature flags object
 * @returns Array of enabled feature names
 */
export function getEnabledFeatures(features: Features): FeatureName[] {
  return Object.entries(features)
    .filter(([, enabled]) => enabled)
    .map(([feature]) => feature as FeatureName);
}

/**
 * Navigation item interface for layout components
 */
export interface NavigationItem {
  name: string;
  href: string;
  icon?: string;
  feature?: FeatureName;
  roles?: string[];
}

/**
 * Filter navigation items based on enabled features and user role
 * 
 * @param items - Array of navigation items
 * @param features - Feature flags object
 * @param userRole - Current user role
 * @returns Filtered array of navigation items
 */
export function filterNavigationItems(
  items: NavigationItem[],
  features: Features,
  userRole?: string
): NavigationItem[] {
  return items.filter((item) => {
    // Check feature requirement
    if (item.feature && !features[item.feature]) {
      return false;
    }
    
    // Check role requirement
    if (item.roles && (!userRole || !item.roles.includes(userRole))) {
      return false;
    }
    
    return true;
  });
}