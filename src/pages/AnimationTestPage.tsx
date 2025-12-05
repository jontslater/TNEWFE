/**
 * Simplified Animation Test Page
 * Just animations, projectiles, and test buttons
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../hooks/useWebSocket';
import HeroSpriteJS, { HeroSpriteJSHandle } from '../components/HeroSpriteJS';
import EnemySpriteJS, { EnemySpriteJSHandle } from '../components/EnemySpriteJS';
import { createProjectile } from '../utils/projectiles';
import { showScrollingCombatText } from '../utils/combatText';
import BuffDebuffIndicator, { BuffDebuffData } from '../components/BuffDebuffIndicator';
import { calculateDamage, calculateDamageWithCrit, calculateHealing } from '../utils/combatCalculations';
import { applyDebuff, getDebuffResistance, isStunned, calculateDebuffDamageModifiers, DEBUFF_TYPES } from '../utils/debuffSystem';
import { calculateBuffModifiers, checkProcBuff, applyProcBuff, BUFF_TYPES } from '../utils/buffSystem';
import { calculateInitiative, createTurnActions, Combatant, TurnAction } from '../utils/turnBasedCombat';
import { applyClassAbility } from '../utils/classAbilities';
import { checkLastStand, checkGroupHeal, checkInstantHeal, checkAutoDispel } from '../utils/emergencyAbilities';
import { spawnRandomEncounter, generateEnemyPack, getPackSize } from '../utils/enemySpawning';
import { calculateEnemyScaling, scaleEnemyStats, getEnemyBaseStats, calculateAveragePartyLevel, calculateAverageGearScore } from '../utils/enemyScaling';
import { getHeroAnimations, getEnemyAnimations } from '../utils/spriteAnimationData';
import { getSkillTree, calculateSkillBonuses, getTotalSkillPoints, getAvailableSkillPoints, SkillData, SkillDefinition } from '../utils/skillSystem';
import { heroAPI } from '../api/client';
import { Hero } from '../types/Hero';
import { calculateEquipmentBonuses, getEquipmentHpRegen } from '../utils/equipmentBonuses';
import { generateLoot, isItemBetter, calculateItemPower } from '../utils/lootGeneration';
import { calculateHeroBaseDamage } from '../utils/heroDamage';
import { calculateSetBonuses } from '../utils/setBonuses';
import LevelUpEffect from '../components/LevelUpEffect';
import { calculateGoldFromKill, calculateIdleTokens, formatGold, formatTokens, formatIdleTime } from '../utils/economySystem';
import { QuestTracker, isBossEnemy, QuestProgressUpdate, formatQuestProgress, CompletedQuest } from '../utils/questTracking';
import { questAPI, raidAPI, dungeonAPI } from '../api/client';
import { 
  RaidData, 
  RaidInstance, 
  RaidBossMechanic,
  shouldTriggerMechanic, 
  isMechanicOffCooldown,
  calculateRaidEnemyStats,
  calculateBossStats,
  generateRaidWaveEnemies,
  calculateRaidRewards
} from '../utils/raidSystem';
import { SAMPLE_RAIDS, getRaidById } from '../data/sampleRaids';
export interface TestBuff {
  name: string;
  icon?: string;
  color?: string;
  remainingDuration: number;
  value?: number;
  lastTickTime?: number; // For HoT tracking
}
export interface TestDebuff {
  name: string;
  icon?: string;
  color?: string;
  remainingDuration: number;
  value?: number;
}
export interface TestHero {
  id: string;
  name: string;
  role: string; // Actual class name like 'guardian', 'berserker', 'cleric'
  level: number;
  xp?: number; // Current XP
  maxXp?: number; // Maximum XP for current level
  hp: number;
  maxHp: number;
  attack?: number; // Attack stat for damage calculation
  defense?: number; // Defense stat for damage mitigation
  critChance?: number; // Critical hit chance (0.0 to 1.0, e.g., 0.15 = 15%)
  dexterity?: number; // Dexterity for initiative calculation
  shield?: number;
  equipment?: any; // Equipment for gear score calculation
  activeBuffs?: Record<string, TestBuff>;
  activeDebuffs?: Record<string, TestDebuff & { lastTickTime?: number }>;
  lastDotTickTime?: number;
  cooldowns?: {
    classAbility?: number; // Timestamp when ability will be ready
    classAbilityPrimary?: number;
    lastStand?: number; // Last Stand cooldown
    groupHeal?: number; // Group Heal cooldown
    instantHeal?: number; // Instant Heal cooldown
    dispel?: number; // Auto-Dispel cooldown
  };
  classAbilityState?: {
    enrageActive?: boolean;
    enrageExpiry?: number;
    elementRotation?: number; // 0=Fire, 1=Frost, 2=Arcane
    comboCount?: number;
    lastStandActive?: boolean; // Last Stand is currently active
    lastStandExpiry?: number; // When Last Stand expires
  };
  skills?: Record<string, SkillData>; // Allocated skills
  skillPoints?: number; // Available skill points
  lastEquipmentRegenTick?: number; // Last time equipment regen ticked
  gold?: number; // Gold currency
  tokens?: number; // Premium currency (tokens)
  lastTokenClaim?: number; // Last time tokens were claimed
  lastCommandTime?: number; // Last time a command was used (for active token bonus)
  twitchUserId?: string; // Twitch user ID for matching heroes
}
export interface TestEnemy {
  id: string;
  name: string;
  level?: number; // Enemy level (scaled to party level)
  xp?: number; // XP value when defeated
  hp: number;
  maxHp: number;
  attack?: number; // Attack stat for damage calculation
  defense?: number; // Defense stat for damage mitigation
  dexterity?: number; // Dexterity for initiative calculation
  initiative?: number; // Initiative roll (calculated once per combat round)
  shield?: number; // Shield for damage absorption
  activeBuffs?: Record<string, TestBuff>;
  activeDebuffs?: Record<string, TestDebuff & { lastTickTime?: number }>;
  lastDotTickTime?: number;
}
// LocalStorage keys for facing preferences
const HERO_FACING_STORAGE_KEY = 'animationTest_heroFacing';
const ENEMY_FACING_STORAGE_KEY = 'animationTest_enemyFacing';
// Mapping of enemy names to their sprite sheet facing direction
// If sprite sheet faces RIGHT, we use 'left' (which flips with scaleX(-1) to face left on screen)
// If sprite sheet faces LEFT, we use 'right' (no flip, already facing left on screen)
const ENEMY_SPRITE_SHEET_FACING: Record<string, 'left' | 'right'> = {
  'Kobold Warrior': 'left', // Sprite sheet faces right, needs flip
  'Baby Dragon': 'right', // Sprite sheet faces left, no flip needed
  'Imp': 'left',
  'Lizardman': 'left',
  'Masked Orc': 'right', // Sprite sheet faces left, no flip needed
  'Werewolf': 'left',
  'Skeleton Mage': 'left',
  'Witch': 'right', // Sprite sheet faces left, no flip needed
  'Mimic': 'left',
  'Gryphon': 'left', // Sprite sheet faces right, needs flip
  'Minotaur': 'left',
  'Headless Horseman': 'right', // Sprite sheet faces left, no flip needed
  'Adult Dragon': 'right', // Sprite sheet faces left, no flip needed
  'Demon Lord': 'right', // Sprite sheet faces left, no flip needed
  'Elder Dragon': 'right', // Sprite sheet faces left, no flip needed
};
// Helper functions for localStorage
const getSavedFacing = (key: string, spriteType: string): 'left' | 'right' => {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const prefs = JSON.parse(saved);
      // If preference exists, use it; otherwise use default based on key
      if (prefs[spriteType]) {
        return prefs[spriteType];
      }
    }
  } catch (e) {
  }
  
  // For enemies: use sprite sheet facing mapping, or default to 'left' (flip)
  if (key === ENEMY_FACING_STORAGE_KEY) {
    return ENEMY_SPRITE_SHEET_FACING[spriteType] || 'left';
  }
  
  // For heroes: default to right (toward enemies)
  return 'right';
};
const saveFacing = (key: string, spriteType: string, facing: 'left' | 'right') => {
  try {
    const saved = localStorage.getItem(key);
    const prefs = saved ? JSON.parse(saved) : {};
    prefs[spriteType] = facing;
    localStorage.setItem(key, JSON.stringify(prefs));
  } catch (e) {
  }
};
export default function AnimationTestPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [heroes, setHeroes] = useState<TestHero[]>([]);
  const [enemies, setEnemies] = useState<TestEnemy[]>([]);
  const [heroFacings, setHeroFacings] = useState<Record<string, 'left' | 'right'>>({});
  const [initiativeOrder, setInitiativeOrder] = useState<Combatant[]>([]);
  const combatInitiativeRef = useRef<Combatant[]>([]); // Store initiative for reuse across rounds
  const combatStartedRef = useRef<boolean>(false); // Track if combat has started (to know when to recalculate initiative)
  
  // Live state refs to avoid stale closures in async combat logic
  const heroesRef = useRef<TestHero[]>([]);
  const enemiesRef = useRef<TestEnemy[]>([]);
  
  // Keep refs in sync with state
  useEffect(() => {
    heroesRef.current = heroes;
  }, [heroes]);
  
  useEffect(() => {
    enemiesRef.current = enemies;
  }, [enemies]);
  const [enemyFacings, setEnemyFacings] = useState<Record<string, 'left' | 'right'>>({});
  const [waveCount, setWaveCount] = useState<number>(1); // Track wave count for enemy scaling
  const [loadingHero, setLoadingHero] = useState<boolean>(false); // Loading state for fetching hero
  const commandCooldowns = useRef<Map<string, number>>(new Map()); // Track command cooldowns by userId
  const heroLoadedRef = useRef<boolean>(false); // Track if hero has been loaded
  const autoStartCombatTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Track auto-start timeout to prevent duplicates
  const isBrowserSource = searchParams.get('token') !== null; // Check if this is a browser source (has token)
  const [levelingUpHeroes, setLevelingUpHeroes] = useState<Set<string>>(new Set()); // Track heroes currently showing level-up animation
  const [testRaidModal, setTestRaidModal] = useState<{ show: boolean; instanceId?: string; raidName?: string }>({ show: false }); // Test raid creation modal
  const heroRefs = useRef<Map<string, React.RefObject<HeroSpriteJSHandle>>>(new Map());
  const enemyRefs = useRef<Map<string, React.RefObject<EnemySpriteJSHandle>>>(new Map());
  const resurrectionTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const deadHeroes = useRef<Set<string>>(new Set()); // Track which heroes are currently dead
  const deadEnemies = useRef<Set<string>>(new Set()); // Track which enemies are currently dead
  const enemyDeathStartTime = useRef<Map<string, number>>(new Map()); // Track when each enemy's death animation started
  const heroBattlefieldJoinTime = useRef<Map<string, number>>(new Map()); // Track when each hero joined the battlefield (for rested XP)
  const lastHealTime = useRef<Map<string, number>>(new Map()); // Track last heal time to prevent duplicates
  const lastLootSCTTime = useRef<Map<string, number>>(new Map()); // Track last loot SCT time per hero for staggering
  const abilityEffects = useRef<Map<string, { type: 'backstab' | 'deathStrike' | 'holyStrike', expiry: number }>>(new Map()); // Track temporary ability visual effects
  const demonLordFlying = useRef<Set<string>>(new Set()); // Track which Demon Lords are flying
  const demonLordTransitionStarted = useRef<Set<string>>(new Set()); // Track which Demon Lords have started transition
  const demonLordTransitionTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map()); // Track transition timeouts
  const werewolfTransformed = useRef<Set<string>>(new Set()); // Track which Werewolves have transformed
  const questTrackerRef = useRef<QuestTracker | null>(null); // Quest progress tracker
  const totalDamageDealt = useRef<Map<string, number>>(new Map()); // Track total damage per hero for quests
  const totalHealingDone = useRef<Map<string, number>>(new Map()); // Track total healing per hero for quests
  const totalDamageBlocked = useRef<Map<string, number>>(new Map()); // Track total damage blocked per hero for quests
  const bossDefeats = useRef<number>(0); // Track boss defeats
  const wavesCompleted = useRef<number>(0); // Track waves completed
  const [activeRaid, setActiveRaid] = useState<RaidInstance | null>(null); // Current raid instance
  const [raidData, setRaidData] = useState<RaidData | null>(null); // Current raid data
  const raidMechanicsTriggered = useRef<Set<string>>(new Set()); // Track triggered boss mechanics
  const raidMechanicCooldowns = useRef<Map<string, number>>(new Map()); // Track boss mechanic cooldowns
  const [autoBuyEnabled, setAutoBuyEnabled] = useState<boolean>(false); // Auto-buy toggle
  const isTraveling = useRef<boolean>(false); // Track if heroes are currently traveling
  const [watchingQueue, setWatchingQueue] = useState<{type: 'raid' | 'dungeon', id: string} | null>(null); // Currently watching queue
  const [watchingRaidInstance, setWatchingRaidInstance] = useState<string | null>(null); // Currently watching raid instance
  const [isAdventuring, setIsAdventuring] = useState<boolean>(false); // Adventure loop active
  const [adventureTickCount, setAdventureTickCount] = useState<number>(0); // Number of ticks since adventure started
  const [lastAdventureTick, setLastAdventureTick] = useState<number>(0); // Last adventure tick timestamp
  const adventureTickIntervalRef = useRef<NodeJS.Timeout | null>(null); // Adventure tick interval
  const isCombatProcessingRef = useRef<boolean>(false); // Track if combat is currently processing
  const enemySpawningRef = useRef<boolean>(false); // Lock to prevent concurrent enemy spawns
  
  // ============================================
  // COMBAT ENGINE SUPERVISOR - Centralized State Machine
  // ============================================
  type CombatState = 'idle' | 'spawning' | 'processing' | 'round_complete' | 'ended';
  
  interface CombatSupervisor {
    state: CombatState;
    lastActionAt: number;
    lastSpawnAt: number;
    lastRoundStartAt: number;
    roundCount: number;
    lastStateChange: {
      from: CombatState;
      to: CombatState;
      at: number;
      reason?: string;
    };
  }
  
  const combatSupervisorRef = useRef<CombatSupervisor>({
    state: 'idle',
    lastActionAt: Date.now(),
    lastSpawnAt: 0,
    lastRoundStartAt: 0,
    roundCount: 0,
    lastStateChange: {
      from: 'idle',
      to: 'idle',
      at: Date.now(),
    },
  });
  
  // State transition helper with validation
  const setCombatState = (newState: CombatState, reason?: string): void => {
    const supervisor = combatSupervisorRef.current;
    const oldState = supervisor.state;
    
    // Validate state transition
    const validTransitions: Record<CombatState, CombatState[]> = {
      'idle': ['spawning', 'processing'],
      'spawning': ['idle', 'processing'], // Can go directly to processing when enemies spawn
      'processing': ['round_complete', 'ended'],
      'round_complete': ['processing', 'spawning', 'idle', 'ended'],
      'ended': ['idle', 'spawning'],
    };
    
    if (!validTransitions[oldState]?.includes(newState)) {
      console.warn(`[Combat Supervisor] Invalid state transition: ${oldState} → ${newState}`);
      return;
    }
    
    // Update supervisor
    supervisor.lastStateChange = {
      from: oldState,
      to: newState,
      at: Date.now(),
      reason,
    };
    supervisor.state = newState;
    supervisor.lastActionAt = Date.now();
    
    // Update specific timestamps
    if (newState === 'processing') {
      supervisor.lastRoundStartAt = Date.now();
      supervisor.roundCount++;
    } else if (newState === 'spawning') {
      supervisor.lastSpawnAt = Date.now();
    }
    
    console.log(`[Combat Supervisor] ${oldState} → ${newState}${reason ? ` (${reason})` : ''}`);
  };
  
  // State query helper functions
  const isCombatActive = (): boolean => {
    const state = combatSupervisorRef.current.state;
    // Only 'processing' means combat is actively running
    // 'round_complete' means the round is done and we're ready for the next one
    return state === 'processing';
  };
  
  const isSpawning = (): boolean => {
    return combatSupervisorRef.current.state === 'spawning';
  };
  
  const canStartCombat = (): boolean => {
    const state = combatSupervisorRef.current.state;
    // Allow combat to start from idle, ended, or spawning (enemies are being spawned)
    return state === 'idle' || state === 'ended' || state === 'spawning';
  };
  
  // Health check function to detect stuck states
  const checkCombatHealth = (): void => {
    const supervisor = combatSupervisorRef.current;
    const timeSinceLastAction = Date.now() - supervisor.lastActionAt;
    
    // Detect stuck states
    if (supervisor.state === 'processing' && timeSinceLastAction > 30000) {
      console.error('[Combat Supervisor] ⚠️ Combat stuck in processing state for 30+ seconds!');
      console.error('[Combat Supervisor] Last state change:', supervisor.lastStateChange);
      setCombatState('idle', 'timeout-recovery');
    }
    
    if (supervisor.state === 'spawning' && timeSinceLastAction > 5000) {
      console.warn('[Combat Supervisor] ⚠️ Spawn state active for 5+ seconds');
    }
  };
  
  // Debug helper function (for console/debugging)
  const getCombatStateDebug = (): string => {
    const s = combatSupervisorRef.current;
    return `State: ${s.state} | Round: ${s.roundCount} | Last Action: ${Date.now() - s.lastActionAt}ms ago | Last Change: ${s.lastStateChange.from}→${s.lastStateChange.to} (${s.lastStateChange.reason || 'no reason'})`;
  };
  
  // Periodic health check
  useEffect(() => {
    const healthCheckInterval = setInterval(() => {
      checkCombatHealth();
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(healthCheckInterval);
  }, []);
  
  // Handle WebSocket messages for Twitch chat commands
  // Helper function to convert Hero from Firebase to TestHero format
  const convertHeroToTestHero = useCallback((hero: Hero): TestHero => {
    // Calculate crit chance from equipment and skills
    const critChance = (hero.equipment?.weapon?.secondaryStats?.critChance || 0) / 100;
    // Get dexterity from equipment or use default
    const dexterity = hero.equipment?.weapon?.dexterity || 
                     hero.equipment?.gloves?.dexterity || 
                     hero.dexterity || 10;
    
    // Ensure HP is a whole number (round to avoid decimal HP)
    const hp = Math.floor(hero.hp || hero.maxHp || 100);
    const maxHp = Math.floor(hero.maxHp || 100);
    
    return {
      id: hero.id || `hero-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: hero.name || hero.username || hero.characterName || 'Unknown Hero',
      role: hero.role,
      level: hero.level || 1,
      xp: hero.xp || 0,
      maxXp: hero.maxXp || 100,
      hp: hp,
      maxHp: maxHp,
      attack: hero.attack || 0,
      defense: hero.defense || 0,
      critChance: critChance,
      dexterity: dexterity,
      shield: hero.shield || 0,
      equipment: hero.equipment || {},
      activeBuffs: hero.activeBuffs || {},
      activeDebuffs: {},
      cooldowns: hero.cooldowns || {},
      classAbilityState: hero.classAbilityState || {},
      skills: hero.skills || {},
      skillPoints: hero.skillPoints || 0,
      gold: hero.gold || 0,
      tokens: hero.tokens || 0,
      lastTokenClaim: hero.lastTokenClaim || 0,
      lastCommandTime: hero.lastCommandTime || 0,
      twitchUserId: hero.twitchUserId
    };
  }, []);
  // Load hero from Firebase and add to battlefield
  const loadHeroFromFirebase = async (heroId: string) => {
    try {
      const hero = await heroAPI.getHeroById(heroId);
      
      if (!hero) {
        return;
      }
      
      
      // Convert to TestHero format
      const testHero = convertHeroToTestHero(hero);
      
      // Check if hero already exists (by id or name+role)
      setHeroes(prev => {
        const existingHero = prev.find(h => 
          h.id === testHero.id || 
          (h.name === testHero.name && h.role === testHero.role)
        );
        
        if (existingHero) {
          // Update existing hero
          return prev.map(h => 
            (h.id === existingHero.id || (h.name === testHero.name && h.role === testHero.role))
              ? { ...testHero, id: h.id } // Keep existing ID
              : h
          );
        } else {
          // Add new hero
          return [...prev, testHero];
        }
      });
    } catch (error) {
    }
  };
  const handleWebSocketMessage = useCallback((message: any) => {
    
    if (message.type === 'hero_joined') {
      // Someone used !join in chat - add their hero to the battlefield
      const hero = message.hero;
      
      if (hero && hero.id) {
        
          // Convert hero from WebSocket message directly (backend sends full hero data)
          try {
            const testHero = convertHeroToTestHero(hero);
            
            // Check if hero already exists (by id, twitchUserId, or name+role)
            setHeroes(prev => {
            
            const existingHero = prev.find(h => 
              h.id === testHero.id || 
              h.twitchUserId === hero.twitchUserId ||
              (h.name === testHero.name && h.role === testHero.role)
            );
            
            if (existingHero) {
              // Update existing hero with new data
              const updated = prev.map(h => 
                (h.id === existingHero.id || h.twitchUserId === hero.twitchUserId || (h.name === testHero.name && h.role === testHero.role))
                  ? { ...testHero, id: h.id } // Keep existing ID but update all other data
                  : h
              );
              // Track join time for rested XP (only if not already tracked)
              if (!heroBattlefieldJoinTime.current.has(testHero.id)) {
                heroBattlefieldJoinTime.current.set(testHero.id, Date.now());
              }
              return updated;
            } else {
              // Add new hero
              const newHeroes = [...prev, testHero];
              // Track join time for rested XP
              heroBattlefieldJoinTime.current.set(testHero.id, Date.now());
              return newHeroes;
            }
          });
        } catch (error) {
          // Fallback: try loading from Firebase
          loadHeroFromFirebase(hero.id);
        }
      } else {
      }
    } else if (message.type === 'hero_left_battlefield') {
      // Hero left the battlefield - remove them
      const hero = message.hero;
      if (hero && hero.id) {
        setHeroes(prev => prev.filter(h => h.id !== hero.id && h.twitchUserId !== hero.twitchUserId));
        // Remove from battlefield join time tracking
        heroBattlefieldJoinTime.current.delete(hero.id);
      }
    } else if (message.type === 'chat_command') {
      // Someone used a command in chat (!attack, !heal, etc.)
      const { command, user, userId, args, heroId } = message;
      const commandName = command.replace('!', '').toLowerCase();
      
      
      // Find the hero for this user
      // Try to match by heroId from message first (most reliable), then userId, then name
      const hero = heroes.find(h => 
        (heroId && h.id === heroId) ||
        (h.id === userId) ||
        (h.name === user) ||
        (h.twitchUserId === userId)
      );
      if (!hero) {
        return;
      }
      
      // Check cooldown
      const cooldownKey = `${userId}:${commandName}`;
      const lastUsed = commandCooldowns.current.get(cooldownKey) || 0;
      const cooldownMs = getCommandCooldown(commandName);
      const now = Date.now();
      
      if (now - lastUsed < cooldownMs) {
        return;
      }
      
      // Process command
      commandCooldowns.current.set(cooldownKey, now);
      
      if (commandName === 'attack' || commandName === 'a') {
        // Trigger hero attack
        const aliveEnemies = enemies.filter(e => e.hp > 0);
        if (aliveEnemies.length > 0) {
          const targetEnemy = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
          processHeroCommand(hero.id, 'attack', targetEnemy.id);
        }
      } else if (commandName === 'heal' || commandName === 'h') {
        // Trigger hero heal (if healer) - auto-targets lowest HP hero
        const healers = ['cleric', 'atoner', 'druid', 'lightbringer', 'shaman', 'mistweaver', 'chronomancer', 'bard'];
        if (healers.includes(hero.role.toLowerCase())) {
          const aliveHeroes = heroes.filter(h => h.hp > 0);
          if (aliveHeroes.length > 0) {
            // Find hero with lowest HP percentage
            const targetHero = aliveHeroes.reduce((lowest, current) => {
              const lowestPercent = lowest.hp / lowest.maxHp;
              const currentPercent = current.hp / current.maxHp;
              return currentPercent < lowestPercent ? current : lowest;
            });
            processHeroCommand(hero.id, 'heal', targetHero.id);
          }
        }
      } else if (commandName === 'cast' || commandName === 'ability') {
        // Trigger class ability
        const aliveEnemies = enemies.filter(e => e.hp > 0);
        if (aliveEnemies.length > 0) {
          const targetEnemy = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
          processHeroCommand(hero.id, 'ability', targetEnemy.id);
        }
      } else if (commandName === 'defend') {
        // Trigger defend action (tanks only)
        const tanks = ['guardian', 'paladin', 'knight', 'warrior', 'berserker'];
        if (tanks.includes(hero.role.toLowerCase())) {
          processHeroCommand(hero.id, 'defend');
        }
      } else if (commandName === 'dispel') {
        // Remove debuffs from self or target
        const target = args?.[0]?.toLowerCase() || 'self';
        processHeroCommand(hero.id, 'dispel', target === 'self' ? hero.id : undefined);
      } else if (commandName === 'rest') {
        // Full party heal and resurrect (5 min cooldown)
        processHeroCommand(hero.id, 'rest');
      }
    }
  }, [heroes, enemies, convertHeroToTestHero]); // Memoize with dependencies
  // Get command cooldown duration (matches backend cooldowns)
  const getCommandCooldown = (command: string): number => {
    const cooldowns: Record<string, number> = {
      'attack': 5000,      // 5 seconds (matches backend)
      'heal': 8000,        // 8 seconds (matches backend)
      'cast': 10000,       // 10 seconds (matches backend)
      'ability': 10000,    // 10 seconds (same as cast)
      'defend': 15000,     // 15 seconds (matches backend)
      'dispel': 5000,      // 5 seconds
      'rest': 300000,      // 5 minutes (matches backend)
      'item': 1000,        // 1 second
      'use': 1000          // 1 second
    };
    return cooldowns[command] || 5000;
  };
  // Process hero command (attack, heal, ability, defend, dispel, rest)
  const processHeroCommand = (heroId: string, command: string, targetId?: string) => {
    const hero = heroes.find(h => h.id === heroId);
    if (!hero) return;
    
    // Rest command can work even if hero is dead
    if (command === 'rest') {
      // Full party heal and resurrect
      setHeroes(prev => prev.map(h => {
        const newHp = h.maxHp;
        const newShield = 0;
        return { ...h, hp: newHp, shield: newShield, activeDebuffs: {} };
      }));
      // Show combat text after state update
      setTimeout(() => {
        heroes.forEach(h => {
          showScrollingCombatText(`battle-hero-${h.id}`, 'REST', 'healing', true);
        });
      }, 0);
      return;
    }
    
    if (hero.hp <= 0) return; // Dead heroes can't use other commands
    
    if (command === 'attack' && targetId) {
      const targetEnemy = enemies.find(e => e.id === targetId);
      if (!targetEnemy || targetEnemy.hp <= 0) return;
      
      // Calculate damage
      const baseDamage = calculateHeroBaseDamage(hero);
      const enemyDefense = targetEnemy.defense || 0;
      const critChance = hero.critChance || 0;
      const { actualDamage, isCrit } = calculateDamageWithCrit(
        baseDamage,
        critChance,
        enemyDefense,
        hero.activeDebuffs,
        targetEnemy.activeDebuffs,
        hero.activeBuffs,
        targetEnemy.activeBuffs
      );
      
      // Play attack animation
      const heroRef = heroRefs.current.get(heroId);
      if (heroRef?.current) {
        // Check if hero uses ranged attacks
        const rangedRoles = ['mage', 'wizard', 'pyromancer', 'frostmage', 'archer', 'ranger', 'bard'];
        if (rangedRoles.includes(hero.role.toLowerCase())) {
          heroRef.current.playAnimation('rangedAttack');
        } else {
          heroRef.current.playAnimation('attack');
        }
      }
      
      // Apply damage after animation
      setTimeout(() => {
        setEnemies(prev => prev.map(e => {
          if (e.id === targetId) {
            // Safety check: if hp is NaN or invalid, use maxHp as fallback
            const currentHp = (typeof e.hp === 'number' && !isNaN(e.hp)) ? e.hp : (e.maxHp || 0);
            const newHp = Math.max(0, currentHp - actualDamage);
            return { ...e, hp: newHp };
          }
          return e;
        }));
        // Show combat text after state update
        showScrollingCombatText(`battle-enemy-${targetId}`, actualDamage, isCrit ? 'crit' : 'damage', false);
      }, 300);
    } else if (command === 'heal' && targetId) {
      const targetHero = heroes.find(h => h.id === targetId);
      if (!targetHero) return;
      
      // Calculate healing (60-100 HP as per backend)
      const baseHealing = 60 + Math.floor(Math.random() * 41); // 60-100
      const healing = calculateHealing(
        baseHealing,
        hero.activeBuffs,
        targetHero.activeBuffs,
        hero.equipment,
        targetHero.equipment
      );
      
      // Play heal animation
      const heroRef = heroRefs.current.get(heroId);
      if (heroRef?.current) {
        heroRef.current.playAnimation('rangedAttack'); // Healers use ranged attack animation
      }
      
      // Apply healing after animation
      setTimeout(() => {
        setHeroes(prev => prev.map(h => {
          if (h.id === targetId) {
            const missingHp = h.maxHp - h.hp;
            const hpHealed = Math.min(healing, missingHp);
            const newHp = Math.min(h.maxHp, h.hp + hpHealed);
            const excessHealing = healing - hpHealed;
            const newShield = (h.shield || 0) + excessHealing;
            return { ...h, hp: newHp, shield: newShield };
          }
          return h;
        }));
        // Show combat text after state update
        showScrollingCombatText(`battle-hero-${targetId}`, healing, 'healing', true);
      }, 300);
    } else if (command === 'ability' && targetId) {
      // Class ability (cast)
      const targetEnemy = enemies.find(e => e.id === targetId);
      if (!targetEnemy || targetEnemy.hp <= 0) return;
      
      const now = Date.now();
      const targetHpPercent = targetEnemy.hp / targetEnemy.maxHp;
      
      // Apply class ability
      const abilityResult = applyClassAbility(
        hero.role,
        calculateHeroBaseDamage(hero),
        targetHpPercent,
        now,
        {}, // cooldowns (not tracked in frontend for now)
        {}  // classAbilityState (not tracked in frontend for now)
      );
      
      // Calculate final damage with ability
      const enemyDefense = targetEnemy.defense || 0;
      const critChance = hero.critChance || 0;
      const { actualDamage, isCrit } = calculateDamageWithCrit(
        abilityResult.modifiedDamage,
        critChance,
        enemyDefense,
        hero.activeDebuffs,
        targetEnemy.activeDebuffs,
        hero.activeBuffs,
        targetEnemy.activeBuffs
      );
      
      // Play ability animation
      const heroRef = heroRefs.current.get(heroId);
      if (heroRef?.current) {
        const rangedRoles = ['mage', 'wizard', 'pyromancer', 'frostmage', 'archer', 'ranger', 'bard'];
        if (rangedRoles.includes(hero.role.toLowerCase())) {
          heroRef.current.playAnimation('rangedAttack');
        } else {
          heroRef.current.playAnimation('attack');
        }
      }
      
      // Apply damage after animation
      setTimeout(() => {
        setEnemies(prev => prev.map(e => {
          if (e.id === targetId) {
            // Safety check: if hp is NaN or invalid, use maxHp as fallback
            const currentHp = (typeof e.hp === 'number' && !isNaN(e.hp)) ? e.hp : (e.maxHp || 0);
            const newHp = Math.max(0, currentHp - actualDamage);
            return { ...e, hp: newHp };
          }
          return e;
        }));
        // Show combat text after state update
        showScrollingCombatText(`battle-enemy-${targetId}`, actualDamage, isCrit ? 'crit' : 'damage', false);
      }, 300);
    } else if (command === 'defend') {
      // Apply defense buff (+50% DEF for 30 seconds)
      const defenseBonus = Math.floor((hero.defense || 0) * 0.5);
      const buffKey = `defend_${Date.now()}`;
      const newBuffs = {
        ...(hero.activeBuffs || {}),
        [buffKey]: {
          name: 'Defend',
          icon: '🛡️',
          color: '#3b82f6',
          remainingDuration: 30000, // 30 seconds
          defenseBonus: defenseBonus,
          effect: 'defenseIncrease'
        }
      };
      
      setHeroes(prev => prev.map(h => {
        if (h.id === heroId) {
          return { ...h, activeBuffs: newBuffs };
        }
        return h;
      }));
      // Show combat text after state update
      setTimeout(() => {
        showScrollingCombatText(`battle-hero-${heroId}`, 'DEFEND', 'buff', true);
      }, 0);
      
    } else if (command === 'dispel') {
      // Remove debuffs from hero
      let hadDebuffs = false;
      setHeroes(prev => prev.map(h => {
        if (h.id === heroId) {
          hadDebuffs = h.activeDebuffs && Object.keys(h.activeDebuffs).length > 0;
          return { ...h, activeDebuffs: {} };
        }
        return h;
      }));
      // Show combat text after state update
      if (hadDebuffs) {
        setTimeout(() => {
          showScrollingCombatText(`battle-hero-${heroId}`, 'DISPEL', 'healing', true);
        }, 0);
      }
    }
  };
  // Get twitchId from URL (browser source) or user object for WebSocket
  const urlTwitchId = searchParams.get('twitchId');
  const effectiveTwitchId = urlTwitchId || user?.twitchId || null;
  
  // Connect to WebSocket for Twitch chat commands
  useWebSocket(effectiveTwitchId, handleWebSocketMessage);
  
  // Log WebSocket connection status
  useEffect(() => {
    if (effectiveTwitchId) {
    } else {
    }
  }, [effectiveTwitchId, urlTwitchId, user?.twitchId]);
  // Handle token from URL (for browser source)
  useEffect(() => {
    const urlToken = searchParams.get('token');
    const urlTwitchId = searchParams.get('twitchId');
    
    if (urlToken && !localStorage.getItem('auth_token')) {
      // Store token from URL for authentication
      localStorage.setItem('auth_token', urlToken);
    }
    
    // Auto-load hero if token is provided (browser source mode)
    if (urlToken && (urlTwitchId || user?.twitchId) && !heroLoadedRef.current) {
      const twitchId = urlTwitchId || user?.twitchId;
      if (twitchId) {
        heroLoadedRef.current = true; // Set immediately to prevent multiple calls
        loadHeroFromBackend(twitchId);
      }
    }
  }, [searchParams, user?.twitchId]); // Only depend on searchParams and user.twitchId, not the whole user object or heroes
  // Set transparent background for browser source mode
  useEffect(() => {
    if (isBrowserSource) {
      // Make body and html transparent
      document.body.style.backgroundColor = 'transparent';
      document.documentElement.style.backgroundColor = 'transparent';
      
      return () => {
        // Restore on unmount
        document.body.style.backgroundColor = '';
        document.documentElement.style.backgroundColor = '';
      };
    }
  }, [isBrowserSource]);
  // ============================================
  // CENTRALIZED ENEMY SPAWNING SYSTEM
  // ============================================
  
  // Centralized function to spawn enemies for a wave - prevents conflicts from multiple spawn sources
  const spawnEnemiesForWave = useCallback((source: string): void => {
    // Prevent concurrent spawns
    if (isSpawning()) {
      console.log(`[Spawn] Spawn already in progress, ignoring request from ${source}`);
      return;
    }
    
    // Don't spawn if combat is active
    if (isCombatActive()) {
      console.log(`[Spawn] Combat active, ignoring spawn request from ${source}`);
      return;
    }
    
    // Don't spawn if there are already alive enemies
    const aliveEnemies = enemiesRef.current.filter(e => e.hp > 0);
    if (aliveEnemies.length > 0) {
      console.log(`[Spawn] Enemies already exist (${aliveEnemies.length} alive), ignoring spawn request from ${source}`);
      return;
    }
    
    // Set spawn state
    setCombatState('spawning', `spawnEnemiesForWave: ${source}`);
    console.log(`[Spawn] Starting enemy spawn from ${source}`);
    
    try {
      const packSize = getPackSize();
      const enemyNames = generateEnemyPack(packSize);
      const avgLevel = calculateAveragePartyLevel(heroesRef.current);
      const partySize = heroesRef.current.length;
      const avgGearScore = calculateAverageGearScore(heroesRef.current);
      const currentWave = waveCount;
      
      // Check if this is a boss wave (every 10 waves, starting at wave 10)
      const isBossWave = currentWave > 0 && currentWave % 10 === 0;
      
      if (isBossWave) {
        // Spawn boss enemy
        const bossBaseStats = getEnemyBaseStats('Demon Lord');
        const scaling = calculateEnemyScaling({
          avgLevel,
          partySize,
          avgGearScore,
          waveCount: currentWave,
          difficultyModifier: 1.0
        });
        
        const scaledStats = scaleEnemyStats(
          bossBaseStats,
          scaling,
          1, // packSize = 1 for boss
          1.2, // hpMultiplier
          1.1, // attackMultiplier
          0.9  // defenseMultiplier
        );
        
        // Safety check: ensure hp is never NaN
        const bossHp = (typeof scaledStats.hp === 'number' && !isNaN(scaledStats.hp)) ? scaledStats.hp : 1000;
        const bossMaxHp = (typeof scaledStats.maxHp === 'number' && !isNaN(scaledStats.maxHp)) ? scaledStats.maxHp : 1000;
        
        const scaledBoss: TestEnemy = {
          id: `boss-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: 'Demon Lord',
          level: Math.max(1, Math.floor(avgLevel)),
          hp: bossHp,
          maxHp: bossMaxHp,
          attack: scaledStats.attack || 500,
          defense: scaledStats.defense || 200,
          dexterity: 10,
          xp: Math.floor(200 * Math.max(1, scaling.multiplier * 0.5))
        };
        
        setWaveCount(prev => prev + 1);
        // Set facing for boss enemy
        const bossFacing = getSavedFacing(ENEMY_FACING_STORAGE_KEY, 'Demon Lord');
        setEnemyFacings(prev => ({ ...prev, [scaledBoss.id]: bossFacing }));
        setEnemies(prev => {
          console.log(`[Spawn] Boss encounter spawned from ${source}:`, scaledBoss);
          return [...prev, scaledBoss];
        });
      } else {
        // Regular combat encounter - spawn random enemies
        const newEnemies: TestEnemy[] = enemyNames.map(enemyName => {
          const scaling = calculateEnemyScaling({
            avgLevel,
            partySize,
            avgGearScore,
            waveCount: currentWave,
            difficultyModifier: 1.0
          });
          
          const baseStats = getEnemyBaseStats(enemyName);
          const scaledStats = scaleEnemyStats(
            baseStats,
            scaling,
            packSize,
            0.1,
            1.1,
            0.9
          );
          
          const enemyLevel = Math.max(1, Math.floor(avgLevel));
          const baseXpValues: Record<string, number> = {
            'Kobold Warrior': 18, 'Baby Dragon': 25, 'Imp': 15, 'Lizardman': 22,
            'Masked Orc': 28, 'Werewolf': 35, 'Skeleton Mage': 30, 'Witch': 32,
            'Mimic': 40, 'Gryphon': 50, 'Minotaur': 60, 'Headless Horseman': 70,
            'Adult Dragon': 100, 'Demon Lord': 200, 'Elder Dragon': 500
          };
          const baseXp = baseXpValues[enemyName] || 20;
          const scaledXp = Math.floor(baseXp * Math.max(1, scaling.multiplier * 0.5));
          
          let baseDex = 5;
          if (enemyName.includes('Imp') || enemyName.includes('Assassin')) {
            baseDex = 12;
          } else if (enemyName.includes('Dragon') || enemyName.includes('Witch') || enemyName.includes('Mage')) {
            baseDex = 8;
          }
          
          // Safety check: ensure hp is never NaN
          const enemyHp = (typeof scaledStats.hp === 'number' && !isNaN(scaledStats.hp)) ? scaledStats.hp : baseStats.hp;
          const enemyMaxHp = (typeof scaledStats.maxHp === 'number' && !isNaN(scaledStats.maxHp)) ? scaledStats.maxHp : baseStats.hp;
          
          return {
            id: `enemy-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            name: enemyName,
            level: enemyLevel,
            xp: scaledXp,
            hp: enemyHp,
            maxHp: enemyMaxHp,
            attack: scaledStats.attack || baseStats.attack,
            defense: scaledStats.defense || baseStats.defense,
            dexterity: baseDex
          };
        });
        
        setWaveCount(prev => prev + 1);
        // Set facing for all new enemies
        const newFacings: Record<string, 'left' | 'right'> = {};
        newEnemies.forEach(enemy => {
          const savedFacing = getSavedFacing(ENEMY_FACING_STORAGE_KEY, enemy.name);
          newFacings[enemy.id] = savedFacing;
        });
        setEnemyFacings(prev => ({ ...prev, ...newFacings }));
        setEnemies(prev => {
          console.log(`[Spawn] New encounter spawned from ${source}:`, newEnemies);
          return [...prev, ...newEnemies];
        });
      }
    } finally {
      // Release spawn state after a short delay to prevent rapid re-spawning
      // If enemies were spawned, transition to idle so combat can start
      setTimeout(() => {
        const aliveEnemies = enemiesRef.current.filter(e => e.hp > 0);
        if (aliveEnemies.length > 0) {
          // Enemies spawned, go to idle so combat can start
          setCombatState('idle', 'spawn complete - enemies ready');
        } else {
          // No enemies spawned, stay idle
          setCombatState('idle', 'spawn complete - no enemies');
        }
      }, 100);
    }
  }, [waveCount, isAdventuring]);
  
  // Auto-start adventure loop when hero is loaded (browser source mode)
  useEffect(() => {
    if (isBrowserSource && heroes.length > 0 && !isAdventuring && heroLoadedRef.current) {
      setIsAdventuring(true);
      
      // Let adventure loop handle initial enemy spawning (runs every 5 seconds)
      // Use centralized spawn function if we need immediate spawn
      setTimeout(() => {
        const aliveEnemies = enemiesRef.current.filter(e => e.hp > 0);
        if (aliveEnemies.length === 0 && heroesRef.current.length > 0) {
          console.log('[Auto-start] Spawning initial enemies for browser source');
          spawnEnemiesForWave('auto-start-adventure');
        }
      }, 500); // Small delay to ensure state is ready
    }
  }, [heroes.length, isBrowserSource, isAdventuring, spawnEnemiesForWave]);
  
  // Auto-start combat when heroes + enemies present (browser/adventure mode)
  useEffect(() => {
    if (autoStartCombatTimeoutRef.current) {
      clearTimeout(autoStartCombatTimeoutRef.current);
      autoStartCombatTimeoutRef.current = null;
    }
    
    const shouldAutoStart =
      (isBrowserSource || isAdventuring) &&
      heroes.length > 0 &&
      enemies.length > 0 &&
      canStartCombat();
    
    if (!shouldAutoStart) return;
    
    autoStartCombatTimeoutRef.current = setTimeout(() => {
      const aliveHeroes = heroesRef.current.filter((h) => h.hp > 0);
      const aliveEnemies = enemiesRef.current.filter((e) => e.hp > 0);
      const currentState = combatSupervisorRef.current.state;
      
      // Check state again inside setTimeout (state may have changed)
      // Allow starting from idle, ended, or spawning (if enemies are ready)
      const canStart = currentState === 'idle' || currentState === 'ended' || 
                       (currentState === 'spawning' && aliveEnemies.length > 0);
      
      if (
        aliveHeroes.length > 0 &&
        aliveEnemies.length > 0 &&
        canStart
      ) {
        console.log(`🚀 [Combat] Auto-starting combat... (state: ${currentState})`);
        processCombatRound();
      } else {
        console.log(`⏭️ [Combat] Auto-start skipped - Heroes: ${aliveHeroes.length}, Enemies: ${aliveEnemies.length}, State: ${currentState}, CanStart: ${canStart}`);
      }
      
      autoStartCombatTimeoutRef.current = null;
    }, 1000);
  }, [heroes.length, enemies.length, isBrowserSource, isAdventuring]);
  // Get or create hero ref
  const getHeroRef = (heroId: string): React.RefObject<HeroSpriteJSHandle> => {
    let ref = heroRefs.current.get(heroId);
    if (!ref) {
      ref = React.createRef<HeroSpriteJSHandle>();
      heroRefs.current.set(heroId, ref);
    }
    return ref;
  };
  // Get or create enemy ref
  const getEnemyRef = (enemyId: string): React.RefObject<EnemySpriteJSHandle> => {
    let ref = enemyRefs.current.get(enemyId);
    if (!ref) {
      ref = React.createRef<EnemySpriteJSHandle>();
      enemyRefs.current.set(enemyId, ref);
    }
    return ref;
  };
  // Map display names to class names (for animations)
  const nameToClass: Record<string, string> = {
    'Guardian': 'guardian',
    'Paladin': 'paladin',
    'Warden': 'warden',
    'Blood Knight': 'bloodknight',
    'Vanguard': 'vanguard',
    'Brewmaster': 'brewmaster',
    'Berserker': 'berserker',
    'Crusader': 'crusader',
    'Assassin': 'assassin',
    'Reaper': 'reaper',
    'Blade Dancer': 'bladedancer',
    'Monk': 'monk',
    'Storm Warrior': 'stormwarrior',
    'Hunter': 'hunter',
    'Mage': 'mage',
    'Warlock': 'warlock',
    'Ranger': 'ranger',
    'Necromancer': 'necromancer',
    'Cleric': 'cleric',
    'Atoner': 'atoner',
    'Druid': 'druid',
    'Lightbringer': 'lightbringer',
    'Shaman': 'shaman',
    'Mistweaver': 'mistweaver',
    'Chronomender': 'chronomancer',
    'Bard': 'bard'
  };
  // Add specific hero by class name
  const addSpecificHero = (heroClass: string, heroName: string) => {
    const categoryMap: Record<string, 'tank' | 'dps' | 'ranged' | 'healer'> = {
      'guardian': 'tank', 'paladin': 'tank', 'warden': 'tank', 'bloodknight': 'tank', 'vanguard': 'tank', 'brewmaster': 'tank',
      'berserker': 'dps', 'crusader': 'dps', 'assassin': 'dps', 'reaper': 'dps', 'bladedancer': 'dps', 'monk': 'dps', 'stormwarrior': 'dps', 'hunter': 'dps',
      'mage': 'ranged', 'warlock': 'ranged', 'ranger': 'ranged', 'necromancer': 'ranged',
      'cleric': 'healer', 'atoner': 'healer', 'druid': 'healer', 'lightbringer': 'healer', 'shaman': 'healer', 'mistweaver': 'healer', 'chronomancer': 'healer', 'bard': 'healer'
    };
    
    const category = categoryMap[heroClass.toLowerCase()] || 'dps';
    const selected = { name: heroName, class: heroClass.toLowerCase() };
    
    const baseStats = {
      tank: { hp: 5000, maxHp: 5000, attack: 200, defense: 300, critChance: 0.05, dexterity: 8 },
      dps: { hp: 3000, maxHp: 3000, attack: 400, defense: 100, critChance: 0.15, dexterity: 15 },
      ranged: { hp: 2500, maxHp: 2500, attack: 350, defense: 80, critChance: 0.10, dexterity: 12 },
      healer: { hp: 2500, maxHp: 2500, attack: 150, defense: 120, critChance: 0.05, dexterity: 10 }
    };
    
    const newHero: TestHero = {
      id: `hero-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: selected.name,
      role: selected.class,
      level: 50,
      ...baseStats[category],
      cooldowns: { classAbilityPrimary: 0 },
      classAbilityState: {
        enrageActive: false,
        elementRotation: 0,
        comboCount: 0
      }
    };
    
    const savedFacing = getSavedFacing(HERO_FACING_STORAGE_KEY, selected.class);
    setHeroFacings(prev => ({ ...prev, [newHero.id]: savedFacing }));
    
    setHeroes(prev => [...prev, newHero]);
  };
  // Load hero from backend/Firebase (with skills from skill page)
  const loadHeroFromBackend = async (userIdOrUsername: string) => {
    if (loadingHero) return; // Prevent multiple simultaneous loads
    
    setLoadingHero(true);
    try {
      
      // Try to get hero by Twitch ID first (if it's a numeric ID)
      let backendHero: Hero | null = null;
      const numericId = Number(userIdOrUsername);
      
      if (!isNaN(numericId) && numericId > 0) {
        // It's a numeric ID, try direct lookup
        try {
          backendHero = await heroAPI.getHero(userIdOrUsername);
        } catch (error) {
        }
      }
      
      // If direct lookup failed or it's a username, get all heroes for this user
      if (!backendHero) {
        // If direct lookup failed or it's a username, get all heroes and filter
      // Last resort: get all heroes and filter by username, name, or ID
      const allHeroes = await heroAPI.getAllHeroes();
      const searchLower = userIdOrUsername.toLowerCase();
      
      const matchingHeroes = allHeroes.filter((h: Hero) => {
        const twitchId = h.twitchUserId?.toString().toLowerCase() || '';
        const name = h.name?.toLowerCase() || '';
        // Match by exact ID, exact name, or partial match
        return twitchId === searchLower || 
               name === searchLower || 
               name.includes(searchLower) ||
               twitchId.includes(searchLower);
      });
      
      if (matchingHeroes.length > 0) {
        // Sort by updatedAt to get most recent (active) hero
        matchingHeroes.sort((a, b) => {
          const aTime = (a as any).updatedAt?.toMillis?.() ?? new Date((a as any).updatedAt ?? 0).getTime();
          const bTime = (b as any).updatedAt?.toMillis?.() ?? new Date((b as any).updatedAt ?? 0).getTime();
          return bTime - aTime;
        });
        backendHero = matchingHeroes[0];
        if (matchingHeroes.length > 1) {
          // Multiple matching heroes found, using first one
        }
      } else {
        // Try getHeroesByTwitchId as fallback (in case it's a Twitch ID stored as string)
        try {
          const heroesByTwitch = await heroAPI.getHeroesByTwitchId(userIdOrUsername);
          if (heroesByTwitch && heroesByTwitch.length > 0) {
            heroesByTwitch.sort((a, b) => {
              const aTime = (a as any).updatedAt?.toMillis?.() ?? new Date((a as any).updatedAt ?? 0).getTime();
              const bTime = (b as any).updatedAt?.toMillis?.() ?? new Date((b as any).updatedAt ?? 0).getTime();
              return bTime - aTime;
            });
            backendHero = heroesByTwitch[0];
          }
        } catch (error) {
        }
      }
      }
      
      if (!backendHero) {
        throw new Error(`No hero found for user: ${userIdOrUsername}. Try using Twitch user ID or hero name.`);
      }
      
      // Determine category for skill bonuses
      const categoryMap: Record<string, 'tank' | 'healer' | 'dps'> = {
        'guardian': 'tank', 'paladin': 'tank', 'warden': 'tank', 'bloodknight': 'tank', 'vanguard': 'tank', 'brewmaster': 'tank',
        'berserker': 'dps', 'crusader': 'dps', 'assassin': 'dps', 'reaper': 'dps', 'bladedancer': 'dps', 'monk': 'dps', 'stormwarrior': 'dps', 'hunter': 'dps',
        'mage': 'dps', 'warlock': 'dps', 'ranger': 'dps', 'necromancer': 'dps', 'shadowpriest': 'dps', 'mooncaller': 'dps', 'stormcaller': 'dps', 'frostmage': 'dps', 'firemage': 'dps', 'dragonsorcerer': 'dps',
        'cleric': 'healer', 'atoner': 'healer', 'druid': 'healer', 'lightbringer': 'healer', 'shaman': 'healer', 'mistweaver': 'healer', 'chronomancer': 'healer', 'bard': 'healer'
      };
      const category = categoryMap[backendHero.role.toLowerCase()] || 'dps';
      
      // Calculate skill bonuses from backend skills
      const skillBonuses = calculateSkillBonuses(
        { skills: backendHero.skills || {}, role: backendHero.role },
        category
      );
      
      
      // Convert backend Hero to TestHero
      // Store equipment for gear score calculation
      const testHero: TestHero = {
        id: backendHero.id || `hero-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: backendHero.name,
        role: backendHero.role,
        level: backendHero.level,
        xp: backendHero.xp || 0,
        maxXp: backendHero.maxXp || 100 + (backendHero.level * 10),
        hp: backendHero.hp,
        maxHp: backendHero.maxHp,
        attack: backendHero.attack + skillBonuses.attack, // Apply skill bonuses
        defense: backendHero.defense + skillBonuses.defense,
        critChance: (backendHero.equipment?.weapon?.secondaryStats?.critChance || 0) / 100 + skillBonuses.critChance / 100,
        dexterity: 10, // Default, could be calculated from equipment
        skills: backendHero.skills || {}, // Use skills from backend
        skillPoints: backendHero.skillPoints || 0,
        equipment: backendHero.equipment, // Store equipment for gear score calculation
        cooldowns: { classAbilityPrimary: 0 },
        classAbilityState: {
          enrageActive: false,
          elementRotation: 0,
          comboCount: 0
        }
      };
      
      // Apply saved facing preference
      const savedFacing = getSavedFacing(HERO_FACING_STORAGE_KEY, backendHero.role);
      setHeroFacings(prev => ({ ...prev, [testHero.id]: savedFacing }));
      
      // Get user ID for quest tracking (use twitchUserId if available)
      const userId = backendHero.twitchUserId?.toString() || backendHero.id;
      
      setHeroes(prev => {
        // Check if hero already exists (by ID, twitchUserId, or name) to prevent duplicates
        const existingIndex = prev.findIndex(h => 
          h.id === testHero.id || 
          (h as any).twitchUserId === backendHero.twitchUserId?.toString() ||
          (h.name === testHero.name && h.role === testHero.role)
        );
        if (existingIndex >= 0) {
          // Hero already exists, update it instead of adding duplicate
          const updated = [...prev];
          updated[existingIndex] = testHero;
          return updated;
        }
        
        const updated = [...prev, testHero];
        
        // Initialize quest tracker if this is the first hero (or reinitialize with user ID)
        if (prev.length === 0 || !questTrackerRef.current) {
          questTrackerRef.current = new QuestTracker(
            async (updates: QuestProgressUpdate[]) => {
              if (userId) {
                try {
                  const response = await questAPI.updateQuestProgressBatch(userId, updates);
                  return { completed: response.completedQuests || [] };
                } catch (error) {
                  return { completed: [] };
                }
              } else {
                return { completed: [] };
              }
            },
            (completedQuests: CompletedQuest[]) => {
              // Show combat text for each completed quest
              completedQuests.forEach(quest => {
                // Show quest complete text on the first hero (or all heroes if multiple)
                const firstHero = updated[0];
                if (firstHero) {
                  const heroElement = document.getElementById(`battle-hero-${firstHero.id}`);
                  if (heroElement) {
                    showScrollingCombatText(
                      `battle-hero-${firstHero.id}`,
                      `QUEST COMPLETE: ${quest.questName}`,
                      'questcomplete',
                      true
                    );
                  }
                }
              });
            }
          );
        }
        
        return updated;
      });
      
      // Mark hero as loaded (for browser source auto-start)
      heroLoadedRef.current = true;
      
    } catch (error) {
      alert(`Failed to load hero: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingHero(false);
    }
  };
  // Load multiple heroes from backend (for raids/queues)
  const loadMultipleHeroesFromBackend = async (heroIds: string[]) => {
    if (loadingHero) return; // Prevent multiple simultaneous loads
    
    setLoadingHero(true);
    try {
      
      const loadedHeroes: TestHero[] = [];
      
      // Load each hero
      for (const heroId of heroIds) {
        try {
          const backendHero = await heroAPI.getHero(heroId);
          
          // Determine category for skill bonuses
          const categoryMap: Record<string, 'tank' | 'healer' | 'dps'> = {
            'guardian': 'tank', 'paladin': 'tank', 'warden': 'tank', 'bloodknight': 'tank', 'vanguard': 'tank', 'brewmaster': 'tank',
            'berserker': 'dps', 'crusader': 'dps', 'assassin': 'dps', 'reaper': 'dps', 'bladedancer': 'dps', 'monk': 'dps', 'stormwarrior': 'dps', 'hunter': 'dps',
            'mage': 'dps', 'warlock': 'dps', 'ranger': 'dps', 'necromancer': 'dps', 'shadowpriest': 'dps', 'mooncaller': 'dps', 'stormcaller': 'dps', 'frostmage': 'dps', 'firemage': 'dps', 'dragonsorcerer': 'dps',
            'cleric': 'healer', 'atoner': 'healer', 'druid': 'healer', 'lightbringer': 'healer', 'shaman': 'healer', 'mistweaver': 'healer', 'chronomancer': 'healer', 'bard': 'healer'
          };
          const category = categoryMap[backendHero.role.toLowerCase()] || 'dps';
          
          // Calculate skill bonuses
          const skillBonuses = calculateSkillBonuses(
            { skills: backendHero.skills || {}, role: backendHero.role },
            category
          );
          
          // Convert backend Hero to TestHero
          const testHero: TestHero = {
            id: backendHero.id || `hero-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            name: backendHero.name,
            role: backendHero.role,
            level: backendHero.level,
            xp: backendHero.xp || 0,
            maxXp: backendHero.maxXp || 100 + (backendHero.level * 10),
            hp: backendHero.hp,
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
          
          // Apply saved facing preference
          const savedFacing = getSavedFacing(HERO_FACING_STORAGE_KEY, backendHero.role);
          setHeroFacings(prev => ({ ...prev, [testHero.id]: savedFacing }));
          
          loadedHeroes.push(testHero);
        } catch (error) {
        }
      }
      
      // Add all loaded heroes to state
      setHeroes(prev => [...prev, ...loadedHeroes]);
      
      // Initialize quest tracker if this is the first hero
      if (loadedHeroes.length > 0 && !questTrackerRef.current) {
        const firstHero = loadedHeroes[0];
        const userId = firstHero.id; // Use first hero's ID as user context
        
        questTrackerRef.current = new QuestTracker(
          async (updates: QuestProgressUpdate[]) => {
            if (userId) {
              try {
                const response = await questAPI.updateQuestProgressBatch(userId, updates);
                return { completed: response.completedQuests || [] };
              } catch (error) {
                return { completed: [] };
              }
            }
            return { completed: [] };
          },
          (completedQuests: CompletedQuest[]) => {
            completedQuests.forEach(quest => {
              const firstHero = loadedHeroes[0];
              if (firstHero) {
                const heroElement = document.getElementById(`battle-hero-${firstHero.id}`);
                if (heroElement) {
                  showScrollingCombatText(
                    `battle-hero-${firstHero.id}`,
                    `QUEST COMPLETE: ${quest.questName}`,
                    'questcomplete',
                    true
                  );
                }
              }
            });
          }
        );
      }
      
    } catch (error) {
    } finally {
      setLoadingHero(false);
    }
  };
  // Test ability animations
  const testAbilityEffect = (heroId: string, abilityType: 'backstab' | 'deathStrike' | 'holyStrike') => {
    const now = Date.now();
    abilityEffects.current.set(heroId, { type: abilityType, expiry: now + 500 });
    // Trigger re-render
    setHeroes(prev => prev.map(h => h.id === heroId ? { ...h } : h));
    // Clear effect after duration
    setTimeout(() => {
      abilityEffects.current.delete(heroId);
      setHeroes(prev => prev.map(h => h.id === heroId ? { ...h } : h));
    }, 500);
  };
  // Add individual hero
  const addHero = (category: 'tank' | 'dps' | 'ranged' | 'healer') => {
    const heroOptions = {
      tank: [
        { name: 'Guardian', class: 'guardian' },
        { name: 'Paladin', class: 'paladin' },
        { name: 'Warden', class: 'warden' },
        { name: 'Blood Knight', class: 'bloodknight' },
        { name: 'Vanguard', class: 'vanguard' },
        { name: 'Brewmaster', class: 'brewmaster' }
      ],
      dps: [
        { name: 'Berserker', class: 'berserker' },
        { name: 'Crusader', class: 'crusader' },
        { name: 'Assassin', class: 'assassin' },
        { name: 'Reaper', class: 'reaper' },
        { name: 'Blade Dancer', class: 'bladedancer' },
        { name: 'Monk', class: 'monk' },
        { name: 'Storm Warrior', class: 'stormwarrior' },
        { name: 'Hunter', class: 'hunter' }
      ],
      ranged: [
        { name: 'Mage', class: 'mage' },
        { name: 'Warlock', class: 'warlock' },
        { name: 'Ranger', class: 'ranger' },
        { name: 'Necromancer', class: 'necromancer' }
      ],
      healer: [
        { name: 'Cleric', class: 'cleric' },
        { name: 'Atoner', class: 'atoner' },
        { name: 'Druid', class: 'druid' },
        { name: 'Lightbringer', class: 'lightbringer' },
        { name: 'Shaman', class: 'shaman' },
        { name: 'Mistweaver', class: 'mistweaver' },
        { name: 'Chronomender', class: 'chronomancer' },
        { name: 'Bard', class: 'bard' }
      ]
    };
    
    const options = heroOptions[category];
    const existingClasses = heroes.filter(h => options.some(opt => opt.class === h.role)).map(h => h.role);
    const availableOptions = options.filter(opt => !existingClasses.includes(opt.class));
    const selected = availableOptions[0] || options[0];
    
    const baseStats = {
      tank: { hp: 5000, maxHp: 5000, attack: 200, defense: 300, critChance: 0.05, dexterity: 8 }, // 5% crit, 8 dex
      dps: { hp: 3000, maxHp: 3000, attack: 400, defense: 100, critChance: 0.15, dexterity: 15 }, // 15% crit, 15 dex
      ranged: { hp: 2500, maxHp: 2500, attack: 350, defense: 80, critChance: 0.10, dexterity: 12 }, // 10% crit, 12 dex
      healer: { hp: 2500, maxHp: 2500, attack: 150, defense: 120, critChance: 0.05, dexterity: 10 } // 5% crit, 10 dex
    };
    
    const newHero: TestHero = {
      id: `hero-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, // Use alphanumeric only for valid CSS selector
      name: selected.name,
      role: selected.class, // Use actual class name for animations
      level: 50,
      xp: 0,
      maxXp: 100 + (50 * 10), // Start with maxXp for level 50: 100 + (level * 10)
      ...baseStats[category],
      skills: {}, // Initialize empty skills
      skillPoints: 50, // Start with skill points equal to level
      cooldowns: { classAbilityPrimary: 0 },
      classAbilityState: {
        enrageActive: false,
        elementRotation: 0,
        comboCount: 0
      },
      gold: 0, // Initialize gold
      tokens: 0, // Initialize tokens
      lastTokenClaim: Date.now(), // Initialize token claim time
      lastCommandTime: Date.now() // Initialize command time (active status)
    };
    
    // Apply saved facing preference for this hero class
    const savedFacing = getSavedFacing(HERO_FACING_STORAGE_KEY, selected.class);
    setHeroFacings(prev => ({ ...prev, [newHero.id]: savedFacing }));
    
    setHeroes(prev => {
      const updated = [...prev, newHero];
      
      // Initialize quest tracker if this is the first hero
      if (prev.length === 0 && !questTrackerRef.current) {
        // Create quest tracker with batch update callback
        // Note: In battleground, we track locally and update via API
        // For test page, we'll use the first hero's ID (in real game, would use actual user ID from auth)
        questTrackerRef.current = new QuestTracker(
          async (updates: QuestProgressUpdate[]) => {
            if (updated.length > 0) {
              // In real game, would use actual user ID from auth context
              // For test page, we'll just log the updates
              // TODO: When user context is available, call:
              // const response = await questAPI.updateQuestProgressBatch(userId, updates);
              // return { completed: response.completedQuests || [] };
            }
            return { completed: [] };
          },
          (completedQuests: CompletedQuest[]) => {
            // Show combat text for each completed quest
            completedQuests.forEach(quest => {
              // Show quest complete text on the first hero
              const firstHero = updated[0];
              if (firstHero) {
                const heroElement = document.getElementById(`battle-hero-${firstHero.id}`);
                if (heroElement) {
                  showScrollingCombatText(
                    `battle-hero-${firstHero.id}`,
                    `QUEST COMPLETE: ${quest.questName}`,
                    'questcomplete',
                    true
                  );
                }
              }
            });
          }
        );
      }
      
      return updated;
    });
  };
  // Add specific enemy type
  const addEnemy = (enemyName: string, packSize: number = 1) => {
    // Base enemy dexterity varies by type
    let baseDex = 5; // Default dexterity
    if (enemyName.includes('Imp') || enemyName.includes('Assassin')) {
      baseDex = 12; // Fast enemies
    } else if (enemyName.includes('Dragon') || enemyName.includes('Witch') || enemyName.includes('Mage')) {
      baseDex = 8; // Spellcasters slightly faster
    }
    
    // Calculate scaling factors based on CURRENT heroes
    // Use functional update to ensure we get the latest heroes state
    const currentHeroes = heroes; // This should be the current state, but we'll recalculate to be safe
    const avgLevel = calculateAveragePartyLevel(currentHeroes);
    const partySize = currentHeroes.length || 1; // Default to 1 if no heroes
    const avgGearScore = calculateAverageGearScore(currentHeroes);
    
    // Calculate enemy scaling
    const scaling = calculateEnemyScaling({
      avgLevel,
      partySize,
      avgGearScore,
      waveCount,
      difficultyModifier: 1.0 // Default difficulty (can be made configurable later)
    });
    
    // Get base stats for this enemy type
    const baseStats = getEnemyBaseStats(enemyName);
    
    // Scale enemy stats
    const scaledStats = scaleEnemyStats(
      baseStats,
      scaling,
      packSize,
      0.1, // HP multiplier (reduced for faster testing)
      1.1, // Attack multiplier
      0.9  // Defense multiplier
    );
    
    // Enemy level scales to party level (minimum level 1)
    const enemyLevel = Math.max(1, Math.floor(avgLevel));
    
    // Calculate enemy XP (base XP * scaling multiplier * 0.5)
    // Base XP varies by enemy type
    const baseXpValues: Record<string, number> = {
      'Kobold Warrior': 18,
      'Baby Dragon': 25,
      'Imp': 15,
      'Lizardman': 22,
      'Masked Orc': 28,
      'Werewolf': 35,
      'Skeleton Mage': 30,
      'Witch': 32,
      'Mimic': 40,
      'Gryphon': 50,
      'Minotaur': 60,
      'Headless Horseman': 70,
      'Adult Dragon': 100,
      'Demon Lord': 200,
      'Elder Dragon': 500
    };
    const baseXp = baseXpValues[enemyName] || 20;
    const scaledXp = Math.floor(baseXp * Math.max(1, scaling.multiplier * 0.5));
    
    const newEnemy: TestEnemy = {
      id: `enemy-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: enemyName,
      level: enemyLevel,
      xp: scaledXp,
      hp: scaledStats.hp,
      maxHp: scaledStats.maxHp,
      attack: scaledStats.attack,
      defense: scaledStats.defense,
      dexterity: baseDex,
    };
    
    // Apply saved facing preference for this enemy type
    const savedFacing = getSavedFacing(ENEMY_FACING_STORAGE_KEY, enemyName);
    setEnemyFacings(prev => ({ ...prev, [newEnemy.id]: savedFacing }));
    
    setEnemies(prev => [...prev, newEnemy]);
    
    // For Demon Lord, trigger transition sequence after component mounts
    if (enemyName === 'Demon Lord') {
      // Wait for next render cycle to ensure ref is attached
      setTimeout(() => {
        const ref = enemyRefs.current.get(newEnemy.id);
        if (ref?.current && !demonLordTransitionStarted.current.has(newEnemy.id)) {
          demonLordTransitionStarted.current.add(newEnemy.id);
          ref.current.playAnimation('transition');
          
          // After transition completes, switch to flying
          setTimeout(() => {
            const finalRef = enemyRefs.current.get(newEnemy.id);
            if (finalRef?.current && !demonLordFlying.current.has(newEnemy.id)) {
              finalRef.current.playAnimation('flying');
              demonLordFlying.current.add(newEnemy.id);
              setEnemies(prev => prev); // Trigger re-render to update health bar
            }
          }, 360);
        }
      }, 800); // Longer delay to ensure component is mounted and ref is attached
    }
    
    // Note: Werewolf now defaults to idleHuman in EnemySpriteJS component
  };
  // Toggle facing direction for hero
  const toggleHeroFacing = (heroId: string, heroRole: string) => {
    const currentFacing = heroFacings[heroId] || 'right';
    const newFacing = currentFacing === 'right' ? 'left' : 'right';
    
    // Update state
    setHeroFacings(prev => ({ ...prev, [heroId]: newFacing }));
    
    // Save to localStorage (applies to all heroes of this class)
    saveFacing(HERO_FACING_STORAGE_KEY, heroRole, newFacing);
    
    // Apply to all existing heroes of the same class
    setHeroes(prev => prev.map(h => {
      if (h.role === heroRole) {
        setHeroFacings(facings => ({ ...facings, [h.id]: newFacing }));
      }
      return h;
    }));
  };
  // Toggle facing direction for enemy
  const toggleEnemyFacing = (enemyId: string, enemyName: string) => {
    const currentFacing = enemyFacings[enemyId] || 'left';
    const newFacing = currentFacing === 'right' ? 'left' : 'right';
    
    // Update state
    setEnemyFacings(prev => ({ ...prev, [enemyId]: newFacing }));
    
    // Save to localStorage (applies to all enemies of this type)
    saveFacing(ENEMY_FACING_STORAGE_KEY, enemyName, newFacing);
    
    // Apply to all existing enemies of the same type
    setEnemies(prev => prev.map(e => {
      if (e.name === enemyName) {
        setEnemyFacings(facings => ({ ...facings, [e.id]: newFacing }));
      }
      return e;
    }));
  };
  // Test hero attack animation
  const testHeroAttack = (heroId: string) => {
    const ref = heroRefs.current.get(heroId);
    if (ref?.current) {
      ref.current.playAnimation('attack');
    }
  };
  // Test enrage animation (grow and shrink)
  const testEnrage = (heroId: string) => {
    const hero = heroes.find(h => h.id === heroId);
    if (!hero) return;
    const now = Date.now();
    
    // Initialize state if needed
    if (!hero.cooldowns) {
      hero.cooldowns = { classAbilityPrimary: 0 };
    }
    if (!hero.classAbilityState) {
      hero.classAbilityState = {
        enrageActive: false,
        elementRotation: 0,
        comboCount: 0
      };
    }
    // Activate enrage
    hero.classAbilityState.enrageActive = true;
    hero.classAbilityState.enrageExpiry = now + 12000; // 12 seconds
    hero.cooldowns.classAbilityPrimary = now + 60000; // 60s cooldown
    // Add enrage buff
    setHeroes(prev => prev.map(h => {
      if (h.id === heroId) {
        return {
          ...h,
          cooldowns: { ...hero.cooldowns },
          classAbilityState: { ...hero.classAbilityState },
          activeBuffs: {
            ...h.activeBuffs,
            enrage: {
              name: 'Enrage',
              icon: '⚔️💥',
              color: '#dc2626',
              remainingDuration: 12000,
              value: 40
            }
          }
        };
      }
      return h;
    }));
    // After 12 seconds, deactivate enrage (sprite shrinks back)
    setTimeout(() => {
      setHeroes(prev => prev.map(h => {
        if (h.id === heroId && h.classAbilityState) {
          const { enrage, ...otherBuffs } = h.activeBuffs || {};
          return {
            ...h,
            classAbilityState: {
              ...h.classAbilityState,
              enrageActive: false
            },
            activeBuffs: otherBuffs
          };
        }
        return h;
      }));
    }, 12000);
  };
  // Test hero hurt animation
  const testHeroHurt = (heroId: string) => {
    const ref = heroRefs.current.get(heroId);
    if (ref?.current) {
      ref.current.playAnimation('hurt');
    }
    
    // Apply damage with smooth health bar animation
    // Shield absorbs damage first, then HP
    const hero = heroes.find(h => h.id === heroId);
    if (hero) {
      // Use calculated base damage (spell power for casters) or default to 10% of max HP
      const baseDamage = calculateHeroBaseDamage(hero) || Math.floor(hero.maxHp * 0.1);
      const heroDefense = hero.defense || 0;
      const critChance = hero.critChance || 0;
      
      // For testHeroHurt, use first enemy's debuffs/buffs if available, otherwise undefined
      const firstEnemy = enemies[0];
      // Calculate damage with buff/debuff modifiers
      let damage = calculateDamage(baseDamage, heroDefense, firstEnemy?.activeDebuffs, hero.activeDebuffs, firstEnemy?.activeBuffs, hero.activeBuffs, firstEnemy?.equipment, hero.equipment);
      
      // Check for Last Stand before applying damage
      const now = Date.now();
      if (!hero.cooldowns) hero.cooldowns = {};
      if (!hero.classAbilityState) hero.classAbilityState = {};
      
      const hpPercent = hero.hp / hero.maxHp;
      const lastStandResult = checkLastStand(
        hero.id,
        hero.role,
        hpPercent,
        now,
        hero.cooldowns,
        hero.classAbilityState
      );
      
      // Apply Last Stand damage reduction if active
      if (hero.classAbilityState.lastStandActive && 
          hero.classAbilityState.lastStandExpiry && 
          now < hero.classAbilityState.lastStandExpiry) {
        damage = Math.floor(damage * 0.25); // 75% reduction
      }
      
      const currentShield = hero.shield || 0;
      
      let remainingDamage = damage;
      let newShield = currentShield;
      let newHp = hero.hp;
      
      // Shield absorbs damage first
      let damageBlocked = 0;
      if (currentShield > 0) {
        if (remainingDamage >= currentShield) {
          // Shield is depleted
          damageBlocked = currentShield;
          remainingDamage -= currentShield;
          newShield = 0;
        } else {
          // Shield absorbs all damage
          damageBlocked = remainingDamage;
          newShield = currentShield - remainingDamage;
          remainingDamage = 0;
        }
        
        // Track quest progress: Damage blocked
        if (questTrackerRef.current && damageBlocked > 0) {
          const currentBlocked = totalDamageBlocked.current.get(heroId) || 0;
          totalDamageBlocked.current.set(heroId, currentBlocked + damageBlocked);
          questTrackerRef.current.track('blockDamage', damageBlocked, 'daily');
          questTrackerRef.current.track('blockDamage', damageBlocked, 'weekly');
          questTrackerRef.current.track('blockDamage', damageBlocked, 'monthly');
        }
      }
      
      // Remaining damage goes to HP
      if (remainingDamage > 0) {
        newHp = Math.max(0, hero.hp - remainingDamage);
      }
      
      setHeroes(prev => prev.map(h => {
        if (h.id === heroId) {
          const updatedHero = {
            ...h,
            hp: newHp,
            shield: newShield,
            cooldowns: { ...hero.cooldowns },
            classAbilityState: { ...hero.classAbilityState }
          };
          
          // Add Last Stand buff if it was triggered
          if (lastStandResult.abilityUsed) {
            updatedHero.activeBuffs = {
              ...h.activeBuffs,
              lastStand: {
                name: 'Last Stand',
                icon: '🛡️💥',
                color: '#fbbf24',
                remainingDuration: 10000, // 10 seconds
                value: 75 // 75% damage reduction
              }
            };
            if (lastStandResult.abilityMessage) {
            }
          }
          
          return updatedHero;
        }
        return h;
      }));
      
      // Show damage combat text
      showScrollingCombatText(`battle-hero-${heroId}`, damage, 'damage', true);
    }
  };
  // Test hero death animation
  const testHeroDeath = (heroId: string) => {
    // Set HP to 0 first, which will trigger death via useEffect
    setHeroes(prev => prev.map(hero => 
      hero.id === heroId ? { ...hero, hp: 0 } : hero
    ));
  };
  // Trigger hero death (called when HP reaches 0)
  const triggerHeroDeath = (heroId: string) => {
    // Only trigger if not already dead
    if (deadHeroes.current.has(heroId)) return;
    
    deadHeroes.current.add(heroId);
    
    const ref = heroRefs.current.get(heroId);
    if (ref?.current) {
      ref.current.playAnimation('death');
    }
    
    // Clear any existing resurrection timeout for this hero
    const existingTimeout = resurrectionTimeouts.current.get(heroId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    // Auto-resurrect after 60 seconds with 50% HP
    const timeout = setTimeout(() => {
      setHeroes(prev => prev.map(hero => {
        if (hero.id === heroId) {
          const newHp = Math.floor(hero.maxHp * 0.5);
          deadHeroes.current.delete(heroId);
          return { ...hero, hp: newHp };
        }
        return hero;
      }));
      
      // Return to idle animation after resurrection
      const ref = heroRefs.current.get(heroId);
      if (ref?.current) {
        ref.current.playAnimation('idle');
      }
      
      resurrectionTimeouts.current.delete(heroId);
    }, 60000); // 60 seconds
    
    resurrectionTimeouts.current.set(heroId, timeout);
  };
  // Auto-detect death when HP reaches 0
  useEffect(() => {
    heroes.forEach(hero => {
      if (hero.hp <= 0 && !deadHeroes.current.has(hero.id)) {
        triggerHeroDeath(hero.id);
      } else if (hero.hp > 0 && deadHeroes.current.has(hero.id)) {
        // Hero was resurrected (HP > 0 but was marked as dead)
        deadHeroes.current.delete(hero.id);
        const ref = heroRefs.current.get(hero.id);
        if (ref?.current) {
          ref.current.playAnimation('idle');
        }
      }
    });
  }, [heroes]);
  // Auto-detect enemy death when HP reaches 0
  useEffect(() => {
    enemies.forEach(enemy => {
      if (enemy.hp <= 0 && !deadEnemies.current.has(enemy.id)) {
        triggerEnemyDeath(enemy.id);
      }
    });
    
    // Clean up dead enemies after death animations complete (allows death animation to play)
    const deadEnemiesList = enemies.filter(e => e.hp <= 0);
    if (deadEnemiesList.length > 0 && !isCombatActive()) {
      // Only remove dead enemies if combat is not active (prevents mid-combat removal)
      // Calculate the longest remaining death animation
      const now = Date.now();
      let maxRemainingTime = 0;
      
      deadEnemiesList.forEach(deadEnemy => {
        const deathStartTime = enemyDeathStartTime.current.get(deadEnemy.id);
        if (deathStartTime) {
          const animations = getEnemyAnimations(deadEnemy.name);
          const deathDuration = animations?.death?.duration || 2000;
          const elapsed = now - deathStartTime;
          const remaining = Math.max(0, deathDuration - elapsed);
          maxRemainingTime = Math.max(maxRemainingTime, remaining);
        } else {
          // If no start time recorded, use full duration as fallback
          const animations = getEnemyAnimations(deadEnemy.name);
          const deathDuration = animations?.death?.duration || 2000;
          maxRemainingTime = Math.max(maxRemainingTime, deathDuration);
        }
      });
      
      // Use at least 500ms delay, or the actual remaining animation time
      const delay = Math.max(500, maxRemainingTime);
      
      const cleanupTimeout = setTimeout(() => {
        setEnemies(prev => {
          const alive = prev.filter(e => e.hp > 0);
          const stillDead = prev.filter(e => e.hp <= 0);
          if (stillDead.length > 0) {
            console.log(`[Cleanup] Removing ${stillDead.length} dead enemies after death animations`);
            stillDead.forEach(deadEnemy => {
              enemyRefs.current.delete(deadEnemy.id);
              deadEnemies.current.delete(deadEnemy.id);
              enemyDeathStartTime.current.delete(deadEnemy.id); // Clean up death time tracking
            });
          }
          return alive;
        });
      }, delay);
      
      return () => clearTimeout(cleanupTimeout);
    }
  }, [enemies]);
  // Track previous enemy count for detecting new enemy spawns (used in consolidated auto-start effect)
  const previousEnemyCountRef = useRef<number>(0);
  
  // Sync hero stats to backend database (defined early for use in useEffect hooks)
  // Helper function to show staggered loot SCT (prevents overlapping notifications)
  const showStaggeredLootSCT = useCallback((heroId: string, lootName: string) => {
    const now = Date.now();
    const lastTime = lastLootSCTTime.current.get(heroId) || 0;
    const staggerDelay = 400; // 400ms between loot notifications per hero
    const delay = Math.max(0, staggerDelay - (now - lastTime));
    
    setTimeout(() => {
      showScrollingCombatText(`battle-hero-${heroId}`, `+${lootName}`, 'loot', true);
      lastLootSCTTime.current.set(heroId, Date.now());
    }, delay);
  }, []);

  const syncHeroToBackend = useCallback(async (hero: TestHero) => {
    try {
      // Only sync heroes that have an ID (real heroes from Firebase, not test heroes)
      // Skip test heroes (IDs starting with 'test-') and auto-generated test heroes (IDs starting with 'hero-')
      if (!hero.id || hero.id.startsWith('test-') || hero.id.startsWith('hero-')) {
        return; // Skip test heroes
      }
      
      await heroAPI.updateHero(hero.id, {
        xp: hero.xp,
        level: hero.level,
        maxXp: hero.maxXp,
        gold: hero.gold,
        hp: hero.hp,
        maxHp: hero.maxHp,
        attack: hero.attack,
        defense: hero.defense,
        skillPoints: hero.skillPoints,
        // Include equipment if it exists
        equipment: hero.equipment,
      });
      
      console.log(`[Sync] Synced hero ${hero.name} (${hero.id}) to backend`);
    } catch (error) {
      console.error(`[Sync] Failed to sync hero ${hero.id}:`, error);
    }
  }, []);
  
  // Calculate rested XP for a hero based on time on battlefield (defined early for use in useEffect hooks)
  const calculateRestedXP = useCallback((hero: TestHero): number => {
    const joinTime = heroBattlefieldJoinTime.current.get(hero.id);
    if (!joinTime) return 0;
    
    const timeOnBattlefield = Date.now() - joinTime;
    const hoursOnBattlefield = timeOnBattlefield / (1000 * 60 * 60);
    
    // Grant 1% of max XP per hour (capped at 50% of max XP)
    const restedXpPercent = Math.min(hoursOnBattlefield * 0.01, 0.5);
    return Math.floor((hero.maxXp || 100) * restedXpPercent);
  }, []);
  
  // Periodic sync to backend (every 30 seconds)
  useEffect(() => {
    const syncInterval = setInterval(() => {
      const heroesToSync = heroes.filter(h => h.id && !h.id.startsWith('test-') && !h.id.startsWith('hero-'));
      if (heroesToSync.length > 0) {
        console.log(`[Sync] Periodic sync: syncing ${heroesToSync.length} heroes to backend`);
        Promise.all(heroesToSync.map(hero => syncHeroToBackend(hero))).catch(err => {
          console.error('[Sync] Error in periodic sync:', err);
        });
      }
    }, 30000); // 30 seconds
    
    return () => clearInterval(syncInterval);
  }, [heroes, syncHeroToBackend]);
  
  // Grant rested XP periodically (every 5 minutes)
  useEffect(() => {
    const restedXpInterval = setInterval(() => {
      const heroesOnBattlefield = heroes.filter(h => h.id && !h.id.startsWith('test-') && heroBattlefieldJoinTime.current.has(h.id));
      
      if (heroesOnBattlefield.length > 0) {
        setHeroes(prev => prev.map(hero => {
          if (!hero.id || hero.id.startsWith('test-') || !heroBattlefieldJoinTime.current.has(hero.id)) {
            return hero;
          }
          
          const restedXp = calculateRestedXP(hero);
          if (restedXp > 0) {
            const newXp = (hero.xp || 0) + restedXp;
            
            // Show rested XP SCT
            showScrollingCombatText(
              `battle-hero-${hero.id}`,
              `+${restedXp} Rested XP`,
              'heal',
              true
            );
            
            // Reset join time to prevent double-counting
            heroBattlefieldJoinTime.current.set(hero.id, Date.now());
            
            // Sync to backend
            const updatedHero = { ...hero, xp: newXp };
            syncHeroToBackend(updatedHero).catch(err => {
              console.error(`[Sync] Error syncing hero ${hero.id} after rested XP:`, err);
            });
            
            return updatedHero;
          }
          
          return hero;
        }));
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(restedXpInterval);
  }, [heroes, calculateRestedXP, syncHeroToBackend]);
  
  // Reset combat state when all enemies are defeated
  useEffect(() => {
    if (enemies.length === 0) {
      // Only reset to ended if not already in a valid end state
      const currentState = combatSupervisorRef.current.state;
      if (currentState !== 'ended' && currentState !== 'idle') {
        setCombatState('ended', 'all enemies defeated');
      }
      previousEnemyCountRef.current = 0;
    } else {
      previousEnemyCountRef.current = enemies.length;
    }
  }, [enemies.length]);
  // Adventure Loop: 5-second tick cycle
  useEffect(() => {
    if (!isAdventuring || heroes.length === 0) {
      // Clear interval if not adventuring or no heroes
      if (adventureTickIntervalRef.current) {
        clearInterval(adventureTickIntervalRef.current);
        adventureTickIntervalRef.current = null;
      }
      return;
    }
    // Start adventure tick cycle (5 seconds)
    const TICK_INTERVAL = 5000; // 5 seconds
    
    adventureTickIntervalRef.current = setInterval(() => {
      // 🔥 ATOMIC CHECK: Check supervisor state
      // This prevents race conditions where state changes between checks
      const combatActive = isCombatActive();
      
      // If combat is happening, do NOT spawn or modify enemies
      if (combatActive) {
        const supervisor = combatSupervisorRef.current;
        console.log(`[Adventure] Combat active (state: ${supervisor.state}), skipping tick`);
        return;
      }
      
      const now = Date.now();
      setLastAdventureTick(now);
      setAdventureTickCount(prev => prev + 1);
      // Check if we need to auto-rest (every 5 waves)
      const currentWave = waveCount;
      if (currentWave > 0 && currentWave % 5 === 0) {
        // Auto-rest: Heal all heroes to full HP
        setHeroes(prev => prev.map(hero => ({
          ...hero,
          hp: hero.maxHp,
          shield: 0 // Clear shields on rest
        })));
      }
      // Check if combat is in progress (skip spawning if enemies exist)
      // Also clean up dead enemies to prevent them from blocking new spawns
      setEnemies(currentEnemies => {
        // 🔥 TRIPLE CHECK: Check supervisor state again inside reducer
        // This handles cases where combat started between the interval check and this callback
        const combatActiveNow = isCombatActive();
        
        // If combat is active at ANY point, return unchanged
        if (combatActive || combatActiveNow) {
          const supervisor = combatSupervisorRef.current;
          console.log(`[Adventure] Combat active in reducer (state: ${supervisor.state}), skipping enemy modifications`);
          return currentEnemies; // Return unchanged - don't filter or modify during combat
        }
        
        // Remove dead enemies (hp <= 0) to prevent them from blocking new spawns
        const aliveEnemies = currentEnemies.filter(e => e.hp > 0);
        const deadEnemiesList = currentEnemies.filter(e => e.hp <= 0);
        
        // DEBUG: Log enemy HP values to diagnose false positives
        if (currentEnemies.length > 0) {
          console.log(`[Adventure] Enemy HP check: ${currentEnemies.length} total enemies`);
          currentEnemies.forEach((e, idx) => {
            console.log(`  [${idx}] ${e.name} (id: ${e.id}): hp=${e.hp}, maxHp=${e.maxHp}, hp>0=${e.hp > 0}, typeof hp=${typeof e.hp}`);
          });
          console.log(`[Adventure] Alive: ${aliveEnemies.length}, Dead: ${deadEnemiesList.length}`);
        }
        
        // If there are dead enemies, remove them from the array
        if (deadEnemiesList.length > 0) {
          // Dead enemies are already handled by triggerEnemyDeath, so we can remove them
          const cleanedEnemies = currentEnemies.filter(e => e.hp > 0);
          
          console.log(`[Adventure] Removing ${deadEnemiesList.length} dead enemies, ${cleanedEnemies.length} remain alive`);
          
          // If no alive enemies after cleanup, proceed with encounter (will spawn new ones)
          if (cleanedEnemies.length === 0) {
            // Continue to encounter logic below - will spawn new enemies
            // Don't return here, let it fall through to spawn logic
            console.log(`[Adventure] All enemies dead, proceeding to spawn new ones`);
          } else {
            // Still have alive enemies, return cleaned list
            console.log(`[Adventure] ${cleanedEnemies.length} enemies still alive, returning cleaned list`);
            return cleanedEnemies;
          }
        }
        
        // If enemies alive → no spawn
        if (aliveEnemies.length > 0) {
          return aliveEnemies;
        }
        
        // 🎯 SAFE: Only here do we allow a spawn
        // No alive enemies, proceed with encounter
        // Always spawn combat encounter when enemies are cleared to ensure continuous combat
        // (The adventure loop only runs every 5 seconds, so we want to guarantee enemies spawn)
        const encounterRoll = Math.random();
        
        // Force combat encounters when enemies array is empty (after combat ends)
        // Otherwise use normal 40% chance for variety
        const shouldForceCombat = currentEnemies.length === 0;
        
        if (shouldForceCombat || encounterRoll < 0.4) {
          // Use centralized spawn function to prevent conflicts
          spawnEnemiesForWave('adventure-loop');
          // Return current enemies unchanged - spawn function will update state
          return currentEnemies;
        }
        
        // Not a combat encounter, return unchanged (treasure/peaceful handled below)
        return currentEnemies;
      });
      
      // Handle non-combat encounters (treasure and peaceful travel)
      // Check if we can process these (no alive enemies) - use a separate check
      setEnemies(currentEnemies => {
        // 🔥 TRIPLE CHECK: Check supervisor state again for non-combat encounters
        const combatActiveNow = isCombatActive();
        
        // If combat is active at ANY point, return unchanged
        if (combatActive || combatActiveNow) {
          const supervisor = combatSupervisorRef.current;
          console.log(`[Adventure] Combat active in non-combat reducer (state: ${supervisor.state}), skipping non-combat encounters`);
          return currentEnemies; // Return unchanged during combat
        }
        
        const aliveEnemies = currentEnemies.filter(e => e.hp > 0);
        if (aliveEnemies.length > 0) {
          return currentEnemies; // Still in combat, skip
        }
        
        // Determine encounter type for non-combat (only if no combat encounter happened)
        const encounterRoll = Math.random();
        
        if (encounterRoll >= 0.4 && encounterRoll < 0.7) {
          // 30% chance: Treasure finding
          const travelXp = 3;
          setHeroes(prev => prev.map(hero => {
            if (hero.hp <= 0) return hero; // Dead heroes don't get XP
            
            const newXp = (hero.xp || 0) + travelXp;
            const maxXp = hero.maxXp || 1000;
            
            // Check for level up
            if (newXp >= maxXp) {
              const levelsGained = Math.floor(newXp / maxXp);
              const remainingXp = newXp % maxXp;
              const newLevel = (hero.level || 1) + levelsGained;
              const newMaxXp = Math.floor(1000 * Math.pow(1.15, newLevel - 1));
              
              // Trigger level-up animation
              setLevelingUpHeroes(prev => new Set(prev).add(hero.id));
              
              // Show level-up SCT
              showScrollingCombatText(
                `battle-hero-${hero.id}`,
                'LEVEL UP',
                'levelup',
                true
              );
              
              return {
                ...hero,
                level: newLevel,
                xp: remainingXp,
                maxXp: newMaxXp,
                // Increase stats on level up
                maxHp: Math.floor(hero.maxHp * 1.1),
                hp: Math.floor(hero.maxHp * 1.1), // Full heal on level up
                attack: Math.floor((hero.attack || 100) * 1.1),
                defense: Math.floor((hero.defense || 50) * 1.1),
                skillPoints: (hero.skillPoints || 0) + levelsGained
              };
            }
            
            return {
              ...hero,
              xp: newXp
            };
          }));
          
          // Grant gold from treasure
          const treasureGold = Math.floor(50 + Math.random() * 100);
          setHeroes(prev => prev.map(hero => ({
            ...hero,
            gold: (hero.gold || 0) + treasureGold
          })));
          
          // Profession gathering during treasure encounters
          setHeroes(prev => prev.map(hero => {
            if (hero.hp <= 0 || !hero.profession) return hero;
            
            const profession = hero.profession;
            let gathered = false;
            let gatherMessage = '';
            
            if (profession.type === 'herbalism') {
              // Herbalism: Gather herbs (common 60%, uncommon 30%, rare 8%, epic 2%)
              const herbRoll = Math.random();
              if (herbRoll < 0.6) {
                profession.materials.herbs = profession.materials.herbs || { common: 0, uncommon: 0, rare: 0, epic: 0 };
                profession.materials.herbs.common = (profession.materials.herbs.common || 0) + 1;
                gathered = true;
                gatherMessage = 'Common Herb';
              } else if (herbRoll < 0.9) {
                profession.materials.herbs = profession.materials.herbs || { common: 0, uncommon: 0, rare: 0, epic: 0 };
                profession.materials.herbs.uncommon = (profession.materials.herbs.uncommon || 0) + 1;
                gathered = true;
                gatherMessage = 'Uncommon Herb';
              } else if (herbRoll < 0.98) {
                profession.materials.herbs = profession.materials.herbs || { common: 0, uncommon: 0, rare: 0, epic: 0 };
                profession.materials.herbs.rare = (profession.materials.herbs.rare || 0) + 1;
                gathered = true;
                gatherMessage = 'Rare Herb';
              } else {
                profession.materials.herbs = profession.materials.herbs || { common: 0, uncommon: 0, rare: 0, epic: 0 };
                profession.materials.herbs.epic = (profession.materials.herbs.epic || 0) + 1;
                gathered = true;
                gatherMessage = 'Epic Herb';
              }
              
              // Grant profession XP and check for level-up
              const professionXp = Math.floor(5 + Math.random() * 5);
              profession.totalGathered = (profession.totalGathered || 0) + 1;
              
              // Use helper function to handle XP and level-ups
              const updatedHero = grantProfessionXp(hero, professionXp);
              if (updatedHero.profession) {
                profession.level = updatedHero.profession.level;
                profession.xp = updatedHero.profession.xp;
                profession.maxXp = updatedHero.profession.maxXp;
              }
            } else if (profession.type === 'mining') {
              // Mining: Gather ore (iron 60%, steel 30%, mithril 8%, adamantite 2%)
              const oreRoll = Math.random();
              profession.materials.ore = profession.materials.ore || { iron: 0, steel: 0, mithril: 0, adamantite: 0 };
              
              if (oreRoll < 0.6) {
                profession.materials.ore.iron = (profession.materials.ore.iron || 0) + 1;
                gathered = true;
                gatherMessage = 'Iron Ore';
              } else if (oreRoll < 0.9) {
                profession.materials.ore.steel = (profession.materials.ore.steel || 0) + 1;
                gathered = true;
                gatherMessage = 'Steel Ore';
              } else if (oreRoll < 0.98) {
                profession.materials.ore.mithril = (profession.materials.ore.mithril || 0) + 1;
                gathered = true;
                gatherMessage = 'Mithril Ore';
              } else {
                profession.materials.ore.adamantite = (profession.materials.ore.adamantite || 0) + 1;
                gathered = true;
                gatherMessage = 'Adamantite Ore';
              }
              
              // Grant profession XP and check for level-up
              const professionXp = Math.floor(5 + Math.random() * 5);
              profession.totalGathered = (profession.totalGathered || 0) + 1;
              
              // Use helper function to handle XP and level-ups
              const updatedHero = grantProfessionXp(hero, professionXp);
              if (updatedHero.profession) {
                profession.level = updatedHero.profession.level;
                profession.xp = updatedHero.profession.xp;
                profession.maxXp = updatedHero.profession.maxXp;
              }
            }
            
            if (gathered) {
              showScrollingCombatText(
                `battle-hero-${hero.id}`,
                `+${gatherMessage}`,
                'loot',
                true
              );
            }
            
            return {
              ...hero,
              profession: { ...profession }
            };
          }));
          
        } else if (encounterRoll >= 0.7) {
          // 30% chance: Peaceful travel
          isTraveling.current = true;
          const travelXp = 3;
          
          // Trigger walk/run animations for all alive heroes
          setTimeout(() => {
            setHeroes(prev => {
              prev.forEach(hero => {
                if (hero.hp > 0) {
                  const ref = heroRefs.current.get(hero.id);
                  if (ref?.current) {
                    // Check which animations are available based on hero role
                    // Melee DPS (Dwarf Warrior) have "run", others have "walk"
                    const meleeDpsRoles = ['berserker', 'crusader', 'assassin', 'reaper', 'bladedancer', 'monk', 'stormwarrior', 'hunter'];
                    const heroRole = (hero.role || '').toLowerCase().trim();
                    const isMeleeDps = heroRole && meleeDpsRoles.includes(heroRole);
                    
                    if (isMeleeDps) {
                      // Melee DPS use "run" animation
                      ref.current.playAnimation('run');
                    } else if (heroRole) {
                      // Tanks, Healers, and Casters use "walk" animation
                      ref.current.playAnimation('walk');
                    }
                    // If no role, don't change animation (keep current)
                  }
                }
              });
              return prev; // Return unchanged state
            });
          }, 100);
          
          // Reset to idle after travel animation duration (5 seconds)
          setTimeout(() => {
            isTraveling.current = false;
            setHeroes(prev => {
              prev.forEach(hero => {
                if (hero.hp > 0) {
                  const ref = heroRefs.current.get(hero.id);
                  if (ref?.current) {
                    ref.current.playAnimation('idle');
                  }
                }
              });
              return prev; // Return unchanged state
            });
          }, 5000);
          
          setHeroes(prev => prev.map(hero => {
            if (hero.hp <= 0) return hero; // Dead heroes don't get XP
            
            const newXp = (hero.xp || 0) + travelXp;
            const maxXp = hero.maxXp || 1000;
            
            // Check for level up
            if (newXp >= maxXp) {
              const levelsGained = Math.floor(newXp / maxXp);
              const remainingXp = newXp % maxXp;
              const newLevel = (hero.level || 1) + levelsGained;
              const newMaxXp = Math.floor(1000 * Math.pow(1.15, newLevel - 1));
              
              // Trigger level-up animation
              setLevelingUpHeroes(prev => new Set(prev).add(hero.id));
              
              // Show level-up SCT
              showScrollingCombatText(
                `battle-hero-${hero.id}`,
                'LEVEL UP',
                'levelup',
                true
              );
              
              return {
                ...hero,
                level: newLevel,
                xp: remainingXp,
                maxXp: newMaxXp,
                // Increase stats on level up
                maxHp: Math.floor(hero.maxHp * 1.1),
                hp: Math.floor(hero.maxHp * 1.1), // Full heal on level up
                attack: Math.floor((hero.attack || 100) * 1.1),
                defense: Math.floor((hero.defense || 50) * 1.1),
                skillPoints: (hero.skillPoints || 0) + levelsGained
              };
            }
            
            return {
              ...hero,
              xp: newXp
            };
          }));
          
          // Profession gathering during peaceful travel
          setHeroes(prev => prev.map(hero => {
            if (hero.hp <= 0 || !hero.profession) return hero;
            
            const profession = hero.profession;
            let gathered = false;
            let gatherMessage = '';
            
            if (profession.type === 'herbalism') {
              // Herbalism: Gather herbs (common 60%, uncommon 30%, rare 8%, epic 2%)
              const herbRoll = Math.random();
              if (herbRoll < 0.6) {
                profession.materials.herbs = profession.materials.herbs || { common: 0, uncommon: 0, rare: 0, epic: 0 };
                profession.materials.herbs.common = (profession.materials.herbs.common || 0) + 1;
                gathered = true;
                gatherMessage = 'Common Herb';
              } else if (herbRoll < 0.9) {
                profession.materials.herbs = profession.materials.herbs || { common: 0, uncommon: 0, rare: 0, epic: 0 };
                profession.materials.herbs.uncommon = (profession.materials.herbs.uncommon || 0) + 1;
                gathered = true;
                gatherMessage = 'Uncommon Herb';
              } else if (herbRoll < 0.98) {
                profession.materials.herbs = profession.materials.herbs || { common: 0, uncommon: 0, rare: 0, epic: 0 };
                profession.materials.herbs.rare = (profession.materials.herbs.rare || 0) + 1;
                gathered = true;
                gatherMessage = 'Rare Herb';
              } else {
                profession.materials.herbs = profession.materials.herbs || { common: 0, uncommon: 0, rare: 0, epic: 0 };
                profession.materials.herbs.epic = (profession.materials.herbs.epic || 0) + 1;
                gathered = true;
                gatherMessage = 'Epic Herb';
              }
              
              // Grant profession XP and check for level-up
              const professionXp = Math.floor(5 + Math.random() * 5);
              profession.totalGathered = (profession.totalGathered || 0) + 1;
              
              // Use helper function to handle XP and level-ups
              const updatedHero = grantProfessionXp(hero, professionXp);
              if (updatedHero.profession) {
                profession.level = updatedHero.profession.level;
                profession.xp = updatedHero.profession.xp;
                profession.maxXp = updatedHero.profession.maxXp;
              }
            } else if (profession.type === 'mining') {
              // Mining: Gather ore (iron 60%, steel 30%, mithril 8%, adamantite 2%)
              const oreRoll = Math.random();
              profession.materials.ore = profession.materials.ore || { iron: 0, steel: 0, mithril: 0, adamantite: 0 };
              
              if (oreRoll < 0.6) {
                profession.materials.ore.iron = (profession.materials.ore.iron || 0) + 1;
                gathered = true;
                gatherMessage = 'Iron Ore';
              } else if (oreRoll < 0.9) {
                profession.materials.ore.steel = (profession.materials.ore.steel || 0) + 1;
                gathered = true;
                gatherMessage = 'Steel Ore';
              } else if (oreRoll < 0.98) {
                profession.materials.ore.mithril = (profession.materials.ore.mithril || 0) + 1;
                gathered = true;
                gatherMessage = 'Mithril Ore';
              } else {
                profession.materials.ore.adamantite = (profession.materials.ore.adamantite || 0) + 1;
                gathered = true;
                gatherMessage = 'Adamantite Ore';
              }
              
              // Grant profession XP and check for level-up
              const professionXp = Math.floor(5 + Math.random() * 5);
              profession.totalGathered = (profession.totalGathered || 0) + 1;
              
              // Use helper function to handle XP and level-ups
              const updatedHero = grantProfessionXp(hero, professionXp);
              if (updatedHero.profession) {
                profession.level = updatedHero.profession.level;
                profession.xp = updatedHero.profession.xp;
                profession.maxXp = updatedHero.profession.maxXp;
              }
            }
            
            if (gathered) {
              showScrollingCombatText(
                `battle-hero-${hero.id}`,
                `+${gatherMessage}`,
                'loot',
                true
              );
            }
            
            return {
              ...hero,
              profession: { ...profession }
            };
          }));
          
          // Process auto-buy during travel
          if (autoBuyEnabled) {
            setHeroes(prev => prev.map(hero => processAutoBuy(hero)));
          }
          
        }
        
        // Process auto-buy during combat encounters too (for health potions)
        if (autoBuyEnabled) {
          setHeroes(prev => prev.map(hero => processAutoBuy(hero)));
        }
        
        return currentEnemies; // Enemies unchanged for non-combat encounters
      });
    }, TICK_INTERVAL);
    // Cleanup on unmount or when isAdventuring changes
    return () => {
      if (adventureTickIntervalRef.current) {
        clearInterval(adventureTickIntervalRef.current);
        adventureTickIntervalRef.current = null;
      }
    };
  }, [isAdventuring, heroes, waveCount, enemies.length, spawnEnemiesForWave]);
  // Token idle earning system (runs every minute)
  useEffect(() => {
    if (heroes.length === 0) return;
    const interval = setInterval(() => {
      setHeroes(prev => prev.map(hero => {
        // Calculate idle tokens (but don't auto-claim, just track)
        // Tokens are claimed manually via command in Twitch chat
        // This is just for display purposes in the battleground
        return hero; // Tokens are earned passively, no state update needed here
      }));
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [heroes.length]);
  // Trigger Demon Lord transition sequence when enemy is added (only once per enemy)
  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];
    
    enemies.forEach(enemy => {
      if (enemy.name === 'Demon Lord' && 
          !demonLordFlying.current.has(enemy.id) && 
          !demonLordTransitionStarted.current.has(enemy.id)) {
        // Mark that we've started the transition for this enemy
        demonLordTransitionStarted.current.add(enemy.id);
        
        // Clear any existing timeout for this enemy
        const existingTimeout = demonLordTransitionTimeouts.current.get(enemy.id);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }
        
        // Wait for ref to be available, with retries
        const tryStartTransition = (attempts = 0) => {
          const currentRef = enemyRefs.current.get(enemy.id);
          if (currentRef?.current && !demonLordFlying.current.has(enemy.id)) {
            // Play transition animation (3 frames, 360ms)
            currentRef.current.playAnimation('transition');
            
            // After transition completes, switch to flying
            const flyingTimeoutId = setTimeout(() => {
              const finalRef = enemyRefs.current.get(enemy.id);
              if (finalRef?.current && !demonLordFlying.current.has(enemy.id)) {
                finalRef.current.playAnimation('flying');
                demonLordFlying.current.add(enemy.id);
                demonLordTransitionTimeouts.current.delete(enemy.id);
                // Trigger re-render to update health bar position
                setEnemies(prev => prev);
              }
            }, 360); // Transition duration (3 frames * 120ms = 360ms)
            
            demonLordTransitionTimeouts.current.set(enemy.id, flyingTimeoutId as any);
            timeouts.push(flyingTimeoutId as any);
          } else if (attempts < 10) {
            // Retry after a short delay if ref isn't ready yet
            const retryTimeoutId = setTimeout(() => tryStartTransition(attempts + 1), 100);
            timeouts.push(retryTimeoutId as any);
          } else {
          }
        };
        
        // Start trying after a small initial delay
        const timeoutId = setTimeout(() => tryStartTransition(), 500);
        demonLordTransitionTimeouts.current.set(enemy.id, timeoutId as any);
        timeouts.push(timeoutId as any);
      }
    });
    
    // Cleanup: clear all timeouts when effect re-runs or component unmounts
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
      // Also clean up timeouts for enemies that no longer exist
      const currentEnemyIds = new Set(enemies.map(e => e.id));
      demonLordTransitionTimeouts.current.forEach((timeout, enemyId) => {
        if (!currentEnemyIds.has(enemyId)) {
          clearTimeout(timeout);
          demonLordTransitionTimeouts.current.delete(enemyId);
        }
      });
    };
  }, [enemies]);
  // Auto-update buff/debuff durations (countdown)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now(); // Define once for both heroes and enemies
      
      // Update hero buffs/debuffs
      setHeroes(prev => prev.map(hero => {
        let updated = false;
        const newBuffs = { ...hero.activeBuffs };
        const newDebuffs = { ...hero.activeDebuffs };
        
        // Sync enrage buff with classAbilityState
        if (hero.classAbilityState?.enrageActive && hero.classAbilityState.enrageExpiry) {
          const timeRemaining = Math.max(0, hero.classAbilityState.enrageExpiry - now);
          if (timeRemaining > 0) {
            // Update or create enrage buff
            newBuffs.enrage = {
              name: 'Enrage',
              icon: '⚔️💥',
              color: '#dc2626',
              remainingDuration: timeRemaining,
              value: 40
            };
            updated = true;
          } else {
            // Enrage expired - remove buff and clear state
            if (newBuffs.enrage) {
              delete newBuffs.enrage;
              updated = true;
            }
            if (hero.classAbilityState) {
              hero.classAbilityState.enrageActive = false;
            }
          }
        } else if (newBuffs.enrage) {
          // Enrage buff exists but state says it's not active - remove it
          delete newBuffs.enrage;
          updated = true;
        }
        
        // Sync Last Stand buff with classAbilityState (only for tanks)
        const tankRoles = ['guardian', 'paladin', 'warden', 'bloodknight', 'vanguard', 'brewmaster'];
        const isTank = tankRoles.includes(hero.role.toLowerCase());
        
        if (isTank && hero.classAbilityState?.lastStandActive && hero.classAbilityState.lastStandExpiry) {
          const timeRemaining = Math.max(0, hero.classAbilityState.lastStandExpiry - now);
          if (timeRemaining > 0) {
            // Update or create Last Stand buff
            newBuffs.lastStand = {
              name: 'Last Stand',
              icon: '🛡️💥',
              color: '#fbbf24',
              remainingDuration: timeRemaining,
              value: 75
            };
            updated = true;
          } else {
            // Last Stand expired - remove buff and clear state
            if (newBuffs.lastStand) {
              delete newBuffs.lastStand;
              updated = true;
            }
            if (hero.classAbilityState) {
              hero.classAbilityState.lastStandActive = false;
            }
          }
        } else if (newBuffs.lastStand) {
          // Last Stand buff exists but hero is not a tank or state says it's not active - remove it
          delete newBuffs.lastStand;
          updated = true;
          // Also clear the state if it exists
          if (hero.classAbilityState) {
            hero.classAbilityState.lastStandActive = false;
          }
        }
        
        // Sync Monk combo count (only for monks)
        if (hero.role.toLowerCase() === 'monk' && hero.classAbilityState?.comboCount !== undefined) {
          const comboCount = hero.classAbilityState.comboCount;
          if (comboCount > 0) {
            newBuffs.comboCount = {
              name: `Combo: ${comboCount}/5`,
              icon: '🥋',
              color: '#10b981',
              remainingDuration: Infinity, // Permanent until reset
              value: comboCount
            };
            updated = true;
          } else if (newBuffs.comboCount) {
            delete newBuffs.comboCount;
            updated = true;
          }
        } else if (newBuffs.comboCount && hero.role.toLowerCase() !== 'monk') {
          // Remove comboCount buff if hero is not a monk
          delete newBuffs.comboCount;
          updated = true;
        }
        
        // Sync Mage elemental rotation (only for mages)
        if (hero.role.toLowerCase() === 'mage' && hero.classAbilityState?.elementRotation !== undefined) {
          const rotation = hero.classAbilityState.elementRotation;
          let elementName = '';
          let elementIcon = '';
          let elementColor = '';
          
          if (rotation === 0) {
            elementName = 'Fire';
            elementIcon = '🔥';
            elementColor = '#ef4444';
          } else if (rotation === 1) {
            elementName = 'Frost';
            elementIcon = '❄️';
            elementColor = '#3b82f6';
          } else {
            elementName = 'Arcane';
            elementIcon = '✨';
            elementColor = '#9333ea';
          }
          
          newBuffs.currentElement = {
            name: elementName,
            icon: elementIcon,
            color: elementColor,
            remainingDuration: Infinity, // Permanent until next attack
            value: rotation
          };
          updated = true;
        } else if (newBuffs.currentElement && hero.role.toLowerCase() !== 'mage') {
          // Remove currentElement buff if hero is not a mage
          delete newBuffs.currentElement;
          updated = true;
        }
        
        Object.keys(newBuffs || {}).forEach(key => {
          if (key === 'enrage' || key === 'lastStand' || key === 'comboCount' || key === 'currentElement') return; // Already handled above
          if (newBuffs[key]?.remainingDuration > 0 && newBuffs[key].remainingDuration !== Infinity) {
            newBuffs[key] = {
              ...newBuffs[key],
              remainingDuration: Math.max(0, newBuffs[key].remainingDuration - 100)
            };
            updated = true;
            if (newBuffs[key].remainingDuration <= 0) {
              delete newBuffs[key];
            }
          }
        });
        
        // Calculate equipment-based HP regeneration from all equipment slots
        const equipmentHpRegen = getEquipmentHpRegen(hero.equipment);
        
        // Process equipment-based HP regeneration (every 5 seconds)
        const equipmentRegenTickRate = 5000; // 5 seconds
        let equipmentRegenHealing = 0;
        
        if (equipmentHpRegen > 0 && hero.hp > 0) {
          // Get or initialize last equipment regen tick time
          const lastEquipmentRegenTick = hero.lastEquipmentRegenTick || 0;
          const timeSinceLastTick = now - lastEquipmentRegenTick;
          
          if (timeSinceLastTick >= equipmentRegenTickRate || lastEquipmentRegenTick === 0) {
            // Calculate healing: hpRegen is HP per second, so multiply by tick rate (5 seconds)
            equipmentRegenHealing = equipmentHpRegen * (equipmentRegenTickRate / 1000); // e.g., 5 HP/sec * 5 = 25 HP per tick
            // Update last tick time (will be stored in state update)
            updated = true;
          }
        }
        
        // Process HoT ticks (Heal over Time from buffs)
        let totalHotHealing = 0;
        const hotMessages: string[] = [];
        const hotTickRate = 2000; // 2 seconds
        
        Object.keys(newBuffs || {}).forEach(key => {
          const buff = newBuffs[key];
          if (!buff) return;
          
          // Find buff definition
          const buffDef = Object.values(BUFF_TYPES).find(b => b.name === buff.name);
          
          // Process HoT healing (every 2 seconds)
          if (buffDef?.effect === 'healOverTime') {
            // Initialize lastTickTime if not set (first tick)
            if (!buff.lastTickTime) {
              buff.lastTickTime = now - hotTickRate; // Set to allow immediate first tick
            }
            
            const timeSinceLastTick = now - buff.lastTickTime;
            
            if (timeSinceLastTick >= hotTickRate) {
              // Accumulate HoT healing
              const hotHealing = buffDef.value || buff.value || 0;
              if (hotHealing > 0) {
                totalHotHealing += hotHealing;
                hotMessages.push(`${hotHealing} ${buffDef.name}`);
              }
              
              // Update last tick time for this specific buff
              buff.lastTickTime = now;
              updated = true;
            }
          }
        });
        
        // Combine equipment regen with buff-based HoT
        const totalHealing = totalHotHealing + equipmentRegenHealing;
        
        // Apply all accumulated HoT healing at once (from buffs + equipment)
        // If at full HP, HoT converts to shield (cool mechanic!)
        if (totalHealing > 0 && hero.hp > 0) {
          const missingHp = hero.maxHp - hero.hp;
          let newHp = hero.hp;
          let newShield = hero.shield || 0;
          
          if (missingHp > 0) {
            // Heal HP first
            const hpHealed = Math.min(totalHealing, missingHp);
            newHp = hero.hp + hpHealed;
            const excessHealing = totalHealing - hpHealed;
            
            // Excess healing converts to shield
            if (excessHealing > 0) {
              newShield = (hero.shield || 0) + excessHealing;
            }
          } else {
            // Already at full HP, all HoT healing becomes shield
            newShield = (hero.shield || 0) + totalHealing;
          }
          
          // Show HoT combat text (light green)
          showScrollingCombatText(`battle-hero-${hero.id}`, totalHealing, 'heal-hot', true);
          
          // Update HP and shield, and store last equipment regen tick time
          setHeroes(prev => prev.map(h => {
            if (h.id === hero.id) {
              const updatedHero = { ...h, hp: newHp, shield: newShield };
              // Store last equipment regen tick time for next tick
              if (equipmentRegenHealing > 0) {
                updatedHero.lastEquipmentRegenTick = now;
              }
              return updatedHero;
            }
            return h;
          }));
          
          const healingSources: string[] = [];
          if (totalHotHealing > 0) hotMessages.forEach(m => healingSources.push(m));
          if (equipmentRegenHealing > 0) healingSources.push(`${equipmentHpRegen} HP/sec (Equipment)`);
          
          const healingType = missingHp > 0 ? 'heals' : 'gains shield from';
        }
        
        // Process DoT ticks and update debuff durations
        // First pass: accumulate all DoT damage and check tick times
        let totalDotDamage = 0;
        const dotMessages: string[] = [];
        const tickRate = 2000; // 2 seconds
        
        Object.keys(newDebuffs || {}).forEach(key => {
          const debuff = newDebuffs[key];
          if (!debuff) return;
          
          // Find debuff definition
          const debuffDef = Object.values(DEBUFF_TYPES).find(d => d.name === debuff.name);
          
          // Process DoT damage (every 2 seconds)
          if (debuffDef?.effect === 'damageOverTime') {
            // Initialize lastTickTime if not set (first tick)
            if (!debuff.lastTickTime) {
              debuff.lastTickTime = now - tickRate; // Set to allow immediate first tick
            }
            
            const timeSinceLastTick = now - debuff.lastTickTime;
            
            if (timeSinceLastTick >= tickRate) {
              // Accumulate DoT damage (all DoTs tick simultaneously)
              const dotDamage = debuffDef.value || debuff.value || 0;
              if (dotDamage > 0) {
                totalDotDamage += dotDamage;
                dotMessages.push(`${dotDamage} ${debuffDef.name}`);
              }
              
              // Update last tick time for this specific debuff
              debuff.lastTickTime = now;
              updated = true;
            }
          }
          
          // Update debuff duration
          if (debuff.remainingDuration > 0) {
            newDebuffs[key] = {
              ...debuff,
              remainingDuration: Math.max(0, debuff.remainingDuration - 100)
            };
            updated = true;
            if (newDebuffs[key].remainingDuration <= 0) {
              delete newDebuffs[key];
            }
          }
        });
        
        // Apply all accumulated DoT damage at once (all DoTs stack)
        if (totalDotDamage > 0 && hero.hp > 0) {
          const newHp = Math.max(0, hero.hp - totalDotDamage);
          // Show DoT combat text for total damage
          showScrollingCombatText(`battle-hero-${hero.id}`, totalDotDamage, 'dot', true);
          // Update HP once with all DoT damage
          setHeroes(prev => prev.map(h => {
            if (h.id === hero.id) {
              return { ...h, hp: newHp };
            }
            return h;
          }));
        }
        
        return updated ? { ...hero, activeBuffs: newBuffs, activeDebuffs: newDebuffs, classAbilityState: hero.classAbilityState ? { ...hero.classAbilityState } : undefined, lastDotTickTime: now } : hero;
      }));
      
      // Update enemy buffs/debuffs
      setEnemies(prev => prev.map(enemy => {
        let updated = false;
        const newBuffs = { ...enemy.activeBuffs };
        const newDebuffs = { ...enemy.activeDebuffs };
        
        // Process HoT ticks (Heal over Time)
        let totalHotHealing = 0;
        const hotMessages: string[] = [];
        const hotTickRate = 2000; // 2 seconds
        
        Object.keys(newBuffs || {}).forEach(key => {
          const buff = newBuffs[key];
          if (!buff) return;
          
          // Find buff definition
          const buffDef = Object.values(BUFF_TYPES).find(b => b.name === buff.name);
          
          // Process HoT healing (every 2 seconds)
          if (buffDef?.effect === 'healOverTime') {
            // Initialize lastTickTime if not set (first tick)
            if (!buff.lastTickTime) {
              buff.lastTickTime = now - hotTickRate; // Set to allow immediate first tick
            }
            
            const timeSinceLastTick = now - buff.lastTickTime;
            
            if (timeSinceLastTick >= hotTickRate) {
              // Accumulate HoT healing
              const hotHealing = buffDef.value || buff.value || 0;
              if (hotHealing > 0) {
                totalHotHealing += hotHealing;
                hotMessages.push(`${hotHealing} ${buffDef.name}`);
              }
              
              // Update last tick time for this specific buff
              buff.lastTickTime = now;
              updated = true;
            }
          }
        });
        
        // Apply all accumulated HoT healing at once
        // If at full HP, HoT converts to shield (cool mechanic!)
        if (totalHotHealing > 0 && enemy.hp > 0) {
          const missingHp = enemy.maxHp - enemy.hp;
          let newHp = enemy.hp;
          let newShield = enemy.shield || 0;
          
          if (missingHp > 0) {
            // Heal HP first
            const hpHealed = Math.min(totalHotHealing, missingHp);
            newHp = enemy.hp + hpHealed;
            const excessHealing = totalHotHealing - hpHealed;
            
            // Excess healing converts to shield
            if (excessHealing > 0) {
              newShield = (enemy.shield || 0) + excessHealing;
            }
          } else {
            // Already at full HP, all HoT healing becomes shield
            newShield = (enemy.shield || 0) + totalHotHealing;
          }
          
          // Show HoT combat text (light green)
          showScrollingCombatText(`battle-enemy-${enemy.id}`, totalHotHealing, 'heal-hot', false);
          
          // Update HP and shield
          setEnemies(prev => prev.map(e => {
            if (e.id === enemy.id) {
              return { ...e, hp: newHp, shield: newShield };
            }
            return e;
          }));
          
          const healingType = missingHp > 0 ? 'heals' : 'gains shield from';
        }
        
        Object.keys(newBuffs || {}).forEach(key => {
          if (newBuffs[key]?.remainingDuration > 0) {
            newBuffs[key] = {
              ...newBuffs[key],
              remainingDuration: Math.max(0, newBuffs[key].remainingDuration - 100)
            };
            updated = true;
            if (newBuffs[key].remainingDuration <= 0) {
              delete newBuffs[key];
            }
          }
        });
        
        // Process DoT ticks and update debuff durations
        // First pass: accumulate all DoT damage and check tick times
        let totalDotDamage = 0;
        const dotMessages: string[] = [];
        const tickRate = 2000; // 2 seconds
        
        Object.keys(newDebuffs || {}).forEach(key => {
          const debuff = newDebuffs[key];
          if (!debuff) return;
          
          // Find debuff definition
          const debuffDef = Object.values(DEBUFF_TYPES).find(d => d.name === debuff.name);
          
          // Process DoT damage (every 2 seconds)
          if (debuffDef?.effect === 'damageOverTime') {
            // Initialize lastTickTime if not set (first tick)
            if (!debuff.lastTickTime) {
              debuff.lastTickTime = now - tickRate; // Set to allow immediate first tick
            }
            
            const timeSinceLastTick = now - debuff.lastTickTime;
            
            if (timeSinceLastTick >= tickRate) {
              // Accumulate DoT damage (all DoTs tick simultaneously)
              const dotDamage = debuffDef.value || debuff.value || 0;
              if (dotDamage > 0) {
                totalDotDamage += dotDamage;
                dotMessages.push(`${dotDamage} ${debuffDef.name}`);
              }
              
              // Update last tick time for this specific debuff
              debuff.lastTickTime = now;
              updated = true;
            }
          }
          
          // Update debuff duration
          if (debuff.remainingDuration > 0) {
            newDebuffs[key] = {
              ...debuff,
              remainingDuration: Math.max(0, debuff.remainingDuration - 100)
            };
            updated = true;
            if (newDebuffs[key].remainingDuration <= 0) {
              delete newDebuffs[key];
            }
          }
        });
        
        // Apply all accumulated DoT damage at once (all DoTs stack)
        if (totalDotDamage > 0 && enemy.hp > 0) {
          const newHp = Math.max(0, enemy.hp - totalDotDamage);
          // Show DoT combat text for total damage
          showScrollingCombatText(`battle-enemy-${enemy.id}`, totalDotDamage, 'dot', false);
          // Update HP once with all DoT damage
          setEnemies(prev => prev.map(e => {
            if (e.id === enemy.id) {
              return { ...e, hp: newHp };
            }
            return e;
          }));
        }
        
        return updated ? { ...enemy, activeBuffs: newBuffs, activeDebuffs: newDebuffs, lastDotTickTime: now } : enemy;
      }));
    }, 100); // Update every 100ms
    
    return () => clearInterval(interval);
  }, []);
  // Test enemy attack animation
  const testEnemyAttack = (enemyId: string) => {
    const ref = enemyRefs.current.get(enemyId);
    if (ref?.current) {
      const enemy = enemies.find(e => e.id === enemyId);
      // For Gryphon, randomly choose between attack and attack2
      if (enemy?.name === 'Gryphon') {
        const useAttack2 = Math.random() < 0.5; // 50% chance for each attack
        ref.current.playAnimation(useAttack2 ? 'attack2' : 'attack');
      } else {
      ref.current.playAnimation('attack');
      }
    }
  };
  // Test enemy projectile (for Baby Dragon, Witch, etc.)
  const testEnemyProjectile = (enemyId: string, heroId: string) => {
    const enemy = enemies.find(e => e.id === enemyId);
    const hero = heroes.find(h => h.id === heroId);
    if (!enemy || !hero) return;
    const enemyElement = document.querySelector(`#battle-enemy-${enemyId}`);
    const heroElement = document.querySelector(`#battle-hero-${heroId}`);
    
    if (enemyElement && heroElement) {
      // First, play the attack animation
      testEnemyAttack(enemyId);
      
      // Wait for attack animation to reach mid-point before firing projectile
      const attackDelay = 400; // Fire projectile mid-attack animation
      
      setTimeout(() => {
        // Fire projectile after attack animation starts
        createProjectile(
          enemyElement as HTMLElement,
          heroElement as HTMLElement,
          enemy.name, // Pass enemy name
          'projectile', // Use horizontal projectile by default
          () => {
            testHeroHurt(heroId);
            showScrollingCombatText(`battle-hero-${heroId}`, 100, 'damage', true);
          },
          false // isHero = false
        );
      }, attackDelay);
    }
  };
  // Test enemy hurt animation (hero attacking enemy)
  const testEnemyHurt = (enemyId: string, attackerHeroId?: string) => {
    const enemy = enemies.find(e => e.id === enemyId);
    const ref = enemyRefs.current.get(enemyId);
    
    // For Werewolf in human form, transform when hurt
    if (enemy?.name === 'Werewolf' && !werewolfTransformed.current.has(enemyId) && ref?.current) {
      ref.current.playAnimation('transformation');
      werewolfTransformed.current.add(enemyId);
    } else if (ref?.current) {
      ref.current.playAnimation('hurt');
    }
    
    // Apply damage with smooth health bar animation
    if (enemy) {
      // If attacker is specified, use their stats for crit calculation
      let baseDamage: number;
      let critChance = 0;
      
      if (attackerHeroId) {
        const attacker = heroes.find(h => h.id === attackerHeroId);
        if (attacker) {
          baseDamage = attacker.attack || 200;
          critChance = attacker.critChance || 0;
        } else {
          baseDamage = enemy.attack || Math.floor(enemy.maxHp * 0.1);
        }
      } else {
        // Default damage for testing (use first hero's stats if available)
        const firstHero = heroes[0];
        if (firstHero) {
          baseDamage = firstHero.attack || 200;
          critChance = firstHero.critChance || 0;
        } else {
          baseDamage = enemy.attack || Math.floor(enemy.maxHp * 0.1);
        }
      }
      
      const enemyDefense = enemy.defense || 0;
      
      // Calculate damage with crit chance and debuff modifiers
      const attacker = attackerHeroId ? heroes.find(h => h.id === attackerHeroId) : undefined;
      const { actualDamage, isCrit } = calculateDamageWithCrit(
        baseDamage, 
        critChance, 
        enemyDefense,
        attacker?.activeDebuffs,
        enemy.activeDebuffs,
        attacker?.activeBuffs,
        enemy.activeBuffs,
        attacker?.equipment,
        enemy.equipment
      );
      
      setEnemies(prev => prev.map(e => {
        if (e.id === enemyId) {
          // Safety check: if hp is NaN or invalid, use maxHp as fallback
          const currentHp = (typeof e.hp === 'number' && !isNaN(e.hp)) ? e.hp : (e.maxHp || 0);
          const updatedEnemy = {
            ...e,
            hp: Math.max(0, currentHp - actualDamage)
          };
          
          // Check for raid boss mechanics after damage
          if (activeRaid && raidData && updatedEnemy.name === raidData.boss.name) {
            // Use setTimeout to check mechanics after state update
            setTimeout(() => {
              checkRaidBossMechanics(e.id);
            }, 100);
          }
          
          return updatedEnemy;
        }
        return e;
      }));
      
      // Track quest progress: Damage dealt
      if (attackerHeroId && questTrackerRef.current) {
        const currentDamage = totalDamageDealt.current.get(attackerHeroId) || 0;
        totalDamageDealt.current.set(attackerHeroId, currentDamage + actualDamage);
        questTrackerRef.current.track('dealDamage', actualDamage, 'daily');
        questTrackerRef.current.track('dealDamage', actualDamage, 'weekly');
        questTrackerRef.current.track('dealDamage', actualDamage, 'monthly');
      }
      
      // Show combat text (gold for crits, red for normal)
      showScrollingCombatText(`battle-enemy-${enemyId}`, actualDamage, isCrit ? 'crit' : 'damage', false);
    }
  };
  // Trigger enemy death (called when HP reaches 0)
  // Level up hero (handles stat increases and XP reset)
  const levelUpHero = (heroId: string) => {
    // Trigger level-up animation
    setLevelingUpHeroes(prev => new Set(prev).add(heroId));
    
    setHeroes(prev => prev.map(hero => {
      if (hero.id !== heroId) return hero;
      
      const oldLevel = hero.level;
      const newLevel = oldLevel + 1;
      
      // Reset XP and increase max XP (50% increase per level)
      const newMaxXp = Math.floor((hero.maxXp || 100) * 1.5);
      
      // Maintain HP ratio when leveling up
      const hpRatio = hero.hp / hero.maxHp;
      
      // Recalculate stats based on new level (simplified - in full game, this uses getCharacterStats)
      // For now, just increase stats by a percentage
      const levelStatIncrease = 1.05; // 5% stat increase per level
      const newMaxHp = Math.floor(hero.maxHp * levelStatIncrease);
      const newAttack = Math.floor((hero.attack || 200) * levelStatIncrease);
      const newDefense = Math.floor((hero.defense || 100) * levelStatIncrease);
      
      
      // Grant 1 skill point per level-up
      const newSkillPoints = (hero.skillPoints || 0) + 1;
      
      const updatedHero = {
        ...hero,
        level: newLevel,
        xp: 0,
        maxXp: newMaxXp,
        maxHp: newMaxHp,
        hp: Math.floor(newMaxHp * hpRatio),
        attack: newAttack,
        defense: newDefense,
        skillPoints: newSkillPoints
      };
      
      // Sync level-up to backend
      syncHeroToBackend(updatedHero).catch(err => {
        console.error(`[Sync] Error syncing hero ${heroId} after level-up:`, err);
      });
      
      return updatedHero;
    }));
  };
  // Distribute XP from enemy kill to all heroes
  // Helper function to grant profession XP and handle level-ups
  // Auto-buy system: Purchase shop items automatically
  const processAutoBuy = (hero: TestHero): TestHero => {
    if (!autoBuyEnabled || hero.hp <= 0) return hero;
    
    let updatedHero = { ...hero };
    const gold = updatedHero.gold || 0;
    
    // Priority order: Health Potion (if HP < 30%), then buffs
    // 1. Health Potion (10g) - Auto-use when HP < 30%
    if (gold >= 10 && updatedHero.hp < updatedHero.maxHp * 0.3) {
      // Check if hero already has a health potion (we'll track this in inventory or just auto-buy and use)
      // For now, we'll just buy and use immediately
      updatedHero.gold = gold - 10;
      const healAmount = Math.floor(updatedHero.maxHp * 0.5); // Heal 50% HP
      updatedHero.hp = Math.min(updatedHero.hp + healAmount, updatedHero.maxHp);
      
      showScrollingCombatText(
        `battle-hero-${updatedHero.id}`,
        'Health Potion',
        'heal',
        true
      );
      
    }
    
    // 2. XP Boost Scroll (25g) - Buy if no active XP boost
    if (gold >= 25 && !updatedHero.activeBuffs?.['xpBoost']) {
      updatedHero.gold = gold - 25;
      updatedHero.activeBuffs = {
        ...updatedHero.activeBuffs,
        xpBoost: {
          name: 'XP Boost',
          icon: '📜',
          color: 'yellow',
          remainingDuration: 5 * 60 * 1000, // 5 minutes in milliseconds
          value: 0.5 // +50% XP
        }
      };
      
    }
    
    // 3. Sharpening Stone / Attack Buff (15g) - Buy if no active attack buff
    const hasAttackBuff = updatedHero.activeBuffs && Object.values(updatedHero.activeBuffs).some(b => b.name === 'Sharpening Stone');
    if (gold >= 15 && !hasAttackBuff) {
      updatedHero.gold = gold - 15;
      updatedHero.activeBuffs = {
        ...updatedHero.activeBuffs,
        attackBuff: {
          name: 'Sharpening Stone',
          icon: '⚔️',
          color: 'orange',
          remainingDuration: 10 * 60 * 1000, // 10 minutes in milliseconds
          value: 0.1 // +10% ATK
        }
      };
      
    }
    
    // 4. Armor Polish / Defense Buff (15g) - Buy if no active defense buff
    const hasDefenseBuff = updatedHero.activeBuffs && Object.values(updatedHero.activeBuffs).some(b => b.name === 'Armor Polish');
    if (gold >= 15 && !hasDefenseBuff) {
      updatedHero.gold = gold - 15;
      updatedHero.activeBuffs = {
        ...updatedHero.activeBuffs,
        defenseBuff: {
          name: 'Armor Polish',
          icon: '🛡️',
          color: 'blue',
          remainingDuration: 10 * 60 * 1000, // 10 minutes in milliseconds
          value: 0.1 // +10% DEF
        }
      };
      
    }
    
    return updatedHero;
  };
  const grantProfessionXp = (hero: TestHero, xpAmount: number) => {
    if (!hero.profession) return hero;
    
    const profession = hero.profession;
    const profLevel = profession.level || 1;
    
    // Bonus: +1% profession XP gain per level
    const xpBonus = 1 + (profLevel - 1) * 0.01;
    const adjustedXpAmount = Math.floor(xpAmount * xpBonus);
    
    const currentProfessionXp = profession.xp || 0;
    const currentProfessionMaxXp = profession.maxXp || 100;
    const newProfessionXp = currentProfessionXp + adjustedXpAmount;
    
    if (newProfessionXp >= currentProfessionMaxXp) {
      // Profession level-up!
      const levelsGained = Math.floor(newProfessionXp / currentProfessionMaxXp);
      const remainingXp = newProfessionXp % currentProfessionMaxXp;
      const newProfessionLevel = profLevel + levelsGained;
      const newProfessionMaxXp = Math.floor(100 * Math.pow(1.15, newProfessionLevel - 1));
      
      profession.level = newProfessionLevel;
      profession.xp = remainingXp;
      profession.maxXp = newProfessionMaxXp;
      
      // Show profession level-up SCT
      showScrollingCombatText(
        `battle-hero-${hero.id}`,
        `${profession.type.toUpperCase()} LEVEL UP`,
        'levelup',
        true
      );
      
    } else {
      profession.xp = newProfessionXp;
    }
    
    return {
      ...hero,
      profession: { ...profession }
    };
  };
  const distributeXPFromKill = (enemy: TestEnemy) => {
    // Calculate XP value (scaled enemy XP, default to 100 if not set)
    const xpValue = enemy.xp || 100;
    
      // Distribute XP to all heroes (alive or dead - they still gain XP)
      setHeroes(prev => {
        const updatedHeroes = prev.map(hero => {
        // Initialize XP if not set
        if (hero.xp === undefined) hero.xp = 0;
        if (hero.maxXp === undefined) hero.maxXp = 100 + (hero.level * 10);
        
        const newXp = hero.xp + xpValue;
        let updatedHero = { ...hero, xp: newXp };
        
        // Show XP gain combat text
        showScrollingCombatText(`battle-hero-${hero.id}`, xpValue, 'xp', true);
      
      // Handle level-ups (can level up multiple times if XP gain is large)
      while (updatedHero.xp >= updatedHero.maxXp) {
        const oldLevel = updatedHero.level;
        const newLevel = oldLevel + 1;
        const newMaxXp = Math.floor(updatedHero.maxXp * 1.5);
        
        // Maintain HP ratio
        const hpRatio = updatedHero.hp / updatedHero.maxHp;
        
        // Recalculate stats
        const levelStatIncrease = 1.05;
        const newMaxHp = Math.floor(updatedHero.maxHp * levelStatIncrease);
        const newAttack = Math.floor((updatedHero.attack || 200) * levelStatIncrease);
        const newDefense = Math.floor((updatedHero.defense || 100) * levelStatIncrease);
        
        // Grant 1 skill point per level-up
        const newSkillPoints = (updatedHero.skillPoints || 0) + 1;
        
        updatedHero = {
          ...updatedHero,
          level: newLevel,
          xp: updatedHero.xp - updatedHero.maxXp, // Carry over excess XP
          maxXp: newMaxXp,
          maxHp: newMaxHp,
          hp: Math.floor(newMaxHp * hpRatio),
          attack: newAttack,
          defense: newDefense,
          skillPoints: newSkillPoints
        };
        
      }
      
      return updatedHero;
    });
    
    // Sync all updated heroes to backend
    Promise.all(updatedHeroes.map(hero => syncHeroToBackend(hero))).catch(err => {
      console.error('[Sync] Error syncing heroes after XP distribution:', err);
    });
    
    return updatedHeroes;
    });
    
  };
  
  const triggerEnemyDeath = (enemyId: string) => {
    // Only trigger if not already dead
    if (deadEnemies.current.has(enemyId)) return;
    
    deadEnemies.current.add(enemyId);
    
    const enemy = enemies.find(e => e.id === enemyId);
    if (enemy) {
      
      // Distribute XP from kill
      distributeXPFromKill(enemy);
      
      // Distribute gold from kill to alive heroes
      const goldPerHero = calculateGoldFromKill(enemy.xp || 100);
      const aliveHeroes = heroes.filter(h => h.hp > 0);
      
      if (aliveHeroes.length > 0 && goldPerHero > 0) {
        setHeroes(prev => prev.map(hero => {
          if (hero.hp > 0) {
            const currentGold = hero.gold || 0;
            return { ...hero, gold: currentGold + goldPerHero };
          }
          return hero;
        }));
      }
      
      // Enchanting: Grant essence from enemy defeats
      setHeroes(prev => prev.map(hero => {
        if (hero.hp <= 0 || !hero.profession || hero.profession.type !== 'enchanting') return hero;
        
        const profession = hero.profession;
        const profLevel = profession.level || 1;
        
        // Base essence based on enemy level (1-3 essence per kill)
        const baseEssence = Math.floor(1 + (enemy.level || 1) / 10) + Math.floor(Math.random() * 2);
        
        // Bonus: +5% essence per profession level (capped at +50% at level 10)
        const essenceBonus = Math.min(1 + (profLevel - 1) * 0.05, 1.5);
        const essenceAmount = Math.floor(baseEssence * essenceBonus);
        
        profession.materials.essence = (profession.materials.essence || 0) + essenceAmount;
        
        // Grant profession XP and check for level-up
        const professionXp = Math.floor(3 + Math.random() * 3);
        profession.totalGathered = (profession.totalGathered || 0) + 1;
        
        showScrollingCombatText(
          `battle-hero-${hero.id}`,
          `+${essenceAmount} Essence`,
          'loot',
          true
        );
        
        // Use helper function to handle XP and level-ups
        const updatedHero = grantProfessionXp(hero, professionXp);
        if (updatedHero.profession) {
          profession.level = updatedHero.profession.level;
          profession.xp = updatedHero.profession.xp;
          profession.maxXp = updatedHero.profession.maxXp;
        }
        
        return {
          ...hero,
          profession: { ...profession }
        };
      }));
      
      // Track quest progress: Enemy kill
      if (questTrackerRef.current) {
        questTrackerRef.current.track('kill', 1, 'daily');
        questTrackerRef.current.track('kill', 1, 'weekly');
        questTrackerRef.current.track('kill', 1, 'monthly');
        
        // Track boss defeat
        if (isBossEnemy(enemy.name)) {
          bossDefeats.current += 1;
          questTrackerRef.current.track('defeatBosses', 1, 'daily');
          questTrackerRef.current.track('defeatBosses', 1, 'weekly');
          questTrackerRef.current.track('defeatBosses', 1, 'monthly');
        }
        
      // Check if all enemies are defeated (wave complete)
      // Use functional update to get current state
      setEnemies(currentEnemies => {
        const remainingEnemies = currentEnemies.filter(e => e.id !== enemyId && e.hp > 0);
        if (remainingEnemies.length === 0) {
          // Wave completed - but only reset state if combat is NOT currently processing
          // If combat is processing a round, let scheduleNextRoundIfNeeded handle the state reset
          // after the round completes to prevent mid-round interruptions
          if (!isCombatActive()) {
            console.log('[Combat] All enemies defeated, resetting combat state (combat not processing)');
            setCombatState('ended', 'all enemies defeated');
            combatInitiativeRef.current = []; // Clear initiative
          } else {
            console.log('[Combat] All enemies defeated but combat still processing - state will be reset after round completes');
            // Don't reset state here - let scheduleNextRoundIfNeeded handle it
          }
          
          wavesCompleted.current += 1;
          if (questTrackerRef.current) {
            questTrackerRef.current.track('completeWaves', 1, 'daily');
            questTrackerRef.current.track('completeWaves', 1, 'weekly');
            questTrackerRef.current.track('completeWaves', 1, 'monthly');
          }
          // Check if this is a raid wave
          if (activeRaid && raidData) {
            if (activeRaid.currentWave < activeRaid.maxWaves) {
              // Progress to next wave
              setTimeout(() => {
                startRaidWave(raidData, activeRaid);
              }, 2000); // 2 second delay between waves
            } else if (enemy.name === raidData.boss.name) {
              // Boss defeated - complete raid
              setTimeout(() => {
                completeRaid();
              }, 2000);
            }
          }
          
          // Return current enemies (dead enemies will be filtered out by adventure loop)
          return currentEnemies;
        }
        
        // Not all enemies defeated, return current enemies unchanged
        return currentEnemies;
      });
      }
      
      // Generate and auto-equip loot for each hero
      const isBoss = isBossEnemy(enemy.name);
      heroes.forEach(hero => {
        // Generate loot for this hero's role
        const loot = generateLoot(hero.role, {
          enemyLevel: enemy.level || 1,
          waveCount: waveCount,
          isBoss: isBoss
        });
        
        if (loot) {
          // Auto-equip if better than current item
          const currentItem = hero.equipment?.[loot.slot];
          if (isItemBetter(loot, currentItem)) {
            setHeroes(prev => prev.map(h => {
              if (h.id !== hero.id) return h;
              
              const newEquipment = { ...(h.equipment || {}) };
              const oldItem = newEquipment[loot.slot];
              newEquipment[loot.slot] = loot;
              
              // Recalculate stats with new equipment
              const newHero = { ...h, equipment: newEquipment };
              
              // Update base stats from equipment
              let attackBonus = 0;
              let defenseBonus = 0;
              let hpBonus = 0;
              
              Object.values(newEquipment).forEach((item: any) => {
                if (item) {
                  attackBonus += item.attack || 0;
                  defenseBonus += item.defense || 0;
                  hpBonus += item.hp || 0;
                }
              });
              
              // Apply equipment bonuses (keep base stats, add equipment bonuses)
              // Note: This is simplified - in full implementation, base stats would be separate
              const equipmentBonuses = calculateEquipmentBonuses(newEquipment);
              
              // Show loot notification
              const rarityColors: Record<string, string> = {
                common: '#9ca3af',
                uncommon: '#10b981',
                rare: '#3b82f6',
                epic: '#a855f7',
                legendary: '#f59e0b'
              };
              const rarityColor = rarityColors[loot.rarity] || '#9ca3af';
              
              showStaggeredLootSCT(hero.id, loot.name);
              
              return newHero;
            }));
          } else {
            // Item is worse, just log it (could auto-sell later)
          }
        }
      });
    }
    
    const ref = enemyRefs.current.get(enemyId);
    if (ref?.current) {
      // Get death animation duration for this enemy type
      const animations = getEnemyAnimations(enemy.name);
      const deathDuration = animations?.death?.duration || 2000; // 2000ms fallback for safety
      
      // Record death animation start time
      enemyDeathStartTime.current.set(enemyId, Date.now());
      
      // Play death animation
      ref.current.playAnimation('death');
      
      console.log(`[Death] Enemy ${enemy.name} (${enemyId}) death animation started, duration: ${deathDuration}ms`);
    }
    // Note: Enemies don't auto-resurrect like heroes do
  };
  // Test enemy death animation
  const testEnemyDeath = (enemyId: string) => {
    // Set HP to 0 first, which will trigger death via useEffect
    setEnemies(prev => prev.map(enemy => 
      enemy.id === enemyId ? { ...enemy, hp: 0 } : enemy
    ));
  };
  // Test enemy transformation animation (for Werewolf)
  const testEnemyTransformation = (enemyId: string) => {
    const ref = enemyRefs.current.get(enemyId);
    if (ref?.current && !werewolfTransformed.current.has(enemyId)) {
      ref.current.playAnimation('transformation');
      werewolfTransformed.current.add(enemyId);
    }
  };
  // Test projectile from hero to enemy
  const testProjectile = (heroId: string, enemyId: string) => {
    const hero = heroes.find(h => h.id === heroId);
    const enemy = enemies.find(e => e.id === enemyId);
    if (!hero || !enemy) return;
    const heroElement = document.querySelector(`#battle-hero-${heroId}`);
    const enemyElement = document.querySelector(`#battle-enemy-${enemyId}`);
    
    if (heroElement && enemyElement) {
      // Check if hero is a healer (uses ranged attack for projectiles)
      const healers = ['cleric', 'atoner', 'druid', 'lightbringer', 'shaman', 'mistweaver', 'chronomancer'];
      const isHealer = healers.includes(hero.role.toLowerCase());
      
      // Play the appropriate attack animation
      const ref = heroRefs.current.get(heroId);
      if (ref?.current) {
        if (isHealer) {
          // Healers use ranged attack animation for projectiles
          ref.current.playAnimation('rangedAttack');
        } else {
          // Other heroes use regular attack animation
          ref.current.playAnimation('attack');
        }
      }
      
      // Get attack animation duration to wait before firing projectile
      // Most attack animations are around 600-800ms, wait for mid-animation to fire
      const attackDelay = 400; // Fire projectile mid-attack animation
      
      setTimeout(() => {
        // Determine element type for mage projectiles
        let elementType: 'fire' | 'frost' | 'arcane' | undefined = undefined;
        if (hero.role.toLowerCase() === 'mage' && hero.classAbilityState?.elementRotation !== undefined) {
          const rotation = hero.classAbilityState.elementRotation;
          if (rotation === 0) {
            elementType = 'fire';
          } else if (rotation === 1) {
            elementType = 'frost';
          } else {
            elementType = 'arcane';
          }
        }
        // Fire projectile after attack animation starts
      createProjectile(
        heroElement as HTMLElement,
        enemyElement as HTMLElement,
          hero.role, // Pass hero role instead of enemy name
          undefined, // projectileType will be auto-detected
        () => {
            // Calculate damage with crit chance (uses spell power for casters)
            const baseDamage = calculateHeroBaseDamage(hero);
            const enemy = enemies.find(e => e.id === enemyId);
            const enemyDefense = enemy?.defense || 0;
            const critChance = hero.critChance || 0;
            
            const { actualDamage, isCrit } = calculateDamageWithCrit(
              baseDamage, 
              critChance, 
              enemyDefense,
              hero.activeDebuffs,
              enemy?.activeDebuffs,
              hero.activeBuffs,
              enemy?.activeBuffs
            );
            
            // Apply damage to enemy
            if (enemy) {
              setEnemies(prev => prev.map(e => {
                if (e.id === enemyId) {
                  // Safety check: if hp is NaN or invalid, use maxHp as fallback
                  const currentHp = (typeof e.hp === 'number' && !isNaN(e.hp)) ? e.hp : (e.maxHp || 0);
                  return {
                    ...e,
                    hp: Math.max(0, currentHp - actualDamage)
                  };
                }
                return e;
              }));
            }
            
            // Show combat text (gold for crits, red for normal)
            showScrollingCombatText(`battle-enemy-${enemyId}`, actualDamage, isCrit ? 'crit' : 'damage', false);
          },
          true, // isHero = true
          elementType // element type for mage projectiles
        );
      }, attackDelay);
    }
  };
  
  // COMBAT SYSTEM v2 - Fully Async with Refs
  // ============================================
  
  // 1) Simple wait helper to replace nested setTimeout logic
  const wait = (ms: number): Promise<void> => {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  };
  
  // 2) Still-alive helper (uses fresh state from refs)
  const stillAlive = (combatant: Combatant): boolean => {
    const heroes = heroesRef.current;
    const enemies = enemiesRef.current;
    
    if (combatant.type === 'hero') {
      const h = heroes.find((x) => x.id === combatant.id);
      return !!h && h.hp > 0;
    } else {
      const e = enemies.find((x) => x.id === combatant.id);
      return !!e && e.hp > 0;
    }
  };
  
  // 3) Helper to recalc initiative from ALIVE combatants only (always recalculates)
  const calculateRoundInitiative = (): Combatant[] => {
    const heroes = heroesRef.current.filter((h) => h.hp > 0);
    const enemies = enemiesRef.current.filter((e) => e.hp > 0);
    
    if (heroes.length === 0 || enemies.length === 0) {
      console.log(`[Initiative] No alive combatants - Heroes: ${heroes.length}, Enemies: ${enemies.length}`);
      return [];
    }
    
    // Use existing initiative calculator and map to Combatant
    const raw = calculateInitiative(heroes, enemies);
    console.log(`[Initiative] Raw initiative result: ${raw.length} combatants`);
    
    if (raw.length === 0) {
      console.error(`[Initiative] ERROR: calculateInitiative returned empty array but we have ${heroes.length} heroes and ${enemies.length} enemies!`);
      console.error(`[Initiative] Creating fallback initiative order...`);
      
      // FALLBACK: Create simple initiative order manually
      const fallbackCombatants: Combatant[] = [
        ...heroes.map(h => ({
          id: h.id,
          type: 'hero' as const,
          initiative: (h.dexterity || 10) + Math.random() * 10,
          name: h.name,
          dexterity: h.dexterity || 10,
          isDead: false
        })),
        ...enemies.map(e => ({
          id: e.id,
          type: 'enemy' as const,
          initiative: (e.dexterity || 10) + Math.random() * 10,
          name: e.name,
          dexterity: e.dexterity || 10,
          isDead: false
        }))
      ];
      
      fallbackCombatants.sort((a, b) => b.initiative - a.initiative);
      console.log(`[Initiative] Fallback created ${fallbackCombatants.length} combatants`);
      combatInitiativeRef.current = fallbackCombatants;
      setInitiativeOrder(fallbackCombatants);
      return fallbackCombatants;
    }
    
    const combatants: Combatant[] = raw
      .filter((c) => {
        if (c.type === 'hero') {
          return heroes.some((h) => h.id === c.id);
        } else {
          return enemies.some((e) => e.id === c.id);
        }
      })
      .map((c) => ({
        id: c.id,
        type: c.type as 'hero' | 'enemy',
        initiative: c.initiative ?? 0,
        ...(c.type === 'hero' ? { hero: c.hero } : { enemy: c.enemy })
      }));
    
    console.log(`[Initiative] Mapped to ${combatants.length} combatants after filtering`);
    console.log(`[Initiative] Combatants: ${combatants.map(c => `${c.type} ${c.id} (init: ${c.initiative.toFixed(1)})`).join(', ')}`);
    
    if (combatants.length === 0) {
      console.error(`[Initiative] ERROR: All combatants filtered out! Raw had ${raw.length}, heroes: ${heroes.map(h => h.id)}, enemies: ${enemies.map(e => e.id)}`);
      return [];
    }
    
    // Sort descending by initiative
    combatants.sort((a, b) => b.initiative - a.initiative);
    
    console.log(`[Initiative] Final order: ${combatants.map(c => `${c.type} ${c.id}`).join(' -> ')}`);
    
    combatInitiativeRef.current = combatants;
    setInitiativeOrder(combatants);
    return combatants;
  };
  
  // 4) Hero action handler (animation + damage), fully async
  const processHeroAction = async (combatant: Combatant): Promise<void> => {
    const heroes = heroesRef.current;
    const enemies = enemiesRef.current;
    
    const hero = heroes.find((h) => h.id === combatant.id);
    if (!hero || hero.hp <= 0) {
      console.log(`⏭️ [Combat] Hero ${combatant.id} dead or missing, skipping.`);
      return;
    }
    
    if (isStunned(hero)) {
      console.log(`😵 [Combat] Hero ${hero.name} is stunned, skipping turn.`);
      return;
    }
    
    const aliveEnemies = enemies.filter((e) => e.hp > 0);
    if (aliveEnemies.length === 0) {
      console.log('⏭️ [Combat] No alive enemies for hero to attack.');
      return;
    }
    
    const targetEnemy = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
    
    // Play hero attack animation (check if ranged role)
    const heroRef = heroRefs.current.get(hero.id);
    if (heroRef?.current) {
      try {
        // Check if hero uses ranged attacks
        const rangedRoles = ['mage', 'warlock', 'necromancer', 'ranger', 'shadowpriest', 'mooncaller', 'stormcaller', 'frostmage', 'firemage', 'dragonsorcerer', 'archer', 'wizard', 'pyromancer', 'bard'];
        const healers = ['cleric', 'atoner', 'druid', 'lightbringer', 'shaman', 'mistweaver', 'chronomancer'];
        const roleLower = hero.role.toLowerCase();
        
        if (rangedRoles.includes(roleLower) || healers.includes(roleLower)) {
          heroRef.current.playAnimation('rangedAttack');
        } else {
          heroRef.current.playAnimation('attack');
        }
      } catch (err) {
        console.warn('[Combat] Failed to play hero attack animation:', err);
      }
    }
    
    // Decide projectile vs melee based on role
    const role = hero.role.toLowerCase();
    const spellcasters = ['mage', 'warlock', 'necromancer', 'firemage', 'frostmage', 'dragonsorcerer'];
    const healers = ['cleric', 'atoner', 'druid', 'lightbringer', 'shaman', 'mistweaver', 'chronomancer', 'bard'];
    const usesProjectile = spellcasters.includes(role) || healers.includes(role);
    
    if (usesProjectile) {
      // PROJECTILE ATTACK
      const attackWindupMs = 400;
      const projectileTravelMs = 1200;
      
      await wait(attackWindupMs);
      
      const freshHeroes = heroesRef.current;
      const freshEnemies = enemiesRef.current;
      
      const latestHero = freshHeroes.find((h) => h.id === hero.id);
      const latestTarget = freshEnemies.find((e) => e.id === targetEnemy.id);
      
      if (!latestHero || latestHero.hp <= 0 || !latestTarget || latestTarget.hp <= 0) {
        console.log('⏭️ [Combat] Hero or target died before projectile fired.');
        return;
      }
      
      const heroElement = document.querySelector(`#battle-hero-${latestHero.id}`) as HTMLElement;
      const enemyElement = document.querySelector(`#battle-enemy-${latestTarget.id}`) as HTMLElement;
      
      if (!heroElement || !enemyElement) {
        console.warn('[Combat] Missing DOM elements for hero or enemy projectile.');
        return;
      }
      
      // Damage calculation using existing helpers
      const baseDamage = calculateHeroBaseDamage(latestHero);
      const targetHpPercent = (latestTarget.hp / latestTarget.maxHp) * 100;
      const abilityResult = applyClassAbility(
        latestHero.role,
        baseDamage,
        targetHpPercent,
        Date.now(),
        latestHero.cooldowns || {},
        latestHero.classAbilityState || {}
      );
      const { actualDamage: finalDamage } = calculateDamageWithCrit(
        abilityResult.modifiedDamage,
        latestHero.critChance || 0,
        latestTarget.defense || 0,
        latestHero.activeDebuffs,
        latestTarget.activeDebuffs,
        latestHero.activeBuffs,
        latestTarget.activeBuffs,
        latestHero.equipment,
        latestTarget.equipment
      );
      
      // Determine element type for mage projectiles
      let elementType: 'fire' | 'frost' | 'arcane' | 'projectile' = 'projectile';
      if (latestHero.role.toLowerCase().includes('firemage')) {
        elementType = 'fire';
      } else if (latestHero.role.toLowerCase().includes('frostmage')) {
        elementType = 'frost';
      } else if (spellcasters.includes(latestHero.role.toLowerCase())) {
        elementType = 'arcane';
      }
      
      // Fire projectile & wait for it to hit
      let projectileHit = false;
      createProjectile(
        heroElement,
        enemyElement,
        latestHero.role,
        elementType,
        () => {
          // Apply damage on hit using fresh state
          const currentEnemies = enemiesRef.current;
          const currentTarget = currentEnemies.find((e) => e.id === latestTarget.id);
          if (!currentTarget || currentTarget.hp <= 0) {
            return; // Target already dead
          }
          
          setEnemies((prev) =>
            prev.map((e) => {
              if (e.id === latestTarget.id) {
                // Safety check: if hp is NaN or invalid, use maxHp as fallback
                const currentHp = (typeof e.hp === 'number' && !isNaN(e.hp)) ? e.hp : (e.maxHp || 0);
                const newHp = Math.max(0, currentHp - finalDamage);
                return { ...e, hp: newHp };
              }
              return e;
            })
          );
          
          // Play hurt animation
          const enemyRef = enemyRefs.current.get(latestTarget.id);
          if (enemyRef?.current) {
            try {
              enemyRef.current.playAnimation('hurt');
            } catch (err) {
              console.warn('[Combat] Failed to play enemy hurt animation:', err);
            }
          }
          
          showScrollingCombatText(`battle-enemy-${latestTarget.id}`, finalDamage, 'damage', false);
          projectileHit = true;
        },
        true, // isHero = true
        elementType
      );
      
      await wait(projectileTravelMs);
    } else {
      // MELEE ATTACK
      const attackDurationMs = 800;
      
      await wait(attackDurationMs);
      
      const freshEnemies = enemiesRef.current;
      const latestTarget = freshEnemies.find((e) => e.id === targetEnemy.id);
      if (!latestTarget || latestTarget.hp <= 0) {
        console.log('⏭️ [Combat] Melee target died before damage applied.');
        return;
      }
      
      const baseDamage = calculateHeroBaseDamage(hero);
      const targetHpPercent = (latestTarget.hp / latestTarget.maxHp) * 100;
      const abilityResult = applyClassAbility(
        hero.role,
        baseDamage,
        targetHpPercent,
        Date.now(),
        hero.cooldowns || {},
        hero.classAbilityState || {}
      );
      const { actualDamage: finalDamage } = calculateDamageWithCrit(
        abilityResult.modifiedDamage,
        hero.critChance || 0,
        latestTarget.defense || 0,
        hero.activeDebuffs,
        latestTarget.activeDebuffs,
        hero.activeBuffs,
        latestTarget.activeBuffs,
        hero.equipment,
        latestTarget.equipment
      );
      
      // Apply damage using latest state
      setEnemies((prev) =>
        prev.map((e) => {
          if (e.id === latestTarget.id) {
            // Safety check: if hp is NaN or invalid, use maxHp as fallback
            const currentHp = (typeof e.hp === 'number' && !isNaN(e.hp)) ? e.hp : (e.maxHp || 0);
            const newHp = Math.max(0, currentHp - finalDamage);
            return { ...e, hp: newHp };
          }
          return e;
        })
      );
      
      // Play hurt animation
      const enemyRef = enemyRefs.current.get(latestTarget.id);
      if (enemyRef?.current) {
        try {
          enemyRef.current.playAnimation('hurt');
        } catch (err) {
          console.warn('[Combat] Failed to play enemy hurt animation:', err);
        }
      }
      
      showScrollingCombatText(`battle-enemy-${latestTarget.id}`, finalDamage, 'damage', false);
    }
  };
  
  // 5) Enemy action handler (animation + damage), fully async
  const processEnemyAction = async (combatant: Combatant): Promise<void> => {
    const heroes = heroesRef.current;
    const enemies = enemiesRef.current;
    
    const enemy = enemies.find((e) => e.id === combatant.id);
    if (!enemy || enemy.hp <= 0) {
      console.log(`⏭️ [Combat] Enemy ${combatant.id} dead or missing, skipping.`);
      return;
    }
    
    if (isStunned(enemy)) {
      console.log(`😵 [Combat] Enemy ${enemy.name} is stunned, skipping turn.`);
      return;
    }
    
    const aliveHeroes = heroes.filter((h) => h.hp > 0);
    if (aliveHeroes.length === 0) {
      console.log('⏭️ [Combat] No alive heroes for enemy to attack.');
      return;
    }
    
    const targetHero = aliveHeroes[Math.floor(Math.random() * aliveHeroes.length)];
    
    // Determine which attack animation to use
    let attackAnimationName: 'attack' | 'attack2' = 'attack';
    if (enemy.name === 'Gryphon') {
      const useAttack2 = Math.random() < 0.5;
      attackAnimationName = useAttack2 ? 'attack2' : 'attack';
    }
    
    // Play enemy attack animation
    const enemyRef = enemyRefs.current.get(enemy.id);
    if (enemyRef?.current) {
      try {
        console.log(`[Combat] Playing ${attackAnimationName} animation for ${enemy.name}`);
        enemyRef.current.playAnimation(attackAnimationName);
        // Small delay to ensure animation starts
        await wait(50);
      } catch (err) {
        console.warn('[Combat] Failed to play enemy attack animation:', err);
      }
    } else {
      console.warn(`[Combat] Enemy ref not found for ${enemy.name} (${enemy.id})`);
    }
    
    const projectileEnemies = ['Baby Dragon', 'Skeleton Mage', 'Witch'];
    const usesProjectile = projectileEnemies.includes(enemy.name);
    
    if (usesProjectile) {
      // PROJECTILE ENEMY ATTACK
      const enemyAnimations = getEnemyAnimations(enemy.name);
      const enemyAttackAnimation = enemyAnimations?.[attackAnimationName];
      const enemyAttackDurationMs = enemyAttackAnimation?.duration || 1200;
      const projectileDelayMs = Math.max(400, Math.floor(enemyAttackDurationMs * 0.5));
      const projectileTravelMs = 1200;
      
      await wait(projectileDelayMs);
      
      const freshHeroes = heroesRef.current;
      const freshEnemies = enemiesRef.current;
      
      const latestEnemy = freshEnemies.find((e) => e.id === enemy.id);
      const latestHero = freshHeroes.find((h) => h.id === targetHero.id);
      
      if (!latestEnemy || latestEnemy.hp <= 0 || !latestHero || latestHero.hp <= 0) {
        console.log('⏭️ [Combat] Enemy or hero died before projectile fired.');
        return;
      }
      
      const enemyElement = document.querySelector(`#battle-enemy-${latestEnemy.id}`) as HTMLElement;
      const heroElement = document.querySelector(`#battle-hero-${latestHero.id}`) as HTMLElement;
      
      if (!enemyElement || !heroElement) {
        console.warn('[Combat] Missing DOM elements for enemy projectile attack.');
        return;
      }
      
      let baseDamage = latestEnemy.attack || 300;
      let finalDamage = calculateDamage(latestEnemy, latestHero, baseDamage);
      
      // Check Last Stand
      const currentHpPercent = latestHero.hp / latestHero.maxHp;
      const lastStandCheck = checkLastStand(
        latestHero.id,
        latestHero.role,
        currentHpPercent,
        Date.now(),
        latestHero.cooldowns || {},
        latestHero.classAbilityState || {}
      );
      
      if (lastStandCheck.abilityUsed) {
        setHeroes((prev) =>
          prev.map((h) => {
            if (h.id === latestHero.id) {
              return {
                ...h,
                cooldowns: { ...(latestHero.cooldowns || {}) },
                classAbilityState: { ...(latestHero.classAbilityState || {}) },
                activeBuffs: {
                  ...h.activeBuffs,
                  lastStand: {
                    name: 'Last Stand',
                    icon: '🛡️💥',
                    color: '#fbbf24',
                    remainingDuration: 10000,
                    value: 75
                  }
                }
              };
            }
            return h;
          })
        );
      }
      
      // Apply Last Stand damage reduction if active
      if (latestHero.classAbilityState?.lastStandActive &&
          latestHero.classAbilityState?.lastStandExpiry &&
          Date.now() < latestHero.classAbilityState.lastStandExpiry) {
        finalDamage = Math.floor(finalDamage * 0.25);
      }
      
      createProjectile(
        enemyElement,
        heroElement,
        latestEnemy.name,
        'projectile',
        () => {
          // Re-check both are still alive
          const stillAliveEnemy = enemiesRef.current.find((e) => e.id === latestEnemy.id);
          const stillAliveHero = heroesRef.current.find((h) => h.id === latestHero.id);
          
          if (!stillAliveEnemy || stillAliveEnemy.hp <= 0) {
            console.log('⏭️ [Combat] Enemy died before projectile hit, skipping damage');
            return;
          }
          
          if (!stillAliveHero || stillAliveHero.hp <= 0) {
            console.log('⏭️ [Combat] Hero died before projectile hit, skipping damage');
            return;
          }
          
          // Play hurt animation
          const heroRef = heroRefs.current.get(latestHero.id);
          if (heroRef?.current) {
            try {
              heroRef.current.playAnimation('hurt');
            } catch (err) {
              console.warn('[Combat] Failed to play hero hurt animation:', err);
            }
          }
          
          // Apply damage
          const currentShield = stillAliveHero.shield || 0;
          let remainingDamage = finalDamage;
          let newShield = currentShield;
          let newHp = stillAliveHero.hp;
          
          // Shield absorbs damage first
          if (currentShield > 0) {
            if (remainingDamage >= currentShield) {
              remainingDamage -= currentShield;
              newShield = 0;
            } else {
              newShield = currentShield - remainingDamage;
              remainingDamage = 0;
            }
          }
          
          // Remaining damage goes to HP
          if (remainingDamage > 0) {
            newHp = Math.max(0, stillAliveHero.hp - remainingDamage);
          }
          
          setHeroes((prev) =>
            prev.map((h) =>
              h.id === latestHero.id
                ? {
                    ...h,
                    hp: newHp,
                    shield: newShield
                  }
                : h
            )
          );
          
          showScrollingCombatText(`battle-hero-${latestHero.id}`, finalDamage, 'damage', true);
        },
        false // isHero = false
      );
      
      await wait(projectileTravelMs);
    } else {
      // MELEE ENEMY ATTACK
      const enemyAnimations = getEnemyAnimations(enemy.name);
      const enemyAttackAnimation = enemyAnimations?.[attackAnimationName];
      const enemyAttackDurationMs = enemyAttackAnimation?.duration || 1200;
      
      console.log(`[Combat] Melee attack: ${enemy.name} attacking, animation duration: ${enemyAttackDurationMs}ms`);
      
      // Wait for attack animation to complete
      await wait(enemyAttackDurationMs);
      
      const freshHeroes = heroesRef.current;
      const latestHero = freshHeroes.find((h) => h.id === targetHero.id);
      if (!latestHero || latestHero.hp <= 0) {
        console.log('⏭️ [Combat] Hero died before melee damage applied.');
        return;
      }
      
      let baseDamage = enemy.attack || 300;
      let finalDamage = calculateDamage(enemy, latestHero, baseDamage);
      
      // Check Last Stand
      const currentHpPercent = latestHero.hp / latestHero.maxHp;
      const lastStandCheck = checkLastStand(
        latestHero.id,
        latestHero.role,
        currentHpPercent,
        Date.now(),
        latestHero.cooldowns || {},
        latestHero.classAbilityState || {}
      );
      
      if (lastStandCheck.abilityUsed) {
        setHeroes((prev) =>
          prev.map((h) => {
            if (h.id === latestHero.id) {
              return {
                ...h,
                cooldowns: { ...(latestHero.cooldowns || {}) },
                classAbilityState: { ...(latestHero.classAbilityState || {}) },
                activeBuffs: {
                  ...h.activeBuffs,
                  lastStand: {
                    name: 'Last Stand',
                    icon: '🛡️💥',
                    color: '#fbbf24',
                    remainingDuration: 10000,
                    value: 75
                  }
                }
              };
            }
            return h;
          })
        );
      }
      
      // Apply Last Stand damage reduction if active
      if (latestHero.classAbilityState?.lastStandActive &&
          latestHero.classAbilityState?.lastStandExpiry &&
          Date.now() < latestHero.classAbilityState.lastStandExpiry) {
        finalDamage = Math.floor(finalDamage * 0.25);
      }
      
      // Play hurt animation
      const heroRef = heroRefs.current.get(latestHero.id);
      if (heroRef?.current) {
        try {
          heroRef.current.playAnimation('hurt');
        } catch (err) {
          console.warn('[Combat] Failed to play hero hurt animation:', err);
        }
      }
      
      // Apply damage
      const currentShield = latestHero.shield || 0;
      let remainingDamage = finalDamage;
      let newShield = currentShield;
      let newHp = latestHero.hp;
      
      // Shield absorbs damage first
      if (currentShield > 0) {
        if (remainingDamage >= currentShield) {
          remainingDamage -= currentShield;
          newShield = 0;
        } else {
          newShield = currentShield - remainingDamage;
          remainingDamage = 0;
        }
      }
      
      // Remaining damage goes to HP
      if (remainingDamage > 0) {
        newHp = Math.max(0, latestHero.hp - remainingDamage);
      }
      
      setHeroes((prev) =>
        prev.map((h) =>
          h.id === latestHero.id
            ? {
                ...h,
                hp: newHp,
                shield: newShield
              }
            : h
        )
      );
      
      showScrollingCombatText(`battle-hero-${latestHero.id}`, finalDamage, 'damage', true);
    }
  };
  
  // 6) Process combatants sequentially, 1 by 1
  const processCombatantsSequentially = async (): Promise<void> => {
    const actedThisRound = new Set<string>();
    const combatants = combatInitiativeRef.current.slice(); // snapshot for this round
    
    console.log(`[Combat] Processing ${combatants.length} combatants in initiative order`);
    console.log(`[Combat] Combatant list: ${combatants.map(c => `${c.type} ${c.id}`).join(', ')}`);
    
    // Check current alive state
    const aliveHeroes = heroesRef.current.filter(h => h.hp > 0);
    const aliveEnemies = enemiesRef.current.filter(e => e.hp > 0);
    console.log(`[Combat] Current alive: ${aliveHeroes.length} heroes, ${aliveEnemies.length} enemies`);
    console.log(`[Combat] Alive heroes: ${aliveHeroes.map(h => `${h.name} (${h.hp}/${h.maxHp}hp)`).join(', ')}`);
    console.log(`[Combat] Alive enemies: ${aliveEnemies.map(e => `${e.name} (${e.hp}/${e.maxHp}hp)`).join(', ')}`);
    
    if (combatants.length === 0) {
      console.error('[Combat] ⚠️ WARNING: combatInitiativeRef.current is empty! This should not happen.');
      return;
    }
    
    let processedCount = 0;
    let skippedCount = 0;
    
    for (const combatant of combatants) {
      if (actedThisRound.has(combatant.id)) {
        console.log(`⏭️ [Combat] Skipping ${combatant.type} ${combatant.id} - already acted this round.`);
        skippedCount++;
        continue;
      }
      
      if (!stillAlive(combatant)) {
        console.log(`⏭️ [Combat] Skipping ${combatant.type} ${combatant.id} - dead/missing before turn.`);
        skippedCount++;
        continue;
      }
      
      actedThisRound.add(combatant.id);
      processedCount++;
      
      console.log(`[Combat] Processing ${combatant.type} ${combatant.id} turn (${processedCount}/${combatants.length})`);
      
      if (combatant.type === 'hero') {
        await processHeroAction(combatant);
      } else {
        await processEnemyAction(combatant);
      }
      
      // Prevent animation-bunching
      await wait(50);
    }
    
    console.log(`[Combat] Finished processing: ${processedCount} acted, ${skippedCount} skipped, ${actedThisRound.size} total this round`);
  };
  
  // 7) Schedule next round if both sides still have alive units
  const scheduleNextRoundIfNeeded = (): void => {
    // Get ALL enemies (including dead ones) for debugging
    const allEnemies = enemiesRef.current;
    const heroes = heroesRef.current.filter((h) => h.hp > 0);
    const enemies = enemiesRef.current.filter((e) => e.hp > 0);
    
    console.log(`[Combat] scheduleNextRoundIfNeeded: ${heroes.length} heroes, ${enemies.length} enemies`);
    console.log(`[Combat] Total enemies in ref: ${allEnemies.length} (alive: ${enemies.length}, dead: ${allEnemies.length - enemies.length})`);
    
    // Detailed enemy logging with HP values and types
    if (allEnemies.length > 0) {
      console.log(`[Combat] All enemies in ref (detailed):`);
      allEnemies.forEach((e, idx) => {
        console.log(`  [${idx}] ${e.name} (id: ${e.id}): hp=${e.hp}, maxHp=${e.maxHp}, hp>0=${e.hp > 0}, typeof hp=${typeof e.hp}`);
      });
    } else {
      console.log(`[Combat] ⚠️ NO ENEMIES IN REF AT ALL!`);
    }
    
    console.log(`[Combat] Heroes: ${heroes.map(h => `${h.name} (${h.hp}hp)`).join(', ') || 'NONE'}`);
    console.log(`[Combat] Enemies (alive): ${enemies.map(e => `${e.name} (${e.hp}hp)`).join(', ') || 'NONE'}`);
    
    // Combat ends - but double-check that enemies are actually dead, not just missing
    if (heroes.length === 0 || enemies.length === 0) {
      // If we have enemies in the ref but they're all dead, that's valid
      // But if we have NO enemies in the ref at all, that might be a false positive
      if (enemies.length === 0 && allEnemies.length > 0) {
        console.log(`[Combat] All ${allEnemies.length} enemies are dead (hp <= 0)`);
        console.log(`[Combat] Enemy details: ${allEnemies.map(e => `${e.name}: ${e.hp}/${e.maxHp}hp`).join(', ')}`);
      } else if (enemies.length === 0 && allEnemies.length === 0) {
        console.warn(`[Combat] ⚠️ FALSE POSITIVE: No enemies in ref at all! This might be a timing issue.`);
        console.warn(`[Combat] State: ${combatSupervisorRef.current.state}, Heroes: ${heroes.length}`);
        // Don't end combat if there are no enemies but we're in the middle of a round
        // Let the adventure loop spawn new enemies
        if (combatSupervisorRef.current.state === 'round_complete') {
          console.log('[Combat] Round complete but no enemies - transitioning to idle, adventure loop will spawn');
          setCombatState('idle', 'no enemies, waiting for spawn');
          return;
        }
      }
      
      console.log(`[Combat] Combat ended. Heroes: ${heroes.length}, Enemies: ${enemies.length}`);
      if (heroes.length === 0) {
        console.log('[Combat] All heroes defeated!');
        setCombatState('ended', 'all heroes defeated');
      }
      if (enemies.length === 0 && allEnemies.length > 0) {
        console.log('[Combat] All enemies defeated!');
        
        // Wait for death animations to complete before removing enemies
        const dead = allEnemies.filter(e => e.hp <= 0);
        if (dead.length > 0) {
          // Find the longest remaining death animation
          let maxRemainingTime = 0;
          const now = Date.now();
          
          dead.forEach(deadEnemy => {
            const deathStartTime = enemyDeathStartTime.current.get(deadEnemy.id);
            if (deathStartTime) {
              const animations = getEnemyAnimations(deadEnemy.name);
              const deathDuration = animations?.death?.duration || 2000;
              const elapsed = now - deathStartTime;
              const remaining = Math.max(0, deathDuration - elapsed);
              maxRemainingTime = Math.max(maxRemainingTime, remaining);
            } else {
              // If no start time recorded, use full duration as fallback
              const animations = getEnemyAnimations(deadEnemy.name);
              const deathDuration = animations?.death?.duration || 2000;
              maxRemainingTime = Math.max(maxRemainingTime, deathDuration);
            }
          });
          
          if (maxRemainingTime > 0) {
            console.log(`[Combat] Waiting ${maxRemainingTime}ms for death animations to complete before removing ${dead.length} dead enemies`);
            setTimeout(() => {
              setEnemies(prev => {
                const stillAlive = prev.filter(e => e.hp > 0);
                const stillDead = prev.filter(e => e.hp <= 0);
                if (stillDead.length > 0) {
                  console.log(`[Combat] Removing ${stillDead.length} dead enemies after death animations`);
                  // Clean up refs and tracking for dead enemies
                  stillDead.forEach(deadEnemy => {
                    enemyRefs.current.delete(deadEnemy.id);
                    deadEnemies.current.delete(deadEnemy.id);
                    enemyDeathStartTime.current.delete(deadEnemy.id); // Clean up death time tracking
                  });
                }
                return stillAlive;
              });
            }, maxRemainingTime);
          } else {
            // Animations already completed, remove immediately
            setEnemies(prev => {
              const alive = prev.filter(e => e.hp > 0);
              const stillDead = prev.filter(e => e.hp <= 0);
              if (stillDead.length > 0) {
                console.log(`[Combat] Removing ${stillDead.length} dead enemies (animations already complete)`);
                stillDead.forEach(deadEnemy => {
                  enemyRefs.current.delete(deadEnemy.id);
                  deadEnemies.current.delete(deadEnemy.id);
                  enemyDeathStartTime.current.delete(deadEnemy.id);
                });
              }
              return alive;
            });
          }
        }
        
        // Set to 'idle' instead of 'ended' so adventure loop can spawn new enemies
        setCombatState('idle', 'all enemies defeated - waiting for new spawn');
        
        // Sync all heroes to backend after combat ends
        const heroesToSync = heroesRef.current.filter(h => h.id && !h.id.startsWith('test-'));
        if (heroesToSync.length > 0) {
          Promise.all(heroesToSync.map(hero => syncHeroToBackend(hero))).catch(err => {
            console.error('[Sync] Error syncing heroes after combat end:', err);
          });
        }
      }
      combatInitiativeRef.current = [];
      
      // If all enemies defeated, let adventure loop handle spawning (it runs every 5 seconds)
      // Don't spawn here to prevent conflicts - adventure loop will spawn on next tick
      if (enemies.length === 0 && allEnemies.length > 0 && isAdventuring) {
        console.log('[Combat] All enemies defeated, adventure loop will spawn new ones on next tick');
        // Trigger immediate spawn check (adventure loop runs every 5 seconds, but we can spawn immediately)
        setTimeout(() => {
          const currentState = combatSupervisorRef.current.state;
          const currentEnemies = enemiesRef.current.filter(e => e.hp > 0);
          if (currentState === 'idle' && currentEnemies.length === 0 && heroesRef.current.length > 0) {
            console.log('[Combat] Triggering immediate enemy spawn after defeat');
            spawnEnemiesForWave('post-combat-spawn');
          }
        }, 500);
      }
      
      return;
    }
    
    // Schedule — GUARANTEED NO OVERLAP
    setTimeout(() => {
      // Check if combat is already processing (shouldn't happen, but safety check)
      const currentState = combatSupervisorRef.current.state;
      if (currentState === 'processing') {
        console.log('⏭️ [Combat] Next round skipped — combat already processing.');
        return;
      }
      
      // If state is not 'round_complete' or 'idle', something is wrong
      if (currentState !== 'round_complete' && currentState !== 'idle') {
        console.log(`⏭️ [Combat] Next round skipped — unexpected state: ${currentState}`);
        return;
      }
      
      // Double check alive state
      const aliveHeroes = heroesRef.current.filter((h) => h.hp > 0);
      const aliveEnemies = enemiesRef.current.filter((e) => e.hp > 0);
      
      if (aliveHeroes.length === 0 || aliveEnemies.length === 0) return;
      
      console.log('🔄 [Combat] Starting next round...');
      processCombatRound();
    }, 1000);
  };
  
  // 8) Main round entrypoint – safe guard + async body
  const processCombatRound = (): void => {
    // ROUND GUARD - only prevent if already processing
    // 'round_complete' means the previous round finished and we're ready for the next one
    const currentState = combatSupervisorRef.current.state;
    if (currentState === 'processing') {
      console.log(`⏭️ [Combat] Round already processing (state: ${currentState}), skipping.`);
      return;
    }
    
    const heroes = heroesRef.current.filter((h) => h.hp > 0);
    const enemies = enemiesRef.current.filter((e) => e.hp > 0);
    
    console.log(`[Combat] processCombatRound guard: ${heroes.length} heroes, ${enemies.length} enemies, current state: ${currentState}`);
    
    if (heroes.length === 0 || enemies.length === 0) {
      console.log(`[Combat] Cannot start round, one side has no units. Heroes: ${heroes.length}, Enemies: ${enemies.length}`);
      if (heroes.length === 0) {
        console.log('[Combat] All heroes are dead!');
        setCombatState('ended', 'all heroes defeated');
      }
      if (enemies.length === 0) {
        console.log('[Combat] All enemies are dead!');
        setCombatState('ended', 'all enemies defeated');
      }
      combatInitiativeRef.current = [];
      return;
    }
    
    // Set combat state to processing (can transition from idle, ended, spawning, or round_complete)
    const stateBeforeTransition = combatSupervisorRef.current.state;
    console.log(`[Combat] Transitioning from ${stateBeforeTransition} to processing`);
    
    // Validate we can transition to processing
    if (stateBeforeTransition === 'processing') {
      console.warn('[Combat] Already processing, this should not happen!');
      return;
    }
    
    setCombatState('processing', 'round start');
    
    (async () => {
      try {
        console.log('⚔️ [Combat] Starting new combat round...');
        
        // Log current state before calculating initiative
        const currentAliveHeroes = heroesRef.current.filter(h => h.hp > 0);
        const currentAliveEnemies = enemiesRef.current.filter(e => e.hp > 0);
        console.log(`[Combat] Pre-initiative state: ${currentAliveHeroes.length} heroes, ${currentAliveEnemies.length} enemies`);
        console.log(`[Combat] Heroes: ${currentAliveHeroes.map(h => `${h.name} (${h.hp}hp)`).join(', ')}`);
        console.log(`[Combat] Enemies: ${currentAliveEnemies.map(e => `${e.name} (${e.hp}hp)`).join(', ')}`);
        
        const initiative = calculateRoundInitiative();
        if (initiative.length === 0) {
          console.error('[Combat] ⚠️ No valid combatants in initiative! This should not happen if heroes and enemies are alive.');
          console.error(`[Combat] Current state - Heroes: ${currentAliveHeroes.length}, Enemies: ${currentAliveEnemies.length}`);
          
          // Check if heroes are actually dead - if so, end combat properly
          if (currentAliveHeroes.length === 0) {
            console.log('[Combat] All heroes defeated - ending combat');
            setCombatState('ended', 'all heroes defeated');
            combatInitiativeRef.current = [];
            return;
          }
          
          // Check if enemies are actually dead - if so, end combat and let adventure loop spawn new ones
          if (currentAliveEnemies.length === 0) {
            console.log('[Combat] All enemies defeated - ending combat, adventure loop will spawn new ones');
            setCombatState('ended', 'all enemies defeated');
            combatInitiativeRef.current = [];
            return;
          }
          
          // If we have alive heroes and enemies but no initiative, something is wrong
          // Unlock and let scheduleNextRoundIfNeeded handle it
          console.error('[Combat] ERROR: Alive heroes and enemies exist but initiative is empty - this should not happen!');
          setCombatState('round_complete', 'initiative error');
          scheduleNextRoundIfNeeded();
          return;
        }
        
        console.log(`[Combat] Initiative calculated: ${initiative.length} combatants`);
        const heroCount = initiative.filter(c => c.type === 'hero').length;
        const enemyCount = initiative.filter(c => c.type === 'enemy').length;
        console.log(`[Combat] Initiative breakdown: ${heroCount} heroes, ${enemyCount} enemies`);
        
        // This processes ALL combatants one by one
        await processCombatantsSequentially();
        
        // 👇 this is the TRUE end of a round
        // All attack animations, damage, projectiles, delays complete
        await wait(200); // tiny safety window
      } catch (err) {
        console.error('[Combat] Error during combat round:', err);
      } finally {
        // DO NOT RELEASE LOCK EARLY - transition to round_complete state
        setCombatState('round_complete', 'round finished');
        // Now that the round is 100% over, check continuation
        scheduleNextRoundIfNeeded();
      }
    })();
  };
  
  // Add shield to hero (overhealing) - simulates overhealing creating shield
  const addShield = (heroId: string) => {
    setHeroes(prev => prev.map(hero => {
      if (hero.id !== heroId) return hero;
      
      // Simulate overhealing: if hero is at full HP, add shield
      // If hero has missing HP, heal first, then add shield for excess
      const missingHp = hero.maxHp - hero.hp;
      const overhealAmount = 1000;
      
      if (missingHp > 0) {
        // Heal first
        const newHp = Math.min(hero.hp + overhealAmount, hero.maxHp);
        const excessHealing = overhealAmount - (newHp - hero.hp);
        return {
          ...hero,
          hp: newHp,
          shield: (hero.shield || 0) + excessHealing
        };
      } else {
        // Already at full HP, all healing becomes shield
        return {
          ...hero,
          shield: (hero.shield || 0) + overhealAmount
        };
      }
    }));
  };
  
  // Test healing (smooth HP increase)
  const testHealing = (heroId: string) => {
    const hero = heroes.find(h => h.id === heroId);
    if (!hero) return;
    
    // Prevent duplicate calls within 100ms
    const now = Date.now();
    const lastHeal = lastHealTime.current.get(heroId);
    if (lastHeal && now - lastHeal < 100) {
      return; // Skip if called too recently
    }
    lastHealTime.current.set(heroId, now);
    
    const baseHealing = Math.floor(hero.maxHp * 0.25); // 25% healing
    const healAmount = calculateHealing(baseHealing, 1.0, hero.activeBuffs); // Apply buff modifiers (e.g., Divine Grace)
    const missingHp = hero.maxHp - hero.hp;
    
    let newHp = hero.hp;
    let newShield = hero.shield || 0;
    
    // Heal HP first
    if (missingHp > 0) {
      const hpHealed = Math.min(healAmount, missingHp);
      newHp = hero.hp + hpHealed;
      
      // Excess healing becomes shield
      const excessHealing = healAmount - hpHealed;
      if (excessHealing > 0) {
        newShield = (hero.shield || 0) + excessHealing;
      }
    } else {
      // Already at full HP, all healing becomes shield
      newShield = (hero.shield || 0) + healAmount;
    }
    
    setHeroes(prev => prev.map(h => {
      if (h.id === heroId) {
        return { ...h, hp: newHp, shield: newShield };
      }
      return h;
    }));
    
    // Track quest progress: Healing done
    if (questTrackerRef.current && healAmount > 0) {
      const currentHealing = totalHealingDone.current.get(heroId) || 0;
      totalHealingDone.current.set(heroId, currentHealing + healAmount);
      questTrackerRef.current.track('heal', healAmount, 'daily');
      questTrackerRef.current.track('heal', healAmount, 'weekly');
      questTrackerRef.current.track('heal', healAmount, 'monthly');
    }
    
    showScrollingCombatText(`battle-hero-${heroId}`, healAmount, 'healing', true);
  };
  
  // Remove hero from battlefield
  const removeHero = (heroId: string) => {
    setHeroes(prev => prev.filter(h => h.id !== heroId));
    heroRefs.current.delete(heroId);
  };
  
  // Remove enemy from battlefield
  const removeEnemy = (enemyId: string) => {
    setEnemies(prev => prev.filter(e => e.id !== enemyId));
    enemyRefs.current.delete(enemyId);
  };
  
  // Get all heroes on battlefield
  const getBattlefieldHeroes = () => {
    return heroes;
  };
  
  // Start a raid
  const startRaid = (raidId: string) => {
    const raid = getRaidById(raidId);
    if (!raid) {
      return;
    }
    // Check if we have enough heroes
    if (heroes.length < raid.minPlayers) {
      alert(`Need at least ${raid.minPlayers} heroes to start this raid!`);
      return;
    }
    // Calculate boss stats with difficulty scaling
    const bossStats = calculateBossStats(raid.boss, raid.difficulty);
    // Create raid instance
    const instance: RaidInstance = {
      raidId: raid.id,
      currentWave: 0,
      maxWaves: raid.waves,
      bossHp: bossStats.hp,
      bossMaxHp: bossStats.hp,
      bossMechanicsTriggered: new Set(),
      mechanicCooldowns: new Map(),
      startTime: Date.now()
    };
    setActiveRaid(instance);
    setRaidData(raid);
    raidMechanicsTriggered.current.clear();
    raidMechanicCooldowns.current.clear();
    // Clear existing enemies
    setEnemies([]);
    deadEnemies.current.clear();
    // Start first wave
    startRaidWave(raid, instance);
  };
  
  // Start a raid wave
  const startRaidWave = (raid: RaidData, instance: RaidInstance) => {
    const waveNumber = instance.currentWave + 1;
    
    if (waveNumber > raid.waves) {
      // All waves complete, spawn boss
      spawnRaidBoss(raid, instance);
      return;
    }
    // Generate enemies for this wave
    const waveEnemies = generateRaidWaveEnemies(waveNumber, raid.waves, raid.difficulty);
    const newEnemies: TestEnemy[] = [];
    waveEnemies.forEach(({ name, count }) => {
      for (let i = 0; i < count; i++) {
        // Get base stats for this enemy type
        const baseStats = getEnemyBaseStats(name);
        const scaledStats = calculateRaidEnemyStats(
          baseStats.hp,
          baseStats.attack,
          baseStats.defense,
          raid.difficulty,
          waveNumber,
          raid.waves
        );
        const enemy: TestEnemy = {
          id: `raid-enemy-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: name,
          hp: scaledStats.hp,
          maxHp: scaledStats.hp,
          attack: scaledStats.attack,
          defense: scaledStats.defense,
          level: raid.boss.level - (raid.waves - waveNumber), // Scale level with wave
          xp: Math.floor(100 * (1 + waveNumber * 0.2)), // More XP for later waves
          activeBuffs: {},
          activeDebuffs: {}
        };
        newEnemies.push(enemy);
      }
    });
    setEnemies(newEnemies);
    setActiveRaid(prev => prev ? { ...prev, currentWave: waveNumber } : null);
  };
  
  // Spawn raid boss
  const spawnRaidBoss = (raid: RaidData, instance: RaidInstance) => {
    const bossStats = calculateBossStats(raid.boss, raid.difficulty);
    const boss: TestEnemy = {
      id: `raid-boss-${Date.now()}`,
      name: raid.boss.name,
      hp: bossStats.hp,
      maxHp: bossStats.hp,
      attack: bossStats.attack,
      defense: bossStats.defense,
      level: raid.boss.level,
      xp: Math.floor((raid.boss as any).xp || 1000 * (1 + raid.difficulty * 0.5)),
      activeBuffs: {},
      activeDebuffs: {}
    };
    setEnemies([boss]);
    setActiveRaid(prev => prev ? { ...prev, currentWave: raid.waves + 1 } : null);
  };
  
  // Get base enemy stats (simplified - would normally come from enemy data)
  const getEnemyBaseStats = (enemyName: string): { hp: number; attack: number; defense: number } => {
    // Default base stats - reduced for faster testing
    const defaults = { hp: 200, attack: 50, defense: 20 };
    
    const enemyStats: Record<string, { hp: number; attack: number; defense: number }> = {
      'Goblin': { hp: 150, attack: 40, defense: 15 },
      'Orc': { hp: 250, attack: 60, defense: 25 },
      'Skeleton': { hp: 180, attack: 45, defense: 20 },
      'Imp': { hp: 120, attack: 55, defense: 10 },
      'Witch': { hp: 200, attack: 70, defense: 15 },
      'Mage': { hp: 180, attack: 80, defense: 12 },
      'Demon': { hp: 400, attack: 100, defense: 30 },
      'Dragon': { hp: 600, attack: 120, defense: 40 },
      'Kobold Warrior': { hp: 150, attack: 40, defense: 15 },
      'Baby Dragon': { hp: 200, attack: 50, defense: 20 },
      'Lizardman': { hp: 180, attack: 45, defense: 20 },
      'Masked Orc': { hp: 250, attack: 60, defense: 25 },
      'Werewolf': { hp: 300, attack: 70, defense: 30 },
      'Skeleton Mage': { hp: 180, attack: 80, defense: 12 },
      'Mimic': { hp: 350, attack: 90, defense: 25 },
      'Gryphon': { hp: 400, attack: 100, defense: 30 },
      'Minotaur': { hp: 500, attack: 110, defense: 35 },
      'Headless Horseman': { hp: 600, attack: 120, defense: 40 },
      'Adult Dragon': { hp: 800, attack: 140, defense: 50 },
      'Demon Lord': { hp: 1000, attack: 150, defense: 60 }
    };
    return enemyStats[enemyName] || defaults;
  };
  // Check and trigger raid boss mechanics
  const checkRaidBossMechanics = (enemyId?: string) => {
    if (!activeRaid || !raidData) return;
    // Find the boss enemy
    const bossEnemy = enemyId 
      ? enemies.find(e => e.id === enemyId)
      : enemies.find(e => e.name === raidData.boss.name);
    
    if (!bossEnemy || bossEnemy.name !== raidData.boss.name) return;
    const now = Date.now();
    const hpPercent = bossEnemy.hp / bossEnemy.maxHp;
    raidData.boss.mechanics.forEach(mechanic => {
      // Check HP-based triggers
      if (shouldTriggerMechanic(mechanic, bossEnemy.hp, bossEnemy.maxHp, raidMechanicsTriggered.current)) {
        triggerBossMechanic(mechanic, bossEnemy);
        raidMechanicsTriggered.current.add(mechanic.name);
      }
      // Check cooldown-based mechanics
      if (mechanic.cooldown && isMechanicOffCooldown(mechanic, raidMechanicCooldowns.current, now)) {
        // Only trigger if it's not an HP-based trigger that's already been triggered
        if (!mechanic.triggerAt || !raidMechanicsTriggered.current.has(mechanic.name)) {
          triggerBossMechanic(mechanic, bossEnemy);
          raidMechanicCooldowns.current.set(mechanic.name, now);
        }
      }
    });
  };
  // Trigger a boss mechanic
  const triggerBossMechanic = (mechanic: RaidBossMechanic, boss: TestEnemy) => {
    switch (mechanic.type) {
      case 'adds':
        // Summon adds
        const addCount = mechanic.name.includes('Cultists') ? 2 : 
                        mechanic.name.includes('whelps') ? 2 : 
                        mechanic.name.includes('archers') ? 3 : 2;
        
        const newAdds: TestEnemy[] = [];
        for (let i = 0; i < addCount; i++) {
          const addName = mechanic.name.includes('Cultists') ? 'Cultist' :
                         mechanic.name.includes('whelps') ? 'Dragon Whelp' :
                         mechanic.name.includes('archers') ? 'Bandit Archer' : 'Add';
          
          const add: TestEnemy = {
            id: `raid-add-${Date.now()}-${i}`,
            name: addName,
            hp: Math.floor(boss.maxHp * 0.1), // Adds have 10% of boss HP
            maxHp: Math.floor(boss.maxHp * 0.1),
            attack: Math.floor(boss.attack * 0.5),
            defense: Math.floor(boss.defense * 0.5),
            level: boss.level - 5,
            xp: 50,
            activeBuffs: {},
            activeDebuffs: {}
          };
          newAdds.push(add);
        }
        setEnemies(prev => [...prev, ...newAdds]);
        break;
      case 'aoe':
        // Deal AoE damage to all heroes
        const aoeDamage = Math.floor(boss.attack * 1.5);
        const affectedHeroIds: string[] = [];
        setHeroes(prev => prev.map(hero => {
          if (hero.hp > 0) {
            affectedHeroIds.push(hero.id);
            const newHp = Math.max(0, hero.hp - aoeDamage);
            return { ...hero, hp: newHp };
          }
          return hero;
        }));
        // Show combat text after state update
        setTimeout(() => {
          affectedHeroIds.forEach(heroId => {
            showScrollingCombatText(`battle-hero-${heroId}`, aoeDamage, 'damage', true);
          });
        }, 0);
        break;
      case 'tank-buster':
        // Deal heavy damage to tank (first hero or highest HP hero)
        const tank = heroes.find(h => h.hp > 0 && ['guardian', 'paladin', 'warden', 'bloodknight', 'vanguard', 'brewmaster'].includes(h.role.toLowerCase())) 
                    || heroes.find(h => h.hp > 0);
        if (tank) {
          const tankBusterDamage = Math.floor(boss.attack * 2.5);
          const newHp = Math.max(0, tank.hp - tankBusterDamage);
          showScrollingCombatText(`battle-hero-${tank.id}`, tankBusterDamage, 'crit', true);
          setHeroes(prev => prev.map(h => h.id === tank.id ? { ...h, hp: newHp } : h));
        }
        break;
      // Other mechanics can be added here
      default:
    }
  };
  // Complete raid and distribute rewards
  const completeRaid = () => {
    if (!activeRaid || !raidData) return;
    const rewards = calculateRaidRewards(raidData, heroes.length);
    // Distribute rewards
    setHeroes(prev => prev.map(hero => ({
      ...hero,
      gold: (hero.gold || 0) + rewards.gold,
      tokens: (hero.tokens || 0) + rewards.tokens,
      xp: (hero.xp || 0) + rewards.experience
    })));
    // Generate guaranteed loot
    for (let i = 0; i < rewards.lootCount; i++) {
      heroes.forEach(hero => {
        const loot = generateLoot(hero.role, {
          enemyLevel: raidData.boss.level,
          waveCount: raidData.waves,
          isBoss: true,
          forceSetPiece: Math.random() < 0.6 // 60% chance for set piece from raid boss
        });
        if (loot) {
          const currentItem = hero.equipment?.[loot.slot];
          if (isItemBetter(loot, currentItem)) {
            setHeroes(prev => prev.map(h => {
              if (h.id !== hero.id) return h;
              const newEquipment = { ...(h.equipment || {}), [loot.slot]: loot };
              showStaggeredLootSCT(hero.id, loot.name);
              return { ...h, equipment: newEquipment };
            }));
          }
        }
      });
    }
    
    setActiveRaid(null);
    setRaidData(null);
    setEnemies([]);
  };
  // Load raid participants and start raid (for scheduled raids)
  const loadRaidParticipants = async (instanceId: string) => {
    try {
      const instance = await raidAPI.getRaidInstance(instanceId);
      if (!instance || !instance.participants) {
        return;
      }
      // Extract hero IDs from participants
      const heroIds = instance.participants.map((p: any) => p.userId || p.heroId).filter(Boolean);
      
      if (heroIds.length === 0) {
        return;
      }
      // Load all heroes
      await loadMultipleHeroesFromBackend(heroIds);
      // Get raid data and start the raid
      const raid = getRaidById(instance.raidId);
      if (raid) {
        startRaid(raid.id);
      }
      setWatchingRaidInstance(instanceId);
    } catch (error) {
    }
  };
  // Watch a queue (raid or dungeon)
  const watchQueue = async (type: 'raid' | 'dungeon', queueId: string) => {
    try {
      setWatchingQueue({ type, id: queueId });
    } catch (error) {
    }
  };
  // Auto-check for scheduled raids and queues
  useEffect(() => {
    if (!watchingRaidInstance && !watchingQueue) return;
    const checkInterval = setInterval(async () => {
      try {
        // Check for scheduled raids that just started
        if (!watchingRaidInstance) {
          const upcoming = await raidAPI.getUpcomingRaids();
          const now = Date.now();
          
          // Find raids that should have started (within last 30 seconds)
          const startingRaids = upcoming.scheduledRaids.filter((raid: any) => {
            const scheduledTime = raid.scheduledTime?.toMillis?.() || new Date(raid.scheduledTime).getTime();
            const timeDiff = now - scheduledTime;
            return timeDiff >= 0 && timeDiff < 30000 && raid.status === 'scheduled';
          });
          if (startingRaids.length > 0) {
            // Load the first starting raid
            const raid = startingRaids[0];
            await loadRaidParticipants(raid.id);
          }
        }
        // Check queue status if watching a queue
        if (watchingQueue) {
          if (watchingQueue.type === 'raid') {
            const queueStatus = await raidAPI.getRaidQueueStatus(watchingQueue.id);
            // When queue forms a group and starts, load participants
            if (queueStatus.instanceId && !watchingRaidInstance) {
              await loadRaidParticipants(queueStatus.instanceId);
              setWatchingQueue(null); // Stop watching queue, now watching raid
            }
          } else if (watchingQueue.type === 'dungeon') {
            // Similar logic for dungeon queues
            const queueStatus = await dungeonAPI.getQueueStatus(watchingQueue.id);
            // Handle dungeon queue start (would need dungeon instance loading)
          }
        }
      } catch (error) {
      }
    }, 10000); // Check every 10 seconds
    return () => clearInterval(checkInterval);
  }, [watchingRaidInstance, watchingQueue]);
  // Add buff to hero
  const addHeroBuff = (heroId: string, buffName: string) => {
    const buffs: Record<string, TestBuff> = {
      ironSkin: { name: 'Iron Skin', icon: '🛡️', color: '#3b82f6', remainingDuration: 10000, value: 30 },
      divineGrace: { name: 'Divine Grace', icon: '✨', color: '#10b981', remainingDuration: 8000, value: 2 },
      criticalStrike: { name: 'Critical Strike', icon: '⚡', color: '#fbbf24', remainingDuration: 5000, value: 1.5 },
      attackBuff: { name: 'Attack Buff', icon: '⚔️', color: '#ef4444', remainingDuration: 60000, value: 10 },
      defenseBuff: { name: 'Defense Buff', icon: '🛡️', color: '#60a5fa', remainingDuration: 60000, value: 10 },
      regeneration: { name: 'Regeneration', icon: '💚', color: '#10b981', remainingDuration: 10000, value: 5 },
    };
    
    const buff = buffs[buffName];
    if (!buff) return;
    
    setHeroes(prev => prev.map(hero => {
      if (hero.id === heroId) {
        return {
          ...hero,
          activeBuffs: {
            ...hero.activeBuffs,
            [buffName]: { ...buff }
          }
        };
      }
      return hero;
    }));
  };
  // Add debuff to hero
  const addHeroDebuff = (heroId: string, debuffName: string) => {
    const debuffs: Record<string, TestDebuff> = {
      weaken: { name: 'Weakened', icon: '💔', color: '#9b59b6', remainingDuration: 10000, value: 0.3 },
      vulnerable: { name: 'Vulnerable', icon: '🛡️💥', color: '#e74c3c', remainingDuration: 8000, value: 0.4 },
      poison: { name: 'Poisoned', icon: '☠️', color: '#27ae60', remainingDuration: 12000, value: 5 },
      bleed: { name: 'Bleeding', icon: '🩸', color: '#c0392b', remainingDuration: 10000, value: 3 },
      burn: { name: 'Burning', icon: '🔥', color: '#e67e22', remainingDuration: 10000, value: 4 },
      corruption: { name: 'Corruption', icon: '😈', color: '#8e44ad', remainingDuration: 15000, value: 8 },
      stunned: { name: 'Stunned', icon: '💫', color: '#f39c12', remainingDuration: 3000, value: 1 },
      cursed: { name: 'Cursed', icon: '😈', color: '#7d3c98', remainingDuration: 8000, value: 0.5 },
    };
    
    const debuff = debuffs[debuffName];
    if (!debuff) return;
    
    setHeroes(prev => prev.map(hero => {
      if (hero.id === heroId) {
        return {
          ...hero,
          activeDebuffs: {
            ...hero.activeDebuffs,
            [debuffName]: { ...debuff }
          }
        };
      }
      return hero;
    }));
  };
  // Add buff/debuff to enemy
  const addEnemyBuff = (enemyId: string, buffName: string) => {
    const buffs: Record<string, TestBuff> = {
      attackBuff: { name: 'Attack Buff', icon: '⚔️', color: '#ef4444', remainingDuration: 60000, value: 10 },
      defenseBuff: { name: 'Defense Buff', icon: '🛡️', color: '#60a5fa', remainingDuration: 60000, value: 10 },
    };
    
    const buff = buffs[buffName];
    if (!buff) return;
    
    setEnemies(prev => prev.map(enemy => {
      if (enemy.id === enemyId) {
        return {
          ...enemy,
          activeBuffs: {
            ...enemy.activeBuffs,
            [buffName]: { ...buff }
          }
        };
      }
      return enemy;
    }));
  };
  const addEnemyDebuff = (enemyId: string, debuffName: string) => {
    const debuffs: Record<string, TestDebuff> = {
      weaken: { name: 'Weakened', icon: '💔', color: '#9b59b6', remainingDuration: 10000, value: 0.3 },
      vulnerable: { name: 'Vulnerable', icon: '🛡️💥', color: '#e74c3c', remainingDuration: 8000, value: 0.4 },
      poison: { name: 'Poisoned', icon: '☠️', color: '#27ae60', remainingDuration: 12000, value: 5 },
      bleed: { name: 'Bleeding', icon: '🩸', color: '#c0392b', remainingDuration: 10000, value: 3 },
      burn: { name: 'Burning', icon: '🔥', color: '#e67e22', remainingDuration: 10000, value: 4 },
      corruption: { name: 'Corruption', icon: '😈', color: '#8e44ad', remainingDuration: 15000, value: 8 },
      stunned: { name: 'Stunned', icon: '💫', color: '#f39c12', remainingDuration: 3000, value: 1 },
    };
    
    const debuff = debuffs[debuffName];
    if (!debuff) return;
    
    setEnemies(prev => prev.map(enemy => {
      if (enemy.id === enemyId) {
        return {
          ...enemy,
          activeDebuffs: {
            ...enemy.activeDebuffs,
            [debuffName]: { 
              ...debuff,
              lastTickTime: undefined // Initialize without lastTickTime to allow first tick
            }
          }
        };
      }
      return enemy;
    }));
  };
  // Test combat text
  const testCombatText = (entityId: string, isHero: boolean) => {
    // Ensure entityId is properly formatted (remove any invalid characters)
    const cleanId = entityId.replace(/[^a-zA-Z0-9-]/g, '');
    showScrollingCombatText(cleanId, 500, 'damage', isHero);
  };
  // Test critical hit text
  const testCritText = (entityId: string, isHero: boolean) => {
    const cleanId = entityId.replace(/[^a-zA-Z0-9-]/g, '');
    showScrollingCombatText(cleanId, 1000, 'crit', isHero);
  };
  // Test DoT text
  const testDotText = (entityId: string, isHero: boolean) => {
    const cleanId = entityId.replace(/[^a-zA-Z0-9-]/g, '');
    showScrollingCombatText(cleanId, 50, 'dot', isHero);
  };
  return (
    <div style={{
      width: '1920px',
      height: '1080px',
      position: 'relative',
      backgroundColor: isBrowserSource ? 'transparent' : '#1a1a1a',
      overflow: 'hidden'
    }}>
      {/* Control Panel - Right Side (Hidden in browser source mode) */}
      {!isBrowserSource && (
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: '20px',
        borderRadius: '8px',
        color: 'white',
        zIndex: 1000,
        maxHeight: 'calc(100vh - 40px)',
        overflowY: 'auto',
        maxWidth: '400px'
      }}>
        <h2 style={{ marginTop: 0 }}>Animation Test Controls</h2>
        
        {/* Elder Dragon Quick Test - Prominent Button */}
        <div style={{ 
          marginBottom: '20px', 
          padding: '12px',
          backgroundColor: 'rgba(168, 85, 247, 0.3)', 
          borderRadius: '6px', 
          border: '2px solid rgba(168, 85, 247, 0.7)'
        }}>
          <div style={{ marginBottom: '8px', color: '#c084fc', fontWeight: 'bold', fontSize: '14px' }}>
            🐉 Test Elder Dragon Raid Boss
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => startRaid('elder_dragon_normal')}
              disabled={heroes.length < 4 || !!activeRaid}
              style={{
                padding: '8px 16px',
                fontSize: '12px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: (heroes.length < 4 || !!activeRaid) ? 'not-allowed' : 'pointer',
                opacity: (heroes.length < 4 || !!activeRaid) ? 0.5 : 1,
                fontWeight: 'bold',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
              title="Elder Dragon (Normal) - 80k HP, Level 28, 4 waves - Requires 4 heroes"
            >
              Normal (80k HP)
            </button>
            <button
              onClick={() => startRaid('elder_dragon_heroic')}
              disabled={heroes.length < 5 || !!activeRaid}
              style={{
                padding: '8px 16px',
                fontSize: '12px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: (heroes.length < 5 || !!activeRaid) ? 'not-allowed' : 'pointer',
                opacity: (heroes.length < 5 || !!activeRaid) ? 0.5 : 1,
                fontWeight: 'bold',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
              title="Elder Dragon (Heroic) - 200k HP, Level 45, 5 waves - Requires 5 heroes"
            >
              Heroic (200k HP)
            </button>
            <button
              onClick={() => startRaid('elder_dragon_mythic')}
              disabled={heroes.length < 6 || !!activeRaid}
              style={{
                padding: '8px 16px',
                fontSize: '12px',
                backgroundColor: '#a855f7',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: (heroes.length < 6 || !!activeRaid) ? 'not-allowed' : 'pointer',
                opacity: (heroes.length < 6 || !!activeRaid) ? 0.5 : 1,
                fontWeight: 'bold',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
              title="Elder Dragon (Mythic) - 500k HP, Level 60, 6 waves - Requires 6 heroes"
            >
              Mythic (500k HP)
            </button>
          </div>
          <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '6px' }}>
            {activeRaid ? 'Cancel current raid first' : `Requires ${heroes.length < 4 ? '4' : heroes.length < 5 ? '5' : '6'}+ heroes`}
          </div>
        </div>
        
        {/* Auto-Buy Toggle */}
        <div style={{ 
          marginBottom: '20px', 
          padding: '10px', 
          backgroundColor: 'rgba(16, 185, 129, 0.2)', 
          borderRadius: '4px', 
          border: '1px solid rgba(16, 185, 129, 0.5)' 
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#10b981' }}>🛒 Auto-Buy:</div>
          <button
            onClick={() => setAutoBuyEnabled(!autoBuyEnabled)}
            style={{
              padding: '8px 15px',
              fontSize: '12px',
              backgroundColor: autoBuyEnabled ? '#10b981' : '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              width: '100%'
            }}
          >
            {autoBuyEnabled ? '✅ Enabled' : '❌ Disabled'}
          </button>
          {autoBuyEnabled && (
            <div style={{ marginTop: '8px', fontSize: '11px', color: '#9ca3af' }}>
              Auto-purchases: Health Potion (HP &lt; 30%), XP Boost, Attack/Defense Buffs
            </div>
          )}
        </div>
        
        {/* Travel Animation Button */}
        <div style={{ 
          marginBottom: '20px', 
          padding: '10px', 
          backgroundColor: 'rgba(139, 92, 246, 0.2)', 
          borderRadius: '4px', 
          border: '1px solid rgba(139, 92, 246, 0.5)' 
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#a78bfa' }}>🚶 Travel Animation:</div>
          <button
            onClick={() => {
              isTraveling.current = true;
              
              // Trigger walk/run animations for all alive heroes
              setHeroes(prev => {
                prev.forEach(hero => {
                  if (hero.hp > 0) {
                    const ref = heroRefs.current.get(hero.id);
                    if (ref?.current) {
                      // Check which animations are available based on hero role
                      // Melee DPS (Dwarf Warrior) have "run", others have "walk"
                      const meleeDpsRoles = ['berserker', 'crusader', 'assassin', 'reaper', 'bladedancer', 'monk', 'stormwarrior', 'hunter'];
                      const heroRole = (hero.role || '').toLowerCase().trim();
                      const isMeleeDps = heroRole && meleeDpsRoles.includes(heroRole);
                      
                      if (isMeleeDps) {
                        // Melee DPS use "run" animation
                        ref.current.playAnimation('run');
                      } else if (heroRole) {
                        // Tanks, Healers, and Casters use "walk" animation
                        ref.current.playAnimation('walk');
                      }
                      // If no role, don't change animation (keep current)
                    }
                  }
                });
                return prev; // Return unchanged state
              });
              
              // Reset to idle after 5 seconds
              setTimeout(() => {
                isTraveling.current = false;
                setHeroes(prev => {
                  prev.forEach(hero => {
                    if (hero.hp > 0) {
                      const ref = heroRefs.current.get(hero.id);
                      if (ref?.current) {
                        ref.current.playAnimation('idle');
                      }
                    }
                  });
                  return prev; // Return unchanged state
                });
              }, 5000);
            }}
            style={{
              padding: '8px 15px',
              fontSize: '12px',
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              width: '100%'
            }}
          >
            🚶 Start Travel
          </button>
          <div style={{ marginTop: '8px', fontSize: '11px', color: '#9ca3af' }}>
            Triggers walk/run animations for all heroes (5 seconds)
          </div>
        </div>
        
        {/* Economy Display */}
        {heroes.length > 0 && (
          <div style={{ 
            marginBottom: '20px', 
            padding: '10px', 
            backgroundColor: 'rgba(59, 130, 246, 0.2)', 
            borderRadius: '4px', 
            border: '1px solid rgba(59, 130, 246, 0.5)' 
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#60a5fa' }}>Economy:</div>
            <div style={{ display: 'flex', gap: '15px', fontSize: '12px' }}>
              <div>
                <span style={{ color: '#fbbf24' }}>💰 Gold: </span>
                <span style={{ color: '#fff', fontWeight: 'bold' }}>
                  {formatGold(heroes.reduce((sum, h) => sum + (h.gold || 0), 0))}
                </span>
              </div>
              <div>
                <span style={{ color: '#60a5fa' }}>🎫 Tokens: </span>
                <span style={{ color: '#fff', fontWeight: 'bold' }}>
                  {formatTokens(heroes.reduce((sum, h) => sum + (h.tokens || 0), 0))}
                </span>
              </div>
            </div>
            {heroes.some(h => h.lastTokenClaim) && (
              <div style={{ marginTop: '5px', fontSize: '10px', color: '#9ca3af' }}>
                {heroes.map(hero => {
                  if (!hero.lastTokenClaim) return null;
                  const tokenInfo = calculateIdleTokens(hero.lastTokenClaim, hero.lastCommandTime);
                  if (tokenInfo.tokens > 0) {
                    return (
                      <div key={hero.id}>
                        {hero.name}: {tokenInfo.tokens} pending tokens ({formatIdleTime(tokenInfo.hours)} {tokenInfo.isActive ? '🟢 Active' : '💤 Idle'})
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            )}
          </div>
        )}
        
        {/* Quest Progress Display */}
        {questTrackerRef.current && (totalDamageDealt.current.size > 0 || totalHealingDone.current.size > 0 || totalDamageBlocked.current.size > 0 || bossDefeats.current > 0 || wavesCompleted.current > 0) && (
          <div style={{ 
            marginBottom: '20px', 
            padding: '10px', 
            backgroundColor: 'rgba(139, 92, 246, 0.2)', 
            borderRadius: '4px', 
            border: '1px solid rgba(139, 92, 246, 0.5)' 
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#a78bfa' }}>📜 Quest Progress:</div>
            <div style={{ fontSize: '11px', color: '#d1d5db' }}>
              {bossDefeats.current > 0 && <div style={{ marginBottom: '2px' }}>👹 Bosses Defeated: {bossDefeats.current}</div>}
              {wavesCompleted.current > 0 && <div style={{ marginBottom: '2px' }}>🌊 Waves Completed: {wavesCompleted.current}</div>}
              {Array.from(totalDamageDealt.current.entries()).map(([heroId, damage]) => {
                const hero = heroes.find(h => h.id === heroId);
                return hero ? <div key={heroId} style={{ marginBottom: '2px' }}>⚔️ {hero.name}: {formatQuestProgress(damage, 100000)} damage</div> : null;
              })}
              {Array.from(totalHealingDone.current.entries()).map(([heroId, healing]) => {
                const hero = heroes.find(h => h.id === heroId);
                return hero ? <div key={heroId} style={{ marginBottom: '2px' }}>💚 {hero.name}: {formatQuestProgress(healing, 50000)} healing</div> : null;
              })}
              {Array.from(totalDamageBlocked.current.entries()).map(([heroId, blocked]) => {
                const hero = heroes.find(h => h.id === heroId);
                return hero ? <div key={heroId} style={{ marginBottom: '2px' }}>🛡️ {hero.name}: {formatQuestProgress(blocked, 25000)} blocked</div> : null;
              })}
            </div>
          </div>
        )}
        
        <div style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Add Heroes:</div>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => addHero('tank')}
                style={{ padding: '8px 15px', fontSize: '12px' }}
              >
                + Tank
              </button>
              <button 
                onClick={() => addHero('dps')}
                style={{ padding: '8px 15px', fontSize: '12px' }}
              >
                + DPS
              </button>
              <button 
                onClick={() => addHero('ranged')}
                style={{ padding: '8px 15px', fontSize: '12px' }}
              >
                + Ranged
              </button>
              <button 
                onClick={() => addHero('healer')}
                style={{ padding: '8px 15px', fontSize: '12px' }}
              >
                + Healer
              </button>
            </div>
            <div>
              <div style={{ fontSize: '11px', marginBottom: '3px', color: '#9ca3af' }}>Specific Heroes:</div>
              <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', maxHeight: '150px', overflowY: 'auto' }}>
                {[
                  { name: 'Berserker', class: 'berserker' },
                  { name: 'Assassin', class: 'assassin' },
                  { name: 'Reaper', class: 'reaper' },
                  { name: 'Crusader', class: 'crusader' },
                  { name: 'Monk', class: 'monk' },
                  { name: 'Mage', class: 'mage' },
                  { name: 'Guardian', class: 'guardian' },
                  { name: 'Paladin', class: 'paladin' },
                  { name: 'Cleric', class: 'cleric' },
                  { name: 'Warlock', class: 'warlock' },
                  { name: 'Necromancer', class: 'necromancer' },
                  { name: 'Ranger', class: 'ranger' }
                ].map(hero => (
                  <button
                    key={hero.class}
                    onClick={() => addSpecificHero(hero.class, hero.name)}
                    style={{ padding: '4px 8px', fontSize: '10px' }}
                  >
                    + {hero.name}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginTop: '10px', padding: '8px', backgroundColor: 'rgba(139, 92, 246, 0.2)', borderRadius: '4px', border: '1px solid rgba(139, 92, 246, 0.5)' }}>
              <div style={{ fontSize: '11px', marginBottom: '5px', color: '#a78bfa', fontWeight: 'bold' }}>Load Hero from Backend:</div>
              <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Twitch username (e.g., theneverendingwar)"
                  id="load-hero-input"
                  style={{ 
                    padding: '5px 10px', 
                    fontSize: '11px', 
                    flex: 1, 
                    backgroundColor: 'rgba(0,0,0,0.3)', 
                    color: 'white', 
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '4px'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.target as HTMLInputElement;
                      if (input.value.trim()) {
                        loadHeroFromBackend(input.value.trim());
                        input.value = '';
                      }
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.getElementById('load-hero-input') as HTMLInputElement;
                    if (input?.value.trim()) {
                      loadHeroFromBackend(input.value.trim());
                      input.value = '';
                    }
                  }}
                  disabled={loadingHero}
                  style={{ 
                    padding: '5px 10px', 
                    fontSize: '11px', 
                    backgroundColor: loadingHero ? '#4b5563' : '#a78bfa', 
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loadingHero ? 'not-allowed' : 'pointer',
                    opacity: loadingHero ? 0.5 : 1
                  }}
                >
                  {loadingHero ? 'Loading...' : 'Load Hero'}
                </button>
              </div>
              <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '5px' }}>
                Loads hero with skills from skill page. Uses active hero for the user.
              </div>
            </div>
          </div>
          
          {/* Raid System */}
          <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: 'rgba(139, 92, 246, 0.2)', borderRadius: '4px', border: '1px solid rgba(139, 92, 246, 0.5)' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#a78bfa' }}>⚔️ Raids:</div>
            {activeRaid && raidData ? (
              <div style={{ fontSize: '11px', color: '#d1d5db', marginBottom: '10px' }}>
                <div style={{ fontWeight: 'bold', color: '#a78bfa', marginBottom: '5px' }}>
                  {raidData.name} ({raidData.difficulty.toUpperCase()})
                </div>
                <div>Wave: {activeRaid.currentWave} / {activeRaid.maxWaves}</div>
                {enemies.some(e => e.name === raidData.boss.name) && (
                  <div>
                    Boss HP: {Math.floor((enemies.find(e => e.name === raidData.boss.name)?.hp || 0) / activeRaid.bossMaxHp * 100)}%
                  </div>
                )}
                <button
                  onClick={() => {
                    setActiveRaid(null);
                    setRaidData(null);
                    setEnemies([]);
                  }}
                  style={{ 
                    marginTop: '5px', 
                    padding: '4px 8px', 
                    fontSize: '10px', 
                    backgroundColor: '#dc2626', 
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel Raid
                </button>
              </div>
            ) : (
              <div style={{ fontSize: '11px' }}>
                {/* Elder Dragon Quick Test Buttons */}
                <div style={{ marginBottom: '10px', padding: '8px', backgroundColor: 'rgba(168, 85, 247, 0.2)', borderRadius: '4px', border: '1px solid rgba(168, 85, 247, 0.5)' }}>
                  <div style={{ marginBottom: '5px', color: '#c084fc', fontWeight: 'bold' }}>🐉 Elder Dragon Raid Boss (Test):</div>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => startRaid('elder_dragon_normal')}
                      disabled={heroes.length < 4}
                      style={{
                        padding: '6px 12px',
                        fontSize: '11px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: heroes.length < 4 ? 'not-allowed' : 'pointer',
                        opacity: heroes.length < 4 ? 0.5 : 1,
                        fontWeight: 'bold'
                      }}
                      title="Elder Dragon (Normal) - 80k HP, Level 28, 4 waves - Requires 4 heroes"
                    >
                      Elder Dragon (Normal)
                    </button>
                    <button
                      onClick={() => startRaid('elder_dragon_heroic')}
                      disabled={heroes.length < 5}
                      style={{
                        padding: '6px 12px',
                        fontSize: '11px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: heroes.length < 5 ? 'not-allowed' : 'pointer',
                        opacity: heroes.length < 5 ? 0.5 : 1,
                        fontWeight: 'bold'
                      }}
                      title="Elder Dragon (Heroic) - 200k HP, Level 45, 5 waves - Requires 5 heroes"
                    >
                      Elder Dragon (Heroic)
                    </button>
                    <button
                      onClick={() => startRaid('elder_dragon_mythic')}
                      disabled={heroes.length < 6}
                      style={{
                        padding: '6px 12px',
                        fontSize: '11px',
                        backgroundColor: '#a855f7',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: heroes.length < 6 ? 'not-allowed' : 'pointer',
                        opacity: heroes.length < 6 ? 0.5 : 1,
                        fontWeight: 'bold'
                      }}
                      title="Elder Dragon (Mythic) - 500k HP, Level 60, 6 waves - Requires 6 heroes"
                    >
                      Elder Dragon (Mythic)
                    </button>
                  </div>
                </div>
                
                <div style={{ marginBottom: '5px', color: '#9ca3af' }}>All Raids:</div>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  {SAMPLE_RAIDS.map(raid => (
                    <button
                      key={raid.id}
                      onClick={() => startRaid(raid.id)}
                      disabled={heroes.length < raid.minPlayers}
                      style={{
                        padding: '5px 10px',
                        fontSize: '10px',
                        backgroundColor: raid.difficulty === 'normal' ? '#10b981' : 
                                        raid.difficulty === 'heroic' ? '#3b82f6' : '#a855f7',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: heroes.length < raid.minPlayers ? 'not-allowed' : 'pointer',
                        opacity: heroes.length < raid.minPlayers ? 0.5 : 1
                      }}
                      title={`${raid.name} - ${raid.waves} waves - Requires ${raid.minPlayers} heroes`}
                    >
                      {raid.name}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '5px' }}>
                  Requires {SAMPLE_RAIDS[0]?.minPlayers || 3}+ heroes
                </div>
              </div>
            )}
          </div>
          
          {/* Queue & Raid Watching */}
          <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: 'rgba(59, 130, 246, 0.2)', borderRadius: '4px', border: '1px solid rgba(59, 130, 246, 0.5)' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#60a5fa' }}>👁️ Watch Queue/Raid:</div>
            <div style={{ fontSize: '11px', marginBottom: '10px' }}>
              <div style={{ marginBottom: '5px' }}>
                <input
                  type="text"
                  placeholder="Raid Instance ID"
                  id="watch-raid-input"
                  style={{ 
                    padding: '4px 8px', 
                    fontSize: '10px', 
                    width: '200px', 
                    backgroundColor: 'rgba(0,0,0,0.3)', 
                    color: 'white', 
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '4px',
                    marginRight: '5px'
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.getElementById('watch-raid-input') as HTMLInputElement;
                    if (input?.value.trim()) {
                      loadRaidParticipants(input.value.trim());
                      input.value = '';
                    }
                  }}
                  style={{ 
                    padding: '4px 8px', 
                    fontSize: '10px', 
                    backgroundColor: '#3b82f6', 
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Load Raid
                </button>
              </div>
              <div style={{ marginBottom: '5px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={async () => {
                    try {
                      // Get user ID (prefer twitchId)
                      const userId = user?.twitchId || user?.id || '146729989';
                      if (!user) {
                        alert('Please log in to create a test raid');
                        return;
                      }
                      const result = await raidAPI.createTestRaidInstance(userId, 'corrupted_temple');
                      if (result.success) {
                        setTestRaidModal({ show: true, instanceId: result.instanceId, raidName: 'Test Raid' });
                        // Open in new tab
                        window.open(`/browser-source/raid/${result.instanceId}`, '_blank');
                      }
                    } catch (error: any) {
                      alert(`Failed to create test raid: ${error.response?.data?.error || error.message}`);
                    }
                  }}
                  style={{ 
                    padding: '6px 12px', 
                    fontSize: '11px', 
                    backgroundColor: '#10b981', 
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  🧪 Create Test Raid
                </button>
                <button
                  onClick={async () => {
                    try {
                      // Get user ID (prefer twitchId)
                      const userId = user?.twitchId || user?.id || '146729989';
                      if (!user) {
                        alert('Please log in to create a test raid');
                        return;
                      }
                      const result = await raidAPI.createTestRaidInstance(userId, 'elder_dragon_normal');
                      if (result.success) {
                        setTestRaidModal({ show: true, instanceId: result.instanceId, raidName: '🐉 Elder Dragon Raid' });
                        // Open in new tab
                        window.open(`/browser-source/raid/${result.instanceId}`, '_blank');
                      }
                    } catch (error: any) {
                      alert(`Failed to create Elder Dragon test raid: ${error.response?.data?.error || error.message}`);
                    }
                  }}
                  style={{ 
                    padding: '6px 12px', 
                    fontSize: '11px', 
                    backgroundColor: '#a855f7', 
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  🐉 Create Elder Dragon Raid
                </button>
              </div>
              <div style={{ fontSize: '9px', color: '#9ca3af', marginTop: '5px' }}>
                Enter raid instance ID to load all participants and start the raid. For scheduled raids, this will auto-load when the raid starts.
              </div>
            </div>
            {watchingRaidInstance && (
              <div style={{ fontSize: '10px', color: '#60a5fa', marginTop: '5px' }}>
                👁️ Watching: {watchingRaidInstance}
              </div>
            )}
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Add Enemies:</div>
            <div style={{ marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                Wave: {waveCount} | Party: {heroes.length} | Avg Level: {heroes.length > 0 ? calculateAveragePartyLevel(heroes).toFixed(1) : 'N/A'}
                {heroes.length > 0 && (
                  <span style={{ marginLeft: '5px', color: '#a78bfa' }}>
                    | Gear Score: {Math.floor(calculateAverageGearScore(heroes))}
                  </span>
                )}
              </div>
              <button
                onClick={() => setWaveCount(prev => Math.max(1, prev - 1))}
                style={{ padding: '4px 8px', fontSize: '11px' }}
              >
                - Wave
              </button>
              <button
                onClick={() => setWaveCount(prev => prev + 1)}
                style={{ padding: '4px 8px', fontSize: '11px' }}
              >
                + Wave
              </button>
            </div>
            <div style={{ marginBottom: '5px' }}>
              <button
                onClick={() => {
                  const pack = spawnRandomEncounter();
                  if (pack) {
                    pack.enemies.forEach(enemy => {
                      addEnemy(enemy.name, pack.packSize);
                    });
                  } else {
                  }
                }}
                style={{ padding: '8px 15px', fontSize: '12px', backgroundColor: '#9333ea', color: 'white', fontWeight: 'bold' }}
              >
                🎲 Random Encounter (40% chance)
              </button>
              <button
                onClick={() => {
                  const packSize = getPackSize();
                  const enemyNames = generateEnemyPack(packSize);
                  enemyNames.forEach(name => {
                    addEnemy(name, packSize);
                  });
                }}
                style={{ padding: '8px 15px', fontSize: '12px', backgroundColor: '#3b82f6', color: 'white', marginLeft: '5px' }}
              >
                📦 Spawn Pack (1-3 enemies)
              </button>
              <button
                onClick={() => {
                  setEnemies([]);
                  enemyRefs.current.clear();
                  demonLordFlying.current.clear();
                  demonLordTransitionStarted.current.clear();
                  werewolfTransformed.current.clear();
                }}
                style={{ padding: '8px 15px', fontSize: '12px', backgroundColor: '#ef4444', color: 'white', marginLeft: '5px' }}
              >
                🗑️ Clear All Enemies
              </button>
              <button
                onClick={() => {
                  if (!isCombatActive()) {
                    processCombatRound();
                  } else {
                  }
                }}
                style={{ padding: '8px 15px', fontSize: '12px', backgroundColor: '#10b981', color: 'white', marginLeft: '5px', fontWeight: 'bold' }}
              >
                ⚔️ Start Combat Round
              </button>
              
              {/* Adventure Loop Controls */}
              <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#1a1a2e', borderRadius: '5px', border: '1px solid #16213e' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#fff' }}>Adventure Loop:</div>
                <div style={{ marginBottom: '5px', color: '#aaa', fontSize: '12px' }}>
                  Wave: {waveCount} | Ticks: {adventureTickCount} | Status: {isAdventuring ? '🟢 Active' : '🔴 Inactive'}
                </div>
                <button
                  onClick={() => {
                    if (isAdventuring) {
                      setIsAdventuring(false);
                      setWaveCount(1);
                      setAdventureTickCount(0);
                    } else {
                      setIsAdventuring(true);
                      setAdventureTickCount(0);
                      setLastAdventureTick(Date.now());
                    }
                  }}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    backgroundColor: isAdventuring ? '#dc2626' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {isAdventuring ? '⏸️ Stop Adventure' : '▶️ Start Adventure'}
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', maxHeight: '200px', overflowY: 'auto' }}>
              {['Kobold Warrior', 'Baby Dragon', 'Imp', 'Lizardman', 'Masked Orc', 'Werewolf', 'Skeleton Mage', 'Witch', 'Mimic', 'Gryphon', 'Minotaur', 'Headless Horseman', 'Adult Dragon', 'Demon Lord'].map(enemyName => (
                <button
                  key={enemyName}
                  onClick={() => addEnemy(enemyName)}
                  style={{ padding: '5px 10px', fontSize: '11px' }}
                >
                  + {enemyName}
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* Hero Controls */}
        {heroes.map(hero => (
          <div key={hero.id} style={{ marginBottom: '15px', padding: '10px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{hero.name} ({hero.role})</div>
            <div style={{ fontSize: '12px', marginBottom: '5px' }}>
              HP: {hero.hp} / {hero.maxHp}
              {hero.shield && <span style={{ color: '#60a5fa' }}> | Shield: {hero.shield}</span>}
              {hero.attack && <span style={{ color: '#ef4444' }}> | ATK: {hero.attack}</span>}
              {hero.defense && <span style={{ color: '#60a5fa' }}> | DEF: {hero.defense}</span>}
              {hero.critChance && <span style={{ color: '#ffd700' }}> | CRIT: {Math.round(hero.critChance * 100)}%</span>}
              {hero.xp !== undefined && hero.maxXp !== undefined && (
                <span style={{ color: '#10b981' }}> | XP: {Math.floor(hero.xp)}/{hero.maxXp} ({Math.round((hero.xp / hero.maxXp) * 100)}%)</span>
              )}
              {hero.skillPoints !== undefined && (
                <span style={{ color: '#a78bfa' }}> | Skill Points: {hero.skillPoints}</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              <button onClick={() => testHeroAttack(hero.id)} style={{ padding: '5px 10px', fontSize: '12px' }}>Attack</button>
              <button onClick={() => testHeroHurt(hero.id)} style={{ padding: '5px 10px', fontSize: '12px' }}>Hurt</button>
              <button 
                onClick={() => {
                  // Grant travel XP (+3)
                  setHeroes(prev => prev.map(h => {
                    if (h.id !== hero.id) return h;
                    if (h.xp === undefined) h.xp = 0;
                    if (h.maxXp === undefined) h.maxXp = 100 + (h.level * 10);
                    
                    const newXp = h.xp + 3;
                    let updatedHero = { ...h, xp: newXp };
                    
                    // Handle level-ups
                    while (updatedHero.xp >= updatedHero.maxXp) {
                      const oldLevel = updatedHero.level;
                      const newLevel = oldLevel + 1;
                      const newMaxXp = Math.floor(updatedHero.maxXp * 1.5);
                      const hpRatio = updatedHero.hp / updatedHero.maxHp;
                      const levelStatIncrease = 1.05;
                      const newMaxHp = Math.floor(updatedHero.maxHp * levelStatIncrease);
                      const newAttack = Math.floor((updatedHero.attack || 200) * levelStatIncrease);
                      const newDefense = Math.floor((updatedHero.defense || 100) * levelStatIncrease);
                      
                      // Grant 1 skill point per level-up
                      const newSkillPoints = (updatedHero.skillPoints || 0) + 1;
                      
                      updatedHero = {
                        ...updatedHero,
                        level: newLevel,
                        xp: updatedHero.xp - updatedHero.maxXp,
                        maxXp: newMaxXp,
                        maxHp: newMaxHp,
                        hp: Math.floor(newMaxHp * hpRatio),
                        attack: newAttack,
                        defense: newDefense,
                        skillPoints: newSkillPoints
                      };
                      
                      // Trigger level-up animation
                      setLevelingUpHeroes(prev => new Set(prev).add(h.id));
                    }
                    return updatedHero;
                  }));
                  // Show XP gain combat text
                  showScrollingCombatText(`battle-hero-${hero.id}`, 3, 'xp', true);
                }}
                style={{ padding: '5px 10px', fontSize: '12px', backgroundColor: '#10b981', color: 'white' }}
              >
                ✨ Travel XP (+3)
              </button>
              <button 
                onClick={() => levelUpHero(hero.id)}
                style={{ padding: '5px 10px', fontSize: '12px', backgroundColor: '#8b5cf6', color: 'white' }}
              >
                ⬆️ Level Up
              </button>
              {hero.role === 'berserker' && (
                <button onClick={() => testEnrage(hero.id)} style={{ padding: '5px 10px', fontSize: '12px', backgroundColor: '#dc2626', color: 'white' }}>⚔️💥 Enrage</button>
              )}
              {hero.role === 'assassin' && (
                <button onClick={() => testAbilityEffect(hero.id, 'backstab')} style={{ padding: '5px 10px', fontSize: '12px', backgroundColor: '#4a5568', color: 'white' }}>🗝️ Backstab</button>
              )}
              {hero.role === 'reaper' && (
                <button onClick={() => testAbilityEffect(hero.id, 'deathStrike')} style={{ padding: '5px 10px', fontSize: '12px', backgroundColor: '#6b21a8', color: 'white' }}>💀 Death Strike</button>
              )}
              {hero.role === 'crusader' && (
                <button onClick={() => testAbilityEffect(hero.id, 'holyStrike')} style={{ padding: '5px 10px', fontSize: '12px', backgroundColor: '#fbbf24', color: '#000' }}>🗡️ Holy Strike</button>
              )}
              <button onClick={() => testHeroDeath(hero.id)} style={{ padding: '5px 10px', fontSize: '12px', backgroundColor: '#dc2626', color: 'white' }}>Death</button>
              <button onClick={() => testHealing(hero.id)} style={{ padding: '5px 10px', fontSize: '12px', backgroundColor: '#10b981', color: 'white' }}>Heal</button>
              <button onClick={() => addShield(hero.id)} style={{ padding: '5px 10px', fontSize: '12px', backgroundColor: '#60a5fa' }}>Overheal (+Shield)</button>
              <button onClick={() => testCombatText(`battle-hero-${hero.id}`, true)} style={{ padding: '5px 10px', fontSize: '12px' }}>SCT</button>
              <button onClick={() => testCritText(`battle-hero-${hero.id}`, true)} style={{ padding: '5px 10px', fontSize: '12px', backgroundColor: '#ffd700', color: '#000' }}>Crit</button>
              <button onClick={() => testDotText(`battle-hero-${hero.id}`, true)} style={{ padding: '5px 10px', fontSize: '12px', backgroundColor: '#9333ea', color: 'white' }}>DoT</button>
              <button 
                onClick={() => {
                  // Test quest complete combat text
                  showScrollingCombatText(`battle-hero-${hero.id}`, 'QUEST COMPLETE: Slayer', 'questcomplete', true);
                }} 
                style={{ padding: '5px 10px', fontSize: '12px', backgroundColor: '#10b981', color: 'white' }}
              >
                📜 Quest Complete
              </button>
              {enemies.length > 0 && (
                <button onClick={() => testProjectile(hero.id, enemies[0].id)} style={{ padding: '5px 10px', fontSize: '12px' }}>Projectile</button>
              )}
              <button 
                onClick={() => toggleHeroFacing(hero.id, hero.role)} 
                style={{ padding: '5px 10px', fontSize: '12px', backgroundColor: '#8b5cf6' }}
                title="Toggle facing direction (saves for all heroes of this class)"
              >
                ↻ Face {(heroFacings[hero.id] || getSavedFacing(HERO_FACING_STORAGE_KEY, hero.role)) === 'right' ? 'Left' : 'Right'}
              </button>
              <button onClick={() => removeHero(hero.id)} style={{ padding: '5px 10px', fontSize: '12px', backgroundColor: '#ef4444', color: 'white' }}>Remove</button>
            </div>
            {/* Buff/Debuff Controls */}
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
              <div style={{ fontSize: '11px', marginBottom: '4px', color: '#10b981' }}>Buffs:</div>
              <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <button onClick={() => addHeroBuff(hero.id, 'ironSkin')} style={{ padding: '3px 6px', fontSize: '10px', backgroundColor: '#3b82f6' }}>🛡️ Iron Skin</button>
                <button onClick={() => addHeroBuff(hero.id, 'divineGrace')} style={{ padding: '3px 6px', fontSize: '10px', backgroundColor: '#10b981' }}>✨ Divine Grace</button>
                <button onClick={() => addHeroBuff(hero.id, 'criticalStrike')} style={{ padding: '3px 6px', fontSize: '10px', backgroundColor: '#fbbf24' }}>⚡ Crit Strike</button>
                <button onClick={() => addHeroBuff(hero.id, 'regeneration')} style={{ padding: '3px 6px', fontSize: '10px', backgroundColor: '#10b981' }}>💚 Regeneration</button>
                <button onClick={() => addHeroBuff(hero.id, 'attackBuff')} style={{ padding: '3px 6px', fontSize: '10px', backgroundColor: '#ef4444' }}>⚔️ Attack</button>
                <button onClick={() => addHeroBuff(hero.id, 'defenseBuff')} style={{ padding: '3px 6px', fontSize: '10px', backgroundColor: '#60a5fa' }}>🛡️ Defense</button>
              </div>
              <div style={{ fontSize: '11px', marginBottom: '4px', color: '#ef4444' }}>Debuffs:</div>
              <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                <button onClick={() => addHeroDebuff(hero.id, 'weaken')} style={{ padding: '3px 6px', fontSize: '10px', backgroundColor: '#9b59b6' }}>💔 Weaken</button>
                <button onClick={() => addHeroDebuff(hero.id, 'vulnerable')} style={{ padding: '3px 6px', fontSize: '10px', backgroundColor: '#e74c3c' }}>🛡️💥 Vulnerable</button>
                <button onClick={() => addHeroDebuff(hero.id, 'poison')} style={{ padding: '3px 6px', fontSize: '10px', backgroundColor: '#27ae60' }}>☠️ Poison</button>
                <button onClick={() => addHeroDebuff(hero.id, 'bleed')} style={{ padding: '3px 6px', fontSize: '10px', backgroundColor: '#c0392b' }}>🩸 Bleed</button>
                <button onClick={() => addHeroDebuff(hero.id, 'burn')} style={{ padding: '3px 6px', fontSize: '10px', backgroundColor: '#e67e22' }}>🔥 Burn</button>
                <button onClick={() => addHeroDebuff(hero.id, 'corruption')} style={{ padding: '3px 6px', fontSize: '10px', backgroundColor: '#8e44ad' }}>😈 Corruption</button>
                <button onClick={() => addHeroDebuff(hero.id, 'stunned')} style={{ padding: '3px 6px', fontSize: '10px', backgroundColor: '#f39c12' }}>💫 Stun</button>
                <button onClick={() => addHeroDebuff(hero.id, 'cursed')} style={{ padding: '3px 6px', fontSize: '10px', backgroundColor: '#7d3c98' }}>😈 Curse</button>
              </div>
            </div>
            {/* Skill System */}
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
              <div style={{ fontSize: '11px', marginBottom: '4px', color: '#a78bfa', fontWeight: 'bold' }}>
                Skills ({hero.skillPoints || 0} points available)
              </div>
              {(() => {
                const categoryMap: Record<string, 'tank' | 'healer' | 'dps'> = {
                  'guardian': 'tank', 'paladin': 'tank', 'warden': 'tank', 'bloodknight': 'tank', 'vanguard': 'tank', 'brewmaster': 'tank',
                  'berserker': 'dps', 'crusader': 'dps', 'assassin': 'dps', 'reaper': 'dps', 'bladedancer': 'dps', 'monk': 'dps', 'stormwarrior': 'dps', 'hunter': 'dps',
                  'mage': 'dps', 'warlock': 'dps', 'ranger': 'dps', 'necromancer': 'dps', 'shadowpriest': 'dps', 'mooncaller': 'dps', 'stormcaller': 'dps', 'frostmage': 'dps', 'firemage': 'dps', 'dragonsorcerer': 'dps',
                  'cleric': 'healer', 'atoner': 'healer', 'druid': 'healer', 'lightbringer': 'healer', 'shaman': 'healer', 'mistweaver': 'healer', 'chronomancer': 'healer', 'bard': 'healer'
                };
                const category = categoryMap[hero.role.toLowerCase()] || 'dps';
                const skillTree = getSkillTree(hero.role, category);
                const totalAllocated = getTotalSkillPoints(hero.skills);
                const availablePoints = hero.skillPoints || 0;
                
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                    {skillTree.map((skill) => {
                      const skillData = hero.skills?.[skill.id];
                      const points = skillData?.points || 0;
                      const canAllocate = availablePoints > 0 && points < skill.maxPoints;
                      const canDeallocate = points > 0;
                      
                      return (
                        <div key={skill.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', padding: '2px' }}>
                          <span style={{ flex: 1, color: points > 0 ? '#a78bfa' : '#9ca3af' }}>
                            {skill.name} ({points}/{skill.maxPoints}): {skill.description}
                          </span>
                          <button
                            onClick={() => {
                              if (canAllocate) {
                                setHeroes(prev => prev.map(h => {
                                  if (h.id !== hero.id) return h;
                                  const newSkills = { ...(h.skills || {}) };
                                  if (!newSkills[skill.id]) {
                                    newSkills[skill.id] = { points: 0 };
                                  }
                                  newSkills[skill.id] = { points: newSkills[skill.id].points + 1 };
                                  return {
                                    ...h,
                                    skills: newSkills,
                                    skillPoints: (h.skillPoints || 0) - 1
                                  };
                                }));
                              }
                            }}
                            disabled={!canAllocate}
                            style={{
                              padding: '2px 6px',
                              fontSize: '9px',
                              backgroundColor: canAllocate ? '#a78bfa' : '#4b5563',
                              color: 'white',
                              border: 'none',
                              cursor: canAllocate ? 'pointer' : 'not-allowed',
                              opacity: canAllocate ? 1 : 0.5
                            }}
                          >
                            +
                          </button>
                          <button
                            onClick={() => {
                              if (canDeallocate) {
                                setHeroes(prev => prev.map(h => {
                                  if (h.id !== hero.id) return h;
                                  const newSkills = { ...(h.skills || {}) };
                                  if (newSkills[skill.id]) {
                                    newSkills[skill.id] = { points: Math.max(0, newSkills[skill.id].points - 1) };
                                    if (newSkills[skill.id].points === 0) {
                                      delete newSkills[skill.id];
                                    }
                                  }
                                  return {
                                    ...h,
                                    skills: newSkills,
                                    skillPoints: (h.skillPoints || 0) + 1
                                  };
                                }));
                              }
                            }}
                            disabled={!canDeallocate}
                            style={{
                              padding: '2px 6px',
                              fontSize: '9px',
                              backgroundColor: canDeallocate ? '#ef4444' : '#4b5563',
                              color: 'white',
                              border: 'none',
                              cursor: canDeallocate ? 'pointer' : 'not-allowed',
                              opacity: canDeallocate ? 1 : 0.5
                            }}
                          >
                            -
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        ))}
        {/* Combat Round Button - Moved to enemy controls section */}
        {heroes.length > 0 && enemies.length > 0 && (
          <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: 'rgba(255, 215, 0, 0.2)', borderRadius: '4px', border: '1px solid rgba(255, 215, 0, 0.5)' }}>
            {initiativeOrder.length > 0 && (
              <div style={{ marginTop: '10px', fontSize: '11px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#ffd700' }}>Turn Order:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '150px', overflowY: 'auto' }}>
                  {initiativeOrder.map((combatant, index) => (
                    <div 
                      key={`${combatant.type}-${combatant.id}`}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '2px 5px',
                        backgroundColor: combatant.type === 'hero' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        borderRadius: '2px',
                        fontSize: '10px'
                      }}
                    >
                      <span>
                        {index + 1}. {combatant.name} ({combatant.type === 'hero' ? 'Hero' : 'Enemy'})
                      </span>
                      <span style={{ color: '#ffd700' }}>
                        Init: {combatant.initiative} (Dex: {combatant.dexterity})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {/* Enemy Controls */}
        {enemies.map(enemy => (
          <div key={enemy.id} style={{ marginBottom: '15px', padding: '10px', backgroundColor: 'rgba(255,0,0,0.1)', borderRadius: '4px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
              {enemy.name}
              {enemy.level && <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: '5px', fontWeight: 'normal' }}>Lv.{enemy.level}</span>}
            </div>
            <div style={{ fontSize: '12px', marginBottom: '5px' }}>
              HP: {enemy.hp} / {enemy.maxHp}
              {enemy.attack && <span style={{ color: '#ef4444' }}> | ATK: {enemy.attack}</span>}
              {enemy.defense && <span style={{ color: '#60a5fa' }}> | DEF: {enemy.defense}</span>}
            </div>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              <button onClick={() => testEnemyAttack(enemy.id)} style={{ padding: '5px 10px', fontSize: '12px' }}>Attack</button>
              <button onClick={() => testEnemyHurt(enemy.id)} style={{ padding: '5px 10px', fontSize: '12px' }}>Hurt</button>
              <button onClick={() => testEnemyDeath(enemy.id)} style={{ padding: '5px 10px', fontSize: '12px', backgroundColor: '#dc2626', color: 'white' }}>Death</button>
              {enemy.name === 'Werewolf' && (
                <button onClick={() => testEnemyTransformation(enemy.id)} style={{ padding: '5px 10px', fontSize: '12px', backgroundColor: '#9333ea', color: 'white' }}>Transform</button>
              )}
              {heroes.length > 0 && (
                <button onClick={() => testEnemyProjectile(enemy.id, heroes[0].id)} style={{ padding: '5px 10px', fontSize: '12px', backgroundColor: '#f59e0b' }}>Projectile</button>
              )}
              <button onClick={() => testCombatText(`battle-enemy-${enemy.id}`, false)} style={{ padding: '5px 10px', fontSize: '12px' }}>SCT</button>
              <button onClick={() => testCritText(`battle-enemy-${enemy.id}`, false)} style={{ padding: '5px 10px', fontSize: '12px', backgroundColor: '#ffd700', color: '#000' }}>Crit</button>
              <button onClick={() => testDotText(`battle-enemy-${enemy.id}`, false)} style={{ padding: '5px 10px', fontSize: '12px', backgroundColor: '#9333ea', color: 'white' }}>DoT</button>
              <button 
                onClick={() => toggleEnemyFacing(enemy.id, enemy.name)} 
                style={{ padding: '5px 10px', fontSize: '12px', backgroundColor: '#8b5cf6' }}
                title="Toggle facing direction (saves for all enemies of this type)"
              >
                ↻ Face {(enemyFacings[enemy.id] || getSavedFacing(ENEMY_FACING_STORAGE_KEY, enemy.name)) === 'right' ? 'Left' : 'Right'}
              </button>
              <button onClick={() => removeEnemy(enemy.id)} style={{ padding: '5px 10px', fontSize: '12px', backgroundColor: '#ef4444', color: 'white' }}>Remove</button>
            </div>
            {/* Buff/Debuff Controls */}
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
              <div style={{ fontSize: '11px', marginBottom: '4px', color: '#10b981' }}>Buffs:</div>
              <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <button onClick={() => addEnemyBuff(enemy.id, 'attackBuff')} style={{ padding: '3px 6px', fontSize: '10px', backgroundColor: '#ef4444' }}>⚔️ Attack</button>
                <button onClick={() => addEnemyBuff(enemy.id, 'defenseBuff')} style={{ padding: '3px 6px', fontSize: '10px', backgroundColor: '#60a5fa' }}>🛡️ Defense</button>
              </div>
              <div style={{ fontSize: '11px', marginBottom: '4px', color: '#ef4444' }}>Debuffs:</div>
              <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                <button onClick={() => addEnemyDebuff(enemy.id, 'weaken')} style={{ padding: '3px 6px', fontSize: '10px', backgroundColor: '#9b59b6' }}>💔 Weaken</button>
                <button onClick={() => addEnemyDebuff(enemy.id, 'vulnerable')} style={{ padding: '3px 6px', fontSize: '10px', backgroundColor: '#e74c3c' }}>🛡️💥 Vulnerable</button>
                <button onClick={() => addEnemyDebuff(enemy.id, 'poison')} style={{ padding: '3px 6px', fontSize: '10px', backgroundColor: '#27ae60' }}>☠️ Poison</button>
                <button onClick={() => addEnemyDebuff(enemy.id, 'bleed')} style={{ padding: '3px 6px', fontSize: '10px', backgroundColor: '#c0392b' }}>🩸 Bleed</button>
                <button onClick={() => addEnemyDebuff(enemy.id, 'burn')} style={{ padding: '3px 6px', fontSize: '10px', backgroundColor: '#e67e22' }}>🔥 Burn</button>
                <button onClick={() => addEnemyDebuff(enemy.id, 'corruption')} style={{ padding: '3px 6px', fontSize: '10px', backgroundColor: '#8e44ad' }}>😈 Corruption</button>
                <button onClick={() => addEnemyDebuff(enemy.id, 'stunned')} style={{ padding: '3px 6px', fontSize: '10px', backgroundColor: '#f39c12' }}>💫 Stun</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}
      {/* Battlefield */}
      <div style={{
        position: 'absolute', // Keep absolute for positioning at bottom
        bottom: '100px',
        width: '100%',
        height: '400px'
      }}>
        {/* Heroes - Sort by role: Tanks (front/right) last in array to be rightmost */}
        {(() => {
          // Sort heroes: tanks go to the right (near center), others fill left
          const sortedHeroes = [...heroes].sort((a, b) => {
            const tankRoles = ['guardian', 'paladin', 'warden', 'bloodknight', 'vanguard', 'brewmaster'];
            const aIsTank = tankRoles.includes(a.role.toLowerCase());
            const bIsTank = tankRoles.includes(b.role.toLowerCase());
            
            if (aIsTank && !bIsTank) return 1; // Tanks last (rightmost/near center)
            if (!aIsTank && bIsTank) return -1;
            // For same type, maintain order (by join time or ID)
            return 0;
          });
          
          return sortedHeroes.map((hero, index) => {
            // Calculate fixed left position - heroes build from center going left
            // Tanks are closest to center (rightmost), other heroes fill left
            // Use window.innerWidth or default to 1920 for browser source
            const totalWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
            const heroAreaWidth = totalWidth * (2/3); // Left 2/3 for heroes
            const tankOffset = 192; // Move tanks left by ~2 inches (192px at 96 DPI)
            const leftShift = 100; // Shift all heroes left to make room for enemies
            const heroAreaEnd = heroAreaWidth - tankOffset - leftShift; // Right edge minus offsets
            const padding = 50; // Padding from left edge
            
            // Calculate spacing to ensure all heroes fit within bounds
            const availableWidth = heroAreaEnd - padding;
            const spriteHalfWidth = 72; // Approximate half width of scaled sprite
            
            let leftPosition: number = padding + spriteHalfWidth; // Default position
            
            if (sortedHeroes.length === 1) {
              // Single hero: center them in the hero area (but not too far right)
              // Position them at about 1/3 from the left edge of the hero area
              leftPosition = padding + (availableWidth * 0.4); // 40% into the hero area
            } else {
              // Multiple heroes: position so containers touch edge-to-edge
              // Since sprites are centered with translateX(-50%), we need to account for half-widths
              const tankRoles = ['guardian', 'paladin', 'warden', 'bloodknight', 'vanguard', 'brewmaster'];
              const baseViewport = 48; // Base sprite viewport size
              
              // Helper to get hero's half-width
              const getHeroHalfWidth = (heroRole: string) => {
                const isTank = tankRoles.includes(heroRole.toLowerCase());
                const scale = isTank ? 4.5 : 3.0;
                return (baseViewport * scale) / 2;
              };
              
              // Calculate position from right to left
              // Rightmost hero's right edge is at heroAreaEnd
              // Each hero's right edge touches the next hero's left edge
              
              // Start with rightmost hero's center position
              // Rightmost hero: center = heroAreaEnd - halfWidth
              let currentRightEdge = heroAreaEnd;
              
              // Work backwards from rightmost to find this hero's position
              for (let i = sortedHeroes.length - 1; i >= index; i--) {
                const currentHero = sortedHeroes[i];
                const halfWidth = getHeroHalfWidth(currentHero.role);
                
                if (i === index) {
                  // This is our hero - calculate its center position
                  // Its right edge should be at currentRightEdge
                  leftPosition = currentRightEdge - halfWidth;
                  break;
                } else {
                  // Move left by this hero's full width to get to the next hero's right edge
                  currentRightEdge -= (halfWidth * 2); // Full width = 2 * halfWidth
                }
              }
            }
            
            // Ensure hero stays within bounds (accounting for sprite width)
            leftPosition = Math.max(padding + spriteHalfWidth, Math.min(leftPosition, heroAreaEnd - spriteHalfWidth));
            
            return (
            <div
              key={hero.id}
              style={{
                position: 'absolute',
                left: `${leftPosition}px`,
                bottom: '0px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transform: 'translateX(-50%)' // Center hero on the calculated position
              }}
            >
            {/* Hero Overhead UI - positioned above sprite container */}
            {/* The sprite container is 48px tall, scaled by 3.0 = 144px */}
            <div style={{
              position: 'absolute',
              bottom: '152px', // 144px (scaled container) + 8px gap - positioned above sprite
              left: '50%',
              transform: 'translateX(-50%)', // Center horizontally
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              zIndex: 10,
              pointerEvents: 'none' // Allow clicks to pass through
            }}>
              {/* Buff/Debuff Indicators */}
              <BuffDebuffIndicator
                buffs={hero.activeBuffs ? Object.values(hero.activeBuffs).map(buff => ({
                  name: buff.name,
                  icon: buff.icon,
                  color: buff.color,
                  remainingDuration: buff.remainingDuration,
                  value: buff.value
                })) : []}
                debuffs={hero.activeDebuffs ? Object.values(hero.activeDebuffs).map(debuff => ({
                  name: debuff.name,
                  icon: debuff.icon,
                  color: debuff.color,
                  remainingDuration: debuff.remainingDuration,
                  value: debuff.value
                })) : []}
                style={{ top: '-30px' }}
              />
              
              {/* Name and Level */}
              <div style={{
                color: '#fbbf24',
                fontSize: '14px',
                fontWeight: 'bold',
                marginBottom: '4px',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
              }}>
                {hero.name} Lv{hero.level}
              </div>
              {/* Health Bar */}
              <div style={{
                width: '120px',
                height: '8px',
                backgroundColor: 'rgba(0,0,0,0.5)',
                borderRadius: '4px',
                overflow: 'hidden',
                marginTop: '6px', // Always reserve space for shield bar (4px height + 2px margin)
                marginBottom: '2px',
                position: 'relative'
              }}>
                <div style={{
                  width: `${(hero.hp / hero.maxHp) * 100}%`,
                  height: '100%',
                  backgroundColor: '#10b981',
                  transition: 'width 0.5s ease-out',
                  position: 'relative',
                  zIndex: 1
                }} />
              </div>
              {/* Shield Bar (if active) */}
              {((hero.shield || 0) > 0) && (
                <div style={{
                  width: '120px',
                  height: '4px',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                  marginBottom: '2px',
                  position: 'relative'
                }}>
                  <div style={{
                    width: `${Math.min(((hero.shield || 0) / hero.maxHp) * 100, 100)}%`,
                    height: '100%',
                    backgroundColor: '#60a5fa',
                    transition: 'width 0.5s ease-out',
                    position: 'relative',
                    zIndex: 1
                  }} />
                </div>
              )}
              {/* HP Numbers */}
              <div style={{
                color: 'white',
                fontSize: '12px',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
              }}>
                {hero.hp} / {hero.maxHp}
              </div>
            </div>
            {/* Hero Sprite - creates its own container with id="battle-hero-{heroId}" */}
            <HeroSpriteJS
              ref={getHeroRef(hero.id)}
              heroId={hero.id}
              role={hero.role}
              facing={heroFacings[hero.id] || getSavedFacing(HERO_FACING_STORAGE_KEY, hero.role)}
              scale={(() => {
                // Tanks are 150% larger than other heroes
                const tankRoles = ['guardian', 'paladin', 'warden', 'bloodknight', 'vanguard', 'brewmaster'];
                const isTank = tankRoles.includes(hero.role.toLowerCase());
                return isTank ? 4.5 : 3.0; // 150% of 3.0 = 4.5
              })()}
              shield={hero.shield || 0}
              enrageActive={hero.classAbilityState?.enrageActive && (hero.classAbilityState.enrageExpiry ? Date.now() < hero.classAbilityState.enrageExpiry : false)}
              abilityEffect={(() => {
                const effect = abilityEffects.current.get(hero.id);
                return effect && Date.now() < effect.expiry ? effect.type : null;
              })()}
            />
          </div>
          );
          });
        })()}
        {/* Enemies */}
        {enemies.filter(e => {
          // Show alive enemies
          if (e.hp > 0) return true;
          
          // Show dead enemies that are still playing death animation
          const deathStartTime = enemyDeathStartTime.current.get(e.id);
          if (deathStartTime) {
            const animations = getEnemyAnimations(e.name);
            const deathDuration = animations?.death?.duration || 2000;
            const elapsed = Date.now() - deathStartTime;
            // Keep showing if animation hasn't completed yet (with small buffer)
            return elapsed < deathDuration + 100; // 100ms buffer
          }
          
          // If no death start time recorded but enemy is dead, show for a short time
          // This handles cases where death was triggered but start time wasn't recorded
          return deadEnemies.current.has(e.id);
        }).map((enemy, index) => {
          // Calculate scaled container height based on enemy scale
          // Scale up larger enemies: Demon Lord (5.0), Headless Horseman (4.5), Minotaur, Werewolf (3.5)
          let enemyScale = 2.5; // Default scale
          if (enemy.name === 'Demon Lord') {
            enemyScale = 5.0;
          } else if (enemy.name === 'Headless Horseman') {
            enemyScale = 4.5; // Scale up Headless Horseman even more
          } else if (enemy.name === 'Minotaur' || enemy.name === 'Werewolf') {
            enemyScale = 3.5; // Scale up these larger enemies
          }
          const scaledContainerHeight = 48 * enemyScale;
          // Adjust position higher when Demon Lord is flying (flying animation moves sprite up)
          const isFlying = enemy.name === 'Demon Lord' && demonLordFlying.current.has(enemy.id);
          const healthBarOffset = isFlying ? 60 : 0; // Move health bar up when flying
          
          // Calculate fixed left position for enemies (positioned on right side)
          // Enemies take up right 1/3 of screen (~1280px to 1920px)
          const totalWidth = 1920;
          const heroAreaWidth = totalWidth * (2/3); // Left 2/3 for heroes
          const enemyAreaStart = heroAreaWidth; // Start of enemy area (right 1/3)
          const enemyAreaWidth = totalWidth - enemyAreaStart; // Right 1/3 for enemies (~640px)
          const padding = 50; // Small padding from edges
          const availableWidth = enemyAreaWidth - (padding * 2);
          
          // Calculate spacing to ensure all enemies fit within bounds
          const minEnemySpacing = 100; // Minimum spacing between enemies
          const maxSpacing = enemies.length > 1 ? availableWidth / (enemies.length - 1) : 0;
          const enemySpacing = Math.max(minEnemySpacing, maxSpacing);
          
          let enemyLeftPosition = enemyAreaStart + padding + (index * enemySpacing);
          
          // Ensure enemy stays within bounds (accounting for sprite width ~120px with transform)
          const spriteHalfWidth = 60; // Approximate half width of scaled enemy sprite
          enemyLeftPosition = Math.max(enemyAreaStart + padding + spriteHalfWidth, 
                                      Math.min(enemyLeftPosition, totalWidth - padding - spriteHalfWidth));
          
          return (
          <div
            key={enemy.id}
            id={`battle-enemy-${enemy.id}`}
            style={{
              position: 'absolute',
              left: `${enemyLeftPosition}px`,
              bottom: '0px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transform: 'translateX(-50%)' // Center enemy on the calculated position
            }}
          >
            {/* Enemy Overhead UI */}
            {/* Position above the scaled sprite container */}
            <div style={{
              position: 'absolute',
              bottom: `${scaledContainerHeight + 8 + healthBarOffset}px`, // Position above scaled container + gap + flying offset
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              zIndex: 10,
              pointerEvents: 'none', // Allow clicks to pass through
              transition: 'bottom 0.4s ease-out' // Smooth transition when Demon Lord starts flying
            }}>
              {/* Buff/Debuff Indicators */}
              <BuffDebuffIndicator
                buffs={enemy.activeBuffs ? Object.values(enemy.activeBuffs).map(buff => ({
                  name: buff.name,
                  icon: buff.icon,
                  color: buff.color,
                  remainingDuration: buff.remainingDuration,
                  value: buff.value
                })) : []}
                debuffs={enemy.activeDebuffs ? Object.values(enemy.activeDebuffs).map(debuff => ({
                  name: debuff.name,
                  icon: debuff.icon,
                  color: debuff.color,
                  remainingDuration: debuff.remainingDuration,
                  value: debuff.value
                })) : []}
                style={{ top: '-30px' }}
              />
              
              {/* Name */}
              <div style={{
                color: 'white',
                fontSize: '14px',
                fontWeight: 'bold',
                marginBottom: '4px',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
              }}>
                {enemy.name}
              </div>
              {/* Health Bar */}
              <div style={{
                width: '120px',
                height: '8px',
                backgroundColor: 'rgba(0,0,0,0.5)',
                borderRadius: '4px',
                overflow: 'hidden',
                marginBottom: '2px',
                position: 'relative'
              }}>
                <div style={{
                  width: `${(enemy.hp / enemy.maxHp) * 100}%`,
                  height: '100%',
                  backgroundColor: '#ef4444',
                  transition: 'width 0.5s ease-out',
                  position: 'relative',
                  zIndex: 1
                }} />
              </div>
              {/* HP Numbers */}
              <div style={{
                color: 'white',
                fontSize: '12px',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
              }}>
                {enemy.hp} / {enemy.maxHp}
              </div>
            </div>
            {/* Enemy Sprite - creates its own container with id="battle-enemy-{enemyId}" */}
            <EnemySpriteJS
              ref={getEnemyRef(enemy.id)}
              enemyId={enemy.id}
              enemyType={enemy.name}
              enemyName={enemy.name}
              facing={enemyFacings[enemy.id] || getSavedFacing(ENEMY_FACING_STORAGE_KEY, enemy.name)}
              scale={
                enemy.name === 'Demon Lord' ? 5.0 :
                enemy.name === 'Headless Horseman' ? 4.5 :
                (enemy.name === 'Minotaur' || enemy.name === 'Werewolf') ? 3.5 :
                2.5
              }
              isTransformed={enemy.name === 'Werewolf' ? werewolfTransformed.current.has(enemy.id) : false}
            />
          </div>
          );
        })}
        {/* Level Up Effects */}
        {Array.from(levelingUpHeroes).map(heroId => (
          <LevelUpEffect
            key={`levelup-${heroId}`}
            heroId={heroId}
            onComplete={() => {
              setLevelingUpHeroes(prev => {
                const next = new Set(prev);
                next.delete(heroId);
                return next;
              });
            }}
          />
        ))}
      </div>

      {/* Test Raid Creation Modal */}
      {testRaidModal.show && testRaidModal.instanceId && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
          onClick={() => setTestRaidModal({ show: false })}
        >
          <div
            style={{
              backgroundColor: '#1f2937',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              border: '2px solid #8b5cf6',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ color: '#fbbf24', margin: '0 0 8px 0', fontSize: '20px', fontWeight: 'bold' }}>
                {testRaidModal.raidName || 'Test Raid'} Created!
              </h2>
              <p style={{ color: '#d1d5db', margin: 0, fontSize: '14px' }}>
                Your test raid instance has been created successfully.
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '4px', fontWeight: 'bold' }}>
                Instance ID:
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  readOnly
                  value={testRaidModal.instanceId}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    backgroundColor: '#111827',
                    border: '1px solid #374151',
                    borderRadius: '4px',
                    color: '#f3f4f6',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                  }}
                />
                <button
                  onClick={async (e) => {
                    try {
                      await navigator.clipboard.writeText(testRaidModal.instanceId!);
                      // Show temporary feedback
                      const btn = e.target as HTMLButtonElement;
                      const originalText = btn.textContent;
                      btn.textContent = '✓ Copied!';
                      btn.style.backgroundColor = '#10b981';
                      setTimeout(() => {
                        btn.textContent = originalText;
                        btn.style.backgroundColor = '#3b82f6';
                      }, 2000);
                    } catch (err) {
                      console.error('Failed to copy:', err);
                    }
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Copy ID
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#9ca3af', fontSize: '12px', marginBottom: '4px', fontWeight: 'bold' }}>
                Browser Source URL:
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/browser-source/raid/${testRaidModal.instanceId}`}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    backgroundColor: '#111827',
                    border: '1px solid #374151',
                    borderRadius: '4px',
                    color: '#f3f4f6',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                  }}
                />
                <button
                  onClick={async (e) => {
                    try {
                      const url = `${window.location.origin}/browser-source/raid/${testRaidModal.instanceId}`;
                      await navigator.clipboard.writeText(url);
                      // Show temporary feedback
                      const btn = e.target as HTMLButtonElement;
                      const originalText = btn.textContent;
                      btn.textContent = '✓ Copied!';
                      btn.style.backgroundColor = '#10b981';
                      setTimeout(() => {
                        btn.textContent = originalText;
                        btn.style.backgroundColor = '#3b82f6';
                      }, 2000);
                    } catch (err) {
                      console.error('Failed to copy:', err);
                    }
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Copy URL
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setTestRaidModal({ show: false })}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#374151',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
