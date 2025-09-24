/**
 * Dashboard Component
 * 
 * Main admin dashboard component with feature-conditional rendering.
 * Displays tenant information and feature cards based on enabled features.
 */

import { useEffect } from 'react';
import { clsx } from 'clsx';
import type { TenantContext } from '~/types/tenant';
import { useFeatures } from '~/hooks/useFeatures';
import { trackFeatureCardClick, trackDashboardView } from '~/lib/analytics';
import { getEnabledFeatures as getEnabledFeatureConfigs } from '~/lib/admin/features';
import { 
  FeatureCard, 
  FeatureCardGrid, 
  FeatureCardEmptyState 
} from './FeatureCard';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';

// =====================================================================================
// TYPES AND INTERFACES
// =====================================================================================

export interface DashboardProps {
  /** Tenant context for branding and info (can be serialized from loader) */
  tenant?: TenantContext | (Omit<TenantContext, 'createdAt' | 'updatedAt'> & {
    createdAt: string;
    updatedAt: string;
  });
  /** Additional CSS classes */
  className?: string;
  /** Loading state */
  loading?: boolean;
}

export interface TenantHeaderProps {
  /** Tenant context (can be serialized from loader) */
  tenant?: TenantContext | (Omit<TenantContext, 'createdAt' | 'updatedAt'> & {
    createdAt: string;
    updatedAt: string;
  });
  /** Additional CSS classes */
  className?: string;
}

// =====================================================================================
// TENANT HEADER COMPONENT
// =====================================================================================

/**
 * TenantHeader - Display tenant information
 * 
 * @param props - TenantHeader component props
 * @returns JSX.Element
 */
function TenantHeader({ tenant, className }: TenantHeaderProps) {
  if (!tenant) {
    return null;
  }

  return (
    <Card className={clsx('bg-gradient-to-r from-primary-50 to-secondary-50 border-primary-200', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-neutral-900 mb-1">
              Welcome to {tenant.name}
            </CardTitle>
            <p className="text-neutral-600 text-sm">
              Manage your restaurant operations from this dashboard
            </p>
          </div>
          <div className="text-right text-sm text-neutral-500">
            <p>{tenant.domain}</p>
            {tenant.address && (
              <p>{tenant.address.city}, {tenant.address.state}</p>
            )}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

// =====================================================================================
// DASHBOARD LOADING COMPONENT
// =====================================================================================

/**
 * DashboardLoading - Loading skeleton for dashboard
 * 
 * @returns JSX.Element
 */
function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-neutral-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
        </div>
      </div>

      {/* Feature cards skeleton */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-neutral-200 p-6 animate-pulse"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-neutral-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-5 bg-neutral-200 rounded w-3/4 mb-1"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-neutral-200 rounded"></div>
              <div className="h-4 bg-neutral-200 rounded w-5/6"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =====================================================================================
// MAIN DASHBOARD COMPONENT
// =====================================================================================

/**
 * Dashboard - Main admin dashboard component
 * 
 * Features:
 * - Tenant information header
 * - Feature-conditional rendering of feature cards
 * - Responsive design with mobile-first approach
 * - Loading states and empty states
 * - Integration with feature flag system
 * - Clean, professional design
 * 
 * @param props - Dashboard component props
 * @returns JSX.Element
 */
export function Dashboard({ tenant, className, loading = false }: DashboardProps) {
  const { features } = useFeatures();
  const enabledFeatures = getEnabledFeatureConfigs(features);

  // Track dashboard view for analytics
  useEffect(() => {
    const enabledFeatureNames = enabledFeatures.map(feature => feature.key);
    trackDashboardView(tenant?.id, enabledFeatureNames);
  }, [tenant?.id, enabledFeatures]);

  // Show loading state
  if (loading) {
    return <DashboardLoading />;
  }

  // Check if any features are enabled
  const hasAnyFeatures = enabledFeatures.length > 0;

  return (
    <div className={clsx('space-y-6', className)}>
      {/* Tenant Header */}
      <TenantHeader tenant={tenant} />

      {/* Feature Cards Section */}
      <div>
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-2">
            Management Tools
          </h2>
          <p className="text-sm text-neutral-600">
            Access your restaurant&apos;s management features below
          </p>
        </div>

        {hasAnyFeatures ? (
          <FeatureCardGrid>
            {enabledFeatures.map((feature) => (
              <FeatureCard
                key={feature.key}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                href={feature.href}
                enabled={true} // Already filtered by getEnabledFeatures
                onClick={() => {
                  trackFeatureCardClick(feature.key, tenant?.id);
                }}
              />
            ))}
          </FeatureCardGrid>
        ) : (
          <FeatureCardEmptyState />
        )}
      </div>

      {/* Quick Stats Section - Placeholder for future implementation */}
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">
          Quick Overview
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-neutral-900 mb-1">--</div>
              <div className="text-sm text-neutral-600">Total Orders</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-neutral-900 mb-1">--</div>
              <div className="text-sm text-neutral-600">Revenue</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-neutral-900 mb-1">--</div>
              <div className="text-sm text-neutral-600">Menu Items</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-neutral-900 mb-1">--</div>
              <div className="text-sm text-neutral-600">Customers</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Development Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg
                className="w-4 h-4 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Development Mode</h4>
              <p className="text-sm text-blue-800">
                This dashboard shows only the features enabled for your restaurant. 
                Full functionality will be implemented in subsequent development phases.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =====================================================================================
// DASHBOARD UTILITIES
// =====================================================================================

/**
 * Utility function to check if dashboard should show empty state
 * 
 * @param features - Features object with feature flags
 * @returns Boolean indicating if any features are enabled
 */
export function hasDashboardFeatures(features: Record<string, boolean>): boolean {
  const enabledFeatures = getEnabledFeatureConfigs(features);
  return enabledFeatures.length > 0;
}

/**
 * Get enabled feature count for analytics
 * 
 * @param features - Features object with feature flags
 * @returns Number of enabled features
 */
export function getEnabledFeatureCount(features: Record<string, boolean>): number {
  const enabledFeatures = getEnabledFeatureConfigs(features);
  return enabledFeatures.length;
}

// =====================================================================================
// EXPORTS
// =====================================================================================

export default Dashboard;