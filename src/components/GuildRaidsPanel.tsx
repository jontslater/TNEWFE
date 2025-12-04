import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { raidAPI } from '../api/client';
import { Hero } from '../types/Hero';
import { getItemScore } from '../utils/format';

interface GuildRaidsPanelProps {
  hero: Hero;
  guildId: string;
}

export default function GuildRaidsPanel({ hero, guildId }: GuildRaidsPanelProps) {
  const navigate = useNavigate();
  const [activeRaids, setActiveRaids] = useState<any[]>([]);
  const [availableRaids, setAvailableRaids] = useState<any[]>([]);
  const [scheduledRaids, setScheduledRaids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRaid, setSelectedRaid] = useState<any>(null);
  const [signupModal, setSignupModal] = useState(false);
  const scheduledStartTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    loadRaids();
    const interval = setInterval(loadRaids, 10000); // Refresh every 10s
    return () => {
      clearInterval(interval);
      // Cleanup: Cancel all scheduled timeouts
      scheduledStartTimeouts.current.forEach((timeout) => clearTimeout(timeout));
      scheduledStartTimeouts.current.clear();
    };
  }, [guildId]);

  const loadRaids = async () => {
    try {
      setLoading(true);
      
      // Get all raids
      const data = await raidAPI.getRaids();
      
      // Filter for guild raids
      const active = data.filter((r: any) => r.status === 'active' && r.guildId === guildId);
      const available = data.filter((r: any) => r.status === 'recruiting' || r.status === 'pending');
      
      setActiveRaids(active);
      setAvailableRaids(available);
      
      // Get scheduled guild raids
      const scheduled = await raidAPI.getGuildScheduledRaids(guildId);
      setScheduledRaids(scheduled || []);
      
      console.log(`[Guild Raids] Active: ${active.length}, Scheduled: ${scheduled?.length || 0}`);
      
      // Auto-start scheduler: Schedule timeouts for future raids
      if (scheduled) {
        for (const raid of scheduled) {
          // Clear existing timeout if any
          const existingTimeout = scheduledStartTimeouts.current.get(raid.id);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }
          
          if (raid.scheduledTime && raid.status === 'recruiting') {
            const scheduledDate = new Date(raid.scheduledTime._seconds * 1000);
            const now = new Date();
            const timeUntilStart = scheduledDate.getTime() - now.getTime();
            
            console.log(`[Auto-Start] Raid "${raid.raidName}" scheduled for ${scheduledDate.toLocaleString()}`);
            
            if (timeUntilStart > 0) {
              // Future raid - schedule auto-start
              const minPlayers = raid.minPlayers || 5;
              const hasEnoughPlayers = raid.participants.length >= minPlayers;
              
              if (hasEnoughPlayers) {
                console.log(`[Auto-Start] ⏰ Will auto-start in ${Math.floor(timeUntilStart / 1000)}s (${Math.floor(timeUntilStart / 60000)} minutes)`);
                
                const timeout = setTimeout(async () => {
                  console.log(`[Auto-Start] 🚀 Starting "${raid.raidName}" NOW!`);
                  try {
                    await raidAPI.startScheduledRaid(raid.id);
                    loadRaids(); // Refresh to show as active
                  } catch (err: any) {
                    console.error('[Auto-Start] Failed to start raid:', err);
                  }
                }, timeUntilStart);
                
                scheduledStartTimeouts.current.set(raid.id, timeout);
              } else {
                console.log(`[Auto-Start] ⚠️ Not enough players (${raid.participants.length}/${minPlayers}) - won't auto-start`);
              }
            } else if (timeUntilStart > -300000) {
              // Raid should have started in last 5 minutes - start now!
              const minPlayers = raid.minPlayers || 5;
              if (raid.participants.length >= minPlayers) {
                console.log(`[Auto-Start] ⚡ Raid was scheduled ${Math.abs(Math.floor(timeUntilStart / 60000))} minutes ago - starting now!`);
                // Use promise instead of await in loop
                raidAPI.startScheduledRaid(raid.id)
                  .then(() => loadRaids())
                  .catch((err: any) => console.error('[Auto-Start] Failed to start raid:', err));
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to load raids:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (raidId: string) => {
    try {
      await raidAPI.joinRaid(raidId, hero.id);
      alert('Successfully joined raid!');
      loadRaids();
      setSignupModal(false);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to join raid');
    }
  };

  const handleLeave = async (raidId: string) => {
    try {
      await raidAPI.leaveRaid(raidId, hero.id);
      alert('Left raid');
      loadRaids();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to leave raid');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'normal': return 'from-green-600 to-green-700 border-green-400';
      case 'heroic': return 'from-blue-600 to-blue-700 border-blue-400';
      case 'epic': return 'from-purple-600 to-purple-700 border-purple-400';
      case 'legendary': return 'from-orange-600 to-orange-700 border-orange-400';
      default: return 'from-gray-600 to-gray-700 border-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-xl">Loading guild raids...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-blue-900 rounded-lg p-6 border border-purple-500">
        <h2 className="text-3xl font-bold text-white mb-2">Guild Raids</h2>
        <p className="text-gray-300">Coordinate with your guild to tackle challenging encounters</p>
      </div>

      {/* Active Raids */}
      {activeRaids.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-white">🔥 Active Raids</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activeRaids.map(raid => (
              <div
                key={raid.id}
                className={`bg-gradient-to-br ${getDifficultyColor(raid.difficulty)} rounded-lg p-6 border-2 shadow-lg`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-2xl font-bold text-white">{raid.name}</h4>
                    <p className="text-sm text-gray-200">{raid.difficulty} • {raid.type}</p>
                  </div>
                  <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                    IN PROGRESS
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-200">
                  <div className="flex justify-between">
                    <span>Boss HP:</span>
                    <span className="font-bold">{raid.currentBossHp?.toLocaleString()} / {raid.maxBossHp?.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-900 rounded-full h-3">
                    <div
                      className="bg-red-500 h-3 rounded-full transition-all"
                      style={{ width: `${(raid.currentBossHp / raid.maxBossHp) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between">
                    <span>Participants:</span>
                    <span className="font-bold">{raid.participants?.length || 0}</span>
                  </div>
                </div>

                <button
                  onClick={() => window.open(`/clean-battlefield?battlefieldId=raid:${raid.id}`, '_blank')}
                  className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded transition-colors"
                >
                  Watch Battle
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scheduled Guild Raids */}
      {scheduledRaids.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-white">📅 Scheduled Guild Raids</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {scheduledRaids.map((signup: any) => {
              const isSignedUp = signup.participants?.some((p: any) => p.heroId === hero.id);
              const participantCount = signup.participants?.length || 0;
              
              // Handle Firestore Timestamp
              let scheduledDate = null;
              let scheduledDateString = 'No time set';
              
              if (signup.scheduledTime) {
                try {
                  // Handle Firestore Timestamp with _seconds (underscore prefix)
                  if (signup.scheduledTime._seconds) {
                    scheduledDate = new Date(signup.scheduledTime._seconds * 1000);
                  } else if (signup.scheduledTime.seconds) {
                    scheduledDate = new Date(signup.scheduledTime.seconds * 1000);
                  } else if (signup.scheduledTime.toDate) {
                    scheduledDate = signup.scheduledTime.toDate();
                  } else if (typeof signup.scheduledTime === 'string') {
                    scheduledDate = new Date(signup.scheduledTime);
                  } else {
                    scheduledDate = new Date(signup.scheduledTime);
                  }
                  
                  if (scheduledDate && !isNaN(scheduledDate.getTime())) {
                    scheduledDateString = scheduledDate.toLocaleString();
                  }
                } catch (e) {
                  console.error('[Scheduled Raid] Error parsing date:', e);
                }
              }
              
              const isReady = participantCount >= (signup.minPlayers || 5);
              
              return (
                <div
                  key={signup.id}
                  className="bg-gradient-to-br from-blue-900 to-purple-900 rounded-lg p-6 border-2 border-blue-500 shadow-lg"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-2xl font-bold text-white">{signup.raidName || signup.raidId}</h4>
                      <p className="text-sm text-gray-200">
                        {signup.raidDifficulty && <span className="capitalize">{signup.raidDifficulty} • </span>}
                        Organized by: {signup.organizerName}
                      </p>
                      <p className="text-sm text-yellow-300 mt-1 font-semibold">
                        ⏰ {scheduledDateString}
                      </p>
                    </div>
                    {isSignedUp && (
                      <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                        SIGNED UP
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-sm text-gray-200 mb-4">
                    <div className="flex justify-between">
                      <span>Participants:</span>
                      <span className="font-bold">{participantCount} / {signup.maxPlayers || 10}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className={`font-bold ${isReady ? 'text-green-400' : 'text-yellow-400'}`}>
                        {isReady ? 'Ready to Start' : 'Recruiting'}
                      </span>
                    </div>
                  </div>

                  {/* Party Composition */}
                  <div className="grid grid-cols-3 gap-2 text-xs mb-4">
                    <div className="bg-blue-900 bg-opacity-50 rounded p-2 text-center">
                      <div className="font-bold text-blue-300">🛡️ Tanks</div>
                      <div className="text-white">
                        {signup.participants?.filter((p: any) => p.heroRole === 'guardian' || p.heroRole === 'paladin').length || 0}
                      </div>
                    </div>
                    <div className="bg-green-900 bg-opacity-50 rounded p-2 text-center">
                      <div className="font-bold text-green-300">💚 Healers</div>
                      <div className="text-white">
                        {signup.participants?.filter((p: any) => ['cleric', 'atoner', 'druid', 'lightbringer', 'shaman', 'mistweaver', 'chronomancer', 'bard'].includes(p.heroRole)).length || 0}
                      </div>
                    </div>
                    <div className="bg-red-900 bg-opacity-50 rounded p-2 text-center">
                      <div className="font-bold text-red-300">⚔️ DPS</div>
                      <div className="text-white">
                        {signup.participants?.filter((p: any) => !['guardian', 'paladin', 'cleric', 'atoner', 'druid', 'lightbringer', 'shaman', 'mistweaver', 'chronomancer', 'bard'].includes(p.heroRole)).length || 0}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {isSignedUp ? (
                      <button
                        onClick={async () => {
                          try {
                            await raidAPI.leaveScheduledRaid(signup.id, hero.id);
                            loadRaids();
                          } catch (err: any) {
                            alert(err.response?.data?.error || 'Failed to leave');
                          }
                        }}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded transition-colors"
                      >
                        Leave
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          try {
                            const itemScore = getItemScore(hero.equipment || {});
                            await raidAPI.signUpForScheduledRaid(
                              signup.id,
                              hero.id,
                              hero.name,
                              hero.level,
                              hero.role,
                              itemScore
                            );
                            loadRaids();
                          } catch (err: any) {
                            alert(err.response?.data?.error || 'Failed to sign up');
                          }
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded transition-colors"
                      >
                        Sign Up
                      </button>
                    )}
                    
                    {signup.organizer === hero.id && (
                      <>
                        {isReady && (
                          <button
                            onClick={async () => {
                              try {
                                await raidAPI.startScheduledRaid(signup.id);
                                alert('Raid started!');
                                loadRaids();
                              } catch (err: any) {
                                alert(err.response?.data?.error || 'Failed to start');
                              }
                            }}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded transition-colors"
                          >
                            🚀 Start Now
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            if (!confirm('Are you sure you want to cancel this scheduled raid?')) return;
                            try {
                              await raidAPI.deleteScheduledRaid(signup.id, hero.id);
                              alert('Scheduled raid cancelled');
                              loadRaids();
                            } catch (err: any) {
                              alert(err.response?.data?.error || 'Failed to cancel');
                            }
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded transition-colors"
                        >
                          🗑️ Cancel Raid
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Raids */}
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-white">📋 Available Raids</h3>
        
        {availableRaids.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-12 text-center border border-gray-700">
            <div className="text-gray-400 text-lg">No raids available at the moment</div>
            <p className="text-gray-500 text-sm mt-2">Check back later or create a new raid</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {availableRaids.map(raid => {
              const isParticipant = raid.participants?.some((p: any) => p.heroId === hero.id);
              const tanks = raid.participants?.filter((p: any) => p.role === 'tank').length || 0;
              const healers = raid.participants?.filter((p: any) => p.role === 'healer').length || 0;
              const dps = raid.participants?.filter((p: any) => p.role === 'dps').length || 0;

              return (
                <div
                  key={raid.id}
                  className={`bg-gradient-to-br ${getDifficultyColor(raid.difficulty)} rounded-lg p-6 border-2 shadow-lg transform transition-all hover:scale-105`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-2xl font-bold text-white">{raid.name}</h4>
                      <p className="text-sm text-gray-200">{raid.difficulty} • {raid.type}</p>
                    </div>
                    {isParticipant && (
                      <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                        SIGNED UP
                      </span>
                    )}
                  </div>

                  <div className="space-y-3 mb-4">
                    {/* Requirements */}
                    <div className="bg-black bg-opacity-30 rounded p-3">
                      <div className="text-xs text-gray-300 space-y-1">
                        <div className="flex justify-between">
                          <span>Min Level:</span>
                          <span className="font-bold">{raid.minLevel}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Min Item Score:</span>
                          <span className="font-bold">{raid.minItemScore}</span>
                        </div>
                      </div>
                    </div>

                    {/* Party Composition */}
                    <div className="space-y-2">
                      <div className="text-xs text-gray-300">Party Composition:</div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-blue-900 bg-opacity-50 rounded p-2 text-center">
                          <div className="font-bold text-blue-300">🛡️ Tanks</div>
                          <div className="text-white">{tanks} / {raid.requiredTanks || 2}</div>
                        </div>
                        <div className="bg-green-900 bg-opacity-50 rounded p-2 text-center">
                          <div className="font-bold text-green-300">💚 Healers</div>
                          <div className="text-white">{healers} / {raid.requiredHealers || 2}</div>
                        </div>
                        <div className="bg-red-900 bg-opacity-50 rounded p-2 text-center">
                          <div className="font-bold text-red-300">⚔️ DPS</div>
                          <div className="text-white">{dps} / {raid.requiredDps || 6}</div>
                        </div>
                      </div>
                    </div>

                    {/* Rewards */}
                    <div className="bg-black bg-opacity-30 rounded p-3">
                      <div className="text-xs text-gray-300 mb-1">Rewards:</div>
                      <div className="flex flex-wrap gap-2">
                        {raid.rewards?.gold && (
                          <span className="bg-yellow-600 bg-opacity-50 px-2 py-1 rounded text-xs">
                            💰 {raid.rewards.gold}g
                          </span>
                        )}
                        {raid.rewards?.tokens && (
                          <span className="bg-blue-600 bg-opacity-50 px-2 py-1 rounded text-xs">
                            💎 {raid.rewards.tokens}
                          </span>
                        )}
                        {raid.rewards?.experience && (
                          <span className="bg-purple-600 bg-opacity-50 px-2 py-1 rounded text-xs">
                            ⭐ {raid.rewards.experience} XP
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/raids/guild-signup/${raid.id}`)}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded transition-colors"
                    >
                      📅 Schedule Guild Raid
                    </button>
                    <button
                      onClick={() => setSelectedRaid(raid)}
                      className="bg-gray-700 hover:bg-gray-600 text-white font-bold px-4 py-2 rounded transition-colors"
                    >
                      Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Signup Modal */}
      {signupModal && selectedRaid && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Join Raid</h2>
              <button
                onClick={() => setSignupModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">{selectedRaid.name}</h3>
                <p className="text-gray-400">{selectedRaid.description}</p>
              </div>

              <div className="bg-gray-700 rounded p-4">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Your Level:</span>
                    <span className={`font-bold ${hero.level >= selectedRaid.minLevel ? 'text-green-400' : 'text-red-400'}`}>
                      {hero.level} {hero.level >= selectedRaid.minLevel ? '✓' : '✗'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Your Item Score:</span>
                    <span className={`font-bold ${(hero as any).itemScore >= selectedRaid.minItemScore ? 'text-green-400' : 'text-red-400'}`}>
                      {(hero as any).itemScore || 0} {(hero as any).itemScore >= selectedRaid.minItemScore ? '✓' : '✗'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Your Role:</span>
                    <span className="font-bold text-white">{hero.role}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSignupModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSignup(selectedRaid.id)}
                  disabled={hero.level < selectedRaid.minLevel || (hero as any).itemScore < selectedRaid.minItemScore}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
