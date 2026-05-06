'use client';

/**
 * [LAYER: UI]
 * Lazy Stripe Elements payment form for checkout presentation only.
 */
import { useState, useEffect, useRef } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePromise } from './stripeClient';
import { AlertCircle, CreditCard, LockKeyhole, ShieldCheck } from 'lucide-react';
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
  const isMounted = useRef(true);

  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  const categorizeStripeError = (message: string) => {
    if (message.includes('card_declined')) return 'Your card was declined. Please try a different card or contact your bank.';
    if (message.includes('expired_card')) return 'Your card has expired. Please use a different card.';
    if (message.includes('incorrect_cvc')) return 'The CVC code is incorrect. Please check the code and try again.';
    if (message.includes('insufficient_funds')) return 'Your card has insufficient funds. Please try a different payment method.';
    return message;
  };

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
        if (isMounted.current) {
          setError(categorizeStripeError(error.message || 'Payment failed'));
          onPlaceOrder(false);
        }
      } else {
        // onSuccess usually navigates away, but we should still check if we can
        await onSuccess(paymentMethod.id);
        if (isMounted.current) {
           onPlaceOrder(false); // Just in case navigation is delayed
        }
      }
    } catch (err: unknown) {
      if (isMounted.current) {
        setError(err instanceof Error ? categorizeStripeError(err.message) : 'An unexpected error occurred');
        onPlaceOrder(false);
      }
    }
  };

  const isAddressValid = validateAddress(address).valid;

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary-600" />
          Payment details
        </h2>
        <div className="flex gap-1">
          <div className="h-6 w-9 rounded bg-gray-100 border flex items-center justify-center text-[8px] font-bold text-gray-400">VISA</div>
          <div className="h-6 w-9 rounded bg-gray-100 border flex items-center justify-center text-[8px] font-bold text-gray-400">MC</div>
          <div className="h-6 w-9 rounded bg-gray-100 border flex items-center justify-center text-[8px] font-bold text-gray-400">AMEX</div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border shadow-sm ring-1 ring-gray-900/5 focus-within:ring-2 focus-within:ring-primary-500 transition-all mb-6">
        <CardElement options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#111827',
              fontFamily: 'Inter, system-ui, sans-serif',
              '::placeholder': { color: '#9ca3af' },
            },
            invalid: { color: '#dc2626' },
          },
        }} />
      </div>

      {error && (
        <div 
          role="alert" 
          aria-live="assertive"
          className="mb-4 flex items-center gap-2 text-sm font-medium text-red-600 bg-red-50 p-3 rounded-lg border border-red-100"
        >
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isPlacing || !isAddressValid}
        aria-busy={isPlacing}
        className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-4 font-bold text-white shadow-lg transition-all hover:bg-black hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
      >
        {isPlacing ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Processing...
          </>
        ) : (
          <>
            Pay & Place Order
            <LockKeyhole className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
          </>
        )}
      </button>

      <div className="mt-6 flex items-center justify-center gap-4 border-t pt-6 text-[10px] font-bold uppercase tracking-widest text-gray-400">
        <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-green-600" /> SSL SECURE</span>
        <span className="h-3 w-px bg-gray-200" />
        <span className="flex items-center gap-1.5"><LockKeyhole className="h-3.5 w-3.5 text-green-600" /> ENCRYPTED</span>
        <span className="h-3 w-px bg-gray-200" />
        <span className="flex items-center gap-1.5">STRIPE VERIFIED</span>
      </div>
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