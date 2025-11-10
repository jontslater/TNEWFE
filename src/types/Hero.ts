export interface Equipment {
  weapon: Item | null;
  armor: Item | null;
  accessory: Item | null;
  shield: Item | null;
}

export interface Item {
  id?: string;
  name: string;
  slot: 'weapon' | 'armor' | 'accessory' | 'shield';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  attack: number;
  defense: number;
  hp: number;
  color: string;
  procEffects?: ProcEffect[];
}

export interface ProcEffect {
  effect: string;
  chance: number;
  value: number;
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

export interface Hero {
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
  joinedAt: number;
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
  inventory: CraftedItem[];
  totalGathered: number;
  totalCrafted: number;
  lastGatherTime: number;
}

export interface CraftedItem {
  item: string;
  quantity: number;
  tier: number;
  name: string;
}
