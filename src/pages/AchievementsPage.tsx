import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { achievementAPI } from '../api/client';

interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  requirements: any;
  rewards: {
    title?: string;
    gold?: number;
    items?: any[];
    experience?: number;
  };
  icon?: string;
  progress?: number;
  maxProgress?: number;
}

export default function AchievementsPage() {
  const { user } = useAuth();
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [heroAchievements, setHeroAchievements] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'rarity' | 'progress'>('name');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadAchievements();
    }
  }, [user, selectedCategory]);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const [all, hero] = await Promise.all([
        achievementAPI.getAllAchievements(selectedCategory || undefined),
        achievementAPI.getHeroAchievements(user!.id)
      ]);
      setAllAchievements(Array.isArray(all) ? all : []);
      setHeroAchievements(hero);
    } catch (err) {
      console.error('Failed to load achievements:', err);
    } finally {
      setLoading(false);
    }
  };

  const unlockedIds = heroAchievements?.achievements?.map((a: any) => a.achievementId) || [];
  const unlockedAchievements = allAchievements.filter(a => unlockedIds.includes(a.id));
  const lockedAchievements = allAchievements.filter(a => !unlockedIds.includes(a.id));

  const categories = [
    { id: null, name: 'All', icon: '📋' },
    { id: 'combat', name: 'Combat', icon: '⚔️' },
    { id: 'profession', name: 'Profession', icon: '⚗️' },
    { id: 'social', name: 'Social', icon: '👥' },
    { id: 'progression', name: 'Progression', icon: '📈' },
    { id: 'meta', name: 'Meta', icon: '🌟' }
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'text-yellow-400 border-yellow-500 bg-yellow-900/20';
      case 'epic': return 'text-purple-400 border-purple-500 bg-purple-900/20';
      case 'rare': return 'text-blue-400 border-blue-500 bg-blue-900/20';
      case 'uncommon': return 'text-green-400 border-green-500 bg-green-900/20';
      default: return 'text-gray-400 border-gray-500 bg-gray-900/20';
    }
  };

  const getRarityBg = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-yellow-900/30';
      case 'epic': return 'bg-purple-900/30';
      case 'rare': return 'bg-blue-900/30';
      case 'uncommon': return 'bg-green-900/30';
      default: return 'bg-gray-900/30';
    }
  };

  const filteredAchievements = allAchievements.filter(a => {
    const matchesCategory = !selectedCategory || a.category === selectedCategory;
    const matchesSearch = !searchTerm || 
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    if (sortBy === 'rarity') {
      const rarityOrder = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
      return (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
    }
    if (sortBy === 'progress') {
      const aProgress = a.progress || 0;
      const bProgress = b.progress || 0;
      return bProgress - aProgress;
    }
    return a.name.localeCompare(b.name);
  });

  const completionPercentage = allAchievements.length > 0
    ? Math.round((unlockedAchievements.length / allAchievements.length) * 100)
    : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Achievements</h1>
        <p className="text-gray-400">Track your progress and unlock rewards!</p>
      </div>

      {/* Progress Summary */}
      {heroAchievements && (
        <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg p-6 border border-blue-700 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-gray-400 mb-1">Overall Progress</div>
              <div className="text-3xl font-bold text-white">
                {unlockedAchievements.length} / {allAchievements.length}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400 mb-1">Completion</div>
              <div className="text-3xl font-bold text-yellow-400">{completionPercentage}%</div>
            </div>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-4">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Titles Section */}
      {heroAchievements?.titles && heroAchievements.titles.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Unlocked Titles</h2>
          <div className="flex flex-wrap gap-3">
            {heroAchievements.titles.map((title: string) => (
              <button
                key={title}
                onClick={async () => {
                  if (heroAchievements.activeTitle !== title) {
                    try {
                      await achievementAPI.setActiveTitle(user!.id, title);
                      loadAchievements();
                    } catch (err: any) {
                      alert(err.response?.data?.error || 'Failed to set title');
                    }
                  }
                }}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  heroAchievements.activeTitle === title
                    ? 'bg-blue-600 text-white border-2 border-blue-400'
                    : 'bg-gray-700 text-gray-300 border-2 border-gray-600 hover:border-gray-500'
                }`}
              >
                {title}
                {heroAchievements.activeTitle === title && ' ✓'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-400 mb-2">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id || 'all'}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-gray-400 mb-2">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              placeholder="Search achievements..."
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value="name">Name</option>
              <option value="rarity">Rarity</option>
              <option value="progress">Progress</option>
            </select>
          </div>
        </div>
      </div>

      {/* Achievements Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-xl">Loading achievements...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedAchievements.map((achievement) => {
            const isUnlocked = unlockedIds.includes(achievement.id);
            const rarityColor = getRarityColor(achievement.rarity);
            const rarityBg = getRarityBg(achievement.rarity);
            
            return (
              <div
                key={achievement.id}
                className={`rounded-lg p-6 border-2 transition-all hover:scale-105 ${
                  isUnlocked
                    ? `${rarityColor} ${rarityBg}`
                    : 'border-gray-700 bg-gray-800 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {achievement.icon && (
                      <div className="text-3xl">{achievement.icon}</div>
                    )}
                    <div>
                      <h3 className="font-bold text-lg text-white">{achievement.name}</h3>
                      <div className="text-xs text-gray-400 capitalize mt-1">
                        {achievement.category} • {achievement.rarity}
                      </div>
                    </div>
                  </div>
                  {isUnlocked && (
                    <div className="text-2xl">✓</div>
                  )}
                </div>
                
                <p className="text-sm text-gray-300 mb-4">{achievement.description}</p>
                
                {/* Progress Bar */}
                {achievement.progress !== undefined && achievement.maxProgress && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{achievement.progress} / {achievement.maxProgress}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (achievement.progress / achievement.maxProgress) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {/* Rewards */}
                {achievement.rewards && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="text-xs text-gray-400 mb-2">Rewards:</div>
                    <div className="flex flex-wrap gap-2">
                      {achievement.rewards.title && (
                        <span className="px-2 py-1 bg-purple-900/30 text-purple-400 rounded text-xs">
                          Title: {achievement.rewards.title}
                        </span>
                      )}
                      {achievement.rewards.gold && (
                        <span className="px-2 py-1 bg-yellow-900/30 text-yellow-400 rounded text-xs">
                          {achievement.rewards.gold.toLocaleString()} Gold
                        </span>
                      )}
                      {achievement.rewards.experience && (
                        <span className="px-2 py-1 bg-blue-900/30 text-blue-400 rounded text-xs">
                          {achievement.rewards.experience.toLocaleString()} XP
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {sortedAchievements.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-xl">No achievements found</div>
        </div>
      )}
    </div>
  );
}
