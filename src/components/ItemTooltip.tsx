import { Item, Socket } from '../types/Hero';
import { getRarityColor, getMaxSockets, getGemColor } from '../utils/format';

interface ItemTooltipProps {
  item: Item;
  children: React.ReactNode;
  position?: 'above' | 'below';
}

export default function ItemTooltip({ item, children, position = 'below' }: ItemTooltipProps) {
  const positionClasses = position === 'above' 
    ? 'bottom-full mb-2' 
    : 'top-full mt-2';
    
  const arrowClasses = position === 'above'
    ? 'top-full w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-gray-700'
    : 'bottom-full w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-8 border-b-gray-700';

  return (
    <div className="relative group cursor-help">
      {children}
      
      {/* Tooltip */}
      <div className={`absolute left-1/2 -translate-x-1/2 ${positionClasses} invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 pointer-events-none`}>
        <div className="bg-gray-900 border-2 border-gray-700 rounded-lg p-4 shadow-2xl min-w-64">
          {/* Item Name */}
          <div className={`text-lg font-bold mb-2 ${getRarityColor(item.rarity)}`}>
            <div className="flex items-center gap-2">
              <span>{item.name}</span>
              {(item as any).upgradeLevel && (item as any).upgradeLevel > 0 && (
                <span className="text-amber-400 font-semibold">+{(item as any).upgradeLevel}</span>
              )}
            </div>
          </div>

          {/* Slot and Rarity */}
          <div className="flex items-center justify-between mb-3 text-sm">
            <span className="text-gray-400 capitalize">{item.slot}</span>
            <span className={`font-semibold capitalize ${getRarityColor(item.rarity)}`}>
              {item.rarity}
            </span>
          </div>

          {/* Base Stats */}
          <div className="space-y-1 mb-3">
            {item.attack > 0 && (
              <div className="text-red-400">+{item.attack} Attack</div>
            )}
            {item.defense > 0 && (
              <div className="text-blue-400">+{item.defense} Defense</div>
            )}
            {item.hp > 0 && (
              <div className="text-green-400">+{item.hp} HP</div>
            )}
          </div>

          {/* Primary Stats */}
          {(item.intellect || item.strength || item.dexterity || item.stamina) && (
            <div className="border-t border-gray-700 pt-3 mb-3">
              <div className="text-xs font-semibold text-cyan-400 mb-2">Primary Stats:</div>
              <div className="space-y-1">
                {item.intellect && item.intellect > 0 && (
                  <div className="text-purple-400">+{item.intellect} Intellect</div>
                )}
                {item.strength && item.strength > 0 && (
                  <div className="text-orange-400">+{item.strength} Strength</div>
                )}
                {item.dexterity && item.dexterity > 0 && (
                  <div className="text-yellow-400">+{item.dexterity} Dexterity</div>
                )}
                {item.stamina && item.stamina > 0 && (
                  <div className="text-green-500">+{item.stamina} Stamina <span className="text-gray-400 text-xs">(+{item.stamina * 10} HP)</span></div>
                )}
              </div>
            </div>
          )}

          {/* Secondary Stats */}
          {item.secondaryStats && Object.keys(item.secondaryStats).length > 0 && (
            <div className="border-t border-gray-700 pt-3 mb-3">
              <div className="text-xs font-semibold text-pink-400 mb-2">Secondary Stats:</div>
              <div className="space-y-1">
                {item.secondaryStats.healingPower && item.secondaryStats.healingPower > 0 && (
                  <div className="text-green-300">+{item.secondaryStats.healingPower}% Healing Power</div>
                )}
                {item.secondaryStats.spellDamage && item.secondaryStats.spellDamage > 0 && (
                  <div className="text-purple-300">+{item.secondaryStats.spellDamage}% Spell Damage</div>
                )}
                {item.secondaryStats.meleeDamage && item.secondaryStats.meleeDamage > 0 && (
                  <div className="text-red-300">+{item.secondaryStats.meleeDamage}% Melee Damage</div>
                )}
                {item.secondaryStats.hpRegen && item.secondaryStats.hpRegen > 0 && (
                  <div className="text-green-400">+{item.secondaryStats.hpRegen} HP/sec</div>
                )}
                {item.secondaryStats.damageReduction && item.secondaryStats.damageReduction > 0 && (
                  <div className="text-blue-300">+{item.secondaryStats.damageReduction}% Damage Reduction</div>
                )}
                {item.secondaryStats.critChance && item.secondaryStats.critChance > 0 && (
                  <div className="text-yellow-300">+{item.secondaryStats.critChance}% Critical Chance</div>
                )}
              </div>
            </div>
          )}

          {/* Special Modifier (Legendary Only) */}
          {item.specialModifier && (
            <div className="border-t border-gray-700 pt-3 mt-3">
              <div className="text-xs font-semibold text-amber-400 mb-2">🌟 Legendary Power:</div>
              <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-amber-600/50 rounded p-2">
                <div className="text-amber-200 font-bold text-sm mb-1">{item.specialModifier.name}</div>
                <div className="text-amber-100 text-sm">{item.specialModifier.description}</div>
              </div>
            </div>
          )}

          {/* Proc Effects */}
          {item.procEffects && item.procEffects.length > 0 && (
            <div className="border-t border-gray-700 pt-3 mt-3">
              <div className="text-xs font-semibold text-purple-400 mb-2">✨ Special Effects:</div>
              {item.procEffects.map((proc, idx) => (
                <div key={idx} className="text-sm mb-2">
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-400 font-bold shrink-0">
                      {Math.floor((proc.chance || 0) * 100)}%
                    </span>
                    <span className="text-green-300">
                      {proc.description || proc.effect}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upgrade Stats (Custom Upgrade System) */}
          {(item as any).upgradeStats && Array.isArray((item as any).upgradeStats) && (item as any).upgradeStats.length > 0 && (
            <div className="border-t border-gray-700 pt-3 mt-3">
              <div className="text-xs font-semibold text-amber-400 mb-2">⬆️ Upgrade Stats:</div>
              {(item as any).upgradeStats.map((upgrade: any, idx: number) => {
                const statNames: Record<string, string> = {
                  attack: 'Attack',
                  defense: 'Defense',
                  hp: 'HP',
                  critChance: 'Crit Chance',
                  critDamage: 'Crit Damage',
                  healingPower: 'Healing Power',
                  spellDamage: 'Spell Damage'
                };
                
                return (
                  <div key={idx} className="text-sm mb-2">
                    <div className="text-xs text-gray-400 mb-1">
                      Level {upgrade.level}:
                    </div>
                    <div className="space-y-1">
                      {upgrade.selectedStats && upgrade.selectedStats.map((stat: any, statIdx: number) => {
                        // Show the percentage they selected (all upgrades are percentages)
                        return (
                          <div key={statIdx} className="text-xs text-amber-300">
                            +{stat.value}% {statNames[stat.type] || stat.type}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Applied Upgrades/Enchantments (Craftables) */}
          {(item as any).appliedUpgrades && (item as any).appliedUpgrades.length > 0 && (
            <div className="border-t border-gray-700 pt-3 mt-3">
              <div className="text-xs font-semibold text-orange-400 mb-2">⚒️ Applied Enhancements:</div>
              {(item as any).appliedUpgrades.map((upgrade: any, idx: number) => {
                const isEnchantment = upgrade.recipeKey?.includes('fiery') || 
                                     upgrade.recipeKey?.includes('vampiric') || 
                                     upgrade.recipeKey?.includes('arcane') ||
                                     upgrade.recipeKey?.includes('rune');
                const type = isEnchantment ? 'Enchantment' : 'Upgrade';
                const name = upgrade.recipeKey?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
                
                return (
                  <div key={idx} className="text-sm mb-1">
                    <div className="text-white">
                      • {name} <span className="text-gray-400">({type})</span>
                    </div>
                    {upgrade.bonus && (
                      <div className="text-xs text-gray-400 ml-3">
                        {upgrade.bonus.attack > 0 && `+${upgrade.bonus.attack} ATK `}
                        {upgrade.bonus.defense > 0 && `+${upgrade.bonus.defense} DEF `}
                        {upgrade.bonus.hp > 0 && `+${upgrade.bonus.hp} HP`}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Sockets (only show for gear items with slots) */}
          {item.slot && (() => {
            const maxSockets = item.maxSockets !== undefined ? item.maxSockets : getMaxSockets(item.rarity || 'common', item.slot);
            const sockets = item.sockets || [];
            const socketCount = sockets.length;
            
            if (maxSockets > 0 || socketCount > 0) {
              return (
                <div className="border-t border-gray-700 pt-3 mt-3">
                  <div className="text-xs font-semibold text-cyan-400 mb-2">
                    💎 Sockets: {socketCount}/{maxSockets}
                  </div>
                  {sockets.length > 0 ? (
                    <div className="space-y-2">
                      {sockets.map((socket: Socket, idx: number) => (
                        <div key={socket.id || idx} className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {socket.gem ? (
                              <>
                                <div 
                                  className="w-4 h-4 rounded-full border-2 border-gray-600"
                                  style={{ backgroundColor: getGemColor(socket.gem.type) }}
                                  title={`${socket.gem.type.charAt(0).toUpperCase() + socket.gem.type.slice(1)} (${socket.gem.rarity})`}
                                />
                                <span className="text-xs text-white">
                                  {socket.gem.type.charAt(0).toUpperCase() + socket.gem.type.slice(1)} ({socket.gem.rarity})
                                </span>
                              </>
                            ) : (
                              <>
                                <div className="w-4 h-4 rounded-full border-2 border-gray-500 bg-gray-700" />
                                <span className="text-xs text-gray-400">Empty Socket</span>
                              </>
                            )}
                          </div>
                          {socket.gem && socket.gem.stats && (
                            <div className="text-xs text-gray-400 ml-2">
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
                                const isPercentage = ['critChance', 'critDamage', 'damageReduction', 'xpGain', 'goldGain', 'tokenGain', 'allStats'].includes(stat);
                                return (
                                  <span key={stat} className="mr-2">
                                    +{value}{isPercentage ? '%' : ''} {statLabels[stat] || stat}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400">
                      No sockets added yet. Craft a Gem Socket item to add sockets.
                    </div>
                  )}
                  
                  {/* Socket Bonuses */}
                  {(item as any).socketBonuses && Object.keys((item as any).socketBonuses).length > 0 && (
                    <div className="mt-3 pt-2 border-t border-gray-600">
                      <div className="text-xs font-semibold text-yellow-400 mb-1">⚡ Socket Bonus:</div>
                      <div className="text-xs text-yellow-200">
                        {Object.entries((item as any).socketBonuses).map(([stat, value]: [string, any]) => {
                          if (value === 0 || value === undefined) return null;
                          const statLabels: Record<string, string> = {
                            attack: '+% Attack',
                            defense: '+% Defense',
                            allStats: '+% All Stats',
                            xpGain: '+% XP Gain',
                            goldGain: '+% Gold Gain',
                            critChance: '+% Crit Chance',
                            damageReduction: '+% Damage Reduction'
                          };
                          return (
                            <div key={stat}>
                              {statLabels[stat]?.replace('+%', `+${value}%`) || `+${value}% ${stat}`}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            }
            return null;
          })()}

          {/* Tooltip Arrow */}
          <div className={`absolute left-1/2 -translate-x-1/2 ${arrowClasses}`}></div>
        </div>
      </div>
    </div>
  );
}
