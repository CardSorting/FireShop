'use client';

/**
 * [LAYER: UI]
 * Admin shell layout — Shopify-style collapsible sidebar with mobile drawer,
 * ⌘K command palette, and notification badges.
 */
import Link from 'next/link';
import { useCallback, useEffect, useState, useRef, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Package, 
  ClipboardList, 
  LayoutDashboard, 
  Boxes, 
  Plus,
  ChevronLeft,
  Settings,
  Store,
  ArrowLeft,
  Search,
  Command,
  Bell,
} from 'lucide-react';
import { AdminBreadcrumb, ToastProvider, ShortcutsHelp } from '../components/admin/AdminComponents';
import { CommandPalette } from '../components/admin/CommandPalette';

/* ── Nav Configuration ── */

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: 'orders';
}

const MAIN_NAV: NavItem[] = [
  { href: '/admin',           label: 'Home',      icon: LayoutDashboard },
  { href: '/admin/orders',    label: 'Orders',    icon: ClipboardList, badge: 'orders' },
  { href: '/admin/products',  label: 'Products',  icon: Package },
  { href: '/admin/inventory', label: 'Inventory', icon: Boxes },
];

const FOOTER_NAV: NavItem[] = [
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('admin-sidebar-collapsed') === 'true';
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const chordRef = useRef<string | null>(null);

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem('admin-sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Global hotkeys
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === '?') {
        setShowShortcuts(true);
      }

      if (e.key === 'Escape') {
        setMobileOpen(false);
        setShowShortcuts(false);
      }

      // Navigation chords (G + ...)
      if (e.key.toLowerCase() === 'g') {
        chordRef.current = 'g';
        setTimeout(() => { chordRef.current = null; }, 1000); // 1s window
      } else if (chordRef.current === 'g') {
        const key = e.key.toLowerCase();
        chordRef.current = null;
        if (key === 'h') router.push('/admin');
        if (key === 'o') router.push('/admin/orders');
        if (key === 'p') router.push('/admin/products');
        if (key === 'i') router.push('/admin/inventory');
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router]);

  const isActive = useCallback((href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  }, [pathname]);

  const toggleMobile = useCallback(() => setMobileOpen(prev => !prev), []);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        {/* ── Top Bar ── */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-white/80 px-4 backdrop-blur-md lg:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={toggleMobile}
              className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 lg:hidden"
              aria-label="Toggle sidebar"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <AdminBreadcrumb />
          </div>
          <div className="flex items-center gap-2">
            {/* ⌘K search trigger */}
            <button
              onClick={() => {
                // Dispatch a synthetic Cmd+K to open the command palette
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
              }}
              className="hidden md:flex items-center gap-2.5 rounded-xl border bg-gray-50/80 px-3 py-1.5 text-sm text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="text-xs">Search…</span>
              <kbd className="ml-3 flex items-center gap-0.5 rounded-md border bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-400 shadow-sm">
                <Command className="h-2.5 w-2.5" />K
              </kbd>
            </button>

            {/* Notification bell (placeholder) */}
            <button className="relative rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600">
              <Bell className="h-4 w-4" />
            </button>

            {/* User avatar */}
            <div className="hidden items-center gap-3 md:flex">
              <div className="text-right">
                <p className="text-xs font-semibold text-gray-900">Store Admin</p>
                <p className="text-[10px] text-gray-500">PlayMoreTCG</p>
              </div>
              <div className="h-8 w-8 overflow-hidden rounded-full bg-gradient-to-br from-primary-400 to-primary-600 shadow-sm">
                <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white">PM</div>
              </div>
            </div>
          </div>
        </header>
        
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
                <Link href="/admin" className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 shadow-sm">
                  <Store className="h-4 w-4 text-white" />
                </Link>
              )}
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <ChevronLeft className={`h-4 w-4 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} />
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
                {MAIN_NAV.map(({ href, label, icon: Icon, badge }) => {
                  const active = isActive(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      title={collapsed ? label : undefined}
                      className={`
                        group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150
                        ${active 
                          ? 'bg-primary-50 text-primary-700' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }
                        ${collapsed ? 'justify-center px-0' : ''}
                      `}
                    >
                      {/* Active indicator bar */}
                      {active && !collapsed && (
                        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary-600" />
                      )}
                      <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                      {!collapsed && <span>{label}</span>}
                      {/* Notification dot for orders */}
                      {badge === 'orders' && (
                        <span className={`${collapsed ? 'absolute -right-0.5 -top-0.5' : 'ml-auto'} flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-[9px] font-bold text-white shadow-sm`}>
                          •
                        </span>
                      )}
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
              {collapsed && (
                <Link
                  href="/"
                  title="Back to store"
                  className="flex justify-center rounded-xl px-3 py-2.5 text-gray-400 transition hover:bg-gray-50 hover:text-gray-700"
                >
                  <ArrowLeft className="h-[18px] w-[18px]" />
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

        {/* ── Command Palette ── */}
        <CommandPalette />

        {/* ── Shortcuts Help ── */}
        {showShortcuts && <ShortcutsHelp onClose={() => setShowShortcuts(false)} />}
      </div>
    </ToastProvider>
  );
}
