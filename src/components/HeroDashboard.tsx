import { useState, useEffect } from 'react';
import { Hero } from '../types/Hero';
import { formatNumber, getRarityColor, getRarityBg, getRoleBg, formatTime, getItemScore } from '../utils/format';
import ItemTooltip from './ItemTooltip';
import { useAuth } from '../hooks/useAuth';
import { heroAPI, achievementAPI } from '../api/client';

interface HeroDashboardProps {
  hero: Hero;
  onHeroUpdate?: (updatedHero: Hero) => void;
  onHeroDelete?: () => void;
}

export default function HeroDashboard({ hero, onHeroUpdate, onHeroDelete }: HeroDashboardProps) {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [availableTitles, setAvailableTitles] = useState<string[]>([]);
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);
  const hpPercent = (hero.hp / hero.maxHp) * 100;
  const xpPercent = (Math.floor(hero.xp) / Math.floor(hero.maxXp)) * 100;
  const itemScore = getItemScore(hero.equipment);

  useEffect(() => {
    loadAchievementsData();
  }, [hero.id]);

  const loadAchievementsData = async () => {
    try {
      const data = await achievementAPI.getHeroAchievements(hero.id);
      
      console.log('[HeroDashboard] 🎯 Achievement Data:');
      console.log('[HeroDashboard] Data:', data);
      console.log('[HeroDashboard] Titles:', data?.titles);
      console.log('[HeroDashboard] Active title:', data?.activeTitle);
      
      // Check for "Genocide"
      const genocideTitle = data?.titles?.find((t: any) => t?.includes('Genocide'));
      if (genocideTitle) console.error('[HeroDashboard] ❌ FOUND GENOCIDE:', genocideTitle);
      
      if (data) {
        setAvailableTitles(data.titles || []);
        setSelectedTitle(data.activeTitle || null);
      }
    } catch (error) {
      console.error('Failed to load achievement data:', error);
    }
  };

  const handleTitleChange = async (title: string) => {
    try {
      await achievementAPI.setActiveTitle(hero.id, title);
      setSelectedTitle(title);
      if (onHeroUpdate) {
        // Trigger a refresh
        onHeroUpdate({ ...hero, activeTitle: title } as any);
      }
    } catch (error) {
      console.error('Failed to set title:', error);
      alert('Failed to set title');
    }
  };
  
  const handleDelete = async () => {
    try {
      const userId = user?.twitchId || user?.id;
      if (!userId) {
        alert('You must be logged in to delete your hero');
        return;
      }
      
      setIsDeleting(true);
      await heroAPI.deleteHero(hero.id, userId);
      alert('Hero deleted successfully');
      if (onHeroDelete) {
        onHeroDelete();
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete hero');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 shadow-lg border border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center text-4xl">
              {hero.isDead ? '💀' : '⚔️'}
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">{hero.name}</h2>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`px-3 py-1 rounded text-sm font-semibold ${getRoleBg(hero.role)} text-white`}>
                  {hero.role}
                </span>
                <span className="text-gray-400">Level {hero.level}</span>
                {hero.profession && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-green-400 text-sm">
                      {hero.profession.type === 'herbalism' ? '🌿' : hero.profession.type === 'mining' ? '⛏️' : '✨'} 
                      {' '}{hero.profession.type} Lv{hero.profession.level}
                    </span>
                  </>
                )}
                <span className="text-gray-400">•</span>
                <span className="text-yellow-500">⚡ {itemScore} Item Score</span>
              </div>
              {availableTitles.length > 0 && (
                <div className="mt-3">
                  <label className="text-xs text-gray-400 block mb-1">Title</label>
                  <select
                    value={selectedTitle || ''}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="bg-gray-700 text-white px-3 py-1 rounded text-sm border border-gray-600 focus:outline-none focus:border-amber-400"
                  >
                    <option value="">No Title</option>
                    {availableTitles.map(title => (
                      <option key={title} value={title}>{title}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
          
          <div className="text-right space-y-2">
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-500">{formatNumber(hero.gold)}</div>
                <div className="text-xs text-gray-400">Gold</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{hero.tokens}</div>
                <div className="text-xs text-gray-400">Tokens</div>
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-2">
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                  disabled={isDeleting}
                >
                  Delete Hero
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-red-400">Confirm delete?</span>
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1 text-sm bg-red-700 hover:bg-red-800 text-white rounded transition-colors"
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* HP Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">HP</span>
            <span className="text-white">{formatNumber(hero.hp)} / {formatNumber(hero.maxHp)}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${hero.isDead ? 'bg-gray-500' : 'bg-red-600'}`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        {/* XP Bar */}
        <div className="mt-2">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">XP</span>
            <span className="text-white">{Math.floor(hero.xp)} / {Math.floor(hero.maxXp)}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>
        
        {/* Rested XP Indicator */}
        {hero.restedXp && hero.restedXp.hoursRemaining > 0 && (
          <div className="mt-3 bg-gradient-to-r from-blue-900 to-purple-900 border-2 border-blue-400 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">😴</span>
                <div>
                  <div className="text-blue-300 font-bold text-sm">Rested XP</div>
                  <div className="text-white text-lg font-bold">{hero.restedXp.hoursRemaining.toFixed(1)} hours</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-green-400 font-bold text-xl">+50% XP</div>
                <div className="text-xs text-gray-400">while chatting</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-gray-400 text-sm mb-1">Attack</div>
          <div className="text-2xl font-bold text-red-400">{hero.attack}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-gray-400 text-sm mb-1">Defense</div>
          <div className="text-2xl font-bold text-blue-400">{hero.defense}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-gray-400 text-sm mb-1">Max HP</div>
          <div className="text-2xl font-bold text-green-400">{formatNumber(hero.maxHp)}</div>
        </div>
      </div>

      {/* Equipment */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">Equipment</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(() => {
            // Define all equipment slots based on role
            // Tanks: weapon, armor, accessory, shield, helm, cloak, gloves, ring1, ring2, boots (10 slots)
            // Others: weapon, armor, accessory, helm, cloak, gloves, ring1, ring2, boots (9 slots)
            const tankRoles = ['guardian', 'paladin', 'warden', 'bloodknight', 'vanguard', 'brewmaster'];
            const isTank = tankRoles.includes(hero.role.toLowerCase());
            
            // Base slots for all roles
            const allSlots: Array<{ key: keyof typeof hero.equipment; label: string }> = [
              { key: 'weapon', label: 'Weapon' },
              { key: 'armor', label: 'Armor' },
              { key: 'accessory', label: 'Accessory' },
              ...(isTank ? [{ key: 'shield' as keyof typeof hero.equipment, label: 'Shield' }] : []),
              { key: 'helm', label: 'Helm' },
              { key: 'cloak', label: 'Cloak' },
              { key: 'gloves', label: 'Gloves' },
              { key: 'ring1', label: 'Ring 1' },
              { key: 'ring2', label: 'Ring 2' },
              { key: 'boots', label: 'Boots' }
            ];
            
            return allSlots.map(({ key, label }) => {
              const item = hero.equipment[key];
              return (
                <div key={key} className="bg-gray-700 rounded-lg p-4 border-2 border-gray-600 hover:border-purple-500 hover:shadow-lg transition-all">
                  <div className="text-sm text-gray-400 mb-2">{label}</div>
                  {item ? (
                    <ItemTooltip item={item} position="above">
                      <div className="hover:bg-gray-600/30 rounded p-1 -m-1 transition-colors">
                        <div className={`font-semibold ${getRarityColor(item.rarity)}`}>
                          {item.name}
                        </div>
                        <div className="mt-2 space-y-1 text-sm">
                          {item.attack > 0 && <div className="text-red-400">+{item.attack} ATK</div>}
                          {item.defense > 0 && <div className="text-blue-400">+{item.defense} DEF</div>}
                          {item.hp > 0 && <div className="text-green-400">+{item.hp} HP</div>}
                        </div>
                        
                        {/* Applied Upgrades/Enchantments */}
                        {(item as any).appliedUpgrades && (item as any).appliedUpgrades.length > 0 && (
                          <div className="mt-3 pt-2 border-t border-gray-600">
                            <div className="text-xs text-purple-400 font-semibold mb-1">Enhancements:</div>
                            <div className="space-y-1">
                              {(item as any).appliedUpgrades.map((upgrade: any, idx: number) => {
                                const isEnchantment = upgrade.recipeKey?.includes('fiery') || 
                                                     upgrade.recipeKey?.includes('vampiric') || 
                                                     upgrade.recipeKey?.includes('arcane');
                                const type = isEnchantment ? 'Enchantment' : 'Upgrade';
                                const name = upgrade.recipeKey?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
                                
                                return (
                                  <div key={idx} className="text-xs text-white">
                                    • {name} ({type})
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </ItemTooltip>
                  ) : (
                    <div className="text-gray-500 italic text-sm">Empty</div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* Active Buffs */}
      {Object.keys(hero.activeBuffs).length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Active Buffs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(hero.activeBuffs).map(([key, buff]) => (
              <div key={key} className="bg-green-900/30 border border-green-600 rounded-lg p-4">
                <div className="font-semibold text-green-400">{buff.name}</div>
                <div className="text-sm text-gray-300 mt-1">
                  +{Math.floor(buff.value * 100)}% {key.replace('Bonus', '')}
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  {formatTime(buff.remainingDuration)} combat time left
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">Combat Stats</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-gray-400 text-sm mb-1">Total Damage</div>
            <div className="text-xl font-bold text-red-400">{formatNumber(hero.stats.totalDamage)}</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm mb-1">Total Healing</div>
            <div className="text-xl font-bold text-green-400">{formatNumber(hero.stats.totalHealing)}</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm mb-1">Damage Blocked</div>
            <div className="text-xl font-bold text-blue-400">{formatNumber(hero.stats.damageBlocked)}</div>
          </div>
        </div>
      </div>

    </div>
  );
}
