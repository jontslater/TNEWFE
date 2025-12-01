import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Raid, WorldBoss } from '../types/Raid';
import { formatNumber, getItemScore } from '../utils/format';
import { raidAPI, guildAPI } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useGuild } from '../hooks/useGuild';
import CombatInterface from './CombatInterface';

interface RaidBrowserProps {
  raids?: Raid[];
  worldBoss?: WorldBoss | null;
  hero?: any;
  userId?: string;
}

export default function RaidBrowser({ raids: propRaids, worldBoss: propWorldBoss, hero, userId }: RaidBrowserProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const targetUserId = hero?.id || userId || user?.id;
  const { guild } = useGuild(targetUserId || null);
  const [allRaids, setAllRaids] = useState<any[]>([]);
  const [scheduledRaids, setScheduledRaids] = useState<any[]>([]);
  const [heroLevel, setHeroLevel] = useState(1);
  const [itemScore, setItemScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [worldBoss, setWorldBoss] = useState<WorldBoss | null>(propWorldBoss || null);
  const [activeDifficultyTab, setActiveDifficultyTab] = useState<'normal' | 'heroic' | 'mythic'>('normal');
  
  // Queue state
  const [queueStatuses, setQueueStatuses] = useState<Record<string, {queueSize: number, position?: number, participants: any[]}>>({});
  const [inQueue, setInQueue] = useState<Record<string, boolean>>({});
  const [joiningQueue, setJoiningQueue] = useState<Record<string, boolean>>({});
  
  // Active raid state
  const [activeRaid, setActiveRaid] = useState<any | null>(null);
  const [raidElapsedTime, setRaidElapsedTime] = useState(0);
  const [combatLogs, setCombatLogs] = useState<any[]>([]);

  useEffect(() => {
    if (userId && hero) {
      fetchRaids();
      fetchScheduledRaids();
    } else if (user?.id && user.hero) {
      fetchRaids();
      fetchScheduledRaids();
    } else {
      setLoading(false);
    }
    fetchWorldBoss();
    
    // Poll scheduled raids every 30 seconds
    const interval = setInterval(() => {
      fetchScheduledRaids();
    }, 30000);
    return () => clearInterval(interval);
  }, [user, hero, userId]);

  // Poll queue status for raids we're in queue for
  useEffect(() => {
    const queuePollInterval = setInterval(() => {
      Object.keys(inQueue).forEach(raidId => {
        if (inQueue[raidId]) {
          fetchQueueStatus(raidId);
        }
      });
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(queuePollInterval);
  }, [inQueue]);

  const fetchRaids = async () => {
    // Use hero.id (document ID) if available, otherwise fall back to userId/user.id
    const targetUserId = hero?.id || userId || user?.id;
    if (!targetUserId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const data = await raidAPI.getAvailableRaids(targetUserId);
      setAllRaids(data.availableRaids || []);
      
      // Use hero prop if available, otherwise fall back to API response
      if (hero) {
        setHeroLevel(hero.level || 1);
        setItemScore(getItemScore(hero.equipment || {}));
      } else {
        setHeroLevel(data.heroLevel);
        setItemScore(data.itemScore);
      }
    } catch (error) {
      console.error('Failed to fetch raids:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorldBoss = async () => {
    try {
      const boss = await raidAPI.getWorldBoss();
      setWorldBoss(boss);
    } catch (error) {
      console.error('Failed to fetch world boss:', error);
    }
  };

  const fetchScheduledRaids = async () => {
    try {
      const data = await raidAPI.getUpcomingRaids();
      setScheduledRaids(data.scheduledRaids || []);
    } catch (error) {
      console.error('Failed to fetch scheduled raids:', error);
    }
  };

  const handleJoinScheduledRaid = (instanceId: string) => {
    // Navigate to raid browser source
    navigate(`/browser-source/raid/${instanceId}`);
  };

  const isRaidStartingSoon = (scheduledTime: any) => {
    const now = Date.now();
    const scheduled = scheduledTime?.toMillis?.() || new Date(scheduledTime).getTime();
    const timeUntilStart = scheduled - now;
    // Show join button if raid starts within 10 minutes
    return timeUntilStart > 0 && timeUntilStart <= 10 * 60 * 1000;
  };

  const handleExitRaid = () => {
    setActiveRaid(null);
    setRaidElapsedTime(0);
    setCombatLogs([]);
    fetchRaids(); // Refresh raid list
  };
  
  // Raid timer
  useEffect(() => {
    if (!activeRaid) return;
    
    const timer = setInterval(() => {
      setRaidElapsedTime(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [activeRaid]);
  
  // Simulate combat (this would come from your backend in production)
  useEffect(() => {
    if (!activeRaid) return;
    
    const combatInterval = setInterval(() => {
      // Simulate damage
      const damage = Math.floor(Math.random() * 5000) + 1000;
      setActiveRaid((prev: any) => ({
        ...prev,
        currentBossHp: Math.max(0, prev.currentBossHp - damage)
      }));
      
      setCombatLogs(prev => [...prev, {
        id: Date.now().toString(),
        timestamp: Date.now(),
        type: 'damage',
        message: `Party deals damage to ${activeRaid.boss.name}`,
        amount: damage
      }].slice(-50));
      
      // Check if boss is dead
      if (activeRaid.currentBossHp - damage <= 0) {
        setCombatLogs(prev => [...prev, {
          id: Date.now().toString(),
          timestamp: Date.now(),
          type: 'system',
          message: `${activeRaid.boss.name} has been defeated! Victory!`
        }]);
      }
    }, 2000);
    
    return () => clearInterval(combatInterval);
  }, [activeRaid]);

  const handleJoinWorldBoss = async () => {
    // Use hero.id (document ID) if available, otherwise fall back to userId/user.id
    const targetUserId = hero?.id || userId || user?.id;
    if (!targetUserId || !worldBoss || !hero) return;
    
    try {
      await raidAPI.joinWorldBoss(
        worldBoss.id, 
        targetUserId, 
        hero?.name || user?.twitchUsername || 'Unknown', 
        hero?.level || heroLevel, 
        hero?.role || 'berserker'
      );
      alert('Joined world boss event!');
      fetchWorldBoss(); // Refresh to show updated participant count
    } catch (error: any) {
      alert(`Failed to join world boss: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleJoinQueue = async (raid: any) => {
    const targetUserId = hero?.id || userId || user?.id;
    if (!targetUserId || !hero) return;
    
    try {
      setJoiningQueue(prev => ({ ...prev, [raid.id]: true }));
      const result = await raidAPI.joinQueue(
        raid.id,
        targetUserId,
        hero.name || user?.twitchUsername || 'Unknown',
        hero.level || heroLevel,
        hero.role || 'berserker',
        getItemScore(hero.equipment || {})
      );
      
      if (result.autoStarted && result.instanceId) {
        // Auto-started, navigate to raid
        setActiveRaid({
          ...raid,
          instanceId: result.instanceId,
          currentBossHp: raid.boss.hp
        });
        setRaidElapsedTime(0);
        setCombatLogs([{
          id: Date.now().toString(),
          timestamp: Date.now(),
          type: 'system',
          message: `Raid "${raid.name}" has begun!`
        }]);
      } else {
        setInQueue(prev => ({ ...prev, [raid.id]: true }));
        fetchQueueStatus(raid.id);
      }
    } catch (error: any) {
      alert(`Failed to join queue: ${error.response?.data?.error || error.message}`);
    } finally {
      setJoiningQueue(prev => ({ ...prev, [raid.id]: false }));
    }
  };

  const handleLeaveQueue = async (raidId: string) => {
    const targetUserId = hero?.id || userId || user?.id;
    if (!targetUserId) return;
    
    try {
      await raidAPI.leaveQueue(raidId, targetUserId);
      setInQueue(prev => ({ ...prev, [raidId]: false }));
      setQueueStatuses(prev => {
        const updated = { ...prev };
        delete updated[raidId];
        return updated;
      });
    } catch (error: any) {
      alert(`Failed to leave queue: ${error.response?.data?.error || error.message}`);
    }
  };

  const fetchQueueStatus = async (raidId: string) => {
    try {
      const status = await raidAPI.getQueueStatus(raidId);
      setQueueStatuses(prev => ({ ...prev, [raidId]: status }));
      
      // Check if we're still in queue
      const targetUserId = hero?.id || userId || user?.id;
      const inQueue = status.participants.some((p: any) => p.userId === targetUserId);
      if (!inQueue) {
        setInQueue(prev => ({ ...prev, [raidId]: false }));
      }
    } catch (error) {
      console.error('Failed to fetch queue status:', error);
    }
  };

  const handleGuildSignup = (raidId: string) => {
    navigate(`/raids/guild-signup/${raidId}`);
  };
  
  const getDifficultyColor = (difficulty: string) => {
    return {
      normal: 'text-green-400 bg-green-900/30 border-green-600',
      heroic: 'text-blue-400 bg-blue-900/30 border-blue-600',
      mythic: 'text-purple-400 bg-purple-900/30 border-purple-600'
    }[difficulty] || 'text-gray-400 bg-gray-900/30 border-gray-600';
  };

  const getTypeColor = (type: string) => {
    return {
      daily: 'bg-blue-600',
      weekly: 'bg-purple-600',
      monthly: 'bg-yellow-600'
    }[type] || 'bg-gray-600';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-xl text-gray-400">Loading available raids...</div>
      </div>
    );
  }

  // Calculate hero stats from hero prop if available
  const currentHeroLevel = hero ? (hero.level || 1) : heroLevel;
  const currentItemScore = hero ? getItemScore(hero.equipment || {}) : itemScore;

  // Function to check if raid is available
  const isRaidAvailable = (raid: any) => {
    if (!hero && !user?.hero) return false;
    return currentHeroLevel >= raid.minLevel && currentItemScore >= raid.minItemScore;
  };

  // Function to get reasons why raid is locked
  const getLockReasons = (raid: any) => {
    if (!hero && !user?.hero) return ['Create a hero in the Electron game'];
    const reasons = [];
    if (currentHeroLevel < raid.minLevel) {
      reasons.push(`Level ${raid.minLevel} required (you're ${currentHeroLevel})`);
    }
    if (currentItemScore < raid.minItemScore) {
      reasons.push(`${raid.minItemScore} item score required (you have ${currentItemScore})`);
    }
    return reasons;
  };

  // Use prop data if provided, otherwise use fetched data
  const allRaidsData = propRaids || allRaids;
  
  // Filter raids by active difficulty tab
  const raids = allRaidsData.filter(raid => raid.difficulty === activeDifficultyTab);
  
  // Get counts for each difficulty
  const getDifficultyCounts = (difficulty: string) => {
    const difficultyRaids = allRaidsData.filter(r => r.difficulty === difficulty);
    const available = difficultyRaids.filter(r => isRaidAvailable(r)).length;
    return { total: difficultyRaids.length, available };
  };

  // Get suggested party composition
  const getPartyComposition = (raid: any) => {
    const total = raid.maxPlayers;
    if (total <= 5) {
      return { tanks: 1, healers: 1, dps: total - 2 };
    } else if (total <= 8) {
      return { tanks: 2, healers: 2, dps: total - 4 };
    } else {
      return { tanks: 2, healers: 3, dps: total - 5 };
    }
  };

  // Get loot item level range
  const getLootItemLevel = (raid: any) => {
    const baseLevel = raid.boss.level || 20;
    const difficultyBonus = raid.difficulty === 'mythic' ? 10 : raid.difficulty === 'heroic' ? 5 : 0;
    return baseLevel + difficultyBonus;
  };

  // If in active raid, show combat interface
  if (activeRaid) {
    const mockParticipants = [
      { 
        id: userId || user?.id || '1', 
        name: user?.twitchUsername || hero?.name || 'You', 
        role: (hero?.role || 'dps') as any, 
        level: currentHeroLevel, 
        hp: Math.floor((hero?.hp || hero?.maxHp || 8000) * 0.85), 
        maxHp: hero?.maxHp || 8000, 
        isDead: false 
      },
      { id: '2', name: 'Tank Buddy', role: 'tank' as const, level: currentHeroLevel, hp: 9000, maxHp: 10000, isDead: false },
      { id: '3', name: 'Healer', role: 'healer' as const, level: currentHeroLevel - 1, hp: 6500, maxHp: 7000, isDead: false },
      { id: '4', name: 'DPS Warrior', role: 'dps' as const, level: currentHeroLevel + 1, hp: 7200, maxHp: 8000, isDead: false },
    ];
    
    return (
      <div className="relative">
        <button
          onClick={handleExitRaid}
          className="absolute top-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold"
        >
          Exit Raid
        </button>
        <CombatInterface
          bossName={activeRaid.boss.name}
          bossHp={activeRaid.currentBossHp}
          bossMaxHp={activeRaid.boss.hp}
          bossLevel={activeRaid.boss.level}
          bossSprite={activeRaid.boss.sprite}
          mechanics={activeRaid.boss.mechanics}
          participants={mockParticipants}
          combatLogs={combatLogs}
          duration={Math.ceil(activeRaid.estimatedDuration / 1000)}
          elapsedTime={raidElapsedTime}
        />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Hero Stats */}
      {(hero || user?.hero) && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-gray-400">Your Level:</span>
              <span className="ml-2 text-xl font-bold text-white">{currentHeroLevel}</span>
            </div>
            <div>
              <span className="text-gray-400">Item Score:</span>
              <span className="ml-2 text-xl font-bold text-blue-400">{currentItemScore}</span>
            </div>
            <div className="text-sm text-gray-500">
              {allRaidsData.filter(r => isRaidAvailable(r)).length} of {allRaidsData.length} raids available
            </div>
          </div>
        </div>
      )}

      {!hero && !user?.hero && (
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4">
          <div className="text-yellow-400 font-semibold mb-1">⚠️ No Hero Found</div>
          <p className="text-yellow-200 text-sm">Create a hero in the Electron game to access raids and see your qualifications.</p>
        </div>
      )}
      
      {/* World Boss */}
      {worldBoss && (
        <div className="bg-gradient-to-br from-red-900 to-gray-800 rounded-lg p-6 shadow-lg border-2 border-red-600">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-red-400 font-semibold mb-1">🌍 WORLD BOSS EVENT</div>
              <h2 className="text-3xl font-bold text-white">{worldBoss.name}</h2>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Participants</div>
              <div className="text-2xl font-bold text-white">{worldBoss.participants.length}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-900/50 rounded p-3">
              <div className="text-xs text-gray-400">Boss HP</div>
              <div className="text-lg font-bold text-red-400">{formatNumber(worldBoss.maxHp)}</div>
            </div>
            <div className="bg-gray-900/50 rounded p-3">
              <div className="text-xs text-gray-400">Gold Reward</div>
              <div className="text-lg font-bold text-yellow-400">{formatNumber(worldBoss.rewards.gold)}</div>
            </div>
            <div className="bg-gray-900/50 rounded p-3">
              <div className="text-xs text-gray-400">Token Reward</div>
              <div className="text-lg font-bold text-blue-400">{worldBoss.rewards.tokens}</div>
            </div>
            <div className="bg-gray-900/50 rounded p-3">
              <div className="text-xs text-gray-400">Duration</div>
              <div className="text-lg font-bold text-white">{worldBoss.duration} min</div>
            </div>
          </div>

          <div className="text-sm text-gray-300 mb-4">
            <strong>Scheduled:</strong> {formatDate(worldBoss.scheduledTime)}
          </div>

          <button 
            onClick={handleJoinWorldBoss}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!user}
          >
            {user ? 'Join World Boss' : 'Login to Join'}
          </button>
        </div>
      )}

      {/* Scheduled Raids */}
      {scheduledRaids.length > 0 && (
        <div className="bg-gradient-to-br from-purple-900 to-gray-800 rounded-lg p-6 border-2 border-purple-600 mb-6">
          <h3 className="text-2xl font-bold text-white mb-4">⏰ Scheduled Raids</h3>
          <div className="space-y-3">
            {scheduledRaids.map((scheduledRaid: any) => {
              const scheduledTime = scheduledRaid.scheduledTime?.toMillis?.() || new Date(scheduledRaid.scheduledTime).getTime();
              const now = Date.now();
              const timeUntilStart = scheduledTime - now;
              const minutesUntilStart = Math.floor(timeUntilStart / 60000);
              const canJoin = isRaidStartingSoon(scheduledRaid.scheduledTime);
              
              return (
                <div key={scheduledRaid.id} className="bg-gray-900/50 rounded-lg p-4 border border-purple-500">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-lg font-bold text-white">
                        {scheduledRaid.raidId || 'Unknown Raid'}
                      </div>
                      <div className="text-sm text-gray-400">
                        Starts: {formatDate(new Date(scheduledTime))}
                        {timeUntilStart > 0 && (
                          <span className="ml-2 text-purple-400">
                            ({minutesUntilStart} min)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Participants: {scheduledRaid.participants?.length || 0}
                      </div>
                    </div>
                    {canJoin && (
                      <button
                        onClick={() => handleJoinScheduledRaid(scheduledRaid.id)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                      >
                        Join Raid
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Raid List */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-2xl font-bold text-white mb-6">Raids</h3>
        
        {/* Difficulty Tabs */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setActiveDifficultyTab('normal')}
            className={`px-6 py-3 rounded-lg font-bold transition ${
              activeDifficultyTab === 'normal'
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            Normal ({getDifficultyCounts('normal').available}/{getDifficultyCounts('normal').total})
          </button>
          <button
            onClick={() => setActiveDifficultyTab('heroic')}
            className={`px-6 py-3 rounded-lg font-bold transition ${
              activeDifficultyTab === 'heroic'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            Heroic ({getDifficultyCounts('heroic').available}/{getDifficultyCounts('heroic').total})
          </button>
          <button
            onClick={() => setActiveDifficultyTab('mythic')}
            className={`px-6 py-3 rounded-lg font-bold transition ${
              activeDifficultyTab === 'mythic'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            Mythic ({getDifficultyCounts('mythic').available}/{getDifficultyCounts('mythic').total})
          </button>
        </div>
        
        {allRaidsData.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-lg mb-2">Loading raids...</p>
            <p className="text-sm">Please wait while we fetch raid data from the server.</p>
          </div>
        ) : raids.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-lg mb-2">No {activeDifficultyTab} raids available</p>
            <p className="text-sm">Try selecting a different difficulty tab.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {raids.map((raid) => {
              const available = isRaidAvailable(raid);
              const lockReasons = !available ? getLockReasons(raid) : [];
              const party = getPartyComposition(raid);
              const itemLevel = getLootItemLevel(raid);
              
              return (
              <div 
                key={raid.id}
                className={`bg-gray-700 rounded-lg p-4 border-2 transition-colors hover:border-blue-500 ${getDifficultyColor(raid.difficulty)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {!available && <span className="text-lg">🔒</span>}
                    <h4 className="text-lg font-bold text-white">
                      {raid.name}
                    </h4>
                  </div>
                  <div className={`px-2 py-0.5 rounded text-xs font-semibold capitalize ${getDifficultyColor(raid.difficulty)}`}>
                    {raid.difficulty}
                  </div>
                </div>

                {!available && (
                  <div className="bg-red-900/30 border border-red-600 rounded px-2 py-1.5 mb-2">
                    <div className="text-red-400 text-xs font-semibold mb-0.5">🔒 Requirements Not Met:</div>
                    <ul className="text-red-300 text-xs space-y-0.5">
                      {lockReasons.map((reason, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="mr-1">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="text-xs text-gray-400 mb-2 line-clamp-1">{raid.description}</p>

                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-2 text-xs">
                  <div>
                    <div className="text-gray-400 text-xs">Level</div>
                    <div className="font-semibold text-white">{raid.minLevel}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">iScore</div>
                    <div className="font-semibold text-blue-400">{raid.minItemScore}+</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">iLvl</div>
                    <div className="font-semibold text-purple-400">{itemLevel}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">HP</div>
                    <div className="font-semibold text-red-400">{formatNumber(raid.boss.hp)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">Gold</div>
                    <div className="font-semibold text-yellow-400">{formatNumber(raid.rewards.gold)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">Tokens</div>
                    <div className="font-semibold text-blue-400">{raid.rewards.tokens}</div>
                  </div>
                </div>

                <div className="mb-2 p-2 bg-gray-800 rounded text-xs">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-gray-400"><span className="font-semibold text-white">Boss:</span> {raid.boss.name}</span>
                    <span className="text-gray-400"><span className="font-semibold text-white">Party:</span> {party.tanks}T/{party.healers}H/{party.dps}D</span>
                  </div>
                  <div className="flex items-start gap-1 flex-wrap">
                    <span className="text-gray-400 font-semibold text-white mr-1">Mechanics:</span>
                    {raid.boss.mechanics.map((mechanic: any, idx: number) => (
                      <span 
                        key={idx} 
                        className="text-xs bg-gray-600 px-1.5 py-0.5 rounded text-gray-300 cursor-help hover:bg-gray-500 transition-colors relative group"
                        title={mechanic.description || mechanic}
                      >
                        {mechanic.name || mechanic}
                        {mechanic.description && (
                          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 border border-gray-700 max-w-xs">
                            {mechanic.description}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-400">
                    {raid.minPlayers}-{raid.maxPlayers}p • {raid.waves}w • {Math.ceil(raid.estimatedDuration / 60000)}m
                  </div>
                  <div className="flex items-center gap-2">
                    {inQueue[raid.id] && queueStatuses[raid.id] && (
                      <div className="text-xs text-blue-400 mr-2">
                        Queue: {queueStatuses[raid.id].position || 0}/{queueStatuses[raid.id].queueSize}
                      </div>
                    )}
                    {inQueue[raid.id] ? (
                      <button
                        onClick={() => handleLeaveQueue(raid.id)}
                        className="px-3 py-1.5 text-sm rounded transition-colors font-semibold bg-red-600 hover:bg-red-700 text-white"
                      >
                        Leave Queue
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={() => handleJoinQueue(raid)}
                          disabled={!available || joiningQueue[raid.id] || (!user?.hero && !hero)}
                          className={`px-3 py-1.5 text-sm rounded transition-colors font-semibold ${
                            available && (user?.hero || hero) && !joiningQueue[raid.id]
                              ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer'
                              : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                          }`}
                          title={!available ? lockReasons.join(', ') : ''}
                        >
                          {joiningQueue[raid.id] ? 'Joining...' : 'Join Queue'}
                        </button>
                        {guild && (
                          <button
                            onClick={() => handleGuildSignup(raid.id)}
                            disabled={!available}
                            className={`px-3 py-1.5 text-sm rounded transition-colors font-semibold ${
                              available
                                ? 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer'
                                : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                            }`}
                            title="Sign up as a guild"
                          >
                            Sign up as Guild
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
