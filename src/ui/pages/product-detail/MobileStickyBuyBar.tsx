'use client';

import { ShoppingCart, Check } from 'lucide-react';
import { formatCurrency } from '@utils/formatters';

interface MobileStickyBuyBarProps {
  name: string;
  price: number;
  adding: boolean;
  added: boolean;
  onAddToCart: () => void;
  onOpenCart: () => void;
  visible: boolean;
}

export function MobileStickyBuyBar({
  name,
  price,
  adding,
  added,
  onAddToCart,
  onOpenCart,
  visible
}: MobileStickyBuyBarProps) {
  return (
    <div 
      className={`
        fixed bottom-0 left-0 right-0 z-nav bg-white/90 backdrop-blur-xl border-t border-gray-100 p-4 
        transition-transform duration-500 ease-in-out lg:hidden
        ${visible ? 'translate-y-0' : 'translate-y-full'}
      `}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 truncate">
            {name}
          </p>
          <p className="text-lg font-black text-gray-900">
            {formatCurrency(price)}
          </p>
        </div>
        
        <button
          onClick={added ? onOpenCart : onAddToCart}
          disabled={adding}
          className={`
            h-12 px-8 flex items-center justify-center gap-2 rounded-xl font-bold text-sm uppercase tracking-wider transition-all
            ${added 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-900 text-white active:scale-95 shadow-lg shadow-gray-200'
            }
          `}
        >
          {added ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
          {adding ? '...' : added ? 'Cart' : 'Add'}
        </button>
      </div>
    </div>
  );
}
