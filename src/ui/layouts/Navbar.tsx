'use client';

/**
 * [LAYER: UI]
 */
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { useCallback, useEffect, useState, useRef } from 'react';
import { ShoppingCart, Package, Shield, User, Home, Menu, X, ChevronRight, Search, Sparkles, Archive, Layers3, Heart, RefreshCcw } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { CartDrawer } from '../components/CartDrawer';

const SHOP_LINKS = [
  { href: '/products', label: 'All Products', icon: Package },
  { href: '/products?category=new', label: 'New Arrivals', icon: Sparkles },
  { href: '/products?category=featured', label: 'Featured', icon: Layers3 },
];

import { SearchCommandPalette } from '../components/SearchCommandPalette';

import { useWishlist } from '../hooks/useWishlist';

export function Navbar() {
  const { user, signOut } = useAuth();
  const { totalItems, openCart } = useCart();
  const { recentlyViewed } = useWishlist();
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRecent, setShowRecent] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const recentRef = useRef<HTMLDivElement>(null);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setShowRecent(false);
  }, [pathname]);

  // Click outside to close recent
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (recentRef.current && !recentRef.current.contains(e.target as Node)) {
        setShowRecent(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    openSearch();
    setIsMenuOpen(false);
  };

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

      <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-6 lg:gap-12 flex-1">
            <Link href="/" className="flex items-center gap-3 text-gray-900 font-black text-2xl tracking-tighter transition-transform hover:scale-105 shrink-0">
              <div className="h-10 w-10 rounded-xl bg-gray-900 flex items-center justify-center text-white shadow-xl shadow-gray-200">
                <Package className="w-6 h-6" />
              </div>
              <span className="hidden sm:block">ShopMore</span>
            </Link>

            {/* Command Palette Trigger - Desktop */}
            <div 
              ref={searchRef}
              onClick={openSearch}
              className="hidden md:flex flex-1 max-w-sm relative group cursor-pointer"
            >
              <div className="relative w-full transition-all duration-300 group-hover:scale-[1.02]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
                <div className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-2.5 pl-12 pr-4 text-sm text-gray-400 font-bold group-hover:bg-white group-hover:border-primary-500 group-hover:shadow-lg group-hover:shadow-black/5 transition-all flex items-center justify-between">
                  <span>Search...</span>
                  <div className="flex items-center gap-1.5 opacity-50 group-hover:opacity-100 transition-opacity">
                    <kbd className="h-6 rounded-lg border bg-white px-2 font-mono text-[10px] font-black text-gray-400 shadow-sm">⌘K</kbd>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-10 shrink-0">
              <div className="relative group">
                <button className="flex items-center gap-1 text-sm font-black tracking-tight text-gray-400 group-hover:text-gray-900 transition-colors py-8">
                  Catalog <ChevronRight className="w-3 h-3 rotate-90 transition-transform group-hover:-rotate-90" />
                </button>
                
                {/* Mega-menu style dropdown */}
                <div className="absolute top-full left-0 w-[480px] bg-white rounded-4xl shadow-2xl border border-gray-100 p-8 opacity-0 translate-y-4 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 z-50 ring-1 ring-black/5">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Categories</h4>
                      <div className="space-y-4">
                        {SHOP_LINKS.map(link => (
                          <Link key={link.href} href={link.href} className="flex items-center gap-4 group/item">
                            <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover/item:bg-primary-50 group-hover/item:text-primary-600 transition-colors">
                              <link.icon className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-black text-gray-900 group-hover/item:text-primary-600 transition-colors">{link.label}</p>
                              <p className="text-[10px] text-gray-400 font-bold italic">Explore the latest</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-3xl p-6">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Featured</h4>
                      <div className="aspect-4/3 rounded-2xl bg-white overflow-hidden mb-4 shadow-sm border border-gray-100">
                        <img src="https://images.unsplash.com/photo-1613771404721-1f92d799e49f?w=400&h=300&fit=crop" alt="Featured Card" className="w-full h-full object-cover" />
                      </div>
                      <p className="text-xs font-black text-gray-900 mb-1">Weekly Highlights</p>
                      <Link href="/products" className="text-[10px] font-bold text-primary-600 uppercase tracking-widest hover:underline">Shop Now</Link>
                    </div>
                  </div>
                </div>
              </div>
              <Link href="/products?category=new" className="text-sm font-black tracking-tight text-gray-400 hover:text-gray-900 transition-colors">
                New Arrivals
              </Link>
              <Link href="/wishlist" className="text-sm font-black tracking-tight text-gray-400 hover:text-gray-900 transition-colors">
                Personal Collection
              </Link>
            </div>
          </div>

            <div className="flex items-center gap-1 sm:gap-3 ml-4">
              {/* Recently Viewed Trigger */}
              {recentlyViewed.length > 0 && (
                <div className="relative hidden sm:block" ref={recentRef}>
                  <button 
                    onClick={() => setShowRecent(!showRecent)}
                    className={`p-3 rounded-2xl transition-all ${showRecent ? 'bg-gray-100 text-gray-900 shadow-inner' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'}`}
                    aria-label="Recently viewed"
                  >
                    <RefreshCcw className={`w-5 h-5 ${showRecent ? 'animate-spin-once' : ''}`} />
                  </button>

                  {showRecent && (
                    <div className="absolute right-0 top-full mt-4 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300 ring-1 ring-black/5">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Recently Viewed</h4>
                      <div className="space-y-4">
                        {recentlyViewed.slice(0, 4).map(p => (
                          <Link key={p.id} href={`/products/${p.id}`} className="flex items-center gap-4 group">
                            <div className="h-14 w-14 rounded-xl bg-gray-50 border overflow-hidden shrink-0">
                              <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-black text-gray-900 truncate group-hover:text-primary-600 transition-colors">{p.name}</p>
                              <p className="text-[10px] font-bold text-gray-400">${(p.price / 100).toFixed(2)}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                      <div className="mt-6 pt-6 border-t border-gray-50">
                        <Link href="/products" className="text-[10px] font-black text-primary-600 uppercase tracking-widest hover:text-primary-700 transition-colors flex items-center justify-between">
                          Browse More <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {user && (
                <Link 
                  href="/wishlist" 
                  className={`p-3 rounded-2xl transition-all ${pathname === '/wishlist' ? 'bg-red-50 text-red-500 shadow-inner' : 'text-gray-400 hover:bg-gray-50 hover:text-red-500'}`}
                  aria-label="View favorites"
                >
                  <Heart className={`w-5 h-5 ${pathname === '/wishlist' ? 'fill-current' : ''}`} />
                </Link>
              )}
              
              <button 
                onClick={openCart}
                className="group flex items-center gap-2 rounded-2xl bg-gray-900 px-4 py-2.5 text-white shadow-xl shadow-gray-200 transition-all hover:bg-black hover:-translate-y-0.5 active:translate-y-0"
                aria-label="Open cart"
              >
                <ShoppingCart className="w-4 h-4 text-white/70 group-hover:text-white" />
                <span className="hidden sm:inline text-xs font-black uppercase tracking-widest">Cart</span>
                {totalItems > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-500 px-1.5 text-[9px] font-black text-white ring-2 ring-gray-900">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </button>

              <div className="hidden md:flex items-center gap-4 pl-4 border-l border-gray-100">
                {user ? (
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest leading-none">{user.displayName}</span>
                      <button onClick={handleSignOut} className="text-[9px] font-bold text-gray-400 hover:text-red-600 uppercase tracking-[0.2em] mt-1 transition-colors">Sign Out</button>
                    </div>
                    {user.role === 'admin' ? (
                      <Link href="/admin" className="h-10 w-10 rounded-xl bg-primary-50 text-primary-600 hover:bg-primary-100 transition-all flex items-center justify-center shadow-sm">
                        <Shield className="w-5 h-5" />
                      </Link>
                    ) : (
                      <Link href="/orders" className="h-10 w-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-all flex items-center justify-center shadow-sm">
                        <Package className="w-5 h-5" />
                      </Link>
                    )}
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="text-sm font-black text-gray-900 hover:text-primary-600 transition-colors uppercase tracking-widest"
                  >
                    Login
                  </Link>
                )}
              </div>

              {/* Mobile Menu Toggle */}
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-3 rounded-2xl text-gray-500 hover:bg-gray-50 transition-colors"
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white animate-in slide-in-from-top-4 duration-300 shadow-2xl overflow-hidden fixed inset-x-0 top-20 z-50 h-[calc(100vh-5rem)]">
          <div className="px-6 py-8 space-y-8 h-full overflow-y-auto">
            {/* Mobile Search */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search catalog..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary-500"
              />
            </form>

            <div className="grid grid-cols-2 gap-4">
              <Link href="/" className="flex flex-col gap-3 rounded-3xl p-6 bg-gray-50 hover:bg-primary-50 transition-colors group">
                <Home className="w-6 h-6 text-gray-400 group-hover:text-primary-600" />
                <span className="text-sm font-black text-gray-900">Home</span>
              </Link>
              <Link href="/products" className="flex flex-col gap-3 rounded-3xl p-6 bg-gray-50 hover:bg-primary-50 transition-colors group">
                <Package className="w-6 h-6 text-gray-400 group-hover:text-primary-600" />
                <span className="text-sm font-black text-gray-900">Catalog</span>
              </Link>
              {user && (
                <>
                  <Link href="/wishlist" className="flex flex-col gap-3 rounded-3xl p-6 bg-gray-50 hover:bg-red-50 transition-colors group">
                    <Heart className="w-6 h-6 text-gray-400 group-hover:text-red-500" />
                    <span className="text-sm font-black text-gray-900">Favorites</span>
                  </Link>
                  <Link href="/orders" className="flex flex-col gap-3 rounded-3xl p-6 bg-gray-50 hover:bg-primary-50 transition-colors group">
                    <ShoppingCart className="w-6 h-6 text-gray-400 group-hover:text-primary-600" />
                    <span className="text-sm font-black text-gray-900">Orders</span>
                  </Link>
                </>
              )}
            </div>
            
            <div className="pt-8 border-t border-gray-100">
              {user ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 bg-gray-50 p-6 rounded-3xl">
                    <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                      <User className="w-7 h-7 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{user.displayName}</p>
                      <p className="text-xs text-gray-500 font-medium">{user.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <button 
                      onClick={handleSignOut}
                      className="w-full rounded-2xl bg-gray-900 py-5 text-sm font-black text-white hover:bg-black shadow-xl shadow-gray-200 transition-all"
                    >
                      Sign Out
                    </button>
                    {user.role === 'admin' && (
                      <Link href="/admin" className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-50 py-5 text-sm font-black text-primary-600 transition-colors">
                        <Shield className="w-4 h-4" /> Admin Panel
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex w-full items-center justify-center rounded-2xl bg-primary-600 py-5 text-base font-black text-white shadow-2xl shadow-primary-200"
                >
                  Sign In to ShopMore
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
