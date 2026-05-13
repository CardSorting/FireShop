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
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const recentRef = useRef<HTMLDivElement>(null);

  const [navMenu, setNavMenu] = useState<NavigationMenu | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/navigation?id=main-nav', { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (!controller.signal.aborted && !data.error) setNavMenu(data);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') console.error(err);
      });
    return () => controller.abort();
  }, []);

  // Handle scroll and progress
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
      setScrollProgress(scrolled);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
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

      <nav className="bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-nav transition-all header-honey-drip">
        {/* Nectar Progress Bar */}
        <div 
          className="absolute bottom-0 left-0 h-0.5 bg-primary-500 z-nav transition-all duration-300"
          style={{ width: `${scrollProgress}%` }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-12">
            <Link href={STORE_PATHS.HOME} rel="home" title="DreamBeesArt Home" className="flex items-center gap-2 text-gray-900 font-black text-xl tracking-tighter transition-transform hover:scale-105 shrink-0">
              <BeeLogo className="w-8 h-8" />
              <span className="hidden sm:block bg-clip-text text-transparent bg-linear-to-r from-gray-900 to-primary-700">DreamBees</span>
            </Link>

            <div className="hidden lg:flex items-center gap-8 shrink-0">
              <div className="relative group">
                <button className="flex items-center gap-2 text-[11px] font-black text-gray-500 hover:text-gray-900 transition-colors py-8 h-20 uppercase tracking-[0.2em]">
                  Shop <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:rotate-180 opacity-50" />
                </button>
                
                {/* Simplified Mega-menu */}
                {navMenu && (
                  <div className="absolute top-full -left-12 w-[600px] bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 z-nav ring-1 ring-black/5">
                    <div className="grid grid-cols-3 gap-8">
                      <div>
                        <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
                          {navMenu.shopCategories.title || 'Categories'}
                        </h4>
                        <ul className="space-y-3">
                          {navMenu.shopCategories.links.map((link, i) => (
                            <li key={i}>
                              <Link href={link.href} className="text-[13px] text-gray-600 hover:text-primary-600 transition-colors font-bold flex items-center justify-between group/link">
                                {link.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
                          {navMenu.shopCollections.title || 'Collections'}
                        </h4>
                        <ul className="space-y-3">
                          {navMenu.shopCollections.links.map((link, i) => (
                            <li key={i}>
                              <Link href={link.href} className="text-[13px] text-gray-600 hover:text-primary-600 transition-colors font-bold flex items-center justify-between group/link">
                                {link.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-gray-50/50 rounded-2xl p-6">
                        <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Discovery</h4>
                        <ul className="space-y-3">
                          <li>
                            <Link href="/products" className="text-[13px] text-gray-900 hover:text-primary-600 transition-colors font-black flex items-center gap-2">
                              All Products <ArrowRight className="w-3 h-3" />
                            </Link>
                          </li>
                          <li>
                            <Link href="/support" className="text-[13px] text-gray-600 hover:text-primary-600 transition-colors font-bold">
                              Help Center
                            </Link>
                          </li>
                          <li>
                            <Link href="/track-order" className="text-[13px] text-gray-600 hover:text-primary-600 transition-colors font-bold">
                              Track Order
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <Link href="/blog" className="text-[11px] font-black text-gray-500 hover:text-gray-900 transition-colors py-8 h-20 flex items-center uppercase tracking-[0.2em]">
                Journal
              </Link>
            </div>
          </div>

            <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-end">
              {/* Compact Search Trigger */}
              <button 
                onClick={openSearch}
                className="hidden md:flex items-center gap-3 px-4 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-400 transition-all border border-transparent hover:border-gray-200 group"
              >
                <Search className="w-4 h-4 group-hover:text-primary-600" />
                <span className="text-[11px] font-bold uppercase tracking-widest hidden lg:inline">Search...</span>
                <kbd className="hidden xl:inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-gray-200 bg-white text-[8px] font-black text-gray-300">⌘K</kbd>
              </button>

              <div className="h-6 w-px bg-gray-100 mx-2 hidden md:block" />

              {/* Activity Actions */}
              <div className="flex items-center gap-1">
                {recentlyViewed.length > 0 && (
                  <div className="relative" ref={recentRef}>
                    <button 
                      onClick={() => setShowRecent(!showRecent)}
                      className={`p-2.5 rounded-xl transition-all ${showRecent ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-900'}`}
                      aria-label="Recently viewed"
                    >
                      <RefreshCcw className="w-4.5 h-4.5" />
                    </button>

                    {showRecent && (
                      <div className="absolute right-0 top-full mt-4 w-72 bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 z-50 ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-200">
                        <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-5">History</h4>
                        <div className="space-y-4">
                          {recentlyViewed.slice(0, 3).map(p => (
                            <Link key={p.id} href={getProductUrl(p)} className="flex items-center gap-3 group">
                              <div className="h-10 w-10 rounded-lg bg-gray-50 border overflow-hidden shrink-0">
                                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[11px] font-black text-gray-900 truncate group-hover:text-primary-600 transition-colors">{p.name}</p>
                                <p className="text-[9px] font-bold text-gray-400">${(p.price / 100).toFixed(2)}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {user && (
                  <Link 
                    href={STORE_PATHS.WISHLIST} 
                    className={`p-2.5 rounded-xl transition-all ${pathname === STORE_PATHS.WISHLIST ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-500'}`}
                    aria-label="Favorites"
                  >
                    <Heart className={`w-4.5 h-4.5 ${pathname === STORE_PATHS.WISHLIST ? 'fill-current' : ''}`} />
                  </Link>
                )}
              </div>
              
              <button 
                onClick={openCart}
                className="group relative flex items-center gap-2.5 rounded-xl bg-gray-900 px-4 py-2.5 text-white transition-all hover:bg-black"
                aria-label="Open cart"
              >
                <ShoppingCart className="w-4 h-4 text-white/70" />
                <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Cart</span>
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-primary-500 px-1 text-[8px] font-black text-white ring-2 ring-white">
                    {totalItems}
                  </span>
                )}
              </button>

              <div className="hidden md:block">
                {user ? (
                  <div className="relative group/user">
                    <button className="h-10 w-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-primary-50 hover:text-primary-600 transition-all flex items-center justify-center border border-transparent group-hover/user:border-primary-100">
                      {user.role === 'admin' ? <Shield className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </button>
                    
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 opacity-0 translate-y-2 pointer-events-none group-hover/user:opacity-100 group-hover/user:translate-y-0 group-hover/user:pointer-events-auto transition-all z-nav">
                       <div className="px-3 py-2 border-b border-gray-50 mb-1">
                          <p className="text-[10px] font-black text-gray-900 truncate">{user.displayName}</p>
                          <p className="text-[8px] font-bold text-gray-400 truncate uppercase tracking-tighter">{user.role}</p>
                       </div>
                       <Link href={STORE_PATHS.ACCOUNT} className="flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-gray-600 hover:bg-gray-50 hover:text-primary-600 rounded-lg transition-colors">
                          <User className="w-3.5 h-3.5" /> Account
                       </Link>
                       {user.role === 'admin' && (
                         <Link href="/admin" className="flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-gray-600 hover:bg-gray-50 hover:text-primary-600 rounded-lg transition-colors">
                            <Shield className="w-3.5 h-3.5" /> Admin
                         </Link>
                       )}
                       <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <X className="w-3.5 h-3.5" /> Sign Out
                       </button>
                    </div>
                  </div>
                ) : (
                  <Link
                    href={STORE_PATHS.LOGIN}
                    className="text-[10px] font-black text-gray-900 hover:text-primary-600 transition-colors uppercase tracking-[0.2em] px-2"
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
        <div className="md:hidden fixed inset-0 z-drawer overflow-hidden">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" onClick={() => setIsMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-full max-w-xs bg-white shadow-2xl animate-in slide-in-from-left duration-300 ease-out flex flex-col">
            <div className="flex items-center justify-between px-6 py-6 border-b">
               <Link href={STORE_PATHS.HOME} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 text-gray-900 font-black text-xl tracking-tighter">
                 <BeeLogo className="w-8 h-8" />
                 DreamBees Art
               </Link>

               <button onClick={() => setIsMenuOpen(false)} className="p-2 rounded-xl bg-gray-50 text-gray-400"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-10 space-y-10">
              <nav className="space-y-8">
                <div className="grid grid-cols-1 gap-4">
                  <Link href={STORE_PATHS.HOME} onClick={() => setIsMenuOpen(false)} className="text-xl font-black text-gray-900 uppercase tracking-tighter">
                    Home
                  </Link>
                  <Link href={STORE_PATHS.PRODUCTS} onClick={() => setIsMenuOpen(false)} className="text-xl font-black text-gray-900 uppercase tracking-tighter">
                    Shop All
                  </Link>
                  <Link href="/blog" onClick={() => setIsMenuOpen(false)} className="text-xl font-black text-gray-900 uppercase tracking-tighter">
                    Journal
                  </Link>
                </div>

                {navMenu && (
                  <div className="pt-8 border-t border-gray-100">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Collections</h3>
                    <div className="grid grid-cols-1 gap-5">
                      {[...navMenu.shopCategories.links, ...navMenu.shopCollections.links].map((link, i) => (
                        <Link key={i} href={link.href} onClick={() => setIsMenuOpen(false)} className="text-sm font-bold text-gray-600 hover:text-primary-600 transition-colors">
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </nav>

              <div className="pt-8 border-t border-gray-100 space-y-6">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Account</h3>
                {user ? (
                  <div className="space-y-4">
                    <Link href={STORE_PATHS.ACCOUNT} onClick={() => setIsMenuOpen(false)} className="flex items-center justify-between text-sm font-bold text-gray-900">
                      Settings <User className="w-4 h-4 text-gray-400" />
                    </Link>
                    <Link href={STORE_PATHS.WISHLIST} onClick={() => setIsMenuOpen(false)} className="flex items-center justify-between text-sm font-bold text-gray-900">
                      Favorites <Heart className="w-4 h-4 text-gray-400" />
                    </Link>
                    <button onClick={handleSignOut} className="text-sm font-bold text-red-500">
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link
                    href={STORE_PATHS.LOGIN}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-between text-sm font-bold text-primary-600"
                  >
                    Sign In <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>

            <div className="p-8 border-t bg-gray-50/50">
               <div className="flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <Link href="/support" onClick={() => setIsMenuOpen(false)}>Support</Link>
                  <span>US / USD</span>
               </div>
            </div>
          </div>
        </div>
      )}

    </nav>
    </>
  );
}
