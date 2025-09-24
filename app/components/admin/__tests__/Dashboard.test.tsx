/**
 * Dashboard Component Tests
 * 
 * Comprehensive test suite for the Dashboard component.
 * Tests data-driven feature configuration, analytics integration, and responsive design.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Dashboard, hasDashboardFeatures, getEnabledFeatureCount } from '~/components/admin/Dashboard';
import { FeatureProvider } from '~/hooks/useFeatures';
import { trackDashboardView, trackFeatureCardClick } from '~/lib/analytics';
import type { TenantContext } from '~/types/tenant';
import type { Features } from '~/types/features';

// =====================================================================================
// MOCKS
// =====================================================================================

// Mock analytics functions
jest.mock('~/lib/analytics', () => ({
  trackDashboardView: jest.fn(),
  trackFeatureCardClick: jest.fn(),
}));

const mockTrackDashboardView = trackDashboardView as jest.MockedFunction<typeof trackDashboardView>;
const mockTrackFeatureCardClick = trackFeatureCardClick as jest.MockedFunction<typeof trackFeatureCardClick>;

// =====================================================================================
// TEST UTILITIES
// =====================================================================================

const mockTenant: TenantContext = {
  id: 'tenant-1',
  name: 'Test Restaurant',
  domain: 'test-restaurant.com',
  subdomain: null,
  email: 'admin@test-restaurant.com',
  phone: '(555) 123-4567',
  address: {
    street: '123 Test St',
    city: 'Test City',
    state: 'CA',
    zipCode: '12345',
    country: 'US',
  },
  settings: {},
  stripeAccountId: null,
  features: ['orders', 'menu'],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockTenantSerialized = {
  ...mockTenant,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

function TestWrapper({ 
  children, 
  features 
}: { 
  children: React.ReactNode;
  features: Features;
}) {
  return (
    <BrowserRouter>
      <FeatureProvider features={features}>
        {children}
      </FeatureProvider>
    </BrowserRouter>
  );
}

// =====================================================================================
// DASHBOARD COMPONENT TESTS
// =====================================================================================

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders tenant header with correct information', () => {
      const features: Features = { orders: true, menu: true, loyalty: false };
      
      render(
        <TestWrapper features={features}>
          <Dashboard tenant={mockTenant} />
        </TestWrapper>
      );

      expect(screen.getByText('Welcome to Test Restaurant')).toBeInTheDocument();
      expect(screen.getByText('Manage your restaurant operations from this dashboard')).toBeInTheDocument();
      expect(screen.getByText('test-restaurant.com')).toBeInTheDocument();
      expect(screen.getByText('Test City, CA')).toBeInTheDocument();
    });

    test('renders without tenant information', () => {
      const features: Features = { orders: true, menu: true, loyalty: false };
      
      render(
        <TestWrapper features={features}>
          <Dashboard />
        </TestWrapper>
      );

      // Should not crash and should render feature cards
      expect(screen.getByText('Management Tools')).toBeInTheDocument();
    });

    test('renders with serialized tenant (from loader)', () => {
      const features: Features = { orders: true, menu: true, loyalty: false };
      
      render(
        <TestWrapper features={features}>
          <Dashboard tenant={mockTenantSerialized} />
        </TestWrapper>
      );

      expect(screen.getByText('Welcome to Test Restaurant')).toBeInTheDocument();
    });

    test('applies custom className', () => {
      const features: Features = { orders: true, menu: true, loyalty: false };
      
      const { container } = render(
        <TestWrapper features={features}>
          <Dashboard tenant={mockTenant} className="custom-dashboard-class" />
        </TestWrapper>
      );

      expect(container.firstChild).toHaveClass('custom-dashboard-class');
    });
  });

  describe('Feature-Conditional Rendering', () => {
    test('renders enabled feature cards using data-driven configuration', () => {
      const features: Features = { orders: true, menu: true, loyalty: false };
      
      render(
        <TestWrapper features={features}>
          <Dashboard tenant={mockTenant} />
        </TestWrapper>
      );

      expect(screen.getByText('Order Management')).toBeInTheDocument();
      expect(screen.getByText('Menu Management')).toBeInTheDocument();
      expect(screen.queryByText('Loyalty System')).not.toBeInTheDocument();
    });

    test('renders all features when all are enabled', () => {
      const features: Features = { orders: true, menu: true, loyalty: true };
      
      render(
        <TestWrapper features={features}>
          <Dashboard tenant={mockTenant} />
        </TestWrapper>
      );

      expect(screen.getByText('Order Management')).toBeInTheDocument();
      expect(screen.getByText('Menu Management')).toBeInTheDocument();
      expect(screen.getByText('Loyalty System')).toBeInTheDocument();
    });

    test('shows empty state when no features are enabled', () => {
      const features: Features = { orders: false, menu: false, loyalty: false };
      
      render(
        <TestWrapper features={features}>
          <Dashboard tenant={mockTenant} />
        </TestWrapper>
      );

      expect(screen.getByText('No Features Available')).toBeInTheDocument();
      expect(screen.getByText('No features are currently enabled for your restaurant.')).toBeInTheDocument();
    });

    test('renders only loyalty feature when only loyalty is enabled', () => {
      const features: Features = { orders: false, menu: false, loyalty: true };
      
      render(
        <TestWrapper features={features}>
          <Dashboard tenant={mockTenant} />
        </TestWrapper>
      );

      expect(screen.queryByText('Order Management')).not.toBeInTheDocument();
      expect(screen.queryByText('Menu Management')).not.toBeInTheDocument();
      expect(screen.getByText('Loyalty System')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    test('shows loading skeleton when loading prop is true', () => {
      const features: Features = { orders: true, menu: true, loyalty: false };
      
      render(
        <TestWrapper features={features}>
          <Dashboard tenant={mockTenant} loading={true} />
        </TestWrapper>
      );

      // Should show skeleton loaders
      const skeletons = screen.getAllByText('', { selector: '.animate-pulse' });
      expect(skeletons.length).toBeGreaterThan(0);
    });

    test('loading state has proper structure', () => {
      const features: Features = { orders: true, menu: true, loyalty: false };
      
      const { container } = render(
        <TestWrapper features={features}>
          <Dashboard tenant={mockTenant} loading={true} />
        </TestWrapper>
      );

      // Should have grid layout for skeleton cards
      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3');
    });
  });

  describe('Analytics Integration', () => {
    test('tracks dashboard view on mount with enabled features', async () => {
      const features: Features = { orders: true, menu: false, loyalty: true };
      
      render(
        <TestWrapper features={features}>
          <Dashboard tenant={mockTenant} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockTrackDashboardView).toHaveBeenCalledWith(
          mockTenant.id,
          ['orders', 'loyalty']
        );
      });
    });

    test('tracks dashboard view without tenant ID', async () => {
      const features: Features = { orders: true, menu: true, loyalty: false };
      
      render(
        <TestWrapper features={features}>
          <Dashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockTrackDashboardView).toHaveBeenCalledWith(
          undefined,
          ['orders', 'menu']
        );
      });
    });

    test('tracks dashboard view when no features are enabled', async () => {
      const features: Features = { orders: false, menu: false, loyalty: false };
      
      render(
        <TestWrapper features={features}>
          <Dashboard tenant={mockTenant} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockTrackDashboardView).toHaveBeenCalledWith(
          mockTenant.id,
          []
        );
      });
    });

    test('re-tracks when features change', async () => {
      const features: Features = { orders: true, menu: false, loyalty: false };
      
      const { rerender } = render(
        <TestWrapper features={features}>
          <Dashboard tenant={mockTenant} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockTrackDashboardView).toHaveBeenCalledWith(
          mockTenant.id,
          ['orders']
        );
      });

      // Change features
      const newFeatures: Features = { orders: true, menu: true, loyalty: false };
      
      rerender(
        <TestWrapper features={newFeatures}>
          <Dashboard tenant={mockTenant} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockTrackDashboardView).toHaveBeenCalledWith(
          mockTenant.id,
          ['orders', 'menu']
        );
      });
    });
  });

  describe('Data-Driven Configuration', () => {
    test('feature cards use configuration from centralized system', () => {
      const features: Features = { orders: true, menu: true, loyalty: true };
      
      render(
        <TestWrapper features={features}>
          <Dashboard tenant={mockTenant} />
        </TestWrapper>
      );

      // Check that cards use the exact configuration from features.ts
      expect(screen.getByText('Order Management')).toBeInTheDocument();
      expect(screen.getByText('Manage incoming orders, track status, and process payments')).toBeInTheDocument();
      
      expect(screen.getByText('Menu Management')).toBeInTheDocument();
      expect(screen.getByText('Create and manage menu items, categories, and pricing')).toBeInTheDocument();
      
      expect(screen.getByText('Loyalty System')).toBeInTheDocument();
      expect(screen.getByText('Configure rewards, view customer points, and manage loyalty programs')).toBeInTheDocument();
    });

    test('feature cards have correct navigation links', () => {
      const features: Features = { orders: true, menu: true, loyalty: true };
      
      render(
        <TestWrapper features={features}>
          <Dashboard tenant={mockTenant} />
        </TestWrapper>
      );

      expect(screen.getByLabelText('Navigate to Order Management')).toHaveAttribute('href', '/admin/orders');
      expect(screen.getByLabelText('Navigate to Menu Management')).toHaveAttribute('href', '/admin/menu');
      expect(screen.getByLabelText('Navigate to Loyalty System')).toHaveAttribute('href', '/admin/loyalty');
    });

    test('dynamic rendering scales with feature configuration', () => {
      // This test ensures that the Dashboard automatically adapts to feature configuration changes
      const features: Features = { orders: true, menu: true, loyalty: true };
      
      render(
        <TestWrapper features={features}>
          <Dashboard tenant={mockTenant} />
        </TestWrapper>
      );

      // Should render exactly 3 feature cards (based on current configuration)
      const featureCards = screen.getAllByLabelText(/Navigate to/);
      expect(featureCards).toHaveLength(3);
    });
  });

  describe('Quick Stats Section', () => {
    test('renders placeholder stats correctly', () => {
      const features: Features = { orders: true, menu: true, loyalty: false };
      
      render(
        <TestWrapper features={features}>
          <Dashboard tenant={mockTenant} />
        </TestWrapper>
      );

      expect(screen.getByText('Quick Overview')).toBeInTheDocument();
      expect(screen.getByText('Total Orders')).toBeInTheDocument();
      expect(screen.getByText('Revenue')).toBeInTheDocument();
      expect(screen.getByText('Menu Items')).toBeInTheDocument();
      expect(screen.getByText('Customers')).toBeInTheDocument();

      // Should show placeholder values
      const placeholders = screen.getAllByText('--');
      expect(placeholders).toHaveLength(4);
    });
  });

  describe('Development Notice', () => {
    test('renders development notice', () => {
      const features: Features = { orders: true, menu: true, loyalty: false };
      
      render(
        <TestWrapper features={features}>
          <Dashboard tenant={mockTenant} />
        </TestWrapper>
      );

      expect(screen.getByText('Development Mode')).toBeInTheDocument();
      expect(screen.getByText(/This dashboard shows only the features enabled/)).toBeInTheDocument();
    });
  });
});

// =====================================================================================
// UTILITY FUNCTION TESTS
// =====================================================================================

describe('Dashboard Utilities', () => {
  describe('hasDashboardFeatures', () => {
    test('returns true when features are enabled', () => {
      const features: Features = { orders: true, menu: false, loyalty: false };
      expect(hasDashboardFeatures(features)).toBe(true);
    });

    test('returns false when no features are enabled', () => {
      const features: Features = { orders: false, menu: false, loyalty: false };
      expect(hasDashboardFeatures(features)).toBe(false);
    });

    test('returns true when all features are enabled', () => {
      const features: Features = { orders: true, menu: true, loyalty: true };
      expect(hasDashboardFeatures(features)).toBe(true);
    });
  });

  describe('getEnabledFeatureCount', () => {
    test('returns correct count for partial features', () => {
      const features: Features = { orders: true, menu: false, loyalty: true };
      expect(getEnabledFeatureCount(features)).toBe(2);
    });

    test('returns zero when no features are enabled', () => {
      const features: Features = { orders: false, menu: false, loyalty: false };
      expect(getEnabledFeatureCount(features)).toBe(0);
    });

    test('returns correct count when all features are enabled', () => {
      const features: Features = { orders: true, menu: true, loyalty: true };
      expect(getEnabledFeatureCount(features)).toBe(3);
    });

    test('returns one when only one feature is enabled', () => {
      const features: Features = { orders: false, menu: true, loyalty: false };
      expect(getEnabledFeatureCount(features)).toBe(1);
    });
  });
});

// =====================================================================================
// INTEGRATION TESTS
// =====================================================================================

describe('Dashboard Integration', () => {
  test('complete dashboard renders correctly with all features', () => {
    const features: Features = { orders: true, menu: true, loyalty: true };
    
    render(
      <TestWrapper features={features}>
        <Dashboard tenant={mockTenant} />
      </TestWrapper>
    );

    // Tenant header
    expect(screen.getByText('Welcome to Test Restaurant')).toBeInTheDocument();
    
    // Feature cards
    expect(screen.getByText('Order Management')).toBeInTheDocument();
    expect(screen.getByText('Menu Management')).toBeInTheDocument();
    expect(screen.getByText('Loyalty System')).toBeInTheDocument();
    
    // Quick stats
    expect(screen.getByText('Quick Overview')).toBeInTheDocument();
    
    // Development notice
    expect(screen.getByText('Development Mode')).toBeInTheDocument();
  });

  test('dashboard adapts to feature changes dynamically', () => {
    const initialFeatures: Features = { orders: true, menu: false, loyalty: false };
    
    const { rerender } = render(
      <TestWrapper features={initialFeatures}>
        <Dashboard tenant={mockTenant} />
      </TestWrapper>
    );

    expect(screen.getByText('Order Management')).toBeInTheDocument();
    expect(screen.queryByText('Menu Management')).not.toBeInTheDocument();

    // Change features
    const updatedFeatures: Features = { orders: true, menu: true, loyalty: false };
    
    rerender(
      <TestWrapper features={updatedFeatures}>
        <Dashboard tenant={mockTenant} />
      </TestWrapper>
    );

    expect(screen.getByText('Order Management')).toBeInTheDocument();
    expect(screen.getByText('Menu Management')).toBeInTheDocument();
  });
});

// =====================================================================================
// REGRESSION TESTS
// =====================================================================================

describe('Dashboard Regression Tests', () => {
  test('data-driven configuration does not break existing functionality', () => {
    const features: Features = { orders: true, menu: true, loyalty: false };
    
    render(
      <TestWrapper features={features}>
        <Dashboard tenant={mockTenant} />
      </TestWrapper>
    );

    // All original functionality should still work
    expect(screen.getByText('Management Tools')).toBeInTheDocument();
    expect(screen.getByText('Order Management')).toBeInTheDocument();
    expect(screen.getByText('Menu Management')).toBeInTheDocument();
    expect(screen.queryByText('Loyalty System')).not.toBeInTheDocument();
  });

  test('analytics integration works with new configuration system', async () => {
    const features: Features = { orders: true, menu: false, loyalty: true };
    
    render(
      <TestWrapper features={features}>
        <Dashboard tenant={mockTenant} />
      </TestWrapper>
    );

    // Analytics should track the correct enabled features
    await waitFor(() => {
      expect(mockTrackDashboardView).toHaveBeenCalledWith(
        mockTenant.id,
        ['orders', 'loyalty']
      );
    });
  });

  test('tenant serialization handling works correctly', () => {
    const features: Features = { orders: true, menu: true, loyalty: false };
    
    // Should not crash with serialized dates
    expect(() => {
      render(
        <TestWrapper features={features}>
          <Dashboard tenant={mockTenantSerialized} />
        </TestWrapper>
      );
    }).not.toThrow();

    expect(screen.getByText('Welcome to Test Restaurant')).toBeInTheDocument();
  });
});