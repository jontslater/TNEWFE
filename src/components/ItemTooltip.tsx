import { useState, useRef, useEffect } from 'react';
import { Item, Socket, Hero } from '../types/Hero';
import { getRarityColor, getMaxSockets, getGemColor } from '../utils/format';

interface ItemTooltipProps {
  item: Item;
  children: React.ReactNode;
  position?: 'above' | 'below';
  compareWith?: Item | null; // Optional item to compare with (e.g., equipped item)
  hero?: Hero; // Hero object to check for slot prestige cores
}

export default function ItemTooltip({ item, children, position: initialPosition = 'below', compareWith, hero }: ItemTooltipProps) {
  const [actualPosition, setActualPosition] = useState<'above' | 'below'>(initialPosition);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkPosition = () => {
      if (!containerRef.current || !tooltipRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const tooltip = tooltipRef.current;
      const viewportHeight = window.innerHeight;

      // Temporarily make tooltip visible to measure it
      const originalClasses = tooltip.className;
      tooltip.classList.remove('invisible', 'opacity-0');
      tooltip.classList.add('visible', 'opacity-100');
      
      const tooltipRect = tooltip.getBoundingClientRect();
      const tooltipHeight = tooltipRect.height;
      
      // Restore original classes
      tooltip.className = originalClasses;

      // Calculate available space
      const spaceBelow = viewportHeight - containerRect.bottom;
      const spaceAbove = containerRect.top;
      const neededSpace = tooltipHeight + 16; // 16px for margin

      // Decide position: prefer below, but use above if not enough space below
      if (spaceBelow < neededSpace && spaceAbove >= neededSpace) {
        setActualPosition('above');
      } else if (spaceBelow >= neededSpace) {
        setActualPosition('below');
      } else {
        // Not enough space either way, use whichever has more space
        setActualPosition(spaceAbove > spaceBelow ? 'above' : 'below');
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mouseenter', checkPosition);
      window.addEventListener('scroll', checkPosition, true);
      window.addEventListener('resize', checkPosition);
      
      return () => {
        container.removeEventListener('mouseenter', checkPosition);
        window.removeEventListener('scroll', checkPosition, true);
        window.removeEventListener('resize', checkPosition);
      };
    }
  }, []);

  const positionClasses = actualPosition === 'above' 
    ? 'bottom-full mb-2' 
    : 'top-full mt-2';
    
  const arrowClasses = actualPosition === 'above'
    ? 'top-full w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-gray-700'
    : 'bottom-full w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-8 border-b-gray-700';

  return (
    <div ref={containerRef} className="relative group cursor-help">
      {children}
      
      {/* Tooltip - Smart positioning based on available space */}
      <div 
        ref={tooltipRef}
        className={`absolute left-1/2 -translate-x-1/2 ${positionClasses} invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-[9999] pointer-events-none`}
      >
        <div className={`bg-gray-900 border-2 border-gray-700 rounded-lg p-4 shadow-2xl ${compareWith ? 'flex gap-4 min-w-[600px]' : 'min-w-64 max-w-80'}`}>
          {/* Main Item Tooltip */}
          <div className={compareWith ? 'flex-1' : ''}>
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

          {/* Prestige Core */}
          {/* Show prestige core for this slot (cores are attached to slots, not items) */}
          {hero && item.slot && hero.prestigeSlotCores?.[item.slot] && (() => {
            const slotCore = hero.prestigeSlotCores[item.slot];
            return (
              <div className="border-t border-gray-700 pt-3 mt-3">
                <div className="text-xs font-semibold mb-2" style={{ color: slotCore.color || '#FFD700' }}>
                  ⭐ Prestige Core: {slotCore.name}
                </div>
                <div className="space-y-1">
                  {slotCore.statBonus && (
                    <>
                      {slotCore.statBonus.attack > 0 && (
                        <div className="text-red-400 text-sm">⚔️ +{slotCore.statBonus.attack} Attack</div>
                      )}
                      {slotCore.statBonus.defense > 0 && (
                        <div className="text-blue-400 text-sm">🛡️ +{slotCore.statBonus.defense} Defense</div>
                      )}
                      {slotCore.statBonus.hp > 0 && (
                        <div className="text-green-400 text-sm">❤️ +{slotCore.statBonus.hp} Max HP</div>
                      )}
                    </>
                  )}
                  {slotCore.bonus && (
                    <>
                      {slotCore.bonus.xpGain > 0 && (
                        <div className="text-yellow-400 text-sm">📈 +{(slotCore.bonus.xpGain * 100).toFixed(1)}% XP Gain</div>
                      )}
                      {slotCore.bonus.goldGain > 0 && (
                        <div className="text-amber-400 text-sm">💰 +{(slotCore.bonus.goldGain * 100).toFixed(1)}% Gold Gain</div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })()}
          </div>
          
          {/* Comparison Item Tooltip (if compareWith provided) */}
          {compareWith && (
            <>
              <div className="w-px bg-gray-600"></div>
              <div className="flex-1">
                <div className="text-xs font-semibold text-gray-400 mb-2">EQUIPPED:</div>
                {/* Item Name */}
                <div className={`text-lg font-bold mb-2 ${getRarityColor(compareWith.rarity)}`}>
                  <div className="flex items-center gap-2">
                    <span>{compareWith.name}</span>
                    {(compareWith as any).upgradeLevel && (compareWith as any).upgradeLevel > 0 && (
                      <span className="text-amber-400 font-semibold">+{(compareWith as any).upgradeLevel}</span>
                    )}
                  </div>
                </div>

                {/* Slot and Rarity */}
                <div className="flex items-center justify-between mb-3 text-sm">
                  <span className="text-gray-400 capitalize">{compareWith.slot}</span>
                  <span className={`font-semibold capitalize ${getRarityColor(compareWith.rarity)}`}>
                    {compareWith.rarity}
                  </span>
                </div>

                {/* Base Stats */}
                <div className="space-y-1 mb-3">
                  {compareWith.attack > 0 && (
                    <div className="text-red-400">+{compareWith.attack} Attack</div>
                  )}
                  {compareWith.defense > 0 && (
                    <div className="text-blue-400">+{compareWith.defense} Defense</div>
                  )}
                  {compareWith.hp > 0 && (
                    <div className="text-green-400">+{compareWith.hp} HP</div>
                  )}
                </div>

                {/* Primary Stats */}
                {(compareWith.intellect || compareWith.strength || compareWith.dexterity || compareWith.stamina) && (
                  <div className="border-t border-gray-700 pt-3 mb-3">
                    <div className="text-xs font-semibold text-cyan-400 mb-2">Primary Stats:</div>
                    <div className="space-y-1">
                      {compareWith.intellect && compareWith.intellect > 0 && (
                        <div className="text-purple-400">+{compareWith.intellect} Intellect</div>
                      )}
                      {compareWith.strength && compareWith.strength > 0 && (
                        <div className="text-orange-400">+{compareWith.strength} Strength</div>
                      )}
                      {compareWith.dexterity && compareWith.dexterity > 0 && (
                        <div className="text-yellow-400">+{compareWith.dexterity} Dexterity</div>
                      )}
                      {compareWith.stamina && compareWith.stamina > 0 && (
                        <div className="text-green-500">+{compareWith.stamina} Stamina <span className="text-gray-400 text-xs">(+{compareWith.stamina * 10} HP)</span></div>
                      )}
                    </div>
                  </div>
                )}

                {/* Secondary Stats */}
                {compareWith.secondaryStats && Object.keys(compareWith.secondaryStats).length > 0 && (
                  <div className="border-t border-gray-700 pt-3 mb-3">
                    <div className="text-xs font-semibold text-pink-400 mb-2">Secondary Stats:</div>
                    <div className="space-y-1">
                      {compareWith.secondaryStats.healingPower && compareWith.secondaryStats.healingPower > 0 && (
                        <div className="text-green-300">+{compareWith.secondaryStats.healingPower}% Healing Power</div>
                      )}
                      {compareWith.secondaryStats.spellDamage && compareWith.secondaryStats.spellDamage > 0 && (
                        <div className="text-purple-300">+{compareWith.secondaryStats.spellDamage}% Spell Damage</div>
                      )}
                      {compareWith.secondaryStats.meleeDamage && compareWith.secondaryStats.meleeDamage > 0 && (
                        <div className="text-red-300">+{compareWith.secondaryStats.meleeDamage}% Melee Damage</div>
                      )}
                      {compareWith.secondaryStats.hpRegen && compareWith.secondaryStats.hpRegen > 0 && (
                        <div className="text-green-400">+{compareWith.secondaryStats.hpRegen} HP/sec</div>
                      )}
                      {compareWith.secondaryStats.damageReduction && compareWith.secondaryStats.damageReduction > 0 && (
                        <div className="text-blue-300">+{compareWith.secondaryStats.damageReduction}% Damage Reduction</div>
                      )}
                      {compareWith.secondaryStats.critChance && compareWith.secondaryStats.critChance > 0 && (
                        <div className="text-yellow-300">+{compareWith.secondaryStats.critChance}% Critical Chance</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Special Modifier */}
                {compareWith.specialModifier && (
                  <div className="border-t border-gray-700 pt-3 mt-3">
                    <div className="text-xs font-semibold text-amber-400 mb-2">🌟 Legendary Power:</div>
                    <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-amber-600/50 rounded p-2">
                      <div className="text-amber-200 font-bold text-sm mb-1">{compareWith.specialModifier.name}</div>
                      <div className="text-amber-100 text-sm">{compareWith.specialModifier.description}</div>
                    </div>
                  </div>
                )}

                {/* Proc Effects */}
                {compareWith.procEffects && compareWith.procEffects.length > 0 && (
                  <div className="border-t border-gray-700 pt-3 mt-3">
                    <div className="text-xs font-semibold text-purple-400 mb-2">✨ Special Effects:</div>
                    {compareWith.procEffects.map((proc, idx) => (
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

                {/* Upgrade Stats */}
                {(compareWith as any).upgradeStats && Array.isArray((compareWith as any).upgradeStats) && (compareWith as any).upgradeStats.length > 0 && (
                  <div className="border-t border-gray-700 pt-3 mt-3">
                    <div className="text-xs font-semibold text-amber-400 mb-2">⬆️ Upgrade Stats:</div>
                    {(compareWith as any).upgradeStats.map((upgrade: any, idx: number) => {
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
                            {upgrade.selectedStats && upgrade.selectedStats.map((stat: any, statIdx: number) => (
                              <div key={statIdx} className="text-xs text-amber-300">
                                +{stat.value}% {statNames[stat.type] || stat.type}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Applied Upgrades/Enchantments */}
                {(compareWith as any).appliedUpgrades && (compareWith as any).appliedUpgrades.length > 0 && (
                  <div className="border-t border-gray-700 pt-3 mt-3">
                    <div className="text-xs font-semibold text-orange-400 mb-2">⚒️ Applied Enhancements:</div>
                    {(compareWith as any).appliedUpgrades.map((upgrade: any, idx: number) => {
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

                {/* Sockets */}
                {compareWith.slot && (() => {
                  const maxSockets = compareWith.maxSockets !== undefined ? compareWith.maxSockets : getMaxSockets(compareWith.rarity || 'common', compareWith.slot);
                  const sockets = compareWith.sockets || [];
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
                            No sockets added yet.
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Prestige Core */}
                {(compareWith as any).prestigeCore && (
                  <div className="border-t border-gray-700 pt-3 mt-3">
                    <div className="text-xs font-semibold mb-2" style={{ color: (compareWith as any).prestigeCore.color || '#FFD700' }}>
                      ⭐ Prestige Core: {(compareWith as any).prestigeCore.name}
                    </div>
                    <div className="space-y-1">
                      {(compareWith as any).prestigeCore.statBonus && (
                        <>
                          {(compareWith as any).prestigeCore.statBonus.attack > 0 && (
                            <div className="text-red-400 text-sm">⚔️ +{(compareWith as any).prestigeCore.statBonus.attack} Attack</div>
                          )}
                          {(compareWith as any).prestigeCore.statBonus.defense > 0 && (
                            <div className="text-blue-400 text-sm">🛡️ +{(compareWith as any).prestigeCore.statBonus.defense} Defense</div>
                          )}
                          {(compareWith as any).prestigeCore.statBonus.hp > 0 && (
                            <div className="text-green-400 text-sm">❤️ +{(compareWith as any).prestigeCore.statBonus.hp} Max HP</div>
                          )}
                        </>
                      )}
                      {(compareWith as any).prestigeCore.bonus && (
                        <>
                          {(compareWith as any).prestigeCore.bonus.xpGain > 0 && (
                            <div className="text-yellow-400 text-sm">📈 +{(((compareWith as any).prestigeCore.bonus.xpGain) * 100).toFixed(1)}% XP Gain</div>
                          )}
                          {(compareWith as any).prestigeCore.bonus.goldGain > 0 && (
                            <div className="text-amber-400 text-sm">💰 +{(((compareWith as any).prestigeCore.bonus.goldGain) * 100).toFixed(1)}% Gold Gain</div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Tooltip Arrow */}
          <div className={`absolute left-1/2 -translate-x-1/2 ${arrowClasses}`}></div>
        </div>
      </div>
    </div>
  );
}
