import { useState, useEffect, useRef } from 'react';
import { Guild, GuildMember } from '../types/Guild';
import { formatNumber, getRoleBg } from '../utils/format';
import { useAuth } from '../hooks/useAuth';
import { guildAPI, partyAPI } from '../api/client';
import { useHero } from '../hooks/useHero';
import GuildRaidsPanel from './GuildRaidsPanel';
import { Hero } from '../types/Hero';

interface GuildPanelProps {
  guild: Guild | null;
  refetchGuild?: () => Promise<void>;
  onStartWhisper?: (heroId: string, heroName: string) => void;
  heroes?: Hero[]; // All user's heroes for invite selection
}

export default function GuildPanel({ guild, refetchGuild, onStartWhisper, heroes }: GuildPanelProps) {
  const { user } = useAuth();
  const { hero } = useHero(user?.twitchId || null);
  const [showCreateGuild, setShowCreateGuild] = useState(false);
  const [pendingGuildInviteId, setPendingGuildInviteId] = useState<string | null>(null);
  const [showInviteAcceptModal, setShowInviteAcceptModal] = useState(false);
  const [inviteGuildData, setInviteGuildData] = useState<Guild | null>(null);
  const [inviteData, setInviteData] = useState<any>(null); // Store the full invite data including inviter info
  const [selectedHeroForInvite, setSelectedHeroForInvite] = useState<Hero | null>(null); // Hero selected for joining guild
  const [guildName, setGuildName] = useState('');
  const [creating, setCreating] = useState(false);
  const [showGuildList, setShowGuildList] = useState(false);
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [loadingGuilds, setLoadingGuilds] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'raids'>('overview');
  const [members, setMembers] = useState<GuildMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showMemberMenu, setShowMemberMenu] = useState<string | null>(null); // Stores userId of member with open menu
  const [partyId, setPartyId] = useState<string | undefined>(undefined);
  const [partyLeaderId, setPartyLeaderId] = useState<string | undefined>(undefined);
  const [heroesWithGuilds, setHeroesWithGuilds] = useState<Set<string>>(new Set()); // Track which hero IDs have guilds

  const handleCreateGuild = async () => {
    if (!guildName.trim() || !hero?.id) return;
    
    try {
      setCreating(true);
      // Use hero ID, name, role, and level
      const newGuild = await guildAPI.createGuild(
        guildName.trim(), 
        hero.id, 
        hero.name,
        hero.role,
        hero.level
      );
      alert(`Guild "${newGuild.name}" created successfully!`);
      setShowCreateGuild(false);
      setGuildName('');
      // Refetch guild data (stays on guild tab)
      if (refetchGuild) {
        await refetchGuild();
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create guild');
    } finally {
      setCreating(false);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGuild, setSelectedGuild] = useState<Guild | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyMessage, setApplyMessage] = useState('');
  const [applying, setApplying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [joinMode, setJoinMode] = useState<'open' | 'approval'>('open');
  const [updatingSettings, setUpdatingSettings] = useState(false);
  const [showApplications, setShowApplications] = useState(false);
  const [pendingApplications, setPendingApplications] = useState<any[]>([]);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [showInviteLink, setShowInviteLink] = useState(false);
  const [inviteLink, setInviteLink] = useState<string>('');

  const loadGuilds = async () => {
    try {
      setLoadingGuilds(true);
      const allGuilds = await guildAPI.getAllGuilds();
      
      // Log all guilds and their creators for debugging
      console.log('[Find Guild] Loaded guilds:', allGuilds.length);
      allGuilds.forEach((guild, index) => {
        console.log(`[Find Guild] Guild ${index + 1}:`, {
          id: guild.id,
          name: guild.name,
          createdBy: guild.createdBy, // Hero ID who created it
          createdByHeroName: guild.createdByHeroName || 'Unknown',
          memberCount: guild.memberIds?.length || 0,
          maxMembers: guild.maxMembers || 50,
          joinMode: guild.joinMode || 'open',
          level: guild.level || 1
        });
      });
      
      // Specifically look for "dingo dynasty" or similar
      const dingoGuild = allGuilds.find(g => 
        g.name?.toLowerCase().includes('dingo') || 
        g.createdByHeroName?.toLowerCase().includes('dingo')
      );
      if (dingoGuild) {
        console.log('[Find Guild] ⭐ FOUND DINGO DYNASTY GUILD:', {
          guildId: dingoGuild.id,
          guildName: dingoGuild.name,
          creatorHeroId: dingoGuild.createdBy,
          creatorHeroName: dingoGuild.createdByHeroName,
          memberIds: dingoGuild.memberIds || []
        });
      }
      
      setGuilds(allGuilds);
      setShowGuildList(true);
    } catch (err) {
      console.error('Failed to load guilds:', err);
      alert('Failed to load guilds');
    } finally {
      setLoadingGuilds(false);
    }
  };

  const handleApplyToGuild = async () => {
    if (!selectedGuild || !hero?.id) return;
    
    try {
      setApplying(true);
      const response = await guildAPI.applyToGuild(
        selectedGuild.id,
        hero.id,
        hero.name,
        hero.role,
        hero.level,
        applyMessage.trim()
      );
      
      if (response.success) {
        alert(response.message || 'Application submitted successfully!');
        setShowApplyModal(false);
        setApplyMessage('');
        setSelectedGuild(null);
      } else {
        alert(response.message || 'Failed to submit application');
      }
    } catch (err: any) {
      console.error('Failed to apply to guild:', err);
      alert(err.response?.data?.error || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  const handleJoinGuild = async (targetGuild: Guild) => {
    if (!hero?.id) return;
    
    try {
      const response = await guildAPI.joinGuild(
        targetGuild.id,
        hero.id,
        hero.name,
        hero.role,
        hero.level
      );
      
      if (response.success) {
        alert(response.message || 'Joined guild successfully!');
        if (refetchGuild) {
          await refetchGuild();
          // Reload members if we're viewing the guild we just joined
          if (guild && guild.id === targetGuild.id) {
            try {
              const membersResponse = await guildAPI.getGuildMembersWithHeroes(targetGuild.id);
              setMembers(membersResponse.members as GuildMember[]);
            } catch (err) {
              console.error('Failed to reload members:', err);
            }
          }
        } else {
          window.location.reload();
        }
      } else {
        alert(response.message || 'Failed to join guild');
      }
    } catch (err: any) {
      console.error('Failed to join guild:', err);
      alert(err.response?.data?.error || 'Failed to join guild');
    }
  };

  const handleUpdateSettings = async () => {
    if (!guild || !hero?.id) return;
    
    try {
      setUpdatingSettings(true);
      const updatedGuild = await guildAPI.updateGuildSettings(guild.id, hero.id, joinMode);
      alert('Guild settings updated successfully!');
      setShowSettings(false);
      if (refetchGuild) {
        await refetchGuild();
      }
    } catch (err: any) {
      console.error('Failed to update settings:', err);
      alert(err.response?.data?.error || 'Failed to update settings');
    } finally {
      setUpdatingSettings(false);
    }
  };

  const loadApplications = async () => {
    if (!guild) return;
    setPendingApplications(guild.pendingApplications || []);
    setShowApplications(true);
  };

  const generateInviteLink = async () => {
    if (!guild || !hero) return;
    
    try {
      // Create an invite record with a placeholder inviteeHeroId
      // We'll use a special value that indicates "anyone with the link"
      const placeholderInviteeId = 'link-invite-anyone';
      
      const response = await guildAPI.inviteToGuild(
        guild.id,
        placeholderInviteeId, // Special placeholder for link-based invites
        'Anyone', // Placeholder name
        hero.id,
        hero.name || 'Unknown'
      );
      
      if (response.success && response.inviteId) {
        // Use the inviteId in the URL instead of just guildId
        const inviteLink = `${window.location.origin}${window.location.pathname}?guildInvite=${response.inviteId}`;
        setInviteLink(inviteLink);
        setShowInviteLink(true);
      } else {
        throw new Error('Failed to create invite');
      }
    } catch (error: any) {
      console.error('Failed to generate invite link:', error);
      alert(error.response?.data?.error || 'Failed to generate invite link');
    }
  };

  const loadPendingInvites = async () => {
    if (!guild) return;
    
    try {
      const response = await guildAPI.getGuildInvites(guild.id);
      setPendingInvites(response.invites || []);
    } catch (error) {
      console.error('Failed to load pending invites:', error);
    }
  };

  // Check if current hero is the guild leader (must be defined before useEffects that use it)
  const isLeader = hero?.id && guild?.createdBy === hero.id;

  useEffect(() => {
    if (guild && isLeader) {
      loadPendingInvites();
    }
  }, [guild?.id, isLeader]);

  const handleApproveApplication = async (applicantHeroId: string) => {
    if (!guild || !hero?.id) return;
    
    try {
      const response = await guildAPI.approveApplication(guild.id, applicantHeroId, hero.id);
      if (response.success) {
        alert('Application approved!');
        if (refetchGuild) {
          await refetchGuild();
        }
        loadApplications();
        // Reload members
        const membersResponse = await guildAPI.getGuildMembersWithHeroes(guild.id);
        setMembers(membersResponse.members as GuildMember[]);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to approve application');
    }
  };

  const handleRejectApplication = async (applicantHeroId: string) => {
    if (!guild || !hero?.id) return;
    
    try {
      const response = await guildAPI.rejectApplication(guild.id, applicantHeroId, hero.id);
      if (response.success) {
        alert('Application rejected');
        if (refetchGuild) {
          await refetchGuild();
        }
        loadApplications();
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reject application');
    }
  };

  // Handle inviting member to party
  const handleInviteToParty = async (member: GuildMember) => {
    if (!hero || !user) {
      alert('Hero and user information required');
      return;
    }

    try {
      const inviterId = user.twitchId || user.id || '';
      let currentPartyId = partyId;

      // If no party exists, create one first
      if (!currentPartyId) {
        const createResponse = await partyAPI.createParty(
          inviterId,
          user.twitchUsername || user.username || inviterId,
          hero.id,
          hero.name || 'Unknown',
          hero.role || 'berserker',
          hero.level || 1
        );

        if (!createResponse.success) {
          alert(createResponse.message || 'Failed to create party');
          return;
        }

        currentPartyId = createResponse.partyId;
        setPartyId(currentPartyId);
        setPartyLeaderId(inviterId);
      } else {
        // If party exists, check if user is leader
        const normalizedUserId = String(user.twitchId || user.id || '');
        const normalizedLeaderId = partyLeaderId ? String(partyLeaderId) : null;
        const isPartyLeader = normalizedLeaderId && normalizedLeaderId === normalizedUserId;
        
        if (!isPartyLeader) {
          alert('Only the party leader can invite members');
          return;
        }
      }

      // Get the user's Twitch ID for the invite
      const inviteeUserId = member.twitchUserId || member.userId; // Fallback to heroId if twitchUserId not available
      
      // Now send the invite
      const response = await partyAPI.invitePlayer(
        currentPartyId!,
        inviterId,
        inviteeUserId,
        member.username,
        member.userId, // heroId
        member.username,
        member.heroRole,
        member.heroLevel
      );

      if (response.success) {
        alert(`Invited ${member.username} to party!`);
        setShowMemberMenu(null);
      } else {
        alert(response.message || 'Failed to send invite');
      }
    } catch (err: any) {
      console.error('Failed to invite to party:', err);
      alert(err.response?.data?.error || 'Failed to invite to party');
    }
  };

  // Load party information - MUST be before early return (Rules of Hooks)
  useEffect(() => {
    const loadParty = async () => {
      if (!user) {
        setPartyId(undefined);
        setPartyLeaderId(undefined);
        return;
      }

      const userId = user.twitchId || user.id;
      if (!userId) return;

      try {
        const response = await partyAPI.getParty(userId);
        if (response.success && response.party) {
          setPartyId(response.party.id);
          setPartyLeaderId(response.party.leaderId);
        } else {
          setPartyId(undefined);
          setPartyLeaderId(undefined);
        }
      } catch (error) {
        console.error('Failed to load party:', error);
        setPartyId(undefined);
        setPartyLeaderId(undefined);
      }
    };

    loadParty();
    const interval = setInterval(loadParty, 5000);
    return () => clearInterval(interval);
  }, [user]);

  // Load members when guild changes - MUST be before early return (Rules of Hooks)
  const lastLoadedGuildRef = useRef<{ guildId: string | null; memberCount: number }>({ guildId: null, memberCount: 0 });
  
  useEffect(() => {
    const loadMembers = async () => {
      if (!guild?.id) {
        setMembers([]);
        lastLoadedGuildRef.current = { guildId: null, memberCount: 0 };
        return;
      }
      
      const memberCount = guild.memberIds?.length || 0;
      // Only reload if guild ID changed or member count actually changed
      if (lastLoadedGuildRef.current.guildId === guild.id && 
          lastLoadedGuildRef.current.memberCount === memberCount) {
        // Already loaded this guild with this member count, skip
        return;
      }
      
      try {
        setLoadingMembers(true);
        const response = await guildAPI.getGuildMembersWithHeroes(guild.id);
        setMembers(response.members as GuildMember[]);
        lastLoadedGuildRef.current = { guildId: guild.id, memberCount: response.members.length };
      } catch (err) {
        console.error('Failed to load guild members:', err);
        setMembers([]);
      } finally {
        setLoadingMembers(false);
      }
    };
    
    loadMembers();
    // Only depend on guild.id - memberIds.length can cause loops if guild object reference changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guild?.id]);

  // Handle pending guild invite from URL - MUST be before early return (Rules of Hooks)
  useEffect(() => {
    const pendingInviteId = sessionStorage.getItem('pendingGuildInvite');
    if (pendingInviteId) {
      // Check if any of the user's heroes are already in a guild
      // For now, we'll check the current hero's guild status
      // If they have a guild, don't show the invite
      if (guild) {
        // Already in a guild, clear the invite
        sessionStorage.removeItem('pendingGuildInvite');
        return;
      }
      
      setPendingGuildInviteId(pendingInviteId);
      
      // Fetch invite data first to get inviter info and guild ID
      guildAPI.getInvite(pendingInviteId).then(invite => {
        setInviteData(invite);
        // Then fetch guild data
        return guildAPI.getGuild(invite.guildId);
      }).then(guildData => {
        setInviteGuildData(guildData);
        // Set the current hero as default selection if available
        if (hero) {
          setSelectedHeroForInvite(hero);
        }
        setShowInviteAcceptModal(true);
      }).catch(error => {
        console.error('Failed to load invite:', error);
        alert(error.response?.data?.error || 'Failed to load invite information. The invite may have expired.');
        sessionStorage.removeItem('pendingGuildInvite');
      });
    }
  }, [hero, guild]);

  // Check which heroes already have guilds when invite modal opens
  useEffect(() => {
    if (showInviteAcceptModal && heroes && heroes.length > 0) {
      const checkHeroGuilds = async () => {
        const heroesWithGuildsSet = new Set<string>();
        await Promise.all(
          heroes.map(async (h) => {
            try {
              // Use hero ID to check guild membership
              const heroGuild = await guildAPI.getMyGuild(h.id);
              if (heroGuild) {
                heroesWithGuildsSet.add(h.id);
              }
            } catch (err) {
              // If error, assume no guild (might be 404 or other error)
              console.log(`Hero ${h.id} guild check:`, err);
            }
          })
        );
        setHeroesWithGuilds(heroesWithGuildsSet);
      };
      checkHeroGuilds();
    } else if (!showInviteAcceptModal) {
      // Clear the set when modal closes
      setHeroesWithGuilds(new Set());
    }
  }, [showInviteAcceptModal, heroes]);

  // Handle accepting invite - MUST be before early return
  const handleAcceptInvite = async () => {
    if (!pendingGuildInviteId || !selectedHeroForInvite) {
      alert('Please select a hero to join the guild with');
      return;
    }
    
    try {
      // Use the acceptInvite endpoint with the actual invite ID and selected hero
      const response = await guildAPI.acceptInvite(
        pendingGuildInviteId,
        selectedHeroForInvite.id,
        selectedHeroForInvite.name,
        selectedHeroForInvite.role,
        selectedHeroForInvite.level
      );
      
      if (response.success) {
        alert(`Successfully joined the guild with ${selectedHeroForInvite.name}!`);
        setShowInviteAcceptModal(false);
        setPendingGuildInviteId(null);
        setInviteData(null);
        setSelectedHeroForInvite(null);
        sessionStorage.removeItem('pendingGuildInvite');
        if (refetchGuild) {
          await refetchGuild();
        }
        // Reload the page to refresh guild data
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Failed to accept invite:', error);
      alert(error.response?.data?.error || 'Failed to join guild');
    }
  };

  // Render invite modal component
  const renderInviteModal = () => {
    if (!showInviteAcceptModal || !inviteGuildData || !inviteData) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => {
        setShowInviteAcceptModal(false);
        setInviteData(null);
        sessionStorage.removeItem('pendingGuildInvite');
      }}>
        <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border-2 border-purple-600 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-xl font-bold text-white mb-4">Guild Invitation</h3>
          <div className="mb-4">
            <div className="text-white mb-3 text-lg">
              <span className="text-purple-400 font-semibold">{inviteData.inviterHeroName || 'Someone'}</span>
              {' '}has invited you to join{' '}
              <span className="text-purple-400 font-semibold">{inviteGuildData.name}</span>.
            </div>
            <div className="text-lg text-gray-300 mb-3">Do you accept?</div>
            <div className="text-sm text-gray-400 space-y-1 bg-gray-900 rounded p-3 mb-4">
              <div>Guild: <span className="text-white">{inviteGuildData.name}</span></div>
              <div>Members: {inviteGuildData.memberIds?.length || 0} / {inviteGuildData.maxMembers || 50}</div>
              <div>Level: {inviteGuildData.level || 1}</div>
              <div>Invited by: <span className="text-purple-400">{inviteData.inviterHeroName || 'Unknown'}</span></div>
            </div>
            
            {/* Hero Selection */}
            <div className="mb-4">
              <label className="block text-white mb-2 font-semibold">Select Hero to Join With:</label>
              {heroes && heroes.length > 0 ? (() => {
                // Filter out heroes that already have guilds
                const availableHeroes = heroes.filter(h => !heroesWithGuilds.has(h.id));
                return availableHeroes.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {availableHeroes.map((h) => {
                      const isSelected = selectedHeroForInvite?.id === h.id;
                      return (
                        <button
                          key={h.id}
                          onClick={() => setSelectedHeroForInvite(h)}
                          className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                            isSelected
                              ? 'bg-purple-900/50 border-purple-500'
                              : 'bg-gray-700 border-gray-600 hover:border-purple-400'
                          }`}
                        >
                          <div className="text-white font-semibold">{h.name || 'Unknown'}</div>
                          <div className="text-xs text-gray-400">Level {h.level || 1} {h.role || 'Unknown'}</div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm p-3 bg-gray-700 rounded-lg border border-gray-600">
                    All your heroes are already in guilds.
                  </div>
                );
              })() : hero ? (
                <div className="p-3 bg-gray-700 rounded-lg border border-gray-600">
                  <div className="text-white font-semibold">{hero.name || 'Unknown'}</div>
                  <div className="text-xs text-gray-400">Level {hero.level || 1} {hero.role || 'Unknown'}</div>
                </div>
              ) : (
                <div className="text-gray-400 text-sm">No heroes available</div>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAcceptInvite}
              disabled={!selectedHeroForInvite}
              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors font-semibold"
            >
              Accept
            </button>
            <button
              onClick={() => {
                setShowInviteAcceptModal(false);
                setInviteData(null);
                setSelectedHeroForInvite(null);
                sessionStorage.removeItem('pendingGuildInvite');
              }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Calculate derived values - MUST be before early return
  const sortedMembers = guild ? [...members].sort((a, b) => {
    const rankOrder = { leader: 0, officer: 1, member: 2 };
    return rankOrder[a.rank] - rankOrder[b.rank] || b.contributionPoints - a.contributionPoints;
  }) : [];
  const currentJoinMode = guild?.joinMode || 'open';
  const hasPendingApplications = (guild?.pendingApplications || []).length > 0;

  if (!guild) {
    return (
      <>
        {renderInviteModal()}
        <div className="space-y-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
          <h3 className="text-2xl font-bold text-white mb-2">No Guild</h3>
          <p className="text-gray-400 mb-6">You're not in a guild yet!</p>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => setShowCreateGuild(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors font-semibold"
            >
              Create Guild
            </button>
            <button 
              onClick={loadGuilds}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors font-semibold"
            >
              Find a Guild
            </button>
          </div>
        </div>

        {showCreateGuild && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Create New Guild</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-white mb-2 font-semibold">Guild Name</label>
                <input
                  type="text"
                  value={guildName}
                  onChange={(e) => setGuildName(e.target.value)}
                  placeholder="Enter guild name..."
                  maxLength={30}
                  className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
                <div className="text-xs text-gray-400 mt-1">{guildName.length}/30 characters</div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCreateGuild}
                  disabled={!guildName.trim() || creating}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-semibold disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create Guild'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateGuild(false);
                    setGuildName('');
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showGuildList && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Find a Guild</h3>
              <button
                onClick={() => {
                  setShowGuildList(false);
                  setSearchTerm('');
                  setSelectedGuild(null);
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
            
            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search guilds by name..."
                className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Guild List */}
            {loadingGuilds ? (
              <div className="text-center py-8 text-gray-400">Loading guilds...</div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {guilds
                  .filter(g => 
                    !searchTerm || 
                    g.name.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((guild) => (
                    <div
                      key={guild.id}
                      className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-purple-500 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-lg font-bold text-white">{guild.name}</h4>
                            <span className="text-xs px-2 py-1 bg-purple-900/50 text-purple-300 rounded">
                              {guild.joinMode === 'open' ? 'Open' : 'Approval Required'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-400 space-y-1">
                            <div>Members: {guild.memberIds?.length || 0} / {guild.maxMembers || 50}</div>
                            <div>Level: {guild.level || 1}</div>
                            {guild.createdByHeroName && (
                              <div>Leader: {guild.createdByHeroName}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {guild.joinMode === 'open' ? (
                            <button
                              onClick={() => handleJoinGuild(guild)}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-semibold"
                            >
                              Join
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedGuild(guild);
                                setShowApplyModal(true);
                              }}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-semibold"
                            >
                              Apply
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                {guilds.filter(g => 
                  !searchTerm || 
                  g.name.toLowerCase().includes(searchTerm.toLowerCase())
                ).length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    {searchTerm ? 'No guilds found matching your search' : 'No guilds available'}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Apply Modal */}
        {showApplyModal && selectedGuild && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setShowApplyModal(false)}>
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border-2 border-gray-600" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-white mb-4">Apply to {selectedGuild.name}</h3>
              <div className="mb-4">
                <label className="block text-white mb-2 font-semibold">Application Message (Optional)</label>
                <textarea
                  value={applyMessage}
                  onChange={(e) => setApplyMessage(e.target.value)}
                  placeholder="Tell the guild leaders why you want to join..."
                  maxLength={500}
                  rows={4}
                  className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
                <div className="text-xs text-gray-400 mt-1">{applyMessage.length}/500 characters</div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleApplyToGuild}
                  disabled={applying}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-semibold disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  {applying ? 'Submitting...' : 'Submit Application'}
                </button>
                <button
                  onClick={() => {
                    setShowApplyModal(false);
                    setApplyMessage('');
                    setSelectedGuild(null);
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {renderInviteModal()}
      </div>
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Guild Header */}
      <div className="bg-gradient-to-br from-purple-900 to-gray-800 rounded-lg p-6 shadow-lg border border-purple-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">{guild.name}</h2>
            <div className="text-purple-400 mt-1">Level {guild.level || 1} Guild</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Guild Gold</div>
            <div className="text-2xl font-bold text-yellow-500">{formatNumber(guild.gold || 0)}</div>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-6 text-sm">
            <div>
              <span className="text-gray-400">Members: </span>
              <span className="text-white font-semibold">{guild.memberIds?.length || 0} / {guild.maxMembers || 50}</span>
            </div>
            <div>
              <span className="text-gray-400">Join Mode: </span>
              <span className="text-purple-400 font-semibold">
                {currentJoinMode === 'open' ? 'Open' : 'Approval Required'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Founded by: </span>
              <span className="text-purple-400 font-semibold">
                {(guild as any).createdByHeroName || guild.members?.find(m => m.rank === 'leader')?.username || 'Unknown'}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {isLeader && (
              <>
                <button
                  onClick={() => {
                    setJoinMode(currentJoinMode);
                    setShowSettings(true);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-semibold"
                >
                  ⚙️ Settings
                </button>
                {hasPendingApplications && (
                  <button
                    onClick={loadApplications}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors text-sm font-semibold relative"
                  >
                    📋 Applications
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {(guild.pendingApplications || []).length}
                    </span>
                  </button>
                )}
              </>
            )}
            {hero?.id && (
              <button
                onClick={async () => {
                  if (isLeader && guild.memberIds && guild.memberIds.length > 1) {
                    if (!confirm(`You are the leader of ${guild.name}. If you leave, the guild will need a new leader. Are you sure you want to leave?`)) return;
                  } else if (!confirm(`Are you sure you want to leave ${guild.name}?`)) return;
                  try {
                    await guildAPI.leaveGuild(guild.id, hero.id);
                    alert('Left guild successfully');
                    if (refetchGuild) {
                      await refetchGuild();
                    } else {
                      window.location.reload();
                    }
                  } catch (err: any) {
                    alert(err.response?.data?.error || 'Failed to leave guild');
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-semibold"
              >
                Leave Guild
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
            activeTab === 'overview'
              ? 'text-purple-400 border-purple-400'
              : 'text-gray-400 border-transparent hover:text-gray-300'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('raids')}
          className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
            activeTab === 'raids'
              ? 'text-purple-400 border-purple-400'
              : 'text-gray-400 border-transparent hover:text-gray-300'
          }`}
        >
          Guild Raids
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'raids' && hero ? (
        <GuildRaidsPanel hero={hero} guildId={guild.id} />
      ) : activeTab === 'overview' && (
        <div className="space-y-6">

      {/* Invite Link Section */}
      {isLeader && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Invite to Guild</h3>
          <div className="space-y-4">
            <button
              onClick={generateInviteLink}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-semibold"
            >
              📋 Generate Invite Link
            </button>
            {showInviteLink && inviteLink && (
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-600">
                <div className="text-sm text-gray-400 mb-2">Copy this link to invite heroes to your guild:</div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(inviteLink);
                      alert('Invite link copied to clipboard!');
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors text-sm font-semibold"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Guild Perks */}
      {guild.perks && (guild.perks.craftingBonus || guild.perks.gatherBonus || guild.perks.combatBonus) && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Guild Perks</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {guild.perks?.craftingBonus && (
              <div className="bg-green-900/30 border border-green-600 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">⚗️</div>
                <div className="text-sm text-gray-300">Crafting Bonus</div>
                <div className="text-xl font-bold text-green-400">+{guild.perks.craftingBonus * 100}%</div>
              </div>
            )}
            {guild.perks?.gatherBonus && (
              <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">🌿</div>
                <div className="text-sm text-gray-300">Gathering Bonus</div>
                <div className="text-xl font-bold text-blue-400">+{guild.perks.gatherBonus * 100}%</div>
              </div>
            )}
            {guild.perks?.combatBonus && (
              <div className="bg-red-900/30 border border-red-600 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">⚔️</div>
                <div className="text-sm text-gray-300">Combat Bonus</div>
                <div className="text-xl font-bold text-red-400">+{guild.perks.combatBonus * 100}%</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Crafting Stations */}
      {guild.craftingStations && guild.craftingStations.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Crafting Stations</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {guild.craftingStations?.map((station) => (
              <div key={station.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <div className="font-semibold text-white capitalize">
                  {station.type.replace(/_/g, ' ')}
                </div>
                <div className="text-sm text-gray-400 mt-1">Level {station.level}</div>
                <div className="text-sm text-green-400 mt-2">
                  +{station.bonusQuality * 100}% Quality
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members */}
      <div 
        className="bg-gray-800 rounded-lg p-6 border border-gray-700"
        onClick={() => setShowMemberMenu(null)} // Close menu when clicking outside
      >
        <h3 className="text-xl font-bold text-white mb-4">
          Members ({loadingMembers ? '...' : members.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedMembers.map((member) => {
            const professionIcon = member.profession?.type === 'herbalism' ? '🌿' : 
                                  member.profession?.type === 'mining' ? '⛏️' : 
                                  member.profession?.type === 'enchanting' ? '✨' : null;
            
            return (
              <div 
                key={member.userId}
                className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors border border-gray-600"
              >
                {/* Header with rank and name */}
                <div className="flex items-center space-x-2 mb-3 relative">
                  <div className="text-xl">
                    {member.rank === 'leader' ? '👑' : member.rank === 'officer' ? '⭐' : '🗡️'}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="font-bold text-white text-base truncate">{member.username}</div>
                    <div className="text-xs text-gray-400 capitalize">{member.rank}</div>
                  </div>
                  {/* 3-dot menu button - don't show for own hero */}
                  {member.userId !== hero?.id && (
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMemberMenu(showMemberMenu === member.userId ? null : member.userId);
                        }}
                        className="text-gray-400 hover:text-gray-200 transition-colors px-1"
                        title="Member actions"
                      >
                        ⋮
                      </button>
                      {showMemberMenu === member.userId && (
                        <div className="absolute right-0 top-6 bg-gray-800 border border-gray-600 rounded shadow-lg z-50 min-w-[150px]">
                          <button
                            onClick={() => {
                              if (onStartWhisper) {
                                onStartWhisper(member.userId, member.username);
                              } else {
                                alert('Whisper functionality not available');
                              }
                              setShowMemberMenu(null);
                            }}
                            className="w-full text-left px-3 py-2 text-xs text-blue-400 hover:bg-gray-700 transition-colors"
                          >
                            💬 Whisper
                          </button>
                          <button
                            onClick={() => handleInviteToParty(member)}
                            className="w-full text-left px-3 py-2 text-xs text-green-400 hover:bg-gray-700 transition-colors"
                          >
                            👥 Invite to Party
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Hero Class and Level - Always show */}
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-600">
                  <span className={`px-2 py-1 rounded font-semibold text-sm ${getRoleBg(member.heroRole || 'warrior')} text-white`}>
                    {member.heroRole || 'Unknown'}
                  </span>
                  <span className="text-gray-300 font-semibold">Level {member.heroLevel || 1}</span>
                </div>
                
                {/* Profession */}
                {member.profession && (
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-300 flex items-center gap-1">
                      {professionIcon} <span className="capitalize">{member.profession.type}</span>
                    </span>
                    <span className="text-gray-400">Lv {member.profession.level}</span>
                  </div>
                )}
                
                {/* Contribution Points */}
                <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-600">
                  <span className="text-gray-400">Contribution:</span>
                  <span className="text-yellow-400 font-semibold">{formatNumber(member.contributionPoints || 0)} pts</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </div>
      )}

      {/* Guild Settings Modal (Leader Only) */}
      {showSettings && isLeader && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setShowSettings(false)}>
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border-2 border-gray-600" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4">Guild Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-white mb-2 font-semibold">Join Mode</label>
                <select
                  value={joinMode}
                  onChange={(e) => setJoinMode(e.target.value as 'open' | 'approval')}
                  className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="open">Open - Anyone can join immediately</option>
                  <option value="approval">Approval Required - Applications need leader/officer approval</option>
                </select>
                <div className="text-xs text-gray-400 mt-2">
                  {joinMode === 'open' 
                    ? 'Players can join your guild instantly without approval.'
                    : 'Players must apply and wait for approval from guild leaders.'}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleUpdateSettings}
                  disabled={updatingSettings || joinMode === currentJoinMode}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-semibold disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  {updatingSettings ? 'Updating...' : 'Save Settings'}
                </button>
                <button
                  onClick={() => {
                    setShowSettings(false);
                    setJoinMode(currentJoinMode);
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Applications Modal (Leader/Officer Only) */}
      {showApplications && isLeader && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setShowApplications(false)}>
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full border-2 border-gray-600 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Pending Applications</h3>
              <button
                onClick={() => setShowApplications(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
            {pendingApplications.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No pending applications</div>
            ) : (
              <div className="space-y-3">
                {pendingApplications.map((app, index) => (
                  <div key={app.heroId || index} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-white mb-1">{app.heroName || 'Unknown'}</div>
                        <div className="text-sm text-gray-400 space-y-1">
                          {app.heroRole && (
                            <div>Class: {app.heroRole} {app.heroLevel ? `Lv${app.heroLevel}` : ''}</div>
                          )}
                          {app.appliedAt && (
                            <div className="text-xs text-gray-400">Applied: {
                              (() => {
                                try {
                                  // Handle Firestore Timestamp object
                                  if (app.appliedAt?.toMillis) {
                                    return new Date(app.appliedAt.toMillis()).toLocaleString();
                                  }
                                  // Handle Firestore Timestamp with seconds/nanoseconds
                                  if (app.appliedAt?.seconds) {
                                    return new Date(app.appliedAt.seconds * 1000).toLocaleString();
                                  }
                                  // Handle plain number (milliseconds)
                                  if (typeof app.appliedAt === 'number') {
                                    return new Date(app.appliedAt).toLocaleString();
                                  }
                                  // Handle string date
                                  if (typeof app.appliedAt === 'string') {
                                    return new Date(app.appliedAt).toLocaleString();
                                  }
                                  // Try to parse as date
                                  const date = new Date(app.appliedAt);
                                  if (!isNaN(date.getTime())) {
                                    return date.toLocaleString();
                                  }
                                  return 'Unknown';
                                } catch (err) {
                                  console.error('Error parsing date:', err, app.appliedAt);
                                  return 'Invalid date';
                                }
                              })()
                            }</div>
                          )}
                          {app.message && (
                            <div className="mt-2 p-2 bg-gray-800 rounded text-gray-300 text-sm">
                              "{app.message}"
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveApplication(app.heroId)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-semibold"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectApplication(app.heroId)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-semibold"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {renderInviteModal()}
    </div>
  );
}
