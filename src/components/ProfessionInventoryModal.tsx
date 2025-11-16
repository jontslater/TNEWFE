import { Hero, CraftedItem } from '../types/Hero';
import { HERBALISM_RECIPES, MINING_RECIPES, ENCHANTING_RECIPES } from '../api/mock-data';

interface ProfessionInventoryModalProps {
  hero: Hero;
  isOpen: boolean;
  onClose: () => void;
  onSendItem: (itemId: string, recipientName: string) => void;
}

export default function ProfessionInventoryModal({ hero, isOpen, onClose, onSendItem }: ProfessionInventoryModalProps) {
  if (!isOpen || !hero.profession) return null;

  const profession = hero.profession;
  const allRecipes = profession.type === 'herbalism' 
    ? HERBALISM_RECIPES 
    : profession.type === 'mining' 
      ? MINING_RECIPES 
      : ENCHANTING_RECIPES;

  // Calculate total vendor value based on materials used
  const calculateVendorValue = (recipeKey: string, tier: number): number => {
    const recipe = allRecipes[recipeKey as keyof typeof allRecipes];
    if (!recipe) return 100;

    let baseValue = 100;
    if (recipe.cost.herbs) {
      Object.entries(recipe.cost.herbs).forEach(([mat, amount]) => {
        const matValue = mat === 'common' ? 10 : mat === 'uncommon' ? 25 : mat === 'rare' ? 75 : 200;
        baseValue += matValue * (amount as number);
      });
    } else if (recipe.cost.ore) {
      Object.entries(recipe.cost.ore).forEach(([mat, amount]) => {
        const matValue = mat === 'iron' ? 15 : mat === 'steel' ? 40 : mat === 'mithril' ? 100 : 250;
        baseValue += matValue * (amount as number);
      });
    } else if (recipe.cost.essence) {
      baseValue += recipe.cost.essence * 50;
    }

    // Tier multiplier
    baseValue *= tier;
    
    return Math.floor(baseValue);
  };

  // Calculate suggested auction price (2-3x vendor value)
  const calculateSuggestedPrice = (vendorValue: number): { min: number, max: number } => {
    return {
      min: Math.floor(vendorValue * 2),
      max: Math.floor(vendorValue * 3)
    };
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Profession Inventory</h2>
            <p className="text-gray-400 mt-1">
              {profession.type === 'herbalism' ? '🌿 Herbalism' : profession.type === 'mining' ? '⛏️ Mining' : '✨ Enchanting'}
              {' '}- Level {profession.level}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-3xl"
          >
            ×
          </button>
        </div>

        {/* Inventory Grid */}
        <div className="p-6">
          {!profession.inventory || Object.keys(profession.inventory).length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-xl">Your profession inventory is empty</p>
              <p className="text-sm mt-2">Craft items to see them here!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(profession.inventory).map(([recipeKey, items]) => {
                // Items is an object with numeric keys, convert to array
                const itemArray = Object.values(items as Record<string, CraftedItem>);
                const totalQuantity = itemArray.reduce((sum, item) => sum + (item.quantity || 1), 0);
                const firstItem = itemArray[0];
                const recipe = allRecipes[recipeKey as keyof typeof allRecipes];
                const vendorValue = calculateVendorValue(recipeKey, firstItem.tier);
                const suggestedPrice = calculateSuggestedPrice(vendorValue);
                
                const icon = profession.type === 'herbalism' ? '🧪' : profession.type === 'mining' ? '⚙️' : '✨';
                const borderColor = profession.type === 'herbalism' 
                  ? 'border-green-500' 
                  : profession.type === 'mining' 
                    ? 'border-orange-500' 
                    : 'border-purple-500';

                return (
                  <div 
                    key={recipeKey} 
                    className={`bg-gray-800 rounded-lg p-4 border-2 ${borderColor} hover:shadow-lg transition-shadow`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-3xl mb-1">{icon}</div>
                        <div className="font-semibold text-white capitalize">
                          {recipe?.name || recipeKey.replace(/_/g, ' ')}
                        </div>
                        <div className="text-xs text-gray-400">
                          Tier {firstItem.tier} • Qty: {totalQuantity}
                        </div>
                      </div>
                    </div>

                    {recipe && (
                      <div className="text-sm text-gray-300 mb-3 line-clamp-2">
                        {recipe.description}
                      </div>
                    )}

                    {/* Value Information */}
                    <div className="bg-gray-900 rounded p-3 mb-3 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Vendor Price:</span>
                        <span className="text-yellow-400 font-semibold">🪙 {vendorValue}g</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Auction Range:</span>
                        <span className="text-green-400 font-semibold">
                          {suggestedPrice.min}g - {suggestedPrice.max}g
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 pt-2 border-t border-gray-700">
                        💡 Suggested auction price based on material cost
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => {
                          // TODO: Implement vendor sell
                          alert(`Sold 1x for ${vendorValue}g!`);
                        }}
                        className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded text-sm font-semibold transition-colors"
                      >
                        Vendor Sell
                      </button>
                      <button 
                        onClick={() => {
                          const recipient = prompt('Send to (username):');
                          if (recipient) {
                            onSendItem(firstItem.id, recipient);
                          }
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm font-semibold transition-colors"
                      >
                        Send to Player
                      </button>
                    </div>
                    
                    {/* Future: Auction House */}
                    <button 
                      onClick={() => {
                        alert('Auction House coming soon!');
                      }}
                      className="w-full mt-2 bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded text-sm font-semibold transition-colors"
                    >
                      List on Auction House
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="bg-gray-800 p-4 border-t border-gray-700">
          <div className="text-sm text-gray-400 space-y-1">
            <p><strong className="text-white">💰 Economy Guide:</strong></p>
            <p>• <strong>Vendor:</strong> Quick gold, but lower value</p>
            <p>• <strong>Send to Player:</strong> Help guildmates or trade directly</p>
            <p>• <strong>Auction House:</strong> Best prices, reaches all players (Coming Soon)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
