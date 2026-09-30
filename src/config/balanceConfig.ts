/**
 * Balance Configuration
 * 
 * Centralized game balance formulas to ensure consistency across the codebase.
 * All progression curves, scaling, and rewards are defined here.
 */

export interface BalanceConfig {
  enemy: {
    // Base stats for level 1 enemies
    baseAttack: number;
    baseDefense: number;
    baseHp: number;
    baseXp: number;
    baseGold: number;
    
    // Scaling curves (linear, not quadratic)
    attackScaling: (level: number, difficulty: number) => number;
    defenseScaling: (level: number, difficulty: number) => number;
    hpScaling: (level: number, difficulty: number) => number;
    xpScaling: (level: number, difficulty: number) => number;
    goldScaling: (level: number, difficulty: number) => number;
  };
  
  hero: {
    // Base stats for level 1 heroes
    baseHp: number;
    baseAttack: number;
    baseDefense: number;
    
    // Per-level gains
    hpPerLevel: number;
    attackPerLevel: number;
    defensePerLevel: number;
    
    // XP curve for leveling
    xpCurve: (level: number) => number;
  };
  
  loot: {
    // Ensure stronger enemies give better loot
    rarityByDifficulty: {
      trash: { rare: number; epic: number; legendary: number };
      elite: { rare: number; epic: number; legendary: number };
      dungeonNormal: { rare: number; epic: number; legendary: number };
      dungeonHeroic: { rare: number; epic: number; legendary: number };
      dungeonMythic: { rare: number; epic: number; legendary: number };
      raidNormal: { rare: number; epic: number; legendary: number };
      raidHeroic: { rare: number; epic: number; legendary: number };
      raidMythic: { rare: number; epic: number; legendary: number };
      worldBoss: { rare: number; epic: number; legendary: number };
    };
    
    // Item power by rarity (for comparison with shop items)
    itemPowerByRarity: {
      common: number;
      uncommon: number;
      rare: number;
      epic: number;
      legendary: number;
      mythic: number;
    };
  };
  
  shop: {
    // Shop items should be worse than dropped gear of same level
    // Shop legendary = 70% of dropped legendary power
    itemPowerMultiplier: number;
    
    // Base prices (gold)
    weaponBasePrice: number;
    armorBasePrice: number;
    
    // Price scaling by level and rarity
    priceScaling: (level: number, rarity: string) => number;
    
    // Gold sinks
    enchantingBaseCost: number;
    repairCostPercentage: number; // % of item value
    respecCost: number;
    gemSocketCost: number;
  };
}

/**
 * OLD BALANCE (Quadratic, broken)
 * - Enemy attack/hp scaled with level^2 (9000 attack at level 50!)
 * - XP rewards were flat (500 XP regardless of level)
 * - Shop weapons could beat legendaries
 */
const OLD_BALANCE = {
  enemyAttackScaling: (level: number, difficulty: number) => {
    const scalingMultiplier = 1 + (level - 1) * 0.1 * difficulty;
    return 50 * Math.pow(scalingMultiplier, 2); // QUADRATIC - causes spike
  },
  enemyHpScaling: (level: number, difficulty: number) => {
    const scalingMultiplier = 1 + (level - 1) * 0.1 * difficulty;
    return 100 * Math.pow(scalingMultiplier, 2); // QUADRATIC
  },
  xpReward: 500, // FLAT - doesn't match quadratic level curve
};

/**
 * NEW BALANCE (Linear, sane progression)
 */
export const BALANCE: BalanceConfig = {
  enemy: {
    baseAttack: 50,
    baseDefense: 20,
    baseHp: 100,
    baseXp: 10,
    baseGold: 5,
    
    // LINEAR scaling - prevents damage spikes
    attackScaling: (level: number, difficulty: number = 1.0) => {
      // Attack scales linearly with level
      // Difficulty multiplier: 1.0 = normal, 1.5 = elite, 2.0 = boss
      const levelFactor = 1 + (level - 1) * 0.15; // 15% per level
      return Math.floor(BALANCE.enemy.baseAttack * levelFactor * difficulty);
    },
    
    defenseScaling: (level: number, difficulty: number = 1.0) => {
      const levelFactor = 1 + (level - 1) * 0.12; // 12% per level
      return Math.floor(BALANCE.enemy.baseDefense * levelFactor * difficulty);
    },
    
    hpScaling: (level: number, difficulty: number = 1.0) => {
      const levelFactor = 1 + (level - 1) * 0.2; // 20% per level
      return Math.floor(BALANCE.enemy.baseHp * levelFactor * difficulty);
    },
    
    // XP scales with level^1.5 to match hero leveling curve
    xpScaling: (level: number, difficulty: number = 1.0) => {
      const xp = BALANCE.enemy.baseXp * Math.pow(level, 1.5) * difficulty;
      return Math.floor(xp);
    },
    
    // Gold scales linearly with level
    goldScaling: (level: number, difficulty: number = 1.0) => {
      const gold = BALANCE.enemy.baseGold * level * difficulty;
      return Math.floor(gold);
    },
  },
  
  hero: {
    baseHp: 500,
    baseAttack: 50,
    baseDefense: 30,
    
    hpPerLevel: 50,
    attackPerLevel: 5,
    defensePerLevel: 3,
    
    // XP curve: exponential growth
    xpCurve: (level: number) => {
      return Math.floor(100 * Math.pow(level, 1.8));
    },
  },
  
  loot: {
    // Stronger enemies = better loot (higher % for rare+)
    rarityByDifficulty: {
      trash: { rare: 0.05, epic: 0.00, legendary: 0.00 },
      elite: { rare: 0.15, epic: 0.02, legendary: 0.00 },
      dungeonNormal: { rare: 0.40, epic: 0.10, legendary: 0.01 },
      dungeonHeroic: { rare: 0.60, epic: 0.20, legendary: 0.03 },
      dungeonMythic: { rare: 0.70, epic: 0.35, legendary: 0.08 },
      raidNormal: { rare: 0.50, epic: 0.15, legendary: 0.02 },
      raidHeroic: { rare: 0.65, epic: 0.30, legendary: 0.08 },
      raidMythic: { rare: 0.75, epic: 0.50, legendary: 0.20 },
      worldBoss: { rare: 0.80, epic: 0.60, legendary: 0.35 },
    },
    
    itemPowerByRarity: {
      common: 1.0,
      uncommon: 1.3,
      rare: 1.7,
      epic: 2.5,
      legendary: 4.0,
      mythic: 6.0,
    },
  },
  
  shop: {
    // Shop items are 70% as good as drops (worse, but available immediately)
    itemPowerMultiplier: 0.70,
    
    weaponBasePrice: 100,
    armorBasePrice: 75,
    
    priceScaling: (level: number, rarity: string) => {
      const rarityMultipliers: Record<string, number> = {
        common: 1,
        uncommon: 3,
        rare: 10,
        epic: 35,
        legendary: 150, // Expensive! Dropped gear is better value
      };
      
      const rarityMult = rarityMultipliers[rarity] || 1;
      const levelMult = 1 + (level - 1) * 0.5; // 50% per level
      
      return Math.floor(rarityMult * levelMult);
    },
    
    // Gold sinks to prevent inflation
    enchantingBaseCost: 500,
    repairCostPercentage: 0.10, // 10% of item value
    respecCost: 1000,
    gemSocketCost: 2000,
  },
};

/**
 * Calculate time to kill an enemy (for balance testing)
 */
export function calculateTimeToKill(
  heroAttack: number,
  heroLevel: number,
  enemyHp: number,
  enemyDefense: number
): number {
  const damage = Math.max(1, heroAttack - enemyDefense * 0.5);
  const hitsToKill = Math.ceil(enemyHp / damage);
  const timePerHit = 2; // seconds (combat tick rate)
  return hitsToKill * timePerHit;
}

/**
 * Calculate damage taken per hit (for balance testing)
 */
export function calculateDamageTaken(
  enemyAttack: number,
  heroDefense: number
): number {
  return Math.max(1, enemyAttack - heroDefense * 0.5);
}

/**
 * Calculate shop item stats
 */
export function calculateShopItemStats(
  level: number,
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary',
  slot: 'weapon' | 'armor'
): { attack: number; defense: number; hp: number; price: number } {
  const basePower = BALANCE.loot.itemPowerByRarity[rarity];
  const shopMultiplier = BALANCE.shop.itemPowerMultiplier;
  
  const levelFactor = 1 + (level - 1) * 0.15;
  const finalPower = basePower * shopMultiplier * levelFactor;
  
  const basePrice = slot === 'weapon' ? BALANCE.shop.weaponBasePrice : BALANCE.shop.armorBasePrice;
  const price = Math.floor(basePrice * BALANCE.shop.priceScaling(level, rarity));
  
  if (slot === 'weapon') {
    return {
      attack: Math.floor(finalPower * 30),
      defense: 0,
      hp: 0,
      price,
    };
  } else {
    return {
      attack: 0,
      defense: Math.floor(finalPower * 15),
      hp: Math.floor(finalPower * 50),
      price,
    };
  }
}

/**
 * Calculate dropped item stats (for comparison)
 */
export function calculateDroppedItemStats(
  level: number,
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary',
  slot: 'weapon' | 'armor'
): { attack: number; defense: number; hp: number } {
  const basePower = BALANCE.loot.itemPowerByRarity[rarity];
  const levelFactor = 1 + (level - 1) * 0.15;
  const finalPower = basePower * levelFactor;
  
  if (slot === 'weapon') {
    return {
      attack: Math.floor(finalPower * 30),
      defense: 0,
      hp: 0,
    };
  } else {
    return {
      attack: 0,
      defense: Math.floor(finalPower * 15),
      hp: Math.floor(finalPower * 50),
    };
  }
}
