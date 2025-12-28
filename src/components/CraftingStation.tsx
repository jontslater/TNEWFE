import { useState } from 'react';
import { Hero } from '../types/Hero';
import { HERBALISM_RECIPES, MINING_RECIPES, ENCHANTING_RECIPES } from '../api/mock-data';

interface CraftingStationProps {
  hero: Hero;
  onChooseProfession: (profession: 'herbalism' | 'mining' | 'enchanting') => void;
  onCraft: (recipeKey: string, cost: any, tier: number, quantity: number) => void;
  onUse: (itemKey: string) => void;
}

export default function CraftingStation({ hero, onChooseProfession, onCraft, onUse }: CraftingStationProps) {
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);
  const [recipeQuantities, setRecipeQuantities] = useState<Record<string, number>>({}); // recipeKey -> quantity
  const [selectedProfession, setSelectedProfession] = useState<'herbalism' | 'mining' | 'enchanting' | null>(null);
  const [showChangeProfession, setShowChangeProfession] = useState(false);
  
  // Helper to get quantity for a recipe (defaults to 1)
  const getQuantity = (recipeKey: string) => recipeQuantities[recipeKey] || 1;
  const setQuantity = (recipeKey: string, quantity: number) => {
    setRecipeQuantities(prev => ({ ...prev, [recipeKey]: Math.max(1, quantity) }));
  };

  // Profession details
  const professionDetails = {
    herbalism: {
      icon: '🌿',
      name: 'Herbalism',
      color: 'green',
      description: 'Craft elixirs, potions, and flasks for powerful temporary buffs',
      crafts: ['Health/Strength/Defense Elixirs', 'Haste & Clarity Potions', 'Death-proof Flasks'],
      bestFor: 'Temporary power boosts, raid progression, solo players'
    },
    mining: {
      icon: '⛏️',
      name: 'Mining',
      color: 'orange',
      description: 'Forge permanent upgrades to weapons and armor, socket gems',
      crafts: ['Permanent Armor Upgrades', 'Weapon Sharpening', 'Gem Socketing'],
      bestFor: 'Permanent progression, min-maxing, long-term power gains'
    },
    enchanting: {
      icon: '✨',
      name: 'Enchanting',
      color: 'purple',
      description: 'Imbue gear with magical effects and create powerful runes',
      crafts: ['Permanent Gear Enchantments', 'Powerful Temporary Runes', 'Disenchant for Essence'],
      bestFor: 'Unique effects, customization, advanced players'
    }
  };

  const handleConfirmProfession = () => {
    if (!selectedProfession) return;
    
    if (hero.profession && !showChangeProfession) {
      // Already has a profession, confirm change
      if (window.confirm(`Are you sure you want to change from ${hero.profession.type} to ${selectedProfession}? You will lose all ${hero.profession.type} progress!`)) {
        onChooseProfession(selectedProfession);
        setShowChangeProfession(false);
      }
    } else {
      // First time choosing
      onChooseProfession(selectedProfession);
    }
  };

  // If no profession, show selection UI
  if (!hero.profession || showChangeProfession) {
    return (
      <div className="space-y-6">
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-white mb-2">
              {hero.profession ? 'Change Profession' : 'Choose Your Profession'}
            </h3>
            <p className="text-gray-400">
              {hero.profession 
                ? 'Warning: Changing professions will reset all progress!'
                : 'Click a profession to view details, then confirm your choice below'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {Object.entries(professionDetails).map(([key, details]) => (
              <div
                key={key}
                onClick={() => setSelectedProfession(key as any)}
                className={`bg-gradient-to-br from-${details.color}-900 to-gray-900 rounded-lg p-6 border-2 cursor-pointer transition-all transform hover:scale-105 ${
                  selectedProfession === key 
                    ? `border-${details.color}-400 ring-2 ring-${details.color}-500` 
                    : `border-${details.color}-600 hover:border-${details.color}-400`
                }`}
              >
                <div className="text-5xl mb-3 text-center">{details.icon}</div>
                <h4 className="text-2xl font-bold text-center mb-3" style={{ color: `var(--${details.color}-400)` }}>
                  {details.name}
                </h4>
                <p className="text-gray-300 text-sm mb-4 min-h-12">
                  {details.description}
                </p>
                {selectedProfession === key && (
                  <div className="bg-gray-900/50 rounded p-3 text-xs space-y-1 text-gray-300">
                    <div className="font-semibold text-white mb-1">Crafts:</div>
                    {details.crafts.map((craft, idx) => (
                      <div key={idx}>• {craft}</div>
                    ))}
                    <div className="font-semibold text-white mt-2">Best For:</div>
                    <div>{details.bestFor}</div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {selectedProfession && (
            <div className="text-center">
              <button
                onClick={handleConfirmProfession}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-xl px-12 py-4 rounded-lg font-bold transition-all transform hover:scale-105"
              >
                {hero.profession ? `Switch to ${professionDetails[selectedProfession].name}` : `Choose ${professionDetails[selectedProfession].name}`}
              </button>
              {showChangeProfession && (
                <button
                  onClick={() => setShowChangeProfession(false)}
                  className="ml-4 bg-gray-600 hover:bg-gray-700 text-white px-8 py-4 rounded-lg font-bold transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>

        {hero.profession && !showChangeProfession && (
          <div className="text-center">
            <button
              onClick={() => setShowChangeProfession(true)}
              className="text-gray-400 hover:text-white transition-colors text-sm underline"
            >
              Want to change professions?
            </button>
          </div>
        )}
      </div>
    );
  }

  const profession = hero.profession;
  const xpPercent = (Math.floor(profession.xp) / Math.floor(profession.maxXp)) * 100;

  const handleChangeProfession = () => {
    setShowChangeProfession(true);
    setSelectedProfession(null);
  };

  // Drag handlers for materials
  const handleMaterialDragStart = (material: string, amount: number) => {
    // Could implement drag-drop for materials to crafting slots
  };

  const handleCraftingSlotDrop = (slot: number) => {
    // Future: handle material drops
  };

  return (
    <div className="space-y-6">
      {/* Profession Header */}
      <div className="bg-gradient-to-br from-green-900 to-gray-800 rounded-lg p-6 shadow-lg border border-green-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white capitalize">{profession.type}</h2>
            <div className="text-green-400 mt-1">Level {profession.level}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Total Gathered</div>
            <div className="text-2xl font-bold text-white">{profession.totalGathered}</div>
            <button
              onClick={handleChangeProfession}
              className="mt-2 text-xs text-gray-400 hover:text-white transition-colors underline"
            >
              Change Profession
            </button>
          </div>
        </div>

        {/* XP Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Experience</span>
            <span className="text-white">{Math.floor(profession.xp)} / {Math.floor(profession.maxXp)}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Materials Inventory */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">Materials</h3>
        
        <div className="space-y-6">
          {/* Herbalism Materials */}
          {profession.materials.herbs && (
            <div>
              <h4 className="text-sm font-semibold text-gray-400 mb-3">Herbalism</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-3xl mb-2">🌿</div>
                  <div className="text-sm text-gray-400">Common Herbs</div>
                  <div className="text-2xl font-bold text-green-400">{profession.materials.herbs.common}</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-3xl mb-2">🍀</div>
                  <div className="text-sm text-gray-400">Uncommon Herbs</div>
                  <div className="text-2xl font-bold text-blue-400">{profession.materials.herbs.uncommon}</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-3xl mb-2">🌸</div>
                  <div className="text-sm text-gray-400">Rare Herbs</div>
                  <div className="text-2xl font-bold text-purple-400">{profession.materials.herbs.rare}</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-3xl mb-2">🌺</div>
                  <div className="text-sm text-gray-400">Epic Herbs</div>
                  <div className="text-2xl font-bold text-yellow-400">{profession.materials.herbs.epic}</div>
                </div>
              </div>
            </div>
          )}

          {/* Mining Materials */}
          {profession.materials.ore && (
            <div>
              <h4 className="text-sm font-semibold text-gray-400 mb-3">Mining</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-3xl mb-2">⚙️</div>
                  <div className="text-sm text-gray-400">Iron Ore</div>
                  <div className="text-2xl font-bold text-gray-400">{profession.materials.ore.iron}</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-3xl mb-2">🔩</div>
                  <div className="text-sm text-gray-400">Steel</div>
                  <div className="text-2xl font-bold text-blue-400">{profession.materials.ore.steel}</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-3xl mb-2">✨</div>
                  <div className="text-sm text-gray-400">Mithril</div>
                  <div className="text-2xl font-bold text-purple-400">{profession.materials.ore.mithril}</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-3xl mb-2">💎</div>
                  <div className="text-sm text-gray-400">Adamantite</div>
                  <div className="text-2xl font-bold text-yellow-400">{profession.materials.ore.adamantite}</div>
                </div>
              </div>
            </div>
          )}

          {/* Enchanting Materials */}
          {profession.materials.essence !== undefined && (
            <div>
              <h4 className="text-sm font-semibold text-gray-400 mb-3">Enchanting</h4>
              <div className="flex justify-center">
                <div className="bg-gray-700 rounded-lg p-6 text-center w-64">
                  <div className="text-5xl mb-2">✨</div>
                  <div className="text-sm text-gray-400">Arcane Essence</div>
                  <div className="text-3xl font-bold text-purple-400">{profession.materials.essence}</div>
                  <div className="text-xs text-gray-500 mt-2">
                    Gathered from defeated enemies
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recipe Browser */}
      {profession && profession.type && (
      <>
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">
          {profession.type === 'herbalism' ? 'Elixir Recipes' : profession.type === 'mining' ? 'Upgrade Recipes' : 'Enchantment Recipes'}
        </h3>
        
        {/* Herbalism Recipes */}
        {profession.type === 'herbalism' && (() => {
          // Group recipes by tier
          const recipesByTier: Record<number, Array<[string, any]>> = {};
          Object.entries(HERBALISM_RECIPES).forEach(([key, recipe]) => {
            if (!recipesByTier[recipe.tier]) {
              recipesByTier[recipe.tier] = [];
            }
            recipesByTier[recipe.tier].push([key, recipe]);
          });

          return (
            <div className="space-y-6">
              {Object.entries(recipesByTier).sort(([a], [b]) => Number(a) - Number(b)).map(([tier, recipes]) => (
                <div key={tier}>
                  <h4 className="text-lg font-semibold text-green-400 mb-3">Tier {tier}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {recipes.map(([key, recipe]) => {
            // Check if hero has enough materials
            let canCraft = profession.materials.herbs !== undefined;
            let maxCraftable = 999;
            
            if (recipe.cost.herbs) {
              Object.entries(recipe.cost.herbs).forEach(([mat, amount]) => {
                const matKey = mat as keyof typeof profession.materials.herbs;
                const have = profession.materials.herbs?.[matKey] || 0;
                const needed = amount as number;
                
                if (have < needed) {
                  canCraft = false;
                } else {
                  // Calculate max craftable based on this material
                  const possible = Math.floor(have / needed);
                  maxCraftable = Math.min(maxCraftable, possible);
                }
              });
            }

            const meetsLevel = profession.level >= (recipe.minProfessionLevel || 1);

            return (
              <div 
                key={key}
                className={`bg-gray-700 rounded-lg p-3 border-2 transition-all ${
                  canCraft && meetsLevel
                    ? 'border-green-500 hover:border-green-400' 
                    : 'border-gray-600 opacity-75'
                }`}
              >
                {/* Recipe Name */}
                <div className={`font-semibold text-sm mb-2 ${canCraft && meetsLevel ? 'text-green-400' : 'text-gray-400'}`}>
                  {recipe.name}
                </div>

                {/* Level Requirement */}
                <div className={`text-xs mb-2 ${meetsLevel ? 'text-gray-500' : 'text-red-400'}`}>
                  Prof. Lvl {recipe.minProfessionLevel}
                </div>

                {/* Effect */}
                <div className="text-xs text-blue-300 mb-2 line-clamp-2">{recipe.description}</div>
                
                {/* Material Cost */}
                <div className="bg-gray-800 rounded p-2 mb-2">
                  <div className="space-y-1">
                    {Object.entries(recipe.cost.herbs || {}).map(([mat, amount]) => {
                      const have = profession.materials.herbs?.[mat as keyof typeof profession.materials.herbs] || 0;
                      const enough = have >= (amount as number);
                      const icon = mat === 'common' ? '🌿' : mat === 'uncommon' ? '🍀' : mat === 'rare' ? '🌸' : '🌺';
                      
                      return (
                        <div key={mat} className="flex items-center justify-between text-xs">
                          <span className="text-gray-300">{icon}</span>
                          <span className={enough ? 'text-green-400' : 'text-red-400'}>
                            {have}/{amount as number}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quantity Selector and Craft Button */}
                {canCraft && meetsLevel ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-400">Qty:</label>
                      <input
                        type="number"
                        min="1"
                        max={maxCraftable}
                        value={getQuantity(key)}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          setQuantity(key, Math.min(Math.max(1, val), maxCraftable));
                        }}
                        className="w-16 px-2 py-1 bg-gray-800 text-white text-xs rounded border border-gray-600 focus:border-green-500 focus:outline-none"
                      />
                      <span className="text-xs text-gray-500">/ {maxCraftable}</span>
                    </div>
                    <button 
                      onClick={() => onCraft(key, recipe.cost, recipe.tier, getQuantity(key))}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-1.5 rounded text-sm font-semibold transition-colors"
                    >
                      Craft {getQuantity(key) > 1 ? `x${getQuantity(key)}` : ''}
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-xs text-gray-500 py-1.5">
                    {!meetsLevel ? `Prof ${recipe.minProfessionLevel}` : 'Need mats'}
                  </div>
                )}
              </div>
            );
            })}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Mining Recipes */}
        {profession.type === 'mining' && (() => {
          // Group recipes by tier
          const recipesByTier: Record<number, Array<[string, any]>> = {};
          Object.entries(MINING_RECIPES).forEach(([key, recipe]) => {
            if (!recipesByTier[recipe.tier]) {
              recipesByTier[recipe.tier] = [];
            }
            recipesByTier[recipe.tier].push([key, recipe]);
          });

          return (
            <div className="space-y-6">
              {Object.entries(recipesByTier).sort(([a], [b]) => Number(a) - Number(b)).map(([tier, recipes]) => (
                <div key={tier}>
                  <h4 className="text-lg font-semibold text-orange-400 mb-3">Tier {tier}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {recipes.map(([key, recipe]) => {
              let canCraft = profession.materials.ore !== undefined;
              let maxCraftable = 999;
              
              if (recipe.cost.ore) {
                Object.entries(recipe.cost.ore).forEach(([mat, amount]) => {
                  const matKey = mat as keyof typeof profession.materials.ore;
                  const have = profession.materials.ore?.[matKey] || 0;
                  const needed = amount as number;
                  
                  if (have < needed) {
                    canCraft = false;
                  } else {
                    // Calculate max craftable based on this material
                    const possible = Math.floor(have / needed);
                    maxCraftable = Math.min(maxCraftable, possible);
                  }
                });
              }

              const meetsLevel = profession.level >= (recipe.minProfessionLevel || 1);

              return (
                <div 
                  key={key}
                  className={`bg-gray-700 rounded-lg p-3 border-2 transition-all ${
                    canCraft && meetsLevel
                      ? 'border-orange-500 hover:border-orange-400' 
                      : 'border-gray-600 opacity-75'
                  }`}
                >
                  <div className={`font-semibold text-sm mb-2 ${canCraft && meetsLevel ? 'text-orange-400' : 'text-gray-400'}`}>
                    {recipe.name}
                  </div>

                  <div className={`text-xs mb-2 ${meetsLevel ? 'text-gray-500' : 'text-red-400'}`}>
                    Prof. Lvl {recipe.minProfessionLevel}
                  </div>

                  <div className="text-xs text-blue-300 mb-2 line-clamp-2">{recipe.description}</div>
                  
                  <div className="bg-gray-800 rounded p-2 mb-2">
                    <div className="space-y-1">
                      {Object.entries(recipe.cost.ore || {}).map(([mat, amount]) => {
                        const have = profession.materials.ore?.[mat as keyof typeof profession.materials.ore] || 0;
                        const enough = have >= (amount as number);
                        const icon = mat === 'iron' ? '⚙️' : mat === 'steel' ? '🔩' : mat === 'mithril' ? '✨' : '💎';
                        
                        return (
                          <div key={mat} className="flex items-center justify-between text-xs">
                            <span className="text-gray-300">{icon}</span>
                            <span className={enough ? 'text-green-400' : 'text-red-400'}>
                              {have}/{amount as number}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {canCraft && meetsLevel ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-400">Qty:</label>
                        <input
                          type="number"
                          min="1"
                          max={maxCraftable}
                          value={getQuantity(key)}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            setQuantity(key, Math.min(Math.max(1, val), maxCraftable));
                          }}
                          className="w-16 px-2 py-1 bg-gray-800 text-white text-xs rounded border border-gray-600 focus:border-orange-500 focus:outline-none"
                        />
                        <span className="text-xs text-gray-500">/ {maxCraftable}</span>
                      </div>
                      <button 
                        onClick={() => onCraft(key, recipe.cost, recipe.tier, getQuantity(key))}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white py-1.5 rounded text-sm font-semibold transition-colors"
                      >
                        Craft {getQuantity(key) > 1 ? `x${getQuantity(key)}` : ''}
                      </button>
                    </div>
                  ) : (
                    <div className="text-center text-xs text-gray-500 py-1.5">
                      {!meetsLevel ? `Prof ${recipe.minProfessionLevel}` : 'Need mats'}
                    </div>
                  )}
                </div>
              );
            })}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Enchanting Recipes */}
        {profession.type === 'enchanting' && (() => {
          // Group recipes by tier
          const recipesByTier: Record<number, Array<[string, any]>> = {};
          Object.entries(ENCHANTING_RECIPES).forEach(([key, recipe]) => {
            if (!recipesByTier[recipe.tier]) {
              recipesByTier[recipe.tier] = [];
            }
            recipesByTier[recipe.tier].push([key, recipe]);
          });

          return (
            <div className="space-y-6">
              {Object.entries(recipesByTier).sort(([a], [b]) => Number(a) - Number(b)).map(([tier, recipes]) => (
                <div key={tier}>
                  <h4 className="text-lg font-semibold text-purple-400 mb-3">Tier {tier}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recipes.map(([key, recipe]) => {
              const isRune = key.startsWith('rune_');
              
              let canCraft = profession.materials.essence !== undefined;
              let maxCraftable = 999;
              
              if (recipe.cost.essence) {
                const have = profession.materials.essence || 0;
                const needed = recipe.cost.essence;
                
                if (have < needed) {
                  canCraft = false;
                } else {
                  // Calculate max craftable based on essence
                  maxCraftable = Math.floor(have / needed);
                }
              }

              const meetsLevel = profession.level >= (recipe.minProfessionLevel || 1);

              return (
                <div 
                  key={key}
                  className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border-2 transition-all shadow-lg hover:shadow-xl ${
                    canCraft && meetsLevel
                      ? 'border-purple-500/60 hover:border-purple-400 hover:scale-[1.02]' 
                      : 'border-gray-700/50 opacity-75'
                  }`}
                >
                  {/* Title */}
                  <div className={`text-xl font-bold mb-1 ${canCraft && meetsLevel ? 'text-purple-400' : 'text-gray-400'}`}>
                    {recipe.name}
                  </div>

                  {/* Proficiency Level */}
                  <div className={`text-xs font-medium mb-3 ${meetsLevel ? 'text-gray-400' : 'text-red-400'}`}>
                    Prof. Lvl {recipe.minProfessionLevel}
                  </div>

                  {/* Effect Description */}
                  <div className="text-sm text-blue-300/90 mb-4 line-clamp-2 leading-relaxed">{recipe.description}</div>
                  
                  {/* Resource Cost */}
                  <div className="bg-gray-900/80 rounded-lg p-3 mb-4 border border-gray-700/50">
                    <div className="flex items-center justify-between">
                      <span className="text-lg">✨</span>
                      <span className={`text-base font-semibold ${canCraft ? 'text-green-400' : 'text-red-400'}`}>
                        {profession.materials.essence || 0}<span className="text-gray-500">/{recipe.cost.essence}</span>
                      </span>
                    </div>
                  </div>

                  {/* Quantity Selector and Craft Button */}
                  {canCraft && meetsLevel ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-400 font-medium whitespace-nowrap">Qty:</label>
                        <input
                          type="number"
                          min="1"
                          max={maxCraftable}
                          value={getQuantity(key)}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            setQuantity(key, Math.min(Math.max(1, val), maxCraftable));
                          }}
                          className="flex-1 min-w-0 px-3 py-1.5 bg-gray-800 text-white text-sm rounded-md border border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                        />
                        <span className="text-xs text-gray-500 whitespace-nowrap">/ {maxCraftable}</span>
                      </div>
                      <button 
                        onClick={() => onCraft(key, recipe.cost, recipe.tier, getQuantity(key))}
                        className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white py-2.5 rounded-lg text-sm font-bold transition-all shadow-md hover:shadow-purple-500/50 transform hover:scale-[1.02]"
                      >
                        Craft {getQuantity(key) > 1 ? `x${getQuantity(key)}` : ''}
                      </button>
                    </div>
                  ) : (
                    <div className="text-center text-xs text-gray-500 py-2 bg-gray-900/50 rounded-lg border border-gray-700/30">
                      {!meetsLevel ? `Requires Prof Lvl ${recipe.minProfessionLevel}` : 'Insufficient Essence'}
                    </div>
                  )}
                </div>
              );
            })}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Crafting Info */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="text-sm text-gray-400">
          <span className="font-semibold text-white">Tip:</span> Higher level recipes provide better bonuses and last longer. 
          Keep gathering to unlock advanced crafts! View crafted items in the <strong className="text-white">Inventory</strong> tab.
        </div>
      </div>
      </>
      )}
    </div>
  );
}
