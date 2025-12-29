import { useState } from 'react';
import { Hero } from '../types/Hero';
import { heroAPI } from '../api/client';

interface PrestigeModalProps {
  hero: Hero;
  onClose: () => void;
  onPrestige: (updatedHero: Hero) => void;
}

export default function PrestigeModal({ hero, onClose, onPrestige }: PrestigeModalProps) {
  const [isPrestiging, setIsPrestiging] = useState(false);
  const currentPrestigeLevel = hero.prestigeLevel || 0;
  const newPrestigeLevel = currentPrestigeLevel + 1;

  // Calculate what the new boosts will be
  const calculateBoosts = (prestigeLevel: number) => {
    let xpMultiplier = 1.0;
    let goldMultiplier = 1.0;
    let ticketMultiplier = 1.0;
    
    for (let i = 1; i <= prestigeLevel; i++) {
      const multiplier = i > 10 ? 0.5 : 1.0;
      xpMultiplier += 0.02 * multiplier;
      goldMultiplier += 0.025 * multiplier;
      ticketMultiplier += 0.01 * multiplier;
    }
    
    xpMultiplier = Math.min(xpMultiplier, 1.5);
    goldMultiplier = Math.min(goldMultiplier, 1.5);
    ticketMultiplier = Math.min(ticketMultiplier, 1.25);
    
    return {
      xpGain: xpMultiplier,
      goldGain: goldMultiplier,
      idleTicketGain: ticketMultiplier,
      statBoost: {
        attack: prestigeLevel * 2,
        defense: prestigeLevel * 1,
        hp: prestigeLevel * 5
      }
    };
  };

  const newBoosts = calculateBoosts(newPrestigeLevel);
  const currentBoosts = hero.prestigeBoosts || {
    xpGain: 1.0,
    goldGain: 1.0,
    idleTicketGain: 1.0,
    statBoost: { attack: 0, defense: 0, hp: 0 }
  };

  const handlePrestige = async () => {
    if (isPrestiging) return;
    
    setIsPrestiging(true);
    try {
      const result = await heroAPI.prestigeHero(hero.id!);
      if (result.success) {
        onPrestige(result.hero);
        onClose();
      } else {
        alert(result.message || 'Failed to prestige');
      }
    } catch (error: any) {
      console.error('Error prestiging:', error);
      alert(error.response?.data?.error || 'Failed to prestige hero');
    } finally {
      setIsPrestiging(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border-2 border-amber-400">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-amber-400 flex items-center gap-2">
            ⭐ Prestige Confirmation
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
            disabled={isPrestiging}
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-900 rounded p-4 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-2">What Happens When You Prestige:</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-red-400">⚠️</span>
                <span><strong className="text-white">Level reset to 1</strong> - You'll start over from level 1</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">⚠️</span>
                <span><strong className="text-white">XP reset to 0</strong> - All progress to next level is lost</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">⚠️</span>
                <span><strong className="text-white">Base stats reset</strong> - Your base stats return to level 1 values</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">✓</span>
                <span><strong className="text-white">Gear is kept</strong> - All your equipment and items remain</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">✓</span>
                <span><strong className="text-white">Skill points reset (FREE)</strong> - You can respec your skills for free</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">⭐</span>
                <span><strong className="text-white">Prestige Level: {currentPrestigeLevel} → {newPrestigeLevel}</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">💰</span>
                <span><strong className="text-white">+1 Prestige Token</strong> - Use in the Prestige Store</span>
              </li>
            </ul>
          </div>

          <div className="bg-gray-900 rounded p-4 border border-amber-400">
            <h3 className="text-lg font-semibold text-amber-400 mb-3">Permanent Boosts You'll Receive:</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">XP Gain:</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">
                    {((currentBoosts.xpGain - 1) * 100).toFixed(1)}%
                  </span>
                  <span className="text-gray-500">→</span>
                  <span className="text-green-400 font-semibold">
                    +{((newBoosts.xpGain - 1) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Gold Gain:</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">
                    {((currentBoosts.goldGain - 1) * 100).toFixed(1)}%
                  </span>
                  <span className="text-gray-500">→</span>
                  <span className="text-green-400 font-semibold">
                    +{((newBoosts.goldGain - 1) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Idle Ticket Gain:</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">
                    {((currentBoosts.idleTicketGain - 1) * 100).toFixed(1)}%
                  </span>
                  <span className="text-gray-500">→</span>
                  <span className="text-green-400 font-semibold">
                    +{((newBoosts.idleTicketGain - 1) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              
              <div className="border-t border-gray-700 pt-3 mt-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Attack Bonus:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">+{currentBoosts.statBoost.attack}</span>
                    <span className="text-gray-500">→</span>
                    <span className="text-green-400 font-semibold">+{newBoosts.statBoost.attack}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Defense Bonus:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">+{currentBoosts.statBoost.defense}</span>
                    <span className="text-gray-500">→</span>
                    <span className="text-green-400 font-semibold">+{newBoosts.statBoost.defense}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">HP Bonus:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">+{currentBoosts.statBoost.hp}</span>
                    <span className="text-gray-500">→</span>
                    <span className="text-green-400 font-semibold">+{newBoosts.statBoost.hp}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handlePrestige}
              disabled={isPrestiging}
              className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isPrestiging ? 'Prestiging...' : `⭐ Prestige to Level ${newPrestigeLevel}`}
            </button>
            <button
              onClick={onClose}
              disabled={isPrestiging}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}





