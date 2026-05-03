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
    updateQuantity, removeItem, subtotal, totalItems, addItem 
  } = useCart();
  const services = useServices();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      setTimeout(() => closeButtonRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const loadRecommendations = useCallback(async () => {
    try {
      const result = await services.productService.getProducts({ limit: 4 });
      setRecommendations(result.products);
    } catch (err) {
      logger.error('Failed to load recommendations', err);
    }
  }, [services.productService]);

  useEffect(() => {
    if (isOpen) {
      void loadRecommendations();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, loadRecommendations]);

  const items = cart?.items ?? [];
  const FREE_SHIPPING_THRESHOLD = 10000; // $100.00

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop: with smoother blur and opacity */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-500"
        onClick={closeCart}
      />

      {/* Drawer Container: uses 100dvh for mobile viewport height compliance */}
      <div className="relative flex h-[100dvh] w-full max-w-lg flex-col bg-white shadow-[0_0_50px_rgba(0,0,0,0.1)] animate-in slide-in-from-right duration-500 cubic-bezier(0.4, 0, 0.2, 1) border-l border-gray-100">
        
        {/* Header: Elevated with better spacing */}
        <div className="flex items-center justify-between border-b border-gray-100 px-8 py-6 bg-white/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div className="relative p-2.5 bg-primary-50 rounded-2xl">
              <ShoppingBag className="h-6 w-6 text-primary-600" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-[10px] font-black text-white ring-2 ring-white">
                  {totalItems}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight leading-none">Your Cart</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1.5">
                {totalItems} {totalItems === 1 ? 'item' : 'items'} ready to ship
              </p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            onClick={closeCart}
            className="group rounded-full p-2 text-gray-300 hover:bg-gray-50 hover:text-gray-900 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="Close cart"
          >
            <X className="h-6 w-6 transition-transform group-hover:rotate-90 duration-300" />
          </button>
        </div>

        {/* Free Shipping Progress: More 'Premium' look */}
        {items.length > 0 && (
          <div className="px-8 py-5 border-b border-gray-50 bg-gray-50/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${subtotal >= FREE_SHIPPING_THRESHOLD ? 'bg-green-100 text-green-600' : 'bg-primary-100 text-primary-600'}`}>
                  <Truck className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-black text-gray-700 uppercase tracking-wider">
                  {subtotal >= FREE_SHIPPING_THRESHOLD ? 'Shipping Unlocked' : 'Shipping Goal'}
                </span>
              </div>
              {subtotal < FREE_SHIPPING_THRESHOLD && (
                <span className="text-xs font-bold text-primary-600">
                  {formatMoney(FREE_SHIPPING_THRESHOLD - subtotal)} away
                </span>
              )}
            </div>
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ease-out ${subtotal >= FREE_SHIPPING_THRESHOLD ? 'bg-green-500' : 'bg-primary-600'}`}
                style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
              />
            </div>
            {subtotal >= FREE_SHIPPING_THRESHOLD ? (
              <p className="mt-2.5 text-[10px] font-bold text-green-600 text-center uppercase tracking-widest">
                🎉 Free express shipping applied to your order
              </p>
            ) : (
              <p className="mt-2.5 text-[10px] font-bold text-gray-400 text-center uppercase tracking-widest">
                Add more to unlock free shipping worldwide
              </p>
            )}
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

              {recommendations.length > 0 && (
                <div className="mt-24 w-full">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="h-px flex-1 bg-gray-100" />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">Top Rated</h4>
                    <div className="h-px flex-1 bg-gray-100" />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    {recommendations.slice(0, 2).map((p) => (
                      <div key={p.id} className="group text-left">
                        <Link 
                          href={`/products/${p.handle || p.id}`}
                          onClick={closeCart}
                          className="block aspect-[4/5] overflow-hidden rounded-2xl bg-gray-50 border border-gray-100 group-hover:shadow-xl transition-all duration-500"
                        >
                          <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition duration-700" />
                        </Link>
                        <p className="mt-3 text-[11px] font-black text-gray-900 truncate leading-tight">{p.name}</p>
                        <p className="mt-1 text-[11px] text-primary-600 font-black tracking-tight">{formatMoney(p.price)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                            <Link href={`/products/${item.productId}`} onClick={closeCart}>{item.name}</Link>
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

              {/* Related Products: Compact Add-ons */}
              {recommendations.length > 0 && (
                <div className="pt-10 border-t border-gray-50">
                  <div className="flex items-center justify-between mb-8">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">Complete the set</h4>
                    <Link href="/products" onClick={closeCart} className="text-[10px] font-black uppercase text-primary-600 hover:underline tracking-widest">Browse All</Link>
                  </div>
                  <div className="space-y-4">
                    {recommendations.slice(0, 3).map((p) => (
                      <div key={p.id} className="flex items-center gap-5 p-3 rounded-3xl border border-transparent hover:border-gray-50 hover:bg-gray-50/50 transition-all group">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm">
                          <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover group-hover:scale-110 transition duration-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate leading-tight">{p.name}</p>
                          <p className="text-[10px] font-black text-primary-600 mt-1">{formatMoney(p.price)}</p>
                        </div>
                        <button 
                          onClick={() => addItem(p.id, 1)}
                          className="h-9 w-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-primary-600 hover:bg-primary-600 hover:text-white hover:border-primary-600 transition-all shadow-sm active:scale-95"
                          aria-label={`Add ${p.name}`}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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

        {/* Footer: Locked with better contrast */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 bg-white p-8 space-y-6 shadow-[0_-20px_60px_rgba(0,0,0,0.03)] z-30">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-gray-400 uppercase tracking-widest">Subtotal</span>
                <span className="text-gray-900">{formatMoney(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-gray-400 uppercase tracking-widest">Shipping</span>
                <span className={subtotal >= FREE_SHIPPING_THRESHOLD ? "text-green-600 font-black" : "text-gray-900"}>
                  {subtotal >= FREE_SHIPPING_THRESHOLD ? "Complimentary" : "Calculated at Next Step"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-gray-400 uppercase tracking-widest">Estimated Tax</span>
                <span className="text-gray-900">TBD</span>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <span className="text-sm font-black text-gray-900 uppercase tracking-widest">Total</span>
                <span className="text-2xl font-black text-gray-900 tracking-tight leading-none">{formatMoney(subtotal)}</span>
              </div>
            </div>

            <div className="grid gap-4">
              <Link
                href="/checkout"
                onClick={closeCart}
                className="group relative flex w-full items-center justify-center gap-3 rounded-2xl bg-gray-900 py-5 font-black text-white shadow-[0_15px_30px_rgba(0,0,0,0.15)] transition-all hover:bg-black hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)] hover:-translate-y-1 active:translate-y-0"
              >
                <span>Continue to Checkout</span>
                <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
              <Link
                href="/cart"
                onClick={closeCart}
                className="flex w-full items-center justify-center rounded-2xl py-4 text-xs font-black uppercase tracking-[0.2em] text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100"
              >
                Review Items
              </Link>
            </div>

            {/* Trust Markers: Subtle & Clean */}
            <div className="pt-2 border-t border-gray-50">
               <div className="flex items-center justify-center gap-8 opacity-20 grayscale transition-all duration-700 hover:opacity-60 hover:grayscale-0">
                  <div className="flex flex-col items-center gap-1">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <LockKeyhole className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <CreditCard className="h-5 w-5" />
                  </div>
               </div>
               <p className="mt-5 text-center text-[9px] font-black uppercase tracking-[0.3em] text-gray-300">
                 Secure 256-bit Encrypted Checkout
               </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
