/**
 * [LAYER: UI]
 * Stripe Elements client loader for checkout presentation only.
 */
import { loadStripe } from '@stripe/stripe-js';

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

export const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

export const isStripeConfigured = Boolean(publishableKey);