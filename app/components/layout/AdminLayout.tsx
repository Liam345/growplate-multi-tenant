/**
 * AdminLayout Component for GrowPlate Admin Dashboard
 * 
 * Complete layout wrapper for admin pages with header, sidebar, footer composition.
 * Includes context integration, responsive design, and accessibility features.
 */

import { useState, useEffect, type ReactNode } from 'react';
import { clsx } from 'clsx';
import type { TenantContext } from '~/types/tenant';
import type { UserContext } from '~/types/auth';
import type { Features } from '~/types/features';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { FeatureProvider } from '~/hooks/useFeatures';
import { useSidebar } from '~/hooks/useSidebar';

// =====================================================================================
// TYPES AND INTERFACES
// =====================================================================================

export interface AdminLayoutProps {
  /** Child components to render in main content area */
  children: ReactNode;
  /** Page title for SEO and accessibility */
  title?: string;
  /** Tenant context for branding and features */
  tenant?: TenantContext;
  /** User context for authentication and navigation */
  user?: UserContext;
  /** Feature flags for conditional rendering */
  features?: Features;
  /** Additional CSS classes for main content */
  className?: string;
  /** Whether to show the sidebar (default: true) */
  showSidebar?: boolean;
  /** Whether to show the footer (default: true) */
  showFooter?: boolean;
}

// =====================================================================================
// ADMIN LAYOUT COMPONENT
// =====================================================================================

/**
 * Admin layout wrapper with header, sidebar, and footer composition
 * 
 * Features:
 * - Responsive design with mobile-first approach
 * - Collapsible sidebar with state management
 * - Context integration for tenant/user/features
 * - Semantic HTML structure for accessibility
 * - SEO-friendly page title management
 * - Proper spacing and grid system
 * 
 * @param props - AdminLayout component props
 * @returns JSX.Element
 */
export function AdminLayout({
  children,
  title,
  tenant,
  user,
  features = { orders: true, loyalty: false, menu: true },
  className,
  showSidebar = true,
  showFooter = true,
}: AdminLayoutProps) {
  const sidebar = useSidebar(true);
  const [isMounted, setIsMounted] = useState(false);

  // Handle hydration for server-side rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update document title
  useEffect(() => {
    if (title) {
      const tenantName = tenant?.name || 'GrowPlate';
      document.title = `${title} - ${tenantName} Admin`;
    }
  }, [title, tenant?.name]);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        sidebar.open();
      } else {
        sidebar.close();
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Call once on mount

    return () => window.removeEventListener('resize', handleResize);
  }, [sidebar]);

  return (
    <FeatureProvider features={features}>
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        
        {/* Header */}
        <Header
          tenant={tenant}
          user={user}
          onMenuToggle={sidebar.toggle}
          isAdmin={true}
          className="flex-shrink-0 z-30"
        />

        {/* Main content area */}
        <div className="flex-1 flex">
          
          {/* Sidebar */}
          {showSidebar && (
            <Sidebar
              isOpen={sidebar.isOpen}
              onToggle={sidebar.toggle}
              user={user}
              className="flex-shrink-0"
            />
          )}

          {/* Main content */}
          <main
            className={clsx(
              'flex-1 flex flex-col min-w-0',
              showSidebar && 'lg:ml-0', // Sidebar handles its own positioning
              className
            )}
            role="main"
            aria-label="Main content"
          >
            
            {/* Page header section */}
            {title && (
              <div className="bg-white border-b border-neutral-200 px-4 sm:px-6 lg:px-8 py-6">
                <div className="max-w-7xl mx-auto">
                  <h1 className="text-2xl font-bold text-neutral-900">
                    {title}
                  </h1>
                </div>
              </div>
            )}

            {/* Page content */}
            <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
              <div className="max-w-7xl mx-auto">
                {isMounted ? children : (
                  // Loading state for SSR hydration
                  <div className="animate-pulse">
                    <div className="h-8 bg-neutral-200 rounded mb-4"></div>
                    <div className="h-32 bg-neutral-200 rounded"></div>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>

        {/* Footer */}
        {showFooter && (
          <Footer
            tenant={tenant}
            isAdmin={true}
            className="flex-shrink-0 mt-auto"
          />
        )}
      </div>
    </FeatureProvider>
  );
}

// =====================================================================================
// LAYOUT UTILITIES
// =====================================================================================

/**
 * Page wrapper component for consistent spacing and structure
 */
export function AdminPage({ 
  children, 
  className 
}: { 
  children: ReactNode; 
  className?: string; 
}) {
  return (
    <div className={clsx('space-y-6', className)}>
      {children}
    </div>
  );
}

/**
 * Card component for admin sections
 */
export function AdminCard({ 
  title, 
  children, 
  className,
  actions 
}: { 
  title?: string;
  children: ReactNode; 
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <div className={clsx('bg-white rounded-lg border border-neutral-200 shadow-sm', className)}>
      {title && (
        <div className="px-6 py-4 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900">
              {title}
            </h2>
            {actions && (
              <div className="flex items-center space-x-2">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

/**
 * Stats grid component for dashboard metrics
 */
export function AdminStatsGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {children}
    </div>
  );
}

/**
 * Individual stat card component
 */
export function AdminStatCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
}: {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-600">
            {title}
          </p>
          <p className="text-2xl font-bold text-neutral-900">
            {value}
          </p>
          {change && (
            <p className={clsx(
              'text-sm font-medium',
              changeType === 'positive' && 'text-secondary-600',
              changeType === 'negative' && 'text-red-600',
              changeType === 'neutral' && 'text-neutral-600'
            )}>
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div className="text-neutral-400">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================================================
// HOOKS
// =====================================================================================

/**
 * Hook for admin page metadata
 */
export function useAdminPage(title: string, description?: string) {
  useEffect(() => {
    document.title = `${title} - Admin`;
    
    if (description) {
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', description);
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = description;
        document.head.appendChild(meta);
      }
    }
  }, [title, description]);
}

// =====================================================================================
// EXPORTS
// =====================================================================================

export default AdminLayout;