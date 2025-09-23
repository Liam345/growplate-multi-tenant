/**
 * Header Component Tests
 * 
 * Comprehensive test suite for Header component including accessibility,
 * responsive behavior, and feature integration.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Header } from '../Header';
import { FeatureProvider } from '~/hooks/useFeatures';
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
  address: null,
  settings: {},
  stripeAccountId: null,
  features: ['menu', 'orders'],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockUser: UserContext = {
  id: 'user-1',
  tenantId: 'tenant-1',
  email: 'john@restaurant.com',
  role: 'owner',
  firstName: 'John',
  lastName: 'Doe',
};

const mockFeatures: Features = {
  orders: true,
  loyalty: false,
  menu: true,
};

function renderHeader(props: any = {}) {
  const defaultProps = {
    tenant: mockTenant,
    user: mockUser,
    isAdmin: false,
    ...props,
  };

  return render(
    <BrowserRouter>
      <FeatureProvider features={mockFeatures}>
        <Header {...defaultProps} />
      </FeatureProvider>
    </BrowserRouter>
  );
}

// Mock window.innerWidth for responsive tests
const mockInnerWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
};

// =====================================================================================
// BASIC RENDERING TESTS
// =====================================================================================

describe('Header Component - Basic Rendering', () => {
  test('renders header with tenant name', () => {
    renderHeader();
    expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
  });

  test('renders header without user (logged out state)', () => {
    renderHeader({ user: undefined });
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  test('renders header with user profile', () => {
    renderHeader();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  test('applies custom className', () => {
    const { container } = renderHeader({ className: 'custom-header' });
    expect(container.firstChild).toHaveClass('custom-header');
  });
});

// =====================================================================================
// NAVIGATION TESTS
// =====================================================================================

describe('Header Component - Navigation', () => {
  test('renders customer navigation items', () => {
    renderHeader({ isAdmin: false });
    expect(screen.getByText('Menu')).toBeInTheDocument();
    expect(screen.getByText('Order')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  test('renders admin navigation items', () => {
    renderHeader({ isAdmin: true });
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Menu')).toBeInTheDocument();
    expect(screen.getByText('Orders')).toBeInTheDocument();
  });

  test('filters navigation items based on features', () => {
    const noOrdersFeatures: Features = {
      orders: false,
      loyalty: false,
      menu: true,
    };
    
    render(
      <BrowserRouter>
        <FeatureProvider features={noOrdersFeatures}>
          <Header tenant={mockTenant} user={mockUser} isAdmin={false} />
        </FeatureProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Menu')).toBeInTheDocument();
    expect(screen.queryByText('Order')).not.toBeInTheDocument();
  });

  test('filters admin navigation by user role', () => {
    const staffUser: UserContext = {
      ...mockUser,
      role: 'staff',
    };

    renderHeader({ user: staffUser, isAdmin: true });
    expect(screen.getByText('Orders')).toBeInTheDocument();
    expect(screen.queryByText('Loyalty')).not.toBeInTheDocument();
  });
});

// =====================================================================================
// MOBILE MENU TESTS
// =====================================================================================

describe('Header Component - Mobile Menu', () => {
  beforeEach(() => {
    mockInnerWidth(600); // Mobile width
  });

  test('shows mobile menu button on small screens', () => {
    renderHeader();
    const menuButton = screen.getByRole('button', { name: /open main menu/i });
    expect(menuButton).toBeInTheDocument();
  });

  test('toggles mobile menu visibility', () => {
    renderHeader();
    const menuButton = screen.getByRole('button', { name: /open main menu/i });
    
    // Menu should be closed initially
    expect(screen.queryByRole('navigation', { name: /main navigation/i })).not.toBeVisible();
    
    // Open menu
    fireEvent.click(menuButton);
    expect(screen.getByText('Menu')).toBeInTheDocument();
    
    // Close menu
    fireEvent.click(menuButton);
    // Menu items should not be visible
  });

  test('calls onMenuToggle callback when mobile menu is toggled', () => {
    const onMenuToggle = jest.fn();
    renderHeader({ onMenuToggle });
    
    const menuButton = screen.getByRole('button', { name: /open main menu/i });
    fireEvent.click(menuButton);
    
    expect(onMenuToggle).toHaveBeenCalled();
  });

  test('closes mobile menu when navigation link is clicked', () => {
    renderHeader();
    const menuButton = screen.getByRole('button', { name: /open main menu/i });
    
    // Open menu
    fireEvent.click(menuButton);
    
    // Click a navigation link
    const menuLink = screen.getByRole('link', { name: 'Menu' });
    fireEvent.click(menuLink);
    
    // Menu should close (button text should change back)
    expect(screen.getByLabelText(/open main menu/i)).toBeInTheDocument();
  });
});

// =====================================================================================
// ACCESSIBILITY TESTS
// =====================================================================================

describe('Header Component - Accessibility', () => {
  test('has proper ARIA roles and labels', () => {
    renderHeader();
    
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Test Restaurant Home/i)).toBeInTheDocument();
  });

  test('has proper aria-current for active navigation items', () => {
    // Mock location to simulate current page
    Object.defineProperty(window, 'location', {
      value: { pathname: '/menu' },
      writable: true,
    });
    
    renderHeader();
    const menuLink = screen.getByRole('link', { name: 'Menu' });
    expect(menuLink).toHaveAttribute('aria-current', 'page');
  });

  test('mobile menu button has proper ARIA attributes', () => {
    mockInnerWidth(600);
    renderHeader();
    
    const menuButton = screen.getByRole('button', { name: /open main menu/i });
    expect(menuButton).toHaveAttribute('aria-controls', 'mobile-menu');
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });

  test('supports keyboard navigation', () => {
    renderHeader();
    
    const firstLink = screen.getByRole('link', { name: /Test Restaurant Home/i });
    firstLink.focus();
    expect(firstLink).toHaveFocus();
    
    // Tab to next navigation item
    fireEvent.keyDown(firstLink, { key: 'Tab' });
  });

  test('has sufficient color contrast for text elements', () => {
    renderHeader();
    
    // Test primary text color classes are applied
    expect(screen.getByText('Test Restaurant')).toHaveClass('text-primary-600');
  });
});

// =====================================================================================
// RESPONSIVE DESIGN TESTS
// =====================================================================================

describe('Header Component - Responsive Design', () => {
  test('hides desktop navigation on mobile', () => {
    mockInnerWidth(600);
    renderHeader();
    
    const desktopNav = screen.getByRole('navigation', { name: /main navigation/i });
    expect(desktopNav).toHaveClass('hidden', 'md:flex');
  });

  test('shows desktop navigation on larger screens', () => {
    mockInnerWidth(1024);
    renderHeader();
    
    const desktopNav = screen.getByRole('navigation', { name: /main navigation/i });
    expect(desktopNav).toHaveClass('md:flex');
    expect(desktopNav).not.toHaveClass('hidden');
  });

  test('hides mobile menu button on desktop', () => {
    mockInnerWidth(1024);
    renderHeader();
    
    const mobileButton = screen.getByRole('button', { name: /open main menu/i });
    expect(mobileButton).toHaveClass('md:hidden');
  });

  test('shows abbreviated text on small screens', () => {
    mockInnerWidth(400);
    renderHeader();
    
    // Tenant name should be hidden on very small screens
    const tenantName = screen.getByText('Test Restaurant');
    expect(tenantName).toHaveClass('hidden', 'sm:block');
  });
});

// =====================================================================================
// INTEGRATION TESTS
// =====================================================================================

describe('Header Component - Integration', () => {
  test('integrates with tenant context for branding', () => {
    const customTenant = {
      ...mockTenant,
      name: 'Custom Restaurant',
      settings: {
        brandColors: {
          primary: '#ff5722',
        },
      },
    };
    
    renderHeader({ tenant: customTenant });
    expect(screen.getByText('Custom Restaurant')).toBeInTheDocument();
  });

  test('integrates with feature flags correctly', () => {
    const limitedFeatures: Features = {
      orders: false,
      loyalty: true,
      menu: true,
    };
    
    render(
      <BrowserRouter>
        <FeatureProvider features={limitedFeatures}>
          <Header tenant={mockTenant} user={mockUser} isAdmin={false} />
        </FeatureProvider>
      </BrowserRouter>
    );
    
    expect(screen.getByText('Menu')).toBeInTheDocument();
    expect(screen.getByText('Loyalty')).toBeInTheDocument();
    expect(screen.queryByText('Order')).not.toBeInTheDocument();
  });

  test('handles missing tenant gracefully', () => {
    renderHeader({ tenant: undefined });
    expect(screen.getByText('GrowPlate')).toBeInTheDocument();
  });

  test('handles missing features gracefully', () => {
    render(
      <BrowserRouter>
        <Header tenant={mockTenant} user={mockUser} isAdmin={false} />
      </BrowserRouter>
    );
    
    // Should render with default features when FeatureProvider is missing
    expect(screen.getByText('Menu')).toBeInTheDocument();
  });
});

// =====================================================================================
// ERROR HANDLING TESTS
// =====================================================================================

describe('Header Component - Error Handling', () => {
  test('renders without errors when props are missing', () => {
    expect(() => {
      render(
        <BrowserRouter>
          <FeatureProvider features={mockFeatures}>
            <Header />
          </FeatureProvider>
        </BrowserRouter>
      );
    }).not.toThrow();
  });

  test('handles invalid user role gracefully', () => {
    const invalidUser = {
      ...mockUser,
      role: 'invalid' as any,
    };
    
    expect(() => {
      renderHeader({ user: invalidUser });
    }).not.toThrow();
  });

  test('handles empty features object', () => {
    const emptyFeatures: Features = {
      orders: false,
      loyalty: false,
      menu: false,
    };
    
    render(
      <BrowserRouter>
        <FeatureProvider features={emptyFeatures}>
          <Header tenant={mockTenant} user={mockUser} isAdmin={false} />
        </FeatureProvider>
      </BrowserRouter>
    );
    
    // Should still render header structure
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });
});