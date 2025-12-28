import { useState, useEffect } from 'react';
import { Hero } from '../types/Hero';
import { heroAPI } from '../api/client';
import ConfirmationDialog from './ConfirmationDialog';
import MessageAlert from './MessageAlert';

interface PrestigeStoreProps {
  hero: Hero;
  onUpdate: () => void;
}

interface StoreItem {
  tier: string;
  name: string;
  tokenCost: number;
  prestigeRequired: number;
  statBonus: { attack: number; defense: number; hp: number };
  bonus: { xpGain: number; goldGain: number };
  color: string;
  canAfford: boolean;
}

const TIER_NAMES: Record<string, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
  mythic: 'Mythic'
};

// Tier colors (matches backend)
const TIER_COLORS: Record<string, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
  mythic: '#FF1493'
};

export default function PrestigeStore({ hero, onUpdate }: PrestigeStoreProps) {
  const [storeData, setStoreData] = useState<{
    prestigeLevel: number;
    prestigeTokens: number;
    catalog: StoreItem[];
    availableTiers: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedCore, setSelectedCore] = useState<any>(null);
  const [heroCores, setHeroCores] = useState<any[]>([]);
  
  // Custom dialogs (replaces window.confirm and alert)
  const [confirmDialog, setConfirmDialog] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [messageAlert, setMessageAlert] = useState<{
    message: string;
  } | null>(null);

  useEffect(() => {
    loadStore();
    loadHeroCores();
  }, [hero.id, hero.inventory]);

  const loadStore = async () => {
    if (!hero.id) return;
    setLoading(true);
    try {
      const data = await heroAPI.getPrestigeStore(hero.id);
      setStoreData(data);
    } catch (error: any) {
      console.error('Error loading prestige store:', error);
      setMessageAlert({ message: error.response?.data?.error || 'Failed to load prestige store' });
    } finally {
      setLoading(false);
    }
  };

  const loadHeroCores = () => {
    // Find all prestige cores in inventory
    const cores = (hero.inventory || []).filter(item => item.type === 'prestige_core');
    setHeroCores(cores);
  };

  const handlePurchase = async (tier: string) => {
    if (!hero.id || purchasing) return;
    
    const item = storeData?.catalog.find(i => i.tier === tier);
    if (!item) return;

    if (!item.canAfford) {
      setMessageAlert({ message: `Not enough prestige tokens! Need ${item.tokenCost}, have ${storeData?.prestigeTokens || 0}` });
      return;
    }

    setConfirmDialog({
      message: `Purchase ${item.name} for ${item.tokenCost} prestige token${item.tokenCost > 1 ? 's' : ''}?`,
      onConfirm: async () => {
        setConfirmDialog(null);
        setPurchasing(tier);
        try {
          const result = await heroAPI.purchasePrestigeCore(hero.id, tier);
          if (result.success) {
            setMessageAlert({ message: result.message });
            await loadStore(); // Reload store to update tokens
            onUpdate(); // Refresh hero data
            loadHeroCores(); // Reload cores
          } else {
            setMessageAlert({ message: result.message || 'Failed to purchase' });
          }
        } catch (error: any) {
          console.error('Error purchasing prestige core:', error);
          setMessageAlert({ message: error.response?.data?.error || 'Failed to purchase prestige core' });
        } finally {
          setPurchasing(null);
        }
      }
    });
  };

  const handleApplyCore = (core: any) => {
    setSelectedCore(core);
    setShowApplyModal(true);
  };

  const handleApplyToEquipment = async (slot: string) => {
    if (!hero.id || !selectedCore) return;

    // No need to check if item is equipped - cores are applied to slots, not items
    // This allows cores to persist even when gear is replaced

    try {
      const result = await heroAPI.applyPrestigeCore(hero.id, selectedCore.id, slot);
      if (result.success) {
        setMessageAlert({ message: result.message });
        onUpdate(); // Refresh hero data
        loadHeroCores(); // Reload cores
        setShowApplyModal(false);
        setSelectedCore(null);
      } else {
        setMessageAlert({ message: result.message || 'Failed to apply core' });
      }
    } catch (error: any) {
      console.error('Error applying prestige core:', error);
      setMessageAlert({ message: error.response?.data?.error || 'Failed to apply prestige core' });
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="text-center text-gray-400">Loading prestige store...</div>
      </div>
    );
  }

  if (!storeData) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="text-center text-red-400">Failed to load prestige store</div>
      </div>
    );
  }

  const prestigeLevel = storeData.prestigeLevel || 0;
  const prestigeTokens = storeData.prestigeTokens || 0;
  const equipment = hero.equipment || {};

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gray-800 rounded-lg p-6 border border-amber-400">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-amber-400 flex items-center gap-2">
            ⭐ Prestige Core Store
          </h2>
          <div className="text-right">
            <div className="text-gray-400 text-sm">Prestige Level</div>
            <div className="text-amber-400 text-xl font-bold">{prestigeLevel}</div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-gray-400 text-sm">Prestige Tokens</div>
            <div className="text-yellow-400 text-2xl font-bold">{prestigeTokens}</div>
          </div>
          {prestigeLevel === 0 && (
            <div className="text-red-400 text-sm">
              ⚠️ Prestige at level 100 to earn tokens!
            </div>
          )}
        </div>
      </div>

      {/* Available Cores in Store */}
      {storeData.availableTiers.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
          <div className="text-gray-400">
            Prestige at least once to unlock the prestige store!
          </div>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Available Prestige Cores</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {storeData.catalog.map(item => (
              <div
                key={item.tier}
                className="border rounded-lg p-4 bg-gray-900"
                style={{ borderColor: item.color }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold text-lg" style={{ color: item.color }}>
                    {TIER_NAMES[item.tier]} Core
                  </div>
                  <div className="text-yellow-400 text-sm font-bold">
                    {item.tokenCost} ⭐
                  </div>
                </div>
                <div className="text-xs text-gray-300 space-y-1 mb-3">
                  <div className="font-semibold text-gray-400">Stat Bonuses:</div>
                  <div>⚔️ +{item.statBonus.attack} Attack</div>
                  <div>🛡️ +{item.statBonus.defense} Defense</div>
                  <div>❤️ +{item.statBonus.hp} Max HP</div>
                  <div className="font-semibold text-gray-400 mt-2">Bonuses:</div>
                  <div>📈 +{((item.bonus.xpGain) * 100).toFixed(1)}% XP</div>
                  <div>💰 +{((item.bonus.goldGain) * 100).toFixed(1)}% Gold</div>
                  <div className="text-gray-500 text-xs mt-2">
                    Requires Prestige {item.prestigeRequired}
                  </div>
                </div>
                <button
                  onClick={() => handlePurchase(item.tier)}
                  disabled={!item.canAfford || purchasing !== null}
                  className={`w-full py-2 rounded text-sm font-semibold transition-all ${
                    item.canAfford
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {purchasing === item.tier
                    ? 'Purchasing...'
                    : item.canAfford
                    ? 'Purchase Core'
                    : 'Not Enough Tokens'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cores in Inventory */}
      {heroCores.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Your Prestige Cores</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {heroCores.map(core => (
              <div
                key={core.id}
                className="border rounded-lg p-4 bg-gray-900"
                style={{ borderColor: core.color || TIER_COLORS[core.tier] }}
              >
                <div className="font-semibold mb-2" style={{ color: core.color || TIER_COLORS[core.tier] }}>
                  {core.name}
                </div>
                <div className="text-xs text-gray-300 space-y-1 mb-3">
                  <div>⚔️ +{core.statBonus?.attack || 0} Attack</div>
                  <div>🛡️ +{core.statBonus?.defense || 0} Defense</div>
                  <div>❤️ +{core.statBonus?.hp || 0} Max HP</div>
                  <div>📈 +{((core.bonus?.xpGain || 0) * 100).toFixed(1)}% XP</div>
                  <div>💰 +{((core.bonus?.goldGain || 0) * 100).toFixed(1)}% Gold</div>
                </div>
                <button
                  onClick={() => handleApplyCore(core)}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-semibold transition-all"
                >
                  Apply to Equipment
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Apply Core Modal */}
      {showApplyModal && selectedCore && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg shadow-xl border border-purple-700 w-full max-w-2xl p-6">
            <h2 className="text-2xl font-bold text-purple-400 mb-4">
              Apply {selectedCore.name}
            </h2>
            <p className="text-gray-300 mb-4">
              Select an equipment slot to apply this prestige core to:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              {['weapon', 'armor', 'accessory', 'shield', 'helm', 'cloak', 'gloves', 'ring1', 'ring2', 'boots'].map(slot => {
                const item = equipment[slot];
                const hasCore = item?.prestigeCore;
                const slotName = slot.charAt(0).toUpperCase() + slot.slice(1).replace(/([A-Z])/g, ' $1');
                
                return (
                  <button
                    key={slot}
                    onClick={() => item && handleApplyToEquipment(slot)}
                    disabled={!item}
                    className={`p-3 rounded border text-sm font-semibold transition-all ${
                      !item
                        ? 'bg-gray-800 border-gray-700 text-gray-600 cursor-not-allowed'
                        : hasCore
                        ? 'bg-yellow-900/30 border-yellow-600 text-yellow-400 hover:bg-yellow-900/50'
                        : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <div>{slotName}</div>
                    {item && (
                      <div className="text-xs mt-1">
                        {item.name || 'Equipped'}
                        {hasCore && <div className="text-yellow-400">(Has Core)</div>}
                      </div>
                    )}
                    {!item && <div className="text-xs mt-1 text-gray-500">Empty</div>}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowApplyModal(false);
                  setSelectedCore(null);
                }}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Dialog (replaces window.confirm) */}
      <ConfirmationDialog
        isOpen={!!confirmDialog}
        message={confirmDialog?.message || ''}
        onConfirm={() => {
          if (confirmDialog) {
            confirmDialog.onConfirm();
          }
        }}
        onCancel={() => setConfirmDialog(null)}
      />

      {/* Custom Message Alert (replaces window.alert) */}
      <MessageAlert
        isOpen={!!messageAlert}
        message={messageAlert?.message || ''}
        onClose={() => setMessageAlert(null)}
      />
    </div>
  );
}
