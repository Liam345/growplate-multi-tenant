/**
 * Sidebar Component for GrowPlate Admin Dashboard
 * 
 * Collapsible admin navigation sidebar with feature-based menu items,
 * role-based access control, and responsive behavior.
 */

import { Link, useLocation } from '@remix-run/react';
import { 
  BarChart3, 
  UtensilsCrossed, 
  ShoppingBag, 
  Star, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  Users,
  CreditCard
} from 'lucide-react';
import { clsx } from 'clsx';
import type { UserContext } from '~/types/auth';
import { useFeatures, filterNavigationItems, type NavigationItem } from '~/hooks/useFeatures';

// =====================================================================================
// TYPES AND INTERFACES
// =====================================================================================

export interface SidebarProps {
  /** Whether sidebar is open/expanded */
  isOpen: boolean;
  /** Callback to toggle sidebar state */
  onToggle: () => void;
  /** User context for role-based navigation */
  user?: UserContext;
  /** Additional CSS classes */
  className?: string;
}

// =====================================================================================
// NAVIGATION CONFIGURATION
// =====================================================================================

// Icon mapping for navigation items
const iconMap = {
  BarChart3,
  UtensilsCrossed,
  ShoppingBag,
  Star,
  Settings,
  Users,
  CreditCard,
};

const adminSidebarItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: 'BarChart3',
  },
  {
    name: 'Menu Management',
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
    name: 'Loyalty Program',
    href: '/admin/loyalty',
    icon: 'Star',
    feature: 'loyalty',
    roles: ['owner'],
  },
  {
    name: 'Staff Management',
    href: '/admin/staff',
    icon: 'Users',
    roles: ['owner'],
  },
  {
    name: 'Payments',
    href: '/admin/payments',
    icon: 'CreditCard',
    roles: ['owner'],
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: 'Settings',
    roles: ['owner'],
  },
];

// =====================================================================================
// SIDEBAR COMPONENT
// =====================================================================================

/**
 * Admin dashboard sidebar with collapsible navigation
 * 
 * Features:
 * - Collapsible/expandable sidebar
 * - Feature-based navigation items
 * - Role-based access control
 * - Mobile overlay behavior
 * - Icon-based navigation with tooltips
 * - WCAG 2.1 AA accessibility compliance
 * 
 * @param props - Sidebar component props
 * @returns JSX.Element
 */
export function Sidebar({ isOpen, onToggle, user, className }: SidebarProps) {
  const location = useLocation();
  const { features } = useFeatures();

  // Filter navigation items based on features and user role
  const navigationItems = filterNavigationItems(
    adminSidebarItems,
    features,
    user?.role
  );

  const isCurrentPath = (href: string) => {
    if (href === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-neutral-600 bg-opacity-75 transition-opacity lg:hidden"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar container */}
      <div
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-neutral-200 transition-all duration-300 ease-in-out',
          isOpen ? 'w-64' : 'w-16',
          'lg:static lg:inset-auto lg:translate-x-0',
          className
        )}
        aria-label="Sidebar navigation"
      >
        
        {/* Sidebar header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          {isOpen ? (
            <h2 className="text-lg font-semibold text-neutral-900">
              Admin Panel
            </h2>
          ) : (
            <div className="w-8 h-8 bg-primary-500 rounded-md flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
          )}
          
          {/* Toggle button */}
          <button
            type="button"
            onClick={onToggle}
            className="p-1 rounded-md text-neutral-600 hover:text-primary-600 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
            aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isOpen ? (
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            ) : (
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Navigation menu */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto" aria-label="Admin navigation">
          {navigationItems.map((item) => {
            const IconComponent = iconMap[item.icon as keyof typeof iconMap];
            const isCurrent = isCurrentPath(item.href);
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={clsx(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors group relative',
                  isCurrent
                    ? 'text-primary-600 bg-primary-50 border-r-2 border-primary-600'
                    : 'text-neutral-600 hover:text-primary-600 hover:bg-neutral-50',
                  !isOpen && 'justify-center'
                )}
                aria-current={isCurrent ? 'page' : undefined}
                title={!isOpen ? item.name : undefined}
              >
                {IconComponent && (
                  <IconComponent 
                    className={clsx(
                      'w-5 h-5 flex-shrink-0',
                      isOpen ? 'mr-3' : ''
                    )} 
                    aria-hidden="true" 
                  />
                )}
                
                {isOpen && (
                  <span className="truncate">{item.name}</span>
                )}
                
                {/* Tooltip for collapsed state */}
                {!isOpen && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User info section */}
        {user && (
          <div className="p-4 border-t border-neutral-200">
            <div className={clsx(
              'flex items-center',
              isOpen ? 'space-x-3' : 'justify-center'
            )}>
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-medium text-sm">
                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                </span>
              </div>
              
              {isOpen && (
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-neutral-500 capitalize">
                    {user.role}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// =====================================================================================
// SIDEBAR HOOK FOR STATE MANAGEMENT
// =====================================================================================

import { useState } from 'react';

/**
 * Custom hook for managing sidebar state
 * 
 * @param initialOpen - Initial sidebar open state
 * @returns Sidebar state and controls
 */
export function useSidebar(initialOpen: boolean = true) {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const toggle = () => setIsOpen(!isOpen);
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return {
    isOpen,
    toggle,
    open,
    close,
  };
}

// =====================================================================================
// EXPORTS
// =====================================================================================

export default Sidebar;