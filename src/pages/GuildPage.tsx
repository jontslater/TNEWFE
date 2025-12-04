import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useGuild } from '../hooks/useGuild';
import { enhancedGuildAPI, guildAPI, raidAPI, dungeonAPI } from '../api/client';
import { useNavigate } from 'react-router-dom';

interface Guild {
  id: string;
  name: string;
  createdBy: string;
  memberIds: string[];
  members?: Array<{
    userId: string;
    username: string;
    rank: 'leader' | 'officer' | 'member';
    heroRole?: string;
    heroLevel?: number;
    contributionPoints?: number;
    profession?: any;
  }>;
  joinMode?: 'open' | 'approval';
  pendingApplications?: Array<{
    userId: string;
    username: string;
    message?: string;
    appliedAt: any;
  }>;
  guildLoot?: any[];
  lootHistory?: any[];
  level?: number;
  gold?: number;
  maxMembers?: number;
  perks?: {
    craftingBonus?: number;
    gatherBonus?: number;
    combatBonus?: number;
  };
  craftingStations?: any[];
  description?: string;
  tags?: string[];
}

export default function GuildPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user?.twitchId || user?.id;
  const { guild, loading: guildLoading, refetch: refetchGuild } = useGuild(userId || null);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'raids' | 'dungeons' | 'applications' | 'loot' | 'settings'>('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBrowseModal, setShowBrowseModal] = useState(false);
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJoinMode, setFilterJoinMode] = useState<'all' | 'open' | 'approval'>('all');

  const isLeader = guild?.createdBy === userId;
  const isOfficer = guild?.members?.some(m => m.userId === userId && (m.rank === 'leader' || m.rank === 'officer')) || false;
  const canManage = isLeader || isOfficer;

  useEffect(() => {
    if (showBrowseModal && !guild) {
      loadGuilds();
    }
  }, [showBrowseModal, guild]);

  const loadGuilds = async () => {
    try {
      setBrowseLoading(true);
      const allGuilds = await guildAPI.getAllGuilds();
      setGuilds(allGuilds);
    } catch (err) {
      console.error('Failed to load guilds:', err);
    } finally {
      setBrowseLoading(false);
    }
  };

  const filteredGuilds = guilds.filter(g => {
    const matchesSearch = !searchTerm || g.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterJoinMode === 'all' || g.joinMode === filterJoinMode;
    return matchesSearch && matchesFilter && !g.memberIds?.includes(userId || '');
  });

  if (guildLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-400">Loading...</div>
      </div>
    );
  }

  // Not in a guild - show browse/create view
  if (!guild) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Guilds</h1>
          <p className="text-gray-400">Join a guild to participate in group activities, raids, and dungeons!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-900 to-gray-800 rounded-lg p-8 border border-blue-700">
            <h2 className="text-2xl font-bold text-white mb-4">Create Your Own Guild</h2>
            <p className="text-gray-300 mb-6">
              Start your own guild and recruit members. Lead raids, manage loot, and build your community!
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold text-lg"
            >
              Create Guild
            </button>
          </div>

          <div className="bg-gradient-to-br from-purple-900 to-gray-800 rounded-lg p-8 border border-purple-700">
            <h2 className="text-2xl font-bold text-white mb-4">Find a Guild</h2>
            <p className="text-gray-300 mb-6">
              Browse available guilds and apply to join. Find the perfect group for your playstyle!
            </p>
            <button
              onClick={() => {
                setShowBrowseModal(true);
                loadGuilds();
              }}
              className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-semibold text-lg"
            >
              Browse Guilds
            </button>
          </div>
        </div>

        {showCreateModal && (
          <CreateGuildModal
            userId={userId!}
            username={user?.twitchUsername || user?.displayName || 'Unknown'}
            onClose={() => {
              setShowCreateModal(false);
              refetchGuild();
            }}
          />
        )}

        {showBrowseModal && (
          <BrowseGuildsModal
            guilds={filteredGuilds}
            loading={browseLoading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterJoinMode={filterJoinMode}
            setFilterJoinMode={setFilterJoinMode}
            onClose={() => setShowBrowseModal(false)}
            onApply={async (guildId, message) => {
              try {
                await enhancedGuildAPI.applyToGuild(guildId, userId!, user?.twitchUsername || user?.displayName || 'Unknown', message);
                alert('Application submitted!');
                setShowBrowseModal(false);
              } catch (err: any) {
                alert(err.response?.data?.error || 'Failed to apply');
              }
            }}
            onJoin={async (guildId) => {
              try {
                await guildAPI.joinGuild(guildId, userId!);
                alert('Joined guild successfully!');
                setShowBrowseModal(false);
                refetchGuild();
              } catch (err: any) {
                alert(err.response?.data?.error || 'Failed to join');
              }
            }}
          />
        )}
      </div>
    );
  }

  // In a guild - show full guild interface
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Guild Header */}
      <div className="bg-gradient-to-br from-purple-900 to-gray-800 rounded-lg p-6 shadow-lg border border-purple-700 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">{guild.name}</h1>
            <div className="text-purple-400 text-lg">Level {guild.level || 1} Guild</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Guild Gold</div>
            <div className="text-3xl font-bold text-yellow-500">
              {guild.gold?.toLocaleString() || '0'}
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-6">
            <div>
              <span className="text-gray-400">Members: </span>
              <span className="text-white font-semibold">
                {guild.memberIds?.length || 0} / {guild.maxMembers || 50}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Join Mode: </span>
              <span className="text-purple-400 font-semibold capitalize">
                {guild.joinMode || 'open'}
              </span>
            </div>
          </div>
          {!isLeader && (
            <button
              onClick={async () => {
                if (!confirm(`Are you sure you want to leave ${guild.name}?`)) return;
                try {
                  await guildAPI.leaveGuild(guild.id, userId!);
                  alert('Left guild successfully');
                  refetchGuild();
                } catch (err: any) {
                  alert(err.response?.data?.error || 'Failed to leave');
                }
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-semibold"
            >
              Leave Guild
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-gray-700 overflow-x-auto">
        <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
          Overview
        </TabButton>
        <TabButton active={activeTab === 'members'} onClick={() => setActiveTab('members')}>
          Members ({guild.memberIds?.length || 0})
        </TabButton>
        <TabButton active={activeTab === 'raids'} onClick={() => setActiveTab('raids')}>
          Raids
        </TabButton>
        <TabButton active={activeTab === 'dungeons'} onClick={() => setActiveTab('dungeons')}>
          Dungeons
        </TabButton>
        {canManage && (
          <>
            <TabButton active={activeTab === 'applications'} onClick={() => setActiveTab('applications')}>
              Applications ({guild.pendingApplications?.length || 0})
            </TabButton>
            <TabButton active={activeTab === 'loot'} onClick={() => setActiveTab('loot')}>
              Loot ({guild.guildLoot?.length || 0})
            </TabButton>
            <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')}>
              Settings
            </TabButton>
          </>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <GuildOverviewTab guild={guild} isLeader={isLeader} onUpdate={refetchGuild} />
      )}
      {activeTab === 'members' && (
        <GuildMembersTab guild={guild} isLeader={isLeader} isOfficer={isOfficer} onUpdate={refetchGuild} />
      )}
      {activeTab === 'raids' && (
        <GuildRaidsTab guild={guild} userId={userId!} navigate={navigate} />
      )}
      {activeTab === 'dungeons' && (
        <GuildDungeonsTab guild={guild} userId={userId!} navigate={navigate} />
      )}
      {activeTab === 'applications' && canManage && (
        <GuildApplicationsTab guild={guild} onUpdate={refetchGuild} />
      )}
      {activeTab === 'loot' && canManage && (
        <GuildLootTab guild={guild} onUpdate={refetchGuild} />
      )}
      {activeTab === 'settings' && canManage && (
        <GuildSettingsTab guild={guild} onUpdate={refetchGuild} />
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 font-semibold transition-colors whitespace-nowrap ${
        active
          ? 'border-b-2 border-blue-500 text-blue-400'
          : 'text-gray-400 hover:text-gray-300'
      }`}
    >
      {children}
    </button>
  );
}

function GuildOverviewTab({ guild, isLeader, onUpdate }: any) {
  return (
    <div className="space-y-6">
      {/* Guild Perks */}
      {guild.perks && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Guild Perks</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {guild.perks.craftingBonus && (
              <div className="bg-green-900/30 border border-green-600 rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">⚗️</div>
                <div className="text-sm text-gray-300">Crafting Bonus</div>
                <div className="text-2xl font-bold text-green-400">+{guild.perks.craftingBonus * 100}%</div>
              </div>
            )}
            {guild.perks.gatherBonus && (
              <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">🌿</div>
                <div className="text-sm text-gray-300">Gathering Bonus</div>
                <div className="text-2xl font-bold text-blue-400">+{guild.perks.gatherBonus * 100}%</div>
              </div>
            )}
            {guild.perks.combatBonus && (
              <div className="bg-red-900/30 border border-red-600 rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">⚔️</div>
                <div className="text-sm text-gray-300">Combat Bonus</div>
                <div className="text-2xl font-bold text-red-400">+{guild.perks.combatBonus * 100}%</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Crafting Stations */}
      {guild.craftingStations && guild.craftingStations.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Crafting Stations</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {guild.craftingStations.map((station: any) => (
              <div key={station.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <div className="font-semibold text-white capitalize mb-2">
                  {station.type.replace(/_/g, ' ')}
                </div>
                <div className="text-sm text-gray-400 mb-2">Level {station.level}</div>
                <div className="text-sm text-green-400">
                  +{station.bonusQuality * 100}% Quality
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guild Description */}
      {guild.description && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-2">About</h2>
          <p className="text-gray-300">{guild.description}</p>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-sm text-gray-400">Total Members</div>
          <div className="text-2xl font-bold text-white">{guild.memberIds?.length || 0}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-sm text-gray-400">Guild Level</div>
          <div className="text-2xl font-bold text-white">{guild.level || 1}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-sm text-gray-400">Guild Gold</div>
          <div className="text-2xl font-bold text-yellow-500">{guild.gold?.toLocaleString() || '0'}</div>
        </div>
      </div>
    </div>
  );
}

function GuildMembersTab({ guild, isLeader, isOfficer, onUpdate }: any) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMembers();
  }, [guild]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await guildAPI.getGuildMembersWithHeroes(guild.id);
      setMembers(data.members);
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setLoading(false);
    }
  };

  const sortedMembers = [...members].sort((a, b) => {
    const rankOrder = { leader: 0, officer: 1, member: 2 };
    const aRank = guild.members?.find((m: any) => m.userId === a.userId)?.rank || 'member';
    const bRank = guild.members?.find((m: any) => m.userId === b.userId)?.rank || 'member';
    return rankOrder[aRank] - rankOrder[bRank];
  });

  if (loading) {
    return <div className="text-gray-400">Loading members...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-4">Guild Members</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedMembers.map((member) => {
          const memberData = guild.members?.find((m: any) => m.userId === member.userId);
          const rank = memberData?.rank || 'member';
          const rankIcon = rank === 'leader' ? '👑' : rank === 'officer' ? '⭐' : '🗡️';
          
          return (
            <div
              key={member.userId}
              className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{rankIcon}</span>
                  <span className="font-semibold text-white">{member.username}</span>
                </div>
                {(isLeader || isOfficer) && rank !== 'leader' && (
                  <button
                    onClick={async () => {
                      // TODO: Implement promote/demote/kick
                      alert('Member management coming soon');
                    }}
                    className="text-gray-400 hover:text-gray-300 text-sm"
                  >
                    Manage
                  </button>
                )}
              </div>
              {member.hero && (
                <div className="text-sm text-gray-400 space-y-1">
                  <div>
                    <span className="text-blue-400">{member.hero.name || 'Unknown'}</span>
                    {' • '}
                    <span className="text-yellow-400">Lv.{member.hero.level || 1}</span>
                  </div>
                  <div>
                    <span className="text-purple-400 capitalize">{member.hero.role || 'dps'}</span>
                  </div>
                </div>
              )}
              {memberData?.contributionPoints && (
                <div className="text-xs text-gray-500 mt-2">
                  {memberData.contributionPoints.toLocaleString()} contribution points
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GuildRaidsTab({ guild, userId, navigate }: any) {
  const [raids, setRaids] = useState<any[]>([]);
  const [upcomingRaids, setUpcomingRaids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRaids();
  }, []);

  const loadRaids = async () => {
    try {
      setLoading(true);
      const [allRaids, upcoming] = await Promise.all([
        raidAPI.getRaids(),
        raidAPI.getUpcomingRaids()
      ]);
      setRaids(allRaids);
      setUpcomingRaids(upcoming.scheduledRaids || []);
    } catch (err) {
      console.error('Failed to load raids:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-gray-400">Loading raids...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Guild Raids</h2>
        <button
          onClick={() => navigate('/guild-raid-signup')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          Sign Up for Raid
        </button>
      </div>

      {/* Upcoming Scheduled Raids */}
      {upcomingRaids.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Upcoming Scheduled Raids</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingRaids.map((raid: any) => (
              <div key={raid.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="font-bold text-white mb-2">{raid.raidId}</div>
                <div className="text-sm text-gray-400">
                  Scheduled: {raid.startedAt?.toDate?.()?.toLocaleString() || 'TBD'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Raids */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Available Raids</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {raids.map((raid: any) => (
            <div key={raid.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-blue-600 transition-colors">
              <div className="font-bold text-white mb-2">{raid.name}</div>
              <div className="text-sm text-gray-400 space-y-1">
                <div>Level: {raid.minLevel}+</div>
                <div>Item Score: {raid.minItemScore}+</div>
                <div>Players: {raid.minPlayers}-{raid.maxPlayers}</div>
              </div>
              <button
                onClick={() => navigate(`/guild-raid-signup/${raid.id}`)}
                className="mt-4 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Sign Up
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GuildDungeonsTab({ guild, userId, navigate }: any) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Guild Dungeons</h2>
        <button
          onClick={() => navigate('/dungeon-finder')}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
        >
          Find Dungeon
        </button>
      </div>
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <p className="text-gray-400">
          Guild dungeon signup and scheduling coming soon. For now, use the Dungeon Finder to queue up!
        </p>
      </div>
    </div>
  );
}

function GuildApplicationsTab({ guild, onUpdate }: any) {
  const applications = guild.pendingApplications || [];

  const handleApprove = async (userId: string) => {
    try {
      await enhancedGuildAPI.approveApplication(guild.id, userId, guild.createdBy);
      onUpdate();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to approve');
    }
  };

  const handleReject = async (userId: string) => {
    try {
      await enhancedGuildAPI.rejectApplication(guild.id, userId, guild.createdBy);
      onUpdate();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reject');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-4">Pending Applications</h2>
      {applications.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
          <p className="text-gray-400">No pending applications</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app: any) => (
            <div key={app.userId} className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex justify-between items-center">
              <div>
                <div className="font-bold text-white">{app.username}</div>
                {app.message && <div className="text-sm text-gray-400 mt-1">{app.message}</div>}
                <div className="text-xs text-gray-500 mt-1">
                  Applied: {app.appliedAt?.toDate?.()?.toLocaleString() || 'Unknown'}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(app.userId)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(app.userId)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GuildLootTab({ guild, onUpdate }: any) {
  const [loot, setLoot] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLoot();
  }, [guild]);

  const loadLoot = async () => {
    try {
      setLoading(true);
      const data = await enhancedGuildAPI.getGuildLoot(guild.id);
      setLoot(data);
    } catch (err) {
      console.error('Failed to load loot:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignLoot = async (itemId: string, assignedTo: string) => {
    try {
      await enhancedGuildAPI.assignLoot(guild.id, guild.createdBy, itemId, assignedTo);
      onUpdate();
      loadLoot();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to assign loot');
    }
  };

  if (loading) {
    return <div className="text-gray-400">Loading loot...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-4">Unassigned Loot</h2>
      {loot.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
          <p className="text-gray-400">No unassigned loot</p>
        </div>
      ) : (
        <div className="space-y-4">
          {loot.map((item: any) => (
            <div key={item.item?.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="font-bold text-white mb-2">{item.item?.name || 'Unknown Item'}</div>
              <div className="text-sm text-gray-400 mb-4">
                Rarity: {item.item?.rarity} | Participants: {item.participants?.length || 0}
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Assign to:</label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAssignLoot(item.item.id, e.target.value);
                    }
                  }}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  defaultValue=""
                >
                  <option value="">Select participant...</option>
                  {item.participants?.map((p: string) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GuildSettingsTab({ guild, onUpdate }: any) {
  const [joinMode, setJoinMode] = useState(guild.joinMode || 'open');
  const [description, setDescription] = useState(guild.description || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await enhancedGuildAPI.updateGuildSettings(guild.id, guild.createdBy, joinMode);
      // TODO: Add description update endpoint
      onUpdate();
      alert('Settings saved!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Guild Settings</h2>
        
        <div className="mb-4">
          <label className="block text-gray-400 mb-2">Join Mode</label>
          <select
            value={joinMode}
            onChange={(e) => setJoinMode(e.target.value)}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
          >
            <option value="open">Open (Auto-join)</option>
            <option value="approval">Approval Required</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-400 mb-2">Guild Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            rows={4}
            placeholder="Describe your guild..."
            maxLength={500}
          />
          <div className="text-xs text-gray-500 mt-1">{description.length}/500 characters</div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:bg-gray-600"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

function CreateGuildModal({ userId, username, onClose }: any) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      alert('Please enter a guild name');
      return;
    }

    try {
      setLoading(true);
      await enhancedGuildAPI.createGuild(name, userId, username);
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create guild');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">Create Guild</h2>
        <div className="mb-4">
          <label className="block text-gray-400 mb-2">Guild Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            placeholder="Enter guild name..."
            maxLength={30}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-400 mb-2">Description (Optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            rows={3}
            placeholder="Describe your guild..."
            maxLength={500}
          />
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleCreate}
            disabled={loading || !name.trim()}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:bg-gray-600"
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function BrowseGuildsModal({ guilds, loading, searchTerm, setSearchTerm, filterJoinMode, setFilterJoinMode, onClose, onApply, onJoin }: any) {
  const filteredGuilds = guilds.filter((g: Guild) => {
    const matchesSearch = !searchTerm || g.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterJoinMode === 'all' || g.joinMode === filterJoinMode;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Browse Guilds</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 space-y-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            placeholder="Search guilds..."
          />
          <select
            value={filterJoinMode}
            onChange={(e) => setFilterJoinMode(e.target.value)}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
          >
            <option value="all">All Join Modes</option>
            <option value="open">Open (Auto-join)</option>
            <option value="approval">Approval Required</option>
          </select>
        </div>

        {loading ? (
          <div className="text-gray-400 text-center py-8">Loading guilds...</div>
        ) : filteredGuilds.length === 0 ? (
          <div className="text-gray-400 text-center py-8">No guilds found</div>
        ) : (
          <div className="space-y-4">
            {filteredGuilds.map((guild: Guild) => (
              <div key={guild.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-bold text-white text-lg">{guild.name}</div>
                    <div className="text-sm text-gray-400">
                      Level {guild.level || 1} • {guild.memberIds?.length || 0} members
                    </div>
                    {guild.description && (
                      <div className="text-sm text-gray-300 mt-2">{guild.description}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400 capitalize mb-2">
                      {guild.joinMode || 'open'}
                    </div>
                    {guild.joinMode === 'open' ? (
                      <button
                        onClick={() => onJoin(guild.id)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
                      >
                        Join
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          const message = prompt('Optional application message:');
                          onApply(guild.id, message || '');
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                      >
                        Apply
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
