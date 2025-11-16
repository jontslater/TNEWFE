import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { loginWithTwitch } from '../utils/twitchOAuth';
import { initiateTikTokLogin } from '../services/tiktokOAuth';
import logo from '../logos/TheNeverEndingWarLogo.png';
import { useHeroListener } from '../hooks/useHeroListener';
import { questAPI } from '../api/client';

// Cache quest templates - these don't change frequently
let questCache: { daily: any; weekly: any; monthly: any; timestamp: number } | null = null;
const QUEST_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getCachedQuests() {
  const now = Date.now();
  
  // Return cached quests if still valid
  if (questCache && (now - questCache.timestamp) < QUEST_CACHE_DURATION) {
    return {
      daily: questCache.daily,
      weekly: questCache.weekly,
      monthly: questCache.monthly
    };
  }
  
  // Fetch fresh quests and cache them
  const [daily, weekly, monthly] = await Promise.all([
    questAPI.getDailyQuests(),
    questAPI.getWeeklyQuests(),
    questAPI.getMonthlyQuests()
  ]);
  
  questCache = { daily, weekly, monthly, timestamp: now };
  return { daily, weekly, monthly };
}

export default function Navigation() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const { questProgress, getUnclaimedQuestCount } = useHeroListener(user?.id || null);
  const [unclaimedQuestsCount, setUnclaimedQuestsCount] = useState(0);
  const [questTemplates, setQuestTemplates] = useState<{ daily: any; weekly: any; monthly: any } | null>(null);

  // Load quest templates once on mount
  useEffect(() => {
    getCachedQuests().then(quests => {
      setQuestTemplates(quests);
    });
  }, []);

  // Calculate unclaimed count when quest progress or templates change
  useEffect(() => {
    if (!questProgress || !questTemplates) {
      setUnclaimedQuestsCount(0);
      return;
    }

    const count = getUnclaimedQuestCount(questTemplates.daily, questTemplates.weekly, questTemplates.monthly);
    setUnclaimedQuestsCount(count);
  }, [questProgress, questTemplates, getUnclaimedQuestCount]);

  return (
    <nav className="bg-gray-900 border-b border-gray-800 shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <button onClick={() => navigate('/')} className="flex items-center">
              <img src={logo} alt="The Never Ending War" className="h-12" />
            </button>
            
            <div className="flex space-x-6">
              <button
                onClick={() => navigate('/classes')}
                className="text-gray-300 hover:text-white transition-colors font-semibold"
              >
                Classes
              </button>
              <button
                onClick={() => navigate('/professions')}
                className="text-gray-300 hover:text-white transition-colors font-semibold"
              >
                Professions
              </button>
              <button
                onClick={() => navigate('/raids')}
                className="text-gray-300 hover:text-white transition-colors font-semibold"
              >
                Raids
              </button>
              <button
                onClick={() => navigate('/store')}
                className="text-yellow-400 hover:text-yellow-300 transition-colors font-semibold"
              >
                🏪 Store
              </button>
              {isAuthenticated && (
                <>
                  <button
                    onClick={() => navigate('/quests')}
                    className="text-orange-400 hover:text-orange-300 transition-colors font-semibold relative"
                  >
                    📜 Quests
                    {unclaimedQuestsCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {unclaimedQuestsCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => navigate('/portal')}
                    className="text-purple-400 hover:text-purple-300 transition-colors font-semibold"
                  >
                    Portal
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <span className="text-gray-300">
                  {user?.twitchUsername}
                </span>
                <button
                  onClick={logout}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={loginWithTwitch}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold transition-colors"
                >
                  Twitch
                </button>
                <button
                  onClick={initiateTikTokLogin}
                  className="bg-black hover:bg-gray-900 text-white px-4 py-2 rounded-lg font-bold transition-colors border border-cyan-400"
                >
                  TikTok
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
