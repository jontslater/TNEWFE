/**
 * Stripe Payment Service
 * Handles Stripe payment processing
 */

import { loadStripe, Stripe } from '@stripe/stripe-js';

// Get Stripe publishable key from environment variables
// Note: Vite uses VITE_ prefix, not REACT_APP_
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || import.meta.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '';

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Initialize Stripe
 * Returns a promise that resolves to Stripe instance or null if key is not set
 */
export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise && STRIPE_PUBLISHABLE_KEY) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise || Promise.resolve(null);
}

/**
 * Create a Stripe checkout session
 * Calls the backend API to create a checkout session and redirects to Stripe
 * 
 * @param purchaseId - The purchase ID from the backend
 * @param price - Price in dollars
 * @returns Checkout session URL or null if error
 */
export async function createCheckoutSession(purchaseId: string, price: number): Promise<string | null> {
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    
    const response = await fetch(`${API_URL}/api/purchases/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purchaseId, price })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to create checkout session' }));
      console.error('[Stripe] Error creating checkout session:', errorData);
      throw new Error(errorData.error || 'Failed to create checkout session');
    }

    const data = await response.json();
    const sessionId = data.sessionId;

    if (!sessionId) {
      console.error('[Stripe] No sessionId in response:', data);
      throw new Error('No checkout session ID received');
    }

    // Redirect to Stripe checkout
    const stripeInstance = await getStripe();
    if (stripeInstance) {
      const { error } = await stripeInstance.redirectToCheckout({ sessionId });
      if (error) {
        console.error('[Stripe] Checkout redirect error:', error);
        throw new Error(error.message || 'Failed to redirect to checkout');
      }
      // redirectToCheckout redirects automatically, but return sessionId for reference
      return sessionId;
    } else {
      throw new Error('Stripe not initialized. Please check your publishable key.');
    }
  } catch (error: any) {
    console.error('[Stripe] Error in createCheckoutSession:', error);
    throw error;
  }
}

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  return !!STRIPE_PUBLISHABLE_KEY && STRIPE_PUBLISHABLE_KEY.startsWith('pk_');
}
