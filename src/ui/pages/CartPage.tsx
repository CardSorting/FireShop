'use client';

/**
 * [LAYER: UI]
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useServices } from '../hooks/useServices';
import type { Cart, Product } from '@domain/models';
import Link from 'next/link';
import { Trash2, ChevronRight, ShieldCheck, Sparkles, Truck, LifeBuoy } from 'lucide-react';
import { logger } from '@utils/logger';
import { MAX_CART_QUANTITY } from '@domain/rules';

const ESTIMATED_SHIPPING_CENTS = 599;

function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function toFriendlyError(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    if (/stock|available|insufficient/i.test(err.message)) {
      return err.message;
    }
    return err.message || fallback;
  }
  return fallback;
}

function emitCartUpdated(): void {
  window.dispatchEvent(new CustomEvent('cart:updated'));
}

export function CartPage() {
  const services = useServices();
  const [userId, setUserId] = useState<string | null>(null);
  const [cart, setCart] = useState<Cart | null>(null);
  const [products, setProducts] = useState<Record<string, Product | null>>({});
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
      const userCart = await services.cartService.getCart(user.id);
      setCart(userCart);
    } catch (err) {
      logger.error('Failed to load cart.', err);
      setError(toFriendlyError(err, 'Unable to load your cart right now.'));
    } finally {
      setLoading(false);
    }
  }, [services]);

  useEffect(() => {
    void loadCart();
  }, [loadCart]);

  useEffect(() => {
    if (!cart || cart.items.length === 0) {
      setProducts({});
      return;
    }

    const loadProducts = async () => {
      const productIds = cart.items.map((item) => item.productId);
      const results = await Promise.all(
        productIds.map((id) => services.productService.getProduct(id).catch(() => null))
      );

      const productMap: Record<string, Product | null> = {};
      results.forEach((product, index) => {
        productMap[productIds[index]] = product;
      });
      setProducts(productMap);
    };

    void loadProducts();
  }, [cart, services]);

  const items = cart?.items ?? [];
  const hasPendingMutation = clearPending || Object.values(linePending).some(Boolean);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0),
    [items]
  );
  const estimatedTotal = subtotal + ESTIMATED_SHIPPING_CENTS;
  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const setItemPending = (productId: string, pending: boolean) => {
    setLinePending((current) => ({ ...current, [productId]: pending }));
  };

  const handleRemoveFromCart = async (productId: string) => {
    if (!userId || !cart) return;
    setError(null);
    setItemPending(productId, true);
    try {
      const updatedCart = await services.cartService.removeFromCart(userId, productId);
      setCart(updatedCart);
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
    const maxAllowed = Math.min(stockLimit ?? MAX_CART_QUANTITY, MAX_CART_QUANTITY);
    const nextQuantity = Math.max(1, Math.min(quantity, maxAllowed));

    setError(null);
    setItemPending(productId, true);

    try {
      const updatedCart = await services.cartService.updateQuantity(userId, productId, nextQuantity);
      setCart(updatedCart);
      emitCartUpdated();
    } catch (err) {
      setError(toFriendlyError(err, 'Unable to update quantity right now.'));
    } finally {
      setItemPending(productId, false);
    }
  };

  const handleClearCart = async () => {
    if (!userId || items.length === 0 || clearPending) return;
    const confirmed = window.confirm('Clear all items from your cart?');
    if (!confirmed) return;

    setError(null);
    setClearPending(true);
    try {
      await services.cartService.clearCart(userId);
      setCart((current) =>
        current
          ? {
              ...current,
              items: [],
              updatedAt: new Date(),
            }
          : null
      );
      setProducts({});
      emitCartUpdated();
    } catch (err) {
      setError(toFriendlyError(err, 'Unable to clear cart right now.'));
    } finally {
      setClearPending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="max-w-7xl mx-auto text-center py-20 text-gray-500">Loading your cart...</div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-xl border p-8 text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is waiting</h1>
          <p className="text-gray-600 mb-6">Sign in to view your saved cart and checkout securely.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/login" className="px-5 py-2.5 rounded-md bg-primary-600 text-white hover:bg-primary-700">
              Sign In
            </Link>
            <Link href="/products" className="px-5 py-2.5 rounded-md border text-gray-700 hover:bg-gray-50">
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link href="/" className="hover:text-gray-700">Home</Link>
          <span>/</span>
          <span className="text-gray-700">Cart</span>
        </nav>

        <div className="flex items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Cart</h1>
            <p className="text-sm text-gray-500 mt-1">
              {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>
          {items.length > 0 && (
            <button
              onClick={handleClearCart}
              disabled={clearPending || hasPendingMutation}
              className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {clearPending ? 'Clearing...' : 'Clear cart'}
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700 flex items-center justify-between gap-3">
            <span>{error}</span>
            <button onClick={() => void loadCart()} className="text-sm font-medium underline">
              Retry
            </button>
          </div>
        )}

        {items.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const product = products[item.productId];
                const itemPending = !!linePending[item.productId];
                const stockLimit = product?.stock;
                const maxAllowed = Math.min(stockLimit ?? MAX_CART_QUANTITY, MAX_CART_QUANTITY);
                const lowStock = typeof stockLimit === 'number' && stockLimit < item.quantity;
                const unavailable = product === null;

                return (
                  <div
                    key={item.productId}
                    className="bg-white rounded-lg shadow-sm border p-4 flex gap-4"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <Link href={`/products/${item.productId}`} className="font-semibold text-gray-900 hover:text-primary-600">
                          {item.name}
                        </Link>
                        <p className="text-sm text-gray-500 mt-1">
                          Unit price: {formatMoney(item.priceSnapshot)}
                        </p>
                        <p className="text-sm font-medium text-gray-700">
                          Line total: {formatMoney(item.priceSnapshot * item.quantity)}
                        </p>
                        {lowStock && (
                          <p className="text-xs text-amber-700 mt-2">
                            Only {stockLimit} available right now.
                          </p>
                        )}
                        {unavailable && (
                          <p className="text-xs text-amber-700 mt-2">
                            This product is currently unavailable. You can remove it or attempt checkout.
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                            disabled={itemPending || clearPending || item.quantity <= 1}
                            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            -
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                            disabled={itemPending || clearPending || item.quantity >= maxAllowed}
                            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => handleRemoveFromCart(item.productId)}
                          disabled={itemPending || clearPending}
                          className="text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-5 h-5" />
                          <span className="text-sm">Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border p-6 lg:sticky lg:top-20">
                <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatMoney(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Estimated shipping</span>
                    <span>{formatMoney(ESTIMATED_SHIPPING_CENTS)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900 pt-2 border-t">
                    <span>Estimated total</span>
                    <span>{formatMoney(estimatedTotal)}</span>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mb-4">
                  Taxes and final shipping are calculated at checkout.
                </p>

                {hasPendingMutation ? (
                  <button
                    disabled
                    className="w-full bg-gray-300 text-gray-600 py-3 rounded-lg font-medium cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    Updating cart...
                  </button>
                ) : (
                  <Link href="/checkout" className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition flex items-center justify-center gap-2">
                    Proceed to Checkout
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}

                <div className="mt-6 pt-5 border-t space-y-3 text-sm text-gray-600">
                  <p className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-green-600" /> Secure checkout</p>
                  <p className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-green-600" /> Authentic TCG products</p>
                  <p className="flex items-center gap-2"><Truck className="w-4 h-4 text-green-600" /> Ships within 24 hours</p>
                  <p className="flex items-center gap-2"><LifeBuoy className="w-4 h-4 text-green-600" /> Need help? Contact support.</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 px-4 bg-white border rounded-xl text-gray-500">
            <p className="text-lg font-medium text-gray-700">Your cart is empty</p>
            <p className="mt-2">Looks like you haven&apos;t added any cards yet.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/products" className="px-5 py-2.5 rounded-md bg-primary-600 text-white hover:bg-primary-700">
                Start Shopping
              </Link>
              <Link href="/" className="px-5 py-2.5 rounded-md border text-gray-700 hover:bg-gray-50">
                Back Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}