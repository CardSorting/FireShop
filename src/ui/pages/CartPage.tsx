'use client';

/**
 * [LAYER: UI]
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { 
  AlertCircle, ChevronRight, LifeBuoy, LockKeyhole, PackageCheck, 
  ShieldCheck, ShoppingBag, Trash2, Truck, Minus, Plus, CreditCard,
  ArrowLeft, Info, Shield
} from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { useServices } from '../hooks/useServices';
import type { Product } from '@domain/models';
import { MAX_CART_QUANTITY } from '@domain/rules';
import { logger } from '@utils/logger';
import { getProductUrl, STORE_PATHS } from '@utils/navigation';


function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

const FREE_SHIPPING_THRESHOLD = 10000;

export function CartPage() {
  const { 
    cart, loading, updateQuantity, removeItem, clearCart, 
    subtotal, totalItems, addItem 
  } = useCart();
  const services = useServices();
  
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(false);
  const [showPromo, setShowPromo] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoMessage, setPromoMessage] = useState<{ text: string, isError: boolean } | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; amount: number } | null>(null);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setIsApplying(true);
    setPromoMessage(null);

    try {
      const code = promoCode.trim().toUpperCase();
      const res = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, cartTotal: subtotal }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.valid) {
          setAppliedPromo({ code, amount: result.discountAmount });
          setPromoMessage({ text: `${code} applied!`, isError: false });
        } else {
          setPromoMessage({ text: result.message || 'Invalid code', isError: true });
        }
      } else {
        setPromoMessage({ text: 'Unable to validate code', isError: true });
      }
    } catch (err) {
      logger.error('Failed to validate promo code', err);
      setPromoMessage({ text: 'Error validating code', isError: true });
    } finally {
      setIsApplying(false);
    }
  };

  useEffect(() => {
    const loadFeatured = async () => {
      setLoadingFeatured(true);
      try {
        const result = await services.productService.getProducts({ limit: 4 });
        setFeaturedProducts(result.products);
      } catch (err) {
        logger.error('Failed to load featured products', err);
      } finally {
        setLoadingFeatured(false);
      }
    };
    void loadFeatured();
  }, [services]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white px-4 py-16 text-center">
        <div className="animate-spin h-10 w-10 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading your cart...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumbs & Header */}
        <div className="mb-12">
          <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">
            <Link href={STORE_PATHS.HOME} className="hover:text-primary-600 transition-colors">Home</Link>

            <ChevronRight className="h-3 w-3" />
            <span className="text-gray-900">Your Shopping Cart</span>
          </nav>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-5xl font-black text-gray-900 tracking-tight mb-3">Shopping Cart</h1>
              <p className="text-gray-500 font-medium text-lg">
                You have <span className="text-gray-900 font-bold">{totalItems} items</span> in your bag.
              </p>
            </div>
            {totalItems > 0 && (
               <button 
                onClick={clearCart}
                className="text-xs font-bold uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors flex items-center gap-2"
               >
                 <Trash2 className="h-4 w-4" /> Clear All Items
               </button>
            )}
          </div>
        </div>

        {totalItems === 0 ? (
          <div className="space-y-20">
            <div className="bg-white rounded-4xl border border-gray-100 p-16 text-center shadow-xl shadow-gray-200/50 relative overflow-hidden">
               {/* Decorative background element */}
               <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-primary-50 rounded-full blur-3xl opacity-50" />
               
               <div className="relative z-10">
                <div className="mx-auto mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-gray-50 text-gray-200 ring-8 ring-white shadow-inner">
                  <ShoppingBag className="h-16 w-16" />
                </div>
                <h2 className="text-4xl font-black text-gray-900 mb-4">Your cart is empty</h2>
                <p className="mx-auto mt-4 max-w-md text-gray-500 text-lg font-medium">
                  Looks like you haven't added anything to your cart yet. Let's find some amazing cards for your collection!
                </p>
                <div className="mt-12 flex flex-wrap justify-center gap-4">
                  <Link href={STORE_PATHS.PRODUCTS} className="rounded-2xl bg-primary-600 px-10 py-5 text-lg font-black text-white shadow-2xl shadow-primary-200 transition hover:bg-primary-700 hover:-translate-y-1 active:translate-y-0 active:scale-95">
                    Start Shopping
                  </Link>
                  <Link href={STORE_PATHS.HOME} className="rounded-2xl border-2 border-gray-100 bg-white px-10 py-5 text-lg font-black text-gray-700 transition hover:bg-gray-50 hover:border-gray-200">
                    Back to Home
                  </Link>
                </div>

               </div>
            </div>

            {featuredProducts.length > 0 && (
              <section>
                <div className="mb-10 flex items-center justify-between">
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">Handpicked for you</h2>
                  <Link href={STORE_PATHS.PRODUCTS} className="text-sm font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1">
                    View All <ChevronRight className="h-4 w-4" />
                  </Link>

                </div>
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                  {featuredProducts.map((p) => (
                    <article key={p.id} className="group bg-white rounded-3xl border border-gray-100 p-4 shadow-sm transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
                      <Link href={getProductUrl(p)} className="block aspect-square overflow-hidden rounded-2xl bg-gray-50 mb-6">
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                      </Link>
                      <div>
                        <h4 className="text-xs font-black text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                          <Link href={getProductUrl(p)}>{p.name}</Link>
                        </h4>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <p className="text-xl font-black text-gray-900">{formatMoney(p.price)}</p>
                        <button 
                          onClick={() => addItem(p.id, 1)}
                          className="h-10 w-10 rounded-xl bg-gray-900 text-white flex items-center justify-center hover:bg-primary-600 transition-colors shadow-lg shadow-gray-200"
                        >
                          <Plus className="h-5 w-5" />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 items-start">
            {/* Left Side: Items */}
            <div className="lg:col-span-2 space-y-6">
              {cart?.items.map((item) => (
                <article key={item.productId} className="bg-white rounded-4xl border border-gray-100 p-6 shadow-sm hover:shadow-xl transition-all duration-300 group" data-testid="cart-item">
                  <div className="flex flex-col sm:flex-row gap-8">
                    <div className="relative w-full sm:w-40 aspect-square shrink-0">
                      <Link href={getProductUrl({ id: item.productId, handle: item.productHandle })}>
                        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover rounded-2xl ring-1 ring-gray-100 group-hover:scale-[1.02] transition-transform duration-500" />
                      </Link>
                    </div>

                    
                    <div className="flex-1 flex flex-col justify-between py-2">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h3 className="text-xl font-black text-gray-900 group-hover:text-primary-600 transition-colors mb-2">
                            <Link href={getProductUrl({ id: item.productId, handle: item.productHandle })}>{item.name}</Link>
                          </h3>

                          <div className="flex items-center gap-4">
                             <p className="text-sm font-bold text-gray-400">Unit Price: <span className="text-gray-900">{formatMoney(item.priceSnapshot)}</span></p>
                             <div className="h-4 w-px bg-gray-200" />
                             <p className="text-sm font-black text-primary-600" data-testid="item-total">Total: {formatMoney(item.priceSnapshot * item.quantity)}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => removeItem(item.productId)}
                          className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="mt-8 flex flex-wrap items-center justify-between gap-6">
                        <div className="flex items-center bg-gray-50 p-1.5 rounded-2xl border-2 border-transparent focus-within:border-primary-100 transition-all">
                           <button 
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="h-10 w-10 flex items-center justify-center rounded-xl bg-white shadow-sm text-gray-400 hover:text-primary-600 disabled:opacity-30 transition-all active:scale-90"
                            aria-label="Decrease quantity"
                            data-testid="decrease-quantity"
                           >
                             <Minus className="h-4 w-4" />
                           </button>
                           <span className="w-14 text-center text-lg font-black text-gray-900">{item.quantity}</span>
                           <button 
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            disabled={item.quantity >= MAX_CART_QUANTITY}
                            className="h-10 w-10 flex items-center justify-center rounded-xl bg-white shadow-sm text-gray-400 hover:text-primary-600 disabled:opacity-30 transition-all active:scale-90"
                            aria-label="Increase quantity"
                            data-testid="increase-quantity"
                           >
                             <Plus className="h-4 w-4" />
                           </button>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs font-bold text-green-600 bg-green-50 px-4 py-2 rounded-full">
                           <ShieldCheck className="h-4 w-4" /> Securely reserved for you
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}

              {/* Trust Section Full Page */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10">
                 <div className="bg-white p-6 rounded-3xl border border-gray-100 text-center">
                    <div className="h-12 w-12 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                       <Truck className="h-6 w-6" />
                    </div>
                    <h4 className="text-sm font-black text-gray-900 mb-1">Fast Delivery</h4>
                    <p className="text-xs text-gray-500">Tracked shipping on all orders</p>
                 </div>
                 <div className="bg-white p-6 rounded-3xl border border-gray-100 text-center">
                    <div className="h-12 w-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                       <ShieldCheck className="h-6 w-6" />
                    </div>
                    <h4 className="text-sm font-black text-gray-900 mb-1">Secure Payment</h4>
                    <p className="text-xs text-gray-500">100% encrypted & secure</p>
                 </div>
                 <div className="bg-white p-6 rounded-3xl border border-gray-100 text-center">
                    <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                       <LifeBuoy className="h-6 w-6" />
                    </div>
                    <h4 className="text-sm font-black text-gray-900 mb-1">Expert Support</h4>
                    <p className="text-xs text-gray-500">Dedicated collector assistance</p>
                 </div>
              </div>
            </div>

            {/* Right Side: Summary */}
            <aside className="sticky top-24">
              <div className="bg-white rounded-4xl border border-gray-100 p-8 shadow-2xl shadow-gray-200/50">
                <h2 className="text-2xl font-black text-gray-900 mb-8 tracking-tight">Order Summary</h2>
                
                {/* Free Shipping Progress */}
                <div className="mb-8">
                  <div className="flex justify-between items-end mb-3">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">Shipping Status</p>
                    <p className="text-xs font-bold text-primary-600">
                      {subtotal >= FREE_SHIPPING_THRESHOLD ? 'UNLOCKED' : `${formatMoney(FREE_SHIPPING_THRESHOLD - subtotal)} remaining`}
                    </p>
                  </div>
                  <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden mb-3 shadow-inner">
                    <div 
                      className="h-full bg-primary-600 transition-all duration-1000 shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                      style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {subtotal >= FREE_SHIPPING_THRESHOLD 
                      ? "Congratulations! Your order qualifies for free express shipping."
                      : "Add more items to unlock free express shipping on your order."}
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center text-gray-500 font-medium">
                    <span>Subtotal</span>
                    <span className="text-gray-900 font-bold">{formatMoney(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-500 font-medium">
                    <span>Shipping</span>
                    <span className={subtotal >= FREE_SHIPPING_THRESHOLD ? "text-green-600 font-black" : "text-gray-900 font-bold"}>
                      {subtotal >= FREE_SHIPPING_THRESHOLD ? 'FREE' : formatMoney(599)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-gray-500 font-medium">
                    <span>Estimated Tax</span>
                    <span className="text-gray-900 font-bold">$0.00</span>
                  </div>
                  {appliedPromo && (
                    <div className="flex justify-between items-center text-green-600 font-bold">
                      <span className="flex items-center gap-1">Discount ({appliedPromo.code})</span>
                      <span>-{formatMoney(appliedPromo.amount)}</span>
                    </div>
                  )}
                  <div className="pt-4 border-t-2 border-gray-50 flex justify-between items-center">
                    <span className="text-xl font-black text-gray-900 tracking-tight">Total</span>
                    <span className="text-3xl font-black text-primary-600 tracking-tighter" data-testid="cart-total">
                       {formatMoney(subtotal + (subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 599) - (appliedPromo?.amount || 0))}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <Link 
                    href={STORE_PATHS.CHECKOUT}
                    className="flex w-full items-center justify-center gap-3 bg-primary-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-primary-200 transition-all hover:bg-primary-700 hover:-translate-y-1 active:translate-y-0"
                  >
                    Checkout Securely <LockKeyhole className="h-5 w-5" />
                  </Link>

                  <button 
                    onClick={() => setShowPromo(!showPromo)}
                    className="w-full py-4 text-sm font-bold text-gray-400 hover:text-primary-600 transition-colors"
                  >
                    {showPromo ? "Remove promo code" : "Have a promo code?"}
                  </button>
                  {showPromo && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="ENTER CODE" 
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                          className="flex-1 bg-gray-50 border-2 border-transparent focus:border-primary-100 rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-widest outline-none"
                        />
                        <button 
                          onClick={handleApplyPromo}
                          disabled={isApplying || !promoCode.trim()}
                          className="bg-gray-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-50"
                        >
                          {isApplying ? '...' : 'Apply'}
                        </button>
                      </div>
                      {promoMessage && (
                        <p className={`text-[10px] font-black uppercase tracking-widest ${promoMessage.isError ? 'text-red-500' : 'text-green-600'}`}>
                          {promoMessage.text}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-12 pt-8 border-t border-gray-50">
                  <div className="flex items-center justify-center gap-6 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700">
                    <CreditCard className="h-6 w-6" />
                    <Shield className="h-6 w-6" />
                    <Info className="h-6 w-6" />
                  </div>
                  <p className="mt-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                    Trusted by 50,000+ Collectors
                  </p>
                </div>
              </div>
              
              <Link href={STORE_PATHS.PRODUCTS} className="mt-8 flex items-center justify-center gap-2 text-sm font-bold text-gray-500 hover:text-primary-600 transition-colors group">
                 <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Continue Shopping
              </Link>

            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
