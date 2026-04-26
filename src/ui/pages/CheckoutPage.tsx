'use client';

/**
 * [LAYER: UI]
 */
import { lazy, Suspense, useState } from 'react';
import Link from 'next/link';
import { useServices } from '../hooks/useServices';
import { useAuth } from '../hooks/useAuth';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { isStripeConfigured } from '../checkout/stripeClient';
import type { Address } from '@domain/models';

const StripeCheckoutForm = lazy(() => import('../checkout/StripeCheckoutForm').then((module) => ({ default: module.StripeCheckoutForm })));

export function CheckoutPage() {
  const { user } = useAuth();
  const services = useServices();
  
  const [step, setStep] = useState<'shipping' | 'payment' | 'success'>('shipping');
  const [address, setAddress] = useState<Address>({
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
  });
  const [placing, setPlacing] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'authorizing' | 'finalizing'>('idle');
  const [orderId, setOrderId] = useState<string>('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  async function handleSuccess(paymentMethodId: string) {
    if (!user) return;
    setCheckoutError(null);
    setCheckoutStatus('finalizing');
    try {
      const normalizedAddress = { ...address, country: address.country.trim().toUpperCase() };
      const order = await services.orderService.finalizeTrustedCheckout(user.id, normalizedAddress, paymentMethodId);
      setOrderId(order.id);
      setStep('success');
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Checkout could not be finalized. Please try again.');
    } finally {
      setPlacing(false);
      setCheckoutStatus('idle');
    }
  }

  if (step === 'success') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h2>
        <p className="text-gray-500 mb-2">Thank you for your purchase.</p>
        <p className="text-sm font-mono text-gray-400 mb-6">Order #{orderId.slice(0, 16)}</p>
        <div className="flex gap-3 justify-center">
          <Link href="/orders" className="bg-primary-600 text-white px-6 py-2.5 rounded-md font-medium hover:bg-primary-700">
            View Orders
          </Link>
          <Link href="/products" className="bg-white border text-gray-700 px-6 py-2.5 rounded-md font-medium hover:bg-gray-50">
            Keep Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/cart" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Cart
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

      <div className="bg-white rounded-lg border p-6 space-y-6">
        {!isStripeConfigured && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Checkout is temporarily unavailable because Stripe is not configured for this deployment.
          </div>
        )}
        <div>
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary-600 text-white text-xs flex items-center justify-center">1</span>
            Shipping Address
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <input
              placeholder="Street Address"
              value={address.street}
              onChange={(e) => setAddress({ ...address, street: e.target.value })}
              className="w-full px-3 py-2 border rounded-md text-sm"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                placeholder="City"
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
                required
              />
              <input
                placeholder="State"
                value={address.state}
                onChange={(e) => setAddress({ ...address, state: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input
                placeholder="ZIP"
                value={address.zip}
                onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
                required
              />
              <input
                placeholder="Country (e.g. US)"
                value={address.country}
                onChange={(e) => setAddress({ ...address, country: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
          </div>
        </div>

        {checkoutError && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {checkoutError}
          </div>
        )}

        {checkoutStatus === 'finalizing' && (
          <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            Securely finalizing your order with the trusted checkout service. Do not refresh this page.
          </div>
        )}

        {isStripeConfigured && (
          <Suspense fallback={<div className="border-t pt-6 text-sm text-gray-500">Loading secure payment form...</div>}>
            <StripeCheckoutForm
              address={address} 
              onSuccess={handleSuccess} 
              onPlaceOrder={(isPlacing) => {
                setPlacing(isPlacing);
                setCheckoutStatus(isPlacing ? 'authorizing' : 'idle');
              }} 
              isPlacing={placing} 
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}