import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useHero } from '../hooks/useHero';
import { useAllHeroes } from '../hooks/useAllHeroes';
import { useGuild } from '../hooks/useGuild';
import { raidAPI, heroAPI } from '../api/client';
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
  const [activeTab, setActiveTab] = useState<'hero' | 'inventory' | 'profession' | 'guild' | 'raids' | 'skills' | 'dungeon' | 'browserSource' | 'achievements' | 'allHeroes'>('hero');
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [adminSelectedHero, setAdminSelectedHero] = useState<Hero | null>(null);
  const [showLoginReward, setShowLoginReward] = useState(false);
  const [loginRewardStatus, setLoginRewardStatus] = useState<any>(null);
  const [dungeonQueueStatus, setDungeonQueueStatus] = useState<any>(null);
  
  // Handle navigation state and URL params (for setting active tab from other pages)
  useEffect(() => {
    const state = location.state as any;
    if (state?.activeTab) {
      setActiveTab(state.activeTab);
    }
    // Also check URL query params
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['hero', 'inventory', 'profession', 'guild', 'raids', 'skills', 'dungeon', 'browserSource', 'achievements', 'allHeroes'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [location.state, location.search]);

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
      const interval = setInterval(checkDungeonQueue, 5000);
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
          {/* Hero List Sidebar */}
          {heroes && heroes.length > 0 && (
            <div className="lg:col-span-3 space-y-4">
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 sticky top-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Your Heroes</h2>
                  <span className="text-sm text-gray-400">
                    {heroes.length}/20
                  </span>
                </div>
                {heroes.length < 20 && (
                  <button
                    onClick={() => navigate('/create-hero')}
                    className="w-full mb-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105"
                  >
                    + Create Hero
                  </button>
                )}
                <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {heroes.map((h, idx) => {
                    const isSelected = h.id === hero.id;
                    const key = `${h.id}-${(h as any).characterId || h.role || idx}`;
                    const classInfo = CLASS_DATA.find(c => c.key === h.role);
                    const category = classInfo?.category || getCategoryFromRole(h.role);
                    const gearScore = getItemScore(h.equipment || {});
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
                          <div className="text-lg font-semibold text-white">{h.name}</div>
                          <span className="text-gray-400 text-sm">Lv {h.level}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm mb-2 flex-wrap gap-1">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${categoryColors[category as keyof typeof categoryColors]}`}>
                            {categoryLabels[category as keyof typeof categoryLabels]}
                          </span>
                          <span className="px-2 py-1 rounded bg-gray-700 text-gray-200 text-xs">
                            {h.role}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 text-xs text-gray-400 mb-2">
                          <span className="text-yellow-400">
                            {Math.round(h.maxHp)} HP
                          </span>
                          <span className="text-blue-400">
                            {h.attack} ATK
                          </span>
                          <span className="text-green-400">
                            {h.defense} DEF
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs mb-2 pt-2 border-t border-gray-700">
                          <span className="text-gray-400">Gear Score:</span>
                          <span className="text-yellow-400 font-semibold">⚡ {gearScore}</span>
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
          <div className={`space-y-6 ${heroes && heroes.length > 0 ? 'lg:col-span-9' : 'lg:col-span-12'}`}>
            {activeTab === 'hero' && (
              <HeroDashboard 
                hero={hero} 
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
            onUseConsumable={async (itemId) => {
              const heroId = hero?.id || user?.id;
              if (!heroId) return;
              try {
                await heroAPI.useElixir(heroId, itemId);
                refetchHero();
              } catch (error: any) {
                alert(error.response?.data?.error || 'Failed to use item');
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
            {activeTab === 'guild' && <GuildPanel guild={guild} refetchGuild={refetchGuild} />}
            {activeTab === 'raids' && <RaidBrowser hero={hero} userId={hero?.id || user?.id} />}
            {activeTab === 'skills' && <SkillsPage hero={hero} userId={user?.id} />}
            {activeTab === 'achievements' && <AchievementsPanel hero={hero} onUpdate={refetchHero} />}
            {activeTab === 'dungeon' && <DungeonFinderTab hero={hero} userId={user?.id} onQueueChange={checkDungeonQueue} />}
            {activeTab === 'browserSource' && (
              <BrowserSourceTab 
                userId={user?.twitchId || user?.id} 
                token={localStorage.getItem('auth_token')}
              />
            )}

            {activeTab === 'allHeroes' && isAdmin && (
              <div className="mt-4 space-y-6">
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
                            <h3 className="text-lg font-bold text-white mb-3">
                              Selected Hero Details
                            </h3>
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

          {/* Sidebar - Quest Tracker */}
          <div className="lg:col-span-1">
            <QuestTracker />
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
function DungeonFinderTab({ hero, userId, onQueueChange }: any) {
  const [queueStatus, setQueueStatus] = useState<any>(null);
  const [inQueue, setInQueue] = useState(false);
  const [dungeonType, setDungeonType] = useState<'normal' | 'heroic' | 'mythic'>('normal');

  useEffect(() => {
    if (userId) {
      checkQueueStatus();
      const interval = setInterval(checkQueueStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  const checkQueueStatus = async () => {
    try {
      const status = await dungeonAPI.getQueueStatus(userId);
      setQueueStatus(status);
      setInQueue(status.inQueue || false);
      onQueueChange?.();
    } catch (err) {
      console.error('Failed to check queue status:', err);
    }
  };

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
      setInQueue(true);
      checkQueueStatus();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to join queue');
    }
  };

  const handleLeaveQueue = async () => {
    try {
      await dungeonAPI.leaveQueue(userId);
      setInQueue(false);
      setQueueStatus(null);
      checkQueueStatus();
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
    return getItemScore(hero.equipment || {});
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
                    <div className="font-semibold text-orange-300 mb-2">Queue Status:</div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>Tanks: <span className="text-white">{queueStatus.roleCounts.tank || 0}</span></div>
                      <div>Healers: <span className="text-white">{queueStatus.roleCounts.healer || 0}</span></div>
                      <div>DPS: <span className="text-white">{queueStatus.roleCounts.dps || 0}</span></div>
                    </div>
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
