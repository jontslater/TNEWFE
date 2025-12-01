import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useHero } from '../hooks/useHero';
import Navigation from '../components/Navigation';
import { heroAPI } from '../api/client';

// Shop item definitions (balanced for monetization)
const GOLD_SHOP_ITEMS = {
  healthpotion: { 
    name: 'Health Potion', 
    cost: 10, // Reduced from 50 (balanced economy)
    description: 'Auto-heal when HP < 30%', 
    type: 'potion',
    icon: '🧪',
    effect: 'Automatically heals you during combat when low on health'
  },
  xpboost: { 
    name: 'XP Boost Scroll', 
    cost: 25, // Reduced from 100 (balanced economy)
    description: '+50% XP for 5min combat time', 
    type: 'buff',
    icon: '📜',
    effect: 'Gain 50% more experience from combat for 5 minutes'
  },
  attackbuff: { 
    name: 'Sharpening Stone', 
    cost: 15, // Reduced from 150 (balanced economy)
    description: '+10% ATK for 10min combat time', 
    type: 'buff',
    icon: '⚔️',
    effect: 'Increases your attack power by 10% for 10 minutes of combat'
  },
  defensebuff: { 
    name: 'Armor Polish', 
    cost: 15, // Reduced from 150 (balanced economy)
    description: '+10% DEF for 10min combat time', 
    type: 'buff',
    icon: '🛡️',
    effect: 'Increases your defense by 10% for 10 minutes of combat'
  }
};

const TOKEN_SHOP_PRICES = {
  common: 50, // Increased from 25 (2x for monetization)
  rare: 200, // Increased from 100 (2x for monetization)
  epic: 600, // Increased from 300 (2x for monetization)
  legendary: 2500, // Increased from 1000 (2.5x for monetization)
  mythic: 10000 // NEW - ultra-rare tier
};

const RARITIES = ['common', 'rare', 'epic', 'legendary', 'mythic'] as const;
const SLOTS = ['weapon', 'armor', 'accessory', 'shield'] as const;

export default function StorePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { hero, refetch: refetchHero } = useHero(user?.twitchId || null);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedTokenItem, setSelectedTokenItem] = useState<{ rarity: string; slot: string } | null>(null);

  const handleGoldPurchase = async (itemKey: string) => {
    if (!user?.id || !hero) return;

    const item = GOLD_SHOP_ITEMS[itemKey as keyof typeof GOLD_SHOP_ITEMS];
    if (!item) return;

    if ((hero.gold || 0) < item.cost) {
      alert(`Not enough gold! You need ${item.cost}g (you have ${hero.gold || 0}g)`);
      return;
    }

    setPurchasing(true);
    try {
      await heroAPI.purchaseGoldItem(user.id, itemKey);
      alert(`✅ Purchased ${item.name}!`);
      refetchHero();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to purchase item');
    } finally {
      setPurchasing(false);
    }
  };

  const handleTokenPurchase = async (rarity: string, slot: string) => {
    if (!user?.id || !hero) return;

    const cost = TOKEN_SHOP_PRICES[rarity as keyof typeof TOKEN_SHOP_PRICES];
    if ((hero.tokens || 0) < cost) {
      alert(`Not enough tokens! You need ${cost}t (you have ${hero.tokens || 0}t)`);
      return;
    }

    setPurchasing(true);
    try {
      await heroAPI.purchaseTokenGear(user.id, rarity, slot);
      alert(`✅ Purchased ${rarity} ${slot}!`);
      refetchHero();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to purchase gear');
    } finally {
      setPurchasing(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    return {
      common: 'text-gray-400',
      rare: 'text-blue-400',
      epic: 'text-purple-400',
      legendary: 'text-yellow-400',
      mythic: 'text-red-400'
    }[rarity] || 'text-gray-400';
  };

  const getRarityBg = (rarity: string) => {
    return {
      common: 'bg-gray-700 border-gray-500',
      rare: 'bg-blue-900/30 border-blue-500',
      epic: 'bg-purple-900/30 border-purple-500',
      legendary: 'bg-yellow-900/30 border-yellow-500',
      mythic: 'bg-red-900/30 border-red-500'
    }[rarity] || 'bg-gray-700';
  };

  if (!isAuthenticated) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Login Required</h1>
            <p className="text-gray-400">Please log in to access the store</p>
          </div>
        </div>
      </>
    );
  }

  if (!hero) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Create a Hero First</h1>
            <button
              onClick={() => navigate('/create-hero')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Create Hero
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
        <div className="container mx-auto px-4 py-8">
          {/* Store Header */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-white mb-2">🏪 Hero Store</h1>
            <p className="text-xl text-gray-400">Enhance your hero with consumables and guaranteed gear</p>
          </div>

          {/* Hero Currency */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="text-sm text-gray-400">Your Gold</div>
                <div className="text-3xl font-bold text-yellow-400">💰 {hero.gold || 0}g</div>
              </div>
              <div className="h-12 w-px bg-gray-600"></div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Your Tokens</div>
                <div className="text-3xl font-bold text-blue-400">🎫 {hero.tokens || 0}t</div>
              </div>
            </div>
            <div className="text-center mt-4 text-sm text-gray-500">
              Earn gold from combat • Earn tokens from idle rewards (!claim in Twitch chat)
            </div>
          </div>

          {/* Gold Shop */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
            <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
              <span>💰</span> Gold Shop
            </h2>
            <p className="text-gray-400 mb-6">Purchase consumables and temporary buffs with gold</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(GOLD_SHOP_ITEMS).map(([key, item]) => {
                const canAfford = (hero.gold || 0) >= item.cost;

                return (
                  <div 
                    key={key}
                    className={`bg-gray-700 rounded-lg p-6 border-2 transition-all ${
                      canAfford ? 'border-yellow-500 hover:border-yellow-400 hover:shadow-lg' : 'border-gray-600 opacity-75'
                    }`}
                  >
                    <div className="text-4xl mb-3 text-center">{item.icon}</div>
                    <div className="font-bold text-white text-center mb-2">{item.name}</div>
                    <div className="text-sm text-blue-300 mb-3 text-center min-h-[40px]">
                      {item.description}
                    </div>
                    <div className="text-xs text-gray-400 mb-4 text-center">
                      {item.effect}
                    </div>
                    <div className="text-center mb-4">
                      <div className="text-2xl font-bold text-yellow-400">{item.cost}g</div>
                    </div>
                    <button
                      onClick={() => handleGoldPurchase(key)}
                      disabled={!canAfford || purchasing}
                      className={`w-full py-2 rounded font-semibold transition-colors ${
                        canAfford && !purchasing
                          ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {canAfford ? 'Purchase' : 'Not Enough Gold'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Token Shop */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
              <span>🎫</span> Token Shop
            </h2>
            <p className="text-gray-400 mb-6">
              Purchase guaranteed gear with tokens • Choose rarity and slot • Stats scale with your level
            </p>

            {/* Token Pricing */}
            <div className="bg-gray-900 rounded-lg p-4 mb-6 border border-gray-700">
              <div className="text-sm font-semibold text-white mb-2">Token Prices:</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(TOKEN_SHOP_PRICES).map(([rarity, cost]) => (
                  <div key={rarity} className="text-center">
                    <span className={`font-semibold capitalize ${getRarityColor(rarity)}`}>{rarity}</span>
                    <span className="text-gray-400 ml-2">{cost}t</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Gear Grid */}
            <div className="space-y-6">
              {RARITIES.map(rarity => (
                <div key={rarity}>
                  <h3 className={`text-xl font-bold capitalize mb-3 ${getRarityColor(rarity)}`}>
                    {rarity} Gear
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {SLOTS.map(slot => {
                      const cost = TOKEN_SHOP_PRICES[rarity];
                      const canAfford = (hero.tokens || 0) >= cost;
                      const slotIcon = slot === 'weapon' ? '⚔️' : slot === 'armor' ? '🛡️' : slot === 'accessory' ? '💍' : '🔰';

                      return (
                        <div
                          key={`${rarity}-${slot}`}
                          className={`rounded-lg p-4 border-2 transition-all ${getRarityBg(rarity)} ${
                            canAfford ? 'hover:shadow-lg cursor-pointer' : 'opacity-50'
                          }`}
                          onClick={() => {
                            if (canAfford && !purchasing) {
                              setSelectedTokenItem({ rarity, slot });
                            }
                          }}
                        >
                          <div className="text-3xl mb-2 text-center">{slotIcon}</div>
                          <div className="font-semibold text-white text-center capitalize mb-2">{slot}</div>
                          <div className="text-sm text-gray-400 text-center mb-3">
                            Guaranteed {rarity} drop
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold text-blue-400">{cost}t</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gold Sinks - Balanced, Not Gacha */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
              <span>⚡</span> Gold Sinks
            </h2>
            <p className="text-gray-400 mb-6">
              Improve your gear and expand storage with gold • Balanced prices, meaningful upgrades
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Equipment Upgrade */}
              <div className="bg-gray-700 rounded-lg p-6 border-2 border-gray-600">
                <div className="text-4xl mb-3 text-center">⬆️</div>
                <div className="font-bold text-white text-center mb-2">Upgrade Equipment</div>
                <div className="text-sm text-gray-400 mb-4 text-center min-h-[60px]">
                  Increase item level by 1-5 levels<br />
                  Cost: 100g per level (scales with item level)
                </div>
                <div className="text-center mb-4">
                  <div className="text-lg font-bold text-yellow-400">100g+ per level</div>
                </div>
                <button
                  onClick={() => alert('Select an item from your inventory or equipment to upgrade!')}
                  className="w-full py-2 rounded font-semibold transition-colors bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  Upgrade Item
                </button>
                <div className="text-xs text-gray-500 mt-2 text-center">
                  +5% stats per level
                </div>
              </div>

              {/* Stat Reforge */}
              <div className="bg-gray-700 rounded-lg p-6 border-2 border-gray-600">
                <div className="text-4xl mb-3 text-center">🔨</div>
                <div className="font-bold text-white text-center mb-2">Reforge Stats</div>
                <div className="text-sm text-gray-400 mb-4 text-center min-h-[60px]">
                  Reroll secondary stats on rare+ items<br />
                  Keeps primary stats, rerolls secondary
                </div>
                <div className="text-center mb-4">
                  <div className="text-lg font-bold text-yellow-400">500g</div>
                </div>
                <button
                  onClick={() => alert('Select a rare+ item from your inventory or equipment to reforge!')}
                  className="w-full py-2 rounded font-semibold transition-colors bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  Reforge Item
                </button>
                <div className="text-xs text-gray-500 mt-2 text-center">
                  Rare+ items only
                </div>
              </div>

              {/* Storage Expansion */}
              <div className="bg-gray-700 rounded-lg p-6 border-2 border-gray-600">
                <div className="text-4xl mb-3 text-center">📦</div>
                <div className="font-bold text-white text-center mb-2">Expand Storage</div>
                <div className="text-sm text-gray-400 mb-4 text-center min-h-[60px]">
                  Add bank slots for item storage<br />
                  Current: {hero.bankSize || 50} slots
                </div>
                <div className="text-center mb-4">
                  <div className="text-lg font-bold text-yellow-400">50g per slot</div>
                </div>
                <button
                  onClick={async () => {
                    const slots = prompt('How many slots? (1-50, default 10)', '10');
                    if (slots) {
                      const numSlots = parseInt(slots);
                      if (numSlots >= 1 && numSlots <= 50) {
                        setPurchasing(true);
                        try {
                          await heroAPI.expandStorage(user?.id || '', numSlots);
                          alert(`✅ Expanded bank by ${numSlots} slots!`);
                          refetchHero();
                        } catch (error: any) {
                          alert(error.response?.data?.error || 'Failed to expand storage');
                        } finally {
                          setPurchasing(false);
                        }
                      }
                    }
                  }}
                  disabled={purchasing}
                  className="w-full py-2 rounded font-semibold transition-colors bg-yellow-600 hover:bg-yellow-700 text-white disabled:bg-gray-600"
                >
                  {purchasing ? 'Expanding...' : 'Expand Bank'}
                </button>
                <div className="text-xs text-gray-500 mt-2 text-center">
                  Max: 500 slots
                </div>
              </div>
            </div>
          </div>

          {/* Token Purchase Confirmation Modal */}
          {selectedTokenItem && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 rounded-lg max-w-md w-full border border-gray-700 p-6">
                <h3 className="text-2xl font-bold text-white mb-4">Confirm Purchase</h3>
                <p className="text-gray-400 mb-4">
                  Purchase <span className={`font-bold capitalize ${getRarityColor(selectedTokenItem.rarity)}`}>
                    {selectedTokenItem.rarity} {selectedTokenItem.slot}
                  </span> for{' '}
                  <span className="font-bold text-blue-400">
                    {TOKEN_SHOP_PRICES[selectedTokenItem.rarity as keyof typeof TOKEN_SHOP_PRICES]} tokens
                  </span>?
                </p>

                <div className="bg-gray-800 rounded p-4 mb-6">
                  <div className="text-sm text-gray-300">
                    <div className="mb-2">✨ <strong>Guaranteed {selectedTokenItem.rarity} quality</strong></div>
                    <div className="mb-2">📊 Stats scale with your level ({hero.level})</div>
                    <div className="mb-2">🎲 Random proc effects for rare+ gear</div>
                    <div>⚡ Instant delivery to inventory</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      handleTokenPurchase(selectedTokenItem.rarity, selectedTokenItem.slot);
                      setSelectedTokenItem(null);
                    }}
                    disabled={purchasing}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded font-semibold transition-colors disabled:bg-gray-600"
                  >
                    {purchasing ? 'Purchasing...' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => setSelectedTokenItem(null)}
                    disabled={purchasing}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
