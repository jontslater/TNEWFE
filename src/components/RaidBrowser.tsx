import { useState, useEffect } from 'react';
import { Raid, WorldBoss } from '../types/Raid';
import { formatNumber } from '../utils/format';
import { raidAPI } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import CombatInterface from './CombatInterface';

interface RaidBrowserProps {
  raids?: Raid[];
  worldBoss?: WorldBoss | null;
}

export default function RaidBrowser({ raids: propRaids, worldBoss: propWorldBoss }: RaidBrowserProps) {
  const { user } = useAuth();
  const [allRaids, setAllRaids] = useState<any[]>([]);
  const [heroLevel, setHeroLevel] = useState(1);
  const [itemScore, setItemScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [worldBoss, setWorldBoss] = useState<WorldBoss | null>(propWorldBoss || null);
  const [startingRaid, setStartingRaid] = useState<string | null>(null);
  
  // Active raid state
  const [activeRaid, setActiveRaid] = useState<any | null>(null);
  const [raidElapsedTime, setRaidElapsedTime] = useState(0);
  const [combatLogs, setCombatLogs] = useState<any[]>([]);

  useEffect(() => {
    if (user?.id && user.hero) {
      fetchRaids();
    } else {
      setLoading(false);
    }
    fetchWorldBoss();
  }, [user]);

  const fetchRaids = async () => {
    if (!user?.id || !user.hero) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const data = await raidAPI.getAvailableRaids(user.id);
      setAllRaids(data.availableRaids || []);
      setHeroLevel(data.heroLevel);
      setItemScore(data.itemScore);
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

  const handleStartRaid = async (raid: any) => {
    if (!user?.id) return;
    
    try {
      setStartingRaid(raid.id);
      const result = await raidAPI.startRaid(raid.id, [user.id]);
      
      // Start the raid combat interface
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
    } catch (error: any) {
      alert(`Failed to start raid: ${error.response?.data?.error || error.message}`);
    } finally {
      setStartingRaid(null);
    }
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
    if (!user?.id || !worldBoss || !user.hero) return;
    
    try {
      await raidAPI.joinWorldBoss(
        worldBoss.id, 
        user.id, 
        user.hero.name || user.twitchUsername || 'Unknown', 
        user.hero.level || heroLevel, 
        user.hero.role || 'berserker'
      );
      alert('Joined world boss event!');
      fetchWorldBoss(); // Refresh to show updated participant count
    } catch (error: any) {
      alert(`Failed to join world boss: ${error.response?.data?.error || error.message}`);
    }
  };
  
  // Use prop data if provided, otherwise use fetched data
  const raids = propRaids || allRaids;
  
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

  // Function to check if raid is available
  const isRaidAvailable = (raid: any) => {
    if (!user?.hero) return false;
    return heroLevel >= raid.minLevel && itemScore >= raid.minItemScore;
  };

  // Function to get reasons why raid is locked
  const getLockReasons = (raid: any) => {
    if (!user?.hero) return ['Create a hero in the Electron game'];
    const reasons = [];
    if (heroLevel < raid.minLevel) {
      reasons.push(`Level ${raid.minLevel} required (you're ${heroLevel})`);
    }
    if (itemScore < raid.minItemScore) {
      reasons.push(`${raid.minItemScore} item score required (you have ${itemScore})`);
    }
    return reasons;
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
        id: user?.id || '1', 
        name: user?.twitchUsername || user?.hero?.name || 'You', 
        role: (user?.hero?.role || 'dps') as any, 
        level: user?.hero?.level || heroLevel, 
        hp: Math.floor((user?.hero?.hp || 8000) * 0.85), 
        maxHp: user?.hero?.maxHp || 8000, 
        isDead: false 
      },
      { id: '2', name: 'Tank Buddy', role: 'tank' as const, level: heroLevel, hp: 9000, maxHp: 10000, isDead: false },
      { id: '3', name: 'Healer', role: 'healer' as const, level: heroLevel - 1, hp: 6500, maxHp: 7000, isDead: false },
      { id: '4', name: 'DPS Warrior', role: 'dps' as const, level: heroLevel + 1, hp: 7200, maxHp: 8000, isDead: false },
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
      {user?.hero && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-gray-400">Your Level:</span>
              <span className="ml-2 text-xl font-bold text-white">{heroLevel}</span>
            </div>
            <div>
              <span className="text-gray-400">Item Score:</span>
              <span className="ml-2 text-xl font-bold text-blue-400">{itemScore}</span>
            </div>
            <div className="text-sm text-gray-500">
              {allRaids.filter(r => isRaidAvailable(r)).length} of {allRaids.length} raids available
            </div>
          </div>
        </div>
      )}

      {!user?.hero && (
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

      {/* Raid List */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-2xl font-bold text-white mb-6">All Raids</h3>
        
        {raids.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-lg mb-2">Loading raids...</p>
            <p className="text-sm">Please wait while we fetch raid data from the server.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {raids.map((raid) => {
              const available = isRaidAvailable(raid);
              const lockReasons = !available ? getLockReasons(raid) : [];
              const party = getPartyComposition(raid);
              const itemLevel = getLootItemLevel(raid);
              
              return (
              <div 
                key={raid.id}
                className={`bg-gray-700 rounded-lg p-6 border-2 transition-colors hover:border-blue-500 ${getDifficultyColor(raid.difficulty)}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {!available && <span className="text-2xl">🔒</span>}
                    <h4 className="text-xl font-bold text-white">
                      {raid.name}
                    </h4>
                  </div>
                  <div className={`px-3 py-1 rounded text-sm font-semibold capitalize ${getDifficultyColor(raid.difficulty)}`}>
                    {raid.difficulty}
                  </div>
                </div>

                {!available && (
                  <div className="bg-red-900/30 border border-red-600 rounded px-3 py-2 mb-3">
                    <div className="text-red-400 text-sm font-semibold mb-1">🔒 Requirements Not Met:</div>
                    <ul className="text-red-300 text-sm space-y-1">
                      {lockReasons.map((reason, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="text-sm text-gray-300 mb-4">{raid.description}</p>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4 text-sm">
                  <div>
                    <div className="text-gray-400">Min Level</div>
                    <div className="font-semibold text-white">{raid.minLevel}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Item Score</div>
                    <div className="font-semibold text-blue-400">{raid.minItemScore}+</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Loot iLvl</div>
                    <div className="font-semibold text-purple-400">{itemLevel}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Boss HP</div>
                    <div className="font-semibold text-red-400">{formatNumber(raid.boss.hp)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Gold</div>
                    <div className="font-semibold text-yellow-400">{formatNumber(raid.rewards.gold)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Tokens</div>
                    <div className="font-semibold text-blue-400">{raid.rewards.tokens}</div>
                  </div>
                </div>

                <div className="mb-4 p-3 bg-gray-800 rounded">
                  <div className="text-xs text-gray-400 mb-2">
                    <span className="font-semibold text-white">Boss:</span> {raid.boss.name}
                  </div>
                  <div className="text-xs text-gray-400 mb-2">
                    <span className="font-semibold text-white">Party:</span> {party.tanks} Tank{party.tanks > 1 ? 's' : ''} • {party.healers} Healer{party.healers > 1 ? 's' : ''} • {party.dps} DPS
                  </div>
                  <div className="text-xs text-gray-400 mb-1 font-semibold text-white">Mechanics:</div>
                  <div className="flex flex-wrap gap-2">
                    {raid.boss.mechanics.slice(0, 4).map((mechanic: any, idx: number) => (
                      <span 
                        key={idx} 
                        className="text-xs bg-gray-600 px-2 py-1 rounded text-gray-300 cursor-help hover:bg-gray-500 transition-colors relative group"
                        title={mechanic.description || mechanic}
                      >
                        {mechanic.name || mechanic}
                        {mechanic.description && (
                          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 border border-gray-700">
                            {mechanic.description}
                          </span>
                        )}
                      </span>
                    ))}
                    {raid.boss.mechanics.length > 4 && (
                      <span className="text-xs text-gray-500 italic">+{raid.boss.mechanics.length - 4} more</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    {raid.minPlayers}-{raid.maxPlayers} players • {raid.waves} waves • Est. {Math.ceil(raid.estimatedDuration / 60000)} min
                  </div>
                  <button 
                    onClick={() => handleStartRaid(raid)}
                    disabled={!available || startingRaid === raid.id || !user?.hero}
                    className={`px-6 py-2 rounded transition-colors font-semibold ${
                      available && user?.hero
                        ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                    }`}
                    title={!available ? lockReasons.join(', ') : ''}
                  >
                    {!user?.hero ? 'Need Hero' : 
                     !available ? 'Locked' : 
                     startingRaid === raid.id ? 'Starting...' : 
                     'Start Raid'}
                  </button>
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
