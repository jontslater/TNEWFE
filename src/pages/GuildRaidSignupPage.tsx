import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { raidAPI, guildAPI } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useHero } from '../hooks/useHero';
import { useGuild } from '../hooks/useGuild';
import { getItemScore } from '../utils/format';

export default function GuildRaidSignupPage() {
  const { raidId } = useParams<{ raidId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hero } = useHero(user?.twitchId || null);
  const { guild, loading: guildLoading } = useGuild(hero?.id || null);
  
  const [raid, setRaid] = useState<any | null>(null);
  const [members, setMembers] = useState<Array<{userId: string, username: string, hero: any | null}>>([]);
  const [assignedPlayers, setAssignedPlayers] = useState<Array<{userId: string, heroId: string, heroName: string, heroLevel: number, heroRole: string, itemScore: number}>>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduledTime, setScheduledTime] = useState<string>(''); // ISO datetime string
  const [startMode, setStartMode] = useState<'now' | 'scheduled'>('now');
  const [simulateMode, setSimulateMode] = useState<boolean>(false); // Simulate vs Live combat

  useEffect(() => {
    if (!raidId || !hero?.id) return;
    
    loadData();
  }, [raidId, hero?.id]);

  const loadData = async () => {
    if (!raidId || !hero?.id) return;
    
    try {
      setLoading(true);
      
      // Fetch raid data
      console.log('[Guild Raid Signup] Loading raid:', raidId);
      const raids = await raidAPI.getRaids();
      console.log('[Guild Raid Signup] Available raids:', raids.map((r: any) => ({ id: r.id, name: r.name })));
      
      const foundRaid = raids.find((r: any) => r.id === raidId);
      if (!foundRaid) {
        console.error('[Guild Raid Signup] Raid not found! raidId:', raidId);
        console.error('[Guild Raid Signup] Available raid IDs:', raids.map((r: any) => r.id));
        setError(`Raid not found (ID: ${raidId})`);
        setLoading(false);
        return;
      }
      console.log('[Guild Raid Signup] Found raid:', foundRaid.name);
      setRaid(foundRaid);
      
      // Fetch guild members with heroes
      if (guild) {
        const membersData = await guildAPI.getGuildMembersWithHeroes(guild.id);
        setMembers(membersData.members);
        
        // Check if there's an existing signup
        const signupData = await raidAPI.getGuildRaidSignup(raidId, guild.id);
        if (signupData.signedUp && signupData.signup) {
          setAssignedPlayers(signupData.signup.assignedPlayers || []);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load data');
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (guild && raidId) {
      loadData();
    }
  }, [guild, raidId]);

  const handleAssignPlayer = (member: {userId: string, username: string, hero: any | null}) => {
    if (!member.hero) {
      alert('This member does not have a hero');
      return;
    }
    
    if (assignedPlayers.some(p => p.userId === member.userId)) {
      return; // Already assigned
    }
    
    if (assignedPlayers.length >= (raid?.maxPlayers || 10)) {
      alert(`Maximum ${raid?.maxPlayers || 10} players allowed`);
      return;
    }
    
    const hero = member.hero;
    const itemScore = getItemScore(hero.equipment || {}, hero.role);
    
    setAssignedPlayers(prev => [...prev, {
      userId: member.userId,
      heroId: hero.id || member.userId,
      heroName: hero.name || member.username,
      heroLevel: hero.level || 1,
      heroRole: hero.role || 'dps',
      itemScore
    }]);
  };

  const handleRemovePlayer = (userId: string) => {
    setAssignedPlayers(prev => prev.filter(p => p.userId !== userId));
  };

  const handleSignup = async (startNow: boolean = false) => {
    if (!raid || !guild) return;
    
    // Only require minimum players if starting NOW
    if (startNow) {
      const minRequired = Math.ceil(raid.minPlayers / 2);
      if (assignedPlayers.length < minRequired) {
        alert(`Need at least ${minRequired} players to start now (half of ${raid.minPlayers} minimum)`);
        return;
      }
    }
    
    // Validate requirements for assigned players
    for (const player of assignedPlayers) {
      if (player.heroLevel < raid.minLevel) {
        alert(`${player.heroName} does not meet level requirement (Level ${raid.minLevel} required)`);
        return;
      }
      if (player.itemScore < raid.minItemScore) {
        alert(`${player.heroName} does not meet item score requirement (${raid.minItemScore} required)`);
        return;
      }
    }
    
    // Validate scheduled time if not starting now
    if (!startNow && startMode === 'scheduled') {
      if (!scheduledTime) {
        alert('Please select a start time');
        return;
      }
      const scheduledDate = new Date(scheduledTime);
      if (scheduledDate <= new Date()) {
        alert('Scheduled time must be in the future');
        return;
      }
    }
    
    try {
      setSubmitting(true);
      
      const signupData = {
        assignedPlayers,
        startMode: startNow ? 'now' : startMode,
        scheduledTime: startNow ? null : (startMode === 'scheduled' ? scheduledTime : null)
      };
      
      if (startNow) {
        if (simulateMode) {
          // Simulate raid instantly
          const heroIds = assignedPlayers.map(p => p.heroId);
          await raidAPI.simulateRaid(raidId!, heroIds);
          alert('Raid simulated! Check your rewards (70% loot quality)');
          navigate('/portal');
        } else {
          // Start raid immediately (live combat)
          const heroIds = assignedPlayers.map(p => p.heroId);
          await raidAPI.startRaid(raidId!, heroIds);
          alert('Guild raid started!');
          navigate('/portal');
        }
      } else {
        // Create scheduled raid signup (allows members to self-signup)
        await raidAPI.createScheduledGuildRaid(raidId!, guild.id, {
          scheduledTime: scheduledTime || null,
          organizer: hero!.id,
          organizerName: hero!.name,
          initialAssignments: assignedPlayers,
          status: 'recruiting',
          simulateMode: simulateMode // Store if this raid should be simulated
        });
        
        const modeText = simulateMode ? '(Simulated - 70% rewards)' : '(Live Combat - 100% rewards)';
        alert(`Guild raid scheduled! ${startMode === 'scheduled' ? `Starts at ${new Date(scheduledTime).toLocaleString()}` : 'Waiting for signups'} ${modeText}`);
        navigate('/portal');
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to sign up for raid');
      console.error('Failed to sign up:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || guildLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!guild) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-xl text-gray-400 mb-4">You must be in a guild to sign up for raids</div>
          <button
            onClick={() => navigate('/player-portal?tab=guild')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Go to Guild
          </button>
        </div>
      </div>
    );
  }

  if (!raid) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-400">{error || 'Raid not found'}</div>
      </div>
    );
  }

  const minRequired = Math.ceil(raid.minPlayers / 2);
  // Can schedule anytime, but need minimum to start now
  const canSchedule = assignedPlayers.length <= raid.maxPlayers;
  const canStartNow = assignedPlayers.length >= minRequired && assignedPlayers.length <= raid.maxPlayers;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <button
          onClick={() => navigate('/portal')}
          className="text-blue-400 hover:text-blue-300 mb-4"
        >
          ← Back to Guild
        </button>
        <h1 className="text-3xl font-bold text-white mb-2">Guild Raid Signup</h1>
        <h2 className="text-2xl text-gray-300 mb-4">{raid.name}</h2>
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Level Required</div>
              <div className="text-white font-semibold">{raid.minLevel}+</div>
            </div>
            <div>
              <div className="text-gray-400">Item Score Required</div>
              <div className="text-white font-semibold">{raid.minItemScore}+</div>
            </div>
            <div>
              <div className="text-gray-400">Players</div>
              <div className="text-white font-semibold">{raid.minPlayers}-{raid.maxPlayers}</div>
            </div>
            <div>
              <div className="text-gray-400">Minimum to Sign Up</div>
              <div className="text-white font-semibold">{minRequired}+</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Guild Members */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Guild Members</h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {members.length === 0 ? (
              <div className="text-gray-400 text-center py-8">No guild members found</div>
            ) : (
              members.map((member) => {
                const isAssigned = assignedPlayers.some(p => p.userId === member.userId);
                const hero = member.hero;
                const canAssign = hero && !isAssigned && assignedPlayers.length < raid.maxPlayers;
                const meetsRequirements = hero && hero.level >= raid.minLevel && getItemScore(hero.equipment || {}, hero.role) >= raid.minItemScore;
                
                return (
                  <div
                    key={member.userId}
                    onClick={() => canAssign && meetsRequirements && handleAssignPlayer(member)}
                    className={`p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                      isAssigned
                        ? 'bg-green-900/30 border-green-600'
                        : canAssign && meetsRequirements
                        ? 'bg-gray-700 border-gray-600 hover:border-blue-500'
                        : 'bg-gray-700 border-gray-600 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-white">{member.username}</div>
                        {hero ? (
                          <div className="text-sm text-gray-400 mt-1">
                            <span className="text-blue-400">{hero.name || 'Unknown Hero'}</span>
                            {' • '}
                            <span className="text-yellow-400">Lv.{hero.level || 1}</span>
                            {' • '}
                            <span className="text-purple-400 capitalize">{hero.role || 'dps'}</span>
                            {' • '}
                            <span className="text-green-400">iScore: {getItemScore(hero.equipment || {}, hero.role)}</span>
                          </div>
                        ) : (
                          <div className="text-sm text-red-400 mt-1">No hero</div>
                        )}
                        {hero && (!meetsRequirements) && (
                          <div className="text-xs text-red-400 mt-1">
                            {hero.level < raid.minLevel && `Level ${raid.minLevel} required`}
                            {hero.level >= raid.minLevel && getItemScore(hero.equipment || {}, hero.role) < raid.minItemScore && `Item Score ${raid.minItemScore} required`}
                          </div>
                        )}
                      </div>
                      {isAssigned && (
                        <div className="text-green-400 font-semibold">✓ Assigned</div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Assigned Players */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">
            Assigned Players ({assignedPlayers.length} / {raid.maxPlayers})
          </h3>
          {assignedPlayers.length < minRequired && (
            <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 mb-4">
              <div className="text-yellow-400 text-sm font-semibold">
                Need at least {minRequired} players to sign up
              </div>
            </div>
          )}
          <div className="space-y-2 max-h-[600px] overflow-y-auto mb-4">
            {assignedPlayers.length === 0 ? (
              <div className="text-gray-400 text-center py-8">No players assigned yet</div>
            ) : (
              assignedPlayers.map((player) => {
                const member = members.find(m => m.userId === player.userId);
                return (
                  <div
                    key={player.userId}
                    className="p-3 rounded-lg border-2 border-blue-600 bg-blue-900/20"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-white">{player.heroName}</div>
                        <div className="text-sm text-gray-400 mt-1">
                          <span className="text-yellow-400">Lv.{player.heroLevel}</span>
                          {' • '}
                          <span className="text-purple-400 capitalize">{player.heroRole}</span>
                          {' • '}
                          <span className="text-green-400">iScore: {player.itemScore}</span>
                        </div>
                        {member && (
                          <div className="text-xs text-gray-500 mt-1">Player: {member.username}</div>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemovePlayer(player.userId)}
                        className="text-red-400 hover:text-red-300 px-2 py-1"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {/* Scheduling Options */}
          <div className="mt-6 bg-gray-700 rounded-lg p-4 border border-gray-600">
            <h4 className="text-white font-semibold mb-3">Start Options</h4>
            
            <div className="space-y-3">
              {/* Start Now Option */}
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  checked={startMode === 'now'}
                  onChange={() => setStartMode('now')}
                  className="w-4 h-4 text-green-600"
                />
                <span className="text-white">Start Immediately</span>
              </label>
              
              {/* Schedule for Later Option */}
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  checked={startMode === 'scheduled'}
                  onChange={() => setStartMode('scheduled')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-white">Schedule for Later</span>
              </label>
              
              {/* Time Picker (only show if scheduled) */}
              {startMode === 'scheduled' && (
                <div className="ml-7 mt-2">
                  <input
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* Combat Mode Toggle */}
          <div className="mt-4 bg-gray-700 rounded-lg p-4 border border-gray-600">
            <h4 className="text-white font-semibold mb-3">Combat Mode</h4>
            
            <div className="space-y-3">
              {/* Live Combat */}
              <label className="flex items-center justify-between cursor-pointer p-3 bg-gray-800 rounded border-2 border-green-600 hover:border-green-500">
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    checked={!simulateMode}
                    onChange={() => setSimulateMode(false)}
                    className="w-4 h-4 text-green-600"
                  />
                  <div>
                    <div className="text-white font-semibold">🎬 Live Combat</div>
                    <div className="text-sm text-gray-400">Watch on stream • Better rewards</div>
                  </div>
                </div>
                <div className="text-green-400 text-sm font-bold">100% Loot</div>
              </label>
              
              {/* Simulate */}
              <label className="flex items-center justify-between cursor-pointer p-3 bg-gray-800 rounded border-2 border-purple-600 hover:border-purple-500">
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    checked={simulateMode}
                    onChange={() => setSimulateMode(true)}
                    className="w-4 h-4 text-purple-600"
                  />
                  <div>
                    <div className="text-white font-semibold">⚡ Simulate</div>
                    <div className="text-sm text-gray-400">Instant results • Reduced rewards</div>
                  </div>
                </div>
                <div className="text-purple-400 text-sm font-bold">70% Loot (Max Epic)</div>
              </label>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="mt-6 flex gap-4">
            {startMode === 'now' ? (
              <button
                onClick={() => handleSignup(true)}
                disabled={!canStartNow || submitting}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
                  canStartNow && !submitting
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                {submitting ? 'Starting...' : `🚀 Start Raid Now${!canStartNow ? ` (Need ${minRequired - assignedPlayers.length} more)` : ''}`}
              </button>
            ) : (
              <button
                onClick={() => handleSignup(false)}
                disabled={!canSchedule || submitting}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
                  canSchedule && !submitting
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                {submitting ? 'Scheduling...' : '📅 Schedule Raid (Members can join later)'}
              </button>
            )}
            <button
              onClick={() => navigate('/portal')}
              className="px-6 py-3 rounded-lg font-semibold bg-gray-600 hover:bg-gray-700 text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
