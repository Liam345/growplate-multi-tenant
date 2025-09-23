/**
 * Header Component for GrowPlate Multi-Tenant Platform
 * 
 * Responsive header with navigation, tenant branding, and user authentication status.
 * Supports mobile hamburger menu and accessibility compliance.
 */

import { useState } from 'react';
import { Link, useLocation } from '@remix-run/react';
import { Menu, X, User, LogOut, Settings } from 'lucide-react';
import { clsx } from 'clsx';
import type { TenantContext } from '~/types/tenant';
import type { UserContext } from '~/types/auth';
import { useFeatures, filterNavigationItems, type NavigationItem } from '~/hooks/useFeatures';

// =====================================================================================
// TYPES AND INTERFACES
// =====================================================================================

export interface HeaderProps {
  /** Tenant context for branding */
  tenant?: TenantContext;
  /** User context for authentication status */
  user?: UserContext;
  /** Callback for mobile menu toggle */
  onMenuToggle?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Whether this is an admin header (shows different navigation) */
  isAdmin?: boolean;
}

// =====================================================================================
// NAVIGATION CONFIGURATION
// =====================================================================================

const adminNavigationItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: 'BarChart3',
  },
  {
    name: 'Menu',
    href: '/admin/menu',
    icon: 'UtensilsCrossed',
    feature: 'menu',
  },
  {
    name: 'Orders',
    href: '/admin/orders',
    icon: 'ShoppingBag',
    feature: 'orders',
    roles: ['owner', 'staff'],
  },
  {
    name: 'Loyalty',
    href: '/admin/loyalty',
    icon: 'Star',
    feature: 'loyalty',
    roles: ['owner'],
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: 'Settings',
    roles: ['owner'],
  },
];

const customerNavigationItems: NavigationItem[] = [
  {
    name: 'Menu',
    href: '/menu',
    icon: 'UtensilsCrossed',
    feature: 'menu',
  },
  {
    name: 'Order',
    href: '/order',
    icon: 'ShoppingBag',
    feature: 'orders',
  },
  {
    name: 'Loyalty',
    href: '/loyalty',
    icon: 'Star',
    feature: 'loyalty',
  },
];

// =====================================================================================
// HEADER COMPONENT
// =====================================================================================

/**
 * Header component with responsive navigation and tenant branding
 * 
 * Features:
 * - Responsive design with mobile hamburger menu
 * - Tenant branding integration
 * - Feature-based navigation items
 * - User authentication status
 * - WCAG 2.1 AA accessibility compliance
 * 
 * @param props - Header component props
 * @returns JSX.Element
 */
export function Header({ 
  tenant, 
  user, 
  onMenuToggle, 
  className,
  isAdmin = false 
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { features } = useFeatures();

  // Filter navigation items based on features and user role
  const navigationItems = filterNavigationItems(
    isAdmin ? adminNavigationItems : customerNavigationItems,
    features,
    user?.role
  );

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    onMenuToggle?.();
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const isCurrentPath = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <header 
      className={clsx(
        'bg-white shadow-sm border-b border-neutral-200',
        className
      )}
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link 
              to={isAdmin ? "/admin" : "/"}
              className="flex items-center space-x-3 text-primary-600 hover:text-primary-700 transition-colors"
              aria-label={`${tenant?.name || 'GrowPlate'} Home`}
            >
              {/* Logo placeholder - tenant can customize */}
              <div className="w-8 h-8 bg-primary-500 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {(tenant?.name || 'GP').charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="font-display font-semibold text-xl hidden sm:block">
                {tenant?.name || 'GrowPlate'}
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8" aria-label="Main navigation">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={clsx(
                  'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isCurrentPath(item.href)
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-neutral-600 hover:text-primary-600 hover:bg-neutral-50'
                )}
                aria-current={isCurrentPath(item.href) ? 'page' : undefined}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User Menu and Mobile Toggle */}
          <div className="flex items-center space-x-4">
            
            {/* User Profile Dropdown */}
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  className="flex items-center space-x-2 text-sm text-neutral-600 hover:text-primary-600 transition-colors"
                  aria-label="User menu"
                  aria-expanded="false"
                  aria-haspopup="true"
                >
                  <User className="w-5 h-5" aria-hidden="true" />
                  <span className="hidden sm:block">
                    {user.firstName} {user.lastName}
                  </span>
                </button>
                
                {/* Dropdown menu would go here in a full implementation */}
              </div>
            ) : (
              <Link
                to="/login"
                className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                Sign In
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-neutral-600 hover:text-primary-600 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 transition-colors"
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
              onClick={toggleMobileMenu}
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" aria-hidden="true" />
              ) : (
                <Menu className="w-6 h-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden border-t border-neutral-200 bg-white"
          id="mobile-menu"
        >
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={clsx(
                  'block px-3 py-2 text-base font-medium rounded-md transition-colors',
                  isCurrentPath(item.href)
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-neutral-600 hover:text-primary-600 hover:bg-neutral-50'
                )}
                aria-current={isCurrentPath(item.href) ? 'page' : undefined}
                onClick={closeMobileMenu}
              >
                {item.name}
              </Link>
            ))}
            
            {/* Mobile user actions */}
            {user && (
              <div className="pt-4 pb-2 border-t border-neutral-200">
                <div className="px-3 py-2 text-sm text-neutral-500">
                  Signed in as {user.firstName} {user.lastName}
                </div>
                {isAdmin && (
                  <Link
                    to="/admin/settings"
                    className="block px-3 py-2 text-base font-medium text-neutral-600 hover:text-primary-600 hover:bg-neutral-50 rounded-md transition-colors"
                    onClick={closeMobileMenu}
                  >
                    <div className="flex items-center space-x-2">
                      <Settings className="w-5 h-5" aria-hidden="true" />
                      <span>Settings</span>
                    </div>
                  </Link>
                )}
                <button
                  type="button"
                  className="block w-full text-left px-3 py-2 text-base font-medium text-neutral-600 hover:text-primary-600 hover:bg-neutral-50 rounded-md transition-colors"
                  onClick={closeMobileMenu}
                >
                  <div className="flex items-center space-x-2">
                    <LogOut className="w-5 h-5" aria-hidden="true" />
                    <span>Sign Out</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

// =====================================================================================
// EXPORTS
// =====================================================================================

export default Header;