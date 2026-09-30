import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useHero } from '../hooks/useHero';
import { useAllHeroes } from '../hooks/useAllHeroes';
import { useGuild } from '../hooks/useGuild';
import { raidAPI, heroAPI, foundersPackAPI } from '../api/client';
import { Raid, WorldBoss, Item } from '../types/Raid';
import HeroDashboard from '../components/HeroDashboard';
import ProfessionPanel from '../components/ProfessionPanel';
import GuildPanel from '../components/GuildPanel';
import RaidBrowser from '../components/RaidBrowser';
import InventoryManager from '../components/InventoryManager';
import CraftingStation from '../components/CraftingStation';
import QuestTracker from '../components/QuestTracker';
import LoginRewardModal from '../components/LoginRewardModal';
import AchievementsPanel from '../components/AchievementsPanel';
import { loginWithTwitch } from '../utils/twitchOAuth';
import { Hero } from '../types/Hero';
import SkillsPage from './SkillsPage';
import { dungeonAPI, loginRewardAPI } from '../api/client';
import { getItemScore } from '../utils/format';
import { CLASS_DATA } from '../data/classData';
import { generateBrowserSourceUrl } from '../utils/browserSource';
import BrowserSourceTab from '../components/BrowserSourceTab';
import AuctionHousePage from './AuctionHousePage';
import QuestsPage from './QuestsPage';
import SocialSidebar from '../components/SocialSidebar';
import PrestigeStore from '../components/PrestigeStore';

export default function PlayerPortal() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const isAdmin = user?.twitchUsername?.toLowerCase() === 'theneverendingwar';
  // Use Twitch ID to resolve all heroes for this account
  const { hero, heroes, loading: heroLoading, refetch: refetchHero, deleteHero, selectHero } = useHero(user?.twitchId || null);
  const { heroes: allHeroes, loading: allHeroesLoading, refetch: refetchAllHeroes } = useAllHeroes(isAdmin);
  // Use hero ID for guild (hero-based guild system)
  const { guild, loading: guildLoading, refetch: refetchGuild } = useGuild(hero?.id || null);
  const [raids, setRaids] = useState<Raid[]>([]);
  const [worldBoss, setWorldBoss] = useState<WorldBoss | null>(null);
  const [activeTab, setActiveTab] = useState<'hero' | 'inventory' | 'profession' | 'guild' | 'raids' | 'skills' | 'dungeon' | 'browserSource' | 'achievements' | 'allHeroes' | 'auction' | 'quests' | 'prestige'>('hero');
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [adminSelectedHero, setAdminSelectedHero] = useState<Hero | null>(null);
  const [testHeroId, setTestHeroId] = useState<string>('9CcbfbvtTt3ckqyn7sBH'); // Dingo Dynasty hero ID
  const [testHero, setTestHero] = useState<Hero | null>(null);
  const [loadingTestHero, setLoadingTestHero] = useState(false);
  const [showLoginReward, setShowLoginReward] = useState(false);
  const [loginRewardStatus, setLoginRewardStatus] = useState<any>(null);
  const [dungeonQueueStatus, setDungeonQueueStatus] = useState<any>(null);
  const [grantingFounderPack, setGrantingFounderPack] = useState<{ userId: string; tier: string } | null>(null);
  const [whisperRequest, setWhisperRequest] = useState<{ heroId: string; heroName: string } | null>(null);

  // Refresh guild data when switching to guild tab (to catch application approvals)
  // Use a ref to track if we've already refreshed for this tab switch
  const prevActiveTabRef = useRef(activeTab);
  useEffect(() => {
    // Only refresh if we just switched TO the guild tab (not if we're already on it)
    if (activeTab === 'guild' && prevActiveTabRef.current !== 'guild' && hero?.id) {
      refetchGuild();
    }
    prevActiveTabRef.current = activeTab;
  }, [activeTab, hero?.id]); // Removed refetchGuild from dependencies to prevent loops
  
  // Handle navigation state and URL params (for setting active tab from other pages)
  useEffect(() => {
    const state = location.state as any;
    if (state?.activeTab) {
      setActiveTab(state.activeTab);
    }
    // Also check URL query params
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['hero', 'inventory', 'profession', 'guild', 'raids', 'skills', 'dungeon', 'browserSource', 'achievements', 'allHeroes', 'auction', 'quests', 'prestige'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
    
    // Handle guild invite link
    const guildInviteParam = params.get('guildInvite');
    if (guildInviteParam && hero) {
      // Switch to guild tab and show invite acceptance
      setActiveTab('guild');
      // Store the invite ID (not guild ID) for GuildPanel to handle
      sessionStorage.setItem('pendingGuildInvite', guildInviteParam);
      // Clean up URL
      const newParams = new URLSearchParams(params);
      newParams.delete('guildInvite');
      navigate({ search: newParams.toString() }, { replace: true });
    }
  }, [location.state, location.search, hero, navigate]);

  const groupedAllHeroes = useMemo(() => {
    const groups = new Map<string, { twitchId: string; label: string; heroes: Hero[] }>();
    allHeroes.forEach((h: any) => {
      const twitchId = h.twitchUserId ? String(h.twitchUserId) : 'UNKNOWN';
      const label = h.name || twitchId || 'Unknown User';
      const key = twitchId;
      if (!groups.has(key)) {
        groups.set(key, { twitchId, label, heroes: [] });
      }
      groups.get(key)!.heroes.push(h);
    });
    // Sort each group's heroes by role then level desc
    for (const group of groups.values()) {
      group.heroes.sort((a, b) => {
        const roleA = (a.role || '').toLowerCase();
        const roleB = (b.role || '').toLowerCase();
        if (roleA < roleB) return -1;
        if (roleA > roleB) return 1;
        return (b.level || 0) - (a.level || 0);
      });
    }
    // Return as sorted array by label
    return Array.from(groups.values()).sort((a, b) =>
      a.label.toLowerCase().localeCompare(b.label.toLowerCase())
    );
  }, [allHeroes]);

  useEffect(() => {
    if (isAuthenticated) {
      loadRaids();
      loadWorldBoss();
      // Check if login reward should be shown
      checkLoginReward();
    }
  }, [isAuthenticated, user]);

  const checkLoginReward = async () => {
    // Use twitchId as the OAuth ID (primary identifier)
    const userId = user?.twitchId || user?.id;
    if (!userId) return;
    
    try {
      const status = await loginRewardAPI.getStatus(userId, 'twitch');
      setLoginRewardStatus(status);
      if (status?.canClaim) {
        setShowLoginReward(true);
      }
    } catch (err: any) {
      // Handle 404 gracefully - treat as "can claim" if user exists
      if (err.response?.status === 404) {
        // User exists but no hero/login reward data yet - allow claim
        setLoginRewardStatus({
          canClaim: true,
          lastLoginDate: null,
          rewardStreak: 0,
          totalLoginDays: 0,
          currentRewardDay: 1,
          nextReward: null
        });
      }
      // Silently fail for other errors - don't show modal
    }
  };

  const checkDungeonQueue = async () => {
    if (!user?.id) return;
    try {
      const status = await dungeonAPI.getQueueStatus(user.id);
      setDungeonQueueStatus(status);
    } catch (err) {
      // Silently fail
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      checkDungeonQueue();
      // Poll every 10 seconds (reduced from 5s to minimize server load)
      const interval = setInterval(checkDungeonQueue, 10000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user]);

  const loadRaids = async () => {
    try {
      const data = await raidAPI.getRaids();
      setRaids(data);
    } catch (err) {
      console.error('Failed to load raids', err);
    }
  };

  const loadWorldBoss = async () => {
    try {
      const data = await raidAPI.getWorldBoss();
      setWorldBoss(data);
    } catch (err) {
      console.error('Failed to load world boss', err);
    }
  };

  // Debug: Log hero data when it changes (MUST be before early returns to follow Rules of Hooks)
  useEffect(() => {
    if (hero) {
      console.log('[PlayerPortal] Hero loaded:', {
        id: hero.id,
        name: hero.name,
        role: hero.role,
        level: hero.level,
        hasStats: !!hero.stats,
        hasEquipment: !!hero.equipment,
        twitchUserId: (hero as any).twitchUserId,
        allKeys: Object.keys(hero)
      });
      
      // Check for missing critical fields
      const criticalFields = ['id', 'name', 'role', 'level'];
      const missing = criticalFields.filter(field => !hero[field as keyof Hero]);
      if (missing.length > 0) {
        console.error('[PlayerPortal] ⚠️ Hero missing critical fields:', missing, hero);
      }
    }
  }, [hero]);

  // Debug: Fetch the specific "Dingo Dynasty" hero by ID (MUST be before early returns to follow Rules of Hooks)
  useEffect(() => {
    const debugHeroId = '9CcbfbvtTt3ckqyn7sBH';
    if (isAdmin) {
      heroAPI.getHeroById(debugHeroId)
        .then(hero => {
          console.log('[PlayerPortal] 🔍 DEBUG: Fetched Dingo Dynasty hero:', {
            id: hero.id,
            name: hero.name,
            role: hero.role,
            level: hero.level,
            twitchUserId: (hero as any).twitchUserId,
            twitchId: (hero as any).twitchId,
            hasStats: !!hero.stats,
            hasEquipment: !!hero.equipment,
            stats: hero.stats,
            equipment: hero.equipment,
            allFields: Object.keys(hero),
            fullHero: hero
          });
        })
        .catch(err => {
          console.error('[PlayerPortal] ❌ Failed to fetch Dingo Dynasty hero:', err);
        });
    }
     
  }, [isAdmin]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-4">Player Portal</h1>
          <p className="text-xl text-gray-400 mb-8">Login Required</p>
          <button 
            onClick={loginWithTwitch}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-4 rounded-lg text-lg transition-colors"
          >
            Login with Twitch
          </button>
        </div>
      </div>
    );
  }

  if (heroLoading || guildLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  if (!hero) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="absolute top-4 right-4">
            <button 
              onClick={logout}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
            >
              Logout
            </button>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">No Hero Found</h2>
          <p className="text-gray-400 mb-6">Create your hero to begin your adventure!</p>
          <button
            onClick={() => navigate('/create-hero')}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-4 rounded-lg text-lg transition-colors"
          >
            Create Hero
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h1 className="text-2xl font-bold text-white">Player Portal</h1>
            <nav className="flex space-x-4">
              <button
                onClick={() => navigate('/')}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => navigate('/classes')}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Classes
              </button>
              <button
                onClick={() => navigate('/professions')}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Professions
              </button>
              <button
                onClick={() => navigate('/raids')}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Raids
              </button>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            {loginRewardStatus?.canClaim && (
              <button
                onClick={() => setShowLoginReward(true)}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded transition-colors flex items-center gap-2"
              >
                <span>🎁</span>
                <span>Daily Reward</span>
                {loginRewardStatus?.consecutiveDays > 0 && (
                  <span className="text-xs bg-yellow-700 px-2 py-0.5 rounded">
                    {loginRewardStatus.consecutiveDays} day streak
                  </span>
                )}
              </button>
            )}
            {dungeonQueueStatus?.inQueue && (
              <div className="bg-orange-600 text-white px-4 py-2 rounded flex items-center gap-2">
                <span>⚔️</span>
                <span>In Queue</span>
              </div>
            )}
            <button
              onClick={() => navigate('/purchases/history')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
            >
              Purchase History
            </button>
            <button
              onClick={() => navigate('/report-issue')}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded transition-colors"
            >
              Report Issue
            </button>
            <span className="text-gray-300">Welcome, {user?.twitchUsername}</span>
            <button 
              onClick={logout}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4">
          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab('hero')}
              className={`px-6 py-4 font-semibold transition-colors border-b-2 ${
                activeTab === 'hero'
                  ? 'text-blue-400 border-blue-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              Hero
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-6 py-4 font-semibold transition-colors border-b-2 ${
                activeTab === 'inventory'
                  ? 'text-yellow-400 border-yellow-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              Inventory
            </button>
            <button
              onClick={() => setActiveTab('profession')}
              className={`px-6 py-4 font-semibold transition-colors border-b-2 ${
                activeTab === 'profession'
                  ? 'text-green-400 border-green-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              Profession
            </button>
            <button
              onClick={() => setActiveTab('guild')}
              className={`px-6 py-4 font-semibold transition-colors border-b-2 ${
                activeTab === 'guild'
                  ? 'text-purple-400 border-purple-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              Guild
            </button>
            <button
              onClick={() => setActiveTab('raids')}
              className={`px-6 py-4 font-semibold transition-colors border-b-2 ${
                activeTab === 'raids'
                  ? 'text-red-400 border-red-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              Raids
            </button>
            <button
              onClick={() => setActiveTab('skills')}
              className={`px-6 py-4 font-semibold transition-colors border-b-2 ${
                activeTab === 'skills'
                  ? 'text-indigo-400 border-indigo-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              Skills
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              className={`px-6 py-4 font-semibold transition-colors border-b-2 ${
                activeTab === 'achievements'
                  ? 'text-amber-400 border-amber-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              Achievements
            </button>
            <button
              onClick={() => setActiveTab('dungeon')}
              className={`px-6 py-4 font-semibold transition-colors border-b-2 relative ${
                activeTab === 'dungeon'
                  ? 'text-orange-400 border-orange-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              Dungeon Finder
              {dungeonQueueStatus?.inQueue && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('browserSource')}
              className={`px-6 py-4 font-semibold transition-colors border-b-2 ${
                activeTab === 'browserSource'
                  ? 'text-cyan-400 border-cyan-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              Browser Source
            </button>
            <button
              onClick={() => setActiveTab('auction')}
              className={`px-6 py-4 font-semibold transition-colors border-b-2 ${
                activeTab === 'auction'
                  ? 'text-emerald-400 border-emerald-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              Auction House
            </button>
            <button
              onClick={() => setActiveTab('quests')}
              className={`px-6 py-4 font-semibold transition-colors border-b-2 relative ${
                activeTab === 'quests'
                  ? 'text-orange-400 border-orange-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              Quests
            </button>
            <button
              onClick={() => setActiveTab('prestige')}
              className={`px-6 py-4 font-semibold transition-colors border-b-2 ${
                activeTab === 'prestige'
                  ? 'text-amber-400 border-amber-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              ⭐ Prestige Store
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab('allHeroes')}
                className={`px-6 py-4 font-semibold transition-colors border-b-2 ${
                  activeTab === 'allHeroes'
                    ? 'text-pink-400 border-pink-400'
                    : 'text-gray-400 border-transparent hover:text-gray-300'
                }`}
              >
                All Heroes
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Social Sidebar (Party & Chat) - Right side, always visible except on auction/quests */}
          {activeTab !== 'auction' && activeTab !== 'quests' && (
            <div className="lg:col-span-3 order-3 lg:order-3">
              <SocialSidebar 
                hero={hero}
                onPartyUpdate={() => {
                  // Refresh party data if needed
                }}
                whisperRequest={whisperRequest}
                onWhisperRequestHandled={() => setWhisperRequest(null)}
              />
            </div>
          )}
          {/* Hero List Sidebar - Left side, hidden on auction and quests tabs */}
          {heroes && heroes.length > 0 && activeTab !== 'auction' && activeTab !== 'quests' && (
            <div className="lg:col-span-3 space-y-4 order-1 lg:order-1">
              <div className="bg-gray-800 rounded-lg p-5 border border-gray-700 sticky top-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Your Heroes</h2>
                  <span className="text-sm text-gray-400 font-semibold">
                    {heroes.length}/20
                  </span>
                </div>
                {heroes.length < 20 && (
                  <button
                    onClick={() => navigate('/create-hero')}
                    className="w-full mb-4 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105"
                  >
                    + Create Hero
                  </button>
                )}
                <div className="space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto">
                  {heroes.map((h, idx) => {
                    const isSelected = h.id === hero.id;
                    const key = `${h.id}-${(h as any).characterId || h.role || idx}`;
                    const classInfo = CLASS_DATA.find(c => c.key === h.role);
                    const category = classInfo?.category || getCategoryFromRole(h.role);
                    const gearScore = getItemScore(h.equipment || {}, h.role);
                    const isPinned = (h as any).pinned || false;
                    const categoryColors = {
                      tank: 'bg-blue-600 text-blue-100',
                      healer: 'bg-green-600 text-green-100',
                      dps: 'bg-red-600 text-red-100'
                    };
                    const categoryLabels = {
                      tank: 'Tank',
                      healer: 'Healer',
                      dps: 'DPS'
                    };
                    
                    return (
                      <div
                        key={key}
                        onClick={() => selectHero(h.id)}
                        className={`cursor-pointer bg-gray-900 rounded-lg p-4 border transition-all relative ${
                          isSelected
                            ? 'border-blue-500 shadow-lg ring-2 ring-blue-500/50'
                            : 'border-gray-700 hover:border-blue-400 hover:shadow'
                        }`}
                      >
                        {isPinned && (
                          <div className="absolute top-2 right-2 text-yellow-400 text-lg" title="Pinned">
                            📌
                          </div>
                        )}
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-base font-semibold text-white truncate pr-2">{h.name}</div>
                          <span className="text-gray-400 text-sm font-semibold whitespace-nowrap">Lv {h.level ?? 1}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${categoryColors[category as keyof typeof categoryColors]}`}>
                            {categoryLabels[category as keyof typeof categoryLabels]}
                          </span>
                          <span className="px-2 py-1 rounded bg-gray-700 text-gray-200 text-xs font-medium">
                            {h.role}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                          <div className="text-center">
                            <div className="text-yellow-400 font-semibold">
                              {Math.round(Number(h.maxHp ?? 0) || 0).toLocaleString()}
                            </div>
                            <div className="text-gray-500 text-[10px]">HP</div>
                          </div>
                          <div className="text-center">
                            <div className="text-blue-400 font-semibold">
                              {(Number(h.attack ?? 0) || 0).toLocaleString()}
                            </div>
                            <div className="text-gray-500 text-[10px]">ATK</div>
                          </div>
                          <div className="text-center">
                            <div className="text-green-400 font-semibold">
                              {(Number(h.defense ?? 0) || 0).toLocaleString()}
                            </div>
                            <div className="text-gray-500 text-[10px]">DEF</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs mb-2 pt-2 border-t border-gray-700">
                          <span className="text-gray-400">Gear Score:</span>
                          <span className="text-yellow-400 font-semibold">⚡ {(Number(gearScore ?? 0) || 0).toLocaleString()}</span>
                        </div>
                        {isSelected && (
                          <div className="mt-2 pt-2 border-t border-gray-700">
                            <span className="text-xs text-blue-400 font-semibold">✓ Active Hero</span>
                          </div>
                        )}
                        <div className="mt-2 flex gap-2">
                          {!isSelected && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                selectHero(h.id);
                              }}
                              className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                            >
                              Switch
                            </button>
                          )}
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await heroAPI.pinHero(h.id);
                                refetchHero();
                              } catch (err) {
                                console.error('Failed to pin hero:', err);
                              }
                            }}
                            className={`px-3 py-1.5 text-xs rounded transition-colors ${
                              isPinned
                                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                            }`}
                            title={isPinned ? 'Unpin hero' : 'Pin hero'}
                          >
                            {isPinned ? '📌' : '📌'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          
          {/* Main Content Area */}
          <div className={`space-y-6 order-2 lg:order-2 ${
            (heroes && heroes.length > 0 && activeTab !== 'auction' && activeTab !== 'quests') 
              ? 'lg:col-span-6' 
              : activeTab === 'auction' || activeTab === 'quests'
              ? 'lg:col-span-12'
              : 'lg:col-span-9'
          }`}>
            {activeTab === 'hero' && (
              <HeroDashboard 
                hero={hero} 
                onHeroUpdate={async (updatedHero: Hero) => {
                  // Update the current hero if it's the one being updated
                  if (hero?.id === updatedHero.id) {
                    // Use selectHero to update and persist the selection
                    // This will update the hero state and save to localStorage
                    selectHero(updatedHero.id);
                    // Then refetch to get the latest data from the backend
                    await refetchHero();
                  }
                }}
                onHeroDelete={async () => {
                  await refetchHero();
                  // If the deleted hero was the current hero, select the next one
                  if (heroes.length > 1) {
                    const remainingHeroes = heroes.filter(h => h.id !== hero.id);
                    if (remainingHeroes.length > 0) {
                      selectHero(remainingHeroes[0].id);
                    }
                  }
                }}
              />
            )}
        {activeTab === 'inventory' && (
          <InventoryManager 
            hero={hero} 
            userId={user?.id}
            onUpdate={refetchHero}
            onEquipChange={async (slot, item) => {
              const heroId = hero?.id || user?.id;
              if (!heroId) return;
              try {
                if (item) {
                  await heroAPI.equipItem(heroId, slot, item);
                } else {
                  await heroAPI.unequipItem(heroId, slot);
                }
                // Small delay to ensure backend has processed
                await new Promise(resolve => setTimeout(resolve, 100));
                await refetchHero();
              } catch (error) {
                console.error('Error equipping/unequipping item:', error);
                // Still refetch to show current state
                await refetchHero();
              }
            }}
            onApplyUpgrade={async (itemId, equipmentSlot) => {
              const heroId = hero?.id || user?.id;
              if (!heroId) return;
              try {
                await heroAPI.applyUpgrade(heroId, itemId, equipmentSlot);
                refetchHero();
              } catch (error: any) {
                alert(error.response?.data?.error || 'Failed to apply upgrade');
              }
            }}
            onUpgradeItem={async (itemId, selectedStats) => {
              const heroId = hero?.id || user?.id;
              if (!heroId) return;
              console.log(`[Upgrade] Starting upgrade for item ${itemId} with stats:`, selectedStats);
              try {
                const result = await heroAPI.upgradeItem(heroId, itemId, selectedStats);
                console.log(`[Upgrade] API response:`, result);
                if (result.success) {
                  console.log(`[Upgrade] ✅ Upgrade successful!`);
                  console.log(`[Upgrade] Upgraded item data:`, result.item);
                  console.log(`[Upgrade] Item upgradeLevel:`, result.item?.upgradeLevel);
                  console.log(`[Upgrade] Item upgradeStats:`, result.item?.upgradeStats);
                  // Update hero gold if returned
                  if (result.newGold !== undefined) {
                    // Gold will be updated when we refetch
                  }
                  await refetchHero();
                } else {
                  console.error(`[Upgrade] ❌ Upgrade failed:`, result.message);
                  alert(result.message || 'Failed to upgrade item');
                }
              } catch (error: any) {
                console.error(`[Upgrade] ❌ Error upgrading item:`, error);
                alert(error.response?.data?.error || 'Failed to upgrade item. Please try again.');
              }
            }}
          />
        )}
        {activeTab === 'profession' && (
          <CraftingStation
            hero={hero}
            onChooseProfession={async (type) => {
              const heroId = hero?.id || user?.id;
              if (!heroId) return;
              console.log('Choosing profession:', { heroId, type });
              try {
                const result = await heroAPI.chooseProfession(heroId, type);
                console.log('Profession result:', result);
                refetchHero();
              } catch (error: any) {
                console.error('Failed to choose profession:', error);
                alert(error.response?.data?.error || 'Failed to choose profession');
              }
            }}
            onCraft={async (recipeKey, cost, tier, quantity) => {
              const heroId = hero?.id || user?.id;
              if (!heroId) return;
              try {
                const result = await heroAPI.craftElixir(heroId, recipeKey, cost, tier, quantity);
                if (result.leveledUp) {
                  alert(`🎉 Profession Level Up! Now level ${result.profession.level}!`);
                }
                refetchHero();
              } catch (error: any) {
                alert(error.response?.data?.error || 'Failed to craft item');
              }
            }}
            onUse={async (itemKey) => {
              const heroId = hero?.id || user?.id;
              if (!heroId) return;
              await heroAPI.useElixir(heroId, itemKey);
              refetchHero();
            }}
          />
        )}
            {activeTab === 'guild' && (
              <GuildPanel 
                guild={guild} 
                refetchGuild={refetchGuild}
                heroes={heroes} // Pass all user's heroes for invite selection
                onStartWhisper={(heroId, heroName) => {
                  setWhisperRequest({ heroId, heroName });
                  setActiveTab('hero'); // Switch to hero tab where SocialSidebar is visible
                }}
              />
            )}
            {activeTab === 'raids' && <RaidBrowser hero={hero} userId={hero?.id || user?.id} />}
            {activeTab === 'skills' && <SkillsPage hero={hero} userId={user?.id} />}
            {activeTab === 'achievements' && <AchievementsPanel hero={hero} onUpdate={refetchHero} />}
            {activeTab === 'dungeon' && <DungeonFinderTab hero={hero} userId={user?.id} queueStatus={dungeonQueueStatus} onQueueChange={checkDungeonQueue} />}
            {activeTab === 'browserSource' && (
              <BrowserSourceTab 
                userId={user?.twitchId || user?.id} 
                token={localStorage.getItem('auth_token')}
              />
            )}
            {activeTab === 'quests' && (
              <QuestsPage />
            )}
            {activeTab === 'prestige' && hero && (
              <PrestigeStore hero={hero} onUpdate={refetchHero} />
            )}
            {activeTab === 'auction' && (
              <div className="space-y-4">
                {/* Compact Hero Selector for Auction House */}
                {heroes && heroes.length > 0 ? (
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <label className="block text-gray-400 mb-2 text-sm font-semibold">
                      {heroes.length > 1 ? 'Select Hero' : 'Current Hero'}
                    </label>
                    <select
                      value={hero?.id || ''}
                      onChange={(e) => selectHero(e.target.value)}
                      disabled={heroes.length === 1}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {heroes.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name} (Level {h.level || 1}) {h.role ? `- ${h.role}` : ''}
                        </option>
                      ))}
                    </select>
                    {hero && (
                      <div className="mt-2 text-xs text-gray-500">
                        Viewing inventory for: <span className="text-blue-400">{hero.name}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="text-gray-400 text-sm">No heroes available. Create a hero to use the auction house.</div>
                  </div>
                )}
                {hero && (
                  <AuctionHousePage heroId={hero.id} />
                )}
              </div>
            )}

            {activeTab === 'allHeroes' && isAdmin && (
              <div className="mt-4 space-y-6">
                {/* Test Hero Loader - For debugging specific heroes */}
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h3 className="text-lg font-bold text-white mb-3">🔍 Test Hero by ID</h3>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={testHeroId}
                      onChange={(e) => setTestHeroId(e.target.value)}
                      placeholder="Enter hero ID..."
                      className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={async () => {
                        if (!testHeroId.trim()) return;
                        setLoadingTestHero(true);
                        try {
                          const hero = await heroAPI.getHeroById(testHeroId.trim());
                          setTestHero(hero);
                          console.log('[Test Hero] Loaded hero:', {
                            id: hero.id,
                            name: hero.name,
                            role: hero.role,
                            level: hero.level,
                            twitchUserId: (hero as any).twitchUserId,
                            twitchId: (hero as any).twitchId,
                            hasStats: !!hero.stats,
                            hasEquipment: !!hero.equipment,
                            stats: hero.stats,
                            equipment: hero.equipment,
                            allFields: Object.keys(hero),
                            fullHero: hero
                          });
                        } catch (err: any) {
                          console.error('[Test Hero] Failed to load:', err);
                          alert(`Failed to load hero: ${err.response?.data?.error || err.message}`);
                          setTestHero(null);
                        } finally {
                          setLoadingTestHero(false);
                        }
                      }}
                      disabled={loadingTestHero || !testHeroId.trim()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded font-semibold transition-colors"
                    >
                      {loadingTestHero ? 'Loading...' : 'Load Hero'}
                    </button>
                    <button
                      onClick={() => {
                        setTestHeroId('9CcbfbvtTt3ckqyn7sBH');
                      }}
                      className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded font-semibold transition-colors"
                      title="Load Dingo Dynasty hero"
                    >
                      Dingo
                    </button>
                  </div>
                  {testHero && (
                    <div className="mt-3 p-3 bg-gray-900 rounded border border-gray-600">
                      <div className="text-sm text-white font-semibold mb-2">
                        {testHero.name} (Lv {testHero.level} {testHero.role})
                      </div>
                      <div className="text-xs text-gray-400 space-y-1">
                        <div>Hero ID: {testHero.id}</div>
                        <div>Twitch User ID: {(testHero as any).twitchUserId || 'Missing'}</div>
                        <div>Twitch ID: {(testHero as any).twitchId || 'Missing'}</div>
                        <div>Has Stats: {testHero.stats ? 'Yes' : 'No'}</div>
                        <div>Has Equipment: {testHero.equipment ? 'Yes' : 'No'}</div>
                        <div>Has Name: {testHero.name ? 'Yes' : 'No'}</div>
                        <div>Has Role: {testHero.role ? 'Yes' : 'No'}</div>
                        <div>Has Level: {testHero.level !== undefined && testHero.level !== null ? 'Yes' : 'No'}</div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => {
                            // Temporarily set this hero as the active hero to test their experience
                            console.log('[Test Hero] Setting as admin selected hero:', testHero);
                            setAdminSelectedHero(testHero);
                            alert(`Hero loaded! Scroll down to the "Selected Hero Details" section to see their dashboard. This will help identify what's causing the black screen.`);
                          }}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded font-semibold transition-colors"
                        >
                          View Hero Dashboard
                        </button>
                        <button
                          onClick={() => {
                            // Try to simulate what happens when this hero loads in the portal
                            console.log('[Test Hero] Simulating portal load for hero:', testHero);
                            
                            // Check for missing critical fields
                            const criticalFields = ['id', 'name', 'role', 'level'];
                            const missing = criticalFields.filter(field => !testHero[field as keyof Hero]);
                            
                            if (missing.length > 0) {
                              alert(`⚠️ CRITICAL: Hero is missing required fields: ${missing.join(', ')}\n\nThis will cause the black screen!`);
                            } else if (!testHero.stats) {
                              alert(`⚠️ WARNING: Hero is missing stats object. This may cause rendering issues.`);
                            } else if (!testHero.equipment) {
                              alert(`⚠️ WARNING: Hero is missing equipment object. This may cause rendering issues.`);
                            } else {
                              alert(`✅ Hero data looks complete. Check console for full details.`);
                            }
                            
                            // Log full hero structure
                            console.log('[Test Hero] Full hero structure:', JSON.stringify(testHero, null, 2));
                          }}
                          className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded font-semibold transition-colors"
                        >
                          Check for Issues
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {allHeroesLoading && (
                  <p className="text-gray-300 text-sm">Loading all heroes...</p>
                )}
                {!allHeroesLoading && groupedAllHeroes.length === 0 && (
                  <p className="text-gray-300 text-sm">No heroes found.</p>
                )}
                {!allHeroesLoading && groupedAllHeroes.length > 0 && (
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <h2 className="text-xl font-bold text-white mb-4">
                      All Heroes (Admin)
                    </h2>
                    <div className="flex flex-col lg:flex-row gap-4">
                      {/* Left: User + hero list */}
                      <div className="lg:w-2/3 space-y-4">
                      {groupedAllHeroes.map(group => {
                        const isExpanded = expandedUsers.has(group.twitchId);
                        return (
                          <div
                            key={group.twitchId}
                            className="bg-gray-900 rounded-lg border border-gray-700"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                const next = new Set(expandedUsers);
                                if (next.has(group.twitchId)) {
                                  next.delete(group.twitchId);
                                } else {
                                  next.add(group.twitchId);
                                }
                                setExpandedUsers(next);
                              }}
                              className="w-full flex items-center justify-between px-4 py-3 text-left"
                            >
                              <div>
                                <div className="font-bold text-white flex items-center gap-2">
                                  <span>{group.label}</span>
                                  <span className="text-xs text-gray-400">
                                    ({group.heroes.length} hero{group.heroes.length !== 1 ? 'es' : ''})
                                  </span>
                                  {group.heroes[0]?.founderPackTier && (
                                    <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                                      group.heroes[0].founderPackTier === 'platinum' ? 'bg-yellow-600 text-white' :
                                      group.heroes[0].founderPackTier === 'gold' ? 'bg-yellow-500 text-black' :
                                      group.heroes[0].founderPackTier === 'silver' ? 'bg-gray-400 text-black' :
                                      'bg-orange-600 text-white'
                                    }`}>
                                      {group.heroes[0].founderPackTier.toUpperCase()} Founder
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-400">
                                  Twitch ID: {group.twitchId}
                                </div>
                              </div>
                              <div className="text-gray-300 text-lg">
                                {isExpanded ? '▼' : '▶'}
                              </div>
                            </button>

                            {isExpanded && (
                              <div className="px-4 pb-4 pt-1 space-y-2">
                                {/* Founder Pack Grant Section */}
                                <div className="mb-4 p-3 bg-gray-800 rounded-lg border border-gray-600">
                                  <div className="text-xs font-semibold text-gray-300 mb-2">Grant Founder Pack</div>
                                  <div className="flex gap-2 flex-wrap">
                                    {['bronze', 'silver', 'gold', 'platinum'].map((tier) => {
                                      const isGranting = grantingFounderPack?.userId === group.twitchId && grantingFounderPack?.tier === tier;
                                      const currentTier = group.heroes[0]?.founderPackTier;
                                      const isCurrentTier = currentTier === tier;
                                      return (
                                        <button
                                          key={tier}
                                          type="button"
                                          disabled={isGranting || isCurrentTier}
                                          onClick={async () => {
                                            if (!window.confirm(`Grant ${tier.toUpperCase()} Founder Pack to ${group.label}? This will grant benefits to all their heroes.`)) {
                                              return;
                                            }
                                            setGrantingFounderPack({ userId: group.twitchId, tier });
                                            try {
                                              const result = await foundersPackAPI.setFounderStatus(group.twitchId, tier as any);
                                              alert(`✅ ${result.message}\nUpdated ${result.heroesUpdated} hero${result.heroesUpdated !== 1 ? 'es' : ''}`);
                                              await refetchAllHeroes();
                                              await refetchHero(); // Refresh current hero to show updated founder pack features
                                            } catch (error: any) {
                                              alert(`❌ Error: ${error.response?.data?.error || error.message}`);
                                            } finally {
                                              setGrantingFounderPack(null);
                                            }
                                          }}
                                          className={`text-xs px-3 py-1.5 rounded font-semibold transition-all ${
                                            isCurrentTier
                                              ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                                              : isGranting
                                              ? 'bg-gray-700 text-gray-400 cursor-wait'
                                              : tier === 'platinum'
                                              ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
                                              : tier === 'gold'
                                              ? 'bg-yellow-500 hover:bg-yellow-400 text-black'
                                              : tier === 'silver'
                                              ? 'bg-gray-400 hover:bg-gray-300 text-black'
                                              : 'bg-orange-600 hover:bg-orange-500 text-white'
                                          }`}
                                        >
                                          {isGranting ? 'Granting...' : isCurrentTier ? `Current: ${tier}` : `Grant ${tier}`}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  {group.heroes[0]?.founderPackTier && (
                                    <div className="text-xs text-gray-400 mt-2">
                                      Current: {group.heroes[0].founderPackTier.toUpperCase()} Founder Pack
                                    </div>
                                  )}
                                </div>
                                {group.heroes.map((h: any, idx: number) => {
                                  const key = `${h.id}-${h.characterId || h.role || idx}`;
                                  return (
                                    <div
                                      key={key}
                                      className="border border-gray-700 rounded-lg p-3 bg-gray-950 text-sm space-y-1"
                                    >
                                      <div className="flex justify-between items-center">
                                        <div>
                                          <div className="font-semibold text-white">
                                            {h.name} <span className="text-gray-400 text-xs">({h.role})</span>
                                          </div>
                                          <div className="text-xs text-gray-400">
                                            Lv {h.level} • Character ID: {h.characterId || 'n/a'}
                                          </div>
                                        </div>
                                        <div className="text-xs text-gray-300 text-right">
                                          <div>HP: {h.hp}/{h.maxHp}</div>
                                          <div>ATK: {h.attack} | DEF: {h.defense}</div>
                                        </div>
                                      </div>
                                      <div className="flex justify-between items-center mt-2">
                                        <button
                                          type="button"
                                          onClick={() => setAdminSelectedHero(h as Hero)}
                                          className="text-xs px-3 py-1 rounded bg-blue-700 hover:bg-blue-600 text-white"
                                        >
                                          View Details
                                        </button>
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            const confirmDelete = window.confirm(
                                              `Delete hero "${h.name}" (${h.role} Lv${h.level})? This cannot be undone.`
                                            );
                                            if (!confirmDelete) return;
                                            await deleteHero(h.id);
                                            await refetchHero();
                                            await refetchAllHeroes();
                                            if (adminSelectedHero && adminSelectedHero.id === h.id) {
                                              setAdminSelectedHero(null);
                                            }
                                          }}
                                          className="text-xs px-3 py-1 rounded bg-red-700 hover:bg-red-600 text-white"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                      {/* Right: Selected hero details */}
                      <div className="lg:w-1/2">
                        {adminSelectedHero && (
                          <div className="bg-gray-900 rounded-lg p-4 border border-blue-700 lg:sticky lg:top-4 max-h-[80vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-lg font-bold text-white">
                                Selected Hero Details
                              </h3>
                              <button
                                onClick={() => setAdminSelectedHero(null)}
                                className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded"
                              >
                                Close
                              </button>
                            </div>
                            <div className="mb-3 p-2 bg-gray-800 rounded text-xs text-gray-300">
                              <div>Hero ID: {adminSelectedHero.id}</div>
                              <div>Name: {adminSelectedHero.name || 'MISSING'}</div>
                              <div>Role: {adminSelectedHero.role || 'MISSING'}</div>
                              <div>Level: {adminSelectedHero.level ?? 'MISSING'}</div>
                              <div>Has Stats: {adminSelectedHero.stats ? 'Yes' : 'No'}</div>
                              <div>Has Equipment: {adminSelectedHero.equipment ? 'Yes' : 'No'}</div>
                            </div>
                            <HeroDashboard hero={adminSelectedHero} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      

      {showLoginReward && (user?.twitchId || user?.id) && (
        <LoginRewardModal
          userId={user?.twitchId || user?.id || ''}
          provider="twitch"
          onClose={() => {
            setShowLoginReward(false);
            checkLoginReward();
          }}
        />
      )}
    </div>
  );
}

// Dungeon Finder Tab Component
function DungeonFinderTab({ hero, userId, queueStatus, onQueueChange }: any) {
  // Use queueStatus from parent (PlayerPortal) to avoid duplicate polling
  const inQueue = queueStatus?.inQueue || false;
  const [dungeonType, setDungeonType] = useState<'normal' | 'heroic' | 'mythic'>('normal');

  const handleJoinQueue = async () => {
    if (!hero) return;

    const category = getCategoryFromRole(hero.role);
    const itemScore = calculateItemScore(hero);

    try {
      await dungeonAPI.joinQueue(
        userId,
        hero.id || userId,
        category,
        itemScore,
        dungeonType
      );
      // Trigger parent to refresh queue status
      onQueueChange?.();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to join queue');
    }
  };

  const handleLeaveQueue = async () => {
    try {
      await dungeonAPI.leaveQueue(userId);
      // Trigger parent to refresh queue status
      onQueueChange?.();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to leave queue');
    }
  };

  const getCategoryFromRole = (role: string) => {
    const config: any = {
      guardian: 'tank', paladin: 'tank', warden: 'tank', bloodknight: 'tank', vanguard: 'tank', brewmaster: 'tank',
      cleric: 'healer', atoner: 'healer', druid: 'healer', lightbringer: 'healer', shaman: 'healer', mistweaver: 'healer', chronomancer: 'healer'
    };
    return config[role] || 'dps';
  };

  const calculateItemScore = (hero: any) => {
    return getItemScore(hero.equipment || {}, hero.role);
  };

  // Dungeon difficulty requirements
  const DUNGEON_REQUIREMENTS = {
    normal: { minLevel: 10, minItemScore: 300, suggestedItemScore: 400 },
    heroic: { minLevel: 25, minItemScore: 1200, suggestedItemScore: 1500 },
    mythic: { minLevel: 40, minItemScore: 2500, suggestedItemScore: 3000 }
  };

  if (!hero) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <p className="text-gray-300">Please create a hero first.</p>
      </div>
    );
  }

  const role = getCategoryFromRole(hero.role);

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">Dungeon Finder</h2>
        
        <div className="mb-6 p-4 bg-gray-900 rounded-lg border border-gray-600">
          <div className="font-bold text-white mb-2">Your Hero</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Name</div>
              <div className="text-white font-semibold flex items-center gap-2">
                {hero.founderBadge && (
                  <img
                    src={hero.founderBadge}
                    alt="Founder Badge"
                    className="w-6 h-6 object-contain"
                    title="Founder Badge"
                  />
                )}
                <span style={{ color: hero.nameColor || 'white' }}>{hero.name || 'Unknown'}</span>
              </div>
            </div>
            <div>
              <div className="text-gray-400">Class</div>
              <div className="text-white font-semibold">{hero.role}</div>
            </div>
            <div>
              <div className="text-gray-400">Role</div>
              <div className="text-white font-semibold uppercase">{role}</div>
            </div>
            <div>
              <div className="text-gray-400">Item Score</div>
              <div className="text-white font-semibold">{calculateItemScore(hero)}</div>
            </div>
          </div>
        </div>

        {!inQueue ? (
          <div className="space-y-4">
            <div>
              <label className="block text-white mb-3 font-semibold">Dungeon Difficulty</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                {(['normal', 'heroic', 'mythic'] as const).map((difficulty) => {
                  const req = DUNGEON_REQUIREMENTS[difficulty];
                  const heroLevel = hero.level || 0;
                  const heroItemScore = calculateItemScore(hero);
                  const meetsLevel = heroLevel >= req.minLevel;
                  const meetsItemScore = heroItemScore >= req.minItemScore;
                  const canJoin = meetsLevel && meetsItemScore;
                  
                  return (
                    <div
                      key={difficulty}
                      onClick={() => setDungeonType(difficulty)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        dungeonType === difficulty
                          ? 'border-orange-500 bg-orange-900/30 shadow-lg'
                          : canJoin
                          ? 'border-gray-600 bg-gray-900/50 hover:border-gray-500'
                          : 'border-red-600 bg-red-900/20 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-white capitalize text-lg">{difficulty}</h3>
                        {dungeonType === difficulty && (
                          <span className="text-orange-400 text-xl">✓</span>
                        )}
                      </div>
                      <div className="text-xs space-y-1">
                        <div className="text-gray-400">
                          Level: <span className={meetsLevel ? 'text-green-400 font-semibold' : 'text-red-400'}>
                            {req.minLevel}+ {meetsLevel ? '✓' : `(You: ${heroLevel})`}
                          </span>
                        </div>
                        <div className="text-gray-400">
                          Gear Score: <span className={meetsItemScore ? 'text-green-400 font-semibold' : 'text-red-400'}>
                            {req.minItemScore}+ {meetsItemScore ? '✓' : `(You: ${heroItemScore})`}
                          </span>
                        </div>
                        <div className="text-gray-500 mt-2 pt-2 border-t border-gray-700">
                          Suggested: <span className="text-yellow-400">{req.suggestedItemScore}+</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <button
              onClick={handleJoinQueue}
              disabled={!DUNGEON_REQUIREMENTS[dungeonType] || 
                       (hero.level || 0) < DUNGEON_REQUIREMENTS[dungeonType].minLevel ||
                       calculateItemScore(hero) < DUNGEON_REQUIREMENTS[dungeonType].minItemScore}
              className="w-full px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Join Queue as {role.toUpperCase()}
            </button>
            {DUNGEON_REQUIREMENTS[dungeonType] && 
             ((hero.level || 0) < DUNGEON_REQUIREMENTS[dungeonType].minLevel ||
              calculateItemScore(hero) < DUNGEON_REQUIREMENTS[dungeonType].minItemScore) && (
              <div className="p-3 bg-red-900/30 border border-red-600 rounded-lg text-red-300 text-sm">
                <div className="font-semibold mb-1">Requirements not met for {dungeonType} difficulty:</div>
                {hero.level < DUNGEON_REQUIREMENTS[dungeonType].minLevel && (
                  <div>• Need level {DUNGEON_REQUIREMENTS[dungeonType].minLevel} (you're {hero.level})</div>
                )}
                {calculateItemScore(hero) < DUNGEON_REQUIREMENTS[dungeonType].minItemScore && (
                  <div>• Need {DUNGEON_REQUIREMENTS[dungeonType].minItemScore} gear score (you have {calculateItemScore(hero)})</div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-orange-900/30 border border-orange-600 rounded-lg">
              <div className="font-bold text-orange-400 mb-2">In Queue</div>
              <div className="text-sm text-gray-300 space-y-1">
                <div>Role: <span className="text-white font-semibold">{queueStatus?.role || role}</span></div>
                <div>Dungeon Type: <span className="text-white font-semibold">{queueStatus?.dungeonType || dungeonType}</span></div>
                <div>Queue Time: <span className="text-white font-semibold">{Math.floor((Date.now() - (queueStatus?.queueTime || Date.now())) / 1000)}s</span></div>
                {queueStatus?.roleCounts && (
                  <div className="mt-3 pt-3 border-t border-orange-700">
                    <div className="font-semibold text-orange-300 mb-2">Queue Status (Need: 1 Tank, 1 Healer, 3 DPS):</div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span>🛡️ Tanks:</span>
                        <span className={`font-bold ${(queueStatus.roleCounts.tank || 0) >= 1 ? 'text-green-400' : 'text-red-400'}`}>
                          {queueStatus.roleCounts.tank || 0}/1
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>💚 Healers:</span>
                        <span className={`font-bold ${(queueStatus.roleCounts.healer || 0) >= 1 ? 'text-green-400' : 'text-red-400'}`}>
                          {queueStatus.roleCounts.healer || 0}/1
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>⚔️ DPS:</span>
                        <span className={`font-bold ${(queueStatus.roleCounts.dps || 0) >= 3 ? 'text-green-400' : 'text-red-400'}`}>
                          {queueStatus.roleCounts.dps || 0}/3
                        </span>
                      </div>
                    </div>
                    {(queueStatus.roleCounts.tank || 0) >= 1 && 
                     (queueStatus.roleCounts.healer || 0) >= 1 && 
                     (queueStatus.roleCounts.dps || 0) >= 3 && (
                      <div className="mt-3 p-2 bg-green-900/50 border border-green-600 rounded text-green-300 text-center text-xs font-semibold animate-pulse">
                        ✅ Group Ready! Matchmaking will form group now...
                      </div>
                    )}
                  </div>
                )}
                {queueStatus?.estimatedWait && (
                  <div className="mt-2 text-orange-300">
                    Estimated Wait: ~{queueStatus.estimatedWait}s
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleLeaveQueue}
              className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
            >
              Leave Queue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
