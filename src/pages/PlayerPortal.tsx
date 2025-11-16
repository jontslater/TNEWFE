import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { loginWithTwitch } from '../utils/twitchOAuth';
import { Hero } from '../types/Hero';

export default function PlayerPortal() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const isAdmin = user?.twitchUsername?.toLowerCase() === 'theneverendingwar';
  // Use Twitch ID to resolve all heroes for this account
  const { hero, heroes, loading: heroLoading, refetch: refetchHero, deleteHero, selectHero } = useHero(user?.twitchId || null);
  const { heroes: allHeroes, loading: allHeroesLoading, refetch: refetchAllHeroes } = useAllHeroes(isAdmin);
  const { guild, loading: guildLoading } = useGuild(user?.id || null);
  const [raids, setRaids] = useState<Raid[]>([]);
  const [worldBoss, setWorldBoss] = useState<WorldBoss | null>(null);
  const [activeTab, setActiveTab] = useState<'hero' | 'inventory' | 'profession' | 'guild' | 'raids' | 'allHeroes'>('hero');
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [adminSelectedHero, setAdminSelectedHero] = useState<Hero | null>(null);

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
    }
  }, [isAuthenticated]);

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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {activeTab === 'hero' && (
              <>
                {/* Hero selection cards */}
                {heroes && heroes.length > 1 && (
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <h2 className="text-xl font-bold text-white mb-4">Your Heroes</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {heroes.map((h, idx) => {
                        const isSelected = h.id === hero.id;
                        // Use a composite key to avoid duplicate key warnings even if docIds repeat
                        const key = `${h.id}-${(h as any).characterId || h.role || idx}`;
                        return (
                          <div
                            key={key}
                            onClick={() => selectHero(h.id)}
                            className={`cursor-pointer text-left bg-gray-900 rounded-lg p-4 border transition-all ${
                              isSelected
                                ? 'border-blue-500 shadow-lg'
                                : 'border-gray-700 hover:border-blue-400 hover:shadow'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-lg font-semibold text-white">{h.name}</div>
                              <span className="text-gray-400 text-sm">Lv {h.level}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm">
                              <span className="px-2 py-1 rounded bg-gray-700 text-gray-200">
                                {h.role}
                              </span>
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

                            {/* Admin-only delete button for theneverendingwar */}
                            {user?.twitchUsername?.toLowerCase() === 'theneverendingwar' && (
                              <div className="mt-3 flex justify-end">
                                <button
                                  type="button"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    const confirmDelete = window.confirm(
                                      `Delete hero "${h.name}" (${h.role} Lv${h.level})? This cannot be undone.`
                                    );
                                    if (!confirmDelete) return;
                                    await deleteHero(h.id);
                                    // After delete, refetch to ensure state is in sync with backend
                                    refetchHero();
                                  }}
                                  className="text-xs px-3 py-1 rounded bg-red-700 hover:bg-red-600 text-white"
                                >
                                  Delete Hero
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Detailed Hero view */}
                <HeroDashboard hero={hero} />
              </>
            )}
        {activeTab === 'inventory' && (
          <InventoryManager 
            hero={hero} 
            onEquipChange={async (slot, item) => {
              if (!user?.id) return;
              if (item) {
                await heroAPI.equipItem(user.id, slot, item);
              } else {
                await heroAPI.unequipItem(user.id, slot);
              }
              refetchHero();
            }}
            onApplyUpgrade={async (itemId, equipmentSlot) => {
              if (!user?.id) return;
              try {
                await heroAPI.applyUpgrade(user.id, itemId, equipmentSlot);
                refetchHero();
              } catch (error: any) {
                alert(error.response?.data?.error || 'Failed to apply upgrade');
              }
            }}
            onUseConsumable={async (itemId) => {
              if (!user?.id) return;
              try {
                await heroAPI.useElixir(user.id, itemId);
                refetchHero();
              } catch (error: any) {
                alert(error.response?.data?.error || 'Failed to use item');
              }
            }}
          />
        )}
        {activeTab === 'profession' && (
          <CraftingStation
            hero={hero}
            onChooseProfession={async (type) => {
              if (!user?.id) return;
              console.log('Choosing profession:', { userId: user.id, heroId: (hero as any).id, type });
              try {
                const result = await heroAPI.chooseProfession(user.id, type);
                console.log('Profession result:', result);
                refetchHero();
              } catch (error: any) {
                console.error('Failed to choose profession:', error);
                alert(error.response?.data?.error || 'Failed to choose profession');
              }
            }}
            onCraft={async (recipeKey, cost, tier, quantity) => {
              if (!user?.id) return;
              try {
                const result = await heroAPI.craftElixir(user.id, recipeKey, cost, tier, quantity);
                if (result.leveledUp) {
                  alert(`🎉 Profession Level Up! Now level ${result.profession.level}!`);
                }
                refetchHero();
              } catch (error: any) {
                alert(error.response?.data?.error || 'Failed to craft item');
              }
            }}
            onUse={async (itemKey) => {
              if (!user?.id) return;
              await heroAPI.useElixir(user.id, itemKey);
              refetchHero();
            }}
          />
        )}
            {activeTab === 'guild' && <GuildPanel guild={guild} />}
            {activeTab === 'raids' && <RaidBrowser />}

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
    </div>
  );
}
