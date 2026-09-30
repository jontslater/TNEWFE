import { useState } from 'react';
import { isStripeConfigured, createCheckoutSession } from '../services/stripe';

interface StripeCheckoutProps {
  purchaseId: string;
  packName: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * Stripe Checkout Component
 * Placeholder component for Stripe payment processing
 * 
 * When Stripe is configured:
 * - This component will redirect to Stripe checkout
 * - After payment, user will be redirected back
 * - Backend webhook will complete the purchase
 */
export default function StripeCheckout({
  purchaseId,
  price,
  packName,
  onSuccess,
  onError
}: StripeCheckoutProps) {
  const [processing, setProcessing] = useState(false);

  const handleCheckout = async () => {
    if (!isStripeConfigured()) {
      const message = 'Payment processing is not yet configured. Please contact support.';
      alert(message);
      if (onError) onError(message);
      return;
    }

    setProcessing(true);
    try {
      // createCheckoutSession will redirect automatically
      // Note: Price is looked up on backend from purchaseId for security
      await createCheckoutSession(purchaseId);
      // If we get here without redirect, there was an error (shouldn't happen)
    } catch (error: any) {
      console.error('Checkout error:', error);
      const errorMessage = error.message || 'Failed to start checkout process';
      alert(`Payment error: ${errorMessage}`);
      if (onError) onError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  if (!isStripeConfigured()) {
    return (
      <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-4">
        <h3 className="text-blue-200 font-semibold mb-2">⚠️ Payment Processing</h3>
        <p className="text-blue-300 text-sm mb-3">
          Stripe payment processing is not yet configured.
        </p>
        <p className="text-blue-300 text-sm">
          Once configured, you'll be redirected to Stripe to complete your purchase securely.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 mb-4">
      <h3 className="text-green-200 font-semibold mb-2">🔒 Secure Checkout</h3>
      <p className="text-green-300 text-sm mb-4">
        You'll be redirected to Stripe to complete your payment securely.
      </p>
      <button
        onClick={handleCheckout}
        disabled={processing}
        className={`w-full py-3 rounded-lg font-semibold transition-colors ${
          processing
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700 text-white'
        }`}
      >
        {processing ? 'Processing...' : `Pay $${price.toFixed(2)} with Stripe`}
      </button>
      <p className="text-xs text-green-400 mt-2 text-center">
        Powered by Stripe • Secure payment processing
      </p>
    </div>
  );
}
