import type { MetaFunction } from "@remix-run/node";
import { Search } from "lucide-react";

export const meta: MetaFunction = () => {
  return [
    { title: "Menu - GrowPlate" },
    {
      name: "description",
      content: "Browse our delicious menu items and place your order.",
    },
  ];
};

export default function PublicMenu() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-neutral-900">Our Menu</h1>
            <button className="btn-primary">
              Start Order
            </button>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search menu items..."
            className="input pl-10 max-w-md"
          />
        </div>
      </div>

      {/* Menu Content */}
      <main className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="card">
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              Menu Coming Soon
            </h3>
            <p className="text-neutral-600 mb-6">
              The menu management system will be implemented in the next phase.
            </p>
            <div className="space-y-4">
              <div className="rounded-lg border-2 border-dashed border-neutral-300 p-6">
                <h4 className="font-medium text-neutral-900">Appetizers</h4>
                <p className="text-sm text-neutral-600 mt-1">
                  Delicious starters to begin your meal
                </p>
              </div>
              <div className="rounded-lg border-2 border-dashed border-neutral-300 p-6">
                <h4 className="font-medium text-neutral-900">Main Courses</h4>
                <p className="text-sm text-neutral-600 mt-1">
                  Our signature dishes and specialties
                </p>
              </div>
              <div className="rounded-lg border-2 border-dashed border-neutral-300 p-6">
                <h4 className="font-medium text-neutral-900">Desserts</h4>
                <p className="text-sm text-neutral-600 mt-1">
                  Sweet treats to end your meal perfectly
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}