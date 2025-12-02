/**
 * Full IdleDnD Combat Engine for Browser Source
 * Extracted from IdleDnD/game.js
 * Runs full combat logic in the browser without backend calls
 * 
 * Now uses simplified monolithic structure matching Electron app
 */

import { resolveCombat as resolveCombatSimple, startCombat as startCombatSimple } from './combat/combatEngine';
// Note: checkCombatVictory is implemented in this file, not imported
import { AdventureEngine } from './adventureEngine';
import { getHeroSpriteType, getEnemySpriteType, getAnimationDuration } from './animationDurations';
import { generateEnemiesForCombat } from './enemyGeneration';
import { getCharacterStats, calculateSkillBonuses } from './combatUtils';
import { processDebuffs, processHpRegeneration } from './combat/buffsDebuffs';
import { ENEMY_SPRITES } from './enemySpriteConfig';
import { createProjectile } from './projectiles';
import { testLog } from './testLogging';

// ============================================================================
// CONSTANTS
// ============================================================================

export const ROLE_CONFIG: Record<string, any> = {
  // TANKS
  guardian: { icon: '🛡️', baseHp: 220, baseAttack: 8, baseDefense: 18, hpPerLevel: 35, attackPerLevel: 2, defensePerLevel: 6, displayName: 'Shield Guardian', category: 'tank', color: '#1e40af' },
  paladin: { icon: '✨', baseHp: 200, baseAttack: 10, baseDefense: 16, hpPerLevel: 32, attackPerLevel: 3, defensePerLevel: 5, displayName: 'Holy Defender', category: 'tank', color: '#f0e68c' },
  warden: { icon: '🌿', baseHp: 210, baseAttack: 9, baseDefense: 15, hpPerLevel: 34, attackPerLevel: 2, defensePerLevel: 5, displayName: 'Wild Warden', category: 'tank', color: '#22543d' },
  bloodknight: { icon: '🩸', baseHp: 205, baseAttack: 11, baseDefense: 14, hpPerLevel: 33, attackPerLevel: 3, defensePerLevel: 4, displayName: 'Blood Knight', category: 'tank', color: '#7f1d1d' },
  vanguard: { icon: '⚡', baseHp: 190, baseAttack: 12, baseDefense: 15, hpPerLevel: 30, attackPerLevel: 3, defensePerLevel: 5, displayName: 'Agile Vanguard', category: 'tank', color: '#c7d2fe' },
  brewmaster: { icon: '🍺', baseHp: 215, baseAttack: 8, baseDefense: 17, hpPerLevel: 35, attackPerLevel: 2, defensePerLevel: 6, displayName: 'Brewed Monk', category: 'tank', color: '#92400e' },
  
  // HEALERS
  cleric: { icon: '💚', baseHp: 115, baseAttack: 6, baseDefense: 9, hpPerLevel: 16, attackPerLevel: 1, defensePerLevel: 2, displayName: 'Cleric', category: 'healer', color: '#10b981' },
  atoner: { icon: '⚖️', baseHp: 110, baseAttack: 8, baseDefense: 8, hpPerLevel: 15, attackPerLevel: 2, defensePerLevel: 2, displayName: 'Atoner', category: 'healer', color: '#fbbf24' },
  druid: { icon: '🌱', baseHp: 105, baseAttack: 5, baseDefense: 7, hpPerLevel: 14, attackPerLevel: 1, defensePerLevel: 1, displayName: 'Restoration Druid', category: 'healer', color: '#059669' },
  lightbringer: { icon: '☀️', baseHp: 120, baseAttack: 7, baseDefense: 10, hpPerLevel: 17, attackPerLevel: 1, defensePerLevel: 3, displayName: 'Lightbringer', category: 'healer', color: '#fde047' },
  shaman: { icon: '🔱', baseHp: 110, baseAttack: 6, baseDefense: 8, hpPerLevel: 15, attackPerLevel: 1, defensePerLevel: 2, displayName: 'Spirit Healer', category: 'healer', color: '#0891b2' },
  mistweaver: { icon: '🌫️', baseHp: 108, baseAttack: 7, baseDefense: 7, hpPerLevel: 14, attackPerLevel: 2, defensePerLevel: 1, displayName: 'Mistweaver', category: 'healer', color: '#6ee7b7' },
  chronomancer: { icon: '⏰', baseHp: 102, baseAttack: 5, baseDefense: 6, hpPerLevel: 13, attackPerLevel: 1, defensePerLevel: 1, displayName: 'Chronomender', category: 'healer', color: '#a78bfa' },
  bard: { icon: '🎵', baseHp: 107, baseAttack: 7, baseDefense: 8, hpPerLevel: 15, attackPerLevel: 2, defensePerLevel: 2, displayName: 'Bard', category: 'healer', color: '#d97706' },
  
  // MELEE DPS
  berserker: { icon: '⚔️', baseHp: 130, baseAttack: 16, baseDefense: 5, hpPerLevel: 20, attackPerLevel: 5, defensePerLevel: 1, displayName: 'Berserker', category: 'dps', color: '#dc2626' },
  crusader: { icon: '🗡️', baseHp: 140, baseAttack: 15, baseDefense: 6, hpPerLevel: 22, attackPerLevel: 5, defensePerLevel: 2, displayName: 'Crusader', category: 'dps', color: '#fcd34d' },
  assassin: { icon: '🗝️', baseHp: 120, baseAttack: 18, baseDefense: 4, hpPerLevel: 18, attackPerLevel: 6, defensePerLevel: 1, displayName: 'Assassin', category: 'dps', color: '#4b5563' },
  reaper: { icon: '💀', baseHp: 125, baseAttack: 16, baseDefense: 5, hpPerLevel: 19, attackPerLevel: 6, defensePerLevel: 1, displayName: 'Reaper', category: 'dps', color: '#1f2937' },
  bladedancer: { icon: '💃', baseHp: 122, baseAttack: 17, baseDefense: 4, hpPerLevel: 19, attackPerLevel: 6, defensePerLevel: 1, displayName: 'Blade Dancer', category: 'dps', color: '#ec4899' },
  monk: { icon: '🥋', baseHp: 128, baseAttack: 15, baseDefense: 5, hpPerLevel: 20, attackPerLevel: 5, defensePerLevel: 1, displayName: 'Chi Fighter', category: 'dps', color: '#f97316' },
  stormwarrior: { icon: '⚡', baseHp: 135, baseAttack: 14, baseDefense: 6, hpPerLevel: 21, attackPerLevel: 5, defensePerLevel: 1, displayName: 'Storm Warrior', category: 'dps', color: '#0ea5e9' },
  hunter: { icon: '🏹', baseHp: 125, baseAttack: 16, baseDefense: 5, hpPerLevel: 19, attackPerLevel: 6, defensePerLevel: 1, displayName: 'Beast Stalker', category: 'dps', color: '#84cc16' },
  
  // RANGED DPS
  mage: { icon: '🔮', baseHp: 120, baseAttack: 19, baseDefense: 3, hpPerLevel: 17, attackPerLevel: 6, defensePerLevel: 1, displayName: 'Elementalist', category: 'dps', color: '#7c3aed' },
  warlock: { icon: '😈', baseHp: 123, baseAttack: 18, baseDefense: 4, hpPerLevel: 18, attackPerLevel: 6, defensePerLevel: 1, displayName: 'Warlock', category: 'dps', color: '#581c87' },
  necromancer: { icon: '💀', baseHp: 121, baseAttack: 17, baseDefense: 4, hpPerLevel: 18, attackPerLevel: 6, defensePerLevel: 1, displayName: 'Necromancer', category: 'dps', color: '#6b2158' },
  ranger: { icon: '🏹', baseHp: 127, baseAttack: 17, baseDefense: 5, hpPerLevel: 19, attackPerLevel: 6, defensePerLevel: 1, displayName: 'Marksman', category: 'dps', color: '#065f46' },
  shadowpriest: { icon: '🌑', baseHp: 125, baseAttack: 16, baseDefense: 4, hpPerLevel: 18, attackPerLevel: 6, defensePerLevel: 1, displayName: 'Dark Oracle', category: 'dps', color: '#374151' },
  mooncaller: { icon: '🌙', baseHp: 122, baseAttack: 17, baseDefense: 4, hpPerLevel: 18, attackPerLevel: 6, defensePerLevel: 1, displayName: 'Mooncaller', category: 'dps', color: '#818cf8' },
  stormcaller: { icon: '⛈️', baseHp: 125, baseAttack: 18, baseDefense: 4, hpPerLevel: 18, attackPerLevel: 6, defensePerLevel: 1, displayName: 'Stormcaller', category: 'dps', color: '#0284c7' },
  frostmage: { icon: '❄️', baseHp: 119, baseAttack: 19, baseDefense: 3, hpPerLevel: 17, attackPerLevel: 6, defensePerLevel: 1, displayName: 'Frost Invoker', category: 'dps', color: '#67e8f9' },
  firemage: { icon: '🔥', baseHp: 118, baseAttack: 20, baseDefense: 3, hpPerLevel: 17, attackPerLevel: 6, defensePerLevel: 1, displayName: 'Pyroclast', category: 'dps', color: '#f97316' },
  dragonsorcerer: { icon: '🐉', baseHp: 117, baseAttack: 20, baseDefense: 3, hpPerLevel: 17, attackPerLevel: 6, defensePerLevel: 1, displayName: 'Draconic Sorcerer', category: 'dps', color: '#ea580c' }
};

export const DEBUFFS: Record<string, any> = {
  weaken: { name: 'Weakened', icon: '💔', duration: 10000, effect: 'attackReduction', value: 0.3, description: 'Attack reduced by 30%', color: '#9b59b6' },
  vulnerable: { name: 'Vulnerable', icon: '🛡️💥', duration: 8000, effect: 'defenseReduction', value: 0.4, description: 'Defense reduced by 40%', color: '#e74c3c' },
  poison: { name: 'Poisoned', icon: '☠️', duration: 12000, effect: 'damageOverTime', value: 5, tickRate: 2000, description: '5 damage every 2 seconds', color: '#27ae60' },
  corruption: { name: 'Corruption', icon: '😈', duration: 15000, effect: 'damageOverTime', value: 0, tickRate: 2000, description: 'Corruption damage over time', color: '#8e44ad' },
  bleed: { name: 'Bleeding', icon: '🩸', duration: 10000, effect: 'damageOverTime', value: 3, tickRate: 2000, description: '3 damage every 2 seconds', color: '#c0392b' },
  stunned: { name: 'Stunned', icon: '💫', duration: 3000, effect: 'skipTurn', value: 1, description: 'Cannot act', color: '#f39c12' },
  cursed: { name: 'Cursed', icon: '😈', duration: 8000, effect: 'healingReduction', value: 0.5, description: 'Healing received reduced by 50%', color: '#7d3c98' }
};

export const EQUIPMENT_SLOTS = ['weapon', 'armor', 'accessory', 'helm', 'cloak', 'gloves', 'ring1', 'ring2', 'boots'];
export const TANK_EQUIPMENT_SLOTS = ['weapon', 'armor', 'accessory', 'shield', 'helm', 'cloak', 'gloves', 'ring1', 'ring2', 'boots'];

// Shop items - matches Electron app line 17248-17253
export const SHOP_ITEMS: Record<string, { name: string; cost: number; description: string; type: string }> = {
  healthpotion: { name: 'Health Potion', cost: 10, description: 'Auto-heal when HP < 30%', type: 'potion' },
  xpboost: { name: 'XP Boost Scroll', cost: 25, description: '+50% XP for 5min combat time', type: 'buff' },
  attackbuff: { name: 'Sharpening Stone', cost: 50, description: '+10% ATK for 10min combat time', type: 'buff' },
  defensebuff: { name: 'Armor Polish', cost: 50, description: '+10% DEF for 10min combat time', type: 'buff' }
};

// Gathering chances - matches Electron app lines 9186-9191
export const HERB_GATHER_CHANCES = {
  common: 0.70,    // 70%
  uncommon: 0.20,  // 20%
  rare: 0.08,      // 8%
  epic: 0.02       // 2%
};

// ============================================================================
// TYPES
// ============================================================================

export interface Hero {
  id?: string;
  username: string;
  role: string;
  level: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  isDead?: boolean;
  activeDebuffs?: Record<string, any>;
  activeBuffs?: Record<string, any>;
  cooldowns?: Record<string, number>;
  classAbilityState?: any;
  equipment?: Record<string, any>;
  enchantedItems?: any[];
  skills?: Record<string, any>;
  stats?: any;
  lastStandActive?: boolean;
  lastBigHit?: number;
  shield?: any;
  staggerDoT?: number;
  staggerLastTick?: number;
  deathTime?: number;
  deathAnimationPlaying?: boolean;
  activeProcBuffs?: Record<string, number>;
  activeThreatMod?: number;
  strength?: number;
  dexterity?: number;
  intellect?: number;
  wisdom?: number;
  stamina?: number;
  healingPower?: number;
  spellDamage?: number;
  meleeDamage?: number;
  guildId?: string;
  gold?: number;
  potions?: { health: number };
  autoBuy?: boolean; // Auto-buy enabled flag
  xp?: number;
  maxXp?: number;
  profession?: { 
    type: string;
    level?: number;
    materials?: {
      herbs?: { common: number; uncommon: number; rare: number; epic: number };
      ore?: { iron: number; steel: number; mithril: number; adamantite: number };
      essence?: number;
    };
    totalGathered?: number;
    lastGatherTime?: number;
  };
}

export interface Enemy {
  id: number | string;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  isDead?: boolean;
  isBoss?: boolean;
  isAnimated?: boolean;
  activeDebuffs?: Record<string, any>;
  initiative?: number;
  level?: number;
  xp?: number;
}

export interface CombatState {
  heroes: Map<string, Hero> | Hero[];
  currentEnemies: Enemy[];
  inCombat: boolean;
  isPaused?: boolean;
  editModePausedCombat?: boolean;
  combatEnding?: boolean;
  combatAnimationActive?: boolean;
  currentCombatWave?: number;
  maxCombatWaves?: number;
  combatMetrics?: any;
  initiativeOrder?: any[];
  viewerCount?: number;
  difficultyModifier?: number;
  waveCount?: number; // Adventure loop wave counter
  isAdventuring?: boolean; // Adventure loop active flag
  consecutiveWipes?: number; // Track consecutive fights with deaths
  resolvingCombat?: boolean; // Guard flag to prevent duplicate resolveCombat() calls
  isCombatStarting?: boolean; // Guard flag to prevent duplicate startCombat() calls
}

export type AnimationCallback = (entityId: string, animation: 'idle' | 'attack' | 'hurt' | 'death' | 'heal', isHero: boolean) => void;
export type LogCallback = (type: string, message: string) => void;
export type CombatTextCallback = (entityId: string, amount: number, type: 'damage' | 'crit' | 'heal' | 'heal-hot' | 'dot', isHero: boolean) => void;

// ============================================================================
// COMBAT ENGINE
// ============================================================================

export class FullCombatEngine {
  private combatInterval: NodeJS.Timeout | null = null;
  private adventureInterval: NodeJS.Timeout | null = null;
  private debuffTickInterval: NodeJS.Timeout | null = null; // Interval for DoT/HoT ticks (every 2 seconds)
  private resurrectionCheckInterval: NodeJS.Timeout | null = null; // Interval to check for resurrection during combat
  // CRITICAL: Track all active intervals for comprehensive cleanup
  private activeIntervals = new Set<NodeJS.Timeout>();
  private animationCallbacks: AnimationCallback[] = [];
  private logCallbacks: LogCallback[] = [];
  private combatTextCallbacks: CombatTextCallback[] = [];
  private state: CombatState;
  private onEnemiesGenerated?: (enemies: Enemy[]) => void; // Callback when new enemies are generated
  private adventureEngine: AdventureEngine; // Simplified adventure engine
  
  /**
   * Helper function to safely convert heroes to an array
   * Handles array, Map, and plain object formats
   */
  private getHeroesArray(): Hero[] {
    if (Array.isArray(this.state.heroes)) {
      return this.state.heroes;
    } else if (this.state.heroes instanceof Map) {
      return Array.from(this.state.heroes.values());
    } else if (this.state.heroes && typeof this.state.heroes === 'object') {
      // Try Object.values for plain objects
      try {
        return Object.values(this.state.heroes as any);
      } catch {
        return [];
      }
    } else {
      // Fallback: return empty array if heroes is null/undefined or unexpected type
      return [];
    }
  }
  
  // Global guard to prevent multiple combat engines from running simultaneously
  // This is critical for React.StrictMode which mounts components twice in development
  private static globalInstance: FullCombatEngine | null = null;
  
  constructor(state: CombatState) {
    // CRITICAL: If another instance exists, stop it first
    // This prevents multiple engines from running simultaneously in React.StrictMode
    if (FullCombatEngine.globalInstance && FullCombatEngine.globalInstance !== this) {
      try {
        FullCombatEngine.globalInstance.stopCombat();
        FullCombatEngine.globalInstance.stopAdventure();
      } catch (e) {
        // Error stopping previous combat engine
      }
    }
    
    // Register this instance as the global one
    FullCombatEngine.globalInstance = this;
    
    this.state = state;
    // Initialize wave count if not set
    if (this.state.waveCount === undefined) {
      this.state.waveCount = 1;
    }
    if (this.state.isAdventuring === undefined) {
      this.state.isAdventuring = false;
    }
    // CRITICAL: Ensure combat is never paused for continuous gameplay
    // Always set pause flags to false at initialization - combat should run automatically
    this.state.isPaused = false;
    this.state.editModePausedCombat = false;
    // Initialize combat flags to allow automatic continuation
    if (this.state.resolvingCombat === undefined) {
      this.state.resolvingCombat = false;
    }
    if (this.state.isCombatStarting === undefined) {
      this.state.isCombatStarting = false;
    }

    // Initialize adventure engine
    this.adventureEngine = new AdventureEngine(this.state);
    this.adventureEngine.setOnEnemiesGenerated((enemies) => {
      if (this.onEnemiesGenerated) {
        this.onEnemiesGenerated(enemies);
      }
    });
    this.adventureEngine.setOnLog((type, message) => this.log(type, message));
    this.adventureEngine.setOnStartCombat(() => this.startCombat());
    this.adventureEngine.setOnEndAdventure(() => {
      this.state.isAdventuring = false;
    });
    this.adventureEngine.setOnCheckHeroResurrection(() => this.checkHeroResurrection());
    this.adventureEngine.setOnLevelUpHero((hero) => this.levelUpHero(hero));
    this.adventureEngine.setOnAutoBuyGear((hero) => this.autoBuyGearForHero(hero, hero.username));
    this.adventureEngine.setOnApplyBuff((username, hero, buffType) => this.applyBuff(username, hero, buffType));
  }
  
  /**
   * Set gathering callback for adventure engine
   */
  setOnGathering(callback: (heroId: string, heroName: string, material: string, amount: number) => void) {
    if (this.adventureEngine) {
      this.adventureEngine.setOnGathering(callback);
    }
  }
  
  /**
   * Set NPC encounter callback for adventure engine
   */
  setOnNPCEncounter(callback: (npcType: string, npcName: string) => void) {
    if (this.adventureEngine) {
      this.adventureEngine.setOnNPCEncounter(callback);
    }
  }
  
  // Set callback for when enemies are generated (so BrowserSourcePage can update state)
  setOnEnemiesGenerated(callback: (enemies: Enemy[]) => void) {
    this.onEnemiesGenerated = callback;
  }
  
  onAnimation(callback: AnimationCallback): () => void {
    this.animationCallbacks.push(callback);
    
    // Return cleanup function
    return () => {
      const index = this.animationCallbacks.indexOf(callback);
      if (index > -1) {
        this.animationCallbacks.splice(index, 1);
      }
    };
  }
  
  onLog(callback: LogCallback): () => void {
    this.logCallbacks.push(callback);
    
    // Return cleanup function
    return () => {
      const index = this.logCallbacks.indexOf(callback);
      if (index > -1) {
        this.logCallbacks.splice(index, 1);
      }
    };
  }
  
  onCombatText(callback: CombatTextCallback): () => void {
    this.combatTextCallbacks.push(callback);
    
    // Return cleanup function
    return () => {
      const index = this.combatTextCallbacks.indexOf(callback);
      if (index > -1) {
        this.combatTextCallbacks.splice(index, 1);
      }
    };
  }
  
  // ID resolution helper - match DOM element IDs
  private enemyElementId(enemy: Enemy | { id: any }): string {
    return `battle-enemy-${enemy.id}`;
  }
  
  private triggerAnimation(entityId: string, animation: 'idle' | 'attack' | 'hurt' | 'death' | 'heal', isHero: boolean) {
    this.animationCallbacks.forEach(cb => cb(entityId, animation, isHero));
  }
  
  /**
   * Public method to trigger animations (for testing)
   */
  public triggerAnimationForTest(entityId: string, animation: 'idle' | 'attack' | 'hurt' | 'death' | 'heal', isHero: boolean) {
    this.triggerAnimation(entityId, animation, isHero);
  }
  
  private triggerCombatText(entityId: string, amount: number, type: 'damage' | 'crit' | 'heal' | 'heal-hot' | 'dot', isHero: boolean) {
    this.combatTextCallbacks.forEach(cb => cb(entityId, amount, type, isHero));
  }
  
  private log(type: string, message: string) {
    this.logCallbacks.forEach(cb => cb(type, message));
  }
  
  startCombat() {
    testLog('Combat', 'Start Combat', 'startCombat() called');
    
    // Match Electron app: Clear any existing timeout and start fresh (game.js:10820)
    // Electron app clears the timeout and starts fresh, allowing startCombat() to be called multiple times
    // This is safe because resolveCombat uses setTimeout, not setInterval
    if (this.combatInterval) {
      clearTimeout(this.combatInterval);
      this.combatInterval = null;
      testLog('Combat', 'Start Combat', 'Cleared existing combatInterval');
    }
    
    // Clear the resolvingCombat flag when starting a new round
    // This allows the next round to start even if the previous one is still completing
    this.state.resolvingCombat = false;
    
    // Set flag to prevent duplicate calls during initialization
    if (this.state.isCombatStarting) {
      testLog('Combat', 'Start Combat', 'Already starting combat, skipping');
      return;
    }
    this.state.isCombatStarting = true;
    
    if (!this.state.currentEnemies || this.state.currentEnemies.length === 0) {
      testLog('Combat', 'Start Combat', 'No enemies available, cannot start combat');
      this.state.isCombatStarting = false;
      return;
    }
    
    if (this.state.isPaused || this.state.editModePausedCombat) {
      testLog('Combat', 'Start Combat', 'Combat is paused, will retry in 1s');
      setTimeout(() => this.startCombat(), 1000);
      return;
    }
    
    testLog('Combat', 'Start Combat', `Starting combat with ${this.state.currentEnemies.length} enemies`);
    
    // Reset all sprites to idle (only at combat start, not during rounds)
    // Pass the isCombatStarting flag before clearing it
    const isStarting = this.state.isCombatStarting;
    this.resetAllAnimations(isStarting);
    
    // Clear the starting flag when starting combat
    this.state.isCombatStarting = false;
    
    // Initialize combat metrics if not already set (matches Electron app line 10833-10843)
    if (!this.state.combatMetrics) {
      this.state.combatMetrics = {
        fightStartTime: 0,
        fightDamageTaken: 0,
        fightHealingDone: 0,
        fightDeaths: 0,
        recentFights: []
      };
    }
    
    // Reset combat metrics for new fight (matches Electron app line 10840-10843)
    const isNewBattle = !this.state.combatMetrics.fightStartTime;
    if (isNewBattle) {
      this.state.combatMetrics.fightStartTime = Date.now();
      this.state.combatMetrics.fightDamageTaken = 0;
      this.state.combatMetrics.fightHealingDone = 0;
      this.state.combatMetrics.fightDeaths = 0;
      
      // Clear stored initiative values for new battle
      // This ensures fresh initiative rolls for each new fight
      // Matches Electron app lines 10822-10829
      const heroes = this.getHeroesArray();
      heroes.forEach((hero) => {
        if (hero) {
          delete (hero as any).initiative; // Clear stored initiative
        }
      });
      
      if (this.state.currentEnemies) {
        this.state.currentEnemies.forEach((enemy) => {
          if (enemy) {
            delete enemy.initiative; // Clear stored initiative
          }
        });
      }
      
    }
    
    // DISABLED: Debuff tick interval
    // Debuffs are now processed once per combat round in resolveCombat() Phase 1
    // This prevents duplicate DoT damage and overlapping execution
    // this.startDebuffTickInterval();
    
    // Start resurrection check interval (check every 5 seconds during combat)
    // This ensures heroes can respawn even if combat loop has stopped due to party wipe
    this.startResurrectionCheckInterval();
    
    // Clear the isCombatStarting flag now that we're actually starting
    this.state.isCombatStarting = false;
    
    // Check for hero resurrection first (may bring heroes back to life)
    this.checkHeroResurrection();
    
    // Get heroes array once for use throughout this function
    const heroes = this.getHeroesArray();
    
    // Check for total party wipe (matches Electron app line 10882-10945)
    let aliveCount = 0;
    heroes.forEach((hero) => {
      if (hero && !hero.isDead && hero.hp > 0) {
        aliveCount++;
      }
    });
    
    if (aliveCount === 0) {
      // Total party wipe - adjust difficulty and end combat (matches Electron app line 10891-10945)
      const isBossFight = this.state.currentEnemies?.some((e: any) => e.isBoss) || false;
      this.log('death', `💀 TOTAL PARTY WIPE! ${isBossFight ? 'Boss' : 'Enemies'} too strong.`);
      this.log('system', '🚨 Difficulty reduced! Party will resurrect stronger.');
      
      // Calculate combat duration
      const combatDuration = this.state.combatMetrics?.fightStartTime 
        ? (Date.now() - this.state.combatMetrics.fightStartTime) / 1000 
        : 0;
      
      // Aggressive difficulty reduction for wipes (matches Electron app line 10897-10907)
      if (this.state.combatMetrics && this.state.combatMetrics.fightStartTime > 0) {
        const fightData = {
          duration: combatDuration,
          damageTaken: this.state.combatMetrics.fightDamageTaken || 0,
          healingDone: this.state.combatMetrics.fightHealingDone || 0,
          deaths: this.state.combatMetrics.fightDeaths || 0,
          isBoss: isBossFight
        };
        
        // Call adjust difficulty with wipe data (matches Electron app line 10907)
        this.adjustDifficulty(fightData);
      }
      
      // Clear enemies (matches Electron app line 10912-10913)
      this.state.currentEnemies = [];
      this.stopCombat();
      
      // Reset combat metrics (matches Electron app line 10943)
      if (this.state.combatMetrics) {
        this.state.combatMetrics.fightStartTime = 0;
      }
      
      return; // Don't resolve combat, party wiped (matches Electron app line 10945)
    }
    
    // Check if we have alive enemies before processing combat
    // Don't filter out dead enemies - checkCombatVictory() will handle filtering after all damage is applied
    const aliveBeforeRound = this.state.currentEnemies?.filter(e => e.hp > 0 && !e.isDead).length || 0;
    
    if (!this.state.currentEnemies || this.state.currentEnemies.length === 0) {
      this.stopCombat();
      return;
    }
    
    // If no alive enemies, check victory instead of processing combat
    if (aliveBeforeRound === 0) {
      this.checkCombatVictory();
      return;
    }
    
    // Check if combat is already resolving - if so, skip this tick to prevent sync issues
    if (this.state.resolvingCombat) {
      testLog('Combat', 'Start Combat', 'Combat already resolving, skipping duplicate call');
      return;
    }
    
    // CRITICAL: Set resolvingCombat flag BEFORE calling resolveCombatSimple
    // This prevents multiple concurrent calls that would clear activeEnemyAttacks
    this.state.resolvingCombat = true;
    testLog('Combat', 'Start Combat', 'Set resolvingCombat=true to prevent duplicate calls');
    
    // Use simplified startCombat which directly calls resolveCombat
    // startCombat expects: (state, heroes, enemies, callbacks)
    const enemies = this.state.currentEnemies || [];
    
    startCombatSimple(
      this.state,
      heroes,
      enemies,
      {
        trackDeath: () => {
          if (this.state.combatMetrics) {
            this.state.combatMetrics.fightDeaths = (this.state.combatMetrics.fightDeaths || 0) + 1;
          }
        },
        log: (type: string, message: string, username?: string) => this.log(type, message),
        triggerAnimation: (entityId: string, animation: string, isHero: boolean) =>
          this.triggerAnimation(entityId, animation as any, isHero),
        triggerHealAnimation: (username: string) => this.triggerAnimation(username, 'heal', true),
        triggerCombatText: (entityId: string, amount: number, type: 'damage' | 'crit' | 'heal' | 'heal-hot' | 'dot', isHero: boolean) =>
          this.triggerCombatText(entityId, amount, type, isHero),
        updateEnemyHealthBar: () => {},
        updateHeroUI: () => {}
      }
    );
    
    // After starting combat, immediately call resolveCombat to process the first round
    resolveCombatSimple(
      this.state,
      Date.now(),
      {
        trackDeath: () => {
          if (this.state.combatMetrics) {
            this.state.combatMetrics.fightDeaths = (this.state.combatMetrics.fightDeaths || 0) + 1;
          }
        },
        log: (type: string, message: string, username?: string) => this.log(type, message),
        triggerAnimation: (entityId: string, animation: string, isHero: boolean) =>
          this.triggerAnimation(entityId, animation as any, isHero),
        triggerHealAnimation: (username: string) => this.triggerAnimation(username, 'heal', true),
        triggerCombatText: (entityId: string, amount: number, type: 'damage' | 'crit' | 'heal' | 'heal-hot' | 'dot', isHero: boolean) =>
          this.triggerCombatText(entityId, amount, type, isHero),
        updateEnemyHealthBar: () => {},
        updateHeroUI: () => {}
      },
      getCharacterStats,
      calculateSkillBonuses,
      (enemy: Enemy, damage: number) => this.applyEnemyDamage(enemy, damage),
      getHeroSpriteType,
      getEnemySpriteType,
      getAnimationDuration,
      () => {
        // Clear flags when resolveCombat completes
        // This allows checkCombatVictory to call startCombat() again if enemies are alive
        this.state.isCombatStarting = false;
        this.state.resolvingCombat = false;
        testLog('Combat', 'Start Combat', 'Combat round completed - cleared resolvingCombat flag');
        // checkCombatVictory will call startCombat() again if enemies are alive
        this.checkCombatVictory();
      }
    );
  }
  
  stopCombat() {
    testLog('Combat', 'Stop Combat', 'stopCombat() called - clearing intervals and flags');
    
    // CRITICAL: Clear all tracked intervals for comprehensive cleanup
    this.activeIntervals.forEach(interval => {
      clearInterval(interval);
      clearTimeout(interval);
    });
    this.activeIntervals.clear();
    
    if (this.combatInterval) {
      clearTimeout(this.combatInterval);
      this.combatInterval = null;
      testLog('Combat', 'Stop Combat', 'Cleared combatInterval');
    }
    
    // Also stop adventure loop to prevent new encounters
    if (this.adventureInterval) {
      clearInterval(this.adventureInterval);
      this.adventureInterval = null;
      testLog('Combat', 'Stop Combat', 'Cleared adventureInterval');
    }
    
    // Clear the starting flag when stopping combat
    this.state.isCombatStarting = false;
    // Clear resolvingCombat flag
    this.state.resolvingCombat = false;
    // Set inCombat to false
    this.state.inCombat = false;
    testLog('Combat', 'Stop Combat', 'Set inCombat=false, isCombatStarting=false, resolvingCombat=false');
    // Stop DoT/HoT tick interval when combat stops
    this.stopDebuffTickInterval();
    // Stop resurrection check interval when combat stops (but only if no enemies remain)
    // If enemies are still alive, keep checking for resurrection
    
    // Clear global instance if this is the current one
    if (FullCombatEngine.globalInstance === this) {
      FullCombatEngine.globalInstance = null;
    }
    const hasAliveEnemies = this.state.currentEnemies && 
      this.state.currentEnemies.some(e => e.hp > 0 && !e.isDead);
    if (!hasAliveEnemies) {
      this.stopResurrectionCheckInterval();
    }
    
    // Reset animations to idle when combat stops (except death animations)
    // Only reset if combat is actually ending (not just pausing)
    const heroes = this.getHeroesArray();
    heroes.forEach(hero => {
      if (hero && !hero.deathAnimationPlaying) {
        // Only reset to idle if not playing death animation
        const heroId = hero.id || hero.username || hero.name || hero.characterName;
        if (heroId) {
          this.triggerAnimation(`battle-hero-${heroId}`, 'idle', true);
        }
      }
    });
    
    // Reset enemy animations to idle
    if (this.state.currentEnemies) {
      this.state.currentEnemies.forEach((enemy: any) => {
        if (enemy && !enemy.isDead) {
          this.triggerAnimation(this.enemyElementId(enemy), 'idle', false);
        }
      });
    }
  }
  
  /**
   * Get current combat state (for debugging)
   */
  getState(): CombatState {
    return this.state;
  }
  
  /**
   * Validate and auto-correct combat state inconsistencies
   * This ensures HP and isDead flags are always consistent
   */
  private validateCombatState(): void {
    const heroes = this.getHeroesArray();
    const enemies = this.state.currentEnemies || [];
    
    // Validate heroes
    heroes.forEach(hero => {
      if (!hero) return;
      
      // Ensure HP is an integer
      hero.hp = Math.floor(hero.hp || 0);
      
      // Auto-correct inconsistencies
      if (hero.isDead && hero.hp > 0) {
        // Hero is marked dead but has HP - correct the state
        hero.isDead = false;
        hero.deathTime = undefined;
        hero.deathAnimationPlaying = false;
      }
      
      if (!hero.isDead && hero.hp <= 0) {
        // Hero has no HP but isn't marked dead - mark as dead
        hero.hp = 0;
        hero.isDead = true;
        hero.deathTime = hero.deathTime || Date.now();
        // Don't trigger death animation here - it should have been triggered when HP dropped
      }
    });
    
    // Validate enemies
    enemies.forEach(enemy => {
      if (!enemy) return;
      
      // Ensure HP is an integer
      enemy.hp = Math.floor(enemy.hp || 0);
      
      // CRITICAL: Auto-correct inconsistencies - only mark as dead if HP is EXACTLY 0
      // If enemy is marked dead but has HP > 0, correct the state (enemy should not be dead)
      if (enemy.isDead && enemy.hp > 0) {
        // Enemy is marked dead but has HP - correct the state
        enemy.isDead = false;
      }
      
      // CRITICAL: Only mark as dead if HP is EXACTLY 0, never if HP > 0
      // This prevents marking enemies as dead when they still have HP
      if (!enemy.isDead && enemy.hp === 0) {
        // Enemy has no HP but isn't marked dead - mark as dead
        enemy.isDead = true;
        enemy.activeDebuffs = {};
        // Do NOT trigger death animation here - animation should only trigger when damage is applied
      }
    });
  }
  
  /**
   * Start DoT/HoT tick interval - ticks every 2 seconds during combat
   * Matches Electron app: processDebuffs called every second (line 8508)
   * Reference: E:\IdleDnD\game.js lines 8504-8509
   */
  private startDebuffTickInterval() {
    if (this.debuffTickInterval) {
      return; // Already running
    }
    
    // Tick DoTs/HoTs every 2 seconds (matches DoT tickRate)
    // Electron app ticks every 1 second, but DoTs tick every 2 seconds (tickRate)
    // DISABLED: Debuff processing moved to resolveCombat() Phase 1
    // This prevents duplicate DoT damage and ensures sequential execution
    // Debuffs are processed once per combat round, not on an interval
    /*
    this.debuffTickInterval = setInterval(() => {
      if (!this.state.currentEnemies || this.state.currentEnemies.length === 0) {
        // No enemies - stop ticking
        this.stopDebuffTickInterval();
        return;
      }
      
      if (this.state.isPaused || this.state.editModePausedCombat) {
        return; // Don't tick when paused
      }
      
      const now = Date.now();
      // Process debuffs (DoT ticks) - uses the modular combat engine's processDebuffs
      // Import it from the combat module
      this.processDebuffsDuringCombat(now);
    }, 2000); // Every 2 seconds (matches DoT tickRate)
    */
  }
  
  /**
   * Stop DoT/HoT tick interval
   */
  private stopDebuffTickInterval() {
    if (this.debuffTickInterval) {
      clearInterval(this.debuffTickInterval);
      this.debuffTickInterval = null;
    }
  }
  
  /**
   * Start resurrection check interval - checks every 5 seconds during combat
   * This ensures heroes can respawn and resume combat even after party wipe
   */
  private startResurrectionCheckInterval() {
    if (this.resurrectionCheckInterval) {
      return; // Already running
    }
    
    this.resurrectionCheckInterval = setInterval(() => {
      // Only check if enemies are present (combat scenario)
      if (!this.state.currentEnemies || this.state.currentEnemies.length === 0) {
        this.stopResurrectionCheckInterval();
        return;
      }
      
      // Check for resurrection (will resume combat if heroes respawn)
      this.checkHeroResurrection();
    }, 5000); // Check every 5 seconds
    
    // Track interval for cleanup
    if (this.resurrectionCheckInterval) {
      this.activeIntervals.add(this.resurrectionCheckInterval);
    }
  }
  
  /**
   * Stop resurrection check interval
   */
  private stopResurrectionCheckInterval() {
    if (this.resurrectionCheckInterval) {
      clearInterval(this.resurrectionCheckInterval);
      this.resurrectionCheckInterval = null;
    }
  }
  
  /**
   * Process debuffs during combat (DoT ticks)
   * This is called every 2 seconds during combat to tick DoTs
   * Uses the modular combat engine's processDebuffs function
   * Matches Electron app: processDebuffs called every second (line 8508)
   */
  private processDebuffsDuringCombat(now: number) {
    const heroes = this.getHeroesArray();
    const enemies = this.state.currentEnemies || [];
    
    // Create callbacks for processDebuffs
    const callbacks = {
      log: (type: string, message: string) => this.log(type, message),
      triggerAnimation: (entityId: string, animation: 'idle' | 'attack' | 'hurt' | 'death' | 'heal', isHero: boolean) => 
        this.triggerAnimation(entityId, animation, isHero),
      triggerCombatText: (entityId: string, amount: number, type: 'damage' | 'crit' | 'heal' | 'heal-hot' | 'dot', isHero: boolean) =>
        this.triggerCombatText(entityId, amount, type, isHero)
    };
    
    // Apply enemy damage helper
    const applyEnemyDamage = (enemy: Enemy, damage: number) => {
      // CRITICAL: Check if enemy is already dead before applying damage
      if (!enemy || enemy.isDead || enemy.hp <= 0) {
        return { died: false, actualDamage: 0 };
      }
      
      const hpBefore = enemy.hp;
      enemy.hp = Math.max(0, enemy.hp - damage);
      // Ensure HP is an integer (prevent floating point precision issues)
      enemy.hp = Math.max(0, Math.floor(enemy.hp));
      const actualDamage = hpBefore - enemy.hp;
      
      // CRITICAL: Only mark as dead if HP is EXACTLY 0, never if HP > 0
      // This prevents premature death detection when HP is still above zero
      const died = enemy.hp === 0 && !enemy.isDead;
      
      if (died) {
        // Double-check HP is actually 0 before marking as dead and triggering animation
        if (enemy.hp === 0) {
          enemy.isDead = true;
          // Clear debuffs on death
          enemy.activeDebuffs = {};
          // Only trigger death animation if HP is confirmed to be 0
          this.triggerAnimation(this.enemyElementId(enemy), 'death', false);
        }
      }
      
      // CRITICAL: Ensure isDead matches HP state (auto-correct inconsistencies)
      // If isDead is true but HP > 0, correct the state (enemy should not be dead)
      if (enemy.isDead && enemy.hp > 0) {
        enemy.isDead = false; // Auto-correct: HP > 0 means not dead
      }
      
      // CRITICAL: Only mark as dead if HP is EXACTLY 0 (never if HP > 0)
      // This prevents marking enemies as dead when they still have HP
      if (!enemy.isDead && enemy.hp === 0) {
        enemy.isDead = true;
        enemy.activeDebuffs = {};
        // Do NOT trigger animation here - animation should only trigger in the initial death check above
      }
      
      if (actualDamage > 0 && !died) {
        this.triggerAnimation(this.enemyElementId(enemy), 'hurt', false);
      }
      
      return { died, actualDamage };
    };
    
    // Call processDebuffs from modular combat engine (imported at top)
    processDebuffs(
      this.state.heroes,
      enemies,
      now,
      callbacks,
      applyEnemyDamage,
      getHeroSpriteType,
      getEnemySpriteType,
      getAnimationDuration
    );
    
    // Process HP Regeneration (from regeneration_armor enchantment)
    processHpRegeneration(
      this.state.heroes,
      now,
      callbacks
    );
  }
  
  /**
   * Start the adventure loop (equivalent to Electron app's startAdventure)
   * Runs adventureTick every 5 seconds, matching Electron app exactly
   * Reference: E:\IdleDnD\game.js lines 8677-8679
   */
  startAdventure() {
    if (this.adventureInterval) {
      this.stopAdventure();
    }
    
    // Initialize wave count if not set
    if (this.state.waveCount === undefined) {
      this.state.waveCount = 1;
    }
    this.state.isAdventuring = true;
    
    // Trigger first adventure tick immediately after 1 second (matches Electron app line 8672-8674)
    setTimeout(() => {
      this.adventureTick();
    }, 1000);
    
    // Adventure logic - continue with regular interval every 5 seconds (matches Electron app line 8677-8679)
    this.adventureInterval = setInterval(() => {
      this.adventureTick();
    }, 5000);
    
    // Track interval for cleanup
    if (this.adventureInterval) {
      this.activeIntervals.add(this.adventureInterval);
    }
  }
  
  /**
   * Stop the adventure loop
   */
  stopAdventure() {
    if (this.adventureInterval) {
      clearInterval(this.adventureInterval);
      this.adventureInterval = null;
    }
    this.state.isAdventuring = false;
  }
  
  /**
   * Adventure tick - now uses simplified AdventureEngine
   * This method is deprecated but kept for backward compatibility
   */
  private adventureTick() {
    // Now handled by AdventureEngine
    this.adventureEngine.adventureTick();
  }

  /**
   * Legacy adventure tick - DEPRECATED
   * Now uses AdventureEngine instead
   */
  private adventureTickLegacy() {
    // Check for hero resurrection first (matches Electron app checkMidFightEmergency)
    // Reference: E:\IdleDnD\game.js lines 6510-6529
    this.checkHeroResurrection();
    
    // Don't progress if game is paused
    if (this.state.isPaused) {
      return;
    }
    
    // Don't progress if still fighting enemies OR waiting for death animations
    if (this.state.currentEnemies && this.state.currentEnemies.length > 0) {
      return;
    }
    
    // Don't progress if combat is ending (waiting for death animation)
    if (this.state.combatEnding) {
      return;
    }
    
    // Don't progress if in edit mode
    if (this.state.editModePausedCombat) {
      return;
    }
    
    // CRITICAL: Wave counter is now incremented in encounterEnemy() when new enemies are created
    // Don't increment here - this prevents wave counter from incrementing during the same combat encounter
    
    // Every 10 waves, spawn a boss (matches Electron app line 8857)
    const isBossWave = (this.state.waveCount % 10 === 0);
    
    // Every 5 waves (non-boss), auto-rest (matches Electron app line 8860)
    const isAutoRestWave = (this.state.waveCount % 5 === 0) && !isBossWave;
    
    if (isBossWave) {
      this.log('system', `═══ WAVE ${this.state.waveCount} - BOSS WAVE ═══`);
      this.encounterEnemy(true); // true = boss
    } else if (isAutoRestWave) {
      // Auto-rest: 10-second rest period (matches Electron app line 8868)
      this.log('system', `😴 Wave ${this.state.waveCount}: Auto-rest period...`);
      // For now, just continue to next wave after a delay
      // TODO: Implement full auto-rest mechanics
      setTimeout(() => {
        this.adventureTick();
      }, 10000);
    } else {
      const rand = Math.random();
      
      if (rand < 0.4) {
        // Combat encounter (40% - matches Electron app line 8872)
        this.encounterEnemy(false);
      } else if (rand < 0.7) {
        // Find treasure (30% - matches Electron app line 8876-8905)
        this.findTreasure();
      } else {
        // Peaceful travel (30% - matches Electron app line 8907-8942)
        this.peacefulTravel();
      }
    }
    
    // Check if party is too weak to continue (matches Electron app lines 8954-8962)
    // Only end adventure if heroes are dead AND no enemies are present (no combat to continue)
    const heroes = this.getHeroesArray();
    let aliveHeroes = 0;
    heroes.forEach(hero => {
      if (hero && hero.hp > 0 && !hero.isDead) {
        aliveHeroes++;
      }
    });
    
    // Only end adventure if all heroes are dead AND no enemies are present
    // If enemies are present, wait for resurrection to potentially continue combat
    const hasEnemies = this.state.currentEnemies && this.state.currentEnemies.length > 0;
    const aliveEnemies = hasEnemies ? this.state.currentEnemies.filter(e => e.hp > 0 && !e.isDead).length : 0;
    
    if (aliveHeroes === 0) {
      if (aliveEnemies > 0) {
        // Enemies still present - don't end adventure, wait for potential resurrection
        this.log('system', '💀 All heroes are dead. Waiting for resurrection...');
      } else {
        // No enemies and all heroes dead - end adventure
        this.endAdventure();
      }
    }
  }
  
  /**
   * Encounter enemy - spawns enemies and starts combat
   * Equivalent to Electron app's encounterEnemy()
   * Reference: E:\IdleDnD\game.js encounterEnemy() function
   */
  private encounterEnemy(isBoss: boolean = false) {
    const heroes = this.getHeroesArray();
    
    if (heroes.length === 0) {
      return;
    }
    
    // Safety check: Don't spawn new enemies if there are already active enemies
    // This prevents enemies from being replaced during active combat
    if (this.state.currentEnemies && this.state.currentEnemies.length > 0) {
      const aliveEnemies = this.state.currentEnemies.filter((e: any) => e.hp > 0 && !e.isDead);
      if (aliveEnemies.length > 0) {
        return;
      }
    }
    
    // Generate enemies using the same logic as Electron app
    // Pass full hero objects so gear score can be calculated
    const newEnemies = generateEnemiesForCombat(
      heroes, // Pass full hero objects for gear score calculation
      this.state.waveCount || 1,
      this.state.difficultyModifier || 1.0
    );
    
    // Mark as boss if needed
    if (isBoss && newEnemies.length > 0) {
      newEnemies[0].isBoss = true;
      // Boss gets extra stats
      newEnemies[0].hp = Math.floor(newEnemies[0].hp * 1.5);
      newEnemies[0].maxHp = Math.floor(newEnemies[0].maxHp * 1.5);
      newEnemies[0].attack = Math.floor(newEnemies[0].attack * 1.5);
    }
    
    if (newEnemies.length > 0) {
      // CRITICAL: Increment wave counter when a NEW encounter is created (matches Electron app)
      // Only increment when actually creating new enemies, not on every adventure tick
      if (!this.state.waveCount) {
        this.state.waveCount = 1;
      } else {
        this.state.waveCount++;
      }
      
      this.state.currentEnemies = newEnemies;
      this.state.inCombat = true;
      
      // Notify via callback so BrowserSourcePage can update state
      if (this.onEnemiesGenerated) {
        this.onEnemiesGenerated(newEnemies);
      }
      
      // Start combat
      this.startCombat();
      
      this.log('system', `⚔️ Wave ${this.state.waveCount}: The party encounters ${newEnemies.map(e => e.name).join(', ')}!`);
    }
  }
  
  /**
   * Grant travel XP to heroes (matches Electron app line 8928)
   */
  private grantTravelXP() {
    const heroes = this.getHeroesArray();
    heroes.forEach(hero => {
      if (!hero) return;
      // Grant travel XP (matches Electron app: hero.xp += 3)
      hero.xp = (hero.xp || 0) + 3;
      hero.maxXp = hero.maxXp || (100 + (hero.level || 1) * 10);
      
      // Handle level ups (matches Electron app lines 8930-8932)
      while (hero.xp >= hero.maxXp) {
        this.levelUpHero(hero);
      }
    });
  }
  
  /**
   * Find treasure - NPC encounter with auto-buy
   * Matches Electron app lines 8876-8905
   */
  private findTreasure() {
    this.log('system', `💰 Searching for treasure... Wave ${this.state.waveCount}`);
    
    // Show NPC (random shop keeper) - matches Electron app lines 8882-8886
    const npcs = ['ALCHEMIST', 'BLACKSMITH', 'ENCHANTER'];
    const randomNPC = npcs[Math.floor(Math.random() * npcs.length)];
    const npcName = randomNPC.replace('_', ' ');
    this.log('system', `🧙 You encounter a ${npcName}! Auto-buying is enabled for those who have it on.`);
    
    // Auto-buy for heroes during merchant encounter (if autoBuy enabled) - matches Electron app lines 8888-8904
    const heroes = this.getHeroesArray();
    heroes.forEach(hero => {
      if (!hero) return;
      
      // Auto-buy gear if enabled
      if (hero.autoBuy) {
        this.autoBuyGearForHero(hero, hero.username);
      }
      
      // Profession gathering during treasure hunting (matches Electron app lines 8898-8903)
      if (hero.profession) {
        if (hero.profession.type === 'herbalism') {
          this.gatherHerbs(hero);
        } else if (hero.profession.type === 'mining') {
          this.gatherOre(hero);
        }
      }
    });
    
    // Continue to next wave after delay (matches Electron app line 8878 - 8 second duration)
    setTimeout(() => {
      this.adventureTick();
    }, 8000);
  }
  
  /**
   * Peaceful travel - travel XP, NPC encounter, auto-buy
   * Matches Electron app lines 8907-8942
   */
  private peacefulTravel() {
    this.log('system', `Wave ${this.state.waveCount}: The party travels through peaceful lands...`);
    
    // Show NPC (merchant or traveler) - matches Electron app lines 8912-8916
    const npcs = ['ALCHEMIST', 'BLACKSMITH', 'ENCHANTER'];
    const randomNPC = npcs[Math.floor(Math.random() * npcs.length)];
    const npcName = randomNPC.replace('_', ' ');
    this.log('system', `🧙 You encounter a traveling ${npcName}! Auto-buying is enabled for those who have it on.`);
    
    const heroes = this.getHeroesArray();
    
    // Auto-buy and travel XP for heroes during travel - matches Electron app lines 8918-8941
    heroes.forEach(hero => {
      if (!hero) return;
      
      // Auto-buy gear if enabled
      if (hero.autoBuy) {
        this.autoBuyGearForHero(hero, hero.username);
      }
      
      // Grant travel XP (matches Electron app line 8928)
      hero.xp = (hero.xp || 0) + 3;
      hero.maxXp = hero.maxXp || (100 + (hero.level * 10));
      
      // Handle level ups (matches Electron app lines 8930-8932)
      while (hero.xp >= hero.maxXp) {
        this.levelUpHero(hero);
      }
      
      // Profession gathering during travel (matches Electron app lines 8935-8940)
      if (hero.profession) {
        if (hero.profession.type === 'herbalism') {
          this.gatherHerbs(hero);
        } else if (hero.profession.type === 'mining') {
          this.gatherOre(hero);
        }
      }
    });
    
    // Continue to next wave after delay (matches Electron app line 8908 - 8 second duration)
    setTimeout(() => {
      this.adventureTick();
    }, 8000);
  }
  
  /**
   * Auto-buy items for a single hero
   * Matches Electron app lines 4542-4577
   */
  private autoBuyGearForHero(hero: Hero, username: string) {
    if (!hero || !hero.gold) return;
    if (!hero.autoBuy) return; // Skip if auto-buy disabled
    
    // Don't shop during combat - heroes should only shop between fights and when traveling
    if (this.state.currentEnemies && this.state.currentEnemies.length > 0) {
      return; // Skip shopping during combat
    }
    
    // Random chance to buy (30% each check) - matches Electron app line 4552
    if (Math.random() > 0.3) return;
    
    // Prioritize potions when low on stock (updated price) - matches Electron app lines 4555-4561
    if (hero.gold >= 10 && (!hero.potions || hero.potions.health < 2)) {
      hero.gold -= 10;
      if (!hero.potions) hero.potions = { health: 0 };
      hero.potions.health++;
      this.log('loot', `🛒 ${username} bought Health Potion from the merchant! (${hero.potions.health} potions)`);
      
      // Trigger SCT for potion purchase
      const heroId = hero.id || hero.username || hero.name || hero.characterName;
      this.triggerCombatText(heroId, 0, 'loot', true);
      return;
    }
    
    // Buy random buff if enough gold (updated prices) - matches Electron app lines 4564-4576
    const affordableBuffs: string[] = [];
    if (hero.gold >= 25) affordableBuffs.push('xpboost');
    if (hero.gold >= 50) affordableBuffs.push('attackbuff');
    if (hero.gold >= 50) affordableBuffs.push('defensebuff');
    
    if (affordableBuffs.length > 0) {
      const buffChoice = affordableBuffs[Math.floor(Math.random() * affordableBuffs.length)];
      const cost = SHOP_ITEMS[buffChoice].cost;
      
      hero.gold -= cost;
      this.applyBuff(username, hero, buffChoice);
      const itemName = SHOP_ITEMS[buffChoice].name;
      this.log('loot', `🛒 ${username} bought ${itemName} from the merchant!`);
      
      // Trigger SCT for buff purchase
      const heroId = hero.id || hero.username || hero.name || hero.characterName;
      this.triggerCombatText(heroId, 0, 'loot', true);
    }
  }
  
  /**
   * Apply buff to hero
   * Matches Electron app lines 17412-17441
   */
  private applyBuff(username: string, hero: Hero, buffType: string) {
    const buffs: Record<string, { duration: number; effect: string; value: number; name: string }> = {
      xpboost: { duration: 300000, effect: 'xpMultiplier', value: 1.5, name: 'XP Boost' }, // 5 min
      attackbuff: { duration: 600000, effect: 'attackBonus', value: 0.1, name: 'Attack Buff' }, // 10 min
      defensebuff: { duration: 600000, effect: 'defenseBonus', value: 0.1, name: 'Defense Buff' } // 10 min
    };
    
    const buff = buffs[buffType];
    if (!buff) return;
    
    if (!hero.activeBuffs) hero.activeBuffs = {};
    
    // Store remaining duration in milliseconds (will tick down only during combat)
    hero.activeBuffs[buff.effect] = {
      value: buff.value,
      remainingDuration: buff.duration,
      name: buff.name,
      lastUpdateTime: Date.now() // Track when last updated
    };
    
    // Recalculate stats if attack/defense buff - matches Electron app lines 17433-17437
    if (buff.effect === 'attackBonus') {
      hero.attack = Math.floor(hero.attack * (1 + buff.value));
    } else if (buff.effect === 'defenseBonus') {
      hero.defense = Math.floor(hero.defense * (1 + buff.value));
    }
    
    const durationMinutes = Math.floor(buff.duration / 60000);
    this.log('system', `⏱️ ${username}'s ${buff.name} will last ${durationMinutes} minutes of combat time`);
  }
  
  /**
   * End adventure - called when all heroes are dead
   * Equivalent to Electron app's endAdventure()
   * Reference: E:\IdleDnD\game.js lines 15534-15551
   */
  private endAdventure() {
    this.state.isAdventuring = false;
    this.stopAdventure();
    this.log('system', '═══ Adventure Complete ═══');
    
    // Auto-restart after a short break (matches Electron app line 15544-15548)
    setTimeout(() => {
      const heroes = this.getHeroesArray();
      if (heroes.length > 0) {
        this.startAdventure();
      }
    }, 10000); // 10 second break (matches Electron app line 15548)
  }
  
  private resetAllAnimations(isCombatStarting: boolean = false) {
    // CRITICAL: Only reset animations at the START of combat, not during combat rounds
    // During combat, animations are managed by the combat loop and auto-return timeouts
    // This prevents interrupting active attack/hurt animations which causes flashing
    // However, we should still trigger idle for heroes that don't have an active animation
    const heroes = this.getHeroesArray();
    heroes.forEach(hero => {
      if (hero && hero.hp > 0 && !hero.isDead && !hero.deathAnimationPlaying) {
        // Only trigger idle if combat is starting, or if hero doesn't have an active animation
        // This ensures heroes get idle when combat starts, but doesn't interrupt active animations
        // Don't reset if death animation is playing
        if (isCombatStarting) {
          const heroId = hero.id || hero.username || hero.name || hero.characterName;
          if (heroId) {
            const formattedHeroId = heroId.startsWith('battle-hero-') ? heroId : `battle-hero-${heroId}`;
            this.triggerAnimation(formattedHeroId, 'idle', true);
          }
        }
      }
    });
    
    if (this.state.currentEnemies) {
      this.state.currentEnemies.forEach(enemy => {
        if (enemy && enemy.hp > 0 && !enemy.isDead) {
          this.triggerAnimation(this.enemyElementId(enemy), 'idle', false);
        }
      });
    }
  }
  
  /**
   * Level up hero - matches Electron app lines 8622-8649
   */
  private levelUpHero(hero: Hero) {
    hero.level = (hero.level || 1) + 1;
    hero.xp = 0;
    hero.maxXp = Math.floor((hero.maxXp || 100) * 1.5);
    
    // Recalculate stats including equipment
    const stats = this.getCharacterStats(hero);
    const hpRatio = hero.hp / hero.maxHp;
    hero.maxHp = stats.maxHp;
    hero.hp = Math.floor(hero.maxHp * hpRatio);
    hero.attack = stats.attack;
    hero.defense = stats.defense;
    
    // Store primary and secondary stats
    hero.intellect = stats.intellect;
    hero.strength = stats.strength;
    hero.dexterity = stats.dexterity;
    hero.wisdom = stats.wisdom;
    hero.stamina = stats.stamina;
    hero.healingPower = stats.healingPower;
    hero.spellDamage = stats.spellDamage;
    hero.meleeDamage = stats.meleeDamage;
    hero.hpRegen = stats.hpRegen;
    hero.damageReduction = stats.damageReduction;
    hero.critChance = stats.critChance;
    
    this.log('success', `🎊 ${hero.username} leveled up to ${hero.level}!`);
  }
  
  /**
   * Gather herbs - matches Electron app lines 9507-9566
   */
  private gatherHerbs(hero: Hero) {
    if (!hero.profession || hero.profession.type !== 'herbalism') return;
    
    // Ensure materials object exists and is properly initialized
    if (!hero.profession.materials) {
      hero.profession.materials = {};
    }
    if (!hero.profession.materials.herbs) {
      hero.profession.materials.herbs = { common: 0, uncommon: 0, rare: 0, epic: 0 };
    }
    
    const profLevel = hero.profession.level || 1;
    
    // Calculate gather chance (increased for better profession leveling)
    let gatherChance = 0.60;  // Increased from 40%
    if (profLevel >= 76) gatherChance = 0.80;  // Increased from 55%
    else if (profLevel >= 51) gatherChance = 0.75;  // Increased from 50%
    else if (profLevel >= 21) gatherChance = 0.70;  // Increased from 45%
    
    if (Math.random() > gatherChance) return; // No gather this tick
    
    // Determine herb amount
    let herbAmount = 1;
    if (profLevel >= 76) herbAmount = Math.floor(Math.random() * 3) + 3; // 3-5
    else if (profLevel >= 51) herbAmount = Math.floor(Math.random() * 2) + 3; // 3-4
    else if (profLevel >= 21) herbAmount = Math.floor(Math.random() * 2) + 2; // 2-3
    else herbAmount = Math.floor(Math.random() * 2) + 1; // 1-2
    
    // Determine herb rarity
    const roll = Math.random();
    let rarity: 'common' | 'uncommon' | 'rare' | 'epic';
    if (roll < HERB_GATHER_CHANCES.epic) rarity = 'epic';
    else if (roll < HERB_GATHER_CHANCES.epic + HERB_GATHER_CHANCES.rare) rarity = 'rare';
    else if (roll < HERB_GATHER_CHANCES.epic + HERB_GATHER_CHANCES.rare + HERB_GATHER_CHANCES.uncommon) rarity = 'uncommon';
    else rarity = 'common';
    
    // Add herbs
    const currentHerb = hero.profession.materials.herbs[rarity] || 0;
    hero.profession.materials.herbs[rarity] = currentHerb + herbAmount;
    
    // Update totals
    hero.profession.totalGathered = (hero.profession.totalGathered || 0) + herbAmount;
    hero.profession.lastGatherTime = Date.now();
    
    // Log and show SCT (only show uncommon+)
    if (rarity !== 'common') {
      this.log('loot', `🌿 ${hero.username} gathered ${herbAmount}x ${rarity} herbs!`);
      // Show SCT for gathering (minimal, transparent)
      const heroId = hero.id || hero.username || hero.name || hero.characterName;
      if (this.triggerCombatText) {
        this.triggerCombatText(heroId, herbAmount, 'loot', true);
      }
    }
  }
  
  /**
   * Gather ore - matches Electron app lines 9571-9636
   */
  private gatherOre(hero: Hero) {
    if (!hero.profession || hero.profession.type !== 'mining') return;
    
    // Ensure materials object exists and is properly initialized
    if (!hero.profession.materials) {
      hero.profession.materials = {};
    }
    if (!hero.profession.materials.ore) {
      hero.profession.materials.ore = { iron: 0, steel: 0, mithril: 0, adamantite: 0 };
    }
    
    const profLevel = hero.profession.level || 1;
    
    // Mining has slightly lower travel chance than herbalism (more combat-focused)
    let gatherChance = 0.50;
    if (profLevel >= 76) gatherChance = 0.70;
    else if (profLevel >= 51) gatherChance = 0.65;
    else if (profLevel >= 21) gatherChance = 0.60;
    
    if (Math.random() > gatherChance) return;
    
    // Determine ore amount
    let oreAmount = 1;
    if (profLevel >= 76) oreAmount = Math.floor(Math.random() * 2) + 2; // 2-3
    else if (profLevel >= 51) oreAmount = Math.floor(Math.random() * 2) + 2; // 2-3
    else if (profLevel >= 21) oreAmount = Math.floor(Math.random() * 2) + 1; // 1-2
    else oreAmount = 1;
    
    // Determine ore type (rarity)
    const roll = Math.random();
    let oreType: 'iron' | 'steel' | 'mithril' | 'adamantite';
    if (roll < 0.02) oreType = 'adamantite';      // 2% epic
    else if (roll < 0.10) oreType = 'mithril';    // 8% rare
    else if (roll < 0.35) oreType = 'steel';      // 25% uncommon
    else oreType = 'iron';                        // 65% common
    
    // Add ore
    const currentOre = hero.profession.materials.ore[oreType] || 0;
    hero.profession.materials.ore[oreType] = currentOre + oreAmount;
    
    // Update totals
    hero.profession.totalGathered = (hero.profession.totalGathered || 0) + oreAmount;
    hero.profession.lastGatherTime = Date.now();
    
    // Log and show SCT (only show steel+)
    if (oreType !== 'iron') {
      this.log('loot', `⛏️ ${hero.username} mined ${oreAmount}x ${oreType} while traveling!`);
      // Show SCT for gathering (minimal, transparent)
      const heroId = hero.id || hero.username || hero.name || hero.characterName;
      if (this.triggerCombatText) {
        this.triggerCombatText(heroId, oreAmount, 'loot', true);
      }
    }
  }
  
  /**
   * Adjust difficulty based on combat performance - matches Electron app lines 10043-10161
   */
  private adjustDifficulty(fightData: { deaths: number; damageTaken: number; healingDone: number }) {
    if (!fightData) return;
    
    // Calculate fight difficulty score based on deaths and damage taken
    let fightDifficultyScore = 0;
    
    // Factor 1: Deaths (most important) - Combat rezzes still count as deaths!
    if (fightData.deaths >= 3) {
      fightDifficultyScore = 1.0; // Extreme difficulty - reduce immediately
      this.log('system', `💀 ${fightData.deaths} deaths this fight! Difficulty will be reduced.`);
    } else if (fightData.deaths === 2) {
      fightDifficultyScore = 0.8; // Very hard - reduce immediately
      this.log('system', `💀 ${fightData.deaths} deaths this fight! Difficulty will be reduced.`);
    } else if (fightData.deaths === 1) {
      fightDifficultyScore = 0.6; // Hard - track and reduce
      this.log('system', `💀 1 death this fight. Tracking difficulty...`);
    } else {
      // No deaths - check other factors
      const heroes = this.getHeroesArray();
      
      // Factor 2: Average HP remaining (based on damage taken vs total HP pool)
      let totalMaxHp = 0;
      let totalCurrentHp = 0;
      heroes.forEach(hero => {
        if (!hero) return;
        totalMaxHp += hero.maxHp || 100;
        totalCurrentHp += Math.max(0, hero.hp || 0);
      });
      
      const avgHpPercent = totalMaxHp > 0 ? totalCurrentHp / totalMaxHp : 1;
      
      // Factor 3: Damage vs Healing ratio
      const damageHealRatio = fightData.damageTaken / Math.max(1, totalMaxHp);
      
      // Calculate score for deathless fights
      if (avgHpPercent < 0.3) {
        fightDifficultyScore = 0.5; // Close call - party very low
        this.log('system', `⚠️ Party ended at ${Math.floor(avgHpPercent * 100)}% HP - close call!`);
      } else if (avgHpPercent < 0.5) {
        fightDifficultyScore = 0.35; // Moderate difficulty
      } else if (avgHpPercent < 0.7 || damageHealRatio > 0.8) {
        fightDifficultyScore = 0.2; // Reasonable challenge
      } else if (avgHpPercent >= 0.8 && damageHealRatio < 0.3) {
        fightDifficultyScore = -0.2; // Easy - barely took damage
      } else {
        fightDifficultyScore = 0; // Normal fight
      }
    }
    
    // Track consecutive struggles (any death = struggle)
    if (fightData.deaths > 0) {
      this.state.consecutiveWipes = (this.state.consecutiveWipes || 0) + 1;
    } else if (fightDifficultyScore > 0.3) {
      // Close calls also count as partial struggles (don't reduce counter as much)
      this.state.consecutiveWipes = Math.max(0, (this.state.consecutiveWipes || 0) - 0.3);
    } else if (fightDifficultyScore <= 0) {
      // Clean victories gradually reduce the counter
      this.state.consecutiveWipes = Math.max(0, (this.state.consecutiveWipes || 0) - 0.8);
    }
    
    // Adjust difficulty based on score - matches Electron app
    const oldDifficulty = this.state.difficultyModifier || 1.0;
    
    if (fightDifficultyScore >= 0.8) {
      // 2+ deaths or 3+ deaths - MAJOR reduction
      this.state.difficultyModifier = Math.max(0.4, (this.state.difficultyModifier || 1.0) - 0.20);
      const diffPercent = Math.floor(this.state.difficultyModifier * 100);
      this.log('system', `🚨 Party struggling! (${fightData.deaths} deaths) Difficulty reduced to ${diffPercent}%`);
      this.state.consecutiveWipes = 0; // Reset after major reduction
    } else if (fightDifficultyScore >= 0.6) {
      // 1 death - moderate reduction (even if rezzed, it means fight was hard)
      this.state.difficultyModifier = Math.max(0.5, (this.state.difficultyModifier || 1.0) - 0.12);
      const diffPercent = Math.floor(this.state.difficultyModifier * 100);
      this.log('system', `⚠️ Death detected! Difficulty reduced to ${diffPercent}%`);
    } else if (fightDifficultyScore >= 0.4) {
      // Close call - small reduction
      this.state.difficultyModifier = Math.max(0.6, (this.state.difficultyModifier || 1.0) - 0.08);
      const diffPercent = Math.floor(this.state.difficultyModifier * 100);
      this.log('system', `⚠️ Close fight! Difficulty reduced to ${diffPercent}%`);
    } else if (fightDifficultyScore >= 0.2) {
      // Moderate fight - tiny reduction
      this.state.difficultyModifier = Math.max(0.7, (this.state.difficultyModifier || 1.0) - 0.03);
    } else if (fightDifficultyScore <= -0.2 && (this.state.difficultyModifier || 1.0) < 1.5) {
      // Very easy fight - increase difficulty (can go past 100% up to 150%)
      this.state.difficultyModifier = Math.min(1.5, (this.state.difficultyModifier || 1.0) + 0.05);
      if (this.state.difficultyModifier > 1.0) {
        const diffPercent = Math.floor(this.state.difficultyModifier * 100);
        this.log('system', `🔥 Difficulty increased to ${diffPercent}% - Enhanced rewards available!`);
      } else if (this.state.difficultyModifier >= 1.0) {
        this.log('system', '⚖️ Difficulty normalized - Party has recovered!');
      }
    } else if (fightDifficultyScore <= -0.1 && (this.state.difficultyModifier || 1.0) < 1.5) {
      // Easy fight - moderate increase (can go past 100% up to 150%)
      this.state.difficultyModifier = Math.min(1.5, (this.state.difficultyModifier || 1.0) + 0.03);
      if (this.state.difficultyModifier > 1.0 && this.state.difficultyModifier < 1.01) {
        this.log('system', '🔥 Difficulty exceeded 100% - Better gear now available!');
      }
    } else if (fightDifficultyScore <= 0 && (this.state.difficultyModifier || 1.0) < 1.5) {
      // Normal fight - small increase if below 100%, maintain if above
      if ((this.state.difficultyModifier || 1.0) < 1.0) {
        this.state.difficultyModifier = Math.min(1.0, (this.state.difficultyModifier || 1.0) + 0.02);
      } else if ((this.state.difficultyModifier || 1.0) < 1.5 && fightDifficultyScore <= -0.05) {
        // Slight increase if just barely winning at 100%+
        this.state.difficultyModifier = Math.min(1.5, (this.state.difficultyModifier || 1.0) + 0.01);
      }
    }
    
    // Safety check: If seeing deaths repeatedly, reduce more aggressively
    if ((this.state.consecutiveWipes || 0) >= 2) {
      this.state.difficultyModifier = Math.max(0.45, (this.state.difficultyModifier || 1.0) - 0.15);
      this.log('system', `🚨 ${this.state.consecutiveWipes} fights with deaths! Emergency reduction to ${Math.floor(this.state.difficultyModifier * 100)}%`);
      this.state.consecutiveWipes = 0;
    }
    
  }
  
  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  /**
   * Get viewer bonuses (damage/healing/defense multipliers based on viewer count)
   */
  private getViewerBonuses() {
    const viewerCount = this.state.viewerCount || 0;
    return {
      damageMultiplier: 1 + (viewerCount * 0.01),  // 1% per viewer
      healingMultiplier: 1 + (viewerCount * 0.01), // 1% per viewer
      defenseMultiplier: 1 + (viewerCount * 0.005), // 0.5% per viewer
    };
  }

  /**
   * Calculate skill bonuses for a hero
   * Extracted from IdleDnD/game.js:6644
   */
  private calculateSkillBonuses(hero: Hero) {
    const skills = hero.skills || {};
    const bonuses = {
      attack: 0,
      defense: 0,
      hp: 0,
      damageMultiplier: 0,
      healingMultiplier: 0,
      defenseMultiplier: 0,
      critChance: 0,
      critDamage: 0,
      cooldownReduction: 0,
      lifesteal: 0,
      speedBoost: 0
    };
    
    // Skill templates (simplified - matches backend structure)
    const skillTemplates: Record<string, { effect: string; stat?: string; baseValue: number }> = {
      // Tank skills
      'guardian_skill_0': { effect: 'stat_boost', stat: 'hp', baseValue: 5 },
      'guardian_skill_1': { effect: 'defense_mult', baseValue: 3 },
      'guardian_skill_2': { effect: 'stat_boost', stat: 'defense', baseValue: 4 },
      'guardian_skill_3': { effect: 'stat_boost', stat: 'attack', baseValue: 2 },
      'guardian_skill_4': { effect: 'defense_mult', baseValue: 5 },
      'guardian_skill_5': { effect: 'cooldown_red', baseValue: 10 },
      'guardian_skill_6': { effect: 'stat_boost', stat: 'defense', baseValue: 6 },
      'guardian_skill_7': { effect: 'defense_mult', baseValue: 4 },
      'guardian_skill_8': { effect: 'stat_boost', stat: 'hp', baseValue: 8 },
      'guardian_skill_9': { effect: 'defense_mult', baseValue: 6 },
      // Healer skills
      'cleric_skill_0': { effect: 'healing_mult', baseValue: 5 },
      'cleric_skill_1': { effect: 'cooldown_red', baseValue: 8 },
      'cleric_skill_2': { effect: 'healing_mult', baseValue: 4 },
      'cleric_skill_3': { effect: 'speed_boost', baseValue: 10 },
      'cleric_skill_4': { effect: 'healing_mult', baseValue: 6 },
      'cleric_skill_5': { effect: 'cooldown_red', baseValue: 12 },
      'cleric_skill_6': { effect: 'healing_mult', baseValue: 5 },
      'cleric_skill_7': { effect: 'cooldown_red', baseValue: 15 },
      'cleric_skill_8': { effect: 'stat_boost', stat: 'defense', baseValue: 3 },
      'cleric_skill_9': { effect: 'healing_mult', baseValue: 8 },
      // DPS skills
      'berserker_skill_0': { effect: 'damage_mult', baseValue: 5 },
      'berserker_skill_1': { effect: 'crit_chance', baseValue: 3 },
      'berserker_skill_2': { effect: 'crit_damage', baseValue: 10 },
      'berserker_skill_3': { effect: 'stat_boost', stat: 'attack', baseValue: 4 },
      'berserker_skill_4': { effect: 'speed_boost', baseValue: 8 },
      'berserker_skill_5': { effect: 'damage_mult', baseValue: 6 },
      'berserker_skill_6': { effect: 'crit_chance', baseValue: 5 },
      'berserker_skill_7': { effect: 'damage_mult', baseValue: 7 },
      'berserker_skill_8': { effect: 'lifesteal', baseValue: 5 },
      'berserker_skill_9': { effect: 'damage_mult', baseValue: 10 }
    };
    
    // Apply all skills (generic pattern matching for all classes)
    Object.entries(skills).forEach(([skillId, skillData]: [string, any]) => {
      if (!skillData || !skillData.points) return;
      
      // Try to find skill template by exact match or pattern
      let skillDef = skillTemplates[skillId];
      
      // If not found, try pattern matching (class_skill_N)
      if (!skillDef && skillId.includes('_skill_')) {
        const parts = skillId.split('_skill_');
        const className = parts[0];
        const skillIndex = parseInt(parts[1]);
        
        // Use generic templates based on class category
        const category = ROLE_CONFIG[className]?.category || 'dps';
        if (category === 'tank') {
          const tankSkills = [
            { effect: 'stat_boost', stat: 'hp', baseValue: 5 },
            { effect: 'defense_mult', baseValue: 3 },
            { effect: 'stat_boost', stat: 'defense', baseValue: 4 },
            { effect: 'stat_boost', stat: 'attack', baseValue: 2 },
            { effect: 'defense_mult', baseValue: 5 },
            { effect: 'cooldown_red', baseValue: 10 },
            { effect: 'stat_boost', stat: 'defense', baseValue: 6 },
            { effect: 'defense_mult', baseValue: 4 },
            { effect: 'stat_boost', stat: 'hp', baseValue: 8 },
            { effect: 'defense_mult', baseValue: 6 }
          ];
          skillDef = tankSkills[skillIndex] || null;
        } else if (category === 'healer') {
          const healerSkills = [
            { effect: 'healing_mult', baseValue: 5 },
            { effect: 'cooldown_red', baseValue: 8 },
            { effect: 'healing_mult', baseValue: 4 },
            { effect: 'speed_boost', baseValue: 10 },
            { effect: 'healing_mult', baseValue: 6 },
            { effect: 'cooldown_red', baseValue: 12 },
            { effect: 'healing_mult', baseValue: 5 },
            { effect: 'cooldown_red', baseValue: 15 },
            { effect: 'stat_boost', stat: 'defense', baseValue: 3 },
            { effect: 'healing_mult', baseValue: 8 }
          ];
          skillDef = healerSkills[skillIndex] || null;
        } else {
          const dpsSkills = [
            { effect: 'damage_mult', baseValue: 5 },
            { effect: 'crit_chance', baseValue: 3 },
            { effect: 'crit_damage', baseValue: 10 },
            { effect: 'stat_boost', stat: 'attack', baseValue: 4 },
            { effect: 'speed_boost', baseValue: 8 },
            { effect: 'damage_mult', baseValue: 6 },
            { effect: 'crit_chance', baseValue: 5 },
            { effect: 'damage_mult', baseValue: 7 },
            { effect: 'lifesteal', baseValue: 5 },
            { effect: 'damage_mult', baseValue: 10 }
          ];
          skillDef = dpsSkills[skillIndex] || null;
        }
      }
      
      if (!skillDef) return;
      
      const value = skillDef.baseValue * skillData.points;
      
      switch (skillDef.effect) {
        case 'stat_boost':
          if (skillDef.stat === 'attack') bonuses.attack += value;
          else if (skillDef.stat === 'defense') bonuses.defense += value;
          else if (skillDef.stat === 'hp') bonuses.hp += value;
          break;
        case 'damage_mult':
          bonuses.damageMultiplier += value;
          break;
        case 'healing_mult':
          bonuses.healingMultiplier += value;
          break;
        case 'defense_mult':
          bonuses.defenseMultiplier += value;
          break;
        case 'crit_chance':
          bonuses.critChance += value;
          break;
        case 'crit_damage':
          bonuses.critDamage += value;
          break;
        case 'cooldown_red':
          bonuses.cooldownReduction += value;
          break;
        case 'lifesteal':
          bonuses.lifesteal += value;
          break;
        case 'speed_boost':
          bonuses.speedBoost += value;
          break;
      }
    });
    
    return bonuses;
  }

  /**
   * Get character stats including equipment bonuses
   * Simplified version for browser - doesn't require EQUIPMENT_SETS
   */
  private getCharacterStats(hero: Hero) {
    const config = ROLE_CONFIG[hero.role];
    if (!config) {
      return {
        attack: hero.attack || 0,
        defense: hero.defense || 0,
        maxHp: hero.maxHp || 0,
        intellect: hero.intellect || 0,
        strength: hero.strength || 0,
        dexterity: hero.dexterity || 0,
        wisdom: hero.wisdom || 0,
        stamina: hero.stamina || 0,
        healingPower: hero.healingPower || 0,
        spellDamage: hero.spellDamage || 0,
        meleeDamage: hero.meleeDamage || 0,
        hpRegen: 0,
        damageReduction: 0,
        critChance: 0
      };
    }

    // Calculate skill bonuses first
    const skillBonuses = this.calculateSkillBonuses(hero);

    let stats: any = {
      attack: config.baseAttack + ((hero.level - 1) * config.attackPerLevel),
      defense: config.baseDefense + ((hero.level - 1) * config.defensePerLevel),
      maxHp: config.baseHp + ((hero.level - 1) * config.hpPerLevel),
      intellect: hero.intellect || 0,
      strength: hero.strength || 0,
      dexterity: hero.dexterity || 0,
      wisdom: hero.wisdom || 0,
      stamina: hero.stamina || 0,
      healingPower: hero.healingPower || 0,
      spellDamage: hero.spellDamage || 0,
      meleeDamage: hero.meleeDamage || 0,
      hpRegen: 0,
      damageReduction: 0,
      critChance: hero.critChance || 0
    };

    // Add equipment bonuses if available
    if (hero.equipment) {
      const category = config.category;
      const slots = category === 'tank' ? TANK_EQUIPMENT_SLOTS : EQUIPMENT_SLOTS;

      for (const slot of slots) {
        if (hero.equipment[slot]) {
          const item = hero.equipment[slot];
          stats.attack += item.attack || 0;
          stats.defense += item.defense || 0;
          stats.maxHp += item.hp || 0;
          stats.intellect += item.intellect || 0;
          stats.strength += item.strength || 0;
          stats.dexterity += item.dexterity || 0;
          stats.wisdom += item.wisdom || 0;
          stats.stamina += item.stamina || 0;
          
          if (item.secondaryStats) {
            stats.healingPower += item.secondaryStats.healingPower || 0;
            stats.spellDamage += item.secondaryStats.spellDamage || 0;
            stats.meleeDamage += item.secondaryStats.meleeDamage || 0;
            stats.hpRegen += item.secondaryStats.hpRegen || 0;
            stats.damageReduction += item.secondaryStats.damageReduction || 0;
            stats.critChance += item.secondaryStats.critChance || 0;
          }
        }
      }
    }

    // Cap total crit chance at 35%
    stats.critChance = Math.min(stats.critChance || 0, 0.35);

    // Apply stamina to HP (1 stamina = 10 HP)
    stats.maxHp += (stats.stamina || 0) * 10;

    // Apply skill stat bonuses (flat values)
    stats.attack += skillBonuses.attack;
    stats.defense += skillBonuses.defense;
    stats.maxHp += skillBonuses.hp;

    // Store skill bonuses for use in combat
    stats.skillBonuses = skillBonuses;

    return stats;
  }

  /**
   * Calculate debuff resistance chance
   * Extracted from IdleDnD/game.js:9975
   */
  private getDebuffResistance(target: Hero | Enemy): number {
    // For heroes
    if ((target as Hero).role) {
      const hero = target as Hero;
      // Base resistance from defense (1% per 5 defense)
      const defenseResist = Math.min(0.3, (hero.defense || 0) / 500);
      // Level resistance (1% per 2 levels)
      const levelResist = Math.min(0.25, (hero.level || 0) / 200);
      // Gear score resistance (1% per 50 gear score)
      let gearScore = 0;
      if (hero.equipment) {
        Object.values(hero.equipment).forEach((item: any) => {
          if (item) {
            gearScore += (item.attack || 0) + (item.defense || 0) + (item.hp || 0);
          }
        });
      }
      const gearResist = Math.min(0.2, gearScore / 5000);
      
      return Math.min(0.7, defenseResist + levelResist + gearResist); // Max 70% resistance
    } 
    // For enemies
    else {
      const enemy = target as Enemy;
      // Enemies have base 10% resistance, bosses have 25%
      return enemy.isBoss ? 0.25 : 0.10;
    }
  }

  /**
   * Apply debuff to target
   * Extracted from IdleDnD/game.js:9999
   */
  private applyDebuff(target: Hero | Enemy, debuffKey: string, appliedBy: string, value?: number) {
    const debuff = DEBUFFS[debuffKey];
    if (!debuff) return;
    
    // Check resistance
    const resistance = this.getDebuffResistance(target);
    if (Math.random() < resistance) {
      const targetName = (target as Hero).username || (target as Enemy).name || 'Enemy';
      this.log('combat', `✨ ${targetName} resists ${debuff.name}!`);
      return; // Resisted!
    }
    
    const now = Date.now();
    
    if (!target.activeDebuffs) {
      target.activeDebuffs = {};
    }
    
    // Apply or refresh debuff
    const debuffData: any = {
      expiresAt: now + debuff.duration,
      appliedBy: appliedBy,
      lastTick: now
    };
    
    // If a value is passed (for dynamic DoTs), store it
    if (value !== undefined) {
      debuffData.value = value;
    }
    
    target.activeDebuffs[debuffKey] = debuffData;
    
    const targetName = (target as Hero).username || (target as Enemy).name || 'Enemy';
    this.log('combat', `${debuff.icon} ${appliedBy} applies ${debuff.name} to ${targetName}!`);
  }

  /**
   * Apply damage to enemy and check for immediate death
   * Extracted from IdleDnD/game.js:14869
   */
  private applyEnemyDamage(enemy: Enemy, damage: number): { died: boolean; actualDamage: number } {
    if (!enemy || enemy.isDead || enemy.hp <= 0) {
      return { died: false, actualDamage: 0 };
    }
    
    // Percentage-based damage reduction with minimum damage guarantee
    const enemyDefense = enemy.defense || 0;
    // Formula: damage / (1 + defense / 250)
    // Minimum 25% of original damage always gets through
    const damageAfterDefense = damage / (1 + enemyDefense / 250);
    const minDamage = Math.max(1, damage * 0.25);
    const actualDamage = Math.max(minDamage, Math.floor(damageAfterDefense));
    
    enemy.hp -= actualDamage;
    
    // Clamp HP to 0 (prevent negative) and ensure it's an integer
    if (enemy.hp < 0) {
      enemy.hp = 0;
    }
    // Ensure HP is an integer (prevent floating point precision issues)
    enemy.hp = Math.max(0, Math.floor(enemy.hp));
    
    // Check for immediate death - use exact 0 check to prevent premature death
    // CRITICAL: Only mark as dead if HP is exactly 0, never if HP > 0
    const died = enemy.hp === 0 && !enemy.isDead;
    if (died) {
      // Double-check HP is actually 0 before marking as dead
      if (enemy.hp === 0) {
        enemy.isDead = true;
        
        // Trigger death animation
        this.triggerAnimation(this.enemyElementId(enemy), 'death', false);
        
        // Clear debuffs on death
        enemy.activeDebuffs = {};
      } else {
        // HP is > 0, don't mark as dead (safety check)
      }
    }
    
    return { died, actualDamage };
  }

  /**
   * Apply shield to hero
   * Extracted from IdleDnD/game.js:17444
   */
  private applyShield(hero: Hero, amount: number, duration: number = 30000, source: string = 'overheal') {
    if (!hero || amount <= 0) return;
    
    const now = Date.now();
    
    // Initialize or update shield
    if (!hero.shield) {
      hero.shield = {
        amount: 0,
        expiresAt: now + duration,
        source: source
      };
    }
    
    // Add to existing shield or create new one
    hero.shield.amount += amount;
    hero.shield.expiresAt = Math.max(hero.shield.expiresAt || 0, now + duration); // Extend duration if shield already exists
    hero.shield.source = source;
  }

  /**
   * Apply weapon enchantment effects to enemies
   * Extracted from IdleDnD/game.js:14743
   */
  private applyWeaponEnchantmentEffects(hero: Hero, username: string, damage: number, targetEnemy: Enemy) {
    if (!targetEnemy || !hero.enchantedItems) return;
    
    const equipment = hero.equipment || {};
    const weapon = equipment.weapon;
    if (!weapon) return;
    
    // Find enchantments on weapon
    const weaponEnchantments = hero.enchantedItems.find((ei: any) => ei.itemId === weapon.id);
    if (!weaponEnchantments || !weaponEnchantments.enchantments) return;
    
    const now = Date.now();
    
    weaponEnchantments.enchantments.forEach((ench: any) => {
      const value = ench.baseValue * ench.level || ench.level * 5;
      
      switch (ench.type) {
        case 'fiery_weapon':
          // Apply fire DoT
          if (!targetEnemy.activeDebuffs) targetEnemy.activeDebuffs = {};
          const fireDotDamage = Math.floor(value * ench.level);
          targetEnemy.activeDebuffs.fire = {
            expiresAt: now + 10000, // 10 seconds
            appliedBy: username,
            lastTick: now,
            value: fireDotDamage
          };
          this.log('damage', `🔥 ${username}'s Fiery Weapon burns ${targetEnemy.name}!`);
          break;
          
        case 'frozen_weapon':
          // Apply slow debuff
          if (!targetEnemy.activeDebuffs) targetEnemy.activeDebuffs = {};
          targetEnemy.activeDebuffs.slowed = {
            expiresAt: now + 5000, // 5 seconds
            appliedBy: username,
            value: value
          };
          this.log('combat', `❄️ ${username}'s Frozen Weapon slows ${targetEnemy.name}!`);
          break;
          
        case 'poison_weapon':
          // Apply poison DoT
          if (!targetEnemy.activeDebuffs) targetEnemy.activeDebuffs = {};
          const poisonDotDamage = Math.floor(value * ench.level);
          targetEnemy.activeDebuffs.poisoned = {
            expiresAt: now + 15000, // 15 seconds
            appliedBy: username,
            lastTick: now,
            value: poisonDotDamage
          };
          this.log('damage', `☠️ ${username}'s Poisoned Weapon poisons ${targetEnemy.name}!`);
          break;
          
        case 'lifesteal_weapon':
          // Heal hero
          const lifestealHeal = Math.floor(damage * (value / 100));
          const actualHeal = Math.min(lifestealHeal, hero.maxHp - hero.hp);
          hero.hp = Math.min(hero.hp + lifestealHeal, hero.maxHp);
          if (actualHeal > 0) {
            this.log('heal', `🩸 ${username}'s Lifesteal Weapon heals for ${Math.floor(actualHeal)} HP`);
            if (!hero.stats) hero.stats = { totalDamage: 0, totalHealing: 0, damageBlocked: 0 };
            hero.stats.totalHealing += actualHeal;
          }
          break;
          
        case 'lightning_weapon':
          // Chain lightning to nearby enemies (30% chance)
          if (Math.random() < 0.3 && this.state.currentEnemies && this.state.currentEnemies.length > 1) {
            const chainTargets = this.state.currentEnemies.filter(e => e !== targetEnemy && !e.isDead && e.hp > 0);
            if (chainTargets.length > 0) {
              const chainTarget = chainTargets[Math.floor(Math.random() * chainTargets.length)];
              const chainDamage = Math.floor(damage * (value / 100));
              const result = this.applyEnemyDamage(chainTarget, chainDamage);
              const chainDied = result.died;
              const actualChainDamage = result.actualDamage;
              this.triggerAnimation(String(chainTarget.id), 'hurt', false);
              this.log('damage', `⚡ ${username}'s Lightning Weapon chains to ${chainTarget.name} for ${Math.floor(actualChainDamage)} damage`);
              if (chainDied) {
                this.log('success', `${chainTarget.name} is defeated!`);
              }
            }
          }
          break;
      }
    });
  }

  /**
   * Apply armor enchantment effects (thorns, regen, etc.)
   * Extracted from IdleDnD/game.js:14833
   */
  private applyArmorEnchantmentEffects(hero: Hero, username: string) {
    if (!hero.enchantedItems) return;
    
    const equipment = hero.equipment || {};
    const armorSlots = ['armor', 'helm', 'cloak', 'gloves', 'boots', 'shield'];
    
    armorSlots.forEach(slot => {
      const item = equipment[slot];
      if (!item) return;
      
      const itemEnchantments = hero.enchantedItems!.find((ei: any) => ei.itemId === item.id);
      if (!itemEnchantments || !itemEnchantments.enchantments) return;
      
      itemEnchantments.enchantments.forEach((ench: any) => {
        const value = ench.baseValue * ench.level || ench.level * 5;
        
        switch (ench.type) {
          case 'regeneration_armor':
            // Apply HP regen (passive, handled in combat loop)
            if (!hero.activeBuffs) hero.activeBuffs = {};
            hero.activeBuffs.hpRegen = {
              value: value,
              remainingDuration: Infinity,
              name: 'Regeneration Armor',
              lastUpdateTime: Date.now()
            };
            break;
            
          case 'fortification_armor':
            // Increase defense (applied in getCharacterStats)
            break;
        }
      });
    });
  }

  /**
   * Update hero buff durations (only ticks down during combat)
   * Extracted from IdleDnD/game.js:11270
   */
  private updateHeroBuffDurations() {
    const now = Date.now();
    
    const heroes = this.getHeroesArray();
    
    heroes.forEach(hero => {
      if (!hero || !hero.activeBuffs) return;
      
      // Only tick down buffs if hero is alive and in combat
      const isAlive = hero.hp > 0 && !hero.isDead;
      const inCombat = this.state.currentEnemies && this.state.currentEnemies.length > 0;
      
      if (!isAlive || !inCombat) {
        // Hero is dead or traveling - update lastUpdateTime but don't consume duration
        Object.keys(hero.activeBuffs).forEach(buffKey => {
          if (hero.activeBuffs![buffKey]) {
            hero.activeBuffs![buffKey].lastUpdateTime = now;
          }
        });
        return;
      }
      
      // Hero is alive and fighting - consume buff time
      Object.keys(hero.activeBuffs).forEach(buffKey => {
        const buff = hero.activeBuffs![buffKey];
        if (!buff || !buff.remainingDuration) return;
        
        const timeSinceLastUpdate = now - (buff.lastUpdateTime || now);
        buff.remainingDuration -= timeSinceLastUpdate;
        buff.lastUpdateTime = now;
        
        // Check if buff expired
        if (buff.remainingDuration <= 0) {
          delete hero.activeBuffs![buffKey];
          
          const buffName = buff.name || buffKey;
          this.log('system', `⏱️ ${hero.username}'s ${buffName} has expired`);
        }
      });
    });
  }

  /**
   * Process debuffs (damage over time, etc.)
   * Extracted from IdleDnD/game.js:9779
   */
  private processDebuffs(now: number) {
    const heroes = this.getHeroesArray();
    
    // Process hero debuffs
    heroes.forEach(hero => {
      if (!hero || !hero.activeDebuffs) return;
      if (hero.isDead) return; // Skip dead heroes
      
      Object.keys(hero.activeDebuffs).forEach(debuffKey => {
        const debuff = hero.activeDebuffs![debuffKey];
        if (!debuff) return;
        
        // Check if expired
        if (now >= debuff.expiresAt) {
          delete hero.activeDebuffs![debuffKey];
          this.log('system', `${hero.username} is no longer ${DEBUFFS[debuffKey]?.name || debuffKey}`);
          return;
        }
        
        // Apply damage over time effects
        if (DEBUFFS[debuffKey]?.effect === 'damageOverTime') {
          if (!debuff.lastTick || now - debuff.lastTick >= (DEBUFFS[debuffKey]?.tickRate || 2000)) {
            // Use debuff's stored value if it exists (for dynamic DoTs like Corruption), otherwise use DEBUFFS value
            const baseDotDamage = debuff.value !== undefined ? debuff.value : (DEBUFFS[debuffKey]?.value || 0);
            const dotDamage = baseDotDamage;
            
            if (dotDamage > 0) {
              hero.hp = Math.max(0, hero.hp - dotDamage);
              debuff.lastTick = now;
              
              // Use consistent ID resolution: hero.id || hero.username || hero.name || hero.characterName
              const heroId = (hero as any).id || hero.username || (hero as any).name || (hero as any).characterName;
              this.triggerAnimation(heroId, 'hurt', true);
              this.log('damage', `${DEBUFFS[debuffKey].icon} ${hero.username} takes ${Math.floor(dotDamage)} damage from ${DEBUFFS[debuffKey].name}`);
              
              if (hero.hp <= 0 && !hero.isDead) {
                hero.isDead = true;
                hero.deathTime = now;
                hero.deathAnimationPlaying = true;
                hero.activeDebuffs = {};
                // Use consistent ID resolution: hero.id || hero.username || hero.name || hero.characterName
                const heroId = (hero as any).id || hero.username || (hero as any).name || (hero as any).characterName;
                this.triggerAnimation(heroId, 'death', true);
                this.log('death', `💀 ${hero.username} has been defeated by ${DEBUFFS[debuffKey].name}! (resurrect in 60s)`);
                
                // Track death in combat metrics (matches Electron app line 11925)
                if (this.state.combatMetrics) {
                  this.state.combatMetrics.fightDeaths = (this.state.combatMetrics.fightDeaths || 0) + 1;
                }
              }
            } else {
              debuff.lastTick = now;
            }
          }
        }
      });
    });
    
    // Process enemy debuffs
    if (this.state.currentEnemies && this.state.currentEnemies.length > 0) {
      this.state.currentEnemies.forEach(enemy => {
        if (!enemy.activeDebuffs) return;
        
        Object.keys(enemy.activeDebuffs).forEach(debuffKey => {
          const debuff = enemy.activeDebuffs![debuffKey];
          if (!debuff) return;
          
          // Check if expired
          if (now >= debuff.expiresAt) {
            delete enemy.activeDebuffs![debuffKey];
            const debuffName = DEBUFFS[debuffKey]?.name || debuffKey;
            this.log('system', `${enemy.name} is no longer ${debuffName}`);
            return;
          }
          
          // Apply damage over time effects (including enchantment debuffs)
          const debuffDef = DEBUFFS[debuffKey];
          const isEnchantmentDebuff = ['fire', 'poisoned'].includes(debuffKey);
          const tickRate = debuffDef?.tickRate || 2000;
          
          if (debuffDef?.effect === 'damageOverTime' || isEnchantmentDebuff) {
            if (!debuff.lastTick || now - debuff.lastTick >= tickRate) {
              const baseDotDamage = debuff.value !== undefined ? debuff.value : (debuffDef?.value || 0);
              const dotDamage = baseDotDamage;
              
              if (dotDamage > 0) {
                const result = this.applyEnemyDamage(enemy, dotDamage);
                const enemyDied = result.died;
                const actualDamage = result.actualDamage;
                debuff.lastTick = now;
                
                this.triggerAnimation(this.enemyElementId(enemy), 'hurt', false);
                const debuffName = debuffDef?.name || debuffKey;
                const debuffIcon = debuffDef?.icon || '🔥';
                this.log('damage', `${debuffIcon} ${enemy.name} takes ${Math.floor(actualDamage)} ${debuffName} damage`);
                if (enemyDied) {
                  if (enemy.isBoss) {
                    this.log('success', `🏆 ${enemy.name} has been defeated!`);
                  } else {
                    this.log('success', `${enemy.name} is defeated!`);
                  }
                }
              } else {
                debuff.lastTick = now;
              }
            }
          }
        });
      });
    }
    
    // Process Stagger DoT (Brewmaster passive)
    heroes.forEach(hero => {
      if (!hero || hero.isDead) return;
      if (hero.staggerDoT && hero.staggerDoT > 0) {
        if (!hero.staggerLastTick) hero.staggerLastTick = now;
        
        if (now - hero.staggerLastTick >= 2000) {
          const staggerPerTick = Math.ceil(hero.staggerDoT / 4);
          const actualStaggerDamage = Math.min(staggerPerTick, hero.staggerDoT);
          
          hero.hp = Math.max(0, hero.hp - actualStaggerDamage);
          hero.staggerDoT = Math.max(0, hero.staggerDoT - actualStaggerDamage);
          hero.staggerLastTick = now;
          
          if (actualStaggerDamage > 0) {
            // Use consistent ID resolution: hero.id || hero.username || hero.name || hero.characterName
            const heroId = (hero as any).id || hero.username || (hero as any).name || (hero as any).characterName;
            this.triggerAnimation(heroId, 'hurt', true);
            this.log('damage', `🍺 ${hero.username} takes ${Math.floor(actualStaggerDamage)} staggered damage`);
          }
          
          if (hero.staggerDoT <= 0) {
            hero.staggerDoT = 0;
            hero.staggerLastTick = 0;
          }
          
          if (hero.hp <= 0 && !hero.isDead) {
            hero.isDead = true;
            hero.deathTime = now;
            hero.deathAnimationPlaying = true;
            hero.activeDebuffs = {};
            // Use consistent ID resolution: hero.id || hero.username || hero.name || hero.characterName
            const heroId = (hero as any).id || hero.username || (hero as any).name || (hero as any).characterName;
            this.triggerAnimation(heroId, 'death', true);
            this.log('death', `💀 ${hero.username} has been defeated by Stagger! (resurrect in 60s)`);
          }
        }
      }
    });
  }


  // ============================================================================
  // MAIN COMBAT FUNCTIONS
  // ============================================================================

  /**
   * Main combat resolution function
   * Extracted from IdleDnD/game.js:12634
   * This is a massive function (~8000 lines) - extracting in sections
   * 
   * Note: This function handles:
   * - Emergency abilities (Last Stand, Shield Wall, Divine Shield, etc.)
   * - Healer abilities (Group Heal, Instant Heal, Combat Res, etc.)
   * - Initiative-based turn order
   * - Hero damage calculation with all class abilities
   * - Enemy attack processing
   * - AoE abilities
   * - Buffs and debuffs
   * - Healing calculations
   */
  resolveCombat() {
    // CRITICAL: Prevent duplicate resolveCombat() calls - if already resolving, skip
    if (this.state.resolvingCombat) {
      return;
    }
    
    // Set flag to prevent duplicate calls
    this.state.resolvingCombat = true;
    
    // Don't filter out dead enemies here - let damage be applied first
    // Dead enemies will be filtered in checkCombatVictory() after all damage is applied
    // This ensures we don't lose track of enemies that die during the round
    
    this.log('combat', `⚔️ resolveCombat() called - ${this.state.currentEnemies ? this.state.currentEnemies.length : 0} enemies`);
    
    // Pause if game is paused
    if (this.state.isPaused) {
      this.state.resolvingCombat = false;
      return;
    }
    
    // Check if we have alive enemies to fight (don't filter dead ones here)
    const aliveEnemies = this.state.currentEnemies?.filter(e => e.hp > 0 && !e.isDead) || [];
    if (aliveEnemies.length === 0) {
      this.log('combat', '⚠️ resolveCombat: No alive enemies, checking victory');
      // All enemies are dead - check victory instead of processing combat
      this.checkCombatVictory();
      return;
    }
    
    if (!this.state.currentEnemies || this.state.currentEnemies.length === 0) {
      this.log('combat', '⚠️ resolveCombat: No enemies array, exiting');
      return; // No enemies array at all
    }
    
    const now = Date.now();
    
    // Apply armor enchantment passive effects (regen, etc.) before combat tick
    // This sets up passive buffs like HP regeneration from armor enchantments
    const heroes = this.getHeroesArray();
    heroes.forEach(hero => {
      if (!hero || hero.isDead || hero.hp <= 0) return;
      this.applyArmorEnchantmentEffects(hero, hero.username);
    });
    
    // Create callbacks for simplified monolithic combat engine
    const callbacks = {
      trackDeath: () => {
        if (this.state.combatMetrics) {
          this.state.combatMetrics.fightDeaths = (this.state.combatMetrics.fightDeaths || 0) + 1;
        }
      },
      log: (type: string, message: string, username?: string) => this.log(type, message),
      triggerAnimation: (entityId: string, animation: string, isHero: boolean) =>
        this.triggerAnimation(entityId, animation as any, isHero),
      triggerHealAnimation: (username: string) => this.triggerAnimation(username, 'heal', true),
      triggerCombatText: (entityId: string, amount: number, type: 'damage' | 'crit' | 'heal' | 'heal-hot' | 'dot', isHero: boolean) =>
        this.triggerCombatText(entityId, amount, type, isHero),
      updateEnemyHealthBar: () => {
        // Health bars updated via React state sync
      },
      updateHeroUI: () => {
        // Hero UI updated via React state sync
      }
    };

    // Use simplified monolithic combat engine
    // Simple flow: resolveCombat schedules all actions, then calls onComplete when done
    // NOTE: resolveCombatSimple is NOT async - it schedules actions via setTimeout and returns immediately
    // The onComplete callback will be called after all actions complete
    try {
      const now = Date.now();
      // resolveCombatSimple is synchronous - it schedules actions and returns immediately
      // The onComplete callback will be called after all scheduled actions complete
      resolveCombatSimple(
        this.state,
        now,
        callbacks,
        getCharacterStats,
        calculateSkillBonuses,
        (enemy: Enemy, damage: number) => this.applyEnemyDamage(enemy, damage),
        getHeroSpriteType,
        getEnemySpriteType,
        getAnimationDuration,
        () => {
          // All actions complete - checkCombatVictory is called here via onComplete callback
          // This ensures it's only called once, not from multiple places
          // Clear resolving flag before checking victory (allows next round to start if needed)
          this.state.resolvingCombat = false;
          this.checkCombatVictory();
        }
      );
    } catch (error) {
      this.state.resolvingCombat = false;
      // Don't schedule next round on error
    }
  }

  // Track active enemy attacks to prevent duplicates (e.g., multiple projectiles from same enemy)
  private activeEnemyAttacks = new Set<string>();

  /**
   * Process a single enemy attack
   * Extracted from IdleDnD/game.js:11550
   * Handles enemy attack targeting, damage calculation, hero defense, and all defensive abilities
   */
  private processSingleEnemyAttack(enemy: Enemy, enemyIndex: number, delay: number) {
    // CRITICAL: Prevent duplicate attacks from the same enemy
    if (this.activeEnemyAttacks.has(enemy.id)) {
      return;
    }
    
    this.activeEnemyAttacks.add(enemy.id);
    
    // Clean up tracking after attack completes (use a reasonable timeout)
    setTimeout(() => {
      this.activeEnemyAttacks.delete(enemy.id);
    }, 5000); // 5 second timeout to prevent stale entries
    if (!enemy || enemy.isDead || enemy.hp <= 0) return;
    
    const bonuses = this.getViewerBonuses();
    const now = Date.now();
    
    let enemyDamage = enemy.attack + Math.floor(Math.random() * (enemy.attack * 0.2));
    
    // Check for enemy debuffs affecting attack
    if (enemy.activeDebuffs?.weaken) {
      enemyDamage *= 0.7; // 30% reduction
    }
    
    // ENEMY ABILITIES (Difficulty > 100%)
    let isCrit = false;
    let isBloodlust = false;
    
    const difficultyModifier = this.state.difficultyModifier || 1.0;
    if (enemy.abilities && difficultyModifier > 1.0) {
      if (enemy.abilities.critChance > 0 && Math.random() < enemy.abilities.critChance) {
        isCrit = true;
        enemyDamage *= 2.0;
        this.log('combat', `💥 ${enemy.name} CRITICAL STRIKE!`);
      }
      
      if (enemy.abilities.enrageActive && now < enemy.abilities.enrageExpiry) {
        enemyDamage *= 1.4;
        if (!isCrit) {
          this.log('combat', `⚔️💥 ${enemy.name} is ENRAGED! (+40% damage)`);
        }
      } else if (enemy.abilities.enrageActive && now >= enemy.abilities.enrageExpiry) {
        enemy.abilities.enrageActive = false;
      }
      
      const timeSinceLastBloodlust = now - (enemy.abilities.lastBloodlustCheck || 0);
      if (enemy.abilities.bloodlustChance > 0 && 
          timeSinceLastBloodlust > 5000 &&
          Math.random() < enemy.abilities.bloodlustChance) {
        isBloodlust = true;
        enemy.abilities.lastBloodlustCheck = now;
        this.log('combat', `🩸 ${enemy.name} BLOODLUST! (attacking twice!)`);
      }
    }
    
    // Categorize alive heroes for targeting
    const aliveTanks: Array<{username: string; hero: Hero}> = [];
    const aliveDPS: Array<{username: string; hero: Hero}> = [];
    const aliveHealers: Array<{username: string; hero: Hero}> = [];
    
    const heroes = this.getHeroesArray();
    heroes.forEach(hero => {
      if (!hero) return;
      if (hero.hp > 0 && !hero.isDead) {
        const category = ROLE_CONFIG[hero.role]?.category || 'dps';
        if (category === 'tank') {
          aliveTanks.push({ username: hero.username, hero });
        } else if (category === 'healer') {
          aliveHealers.push({ username: hero.username, hero });
        } else {
          aliveDPS.push({ username: hero.username, hero });
        }
      }
    });
    
    // Determine target based on threat
    const weightedTargets: Array<{username: string; hero: Hero; threat: number}> = [];
    aliveTanks.forEach(tank => {
      const threat = (tank.hero.activeThreatMod || 1.0) * 20;
      weightedTargets.push({ ...tank, threat });
    });
    aliveDPS.forEach(dps => {
      const threat = (dps.hero.activeThreatMod || 1.0) * 1;
      weightedTargets.push({ ...dps, threat });
    });
    aliveHealers.forEach(healer => {
      const threat = (healer.hero.activeThreatMod || 1.0) * 0.3;
      weightedTargets.push({ ...healer, threat });
    });
    
    const totalThreat = weightedTargets.reduce((sum, t) => sum + t.threat, 0);
    let target: {username: string; hero: Hero} | null = null;
    if (totalThreat > 0) {
      const rand = Math.random() * totalThreat;
      let cumulative = 0;
      for (const tgt of weightedTargets) {
        cumulative += tgt.threat;
        if (rand <= cumulative) {
          target = tgt;
          break;
        }
      }
    }
    
    if (!target) {
      const allAlive = [...aliveTanks, ...aliveDPS, ...aliveHealers];
      if (allAlive.length > 0) {
        target = allAlive[0];
      }
    }
    
    if (!target) {
      this.activeEnemyAttacks.delete(enemy.id);
      return; // No valid target
    }
    
    // Log selected target for debugging
    
    let category = ROLE_CONFIG[target.hero.role]?.category || 'dps';
    
    // Check for INTERCEPT
    if (category !== 'tank') {
      let interceptingTank: {username: string; hero: Hero} | null = null;
      heroes.forEach(hero => {
        const heroCategory = ROLE_CONFIG[hero.role]?.category || 'dps';
        if (heroCategory === 'tank' && 
            hero.hp > 0 && 
            !hero.isDead &&
            hero.classAbilityState?.interceptActive &&
            now < hero.classAbilityState.interceptExpiry) {
          interceptingTank = { username: hero.username, hero };
        }
      });
      
      if (interceptingTank) {
        this.log('combat', `🛡️ ${interceptingTank.username} INTERCEPTS the attack on ${target.username}!`);
        target = interceptingTank;
        category = 'tank';
      }
    }
    
    // Calculate effective defense
    let effectiveDefense = category === 'tank' 
      ? target.hero.defense * bonuses.defenseMultiplier 
      : target.hero.defense;
    
    if (target.hero.activeBuffs?.defenseMultiplier && target.hero.activeBuffs.defenseMultiplier.remainingDuration > 0) {
      effectiveDefense = Math.floor(effectiveDefense * target.hero.activeBuffs.defenseMultiplier.value);
    }
    
    // Apply skill defense multipliers
    const skillBonuses = this.calculateSkillBonuses(target.hero);
    if (skillBonuses.defenseMultiplier > 0) {
      effectiveDefense = Math.floor(effectiveDefense * (1 + skillBonuses.defenseMultiplier / 100));
    }
    
    // Check for debuffs/buffs
    let damageMultiplier = 1.0;
    if (target.hero.activeDebuffs?.vulnerable) {
      damageMultiplier = 1.4;
    }
    
    let ironSkinActive = false;
    if (category === 'tank' && target.hero.activeProcBuffs?.ironSkin && now < target.hero.activeProcBuffs.ironSkin) {
      ironSkinActive = true;
    }
    
    let lastStandActive = false;
    if (category === 'tank' && target.hero.lastStandActive) {
      lastStandActive = true;
    }
    
    let divineShieldActive = false;
    if (target.hero.classAbilityState?.divineShieldActive && now < (target.hero.classAbilityState.divineShieldExpiry || 0)) {
      divineShieldActive = true;
    }
    
    let evasionActive = false;
    if (target.hero.classAbilityState?.evasionActive && now < (target.hero.classAbilityState.evasionExpiry || 0)) {
      if (Math.random() < 0.5) {
        evasionActive = true;
      }
    }
    
    let shieldWallActive = false;
    heroes.forEach(hero => {
      if (hero && hero.role === 'guardian' && hero.classAbilityState?.shieldWallActive && now < (hero.classAbilityState.shieldWallExpiry || 0)) {
        shieldWallActive = true;
      }
    });
    
    // Divine Shield = full immunity
    if (divineShieldActive) {
      this.log('combat', `✨ ${target.username} is IMMUNE! (Divine Shield)`);
      return;
    }
    
    // Evasion = dodge
    if (evasionActive) {
      this.log('combat', `⚡ ${target.username} DODGES ${enemy.name}'s attack!`);
      return;
    }
    
    // Check if enemy has projectile animations (Baby Dragon, Witch, Skeleton Mage, etc.)
    const enemyConfig = ENEMY_SPRITES[enemy.name];
    const hasProjectile = enemyConfig?.animations?.projectile || enemyConfig?.animations?.projectileDiagonal;
    
    if (hasProjectile) {
      // For projectile enemies, synchronize: attack animation -> projectile creation -> projectile hits -> damage
      // 1. Trigger attack animation
      this.triggerAnimation(this.enemyElementId(enemy), 'attack', false);
      
      // 2. Wait for attack animation to reach projectile launch frame (typically 50-60% through animation)
      const spriteType = getEnemySpriteType(enemy.name);
      const attackDuration = getAnimationDuration(spriteType, 'attack', enemy.name, enemyConfig);
      // Projectile typically fires around 50-60% through attack animation
      // For Witch (720ms attack), fire at ~360ms (50%)
      // For Skeleton Mage (1080ms attack), fire at ~540ms (50%)
      const projectileLaunchDelay = Math.floor(attackDuration * 0.5); // 50% through attack animation
      
      // Get projectile type
      const projectileType = enemyConfig.animations.projectile ? 'projectile' : 'projectileDiagonal';
      
      // 3. Create projectile after attack animation reaches launch frame
      setTimeout(() => {
        const attackerElement = document.getElementById(this.enemyElementId(enemy));
        const heroId = target.hero.id || target.username || target.hero.name || target.hero.characterName;
        const targetElement = document.getElementById(`battle-hero-${heroId}`);
        
        if (attackerElement && targetElement) {
          // 4. Create projectile - damage will be applied when it hits
          createProjectile(
            attackerElement,
            targetElement,
            enemy.name,
            projectileType,
            () => {
              // 5. When projectile reaches target, trigger hurt and apply damage
              this.triggerAnimation(heroId, 'hurt', true);
              this.applyEnemyDamageToHero(target, enemy, enemyDamage, effectiveDefense, damageMultiplier, {
                ironSkinActive,
                lastStandActive,
                shieldWallActive,
                isCrit,
                isBloodlust,
                now
              });
              // Clean up attack tracking when damage is applied
              this.activeEnemyAttacks.delete(enemy.id);
            },
            false // isHero = false
          );
        } else {
          // Fallback: if elements not found, apply damage after attack animation completes
          setTimeout(() => {
            this.triggerAnimation(heroId, 'hurt', true);
            this.applyEnemyDamageToHero(target, enemy, enemyDamage, effectiveDefense, damageMultiplier, {
              ironSkinActive,
              lastStandActive,
              shieldWallActive,
              isCrit,
              isBloodlust,
              now
            });
            // Clean up attack tracking when damage is applied
            this.activeEnemyAttacks.delete(enemy.id);
          }, attackDuration - projectileLaunchDelay);
        }
      }, projectileLaunchDelay);
    } else {
      // For non-projectile enemies, use simple attack animation
      this.triggerAnimation(this.enemyElementId(enemy), 'attack', false);
      
      // Apply damage after animation delay
      setTimeout(() => {
        this.applyEnemyDamageToHero(target, enemy, enemyDamage, effectiveDefense, damageMultiplier, {
          ironSkinActive,
          lastStandActive,
          shieldWallActive,
          isCrit,
          isBloodlust,
          now
        });
        // Clean up attack tracking when damage is applied
        this.activeEnemyAttacks.delete(enemy.id);
      }, delay);
    }
  }
  
  /**
   * Apply enemy damage to hero (helper for processSingleEnemyAttack)
   */
  private applyEnemyDamageToHero(
    target: {username: string; hero: Hero},
    enemy: Enemy,
    enemyDamage: number,
    effectiveDefense: number,
    damageMultiplier: number,
    options: {
      ironSkinActive: boolean;
      lastStandActive: boolean;
      shieldWallActive: boolean;
      isCrit: boolean;
      isBloodlust: boolean;
      now: number;
    }
  ) {
    const { ironSkinActive, lastStandActive, shieldWallActive, isCrit, isBloodlust, now } = options;
    const category = ROLE_CONFIG[target.hero.role]?.category || 'dps';
    
    let actualDamage = Math.max(1, enemyDamage - effectiveDefense);
    actualDamage = Math.floor(actualDamage * damageMultiplier);
    
    // Apply skill defense multipliers (additional damage reduction)
    const targetSkillBonuses = this.calculateSkillBonuses(target.hero);
    if (targetSkillBonuses.defenseMultiplier > 0) {
      actualDamage = Math.floor(actualDamage / (1 + targetSkillBonuses.defenseMultiplier / 100));
    }
    
    // Apply armor enchantment thorns effects BEFORE damage reductions
    if (target.hero.enchantedItems) {
      const equipment = target.hero.equipment || {};
      const armorSlots = ['armor', 'helm', 'cloak', 'gloves', 'boots', 'shield'];
      
      armorSlots.forEach(slot => {
        const item = equipment[slot];
        if (!item) return;
        
        const itemEnchantments = target.hero.enchantedItems!.find(ei => ei.itemId === item.id);
        if (!itemEnchantments || !itemEnchantments.enchantments) return;
        
        itemEnchantments.enchantments.forEach(ench => {
          const value = (ench.baseValue || 5) * (ench.level || 1);
          
          if (ench.type === 'thorns_armor') {
            // Reflect damage back to attacker
            const thornsDamage = Math.floor(actualDamage * (value / 100));
            const result = this.applyEnemyDamage(enemy, thornsDamage);
            const enemyDied = result.died;
            this.triggerAnimation(this.enemyElementId(enemy), 'hurt', false);
            this.log('damage', `🌿 ${target.username}'s Thorns Armor reflects ${Math.floor(result.actualDamage)} damage to ${enemy.name}!`);
            if (enemyDied) {
              this.log('success', `${enemy.name} is defeated!`);
            }
          } else if (ench.type === 'frozen_armor') {
            // Slow the attacker
            if (!enemy.activeDebuffs) enemy.activeDebuffs = {};
            enemy.activeDebuffs.slowed = {
              expiresAt: now + 3000, // 3 seconds
              appliedBy: target.username,
              value: value // Slow percentage
            };
            this.log('combat', `❄️ ${target.username}'s Frozen Armor slows ${enemy.name}!`);
          }
        });
      });
    }
    
    // Apply damage reductions
    if (lastStandActive) {
      actualDamage = Math.floor(actualDamage * 0.25);
      this.log('combat', `🛡️💥 ${target.username} LAST STAND absorbs massive damage!`);
    } else if (ironSkinActive) {
      actualDamage = Math.floor(actualDamage * 0.5);
      this.log('combat', `💎 ${target.username} IRON SKIN blocks damage!`);
    }
    
    if (shieldWallActive) {
      actualDamage = Math.floor(actualDamage * 0.7);
    }
    
    // Apply debuff chance
    const debuffChance = enemy.isBoss ? 0.4 : 0.2;
    if (Math.random() < debuffChance) {
      const debuffOptions = ['bleed', 'cursed', 'weaken'];
      if (enemy.isBoss && Math.random() < 0.3) {
        debuffOptions.push('stunned');
      }
      const debuffChoice = debuffOptions[Math.floor(Math.random() * debuffOptions.length)];
      this.applyDebuff(target.hero, debuffChoice, enemy.name);
    }
    
    // Track big hits for Shield Guardian
    if (target.hero.role === 'guardian' && actualDamage >= target.hero.maxHp * 0.4) {
      target.hero.lastBigHit = now;
    }
    
    actualDamage = Math.max(3, actualDamage);
    
    // Damage cap
    const maxDamagePerHit = Math.floor(target.hero.maxHp * 0.35);
    if (actualDamage > maxDamagePerHit) {
      actualDamage = maxDamagePerHit;
    }
    
    // Shield absorption
    let shieldAbsorbed = 0;
    if (target.hero.shield && target.hero.shield.amount > 0 && now < target.hero.shield.expiresAt) {
      shieldAbsorbed = Math.min(target.hero.shield.amount, actualDamage);
      target.hero.shield.amount -= shieldAbsorbed;
      actualDamage -= shieldAbsorbed;
      
      if (shieldAbsorbed > 0) {
        this.log('combat', `💙 ${target.username}'s shield absorbs ${Math.floor(shieldAbsorbed)} damage!`);
        
        if (target.hero.shield.amount <= 0) {
          target.hero.shield = null;
        }
      }
    }
    
    // Apply damage
    if (target.hero.role === 'brewmaster') {
      const immediateDamage = Math.floor(actualDamage * 0.4);
      const staggeredDamage = actualDamage - immediateDamage;
      target.hero.hp -= immediateDamage;
      if (!target.hero.staggerDoT) target.hero.staggerDoT = 0;
      target.hero.staggerDoT += staggeredDamage;
      this.log('combat', `🍺 ${target.username} staggers ${Math.floor(staggeredDamage)} damage over 8s`);
    } else {
      target.hero.hp -= actualDamage;
    }
    
    // Trigger animations - use same ID resolution as Map key and sprite container (hero.id || hero.name || hero.characterName)
    // The Map key is hero.id || hero.name || hero.characterName, and sprite container uses the same
    // target.username is hero.name || hero.characterName, so we use target.hero.id || target.username || target.hero.name || target.hero.characterName
    const heroId = target.hero.id || target.username || target.hero.name || target.hero.characterName;
    this.triggerAnimation(heroId, 'hurt', true);
    
    // Show combat text for hero damage - use same ID resolution to match sprite container ID
    if (actualDamage > 0) {
      if (isCrit) {
        this.triggerCombatText(heroId, actualDamage, 'crit', true);
      } else {
        this.triggerCombatText(heroId, actualDamage, 'damage', true);
      }
    }
    
    // Warden thorns
    if (target.hero.role === 'warden' && actualDamage > 0) {
      const thornsDamage = Math.floor(actualDamage * 0.35);
      const result = this.applyEnemyDamage(enemy, thornsDamage);
      this.triggerAnimation(this.enemyElementId(enemy), 'hurt', false);
      this.log('damage', `🌿 ${target.username}'s Thorns reflects ${Math.floor(result.actualDamage)} damage to ${enemy.name}!`);
      if (result.died) {
        this.log('success', `${enemy.name} is defeated!`);
      }
      if (!target.hero.stats) target.hero.stats = { totalDamage: 0, totalHealing: 0, damageBlocked: 0 };
      target.hero.stats.totalDamage += result.actualDamage;
    }
    
    // Log damage
    if (isCrit) {
      this.log('combat', `💥 ${enemy.name} CRITICAL STRIKE hits ${target.username} for ${Math.floor(actualDamage)} damage!`);
    } else {
      this.log('combat', `${enemy.name} hits ${target.username} for ${Math.floor(actualDamage)} damage`);
    }
    
    // Reset enemy animation
    this.triggerAnimation(String(enemy.id), 'idle', false);
    
    // Check for hero death
    if (target.hero.hp <= 0) {
      target.hero.hp = 0;
      target.hero.isDead = true;
      target.hero.deathTime = Date.now();
      target.hero.activeDebuffs = {};
      this.triggerAnimation(target.username, 'death', true);
      this.log('death', `💀 ${target.username} has been defeated! (resurrect in 60s)`);
      target.hero.deathAnimationPlaying = true;
    } else {
      // Play hurt animation (already triggered above)
      // Auto-return to idle after a delay (handled by animation callbacks)
    }
    
    // Handle bloodlust double attack
    if (isBloodlust && enemy.abilities && !enemy.isDead && enemy.hp > 0) {
      setTimeout(() => {
        // Second attack with new damage roll
        let bloodlustDamage = enemy.attack + Math.floor(Math.random() * (enemy.attack * 0.2));
        if (enemy.activeDebuffs?.weaken) {
          bloodlustDamage *= 0.7;
        }
        if (enemy.abilities.enrageActive && Date.now() < enemy.abilities.enrageExpiry) {
          bloodlustDamage *= 1.4;
        }
        
        let bloodlustActualDamage = Math.max(1, bloodlustDamage - effectiveDefense);
        bloodlustActualDamage = Math.floor(bloodlustActualDamage * damageMultiplier);
        
        const maxDamagePerHit = Math.floor(target.hero.maxHp * 0.35);
        if (bloodlustActualDamage > maxDamagePerHit) {
          bloodlustActualDamage = maxDamagePerHit;
        }
        
        if (lastStandActive) {
          bloodlustActualDamage = Math.floor(bloodlustActualDamage * 0.25);
        } else if (ironSkinActive) {
          bloodlustActualDamage = Math.floor(bloodlustActualDamage * 0.5);
        }
        if (shieldWallActive) {
          bloodlustActualDamage = Math.floor(bloodlustActualDamage * 0.7);
        }
        
        // Shield absorption for bloodlust
        if (target.hero.shield && target.hero.shield.amount > 0 && Date.now() < target.hero.shield.expiresAt) {
          const shieldAbsorbed = Math.min(target.hero.shield.amount, bloodlustActualDamage);
          target.hero.shield.amount -= shieldAbsorbed;
          bloodlustActualDamage -= shieldAbsorbed;
          if (target.hero.shield.amount <= 0) {
            target.hero.shield = null;
          }
        }
        
        if (target.hero.role === 'brewmaster') {
          const immediateDamage = Math.floor(bloodlustActualDamage * 0.4);
          const staggeredDamage = bloodlustActualDamage - immediateDamage;
          target.hero.hp -= immediateDamage;
          if (!target.hero.staggerDoT) target.hero.staggerDoT = 0;
          target.hero.staggerDoT += staggeredDamage;
        } else {
          target.hero.hp -= bloodlustActualDamage;
        }
        
        this.triggerAnimation(target.username, 'hurt', true);
        this.log('combat', `🩸 ${enemy.name} BLOODLUST hits ${target.username} again for ${Math.floor(bloodlustActualDamage)} damage!`);
        
        if (target.hero.hp <= 0) {
          target.hero.hp = 0;
          target.hero.isDead = true;
          target.hero.deathTime = Date.now();
          target.hero.activeDebuffs = {};
          this.triggerAnimation(target.username, 'death', true);
          this.log('death', `💀 ${target.username} has been defeated! (resurrect in 60s)`);
          target.hero.deathAnimationPlaying = true;
          
          // Track death in combat metrics (matches Electron app line 11925)
          if (this.state.combatMetrics) {
            this.state.combatMetrics.fightDeaths = (this.state.combatMetrics.fightDeaths || 0) + 1;
          }
        }
      }, 1000);
    }
  }

  /**
   * Check if combat is won and handle victory/continue
   * Extracted from IdleDnD/game.js:14908
   */
  private checkCombatVictory() {
    const now = Date.now();
    
    testLog('Combat', 'Check Victory', 'Checking combat victory conditions');
    
    // Create callbacks for simplified combat engine
    const callbacks: any = {
      trackDeath: () => {
        if (this.state.combatMetrics) {
          this.state.combatMetrics.fightDeaths = (this.state.combatMetrics.fightDeaths || 0) + 1;
        }
      },
      log: (type: string, message: string, username?: string) => this.log(type, message),
      triggerAnimation: (entityId: string, animation: string, isHero: boolean) =>
        this.triggerAnimation(entityId, animation as any, isHero),
      triggerHealAnimation: (username: string) => this.triggerAnimation(username, 'heal', true),
      triggerCombatText: (entityId: string, amount: number, type: 'damage' | 'crit' | 'heal' | 'heal-hot' | 'dot', isHero: boolean) =>
        this.triggerCombatText(entityId, amount, type, isHero),
      updateEnemyHealthBar: () => {
        // Health bars updated via React state sync
      },
      updateHeroUI: () => {
        // Hero UI updated via React state sync
      }
    };

    // CRITICAL: Validate state before checking victory conditions
    // This ensures HP and isDead flags are consistent before filtering
    this.validateCombatState();
    
    // Check for victory/defeat conditions
    // Match Electron app filtering: heroes use hp > 0 && !isDead, enemies use hp <= 0 || isDead
    const aliveHeroes = this.getHeroesArray().filter((h: any) => h && h.hp > 0 && !h.isDead); // Match Electron app line 13241, 14987
    // Match Electron app line 14919: if (enemy.hp <= 0 || enemy.isDead) return false
    const aliveEnemies = (this.state.currentEnemies || []).filter((e: any) => {
      const hp = Math.floor(e.hp || 0);
      return !(hp <= 0 || e.isDead); // Keep alive enemies (not dead and hp > 0)
    });
    
    testLog('Combat', 'Check Victory', `${aliveHeroes.length} alive heroes, ${aliveEnemies.length} alive enemies`);
    
    // Capture defeated enemies BEFORE filtering (needed for reward distribution)
    const defeatedEnemies = (this.state.currentEnemies || []).filter((e: any) => e.isDead || e.hp <= 0);
    
    // Filter out dead enemies - match Electron app line 14918-14925
    // Match Electron app: filter if enemy.hp <= 0 || enemy.isDead
    if (this.state.currentEnemies) {
      this.state.currentEnemies = this.state.currentEnemies.filter((e: any) => {
        // Ensure HP is an integer and check for death
        const hp = Math.floor(e.hp || 0);
        // Match Electron app: remove if hp <= 0 OR isDead
        // Electron app line 14919: if (enemy.hp <= 0 || enemy.isDead)
        if (hp <= 0 || e.isDead) {
          return false; // Remove dead enemy
        }
        return true; // Keep alive enemy
      });
    }
    
    // Victory: all enemies defeated
    if (aliveEnemies.length === 0 && aliveHeroes.length > 0) {
      this.state.combatAnimationActive = false;
      callbacks.log('success', '🏆 Victory! All enemies defeated!');
      
      // Distribute rewards (XP, gold, loot) to heroes - pass defeated enemies
      this.distributeCombatRewards(defeatedEnemies);
      
      // Clear enemies array
      this.state.currentEnemies = [];
      this.state.inCombat = false;
      this.stopCombat();
      
      testLog('Combat', 'Check Victory', 'All enemies defeated - spawning next wave');
      
      // CRITICAL: Spawn next wave directly instead of relying on adventureTick randomness
      // This ensures enemies spawn immediately after victory, matching expected behavior
      // Wait for death animations to complete before spawning next wave
      setTimeout(() => {
        // Ensure adventure loop is running (start it if not already running)
        if (!this.state.isAdventuring) {
          this.startAdventure();
        }
        
        if (!this.state.isPaused && !this.state.editModePausedCombat) {
          // Check if the NEXT wave should be a boss (every 10 waves)
          // encounterEnemy will increment waveCount, so we check the value after increment
          const currentWave = this.state.waveCount || 0;
          const nextWave = currentWave + 1;
          const isBossWave = (nextWave % 10 === 0);
          
          testLog('Combat', 'Check Victory', `Spawning next wave (will be ${nextWave})${isBossWave ? ' - BOSS WAVE' : ''}`);
          
          // Spawn next wave directly - encounterEnemy will increment waveCount and start combat
          // The encounterEnemy method has a safety check to prevent spawning if enemies already exist
          // Since we cleared currentEnemies above, this should work correctly
          this.encounterEnemy(isBossWave);
        }
      }, 2000); // 2 second delay to allow death animations to complete
      
      return;
    }
    
    // Defeat: all heroes dead (but they can resurrect)
    if (aliveHeroes.length === 0) {
      this.state.combatAnimationActive = false;
      this.state.inCombat = false;
      callbacks.log('death', '💀 All heroes defeated! Waiting for resurrection...');
      
      // CRITICAL: Stop combat when all heroes die
      // This prevents combat loop from continuing and enemies from attacking dead heroes
      this.stopCombat();
      
      // Keep resurrection check interval running so heroes can resurrect
      // stopCombat() will only stop resurrection interval if no enemies remain
      // Since we're waiting for resurrection, we want to keep checking
      
      return;
    }
    
    // Combat continues - match Electron app line 15057-15061
    // Electron app calls startCombat() again when enemies are still alive
    if (aliveEnemies.length > 0 && aliveHeroes.length > 0) {
      // Match Electron app: call startCombat() again to continue the combat loop
      // Electron app line 15061: startCombat();
      
      // Match Electron app: startCombat() handles the next round
      // The timing is handled by resolveCombat's setTimeout, so we can call startCombat immediately
      // startCombat() will check guards and prevent duplicate calls
      this.startCombat();
    }

    // Process XP, loot, gold distribution (handled internally by checkCombatVictorySimple)
    // Adjust difficulty if needed
    // Note: defeatedEnemies was already captured above before filtering
    if (defeatedEnemies.length > 0 && this.state.combatMetrics && this.state.combatMetrics.fightStartTime > 0) {
      const fightDuration = (Date.now() - this.state.combatMetrics.fightStartTime) / 1000;
      const fightData = {
        duration: fightDuration,
        deaths: this.state.combatMetrics.fightDeaths || 0,
        damageTaken: this.state.combatMetrics.fightDamageTaken || 0,
        healingDone: this.state.combatMetrics.fightHealingDone || 0,
        isBoss: defeatedEnemies.some((e: any) => e.isBoss)
      };
      
      // Only adjust if combat ended (no enemies left)
      if (this.state.currentEnemies && this.state.currentEnemies.length === 0) {
        this.adjustDifficulty(fightData);
      }
    }
  }
  
  /**
   * Distribute combat rewards (XP, gold, loot) to heroes after victory
   * Matches Electron app reward distribution logic
   */
  private distributeCombatRewards(defeatedEnemies: Enemy[] = []) {
    const heroes = this.getHeroesArray();
    
    // If no defeated enemies passed, try to get from state (fallback)
    const enemies = defeatedEnemies.length > 0 
      ? defeatedEnemies 
      : (this.state.currentEnemies || []).filter(e => e.isDead || e.hp <= 0);
    
    if (enemies.length === 0) {
      // No enemies to reward from - skip distribution
      return;
    }
    
    const aliveHeroes = heroes.filter(h => h && h.hp > 0 && !h.isDead);
    if (aliveHeroes.length === 0) return;
    
    // Calculate total rewards from all defeated enemies
    let totalXP = 0;
    let totalGold = 0;
    
    enemies.forEach((enemy: any) => {
      // XP reward (matches Electron app: enemy.xp value)
      const enemyXP = enemy.xp || 0;
      totalXP += enemyXP;
      
      // Gold reward (matches Electron app: enemy.xp / 10)
      totalGold += Math.floor(enemyXP / 10);
    });
    
    // Distribute XP and gold to alive heroes
    const xpPerHero = Math.floor(totalXP / aliveHeroes.length);
    const goldPerHero = Math.floor(totalGold / aliveHeroes.length);
    
    aliveHeroes.forEach(hero => {
      if (!hero) return;
      
      // Grant XP
      const oldXP = hero.xp || 0;
      hero.xp = oldXP + xpPerHero;
      hero.maxXp = hero.maxXp || (100 + (hero.level || 1) * 10);
      
      // Check for level up
      while (hero.xp >= hero.maxXp) {
        this.levelUpHero(hero);
      }
      
      // Grant gold
      hero.gold = (hero.gold || 0) + goldPerHero;
      
      // Log rewards (only if meaningful amounts)
      if (xpPerHero > 0) {
        this.log('success', `✨ ${hero.username} gained ${xpPerHero} XP!`);
      }
      if (goldPerHero > 0) {
        this.log('loot', `💰 ${hero.username} gained ${goldPerHero} gold!`);
      }
    });
    
    // Loot generation (simplified - can be enhanced later)
    // 10% chance per enemy for a loot drop
    const lootChance = 0.1;
    const shouldDropLoot = Math.random() < (lootChance * enemies.length);
    
    if (shouldDropLoot && aliveHeroes.length > 0) {
      // Randomly assign to an alive hero
      const randomHero = aliveHeroes[Math.floor(Math.random() * aliveHeroes.length)];
      if (randomHero) {
        // Generate equipment item with proper name and rarity
        const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
        const rarityWeights = [0.5, 0.3, 0.15, 0.04, 0.01]; // Common is most likely
        const rand = Math.random();
        let rarityIndex = 0;
        let cumulative = 0;
        for (let i = 0; i < rarityWeights.length; i++) {
          cumulative += rarityWeights[i];
          if (rand <= cumulative) {
            rarityIndex = i;
            break;
          }
        }
        const rarity = rarities[rarityIndex];
        
        // Generate item name based on rarity
        const itemNames = {
          common: ['Iron Sword', 'Leather Armor', 'Copper Ring', 'Basic Helm'],
          uncommon: ['Steel Blade', 'Chainmail', 'Silver Ring', 'Reinforced Helm'],
          rare: ['Mithril Sword', 'Plate Armor', 'Gold Ring', 'Enchanted Helm'],
          epic: ['Dragon Blade', 'Dragon Scale Armor', 'Platinum Ring', 'Crown of Power'],
          legendary: ['Excalibur', 'Armor of the Gods', 'Ring of Eternity', 'Helm of Destiny']
        };
        const nameOptions = itemNames[rarity as keyof typeof itemNames] || itemNames.common;
        const itemName = nameOptions[Math.floor(Math.random() * nameOptions.length)];
        
        // Generate equipment item
        const lootItem = {
          id: `loot-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: itemName,
          rarity: rarity,
          type: 'equipment',
          attack: rarityIndex * 5 + Math.floor(Math.random() * 10),
          defense: rarityIndex * 3 + Math.floor(Math.random() * 8),
          hp: rarityIndex * 10 + Math.floor(Math.random() * 20)
        };
        
        // Add to hero's inventory
        if (!randomHero.inventory) {
          randomHero.inventory = [];
        }
        randomHero.inventory.push(lootItem);
        
        // Show loot notification with item name and rarity
        const rarityIcon = rarity === 'legendary' ? '⭐' : rarity === 'epic' ? '💜' : rarity === 'rare' ? '💙' : rarity === 'uncommon' ? '💚' : '⚪';
        this.log('loot', `🎁 ${randomHero.username} found ${rarityIcon} ${itemName} (${rarity})!`);
        
        // Trigger combat text for loot (use 'loot' type, amount 0 for item pickup)
        const heroId = randomHero.id || randomHero.username || randomHero.name || randomHero.characterName;
        this.triggerCombatText(heroId, 0, 'loot', true);
      }
    }
    
    // Log total rewards
    if (totalXP > 0 || totalGold > 0) {
      this.log('system', `💰 Party rewards: ${totalXP} XP, ${totalGold} gold`);
    }
    
    // Reset combat metrics for next fight
    if (this.state.combatMetrics) {
      this.state.combatMetrics.fightStartTime = 0;
      this.state.combatMetrics.fightDeaths = 0;
      this.state.combatMetrics.fightDamageTaken = 0;
      this.state.combatMetrics.fightHealingDone = 0;
    }
  }
  
  /**
   * Check for hero resurrection - auto-resurrect after 60 seconds
   * Equivalent to Electron app's checkMidFightEmergency resurrection logic
   * Reference: E:\IdleDnD\game.js lines 6510-6529
   */
  private checkHeroResurrection() {
    const now = Date.now();
    const heroes = this.getHeroesArray();
    let resurrected = false;
      
      heroes.forEach(hero => {
        if (!hero) return;
        
      // Check if hero is dead and has been dead for 60 seconds (matches Electron app line 6512)
      if (hero.isDead && hero.deathTime && (now - hero.deathTime >= 60000)) {
        // Resurrect after 60 seconds (matches Electron app line 6513-6515)
        const resurrectHp = Math.floor((hero.maxHp || 100) * 0.5); // Resurrect with 50% HP
        
        // CRITICAL: Clear all death-related flags and set HP BEFORE clearing isDead
        // This ensures targeting checks see the hero as alive immediately
        hero.hp = Math.max(1, resurrectHp); // Ensure HP is at least 1
        hero.isDead = false; // Clear death flag
        hero.deathTime = undefined;
        hero.deathAnimationPlaying = false; // Clear death animation flag
        hero.activeDebuffs = {}; // Clear debuffs on resurrection (matches Electron app behavior)
        
        // Reset animation to idle after resurrection (matches Electron app line 6519)
        // Use proper hero ID format for animation trigger
        const heroId = hero.id || hero.username || hero.name || hero.characterName;
        if (heroId) {
          const formattedHeroId = heroId.startsWith('battle-hero-') ? heroId : `battle-hero-${heroId}`;
          this.triggerAnimation(formattedHeroId, 'idle', true);
        }
        
        this.log('success', `✨ ${hero.username} has been resurrected with ${hero.hp} HP!`);
        resurrected = true;
      }
    });
    
    if (resurrected) {
      
      // If enemies are present and combat was stopped due to party wipe, resume combat
      if (this.state.currentEnemies && this.state.currentEnemies.length > 0) {
        const aliveEnemies = this.state.currentEnemies.filter(e => e.hp > 0 && !e.isDead);
        if (aliveEnemies.length > 0) {
          // Check if combat is currently stopped
          if (!this.combatInterval && !this.state.isPaused && !this.state.editModePausedCombat) {
            this.log('combat', '⚔️ Battle continues as heroes return!');
            this.startCombat();
          }
        }
      }
      
      // Force UI update if callback is set
      // The animation callback should handle visual updates
    }
  }
}
