import { Item } from '../types/Hero';
import { getRarityColor } from '../utils/format';

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
            {item.name}
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

          {/* Applied Upgrades/Enchantments */}
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

          {/* Tooltip Arrow */}
          <div className={`absolute left-1/2 -translate-x-1/2 ${arrowClasses}`}></div>
        </div>
      </div>
    </div>
  );
}
