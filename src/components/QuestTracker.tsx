import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useHeroListener } from '../hooks/useHeroListener';
import { questAPI } from '../api/client';
import { PlayerQuestProgress, QuestSet } from '../types/Quest';

const QuestTracker: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { questProgress } = useHeroListener(user?.id || null);
  const [dailyQuests, setDailyQuests] = useState<QuestSet | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Load daily quests to show active count
    loadDailyQuests();
  }, []);

  // Use questProgress directly from the consolidated listener
  const progress = questProgress;

  const loadDailyQuests = async () => {
    try {
      const quests = await questAPI.getDailyQuests();
      setDailyQuests(quests);
    } catch (error) {
      console.error('Error loading daily quests:', error);
    }
  };

  if (!progress || !dailyQuests) return null;

  const completedCount = dailyQuests.quests.filter(
    (q) => progress.daily?.[q.id]?.completed
  ).length;

  const unclaimedCount = dailyQuests.quests.filter(
    (q) => progress.daily?.[q.id]?.completed && !progress.daily?.[q.id]?.claimedAt
  ).length;

  return (
    <div className="bg-gray-800 border-2 border-gray-700 rounded-lg p-4 shadow-lg">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          📜 Daily Quests
          {unclaimedCount > 0 && (
            <span className="bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold animate-pulse">
              {unclaimedCount}
            </span>
          )}
        </h3>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-gray-400 hover:text-white transition"
        >
          {expanded ? '▼' : '▶'}
        </button>
      </div>

      {/* Compact Progress */}
      <div className="mb-2">
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>Progress</span>
          <span>{completedCount}/{dailyQuests.quests.length}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${(completedCount / dailyQuests.quests.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Expanded View */}
      {expanded && (
        <div className="space-y-2 mt-4">
          {dailyQuests.quests.map((quest) => {
            const questProgress = progress.daily?.[quest.id];
            const progressPercent = questProgress
              ? Math.min(100, (questProgress.current / quest.objective.target) * 100)
              : 0;

            return (
              <div key={quest.id} className="bg-gray-900 p-3 rounded">
                <div className="flex justify-between items-center mb-1">
                  <div className="text-sm font-bold text-white">{quest.name}</div>
                  <div className="text-xs text-gray-400">
                    {questProgress?.current || 0}/{quest.objective.target}
                  </div>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-full transition-all ${
                      questProgress?.completed ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                {questProgress?.completed && !questProgress?.claimedAt && (
                  <div className="text-xs text-yellow-400 mt-1">✨ Ready to claim!</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* View All Button */}
      <button
        onClick={() => navigate('/quests')}
        className="w-full mt-3 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded font-bold text-sm transition"
      >
        View All Quests →
      </button>
    </div>
  );
};

export default QuestTracker;
