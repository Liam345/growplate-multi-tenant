import type { MetaFunction } from "@remix-run/node";
import { BarChart3, Menu, ShoppingCart, Users } from "lucide-react";

export const meta: MetaFunction = () => {
  return [
    { title: "Admin Dashboard - GrowPlate" },
    {
      name: "description",
      content: "Restaurant admin dashboard for managing orders, menu, and customers.",
    },
  ];
};

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-neutral-900">
            Restaurant Dashboard
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShoppingCart className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">
                  Total Orders
                </p>
                <p className="text-2xl font-semibold text-neutral-900">--</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-8 w-8 text-secondary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">
                  Revenue
                </p>
                <p className="text-2xl font-semibold text-neutral-900">--</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">
                  Customers
                </p>
                <p className="text-2xl font-semibold text-neutral-900">--</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Menu className="h-8 w-8 text-secondary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">
                  Menu Items
                </p>
                <p className="text-2xl font-semibold text-neutral-900">--</p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Placeholders */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button className="btn-primary w-full">
                Manage Menu Items
              </button>
              <button className="btn-secondary w-full">
                View Recent Orders
              </button>
              <button className="btn-outline w-full">
                Loyalty Settings
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm text-neutral-600">
                <div className="h-2 w-2 bg-green-500 rounded-full mr-3"></div>
                System initialized successfully
              </div>
              <div className="flex items-center text-sm text-neutral-600">
                <div className="h-2 w-2 bg-blue-500 rounded-full mr-3"></div>
                Database schema ready
              </div>
              <div className="flex items-center text-sm text-neutral-600">
                <div className="h-2 w-2 bg-yellow-500 rounded-full mr-3"></div>
                Awaiting menu setup
              </div>
            </div>
          </div>
        </div>

        {/* Development Notice */}
        <div className="mt-8">
          <div className="rounded-md bg-blue-50 p-4">
            <div className="text-sm">
              <h4 className="font-medium text-blue-800">Development Mode</h4>
              <p className="mt-1 text-blue-700">
                This is a placeholder dashboard. Features will be implemented in subsequent tasks.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}