import { useState } from 'react';
import { Item, Socket, Gem } from '../types/Hero';
import { getGemColor } from '../utils/format';
import { heroAPI } from '../api/client';

interface GemModalProps {
  item: Item | null;
  socket: Socket | null;
  socketIndex: number;
  heroId: string;
  userId: string;
  gems: Item[]; // Available gems from inventory
  onClose: () => void;
  onUpdate: () => void;
  mode: 'insert' | 'remove'; // Whether inserting or removing a gem
}

export default function GemModal({
  item,
  socket,
  socketIndex,
  heroId,
  userId,
  gems,
  onClose,
  onUpdate,
  mode
}: GemModalProps) {
  const [selectedGemId, setSelectedGemId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!item || !socket) return null;

  const handleInsertGem = async () => {
    if (!selectedGemId || !item.id || !socket.id) return;

    setIsProcessing(true);
    try {
      await heroAPI.insertGem(userId, heroId, item.id, socket.id, selectedGemId);
      onUpdate();
      onClose();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to insert gem');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveGem = async () => {
    if (!item.id || !socket.id) return;

    setIsProcessing(true);
    try {
      await heroAPI.removeGem(userId, heroId, item.id, socket.id);
      onUpdate();
      onClose();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to remove gem');
    } finally {
      setIsProcessing(false);
    }
  };

  if (mode === 'remove' && socket.gem) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Remove Gem</h2>
          
          <div className="mb-4">
            <div className="text-gray-300 mb-2">
              <span className="font-semibold">{item.name}</span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-8 h-8 rounded-full border-2 border-gray-600"
                style={{ backgroundColor: getGemColor(socket.gem.type) }}
              />
              <div>
                <div className="text-white font-semibold">
                  {socket.gem.type.charAt(0).toUpperCase() + socket.gem.type.slice(1)} ({socket.gem.rarity})
                </div>
                {socket.gem.stats && Object.keys(socket.gem.stats).length > 0 && (
                  <div className="text-xs text-gray-400">
                    {Object.entries(socket.gem.stats).map(([stat, value]: [string, any]) => {
                      if (value === 0 || value === undefined) return null;
                      const statLabels: Record<string, string> = {
                        attack: 'ATK',
                        defense: 'DEF',
                        critChance: 'Crit',
                        critDamage: 'Crit Dmg',
                        damageReduction: 'DR',
                        maxHp: 'HP',
                        allStats: 'All Stats',
                        xpGain: 'XP',
                        goldGain: 'Gold',
                        tokenGain: 'Tokens'
                      };
                      const label = statLabels[stat] || stat;
                      const isPercentage = ['critChance', 'critDamage', 'damageReduction', 'xpGain', 'goldGain', 'tokenGain', 'allStats'].includes(stat);
                      return (
                        <span key={stat} className="mr-2">
                          +{value}{isPercentage ? '%' : ''} {label}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="text-gray-300 text-sm mb-4">
            Removing this gem will return it to your inventory.
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRemoveGem}
              disabled={isProcessing}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:text-gray-400 text-white py-2 rounded transition-colors"
            >
              {isProcessing ? 'Removing...' : 'Remove Gem'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'insert') {
    const availableGems = gems.filter(gem => 
      gem.type && ['ruby', 'sapphire', 'emerald', 'diamond'].includes(gem.type)
    );

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Insert Gem</h2>
          
          <div className="mb-4">
            <div className="text-gray-300 mb-2">
              <span className="font-semibold">{item.name}</span>
              <span className="text-gray-400 text-sm ml-2">Socket {socketIndex + 1}</span>
            </div>
            {socket.gem && (
              <div className="text-yellow-400 text-sm mb-2">
                Socket already contains a gem. Remove it first to insert a new one.
              </div>
            )}
          </div>

          {availableGems.length === 0 ? (
            <div className="text-gray-400 text-sm mb-4">
              No gems found in inventory. Gems can be gathered while mining (5% chance).
            </div>
          ) : (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Select Gem:
              </label>
              <select
                value={selectedGemId || ''}
                onChange={(e) => setSelectedGemId(e.target.value)}
                className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
              >
                <option value="">Select a gem...</option>
                {availableGems.map((gem) => {
                  const gemType = gem.type as string;
                  const gemRarity = gem.rarity || 'common';
                  return (
                    <option key={gem.id} value={gem.id}>
                      {gem.name || `${gemType.charAt(0).toUpperCase() + gemType.slice(1)} (${gemRarity})`}
                    </option>
                  );
                })}
              </select>
              
              {selectedGemId && (() => {
                const selectedGem = availableGems.find(g => g.id === selectedGemId);
                if (selectedGem && (selectedGem as any).stats) {
                  const stats = (selectedGem as any).stats;
                  return (
                    <div className="mt-3 p-3 bg-gray-700 rounded border border-gray-600">
                      <div className="text-sm font-semibold text-white mb-2">Gem Stats:</div>
                      <div className="text-xs text-gray-300 space-y-1">
                        {Object.entries(stats).map(([stat, value]: [string, any]) => {
                          if (value === 0 || value === undefined) return null;
                          const statLabels: Record<string, string> = {
                            attack: 'Attack',
                            defense: 'Defense',
                            critChance: 'Crit Chance',
                            critDamage: 'Crit Damage',
                            damageReduction: 'Damage Reduction',
                            maxHp: 'Max HP',
                            allStats: 'All Stats',
                            xpGain: 'XP Gain',
                            goldGain: 'Gold Gain',
                            tokenGain: 'Token Gain'
                          };
                          const label = statLabels[stat] || stat;
                          const isPercentage = ['critChance', 'critDamage', 'damageReduction', 'xpGain', 'goldGain', 'tokenGain', 'allStats'].includes(stat);
                          return (
                            <div key={stat}>
                              +{value}{isPercentage ? '%' : ''} {label}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleInsertGem}
              disabled={!selectedGemId || !!socket.gem || isProcessing}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:text-gray-400 text-white py-2 rounded transition-colors"
            >
              {isProcessing ? 'Inserting...' : 'Insert Gem'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}







