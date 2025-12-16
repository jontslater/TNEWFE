import { useState, useEffect } from 'react';
import { partyAPI } from '../api/client';
import { Hero } from '../types/Hero';
import { useAuth } from '../hooks/useAuth';
import PartyInviteForm from './PartyInviteForm';
import PartyQueueModal from './PartyQueueModal';

interface PartyMember {
  userId: string;
  username: string;
  heroId: string;
  heroName: string;
  heroRole: string;
  heroLevel: number;
}

interface Party {
  id: string;
  leaderId: string;
  members: string[];
  memberData: PartyMember[];
  status: 'forming' | 'queued' | 'in_instance' | 'disbanded';
  queueType?: 'dungeon' | 'raid';
  createdAt: number;
  updatedAt: number;
}

interface PartyInvite {
  id: string;
  partyId: string;
  inviterId: string;
  inviteeId: string;
  inviteeName: string;
  heroId: string;
  heroName: string;
  heroRole: string;
  heroLevel: number;
  status: string;
  createdAt: number;
  expiresAt: number | null;
}

interface PartyPanelProps {
  hero: Hero;
  onPartyUpdate?: () => void;
}

export default function PartyPanel({ hero, onPartyUpdate }: PartyPanelProps) {
  const { user } = useAuth();
  const [party, setParty] = useState<Party | null>(null);
  const [invites, setInvites] = useState<PartyInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [acceptingInvite, setAcceptingInvite] = useState<string | null>(null);
  const [decliningInvite, setDecliningInvite] = useState<string | null>(null);
  const [queueTime, setQueueTime] = useState<number | null>(null);
  const [cancellingQueue, setCancellingQueue] = useState(false);

  const userId = user?.twitchId || user?.id;

  useEffect(() => {
    if (userId) {
      loadParty();
      loadInvites();
      // Poll for party updates and invites every 5 seconds
      const interval = setInterval(() => {
        loadParty();
        loadInvites();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  const loadParty = async () => {
    if (!userId) return;
    
    try {
      const response = await partyAPI.getParty(userId);
      if (response.success) {
        setParty(response.party);
        
        // If party is queued, get the queue time
        if (response.party?.status === 'queued') {
          loadQueueTime(response.party);
        } else {
          setQueueTime(null);
        }
      } else {
        setParty(null);
        setQueueTime(null);
      }
    } catch (error) {
      console.error('Failed to load party:', error);
      setParty(null);
      setQueueTime(null);
    } finally {
      setLoading(false);
    }
  };

  const loadQueueTime = async (partyData: any) => {
    try {
      // Use party's updatedAt timestamp as queue time (set when status changes to queued)
      if (partyData.updatedAt) {
        const updatedAt = partyData.updatedAt?.toMillis?.() || partyData.updatedAt || Date.now();
        setQueueTime(updatedAt);
      } else {
        // Fallback to current time if no timestamp
        setQueueTime(Date.now());
      }
    } catch (error) {
      console.error('Failed to load queue time:', error);
      setQueueTime(Date.now());
    }
  };

  const loadInvites = async () => {
    if (!userId) return;
    
    try {
      const response = await partyAPI.getInvites(userId);
      if (response.success) {
        setInvites(response.invites || []);
      }
    } catch (error) {
      console.error('Failed to load invites:', error);
    }
  };

  const handleAcceptInvite = async (inviteId: string) => {
    if (!userId) return;

    setAcceptingInvite(inviteId);
    try {
      const response = await partyAPI.acceptInvite(inviteId, userId);
      if (response.success) {
        // Reload party and invites
        await loadParty();
        await loadInvites();
        if (onPartyUpdate) onPartyUpdate();
      }
    } catch (error: any) {
      console.error('Failed to accept invite:', error);
      alert(error.response?.data?.error || 'Failed to accept invite');
    } finally {
      setAcceptingInvite(null);
    }
  };

  const handleDeclineInvite = async (inviteId: string) => {
    if (!userId) return;

    setDecliningInvite(inviteId);
    try {
      const response = await partyAPI.declineInvite(inviteId, userId);
      if (response.success) {
        await loadInvites();
      }
    } catch (error: any) {
      console.error('Failed to decline invite:', error);
      alert(error.response?.data?.error || 'Failed to decline invite');
    } finally {
      setDecliningInvite(null);
    }
  };

  const handleCreateParty = async () => {
    if (!userId || !hero) return;

    setCreating(true);
    try {
      const response = await partyAPI.createParty(
        userId,
        hero.name || user?.twitchUsername || userId,
        hero.id,
        hero.name || 'Unknown',
        hero.role || 'berserker',
        hero.level || 1
      );

      if (response.success) {
        setParty(response.party);
        if (onPartyUpdate) onPartyUpdate();
      }
    } catch (error: any) {
      console.error('Failed to create party:', error);
      alert(error.response?.data?.error || 'Failed to create party');
    } finally {
      setCreating(false);
    }
  };

  const handleLeaveParty = async () => {
    if (!party || !userId) return;

    if (!confirm('Are you sure you want to leave the party?')) return;

    setLeaving(true);
    try {
      const response = await partyAPI.leaveParty(party.id, userId);
      if (response.success) {
        setParty(null);
        if (onPartyUpdate) onPartyUpdate();
      }
    } catch (error: any) {
      console.error('Failed to leave party:', error);
      alert(error.response?.data?.error || 'Failed to leave party');
    } finally {
      setLeaving(false);
    }
  };

  const handleCancelQueue = async () => {
    if (!party || !userId || !isLeader) return;

    if (!confirm('Are you sure you want to cancel the queue? This will remove all party members from the queue.')) {
      return;
    }

    setCancellingQueue(true);
    try {
      const response = await partyAPI.cancelQueue(party.id, userId);
      if (response.success) {
        await loadParty();
        if (onPartyUpdate) onPartyUpdate();
      } else {
        alert(response.message || 'Failed to cancel queue');
      }
    } catch (error: any) {
      console.error('Failed to cancel queue:', error);
      alert(error.response?.data?.error || 'Failed to cancel queue');
    } finally {
      setCancellingQueue(false);
    }
  };

  const handleKickMember = async (memberId: string) => {
    if (!party || !userId || party.leaderId !== userId) return;

    if (!confirm('Are you sure you want to kick this member?')) return;

    try {
      const response = await partyAPI.kickMember(party.id, userId, memberId);
      if (response.success) {
        loadParty();
        if (onPartyUpdate) onPartyUpdate();
      }
    } catch (error: any) {
      console.error('Failed to kick member:', error);
      alert(error.response?.data?.error || 'Failed to kick member');
    }
  };

  const getRoleColor = (role: string) => {
    const roleLower = role.toLowerCase();
    if (['guardian', 'paladin', 'warden', 'bloodknight', 'vanguard', 'brewmaster'].includes(roleLower)) {
      return 'text-blue-400';
    }
    if (['cleric', 'atoner', 'druid', 'lightbringer', 'shaman', 'mistweaver', 'chronomancer', 'bard'].includes(roleLower)) {
      return 'text-green-400';
    }
    return 'text-red-400';
  };

  const getRoleIcon = (role: string) => {
    const roleLower = role.toLowerCase();
    if (['guardian', 'paladin', 'warden', 'bloodknight', 'vanguard', 'brewmaster'].includes(roleLower)) {
      return '🛡️';
    }
    if (['cleric', 'atoner', 'druid', 'lightbringer', 'shaman', 'mistweaver', 'chronomancer', 'bard'].includes(roleLower)) {
      return '💚';
    }
    return '⚔️';
  };

  const getPartyComposition = () => {
    if (!party) return { tanks: 0, healers: 0, dps: 0 };
    
    const composition = { tanks: 0, healers: 0, dps: 0 };
    party.memberData.forEach(member => {
      const roleLower = member.heroRole.toLowerCase();
      if (['guardian', 'paladin', 'warden', 'bloodknight', 'vanguard', 'brewmaster'].includes(roleLower)) {
        composition.tanks++;
      } else if (['cleric', 'atoner', 'druid', 'lightbringer', 'shaman', 'mistweaver', 'chronomancer', 'bard'].includes(roleLower)) {
        composition.healers++;
      } else {
        composition.dps++;
      }
    });
    return composition;
  };

  // Format queue time
  const formatQueueTime = (queuedAt: number) => {
    const now = Date.now();
    const elapsed = Math.floor((now - queuedAt) / 1000); // seconds
    
    if (elapsed < 60) {
      return `${elapsed}s`;
    } else if (elapsed < 3600) {
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      return `${minutes}m ${seconds}s`;
    } else {
      const hours = Math.floor(elapsed / 3600);
      const minutes = Math.floor((elapsed % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };

  // Update queue time display every second
  const [timerTick, setTimerTick] = useState(0);
  
  useEffect(() => {
    if (party?.status === 'queued' && queueTime) {
      const interval = setInterval(() => {
        // Force re-render to update timer
        setTimerTick(prev => prev + 1);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [party?.status, queueTime]);

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="text-center text-gray-400">Loading party...</div>
      </div>
    );
  }

  if (!party) {
    return (
      <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">👥 Party</h3>
        
        {/* Pending Invites */}
        {invites.filter(invite => {
          // Filter out expired invites
          if (invite.expiresAt && invite.expiresAt < Date.now()) {
            return false;
          }
          return true;
        }).length > 0 && (
          <div className="mb-4 space-y-2">
            <div className="text-sm font-semibold text-yellow-400 mb-2">
              📨 Pending Invites ({invites.filter(invite => {
                if (invite.expiresAt && invite.expiresAt < Date.now()) return false;
                return true;
              }).length})
            </div>
            {invites.filter(invite => {
              // Filter out expired invites
              if (invite.expiresAt && invite.expiresAt < Date.now()) {
                return false;
              }
              return true;
            }).map((invite) => {
              const timeLeft = invite.expiresAt 
                ? Math.max(0, Math.floor((invite.expiresAt - Date.now()) / 1000))
                : null;
              const isExpired = invite.expiresAt && invite.expiresAt < Date.now();

              return (
                <div
                  key={invite.id}
                  className={`p-3 bg-gray-700 rounded border-2 ${
                    isExpired ? 'border-red-600 opacity-60' : 'border-yellow-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-semibold text-white text-sm">
                        📨 Party Invite
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        From: {invite.inviterName || invite.inviterId || 'Unknown'} • Hero: {invite.heroName} ({invite.heroRole} Lv{invite.heroLevel})
                      </div>
                      {timeLeft !== null && (
                        <div className="text-xs text-yellow-400 mt-1">
                          Expires in {timeLeft}s
                        </div>
                      )}
                    </div>
                    {(
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptInvite(invite.id)}
                          disabled={acceptingInvite === invite.id || decliningInvite === invite.id}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {acceptingInvite === invite.id ? 'Joining...' : 'Accept'}
                        </button>
                        <button
                          onClick={() => handleDeclineInvite(invite.id)}
                          disabled={acceptingInvite === invite.id || decliningInvite === invite.id}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {decliningInvite === invite.id ? 'Declining...' : 'Decline'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-gray-400 mb-4">Form a party to queue together for dungeons and raids!</p>
        <button
          onClick={handleCreateParty}
          disabled={creating || !hero}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {creating ? 'Creating...' : 'Create Party'}
        </button>
      </div>
    );
  }

  const isLeader = party.leaderId === userId;
  const composition = getPartyComposition();

  return (
    <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">👥 Party</h3>
          <span className="text-xs text-gray-400">
            {party.members.length} / {party.queueType === 'raid' ? 20 : 5} members
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isLeader && !showInviteForm && (
            <button
              onClick={() => setShowInviteForm(true)}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors font-semibold"
            >
              + Invite
            </button>
          )}
          <button
            onClick={handleLeaveParty}
            disabled={leaving}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {leaving ? 'Leaving...' : 'Leave'}
          </button>
        </div>
      </div>

      {/* Party Composition */}
      <div className="mb-4 p-3 bg-gray-700/50 rounded border border-gray-600">
        <div className="text-xs text-gray-400 mb-2 font-semibold">Party Composition</div>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="text-center">
            <div className="text-blue-400 font-semibold text-base">🛡️ {composition.tanks}</div>
            <div className="text-gray-500 text-xs">Tanks</div>
          </div>
          <div className="text-center">
            <div className="text-green-400 font-semibold text-base">💚 {composition.healers}</div>
            <div className="text-gray-500 text-xs">Healers</div>
          </div>
          <div className="text-center">
            <div className="text-red-400 font-semibold text-base">⚔️ {composition.dps}</div>
            <div className="text-gray-500 text-xs">DPS</div>
          </div>
        </div>
      </div>

      {/* Party Members */}
      <div className="space-y-2 mb-4">
        {party.memberData.map((member) => (
          <div
            key={member.userId}
            className="flex items-center justify-between p-3 bg-gray-700/50 rounded border border-gray-600 hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-xl flex-shrink-0">{getRoleIcon(member.heroRole)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-white truncate">{member.username}</span>
                  {member.userId === party.leaderId && (
                    <span className="text-xs bg-yellow-600 text-white px-2 py-0.5 rounded flex-shrink-0">Leader</span>
                  )}
                </div>
                <div className="text-xs text-gray-400 space-y-0.5">
                  <div>
                    <span className={getRoleColor(member.heroRole)}>{member.heroRole}</span>
                    {' • '}
                    <span className="text-white">Lv{member.heroLevel}</span>
                  </div>
                  <div className="text-gray-500 truncate">{member.heroName}</div>
                </div>
              </div>
            </div>
            {isLeader && member.userId !== userId && (
              <button
                onClick={() => handleKickMember(member.userId)}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors font-semibold flex-shrink-0 ml-2"
                title="Kick member"
              >
                Kick
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Queue as Party Button */}
      {isLeader && (party.status === 'forming' || party.status === 'in_instance') && (
        <div className="mt-4 pt-4 border-t border-gray-700 space-y-2">
          <button
            onClick={() => setShowQueueModal(true)}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded transition-colors"
          >
            🚀 Queue as Party
          </button>
        </div>
      )}

      {/* Queue Modal */}
      {showQueueModal && party && (
        <PartyQueueModal
          partyId={party.id}
          partyMembers={party.memberData}
          onClose={() => setShowQueueModal(false)}
          onQueued={() => {
            loadParty();
            if (onPartyUpdate) onPartyUpdate();
          }}
        />
      )}

      {/* Invite Form */}
      {showInviteForm && party && (
        <div className="mt-4">
          <PartyInviteForm
            partyId={party.id}
            inviterId={userId!}
            onClose={() => setShowInviteForm(false)}
            onInvited={() => {
              loadParty();
              setShowInviteForm(false);
              if (onPartyUpdate) onPartyUpdate();
            }}
          />
        </div>
      )}
    </div>
  );
}
