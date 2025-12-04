import { useState, useEffect } from 'react';
import { achievementAPI } from '../api/client';
import { Hero } from '../types/Hero';

interface AchievementsPanelProps {
  hero: Hero;
}

const RARITY_COLORS: { [key: string]: string } = {
  common: 'bg-gray-700 border-gray-500 text-gray-300',
  uncommon: 'bg-green-900 border-green-600 text-green-300',
  rare: 'bg-blue-900 border-blue-600 text-blue-300',
  epic: 'bg-purple-900 border-purple-600 text-purple-300',
  legendary: 'bg-orange-900 border-orange-600 text-orange-300'
};

export default function AchievementsPanel({ hero }: AchievementsPanelProps) {
  const [achievementsData, setAchievementsData] = useState<any>(null);
  const [allAchievements, setAllAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [hero.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [heroData, allData] = await Promise.all([
        achievementAPI.getHeroAchievements(hero.id),
        achievementAPI.getAllAchievements()
      ]);
      
      console.log('[AchievementsPanel] 🎯 Loaded Data:');
      console.log('[AchievementsPanel] All achievements count:', allData?.length || 0);
      console.log('[AchievementsPanel] All achievements:', allData);
      console.log('[AchievementsPanel] Hero data:', heroData);
      console.log('[AchievementsPanel] Hero unlocked count:', heroData?.achievements?.length || 0);
      console.log('[AchievementsPanel] Hero titles:', heroData?.titles);
      
      // Check for "Genocide" specifically
      const genocideInAll = allData?.find((a: any) => a.name?.includes('Genocide') || a.rewards?.title?.includes('Genocide'));
      const genocideInHero = heroData?.titles?.find((t: any) => t?.includes('Genocide'));
      if (genocideInAll) console.error('[AchievementsPanel] ❌ FOUND GENOCIDE in allData:', genocideInAll);
      if (genocideInHero) console.error('[AchievementsPanel] ❌ FOUND GENOCIDE in hero titles:', genocideInHero);
      
      setAchievementsData(heroData);
      setAllAchievements(allData);
    } catch (error) {
      console.error('Failed to load achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-xl">Loading achievements...</div>
      </div>
    );
  }

  if (!achievementsData || !allAchievements) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-xl">No achievement data available</div>
      </div>
    );
  }

  const unlockedIds = achievementsData.achievements?.map((a: any) => a.achievementId) || [];
  const totalTokens = achievementsData.achievements?.reduce((sum: number, a: any) => {
    const ach = allAchievements.find(ac => ac.id === a.achievementId);
    return sum + (ach?.rewards?.tokens || 0);
  }, 0) || 0;

  // Merge unlocked status with all achievements
  const enrichedAchievements = allAchievements.map(ach => {
    const unlocked = unlockedIds.includes(ach.id);
    const unlockedData = achievementsData.achievements?.find((a: any) => a.achievementId === ach.id);
    
    return {
      ...ach,
      unlocked,
      unlockedAt: unlockedData?.unlockedAt || null
    };
  });

  const filteredAchievements = enrichedAchievements.filter(a => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'completed') return a.unlocked;
    return a.category === selectedCategory;
  });

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6 text-white shadow-lg">
          <div className="text-5xl font-bold">{unlockedIds.length}/{allAchievements.length}</div>
          <div className="text-blue-200 text-lg mt-2">Achievements Unlocked</div>
          <div className="text-sm text-blue-100 mt-1">
            {Math.round((unlockedIds.length / allAchievements.length) * 100)}% Complete
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-600 to-amber-700 rounded-lg p-6 text-white shadow-lg">
          <div className="text-5xl font-bold">{totalTokens.toLocaleString()}</div>
          <div className="text-amber-200 text-lg mt-2">Tokens Earned</div>
          <div className="text-sm text-amber-100 mt-1">From achievements</div>
        </div>
        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-6 text-white shadow-lg">
          <div className="text-5xl font-bold">{achievementsData.titles?.length || 0}</div>
          <div className="text-purple-200 text-lg mt-2">Titles Unlocked</div>
          <div className="text-sm text-purple-100 mt-1">
            Active: {achievementsData.activeTitle || 'None'}
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {['all', 'completed', 'combat', 'progression', 'profession', 'social', 'meta', 'class'].map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Achievements List */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-900 border-b border-gray-700">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Achievement
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Rarity
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Rewards
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredAchievements.map((achievement, index) => {
                const rarity = achievement.rarity || 'common';
                return (
                  <tr
                    key={achievement.id}
                    className={`hover:bg-gray-700 transition-colors ${
                      achievement.unlocked ? 'bg-gray-800' : 'bg-gray-850 opacity-60'
                    }`}
                  >
                    {/* Status */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      {achievement.unlocked ? (
                        <div className="flex items-center">
                          <span className="text-green-400 text-2xl">✓</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <span className="text-gray-600 text-2xl">○</span>
                        </div>
                      )}
                    </td>

                    {/* Achievement Name & Title */}
                    <td className="px-4 py-4">
                      <div>
                        <div className="font-bold text-white text-lg">{achievement.name}</div>
                        {achievement.rewards?.title && (
                          <div className="text-sm text-amber-400 mt-1">
                            Title: "{achievement.rewards.title}"
                          </div>
                        )}
                {achievement.unlocked && achievement.unlockedAt && (
                  <div className="text-xs text-gray-500 mt-1">
                    Unlocked: {new Date(achievement.unlockedAt.seconds * 1000).toLocaleDateString()}
                  </div>
                )}
                      </div>
                    </td>

                    {/* Description */}
                    <td className="px-4 py-4">
                      <div className="text-gray-300 text-sm">{achievement.description}</div>
                    </td>

                    {/* Rarity */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${RARITY_COLORS[rarity]}`}>
                        {rarity.toUpperCase()}
                      </span>
                    </td>

                    {/* Rewards */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1 text-xs">
                        {achievement.rewards?.tokens && (
                          <div className="text-blue-400 font-semibold">
                            💎 {achievement.rewards.tokens.toLocaleString()} Tokens
                          </div>
                        )}
                        {achievement.rewards?.gold && (
                          <div className="text-yellow-400 font-semibold">
                            💰 {achievement.rewards.gold.toLocaleString()}g
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredAchievements.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No achievements found in this category.
        </div>
      )}

      {/* Total Count */}
      <div className="text-center text-gray-400 text-sm">
        Showing {filteredAchievements.length} achievement{filteredAchievements.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
