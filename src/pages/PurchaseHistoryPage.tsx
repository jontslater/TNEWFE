import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Navigation from '../components/Navigation';
import { foundersPackAPI } from '../api/client';

interface Purchase {
  id: string;
  userId: string;
  packTier?: string;
  packType?: string;
  heroId?: string;
  price: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  createdAt: any;
  completedAt?: any;
  premiumCurrency?: number;
  tokens?: number;
  gold?: number;
  hero?: {
    id: string;
    name: string;
    level: number;
    role: string;
  };
  heroes?: Array<{
    id: string;
    name: string;
    level: number;
    role: string;
  }>;
}

const PACK_TIERS = {
  bronze: { name: 'Bronze Founder', color: 'text-orange-400' },
  silver: { name: 'Silver Founder', color: 'text-gray-300' },
  gold: { name: 'Gold Founder', color: 'text-yellow-400' },
  platinum: { name: 'Platinum Founder', color: 'text-purple-400' }
};

const TOKEN_PACKS = {
  impulse: { name: 'Impulse Pack', tokens: 100, gold: 1000 },
  starter: { name: 'Starter Pack', tokens: 500, gold: 5000 },
  value: { name: 'Value Pack', tokens: 1500, gold: 15000 },
  premium: { name: 'Premium Pack', tokens: 5000, gold: 50000 }
};

export default function PurchaseHistoryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedPurchases, setExpandedPurchases] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user?.twitchId) {
      loadPurchaseHistory();
    } else {
      setError('Please log in to view your purchase history');
      setLoading(false);
    }
  }, [user?.twitchId]);

  const loadPurchaseHistory = async () => {
    if (!user?.twitchId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await foundersPackAPI.getPurchaseHistory(user.twitchId);
      setPurchases(data.purchases || []);
    } catch (err: any) {
      console.error('Error loading purchase history:', err);
      setError(err.message || 'Failed to load purchase history');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = async (purchaseId: string) => {
    const isExpanding = !expandedPurchases.has(purchaseId);
    
    setExpandedPurchases(prev => {
      const newSet = new Set(prev);
      if (newSet.has(purchaseId)) {
        newSet.delete(purchaseId);
      } else {
        newSet.add(purchaseId);
      }
      return newSet;
    });

    // Load hero details when expanding
    if (isExpanding) {
      const purchase = purchases.find(p => p.id === purchaseId);
      if (purchase && (!purchase.hero || (purchase.packTier && !purchase.heroes))) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/purchases/${purchaseId}/details`);
          if (response.ok) {
            const data = await response.json();
            setPurchases(prev => prev.map(p => 
              p.id === purchaseId ? { ...p, ...data.purchase } : p
            ));
          }
        } catch (err) {
          console.error('Error loading purchase details:', err);
        }
      }
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return dateObj.toLocaleString();
    } catch {
      return 'N/A';
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      completed: 'bg-green-600 text-white',
      pending: 'bg-yellow-600 text-white',
      failed: 'bg-red-600 text-white',
      cancelled: 'bg-gray-600 text-white'
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${colors[status as keyof typeof colors] || colors.pending}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading purchase history...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <Navigation />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-bold text-white">Purchase History</h1>
            <button
              onClick={() => navigate('/store')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
            >
              Back to Store
            </button>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6">
              <p className="text-red-200">{error}</p>
            </div>
          )}

          {purchases.length === 0 && !error && (
            <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
              <p className="text-gray-400 text-lg mb-4">No purchases found</p>
              <button
                onClick={() => navigate('/store')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition-colors"
              >
                Visit the Store
              </button>
            </div>
          )}

          <div className="space-y-4">
            {purchases.map((purchase) => {
              const isExpanded = expandedPurchases.has(purchase.id);
              const isFounderPack = !!purchase.packTier;
              const isTokenPack = !!purchase.packType;

              return (
                <div
                  key={purchase.id}
                  className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden"
                >
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-750 transition-colors"
                    onClick={() => toggleExpand(purchase.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {isFounderPack && (
                            <h3 className={`text-xl font-bold ${PACK_TIERS[purchase.packTier as keyof typeof PACK_TIERS]?.color || 'text-white'}`}>
                              {PACK_TIERS[purchase.packTier as keyof typeof PACK_TIERS]?.name || purchase.packTier}
                            </h3>
                          )}
                          {isTokenPack && (
                            <h3 className="text-xl font-bold text-blue-400">
                              {TOKEN_PACKS[purchase.packType as keyof typeof TOKEN_PACKS]?.name || purchase.packType}
                            </h3>
                          )}
                          {getStatusBadge(purchase.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>${purchase.price.toFixed(2)}</span>
                          <span>•</span>
                          <span>Purchased: {formatDate(purchase.createdAt)}</span>
                          {purchase.completedAt && (
                            <>
                              <span>•</span>
                              <span>Completed: {formatDate(purchase.completedAt)}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-white transition-colors">
                        {isExpanded ? '▼' : '▶'}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-700 p-4 bg-gray-900">
                      <div className="space-y-3">
                        <div>
                          <span className="text-gray-400 text-sm">Purchase ID:</span>
                          <span className="ml-2 font-mono text-xs text-gray-300">{purchase.id}</span>
                        </div>

                        {isFounderPack && (
                          <>
                            <div>
                              <span className="text-gray-400 text-sm">Tokens Added:</span>
                              <span className="ml-2 text-blue-400 font-semibold">+{purchase.premiumCurrency || 0}</span>
                            </div>
                            {purchase.heroes && purchase.heroes.length > 0 && (
                              <div>
                                <span className="text-gray-400 text-sm">Applied to Heroes:</span>
                                <div className="mt-2 space-y-1">
                                  {purchase.heroes.map((hero) => (
                                    <div key={hero.id} className="text-sm text-gray-300">
                                      • {hero.name} (Level {hero.level} {hero.role})
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {isTokenPack && (
                          <>
                            <div className="flex gap-6">
                              <div>
                                <span className="text-gray-400 text-sm">Tokens Added:</span>
                                <span className="ml-2 text-blue-400 font-semibold">
                                  +{TOKEN_PACKS[purchase.packType as keyof typeof TOKEN_PACKS]?.tokens || 0}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400 text-sm">Gold Added:</span>
                                <span className="ml-2 text-yellow-400 font-semibold">
                                  +{TOKEN_PACKS[purchase.packType as keyof typeof TOKEN_PACKS]?.gold?.toLocaleString() || 0}
                                </span>
                              </div>
                            </div>
                            {purchase.hero && (
                              <div>
                                <span className="text-gray-400 text-sm">Hero:</span>
                                <span className="ml-2 text-white font-semibold">
                                  {purchase.hero.name} (Level {purchase.hero.level} {purchase.hero.role})
                                </span>
                              </div>
                            )}
                          </>
                        )}

                        {purchase.status === 'pending' && (
                          <div className="bg-yellow-900/30 border border-yellow-700 rounded p-3">
                            <p className="text-yellow-200 text-sm">
                              This purchase is still processing. Please wait a moment and refresh if your items haven't appeared.
                            </p>
                          </div>
                        )}

                        {purchase.status === 'failed' && (
                          <div className="bg-red-900/30 border border-red-700 rounded p-3">
                            <p className="text-red-200 text-sm">
                              This purchase failed. If you were charged, please contact support with your Purchase ID.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

