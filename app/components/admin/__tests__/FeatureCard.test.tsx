/**
 * FeatureCard Component Tests
 * 
 * Comprehensive test suite for the FeatureCard component and related utilities.
 * Tests accessibility improvements, conditional rendering, and user interactions.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ShoppingCart, Menu, Star } from 'lucide-react';
import { 
  FeatureCard, 
  FeatureCardGrid, 
  FeatureCardEmptyState 
} from '~/components/admin/FeatureCard';

// =====================================================================================
// TEST UTILITIES
// =====================================================================================

// Wrapper component for React Router
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <BrowserRouter>{children}</BrowserRouter>;
}

const mockProps = {
  icon: ShoppingCart,
  title: 'Order Management',
  description: 'Manage incoming orders, track status, and process payments',
  href: '/admin/orders',
  enabled: true,
};

// =====================================================================================
// FEATURE CARD COMPONENT TESTS
// =====================================================================================

describe('FeatureCard Component', () => {
  describe('Rendering', () => {
    test('renders card with all props when enabled', () => {
      render(
        <TestWrapper>
          <FeatureCard {...mockProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Order Management')).toBeInTheDocument();
      expect(screen.getByText('Manage incoming orders, track status, and process payments')).toBeInTheDocument();
      expect(screen.getByRole('link')).toHaveAttribute('href', '/admin/orders');
    });

    test('does not render when enabled is false', () => {
      const { container } = render(
        <TestWrapper>
          <FeatureCard {...mockProps} enabled={false} />
        </TestWrapper>
      );

      expect(container.firstChild).toBeNull();
    });

    test('renders with custom className', () => {
      render(
        <TestWrapper>
          <FeatureCard {...mockProps} className="custom-class" />
        </TestWrapper>
      );

      const card = screen.getByRole('link').firstChild;
      expect(card).toHaveClass('custom-class');
    });

    test('renders with different icons', () => {
      render(
        <TestWrapper>
          <FeatureCard {...mockProps} icon={Menu} />
        </TestWrapper>
      );

      // Icon should be rendered (SVG element)
      const iconContainer = screen.getByRole('link').querySelector('svg');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    test('renders disabled card without link wrapper', () => {
      render(
        <TestWrapper>
          <FeatureCard {...mockProps} disabled={true} />
        </TestWrapper>
      );

      expect(screen.getByText('Order Management')).toBeInTheDocument();
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    test('disabled card has proper styling', () => {
      render(
        <TestWrapper>
          <FeatureCard {...mockProps} disabled={true} />
        </TestWrapper>
      );

      const cardContainer = screen.getByText('Order Management').closest('[class*="opacity-50"]');
      expect(cardContainer).toBeInTheDocument();
    });

    test('disabled card does not have interactive accessibility attributes', () => {
      render(
        <TestWrapper>
          <FeatureCard {...mockProps} disabled={true} />
        </TestWrapper>
      );

      // Should not have button role or tabindex
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.queryByText('Order Management').closest('[tabindex]')).toBeNull();
    });

    test('disabled card icon has muted styling', () => {
      const { container } = render(
        <TestWrapper>
          <FeatureCard {...mockProps} disabled={true} />
        </TestWrapper>
      );

      const iconContainer = container.querySelector('[class*="bg-neutral-100 text-neutral-400"]');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('Interactive Behavior', () => {
    test('calls onClick handler when clicked', () => {
      const mockOnClick = jest.fn();
      
      render(
        <TestWrapper>
          <FeatureCard {...mockProps} onClick={mockOnClick} />
        </TestWrapper>
      );

      fireEvent.click(screen.getByRole('link'));
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    test('does not call onClick when disabled', () => {
      const mockOnClick = jest.fn();
      
      render(
        <TestWrapper>
          <FeatureCard {...mockProps} disabled={true} onClick={mockOnClick} />
        </TestWrapper>
      );

      const cardElement = screen.getByText('Order Management');
      fireEvent.click(cardElement);
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    test('has proper accessibility label', () => {
      render(
        <TestWrapper>
          <FeatureCard {...mockProps} />
        </TestWrapper>
      );

      expect(screen.getByLabelText('Navigate to Order Management')).toBeInTheDocument();
    });

    test('enabled card has hover styles', () => {
      render(
        <TestWrapper>
          <FeatureCard {...mockProps} />
        </TestWrapper>
      );

      const card = screen.getByRole('link').firstChild;
      expect(card).toHaveClass('hover:border-primary-300');
      expect(card).toHaveClass('hover:shadow-md');
      expect(card).toHaveClass('cursor-pointer');
    });

    test('disabled card does not have hover styles', () => {
      render(
        <TestWrapper>
          <FeatureCard {...mockProps} disabled={true} />
        </TestWrapper>
      );

      const card = screen.getByText('Order Management').closest('[class*="cursor-not-allowed"]');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('icon has proper aria-hidden attribute', () => {
      render(
        <TestWrapper>
          <FeatureCard {...mockProps} />
        </TestWrapper>
      );

      const icon = screen.getByRole('link').querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });

    test('card has focus ring styles', () => {
      render(
        <TestWrapper>
          <FeatureCard {...mockProps} />
        </TestWrapper>
      );

      const card = screen.getByRole('link').firstChild;
      expect(card).toHaveClass('focus-within:ring-2');
      expect(card).toHaveClass('focus-within:ring-primary-500');
    });

    test('link has proper focus styles', () => {
      render(
        <TestWrapper>
          <FeatureCard {...mockProps} />
        </TestWrapper>
      );

      const link = screen.getByRole('link');
      expect(link).toHaveClass('focus:outline-none');
    });

    test('disabled card is not interactive for screen readers', () => {
      render(
        <TestWrapper>
          <FeatureCard {...mockProps} disabled={true} />
        </TestWrapper>
      );

      // Should not have any interactive roles
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });
});

// =====================================================================================
// FEATURE CARD GRID TESTS
// =====================================================================================

describe('FeatureCardGrid Component', () => {
  test('renders children in grid layout', () => {
    render(
      <TestWrapper>
        <FeatureCardGrid>
          <FeatureCard {...mockProps} title="Card 1" />
          <FeatureCard {...mockProps} title="Card 2" icon={Menu} />
          <FeatureCard {...mockProps} title="Card 3" icon={Star} />
        </FeatureCardGrid>
      </TestWrapper>
    );

    expect(screen.getByText('Card 1')).toBeInTheDocument();
    expect(screen.getByText('Card 2')).toBeInTheDocument();
    expect(screen.getByText('Card 3')).toBeInTheDocument();
  });

  test('has proper grid classes', () => {
    const { container } = render(
      <FeatureCardGrid>
        <div>Test content</div>
      </FeatureCardGrid>
    );

    const grid = container.firstChild;
    expect(grid).toHaveClass('grid');
    expect(grid).toHaveClass('gap-6');
    expect(grid).toHaveClass('grid-cols-1');
    expect(grid).toHaveClass('sm:grid-cols-2');
    expect(grid).toHaveClass('lg:grid-cols-3');
    expect(grid).toHaveClass('auto-rows-fr');
  });

  test('accepts custom className', () => {
    const { container } = render(
      <FeatureCardGrid className="custom-grid-class">
        <div>Test content</div>
      </FeatureCardGrid>
    );

    expect(container.firstChild).toHaveClass('custom-grid-class');
  });

  test('renders empty grid gracefully', () => {
    const { container } = render(
      <FeatureCardGrid>
        {/* No children */}
      </FeatureCardGrid>
    );

    expect(container.firstChild).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('grid');
  });
});

// =====================================================================================
// EMPTY STATE TESTS
// =====================================================================================

describe('FeatureCardEmptyState Component', () => {
  test('renders default empty state message', () => {
    render(<FeatureCardEmptyState />);

    expect(screen.getByText('No Features Available')).toBeInTheDocument();
    expect(screen.getByText('No features are currently enabled for your restaurant.')).toBeInTheDocument();
    expect(screen.getByText('Contact support to enable features for your restaurant.')).toBeInTheDocument();
  });

  test('renders custom message', () => {
    const customMessage = 'All features are temporarily disabled.';
    render(<FeatureCardEmptyState message={customMessage} />);

    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  test('has proper styling classes', () => {
    const { container } = render(<FeatureCardEmptyState />);

    const card = container.firstChild;
    expect(card).toHaveClass('text-center');
    expect(card).toHaveClass('py-12');
  });

  test('accepts custom className', () => {
    const { container } = render(
      <FeatureCardEmptyState className="custom-empty-class" />
    );

    expect(container.firstChild).toHaveClass('custom-empty-class');
  });

  test('has proper icon with accessibility attributes', () => {
    render(<FeatureCardEmptyState />);

    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  test('has proper content structure', () => {
    render(<FeatureCardEmptyState />);

    // Check heading hierarchy
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('No Features Available');

    // Check icon container
    const iconContainer = screen.getByRole('img', { hidden: true }).parentElement;
    expect(iconContainer).toHaveClass('w-16', 'h-16', 'mx-auto', 'mb-4');
  });
});

// =====================================================================================
// INTEGRATION TESTS
// =====================================================================================

describe('FeatureCard Integration', () => {
  test('multiple cards render correctly in grid', () => {
    const cards = [
      { icon: ShoppingCart, title: 'Orders', href: '/admin/orders' },
      { icon: Menu, title: 'Menu', href: '/admin/menu' },
      { icon: Star, title: 'Loyalty', href: '/admin/loyalty', disabled: true },
    ];

    render(
      <TestWrapper>
        <FeatureCardGrid>
          {cards.map((card, index) => (
            <FeatureCard
              key={index}
              icon={card.icon}
              title={card.title}
              description="Test description"
              href={card.href}
              disabled={card.disabled}
              enabled={true}
            />
          ))}
        </FeatureCardGrid>
      </TestWrapper>
    );

    expect(screen.getByText('Orders')).toBeInTheDocument();
    expect(screen.getByText('Menu')).toBeInTheDocument();
    expect(screen.getByText('Loyalty')).toBeInTheDocument();

    // Check that non-disabled cards are links
    expect(screen.getByLabelText('Navigate to Orders')).toBeInTheDocument();
    expect(screen.getByLabelText('Navigate to Menu')).toBeInTheDocument();
    
    // Check that disabled card is not a link
    expect(screen.queryByLabelText('Navigate to Loyalty')).not.toBeInTheDocument();
  });

  test('grid handles mixed enabled/disabled states', () => {
    render(
      <TestWrapper>
        <FeatureCardGrid>
          <FeatureCard {...mockProps} title="Enabled Card" enabled={true} />
          <FeatureCard {...mockProps} title="Disabled Card" enabled={true} disabled={true} />
          <FeatureCard {...mockProps} title="Hidden Card" enabled={false} />
        </FeatureCardGrid>
      </TestWrapper>
    );

    expect(screen.getByText('Enabled Card')).toBeInTheDocument();
    expect(screen.getByText('Disabled Card')).toBeInTheDocument();
    expect(screen.queryByText('Hidden Card')).not.toBeInTheDocument();
  });

  test('empty grid shows empty state correctly', () => {
    render(
      <FeatureCardGrid>
        <FeatureCardEmptyState />
      </FeatureCardGrid>
    );

    expect(screen.getByText('No Features Available')).toBeInTheDocument();
  });
});

// =====================================================================================
// REGRESSION TESTS
// =====================================================================================

describe('FeatureCard Regression Tests', () => {
  test('no redundant variables are used', () => {
    // This test ensures that the isDisabled variable removal didn't break anything
    render(
      <TestWrapper>
        <FeatureCard {...mockProps} disabled={true} />
      </TestWrapper>
    );

    // Card should still render correctly in disabled state
    expect(screen.getByText('Order Management')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  test('accessibility improvements do not break functionality', () => {
    const mockOnClick = jest.fn();
    
    render(
      <TestWrapper>
        <FeatureCard {...mockProps} onClick={mockOnClick} />
      </TestWrapper>
    );

    // Should still be clickable when enabled
    fireEvent.click(screen.getByRole('link'));
    expect(mockOnClick).toHaveBeenCalled();
  });

  test('disabled state does not have misleading accessibility attributes', () => {
    render(
      <TestWrapper>
        <FeatureCard {...mockProps} disabled={true} />
      </TestWrapper>
    );

    // These should not exist in disabled state (regression test for accessibility fix)
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    const cardElement = screen.getByText('Order Management');
    expect(cardElement.closest('[tabindex]')).toBeNull();
  });
});