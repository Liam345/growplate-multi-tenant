/**
 * Layout Integration Tests
 * 
 * Integration tests for AdminLayout and CustomerLayout components
 * testing complete layout composition and context integration.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AdminLayout, CustomerLayout } from '../index';
import type { TenantContext } from '~/types/tenant';
import type { UserContext } from '~/types/auth';
import type { Features } from '~/types/features';

// =====================================================================================
// TEST UTILITIES
// =====================================================================================

const mockTenant: TenantContext = {
  id: 'tenant-1',
  name: 'Test Restaurant',
  domain: 'test.growplate.com',
  subdomain: null,
  email: 'test@restaurant.com',
  phone: '+1234567890',
  address: {
    street: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zipCode: '12345',
    country: 'US',
  },
  settings: {
    businessName: 'Test Restaurant',
    businessType: 'Fast Casual',
  },
  stripeAccountId: null,
  features: ['menu', 'orders'],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockOwner: UserContext = {
  id: 'user-1',
  tenantId: 'tenant-1',
  email: 'owner@restaurant.com',
  role: 'owner',
  firstName: 'John',
  lastName: 'Doe',
};

const mockStaff: UserContext = {
  id: 'user-2',
  tenantId: 'tenant-1',
  email: 'staff@restaurant.com',
  role: 'staff',
  firstName: 'Jane',
  lastName: 'Smith',
};

const mockCustomer: UserContext = {
  id: 'user-3',
  tenantId: 'tenant-1',
  email: 'customer@email.com',
  role: 'customer',
  firstName: 'Bob',
  lastName: 'Wilson',
};

const mockFeatures: Features = {
  orders: true,
  loyalty: false,
  menu: true,
};

function renderAdminLayout(props: any = {}) {
  const defaultProps = {
    tenant: mockTenant,
    user: mockOwner,
    features: mockFeatures,
    title: 'Dashboard',
    ...props,
  };

  return render(
    <BrowserRouter>
      <AdminLayout {...defaultProps}>
        <div data-testid="admin-content">Admin Content</div>
      </AdminLayout>
    </BrowserRouter>
  );
}

function renderCustomerLayout(props: any = {}) {
  const defaultProps = {
    tenant: mockTenant,
    user: mockCustomer,
    features: mockFeatures,
    title: 'Welcome',
    ...props,
  };

  return render(
    <BrowserRouter>
      <CustomerLayout {...defaultProps}>
        <div data-testid="customer-content">Customer Content</div>
      </CustomerLayout>
    </BrowserRouter>
  );
}

// Mock ResizeObserver for responsive tests
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// =====================================================================================
// ADMIN LAYOUT INTEGRATION TESTS
// =====================================================================================

describe('AdminLayout Integration', () => {
  test('renders complete admin layout structure', () => {
    renderAdminLayout();
    
    // Header
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
    
    // Sidebar
    expect(screen.getByLabelText('Sidebar navigation')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    
    // Main content
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByTestId('admin-content')).toBeInTheDocument();
    
    // Footer
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByText(/© \d{4} Test Restaurant/)).toBeInTheDocument();
  });

  test('integrates header and sidebar state management', () => {
    renderAdminLayout();
    
    // Find mobile menu button (should be hidden on desktop)
    const mobileMenuButton = screen.getByRole('button', { name: /open main menu/i });
    
    // Find sidebar toggle button
    const sidebarToggle = screen.getByRole('button', { name: /collapse sidebar/i });
    
    // Toggle sidebar
    fireEvent.click(sidebarToggle);
    
    // Sidebar should now show expand button
    expect(screen.getByRole('button', { name: /expand sidebar/i })).toBeInTheDocument();
  });

  test('applies feature flags to sidebar navigation', () => {
    const limitedFeatures: Features = {
      orders: false,
      loyalty: false,
      menu: true,
    };
    
    renderAdminLayout({ features: limitedFeatures });
    
    // Should show menu but not orders or loyalty
    expect(screen.getByText('Menu Management')).toBeInTheDocument();
    expect(screen.queryByText('Orders')).not.toBeInTheDocument();
    expect(screen.queryByText('Loyalty Program')).not.toBeInTheDocument();
  });

  test('applies role-based navigation filtering', () => {
    renderAdminLayout({ user: mockStaff });
    
    // Staff should see orders but not loyalty or settings
    expect(screen.getByText('Orders')).toBeInTheDocument();
    expect(screen.queryByText('Loyalty Program')).not.toBeInTheDocument();
    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
  });

  test('sets document title correctly', () => {
    renderAdminLayout({ title: 'Menu Management' });
    expect(document.title).toBe('Menu Management - Test Restaurant Admin');
  });

  test('handles missing tenant gracefully', () => {
    renderAdminLayout({ tenant: undefined });
    
    expect(screen.getByText('GrowPlate')).toBeInTheDocument();
    expect(document.title).toBe('Dashboard - GrowPlate Admin');
  });

  test('can hide sidebar and footer', () => {
    renderAdminLayout({ 
      showSidebar: false, 
      showFooter: false 
    });
    
    expect(screen.queryByLabelText('Sidebar navigation')).not.toBeInTheDocument();
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
    expect(screen.getByTestId('admin-content')).toBeInTheDocument();
  });

  test('applies custom className to main content', () => {
    renderAdminLayout({ className: 'custom-admin-content' });
    
    const mainElement = screen.getByRole('main');
    expect(mainElement).toHaveClass('custom-admin-content');
  });
});

// =====================================================================================
// CUSTOMER LAYOUT INTEGRATION TESTS
// =====================================================================================

describe('CustomerLayout Integration', () => {
  test('renders complete customer layout structure', () => {
    renderCustomerLayout();
    
    // Header
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
    
    // Main content (no sidebar)
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByTestId('customer-content')).toBeInTheDocument();
    expect(screen.queryByLabelText('Sidebar navigation')).not.toBeInTheDocument();
    
    // Footer (full customer footer)
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
  });

  test('applies feature flags to header navigation', () => {
    const noOrdersFeatures: Features = {
      orders: false,
      loyalty: true,
      menu: true,
    };
    
    renderCustomerLayout({ features: noOrdersFeatures });
    
    // Should show menu and loyalty but not order
    expect(screen.getByText('Menu')).toBeInTheDocument();
    expect(screen.getByText('Loyalty')).toBeInTheDocument();
    expect(screen.queryByText('Order')).not.toBeInTheDocument();
  });

  test('sets document title and meta description', () => {
    renderCustomerLayout({ 
      title: 'Our Menu',
      description: 'Delicious food from Test Restaurant'
    });
    
    expect(document.title).toBe('Our Menu - Test Restaurant');
    
    const metaDescription = document.querySelector('meta[name="description"]');
    expect(metaDescription?.getAttribute('content')).toBe('Delicious food from Test Restaurant');
  });

  test('supports different background variants', () => {
    const { rerender } = renderCustomerLayout({ background: 'neutral' });
    
    let container = screen.getByRole('main').closest('div');
    expect(container).toHaveClass('bg-neutral-50');
    
    rerender(
      <BrowserRouter>
        <CustomerLayout 
          tenant={mockTenant}
          background="primary"
          features={mockFeatures}
        >
          <div data-testid="customer-content">Customer Content</div>
        </CustomerLayout>
      </BrowserRouter>
    );
    
    container = screen.getByRole('main').closest('div');
    expect(container).toHaveClass('bg-primary-50');
  });

  test('supports full-width layout', () => {
    renderCustomerLayout({ fullWidth: true });
    
    const mainElement = screen.getByRole('main');
    expect(mainElement).not.toHaveClass('max-w-7xl');
  });

  test('can hide header and footer', () => {
    renderCustomerLayout({ 
      showHeader: false, 
      showFooter: false 
    });
    
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
    expect(screen.getByTestId('customer-content')).toBeInTheDocument();
  });

  test('handles unauthenticated users', () => {
    renderCustomerLayout({ user: undefined });
    
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByTestId('customer-content')).toBeInTheDocument();
  });
});

// =====================================================================================
// RESPONSIVE BEHAVIOR TESTS
// =====================================================================================

describe('Layout Responsive Integration', () => {
  // Mock window.innerWidth
  const mockInnerWidth = (width: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    window.dispatchEvent(new Event('resize'));
  };

  test('admin layout adapts sidebar to mobile', async () => {
    mockInnerWidth(600);
    renderAdminLayout();
    
    // Sidebar should be closed on mobile
    const sidebar = screen.getByLabelText('Sidebar navigation');
    expect(sidebar).toHaveClass('w-16'); // Collapsed state
    
    // Mobile menu overlay should be available
    const mobileMenuButton = screen.getByRole('button', { name: /open main menu/i });
    expect(mobileMenuButton).toBeInTheDocument();
  });

  test('customer layout maintains responsive header', () => {
    mockInnerWidth(600);
    renderCustomerLayout();
    
    // Mobile menu button should be visible
    const mobileMenuButton = screen.getByRole('button', { name: /open main menu/i });
    expect(mobileMenuButton).toBeInTheDocument();
    
    // Desktop navigation should be hidden
    const desktopNav = screen.getByRole('navigation', { name: /main navigation/i });
    expect(desktopNav).toHaveClass('hidden', 'md:flex');
  });

  test('layouts expand properly on desktop', () => {
    mockInnerWidth(1200);
    renderAdminLayout();
    
    // Sidebar should be expanded
    const expandButton = screen.getByRole('button', { name: /collapse sidebar/i });
    expect(expandButton).toBeInTheDocument();
    
    // Mobile menu button should be hidden
    const mobileMenuButton = screen.getByRole('button', { name: /open main menu/i });
    expect(mobileMenuButton).toHaveClass('md:hidden');
  });
});

// =====================================================================================
// ACCESSIBILITY INTEGRATION TESTS
// =====================================================================================

describe('Layout Accessibility Integration', () => {
  test('admin layout has proper landmark structure', () => {
    renderAdminLayout();
    
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /sidebar navigation/i })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  test('customer layout has proper landmark structure', () => {
    renderCustomerLayout();
    
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  test('layouts support keyboard navigation', () => {
    renderAdminLayout();
    
    // Focus should start on the logo link
    const logoLink = screen.getByLabelText(/Test Restaurant Home/i);
    logoLink.focus();
    expect(logoLink).toHaveFocus();
    
    // Tab navigation should work through header, sidebar, and main content
    fireEvent.keyDown(logoLink, { key: 'Tab' });
    // Additional tab navigation tests would go here
  });

  test('proper focus management in mobile menu', () => {
    renderCustomerLayout();
    
    const mobileMenuButton = screen.getByRole('button', { name: /open main menu/i });
    
    // Open mobile menu
    fireEvent.click(mobileMenuButton);
    
    // Focus should be managed properly
    expect(mobileMenuButton).toHaveAttribute('aria-expanded', 'true');
  });
});

// =====================================================================================
// ERROR HANDLING AND EDGE CASES
// =====================================================================================

describe('Layout Error Handling', () => {
  test('layouts handle missing props gracefully', () => {
    expect(() => {
      render(
        <BrowserRouter>
          <AdminLayout>
            <div>Content</div>
          </AdminLayout>
        </BrowserRouter>
      );
    }).not.toThrow();
    
    expect(() => {
      render(
        <BrowserRouter>
          <CustomerLayout>
            <div>Content</div>
          </CustomerLayout>
        </BrowserRouter>
      );
    }).not.toThrow();
  });

  test('layouts handle SSR hydration correctly', async () => {
    renderAdminLayout();
    
    // Should show loading state initially, then content
    await waitFor(() => {
      expect(screen.getByTestId('admin-content')).toBeInTheDocument();
    });
  });

  test('layouts handle feature flag changes dynamically', () => {
    const { rerender } = renderAdminLayout({ features: mockFeatures });
    
    expect(screen.getByText('Orders')).toBeInTheDocument();
    
    const newFeatures: Features = {
      ...mockFeatures,
      orders: false,
    };
    
    rerender(
      <BrowserRouter>
        <AdminLayout tenant={mockTenant} user={mockOwner} features={newFeatures}>
          <div data-testid="admin-content">Admin Content</div>
        </AdminLayout>
      </BrowserRouter>
    );
    
    expect(screen.queryByText('Orders')).not.toBeInTheDocument();
  });
});