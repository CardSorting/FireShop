'use client';

/**
 * [LAYER: UI]
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ChevronRight, LifeBuoy, LockKeyhole, PackageCheck, ShieldCheck, ShoppingBag, Trash2, Truck } from 'lucide-react';
import { useServices } from '../hooks/useServices';
import type { Cart, Product } from '@domain/models';
import { MAX_CART_QUANTITY } from '@domain/rules';
import { logger } from '@utils/logger';

const ESTIMATED_SHIPPING_CENTS = 599;

function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function toFriendlyError(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) {
    if (/insufficient stock/i.test(err.message)) {
      const available = err.message.match(/available\s+(\d+)/i)?.[1];
      return available ? `Only ${available} available right now. Please lower the quantity or remove the item.` : 'One of your items has limited availability. Please review quantities and try again.';
    }
    if (/product not found/i.test(err.message)) return 'One item in your cart is no longer available. Remove it to continue.';
    if (/authentication required/i.test(err.message)) return 'Please sign in again to view and update your saved cart.';
    return err.message;
  }
  return fallback;
}

function emitCartUpdated(): void {
  window.dispatchEvent(new CustomEvent('cart:updated'));
}

function CartProgress() {
  const steps = ['Cart', 'Checkout', 'Confirmation'];
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        {steps.map((step, index) => (
          <div key={step} className="flex flex-1 items-center gap-2">
            <div className="flex items-center gap-2">
              <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${index === 0 ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'}`}>{index + 1}</span>
              <span className={`hidden text-sm font-medium sm:inline ${index === 0 ? 'text-gray-900' : 'text-gray-500'}`}>{step}</span>
            </div>
            {index < steps.length - 1 && <div className="h-px flex-1 bg-gray-200" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function CartLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
        <CartProgress />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {[0, 1, 2].map((key) => (
              <div key={key} className="flex gap-4 rounded-2xl border bg-white p-4 shadow-sm">
                <div className="h-24 w-24 animate-pulse rounded-xl bg-gray-200" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 w-2/3 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-1/3 animate-pulse rounded bg-gray-100" />
                  <div className="h-10 w-40 animate-pulse rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-6 h-5 w-36 animate-pulse rounded bg-gray-200" />
            <div className="space-y-3"><div className="h-4 animate-pulse rounded bg-gray-100" /><div className="h-4 animate-pulse rounded bg-gray-100" /><div className="h-12 animate-pulse rounded-xl bg-gray-200" /></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CartPage() {
  const services = useServices();
  const [userId, setUserId] = useState<string | null>(null);
  const [cart, setCart] = useState<Cart | null>(null);
  const [products, setProducts] = useState<Record<string, Product | null>>({});
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linePending, setLinePending] = useState<Record<string, boolean>>({});
  const [clearPending, setClearPending] = useState(false);

  const loadCart = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await services.authService.getCurrentUser();
      if (!user) {
        setUserId(null);
        setCart(null);
        setProducts({});
        return;
      }
      setUserId(user.id);
      setCart(await services.cartService.getCart(user.id));
    } catch (err) {
      logger.error('Failed to load cart.', err);
      setError(toFriendlyError(err, 'Unable to load your cart right now.'));
    } finally {
      setLoading(false);
    }
  }, [services]);

  useEffect(() => { void loadCart(); }, [loadCart]);

  useEffect(() => {
    if (!cart || cart.items.length === 0) {
      setProducts({});
      setAvailabilityLoading(false);
      return;
    }
    let cancelled = false;
    const loadProducts = async () => {
      setAvailabilityLoading(true);
      const productIds = cart.items.map((item) => item.productId);
      const results = await Promise.all(productIds.map((id) => services.productService.getProduct(id).catch(() => null)));
      if (cancelled) return;
      const productMap: Record<string, Product | null> = {};
      results.forEach((product, index) => { productMap[productIds[index]] = product; });
      setProducts(productMap);
      setAvailabilityLoading(false);
    };
    void loadProducts();
    return () => { cancelled = true; };
  }, [cart, services]);

  const items = cart?.items ?? [];
  const hasPendingMutation = clearPending || Object.values(linePending).some(Boolean);
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0), [items]);
  const estimatedTotal = subtotal + ESTIMATED_SHIPPING_CENTS;
  const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  const setItemPending = (productId: string, pending: boolean) => setLinePending((current) => ({ ...current, [productId]: pending }));

  const handleRemoveFromCart = async (productId: string) => {
    if (!userId || !cart) return;
    setError(null);
    setItemPending(productId, true);
    try {
      setCart(await services.cartService.removeFromCart(userId, productId));
      emitCartUpdated();
    } catch (err) {
      setError(toFriendlyError(err, 'Unable to remove this item right now.'));
    } finally {
      setItemPending(productId, false);
    }
  };

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    if (!userId || !cart) return;
    const stockLimit = products[productId]?.stock;
    const maxAllowed = Math.max(1, Math.min(stockLimit ?? MAX_CART_QUANTITY, MAX_CART_QUANTITY));
    setError(null);
    setItemPending(productId, true);
    try {
      setCart(await services.cartService.updateQuantity(userId, productId, Math.max(1, Math.min(quantity, maxAllowed))));
      emitCartUpdated();
    } catch (err) {
      setError(toFriendlyError(err, 'Unable to update quantity right now.'));
    } finally {
      setItemPending(productId, false);
    }
  };

  const handleClearCart = async () => {
    if (!userId || items.length === 0 || clearPending) return;
    if (!window.confirm('Remove all items from your cart? You can add them again from the product catalog.')) return;
    setError(null);
    setClearPending(true);
    try {
      await services.cartService.clearCart(userId);
      setCart((current) => current ? { ...current, items: [], updatedAt: new Date() } : null);
      setProducts({});
      emitCartUpdated();
    } catch (err) {
      setError(toFriendlyError(err, 'Unable to remove all items right now.'));
    } finally {
      setClearPending(false);
    }
  };

  if (loading) return <CartLoadingSkeleton />;

  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <CartProgress />
          <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
            <LockKeyhole className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary-50 p-3 text-primary-600" />
            <h1 className="mb-2 text-2xl font-semibold text-gray-900">Sign in to see your saved cart</h1>
            <p className="mx-auto mb-6 max-w-xl text-gray-600">Your cart is tied to your account so checkout stays secure and your items are saved between visits.</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/login" className="rounded-lg bg-primary-600 px-5 py-2.5 font-medium text-white hover:bg-primary-700">Sign in securely</Link>
              <Link href="/products" className="rounded-lg border px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50">Browse products</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-sm text-gray-500"><Link href="/" className="hover:text-gray-700">Home</Link><span>/</span><span className="text-gray-700">Cart</span></nav>
        <div className="mb-6"><CartProgress /></div>
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="mb-2 text-sm font-semibold uppercase tracking-wide text-primary-600">Review your order</p><h1 className="text-3xl font-bold text-gray-900">Your cart</h1><p className="mt-1 text-sm text-gray-500">{totalItems} {totalItems === 1 ? 'item' : 'items'} saved for secure checkout.</p></div>
          {items.length > 0 && <div className="flex flex-wrap items-center gap-3"><Link href="/products" className="text-sm font-medium text-gray-600 underline-offset-4 hover:text-gray-900 hover:underline">Continue shopping</Link><button onClick={handleClearCart} disabled={clearPending || hasPendingMutation} className="text-sm font-medium text-red-600 underline-offset-4 hover:text-red-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50">{clearPending ? 'Removing items...' : 'Remove all items'}</button></div>}
        </div>
        {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="flex items-start gap-2 text-sm"><AlertCircle className="mt-0.5 h-4 w-4 flex-none" /><span>{error} Your cart is safe — try again or keep shopping.</span></p><div className="flex gap-3 text-sm font-medium"><button onClick={() => void loadCart()} className="underline">Try again</button><Link href="/products" className="underline">Shop products</Link></div></div></div>}
        {items.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              {availabilityLoading && <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">Checking current availability for your cart items…</div>}
              {items.map((item) => {
                const product = products[item.productId];
                const itemPending = !!linePending[item.productId];
                const stockLimit = product?.stock;
                const maxAllowed = Math.max(1, Math.min(stockLimit ?? MAX_CART_QUANTITY, MAX_CART_QUANTITY));
                const overAvailable = typeof stockLimit === 'number' && stockLimit < item.quantity;
                const unavailable = product === null;
                const atMax = item.quantity >= maxAllowed;
                return (
                  <article key={item.productId} className="rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md">
                    <div className="flex flex-col gap-4 sm:flex-row">
                      <Link href={`/products/${item.productId}`} className="shrink-0"><img src={item.imageUrl} alt={item.name} className="h-28 w-28 rounded-xl object-cover ring-1 ring-gray-100" /></Link>
                      <div className="flex flex-1 flex-col gap-4">
                        <div className="flex flex-col justify-between gap-3 sm:flex-row"><div><Link href={`/products/${item.productId}`} className="text-base font-semibold text-gray-900 hover:text-primary-600">{item.name}</Link><p className="mt-1 text-sm text-gray-500">Unit price {formatMoney(item.priceSnapshot)}</p>{unavailable && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">This item is no longer available. Remove it before checkout for the smoothest experience.</p>}{overAvailable && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Only {stockLimit} available right now. Lower the quantity to continue.</p>}</div><div className="text-left sm:text-right"><p className="text-xs uppercase tracking-wide text-gray-500">Line total</p><p className="text-lg font-bold text-gray-900">{formatMoney(item.priceSnapshot * item.quantity)}</p></div></div>
                        <div className="flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Quantity</p><div className="inline-flex items-center rounded-lg border bg-white shadow-sm"><button type="button" aria-label={`Decrease quantity for ${item.name}`} onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)} disabled={itemPending || clearPending || item.quantity <= 1} className="px-3 py-2 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">−</button><span className="min-w-12 border-x px-4 py-2 text-center text-sm font-semibold text-gray-900" aria-live="polite">{itemPending ? '…' : item.quantity}</span><button type="button" aria-label={`Increase quantity for ${item.name}`} onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)} disabled={itemPending || clearPending || atMax} className="px-3 py-2 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">+</button></div><p className="mt-2 text-xs text-gray-500">{typeof stockLimit === 'number' ? `Up to ${maxAllowed} available for this order.` : `Limit ${MAX_CART_QUANTITY} per item.`}</p></div><button type="button" onClick={() => handleRemoveFromCart(item.productId)} disabled={itemPending || clearPending} className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"><Trash2 className="h-4 w-4" />Remove</button></div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            <aside className="lg:col-span-1"><div className="rounded-2xl border bg-white p-6 shadow-sm lg:sticky lg:top-20"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold text-gray-900">Order summary</h2><span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">{totalItems} {totalItems === 1 ? 'item' : 'items'}</span></div><div className="space-y-3 text-sm"><div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatMoney(subtotal)}</span></div><div className="flex justify-between text-gray-600"><span>Estimated shipping</span><span>{formatMoney(ESTIMATED_SHIPPING_CENTS)}</span></div><div className="flex justify-between border-t pt-3 text-base font-bold text-gray-900"><span>Estimated total</span><span>{formatMoney(estimatedTotal)}</span></div></div><p className="mt-4 rounded-xl bg-gray-50 p-3 text-xs leading-relaxed text-gray-600">You can review shipping, taxes, and payment details before placing your order.</p>{hasPendingMutation ? <button disabled className="mt-5 flex w-full cursor-not-allowed items-center justify-center rounded-xl bg-gray-300 py-3 font-semibold text-gray-600">Saving cart…</button> : <Link href="/checkout" className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3 font-semibold text-white transition hover:bg-primary-700">Checkout securely<ChevronRight className="h-4 w-4" /></Link>}<Link href="/products" className="mt-3 flex w-full items-center justify-center rounded-xl border py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">Continue shopping</Link><div className="mt-6 space-y-3 border-t pt-5 text-sm text-gray-600"><p className="flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-green-600" /> Encrypted Stripe-style payment flow</p><p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-green-600" /> Secure account-backed cart</p><p className="flex items-center gap-2"><PackageCheck className="h-4 w-4 text-green-600" /> Authentic TCG products</p><p className="flex items-center gap-2"><Truck className="h-4 w-4 text-green-600" /> Ships within 24 hours when available</p><p className="flex items-center gap-2"><LifeBuoy className="h-4 w-4 text-green-600" /> Need help? Contact support before checkout.</p></div></div></aside>
          </div>
        ) : (
          <div className="rounded-2xl border bg-white px-4 py-16 text-center text-gray-500 shadow-sm"><ShoppingBag className="mx-auto mb-4 h-14 w-14 rounded-full bg-primary-50 p-3 text-primary-600" /><p className="text-xl font-semibold text-gray-900">Your cart is empty</p><p className="mx-auto mt-2 max-w-md">Find cards, sealed products, and accessories, then return here when you&apos;re ready to checkout.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Link href="/products" className="rounded-lg bg-primary-600 px-5 py-2.5 font-medium text-white hover:bg-primary-700">Shop products</Link><Link href="/" className="rounded-lg border px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50">Back home</Link></div></div>
        )}
      </div>
    </div>
  );
}
