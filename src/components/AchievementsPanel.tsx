import { useState, useEffect } from 'react';
import { achievementAPI } from '../api/client';
import { Hero } from '../types/Hero';

interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  icon: string;
  requirement: { type: string; count: number };
  rewards: { title: string; badge: string; gold: number; tokens: number };
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  hidden: boolean;
  progress: {
    current: number;
    total: number;
    completed: boolean;
    completedAt: any;
  };
}

interface AchievementsPanelProps {
  hero: Hero;
  onUpdate?: () => void;
}

const RARITY_COLORS = {
  common: 'from-gray-600 to-gray-700',
  uncommon: 'from-green-600 to-green-700',
  rare: 'from-blue-600 to-blue-700',
  epic: 'from-purple-600 to-purple-700',
  legendary: 'from-orange-600 to-orange-700'
};

const RARITY_TEXT_COLORS = {
  common: 'text-gray-300',
  uncommon: 'text-green-300',
  rare: 'text-blue-300',
  epic: 'text-purple-300',
  legendary: 'text-orange-300'
};

export default function AchievementsPanel({ hero, onUpdate }: AchievementsPanelProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showTitleSelector, setShowTitleSelector] = useState(false);
  const [showBadgeSelector, setShowBadgeSelector] = useState(false);

  const equippedTitle = (hero as any).titles?.equipped || null;
  const equippedBadge = (hero as any).badges?.equipped || null;
  const unlockedTitles = (hero as any).titles?.unlocked || [];
  const unlockedBadges = (hero as any).badges?.unlocked || [];

  useEffect(() => {
    loadAchievements();
  }, [hero.id]);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const data = await achievementAPI.getHeroAchievements(hero.id);
      setAchievements(data);
    } catch (error) {
      console.error('Failed to load achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEquipTitle = async (title: string | null) => {
    try {
      await achievementAPI.equipTitle(hero.id, title);
      setShowTitleSelector(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to equip title:', error);
      alert('Failed to equip title');
    }
  };

  const handleEquipBadge = async (badge: string | null) => {
    try {
      await achievementAPI.equipBadge(hero.id, badge);
      setShowBadgeSelector(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to equip badge:', error);
      alert('Failed to equip badge');
    }
  };

  const filteredAchievements = achievements.filter(a => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'completed') return a.progress.completed;
    return a.category === selectedCategory;
  });

  const completedCount = achievements.filter(a => a.progress.completed).length;
  const totalAchievementPoints = achievements
    .filter(a => a.progress.completed)
    .reduce((sum, a) => sum + a.rewards.tokens, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-xl">Loading achievements...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6 text-white">
          <div className="text-4xl font-bold">{completedCount}/{achievements.length}</div>
          <div className="text-blue-200">Achievements</div>
        </div>
        <div className="bg-gradient-to-br from-amber-600 to-amber-700 rounded-lg p-6 text-white">
          <div className="text-4xl font-bold">{totalAchievementPoints}</div>
          <div className="text-amber-200">Achievement Points</div>
        </div>
        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-6 text-white">
          <div className="text-4xl font-bold">{unlockedTitles.length}</div>
          <div className="text-purple-200">Titles Unlocked</div>
        </div>
      </div>

      {/* Title & Badge Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Equipped Title */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Equipped Title</h3>
          <div className="flex items-center justify-between">
            <div className="text-xl font-bold text-amber-400">
              {equippedTitle || <span className="text-gray-500">None</span>}
            </div>
            <button
              onClick={() => setShowTitleSelector(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              Change
            </button>
          </div>
        </div>

        {/* Equipped Badge */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Equipped Badge</h3>
          <div className="flex items-center justify-between">
            <div className="text-4xl">
              {equippedBadge || <span className="text-gray-500">None</span>}
            </div>
            <button
              onClick={() => setShowBadgeSelector(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              Change
            </button>
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {['all', 'completed', 'combat', 'progression', 'class', 'social', 'secret'].map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded font-semibold transition-colors ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map(achievement => (
          <div
            key={achievement.id}
            className={`bg-gradient-to-br ${RARITY_COLORS[achievement.rarity]} rounded-lg p-4 border-2 ${
              achievement.progress.completed ? 'border-yellow-400' : 'border-transparent'
            } relative overflow-hidden`}
          >
            {achievement.progress.completed && (
              <div className="absolute top-2 right-2 bg-yellow-400 text-gray-900 px-2 py-1 rounded text-xs font-bold">
                ✓ COMPLETED
              </div>
            )}
            
            <div className="flex items-start space-x-3">
              <div className="text-4xl">{achievement.icon}</div>
              <div className="flex-1">
                <h4 className={`font-bold text-lg ${RARITY_TEXT_COLORS[achievement.rarity]}`}>
                  {achievement.name}
                </h4>
                <p className="text-sm text-gray-200 mt-1">{achievement.description}</p>
                
                {/* Progress Bar */}
                {!achievement.progress.completed && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-300 mb-1">
                      <span>{achievement.progress.current.toLocaleString()} / {achievement.progress.total.toLocaleString()}</span>
                      <span>{Math.floor((achievement.progress.current / achievement.progress.total) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-400 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (achievement.progress.current / achievement.progress.total) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Rewards */}
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="bg-black bg-opacity-30 px-2 py-1 rounded">
                    💰 {achievement.rewards.gold}g
                  </span>
                  <span className="bg-black bg-opacity-30 px-2 py-1 rounded">
                    💎 {achievement.rewards.tokens}
                  </span>
                  <span className="bg-black bg-opacity-30 px-2 py-1 rounded">
                    {achievement.rewards.badge} {achievement.rewards.title}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Title Selector Modal */}
      {showTitleSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Select Title</h2>
              <button
                onClick={() => setShowTitleSelector(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-2">
              <button
                onClick={() => handleEquipTitle(null)}
                className={`w-full p-4 rounded text-left transition-colors ${
                  equippedTitle === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                <span className="text-gray-500">No Title</span>
              </button>
              
              {unlockedTitles.map((title: string) => (
                <button
                  key={title}
                  onClick={() => handleEquipTitle(title)}
                  className={`w-full p-4 rounded text-left transition-colors ${
                    equippedTitle === title
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  <span className="font-bold text-amber-400">{title}</span>
                  {equippedTitle === title && <span className="ml-2">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Badge Selector Modal */}
      {showBadgeSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Select Badge</h2>
              <button
                onClick={() => setShowBadgeSelector(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              <button
                onClick={() => handleEquipBadge(null)}
                className={`p-6 rounded text-center transition-colors ${
                  equippedBadge === null
                    ? 'bg-blue-600 ring-4 ring-blue-400'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <div className="text-4xl text-gray-500">✕</div>
                <div className="text-xs text-gray-400 mt-2">None</div>
              </button>
              
              {unlockedBadges.map((badge: string) => (
                <button
                  key={badge}
                  onClick={() => handleEquipBadge(badge)}
                  className={`p-6 rounded text-center transition-colors ${
                    equippedBadge === badge
                      ? 'bg-blue-600 ring-4 ring-blue-400'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  <div className="text-4xl">{badge}</div>
                  {equippedBadge === badge && (
                    <div className="text-xs text-white mt-2">✓ Equipped</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {filteredAchievements.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No achievements found in this category.
        </div>
      )}
    </div>
  );
}

