'use client';

/**
 * [LAYER: UI]
 */
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { useCallback, useEffect, useState, useRef } from 'react';
import { ShoppingCart, Package, Shield, User, Home, Menu, X, ChevronRight, Search, Sparkles, Archive, Layers3 } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { CartDrawer } from '../components/CartDrawer';

const SHOP_LINKS = [
  { href: '/products', label: 'Shop all', icon: Package },
  { href: '/products?category=single', label: 'Singles', icon: Sparkles },
  { href: '/products?category=booster', label: 'Sealed', icon: Archive },
  { href: '/products?category=accessory', label: 'Accessories', icon: Layers3 },
];

import { SearchCommandPalette } from '../components/SearchCommandPalette';

export function Navbar() {
  const { user, signOut } = useAuth();
  const { totalItems, openCart } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    openSearch();
    setIsMenuOpen(false);
  };

  // Toggle Command Palette via window event or local state
  const openSearch = (e?: React.MouseEvent) => {
    e?.preventDefault();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
  };

  return (
    <>
      <SearchCommandPalette />
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:bg-white focus:px-6 focus:py-3 focus:font-bold focus:text-primary-600 focus:shadow-2xl focus:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        Skip to main content
      </a>

      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4 lg:gap-8 flex-1">
            <Link href="/" className="flex items-center gap-2 text-primary-700 font-bold text-xl transition-transform hover:scale-105 shrink-0">
              <Package className="w-7 h-7" />
              <span className="hidden sm:block tracking-tight">PlayMoreTCG</span>
            </Link>

            {/* Command Palette Trigger - Desktop */}
            <div 
              ref={searchRef}
              onClick={openSearch}
              className="hidden md:flex flex-1 max-w-md relative group cursor-pointer"
            >
              <div className="relative w-full transition-all duration-300 group-hover:scale-[1.02]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
                <div className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-sm text-gray-400 group-hover:bg-white group-hover:border-primary-500 transition-all flex items-center justify-between">
                  <span>Search cards, sets, or categories...</span>
                  <div className="flex items-center gap-1">
                    <kbd className="h-5 rounded border bg-white px-1.5 font-mono text-[10px] font-bold text-gray-400">⌘</kbd>
                    <kbd className="h-5 rounded border bg-white px-1.5 font-mono text-[10px] font-bold text-gray-400">K</kbd>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-5 shrink-0">
              <Link href="/" className={`text-sm font-bold transition-colors ${pathname === '/' ? 'text-primary-600' : 'text-gray-500 hover:text-gray-900'}`}>
                Home
              </Link>
              {SHOP_LINKS.map((item) => (
                <Link key={item.href} href={item.href} className={`text-sm font-bold transition-colors ${pathname.startsWith('/products') && item.href === '/products' ? 'text-primary-600' : 'text-gray-500 hover:text-gray-900'}`}>
                  {item.label}
                </Link>
              ))}
              {user && (
                <Link href="/orders" className={`text-sm font-bold transition-colors ${pathname.startsWith('/orders') ? 'text-primary-600' : 'text-gray-500 hover:text-gray-900'}`}>
                  Orders
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 ml-4">
            <button 
              onClick={openCart}
              className="group flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5 text-gray-700 transition-all hover:bg-gray-100 relative"
              aria-label="Open cart"
            >
              <ShoppingCart className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
              <span className="hidden sm:inline text-sm font-bold">Cart</span>
              {totalItems > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-600 px-1.5 text-[10px] font-black text-white shadow-sm">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </button>

            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4 pl-4 border-l">
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-black text-gray-900 leading-tight uppercase tracking-wider">{user.displayName}</span>
                    <button onClick={handleSignOut} className="text-[10px] font-bold text-gray-400 hover:text-red-600 uppercase tracking-widest">Sign Out</button>
                  </div>
                  {user.role === 'admin' && (
                    <Link href="/admin" className="p-2 rounded-full bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors">
                      <Shield className="w-5 h-5" />
                    </Link>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="rounded-xl bg-primary-600 px-5 py-2 text-sm font-black text-white shadow-md shadow-primary-100 transition hover:bg-primary-700 hover:shadow-lg active:scale-95"
                >
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-white animate-in slide-in-from-top duration-200 shadow-xl overflow-hidden">
          <div className="px-4 py-6 space-y-6">
            {/* Mobile Search */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search cards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </form>

            <div className="space-y-1">
              <Link href="/" className="flex items-center justify-between rounded-xl px-4 py-3 text-base font-black text-gray-900 hover:bg-gray-50 transition-colors">
                <span className="flex items-center gap-3"><Home className="w-5 h-5 text-gray-400" /> Home</span>
                <ChevronRight className="h-4 w-4 text-gray-300" />
              </Link>
              {SHOP_LINKS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className="flex items-center justify-between rounded-xl px-4 py-3 text-base font-black text-gray-900 hover:bg-gray-50 transition-colors">
                    <span className="flex items-center gap-3"><Icon className="w-5 h-5 text-gray-400" /> {item.label}</span>
                    <ChevronRight className="h-4 w-4 text-gray-300" />
                  </Link>
                );
              })}
              {user && (
                <Link href="/orders" className="flex items-center justify-between rounded-xl px-4 py-3 text-base font-black text-gray-900 hover:bg-gray-50 transition-colors">
                  <span className="flex items-center gap-3"><ShoppingCart className="w-5 h-5 text-gray-400" /> My Orders</span>
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </Link>
              )}
            </div>
            
            <div className="pt-6 border-t">
              {user ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl">
                    <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                      <User className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{user.displayName}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <button 
                      onClick={handleSignOut}
                      className="w-full rounded-xl bg-gray-900 py-3 text-sm font-black text-white hover:bg-black shadow-lg shadow-gray-200 transition-all"
                    >
                      Sign Out
                    </button>
                    {user.role === 'admin' && (
                      <Link href="/admin" className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-50 py-3 text-sm font-black text-primary-600 transition-colors">
                        <Shield className="w-4 h-4" /> Admin Dashboard
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex w-full items-center justify-center rounded-xl bg-primary-600 py-4 text-base font-black text-white shadow-lg shadow-primary-200"
                >
                  Sign In to Your Account
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      <CartDrawer />
    </nav>
    </>
  );
}