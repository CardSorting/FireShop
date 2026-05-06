'use client';

/**
 * [LAYER: UI]
 */
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { 
  X, ShoppingBag, Trash2, ChevronRight, LockKeyhole, Truck, 
  ShieldCheck, ArrowRight, Minus, Plus, CreditCard, Shield 
} from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { useServices } from '../hooks/useServices';
import { MAX_CART_QUANTITY } from '@domain/rules';
import { logger } from '@utils/logger';

function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function CartDrawer() {
  const { 
    cart, loading, isOpen, closeCart, 
    updateQuantity, removeItem, subtotal, totalItems 
  } = useCart();
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const bodyOverflowRef = useRef<string | null>(null);

  useEffect(() => {
    let focusTimer: number | null = null;
    if (isOpen && closeButtonRef.current) {
      focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 300);
    }
    return () => {
      if (focusTimer !== null) window.clearTimeout(focusTimer);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (bodyOverflowRef.current === null) {
        bodyOverflowRef.current = document.body.style.overflow;
      }
      document.body.style.overflow = 'hidden';
    } else {
      if (bodyOverflowRef.current !== null) {
        document.body.style.overflow = bodyOverflowRef.current;
        bodyOverflowRef.current = null;
      }
    }
    return () => {
      if (bodyOverflowRef.current !== null) {
        document.body.style.overflow = bodyOverflowRef.current;
        bodyOverflowRef.current = null;
      }
    };
  }, [isOpen]);

  const items = cart?.items ?? [];
  const FREE_SHIPPING_THRESHOLD = 10000; // $100.00

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-drawer flex justify-end">
      {/* Backdrop: with smoother blur and opacity */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-500"
        onClick={closeCart}
      />

      {/* Drawer Container: uses 100dvh for mobile viewport height compliance */}
      <div className="relative flex h-dvh w-full max-w-lg flex-col bg-white shadow-[0_0_50px_rgba(0,0,0,0.1)] animate-in slide-in-from-right duration-500 cubic-bezier(0.4, 0, 0.2, 1) border-l border-gray-100">
        
        {/* Header: Ultra-Compressed for Maximum Item Visibility */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 bg-white/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">Cart</h2>
            <div className="h-1 w-1 rounded-full bg-gray-200" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {totalItems} {totalItems === 1 ? 'item' : 'items'}
            </span>
          </div>
          
          <button
            ref={closeButtonRef}
            onClick={closeCart}
            className="group rounded-full p-1.5 text-gray-300 hover:bg-gray-50 hover:text-gray-900 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="Close cart"
          >
            <X className="h-4 w-4 transition-transform group-hover:rotate-90 duration-300" />
          </button>
        </div>

        {/* Free Shipping Progress: Condensed */}
        {items.length > 0 && (
          <div className="px-6 py-3 border-b border-gray-50 bg-gray-50/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Truck className={`h-3 w-3 ${subtotal >= FREE_SHIPPING_THRESHOLD ? 'text-green-600' : 'text-primary-600'}`} />
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                  {subtotal >= FREE_SHIPPING_THRESHOLD ? 'Free Shipping Unlocked' : 'Shipping Progress'}
                </span>
              </div>
              {subtotal < FREE_SHIPPING_THRESHOLD && (
                <span className="text-[9px] font-bold text-primary-600">
                  {formatMoney(FREE_SHIPPING_THRESHOLD - subtotal)} to go
                </span>
              )}
            </div>
            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ease-out ${subtotal >= FREE_SHIPPING_THRESHOLD ? 'bg-green-500' : 'bg-primary-600'}`}
                style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-8">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-12 text-center">
              <div className="mb-8 relative">
                <div className="h-32 w-32 rounded-full bg-gray-50 flex items-center justify-center animate-pulse">
                  <ShoppingBag className="h-14 w-14 text-gray-100" />
                </div>
                <div className="absolute top-2 right-2 h-10 w-10 rounded-full bg-white shadow-xl flex items-center justify-center border border-gray-50">
                   <Plus className="h-5 w-5 text-primary-500" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Your cart is empty</h3>
              <p className="mt-3 text-sm text-gray-400 font-medium max-w-[280px] leading-relaxed">
                Discover unique art pieces and start building your collection today.
              </p>
              <button 
                onClick={closeCart}
                className="mt-12 group flex items-center gap-3 rounded-2xl bg-gray-900 px-10 py-4.5 text-sm font-black text-white hover:bg-black transition-all shadow-2xl hover:-translate-y-1 active:translate-y-0"
              >
                Explore Gallery <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
              </button>

              {/* Quick Links for non-technical discovery */}
              <div className="mt-12 flex flex-wrap justify-center gap-2">
                {['Paintings', 'Digital Art', 'Sculptures', 'Limited Ed.'].map(cat => (
                  <Link
                    key={cat}
                    href={`/collections/${cat.toLowerCase().replace(' ', '-')}`}
                    onClick={closeCart}
                    className="px-4 py-2 rounded-xl border border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 hover:border-gray-200 transition-all"
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-10">
              {items.map((item) => {
                const itemId = item.variantId ? `${item.productId}-${item.variantId}` : item.productId;
                const isUpdating = updatingItemId === itemId;

                return (
                  <div key={itemId} className={`flex gap-6 group transition-opacity duration-300 ${isUpdating ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                    <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-3xl bg-gray-50 border border-gray-100 shadow-sm group-hover:shadow-md transition-shadow">
                      <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                      {isUpdating && (
                        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center">
                          <div className="h-5 w-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-between py-1">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-start gap-4">
                          <h3 className="text-sm font-black text-gray-900 leading-snug hover:text-primary-600 transition-colors">
                            <Link href={`/products/${item.productHandle || item.productId}`} onClick={closeCart}>{item.name}</Link>
                          </h3>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setUpdatingItemId(itemId);
                                void removeItem(item.productId, item.variantId).finally(() => setUpdatingItemId(null));
                              }}
                              className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0"
                              title="Remove item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {item.variantTitle && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-50 text-[9px] font-black uppercase tracking-widest text-gray-400 border border-gray-100">
                              {item.variantTitle}
                            </span>
                          )}
                          <span className="text-[11px] font-black text-primary-600">
                            {formatMoney(item.priceSnapshot)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center rounded-2xl border border-gray-100 bg-white shadow-sm p-1">
                          <button
                            onClick={() => {
                              setUpdatingItemId(itemId);
                              void updateQuantity(item.productId, item.quantity - 1, item.variantId).finally(() => setUpdatingItemId(null));
                            }}
                            disabled={item.quantity <= 1 || isUpdating}
                            className="h-8 w-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-primary-600 hover:bg-gray-50 disabled:opacity-20 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-10 text-center text-xs font-black text-gray-900">{item.quantity}</span>
                          <button
                            onClick={() => {
                              setUpdatingItemId(itemId);
                              void updateQuantity(item.productId, item.quantity + 1, item.variantId).finally(() => setUpdatingItemId(null));
                            }}
                            disabled={item.quantity >= MAX_CART_QUANTITY || isUpdating}
                            className="h-8 w-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-primary-600 hover:bg-gray-50 disabled:opacity-20 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-sm font-black text-gray-900 tracking-tight">
                          {formatMoney(item.priceSnapshot * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Order Note */}
              <div className="pt-8 border-t border-gray-50 pb-4">
                <details className="group">
                  <summary className="flex cursor-pointer items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 select-none hover:text-gray-900 transition-colors">
                    <span>Add a gift note or instructions</span>
                    <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="mt-5 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-300">
                    <textarea 
                      className="w-full rounded-2xl border-2 border-gray-50 p-5 text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all placeholder:text-gray-300 resize-none"
                      placeholder="Enter your message here..."
                      rows={4}
                    />
                  </div>
                </details>
              </div>
            </div>
          )}
        </div>

        {/* Footer: Ultra-Compressed for Maximum Item Visibility */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 bg-white p-4 z-30">
            <div className="flex items-center justify-between gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">Total</span>
                <span className="text-xl font-black text-gray-900 tracking-tighter leading-none">{formatMoney(subtotal)}</span>
              </div>
              
              <Link
                href="/checkout"
                onClick={closeCart}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gray-900 h-12 px-6 font-black text-white text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95"
              >
                Checkout <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            
            <div className="mt-3 flex items-center justify-between opacity-30">
               <div className="flex gap-3">
                  <ShieldCheck className="h-3 w-3" />
                  <LockKeyhole className="h-3 w-3" />
               </div>
               <p className="text-[7px] font-black uppercase tracking-[0.2em]">Secure SSL</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
