/**
 * Browser Source Page for OBS
 * Clean 1920x1080 component - Sprites only, transparent background
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { battlefieldAPI } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useBattlefieldListener } from '../hooks/useBattlefieldListener';
import { useWebSocket } from '../hooks/useWebSocket';
import HeroSpriteJS, { HeroSpriteJSHandle as HeroSpriteHandle } from '../components/HeroSpriteJS';
import EnemySprite, { EnemySpriteJSHandle as EnemySpriteHandle } from '../components/EnemySpriteJS';
import { ENEMY_SPRITES, getEnemySpriteClass, EnemyAnimationType } from '../utils/enemySpriteConfig';
import { HERO_SPRITES } from '../utils/spriteConfig';
import { getAnimationDuration, getHeroSpriteType, getEnemySpriteType } from '../utils/animationDurations';
import { showScrollingCombatText, createCombatText } from '../utils/combatText';
import { FullCombatEngine, CombatState, DEBUFFS } from '../utils/fullCombatEngine';
import { generateEnemiesForCombat } from '../utils/enemyGeneration';
import { applySpriteLayout } from '../utils/spriteManipulation';
import { getSpriteKey, loadAllSpriteLayouts, getHeroCategory } from '../utils/spriteLayoutKeys';
import { updateHeroBuffDisplay, updateHeroDebuffDisplay, updateEnemyDebuffDisplay } from '../utils/updateBuffDebuffDisplay';
import { setupTestCombat } from '../utils/testCombatSetup';
import { QuestTracker, isBossEnemy, CompletedQuest } from '../utils/questTracking';
import { questAPI } from '../api/client';
import { BUFF_TYPES } from '../utils/buffSystem';
import { getEquipmentHpRegen } from '../utils/equipmentBonuses';
import LevelUpEffect from '../components/LevelUpEffect';
import TestPanel from '../components/TestPanel';
import { setTestHelperContext } from '../utils/testHelpers';
import { Hero, Enemy } from '../utils/combat/types';

export default function BrowserSourcePage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  
  const urlToken = searchParams.get('token');
  const token = urlToken || localStorage.getItem('auth_token');
  const [battlefieldId, setBattlefieldId] = useState<string | null>(null);

  // Facing direction preferences - loaded from backend or localStorage
  const [facingPreferences, setFacingPreferences] = useState<Record<string, 'left' | 'right'>>(() => {
    const saved = localStorage.getItem('spriteFacingPreferences');
    return saved ? JSON.parse(saved) : {};
  });

  // Sprite layouts - loaded from localStorage
  const spriteLayoutsRef = useRef(loadAllSpriteLayouts());
  
  // Reload layouts periodically to catch updates from config page
  useEffect(() => {
    const interval = setInterval(() => {
      spriteLayoutsRef.current = loadAllSpriteLayouts();
    }, 1000); // Check every second for layout updates
    
    return () => clearInterval(interval);
  }, []);

  // Sprite slot positions
  const [spriteSlotPositions, setSpriteSlotPositions] = useState<Record<string, { left: string; bottom: string }>>(() => {
    const saved = localStorage.getItem('spriteSlotPositions');
    return saved ? JSON.parse(saved) : {};
  });

  // Battlefield listener for real-time data
  const { battlefieldState, loading: battlefieldLoading, error: battlefieldError } = useBattlefieldListener(battlefieldId);

  // Track animation state per sprite (hero/enemy ID -> animation state)
  const [heroAnimations, setHeroAnimations] = useState<Record<string, 'idle' | 'attack' | 'hurt' | 'death'>>({});
  const [enemyAnimations, setEnemyAnimations] = useState<Record<string, EnemyAnimationType>>({});
  
  // Track special animation states (werewolf transformation, demon lord flying, etc.)
  const [enemySpecialStates, setEnemySpecialStates] = useState<Record<string, {
    isTransformed?: boolean; // Werewolf
    isFlying?: boolean; // Demon Lord
  }>>({});
  
  // Track which enemies have been initialized (for transformation sequences)
  const enemyInitializedRef = useRef<Set<string>>(new Set());
  
  // Track heroes that have left the battlefield (for immediate removal)
  const [removedHeroIds, setRemovedHeroIds] = useState<Set<string>>(new Set());
  
  // Track heroes that have joined the battlefield (for immediate display, before Firebase listener updates)
  const [pendingJoinedHeroes, setPendingJoinedHeroes] = useState<Map<string, any>>(new Map());
  
  // Local combat state (HP values and buffs/debuffs updated by combat engine)
  const [localCombatState, setLocalCombatState] = useState<{
    heroHp: Record<string, number>;
    enemyHp: Record<string, number>;
    heroDead: Record<string, boolean>;
    enemyDead: Record<string, boolean>;
    heroShield: Record<string, number>;
    heroBuffs: Record<string, Array<{ icon: string; name: string; timeLeft: number | string }>>;
    heroDebuffs: Record<string, Array<{ icon: string; name: string; timeLeft: number }>>;
    enemyDebuffs: Record<string, Array<{ icon: string; name: string; timeLeft: number }>>;
  }>({ 
    heroHp: {}, 
    enemyHp: {}, 
    heroDead: {}, 
    enemyDead: {},
    heroShield: {},
    heroBuffs: {},
    heroDebuffs: {},
    enemyDebuffs: {}
  });
  
  // Full combat engine - runs locally in browser
  const combatEngineRef = useRef<FullCombatEngine | null>(null);
  
  // Combat text throttling - persist across re-renders to prevent SCT spam
  const combatTextThrottleRef = useRef<Map<string, number>>(new Map());
  
  // Quest tracking
  const questTrackerRef = useRef<QuestTracker | null>(null);
  const totalDamageDealt = useRef<Map<string, number>>(new Map()); // heroId -> damage
  const totalHealingDone = useRef<Map<string, number>>(new Map()); // heroId -> healing
  const totalDamageBlocked = useRef<Map<string, number>>(new Map()); // heroId -> blocked
  const bossDefeats = useRef<number>(0);
  const wavesCompleted = useRef<number>(0);
  const previousEnemyDead = useRef<Record<string, boolean>>({}); // Track previous enemy death state
  const previousWaveCount = useRef<number>(0); // Track previous wave count
  
  // Level-up tracking
  const [levelingUpHeroes, setLevelingUpHeroes] = useState<Set<string>>(new Set());
  const previousHeroLevels = useRef<Record<string, number>>({}); // Track previous hero levels for level-up detection
  
  // Gathering notifications
  const [gatheringNotifications, setGatheringNotifications] = useState<Array<{
    heroId: string;
    heroName: string;
    material: string;
    amount: number;
    timestamp: number;
  }>>([]);
  
  // NPC encounter state
  const [npcEncounter, setNpcEncounter] = useState<{
    type: string;
    name: string;
    expiresAt: number;
  } | null>(null);
  
  // Quest progress state
  const [questProgress, setQuestProgress] = useState<Array<{
    questId: string;
    questName: string;
    type: 'daily' | 'weekly' | 'monthly';
    progress: number;
    target: number;
    description: string;
  }>>([]);
  
  // Track previous hero IDs to detect when heroes are added/removed
  const previousHeroIdsRef = useRef<string>('');
  
  // Generated enemies state (persists until combat ends)
  const [localGeneratedEnemies, setLocalGeneratedEnemies] = useState<any[]>([]);
  const lastHeroKeyRef = useRef<string>('');
  const hasGeneratedEnemiesRef = useRef<boolean>(false);
  const enemiesGeneratedRef = useRef<boolean>(false);
  
  // Test combat state
  const [testHeroes, setTestHeroes] = useState<any[]>([]);
  const [useTestCombat, setUseTestCombat] = useState<boolean>(false);
  
  // Track animation timeouts to clear them when needed
  const animationTimeouts = useRef<Record<string, NodeJS.Timeout>>({});
  
  // Enemy sprite refs map - keyed by enemyId for direct animation control
  const enemySpriteRefs = useRef<Map<string, React.RefObject<EnemySpriteHandle>>>(new Map());
  const heroSpriteRefs = useRef<Map<string, React.RefObject<HeroSpriteHandle>>>(new Map());
  
  // Helper to get or create ref for an enemy
  const getOrCreateEnemyRef = (enemyId: string): React.RefObject<EnemySpriteHandle> => {
    let ref = enemySpriteRefs.current.get(enemyId);
    if (!ref) {
      ref = React.createRef<EnemySpriteHandle>();
      enemySpriteRefs.current.set(enemyId, ref);
    }
    return ref;
  };
  
  // Helper to get or create ref for a hero
  const getOrCreateHeroRef = (heroId: string): React.RefObject<HeroSpriteHandle> => {
    let ref = heroSpriteRefs.current.get(heroId);
    if (!ref) {
      ref = React.createRef<HeroSpriteHandle>();
      heroSpriteRefs.current.set(heroId, ref);
    }
    return ref;
  };
  
  // Track last hurt animation time to prevent rapid retriggers
  const lastHurtTimes = useRef<Record<string, number>>({});
  
  // Track previous HP values to detect damage/healing
  const prevHeroHp = useRef<Record<string, number>>({});
  const prevEnemyHp = useRef<Record<string, number>>({});
  
  // Track previous equipment to detect loot changes
  const prevHeroEquipment = useRef<Record<string, Record<string, any>>>({});
  
  // Loot notifications state (heroId -> array of notifications)
  const [lootNotifications, setLootNotifications] = useState<Record<string, Array<{
    itemName: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    slot: string;
    timestamp: number;
  }>>>({});
  
  // Helper function to set hero animation with timeout
  const setHeroAnimation = (heroId: string, animation: 'idle' | 'attack' | 'hurt' | 'death', heroRole?: string) => {
    // Use ref-based animation system (same as enemies)
    const ref = getOrCreateHeroRef(heroId);
    if (ref.current) {
      ref.current.playAnimation(animation);
    }
    
    // Set animation state for tracking
    setHeroAnimations(prev => ({ ...prev, [heroId]: animation }));
    
    // Note: Auto-return to idle is now handled by useHeroAnimator hook
    // The hook will automatically return to idle after non-looping animations complete
  };
  
  // Attack variant selection is now handled inside useEnemyAnimator hook
  
  // Ref-based setEnemyAnimation - uses refs instead of DOM cloning
  const setEnemyAnimation = async (enemyId: string, animation: 'idle' | 'attack' | 'hurt' | 'death' | string, enemyName?: string) => {
    // Prevent duplicate animation triggers
    const currentAnimation = enemyAnimations[enemyId];
    
    // For non-hurt animations, skip if already in that animation
    if (currentAnimation === animation && animation !== 'hurt' && animation !== 'death') {
      return;
    }
    
    // For hurt animations, prevent rapid retriggers (within 200ms)
    // This prevents multiple hurt animations from stacking when triggered multiple times
    if (animation === 'hurt' && currentAnimation === 'hurt') {
      const lastHurtTime = lastHurtTimes.current[enemyId];
      const now = Date.now();
      if (lastHurtTime && (now - lastHurtTime) < 200) {
        // Too soon since last hurt - skip to prevent rapid retriggers
        return;
      }
      // Store the time of this hurt animation
      lastHurtTimes.current[enemyId] = now;
    } else if (animation === 'hurt') {
      // Store the time when starting a new hurt animation
      lastHurtTimes.current[enemyId] = Date.now();
    }
    
    const timeoutKey = `enemy-${enemyId}`;
    const currentAnimationState = enemyAnimations[enemyId];
    const attackVariantsList: EnemyAnimationType[] = ['attack', 'attack2', 'attack3', 'strongAttack', 'projectile', 'projectileDiagonal'];
    
    // Note: Auto-return to idle is now handled by useEnemyAnimator hook
    // We can still prevent duplicate animations, but the hook handles the timing
    // Clear any existing timeout (legacy cleanup, though useEnemyAnimator handles this now)
    if (animationTimeouts.current[timeoutKey]) {
      clearTimeout(animationTimeouts.current[timeoutKey]);
      delete animationTimeouts.current[timeoutKey];
    }
    
    // Attack variant selection is now handled inside useEnemyAnimator hook
    // Just pass the animation name directly - the hook will handle variant selection
    let finalAnimation = animation;
    
    // Handle special enemy states (Werewolf transformation, Demon Lord flying)
    if (enemyName === 'Werewolf' && animation === 'idle') {
      const specialState = enemySpecialStates[enemyId];
      if (!specialState?.isTransformed) {
        // Start transformation sequence
        const ref = getOrCreateEnemyRef(enemyId);
        if (ref.current) {
          // Play transformation sequence - sprite paths come from animation data
          ref.current.playAnimation('idleHuman');
          // Wait a bit then play transformation
          setTimeout(() => {
            if (ref.current) {
              ref.current.playAnimation('transformation');
              setTimeout(() => {
                if (ref.current) {
                  ref.current.playAnimation('idle');
                  setEnemySpecialStates(prev => ({ ...prev, [enemyId]: { isTransformed: true } }));
                }
              }, 960); // transformation duration
            }
          }, 720); // idleHuman duration
        }
        return;
      }
    }
    
    if (enemyName === 'Demon Lord') {
      const specialState = enemySpecialStates[enemyId];
      
      // If hurt animation is triggered, remember we were flying
      if (animation === 'hurt' && specialState?.isFlying) {
        // Keep flying state, just play hurt animation
        // The onComplete will be handled specially below
      }
      // If returning to idle after hurt, go back to flying instead
      else if (animation === 'idle') {
        if (!specialState?.isFlying) {
          const ref = getOrCreateEnemyRef(enemyId);
          if (ref.current) {
            // Play transition then flying - sprite paths come from animation data
            ref.current.playAnimation('transition');
            setTimeout(() => {
              if (ref.current) {
                ref.current.playAnimation('flying');
                setEnemySpecialStates(prev => ({ ...prev, [enemyId]: { isFlying: true } }));
              }
            }, 360); // transition duration
          }
          return;
        } else {
          // Was flying, return to flying instead of idle
          finalAnimation = 'flying';
        }
      }
    }
    
    // Update React state
    setEnemyAnimations(prev => ({ ...prev, [enemyId]: finalAnimation }));
    
    // Get enemy ref
    let ref = getOrCreateEnemyRef(enemyId);
    
    // Fallback: try to find by enemy name if ID doesn't match
    if (!ref.current && enemyName) {
      const matchingEnemy = displayEnemies.find((e: any) => {
        const eName = String(e.name || e.type || '').toLowerCase();
        return eName === String(enemyName).toLowerCase();
      });
      if (matchingEnemy) {
        ref = getOrCreateEnemyRef(String(matchingEnemy.id || ''));
      }
    }
    
    // Last resort: use first available ref
    if (!ref.current) {
      const fallback = Array.from(enemySpriteRefs.current.values()).find((r) => r?.current);
      if (fallback) ref = fallback;
    }
    
    if (!ref.current) {
      return;
    }
    
    // Play animation using ref
    // Note: setSpriteImage is no longer needed - sprite path comes from animation data
    // Auto-return to idle is handled by useEnemyAnimator hook, so we don't need timeout logic here
    // Attack variant selection is also handled by the hook
    try {
      ref.current.playAnimation(finalAnimation);
    } catch (err) {
      // Animation failed
    }
  };
  
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(animationTimeouts.current).forEach(timeout => clearTimeout(timeout));
      animationTimeouts.current = {};
    };
  }, []);

  // Fixed dimensions - always 1920x1080
  const WIDTH = 1920;
  const HEIGHT = 1080;

  // Set body/html styles for OBS - transparent, no margins, fixed size
  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;
    
    // Add classes for CSS targeting
    body.classList.add('browser-source-body');
    html.classList.add('browser-source-html');
    
    // Force transparent background with !important via inline styles
    body.style.setProperty('margin', '0', 'important');
    body.style.setProperty('padding', '0', 'important');
    body.style.setProperty('overflow', 'hidden', 'important');
    body.style.setProperty('backgroundColor', 'transparent', 'important');
    body.style.setProperty('background', 'transparent', 'important');
    body.style.setProperty('width', `${WIDTH}px`, 'important');
    body.style.setProperty('height', `${HEIGHT}px`, 'important');
    body.style.setProperty('position', 'fixed', 'important');
    body.style.setProperty('top', '0', 'important');
    body.style.setProperty('left', '0', 'important');
    
    html.style.setProperty('margin', '0', 'important');
    html.style.setProperty('padding', '0', 'important');
    html.style.setProperty('backgroundColor', 'transparent', 'important');
    html.style.setProperty('background', 'transparent', 'important');
    html.style.setProperty('width', `${WIDTH}px`, 'important');
    html.style.setProperty('height', `${HEIGHT}px`, 'important');
    html.style.setProperty('overflow', 'hidden', 'important');
    
    return () => {
      body.style.margin = '';
      body.style.padding = '';
      body.style.overflow = '';
      // Remove classes
      body.classList.remove('browser-source-body');
      html.classList.remove('browser-source-html');
      
      // Clear inline styles
      body.style.removeProperty('margin');
      body.style.removeProperty('padding');
      body.style.removeProperty('overflow');
      body.style.removeProperty('backgroundColor');
      body.style.removeProperty('background');
      body.style.removeProperty('width');
      body.style.removeProperty('height');
      body.style.removeProperty('position');
      body.style.removeProperty('top');
      body.style.removeProperty('left');
      
      html.style.removeProperty('margin');
      html.style.removeProperty('padding');
      html.style.removeProperty('backgroundColor');
      html.style.removeProperty('background');
      html.style.removeProperty('width');
      html.style.removeProperty('height');
      html.style.removeProperty('overflow');
    };
  }, []);

  // Load sprite preferences from backend
  useEffect(() => {
    if (user?.id) {
      battlefieldAPI.getSpriteFacingPreferences(user.id)
        .then(prefs => {
          setFacingPreferences(prefs);
          localStorage.setItem('spriteFacingPreferences', JSON.stringify(prefs));
        })
        .catch(err => {
          const saved = localStorage.getItem('spriteFacingPreferences');
          if (saved) {
            try {
              setFacingPreferences(JSON.parse(saved));
            } catch (e) {
              // ignore
            }
          }
        });
    }
  }, [user?.id]);

  // Store token from URL
  useEffect(() => {
    if (urlToken) {
      localStorage.setItem('auth_token', urlToken);
    }
  }, [urlToken]);

  // Determine battlefield ID
  useEffect(() => {
    const idParam = searchParams.get('battlefieldId');
    const streamerUsername = searchParams.get('streamerUsername');
    const streamerId = searchParams.get('streamerId');
    
    if (idParam) {
      let normalizedId = idParam;
      if (idParam.startsWith('twitch:')) {
        const identifier = idParam.split(':')[1];
        // If identifier looks like a numeric ID (long numeric string), try to convert to username
        // Check if it's a numeric ID (length > 10 and all digits)
        if (/^\d{10,}$/.test(identifier)) {
          // It's a numeric Twitch ID - try to get username from user object
          if (user?.twitchUsername) {
            normalizedId = `twitch:${user.twitchUsername.toLowerCase().trim()}`;
          } else if (user?.twitchId === identifier && user?.displayName) {
            // Fallback: use displayName if twitchId matches
            normalizedId = `twitch:${user.displayName.toLowerCase().trim()}`;
          }
          // If we can't convert, keep the ID
        }
      }
      setBattlefieldId(normalizedId);
    } else if (streamerUsername) {
      setBattlefieldId(`twitch:${streamerUsername.toLowerCase().trim()}`);
    } else if (streamerId && user?.twitchUsername && streamerId === user.twitchId) {
      setBattlefieldId(`twitch:${user.twitchUsername.toLowerCase().trim()}`);
    } else if (user?.twitchUsername || user?.displayName) {
      const username = (user.twitchUsername || user.displayName || '').toLowerCase().trim();
      if (username) setBattlefieldId(`twitch:${username}`);
    } else if (user?.hero?.twitchUsername) {
      setBattlefieldId(`twitch:${user.hero.twitchUsername.toLowerCase().trim()}`);
    } else if (user?.twitchId) {
      setBattlefieldId(`twitch:${user.twitchId}`);
    } else if (user?.id) {
      setBattlefieldId(`twitch:${user.id}`);
    }
  }, [searchParams, user]);

  // Register browser source
  useEffect(() => {
    if (battlefieldId && user?.id && token) {
      battlefieldAPI.registerBrowserSource(battlefieldId, user.id, token).catch(() => {});
    }
  }, [battlefieldId, user, token]);

  // WebSocket support for !join commands
  // Get twitchId from URL (browser source), user object, or lookup from battlefieldId
  const [streamerTwitchId, setStreamerTwitchId] = useState<string | null>(null);
  
  // Look up streamer's numeric Twitch ID from battlefieldId (format: twitch:username)
  useEffect(() => {
    const lookupStreamerTwitchId = async () => {
      // First try URL parameter or user object
      const urlTwitchId = searchParams.get('twitchId');
      if (urlTwitchId) {
        setStreamerTwitchId(urlTwitchId);
        return;
      }
      
      if (user?.twitchId) {
        setStreamerTwitchId(String(user.twitchId));
        return;
      }
      
      // If battlefieldId is in format "twitch:username", look up the numeric Twitch ID
      if (battlefieldId && battlefieldId.startsWith('twitch:')) {
        const streamerUsername = battlefieldId.replace('twitch:', '').toLowerCase();
        
        // Check if it's already a numeric ID
        if (/^\d+$/.test(streamerUsername)) {
          setStreamerTwitchId(streamerUsername);
          return;
        }
        
        // Look up streamer's Twitch ID from Firebase (from their hero document)
        try {
          const { collection, query, where, getDocs } = await import('firebase/firestore');
          const { db } = await import('../utils/firebase');
          
          const heroesQuery = query(
            collection(db, 'heroes'),
            where('twitchUsername', '==', streamerUsername)
          );
          
          const snapshot = await getDocs(heroesQuery);
          
          if (!snapshot.empty) {
            const streamerHero = snapshot.docs[0].data();
            const twitchId = streamerHero.twitchUserId || streamerHero.twitchId;
            if (twitchId) {
              setStreamerTwitchId(String(twitchId));
            }
          }
        } catch (error) {
          // Error looking up streamer Twitch ID
        }
      }
    };
    
    lookupStreamerTwitchId();
  }, [battlefieldId, user?.twitchId, searchParams]);
  
  const effectiveTwitchId = searchParams.get('twitchId') || streamerTwitchId || user?.twitchId || null;
  
  // Helper function to convert Hero from Firebase to TestHero format
  const convertHeroToTestHero = useCallback((hero: any): any => {
    const critChance = (hero.equipment?.weapon?.secondaryStats?.critChance || 0) / 100;
    const dexterity = hero.equipment?.weapon?.dexterity || 
                     hero.equipment?.gloves?.dexterity || 
                     hero.dexterity || 10;
    
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
      shield: hero.shield || (typeof hero.shield === 'object' ? hero.shield : { amount: 0 }),
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

  // Handle WebSocket messages for !join commands
  const handleWebSocketMessage = useCallback((message: any) => {
    if (message.type === 'hero_joined' || message.type === 'hero_joined_battlefield') {
      // Someone used !join in chat - add hero immediately (like !leave removes immediately)
      const hero = message.hero;
      if (hero?.id) {
        // Remove from removed list if they were previously removed
        setRemovedHeroIds(prev => {
          const next = new Set(prev);
          next.delete(String(hero.id));
          return next;
        });
        
        // Add to pending heroes immediately (before Firebase listener updates)
        // Convert hero to the format expected by the display
        const convertedHero = convertHeroToTestHero(hero);
        setPendingJoinedHeroes(prev => {
          const next = new Map(prev);
          next.set(String(hero.id), convertedHero);
          return next;
        });
        
        // Remove from pending heroes once Firebase listener picks them up (handled in useEffect below)
      }
    } else if (message.type === 'hero_left_battlefield') {
      // Hero left - remove immediately from display
      // IMPORTANT: Only use document ID, not twitchUserId, because multiple heroes can share the same twitchUserId
      const heroDocId = message.hero?.id;
      
      if (heroDocId) {
        // Remove from pending heroes first (if they were pending)
        setPendingJoinedHeroes(prev => {
          const next = new Map(prev);
          next.delete(String(heroDocId));
          return next;
        });
        
        // Then add to removed heroes (so they're filtered out)
        setRemovedHeroIds(prev => {
          const next = new Set(prev);
          // Only add document ID - don't add twitchUserId to avoid filtering other heroes from same user
          next.add(String(heroDocId));
          return next;
        });
      }
    }
  }, [convertHeroToTestHero]);

  // Connect to WebSocket for Twitch chat commands
  
  useWebSocket(effectiveTwitchId, handleWebSocketMessage);

  // Get facing direction
  const getFacingDirection = (roleOrEnemyName: string, defaultFacing: 'left' | 'right' = 'right'): 'left' | 'right' => {
    return facingPreferences[roleOrEnemyName] || defaultFacing;
  };

  // Get slot position helper
  const getSlotPosition = (slotKey: string, defaultLeft: string, defaultBottom: string): { left: string; bottom: string } => {
    return spriteSlotPositions[slotKey] || { left: defaultLeft, bottom: defaultBottom };
  };

  // Convert percentage or pixel string to pixel number (always relative to 1920x1080)
  const toPixels = (value: string, dimension: 'width' | 'height'): number => {
    if (value.endsWith('%')) {
      const percent = parseFloat(value) / 100;
      return dimension === 'width' ? percent * WIDTH : percent * HEIGHT;
    }
    return parseFloat(value) || 0;
  };

  // Get selected hero IDs from localStorage (reacts to changes)
  const [selectedHeroIds, setSelectedHeroIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('browserSourceSelectedHeroes');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Listen for localStorage changes to hero selection
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('browserSourceSelectedHeroes');
      if (saved) {
        setSelectedHeroIds(new Set(JSON.parse(saved)));
      } else {
        setSelectedHeroIds(new Set());
      }
    };

    // Listen for storage events (from other tabs/windows)
    window.addEventListener('storage', handleStorageChange);
    
    // Also poll localStorage periodically to catch same-tab changes
    const interval = setInterval(handleStorageChange, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Get selected enemy types from localStorage (reacts to changes)
  const [selectedEnemyTypes, setSelectedEnemyTypes] = useState<string[]>(() => {
    const saved = localStorage.getItem('browserSourceSelectedEnemyTypes');
    return saved ? JSON.parse(saved) : [];
  });

  // Listen for localStorage changes to enemy selection
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('browserSourceSelectedEnemyTypes');
      if (saved) {
        setSelectedEnemyTypes(JSON.parse(saved));
      } else {
        setSelectedEnemyTypes([]);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Filter heroes based on selection (if any selected, only show those; otherwise show all)
  // Use test heroes if test combat is enabled, otherwise use Firebase heroes
  // Merge with pending heroes (those that joined via WebSocket but Firebase listener hasn't updated yet)
  const firebaseHeroes = useTestCombat && testHeroes.length > 0 ? testHeroes : (battlefieldState?.heroes || []);
  
  // Merge Firebase heroes with pending joined heroes (immediate WebSocket updates)
  // Remove pending heroes once they appear in Firebase (they're confirmed)
  useEffect(() => {
    if (pendingJoinedHeroes.size > 0 && firebaseHeroes.length > 0) {
      setPendingJoinedHeroes(prev => {
        const next = new Map(prev);
        // Remove any pending heroes that are now in Firebase (Firebase listener caught up)
        firebaseHeroes.forEach(hero => {
          if (hero.id) {
            next.delete(String(hero.id));
          }
        });
        return next;
      });
    }
  }, [firebaseHeroes, pendingJoinedHeroes.size]);
  
  // Combine Firebase heroes with pending heroes (pending heroes take precedence if duplicate)
  const allHeroes = [
    ...firebaseHeroes,
    ...Array.from(pendingJoinedHeroes.values()).filter(pendingHero => {
      // Only include pending heroes that aren't already in Firebase
      return !firebaseHeroes.some(fbHero => fbHero.id === pendingHero.id);
    })
  ];
  
  // Clear removed heroes list when heroes rejoin (they appear in Firebase again)
  // OR when Firebase confirms they're gone (currentBattlefieldId is null)
  // Use a ref to track previous hero IDs to avoid infinite loops
  const prevHeroIdsRef = useRef<Set<string>>(new Set());
  const removedHeroIdsSizeRef = useRef(0);
  useEffect(() => {
    removedHeroIdsSizeRef.current = removedHeroIds.size;
  }, [removedHeroIds.size]);
  
  useEffect(() => {
    if (allHeroes.length > 0 && removedHeroIdsSizeRef.current > 0) {
      // Only process if we have removed heroes to clear
      // Only track document IDs, not twitchUserId (multiple heroes can share same twitchUserId)
      const currentHeroIds = new Set<string>();
      allHeroes.forEach(h => {
        if (h.id) currentHeroIds.add(String(h.id));
        // Don't add twitchUserId - we only filter by document ID
      });
      
      // Only update if hero IDs actually changed
      const currentIdsStr = Array.from(currentHeroIds).sort().join(',');
      const prevIdsStr = Array.from(prevHeroIdsRef.current).sort().join(',');
      
      if (currentIdsStr !== prevIdsStr) {
        prevHeroIdsRef.current = currentHeroIds;
        setRemovedHeroIds(prev => {
          if (prev.size === 0) return prev; // No removed heroes, nothing to clear
          const next = new Set(prev);
          // Remove any IDs that are now present in the heroes list (they rejoined)
          for (const heroId of prev) {
            if (currentHeroIds.has(heroId)) {
              next.delete(heroId);
            }
          }
          return next;
        });
      }
    } else if (allHeroes.length === 0 && removedHeroIdsSizeRef.current > 0) {
      // If no heroes in Firebase and we have removed heroes, Firebase confirmed they're gone
      // Clear removedHeroIds since Firebase listener confirmed removal
      setRemovedHeroIds(new Set());
      prevHeroIdsRef.current = new Set();
    } else if (allHeroes.length === 0) {
      prevHeroIdsRef.current = new Set();
    }
  }, [battlefieldState?.heroes, testHeroes, useTestCombat]);
  
  // Filter out removed heroes (those that left via !leave)
  // IMPORTANT: Only filter by document ID, NOT twitchUserId, because multiple heroes can share the same twitchUserId
  // If we filtered by twitchUserId, all heroes from the same user would be removed when one leaves
  const filteredHeroes = removedHeroIds.size > 0 
    ? allHeroes.filter(hero => {
        const heroDocId = hero.id;
        
        // If hero has no document ID, keep it (shouldn't happen, but be safe)
        if (!heroDocId) return true;
        
        // Only remove if the document ID matches (not twitchUserId)
        const docIdStr = String(heroDocId);
        return !removedHeroIds.has(docIdStr);
      })
    : allHeroes; // If no removed heroes, return all heroes (no filtering needed)
  
  const displayHeroes = selectedHeroIds.size > 0 
    ? filteredHeroes.filter(hero => selectedHeroIds.has(hero.id))
    : filteredHeroes;
  
  // Track equipment changes to show loot notifications
  useEffect(() => {
    if (!displayHeroes.length) return;
    
    displayHeroes.forEach((hero: any) => {
      const heroId = hero.id || hero.username || hero.name;
      if (!heroId) return;
      
      const currentEquipment = hero.equipment || {};
      const previousEquipment = prevHeroEquipment.current[heroId] || {};
      
      // Check each slot for new/changed items
      Object.keys(currentEquipment).forEach(slot => {
        const currentItem = currentEquipment[slot];
        const previousItem = previousEquipment[slot];
        
        // If item changed or is new
        if (currentItem && (!previousItem || currentItem.id !== previousItem.id)) {
          // Get rarity color
          const rarityColors: Record<string, string> = {
            common: '#9ca3af', // gray
            rare: '#3b82f6',   // blue
            epic: '#a855f7',   // purple
            legendary: '#fbbf24' // gold
          };
          
          const rarity = currentItem.rarity || 'common';
          const color = rarityColors[rarity] || rarityColors.common;
          
          // Add notification
          const notificationTimestamp = Date.now();
          const newNotification = {
            itemName: currentItem.name || 'Item',
            rarity: rarity as 'common' | 'rare' | 'epic' | 'legendary',
            slot: slot,
            timestamp: notificationTimestamp
          };
          
          setLootNotifications(prev => {
            const heroNotifications = prev[heroId] || [];
            // Keep only last 3 notifications per hero
            const updated = [...heroNotifications, newNotification].slice(-3);
            return { ...prev, [heroId]: updated };
          });
          
          // Clear notification after 5 seconds
          setTimeout(() => {
            setLootNotifications(prev => {
              const heroNotifications = prev[heroId] || [];
              return {
                ...prev,
                [heroId]: heroNotifications.filter(n => n.timestamp !== notificationTimestamp)
              };
            });
          }, 5000);
        }
      });
      
      // Update previous equipment
      prevHeroEquipment.current[heroId] = { ...currentEquipment };
    });
  }, [displayHeroes]);
  
  // Generate enemies locally if none exist (combat runs in browser now)
  // Create a stable key to track hero changes (prevents regenerating on every render)
  const heroKey = displayHeroes.length > 0 
    ? displayHeroes.map(h => `${h.id || h.name}:${h.level || 1}`).sort().join(',')
    : '';
  
  // Generate enemies only when heroes change (prevent cycling)
  useEffect(() => {
    // Only generate if we have heroes, no Firebase enemies, and heroes changed
    const hasHeroes = displayHeroes.length > 0;
    const hasFirebaseEnemies = battlefieldState?.enemies && battlefieldState.enemies.length > 0;
    const heroesChanged = heroKey !== lastHeroKeyRef.current;
    
    // Only generate if heroes changed AND we haven't generated enemies yet for these heroes
    const needsGeneration = hasHeroes && !hasFirebaseEnemies && heroesChanged && !hasGeneratedEnemiesRef.current;
    
    if (needsGeneration && heroKey && displayHeroes.length > 0) {
      const newEnemies = generateEnemiesForCombat(
        displayHeroes.map((h: any) => ({
          level: h.level || 1,
          role: h.role || 'berserker',
          username: h.name || h.characterName || h.id || 'Unknown'
        })),
        battlefieldState?.waveCount || 1,
        battlefieldState?.difficultyModifier || 1.0
      );
      
      if (newEnemies.length > 0) {
        setLocalGeneratedEnemies(newEnemies);
        lastHeroKeyRef.current = heroKey;
        hasGeneratedEnemiesRef.current = true;
      }
    }
    
    // Clear generated enemies when heroes are gone or Firebase enemies arrive
    if (!hasHeroes || hasFirebaseEnemies) {
      if (hasGeneratedEnemiesRef.current) {
        setLocalGeneratedEnemies([]);
        lastHeroKeyRef.current = '';
        hasGeneratedEnemiesRef.current = false;
      }
    }
  }, [heroKey, displayHeroes.length, battlefieldState?.enemies?.length, battlefieldState?.waveCount, battlefieldState?.difficultyModifier]);
  
  // Use Firebase enemies if they exist, otherwise use generated enemies (or test enemies)
  const allEnemies = (battlefieldState?.enemies && battlefieldState.enemies.length > 0)
    ? battlefieldState.enemies
    : (useTestCombat ? localGeneratedEnemies : localGeneratedEnemies);
  let displayEnemies = selectedEnemyTypes.length > 0
    ? allEnemies.filter((enemy: any) => {
        // Match enemy name or sprite to selected types
        const enemyName = (enemy.name || enemy.type || '').toLowerCase();
        const enemySprite = (enemy.sprite || '').toLowerCase();
        return selectedEnemyTypes.some(type => {
          const typeLower = type.toLowerCase();
          return enemyName.includes(typeLower) || 
                 typeLower.includes(enemyName) ||
                 enemySprite.includes(typeLower.replace(/\s+/g, '')) ||
                 typeLower.includes(enemySprite.replace(/\s+/g, ''));
        });
      })
    : allEnemies;
  
  // Fallback: if filtering resulted in 0 enemies but we have enemies, show all
  if (displayEnemies.length === 0 && allEnemies.length > 0) {
    displayEnemies = allEnemies;
  }
  
  // Debug enemy filtering
  useEffect(() => {
    if (allEnemies.length > 0) {
      // Check if debug mode is active
      let debugEnemy = null;
      try {
        const debugSettings = localStorage.getItem('enemyDebugSettings');
        if (debugSettings) {
          const settings = JSON.parse(debugSettings);
          debugEnemy = settings.enabledEnemy || null;
        }
      } catch (e) {
        // Ignore
      }
      
    }
  }, [allEnemies.length, displayEnemies.length, selectedEnemyTypes.length]);
  
  const isLoading = battlefieldLoading && !battlefieldState;
  
  // Auto-start combat when heroes and enemies are present (don't require inCombat flag)
  // Calculate at component level so it's available in render
  const isCombatActive = displayHeroes.length > 0 && displayEnemies.length > 0;
  
  
  // Listen for debug settings changes and restart combat if needed
  useEffect(() => {
    const checkDebugSettings = () => {
      try {
        // Check for force restart flag
        const forceRestart = localStorage.getItem('enemyDebugForceRestart');
        if (forceRestart && combatEngineRef.current) {
          const currentTime = Date.now();
          const restartTime = parseInt(forceRestart, 10);
          // Only react if restart signal was recent (within last 5 seconds)
          if (currentTime - restartTime < 5000) {
            // Clear the restart flag
            localStorage.removeItem('enemyDebugForceRestart');
            // Clear local enemy state - this will cause combat to restart
            setLocalGeneratedEnemies([]);
            // The combat engine will detect no enemies and regenerate with debug settings
          }
        }
        
        // Also check for debug settings updates
        const lastUpdate = localStorage.getItem('enemyDebugSettingsUpdated');
        if (lastUpdate && combatEngineRef.current) {
          const currentTime = Date.now();
          const lastUpdateTime = parseInt(lastUpdate, 10);
          // Only react if update was recent (within last 5 seconds)
          if (currentTime - lastUpdateTime < 5000) {
            // Settings will be applied when enemies are regenerated
          }
        }
      } catch (e) {
        // Ignore localStorage errors
      }
    };

    // Check every second for debug setting changes
    const interval = setInterval(checkDebugSettings, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize combat simulator when combat starts
  useEffect(() => {
    // For test combat, we don't need battlefieldState
    if (!useTestCombat && !battlefieldState) {
      return;
    }
    
    // Start full combat engine if in combat OR if we have heroes (adventure loop will start)
    // Adventure loop will generate enemies and start combat automatically
    // IMPORTANT: Restart if heroes changed (added/removed) to ensure combat engine has correct hero list
    // Only restart if:
    // 1. No engine exists, OR
    // 2. All heroes left (displayHeroes.length === 0), OR
    // 3. Heroes changed (added/removed) - need to restart to pick up new hero list, OR
    // 4. Test combat mode (needs restart for test heroes)
    const needsNewEngine = !combatEngineRef.current;
    const allHeroesLeft = displayHeroes.length === 0 && combatEngineRef.current;
    const isTestCombatRestart = useTestCombat && testHeroes.length > 0 && !combatEngineRef.current;
    
    // Check if heroes changed by comparing hero IDs
    const currentHeroIds = displayHeroes.map(h => h.id || h.name || h.characterName).sort().join(',');
    const heroesChanged = currentHeroIds !== previousHeroIdsRef.current && previousHeroIdsRef.current !== '';
    
    const shouldStart = (isCombatActive || displayHeroes.length > 0) && 
                       (needsNewEngine || allHeroesLeft || heroesChanged || isTestCombatRestart);
    
    if (shouldStart) {
      // CRITICAL: In React.StrictMode (development), components mount twice
      // Ensure we clean up any existing engine before creating a new one
      // This prevents multiple combat engines from running simultaneously
      if (combatEngineRef.current) {
        // Clean up if we're actually restarting (heroes changed, all left, or new engine needed)
        if (allHeroesLeft || needsNewEngine || heroesChanged) {
          combatEngineRef.current.stopCombat();
          combatEngineRef.current.stopAdventure();
          combatEngineRef.current = null;
        } else {
          // Engine exists and heroes haven't changed - don't restart, just return
          return;
        }
      }
      
      // Update previous hero IDs after cleanup
      previousHeroIdsRef.current = currentHeroIds;
      
      // If test combat and engine exists, restart it
      if (useTestCombat && combatEngineRef.current) {
        combatEngineRef.current.stopCombat();
        combatEngineRef.current.stopAdventure();
        combatEngineRef.current = null;
      }
      
      // Create combat state from battlefield state
      const combatState: CombatState = {
        heroes: new Map(displayHeroes.map(hero => [hero.id || hero.name || hero.characterName, {
          id: hero.id,
          username: hero.name || hero.characterName,
          role: hero.role,
          level: hero.level || 1,
          hp: hero.hp || hero.maxHp || 100,
          maxHp: hero.maxHp || 100,
          attack: hero.attack || 10,
          defense: hero.defense || 5,
          isDead: hero.isDead || false,
          activeDebuffs: {},
          activeBuffs: {},
          cooldowns: {},
          classAbilityState: {},
          equipment: hero.equipment || {},
          enchantedItems: hero.enchantedItems || [],
          skills: hero.skills || {},
          activeThreatMod: 1.0,
          strength: hero.strength,
          dexterity: hero.dexterity,
          intellect: hero.intellect,
          wisdom: hero.wisdom,
          stamina: hero.stamina,
          healingPower: hero.healingPower,
          meleeDamage: hero.meleeDamage,
          spellDamage: hero.spellDamage,
          guildId: hero.guildId
        }])),
        currentEnemies: displayEnemies.map((enemy: any, index: number) => ({
          id: enemy.id || `enemy-${index}`,
          name: enemy.name || enemy.type || 'Enemy',
          level: enemy.level || 1,
          hp: enemy.hp || enemy.maxHp || 100,
          maxHp: enemy.maxHp || 100,
          attack: enemy.attack || 10,
          defense: enemy.defense || 5,
          isDead: enemy.isDead || false,
          isBoss: enemy.isBoss || false,
          xp: enemy.xp || 0,
          activeDebuffs: {},
          abilities: {}
        })),
        isPaused: false,
        inCombat: displayEnemies.length > 0, // Only in combat if enemies exist
        viewerCount: battlefieldState?.viewerCount || 0,
        difficultyModifier: useTestCombat ? 1.0 : (battlefieldState?.difficultyModifier || 1.0),
        combatAnimationActive: true,
        waveCount: useTestCombat ? 1 : (battlefieldState?.waveCount || 1),
        isAdventuring: false // Will be set by startAdventure()
      };
      
      // Create and start full combat engine
      const combatEngine = new FullCombatEngine(combatState);
      
      // Initialize quest tracker
      if (!questTrackerRef.current && user?.twitchId) {
        questTrackerRef.current = new QuestTracker(
          async (updates) => {
            try {
              const response = await questAPI.updateQuestProgressBatch(user.twitchId, updates);
              return response;
            } catch (error) {
              return {};
            }
          },
          (completedQuests: CompletedQuest[]) => {
            // Show minimal notification for completed quests
            completedQuests.forEach(quest => {
              // Optionally show SCT or log message
            });
          }
        );
      }
      
      // Set callback for when enemies are generated by adventure loop
      // The adventure loop already checks for active enemies before generating new ones
      combatEngine.setOnEnemiesGenerated((newEnemies) => {
        // CRITICAL: Don't update enemies if combat is already active
        // This prevents enemies from being replaced mid-fight
        const hasActiveEnemies = displayEnemies.length > 0 && 
          displayEnemies.some((e: any) => e.hp > 0 && !e.isDead);
        
        if (hasActiveEnemies) {
          return;
        }
        
        setLocalGeneratedEnemies(newEnemies);
        enemiesGeneratedRef.current = true;
        // Update combat state to reflect new enemies
        combatEngine.state.currentEnemies = newEnemies;
        combatEngine.state.inCombat = true;
        // Combat will start automatically via startCombat() in encounterEnemy()
      });
      
      // Set callbacks for gathering and NPC encounters
      combatEngine.setOnGathering((heroId, heroName, material, amount) => {
        setGatheringNotifications(prev => [
          ...prev.filter(n => Date.now() - n.timestamp < 5000), // Keep only recent notifications
          {
            heroId,
            heroName,
            material,
            amount,
            timestamp: Date.now()
          }
        ]);
      });
      
      combatEngine.setOnNPCEncounter((npcType, npcName) => {
        setNpcEncounter({
          type: npcType,
          name: npcName,
          expiresAt: Date.now() + 8000 // 8 seconds (matches adventure tick delay)
        });
        // Auto-clear after expiration
        setTimeout(() => {
          setNpcEncounter(null);
        }, 8000);
      });
      
      // Subscribe to animation changes
      // Store cleanup functions for callbacks
      const animationCleanup = combatEngine.onAnimation((entityId, animation, isHero) => {
        if (isHero) {
          // Strip battle-hero- prefix if present (from heroElementId helper)
          let cleanEntityId = entityId;
          if (entityId.startsWith('battle-hero-')) {
            cleanEntityId = entityId.replace('battle-hero-', '');
          }
          
          // Try multiple ways to match the hero
          // The Map key in combat state is: hero.id || hero.name || hero.characterName
          // The username in combat state is: hero.name || hero.characterName
          // entityId could be: hero.id, hero.name, hero.characterName, hero.username, or battle-hero-{id}
          const hero = displayHeroes.find(h => {
            const heroId = h.id || h.name || h.characterName;
            const heroName = h.name || h.characterName;
            const heroUsername = h.username || h.name || h.characterName;
            
            // Match by any of these identifiers (both with and without battle-hero- prefix)
            return (heroId === entityId) || 
                   (heroId === cleanEntityId) ||
                   (h.id === entityId) || 
                   (h.id === cleanEntityId) ||
                   (h.name === entityId) ||
                   (h.name === cleanEntityId) ||
                   (h.characterName === entityId) ||
                   (h.characterName === cleanEntityId) ||
                   (h.username === entityId) ||
                   (h.username === cleanEntityId) ||
                   (heroName === entityId) ||
                   (heroName === cleanEntityId) ||
                   (heroUsername === entityId) ||
                   (heroUsername === cleanEntityId);
          });
          
          if (hero) {
            // Use the same identifier that's used as the Map key and sprite container ID
            const heroId = hero.id || hero.name || hero.characterName;
            setHeroAnimation(heroId, animation, hero?.role);
          }
        } else {
          // Find enemy by ID - try multiple matching strategies
          // CRITICAL: entityId can be in format: "battle-enemy-{enemy.id}" from enemyElementId() helper
          // Or just "{enemy.id}" or "{enemy.name}"
          let enemy: any = null;
          let enemyId: string = String(entityId);
          let enemyName: string = '';
          
          // Strategy 1: Extract ID if entityId starts with "battle-enemy-"
          // This is the format from enemyElementId() helper: "battle-enemy-{enemy.id}"
          let extractedId = String(entityId);
          if (extractedId.startsWith('battle-enemy-')) {
            extractedId = extractedId.replace('battle-enemy-', '');
            // Now try to find enemy with this extracted ID
            enemy = displayEnemies.find((e: any) => {
              const eId = String(e.id || '');
              return eId === extractedId;
            });
            // If found, use the extracted ID (which is the actual enemy.id)
            if (enemy) {
              enemyId = extractedId; // Use the extracted ID (actual enemy.id)
            }
          }
          
          // Strategy 2: Try exact match on enemy.id (if not already found)
          if (!enemy) {
            enemy = displayEnemies.find((e: any) => {
              const eId = String(e.id || '');
              return eId === String(entityId);
            });
          }
          
          // Strategy 3: Try matching on name/type if ID didn't match
          if (!enemy) {
            enemy = displayEnemies.find((e: any) => {
              const eName = String(e.name || e.type || '');
              return eName === String(entityId) || eName === extractedId;
            });
          }
          
          // Strategy 4: Try if entityId contains enemy ID (for "enemy-{id}" format)
          if (!enemy) {
            const targetId = String(entityId);
            if (targetId.startsWith('enemy-')) {
              // For "enemy-{timestamp}-{index}" format, try to match the full ID
              enemy = displayEnemies.find((e: any) => {
                const eId = String(e.id || '');
                return eId === targetId; // Exact match for full enemy-{timestamp}-{index} format
              });
            }
          }
          
          // Strategy 5: Try partial match (entityId contains enemy ID or vice versa)
          if (!enemy) {
            const targetId = String(entityId);
            enemy = displayEnemies.find((e: any) => {
              const eId = String(e.id || e.name || e.type || '');
              // Check both original entityId and extractedId
              return targetId.includes(eId) || eId.includes(targetId) || 
                     extractedId.includes(eId) || eId.includes(extractedId);
            });
          }
          
          if (enemy) {
            // Only set enemyId if we haven't already set it from Strategy 1
            if (enemyId === String(entityId)) {
              enemyId = String(enemy.id || enemy.name || enemy.type || extractedId || entityId);
            }
            enemyName = enemy.name || enemy.type || '';
            
            // Try to match enemy name to ENEMY_SPRITES for proper animation support
            if (enemyName) {
              const enemyNameLower = enemyName.toLowerCase();
              for (const type of Object.keys(ENEMY_SPRITES)) {
                if (type.toLowerCase() === enemyNameLower || enemyNameLower.includes(type.toLowerCase())) {
                  enemyName = type;
                  break;
                }
              }
          }
        } else {
            // Enemy not found - use entityId as fallback
            enemyId = String(entityId);
          }
          
          // Always call setEnemyAnimation - it will handle missing enemyName gracefully
          // For hurt/death animations, this is critical even if enemy not found
          setEnemyAnimation(String(enemyId), animation, enemyName || undefined);
        }
      });
      
      // Subscribe to log messages (optional - for debugging)
      const logCleanup = combatEngine.onLog((type, message) => {
        // Log message received
      });
      
      // Subscribe to combat text (floating damage/healing numbers)
      // Throttle combat text to prevent spam (max 1 per entity per 100ms)
      // Use ref to persist throttling state across re-renders (prevents SCT spam when heroes leave)
      const combatTextCleanup = combatEngine.onCombatText((entityId, amount, type, isHero) => {
        const now = Date.now();
        
        // For heroes, ensure entityId matches DOM format (battle-hero-{id})
        // processHpRegeneration passes hero.id, but DOM uses battle-hero-{id}
        let targetId = entityId;
        if (isHero) {
          // If entityId doesn't have battle-hero- prefix, add it
          // showScrollingCombatText will strip it if needed, but having it ensures correct matching
          if (!entityId.startsWith('battle-hero-')) {
            targetId = `battle-hero-${entityId}`;
          }
        }
        
        // Use entityId for throttling (original format), but targetId for display
        const throttleKey = entityId;
        const lastTime = combatTextThrottleRef.current.get(throttleKey) || 0;
        const throttleDelay = type === 'heal-hot' ? 2000 : 100; // 2s for HoT, 100ms for others
        
        if (now - lastTime < throttleDelay) {
          return; // Skip if too soon
        }
        
        combatTextThrottleRef.current.set(throttleKey, now);
        showScrollingCombatText(targetId, amount, type, isHero);
      });
      
      // Always start adventure loop (matches Electron app - adventure loop runs continuously)
      // Adventure loop will skip if enemies exist, but will spawn new enemies after combat ends
      // Reference: E:\IdleDnD\game.js lines 8677-8679 - adventure loop always runs
      combatEngine.startAdventure();
      
      // If we already have enemies, also start combat directly
      // Adventure loop will skip while combat is active (due to early return in adventureTick)
      if (displayEnemies.length > 0) {
      combatEngine.startCombat();
      }
      // If no enemies, adventure loop will generate them on next tick
      
      combatEngineRef.current = combatEngine;

      // Set up test helper context
      setTestHelperContext({
        combatEngine: combatEngine,
        getHeroes: () => {
          const state = combatEngine.getState();
          const heroes = state.heroes;
          if (Array.isArray(heroes)) return heroes as Hero[];
          if (heroes instanceof Map) return Array.from(heroes.values()) as Hero[];
          return Object.values(heroes || {}) as Hero[];
        },
        getEnemies: () => {
          const state = combatEngine.getState();
          return (state.currentEnemies || []) as Enemy[];
        },
        getState: () => combatEngine.getState()
      });
      
      
      // Return cleanup function to unregister callbacks when effect re-runs or component unmounts
      return () => {
        // Unregister all callbacks
        if (animationCleanup) animationCleanup();
        if (logCleanup) logCleanup();
        if (combatTextCleanup) combatTextCleanup();
        
        // Clean up combat engine
        if (combatEngineRef.current) {
          combatEngineRef.current.stopCombat();
          combatEngineRef.current.stopAdventure();
          combatEngineRef.current = null;
        }
        
        // Clean up quest tracker
        if (questTrackerRef.current) {
          questTrackerRef.current.stop();
          questTrackerRef.current = null;
        }
        
        // Clear all animation timeouts
        Object.values(animationTimeouts.current).forEach(timeout => clearTimeout(timeout));
        animationTimeouts.current = {};
      };
    } else if (!isCombatActive && combatEngineRef.current) {
      // Stop combat engine when combat ends (but keep adventure loop running)
      combatEngineRef.current.stopCombat();
      // Don't stop adventure loop - it should continue and generate next enemies
      // Only stop everything if heroes are gone
      if (displayHeroes.length === 0) {
        combatEngineRef.current.stopAdventure();
      combatEngineRef.current = null;
      }
      
      // Clear generated enemies when combat ends (they'll regenerate when combat starts again)
      // Only clear if enemies are all dead or gone
      const allEnemiesDead = displayEnemies.length > 0 && displayEnemies.every((e: any) => e.isDead || e.hp <= 0);
      if (allEnemiesDead || displayEnemies.length === 0) {
        setLocalGeneratedEnemies([]);
        enemiesGeneratedRef.current = false;
        lastHeroKeyRef.current = '';
      }
    }
  }, [
    battlefieldState, 
    // Use stable hero ID string instead of entire displayHeroes array to prevent unnecessary re-runs
    displayHeroes.map(h => h.id || h.name || h.characterName).sort().join(','),
    displayEnemies.length, // Only depend on count, not entire array
    isCombatActive, 
    useTestCombat, 
    testHeroes.length // Only depend on count for test heroes
  ]);

  // Ensure heroes start with idle animation when first rendered
  useEffect(() => {
    if (displayHeroes.length > 0) {
      displayHeroes.forEach(hero => {
        if (hero && hero.hp > 0 && !hero.isDead) {
          const heroId = hero.id || hero.name || hero.characterName;
          // Only set idle if not already set (to avoid overriding active animations)
          if (!heroAnimations[heroId]) {
            setHeroAnimation(heroId, 'idle', hero.role);
          }
        }
      });
    }
  }, [displayHeroes.map(h => h.id || h.name || h.characterName).join(',')]); // Run when hero IDs change

  // Sync combat engine state changes back to React state (for UI updates)
  // Use an interval to periodically sync combat engine state to React state
  useEffect(() => {
      if (!combatEngineRef.current || !isCombatActive) {
        return;
      }
      
      const syncInterval = setInterval(() => {
        if (!combatEngineRef.current || !isCombatActive) {
          clearInterval(syncInterval);
          return;
        }
        
        // Sync heroes HP changes from combat engine to local state
        const engineHeroes = combatEngineRef.current.state.heroes;
        const heroesArray = Array.isArray(engineHeroes) ? engineHeroes : Array.from(engineHeroes.values());
        
        const heroHp: Record<string, number> = {};
        const heroDead: Record<string, boolean> = {};
        const heroShield: Record<string, number> = {};
        
        heroesArray.forEach((engineHero: any) => {
          if (!engineHero) return;
          // CRITICAL: Store HP under ALL possible ID formats to ensure lookup works
          // The render code tries multiple formats, so we need to store under all of them
          const hp = engineHero.hp || 0;
          const isDead = engineHero.isDead || false;
          const level = engineHero.level || 1;
          const xp = engineHero.xp || 0;
          const maxXp = engineHero.maxXp || (100 + level * 10);
          
          // Check for level-up
          const heroId = engineHero.id || engineHero.name || engineHero.characterName || '';
          const previousLevel = previousHeroLevels.current[heroId] || level;
          if (level > previousLevel && heroId) {
            // Level up detected!
            setLevelingUpHeroes(prev => new Set(prev).add(heroId));
            // Show level-up SCT
            showScrollingCombatText(`battle-hero-${heroId}`, 'LEVEL UP!', 'levelup', true);
            // Auto-remove from set after animation completes (LevelUpEffect handles this)
            setTimeout(() => {
              setLevelingUpHeroes(prev => {
                const next = new Set(prev);
                next.delete(heroId);
                return next;
              });
            }, 2000); // Match LevelUpEffect duration
          }
          previousHeroLevels.current[heroId] = level;
          
          // Also check if XP >= maxXp (might level up in next sync)
          if (xp >= maxXp && heroId) {
            // Will level up - combat engine should handle this, but we can prepare
            console.log(`📈 [Level Up Pending] ${engineHero.name || heroId} has enough XP to level up (${xp}/${maxXp})`);
          }
          
          // Extract shield amount (handle both number and object formats)
          const shieldAmount = typeof engineHero.shield === 'object' && engineHero.shield?.amount !== undefined
            ? engineHero.shield.amount
            : (typeof engineHero.shield === 'number' ? engineHero.shield : 0);
          
          // Debug logging for shield syncing (only log significant changes)
          if (shieldAmount > 0) {
            const prevShield = localCombatState.heroShield[engineHero.id || ''] || 0;
            // Shield amount changed
          }
          
          // Store under all possible ID formats
          if (engineHero.id) {
            heroHp[engineHero.id] = hp;
            heroDead[engineHero.id] = isDead;
            heroShield[engineHero.id] = shieldAmount;
          }
          if (engineHero.name) {
            heroHp[engineHero.name] = hp;
            heroDead[engineHero.name] = isDead;
            heroShield[engineHero.name] = shieldAmount;
          }
          if (engineHero.characterName) {
            heroHp[engineHero.characterName] = hp;
            heroDead[engineHero.characterName] = isDead;
            heroShield[engineHero.characterName] = shieldAmount;
          }
          if (engineHero.username) {
            heroHp[engineHero.username] = hp;
            heroDead[engineHero.username] = isDead;
            heroShield[engineHero.username] = shieldAmount;
          }
          
          // Also store under the primary ID (same resolution as render code)
          const primaryId = engineHero.id || engineHero.name || engineHero.characterName;
          if (primaryId) {
            heroHp[primaryId] = hp;
            heroDead[primaryId] = isDead;
            heroShield[primaryId] = shieldAmount;
          }
        });
        
        // Sync enemy HP changes from combat engine to local state
        const engineEnemies = combatEngineRef.current.state.currentEnemies || [];
        
        const enemyHp: Record<string, number> = {};
        const enemyDead: Record<string, boolean> = {};
        
        // Sync from engine enemies (most up-to-date)
        engineEnemies.forEach((engineEnemy: any) => {
          if (!engineEnemy) return;
          const enemyId = engineEnemy.id;
          // FIXED: Ensure HP is floored to integer and sync even if enemy is dead
          const hp = Math.max(0, Math.floor(engineEnemy.hp || 0));
          enemyHp[enemyId] = hp;
          enemyDead[enemyId] = engineEnemy.isDead || false;
        });
        
        // FIXED: Also check previous localCombatState for enemies that were filtered out
        // When enemies die, they're removed from currentEnemies, but we need to update their HP to 0
        if (localCombatState.enemyHp) {
          Object.keys(localCombatState.enemyHp).forEach((enemyId) => {
            // If enemy was in previous state but not in current engine enemies, check if it should be marked as dead
            const wasInPreviousState = localCombatState.enemyHp[enemyId] !== undefined;
            const isInCurrentState = enemyHp.hasOwnProperty(enemyId);
            
            // If enemy was alive before but not in current enemies, it might have died
            // Check battlefieldState to see if it's marked as dead
            if (wasInPreviousState && !isInCurrentState) {
              const battlefieldEnemy = battlefieldState?.enemies?.find((e: any) => e.id === enemyId);
              if (battlefieldEnemy && (battlefieldEnemy.isDead || battlefieldEnemy.hp <= 0)) {
                // Enemy died - sync HP to 0
                enemyHp[enemyId] = 0;
                enemyDead[enemyId] = true;
              }
            }
          });
        }
        
        // Track quest progress for enemy deaths
        const battlefieldEnemies = battlefieldState?.enemies || [];
        Object.keys(enemyDead).forEach((enemyId) => {
          if (questTrackerRef.current && enemyDead[enemyId] && !previousEnemyDead.current[enemyId]) {
            // Enemy just died - track kill
            const enemy = engineEnemies.find((e: any) => e.id === enemyId) || 
                         battlefieldEnemies.find((e: any) => e.id === enemyId);
            if (enemy) {
              questTrackerRef.current.track('kill', 1, 'daily');
              questTrackerRef.current.track('kill', 1, 'weekly');
              questTrackerRef.current.track('kill', 1, 'monthly');
              
              // Check if it's a boss
              if (isBossEnemy(enemy.name || '')) {
                questTrackerRef.current.track('defeatBosses', 1, 'daily');
                questTrackerRef.current.track('defeatBosses', 1, 'weekly');
                questTrackerRef.current.track('defeatBosses', 1, 'monthly');
                bossDefeats.current++;
              }
            }
          }
        });
        
        // Update previous enemy death state
        previousEnemyDead.current = { ...enemyDead };
        
        // Track wave completions
        const currentWaveCount = combatEngineRef.current?.getState()?.waveCount || 0;
        if (questTrackerRef.current && currentWaveCount > previousWaveCount.current) {
          const wavesGained = currentWaveCount - previousWaveCount.current;
          questTrackerRef.current.track('completeWaves', wavesGained, 'daily');
          questTrackerRef.current.track('completeWaves', wavesGained, 'weekly');
          questTrackerRef.current.track('completeWaves', wavesGained, 'monthly');
          wavesCompleted.current += wavesGained;
        }
        previousWaveCount.current = currentWaveCount;
        
        // Also sync alive enemies to localCombatState so they persist
        // Keep enemies visible even if they're dead (until completely removed)
        setLocalCombatState(prev => ({
          ...prev,
          heroHp,
          enemyHp: { ...prev.enemyHp, ...enemyHp }, // Merge to keep all enemies
          heroDead,
          enemyDead: { ...prev.enemyDead, ...enemyDead }, // Merge to keep all enemies
          heroShield,
          // Sync buffs and debuffs for display
          heroBuffs: Object.fromEntries(heroesArray.map((h: any) => [h.id || h.username, h.activeBuffs || {}])),
          heroDebuffs: Object.fromEntries(heroesArray.map((h: any) => [h.id || h.username, h.activeDebuffs || {}])),
          enemyDebuffs: Object.fromEntries(engineEnemies.map((e: any) => [String(e.id), e.activeDebuffs || {}]))
        }));
        
        // Update buff/debuff displays every 1000ms (reduced frequency to prevent animation spam)
        updateHeroBuffDisplay(engineHeroes);
        updateHeroDebuffDisplay(engineHeroes);
        updateEnemyDebuffDisplay(engineEnemies);
      }, 1000); // Sync every 1000ms (reduced from 500ms to prevent shaking/spam)
      
      return () => clearInterval(syncInterval);
    }, [isCombatActive]);

  // Process HoT (Heal over Time) ticks every 100ms - similar to RaidBrowserSourcePage
  // This ensures HoT heals continuously, not just during combat rounds
  useEffect(() => {
    if (!combatEngineRef.current || !isCombatActive) {
      return;
    }

    const hotInterval = setInterval(() => {
      if (!combatEngineRef.current || !isCombatActive) {
        return;
      }

      const now = Date.now();
      const engineHeroes = combatEngineRef.current.state.heroes;
      const heroesArray = Array.isArray(engineHeroes) ? engineHeroes : Array.from(engineHeroes.values());

      heroesArray.forEach((hero: any) => {
        if (!hero || hero.isDead || hero.hp <= 0 || !hero.activeBuffs) return;

        // Calculate equipment-based HP regeneration
        const equipmentHpRegen = getEquipmentHpRegen(hero.equipment || {});
        const equipmentRegenTickRate = 5000; // 5 seconds
        let equipmentRegenHealing = 0;

        if (equipmentHpRegen > 0 && hero.hp > 0) {
          const lastEquipmentRegenTick = hero.lastEquipmentRegenTick || 0;
          const timeSinceLastTick = now - lastEquipmentRegenTick;

          if (timeSinceLastTick >= equipmentRegenTickRate || lastEquipmentRegenTick === 0) {
            equipmentRegenHealing = equipmentHpRegen * (equipmentRegenTickRate / 1000);
            hero.lastEquipmentRegenTick = now;
          }
        }

        // Process HoT ticks (Heal over Time)
        let totalHotHealing = 0;
        const hotTickRate = 2000; // 2 seconds

        Object.keys(hero.activeBuffs || {}).forEach(key => {
          const buff = hero.activeBuffs[key];
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
            }
          }
        });

        // Combine equipment regen with HoT
        const totalHealing = totalHotHealing + equipmentRegenHealing;

        // Apply HoT healing with shield conversion
        if (totalHealing > 0 && hero.hp > 0) {
          const missingHp = hero.maxHp - hero.hp;
          let newHp = hero.hp;
          
          // Get current shield amount (handle both number and object formats)
          const currentShieldAmount = typeof hero.shield === 'number' 
            ? hero.shield 
            : (hero.shield?.amount || 0);
          
          let newShieldAmount = currentShieldAmount;

          if (missingHp > 0) {
            // Heal missing HP first
            const hpHealed = Math.min(totalHealing, missingHp);
            newHp = hero.hp + hpHealed;
            const excessHealing = totalHealing - hpHealed;

            // Convert excess healing to shield
            if (excessHealing > 0) {
              newShieldAmount = currentShieldAmount + excessHealing;
            }
          } else {
            // Already at full HP - all healing goes to shield
            newShieldAmount = currentShieldAmount + totalHealing;
          }

          // Update hero HP and shield in combat engine
          hero.hp = newHp;
          hero.shield = {
            amount: newShieldAmount,
            expiresAt: typeof hero.shield === 'object' && hero.shield?.expiresAt 
              ? hero.shield.expiresAt 
              : now + 10000 // 10 second shield duration
          };

          // Show green combat text for HoT (heal-hot type)
          // Use battle-hero-{id} format to match DOM element IDs
          const heroId = hero.id || hero.username || hero.name || hero.characterName;
          if (heroId) {
            showScrollingCombatText(`battle-hero-${heroId}`, totalHealing, 'heal-hot', true);
          }
        }
      });
    }, 100); // Check every 100ms like RaidBrowserSourcePage

    return () => clearInterval(hotInterval);
  }, [isCombatActive]);

  // Fetch quest progress periodically
  useEffect(() => {
    if (!user?.twitchId) return;
    
    const fetchQuestProgress = async () => {
      try {
        const [dailyQuests, weeklyQuests, monthlyQuests, progress] = await Promise.all([
          questAPI.getDailyQuests(),
          questAPI.getWeeklyQuests(),
          questAPI.getMonthlyQuests(),
          questAPI.getPlayerProgress(user.twitchId)
        ]);
        
        const allQuests = [
          ...dailyQuests.map((q: any) => ({ ...q, type: 'daily' as const })),
          ...weeklyQuests.map((q: any) => ({ ...q, type: 'weekly' as const })),
          ...monthlyQuests.map((q: any) => ({ ...q, type: 'monthly' as const }))
        ];
        
        // Filter to active quests (not completed) and map to quest progress format
        const activeQuests = allQuests
          .filter((q: any) => {
            const questProgress = progress?.find((p: any) => p.questId === q.id && p.type === q.type);
            return questProgress && questProgress.progress < q.target;
          })
          .map((q: any) => {
            const questProgress = progress?.find((p: any) => p.questId === q.id && p.type === q.type);
            return {
              questId: q.id,
              questName: q.name,
              type: q.type,
              progress: questProgress?.progress || 0,
              target: q.target,
              description: q.description || ''
            };
          })
          .slice(0, 5); // Show top 5 active quests
        
        setQuestProgress(activeQuests);
      } catch (error) {
        // Error fetching quest progress
      }
    };
    
    // Fetch immediately
    fetchQuestProgress();
    
    // Then fetch every 30 seconds
    const questInterval = setInterval(fetchQuestProgress, 30000);
    
    return () => clearInterval(questInterval);
  }, [user?.twitchId]);

  return (
    <div
      style={{
        position: 'fixed',
        top: '0',
        left: '0',
        width: `${WIDTH}px`,
        height: `${HEIGHT}px`,
        overflow: 'hidden',
        margin: '0',
        padding: '0',
        backgroundColor: 'transparent',
        background: 'transparent',
      }}
      className="browser-source-page"
    >
      {/* Loading Overlay */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000
        }}>
          <div style={{ textAlign: 'center', color: 'white' }}>
            <div className="animate-spin" style={{
              width: '48px',
              height: '48px',
              border: '4px solid #8b5cf6',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              margin: '0 auto 16px'
            }}></div>
            <p>Loading battlefield...</p>
          </div>
        </div>
      )}

      {/* Empty State - Show message if no heroes/enemies */}
      {!isLoading && displayHeroes.length === 0 && displayEnemies.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: 'white',
          fontSize: '24px',
          zIndex: 1000
        }}>
          <div style={{ marginBottom: '16px' }}>⚔️</div>
          <div>Waiting for heroes and enemies...</div>
          <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.7 }}>
            Battlefield: {battlefieldId || 'Not set'}
          </div>
        </div>
      )}

      {/* Wave Counter Display */}
      {combatEngineRef.current && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '8px',
          fontSize: '24px',
          fontWeight: 'bold',
          zIndex: 1000,
          border: '2px solid rgba(255, 255, 255, 0.3)',
          textShadow: '0 0 8px rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span>🌊 Wave {combatEngineRef.current.getState()?.waveCount || 0}</span>
          {(combatEngineRef.current.getState()?.waveCount || 0) % 10 === 0 && (combatEngineRef.current.getState()?.waveCount || 0) > 0 && (
            <span style={{ color: '#fbbf24', fontSize: '20px' }}>👑 BOSS WAVE</span>
          )}
          {(combatEngineRef.current.getState()?.waveCount || 0) % 5 === 0 && (combatEngineRef.current.getState()?.waveCount || 0) % 10 !== 0 && (combatEngineRef.current.getState()?.waveCount || 0) > 0 && (
            <span style={{ color: '#60a5fa', fontSize: '20px' }}>😴 Auto-Rest</span>
          )}
        </div>
      )}

      {/* Difficulty Indicator */}
      {combatEngineRef.current && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '220px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '8px',
          fontSize: '20px',
          fontWeight: 'bold',
          zIndex: 1000,
          border: '2px solid rgba(255, 255, 255, 0.3)',
          textShadow: '0 0 8px rgba(0, 0, 0, 0.8)'
        }}>
          <span>Difficulty: </span>
          <span style={{
            color: (() => {
              const difficulty = (combatEngineRef.current?.getState()?.difficultyModifier || 1.0) * 100;
              if (difficulty < 60) return '#10b981'; // green
              if (difficulty < 80) return '#fbbf24'; // yellow
              return '#ef4444'; // red
            })()
          }}>
            {Math.floor((combatEngineRef.current.getState()?.difficultyModifier || 1.0) * 100)}%
          </span>
        </div>
      )}

      {/* Gold/Token Balance Display */}
      {displayHeroes.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '8px',
          fontSize: '18px',
          fontWeight: 'bold',
          zIndex: 1000,
          border: '2px solid rgba(255, 255, 255, 0.3)',
          textShadow: '0 0 8px rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div>
            💰 Gold: {displayHeroes.reduce((sum, h) => sum + (h.gold || 0), 0)}
          </div>
          <div>
            🪙 Tokens: {displayHeroes.reduce((sum, h) => sum + (h.tokens || 0), 0)}
          </div>
        </div>
      )}

      {/* Heroes */}
      {displayHeroes.map((hero, index) => {
        const slotKey = `battle-hero-slot-${index}`;
        const slotPos = getSlotPosition(slotKey, `${(index + 1) * 15}%`, '10%');
        
        // Use local combat state HP if available (combat engine updates)
        // Try multiple ID formats to match what was stored in sync interval
        const heroId = hero.id || hero.name || hero.characterName;
        const heroIdAlt = hero.name || hero.characterName || hero.id;
        const heroIdUsername = hero.username || hero.name || hero.characterName || hero.id;
        
        // Try all possible ID formats to find the HP value
        const syncedHp = localCombatState.heroHp[heroId] ?? 
                        localCombatState.heroHp[heroIdAlt] ?? 
                        localCombatState.heroHp[heroIdUsername] ??
                        localCombatState.heroHp[hero.id || ''] ??
                        localCombatState.heroHp[hero.name || ''] ??
                        localCombatState.heroHp[hero.characterName || ''] ??
                        localCombatState.heroHp[hero.username || ''];
        
        const syncedIsDead = localCombatState.heroDead[heroId] ?? 
                            localCombatState.heroDead[heroIdAlt] ?? 
                            localCombatState.heroDead[heroIdUsername] ??
                            localCombatState.heroDead[hero.id || ''] ??
                            localCombatState.heroDead[hero.name || ''] ??
                            localCombatState.heroDead[hero.characterName || ''] ??
                            localCombatState.heroDead[hero.username || ''];
        
        const effectiveHp = isCombatActive && syncedHp !== undefined
          ? syncedHp
          : (hero.hp !== undefined ? hero.hp : hero.maxHp || 100);
        const effectiveIsDead = isCombatActive && syncedIsDead !== undefined
          ? syncedIsDead
          : (hero.isDead || false);
        
        // Create display hero with effective values
        const displayHero = { ...hero, hp: effectiveHp, isDead: effectiveIsDead };
        
        // Get animation state from tracked animations (or default based on hero state)
        const trackedAnimation = heroAnimations[hero.id || heroId];
        let animation: 'idle' | 'attack' | 'hurt' | 'death' = trackedAnimation || 'idle';
        
        // Override with death if dead
        if (effectiveIsDead || effectiveHp <= 0) {
          animation = 'death';
        }

        // Get role category helper
        const getRoleCategory = (role: string): string => {
          const tanks = ['guardian', 'paladin', 'warden', 'bloodknight', 'vanguard', 'brewmaster'];
          const healers = ['cleric', 'atoner', 'druid', 'lightbringer', 'shaman', 'mistweaver', 'chronomancer', 'bard'];
          if (tanks.includes(role)) return 'tank';
          if (healers.includes(role)) return 'healer';
          return 'dps';
        };

        // Get sprite container class based on role
        const getSpriteContainerClass = () => {
          const roleCategory = getRoleCategory(hero.role || 'berserker');
          if (roleCategory === 'tank') return 'huge-knight-sprite sprite-container';
          if (roleCategory === 'healer') {
            if (hero.role === 'bard') return 'bard-sprite sprite-container';
            return 'wizard-sprite sprite-container';
          }
          if (roleCategory === 'dps') {
            const meleeDPS = ['berserker', 'crusader', 'assassin', 'reaper', 'bladedancer', 'monk', 'stormwarrior', 'hunter'];
            if (meleeDPS.includes(hero.role || '')) return 'dwarf-warrior-sprite sprite-container';
            return 'pyromancer-sprite sprite-container';
          }
          return 'sprite-container';
        };

        const leftPx = toPixels(slotPos.left, 'width');
        const bottomPx = toPixels(slotPos.bottom, 'height');

        // Calculate scaled sprite height for positioning overhead UI
        const heroScale = 3.0; // Current hero scale
        const baseSpriteHeight = 48; // VIEWPORT from HeroSpriteJS
        const scaledHeroHeight = baseSpriteHeight * heroScale;

        return (
          <div
            key={hero.id}
            id={`battle-hero-${heroId}`}
            style={{
              position: 'absolute',
              left: `${leftPx}px`,
              bottom: `${bottomPx + 48}px`, // Add 48px to anchor by feet (viewport height)
              transform: 'translateX(-50%)',
              zIndex: 100,
              isolation: 'isolate', // Create new stacking context for combat text
            }}
          >
            {/* Buffs Display - ABOVE name/overhead UI */}
            <div className="battle-buffs"></div>

            {/* Overhead UI - Positioned above sprite's head */}
            <div style={{
              position: 'absolute',
              bottom: `${scaledHeroHeight + 4}px`, // Position above the scaled sprite height + spacing
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              minWidth: '100px',
              pointerEvents: 'none',
              zIndex: 200, // Ensure it's above the sprite
            }}>
              {/* Name */}
              <div style={{
                fontSize: '1em',
                fontWeight: '700',
                color: '#fbbf24',
                textShadow: '0 0 4px rgba(0, 0, 0, 0.8), 0 0 8px rgba(251, 191, 36, 0.6)',
                whiteSpace: 'nowrap',
                textAlign: 'center'
              }}>
                {hero.name || hero.characterName || 'Unknown'} <span style={{ color: '#a78bfa' }}>Lv{hero.level || 1}</span>
              </div>

              {/* Shield Bar - Above HP Bar */}
              {(() => {
                // Try all possible ID formats to find the shield value
                const syncedShield = localCombatState.heroShield[heroId] ?? 
                                    localCombatState.heroShield[heroIdAlt] ?? 
                                    localCombatState.heroShield[heroIdUsername] ??
                                    localCombatState.heroShield[hero.id || ''] ??
                                    localCombatState.heroShield[hero.name || ''] ??
                                    localCombatState.heroShield[hero.characterName || ''] ??
                                    localCombatState.heroShield[hero.username || ''];
                
                const effectiveShield = isCombatActive && syncedShield !== undefined
                  ? syncedShield
                  : (hero.shield && typeof hero.shield === 'object' ? hero.shield.amount : (typeof hero.shield === 'number' ? hero.shield : 0));
                
                if (effectiveShield > 0) {
                  return (
                    <div style={{
                      width: '100px',
                      height: '4px',
                      backgroundColor: 'rgba(100, 150, 255, 0.3)',
                      borderRadius: '2px',
                      overflow: 'hidden',
                      border: '1px solid rgba(100, 150, 255, 0.5)',
                      marginTop: '2px',
                      marginBottom: '2px'
                    }}>
                      <div style={{
                        height: '100%',
                        backgroundColor: '#6495ed',
                        width: `${Math.min(((effectiveShield / (displayHero.maxHp || 1)) * 100), 100)}%`,
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  );
                }
                return null;
              })()}

              {/* HP Bar */}
              <div style={{
                width: '100px',
                height: '8px',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                borderRadius: '4px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                marginTop: '2px' // Move down a little
              }}>
                <div style={{
                  height: '100%',
                  backgroundColor: effectiveHp && displayHero.maxHp && (effectiveHp / displayHero.maxHp) > 0.5 ? '#22c55e' : 
                                   (effectiveHp && displayHero.maxHp && (effectiveHp / displayHero.maxHp) > 0.25 ? '#eab308' : '#dc2626'),
                  width: `${((effectiveHp || 0) / (displayHero.maxHp || 1)) * 100}%`,
                  transition: 'width 0.3s ease, background-color 0.3s ease'
                }} />
              </div>

              {/* HP Text */}
              <div style={{
                fontSize: '0.875em',
                color: '#d1d5db',
                textShadow: '0 0 4px rgba(0, 0, 0, 0.8)',
                fontFamily: 'monospace'
              }}>
                {Math.floor(effectiveHp || 0)} / {Math.floor(displayHero.maxHp || 100)}
              </div>
            </div>

            {/* Hero Sprite - New ref-based component creates its own container */}
            <div 
              ref={(el) => {
                if (el && hero.role) {
                  // Use category-based key for heroes (Tank, Healer, DPS)
                  const heroRole = hero.role || 'berserker';
                  const category = getHeroCategory(heroRole);
                  // Try slot-based layout first, then fallback to category-only
                  const slotKey = getSpriteKey('hero', category, index, true);
                  const categoryKey = getSpriteKey('hero', category, null, true);
                  const layout = spriteLayoutsRef.current[slotKey] || spriteLayoutsRef.current[categoryKey];
                  if (layout) {
                    // Apply layout after a brief delay to ensure sprite is rendered
                    setTimeout(() => {
                      applySpriteLayout(el, { ...layout, facingDirection: getFacingDirection(heroRole, 'right') });
                    }, 0);
                  }
                }
              }}
              style={{
                position: 'relative',
                zIndex: 100, // Ensure sprite is below overhead UI
              }}
            >
              <HeroSpriteJS
                key={heroId}
                ref={getOrCreateHeroRef(heroId)}
                heroId={String(heroId)}
                role={hero.role || 'berserker'}
                facing={getFacingDirection(hero.role || 'berserker', 'right')}
                scale={3.0}
                shield={(() => {
                  // Use synced shield from localCombatState if available
                  const syncedShield = localCombatState.heroShield[heroId] ?? 
                                      localCombatState.heroShield[heroIdAlt] ?? 
                                      localCombatState.heroShield[heroIdUsername] ??
                                      localCombatState.heroShield[hero.id || ''] ??
                                      localCombatState.heroShield[hero.name || ''] ??
                                      localCombatState.heroShield[hero.characterName || ''] ??
                                      localCombatState.heroShield[hero.username || ''];
                  
                  if (isCombatActive && syncedShield !== undefined) {
                    return syncedShield;
                  }
                  // Fallback to hero.shield
                  return (hero.shield && typeof hero.shield === 'object' ? hero.shield.amount : (typeof hero.shield === 'number' ? hero.shield : 0));
                })()}
              />
            </div>
            
            {/* Debuffs Display - BELOW sprite */}
            <div className="battle-debuffs"></div>
            
            {/* Loot Notifications - Below sprite */}
            {lootNotifications[heroId] && lootNotifications[heroId].length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginTop: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                pointerEvents: 'none',
                zIndex: 200
              }}>
                {lootNotifications[heroId].map((notification, idx) => {
                  const rarityColors: Record<string, string> = {
                    common: '#9ca3af',
                    rare: '#3b82f6',
                    epic: '#a855f7',
                    legendary: '#fbbf24'
                  };
                  const color = rarityColors[notification.rarity] || rarityColors.common;
                  const age = Date.now() - notification.timestamp;
                  const opacity = Math.max(0, 1 - (age / 5000)); // Fade out over 5 seconds
                  
                  return (
                    <div
                      key={`${notification.timestamp}-${idx}`}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: `rgba(0, 0, 0, ${0.7 * opacity})`,
                        color: color,
                        fontSize: '0.875em',
                        fontWeight: 'bold',
                        borderRadius: '4px',
                        border: `2px solid ${color}`,
                        textShadow: `0 0 4px ${color}, 0 0 8px rgba(0, 0, 0, 0.8)`,
                        whiteSpace: 'nowrap',
                        opacity: opacity,
                        transform: `translateY(${(1 - opacity) * 20}px)`,
                        transition: 'opacity 0.3s ease, transform 0.3s ease'
                      }}
                    >
                      ⚔️ {notification.itemName}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Enemies */}
      {displayEnemies.map((enemy: any, index: number) => {
        const slotKey = `battle-enemy-slot-${index}`;
        const slotPos = getSlotPosition(slotKey, `${70 + index * 10}%`, '10%'); // Same plane as heroes
        
        const leftPx = toPixels(slotPos.left, 'width');
        const bottomPx = toPixels(slotPos.bottom, 'height');
        
        // Use local combat state HP if available (combat engine updates)
        // CRITICAL: Use a stable enemy ID - prefer id, then use name/type, then fallback to index
        const enemyId = enemy.id || enemy.name || enemy.type || `enemy-${index}`;
        
        // FIXED: Prioritize enemy.hp over localCombatState if enemy is marked as dead
        // This ensures dead enemies show 0 HP even if sync hasn't run yet
        let effectiveHp: number;
        if (enemy.isDead || enemy.hp === 0) {
          // Enemy is dead - use 0 HP
          effectiveHp = 0;
        } else if (isCombatActive && localCombatState.enemyHp[enemyId] !== undefined) {
          // Use synced HP from combat engine
          effectiveHp = localCombatState.enemyHp[enemyId];
        } else {
          // Fallback to enemy.hp or maxHp
          effectiveHp = enemy.hp !== undefined ? enemy.hp : (enemy.maxHp || 100);
        }
        
        // Ensure HP is an integer
        effectiveHp = Math.max(0, Math.floor(effectiveHp));
        
        const effectiveIsDead = isCombatActive && localCombatState.enemyDead[enemyId] !== undefined
          ? localCombatState.enemyDead[enemyId]
          : (enemy.isDead || false);
        
        // Debug enemy rendering (only log once per enemy, not on every render)
        // Removed excessive logging that was causing performance issues
        
        // Create display enemy with effective values
        const displayEnemy = { ...enemy, hp: effectiveHp, isDead: effectiveIsDead };

        // Determine enemy type - try to match from enemy name or sprite
        let enemyType: string | null = null;
        const enemyName = (enemy.name || enemy.type || '').trim();
        const enemyNameLower = enemyName.toLowerCase();
        
        // First, try exact match (case-insensitive)
        for (const type of Object.keys(ENEMY_SPRITES)) {
          if (type.toLowerCase() === enemyNameLower) {
            enemyType = type;
            break;
          }
        }
        
        // Then try partial match (case-insensitive)
        if (!enemyType) {
          for (const type of Object.keys(ENEMY_SPRITES)) {
            const typeLower = type.toLowerCase();
            // Match if enemy name contains type name or vice versa
            if (enemyNameLower.includes(typeLower) || typeLower.includes(enemyNameLower)) {
              enemyType = type;
              break;
            }
          }
        }

        // Fallback: try to match sprite name
        if (!enemyType && enemy.sprite) {
          const spriteName = enemy.sprite.toLowerCase().replace(/\s+/g, ' ').trim();
          for (const type of Object.keys(ENEMY_SPRITES)) {
            const typeLower = type.toLowerCase();
            // Try exact match first
            if (spriteName.includes(typeLower) || typeLower.includes(spriteName)) {
              enemyType = type;
              break;
            }
          }
        }
        
        // Debug logging for Headless Horseman specifically
        if (enemyNameLower.includes('headless') || enemyNameLower.includes('horseman')) {
          console.log('🐴 [Headless Horseman Debug]', {
            enemyName,
            enemyNameLower,
            enemyType,
            sprite: enemy.sprite,
            availableTypes: Object.keys(ENEMY_SPRITES),
            matched: !!enemyType
          });
        }

        // Get animation state from tracked animations (or default based on enemy state)
        const trackedAnimation = enemyAnimations[enemyId];
        let animation: EnemyAnimationType = trackedAnimation || 'idle';
        
        // Override with death if dead
        if (effectiveIsDead || effectiveHp <= 0) {
          animation = 'death';
        } else if (!trackedAnimation && enemyType) {
          // First time rendering this enemy - trigger initial animations
          const initKey = `${enemyId}-${enemyType}`;
          
          // Werewolf starts in human form
          if (enemyType === 'Werewolf' && !enemyInitializedRef.current.has(initKey)) {
            const specialState = enemySpecialStates[enemyId];
            if (!specialState?.isTransformed) {
              animation = 'idleHuman';
              enemyInitializedRef.current.add(initKey);
              // Trigger transformation sequence on first render
              setTimeout(() => {
                setEnemyAnimation(String(enemyId), 'idle', enemyType);
              }, 500); // Small delay to let initial render complete
            }
          }
          // Demon Lord starts transitioning to flying
          else if (enemyType === 'Demon Lord' && !enemyInitializedRef.current.has(initKey)) {
            const specialState = enemySpecialStates[enemyId];
            if (!specialState?.isFlying) {
              animation = 'transition';
              enemyInitializedRef.current.add(initKey);
              // Trigger transition sequence on first render
              setTimeout(() => {
                setEnemyAnimation(String(enemyId), 'idle', enemyType);
              }, 500); // Small delay to let initial render complete
            } else {
              animation = 'flying';
            }
          }
        } else if (!trackedAnimation && enemyType) {
          // First time rendering this enemy - trigger initial animations
          // Werewolf starts in human form
          if (enemyType === 'Werewolf') {
            const specialState = enemySpecialStates[enemyId];
            if (!specialState?.isTransformed) {
              animation = 'idleHuman';
              // Trigger transformation sequence on first render
              setTimeout(() => {
                setEnemyAnimation(String(enemyId), 'idle', enemyType);
              }, 100);
            }
          }
          // Demon Lord starts transitioning to flying
          else if (enemyType === 'Demon Lord') {
            const specialState = enemySpecialStates[enemyId];
            if (!specialState?.isFlying) {
              animation = 'transition';
              // Trigger transition sequence on first render
              setTimeout(() => {
                setEnemyAnimation(String(enemyId), 'idle', enemyType);
              }, 100);
            } else {
              animation = 'flying';
            }
          }
        }

        const facing = enemyType ? getFacingDirection(enemyType, 'left') : 'left';

        // Calculate scaled sprite height for positioning overhead UI
        let scaledSpriteHeight = 150; // Default for fallback img
        if (enemyType && ENEMY_SPRITES[enemyType]) {
          const spriteScale = enemyType === 'Demon Lord' ? 5.0 : 2.5;
          scaledSpriteHeight = 48 * spriteScale; // VIEWPORT (48px) * scale
        }

        return (
          <div
            key={enemy.id || index}
            id={`battle-enemy-${enemyId}`}
            style={{
              position: 'absolute',
              left: `${leftPx}px`,
              bottom: `${bottomPx + 48}px`, // Add 48px to anchor by feet (viewport height)
              transform: 'translateX(-50%)',
              alignItems: 'center',
              zIndex: 100,
              // Ensure combat text container can be positioned absolutely
              isolation: 'isolate', // Create new stacking context
            }}
          >
            {/* Buffs Display - ABOVE name/overhead UI */}
            <div className="battle-buffs"></div>

            {/* Overhead UI - Positioned above sprite's head */}
            <div style={{
              position: 'absolute',
              bottom: `${scaledSpriteHeight + 4}px`, // Reduced spacing - closer to sprite head
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              minWidth: '100px',
              pointerEvents: 'none',
              zIndex: 200, // Ensure it's above the sprite
            }}>
              {/* Enemy Name */}
              <div style={{
                fontSize: '0.875rem',
                fontWeight: 'bold',
                color: 'white',
                textShadow: '0 0 4px rgba(0, 0, 0, 0.8)',
                textAlign: 'center',
                whiteSpace: 'nowrap' // Prevent name from wrapping
              }}>
                {enemy.name || 'Enemy'}
              </div>

              {/* HP Bar */}
              <div style={{
                width: '96px',
                height: '8px',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                borderRadius: '4px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                marginTop: '2px' // Move down a little
              }}>
                <div style={{
                  height: '100%',
                  backgroundColor: '#dc2626',
                  width: `${((effectiveHp || 0) / (displayEnemy.maxHp || 1)) * 100}%`,
                  transition: 'width 0.3s ease'
                }} />
              </div>

              {/* HP Text */}
              <div style={{
                fontSize: '0.75rem',
                color: '#d1d5db',
                textShadow: '0 0 4px rgba(0, 0, 0, 0.8)',
                whiteSpace: 'nowrap', // Keep health on one line
                fontFamily: 'monospace' // Monospace helps with number alignment
              }}>
                {Math.floor(effectiveHp || 0)} / {Math.floor(displayEnemy.maxHp || 100)}
              </div>
            </div>
            
            {/* Enemy Sprite - New ref-based component creates its own container */}
            {enemyType && ENEMY_SPRITES[enemyType] ? (
              <div
                ref={(el) => {
                  if (el && enemyType) {
                    const spriteKey = getSpriteKey('enemy', enemyType);
                    const layout = spriteLayoutsRef.current[spriteKey];
                    if (layout) {
                      applySpriteLayout(el, { ...layout, facingDirection: facing });
                    }
                  }
                }}
                style={{ 
                  position: 'relative',
                  zIndex: 100, // Ensure sprite is below overhead UI
                }}
              >
                <EnemySprite
                  key={enemyId}
                  ref={getOrCreateEnemyRef(enemyId)}
                  enemyId={String(enemyId)}
                  enemyType={enemyType}
                  enemyName={enemyType}
                  spriteUrl={ENEMY_SPRITES[enemyType].animations?.idle || ENEMY_SPRITES[enemyType].sprite}
                  frameWidth={ENEMY_SPRITES[enemyType].spriteSize || 48}
                  frameCount={ENEMY_SPRITES[enemyType].frameCount?.idle || 6}
                  facing={facing}
                  scale={enemyType === 'Demon Lord' ? 5.0 : 2.5} // Demon Lord is 2x larger
                />
              </div>
            ) : null}
            
            {!enemyType || !ENEMY_SPRITES[enemyType] ? (
              enemy.sprite ? (
                <div 
                  data-enemy-id={String(enemyId)}
                  data-enemy-name={enemy.name || enemy.type || ''}
                  style={{ position: 'relative' }}
                >
                  <img
                    src={`/Sprites/enemies/EnemySprites/${enemy.sprite}.png`}
                    alt={enemy.name || 'Enemy'}
                    style={{
                      width: '150px',
                      height: '150px',
                      objectFit: 'contain',
                      imageRendering: 'pixelated'
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div 
                  data-enemy-id={String(enemyId)}
                  style={{ fontSize: '4rem' }}
                >
                  👹
                </div>
              )
            ) : null}
            
            {/* Debuffs Display - BELOW sprite */}
            <div className="battle-debuffs"></div>
          </div>
        );
      })}

      {/* Debug Info - COMMENTED OUT FOR PRODUCTION */}
      {/* 
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '10px',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 10000,
        borderRadius: '4px',
        pointerEvents: 'none',
        border: '2px solid #8b5cf6'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>🔍 OBS Browser Source Debug</div>
        <div>Battlefield ID: {battlefieldId || 'none'}</div>
        <div>Heroes: {displayHeroes.length} / {allHeroes.length}</div>
        <div>Enemies: {displayEnemies.length} / {allEnemies.length} {selectedEnemyTypes.length > 0 && `(filtered by ${selectedEnemyTypes.length} types)`}</div>
        <div>Combat Active: {isCombatActive ? '✅ Yes' : '❌ No'}</div>
        {allEnemies.length > 0 && displayEnemies.length === 0 && (
          <div style={{ color: '#fbbf24', marginTop: '4px' }}>
            ⚠️ Enemies filtered out! Check selectedEnemyTypes
          </div>
        )}
        <div>Engine Running: {combatEngineRef.current ? '✅ Yes' : '❌ No'}</div>
        <div>Loading: {isLoading ? '⏳ Yes' : '✅ No'}</div>
        <div>Has State: {battlefieldState ? '✅ Yes' : '❌ No'}</div>
        <div>Difficulty: {combatEngineRef.current?.getState()?.difficultyModifier 
          ? `${Math.floor((combatEngineRef.current.getState()?.difficultyModifier || 1.0) * 100)}%` 
          : '100%'}</div>
        <div>Wave: {combatEngineRef.current?.getState()?.waveCount || 0}</div>
        {battlefieldError && <div style={{ color: '#ef4444', marginTop: '4px' }}>⚠️ Error: {battlefieldError.message}</div>}
      </div>
      */}
      
      {/* Test Element - COMMENTED OUT FOR PRODUCTION */}
      {/* 
      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '14px',
        zIndex: 9999,
        pointerEvents: 'none',
        border: '2px solid white'
      }}>
        Page Loaded ✅
      </div>
      */}

      {/* Test Combat Button - COMMENTED OUT FOR PRODUCTION */}
      {/* 
      <button
        onClick={() => {
          // Stop existing combat if running
          if (combatEngineRef.current) {
            combatEngineRef.current.stopCombat();
            combatEngineRef.current.stopAdventure();
            combatEngineRef.current = null;
          }
          
          // Setup test combat
          const { heroes, enemies } = setupTestCombat();
          setTestHeroes(heroes);
          setLocalGeneratedEnemies(enemies);
          setUseTestCombat(true);
          hasGeneratedEnemiesRef.current = true;
          lastHeroKeyRef.current = heroes.map(h => `${h.id}:${h.level}`).sort().join(',');
          
          // Clear selected hero IDs so all test heroes show
          setSelectedHeroIds(new Set());
          
          console.log('🎮 Test combat initialized:', { 
            heroes: heroes.map(h => `${h.name} (${h.role}, Lv${h.level})`), 
            enemies: enemies.map(e => `${e.name} (Lv${e.level})`) 
          });
          
          // Combat engine will restart automatically when displayHeroes changes
          // The useEffect that initializes combat will pick up the new test heroes
          // No need to reload - React will re-render with new heroes
        }}
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          backgroundColor: useTestCombat ? '#10b981' : '#3b82f6',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          border: 'none',
          cursor: 'pointer',
          zIndex: 1000,
          fontSize: '0.875rem',
          fontWeight: 'bold',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
        }}
      >
        {useTestCombat ? '✓ Test Combat Active' : '🎮 Start Test Combat'}
      </button>
      */}

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

      {/* Quest Progress Display */}
      {questProgress.length > 0 && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '8px',
          fontSize: '14px',
          zIndex: 1000,
          border: '2px solid rgba(255, 255, 255, 0.3)',
          maxWidth: '400px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>📋 Active Quests</div>
          {questProgress.map(quest => {
            const progressPercent = Math.min(100, (quest.progress / quest.target) * 100);
            return (
              <div key={quest.questId} style={{ marginBottom: '4px' }}>
                <div style={{ fontSize: '12px', marginBottom: '2px' }}>{quest.questName}</div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${progressPercent}%`,
                    height: '100%',
                    backgroundColor: progressPercent >= 100 ? '#10b981' : '#3b82f6',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>
                  {quest.progress} / {quest.target}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Gathering Notifications */}
      {gatheringNotifications.length > 0 && gatheringNotifications.map((notif, idx) => {
        const age = Date.now() - notif.timestamp;
        const opacity = Math.max(0, 1 - (age / 5000)); // Fade out over 5 seconds
        if (opacity <= 0) return null;
        
        return (
          <div
            key={`gathering-${notif.timestamp}-${idx}`}
            style={{
              position: 'absolute',
              top: `${100 + idx * 60}px`,
              right: '20px',
              backgroundColor: `rgba(34, 197, 94, ${0.8 * opacity})`,
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              zIndex: 1000,
              border: '2px solid rgba(255, 255, 255, 0.3)',
              opacity: opacity,
              transform: `translateY(${(1 - opacity) * 20}px)`,
              transition: 'opacity 0.3s ease, transform 0.3s ease'
            }}
          >
            🌿 {notif.heroName} gathered: {notif.material} x{notif.amount}
          </div>
        );
      })}

      {/* NPC Encounter Display */}
      {npcEncounter && Date.now() < npcEncounter.expiresAt && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(139, 92, 246, 0.9)',
          color: 'white',
          padding: '20px 40px',
          borderRadius: '12px',
          fontSize: '24px',
          fontWeight: 'bold',
          zIndex: 2000,
          border: '3px solid rgba(255, 255, 255, 0.5)',
          textShadow: '0 0 8px rgba(0, 0, 0, 0.8)',
          textAlign: 'center'
        }}>
          🧙 You encounter a traveling {npcEncounter.name}!
        </div>
      )}

      {/* Wave Counter Display */}
      {(() => {
        const waveCount = combatEngineRef.current?.getState()?.waveCount || (battlefieldState as any)?.waveCount || 0;
        return (
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: 'bold',
            zIndex: 1000,
            border: '2px solid rgba(255, 255, 255, 0.3)',
            textShadow: '0 0 8px rgba(0, 0, 0, 0.8)'
          }}>
            🌊 Wave {waveCount}
          </div>
        );
      })()}

      {/* Difficulty Indicator */}
      {(() => {
        const difficultyModifier = combatEngineRef.current?.getState()?.difficultyModifier || (battlefieldState as any)?.difficultyModifier || 1.0;
        const difficultyPercent = Math.floor(difficultyModifier * 100);
        const getDifficultyColor = () => {
          if (difficultyPercent <= 100) return '#10b981'; // Green for normal/easy
          if (difficultyPercent <= 150) return '#fbbf24'; // Yellow for moderate
          if (difficultyPercent <= 200) return '#f97316'; // Orange for hard
          return '#ef4444'; // Red for very hard
        };
        return (
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '180px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            zIndex: 1000,
            border: `2px solid ${getDifficultyColor()}`,
            textShadow: '0 0 8px rgba(0, 0, 0, 0.8)'
          }}>
            <span style={{ color: getDifficultyColor() }}>⚡ Difficulty: {difficultyPercent}%</span>
          </div>
        );
      })()}

      {/* Viewer Benefits Display */}
      {battlefieldState && (battlefieldState as any).viewerCount !== undefined && (
        <div style={{
          position: 'absolute',
          top: '80px',
          right: '20px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 'bold',
          zIndex: 1000,
          border: '2px solid rgba(255, 255, 255, 0.3)',
          textShadow: '0 0 8px rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div>👥 Viewers: {(battlefieldState as any).viewerCount || 0}</div>
          {(() => {
            const viewerCount = (battlefieldState as any).viewerCount || 0;
            const damageBonus = Math.min(50, Math.floor(viewerCount / 2)); // +1% per 2 viewers, max 50%
            const healingBonus = Math.min(50, Math.floor(viewerCount / 2));
            const defenseBonus = Math.min(50, Math.floor(viewerCount / 2));
            return (
              <>
                <div style={{ color: '#ef4444' }}>⚔️ +{damageBonus}% Damage</div>
                <div style={{ color: '#10b981' }}>💚 +{healingBonus}% Healing</div>
                <div style={{ color: '#3b82f6' }}>🛡️ +{defenseBonus}% Defense</div>
              </>
            );
          })()}
        </div>
      )}

      {/* Error Display */}
      {battlefieldError && (
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          backgroundColor: 'rgba(220, 38, 38, 0.9)',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          zIndex: 1000,
          fontSize: '0.875rem'
        }}>
          Error: {battlefieldError}
        </div>
      )}

      {/* Test Panel */}
      <TestPanel
        heroes={(() => {
          if (!combatEngineRef.current) return [];
          const state = combatEngineRef.current.getState();
          const heroes = state.heroes;
          if (Array.isArray(heroes)) return heroes as Hero[];
          if (heroes instanceof Map) return Array.from(heroes.values()) as Hero[];
          return Object.values(heroes || {}) as Hero[];
        })()}
        enemies={(() => {
          if (!combatEngineRef.current) return [];
          const state = combatEngineRef.current.getState();
          return (state.currentEnemies || []) as Enemy[];
        })()}
        combatEngine={combatEngineRef.current || undefined}
      />
    </div>
  );
}
