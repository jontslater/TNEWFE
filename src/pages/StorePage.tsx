import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useHero } from '../hooks/useHero';
import Navigation from '../components/Navigation';
import { heroAPI, tokenPackAPI } from '../api/client';
import { createCheckoutSession, isStripeConfigured } from '../services/stripe';

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
  mythic: 10000 // Ultra-rare tier (3.5x multiplier - slightly weaker than raid/dungeon mythic at 4.0x)
};

const RARITIES = ['common', 'rare', 'epic', 'legendary', 'mythic'] as const;
const SLOTS = ['weapon', 'armor', 'accessory', 'shield'] as const;

export default function StorePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { hero, heroes, refetch: refetchHero } = useHero(user?.twitchId || null);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedTokenItem, setSelectedTokenItem] = useState<{ rarity: string; slot: string; heroId: string | null; quantity?: number } | null>(null);
  const [selectedGoldItem, setSelectedGoldItem] = useState<{ itemKey: string; heroId: string | null; quantity?: number } | null>(null);
  const [selectedTokenPack, setSelectedTokenPack] = useState<{ type: string; heroId: string | null } | null>(null);
  const [slotInfo, setSlotInfo] = useState<{
    slotsUnlocked: number;
    heroCount: number;
    nextSlot: number;
    nextSlotCost: number | null;
    totalTokens: number;
    maxHeroes: number;
    canUnlock: boolean;
  } | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  // Load slot info on mount and when heroes change
  React.useEffect(() => {
    if (user?.id && heroes) {
      loadSlotInfo();
    }
  }, [user?.id, heroes?.length]);

  const loadSlotInfo = async () => {
    if (!user?.id) return;
    try {
      const info = await heroAPI.getSlotInfo(user.id, user.twitchId, undefined);
      setSlotInfo(info);
    } catch (error) {
      console.error('Failed to load slot info:', error);
    }
  };

  const handleUnlockSlot = async () => {
    if (!user?.id || !slotInfo || unlocking) return;
    
    if (!slotInfo.canUnlock) {
      alert(`Cannot unlock slot ${slotInfo.nextSlot}. You need ${slotInfo.nextSlotCost || 0} tokens.`);
      return;
    }

    setUnlocking(true);
    try {
      await heroAPI.unlockHeroSlot(user.id, user.twitchId, undefined);
      alert(`Successfully unlocked hero slot ${slotInfo.nextSlot}! You can now create ${slotInfo.nextSlot} heroes.`);
      await loadSlotInfo(); // Refresh slot info
      if (refetchHero) await refetchHero(); // Refresh heroes to update token totals
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to unlock slot. Please try again.');
      console.error('Failed to unlock slot:', error);
    } finally {
      setUnlocking(false);
    }
  };

  const handleGoldPurchaseClick = (itemKey: string) => {
    // Check if user has multiple heroes
    if (!heroes || heroes.length === 0) {
      alert('No heroes found. Create a hero first!');
      return;
    }

    if (heroes.length === 1) {
      // Only one hero - show modal with quantity selector
      setSelectedGoldItem({ itemKey, heroId: heroes[0].id || null, quantity: 1 });
      return;
    }

    // Multiple heroes - show selection modal
    setSelectedGoldItem({ itemKey, heroId: null });
  };

  const handleGoldPurchase = async (itemKey: string, heroId: string, quantity: number = 1) => {
    if (!user?.id || !heroId) return;

    const item = GOLD_SHOP_ITEMS[itemKey as keyof typeof GOLD_SHOP_ITEMS];
    if (!item) return;

    // Find the selected hero to check gold
    const targetHero = heroes?.find(h => h.id === heroId);
    if (!targetHero) {
      alert('Hero not found');
      return;
    }

    const totalCost = item.cost * quantity;
    if ((targetHero.gold || 0) < totalCost) {
      alert(`Not enough gold! ${targetHero.name} needs ${totalCost}g (has ${targetHero.gold || 0}g)`);
      return;
    }

    setPurchasing(true);
    try {
      // Purchase using hero document ID (backend expects hero doc ID, not Twitch user ID)
      await heroAPI.purchaseGoldItem(heroId, itemKey, quantity);
      alert(`✅ Purchased ${quantity}x ${item.name} for ${targetHero.name}!`);
      setSelectedGoldItem(null);
      refetchHero();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to purchase item';
      alert(errorMsg);
      console.error('Purchase error:', error);
    } finally {
      setPurchasing(false);
      setSelectedGoldItem(null);
    }
  };

  const handleTokenPackPurchase = async (packType: string, heroId: string | null) => {
    if (!user?.id || !heroId) {
      alert('Please select a hero to receive the token pack.');
      return;
    }

    if (!user.twitchId) {
      alert('User ID not found. Please log in again.');
      return;
    }

    // Check if Stripe is configured
    if (!isStripeConfigured()) {
      alert('Payment processing is not yet configured. Please contact support.');
      return;
    }

    setPurchasing(true);
    try {
      // Initiate purchase to get purchaseId
      const result = await tokenPackAPI.initiatePurchase(user.twitchId, packType as 'impulse' | 'starter' | 'value' | 'premium', heroId);
      
      if (!result.success || !result.purchaseId) {
        throw new Error(result.message || 'Failed to initiate purchase');
      }

      // Get pack price
      const packPrices: Record<string, number> = {
        impulse: 0.99,
        starter: 4.99,
        value: 9.99,
        premium: 24.99
      };

      const price = packPrices[packType] || 0;

      // Create Stripe checkout session and redirect
      await createCheckoutSession(result.purchaseId, price);
      // Note: createCheckoutSession will redirect to Stripe automatically
      
      setSelectedTokenPack(null);
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to start purchase process';
      alert(`Purchase error: ${errorMsg}`);
      console.error('Token pack purchase error:', error);
    } finally {
      setPurchasing(false);
    }
  };

  const handleTokenPurchaseClick = (rarity: string, slot: string) => {
    // Check if user has multiple heroes
    if (!heroes || heroes.length === 0) {
      alert('No heroes found. Create a hero first!');
      return;
    }

    if (heroes.length === 1) {
      // Only one hero - show modal with quantity selector
      setSelectedTokenItem({ rarity, slot, heroId: heroes[0].id || null, quantity: 1 });
      return;
    }

    // Multiple heroes - show selection modal with quantity
    setSelectedTokenItem({ rarity, slot, heroId: null, quantity: 1 });
  };

  const handleTokenPurchase = async (rarity: string, slot: string, heroId: string, quantity: number = 1) => {
    if (!heroId) return;

    const costPerItem = TOKEN_SHOP_PRICES[rarity as keyof typeof TOKEN_SHOP_PRICES];
    const totalCost = costPerItem * quantity;
    const targetHero = heroes?.find(h => h.id === heroId);
    
    if (!targetHero) {
      alert('Hero not found');
      return;
    }

    if ((targetHero.tokens || 0) < totalCost) {
      alert(`Not enough tokens! ${targetHero.name} needs ${totalCost}t (${quantity}x ${costPerItem}t, has ${targetHero.tokens || 0}t)`);
      return;
    }

    setPurchasing(true);
    try {
      // Use hero document ID (backend expects hero doc ID, not Twitch user ID)
      await heroAPI.purchaseTokenGear(heroId, rarity, slot, quantity);
      alert(`✅ Purchased ${quantity}x ${rarity} ${slot} for ${targetHero.name}!`);
      setSelectedTokenItem(null);
      refetchHero();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to purchase gear';
      alert(errorMsg);
      console.error('Purchase error:', error);
    } finally {
      setPurchasing(false);
      setSelectedTokenItem(null);
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

  if (!heroes || heroes.length === 0) {
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
  
  // Use first hero for display purposes (gold/token display)
  const displayHero = hero || heroes[0];

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
        <div className="container mx-auto px-4 py-8">
          {/* Store Header */}
          <div className="text-center mb-8">
            <div className="flex justify-between items-center mb-4">
              <div></div>
              <div>
                <h1 className="text-5xl font-bold text-white mb-2">🏪 Hero Store</h1>
                <p className="text-xl text-gray-400">Enhance your hero with consumables and guaranteed gear</p>
              </div>
              <button
                onClick={() => navigate('/purchases/history')}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
              >
                View Purchase History
              </button>
            </div>
          </div>

          {/* Hero Currency */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="text-sm text-gray-400">Total Gold (All Heroes)</div>
                <div className="text-3xl font-bold text-yellow-400">💰 {heroes?.reduce((sum, h) => sum + (h.gold || 0), 0) || 0}g</div>
              </div>
              <div className="h-12 w-px bg-gray-600"></div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Total Tokens (All Heroes)</div>
                <div className="text-3xl font-bold text-blue-400">🎫 {heroes?.reduce((sum, h) => sum + (h.tokens || 0), 0) || 0}t</div>
              </div>
            </div>
            <div className="text-center mt-4 text-sm text-gray-500">
              Earn gold from combat • Earn tokens from idle rewards (!claim in Twitch chat)
            </div>
          </div>

          {/* Token Purchase Packs */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
            <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
              <span>🎫</span> Token Purchase Packs
            </h2>
            <p className="text-gray-400 mb-6">Buy tokens directly - Standard gacha pricing</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { type: 'impulse', price: 0.99, tokens: 100, gold: 1000, name: 'Impulse Pack', highlight: '🔥 Impulse Buy' },
                { type: 'starter', price: 4.99, tokens: 500, gold: 5000, name: 'Starter Pack', highlight: '⭐ Most Popular' },
                { type: 'value', price: 9.99, tokens: 1500, gold: 15000, name: 'Value Pack', highlight: '💎 Best Value' },
                { type: 'premium', price: 24.99, tokens: 5000, gold: 50000, name: 'Premium Pack', highlight: '👑 Whale Tier' }
              ].map((pack) => (
                <div
                  key={pack.type}
                  className="bg-gray-700 rounded-lg p-6 border-2 border-gray-600 hover:border-gray-500 transition-all"
                >
                  <div className="text-center mb-4">
                    <div className="text-xs font-semibold text-gray-400 mb-1">{pack.highlight}</div>
                    <div className="text-xl font-bold text-white mb-2">{pack.name}</div>
                    <div className="text-3xl font-bold text-white mb-1">${pack.price}</div>
                  </div>
                  
                  <div className="bg-gray-900 rounded-lg p-3 mb-4 border border-gray-600">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-300">Tokens:</span>
                      <span className="text-lg font-bold text-blue-400">{pack.tokens.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">Gold:</span>
                      <span className="text-lg font-bold text-yellow-400">{pack.gold.toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2 text-center">
                      ~${(pack.price / pack.tokens * 100).toFixed(2)} per 100 tokens
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (!heroes || heroes.length === 0) {
                        alert('No heroes found. Create a hero first!');
                        return;
                      }
                      if (heroes.length === 1) {
                        handleTokenPackPurchase(pack.type, heroes[0].id || null);
                      } else {
                        setSelectedTokenPack({ type: pack.type, heroId: null });
                      }
                    }}
                    disabled={purchasing || !heroes || heroes.length === 0}
                    className={`w-full py-3 rounded font-semibold transition-colors ${
                      purchasing || !heroes || heroes.length === 0
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {purchasing ? 'Processing...' : 'Purchase'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Slot Expansion */}
          {slotInfo && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                🎭 Hero Slot Expansion
              </h2>
              <div className="bg-gray-900 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <div className="text-sm text-gray-400">Current Heroes</div>
                    <div className="text-2xl font-bold text-white">
                      {slotInfo.heroCount} / {slotInfo.slotsUnlocked}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Max Slots</div>
                    <div className="text-2xl font-bold text-blue-400">{slotInfo.maxHeroes}</div>
                  </div>
                </div>
                
                {slotInfo.heroCount >= slotInfo.slotsUnlocked && slotInfo.nextSlot <= slotInfo.maxHeroes ? (
                  <div className="border-t border-gray-700 pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <div className="text-sm text-gray-400">Next Slot</div>
                        <div className="text-lg font-semibold text-white">Slot {slotInfo.nextSlot}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-400">Cost</div>
                        <div className={`text-lg font-bold ${slotInfo.totalTokens >= (slotInfo.nextSlotCost || 0) ? 'text-green-400' : 'text-red-400'}`}>
                          {slotInfo.nextSlotCost || 0} tokens
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mb-3">
                      Available tokens: {slotInfo.totalTokens}t
                    </div>
                    <button
                      onClick={handleUnlockSlot}
                      disabled={!slotInfo.canUnlock || unlocking}
                      className={`w-full py-3 rounded font-semibold transition-colors ${
                        slotInfo.canUnlock && !unlocking
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {unlocking ? 'Unlocking...' : `Unlock Slot ${slotInfo.nextSlot}`}
                    </button>
                  </div>
                ) : slotInfo.heroCount < slotInfo.slotsUnlocked ? (
                  <div className="border-t border-gray-700 pt-4">
                    <div className="text-sm text-green-400">
                      ✓ You have {slotInfo.slotsUnlocked - slotInfo.heroCount} unused slot{slotInfo.slotsUnlocked - slotInfo.heroCount !== 1 ? 's' : ''}. Create more heroes!
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-gray-700 pt-4">
                    <div className="text-sm text-gray-400">
                      Maximum hero slots reached ({slotInfo.maxHeroes} slots)
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Gold Shop */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
            <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
              <span>💰</span> Gold Shop
            </h2>
            <p className="text-gray-400 mb-6">Purchase consumables and temporary buffs with gold</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(GOLD_SHOP_ITEMS).map(([key, item]) => {
                // Check if any hero can afford it
                const canAfford = heroes?.some(h => (h.gold || 0) >= item.cost) || false;

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
                      onClick={() => handleGoldPurchaseClick(key)}
                      disabled={purchasing}
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
                      // Check if any hero can afford it
                      const canAfford = heroes?.some(h => (h.tokens || 0) >= cost) || false;
                      const slotIcon = slot === 'weapon' ? '⚔️' : slot === 'armor' ? '🛡️' : slot === 'accessory' ? '💍' : '🔰';

                      return (
                        <div
                          key={`${rarity}-${slot}`}
                          className={`rounded-lg p-4 border-2 transition-all ${getRarityBg(rarity)} ${
                            canAfford ? 'hover:shadow-lg cursor-pointer' : 'opacity-50'
                          }`}
                          onClick={() => {
                            if (canAfford && !purchasing) {
                              handleTokenPurchaseClick(rarity, slot);
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


          {/* Hero Selection Modal for Token Packs */}
          {selectedTokenPack && heroes && heroes.length > 1 && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 rounded-lg max-w-2xl w-full border border-gray-700 p-6">
                <h3 className="text-2xl font-bold text-white mb-4">Purchase Token Pack</h3>
                <p className="text-gray-400 mb-4">
                  Which hero should receive the token pack?
                </p>

                <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
                  {heroes.map((h) => {
                    const packInfo = {
                      impulse: { name: 'Impulse Pack', price: 0.99, tokens: 100, gold: 1000 },
                      starter: { name: 'Starter Pack', price: 4.99, tokens: 500, gold: 5000 },
                      value: { name: 'Value Pack', price: 9.99, tokens: 1500, gold: 15000 },
                      premium: { name: 'Premium Pack', price: 24.99, tokens: 5000, gold: 50000 }
                    }[selectedTokenPack.type] || { name: 'Token Pack', price: 0, tokens: 0, gold: 0 };

                    return (
                      <button
                        key={h.id}
                        onClick={() => handleTokenPackPurchase(selectedTokenPack.type, h.id || null)}
                        className="w-full bg-gray-800 hover:bg-gray-700 rounded-lg p-4 border border-gray-600 text-left transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-white">{h.name}</div>
                            <div className="text-sm text-gray-400">
                              {h.role} Lv{h.level || 1} • {h.tokens || 0}t
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-400">Will receive:</div>
                            <div className="text-blue-300 font-semibold">+{packInfo.tokens}t</div>
                            <div className="text-yellow-300 font-semibold">+{packInfo.gold.toLocaleString()}g</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setSelectedTokenPack(null)}
                  className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Hero Selection Modal for Gold Shop Items */}
          {selectedGoldItem && heroes && heroes.length > 0 && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 rounded-lg max-w-2xl w-full border border-gray-700 p-6">
                <h3 className="text-2xl font-bold text-white mb-4">Purchase Item</h3>
                <p className="text-gray-400 mb-4">
                  Which hero should receive{' '}
                  <span className="font-bold text-yellow-400">
                    {GOLD_SHOP_ITEMS[selectedGoldItem.itemKey as keyof typeof GOLD_SHOP_ITEMS]?.name}
                  </span>?
                </p>

                {/* Quantity Selector */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Quantity</label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => {
                        if (selectedGoldItem.quantity && selectedGoldItem.quantity > 1) {
                          setSelectedGoldItem({ ...selectedGoldItem, quantity: selectedGoldItem.quantity - 1 });
                        }
                      }}
                      disabled={!selectedGoldItem.quantity || selectedGoldItem.quantity <= 1}
                      className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white w-10 h-10 rounded font-bold"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={selectedGoldItem.quantity || 1}
                      onChange={(e) => {
                        const qty = Math.max(1, Math.min(100, parseInt(e.target.value) || 1));
                        setSelectedGoldItem({ ...selectedGoldItem, quantity: qty });
                      }}
                      className="w-20 text-center bg-gray-800 text-white border border-gray-600 rounded px-3 py-2"
                    />
                    <button
                      onClick={() => {
                        const currentQty = selectedGoldItem.quantity || 1;
                        if (currentQty < 100) {
                          setSelectedGoldItem({ ...selectedGoldItem, quantity: currentQty + 1 });
                        }
                      }}
                      disabled={selectedGoldItem.quantity && selectedGoldItem.quantity >= 100}
                      className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white w-10 h-10 rounded font-bold"
                    >
                      +
                    </button>
                    <span className="text-gray-400 text-sm">
                      Total: <span className="text-yellow-400 font-semibold">
                        {(GOLD_SHOP_ITEMS[selectedGoldItem.itemKey as keyof typeof GOLD_SHOP_ITEMS]?.cost || 0) * (selectedGoldItem.quantity || 1)}g
                      </span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 max-h-96 overflow-y-auto">
                  {heroes.map((h) => {
                    const item = GOLD_SHOP_ITEMS[selectedGoldItem.itemKey as keyof typeof GOLD_SHOP_ITEMS];
                    const quantity = selectedGoldItem.quantity || 1;
                    const totalCost = (item?.cost || 0) * quantity;
                    const canAfford = (h.gold || 0) >= totalCost;
                    
                    return (
                      <button
                        key={h.id}
                        onClick={() => {
                          if (canAfford && h.id) {
                            handleGoldPurchase(selectedGoldItem.itemKey, h.id, quantity);
                          }
                        }}
                        disabled={!canAfford || purchasing || !h.id}
                        className={`text-left p-4 rounded-lg border-2 transition-all ${
                          canAfford && !purchasing && h.id
                            ? 'border-yellow-500 hover:border-yellow-400 hover:bg-gray-800'
                            : 'border-gray-600 bg-gray-800 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="font-bold text-white mb-1">{h.name}</div>
                        <div className="text-sm text-gray-400 mb-2">Level {h.level} • {h.role}</div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-300">
                            Gold: <span className={canAfford ? 'text-yellow-400 font-semibold' : 'text-red-400'}>
                              {h.gold || 0}g
                            </span>
                          </span>
                          {!canAfford && (
                            <span className="text-xs text-red-400">
                              Need {totalCost}g
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setSelectedGoldItem(null)}
                  disabled={purchasing}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Token Purchase Hero Selection Modal */}
          {selectedTokenItem && heroes && heroes.length > 0 && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 rounded-lg max-w-2xl w-full border border-gray-700 p-6">
                <h3 className="text-2xl font-bold text-white mb-4">Purchase Item</h3>
                <p className="text-gray-400 mb-4">
                  Which hero should receive{' '}
                  <span className={`font-bold capitalize ${getRarityColor(selectedTokenItem.rarity)}`}>
                    {selectedTokenItem.rarity} {selectedTokenItem.slot}
                  </span>?
                </p>

                {/* Quantity Selector */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Quantity</label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => {
                        if (selectedTokenItem.quantity && selectedTokenItem.quantity > 1) {
                          setSelectedTokenItem({ ...selectedTokenItem, quantity: selectedTokenItem.quantity - 1 });
                        }
                      }}
                      disabled={!selectedTokenItem.quantity || selectedTokenItem.quantity <= 1}
                      className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white w-10 h-10 rounded font-bold"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={selectedTokenItem.quantity || 1}
                      onChange={(e) => {
                        const qty = Math.max(1, Math.min(100, parseInt(e.target.value) || 1));
                        setSelectedTokenItem({ ...selectedTokenItem, quantity: qty });
                      }}
                      className="w-20 text-center bg-gray-800 text-white border border-gray-600 rounded px-3 py-2"
                    />
                    <button
                      onClick={() => {
                        const currentQty = selectedTokenItem.quantity || 1;
                        if (currentQty < 100) {
                          setSelectedTokenItem({ ...selectedTokenItem, quantity: currentQty + 1 });
                        }
                      }}
                      disabled={selectedTokenItem.quantity && selectedTokenItem.quantity >= 100}
                      className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white w-10 h-10 rounded font-bold"
                    >
                      +
                    </button>
                    <span className="text-gray-400 text-sm">
                      Total: <span className="text-blue-400 font-semibold">
                        {(TOKEN_SHOP_PRICES[selectedTokenItem.rarity as keyof typeof TOKEN_SHOP_PRICES] || 0) * (selectedTokenItem.quantity || 1)}t
                      </span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 max-h-96 overflow-y-auto">
                  {heroes.map((h) => {
                    const costPerItem = TOKEN_SHOP_PRICES[selectedTokenItem.rarity as keyof typeof TOKEN_SHOP_PRICES];
                    const quantity = selectedTokenItem.quantity || 1;
                    const totalCost = costPerItem * quantity;
                    const canAfford = (h.tokens || 0) >= totalCost;
                    
                    return (
                      <button
                        key={h.id}
                        onClick={() => {
                          if (canAfford && h.id) {
                            handleTokenPurchase(selectedTokenItem.rarity, selectedTokenItem.slot, h.id, quantity);
                          }
                        }}
                        disabled={!canAfford || purchasing || !h.id}
                        className={`text-left p-4 rounded-lg border-2 transition-all ${
                          canAfford && !purchasing && h.id
                            ? 'border-blue-500 hover:border-blue-400 hover:bg-gray-800'
                            : 'border-gray-600 bg-gray-800 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="font-bold text-white mb-1">{h.name}</div>
                        <div className="text-sm text-gray-400 mb-2">Level {h.level} • {h.role}</div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-300">
                            Tokens: <span className={canAfford ? 'text-blue-400 font-semibold' : 'text-red-400'}>
                              {h.tokens || 0}t
                            </span>
                          </span>
                          {!canAfford && (
                            <span className="text-xs text-red-400">
                              Need {totalCost}t
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="bg-gray-800 rounded p-4 mb-6">
                  <div className="text-sm text-gray-300">
                    <div className="mb-2">✨ <strong>Guaranteed {selectedTokenItem.rarity} quality</strong></div>
                    <div className="mb-2">📊 Stats scale with hero's level</div>
                    <div className="mb-2">🎲 Random proc effects for rare+ gear</div>
                    <div>⚡ Instant delivery to inventory</div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedTokenItem(null)}
                  disabled={purchasing}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
