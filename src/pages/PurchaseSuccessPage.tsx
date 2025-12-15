import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { apiClient } from '../api/client';

export default function PurchaseSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const purchaseId = searchParams.get('purchaseId');
  
  const [loading, setLoading] = useState(true);
  const [purchase, setPurchase] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!purchaseId) {
      setError('No purchase ID provided');
      setLoading(false);
      return;
    }

    const checkPurchaseStatus = async () => {
      try {
        // Poll for purchase completion (webhook might take a moment)
        let attempts = 0;
        const maxAttempts = 10;
        
        const pollStatus = async () => {
          try {
            // Use the general purchase status endpoint
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/purchases/status/${purchaseId}`);
            if (!response.ok) {
              throw new Error('Failed to fetch purchase status');
            }
            const result = await response.json();
            const purchaseData = result.purchase || result;
            const purchaseStatus = purchaseData.status;
            
            if (purchaseStatus === 'completed') {
              setPurchase(purchaseData);
              setLoading(false);
              return true;
            } else if (purchaseStatus === 'failed' || purchaseStatus === 'cancelled') {
              setError(`Purchase ${purchaseStatus}`);
              setLoading(false);
              return true;
            }
            
            // Still pending, continue polling
            attempts++;
            if (attempts < maxAttempts) {
              setTimeout(pollStatus, 2000); // Check every 2 seconds
            } else {
              setError('Purchase is still processing. Please check back in a moment.');
              setLoading(false);
            }
            return false;
          } catch (err: any) {
            console.error('Error checking purchase status:', err);
            attempts++;
            if (attempts < maxAttempts) {
              setTimeout(pollStatus, 2000);
            } else {
              setError('Failed to check purchase status. Please contact support if your payment was processed.');
              setLoading(false);
            }
            return false;
          }
        };

        await pollStatus();
      } catch (err: any) {
        console.error('Error fetching purchase:', err);
        setError(err.message || 'Failed to load purchase information');
        setLoading(false);
      }
    };

    checkPurchaseStatus();
  }, [purchaseId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-white mb-2">Processing Your Purchase</h2>
            <p className="text-gray-400">Please wait while we confirm your payment...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto bg-gray-800 rounded-lg p-8 border border-red-700 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-white mb-2">Purchase Issue</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/store')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition-colors"
              >
                Back to Store
              </button>
              <button
                onClick={() => navigate('/portal')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded transition-colors"
              >
                Go to Portal
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <Navigation />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto bg-gray-800 rounded-lg p-8 border border-green-700">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-3xl font-bold text-white mb-2">Purchase Successful!</h2>
            <p className="text-gray-400">Thank you for your purchase</p>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-white mb-4">Purchase Details</h3>
            <div className="space-y-2 text-gray-300">
              <div className="flex justify-between">
                <span>Purchase ID:</span>
                <span className="font-mono text-sm">{purchaseId}</span>
              </div>
              {purchase?.packTier && (
                <div className="flex justify-between">
                  <span>Pack Type:</span>
                  <span className="text-blue-400 font-semibold capitalize">{purchase.packTier} Founder's Pack</span>
                </div>
              )}
              {purchase?.packType && (
                <div className="flex justify-between">
                  <span>Pack Type:</span>
                  <span className="text-blue-400 font-semibold capitalize">{purchase.packType} Pack</span>
                </div>
              )}
              {purchase?.badgeAssigned && (
                <div className="flex justify-between">
                  <span>Badge:</span>
                  <span className="text-green-400">✓ Assigned</span>
                </div>
              )}
              {purchase?.titleAssigned && (
                <div className="flex justify-between">
                  <span>Title:</span>
                  <span className="text-green-400">✓ Assigned</span>
                </div>
              )}
              {purchase?.tokensAdded && (
                <div className="flex justify-between">
                  <span>Tokens:</span>
                  <span className="text-green-400">✓ Added</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-6">
            <p className="text-blue-200 text-sm">
              Your purchase has been processed successfully. If you purchased a token pack, tokens and gold have been added to your hero. 
              If you purchased a founder's pack, your badge and title have been assigned.
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/store')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition-colors"
            >
              Back to Store
            </button>
            <button
              onClick={() => navigate('/portal')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded transition-colors"
            >
              Go to Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
