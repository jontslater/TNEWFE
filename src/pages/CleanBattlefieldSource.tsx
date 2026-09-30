/**
 * Clean Battlefield Source - Built from scratch
 * 
 * Step 1: Display heroes only
 * - Transparent background (OBS ready)
 * - Heroes from Firebase (currentBattlefieldId match)
 * - Hero sprites on left side
 * - HP bars and names
 * - Nothing else!
 */

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, getDocs, limit } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { generateEnemiesForCombat } from '../utils/enemyGeneration';
import { generateDungeonEnemies } from '../utils/dungeonEnemyGeneration';
import HeroSpriteJS from '../components/HeroSpriteJS';
import EnemySpriteJS from '../components/EnemySpriteJS';
import { battlefieldAPI, heroAPI, questAPI } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useActiveInstanceListener } from '../hooks/useActiveInstanceListener';
import { useWebSocket } from '../hooks/useWebSocket';
import { DEBUFFS, SHOP_ITEMS } from '../utils/fullCombatEngine';
import { generateLoot, isItemBetter, calculateItemPower } from '../utils/lootGeneration';
import { calculateSetBonuses } from '../utils/setBonuses';
import { getNameFrameStyles } from '../utils/nameFrames';
import { getFounderTitleColor, getFounderTitleDisplay, getFounderTierFromTitle } from '../utils/founderTitle';
import { getAuraFilter } from '../utils/auraEffects';
import { createProjectile } from '../utils/projectiles';
import { BALANCE } from '../config/balanceConfig';
import { createLootDropAnnouncement, getRarityStyle } from '../utils/rarityDisplay';
import { createExhaustEffect, shouldShowExhaustEffect } from '../utils/exhaustEffects';
import { createMusicalNoteEffect } from '../utils/musicalNoteEffects';
import type { 
  OverlayHero, 
  OverlayEnemy, 
  CombatAction as OverlayCombatAction
} from '../types/overlay';

// Type aliases for backward compatibility
type Hero = OverlayHero;
type Enemy = OverlayEnemy;
type CombatAction = OverlayCombatAction;

// DEPRECATED interfaces - moved to src/types/overlay.ts
/* interface Hero {
  id: string;
  name: string;
  role: string;
  level: number;
  hp: number;
  maxHp: number;
  shield?: number;
  activeBuffs?: {
    lastStand?: { active: boolean; expiresAt: number };
    ironSkin?: { active: boolean; expiresAt: number };
    divineGrace?: { active: boolean; expiresAt: number };
    criticalStrike?: { active: boolean };
  };
  activeDebuffs?: Record<string, {
    expiresAt: number;
    appliedBy: string;
    lastTick?: number;
    value?: number;
  }>;
  shopBuffs?: {
    xpBoost?: { remainingDuration: number; lastUpdateTime: number };
    attackBuff?: { remainingDuration: number; lastUpdateTime: number };
    defenseBuff?: { remainingDuration: number; lastUpdateTime: number };
  };
  enrageExpiry?: number; // Timestamp when enrage expires
  tauntExpiry?: number; // Timestamp when taunt expires (forces enemy targeting)
  fadeExpiry?: number; // Timestamp when fade expires (reduces threat)
  cooldowns?: {
    groupHeal?: number; // Last use timestamp
    shieldWall?: number;
    chainLightning?: number;
    whirlwind?: number;
    bloodthirst?: number;
    raiseDead?: number; // Necromancer skeleton summon cooldown
  };
  // Minion properties (for necromancer skeletons)
  isMinion?: boolean;
  summonerId?: string; // ID of hero who summoned this minion
  skeletonType?: 'Yellow' | 'White'; // For sprite selection
  minionExpiresAt?: number; // Timestamp when minion expires
  xp?: number;
  maxXp?: number;
  attack?: number;
  defense?: number;
  isDead?: boolean;
  deathTime?: number;
  currentBattlefieldId?: string;
  autoBuy?: boolean;
  gold?: number;
  tokens?: number;
  lastTokenClaim?: number;
  potions?: {
    health: number;
  };
  profession?: {
    type: string;
    level: number;
    xp: number;
    materials: Record<string, number>;
  };
  quests?: {
    daily?: any;
    weekly?: any;
    monthly?: any;
  };
  // Gear and stats
  equipment?: Record<string, any>;
  skills?: Record<string, any>;
  enchantedItems?: any[];
  // Calculated stats
  intellect?: number;
  strength?: number;
  dexterity?: number;
  wisdom?: number;
  stamina?: number;
  healingPower?: number;
  spellDamage?: number;
  meleeDamage?: number;
  hpRegen?: number;
  damageReduction?: number;
  critChance?: number;
  // Cosmetic fields
  activeTitle?: string;
  founderBadge?: string;
  founderPackTier?: string; // 'bronze', 'silver', 'gold', 'platinum'
  nameColor?: string;
  nameFrame?: string;
  auraEffect?: string;
  auraColor?: string;
  prestigeLevel?: number;
  spellEffect?: string;
} */

// DEPRECATED Enemy interface - moved to src/types/overlay.ts
/* interface Enemy {
  id: string;
  name: string;
  enemyType?: string; // Sprite type for animation lookup (e.g., "Skeleton Mage" instead of "Skeleton 1")
  level: number;
  hp: number;
  maxHp: number;
  shield?: number;
  attack?: number;
  defense?: number;
  xp?: number;
  isBoss?: boolean;
  isTransformed?: boolean; // For Werewolf transformation
  activeDebuffs?: Record<string, {
    expiresAt: number;
    appliedBy: string;
    lastTick?: number;
    value?: number;
  }>;
} */

// DEPRECATED CombatAction interface - moved to src/types/overlay.ts
/* interface CombatAction {
  type: 'hero' | 'enemy' | 'heal' | 'resurrect';
  actorId: string;
  actorName: string;
  targetId: string;
  targetName: string;
  initiative: number;
  isHero: boolean;
  isAOE?: boolean; // Flag for AOE attacks (hits all targets)
} */

// Main component
export default function CleanBattlefieldSource() {
  const [searchParams] = useSearchParams();
  
  // Dark mode support - check URL parameter
  const darkMode = searchParams.get('darkMode') === 'true' || searchParams.get('dark') === '1';
  
  // Streamer key auth: read from URL and store in sessionStorage for overlayClient
  useEffect(() => {
    const streamerKey = searchParams.get('streamerKey');
    if (streamerKey) {
      sessionStorage.setItem('streamer_key', streamerKey);
      console.log('[CleanBattlefield] Streamer key loaded from URL');
    }
  }, [searchParams]);
  
  // Inject CSS animation for SCT floating text
  useEffect(() => {
    const styleId = 'sct-float-animation';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes float-up {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-80px);
          }
        }
        
        @keyframes fadeInOut {
          0% { opacity: 0; transform: scale(0.8); }
          20% { opacity: 1; transform: scale(1.1); }
          80% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.9); }
        }
        
        @keyframes pulse-red {
          0%, 100% { 
            filter: brightness(1);
            box-shadow: inset 0 0 30px rgba(255,0,0,0.5);
          }
          50% { 
            filter: brightness(1.3);
            box-shadow: inset 0 0 40px rgba(255,0,0,0.8);
          }
        }
      `;
      document.head.appendChild(style);
      console.log('[SCT] ✅ Injected float-up animation CSS');
    }
  }, []);
  
  // Background handling - transparent for OBS, dark for browser viewing
  useEffect(() => {
    const bgColor = darkMode ? '#1a1a1a' : 'transparent';
    
    // Add/remove dark mode class for CSS targeting
    if (darkMode) {
      document.body.classList.add('dark-mode-battlefield');
      document.documentElement.classList.add('dark-mode-battlefield');
    } else {
      document.body.classList.remove('dark-mode-battlefield');
      document.documentElement.classList.remove('dark-mode-battlefield');
    }
    
    // Set body and html background with !important via setProperty
    document.body.style.setProperty('background-color', bgColor, 'important');
    document.body.style.setProperty('background', bgColor, 'important');
    document.documentElement.style.setProperty('background-color', bgColor, 'important');
    document.documentElement.style.setProperty('background', bgColor, 'important');
    
    // Also ensure #root has correct background
    const root = document.getElementById('root');
    if (root) {
      root.style.setProperty('background-color', bgColor, 'important');
      root.style.setProperty('background', bgColor, 'important');
    }
    
    console.log(`[Background] ✅ Set to ${darkMode ? 'dark mode' : 'transparent'} (for ${darkMode ? 'browser' : 'OBS'})`);
    
    // Cleanup on unmount (restore original background)
    return () => {
      document.body.classList.remove('dark-mode-battlefield');
      document.documentElement.classList.remove('dark-mode-battlefield');
      document.body.style.removeProperty('background-color');
      document.body.style.removeProperty('background');
      document.documentElement.style.removeProperty('background-color');
      document.documentElement.style.removeProperty('background');
      if (root) {
        root.classList.remove('dark-mode-battlefield');
        root.style.removeProperty('background-color');
        root.style.removeProperty('background');
      }
    };
  }, [darkMode]);
  
  const { user } = useAuth();
  const [heroes, setHeroes] = useState<Hero[]>([]); // Combat heroes (idle: all on battlefield, raid: participants only)
  const [loadedHeroes, setLoadedHeroes] = useState<Hero[]>([]); // ALL heroes loaded from Firebase (used to populate raid parties)
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [battlefieldId, setBattlefieldId] = useState<string | null>(null);
  const [waveCount, setWaveCount] = useState(1); // Total ticks (includes rest/travel)
  const [combatWaveCount, setCombatWaveCount] = useState(0); // Only combat waves
  const [inCombat, setInCombat] = useState(false);
  const [facingPreferences, setFacingPreferences] = useState<Record<string, 'left' | 'right'>>({});
  const [enemyFlipOverride, setEnemyFlipOverride] = useState<Record<string, 'left' | 'right'>>({});
  const [globalEnemyFlip, setGlobalEnemyFlip] = useState(false);
  const [resurrectionTimers, setResurrectionTimers] = useState<Record<string, number>>({});
  const corruptedPriestSpawnedRef = useRef<boolean>(false); // Track if skeleton mages have been spawned
  const corruptedPriestSpawnInProgress = useRef<boolean>(false); // Prevent concurrent spawns
  const [difficultyModifier, setDifficultyModifier] = useState(1.0);
  const [consecutiveWins, setConsecutiveWins] = useState(0);
  const [testHealer, setTestHealer] = useState<Hero | null>(null);
  const [isTraveling, setIsTraveling] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [activeChatterCount, setActiveChatterCount] = useState(0); // Active chatters in last hour
  
  // Queue status tracking
  const [queueStatus, setQueueStatus] = useState<{
    inQueue: boolean;
    totalInQueue: number;
    roleCounts: { tank: number; healer: number; dps: number };
    userRole?: string;
  } | null>(null);
  
  // Rested XP tracking
  const heroBattlefieldJoinTime = useRef<Map<string, number>>(new Map());
  const lastChatTime = useRef<Map<string, number>>(new Map());
  
  // Adventure tick function ref (to access from checkCombatVictory)
  const adventureTickRef = useRef<(() => void) | null>(null);
  
  // Extract twitchId from battlefieldId for WebSocket connection
  const twitchId = battlefieldId?.split(':')[1] || null;
  
  // WebSocket message handler
  const handleWebSocketMessage = useCallback((message: any) => {
    console.log('[WebSocket] 📨 Received:', message);
    console.log('[WebSocket] 🔍 Message type:', message.type, 'Count:', message.count);
    
    switch (message.type) {
      case 'hero_joined_battlefield':
        console.log(`[WebSocket] ✅ ${message.hero?.name} joined!`);
        // Firebase listener will auto-update, no manual action needed
        break;
      
      case 'hero_left_battlefield':
        const leftHeroId = message.hero?.id || message.heroId;
        const leftHeroName = message.hero?.name || message.hero?.username || 'Unknown';
        console.log(`[WebSocket] 👋 ${leftHeroName} (${leftHeroId}) left! Removing immediately...`);
        console.log(`[WebSocket] 🔍 Full message:`, JSON.stringify(message, null, 2));
        console.log(`[WebSocket] 🔍 Current heroes IDs:`, heroes.map(h => h.id));
        
        // CRITICAL: Remove hero immediately from state (don't wait for Firebase update)
        if (leftHeroId) {
          // Convert to string for comparison (hero IDs might be strings or numbers)
          const leftHeroIdStr = String(leftHeroId);
          
          // Remove from combat heroes state - try multiple ID formats
          setHeroes(current => {
            const beforeCount = current.length;
            const filtered = current.filter(h => {
              // Try multiple ID formats for matching
              const heroIdStr = String(h.id || '');
              const heroNameMatch = h.name === leftHeroName || h.username === leftHeroName;
              const heroIdMatch = heroIdStr === leftHeroIdStr || h.id === leftHeroId;
              
              // Remove if ID matches OR if name matches and we have the ID (to handle edge cases)
              if (heroIdMatch) {
                console.log(`[WebSocket] ✅ Matched hero by ID: ${heroIdStr} === ${leftHeroIdStr}`);
                return false; // Remove this hero
              }
              
              return true; // Keep this hero
            });
            
            if (filtered.length !== beforeCount) {
              console.log(`[WebSocket] ✅ Removed ${leftHeroName} from heroes state (${beforeCount} → ${filtered.length})`);
              heroesRef.current = filtered;
            } else {
              console.warn(`[WebSocket] ⚠️ Hero ${leftHeroIdStr} (${leftHeroName}) not found in heroes state. Current heroes:`, current.map(h => `${h.id} (${h.name})`));
            }
            return filtered;
          });
          
          // Also remove from loadedHeroes if present
          setLoadedHeroes(current => {
            const beforeCount = current.length;
            const filtered = current.filter(h => {
              const heroIdStr = String(h.id || '');
              return heroIdStr !== leftHeroIdStr && h.id !== leftHeroId;
            });
            
            if (filtered.length !== beforeCount) {
              console.log(`[WebSocket] ✅ Removed ${leftHeroName} from loadedHeroes (${beforeCount} → ${filtered.length})`);
            }
            return filtered;
          });
          
          // Clean up join time tracking
          heroBattlefieldJoinTime.current.delete(leftHeroId);
          heroBattlefieldJoinTime.current.delete(leftHeroIdStr);
          lastChatTime.current.delete(leftHeroId);
          lastChatTime.current.delete(leftHeroIdStr);
          
          // Note: Sprite cleanup will happen automatically when the component unmounts
          // since the hero is removed from the heroes array that's used for rendering
        } else {
          console.warn(`[WebSocket] ⚠️ hero_left_battlefield message missing hero.id:`, message);
          console.warn(`[WebSocket] ⚠️ Message structure:`, {
            hasHero: !!message.hero,
            heroId: message.hero?.id,
            heroIdField: message.heroId,
            heroName: message.hero?.name
          });
        }
        break;
      
      case 'channel_point_redeem':
        console.log(`[WebSocket] 🎁 ${message.username} redeemed: ${message.reward}`);
        // TODO: Handle visual effects for redeems
        break;
      
      case 'chatter_count_update':
        console.log(`[WebSocket] 👥 HIT CHATTER CASE! Count: ${message.count}`);
        console.log('[WebSocket] 👥 Before setState - activeChatterCount:', message.count);
        setActiveChatterCount(message.count);
        console.log('[WebSocket] 👥 After setState called');
        break;
      
      case 'chat_activity':
        console.log(`[WebSocket] 💬 Chat activity from ${message.username}`);
        // Track chat time for rested XP bonuses
        if (message.heroId) {
          lastChatTime.current.set(message.heroId, Date.now());
          console.log(`[Rested XP] 📝 Recorded chat activity for hero ${message.heroId}`);
        }
        break;
      
      default:
        console.log('[WebSocket] ⚠️ Unknown message type:', message.type);
    }
  }, []);
  
  // Connect to WebSocket for real-time events
  const { connected: wsConnected } = useWebSocket(twitchId, handleWebSocketMessage);
  
  // Log WebSocket connection status
  useEffect(() => {
    if (wsConnected) {
      console.log(`[WebSocket] ✅ Connected to battlefield ${battlefieldId}`);
    } else {
      console.log(`[WebSocket] ⚠️ Not connected to battlefield ${battlefieldId}`);
    }
  }, [wsConnected, battlefieldId]);
  
  // Track hero join times when they appear on battlefield
  useEffect(() => {
    heroes.forEach(hero => {
      if (!heroBattlefieldJoinTime.current.has(hero.id)) {
        heroBattlefieldJoinTime.current.set(hero.id, Date.now());
        console.log(`[Rested XP] ⏰ Tracking join time for ${hero.name} (${hero.id})`);
      }
    });
    
    // Clean up join times for heroes that left
    const currentHeroIds = new Set(heroes.map(h => h.id));
    for (const heroId of heroBattlefieldJoinTime.current.keys()) {
      if (!currentHeroIds.has(heroId)) {
        heroBattlefieldJoinTime.current.delete(heroId);
        lastChatTime.current.delete(heroId);
        console.log(`[Rested XP] 🧹 Cleaned up tracking for hero ${heroId}`);
      }
    }
  }, [heroes]);
  
  // Grant rested XP every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setHeroes(current => {
        return current.map(hero => {
          const joinTime = heroBattlefieldJoinTime.current.get(hero.id);
          if (!joinTime || hero.isDead) return hero; // Skip dead heroes
          
          const hoursOnBattlefield = (Date.now() - joinTime) / (1000 * 60 * 60);
          const baseRestedXP = Math.floor((hero.maxXp || 100) * Math.min(hoursOnBattlefield * 0.01, 0.5));
          
          // Chat activity bonus (if user chatted in last hour)
          const lastChat = lastChatTime.current.get(hero.id);
          const chatBonus = lastChat && (Date.now() - lastChat < 3600000) ? 1.5 : 1.0;
          
          const restedXP = Math.floor(baseRestedXP * chatBonus);
          
          if (restedXP > 0) {
            console.log(`[Rested XP] 💤 ${hero.name} gains ${restedXP} rested XP (chat bonus: ${chatBonus}x)`);
            
            // Show rested XP SCT
            const heroElement = document.querySelector(`[data-hero-id="${hero.id}"]`);
            if (heroElement) {
              const rect = heroElement.getBoundingClientRect();
              addSCT(`+${restedXP} Rested XP`, rect.left + rect.width / 2, rect.top + 30, 'xp');
            }
            
            // Reset join time to prevent double-counting
            heroBattlefieldJoinTime.current.set(hero.id, Date.now());
            
            return { ...hero, xp: (hero.xp || 0) + restedXP };
          }
          
          return hero;
        });
      });
    }, 5 * 60 * 1000); // Every 5 minutes
    
    return () => clearInterval(interval);
  }, []); // Empty deps - runs once on mount

  // MODE SWITCHING: Detect if hero is in dungeon/raid instance
  const [gameMode, setGameMode] = useState<'idle' | 'dungeon' | 'raid'>('idle');
  const [currentInstanceId, setCurrentInstanceId] = useState<string | null>(null);
  const [instanceData, setInstanceData] = useState<any>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [fadeOpacity, setFadeOpacity] = useState(1);
  const [showWaveAnnouncement, setShowWaveAnnouncement] = useState(false);
  const [rareLootAnnouncement, setRareLootAnnouncement] = useState<{
    itemName: string;
    rarity: string;
    heroName: string;
  } | null>(null);
  
  // Determine twitchId for instance listener: prefer authenticated user, fallback to battlefieldId
  // This allows browser sources to work without authentication by using the battlefieldId parameter
  const twitchIdForListener = user?.twitchId || twitchId;
  
  // Listen for active instances (dungeons/raids)
  // Works for both authenticated users and browser sources (using battlefieldId)
  const { activeInstance, loading: instanceLoading } = useActiveInstanceListener(twitchIdForListener);
  
  // Listen for queue status if user's hero is in queue
  useEffect(() => {
    if (!twitchIdForListener || gameMode !== 'idle') {
      setQueueStatus(null);
      return;
    }
    
    let heroIdRef: string | null = null;
    
    // First, find the user's hero ID
    const findHeroAndListen = async () => {
      try {
        // Find hero document for current user (use twitchId from battlefieldId or authenticated user)
        const heroesQuery = query(
          collection(db, 'heroes'),
          where('twitchUserId', '==', twitchIdForListener),
          limit(1)
        );
        const heroesSnapshot = await getDocs(heroesQuery);
        
        if (heroesSnapshot.empty) {
          setQueueStatus(null);
          return;
        }
        
        heroIdRef = heroesSnapshot.docs[0].id;
        
        // Now listen to queue for this hero and all queue entries
        const queueQuery = collection(db, 'dungeonQueue');
        
        const unsubscribe = onSnapshot(
          queueQuery,
          (snapshot) => {
            // Find if this hero is in queue
            const userQueueEntry = snapshot.docs.find(
              doc => doc.data().heroId === heroIdRef
            );
            
            if (!userQueueEntry) {
              setQueueStatus(null);
              return;
            }
            
            // Calculate role counts from all queue entries (normalize roles)
            const allQueue = snapshot.docs.map(doc => doc.data());
            
            // Normalize role helper
            const normalizeRole = (role: string) => {
              if (!role) return 'dps';
              const roleLower = role.toLowerCase();
              const tankRoles = ['guardian', 'paladin', 'warden', 'bloodknight', 'vanguard', 'brewmaster'];
              const healerRoles = ['cleric', 'atoner', 'druid', 'lightbringer', 'shaman', 'mistweaver', 'chronomancer', 'bard'];
              if (tankRoles.includes(roleLower) || roleLower === 'tank') return 'tank';
              if (healerRoles.includes(roleLower) || roleLower === 'healer') return 'healer';
              return 'dps';
            };
            
            const roleCounts = {
              tank: allQueue.filter(q => normalizeRole(q.role) === 'tank').length,
              healer: allQueue.filter(q => normalizeRole(q.role) === 'healer').length,
              dps: allQueue.filter(q => normalizeRole(q.role) === 'dps').length
            };
            
            const totalInQueue = allQueue.length;
            const queueEntryData = userQueueEntry.data();
            
            setQueueStatus({
              inQueue: true,
              totalInQueue,
              roleCounts,
              userRole: normalizeRole(queueEntryData.role) // Normalize user's role for display
            });
          },
          (error) => {
            console.error('[Queue Status] Queue listener error:', error);
            setQueueStatus(null);
          }
        );
        
        return unsubscribe;
      } catch (error) {
        console.error('[Queue Status] Error setting up listener:', error);
        setQueueStatus(null);
        return () => {}; // Return empty unsubscribe function
      }
    };
    
    let unsubscribeFn: (() => void) | null = null;
    
    findHeroAndListen().then((unsub) => {
      if (unsub) unsubscribeFn = unsub;
    });
    
        return () => {
          if (unsubscribeFn) unsubscribeFn();
        };
      }, [twitchIdForListener, gameMode]);
  
  // Track scheduled raid auto-start timeouts
  const scheduledRaidTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  // Monitor scheduled guild raids and auto-start at scheduled time
  useEffect(() => {
    if (!battlefieldId || gameMode !== 'idle') return;
    
    // Extract twitch ID from battlefieldId (format: "twitch:1087777297")
    const battlefieldTwitchId = battlefieldId.split(':')[1];
    if (!battlefieldTwitchId) return;
    
    console.log('[Scheduled Raids] 🔍 Monitoring for auto-start...');
    
    // Query for scheduled guild raids
    const checkScheduledRaids = async () => {
      try {
        // Fetch scheduled raids where participants include someone from this battlefield
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/raids/scheduled/battlefield/${battlefieldId}`);
        
        if (!response.ok) {
          // Endpoint might not exist yet (404) - that's ok, suppress error
          if (response.status === 404) {
            // Endpoint doesn't exist - this is expected, don't log error
            return;
          }
          // Other errors - log but don't throw
          console.warn(`[Scheduled Raids] API returned ${response.status}, skipping check`);
          return;
        }
        
        const scheduledRaids = await response.json();
        
        scheduledRaids.forEach((raid: any) => {
          // Clear existing timeout if any
          const existingTimeout = scheduledRaidTimeouts.current.get(raid.id);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }
          
          if (raid.scheduledTime && raid.status === 'recruiting') {
            const scheduledDate = new Date(raid.scheduledTime._seconds * 1000);
            const now = new Date();
            const timeUntilStart = scheduledDate.getTime() - now.getTime();
            
            if (timeUntilStart > 0 && timeUntilStart < 86400000) {
              // Future raid within 24 hours - schedule auto-start
              const minPlayers = raid.minPlayers || 5;
              const hasEnoughPlayers = raid.participants.length >= minPlayers;
              
              if (hasEnoughPlayers) {
                console.log(`[Auto-Start] ⏰ "${raid.raidName}" will start in ${Math.floor(timeUntilStart / 60000)} minutes`);
                
                const timeout = setTimeout(async () => {
                  console.log(`[Auto-Start] 🚀 Starting "${raid.raidName}" NOW! Mode: ${raid.simulateMode ? 'SIMULATE' : 'LIVE'}`);
                  try {
                    if (raid.simulateMode) {
                      // Simulate raid (instant, reduced rewards)
                      const heroIds = raid.participants.map((p: any) => p.heroId);
                      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/raids/${raid.raidId}/simulate`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ participants: heroIds })
                      });
                      
                      if (response.ok) {
                        const result = await response.json();
                        console.log(`[Auto-Start] ⚡ Raid simulated! Outcome: ${result.outcome}, ${result.message}`);
                        
                        // Show brief notification (no visual combat)
                        // Could add a toast/notification here
                      }
                    } else {
                      // Start live raid (visual combat)
                      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/raids/scheduled/${raid.id}/start`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                      });
                      
                      if (response.ok) {
                        console.log('[Auto-Start] ✅ Live raid started! Transition will happen automatically via useActiveInstanceListener');
                      }
                    }
                  } catch (err) {
                    console.error('[Auto-Start] ❌ Failed to start raid:', err);
                  }
                }, timeUntilStart);
                
                scheduledRaidTimeouts.current.set(raid.id, timeout);
              }
            } else if (timeUntilStart > -300000 && timeUntilStart <= 0) {
              // Raid should have started in last 5 minutes - start now!
              const minPlayers = raid.minPlayers || 5;
              if (raid.participants.length >= minPlayers) {
                console.log(`[Auto-Start] ⚡ Starting late raid "${raid.raidName}"... Mode: ${raid.simulateMode ? 'SIMULATE' : 'LIVE'}`);
                
                if (raid.simulateMode) {
                  // Simulate
                  const heroIds = raid.participants.map((p: any) => p.heroId);
                  fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/raids/${raid.raidId}/simulate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ participants: heroIds })
                  }).then(() => console.log('[Auto-Start] ⚡ Late raid simulated!'))
                    .catch(err => console.error('[Auto-Start] Failed:', err));
                } else {
                  // Start live
                  fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/raids/scheduled/${raid.id}/start`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                  }).then(() => console.log('[Auto-Start] ✅ Late raid started!'))
                    .catch(err => console.error('[Auto-Start] Failed:', err));
                }
              }
            }
          }
        });
      } catch (err) {
        console.log('[Scheduled Raids] No scheduled raids or endpoint not ready');
      }
    };
    
    // Check on mount and every 60 seconds
    checkScheduledRaids();
    const interval = setInterval(checkScheduledRaids, 60000);
    
    return () => {
      clearInterval(interval);
      scheduledRaidTimeouts.current.forEach(timeout => clearTimeout(timeout));
      scheduledRaidTimeouts.current.clear();
    };
  }, [battlefieldId, gameMode]);
  
  // Resurrection detector: Check for dead heroes who have HP > 0 (healed/resurrected)
  useEffect(() => {
    heroes.forEach(hero => {
      // Detect resurrection: Hero has HP > 0 but is marked dead OR sprite is in death animation
      if (hero.hp > 0) {
        const heroRef = getHeroSpriteRef(hero.id);
        
        // Check if marked as dead (state issue)
        if (hero.isDead) {
          console.log(`[Resurrection] 💚 ${hero.name} has HP but isDead flag is true - fixing state`);
          
          setHeroes(current => {
            const updated = current.map(h => {
              if (h.id === hero.id) {
                return { ...h, isDead: false };
              }
              return h;
            });
            heroesRef.current = updated;
            return updated;
          });
          
          // Trigger idle animation after state update
          setTimeout(() => {
            const updatedHeroRef = getHeroSpriteRef(hero.id);
            if (updatedHeroRef.current) {
              try {
                updatedHeroRef.current.playAnimation('idle');
                console.log(`[Resurrection] 🎬 ${hero.name} returned to idle animation`);
              } catch (err) {
                console.warn(`[Resurrection] ⚠️ Could not play idle animation for ${hero.name}:`, err);
              }
            }
          }, 50);
        } else if (heroRef.current) {
          // Hero is alive but might be stuck in death animation
          try {
            const currentAnimation = (heroRef.current as any).getCurrentAnimation?.() || 
                                     (heroRef.current as any).currentAnimation || 'unknown';
            if (currentAnimation === 'death') {
              console.log(`[Resurrection] 🎬 ${hero.name} has HP but sprite in death animation - forcing idle`);
              heroRef.current.playAnimation('idle');
            }
          } catch (err) {
            // Silently ignore - sprite ref might not have getCurrentAnimation
          }
        }
      }
    });
  }, [heroes]); // Run whenever heroes change
  
  // IMPROVED SAFETY CHECK: Sync hero sprite animation with HP state
  // Fixes cases where hero HP > 0 but sprite is stuck in death animation
  useEffect(() => {
    const interval = setInterval(() => {
      heroes.forEach(hero => {
        const heroRef = getHeroSpriteRef(hero.id);
        
        // Determine actual death state from HP
        const isActuallyDead = hero.hp <= 0 || hero.hp === undefined;
        
        // Fix state if HP and isDead flag don't match
        if (isActuallyDead && !hero.isDead) {
          console.log(`[HP Sync] 💀 ${hero.name} HP is ${hero.hp} but isDead is false - fixing state`);
          setHeroes(current => {
            const updated = current.map(h => 
              h.id === hero.id ? { ...h, isDead: true } : h
            );
            heroesRef.current = updated;
            return updated;
          });
        } else if (!isActuallyDead && hero.isDead) {
          console.log(`[HP Sync] 💚 ${hero.name} HP is ${hero.hp} but isDead is true - fixing state`);
          setHeroes(current => {
            const updated = current.map(h => 
              h.id === hero.id ? { ...h, isDead: false } : h
            );
            heroesRef.current = updated;
            return updated;
          });
        }
        
        // Fix sprite animation if it doesn't match HP state
        if (heroRef.current) {
          try {
            const sprite = heroRef.current as any;
            const currentAnimation = 
              sprite.getCurrentAnimation?.() || 
              sprite.currentAnimation || 
              sprite.animationState?.currentAnimation ||
              'unknown';
            
            // If hero is alive but sprite is in death animation, force idle
            if (!isActuallyDead && currentAnimation === 'death') {
              console.log(`[HP Sync] 🔧 ${hero.name} (HP: ${hero.hp}) stuck in death animation - forcing idle`);
              sprite.playAnimation?.('idle');
            }
            // If hero is dead but sprite is NOT in death animation, force death
            else if (isActuallyDead && currentAnimation !== 'death') {
              console.log(`[HP Sync] 💀 ${hero.name} (HP: ${hero.hp}) should be dead but sprite in ${currentAnimation} - forcing death`);
              sprite.playAnimation?.('death');
            }
          } catch (err) {
            // If we can't check animation, try to fix based on HP anyway
            try {
              if (!isActuallyDead) {
                heroRef.current.playAnimation?.('idle');
              } else {
                heroRef.current.playAnimation?.('death');
              }
            } catch (e) {
              // Silently ignore if sprite ref is invalid
            }
          }
        }
      });
    }, 2000); // Check every 2 seconds
    
    return () => clearInterval(interval);
  }, [heroes]); // Re-run when heroes change
  
  // Mode detection: Switch between idle/dungeon/raid based on activeInstance (WITH FADE TRANSITION)
  useEffect(() => {
    if (!activeInstance) return;
    
    const switchToMode = async (newMode: 'idle' | 'dungeon' | 'raid', instanceId?: string) => {
      if (newMode === gameMode) return; // Already in this mode
      
      console.log(`[Mode] 🎬 Starting transition from ${gameMode} to ${newMode}...`);
      setIsTransitioning(true);
      
      // Fade out (500ms)
      setFadeOpacity(0);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Switch mode while faded out
      console.log(`[Mode] 🎮 Switching to ${newMode.toUpperCase()} mode${instanceId ? `: ${instanceId}` : ''}`);
      setGameMode(newMode);
      
      if (newMode === 'idle') {
        // IMPORTANT: Clear raid/dungeon data when returning to idle
        console.log('[Mode] 🧹 Clearing raid/dungeon enemies and data');
        setCurrentInstanceId(null);
        setInstanceData(null);
        setEnemies([]); // Clear raid boss/enemies
        enemiesRef.current = []; // Clear ref too
        corruptedPriestSpawnedRef.current = false; // Reset spawn flag
        corruptedPriestSpawnInProgress.current = false; // Reset spawn in-progress flag
        setInCombat(false); // Stop combat
        
        // CRITICAL: Don't clear heroes! They will be preserved by the hero listener
        // The hero listener in idle mode will merge Firebase heroes with current heroes,
        // preserving heroes from dungeon/raid that might not have currentBattlefieldId set yet
        console.log('[Mode] 🔄 Heroes will be merged with Firebase heroes (preserving dungeon participants)');
        // Adventure loop will auto-start and generate new enemies
      } else if (instanceId) {
        setCurrentInstanceId(instanceId);
        // Load instance data
        loadInstanceData(newMode as 'dungeon' | 'raid', instanceId);
      }
      
      // Fade in (500ms)
      await new Promise(resolve => setTimeout(resolve, 100));
      setFadeOpacity(1);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setIsTransitioning(false);
      console.log(`[Mode] ✅ Transition complete!`);
    };
    
    if (activeInstance.type && activeInstance.instanceId) {
      // Entering instance
      switchToMode(activeInstance.type, activeInstance.instanceId);
      
      // Pause adventure loop when entering instance
      if (adventureIntervalRef.current) {
        console.log('[Adventure] ⏸️ Pausing adventure loop - entering instance');
        clearInterval(adventureIntervalRef.current);
        adventureIntervalRef.current = null;
      }
    } else if (gameMode !== 'idle') {
      // Return to idle mode
      switchToMode('idle');
      
      // Adventure loop will auto-restart via its own useEffect when heroes exist
    }
  }, [activeInstance?.type, activeInstance?.instanceId]);
  
  // Load instance data from Firebase
  const loadInstanceData = async (type: 'dungeon' | 'raid', instanceId: string) => {
    try {
      const collection = type === 'dungeon' ? 'dungeonInstances' : 'raidInstances';
      console.log(`[Mode] Loading ${type} instance from ${collection}/${instanceId}`);
      
      const instanceRef = doc(db, collection, instanceId);
      
      // Listen for real-time updates
      onSnapshot(instanceRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = { id: snapshot.id, ...snapshot.data() };
          const oldWave = instanceData?.currentWave;
          const newWave = data.currentWave;
          console.log(`[Mode] 📡 Instance snapshot update detected:`, {
            oldWave,
            newWave,
            changed: oldWave !== newWave,
            status: data.status
          });
          console.log(`[Mode] Instance data loaded:`, data);
          setInstanceData(data);
          
          // Check if completed
          if (data.status === 'completed' || data.status === 'failed') {
            console.log(`[Mode] ✅ Instance ${data.status}! Will return to idle when heroes update...`);
          }
        } else {
          console.warn(`[Mode] Instance ${instanceId} not found`);
        }
      }, (error) => {
        console.error(`[Mode] ❌ onSnapshot error for ${type} instance:`, error);
      });
    } catch (error) {
      console.error(`[Mode] Failed to load ${type} instance:`, error);
    }
  };

  // ============================================================================
  // RAID COMBAT SYSTEM - Uses SAME combat engine as idle adventure!
  // ============================================================================
  
  // In raid mode, populate heroes and enemies from instance data
  // Then the existing combat system handles everything!
  
  useEffect(() => {
    if (gameMode !== 'raid' || !instanceData) return;
    
    console.log('[Raid Mode] ⚠️ RAID SETUP RUNNING - This should only run on wave change!');
    console.log('[Raid Mode] Trigger:', {
      gameMode,
      currentWave: instanceData?.currentWave,
      instanceId: instanceData?.id,
      bossHp: instanceData?.boss?.hp
    });
    
    // Fetch raid participants' hero data from Firebase
    const fetchRaidHeroes = async () => {
      const raidHeroes: Hero[] = [];
      
      for (const p of (instanceData.participants || [])) {
        console.log(`[Raid Setup] Fetching hero:`, {
          heroId: p.heroId,
          userId: p.userId,
          username: p.username
        });
        
        // First, try loadedHeroes (already in memory)
        let actualHero = loadedHeroes.find(h => 
          h.id === p.heroId || 
          (h as any).twitchUserId === p.userId ||
          h.name === p.username
        );
        
        // If not found, fetch directly from Firebase by hero ID
        if (!actualHero && p.heroId) {
          console.log(`[Raid Setup] Hero not in loadedHeroes, fetching from Firebase: ${p.heroId}`);
          try {
            const heroDoc = await import('firebase/firestore').then(({ doc, getDoc }) => 
              getDoc(doc(db, 'heroes', p.heroId))
            );
            
            if (heroDoc.exists()) {
              const data = heroDoc.data();
              actualHero = calculateHeroStats({
                id: heroDoc.id,
                name: data.name || data.username,
                role: data.role || 'berserker',
                level: data.level || 1,
                hp: data.hp || 100,
                maxHp: data.maxHp || 100,
                xp: data.xp || 0,
                maxXp: data.maxXp || 100,
                attack: data.attack || 0,
                defense: data.defense || 0,
                currentBattlefieldId: data.currentBattlefieldId,
                autoBuy: data.autoBuy || false,
                gold: data.gold || 0,
                profession: data.profession || null,
                quests: data.quests || {},
                twitchUserId: data.twitchUserId || data.twitchId,
                activeTitle: data.activeTitle || null,
                founderBadge: data.founderBadge || data.activeBadge || null,
                nameColor: data.nameColor || null,
                nameFrame: data.nameFrame || null,
                auraEffect: data.auraEffect || null,
                auraColor: data.auraColor || null,
                spellEffect: data.spellEffect || null,
                equipment: data.equipment || {},
                skills: data.skills || {},
                enchantedItems: data.enchantedItems || []
              } as Hero);
              console.log(`[Raid Setup] ✅ Fetched hero from Firebase: ${actualHero.name}`);
            }
          } catch (err) {
            console.error(`[Raid Setup] ❌ Failed to fetch hero ${p.heroId}:`, err);
          }
        }
        
        if (actualHero) {
          console.log(`[Raid Setup] ✅ Found actual hero for ${p.username}: ${actualHero.name} (${actualHero.role})`);
          console.log(`[Raid Setup] Hero stats:`, {
            attack: actualHero.attack,
            defense: actualHero.defense,
            maxHp: actualHero.maxHp,
            hpRegen: actualHero.hpRegen || 0,
            equipment: Object.keys(actualHero.equipment || {}).length + ' items'
          });
          raidHeroes.push(actualHero);
          continue;
        }
        
        // Fallback if hero not found anywhere
        console.log(`[Raid Setup] ⚠️ Using fallback data for ${p.username}, class: ${p.class || p.role}`);
        const fallbackHero = {
          id: p.heroId || p.userId || `fallback-${raidHeroes.length}`,
          name: p.username || p.heroName || 'Hero',
          role: p.class || p.role || 'berserker',
          level: p.level || 1,
          hp: p.hp || p.maxHp || 100,
          maxHp: p.maxHp || 100,
          attack: p.attack || (p.level || 1) * 5,
          defense: p.defense || (p.level || 1) * 2,
          isDead: false,
          shield: 0,
          xp: 0,
          maxXp: 100,
          gold: 0,
          equipment: {},
          inventory: [],
          skills: {},
          activeBuffs: {},
          activeDebuffs: {},
          potions: { health: 0, mana: 0 }
        } as Hero;
        raidHeroes.push(fallbackHero);
      }
      
      console.log(`[Raid Setup] ✅ Total raid heroes created: ${raidHeroes.length}`);
    
    // Calculate raid difficulty scaling based on party size
    const raidPartySize = raidHeroes.length;
    // Raid party size multiplier: More heroes = harder enemies
    // For raids (5-20 players): 8% per hero beyond first 5, then 10% per hero beyond 10
    // 5 heroes = 1.0x, 10 = 1.4x, 15 = 1.9x, 20 = 2.4x
    let raidPartySizeMultiplier = 1.0;
    if (raidPartySize > 5) {
      if (raidPartySize <= 10) {
        // 6-10 heroes: 8% per hero beyond 5
        raidPartySizeMultiplier = 1.0 + ((raidPartySize - 5) * 0.08);
      } else {
        // 11-20 heroes: 1.4x base (for 10), then 10% per hero beyond 10
        raidPartySizeMultiplier = 1.4 + ((raidPartySize - 10) * 0.10);
      }
    }
    
    console.log(`[Raid] Party size: ${raidPartySize}, difficulty multiplier: ${(raidPartySizeMultiplier * 100).toFixed(0)}%`);
    
    // Convert boss to Enemy format
    // WAVE SYSTEM: Determine enemies based on current wave
    const currentWave = instanceData.currentWave || 0;
    const totalWaves = instanceData.waves || 5;
    const raidEnemies: Enemy[] = [];
    
    console.log(`[Raid Waves] ====================================`);
    console.log(`[Raid Waves] Current wave: ${currentWave} (Display: ${currentWave + 1}/${totalWaves})`);
    console.log(`[Raid Waves] Wave enemies array:`, instanceData.waveEnemies);
    console.log(`[Raid Waves] Boss data:`, instanceData.boss ? `${instanceData.boss.name} (${instanceData.boss.hp} HP)` : 'None');
    console.log(`[Raid Waves] ====================================`);
    
    // WAVES 0-3: Trash mobs (waves 1-4 in display)
    if (currentWave < totalWaves - 1) {
      let waveEnemyString = instanceData.waveEnemies?.[currentWave] || '';
      
      // Fallback: Generate wave enemies if missing (for raids created before wave generation was added)
      if (!waveEnemyString) {
        console.log(`[Raid Waves] ⚠️ Wave enemies missing for wave ${currentWave}, generating fallback enemies`);
        const { generateRaidWaveEnemies } = await import('../utils/raidSystem');
        const generatedEnemies = generateRaidWaveEnemies(currentWave, totalWaves, instanceData.difficulty || 'normal', instanceData.raidId);
        const enemyNames = generatedEnemies.flatMap(e => Array(e.count).fill(e.name));
        waveEnemyString = enemyNames.join(',');
        console.log(`[Raid Waves] ✅ Generated fallback enemies:`, waveEnemyString);
      }
      
      const waveEnemyNames = waveEnemyString ? waveEnemyString.split(',') : [];
      
      console.log(`[Raid Waves] Wave ${currentWave} index (display ${currentWave + 1}/${totalWaves})`);
      console.log(`[Raid Waves] Wave data string:`, waveEnemyString);
      console.log(`[Raid Waves] Parsed enemy names:`, waveEnemyNames);
      
      // Spawn wave enemies
      waveEnemyNames.forEach((enemyName: string, index: number) => {
        const trimmedName = enemyName.trim(); // Remove whitespace!
        
        const WAVE_STATS: Record<string, any> = {
          'Baby Dragon': { hp: 5000, attack: 100, defense: 50, xp: 500, level: 38, type: 'Baby Dragon' },
          'Dragon Whelp': { hp: 8000, attack: 150, defense: 80, xp: 800, level: 40, type: 'Dragon_1' },
          'Dragon Guardian': { hp: 10000, attack: 180, defense: 100, xp: 1000, level: 42, type: 'Dragon_2' },
          'Dragon Sentinel': { hp: 12000, attack: 200, defense: 120, xp: 1200, level: 44, type: 'Dragon_3' },
          // Standard enemies for raid waves
          'Goblin': { hp: 3000, attack: 60, defense: 30, xp: 300, level: 15, type: 'Goblin' },
          'Orc': { hp: 4000, attack: 80, defense: 40, xp: 400, level: 18, type: 'Masked Orc' },
          'Skeleton': { hp: 3500, attack: 70, defense: 35, xp: 350, level: 16, type: 'Skeleton Mage' },
          'Imp': { hp: 2500, attack: 50, defense: 25, xp: 250, level: 14, type: 'Imp' },
          'Witch': { hp: 4500, attack: 90, defense: 45, xp: 450, level: 20, type: 'Witch' },
          'Skeleton Mage': { hp: 5000, attack: 100, defense: 50, xp: 500, level: 22, type: 'Skeleton Mage' },
          'Demon Lord': { hp: 15000, attack: 200, defense: 100, xp: 1500, level: 35, type: 'Demon Lord' },
          'Adult Dragon': { hp: 20000, attack: 250, defense: 120, xp: 2000, level: 40, type: 'Adult Dragon' },
          'Cultist': { hp: 3500, attack: 70, defense: 35, xp: 350, level: 18, type: 'Cultist' },
          'Mimic': { hp: 4000, attack: 85, defense: 40, xp: 400, level: 19, type: 'Mimic' }
        };
        
        const baseStats = WAVE_STATS[trimmedName] || { hp: 5000, attack: 100, defense: 50, xp: 500, level: 40, type: 'Baby Dragon' };
        
        // Apply party size scaling to enemy stats
        const stats = {
          ...baseStats,
          hp: Math.floor(baseStats.hp * raidPartySizeMultiplier),
          attack: Math.floor(baseStats.attack * raidPartySizeMultiplier),
          defense: Math.floor(baseStats.defense * raidPartySizeMultiplier),
          xp: Math.floor(baseStats.xp * raidPartySizeMultiplier)
        };
        
        console.log(`[Raid Waves] Creating enemy "${trimmedName}" with stats:`, stats);
        
        raidEnemies.push({
          id: `wave-enemy-${currentWave}-${index}`,
          name: trimmedName,
          enemyType: baseStats.type || trimmedName, // Add enemyType for sprite lookup
          level: stats.level,
          hp: stats.hp,
          maxHp: stats.hp,
          attack: stats.attack,
          defense: stats.defense,
          xp: stats.xp,
          isBoss: false,
          isDead: false,
          shield: 0
        });
      });
    }
    // WAVE 5 (Final): BOSS
    else if (instanceData.boss && instanceData.boss.hp > 0) {
      console.log(`[Raid Waves] Wave ${currentWave + 1} (FINAL): BOSS - ${instanceData.boss.name}`);
      
      // Apply party size scaling to boss stats
      const bossHp = Math.floor(instanceData.boss.hp * raidPartySizeMultiplier);
      const bossMaxHp = Math.floor((instanceData.boss.maxHp || instanceData.boss.hp) * raidPartySizeMultiplier);
      const bossAttack = Math.floor((instanceData.boss.attack || 100) * raidPartySizeMultiplier);
      const bossDefense = Math.floor((instanceData.boss.defense || 50) * raidPartySizeMultiplier);
      const bossXp = Math.floor((instanceData.boss.xp || 1000) * raidPartySizeMultiplier);
      
      console.log(`[Raid Boss] Scaling boss stats: HP ${instanceData.boss.hp}→${bossHp}, ATK ${instanceData.boss.attack || 100}→${bossAttack} (${(raidPartySizeMultiplier * 100).toFixed(0)}% difficulty)`);
      
      const bossEnemyType = instanceData.boss.name || 'Boss';
      console.log(`[Raid Boss] Creating boss with enemyType: "${bossEnemyType}"`);
      raidEnemies.push({
        id: 'raid-boss',
        name: instanceData.boss.name || 'Boss',
        enemyType: bossEnemyType, // Add enemyType for sprite lookup (e.g., 'Corrupted High Priest')
        level: instanceData.boss.level || 50,
        hp: bossHp,
        maxHp: bossMaxHp,
        attack: bossAttack,
        defense: bossDefense,
        xp: bossXp,
        isBoss: true,
        isDead: false,
        shield: 0
      });
    }
    // BOSS DEFEATED - Grant loot
    else if (instanceData.boss && instanceData.boss.hp <= 0) {
      console.log('[Raid] 🎉 BOSS DEFEATED! Distributing loot...');
      
      // Grant XP and gold to all heroes
      raidHeroes.forEach(hero => {
        const xpReward = Math.floor((instanceData.boss.xp || 1000) / Math.max(raidHeroes.length, 1));
        const goldReward = Math.floor(((instanceData.boss.level || 50) * 10) / Math.max(raidHeroes.length, 1));
        
        // Show loot SCT
        setTimeout(() => {
          const heroElement = document.querySelector(`[data-hero-id="${hero.id}"]`);
          if (heroElement) {
            const rect = heroElement.getBoundingClientRect();
            addSCT(`+${xpReward} XP`, rect.left + rect.width / 2, rect.top - 30, 'xp');
            setTimeout(() => {
              addSCT(`+${goldReward}g`, rect.left + rect.width / 2, rect.top - 10, 'loot');
            }, 300);
          }
        }, 1000);
        
        console.log(`[Raid Loot] ${hero.name} receives ${xpReward} XP, ${goldReward}g`);
      });
      
      // TODO: Generate raid-specific loot (epic/legendary items)
      // TODO: Sync rewards to backend
      // TODO: Mark raid as complete in Firebase
    }
    
    console.log(`[Raid Waves] ✅ Total enemies generated: ${raidEnemies.length}`, raidEnemies.map(e => ({ name: e.name, enemyType: e.enemyType, isBoss: e.isBoss })));
    
    if (raidEnemies.length === 0) {
      console.error('[Raid Waves] ❌ NO ENEMIES GENERATED! This is a bug!');
      console.error('[Raid Waves] Current wave:', currentWave);
      console.error('[Raid Waves] Total waves:', totalWaves);
      console.error('[Raid Waves] Wave data:', instanceData.waveEnemies?.[currentWave]);
    }
    
    // Update heroes and enemies state (this triggers combat!)
    console.log(`[Raid Mode] 🎮 Setting ${raidHeroes.length} heroes, ${raidEnemies.length} enemies`);
    console.log('[Raid Mode] Heroes:', raidHeroes.map(h => `${h.name} (${h.role})`));
    console.log('[Raid Mode] Enemies:', raidEnemies.map(e => `${e.name} (HP: ${e.hp})`));
    
    // Update refs first
    heroesRef.current = raidHeroes;
    enemiesRef.current = raidEnemies;
    
    // Then set state (this will trigger combat useEffect)
    console.log('[Raid Mode] 📝 Setting heroes state:', raidHeroes.length);
    console.log('[Raid Mode] 📝 Setting enemies state:', raidEnemies.length);
    setHeroes(raidHeroes);
    setEnemies(raidEnemies);
    
      // Delay combat start to let sprites render
      if (raidEnemies.length > 0) {
        console.log('[Raid Mode] ⏳ Waiting 1s for sprites to render...');
        setTimeout(() => {
          console.log('[Raid Mode] ⚔️ Starting combat NOW!');
          corruptedPriestSpawnedRef.current = false; // Reset spawn flag
        corruptedPriestSpawnInProgress.current = false; // Reset spawn in-progress flag for new combat
        setInCombat(true);
        }, 1000);
      } else {
        console.error('[Raid Mode] ❌ No enemies to fight! Wave might be skipped.');
      }
    };
    
    fetchRaidHeroes().catch(err => {
      console.error('[Raid Setup] ❌ Failed to fetch raid heroes:', err);
    });
  }, [gameMode, instanceData?.currentWave, instanceData?.id]); // Don't need loadedHeroes.length anymore!

  // ============================================================================
  // DUNGEON COMBAT SYSTEM - Uses SAME combat engine as idle adventure!
  // ============================================================================
  
  // In dungeon mode, populate heroes and enemies from instance data (similar to raids)
  useEffect(() => {
    if (gameMode !== 'dungeon' || !instanceData) return;
    
    // CRITICAL: Don't run setup if dungeon is already completed or failed
    if (instanceData.status === 'completed' || instanceData.status === 'failed') {
      console.log('[Dungeon Mode] ⚠️ Skipping dungeon setup - instance is already', instanceData.status);
      return;
    }
    
    // Safety: Don't try to load a room that doesn't exist
    const maxRooms = instanceData.maxRooms || instanceData.rooms?.length || 3;
    const currentRoom = instanceData.currentRoom || 0;
    if (currentRoom >= maxRooms) {
      console.log('[Dungeon Mode] ⚠️ Skipping dungeon setup - currentRoom exceeds maxRooms', {
        currentRoom,
        maxRooms,
        status: instanceData.status
      });
      return;
    }
    
    // CRITICAL: Clear enemies first to prevent stale enemy state from previous room
    console.log('[Dungeon Mode] 🧹 Clearing enemies before setting up new room...');
    setEnemies([]);
    enemiesRef.current = [];
    corruptedPriestSpawnedRef.current = false; // Reset spawn flag
    setInCombat(false);
    combatInProgress.current = false;
    
    console.log('[Dungeon Mode] ⚠️ DUNGEON SETUP RUNNING - This should only run on room change!');
    console.log('[Dungeon Mode] Trigger:', {
      gameMode,
      currentRoom: instanceData?.currentRoom,
      instanceId: instanceData?.id,
      dungeonId: instanceData?.dungeonId,
      status: instanceData?.status
    });
    
    // Fetch dungeon participants' hero data from Firebase (same as raid)
    const fetchDungeonHeroes = async () => {
      const dungeonHeroes: Hero[] = [];
      
      for (const p of (instanceData.participants || [])) {
        console.log(`[Dungeon Setup] Fetching hero:`, {
          heroId: p.heroId,
          userId: p.userId,
          username: p.username
        });
        
        // First, try loadedHeroes (already in memory)
        let actualHero = loadedHeroes.find(h => 
          h.id === p.heroId || 
          (h as any).twitchUserId === p.userId ||
          h.name === p.username
        );
        
        // If not found, fetch directly from Firebase by hero ID
        if (!actualHero && p.heroId) {
          console.log(`[Dungeon Setup] Hero not in loadedHeroes, fetching from Firebase: ${p.heroId}`);
          try {
            const heroDoc = await import('firebase/firestore').then(({ doc, getDoc }) => 
              getDoc(doc(db, 'heroes', p.heroId))
            );
            
            if (heroDoc.exists()) {
              const data = heroDoc.data();
              actualHero = calculateHeroStats({
                id: heroDoc.id,
                name: data.name || data.username,
                role: data.role || 'berserker',
                level: data.level || 1,
                hp: data.hp || 100,
                maxHp: data.maxHp || 100,
                xp: data.xp || 0,
                maxXp: data.maxXp || 100,
                attack: data.attack || 0,
                defense: data.defense || 0,
                currentBattlefieldId: data.currentBattlefieldId,
                autoBuy: data.autoBuy || false,
                gold: data.gold || 0,
                profession: data.profession || null,
                quests: data.quests || {},
                twitchUserId: data.twitchUserId || data.twitchId,
                activeTitle: data.activeTitle || null,
                founderBadge: data.founderBadge || data.activeBadge || null,
                nameColor: data.nameColor || null,
                nameFrame: data.nameFrame || null,
                auraEffect: data.auraEffect || null,
                auraColor: data.auraColor || null,
                spellEffect: data.spellEffect || null,
                equipment: data.equipment || {},
                skills: data.skills || {},
                enchantedItems: data.enchantedItems || [],
                inventory: data.inventory || []
              } as Hero);
              console.log(`[Dungeon Setup] ✅ Fetched hero from Firebase: ${actualHero.name}`);
            }
          } catch (err) {
            console.error(`[Dungeon Setup] ❌ Failed to fetch hero ${p.heroId}:`, err);
          }
        }
        
        if (actualHero) {
          console.log(`[Dungeon Setup] ✅ Found actual hero for ${p.username}: ${actualHero.name} (${actualHero.role})`);
          dungeonHeroes.push(actualHero);
          continue;
        }
        
        // Fallback if hero not found
        console.log(`[Dungeon Setup] ⚠️ Using fallback data for ${p.username}`);
        const fallbackHero = {
          id: p.heroId || p.userId || `fallback-${dungeonHeroes.length}`,
          name: p.username || p.heroName || 'Hero',
          role: p.class || p.role || 'berserker',
          level: p.level || 1,
          hp: p.hp || p.maxHp || 100,
          maxHp: p.maxHp || 100,
          attack: p.attack || (p.level || 1) * 5,
          defense: p.defense || (p.level || 1) * 2,
          isDead: false,
          shield: 0,
          xp: 0,
          maxXp: 100,
          gold: 0,
          equipment: {},
          inventory: [],
          skills: {},
          activeBuffs: {},
          activeDebuffs: {},
          potions: { health: 0, mana: 0 }
        } as Hero;
        dungeonHeroes.push(fallbackHero);
      }
      
      console.log(`[Dungeon Setup] ✅ Total dungeon heroes created: ${dungeonHeroes.length}`);
    
      // Calculate dungeon-specific difficulty modifier based on hero stats and party size
      // Unlike idle mode which uses state, dungeons should scale to hero power AND party size
      const avgGearScore = calculateAverageGearScore(dungeonHeroes);
      const avgHeroLevel = dungeonHeroes.length > 0
        ? Math.floor(dungeonHeroes.reduce((sum, h) => sum + (h.level || 1), 0) / dungeonHeroes.length)
        : 10;
      const partySize = dungeonHeroes.length;
      
      // Scale difficulty based on gear score, level, and party size
      // Base difficulty: 1.0, increases with gear/level/party size
      let dungeonDifficultyModifier = 1.0;
      
      // Party size multiplier: More heroes = harder enemies (similar to idle mode)
      // For dungeons (2-5 players): 8% per hero beyond first
      // 2 heroes = 1.08x, 3 = 1.16x, 4 = 1.24x, 5 = 1.32x
      const partySizeMultiplier = partySize > 1 
        ? 1 + ((partySize - 1) * 0.08)
        : 1.0;
      
      // Gear score scaling: +10% per 100 gear score above 0, capped at 2.0x bonus
      if (avgGearScore > 0) {
        const gearBonus = Math.min(2.0, (avgGearScore / 100) * 0.1);
        dungeonDifficultyModifier = 1.0 + gearBonus;
      }
      
      // Level scaling: +2% per level above 10, max +40% (levels 10-30)
      const levelBonus = Math.min(0.4, Math.max(0, (avgHeroLevel - 10) * 0.02));
      dungeonDifficultyModifier += levelBonus;
      
      // Apply party size multiplier
      dungeonDifficultyModifier *= partySizeMultiplier;
      
      console.log(`[Dungeon] Hero stats: avgLevel=${avgHeroLevel}, avgGearScore=${avgGearScore}, partySize=${partySize}`);
      console.log(`[Dungeon] Difficulty breakdown: base=1.0, gear=${((dungeonDifficultyModifier / partySizeMultiplier - 1.0 - levelBonus) * 100).toFixed(0)}%, level=${(levelBonus * 100).toFixed(0)}%, partySize=${((partySizeMultiplier - 1.0) * 100).toFixed(0)}%`);
      console.log(`[Dungeon] Calculated difficulty modifier: ${(dungeonDifficultyModifier * 100).toFixed(0)}% (idle mode modifier: ${(difficultyModifier * 100).toFixed(0)}%)`);
      
      // Generate enemies for current room from dungeon definition
      const currentRoom = instanceData.currentRoom || 0;
      const dungeonId = instanceData.dungeonId || 'goblin_cave';
      const roomEnemies: Enemy[] = [];
      
      console.log(`[Dungeon] ====================================`);
      console.log(`[Dungeon] Current room: ${currentRoom} (0-indexed)`);
      console.log(`[Dungeon] Dungeon ID: ${dungeonId}`);
      console.log(`[Dungeon] Instance rooms array length: ${instanceData.rooms?.length}`);
      console.log(`[Dungeon] Instance maxRooms: ${instanceData.maxRooms}`);
      console.log(`[Dungeon] Instance room data at index ${currentRoom}:`, instanceData.rooms?.[currentRoom]);
      console.log(`[Dungeon] All rooms:`, instanceData.rooms?.map((r: any, i: number) => `${i}: ${r?.name || r?.id || 'unknown'}`));
      console.log(`[Dungeon] ====================================`);
      
      // Get room definition from instance data
      const roomData = instanceData.rooms?.[currentRoom];
      
      // Safety check: if room data is missing but we're not at the last room, log a warning
      if (!roomData && currentRoom < (instanceData.maxRooms || instanceData.rooms?.length || 3) - 1) {
        console.warn(`[Dungeon] ⚠️ Room data missing for room ${currentRoom + 1}! This might cause issues.`);
      }
      
      if (roomData && roomData.enemies) {
        // Use room data from instance
        console.log(`[Dungeon] Using room data from instance`);
        const generated = generateDungeonEnemies(
          roomData.enemies,
          dungeonHeroes,
          dungeonDifficultyModifier // Use calculated dungeon difficulty, not idle mode state
        );
        roomEnemies.push(...generated);
      } else {
        // Fallback: Use default room enemies if not in instance data
        console.log(`[Dungeon] Room data not in instance, using default enemies...`);
        const defaultRoom = {
          enemies: [
            { type: 'Goblin', count: 3, level: dungeonHeroes[0]?.level || 10 }
          ]
        };
        const generated = generateDungeonEnemies(
          defaultRoom.enemies,
          dungeonHeroes,
          dungeonDifficultyModifier // Use calculated dungeon difficulty, not idle mode state
        );
        roomEnemies.push(...generated);
      }
      
      console.log(`[Dungeon] ✅ Total enemies generated: ${roomEnemies.length}`, roomEnemies.map(e => e.name));
      
      if (roomEnemies.length === 0) {
        console.error('[Dungeon] ❌ NO ENEMIES GENERATED!');
        return;
      }
      
      // CRITICAL: Ensure all enemies have full HP (defensive check)
      roomEnemies.forEach((enemy, index) => {
        // Check if maxHp is valid
        if (!enemy.maxHp || enemy.maxHp <= 0) {
          console.error(`[Dungeon] ❌ Enemy ${enemy.name} has invalid maxHp: ${enemy.maxHp}! This is a bug in enemy generation.`);
          // Try to calculate maxHp from HP if available
          if (enemy.hp && enemy.hp > 0) {
            enemy.maxHp = enemy.hp;
            console.warn(`[Dungeon] ⚠️ Using HP value ${enemy.hp} as maxHp for ${enemy.name}`);
          } else {
            console.error(`[Dungeon] ❌ Cannot fix enemy ${enemy.name} - both hp and maxHp are invalid!`);
            return; // Skip this enemy
          }
        }
        
        // Ensure HP equals maxHp
        if (enemy.hp !== enemy.maxHp) {
          console.warn(`[Dungeon] ⚠️ Enemy ${enemy.name} has HP ${enemy.hp} but maxHp ${enemy.maxHp} - resetting to full HP!`);
          enemy.hp = enemy.maxHp;
        }
        if (enemy.isDead) {
          console.warn(`[Dungeon] ⚠️ Enemy ${enemy.name} is marked as dead - resetting!`);
          enemy.isDead = false;
        }
        
        console.log(`[Dungeon] ✅ Enemy ${enemy.name}: HP=${enemy.hp}, maxHp=${enemy.maxHp}, isDead=${enemy.isDead}`);
      });
      
      // Update heroes and enemies state (this triggers combat!)
      console.log(`[Dungeon Mode] 🎮 Setting ${dungeonHeroes.length} heroes, ${roomEnemies.length} enemies`);
      console.log('[Dungeon Mode] Heroes:', dungeonHeroes.map(h => `${h.name} (${h.role})`));
      console.log('[Dungeon Mode] Enemies BEFORE fix:', roomEnemies.map(e => ({
        name: e.name,
        hp: e.hp,
        maxHp: e.maxHp,
        isDead: e.isDead,
        level: e.level
      })));
      
      // CRITICAL: Clear combat state FIRST to prevent stale victory checks
      setInCombat(false);
      combatInProgress.current = false;
      
      // Update refs first (create fresh array to avoid reference issues)
      // Make sure enemies have fresh references and full HP
      const freshEnemies = roomEnemies.map(e => {
        // Double-check maxHp is valid before using it
        console.log(`[Dungeon] Creating fresh enemy for ${e.name}: original hp=${e.hp}, maxHp=${e.maxHp}`);
        
        let validMaxHp = e.maxHp;
        if (!validMaxHp || validMaxHp <= 0) {
          // Try to use hp if it's valid
          if (e.hp && e.hp > 0) {
            validMaxHp = e.hp;
            console.warn(`[Dungeon] ⚠️ Enemy ${e.name} maxHp was invalid (${e.maxHp}), using hp value: ${validMaxHp}`);
          } else {
            // Fallback to a calculated value based on level
            validMaxHp = Math.floor(100 * (1 + (e.level || 15) * 0.15)) * 1.5; // Boss multiplier
            console.error(`[Dungeon] ❌ Enemy ${e.name} has invalid hp (${e.hp}) and maxHp (${e.maxHp}), using calculated fallback: ${validMaxHp}`);
          }
        }
        
        const freshEnemy = {
          ...e, 
          maxHp: validMaxHp,
          hp: validMaxHp, // Ensure full HP
          isDead: false // Ensure not marked as dead
        };
        
        console.log(`[Dungeon] ✅ Fresh enemy created: ${freshEnemy.name} - HP=${freshEnemy.hp}, maxHp=${freshEnemy.maxHp}, isDead=${freshEnemy.isDead}`);
        return freshEnemy;
      });
      
      console.log('[Dungeon Mode] Enemies AFTER fix:', freshEnemies.map(e => ({
        name: e.name,
        hp: e.hp,
        maxHp: e.maxHp,
        isDead: e.isDead,
        level: e.level
      })));
      
      heroesRef.current = [...dungeonHeroes];
      enemiesRef.current = freshEnemies;
      
      // Debug: Log fresh enemies state before setting
      console.log('[Dungeon Mode] 🐛 Fresh enemies state BEFORE setState:', freshEnemies.map(e => ({
        name: e.name,
        hp: e.hp,
        maxHp: e.maxHp,
        isDead: e.isDead,
        level: e.level,
        enemyType: e.enemyType,
        isBoss: e.isBoss
      })));
      
      // Then set state (this will trigger combat useEffect)
      setHeroes(dungeonHeroes);
      setEnemies(freshEnemies);
      
      // Delay combat start to let sprites render and ensure state is fully updated
      if (roomEnemies.length > 0) {
        console.log('[Dungeon Mode] ⏳ Waiting 1s for sprites to render...');
        setTimeout(() => {
          // Double-check enemies are still valid before starting combat
          const validEnemies = enemiesRef.current.filter(e => {
            const isValid = e.hp > 0 && e.maxHp > 0 && !e.isDead;
            if (!isValid) {
              console.warn(`[Dungeon Mode] ⚠️ Invalid enemy detected: ${e.name} (hp: ${e.hp}, maxHp: ${e.maxHp}, isDead: ${e.isDead})`);
            }
            return isValid;
          });
          
          if (validEnemies.length > 0) {
            // Fix any enemies that have invalid HP or are marked as dead
            enemiesRef.current.forEach(e => {
              if ((e.hp <= 0 || e.isDead) && e.maxHp > 0) {
                console.warn(`[Dungeon Mode] 🔧 Fixing enemy ${e.name}: HP was ${e.hp}, isDead was ${e.isDead}, setting HP to ${e.maxHp} and isDead to false`);
                e.hp = e.maxHp;
                e.isDead = false;
              }
            });
            // Update state to reflect the fixes
            setEnemies([...enemiesRef.current]);
            console.log('[Dungeon Mode] ⚔️ Starting combat NOW!', `Valid enemies: ${validEnemies.length}`);
            corruptedPriestSpawnedRef.current = false; // Reset spawn flag
        corruptedPriestSpawnInProgress.current = false; // Reset spawn in-progress flag for new combat
        setInCombat(true);
          } else {
            console.error('[Dungeon Mode] ⚠️ Cannot start combat - enemies are dead or missing!', enemiesRef.current.map(e => ({
              name: e.name,
              hp: e.hp,
              maxHp: e.maxHp,
              isDead: e.isDead,
              level: e.level,
              enemyType: e.enemyType
            })));
            // Try to fix all enemies one more time
            console.log('[Dungeon Mode] 🔧 Attempting emergency fix for all enemies...');
            enemiesRef.current.forEach(e => {
              if (e.maxHp > 0) {
                e.hp = e.maxHp;
                e.isDead = false;
              } else {
                // Calculate a fallback maxHp
                const fallbackHp = Math.floor(100 * (1 + (e.level || 15) * 0.15)) * (e.isBoss ? 1.5 : 1);
                e.maxHp = fallbackHp;
                e.hp = fallbackHp;
                e.isDead = false;
                console.warn(`[Dungeon Mode] 🚨 Emergency fix for ${e.name}: calculated maxHp=${fallbackHp}`);
              }
            });
            setEnemies([...enemiesRef.current]);
            corruptedPriestSpawnedRef.current = false; // Reset spawn flag
        corruptedPriestSpawnInProgress.current = false; // Reset spawn in-progress flag for new combat
        setInCombat(true);
          }
        }, 1000);
      }
    };
    
    fetchDungeonHeroes().catch(err => {
      console.error('[Dungeon Mode] ❌ Failed to setup dungeon:', err);
    });
  }, [gameMode, instanceData?.currentRoom, instanceData?.id, instanceData?.dungeonId, instanceData?.rooms]);

  // Quest tracking state (accumulate progress, batch sync to backend)
  const questProgressRef = useRef<Map<string, Map<string, number>>>(new Map()); // heroId -> trackingKey -> count
  const pendingGathersRef = useRef<Map<string, number>>(new Map()); // heroId -> gather count (for batch sync)
  const lastQuestSyncRef = useRef<number>(Date.now());
  
  // Auto-purchase tracking state (accumulate purchases, batch sync to backend)
  const pendingPurchasesRef = useRef<Map<string, Array<{ itemKey: string; quantity: number }>>>(new Map()); // heroId -> array of purchases
  const lastPurchaseSyncRef = useRef<number>(Date.now());
  
  // Auto-gathering tracking state (accumulate gathers, batch sync to backend)
  const lastGatherSyncRef = useRef<number>(Date.now());
  
  // Hero stat change tracking state (accumulate changes, batch sync to backend)
  interface HeroStatChanges {
    xp?: number; // Delta XP (can be negative for level ups)
    gold?: number; // Delta gold
    level?: number; // New level (absolute, not delta)
    hp?: number; // Current HP (absolute)
    maxHp?: number; // New max HP (absolute)
    attack?: number; // New attack (absolute)
    defense?: number; // New defense (absolute)
    stats?: { totalDamage?: number; totalHealing?: number; damageBlocked?: number }; // Stats deltas
  }
  const heroStatChangesRef = useRef<Map<string, HeroStatChanges>>(new Map()); // heroId -> stat changes
  const lastHeroStatSyncRef = useRef<number>(Date.now());
  
  // Equipment change tracking state (accumulate changes, batch sync to backend)
  const equipmentChangesRef = useRef<Map<string, any>>(new Map()); // heroId -> equipment object (absolute, latest wins)
  const lastEquipmentSyncRef = useRef<number>(Date.now());
  const lastSyncedEquipmentRef = useRef<Map<string, any>>(new Map()); // heroId -> last synced equipment (for change detection)
  
  // Inventory change tracking state (accumulate changes, batch sync to backend)
  const inventoryChangesRef = useRef<Map<string, any[]>>(new Map()); // heroId -> inventory array (absolute, latest wins)
  const lastInventorySyncRef = useRef<number>(Date.now());
  const lastSyncedInventoryRef = useRef<Map<string, any[]>>(new Map()); // heroId -> last synced inventory (for change detection)
  
  // Profession materials tracking state (accumulate changes, batch sync to backend)
  const professionMaterialsRef = useRef<Map<string, any>>(new Map()); // heroId -> profession materials object
  const lastProfessionMaterialsSyncRef = useRef<number>(Date.now());
  
  const dungeonRaidDefCache = useRef<{ id: string; allowedSlots?: string[] } | null>(null);

  // SCT (Scrolling Combat Text) state
  type SCTType = 'damage' | 'crit' | 'heal' | 'heal-hot' | 'dot' | 'loot' | 'levelup' | 'questcomplete' | 'xp' | 'miss' | 'gather' | 'profession-xp';
  interface SCTMessage {
    id: string;
    text: string;
    x: number;
    y: number;
    type: SCTType;
    timestamp: number;
  }
  const [sctMessages, setSctMessages] = useState<SCTMessage[]>([]);
  
  const adventureIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const combatRoundTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const combatInProgress = useRef(false);
  
  // CRITICAL: Refs to prevent duplicate intervals from React Strict Mode
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const syncIntervalInitializedRef = useRef(false);
  const buffCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const regenIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const resIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Refs for sprite animations
  const heroSpriteRefs = useRef<Map<string, React.RefObject<any>>>(new Map());
  const enemySpriteRefs = useRef<Map<string, React.RefObject<any>>>(new Map());
  
  // Refs for current combat state (so combat round has fresh data)
  const heroesRef = useRef<Hero[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  
  // Get or create sprite ref
  const getHeroSpriteRef = (heroId: string) => {
    if (!heroSpriteRefs.current.has(heroId)) {
      heroSpriteRefs.current.set(heroId, React.createRef());
    }
    return heroSpriteRefs.current.get(heroId)!;
  };
  
  const getEnemySpriteRef = (enemyId: string) => {
    if (!enemySpriteRefs.current.has(enemyId)) {
      enemySpriteRefs.current.set(enemyId, React.createRef());
    }
    return enemySpriteRefs.current.get(enemyId)!;
  };

  // Get battlefield ID from URL and convert if needed
  const urlBattlefieldId = searchParams.get('battlefieldId');

  // Load wave count from localStorage on mount (persist across refreshes)
  useEffect(() => {
    if (!urlBattlefieldId) return;
    
    const storageKey = `waveCount_${urlBattlefieldId}`;
    const savedWaveCount = localStorage.getItem(storageKey);
    const savedCombatWaveCount = localStorage.getItem(`${storageKey}_combat`);
    
    if (savedWaveCount) {
      const wave = parseInt(savedWaveCount, 10);
      if (!isNaN(wave) && wave > 0) {
        setWaveCount(wave);
        console.log(`[Wave Persistence] ✅ Loaded wave count: ${wave}`);
      }
    }
    
    if (savedCombatWaveCount) {
      const combatWave = parseInt(savedCombatWaveCount, 10);
      if (!isNaN(combatWave) && combatWave >= 0) {
        setCombatWaveCount(combatWave);
        console.log(`[Wave Persistence] ✅ Loaded combat wave count: ${combatWave}`);
      }
    }
  }, [urlBattlefieldId]);
  
  // Save wave count to localStorage whenever it changes
  useEffect(() => {
    if (!urlBattlefieldId || waveCount === 1) return; // Don't save initial value
    
    const storageKey = `waveCount_${urlBattlefieldId}`;
    localStorage.setItem(storageKey, waveCount.toString());
    console.log(`[Wave Persistence] 💾 Saved wave count: ${waveCount}`);
  }, [waveCount, urlBattlefieldId]);
  
  useEffect(() => {
    if (!urlBattlefieldId || combatWaveCount === 0) return; // Don't save initial value
    
    const storageKey = `waveCount_${urlBattlefieldId}_combat`;
    localStorage.setItem(storageKey, combatWaveCount.toString());
    console.log(`[Wave Persistence] 💾 Saved combat wave count: ${combatWaveCount}`);
  }, [combatWaveCount, urlBattlefieldId]);

  // Convert battlefield ID from username to numeric format
  useEffect(() => {
    const convertBattlefieldId = async () => {
      if (!urlBattlefieldId) {
        setError('No battlefieldId in URL. Add ?battlefieldId=twitch:YOUR_TWITCH_ID');
        setLoading(false);
        return;
      }

      console.log('[CleanBattlefield] URL battlefieldId:', urlBattlefieldId);

      // Check if it's already numeric
      if (urlBattlefieldId.startsWith('twitch:')) {
        const identifier = urlBattlefieldId.replace('twitch:', '');
        
        if (/^\d+$/.test(identifier)) {
          // Already numeric
          console.log('[CleanBattlefield] Using numeric battlefield ID:', urlBattlefieldId);
          setBattlefieldId(urlBattlefieldId);
          return;
        }

        // It's a username - need to convert
        console.log('[CleanBattlefield] Converting username to numeric ID...');
        
        try {
          const { query: firestoreQuery, where: firestoreWhere, getDocs } = await import('firebase/firestore');
          
          const heroesQuery = firestoreQuery(
            collection(db, 'heroes'),
            firestoreWhere('twitchUsername', '==', identifier.toLowerCase())
          );
          
          const snapshot = await getDocs(heroesQuery);
          
          if (!snapshot.empty) {
            const hero = snapshot.docs[0].data();
            const numericId = hero.twitchUserId || hero.twitchId;
            
            if (numericId) {
              const numericBattlefieldId = `twitch:${numericId}`;
              console.log('[CleanBattlefield] ✅ Converted to:', numericBattlefieldId);
              setBattlefieldId(numericBattlefieldId);
              return;
            }
          }

          // Couldn't convert - use as-is
          console.warn('[CleanBattlefield] Could not convert username, using as-is');
          setBattlefieldId(urlBattlefieldId);
        } catch (err) {
          console.error('[CleanBattlefield] Error converting battlefield ID:', err);
          setBattlefieldId(urlBattlefieldId);
        }
      } else {
        setBattlefieldId(urlBattlefieldId);
      }
    };

    convertBattlefieldId();
  }, [urlBattlefieldId]);

  // Load heroes from Firebase (ALWAYS load, but only set combat heroes in idle mode!)
  useEffect(() => {
    if (!battlefieldId) {
      return;
    }

    console.log('[CleanBattlefield] Loading heroes for battlefield:', battlefieldId);

    // Query heroes on this battlefield
    const heroesQuery = query(
      collection(db, 'heroes'),
      where('currentBattlefieldId', '==', battlefieldId)
    );

    // Real-time listener
    const unsubscribe = onSnapshot(heroesQuery, (snapshot) => {
      // Log changes for debugging
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'removed') {
          console.log(`[Firebase] 🗑️ Hero removed from query: ${change.doc.id} (${change.doc.data().name || 'Unknown'})`);
        } else if (change.type === 'modified') {
          console.log(`[Firebase] ✏️ Hero modified: ${change.doc.id} (${change.doc.data().name || 'Unknown'})`);
        } else if (change.type === 'added') {
          console.log(`[Firebase] ➕ Hero added to query: ${change.doc.id} (${change.doc.data().name || 'Unknown'})`);
        }
      });
      
      const loadedHeroes = snapshot.docs.map(doc => {
        const data = doc.data();
        // CRITICAL: Use actual Firebase level (don't default to 1 if level exists)
        // Level 1 is valid after prestige, so we need to check for undefined/null specifically
        let firebaseLevel = data.level !== undefined && data.level !== null ? data.level : 1;
        const firebasePrestigeLevel = data.prestigeLevel || 0;
        const MAX_LEVEL = 100;
        
        // CRITICAL: Protect prestiged heroes from invalid level data in Firebase
        if (firebasePrestigeLevel > 0) {
          if (firebaseLevel > MAX_LEVEL) {
            console.error(`[Firebase Load] 🚨 BLOCKED: Prestiged hero ${data.name || 'Hero'} (P${firebasePrestigeLevel}) has invalid level ${firebaseLevel} in Firebase. Forcing to 1.`);
            firebaseLevel = 1;
            // Also reset XP if level is invalid
            if (data.xp !== undefined && data.xp > 0) {
              data.xp = 0;
            }
            if (data.maxXp !== undefined) {
              data.maxXp = 100; // Level 1 maxXp
            }
          } else if (firebaseLevel < 1) {
            console.warn(`[Firebase Load] ⚠️ Prestiged hero ${data.name || 'Hero'} has level ${firebaseLevel}, forcing to 1.`);
            firebaseLevel = 1;
          }
        }
        
        // Debug log for prestige heroes
        if (firebasePrestigeLevel > 0 && firebaseLevel > 100) {
          console.warn(`[Prestige Level Mismatch] ⚠️ ${data.name || 'Hero'}: Prestige ${firebasePrestigeLevel} but level is ${firebaseLevel} (should be ≤100)`);
        }
        
        return {
          id: doc.id,
          name: data.name || data.username || data.characterName || 'Hero',
          role: data.role || 'berserker',
          level: firebaseLevel, // Use protected Firebase level
          hp: data.hp || 100,
          maxHp: data.maxHp || 100,
          xp: data.xp || 0,
          maxXp: data.maxXp || 100,
          attack: data.attack || 0,
          defense: data.defense || 0,
          currentBattlefieldId: data.currentBattlefieldId,
          autoBuy: data.autoBuy || false,
          gold: data.gold || 0,
          profession: data.profession || null,
          quests: data.quests || {},
          // CRITICAL: Include twitchUserId for quest sync
          twitchUserId: data.twitchUserId || data.twitchId,
          // Include active title for display
          activeTitle: data.activeTitle || null,
          // Include founder badge for display
          founderBadge: data.founderBadge || data.activeBadge || null,
          // Include custom name color
          nameColor: data.nameColor || null,
          // Include name frame
          nameFrame: data.nameFrame || null,
          // Include aura effect
          auraEffect: data.auraEffect || null,
          auraColor: data.auraColor || null,
          // Include spell effect
          spellEffect: data.spellEffect || null,
          // Store raw equipment for stat calculation (ALL slots)
          equipment: {
            weapon: data.equipment?.weapon || null,
            armor: data.equipment?.armor || null,
            accessory: data.equipment?.accessory || null,
            shield: data.equipment?.shield || null,
            helm: data.equipment?.helm || null,
            cloak: data.equipment?.cloak || null,
            gloves: data.equipment?.gloves || null,
            ring1: data.equipment?.ring1 || null,
            ring2: data.equipment?.ring2 || null,
            boots: data.equipment?.boots || null
          },
          skills: data.skills || {},
          enchantedItems: data.enchantedItems || [],
          shield: data.shield || 0,
          prestigeLevel: data.prestigeLevel || 0,
          prestigeBoosts: data.prestigeBoosts || null,
          shopBuffs: data.shopBuffs || {},
          inventory: data.inventory || [],
          potions: data.potions || { health: 0 }
        } as Hero;
      });

      console.log(`[CleanBattlefield] ✅ Loaded ${loadedHeroes.length} heroes:`, loadedHeroes.map(h => `${h.name} (${h.role} Lv${h.level})`));
      
      // DEBUG: Log profession data and title for each hero      
      if (loadedHeroes.length === 0) {
        console.warn('[CleanBattlefield] ⚠️ No heroes found with currentBattlefieldId:', battlefieldId);
        console.warn('[CleanBattlefield] 💡 Heroes need to !join to set their currentBattlefieldId');
      }
      
      if (loadedHeroes.length > 2) {
        console.warn(`[CleanBattlefield] ⚠️ ${loadedHeroes.length} heroes found! Might be duplicates. Check Firebase.`);
      }
      
      // Calculate stats from equipment for each hero
      const heroesWithStats = loadedHeroes.map(calculateHeroStats);
      
      // FILTER OUT TEST USERS (test-flow-user, test-user-*, etc.)
      const nonTestHeroes = heroesWithStats.filter(hero => {
        const isTestUser = 
          hero.id?.startsWith('test-') || 
          hero.twitchUserId?.startsWith('test-') ||
          hero.name?.toLowerCase().includes('testflow') ||
          hero.name?.toLowerCase().includes('testuser');
        
        if (isTestUser) {
          console.log(`[CleanBattlefield] 🚫 Filtering out test user: ${hero.name} (${hero.id})`);
        }
        
        return !isTestUser;
      });
      
      // DEDUPLICATE by hero ID (prevent duplicate renders!)
      const uniqueHeroes = nonTestHeroes.filter((hero, index, self) => 
        index === self.findIndex(h => h.id === hero.id)
      );
      
      if (uniqueHeroes.length !== heroesWithStats.length) {
        const removed = heroesWithStats.length - uniqueHeroes.length;
        console.warn(`[CleanBattlefield] ⚠️ Removed ${removed} hero(es) (duplicates + test users)!`);
      }
      
      // ALWAYS store loaded heroes (used by raid setup to find actual hero data)
      setLoadedHeroes(uniqueHeroes);
      
      // Only set combat heroes in IDLE mode (raid mode populates heroes from participants)
      // CRITICAL: Don't update heroes during raid combat! (would reset raid party)
      if (gameMode === 'idle') {
        setHeroes(current => {
          // Start with heroes from Firebase (have currentBattlefieldId set)
          const heroMap = new Map<string, Hero>();
          
          // Add all heroes from Firebase
          uniqueHeroes.forEach(firebaseHero => {
            const existingHero = current.find(h => h.id === firebaseHero.id);
            if (existingHero) {
              // CRITICAL: Always trust Firebase level, default to 1 if undefined (not existing level)
              let firebaseLevel = firebaseHero.level !== undefined && firebaseHero.level !== null ? firebaseHero.level : 1;
              const firebasePrestigeLevel = firebaseHero.prestigeLevel !== undefined ? firebaseHero.prestigeLevel : (existingHero.prestigeLevel || 0);
              const MAX_LEVEL = 100;
              
              // CRITICAL: If hero has prestiged, ensure level is valid (1-100)
              // Trust Firebase as source of truth - if invalid, force to 1 (don't preserve old level)
              if (firebasePrestigeLevel > 0) {
                // Prestiged heroes should NEVER be above level 100
                if (firebaseLevel > MAX_LEVEL) {
                  console.error(`[Firebase Listener] 🚨 BLOCKED: Prestiged hero ${firebaseHero.name} (P${firebasePrestigeLevel}) has invalid level ${firebaseLevel} in Firebase. Forcing to 1.`);
                  firebaseLevel = 1; // Force to 1 instead of preserving old level
                  // Also reset XP if level is invalid
                  if (firebaseHero.xp !== undefined && firebaseHero.xp > 0) {
                    firebaseHero.xp = 0;
                  }
                  if (firebaseHero.maxXp !== undefined) {
                    firebaseHero.maxXp = 100; // Level 1 maxXp
                  }
                }
                // Also ensure level is at least 1 for prestiged heroes
                if (firebaseLevel < 1) {
                  console.warn(`[Firebase Listener] ⚠️ Prestiged hero ${firebaseHero.name} has level ${firebaseLevel}, forcing to 1.`);
                  firebaseLevel = 1;
                }
              }
              
              // CRITICAL: Log level changes for debugging prestige resets
              if (firebaseLevel !== existingHero.level) {
                console.log(`[Prestige Update] 🔄 ${firebaseHero.name}: Level ${existingHero.level} → ${firebaseLevel} (Prestige: ${firebasePrestigeLevel})`);
              }
              
              // Preserve combat-specific state but update HP, inventory, shield, shopBuffs, title from Firebase
              heroMap.set(firebaseHero.id, {
                ...existingHero,
                // Update name from Firebase (user may have changed their hero name)
                name: firebaseHero.name || firebaseHero.username || firebaseHero.characterName || existingHero.name,
                hp: firebaseHero.hp,
                maxHp: firebaseHero.maxHp,
                shield: firebaseHero.shield || 0,
                shopBuffs: firebaseHero.shopBuffs || {},
                inventory: firebaseHero.inventory || [],
                gold: firebaseHero.gold,
                // CRITICAL: Update level, XP, and maxXp from Firebase (important for prestige resets)
                // Use protected Firebase level
                level: firebaseLevel,
                xp: firebaseHero.xp !== undefined ? firebaseHero.xp : existingHero.xp,
                maxXp: firebaseHero.maxXp !== undefined ? firebaseHero.maxXp : existingHero.maxXp,
                // Update cosmetic/display fields from Firebase (title, colors, frames, etc.)
                activeTitle: firebaseHero.activeTitle !== undefined ? firebaseHero.activeTitle : existingHero.activeTitle,
                nameColor: firebaseHero.nameColor !== undefined ? firebaseHero.nameColor : existingHero.nameColor,
                nameFrame: firebaseHero.nameFrame !== undefined ? firebaseHero.nameFrame : existingHero.nameFrame,
                auraEffect: firebaseHero.auraEffect !== undefined ? firebaseHero.auraEffect : existingHero.auraEffect,
                auraColor: firebaseHero.auraColor !== undefined ? firebaseHero.auraColor : existingHero.auraColor,
                founderBadge: firebaseHero.founderBadge !== undefined ? firebaseHero.founderBadge : existingHero.founderBadge,
                prestigeLevel: firebaseHero.prestigeLevel !== undefined ? firebaseHero.prestigeLevel : (existingHero.prestigeLevel || 0),
                prestigeBoosts: firebaseHero.prestigeBoosts !== undefined ? firebaseHero.prestigeBoosts : existingHero.prestigeBoosts
              });
            } else {
              heroMap.set(firebaseHero.id, firebaseHero);
            }
          });
          
          // CRITICAL: Preserve heroes from current state that might have been in dungeon/raid
          // These heroes might not have currentBattlefieldId set yet but should still appear
          current.forEach(hero => {
            // Only keep if not already in map (Firebase takes priority) and if hero looks valid
            if (!heroMap.has(hero.id) && hero.id && hero.name) {
              // Check if hero was recently in an instance (preserve for transition)
              // Keep heroes that might have been from dungeon/raid queue
              heroMap.set(hero.id, hero);
            }
          });
          
          const finalHeroes = Array.from(heroMap.values());
          heroesRef.current = finalHeroes; // Keep ref in sync with state
          return finalHeroes;
        });
      } else if (gameMode === 'raid' || gameMode === 'dungeon') {
        // In raid/dungeon, update HP/shield/inventory/title without resetting combat state
        setHeroes(current => {
          return current.map(combatHero => {
            const firebaseHero = uniqueHeroes.find(h => h.id === combatHero.id);
            if (firebaseHero) {
              // CRITICAL: Always trust Firebase level, default to 1 if undefined (not combat hero level)
              let firebaseLevel = firebaseHero.level !== undefined && firebaseHero.level !== null ? firebaseHero.level : 1;
              const firebasePrestigeLevel = firebaseHero.prestigeLevel !== undefined ? firebaseHero.prestigeLevel : (combatHero.prestigeLevel || 0);
              const MAX_LEVEL = 100;
              
              // CRITICAL: If hero has prestiged, ensure level is valid (1-100)
              // Trust Firebase as source of truth - if invalid, force to 1 (don't preserve old level)
              if (firebasePrestigeLevel > 0) {
                if (firebaseLevel > MAX_LEVEL) {
                  console.error(`[Firebase Listener] 🚨 BLOCKED: Prestiged hero ${firebaseHero.name} (P${firebasePrestigeLevel}) has invalid level ${firebaseLevel} in Firebase. Forcing to 1.`);
                  firebaseLevel = 1; // Force to 1 instead of preserving old level
                  // Also reset XP if level is invalid
                  if (firebaseHero.xp !== undefined && firebaseHero.xp > 0) {
                    firebaseHero.xp = 0;
                  }
                  if (firebaseHero.maxXp !== undefined) {
                    firebaseHero.maxXp = 100; // Level 1 maxXp
                  }
                }
                if (firebaseLevel < 1) {
                  console.warn(`[Firebase Listener] ⚠️ Prestiged hero ${firebaseHero.name} has level ${firebaseLevel}, forcing to 1.`);
                  firebaseLevel = 1;
                }
              }
              
              return {
                ...combatHero,
                hp: firebaseHero.hp,
                maxHp: firebaseHero.maxHp,
                shield: firebaseHero.shield || combatHero.shield || 0,
                shopBuffs: firebaseHero.shopBuffs || combatHero.shopBuffs || {},
                inventory: firebaseHero.inventory || combatHero.inventory || [],
                // CRITICAL: Update level, XP, and maxXp from Firebase (important for prestige resets)
                // Use protected Firebase level
                level: firebaseLevel,
                xp: firebaseHero.xp !== undefined ? firebaseHero.xp : combatHero.xp,
                maxXp: firebaseHero.maxXp !== undefined ? firebaseHero.maxXp : combatHero.maxXp,
                // Update title if it changed in Firebase
                activeTitle: firebaseHero.activeTitle !== undefined ? firebaseHero.activeTitle : combatHero.activeTitle,
                nameColor: firebaseHero.nameColor !== undefined ? firebaseHero.nameColor : combatHero.nameColor,
                nameFrame: firebaseHero.nameFrame !== undefined ? firebaseHero.nameFrame : combatHero.nameFrame,
                auraEffect: firebaseHero.auraEffect !== undefined ? firebaseHero.auraEffect : combatHero.auraEffect,
                auraColor: firebaseHero.auraColor !== undefined ? firebaseHero.auraColor : combatHero.auraColor,
                founderBadge: firebaseHero.founderBadge !== undefined ? firebaseHero.founderBadge : combatHero.founderBadge,
                prestigeLevel: firebaseHero.prestigeLevel !== undefined ? firebaseHero.prestigeLevel : (combatHero.prestigeLevel || 0),
                prestigeBoosts: firebaseHero.prestigeBoosts !== undefined ? firebaseHero.prestigeBoosts : combatHero.prestigeBoosts
              };
            }
            return combatHero;
          });
        });
      }
      
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error('[CleanBattlefield] ❌ Firebase error:', err);
      setError(`Firebase error: ${err.message}`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [battlefieldId, gameMode]);

  // Load sprite facing preferences from backend (use streamer's ID from battlefieldId)
  useEffect(() => {
    // Extract streamer's Twitch ID from battlefieldId (format: "twitch:1087777297")
    const streamerId = twitchId || user?.id;
    if (!streamerId) return;

    console.log('[CleanBattlefield] Loading facing preferences for streamer:', streamerId);
    battlefieldAPI.getSpriteFacingPreferences(streamerId)
      .then(prefs => {
        console.log('[CleanBattlefield] ✅ Loaded facing preferences:', prefs);
        setFacingPreferences(prefs);
      })
      .catch(err => {
        console.warn('[CleanBattlefield] ⚠️ Could not load facing preferences:', err);
        // Fallback to localStorage if available
        const saved = localStorage.getItem('spriteFacingPreferences');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            console.log('[CleanBattlefield] 📂 Using cached facing preferences from localStorage');
            setFacingPreferences(parsed);
          } catch (e) {
            console.warn('[CleanBattlefield] Failed to parse cached preferences');
          }
        }
      });
  }, [twitchId, user?.id]);

  // Get facing direction (from preferences or defaults)
  const getFacingDirection = (roleOrEnemyName: string, defaultFacing: 'left' | 'right'): 'left' | 'right' => {
    // Check preferences first
    if (facingPreferences[roleOrEnemyName]) {
      return facingPreferences[roleOrEnemyName];
    }
    
    // Default facing
    return defaultFacing;
  };

  // Toggle test healer
  const toggleTestHealer = () => {
    if (testHealer) {
      console.log('[Test] Removing test healer');
      setTestHealer(null);
    } else {
      const avgLevel = heroes.length > 0 
        ? Math.floor(heroes.reduce((sum, h) => sum + h.level, 0) / heroes.length)
        : 50;
      
      const newHealer: Hero = {
        id: 'test-healer',
        name: 'Test Cleric',
        role: 'cleric',
        level: avgLevel,
        hp: 100 + avgLevel * 20,
        maxHp: 100 + avgLevel * 20,
        xp: 0,
        maxXp: 100 + avgLevel * 10,
        attack: avgLevel * 5,
        defense: avgLevel * 2,
        isDead: false
      };
      
      console.log(`[Test] Adding test healer (Level ${avgLevel})`);
      setTestHealer(newHealer);
    }
  };

  // Add shield to first hero for testing
  const addTestShield = () => {
    const targetHero = testHealer || (heroes.length > 0 ? heroes[0] : null);
    if (!targetHero) {
      console.log('[Test] No hero to add shield to');
      return;
    }
    
    console.log(`[Test] Adding 500 shield to ${targetHero.name} (ID: ${targetHero.id})`);
    
    if (targetHero.id === 'test-healer' && testHealer) {
      const newShield = (testHealer.shield || 0) + 500;
      console.log(`[Test] Test healer shield: ${testHealer.shield || 0} → ${newShield}`);
      setTestHealer(prev => prev ? { ...prev, shield: newShield } : null);
    } else {
      setHeroes(current => {
        const updated = current.map(hero => {
          if (hero.id === targetHero.id) {
            const newShield = (hero.shield || 0) + 500;
            console.log(`[Test] ${hero.name} shield: ${hero.shield || 0} → ${newShield}`);
            return { ...hero, shield: newShield };
          }
          return hero;
        });
        heroesRef.current = updated;
        return updated;
      });
    }
  };

  // Add HP regen for testing
  const addTestHpRegen = () => {
    const targetHero = testHealer || (heroes.length > 0 ? heroes[0] : null);
    if (!targetHero) return;
    
    console.log(`[Test] Adding +10 HP regen to ${targetHero.name}`);
    
    if (targetHero.id === 'test-healer' && testHealer) {
      setTestHealer(prev => prev ? { ...prev, hpRegen: (prev.hpRegen || 0) + 10 } : null);
    } else {
      setHeroes(current => {
        const updated = current.map(hero => 
          hero.id === targetHero.id 
            ? { ...hero, hpRegen: (hero.hpRegen || 0) + 10 }
            : hero
        );
        heroesRef.current = updated;
        return updated;
      });
    }
  };

  // Merge test healer with real heroes for combat/display
  // CRITICAL: Deduplicate to prevent same hero appearing twice (e.g., if testHealer has same ID as real hero)
  const allHeroes = testHealer 
    ? (heroes.some(h => h.id === testHealer.id) 
        ? heroes // If testHealer ID matches a real hero, don't add it
        : [...heroes, testHealer])
    : heroes;

  // ============================================================================
  // QUEST TRACKING SYSTEM
  // ============================================================================
  
  // Track quest progress (accumulates locally, syncs to backend in batches)
  const trackQuest = (heroId: string, trackingKey: string, increment: number = 1) => {
    if (!questProgressRef.current.has(heroId)) {
      questProgressRef.current.set(heroId, new Map());
    }
    
    const heroProgress = questProgressRef.current.get(heroId)!;
    const current = heroProgress.get(trackingKey) || 0;
    heroProgress.set(trackingKey, current + increment);
    
    // Debug log (can disable later)
    if (increment > 0) {
      console.log(`[Quest] ${heroId} - ${trackingKey}: +${increment} (total: ${current + increment})`);
    }
  };

  // Track hero stat changes (accumulates locally, syncs to backend in batches)
  const trackHeroStatChange = (heroId: string, changes: HeroStatChanges) => {
    if (!heroStatChangesRef.current.has(heroId)) {
      heroStatChangesRef.current.set(heroId, {});
    }
    
    const existing = heroStatChangesRef.current.get(heroId)!;
    
    // Merge changes, handling deltas vs absolute values
    if (changes.xp !== undefined) {
      // XP is a delta (can be negative on level up)
      existing.xp = (existing.xp || 0) + changes.xp;
    }
    if (changes.gold !== undefined) {
      // Gold is a delta
      existing.gold = (existing.gold || 0) + changes.gold;
    }
    // Level, HP, maxHp, attack, defense are absolute (take latest)
    if (changes.level !== undefined) {
      existing.level = changes.level;
    }
    if (changes.hp !== undefined) {
      existing.hp = changes.hp;
    }
    if (changes.maxHp !== undefined) {
      existing.maxHp = changes.maxHp;
    }
    if (changes.attack !== undefined) {
      existing.attack = changes.attack;
    }
    if (changes.defense !== undefined) {
      existing.defense = changes.defense;
    }
    // Stats are deltas
    if (changes.stats) {
      if (!existing.stats) {
        existing.stats = {};
      }
      if (changes.stats.totalDamage !== undefined) {
        existing.stats.totalDamage = (existing.stats.totalDamage || 0) + changes.stats.totalDamage;
      }
      if (changes.stats.totalHealing !== undefined) {
        existing.stats.totalHealing = (existing.stats.totalHealing || 0) + changes.stats.totalHealing;
      }
      if (changes.stats.damageBlocked !== undefined) {
        existing.stats.damageBlocked = (existing.stats.damageBlocked || 0) + changes.stats.damageBlocked;
      }
    }
    
    heroStatChangesRef.current.set(heroId, existing);
  };

  // Track equipment changes (accumulates locally, syncs to backend in batches)
  const trackEquipmentChange = (heroId: string, equipment: any) => {
    // Equipment is absolute (latest wins - we'll use the current hero's equipment when syncing)
    equipmentChangesRef.current.set(heroId, equipment);
  };

  // Track inventory changes (accumulates locally, syncs to backend in batches)
  const trackInventoryChange = (heroId: string, inventory: any[]) => {
    // Inventory is absolute (latest wins - we'll use the current hero's inventory when syncing)
    inventoryChangesRef.current.set(heroId, inventory);
  };

  // Add SCT message with random offset to prevent overlap
  const addSCT = (text: string, x: number, y: number, type: SCTType) => {
    const id = `${Date.now()}-${Math.random()}`;
    
    // Add random offset to prevent SCT overlap
    // Horizontal: -40 to +40 pixels
    // Vertical: -20 to +20 pixels
    const offsetX = (Math.random() - 0.5) * 80; // -40 to +40
    const offsetY = (Math.random() - 0.5) * 40; // -20 to +20
    const finalX = x + offsetX;
    const finalY = y + offsetY;
    
    setSctMessages(prev => [...prev, { 
      id, 
      text, 
      x: finalX, 
      y: finalY, 
      type, 
      timestamp: Date.now() 
    }]);
    
    // Auto-remove based on type
    const duration = type === 'crit' ? 3000 :
                     type === 'levelup' || type === 'questcomplete' ? 2500 :
                     type === 'loot' ? 2000 :
                     type === 'xp' ? 1500 :
                     type === 'heal-hot' || type === 'miss' ? 1000 :
                     type === 'dot' ? 1500 :
                     type === 'gather' || type === 'profession-xp' ? 1500 :
                     2000;
    
    setTimeout(() => {
      setSctMessages(prev => prev.filter(msg => msg.id !== id));
    }, duration);
  };

  // Step 3: Local adventure loop (auto-spawns enemies)
  useEffect(() => {
    // CRITICAL: Don't run adventure loop if in dungeon/raid mode
    if (gameMode !== 'idle') {
      console.log('[Adventure] Skipping - in', gameMode, 'mode');
      return;
    }
    
    // Safety check (use allHeroes to include test healer)
    if (!allHeroes || allHeroes.length === 0) {
      return;
    }
    
    // CRITICAL: Prevent duplicate loops
    if (adventureIntervalRef.current) {
      console.log('[Adventure] ⚠️ Loop already running (ID:', adventureIntervalRef.current, '), ABORTING duplicate initialization');
      return; // STOP - don't create another loop!
    }

    console.log('[Adventure] ✅ Starting NEW adventure loop with', allHeroes.length, 'heroes');

    // Start adventure loop - tick every 5 seconds
    const startAdventure = () => {
      console.log('[Adventure] Starting interval (first tick in 1s, then every 5s)');
      
      // First tick after 1 second
      setTimeout(() => {
        adventureTick();
      }, 1000);

      // Then every 5 seconds
      const intervalId = setInterval(() => {
        adventureTick();
      }, 5000);

      adventureIntervalRef.current = intervalId;
      console.log('[Adventure] Interval ID:', intervalId);
    };

    // Adventure tick function
    const adventureTick = () => {
      // Skip if in combat (use refs for current state!)
      // Also check if enemies are actually alive (not just present)
      const aliveEnemies = enemiesRef.current.filter(e => e.hp > 0 && !e.isDead);
      if (combatInProgress.current || aliveEnemies.length > 0) {
        console.log('[Adventure] Skipping tick - combat in progress');
        return;
      }

      // Use functional setState to avoid stale closure
      setWaveCount(prevWave => {
        const nextTick = prevWave + 1;
        console.log(`[Adventure] Tick ${nextTick}`);
        
        const isBossWave = nextTick % 10 === 0;
        const isAutoRest = nextTick % 5 === 0 && !isBossWave;

        // Spawn enemies or handle special waves
        setTimeout(() => {
          if (isBossWave) {
            // BOSS WAVE - increment combat wave counter
            setCombatWaveCount(prev => {
              const newWave = prev + 1;
              console.log(`[Adventure] 👑 BOSS WAVE ${newWave}`);
              return newWave;
            });
            spawnEnemies(true);
          } else if (isAutoRest) {
            console.log(`[Adventure] 😴 Auto-rest - Heroes rest, no wave count`);
            // Auto-rest: Just skip, don't count as combat wave
          } else {
            // Random encounter
            const rand = Math.random();
            
            if (rand < 0.4) {
              // COMBAT (40%) - increment combat wave counter
              setCombatWaveCount(prev => {
                const newWave = prev + 1;
                console.log(`[Adventure] ⚔️ Combat Wave ${newWave}`);
                return newWave;
              });
              spawnEnemies(false);
            } else if (rand < 0.7) {
              // TREASURE (30%) - no wave count
              console.log(`[Adventure] 💰 Treasure - no wave count`);
              const goldAmount = Math.floor(5 + nextTick * 0.5);
              handleTreasure(goldAmount);
            } else {
              // SAFE TRAVEL (30%) - no wave count, but can gather materials
              console.log(`[Adventure] 🚶 Travel - no wave count`);
              handleGathering();
            }
          }
        }, 0);
        
        return nextTick;
      });
    };
    
    // Store adventureTick in ref so it can be accessed from checkCombatVictory
    adventureTickRef.current = adventureTick;
    
    // Treasure handler function
    const handleTreasure = (goldAmount: number) => {
      setHeroes(current => {
        const updated = current.map(hero => {
          if (hero.isDead) return hero;
          
          const newGold = (hero.gold || 0) + goldAmount;
          
          console.log(`[Treasure] ${hero.name} finds ${goldAmount}g!`);
          
          // Show gold SCT
          const heroElement = document.querySelector(`[data-hero-id="${hero.id}"]`);
          if (heroElement) {
            const rect = heroElement.getBoundingClientRect();
            addSCT(`${goldAmount}g`, rect.left + rect.width / 2, rect.top + 25, 'loot');
          }
          
          // AUTO-BUY during treasure (if autoBuy enabled) - Queue for batch sync
          if (hero.autoBuy && Math.random() < 0.3 && hero.id) {
            let itemToPurchase: string | null = null;
            
            // Prioritize health potions when low stock
            // Count potions in inventory
            const potionsInInventory = (hero.inventory || []).filter((item: any) => 
              (item as any).itemKey === 'healthpotion' || (item as any).type === 'potion'
            ).length;
            
            if (newGold >= 10 && potionsInInventory < 2) {
              itemToPurchase = 'healthpotion';
            }
            // Buy buffs if enough gold
            else {
              const affordableBuffs = [];
              if (newGold >= 25) affordableBuffs.push('xpboost');
              if (newGold >= 15) affordableBuffs.push('attackbuff');
              if (newGold >= 15) affordableBuffs.push('defensebuff');
              
              if (affordableBuffs.length > 0) {
                itemToPurchase = affordableBuffs[Math.floor(Math.random() * affordableBuffs.length)];
                
                // Queue purchase for batch sync (don't call API immediately)
                // The backend will add to inventory, then we'll auto-use it
                if (!pendingPurchasesRef.current.has(hero.id)) {
                  pendingPurchasesRef.current.set(hero.id, []);
                }
                pendingPurchasesRef.current.get(hero.id)!.push({ itemKey: itemToPurchase, quantity: 1 });
                
                // Show buff SCT
                const buffNames: Record<string, string> = {
                  xpboost: 'XP Boost Scroll',
                  attackbuff: 'Sharpening Stone',
                  defensebuff: 'Armor Polish'
                };
                
                const heroEl = document.querySelector(`[data-hero-id="${hero.id}"]`);
                if (heroEl) {
                  const rect = heroEl.getBoundingClientRect();
                  addSCT(`+${buffNames[itemToPurchase]}`, rect.left + rect.width / 2, rect.top + 45, 'loot');
                }
                
                return { 
                  ...hero, 
                  gold: newGold
                };
              }
            }
            
            // Purchase potion
            if (itemToPurchase === 'healthpotion') {
              // Show item SCT
              const heroEl = document.querySelector(`[data-hero-id="${hero.id}"]`);
              if (heroEl) {
                const rect = heroEl.getBoundingClientRect();
                addSCT('+Health Potion', rect.left + rect.width / 2, rect.top + 45, 'loot');
              }
              
              // Queue purchase for batch sync (don't call API immediately)
              if (!pendingPurchasesRef.current.has(hero.id)) {
                pendingPurchasesRef.current.set(hero.id, []);
              }
              pendingPurchasesRef.current.get(hero.id)!.push({ itemKey: itemToPurchase, quantity: 1 });
              
              return { 
                ...hero, 
                gold: newGold
              };
            }
          }
          
          return { ...hero, gold: newGold };
        });
        
        heroesRef.current = updated;
        return updated;
      });
    };
    
    // Automatic gathering handler (during safe travel)
    const handleGathering = () => {
      setHeroes(current => {
        const updated = current.map(hero => {
          if (hero.isDead || !hero.profession) return hero;
          
          // 20% chance to gather during safe travel (if hero has a profession)
          if (Math.random() < 0.2 && hero.id) {
            // Queue gather for batch sync (don't call API immediately)
            if (!pendingGathersRef.current.has(hero.id)) {
              pendingGathersRef.current.set(hero.id, 0);
            }
            pendingGathersRef.current.set(hero.id, (pendingGathersRef.current.get(hero.id) || 0) + 1);
            
            // QUEST TRACKING: Track gathering
            trackQuest(hero.id, 'gather', 1);
            
            // Get profession name (moved outside if block for scope)
            const professionName = hero.profession.type === 'herbalism' ? 'Herb' : 
                                   hero.profession.type === 'mining' ? 'Ore' : 
                                   'Material';
            
            // Show gather SCT
            const heroElement = document.querySelector(`[data-hero-id="${hero.id}"]`);
            if (heroElement) {
              const rect = heroElement.getBoundingClientRect();
              addSCT(`+${professionName}`, rect.left + rect.width / 2, rect.top + 25, 'gather');
            }
            
            console.log(`[Gathering] ${hero.name} gathered ${professionName} (${hero.profession.type})`);
          }
          
          return hero;
        });
        
        heroesRef.current = updated;
        return updated;
      });
    };

    // Spawn enemies function
    const spawnEnemies = (isBoss: boolean) => {
      console.log(`[Adventure] Generating enemies - Wave ${waveCount}, Boss: ${isBoss}`);
      console.log(`[Adventure] Party:`, heroes.map(h => `${h.name} Lv${h.level} ${h.role}`));
      
      // Calculate average party gear score for enemy scaling
      const avgGearScore = calculateAverageGearScore(heroes);
      
      console.log(`[Adventure] Party gear score: ${avgGearScore}`);
      console.log(`[Adventure] Difficulty modifier: ${(difficultyModifier * 100).toFixed(0)}%`);
      
      // Generate enemies using existing logic
      // CAP hero levels to prevent over-scaling (max level 30 for enemy generation)
      const cappedHeroes = allHeroes.map(h => ({
        level: Math.min(h.level, 30), // Cap at level 30 to prevent crazy scaling
        role: h.role,
        equipment: {} // Don't pass equipment to prevent gear stacking
      }));
      
      console.log(`[Adventure] Hero levels: ${allHeroes.map(h => h.level).join(', ')} (capped to 30 for scaling)`);
      
      const newEnemies = generateEnemiesForCombat(
        cappedHeroes,
        waveCount,
        difficultyModifier
      );
      
      console.log(`[Adventure] Generated ${newEnemies.length} enemies before boss check:`, newEnemies.map(e => e.name));

      // Convert to our Enemy type (scaling already applied in generateEnemiesForCombat)
      const convertedEnemies: Enemy[] = newEnemies.map(e => {
        // NO NEED to apply difficultyModifier again - it's already included in e.hp and e.attack
        // The generateEnemiesForCombat function already applied all scaling including:
        // - Level scaling (12% per level)
        // - Party size scaling (8% per hero beyond first)
        // - Gear score scaling
        // - Wave scaling
        // - Difficulty modifier
        
        console.log(`[Enemy] ${e.name} final stats: HP ${e.hp}, ATK ${e.attack}, DEF ${e.defense}`);
        
        return {
          id: e.id,
          name: e.name,
          enemyType: (e as any).enemyType || e.name, // Preserve enemyType for sprite lookup (prevents Goblin Chief sprite mismatch)
          level: e.level,
          hp: e.hp, // Already scaled
          maxHp: e.hp, // Already scaled
          attack: e.attack, // Already scaled
          defense: e.defense, // Already scaled
          xp: e.xp,
          isBoss: e.isBoss || false,
          isDead: e.isDead || false // Ensure isDead is set (should come from generateEnemiesForCombat, but be defensive)
        };
      });

      // Make first enemy boss if boss wave
      if (isBoss && convertedEnemies.length > 0) {
        convertedEnemies[0].isBoss = true;
        convertedEnemies[0].hp = Math.floor(convertedEnemies[0].hp * 1.5);
        convertedEnemies[0].maxHp = Math.floor(convertedEnemies[0].maxHp * 1.5);
      }

      console.log(`[Adventure] ✅ Spawned ${convertedEnemies.length} enemies:`, convertedEnemies.map(e => `${e.name} (${e.hp} HP)`).join(', '));
      
      if (convertedEnemies.length === 0) {
        console.error('[Adventure] ❌ NO ENEMIES GENERATED! Skipping combat.');
        return;
      }
      
      setEnemies(convertedEnemies);
      enemiesRef.current = convertedEnemies; // Keep ref in sync
      console.log('[Adventure] 📝 Enemy state updated, refs synced');
      
      // IMPORTANT: Delay combat start to let enemy sprites appear first!
      setTimeout(() => {
        console.log('[Adventure] ⚔️ Starting combat with', convertedEnemies.length, 'enemies');
        corruptedPriestSpawnedRef.current = false; // Reset spawn flag
        corruptedPriestSpawnInProgress.current = false; // Reset spawn in-progress flag for new combat
        setInCombat(true);
      }, 500); // 500ms delay for sprites to render
    };

    startAdventure();

    // Cleanup on unmount
    return () => {
      console.log('[Adventure] Cleaning up adventure loop, interval ID:', adventureIntervalRef.current);
      if (adventureIntervalRef.current) {
        clearInterval(adventureIntervalRef.current);
        adventureIntervalRef.current = null;
      }
    };
  }, [allHeroes.length, gameMode]); // Re-run when heroes are loaded OR mode changes

  // Step 4 (UPDATED): Initiative-based combat system
  useEffect(() => {
    console.log('[Combat useEffect] Triggered!', {
      allHeroes: allHeroes?.length || 0,
      enemies: enemies?.length || 0,
      gameMode,
      inCombat
    });
    
    // Safety check + only run combat if we have heroes AND enemies (use allHeroes)
    if (!allHeroes || !enemies || allHeroes.length === 0 || enemies.length === 0) {
      console.log('[Combat] ⚠️ Cannot start - missing heroes or enemies');
      combatInProgress.current = false;
      if (combatRoundTimeoutRef.current) {
        clearTimeout(combatRoundTimeoutRef.current);
        combatRoundTimeoutRef.current = null;
      }
      return;
    }

    // Don't start new combat if already in progress
    if (combatInProgress.current) {
      console.log('[Combat] Combat already in progress, skipping duplicate start');
      return;
    }

    console.log('[Combat] ✅ Starting combat -', allHeroes.length, 'heroes vs', enemies.length, 'enemies');
    console.log('[Combat] 👥 Heroes:', allHeroes.map(h => `${h.name} (${h.role}, HP: ${h.hp}/${h.maxHp})`));
    console.log('[Combat] 👹 Enemies:', enemies.map(e => `${e.name} (HP: ${e.hp}/${e.maxHp})`));
    corruptedPriestSpawnedRef.current = false; // Reset spawn flag for new combat
    combatInProgress.current = true;

    // Start combat round (SIMPLIFIED - like enemy attacks)
    const startCombatRound = () => {
      console.log('[Combat] ===== STARTING NEW ROUND =====');
      
      // Use refs for current state (no stale closures!)
      let currentHeroes = testHealer ? [...heroesRef.current, testHealer] : heroesRef.current;
      const currentEnemies = enemiesRef.current;
      
      // CRITICAL: Check if all enemies are already dead before starting round
      const aliveEnemies = currentEnemies.filter(e => e.hp > 0 && !e.isDead);
      if (aliveEnemies.length === 0 && currentEnemies.length > 0) {
        console.log('[Combat] ⚠️ All enemies already dead! Skipping round and checking victory...');
        // Clear combat state and check victory
        setInCombat(false);
        combatInProgress.current = false;
        checkCombatVictory().catch(err => console.error('[Combat] Error in checkCombatVictory:', err));
        return;
      }
      
      // Also check if combat should even be running
      if (!inCombat || !combatInProgress.current) {
        console.log('[Combat] ⚠️ Combat not in progress, skipping round');
        return;
      }
      
      // Check if enemies array is empty (might happen after raid wave clear)
      if (currentEnemies.length === 0) {
        console.log('[Combat] ⚠️ No enemies in state! Clearing combat...');
        setInCombat(false);
        combatInProgress.current = false;
        return;
      }
      
      console.log(`[Combat] Current state: ${currentHeroes.length} heroes, ${currentEnemies.length} enemies`);
      
      // =============================================================
      // PHASE 0: AUTO-POTION (Use health potion if HP < 30%)
      // =============================================================
      const now = Date.now();
      
      currentHeroes.forEach(hero => {
        if (hero.isDead || hero.hp <= 0) return;
        
        const hpPercent = hero.hp / hero.maxHp;
        
        // Check if hero has potions in inventory and HP is below 30%
        const inventory = hero.inventory || [];
        const healthPotion = inventory.find((item: any) => 
          item.itemKey === 'healthpotion' || 
          item.type === 'potion' ||
          (item.name && item.name.toLowerCase().includes('health potion'))
        );
        
        if (hpPercent < 0.30 && healthPotion && hero.id) {
          console.log(`[Auto-Potion] 🧪 ${hero.name} uses Health Potion from inventory! (${hpPercent.toFixed(0)}% HP)`);
          
          // Use potion (heal 50% max HP)
          const healAmount = Math.floor(hero.maxHp * 0.5);
          const newHp = Math.min(hero.maxHp, hero.hp + healAmount);
          const actualHeal = newHp - hero.hp;
          
          // Overheal converts to shield
          const overheal = healAmount - actualHeal;
          const newShield = (hero.shield || 0) + overheal;
          
          // Remove potion from inventory
          const updatedInventory = inventory.filter((item: any) => item.id !== healthPotion.id);
          
          // Call backend API to use elixir (for quest tracking)
          // Use itemKey or itemId - backend will figure it out
          const itemIdentifier = healthPotion.itemKey || healthPotion.id;
          heroAPI.useElixir(hero.id, itemIdentifier).catch(err => {
            console.error(`[Auto-Potion] Failed to call useElixir API:`, err);
            // Non-critical - combat can continue
          });
          
          // Track HP and inventory changes for batch sync
          trackHeroStatChange(hero.id, {
            hp: Math.round(newHp)
          });
          trackInventoryChange(hero.id, updatedInventory);
          
          // Update local state immediately for combat
          setHeroes(current => {
            const updated = current.map(h => {
              if (h.id === hero.id) {
                return { ...h, hp: Math.round(newHp), shield: Math.round(newShield), inventory: updatedInventory };
              }
              return h;
            });
            heroesRef.current = updated;
            return updated;
          });
          
          // Note: HP change is tracked via trackHeroStatChange above, will be synced in batch
          // Inventory changes are synced via Firebase listener automatically
          // Backend API call handles quest tracking
          
          // Show heal SCT
          const heroElement = document.querySelector(`[data-hero-id="${hero.id}"]`);
          if (heroElement) {
            const rect = heroElement.getBoundingClientRect();
            addSCT(`+${Math.round(actualHeal)}`, rect.left + rect.width / 2, rect.top + 20, 'heal');
            if (overheal > 0) {
              setTimeout(() => {
                addSCT(`+${overheal} Shield`, rect.left + rect.width / 2, rect.top + 40, 'loot');
              }, 200);
            }
          }
        }
      });
      
      // =============================================================
      // PHASE 1: PROCESS DoT/HoT (Damage/Healing Over Time)
      // =============================================================
      
      // Process HERO debuffs (take DoT damage)
      currentHeroes.forEach(hero => {
        if (!hero || !hero.activeDebuffs || hero.isDead || hero.hp <= 0) return;
        
        Object.keys(hero.activeDebuffs).forEach(debuffKey => {
          const debuff = hero.activeDebuffs![debuffKey];
          if (!debuff) return;
          
          const debuffDef = DEBUFFS[debuffKey];
          if (!debuffDef) return;
          
          // Check if expired
          if (now >= debuff.expiresAt) {
            delete hero.activeDebuffs![debuffKey];
            console.log(`[Debuff] ${hero.name} is no longer ${debuffDef.name}`);
            return;
          }
          
          // Apply damage over time
          if (debuffDef.effect === 'damageOverTime') {
            const tickRate = debuffDef.tickRate || 2000;
            const timeSinceLastTick = debuff.lastTick ? (now - debuff.lastTick) : tickRate;
            
            if (!debuff.lastTick || timeSinceLastTick >= tickRate) {
              const dotDamage = debuff.value !== undefined ? debuff.value : (debuffDef.value || 0);
              
              if (dotDamage > 0) {
                // Apply shield absorption first
                let remainingDamage = dotDamage;
                let newShield = hero.shield || 0;
                let newHp = hero.hp;
                let shieldAbsorbed = 0;
                
                if (newShield > 0) {
                  if (remainingDamage >= newShield) {
                    shieldAbsorbed = newShield;
                    remainingDamage -= newShield;
                    newShield = 0;
                    console.log(`[DoT] 🛡️ ${hero.name}'s shield absorbed ${shieldAbsorbed} DoT damage, ${remainingDamage} HP damage remains`);
                  } else {
                    shieldAbsorbed = remainingDamage;
                    newShield -= remainingDamage;
                    remainingDamage = 0;
                    console.log(`[DoT] 🛡️ ${hero.name}'s shield absorbed ${shieldAbsorbed} DoT damage`);
                  }
                }
                
                newHp = Math.max(0, newHp - remainingDamage);
                
                // Update hero state
                setHeroes(current => {
                  const updated = current.map(h => {
                    if (h.id === hero.id) {
                      const updatedHero = { ...h, hp: Math.round(newHp), shield: Math.round(newShield) };
                      
                      // Track damage blocked by shields in DoT
                      if (shieldAbsorbed > 0) {
                        if (!updatedHero.stats) {
                          updatedHero.stats = { totalDamage: 0, totalHealing: 0, damageBlocked: 0 };
                        }
                        updatedHero.stats.damageBlocked = (updatedHero.stats.damageBlocked || 0) + shieldAbsorbed;
                        // QUEST TRACKING: Track blocked damage
                        trackQuest(hero.id, 'blockDamage', shieldAbsorbed);
                      }
                      
                      return updatedHero;
                    }
                    return h;
                  });
                  heroesRef.current = updated;
                  return updated;
                });
                
                debuff.lastTick = now;
                
                // Show DoT SCT
                const heroElement = document.querySelector(`[data-hero-id="${hero.id}"]`);
                if (heroElement) {
                  const rect = heroElement.getBoundingClientRect();
                  addSCT(`${Math.floor(dotDamage)}`, rect.left + rect.width / 2, rect.top + 20, 'dot');
                }
                console.log(`[DoT] ${debuffDef.icon} ${hero.name} takes ${Math.floor(dotDamage)} ${debuffDef.name} damage`);
                
                // Check for death
                if (newHp <= 0 && !hero.isDead) {
                  hero.hp = 0;
                  hero.isDead = true;
                  hero.deathTime = now;
                  hero.activeDebuffs = {};
                  
                  const heroRef = getHeroSpriteRef(hero.id);
                  if (heroRef.current) {
                    heroRef.current.playAnimation('death');
                  }
                  
                  console.log(`[Death] 💀 ${hero.name} has been defeated by ${debuffDef.name}!`);
                }
              }
            }
          }
        });
      });
      
      // Process ENEMY debuffs (take DoT damage)
      currentEnemies.forEach(enemy => {
        if (!enemy || !enemy.activeDebuffs || enemy.isDead || enemy.hp <= 0) return;
        
        Object.keys(enemy.activeDebuffs).forEach(debuffKey => {
          const debuff = enemy.activeDebuffs![debuffKey];
          if (!debuff) return;
          
          const debuffDef = DEBUFFS[debuffKey];
          if (!debuffDef) return;
          
          // Check if expired
          if (now >= debuff.expiresAt) {
            delete enemy.activeDebuffs![debuffKey];
            console.log(`[Debuff] ${enemy.name} is no longer ${debuffDef.name}`);
            return;
          }
          
          // Apply damage over time
          if (debuffDef.effect === 'damageOverTime') {
            const tickRate = debuffDef.tickRate || 2000;
            const timeSinceLastTick = debuff.lastTick ? (now - debuff.lastTick) : tickRate;
            
            if (!debuff.lastTick || timeSinceLastTick >= tickRate) {
              const dotDamage = debuff.value !== undefined ? debuff.value : (debuffDef.value || 0);
              
              if (dotDamage > 0) {
                // Apply defense mitigation
                const mitigatedDamage = dotDamage / (1 + (enemy.defense || 0) / 250);
                const minDamage = Math.max(1, dotDamage * 0.25);
                const actualDamage = Math.max(minDamage, Math.floor(mitigatedDamage));
                
                // Apply damage
                setEnemies(current => {
                  const updated = current.map(e => {
                    if (e.id === enemy.id) {
                      const newHp = Math.round(Math.max(0, e.hp - actualDamage));
                      const died = newHp === 0 && !e.isDead;
                      return { ...e, hp: newHp, isDead: died || e.isDead };
                    }
                    return e;
                  });
                  enemiesRef.current = updated;
                  return updated;
                });
                
                debuff.lastTick = now;
                
                // Show DoT SCT on enemy
                const enemyElement = document.querySelector(`[data-enemy-id="${enemy.id}"]`);
                if (enemyElement) {
                  const rect = enemyElement.getBoundingClientRect();
                  addSCT(`${Math.floor(actualDamage)}`, rect.left + rect.width / 2, rect.top + 20, 'dot');
                }
                console.log(`[DoT] ${debuffDef.icon} ${enemy.name} takes ${actualDamage} ${debuffDef.name} damage`);
                
                // Check for death
                if (enemy.hp <= actualDamage) {
                  console.log(`[Death] ${enemy.name} defeated by ${debuffDef.name}!`);
                }
              }
            }
          }
        });
      });
        
        // Build combat actions with initiative
        const actions: CombatAction[] = [];
      
      // =============================================================
      // PHASE 2: EMERGENCY ABILITIES (Group Heal, Shield Wall)
      // =============================================================
      // GROUP HEAL (Cleric) - When 2+ heroes below 50% HP
      const injuredHeroes = currentHeroes.filter(h => !h.isDead && h.hp > 0 && (h.hp / h.maxHp) < 0.5);
      const clericHealers = currentHeroes.filter(h => h.role === 'cleric' && !h.isDead && h.hp > 0);
      
      if (injuredHeroes.length >= 2 && clericHealers.length > 0) {
        const cleric = clericHealers[0];
        const now = Date.now();
        const cooldown = cleric.cooldowns?.groupHeal || 0;
        
        if (now >= cooldown) {
          console.log(`[Group Heal] 💚 ${cleric.name} casts GROUP HEAL! (${injuredHeroes.length} heroes injured)`);
          
          // Calculate group heal amount based on cleric's stats (scaled down for AoE)
          // Healing is scaled to appropriately heal tanks (who have ~2.2x the HP of healers)
          // Base healing scales from Intellect + Wisdom (like spell power)
          const totalIntellect = cleric.intellect || 0;
          const totalWisdom = cleric.wisdom || 0;
          
          // Base heal = (Intellect * 1.0 + Wisdom * 0.5) * 5.0 (multiplier scaled for tank HP)
          // Fallback to level-based healing if no Int/Wis (scaled to heal tanks effectively)
          let baseHeal = ((totalIntellect * 1.0) + (totalWisdom * 0.5)) * 5.0;
          if (baseHeal < 1) {
            baseHeal = (cleric.level || 1) * 20; // Fallback: level * 20 (heals ~20% of tank HP at level 100)
          }
          
          // Add attack as a small bonus (10% contribution)
          baseHeal += (cleric.attack || 0) * 0.1;
          
          // Healing Power % bonus (uncapped - better gear should heal more!)
          const healingPower = cleric.healingPower || 0;
          baseHeal *= (1 + (healingPower * 0.01)); // 1% per point of healing power
          
          // Spell Damage also affects healing (healers use spell power for everything)
          const spellDamage = cleric.spellDamage || 0;
          baseHeal *= (1 + (spellDamage * 0.01)); // 1% per point of spell damage
          
          // Group heal is 60% of single target heal (AoE scaling)
          baseHeal *= 0.6;
          
          // Apply viewer bonuses if active
          if (activeChatterCount > 0) {
            const bonuses = calculateViewerBonuses();
            baseHeal = Math.floor(baseHeal * bonuses.healing);
          }
          
          const singleTargetHeal = Math.floor(baseHeal);
          
          // Heal all allies (30% of their max HP, or calculated heal, whichever is higher)
          setHeroes(current => {
            const updated = current.map(h => {
              if (h.isDead || h.hp <= 0) return h;
              
              // Use calculated heal or 30% of max HP, whichever is higher
              const percentHeal = Math.round(h.maxHp * 0.3);
              const healAmount = Math.max(singleTargetHeal, percentHeal);
              const newHp = Math.round(Math.min(h.maxHp, h.hp + healAmount));
              const actualHeal = Math.round(newHp - h.hp);
              const overheal = Math.round(healAmount - actualHeal);
              const newShield = Math.round((h.shield || 0) + overheal);
              
              // Track HP change for sync
              if (actualHeal > 0) {
                trackHeroStatChange(h.id, {
                  hp: newHp
                });
              }
              
              // Show heal effects - musical notes for bard, SCT for other healers
              const heroElement = document.querySelector(`[data-hero-id="${h.id}"]`) as HTMLElement;
              if (heroElement && actualHeal > 0) {
                // For bard, use musical notes instead of green healing text
                if (cleric.role === 'bard') {
                  console.log(`[Bard] Creating musical notes for ${h.name} (group heal)`);
                  createMusicalNoteEffect(heroElement, '#90EE90', 4); // Light green notes for healing
                } else {
                  // Other healers use standard green healing SCT
                  const rect = heroElement.getBoundingClientRect();
                  addSCT(`+${Math.round(actualHeal)}`, rect.left + rect.width / 2, rect.top + 20, 'heal');
                }
              }
              
              // Set cooldown on cleric
              if (h.id === cleric.id) {
                return { 
                  ...h, 
                  hp: newHp, 
                  shield: newShield,
                  cooldowns: { ...h.cooldowns, groupHeal: now + 30000 } // 30s cooldown
                };
              }
              
              return { ...h, hp: newHp, shield: newShield };
            });
            heroesRef.current = updated;
            return updated;
          });
          
          // Show Group Heal SCT on cleric
          const clericElement = document.querySelector(`[data-hero-id="${cleric.id}"]`);
          if (clericElement) {
            const rect = clericElement.getBoundingClientRect();
            addSCT('+Group Heal', rect.left + rect.width / 2, rect.top + 20, 'loot');
          }
        }
      }
      
      // SHIELD WALL (Guardian) - When 2+ heroes below 60% HP
      const hurtHeroes = currentHeroes.filter(h => !h.isDead && h.hp > 0 && (h.hp / h.maxHp) < 0.6);
      const guardians = currentHeroes.filter(h => h.role === 'guardian' && !h.isDead && h.hp > 0);
      
      if (hurtHeroes.length >= 2 && guardians.length > 0) {
        const guardian = guardians[0];
        const now = Date.now();
        const cooldown = guardian.cooldowns?.shieldWall || 0;
        
        if (now >= cooldown) {
          console.log(`[Shield Wall] 🛡️ ${guardian.name} activates SHIELD WALL! (30% DR for all for 10s)`);
          
          // Apply Shield Wall buff to all heroes (handled in damage calculation)
          setHeroes(current => {
            const updated = current.map(h => {
              if (h.id === guardian.id) {
                return {
                  ...h,
                  activeBuffs: { ...h.activeBuffs, shieldWall: { active: true, expiresAt: now + 10000 } },
                  cooldowns: { ...h.cooldowns, shieldWall: now + 45000 } // 45s cooldown
                };
              }
              return h;
            });
            heroesRef.current = updated;
            return updated;
          });
          
          // Show Shield Wall SCT
          const guardianElement = document.querySelector(`[data-hero-id="${guardian.id}"]`);
          if (guardianElement) {
            const rect = guardianElement.getBoundingClientRect();
            addSCT('+Shield Wall', rect.left + rect.width / 2, rect.top + 20, 'loot');
          }
        }
      }
      
      // =============================================================
      // PHASE 3: CLASS ABILITIES (Taunt, Fade, etc.)
      // =============================================================
      currentHeroes.forEach(hero => {
        if (hero.hp <= 0 || hero.isDead) return;
        
        const now = Date.now();
        
        // TAUNT (Paladin) - Auto-trigger every 15s
        if (hero.role === 'paladin' && (!hero.tauntExpiry || hero.tauntExpiry <= now)) {
          console.log(`[Taunt] 🛡️ ${hero.name} TAUNTS enemies! (10x threat for 5s)`);
          
          setHeroes(current => {
            const updated = current.map(h => 
              h.id === hero.id ? { ...h, tauntExpiry: now + 5000 } : h
            );
            heroesRef.current = updated;
            return updated;
          });
          
          // Show Taunt SCT
          const heroElement = document.querySelector(`[data-hero-id="${hero.id}"]`);
          if (heroElement) {
            const rect = heroElement.getBoundingClientRect();
            addSCT('+Taunt', rect.left + rect.width / 2, rect.top + 20, 'loot');
          }
        }
        
        // FADE (Shadow Priest) - Auto-trigger every 15s
        if (hero.role === 'shadowpriest' && (!hero.fadeExpiry || hero.fadeExpiry <= now)) {
          console.log(`[Fade] 🌑 ${hero.name} FADES into shadows! (0.1x threat for 5s)`);
          
          setHeroes(current => {
            const updated = current.map(h => 
              h.id === hero.id ? { ...h, fadeExpiry: now + 5000 } : h
            );
            heroesRef.current = updated;
            return updated;
          });
          
          // Show Fade SCT
          const heroElement = document.querySelector(`[data-hero-id="${hero.id}"]`);
          if (heroElement) {
            const rect = heroElement.getBoundingClientRect();
            addSCT('+Fade', rect.left + rect.width / 2, rect.top + 20, 'loot');
          }
        }
      });
      
      // Clean up expired minions first (use existing 'now' variable from startCombatRound)
      const expiredMinions = currentHeroes.filter(h => (h as any).isMinion && (h as any).minionExpiresAt && (h as any).minionExpiresAt < now);
      if (expiredMinions.length > 0) {
        console.log(`[Combat] 🕐 ${expiredMinions.length} skeleton minion(s) expired`);
        setHeroes(current => {
          const updated = current.filter(h => !(h as any).isMinion || !(h as any).minionExpiresAt || (h as any).minionExpiresAt >= now);
          heroesRef.current = updated;
          return updated;
        });
        // Refresh currentHeroes after cleanup
        const updatedHeroes = testHealer ? [...heroesRef.current, testHealer] : heroesRef.current;
        currentHeroes = updatedHeroes;
      }
      
      // Hero actions (can have multiple actions if Swift procs!)
      currentHeroes.forEach(hero => {
        if (hero.hp <= 0 || hero.isDead) {
          console.log(`[Combat] Skipping ${hero.name} - dead`);
          return;
        }
        
        // Skip expired minions
        if ((hero as any).isMinion && (hero as any).minionExpiresAt && (hero as any).minionExpiresAt < now) {
          return;
        }
        
        // Check for STUNNED debuff
        if (hero.activeDebuffs?.stunned) {
          console.log(`[Combat] 💫 ${hero.name} is STUNNED and cannot act!`);
          return; // Skip turn
        }

        const dexterity = Math.floor(hero.level / 5);
        const initiative = Math.floor(Math.random() * 20) + 1 + dexterity;
        
        // Check for Swift proc (10% chance for extra attack)
        const swiftProc = Math.random() < 0.10;
        const numAttacks = swiftProc ? 2 : 1;
        
        if (swiftProc) {
          console.log(`[Combat] ⚡ SWIFT! ${hero.name} gets an extra attack!`);
        }

        // HEALER LOGIC: Check if hero is healer and if healing is needed
        if (isHealerRole(hero.role)) {
          // Find ally with lowest HP % (below 85% for raids, 70% for idle)
          const healThreshold = (gameMode === 'raid' || gameMode === 'dungeon') ? 0.85 : 0.70;
          const injuredAllies = currentHeroes.filter(h => 
            !h.isDead && 
            h.hp > 0 && 
            (h.hp / h.maxHp) < healThreshold
          );
          
          // Find dead allies that can be resurrected
          const deadAllies = currentHeroes.filter(h => h.isDead || h.hp <= 0);
          
          // RESURRECTION: If no one needs healing but there are dead allies, resurrect one
          if (injuredAllies.length === 0 && deadAllies.length > 0) {
            const resurrectTarget = deadAllies[0]; // Resurrect first dead hero
            console.log(`[Resurrection] ✨ ${hero.name} casts RESURRECT on ${resurrectTarget.name}!`);
            
            actions.push({
              type: 'resurrect', // Special type for resurrection
              actorId: hero.id,
              actorName: hero.name,
              targetId: resurrectTarget.id,
              targetName: resurrectTarget.name,
              initiative,
              isHero: true
            } as any);
            return; // Healer resurrects instead of attacking
          }
          
          if (injuredAllies.length > 0) {
            // SMART HEALING PRIORITY:
            // 1. EMERGENCY: Tanks below 50% HP
            const emergencyTanks = injuredAllies.filter(h => 
              isTankRole(h.role) && (h.hp / h.maxHp) < 0.50
            );
            
            // 2. CRITICAL: Anyone below 30% HP
            const criticalAllies = injuredAllies.filter(h => 
              (h.hp / h.maxHp) < 0.30
            );
            
            // 3. NORMAL: Lowest HP %
            let healTarget;
            let healPriority = 'NORMAL';
            
            if (emergencyTanks.length > 0) {
              // Emergency: Heal tank with lowest HP %
              healTarget = emergencyTanks.reduce((lowest, h) => 
                (h.hp / h.maxHp) < (lowest.hp / lowest.maxHp) ? h : lowest
              );
              healPriority = 'EMERGENCY TANK';
            } else if (criticalAllies.length > 0) {
              // Critical: Heal ally with lowest HP %
              healTarget = criticalAllies.reduce((lowest, h) => 
                (h.hp / h.maxHp) < (lowest.hp / lowest.maxHp) ? h : lowest
              );
              healPriority = 'CRITICAL';
            } else {
              // Normal: Heal ally with lowest HP %
              healTarget = injuredAllies.reduce((lowest, h) => 
                (h.hp / h.maxHp) < (lowest.hp / lowest.maxHp) ? h : lowest
              );
            }
            
            console.log(`[Combat] ${hero.name} will HEAL ${healTarget.name} (${Math.floor((healTarget.hp / healTarget.maxHp) * 100)}% HP) [${healPriority}]`);
            
            actions.push({
              type: 'heal', // Special type for healing
              actorId: hero.id,
              actorName: hero.name,
              targetId: healTarget.id,
              targetName: healTarget.name,
              initiative,
              isHero: true
            } as any);
            return; // Healer heals instead of attacking
          }
        }

        // Attack enemy (DPS or healer with no healing needed)
        const aliveEnemies = currentEnemies.filter(e => e.hp > 0);
        if (aliveEnemies.length === 0) return;
        
        // CHAIN LIGHTNING (Shaman) - AoE if 2+ enemies
        if (hero.role === 'shaman' && aliveEnemies.length >= 2) {
          const cooldown = hero.cooldowns?.chainLightning || 0;
          if (now >= cooldown) {
            console.log(`[Chain Lightning] ⚡ ${hero.name} casts CHAIN LIGHTNING! (hits ${Math.min(3, aliveEnemies.length)} enemies)`);
            
            // Hit up to 3 enemies
            const targets = aliveEnemies.slice(0, 3);
            targets.forEach((target, index) => {
              actions.push({
                type: 'hero',
                actorId: hero.id,
                actorName: hero.name,
                targetId: target.id,
                targetName: target.name,
                initiative: initiative,
                isHero: true,
                isChainLightning: true,
                chainIndex: index // Damage reduces per jump
              } as any);
            });
            
            // Set cooldown
            setHeroes(current => {
              const updated = current.map(h => 
                h.id === hero.id ? { ...h, cooldowns: { ...h.cooldowns, chainLightning: now + 15000 } } : h
              );
              heroesRef.current = updated;
              return updated;
            });
            
            // Show Chain Lightning SCT
            const heroElement = document.querySelector(`[data-hero-id="${hero.id}"]`);
            if (heroElement) {
              const rect = heroElement.getBoundingClientRect();
              addSCT('+Chain Lightning', rect.left + rect.width / 2, rect.top + 20, 'loot');
            }
            
            return; // Used ability instead of normal attack
          }
        }
        
        // RAISE DEAD (Necromancer) - Summon skeleton minion
        if (hero.role === 'necromancer') {
          const cooldown = hero.cooldowns?.raiseDead || 0;
          const existingMinions = heroesRef.current.filter(h => (h as any).isMinion && (h as any).summonerId === hero.id);
          
          // Can summon if cooldown ready and no existing minion (max 1 minion at a time)
          if (now >= cooldown && existingMinions.length === 0) {
            console.log(`[Raise Dead] 💀 ${hero.name} summons a Skeleton Warrior!`);
            
            // Randomly choose Yellow or White skeleton
            const skeletonType = Math.random() < 0.5 ? 'Yellow' : 'White';
            const skeletonId = `skeleton-minion-${hero.id}-${Date.now()}`;
            
            // Create skeleton minion with 40% of necromancer's attack
            const skeletonAttack = Math.floor((hero.attack || hero.level * 8) * 0.4);
            const skeletonHp = Math.floor((hero.maxHp || 100) * 0.3); // 30% of necromancer's HP
            const skeletonMaxHp = skeletonHp;
            
            const skeletonMinion: Hero = {
              id: skeletonId,
              name: `Skeleton Warrior`,
              role: `skeleton-minion-${skeletonType.toLowerCase()}` as any, // Use special role for sprite lookup
              level: hero.level,
              hp: skeletonMaxHp,
              maxHp: skeletonMaxHp,
              attack: skeletonAttack,
              defense: Math.floor((hero.defense || 0) * 0.2), // 20% of necromancer's defense
              xp: 0,
              maxXp: 100,
              equipment: {},
              skills: {},
              isDead: false,
              currentBattlefieldId: hero.currentBattlefieldId,
              // Minion-specific properties
              isMinion: true,
              summonerId: hero.id,
              skeletonType: skeletonType, // Store type for sprite lookup
              minionExpiresAt: now + 30000 // Minion lasts 30 seconds
            } as any;
            
            // Add skeleton to heroes array
            setHeroes(current => {
              const updated = [...current, skeletonMinion];
              heroesRef.current = updated;
              return updated;
            });
            
            // Set cooldown (70 seconds)
            setHeroes(current => {
              const updated = current.map(h => 
                h.id === hero.id ? { ...h, cooldowns: { ...h.cooldowns, raiseDead: now + 70000 } } : h
              );
              heroesRef.current = updated;
              return updated;
            });
            
            // Show Raise Dead SCT
            const heroElement = document.querySelector(`[data-hero-id="${hero.id}"]`);
            if (heroElement) {
              const rect = heroElement.getBoundingClientRect();
              addSCT('+Raise Dead', rect.left + rect.width / 2, rect.top + 20, 'loot');
            }
            
            // Don't return - necromancer still attacks this turn, minion will act next round
          }
        }
        
        // WHIRLWIND (Berserker) - AoE if 2+ enemies
        if (hero.role === 'berserker' && aliveEnemies.length >= 2) {
          const cooldown = hero.cooldowns?.whirlwind || 0;
          if (now >= cooldown) {
            console.log(`[Whirlwind] 🌪️ ${hero.name} uses WHIRLWIND! (hits all ${aliveEnemies.length} enemies)`);
            
            // Hit ALL enemies for 70% damage
            aliveEnemies.forEach(target => {
              actions.push({
                type: 'hero',
                actorId: hero.id,
                actorName: hero.name,
                targetId: target.id,
                targetName: target.name,
                initiative: initiative,
                isHero: true,
                isWhirlwind: true // 70% damage modifier
              } as any);
            });
            
            // Set cooldown
            setHeroes(current => {
              const updated = current.map(h => 
                h.id === hero.id ? { ...h, cooldowns: { ...h.cooldowns, whirlwind: now + 20000 } } : h
              );
              heroesRef.current = updated;
              return updated;
            });
            
            // Show Whirlwind SCT
            const heroElement = document.querySelector(`[data-hero-id="${hero.id}"]`);
            if (heroElement) {
              const rect = heroElement.getBoundingClientRect();
              addSCT('+Whirlwind', rect.left + rect.width / 2, rect.top + 20, 'loot');
            }
            
            return; // Used ability instead of normal attack
          }
        }
        
        const target = aliveEnemies[0];

        // Add attack actions (1 or 2 if Swift proc)
        for (let i = 0; i < numAttacks; i++) {
          actions.push({
            type: 'hero',
            actorId: hero.id,
            actorName: hero.name,
            targetId: target.id,
            targetName: target.name,
            initiative: initiative - i, // Slightly lower initiative for 2nd attack
            isHero: true
          });
        }
      });

      // Enemy actions (RAID/DUNGEON: 30% chance for double attack!)
      // Filter out dead enemies first
      const aliveEnemiesForActions = currentEnemies.filter(e => e.hp > 0 && !e.isDead);
      if (aliveEnemiesForActions.length === 0 && currentEnemies.length > 0) {
        console.log('[Combat] ⚠️ All enemies dead during action generation! Ending combat...');
        setInCombat(false);
        combatInProgress.current = false;
        checkCombatVictory().catch(err => console.error('[Combat] Error in checkCombatVictory:', err));
        return;
      }
      
      aliveEnemiesForActions.forEach(enemy => {

        // More random initiative for chaos in raids/dungeons
        const baseDex = gameMode === 'raid' || gameMode === 'dungeon' 
          ? Math.floor(Math.random() * 11) // 0-10 random
          : 5; // Fixed 5 in idle
        const initiative = Math.floor(Math.random() * 20) + 1 + baseDex;

        // Target hero based on THREAT (tanks most likely, healers least likely)
        const target = selectTargetByThreat(currentHeroes);
        if (!target) {
          console.log(`[Combat] ${enemy.name} has no valid target`);
          return;
        }
        
        // Log threat targeting for tanks (to verify it's working)
        if (isTankRole(target.role)) {
          const hpPercent = target.hp > 0 && target.maxHp > 0 ? (target.hp / target.maxHp) * 100 : 100;
          const threatMultiplier = hpPercent < 50 ? 100 : 20; // 5x base threat if below 50% HP
          console.log(`[Combat] ${enemy.name} targeting tank ${target.name} (${threatMultiplier}x threat, ${Math.floor(hpPercent)}% HP)`);
        }

        // CORRUPTED HIGH PRIEST: Special AOE shadow damage ability (40% chance)
        const isCorruptedHighPriest = enemy.enemyType === 'Corrupted High Priest' || enemy.name === 'Corrupted High Priest';
        if (isCorruptedHighPriest && Math.random() < 0.40) {
          // AOE attack hits all heroes
          console.log(`[Combat] 🌑 ${enemy.name} casts AOE Shadow Damage!`);
          actions.push({
            type: 'enemy',
            actorId: enemy.id,
            actorName: enemy.name,
            targetId: 'all', // Special target ID for AOE
            targetName: 'All Heroes',
            initiative: initiative,
            isHero: false,
            isAOE: true // Flag for AOE attack
          });
        } else {
          // RAID/DUNGEON DIFFICULTY: 30% chance for DOUBLE ATTACK!
          const numAttacks = (gameMode === 'raid' || gameMode === 'dungeon') && Math.random() < 0.30 ? 2 : 1;
          
          if (numAttacks === 2) {
            console.log(`[Combat] 💥 ${enemy.name} gets DOUBLE ATTACK!`);
          }

          for (let i = 0; i < numAttacks; i++) {
            actions.push({
              type: 'enemy',
              actorId: enemy.id,
              actorName: enemy.name,
              targetId: target.id,
              targetName: target.name,
              initiative: initiative - i, // Slightly lower for 2nd attack
              isHero: false
            });
          }
        }
      });

      // Sort by initiative
      actions.sort((a, b) => b.initiative - a.initiative);

      console.log('[Combat] Initiative order:', actions.map(a => `${a.actorName} (${a.initiative})`).join(' → '));

      if (actions.length === 0) {
        console.log('[Combat] No valid actions, ending combat');
        checkCombatVictory().catch(err => console.error('[Combat] Error in checkCombatVictory:', err));
        return;
      }

      // Execute actions SEQUENTIALLY - wait for animations to complete
      let delay = 0;
      actions.forEach((action, index) => {
        setTimeout(() => {
          console.log(`[Combat] Executing ${index + 1}/${actions.length}: ${action.actorName} → ${action.targetName}`);
          if (action.type === 'heal') {
            executeHeal(action);
          } else if (action.type === 'resurrect') {
            executeResurrect(action);
          } else if (action.type === 'hero') {
            executeHeroAttack(action);
          } else {
            executeEnemyAttack(action);
          }
        }, delay);
        delay += 2500; // 2.5s between actions (ensures animations complete)
        // Timing: Attack (1000ms) + Hurt (500ms) + Buffer (1000ms) = 2500ms
      });

      // Check victory after all actions complete
      const totalDelay = actions.length * 2500 + 1000; // 2.5s per action + 1s buffer
      console.log(`[Combat] Will check victory in ${totalDelay}ms`);
      combatRoundTimeoutRef.current = setTimeout(() => {
        checkCombatVictory().catch(err => console.error('[Combat] Error in checkCombatVictory:', err));
      }, totalDelay);
    };

    // Execute heal action (HEALERS)
    const executeHeal = (action: CombatAction) => {
      const allCurrentHeroes = testHealer ? [...heroesRef.current, testHealer] : heroesRef.current;
      const healer = allCurrentHeroes.find(h => h.id === action.actorId);
      
      if (!healer) {
        console.warn('[Heal] Healer not found');
        return;
      }
      
      // RE-CHECK HEAL TARGET RIGHT BEFORE CASTING
      // Other healers may have already healed the original target!
      const injuredAllies = allCurrentHeroes.filter(h => h.hp > 0 && h.hp < h.maxHp && !h.isDead);
      
      if (injuredAllies.length === 0) {
        console.log(`[Heal] ${healer.name} has no one to heal - all heroes at full HP!`);
        return; // No one needs healing anymore
      }
      
      // SMART HEALING PRIORITY (re-evaluate current state):
      // 1. EMERGENCY: Tanks below 50% HP
      const isTankRole = (role: string) => ['guardian', 'paladin', 'warden', 'bloodknight', 'vanguard', 'brewmaster'].includes(role);
      const emergencyTanks = injuredAllies.filter(h => 
        isTankRole(h.role) && (h.hp / h.maxHp) < 0.50
      );
      
      // 2. CRITICAL: Anyone below 30% HP
      const criticalAllies = injuredAllies.filter(h => 
        (h.hp / h.maxHp) < 0.30
      );
      
      // 3. NORMAL: Lowest HP %
      let target;
      let healPriority = 'NORMAL';
      
      if (emergencyTanks.length > 0) {
        // Emergency: Heal tank with lowest HP %
        target = emergencyTanks.reduce((lowest, h) => 
          (h.hp / h.maxHp) < (lowest.hp / lowest.maxHp) ? h : lowest
        );
        healPriority = 'EMERGENCY TANK';
      } else if (criticalAllies.length > 0) {
        // Critical: Heal ally with lowest HP %
        target = criticalAllies.reduce((lowest, h) => 
          (h.hp / h.maxHp) < (lowest.hp / lowest.maxHp) ? h : lowest
        );
        healPriority = 'CRITICAL';
      } else {
        // Normal: Heal ally with lowest HP %
        target = injuredAllies.reduce((lowest, h) => 
          (h.hp / h.maxHp) < (lowest.hp / lowest.maxHp) ? h : lowest
        );
      }
      
      const originalTargetId = action.targetId;
      if (originalTargetId !== target.id) {
        console.log(`[Heal] 🔄 ${healer.name} RETARGETS from ${action.targetName} to ${target.name} (${Math.floor((target.hp / target.maxHp) * 100)}% HP) [${healPriority}]`);
      } else {
        console.log(`[Heal] ${healer.name} heals ${target.name} (${Math.floor((target.hp / target.maxHp) * 100)}% HP) [${healPriority}]`);
      }
      
      // Calculate heal amount (based on healer's intellect, wisdom, healing power, spell damage)
      // Healing is scaled to appropriately heal tanks (who have ~2.2x the HP of healers)
      // Base healing scales from Intellect + Wisdom (like spell power)
      // Intellect is primary (1.0x), Wisdom is secondary (0.5x), similar to caster damage
      const totalIntellect = healer.intellect || 0;
      const totalWisdom = healer.wisdom || 0;
      
      // Base heal = (Intellect * 1.0 + Wisdom * 0.5) * 5.0 (multiplier scaled for tank HP)
      // Fallback to level-based healing if no Int/Wis (scaled to heal tanks effectively)
      let baseHeal = ((totalIntellect * 1.0) + (totalWisdom * 0.5)) * 5.0;
      if (baseHeal < 1) {
        baseHeal = (healer.level || 1) * 20; // Fallback: level * 20 (heals ~20% of tank HP at level 100)
      }
      
      // Add attack as a small bonus (10% contribution) - healers still have some physical capability
      baseHeal += (healer.attack || 0) * 0.1;
      
      // Healing Power % bonus (uncapped - better gear should heal more!)
      const healingPower = healer.healingPower || 0;
      baseHeal *= (1 + (healingPower * 0.01)); // 1% per point of healing power
      
      // Spell Damage also affects healing (healers use spell power for everything)
      const spellDamage = healer.spellDamage || 0;
      baseHeal *= (1 + (spellDamage * 0.01)); // 1% per point of spell damage
      
      // Apply ACTIVE CHATTER BONUS (+1% healing per active chatter)
      if (activeChatterCount > 0) {
        const bonuses = calculateViewerBonuses();
        baseHeal = Math.floor(baseHeal * bonuses.healing);
        console.log(`[Viewer Bonus] 👥 ${activeChatterCount} chatters → ${((bonuses.healing - 1) * 100).toFixed(0)}% healing bonus`);
      }
      
      // Check for Divine Grace proc (30% chance for 2x healing)
      let divineGraceActive = false;
      if (Math.random() < 0.30) {
        divineGraceActive = true;
        baseHeal *= 2;
        console.log(`[Divine Grace] ✨ ${healer.name} procs DIVINE GRACE! (2x healing)`);
        
        // Show Divine Grace SCT
        const healerElement = document.querySelector(`[data-hero-id="${healer.id}"]`);
        if (healerElement) {
          const rect = healerElement.getBoundingClientRect();
          addSCT('+Divine Grace', rect.left + rect.width / 2, rect.top + 20, 'loot');
        }
      }
      
      // CHECK HEALER EQUIPMENT PROCS (Blessed, etc.)
      if (healer.equipment) {
        Object.values(healer.equipment).forEach((item: any) => {
          if (!item || !item.procEffects) return;
          
          item.procEffects.forEach((proc: any) => {
            if (Math.random() < proc.chance) {
              // Blessed: +30% healing
              if (proc.effect === 'healingBoost') {
                baseHeal *= (1 + proc.value);
                console.log(`[Proc] ✨ ${healer.name}'s ${proc.name} procs! (+${(proc.value * 100).toFixed(0)}% healing)`);
                
                const healerElement = document.querySelector(`[data-hero-id="${healer.id}"]`);
                if (healerElement) {
                  const rect = healerElement.getBoundingClientRect();
                  setTimeout(() => addSCT(`+${proc.name}`, rect.left + rect.width / 2, rect.top + 40, 'loot'), 100);
                }
              }
            }
          });
        });
      }
      
      let healAmount = Math.floor(baseHeal);
      
      // Check for CURSED debuff on target (-50% healing received)
      if (target.activeDebuffs?.cursed) {
        healAmount = Math.floor(healAmount * 0.5);
        console.log(`[Cursed] 😈 ${target.name} is Cursed! Healing reduced by 50%`);
      }
      
      console.log(`[Heal] ${healer.name} heals ${target.name} for ${healAmount}`);
      
      // QUEST TRACKING: Track healing done
      trackQuest(healer.id, 'healAmount', healAmount);
      
      // Play heal animation (attack animation for healers)
      const healerRef = getHeroSpriteRef(healer.id);
      if (healerRef.current) {
        console.log(`[Animation] ${healer.name} → attack (heal cast)`);
        healerRef.current.playAnimation('attack');
      }
      
      // Check if target was dead before healing (for animation fix)
      const wasDeadBeforeHeal = target.isDead || target.hp <= 0;
      const newHpAfterHeal = Math.min(target.maxHp, (target.hp > 0 ? target.hp : 0) + healAmount);
      
      // Apply healing with overheal → shield conversion
      setHeroes(current => {
        const updated = current.map(h => {
          if (h.id === target.id) {
            // CRITICAL: If hero was dead but is being healed, clear isDead flag
            const wasDead = h.isDead || h.hp <= 0;
            const newHp = Math.min(h.maxHp, (h.hp > 0 ? h.hp : 0) + healAmount);
            const actualHeal = newHp - (h.hp > 0 ? h.hp : 0);
            const overheal = healAmount - actualHeal;
            const newShield = (h.shield || 0) + overheal;
            
            // Clear isDead flag if hero was dead and now has HP
            return { 
              ...h, 
              hp: newHp, 
              shield: newShield,
              isDead: wasDead && newHp > 0 ? false : h.isDead // Clear isDead if was dead and now has HP
            };
          }
          return h;
        });
        heroesRef.current = updated;
        return updated;
      });
      
      // FIX: Move animation call OUTSIDE setHeroes callback, after state update
      // Check if target was dead and is now alive
      if (wasDeadBeforeHeal && newHpAfterHeal > 0) {
        console.log(`[Heal] ✨ ${target.name} was dead but healed to ${newHpAfterHeal} HP - triggering animation`);
        
        // Use setTimeout to ensure state has updated and sprite ref is ready
        setTimeout(() => {
          const targetRef = getHeroSpriteRef(target.id);
          if (targetRef.current) {
            try {
              targetRef.current.playAnimation('idle');
              console.log(`[Heal] 🎬 ${target.name} returned to idle animation`);
            } catch (err) {
              console.warn(`[Heal] ⚠️ Could not play idle animation for ${target.name}:`, err);
            }
          } else {
            console.warn(`[Heal] ⚠️ Sprite ref not found for ${target.name}`);
          }
        }, 100); // Small delay to ensure state update completes
      }
      
      // Show heal effects - musical notes for bard, SCT for other healers
      const targetElement = document.querySelector(`[data-hero-id="${target.id}"]`) as HTMLElement;
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const actualHeal = Math.round(Math.min(healAmount, target.maxHp - target.hp));
        const overheal = Math.round(healAmount - actualHeal);
        
        // For bard, use musical notes instead of green healing text
        if (healer.role === 'bard') {
          console.log(`[Bard] Creating musical notes for ${target.name} (healing)`);
          createMusicalNoteEffect(targetElement, '#90EE90', 4); // Light green notes for healing
        } else {
          // Other healers use standard green healing SCT
          // Main heal number (round for display)
          addSCT(`+${Math.round(healAmount)}`, rect.left + rect.width / 2, rect.top + 20, 'heal');
          
          // Multiple "+" particles for visual flair (like idle!)
          for (let i = 0; i < 5; i++) {
            setTimeout(() => {
              const offsetX = (Math.random() - 0.5) * 60;
              const offsetY = (Math.random() - 0.5) * 30;
              addSCT('+', rect.left + rect.width / 2 + offsetX, rect.top + 10 + offsetY, 'heal');
            }, i * 80);
          }
          
          // Green flash on hero (like idle!)
          const heroSpriteWrapper = targetElement.querySelector('div[style*="inline-block"]');
          if (heroSpriteWrapper) {
            const spriteDiv = heroSpriteWrapper as HTMLDivElement;
            const originalFilter = spriteDiv.style.filter;
            spriteDiv.style.filter = 'brightness(1.8) saturate(1.5) drop-shadow(0 0 30px rgba(16, 185, 129, 1))';
            setTimeout(() => {
              spriteDiv.style.filter = originalFilter;
            }, 500);
          }
        }
        
        // Show shield SCT for overheal (both bard and other healers)
        if (overheal > 0) {
          setTimeout(() => {
            addSCT(`+${Math.round(overheal)} Shield`, rect.left + rect.width / 2, rect.top + 40, 'loot');
          }, 300);
        }
      }
    };

    // Execute resurrection action (HEALERS)
    const executeResurrect = (action: CombatAction) => {
      const allCurrentHeroes = testHealer ? [...heroesRef.current, testHealer] : heroesRef.current;
      const healer = allCurrentHeroes.find(h => h.id === action.actorId);
      const target = allCurrentHeroes.find(h => h.id === action.targetId);
      
      if (!healer || !target) {
        console.warn('[Resurrection] Healer or target not found');
        return;
      }
      
      // Only resurrect if target is actually dead
      if (!target.isDead && target.hp > 0) {
        console.log(`[Resurrection] ${target.name} is already alive, skipping resurrect`);
        return;
      }
      
      console.log(`[Resurrection] ✨ ${healer.name} resurrects ${target.name}!`);
      
      // Calculate resurrection HP (50% of max HP)
      const resurrectHp = Math.round(target.maxHp * 0.5);
      
      // Play heal animation (attack animation for healers)
      const healerRef = getHeroSpriteRef(healer.id);
      if (healerRef.current) {
        console.log(`[Animation] ${healer.name} → attack (resurrection cast)`);
        healerRef.current.playAnimation('attack');
      }
      
      // Apply resurrection
      setHeroes(current => {
        const updated = current.map(h => {
          if (h.id === target.id) {
            return { 
              ...h, 
              hp: resurrectHp, 
              isDead: false,
              shield: 0, // Clear shield on resurrection
              activeDebuffs: {} // Clear debuffs on resurrection
            };
          }
          return h;
        });
        heroesRef.current = updated;
        return updated;
      });
      
      // Play idle animation for resurrected hero
      const targetRef = getHeroSpriteRef(target.id);
      if (targetRef.current) {
        targetRef.current.playAnimation('idle');
      }
      
      // Show resurrection SCT
      const targetElement = document.querySelector(`[data-hero-id="${target.id}"]`);
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        addSCT(`✨ RESURRECTED`, rect.left + rect.width / 2, rect.top + 20, 'heal');
        setTimeout(() => {
          addSCT(`+${resurrectHp} HP`, rect.left + rect.width / 2, rect.top + 40, 'heal');
        }, 200);
      }
      
      console.log(`[Resurrection] ✅ ${target.name} resurrected with ${resurrectHp} HP`);
    };

    // Execute hero attack
    const executeHeroAttack = (action: CombatAction) => {
      // Get hero from current state (use refs to avoid stale closure)
      const allCurrentHeroes = testHealer ? [...heroesRef.current, testHealer] : heroesRef.current;
      const hero = allCurrentHeroes.find(h => h.id === action.actorId);
      if (!hero) {
        console.warn('[Combat] Hero not found for attack:', action.actorId);
        return;
      }
      
      // Check if target is already dead (killed earlier in this round)
      const currentEnemies = enemiesRef.current;
      const targetCheck = currentEnemies.find(e => e.id === action.targetId);
      
      // If original target is dead, retarget to another alive enemy!
      if (!targetCheck || targetCheck.hp <= 0 || targetCheck.isDead) {
        const aliveEnemies = currentEnemies.filter(e => e.hp > 0 && !e.isDead);
        
        if (aliveEnemies.length > 0) {
          // Retarget to first alive enemy
          const newTarget = aliveEnemies[0];
          console.log(`[Combat] 🎯 RETARGET! ${hero.name} switches from ${action.targetName} (dead) → ${newTarget.name}`);
          action.targetId = newTarget.id;
          action.targetName = newTarget.name;
        } else {
          console.log(`[Combat] ⏭️ Skipping ${hero.name}'s attack - all enemies dead!`);
          return; // All enemies dead, skip
        }
      }

      // Calculate damage ONCE outside of setState (PROPER FORMULA with stat scaling)
      let baseDamage = hero.attack || (hero.level * 5);
      
      // Apply ACTIVE CHATTER BONUS (+1% damage per active chatter)
      if (activeChatterCount > 0) {
        const bonuses = calculateViewerBonuses();
        baseDamage = Math.floor(baseDamage * bonuses.damage);
      }
      
      // Apply Attack Buff (+10% ATK)
      if (hero.shopBuffs?.attackBuff && hero.shopBuffs.attackBuff.remainingDuration > 0) {
        baseDamage = Math.floor(baseDamage * 1.10);
        console.log(`[Attack Buff] ⚡ ${hero.name} gets +10% attack from buff!`);
      }
      
      // Determine role categories
      const isMeleeRole = ['berserker', 'crusader', 'assassin', 'reaper', 'bladedancer', 'monk', 'stormwarrior', 'hunter'].includes(hero.role);
      const isCasterRole = ['mage', 'warlock', 'elementalist', 'necromancer', 'sorcerer', 'pyromancer', 'ranger', 'shadowpriest', 'mooncaller', 'stormcaller', 'firemage', 'frostmage', 'dragonsorcerer'].includes(hero.role);
      const isHealerRole = ['cleric', 'atoner', 'druid', 'lightbringer', 'shaman', 'mistweaver', 'chronomancer', 'bard'].includes(hero.role);
      const isTank = isTankRole(hero.role);
      
      // Check if hero uses projectiles (all ranged heroes + healers)
      const spellcasters = ['mage', 'warlock', 'necromancer', 'firemage', 'frostmage', 'dragonsorcerer', 'ranger', 'shadowpriest', 'mooncaller', 'stormcaller'];
      const healers = ['cleric', 'atoner', 'druid', 'lightbringer', 'shaman', 'mistweaver', 'chronomancer', 'bard'];
      const usesProjectile = spellcasters.includes(hero.role.toLowerCase()) || healers.includes(hero.role.toLowerCase());
      
      // Apply stat scaling based on role
      if (isMeleeRole) {
        // Melee DPS: Use Attack + Strength + Dexterity + Melee Damage
        const cappedStr = Math.min(hero.strength || 0, 100);
        const cappedDex = Math.min(hero.dexterity || 0, 50);
        const strengthBonus = 1 + (cappedStr * 0.01);
        const dexBonus = 1 + (cappedDex * 0.005);
        baseDamage *= strengthBonus * dexBonus;
        const cappedMeleeDmg = Math.min(hero.meleeDamage || 0, 30);
        baseDamage *= (1 + (cappedMeleeDmg * 0.01));
      } else if (isCasterRole || isHealerRole) {
        // Casters AND Healers: Use Intellect + Wisdom + Spell Damage
        // Healers should use spell power for damage (they're spellcasters too!)
        const cappedInt = Math.min(hero.intellect || 0, 100);
        const cappedWis = Math.min(hero.wisdom || 0, 50);
        const intBonus = 1 + (cappedInt * 0.01);
        const wisBonus = 1 + (cappedWis * 0.005);
        baseDamage *= intBonus * wisBonus;
        // Healers use spell damage (melee damage is filtered out for them)
        const cappedSpellDmg = Math.min(hero.spellDamage || 0, 30);
        baseDamage *= (1 + (cappedSpellDmg * 0.01));
      } else if (isTank) {
        // Tanks: Use Attack + Strength (for threat generation)
        const cappedStr = Math.min(hero.strength || 0, 100);
        const strengthBonus = 1 + (cappedStr * 0.005);
        baseDamage *= strengthBonus;
      }
      
      const damageMultiplier = 1 + ((hero.damageMultiplier || 0) / 100);
      baseDamage *= damageMultiplier;
      
      // Check for WEAKENED debuff (-30% damage)
      if (hero.activeDebuffs?.weaken) {
        baseDamage *= 0.7;
        console.log(`[Debuff] 💔 ${hero.name} is Weakened (-30% damage)`);
      }
      
      // CHECK EQUIPMENT PROC EFFECTS (Vicious, Brutal, etc.)
      if (hero.equipment) {
        Object.values(hero.equipment).forEach((item: any) => {
          if (!item || !item.procEffects) return;
          
          item.procEffects.forEach((proc: any) => {
            if (Math.random() < proc.chance) {
              // Vicious: +12% damage
              if (proc.effect === 'damageBoost') {
                baseDamage *= (1 + proc.value);
                console.log(`[Proc] 💫 ${hero.name}'s ${proc.name} procs! (+${(proc.value * 100).toFixed(0)}% damage)`);
                
                const heroElement = document.querySelector(`[data-hero-id="${hero.id}"]`);
                if (heroElement) {
                  const rect = heroElement.getBoundingClientRect();
                  setTimeout(() => addSCT(`+${proc.name}`, rect.left + rect.width / 2, rect.top + 40, 'loot'), 100);
                }
              }
              
              // Brutal: +25% damage vs <30% HP enemies
              if (proc.effect === 'executeDamage') {
                const targetEnemy = enemiesRef.current.find(e => e.id === action.targetId);
                if (targetEnemy && (targetEnemy.hp / targetEnemy.maxHp) < 0.30) {
                  baseDamage *= (1 + proc.value);
                  console.log(`[Proc] ⚔️ ${hero.name}'s ${proc.name} procs vs low HP! (+${(proc.value * 100).toFixed(0)}% damage)`);
                }
              }
            }
          });
        });
      }
      
      // ENRAGE (Berserker): +40% damage when enemy below 35% HP
      const targetEnemy = enemiesRef.current.find(e => e.id === action.targetId);
      if (targetEnemy && hero.role === 'berserker') {
        const enemyHpPercent = targetEnemy.hp / targetEnemy.maxHp;
        const now = Date.now();
        
        // Check if already enraged (to avoid duplicate SCT)
        const isEnraged = hero.enrageExpiry && hero.enrageExpiry > now;
        
        if (enemyHpPercent <= 0.35) {
          if (!isEnraged) {
            console.log(`[Enrage] 😡 ${hero.name} ENRAGES! (+40% damage vs low HP enemy)`);
            
            // SHOW SCT FOR ENRAGE (only first time)
            const heroElement = document.querySelector(`[data-hero-id="${hero.id}"]`);
            if (heroElement) {
              const rect = heroElement.getBoundingClientRect();
              addSCT('+Enrage', rect.left + rect.width / 2, rect.top + 20, 'loot'); // Gold for buffs
            }
            
            // Set enrage duration (10 seconds)
            setHeroes(current => {
              const updated = current.map(h => 
                h.id === hero.id 
                  ? { ...h, enrageExpiry: now + 10000 }
                  : h
              );
              heroesRef.current = updated;
              return updated;
            });
          }
          
          baseDamage *= 1.4;
        }
      }
      
      const variance = baseDamage * 0.3;
      let damage = Math.round(baseDamage + (Math.random() * variance * 2) - variance);
      
      // Chain Lightning damage reduction per jump
      if ((action as any).isChainLightning) {
        const chainIndex = (action as any).chainIndex || 0;
        const chainMult = chainIndex === 0 ? 1.0 : chainIndex === 1 ? 0.7 : 0.5; // 100%, 70%, 50%
        damage = Math.floor(damage * chainMult);
        console.log(`[Chain Lightning] Jump ${chainIndex + 1}: ${chainMult * 100}% damage`);
      }
      
      // Whirlwind damage reduction (70% of normal)
      if ((action as any).isWhirlwind) {
        damage = Math.round(damage * 0.7);
        console.log(`[Whirlwind] AoE damage: 70% of normal`);
      }
      
      // Check for Critical Strike proc (30% chance for guaranteed crit on next attack)
      let criticalStrikeActive = false;
      if (hero.activeBuffs?.criticalStrike?.active) {
        criticalStrikeActive = true;
        console.log(`[Critical Strike] 💥 ${hero.name} uses saved crit!`);
        
        // Consume the buff
        setHeroes(current => {
          const updated = current.map(h => 
            h.id === hero.id 
              ? { ...h, activeBuffs: { ...h.activeBuffs, criticalStrike: { active: false } } }
              : h
          );
          heroesRef.current = updated;
          return updated;
        });
      } else if (Math.random() < 0.30) {
        // Proc Critical Strike for NEXT attack
        console.log(`[Critical Strike] 💥 ${hero.name} procs CRITICAL STRIKE! (next attack guaranteed crit)`);
        
        // SHOW SCT FOR CRITICAL STRIKE PROC
        const heroElement = document.querySelector(`[data-hero-id="${hero.id}"]`);
        if (heroElement) {
          const rect = heroElement.getBoundingClientRect();
          addSCT('+Critical Strike', rect.left + rect.width / 2, rect.top + 20, 'loot'); // Gold for buffs
        }
        
        setHeroes(current => {
          const updated = current.map(h => 
            h.id === hero.id 
              ? { ...h, activeBuffs: { ...h.activeBuffs, criticalStrike: { active: true } } }
              : h
          );
          heroesRef.current = updated;
          return updated;
        });
      }
      
      // Roll for critical hit (base 5% + gear + Critical Strike buff)
      const baseCritChance = 0.05; // 5% base crit chance
      const critChance = criticalStrikeActive ? 1.0 : (baseCritChance + (hero.critChance || 0));
      const isCrit = Math.random() < critChance;
      if (isCrit) {
        damage = Math.round(damage * 2);
        console.log(`[Combat] ⚡ CRITICAL HIT! ${hero.name} crits for ${damage}!`);
      }
      
      // QUEST TRACKING: Track damage dealt
      trackQuest(hero.id, 'dealDamage', damage);

      // ANIMATIONS - Play ONCE outside setState
      const heroRef = getHeroSpriteRef(action.actorId);
      if (heroRef.current) {
        console.log(`[Animation] ${action.actorName} → attack`);
        // Play ranged attack animation for heroes that use projectiles
        if (usesProjectile && healers.includes(hero.role.toLowerCase())) {
          heroRef.current.playAnimation('rangedAttack');
        } else {
          heroRef.current.playAnimation('attack');
        }
      }

      // Create exhaust effect for tanks on crit (Gold/Platinum only)
      if (isCrit && shouldShowExhaustEffect(hero.role, hero.spellEffect)) {
        setTimeout(() => {
          const heroElement = document.querySelector(`[data-hero-id="${hero.id}"]`) as HTMLElement;
          const targetEnemy = enemiesRef.current.find(e => e.id === action.targetId);
          
          if (heroElement && hero.spellEffect) {
            // Find enemy element to travel towards
            let enemyElement: HTMLElement | null = null;
            if (targetEnemy) {
              enemyElement = document.querySelector(`[data-enemy-id="${action.targetId}"]`) as HTMLElement;
              
              // If not found, try to find by enemy sprite ref
              if (!enemyElement) {
                const enemyRef = getEnemySpriteRef(action.targetId);
                if (enemyRef.current) {
                  enemyElement = enemyRef.current.getRef?.() || null;
                }
              }
            }
            
            // Use exhaust01 for gold, exhaust02 for platinum
            const exhaustType = hero.spellEffect === 'gold' ? 'exhaust01' : 'exhaust02';
            createExhaustEffect(heroElement, hero.spellEffect as 'gold' | 'platinum', exhaustType, enemyElement);
          }
        }, 200); // Small delay to sync with attack animation
      }

      // Create projectile for ranged heroes
      if (usesProjectile) {
        setTimeout(() => {
          const heroElement = document.querySelector(`[data-hero-id="${hero.id}"]`) as HTMLElement;
          const targetEnemy = enemiesRef.current.find(e => e.id === action.targetId);
          
          if (heroElement && targetEnemy) {
            // Find enemy element - try multiple selectors
            let enemyElement = document.querySelector(`[data-enemy-id="${action.targetId}"]`) as HTMLElement;
            
            // If not found, try to find by enemy sprite ref
            if (!enemyElement) {
              const enemyRef = getEnemySpriteRef(action.targetId);
              if (enemyRef.current) {
                enemyElement = enemyRef.current.getRef?.() || null;
              }
            }
            
            if (heroElement && enemyElement) {
              // Determine element type for mage projectiles
              let elementType: 'fire' | 'frost' | 'arcane' | undefined = undefined;
              if (hero.role.toLowerCase() === 'mage' && (hero as any).classAbilityState?.elementRotation !== undefined) {
                const rotation = (hero as any).classAbilityState.elementRotation;
                if (rotation === 0) elementType = 'fire';
                else if (rotation === 1) elementType = 'frost';
                else elementType = 'arcane';
              }
              
              createProjectile(
                heroElement,
                enemyElement,
                hero.role,
                undefined, // projectileType - auto-detected
                () => {
                  // On projectile hit - enemy hurt animation is handled by damage application
                },
                true, // isHero: true
                elementType, // elementType for mage projectiles
                (hero as any).spellEffect as any // spellEffect for founder pack tiers
              );
            }
          }
        }, 300); // Delay to sync with attack animation
      }

      // Track if debuff was applied (for SCT outside setState)
      let appliedDebuffInfo: { name: string; icon: string; targetId: string } | null = null;
      
      // Find current state of target enemy and apply damage
      setEnemies(currentEnemies => {
        const targetIndex = currentEnemies.findIndex(e => e.id === action.targetId);
        if (targetIndex === -1 || currentEnemies[targetIndex].hp <= 0) {
          return currentEnemies;
        }

        const target = currentEnemies[targetIndex];
        const updatedEnemies = [...currentEnemies];

        // Apply damage (already calculated above, outside setState)
        let remainingDamage = Math.round(damage);
        let newShield = Math.round(target.shield || 0);
        let newHp = Math.round(target.hp);

        if (newShield > 0) {
          if (remainingDamage >= newShield) {
            // Shield breaks
            remainingDamage -= newShield;
            newShield = 0;
            newHp = Math.round(Math.max(0, target.hp - remainingDamage));
            console.log(`[Combat] 🛡️ ${target.name}'s shield broke!`);
          } else {
            // Shield absorbs all
            newShield = Math.round(newShield - remainingDamage);
            console.log(`[Combat] 🛡️ Shield absorbed ${remainingDamage} damage (${newShield} remaining)`);
          }
        } else {
          newHp = Math.round(Math.max(0, target.hp - remainingDamage));
        }

        // CRITICAL: Mark as dead immediately if HP reaches 0
        const died = newHp === 0 && !target.isDead;
        updatedEnemies[targetIndex] = { ...target, hp: newHp, shield: newShield, isDead: died || target.isDead };
        
        // CORRUPTED HIGH PRIEST: Check for skeleton mage spawn at 50% HP (only once!)
        const isCorruptedHighPriest = target.enemyType === 'Corrupted High Priest' || target.name === 'Corrupted High Priest';
        if (isCorruptedHighPriest && !died) {
          // Check if mages already exist in BOTH current and updated arrays (prevents duplicate spawns)
          const existingMagesInCurrent = currentEnemies.filter(e => e.enemyType === 'Skeleton Mage' && !e.isDead);
          const existingMagesInUpdated = updatedEnemies.filter(e => e.enemyType === 'Skeleton Mage' && !e.isDead);
          const magesAlreadyExist = existingMagesInCurrent.length > 0 || existingMagesInUpdated.length > 0;
          
          // Only spawn if: flag not set, not in progress, no mages exist, and HP <= 50%
          if (!corruptedPriestSpawnedRef.current && 
              !corruptedPriestSpawnInProgress.current && 
              !magesAlreadyExist) {
            const hpPercent = (newHp / target.maxHp) * 100;
            if (hpPercent <= 50) {
              // Set flags IMMEDIATELY before any async operations to prevent concurrent spawns
              corruptedPriestSpawnedRef.current = true;
              corruptedPriestSpawnInProgress.current = true;
              
              console.log(`[Combat] 🌑 ${target.name} summons Skeleton Mages at ${hpPercent.toFixed(1)}% HP!`);
              
              // Spawn exactly 2 skeleton mages
              const numMages = 2;
              const newMages: Enemy[] = [];
              
              for (let i = 0; i < numMages; i++) {
                const mageId = `skeleton-mage-${Date.now()}-${Math.random()}-${i}`;
                const mageStats = {
                  hp: 5000,
                  attack: 100,
                  defense: 50,
                  xp: 500,
                  level: 22
                };
                
                // Apply difficulty scaling if in raid/dungeon
                const scaledHp = Math.floor(mageStats.hp * difficultyModifier);
                const scaledAttack = Math.floor(mageStats.attack * difficultyModifier);
                const scaledDefense = Math.floor(mageStats.defense * difficultyModifier);
                
                newMages.push({
                  id: mageId,
                  name: 'Skeleton Mage',
                  hp: scaledHp,
                  maxHp: scaledHp,
                  attack: scaledAttack,
                  defense: scaledDefense,
                  xp: mageStats.xp,
                  level: mageStats.level,
                  isBoss: false,
                  isDead: false,
                  enemyType: 'Skeleton Mage',
                  shield: 0,
                  activeBuffs: {},
                  activeDebuffs: {}
                });
              }
              
              // Add new mages to enemies array (merge with updatedEnemies)
              updatedEnemies.push(...newMages);
              
              // Clear the in-progress flag after a short delay
              setTimeout(() => {
                corruptedPriestSpawnInProgress.current = false;
              }, 100);
              
              console.log(`[Combat] ✅ Spawned ${numMages} Skeleton Mages! (Total enemies: ${updatedEnemies.length})`);
            }
          } else if (magesAlreadyExist) {
            // Mages already exist, ensure flag is set
            corruptedPriestSpawnedRef.current = true;
          }
        }
        
        // Update state immediately so other actions can see this enemy is dead!
        enemiesRef.current = updatedEnemies;
        
        // Play death animation if enemy just died (only once)
        // Note: State will be updated when this setEnemies callback returns updatedEnemies at the end
        if (died) {
          const enemyRef = getEnemySpriteRef(target.id);
          if (enemyRef.current) {
            console.log(`[Animation] ${target.name} → death (from hero attack)`);
            // Defer animation slightly to ensure state update is processed
            // The state update happens when setEnemies callback returns updatedEnemies
            setTimeout(() => {
              const currentEnemyRef = getEnemySpriteRef(target.id);
              if (currentEnemyRef.current) {
                currentEnemyRef.current.playAnimation('death');
                console.log(`[Animation] ✅ Death animation triggered for ${target.name}`);
              } else {
                console.warn(`[Animation] ⚠️ Enemy sprite ref not found for ${target.id} (${target.name}) after delay`);
              }
            }, 100);
          } else {
            console.warn(`[Animation] ⚠️ Enemy sprite ref not found for ${target.id} (${target.name})`);
          }
        }
        
        // QUEST TRACKING: Track enemy kills
        if (died) {
          trackQuest(hero.id, 'kill', 1);
          
          // Track boss kills separately
          if (target.isBoss) {
            trackQuest(hero.id, 'defeatBosses', 1);
          }
          
          // ENCHANTING: Grant essence from enemy defeats (for heroes with enchanting profession)
          setHeroes(current => {
            return current.map(h => {
              if (h.id !== hero.id || h.isDead || !h.profession || h.profession.type !== 'enchanting') return h;
              
              const profession = h.profession;
              const profLevel = profession.level || 1;
              
              // Base essence based on enemy level (1-3 essence per kill)
              const baseEssence = Math.floor(1 + (target.level || 1) / 10) + Math.floor(Math.random() * 2);
              
              // Bonus: +5% essence per profession level (capped at +50% at level 10)
              const essenceBonus = Math.min(1 + (profLevel - 1) * 0.05, 1.5);
              const essenceAmount = Math.floor(baseEssence * essenceBonus);
              
              // Boss bonus: +50% essence
              const finalEssence = target.isBoss ? Math.floor(essenceAmount * 1.5) : essenceAmount;
              
              // Update profession materials
              const updatedMaterials = {
                ...(profession.materials || {}),
                essence: (profession.materials?.essence || 0) + finalEssence
              };
              
              // Track for sync
              if (!professionMaterialsRef.current.has(h.id)) {
                professionMaterialsRef.current.set(h.id, {});
              }
              const currentMaterials = professionMaterialsRef.current.get(h.id) || {};
              professionMaterialsRef.current.set(h.id, {
                ...currentMaterials,
                essence: (currentMaterials.essence || 0) + finalEssence
              });
              
              // Grant profession XP and check for level-up
              const professionXp = Math.floor(3 + Math.random() * 3);
              profession.totalGathered = (profession.totalGathered || 0) + 1;
              
              // Update profession
              const updatedProfession = {
                ...profession,
                materials: updatedMaterials,
                totalGathered: profession.totalGathered
              };
              
              // Check for profession level-up (simplified - full logic in grantProfessionXp)
              const currentProfXp = profession.xp || 0;
              const currentProfMaxXp = profession.maxXp || 100;
              const newProfXp = currentProfXp + professionXp;
              
              if (newProfXp >= currentProfMaxXp) {
                const newProfLevel = profLevel + 1;
                const newProfMaxXp = 100 + newProfLevel * 10;
                updatedProfession.level = newProfLevel;
                updatedProfession.xp = newProfXp - currentProfMaxXp;
                updatedProfession.maxXp = newProfMaxXp;
                console.log(`[Enchanting] ✨ ${h.name} profession leveled up! ${profLevel} → ${newProfLevel}`);
              } else {
                updatedProfession.xp = newProfXp;
              }
              
              // Show essence SCT
              const heroElement = document.querySelector(`[data-hero-id="${h.id}"]`);
              if (heroElement) {
                const rect = heroElement.getBoundingClientRect();
                addSCT(`+${finalEssence} Essence`, rect.left + rect.width / 2, rect.top + 25, 'gather');
              }
              
              console.log(`[Enchanting] ${h.name} gained ${finalEssence} essence from ${target.name} (${target.isBoss ? 'boss' : 'enemy'})`);
              
              return { ...h, profession: updatedProfession };
            });
          });
          
          // INSTANT VICTORY CHECK: If this was the last enemy, end round NOW!
          const remainingEnemies = updatedEnemies.filter(e => e.hp > 0 && !e.isDead);
          if (remainingEnemies.length === 0) {
            console.log('[Combat] ⚡ INSTANT VICTORY! Last enemy defeated - ending round NOW!');
            
            // Clear any pending combat actions (stop beating dead enemies!)
            if (combatRoundTimeoutRef.current) {
              clearTimeout(combatRoundTimeoutRef.current);
              combatRoundTimeoutRef.current = null;
            }
            
            // Trigger victory check after death animation completes
            // Bosses have longer death animations (Goblin Chief: 1.1s, Elder Dragon: ~2s)
            const isBoss = target.isBoss;
            const deathAnimationDelay = isBoss ? 2500 : 1500; // 2.5s for bosses, 1.5s for regular enemies
            setTimeout(() => {
              // Ensure combat is still in progress before checking (might have been cleared by room transition)
              if (combatInProgress.current && inCombat) {
                checkCombatVictory().catch(err => console.error('[Combat] Error in checkCombatVictory:', err));
              } else {
                console.log('[Combat] Victory check skipped - combat state was cleared (might be room transition or dungeon complete)');
                // Double-check if all enemies are dead and we're in dungeon mode - might need cleanup
                const remainingEnemies = enemiesRef.current.filter(e => e.hp > 0 && !e.isDead);
                if (remainingEnemies.length === 0 && gameMode === 'dungeon') {
                  console.log('[Combat] All enemies dead but combat cleared - forcing victory check anyway');
                  checkCombatVictory().catch(err => console.error('[Combat] Error in checkCombatVictory:', err));
                }
              }
            }, deathAnimationDelay);
          }
        }
        
        // ========================================
        // HERO DEBUFF APPLICATION ON ENEMIES
        // ========================================
        // Only apply if enemy survived the hit
        if (newHp > 0) {
          let debuffApplied = false;
          let appliedDebuff = '';
          
          // Shadow Priest: 20% chance to apply Weakened (-30% damage)
          if (hero.role === 'shadowpriest' && Math.random() < 0.20) {
            debuffApplied = true;
            appliedDebuff = 'weaken';
          }
          // Necromancer: 15% chance to apply Corruption (DoT)
          else if (hero.role === 'necromancer' && Math.random() < 0.15) {
            debuffApplied = true;
            appliedDebuff = 'corruption';
          }
          // Warlock: 15% chance to apply Cursed (-50% healing)
          else if (hero.role === 'warlock' && Math.random() < 0.15) {
            debuffApplied = true;
            appliedDebuff = 'cursed';
          }
          // Reaper: 20% chance to apply Bleeding (DoT)
          else if (hero.role === 'reaper' && Math.random() < 0.20) {
            debuffApplied = true;
            appliedDebuff = 'bleed';
          }
          // Hunter/Ranger: 10% chance to apply Poisoned (DoT)
          else if ((hero.role === 'hunter' || hero.role === 'ranger') && Math.random() < 0.10) {
            debuffApplied = true;
            appliedDebuff = 'poison';
          }
          
          if (debuffApplied && appliedDebuff) {
            const debuffDef = DEBUFFS[appliedDebuff];
            if (debuffDef) {
              // Calculate enemy resistance (bosses have 25%, regular 10%)
              const resistance = target.isBoss ? 0.25 : 0.10;
              
              // Roll for resistance
              if (Math.random() >= resistance) {
                // Debuff applied!
                const now = Date.now();
                
                if (!updatedEnemies[targetIndex].activeDebuffs) {
                  updatedEnemies[targetIndex].activeDebuffs = {};
                }
                
                // Calculate debuff value (scale with hero stats for DoTs)
                let debuffValue = debuffDef.value;
                if (debuffDef.effect === 'damageOverTime') {
                  // DoT scales with hero attack (5% of attack as DoT damage)
                  const attackScaling = Math.floor((hero.attack || 0) * 0.05);
                  debuffValue = Math.max(debuffValue, attackScaling);
                }
                
                updatedEnemies[targetIndex].activeDebuffs![appliedDebuff] = {
                  expiresAt: now + debuffDef.duration,
                  appliedBy: hero.name,
                  lastTick: now,
                  value: debuffValue
                };
                
                console.log(`[Hero Debuff] ${debuffDef.icon} ${hero.name} applies ${debuffDef.name} to ${target.name}! (${debuffDef.duration}ms)`);
                
                // Store for SCT outside setState
                appliedDebuffInfo = {
                  name: debuffDef.name,
                  icon: debuffDef.icon,
                  targetId: target.id
                };
              } else {
                console.log(`[Hero Debuff] ✨ ${target.name} resists ${debuffDef.name}! (${(resistance * 100).toFixed(0)}% resist)`);
              }
            }
          }
        }

        // Update ref
        enemiesRef.current = updatedEnemies;
        return updatedEnemies;
      });

      // ALL SIDE EFFECTS OUTSIDE setState (prevents React Strict Mode duplicates)
      
      // Get target for animations/SCT
      const target = enemiesRef.current.find(e => e.id === action.targetId);
      if (!target) return;

        console.log(`[Combat] ${action.actorName} attacks ${target.name} for ${damage}`);
        
        // Track damage for quests
        setHeroes(current => {
          const updated = current.map(h => {
            if (h.id !== hero.id || !h.quests) return h;
            // Update quest progress for damage dealt (simplified - real tracking would check quest objectives)
            return h;
          });
          return updated;
        });

      // BLOODTHIRST (Blood Knight) + VAMPIRIC PROC - Lifesteal
      let totalLifesteal = 0;
      
      // Blood Knight class ability (20% lifesteal)
      if (hero.role === 'bloodknight') {
        totalLifesteal += Math.floor(damage * 0.2);
      }
      
      // Vampiric proc from equipment (10% lifesteal)
      if (hero.equipment) {
        Object.values(hero.equipment).forEach((item: any) => {
          if (!item || !item.procEffects) return;
          
          item.procEffects.forEach((proc: any) => {
            if (proc.effect === 'lifesteal' && Math.random() < proc.chance) {
              totalLifesteal += Math.floor(damage * proc.value);
              console.log(`[Proc] 🩸 ${hero.name}'s ${proc.name} procs! (${(proc.value * 100).toFixed(0)}% lifesteal)`);
            }
          });
        });
      }
      
      // Apply lifesteal
      if (totalLifesteal > 0) {
        setHeroes(current => {
          const updated = current.map(h => {
            if (h.id === hero.id) {
              const newHp = Math.min(h.maxHp, h.hp + totalLifesteal);
              const actualHeal = newHp - h.hp;
              const overheal = totalLifesteal - actualHeal;
              const newShield = (h.shield || 0) + overheal;
              
              if (actualHeal > 0) {
                console.log(`[Lifesteal] 🩸 ${h.name} lifesteals ${actualHeal} HP!`);
              }
              
              return { ...h, hp: newHp, shield: newShield };
            }
            return h;
          });
          heroesRef.current = updated;
          return updated;
        });
        
        // Show lifesteal SCT
        const heroElement = document.querySelector(`[data-hero-id="${hero.id}"]`);
        if (heroElement) {
          const rect = heroElement.getBoundingClientRect();
          setTimeout(() => {
            addSCT(`+${totalLifesteal}`, rect.left + rect.width / 2, rect.top + 20, 'heal-hot');
          }, 400);
        }
      }
      
      // EXECUTE (Vanguard) - Finish low HP enemies
      if (hero.role === 'vanguard' && target.hp > 0) {
        const enemyHpPercent = target.hp / target.maxHp;
        if (enemyHpPercent < 0.20 && damage >= target.maxHp * 0.15) {
          console.log(`[Execute] ⚔️ ${hero.name} EXECUTES ${target.name}! (guaranteed kill)`);
          
          // Set enemy HP to 0 (guaranteed kill)
          setEnemies(current => {
            const updated = current.map(e => 
              e.id === target.id ? { ...e, hp: 0, isDead: true } : e
            );
            enemiesRef.current = updated;
            return updated;
          });
          
          // Show Execute SCT
          const enemyElement = document.querySelector(`[data-enemy-id="${target.id}"]`);
          if (enemyElement) {
            const rect = enemyElement.getBoundingClientRect();
            setTimeout(() => {
              addSCT('EXECUTED!', rect.left + rect.width / 2, rect.top + 20, 'crit');
            }, 500);
          }
        }
      }
      
      // SCT for damage - Target canvas for bosses (not huge container!)
      const enemyElement = document.querySelector(`[data-enemy-id="${target.id}"]`);
      if (enemyElement) {
        // For bosses, find the canvas element (actual sprite) instead of container
        const canvas = enemyElement.querySelector('canvas');
        const rect = canvas ? canvas.getBoundingClientRect() : enemyElement.getBoundingClientRect();
        
        addSCT(`${damage}`, rect.left + rect.width / 2, rect.top + 20, isCrit ? 'crit' : 'damage');
        
        // SCT for debuff application (if debuff was applied)
        if (appliedDebuffInfo && appliedDebuffInfo.targetId === target.id) {
          setTimeout(() => {
            addSCT(`+${appliedDebuffInfo.name}`, rect.left + rect.width / 2, rect.top + 50, 'gather'); // Pink for debuffs
          }, 300); // Slight delay so it doesn't overlap with damage
        }
      }

      // Enemy hurt animation (skip if in aerial sequence or if enemy is dead!)
      setTimeout(() => {
        // Check if enemy is still alive (might have died from this attack)
        const currentEnemy = enemiesRef.current.find(e => e.id === target.id);
        if (!currentEnemy || currentEnemy.hp <= 0 || currentEnemy.isDead) {
          console.log(`[Animation] ${target.name} → hurt SKIPPED (enemy is dead)`);
          return;
        }
        
        const enemyRef = getEnemySpriteRef(target.id);
        const enemyElement = document.querySelector(`[data-enemy-id="${target.id}"]`) as HTMLElement;
        
        // Don't interrupt aerial sequence!
        if (enemyElement?.getAttribute('data-aerial-sequence') === 'true') {
          console.log(`[Animation] ${target.name} → hurt SKIPPED (aerial sequence in progress)`);
          return;
        }
        
        if (enemyRef.current) {
          console.log(`[Animation] ${target.name} → hurt`);
          enemyRef.current.playAnimation('hurt');
        }
      }, 200);

      // Death animation (only if enemy just died - check if already dead)
      // Note: Death animation is already handled in executeHeroAttack, so we skip here to avoid duplicate calls
      // This is only for cases where enemy dies from other sources (e.g., execute ability)
      if (target.hp <= 0 && !target.isDead) {
        setTimeout(() => {
          const enemyRef = getEnemySpriteRef(target.id);
          if (enemyRef.current) {
            console.log(`[Animation] ${target.name} → death (from enemy attack context)`);
            enemyRef.current.playAnimation('death');
            console.log(`[Animation] ✅ Death animation triggered for ${target.name}`);
          } else {
            console.warn(`[Animation] ⚠️ Enemy sprite ref not found for ${target.id} (${target.name})`);
          }
        }, 150);
      } else {
        // Hero returns to idle after attack
        // Don't return to idle - let attack animation complete naturally
      }
    };

    // Execute enemy attack
    const executeEnemyAttack = (action: CombatAction) => {
      // Get enemy and verify it's still alive
      const enemy = enemiesRef.current.find(e => e.id === action.actorId);
      if (!enemy || enemy.hp <= 0 || enemy.isDead) {
        console.log(`[Combat] ⏭️ Skipping enemy attack - ${action.actorName} is dead!`);
        return; // Dead enemies don't attack
      }
      
      // REMOVED: Spawn check moved to executeHeroAttack where damage is actually applied
      
      // Handle AOE attacks (Corrupted High Priest shadow damage)
      if (action.isAOE && action.targetId === 'all') {
        const allAliveHeroes = heroesRef.current.filter(h => h.hp > 0 && !h.isDead);
        if (allAliveHeroes.length === 0) {
          console.log(`[Combat] ⏭️ Skipping AOE attack - no alive heroes!`);
          return;
        }
        
        console.log(`[Combat] 🌑 ${enemy.name} casts AOE Shadow Damage on ${allAliveHeroes.length} heroes!`);
        
        // Play special animation
        const enemyRef = getEnemySpriteRef(action.actorId);
        if (enemyRef.current) {
          enemyRef.current.playAnimation('attack2'); // Use attack2 for AOE
        }
        
        // Calculate AOE damage (75% of normal attack, but hits everyone)
        const enemyBaseAttack = enemy.attack || enemy.level * 8;
        const aoeDamageMultiplier = 0.75; // AOE does 75% of normal damage
        const variance = enemyBaseAttack * 0.2;
        let baseDamage = Math.floor((enemyBaseAttack * aoeDamageMultiplier) + (Math.random() * variance * 2) - variance);
        
        // Check for WEAKENED debuff
        if (enemy.activeDebuffs?.weaken) {
          baseDamage *= 0.7;
          console.log(`[Debuff] 💔 ${enemy.name} is Weakened (-30% damage)`);
        }
        
        // Apply difficulty modifier
        baseDamage = Math.floor(baseDamage * difficultyModifier);
        
        // Apply shadow damage to all heroes
        allAliveHeroes.forEach((hero, index) => {
          setTimeout(() => {
            // Apply defense (same logic as regular attacks)
            let defense = hero.defense || 0;
            
            // Apply ACTIVE CHATTER BONUS (+0.5% defense per active chatter)
            if (activeChatterCount > 0) {
              const bonuses = calculateViewerBonuses();
              defense = Math.floor(defense * bonuses.defense);
            }
            
            // Apply Defense Buff (+10% DEF)
            if (hero.shopBuffs?.defenseBuff && hero.shopBuffs.defenseBuff.remainingDuration > 0) {
              defense = Math.floor(defense * 1.10);
            }
            
            const isTank = isTankRole(hero.role);
            
            // Improved defense scaling: Tanks get better mitigation (1/200 divisor instead of 1/250)
            const defenseDivisor = isTank ? 200 : 250;
            const damageAfterDefense = baseDamage / (1 + defense / defenseDivisor);
            
            // Reduced minimum damage: 10% for tanks, 15% for others (was 25% for all)
            const minDamagePercent = isTank ? 0.10 : 0.15;
            const minDamage = Math.max(1, baseDamage * minDamagePercent);
            let actualDamage = Math.max(minDamage, Math.floor(damageAfterDefense));
            
            // Check for VULNERABLE debuff (+40% damage taken)
            if (hero.activeDebuffs?.vulnerable) {
              actualDamage = Math.round(actualDamage * 1.4);
            }
            
            // Track blocked damage from abilities
            let aoeBlockedByAbilities = 0;
            const damageBeforeAbilities = actualDamage;
            
            // Check for Last Stand
            const hpPercent = hero.hp / hero.maxHp;
            if (isTankRole(hero.role) && hpPercent < 0.10) {
              const now = Date.now();
              if (!hero.activeBuffs?.lastStand?.active || (hero.activeBuffs.lastStand.expiresAt > now)) {
                actualDamage = Math.floor(actualDamage * 0.25); // 75% reduction
                aoeBlockedByAbilities += (damageBeforeAbilities - actualDamage);
                console.log(`[Last Stand] 🛡️ ${hero.name} reduces AOE damage!`);
              }
            }
            
            // Check for Iron Skin (30% chance)
            const damageBeforeIronSkin = actualDamage;
            if (Math.random() < 0.30) {
              actualDamage = Math.floor(actualDamage * 0.5); // 50% reduction
              aoeBlockedByAbilities += (damageBeforeIronSkin - actualDamage);
              console.log(`[Iron Skin] 💎 ${hero.name} reduces AOE damage!`);
            }
            
            // Apply damage
            let remainingDamage = actualDamage;
            let newShield = hero.shield || 0;
            let newHp = hero.hp;
            let aoeShieldDamage = 0;
            
            if (newShield > 0) {
              if (remainingDamage >= newShield) {
                aoeShieldDamage = newShield;
                remainingDamage -= newShield;
                newShield = 0;
                newHp = Math.max(0, hero.hp - remainingDamage);
              } else {
                aoeShieldDamage = remainingDamage;
                newShield -= remainingDamage;
              }
            } else {
              newHp = Math.max(0, hero.hp - remainingDamage);
            }
            
            // Update hero
            const wasAlive = hero.hp > 0 && !hero.isDead;
            const now = Date.now();
            
            setHeroes(current => {
              const updated = current.map(h => {
                if (h.id === hero.id) {
                  const updatedHero = { 
                    ...h, 
                    hp: newHp, 
                    shield: newShield, 
                    isDead: newHp <= 0,
                    // CRITICAL: Set deathTime if hero just died
                    deathTime: (wasAlive && newHp <= 0) ? now : (h.deathTime || undefined)
                  };
                  
                  // Initialize stats if needed
                  if (!updatedHero.stats) {
                    updatedHero.stats = { totalDamage: 0, totalHealing: 0, damageBlocked: 0 };
                  }
                  
                  // Track blocked damage for AOE
                  if (aoeBlockedByAbilities > 0) {
                    updatedHero.stats.damageBlocked = (updatedHero.stats.damageBlocked || 0) + aoeBlockedByAbilities;
                    // QUEST TRACKING: Track blocked damage
                    trackQuest(hero.id, 'blockDamage', aoeBlockedByAbilities);
                  }
                  
                  if (aoeShieldDamage > 0) {
                    updatedHero.stats.damageBlocked = (updatedHero.stats.damageBlocked || 0) + aoeShieldDamage;
                    // QUEST TRACKING: Track blocked damage
                    trackQuest(hero.id, 'blockDamage', aoeShieldDamage);
                  }
                  
                  return updatedHero;
                }
                return h;
              });
              heroesRef.current = updated;
              return updated;
            });
            
            // Play hurt animation
            const heroRef = getHeroSpriteRef(hero.id);
            if (heroRef.current && newHp > 0) {
              heroRef.current.playAnimation('hurt');
            } else if (newHp <= 0) {
              setTimeout(() => {
                if (heroRef.current) {
                  heroRef.current.playAnimation('death');
                }
              }, 200);
            }
            
            // Show damage SCT
            const heroElement = document.querySelector(`[data-hero-id="${hero.id}"]`);
            if (heroElement) {
              const rect = heroElement.getBoundingClientRect();
              addSCT(`-${actualDamage}`, rect.left + rect.width / 2, rect.top + 20, 'damage');
            }
            
            console.log(`[Combat] 🌑 ${enemy.name} → ${hero.name}: ${actualDamage} shadow damage (${newHp}/${hero.maxHp} HP)`);
          }, index * 100); // Stagger AOE hits slightly
        });
        
        return; // AOE attack complete
      }
      
      // Check if target hero is still alive (for single target attacks)
      const targetHeroCheck = heroesRef.current.find(h => h.id === action.targetId);
      if (!targetHeroCheck || targetHeroCheck.hp <= 0 || targetHeroCheck.isDead) {
        console.log(`[Combat] ⏭️ Skipping enemy attack - target ${action.targetName} is dead!`);
        return; // Don't attack dead heroes
      }

      // Calculate damage ONCE
      const enemyBaseAttack = enemy.attack || enemy.level * 8;
      const variance = enemyBaseAttack * 0.2;
      let baseDamage = Math.floor(enemyBaseAttack + (Math.random() * variance * 2) - variance);
      
      // Check for WEAKENED debuff on enemy (-30% damage)
      if (enemy.activeDebuffs?.weaken) {
        baseDamage *= 0.7;
        console.log(`[Debuff] 💔 ${enemy.name} is Weakened (-30% damage)`);
      }
      
      // APPLY DIFFICULTY (linear scaling, not exponential!)
      // Example: 150% difficulty = 1.5x damage (reasonable)
      // NOT: 1.5³ = 3.375x damage (insane!)
      baseDamage = Math.floor(baseDamage * difficultyModifier);

      // Transform Werewolf on first attack
      if (enemy.name === 'Werewolf' && !enemy.isTransformed) {
        console.log(`[Werewolf] Transforming on attack!`);
        setEnemies(current => {
          const updated = current.map(e => 
            e.id === enemy.id ? { ...e, isTransformed: true } : e
          );
          enemiesRef.current = updated;
          return updated;
        });
        
        // Play transform animation, then attack
        const enemyRef = getEnemySpriteRef(action.actorId);
        if (enemyRef.current) {
          console.log(`[Animation] ${action.actorName} → transform`);
          enemyRef.current.playAnimation('transform');
          
          // After transform, play attack
          setTimeout(() => {
            if (enemyRef.current) {
              console.log(`[Animation] ${action.actorName} → attack (as werewolf)`);
              enemyRef.current.playAnimation('attack');
            }
          }, 1500); // Transform takes ~1.5s
        }
      } else {
        // Normal attack animation (with variants for dragons!)
        const enemyRef = getEnemySpriteRef(action.actorId);
        if (enemyRef.current) {
          // DRAGON ATTACK VARIANTS (only Dragon_1/2/3, NOT Elder Dragon!)
          const isDragonWave = action.actorName?.includes('Dragon') && !action.actorName?.includes('Elder');
          
          if (isDragonWave) {
            const attackRoll = Math.random();
            
            if (attackRoll < 0.10) {
              // SPECIAL: Aerial attack with MOVEMENT! Dragon flies to hero!
              console.log(`[Animation] ${action.actorName} → AERIAL ATTACK WITH MOVEMENT! 🔥`);
              
              const dragonElement = document.querySelector(`[data-enemy-id="${action.actorId}"]`) as HTMLElement;
              const heroElement = document.querySelector(`[data-hero-id="${action.targetId}"]`) as HTMLElement;
              
              if (dragonElement && heroElement) {
                // Store original position
                const originalLeft = dragonElement.style.left;
                const originalTop = dragonElement.style.top;
                const originalTransform = dragonElement.style.transform || '';
                
                // Mark dragon as in aerial sequence (prevent position corruption)
                dragonElement.setAttribute('data-aerial-sequence', 'true');
                
                console.log(`[Aerial] Original position: ${originalLeft}, ${originalTop}`);
                
                // Get hero SPRITE position (canvas within the container)
                const heroCanvas = heroElement.querySelector('canvas');
                const targetRect = heroCanvas ? heroCanvas.getBoundingClientRect() : heroElement.getBoundingClientRect();
                
                console.log(`[Aerial] Targeting hero sprite at (${targetRect.left}, ${targetRect.top})`);
                
                // 1. RISE (take off at current position)
                enemyRef.current.playAnimation('rise');
                
                // 2. FLIGHT + Move toward hero sprite (FAST transition)
                setTimeout(() => {
                  if (enemyRef.current && dragonElement) {
                    console.log(`[Aerial] Flying toward hero sprite...`);
                    enemyRef.current.playAnimation('flight');
                    dragonElement.style.transition = 'left 1.2s ease-in-out, top 1.2s ease-in-out';
                    dragonElement.style.left = `${targetRect.left - 100}px`; // Near hero sprite
                    dragonElement.style.top = `${targetRect.top - 100}px`;   // Above hero sprite
                  }
                }, 700);
                
                // 3. SPECIAL (fire breath) - quick
                setTimeout(() => {
                  if (enemyRef.current) {
                    console.log(`[Aerial] FIRE BREATH!`);
                    enemyRef.current.playAnimation('special');
                  }
                }, 1800); // Faster: flight → special
                
                // 4. FLIGHT back - quick return
                setTimeout(() => {
                  if (enemyRef.current && dragonElement) {
                    console.log(`[Aerial] Flying back...`);
                    enemyRef.current.playAnimation('flight');
                    dragonElement.style.transform = 'scaleX(-1)';
                    dragonElement.style.left = originalLeft;
                    dragonElement.style.top = originalTop;
                  }
                }, 3200); // Faster: special → flight back
                
                // 5. LANDING - quick landing
                setTimeout(() => {
                  if (enemyRef.current && dragonElement) {
                    console.log(`[Aerial] Landing...`);
                    dragonElement.style.transform = 'scaleX(1)';
                    enemyRef.current.playAnimation('landing');
                  }
                }, 4400); // Faster: flight → landing
                
                // 6. IDLE - back to combat quickly
                setTimeout(() => {
                  if (enemyRef.current && dragonElement) {
                    console.log(`[Aerial] Sequence complete - back to idle`);
                    enemyRef.current.playAnimation('idle');
                    
                    // Clear aerial flag
                    dragonElement.removeAttribute('data-aerial-sequence');
                  }
                }, 5200);
                
                // SAFETY: Restore position if dragon is stuck (only if not at original position)
                setTimeout(() => {
                  if (dragonElement) {
                    const currentLeft = dragonElement.style.left;
                    const currentTop = dragonElement.style.top;
                    
                    // Only restore if position changed (dragon is stuck)
                    if (currentLeft !== originalLeft || currentTop !== originalTop) {
                      console.log(`[Aerial] SAFETY: Dragon stuck at (${currentLeft}, ${currentTop}), restoring to (${originalLeft}, ${originalTop})`);
                      dragonElement.style.transition = 'left 0.5s ease-out, top 0.5s ease-out';
                      dragonElement.style.left = originalLeft;
                      dragonElement.style.top = originalTop;
                      dragonElement.style.transform = 'scaleX(1)';
                    }
                    dragonElement.removeAttribute('data-aerial-sequence');
                  }
                }, 6000); // Check 800ms after sequence should complete
              } else {
                // Fallback if elements not found - just play animations in place
                enemyRef.current.playAnimation('special');
              }
              
            } else if (attackRoll < 0.30) {
              // ATTACK 2: Heavy attack (in place)
              console.log(`[Animation] ${action.actorName} → attack2 (HEAVY!) 💪`);
              enemyRef.current.playAnimation('attack2');
            } else {
              // ATTACK 1: Normal attack (in place)
              console.log(`[Animation] ${action.actorName} → attack`);
              enemyRef.current.playAnimation('attack');
            }
          } else {
            console.log(`[Animation] ${action.actorName} → attack`);
            enemyRef.current.playAnimation('attack');
          }
        }
      }

      // Check if target is test healer
      if (action.targetId === 'test-healer' && testHealer && testHealer.hp > 0) {
        const enemy = enemiesRef.current.find(e => e.id === action.actorId);
        if (!enemy) return;

        // Calculate damage (with variance like real heroes)
        const enemyBaseAttack = enemy.attack || enemy.level * 8;
        const variance = enemyBaseAttack * 0.2;
        let baseDamage = Math.floor(enemyBaseAttack + (Math.random() * variance * 2) - variance);
        
        // APPLY DIFFICULTY MODIFIER TO DAMAGE
        baseDamage = Math.floor(baseDamage * difficultyModifier);
        
        // Apply defense (with minimum 25% damage always gets through)
        const defense = testHealer.defense || 0;
        const damageAfterDefense = baseDamage / (1 + defense / 250);
        const minDamage = Math.max(1, baseDamage * 0.25);
        let actualDamage = Math.max(minDamage, Math.floor(damageAfterDefense));
        
        // SANITY CAP: Max damage = 3x hero HP
        const maxReasonableDamage = testHealer.maxHp * 3;
        if (actualDamage > maxReasonableDamage) {
          console.warn(`[Combat] 🚨 DAMAGE CAPPED! ${actualDamage} → ${maxReasonableDamage}`);
          actualDamage = maxReasonableDamage;
        }

        // Apply damage (shield first, then HP)
        let remainingDamage = actualDamage;
        let newShield = testHealer.shield || 0;
        let newHp = testHealer.hp;

        if (newShield > 0) {
          if (remainingDamage >= newShield) {
            remainingDamage -= newShield;
            newShield = 0;
            newHp = Math.max(0, testHealer.hp - remainingDamage);
            console.log(`[Combat] 🛡️ ${testHealer.name}'s shield broke! ${remainingDamage} damage to HP`);
          } else {
            newShield -= remainingDamage;
            console.log(`[Combat] 🛡️ ${testHealer.name}'s shield absorbed ${remainingDamage} damage (${newShield} remaining)`);
          }
        } else {
          newHp = Math.max(0, testHealer.hp - remainingDamage);
        }

        if (newHp <= 0) {
          console.log(`[Combat] 💀 ${testHealer.name} died!`);
          setTestHealer({ ...testHealer, hp: 0, shield: 0, isDead: true, deathTime: Date.now() });
          
          setTimeout(() => {
            const heroRef = getHeroSpriteRef(testHealer.id);
            if (heroRef.current) {
              console.log(`[Animation] ${testHealer.name} → death`);
              heroRef.current.playAnimation('death');
            }
          }, 200);
        } else {
          setTestHealer({ ...testHealer, hp: newHp, shield: newShield });
          
          setTimeout(() => {
            const heroRef = getHeroSpriteRef(testHealer.id);
            if (heroRef.current) {
              console.log(`[Animation] ${testHealer.name} → hurt`);
              heroRef.current.playAnimation('hurt');
              
            // Don't return to idle
            }
          }, 200);
        }
        return;
      }

      // Apply defense (already have baseDamage calculated above)
      const targetHeroRef = heroesRef.current.find(h => h.id === action.targetId);
      if (!targetHeroRef || targetHeroRef.hp <= 0) return;

      // Check for Last Stand (tanks at <10% HP get 75% damage reduction)
      const hpPercent = targetHeroRef.hp / targetHeroRef.maxHp;
      let lastStandActive = false;
      
      // DEBUG: Log HP percent for tanks
      if (isTankRole(targetHeroRef.role)) {
        console.log(`[Last Stand Check] ${targetHeroRef.name} HP: ${Math.floor(hpPercent * 100)}% (${targetHeroRef.hp}/${targetHeroRef.maxHp}) - Triggers at <10%`);
      }
      
      if (isTankRole(targetHeroRef.role) && hpPercent < 0.10) {
        const now = Date.now();
        // Check if Last Stand is active or needs to be triggered
        if (!targetHeroRef.activeBuffs?.lastStand?.active) {
          console.log(`[Last Stand] 🛡️💥 ${targetHeroRef.name} activates LAST STAND! (75% damage reduction)`);
          lastStandActive = true;
          
          // SHOW SCT FOR LAST STAND
          const heroElement = document.querySelector(`[data-hero-id="${targetHeroRef.id}"]`);
          if (heroElement) {
            const rect = heroElement.getBoundingClientRect();
            addSCT('+Last Stand', rect.left + rect.width / 2, rect.top + 20, 'loot'); // Gold for buffs
          }
          
          // Set Last Stand buff (lasts 10 seconds)
          setHeroes(current => {
            const updated = current.map(h => 
              h.id === targetHeroRef.id 
                ? { ...h, activeBuffs: { ...h.activeBuffs, lastStand: { active: true, expiresAt: now + 10000 } } }
                : h
            );
            heroesRef.current = updated;
            return updated;
          });
        } else if (targetHeroRef.activeBuffs.lastStand.expiresAt > now) {
          lastStandActive = true;
        }
      }
      
      // Check for Iron Skin proc (30% chance for 50% damage reduction)
      let ironSkinActive = false;
      if (Math.random() < 0.30) {
        const now = Date.now();
        console.log(`[Iron Skin] 💎 ${targetHeroRef.name} procs IRON SKIN! (50% damage reduction)`);
        ironSkinActive = true;
        
        // SHOW SCT FOR IRON SKIN
        const heroElement = document.querySelector(`[data-hero-id="${targetHeroRef.id}"]`);
        if (heroElement) {
          const rect = heroElement.getBoundingClientRect();
          addSCT('+Iron Skin', rect.left + rect.width / 2, rect.top + 20, 'loot'); // Gold for buffs
        }
        
        setHeroes(current => {
          const updated = current.map(h => 
            h.id === targetHeroRef.id 
              ? { ...h, activeBuffs: { ...h.activeBuffs, ironSkin: { active: true, expiresAt: now + 5000 } } }
              : h
          );
          heroesRef.current = updated;
          return updated;
        });
      }

      // EVASION (Assassin/Monk) - 15% chance to dodge
      const isEvasionClass = ['assassin', 'monk', 'bladedancer', 'hunter'].includes(targetHeroRef.role);
      if (isEvasionClass && Math.random() < 0.15) {
        console.log(`[Evasion] 💨 ${targetHeroRef.name} EVADES the attack!`);
        
        // Show miss SCT
        setTimeout(() => {
          const heroElement = document.querySelector(`[data-hero-id="${targetHeroRef.id}"]`);
          if (heroElement) {
            const rect = heroElement.getBoundingClientRect();
            addSCT('MISS', rect.left + rect.width / 2, rect.top + 20, 'miss');
          }
        }, 200);
        return; // Dodged - no damage!
      }
      
      let defense = targetHeroRef.defense || 0;
      
      // Apply ACTIVE CHATTER BONUS (+0.5% defense per active chatter)
      if (activeChatterCount > 0) {
        const bonuses = calculateViewerBonuses();
        defense = Math.floor(defense * bonuses.defense);
      }
      
      // Apply Defense Buff (+10% DEF)
      if (targetHeroRef.shopBuffs?.defenseBuff && targetHeroRef.shopBuffs.defenseBuff.remainingDuration > 0) {
        defense = Math.floor(defense * 1.10);
        console.log(`[Defense Buff] ⚡ ${targetHeroRef.name} gets +10% defense from buff!`);
      }
      
      const isTank = isTankRole(targetHeroRef.role);
      
      // Improved defense scaling: Tanks get better mitigation (1/200 divisor instead of 1/250)
      // This means tanks reach 50% DR at 200 defense vs 250 for others
      const defenseDivisor = isTank ? 200 : 250;
      const damageAfterDefense = baseDamage / (1 + defense / defenseDivisor);
      
      // Reduced minimum damage: 10% for tanks, 15% for others (was 25% for all)
      const minDamagePercent = isTank ? 0.10 : 0.15; // Tanks take less minimum damage
      const minDamage = Math.max(1, baseDamage * minDamagePercent);
      let actualDamage = Math.max(minDamage, Math.floor(damageAfterDefense));
      
      // Check for VULNERABLE debuff (+40% damage taken)
      if (targetHeroRef.activeDebuffs?.vulnerable) {
        actualDamage = Math.round(actualDamage * 1.4);
        console.log(`[Debuff] 🛡️💥 ${targetHeroRef.name} is Vulnerable (+40% damage)`);
      }
      
      // CHECK TANK EQUIPMENT PROCS (Thorns, Fortified, Enduring, Bulwark)
      let thornsDamage = 0;
      let procHeal = 0;
      
      if (targetHeroRef.equipment) {
        Object.values(targetHeroRef.equipment).forEach((item: any) => {
          if (!item || !item.procEffects) return;
          
          item.procEffects.forEach((proc: any) => {
            if (Math.random() < proc.chance) {
              // Thorns: Reflect 20% damage
              if (proc.effect === 'reflectDamage') {
                thornsDamage += Math.round(actualDamage * proc.value);
                console.log(`[Proc] 🌵 ${targetHeroRef.name}'s Thorns procs! (${(proc.value * 100).toFixed(0)}% reflect)`);
              }
              
              // Fortified: +10% defense for 5s
              if (proc.effect === 'defenseBoost') {
                actualDamage = Math.floor(actualDamage * (1 - proc.value));
                console.log(`[Proc] 🛡️ ${targetHeroRef.name}'s Fortified procs! (-${(proc.value * 100).toFixed(0)}% damage)`);
              }
              
              // Enduring: Heal 5 HP when hit
              if (proc.effect === 'healOnHit') {
                procHeal += proc.value;
                console.log(`[Proc] 💚 ${targetHeroRef.name}'s Enduring procs! (+${proc.value} HP)`);
              }
              
              // Bulwark: -15% damage taken
              if (proc.effect === 'damageReduction') {
                actualDamage = Math.floor(actualDamage * (1 - proc.value));
                console.log(`[Proc] 🛡️ ${targetHeroRef.name}'s Bulwark procs! (-${(proc.value * 100).toFixed(0)}% damage)`);
              }
            }
          });
        });
      }
      
      // Track original damage before reductions for blocked damage calculation
      let blockedByAbilities = 0;
      
      // Apply Last Stand reduction (75% reduction)
      if (lastStandActive) {
        const damageBefore = actualDamage;
        actualDamage = Math.round(actualDamage * 0.25);
        blockedByAbilities += (damageBefore - actualDamage);
        console.log(`[Last Stand] Damage reduced by 75%: ${Math.floor(actualDamage / 0.25)} → ${actualDamage}`);
      }
      
      // Apply Iron Skin reduction (50% reduction)
      if (ironSkinActive) {
        const damageBefore = actualDamage;
        actualDamage = Math.round(actualDamage * 0.50);
        blockedByAbilities += (damageBefore - actualDamage);
        console.log(`[Iron Skin] Damage reduced by 50%: ${Math.floor(actualDamage / 0.5)} → ${actualDamage}`);
      }
      
      // Check for Shield Wall (Guardian ability - 30% DR for all allies)
      const allCurrentHeroes = testHealer ? [...heroesRef.current, testHealer] : heroesRef.current;
      const shieldWallActive = allCurrentHeroes.some(h => h.activeBuffs?.shieldWall?.active && h.activeBuffs.shieldWall.expiresAt > Date.now());
      if (shieldWallActive) {
        const damageBefore = actualDamage;
        actualDamage = Math.floor(actualDamage * 0.70);
        blockedByAbilities += (damageBefore - actualDamage);
        console.log(`[Shield Wall] 🛡️ Damage reduced by 30%: ${Math.floor(actualDamage / 0.7)} → ${actualDamage}`);
      }
      
      // SANITY CAP
      const maxReasonableDamage = targetHeroRef.maxHp * 3;
      if (actualDamage > maxReasonableDamage) {
        console.warn(`[Combat] 🚨 DAMAGE CAPPED! ${actualDamage} → ${maxReasonableDamage}`);
        actualDamage = maxReasonableDamage;
      }

      console.log(`[Combat] ${action.actorName} attacks ${targetHeroRef.name} for ${actualDamage}`);

      // SCT
      const heroElement = document.querySelector(`[data-hero-id="${targetHeroRef.id}"]`);
      if (heroElement) {
        const rect = heroElement.getBoundingClientRect();
        addSCT(`${Math.round(actualDamage)}`, rect.left + rect.width / 2, rect.top + 20, 'damage');
      }

      // Find current state of target hero and apply damage
      setHeroes(currentHeroes => {
        const targetIndex = currentHeroes.findIndex(h => h.id === action.targetId);
        if (targetIndex === -1 || currentHeroes[targetIndex].hp <= 0) {
          return currentHeroes;
        }

        const target = currentHeroes[targetIndex];
        const updatedHeroes = [...currentHeroes];

        // Apply damage (shield first, then HP) - NO SIDE EFFECTS HERE!
        // Apply damage (shield first, then HP) - using pre-calculated actualDamage
        let remainingDamage = Math.round(actualDamage);
        let newShield = Math.round(target.shield || 0);
        let newHp = Math.round(target.hp);
        let shieldDamage = 0;
        let hpDamage = 0;

        if (newShield > 0) {
          // Damage shield first
          if (remainingDamage >= newShield) {
            // Shield breaks, remaining damage goes to HP
            shieldDamage = newShield;
            remainingDamage -= newShield;
            newShield = 0;
            hpDamage = remainingDamage;
            newHp = Math.max(0, target.hp - remainingDamage);
            console.log(`[Combat] 🛡️ ${target.name}'s shield absorbed ${shieldDamage} damage and broke! ${hpDamage} damage to HP`);
          } else {
            // Shield absorbs all damage
            shieldDamage = remainingDamage;
            newShield -= remainingDamage;
            console.log(`[Combat] 🛡️ ${target.name}'s shield absorbed ${shieldDamage} damage (${newShield} shield remaining)`);
          }
        } else {
          // No shield, damage goes to HP
          hpDamage = remainingDamage;
          newHp = Math.max(0, target.hp - remainingDamage);
        }

        // Mark as dead if HP reaches 0
        if (newHp <= 0 && target.hp > 0) {
          updatedHeroes[targetIndex] = {
            ...updatedHeroes[targetIndex],
            hp: 0,
            shield: 0,
            isDead: true,
            deathTime: Date.now(),
            activeDebuffs: {} // Clear debuffs on death
          };
        } else {
          // Track blocked damage in stats
          const updatedTarget = { ...target, hp: newHp, shield: newShield };
          
          // Initialize stats if needed
          if (!updatedTarget.stats) {
            updatedTarget.stats = { totalDamage: 0, totalHealing: 0, damageBlocked: 0 };
          }
          
          // Track damage blocked by tank abilities
          if (blockedByAbilities > 0) {
            updatedTarget.stats.damageBlocked = (updatedTarget.stats.damageBlocked || 0) + blockedByAbilities;
            // QUEST TRACKING: Track blocked damage
            trackQuest(target.id, 'blockDamage', blockedByAbilities);
            // STAT SYNC: Track blocked damage
            trackHeroStatChange(target.id, {
              stats: { damageBlocked: blockedByAbilities }
            });
          }
          
          // Track damage blocked by shields (healer shields)
          if (shieldDamage > 0) {
            updatedTarget.stats.damageBlocked = (updatedTarget.stats.damageBlocked || 0) + shieldDamage;
            // QUEST TRACKING: Track blocked damage
            trackQuest(target.id, 'blockDamage', shieldDamage);
            // STAT SYNC: Track blocked damage
            trackHeroStatChange(target.id, {
              stats: { damageBlocked: shieldDamage }
            });
          }
          
          // Track HP change for sync
          trackHeroStatChange(target.id, {
            hp: newHp
          });
          
          updatedHeroes[targetIndex] = updatedTarget;
          
          // ========================================
          // DRAGON ELEMENTAL DAMAGE (Fire & Poison DoT)
          // ========================================
          if (enemy.name === 'Dragon Whelp') {
            // FIRE DAMAGE - 50% chance to ignite
            if (Math.random() < 0.5) {
              const now = Date.now();
              if (!updatedHeroes[targetIndex].activeDebuffs) {
                updatedHeroes[targetIndex].activeDebuffs = {};
              }
              updatedHeroes[targetIndex].activeDebuffs!.burning = {
                expiresAt: now + 6000, // 6 seconds
                appliedBy: enemy.name,
                lastTick: now,
                value: Math.round(actualDamage * 0.15) // 15% of initial damage per tick
              };
              console.log(`[Fire] 🔥 ${target.name} is BURNING! (${Math.floor(actualDamage * 0.15)} damage/sec for 6s)`);
              
              setTimeout(() => {
                const heroElement = document.querySelector(`[data-hero-id="${target.id}"]`);
                if (heroElement) {
                  const rect = heroElement.getBoundingClientRect();
                  addSCT('🔥 Burning!', rect.left + rect.width / 2, rect.top + 20, 'dot');
                }
              }, 100);
            }
          } else if (enemy.name === 'Dragon Guardian') {
            // POISON DAMAGE - 50% chance to poison
            if (Math.random() < 0.5) {
              const now = Date.now();
              if (!updatedHeroes[targetIndex].activeDebuffs) {
                updatedHeroes[targetIndex].activeDebuffs = {};
              }
              updatedHeroes[targetIndex].activeDebuffs!.poison = {
                expiresAt: now + 8000, // 8 seconds
                appliedBy: enemy.name,
                lastTick: now,
                value: Math.floor(actualDamage * 0.12) // 12% of initial damage per tick
              };
              console.log(`[Poison] ☠️ ${target.name} is POISONED! (${Math.floor(actualDamage * 0.12)} damage/sec for 8s)`);
              
              setTimeout(() => {
                const heroElement = document.querySelector(`[data-hero-id="${target.id}"]`);
                if (heroElement) {
                  const rect = heroElement.getBoundingClientRect();
                  addSCT('☠️ Poisoned!', rect.left + rect.width / 2, rect.top + 20, 'dot');
                }
              }, 100);
            }
          }
          
          // ========================================
          // APPLY DEBUFF (20% regular, 40% bosses)
          // ========================================
          const debuffChance = enemy.isBoss ? 0.4 : 0.2;
          if (Math.random() < debuffChance) {
            const debuffOptions = ['bleed', 'cursed', 'weaken'];
            
            // Bosses have 30% chance to apply STUN
            if (enemy.isBoss && Math.random() < 0.3) {
              debuffOptions.push('stunned');
            }
            
            const debuffChoice = debuffOptions[Math.floor(Math.random() * debuffOptions.length)];
            const debuffDef = DEBUFFS[debuffChoice];
            
            if (debuffDef) {
              // Calculate debuff resistance (defense + level + gear)
              const defenseResist = Math.min(0.3, (target.defense || 0) / 500);
              const levelResist = Math.min(0.25, (target.level || 0) / 200);
              const gearResist = 0; // Simplified for now
              const resistance = Math.min(0.7, defenseResist + levelResist + gearResist); // Max 70%
              
              // Roll for resistance
              if (Math.random() >= resistance) {
                // Debuff applied!
                const now = Date.now();
                
                if (!updatedHeroes[targetIndex].activeDebuffs) {
                  updatedHeroes[targetIndex].activeDebuffs = {};
                }
                
                updatedHeroes[targetIndex].activeDebuffs![debuffChoice] = {
                  expiresAt: now + debuffDef.duration,
                  appliedBy: enemy.name,
                  lastTick: now,
                  value: debuffDef.value
                };
                
                console.log(`[Debuff] ${debuffDef.icon} ${target.name} is ${debuffDef.name}! (${debuffDef.duration}ms)`);
                
                // SHOW SCT FOR DEBUFF APPLICATION (outside setState)
                setTimeout(() => {
                  const heroElement = document.querySelector(`[data-hero-id="${target.id}"]`);
                  if (heroElement) {
                    const rect = heroElement.getBoundingClientRect();
                    addSCT(`+${debuffDef.name}`, rect.left + rect.width / 2, rect.top + 20, 'gather'); // Use gather (pink) for debuffs
                  }
                }, 50);
              } else {
                console.log(`[Debuff] ✨ ${target.name} resists ${debuffDef.name}! (${(resistance * 100).toFixed(0)}% resist)`);
              }
            }
          }
        }

        // Update ref
        heroesRef.current = updatedHeroes;
        return updatedHeroes;
      });
      
      // Apply THORNS damage to attacking enemy
      if (thornsDamage > 0) {
        setEnemies(current => {
          const updated = current.map(e => {
            if (e.id === enemy.id) {
              const newHp = Math.max(0, e.hp - thornsDamage);
              console.log(`[Thorns] 🌵 ${enemy.name} takes ${thornsDamage} reflected damage!`);
              
              // Show reflect SCT on enemy
              const enemyElement = document.querySelector(`[data-enemy-id="${e.id}"]`);
              if (enemyElement) {
                const rect = enemyElement.getBoundingClientRect();
                setTimeout(() => addSCT(`-${thornsDamage}`, rect.left + rect.width / 2, rect.top + 30, 'damage'), 300);
              }
              
              return { ...e, hp: newHp, isDead: newHp === 0 || e.isDead };
            }
            return e;
          });
          enemiesRef.current = updated;
          return updated;
        });
      }
      
      // Apply ENDURING heal
      if (procHeal > 0) {
        setHeroes(current => {
          const updated = current.map(h => {
            if (h.id === targetHeroRef.id) {
              const newHp = Math.min(h.maxHp, h.hp + procHeal);
              const actualHeal = newHp - h.hp;
              
              if (actualHeal > 0) {
                console.log(`[Enduring] 💚 ${h.name} heals ${actualHeal} HP from proc!`);
                
                // Track HP change for sync
                trackHeroStatChange(h.id, {
                  hp: newHp
                });
                
                const heroElement = document.querySelector(`[data-hero-id="${h.id}"]`);
                if (heroElement) {
                  const rect = heroElement.getBoundingClientRect();
                  setTimeout(() => addSCT(`+${actualHeal}`, rect.left + rect.width / 2, rect.top + 50, 'heal-hot'), 400);
                }
              }
              
              return { ...h, hp: newHp };
            }
            return h;
          });
          heroesRef.current = updated;
          return updated;
        });
      }

      // ANIMATIONS OUTSIDE setState
      const wasKilled = targetHeroRef.hp > 0 && (targetHeroRef.hp - actualDamage) <= 0;
      
      if (wasKilled) {
        console.log(`[Combat] 💀 ${targetHeroRef.name} died!`);
        setTimeout(() => {
          const heroRef = getHeroSpriteRef(targetHeroRef.id);
          if (heroRef.current) {
            console.log(`[Animation] ${targetHeroRef.name} → death`);
            heroRef.current.playAnimation('death');
          }
        }, 200);
      } else {
        setTimeout(() => {
          const heroRef = getHeroSpriteRef(targetHeroRef.id);
          if (heroRef.current) {
            console.log(`[Animation] ${targetHeroRef.name} → hurt`);
            heroRef.current.playAnimation('hurt');
            
            // Don't return to idle
          }
        }, 200);
      }
    };

    // Check if combat is over and continue or end (SIMPLIFIED)
    const checkCombatVictory = async () => {
      const currentHeroes = heroesRef.current;
      const currentEnemies = enemiesRef.current;
      
      console.log(`[Combat] 🎯 checkCombatVictory called - gameMode: ${gameMode}, inCombat: ${inCombat}, combatInProgress: ${combatInProgress.current}`);
      console.log(`[Combat] Current enemies: ${currentEnemies.length} total`);
      currentEnemies.forEach((e, i) => {
        console.log(`[Combat]   Enemy ${i}: ${e.name}, hp: ${e.hp}, isDead: ${e.isDead}`);
      });
      
      // CRITICAL: Skip victory check if combat is not in progress (prevents false victories during room transitions)
      // BUT: In dungeon mode, if all enemies are dead, we should still check (might be a timing issue)
      if (!inCombat || !combatInProgress.current) {
        console.log('[Combat] ⏭️ Skipping victory check - combat not in progress');
        // In dungeon mode, if all enemies are dead, force the check anyway
        if (gameMode === 'dungeon' && currentEnemies.length > 0) {
          const aliveEnemies = currentEnemies.filter(e => e.hp > 0 && !e.isDead);
          if (aliveEnemies.length === 0) {
            console.log('[Combat] ⚠️ Dungeon mode: All enemies dead but combat not in progress - forcing victory check anyway');
            // Continue to victory logic below
          } else {
            return;
          }
        } else {
          return;
        }
      }
      
      // Filter out dead enemies (HP <= 0 or isDead flag)
      const aliveEnemies = currentEnemies.filter(e => e.hp > 0 && !e.isDead);
      const aliveHeroes = currentHeroes.filter(h => h.hp > 0 && !h.isDead); // Calculate once for use throughout victory logic

      console.log(`[Combat] Victory check - ${aliveHeroes.length} heroes, ${aliveEnemies.length}/${currentEnemies.length} enemies alive`);

      // Only trigger victory if ALL enemies are dead AND we had enemies to begin with
      if (aliveEnemies.length === 0 && currentEnemies.length > 0) {
        // Victory! Grant XP to all alive heroes
        console.log('[Combat] ✅ Victory! All enemies defeated.');
        console.log(`[Combat] Victory details: ${currentEnemies.length} total enemies, all defeated`);
        
        // DUNGEON MODE: Check if we need to advance to next room
        if (gameMode === 'dungeon' && instanceData) {
          const currentRoom = instanceData.currentRoom || 0;
          // Get total rooms from instance data - prioritize maxRooms (set by backend) over rooms.length
          // CRITICAL: maxRooms is set by backend to the actual number of rooms (e.g., 3 for Goblin Cave)
          const totalRooms = instanceData.maxRooms || instanceData.totalRooms || (instanceData.rooms?.length || 3);
          
          console.log(`[Dungeon] ✅ Room ${currentRoom + 1}/${totalRooms} cleared!`);
          console.log(`[Dungeon] Room check details:`);
          console.log(`  - currentRoom (0-indexed): ${currentRoom}`);
          console.log(`  - currentRoom + 1: ${currentRoom + 1}`);
          console.log(`  - instanceData.maxRooms: ${instanceData.maxRooms}`);
          console.log(`  - instanceData.totalRooms: ${instanceData.totalRooms}`);
          console.log(`  - instanceData.rooms?.length: ${instanceData.rooms?.length}`);
          console.log(`  - final totalRooms: ${totalRooms}`);
          console.log(`  - Condition: ${currentRoom + 1} < ${totalRooms} = ${currentRoom + 1 < totalRooms}`);
          
          if (currentRoom + 1 < totalRooms) {
            // Advance to next room with countdown delay
            console.log(`[Dungeon] 🚪 Advancing to room ${currentRoom + 2}/${totalRooms}...`);
            console.log(`[Dungeon] Updating Firebase: currentRoom from ${currentRoom} to ${currentRoom + 1}`);
            
            // Show countdown before transitioning (gives time for CSS/scaling to stabilize)
            let countdown = 5;
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            
            // Show initial countdown message
            addSCT(`Returning to battle in ${countdown}...`, centerX, centerY, 'xp');
            
            const countdownInterval = setInterval(() => {
              countdown--;
              
              if (countdown > 0) {
                // Show countdown SCT in center of screen
                addSCT(`Returning to battle in ${countdown}...`, centerX, centerY, 'xp');
              } else {
                clearInterval(countdownInterval);
                
                // Update instance data in Firebase to trigger room change
                if (instanceData.id) {
                  import('firebase/firestore').then(({ doc, updateDoc, getDoc }) => {
                    const nextRoom = currentRoom + 1;
                    console.log(`[Dungeon] 🔧 Updating Firebase: currentRoom ${currentRoom} -> ${nextRoom}, status should remain 'active'`);
                    updateDoc(doc(db, 'dungeonInstances', instanceData.id), {
                      currentRoom: nextRoom,
                      status: 'active', // CRITICAL: Preserve status as 'active' so instance listener doesn't lose it
                      updatedAt: new Date()
                    }).then(() => {
                      console.log(`[Dungeon] ✅ Advanced to room ${nextRoom + 1} (currentRoom index: ${nextRoom})`);
                      console.log(`[Dungeon] 🔍 Status should be 'active' - instance listener should still find this dungeon`);
                      
                      // Force update instanceData to trigger useEffect immediately
                      // The onSnapshot listener should also detect this, but this ensures it happens
                      setTimeout(() => {
                        console.log(`[Dungeon] 🔄 Manually refreshing instanceData to trigger next room...`);
                        // Re-fetch the instance to get updated currentRoom
                        getDoc(doc(db, 'dungeonInstances', instanceData.id)).then((snapshot) => {
                          if (snapshot.exists()) {
                            const updatedData = { id: snapshot.id, ...snapshot.data() };
                            console.log(`[Dungeon] 📥 Updated instanceData with new currentRoom:`, updatedData.currentRoom);
                            setInstanceData(updatedData);
                          }
                        }).catch(err => {
                          console.error('[Dungeon] Failed to refresh instanceData:', err);
                        });
                      }, 500); // Small delay to ensure Firebase write completes
                    }).catch(err => {
                      console.error('[Dungeon] Failed to advance room:', err);
                    });
                  });
                }
                
                // Clear combat state (new room will spawn new enemies)
                setEnemies([]);
                enemiesRef.current = [];
                setInCombat(false);
                combatInProgress.current = false;
              }
            }, 1000); // Countdown every second
            
            return; // Don't grant XP/loot yet - wait for next room
          } else {
            // Final room cleared - dungeon complete!
            console.log(`[Dungeon] 🎉 DUNGEON COMPLETE!`);
            console.log(`[Dungeon] Completed all ${totalRooms} rooms!`);
            
            // QUEST TRACKING: Track dungeon completion for all alive heroes
            aliveHeroes.forEach(hero => {
              trackQuest(hero.id, 'completeDungeons', 1);
            });
            
            // Clear combat state immediately (before Firebase update)
            setEnemies([]);
            enemiesRef.current = [];
            setInCombat(false);
            combatInProgress.current = false;
            
            // Mark dungeon as complete in Firebase (this will trigger listener to return to idle)
            // Backend will reset party status to 'forming' when instance completes
            if (instanceData.id) {
              import('firebase/firestore').then(({ doc, updateDoc }) => {
                updateDoc(doc(db, 'dungeonInstances', instanceData.id), {
                  status: 'completed',
                  completedAt: new Date(),
                  currentRoom: currentRoom  // Keep currentRoom at the last valid room, don't increment
                }).then(() => {
                  console.log(`[Dungeon] ✅ Marked dungeon as complete - listener will return to idle mode`);
                  // Party status will be reset by backend when instance completes
                }).catch(err => {
                  console.error('[Dungeon] Failed to mark complete:', err);
                  // Even if Firebase update fails, clear state to prevent hanging
                  setTimeout(() => {
                    setEnemies([]);
                    enemiesRef.current = [];
                    setInCombat(false);
                    combatInProgress.current = false;
                  }, 2000);
                });
              });
            } else {
              // No instance ID - clear state anyway to prevent hanging
              console.warn('[Dungeon] No instance ID, clearing state anyway');
              setTimeout(() => {
                setEnemies([]);
                enemiesRef.current = [];
                setInCombat(false);
                combatInProgress.current = false;
              }, 2000);
            }
            
            // Grant dungeon completion rewards (from dungeon definition)
            // TODO: Get rewards from dungeon definition and grant them
          }
        }
        
        // RAID MODE: Check if we need to advance to next wave or complete raid
        if (gameMode === 'raid' && instanceData) {
          const currentWave = instanceData.currentWave || 0;
          const totalWaves = instanceData.waves || 3;
          const isBossWave = currentWave === totalWaves - 1;
          
          console.log(`[Raid] ✅ Wave ${currentWave + 1}/${totalWaves} cleared!`);
          
          if (isBossWave) {
            // Final wave (boss) defeated - raid complete!
            console.log(`[Raid] 🎉 RAID COMPLETE!`);
            
            // Clear combat state
            setEnemies([]);
            enemiesRef.current = [];
            setInCombat(false);
            combatInProgress.current = false;
            
            // Mark raid as complete in Firebase
            if (instanceData.id) {
              import('firebase/firestore').then(({ doc, updateDoc }) => {
                updateDoc(doc(db, 'raidInstances', instanceData.id), {
                  status: 'completed',
                  completedAt: new Date(),
                  currentWave: currentWave + 1
                }).then(() => {
                  console.log(`[Raid] ✅ Marked raid as complete`);
                }).catch(err => {
                  console.error('[Raid] Failed to mark complete:', err);
                  // Clear state anyway to prevent hanging
                  setTimeout(() => {
                    setEnemies([]);
                    enemiesRef.current = [];
                    setInCombat(false);
                    combatInProgress.current = false;
                  }, 2000);
                });
              });
            } else {
              // No instance ID - clear state anyway
              console.warn('[Raid] No instance ID, clearing state anyway');
              setTimeout(() => {
                setEnemies([]);
                enemiesRef.current = [];
                setInCombat(false);
                combatInProgress.current = false;
              }, 2000);
            }
            
            return; // Don't grant XP/loot yet - wait for completion
          } else {
            // Not final wave - advance to next wave
            console.log(`[Raid] 🚪 Advancing to wave ${currentWave + 2}/${totalWaves}...`);
            console.log(`[Raid] Current instanceData:`, { id: instanceData.id, currentWave, totalWaves });
            console.log(`[Raid] currentInstanceId:`, currentInstanceId);
            
            // CRITICAL: Stop combat IMMEDIATELY and clear enemies
            // This prevents combat from continuing with dead enemies
            combatInProgress.current = false;
            setInCombat(false);
            setEnemies([]);
            enemiesRef.current = [];
            
            // Clear any pending combat rounds
            if (combatRoundTimeoutRef.current) {
              clearTimeout(combatRoundTimeoutRef.current);
              combatRoundTimeoutRef.current = null;
              console.log('[Raid] 🧹 Cleared pending combat round timeout');
            }
            
            // Update Firebase to advance wave (this will trigger useEffect to spawn next wave)
            const instanceId = instanceData.id || currentInstanceId;
            if (instanceId) {
              import('firebase/firestore').then(({ doc, updateDoc }) => {
                const nextWave = currentWave + 1;
                console.log(`[Raid] 🔧 Updating Firebase: currentWave ${currentWave} -> ${nextWave} (instanceId: ${instanceId})`);
                updateDoc(doc(db, 'raidInstances', instanceId), {
                  currentWave: nextWave,
                  status: 'active', // Keep status as active
                  updatedAt: new Date()
                }).then(() => {
                  console.log(`[Raid] ✅ Advanced to wave ${nextWave + 1} (currentWave index: ${nextWave})`);
                  console.log(`[Raid] ⏳ Waiting for instance listener to detect change and trigger raid setup useEffect...`);
                  
                  // Force update instanceData to trigger useEffect immediately
                  // The onSnapshot listener should also detect this, but this ensures it happens
                  setTimeout(() => {
                    console.log(`[Raid] 🔄 Manually refreshing instanceData to trigger next wave...`);
                    // Re-fetch the instance to get updated currentWave
                    import('firebase/firestore').then(({ doc, getDoc }) => {
                      getDoc(doc(db, 'raidInstances', instanceId)).then((snapshot) => {
                        if (snapshot.exists()) {
                          const updatedData = { id: snapshot.id, ...snapshot.data() };
                          console.log(`[Raid] 📥 Updated instanceData with new currentWave:`, updatedData.currentWave);
                          setInstanceData(updatedData);
                        }
                      }).catch(err => {
                        console.error('[Raid] Failed to refresh instanceData:', err);
                      });
                    });
                  }, 500); // Small delay to ensure Firebase write completes
                }).catch(err => {
                  console.error('[Raid] ❌ Failed to advance wave:', err);
                  // Even if update fails, try to manually trigger next wave after delay
                  setTimeout(() => {
                    console.log('[Raid] ⚠️ Firebase update failed, but continuing anyway...');
                  }, 2000);
                });
              });
            } else {
              console.error('[Raid] ⚠️ No instance ID available! Cannot advance wave.');
              console.error('[Raid] instanceData:', instanceData);
              console.error('[Raid] currentInstanceId:', currentInstanceId);
            }
            
            return; // Don't grant XP/loot yet - wait for next wave
          }
        }
        
        // QUEST TRACKING: Track wave completion (for idle mode)
        if (gameMode === 'idle') {
          aliveHeroes.forEach(hero => {
            trackQuest(hero.id, 'completeWaves', 1);
          });
          
          // SPRITE RESET: Reset all hero sprites to idle after wave victory
          // This fixes heroes that died and got healed quickly before sprite state synced
          console.log('[Sprite Reset] 🎬 Resetting hero sprites to idle after wave victory');
          currentHeroes.forEach(hero => {
            // Only reset alive heroes (hp > 0) to idle
            if (hero.hp > 0 && !hero.isDead) {
              try {
                const heroRef = getHeroSpriteRef(hero.id);
                if (heroRef.current) {
                  // Force sprite to idle animation
                  heroRef.current.playAnimation('idle');
                  console.log(`[Sprite Reset] ✅ ${hero.name} reset to idle animation`);
                }
              } catch (err) {
                // Silently ignore if sprite ref is invalid or animation fails
                console.warn(`[Sprite Reset] ⚠️ Could not reset sprite for ${hero.name}:`, err);
              }
            }
          });
        }
        
        // Check if clean victory (no deaths) for difficulty adjustment
        const anyDeaths = currentHeroes.some(h => h.isDead || h.hp <= 0);
        
        if (!anyDeaths) {
          // Clean victory! Increase difficulty
          setConsecutiveWins(prev => prev + 1);
          setDifficultyModifier(prev => {
            const newDifficulty = Math.min(1.5, prev + 0.05); // +5% per win, max 150%
            if (newDifficulty !== prev) {
              const percent = (newDifficulty * 100).toFixed(0);
              if (newDifficulty >= 1.0) {
                console.log(`[Difficulty] 🔥 Increased to ${percent}%! Better loot available!`);
              } else {
                console.log(`[Difficulty] ⚖️ Recovering... ${percent}%`);
              }
            }
            return newDifficulty;
          });
        } else {
          // Had deaths, reset win streak
          setConsecutiveWins(0);
        }
        
        // Calculate total XP from defeated enemies (with difficulty bonus above 100%)
        // NEW BALANCE: enemy.xp now comes from BALANCE.enemy.xpScaling(level, difficulty)
        let totalXP = currentEnemies.reduce((sum, enemy) => sum + (enemy.xp || BALANCE.enemy.xpScaling(enemy.level, 1.0)), 0);
        
        // Loot quality bonus above 100% difficulty
        if (difficultyModifier > 1.0) {
          const lootBonus = (difficultyModifier - 1.0) * 0.6; // +6% per 10% above 100%
          totalXP = Math.floor(totalXP * (1 + lootBonus));
          console.log(`[Combat] Difficulty bonus: ${(lootBonus * 100).toFixed(0)}% extra XP!`);
        }
        
        console.log(`[Combat] Granting ${totalXP} base XP to all heroes (before XP Boost buff)`);
        
        // Calculate total gold from defeated enemies
        // NEW BALANCE: enemy.gold now comes from BALANCE.enemy.goldScaling(level, difficulty)
        const totalBaseGold = currentEnemies.reduce((sum, enemy) => {
          return sum + (enemy.gold || BALANCE.enemy.goldScaling(enemy.level, 1.0));
        }, 0);
        
        // Helper function to get founder pack gold multiplier
        const getFounderGoldMultiplier = (founderPackTier: string | null | undefined): number => {
          if (!founderPackTier) return 1.0; // No founder pack = 100% (no bonus)
          const multipliers: Record<string, number> = {
            'bronze': 1.10,  // +10% gold
            'silver': 1.20,  // +20% gold
            'gold': 1.30,    // +30% gold
            'platinum': 1.50 // +50% gold
          };
          return multipliers[founderPackTier.toLowerCase()] || 1.0;
        };
        
        // Track XP gains and level ups (for SCT outside setState)
        const xpResults: Array<{heroId: string; name: string; xp: number; leveledUp: boolean; oldLevel?: number; newLevel?: number; isDead: boolean}> = [];
        const goldResults: Array<{heroId: string; name: string; gold: number; baseGold: number; multiplier: number}> = [];
        
        // Grant XP and check for level ups (EVEN DEAD HEROES GET XP!)
        setHeroes(currentHeroes => {
          const updated = currentHeroes.map(hero => {
            // Dead heroes still gain XP (just can't fight)
            
            // Apply XP Boost buff (+50% XP)
            let xpToGrant = totalXP;
            if (hero.shopBuffs?.xpBoost && hero.shopBuffs.xpBoost.remainingDuration > 0) {
              xpToGrant = Math.floor(totalXP * 1.5); // +50% XP
              console.log(`[XP Boost] ⚡ ${hero.name} gets +50% XP! ${totalXP} → ${xpToGrant}`);
            }
            
            const newXP = (hero.xp || 0) + xpToGrant;
            const maxXP = hero.maxXp || (100 + hero.level * 10);
            
            // Calculate gold with founder pack multiplier
            const founderTier = (hero as any).founderPackTier || null;
            const goldMultiplier = getFounderGoldMultiplier(founderTier);
            const goldToGrant = Math.floor(totalBaseGold * goldMultiplier);
            
            // Track gold results for SCT
            goldResults.push({
              heroId: hero.id,
              name: hero.name,
              gold: goldToGrant,
              baseGold: totalBaseGold,
              multiplier: goldMultiplier
            });
            
            // Apply gold to hero
            const newGold = (hero.gold || 0) + goldToGrant;
            let newHero = { ...hero, xp: newXP, gold: newGold };
            
            // Track XP and gold changes for sync
            trackHeroStatChange(hero.id, {
              xp: xpToGrant,
              gold: goldToGrant
            });
            
            // Track for SCT outside setState
            const result = {
              heroId: hero.id,
              name: hero.name,
              xp: totalXP,
              leveledUp: false,
              isDead: hero.isDead || hero.hp <= 0
            };
            
            // Check for level up (CRITICAL: Cap at level 100)
            const MAX_LEVEL = 100;
            const currentLevel = hero.level || 1;
            if (newXP >= maxXP && currentLevel < MAX_LEVEL) {
              const newLevel = Math.min(currentLevel + 1, MAX_LEVEL);
              // Use polynomial formula for maxXP (matching backend)
              const calculateMaxXp = (level: number): number => {
                if (level <= 1) return 100;
                return Math.floor(40 * level * level + 300 * level - 240);
              };
              const newMaxXP = calculateMaxXp(newLevel);
              
              result.leveledUp = true;
              result.oldLevel = hero.level;
              result.newLevel = newLevel;
              
              // IMPORTANT: Recalculate ALL stats from new level + equipment (keeps it consistent!)
              const leveledHero = {
                ...hero,
                level: newLevel,
                xp: newXP - maxXP, // Carry over excess XP
                maxXp: newMaxXP
              };
              
              // Recalculate stats (includes level-based stats + gear)
              newHero = calculateHeroStats(leveledHero);
              
              // Preserve current HP ratio (don't full heal on level up)
              const hpRatio = hero.hp / hero.maxHp;
              newHero.hp = Math.floor(newHero.maxHp * hpRatio);
              newHero.xp = leveledHero.xp;
              newHero.maxXp = leveledHero.maxXp;
              
              // Track level up and stat changes for sync
              // When leveling up, XP should be set to absolute value (excess XP), not a delta
              // This prevents sync conflicts where delta calculation causes incorrect XP values
              trackHeroStatChange(hero.id, {
                level: newLevel,
                maxHp: newHero.maxHp,
                attack: newHero.attack,
                defense: newHero.defense,
                hp: newHero.hp
                // Don't track XP delta here - we'll sync absolute XP value when level changes in sync function
              });
            }
            
            xpResults.push(result);
            return newHero;
          });
          
          heroesRef.current = updated;
          return updated;
        });
        
        // Show SCT and logs OUTSIDE setState (prevents React Strict Mode duplicates)
        xpResults.forEach(result => {
          // Show XP SCT (only for alive heroes)
          if (!result.isDead) {
            const heroElement = document.querySelector(`[data-hero-id="${result.heroId}"]`);
            if (heroElement) {
              const rect = heroElement.getBoundingClientRect();
              addSCT(`${result.xp}`, rect.left + rect.width / 2, rect.top + 40, 'xp');
            }
          }
          
          // Show level up
          if (result.leveledUp) {
            console.log(`[Level Up] ✨ ${result.name} leveled up! ${result.oldLevel} → ${result.newLevel}`);
            
            const hero = heroesRef.current.find(h => h.id === result.heroId);
            if (hero) {
              console.log(`[Level Up] New stats: HP ${hero.maxHp}, ATK ${hero.attack}, DEF ${hero.defense}`);
              
              const levelUpElement = document.querySelector(`[data-hero-id="${result.heroId}"]`);
              console.log(`[Level Up SCT] Looking for element:`, result.heroId, 'Found:', !!levelUpElement);
              
              if (levelUpElement) {
                const rect = levelUpElement.getBoundingClientRect();
                console.log(`[Level Up SCT] Showing at`, rect.left, rect.top);
                setTimeout(() => {
                  addSCT('LEVEL UP!', rect.left + rect.width / 2, rect.top + 30, 'levelup');
                }, 500); // Delay after XP
              } else {
                console.warn(`[Level Up SCT] ⚠️ Element not found for ${result.heroId}`);
              }
            } else {
              console.warn(`[Level Up SCT] ⚠️ Hero not found in ref for ${result.heroId}`);
            }
          }
        });
        
        // Show gold SCT for all heroes (including dead ones, they still get gold)
        goldResults.forEach(result => {
          const hero = heroesRef.current.find(h => h.id === result.heroId);
          const isDead = hero?.isDead || hero?.hp <= 0;
          
          // Only show SCT for alive heroes
          if (!isDead) {
            const heroElement = document.querySelector(`[data-hero-id="${result.heroId}"]`);
            if (heroElement) {
              const rect = heroElement.getBoundingClientRect();
              // Show gold amount with multiplier indicator if founder pack
              if (result.multiplier > 1.0) {
                const bonusPercent = ((result.multiplier - 1.0) * 100).toFixed(0);
                console.log(`[Gold] 💰 ${result.name} earned ${result.gold}g (${result.baseGold}g base + ${bonusPercent}% founder bonus)`);
                addSCT(`💰 ${result.gold}g`, rect.left + rect.width / 2, rect.top + 60, 'gold');
              } else {
                addSCT(`💰 ${result.gold}g`, rect.left + rect.width / 2, rect.top + 60, 'gold');
              }
            }
          }
        });
        
        // Track kills for quests (all enemies defeated = kills for all alive heroes)
        const defeatedCount = currentEnemies.length;
        setHeroes(current => {
          const updated = current.map(hero => {
            if (hero.isDead || !hero.quests) return hero;
            // Would update quest kill count here (+defeatedCount kills)
            return hero;
          });
          return updated;
        });
        
        // ========================================
        // LOOT GENERATION
        // ========================================
        console.log(`[Loot] Generating loot from ${currentEnemies.length} defeated enemies (${currentEnemies.filter(e => e.isBoss).length} bosses)`);
        
        // Calculate viewer bonuses once (outside loops)
        const viewerBonuses = calculateViewerBonuses();
        
        // Note: aliveHeroes is already calculated above (line ~5312) for use in victory logic
        
        if (aliveHeroes.length === 0) {
          console.log(`[Loot] No alive heroes, skipping loot generation`);
        } else {
          // Get guaranteedLoot slots from dungeon/raid definition (with caching)
          let allowedSlots: string[] | undefined = undefined;
          const isRaidOrDungeon = gameMode === 'raid' || gameMode === 'dungeon';
          if (isRaidOrDungeon && instanceData) {
            const cacheKey = gameMode === 'dungeon' ? instanceData.dungeonId : instanceData.raidId;
            
            // Check cache first
            if (dungeonRaidDefCache.current && dungeonRaidDefCache.current.id === cacheKey && dungeonRaidDefCache.current.allowedSlots) {
              allowedSlots = dungeonRaidDefCache.current.allowedSlots;
              console.log(`[Loot] Using cached guaranteedLoot slots:`, allowedSlots);
            } else {
              try {
                if (gameMode === 'dungeon' && instanceData.dungeonId) {
                  // Fetch dungeon definition to get guaranteedLoot
                  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/dungeon/${instanceData.dungeonId}`);
                  if (response.ok) {
                    const dungeonDef = await response.json();
                    if (dungeonDef?.rewards?.guaranteedLoot) {
                      allowedSlots = dungeonDef.rewards.guaranteedLoot;
                      dungeonRaidDefCache.current = { id: cacheKey, allowedSlots };
                      console.log(`[Loot] Using dungeon guaranteedLoot slots:`, allowedSlots);
                    }
                  } else {
                    console.warn(`[Loot] Failed to fetch dungeon definition: ${response.status} ${response.statusText}`);
                  }
                } else if (gameMode === 'raid' && instanceData.raidId) {
                  // Fetch raid definition to get guaranteedLoot
                  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/raids/${instanceData.raidId}`);
                  if (response.ok) {
                    const raidDef = await response.json();
                    if (raidDef?.rewards?.guaranteedLoot) {
                      allowedSlots = raidDef.rewards.guaranteedLoot;
                      dungeonRaidDefCache.current = { id: cacheKey, allowedSlots };
                      console.log(`[Loot] Using raid guaranteedLoot slots:`, allowedSlots);
                    }
                  } else {
                    console.warn(`[Loot] Failed to fetch raid definition: ${response.status} ${response.statusText}`);
                  }
                }
              } catch (err) {
                console.warn(`[Loot] Failed to fetch dungeon/raid definition for guaranteedLoot:`, err);
                // Continue without slot restrictions if fetch fails
              }
            }
          }
          
          // Track which guaranteed slots have dropped (for bosses)
          const guaranteedSlotsDropped = new Set<string>();
          
          // Helper function to process and distribute loot
          const processLootItem = (loot: any, targetHero: Hero) => {
            if (!loot) return;
            
            console.log(`[Loot] Generated ${loot.rarity} ${loot.name} (slot: ${loot.slot})`);
            
            // Track which guaranteed slots have dropped
            if (allowedSlots?.includes(loot.slot)) {
              guaranteedSlotsDropped.add(loot.slot);
            }
            
            // ========================================
            // AUTOMATED GEAR DISTRIBUTION
            // ========================================
            // 1. Check if item is locked (skip if locked - shouldn't happen for new loot, but safety check)
            if (loot.locked) {
              console.log(`[Loot] 🔒 Skipping ${loot.name} - item is locked (unexpected for new loot)`);
              return;
            }
            
            // 2. Find best hero for this item (check ALL heroes, not just targetHero)
            let bestHero: Hero | null = null;
            let bestImprovement = 0;
            
            for (const hero of aliveHeroes) {
              // Skip if hero doesn't have this slot or slot is invalid
              if (!hero.equipment) continue;
              
              const currentItem = hero.equipment[loot.slot];
              
              // Check if current item is locked (don't replace locked items)
              if (currentItem?.locked) {
                console.log(`[Loot] 🔒 Skipping ${hero.name} - current ${loot.slot} is locked`);
                continue;
              }
              
              // Calculate improvement for this hero (role-specific, considers spell power and set bonuses)
              const improvement = calculateItemImprovement(loot, currentItem, hero, hero.equipment);
              
              if (improvement > bestImprovement) {
                bestImprovement = improvement;
                bestHero = hero;
              }
            }
            
            // 3. Make decision based on best improvement
            if (bestHero && bestImprovement > 0.1) {
              // Significantly better (>10% improvement) - auto-equip or auto-gift
              const currentItem = bestHero.equipment?.[loot.slot];
              const oldPower = currentItem ? calculateItemPower(currentItem) : 0;
              const newPower = calculateItemPower(loot);
              
              // Calculate sell value of old item
              let sellGold = 0;
              if (currentItem && !currentItem.locked) {
                const itemValue = currentItem.attack + currentItem.defense + currentItem.hp;
                const rarityMult = { common: 1, uncommon: 1.3, rare: 2, epic: 3, legendary: 4 }[currentItem.rarity as string] || 1;
                sellGold = Math.floor(itemValue * rarityMult * 0.25);
                console.log(`[Loot] 💰 Sold old ${currentItem.rarity} ${currentItem.name} for ${sellGold}g`);
              }
              
              // Update hero with new equipment and gold
              setHeroes(current => {
                const updated = current.map(h => {
                  if (h.id === bestHero!.id) {
                    const newEquipment = { ...h.equipment, [loot.slot]: loot };
                    const newGold = (h.gold || 0) + sellGold;
                    return { ...h, equipment: newEquipment, gold: newGold };
                  }
                  return h;
                });
                heroesRef.current = updated;
                return updated;
              });
              
              // Track equipment and gold changes for batch sync
              const updatedHero = heroesRef.current.find(h => h.id === bestHero!.id);
              if (updatedHero) {
                trackEquipmentChange(bestHero!.id, updatedHero.equipment);
                trackHeroStatChange(bestHero!.id, {
                  gold: updatedHero.gold - (bestHero!.gold || 0) // Track gold delta
                });
              }
              
              const action = bestHero.id === targetHero.id ? 'equipped' : 'gifted';
              console.log(`[Loot] ✅ ${loot.rarity} ${loot.name} ${action} to ${bestHero.name} (${oldPower} → ${newPower} power, ${Math.round(bestImprovement * 100)}% improvement)`);
              
              // Show rare-drop announcement for Rare/Epic/Legendary/Mythic
              if (['rare', 'epic', 'legendary', 'mythic'].includes(loot.rarity)) {
                setRareLootAnnouncement({
                  itemName: loot.name,
                  rarity: loot.rarity,
                  heroName: bestHero.name
                });
                // Auto-hide after 5 seconds
                setTimeout(() => {
                  setRareLootAnnouncement(null);
                }, 5000);
              }
              
              // Show loot SCT
              setTimeout(() => {
                const heroElement = document.querySelector(`[data-hero-id="${bestHero!.id}"]`);
                if (heroElement) {
                  const rect = heroElement.getBoundingClientRect();
                  const rarityColor = { common: '🔘', uncommon: '🟢', rare: '🔵', epic: '🟣', legendary: '🟠' }[loot.rarity] || '📦';
                  const giftIcon = bestHero!.id !== targetHero.id ? '🎁' : '';
                  addSCT(`${giftIcon}${rarityColor} ${loot.name}`, rect.left + rect.width / 2, rect.top + 35, 'loot');
                }
              }, 300);
            } else if (['epic', 'legendary', 'mythic'].includes(loot.rarity)) {
              // Epic+ items: Keep in inventory even if not better (for potential future use)
              console.log(`[Loot] 📦 Keeping ${loot.rarity} ${loot.name} in inventory (epic+ item, not better for anyone currently)`);
              
              // Add to hero inventory and sync to backend
              setHeroes(current => {
                const updated = current.map(h => {
                  if (h.id === targetHero.id) {
                    const updatedInventory = [...(h.inventory || []), loot];
                    return { ...h, inventory: updatedInventory };
                  }
                  return h;
                });
                heroesRef.current = updated;
                return updated;
              });
              
              // Track inventory change for batch sync
              const updatedHero = heroesRef.current.find(h => h.id === targetHero.id);
              if (updatedHero) {
                trackInventoryChange(targetHero.id, updatedHero.inventory);
              }
            } else {
              // Auto-sell (item not better for anyone, and not epic+)
              const itemValue = loot.attack + loot.defense + loot.hp;
              const rarityMult = { common: 1, uncommon: 1.3, rare: 2, epic: 3, legendary: 4 }[loot.rarity as string] || 1;
              const sellGold = Math.floor(itemValue * rarityMult * 0.25);
              
              // Give gold to random hero (who generated the loot)
              console.log(`[Loot] 💰 Auto-sold ${loot.rarity} ${loot.name} for ${sellGold}g (not better for anyone)`);
              
              setHeroes(current => {
                const updated = current.map(h => {
                  if (h.id === targetHero.id) {
                    return { ...h, gold: (h.gold || 0) + sellGold };
                  }
                  return h;
                });
                heroesRef.current = updated;
                return updated;
              });
              
              // Track gold change for batch sync
              const updatedHero = heroesRef.current.find(h => h.id === targetHero.id);
              if (updatedHero) {
                trackHeroStatChange(targetHero.id, {
                  gold: updatedHero.gold - (targetHero.gold || 0) // Track gold delta
                });
              }
            }
          };
          
          // Generate loot for each defeated enemy
          for (const enemy of currentEnemies) {
            // Reset guaranteed slots tracking for each enemy
            guaranteedSlotsDropped.clear();
            
            // Loot chance: 100% for bosses, 30% for regular enemies
            const lootChance = enemy.isBoss ? 1.0 : 0.3;
            const shouldDropLoot = Math.random() <= lootChance;
            
            if (!shouldDropLoot && (!enemy.isBoss || !allowedSlots || allowedSlots.length === 0)) {
              console.log(`[Loot] No loot from ${enemy.name}`);
              continue;
            }
            
            // Bosses drop 2-4 items, regular enemies drop 1
            let numItems = enemy.isBoss ? Math.floor(2 + Math.random() * 3) : 1;
            
            // For bosses with guaranteedLoot, ensure we drop at least one per guaranteed slot
            if (enemy.isBoss && allowedSlots && allowedSlots.length > 0) {
              // Ensure we have enough drops to cover all guaranteed slots
              numItems = Math.max(numItems, allowedSlots.length);
              console.log(`[Loot] ${enemy.name} (BOSS) will drop ${numItems} item(s) to ensure all guaranteed slots:`, allowedSlots);
            } else {
              console.log(`[Loot] ${enemy.name} drops ${numItems} item(s)`);
            }
            
            for (let i = 0; i < numItems; i++) {
              const randomHero = aliveHeroes[Math.floor(Math.random() * aliveHeroes.length)];
              
              // For guaranteed slots that haven't dropped yet, force that slot
              let slotRestriction = allowedSlots;
              if (enemy.isBoss && allowedSlots && allowedSlots.length > 0) {
                const missingSlots = allowedSlots.filter(slot => !guaranteedSlotsDropped.has(slot));
                if (missingSlots.length > 0 && i < missingSlots.length) {
                  slotRestriction = [missingSlots[i]]; // Force this specific guaranteed slot
                  console.log(`[Loot] Forcing guaranteed slot drop: ${missingSlots[i]}`);
                }
              }
              
              const loot = generateLoot(randomHero.role, {
                enemyLevel: enemy.level || 1,
                waveCount: waveCount,
                isBoss: enemy.isBoss || false,
                viewerLootBonus: viewerBonuses.loot || 0,
                isRaidOrDungeon: isRaidOrDungeon, // Raids/dungeons get stronger mythic (4.0x vs 3.5x)
                allowedSlots: slotRestriction // Restrict to guaranteedLoot slots if available
              });
              
              processLootItem(loot, randomHero);
            }
          }
        }
        
        // Note: Raid wave progression is handled above (lines 4849-4929) and returns early
        // This section is only reached for idle/dungeon modes
        // IDLE MODE: Normal victory - clear combat state immediately and spawn next wave
        if (gameMode === 'idle') {
          // Clear combat state IMMEDIATELY (don't wait for loot animations)
          console.log('[Idle Mode] ✅ Wave complete! Clearing combat state...');
          setEnemies([]);
          enemiesRef.current = [];
          setInCombat(false);
          combatInProgress.current = false;
          
          // Spawn next wave after loot animations complete
          setTimeout(() => {
            console.log('[Idle Mode] 🎮 Spawning next wave...');
            // Use the existing adventureTick function to handle wave progression
            // This will properly call spawnEnemies, handleTreasure, or handleGathering
            if (adventureTickRef.current) {
              adventureTickRef.current();
            } else {
              console.warn('[Idle Mode] ⚠️ adventureTick not available, spawning enemies directly');
              // Fallback: spawn enemies directly if adventureTick not available
              const isBossWave = (waveCount + 1) % 10 === 0;
              setWaveCount(prev => prev + 1);
              setTimeout(() => {
                // We need to access spawnEnemies - this is a workaround
                // In practice, adventureTickRef should always be available
                console.log('[Idle Mode] Using fallback spawn - adventureTick should be set');
              }, 100);
            }
          }, 2000); // Delay to allow loot animations to complete
        }
      } else if (aliveHeroes.length === 0) {
        // TOTAL PARTY WIPE - Handle differently for raid/dungeon vs idle
        console.log('[Combat] 💀 TOTAL PARTY WIPE! All heroes died.');
        
        // RAID/DUNGEON MODE: Mark instance as failed and return to idle
        if ((gameMode === 'raid' || gameMode === 'dungeon') && instanceData) {
          console.log(`[${gameMode === 'raid' ? 'Raid' : 'Dungeon'}] 💀 Party wipe! Marking instance as failed...`);
          
          // Clear combat state
          setEnemies([]);
          enemiesRef.current = [];
          setInCombat(false);
          combatInProgress.current = false;
          
          // Mark instance as failed in Firebase (this will trigger listener to return to idle)
          const instanceId = instanceData.id || currentInstanceId;
          if (instanceId) {
            const collection = gameMode === 'raid' ? 'raidInstances' : 'dungeonInstances';
            import('firebase/firestore').then(({ doc, updateDoc }) => {
              updateDoc(doc(db, collection, instanceId), {
                status: 'failed',
                failedAt: new Date(),
                failureReason: 'Party wipe - all heroes died'
              }).then(() => {
                console.log(`[${gameMode === 'raid' ? 'Raid' : 'Dungeon'}] ✅ Marked as failed - returning to idle mode`);
                // Instance listener will detect status change and return to idle
              }).catch(err => {
                console.error(`[${gameMode === 'raid' ? 'Raid' : 'Dungeon'}] Failed to mark as failed:`, err);
                // Even if Firebase update fails, clear state and return to idle
                setTimeout(() => {
                  setEnemies([]);
                  enemiesRef.current = [];
                  setInCombat(false);
                  combatInProgress.current = false;
                  setInstanceData(null);
                  setGameMode('idle');
                }, 2000);
              });
            });
          } else {
            // No instance ID - clear state and return to idle anyway
            console.warn(`[${gameMode === 'raid' ? 'Raid' : 'Dungeon'}] No instance ID, clearing state and returning to idle`);
            setTimeout(() => {
              setEnemies([]);
              enemiesRef.current = [];
              setInCombat(false);
              combatInProgress.current = false;
              setInstanceData(null);
              setGameMode('idle');
            }, 2000);
          }
          
          return; // Don't continue with idle mode wipe logic
        }
        
        // IDLE MODE: Resurrect all heroes, clear enemies, lower difficulty
        console.log('[Combat] Sending party to camp...');
        
        setTimeout(() => {
          // Resurrect all heroes with full HP
          setHeroes(currentHeroes => {
            const resurrected = currentHeroes.map(hero => {
              if (hero.isDead || hero.hp <= 0) {
                console.log(`[Wipe] ✨ Resurrecting ${hero.name} with full HP`);
                
                // Reset animation to idle
                const heroRef = getHeroSpriteRef(hero.id);
                if (heroRef.current) {
                  heroRef.current.playAnimation('idle');
                }
                
                return {
                  ...hero,
                  hp: hero.maxHp, // Full HP
                  isDead: false,
                  deathTime: undefined
                };
              }
              return hero;
            });
            
            heroesRef.current = resurrected;
            return resurrected;
          });
          
          // Clear enemies
          setEnemies([]);
          enemiesRef.current = [];
          setInCombat(false);
          combatInProgress.current = false;
          
          // Reset win streak and lower difficulty by 10% (minimum 40%)
          setConsecutiveWins(0);
          setDifficultyModifier(prev => {
            const newDifficulty = Math.max(0.4, prev - 0.1);
            console.log(`[Wipe] 🚨 Difficulty lowered: ${(prev * 100).toFixed(0)}% → ${(newDifficulty * 100).toFixed(0)}%`);
            return newDifficulty;
          });
          
          console.log('[Wipe] ✅ Party resurrected! Adventure will continue...');
        }, 2000); // 2 second delay to show defeat
      } else if (aliveEnemies.length > 0 && aliveHeroes.length > 0) {
        // Combat continues
        console.log('[Combat] Round complete. Starting new round in 1s...');
        setTimeout(() => {
          startCombatRound();
        }, 1000); // Simple 1s delay
      }
    };

    // OLD executeHeal removed - using new one with Cursed debuff support (line ~1217)

    startCombatRound();

    // Cleanup
    return () => {
      if (combatRoundTimeoutRef.current) {
        clearTimeout(combatRoundTimeoutRef.current);
        combatRoundTimeoutRef.current = null;
      }
      combatInProgress.current = false;
    };
  }, [allHeroes?.length, enemies?.length, inCombat]); // Removed testHealer to prevent restart on shield change

  // Step 7: Sync hero state to Firebase every 60 seconds (low-cost persistence)
  useEffect(() => {
    // Only initialize once when heroes first become available
    if (heroes.length === 0 || syncIntervalInitializedRef.current) {
      return;
    }
    
    syncIntervalInitializedRef.current = true;
    console.log('[Sync] ✅ Starting periodic sync (every 60s) for', heroes.length, 'heroes');

    const syncInterval = setInterval(async () => {
      // Use heroesRef to get the latest heroes state (it's kept in sync via setHeroes calls)
      const currentHeroes = heroesRef.current.length > 0 ? heroesRef.current : [];
      if (currentHeroes.length === 0) {
        console.log('[Sync] ⚠️ No heroes available to sync');
        return;
      }
      console.log('[Sync] Syncing', currentHeroes.length, 'heroes to Firebase...');
      
      // QUEST TRACKING: Batch sync quest progress to backend
      const now = Date.now();
      const timeSinceLastSync = now - lastQuestSyncRef.current;
      
      // Debug logging for quest sync status
      if (questProgressRef.current.size > 0) {
        console.log(`[Quest Sync] 🔍 Pending quest progress for ${questProgressRef.current.size} heroes (${Math.floor(timeSinceLastSync / 1000)}s since last sync)`);
        // Log quest progress details for debugging
        questProgressRef.current.forEach((heroProgress, heroId) => {
          const trackingKeys = Array.from(heroProgress.keys());
          const hero = currentHeroes.find(h => h.id === heroId);
          console.log(`[Quest Sync]   Hero ${heroId} (${hero?.name || 'unknown'}): ${trackingKeys.length} tracking keys:`, 
            trackingKeys.map(key => `${key}:${heroProgress.get(key)}`).join(', '));
        });
      }
      
      if (questProgressRef.current.size > 0 && timeSinceLastSync >= 300000) { // Increased to 5 minutes
        console.log('[Quest Sync] ✅ Syncing quest progress for', questProgressRef.current.size, 'heroes...');
        
        // Convert Map to array of updates for batch API
        const questUpdates: Array<{ userId: string; updates: Array<{ trackingKey: string; type: 'daily' | 'weekly' | 'monthly'; increment: number }> }> = [];
        
        questProgressRef.current.forEach((heroProgress, heroId) => {
          const hero = currentHeroes.find(h => h.id === heroId);
          if (!hero) return;
          
          // Get hero's Twitch ID for backend
          const twitchUserId = (hero as any).twitchUserId || (hero as any).twitchId;
          if (!twitchUserId) {
            console.warn(`[Quest Sync] ⚠️ No twitchUserId for hero ${heroId}, skipping quest sync`);
            return;
          }
          
          const updates: Array<{ trackingKey: string; type: 'daily' | 'weekly' | 'monthly'; increment: number }> = [];
          
          heroProgress.forEach((count, trackingKey) => {
            if (count > 0) {
              // Send to all three quest types (backend will filter by active quests)
              updates.push({ trackingKey, type: 'daily', increment: count });
              updates.push({ trackingKey, type: 'weekly', increment: count });
              updates.push({ trackingKey, type: 'monthly', increment: count });
            }
          });
          
          if (updates.length > 0) {
            questUpdates.push({ userId: twitchUserId, updates });
          }
        });
        
        // Send batch quest update to backend
        if (questUpdates.length > 0) {
          try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/quests/update-batch-all`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ updates: questUpdates })
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error('[Quest Sync] ❌ Failed to sync quest progress:', response.status, errorText);
              return;
            }
            
            const result = await response.json();
            console.log('[Quest Sync] ✅ Quest progress synced:', result);
            
            // Check for completed quests and show SCT
            if (result.success && result.results) {
              result.results.forEach((userResult: any) => {
                if (userResult.completedQuests && userResult.completedQuests.length > 0) {
                  userResult.completedQuests.forEach((completedQuest: any) => {
                    console.log(`[Quest Complete] 🎉 ${completedQuest.questName} completed!`);
                    
                    // Show SCT for quest completion
                    const hero = currentHeroes.find(h => (h as any).twitchUserId === userResult.userId || (h as any).twitchId === userResult.userId);
                    if (hero) {
                      const heroElement = document.querySelector(`[data-hero-id="${hero.id}"]`);
                      if (heroElement) {
                        const rect = heroElement.getBoundingClientRect();
                        addSCT(`Quest Complete!`, rect.left + rect.width / 2, rect.top - 20, 'questcomplete');
                      }
                    }
                  });
                }
              });
            }
            
            // Clear quest progress after successful sync
            console.log('[Quest Sync] 🧹 Clearing quest progress cache after successful sync');
            questProgressRef.current.clear();
            lastQuestSyncRef.current = now;
            
            // AUTO-CLAIM: Claim all completed quests for each hero
            currentHeroes.forEach(async (hero) => {
              const twitchUserId = (hero as any).twitchUserId || (hero as any).twitchId;
              if (!twitchUserId) return;
              
              try {
                const claimResponse = await questAPI.claimAllQuests(twitchUserId);
                
                if (claimResponse.success && claimResponse.claimed > 0) {
                  console.log(`[Quest Auto-Claim] ✅ ${hero.name} claimed ${claimResponse.claimed} quests!`);
                  console.log(`[Quest Auto-Claim] Rewards:`, claimResponse.totalRewards);
                  
                  // Show SCT for auto-claimed rewards
                  const heroElement = document.querySelector(`[data-hero-id="${hero.id}"]`);
                  if (heroElement) {
                    const rect = heroElement.getBoundingClientRect();
                    
                    // Show gold reward
                    if (claimResponse.totalRewards.gold > 0) {
                      addSCT(`+${claimResponse.totalRewards.gold}g`, rect.left + rect.width / 2, rect.top - 30, 'loot');
                    }
                    
                    // Show XP reward
                    if (claimResponse.totalRewards.xp > 0) {
                      setTimeout(() => {
                        addSCT(`+${claimResponse.totalRewards.xp} XP`, rect.left + rect.width / 2, rect.top - 10, 'xp');
                      }, 300);
                    }
                    
                    // Show token reward
                    if (claimResponse.totalRewards.tokens > 0) {
                      setTimeout(() => {
                        addSCT(`+${claimResponse.totalRewards.tokens} 🪙`, rect.left + rect.width / 2, rect.top + 10, 'loot');
                      }, 600);
                    }
                  }
                  
                  // If leveled up, show level up notification
                  if (claimResponse.levelUp) {
                    const heroElement = document.querySelector(`[data-hero-id="${hero.id}"]`);
                    if (heroElement) {
                      const rect = heroElement.getBoundingClientRect();
                      setTimeout(() => {
                        addSCT(`LEVEL ${claimResponse.levelUp}!`, rect.left + rect.width / 2, rect.top - 50, 'levelup');
                      }, 900);
                    }
                  }
                }
              } catch (error: any) {
                console.error(`[Quest Auto-Claim] ❌ Failed to auto-claim for ${hero.name}:`, error);
              }
            });
          } catch (error) {
            console.error('[Quest Sync] ❌ Failed to sync quest progress:', error);
          }
        }
        
        // AUTO-PURCHASE BATCH SYNC: Sync pending purchases to backend
        const timeSinceLastPurchaseSync = now - lastPurchaseSyncRef.current;
        if (pendingPurchasesRef.current.size > 0 && timeSinceLastPurchaseSync >= 300000) { // Increased to 5 minutes
          console.log('[Purchase Sync] Syncing auto-purchases for', pendingPurchasesRef.current.size, 'heroes...');
          
          // Process each hero's pending purchases
          const purchasePromises: Promise<void>[] = [];
          
          pendingPurchasesRef.current.forEach((purchases, heroId) => {
            const hero = currentHeroes.find(h => h.id === heroId);
            if (!hero || purchases.length === 0) return;
            
            // Group purchases by itemKey and sum quantities
            const groupedPurchases = new Map<string, number>();
            purchases.forEach(p => {
              const current = groupedPurchases.get(p.itemKey) || 0;
              groupedPurchases.set(p.itemKey, current + p.quantity);
            });
            
            // Create API calls for each unique item
            groupedPurchases.forEach((quantity, itemKey) => {
              purchasePromises.push(
                heroAPI.purchaseGoldItem(heroId, itemKey, quantity)
                  .then(() => {
                    console.log(`[Purchase Sync] ✅ Synced ${quantity}x ${itemKey} for hero ${heroId}`);
                  })
                  .catch(err => {
                    console.error(`[Purchase Sync] ❌ Failed to sync ${quantity}x ${itemKey} for hero ${heroId}:`, err);
                  })
              );
            });
          });
          
          // Wait for all purchases to complete
          if (purchasePromises.length > 0) {
            Promise.all(purchasePromises).then(async () => {
              console.log('[Purchase Sync] ✅ All purchases synced');
              
              // Clear pending purchases after successful sync
              pendingPurchasesRef.current.clear();
              lastPurchaseSyncRef.current = now;
              
              // Note: Items are now in inventory. Buffs and potions will be auto-used during combat.
              // The Firebase listener will sync inventory updates to browser source automatically.
            }).catch(err => {
              console.error('[Purchase Sync] ❌ Some purchases failed to sync:', err);
              // Still clear to prevent accumulation, but log error
              pendingPurchasesRef.current.clear();
              lastPurchaseSyncRef.current = now;
            });
          }
        }
        
        // AUTO-GATHER BATCH SYNC: Sync pending gathers to backend
        const timeSinceLastGatherSync = now - lastGatherSyncRef.current;
        if (pendingGathersRef.current.size > 0 && timeSinceLastGatherSync >= 300000) { // Increased to 5 minutes
          console.log('[Gather Sync] Syncing auto-gathers for', pendingGathersRef.current.size, 'heroes...');
          
          // Process each hero's pending gathers
          const gatherPromises: Promise<void>[] = [];
          
          pendingGathersRef.current.forEach((gatherCount, heroId) => {
            const hero = currentHeroes.find(h => h.id === heroId);
            if (!hero || gatherCount === 0) return;
            
            // Call gather API for each gather (or batch if API supports it)
            // Note: gather API uses userId (heroId), but we need to get the user's Twitch ID
            // For now, use heroId directly (backend should handle conversion if needed)
            for (let i = 0; i < gatherCount; i++) {
              gatherPromises.push(
                heroAPI.gather(heroId)
                  .then(() => {
                    console.log(`[Gather Sync] ✅ Synced gather ${i + 1}/${gatherCount} for hero ${heroId}`);
                  })
                  .catch(err => {
                    console.error(`[Gather Sync] ❌ Failed to sync gather ${i + 1}/${gatherCount} for hero ${heroId}:`, err);
                  })
              );
            }
          });
          
          // Wait for all gathers to complete
          if (gatherPromises.length > 0) {
            Promise.all(gatherPromises).then(async () => {
              console.log('[Gather Sync] ✅ All gathers synced');
              
              // Clear pending gathers after successful sync
              pendingGathersRef.current.clear();
              lastGatherSyncRef.current = now;
            }).catch(err => {
              console.error('[Gather Sync] ❌ Some gathers failed to sync:', err);
              // Still clear to prevent accumulation, but log error
              pendingGathersRef.current.clear();
              lastGatherSyncRef.current = now;
            });
          }
        }
        
        // HERO STAT BATCH SYNC: Sync accumulated hero stat changes to backend
        const timeSinceLastHeroStatSync = now - lastHeroStatSyncRef.current;
        if (heroStatChangesRef.current.size > 0 && timeSinceLastHeroStatSync >= 300000) { // Increased to 5 minutes
          console.log('[Hero Stat Sync] ✅ Syncing hero stat changes for', heroStatChangesRef.current.size, 'heroes...');
          
          // Process each hero's stat changes
          const statSyncPromises: Promise<void>[] = [];
          
          heroStatChangesRef.current.forEach((changes, heroId) => {
            const hero = currentHeroes.find(h => h.id === heroId);
            if (!hero) return;
            
            // Build update object with current hero state + accumulated changes
            const updateData: Partial<Hero> = {};
            
            // CRITICAL: Level sync protection for prestiged heroes and level cap
            // If level is changing, use absolute XP and maxXp from local state (excess after level up)
            if (changes.level !== undefined) {
              // When level changes, sync absolute XP value from local state to avoid delta calculation issues
              // The local state already has the correct excess XP after level up
              updateData.xp = hero.xp !== undefined ? Math.max(0, hero.xp) : 0;
              // Also sync maxXp when level changes (it's already set correctly in local state)
              if (hero.maxXp !== undefined) {
                updateData.maxXp = hero.maxXp;
              }
              const prestigeLevel = (hero as any).prestigeLevel || 0;
              const MAX_LEVEL = 100;
              let newLevel = changes.level;
              
              // Always cap at MAX_LEVEL
              if (newLevel > MAX_LEVEL) {
                console.warn(`[Hero Stat Sync] ⚠️ Attempted to sync level ${newLevel} for hero ${hero.name}, capping at ${MAX_LEVEL}`);
                newLevel = MAX_LEVEL;
              }
              
              // CRITICAL: If hero has prestiged, NEVER sync a level > 100
              // Prestiged heroes should always be between 1-100
              if (prestigeLevel > 0 && newLevel > MAX_LEVEL) {
                console.error(`[Hero Stat Sync] 🚨 BLOCKED: Prestiged hero ${hero.name} (P${prestigeLevel}) attempted to sync level ${newLevel}. Forcing level 1.`);
                newLevel = 1;
                // Also reset XP to 0 for prestiged heroes that somehow got > 100
                updateData.xp = 0;
                updateData.maxXp = 100; // Initial level 1 maxXp
              }
              
              // Only sync level if it's valid
              if (newLevel >= 1 && newLevel <= MAX_LEVEL) {
                updateData.level = newLevel;
              } else {
                console.error(`[Hero Stat Sync] 🚨 Invalid level ${newLevel} for hero ${hero.name}, skipping level sync`);
              }
            } else {
              // Apply XP delta (add to current XP) - only when level is NOT changing
              if (changes.xp !== undefined && changes.xp !== 0) {
                const currentXP = hero.xp || 0;
                let newXP = Math.max(0, currentXP + changes.xp);
                
                // CRITICAL: Cap XP at maxXp for level 100
                const MAX_LEVEL = 100;
                if ((hero.level || 1) >= MAX_LEVEL) {
                  const maxXpForLevel100 = hero.maxXp || 100000; // Fallback
                  newXP = Math.min(newXP, maxXpForLevel100);
                }
                
                updateData.xp = newXP;
              }
            }
            
            // Apply gold delta (add to current gold)
            if (changes.gold !== undefined && changes.gold !== 0) {
              const currentGold = hero.gold || 0;
              updateData.gold = Math.max(0, currentGold + changes.gold);
            }
            if (changes.hp !== undefined) {
              updateData.hp = changes.hp;
            }
            if (changes.maxHp !== undefined) {
              updateData.maxHp = changes.maxHp;
            }
            if (changes.attack !== undefined) {
              updateData.attack = changes.attack;
            }
            if (changes.defense !== undefined) {
              updateData.defense = changes.defense;
            }
            
            // Apply stats deltas
            if (changes.stats) {
              const currentStats = (hero as any).stats || { totalDamage: 0, totalHealing: 0, damageBlocked: 0 };
              (updateData as any).stats = {
                totalDamage: currentStats.totalDamage || 0,
                totalHealing: currentStats.totalHealing || 0,
                damageBlocked: (currentStats.damageBlocked || 0) + (changes.stats.damageBlocked || 0)
              };
              if (changes.stats.totalDamage !== undefined) {
                (updateData as any).stats.totalDamage = (currentStats.totalDamage || 0) + changes.stats.totalDamage;
              }
              if (changes.stats.totalHealing !== undefined) {
                (updateData as any).stats.totalHealing = (currentStats.totalHealing || 0) + changes.stats.totalHealing;
              }
            }
            
            // Only sync if there are actual changes
            if (Object.keys(updateData).length > 0) {
              statSyncPromises.push(
                heroAPI.updateHeroById(heroId, updateData)
                  .then(() => {
                    console.log(`[Hero Stat Sync] ✅ Synced stats for ${hero.name} (${Object.keys(updateData).join(', ')})`);
                  })
                  .catch(err => {
                    console.error(`[Hero Stat Sync] ❌ Failed to sync stats for ${hero.name}:`, err);
                  })
              );
            }
          });
          
          // Wait for all stat syncs to complete
          if (statSyncPromises.length > 0) {
            Promise.all(statSyncPromises).then(async () => {
              console.log('[Hero Stat Sync] ✅ All hero stat changes synced');
              
              // Clear stat changes after successful sync
              heroStatChangesRef.current.clear();
              lastHeroStatSyncRef.current = now;
            }).catch(err => {
              console.error('[Hero Stat Sync] ❌ Some hero stat syncs failed:', err);
              // Still clear to prevent accumulation, but log error
              heroStatChangesRef.current.clear();
              lastHeroStatSyncRef.current = now;
            });
          } else {
            // No changes to sync, but still update timestamp
            lastHeroStatSyncRef.current = now;
          }
        }
        
        // EQUIPMENT BATCH SYNC: Sync accumulated equipment changes to backend
        const timeSinceLastEquipmentSync = now - lastEquipmentSyncRef.current;
        if (equipmentChangesRef.current.size > 0 && timeSinceLastEquipmentSync >= 300000) { // Increased to 5 minutes
          console.log('[Equipment Sync] ✅ Syncing equipment changes for', equipmentChangesRef.current.size, 'heroes...');
          
          // Process each hero's equipment changes
          const equipmentSyncPromises: Promise<void>[] = [];
          
          equipmentChangesRef.current.forEach((equipment, heroId) => {
            const hero = currentHeroes.find(h => h.id === heroId);
            if (!hero) return;
            
            // Use the current hero's equipment (latest state)
            const currentEquipment = hero.equipment || {};
            const lastSynced = lastSyncedEquipmentRef.current.get(heroId) || {};
            
            // Check if equipment actually changed by comparing JSON strings
            const currentEquipmentStr = JSON.stringify(currentEquipment);
            const lastSyncedStr = JSON.stringify(lastSynced);
            
            // Only sync if equipment actually changed
            if (currentEquipmentStr !== lastSyncedStr) {
              equipmentSyncPromises.push(
                heroAPI.updateHeroById(heroId, {
                  equipment: currentEquipment
                })
                  .then(() => {
                    console.log(`[Equipment Sync] ✅ Synced equipment for ${hero.name}`);
                    // Store last synced equipment
                    lastSyncedEquipmentRef.current.set(heroId, JSON.parse(currentEquipmentStr));
                  })
                  .catch(err => {
                    console.error(`[Equipment Sync] ❌ Failed to sync equipment for ${hero.name}:`, err);
                  })
              );
            } else {
              console.log(`[Equipment Sync] ⏭️ Skipping ${hero.name} - no equipment changes detected`);
            }
          });
          
          // Wait for all equipment syncs to complete
          if (equipmentSyncPromises.length > 0) {
            Promise.all(equipmentSyncPromises).then(async () => {
              console.log('[Equipment Sync] ✅ All equipment changes synced');
              
              // Clear equipment changes after successful sync
              equipmentChangesRef.current.clear();
              lastEquipmentSyncRef.current = now;
            }).catch(err => {
              console.error('[Equipment Sync] ❌ Some equipment syncs failed:', err);
              // Still clear to prevent accumulation, but log error
              equipmentChangesRef.current.clear();
              lastEquipmentSyncRef.current = now;
            });
          } else {
            // No changes to sync, but still update timestamp
            lastEquipmentSyncRef.current = now;
            // Clear tracking since nothing changed
            equipmentChangesRef.current.clear();
          }
        }
        
        // INVENTORY BATCH SYNC: Sync accumulated inventory changes to backend
        const timeSinceLastInventorySync = now - lastInventorySyncRef.current;
        if (inventoryChangesRef.current.size > 0 && timeSinceLastInventorySync >= 300000) { // Increased to 5 minutes
          console.log('[Inventory Sync] ✅ Syncing inventory changes for', inventoryChangesRef.current.size, 'heroes...');
          
          // Process each hero's inventory changes
          const inventorySyncPromises: Promise<void>[] = [];
          
          inventoryChangesRef.current.forEach((inventory, heroId) => {
            const hero = currentHeroes.find(h => h.id === heroId);
            if (!hero) return;
            
            // Use the current hero's inventory (latest state)
            const currentInventory = hero.inventory || [];
            const lastSynced = lastSyncedInventoryRef.current.get(heroId) || [];
            
            // Check if inventory actually changed by comparing array lengths and item IDs
            const currentIds = currentInventory.map((item: any) => item.id).sort().join(',');
            const lastSyncedIds = lastSynced.map((item: any) => item.id).sort().join(',');
            
            // Also check for quantity changes by comparing JSON (handles quantity updates)
            const currentInventoryStr = JSON.stringify(currentInventory.map((item: any) => ({ id: item.id, quantity: item.quantity || 1 })).sort((a: any, b: any) => a.id.localeCompare(b.id)));
            const lastSyncedStr = JSON.stringify(lastSynced.map((item: any) => ({ id: item.id, quantity: item.quantity || 1 })).sort((a: any, b: any) => a.id.localeCompare(b.id)));
            
            // Only sync if inventory actually changed
            if (currentIds !== lastSyncedIds || currentInventoryStr !== lastSyncedStr) {
              inventorySyncPromises.push(
                heroAPI.updateHeroById(heroId, {
                  inventory: currentInventory
                })
                  .then(() => {
                    console.log(`[Inventory Sync] ✅ Synced inventory for ${hero.name} (${currentInventory.length} items)`);
                    // Store last synced inventory (deep copy)
                    lastSyncedInventoryRef.current.set(heroId, JSON.parse(JSON.stringify(currentInventory)));
                  })
                  .catch(err => {
                    console.error(`[Inventory Sync] ❌ Failed to sync inventory for ${hero.name}:`, err);
                  })
              );
            } else {
              console.log(`[Inventory Sync] ⏭️ Skipping ${hero.name} - no inventory changes detected`);
            }
          });
          
          // Wait for all inventory syncs to complete
          if (inventorySyncPromises.length > 0) {
            Promise.all(inventorySyncPromises).then(async () => {
              console.log('[Inventory Sync] ✅ All inventory changes synced');
              
              // Clear inventory changes after successful sync
              inventoryChangesRef.current.clear();
              lastInventorySyncRef.current = now;
            }).catch(err => {
              console.error('[Inventory Sync] ❌ Some inventory syncs failed:', err);
              // Still clear to prevent accumulation, but log error
              inventoryChangesRef.current.clear();
              lastInventorySyncRef.current = now;
            });
          } else {
            // No changes to sync, but still update timestamp
            lastInventorySyncRef.current = now;
            // Clear tracking since nothing changed
            inventoryChangesRef.current.clear();
          }
        }
        
        // PROFESSION MATERIALS BATCH SYNC: Sync accumulated profession materials to backend
        const timeSinceLastProfessionMaterialsSync = now - lastProfessionMaterialsSyncRef.current;
        if (professionMaterialsRef.current.size > 0 && timeSinceLastProfessionMaterialsSync >= 300000) { // Increased to 5 minutes
          console.log('[Profession Materials Sync] ✅ Syncing profession materials for', professionMaterialsRef.current.size, 'heroes...');
          
          // Process each hero's profession materials changes
          const professionMaterialsSyncPromises: Promise<void>[] = [];
          
          professionMaterialsRef.current.forEach((materialChanges, heroId) => {
            const hero = currentHeroes.find(h => h.id === heroId);
            if (!hero || !hero.profession) return;
            
            // Merge accumulated changes with current profession materials
            const currentMaterials = hero.profession.materials || {};
            const updatedMaterials: any = { ...currentMaterials };
            
            // Apply material changes (deltas)
            Object.keys(materialChanges).forEach(materialType => {
              if (materialType === 'essence') {
                updatedMaterials.essence = (currentMaterials.essence || 0) + (materialChanges.essence || 0);
              } else if (materialType === 'herbs') {
                updatedMaterials.herbs = { ...(currentMaterials.herbs || {}) };
                Object.keys(materialChanges.herbs || {}).forEach((herbType: string) => {
                  updatedMaterials.herbs[herbType] = ((currentMaterials.herbs as any)?.[herbType] || 0) + ((materialChanges.herbs as any)?.[herbType] || 0);
                });
              } else if (materialType === 'ore') {
                updatedMaterials.ore = { ...(currentMaterials.ore || {}) };
                Object.keys(materialChanges.ore || {}).forEach((oreType: string) => {
                  updatedMaterials.ore[oreType] = ((currentMaterials.ore as any)?.[oreType] || 0) + ((materialChanges.ore as any)?.[oreType] || 0);
                });
              }
            });
            
            // Only sync if there are actual changes
            if (Object.keys(materialChanges).length > 0) {
              professionMaterialsSyncPromises.push(
                heroAPI.updateHeroById(heroId, {
                  profession: {
                    ...hero.profession,
                    materials: updatedMaterials
                  } as any
                })
                  .then(() => {
                    console.log(`[Profession Materials Sync] ✅ Synced materials for ${hero.name} (${Object.keys(materialChanges).join(', ')})`);
                  })
                  .catch(err => {
                    console.error(`[Profession Materials Sync] ❌ Failed to sync materials for ${hero.name}:`, err);
                  })
              );
            }
          });
          
          // Wait for all profession materials syncs to complete
          if (professionMaterialsSyncPromises.length > 0) {
            Promise.all(professionMaterialsSyncPromises).then(async () => {
              console.log('[Profession Materials Sync] ✅ All profession materials synced');
              
              // Clear profession materials changes after successful sync
              professionMaterialsRef.current.clear();
              lastProfessionMaterialsSyncRef.current = now;
            }).catch(err => {
              console.error('[Profession Materials Sync] ❌ Some profession materials syncs failed:', err);
              // Still clear to prevent accumulation, but log error
              professionMaterialsRef.current.clear();
              lastProfessionMaterialsSyncRef.current = now;
            });
          } else {
            // No changes to sync, but still update timestamp
            lastProfessionMaterialsSyncRef.current = now;
          }
        }
      }
    }, 600000); // Every 10 minutes (increased from 5 minutes to further reduce Firebase writes)
    
    syncIntervalRef.current = syncInterval;

    return () => {
      // Only clean up on component unmount, not on heroes change
      if (syncIntervalRef.current) {
        console.log('[Sync] 🧹 Component unmounting, cleaning up sync interval');
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
        syncIntervalInitializedRef.current = false;
      }
    };
  }, [heroes.length]); // Only depend on length - initialize when heroes first become available

  // Step 8: Hero resurrection system (auto-res after 60 seconds)
  useEffect(() => {
    // Prevent duplicate resurrection intervals
    if (resIntervalRef.current) {
      return;
    }

    const resInterval = setInterval(() => {
      // FIX: Use heroesRef.current instead of heroes state to get latest heroes
      const currentHeroes = heroesRef.current;
      if (!currentHeroes || currentHeroes.length === 0) return;
      
      const now = Date.now();
      
      // Update resurrection timers for display
      const newTimers: Record<string, number> = {};
      currentHeroes.forEach(hero => {
        if (hero.isDead && hero.deathTime) {
          const timeRemaining = Math.max(0, 60000 - (now - hero.deathTime));
          newTimers[hero.id] = timeRemaining;
        }
      });
      setResurrectionTimers(newTimers);
      
      // Check for resurrections
      setHeroes(currentHeroes => {
        let anyResurrected = false;
        const updated = currentHeroes.map(hero => {
          // Check if hero is dead and resurrection time has passed
          if (hero.isDead && hero.deathTime && (now - hero.deathTime >= 60000)) {
            console.log(`[Resurrection] ✨ ${hero.name} auto-resurrected with 50% HP!`);
            anyResurrected = true;
            
            // Resurrect with 50% HP
            const resHp = Math.floor(hero.maxHp * 0.5);
            
            // ANIMATION: Force return to idle (with small delay to ensure sprite is ready)
            setTimeout(() => {
              const heroRef = getHeroSpriteRef(hero.id);
              if (heroRef.current) {
                try {
                  heroRef.current.playAnimation('idle');
                  console.log(`[Resurrection] 🎬 ${hero.name} returned to idle animation (auto-res)`);
                } catch (err) {
                  console.warn(`[Resurrection] ⚠️ Could not play idle animation for ${hero.name}:`, err);
                }
              } else {
                console.warn(`[Resurrection] ⚠️ No sprite ref for ${hero.name}`);
              }
            }, 100);
            
            return {
              ...hero,
              isDead: false,
              deathTime: undefined,
              hp: resHp,
              activeDebuffs: {} // Clear debuffs on resurrection
            };
          }
          return hero;
        });
        
        // Update ref too
        if (anyResurrected) {
          heroesRef.current = updated;
        }
        
        return anyResurrected ? updated : currentHeroes;
      });
    }, 1000); // Check every second for smooth timer
    
    resIntervalRef.current = resInterval;

    return () => {
      if (resIntervalRef.current) {
        clearInterval(resIntervalRef.current);
        resIntervalRef.current = null;
      }
    };
  }, []); // No dependencies - only runs once on mount, uses heroesRef.current inside

  // Buff expiration system (clean up expired buffs)
  useEffect(() => {
    if (!allHeroes || allHeroes.length === 0) return;
    
    // Prevent duplicate buff intervals
    if (buffCheckIntervalRef.current) {
      return;
    }

    const buffCheckInterval = setInterval(() => {
      const now = Date.now();
      
      setHeroes(current => {
        let anyExpired = false;
        const updated = current.map(hero => {
          if (!hero.activeBuffs) return hero;
          
          const newBuffs = { ...hero.activeBuffs };
          
          // Check Last Stand expiration
          if (newBuffs.lastStand?.active && newBuffs.lastStand.expiresAt < now) {
            console.log(`[Buff] ${hero.name}'s Last Stand expired`);
            newBuffs.lastStand = { active: false, expiresAt: 0 };
            anyExpired = true;
          }
          
          // Check Iron Skin expiration
          if (newBuffs.ironSkin?.active && newBuffs.ironSkin.expiresAt < now) {
            console.log(`[Buff] ${hero.name}'s Iron Skin expired`);
            newBuffs.ironSkin = { active: false, expiresAt: 0 };
            anyExpired = true;
          }
          
          // Check Divine Grace expiration
          if (newBuffs.divineGrace?.active && newBuffs.divineGrace.expiresAt < now) {
            console.log(`[Buff] ${hero.name}'s Divine Grace expired`);
            newBuffs.divineGrace = { active: false, expiresAt: 0 };
            anyExpired = true;
          }
          
          // Check Enrage expiration
          if (hero.enrageExpiry && hero.enrageExpiry <= now) {
            console.log(`[Enrage] 😡 ${hero.name}'s Enrage fades...`);
            anyExpired = true;
            return { ...hero, activeBuffs: newBuffs, enrageExpiry: undefined };
          }
          
          // Update shop buff durations (ONLY during combat!)
          let newShopBuffs = hero.shopBuffs ? { ...hero.shopBuffs } : undefined;
          if (newShopBuffs && combatInProgress.current) {
            // XP Boost
            if (newShopBuffs.xpBoost && newShopBuffs.xpBoost.remainingDuration > 0) {
              const timeSinceUpdate = now - (newShopBuffs.xpBoost.lastUpdateTime || now);
              newShopBuffs.xpBoost.remainingDuration -= timeSinceUpdate;
              newShopBuffs.xpBoost.lastUpdateTime = now;
              
              if (newShopBuffs.xpBoost.remainingDuration <= 0) {
                console.log(`[Buff] ${hero.name}'s XP Boost expired`);
                delete newShopBuffs.xpBoost;
                anyExpired = true;
              }
            }
            
            // Attack Buff
            if (newShopBuffs.attackBuff && newShopBuffs.attackBuff.remainingDuration > 0) {
              const timeSinceUpdate = now - (newShopBuffs.attackBuff.lastUpdateTime || now);
              newShopBuffs.attackBuff.remainingDuration -= timeSinceUpdate;
              newShopBuffs.attackBuff.lastUpdateTime = now;
              
              if (newShopBuffs.attackBuff.remainingDuration <= 0) {
                console.log(`[Buff] ${hero.name}'s Attack Buff expired`);
                delete newShopBuffs.attackBuff;
                anyExpired = true;
              }
            }
            
            // Defense Buff
            if (newShopBuffs.defenseBuff && newShopBuffs.defenseBuff.remainingDuration > 0) {
              const timeSinceUpdate = now - (newShopBuffs.defenseBuff.lastUpdateTime || now);
              newShopBuffs.defenseBuff.remainingDuration -= timeSinceUpdate;
              newShopBuffs.defenseBuff.lastUpdateTime = now;
              
              if (newShopBuffs.defenseBuff.remainingDuration <= 0) {
                console.log(`[Buff] ${hero.name}'s Defense Buff expired`);
                delete newShopBuffs.defenseBuff;
                anyExpired = true;
              }
            }
            
            if (anyExpired && Object.keys(newShopBuffs).length === 0) {
              newShopBuffs = undefined;
            }
          }
          
          if (anyExpired) {
            return newShopBuffs ? { ...hero, activeBuffs: newBuffs, shopBuffs: newShopBuffs } : { ...hero, activeBuffs: newBuffs };
          }
          return anyExpired ? { ...hero, activeBuffs: newBuffs } : hero;
        });
        
        if (anyExpired) {
          heroesRef.current = updated;
        }
        
        return anyExpired ? updated : current;
      });
    }, 1000); // Check every second
    
    buffCheckIntervalRef.current = buffCheckInterval;

    return () => {
      if (buffCheckIntervalRef.current) {
        clearInterval(buffCheckIntervalRef.current);
        buffCheckIntervalRef.current = null;
      }
    };
  }, []); // No dependencies - only runs once on mount

  // Step 12B: HP Regeneration (from gear hpRegen stat)
  useEffect(() => {
    // Always clear existing interval first to prevent duplicates
    if (regenIntervalRef.current) {
      clearInterval(regenIntervalRef.current);
      regenIntervalRef.current = null;
    }
    
    if (!allHeroes || allHeroes.length === 0) {
      // No heroes, interval already cleared above
      return;
    }

    console.log('[HP Regen] Setting up regen interval');
    const regenInterval = setInterval(() => {
      
      // Regenerate HP for real heroes with hpRegen > 0
      setHeroes(currentHeroes => {
        let anyRegen = false;
        const updated = currentHeroes.map(hero => {
          const hpRegen = hero.hpRegen || 0;
          
          // IMPORTANT: HP regen does NOT resurrect! Only heals alive heroes below max HP
          if (hpRegen > 0 && hero.hp > 0 && !hero.isDead && hero.hp < hero.maxHp) {
            const newHp = Math.min(hero.maxHp, hero.hp + hpRegen);
            const actualRegen = newHp - hero.hp;
            if (actualRegen > 0) {
              anyRegen = true;
              
              console.log(`[HP Regen] 💚 ${hero.name} regenerates ${actualRegen} HP`);
              
              // Show HP regen SCT with + prefix for visibility!
              const heroElement = document.querySelector(`[data-hero-id="${hero.id}"]`);
              if (heroElement) {
                const rect = heroElement.getBoundingClientRect();
                addSCT(`+${actualRegen} ❤️`, rect.left + rect.width / 2, rect.top + 10, 'heal-hot');
              }
              
              return { ...hero, hp: newHp };
            }
          }
          return hero;
        });

        if (anyRegen) {
          heroesRef.current = updated;
        }
        return anyRegen ? updated : currentHeroes;
      });

      // Regen for test healer (ONLY if alive - does NOT resurrect!)
      if (testHealer?.hpRegen && testHealer.hp > 0 && !testHealer.isDead && testHealer.hp < testHealer.maxHp) {
        const newHp = Math.min(testHealer.maxHp, testHealer.hp + testHealer.hpRegen);
        const actualRegen = newHp - testHealer.hp;
        if (actualRegen > 0) {
          setTestHealer(prev => prev ? { ...prev, hp: newHp } : null);
          
          // Show HP regen SCT
          const testHealerElement = document.querySelector(`[data-hero-id="test-healer"]`);
          if (testHealerElement) {
            const rect = testHealerElement.getBoundingClientRect();
            addSCT(`${actualRegen}`, rect.left + rect.width / 2, rect.top + 10, 'heal-hot');
          }
        }
      }
    }, 1000); // Every 1 second
    
    regenIntervalRef.current = regenInterval;

    return () => {
      if (regenIntervalRef.current) {
        clearInterval(regenIntervalRef.current);
        regenIntervalRef.current = null;
      }
    };
  }, []); // No dependencies - only runs once on mount

  // Helper: Check if role is tank
  const isTankRole = (role: string): boolean => {
    if (!role) return false; // Safety check
    const tankRoles = ['guardian', 'paladin', 'warden', 'bloodknight', 'vanguard', 'brewmaster'];
    return tankRoles.includes(role.toLowerCase());
  };

  // Helper: Check if role is healer
  const isHealerRole = (role: string): boolean => {
    if (!role) return false; // Safety check
    const healerRoles = ['cleric', 'atoner', 'druid', 'lightbringer', 'shaman', 'mistweaver', 'chronomancer', 'bard'];
    return healerRoles.includes(role.toLowerCase());
  };

  // Helper: Check if role is DPS
  const isDpsRole = (role: string): boolean => {
    return !isTankRole(role) && !isHealerRole(role);
  };

  // Get threat weight for hero role (with Taunt/Fade modifiers and gear scaling)
  const getThreatWeight = (hero: Hero): number => {
    if (!hero || !hero.role) return 1; // Safety check
    
    const now = Date.now();
    
    // Base threat by role
    let baseThreat = 1; // DPS default (1x)
    if (isTankRole(hero.role)) baseThreat = 20; // Tanks high base threat (20x)
    if (isHealerRole(hero.role)) baseThreat = 0.5; // Healers low threat (0.5x - healing generates threat but lower than DPS)
    
    // Tanks generate additional threat from damage dealt (better gear = more threat)
    // This ensures tanks with better gear hold aggro better
    if (isTankRole(hero.role)) {
      // Tanks get threat bonus from attack/defense (better gear = more threat generation)
      // This scales threat with tank gear effectiveness
      const gearThreatBonus = 1 + ((hero.attack || 0) / 1000) + ((hero.defense || 0) / 2000);
      baseThreat *= gearThreatBonus;
    }
    
    // Tanks below 50% HP get MASSIVE threat boost (enemies prioritize protecting them)
    if (isTankRole(hero.role) && hero.hp > 0 && hero.maxHp > 0) {
      const hpPercent = hero.hp / hero.maxHp;
      if (hpPercent < 0.50) {
        // Emergency: Tank below 50% HP - 5x threat multiplier to draw aggro
        baseThreat *= 5;
        console.log(`[Threat] 🛡️ ${hero.name} is below 50% HP (${Math.floor(hpPercent * 100)}%) - ENEMIES PRIORITIZE TANK!`);
      }
    }
    
    // DPS generate threat from damage (better gear = more threat)
    // This ensures high DPS can pull aggro if tanks aren't generating enough threat
    if (!isTankRole(hero.role) && !isHealerRole(hero.role)) {
      const dpsThreatBonus = 1 + ((hero.attack || 0) / 500); // DPS get threat from attack
      baseThreat *= dpsThreatBonus;
    }
    
    // Healers generate threat from healing (but still lower than DPS)
    // Healing generates threat to enemies (they want to kill the healer)
    // Better gear = more healing = more threat, but capped lower than DPS
    if (isHealerRole(hero.role)) {
      // Healers get small threat bonus from healing power and intellect/wisdom
      const healingThreatBonus = 1 + ((hero.healingPower || 0) / 200) + (((hero.intellect || 0) + (hero.wisdom || 0)) / 400);
      baseThreat *= healingThreatBonus;
    }
    
    // Taunt multiplier (10x threat) - MASSIVE threat increase
    if (hero.tauntExpiry && hero.tauntExpiry > now) {
      return baseThreat * 10;
    }
    
    // Fade multiplier (0.1x threat) - Huge threat reduction
    if (hero.fadeExpiry && hero.fadeExpiry > now) {
      return baseThreat * 0.1;
    }
    
    return baseThreat;
  };

  // Calculate gear score for a single hero
  const calculateGearScore = (hero: Hero): number => {
    if (!hero.equipment) return 0;
    
    let score = 0;
    Object.values(hero.equipment).forEach((item: any) => {
      if (!item) return;
      
      // Base stats
      score += (item.attack || 0) + (item.defense || 0) + (item.hp || 0);
      
      // Primary stats (weighted higher)
      score += (item.intellect || 0) * 3;
      score += (item.strength || 0) * 3;
      score += (item.dexterity || 0) * 1.5;
      score += (item.wisdom || 0) * 1.5;
      score += (item.stamina || 0) * 1;
      
      // Secondary stats (weighted very high)
      if (item.secondaryStats) {
        score += (item.secondaryStats.healingPower || 0) * 5;
        score += (item.secondaryStats.spellDamage || 0) * 5;
        score += (item.secondaryStats.meleeDamage || 0) * 5;
        score += (item.secondaryStats.hpRegen || 0) * 10;
        score += (item.secondaryStats.damageReduction || 0) * 10;
        score += (item.secondaryStats.critChance || 0) * 15;
      }
      
      // Legendary bonus
      if (item.rarity === 'legendary') {
        score += 200;
      }
    });
    
    return Math.floor(score);
  };

  // Calculate average party gear score
  // Calculate viewer bonuses based on active chatters
  const calculateViewerBonuses = () => {
    const chatters = activeChatterCount;
    return {
      damage: 1 + (chatters * 0.01),      // +1% per chatter
      healing: 1 + (chatters * 0.01),     // +1% per chatter
      defense: 1 + (chatters * 0.005),    // +0.5% per chatter
      loot: Math.min(chatters * 0.002, 0.3) // +0.2% per chatter, max 30%
    };
  };

  const calculateAverageGearScore = (heroes: Hero[]): number => {
    if (heroes.length === 0) return 0;
    
    const totalScore = heroes.reduce((sum, hero) => sum + calculateGearScore(hero), 0);
    return Math.floor(totalScore / heroes.length);
  };

  // Select target based on threat (weighted random)
  const selectTargetByThreat = (heroes: Hero[]): Hero | null => {
    const aliveHeroes = heroes.filter(h => h.hp > 0 && !h.isDead);
    if (aliveHeroes.length === 0) return null;

    // Calculate total threat (use hero object, not just role)
    const totalThreat = aliveHeroes.reduce((sum, hero) => {
      return sum + getThreatWeight(hero);
    }, 0);

    // Weighted random selection (use hero object for threat modifiers)
    let random = Math.random() * totalThreat;
    
    for (const hero of aliveHeroes) {
      random -= getThreatWeight(hero);
      if (random <= 0) {
        return hero;
      }
    }

    // Fallback (shouldn't happen)
    return aliveHeroes[0];
  };

  // Calculate item improvement for a specific hero (role-aware, considers spell power and set bonuses)
  const calculateItemImprovement = (newItem: any, currentItem: any | null, hero: Hero, heroEquipment: any): number => {
    if (!currentItem) {
      // No current item = 100% improvement (infinite improvement)
      return 1.0;
    }
    
    // Check if current item is locked (don't replace locked items)
    if (currentItem.locked) {
      return 0;
    }
    
    // Role-specific stat prioritization
    const role = hero.role?.toLowerCase() || '';
    const isTank = ['guardian', 'paladin', 'warden', 'bloodknight', 'vanguard', 'brewmaster'].includes(role);
    const isHealer = ['cleric', 'atoner', 'druid', 'lightbringer', 'shaman', 'mistweaver', 'chronomancer', 'bard'].includes(role);
    const isCaster = ['mage', 'warlock', 'necromancer', 'ranger', 'shadowpriest', 'mooncaller', 'stormcaller', 'frostmage', 'firemage', 'dragonsorcerer'].includes(role);
    
    // Calculate current equipment value (with set bonuses)
    const currentEquipment = { ...heroEquipment };
    const currentEquipmentWithNew = { ...heroEquipment, [newItem.slot]: newItem };
    const currentEquipmentWithOld = { ...heroEquipment, [newItem.slot]: currentItem };
    
    // Calculate set bonuses for both scenarios
    const currentSetBonuses = calculateSetBonuses(currentEquipmentWithOld, hero.role || '');
    const newSetBonuses = calculateSetBonuses(currentEquipmentWithNew, hero.role || '');
    
    // Calculate base stats value
    let currentValue: number;
    let newValue: number;
    
    if (isTank) {
      // Tanks prioritize defense and HP (2x weight on defense)
      currentValue = (currentItem.defense || 0) * 2 + (currentItem.hp || 0) + (currentItem.attack || 0) * 0.5;
      newValue = (newItem.defense || 0) * 2 + (newItem.hp || 0) + (newItem.attack || 0) * 0.5;
      
      // Add set bonuses
      currentValue += (currentSetBonuses.defense || 0) * 2 + (currentSetBonuses.hp || 0) + (currentSetBonuses.attack || 0) * 0.5;
      newValue += (newSetBonuses.defense || 0) * 2 + (newSetBonuses.hp || 0) + (newSetBonuses.attack || 0) * 0.5;
    } else if (isHealer) {
      // Healers prioritize HP, defense, intellect, wisdom, and HEALING POWER (spell power for heals)
      // Intellect and Wisdom are primary stats for healers (they scale healing output)
      const currentIntellect = (currentItem.intellect || 0);
      const newIntellect = (newItem.intellect || 0);
      const currentWisdom = (currentItem.wisdom || 0);
      const newWisdom = (newItem.wisdom || 0);
      
      const currentHealingPower = (currentItem.secondaryStats?.healingPower || 0) + (currentSetBonuses.healingPower || 0);
      const newHealingPower = (newItem.secondaryStats?.healingPower || 0) + (newSetBonuses.healingPower || 0);
      
      // Healing power is very valuable (1 healing power = 1% more healing, max 30%)
      // Weight healing power highly (10x) since it directly affects healing output
      // Intellect and Wisdom are also very valuable for healers (weighted at 5x each)
      currentValue = (currentItem.hp || 0) * 1.5 + (currentItem.defense || 0) + (currentItem.attack || 0) * 0.3 + currentHealingPower * 10 + currentIntellect * 5 + currentWisdom * 5;
      newValue = (newItem.hp || 0) * 1.5 + (newItem.defense || 0) + (newItem.attack || 0) * 0.3 + newHealingPower * 10 + newIntellect * 5 + newWisdom * 5;
      
      // Also consider spell damage for healers (some healer sets give spell damage)
      const currentSpellDmg = (currentItem.secondaryStats?.spellDamage || 0) + (currentSetBonuses.spellDamage || 0);
      const newSpellDmg = (newItem.secondaryStats?.spellDamage || 0) + (newSetBonuses.spellDamage || 0);
      currentValue += currentSpellDmg * 500; // Spell damage is valuable (percentage multiplier)
      newValue += newSpellDmg * 500;
    } else if (isCaster) {
      // Casters prioritize attack and SPELL DAMAGE (spell power for attacks)
      const currentSpellDmg = (currentItem.secondaryStats?.spellDamage || 0) + (currentSetBonuses.spellDamage || 0);
      const newSpellDmg = (newItem.secondaryStats?.spellDamage || 0) + (newSetBonuses.spellDamage || 0);
      
      // Spell damage is very valuable (percentage multiplier, e.g., 0.10 = 10% more damage)
      // Weight spell damage highly (500x) since it's a percentage multiplier
      currentValue = (currentItem.attack || 0) * 2 + (currentItem.defense || 0) + (currentItem.hp || 0) + currentSpellDmg * 500;
      newValue = (newItem.attack || 0) * 2 + (newItem.defense || 0) + (newItem.hp || 0) + newSpellDmg * 500;
      
      // Add set bonuses
      currentValue += (currentSetBonuses.attack || 0) * 2 + (currentSetBonuses.defense || 0) + (currentSetBonuses.hp || 0);
      newValue += (newSetBonuses.attack || 0) * 2 + (newSetBonuses.defense || 0) + (newSetBonuses.hp || 0);
    } else {
      // Melee DPS prioritize attack (2x weight on attack)
      currentValue = (currentItem.attack || 0) * 2 + (currentItem.defense || 0) + (currentItem.hp || 0);
      newValue = (newItem.attack || 0) * 2 + (newItem.defense || 0) + (newItem.hp || 0);
      
      // Add set bonuses
      currentValue += (currentSetBonuses.attack || 0) * 2 + (currentSetBonuses.defense || 0) + (currentSetBonuses.hp || 0);
      newValue += (newSetBonuses.attack || 0) * 2 + (newSetBonuses.defense || 0) + (newSetBonuses.hp || 0);
      
      // Melee damage bonus from sets
      const currentMeleeDmg = (currentItem.secondaryStats?.meleeDamage || 0) + (currentSetBonuses.meleeDamage || 0);
      const newMeleeDmg = (newItem.secondaryStats?.meleeDamage || 0) + (newSetBonuses.meleeDamage || 0);
      currentValue += currentMeleeDmg * 500; // Melee damage is valuable (percentage multiplier)
      newValue += newMeleeDmg * 500;
    }
    
    if (currentValue === 0) {
      return newValue > 0 ? 1.0 : 0;
    }
    
    // Return improvement ratio (0.1 = 10% better, 0.5 = 50% better, etc.)
    return (newValue - currentValue) / currentValue;
  };

  // Calculate skill bonuses from skill tree
  const calculateSkillBonuses = (hero: Hero): any => {
    const skills = hero.skills || {};
    const bonuses = {
      attack: 0,
      defense: 0,
      hp: 0,
      damageMultiplier: 0,
      healingMultiplier: 0,
      defenseMultiplier: 0,
      critChance: 0,
      critDamage: 0
    };

    // Simplified skill templates (matches backend pattern)
    const category = isTankRole(hero.role) ? 'tank' : isHealerRole(hero.role) ? 'healer' : 'dps';
    
    Object.entries(skills).forEach(([skillId, skillData]: [string, any]) => {
      if (!skillData || !skillData.points) return;
      
      const points = skillData.points;
      
      // Parse skill index from skillId (format: "classname_skill_0")
      const skillIndex = parseInt(skillId.split('_skill_')[1] || '0');
      
      // Apply bonuses based on category and skill index
      if (category === 'tank') {
        if (skillIndex === 0 || skillIndex === 8) bonuses.hp += 5 * points;
        if (skillIndex === 2 || skillIndex === 6) bonuses.defense += 4 * points;
        if (skillIndex === 3) bonuses.attack += 2 * points;
        if (skillIndex === 1 || skillIndex === 4 || skillIndex === 7 || skillIndex === 9) bonuses.defenseMultiplier += 3 * points;
      } else if (category === 'healer') {
        if (skillIndex === 0 || skillIndex === 2 || skillIndex === 4 || skillIndex === 6 || skillIndex === 9) bonuses.healingMultiplier += 5 * points;
        if (skillIndex === 8) bonuses.defense += 3 * points;
      } else { // DPS
        if (skillIndex === 0 || skillIndex === 5 || skillIndex === 7 || skillIndex === 9) bonuses.damageMultiplier += 5 * points;
        if (skillIndex === 1 || skillIndex === 6) bonuses.critChance += 3 * points;
        if (skillIndex === 2) bonuses.critDamage += 10 * points;
        if (skillIndex === 3) bonuses.attack += 4 * points;
      }
    });

    return bonuses;
  };

  // Calculate comprehensive stats from equipment (including skill bonuses, HP regen, etc.)
  const calculateHeroStats = (hero: Hero): Hero => {
    // If no equipment, use basic level-based stats
    if (!hero.equipment || Object.keys(hero.equipment).length === 0) {
      return {
        ...hero,
        attack: hero.attack || hero.level * 5,
        defense: hero.defense || hero.level * 2,
        maxHp: hero.maxHp || (100 + hero.level * 20),
        hpRegen: 0
      };
    }

    // Determine role category for stat scaling
    const role = hero.role?.toLowerCase() || '';
    const isTank = isTankRole(role);
    const isHealer = isHealerRole(role);
    const isDps = isDpsRole(role);
    
    // Base stats that all heroes get (scaled by role)
    // All heroes have ALL stats - they just scale differently by role
    let baseAttack = 10 + hero.level * 3;
    let baseDefense = 5 + hero.level * 2;
    let baseHp = 100 + hero.level * 20;
    
    // Apply role-based multipliers (all heroes have all stats, just different values)
    if (isTank) {
      // Tanks: Higher defense and HP, moderate attack
      baseAttack = Math.floor(baseAttack * 0.8);  // 80% of base attack
      baseDefense = Math.floor(baseDefense * 1.5); // 150% of base defense
      baseHp = Math.floor(baseHp * 1.3);          // 130% of base HP
    } else if (isHealer) {
      // Healers: Balanced stats, slightly higher HP
      baseAttack = Math.floor(baseAttack * 0.9);  // 90% of base attack
      baseDefense = Math.floor(baseDefense * 1.1); // 110% of base defense
      baseHp = Math.floor(baseHp * 1.15);         // 115% of base HP
    } else {
      // DPS: Higher attack, standard defense and HP
      baseAttack = Math.floor(baseAttack * 1.2);  // 120% of base attack
      baseDefense = Math.floor(baseDefense * 0.9); // 90% of base defense
      baseHp = Math.floor(baseHp * 1.0);          // 100% of base HP
    }
    
    // Start with base stats (from level, scaled by role)
    const stats = {
      attack: baseAttack,
      defense: baseDefense,
      maxHp: baseHp,
      intellect: 0,
      strength: 0,
      dexterity: 0,
      wisdom: 0,
      stamina: 0,
      healingPower: 0,
      spellDamage: 0,
      meleeDamage: 0,
      hpRegen: 0,
      damageReduction: 0,
      critChance: 0,
      damageMultiplier: 0,
      healingMultiplier: 0,
      defenseMultiplier: 0
    };

    // Add equipment bonuses (first pass - base stats only, no upgrades)
    const equipment = hero.equipment || {};
    Object.values(equipment).forEach((item: any) => {
      if (!item) return;
      
      // Base stats
      stats.attack += item.attack || 0;
      stats.defense += item.defense || 0;
      stats.maxHp += item.hp || 0;
      
      // Primary stats
      stats.intellect += item.intellect || 0;
      stats.strength += item.strength || 0;
      stats.dexterity += item.dexterity || 0;
      stats.wisdom += item.wisdom || 0;
      stats.stamina += item.stamina || 0;
      
      // Secondary stats
      if (item.secondaryStats) {
        stats.healingPower += item.secondaryStats.healingPower || 0;
        stats.spellDamage += item.secondaryStats.spellDamage || 0;
        stats.meleeDamage += item.secondaryStats.meleeDamage || 0;
        stats.hpRegen += item.secondaryStats.hpRegen || 0;
        stats.damageReduction += item.secondaryStats.damageReduction || 0;
        stats.critChance += item.secondaryStats.critChance || 0;
      }
    });
    
    // Store pre-upgrade totals for upgrade calculations
    // Upgrades are percentages of the hero's TOTAL accumulated stats (base + equipment)
    const preUpgradeStats = {
      attack: stats.attack,
      defense: stats.defense,
      maxHp: stats.maxHp,
      critChance: stats.critChance,
      healingPower: stats.healingPower,
      spellDamage: stats.spellDamage
    };
    
    // Calculate gem stats from all equipped items
    const gemStats = {
      attack: 0,
      defense: 0,
      critChance: 0,
      critDamage: 0,
      damageReduction: 0,
      maxHp: 0,
      allStats: 0,
      xpGain: 0,
      goldGain: 0,
      tokenGain: 0
    };
    
    // Calculate socket bonuses from all equipped items
    const socketBonusStats = {
      attack: 0,
      defense: 0,
      allStats: 0,
      xpGain: 0,
      goldGain: 0,
      critChance: 0,
      damageReduction: 0
    };
    
    Object.values(equipment).forEach((item: any) => {
      if (!item) return;
      
      // Add gem stats from sockets
      if (item.sockets && Array.isArray(item.sockets)) {
        item.sockets.forEach((socket: any) => {
          if (socket.gem && socket.gem.stats) {
            const gemStat = socket.gem.stats;
            gemStats.attack += gemStat.attack || 0;
            gemStats.defense += gemStat.defense || 0;
            gemStats.critChance += gemStat.critChance || 0;
            gemStats.critDamage += gemStat.critDamage || 0;
            gemStats.damageReduction += gemStat.damageReduction || 0;
            gemStats.maxHp += gemStat.maxHp || 0;
            gemStats.allStats += gemStat.allStats || 0;
            gemStats.xpGain += gemStat.xpGain || 0;
            gemStats.goldGain += gemStat.goldGain || 0;
            gemStats.tokenGain += gemStat.tokenGain || 0;
          }
        });
        
        // Calculate socket bonuses for this item
        if (item.socketBonuses) {
          socketBonusStats.attack += item.socketBonuses.attack || 0;
          socketBonusStats.defense += item.socketBonuses.defense || 0;
          socketBonusStats.allStats += item.socketBonuses.allStats || 0;
          socketBonusStats.xpGain += item.socketBonuses.xpGain || 0;
          socketBonusStats.goldGain += item.socketBonuses.goldGain || 0;
          socketBonusStats.critChance += item.socketBonuses.critChance || 0;
          socketBonusStats.damageReduction += item.socketBonuses.damageReduction || 0;
        }
      }
    });
    
    // Apply gem stats (flat bonuses)
    stats.attack += gemStats.attack;
    stats.defense += gemStats.defense;
    stats.maxHp += gemStats.maxHp;
    stats.critChance += gemStats.critChance / 100; // Convert percentage to decimal
    stats.damageReduction += gemStats.damageReduction;
    // All stats bonus (applied as percentage of current stats)
    if (gemStats.allStats > 0) {
      stats.attack += Math.floor(stats.attack * gemStats.allStats / 100);
      stats.defense += Math.floor(stats.defense * gemStats.allStats / 100);
      stats.maxHp += Math.floor(stats.maxHp * gemStats.allStats / 100);
    }
    
    // Apply socket bonuses (percentage bonuses)
    if (socketBonusStats.attack > 0) {
      stats.attack += Math.floor(stats.attack * socketBonusStats.attack / 100);
    }
    if (socketBonusStats.defense > 0) {
      stats.defense += Math.floor(stats.defense * socketBonusStats.defense / 100);
    }
    if (socketBonusStats.allStats > 0) {
      stats.attack += Math.floor(stats.attack * socketBonusStats.allStats / 100);
      stats.defense += Math.floor(stats.defense * socketBonusStats.allStats / 100);
      stats.maxHp += Math.floor(stats.maxHp * socketBonusStats.allStats / 100);
    }
    stats.critChance += socketBonusStats.critChance / 100; // Convert percentage to decimal
    stats.damageReduction += socketBonusStats.damageReduction;
    
    // Store gem/socket bonuses for display (optional - can be used in UI)
    (stats as any).gemStats = gemStats;
    (stats as any).socketBonusStats = socketBonusStats;
    
    // Apply profession enchantments/upgrades (appliedUpgrades)
    // These are flat bonuses from Mining/Enchanting profession items (Fiery Weapon, Vampiric Touch, etc.)
    Object.values(equipment).forEach((item: any) => {
      if (!item || !item.appliedUpgrades || !Array.isArray(item.appliedUpgrades)) return;
      
      item.appliedUpgrades.forEach((appliedUpgrade: any) => {
        if (appliedUpgrade.bonus) {
          // Apply flat bonuses from profession enchantments
          stats.attack += appliedUpgrade.bonus.attack || 0;
          stats.defense += appliedUpgrade.bonus.defense || 0;
          stats.maxHp += appliedUpgrade.bonus.hp || 0;
        }
      });
    });
    
    // Apply upgrade bonuses (custom stat selection system)
    // Upgrades are percentages of the hero's TOTAL stats, not the item's base stats
    Object.values(equipment).forEach((item: any) => {
      if (!item || !item.upgradeStats || !Array.isArray(item.upgradeStats)) return;
      
      item.upgradeStats.forEach((upgrade: any) => {
        if (upgrade.selectedStats && Array.isArray(upgrade.selectedStats)) {
          upgrade.selectedStats.forEach((selectedStat: any) => {
            const statType = selectedStat.type;
            const statValue = selectedStat.value || 0; // Percentage value
            
            switch (statType) {
              case 'attack':
                // Percentage of hero's total attack (base + all equipment)
                stats.attack += Math.floor(preUpgradeStats.attack * statValue / 100);
                break;
              case 'defense':
                // Percentage of hero's total defense (base + all equipment)
                stats.defense += Math.floor(preUpgradeStats.defense * statValue / 100);
                break;
              case 'hp':
                // Percentage of hero's total HP (base + all equipment)
                stats.maxHp += Math.floor(preUpgradeStats.maxHp * statValue / 100);
                break;
              case 'critChance':
                // Crit chance is in percentage points (flat bonus, not percentage of base)
                stats.critChance += statValue / 100; // Convert percentage to decimal
                break;
              case 'critDamage':
                // Crit damage is percentage points (flat bonus)
                // Could add to a separate critDamageMultiplier stat later
                // For now, treat as flat attack bonus (smaller since it's conditional)
                stats.attack += Math.floor(preUpgradeStats.attack * statValue / 200);
                break;
              case 'healingPower':
                // Percentage of hero's total healing power
                stats.healingPower += Math.floor(preUpgradeStats.healingPower * statValue / 100);
                break;
              case 'spellDamage':
                // Percentage of hero's total spell damage
                stats.spellDamage += Math.floor(preUpgradeStats.spellDamage * statValue / 100);
                break;
            }
          });
        }
      });
    });

    // Calculate and apply skill bonuses
    const skillBonuses = calculateSkillBonuses(hero);
    stats.attack += skillBonuses.attack;
    stats.defense += skillBonuses.defense;
    stats.maxHp += skillBonuses.hp;
    stats.damageMultiplier = skillBonuses.damageMultiplier;
    
    // Apply defense multiplier from skills (tanks get 15-30% bonus!)
    if (skillBonuses.defenseMultiplier > 0) {
      const defenseBonus = 1 + (skillBonuses.defenseMultiplier / 100);
      stats.defense = Math.floor(stats.defense * defenseBonus);
    }
    stats.healingMultiplier = skillBonuses.healingMultiplier;
    stats.defenseMultiplier = skillBonuses.defenseMultiplier;
    stats.critChance += skillBonuses.critChance / 100; // Convert from % to decimal
    
    // Calculate and apply SET BONUSES (Guardian's Bulwark, Berserker's Wrath, etc.)
    const setBonuses = calculateSetBonuses(hero.equipment, hero.role);
    stats.attack += setBonuses.attack;
    stats.defense += setBonuses.defense;
    stats.maxHp += setBonuses.hp;
    stats.intellect += setBonuses.intellect;
    stats.strength += setBonuses.strength;
    stats.dexterity += setBonuses.dexterity;
    stats.wisdom += setBonuses.wisdom;
    stats.stamina += setBonuses.stamina;
    stats.healingPower += setBonuses.healingPower;
    stats.spellDamage += setBonuses.spellDamage;
    
    // FILTER: Healers don't use melee damage - convert to spell damage instead
    // This ensures healers (including bards) benefit from equipment that might have melee damage
    if (isHealer) {
      // Convert all melee damage (from equipment + set bonuses) to spell damage for healers
      stats.spellDamage += stats.meleeDamage + setBonuses.meleeDamage;
      stats.meleeDamage = 0; // Set to 0 for healers
    } else {
      stats.meleeDamage += setBonuses.meleeDamage;
    }
    
    stats.hpRegen += setBonuses.hpRegen;
    stats.damageReduction += setBonuses.damageReduction;
    stats.critChance += setBonuses.critChance;
    
    // Log set bonuses if any pieces equipped
    const equippedSets = Object.values(hero.equipment || {}).filter((item: any) => item?.setName).map((item: any) => item.setName);
    const uniqueSets = [...new Set(equippedSets)];
    if (uniqueSets.length > 0) {
      console.log(`[Set Bonuses] ${hero.name} has ${uniqueSets.length} set(s):`, uniqueSets.join(', '));
      console.log(`[Set Bonuses] Bonuses: +${setBonuses.attack} ATK, +${setBonuses.defense} DEF, +${setBonuses.hp} HP, +${setBonuses.hpRegen} HP/sec`);
    }

    // Apply stamina → HP conversion (1 stamina = 10 HP)
    stats.maxHp += stats.stamina * 10;

    // Cap crit chance at 35%
    stats.critChance = Math.min(stats.critChance, 0.35);

    // Debug: Log ALL equipment slots and their stats
    const equipmentSlots = ['weapon', 'armor', 'accessory', 'shield', 'helm', 'cloak', 'gloves', 'ring1', 'ring2', 'boots'];
    const loadedSlots = equipmentSlots.filter(slot => equipment[slot]).map(slot => {
      const item = equipment[slot];
      return `${slot}(${item.rarity || 'common'}):+${item.attack || 0}atk/+${item.defense || 0}def/+${item.hp || 0}hp`;
    });
    
    console.log(`[Stats] ${hero.name} has ${loadedSlots.length}/10 slots:`, loadedSlots.join(' | '));
    console.log(`[Stats] ${hero.name} final stats:`, {
      attack: stats.attack,
      defense: stats.defense,
      maxHp: stats.maxHp,
      skillBonuses: `+${skillBonuses.damageMultiplier}% dmg, +${skillBonuses.healingMultiplier}% heal, +${skillBonuses.defenseMultiplier}% def`,
      hpRegen: stats.hpRegen,
      critChance: `${(stats.critChance * 100).toFixed(1)}%`
    });

    return {
      ...hero,
      ...stats,
      hp: Math.min(hero.hp, stats.maxHp) // Don't overheal
    };
  };

  // Unified enemy positioning function - works consistently across idle, raid, and dungeon modes
  const getEnemyPosition = (index: number, total: number, isBoss: boolean = false, enemyType?: string, gameMode?: string, heroes?: Hero[]) => {
    const screenWidth = 1920;
    const screenHeight = 1080;
    
    // UNIFIED horizontal positioning - same across all modes
    const heroZoneEnd = screenWidth * 0.6; // 1152px (end of hero zone)
    const leftMargin = 150; // Consistent distance from hero zone to prevent clipping
    const rightMargin = 150; // Buffer for sprite width (sprites at 3.0x scale can be ~120px wide)
    
    // Idle mode: move enemies further to the right
    const idleModeOffset = gameMode === 'idle' ? 150 : 0; // Move idle enemies 150px to the right
    
    // Calculate horizontal position (spread evenly, never exceed screen bounds)
    const enemyStartX = heroZoneEnd + leftMargin + idleModeOffset; // 1452px for idle mode (1302px + 150px), 1302px for other modes
    const maxX = screenWidth - rightMargin; // 1770px max (same for all modes)
    
    // Calculate available width based on actual start and end positions
    // This ensures proper spacing regardless of idle mode offset
    const availableEnemyWidth = maxX - enemyStartX; // Actual available space for enemies
    
    // Spread enemies evenly across the available width
    // For multiple enemies, space them evenly from start to end
    const spacing = total > 1 ? availableEnemyWidth / (total - 1) : 0;
    const x = enemyStartX + (index * spacing);
    
    // Ensure enemies don't go off-screen (clamp to safe bounds)
    const minX = enemyStartX;
    const clampedX = Math.max(minX, Math.min(x, maxX));
    
    // UNIFIED vertical positioning logic
    const spriteHeight = 240; // Sprite height at 3.0x scale
    const buffer = 20; // Bottom buffer
    
    let y: number;
    
    if (isBoss) {
      // Boss positioning: special handling for Corrupted High Priest
      const isCorruptedHighPriest = enemyType === 'Corrupted High Priest';
      
      // In dungeon mode, align boss lower than regular enemies (1.5 inches = ~144px more down)
      if (gameMode === 'dungeon') {
        // Bosses positioned lower than regular enemies (1.5 inches lower)
        const downOffset = 140 + 144; // 140px (same as regular enemies) + 144px (1.5 inches) = 284px
        y = screenHeight - spriteHeight - buffer + downOffset; // ~1104px - positioned lower
      } else if (gameMode === 'idle') {
        // Idle mode: ALL bosses align with heroes (same as regular enemies)
        const downOffset = 96; // Same as heroes and regular enemies
        y = screenHeight - spriteHeight - buffer + downOffset; // ~916px - consistent alignment
      } else {
        // Raid mode: Corrupted High Priest aligned with heroes, other bosses lower
        const downOffset = isCorruptedHighPriest ? 96 : 192;
        y = screenHeight - spriteHeight - buffer + downOffset; // Corrupted High Priest: ~916px, Others: ~1012px
      }
      
      // Boss horizontal positioning: ensure it's always to the right of hero zone
      // Use the same enemyStartX calculation as regular enemies to prevent overlap
      // Bosses are typically positioned further right than regular enemies
      const bossLeftOffset = 200; // Additional offset for bosses to position them further right
      const bossX = enemyStartX + bossLeftOffset; // Position boss further right than regular enemies
      
      // Ensure boss never overlaps with hero zone (hero zone ends at heroZoneEnd = 1152px)
      const minBossX = heroZoneEnd + leftMargin; // Minimum safe position: 1302px (or 1452px for idle)
      const safeBossX = Math.max(bossX, minBossX);
      
      // Clamp to screen bounds
      const clampedBossX = Math.min(safeBossX, screenWidth - rightMargin);
      
      return {
        left: `${clampedBossX}px`, // Boss positioned safely to the right of hero zone
        top: `${y}px`
      };
    }
    
    // Regular enemies: consistent positioning based on enemy type
    // NO STAGGER - all enemies align at the same Y position
    const isCultist = enemyType === 'Cultist';
    
    // For idle mode: all enemies align with heroes (same as hero baseY)
    // For raid/dungeon: cultists get extra downOffset
    if (gameMode === 'idle') {
      // All enemies align with heroes in idle mode - NO STAGGER
      const downOffset = 96; // Same as heroes
      y = screenHeight - spriteHeight - buffer + downOffset; // ~916px - consistent for all
    } else {
      // Raid/Dungeon: cultists moved down more, regular enemies lowered for dungeon
      const downOffset = isCultist ? 192 : (gameMode === 'dungeon' ? 140 : 96); // Dungeon: ~960px, Raid: ~916px, Cultists: ~1012px
      y = screenHeight - spriteHeight - buffer + downOffset;
    }
    
    return {
      left: `${clampedX}px`,
      top: `${y}px`
    };
  };
  
  // Dungeon-specific positioning (prevents clipping with 2 heroes)
  const getDungeonHeroPosition = (hero: Hero, index: number, allHeroes: Hero[]) => {
    const screenHeight = 1080;
    
    // Sort heroes: DPS/Healers on left, tanks on RIGHT (closest to enemies)
    const sortedHeroes = [...allHeroes].sort((a, b) => {
      const aIsTank = isTankRole(a.role);
      const bIsTank = isTankRole(b.role);
      const aIsHealer = isHealerRole(a.role);
      const bIsHealer = isHealerRole(b.role);
      
      if (aIsTank && !bIsTank) return 1; // Tanks to the right
      if (!aIsTank && bIsTank) return -1;
      if (aIsHealer && !bIsHealer && !bIsTank) return -1; // Healers before DPS
      if (!aIsHealer && bIsHealer && !aIsTank) return 1;
      return 0; // Keep order
    });
    
    const sortedIndex = sortedHeroes.findIndex(h => h.id === hero.id);
    
    // Dynamic horizontal spacing - Stay within left 3/5 of screen (1152px max)
    const screenWidth = 1920;
    const maxHeroWidth = screenWidth * 0.6; // 1152px - left 3/5 of screen
    const leftMargin = 60; // Start from left edge
    const availableWidth = maxHeroWidth - leftMargin - 80; // Reserve 80px buffer on right
    
    // Calculate spacing dynamically based on hero count
    const heroCount = sortedHeroes.length;
    const spacing = heroCount > 1 ? Math.min(140, availableWidth / (heroCount - 1)) : 140;
    
    const x = leftMargin + (sortedIndex * spacing);
    
    // Vertical positioning - align at bottom (NO STAGGER for dungeon)
    // Sprite height scaled 3.0x ~= 240px
    const spriteHeight = 240;
    const buffer = 20;
    const downOffset = 140; // Lower than idle adventure for better dungeon positioning
    const baseY = screenHeight - spriteHeight - buffer + downOffset; // ~960px - lowered for dungeon
    
    // NO STAGGER - all heroes align at the same Y position as enemies
    const y = baseY;
    
    return {
      left: `${x}px`,
      top: `${y}px`
    };
  };
  
  // DEPRECATED: Use getEnemyPosition with gameMode parameter instead
  // Kept for backward compatibility - redirects to unified function
  const getDungeonEnemyPosition = (index: number, total: number, isBoss: boolean = false, heroes?: Hero[]) => {
    return getEnemyPosition(index, total, isBoss, undefined, 'dungeon', heroes);
  };

  // Auto-position heroes horizontally with vertical stagger
  // DPS/Healers left, Tanks right (closest to enemies)
  const getHeroPosition = (hero: Hero, index: number, allHeroes: Hero[]) => {
    const screenHeight = 1080;
    
    // Minions should be positioned near their summoner
    if ((hero as any).isMinion && (hero as any).summonerId) {
      const summoner = allHeroes.find(h => h.id === (hero as any).summonerId && !(h as any).isMinion);
      if (summoner) {
        // Find summoner's position without recursion (calculate directly)
        const nonMinionHeroes = allHeroes.filter(h => !(h as any).isMinion);
        const sortedHeroes = [...nonMinionHeroes].sort((a, b) => {
          const aIsTank = isTankRole(a.role);
          const bIsTank = isTankRole(b.role);
          const aIsHealer = isHealerRole(a.role);
          const bIsHealer = isHealerRole(b.role);
          if (aIsTank && !bIsTank) return 1;
          if (!aIsTank && bIsTank) return -1;
          if (aIsHealer && !bIsHealer && !bIsTank) return -1;
          if (!aIsHealer && bIsHealer && !aIsTank) return 1;
          return 0;
        });
        const summonerSortedIndex = sortedHeroes.findIndex(h => h.id === summoner.id);
        
        // Calculate summoner position
        const screenWidth = 1920;
        const maxHeroWidth = screenWidth * 0.6;
        const leftMargin = 60;
        const availableWidth = maxHeroWidth - leftMargin - 80;
        const heroCount = sortedHeroes.length;
        const spacing = heroCount > 1 ? Math.min(140, availableWidth / (heroCount - 1)) : 140;
        const summonerX = leftMargin + (summonerSortedIndex * spacing);
        
        const screenHeight = 1080;
        const spriteHeight = 240;
        const buffer = 20;
        const downOffset = 96;
        const baseY = screenHeight - spriteHeight - buffer + downOffset;
        const staggerAmount = 30;
        const summonerY = summonerSortedIndex % 2 === 0 ? baseY : baseY - staggerAmount;
        
        // Position minion slightly to the right of summoner
        const minionLeft = summonerX + 80; // 80px to the right of summoner
        return {
          left: `${minionLeft}px`,
          top: `${summonerY}px` // Same Y position as summoner
        };
      }
    }
    
    // Sort heroes: DPS/Healers on left, tanks on RIGHT (closest to enemies)
    // Exclude minions from sorting (they'll be positioned relative to summoner)
    const nonMinionHeroes = allHeroes.filter(h => !(h as any).isMinion);
    const sortedHeroes = [...nonMinionHeroes].sort((a, b) => {
      const aIsTank = isTankRole(a.role);
      const bIsTank = isTankRole(b.role);
      const aIsHealer = isHealerRole(a.role);
      const bIsHealer = isHealerRole(b.role);
      
      if (aIsTank && !bIsTank) return 1; // Tanks to the right
      if (!aIsTank && bIsTank) return -1;
      if (aIsHealer && !bIsHealer && !bIsTank) return -1; // Healers before DPS
      if (!aIsHealer && bIsHealer && !aIsTank) return 1;
      return 0; // Keep order
    });
    
    const sortedIndex = sortedHeroes.findIndex(h => h.id === hero.id);
    
    // Dynamic horizontal spacing - Stay within left 3/5 of screen (1152px max)
    const screenWidth = 1920;
    const maxHeroWidth = screenWidth * 0.6; // 1152px - left 3/5 of screen
    const leftMargin = 60; // Start from left edge
    const availableWidth = maxHeroWidth - leftMargin - 80; // Reserve 80px buffer on right
    
    // Calculate spacing dynamically based on hero count
    const heroCount = sortedHeroes.length;
    const spacing = heroCount > 1 ? Math.min(140, availableWidth / (heroCount - 1)) : 140;
    
    const x = leftMargin + (sortedIndex * spacing);
    
    // Vertical stagger - simple alternating pattern (bottom, higher, bottom, higher...)
    // Sprite height scaled 3.0x ~= 240px, UI above ~= 100px
    const spriteHeight = 240; // Sprite height at 3.0x scale
    const buffer = 20; // Bottom buffer
    const downOffset = 96; // Move down about 1 inch (same as enemies)
    const baseY = screenHeight - spriteHeight - buffer + downOffset; // ~916px base position (moved down)
    
    // Simple alternating stagger: even index = bottom, odd index = higher
    const staggerAmount = 30; // Vertical offset between alternating rows
    const y = sortedIndex % 2 === 0 
      ? baseY // Even index (0, 2, 4...): bottom position
      : baseY - staggerAmount; // Odd index (1, 3, 5...): higher position
    
    return {
      left: `${x}px`,
      top: `${y}px`
    };
  };

  // Test: Force level up for first hero
  const testLevelUp = () => {
    if (heroes.length === 0) return;
    const targetHero = heroes[0];
    
    console.log(`[Test] Forcing level up for ${targetHero.name}`);
    
    setHeroes(current => {
      const updated = current.map(hero => {
        if (hero.id === targetHero.id) {
          const newLevel = hero.level + 1;
          const newMaxXP = 100 + newLevel * 10;
          
          console.log(`[Level Up] ✨ ${hero.name} TEST level up! ${hero.level} → ${newLevel}`);
          
          const leveledHero = calculateHeroStats({
            ...hero,
            level: newLevel,
            xp: 0,
            maxXp: newMaxXP
          });
          
          // Show level up SCT immediately
          setTimeout(() => {
            const heroElement = document.querySelector(`[data-hero-id="${hero.id}"]`);
            if (heroElement) {
              const rect = heroElement.getBoundingClientRect();
              addSCT('LEVEL UP!', rect.left + rect.width / 2, rect.top + 30, 'levelup');
            }
          }, 100);
          
          return leveledHero;
        }
        return hero;
      });
      heroesRef.current = updated;
      return updated;
    });
  };

  if (loading) {
    return (
      <div style={{
        width: '1920px',
        height: '1080px',
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '24px',
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
      }}>
        Loading battlefield...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        width: '1920px',
        height: '1080px',
        background: darkMode ? '#1a1a1a' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        color: '#ef4444',
        fontSize: '20px',
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
      }}>
        <div style={{ marginBottom: '16px', fontSize: '32px' }}>⚠️ Error</div>
        <div>{error}</div>
        <div style={{ marginTop: '24px', fontSize: '14px', opacity: 0.7 }}>
          Check browser console for details
        </div>
      </div>
    );
  }

  // ============================================================================
  // MODE SWITCHING: Conditional rendering based on gameMode
  // ============================================================================
  
  // DUNGEON MODE - Uses same combat display as idle/raid (heroes and enemies state)
  if (gameMode === 'dungeon' && instanceData) {
    // SIMPLIFIED: Just use heroes/enemies state directly!
    // Dungeon setup useEffect already populated them with dungeon room enemies
    // Reuse the same render logic as idle adventure (just different header)
    
    return (
      <div className="clean-battlefield-page" style={{
        width: '1920px',
        height: '1080px',
        background: darkMode ? '#1a1a1a' : 'transparent',
        position: 'relative',
        overflow: 'hidden',
        opacity: fadeOpacity,
        transition: 'opacity 0.5s ease-in-out'
      }}>
        
        {/* Souls-like Boss Health Bar (top-center) - ONLY when boss is active */}
        {enemies.some(e => e.isBoss) && (() => {
          const boss = enemies.find(e => e.isBoss);
          if (!boss) return null;
          
          const bossHpPercent = (boss.hp / boss.maxHp) * 100;
          // Move Corrupted High Priest healthbar down quite a bit
          const isCorruptedHighPriest = boss.name === 'Corrupted High Priest' || boss.enemyType === 'Corrupted High Priest';
          const topPosition = isCorruptedHighPriest ? '600px' : '80px';
          
          return (
            <div style={{
              position: 'absolute',
              top: topPosition,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '800px', // Narrower to fit on screen better (was 1400px)
              maxWidth: '90vw', // Ensure it doesn't exceed viewport
              textAlign: 'center',
              zIndex: 100
            }}>
              {/* Boss Name - Dark Souls style (white, clean) */}
              <div style={{
                color: '#e5e5e5',
                fontSize: '28px',
                fontWeight: '500',
                textShadow: '3px 3px 6px rgba(0,0,0,1)',
                marginBottom: '10px',
                letterSpacing: '8px',
                textTransform: 'uppercase',
                fontFamily: 'Georgia, serif'
              }}>
                {boss.name}
              </div>
              
              {/* Boss HP Bar - Dark Souls style (clean, no glow) */}
              <div style={{
                width: '100%',
                height: '60px',
                backgroundColor: 'rgba(20,20,20,0.95)',
                border: '3px solid rgba(100,100,100,0.8)',
                borderRadius: '0px', // Sharp edges like Dark Souls
                overflow: 'hidden',
                boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.6)',
                position: 'relative'
              }}>
                <div style={{
                  width: `${bossHpPercent}%`,
                  height: '100%',
                  background: '#dc2626', // Solid red, no gradient
                  transition: 'width 0.5s ease',
                  boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.4)'
                }} />
                
                {/* HP Text - Dark Souls style */}
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#e5e5e5',
                  fontSize: '20px',
                  fontWeight: 'normal',
                  textShadow: '2px 2px 4px rgba(0,0,0,1)',
                  letterSpacing: '2px',
                  fontFamily: 'Georgia, serif'
                }}>
                  {Math.floor(boss.hp || 0).toLocaleString()}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Dungeon Header */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          textAlign: 'center',
          color: '#10b981',
          fontSize: '24px',
          fontWeight: 'bold',
          textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
        }}>
          <div style={{ 
            color: '#10b981', 
            fontSize: '20px', 
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)' 
          }}>
            Room {((instanceData.currentRoom || 0) + 1)}/{instanceData.maxRooms || instanceData.totalRooms || (instanceData.rooms?.length || 3)}
          </div>
          <div style={{ 
            color: '#e5e5e5', 
            fontSize: '16px', 
            marginTop: '4px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)' 
          }}>
            {instanceData.dungeonName || 'Dungeon'}
          </div>
        </div>
        
        {/* Heroes - Use dungeon-specific positioning to prevent clipping */}
        {heroes.map((hero, index) => {
          const position = getDungeonHeroPosition(hero, index, heroes);
          const hpPercent = (hero.hp / hero.maxHp) * 100;
          const hasShield = (hero.shield || 0) > 0;
          const spriteKey = hero.isDead ? `${hero.id}-${index}-dead` : `${hero.id}-${index}-alive`;
          
          return (
            <div
              key={spriteKey}
              data-hero-id={hero.id}
              style={{
                position: 'absolute',
                ...position,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              {/* Active Title - ABOVE hero name */}
              {(hero as any).activeTitle && (() => {
                const title = (hero as any).activeTitle as string;
                const isFounder = title?.toLowerCase().includes('founder');
                const founderTier = isFounder ? getFounderTierFromTitle(title) : null;
                const titleColor = founderTier ? getFounderTitleColor(founderTier) : '#fbbf24';
                const displayText = isFounder ? 'Founder' : title;
                
                return (
                  <div style={{
                    color: titleColor,
                    fontSize: '14px',
                    fontWeight: 'bold',
                    fontStyle: 'italic',
                    textShadow: `2px 2px 4px rgba(0,0,0,0.9), 0 0 10px ${titleColor}80`,
                    backgroundColor: 'transparent',
                    marginBottom: '4px',
                    transform: 'translateY(-40px)'
                  }}>
                    {displayText}
                  </div>
                );
              })()}
              
              {/* Hero Name - HIGH ABOVE sprite */}
              <div style={{
                color: hero.isDead ? '#ef4444' : 'white',
                fontSize: '18px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '6px',
                textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
                backgroundColor: 'transparent',
                padding: '2px 8px',
                borderRadius: '4px',
                transform: 'translateY(-40px)',
                ...(getNameFrameStyles(hero.nameFrame as any) || {})
              }}>
                {hero.founderBadge && (
                  <img
                    src={hero.founderBadge}
                    alt="Founder Badge"
                    style={{
                      width: '24px',
                      height: '24px',
                      objectFit: 'contain',
                      filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.9))'
                    }}
                  />
                )}
                <span>
                  <span style={{ color: hero.nameColor || (hero.isDead ? '#ef4444' : 'white') }}>{hero.name}</span> <span style={{ color: '#fbbf24' }}>{hero.level}</span>
                  {hero.isDead && ' 💀'}
                </span>
              </div>

              {/* HP Bar - Smaller for OBS */}
              <div style={{
                width: '120px',
                height: '16px',
                backgroundColor: 'rgba(0,0,0,0.7)',
                border: '1px solid #4a5568',
                borderRadius: '3px',
                marginBottom: '4px',
                overflow: 'hidden',
                transform: 'translateY(-40px)'
              }}>
                {/* HP Fill */}
                <div style={{
                  width: `${hpPercent}%`,
                  height: '100%',
                  backgroundColor: hpPercent > 50 ? '#10b981' : hpPercent > 25 ? '#f59e0b' : '#ef4444',
                  transition: 'width 0.3s ease'
                }} />
                
                {/* HP Text */}
                <div style={{
                  position: 'absolute',
                  width: '120px',
                  textAlign: 'center',
                  marginTop: '-14px',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  textShadow: '1px 1px 2px rgba(0,0,0,1)'
                }}>
                  {Math.floor(hero.hp)} / {hero.maxHp}
                </div>
              </div>

              {/* XP Bar - Smaller for OBS */}
              <div style={{
                width: '120px',
                height: '12px',
                backgroundColor: 'rgba(0,0,0,0.7)',
                border: '1px solid #6366f1',
                borderRadius: '3px',
                marginBottom: '8px',
                overflow: 'hidden',
                transform: 'translateY(-40px)',
                position: 'relative'
              }}>
                {/* XP Fill */}
                <div style={{
                  width: `${Math.min(100, ((hero.xp || 0) / (hero.maxXp || 100)) * 100)}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)',
                  transition: 'width 0.3s ease'
                }} />
                
                {/* XP Text */}
                <div style={{
                  position: 'absolute',
                  width: '120px',
                  textAlign: 'center',
                  marginTop: '-11px',
                  color: 'white',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  textShadow: '1px 1px 2px rgba(0,0,0,1)'
                }}>
                  {Math.floor(hero.xp || 0)} / {hero.maxXp || 100} XP
                </div>
              </div>

              {/* Hero Sprite - Wrap in div for aura, shield glow and enrage effect */}
              <div 
                className={`${hasShield ? 'has-shield' : ''} ${hero.enrageExpiry && hero.enrageExpiry > Date.now() ? 'is-enraged' : ''}`}
                style={{
                  filter: (() => {
                    const isEnraged = hero.enrageExpiry && hero.enrageExpiry > Date.now();
                    const filters = [];
                    
                    // Aura effect (founder pack) - base layer
                    if (hero.auraEffect) {
                      const auraFilters = getAuraFilter(hero.auraEffect as any, hero.auraColor);
                      if (auraFilters) {
                        filters.push(auraFilters);
                      }
                    }
                    
                    // Shield effect (blue glow) - middle layer
                    if (hasShield) {
                      filters.push('drop-shadow(0 0 12px rgba(59, 130, 246, 1))');
                      filters.push('drop-shadow(0 0 24px rgba(59, 130, 246, 0.7))');
                      filters.push('drop-shadow(0 0 36px rgba(59, 130, 246, 0.4))');
                    }
                    
                    // Enrage effect (red glow) - top layer
                    if (isEnraged) {
                      filters.push('drop-shadow(0 0 12px rgba(239, 68, 68, 1))');
                      filters.push('drop-shadow(0 0 24px rgba(239, 68, 68, 0.8))');
                    }
                    
                    return filters.length > 0 ? filters.join(' ') : 'none';
                  })(),
                  transform: hero.enrageExpiry && hero.enrageExpiry > Date.now() ? 'scale(1.15)' : 'scale(1)',
                  transition: 'transform 0.3s ease, filter 0.3s ease'
                }}
              >
                <HeroSpriteJS
                  key={spriteKey}
                  ref={getHeroSpriteRef(hero.id)}
                  heroId={hero.id}
                  role={hero.role}
                  facing={getFacingDirection(hero.role, 'right')}
                  scale={3.0}
                  shield={0}
                />
              </div>
            </div>
          );
        })}

        {/* Enemies - Use unified positioning with dungeon mode */}
        {enemies.map((enemy, index) => {
          const position = getEnemyPosition(index, enemies.length, enemy.isBoss, enemy.enemyType, 'dungeon', heroes);
          const hpPercent = enemy.maxHp && enemy.maxHp > 0 ? ((enemy.hp || 0) / enemy.maxHp) * 100 : 0;
          const hasShield = (enemy.shield || 0) > 0;
          
          return (
            <div
              key={enemy.id}
              data-enemy-id={enemy.id}
              style={{
                position: 'absolute',
                ...position,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              {/* Enemy Name - ONLY for wave mobs, NOT boss */}
              {!enemy.isBoss && (
                <div style={{
                  color: '#ef4444',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  marginBottom: '6px',
                  textShadow: '3px 3px 6px rgba(0,0,0,0.9)',
                  backgroundColor: 'transparent',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  transform: 'translateY(-48px)',
                  position: 'relative',
                  zIndex: 100
                }}>
                  {enemy.name} (Lv{enemy.level})
                </div>
              )}
                
              {/* Enemy HP Bar - ONLY for wave mobs, NOT boss (boss uses bottom bar) */}
              {!enemy.isBoss && (
                <div style={{
                  width: '150px',
                  height: '20px',
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  border: '2px solid #7f1d1d',
                  borderRadius: '6px',
                  marginBottom: '12px',
                  overflow: 'hidden',
                  transform: 'translateY(-48px)',
                  position: 'relative',
                  zIndex: 100
                }}>
                  <div style={{
                    width: `${hpPercent}%`,
                    height: '100%',
                    backgroundColor: '#dc2626',
                    transition: 'width 0.3s ease'
                  }} />
                  <div style={{
                    position: 'absolute',
                    width: '150px',
                    textAlign: 'center',
                    marginTop: '-18px',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textShadow: '2px 2px 4px rgba(0,0,0,1)'
                  }}>
                    {Math.floor(enemy.hp || 0).toLocaleString()} / {(enemy.maxHp || 0).toLocaleString()}
                  </div>
                </div>
              )}
                
              {/* Enemy Sprite */}
              <div 
                className={hasShield ? 'has-shield' : ''}
                style={{
                  width: enemy.isBoss ? '1200px' : 'auto',
                  overflow: 'visible',
                  position: 'relative',
                  // For bosses, ensure bottom alignment
                  ...(enemy.isBoss ? {
                    display: 'flex',
                    alignItems: 'flex-end', // Align sprite to bottom of container
                    justifyContent: 'center'
                  } : {})
                }}
              >
                <EnemySpriteJS
                  ref={getEnemySpriteRef(enemy.id)}
                  enemyId={enemy.id}
                  enemyType={enemy.enemyType || enemy.name}
                  enemyName={enemy.name}
                  facing="left"
                  scale={enemy.isBoss ? 12.0 : 3.0}
                />
              </div>
            </div>
          );
        })}
        
        {/* SCT Messages (reuse from idle mode) */}
        {sctMessages.map(msg => (
          <div
            key={msg.id}
            style={{
              position: 'absolute',
              left: `${msg.x}px`,
              top: `${msg.y}px`,
              color: msg.type === 'damage' ? '#ef4444' :
                     msg.type === 'crit' ? '#fbbf24' :
                     msg.type === 'heal' ? '#10b981' :
                     msg.type === 'heal-hot' ? '#6ee7b7' :
                     msg.type === 'dot' ? '#a855f7' :
                     msg.type === 'loot' ? '#fcd34d' :
                     msg.type === 'levelup' ? '#f472b6' :
                     msg.type === 'questcomplete' ? '#8b5cf6' :
                     msg.type === 'xp' ? '#60a5fa' :
                     msg.type === 'gather' ? '#f472b6' :
                     msg.type === 'profession-xp' ? '#a78bfa' :
                     msg.type === 'miss' ? '#9ca3af' :
                     'white',
              fontSize: msg.type === 'crit' ? '42px' :
                        msg.type === 'levelup' || msg.type === 'questcomplete' ? '28px' :
                        msg.type === 'loot' ? '24px' :
                        msg.type === 'xp' ? '20px' :
                        msg.type === 'heal' ? '28px' :
                        '24px',
              fontWeight: 'bold',
              textShadow: msg.type === 'crit' ? '0 0 10px rgba(251, 191, 36, 0.8), 2px 2px 4px rgba(0,0,0,1)' : 
                          msg.type === 'heal' ? '0 0 8px rgba(16, 185, 129, 0.6), 2px 2px 4px rgba(0,0,0,1)' :
                          '2px 2px 4px rgba(0,0,0,0.9)',
              pointerEvents: 'none',
              animation: msg.type === 'crit' ? 'float-up 3s ease-out forwards' :
                         msg.type === 'heal' ? 'float-up 2.5s ease-out forwards' :
                         'float-up 2s ease-out forwards',
              zIndex: msg.type === 'crit' ? 1001 : 1000,
              transform: msg.type === 'crit' ? 'scale(1.2)' : 'scale(1)'
            }}
          >
            {msg.type === 'crit' && '💥 '}{msg.text}{msg.type === 'heal' && ' 💚'}
          </div>
        ))}

      </div>
    );
  }
  
  // RAID MODE  
  if (gameMode === 'raid' && instanceData) {
    // SIMPLIFIED: Just use heroes/enemies state directly!
    // Raid setup useEffect already populated them with ONLY raid participants
    
    return (
      <div style={{ 
        width: '1920px', 
        height: '1080px', 
        position: 'relative', 
        backgroundColor: 'transparent', 
        overflow: 'hidden', 
        fontFamily: 'Arial, sans-serif',
        opacity: fadeOpacity,
        transition: 'opacity 0.5s ease-in-out'
      }}>
        
        {/* Souls-like Boss Health Bar (top-center) - ONLY when boss is active */}
        {enemies.some(e => e.isBoss) && (() => {
          const boss = enemies.find(e => e.isBoss);
          if (!boss) return null;
          
          const bossHpPercent = (boss.hp / boss.maxHp) * 100;
          // Move Corrupted High Priest healthbar down quite a bit
          const isCorruptedHighPriest = boss.name === 'Corrupted High Priest' || boss.enemyType === 'Corrupted High Priest';
          const topPosition = isCorruptedHighPriest ? '800px' : '250px'; // Positioned just above combat area, not in middle of screen
          
          return (
            <div style={{
              position: 'absolute',
              top: topPosition,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '700px', // Half of 1400px
              textAlign: 'center',
              zIndex: 100
            }}>
              {/* Boss Name - Dark Souls style (white, clean) */}
              <div style={{
                color: '#e5e5e5',
                fontSize: '14px', // Half of 28px
                fontWeight: '500',
                textShadow: '3px 3px 6px rgba(0,0,0,1)',
                marginBottom: '5px', // Half of 10px
                letterSpacing: '4px', // Half of 8px
                textTransform: 'uppercase',
                fontFamily: 'Georgia, serif'
              }}>
                {boss.name}
              </div>
              
              {/* Boss HP Bar - Dark Souls style (clean, no glow) */}
              <div style={{
                width: '100%',
                height: '30px', // Half of 60px
                backgroundColor: 'rgba(20,20,20,0.95)',
                border: '2px solid rgba(100,100,100,0.8)', // Half of 3px
                borderRadius: '0px', // Sharp edges like Dark Souls
                overflow: 'hidden',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6)', // Half of 4px 8px
                position: 'relative'
              }}>
                <div style={{
                  width: `${bossHpPercent}%`,
                  height: '100%',
                  background: '#dc2626', // Solid red, no gradient
                  transition: 'width 0.5s ease',
                  boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.4)' // Half of 4px 8px
                }} />
                
                {/* HP Text - Dark Souls style */}
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#e5e5e5',
                  fontSize: '10px', // Half of 20px
                  fontWeight: 'normal',
                  textShadow: '2px 2px 4px rgba(0,0,0,1)',
                  letterSpacing: '1px', // Half of 2px
                  fontFamily: 'Georgia, serif'
                }}>
                  {Math.floor(boss.hp || 0).toLocaleString()}
                </div>
              </div>
            </div>
          );
        })()}
        {/* REMOVED: Raid Header - Clean HUD like Dark Souls */}
        
        {/* Debug: Add Shield Button - HIDDEN (shield visual confirmed working!)
        <button onClick={() => { setHeroes(current => { const updated = current.map((h, i) => i === 0 ? { ...h, shield: (h.shield || 0) + 500 } : h); heroesRef.current = updated; return updated; }); }} style={{ position: 'absolute', top: '20px', left: '20px', backgroundColor: '#3b82f6', color: 'white', padding: '12px 24px', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', zIndex: 1000 }}>🛡️ Add Shield</button>
        */}
        
        {/* Wave Announcement - Shows between waves */}
        {showWaveAnnouncement && (
          <div style={{
            position: 'absolute',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '64px',
            fontWeight: 'bold',
            color: '#fbbf24',
            textShadow: '0 0 30px rgba(0,0,0,1), 0 0 60px rgba(251, 191, 36, 0.8)',
            zIndex: 999,
            pointerEvents: 'none',
            textAlign: 'center',
            animation: 'fadeInOut 2s ease-in-out'
          }}>
            🐉 Wave {(instanceData.currentWave || 0) + 1} / {instanceData.waves || 5} 🐉
          </div>
        )}
        
        {/* Rare Loot Announcement - Shows when Rare/Epic/Legendary/Mythic drops */}
        {rareLootAnnouncement && (() => {
          const style = getRarityStyle(rareLootAnnouncement.rarity as any);
          return (
            <div style={{
              position: 'absolute',
              top: '30%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: `linear-gradient(135deg, ${style.bgColor}ee, #000000cc)`,
              border: `3px solid ${style.borderColor}`,
              borderRadius: '16px',
              padding: '24px 32px',
              boxShadow: `0 0 40px ${style.glowColor}, inset 0 0 20px ${style.glowColor}`,
              zIndex: 1000,
              pointerEvents: 'none',
              animation: 'fadeInOut 5s ease-in-out',
              minWidth: '400px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: style.color,
                textShadow: `0 0 15px ${style.glowColor}`,
                marginBottom: '12px',
                letterSpacing: '2px'
              }}>
                {style.emoji} {style.label.toUpperCase()} DROP! {style.emoji}
              </div>
              <div style={{
                fontSize: '24px',
                color: 'white',
                textShadow: '2px 2px 6px rgba(0,0,0,0.9)',
                fontWeight: '500'
              }}>
                {rareLootAnnouncement.heroName} looted:
              </div>
              <div style={{
                fontSize: '28px',
                color: style.color,
                textShadow: `0 0 10px ${style.glowColor}`,
                fontWeight: 'bold',
                marginTop: '8px'
              }}>
                {rareLootAnnouncement.itemName}
              </div>
            </div>
          );
        })()}
        
        {/* Wave Announcement - Shows between waves */}
        {showWaveAnnouncement && (
          <div style={{
            position: 'absolute',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '64px',
            fontWeight: 'bold',
            color: '#fbbf24',
            textShadow: '0 0 30px rgba(0,0,0,1), 0 0 60px rgba(251, 191, 36, 0.8)',
            zIndex: 999,
            pointerEvents: 'none',
            textAlign: 'center',
            animation: 'fadeInOut 2s ease-in-out'
          }}>
            🐉 Wave {(instanceData.currentWave || 0) + 1} / {instanceData.waves || 5} 🐉
          </div>
        )}
        
        {/* Raid Party - heroes state already filtered to participants! */}
        {heroes.map((hero, index) => {
          const position = getHeroPosition(hero, index, heroes);
          const hpPercent = (hero.hp / hero.maxHp) * 100;
          const hasShield = (hero.shield || 0) > 0;
          const spriteKey = hero.isDead ? `${hero.id}-${index}-dead` : `${hero.id}-${index}-alive`;
          
          return (
            <div
              key={spriteKey}
              data-hero-id={hero.id}
              style={{
                position: 'absolute',
                ...position, // Use idle adventure positioning!
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              {/* Active Title - ABOVE hero name */}
              {(hero as any).activeTitle && (() => {
                const title = (hero as any).activeTitle as string;
                const isFounder = title?.toLowerCase().includes('founder');
                const founderTier = isFounder ? getFounderTierFromTitle(title) : null;
                const titleColor = founderTier ? getFounderTitleColor(founderTier) : '#fbbf24';
                const displayText = isFounder ? 'Founder' : title;
                
                return (
                  <div style={{
                    color: titleColor,
                    fontSize: '14px',
                    fontWeight: 'bold',
                    fontStyle: 'italic',
                    textShadow: `2px 2px 4px rgba(0,0,0,0.9), 0 0 10px ${titleColor}80`,
                    backgroundColor: 'transparent',
                    marginBottom: '4px',
                    transform: 'translateY(-40px)'
                  }}>
                    {displayText}
                  </div>
                );
              })()}
              
              {/* Hero Name - HIGH ABOVE sprite (same as idle) */}
              <div style={{
                color: hero.isDead ? '#ef4444' : 'white',
                fontSize: '18px',
                fontWeight: 'bold',
                marginBottom: '6px',
                textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
                backgroundColor: 'transparent',
                padding: '2px 8px',
                borderRadius: '4px',
                transform: 'translateY(-40px)',
                ...(getNameFrameStyles(hero.nameFrame as any) || {})
              }}>
                <span style={{ color: hero.nameColor || (hero.isDead ? '#ef4444' : 'white') }}>{hero.name}</span> <span style={{ color: '#fbbf24' }}>{hero.level}</span>
                {hero.isDead && ' 💀'}
              </div>
              
              {/* HP Bar - Smaller for OBS */}
              <div style={{
                width: '120px',
                height: '16px',
                backgroundColor: 'rgba(0,0,0,0.7)',
                border: '1px solid #4a5568',
                borderRadius: '3px',
                marginBottom: '4px',
                overflow: 'hidden',
                transform: 'translateY(-40px)'
              }}>
                <div style={{
                  width: `${hpPercent}%`,
                  height: '100%',
                  backgroundColor: hpPercent > 50 ? '#10b981' : hpPercent > 25 ? '#f59e0b' : '#ef4444',
                  transition: 'width 0.3s ease'
                }} />
                <div style={{
                  position: 'absolute',
                  width: '120px',
                  textAlign: 'center',
                  marginTop: '-14px',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  textShadow: '1px 1px 2px rgba(0,0,0,1)'
                }}>
                  {Math.floor(hero.hp)} / {hero.maxHp}
                </div>
              </div>
              
              {/* XP Bar - Smaller for OBS */}
              <div style={{
                width: '120px',
                height: '12px',
                backgroundColor: 'rgba(0,0,0,0.7)',
                border: '1px solid #6366f1',
                borderRadius: '3px',
                marginBottom: '8px',
                overflow: 'hidden',
                transform: 'translateY(-40px)',
                position: 'relative'
              }}>
                {/* XP Fill */}
                <div style={{
                  width: `${Math.min(100, ((hero.xp || 0) / (hero.maxXp || 100)) * 100)}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)',
                  transition: 'width 0.3s ease'
                }} />
                
                {/* XP Text */}
                <div style={{
                  position: 'absolute',
                  width: '120px',
                  textAlign: 'center',
                  marginTop: '-11px',
                  color: 'white',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  textShadow: '1px 1px 2px rgba(0,0,0,1)'
                }}>
                  {Math.floor(hero.xp || 0)} / {hero.maxXp || 100} XP
                </div>
              </div>
              
              {/* Hero Sprite with ALL visual effects (shield, enrage) */}
              <div 
                style={{
                  display: 'inline-block',
                  // Combine filters: aura + shield + enrage
                  filter: (() => {
                    const isEnraged = hero.enrageExpiry && hero.enrageExpiry > Date.now();
                    const filters = [];
                    
                    // Aura effect (founder pack) - base layer
                    if (hero.auraEffect) {
                      const auraFilters = getAuraFilter(hero.auraEffect as any, hero.auraColor);
                      if (auraFilters) {
                        filters.push(auraFilters);
                      }
                    }
                    
                    // Shield effect (blue glow) - middle layer
                    if (hasShield) {
                      filters.push('drop-shadow(0 0 12px rgba(59, 130, 246, 1))');
                      filters.push('drop-shadow(0 0 24px rgba(59, 130, 246, 0.7))');
                      filters.push('drop-shadow(0 0 36px rgba(59, 130, 246, 0.4))');
                    }
                    
                    // Enrage effect (red glow) - top layer
                    if (isEnraged) {
                      filters.push('drop-shadow(0 0 12px rgba(239, 68, 68, 1))');
                      filters.push('drop-shadow(0 0 24px rgba(239, 68, 68, 0.8))');
                    }
                    
                    return filters.length > 0 ? filters.join(' ') : 'none';
                  })(),
                  transform: hero.enrageExpiry && hero.enrageExpiry > Date.now() ? 'scale(1.15)' : 'scale(1)',
                  transition: 'transform 0.3s ease, filter 0.3s ease'
                }}
              >
                {hasShield && console.log(`[Shield Visual] 💙 ${hero.name} has ${hero.shield} shield - BLUE GLOW!`)}
                {hero.enrageExpiry && hero.enrageExpiry > Date.now() && console.log(`[Enrage Visual] 😡 ${hero.name} is enraged - RED GLOW + scale 1.15x!`)}
                <HeroSpriteJS
                  key={spriteKey}
                  ref={getHeroSpriteRef(hero.id)}
                  heroId={hero.id}
                  role={hero.role}
                  facing={getFacingDirection(hero.role, 'right')}
                  scale={3.0} // Same scale as idle
                  shield={0}
                  auraEffect={hero.auraEffect as any}
                />
              </div>
            </div>
          );
        })}
        
        {/* Raid Enemies (Wave mobs OR Boss) - Use unified positioning */}
        {enemies.map((enemy, index) => {
          const position = getEnemyPosition(index, enemies.length, enemy.isBoss, enemy.enemyType, 'raid');
          const hpPercent = enemy.maxHp && enemy.maxHp > 0 ? ((enemy.hp || 0) / enemy.maxHp) * 100 : 0;
          const hasShield = (enemy.shield || 0) > 0;
          
          return (
            <div
              key={enemy.id}
              data-enemy-id={enemy.id}
              style={{
                position: 'absolute',
                ...position,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              {/* Enemy Name - ONLY for wave mobs, NOT boss (boss uses bottom bar) */}
              {!enemy.isBoss && (
                <div style={{
                  color: '#ef4444',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  marginBottom: '6px',
                  textShadow: '3px 3px 6px rgba(0,0,0,0.9)',
                  backgroundColor: 'transparent',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  transform: 'translateY(-48px)',
                  position: 'relative',
                  zIndex: 100
                }}>
                  {enemy.name} (Lv{enemy.level})
                </div>
              )}
                
              {/* Enemy HP Bar - ONLY for wave mobs, NOT boss */}
              {!enemy.isBoss && (
                <div style={{
                  width: '150px',
                  height: '20px',
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  border: '2px solid #7f1d1d',
                  borderRadius: '6px',
                  marginBottom: '12px',
                  overflow: 'hidden',
                  transform: 'translateY(-48px)',
                  position: 'relative',
                  zIndex: 100
                }}>
                  <div style={{
                    width: `${hpPercent}%`,
                    height: '100%',
                    backgroundColor: '#dc2626',
                    transition: 'width 0.3s ease'
                  }} />
                  <div style={{
                    position: 'absolute',
                    width: '150px',
                    textAlign: 'center',
                    marginTop: '-18px',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textShadow: '2px 2px 4px rgba(0,0,0,1)'
                  }}>
                    {Math.floor(enemy.hp || 0).toLocaleString()} / {(enemy.maxHp || 0).toLocaleString()}
                  </div>
                </div>
              )}
                
              {/* Enemy Sprite - with shield glow and extra space for Elder Dragon tail */}
              <div 
                className={hasShield ? 'has-shield' : ''}
                style={{
                  width: enemy.isBoss ? '1200px' : 'auto', // Extra width for Elder Dragon tail
                  overflow: 'visible', // Don't crop the tail!
                  position: 'relative'
                }}
              >
                {(() => {
                  // Bosses should NEVER get cultist scale - they need to be huge!
                  const isCultist = !enemy.isBoss && (enemy.enemyType === 'Cultist' || enemy.enemyType === 'Corrupted High Priest');
                  const cultistScale = 0.075; // Half of 0.15
                  const cultistFacing = 'left';
                  
                  // Map enemy names to sprite folder names
                  const spriteMap: Record<string, string> = {
                    'Baby Dragon': 'Baby Dragon',
                    'Dragon Whelp': 'Dragon_1',
                    'Dragon Guardian': 'Dragon_2',
                    'Dragon Sentinel': 'Dragon_3',
                    'Elder Dragon': 'Elder Dragon' // MUST match getEnemyAnimationKey mapping!
                  };
                  const mappedType = spriteMap[enemy.name] || enemy.name;
                  
                  // For raid mode, default facing should be 'right' (opposite of idle/dungeon)
                  const defaultRaidFacing = 'right';
                  const defaultFacing = defaultRaidFacing;
                  
                  // Boss facing: Corrupted High Priest should face left, others use default
                  const baseFacing = enemy.isBoss && enemy.enemyType === 'Corrupted High Priest' 
                    ? 'left' 
                    : isCultist 
                      ? cultistFacing 
                      : (mappedType.startsWith('Dragon_') ? 'left' : getFacingDirection(enemy.enemyType || mappedType, defaultFacing));
                  
                  // Boss scale: Corrupted High Priest boss should be smaller than other bosses
                  const finalScale = enemy.isBoss 
                    ? (enemy.enemyType === 'Corrupted High Priest' ? 3.0 : 12.0) // Corrupted High Priest boss gets normal enemy scale
                    : isCultist 
                      ? cultistScale 
                      : (mappedType.startsWith('Dragon_') ? 6.0 : 3.0);
                  
                  if (enemy.isBoss) {
                    console.log(`[Raid Boss Scale] ${enemy.name} - enemyType: "${enemy.enemyType}", isBoss: ${enemy.isBoss}, finalScale: ${finalScale}`);
                  }
                  
                  return (
                    <EnemySpriteJS
                      ref={getEnemySpriteRef(enemy.id)}
                      enemyId={enemy.id}
                      enemyType={enemy.enemyType || mappedType}
                      enemyName={enemy.name}
                      facing={baseFacing}
                      scale={finalScale}
                    />
                  );
                })()}
              </div>
            </div>
          );
        })}
        
        {/* SCT Messages (reuse from idle mode) */}
        {sctMessages.map(msg => (
          <div
            key={msg.id}
            style={{
              position: 'absolute',
              left: `${msg.x}px`,
              top: `${msg.y}px`,
              color: msg.type === 'damage' ? '#ef4444' :       // RED for damage!
                     msg.type === 'crit' ? '#fbbf24' :          // Gold for crits
                     msg.type === 'heal' ? '#10b981' :          // GREEN for healing!
                     msg.type === 'heal-hot' ? '#6ee7b7' :      // Light green for HoT
                     msg.type === 'dot' ? '#a855f7' :           // Purple for DoT
                     msg.type === 'loot' ? '#fcd34d' :          // Yellow for loot
                     msg.type === 'levelup' ? '#f472b6' :       // Pink for level up
                     msg.type === 'questcomplete' ? '#8b5cf6' : // Purple for quest
                     msg.type === 'xp' ? '#60a5fa' :            // Blue for XP
                     msg.type === 'gather' ? '#f472b6' :        // Pink for gather
                     msg.type === 'profession-xp' ? '#a78bfa' : // Light purple
                     msg.type === 'miss' ? '#9ca3af' :          // Gray for miss
                     'white',                                    // Default white
              fontSize: msg.type === 'crit' ? '42px' :          // BIGGER crits!
                        msg.type === 'levelup' || msg.type === 'questcomplete' ? '28px' :
                        msg.type === 'loot' ? '24px' :
                        msg.type === 'xp' ? '20px' :
                        msg.type === 'heal' ? '28px' :          // Bigger heals!
                        '24px',
              fontWeight: 'bold',
              textShadow: msg.type === 'crit' ? '0 0 10px rgba(251, 191, 36, 0.8), 2px 2px 4px rgba(0,0,0,1)' : 
                          msg.type === 'heal' ? '0 0 8px rgba(16, 185, 129, 0.6), 2px 2px 4px rgba(0,0,0,1)' :
                          '2px 2px 4px rgba(0,0,0,0.9)',
              pointerEvents: 'none',
              animation: msg.type === 'crit' ? 'float-up 3s ease-out forwards' :  // Crits last longer!
                         msg.type === 'heal' ? 'float-up 2.5s ease-out forwards' : // Heals linger
                         'float-up 2s ease-out forwards',
              zIndex: msg.type === 'crit' ? 1001 : 1000, // Crits on top!
              transform: msg.type === 'crit' ? 'scale(1.2)' : 'scale(1)' // Crits bigger!
            }}
          >
            {msg.type === 'crit' && '💥 '}{msg.text}{msg.type === 'heal' && ' 💚'}
          </div>
        ))}
      </div>
    );
  }
  
  // ============================================================================
  // IDLE ADVENTURE MODE (default)
  // ============================================================================
  
  return (
    <div className="clean-battlefield-page" style={{
      width: '1920px',
      height: '1080px',
      background: darkMode ? '#1a1a1a' : 'transparent',
      position: 'relative',
      overflow: 'hidden',
      opacity: fadeOpacity,
      transition: 'opacity 0.5s ease-in-out'
    }}>

      {/* Heroes (including test healer) */}
      {allHeroes && allHeroes.map((hero, index) => {
        const position = getHeroPosition(hero, index, heroes);
        const hpPercent = (hero.hp / hero.maxHp) * 100;
        
        // Force remount ONLY when resurrected (not on HP change!)
        const spriteKey = hero.isDead ? `${hero.id}-${index}-dead` : `${hero.id}-${index}-alive`;

        const hasShield = (hero.shield || 0) > 0;

        return (
          <div
            key={spriteKey}
            data-hero-id={hero.id}
            style={{
              position: 'absolute',
              ...position,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            {/* Active Title - ABOVE hero name */}
            {(hero as any).activeTitle && (() => {
              const title = (hero as any).activeTitle as string;
              const isFounder = title?.toLowerCase().includes('founder');
              const founderTier = isFounder ? getFounderTierFromTitle(title) : null;
              const titleColor = founderTier ? getFounderTitleColor(founderTier) : '#fbbf24';
              const displayText = isFounder ? 'Founder' : title;
              
              return (
                <div style={{
                  color: titleColor,
                  fontSize: '14px',
                  fontWeight: 'bold',
                  fontStyle: 'italic',
                  textShadow: `2px 2px 4px rgba(0,0,0,0.9), 0 0 10px ${titleColor}80`,
                  backgroundColor: 'transparent',
                  marginBottom: '4px',
                  transform: 'translateY(-40px)'
                }}>
                  {displayText}
                </div>
              );
            })()}
            
            {/* Hero Name - HIGH ABOVE sprite */}
            <div style={{
              color: hero.isDead ? '#ef4444' : 'white',
              fontSize: '18px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '6px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
              backgroundColor: 'transparent',
              padding: '2px 8px',
              borderRadius: '4px',
              transform: 'translateY(-40px)', // Move UP by 40px
              ...(getNameFrameStyles(hero.nameFrame as any) || {})
            }}>
              {hero.founderBadge && (
                <img
                  src={hero.founderBadge}
                  alt="Founder Badge"
                  style={{
                    width: '24px',
                    height: '24px',
                    objectFit: 'contain',
                    filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.9))'
                  }}
                />
              )}
              <span>
                <span style={{ color: hero.nameColor || (hero.isDead ? '#ef4444' : 'white') }}>{hero.name}</span> <span style={{ color: '#fbbf24' }}>{hero.level}</span>
                {hero.isDead && ' 💀'}
              </span>
            </div>

            {/* Prestige Stars - Below hero name */}
            {(() => {
              const prestigeLevel = (hero as any).prestigeLevel || hero.prestigeLevel || 0;
              
              if (prestigeLevel > 0) {
                // Determine tier based on prestige level
                // Bronze: Prestige 1-5 (1 star per prestige = 5 bronze stars max)
                // Silver: Prestige 6-10 (1 star per prestige, starts fresh at prestige 6)
                // Gold: Prestige 11-20 (1 star per prestige, starts fresh at prestige 11)
                // Platinum: Prestige 21-30 (1 star per prestige, starts fresh at prestige 21)
                // Mythic: Prestige 31+ (1 star per prestige, starts fresh at prestige 31)
                
                let tier = 'bronze';
                let color = '#CD7F32'; // Bronze
                let starsToShow = 0;
                
                if (prestigeLevel >= 31) {
                  tier = 'mythic';
                  color = '#FF1493'; // Deep pink
                  // Mythic: prestige 31+ (1 star per prestige, starts at prestige 31)
                  starsToShow = prestigeLevel - 30;
                } else if (prestigeLevel >= 21) {
                  tier = 'platinum';
                  color = '#E5E4E2'; // Platinum
                  // Platinum: prestige 21-30 (1 star per prestige, starts at prestige 21)
                  starsToShow = prestigeLevel - 20;
                } else if (prestigeLevel >= 11) {
                  tier = 'gold';
                  color = '#FFD700'; // Gold
                  // Gold: prestige 11-20 (1 star per prestige, starts at prestige 11)
                  starsToShow = prestigeLevel - 10;
                } else if (prestigeLevel >= 6) {
                  tier = 'silver';
                  color = '#C0C0C0'; // Silver
                  // Silver: prestige 6-10 (1 star per prestige, starts at prestige 6)
                  starsToShow = prestigeLevel - 5;
                } else {
                  tier = 'bronze';
                  color = '#CD7F32'; // Bronze
                  // Bronze: prestige 1-5 (1 star per prestige)
                  starsToShow = prestigeLevel;
                }
                
                // Debug: Log the calculation (remove in production)
                if (process.env.NODE_ENV === 'development') {
                  console.log(`[Prestige Stars] prestigeLevel: ${prestigeLevel}, tier: ${tier}, starsToShow: ${starsToShow}`);
                }
                
                // Display stars in rows of 5
                const fullRows = Math.floor(starsToShow / 5);
                const remainingStars = starsToShow % 5;
                
                // TODO: When bronze star images are added, replace emoji with:
                // <img src="/Badges/BronzeStar.png" alt="Bronze Star" style={{ width: '14px', height: '14px', filter: `drop-shadow(0 0 2px ${color})` }} />
                
                return (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    marginBottom: '4px',
                    transform: 'translateY(-36px)',
                    position: 'relative',
                    zIndex: 10
                  }}>
                    {/* Full rows of 5 stars */}
                    {Array.from({ length: fullRows }).map((_, rowIdx) => (
                      <div key={`row-${rowIdx}`} style={{ display: 'flex', gap: '2px' }}>
                        {Array.from({ length: 5 }).map((_, starIdx) => (
                          <span
                            key={`star-${rowIdx}-${starIdx}`}
                            style={{
                              color: color,
                              fontSize: '14px',
                              textShadow: `0 0 4px ${color}80, 1px 1px 2px rgba(0,0,0,0.9)`,
                              filter: `drop-shadow(0 0 2px ${color})`,
                              lineHeight: '1'
                            }}
                          >
                            ⭐
                          </span>
                        ))}
                      </div>
                    ))}
                    {/* Remaining stars (less than 5) */}
                    {remainingStars > 0 && (
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {Array.from({ length: remainingStars }).map((_, starIdx) => (
                          <span
                            key={`remaining-${starIdx}`}
                            style={{
                              color: color,
                              fontSize: '14px',
                              textShadow: `0 0 4px ${color}80, 1px 1px 2px rgba(0,0,0,0.9)`,
                              filter: `drop-shadow(0 0 2px ${color})`,
                              lineHeight: '1'
                            }}
                          >
                            ⭐
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            })()}

            {/* Resurrection Timer (if dead) - ABOVE sprite */}
            {hero.isDead && resurrectionTimers[hero.id] !== undefined && (
              <div style={{
                color: '#fbbf24',
                fontSize: '14px',
                fontWeight: 'bold',
                marginBottom: '6px',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                backgroundColor: 'rgba(0,0,0,0.7)',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #fbbf24',
                transform: 'translateY(-40px)' // Move UP to match name/HP
              }}>
                ✨ Resurrecting in {Math.ceil(resurrectionTimers[hero.id] / 1000)}s
              </div>
            )}

            {/* HP Bar - Smaller for OBS */}
            <div style={{
              width: '120px',
              height: '16px',
              backgroundColor: 'rgba(0,0,0,0.7)',
              border: '1px solid #4a5568',
              borderRadius: '3px',
              marginBottom: '4px',
              overflow: 'hidden',
              transform: 'translateY(-40px)' // Move UP by 40px to match name
            }}>
              {/* HP Fill */}
              <div style={{
                width: `${hpPercent}%`,
                height: '100%',
                backgroundColor: hpPercent > 50 ? '#10b981' : hpPercent > 25 ? '#f59e0b' : '#ef4444',
                transition: 'width 0.3s ease'
              }} />
              
              {/* HP Text */}
              <div style={{
                position: 'absolute',
                width: '120px',
                textAlign: 'center',
                marginTop: '-14px',
                color: 'white',
                fontSize: '10px',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px rgba(0,0,0,1)'
              }}>
                {Math.floor(hero.hp)} / {hero.maxHp}
              </div>
            </div>

            {/* XP Bar - Smaller for OBS */}
            <div style={{
              width: '120px',
              height: '12px',
              backgroundColor: 'rgba(0,0,0,0.7)',
              border: '1px solid #6366f1',
              borderRadius: '3px',
              marginBottom: '8px',
              overflow: 'hidden',
              transform: 'translateY(-40px)',
              position: 'relative'
            }}>
              {/* XP Fill */}
              <div style={{
                width: `${Math.min(100, ((hero.xp || 0) / (hero.maxXp || 100)) * 100)}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)',
                transition: 'width 0.3s ease'
              }} />
              
              {/* XP Text */}
              <div style={{
                position: 'absolute',
                width: '120px',
                textAlign: 'center',
                marginTop: '-11px',
                color: 'white',
                fontSize: '9px',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px rgba(0,0,0,1)'
              }}>
                {Math.floor(hero.xp || 0)} / {hero.maxXp || 100} XP
              </div>
            </div>

            {/* Hero Sprite - Wrap in div for aura, shield glow and enrage effect */}
            <div 
              className={`${hasShield ? 'has-shield' : ''} ${hero.enrageExpiry && hero.enrageExpiry > Date.now() ? 'is-enraged' : ''}`}
              style={{
                // Combine filters: aura + shield + enrage (same as raid mode)
                filter: (() => {
                  const isEnraged = hero.enrageExpiry && hero.enrageExpiry > Date.now();
                  const filters = [];
                  
                  // Aura effect (founder pack) - base layer
                  if (hero.auraEffect) {
                    const auraFilters = getAuraFilter(hero.auraEffect as any, hero.auraColor);
                    if (auraFilters) {
                      filters.push(auraFilters);
                    }
                  }
                  
                  // Shield effect (blue glow) - middle layer
                  if (hasShield) {
                    filters.push('drop-shadow(0 0 12px rgba(59, 130, 246, 1))');
                    filters.push('drop-shadow(0 0 24px rgba(59, 130, 246, 0.7))');
                    filters.push('drop-shadow(0 0 36px rgba(59, 130, 246, 0.4))');
                  }
                  
                  // Enrage effect (red glow) - top layer
                  if (isEnraged) {
                    filters.push('drop-shadow(0 0 12px rgba(239, 68, 68, 1))');
                    filters.push('drop-shadow(0 0 24px rgba(239, 68, 68, 0.8))');
                  }
                  
                  return filters.length > 0 ? filters.join(' ') : 'none';
                })(),
                transform: hero.enrageExpiry && hero.enrageExpiry > Date.now() ? 'scale(1.15)' : 'scale(1)',
                transition: 'transform 0.3s ease, filter 0.3s ease'
              }}
            >
              <HeroSpriteJS
                key={spriteKey}
                ref={getHeroSpriteRef(hero.id)}
                heroId={hero.id}
                role={hero.role}
                facing={getFacingDirection(hero.role, 'right')}
                scale={3.0}
                shield={0}
              />
            </div>
          </div>
        );
      })}

      {/* Enemies - Use unified positioning */}
      {enemies && enemies.map((enemy, index) => {
        const position = getEnemyPosition(index, enemies.length, enemy.isBoss || false, enemy.enemyType, 'idle');
        const hpPercent = enemy.maxHp && enemy.maxHp > 0 ? ((enemy.hp || 0) / enemy.maxHp) * 100 : 0;
        const hasShield = (enemy.shield || 0) > 0;

        return (
          <div
            key={enemy.id}
            data-enemy-id={enemy.id}
            style={{
              position: 'absolute',
              ...position,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            {/* Enemy Name */}
            <div style={{
              color: enemy.isBoss ? '#fbbf24' : '#ef4444',
              fontSize: enemy.isBoss ? '18px' : '16px',
              fontWeight: 'bold',
              marginBottom: '4px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              backgroundColor: 'transparent',
              padding: '2px 8px',
              borderRadius: '4px',
              transform: 'translateY(-40px)' // Moved UP to match hero UI
            }}>
              {enemy.isBoss && '👑 '}{enemy.name} (Lv{enemy.level})
            </div>

            {/* HP Bar - Smaller for OBS, moved UP to match heroes */}
            <div style={{
              width: '120px',
              height: '16px',
              backgroundColor: 'rgba(0,0,0,0.7)',
              border: '1px solid #4a5568',
              borderRadius: '3px',
              marginBottom: '8px',
              overflow: 'hidden',
              transform: 'translateY(-40px)' // Moved UP to match hero UI
            }}>
              {/* HP Fill */}
              <div style={{
                width: `${hpPercent}%`,
                height: '100%',
                backgroundColor: enemy.isBoss ? '#fbbf24' : '#ef4444',
                transition: 'width 0.3s ease'
              }} />
              
              {/* HP Text */}
              <div style={{
                position: 'absolute',
                width: '120px',
                textAlign: 'center',
                marginTop: '-14px',
                color: 'white',
                fontSize: '10px',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px rgba(0,0,0,1)'
              }}>
                {Math.floor(enemy.hp)} / {enemy.maxHp}
              </div>
            </div>

            {/* Enemy Sprite - Wrap in div for shield glow */}
            <div 
              className={hasShield ? 'has-shield' : ''}
              style={{
                display: 'inline-block',
                width: 'auto',
                height: 'auto'
              }}
            >
              {(() => {
                // Bosses should NEVER get cultist scale
                const isCultist = !enemy.isBoss && (enemy.enemyType === 'Cultist' || enemy.enemyType === 'Corrupted High Priest');
                // Scale down: 200x200 sprite -> 48px viewport (0.24x) -> then 0.075x multiplier = ~3.6px final
                const cultistScale = 0.075; // Half of 0.15
                const cultistFacing = 'left'; // Sprite faces right by default, so 'left' flips it with scaleX(-1)
                
                // For raid mode, default facing should be 'right' (opposite of idle/dungeon)
                // Most enemies face left by default, but in raid they should face right
                const defaultRaidFacing = 'right';
                const defaultFacing = gameMode === 'raid' ? defaultRaidFacing : 'left';
                
                // Boss facing: Corrupted High Priest should face left, others use default
                const baseFacing = enemy.isBoss && enemy.enemyType === 'Corrupted High Priest'
                  ? 'left'
                  : isCultist
                    ? cultistFacing
                    : getFacingDirection(enemy.enemyType || enemy.name, defaultFacing);
                
                // Scale: cultist gets small scale, bosses get normal scale (3.0), others get 3.0
                const finalScale = isCultist ? cultistScale : 3.0;
                
                return (
                  <EnemySpriteJS
                    ref={getEnemySpriteRef(enemy.id)}
                    enemyId={enemy.id}
                    enemyType={enemy.enemyType || enemy.name}
                    enemyName={enemy.name}
                    facing={baseFacing}
                    scale={finalScale}
                    isTransformed={enemy.isTransformed || false}
                  />
                );
              })()}
            </div>
          </div>
        );
      })}

      {/* Minimal Status - Single Line at Bottom */}
      {(() => {
        // Calculate needed classes
        const aliveHeroes = heroes.filter(h => !h.isDead && h.hp > 0);
        const tanks = aliveHeroes.filter(h => h.role === 'guardian' || h.role === 'paladin');
        const healers = aliveHeroes.filter(h => h.role === 'shaman' || h.role === 'monk' || h.role === 'cleric');
        const dps = aliveHeroes.filter(h => h.role === 'berserker' || h.role === 'mage' || h.role === 'ranger' || h.role === 'rogue' || h.role === 'assassin');
        
        const needed = [];
        if (tanks.length === 0) needed.push('Tank');
        if (healers.length === 0) needed.push('Healer');
        if (dps.length < 2) needed.push('DPS');
        
        // Build status line
        const statusParts = [];
        
        // Combat status
        const statusColor = isTraveling ? '#fbbf24' : inCombat ? '#ef4444' : '#10b981';
        const statusText = isTraveling ? 'Travel' : inCombat ? 'Combat' : 'Idle';
        const waveText = combatWaveCount > 0 ? ` • W${combatWaveCount}${(combatWaveCount % 10 === 0) ? '👑' : ''}` : '';
        statusParts.push(<span key="status" style={{ color: statusColor }}>{statusText}{waveText}</span>);
        
        // Viewer buffs
        const viewerBonus = Math.floor((calculateViewerBonuses().damage - 1) * 100);
        statusParts.push(<span key="viewers" style={{ color: '#a78bfa' }}> • {activeChatterCount}👥 +{viewerBonus}%</span>);
        
        // Difficulty
        statusParts.push(<span key="difficulty" style={{ color: '#fbbf24' }}> • Difficulty: {Math.floor(difficultyModifier * 100)}%</span>);
        
        // Needs
        if (needed.length > 0) {
          statusParts.push(<span key="needs" style={{ color: '#ef4444' }}> • Need: {needed.join(', ')}</span>);
        }
        
        return (
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'white',
            fontSize: '16px',
            fontFamily: 'monospace',
            textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
            zIndex: 1000,
            whiteSpace: 'nowrap',
            backgroundColor: 'rgba(0, 0, 0, 0.75)', // Semi-transparent black background
            padding: '8px 16px', // Padding for better spacing
            borderRadius: '8px', // Rounded corners
            border: '1px solid rgba(255, 255, 255, 0.2)', // Subtle border for definition
            backdropFilter: 'blur(4px)' // Optional: blur effect for better readability
          }}>
            {statusParts}
          </div>
        );
      })()}


      {/* No Heroes Message */}
      {(!allHeroes || allHeroes.length === 0) && !loading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          fontSize: '32px',
          textAlign: 'center',
          textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
        }}>
          <div>No heroes on this battlefield</div>
          <div style={{ fontSize: '18px', marginTop: '16px', opacity: 0.7 }}>
            Type !join in chat to enter
          </div>
        </div>
      )}

      {/* SCT Messages */}
      {sctMessages.map((msg) => {
        // Helper to get SCT style based on type
        const getStyle = () => {
          switch (msg.type) {
            case 'crit':
              return {
                color: '#ffd700',
                fontSize: '40px',
                textShadow: '3px 3px 6px rgba(0,0,0,0.9), 0 0 20px rgba(255,215,0,0.8)',
                animation: 'sct-float-crit 3s ease-out forwards'
              };
            case 'levelup':
              return {
                color: '#ffd700',
                fontSize: '36px',
                textShadow: '3px 3px 6px rgba(0,0,0,0.9), 0 0 25px rgba(255,215,0,1)',
                animation: 'sct-float-levelup 2.5s ease-out forwards',
                letterSpacing: '2px'
              };
            case 'heal-hot':
              return {
                color: '#10b981',
                fontSize: '22px',
                textShadow: '1px 1px 3px rgba(0,0,0,0.7), 0 0 10px rgba(16,185,129,0.6)',
                animation: 'sct-float-hot 1.2s ease-out forwards',
                opacity: 0.85
              };
            case 'dot':
              return {
                color: '#a855f7',
                fontSize: '24px',
                textShadow: '1px 1px 3px rgba(0,0,0,0.7), 0 0 12px rgba(168,85,247,0.7)',
                animation: 'sct-float-dot 1.5s ease-out forwards',
                opacity: 0.9
              };
            case 'xp':
              return {
                color: '#60a5fa',
                fontSize: '24px',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 12px rgba(96,165,250,0.6)',
                animation: 'sct-float-xp 1.5s ease-out forwards'
              };
            case 'miss':
              return {
                color: '#fbbf24',
                fontSize: '28px',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                animation: 'sct-float-miss 1s ease-out forwards'
              };
            case 'loot':
              return {
                color: '#f59e0b',
                fontSize: '30px',
                textShadow: '2px 2px 4px rgba(0,0,0,0.9), 0 0 15px rgba(245,158,11,0.8)',
                animation: 'sct-float-loot 2s ease-out forwards'
              };
            case 'gather':
              return {
                color: '#ec4899',
                fontSize: '24px',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 12px rgba(236,72,153,0.6)',
                animation: 'sct-float-gather 1.5s ease-out forwards'
              };
            case 'profession-xp':
              return {
                color: '#8b5cf6',
                fontSize: '20px',
                textShadow: '1px 1px 3px rgba(0,0,0,0.7), 0 0 10px rgba(139,92,246,0.5)',
                animation: 'sct-float-profession 1.5s ease-out forwards'
              };
            case 'heal':
              return {
                color: '#10b981',
                fontSize: '32px',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 15px rgba(16,185,129,0.8)',
                animation: 'sct-float-heal 2s ease-out forwards'
              };
            case 'damage':
            default:
              return {
                color: '#ef4444',
                fontSize: '32px',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 15px rgba(239,68,68,0.8)',
                animation: 'sct-float-damage 2s ease-out forwards'
              };
          }
        };

        const style = getStyle();

        return (
          <div key={msg.id}>
          {msg.type === 'heal' ? (
            // Heal effect: Number + flowing pluses
            <>
              <div
                style={{
                  position: 'fixed',
                  left: `${msg.x}px`,
                  top: `${msg.y}px`,
                  fontWeight: 'bold',
                  pointerEvents: 'none',
                  zIndex: 9999,
                  transform: 'translate(-50%, -50%)',
                  ...style
                }}
              >
                +{msg.text}
              </div>
              {/* Flowing plus symbols */}
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  style={{
                    position: 'fixed',
                    left: `${msg.x + (Math.random() - 0.5) * 60}px`,
                    top: `${msg.y - 20}px`,
                    color: '#10b981',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    textShadow: '0 0 15px rgba(16,185,129,1)',
                    animation: `sct-float-plus 1.8s ease-out ${i * 0.15}s forwards`,
                    pointerEvents: 'none',
                    zIndex: 9998,
                    transform: 'translate(-50%, -50%)',
                    opacity: 0.9
                  }}
                >
                  +
                </div>
              ))}
            </>
          ) : msg.type === 'levelup' ? (
            // Level up effect: Text + flowing up arrows
            <>
              <div
                style={{
                  position: 'fixed',
                  left: `${msg.x}px`,
                  top: `${msg.y}px`,
                  fontWeight: 'bold',
                  pointerEvents: 'none',
                  zIndex: 10000,
                  transform: 'translate(-50%, -50%)',
                  ...style
                }}
              >
                {msg.text}
              </div>
              {/* Flowing up arrows */}
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  style={{
                    position: 'fixed',
                    left: `${msg.x + (Math.random() - 0.5) * 80}px`,
                    top: `${msg.y - 30}px`,
                    color: '#ffd700',
                    fontSize: '28px',
                    fontWeight: 'bold',
                    textShadow: '0 0 20px rgba(255,215,0,1), 0 0 30px rgba(255,215,0,0.8)',
                    animation: `sct-float-arrow 2s ease-out ${i * 0.1}s forwards`,
                    pointerEvents: 'none',
                    zIndex: 9999,
                    transform: 'translate(-50%, -50%)',
                    opacity: 0.95
                  }}
                >
                  ⬆
                </div>
              ))}
            </>
          ) : (
            // Other effects: Damage, Crit, XP, Miss, Level Up, etc.
            <div
              style={{
                position: 'fixed',
                left: `${msg.x}px`,
                top: `${msg.y}px`,
                fontWeight: 'bold',
                pointerEvents: 'none',
                zIndex: msg.type === 'levelup' ? 10000 : 9999,
                transform: 'translate(-50%, -50%)',
                ...style
              }}
            >
              {msg.type === 'crit' && 'CRIT! '}
              {msg.type === 'xp' && '+'}
              {msg.type === 'heal-hot' && '+'}
              {msg.type === 'gather' && '+'}
              {msg.type === 'profession-xp' && '+'}
              {msg.type === 'damage' && '-'}
              {msg.text}
              {msg.type === 'xp' && ' XP'}
              {msg.type === 'profession-xp' && ' Prof XP'}
            </div>
          )}
        </div>
        );
      })}

      {/* Shield & Enrage Visual Effects */}
      <style>{`
        /* Shield aura - Subtle, steady blue glow originating from sprite */
        .has-shield {
          filter: drop-shadow(0 0 6px rgba(59, 130, 246, 0.9))
                  drop-shadow(0 0 12px rgba(59, 130, 246, 0.6))
                  drop-shadow(0 0 18px rgba(59, 130, 246, 0.3));
        }
        
        /* Enrage effect - Red glow and scale up */
        .is-enraged {
          filter: drop-shadow(0 0 8px rgba(239, 68, 68, 1))
                  drop-shadow(0 0 16px rgba(239, 68, 68, 0.8))
                  drop-shadow(0 0 24px rgba(239, 68, 68, 0.5));
          animation: enrage-pulse 2s ease-in-out infinite, enrage-scale-up 0.5s ease-out forwards;
        }
        
        /* Scale up when enrage starts */
        @keyframes enrage-scale-up {
          from {
            transform: scale(1);
          }
          to {
            transform: scale(1.15);
          }
        }
        
        /* Subtle pulsing effect while enraged */
        @keyframes enrage-pulse {
          0%, 100% {
            filter: drop-shadow(0 0 8px rgba(239, 68, 68, 1))
                    drop-shadow(0 0 16px rgba(239, 68, 68, 0.8))
                    drop-shadow(0 0 24px rgba(239, 68, 68, 0.5));
          }
          50% {
            filter: drop-shadow(0 0 12px rgba(239, 68, 68, 1))
                    drop-shadow(0 0 20px rgba(239, 68, 68, 0.9))
                    drop-shadow(0 0 28px rgba(239, 68, 68, 0.6));
          }
        }
      `}</style>

      {/* Travel Animation */}
      <style>{`
        @keyframes travel-fade {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
          }
          15% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          85% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
          }
        }
      `}</style>

      {/* SCT Animations */}
      <style>{`
        @keyframes sct-float-heal {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) translateY(0px) scale(1);
          }
          50% {
            transform: translate(-50%, -50%) translateY(-50px) scale(1.3);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) translateY(-100px) scale(0.8);
          }
        }

        @keyframes sct-float-damage {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) translateY(0px) scale(1);
          }
          50% {
            transform: translate(-50%, -50%) translateY(-40px) scale(1.2);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) translateY(-80px) scale(0.9);
          }
        }

        @keyframes sct-float-dot {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) translateY(0px) scale(0.9);
          }
          60% {
            transform: translate(-50%, -50%) translateY(-35px) scale(1.1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) translateY(-70px) scale(0.8);
          }
        }

        @keyframes sct-float-crit {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) translateY(0px) scale(0.8);
          }
          30% {
            transform: translate(-50%, -50%) translateY(-30px) scale(1.5);
          }
          70% {
            transform: translate(-50%, -50%) translateY(-70px) scale(1.3);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) translateY(-120px) scale(1);
          }
        }

        @keyframes sct-float-levelup {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) translateY(0px) scale(0.5);
          }
          20% {
            transform: translate(-50%, -50%) translateY(-20px) scale(1.4);
          }
          80% {
            transform: translate(-50%, -50%) translateY(-60px) scale(1.2);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) translateY(-100px) scale(0.9);
          }
        }

        @keyframes sct-float-xp {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) translateY(0px) scale(1);
          }
          50% {
            transform: translate(-50%, -50%) translateY(-35px) scale(1.15);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) translateY(-70px) scale(0.9);
          }
        }

        @keyframes sct-float-miss {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) translateY(0px) translateX(0px) scale(1);
          }
          25% {
            transform: translate(-50%, -50%) translateY(-15px) translateX(-10px) scale(1.1);
          }
          50% {
            transform: translate(-50%, -50%) translateY(-25px) translateX(10px) scale(1.1);
          }
          75% {
            transform: translate(-50%, -50%) translateY(-35px) translateX(-5px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) translateY(-50px) translateX(0px) scale(0.9);
          }
        }

        @keyframes sct-float-loot {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) translateY(0px) scale(1);
          }
          50% {
            transform: translate(-50%, -50%) translateY(-45px) scale(1.25);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) translateY(-90px) scale(0.95);
          }
        }

        @keyframes sct-float-gather {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) translateY(0px) scale(1);
          }
          50% {
            transform: translate(-50%, -50%) translateY(-40px) scale(1.2);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) translateY(-80px) scale(0.9);
          }
        }

        @keyframes sct-float-profession {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) translateY(0px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) translateY(-60px) scale(0.85);
          }
        }

        @keyframes sct-float-plus {
          0% {
            opacity: 0.9;
            transform: translate(-50%, -50%) translateY(0px) scale(1);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -50%) translateY(-60px) scale(1.2);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) translateY(-120px) scale(0.8);
          }
        }

        @keyframes sct-float-arrow {
          0% {
            opacity: 0.95;
            transform: translate(-50%, -50%) translateY(0px) scale(1) rotate(0deg);
          }
          30% {
            opacity: 1;
            transform: translate(-50%, -50%) translateY(-40px) scale(1.3) rotate(5deg);
          }
          70% {
            opacity: 0.8;
            transform: translate(-50%, -50%) translateY(-90px) scale(1.1) rotate(-5deg);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) translateY(-140px) scale(0.9) rotate(0deg);
          }
        }

        @keyframes sct-float-hot {
          0% {
            opacity: 0.8;
            transform: translate(-50%, -50%) translateY(0px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) translateY(-40px) scale(0.9);
          }
        }
      `}</style>
    </div>
  );
}

// Helper: Get icon for role (temporary until we add sprites)
function getRoleIcon(role: string): string {
  const icons: Record<string, string> = {
    // Tanks
    'guardian': '🛡️',
    'paladin': '✨',
    'warden': '🌿',
    'bloodknight': '🩸',
    'vanguard': '⚡',
    'brewmaster': '🍺',
    // Healers
    'cleric': '💚',
    'atoner': '⚖️',
    'druid': '🌱',
    'lightbringer': '☀️',
    'shaman': '🔱',
    'mistweaver': '🌫️',
    'chronomancer': '⏰',
    'bard': '🎵',
    // DPS
    'berserker': '⚔️',
    'crusader': '🗡️',
    'assassin': '🗝️',
    'reaper': '💀',
    'bladedancer': '💃',
    'monk': '🥋',
    'stormwarrior': '⚡',
    'hunter': '🏹',
    'mage': '🔮',
    'warlock': '😈',
    'necromancer': '☠️',
    'ranger': '🏹',
    'shadowpriest': '🌑',
    'mooncaller': '🌙',
    'stormcaller': '⛈️',
    'frostmage': '❄️',
    'firemage': '🔥',
    'dragonsorcerer': '🐉'
  };
  
  return icons[role.toLowerCase()] || '⚔️';
}
