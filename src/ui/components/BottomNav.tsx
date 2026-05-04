'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ShoppingBag, Heart, User } from 'lucide-react';
import { useCart } from '../hooks/useCart';

export function BottomNav() {
  const pathname = usePathname();
  const { totalItems, openCart } = useCart();

  const navItems = [
    { label: 'Home', icon: Home, href: '/' },
    { label: 'Search', icon: Search, href: '/products', isSearchTrigger: true },
    { label: 'Wishlist', icon: Heart, href: '/wishlist' },
    { label: 'Account', icon: User, href: '/account' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-nav lg:hidden">
      {/* Safe Area Spacer */}
      <div className="h-[calc(4.5rem+env(safe-area-inset-bottom))] bg-white/80 backdrop-blur-xl border-t border-gray-100 px-6 pb-[env(safe-area-inset-bottom)] flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link 
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center gap-1 transition-all ${isActive ? 'text-primary-600' : 'text-gray-400 hover:text-gray-900'}`}
            >
              <div className={`relative p-2 rounded-2xl transition-all ${isActive ? 'bg-primary-50' : 'bg-transparent'}`}>
                <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
            </Link>
          );
        })}

        {/* Floating Cart Trigger */}
        <button 
          onClick={openCart}
          className="relative flex flex-col items-center gap-1 text-gray-400 hover:text-gray-900"
        >
          <div className="relative p-2 rounded-2xl bg-gray-900 text-white shadow-xl shadow-gray-200 -translate-y-4 border-4 border-white">
            <ShoppingBag className="w-6 h-6" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-[10px] font-black text-white ring-2 ring-gray-900">
                {totalItems}
              </span>
            )}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest -translate-y-2">Cart</span>
        </button>
      </div>
    </div>
  );
}
