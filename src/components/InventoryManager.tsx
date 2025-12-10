import { useState } from 'react';
import { Hero, Item, CraftedItem } from '../types/Hero';
import ItemTooltip from './ItemTooltip';
import { getRarityColor, getRarityBg, getMaxSockets } from '../utils/format';
import { HERBALISM_RECIPES, MINING_RECIPES, ENCHANTING_RECIPES } from '../api/mock-data';
import UpgradeModal from './UpgradeModal';
import ReforgeModal from './ReforgeModal';
import SocketModal from './SocketModal';
import GemModal from './GemModal';
import { heroAPI } from '../api/client';

interface InventoryManagerProps {
  hero: Hero;
  onEquipChange: (slot: string, item: Item | null) => void;
  onApplyUpgrade?: (itemId: string, equipmentSlot: string) => void;
  onUpgradeItem?: (itemId: string, selectedStats: Array<{ type: string; value: number }>) => Promise<void>;
  userId?: string;
  onUpdate?: () => void;
}

function isRarePlus(rarity: string | undefined): boolean {
  return ['rare', 'epic', 'legendary', 'artifact', 'mythic'].includes(rarity?.toLowerCase() || '');
}

export default function InventoryManager({ hero, onEquipChange, onApplyUpgrade, onUpgradeItem, userId, onUpdate }: InventoryManagerProps) {
  const [draggedItem, setDraggedItem] = useState<{ item: Item; source: 'inventory' | 'equipment'; slot?: string } | null>(null);
  const [applyingItem, setApplyingItem] = useState<{ craftedItem: CraftedItem; recipeKey: string } | null>(null);
  const [upgradeItem, setUpgradeItem] = useState<{ item: Item; location: 'equipment' | 'inventory'; slot?: string } | null>(null);
  const [reforgeItem, setReforgeItem] = useState<{ item: Item; location: 'equipment' | 'inventory'; slot?: string } | null>(null);
  const [socketItem, setSocketItem] = useState<{ item: Item; location: 'equipment' | 'inventory'; slot?: string } | null>(null);
  const [gemModalState, setGemModalState] = useState<{ item: Item; socket: any; socketIndex: number; mode: 'insert' | 'remove' } | null>(null);
  const [usingSocket, setUsingSocket] = useState<{ socketItem: Item } | null>(null); // When using a Gem Socket item
  const [usingGem, setUsingGem] = useState<{ gem: Item } | null>(null); // When using a Gem item
  

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
  // Separate consumables (potions, scrolls, buffs) from regular gear items
  const consumables = inventoryItems.filter(item => 
    !(item as any).professionItem && 
    ((item as any).type === 'potion' || (item as any).type === 'buff' || (item as any).itemKey)
  );
  // Socket items (can be applied to gear) - check for type: 'socket' or recipeKey: 'gem_socket'
  const socketItems = inventoryItems.filter(item => 
    (item as any).type === 'socket' || ((item as any).recipeKey === 'gem_socket' && (item as any).professionType === 'mining')
  );
  // Gems (ruby, sapphire, emerald, diamond)
  const gems = inventoryItems.filter(item => 
    item.type && ['ruby', 'sapphire', 'emerald', 'diamond'].includes(item.type)
  );
  // Gear items (equipable items that aren't profession items or consumables)
  const regularItems = inventoryItems.filter(item => 
    !(item as any).professionItem && 
    !((item as any).type === 'potion' || (item as any).type === 'buff' || (item as any).itemKey) &&
    !((item as any).type === 'socket') &&
    !((item as any).recipeKey === 'gem_socket') &&
    !(item.type && ['ruby', 'sapphire', 'emerald', 'diamond'].includes(item.type))
  );
  
  // Calculate inventory slots used (count unique item types, not quantities)
  // All items in inventoryItems should be counted (excluding equipped items which are already filtered out)
  
  // Group profession items by recipeKey (includes socket items which have recipeKey: 'gem_socket')
  const professionGroups = new Set<string>();
  professionItems.forEach(item => {
    const key = (item as any).recipeKey || item.id;
    professionGroups.add(key);
  });
  
  // Group consumables by itemKey/name
  const consumableGroups = new Set<string>();
  consumables.forEach(item => {
    const key = (item as any).itemKey || item.name || item.id;
    consumableGroups.add(key);
  });
  
  // Group gems by type + rarity (same type and rarity = same slot, regardless of quantity)
  const gemGroups = new Set<string>();
  gems.forEach(item => {
    const key = `${item.type}_${item.rarity}`;
    gemGroups.add(key);
  });
  
  // Each regular gear item is 1 slot (counted individually)
  // Total count: profession items (grouped) + consumables (grouped) + gems (grouped) + regular items (individual)
  const uniqueSlotCount = professionGroups.size + consumableGroups.size + gemGroups.size + regularItems.length;
  const maxInventorySlots = hero.bankSize || 50;
  
  // Verification: ensure all items are accounted for
  const totalItemsInCategories = professionItems.length + consumables.length + gems.length + regularItems.length;
  if (totalItemsInCategories !== inventoryItems.length) {
    console.warn('⚠️ Item count mismatch!', {
      totalInCategories: totalItemsInCategories,
      totalInInventory: inventoryItems.length,
      profession: professionItems.length,
      consumables: consumables.length,
      gems: gems.length,
      regular: regularItems.length
    });
  }
  
  console.log('⚗️ Profession items:', professionItems.length, 'unique types:', professionGroups.size);
  console.log('🧪 Consumables:', consumables.length, 'unique types:', consumableGroups.size);
  console.log('💎 Gems:', gems.length, 'unique types:', gemGroups.size);
  console.log('⚔️ Regular gear items:', regularItems.length);
  console.log('📦 Total inventory slots used:', uniqueSlotCount, '/', maxInventorySlots);

  return (
    <div className="space-y-6 pb-8">
      {/* Equipment Slots */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-2xl font-bold text-white mb-4">Equipment</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(hero.equipment).map(([slot, item]) => (
            <div
              key={slot}
              className="bg-gray-700 rounded-lg p-2 border-2 border-gray-600 hover:border-purple-500 transition-colors flex flex-col min-h-[200px]"
              onDragOver={handleDragOver}
              onDrop={() => handleDropOnEquipment(slot)}
            >
              <div className="text-sm text-gray-400 mb-2 capitalize font-semibold">{slot}</div>
              
              {item ? (
                <>
                  <div
                    draggable
                    onDragStart={() => handleDragStart(item, 'equipment', slot)}
                    className="cursor-move flex-grow pointer-events-auto"
                  >
                    <ItemTooltip item={item} position="above">
                      <div className="hover:bg-gray-600/30 rounded p-1 -m-1 transition-colors pointer-events-auto flex-grow">
                        <div className={`font-semibold mb-1 text-xs ${getRarityColor(item.rarity)} flex items-center gap-1 leading-tight`}>
                          {(item as any).locked && <span className="text-yellow-400 flex-shrink-0" title="Locked">🔒</span>}
                          <span className="truncate">{item.name}</span>
                          {(item as any).upgradeLevel && (item as any).upgradeLevel > 0 && (
                            <span className="text-amber-400 font-semibold text-[10px] flex-shrink-0">+{(item as any).upgradeLevel}</span>
                          )}
                        </div>
                        
                        <div className="space-y-0.5 text-[10px] mb-2">
                          {item.attack > 0 && <div className="text-red-400">+{item.attack} ATK</div>}
                          {item.defense > 0 && <div className="text-blue-400">+{item.defense} DEF</div>}
                          {item.hp > 0 && <div className="text-green-400">+{item.hp} HP</div>}
                        </div>

                        {/* Sockets Display */}
                        {item.slot && (() => {
                          const maxSockets = (item as any).maxSockets !== undefined ? (item as any).maxSockets : getMaxSockets(item.rarity || 'common', item.slot);
                          const sockets = (item as any).sockets || [];
                          if (maxSockets > 0 || sockets.length > 0) {
                            return (
                              <div className="mb-2 pt-1 border-t border-gray-600">
                                <div className="text-[9px] text-cyan-400 font-semibold mb-1">
                                  Sockets: {sockets.length}/{maxSockets}
                                </div>
                                <div className="flex gap-1 flex-wrap">
                                  {sockets.map((socket: any, idx: number) => (
                                    <div
                                      key={socket.id || idx}
                                      className="relative"
                                      title={socket.gem ? `${socket.gem.type} (${socket.gem.rarity})` : 'Empty Socket'}
                                    >
                                      {socket.gem ? (
                                        <div 
                                          className="w-5 h-5 rounded-full border-2 border-gray-600"
                                          style={{ 
                                            backgroundColor: socket.gem.type === 'ruby' ? '#ef4444' : 
                                                           socket.gem.type === 'sapphire' ? '#3b82f6' : 
                                                           socket.gem.type === 'emerald' ? '#10b981' : '#fbbf24'
                                          }}
                                        />
                                      ) : (
                                        <div className="w-5 h-5 rounded-full border-2 border-gray-500 bg-gray-700" />
                                      )}
                                    </div>
                                  ))}
                                  {/* Show empty socket slots if not at max */}
                                  {sockets.length < maxSockets && Array.from({ length: maxSockets - sockets.length }).map((_, idx) => (
                                    <div key={`empty-${idx}`} className="w-5 h-5 rounded-full border-2 border-dashed border-gray-600 bg-gray-800" title="Empty Socket" />
                                  ))}
                                </div>
                                {/* Show gem stats if any gems are installed */}
                                {sockets.some((s: any) => s.gem) && (
                                  <div className="mt-1 text-[9px] text-gray-400">
                                    {sockets.filter((s: any) => s.gem).map((socket: any, idx: number) => {
                                      const gem = socket.gem;
                                      if (!gem || !gem.stats) return null;
                                      return (
                                        <div key={idx} className="text-[8px]">
                                          {Object.entries(gem.stats).slice(0, 1).map(([stat, value]: [string, any]) => {
                                            if (value === 0 || value === undefined) return null;
                                            const isPercentage = ['critChance', 'critDamage', 'damageReduction', 'xpGain', 'goldGain', 'tokenGain', 'allStats'].includes(stat);
                                            const statLabels: Record<string, string> = {
                                              attack: 'ATK',
                                              defense: 'DEF',
                                              critChance: 'Crit',
                                              critDamage: 'Crit Dmg',
                                              damageReduction: 'DR',
                                              maxHp: 'HP',
                                              allStats: 'All',
                                              xpGain: 'XP',
                                              goldGain: 'Gold',
                                              tokenGain: 'Tokens'
                                            };
                                            return (
                                              <span key={stat} className="mr-1">
                                                +{value}{isPercentage ? '%' : ''} {statLabels[stat] || stat}
                                              </span>
                                            );
                                          })}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return null;
                        })()}

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

                  <div className="flex flex-wrap gap-1 mt-auto pointer-events-auto relative z-20" onClick={(e) => e.stopPropagation()}>
                    {/* Lock/Unlock Button */}
                    {item.id && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          if (!hero.id) return;
                          
                          const isLocked = (item as any).locked;
                          try {
                            if (isLocked) {
                              await heroAPI.unlockEquipment(hero.id, slot);
                            } else {
                              await heroAPI.lockEquipment(hero.id, slot);
                            }
                            if (onUpdate) onUpdate();
                          } catch (error: any) {
                            console.error('Failed to toggle lock:', error);
                            alert(error.response?.data?.error || 'Failed to toggle lock');
                          }
                        }}
                        className={`flex-1 min-w-[40px] text-white text-[10px] py-1 rounded font-semibold transition-colors cursor-pointer ${
                          (item as any).locked
                            ? 'bg-yellow-600 hover:bg-yellow-700'
                            : 'bg-gray-600 hover:bg-gray-700'
                        }`}
                        title={(item as any).locked ? 'Unlock item (prevent auto-sell/replace)' : 'Lock item (prevent auto-sell/replace)'}
                      >
                        {(item as any).locked ? '🔒' : '🔓'}
                      </button>
                    )}
                    {onUpgradeItem && item.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setUpgradeItem({ item, location: 'equipment', slot });
                        }}
                        disabled={(item.upgradeLevel || 0) >= 2}
                        className={`flex-1 min-w-[55px] text-white text-[10px] py-1 rounded font-semibold transition-colors ${
                          (item.upgradeLevel || 0) >= 2
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-amber-600 hover:bg-amber-700 cursor-pointer'
                        }`}
                        title={(item.upgradeLevel || 0) >= 2 ? 'Item is fully upgraded (+2)' : 'Upgrade item'}
                      >
                        {(item.upgradeLevel || 0) >= 2 ? 'Max' : 'Up'}
                      </button>
                    )}
                    {isRarePlus(item.rarity) && item.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setReforgeItem({ item, location: 'equipment', slot });
                        }}
                        className="flex-1 min-w-[55px] bg-purple-600 hover:bg-purple-700 text-white text-[10px] py-1 rounded font-semibold transition-colors cursor-pointer"
                        title="Reforge item (reroll stats)"
                      >
                        Ref
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleUnequip(slot);
                      }}
                      disabled={(item as any).locked}
                      className={`flex-1 min-w-[55px] text-white text-[10px] py-1 rounded font-semibold transition-colors ${
                        (item as any).locked
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-red-600 hover:bg-red-700 cursor-pointer'
                      }`}
                      title={(item as any).locked ? 'Cannot unequip locked item' : 'Unequip item'}
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-white">Inventory</h3>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-gray-400">Space: </span>
              <span className={`font-semibold ${uniqueSlotCount >= maxInventorySlots ? 'text-red-400' : 'text-white'}`}>
                {uniqueSlotCount} / {maxInventorySlots}
              </span>
            </div>
            {(maxInventorySlots < 500) && (
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    const currentBankSize = maxInventorySlots;
                    const slotsToAdd = 15;
                    const totalCost = 750; // 50g per slot * 15 slots
                    
                    if (!hero.id) {
                      alert('Hero ID not found');
                      return;
                    }

                    if ((hero.gold || 0) < totalCost) {
                      alert(`Not enough gold! You need ${totalCost}g to expand by ${slotsToAdd} slots (you have ${hero.gold || 0}g)`);
                      return;
                    }

                    if (currentBankSize + slotsToAdd > 500) {
                      alert(`Maximum bank size is 500 slots. You can only add ${500 - currentBankSize} more slots.`);
                      return;
                    }

                    const confirm = window.confirm(
                      `Expand storage by ${slotsToAdd} slots?\n\n` +
                      `Current: ${currentBankSize} slots\n` +
                      `After: ${currentBankSize + slotsToAdd} slots\n` +
                      `Cost: ${totalCost}g\n\n` +
                      `You will have ${(hero.gold || 0) - totalCost}g remaining.`
                    );

                    if (!confirm) return;

                    try {
                      await heroAPI.expandStorage(hero.id, slotsToAdd, 'gold');
                      alert(`✅ Expanded storage by ${slotsToAdd} slots! (${currentBankSize} → ${currentBankSize + slotsToAdd})`);
                      if (onUpdate) onUpdate();
                    } catch (error: any) {
                      console.error('Failed to expand storage:', error);
                      alert(error.response?.data?.error || 'Failed to expand storage');
                    }
                  }}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded font-semibold text-sm transition-colors flex items-center gap-2"
                >
                  <span>💰</span>
                  <span>+15 Slots (750g)</span>
                </button>
                <button
                  onClick={async () => {
                    const currentBankSize = maxInventorySlots;
                    const slotsToAdd = 15;
                    const totalCost = 50; // 50 tokens for 15 slots
                    
                    if (!hero.id) {
                      alert('Hero ID not found');
                      return;
                    }

                    if ((hero.tokens || 0) < totalCost) {
                      alert(`Not enough tokens! You need ${totalCost}t to expand by ${slotsToAdd} slots (you have ${hero.tokens || 0}t)`);
                      return;
                    }

                    if (currentBankSize + slotsToAdd > 500) {
                      alert(`Maximum bank size is 500 slots. You can only add ${500 - currentBankSize} more slots.`);
                      return;
                    }

                    const confirm = window.confirm(
                      `Expand storage by ${slotsToAdd} slots?\n\n` +
                      `Current: ${currentBankSize} slots\n` +
                      `After: ${currentBankSize + slotsToAdd} slots\n` +
                      `Cost: ${totalCost}t\n\n` +
                      `You will have ${(hero.tokens || 0) - totalCost}t remaining.`
                    );

                    if (!confirm) return;

                    try {
                      await heroAPI.expandStorage(hero.id, slotsToAdd, 'tokens');
                      alert(`✅ Expanded storage by ${slotsToAdd} slots! (${currentBankSize} → ${currentBankSize + slotsToAdd})`);
                      if (onUpdate) onUpdate();
                    } catch (error: any) {
                      console.error('Failed to expand storage:', error);
                      alert(error.response?.data?.error || 'Failed to expand storage');
                    }
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded font-semibold text-sm transition-colors flex items-center gap-2"
                >
                  <span>💎</span>
                  <span>+15 Slots (50t)</span>
                </button>
              </div>
            )}
          </div>
        </div>
        
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
                          
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* Socket Items Section */}
            {socketItems.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-cyan-400 mb-3">
                  🔧 Socket Items ({socketItems.length})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {(() => {
                    // Group socket items by type (they should stack)
                    const groupedSockets: Record<string, any[]> = {};
                    socketItems.forEach(item => {
                      const key = 'socket'; // All socket items are the same type
                      if (!groupedSockets[key]) {
                        groupedSockets[key] = [];
                      }
                      groupedSockets[key].push(item);
                    });

                    return Object.entries(groupedSockets).map(([key, items]) => {
                      const firstItem = items[0];
                      const totalQuantity = items.reduce((sum, item) => sum + ((item as any).quantity || 1), 0);
                      return (
                        <div
                          key={key}
                          className="rounded-lg p-3 border-2 border-cyan-500 bg-cyan-900/20 hover:border-cyan-400 transition-all"
                        >
                          <div className="font-semibold text-white text-sm mb-1">{firstItem.name || 'Gem Socket'}</div>
                          <div className="text-xs text-cyan-300 mb-2">Adds a socket to gear</div>
                          {totalQuantity > 1 && (
                            <div className="text-xs bg-cyan-800 px-1.5 py-0.5 rounded text-cyan-300 font-semibold mb-2 inline-block">
                              x{totalQuantity}
                            </div>
                          )}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setUsingSocket({ socketItem: firstItem });
                            }}
                            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-1.5 rounded text-xs font-semibold transition-colors"
                          >
                            Use
                          </button>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* Gems Section */}
            {gems.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-yellow-400 mb-3">
                  💎 Gems ({gems.length})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {(() => {
                    // Group gems by type and rarity (they should stack)
                    const groupedGems: Record<string, any[]> = {};
                    gems.forEach(item => {
                      const key = `${item.type}_${item.rarity}`;
                      if (!groupedGems[key]) {
                        groupedGems[key] = [];
                      }
                      groupedGems[key].push(item);
                    });

                    return Object.entries(groupedGems).map(([key, items]) => {
                      const firstItem = items[0];
                      const totalQuantity = items.reduce((sum, item) => sum + ((item as any).quantity || 1), 0);
                      const gemColor = (firstItem as any).color || '#ffffff';
                      return (
                        <div
                          key={key}
                          className="rounded-lg p-3 border-2 border-yellow-500 bg-yellow-900/20 hover:border-yellow-400 transition-all"
                          style={{ borderColor: gemColor }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: gemColor }}
                            />
                            <div className="font-semibold text-white text-sm">{firstItem.name || `${firstItem.type} Gem`}</div>
                          </div>
                          {totalQuantity > 1 && (
                            <div className="text-xs bg-yellow-800 px-1.5 py-0.5 rounded text-yellow-300 font-semibold mb-2 inline-block">
                              x{totalQuantity}
                            </div>
                          )}
                          {(firstItem as any).stats && (
                            <div className="text-xs text-gray-300 mb-2 line-clamp-2">
                              {Object.entries((firstItem as any).stats).slice(0, 2).map(([stat, value]: [string, any]) => {
                                const isPercentage = ['critChance', 'critDamage', 'damageReduction', 'xpGain', 'goldGain', 'tokenGain', 'allStats'].includes(stat);
                                return `+${value}${isPercentage ? '%' : ''} ${stat}`;
                              }).join(', ')}
                            </div>
                          )}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setUsingGem({ gem: firstItem });
                            }}
                            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-1.5 rounded text-xs font-semibold transition-colors"
                          >
                            Use
                          </button>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* Consumables Section (Potions, Scrolls, Buffs) */}
            {consumables.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-green-400 mb-3">
                  🧪 Consumables ({consumables.length})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {(() => {
                    // Group consumables by itemKey/name
                    const groupedConsumables: Record<string, any[]> = {};
                    consumables.forEach(item => {
                      const key = (item as any).itemKey || item.name || item.id;
                      if (!groupedConsumables[key]) {
                        groupedConsumables[key] = [];
                      }
                      groupedConsumables[key].push(item);
                    });

                    return Object.entries(groupedConsumables).map(([key, items]) => {
                      const firstItem = items[0];
                      const totalQuantity = items.length;
                      const itemType = (firstItem as any).type || 'consumable';
                      const itemName = firstItem.name || 'Unknown Item';
                      const itemKey = (firstItem as any).itemKey || key;

                      return (
                        <div
                          key={key}
                          className="rounded-lg p-3 border-2 border-green-500 bg-green-900/20 hover:border-green-400 transition-all"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="text-xl">
                              {itemType === 'potion' ? '🧪' : '📜'}
                            </div>
                            {totalQuantity > 1 && (
                              <div className="text-xs bg-green-800 px-1.5 py-0.5 rounded text-green-300 font-semibold">
                                x{totalQuantity}
                              </div>
                            )}
                          </div>
                          
                          <div className="font-semibold text-white text-sm mb-1 line-clamp-2">{itemName}</div>
                          
                          {(firstItem as any).effect && (
                            <div className="text-xs text-green-300 mb-2 line-clamp-2">
                              {(firstItem as any).effect}
                            </div>
                          )}
                          
                          {(firstItem as any).duration && (
                            <div className="text-xs text-gray-400 mb-2">
                              Duration: {Math.floor((firstItem as any).duration / 1000 / 60)}min
                            </div>
                          )}
                          
                          {/* Items are auto-used during combat - no manual use needed */}
                          <button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              const sellValue = (firstItem as any).cost ? Math.floor((firstItem as any).cost * 0.5) : 5;
                              const confirmMsg = totalQuantity > 1 
                                ? `Sell all ${totalQuantity}x ${itemName} for ${sellValue * totalQuantity}g?`
                                : `Sell ${itemName} for ${sellValue}g?`;
                              
                              if (!window.confirm(confirmMsg)) return;
                              
                              try {
                                // Remove all items of this type from inventory
                                const updatedInventory = (hero.inventory || []).filter(
                                  invItem => {
                                    const invKey = (invItem as any).itemKey || invItem.name || invItem.id;
                                    return invKey !== key;
                                  }
                                );
                                
                                const goldGain = sellValue * totalQuantity;
                                
                                if (hero.id) {
                                  await heroAPI.updateHero(hero.id, {
                                    inventory: updatedInventory,
                                    gold: (hero.gold || 0) + goldGain
                                  });
                                  alert(`✅ Sold ${totalQuantity}x ${itemName} for ${goldGain}g!`);
                                  if (onUpdate) onUpdate();
                                }
                              } catch (error: any) {
                                console.error('Failed to sell item:', error);
                                alert(error.response?.data?.error || 'Failed to sell item');
                              }
                            }}
                            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-1.5 rounded text-xs font-semibold transition-colors"
                            title={`Sell for ${(firstItem as any).cost ? Math.floor((firstItem as any).cost * 0.5) : 5}g each`}
                          >
                            Sell
                          </button>
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
                      className={`${getRarityBg(item.rarity)} rounded-lg p-2 border-2 cursor-pointer hover:scale-105 transition-transform hover:border-blue-400 relative flex flex-col min-h-[180px]`}
                    >
                      <ItemTooltip item={item}>
                        <div className="hover:brightness-110 transition-all pointer-events-none flex-grow">
                          <div className={`font-semibold text-xs mb-1 ${getRarityColor(item.rarity)} flex items-center gap-1 leading-tight`}>
                            <span className="truncate">{item.name}</span>
                            {(item as any).upgradeLevel && (item as any).upgradeLevel > 0 && (
                              <span className="text-amber-400 font-semibold text-[10px] flex-shrink-0">+{(item as any).upgradeLevel}</span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-400 capitalize mb-1">{item.slot}</div>
                          <div className="space-y-0.5 text-[10px] mb-1">
                            {item.attack > 0 && <div className="text-red-400">+{item.attack} ATK</div>}
                            {item.defense > 0 && <div className="text-blue-400">+{item.defense} DEF</div>}
                            {item.hp > 0 && <div className="text-green-400">+{item.hp} HP</div>}
                          </div>
                          {item.slot && (
                            <div className="flex flex-wrap gap-1 pointer-events-auto relative z-20 mt-auto pt-1">
                              {onUpgradeItem && item.id && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setUpgradeItem({ item, location: 'inventory' });
                                  }}
                                  disabled={(item.upgradeLevel || 0) >= 2}
                                  className={`flex-1 min-w-[60px] text-white text-[10px] py-1 rounded font-semibold transition-colors cursor-pointer ${
                                    (item.upgradeLevel || 0) >= 2
                                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                      : 'bg-amber-600 hover:bg-amber-700'
                                  }`}
                                  title={(item.upgradeLevel || 0) >= 2 ? 'Item is fully upgraded (+2)' : 'Upgrade item'}
                                >
                                  {(item.upgradeLevel || 0) >= 2 ? 'Max' : 'Up'}
                                </button>
                              )}
                              {isRarePlus(item.rarity) && item.id && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setReforgeItem({ item, location: 'inventory' });
                                  }}
                                  className="flex-1 min-w-[60px] bg-purple-600 hover:bg-purple-700 text-white text-[10px] py-1 rounded font-semibold transition-colors cursor-pointer"
                                  title="Reforge item (reroll stats)"
                                >
                                  Ref
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  if (onEquipChange && item.slot) {
                                    console.log('Equipping item:', item.name, 'to slot:', item.slot);
                                    onEquipChange(item.slot, item);
                                  } else {
                                    console.error('Cannot equip: missing slot or onEquipChange handler', { slot: item.slot, hasHandler: !!onEquipChange });
                                  }
                                }}
                                className={`flex-1 min-w-[60px] bg-blue-600 hover:bg-blue-700 text-white text-[10px] py-1 rounded font-semibold transition-colors cursor-pointer`}
                              >
                                Equip
                              </button>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  // Calculate sell value: 25% of item value * rarity multiplier
                                  const itemValue = item.attack + item.defense + item.hp;
                                  const rarityMult: Record<string, number> = { 
                                    common: 1, 
                                    uncommon: 1.3, 
                                    rare: 2, 
                                    epic: 3, 
                                    legendary: 4,
                                    mythic: 5
                                  };
                                  const multiplier = rarityMult[item.rarity] || 1;
                                  const sellValue = Math.floor(itemValue * multiplier * 0.25);
                                  
                                  if (!window.confirm(`Sell ${item.name} for ${sellValue}g?`)) return;
                                  
                                  try {
                                    const updatedInventory = (hero.inventory || []).filter(invItem => invItem.id !== item.id);
                                    
                                    if (hero.id) {
                                      await heroAPI.updateHeroById(hero.id, {
                                        inventory: updatedInventory,
                                        gold: (hero.gold || 0) + sellValue
                                      });
                                      alert(`✅ Sold ${item.name} for ${sellValue}g!`);
                                      if (onUpdate) onUpdate();
                                    }
                                  } catch (error: any) {
                                    console.error('Failed to sell item:', error);
                                    alert(error.response?.data?.error || 'Failed to sell item');
                                  }
                                }}
                                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs py-1.5 rounded font-semibold transition-colors"
                                title="Sell item for gold"
                              >
                                Sell
                              </button>
                            </div>
                          )}
                          {!item.slot && (
                            <div className="flex gap-2">
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const itemValue = item.attack + item.defense + item.hp;
                                  const rarityMult: Record<string, number> = { 
                                    common: 1, 
                                    uncommon: 1.3, 
                                    rare: 2, 
                                    epic: 3, 
                                    legendary: 4,
                                    mythic: 5
                                  };
                                  const multiplier = rarityMult[item.rarity] || 1;
                                  const sellValue = Math.floor(itemValue * multiplier * 0.25);
                                  
                                  if (!window.confirm(`Sell ${item.name} for ${sellValue}g?`)) return;
                                  
                                  try {
                                    const updatedInventory = (hero.inventory || []).filter(invItem => invItem.id !== item.id);
                                    
                                    if (hero.id) {
                                      await heroAPI.updateHeroById(hero.id, {
                                        inventory: updatedInventory,
                                        gold: (hero.gold || 0) + sellValue
                                      });
                                      alert(`✅ Sold ${item.name} for ${sellValue}g!`);
                                      if (onUpdate) onUpdate();
                                    }
                                  } catch (error: any) {
                                    console.error('Failed to sell item:', error);
                                    alert(error.response?.data?.error || 'Failed to sell item');
                                  }
                                }}
                                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white text-xs py-1.5 rounded font-semibold transition-colors"
                              >
                                Sell
                              </button>
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
                .map(([slot, item]) => {
                  // Check if item already has upgrades/enchantments applied
                  const hasAppliedUpgrades = item.appliedUpgrades && item.appliedUpgrades.length > 0;
                  
                  // Get recipe names for applied upgrades
                  const getRecipeName = (recipeKey: string): string => {
                    const allRecipes = { ...MINING_RECIPES, ...HERBALISM_RECIPES, ...ENCHANTING_RECIPES };
                    const recipe = allRecipes[recipeKey as keyof typeof allRecipes];
                    return recipe?.name || recipeKey.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                  };
                  
                  return (
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
                      {/* Show applied upgrades/enchantments */}
                      {hasAppliedUpgrades && (
                        <div className="mt-2 pt-2 border-t border-gray-600">
                          <div className="text-xs text-gray-400 mb-1">Applied:</div>
                          {item.appliedUpgrades!.map((upgrade: any, idx: number) => (
                            <div key={idx} className="text-xs text-orange-400 font-semibold">
                              ⚙️ {getRecipeName(upgrade.recipeKey || upgrade.itemId)}
                            </div>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
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

      {/* Upgrade Modal */}
      {/* Reforge Modal */}
      {reforgeItem && hero.id && (
        <ReforgeModal
          item={reforgeItem.item}
          currentGold={hero.gold || 0}
          userId={hero.id}
          onClose={() => setReforgeItem(null)}
          onReforge={async (heroId: string, itemId: string) => {
            try {
              const result = await heroAPI.reforgeItem(heroId, itemId);
              if (result.success) {
                alert(`✅ ${result.message || 'Item reforged!'}`);
                setReforgeItem(null);
                if (onUpdate) onUpdate();
              }
            } catch (error: any) {
              throw error; // Re-throw to let modal handle error display
            }
          }}
        />
      )}

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

      {/* Socket Modal */}
      {socketItem && hero.id && userId && (
        <SocketModal
          item={socketItem.item}
          heroId={hero.id}
          userId={userId}
          location={socketItem.location}
          slot={socketItem.slot}
          socketItems={socketItems}
          onClose={() => setSocketItem(null)}
          onUpdate={() => {
            if (onUpdate) onUpdate();
          }}
        />
      )}

      {/* Gem Modal */}
      {gemModalState && hero.id && userId && (
        <GemModal
          item={gemModalState.item}
          socket={gemModalState.socket}
          socketIndex={gemModalState.socketIndex}
          heroId={hero.id}
          userId={userId}
          gems={gems}
          onClose={() => setGemModalState(null)}
          onUpdate={() => {
            if (onUpdate) onUpdate();
          }}
          mode={gemModalState.mode}
        />
      )}

      {/* Use Socket Item Modal - Select which item to socket */}
      {usingSocket && hero.id && userId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-2xl w-full border border-gray-700 p-6">
            <h3 className="text-2xl font-bold text-white mb-4">
              Use {usingSocket.socketItem.name || 'Gem Socket'}
            </h3>
            <p className="text-gray-400 mb-6">Select which piece of equipment to add a socket to:</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6 max-h-[500px] overflow-y-auto">
              {/* Equipment items */}
              {Object.entries(hero.equipment)
                .filter(([slot, item]) => {
                  if (!item || !item.slot) return false;
                  const maxSockets = item.maxSockets !== undefined ? item.maxSockets : getMaxSockets(item.rarity || 'common', item.slot);
                  const currentSockets = item.sockets || [];
                  return currentSockets.length < maxSockets && maxSockets > 0;
                })
                .map(([slot, item]) => {
                  const maxSockets = item.maxSockets !== undefined ? item.maxSockets : getMaxSockets(item.rarity || 'common', item.slot);
                  const currentSockets = item.sockets || [];
                  return (
                    <button
                      key={slot}
                      onClick={async () => {
                        try {
                          await heroAPI.applySocket(userId, hero.id, item.id, usingSocket.socketItem.id, slot);
                          if (onUpdate) onUpdate();
                          setUsingSocket(null);
                          alert('✅ Socket added successfully!');
                        } catch (error: any) {
                          alert(error.response?.data?.error || 'Failed to apply socket');
                        }
                      }}
                      className="bg-gray-800 hover:bg-gray-700 border-2 border-gray-600 hover:border-cyan-500 rounded-lg p-4 text-left transition-colors"
                    >
                      <div className="text-sm text-gray-400 capitalize mb-1">{slot} (Equipped)</div>
                      <div className={`font-semibold ${getRarityColor(item.rarity)}`}>
                        {item.name}
                      </div>
                      <div className="text-xs text-cyan-400 mt-2">
                        Sockets: {currentSockets.length} / {maxSockets}
                      </div>
                    </button>
                  );
                })}
              
              {/* Inventory items with slots */}
              {regularItems
                .filter((item: any) => {
                  if (!item.slot) return false;
                  const maxSockets = item.maxSockets !== undefined ? item.maxSockets : getMaxSockets(item.rarity || 'common', item.slot);
                  const currentSockets = item.sockets || [];
                  return currentSockets.length < maxSockets && maxSockets > 0;
                })
                .map((item: any) => {
                  const maxSockets = item.maxSockets !== undefined ? item.maxSockets : getMaxSockets(item.rarity || 'common', item.slot);
                  const currentSockets = item.sockets || [];
                  return (
                    <button
                      key={item.id}
                      onClick={async () => {
                        try {
                          await heroAPI.applySocket(userId, hero.id, item.id, usingSocket.socketItem.id);
                          if (onUpdate) onUpdate();
                          setUsingSocket(null);
                          alert('✅ Socket added successfully!');
                        } catch (error: any) {
                          alert(error.response?.data?.error || 'Failed to apply socket');
                        }
                      }}
                      className="bg-gray-800 hover:bg-gray-700 border-2 border-gray-600 hover:border-cyan-500 rounded-lg p-4 text-left transition-colors"
                    >
                      <div className="text-sm text-gray-400 capitalize mb-1">{item.slot} (Inventory)</div>
                      <div className={`font-semibold ${getRarityColor(item.rarity)}`}>
                        {item.name}
                      </div>
                      <div className="text-xs text-cyan-400 mt-2">
                        Sockets: {currentSockets.length} / {maxSockets}
                      </div>
                    </button>
                  );
                })}
              
              {Object.entries(hero.equipment).filter(([slot, item]) => {
                if (!item || !item.slot) return false;
                const maxSockets = item.maxSockets !== undefined ? item.maxSockets : getMaxSockets(item.rarity || 'common', item.slot);
                const currentSockets = item.sockets || [];
                return currentSockets.length < maxSockets && maxSockets > 0;
              }).length === 0 && regularItems.filter((item: any) => {
                if (!item.slot) return false;
                const maxSockets = item.maxSockets !== undefined ? item.maxSockets : getMaxSockets(item.rarity || 'common', item.slot);
                const currentSockets = item.sockets || [];
                return currentSockets.length < maxSockets && maxSockets > 0;
              }).length === 0 && (
                <div className="col-span-2 text-center text-gray-400 py-4">
                  No items available that can have sockets added. Items must be Rare or higher to support sockets.
                </div>
              )}
            </div>

            <button
              onClick={() => setUsingSocket(null)}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Use Gem Modal - Select which socket to insert gem into */}
      {usingGem && hero.id && userId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-2xl w-full border border-gray-700 p-6">
            <h3 className="text-2xl font-bold text-white mb-4">
              Use {usingGem.gem.name || 'Gem'}
            </h3>
            <p className="text-gray-400 mb-6">Select which socket to insert this gem into:</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6 max-h-[500px] overflow-y-auto">
              {/* Equipment items with empty sockets */}
              {Object.entries(hero.equipment)
                .filter(([slot, item]) => {
                  if (!item || !item.sockets) return false;
                  return item.sockets.some((s: any) => !s.gem);
                })
                .map(([slot, item]) => {
                  return item.sockets
                    .filter((s: any) => !s.gem)
                    .map((socket: any, socketIdx: number) => (
                      <button
                        key={`${slot}-${socket.id || socketIdx}`}
                        onClick={async () => {
                          try {
                            await heroAPI.insertGem(userId, hero.id, item.id, socket.id, usingGem.gem.id);
                            if (onUpdate) onUpdate();
                            setUsingGem(null);
                            alert('✅ Gem inserted successfully!');
                          } catch (error: any) {
                            alert(error.response?.data?.error || 'Failed to insert gem');
                          }
                        }}
                        className="bg-gray-800 hover:bg-gray-700 border-2 border-gray-600 hover:border-yellow-500 rounded-lg p-4 text-left transition-colors"
                      >
                        <div className="text-sm text-gray-400 capitalize mb-1">{slot} - Socket {socketIdx + 1} (Equipped)</div>
                        <div className={`font-semibold ${getRarityColor(item.rarity)}`}>
                          {item.name}
                        </div>
                        <div className="text-xs text-yellow-400 mt-2">Empty Socket</div>
                      </button>
                    ));
                })
                .flat()}
              
              {/* Inventory items with empty sockets */}
              {regularItems
                .filter((item: any) => item.sockets && item.sockets.some((s: any) => !s.gem))
                .map((item: any) => {
                  return item.sockets
                    .filter((s: any) => !s.gem)
                    .map((socket: any, socketIdx: number) => (
                      <button
                        key={`${item.id}-${socket.id || socketIdx}`}
                        onClick={async () => {
                          try {
                            await heroAPI.insertGem(userId, hero.id, item.id, socket.id, usingGem.gem.id);
                            if (onUpdate) onUpdate();
                            setUsingGem(null);
                            alert('✅ Gem inserted successfully!');
                          } catch (error: any) {
                            alert(error.response?.data?.error || 'Failed to insert gem');
                          }
                        }}
                        className="bg-gray-800 hover:bg-gray-700 border-2 border-gray-600 hover:border-yellow-500 rounded-lg p-4 text-left transition-colors"
                      >
                        <div className="text-sm text-gray-400 capitalize mb-1">{item.slot} - Socket {socketIdx + 1} (Inventory)</div>
                        <div className={`font-semibold ${getRarityColor(item.rarity)}`}>
                          {item.name}
                        </div>
                        <div className="text-xs text-yellow-400 mt-2">Empty Socket</div>
                      </button>
                    ));
                })
                .flat()}
              
              {Object.entries(hero.equipment).filter(([slot, item]) => {
                if (!item || !item.sockets) return false;
                return item.sockets.some((s: any) => !s.gem);
              }).flatMap(([slot, item]) => item.sockets.filter((s: any) => !s.gem)).length === 0 &&
                regularItems.filter((item: any) => item.sockets && item.sockets.some((s: any) => !s.gem)).flatMap((item: any) => item.sockets.filter((s: any) => !s.gem)).length === 0 && (
                <div className="col-span-2 text-center text-gray-400 py-4">
                  No empty sockets available. Add sockets to your items first, or remove existing gems to make room.
                </div>
              )}
            </div>

            <button
              onClick={() => setUsingGem(null)}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
