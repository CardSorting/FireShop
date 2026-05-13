'use client';

/**
 * [LAYER: UI]
 */
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { useCallback, useEffect, useState, useRef } from 'react';
import { ShoppingCart, User, Menu, X, ChevronRight, ChevronDown, Search, Heart, RefreshCcw } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { BeeLogo, HiveCell } from '../components/Logo';
import Image from 'next/image';

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
  const [showHistory, setShowHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [navMenu, setNavMenu] = useState<NavigationMenu | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/navigation?id=main-nav', { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (!controller.signal.aborted && !data.error) setNavMenu(data);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);


  useEffect(() => {
    setIsMenuOpen(false);
    setShowHistory(false);
    setIsSearchFocused(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut();
    router.push(STORE_PATHS.HOME);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(getSearchUrl(searchQuery.trim()));
      setSearchQuery('');
      setIsSearchFocused(false);
    }
  };

  return (
    <>
      <nav className="relative z-nav py-6 bg-white border-b border-gray-100/50">
        <div className="w-full px-6 lg:px-16 xl:px-24 flex items-center gap-6 lg:gap-12">
          
          {/* Brand */}
          <Link href={STORE_PATHS.HOME} className={`flex items-center group shrink-0 transition-all duration-300 ${isSearchFocused ? 'hidden md:flex' : 'flex'}`}>
            <BeeLogo className="w-8 h-8 transition-transform group-hover:scale-110" />
            <span className="ml-2 text-lg font-black tracking-tighter text-gray-900 hidden sm:inline">
              DreamBees
            </span>
          </Link>

          {/* Desktop Links - Hidden when search is focused on smaller screens */}
          <div className={`hidden lg:flex items-center gap-10 shrink-0 transition-all duration-500 ${isSearchFocused ? 'opacity-0 -translate-x-4 pointer-events-none w-0 overflow-hidden' : 'opacity-100 translate-x-0'}`}>
            <Link href="/products" className="text-[12px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-primary-600 transition-colors">Shop</Link>
            <Link href="/blog" className="text-[12px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-primary-600 transition-colors">Journal</Link>
          </div>

          {/* Responsive Inline Search */}
          <form 
            onSubmit={handleSearchSubmit}
            className={`flex-1 relative transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1) ${isSearchFocused ? 'max-w-4xl' : 'max-w-[280px] md:max-w-md'}`}
          >
            <div className={`absolute inset-y-0 left-3 flex items-center pointer-events-none transition-colors ${isSearchFocused ? 'text-primary-600' : 'text-gray-400'}`}>
              <Search className="w-4 h-4" />
            </div>
            <input 
              type="text"
              placeholder="Search art..."
              className={`w-full pl-10 pr-4 py-2 text-[13px] font-medium bg-gray-100 border-2 border-transparent rounded-full outline-none transition-all duration-300 focus:bg-white focus:border-primary-500/20 focus:ring-4 focus:ring-primary-500/5 placeholder:text-gray-400`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            />
          </form>

          {/* Actions */}
          <div className={`flex items-center gap-2 sm:gap-4 transition-all duration-500 ${isSearchFocused ? 'hidden sm:flex' : 'flex'}`}>
            
            {/* History - Desktop only */}
            <div className="relative hidden md:block" onMouseEnter={() => setShowHistory(true)} onMouseLeave={() => setShowHistory(false)}>
              <button className={`p-2.5 rounded-full transition-all ${showHistory ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-900'}`}>
                <RefreshCcw className="w-4.5 h-4.5" />
              </button>
              {showHistory && recentlyViewed.length > 0 && (
                <div className="absolute right-0 top-full pt-4 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all z-50">
                  <div className="w-72 bg-white rounded-3xl shadow-2xl border border-gray-100 p-6">
                    <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">Recent</h4>
                    <div className="space-y-4">
                      {recentlyViewed.slice(0, 3).map(p => (
                        <Link key={p.id} href={getProductUrl(p)} className="flex items-center gap-3 group/item">
                          <div className="relative h-10 w-10 rounded-xl bg-gray-50 overflow-hidden shrink-0">
                            <Image src={p.imageUrl} alt={p.name} fill className="object-cover" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-black text-gray-900 truncate group-hover/item:text-primary-600">{p.name}</p>
                            <p className="text-[9px] font-bold text-gray-400">${(p.price/100).toFixed(2)}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Account */}
            <div className="relative group/user">
              <Link href={user ? STORE_PATHS.ACCOUNT : STORE_PATHS.LOGIN} className="p-2.5 rounded-full text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-all">
                <User className="w-4.5 h-4.5" />
              </Link>
              {user && (
                <div className="absolute right-0 top-full pt-4 opacity-0 translate-y-2 pointer-events-none group-hover/user:opacity-100 group-hover/user:translate-y-0 group-hover/user:pointer-events-auto transition-all z-50">
                  <div className="w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2">
                    <div className="px-3 py-2 border-b border-gray-50 mb-1">
                      <p className="text-[10px] font-black text-gray-900 truncate">{user.displayName}</p>
                    </div>
                    <Link href={STORE_PATHS.ACCOUNT} className="block px-3 py-2 text-[11px] font-bold text-gray-600 hover:bg-gray-50 rounded-lg">Account</Link>
                    <button onClick={handleSignOut} className="w-full text-left px-3 py-2 text-[11px] font-bold text-red-500 hover:bg-red-50 rounded-lg">Sign Out</button>
                  </div>
                </div>
              )}
            </div>

            {/* Cart */}
            <button 
              onClick={openCart}
              className="ml-1 h-9 px-3 sm:px-4 bg-gray-900 text-white rounded-full flex items-center gap-2 hover:bg-primary-600 transition-all"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="text-[11px] font-black">{totalItems}</span>
            </button>

            {/* Mobile Menu */}
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="lg:hidden p-2.5 rounded-full text-gray-900 hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-modal flex overflow-hidden">
          <div className="absolute inset-0 bg-white/95 backdrop-blur-xl animate-in fade-in duration-500" onClick={() => setIsMenuOpen(false)} />
          <div className="relative w-full h-full p-8 flex flex-col animate-in slide-in-from-right duration-500">
            <div className="flex items-center justify-between mb-20">
              <BeeLogo className="w-10 h-10" />
              <button onClick={() => setIsMenuOpen(false)} className="p-4 rounded-full bg-gray-50 text-gray-900">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 flex flex-col gap-8">
              <Link href="/products" onClick={() => setIsMenuOpen(false)} className="text-5xl font-black tracking-tighter text-gray-900">Shop</Link>
              <Link href="/blog" onClick={() => setIsMenuOpen(false)} className="text-5xl font-black tracking-tighter text-gray-900">Journal</Link>
              <Link href="/support" onClick={() => setIsMenuOpen(false)} className="text-5xl font-black tracking-tighter text-gray-900">Support</Link>
            </div>
            <div className="pt-10 border-t flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-300">
              <span>DreamBeesArt</span>
              <div className="flex gap-4">
                <Link href={STORE_PATHS.ACCOUNT}>Account</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
