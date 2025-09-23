/**
 * Admin Dashboard Route
 * 
 * Main admin dashboard page with feature-conditional rendering.
 * Integrates with AdminLayout and feature flag system.
 */

import type { MetaFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useRouteError } from "@remix-run/react";
import { AdminLayout } from "~/components/layout/AdminLayout";
import { Dashboard } from "~/components/admin";
import type { TenantContext } from "~/types/tenant";
import type { Features } from "~/types/features";

// =====================================================================================
// TYPES AND INTERFACES
// =====================================================================================

interface LoaderData {
  tenant: Omit<TenantContext, 'createdAt' | 'updatedAt'> & {
    createdAt: string;
    updatedAt: string;
  };
  features: Features;
}

// =====================================================================================
// META FUNCTION
// =====================================================================================

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const tenantName = data?.tenant?.name || 'GrowPlate';
  
  return [
    { title: `Dashboard - ${tenantName} Admin` },
    {
      name: "description",
      content: `${tenantName} restaurant admin dashboard for managing orders, menu, and customers.`,
    },
    {
      name: "robots",
      content: "noindex, nofollow", // Admin pages should not be indexed
    },
  ];
};

// =====================================================================================
// LOADER FUNCTION
// =====================================================================================

export const loader: LoaderFunction = async ({ request }) => {
  // For now, we'll use mock data since tenant resolution middleware
  // will be implemented in future tasks
  // In production, this would come from the tenant middleware
  const mockTenant: LoaderData['tenant'] = {
    id: "tenant-1",
    name: "Sample Restaurant",
    domain: "sample-restaurant.com",
    subdomain: null,
    email: "admin@sample-restaurant.com",
    phone: "(555) 123-4567",
    address: {
      street: "123 Main St",
      city: "Anytown",
      state: "CA",
      zipCode: "12345",
      country: "US",
    },
    settings: {},
    stripeAccountId: null,
    features: ["orders", "menu"], // Sample enabled features
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockFeatures: Features = {
    orders: true,
    menu: true,
    loyalty: false, // Disabled for demonstration
  };

  return json<LoaderData>({
    tenant: mockTenant,
    features: mockFeatures,
  });
};

// =====================================================================================
// ERROR BOUNDARY
// =====================================================================================

export function ErrorBoundary() {
  const error = useRouteError();
  
  return (
    <AdminLayout
      title="Dashboard Error"
      features={{ orders: false, menu: false, loyalty: false }}
    >
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-4">
          Something went wrong
        </h1>
        <p className="text-neutral-600 mb-6">
          We encountered an error loading the dashboard. Please try again later.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Reload Page
        </button>
      </div>
    </AdminLayout>
  );
}

// =====================================================================================
// MAIN COMPONENT
// =====================================================================================

/**
 * AdminDashboard - Main admin dashboard page
 * 
 * Features:
 * - Integration with AdminLayout for consistent structure
 * - Feature-conditional rendering based on tenant features
 * - Error boundary for graceful error handling
 * - SEO-friendly metadata
 * - Loading states and proper data fetching
 * 
 * @returns JSX.Element
 */
export default function AdminDashboard() {
  const { tenant, features } = useLoaderData<LoaderData>();

  return (
    <AdminLayout
      title="Dashboard"
      tenant={tenant as any} // AdminLayout expects TenantContext, but we have serialized version
      features={features}
      showSidebar={true}
      showFooter={true}
    >
      <Dashboard 
        tenant={tenant}
        loading={false}
      />
    </AdminLayout>
  );
}