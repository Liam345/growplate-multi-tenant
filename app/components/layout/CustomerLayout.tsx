/**
 * CustomerLayout Component for GrowPlate Customer Interface
 * 
 * Complete layout wrapper for customer-facing pages with header and footer composition.
 * Optimized for public-facing pages with mobile-first responsive design.
 */

import { useState, useEffect, type ReactNode } from 'react';
import { clsx } from 'clsx';
import type { TenantContext } from '~/types/tenant';
import type { UserContext } from '~/types/auth';
import type { Features } from '~/types/features';
import { Header } from './Header';
import { Footer } from './Footer';
import { FeatureProvider } from '~/hooks/useFeatures';

// =====================================================================================
// TYPES AND INTERFACES
// =====================================================================================

export interface CustomerLayoutProps {
  /** Child components to render in main content area */
  children: ReactNode;
  /** Page title for SEO and accessibility */
  title?: string;
  /** Page description for SEO */
  description?: string;
  /** Tenant context for branding and features */
  tenant?: TenantContext;
  /** User context for authentication (optional for customers) */
  user?: UserContext;
  /** Feature flags for conditional rendering */
  features?: Features;
  /** Additional CSS classes for main content */
  className?: string;
  /** Whether to show the header (default: true) */
  showHeader?: boolean;
  /** Whether to show the footer (default: true) */
  showFooter?: boolean;
  /** Whether to use full-width layout (default: false) */
  fullWidth?: boolean;
  /** Background color variant */
  background?: 'white' | 'neutral' | 'primary';
}

interface BreadcrumbItem {
  name: string;
  href: string;
}

export interface CustomerPageProps {
  /** Breadcrumb navigation items */
  breadcrumbs?: BreadcrumbItem[];
  /** Page title for display */
  title?: string;
  /** Page subtitle */
  subtitle?: string;
  /** Page actions */
  actions?: ReactNode;
  /** Child content */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

// =====================================================================================
// CUSTOMER LAYOUT COMPONENT
// =====================================================================================

/**
 * Customer layout wrapper with header and footer composition
 * 
 * Features:
 * - Mobile-first responsive design
 * - SEO-optimized with meta tags
 * - Context integration for tenant/user/features
 * - Semantic HTML structure for accessibility
 * - Flexible content width options
 * - Multiple background variants
 * 
 * @param props - CustomerLayout component props
 * @returns JSX.Element
 */
export function CustomerLayout({
  children,
  title,
  description,
  tenant,
  user,
  features = { orders: true, loyalty: false, menu: true },
  className,
  showHeader = true,
  showFooter = true,
  fullWidth = false,
  background = 'white',
}: CustomerLayoutProps) {
  const [isMounted, setIsMounted] = useState(false);

  // Handle hydration for server-side rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update document title and meta tags
  useEffect(() => {
    if (title) {
      const tenantName = tenant?.name || 'GrowPlate';
      document.title = `${title} - ${tenantName}`;
    }

    let metaDescription = document.querySelector('meta[name="description"]');
    if (description) {
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', description);
    } else if (metaDescription) {
      // Remove the tag if description is not provided
      metaDescription.remove();
    }
  }, [title, description, tenant?.name]);

  const backgroundClasses = {
    white: 'bg-white',
    neutral: 'bg-neutral-50',
    primary: 'bg-primary-50',
  };

  return (
    <FeatureProvider features={features}>
      <div className={clsx(
        'min-h-screen flex flex-col',
        backgroundClasses[background]
      )}>
        
        {/* Header */}
        {showHeader && (
          <Header
            tenant={tenant}
            user={user}
            isAdmin={false}
            className="flex-shrink-0 z-30"
          />
        )}

        {/* Main content area */}
        <main
          className={clsx(
            'flex-1',
            !fullWidth && 'max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8',
            className
          )}
          role="main"
          aria-label="Main content"
        >
          {isMounted ? children : (
            // Loading state for SSR hydration
            <div className="py-12 animate-pulse">
              <div className="h-8 bg-neutral-200 rounded mb-4 max-w-md"></div>
              <div className="h-4 bg-neutral-200 rounded mb-8 max-w-2xl"></div>
              <div className="h-64 bg-neutral-200 rounded"></div>
            </div>
          )}
        </main>

        {/* Footer */}
        {showFooter && (
          <Footer
            tenant={tenant}
            isAdmin={false}
            className="flex-shrink-0 mt-auto"
          />
        )}
      </div>
    </FeatureProvider>
  );
}

// =====================================================================================
// CUSTOMER PAGE UTILITIES
// =====================================================================================

/**
 * Customer page wrapper with consistent structure and styling
 */
export function CustomerPage({
  breadcrumbs,
  title,
  subtitle,
  actions,
  children,
  className,
}: CustomerPageProps) {
  return (
    <div className={clsx('py-8 lg:py-12', className)}>
      {/* Breadcrumb navigation */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm text-neutral-600">
            {breadcrumbs.map((item, index) => (
              <li key={item.href} className="flex items-center">
                {index > 0 && (
                  <span className="mx-2 text-neutral-400">/</span>
                )}
                <a
                  href={item.href}
                  className="hover:text-primary-600 transition-colors"
                  aria-current={index === breadcrumbs.length - 1 ? 'page' : undefined}
                >
                  {item.name}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Page header */}
      {(title || subtitle || actions) && (
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              {title && (
                <h1 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-2">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-lg text-neutral-600">
                  {subtitle}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex items-center space-x-3">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Page content */}
      <div>
        {children}
      </div>
    </div>
  );
}

/**
 * Hero section component for landing pages
 */
export function CustomerHero({
  title,
  subtitle,
  image,
  actions,
  className,
}: {
  title: string;
  subtitle?: string;
  image?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section 
      className={clsx(
        'relative bg-gradient-to-r from-primary-500 to-primary-600 text-white py-16 lg:py-24',
        className
      )}
    >
      {/* Background image */}
      {image && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{ backgroundImage: `url(${image})` }}
          aria-hidden="true"
        />
      )}
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center lg:text-left max-w-3xl">
          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold mb-6">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xl lg:text-2xl text-primary-100 mb-8">
              {subtitle}
            </p>
          )}
          {actions && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              {actions}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * Content section component with consistent spacing
 */
export function CustomerSection({
  title,
  subtitle,
  children,
  className,
  background = 'transparent',
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  background?: 'transparent' | 'white' | 'neutral';
}) {
  const backgroundClasses = {
    transparent: '',
    white: 'bg-white',
    neutral: 'bg-neutral-50',
  };

  return (
    <section className={clsx(
      'py-12 lg:py-16',
      backgroundClasses[background],
      className
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {(title || subtitle) && (
          <div className="text-center mb-12">
            {title && (
              <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

/**
 * Card component for customer content
 */
export function CustomerCard({
  title,
  children,
  className,
  image,
  href,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  image?: string;
  href?: string;
}) {
  const cardContent = (
    <div className={clsx(
      'bg-white rounded-lg border border-neutral-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow',
      href && 'cursor-pointer',
      className
    )}>
      {image && (
        <div className="aspect-video bg-neutral-200">
          <img 
            src={image} 
            alt={title || ''} 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-6">
        {title && (
          <h3 className="text-lg font-semibold text-neutral-900 mb-3">
            {title}
          </h3>
        )}
        {children}
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block">
        {cardContent}
      </a>
    );
  }

  return cardContent;
}

// =====================================================================================
// HOOKS
// =====================================================================================

/**
 * Hook for customer page metadata and SEO
 */
export function useCustomerPage(
  title: string, 
  description?: string,
  keywords?: string[]
) {
  useEffect(() => {
    // Set title
    document.title = title;
    
    // Set description
    if (description) {
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', description);
      }
    }
    
    // Set keywords
    if (keywords && keywords.length > 0) {
      const metaKeywords = document.querySelector('meta[name="keywords"]');
      if (metaKeywords) {
        metaKeywords.setAttribute('content', keywords.join(', '));
      }
    }
  }, [title, description, keywords]);
}

// =====================================================================================
// EXPORTS
// =====================================================================================

export default CustomerLayout;