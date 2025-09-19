import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { ChefHat, Store, Users, Zap } from "lucide-react";

export const meta: MetaFunction = () => {
  return [
    { title: "GrowPlate - Multi-Tenant Restaurant Management Platform" },
    {
      name: "description",
      content: "Powerful restaurant management platform with multi-tenant support for modern restaurants.",
    },
  ];
};

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ChefHat className="h-8 w-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-neutral-900">GrowPlate</h1>
            </div>
            <nav className="flex space-x-4">
              <Link
                to="/admin"
                className="btn-primary"
              >
                Admin Dashboard
              </Link>
              <Link
                to="/menu"
                className="btn-outline"
              >
                View Menu
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-6xl">
            Modern Restaurant
            <span className="text-primary-600"> Management</span>
          </h2>
          <p className="mt-6 text-lg leading-8 text-neutral-600">
            Empower your restaurant with our multi-tenant platform. Manage orders, 
            loyalty programs, and menus all in one place.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              to="/admin"
              className="btn-primary text-base px-8 py-3"
            >
              Get Started
            </Link>
            <Link
              to="/menu"
              className="btn-ghost text-base px-8 py-3"
            >
              View Demo Menu
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="card text-center">
              <Store className="mx-auto h-12 w-12 text-primary-600" />
              <h3 className="mt-4 text-lg font-semibold text-neutral-900">
                Multi-Tenant Architecture
              </h3>
              <p className="mt-2 text-neutral-600">
                Each restaurant gets their own domain while sharing infrastructure.
              </p>
            </div>
            
            <div className="card text-center">
              <Users className="mx-auto h-12 w-12 text-secondary-600" />
              <h3 className="mt-4 text-lg font-semibold text-neutral-900">
                Customer Loyalty
              </h3>
              <p className="mt-2 text-neutral-600">
                Built-in loyalty system to retain customers and increase revenue.
              </p>
            </div>
            
            <div className="card text-center">
              <Zap className="mx-auto h-12 w-12 text-primary-600" />
              <h3 className="mt-4 text-lg font-semibold text-neutral-900">
                Real-time Orders
              </h3>
              <p className="mt-2 text-neutral-600">
                Live order management with instant updates and notifications.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-neutral-600">
            <p>&copy; 2024 GrowPlate. Multi-tenant restaurant management platform.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}