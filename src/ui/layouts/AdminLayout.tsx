'use client';

/**
 * [LAYER: UI]
 * Admin shell layout — Shopify-style collapsible sidebar with mobile drawer.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { 
  Package, 
  ClipboardList, 
  LayoutDashboard, 
  Boxes, 
  Plus,
  ChevronLeft,
  Settings,
  Store,
  ArrowLeft
} from 'lucide-react';
import { AdminTopBar, ToastProvider } from '../components/admin/AdminComponents';

/* ── Nav Configuration ── */

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const MAIN_NAV: NavItem[] = [
  { href: '/admin',           label: 'Home',      icon: LayoutDashboard },
  { href: '/admin/orders',    label: 'Orders',    icon: ClipboardList },
  { href: '/admin/products',  label: 'Products',  icon: Package },
  { href: '/admin/inventory', label: 'Inventory', icon: Boxes },
];

const FOOTER_NAV: NavItem[] = [
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close mobile nav on escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const isActive = useCallback((href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  }, [pathname]);

  const toggleMobile = useCallback(() => setMobileOpen(prev => !prev), []);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        <AdminTopBar onToggleSidebar={toggleMobile} />
        
        <div className="flex">
          {/* ── Mobile Overlay ── */}
          {mobileOpen && (
            <div 
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm backdrop-enter lg:hidden" 
              onClick={() => setMobileOpen(false)} 
            />
          )}

          {/* ── Sidebar ── */}
          <aside 
            className={`
              fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-white
              transition-all duration-200 ease-in-out
              lg:sticky lg:top-14 lg:z-auto lg:h-[calc(100vh-3.5rem)]
              ${collapsed ? 'lg:w-[68px]' : 'lg:w-[240px]'}
              ${mobileOpen ? 'w-[280px] translate-x-0 shadow-2xl' : 'w-[280px] -translate-x-full lg:translate-x-0'}
            `}
          >
            {/* Store header */}
            <div className={`flex items-center border-b px-4 ${collapsed ? 'justify-center py-4' : 'justify-between py-3'}`}>
              {!collapsed && (
                <Link href="/admin" className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 shadow-sm">
                    <Store className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-gray-900">PlayMoreTCG</p>
                    <p className="text-[10px] text-gray-400">Admin Panel</p>
                  </div>
                </Link>
              )}
              {collapsed && (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 shadow-sm">
                  <Store className="h-4 w-4 text-white" />
                </div>
              )}
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
              </button>
              {/* Mobile close */}
              <button
                onClick={() => setMobileOpen(false)}
                className="lg:hidden flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>

            {/* Main nav */}
            <nav className="flex-1 overflow-y-auto styled-scrollbar px-3 py-4">
              <div className="space-y-1">
                {MAIN_NAV.map(({ href, label, icon: Icon }) => {
                  const active = isActive(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      title={collapsed ? label : undefined}
                      className={`
                        group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150
                        ${active 
                          ? 'bg-primary-50 text-primary-700' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }
                        ${collapsed ? 'justify-center px-0' : ''}
                      `}
                    >
                      <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                      {!collapsed && <span>{label}</span>}
                    </Link>
                  );
                })}
              </div>

              {/* Quick action */}
              {!collapsed && (
                <div className="mt-6 px-1">
                  <Link
                    href="/admin/products/new"
                    className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-500 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
                  >
                    <Plus className="h-4 w-4" />
                    Add product
                  </Link>
                </div>
              )}
              {collapsed && (
                <div className="mt-6 flex justify-center">
                  <Link
                    href="/admin/products/new"
                    title="Add product"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 text-gray-400 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-600"
                  >
                    <Plus className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </nav>

            {/* Footer nav */}
            <div className="border-t px-3 py-3 space-y-1">
              {FOOTER_NAV.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    title={collapsed ? label : undefined}
                    className={`
                      group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150
                      ${active 
                        ? 'bg-primary-50 text-primary-700' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }
                      ${collapsed ? 'justify-center px-0' : ''}
                    `}
                  >
                    <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                    {!collapsed && <span>{label}</span>}
                  </Link>
                );
              })}

              {/* Return to storefront */}
              {!collapsed && (
                <Link
                  href="/"
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-400 transition hover:bg-gray-50 hover:text-gray-700"
                >
                  <ArrowLeft className="h-[18px] w-[18px]" />
                  Back to store
                </Link>
              )}
            </div>
          </aside>
          
          {/* ── Main Content ── */}
          <main className="flex-1 min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto max-w-[1200px]">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
