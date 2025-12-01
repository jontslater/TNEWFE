/**
 * Instance Viewer Page
 * For watching and participating in Raid/Dungeon instances
 * Only visible to organizer and assigned participants
 */

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { raidAPI, dungeonAPI, heroAPI } from '../api/client';
import Navigation from '../components/Navigation';
import HeroSpriteJS, { HeroSpriteJSHandle } from '../components/HeroSpriteJS';
import EnemySprite, { EnemySpriteJSHandle } from '../components/EnemySpriteJS';
import { showScrollingCombatText } from '../utils/combatText';
import { TestHero, TestEnemy } from './AnimationTestPage';
import { Hero } from '../types/Hero';
import { calculateSkillBonuses } from '../utils/skillSystem';
import { calculateEquipmentBonuses } from '../utils/equipmentBonuses';

interface InstanceParticipant {
  userId: string;
  username?: string;
  heroName?: string;
  heroLevel?: number;
  heroRole?: string;
  itemScore?: number;
  isAlive?: boolean;
  damageDealt?: number;
  healingDone?: number;
  damageTaken?: number;
  deaths?: number;
}

interface RaidInstance {
  id: string;
  raidId: string;
  difficulty: 'normal' | 'heroic' | 'mythic';
  status: 'scheduled' | 'starting' | 'active' | 'completed' | 'failed';
  organizerId: string;
  currentWave: number;
  maxWaves: number;
  participants: InstanceParticipant[];
  scheduledTime?: any;
  startedAt?: any;
  completedAt?: any;
}

export default function InstanceViewerPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const instanceId = searchParams.get('instanceId');
  const instanceType = searchParams.get('type') as 'raid' | 'dungeon' | null;
  
  const [instance, setInstance] = useState<RaidInstance | null>(null);
  const [heroes, setHeroes] = useState<TestHero[]>([]);
  const [enemies, setEnemies] = useState<TestEnemy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commandInput, setCommandInput] = useState('');
  const [combatLog, setCombatLog] = useState<Array<{timestamp: number, message: string, type: string}>>([]);
  
  const heroRefs = useRef<Map<string, React.RefObject<HeroSpriteJSHandle>>>(new Map());
  const enemyRefs = useRef<Map<string, React.RefObject<EnemySpriteJSHandle>>>(new Map());
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if user has access to this instance
  useEffect(() => {
    if (!instanceId || !instanceType || !user) {
      setError('Missing instance ID, type, or authentication');
      setLoading(false);
      return;
    }

    loadInstance();
  }, [instanceId, instanceType, user]);

  // Poll for instance updates
  useEffect(() => {
    if (!instance || instance.status === 'completed' || instance.status === 'failed') {
      return;
    }

    pollingIntervalRef.current = setInterval(() => {
      loadInstance();
    }, 2000); // Poll every 2 seconds for real-time updates

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [instance?.id, instance?.status]);

  const loadInstance = async () => {
    if (!instanceId || !instanceType || !user) return;

    try {
      let instanceData: any;
      
      // Prefer twitchId for consistency with hero storage
      const userId = user?.twitchId || user?.id;
      
      if (instanceType === 'raid') {
        instanceData = await raidAPI.getRaidInstance(instanceId, userId);
      } else {
        // Dungeon instance loading (when implemented)
        setError('Dungeon instances not yet implemented');
        setLoading(false);
        return;
      }

      // Check if user has access (organizer or participant)
      const isOrganizer = instanceData.organizerId === userId;
      const isParticipant = instanceData.participants?.some((p: InstanceParticipant) => 
        p.userId === userId
      );

      if (!isOrganizer && !isParticipant) {
        setError('You do not have access to this instance');
        setLoading(false);
        return;
      }

      setInstance(instanceData);

      // Load heroes if instance is active/starting
      if ((instanceData.status === 'active' || instanceData.status === 'starting') && heroes.length === 0) {
        await loadParticipantsAsHeroes(instanceData.participants);
      }

      // Update combat log
      if (instanceData.combatLog) {
        setCombatLog(instanceData.combatLog);
      }

      setError(null);
    } catch (err: any) {
      console.error('Failed to load instance:', err);
      setError(err.response?.data?.error || 'Failed to load instance');
    } finally {
      setLoading(false);
    }
  };

  const loadParticipantsAsHeroes = async (participants: InstanceParticipant[]) => {
    const loadedHeroes: TestHero[] = [];

    for (const participant of participants) {
      try {
        const backendHero = await heroAPI.getHero(participant.userId);
        
        // Determine category for skill bonuses
        const categoryMap: Record<string, 'tank' | 'healer' | 'dps'> = {
          'guardian': 'tank', 'paladin': 'tank', 'warden': 'tank', 'bloodknight': 'tank', 'vanguard': 'tank', 'brewmaster': 'tank',
          'berserker': 'dps', 'crusader': 'dps', 'assassin': 'dps', 'reaper': 'dps', 'bladedancer': 'dps', 'monk': 'dps', 'stormwarrior': 'dps', 'hunter': 'dps',
          'mage': 'dps', 'warlock': 'dps', 'ranger': 'dps', 'necromancer': 'dps', 'shadowpriest': 'dps', 'mooncaller': 'dps', 'stormcaller': 'dps', 'frostmage': 'dps', 'firemage': 'dps', 'dragonsorcerer': 'dps',
          'cleric': 'healer', 'atoner': 'healer', 'druid': 'healer', 'lightbringer': 'healer', 'shaman': 'healer', 'mistweaver': 'healer', 'chronomancer': 'healer', 'bard': 'healer'
        };
        const category = categoryMap[backendHero.role.toLowerCase()] || 'dps';
        
        const skillBonuses = calculateSkillBonuses(
          { skills: backendHero.skills || {}, role: backendHero.role },
          category
        );
        
        const testHero: TestHero = {
          id: backendHero.id || participant.userId,
          name: backendHero.name,
          role: backendHero.role,
          level: backendHero.level,
          xp: backendHero.xp || 0,
          maxXp: backendHero.maxXp || 100 + (backendHero.level * 10),
          hp: instance?.status === 'active' ? (participant as any).currentHp || backendHero.hp : backendHero.hp,
          maxHp: backendHero.maxHp,
          attack: backendHero.attack + skillBonuses.attack,
          defense: backendHero.defense + skillBonuses.defense,
          critChance: (backendHero.equipment?.weapon?.secondaryStats?.critChance || 0) / 100 + skillBonuses.critChance / 100,
          dexterity: 10,
          skills: backendHero.skills || {},
          skillPoints: backendHero.skillPoints || 0,
          equipment: backendHero.equipment,
          cooldowns: { classAbilityPrimary: 0 },
          classAbilityState: {
            enrageActive: false,
            elementRotation: 0,
            comboCount: 0
          },
          gold: backendHero.gold || 0,
          tokens: backendHero.tokens || 0,
          lastTokenClaim: Date.now(),
          lastCommandTime: Date.now()
        };

        loadedHeroes.push(testHero);
      } catch (err) {
        console.error(`Failed to load hero for participant ${participant.userId}:`, err);
      }
    }

    setHeroes(loadedHeroes);
    console.log(`✅ Loaded ${loadedHeroes.length} heroes for instance`);
  };

  const handleCommand = async (command: string) => {
    if (!command.trim() || !instance || !user) return;

    const cmd = command.trim();
    // Prefer twitchId for consistency with hero storage
    const userId = user.twitchId || user.id;
    
    if (!userId) {
      console.error('No user ID available');
      return;
    }
    
    // Send command to backend to process
    try {
      await raidAPI.sendInstanceCommand(instance.id, userId, cmd);
      console.log(`📢 Command sent: ${cmd}`);
      setCommandInput('');
      
      // Reload instance to get updated combat log
      setTimeout(() => loadInstance(), 500);
    } catch (err: any) {
      console.error('Failed to send command:', err);
      alert(err.response?.data?.error || 'Failed to send command');
    }
  };

  const getOrCreateHeroRef = (heroId: string): React.RefObject<HeroSpriteJSHandle> => {
    if (!heroRefs.current.has(heroId)) {
      heroRefs.current.set(heroId, React.createRef<HeroSpriteJSHandle>());
    }
    return heroRefs.current.get(heroId)!;
  };

  const getOrCreateEnemyRef = (enemyId: string): React.RefObject<EnemySpriteJSHandle> => {
    if (!enemyRefs.current.has(enemyId)) {
      enemyRefs.current.set(enemyId, React.createRef<EnemySpriteJSHandle>());
    }
    return enemyRefs.current.get(enemyId)!;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">Loading instance...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="bg-red-900/30 border-2 border-red-600 rounded-lg p-8 text-center">
            <h1 className="text-3xl font-bold text-red-400 mb-4">Access Denied</h1>
            <p className="text-gray-300">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!instance) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="text-white text-center">
            <h1 className="text-3xl font-bold mb-4">Instance Not Found</h1>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Prefer twitchId for consistency with hero storage
  const userId = user?.twitchId || user?.id;
  const isOrganizer = instance.organizerId === userId;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Instance Header */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {instanceType === 'raid' ? '⚔️' : '🏰'} {instanceType === 'raid' ? 'Raid' : 'Dungeon'} Instance
              </h1>
              <p className="text-gray-400">Instance ID: {instance.id}</p>
              {isOrganizer && (
                <span className="inline-block mt-2 px-3 py-1 bg-purple-600 text-white text-sm rounded">
                  Organizer
                </span>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white mb-1">
                {instance.status === 'scheduled' && '⏰ Scheduled'}
                {instance.status === 'starting' && '🚀 Starting'}
                {instance.status === 'active' && '⚔️ Active'}
                {instance.status === 'completed' && '✅ Completed'}
                {instance.status === 'failed' && '❌ Failed'}
              </div>
              {instance.currentWave > 0 && (
                <div className="text-gray-400">
                  Wave {instance.currentWave} / {instance.maxWaves}
                </div>
              )}
            </div>
          </div>

          {/* Participants List */}
          <div className="mt-4">
            <h3 className="text-lg font-bold text-white mb-2">Participants ({instance.participants.length}):</h3>
            <div className="flex flex-wrap gap-2">
              {instance.participants.map((p, idx) => (
                <div
                  key={idx}
                  className={`px-3 py-1 rounded text-sm ${
                    p.userId === userId
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {p.heroName || p.username || `Participant ${idx + 1}`}
                  {p.isAlive === false && <span className="ml-2">💀</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Combat Area */}
        {instance.status === 'active' || instance.status === 'starting' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Combat View */}
            <div className="lg:col-span-2">
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700" style={{ minHeight: '600px', position: 'relative' }}>
                {/* Hero Sprites */}
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  {heroes.map(hero => {
                    const ref = getOrCreateHeroRef(hero.id);
                    return (
                      <div
                        key={hero.id}
                        id={`battle-hero-${hero.id}`}
                        className="hero-sprite-container"
                        style={{
                          position: 'absolute',
                          bottom: '100px',
                          left: `${100 + heroes.indexOf(hero) * 150}px`,
                          width: '96px',
                          height: '96px'
                        }}
                      >
                        <HeroSpriteJS
                          ref={ref}
                          heroId={hero.id}
                          role={hero.role}
                          facing="right"
                          onAnimationComplete={() => {}}
                        />
                        {/* Health Bar */}
                        <div className="health-bar-container" style={{ position: 'absolute', bottom: '-20px', width: '100%' }}>
                          <div className="health-bar" style={{ width: '100%', height: '4px', backgroundColor: '#333', borderRadius: '2px', overflow: 'hidden' }}>
                            <div
                              className="health-fill"
                              style={{
                                width: `${(hero.hp / hero.maxHp) * 100}%`,
                                height: '100%',
                                backgroundColor: hero.hp > 0 ? '#10b981' : '#ef4444',
                                transition: 'width 0.3s ease'
                              }}
                            />
                          </div>
                          <div className="health-text" style={{ fontSize: '10px', color: '#fff', textAlign: 'center', marginTop: '2px' }}>
                            {hero.name} - {Math.floor(hero.hp)}/{hero.maxHp}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Enemy Sprites */}
                  {enemies.map(enemy => {
                    const ref = getOrCreateEnemyRef(enemy.id);
                    return (
                      <div
                        key={enemy.id}
                        id={`battle-enemy-${enemy.id}`}
                        className="enemy-sprite-container"
                        style={{
                          position: 'absolute',
                          bottom: '100px',
                          right: `${100 + enemies.indexOf(enemy) * 150}px`,
                          width: '96px',
                          height: '96px'
                        }}
                      >
                        <EnemySprite
                          ref={ref}
                          enemyId={enemy.id}
                          enemyName={enemy.name}
                          facing="left"
                          onAnimationComplete={() => {}}
                        />
                        {/* Health Bar */}
                        <div className="health-bar-container" style={{ position: 'absolute', bottom: '-20px', width: '100%' }}>
                          <div className="health-bar" style={{ width: '100%', height: '4px', backgroundColor: '#333', borderRadius: '2px', overflow: 'hidden' }}>
                            <div
                              className="health-fill"
                              style={{
                                width: `${(enemy.hp / enemy.maxHp) * 100}%`,
                                height: '100%',
                                backgroundColor: enemy.hp > 0 ? '#ef4444' : '#666',
                                transition: 'width 0.3s ease'
                              }}
                            />
                          </div>
                          <div className="health-text" style={{ fontSize: '10px', color: '#fff', textAlign: 'center', marginTop: '2px' }}>
                            {enemy.name} - {Math.floor(enemy.hp)}/{enemy.maxHp}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sidebar - Commands & Combat Log */}
            <div className="space-y-4">
              {/* Command Input */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-3">Send Command</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commandInput}
                    onChange={(e) => setCommandInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && commandInput.trim()) {
                        handleCommand(commandInput);
                      }
                    }}
                    placeholder="!attack, !ability, etc."
                    className="flex-1 px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => handleCommand(commandInput)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                  >
                    Send
                  </button>
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  Commands: !attack, !ability, !heal, !defend
                </div>
              </div>

              {/* Combat Log */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-3">Combat Log</h3>
                <div className="space-y-1 max-h-96 overflow-y-auto" style={{ fontSize: '12px' }}>
                  {combatLog.slice(-20).map((log, idx) => (
                    <div key={idx} className="text-gray-300">
                      <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span> {log.message}
                    </div>
                  ))}
                  {combatLog.length === 0 && (
                    <div className="text-gray-500">No combat activity yet...</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
            <div className="text-4xl mb-4">
              {instance.status === 'scheduled' && '⏰'}
              {instance.status === 'completed' && '✅'}
              {instance.status === 'failed' && '❌'}
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {instance.status === 'scheduled' && 'Raid Scheduled'}
              {instance.status === 'completed' && 'Raid Completed'}
              {instance.status === 'failed' && 'Raid Failed'}
            </h2>
            {instance.status === 'scheduled' && instance.scheduledTime && (
              <p className="text-gray-400">
                Starts at: {new Date(instance.scheduledTime.toMillis?.() || instance.scheduledTime).toLocaleString()}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
