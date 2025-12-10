import { useState } from 'react';
import { Item } from '../types/Hero';
import { formatNumber, getRarityColor, getRarityHexColor } from '../utils/format';

interface ReforgeModalProps {
  item: Item | null;
  currentGold: number;
  onClose: () => void;
  onReforge: (userId: string, itemId: string) => Promise<void>;
  userId?: string;
}

const REFORGE_COST = 500; // Fixed cost per the plan

export default function ReforgeModal({
  item,
  currentGold,
  onClose,
  onReforge,
  userId
}: ReforgeModalProps) {
  const [isReforging, setIsReforging] = useState(false);

  if (!item || !userId) return null;

  const canReforge = currentGold >= REFORGE_COST && !isReforging;
  const isRarePlus = ['rare', 'epic', 'legendary', 'artifact', 'mythic'].includes(item.rarity?.toLowerCase() || '');

  const handleReforge = async () => {
    if (!item.id || !canReforge) return;

    setIsReforging(true);
    try {
      await onReforge(userId, item.id);
      // Modal will close after successful reforge (parent should handle)
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to reforge item');
    } finally {
      setIsReforging(false);
    }
  };

  // Get current stats to display
  const currentStats: Array<{ name: string; value: number }> = [];
  if (item.attack) currentStats.push({ name: 'Attack', value: item.attack });
  if (item.defense) currentStats.push({ name: 'Defense', value: item.defense });
  if (item.hp) currentStats.push({ name: 'HP', value: item.hp });
  if ((item as any).strength) currentStats.push({ name: 'Strength', value: (item as any).strength });
  if ((item as any).dexterity) currentStats.push({ name: 'Dexterity', value: (item as any).dexterity });
  if ((item as any).intellect) currentStats.push({ name: 'Intellect', value: (item as any).intellect });
  if ((item as any).stamina) currentStats.push({ name: 'Stamina', value: (item as any).stamina });

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-gray-800 rounded-lg p-6 border-2 border-gray-600 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Reforge Item</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {!isRarePlus && (
          <div className="bg-red-900/30 border border-red-700 rounded p-3 mb-4">
            <p className="text-red-300 text-sm">
              ⚠️ Only Rare, Epic, Legendary, and Artifact items can be reforged.
            </p>
          </div>
        )}

        {/* Item Display */}
        <div className="bg-gray-700 rounded p-4 mb-4 border" style={{ borderColor: item.color || getRarityHexColor(item.rarity) }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="text-2xl">⚔️</div>
            <div>
              <div className="font-bold text-white" style={{ color: item.color || getRarityHexColor(item.rarity) }}>
                {item.name}
              </div>
              <div className="text-xs text-gray-400 capitalize">{item.rarity} {item.slot}</div>
            </div>
          </div>

          {/* Current Stats */}
          {currentStats.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-600">
              <div className="text-xs text-gray-400 mb-2">Current Stats:</div>
              <div className="space-y-1">
                {currentStats.map((stat, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-300">{stat.name}:</span>
                    <span className="text-white font-semibold">+{formatNumber(stat.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reforge Info */}
        <div className="bg-blue-900/30 border border-blue-700 rounded p-4 mb-4">
          <p className="text-blue-200 text-sm mb-2">
            <strong>Reforging</strong> will randomly reroll all stats on this item.
          </p>
          <p className="text-blue-300 text-xs">
            The item will maintain the same rarity and slot, but all stat values will be randomized.
          </p>
        </div>

        {/* Cost */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-gray-300">Reforge Cost:</span>
          <span className={`text-xl font-bold ${currentGold >= REFORGE_COST ? 'text-yellow-400' : 'text-red-400'}`}>
            {REFORGE_COST}g
          </span>
        </div>
        <div className="flex items-center justify-between mb-6">
          <span className="text-gray-300">Your Gold:</span>
          <span className="text-white font-semibold">{formatNumber(currentGold)}g</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded font-semibold transition-colors"
            disabled={isReforging}
          >
            Cancel
          </button>
          <button
            onClick={handleReforge}
            disabled={!canReforge || !isRarePlus}
            className={`flex-1 py-2 rounded font-semibold transition-colors ${
              canReforge && isRarePlus
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isReforging ? 'Reforging...' : `Reforge (${REFORGE_COST}g)`}
          </button>
        </div>
      </div>
    </div>
  );
}

