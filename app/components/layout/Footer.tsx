/**
 * Footer Component for GrowPlate Multi-Tenant Platform
 * 
 * Consistent footer with tenant customization, responsive layout,
 * and contact information display.
 */

import { Link } from '@remix-run/react';
import { Mail, Phone, MapPin, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';
import type { TenantContext } from '~/types/tenant';

// =====================================================================================
// TYPES AND INTERFACES
// =====================================================================================

export interface FooterProps {
  /** Tenant context for customization */
  tenant?: TenantContext;
  /** Additional CSS classes */
  className?: string;
  /** Whether this is an admin footer (minimal version) */
  isAdmin?: boolean;
}

interface FooterLink {
  name: string;
  href: string;
  external?: boolean;
}

// =====================================================================================
// FOOTER CONFIGURATION
// =====================================================================================

const defaultFooterLinks: FooterLink[] = [
  { name: 'Privacy Policy', href: '/privacy' },
  { name: 'Terms of Service', href: '/terms' },
  { name: 'Contact Us', href: '/contact' },
  { name: 'Help', href: '/help' },
];

const adminFooterLinks: FooterLink[] = [
  { name: 'Help Center', href: '/admin/help' },
  { name: 'Support', href: '/admin/support' },
  { name: 'API Docs', href: '/docs', external: true },
];

// =====================================================================================
// FOOTER COMPONENT
// =====================================================================================

/**
 * Footer component with tenant customization and responsive design
 * 
 * Features:
 * - Tenant-customizable content
 * - Responsive layout (horizontal desktop, stacked mobile)
 * - Contact information display
 * - Copyright and legal links
 * - Clean, professional design
 * 
 * @param props - Footer component props
 * @returns JSX.Element
 */
export function Footer({ tenant, className, isAdmin = false }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const footerLinks = isAdmin ? adminFooterLinks : defaultFooterLinks;
  
  // Extract tenant contact information
  const contactInfo = {
    email: tenant?.email || tenant?.settings?.supportEmail,
    phone: tenant?.phone || tenant?.settings?.supportPhone,
    address: tenant?.address,
  };

  // Determine business name
  const businessName = tenant?.settings?.businessName || tenant?.name || 'GrowPlate';

  if (isAdmin) {
    // Minimal admin footer
    return (
      <footer 
        className={clsx(
          'bg-white border-t border-neutral-200 py-4',
          className
        )}
        role="contentinfo"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <div className="text-sm text-neutral-600">
              © {currentYear} {businessName}. All rights reserved.
            </div>
            <nav className="flex space-x-6" aria-label="Footer navigation">
              {footerLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-sm text-neutral-600 hover:text-primary-600 transition-colors"
                  {...(link.external && {
                    target: '_blank',
                    rel: 'noopener noreferrer',
                  })}
                >
                  <span className="flex items-center space-x-1">
                    <span>{link.name}</span>
                    {link.external && (
                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    )}
                  </span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </footer>
    );
  }

  // Full customer footer
  return (
    <footer 
      className={clsx(
        'bg-neutral-50 border-t border-neutral-200',
        className
      )}
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Business Information */}
          <div className="col-span-1 lg:col-span-2">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              {businessName}
            </h3>
            
            {tenant?.settings?.businessType && (
              <p className="text-neutral-600 mb-4">
                {tenant.settings.businessType}
              </p>
            )}

            {/* Contact Information */}
            <div className="space-y-2">
              {contactInfo.email && (
                <div className="flex items-center space-x-2 text-sm text-neutral-600">
                  <Mail className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  <a 
                    href={`mailto:${contactInfo.email}`}
                    className="hover:text-primary-600 transition-colors"
                  >
                    {contactInfo.email}
                  </a>
                </div>
              )}
              
              {contactInfo.phone && (
                <div className="flex items-center space-x-2 text-sm text-neutral-600">
                  <Phone className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  <a 
                    href={`tel:${contactInfo.phone}`}
                    className="hover:text-primary-600 transition-colors"
                  >
                    {contactInfo.phone}
                  </a>
                </div>
              )}
              
              {contactInfo.address && (
                <div className="flex items-start space-x-2 text-sm text-neutral-600">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <address className="not-italic">
                    {contactInfo.address.street}<br />
                    {contactInfo.address.city}, {contactInfo.address.state} {contactInfo.address.zipCode}
                  </address>
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-neutral-900 mb-4 uppercase tracking-wide">
              Quick Links
            </h4>
            <nav className="space-y-2" aria-label="Footer quick links">
              <Link 
                to="/menu" 
                className="block text-sm text-neutral-600 hover:text-primary-600 transition-colors"
              >
                Menu
              </Link>
              <Link 
                to="/order" 
                className="block text-sm text-neutral-600 hover:text-primary-600 transition-colors"
              >
                Order Online
              </Link>
              <Link 
                to="/loyalty" 
                className="block text-sm text-neutral-600 hover:text-primary-600 transition-colors"
              >
                Loyalty Program
              </Link>
              <Link 
                to="/about" 
                className="block text-sm text-neutral-600 hover:text-primary-600 transition-colors"
              >
                About Us
              </Link>
            </nav>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="text-sm font-semibold text-neutral-900 mb-4 uppercase tracking-wide">
              Support
            </h4>
            <nav className="space-y-2" aria-label="Footer support links">
              {footerLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="block text-sm text-neutral-600 hover:text-primary-600 transition-colors"
                  {...(link.external && {
                    target: '_blank',
                    rel: 'noopener noreferrer',
                  })}
                >
                  <span className="flex items-center space-x-1">
                    <span>{link.name}</span>
                    {link.external && (
                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    )}
                  </span>
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-8 pt-8 border-t border-neutral-200">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="text-sm text-neutral-600">
              © {currentYear} {businessName}. All rights reserved.
            </div>
            
            {/* Powered by GrowPlate */}
            <div className="text-sm text-neutral-500">
              Powered by{' '}
              <a 
                href="https://growplate.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 transition-colors"
              >
                GrowPlate
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

// =====================================================================================
// UTILITIES
// =====================================================================================

/**
 * Utility function to determine if footer should be sticky
 * Based on page content height
 */
export function useStickyFooter() {
  // This would be implemented with useEffect and DOM measurements
  // For now, return false as default
  return false;
}

// =====================================================================================
// EXPORTS
// =====================================================================================

export default Footer;