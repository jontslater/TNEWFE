/**
 * Stripe Payment Service
 * Handles Stripe payment processing
 */

import { loadStripe, Stripe } from '@stripe/stripe-js';
import { apiClient } from '../api/client';

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
 * ⚠️ SECURITY NOTE: Only sends purchaseId to backend. The backend must look up
 * the actual price from its own database - never trust client-provided prices!
 * 
 * @param purchaseId - The purchase ID from the backend
 * @returns Checkout session URL or null if error
 */
export async function createCheckoutSession(purchaseId: string): Promise<string | null> {
  try {
    // ⚠️ SECURITY: Only send purchaseId - backend looks up price from database
    // Use apiClient to ensure Authorization header is sent
    const response = await apiClient.post('/api/purchases/create-checkout-session', {
      purchaseId
    });

    const data = response.data;
    const sessionId = data.sessionId;
    const checkoutUrl = data.url;

    if (!sessionId) {
      console.error('[Stripe] No sessionId in response:', data);
      throw new Error('No checkout session ID received');
    }

    // Redirect to Stripe checkout using the URL directly
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
      return sessionId;
    } else {
      throw new Error('No checkout URL received from server');
    }
  } catch (error: any) {
    console.error('[Stripe] Error in createCheckoutSession:', error);
    throw error;
  }
}

/**
 * Check if Stripe is configured
 * In development/localhost, allow purchases even without Stripe key (for testing)
 */
export function isStripeConfigured(): boolean {
  // In development, allow purchases even without Stripe key
  if (import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return true; // Allow in dev mode for testing
  }
  return !!STRIPE_PUBLISHABLE_KEY && STRIPE_PUBLISHABLE_KEY.startsWith('pk_');
}
