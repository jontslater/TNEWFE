import { useState, useEffect } from 'react';
import { Item } from '../types/Hero';
import { formatNumber } from '../utils/format';
import { 
  generateUpgradeStatOptions, 
  UpgradeStatOption, 
  calculateRerollCost,
  formatStatOption,
  getStatIcon
} from '../utils/upgradeStatOptions';

interface UpgradeModalProps {
  item: Item | null;
  currentGold: number;
  onClose: () => void;
  onUpgrade: (itemId: string, selectedStats: Array<{ type: string; value: number }>) => Promise<void>;
  onReroll?: (itemId: string) => Promise<void>;
  itemLocation: 'equipment' | 'inventory';
  slot?: string;
}

/**
 * Calculate upgrade cost for an item
 * Cost scales with item rarity and current upgrade level
 */
function calculateUpgradeCost(item: Item, currentLevel: number): number {
  if (!item) return 0;

  // Base cost multipliers by rarity
  const rarityMultipliers: Record<string, number> = {
    'common': 1.0,
    'uncommon': 1.5,
    'rare': 2.0,
    'epic': 3.0,
    'legendary': 5.0,
    'artifact': 10.0
  };

  const baseCost = 100; // Base cost per level
  const rarityMultiplier = rarityMultipliers[item.rarity?.toLowerCase() || 'common'] || 1.0;
  
  // Cost scales exponentially with level
  const levelCost = baseCost * rarityMultiplier * Math.pow(1.5, currentLevel);
  
  return Math.ceil(levelCost);
}

export default function UpgradeModal({
  item,
  currentGold,
  onClose,
  onUpgrade,
  onReroll,
  itemLocation,
  slot
}: UpgradeModalProps) {
  const [statOptions, setStatOptions] = useState<UpgradeStatOption[]>([]);
  const [selectedStats, setSelectedStats] = useState<Set<number>>(new Set());
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isRerolling, setIsRerolling] = useState(false);
  const [upgradeCost, setUpgradeCost] = useState(0);
  const [rerollCost, setRerollCost] = useState(0);

  // Generate initial stat options when modal opens
  useEffect(() => {
    if (item) {
      setStatOptions(generateUpgradeStatOptions());
      setSelectedStats(new Set());
      const currentLevel = item.upgradeLevel || 0;
      setUpgradeCost(calculateUpgradeCost(item, currentLevel));
      setRerollCost(calculateRerollCost(currentLevel));
    }
  }, [item]);

  if (!item) return null;

  const currentLevel = item.upgradeLevel || 0;
  const maxLevel = 2; // Maximum 2 upgrade levels (each with 2 selected stats)
  // Can upgrade if: not at max level OR at max level but wants to replace (allow replacing stats at max level)
  const canUpgrade = currentGold >= upgradeCost && selectedStats.size === 2;
  const canReroll = !isUpgrading; // Reroll is free (gold cost shown is informational)

  const handleStatToggle = (index: number) => {
    if (isUpgrading || isRerolling) return;
    
    setSelectedStats(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        if (newSet.size < 2) {
          newSet.add(index);
        }
      }
      return newSet;
    });
  };

  const handleReroll = () => {
    if (!item.id) return;
    // Reroll is free - just regenerate options locally
    // Gold cost shown is informational (we could charge separately if desired)
    const newOptions = generateUpgradeStatOptions();
    setStatOptions(newOptions);
    setSelectedStats(new Set());
  };

  const handleUpgrade = async () => {
    if (!canUpgrade || !item.id || selectedStats.size !== 2) return;

    const selected = Array.from(selectedStats).map(index => ({
      type: statOptions[index].type,
      value: statOptions[index].value
    }));
    
    console.log(`[Upgrade Modal] Upgrading item ${item.id} to level ${currentLevel + 1} with stats:`, selected);
    
    setIsUpgrading(true);
    try {
      await onUpgrade(item.id, selected);
      console.log(`[Upgrade Modal] ✅ Upgrade request sent successfully`);
      onClose();
    } catch (error: any) {
      console.error('[Upgrade Modal] ❌ Upgrade failed:', error);
      alert(error.response?.data?.error || 'Failed to upgrade item. Please try again.');
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 border-2 border-amber-500 shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Customize Upgrade</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl transition-colors"
            disabled={isUpgrading || isRerolling}
          >
            ×
          </button>
        </div>

        {/* Item Display */}
        <div className="bg-gray-700 rounded-lg p-4 mb-4">
          <div className="text-lg font-semibold text-white mb-1">{item.name}</div>
          <div className="text-sm text-gray-400">
            {item.rarity?.charAt(0).toUpperCase() + item.rarity?.slice(1) || 'Common'} • {item.slot}
          </div>
          <div className="text-sm text-amber-400 mt-1">
            Current Level: <span className="font-semibold">+{currentLevel}</span> / <span className="font-semibold">+{maxLevel}</span>
          </div>
          {currentLevel >= maxLevel && (
            <div className="text-sm text-green-400 mt-1">✓ Fully upgraded!</div>
          )}
        </div>

        {/* Instructions */}
        {currentLevel < maxLevel && (
          <div className="bg-blue-900 bg-opacity-30 border border-blue-600 rounded-lg p-3 mb-4">
            <div className="text-sm text-blue-300 font-semibold mb-1">How it works:</div>
            <div className="text-xs text-blue-200">
              <ul className="list-disc list-inside space-y-1">
                <li>Choose <span className="font-semibold">2 of 4</span> random stat bonuses</li>
                <li>Reroll for gold to get different options</li>
                <li>New stats replace old stats at this level (max 2 upgrade levels)</li>
              </ul>
            </div>
          </div>
        )}

        {/* Stat Options Grid */}
        {currentLevel < maxLevel && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <div className="text-sm font-semibold text-gray-300">
                Select 2 Stats: <span className="text-amber-400">{selectedStats.size}/2</span>
              </div>
              <button
                onClick={handleReroll}
                disabled={isRerolling || isUpgrading}
                className={`px-4 py-2 rounded font-semibold text-sm transition-colors ${
                  !isRerolling && !isUpgrading
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
                title="Reroll for different stat options"
              >
                {isRerolling ? 'Rerolling...' : '🔄 Reroll'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {statOptions.map((option, index) => {
                const isSelected = selectedStats.has(index);
                const isFull = selectedStats.size >= 2 && !isSelected;
                
                return (
                  <button
                    key={index}
                    onClick={() => handleStatToggle(index)}
                    disabled={isFull || isUpgrading || isRerolling}
                    className={`rounded-lg p-4 border-2 transition-all text-left ${
                      isSelected
                        ? 'border-amber-500 bg-amber-900 bg-opacity-30 scale-105'
                        : isFull
                        ? 'border-gray-600 bg-gray-800 opacity-50 cursor-not-allowed'
                        : 'border-gray-600 bg-gray-700 hover:border-gray-500 hover:bg-gray-650 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-2xl">{getStatIcon(option.type)}</div>
                      {isSelected && (
                        <div className="text-amber-400 font-bold">✓</div>
                      )}
                    </div>
                    <div className="text-lg font-bold text-white mb-1">
                      +{option.value}% {option.displayName}
                    </div>
                    <div className="text-xs text-gray-400">{option.description}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Cost Display */}
        {currentLevel < maxLevel && (
          <div className="bg-gray-900 rounded-lg p-4 mb-4 border border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400">Upgrade Cost:</span>
              <span className={`text-xl font-bold ${currentGold >= upgradeCost ? 'text-amber-400' : 'text-red-400'}`}>
                {formatNumber(upgradeCost)}g
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Your Gold:</span>
              <span className={`font-semibold ${currentGold >= upgradeCost ? 'text-green-400' : 'text-red-400'}`}>
                {formatNumber(currentGold)}g
              </span>
            </div>
            {selectedStats.size < 2 && (
              <div className="mt-2 text-sm text-yellow-400 text-center">
                Select 2 stats to upgrade
              </div>
            )}
            {selectedStats.size === 2 && currentGold < upgradeCost && (
              <div className="mt-2 text-sm text-red-400 text-center">
                You need {formatNumber(upgradeCost - currentGold)}g more
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 rounded font-semibold bg-gray-700 hover:bg-gray-600 text-white transition-colors"
            disabled={isUpgrading || isRerolling}
          >
            Cancel
          </button>
          {currentLevel < maxLevel && (
            <button
              onClick={handleUpgrade}
              disabled={!canUpgrade || isUpgrading || isRerolling}
              className={`flex-1 py-2 px-4 rounded font-semibold transition-colors ${
                canUpgrade && !isUpgrading && !isRerolling
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isUpgrading ? 'Upgrading...' : `Upgrade (+${currentLevel + 1})`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
