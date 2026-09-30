/**
 * Overlay Type Definitions
 * 
 * Types extracted from CleanBattlefieldSource.tsx for better organization.
 * These types are specific to the OBS browser-source overlay.
 */

/**
 * Hero type for overlay (extended from base Hero with overlay-specific fields)
 */
export interface OverlayHero {
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
  enrageExpiry?: number;
  tauntExpiry?: number;
  fadeExpiry?: number;
  cooldowns?: {
    groupHeal?: number;
    shieldWall?: number;
    chainLightning?: number;
    whirlwind?: number;
    bloodthirst?: number;
    raiseDead?: number;
  };
  // Minion properties (for necromancer skeletons)
  isMinion?: boolean;
  summonerId?: string;
  skeletonType?: 'Yellow' | 'White';
  minionExpiresAt?: number;
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
  founderPackTier?: string;
  nameColor?: string;
  nameFrame?: string;
  auraEffect?: string;
  auraColor?: string;
  prestigeLevel?: number;
  spellEffect?: string;
}

/**
 * Enemy type for overlay
 */
export interface OverlayEnemy {
  id: string;
  name: string;
  enemyType?: string;
  level: number;
  hp: number;
  maxHp: number;
  shield?: number;
  attack?: number;
  defense?: number;
  xp?: number;
  gold?: number;
  isBoss?: boolean;
  isTransformed?: boolean;
  activeDebuffs?: Record<string, {
    expiresAt: number;
    appliedBy: string;
    lastTick?: number;
    value?: number;
  }>;
  isDead?: boolean;
  abilities?: Record<string, any>;
}

/**
 * Combat action for initiative system
 */
export interface CombatAction {
  type: 'hero' | 'enemy' | 'heal' | 'resurrect';
  actorId: string;
  actorName: string;
  targetId: string;
  targetName: string;
  initiative: number;
  isHero: boolean;
  isAOE?: boolean;
}

/**
 * Scrolling Combat Text entry
 */
export interface SCTEntry {
  id: string;
  text: string;
  x: number;
  y: number;
  type: 'damage' | 'heal' | 'shield' | 'xp' | 'gold' | 'loot' | 'buff' | 'debuff';
  timestamp: number;
  isCrit?: boolean;
}

/**
 * Rare loot announcement
 */
export interface RareLootAnnouncement {
  itemName: string;
  rarity: string;
  heroName: string;
}
