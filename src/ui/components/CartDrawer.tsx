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
    <div className="fixed inset-0 z-100 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-500 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShoppingBag className="h-6 w-6 text-primary-600" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-600 text-[8px] font-black text-white">
                  {totalItems}
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Your Shopping Cart</h2>
          </div>
          <button
            ref={closeButtonRef}
            onClick={closeCart}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="Close cart drawer"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Free Shipping Progress */}
        {items.length > 0 && (
          <div className="px-6 py-5 border-b bg-primary-50/20">
            {subtotal >= FREE_SHIPPING_THRESHOLD ? (
              <div className="flex items-center gap-3 text-sm font-bold text-green-700">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <Truck className="h-5 w-5" />
                </div>
                You've unlocked FREE EXPRESS Shipping!
              </div>
            ) : (
              <div>
                <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Truck className="h-4 w-4 text-primary-600" />
                  Add <span className="text-primary-700">{formatMoney(FREE_SHIPPING_THRESHOLD - subtotal)}</span> for <span className="text-primary-700">FREE SHIPPING</span>
                </p>
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-primary-600 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(37,99,235,0.5)]"
                    style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-12 text-center">
              <div className="mb-6 h-24 w-24 rounded-full bg-gray-50 flex items-center justify-center relative">
                <ShoppingBag className="h-12 w-12 text-gray-200" />
                <div className="absolute -top-1 -right-1 h-8 w-8 rounded-full bg-white shadow-md flex items-center justify-center">
                   <Plus className="h-4 w-4 text-primary-500" />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900">Your cart is feeling lonely</p>
              <p className="mt-3 text-sm text-gray-500 max-w-[250px]">Fill it up with the latest TCG releases and start your next collection.</p>
              <button 
                onClick={closeCart}
                className="mt-10 group flex items-center gap-2 rounded-2xl bg-gray-900 px-8 py-4 text-sm font-black text-white hover:bg-black transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 active:translate-y-0"
              >
                Start Shopping <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>

              {recommendations.length > 0 && (
                <div className="mt-20 w-full text-left">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-8">Trending Today</h4>
                  <div className="grid grid-cols-2 gap-6">
                    {recommendations.slice(0, 2).map((p) => (
                      <div key={p.id} className="group relative">
                        <Link 
                          href={`/products/${p.handle || p.id}`}
                          onClick={closeCart}
                          className="block aspect-square overflow-hidden rounded-2xl bg-gray-50 border group-hover:shadow-lg transition-all duration-300"
                        >
                          <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover group-hover:scale-110 transition duration-500" />
                        </Link>
                        <p className="mt-3 text-xs font-bold text-gray-900 line-clamp-1">{p.name}</p>
                        <p className="text-xs text-primary-600 font-black">{formatMoney(p.price)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {items.map((item) => (
                <div key={item.variantId ? `${item.productId}-${item.variantId}` : item.productId} className="flex gap-5 group" data-testid="cart-item">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border bg-gray-50 shadow-sm group-hover:shadow-md transition-shadow">
                    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col justify-between py-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-black text-gray-900 line-clamp-2 hover:text-primary-600 transition-colors">
                          <Link href={`/products/${item.productId}`} onClick={closeCart}>{item.name}</Link>
                        </h3>
                        {item.variantTitle && (
                          <p className="mt-0.5 text-[10px] font-black uppercase tracking-widest text-gray-400">
                            {item.variantTitle}
                          </p>
                        )}
                        <p className="mt-1 text-xs font-bold text-primary-600">{formatMoney(item.priceSnapshot)}</p>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId, item.variantId)}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center rounded-xl border-2 border-gray-100 bg-white shadow-sm h-10 overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                          disabled={item.quantity <= 1}
                          className="px-3 text-gray-400 hover:text-primary-600 hover:bg-gray-50 disabled:opacity-20 transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-black text-gray-900 border-x-2 border-gray-50">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                          disabled={item.quantity >= MAX_CART_QUANTITY}
                          className="px-3 text-gray-400 hover:text-primary-600 hover:bg-gray-50 disabled:opacity-20 transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-sm font-black text-gray-900">
                        {formatMoney(item.priceSnapshot * item.quantity)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Enhanced Recommendations */}
              {recommendations.length > 0 && (
                <div className="pt-10 border-t">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Perfect Additions</h4>
                    <Link href="/products" onClick={closeCart} className="text-[10px] font-black uppercase text-primary-600 hover:underline">View All</Link>
                  </div>
                  <div className="space-y-4">
                    {recommendations.slice(0, 3).map((p) => (
                      <div key={p.id} className="flex items-center gap-4 bg-gray-50 p-3 rounded-2xl hover:bg-white hover:shadow-md transition-all group">
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white border">
                          <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover group-hover:scale-110 transition duration-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">{p.name}</p>
                          <p className="text-[10px] font-bold text-primary-600">{formatMoney(p.price)}</p>
                        </div>
                        <button 
                          onClick={() => addItem(p.id, 1)}
                          className="h-10 w-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-primary-600 hover:bg-primary-600 hover:text-white hover:border-primary-600 transition-all shadow-sm"
                          aria-label={`Quick add ${p.name}`}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Order Note Field */}
              <div className="pt-8 border-t">
                <details className="group">
                  <summary className="flex cursor-pointer items-center justify-between text-xs font-black uppercase tracking-[0.2em] text-gray-400 select-none">
                    <span>Add special instructions</span>
                    <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="mt-4 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <textarea 
                      className="w-full rounded-2xl border-2 border-gray-100 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all placeholder:text-gray-300"
                      placeholder="Special delivery notes, gift message, or packaging preferences..."
                      rows={3}
                    />
                  </div>
                </details>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t bg-white p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
            <div className="mb-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-500">Subtotal</span>
                <span className="text-xl font-black text-gray-900 tracking-tight">{formatMoney(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-gray-400">Shipping</span>
                <span className={subtotal >= FREE_SHIPPING_THRESHOLD ? "text-green-600" : "text-gray-400"}>
                  {subtotal >= FREE_SHIPPING_THRESHOLD ? "FREE" : "Calculated at checkout"}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <Link
                href="/checkout"
                onClick={closeCart}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-primary-600 py-5 font-black text-white shadow-xl shadow-primary-200 transition-all hover:bg-primary-700 hover:shadow-2xl hover:-translate-y-1 active:translate-y-0"
              >
                Checkout Securely <LockKeyhole className="h-5 w-5" />
              </Link>
              <Link
                href="/cart"
                onClick={closeCart}
                className="flex w-full items-center justify-center rounded-2xl border-2 border-gray-100 bg-white py-4 text-sm font-black text-gray-700 hover:bg-gray-50 hover:border-gray-200 transition-all"
              >
                View & Edit Cart
              </Link>
            </div>

            {/* Trust Markers */}
            <div className="mt-8">
               <div className="flex items-center justify-center gap-6 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
                  <CreditCard className="h-5 w-5" />
                  <ShieldCheck className="h-5 w-5" />
                  <Shield className="h-5 w-5" />
               </div>
               <p className="mt-4 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                 Secure Encrypted Payments
               </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
