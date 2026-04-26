'use client';

/**
 * [LAYER: UI]
 */
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Package, ClipboardList, LayoutDashboard } from 'lucide-react';

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex gap-8">
        <aside className="w-56 shrink-0">
          <nav className="space-y-1">
            <Link
              href="/admin"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href="/admin/products"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100"
            >
              <Package className="w-4 h-4" />
              Products
            </Link>
            <Link
              href="/admin/orders"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100"
            >
              <ClipboardList className="w-4 h-4" />
              Orders
            </Link>
          </nav>
        </aside>
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}