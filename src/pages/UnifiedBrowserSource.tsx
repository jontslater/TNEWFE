/**
 * Unified Browser Source
 * Clean foundation for: Idle Adventure → Dungeon → Raid → Idle Adventure
 * 
 * Features:
 * - Starts in idle adventure mode
 * - Smooth transitions between modes
 * - Automatic combat when enemies appear
 * - Continuous adventure loop
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useBattlefieldListener } from '../hooks/useBattlefieldListener';
import { useWebSocket } from '../hooks/useWebSocket';
import HeroSpriteJS from '../components/HeroSpriteJS';
import EnemySprite from '../components/EnemySpriteJS';
import { FullCombatEngine, CombatState } from '../utils/fullCombatEngine';
import { Hero, Enemy } from '../utils/combat/types';
import { showScrollingCombatText } from '../utils/combatText';
import { updateHeroBuffDisplay, updateHeroDebuffDisplay, updateEnemyDebuffDisplay } from '../utils/updateBuffDebuffDisplay';
import { battlefieldAPI, heroAPI } from '../api/client';

type GameMode = 'idle' | 'dungeon' | 'raid';

export default function UnifiedBrowserSource() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [gameMode, setGameMode] = useState<GameMode>('idle');
  
  // Get battlefieldId from URL params (same as BrowserSourcePage)
  const urlBattlefieldId = searchParams.get('battlefieldId');
  const [battlefieldId, setBattlefieldId] = useState<string | null>(null);
  const [isConvertingBattlefieldId, setIsConvertingBattlefieldId] = useState(false);
  
  // Convert battlefield ID from username format to numeric format
  // This ensures compatibility with backend which now uses numeric IDs
  useEffect(() => {
    const convertBattlefieldId = async () => {
      let targetBattlefieldId = urlBattlefieldId;
      
      // If no URL param, use user's twitchId
      if (!targetBattlefieldId && user?.twitchId) {
        targetBattlefieldId = `twitch:${user.twitchId}`;
      }
      
      if (!targetBattlefieldId) {
        setBattlefieldId(null);
        return;
      }
      
      // Check if it's in format twitch:username (non-numeric)
      if (targetBattlefieldId.startsWith('twitch:')) {
        const identifier = targetBattlefieldId.replace('twitch:', '');
        
        // If it's already numeric, use it directly
        if (/^\d+$/.test(identifier)) {
          console.log(`[Battlefield ID] Already numeric format: ${targetBattlefieldId}`);
          setBattlefieldId(targetBattlefieldId);
          return;
        }
        
        // It's a username - need to convert to numeric ID
        console.log(`[Battlefield ID] Converting username format to numeric: ${targetBattlefieldId}`);
        setIsConvertingBattlefieldId(true);
        
        try {
          // Look up streamer's numeric Twitch ID from their hero document
          const { collection, query, where, getDocs } = await import('firebase/firestore');
          const { db } = await import('../utils/firebase');
          
          const heroesQuery = query(
            collection(db, 'heroes'),
            where('twitchUsername', '==', identifier.toLowerCase())
          );
          
          const snapshot = await getDocs(heroesQuery);
          
          if (!snapshot.empty) {
            // Found streamer's hero - get their numeric Twitch ID
            const streamerHero = snapshot.docs[0].data();
            const numericTwitchId = streamerHero.twitchUserId || streamerHero.twitchId;
            
            if (numericTwitchId) {
              const numericBattlefieldId = `twitch:${numericTwitchId}`;
              console.log(`✅ [Battlefield ID] Converted ${targetBattlefieldId} → ${numericBattlefieldId}`);
              setBattlefieldId(numericBattlefieldId);
              setIsConvertingBattlefieldId(false);
              return;
            }
          }
          
          // Couldn't find numeric ID - use username format as fallback
          console.warn(`⚠️ [Battlefield ID] Could not find numeric ID for ${identifier}, using username format`);
          console.warn(`   New heroes will use numeric format and won't appear until streamer logs in`);
          setBattlefieldId(targetBattlefieldId);
          setIsConvertingBattlefieldId(false);
        } catch (error) {
          console.error(`❌ [Battlefield ID] Error converting battlefield ID:`, error);
          // Fallback to username format
          setBattlefieldId(targetBattlefieldId);
          setIsConvertingBattlefieldId(false);
        }
      } else {
        // Not a twitch battlefield ID
        setBattlefieldId(targetBattlefieldId);
      }
    };
    
    convertBattlefieldId();
  }, [urlBattlefieldId, user?.twitchId]);
  
  // Get battlefield state from Firebase
  const { battlefieldState, loading: battlefieldLoading } = useBattlefieldListener(battlefieldId);
  
  // Show loading while converting battlefield ID
  const isLoading = battlefieldLoading || isConvertingBattlefieldId;
  
  // Combat engine ref
  const combatEngineRef = useRef<FullCombatEngine | null>(null);
  
  // Hero and enemy state
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  
  // Track heroes that have joined via WebSocket (for immediate display before Firebase updates)
  // NOTE: !join immediately updates Firebase, so pending heroes are only needed briefly
  // We don't persist this - Firebase is the source of truth and updates immediately
  const [pendingJoinedHeroes, setPendingJoinedHeroes] = useState<Map<string, Hero>>(new Map());
  
  // Track heroes that have left (for immediate removal)
  // Persist in localStorage keyed by battlefieldId so it survives refresh
  const [removedHeroIds, setRemovedHeroIds] = useState<Set<string>>(() => {
    if (!battlefieldId) return new Set();
    try {
      const saved = localStorage.getItem(`removedHeroIds_${battlefieldId}`);
      if (saved) {
        return new Set(JSON.parse(saved));
      }
    } catch (e) {
      // Ignore parse errors
    }
    return new Set();
  });
  
  // Clean up old localStorage keys on mount (one-time cleanup)
  useEffect(() => {
    try {
      const keysToRemove: string[] = [];
      
      // Find all old removedHeroIds keys with wrong format
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('removedHeroIds_twitch:')) {
          // Check if it's using old format (username or hero ID instead of numeric)
          const battlefieldPart = key.replace('removedHeroIds_twitch:', '');
          
          // If it's NOT numeric (and not the current battlefield), mark for removal
          if (!/^\d+$/.test(battlefieldPart) && key !== `removedHeroIds_${battlefieldId}`) {
            keysToRemove.push(key);
          }
        }
      }
      
      // Remove old keys
      if (keysToRemove.length > 0) {
        console.log(`[Cleanup] Removing ${keysToRemove.length} old localStorage keys:`, keysToRemove);
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
    } catch (e) {
      console.warn('[Cleanup] Failed to clean localStorage:', e);
    }
  }, []); // Run once on mount
  
  // Save removedHeroIds to localStorage whenever it changes
  useEffect(() => {
    if (!battlefieldId) return;
    try {
      localStorage.setItem(`removedHeroIds_${battlefieldId}`, JSON.stringify(Array.from(removedHeroIds)));
    } catch (e) {
      // Ignore storage errors (quota exceeded, etc.)
    }
  }, [removedHeroIds, battlefieldId]);
  
  // Streamer Twitch ID for WebSocket connection
  const [streamerTwitchId, setStreamerTwitchId] = useState<string | null>(null);
  
  // Facing direction preferences - loaded from backend for consistency across all users
  const [facingPreferences, setFacingPreferences] = useState<Record<string, 'left' | 'right'>>({});
  
  // Animation states
  const [heroAnimations, setHeroAnimations] = useState<Record<string, 'idle' | 'attack' | 'hurt' | 'death'>>({});
  const [enemyAnimations, setEnemyAnimations] = useState<Record<string, 'idle' | 'attack' | 'hurt' | 'death'>>({});
  
  // Local combat state (HP, shields, buffs/debuffs)
  const [localCombatState, setLocalCombatState] = useState<{
    heroHp: Record<string, number>;
    enemyHp: Record<string, number>;
    heroShield: Record<string, number>;
    heroBuffs: Record<string, Array<{ icon: string; name: string; timeLeft: number | string }>>;
    heroDebuffs: Record<string, Array<{ icon: string; name: string; timeLeft: number }>>;
    enemyDebuffs: Record<string, Array<{ icon: string; name: string; timeLeft: number }>>;
  }>({
    heroHp: {},
    enemyHp: {},
    heroShield: {},
    heroBuffs: {},
    heroDebuffs: {},
    enemyDebuffs: {}
  });

  // Look up streamer's numeric Twitch ID from battlefieldId for WebSocket connection
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

  // Load facing preferences from backend (consistent for all users viewing this browser source)
  // Also load removedHeroIds from localStorage on mount
  useEffect(() => {
    const loadFacingPreferences = async () => {
      if (!user?.id) return;
      
      try {
        const prefs = await battlefieldAPI.getSpriteFacingPreferences(user.id);
        setFacingPreferences(prefs || {});
      } catch (error) {
        console.error('Failed to load sprite facing preferences:', error);
        // Fallback to default (right-facing)
        setFacingPreferences({});
      }
    };
    
    loadFacingPreferences();
    
    // Load removedHeroIds and pendingJoinedHeroes from localStorage when battlefieldId changes
    // CRITICAL: Clean up conflicts - heroes in removedHeroIds should not be in pendingJoinedHeroes
    if (battlefieldId) {
      try {
        const savedRemoved = localStorage.getItem(`removedHeroIds_${battlefieldId}`);
        const removedSet = savedRemoved ? new Set(JSON.parse(savedRemoved)) : new Set<string>();
        
        if (savedRemoved) {
          setRemovedHeroIds(removedSet);
        }
        
        // NOTE: pendingJoinedHeroes is not persisted - Firebase updates immediately on !join
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [user?.id, battlefieldId]);

  const effectiveTwitchId = searchParams.get('twitchId') || streamerTwitchId || user?.twitchId || null;

  // Helper function to convert Hero from WebSocket to Hero format
  const convertHeroToDisplay = useCallback((hero: any): Hero => {
    const hp = Math.floor(hero.hp || hero.maxHp || 100);
    const maxHp = Math.floor(hero.maxHp || 100);
    
    return {
      id: hero.id || `hero-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      username: hero.username || hero.twitchUsername || hero.name || hero.characterName || 'Unknown Hero',
      role: hero.role,
      level: hero.level || 1,
      xp: hero.xp || 0,
      maxXp: hero.maxXp || 100,
      hp: hp,
      maxHp: maxHp,
      attack: hero.attack || 0,
      defense: hero.defense || 0,
      equipment: hero.equipment || {},
      activeBuffs: hero.activeBuffs || {},
      activeDebuffs: hero.activeDebuffs || {},
      cooldowns: hero.cooldowns || {},
      skills: hero.skills || {},
      skillPoints: hero.skillPoints || 0,
      gold: hero.gold || 0,
      tokens: hero.tokens || 0,
      twitchUserId: hero.twitchUserId,
      name: hero.name,
      characterName: hero.characterName
    } as Hero;
  }, []);

  // Track recent messages to deduplicate (backend sometimes sends duplicates)
  const recentMessages = useRef<Map<string, number>>(new Map());
  
  // Handle WebSocket messages for !join and !leave commands
  const handleWebSocketMessage = useCallback((message: any) => {
    // Deduplicate messages - ignore if we've seen this exact message in the last 2 seconds
    const messageKey = `${message.type}_${message.hero?.id || ''}_${message.timestamp || 0}`;
    const now = Date.now();
    const lastSeen = recentMessages.current.get(messageKey);
    
    if (lastSeen && (now - lastSeen) < 2000) {
      return; // Duplicate message - ignore
    }
    
    recentMessages.current.set(messageKey, now);
    
    // Clean up old messages (keep last 50)
    if (recentMessages.current.size > 50) {
      const sorted = Array.from(recentMessages.current.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 50);
      recentMessages.current = new Map(sorted);
    }

    if (message.type === 'hero_joined' || message.type === 'hero_joined_battlefield') {
      const hero = message.hero;
      if (hero?.id) {
        const heroIdStr = String(hero.id);
        console.log(`[Join] Processing hero_joined for hero ID: ${heroIdStr}`);
        
        // Convert hero first
        const convertedHero = convertHeroToDisplay(hero);
        if (!convertedHero) {
          console.warn(`[Join] Failed to convert hero ${heroIdStr} to display format`);
          return;
        }
        
        // CRITICAL: Use flushSync to ensure immediate synchronous updates
        // Remove from removedHeroIds AND add to pendingJoinedHeroes at the same time
        flushSync(() => {
          // Remove from removed list first - this allows them to show up
          setRemovedHeroIds(prev => {
            const next = new Set(prev);
            const wasRemoved = next.has(heroIdStr);
            next.delete(heroIdStr);
            if (wasRemoved) {
              console.log(`[Join] Removed hero ${heroIdStr} from removedHeroIds`);
            }
            return next;
          });
          
          // Add to pending heroes for immediate display
          setPendingJoinedHeroes(prev => {
            const next = new Map(prev);
            next.set(heroIdStr, convertedHero);
            console.log(`[Join] Added hero ${heroIdStr} to pendingJoinedHeroes. Total pending: ${next.size}`);
            return next;
          });
        });
      } else {
        console.warn(`[Join] Received hero_joined but hero.id is missing:`, message.hero);
      }
    } else if (message.type === 'hero_left_battlefield') {
      const heroDocId = message.hero?.id;
      if (heroDocId) {
        const heroIdStr = String(heroDocId);
        const heroName = message.hero?.name || message.hero?.username || 'Unknown';
        
        console.log(`[Leave] Processing hero_left_battlefield for hero ID: ${heroIdStr} (${heroName})`);
        
        // CRITICAL: Only add to removedHeroIds if this hero is actually leaving this battlefield
        // Check if the message is for this battlefield (not a different battlefield)
        const newBattlefieldId = message.newBattlefieldId;
        if (newBattlefieldId && newBattlefieldId === battlefieldId) {
          console.log(`[Leave] Hero ${heroIdStr} is moving to THIS battlefield, not actually leaving. Skipping removal.`);
          return; // Hero is joining this battlefield, don't remove them
        }
        
        // CRITICAL: Use flushSync to ensure immediate synchronous update
        // This makes the hero disappear immediately, not on next render
        flushSync(() => {
          // Remove from pending heroes
          setPendingJoinedHeroes(prev => {
            if (!prev.has(heroIdStr)) return prev;
            const next = new Map(prev);
            next.delete(heroIdStr);
            console.log(`[Leave] Removed hero ${heroIdStr} from pendingJoinedHeroes`);
            return next;
          });
          
          // CRITICAL: Add to removed heroes - this will persist via localStorage
          setRemovedHeroIds(prev => {
            if (prev.has(heroIdStr)) {
              console.log(`[Leave] Hero ${heroIdStr} already in removedHeroIds`);
              return prev; // Already removed
            }
            const next = new Set(prev);
            next.add(heroIdStr);
            console.log(`[Leave] Added hero ${heroIdStr} (${heroName}) to removedHeroIds. Total removed: ${next.size}`);
            console.log(`[Leave] All removed hero IDs:`, Array.from(next));
            return next;
          });
        });
      } else {
        console.warn(`[Leave] Received hero_left_battlefield but hero.id is missing:`, message.hero);
      }
    }
  }, [convertHeroToDisplay]);

  // Connect to WebSocket for real-time join/leave updates
  useWebSocket(effectiveTwitchId, handleWebSocketMessage);

  // Extract heroes from battlefield state and merge with pending heroes
  const firebaseHeroes = useMemo(() => {
    if (!battlefieldState?.heroes) return [];
    return Object.values(battlefieldState.heroes) as Hero[];
  }, [battlefieldState?.heroes]);

  // Track pending sync operations to prevent duplicate calls
  const pendingSyncs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  // Sync hero progress to backend/Firebase with debouncing
  const syncHeroToBackend = useCallback(async (hero: Hero) => {
    try {
      // Only sync heroes that have a valid ID (real heroes from Firebase, not test heroes)
      // Skip heroes with test IDs or auto-generated IDs
      if (!hero.id || hero.id.startsWith('test-') || hero.id.startsWith('hero-')) {
        return; // Skip test heroes
      }

      const heroId = hero.id;
      
      // CRITICAL: Debounce sync calls - cancel any pending sync for this hero
      // This prevents spamming the backend with multiple updates for the same hero
      if (pendingSyncs.current.has(heroId)) {
        clearTimeout(pendingSyncs.current.get(heroId)!);
      }
      
      // Schedule sync with 5 second debounce - batches multiple rapid changes and prevents spam
      const timeoutId = setTimeout(async () => {
        try {
          // Sync hero progress: XP, level, gold, HP, stats, equipment, etc.
          await heroAPI.updateHero(heroId, {
            xp: hero.xp,
            level: hero.level,
            maxXp: hero.maxXp,
            gold: hero.gold,
            tokens: hero.tokens,
            hp: hero.hp,
            maxHp: hero.maxHp,
            attack: hero.attack,
            defense: hero.defense,
            skillPoints: hero.skillPoints,
            equipment: hero.equipment,
            // Include stats if they exist
            stats: hero.stats,
            // Include active buffs/debuffs if needed for persistence
            activeBuffs: hero.activeBuffs,
            activeDebuffs: hero.activeDebuffs,
          });
        } catch (error: any) {
          // Log 404 errors (hero doesn't exist in database) - helps identify stale battlefield data
          if (error?.response?.status === 404) {
            console.warn(`⚠️ [Sync] Hero ${heroId} (${hero.username || hero.name}) not found in database - may be deleted. Removing from combat engine.`);
            
            // CRITICAL: Remove this hero from combat engine to stop 404 spam
            // This hero was deleted or never existed, no point trying to sync it again
            if (combatEngineRef.current) {
              const engine = combatEngineRef.current;
              
              // Remove from combat engine's hero map
              if (engine.state.heroes.has(heroId)) {
                engine.state.heroes.delete(heroId);
                console.log(`✅ [Sync] Removed hero ${heroId} from combat engine`);
              }
              
              // Also update React state to remove from display
              setHeroes(prev => prev.filter(h => h.id !== heroId));
            }
          } else {
            // Log other errors for debugging
            console.error(`❌ [Sync] Failed to sync hero ${heroId}:`, error?.message || error);
          }
        } finally {
          // Clean up pending sync tracking
          pendingSyncs.current.delete(heroId);
        }
      }, 5000); // 5 second debounce - prevents backend spam
      
      // Track this pending sync
      pendingSyncs.current.set(heroId, timeoutId);
    } catch (error) {
      // Silently fail
    }
  }, []);

  // Clean up temporary states when Firebase updates
  // Firebase is the source of truth - client states only override stale Firebase data
  useEffect(() => {
    // Remove pending heroes once Firebase confirms they're in the battlefield
    if (pendingJoinedHeroes.size > 0) {
      setPendingJoinedHeroes(prev => {
        const next = new Map(prev);
        let changed = false;
        
        // Remove pending heroes that are now in Firebase (Firebase caught up)
        firebaseHeroes.forEach(hero => {
          if (hero.id && next.has(String(hero.id))) {
            next.delete(String(hero.id));
            changed = true;
            console.log(`[Sync] Hero ${hero.id} now in Firebase - removed from pendingJoinedHeroes`);
          }
        });
        
        // Remove pending heroes that are in removedHeroIds (they left, don't show them)
        removedHeroIds.forEach(removedId => {
          if (next.has(removedId)) {
            next.delete(removedId);
            changed = true;
            console.log(`[Sync] Hero ${removedId} in removedHeroIds - removed from pendingJoinedHeroes`);
          }
        });
        
        return changed ? next : prev;
      });
    }
    
    // CRITICAL: Clear removedHeroIds if heroes are actually in Firebase
    // This fixes the issue where heroes get stuck in removedHeroIds incorrectly
    // If a hero is in Firebase with correct battlefieldId, they should be shown
    if (removedHeroIds.size > 0 && firebaseHeroes.length > 0) {
      setRemovedHeroIds(prev => {
        const next = new Set(prev);
        let changed = false;
        
        // Check each removed hero ID
        prev.forEach(removedId => {
          // If this hero is in Firebase for this battlefield, remove from removedHeroIds
          const heroInFirebase = firebaseHeroes.find(h => String(h.id) === removedId);
          if (heroInFirebase) {
            next.delete(removedId);
            changed = true;
            console.log(`[Sync] Hero ${removedId} (${heroInFirebase.name}) is in Firebase - clearing from removedHeroIds`);
          }
        });
        
        return changed ? next : prev;
      });
    }
  }, [firebaseHeroes, pendingJoinedHeroes.size, removedHeroIds, battlefieldId]);

  // Combine heroes: Firebase is source of truth, pending/removed are temporary until Firebase updates
  const allHeroes = useMemo(() => {
    // Firebase heroes are the source of truth - always include them
    const firebaseHeroIds = new Set(firebaseHeroes.map(h => String(h.id)));
    
    // Add pending heroes that aren't in Firebase yet (waiting for Firebase to update)
    const pendingHeroesArray = Array.from(pendingJoinedHeroes.values()).filter(pendingHero => {
      const heroIdStr = String(pendingHero.id);
      // Only include if:
      // 1. Not already in Firebase (Firebase will catch up)
      // 2. Not in removedHeroIds (they left)
      return !firebaseHeroIds.has(heroIdStr) && !removedHeroIds.has(heroIdStr);
    });
    
    // Combine: Firebase heroes + pending heroes (Firebase takes precedence)
    return [...firebaseHeroes, ...pendingHeroesArray];
  }, [firebaseHeroes, pendingJoinedHeroes, removedHeroIds]);

  // Filter heroes for display
  // CRITICAL: removedHeroIds takes precedence - if a hero is in removedHeroIds, hide them immediately
  // This ensures !leave works immediately even if Firebase still has stale data
  const displayHeroes = useMemo(() => {
    const seenIds = new Set<string>();
    const uniqueHeroes: Hero[] = [];
    const filteredOutHeroes: Array<{id: string, name: string, reason: string}> = [];
    
    // First, filter and add Firebase heroes (source of truth)
    // BUT: Exclude heroes in removedHeroIds immediately
    firebaseHeroes.forEach(hero => {
      if (!hero.id) return;
      const heroIdStr = String(hero.id);
      const heroName = hero.name || hero.username || 'Unknown';
      
      // CRITICAL: Skip heroes in removedHeroIds immediately (don't even add them)
      if (removedHeroIds.has(heroIdStr)) {
        filteredOutHeroes.push({id: heroIdStr, name: heroName, reason: 'in removedHeroIds'});
        return; // Skip this hero - they left
      }
      
      // Additional safety: Verify hero's currentBattlefieldId matches
      if (battlefieldId && hero.currentBattlefieldId && hero.currentBattlefieldId !== battlefieldId) {
        filteredOutHeroes.push({id: heroIdStr, name: heroName, reason: `wrong battlefield (has: ${hero.currentBattlefieldId}, expected: ${battlefieldId})`});
        return; // Skip heroes not in this battlefield
      }
      
      if (!seenIds.has(heroIdStr)) {
        seenIds.add(heroIdStr);
        uniqueHeroes.push(hero);
      }
    });
    
    // Then, add pending heroes that aren't in Firebase yet and not removed
    pendingJoinedHeroes.forEach((pendingHero, heroIdStr) => {
      const heroName = pendingHero.name || pendingHero.username || 'Unknown';
      
      // Skip if already seen or if removed
      if (seenIds.has(heroIdStr)) {
        return;
      }
      if (removedHeroIds.has(heroIdStr)) {
        filteredOutHeroes.push({id: heroIdStr, name: heroName, reason: 'pending but in removedHeroIds'});
        return;
      }
      
      seenIds.add(heroIdStr);
      uniqueHeroes.push(pendingHero);
    });
    
    // Log filtering for debugging
    if (filteredOutHeroes.length > 0) {
      console.log(`[Display] Filtered out ${filteredOutHeroes.length} heroes:`, filteredOutHeroes);
    }
    if (uniqueHeroes.length > 0) {
      console.log(`[Display] Showing ${uniqueHeroes.length} heroes:`, uniqueHeroes.map(h => `${h.name} (${h.id})`));
    }
    
    return uniqueHeroes;
  }, [firebaseHeroes, pendingJoinedHeroes, removedHeroIds, battlefieldId]);

  // Extract enemies from Firebase battlefield state (MMO - all clients see same enemies)
  const displayEnemies = useMemo(() => {
    if (!battlefieldState?.enemies) return [];
    const firebaseEnemies = Object.values(battlefieldState.enemies) as Enemy[];
    console.log(`[Enemies] Loaded ${firebaseEnemies.length} enemies from Firebase battlefield state`);
    return firebaseEnemies;
  }, [battlefieldState?.enemies]);

  // Initialize/update combat engine when heroes change (including when heroes are removed)
  // CRITICAL: This effect runs whenever displayHeroes changes, including when heroes are removed
  useEffect(() => {
    // Clean up existing engine when heroes change
    if (combatEngineRef.current) {
      combatEngineRef.current.stopCombat();
      combatEngineRef.current.stopAdventure();
      combatEngineRef.current = null;
    }

    // If no heroes, don't create engine (but allow combat to continue if enemies exist)
    if (displayHeroes.length === 0) {
      return;
    }

    // Create combat state for idle adventure mode
    const combatState: CombatState = {
      heroes: displayHeroes,
      currentEnemies: displayEnemies,
      inCombat: displayEnemies.length > 0,
      isPaused: false,
      editModePausedCombat: false,
      combatAnimationActive: true,
      waveCount: battlefieldState?.waveCount || 1,
      isAdventuring: false,
      viewerCount: battlefieldState?.viewerCount || 0,
      difficultyModifier: battlefieldState?.difficultyModifier || 1.0
    };

    // Create combat engine
    const combatEngine = new FullCombatEngine(combatState);

    // Set up animation callback
    combatEngine.onAnimation((entityId, animation, isHero) => {
      if (isHero) {
        setHeroAnimations(prev => ({
          ...prev,
          [entityId]: animation as 'idle' | 'attack' | 'hurt' | 'death'
        }));
      } else {
        setEnemyAnimations(prev => ({
          ...prev,
          [entityId]: animation as 'idle' | 'attack' | 'hurt' | 'death'
        }));
      }
    });

    // Set up combat text callback
    combatEngine.onCombatText((entityId, amount, type, isHero) => {
      showScrollingCombatText(entityId, amount, type, isHero);
    });

    // Set up log callback - detect level-ups and rewards for immediate sync
    combatEngine.onLog((type, message) => {
      // Detect level-ups and rewards to sync immediately
      if (type === 'success' || type === 'loot') {
        // Level-up or reward - sync heroes after a short delay (allow batching)
        setTimeout(() => {
          if (!combatEngineRef.current) return;
          
          // Get updated heroes from combat engine (with latest stats)
          const state = combatEngineRef.current.getState();
          const combatHeroes = state.heroes;
          let combatHeroesArray: Hero[] = [];
          
          if (Array.isArray(combatHeroes)) {
            combatHeroesArray = combatHeroes;
          } else if (combatHeroes instanceof Map) {
            combatHeroesArray = Array.from(combatHeroes.values());
          } else if (typeof combatHeroes === 'object') {
            combatHeroesArray = Object.values(combatHeroes);
          }
          
          // Match combat engine heroes to displayHeroes to get correct Firebase IDs
          const heroesToSync = combatHeroesArray
            .filter(h => h && h.id && !h.id.startsWith('test-') && !h.id.startsWith('hero-'))
            .map(combatHero => {
              // Find matching Firebase hero by name or twitchUserId (IDs might not match)
              const firebaseHero = displayHeroes.find(fh => 
                fh.id === combatHero.id ||
                (fh.name && fh.name === combatHero.name) ||
                (fh.twitchUserId && fh.twitchUserId === combatHero.twitchUserId)
              );
              
              if (firebaseHero) {
                // Merge: use Firebase ID but combat engine stats
                return { ...combatHero, id: firebaseHero.id };
              }
              
              return combatHero; // Fallback
            })
            .filter(h => h && h.id);
          
          if (heroesToSync.length > 0) {
            heroesToSync.forEach(hero => syncHeroToBackend(hero));
          }
        }, 2000); // 2 second delay to allow batching
      }
    });

    // Set up enemy generation callback
    combatEngine.setOnEnemiesGenerated((newEnemies) => {
      setEnemies(newEnemies);
      // Update battlefield state if needed
    });

    // CRITICAL: Start adventure loop immediately - combat should start automatically
    combatEngine.startAdventure();

    // Start combat if enemies exist
    if (displayEnemies.length > 0) {
      combatEngine.startCombat();
    }

    combatEngineRef.current = combatEngine;

    // Cleanup on unmount
    return () => {
      if (combatEngineRef.current) {
        combatEngineRef.current.stopCombat();
        combatEngineRef.current.stopAdventure();
        combatEngineRef.current = null;
      }
    };
  }, [displayHeroes, displayEnemies, battlefieldState]);

  // Periodic sync to backend (every 60 seconds) - syncs all hero progress
  // Gets heroes from combat engine (has updated stats) and matches to Firebase IDs
  useEffect(() => {
    if (!combatEngineRef.current || displayHeroes.length === 0) return;

    const syncInterval = setInterval(() => {
      const engine = combatEngineRef.current;
      if (!engine) return;

      // Get heroes from combat engine (has updated stats)
      const state = engine.getState();
      const combatHeroes = state.heroes;
      let combatHeroesArray: Hero[] = [];
      
      if (Array.isArray(combatHeroes)) {
        combatHeroesArray = combatHeroes;
      } else if (combatHeroes instanceof Map) {
        combatHeroesArray = Array.from(combatHeroes.values());
      } else if (typeof combatHeroes === 'object') {
        combatHeroesArray = Object.values(combatHeroes);
      }

      // Match to Firebase heroes to get correct IDs
      const heroesToSync = combatHeroesArray
        .filter(h => h && h.id && !h.id.startsWith('test-') && !h.id.startsWith('hero-'))
        .map(combatHero => {
          // Match by ID first, then name, then twitchUserId
          const firebaseHero = displayHeroes.find(fh => 
            fh.id === combatHero.id ||
            (fh.name && fh.name === combatHero.name) ||
            (fh.twitchUserId && fh.twitchUserId === combatHero.twitchUserId)
          );
          
          // Use Firebase ID but keep combat engine stats
          return firebaseHero ? { ...combatHero, id: firebaseHero.id } : combatHero;
        })
        .filter(h => h && h.id);

      if (heroesToSync.length > 0) {
        heroesToSync.forEach(hero => syncHeroToBackend(hero));
      }
    }, 60000); // 60 seconds

    return () => clearInterval(syncInterval);
  }, [syncHeroToBackend, displayHeroes]);

  // NOTE: Removed automatic sync after combat rewards/level-ups
  // Sync is now handled by:
  // 1. Debounced syncHeroToBackend function (2 second debounce per hero)
  // 2. Periodic sync every 60 seconds (safety net)
  // 3. Log callback for level-ups/rewards (debounced internally)
  // This prevents duplicate sync calls and backend spam

  // Get facing direction helper (consistent across all users via backend preferences)
  const getFacingDirection = useCallback((roleOrEnemyName: string, defaultFacing: 'left' | 'right' = 'right'): 'left' | 'right' => {
    // First check user preferences (from backend)
    if (facingPreferences[roleOrEnemyName]) {
      return facingPreferences[roleOrEnemyName];
    }
    
    const normalized = roleOrEnemyName.toLowerCase();
    
    // Define roles that should face LEFT (opposite of default)
    const leftFacingRoles = [
      // HEALERS
      'cleric', 'atoner', 'druid', 'lightbringer', 'shaman', 'mistweaver', 'chronomancer', 'bard',
      // MELEE DPS
      'berserker', 'crusader', 'assassin', 'reaper', 'bladedancer', 'monk', 'stormwarrior', 'hunter'
    ];
    
    // Define enemy types that should face RIGHT (opposite of default)
    // Most enemies face left, but these specific ones face right
    const rightFacingEnemies = [
      'demon lord',
      'adult dragon',
      'baby dragon',
      'headless horseman',
      'masked orc',
      'witch'
    ];
    
    // Check if it's an enemy that should face right
    if (rightFacingEnemies.includes(normalized)) {
      return 'right';
    }
    
    // Check if role should face left
    if (leftFacingRoles.includes(normalized)) {
      return 'left';
    }
    
    // Default: TANKS and RANGED DPS face right, most enemies face left
    return defaultFacing;
  }, [facingPreferences]);

  // Handle mode transitions (placeholder for future implementation)
  const transitionToMode = (newMode: GameMode) => {
    if (gameMode === newMode) return;
    
    // Transition logic will be implemented here
    // For now, just switch modes
    setGameMode(newMode);
  };

  return (
    <div
      style={{
        width: '1920px',
        height: '1080px',
        position: 'relative',
        backgroundColor: '#0a0a0a',
        overflow: 'hidden'
      }}
      className="browser-source-page unified-browser-source"
    >
      {/* Game Mode Indicator (can be removed in production) */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          color: 'white',
          fontSize: '24px',
          fontWeight: 'bold',
          zIndex: 1000,
          padding: '10px 20px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          borderRadius: '8px'
        }}
      >
        Mode: {gameMode}
      </div>

      {/* Hero Sprites */}
      {displayHeroes.map((hero, index) => {
        const heroId = hero.id || hero.name || hero.characterName || hero.username || '';
        if (!heroId) return null;

        // Spread heroes horizontally for testing (will be replaced with proper layout later)
        // Arrange in a grid: 10 heroes per row
        const heroesPerRow = 10;
        const heroSpacing = 180; // Horizontal spacing between heroes
        const rowSpacing = 200; // Vertical spacing between rows
        const startX = 100;
        const startY = 200;
        
        const row = Math.floor(index / heroesPerRow);
        const col = index % heroesPerRow;
        const xPos = startX + (col * heroSpacing);
        const yPos = startY + (row * rowSpacing);

        return (
          <div
            key={heroId}
            id={`battle-hero-${heroId}`}
            style={{
              position: 'absolute',
              bottom: `${yPos}px`,
              left: `${xPos}px`,
              zIndex: 100
            }}
          >
            {/* Hero Buffs */}
            <div className="battle-buffs"></div>

            {/* Hero Sprite Container */}
            <HeroSpriteJS
              heroId={heroId}
              role={hero.role}
              facing={getFacingDirection(hero.role, 'right')}
              shield={localCombatState.heroShield[heroId] || (typeof hero.shield === 'object' ? hero.shield?.amount : hero.shield) || 0}
            />

            {/* Hero Debuffs */}
            <div className="battle-debuffs"></div>
          </div>
        );
      })}

      {/* Enemy Sprites */}
      {displayEnemies.map((enemy, enemyIndex) => {
        const enemyId = enemy.id;
        if (!enemyId) return null;

        // Calculate position to spread enemies horizontally across the screen
        // Similar to how heroes are positioned, but enemies are on the right side
        const totalEnemies = displayEnemies.length;
        const screenWidth = 1920;
        const screenHeight = 1080;
        
        // Spread enemies across the right side of the screen (50% to 95% width)
        // Start from 50% to leave room for heroes on the left, use more of the screen
        const startX = screenWidth * 0.45;
        const endX = screenWidth * 0.95;
        const xRange = endX - startX;
        
        // Calculate X position for this enemy with more spacing
        const xPos = totalEnemies > 1 
          ? startX + (enemyIndex / (totalEnemies - 1)) * xRange
          : startX + xRange / 2; // Center if only one enemy
        
        // Position enemies vertically at different heights to avoid overlap
        // Use wider vertical spacing and arrange in a grid
        const baseBottom = 150;
        const verticalSpacing = 120;
        const enemiesPerRow = 4; // Fewer per row = more horizontal spacing
        const row = Math.floor(enemyIndex / enemiesPerRow);
        const yPos = baseBottom + (row * verticalSpacing);

        return (
          <div
            key={enemyId}
            id={`battle-enemy-${enemyId}`}
            style={{
              position: 'absolute',
              bottom: `${yPos}px`,
              left: `${xPos}px`,
              transform: 'translateX(-50%)'
            }}
          >
            {/* Enemy Buffs */}
            <div className="battle-buffs"></div>

            {/* Enemy Sprite */}
            <EnemySprite
              enemyId={enemyId}
              enemyType={enemy.type || enemy.name || 'Imp'}
              enemyName={enemy.name || 'Enemy'}
              facing={getFacingDirection(enemy.type || enemy.name || 'Imp', 'left')}
              scale={enemy.type === 'Demon Lord' ? 5.0 : 2.5}
            />

            {/* Enemy Debuffs */}
            <div className="battle-debuffs"></div>
          </div>
        );
      })}
    </div>
  );
}
