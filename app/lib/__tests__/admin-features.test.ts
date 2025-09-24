/**
 * Admin Features Configuration Tests
 * 
 * Comprehensive test suite for the data-driven feature configuration system.
 * Tests feature filtering, role-based access, and utility functions.
 */

import { ShoppingCart, Menu, Star } from 'lucide-react';
import {
  ADMIN_FEATURES,
  getEnabledFeatures,
  getFeatureConfig,
  getAllAnalyticsEvents,
  featureRequiresRole,
  getFeaturesForRole,
  getFeaturesByCategory,
  FEATURE_CATEGORIES,
  FEATURE_CATEGORY_MAP,
} from '~/lib/admin/features';
import type { FeatureName } from '~/types/features';

// =====================================================================================
// FEATURE CONFIGURATION TESTS
// =====================================================================================

describe('Admin Features Configuration', () => {
  describe('ADMIN_FEATURES array', () => {
    test('contains all required features', () => {
      expect(ADMIN_FEATURES).toHaveLength(3);
      
      const featureKeys = ADMIN_FEATURES.map(f => f.key);
      expect(featureKeys).toContain('orders');
      expect(featureKeys).toContain('menu');
      expect(featureKeys).toContain('loyalty');
    });

    test('each feature has required properties', () => {
      ADMIN_FEATURES.forEach(feature => {
        expect(feature).toHaveProperty('key');
        expect(feature).toHaveProperty('icon');
        expect(feature).toHaveProperty('title');
        expect(feature).toHaveProperty('description');
        expect(feature).toHaveProperty('href');
        expect(feature).toHaveProperty('analyticsEvent');
        
        // Check types
        expect(typeof feature.key).toBe('string');
        expect(typeof feature.icon).toBe('object'); // Lucide icon is an object with displayName
        expect(typeof feature.title).toBe('string');
        expect(typeof feature.description).toBe('string');
        expect(typeof feature.href).toBe('string');
        expect(typeof feature.analyticsEvent).toBe('string');
      });
    });

    test('feature keys are valid FeatureName types', () => {
      const validFeatureNames: FeatureName[] = ['orders', 'menu', 'loyalty'];
      
      ADMIN_FEATURES.forEach(feature => {
        expect(validFeatureNames).toContain(feature.key);
      });
    });

    test('feature hrefs follow expected pattern', () => {
      ADMIN_FEATURES.forEach(feature => {
        expect(feature.href).toMatch(/^\/admin\/[a-z]+$/);
        expect(feature.href).toBe(`/admin/${feature.key}`);
      });
    });

    test('analytics events follow naming convention', () => {
      ADMIN_FEATURES.forEach(feature => {
        expect(feature.analyticsEvent).toMatch(/^[a-z_]+_accessed$/);
      });
    });

    test('icons are valid Lucide React components', () => {
      const expectedIcons = [ShoppingCart, Menu, Star];
      
      ADMIN_FEATURES.forEach(feature => {
        expect(expectedIcons).toContain(feature.icon);
      });
    });

    test('specific feature configurations are correct', () => {
      const ordersFeature = ADMIN_FEATURES.find(f => f.key === 'orders');
      expect(ordersFeature).toEqual({
        key: 'orders',
        icon: ShoppingCart,
        title: 'Order Management',
        description: 'Manage incoming orders, track status, and process payments',
        href: '/admin/orders',
        analyticsEvent: 'order_management_accessed',
        roles: ['owner', 'staff'],
      });

      const menuFeature = ADMIN_FEATURES.find(f => f.key === 'menu');
      expect(menuFeature).toEqual({
        key: 'menu',
        icon: Menu,
        title: 'Menu Management',
        description: 'Create and manage menu items, categories, and pricing',
        href: '/admin/menu',
        analyticsEvent: 'menu_management_accessed',
        roles: ['owner', 'staff'],
      });

      const loyaltyFeature = ADMIN_FEATURES.find(f => f.key === 'loyalty');
      expect(loyaltyFeature).toEqual({
        key: 'loyalty',
        icon: Star,
        title: 'Loyalty System',
        description: 'Configure rewards, view customer points, and manage loyalty programs',
        href: '/admin/loyalty',
        analyticsEvent: 'loyalty_system_accessed',
        roles: ['owner'],
        badge: 'Pro',
      });
    });
  });

  describe('Feature roles and access control', () => {
    test('orders and menu allow both owner and staff access', () => {
      const ordersFeature = ADMIN_FEATURES.find(f => f.key === 'orders');
      const menuFeature = ADMIN_FEATURES.find(f => f.key === 'menu');
      
      expect(ordersFeature?.roles).toEqual(['owner', 'staff']);
      expect(menuFeature?.roles).toEqual(['owner', 'staff']);
    });

    test('loyalty requires owner role only', () => {
      const loyaltyFeature = ADMIN_FEATURES.find(f => f.key === 'loyalty');
      
      expect(loyaltyFeature?.roles).toEqual(['owner']);
    });

    test('loyalty feature has Pro badge', () => {
      const loyaltyFeature = ADMIN_FEATURES.find(f => f.key === 'loyalty');
      
      expect(loyaltyFeature?.badge).toBe('Pro');
    });
  });
});

// =====================================================================================
// GET ENABLED FEATURES TESTS
// =====================================================================================

describe('getEnabledFeatures', () => {
  test('returns enabled features with owner role', () => {
    const features = { orders: true, menu: false, loyalty: true };
    const enabled = getEnabledFeatures(features, 'owner');
    
    expect(enabled).toHaveLength(2);
    expect(enabled.map(f => f.key)).toEqual(['orders', 'loyalty']);
  });

  test('returns empty array when no features are enabled', () => {
    const features = { orders: false, menu: false, loyalty: false };
    const enabled = getEnabledFeatures(features);
    
    expect(enabled).toEqual([]);
  });

  test('returns all features when all are enabled and user is owner', () => {
    const features = { orders: true, menu: true, loyalty: true };
    const enabled = getEnabledFeatures(features, 'owner');
    
    expect(enabled).toHaveLength(3);
    expect(enabled.map(f => f.key)).toEqual(['orders', 'menu', 'loyalty']);
  });

  test('filters features by user role', () => {
    const features = { orders: true, menu: true, loyalty: true };
    const enabled = getEnabledFeatures(features, 'staff');
    
    expect(enabled).toHaveLength(2);
    expect(enabled.map(f => f.key)).toEqual(['orders', 'menu']);
    expect(enabled.map(f => f.key)).not.toContain('loyalty');
  });

  test('filters features by both flags and role', () => {
    const features = { orders: true, menu: false, loyalty: true };
    const enabled = getEnabledFeatures(features, 'staff');
    
    expect(enabled).toHaveLength(1);
    expect(enabled.map(f => f.key)).toEqual(['orders']);
  });

  test('handles unknown user role', () => {
    const features = { orders: true, menu: true, loyalty: true };
    const enabled = getEnabledFeatures(features, 'customer');
    
    // Customer role should not have access to any features
    expect(enabled).toHaveLength(0);
  });

  test('handles undefined user role', () => {
    const features = { orders: true, menu: true, loyalty: true };
    const enabled = getEnabledFeatures(features, undefined);
    
    // Without role, should not have access to role-protected features
    expect(enabled).toHaveLength(0);
  });

  test('returns complete feature configurations', () => {
    const features = { orders: true, menu: false, loyalty: false };
    const enabled = getEnabledFeatures(features, 'owner');
    
    expect(enabled).toHaveLength(1);
    const ordersConfig = enabled[0];
    
    expect(ordersConfig.key).toBe('orders');
    expect(ordersConfig.title).toBe('Order Management');
    expect(ordersConfig.icon).toBe(ShoppingCart);
    expect(ordersConfig.href).toBe('/admin/orders');
    expect(ordersConfig.analyticsEvent).toBe('order_management_accessed');
  });
});

// =====================================================================================
// UTILITY FUNCTION TESTS
// =====================================================================================

describe('Feature Utility Functions', () => {
  describe('getFeatureConfig', () => {
    test('returns correct feature configuration', () => {
      const ordersConfig = getFeatureConfig('orders');
      
      expect(ordersConfig).toBeDefined();
      expect(ordersConfig?.key).toBe('orders');
      expect(ordersConfig?.title).toBe('Order Management');
      expect(ordersConfig?.icon).toBe(ShoppingCart);
    });

    test('returns undefined for non-existent feature', () => {
      const config = getFeatureConfig('non_existent' as FeatureName);
      
      expect(config).toBeUndefined();
    });

    test('returns configurations for all valid features', () => {
      const validFeatures: FeatureName[] = ['orders', 'menu', 'loyalty'];
      
      validFeatures.forEach(feature => {
        const config = getFeatureConfig(feature);
        expect(config).toBeDefined();
        expect(config?.key).toBe(feature);
      });
    });
  });

  describe('getAllAnalyticsEvents', () => {
    test('returns all analytics event names', () => {
      const events = getAllAnalyticsEvents();
      
      expect(events).toHaveLength(3);
      expect(events).toContain('order_management_accessed');
      expect(events).toContain('menu_management_accessed');
      expect(events).toContain('loyalty_system_accessed');
    });

    test('returns unique event names', () => {
      const events = getAllAnalyticsEvents();
      const uniqueEvents = [...new Set(events)];
      
      expect(events).toEqual(uniqueEvents);
    });

    test('all events follow naming convention', () => {
      const events = getAllAnalyticsEvents();
      
      events.forEach(event => {
        expect(event).toMatch(/^[a-z_]+_accessed$/);
      });
    });
  });

  describe('featureRequiresRole', () => {
    test('returns true for features with role requirements', () => {
      expect(featureRequiresRole('orders')).toBe(true);
      expect(featureRequiresRole('menu')).toBe(true);
      expect(featureRequiresRole('loyalty')).toBe(true);
    });

    test('returns false for non-existent features', () => {
      expect(featureRequiresRole('non_existent' as FeatureName)).toBe(false);
    });

    test('correctly identifies role requirements', () => {
      const ordersRequiresRole = featureRequiresRole('orders');
      const menuRequiresRole = featureRequiresRole('menu');
      const loyaltyRequiresRole = featureRequiresRole('loyalty');
      
      expect(ordersRequiresRole).toBe(true);
      expect(menuRequiresRole).toBe(true);
      expect(loyaltyRequiresRole).toBe(true);
    });
  });

  describe('getFeaturesForRole', () => {
    test('returns correct features for owner role', () => {
      const ownerFeatures = getFeaturesForRole('owner');
      
      expect(ownerFeatures).toHaveLength(3);
      expect(ownerFeatures).toContain('orders');
      expect(ownerFeatures).toContain('menu');
      expect(ownerFeatures).toContain('loyalty');
    });

    test('returns correct features for staff role', () => {
      const staffFeatures = getFeaturesForRole('staff');
      
      expect(staffFeatures).toHaveLength(2);
      expect(staffFeatures).toContain('orders');
      expect(staffFeatures).toContain('menu');
      expect(staffFeatures).not.toContain('loyalty');
    });

    test('returns empty array for unknown role', () => {
      const customerFeatures = getFeaturesForRole('customer');
      
      expect(customerFeatures).toEqual([]);
    });

    test('returns empty array for undefined role', () => {
      const undefinedFeatures = getFeaturesForRole('');
      
      expect(undefinedFeatures).toEqual([]);
    });
  });
});

// =====================================================================================
// FEATURE CATEGORIES TESTS
// =====================================================================================

describe('Feature Categories', () => {
  describe('FEATURE_CATEGORIES constants', () => {
    test('contains all category constants', () => {
      expect(FEATURE_CATEGORIES.OPERATIONS).toBe('operations');
      expect(FEATURE_CATEGORIES.CONTENT).toBe('content');
      expect(FEATURE_CATEGORIES.ANALYTICS).toBe('analytics');
      expect(FEATURE_CATEGORIES.SETTINGS).toBe('settings');
    });

    test('category values are strings', () => {
      Object.values(FEATURE_CATEGORIES).forEach(category => {
        expect(typeof category).toBe('string');
        expect(category.length).toBeGreaterThan(0);
      });
    });
  });

  describe('FEATURE_CATEGORY_MAP', () => {
    test('maps all features to categories', () => {
      expect(FEATURE_CATEGORY_MAP.orders).toBe('operations');
      expect(FEATURE_CATEGORY_MAP.menu).toBe('content');
      expect(FEATURE_CATEGORY_MAP.loyalty).toBe('analytics');
    });

    test('all features have category mappings', () => {
      const featureKeys = ADMIN_FEATURES.map(f => f.key);
      
      featureKeys.forEach(key => {
        expect(FEATURE_CATEGORY_MAP).toHaveProperty(key);
        expect(typeof FEATURE_CATEGORY_MAP[key]).toBe('string');
      });
    });

    test('categories use valid constants', () => {
      const validCategories = Object.values(FEATURE_CATEGORIES);
      
      Object.values(FEATURE_CATEGORY_MAP).forEach(category => {
        expect(validCategories).toContain(category);
      });
    });
  });

  describe('getFeaturesByCategory', () => {
    test('returns features in operations category', () => {
      const operationsFeatures = getFeaturesByCategory(FEATURE_CATEGORIES.OPERATIONS);
      
      expect(operationsFeatures).toHaveLength(1);
      expect(operationsFeatures[0].key).toBe('orders');
    });

    test('returns features in content category', () => {
      const contentFeatures = getFeaturesByCategory(FEATURE_CATEGORIES.CONTENT);
      
      expect(contentFeatures).toHaveLength(1);
      expect(contentFeatures[0].key).toBe('menu');
    });

    test('returns features in analytics category', () => {
      const analyticsFeatures = getFeaturesByCategory(FEATURE_CATEGORIES.ANALYTICS);
      
      expect(analyticsFeatures).toHaveLength(1);
      expect(analyticsFeatures[0].key).toBe('loyalty');
    });

    test('returns empty array for category with no features', () => {
      const settingsFeatures = getFeaturesByCategory(FEATURE_CATEGORIES.SETTINGS);
      
      expect(settingsFeatures).toEqual([]);
    });

    test('returns empty array for non-existent category', () => {
      const nonExistentFeatures = getFeaturesByCategory('non_existent_category');
      
      expect(nonExistentFeatures).toEqual([]);
    });

    test('returns complete feature configurations', () => {
      const operationsFeatures = getFeaturesByCategory(FEATURE_CATEGORIES.OPERATIONS);
      
      expect(operationsFeatures).toHaveLength(1);
      const ordersFeature = operationsFeatures[0];
      
      expect(ordersFeature.key).toBe('orders');
      expect(ordersFeature.title).toBe('Order Management');
      expect(ordersFeature.icon).toBe(ShoppingCart);
      expect(ordersFeature.href).toBe('/admin/orders');
    });
  });
});

// =====================================================================================
// INTEGRATION TESTS
// =====================================================================================

describe('Feature Configuration Integration', () => {
  test('all features work together in filtering workflow', () => {
    const features = { orders: true, menu: true, loyalty: true };
    
    // Get enabled features for owner
    const ownerFeatures = getEnabledFeatures(features, 'owner');
    expect(ownerFeatures).toHaveLength(3);
    
    // Get enabled features for staff
    const staffFeatures = getEnabledFeatures(features, 'staff');
    expect(staffFeatures).toHaveLength(2);
    
    // Verify analytics events are available
    const events = getAllAnalyticsEvents();
    ownerFeatures.forEach(feature => {
      expect(events).toContain(feature.analyticsEvent);
    });
  });

  test('feature configurations support complete dashboard workflow', () => {
    const features = { orders: true, menu: false, loyalty: true };
    const userRole = 'staff';
    
    // Get enabled features
    const enabledFeatures = getEnabledFeatures(features, userRole);
    
    // Should only get orders (loyalty is owner-only)
    expect(enabledFeatures).toHaveLength(1);
    expect(enabledFeatures[0].key).toBe('orders');
    
    // Feature should have all required properties for rendering
    const feature = enabledFeatures[0];
    expect(feature.title).toBeTruthy();
    expect(feature.description).toBeTruthy();
    expect(feature.href).toBeTruthy();
    expect(feature.icon).toBeTruthy();
    expect(feature.analyticsEvent).toBeTruthy();
  });

  test('role-based access control works correctly', () => {
    const features = { orders: true, menu: true, loyalty: true };
    
    // Owner should have access to all features
    const ownerAccess = getFeaturesForRole('owner');
    expect(ownerAccess).toEqual(['orders', 'menu', 'loyalty']);
    
    // Staff should not have access to loyalty
    const staffAccess = getFeaturesForRole('staff');
    expect(staffAccess).toEqual(['orders', 'menu']);
    
    // Unknown role should have no access
    const customerAccess = getFeaturesForRole('customer');
    expect(customerAccess).toEqual([]);
  });

  test('category organization supports future extensibility', () => {
    // All current features should be categorized
    const allFeatures = ADMIN_FEATURES.map(f => f.key);
    const categorizedFeatures = Object.keys(FEATURE_CATEGORY_MAP);
    
    expect(allFeatures.sort()).toEqual(categorizedFeatures.sort());
    
    // Should be able to get features by each used category
    const usedCategories = [...new Set(Object.values(FEATURE_CATEGORY_MAP))];
    
    usedCategories.forEach(category => {
      const featuresInCategory = getFeaturesByCategory(category);
      expect(featuresInCategory.length).toBeGreaterThan(0);
    });
  });
});

// =====================================================================================
// REGRESSION TESTS
// =====================================================================================

describe('Feature Configuration Regression Tests', () => {
  test('maintains backward compatibility with Dashboard component', () => {
    const features = { orders: true, menu: true, loyalty: false };
    const enabled = getEnabledFeatures(features, 'owner');
    
    // Should return array of objects with required properties
    expect(Array.isArray(enabled)).toBe(true);
    
    enabled.forEach(feature => {
      expect(feature).toHaveProperty('key');
      expect(feature).toHaveProperty('icon');
      expect(feature).toHaveProperty('title');
      expect(feature).toHaveProperty('description');
      expect(feature).toHaveProperty('href');
    });
  });

  test('data-driven approach does not break existing functionality', () => {
    // Previous hardcoded approach would show these features
    const expectedFeatures = ['orders', 'menu', 'loyalty'];
    const configuredFeatures = ADMIN_FEATURES.map(f => f.key);
    
    expect(configuredFeatures.sort()).toEqual(expectedFeatures.sort());
  });

  test('analytics integration remains consistent', () => {
    const events = getAllAnalyticsEvents();
    
    // Should have expected analytics events
    expect(events).toContain('order_management_accessed');
    expect(events).toContain('menu_management_accessed');
    expect(events).toContain('loyalty_system_accessed');
  });

  test('role filtering maintains security expectations', () => {
    const features = { orders: true, menu: true, loyalty: true };
    
    // Staff should not see loyalty (security requirement)
    const staffFeatures = getEnabledFeatures(features, 'staff');
    expect(staffFeatures.map(f => f.key)).not.toContain('loyalty');
    
    // Owner should see all features
    const ownerFeatures = getEnabledFeatures(features, 'owner');
    expect(ownerFeatures.map(f => f.key)).toContain('loyalty');
  });
});