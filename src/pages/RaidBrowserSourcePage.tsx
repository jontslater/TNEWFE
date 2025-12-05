/**
 * Raid Browser Source Page
 * Shows battlefield with all raid participants and enemies
 * Includes chat box for commands
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { raidAPI, heroAPI } from '../api/client';
import HeroSpriteJS, { HeroSpriteJSHandle } from '../components/HeroSpriteJS';
import EnemySprite, { EnemySpriteJSHandle } from '../components/EnemySpriteJS';
import { createProjectile } from '../utils/projectiles';
import { showScrollingCombatText } from '../utils/combatText';
import { TestHero, TestEnemy, TestBuff, TestDebuff } from './AnimationTestPage';
import { calculateSkillBonuses } from '../utils/skillSystem';
import BuffDebuffIndicator, { BuffDebuffData } from '../components/BuffDebuffIndicator';
import { generateLoot, isItemBetter } from '../utils/lootGeneration';
import { calculateRaidRewards } from '../utils/raidSystem';
import { QuestTracker, isBossEnemy, CompletedQuest } from '../utils/questTracking';
import { questAPI } from '../api/client';
import { calculateGoldFromKill } from '../utils/economySystem';
import { getRaidById } from '../data/sampleRaids';
import { calculateDamage, calculateDamageWithCrit, calculateHealing } from '../utils/combatCalculations';
import { applyDebuff, getDebuffResistance, isStunned, calculateDebuffDamageModifiers, DEBUFF_TYPES } from '../utils/debuffSystem';
import { calculateBuffModifiers, checkProcBuff, applyProcBuff, BUFF_TYPES } from '../utils/buffSystem';
import { calculateInitiative, createTurnActions, Combatant, TurnAction } from '../utils/turnBasedCombat';
import { applyClassAbility } from '../utils/classAbilities';
import { checkLastStand, checkGroupHeal, checkInstantHeal, checkAutoDispel } from '../utils/emergencyAbilities';
import { calculateHeroBaseDamage } from '../utils/heroDamage';
import { calculateSetBonuses } from '../utils/setBonuses';
import { generateBrowserSourceUrl } from '../utils/browserSource';
import { calculateEquipmentBonuses, getEquipmentHpRegen } from '../utils/equipmentBonuses';
import { getEnemyAnimations } from '../utils/spriteAnimationData';
import {
  getMechanicTarget,
  isMechanicOffCooldown,
  isMechanicActiveInPhase,
  shouldTriggerMechanic,
  calculateMechanicDamage,
  createCastInfo,
  updateCastProgress,
  isCastComplete,
  interruptCast,
  recordMechanicUsage,
  getAvailableMechanics,
  initializeBossMechanicsState,
  BossMechanicsState
} from '../utils/bossMechanics';
import { CastInfo } from '../types/BossMechanics';
import {
  detectCurrentPhase,
  checkPhaseTransition,
  getPhaseMechanics,
  applyPhaseTransition,
  getPhaseAnnouncement,
  shouldSpawnAdds
} from '../utils/bossPhases';
import { BossMechanic, BossPhase } from '../types/BossMechanics';
import { spawnAdds, getAddSpawnMessage } from '../utils/addSpawning';
import BossAbilityTimer from '../components/BossAbilityTimer';
import DamageMeter from '../components/DamageMeter';
import DeathRecap from '../components/DeathRecap';
import RaidFrames from '../components/RaidFrames';
import BossStrategyGuide from '../components/BossStrategyGuide';
import CombatLog from '../components/CombatLog';
import { initializeDamageMeterState, recordDamage, recordHealing, recordDamageTaken, calculateDamageMeters, DamageMeterState } from '../utils/damageMeters';
import { initializeDeathRecapState, recordDamageForRecap, generateDeathRecap, DeathRecapState } from '../utils/deathRecap';

// LocalStorage keys for facing preferences
const HERO_FACING_STORAGE_KEY = 'animationTest_heroFacing';
const ENEMY_FACING_STORAGE_KEY = 'animationTest_enemyFacing';

// Helper functions for localStorage with URL parameter fallback
const getSavedFacing = (key: string, spriteType: string, searchParams?: URLSearchParams): 'left' | 'right' => {
  // Elder Dragon should always face right (toward heroes) - ignore saved preferences
  if (key === ENEMY_FACING_STORAGE_KEY && spriteType === 'Elder Dragon') {
    return 'right'; // Elder Dragon faces right (toward heroes on the left)
  }
  
  // First try URL parameters (for browser source mode)
  if (searchParams) {
    const urlKey = key === HERO_FACING_STORAGE_KEY ? 'heroFacing' : 'enemyFacing';
    
    // Try getting all facing preferences from URL (stored as JSON)
    const allFacings = searchParams.get(urlKey);
    if (allFacings) {
      try {
        const prefs = JSON.parse(decodeURIComponent(allFacings));
        if (prefs && typeof prefs === 'object' && prefs[spriteType]) {
          const facing = prefs[spriteType];
          if (facing === 'left' || facing === 'right') {
            return facing;
          }
        }
      } catch (e) {
        console.warn('Failed to parse facing preferences from URL:', e);
      }
    }
    
    // Try individual facing preference (format: heroFacing_berserker or enemyFacing_Elder Dragon)
    const individualKey = `${urlKey}_${spriteType}`;
    const urlValue = searchParams.get(individualKey);
    if (urlValue === 'left' || urlValue === 'right') {
      return urlValue;
    }
  }
  
  // Fallback to localStorage
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const prefs = JSON.parse(saved);
      if (prefs && typeof prefs === 'object' && prefs[spriteType]) {
        const facing = prefs[spriteType];
        if (facing === 'left' || facing === 'right') {
          return facing;
        }
      }
    }
  } catch (e) {
    console.warn('Failed to load facing preferences:', e);
  }
  
  // Default: heroes face right (toward enemies), enemies face left (toward heroes)
  return key === HERO_FACING_STORAGE_KEY ? 'right' : 'left';
};

interface RaidParticipant {
  userId: string;
  username?: string;
  heroName?: string;
  heroLevel?: number;
  heroRole?: string;
  itemScore?: number;
  isAlive?: boolean;
  currentHp?: number;
  maxHp?: number;
}

interface CommandCooldown {
  command: string;
  lastUsed: number;
  cooldown: number; // in milliseconds
}

const COMMAND_COOLDOWNS: Record<string, number> = {
  'attack': 2000,      // 2 seconds
  'heal': 3000,       // 3 seconds
  'ability': 5000,    // 5 seconds
  'defend': 1000,     // 1 second
  'dispel': 5000,     // 5 seconds
  'rest': 300000,     // 5 minutes
  'item': 1000,       // 1 second
};

interface RaidBrowserSourcePageProps {
  instanceId?: string; // Optional prop to override useParams (for unified browser source)
}

export default function RaidBrowserSourcePage({ instanceId: propInstanceId }: RaidBrowserSourcePageProps = {}) {
  const { instanceId: paramInstanceId } = useParams<{ instanceId: string }>();
  const instanceId = propInstanceId || paramInstanceId; // Use prop if provided, otherwise use route param
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  // Browser source mode detection
  const isBrowserSource = searchParams.get('browserSource') === 'true' || searchParams.get('token') !== null;
  
  const [instance, setInstance] = useState<any>(null);
  const [heroes, setHeroes] = useState<TestHero[]>([]);
  const [enemies, setEnemies] = useState<TestEnemy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{timestamp: number, user: string, message: string, type?: string}>>([]);
  const [combatLog, setCombatLog] = useState<Array<{id: string, timestamp: number, message: string, type: string}>>([]);
  const combatLogIdCounter = useRef<number>(0);
  const processedLogIds = useRef<Set<string>>(new Set()); // Track processed log IDs to prevent duplicates
  const [commandCooldowns, setCommandCooldowns] = useState<Map<string, number>>(new Map());
  const [cooldownRemaining, setCooldownRemaining] = useState<Map<string, number>>(new Map());
  const [buttonPressed, setButtonPressed] = useState<Map<string, boolean>>(new Map());
  const [heroFacings, setHeroFacings] = useState<Record<string, 'left' | 'right'>>({});
  const [enemyFacings, setEnemyFacings] = useState<Record<string, 'left' | 'right'>>({});
  const [heroShields, setHeroShields] = useState<Record<string, number>>({});
  const combatLogRef = useRef<HTMLDivElement>(null);
  const [enemyShields, setEnemyShields] = useState<Record<string, number>>({});
  
  // Boss mechanics state
  const [bossMechanicsState, setBossMechanicsState] = useState<Map<string, BossMechanicsState>>(new Map());
  const [bossActiveCasts, setBossActiveCasts] = useState<Map<string, CastInfo[]>>(new Map());
  const [raidData, setRaidData] = useState<any>(null); // Store raid data for boss mechanics
  
  // UI state for new components
  const [showDamageMeter, setShowDamageMeter] = useState(false);
  const [showRaidFrames, setShowRaidFrames] = useState(false);
  const [showStrategyGuide, setShowStrategyGuide] = useState(false);
  const [deathRecapData, setDeathRecapData] = useState<any>(null);
  const [damageMeterState, setDamageMeterState] = useState<DamageMeterState>(initializeDamageMeterState());
  const [deathRecapState, setDeathRecapState] = useState<DeathRecapState>(initializeDeathRecapState());
  
  // Dragon container positioning (for Elder Dragon only)
  const [dragonContainerStyle, setDragonContainerStyle] = useState<{
    bottom?: string;
    right?: string;
    width?: string;
    height?: string;
  }>(() => {
    // First try URL parameters (for browser source mode)
    const urlBottom = searchParams.get('dragonContainerBottom');
    const urlRight = searchParams.get('dragonContainerRight');
    const urlWidth = searchParams.get('dragonContainerWidth');
    const urlHeight = searchParams.get('dragonContainerHeight');
    
    if (urlBottom || urlRight || urlWidth || urlHeight) {
      const urlStyle = {
        ...(urlBottom && { bottom: urlBottom }),
        ...(urlRight && { right: urlRight }),
        ...(urlWidth && { width: urlWidth }),
        ...(urlHeight && { height: urlHeight })
      };
      console.log('🐉 [Dragon] Loaded container style from URL params:', urlStyle);
      return urlStyle;
    }
    
    // In browser source mode without URL params, don't use localStorage - use new defaults
    if (isBrowserSource) {
      console.log('🐉 [Dragon] Browser source mode - using new defaults, ignoring localStorage');
      return {};
    }
    
    // Fallback to localStorage (normal mode only)
    try {
      const saved = localStorage.getItem('elderDragonContainerStyle');
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('🐉 [Dragon] Loaded container style from localStorage:', parsed);
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to load dragon container style:', e);
    }
    return {};
  });
  
  // Dragon target positioning (for Elder Dragon only)
  const [dragonTargetStyle, setDragonTargetStyle] = useState<{
    bottom?: string;
    right?: string;
  }>(() => {
    // First try URL parameters (for browser source mode)
    const urlBottom = searchParams.get('dragonTargetBottom');
    const urlRight = searchParams.get('dragonTargetRight');
    
    if (urlBottom || urlRight) {
      const urlStyle = {
        ...(urlBottom && { bottom: urlBottom }),
        ...(urlRight && { right: urlRight })
      };
      console.log('🎯 [Dragon] Loaded target style from URL params:', urlStyle);
      return urlStyle;
    }
    
    // Fallback to localStorage
    try {
      const saved = localStorage.getItem('elderDragonTargetStyle');
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('🎯 [Dragon] Loaded target style from localStorage:', parsed);
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to load dragon target style:', e);
    }
    return {};
  });
  
  // Edit mode for dragon container
  const [dragonEditMode, setDragonEditMode] = useState(false);
  // Health bar visibility toggle (default: visible)
  const [showBossHealthBar, setShowBossHealthBar] = useState(true);
  const dragonContainerRef = useRef<HTMLDivElement | null>(null);
  const dragonTargetRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);
  const isDraggingTargetRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, right: 0, bottom: 0 });
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0, right: 0, bottom: 0 });
  const targetDragStartRef = useRef({ x: 0, y: 0, right: 0, bottom: 0 });
  
  // Save dragon container style to localStorage whenever it changes
  useEffect(() => {
    if (Object.keys(dragonContainerStyle).length > 0) {
      localStorage.setItem('elderDragonContainerStyle', JSON.stringify(dragonContainerStyle));
    }
  }, [dragonContainerStyle]);
  
  // Save dragon target style to localStorage whenever it changes
  useEffect(() => {
    if (Object.keys(dragonTargetStyle).length > 0) {
      localStorage.setItem('elderDragonTargetStyle', JSON.stringify(dragonTargetStyle));
      console.log('🎯 [Dragon] Saved target style to localStorage:', dragonTargetStyle);
    }
  }, [dragonTargetStyle]);
  
  // Reload target style from localStorage when Elder Dragon is rendered (especially important for browser source mode)
  useEffect(() => {
    const elderDragon = enemies.find(e => e.name === 'Elder Dragon');
    if (elderDragon) {
      try {
        const saved = localStorage.getItem('elderDragonTargetStyle');
        if (saved) {
          const parsed = JSON.parse(saved);
          // Only update if we have valid saved values and current state is empty
          if (parsed.bottom && parsed.right && (!dragonTargetStyle.bottom || !dragonTargetStyle.right)) {
            console.log('🎯 [Dragon] Reloading target style from localStorage:', parsed);
            setDragonTargetStyle(parsed);
          }
        } else {
          console.warn('🎯 [Dragon] No saved target style found in localStorage');
        }
      } catch (e) {
        console.warn('🎯 [Dragon] Failed to reload target style:', e);
      }
    }
  }, [enemies, dragonTargetStyle]);
  
  // Force dragon position in browser source mode - verify styles are applied
  useEffect(() => {
    if (isBrowserSource && enemies.some(e => e.name === 'Elder Dragon')) {
      const container = document.getElementById('elder-dragon-container');
      if (container) {
        // Force the new default positions (reversed for sprite setup)
        container.style.setProperty('bottom', '120px', 'important');
        container.style.setProperty('right', '-128px', 'important');
        console.log('🐉 [Dragon Browser Source] Forced position via DOM:', {
          bottom: container.style.bottom,
          right: container.style.right,
          computedBottom: window.getComputedStyle(container).bottom,
          computedRight: window.getComputedStyle(container).right
        });
      }
    }
  }, [isBrowserSource, enemies]);
  
  // Handle drag and resize for dragon container
  useEffect(() => {
    if (!dragonEditMode) return;
    
    const container = document.getElementById('elder-dragon-container');
    if (!container) return;
    
    const handleMouseDown = (e: MouseEvent, type: 'drag' | 'resize') => {
      e.preventDefault();
      e.stopPropagation();
      
      const rect = container.getBoundingClientRect();
      const style = window.getComputedStyle(container);
      const right = parseFloat(style.right) || 0;
      const bottom = parseFloat(style.bottom) || 0;
      const width = parseFloat(style.width) || 0;
      const height = parseFloat(style.height) || 0;
      
      if (type === 'drag') {
        isDraggingRef.current = true;
        dragStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          right,
          bottom
        };
      } else {
        isResizingRef.current = true;
        resizeStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          width,
          height,
          right,
          bottom
        };
      }
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        const deltaX = dragStartRef.current.x - e.clientX;
        const deltaY = dragStartRef.current.y - e.clientY;
        
        const newRight = dragStartRef.current.right + deltaX;
        const newBottom = dragStartRef.current.bottom + deltaY;
        
        container.style.right = `${newRight}px`;
        container.style.bottom = `${newBottom}px`;
      } else if (isResizingRef.current) {
        const deltaX = resizeStartRef.current.x - e.clientX;
        const deltaY = resizeStartRef.current.y - e.clientY;
        
        const newWidth = resizeStartRef.current.width + deltaX;
        const newHeight = resizeStartRef.current.height - deltaY; // Invert Y because bottom increases upward
        
        container.style.width = `${Math.max(100, newWidth)}px`;
        container.style.height = `${Math.max(100, newHeight)}px`;
      }
    };
    
    const handleMouseUp = () => {
      if (isDraggingRef.current || isResizingRef.current) {
        // Save current style
        const style = window.getComputedStyle(container);
        setDragonContainerStyle({
          bottom: style.bottom,
          right: style.right,
          width: style.width,
          height: style.height
        });
      }
      isDraggingRef.current = false;
      isResizingRef.current = false;
    };
    
    // Add drag handle
    const dragHandle = container.querySelector('.dragon-drag-handle') as HTMLElement;
    if (dragHandle) {
      dragHandle.addEventListener('mousedown', (e) => handleMouseDown(e, 'drag'));
    }
    
    // Add resize handle
    const resizeHandle = container.querySelector('.dragon-resize-handle') as HTMLElement;
    if (resizeHandle) {
      resizeHandle.addEventListener('mousedown', (e) => handleMouseDown(e, 'resize'));
    }
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      if (dragHandle) {
        dragHandle.removeEventListener('mousedown', (e) => handleMouseDown(e, 'drag'));
      }
      if (resizeHandle) {
        resizeHandle.removeEventListener('mousedown', (e) => handleMouseDown(e, 'resize'));
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragonEditMode]);
  
  // Handle drag for target div
  useEffect(() => {
    if (!dragonEditMode) {
      isDraggingTargetRef.current = false;
      return;
    }
    
    const target = document.getElementById('elder-dragon-target');
    if (!target) return;
    
    const handleTargetMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const style = window.getComputedStyle(target);
      const right = parseFloat(style.right) || 0;
      const bottom = parseFloat(style.bottom) || 0;
      
      isDraggingTargetRef.current = true;
      targetDragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        right,
        bottom
      };
    };
    
    const handleTargetMouseMove = (e: MouseEvent) => {
      if (!target || !isDraggingTargetRef.current) return;
      
      const deltaX = targetDragStartRef.current.x - e.clientX;
      const deltaY = targetDragStartRef.current.y - e.clientY;
      
      const newRight = targetDragStartRef.current.right + deltaX;
      const newBottom = targetDragStartRef.current.bottom + deltaY;
      
      target.style.right = `${newRight}px`;
      target.style.bottom = `${newBottom}px`;
    };
    
    const handleTargetMouseUp = () => {
      if (!target) return;
      
      if (isDraggingTargetRef.current) {
        // Save current style
        const style = window.getComputedStyle(target);
        setDragonTargetStyle({
          bottom: style.bottom,
          right: style.right
        });
      }
      isDraggingTargetRef.current = false;
    };
    
    target.addEventListener('mousedown', handleTargetMouseDown);
    window.addEventListener('mousemove', handleTargetMouseMove);
    window.addEventListener('mouseup', handleTargetMouseUp);
    
    return () => {
      target.removeEventListener('mousedown', handleTargetMouseDown);
      window.removeEventListener('mousemove', handleTargetMouseMove);
      window.removeEventListener('mouseup', handleTargetMouseUp);
    };
  }, [dragonEditMode]);
  
  const heroRefs = useRef<Map<string, React.RefObject<HeroSpriteJSHandle>>>(new Map());
  const enemyRefs = useRef<Map<string, React.RefObject<EnemySpriteJSHandle>>>(new Map());
  const enemyDeathStartTime = useRef<Map<string, number>>(new Map()); // Track when each enemy's death animation started
  const werewolfTransformed = useRef<Set<string>>(new Set()); // Track which Werewolves have transformed
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const heroesLoadedRef = useRef<boolean>(false); // Track if heroes have been loaded
  const lastHeroHpRef = useRef<Record<string, number>>({}); // Track last HP for healing detection
  const lastEnemyHpRef = useRef<Record<string, number>>({}); // Track last HP for damage detection
  const deadEnemies = useRef<Set<string>>(new Set()); // Track defeated enemies
  const raidDataRef = useRef<any>(null); // Store raid data for loot generation
  const lastLootSCTTime = useRef<Map<string, number>>(new Map()); // Track last loot SCT time per hero for staggering
  const isCombatProcessingRef = useRef<boolean>(false); // Track if combat is currently processing
  const autoStartTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Track auto-start timeout to prevent duplicates
  
  // Quest tracking
  const questTrackerRef = useRef<QuestTracker | null>(null);
  const totalDamageDealt = useRef<Map<string, number>>(new Map());
  const totalHealingDone = useRef<Map<string, number>>(new Map());
  const totalDamageBlocked = useRef<Map<string, number>>(new Map());
  const bossDefeats = useRef<number>(0);
  
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

  // Auto-scroll combat log to bottom when new entries are added
  useEffect(() => {
    if (combatLogRef.current) {
      combatLogRef.current.scrollTop = combatLogRef.current.scrollHeight;
    }
  }, [combatLog]);
  
  // Combat Engine Supervisor (state machine)
  type CombatState = 'idle' | 'processing' | 'round_complete' | 'spawning' | 'ended';
  
  interface CombatSupervisor {
    state: CombatState;
    lastActionAt: number;
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
    lastRoundStartAt: 0,
    roundCount: 0,
    lastStateChange: {
      from: 'idle',
      to: 'idle',
      at: Date.now(),
    },
  });
  
  // State transition helper
  const setCombatState = useCallback((newState: CombatState, reason?: string): void => {
    const supervisor = combatSupervisorRef.current;
    const oldState = supervisor.state;
    
    supervisor.lastStateChange = {
      from: oldState,
      to: newState,
      at: Date.now(),
      reason,
    };
    supervisor.state = newState;
    supervisor.lastActionAt = Date.now();
    
    if (newState === 'processing') {
      supervisor.lastRoundStartAt = Date.now();
      supervisor.roundCount++;
    }
    
    console.log(`[Raid Combat Supervisor] ${oldState} → ${newState}${reason ? ` (${reason})` : ''}`);
  }, []);
  
  // State query helpers
  const isCombatActive = useCallback((): boolean => {
    return combatSupervisorRef.current.state === 'processing';
  }, []);
  
  const canStartCombat = useCallback((): boolean => {
    const state = combatSupervisorRef.current.state;
    return state === 'idle' || state === 'ended' || state === 'spawning';
  }, []);
  
  // Wait helper for async delays
  const wait = useCallback((ms: number): Promise<void> => {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }, []);
  
  const combatInitiativeRef = useRef<Combatant[]>([]); // Store initiative for current round
  const [initiativeOrder, setInitiativeOrder] = useState<Combatant[]>([]); // Turn order for combat (for display)

  useEffect(() => {
    if (!instanceId) {
      setError('Missing instance ID');
      setLoading(false);
      return;
    }

    loadInstance();
    
    // Poll for updates - reduced frequency to minimize backend calls
    // Poll every 5 seconds (increased from 2 seconds to reduce Firebase usage)
    const startPolling = () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    pollingIntervalRef.current = setInterval(() => {
        // Only poll if page is visible to save resources
        if (!document.hidden) {
      loadInstance();
        }
      }, 5000); // 5 seconds instead of 2 seconds
    };

    startPolling();

    // Pause polling when tab is hidden, resume when visible
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, clear polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      } else {
        // Page is visible, resume polling
        if (!pollingIntervalRef.current) {
          loadInstance(); // Load immediately when tab becomes visible
          startPolling();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Clean up quest tracker
      if (questTrackerRef.current) {
        questTrackerRef.current.stop();
        questTrackerRef.current = null;
      }
    };
  }, [instanceId]);

  // Spawn boss enemy when heroes are loaded and no enemies exist
  useEffect(() => {
    if (heroes.length > 0 && enemies.length === 0 && raidDataRef.current && !loading && instance) {
      const raidData = raidDataRef.current;
      const boss = raidData.boss;
      
      if (boss) {
        console.log(`🐉 [Raid] Spawning boss: ${boss.name}`);
        
        const bossEnemy: TestEnemy = {
          id: `raid-boss-${Date.now()}`,
          name: boss.name, // This should be "Elder Dragon" which maps to the sprite
          hp: instance.bossHp || boss.hp || 80000,
          maxHp: instance.bossMaxHp || boss.hp || 80000,
          attack: boss.attack || 120,
          defense: boss.defense || 60,
          level: boss.level || 28,
          xp: boss.level ? boss.level * 100 : 2800,
          activeBuffs: {},
          activeDebuffs: {},
          isBoss: true
        };
        
        setEnemies([bossEnemy]);
        console.log(`✅ [Raid] Boss spawned: ${bossEnemy.name} (${bossEnemy.hp}/${bossEnemy.maxHp} HP)`);
      }
    }
  }, [heroes.length, enemies.length, instance, loading]);

  // Update cooldowns and remaining time
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setCommandCooldowns(prev => {
        const updated = new Map(prev);
        const remaining = new Map<string, number>();
        
        for (const [command, lastUsed] of updated.entries()) {
          const cooldown = COMMAND_COOLDOWNS[command] || 0;
          const elapsed = now - lastUsed;
          if (elapsed >= cooldown) {
            updated.delete(command);
          } else {
            remaining.set(command, Math.ceil((cooldown - elapsed) / 1000));
          }
        }
        
        setCooldownRemaining(remaining);
        return updated;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);


  const loadInstance = async () => {
    if (!instanceId) return;

    try {
      // In browser source mode, don't pass userId to avoid authorization checks
      // The backend no longer requires authorization for viewing instances
      const userId = isBrowserSource ? undefined : (user?.twitchId || user?.id);
      const instanceData = await raidAPI.getRaidInstance(instanceId, userId);
      
      setInstance(instanceData);
      
      // Store raid data if available
      if (instanceData.raidId) {
        const raidData = getRaidById(instanceData.raidId);
        if (raidData) {
          raidDataRef.current = raidData;
          setRaidData(raidData);
          
          // Initialize boss mechanics state for each boss enemy
          if (raidData.boss && raidData.boss.mechanics) {
            setBossMechanicsState(prev => {
              const newState = new Map(prev);
              // We'll initialize when we encounter the boss enemy
              return newState;
            });
          }
        }
      }

      // Load heroes only once if instance is active/starting
      if ((instanceData.status === 'active' || instanceData.status === 'starting') && instanceData.participants && !heroesLoadedRef.current) {
        await loadParticipantsAsHeroes(instanceData.participants);
        heroesLoadedRef.current = true;
        
        // Initialize quest tracker when heroes are loaded
        if (!questTrackerRef.current && user?.twitchId) {
          questTrackerRef.current = new QuestTracker(
            async (updates) => {
              try {
                const response = await questAPI.updateQuestProgressBatch(user.twitchId, updates);
                return response;
              } catch (error) {
                console.error('[Quest Tracker] Error updating quest progress:', error);
                return {};
              }
            },
            (completedQuests: CompletedQuest[]) => {
              completedQuests.forEach(quest => {
                console.log(`✅ Quest completed: ${quest.questName}`);
              });
            }
          );
        }
      }
      
      // Update hero HP from instance data if heroes are already loaded
      if (heroesLoadedRef.current && instanceData.participants && heroes.length > 0) {
        setHeroes(prevHeroes => {
          return prevHeroes.map(hero => {
            const participant = instanceData.participants.find((p: RaidParticipant) => p.userId === hero.id);
            if (participant && participant.currentHp !== undefined) {
              const oldHp = lastHeroHpRef.current[hero.id] || hero.hp;
              const newHp = participant.currentHp;
              
              // Show healing SCT if HP increased
              if (newHp > oldHp && oldHp > 0) {
                const healAmount = newHp - oldHp;
                const heroElement = document.getElementById(`battle-hero-${hero.id}`);
                if (heroElement) {
                  showScrollingCombatText(`battle-hero-${hero.id}`, `+${Math.floor(healAmount)}`, 'healing', true);
                }
              }
              
              // Show damage SCT if HP decreased
              if (newHp < oldHp && newHp > 0) {
                const damageAmount = oldHp - newHp;
                const heroElement = document.getElementById(`battle-hero-${hero.id}`);
                if (heroElement) {
                  showScrollingCombatText(`battle-hero-${hero.id}`, `-${Math.floor(damageAmount)}`, 'damage', true);
                }
              }
              
              lastHeroHpRef.current[hero.id] = newHp;
              return { ...hero, hp: newHp };
            }
            return hero;
          });
        });
      }

      // Update chat and combat log from instance data
      if (instanceData.combatLog) {
        // Separate chat messages (commands and chat)
        const chatEntries = instanceData.combatLog
          .filter((log: any) => log.type === 'command' || log.type === 'chat')
          .map((log: any) => {
            // For commands, extract the command from the message
            let displayMessage = log.message;
            if (log.type === 'command' && log.command) {
              displayMessage = `!${log.command}`;
            }
            return {
              timestamp: log.timestamp || Date.now(),
              user: log.username || log.userId || 'System',
              message: displayMessage,
              type: log.type
            };
          })
          .sort((a, b) => a.timestamp - b.timestamp); // Sort by timestamp
        
        // Merge with existing chat messages to avoid losing optimistic updates
        setChatMessages(prev => {
          const merged = [...prev, ...chatEntries];
          // Remove duplicates based on timestamp and message
          const unique = merged.filter((msg, idx, self) => 
            idx === self.findIndex(m => m.timestamp === msg.timestamp && m.message === msg.message)
          );
          return unique.sort((a, b) => a.timestamp - b.timestamp).slice(-100);
        });
        
        // All combat log entries (for combat log panel)
        // Merge with existing combat log to preserve local entries
        const allLogEntries = instanceData.combatLog
          .map((log: any) => ({
            id: log.id || `backend-${log.timestamp || Date.now()}-${log.message || ''}-${Math.random()}`,
            timestamp: log.timestamp || Date.now(),
            message: log.message,
            type: log.type || 'system'
          }))
          .sort((a, b) => a.timestamp - b.timestamp); // Sort by timestamp
        
        // Merge with existing combat log entries to preserve local additions
        // Only merge entries that don't already exist (prevent duplicates from backend)
        setCombatLog(prev => {
          // Create a Set of existing log entry signatures for fast lookup
          // Use both ID and message+timestamp to catch duplicates even if IDs differ
          const existingSignatures = new Set(
            prev.map(log => {
              if (log.id) return log.id;
              // Fallback: use message + timestamp as signature
              return `${log.timestamp}-${log.message}`;
            })
          );
          
          // Also check for duplicate messages with same timestamp (within 100ms tolerance)
          const existingMessages = new Set(
            prev.map(log => `${Math.floor(log.timestamp / 100)}-${log.message}`)
          );
          
          // Filter out backend entries that already exist locally
          const newEntries = allLogEntries.filter(log => {
            const logId = log.id || `backend-${log.timestamp}-${log.message}`;
            const messageSig = `${Math.floor(log.timestamp / 100)}-${log.message}`;
            
            // Skip if ID matches or message+timestamp matches
            if (existingSignatures.has(logId) || existingMessages.has(messageSig)) {
              return false;
            }
            
            // Also check if we've processed this log ID before
            if (processedLogIds.current.has(logId)) {
              return false;
            }
            
            processedLogIds.current.add(logId);
            return true;
          });
          
          // Only add truly new entries
          if (newEntries.length > 0) {
            const merged = [...prev, ...newEntries];
            return merged.sort((a, b) => a.timestamp - b.timestamp).slice(-200);
          }
          
          return prev;
        });
      }

      // Update enemies from instance data if available
      if (instanceData.enemies && Array.isArray(instanceData.enemies)) {
        setEnemies(prevEnemies => {
          const updatedEnemies = instanceData.enemies.map((instanceEnemy: any) => {
            const existingEnemy = prevEnemies.find(e => e.id === instanceEnemy.id || e.name === instanceEnemy.name);
            if (existingEnemy) {
              // Update existing enemy
              const oldHp = lastEnemyHpRef.current[existingEnemy.id] || existingEnemy.hp;
              const newHp = instanceEnemy.hp || instanceEnemy.currentHp || existingEnemy.hp;
              
              // Show damage SCT if HP decreased
              if (newHp < oldHp && newHp > 0) {
                const damageAmount = oldHp - newHp;
                const enemyElement = document.getElementById(`battle-enemy-${existingEnemy.id}`);
                if (enemyElement) {
                  showScrollingCombatText(`battle-enemy-${existingEnemy.id}`, `-${Math.floor(damageAmount)}`, 'damage', false);
                }
              }
              
              lastEnemyHpRef.current[existingEnemy.id] = newHp;
              
              return {
                ...existingEnemy,
                hp: newHp,
                maxHp: instanceEnemy.maxHp || existingEnemy.maxHp,
                attack: instanceEnemy.attack || existingEnemy.attack,
                defense: instanceEnemy.defense || existingEnemy.defense,
                level: instanceEnemy.level || existingEnemy.level,
                xp: instanceEnemy.xp || existingEnemy.xp
              };
            } else {
              // New enemy - create from instance data
              return {
                id: instanceEnemy.id || `enemy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: instanceEnemy.name || 'Enemy',
                hp: instanceEnemy.hp || instanceEnemy.currentHp || 1000,
                maxHp: instanceEnemy.maxHp || 1000,
                attack: instanceEnemy.attack || 100,
                defense: instanceEnemy.defense || 50,
                level: instanceEnemy.level || 1,
                xp: instanceEnemy.xp || 100,
                activeBuffs: {},
                activeDebuffs: {},
                shield: instanceEnemy.shield || 0
              };
            }
          });
          
          // Remove enemies that are no longer in instance
          const instanceEnemyIds = new Set(instanceData.enemies.map((e: any) => e.id || e.name));
          return updatedEnemies.filter(e => instanceEnemyIds.has(e.id) || instanceEnemyIds.has(e.name));
        });
      }

      setError(null);
    } catch (err: any) {
      console.error('Failed to load instance:', err);
      setError(err.response?.data?.error || 'Failed to load instance');
    } finally {
      setLoading(false);
    }
  };

  const loadParticipantsAsHeroes = async (participants: RaidParticipant[]) => {
    const loadedHeroes: TestHero[] = [];

    for (const participant of participants) {
      try {
        // Skip test users that don't have heroes - create mock data instead
        if (participant.userId.startsWith('test-user-')) {
          // Create a mock hero for test users
          const mockHero: TestHero = {
            id: participant.userId,
            name: participant.heroName || participant.username || 'Test Hero',
            role: participant.heroRole || 'berserker',
            level: participant.heroLevel || 50,
            xp: 0,
            maxXp: 100 + (50 * 10),
            hp: participant.currentHp || participant.maxHp || 3000,
            maxHp: participant.maxHp || 3000,
            attack: 200,
            defense: 100,
            critChance: 0.1,
            dexterity: 10,
            skills: {},
            skillPoints: 0,
            equipment: {},
            cooldowns: { classAbilityPrimary: 0 },
            classAbilityState: {
              enrageActive: false,
              elementRotation: 0,
              comboCount: 0
            },
            gold: 0,
            tokens: 0,
            lastTokenClaim: Date.now(),
            lastCommandTime: Date.now()
          };
          // Apply saved facing preference for mock heroes
          const savedFacing = getSavedFacing(HERO_FACING_STORAGE_KEY, participant.heroRole || 'berserker', searchParams);
          setHeroFacings(prev => ({ ...prev, [mockHero.id]: savedFacing }));
          loadedHeroes.push(mockHero);
          continue;
        }
        
        const backendHero = await heroAPI.getHero(participant.userId);
        
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
          hp: participant.currentHp || backendHero.hp,
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
          lastCommandTime: Date.now(),
          spellEffect: backendHero.spellEffect || undefined
        };

        // Apply saved facing preference
        const savedFacing = getSavedFacing(HERO_FACING_STORAGE_KEY, backendHero.role, searchParams);
        setHeroFacings(prev => ({ ...prev, [testHero.id]: savedFacing }));
        loadedHeroes.push(testHero);
      } catch (err) {
        console.error(`Failed to load hero for participant ${participant.userId}:`, err);
      }
    }

    setHeroes(loadedHeroes);
  };

  // Helper function to show staggered loot SCT (prevents overlapping notifications)
  const showStaggeredLootSCT = useCallback((heroId: string, lootName: string) => {
    const now = Date.now();
    const lastTime = lastLootSCTTime.current.get(heroId) || 0;
    const staggerDelay = 400; // 400ms between loot notifications per hero
    const delay = Math.max(0, staggerDelay - (now - lastTime));
    
    setTimeout(() => {
      showScrollingCombatText(`battle-hero-${heroId}`, lootName, 'loot', true);
      lastLootSCTTime.current.set(heroId, Date.now());
    }, delay);
  }, []);

  // Distribute XP from enemy kill
  const distributeXPFromKill = (enemy: TestEnemy) => {
    const baseXP = enemy.xp || 100;
    const aliveHeroes = heroes.filter(h => h.hp > 0);
    
    if (aliveHeroes.length === 0) return;
    
    // XP is split evenly among alive heroes
    const xpPerHero = Math.floor(baseXP / aliveHeroes.length);
    
    setHeroes(prev => prev.map(hero => {
      if (hero.hp <= 0) return hero;
      
      const currentXp = hero.xp || 0;
      const currentMaxXp = hero.maxXp || 100;
      const newXp = currentXp + xpPerHero;
      
      // Check for level-ups
      let finalXp = newXp;
      let finalLevel = hero.level;
      let finalMaxXp = currentMaxXp;
      
      while (finalXp >= finalMaxXp) {
        finalXp -= finalMaxXp;
        finalLevel += 1;
        finalMaxXp = Math.floor(100 * Math.pow(1.15, finalLevel - 1));
        
        // Show level-up SCT
        showScrollingCombatText(`battle-hero-${hero.id}`, 'LEVEL UP!', 'levelup', true);
        console.log(`🎉 ${hero.name} leveled up to ${finalLevel}!`);
      }
      
      return {
        ...hero,
        xp: finalXp,
        maxXp: finalMaxXp,
        level: finalLevel
      };
    }));
  };

  // Handle enemy defeat
  const handleEnemyDefeat = (enemyId: string) => {
    if (deadEnemies.current.has(enemyId)) return; // Already processed
    
    deadEnemies.current.add(enemyId);
    
    const enemy = enemies.find(e => e.id === enemyId);
    if (!enemy) return;
    
    console.log(`💀 [Raid] Enemy defeated: ${enemy.name} (Level ${enemy.level || 1})`);
    
    // Play death animation for Elder Dragon (and other enemies that support it)
    const enemyRef = enemyRefs.current.get(enemyId);
    if (enemyRef?.current) {
      const animations = getEnemyAnimations(enemy.name);
      const deathDuration = animations?.death?.duration || 2000; // 2000ms fallback
      
      // Record death animation start time
      enemyDeathStartTime.current.set(enemyId, Date.now());
      
      // Play death animation
      enemyRef.current.playAnimation('death');
      
      console.log(`[Death] Enemy ${enemy.name} (${enemyId}) death animation started, duration: ${deathDuration}ms`);
    }
    
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
      console.log(`💰 [Gold] ${aliveHeroes.map(h => h.name).join(', ')} gain ${goldPerHero} gold each`);
    }
    
    // Track quest progress
    if (questTrackerRef.current) {
      questTrackerRef.current.track('kill', 1, 'daily');
      questTrackerRef.current.track('kill', 1, 'weekly');
      questTrackerRef.current.track('kill', 1, 'monthly');
    }
    
    // Check if this is a boss
    const isBoss = isBossEnemy(enemy.name);
    const isRaidBoss = raidDataRef.current && enemy.name === raidDataRef.current.boss.name;
    
    if (isBoss && questTrackerRef.current) {
      questTrackerRef.current.track('defeatBosses', 1, 'daily');
      questTrackerRef.current.track('defeatBosses', 1, 'weekly');
      questTrackerRef.current.track('defeatBosses', 1, 'monthly');
      bossDefeats.current++;
    }
    
    // Generate loot for raid bosses with raid-specific rules
    if (isRaidBoss && raidDataRef.current) {
      console.log(`🎁 [Raid] Boss defeated! Generating guaranteed raid loot...`);
      
      const rewards = calculateRaidRewards(raidDataRef.current, heroes.length);
      
      // Distribute rewards
      setHeroes(prev => prev.map(hero => ({
        ...hero,
        gold: (hero.gold || 0) + rewards.gold,
        tokens: (hero.tokens || 0) + rewards.tokens,
        xp: (hero.xp || 0) + rewards.experience
      })));
      
      // Generate guaranteed loot (2-4 pieces based on difficulty)
      for (let i = 0; i < rewards.lootCount; i++) {
        heroes.forEach(hero => {
          if (hero.hp <= 0) return; // Dead heroes don't get loot
          
          const loot = generateLoot(hero.role, {
            enemyLevel: raidDataRef.current.boss.level,
            waveCount: raidDataRef.current.waves,
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
      
      console.log(`🎉 Raid completed! Rewards: ${rewards.gold}g, ${rewards.tokens}t, ${rewards.experience}xp`);
    } else if (isBoss) {
      // Regular boss loot (not raid boss)
      console.log(`🎁 [Loot] Generating loot for ${enemy.name} (BOSS)`);
      heroes.forEach(hero => {
        if (hero.hp <= 0) return;
        
        const loot = generateLoot(hero.role, {
          enemyLevel: enemy.level || 1,
          waveCount: 0,
          isBoss: true,
          forceSetPiece: Math.random() < 0.25 // 25% chance for set piece from regular boss
        });
        
        if (loot) {
          const currentItem = hero.equipment?.[loot.slot];
          if (isItemBetter(loot, currentItem)) {
            setHeroes(prev => prev.map(h => {
              if (h.id !== hero.id) return h;
              const newEquipment = { ...(h.equipment || {}), [loot.slot]: loot };
              showScrollingCombatText(`battle-hero-${hero.id}`, loot.name, 'loot', true);
              return { ...h, equipment: newEquipment };
            }));
          }
        }
      });
    } else {
      // Regular enemy loot
      heroes.forEach(hero => {
        if (hero.hp <= 0) return;
        
        const loot = generateLoot(hero.role, {
          enemyLevel: enemy.level || 1,
          waveCount: 0,
          isBoss: false
        });
        
        if (loot) {
          const currentItem = hero.equipment?.[loot.slot];
          if (isItemBetter(loot, currentItem)) {
            setHeroes(prev => prev.map(h => {
              if (h.id !== hero.id) return h;
              const newEquipment = { ...(h.equipment || {}), [loot.slot]: loot };
              showScrollingCombatText(`battle-hero-${hero.id}`, loot.name, 'loot', true);
              return { ...h, equipment: newEquipment };
            }));
          }
        }
      });
    }
    
    // Remove enemy from state
    setEnemies(prev => prev.filter(e => e.id !== enemyId));
  };

  // Auto-detect enemy death when HP reaches 0
  useEffect(() => {
    enemies.forEach(enemy => {
      if (enemy.hp <= 0 && !deadEnemies.current.has(enemy.id)) {
        handleEnemyDefeat(enemy.id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enemies]);
  
  // Auto-detect hero death when HP reaches 0
  const deadHeroes = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    heroes.forEach(hero => {
      if (hero.hp <= 0 && !deadHeroes.current.has(hero.id)) {
        deadHeroes.current.add(hero.id);
        console.log(`💀 [Raid] Hero defeated: ${hero.name} (${hero.id})`);
        
        // Play death animation
        const heroRef = heroRefs.current.get(hero.id);
        if (heroRef?.current) {
          heroRef.current.playAnimation('death');
        }
        
        // Mark hero as dead in state
        setHeroes(prev => prev.map(h => 
          h.id === hero.id ? { ...h, isDead: true, hp: 0 } : h
        ));
        
        // Track quest progress for hero death (if needed)
        // Note: Hero deaths might not be quest objectives, but we track for stats
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroes]);

  // Sync heroShields from hero.shield for display
  useEffect(() => {
    const shields: Record<string, number> = {};
    heroes.forEach(hero => {
      const shieldAmount = typeof hero.shield === 'number' 
        ? hero.shield 
        : (hero.shield?.amount || 0);
      if (shieldAmount > 0) {
        shields[hero.id] = shieldAmount;
      }
    });
    setHeroShields(shields);
  }, [heroes]);

  // Process buffs/debuffs, DoT/HoT ticks every 100ms
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      
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
        
        // Update buff durations (skip special buffs that are handled above)
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
        
        // Calculate equipment-based HP regeneration
        const equipmentHpRegen = getEquipmentHpRegen(hero.equipment);
        const equipmentRegenTickRate = 5000; // 5 seconds
        let equipmentRegenHealing = 0;
        
        if (equipmentHpRegen > 0 && hero.hp > 0) {
          const lastEquipmentRegenTick = hero.lastEquipmentRegenTick || 0;
          const timeSinceLastTick = now - lastEquipmentRegenTick;
          
          if (timeSinceLastTick >= equipmentRegenTickRate || lastEquipmentRegenTick === 0) {
            equipmentRegenHealing = equipmentHpRegen * (equipmentRegenTickRate / 1000);
            updated = true;
          }
        }
        
        // Process HoT ticks (Heal over Time)
        let totalHotHealing = 0;
        const hotTickRate = 2000; // 2 seconds
        
        Object.keys(newBuffs || {}).forEach(key => {
          const buff = newBuffs[key];
          if (!buff) return;
          
          const buffDef = Object.values(BUFF_TYPES).find(b => b.name === buff.name);
          
          if (buffDef?.effect === 'healOverTime') {
            if (!buff.lastTickTime) {
              buff.lastTickTime = now - hotTickRate;
            }
            
            const timeSinceLastTick = now - buff.lastTickTime;
            
            if (timeSinceLastTick >= hotTickRate) {
              const hotHealing = buffDef.value || buff.value || 0;
              if (hotHealing > 0) {
                totalHotHealing += hotHealing;
              }
              
              buff.lastTickTime = now;
              updated = true;
            }
          }
        });
        
        // Combine equipment regen with HoT
        const totalHealing = totalHotHealing + equipmentRegenHealing;
        
        // Apply HoT healing
        if (totalHealing > 0 && hero.hp > 0) {
          const missingHp = hero.maxHp - hero.hp;
          let newHp = hero.hp;
          let newShield = hero.shield || 0;
          
          if (missingHp > 0) {
            const hpHealed = Math.min(totalHealing, missingHp);
            newHp = hero.hp + hpHealed;
            const excessHealing = totalHealing - hpHealed;
            
            if (excessHealing > 0) {
              newShield = (hero.shield || 0) + excessHealing;
            }
          } else {
            newShield = (hero.shield || 0) + totalHealing;
          }
          
          showScrollingCombatText(`battle-hero-${hero.id}`, totalHealing, 'heal-hot', true);
          
          setHeroes(prev => prev.map(h => {
            if (h.id === hero.id) {
              const updatedHero = { ...h, hp: newHp, shield: newShield };
              if (equipmentRegenHealing > 0) {
                updatedHero.lastEquipmentRegenTick = now;
              }
              // Sync shield to heroShields state for display
              setHeroShields(prev => ({ ...prev, [hero.id]: newShield }));
              return updatedHero;
            }
            return h;
          }));
        }
        
        // Process DoT ticks
        let totalDotDamage = 0;
        const tickRate = 2000; // 2 seconds
        
        Object.keys(newDebuffs || {}).forEach(key => {
          const debuff = newDebuffs[key];
          if (!debuff) return;
          
          const debuffDef = Object.values(DEBUFF_TYPES).find(d => d.name === debuff.name);
          
          if (debuffDef?.effect === 'damageOverTime') {
            if (!debuff.lastTickTime) {
              debuff.lastTickTime = now - tickRate;
            }
            
            const timeSinceLastTick = now - debuff.lastTickTime;
            
            if (timeSinceLastTick >= tickRate) {
              const dotDamage = debuffDef.value || debuff.value || 0;
              if (dotDamage > 0) {
                totalDotDamage += dotDamage;
              }
              
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
        
        // Apply DoT damage
        if (totalDotDamage > 0 && hero.hp > 0) {
          const newHp = Math.max(0, hero.hp - totalDotDamage);
          showScrollingCombatText(`battle-hero-${hero.id}`, totalDotDamage, 'dot', true);
          
          setHeroes(prev => prev.map(h => {
            if (h.id === hero.id) {
              return { ...h, hp: newHp };
            }
            return h;
          }));
        }
        
        return updated ? { ...hero, activeBuffs: newBuffs, activeDebuffs: newDebuffs, lastDotTickTime: now } : hero;
      }));
      
      // Update enemy buffs/debuffs (similar logic)
      setEnemies(prev => prev.map(enemy => {
        let updated = false;
        const newBuffs = { ...enemy.activeBuffs };
        const newDebuffs = { ...enemy.activeDebuffs };
        
        // Process HoT for enemies
        let totalHotHealing = 0;
        const hotTickRate = 2000;
        
        Object.keys(newBuffs || {}).forEach(key => {
          const buff = newBuffs[key];
          if (!buff) return;
          
          const buffDef = Object.values(BUFF_TYPES).find(b => b.name === buff.name);
          
          if (buffDef?.effect === 'healOverTime') {
            if (!buff.lastTickTime) {
              buff.lastTickTime = now - hotTickRate;
            }
            
            const timeSinceLastTick = now - buff.lastTickTime;
            
            if (timeSinceLastTick >= hotTickRate) {
              const hotHealing = buffDef.value || buff.value || 0;
              if (hotHealing > 0) {
                totalHotHealing += hotHealing;
              }
              
              buff.lastTickTime = now;
              updated = true;
            }
          }
          
          // Update buff duration
          if (buff.remainingDuration > 0) {
            newBuffs[key] = {
              ...buff,
              remainingDuration: Math.max(0, buff.remainingDuration - 100)
            };
            updated = true;
            if (newBuffs[key].remainingDuration <= 0) {
              delete newBuffs[key];
            }
          }
        });
        
        // Apply HoT to enemies
        if (totalHotHealing > 0 && enemy.hp > 0) {
          const missingHp = enemy.maxHp - enemy.hp;
          let newHp = enemy.hp;
          let newShield = enemy.shield || 0;
          
          if (missingHp > 0) {
            const hpHealed = Math.min(totalHotHealing, missingHp);
            newHp = enemy.hp + hpHealed;
            const excessHealing = totalHotHealing - hpHealed;
            
            if (excessHealing > 0) {
              newShield = (enemy.shield || 0) + excessHealing;
            }
          } else {
            newShield = (enemy.shield || 0) + totalHotHealing;
          }
          
          showScrollingCombatText(`battle-enemy-${enemy.id}`, totalHotHealing, 'heal-hot', false);
          
          setEnemies(prev => prev.map(e => {
            if (e.id === enemy.id) {
              return { ...e, hp: newHp, shield: newShield };
            }
            return e;
          }));
        }
        
        // Process DoT for enemies
        let totalDotDamage = 0;
        const tickRate = 2000;
        
        Object.keys(newDebuffs || {}).forEach(key => {
          const debuff = newDebuffs[key];
          if (!debuff) return;
          
          const debuffDef = Object.values(DEBUFF_TYPES).find(d => d.name === debuff.name);
          
          if (debuffDef?.effect === 'damageOverTime') {
            if (!debuff.lastTickTime) {
              debuff.lastTickTime = now - tickRate;
            }
            
            const timeSinceLastTick = now - debuff.lastTickTime;
            
            if (timeSinceLastTick >= tickRate) {
              const dotDamage = debuffDef.value || debuff.value || 0;
              if (dotDamage > 0) {
                totalDotDamage += dotDamage;
              }
              
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
        
        // Apply DoT to enemies
        if (totalDotDamage > 0 && enemy.hp > 0) {
          const newHp = Math.max(0, enemy.hp - totalDotDamage);
          showScrollingCombatText(`battle-enemy-${enemy.id}`, totalDotDamage, 'dot', false);
          
          setEnemies(prev => prev.map(e => {
            if (e.id === enemy.id) {
              return { ...e, hp: newHp };
            }
            return e;
          }));
        }
        
        return updated ? { ...enemy, activeBuffs: newBuffs, activeDebuffs: newDebuffs } : enemy;
      }));
    }, 100);
    
    return () => clearInterval(interval);
  }, []);

  // Helper functions for combat
  const stillAlive = useCallback((combatant: Combatant): boolean => {
    const heroes = heroesRef.current;
    const enemies = enemiesRef.current;
    
    if (combatant.type === 'hero') {
      const h = heroes.find((x) => x.id === combatant.id);
      return !!h && h.hp > 0;
    } else {
      const e = enemies.find((x) => x.id === combatant.id);
      return !!e && e.hp > 0;
    }
  }, []);
  
  const calculateRoundInitiative = useCallback((): Combatant[] => {
    const heroes = heroesRef.current.filter((h) => h.hp > 0);
    const enemies = enemiesRef.current.filter((e) => e.hp > 0);
    
    if (heroes.length === 0 || enemies.length === 0) {
      return [];
    }
    
    const raw = calculateInitiative(heroes, enemies);
    if (raw.length === 0) {
      // Fallback: create simple initiative order
      return [
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
      ].sort((a, b) => b.initiative - a.initiative);
    }
    
    return raw;
  }, []);
  
  // Process a full combat round with initiative-based turn order (refactored to match AnimationTestPage)
  const processCombatRound = useCallback((): void => {
    if (heroes.length === 0 || enemies.length === 0) {
      console.warn('⚠️ [Raid Combat] Cannot start combat: need at least 1 hero and 1 enemy');
      return;
    }
    
    // Prevent multiple simultaneous combat rounds
    if (isCombatProcessingRef.current) {
      console.warn('⚠️ [Raid Combat] Combat already processing, skipping...', {
        stackTrace: new Error().stack
      });
      return;
    }
    
    isCombatProcessingRef.current = true;
    const roundStartTime = Date.now();
    console.log('⚔️ [Raid Combat] Starting combat round...', {
      heroes: heroes.length,
      enemies: enemies.length,
      heroIds: heroes.map(h => h.id),
      heroNames: heroes.map(h => h.name),
      timestamp: roundStartTime
    });
    
    // Check for duplicate heroes in the heroes array
    const heroIdCounts = new Map<string, number>();
    heroes.forEach(h => {
      heroIdCounts.set(h.id, (heroIdCounts.get(h.id) || 0) + 1);
    });
    const duplicateHeroIds = Array.from(heroIdCounts.entries()).filter(([id, count]) => count > 1);
    if (duplicateHeroIds.length > 0) {
      console.error('[Raid Combat] ⚠️⚠️⚠️ DUPLICATE HEROES IN HEROES ARRAY:', duplicateHeroIds);
    }

    // Clear enemy initiative for new round
    setEnemies(prev => prev.map(e => ({ ...e, initiative: undefined })));

    // Calculate initiative for all combatants
    const combatants = calculateInitiative(heroes, enemies);
    setInitiativeOrder(combatants);
    
    // Log combatants to check for duplicates
    console.log('[Raid Combat] Combatants in this round:', combatants.map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      initiative: c.initiative
    })));
    
    // Check for duplicate hero IDs in combatants
    const combatantHeroIds = combatants.filter(c => c.type === 'hero').map(c => c.id);
    const duplicateCombatantHeroIds = combatantHeroIds.filter((id, idx) => combatantHeroIds.indexOf(id) !== idx);
    if (duplicateCombatantHeroIds.length > 0) {
      console.warn('[Raid Combat] ⚠️ DUPLICATE HEROES IN COMBATANTS:', duplicateCombatantHeroIds);
    }

    // Process actions in initiative order
    combatants.forEach((combatant, index) => {
      if (combatant.isDead) return;

      const delay = index * 800; // 800ms delay between actions

      setTimeout(() => {
        if (combatant.type === 'hero') {
          // Hero attacks random enemy
          const aliveEnemies = enemies.filter(e => e.hp > 0);
          if (aliveEnemies.length === 0) {
            isCombatProcessingRef.current = false;
            return;
          }

          const targetEnemy = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
          const hero = heroes.find(h => h.id === combatant.id);
          if (!hero) {
            console.warn(`[Raid Combat] Hero not found for combatant ${combatant.id}`);
            return;
          }

          console.log(`[Raid Combat] Hero ${hero.name} (${hero.id}) attacking ${targetEnemy.name} at index ${index} in round starting at ${roundStartTime}, current time: ${Date.now()}`);

          // Check if hero is stunned
          if (isStunned(hero)) {
            console.log(`💫 ${hero.name} is stunned and cannot act!`);
            return;
          }

          // Check if hero uses projectiles
          // All ranged heroes that use projectiles
          const spellcasters = ['mage', 'warlock', 'necromancer', 'firemage', 'frostmage', 'dragonsorcerer', 'ranger', 'shadowpriest', 'mooncaller', 'stormcaller'];
          const healers = ['cleric', 'atoner', 'druid', 'lightbringer', 'shaman', 'mistweaver', 'chronomancer', 'bard'];
          let usesProjectile = spellcasters.includes(hero.role.toLowerCase()) || healers.includes(hero.role.toLowerCase());

          const heroElement = document.querySelector(`#battle-hero-${hero.id}`) as HTMLElement;
          const enemyElement = document.querySelector(`#battle-enemy-${targetEnemy.id}`) as HTMLElement;

          // Initialize cooldowns and ability state if needed
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

          // Calculate base damage
          const baseDamage = calculateHeroBaseDamage(hero);
          const enemyHpPercent = targetEnemy.hp / targetEnemy.maxHp;
          const now = Date.now();

          // Apply class ability
          const abilityResult = applyClassAbility(
            hero.role,
            baseDamage,
            enemyHpPercent,
            now,
            hero.cooldowns,
            hero.classAbilityState
          );

          // Update hero state
          setHeroes(prev => prev.map(h => {
            if (h.id === hero.id) {
              const updatedHero = {
                ...h,
                cooldowns: { ...hero.cooldowns },
                classAbilityState: { ...hero.classAbilityState }
              };

              // Add Enrage buff if activated
              if (abilityResult.abilityUsed && abilityResult.abilityName === 'Enrage' && hero.classAbilityState?.enrageActive) {
                updatedHero.activeBuffs = {
                  ...updatedHero.activeBuffs,
                  enrage: {
                    name: 'Enrage',
                    icon: '⚔️💥',
                    color: '#dc2626',
                    remainingDuration: 12000,
                    value: 40
                  }
                };
              }

              return updatedHero;
            }
            return h;
          }));

          // Check for emergency abilities (healers)
          const isHealer = healers.includes(hero.role.toLowerCase());
          if (isHealer) {
            if (!hero.cooldowns.groupHeal) hero.cooldowns.groupHeal = 0;
            if (!hero.cooldowns.instantHeal) hero.cooldowns.instantHeal = 0;
            if (!hero.cooldowns.dispel) hero.cooldowns.dispel = 0;

            const groupHealResult = checkGroupHeal(
              hero.id,
              hero.role,
              hero.attack || 150,
              heroes,
              now,
              hero.cooldowns
            );

            if (groupHealResult.abilityUsed && groupHealResult.healing && groupHealResult.healingTargets) {
              setHeroes(prev => prev.map(h => {
                if (groupHealResult.healingTargets!.includes(h.id)) {
                  const newHp = Math.min(h.maxHp, h.hp + groupHealResult.healing!);
                  const excessHealing = Math.max(0, (h.hp + groupHealResult.healing!) - h.maxHp);
                  const newShield = (h.shield || 0) + excessHealing;
                  showScrollingCombatText(`battle-hero-${h.id}`, groupHealResult.healing!, 'healing', true);
                  // Add to combat log
                  const healLogId = `heal-group-${hero.id}-${h.id}-${Date.now()}-${combatLogIdCounter.current++}`;
                  setCombatLog(prev => {
                    const exists = prev.some(log => log.id === healLogId);
                    if (exists) return prev;
                    return [...prev.slice(-199), {
                      id: healLogId,
                      timestamp: Date.now(),
                      message: `${hero.name} heals ${h.name} for ${Math.floor(groupHealResult.healing!)} HP`,
                      type: 'healing'
                    }];
                  });
                  return { ...h, hp: newHp, shield: newShield };
                }
                return h;
              }));
              return;
            }

            const instantHealResult = checkInstantHeal(
              hero.id,
              hero.role,
              hero.attack || 150,
              heroes,
              now,
              hero.cooldowns
            );

            if (instantHealResult.abilityUsed && instantHealResult.healing && instantHealResult.healingTargets) {
              const targetId = instantHealResult.healingTargets[0];
              setHeroes(prev => prev.map(h => {
                if (h.id === targetId) {
                  const newHp = Math.min(h.maxHp, h.hp + instantHealResult.healing!);
                  const excessHealing = Math.max(0, (h.hp + instantHealResult.healing!) - h.maxHp);
                  const newShield = (h.shield || 0) + excessHealing;
                  showScrollingCombatText(`battle-hero-${targetId}`, instantHealResult.healing!, 'healing', true);
                  // Add to combat log
                  const targetHero = heroes.find(h => h.id === targetId);
                  const instantHealLogId = `heal-instant-${hero.id}-${targetId}-${Date.now()}-${combatLogIdCounter.current++}`;
                  setCombatLog(prev => {
                    const exists = prev.some(log => log.id === instantHealLogId);
                    if (exists) return prev;
                    return [...prev.slice(-199), {
                      id: instantHealLogId,
                      timestamp: Date.now(),
                      message: `${hero.name} heals ${targetHero?.name || 'target'} for ${Math.floor(instantHealResult.healing!)} HP`,
                      type: 'healing'
                    }];
                  });
                  return { ...h, hp: newHp, shield: newShield };
                }
                return h;
              }));
              return;
            }

            // Check for Auto-Dispel
            const dispelResult = checkAutoDispel(
              hero.id,
              hero.role,
              heroes,
              now,
              hero.cooldowns
            );

            if (dispelResult.abilityUsed && dispelResult.debuffsRemoved && dispelResult.debuffsRemoved.length > 0) {
              setHeroes(prev => prev.map(h => {
                if (dispelResult.debuffsRemoved!.includes(h.id)) {
                  const dispelLogId = `dispel-${hero.id}-${h.id}-${Date.now()}-${combatLogIdCounter.current++}`;
                  setCombatLog(prev => {
                    const exists = prev.some(log => log.id === dispelLogId);
                    if (exists) return prev;
                    return [...prev.slice(-199), {
                      id: dispelLogId,
                      timestamp: Date.now(),
                      message: dispelResult.abilityMessage || `${hero.name} uses Auto-Dispel on ${h.name}`,
                      type: 'ability'
                    }];
                  });
                  return { ...h, activeDebuffs: {} };
                }
                return h;
              }));
              return;
            }

            // REGULAR HEALING: If no emergency abilities triggered, prioritize healing
            // Priority: Tanks first, then DPS, then healers
            const tankRoles = ['guardian', 'paladin', 'warden', 'bloodknight', 'vanguard', 'brewmaster'];
            const aliveHeroes = heroes.filter(h => h.hp > 0);
            
            // Find targets that need healing (HP < 90%)
            const needsHealing = (h: TestHero) => h.hp < h.maxHp * 0.9;
            
            // Priority 1: Tanks that need healing
            let healTarget = aliveHeroes.find(h => 
              tankRoles.includes(h.role.toLowerCase()) && needsHealing(h)
            );
            
            // Priority 2: DPS that need healing
            if (!healTarget) {
              healTarget = aliveHeroes.find(h => 
                !tankRoles.includes(h.role.toLowerCase()) && 
                !healers.includes(h.role.toLowerCase()) && 
                needsHealing(h)
              );
            }
            
            // Priority 3: Other healers that need healing
            if (!healTarget) {
              healTarget = aliveHeroes.find(h => 
                healers.includes(h.role.toLowerCase()) && 
                h.id !== hero.id && 
                needsHealing(h)
              );
            }
            
            // If healing target found, heal them
            if (healTarget) {
              const baseHeal = 30 + Math.random() * 20 + (hero.attack * 0.5); // 30-50 + 50% of attack
              const actualHeal = Math.min(healTarget.maxHp - healTarget.hp, baseHeal);
              
              if (actualHeal > 0) {
                setHeroes(prev => prev.map(h => {
                  if (h.id === healTarget!.id) {
                    const newHp = Math.min(h.maxHp, h.hp + actualHeal);
                    const excessHealing = Math.max(0, (h.hp + actualHeal) - h.maxHp);
                    const newShield = (h.shield || 0) + excessHealing;
                    showScrollingCombatText(`battle-hero-${h.id}`, actualHeal, 'healing', true);
                    
                    // Track quest progress for healing done
                    if (questTrackerRef.current) {
                      const currentHealing = totalHealingDone.current.get(hero.id) || 0;
                      totalHealingDone.current.set(hero.id, currentHealing + actualHeal);
                      questTrackerRef.current.track('healAmount', actualHeal, 'daily');
                      questTrackerRef.current.track('healAmount', actualHeal, 'weekly');
                      questTrackerRef.current.track('healAmount', actualHeal, 'monthly');
                    }
                    
                    // Record healing for damage meter
                    setDamageMeterState(prev => recordHealing(prev, hero.id, hero.name, actualHeal));
                    
                    const healLogId = `heal-regular-${hero.id}-${h.id}-${Date.now()}-${combatLogIdCounter.current++}`;
                    setCombatLog(prev => {
                      const exists = prev.some(log => log.id === healLogId);
                      if (exists) return prev;
                      return [...prev.slice(-199), {
                        id: healLogId,
                        timestamp: Date.now(),
                        message: `${hero.name} heals ${h.name} for ${Math.floor(actualHeal)} HP`,
                        type: 'healing'
                      }];
                    });
                    return { ...h, hp: newHp, shield: newShield };
                  }
                  return h;
                }));
                return; // Skip attack, healing was done
              }
            }
            // If no healing needed, continue to attack (DPS)
          }

          // Calculate damage with crit
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

          if (usesProjectile && heroElement && enemyElement) {
            const heroRef = heroRefs.current.get(hero.id);
            if (heroRef?.current) {
              if (healers.includes(hero.role.toLowerCase())) {
                heroRef.current.playAnimation('rangedAttack');
              } else {
                heroRef.current.playAnimation('attack');
              }
            }

            setTimeout(() => {
              const currentHeroElement = document.querySelector(`#battle-hero-${hero.id}`) as HTMLElement;
              // For Elder Dragon, use the target div; for others, use the enemy sprite container
              const isElderDragon = targetEnemy.name === 'Elder Dragon';
              const currentEnemyElement = isElderDragon
                ? (document.getElementById('elder-dragon-target') as HTMLElement)
                : (document.querySelector(`#battle-enemy-${targetEnemy.id}`) as HTMLElement);
              
              if (!currentHeroElement || !currentEnemyElement) {
                if (isElderDragon) {
                  console.warn('🎯 [Dragon] Target element not found for Elder Dragon projectile');
                }
                return;
              }
              
              if (isElderDragon && currentEnemyElement) {
                const style = window.getComputedStyle(currentEnemyElement);
                console.log('🎯 [Dragon] Target position for hero projectile:', {
                  bottom: style.bottom,
                  right: style.right,
                  element: currentEnemyElement
                });
              }
              
              let elementType: 'fire' | 'frost' | 'arcane' | undefined = undefined;
              let projectileRole = hero.role;
              
              if (hero.role.toLowerCase() === 'mage' && hero.classAbilityState?.elementRotation !== undefined) {
                const rotation = hero.classAbilityState.elementRotation;
                if (rotation === 0) elementType = 'fire';
                else if (rotation === 1) elementType = 'frost';
                else elementType = 'arcane';
              }

              // Generate log ID BEFORE the callback to ensure it's the same if callback fires twice
              const projectileLogId = `hero-projectile-${hero.id}-${targetEnemy.id}-${roundStartTime}-${combatLogIdCounter.current++}`;

              createProjectile(
                currentHeroElement,
                currentEnemyElement,
                projectileRole,
                undefined, // projectileType - auto-detected for heroes
                () => {
                  // Guard against duplicate processing (React StrictMode can cause double calls)
                  if (processedLogIds.current.has(projectileLogId)) {
                    console.warn(`[Combat Log] Duplicate callback detected, skipping: ${projectileLogId}`);
                    return;
                  }
                  processedLogIds.current.add(projectileLogId);
                  
                  const enemyRef = enemyRefs.current.get(targetEnemy.id);
                  if (enemyRef?.current) {
                    // Don't interrupt attack animation - check current animation first
                    const currentAnim = enemyRef.current.getCurrentAnimation();
                    if (currentAnim !== 'attack' && currentAnim !== 'attack2' && currentAnim !== 'attack3' && currentAnim !== 'strongAttack' && currentAnim !== 'projectile') {
                    enemyRef.current.playAnimation('hurt');
                    }
                  }
                  
                  // Apply damage with shield absorption
                  setEnemies(prev => {
                    const enemy = prev.find(e => e.id === targetEnemy.id);
                    if (!enemy) return prev;
                    
                    const currentShield = enemyShields[targetEnemy.id] || 0;
                    let remainingDamage = actualDamage;
                    let newShield = currentShield;
                    
                    if (currentShield > 0) {
                      if (remainingDamage >= currentShield) {
                        remainingDamage -= currentShield;
                        newShield = 0;
                      } else {
                        newShield = currentShield - remainingDamage;
                        remainingDamage = 0;
                      }
                    }
                    
                    setEnemyShields(prev => ({ ...prev, [targetEnemy.id]: newShield }));
                    
                    return prev.map(e => {
                    if (e.id === targetEnemy.id) {
                        const oldHp = e.hp;
                        const newHp = Math.max(0, e.hp - remainingDamage);
                        showScrollingCombatText(`battle-enemy-${targetEnemy.id}`, remainingDamage, isCrit ? 'crit' : 'damage', false);
                        
                        // Werewolf transformation: only transform when damage is actually received (HP decreases)
                        if (e.name === 'Werewolf' && !werewolfTransformed.current.has(e.id) && newHp < oldHp && remainingDamage > 0) {
                          const enemyRef = enemyRefs.current.get(e.id);
                          if (enemyRef?.current) {
                            enemyRef.current.playAnimation('transformation');
                            werewolfTransformed.current.add(e.id);
                            console.log(`[Werewolf] ${e.name} transforming after taking ${remainingDamage} damage`);
                          }
                        }
                        
                      return { ...e, hp: newHp };
                    }
                    return e;
                    });
                  });
                  
                  // Add to combat log
                  const logTimestamp = Date.now();
                  const logMessage = `${hero.name} ${isCrit ? 'CRITICALLY ' : ''}hits ${targetEnemy.name} for ${Math.floor(actualDamage)} damage`;
                  
                  // Clean up old IDs to prevent memory leak (keep last 1000)
                  if (processedLogIds.current.size > 1000) {
                    const idsArray = Array.from(processedLogIds.current);
                    processedLogIds.current = new Set(idsArray.slice(-500));
                  }
                  
                  console.log(`[Combat Log] Adding projectile attack log: ${logMessage} (id: ${projectileLogId}, timestamp: ${logTimestamp}, round: ${roundStartTime})`);
                  setCombatLog(prev => {
                        // Double-check if this exact log entry already exists
                        const exists = prev.some(log => log.id === projectileLogId);
                        if (exists) {
                          console.warn(`[Combat Log] Duplicate log entry detected in state, skipping: ${projectileLogId}`);
                          return prev;
                        }
                        return [...prev.slice(-199), {
                          id: projectileLogId,
                          timestamp: logTimestamp,
                          message: logMessage,
                          type: 'damage'
                        }];
                      });
                  
                  // Apply debuffs
                  const debuffResult = applyDebuff(targetEnemy, hero, actualDamage);
                  if (debuffResult.applied) {
                    setEnemies(prev => prev.map(e => {
                      if (e.id === targetEnemy.id) {
                        return { ...e, activeDebuffs: { ...e.activeDebuffs, ...debuffResult.debuffs } };
                      }
                      return e;
                    }));
                  }
                  
                  // Check proc buffs
                  const procBuff = checkProcBuff(hero, actualDamage);
                  if (procBuff) {
                    const appliedBuff = applyProcBuff(hero, procBuff);
                    setHeroes(prev => prev.map(h => {
                      if (h.id === hero.id) {
                        return { ...h, activeBuffs: { ...h.activeBuffs, ...appliedBuff } };
                      }
                      return h;
                    }));
                  }
                },
                true, // isHero: true
                elementType, // elementType for mage projectiles
                (hero as any).spellEffect as any // spellEffect for founder pack tiers
              );
            }, 300);
          } else {
            // Melee attack
            const heroRef = heroRefs.current.get(hero.id);
            if (heroRef?.current) {
              heroRef.current.playAnimation('attack');
            }

            // Generate log ID BEFORE the setTimeout to ensure it's the same if callback fires twice
            const meleeLogId = `hero-melee-${hero.id}-${targetEnemy.id}-${roundStartTime}-${combatLogIdCounter.current++}`;

            setTimeout(() => {
              // Guard against duplicate processing (React StrictMode can cause double calls)
              if (processedLogIds.current.has(meleeLogId)) {
                console.warn(`[Combat Log] Duplicate callback detected, skipping: ${meleeLogId}`);
                return;
              }
              processedLogIds.current.add(meleeLogId);
              
              const enemyRef = enemyRefs.current.get(targetEnemy.id);
              if (enemyRef?.current) {
                // Don't interrupt attack animation - check current animation first
                const currentAnim = enemyRef.current.getCurrentAnimation();
                if (currentAnim !== 'attack' && currentAnim !== 'attack2' && currentAnim !== 'attack3' && currentAnim !== 'strongAttack' && currentAnim !== 'projectile') {
                enemyRef.current.playAnimation('hurt');
                }
              }
              
              // Apply damage with shield absorption
              setEnemies(prev => {
                const enemy = prev.find(e => e.id === targetEnemy.id);
                if (!enemy) return prev;
                
                const currentShield = enemyShields[targetEnemy.id] || 0;
                let remainingDamage = actualDamage;
                let newShield = currentShield;
                
                if (currentShield > 0) {
                  if (remainingDamage >= currentShield) {
                    remainingDamage -= currentShield;
                    newShield = 0;
                  } else {
                    newShield = currentShield - remainingDamage;
                    remainingDamage = 0;
                  }
                }
                
                setEnemyShields(prev => ({ ...prev, [targetEnemy.id]: newShield }));
                
                return prev.map(e => {
                if (e.id === targetEnemy.id) {
                    const oldHp = e.hp;
                    const newHp = Math.max(0, e.hp - remainingDamage);
                    showScrollingCombatText(`battle-enemy-${targetEnemy.id}`, remainingDamage, isCrit ? 'crit' : 'damage', false);
                    
                    // Track quest progress for damage dealt
                    if (questTrackerRef.current && remainingDamage > 0) {
                      const currentDamage = totalDamageDealt.current.get(hero.id) || 0;
                      totalDamageDealt.current.set(hero.id, currentDamage + remainingDamage);
                      questTrackerRef.current.track('dealDamage', remainingDamage, 'daily');
                      questTrackerRef.current.track('dealDamage', remainingDamage, 'weekly');
                      questTrackerRef.current.track('dealDamage', remainingDamage, 'monthly');
                    }
                    
                    // Werewolf transformation: only transform when damage is actually received (HP decreases)
                    if (e.name === 'Werewolf' && !werewolfTransformed.current.has(e.id) && newHp < oldHp && remainingDamage > 0) {
                      const enemyRef = enemyRefs.current.get(e.id);
                      if (enemyRef?.current) {
                        enemyRef.current.playAnimation('transformation');
                        werewolfTransformed.current.add(e.id);
                        console.log(`[Werewolf] ${e.name} transforming after taking ${remainingDamage} damage`);
                      }
                    }
                    
                  return { ...e, hp: newHp };
                }
                return e;
                });
              });
              
              // Add to combat log
              const logTimestamp = Date.now();
              const logMessage = `${hero.name} ${isCrit ? 'CRITICALLY ' : ''}hits ${targetEnemy.name} for ${Math.floor(actualDamage)} damage`;
              
              console.log(`[Combat Log] Adding melee attack log: ${logMessage} (id: ${meleeLogId}, timestamp: ${logTimestamp}, round: ${roundStartTime})`);
              setCombatLog(prev => {
                // Double-check if this exact log entry already exists
                const exists = prev.some(log => log.id === meleeLogId);
                if (exists) {
                  console.warn(`[Combat Log] Duplicate log entry detected in state, skipping: ${meleeLogId}`);
                  return prev;
                }
                return [...prev.slice(-199), {
                  id: meleeLogId,
                  timestamp: logTimestamp,
                  message: logMessage,
                  type: 'damage'
                }];
              });
              
              // Apply debuffs
              const debuffResult = applyDebuff(targetEnemy, hero, actualDamage);
              if (debuffResult.applied) {
                setEnemies(prev => prev.map(e => {
                  if (e.id === targetEnemy.id) {
                    return { ...e, activeDebuffs: { ...e.activeDebuffs, ...debuffResult.debuffs } };
                  }
                  return e;
                }));
              }
              
              // Check proc buffs
              const procBuff = checkProcBuff(hero, actualDamage);
              if (procBuff) {
                const appliedBuff = applyProcBuff(hero, procBuff);
                setHeroes(prev => prev.map(h => {
                  if (h.id === hero.id) {
                    return { ...h, activeBuffs: { ...h.activeBuffs, ...appliedBuff } };
                  }
                  return h;
                }));
              }
            }, 300);
          }
        } else if (combatant.type === 'enemy') {
          // Enemy attacks random hero
          const aliveHeroes = heroes.filter(h => h.hp > 0);
          if (aliveHeroes.length === 0) {
            isCombatProcessingRef.current = false;
            return;
          }

          const enemy = enemies.find(e => e.id === combatant.id);
          if (!enemy) return;

          // Check if this is a boss with mechanics
          const isBoss = raidData?.boss && (enemy.name === raidData.boss.name || enemy.name.includes(raidData.boss.name));
          let bossMechanicExecuted = false;

          console.log(`[Boss Check] Enemy: ${enemy.name}, Raid Boss: ${raidData?.boss?.name}, Is Boss: ${isBoss}, Has Mechanics: ${!!raidData?.boss?.mechanics}, Has Phases: ${!!raidData?.boss?.phases}`);

          if (isBoss && raidData?.boss?.mechanics && raidData?.boss?.phases) {
            // Initialize boss mechanics state if not exists
            setBossMechanicsState(prev => {
              if (!prev.has(enemy.id)) {
                const newState = new Map(prev);
                newState.set(enemy.id, initializeBossMechanicsState());
                return newState;
              }
              return prev;
            });

            const currentState = bossMechanicsState.get(enemy.id) || initializeBossMechanicsState();
            const currentHpPercent = enemy.hp / enemy.maxHp;
            const previousHpPercent = (lastEnemyHpRef.current[enemy.id] || enemy.maxHp) / enemy.maxHp;
            const currentTime = Date.now();

            // Check for phase transition
            const phaseTransition = checkPhaseTransition(
              currentState.currentPhase,
              previousHpPercent,
              currentHpPercent,
              raidData.boss.phases
            );

            if (phaseTransition) {
              const newState = applyPhaseTransition(currentState, phaseTransition);
              setBossMechanicsState(prev => {
                const updated = new Map(prev);
                updated.set(enemy.id, newState);
                return updated;
              });

              // Announce phase transition
              const phase = raidData.boss.phases[phaseTransition.toPhase - 1];
              const announcement = getPhaseAnnouncement(phase, phaseTransition.toPhase, enemy.name);
              const phaseLogId = `phase-${enemy.id}-${phaseTransition.toPhase}-${Date.now()}`;
              setCombatLog(prev => [...prev.slice(-199), {
                id: phaseLogId,
                timestamp: Date.now(),
                message: announcement,
                type: 'phase'
              }]);
            }

            // Update current phase
            const updatedState = bossMechanicsState.get(enemy.id) || currentState;
            const detectedPhase = detectCurrentPhase(raidData.boss.phases, currentHpPercent);
            if (detectedPhase !== updatedState.currentPhase) {
              setBossMechanicsState(prev => {
                const newState = new Map(prev);
                const state = newState.get(enemy.id) || initializeBossMechanicsState();
                newState.set(enemy.id, { ...state, currentPhase: detectedPhase });
                return newState;
              });
            }

            // Get available mechanics
            const availableMechanics = getAvailableMechanics(
              raidData.boss.mechanics,
              updatedState,
              currentTime,
              currentHpPercent,
              previousHpPercent
            );

            console.log(`[Boss Mechanics] ${enemy.name} - Available mechanics:`, availableMechanics.map(m => m.name), {
              currentPhase: updatedState.currentPhase,
              hpPercent: currentHpPercent,
              mechanicsCount: raidData.boss.mechanics.length
            });

            // Execute first available mechanic (prioritize trigger-based mechanics)
            if (availableMechanics.length > 0) {
              console.log(`[Boss Mechanics] ${enemy.name} executing mechanic: ${availableMechanics[0].name}`);
              // Sort: trigger-based first, then by cooldown
              availableMechanics.sort((a, b) => {
                const aHasTrigger = a.triggerAt ? 1 : 0;
                const bHasTrigger = b.triggerAt ? 1 : 0;
                if (aHasTrigger !== bHasTrigger) return bHasTrigger - aHasTrigger;
                return (a.cooldown || 0) - (b.cooldown || 0);
              });

              const mechanic = availableMechanics[0];
              bossMechanicExecuted = true;

              // Record mechanic usage
              setBossMechanicsState(prev => {
                const newState = new Map(prev);
                const state = newState.get(enemy.id) || initializeBossMechanicsState();
                const updated = recordMechanicUsage(state, mechanic, currentTime);
                newState.set(enemy.id, updated);
                return newState;
              });

              // Execute mechanic based on type
              if (mechanic.type === 'cast' && mechanic.castTime) {
                // Start cast
                const target = getMechanicTarget(mechanic, aliveHeroes);
                const targetId = Array.isArray(target) ? 'all' : (target?.id || 'random');
                const castInfo = createCastInfo(mechanic, targetId, currentTime);
                
                setBossActiveCasts(prev => {
                  const newCasts = new Map(prev);
                  const existingCasts = newCasts.get(enemy.id) || [];
                  newCasts.set(enemy.id, [...existingCasts, castInfo]);
                  return newCasts;
                });

                // Log cast start
                const castLogId = `cast-${enemy.id}-${mechanic.name}-${Date.now()}`;
                setCombatLog(prev => [...prev.slice(-199), {
                  id: castLogId,
                  timestamp: currentTime,
                  message: `${enemy.name} begins casting ${mechanic.name}${mechanic.interruptible ? ' (interruptible)' : ''}!`,
                  type: 'mechanic'
                }]);

                // Complete cast after cast time
                setTimeout(() => {
                  setBossActiveCasts(prev => {
                    const newCasts = new Map(prev);
                    const casts = newCasts.get(enemy.id) || [];
                    const completedCast = casts.find(c => c.mechanic.name === mechanic.name && !c.interrupted);
                    if (completedCast && !completedCast.interrupted) {
                      // Execute mechanic damage
                      const mechanicDamage = calculateMechanicDamage(mechanic, enemy.attack || 100, updatedState.enrageDamageMultiplier);
                      const targets = Array.isArray(target) ? target : (target ? [target] : []);
                      
                      targets.forEach(t => {
                        if (t && t.isAlive) {
                          const heroDefense = t.defense || 0;
                          const finalDamage = Math.max(1, Math.floor(mechanicDamage - heroDefense * 0.5));
                          
                          setHeroes(prev => prev.map(h => {
                            if (h.id === t.id) {
                              const newHp = Math.max(0, h.hp - finalDamage);
                              showScrollingCombatText(`battle-hero-${h.id}`, finalDamage, 'damage', true);
                              
                              const damageLogId = `mechanic-${enemy.id}-${mechanic.name}-${t.id}-${Date.now()}`;
                              setCombatLog(prev => [...prev.slice(-199), {
                                id: damageLogId,
                                timestamp: Date.now(),
                                message: `${enemy.name}'s ${mechanic.name} hits ${h.name} for ${finalDamage} damage!`,
                                type: 'mechanic'
                              }]);
                              
                              return { ...h, hp: newHp };
                            }
                            return h;
                          }));
                        }
                      });
                    }
                    
                    // Remove completed cast
                    newCasts.set(enemy.id, casts.filter(c => c.mechanic.name !== mechanic.name || c.interrupted));
                    return newCasts;
                  });
                }, mechanic.castTime);
              } else if (mechanic.type === 'instant' || mechanic.type === 'aoe') {
                // Instant or AoE mechanic
                const mechanicDamage = calculateMechanicDamage(mechanic, enemy.attack || 100, updatedState.enrageDamageMultiplier);
                const targets = mechanic.target === 'all' 
                  ? aliveHeroes 
                  : [getMechanicTarget(mechanic, aliveHeroes)].filter(Boolean) as typeof aliveHeroes;

                targets.forEach(t => {
                  if (t && t.isAlive) {
                    const heroDefense = t.defense || 0;
                    const finalDamage = Math.max(1, Math.floor(mechanicDamage - heroDefense * 0.5));
                    
                    setHeroes(prev => prev.map(h => {
                      if (h.id === t.id) {
                        const newHp = Math.max(0, h.hp - finalDamage);
                        showScrollingCombatText(`battle-hero-${h.id}`, finalDamage, 'damage', true);
                        
                        const damageLogId = `mechanic-${enemy.id}-${mechanic.name}-${t.id}-${Date.now()}`;
                        setCombatLog(prev => [...prev.slice(-199), {
                          id: damageLogId,
                          timestamp: Date.now(),
                          message: `${enemy.name}'s ${mechanic.name} ${mechanic.target === 'all' ? 'hits everyone' : `hits ${h.name}`} for ${finalDamage} damage!`,
                          type: 'mechanic'
                        }]);
                        
                        return { ...h, hp: newHp };
                      }
                      return h;
                    }));
                  }
                });
              } else if (mechanic.type === 'adds' && mechanic.adds) {
                // Spawn adds
                const spawnedAdds = spawnAdds(
                  mechanic.adds,
                  enemy.id,
                  enemy.level || 20,
                  enemy.maxHp,
                  enemy.attack || 100,
                  enemy.defense || 50
                );
                
                // Add spawned adds to enemies list
                setEnemies(prev => [...prev, ...spawnedAdds.map(add => ({
                  id: add.id,
                  name: add.name,
                  hp: add.hp,
                  maxHp: add.maxHp,
                  attack: add.attack,
                  defense: add.defense,
                  level: add.level,
                  role: 'enemy',
                  activeBuffs: {},
                  activeDebuffs: {},
                  equipment: [],
                  shield: 0
                }))]);
                
                const addLogId = `adds-${enemy.id}-${mechanic.name}-${Date.now()}`;
                setCombatLog(prev => [...prev.slice(-199), {
                  id: addLogId,
                  timestamp: Date.now(),
                  message: getAddSpawnMessage(mechanic.adds, enemy.name),
                  type: 'mechanic'
                }]);
              } else if (mechanic.type === 'enrage') {
                // Enrage mechanic - will be handled in enrage system
                setBossMechanicsState(prev => {
                  const newState = new Map(prev);
                  const state = newState.get(enemy.id) || initializeBossMechanicsState();
                  newState.set(enemy.id, {
                    ...state,
                    enrageActive: true,
                    enrageStartTime: currentTime,
                    enrageDamageMultiplier: 1.0 + (mechanic.enrageDamageIncrease || 0.4)
                  });
                  return newState;
                });

                const enrageLogId = `enrage-${enemy.id}-${Date.now()}`;
                setCombatLog(prev => [...prev.slice(-199), {
                  id: enrageLogId,
                  timestamp: currentTime,
                  message: `${enemy.name} ENRAGES! Attack speed and damage increased!`,
                  type: 'mechanic'
                }]);
              }

              // Skip normal attack if mechanic was executed
              if (bossMechanicExecuted) {
                lastEnemyHpRef.current[enemy.id] = enemy.hp;
                return;
              }
            }
          }

          // Normal enemy attack (if no boss mechanic executed)
          const targetHero = aliveHeroes[Math.floor(Math.random() * aliveHeroes.length)];
          const baseDamage = enemy.attack || 100;
          const heroDefense = targetHero.defense || 0;
          
          // Check for Last Stand before calculating damage
          const now = Date.now();
          if (!targetHero.cooldowns) targetHero.cooldowns = {};
          if (!targetHero.classAbilityState) targetHero.classAbilityState = {};
          
          const hpPercent = targetHero.hp / targetHero.maxHp;
          const lastStandResult = checkLastStand(
            targetHero.id,
            targetHero.role,
            hpPercent,
            now,
            targetHero.cooldowns,
            targetHero.classAbilityState
          );
          
          // Apply Last Stand buff if activated
          if (lastStandResult.abilityUsed) {
            setHeroes(prev => prev.map(h => {
              if (h.id === targetHero.id) {
                return {
                  ...h,
                  cooldowns: { ...targetHero.cooldowns },
                  classAbilityState: { ...targetHero.classAbilityState },
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
            }));
          }
          
          let damage = calculateDamage(
            baseDamage,
            heroDefense,
            enemy.activeDebuffs,
            targetHero.activeDebuffs,
            enemy.activeBuffs,
            targetHero.activeBuffs,
            enemy.equipment,
            targetHero.equipment
          );
          
          // Apply Last Stand damage reduction if active
          if (targetHero.classAbilityState?.lastStandActive &&
              targetHero.classAbilityState?.lastStandExpiry &&
              now < targetHero.classAbilityState.lastStandExpiry) {
            damage = Math.floor(damage * 0.25); // 75% reduction
          }
          
          // Handle shield absorption
          const currentShield = targetHero.shield || 0;
          let remainingDamage = damage;
          let newShield = currentShield;
          
          if (currentShield > 0) {
            if (remainingDamage >= currentShield) {
              remainingDamage -= currentShield;
              newShield = 0;
            } else {
              newShield = currentShield - remainingDamage;
              remainingDamage = 0;
            }
          }
          
          // Final damage after shield
          const finalDamage = remainingDamage;

          const heroRef = heroRefs.current.get(targetHero.id);
          if (heroRef?.current) {
            heroRef.current.playAnimation('hurt');
          }

          const enemyRef = enemyRefs.current.get(enemy.id);
          if (enemyRef?.current) {
            enemyRef.current.playAnimation('attack');
          }

          // Generate log ID BEFORE the setTimeout to ensure it's the same if callback fires twice
          const enemyAttackLogId = `enemy-${enemy.id}-${targetHero.id}-${Date.now()}-${combatLogIdCounter.current++}`;

          setTimeout(() => {
            // Check if enemy uses projectiles
            const projectileEnemies = ['Witch', 'Skeleton Mage', 'Baby Dragon', 'Adult Dragon', 'Demon Lord', 'Elder Dragon'];
            const usesProjectile = projectileEnemies.includes(enemy.name);

            if (usesProjectile && enemyRef?.current) {
              const heroElement = document.querySelector(`#battle-hero-${targetHero.id}`) as HTMLElement;
              // For Elder Dragon, use the target div; for others, use the enemy sprite container
              const isElderDragon = enemy.name === 'Elder Dragon';
              const enemyElement = isElderDragon
                ? (document.getElementById('elder-dragon-target') as HTMLElement)
                : (document.querySelector(`#battle-enemy-${enemy.id}`) as HTMLElement);
              
              if (!enemyElement && isElderDragon) {
                console.warn('🎯 [Dragon] Target element not found for Elder Dragon enemy projectile');
              }
              
              if (heroElement && enemyElement) {
                if (isElderDragon) {
                  const style = window.getComputedStyle(enemyElement);
                  console.log('🎯 [Dragon] Target position for enemy projectile:', {
                    bottom: style.bottom,
                    right: style.right,
                    element: enemyElement
                  });
                }
                createProjectile(
                  enemyElement,
                  heroElement,
                  enemy.name,
                  undefined,
                  () => {
                    // Guard against duplicate processing (React StrictMode can cause double calls)
                    if (processedLogIds.current.has(enemyAttackLogId)) {
                      console.warn(`[Combat Log] Duplicate callback detected, skipping: ${enemyAttackLogId}`);
                      return;
                    }
                    processedLogIds.current.add(enemyAttackLogId);
                    
                    setHeroes(prev => prev.map(h => {
                      if (h.id === targetHero.id) {
                        const newHp = Math.max(0, h.hp - finalDamage);
                        showScrollingCombatText(`battle-hero-${targetHero.id}`, finalDamage, 'damage', true);
                        // Add to combat log
                        const logTimestamp = Date.now();
                        const logMessage = `${enemy.name} hits ${targetHero.name} for ${Math.floor(finalDamage)} damage`;
                        
                        console.log(`[Combat Log] Adding enemy projectile attack log: ${logMessage} (id: ${enemyAttackLogId})`);
                        setCombatLog(prev => {
                          // Double-check if this exact log entry already exists
                          const exists = prev.some(log => log.id === enemyAttackLogId);
                          if (exists) {
                            console.warn(`[Combat Log] Duplicate log entry detected in state, skipping: ${enemyAttackLogId}`);
                            return prev;
                          }
                          return [...prev.slice(-199), {
                            id: enemyAttackLogId,
                            timestamp: logTimestamp,
                            message: logMessage,
                            type: 'damage'
                          }];
                        });
                        return { ...h, hp: newHp, shield: newShield };
                      }
                      return h;
                    }));
                    
                    // Apply debuffs
                    const debuffResult = applyDebuff(targetHero, enemy, damage);
                    if (debuffResult.applied) {
                      setHeroes(prev => prev.map(h => {
                        if (h.id === targetHero.id) {
                          return { ...h, activeDebuffs: { ...h.activeDebuffs, ...debuffResult.debuffs } };
                        }
                        return h;
                      }));
                    }
                  }
                );
              }
            } else {
              // Melee attack - use the same log ID for consistency
              // Guard against duplicate processing (React StrictMode can cause double calls)
              if (processedLogIds.current.has(enemyAttackLogId)) {
                console.warn(`[Combat Log] Duplicate callback detected, skipping: ${enemyAttackLogId}`);
                return;
              }
              processedLogIds.current.add(enemyAttackLogId);
              
              setHeroes(prev => prev.map(h => {
                if (h.id === targetHero.id) {
                  const newHp = Math.max(0, h.hp - finalDamage);
                  showScrollingCombatText(`battle-hero-${targetHero.id}`, finalDamage, 'damage', true);
                  // Add to combat log
                  const logTimestamp = Date.now();
                  const logMessage = `${enemy.name} hits ${targetHero.name} for ${Math.floor(finalDamage)} damage`;
                  
                  console.log(`[Combat Log] Adding enemy melee attack log: ${logMessage} (id: ${enemyAttackLogId})`);
                  setCombatLog(prev => {
                    // Double-check if this exact log entry already exists
                    const exists = prev.some(log => log.id === enemyAttackLogId);
                    if (exists) {
                      console.warn(`[Combat Log] Duplicate log entry detected in state, skipping: ${enemyAttackLogId}`);
                      return prev;
                    }
                    return [...prev.slice(-199), {
                      id: enemyAttackLogId,
                      timestamp: logTimestamp,
                      message: logMessage,
                      type: 'damage'
                    }];
                  });
                  return { ...h, hp: newHp, shield: newShield };
                }
                return h;
              }));
              
              // Apply debuffs
              const debuffResult = applyDebuff(targetHero, enemy, damage);
              if (debuffResult.applied) {
                setHeroes(prev => prev.map(h => {
                  if (h.id === targetHero.id) {
                    return { ...h, activeDebuffs: { ...h.activeDebuffs, ...debuffResult.debuffs } };
                  }
                  return h;
                }));
              }
            }
          }, 300);
        }

        // Check if combat should continue after all actions
        if (index === combatants.length - 1) {
          setTimeout(() => {
            const aliveHeroes = heroes.filter(h => h.hp > 0);
            const aliveEnemies = enemies.filter(e => e.hp > 0);
            
            if (aliveHeroes.length > 0 && aliveEnemies.length > 0) {
              // Continue combat - reset processing flag before starting next round
              isCombatProcessingRef.current = false;
              console.log('[Raid Combat] Round complete, starting next round in 1s');
              setTimeout(() => {
                // Double-check guard before starting next round
                if (!isCombatProcessingRef.current) {
                  processCombatRound();
                } else {
                  console.warn('[Raid Combat] Next round cancelled - combat already processing');
                }
              }, 1000);
            } else {
              // Combat ended
              isCombatProcessingRef.current = false;
              console.log('[Raid Combat] Combat ended');
            }
          }, (combatants.length * 800) + 1000);
        }
      }, delay);
    });
  }, [heroes, enemies]);

  // Auto-start combat when enemies are present
  useEffect(() => {
    // Clear any existing timeout
    if (autoStartTimeoutRef.current) {
      clearTimeout(autoStartTimeoutRef.current);
      autoStartTimeoutRef.current = null;
    }
    
    if (heroes.length > 0 && enemies.length > 0 && !isCombatProcessingRef.current) {
      const aliveHeroes = heroes.filter(h => h.hp > 0);
      const aliveEnemies = enemies.filter(e => e.hp > 0);
      
      if (aliveHeroes.length > 0 && aliveEnemies.length > 0) {
        // Only schedule auto-start if not already scheduled
        if (!autoStartTimeoutRef.current) {
          console.log('[Raid Combat] Auto-start scheduled', {
            heroes: aliveHeroes.length,
            enemies: aliveEnemies.length,
            isProcessing: isCombatProcessingRef.current
          });
          
          // Use a timeout to prevent immediate re-triggering
          autoStartTimeoutRef.current = setTimeout(() => {
            // Double-check guard before starting
            if (!isCombatProcessingRef.current) {
              autoStartTimeoutRef.current = null;
              processCombatRound();
            } else {
              console.log('[Raid Combat] Auto-start cancelled - combat already processing');
              autoStartTimeoutRef.current = null;
            }
          }, 1000);
        }
      }
    }
    
    return () => {
      if (autoStartTimeoutRef.current) {
        clearTimeout(autoStartTimeoutRef.current);
        autoStartTimeoutRef.current = null;
      }
    };
  }, [heroes.length, enemies.length]); // Removed processCombatRound from dependencies to prevent re-triggers

  // Set transparent background for browser source mode
  useEffect(() => {
    if (isBrowserSource) {
      document.body.style.backgroundColor = 'transparent';
      document.documentElement.style.backgroundColor = 'transparent';
      return () => {
        document.body.style.backgroundColor = '';
        document.documentElement.style.backgroundColor = '';
      };
    }
  }, [isBrowserSource]);

  // Generate browser source URL with dragon positions and facing preferences
  const generateRaidBrowserSourceUrl = useCallback(() => {
    if (!instanceId || !user) return '';
    
    const token = localStorage.getItem('auth_token');
    if (!token) return '';
    
    const baseUrl = window.location.origin;
    const url = new URL(`/browser-source/raid/${instanceId}`, baseUrl);
    url.searchParams.set('browserSource', 'true');
    url.searchParams.set('token', token);
    
    // Include dragon container and target positions
    // Only include if they differ from the new browser source defaults (120px bottom, -128px right)
    // This ensures new browser source URLs use the correct defaults
    if (dragonContainerStyle.bottom && dragonContainerStyle.bottom !== '120px') {
      url.searchParams.set('dragonContainerBottom', dragonContainerStyle.bottom);
    }
    if (dragonContainerStyle.right && dragonContainerStyle.right !== '-128px') {
      url.searchParams.set('dragonContainerRight', dragonContainerStyle.right);
    }
    if (dragonContainerStyle.width) {
      url.searchParams.set('dragonContainerWidth', dragonContainerStyle.width);
    }
    if (dragonContainerStyle.height) {
      url.searchParams.set('dragonContainerHeight', dragonContainerStyle.height);
    }
    if (dragonTargetStyle.bottom) {
      url.searchParams.set('dragonTargetBottom', dragonTargetStyle.bottom);
    }
    if (dragonTargetStyle.right) {
      url.searchParams.set('dragonTargetRight', dragonTargetStyle.right);
    }
    
    // Include hero facing preferences
    try {
      const heroFacings = localStorage.getItem(HERO_FACING_STORAGE_KEY);
      if (heroFacings) {
        url.searchParams.set('heroFacing', encodeURIComponent(heroFacings));
      }
    } catch (e) {
      console.warn('Failed to get hero facing preferences:', e);
    }
    
    // Include enemy facing preferences (but exclude Elder Dragon - it should always use default)
    try {
      const enemyFacings = localStorage.getItem(ENEMY_FACING_STORAGE_KEY);
      if (enemyFacings) {
        const prefs = JSON.parse(enemyFacings);
        // Remove Elder Dragon from preferences so it uses default
        const { 'Elder Dragon': _, ...otherPrefs } = prefs;
        if (Object.keys(otherPrefs).length > 0) {
          url.searchParams.set('enemyFacing', encodeURIComponent(JSON.stringify(otherPrefs)));
        }
      }
    } catch (e) {
      console.warn('Failed to get enemy facing preferences:', e);
    }
    
    return url.toString();
  }, [instanceId, user, dragonContainerStyle, dragonTargetStyle]);
  

  const handleCommand = useCallback(async (command: string) => {
    console.log('🎮 [RaidBrowserSource] handleCommand called with:', command);
    console.log('🎮 [RaidBrowserSource] Instance:', instance ? 'exists' : 'null');
    console.log('🎮 [RaidBrowserSource] User:', user ? 'exists' : 'null');
    
    if (!command.trim()) {
      console.warn('⚠️ [RaidBrowserSource] Command is empty');
      return;
    }
    
    if (!instance) {
      console.warn('⚠️ [RaidBrowserSource] No instance available');
      return;
    }

    const cmd = command.trim().toLowerCase();
    
    // Get userId from user or fallback to instance participant for test raids
    let userId = user?.twitchId || user?.id;
    let username = user?.twitchUsername || user?.id;
    
    if (!userId && instance?.participants && instance.participants.length > 0) {
      // For test raids, use the first participant
      userId = instance.participants[0].userId;
      username = instance.participants[0].username || instance.participants[0].heroName || 'TestUser';
      console.log('⚠️ [RaidBrowserSource] No user logged in, using participant:', userId);
    }
    
    if (!userId) {
      console.error('❌ [RaidBrowserSource] No user ID available and no participants found');
      return;
    }

    // Check cooldown
    const lastUsed = commandCooldowns.get(cmd);
    const cooldown = COMMAND_COOLDOWNS[cmd] || 0;
    const now = Date.now();
    
    if (lastUsed && (now - lastUsed) < cooldown) {
      const remaining = Math.ceil((cooldown - (now - lastUsed)) / 1000);
      setChatMessages(prev => [...prev.slice(-99), {
        timestamp: Date.now(),
        user: 'System',
        message: `Command on cooldown. Wait ${remaining}s`,
        type: 'system'
      }]);
      return;
    }

    // Send command to backend
    console.log('📤 [RaidBrowserSource] Sending command to backend:', { cmd, userId, instanceId });
    try {
      const result = await raidAPI.sendInstanceCommand(instanceId!, userId, cmd);
      console.log('✅ [RaidBrowserSource] Command sent successfully:', result);
      
      // Update cooldown
      setCommandCooldowns(prev => new Map(prev).set(cmd, now));
      console.log('⏱️ [RaidBrowserSource] Cooldown set for', cmd, 'until', new Date(now + cooldown).toLocaleTimeString());
      
      // Trigger button press animation
      setButtonPressed(prev => new Map(prev).set(cmd, true));
      setTimeout(() => {
        setButtonPressed(prev => {
          const updated = new Map(prev);
          updated.delete(cmd);
          return updated;
        });
      }, 200);
      
      // Add to chat immediately (optimistic update)
      const chatUser = username || userId || 'You';
      setChatMessages(prev => [...prev.slice(-99), {
        timestamp: Date.now(),
        user: chatUser,
        message: `!${cmd}`,
        type: 'command'
      }]);
      
      // Also add to combat log
      const cmdLogId = `command-${chatUser}-${cmd}-${Date.now()}-${combatLogIdCounter.current++}`;
      setCombatLog(prev => {
        const exists = prev.some(log => log.id === cmdLogId);
        if (exists) return prev;
        return [...prev.slice(-199), {
          id: cmdLogId,
        timestamp: Date.now(),
        message: `${chatUser}: !${cmd}`,
        type: 'command'
        }];
      });
      
      // Reload instance to get updated state and chat from backend
      // Use a longer delay to batch with polling interval
      setTimeout(() => {
        if (instanceId) {
          loadInstance();
        }
      }, 1000); // Increased from 300ms to 1000ms to reduce rapid calls
    } catch (err: any) {
      console.error('Failed to send command:', err);
      setChatMessages(prev => [...prev.slice(-99), {
        timestamp: Date.now(),
        user: 'System',
        message: err.response?.data?.error || 'Failed to send command',
        type: 'system'
      }]);
    }
  }, [instance, user, instanceId, commandCooldowns, loadInstance]);

  const addChatMessage = (user: string, message: string, type: string = 'chat') => {
    const newMessage = {
      timestamp: Date.now(),
      user,
      message,
      type
    };
    setChatMessages(prev => [...prev.slice(-99), newMessage]);
    // Also add to combat log if it's a command or system message
    if (type === 'command' || type === 'system') {
      const sysLogId = `${type}-${user}-${Date.now()}-${combatLogIdCounter.current++}`;
      setCombatLog(prev => {
        const exists = prev.some(log => log.id === sysLogId);
        if (exists) return prev;
        return [...prev.slice(-199), {
          id: sysLogId,
        timestamp: Date.now(),
        message: `${user}: ${message}`,
        type
        }];
      });
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
      <div style={{
        width: isBrowserSource ? '1920px' : '100%',
        height: isBrowserSource ? '1080px' : '100%',
        backgroundColor: isBrowserSource ? 'transparent' : '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="text-white text-xl">Loading raid...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        width: isBrowserSource ? '1920px' : '100%',
        height: isBrowserSource ? '1080px' : '100%',
        backgroundColor: isBrowserSource ? 'transparent' : '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  if (!instance) {
    return (
      <div style={{
        width: isBrowserSource ? '1920px' : '100%',
        height: isBrowserSource ? '1080px' : '100%',
        backgroundColor: isBrowserSource ? 'transparent' : '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="text-white text-xl">Raid instance not found</div>
      </div>
    );
  }

  return (
    <div 
      style={{
        width: '1920px',
        height: '1080px',
        position: 'relative',
        backgroundColor: isBrowserSource ? 'transparent' : '#000000',
        overflow: 'hidden'
      }}
      onClick={(e) => {
        console.log('🔍 [Debug] Main container clicked:', e.target);
      }}
    >
      {/* Battlefield */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
        {/* Hero Sprites - Sort by role: Tanks (front/right) last in array to be rightmost */}
        {[...heroes].sort((a, b) => {
          // Tank roles go to the right (front) since facing right
          // In flexbox left-to-right, rightmost items are rendered last
          const tankRoles = ['guardian', 'paladin', 'warden', 'bloodknight', 'vanguard', 'brewmaster'];
          const aIsTank = tankRoles.includes(a.role.toLowerCase());
          const bIsTank = tankRoles.includes(b.role.toLowerCase());
          
          if (aIsTank && !bIsTank) return 1; // Tanks last (rightmost)
          if (!aIsTank && bIsTank) return -1;
          return 0; // Keep original order for same role type
        }).map((hero, idx) => {
          const ref = getOrCreateHeroRef(hero.id);
          const shield = heroShields[hero.id] || 0;
          const tankRoles = ['guardian', 'paladin', 'warden', 'bloodknight', 'vanguard', 'brewmaster'];
          const isTank = tankRoles.includes(hero.role.toLowerCase());
          const heroSpacing = 200; // More spacing for raids
          return (
            <div
              key={hero.id}
              id={`battle-hero-${hero.id}`}
              className="hero-sprite-container"
              style={{
                position: 'absolute',
                bottom: isBrowserSource ? '296px' : '200px', // Move down 1 inch (96px) in browser source mode
                left: `${200 + idx * heroSpacing}px`,
                width: '96px',
                height: '96px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 10,
                pointerEvents: 'none'
              }}
            >
              {/* Health Bar, Health Count, Buffs, and Name - Above sprite in browser source mode */}
              {isBrowserSource && (
                <>
                  {/* Buff/Debuff Indicators - Top */}
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
                    style={{ position: 'absolute', top: '-80px', left: '50%', transform: 'translateX(-50%)' }}
                  />
                  
                  {/* Health Bar - Below buffs */}
                  <div className="health-bar-container" style={{ position: 'absolute', top: '-60px', width: '100%' }}>
                    {/* Shield Bar (if shield exists) */}
                    {shield > 0 && (
                      <div className="shield-bar" style={{ width: '100%', height: '3px', backgroundColor: '#1e40af', borderRadius: '2px', overflow: 'hidden', marginBottom: '2px' }}>
                        <div
                          className="shield-fill"
                          style={{
                            width: `${Math.min((shield / hero.maxHp) * 100, 100)}%`,
                            height: '100%',
                            backgroundColor: '#3b82f6',
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </div>
                    )}
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
                      {Math.floor(hero.hp)}/{hero.maxHp} {shield > 0 && `+${Math.floor(shield)}`}
                    </div>
                  </div>
                  
                  {/* Name and Level - Below health bar, above sprite */}
                  <div style={{
                    color: '#fbbf24',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    marginBottom: '4px',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                    whiteSpace: 'nowrap',
                    position: 'absolute',
                    top: '-40px',
                    left: '50%',
                    transform: 'translateX(-50%)'
                  }}>
                    {hero.name} Lv.{hero.level}
                  </div>
                </>
              )}
              
              {/* Name and Level - Above sprite (normal mode only) */}
              {!isBrowserSource && (
                <div style={{
                  color: '#fbbf24',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  marginBottom: '4px',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                  whiteSpace: 'nowrap',
                  position: 'absolute',
                  top: '-50px'
                }}>
                  {hero.name} Lv.{hero.level}
                </div>
              )}
              
              <HeroSpriteJS
                ref={ref}
                heroId={hero.id}
                role={hero.role}
                facing={(() => {
                  // In browser source mode, set facing based on role
                  if (isBrowserSource) {
                    const meleeDpsRoles = ['berserker', 'crusader', 'assassin', 'reaper', 'bladedancer', 'monk', 'stormwarrior', 'hunter'];
                    const healerRoles = ['cleric', 'atoner', 'druid', 'lightbringer', 'shaman', 'mistweaver', 'chronomancer', 'bard'];
                    const role = hero.role.toLowerCase();
                    
                    // Melee DPS and healers face left, others (tanks, ranged DPS) face right
                    if (meleeDpsRoles.includes(role) || healerRoles.includes(role)) {
                      return 'left';
                    }
                    return 'right';
                  }
                  // In normal mode, use saved preferences
                  return heroFacings[hero.id] || getSavedFacing(HERO_FACING_STORAGE_KEY, hero.role, searchParams);
                })()}
                scale={isTank ? 3.0 : 2.0} // Tanks are 150% larger (3.0 vs 2.0)
                shield={shield}
                onAnimationComplete={() => {}}
              />
              
              {/* Health Bar - Below sprite (normal mode only) */}
              {!isBrowserSource && (
                <div className="health-bar-container" style={{ position: 'absolute', bottom: '10px', width: '100%' }}>
                  {/* Shield Bar (if shield exists) */}
                  {shield > 0 && (
                    <div className="shield-bar" style={{ width: '100%', height: '3px', backgroundColor: '#1e40af', borderRadius: '2px', overflow: 'hidden', marginBottom: '2px' }}>
                      <div
                        className="shield-fill"
                        style={{
                          width: `${Math.min((shield / hero.maxHp) * 100, 100)}%`,
                          height: '100%',
                          backgroundColor: '#3b82f6',
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </div>
                  )}
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
                    {Math.floor(hero.hp)}/{hero.maxHp} {shield > 0 && `+${Math.floor(shield)}`}
                  </div>
                </div>
              )}
              
              {/* Buff/Debuff Indicators - Below sprite, above health bar (normal mode only) */}
              {!isBrowserSource && (
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
                  style={{ top: '96px', left: '50%', transform: 'translateX(-50%)' }}
                />
              )}
            </div>
          );
        })}

        {/* Enemy Sprites */}
        {enemies.filter(e => e.hp > 0).map((enemy, idx) => {
          const ref = getOrCreateEnemyRef(enemy.id);
          const shield = enemyShields[enemy.id] || 0;
          const isElderDragon = enemy.name === 'Elder Dragon';
          const enemyScale = isElderDragon ? 15.0 : 2.5; // Scale Elder Dragon 15x (3x more than before)
          // EnemySpriteJS uses VIEWPORT of 48px internally, scaled by the scale prop
          // At 15x scale: 48px * 15 = 720px
          // The sprite frames (725x445) get scaled down to fit the 48px viewport first
          // scaleY = 48/445 ≈ 0.108, so scaledFrameHeight = 445 * 0.108 ≈ 48px
          // Then the entire 48px viewport gets scaled by 15x to 720px
          // The sprite uses transformOrigin: "bottom center", so it anchors at the bottom
          // The container should match the scaled viewport size (720px)
          // But since the sprite might not fill the full viewport, we can make the container tighter
          const scaledViewport = 48 * enemyScale; // 720px for Elder Dragon
          // Make container slightly smaller to fit actual sprite better (reduce by ~10% to account for sprite not filling viewport)
          const defaultContainerSize = isElderDragon ? Math.round(scaledViewport * 0.9) : 96; // ~648px for Elder Dragon
          
          // Use saved style or defaults for Elder Dragon
          // In browser source mode, move enemies down 1 inch (96px)
          const defaultEnemyBottom = isBrowserSource ? '296px' : '200px';
          // For Elder Dragon in browser source: align feet with heroes (296px) and move further right
          // Force new defaults in browser source mode - completely ignore URL params and localStorage
          let elderDragonBottom: string;
          let elderDragonRight: string;
          
          if (isBrowserSource && isElderDragon) {
            // Always use new defaults in browser source mode for proper alignment
            // Sprite setup is reversed: decrease bottom to move down, decrease right to move right (away from right edge)
            elderDragonBottom = '120px'; // 144px - 24px (a little more down, reversed)
            elderDragonRight = `${-128 + idx * 800}px`; // -32px - 96px (another 1 inch right, reversed)
            console.log('🐉 [Dragon Browser Source] Forcing new defaults (reversed for sprite):', { bottom: elderDragonBottom, right: elderDragonRight, isBrowserSource, isElderDragon });
          } else {
            // Normal mode - use saved positions
            const hasUrlParams = isBrowserSource && (searchParams.get('dragonContainerBottom') || searchParams.get('dragonContainerRight'));
            elderDragonBottom = isBrowserSource 
              ? (hasUrlParams && dragonContainerStyle.bottom ? dragonContainerStyle.bottom : '296px')
              : (dragonContainerStyle.bottom || '-136px');
            elderDragonRight = isBrowserSource
              ? (hasUrlParams && dragonContainerStyle.right ? dragonContainerStyle.right : `${400 + idx * 800}px`)
              : (dragonContainerStyle.right || `${200 + idx * 800}px`);
          }
          const containerBottom = isElderDragon 
            ? elderDragonBottom
            : defaultEnemyBottom;
          const containerRight = isElderDragon
            ? elderDragonRight
            : `${200 + idx * 150}px`;
          const containerWidth = isElderDragon
            ? (dragonContainerStyle.width || `${defaultContainerSize}px`)
            : `${defaultContainerSize}px`;
          const containerHeight = isElderDragon
            ? (dragonContainerStyle.height || `${defaultContainerSize}px`)
            : `${defaultContainerSize}px`;
          
          // Debug logging for browser source mode
          if (isBrowserSource && isElderDragon) {
            console.log('🐉 [Dragon Browser Source] Final position values:', {
              containerBottom,
              containerRight,
              elderDragonBottom,
              elderDragonRight,
              dragonContainerStyle,
              hasUrlParams: !!(searchParams.get('dragonContainerBottom') || searchParams.get('dragonContainerRight'))
            });
          }
          
          return (
            <React.Fragment key={enemy.id}>
              <div
                ref={isElderDragon ? dragonContainerRef : null}
                id={isElderDragon ? 'elder-dragon-container' : `battle-enemy-${enemy.id}`}
                className={`enemy-sprite-container ${isElderDragon ? 'elder-dragon-container-editable' : ''}`}
                data-enemy-id={enemy.id}
                data-enemy-name={enemy.name}
              style={{
                position: 'absolute',
                  bottom: containerBottom,
                  right: containerRight,
                  width: containerWidth,
                  height: containerHeight,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                  justifyContent: 'center',
                zIndex: 10,
                  pointerEvents: isElderDragon && dragonEditMode ? 'auto' : 'none',
                  border: 'none',
                  boxSizing: 'border-box',
                  cursor: isElderDragon && dragonEditMode ? 'move' : 'default'
                } as React.CSSProperties}
                // Add data attributes for easy selection and adjustment in DevTools
                data-container-bottom={containerBottom}
                data-container-right={containerRight}
                data-container-width={containerWidth}
                data-container-height={containerHeight}
              >
                {/* Drag handle - appears in edit mode */}
                {isElderDragon && dragonEditMode && (
                  <div
                    className="dragon-drag-handle"
                    style={{
                      position: 'absolute',
                      top: '10px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '60px',
                      height: '20px',
                      backgroundColor: 'rgba(0, 255, 0, 0.7)',
                      border: '2px solid green',
                      borderRadius: '4px',
                      cursor: 'move',
                      zIndex: 1000,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      color: 'white',
                      fontWeight: 'bold',
                      userSelect: 'none'
                    }}
                  >
                    DRAG
                  </div>
                )}
                
                {/* Resize handle - appears in edit mode */}
                {isElderDragon && dragonEditMode && (
                  <div
                    className="dragon-resize-handle"
                    style={{
                      position: 'absolute',
                      bottom: '0',
                      right: '0',
                      width: '20px',
                      height: '20px',
                      backgroundColor: 'rgba(255, 255, 0, 0.7)',
                      border: '2px solid yellow',
                      borderRadius: '4px 0 0 0',
                      cursor: 'nwse-resize',
                      zIndex: 1000,
                      userSelect: 'none'
                    }}
                  />
                )}
                
                {/* Buff/Debuff Indicators - Only for non-Elder Dragon enemies */}
                {!isElderDragon && (
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
                )}
              
                <EnemySprite
                  ref={ref}
                  enemyId={enemy.id}
                  enemyName={enemy.name}
                  enemyType={enemy.name}
                  facing={enemyFacings[enemy.id] || getSavedFacing(ENEMY_FACING_STORAGE_KEY, enemy.name, searchParams)}
                  scale={enemyScale} // Scale Elder Dragon 15x larger, others 2.5x
                  isTransformed={enemy.name === 'Werewolf' ? werewolfTransformed.current.has(enemy.id) : false}
                  onAnimationComplete={() => {}}
                />
              </div>
              {/* Target div for Elder Dragon - where projectiles originate and attacks land (invisible but keeps position) */}
              {isElderDragon && (() => {
                // Calculate target position - use saved position if available, otherwise use container center
                const targetBottom = dragonTargetStyle.bottom || containerBottom;
                const targetRight = dragonTargetStyle.right || containerRight;
                
                // Log for debugging
                if (isBrowserSource) {
                  console.log('🎯 [Dragon Browser Source] Target position:', {
                    saved: dragonTargetStyle,
                    calculated: { bottom: targetBottom, right: targetRight },
                    container: { bottom: containerBottom, right: containerRight }
                  });
                }
                
                return (
                  <div
                    ref={dragonTargetRef}
                    id="elder-dragon-target"
                    className="elder-dragon-target"
                    style={{
                      position: 'absolute',
                      bottom: targetBottom,
                      right: targetRight,
                      width: '20px',
                      height: '20px',
                      transform: 'translate(50%, 50%)', // Center the target point
                      zIndex: 11,
                      pointerEvents: dragonEditMode ? 'auto' : 'none',
                      boxSizing: 'border-box',
                      opacity: 0, // Invisible but still exists for projectile targeting
                      visibility: 'hidden'
                    }}
                    data-target-bottom={targetBottom}
                    data-target-right={targetRight}
                  />
                );
              })()}
            </React.Fragment>
          );
        })}
        
        {/* Dark Souls Style Health Bar - Top Center (only for Elder Dragon) */}
        {showBossHealthBar && enemies.filter(e => e.hp > 0 && e.name === 'Elder Dragon').map((enemy) => {
          const shield = enemyShields[enemy.id] || 0;
          const buffs = enemy.activeBuffs ? Object.values(enemy.activeBuffs) : [];
          const debuffs = enemy.activeDebuffs ? Object.values(enemy.activeDebuffs) : [];
          
          return (
            <div
              key={`healthbar-${enemy.id}`}
              className="absolute top-20 left-1/2 transform -translate-x-1/2"
              style={{
                zIndex: 2000,
                width: '500px',
                pointerEvents: 'none'
              }}
            >
              {/* Enemy Name */}
              <div style={{
                color: '#fff',
                fontSize: '18px',
                fontWeight: 'bold',
                textAlign: 'center',
                marginBottom: '8px',
                textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
                letterSpacing: '1px'
              }}>
                {enemy.name}
              </div>
              
              {/* Health Bar Container - Dark Souls Style */}
              <div style={{
                width: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '4px',
                padding: '8px',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.5)'
              }}>
                {/* Shield Bar (if shield exists) - Above health bar */}
                {shield > 0 && (
                  <div style={{
                    width: '100%',
                    height: '4px',
                    backgroundColor: 'rgba(59, 130, 246, 0.3)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                    marginBottom: '4px'
                  }}>
                    <div
                      style={{
                        width: `${Math.min((shield / enemy.maxHp) * 100, 100)}%`,
                        height: '100%',
                        backgroundColor: '#3b82f6',
                        transition: 'width 0.3s ease',
                        boxShadow: '0 0 8px rgba(59, 130, 246, 0.6)'
                      }}
                    />
                  </div>
                )}
                
                {/* Health Bar */}
                <div style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: 'rgba(50, 50, 50, 0.8)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  position: 'relative'
                }}>
                  <div
                    style={{
                      width: `${(enemy.hp / enemy.maxHp) * 100}%`,
                      height: '100%',
                      backgroundColor: enemy.hp > 0 ? '#ef4444' : '#666',
                      transition: 'width 0.3s ease',
                      boxShadow: enemy.hp > 0 ? '0 0 12px rgba(239, 68, 68, 0.8)' : 'none',
                      position: 'relative'
                    }}
                  >
                    {/* Health bar glow effect */}
                    {enemy.hp > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                        animation: 'shimmer 2s infinite'
                      }} />
                    )}
                </div>
                </div>
                
                {/* HP Text */}
                <div style={{
                  fontSize: '12px',
                  color: '#fff',
                  textAlign: 'center',
                  marginTop: '4px',
                  fontWeight: 'bold',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                }}>
                  {Math.floor(enemy.hp)} / {enemy.maxHp} {shield > 0 && `+${Math.floor(shield)}`}
                </div>
                
                {/* Buffs and Debuffs - Horizontal row below health bar */}
                {(buffs.length > 0 || debuffs.length > 0) && (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px',
                    justifyContent: 'center',
                    marginTop: '6px',
                    paddingTop: '6px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    {/* Buffs */}
                    {buffs.map((buff, index) => (
                      <div
                        key={`buff-${index}`}
                        title={`${buff.name}${buff.remainingDuration && buff.remainingDuration !== Infinity ? ` (${Math.ceil(buff.remainingDuration / 1000)}s)` : ''}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                          padding: '2px 6px',
                          backgroundColor: 'rgba(16, 185, 129, 0.2)',
                          borderRadius: '3px',
                          border: `1px solid ${buff.color || '#10b981'}`,
                          fontSize: '10px',
                          color: buff.color || '#10b981',
                          fontWeight: 'bold'
                        }}
                      >
                        {buff.icon && <span>{buff.icon}</span>}
                        <span>{buff.name}</span>
                      </div>
                    ))}
                    
                    {/* Debuffs */}
                    {debuffs.map((debuff, index) => (
                      <div
                        key={`debuff-${index}`}
                        title={`${debuff.name}${debuff.remainingDuration ? ` (${Math.ceil(debuff.remainingDuration / 1000)}s)` : ''}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                          padding: '2px 6px',
                          backgroundColor: 'rgba(239, 68, 68, 0.2)',
                          borderRadius: '3px',
                          border: `1px solid ${debuff.color || '#ef4444'}`,
                          fontSize: '10px',
                          color: debuff.color || '#ef4444',
                          fontWeight: 'bold'
                        }}
                      >
                        {debuff.icon && <span>{debuff.icon}</span>}
                        <span>{debuff.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Chat Box - Right Side (Hidden in browser source mode) */}
      {!isBrowserSource && (
      <div className="absolute top-4 right-4 bg-gray-900/90 border border-gray-700 rounded-lg flex flex-col" style={{ width: '480px', height: 'calc(48vh - 4px)', zIndex: 1000 }}>
        <div className="p-2 border-b border-gray-700">
          <div className="text-sm font-bold text-white">Chat</div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1" style={{ fontSize: '12px' }}>
          {chatMessages.length === 0 ? (
            <div className="text-gray-500 text-center py-4">No messages yet</div>
          ) : (
            chatMessages.map((msg, idx) => (
              <div key={idx} className="text-gray-300">
                <span className="text-gray-500 text-xs">[{new Date(msg.timestamp).toLocaleTimeString()}]</span>{' '}
                <span className="text-blue-400 font-semibold">{msg.user}:</span>{' '}
                <span className={msg.type === 'command' ? 'text-yellow-400' : ''}>{msg.message}</span>
              </div>
            ))
          )}
        </div>
        <div className="p-2 border-t border-gray-700">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === 'Enter' && chatInput.trim()) {
                const cmd = chatInput.trim();
                if (cmd.startsWith('!')) {
                  handleCommand(cmd.substring(1));
                } else {
                  // Regular chat message
                  const message = cmd;
                  
                  if (!instanceId) {
                    addChatMessage('System', 'Unable to send message: Instance not loaded', 'system');
                    setChatInput('');
                    return;
                  }
                  
                  // Try to get userId from multiple sources
                  let userId = user?.twitchId || user?.id;
                  
                  // If no user ID from auth, try to get it from instance participants
                  if (!userId && instance?.participants && instance.participants.length > 0) {
                    // Try to find a participant that matches the current user
                    const matchingParticipant = instance.participants.find((p: RaidParticipant) => 
                      p.userId === user?.twitchId || 
                      p.userId === user?.id ||
                      p.username === user?.twitchUsername
                    );
                    if (matchingParticipant) {
                      userId = matchingParticipant.userId;
                    } else {
                      // If no match, use the first participant as fallback (for testing)
                      userId = instance.participants[0].userId;
                    }
                  }
                  
                  if (!userId) {
                    addChatMessage('System', 'Unable to send message: Please log in or ensure you are a participant', 'system');
                    setChatInput('');
                    return;
                  }
                  
                  try {
                    // Send chat message to backend
                    await raidAPI.sendInstanceChat(instanceId, userId, message);
                    
                    // Add to local chat immediately (optimistic update)
                    const displayName = user?.twitchUsername || 
                                      instance?.participants?.find((p: RaidParticipant) => p.userId === userId)?.username ||
                                      instance?.participants?.find((p: RaidParticipant) => p.userId === userId)?.heroName ||
                                      userId || 
                                      'You';
                    addChatMessage(displayName, message, 'chat');
                    
                    // Reload instance to get updated chat from backend
                    // Use longer delay to reduce rapid calls
                    setTimeout(() => loadInstance(), 1000);
                  } catch (err: any) {
                    console.error('Failed to send chat message:', err);
                    addChatMessage('System', err.response?.data?.error || 'Failed to send chat message', 'system');
                  }
                }
                setChatInput('');
              }
            }}
            placeholder="Type message or !command (!attack, !heal, etc.)"
            className="w-full px-2 py-1 bg-gray-800 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            style={{ fontSize: '12px' }}
          />
          <div className="text-xs text-gray-500 mt-1">
            Commands: !attack, !heal, !ability, !defend, !dispel, !rest
          </div>
        </div>
      </div>
      )}

      {/* Enhanced Combat Log - Left Side (Hidden in browser source mode) */}
      {!isBrowserSource && (
        <CombatLog
          entries={combatLog.map(log => ({
            id: log.id,
            timestamp: log.timestamp,
            message: log.message,
            type: log.type as any
          }))}
          maxEntries={200}
          showFilters={true}
          showSearch={true}
          position="left"
          autoScroll={true}
        />
      )}

      {/* Action Buttons - Bottom Center (Hidden in browser source mode) */}
      {!isBrowserSource && (
      <div 
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-900/90 border border-gray-700 rounded-lg p-3" 
        style={{ zIndex: 10000, pointerEvents: 'auto' }}
        onClick={(e) => {
          console.log('🔍 [Debug] Button container clicked:', e.target, e.currentTarget);
        }}
      >
        <div className="flex gap-2">
          {Object.entries(COMMAND_COOLDOWNS).map(([cmd, cooldownMs], idx) => {
            const isOnCooldown = commandCooldowns.has(cmd);
            const remaining = cooldownRemaining.get(cmd) || 0;
            const cooldownSec = cooldownMs / 1000;
            const isPressed = buttonPressed.has(cmd);
            
            return (
              <button
                key={cmd}
                type="button"
                onMouseEnter={() => console.log('🖱️ [Debug] Mouse entered button:', cmd)}
                onMouseLeave={() => console.log('🖱️ [Debug] Mouse left button:', cmd)}
                onMouseDown={(e) => {
                  console.log('🖱️ [Debug] Mouse down on button:', cmd, {
                    isOnCooldown,
                    hasInstance: !!instance,
                    hasUser: !!user,
                    wouldBeDisabled: isOnCooldown || !instance || !user
                  });
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🖱️ Button clicked:', cmd, {
                    isOnCooldown,
                    hasInstance: !!instance,
                    hasUser: !!user,
                    instanceId: instanceId
                  });
                  
                  // Don't check disabled state - handle it in the function
                  if (isOnCooldown) {
                    console.warn('❌ Command on cooldown');
                    return;
                  }
                  
                  if (!instance) {
                    console.warn('❌ No instance available');
                    return;
                  }
                  
                  console.log('✅ Executing command:', cmd);
                  handleCommand(cmd);
                }}
                className={`w-20 h-20 rounded text-sm font-semibold transition-all flex flex-col items-center justify-center ${
                  isOnCooldown
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : isPressed
                    ? 'bg-blue-800 text-white scale-95'
                    : 'bg-blue-600 hover:bg-blue-700 text-white active:bg-blue-800 active:scale-95'
                }`}
                style={{ 
                  position: 'relative',
                  transform: isPressed ? 'scale(0.9)' : 'scale(1)',
                  transition: 'transform 0.1s ease, background-color 0.2s ease',
                  zIndex: 10001,
                  pointerEvents: 'auto',
                  cursor: (isOnCooldown || !instance || !user) ? 'not-allowed' : 'pointer',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  opacity: (isOnCooldown || !instance || !user) ? 0.5 : 1
                }}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="capitalize text-xs font-bold">{cmd}</span>
                  {isOnCooldown && (
                    <span className="text-lg font-mono font-bold text-yellow-400">{remaining}</span>
                  )}
                </div>
                {isOnCooldown && (
                  <>
                    <div
                      className="absolute bottom-0 left-0 h-1 bg-blue-500 rounded-b"
                      style={{
                        width: `${((cooldownSec - remaining) / cooldownSec) * 100}%`,
                        transition: 'width 0.1s linear'
                      }}
                    />
                    <div className="absolute inset-0 bg-black/30 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-400">CD</span>
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
      )}

      {/* Raid Info - Centered at Top (Hidden in browser source mode) */}
      {!isBrowserSource && instance && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-center" style={{ zIndex: 1000 }}>
          <div className="text-white font-bold text-lg mb-1" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
            {instance.raidId || 'Raid'}
            </div>
          <div className="text-gray-300 text-sm mb-2" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
            {instance.currentWave > 0 && (
              <span>Wave {instance.currentWave} / {instance.maxWaves}</span>
            )}
            {instance.currentWave > 0 && instance.participants && instance.participants.length > 0 && (
              <span className="mx-2">•</span>
            )}
            {instance.participants && instance.participants.length > 0 && (
              <span>Participants: {instance.participants.length}</span>
            )}
          </div>
          <button
            onClick={() => setShowBossHealthBar(!showBossHealthBar)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded transition-colors ml-2"
            style={{ pointerEvents: 'auto' }}
          >
            {showBossHealthBar ? '👁️ Hide Health Bar' : '👁️‍🗨️ Show Health Bar'}
          </button>
          <button
            onClick={() => setShowDamageMeter(!showDamageMeter)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded transition-colors ml-2"
            style={{ pointerEvents: 'auto' }}
          >
            {showDamageMeter ? '📊 Hide DPS' : '📊 Show DPS'}
          </button>
          <button
            onClick={() => setShowRaidFrames(!showRaidFrames)}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-semibold rounded transition-colors ml-2"
            style={{ pointerEvents: 'auto' }}
          >
            {showRaidFrames ? '👥 Hide Frames' : '👥 Show Frames'}
          </button>
          {raidData?.boss && (
            <button
              onClick={() => setShowStrategyGuide(!showStrategyGuide)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded transition-colors ml-2"
              style={{ pointerEvents: 'auto' }}
            >
              {showStrategyGuide ? '📖 Hide Guide' : '📖 Show Guide'}
            </button>
          )}
        </div>
      )}
      
      {/* Damage Meter */}
      {showDamageMeter && !isBrowserSource && (
        <DamageMeter
          meters={calculateDamageMeters(damageMeterState)}
          showHealing={true}
          showDamageTaken={true}
          maxDisplay={10}
          position="right"
        />
      )}
      
      {/* Raid Frames */}
      {showRaidFrames && !isBrowserSource && (
        <RaidFrames
          heroes={heroes.map(h => ({
            id: h.id,
            name: h.name,
            hp: h.hp,
            maxHp: h.maxHp,
            role: h.role || 'Unknown',
            isAlive: h.hp > 0,
            activeBuffs: h.activeBuffs,
            activeDebuffs: h.activeDebuffs
          }))}
          position="left"
          showBuffs={true}
          showDebuffs={true}
        />
      )}
      
      {/* Boss Strategy Guide */}
      {showStrategyGuide && raidData?.boss && !isBrowserSource && (
        <BossStrategyGuide
          bossName={raidData.boss.name}
          mechanics={raidData.boss.mechanics || []}
          phases={raidData.boss.phases || []}
          onClose={() => setShowStrategyGuide(false)}
        />
      )}
      
      {/* Boss Ability Timer */}
      {raidData?.boss && enemies.some(e => e.isBoss && e.hp > 0) && !isBrowserSource && (
        <BossAbilityTimer
          mechanics={raidData.boss.mechanics || []}
          currentPhase={bossMechanicsState.get(enemies.find(e => e.isBoss)?.id || '')?.currentPhase || 1}
          mechanicCooldowns={bossMechanicsState.get(enemies.find(e => e.isBoss)?.id || '')?.mechanicCooldowns || new Map()}
          currentTime={Date.now()}
          maxDisplay={5}
        />
      )}
      
      {/* Death Recap Modal */}
      {deathRecapData && (
        <DeathRecap
          recap={deathRecapData}
          onClose={() => setDeathRecapData(null)}
        />
      )}

      {/* Add shimmer animation for health bar glow */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
