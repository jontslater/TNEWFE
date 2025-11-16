import React, { useState, useEffect } from 'react';
import { questAPI } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { QuestSet, QuestWithProgress, PlayerQuestProgress } from '../types/Quest';
import Navigation from '../components/Navigation';

const QuestsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [dailyQuests, setDailyQuests] = useState<QuestSet | null>(null);
  const [weeklyQuests, setWeeklyQuests] = useState<QuestSet | null>(null);
  const [monthlyQuests, setMonthlyQuests] = useState<QuestSet | null>(null);
  const [progress, setProgress] = useState<PlayerQuestProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    loadQuests();
  }, [user]);

  const loadQuests = async () => {
    try {
      setLoading(true);
      const [daily, weekly, monthly, playerProgress] = await Promise.all([
        questAPI.getDailyQuests(),
        questAPI.getWeeklyQuests(),
        questAPI.getMonthlyQuests(),
        user?.twitchId ? questAPI.getPlayerProgress(user.twitchId) : null
      ]);

      setDailyQuests(daily);
      setWeeklyQuests(weekly);
      setMonthlyQuests(monthly);
      setProgress(playerProgress);
    } catch (error) {
      console.error('Error loading quests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimQuest = async (questId: string, type: 'daily' | 'weekly' | 'monthly') => {
    if (!user?.twitchId) return;

    try {
      setClaiming(questId);
      await questAPI.claimQuestReward(user.twitchId, questId, type);
      
      // Reload progress
      await loadQuests();
    } catch (error: any) {
      console.error('Failed to claim quest:', error);
    } finally {
      setClaiming(null);
    }
  };

  const handleClaimBonus = async (type: 'daily' | 'weekly' | 'monthly') => {
    if (!user?.twitchId) return;

    try {
      setClaiming(`${type}-bonus`);
      await questAPI.claimCompletionBonus(user.twitchId, type);
      
      // Reload progress
      await loadQuests();
    } catch (error: any) {
      console.error('Failed to claim bonus:', error);
    } finally {
      setClaiming(null);
    }
  };

  const handleClaimAll = async () => {
    if (!user?.twitchId) return;

    try {
      setClaiming('claim-all');
      await questAPI.claimAllQuests(user.twitchId, activeTab);
      
      // Reload progress
      await loadQuests();
    } catch (error: any) {
      console.error('Failed to claim all quests:', error);
      alert(error.message || 'Failed to claim quests');
    } finally {
      setClaiming(null);
    }
  };

  const getClaimableCount = (quests: QuestSet | null): number => {
    if (!quests || !progress) return 0;
    const typeProgress = progress[activeTab];
    return quests.quests.filter(q => {
      const p = typeProgress?.[q.id];
      return p?.completed && !p?.claimedAt;
    }).length;
  };

  const getCurrentQuests = (): QuestSet | null => {
    return activeTab === 'daily' ? dailyQuests : activeTab === 'weekly' ? weeklyQuests : monthlyQuests;
  };

  const getQuestProgress = (questId: string): QuestWithProgress['progress'] => {
    if (!progress) return undefined;
    const typeProgress = progress[activeTab];
    return typeProgress?.[questId];
  };

  const getCompletionCount = (quests: QuestSet | null): number => {
    if (!quests || !progress) return 0;
    const typeProgress = progress[activeTab];
    return quests.quests.filter(q => typeProgress?.[q.id]?.completed).length;
  };

  const canClaimBonus = (quests: QuestSet | null): boolean => {
    if (!quests || !progress) return false;
    const typeProgress = progress[activeTab];
    const bonusKey = `${activeTab}BonusClaimed` as keyof PlayerQuestProgress;
    const allCompleted = quests.quests.every(q => typeProgress?.[q.id]?.completed);
    return allCompleted && !progress[bonusKey];
  };

  const currentQuests = getCurrentQuests();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-white">Loading quests...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-5xl font-bold text-center mb-8 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
          Quests
        </h1>

        {/* Tab Navigation */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-6 py-3 rounded-lg font-bold transition ${
              activeTab === 'daily'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Daily ({getCompletionCount(dailyQuests)}/{dailyQuests?.quests.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`px-6 py-3 rounded-lg font-bold transition ${
              activeTab === 'weekly'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Weekly ({getCompletionCount(weeklyQuests)}/{weeklyQuests?.quests.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            className={`px-6 py-3 rounded-lg font-bold transition ${
              activeTab === 'monthly'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Monthly ({getCompletionCount(monthlyQuests)}/{monthlyQuests?.quests.length || 0})
          </button>
        </div>

        {/* Claim All Button */}
        {currentQuests && getClaimableCount(currentQuests) > 0 && (
          <div className="max-w-6xl mx-auto mb-6">
            <button
              onClick={handleClaimAll}
              disabled={claiming === 'claim-all'}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-4 rounded-lg font-bold text-lg disabled:opacity-50 transition-all shadow-lg"
            >
              {claiming === 'claim-all' ? 'Claiming...' : `✨ Claim All Completed Quests (${getClaimableCount(currentQuests)})`}
            </button>
          </div>
        )}

        {/* Quest List - Organized by Category */}
        {currentQuests && (
          <div className="max-w-6xl mx-auto">
            {/* Group quests by category */}
            {['combat', 'profession', 'social', 'meta'].map(category => {
              const categoryQuests = currentQuests.quests.filter(q => q.category === category);
              if (categoryQuests.length === 0) return null;

              const categoryColors = {
                combat: { bg: 'bg-red-900', text: 'text-red-200', border: 'border-red-500' },
                profession: { bg: 'bg-green-900', text: 'text-green-200', border: 'border-green-500' },
                social: { bg: 'bg-blue-900', text: 'text-blue-200', border: 'border-blue-500' },
                meta: { bg: 'bg-purple-900', text: 'text-purple-200', border: 'border-purple-500' }
              };

              const colors = categoryColors[category as keyof typeof categoryColors];

              return (
                <div key={category} className="mb-8">
                  <h2 className={`text-xl font-bold mb-4 ${colors.text} flex items-center gap-2`}>
                    {category === 'combat' && '⚔️'}
                    {category === 'profession' && '🔨'}
                    {category === 'social' && '👥'}
                    {category === 'meta' && '🎯'}
                    {category.toUpperCase()} QUESTS
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryQuests.map((quest) => {
                      const questProgress = getQuestProgress(quest.id);
                      const progressPercent = questProgress
                        ? Math.min(100, (questProgress.current / quest.objective.target) * 100)
                        : 0;
                      const isCompleted = questProgress?.completed || false;
                      const isClaimed = questProgress?.claimedAt !== null && questProgress?.claimedAt !== undefined;

                      return (
                        <div
                          key={quest.id}
                          className={`bg-gray-800 border-2 rounded-lg p-4 ${
                            isCompleted ? colors.border : 'border-gray-700'
                          } hover:border-gray-600 transition-all`}
                        >
                          <div className="mb-3">
                            <h3 className="text-lg font-bold text-white mb-1">{quest.name}</h3>
                            <p className="text-sm text-gray-400 mb-2">{quest.description}</p>
                            
                            {/* Progress */}
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs text-gray-500">Progress</span>
                              <span className="text-sm font-bold text-yellow-400">
                                {questProgress?.current || 0} / {quest.objective.target}
                              </span>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="w-full bg-gray-700 rounded-full h-2 mb-3 overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  isCompleted ? 'bg-green-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${progressPercent}%` }}
                              ></div>
                            </div>

                            {/* Rewards */}
                            <div className="flex flex-wrap gap-2 text-xs mb-3">
                              {quest.rewards.gold > 0 && (
                                <span className="text-yellow-400">💰 {quest.rewards.gold}g</span>
                              )}
                              {quest.rewards.xp > 0 && (
                                <span className="text-blue-400">⭐ {Math.floor(quest.rewards.xp)} XP</span>
                              )}
                              {quest.rewards.tokens > 0 && (
                                <span className="text-purple-400">🎫 {quest.rewards.tokens}</span>
                              )}
                              {quest.rewards.materials && quest.rewards.materials.length > 0 && (
                                <span className="text-green-400">📦 Materials</span>
                              )}
                              {quest.rewards.items && quest.rewards.items.length > 0 && (
                                <span className="text-orange-400">🎁 Item</span>
                              )}
                            </div>

                            {/* Claim Button */}
                            {isCompleted && !isClaimed && (
                              <button
                                onClick={() => handleClaimQuest(quest.id, activeTab)}
                                disabled={claiming === quest.id}
                                className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded font-bold text-sm disabled:opacity-50"
                              >
                                {claiming === quest.id ? 'Claiming...' : 'Claim Reward'}
                              </button>
                            )}
                            {isClaimed && (
                              <div className="text-center text-green-400 font-bold text-sm">✓ Claimed</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Completion Bonus */}
            {currentQuests && (
              <div className="bg-gradient-to-r from-purple-900 to-pink-900 border-2 border-yellow-500 rounded-lg p-6 mt-8">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-bold text-yellow-400 mb-2">
                      🎖️ Completion Bonus
                    </h3>
                    <p className="text-gray-300 mb-3">
                      Complete all {currentQuests.quests.length} quests to claim!
                    </p>
                    <div className="flex gap-3 text-sm">
                      <span className="text-yellow-400">💰 {currentQuests.completionBonus.gold}g</span>
                      <span className="text-blue-400">⭐ {Math.floor(currentQuests.completionBonus.xp)} XP</span>
                      <span className="text-purple-400">🎫 {currentQuests.completionBonus.tokens} tokens</span>
                      {currentQuests.completionBonus.items && currentQuests.completionBonus.items.length > 0 && (
                        <span className="text-orange-400">
                          🎁 {currentQuests.completionBonus.items.length} {currentQuests.completionBonus.items[0].rarity} item
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    {canClaimBonus(currentQuests) ? (
                      <button
                        onClick={() => handleClaimBonus(activeTab)}
                        disabled={claiming === `${activeTab}-bonus`}
                        className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-lg font-bold text-lg disabled:opacity-50"
                      >
                        {claiming === `${activeTab}-bonus` ? 'Claiming...' : 'Claim Bonus!'}
                      </button>
                    ) : progress?.[`${activeTab}BonusClaimed` as keyof PlayerQuestProgress] ? (
                      <div className="text-green-400 font-bold text-xl">✓ Claimed</div>
                    ) : (
                      <div className="text-gray-500 font-bold">
                        {getCompletionCount(currentQuests)}/{currentQuests.quests.length} Complete
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reset Timer */}
        {currentQuests && (
          <div className="text-center mt-8 text-gray-400">
            Resets: {new Date(currentQuests.resetTime?.toDate?.() || currentQuests.resetTime).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestsPage;
