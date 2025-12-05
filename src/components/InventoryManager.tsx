import { useState } from 'react';
import { Hero, Item, CraftedItem } from '../types/Hero';
import ItemTooltip from './ItemTooltip';
import { getRarityColor, getRarityBg } from '../utils/format';
import { HERBALISM_RECIPES, MINING_RECIPES, ENCHANTING_RECIPES } from '../api/mock-data';
import UpgradeModal from './UpgradeModal';

interface InventoryManagerProps {
  hero: Hero;
  onEquipChange: (slot: string, item: Item | null) => void;
  onApplyUpgrade?: (itemId: string, equipmentSlot: string) => void;
  onUseConsumable?: (itemId: string) => void;
  onUpgradeItem?: (itemId: string, selectedStats: Array<{ type: string; value: number }>) => Promise<void>;
  userId?: string;
  onUpdate?: () => void;
}

export default function InventoryManager({ hero, onEquipChange, onApplyUpgrade, onUseConsumable, onUpgradeItem, userId, onUpdate }: InventoryManagerProps) {
  const [draggedItem, setDraggedItem] = useState<{ item: Item; source: 'inventory' | 'equipment'; slot?: string } | null>(null);
  const [applyingItem, setApplyingItem] = useState<{ craftedItem: CraftedItem; recipeKey: string } | null>(null);
  const [upgradeItem, setUpgradeItem] = useState<{ item: Item; location: 'equipment' | 'inventory'; slot?: string } | null>(null);
  

  // Handle drag start
  const handleDragStart = (item: Item, source: 'inventory' | 'equipment', slot?: string) => {
    setDraggedItem({ item, source, slot });
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Handle drop on equipment slot
  const handleDropOnEquipment = (targetSlot: string) => {
    if (!draggedItem) return;

    const { item, source, slot: sourceSlot } = draggedItem;

    // Validate slot compatibility
    if (item.slot !== targetSlot) {
      console.error('Cannot equip', item.slot, 'in', targetSlot, 'slot');
      setDraggedItem(null);
      return;
    }

    // Equip the item
    if (source === 'inventory') {
      // Equipping from inventory
      onEquipChange(targetSlot, item);
    } else if (source === 'equipment' && sourceSlot) {
      // Swapping equipment slots
      const currentItem = hero.equipment[targetSlot as keyof typeof hero.equipment];
      onEquipChange(sourceSlot, currentItem);
      onEquipChange(targetSlot, item);
    }

    setDraggedItem(null);
  };

  // Handle drop on inventory (unequip)
  const handleDropOnInventory = () => {
    if (!draggedItem || draggedItem.source !== 'equipment' || !draggedItem.slot) return;

    // Unequip the item
    onEquipChange(draggedItem.slot, null);
    setDraggedItem(null);
  };

  // Handle unequip button click
  const handleUnequip = (slot: string) => {
    onEquipChange(slot, null);
  };

  // Get all inventory items (gear, loot, and crafted profession items)
  const allInventoryItems: Item[] = (hero as any).inventory || [];
  
  // Get equipped item IDs to filter them out from inventory display
  const equippedItemIds = new Set(
    Object.values(hero.equipment || {})
      .filter(item => item !== null)
      .map(item => (item as any).id)
  );
  
  // Filter out equipped items from inventory
  const inventoryItems = allInventoryItems.filter(item => !equippedItemIds.has(item.id));
  
  console.log('🎒 InventoryManager - Total items in inventory:', inventoryItems.length);
  console.log('🎒 Equipped items:', equippedItemIds.size);
  
  // Separate profession items from regular items for better display
  const professionItems = inventoryItems.filter(item => (item as any).professionItem);
  const regularItems = inventoryItems.filter(item => !(item as any).professionItem);
  
  console.log('⚗️ Profession items:', professionItems.length);
  console.log('⚔️ Regular items:', regularItems.length);

  return (
    <div className="space-y-6 pb-8">
      {/* Equipment Slots */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-2xl font-bold text-white mb-4">Equipment</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(hero.equipment).map(([slot, item]) => (
            <div
              key={slot}
              className="bg-gray-700 rounded-lg p-4 border-2 border-gray-600 hover:border-purple-500 transition-colors flex flex-col min-h-[250px]"
              onDragOver={handleDragOver}
              onDrop={() => handleDropOnEquipment(slot)}
            >
              <div className="text-sm text-gray-400 mb-2 capitalize font-semibold">{slot}</div>
              
              {item ? (
                <>
                  <div
                    draggable
                    onDragStart={() => handleDragStart(item, 'equipment', slot)}
                    className="cursor-move flex-grow"
                  >
                    <ItemTooltip item={item} position="above">
                      <div className="hover:bg-gray-600/30 rounded p-1 -m-1 transition-colors">
                        <div className={`font-semibold mb-2 ${getRarityColor(item.rarity)} flex items-center gap-2`}>
                          <span>{item.name}</span>
                          {(item as any).upgradeLevel && (item as any).upgradeLevel > 0 && (
                            <span className="text-amber-400 font-semibold text-xs">+{(item as any).upgradeLevel}</span>
                          )}
                        </div>
                        
                        <div className="space-y-1 text-xs mb-3">
                          {item.attack > 0 && <div className="text-red-400">+{item.attack} ATK</div>}
                          {item.defense > 0 && <div className="text-blue-400">+{item.defense} DEF</div>}
                          {item.hp > 0 && <div className="text-green-400">+{item.hp} HP</div>}
                        </div>

                        {/* Upgrade Stats (Custom Upgrade System) */}
                        {(item as any).upgradeStats && Array.isArray((item as any).upgradeStats) && (item as any).upgradeStats.length > 0 && (
                          <div className="mb-3 pt-2 border-t border-gray-600">
                            <div className="text-xs text-amber-400 font-semibold mb-1">⬆️ Upgrades:</div>
                            <div className="space-y-1">
                              {(item as any).upgradeStats.flatMap((upgrade: any) => 
                                upgrade.selectedStats?.map((stat: any) => {
                                  const statNames: Record<string, string> = {
                                    attack: 'Attack',
                                    defense: 'Defense',
                                    hp: 'HP',
                                    critChance: 'Crit Chance',
                                    critDamage: 'Crit Damage',
                                    healingPower: 'Healing Power',
                                    spellDamage: 'Spell Damage'
                                  };
                                  
                                  // Show the percentage they selected (all upgrades are percentages)
                                  return (
                                    <div key={`${upgrade.level}-${stat.type}`} className="text-xs text-amber-300">
                                      +{stat.value}% {statNames[stat.type] || stat.type}
                                    </div>
                                  );
                                }) || []
                              )}
                            </div>
                          </div>
                        )}

                        {/* Applied Upgrades/Enchantments */}
                        {(item as any).appliedUpgrades && (item as any).appliedUpgrades.length > 0 && (
                          <div className="mb-3 pt-2 border-t border-gray-600">
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
                  </div>

                  <div className="flex gap-2 mt-auto">
                    {onUpgradeItem && item.id && (
                      <button
                        onClick={() => setUpgradeItem({ item, location: 'equipment', slot })}
                        disabled={(item.upgradeLevel || 0) >= 2}
                        className={`flex-1 text-white text-xs py-1 rounded transition-colors ${
                          (item.upgradeLevel || 0) >= 2
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-amber-600 hover:bg-amber-700'
                        }`}
                        title={(item.upgradeLevel || 0) >= 2 ? 'Item is fully upgraded (+2)' : 'Upgrade item'}
                      >
                        {(item.upgradeLevel || 0) >= 2 ? 'Max Level' : 'Upgrade'}
                      </button>
                    )}
                    <button
                      onClick={() => handleUnequip(slot)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs py-1 rounded transition-colors"
                    >
                      Unequip
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-gray-500 italic text-center flex-grow flex items-center justify-center">Empty</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Inventory */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-2xl font-bold text-white mb-4">Inventory ({inventoryItems.length} items)</h3>
        
        {inventoryItems.length === 0 ? (
          <div 
            className="text-gray-400 text-center py-12 border-2 border-dashed border-gray-600 rounded-lg"
            onDragOver={handleDragOver}
            onDrop={handleDropOnInventory}
          >
            No items in inventory. Unequip items, loot from combat, or craft profession items.
          </div>
        ) : (
          <>
            {/* Profession Items Section */}
            {professionItems.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-purple-400 mb-3">
                  ⚗️ Crafted Items
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {(() => {
                    // Group items by recipeKey
                    const groupedItems: Record<string, any[]> = {};
                    professionItems.forEach(item => {
                      const profItem = item as any;
                      const key = profItem.recipeKey;
                      if (!groupedItems[key]) {
                        groupedItems[key] = [];
                      }
                      groupedItems[key].push(profItem);
                    });

                    return Object.entries(groupedItems).map(([recipeKey, items]) => {
                      const firstItem = items[0];
                      const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
                      const isConsumable = firstItem.professionType === 'herbalism';
                      const isUpgrade = firstItem.professionType === 'mining';
                      const isEnchantment = firstItem.professionType === 'enchanting' && !recipeKey.startsWith('rune_');
                      const isRune = firstItem.professionType === 'enchanting' && recipeKey.startsWith('rune_');
                      
                      // Get recipe details
                      const allRecipes = firstItem.professionType === 'herbalism' 
                        ? HERBALISM_RECIPES 
                        : firstItem.professionType === 'mining' 
                          ? MINING_RECIPES 
                          : ENCHANTING_RECIPES;
                      const recipe = allRecipes[recipeKey as keyof typeof allRecipes];
                      
                      // Get applicable slots from item or recipe
                      const applicableSlots = firstItem.applicableSlots || recipe?.applicableSlots || [];
                      const canApply = (isUpgrade || isEnchantment) && applicableSlots.length > 0;
                      
                      return (
                        <div
                          key={recipeKey}
                          className={`rounded-lg p-3 border-2 transition-all hover:shadow-lg ${
                            isConsumable ? 'border-green-500 bg-green-900/20 hover:border-green-400 cursor-pointer' :
                            isUpgrade ? 'border-orange-500 bg-orange-900/20 hover:border-orange-400 cursor-pointer' :
                            'border-purple-500 bg-purple-900/20 hover:border-purple-400 cursor-pointer'
                          }`}
                          onClick={() => {
                            // If it's an enchantment or upgrade with applicable slots, open apply modal
                            if (canApply) {
                              // Ensure the item has applicableSlots for the modal
                              const itemWithSlots = { ...firstItem, applicableSlots };
                              setApplyingItem({ craftedItem: itemWithSlots, recipeKey });
                            }
                          }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="text-xl">
                              {isConsumable ? '🧪' : isUpgrade ? '⚙️' : isRune ? '📜' : '✨'}
                            </div>
                            <div className="text-xs bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">
                              T{firstItem.tier}
                            </div>
                          </div>
                          
                          <div className="font-semibold text-white text-sm mb-1 line-clamp-1">{firstItem.name}</div>
                          <div className="text-xs text-gray-400 mb-2">x{totalQuantity}</div>
                          
                          {/* Recipe Description */}
                          {recipe && (
                            <div className="text-xs text-blue-300 mb-2 line-clamp-2">
                              {recipe.description}
                            </div>
                          )}
                          
                          {/* Effect Details */}
                          {recipe && recipe.effect && (
                            <div className="bg-gray-800 rounded p-2 mb-2">
                              <div className="text-xs text-green-300 line-clamp-2">{recipe.effect}</div>
                            </div>
                          )}
                          
                          {/* Action Buttons */}
                          {isConsumable && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onUseConsumable) onUseConsumable(firstItem.id);
                              }}
                              className="w-full bg-green-600 hover:bg-green-700 text-white py-1.5 rounded text-xs font-semibold transition-colors"
                            >
                              Use
                            </button>
                          )}
                          
                          {canApply && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                // Ensure the item has applicableSlots for the modal
                                const itemWithSlots = { ...firstItem, applicableSlots };
                                setApplyingItem({ craftedItem: itemWithSlots, recipeKey });
                              }}
                              className={`w-full ${isUpgrade ? 'bg-orange-600 hover:bg-orange-700' : 'bg-purple-600 hover:bg-purple-700'} text-white py-1.5 rounded text-xs font-semibold transition-colors`}
                            >
                              Apply
                            </button>
                          )}
                          
                          {isRune && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onUseConsumable) onUseConsumable(firstItem.id);
                              }}
                              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-1.5 rounded text-xs font-semibold transition-colors"
                            >
                              Activate
                            </button>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* Regular Gear/Loot Section */}
            {regularItems.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-blue-400 mb-3">
                  ⚔️ Gear & Loot ({regularItems.length})
                </h4>
                <div 
                  className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
                >
                  {regularItems.map((item, idx) => (
                    <div
                      key={idx}
                      onDoubleClick={() => {
                        // Double-click to equip
                        if (item.slot && onEquipChange) {
                          onEquipChange(item.slot, item);
                        }
                      }}
                      className={`${getRarityBg(item.rarity)} rounded-lg p-3 border-2 cursor-pointer hover:scale-105 transition-transform hover:border-blue-400`}
                    >
                      <ItemTooltip item={item}>
                        <div className="hover:brightness-110 transition-all">
                          <div className={`font-semibold text-sm mb-1 ${getRarityColor(item.rarity)} flex items-center gap-2`}>
                            <span>{item.name}</span>
                            {(item as any).upgradeLevel && (item as any).upgradeLevel > 0 && (
                              <span className="text-amber-400 font-semibold text-xs">+{(item as any).upgradeLevel}</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 capitalize mb-2">{item.slot}</div>
                          <div className="space-y-1 text-xs mb-2">
                            {item.attack > 0 && <div className="text-red-400">+{item.attack} ATK</div>}
                            {item.defense > 0 && <div className="text-blue-400">+{item.defense} DEF</div>}
                            {item.hp > 0 && <div className="text-green-400">+{item.hp} HP</div>}
                          </div>
                          {item.slot && (
                            <div className="flex gap-2">
                              {onUpgradeItem && item.id && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setUpgradeItem({ item, location: 'inventory' });
                                  }}
                                  disabled={(item.upgradeLevel || 0) >= 2}
                                  className={`flex-1 text-white text-xs py-1.5 rounded font-semibold transition-colors ${
                                    (item.upgradeLevel || 0) >= 2
                                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                      : 'bg-amber-600 hover:bg-amber-700'
                                  }`}
                                  title={(item.upgradeLevel || 0) >= 2 ? 'Item is fully upgraded (+2)' : 'Upgrade item'}
                                >
                                  {(item.upgradeLevel || 0) >= 2 ? 'Max Level' : 'Upgrade'}
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onEquipChange && item.slot) {
                                    console.log('Equipping item:', item.name, 'to slot:', item.slot);
                                    onEquipChange(item.slot, item);
                                  } else {
                                    console.error('Cannot equip: missing slot or onEquipChange handler', { slot: item.slot, hasHandler: !!onEquipChange });
                                  }
                                }}
                                className={`${onUpgradeItem && item.id ? 'flex-1' : 'w-full'} bg-blue-600 hover:bg-blue-700 text-white text-xs py-1.5 rounded font-semibold transition-colors`}
                              >
                                Equip
                              </button>
                            </div>
                          )}
                          {!item.slot && (
                            <div className="text-xs text-gray-500 text-center py-1">
                              No slot
                            </div>
                          )}
                        </div>
                      </ItemTooltip>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="mt-4 text-xs text-gray-500 text-center">
          Drag gear to equipment slots to equip. Drag equipped items back to unequip. Use buttons to apply crafted items.
        </div>
      </div>

      {/* Apply to Gear Modal */}
      {applyingItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-2xl w-full border border-gray-700 p-6">
            <h3 className="text-2xl font-bold text-white mb-4">
              Apply {applyingItem.recipeKey.replace(/_/g, ' ')}
            </h3>
            <p className="text-gray-400 mb-6">Select which piece of equipment to apply this to:</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              {Object.entries(hero.equipment)
                .filter(([slot, item]) => {
                  if (!item) return false;
                  // Filter by applicable slots if the item has restrictions
                  if (applyingItem.craftedItem.applicableSlots && applyingItem.craftedItem.applicableSlots.length > 0) {
                    return applyingItem.craftedItem.applicableSlots.includes(slot);
                  }
                  // If no restrictions, show all slots (for consumables that shouldn't be applied to gear)
                  return false; // Don't show slots for consumables
                })
                .map(([slot, item]) => (
                  <button
                    key={slot}
                    onClick={() => {
                      if (onApplyUpgrade) {
                        onApplyUpgrade(applyingItem.craftedItem.id, slot);
                      }
                      setApplyingItem(null);
                    }}
                    className="bg-gray-800 hover:bg-gray-700 border-2 border-gray-600 hover:border-blue-500 rounded-lg p-4 text-left transition-colors"
                  >
                    <div className="text-sm text-gray-400 capitalize mb-1">{slot}</div>
                    <div className={`font-semibold ${getRarityColor(item.rarity)}`}>
                      {item.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {item.attack > 0 && `+${item.attack} ATK `}
                      {item.defense > 0 && `+${item.defense} DEF `}
                      {item.hp > 0 && `+${item.hp} HP`}
                    </div>
                  </button>
                ))}
              {Object.entries(hero.equipment).filter(([slot, item]) => {
                if (!item) return false;
                if (applyingItem.craftedItem.applicableSlots && applyingItem.craftedItem.applicableSlots.length > 0) {
                  return applyingItem.craftedItem.applicableSlots.includes(slot);
                }
                return false;
              }).length === 0 && (
                <div className="col-span-2 text-center text-gray-400 py-4">
                  No compatible equipment slots available for this item.
                  {applyingItem.craftedItem.applicableSlots && applyingItem.craftedItem.applicableSlots.length > 0 && (
                    <div className="text-xs mt-2">
                      This item can only be applied to: {applyingItem.craftedItem.applicableSlots.join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => setApplyingItem(null)}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Inventory Space:</span>
          <span className="text-white">{inventoryItems.length} / 50 items</span>
        </div>
      </div>

      {/* Upgrade Modal */}
      {upgradeItem && onUpgradeItem && (
        <UpgradeModal
          item={upgradeItem.item}
          currentGold={hero.gold || 0}
          onClose={() => setUpgradeItem(null)}
          onUpgrade={async (itemId, selectedStats) => {
            await onUpgradeItem(itemId, selectedStats);
            if (onUpdate) onUpdate();
          }}
          itemLocation={upgradeItem.location}
          slot={upgradeItem.slot}
        />
      )}
    </div>
  );
}
