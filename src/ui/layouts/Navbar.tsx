'use client';

/**
 * [LAYER: UI]
 */
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { useCallback, useEffect, useState, useRef } from 'react';
import { ShoppingCart, Package, Shield, User, Home, Menu, X, ChevronRight, ChevronDown, Search, Zap, Truck, ShieldCheck, ArrowRight, Heart, RefreshCcw } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { CartDrawer } from '../components/CartDrawer';

import { SearchCommandPalette } from '../components/SearchCommandPalette';
import { BeeLogo, HiveCell } from '../components/Logo';

import { useWishlist } from '../hooks/useWishlist';
import { getProductUrl, getCollectionUrl, STORE_PATHS, getSearchUrl } from '@utils/navigation';

import type { NavigationMenu } from '@domain/models';


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

  const [navMenu, setNavMenu] = useState<NavigationMenu | null>(null);

  useEffect(() => {
    fetch('/api/navigation?id=main-nav')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setNavMenu(data);
      })
      .catch(console.error);
  }, []);

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

  // Listen for global open-cart event (from search palette)
  useEffect(() => {
    const handleOpenCart = () => openCart();
    window.addEventListener('open-cart', handleOpenCart);
    return () => window.removeEventListener('open-cart', handleOpenCart);
  }, [openCart]);

  const handleSignOut = async () => {
    await signOut();
    router.push(STORE_PATHS.HOME);

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

      <div className="bg-gray-900 py-2.5 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center sm:justify-between text-[10px] font-black uppercase tracking-[0.2em] text-white/90">
           <div className="hidden sm:flex items-center gap-4">
              <span className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 text-primary-500" /> Free Shipping Over $50</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-green-500" /> Handcrafted by Indie Artists</span>
           </div>

           <div className="hidden lg:flex items-center gap-4">
              <Link href="/support" className="text-white/40 hover:text-white transition-colors">Support: 24/7 Experts</Link>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                 US / USD <ChevronDown className="w-3 h-3" />
              </span>
           </div>
        </div>
      </div>

      <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-6 lg:gap-12 flex-1">
            <Link href={STORE_PATHS.HOME} className="flex items-center gap-3 text-gray-900 font-black text-2xl tracking-tighter transition-transform hover:scale-105 shrink-0">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center">
                <BeeLogo className="w-10 h-10" />
              </div>
              <span className="hidden sm:block bg-clip-text text-transparent bg-linear-to-r from-gray-900 to-primary-700">DreamBees Art</span>
            </Link>


            {/* Search Trigger - Desktop - Flat Minimalist Style */}
            <div 
              ref={searchRef}
              onClick={openSearch}
              className="hidden md:flex flex-1 max-w-sm relative group cursor-pointer"
            >
              <div className="relative w-full transition-all duration-300">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 group-hover:text-primary-600 transition-colors" />
                <div className="w-full bg-transparent border-b border-gray-100 group-hover:border-primary-500 py-1.5 pl-10 pr-2 text-[11px] text-gray-400 font-bold transition-all flex items-center justify-between">
                  <span>Search art, prints, accessories...</span>
                  <div className="flex items-center gap-1.5 opacity-20 group-hover:opacity-100 transition-opacity">
                    <kbd className="font-mono text-[8px] font-black text-gray-400 uppercase tracking-tighter">⌘K</kbd>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-8 shrink-0">
              <div className="relative group">
                <button className="flex items-center gap-2 text-sm font-black text-gray-900 group-hover:text-primary-600 transition-colors py-8 h-20 uppercase tracking-widest">
                  Shop <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180 opacity-50" />
                </button>
                
                {/* Simplified Mega-menu */}
                {navMenu && (
                  <div className="absolute top-full left-0 w-[540px] bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 z-50 ring-1 ring-black/5">
                    <div className="grid grid-cols-2 gap-12">
                      <div>
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                          {navMenu.shopCategories.title || 'Categories'}
                        </h4>
                        <ul className="space-y-4">
                          {navMenu.shopCategories.links.map((link, i) => (
                            <li key={i}>
                              <Link href={link.href} className="text-sm text-gray-600 hover:text-primary-600 transition-colors font-bold flex items-center justify-between group/link">
                                {link.label}
                                <ChevronRight className="w-3 h-3 opacity-0 group-hover/link:opacity-100 -translate-x-1 group-hover/link:translate-x-0 transition-all" />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                          {navMenu.shopCollections.title || 'Collections'}
                        </h4>
                        <ul className="space-y-4">
                          {navMenu.shopCollections.links.map((link, i) => (
                            <li key={i}>
                              <Link href={link.href} className="text-sm text-gray-600 hover:text-primary-600 transition-colors font-bold flex items-center justify-between group/link">
                                {link.label}
                                <ChevronRight className="w-3 h-3 opacity-0 group-hover/link:opacity-100 -translate-x-1 group-hover/link:translate-x-0 transition-all" />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="mt-8 pt-6 border-t border-gray-50">
                      <Link href="/products" className="text-[10px] font-black text-primary-600 uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform">
                        Browse Complete Catalog <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              {navMenu?.otherLinks.map((link, i) => (
                <Link key={i} href={link.href} className="text-sm font-black text-gray-900 hover:text-primary-600 transition-colors py-8 h-20 flex items-center uppercase tracking-widest">
                  {link.label}
                </Link>
              ))}
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
                          <Link key={p.id} href={getProductUrl(p)} className="flex items-center gap-4 group">

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
                        <Link href={STORE_PATHS.PRODUCTS} className="text-[10px] font-black text-primary-600 uppercase tracking-widest hover:text-primary-700 transition-colors flex items-center justify-between">
                          Browse More <ChevronRight className="w-3 h-3" />
                        </Link>

                      </div>
                    </div>
                  )}
                </div>
              )}

              {user && (
                <Link 
                  href={STORE_PATHS.WISHLIST} 
                  className={`p-3 rounded-2xl transition-all ${pathname === STORE_PATHS.WISHLIST ? 'bg-red-50 text-red-500 shadow-inner' : 'text-gray-400 hover:bg-gray-50 hover:text-red-500'}`}
                  aria-label="View favorites"
                >
                  <Heart className={`w-5 h-5 ${pathname === STORE_PATHS.WISHLIST ? 'fill-current' : ''}`} />
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
                      <Link href={STORE_PATHS.ACCOUNT} className="h-10 w-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-all flex items-center justify-center shadow-sm">
                        <User className="w-5 h-5" />
                      </Link>

                    )}
                  </div>
                ) : (
                  <Link
                    href={STORE_PATHS.LOGIN}
                    className="text-sm font-black text-gray-900 hover:text-primary-600 transition-colors uppercase tracking-widest"
                  >
                    Login
                  </Link>

                )}
              </div>

              {/* Mobile Menu Toggle */}
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-3 rounded-2xl text-gray-500 hover:bg-primary-50 transition-colors"
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <HiveCell className="w-6 h-6 text-primary-600" />}
              </button>
            </div>
          </div>
        </div>

      {/* Mobile Menu Overlay - Upgrade to Drawer */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" onClick={() => setIsMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-full max-w-xs bg-white shadow-2xl animate-in slide-in-from-left duration-300 ease-out flex flex-col">
            <div className="flex items-center justify-between px-6 py-6 border-b">
               <Link href={STORE_PATHS.HOME} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 text-gray-900 font-black text-xl tracking-tighter">
                 <BeeLogo className="w-8 h-8" />
                 DreamBees Art
               </Link>

               <button onClick={() => setIsMenuOpen(false)} className="p-2 rounded-xl bg-gray-50 text-gray-400"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8">
              {/* Mobile Search - Flat & Clean */}
              <div 
                onClick={openSearch}
                className="relative group cursor-pointer"
              >
                <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                <div className="w-full bg-transparent border-b border-gray-100 py-2.5 pl-8 pr-2 text-xs text-gray-400 font-black tracking-tight">
                  Search catalog...
                </div>
              </div>

              <nav className="space-y-6">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Main Navigation</h3>
                <div className="grid grid-cols-1 gap-2">
                  <Link href={STORE_PATHS.HOME} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-primary-50 text-gray-900 font-black text-sm transition-colors">
                    <Home className="w-5 h-5 text-gray-400" /> Home
                  </Link>
                  <Link href={STORE_PATHS.PRODUCTS} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-primary-50 text-gray-900 font-black text-sm transition-colors">
                    <Package className="w-5 h-5 text-gray-400" /> All Products
                  </Link>
                  <Link href={STORE_PATHS.WISHLIST} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-red-50 text-gray-900 font-black text-sm transition-colors">
                    <Heart className="w-5 h-5 text-gray-400" /> Favorites
                  </Link>

                  <Link href="/orders" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-blue-50 text-gray-900 font-black text-sm transition-colors">
                    <Truck className="w-5 h-5 text-gray-400" /> Order History
                  </Link>
                </div>

                {navMenu && (
                  <>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-8">Categories</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {navMenu.shopCategories.links.map((link, i) => (
                        <Link key={i} href={link.href} onClick={() => setIsMenuOpen(false)} className="px-4 py-3 rounded-xl border border-gray-100 text-sm font-bold text-gray-600 hover:border-primary-200 hover:text-primary-600 transition-all">
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </nav>

              <div className="pt-8 border-t border-gray-100">
                {user ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 bg-gray-50 p-6 rounded-3xl">
                      <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                        <User className="w-7 h-7 text-primary-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-gray-900 uppercase tracking-tight truncate">{user.displayName}</p>
                        <p className="text-xs text-gray-500 font-medium truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <Link href={STORE_PATHS.ACCOUNT} onClick={() => setIsMenuOpen(false)} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 py-4 text-sm font-black text-white hover:bg-black transition-all shadow-xl">
                         My Account
                      </Link>

                      <button 
                        onClick={handleSignOut}
                        className="w-full rounded-2xl border-2 border-gray-100 py-4 text-sm font-black text-gray-600 hover:bg-gray-50 transition-all"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                ) : (
                  <Link
                    href={STORE_PATHS.LOGIN}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex w-full items-center justify-center rounded-2xl bg-primary-600 py-5 text-base font-black text-white shadow-2xl shadow-primary-200"
                  >
                    Sign In
                  </Link>

                )}
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50">
               <div className="flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <span>US / USD</span>
                  <span>DreamBees Art v12.4</span>
               </div>
            </div>
          </div>
        </div>
      )}

      <CartDrawer />
    </nav>
    </>
  );
}
