/**
 * Loot Token Shop Page
 * Allows users to purchase items with loot tokens
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';
import { getRarityHexColor } from '../utils/format';

interface LootTokenBalance {
  userId: string;
  lootTokens: number;
  lastUpdated: number | null;
}

interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  itemType: string;
  rarity: string;
  icon?: string;
}

export default function LootTokenShop() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<LootTokenBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  // Example shop items (would come from backend in production)
  const shopItems: ShopItem[] = [
    {
      id: 'weapon-token',
      name: 'Weapon Token',
      description: 'Redeem for a random weapon of your level',
      cost: 10,
      itemType: 'weapon',
      rarity: 'epic',
      icon: '⚔️'
    },
    {
      id: 'armor-token',
      name: 'Armor Token',
      description: 'Redeem for a random armor piece of your level',
      cost: 10,
      itemType: 'armor',
      rarity: 'epic',
      icon: '🛡️'
    },
    {
      id: 'accessory-token',
      name: 'Accessory Token',
      description: 'Redeem for a random accessory of your level',
      cost: 8,
      itemType: 'accessory',
      rarity: 'rare',
      icon: '💍'
    },
    {
      id: 'legendary-token',
      name: 'Legendary Token',
      description: 'Redeem for a random legendary item of your level',
      cost: 50,
      itemType: 'any',
      rarity: 'legendary',
      icon: '✨'
    }
  ];

  useEffect(() => {
    if (user?.id) {
      loadBalance();
    }
  }, [user]);

  const loadBalance = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response = await apiClient.get(`/api/loot-tokens/${user.id}`);
      setBalance(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load loot token balance:', err);
      setError('Failed to load balance');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (item: ShopItem) => {
    if (!user?.id || !balance) return;
    if (balance.lootTokens < item.cost) {
      setError('Insufficient loot tokens');
      return;
    }

    try {
      setPurchasing(item.id);
      setError(null);

      const response = await apiClient.post('/api/loot-tokens/spend', {
        userId: user.id,
        amount: item.cost,
        itemId: item.id,
        itemName: item.name
      });

      if (response.data.success) {
        setBalance({
          ...balance,
          lootTokens: response.data.newBalance
        });
        alert(`Purchased ${item.name}!`);
      }
    } catch (err: any) {
      console.error('Failed to purchase item:', err);
      setError(err.response?.data?.error || 'Failed to purchase item');
    } finally {
      setPurchasing(null);
    }
  };

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-white">Please log in to access the Loot Token Shop</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  const getRarityColor = (rarity: string): string => {
    const colors: Record<string, string> = {
      common: '#9e9e9e',
      rare: '#2196f3',
      epic: '#9c27b0',
      legendary: '#ff9800',
      mythic: '#ef4444' // Red for mythic
    };
    return colors[rarity] || getRarityHexColor(rarity);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Loot Token Shop</h1>

      {/* Balance Display */}
      {balance && (
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border-2 border-yellow-500">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-yellow-500 mb-2">Your Balance</h2>
              <p className="text-3xl font-bold text-white">{balance.lootTokens} Tokens</p>
            </div>
            <div className="text-6xl">🪙</div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-900 border border-red-500 text-white px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Shop Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shopItems.map((item) => {
          const canAfford = balance ? balance.lootTokens >= item.cost : false;
          const isPurchasing = purchasing === item.id;

          return (
            <div
              key={item.id}
              className="bg-gray-800 rounded-lg p-6 border-2"
              style={{
                borderColor: item.color || getRarityHexColor(item.rarity),
                opacity: canAfford ? 1 : 0.6
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                {item.icon && <span className="text-4xl">{item.icon}</span>}
                <div>
                  <h3 className="text-xl font-bold text-white">{item.name}</h3>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: getRarityColor(item.rarity) }}
                  >
                    {item.rarity.toUpperCase()}
                  </p>
                </div>
              </div>

              <p className="text-gray-300 mb-4 text-sm">{item.description}</p>

              <div className="flex justify-between items-center">
                <div className="text-2xl font-bold text-yellow-500">
                  {item.cost} 🪙
                </div>
                <button
                  onClick={() => handlePurchase(item)}
                  disabled={!canAfford || isPurchasing}
                  className={`px-4 py-2 rounded font-semibold transition-colors ${
                    canAfford
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isPurchasing ? 'Purchasing...' : 'Purchase'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
