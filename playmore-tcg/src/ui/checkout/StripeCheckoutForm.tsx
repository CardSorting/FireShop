/**
 * [LAYER: UI]
 * Lazy Stripe Elements payment form for checkout presentation only.
 */
import { useState } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePromise } from './stripeClient';
import type { FormEvent } from 'react';
import type { Address } from '@domain/models';
import { validateAddress } from '@utils/validators';

interface StripeCheckoutFormProps {
  address: Address;
  onSuccess: (paymentMethodId: string) => Promise<void>;
  onPlaceOrder: (isPlacing: boolean) => void;
  isPlacing: boolean;
}

function StripeCheckoutFields({ address, onSuccess, onPlaceOrder, isPlacing }: StripeCheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    onPlaceOrder(true);
    setError(null);

    try {
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          address: {
            line1: address.street,
            city: address.city,
            state: address.state,
            postal_code: address.zip,
            country: address.country || 'US',
          },
        },
      });

      if (error) {
        setError(error.message || 'Payment failed');
        onPlaceOrder(false);
      } else {
        await onSuccess(paymentMethod.id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      onPlaceOrder(false);
    }
  };

  const isAddressValid = validateAddress(address).valid;

  return (
    <form onSubmit={handleSubmit} className="border-t pt-6">
      <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-primary-600 text-white text-xs flex items-center justify-center">2</span>
        Payment Details
      </h2>
      <div className="bg-gray-50 rounded-md p-4 border border-gray-200 mb-6">
        <CardElement options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#424770',
              '::placeholder': { color: '#aab7c4' },
            },
            invalid: { color: '#9e2146' },
          },
        }} />
      </div>

      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      <button
        type="submit"
        disabled={!stripe || isPlacing || !isAddressValid}
        className="w-full bg-primary-600 text-white py-3 rounded-md font-medium hover:bg-primary-700 disabled:opacity-50"
      >
        {isPlacing ? 'Processing...' : 'Place Order'}
      </button>
    </form>
  );
}

export function StripeCheckoutForm(props: StripeCheckoutFormProps) {
  if (!stripePromise) return null;

  return (
    <Elements stripe={stripePromise}>
      <StripeCheckoutFields {...props} />
    </Elements>
  );
}