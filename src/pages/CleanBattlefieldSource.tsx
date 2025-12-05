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

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { generateEnemiesForCombat } from '../utils/enemyGeneration';
import HeroSpriteJS from '../components/HeroSpriteJS';
import EnemySpriteJS from '../components/EnemySpriteJS';
import { battlefieldAPI, heroAPI, questAPI } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useActiveInstanceListener } from '../hooks/useActiveInstanceListener';
import { DEBUFFS, SHOP_ITEMS } from '../utils/fullCombatEngine';
import { generateLoot, isItemBetter, calculateItemPower } from '../utils/lootGeneration';
import { calculateSetBonuses } from '../utils/setBonuses';

// Hero type (with full gear support)
interface Hero {
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
  };
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
}

// Enemy type (minimal for now)
interface Enemy {
  id: string;
  name: string;
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
}

// Combat action type
interface CombatAction {
  type: 'hero' | 'enemy';
  actorId: string;
  actorName: string;
  targetId: string;
  targetName: string;
  initiative: number;
  isHero: boolean;
}

export default function CleanBattlefieldSource() {
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
  
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [heroes, setHeroes] = useState<Hero[]>([]); // Combat heroes (idle: all on battlefield, raid: participants only)
  const [loadedHeroes, setLoadedHeroes] = useState<Hero[]>([]); // ALL heroes loaded from Firebase (used to populate raid parties)
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [battlefieldId, setBattlefieldId] = useState<string | null>(null);
  const [waveCount, setWaveCount] = useState(1);
  const [inCombat, setInCombat] = useState(false);
  const [facingPreferences, setFacingPreferences] = useState<Record<string, 'left' | 'right'>>({});
  const [resurrectionTimers, setResurrectionTimers] = useState<Record<string, number>>({});
  const [difficultyModifier, setDifficultyModifier] = useState(1.0);
  const [consecutiveWins, setConsecutiveWins] = useState(0);
  const [testHealer, setTestHealer] = useState<Hero | null>(null);
  const [isTraveling, setIsTraveling] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);

  // MODE SWITCHING: Detect if hero is in dungeon/raid instance
  const [gameMode, setGameMode] = useState<'idle' | 'dungeon' | 'raid'>('idle');
  const [currentInstanceId, setCurrentInstanceId] = useState<string | null>(null);
  const [instanceData, setInstanceData] = useState<any>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [fadeOpacity, setFadeOpacity] = useState(1);
  const [showWaveAnnouncement, setShowWaveAnnouncement] = useState(false);
  
  // Listen for active instances (dungeons/raids)
  const { activeInstance, loading: instanceLoading } = useActiveInstanceListener(user?.twitchId || null);
  
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
        setInCombat(false); // Stop combat
        
        // CRITICAL: Don't clear heroes! They will reload from Firebase listener
        // The Firebase listener will pick up heroes when their currentBattlefieldId is set back
        console.log('[Mode] 🔄 Heroes will reload from Firebase when they rejoin battlefield');
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
          console.log(`[Mode] Instance data loaded:`, data);
          setInstanceData(data);
          
          // Check if completed
          if (data.status === 'completed' || data.status === 'failed') {
            console.log(`[Mode] ✅ Instance ${data.status}! Will return to idle when heroes update...`);
          }
        } else {
          console.warn(`[Mode] Instance ${instanceId} not found`);
        }
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
      const waveEnemyString = instanceData.waveEnemies?.[currentWave] || '';
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
          'Dragon Sentinel': { hp: 12000, attack: 200, defense: 120, xp: 1200, level: 44, type: 'Dragon_3' }
        };
        
        const stats = WAVE_STATS[trimmedName] || { hp: 5000, attack: 100, defense: 50, xp: 500, level: 40, type: 'Baby Dragon' };
        
        console.log(`[Raid Waves] Creating enemy "${trimmedName}" with stats:`, stats);
        
        raidEnemies.push({
          id: `wave-enemy-${currentWave}-${index}`,
          name: trimmedName,
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
      
      raidEnemies.push({
        id: 'raid-boss',
        name: instanceData.boss.name || 'Boss',
        level: instanceData.boss.level || 50,
        hp: instanceData.boss.hp,
        maxHp: instanceData.boss.maxHp,
        attack: instanceData.boss.attack || 100,
        defense: instanceData.boss.defense || 50,
        xp: instanceData.boss.xp || 1000,
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
    
    console.log(`[Raid Waves] ✅ Total enemies generated: ${raidEnemies.length}`, raidEnemies.map(e => e.name));
    
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

  // Quest tracking state (accumulate progress, batch sync to backend)
  const questProgressRef = useRef<Map<string, Map<string, number>>>(new Map()); // heroId -> trackingKey -> count
  const lastQuestSyncRef = useRef<number>(Date.now());

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
      const loadedHeroes = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || data.username || data.characterName || 'Hero',
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
          // CRITICAL: Include twitchUserId for quest sync
          twitchUserId: data.twitchUserId || data.twitchId,
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
          enchantedItems: data.enchantedItems || []
        } as Hero;
      });

      console.log(`[CleanBattlefield] ✅ Loaded ${loadedHeroes.length} heroes:`, loadedHeroes.map(h => `${h.name} (${h.role} Lv${h.level})`));
      
      // DEBUG: Log profession data for each hero
      loadedHeroes.forEach(h => {
        console.log(`[Debug] ${h.name} profession:`, h.profession || 'NONE');
        console.log(`[Debug] ${h.name} autoBuy:`, h.autoBuy || false);
        console.log(`[Debug] ${h.name} gold:`, h.gold || 0);
      });
      
      if (loadedHeroes.length === 0) {
        console.warn('[CleanBattlefield] ⚠️ No heroes found with currentBattlefieldId:', battlefieldId);
        console.warn('[CleanBattlefield] 💡 Heroes need to !join to set their currentBattlefieldId');
      }
      
      if (loadedHeroes.length > 2) {
        console.warn(`[CleanBattlefield] ⚠️ ${loadedHeroes.length} heroes found! Might be duplicates. Check Firebase.`);
      }
      
      // Calculate stats from equipment for each hero
      const heroesWithStats = loadedHeroes.map(calculateHeroStats);
      
      // DEDUPLICATE by hero ID (prevent duplicate renders!)
      const uniqueHeroes = heroesWithStats.filter((hero, index, self) => 
        index === self.findIndex(h => h.id === hero.id)
      );
      
      if (uniqueHeroes.length !== heroesWithStats.length) {
        console.warn(`[CleanBattlefield] ⚠️ Removed ${heroesWithStats.length - uniqueHeroes.length} duplicate heroes!`);
      }
      
      // ALWAYS store loaded heroes (used by raid setup to find actual hero data)
      setLoadedHeroes(uniqueHeroes);
      
      // Only set combat heroes in IDLE mode (raid mode populates heroes from participants)
      // CRITICAL: Don't update heroes during raid combat! (would reset raid party)
      if (gameMode === 'idle') {
        setHeroes(uniqueHeroes);
        heroesRef.current = uniqueHeroes; // Keep ref in sync
      } else if (gameMode === 'raid' || gameMode === 'dungeon') {
        console.log('[CleanBattlefield] ⏭️ Skipping hero state update - raid/dungeon in progress');
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

  // Load sprite facing preferences from backend
  useEffect(() => {
    if (!user?.id) return;

    battlefieldAPI.getSpriteFacingPreferences(user.id)
      .then(prefs => {
        console.log('[CleanBattlefield] Loaded facing preferences:', prefs);
        setFacingPreferences(prefs);
      })
      .catch(err => {
        console.warn('[CleanBattlefield] Could not load facing preferences:', err);
      });
  }, [user?.id]);

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
  const allHeroes = testHealer ? [...heroes, testHealer] : heroes;

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
      if (combatInProgress.current || enemiesRef.current.length > 0) {
        console.log('[Adventure] Skipping tick - combat in progress');
        return;
      }

      const currentWave = waveCount; // Capture current wave
      console.log(`[Adventure] Tick - Current wave: ${currentWave}, Interval ID: ${adventureIntervalRef.current}`);

      // Increment wave
      let nextWave = currentWave + 1;
      setWaveCount(nextWave);
      console.log(`[Adventure] Wave incremented: ${currentWave} → ${nextWave}`);
      
      const isBossWave = nextWave % 10 === 0;
      const isAutoRest = nextWave % 5 === 0 && !isBossWave;

      if (isBossWave) {
        console.log(`[Adventure] 👑 BOSS WAVE ${nextWave}`);
        spawnEnemies(true);
      } else if (isAutoRest) {
        console.log(`[Adventure] 😴 Auto-rest wave ${nextWave} - Heroes rest, no combat`);
        // Auto-rest: Just skip this wave, next tick will continue
        // Wave count already incremented above, so next tick will be wave ${nextWave + 1}
      } else {
        // Random encounter
        const rand = Math.random();
        
        if (rand < 0.4) {
          // COMBAT (40%)
          console.log(`[Adventure] ⚔️ Combat encounter - Wave ${nextWave}`);
          spawnEnemies(false);
        } else if (rand < 0.7) {
          // TREASURE (30%)
          console.log(`[Adventure] 💰 Treasure - Wave ${nextWave}`);
          
          // Grant gold to all alive heroes
          const goldAmount = Math.floor(5 + waveCount * 0.5);
          
          setHeroes(current => {
            const updated = current.map(hero => {
              if (hero.isDead) return hero;
              
              let newGold = (hero.gold || 0) + goldAmount;
              let newPotions = hero.potions ? { ...hero.potions } : { health: 0 };
              let purchasedItem = '';
              
              console.log(`[Treasure] ${hero.name} finds ${goldAmount}g!`);
              
              // Show gold SCT (back inside setState - Strict Mode is OFF!)
              const heroElement = document.querySelector(`[data-hero-id="${hero.id}"]`);
              if (heroElement) {
                const rect = heroElement.getBoundingClientRect();
                addSCT(`${goldAmount}g`, rect.left + rect.width / 2, rect.top + 25, 'loot');
              }
              
              // AUTO-BUY during treasure (if autoBuy enabled)
              if (hero.autoBuy && Math.random() < 0.3) {
                // Prioritize health potions when low stock
                if (newGold >= 10 && newPotions.health < 2) {
                  newGold -= 10;
                  newPotions.health++;
                  purchasedItem = `Health Potion (${newPotions.health} total)`;
                  console.log(`[Auto-Buy] 🛒 ${hero.name} bought Health Potion! (${newPotions.health} potions)`);
                }
                // Buy buffs if enough gold (XP Boost, Attack Buff, Defense Buff)
                else {
                  const affordableBuffs = [];
                  if (newGold >= 25) affordableBuffs.push('xpboost');
                  if (newGold >= 50) affordableBuffs.push('attackbuff');
                  if (newGold >= 50) affordableBuffs.push('defensebuff');
                  
                  if (affordableBuffs.length > 0) {
                    const buffChoice = affordableBuffs[Math.floor(Math.random() * affordableBuffs.length)];
                    const cost = SHOP_ITEMS[buffChoice].cost;
                    newGold -= cost;
                    purchasedItem = SHOP_ITEMS[buffChoice].name;
                    
                    // Apply buff
                    const newShopBuffs = hero.shopBuffs ? { ...hero.shopBuffs } : {};
                    const now = Date.now();
                    
                    if (buffChoice === 'xpboost') {
                      newShopBuffs.xpBoost = { remainingDuration: 300000, lastUpdateTime: now }; // 5 min
                      console.log(`[Auto-Buy] 🛒 ${hero.name} bought XP Boost! (+50% XP for 5min)`);
                    } else if (buffChoice === 'attackbuff') {
                      newShopBuffs.attackBuff = { remainingDuration: 600000, lastUpdateTime: now }; // 10 min
                      console.log(`[Auto-Buy] 🛒 ${hero.name} bought Attack Buff! (+10% ATK for 10min)`);
                    } else if (buffChoice === 'defensebuff') {
                      newShopBuffs.defenseBuff = { remainingDuration: 600000, lastUpdateTime: now }; // 10 min
                      console.log(`[Auto-Buy] 🛒 ${hero.name} bought Defense Buff! (+10% DEF for 10min)`);
                    }
                    
                    // Show buff SCT
                    const heroElement = document.querySelector(`[data-hero-id="${hero.id}"]`);
                    if (heroElement) {
                      const rect = heroElement.getBoundingClientRect();
                      addSCT(`+${SHOP_ITEMS[buffChoice].name}`, rect.left + rect.width / 2, rect.top + 45, 'loot');
                    }
                    
                    return { ...hero, gold: newGold, potions: newPotions, shopBuffs: newShopBuffs };
                  }
                }
              }
              
              return { ...hero, gold: newGold, potions: newPotions };
            });
            
            heroesRef.current = updated;
            return updated;
          });
          
          // Auto-buy for heroes during treasure (already done above, this is for future treasure events)
        } else {
          // PEACEFUL TRAVEL (30%)
          console.log(`[Adventure] 🚶 Peaceful travel - Wave ${nextWave}`);
          
          // TRAVEL ANIMATION: Heroes walk/run during travel
          setIsTraveling(true);
          allHeroes.forEach(hero => {
            const heroRef = getHeroSpriteRef(hero.id);
            if (heroRef.current) {
              // Try walk animation, fallback to run, then idle
              try {
                heroRef.current.playAnimation('walk');
                console.log(`[Travel] 🚶 ${hero.name} is walking...`);
              } catch {
                try {
                  heroRef.current.playAnimation('run');
                  console.log(`[Travel] 🏃 ${hero.name} is running...`);
                } catch {
                  console.log(`[Travel] ${hero.name} no walk/run animation available`);
                }
              }
            }
          });
          
          // Return to idle after 4.5 seconds (before next tick)
          setTimeout(() => {
            setIsTraveling(false);
            allHeroes.forEach(hero => {
              const heroRef = getHeroSpriteRef(hero.id);
              if (heroRef.current) {
                heroRef.current.playAnimation('idle');
              }
            });
          }, 4500);
          
          // Track XP gains and level ups (for logs outside setState)
          const xpGains: Array<{heroId: string; name: string; xp: number; maxXp: number; leveledUp: boolean; oldLevel?: number; newLevel?: number}> = [];
          
          // Grant +3 XP to all alive heroes
          setHeroes(current => {
            const updated = current.map(hero => {
              if (hero.isDead || hero.hp <= 0) return hero;
              
              const newXP = (hero.xp || 0) + 3;
              const maxXP = hero.maxXp || (100 + hero.level * 10);
              
              // Check for level up from travel
              if (newXP >= maxXP) {
                const newLevel = hero.level + 1;
                const newMaxXP = 100 + newLevel * 10;
                
                xpGains.push({
                  heroId: hero.id,
                  name: hero.name,
                  xp: newXP,
                  maxXp: maxXP,
                  leveledUp: true,
                  oldLevel: hero.level,
                  newLevel: newLevel
                });
                
                const leveledHero = calculateHeroStats({
                  ...hero,
                  level: newLevel,
                  xp: newXP - maxXP,
                  maxXp: newMaxXP
                });
                
                return leveledHero;
              }
              
              xpGains.push({
                heroId: hero.id,
                name: hero.name,
                xp: newXP,
                maxXp: maxXP,
                leveledUp: false
              });
              
              return { ...hero, xp: newXP };
            });
            
            heroesRef.current = updated;
            return updated;
          });
          
          // Show logs OUTSIDE setState (prevents React Strict Mode duplicates)
          xpGains.forEach(gain => {
            console.log(`[Travel] ${gain.name} gains +3 XP (${gain.xp}/${gain.maxXp})`);
            
            if (gain.leveledUp) {
              console.log(`[Level Up] ✨ ${gain.name} leveled up from travel! ${gain.oldLevel} → ${gain.newLevel}`);
            }
          });
          
          // Gathering during travel (ALWAYS if has profession)
          setHeroes(current => {
            const updated = current.map(hero => {
              if (!hero.profession || hero.isDead) return hero;
              
              const profType = hero.profession.type;
              const profLevel = hero.profession.level || 1;
              
              // Determine material and amount
              let material = '';
              let amount = 0;
              
              if (profType === 'herbalism') {
                material = 'herbs';
                amount = Math.floor(1 + profLevel / 20); // 1-5 herbs based on level
              } else if (profType === 'mining') {
                material = 'ore';
                amount = Math.floor(1 + profLevel / 20); // 1-5 ore based on level
              } else {
                return hero; // Enchanting doesn't gather during travel
              }
              
              const profXP = amount * 5; // 5 XP per material
              
              console.log(`[Gathering] ${hero.name} gathers ${amount} ${material} (+${profXP} profession XP)`);
              
              // QUEST TRACKING: Track materials gathered
              trackQuest(hero.id, 'gather', amount);
              
              // Show gathering SCT (back inside setState - Strict Mode is OFF!)
              const heroElement = document.querySelector(`[data-hero-id="${hero.id}"]`);
              if (heroElement) {
                const rect = heroElement.getBoundingClientRect();
                addSCT(`${amount} ${material}`, rect.left + rect.width / 2, rect.top + 30, 'gather');
                
                // Show profession XP (purple, below material)
                setTimeout(() => {
                  addSCT(`${profXP}`, rect.left + rect.width / 2, rect.top + 50, 'profession-xp');
                }, 200);
              }
              
              // Add materials and profession XP
              const newMaterials = { ...hero.profession.materials };
              newMaterials[material] = (newMaterials[material] || 0) + amount;
              
              const newProfXP = (hero.profession.xp || 0) + profXP;
              
              return {
                ...hero,
                profession: {
                  ...hero.profession,
                  xp: newProfXP,
                  materials: newMaterials
                }
              };
            });
            
            heroesRef.current = updated;
            return updated;
          });
        }
      }
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

      // Convert to our Enemy type and MANUALLY apply difficulty scaling
      const convertedEnemies: Enemy[] = newEnemies.map(e => {
        // Apply difficulty modifier to HP and attack
        const scaledHp = Math.floor(e.hp * difficultyModifier);
        const scaledAttack = Math.floor(e.attack * difficultyModifier);
        
        console.log(`[Enemy] ${e.name} scaling: HP ${e.hp}→${scaledHp}, ATK ${e.attack}→${scaledAttack} (${(difficultyModifier * 100).toFixed(0)}% difficulty)`);
        
        return {
          id: e.id,
          name: e.name,
          level: e.level,
          hp: scaledHp,
          maxHp: scaledHp,
          attack: scaledAttack,
          defense: e.defense,
          xp: e.xp,
          isBoss: e.isBoss || false
        };
      });

      // Make first enemy boss if boss wave
      if (isBoss && convertedEnemies.length > 0) {
        convertedEnemies[0].isBoss = true;
        convertedEnemies[0].hp = Math.floor(convertedEnemies[0].hp * 1.5);
        convertedEnemies[0].maxHp = Math.floor(convertedEnemies[0].maxHp * 1.5);
      }

      console.log(`[Adventure] Spawned ${convertedEnemies.length} enemies:`, convertedEnemies.map(e => e.name).join(', '));
      setEnemies(convertedEnemies);
      enemiesRef.current = convertedEnemies; // Keep ref in sync
      
      // IMPORTANT: Delay combat start to let enemy sprites appear first!
      setTimeout(() => {
        setInCombat(true);
        console.log('[Adventure] ⚔️ Combat starting (enemies visible)');
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
    combatInProgress.current = true;

    // Start combat round (SIMPLIFIED - like enemy attacks)
    const startCombatRound = () => {
      console.log('[Combat] ===== STARTING NEW ROUND =====');
      
      // Use refs for current state (no stale closures!)
      const currentHeroes = testHealer ? [...heroesRef.current, testHealer] : heroesRef.current;
      const currentEnemies = enemiesRef.current;
      
      console.log(`[Combat] Current state: ${currentHeroes.length} heroes, ${currentEnemies.length} enemies`);
      
      // =============================================================
      // PHASE 0: AUTO-POTION (Use health potion if HP < 30%)
      // =============================================================
      const now = Date.now();
      
      currentHeroes.forEach(hero => {
        if (hero.isDead || hero.hp <= 0) return;
        
        const hpPercent = hero.hp / hero.maxHp;
        
        // Check if hero has potions and HP is below 30%
        if (hpPercent < 0.30 && hero.potions && hero.potions.health > 0) {
          console.log(`[Auto-Potion] 🧪 ${hero.name} uses Health Potion! (${hpPercent.toFixed(0)}% HP)`);
          
          // Use potion (heal 50% max HP)
          const healAmount = Math.floor(hero.maxHp * 0.5);
          const newHp = Math.min(hero.maxHp, hero.hp + healAmount);
          const actualHeal = newHp - hero.hp;
          
          // Overheal converts to shield
          const overheal = healAmount - actualHeal;
          const newShield = (hero.shield || 0) + overheal;
          
          setHeroes(current => {
            const updated = current.map(h => {
              if (h.id === hero.id) {
                // Consume potion
                const newPotions = { ...h.potions, health: (h.potions?.health || 1) - 1 };
                return { ...h, hp: newHp, shield: newShield, potions: newPotions };
              }
              return h;
            });
            heroesRef.current = updated;
            return updated;
          });
          
          // Show heal SCT
          const heroElement = document.querySelector(`[data-hero-id="${hero.id}"]`);
          if (heroElement) {
            const rect = heroElement.getBoundingClientRect();
            addSCT(`+${actualHeal}`, rect.left + rect.width / 2, rect.top + 20, 'heal');
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
                
                if (newShield > 0) {
                  if (remainingDamage >= newShield) {
                    remainingDamage -= newShield;
                    newShield = 0;
                    console.log(`[DoT] 🛡️ ${hero.name}'s shield absorbed ${newShield} DoT damage, ${remainingDamage} HP damage remains`);
                  } else {
                    newShield -= remainingDamage;
                    remainingDamage = 0;
                    console.log(`[DoT] 🛡️ ${hero.name}'s shield absorbed ${dotDamage} DoT damage`);
                  }
                }
                
                newHp = Math.max(0, newHp - remainingDamage);
                
                // Update hero state
                setHeroes(current => {
                  const updated = current.map(h => {
                    if (h.id === hero.id) {
                      return { ...h, hp: Math.floor(newHp), shield: Math.floor(newShield) };
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
                      const newHp = Math.max(0, e.hp - actualDamage);
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
          
          // Heal all allies for 30% of their max HP
          setHeroes(current => {
            const updated = current.map(h => {
              if (h.isDead || h.hp <= 0) return h;
              
              const healAmount = Math.floor(h.maxHp * 0.3);
              const newHp = Math.min(h.maxHp, h.hp + healAmount);
              const actualHeal = newHp - h.hp;
              const overheal = healAmount - actualHeal;
              const newShield = (h.shield || 0) + overheal;
              
              // Show heal SCT for each hero
              const heroElement = document.querySelector(`[data-hero-id="${h.id}"]`);
              if (heroElement && actualHeal > 0) {
                const rect = heroElement.getBoundingClientRect();
                addSCT(`+${actualHeal}`, rect.left + rect.width / 2, rect.top + 20, 'heal');
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
      
      // Hero actions (can have multiple actions if Swift procs!)
      currentHeroes.forEach(hero => {
        if (hero.hp <= 0 || hero.isDead) {
          console.log(`[Combat] Skipping ${hero.name} - dead`);
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
          
          if (injuredAllies.length > 0) {
            // Heal lowest HP ally
            const healTarget = injuredAllies.reduce((lowest, h) => 
              (h.hp / h.maxHp) < (lowest.hp / lowest.maxHp) ? h : lowest
            );
            
            console.log(`[Combat] ${hero.name} will HEAL ${healTarget.name} (${Math.floor((healTarget.hp / healTarget.maxHp) * 100)}% HP)`);
            
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
      currentEnemies.forEach(enemy => {
        if (enemy.hp <= 0) {
          console.log(`[Combat] Skipping ${enemy.name} - dead`);
          return;
        }

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
          console.log(`[Combat] ${enemy.name} targeting tank ${target.name} (20x threat)`);
        }

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
      });

      // Sort by initiative
      actions.sort((a, b) => b.initiative - a.initiative);

      console.log('[Combat] Initiative order:', actions.map(a => `${a.actorName} (${a.initiative})`).join(' → '));

      if (actions.length === 0) {
        console.log('[Combat] No valid actions, ending combat');
        checkCombatVictory();
        return;
      }

      // Execute actions SEQUENTIALLY - wait for animations to complete
      let delay = 0;
      actions.forEach((action, index) => {
        setTimeout(() => {
          console.log(`[Combat] Executing ${index + 1}/${actions.length}: ${action.actorName} → ${action.targetName}`);
          if (action.type === 'heal') {
            executeHeal(action);
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
        checkCombatVictory();
      }, totalDelay);
    };

    // Execute heal action (HEALERS)
    const executeHeal = (action: CombatAction) => {
      const allCurrentHeroes = testHealer ? [...heroesRef.current, testHealer] : heroesRef.current;
      const healer = allCurrentHeroes.find(h => h.id === action.actorId);
      const target = allCurrentHeroes.find(h => h.id === action.targetId);
      
      if (!healer || !target) {
        console.warn('[Heal] Healer or target not found');
        return;
      }
      
      // Calculate heal amount (based on healer's intellect, wisdom, healing power)
      let baseHeal = healer.attack || (healer.level * 5);
      
      // Healer scaling: Intellect + Wisdom
      const cappedInt = Math.min(healer.intellect || 0, 100);
      const cappedWis = Math.min(healer.wisdom || 0, 100);
      const intBonus = 1 + (cappedInt * 0.015); // 1.5% per point
      const wisBonus = 1 + (cappedWis * 0.01); // 1% per point
      baseHeal *= intBonus * wisBonus;
      
      // Healing Power % bonus (capped at 30%)
      const cappedHealingPower = Math.min(healer.healingPower || 0, 30);
      baseHeal *= (1 + (cappedHealingPower * 0.01));
      
      // Apply VIEWER BONUS (+1% healing per viewer)
      if (viewerCount > 0) {
        const viewerBonus = 1 + (viewerCount * 0.01);
        baseHeal = Math.floor(baseHeal * viewerBonus);
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
      
      // Apply healing with overheal → shield conversion
      setHeroes(current => {
        const updated = current.map(h => {
          if (h.id === target.id) {
            const newHp = Math.min(h.maxHp, h.hp + healAmount);
            const actualHeal = newHp - h.hp;
            const overheal = healAmount - actualHeal;
            const newShield = (h.shield || 0) + overheal;
            
            return { ...h, hp: newHp, shield: newShield };
          }
          return h;
        });
        heroesRef.current = updated;
        return updated;
      });
      
      // Show heal SCT with particles and flash (SAME as idle mode!)
      const targetElement = document.querySelector(`[data-hero-id="${target.id}"]`);
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const actualHeal = Math.min(healAmount, target.maxHp - target.hp);
        const overheal = healAmount - actualHeal;
        
        // Main heal number
        addSCT(`+${healAmount}`, rect.left + rect.width / 2, rect.top + 20, 'heal');
        
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
        
        if (overheal > 0) {
          setTimeout(() => {
            addSCT(`+${overheal} Shield`, rect.left + rect.width / 2, rect.top + 40, 'loot');
          }, 300);
        }
      }
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
      let targetCheck = currentEnemies.find(e => e.id === action.targetId);
      
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
      
      // Apply VIEWER BONUS (+1% damage per viewer)
      if (viewerCount > 0) {
        const viewerBonus = 1 + (viewerCount * 0.01);
        baseDamage = Math.floor(baseDamage * viewerBonus);
      }
      
      // Apply Attack Buff (+10% ATK)
      if (hero.shopBuffs?.attackBuff && hero.shopBuffs.attackBuff.remainingDuration > 0) {
        baseDamage = Math.floor(baseDamage * 1.10);
        console.log(`[Attack Buff] ⚡ ${hero.name} gets +10% attack from buff!`);
      }
      
      // Determine if melee or caster DPS
      const isMeleeRole = ['berserker', 'crusader', 'assassin', 'reaper', 'bladedancer', 'monk', 'stormwarrior', 'hunter'].includes(hero.role);
      const isCasterRole = ['mage', 'warlock', 'elementalist', 'necromancer', 'sorcerer', 'pyromancer'].includes(hero.role);
      const isTank = isTankRole(hero.role);
      
      // Apply stat scaling based on role
      if (isMeleeRole) {
        const cappedStr = Math.min(hero.strength || 0, 100);
        const cappedDex = Math.min(hero.dexterity || 0, 50);
        const strengthBonus = 1 + (cappedStr * 0.01);
        const dexBonus = 1 + (cappedDex * 0.005);
        baseDamage *= strengthBonus * dexBonus;
        const cappedMeleeDmg = Math.min(hero.meleeDamage || 0, 30);
        baseDamage *= (1 + (cappedMeleeDmg * 0.01));
      } else if (isCasterRole) {
        const cappedInt = Math.min(hero.intellect || 0, 100);
        const cappedWis = Math.min(hero.wisdom || 0, 50);
        const intBonus = 1 + (cappedInt * 0.01);
        const wisBonus = 1 + (cappedWis * 0.005);
        baseDamage *= intBonus * wisBonus;
        const cappedSpellDmg = Math.min(hero.spellDamage || 0, 30);
        baseDamage *= (1 + (cappedSpellDmg * 0.01));
      } else if (isTank) {
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
      let damage = Math.floor(baseDamage + (Math.random() * variance * 2) - variance);
      
      // Chain Lightning damage reduction per jump
      if ((action as any).isChainLightning) {
        const chainIndex = (action as any).chainIndex || 0;
        const chainMult = chainIndex === 0 ? 1.0 : chainIndex === 1 ? 0.7 : 0.5; // 100%, 70%, 50%
        damage = Math.floor(damage * chainMult);
        console.log(`[Chain Lightning] Jump ${chainIndex + 1}: ${chainMult * 100}% damage`);
      }
      
      // Whirlwind damage reduction (70% of normal)
      if ((action as any).isWhirlwind) {
        damage = Math.floor(damage * 0.7);
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
        damage = Math.floor(damage * 2);
        console.log(`[Combat] ⚡ CRITICAL HIT! ${hero.name} crits for ${damage}!`);
      }
      
      // QUEST TRACKING: Track damage dealt
      trackQuest(hero.id, 'dealDamage', damage);

      // ANIMATIONS - Play ONCE outside setState
      const heroRef = getHeroSpriteRef(action.actorId);
      if (heroRef.current) {
        console.log(`[Animation] ${action.actorName} → attack`);
        heroRef.current.playAnimation('attack');
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
        let remainingDamage = damage;
        let newShield = target.shield || 0;
        let newHp = target.hp;

        if (newShield > 0) {
          if (remainingDamage >= newShield) {
            // Shield breaks
            remainingDamage -= newShield;
            newShield = 0;
            newHp = Math.max(0, target.hp - remainingDamage);
            console.log(`[Combat] 🛡️ ${target.name}'s shield broke!`);
          } else {
            // Shield absorbs all
            newShield -= remainingDamage;
            console.log(`[Combat] 🛡️ Shield absorbed ${remainingDamage} damage (${newShield} remaining)`);
          }
        } else {
          newHp = Math.max(0, target.hp - remainingDamage);
        }

        // CRITICAL: Mark as dead immediately if HP reaches 0
        const died = newHp === 0 && !target.isDead;
        updatedEnemies[targetIndex] = { ...target, hp: newHp, shield: newShield, isDead: died || target.isDead };
        
        // Update state immediately so other actions can see this enemy is dead!
        enemiesRef.current = updatedEnemies;
        
        // Play death animation if enemy just died
        if (died) {
          const enemyRef = getEnemySpriteRef(target.id);
          if (enemyRef.current) {
            console.log(`[Animation] ${target.name} → death`);
            // Defer animation to avoid "setState during render" warning
            setTimeout(() => {
              if (enemyRef.current) {
                enemyRef.current.playAnimation('death');
              }
            }, 0);
          }
        }
        
        // QUEST TRACKING: Track enemy kills
        if (died) {
          trackQuest(hero.id, 'kill', 1);
          
          // Track boss kills separately
          if (target.isBoss) {
            trackQuest(hero.id, 'defeatBosses', 1);
          }
          
          // INSTANT VICTORY CHECK: If this was the last enemy, end round NOW!
          const remainingEnemies = updatedEnemies.filter(e => e.hp > 0 && !e.isDead);
          if (remainingEnemies.length === 0) {
            console.log('[Combat] ⚡ INSTANT VICTORY! Last enemy defeated - ending round NOW!');
            
            // Clear any pending combat actions (stop beating dead enemies!)
            if (combatRoundTimeoutRef.current) {
              clearTimeout(combatRoundTimeoutRef.current);
              combatRoundTimeoutRef.current = null;
            }
            
            // Trigger victory check immediately (after brief delay for death animation)
            setTimeout(() => {
              checkCombatVictory();
            }, 1000); // 1s for death animation to play
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

      // Enemy hurt animation (skip if in aerial sequence!)
      setTimeout(() => {
        const enemyRef = getEnemySpriteRef(target.id);
        const enemyElement = document.querySelector(`[data-enemy-id="${target.id}"]`) as HTMLElement;
        
        // Don't interrupt aerial sequence!
        if (enemyElement?.getAttribute('data-aerial-sequence') === 'true') {
          console.log(`[Animation] ${target.name} → hurt SKIPPED (aerial sequence in progress)`);
          return;
        }
        
        if (enemyRef.current && target.hp > 0) {
          console.log(`[Animation] ${target.name} → hurt`);
          enemyRef.current.playAnimation('hurt');
        }
      }, 200);

      // Death animation
      if (target.hp <= 0) {
        setTimeout(() => {
          const enemyRef = getEnemySpriteRef(target.id);
          if (enemyRef.current) {
            console.log(`[Animation] ${target.name} → death`);
            enemyRef.current.playAnimation('death');
          }
        }, 400);
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
      
      // Check if target hero is still alive (allCurrentHeroes declared below, use temp variable)
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
      
      // APPLY DIFFICULTY (cubed)
      const difficultyImpact = Math.pow(difficultyModifier, 3);
      baseDamage = Math.floor(baseDamage * difficultyImpact);

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
      
      // Apply VIEWER BONUS (+0.5% defense per viewer)
      if (viewerCount > 0) {
        const viewerDefenseBonus = 1 + (viewerCount * 0.005);
        defense = Math.floor(defense * viewerDefenseBonus);
      }
      
      // Apply Defense Buff (+10% DEF)
      if (targetHeroRef.shopBuffs?.defenseBuff && targetHeroRef.shopBuffs.defenseBuff.remainingDuration > 0) {
        defense = Math.floor(defense * 1.10);
        console.log(`[Defense Buff] ⚡ ${targetHeroRef.name} gets +10% defense from buff!`);
      }
      
      const damageAfterDefense = baseDamage / (1 + defense / 250);
      const minDamage = Math.max(1, baseDamage * 0.25);
      let actualDamage = Math.max(minDamage, Math.floor(damageAfterDefense));
      
      // Check for VULNERABLE debuff (+40% damage taken)
      if (targetHeroRef.activeDebuffs?.vulnerable) {
        actualDamage = Math.floor(actualDamage * 1.4);
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
                thornsDamage += Math.floor(actualDamage * proc.value);
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
      
      // Apply Last Stand reduction (75% reduction)
      if (lastStandActive) {
        actualDamage = Math.floor(actualDamage * 0.25);
        console.log(`[Last Stand] Damage reduced by 75%: ${Math.floor(actualDamage / 0.25)} → ${actualDamage}`);
      }
      
      // Apply Iron Skin reduction (50% reduction)
      if (ironSkinActive) {
        actualDamage = Math.floor(actualDamage * 0.50);
        console.log(`[Iron Skin] Damage reduced by 50%: ${Math.floor(actualDamage / 0.5)} → ${actualDamage}`);
      }
      
      // Check for Shield Wall (Guardian ability - 30% DR for all allies)
      const allCurrentHeroes = testHealer ? [...heroesRef.current, testHealer] : heroesRef.current;
      const shieldWallActive = allCurrentHeroes.some(h => h.activeBuffs?.shieldWall?.active && h.activeBuffs.shieldWall.expiresAt > Date.now());
      if (shieldWallActive) {
        actualDamage = Math.floor(actualDamage * 0.70);
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
        addSCT(`${actualDamage}`, rect.left + rect.width / 2, rect.top + 20, 'damage');
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
        let remainingDamage = actualDamage;
        let newShield = target.shield || 0;
        let newHp = target.hp;
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
          updatedHeroes[targetIndex] = { ...target, hp: newHp, shield: newShield };
          
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
                value: Math.floor(actualDamage * 0.15) // 15% of initial damage per tick
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
    const checkCombatVictory = () => {
      const currentHeroes = heroesRef.current;
      const currentEnemies = enemiesRef.current;
      
      const aliveEnemies = currentEnemies.filter(e => e.hp > 0);
      const aliveHeroes = currentHeroes.filter(h => h.hp > 0 && !h.isDead);

      console.log(`[Combat] Victory check - ${aliveHeroes.length} heroes, ${aliveEnemies.length} enemies alive`);

      if (aliveEnemies.length === 0 && currentEnemies.length > 0) {
        // Victory! Grant XP to all alive heroes
        console.log('[Combat] ✅ Victory! All enemies defeated.');
        
        // QUEST TRACKING: Track wave completion
        aliveHeroes.forEach(hero => {
          trackQuest(hero.id, 'completeWaves', 1);
        });
        
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
        let totalXP = currentEnemies.reduce((sum, enemy) => sum + (enemy.xp || enemy.level * 10), 0);
        
        // Loot quality bonus above 100% difficulty
        if (difficultyModifier > 1.0) {
          const lootBonus = (difficultyModifier - 1.0) * 0.6; // +6% per 10% above 100%
          totalXP = Math.floor(totalXP * (1 + lootBonus));
          console.log(`[Combat] Difficulty bonus: ${(lootBonus * 100).toFixed(0)}% extra XP!`);
        }
        
        console.log(`[Combat] Granting ${totalXP} base XP to all heroes (before XP Boost buff)`);
        
        // Track XP gains and level ups (for SCT outside setState)
        const xpResults: Array<{heroId: string; name: string; xp: number; leveledUp: boolean; oldLevel?: number; newLevel?: number; isDead: boolean}> = [];
        
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
            let newHero = { ...hero, xp: newXP };
            
            // Track for SCT outside setState
            const result = {
              heroId: hero.id,
              name: hero.name,
              xp: totalXP,
              leveledUp: false,
              isDead: hero.isDead || hero.hp <= 0
            };
            
            // Check for level up
            if (newXP >= maxXP) {
              const newLevel = hero.level + 1;
              const newMaxXP = 100 + newLevel * 10;
              
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
        
        // Generate loot for each defeated enemy
        currentEnemies.forEach(enemy => {
          // Loot chance: 100% for bosses, 30% for regular enemies
          const lootChance = enemy.isBoss ? 1.0 : 0.3;
          if (Math.random() > lootChance) {
            console.log(`[Loot] No loot from ${enemy.name}`);
            return;
          }
          
          // Bosses drop 2-4 items, regular enemies drop 1
          const numItems = enemy.isBoss ? Math.floor(2 + Math.random() * 3) : 1;
          
          console.log(`[Loot] ${enemy.name} drops ${numItems} item(s)`);
          
          for (let i = 0; i < numItems; i++) {
            // Pick a random alive hero to give loot to
            const aliveHeroes = currentHeroes.filter(h => !h.isDead && h.hp > 0);
            if (aliveHeroes.length === 0) continue;
            
            const randomHero = aliveHeroes[Math.floor(Math.random() * aliveHeroes.length)];
            
            // Generate loot for this hero's role
            const loot = generateLoot(randomHero.role, {
              enemyLevel: enemy.level || 1,
              waveCount: waveCount,
              isBoss: enemy.isBoss || false
            });
            
            if (!loot) continue;
            
            console.log(`[Loot] Generated ${loot.rarity} ${loot.name} for ${randomHero.name} (slot: ${loot.slot})`);
            
            // Check if better than current item
            const currentItem = randomHero.equipment?.[loot.slot];
            const isBetter = isItemBetter(loot, currentItem);
            
            if (isBetter) {
              // Auto-equip the new item
              const oldPower = currentItem ? calculateItemPower(currentItem) : 0;
              const newPower = calculateItemPower(loot);
              
              console.log(`[Loot] ✅ ${randomHero.name} equips ${loot.rarity} ${loot.name} (${oldPower} → ${newPower} power)`);
              
              // Calculate sell value of old item
              let sellGold = 0;
              if (currentItem) {
                const itemValue = currentItem.attack + currentItem.defense + currentItem.hp;
                const rarityMult = { common: 1, uncommon: 1.3, rare: 2, epic: 3, legendary: 4 }[currentItem.rarity as string] || 1;
                sellGold = Math.floor(itemValue * rarityMult * 0.25);
                console.log(`[Loot] 💰 Sold old ${currentItem.rarity} ${currentItem.name} for ${sellGold}g`);
              }
              
              // Update hero with new equipment and gold
              setHeroes(current => {
                const updated = current.map(h => {
                  if (h.id === randomHero.id) {
                    const newEquipment = { ...h.equipment, [loot.slot]: loot };
                    const newGold = (h.gold || 0) + sellGold;
                    return { ...h, equipment: newEquipment, gold: newGold };
                  }
                  return h;
                });
                heroesRef.current = updated;
                return updated;
              });
              
              // Show loot SCT
              setTimeout(() => {
                const heroElement = document.querySelector(`[data-hero-id="${randomHero.id}"]`);
                if (heroElement) {
                  const rect = heroElement.getBoundingClientRect();
                  const rarityColor = { common: '🔘', uncommon: '🟢', rare: '🔵', epic: '🟣', legendary: '🟠' }[loot.rarity] || '📦';
                  addSCT(`${rarityColor} ${loot.name}`, rect.left + rect.width / 2, rect.top + 35, 'loot');
                }
              }, 300);
            } else {
              // Auto-sell (item not better)
              const itemValue = loot.attack + loot.defense + loot.hp;
              const rarityMult = { common: 1, uncommon: 1.3, rare: 2, epic: 3, legendary: 4 }[loot.rarity as string] || 1;
              const sellGold = Math.floor(itemValue * rarityMult * 0.25);
              
              console.log(`[Loot] 💰 Auto-sold ${loot.rarity} ${loot.name} for ${sellGold}g (not better)`);
              
              setHeroes(current => {
                const updated = current.map(h => {
                  if (h.id === randomHero.id) {
                    return { ...h, gold: (h.gold || 0) + sellGold };
                  }
                  return h;
                });
                heroesRef.current = updated;
                return updated;
              });
            }
          }
        });
        
        // RAID MODE: Check if we need to progress to next wave
        if (gameMode === 'raid' && instanceData) {
          const currentWave = instanceData.currentWave || 0;
          const totalWaves = instanceData.waves || 5;
          
          // If not final wave, progress to next wave
          if (currentWave < totalWaves - 1) {
            console.log(`[Raid Waves] ✅ Wave ${currentWave + 1} complete! Moving to wave ${currentWave + 2}...`);
            
            // Clear combat state FIRST (remove all wave enemies before boss!)
            console.log(`[Raid Waves] 🧹 Clearing ${enemiesRef.current.length} enemies before next wave...`);
            setEnemies([]);
            enemiesRef.current = [];
            setInCombat(false);
            combatInProgress.current = false;
            
            console.log('[Raid Waves] ⏳ Enemies cleared! Updating wave in 500ms...');
            
            // Update wave in Firebase AFTER clearing (triggers raid setup to create new enemies)
            setTimeout(() => {
              // Show wave announcement
              setShowWaveAnnouncement(true);
              setTimeout(() => setShowWaveAnnouncement(false), 2000);
              
              if (currentInstanceId) {
                const instanceRef = doc(db, 'raidInstances', currentInstanceId);
                import('firebase/firestore').then(({ updateDoc }) => {
                  updateDoc(instanceRef, {
                    currentWave: currentWave + 1
                  }).then(() => {
                    console.log(`[Raid Waves] ✅ Updated to wave ${currentWave + 2} in Firebase - raid setup should trigger!`);
                  }).catch(err => {
                    console.error('[Raid Waves] ❌ Failed to update wave:', err);
                  });
                });
              }
            }, 500);
          }
          // Final wave complete - raid victory handled above
          else {
            console.log('[Raid] 🎊 RAID COMPLETE! Returning to idle...');
            
            // Update raid status to "completed" in Firebase to trigger mode switch back to idle
            if (instanceData?.id) {
              import('firebase/firestore').then(({ doc, updateDoc }) => {
                updateDoc(doc(db, 'raidInstances', instanceData.id), {
                  status: 'completed',
                  completedAt: new Date()
                }).then(() => {
                  console.log('[Raid] ✅ Raid status updated to "completed" in Firebase');
                }).catch(err => {
                  console.error('[Raid] ❌ Failed to update raid status:', err);
                });
              });
            }
            
            setTimeout(() => {
              setEnemies([]);
              enemiesRef.current = [];
              setInCombat(false);
              combatInProgress.current = false;
            }, 5000); // 5s delay to show victory
          }
        }
        // IDLE MODE: Normal victory
        else {
          setTimeout(() => {
            setEnemies([]);
            enemiesRef.current = [];
            setInCombat(false);
            combatInProgress.current = false;
          }, 1000);
        }
      } else if (aliveHeroes.length === 0) {
        // TOTAL PARTY WIPE - Resurrect all heroes, clear enemies, lower difficulty
        console.log('[Combat] 💀 TOTAL PARTY WIPE! All heroes died.');
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
    if (heroes.length === 0) return;
    
    // Prevent duplicate sync intervals
    if (syncIntervalRef.current) {
      return;
    }

    console.log('[Sync] Starting periodic sync (every 60s) for', heroes.length, 'heroes');

    const syncInterval = setInterval(async () => {
      console.log('[Sync] Syncing', heroes.length, 'heroes to Firebase...');
      
      // QUEST TRACKING: Batch sync quest progress to backend
      const now = Date.now();
      const timeSinceLastSync = now - lastQuestSyncRef.current;
      
      if (questProgressRef.current.size > 0 && timeSinceLastSync >= 60000) {
        console.log('[Quest Sync] Syncing quest progress for', questProgressRef.current.size, 'heroes...');
        
        // Convert Map to array of updates for batch API
        const questUpdates: Array<{ userId: string; updates: Array<{ trackingKey: string; type: 'daily' | 'weekly' | 'monthly'; increment: number }> }> = [];
        
        questProgressRef.current.forEach((heroProgress, heroId) => {
          const hero = heroes.find(h => h.id === heroId);
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
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/quests/update-batch-all`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ updates: questUpdates })
            });
            
            const result = await response.json();
            console.log('[Quest Sync] ✅ Quest progress synced:', result);
            
            // Check for completed quests and show SCT
            if (result.success && result.results) {
              result.results.forEach((userResult: any) => {
                if (userResult.completedQuests && userResult.completedQuests.length > 0) {
                  userResult.completedQuests.forEach((completedQuest: any) => {
                    console.log(`[Quest Complete] 🎉 ${completedQuest.questName} completed!`);
                    
                    // Show SCT for quest completion
                    const hero = heroes.find(h => (h as any).twitchUserId === userResult.userId || (h as any).twitchId === userResult.userId);
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
            questProgressRef.current.clear();
            lastQuestSyncRef.current = now;
            
            // AUTO-CLAIM: Claim all completed quests for each hero
            heroes.forEach(async (hero) => {
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
          } catch (error: any) {
            console.error('[Quest Sync] ❌ Failed to sync quest progress:', error);
          }
        }
      }
      
      // Hero state sync
      heroes.forEach(async (hero) => {
        try {
          await heroAPI.updateHero(hero.id, {
            hp: hero.hp,
            level: hero.level,
            xp: hero.xp || 0,
            maxXp: hero.maxXp || 100,
            maxHp: hero.maxHp,
            attack: hero.attack,
            defense: hero.defense
          });
          console.log(`[Sync] ✅ Synced ${hero.name} (HP: ${hero.hp}/${hero.maxHp})`);
        } catch (error: any) {
          if (error?.response?.status === 404) {
            console.warn(`[Sync] ⚠️ Hero ${hero.id} not found in database`);
          } else {
            console.error(`[Sync] ❌ Failed to sync ${hero.name}:`, error?.message);
          }
        }
      });
    }, 60000); // Every 60 seconds
    
    syncIntervalRef.current = syncInterval;

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    };
  }, []); // No dependencies - only runs once on mount

  // Step 8: Hero resurrection system (auto-res after 60 seconds)
  useEffect(() => {
    if (!heroes || heroes.length === 0) return;
    
    // Prevent duplicate resurrection intervals
    if (resIntervalRef.current) {
      return;
    }

    const resInterval = setInterval(() => {
      
      const now = Date.now();
      
      // Update resurrection timers for display
      const newTimers: Record<string, number> = {};
      heroes.forEach(hero => {
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
            console.log(`[Resurrection] ✨ ${hero.name} resurrected with 50% HP!`);
            anyResurrected = true;
            
            // Resurrect with 50% HP
            const resHp = Math.floor(hero.maxHp * 0.5);
            
            // ANIMATION: Force return to idle (with small delay to ensure sprite is ready)
            setTimeout(() => {
              const heroRef = getHeroSpriteRef(hero.id);
              if (heroRef.current) {
                console.log(`[Resurrection] Playing idle animation for ${hero.name}`);
                heroRef.current.playAnimation('idle');
              } else {
                console.warn(`[Resurrection] No sprite ref for ${hero.name}`);
              }
            }, 100);
            
            // Also try immediate animation reset
            const heroRef = getHeroSpriteRef(hero.id);
            if (heroRef.current) {
              heroRef.current.playAnimation('idle');
            }
            
            return {
              ...hero,
              isDead: false,
              deathTime: undefined,
              hp: resHp
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
  }, []); // No dependencies - only runs once on mount

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
    if (!allHeroes || allHeroes.length === 0) return;
    
    // Prevent duplicate regen intervals
    if (regenIntervalRef.current) {
      return;
    }

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

  // Get threat weight for hero role (with Taunt/Fade modifiers)
  const getThreatWeight = (hero: Hero): number => {
    if (!hero || !hero.role) return 1; // Safety check
    
    const now = Date.now();
    
    // Base threat by role
    let baseThreat = 1; // DPS default
    if (isTankRole(hero.role)) baseThreat = 20; // Tanks high threat
    if (isHealerRole(hero.role)) baseThreat = 0.3; // Healers low threat
    
    // Taunt multiplier (10x threat)
    if (hero.tauntExpiry && hero.tauntExpiry > now) {
      return baseThreat * 10; // MASSIVE threat increase
    }
    
    // Fade multiplier (0.1x threat)
    if (hero.fadeExpiry && hero.fadeExpiry > now) {
      return baseThreat * 0.1; // Huge threat reduction
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

    // Start with base stats (from level)
    let stats = {
      attack: 10 + hero.level * 3,
      defense: 5 + hero.level * 2,
      maxHp: 100 + hero.level * 20,
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

    // Add equipment bonuses
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
    stats.meleeDamage += setBonuses.meleeDamage;
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

  // Auto-position enemies horizontally (right side, spread apart)
  const getEnemyPosition = (index: number, total: number, isBoss: boolean = false) => {
    const screenWidth = 1920;
    const screenHeight = 1080;
    
    // Boss positioning: moved down 2 inches and further right
    if (isBoss) {
      return {
        left: '1400px', // Further right for massive Elder Dragon (more space from heroes)
        top: '732px' // Center (540) + 192px (2 inches down)
      };
    }
    
    // Enemies on right side, spread nicely (max 3 enemies)
    const rightMargin = 300; // Distance from right edge
    const maxSpread = 400; // Total width for enemy formation
    
    // Calculate horizontal position (spread evenly)
    const spacing = total > 1 ? maxSpread / (total - 1) : 0;
    const x = screenWidth - rightMargin - (index * spacing);
    
    // Vertical position (centered)
    const y = screenHeight / 2;
    
    return {
      left: `${x}px`,
      top: `${y}px`
    };
  };

  // Auto-position heroes horizontally (left to right)
  // Tanks in front, healers/DPS in back
  const getHeroPosition = (hero: Hero, index: number, allHeroes: Hero[]) => {
    const screenHeight = 1080;
    
    // Categorize heroes
    const tanks = allHeroes.filter(h => isTankRole(h.role));
    const backline = allHeroes.filter(h => !isTankRole(h.role));
    
    const isCurrentHeroTank = isTankRole(hero.role);
    const groupIndex = isCurrentHeroTank 
      ? tanks.findIndex(h => h.id === hero.id)
      : backline.findIndex(h => h.id === hero.id);
    const groupSize = isCurrentHeroTank ? tanks.length : backline.length;
    
    // Horizontal spacing (WIDER to prevent name overlap!)
    const leftMargin = 100; // Start position from left edge
    const spacing = 300; // WIDE spacing (prevents name overlap!)
    const x = leftMargin + (groupIndex * spacing);
    
    // Vertical position (front row vs back row) - MORE separation!
    const centerY = screenHeight / 2;
    const y = isCurrentHeroTank 
      ? centerY + 80  // Front row (tanks) - lower
      : centerY - 80; // Back row (healers/DPS) - higher
    
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
        background: 'transparent',
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
  
  // DUNGEON MODE
  if (gameMode === 'dungeon' && instanceData) {
    return (
      <div style={{ 
        width: '1920px', 
        height: '1080px', 
        position: 'relative', 
        backgroundColor: 'transparent', 
        overflow: 'hidden',
        opacity: fadeOpacity,
        transition: 'opacity 0.5s ease-in-out'
      }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
          <div style={{ color: '#fbbf24', fontSize: '56px', fontWeight: 'bold', textShadow: '3px 3px 6px rgba(0,0,0,0.9)', marginBottom: '20px' }}>
            🏰 DUNGEON MODE 🏰
          </div>
          <div style={{ color: 'white', fontSize: '32px', marginBottom: '40px', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
            {instanceData.name || 'Dungeon'}
          </div>
          <div style={{ color: '#10b981', fontSize: '24px', marginBottom: '40px', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
            Room {instanceData.currentRoom || 0}/{instanceData.totalRooms || 5}
          </div>
          <div style={{ color: '#a0a0a0', fontSize: '18px', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
            Dungeon combat will be displayed here<br/>
            (Coming soon!)
          </div>
        </div>
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
        
        {/* Souls-like Boss Health Bar (bottom-center) - ONLY when boss is active */}
        {enemies.some(e => e.isBoss) && (() => {
          const boss = enemies.find(e => e.isBoss);
          if (!boss) return null;
          
          const bossHpPercent = (boss.hp / boss.maxHp) * 100;
          
          return (
            <div style={{
              position: 'absolute',
              bottom: '80px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '1400px',
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
                  {Math.floor(boss.hp).toLocaleString()}
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
          const spriteKey = hero.isDead ? `${hero.id}-dead` : `${hero.id}-alive`;
          
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
              {/* Hero Name - HIGH ABOVE sprite (same as idle) */}
              <div style={{
                color: hero.isDead ? '#ef4444' : 'white',
                fontSize: '18px',
                fontWeight: 'bold',
                marginBottom: '8px',
                textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
                backgroundColor: 'transparent',
                padding: '2px 8px',
                borderRadius: '4px',
                transform: 'translateY(-20px)'
              }}>
                {hero.name} (Lv{hero.level})
                {hero.isDead && ' 💀'}
              </div>
              
              {/* HP Bar - HIGH ABOVE sprite (same as idle) */}
              <div style={{
                width: '150px',
                height: '24px',
                backgroundColor: 'rgba(0,0,0,0.7)',
                border: '2px solid #4a5568',
                borderRadius: '4px',
                marginBottom: '20px',
                overflow: 'hidden',
                transform: 'translateY(-20px)'
              }}>
                <div style={{
                  width: `${hpPercent}%`,
                  height: '100%',
                  backgroundColor: hpPercent > 50 ? '#10b981' : hpPercent > 25 ? '#f59e0b' : '#ef4444',
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
                  textShadow: '1px 1px 2px rgba(0,0,0,1)'
                }}>
                  {Math.floor(hero.hp)} / {hero.maxHp}
                </div>
              </div>
              
              {/* Hero Sprite with ALL visual effects (shield, enrage) */}
              <div 
                style={{
                  display: 'inline-block',
                  // Combine filters if both shield and enrage are active!
                  filter: (() => {
                    const isEnraged = hero.enrageExpiry && hero.enrageExpiry > Date.now();
                    const filters = [];
                    
                    if (hasShield) {
                      filters.push('drop-shadow(0 0 12px rgba(59, 130, 246, 1))');
                      filters.push('drop-shadow(0 0 24px rgba(59, 130, 246, 0.7))');
                      filters.push('drop-shadow(0 0 36px rgba(59, 130, 246, 0.4))');
                    }
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
                />
              </div>
            </div>
          );
        })}
        
        {/* Raid Enemies (Wave mobs OR Boss) - SAME AS IDLE MODE */}
        {enemies.map((enemy, index) => {
          const position = getEnemyPosition(index, enemies.length, enemy.isBoss);
          const hpPercent = (enemy.hp / enemy.maxHp) * 100;
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
                    {Math.floor(enemy.hp).toLocaleString()} / {enemy.maxHp.toLocaleString()}
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
                  // Map enemy names to sprite folder names
                  const spriteMap: Record<string, string> = {
                    'Baby Dragon': 'Baby Dragon',
                    'Dragon Whelp': 'Dragon_1',
                    'Dragon Guardian': 'Dragon_2',
                    'Dragon Sentinel': 'Dragon_3',
                    'Elder Dragon': 'Elder Dragon' // MUST match getEnemyAnimationKey mapping!
                  };
                  const mappedType = spriteMap[enemy.name] || enemy.name;
                  
                  // console.log(`[Sprite Debug] Enemy: ${enemy.name} → Mapped: ${mappedType}`); // REMOVED - Too spammy!
                  
                  return (
                    <EnemySpriteJS
                      ref={getEnemySpriteRef(enemy.id)}
                      enemyId={enemy.id}
                      enemyType={mappedType}
                      enemyName={mappedType}
                      facing={mappedType.startsWith('Dragon_') ? 'left' : 'right'}
                      scale={enemy.isBoss ? 12.0 : mappedType.startsWith('Dragon_') ? 6.0 : 3.0}
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
    <div style={{
      width: '1920px',
      height: '1080px',
      background: 'transparent',
      position: 'relative',
      overflow: 'hidden',
      opacity: fadeOpacity,
      transition: 'opacity 0.5s ease-in-out'
    }}>
      {/* Debug info (top-left corner) */}
      {/* Debug info + test controls */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        color: 'white',
        fontSize: '14px',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: '8px',
        borderRadius: '4px',
        zIndex: 1000
      }}>
        <div>Battlefield: {battlefieldId}</div>
        <div>Heroes: {heroes?.length || 0} {testHealer && '(+1 Test Healer)'}</div>
        <div>Enemies: {enemies?.length || 0}</div>
        <div style={{ 
          color: (waveCount % 10 === 0) ? '#ffd700' : 'white',
          fontSize: (waveCount % 10 === 0) ? '18px' : '14px',
          fontWeight: (waveCount % 10 === 0) ? 'bold' : 'normal'
        }}>
          Wave: {waveCount} {(waveCount % 10 === 0) && '👑 BOSS WAVE'}
        </div>
        <div style={{ color: inCombat ? '#ef4444' : '#10b981' }}>
          {inCombat ? '⚔️ COMBAT' : '✅ Idle'}
        </div>
        <div style={{ 
          color: difficultyModifier > 1.0 ? '#fbbf24' : difficultyModifier >= 1.0 ? '#10b981' : difficultyModifier >= 0.7 ? '#fbbf24' : '#ef4444'
        }}>
          Difficulty: {(difficultyModifier * 100).toFixed(0)}% {difficultyModifier > 1.0 && '🔥'} ({consecutiveWins} wins)
        </div>
        <div style={{ fontSize: '12px', marginTop: '5px' }}>
          Shields: {allHeroes.filter(h => (h.shield || 0) > 0).map(h => `${h.name}:${h.shield}`).join(', ') || 'None'}
        </div>
        <div style={{ fontSize: '12px', marginTop: '5px' }}>
          Avg Gear Score: {calculateAverageGearScore(heroes)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '10px' }}>
          <button
            onClick={toggleTestHealer}
            style={{
              padding: '5px 10px',
              background: testHealer ? '#ef4444' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {testHealer ? '❌ Remove Test Healer' : '➕ Add Test Healer'}
          </button>
          <button
            onClick={addTestShield}
            style={{
              padding: '5px 10px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🛡️ Add Shield (+500)
          </button>
          <button
            onClick={addTestHpRegen}
            style={{
              padding: '5px 10px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            💚 Add HP Regen (+10/sec)
          </button>
        </div>
        
        {/* Test buttons */}
        <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexDirection: 'column' }}>
          <button
            onClick={() => {
              // Spawn test enemies (1-3)
              const testEnemies: Enemy[] = [
                {
                  id: 'test-enemy-1',
                  name: 'Kobold Warrior',
                  level: 5,
                  hp: 150,
                  maxHp: 150,
                  isBoss: false
                }
              ];
              setEnemies(testEnemies);
              console.log('[Test] Spawned 1 test enemy');
            }}
            style={{
              padding: '4px 8px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Test: Spawn 1 Enemy
          </button>
          
          <button
            onClick={() => {
              const testEnemies: Enemy[] = [
                {
                  id: 'test-enemy-1',
                  name: 'Werewolf',
                  level: 8,
                  hp: 300,
                  maxHp: 300,
                  isBoss: false
                },
                {
                  id: 'test-enemy-2',
                  name: 'Skeleton Mage',
                  level: 10,
                  hp: 250,
                  maxHp: 250,
                  isBoss: false
                },
                {
                  id: 'test-enemy-3',
                  name: 'Witch',
                  level: 12,
                  hp: 280,
                  maxHp: 280,
                  isBoss: false
                }
              ];
              setEnemies(testEnemies);
              console.log('[Test] Spawned 3 test enemies');
            }}
            style={{
              padding: '4px 8px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Test: Spawn 3 Enemies
          </button>
          
          <button
            onClick={() => {
              const testEnemies: Enemy[] = [
                {
                  id: 'test-boss-1',
                  name: 'Adult Dragon',
                  level: 35,
                  hp: 1500,
                  maxHp: 1500,
                  isBoss: true
                }
              ];
              setEnemies(testEnemies);
              console.log('[Test] Spawned boss enemy');
            }}
            style={{
              padding: '4px 8px',
              backgroundColor: '#fbbf24',
              color: 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Test: Spawn Boss
          </button>
          
          <button
            onClick={() => {
              setEnemies([]);
              setInCombat(false);
              console.log('[Test] Cleared enemies and reset combat state');
            }}
            style={{
              padding: '4px 8px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Clear Enemies
          </button>
        </div>
      </div>

      {/* Heroes (including test healer) */}
      {allHeroes && allHeroes.map((hero, index) => {
        const position = getHeroPosition(hero, index, heroes);
        const hpPercent = (hero.hp / hero.maxHp) * 100;
        
        // Force remount ONLY when resurrected (not on HP change!)
        const spriteKey = hero.isDead ? `${hero.id}-dead` : `${hero.id}-alive`;

        const hasShield = (hero.shield || 0) > 0;
        
        // Debug shield state
        if (hasShield) {
          console.log(`[Shield Debug] ${hero.name} has ${hero.shield} shield - applying has-shield class`);
        }

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
            {/* Hero Name - HIGH ABOVE sprite */}
            <div style={{
              color: hero.isDead ? '#ef4444' : 'white',
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '8px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
              backgroundColor: 'transparent',
              padding: '2px 8px',
              borderRadius: '4px',
              transform: 'translateY(-20px)' // Move UP by 20px
            }}>
              {hero.name} (Lv{hero.level})
              {hero.isDead && ' 💀'}
            </div>

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
                transform: 'translateY(-20px)' // Move UP to match name/HP
              }}>
                ✨ Resurrecting in {Math.ceil(resurrectionTimers[hero.id] / 1000)}s
              </div>
            )}

            {/* HP Bar - HIGH ABOVE sprite */}
            <div style={{
              width: '150px',
              height: '24px',
              backgroundColor: 'rgba(0,0,0,0.7)',
              border: '2px solid #4a5568',
              borderRadius: '4px',
              marginBottom: '20px',
              overflow: 'hidden',
              transform: 'translateY(-20px)' // Move UP by 20px to match name
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
                width: '150px',
                textAlign: 'center',
                marginTop: '-18px',
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px rgba(0,0,0,1)'
              }}>
                {Math.floor(hero.hp)} / {hero.maxHp}
              </div>
            </div>

            {/* Hero Sprite - Wrap in div for shield glow and enrage effect */}
            <div className={`${hasShield ? 'has-shield' : ''} ${hero.enrageExpiry && hero.enrageExpiry > Date.now() ? 'is-enraged' : ''}`}>
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

            {/* Role Label (optional - can remove later) */}
            <div style={{
              color: 'white',
              fontSize: '12px',
              marginTop: '8px',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              backgroundColor: 'rgba(0,0,0,0.5)',
              padding: '2px 6px',
              borderRadius: '4px'
            }}>
              {hero.role}
            </div>
          </div>
        );
      })}

      {/* Enemies */}
      {enemies && enemies.map((enemy, index) => {
        const position = getEnemyPosition(index, enemies.length);
        const hpPercent = (enemy.hp / enemy.maxHp) * 100;
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
              backgroundColor: 'rgba(0,0,0,0.5)',
              padding: '2px 8px',
              borderRadius: '4px'
            }}>
              {enemy.isBoss && '👑 '}{enemy.name} (Lv{enemy.level})
            </div>

            {/* HP Bar */}
            <div style={{
              width: '150px',
              height: '20px',
              backgroundColor: 'rgba(0,0,0,0.7)',
              border: enemy.isBoss ? '2px solid #fbbf24' : '2px solid #7f1d1d',
              borderRadius: '4px',
              marginBottom: '8px',
              overflow: 'hidden'
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
                width: '150px',
                textAlign: 'center',
                marginTop: '-18px',
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px rgba(0,0,0,1)'
              }}>
                {Math.floor(enemy.hp)} / {enemy.maxHp}
              </div>
            </div>

            {/* Enemy Sprite - Wrap in div for shield glow */}
            <div className={hasShield ? 'has-shield' : ''}>
              <EnemySpriteJS
                ref={getEnemySpriteRef(enemy.id)}
                enemyId={enemy.id}
                enemyType={enemy.name}
                enemyName={enemy.name}
                facing={getFacingDirection(enemy.name, 'left')}
                scale={3.0}
                isTransformed={enemy.isTransformed || false}
              />
            </div>
          </div>
        );
      })}

      {/* Travel Text Overlay */}
      {isTraveling && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          fontSize: '64px',
          fontWeight: 'bold',
          textShadow: '4px 4px 8px rgba(0,0,0,0.9), 0 0 20px rgba(255,255,255,0.3)',
          animation: 'travel-fade 4.5s ease-in-out',
          zIndex: 9998,
          pointerEvents: 'none'
        }}>
          🚶 Travelling...
        </div>
      )}

      {/* Test Buttons (Top-left corner) */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        zIndex: 10000,
        display: 'flex',
        gap: '10px'
      }}>
        <button
          onClick={testLevelUp}
          style={{
            padding: '8px 16px',
            background: '#fbbf24',
            color: 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px'
          }}
        >
          ⬆️ Test Level Up
        </button>
      </div>

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
