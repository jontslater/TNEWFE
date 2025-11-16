import { useState } from 'react';
import { Hero } from '../types/Hero';
import { heroAPI } from '../api/client';
import { HERBALISM_RECIPES } from '../api/mock-data';

interface ProfessionPanelProps {
  hero: Hero;
  onUpdate: () => void;
}

export default function ProfessionPanel({ hero, onUpdate }: ProfessionPanelProps) {
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);
  const [selectedElixir, setSelectedElixir] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');

  if (!hero.profession) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
        <h3 className="text-xl font-bold text-white mb-4">No Profession Yet</h3>
        <p className="text-gray-400">Join the Electron app and use !profession herbalism to start!</p>
      </div>
    );
  }

  const profession = hero.profession;
  const xpPercent = (Math.floor(profession.xp) / Math.floor(profession.maxXp)) * 100;

  const handleCraft = async (recipeKey: string) => {
    try {
      const result = await heroAPI.craftElixir(hero.name, recipeKey);
      setMessage(result.message);
      if (result.success) {
        onUpdate();
      }
    } catch (err) {
      setMessage('Failed to craft elixir');
    }
  };

  const handleUse = async (itemKey: string) => {
    try {
      const result = await heroAPI.useElixir(hero.name, itemKey);
      setMessage(result.message);
      if (result.success) {
        onUpdate();
      }
    } catch (err) {
      setMessage('Failed to use elixir');
    }
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

      {/* Materials */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">Materials</h3>
        {profession.materials.herbs && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl mb-1">🌿</div>
              <div className="text-sm text-gray-400">Common</div>
              <div className="text-xl font-bold text-green-400">{profession.materials.herbs.common}</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl mb-1">🍀</div>
              <div className="text-sm text-gray-400">Uncommon</div>
              <div className="text-xl font-bold text-blue-400">{profession.materials.herbs.uncommon}</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl mb-1">🌸</div>
              <div className="text-sm text-gray-400">Rare</div>
              <div className="text-xl font-bold text-purple-400">{profession.materials.herbs.rare}</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl mb-1">🌺</div>
              <div className="text-sm text-gray-400">Epic</div>
              <div className="text-xl font-bold text-yellow-400">{profession.materials.herbs.epic}</div>
            </div>
          </div>
        )}
      </div>

      {/* Recipes */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">Recipes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(HERBALISM_RECIPES).map(([key, recipe]) => {
            const canCraft = profession.materials.herbs &&
              Object.entries(recipe.cost).every(([mat, amount]) => {
                const matKey = mat as keyof typeof profession.materials.herbs;
                return (profession.materials.herbs?.[matKey] || 0) >= (amount as number);
              });

            return (
              <div 
                key={key}
                className={`bg-gray-700 rounded-lg p-4 border-2 ${
                  canCraft ? 'border-green-500 hover:border-green-400' : 'border-gray-600'
                } cursor-pointer transition-colors`}
                onClick={() => canCraft && handleCraft(key)}
              >
                <div className={`font-semibold ${canCraft ? 'text-green-400' : 'text-gray-400'}`}>
                  {recipe.name}
                </div>
                <div className="text-sm text-gray-300 mt-2">{recipe.effect}</div>
                <div className="mt-3 space-y-1 text-xs">
                  {Object.entries(recipe.cost).map(([mat, amount]) => (
                    <div key={mat} className="text-gray-400">
                      {mat}: {amount as number}
                    </div>
                  ))}
                </div>
                {canCraft && (
                  <button className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded transition-colors">
                    Craft
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Inventory */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">Inventory</h3>
        {profession.inventory.length === 0 ? (
          <div className="text-gray-400 text-center py-8">No elixirs crafted yet</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profession.inventory.map((item, idx) => (
              <div key={idx} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <div className="font-semibold text-white">{item.name}</div>
                <div className="text-sm text-gray-400 mt-1">Quantity: {item.quantity}</div>
                <button 
                  onClick={() => handleUse(item.item)}
                  className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition-colors"
                >
                  Use
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className="bg-blue-900/50 border border-blue-500 rounded-lg p-4 text-blue-200">
          {message}
        </div>
      )}
    </div>
  );
}
