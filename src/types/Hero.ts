export interface Equipment {
  weapon: Item | null;
  armor: Item | null;
  accessory: Item | null;
  shield: Item | null;
  helm: Item | null;
  cloak: Item | null;
  gloves: Item | null;
  ring1: Item | null;
  ring2: Item | null;
  boots: Item | null;
}

export interface Item {
  id?: string;
  name: string;
  slot: 'weapon' | 'armor' | 'accessory' | 'shield' | 'helm' | 'cloak' | 'gloves' | 'ring1' | 'ring2' | 'boots' | 'consumable';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
  attack: number;
  defense: number;
  hp: number;
  color: string;
  // Primary stats
  intellect?: number;
  strength?: number;
  dexterity?: number;
  stamina?: number;
  wisdom?: number;
  // Set name for gear sets
  setName?: string;
  // Secondary stats
  secondaryStats?: {
    healingPower?: number;
    spellDamage?: number;
    meleeDamage?: number;
    hpRegen?: number;
    damageReduction?: number;
    critChance?: number;
  };
  procEffects?: ProcEffect[];
  specialModifier?: {
    name: string;
    effect: string;
    value: number;
    description: string;
  };
  appliedUpgrades?: AppliedUpgrade[];
  upgradeLevel?: number; // Current upgrade level (0 = no upgrades, max 10)
  upgradeStats?: Array<{
    level: number; // Which upgrade level (1-10)
    selectedStats: Array<{
      type: 'attack' | 'defense' | 'hp' | 'critChance' | 'critDamage' | 'healingPower' | 'spellDamage';
      value: number; // Percentage bonus
    }>;
  }>;
  // Profession item fields
  professionItem?: boolean;
  professionType?: 'herbalism' | 'mining' | 'enchanting';
  recipeKey?: string;
  tier?: number;
  quantity?: number;
  craftedAt?: number;
  // Socket system
  sockets?: Socket[];
  maxSockets?: number;
}

export interface Socket {
  id: string;          // Unique socket ID
  gem?: Gem;           // Inserted gem (if any)
  socketType?: 'red' | 'blue' | 'green' | 'yellow' | 'prismatic'; // Socket color (optional - can be any color)
}

export interface Gem {
  id: string;
  type: 'ruby' | 'sapphire' | 'emerald' | 'diamond';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  stats: {
    attack?: number;
    defense?: number;
    critChance?: number;
    critDamage?: number;
    damageReduction?: number;
    maxHp?: number;
    allStats?: number;
    xpGain?: number;
    goldGain?: number;
    tokenGain?: number;
  };
}

export interface AppliedUpgrade {
  recipeKey: string;
  itemId: string;
  appliedAt: number;
  bonus: {
    attack?: number;
    defense?: number;
    hp?: number;
  };
}

export interface ProcEffect {
  name?: string;
  effect: string;
  chance: number;
  value: number;
  description?: string;
}

export interface ActiveBuff {
  value: number;
  remainingDuration: number;
  name: string;
  lastUpdateTime: number;
  persistsThroughDeath?: boolean;
}

export interface HeroStats {
  totalDamage: number;
  totalHealing: number;
  damageBlocked: number;
}

export interface RestedXp {
  hoursRemaining: number;
  lastUpdated: number;
  totalGranted: number;
  totalConsumed: number;
}

export interface Hero {
  id?: string;
  name: string;
  role: string;
  level: number;
  hp: number;
  maxHp: number;
  xp: number;
  maxXp: number;
  attack: number;
  defense: number;
  gold: number;
  tokens: number;
  totalIdleTokens: number;
  lastTokenClaim: number;
  lastCommandTime: number;
  equipment: Equipment;
  stats: HeroStats;
  isDead: boolean;
  deathTime: number | null;
  potions: {
    health: number;
  };
  activeBuffs: Record<string, ActiveBuff>;
  profession: Profession | null;
  restedXp?: RestedXp;
  joinedAt: number;
  // Skills system
  skills?: Record<string, { points: number }>;
  skillPoints?: number;
  skillPointsEarned?: number;
  // User identification
  twitchUserId?: string;
  tiktokUserId?: string;
  // Cosmetic/badge system
  founderBadge?: string; // Path to founder badge image (e.g., "/Badges/FoundersGold.png")
  activeBadge?: string; // Currently active badge (for future badge system expansion)
  nameColor?: string; // Custom hex color for hero name (e.g., "#FF5733")
  nameFrame?: string; // Name frame style: 'bronze' | 'silver' | 'gold' | 'platinum' | null
  auraEffect?: string; // Aura effect style: 'bronze' | 'silver' | 'gold' | 'platinum' | null
  auraColor?: string; // Custom hex color for aura effect (e.g., "#FF5733") - overrides tier default color
  spellEffect?: string; // Spell effect style: 'bronze' | 'silver' | 'gold' | 'platinum' | null - Enhanced visual effects for projectiles/abilities
  inventory?: Item[]; // Hero's inventory items (gear, consumables, etc.)
  shopBuffs?: Record<string, { remainingDuration: number; lastUpdateTime: number }>; // Active shop buffs
  // Prestige system
  prestigeLevel?: number; // 0 = never prestiged, 1+ = prestige count
  prestigeTokens?: number; // Tokens earned from prestiging
  prestigeBoosts?: {
    xpGain: number; // Multiplier (e.g., 1.02 = +2%)
    goldGain: number; // Multiplier
    idleTicketGain: number; // Multiplier
    statBoost: {
      attack: number; // Flat bonus
      defense: number; // Flat bonus
      hp: number; // Flat bonus
    };
  };
  // Prestige cores attached to equipment slots (not items, so they persist when gear is replaced)
  prestigeSlotCores?: Record<string, {
    id: string;
    tier: string;
    name: string;
    statBonus: {
      attack?: number;
      defense?: number;
      hp?: number;
    };
    bonus: {
      xpGain?: number;
      goldGain?: number;
    };
    color: string;
    appliedAt: number;
  }>;
}

export interface Profession {
  type: 'herbalism' | 'mining' | 'enchanting';
  level: number;
  xp: number;
  maxXp: number;
  materials: {
    herbs?: {
      common: number;
      uncommon: number;
      rare: number;
      epic: number;
    };
    ore?: {
      iron: number;
      steel: number;
      mithril: number;
      adamantite: number;
    };
    essence?: number;
  };
  // Removed: profession items now go directly to hero.inventory
  totalGathered: number;
  totalCrafted: number;
  lastGatherTime: number;
}

export interface CraftedItem {
  id: string;
  recipeKey: string;
  type: string;
  quantity: number;
  craftedAt: number;
  tier: number;
}
