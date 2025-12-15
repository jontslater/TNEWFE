import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navigation from '../components/Navigation';

export default function PurchaseCancelPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const purchaseId = searchParams.get('purchaseId');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <Navigation />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto bg-gray-800 rounded-lg p-8 border border-yellow-700">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-3xl font-bold text-white mb-2">Purchase Cancelled</h2>
            <p className="text-gray-400">Your purchase was cancelled</p>
          </div>

          {purchaseId && (
            <div className="bg-gray-900 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-400">
                Purchase ID: <span className="font-mono">{purchaseId}</span>
              </p>
            </div>
          )}

          <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 mb-6">
            <p className="text-yellow-200 text-sm">
              No charges were made. You can return to the store to try again when you're ready.
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
