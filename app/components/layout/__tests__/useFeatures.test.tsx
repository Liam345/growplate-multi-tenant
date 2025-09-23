/**
 * useFeatures Hook Tests
 * 
 * Comprehensive test suite for the useFeatures hook and FeatureProvider
 */

import { render, screen } from '@testing-library/react';
import { useFeatures, FeatureProvider, filterNavigationItems, hasAnyFeatures, getEnabledFeatures } from '~/hooks/useFeatures';
import type { Features, FeatureName } from '~/types/features';

// =====================================================================================
// TEST UTILITIES
// =====================================================================================

const mockFeatures: Features = {
  orders: true,
  loyalty: false,
  menu: true,
};

function TestComponent() {
  const { features, hasFeature, hasOrders, hasLoyalty, hasMenu } = useFeatures();
  
  return (
    <div>
      <div data-testid="features">{JSON.stringify(features)}</div>
      <div data-testid="has-orders">{hasOrders.toString()}</div>
      <div data-testid="has-loyalty">{hasLoyalty.toString()}</div>
      <div data-testid="has-menu">{hasMenu.toString()}</div>
      <div data-testid="has-feature-orders">{hasFeature('orders').toString()}</div>
      <div data-testid="has-feature-loyalty">{hasFeature('loyalty').toString()}</div>
    </div>
  );
}

function renderWithFeatures(features: Features) {
  return render(
    <FeatureProvider features={features}>
      <TestComponent />
    </FeatureProvider>
  );
}

// =====================================================================================
// FEATURE PROVIDER TESTS
// =====================================================================================

describe('FeatureProvider', () => {
  test('provides feature context to children', () => {
    renderWithFeatures(mockFeatures);
    
    expect(screen.getByTestId('features')).toHaveTextContent(
      JSON.stringify(mockFeatures)
    );
  });

  test('provides boolean flags for each feature', () => {
    renderWithFeatures(mockFeatures);
    
    expect(screen.getByTestId('has-orders')).toHaveTextContent('true');
    expect(screen.getByTestId('has-loyalty')).toHaveTextContent('false');
    expect(screen.getByTestId('has-menu')).toHaveTextContent('true');
  });

  test('provides hasFeature function', () => {
    renderWithFeatures(mockFeatures);
    
    expect(screen.getByTestId('has-feature-orders')).toHaveTextContent('true');
    expect(screen.getByTestId('has-feature-loyalty')).toHaveTextContent('false');
  });

  test('handles all features enabled', () => {
    const allEnabled: Features = {
      orders: true,
      loyalty: true,
      menu: true,
    };
    
    renderWithFeatures(allEnabled);
    
    expect(screen.getByTestId('has-orders')).toHaveTextContent('true');
    expect(screen.getByTestId('has-loyalty')).toHaveTextContent('true');
    expect(screen.getByTestId('has-menu')).toHaveTextContent('true');
  });

  test('handles all features disabled', () => {
    const allDisabled: Features = {
      orders: false,
      loyalty: false,
      menu: false,
    };
    
    renderWithFeatures(allDisabled);
    
    expect(screen.getByTestId('has-orders')).toHaveTextContent('false');
    expect(screen.getByTestId('has-loyalty')).toHaveTextContent('false');
    expect(screen.getByTestId('has-menu')).toHaveTextContent('false');
  });
});

// =====================================================================================
// USE FEATURES HOOK TESTS
// =====================================================================================

describe('useFeatures Hook', () => {
  test('returns feature context when inside provider', () => {
    renderWithFeatures(mockFeatures);
    
    expect(screen.getByTestId('features')).toHaveTextContent(
      JSON.stringify(mockFeatures)
    );
  });

  test('returns default features when outside provider', () => {
    // Suppress console warning for this test
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    render(<TestComponent />);
    
    // Should use default features
    expect(screen.getByTestId('has-orders')).toHaveTextContent('true');
    expect(screen.getByTestId('has-loyalty')).toHaveTextContent('false');
    expect(screen.getByTestId('has-menu')).toHaveTextContent('true');
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('useFeatures must be used within a FeatureProvider')
    );
    
    consoleSpy.mockRestore();
  });

  test('hasFeature function works correctly', () => {
    function HasFeatureTest() {
      const { hasFeature } = useFeatures();
      
      return (
        <div>
          <div data-testid="orders">{hasFeature('orders').toString()}</div>
          <div data-testid="loyalty">{hasFeature('loyalty').toString()}</div>
          <div data-testid="menu">{hasFeature('menu').toString()}</div>
        </div>
      );
    }
    
    render(
      <FeatureProvider features={mockFeatures}>
        <HasFeatureTest />
      </FeatureProvider>
    );
    
    expect(screen.getByTestId('orders')).toHaveTextContent('true');
    expect(screen.getByTestId('loyalty')).toHaveTextContent('false');
    expect(screen.getByTestId('menu')).toHaveTextContent('true');
  });

  test('boolean flags are computed correctly', () => {
    function BooleanFlagsTest() {
      const { hasOrders, hasLoyalty, hasMenu } = useFeatures();
      
      return (
        <div>
          <div data-testid="orders-flag">{hasOrders.toString()}</div>
          <div data-testid="loyalty-flag">{hasLoyalty.toString()}</div>
          <div data-testid="menu-flag">{hasMenu.toString()}</div>
        </div>
      );
    }
    
    render(
      <FeatureProvider features={mockFeatures}>
        <BooleanFlagsTest />
      </FeatureProvider>
    );
    
    expect(screen.getByTestId('orders-flag')).toHaveTextContent('true');
    expect(screen.getByTestId('loyalty-flag')).toHaveTextContent('false');
    expect(screen.getByTestId('menu-flag')).toHaveTextContent('true');
  });
});

// =====================================================================================
// UTILITY FUNCTION TESTS
// =====================================================================================

describe('Feature Utilities', () => {
  describe('hasAnyFeatures', () => {
    test('returns true when at least one feature is enabled', () => {
      expect(hasAnyFeatures(mockFeatures)).toBe(true);
    });

    test('returns false when no features are enabled', () => {
      const noFeatures: Features = {
        orders: false,
        loyalty: false,
        menu: false,
      };
      
      expect(hasAnyFeatures(noFeatures)).toBe(false);
    });

    test('returns true when all features are enabled', () => {
      const allFeatures: Features = {
        orders: true,
        loyalty: true,
        menu: true,
      };
      
      expect(hasAnyFeatures(allFeatures)).toBe(true);
    });
  });

  describe('getEnabledFeatures', () => {
    test('returns array of enabled feature names', () => {
      const enabled = getEnabledFeatures(mockFeatures);
      expect(enabled).toEqual(['orders', 'menu']);
      expect(enabled).not.toContain('loyalty');
    });

    test('returns empty array when no features are enabled', () => {
      const noFeatures: Features = {
        orders: false,
        loyalty: false,
        menu: false,
      };
      
      expect(getEnabledFeatures(noFeatures)).toEqual([]);
    });

    test('returns all features when all are enabled', () => {
      const allFeatures: Features = {
        orders: true,
        loyalty: true,
        menu: true,
      };
      
      const enabled = getEnabledFeatures(allFeatures);
      expect(enabled).toEqual(['orders', 'loyalty', 'menu']);
    });
  });

  describe('filterNavigationItems', () => {
    const navigationItems = [
      { name: 'Dashboard', href: '/admin' },
      { name: 'Menu', href: '/admin/menu', feature: 'menu' as FeatureName },
      { name: 'Orders', href: '/admin/orders', feature: 'orders' as FeatureName, roles: ['owner', 'staff'] },
      { name: 'Loyalty', href: '/admin/loyalty', feature: 'loyalty' as FeatureName, roles: ['owner'] },
      { name: 'Settings', href: '/admin/settings', roles: ['owner'] },
    ];

    test('filters items based on enabled features', () => {
      const filtered = filterNavigationItems(navigationItems, mockFeatures, 'owner');
      
      const names = filtered.map(item => item.name);
      expect(names).toContain('Dashboard');
      expect(names).toContain('Menu');
      expect(names).toContain('Orders');
      expect(names).not.toContain('Loyalty'); // loyalty is disabled
      expect(names).toContain('Settings');
    });

    test('filters items based on user role', () => {
      const allFeatures: Features = {
        orders: true,
        loyalty: true,
        menu: true,
      };
      
      const filtered = filterNavigationItems(navigationItems, allFeatures, 'staff');
      
      const names = filtered.map(item => item.name);
      expect(names).toContain('Dashboard');
      expect(names).toContain('Menu');
      expect(names).toContain('Orders');
      expect(names).not.toContain('Loyalty'); // requires owner role
      expect(names).not.toContain('Settings'); // requires owner role
    });

    test('filters items based on both features and role', () => {
      const partialFeatures: Features = {
        orders: true,
        loyalty: false,
        menu: true,
      };
      
      const filtered = filterNavigationItems(navigationItems, partialFeatures, 'staff');
      
      const names = filtered.map(item => item.name);
      expect(names).toContain('Dashboard');
      expect(names).toContain('Menu');
      expect(names).toContain('Orders');
      expect(names).not.toContain('Loyalty'); // disabled feature
      expect(names).not.toContain('Settings'); // requires owner role
    });

    test('includes items without feature or role requirements', () => {
      const noFeatures: Features = {
        orders: false,
        loyalty: false,
        menu: false,
      };
      
      const filtered = filterNavigationItems(navigationItems, noFeatures, 'customer');
      
      const names = filtered.map(item => item.name);
      expect(names).toContain('Dashboard'); // no requirements
      expect(names).not.toContain('Menu'); // feature disabled
      expect(names).not.toContain('Orders'); // feature disabled
      expect(names).not.toContain('Settings'); // role requirement not met
    });

    test('handles undefined user role', () => {
      const filtered = filterNavigationItems(navigationItems, mockFeatures, undefined);
      
      const names = filtered.map(item => item.name);
      expect(names).toContain('Dashboard');
      expect(names).toContain('Menu');
      expect(names).not.toContain('Orders'); // has role requirement
      expect(names).not.toContain('Settings'); // has role requirement
    });

    test('handles empty navigation items array', () => {
      const filtered = filterNavigationItems([], mockFeatures, 'owner');
      expect(filtered).toEqual([]);
    });

    test('preserves item properties in filtered results', () => {
      const filtered = filterNavigationItems(navigationItems, mockFeatures, 'owner');
      const menuItem = filtered.find(item => item.name === 'Menu');
      
      expect(menuItem).toEqual({
        name: 'Menu',
        href: '/admin/menu',
        feature: 'menu',
      });
    });
  });
});

// =====================================================================================
// EDGE CASES AND ERROR HANDLING
// =====================================================================================

describe('Feature System - Edge Cases', () => {
  test('handles malformed features object', () => {
    const malformedFeatures = {
      orders: true,
      loyalty: null,
      menu: undefined,
    } as any;
    
    function MalformedTest() {
      const { hasFeature } = useFeatures();
      return (
        <div data-testid="loyalty-null">{hasFeature('loyalty').toString()}</div>
      );
    }
    
    render(
      <FeatureProvider features={malformedFeatures}>
        <MalformedTest />
      </FeatureProvider>
    );
    
    // Should handle null/undefined as false
    expect(screen.getByTestId('loyalty-null')).toHaveTextContent('false');
  });

  test('handles invalid feature names gracefully', () => {
    function InvalidFeatureTest() {
      const { hasFeature } = useFeatures();
      // Testing invalid feature name - cast to bypass TypeScript
      return (
        <div data-testid="invalid">{hasFeature('invalid' as any).toString()}</div>
      );
    }
    
    renderWithFeatures(mockFeatures);
    
    // Should not throw and return false for unknown features
    expect(() => {
      render(
        <FeatureProvider features={mockFeatures}>
          <InvalidFeatureTest />
        </FeatureProvider>
      );
    }).not.toThrow();
  });

  test('provider can be nested without conflicts', () => {
    const outerFeatures: Features = { orders: true, loyalty: true, menu: true };
    const innerFeatures: Features = { orders: false, loyalty: false, menu: false };
    
    function NestedTest() {
      const outer = useFeatures();
      return (
        <div>
          <div data-testid="outer-orders">{outer.hasOrders.toString()}</div>
          <FeatureProvider features={innerFeatures}>
            <InnerTest />
          </FeatureProvider>
        </div>
      );
    }
    
    function InnerTest() {
      const inner = useFeatures();
      return (
        <div data-testid="inner-orders">{inner.hasOrders.toString()}</div>
      );
    }
    
    render(
      <FeatureProvider features={outerFeatures}>
        <NestedTest />
      </FeatureProvider>
    );
    
    expect(screen.getByTestId('outer-orders')).toHaveTextContent('true');
    expect(screen.getByTestId('inner-orders')).toHaveTextContent('false');
  });
});