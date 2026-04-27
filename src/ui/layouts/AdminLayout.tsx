'use client';

/**
 * [LAYER: UI]
 * Admin shell layout — High-performance merchant console with grouped navigation,
 * ⌘K command palette, and refined typography inspired by Stripe and Shopify.
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
  User,
  ExternalLink,
  ChevronDown,
  HelpCircle,
  Megaphone,
  Shield,
  BarChart3,
} from 'lucide-react';
import { AdminBreadcrumb, ToastProvider, ShortcutsHelp, AdminNotificationBell } from '../components/admin/AdminComponents';
import { CommandPalette } from '../components/admin/CommandPalette';

/* ── Nav Configuration ── */

interface NavGroup {
  title?: string;
  items: NavItem[];
}

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: 'orders';
}

const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { href: '/admin', label: 'Home', icon: LayoutDashboard },
    ]
  },
  {
    title: 'Management',
    items: [
      { href: '/admin/orders',    label: 'Orders',    icon: ClipboardList, badge: 'orders' },
      { href: '/admin/products',  label: 'Products',  icon: Package },
      { href: '/admin/inventory', label: 'Inventory', icon: Boxes },
      { href: '/admin/customers', label: 'Customers', icon: User },
    ]
  },
  {
    title: 'Insights',
    items: [
      { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/admin/audit',     label: 'Audit Logs', icon: Shield },
    ]
  },
  {
    title: 'Marketing',
    items: [
      { href: '/admin/discounts', label: 'Discounts', icon: Megaphone },
    ]
  }
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
  const openSearch = () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#F6F6F7]">
        {/* ── Top Bar (Mobile Only) ── */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-white/80 px-4 backdrop-blur-md lg:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMobile}
              className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 lg:hidden"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <AdminBreadcrumb />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={openSearch} className="p-2 text-gray-400 transition hover:text-gray-900">
              <Search className="h-5 w-5" />
            </button>
            <AdminNotificationBell />
            <div className="h-8 w-8 rounded-full bg-linear-to-br from-primary-400 to-primary-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm ml-2">PM</div>
          </div>
        </header>
        
        <div className="flex">
          {/* ── Mobile Overlay ── */}
          {mobileOpen && (
            <div 
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" 
              onClick={() => setMobileOpen(false)} 
            />
          )}

          {/* ── Sidebar ── */}
          <aside 
            className={`
              fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-[#EBEBED]
              transition-all duration-200 ease-in-out
              lg:sticky lg:top-0 lg:h-screen
              ${collapsed ? 'lg:w-[64px]' : 'lg:w-[240px]'}
              ${mobileOpen ? 'w-[280px] translate-x-0 shadow-2xl' : 'w-[280px] -translate-x-full lg:translate-x-0'}
            `}
          >
            {/* Store Switcher / Header */}
            <div className="p-3">
              <div className={`flex items-center gap-3 rounded-lg p-2 transition hover:bg-gray-200 cursor-pointer ${collapsed ? 'justify-center' : ''}`}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-black/5">
                  <Store className="h-4 w-4 text-gray-600" />
                </div>
                {!collapsed && (
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900 leading-tight">PlayMoreTCG</p>
                    <p className="text-[10px] text-gray-500 font-medium">Merchant Admin</p>
                  </div>
                )}
                {!collapsed && <ChevronDown className="h-3.5 w-3.5 text-gray-400" />}
              </div>
            </div>

            {/* Main Navigation Scroll Area */}
            <div className="flex-1 overflow-y-auto px-2 py-1 scrollbar-hide">
              {/* Sidebar Search Button */}
              <div className="mb-4 mt-1">
                <button
                  onClick={openSearch}
                  className={`
                    flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm text-gray-500 transition hover:bg-gray-200
                    ${collapsed ? 'justify-center' : ''}
                  `}
                >
                  <Search className="h-[18px] w-[18px]" />
                  {!collapsed && <span className="flex-1 text-left">Search</span>}
                  {!collapsed && (
                    <kbd className="flex items-center gap-0.5 rounded border bg-white px-1 py-0.5 text-[9px] font-medium text-gray-400">
                      <Command className="h-2 w-2" />K
                    </kbd>
                  )}
                </button>
              </div>

              <div className="space-y-6">
                {NAV_GROUPS.map((group, idx) => (
                  <div key={idx}>
                    {group.title && !collapsed && (
                      <h4 className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        {group.title}
                      </h4>
                    )}
                    <div className="space-y-0.5">
                      {group.items.map(({ href, label, icon: Icon, badge }) => {
                        const active = isActive(href);
                        return (
                          <Link
                            key={href}
                            href={href}
                            className={`
                              group flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150
                              ${active 
                                ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' 
                                : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                              }
                              ${collapsed ? 'justify-center px-0' : ''}
                            `}
                          >
                            <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-primary-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
                            {!collapsed && <span>{label}</span>}
                            {badge === 'orders' && !collapsed && (
                              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-[10px] font-bold text-white">
                                3
                              </span>
                            )}
                            {badge === 'orders' && collapsed && (
                              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary-500 ring-2 ring-[#EBEBED]" />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* View Storefront Section */}
              <div className="mt-8 border-t border-gray-300/50 pt-4 pb-2">
                {!collapsed && (
                  <h4 className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Sales Channels
                  </h4>
                )}
                <Link
                  href="/"
                  className={`
                    group flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-200 hover:text-gray-900
                    ${collapsed ? 'justify-center px-0' : ''}
                  `}
                >
                  <ExternalLink className="h-[18px] w-[18px] text-gray-500" />
                  {!collapsed && <span className="flex-1">Online Store</span>}
                  {!collapsed && <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-40" />}
                </Link>
              </div>
            </div>

            {/* Sidebar Footer */}
            <div className="border-t border-gray-300/50 p-2 space-y-0.5">
              <Link
                href="/admin/settings"
                className={`
                  flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-200
                  ${isActive('/admin/settings') ? 'bg-white text-gray-900 shadow-sm' : ''}
                  ${collapsed ? 'justify-center px-0' : ''}
                `}
              >
                <Settings className="h-[18px] w-[18px]" />
                {!collapsed && <span>Settings</span>}
              </Link>

              {/* Help & Support */}
              <button
                className={`
                  flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-200
                  ${collapsed ? 'justify-center px-0' : ''}
                `}
              >
                <HelpCircle className="h-[18px] w-[18px]" />
                {!collapsed && <span>Help</span>}
              </button>

              {/* User Profile */}
              <div className={`mt-2 flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-gray-200 cursor-pointer ${collapsed ? 'justify-center' : ''}`}>
                <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-linear-to-br from-primary-400 to-primary-600 shadow-sm">
                  <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-white">PM</div>
                </div>
                {!collapsed && (
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-gray-900 leading-tight">Admin User</p>
                  </div>
                )}
              </div>
            </div>

            {/* Collapse Trigger */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="absolute -right-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border bg-white text-gray-400 shadow-sm transition hover:bg-gray-50 hover:text-gray-600 lg:flex"
            >
              <ChevronLeft className={`h-3 w-3 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} />
            </button>
          </aside>
          
          {/* ── Main Content Area ── */}
          <div className="flex-1 flex flex-col min-h-screen min-w-0">
            {/* Dynamic Breadcrumbs / Desktop Top Bar */}
            <header className="hidden lg:flex h-12 shrink-0 items-center justify-between border-b bg-white/50 px-8 backdrop-blur-sm">
              <AdminBreadcrumb />
              <div className="flex items-center gap-6">
                {/* Quick Actions Menu */}
                <div className="relative group">
                  <button className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-[10px] font-bold text-white shadow-sm transition hover:bg-primary-700 active:scale-95">
                    <Plus className="h-3.5 w-3.5" />
                    Create
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </button>
                  <div className="invisible absolute right-0 top-full mt-2 w-48 origin-top-right rounded-xl border bg-white p-1 shadow-2xl transition-all opacity-0 group-hover:visible group-hover:opacity-100 z-50">
                     <button onClick={() => router.push('/admin/products/new')} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-gray-700 hover:bg-gray-50 transition">
                       <Package className="h-3.5 w-3.5 text-gray-400" />
                       Add product
                     </button>
                     <button onClick={() => router.push('/admin/orders')} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-gray-700 hover:bg-gray-50 transition">
                       <Plus className="h-3.5 w-3.5 text-gray-400" />
                       Draft order
                     </button>
                     <button onClick={() => router.push('/admin/discounts')} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-gray-700 hover:bg-gray-50 transition">
                       <Megaphone className="h-3.5 w-3.5 text-gray-400" />
                       Create discount
                     </button>
                  </div>
                </div>

                <AdminNotificationBell />
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                  Store is live
                </div>
              </div>
            </header>

            <main className="flex-1 px-4 py-8 sm:px-8 lg:px-12 max-w-6xl">
              {children}
            </main>
          </div>
        </div>

        {/* ── Overlays ── */}
        <CommandPalette />
        {showShortcuts && <ShortcutsHelp onClose={() => setShowShortcuts(false)} />}
      </div>
    </ToastProvider>
  );
}
