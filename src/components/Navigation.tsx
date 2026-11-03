import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { loginWithTwitch } from '../utils/twitchOAuth';
import logo from '../Logos/TheNeverEndingWarLogo.png';
import { useHeroListener } from '../hooks/useHeroListener';
import { questAPI } from '../api/client';
import { getStoredSelectedHeroId } from '../utils/selectedHeroStorage';

// Cache quest templates per hero tier — keyed by hero doc id
const questCacheByHero = new Map<
  string,
  { daily: unknown; weekly: unknown; monthly: unknown; timestamp: number }
>();
const QUEST_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getCachedQuests(heroId: string | null) {
  if (!heroId) {
    return { daily: null, weekly: null, monthly: null };
  }

  const now = Date.now();
  const cached = questCacheByHero.get(heroId);
  if (cached && now - cached.timestamp < QUEST_CACHE_DURATION) {
    return { daily: cached.daily, weekly: cached.weekly, monthly: cached.monthly };
  }

  const [daily, weekly, monthly] = await Promise.all([
    questAPI.getDailyQuests(heroId),
    questAPI.getWeeklyQuests(heroId),
    questAPI.getMonthlyQuests(heroId),
  ]);

  questCacheByHero.set(heroId, { daily, weekly, monthly, timestamp: now });
  return { daily, weekly, monthly };
}

export default function Navigation() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const twitchUserId = user?.twitchId || user?.id || null;
  const [selectedHeroDocId, setSelectedHeroDocId] = useState<string | null>(() =>
    getStoredSelectedHeroId(twitchUserId)
  );

  useEffect(() => {
    setSelectedHeroDocId(getStoredSelectedHeroId(twitchUserId));
  }, [twitchUserId]);

  useEffect(() => {
    if (!twitchUserId) return;

    const onStorage = (event: StorageEvent) => {
      if (event.key === `selectedHeroId_${twitchUserId}`) {
        setSelectedHeroDocId(event.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [twitchUserId]);

  // Same-tab hero picker updates (storage event only fires across tabs)
  useEffect(() => {
    if (!twitchUserId) return;
    const interval = setInterval(() => {
      const stored = getStoredSelectedHeroId(twitchUserId);
      setSelectedHeroDocId((prev) => (prev === stored ? prev : stored));
    }, 2000);
    return () => clearInterval(interval);
  }, [twitchUserId]);

  const { questProgress, getUnclaimedQuestCount } = useHeroListener(selectedHeroDocId);
  const [unclaimedQuestsCount, setUnclaimedQuestsCount] = useState(0);
  const [questTemplates, setQuestTemplates] = useState<{
    daily: unknown;
    weekly: unknown;
    monthly: unknown;
  } | null>(null);

  const loadQuestTemplates = useCallback(async (heroId: string | null) => {
    if (!heroId) {
      setQuestTemplates(null);
      return;
    }
    try {
      const quests = await getCachedQuests(heroId);
      setQuestTemplates(quests);
    } catch (err) {
      console.error('[Navigation] Failed to load quest templates:', err);
      setQuestTemplates(null);
    }
  }, []);

  useEffect(() => {
    loadQuestTemplates(selectedHeroDocId);
  }, [selectedHeroDocId, loadQuestTemplates]);

  useEffect(() => {
    if (!questProgress || !questTemplates) {
      setUnclaimedQuestsCount(0);
      return;
    }

    const count = getUnclaimedQuestCount(
      questTemplates.daily,
      questTemplates.weekly,
      questTemplates.monthly
    );
    setUnclaimedQuestsCount(count);
  }, [questProgress, questTemplates, getUnclaimedQuestCount]);

  return (
    <nav className="bg-gray-900 border-b border-gray-800 shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <button onClick={() => navigate('/')} className="flex items-center gap-2">
              <img src={logo} alt="The Never Ending War" className="h-12" />
              <span className="px-2 py-1 text-xs font-bold text-white bg-orange-600 rounded-md border border-orange-500">
                BETA
              </span>
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
                onClick={() => navigate('/faq')}
                className="text-cyan-400 hover:text-cyan-300 transition-colors font-semibold"
              >
                FAQ
              </button>
              <button
                onClick={() => navigate('/store')}
                className="text-yellow-400 hover:text-yellow-300 transition-colors font-semibold"
              >
                🏪 Store
              </button>
              <button
                onClick={() => navigate('/founders-pack')}
                className="text-purple-400 hover:text-purple-300 transition-colors font-semibold"
              >
                ⭐ Founders Pack
              </button>
              <button
                onClick={() => navigate('/founders-hall')}
                className="text-yellow-400 hover:text-yellow-300 transition-colors font-semibold"
              >
                🏛️ Founders Hall
              </button>
              {isAuthenticated && (
                <>
                  <button
                    onClick={() => navigate('/portal')}
                    className="text-purple-400 hover:text-purple-300 transition-colors font-semibold"
                  >
                    Portal
                  </button>
                  <button
                    onClick={() => navigate('/leaderboards')}
                    className="text-cyan-400 hover:text-cyan-300 transition-colors font-semibold"
                  >
                    Leaderboards
                  </button>
                  {user?.twitchUsername?.toLowerCase() === 'theneverendingwar' && (
                    <button
                      onClick={() => navigate('/reports')}
                      className="text-red-400 hover:text-red-300 transition-colors font-semibold"
                    >
                      Reports
                    </button>
                  )}
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
              <button
                onClick={loginWithTwitch}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold transition-colors"
              >
                Log in with Twitch
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
