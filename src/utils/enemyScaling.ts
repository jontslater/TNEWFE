/**
 * Enemy Scaling System
 * Handles scaling enemy stats based on level, party size, gear score, and wave number
 * Matches Electron app implementation in game.js
 */

export interface ScalingFactors {
  avgLevel: number;
  partySize: number;
  avgGearScore: number;
  waveCount: number;
  difficultyModifier?: number; // Optional adaptive difficulty modifier (default 1.0)
}

export interface ScalingResult {
  multiplier: number;
  levelMultiplier: number;
  partySizeMultiplier: number;
  gearScoreMultiplier: number;
  waveMultiplier: number;
  difficultyModifier: number;
  avgLevel: number;
  partySize: number;
  avgGearScore: number;
  waveCount: number;
}

export interface ScaledStats {
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
}

/**
 * Calculate comprehensive difficulty scaling
 * Matches getDifficultyScaling() from game.js
 * @param factors - Scaling factors (avgLevel, partySize, avgGearScore, waveCount, difficultyModifier)
 * @returns Scaling result with all multipliers
 */
export function calculateEnemyScaling(factors: ScalingFactors): ScalingResult {
  const {
    avgLevel,
    partySize,
    avgGearScore,
    waveCount,
    difficultyModifier = 1.0
  } = factors;

  // Base scaling from level (12% per level)
  // Reduced from 0.15 to 0.12 for better balance
  const levelMultiplier = 1 + (avgLevel * 0.12);

  // Party size bonus: more heroes = harder enemies
  // Scales more aggressively for large parties
  let partySizeMultiplier: number;
  if (partySize <= 5) {
    // Small parties: 8% per hero beyond first
    partySizeMultiplier = 1 + ((partySize - 1) * 0.08);
  } else if (partySize <= 10) {
    // Medium parties: 12% per hero beyond first
    // 5 heroes = 1.32x, then +12% each
    partySizeMultiplier = 1 + (4 * 0.08) + ((partySize - 5) * 0.12);
  } else {
    // Large parties (10+): 15% per hero beyond first
    // Better scaling for 10+ heroes
    partySizeMultiplier = 1 + (4 * 0.08) + (5 * 0.12) + ((partySize - 10) * 0.15);
  }

  // Gear score bonus: better gear = harder enemies
  // 1% per 10 gear score (1 + avgGearScore / 1000)
  const gearScoreMultiplier = 1 + (avgGearScore / 1000);

  // Wave progression bonus: difficulty increases with waves completed
  // 1% per 10 waves (1 + waveCount / 100)
  const waveMultiplier = 1 + (waveCount / 100);

  // Combined multiplier (all multipliers stack multiplicatively)
  let totalMultiplier = levelMultiplier * partySizeMultiplier * gearScoreMultiplier * waveMultiplier;

  // Apply adaptive difficulty modifier
  totalMultiplier *= difficultyModifier;

  return {
    multiplier: totalMultiplier,
    levelMultiplier,
    partySizeMultiplier,
    gearScoreMultiplier,
    waveMultiplier,
    difficultyModifier,
    avgLevel,
    partySize,
    avgGearScore: Math.floor(avgGearScore),
    waveCount
  };
}

/**
 * Get pack size reduction multiplier
 * When multiple enemies spawn in a pack, each enemy has reduced stats
 * Total effective difficulty: 1 enemy = 100%, 2 enemies = 120% (60% each), 3 enemies = 135% (45% each)
 * @param packSize - Number of enemies in the pack (1-3)
 * @returns Multiplier to reduce stats per enemy
 */
export function getPackSizeReduction(packSize: number): number {
  if (packSize === 1) {
    return 1.0; // No reduction for single enemy
  } else if (packSize === 2) {
    return 0.6; // 40% reduction per enemy in pack of 2
  } else {
    return 0.45; // 55% reduction per enemy in pack of 3
  }
}

/**
 * Scale enemy base stats with all multipliers
 * @param baseStats - Base enemy stats (hp, attack, defense)
 * @param scaling - Scaling result from calculateEnemyScaling()
 * @param packSize - Number of enemies in pack (for pack reduction)
 * @param hpMultiplier - Additional HP multiplier (default 1.2)
 * @param attackMultiplier - Additional attack multiplier (default 1.1)
 * @param defenseMultiplier - Additional defense multiplier (default 0.9)
 * @returns Scaled enemy stats
 */
export function scaleEnemyStats(
  baseStats: { hp: number; attack: number; defense: number },
  scaling: ScalingResult,
  packSize: number = 1,
  hpMultiplier: number = 1.2,
  attackMultiplier: number = 1.1,
  defenseMultiplier: number = 0.9
): ScaledStats {
  // Apply pack size reduction
  const packReduction = getPackSizeReduction(packSize);

  // Calculate final multipliers
  // HP gets additional 1.2x multiplier
  const finalHpMultiplier = scaling.multiplier * hpMultiplier * packReduction;
  // Attack gets additional 1.1x multiplier (scales with difficulty)
  const finalAttackMultiplier = scaling.multiplier * attackMultiplier * packReduction;
  // Defense gets base 0.9x multiplier (scales with difficulty)
  const finalDefenseMultiplier = scaling.multiplier * defenseMultiplier * packReduction;

  return {
    hp: Math.floor(baseStats.hp * finalHpMultiplier),
    maxHp: Math.floor(baseStats.hp * finalHpMultiplier),
    attack: Math.floor(baseStats.attack * finalAttackMultiplier),
    defense: Math.floor(baseStats.defense * finalDefenseMultiplier)
  };
}

/**
 * Get base stats for an enemy type
 * Different enemy types have different base stats
 * @param enemyName - Name of the enemy
 * @returns Base stats for the enemy
 */
export function getEnemyBaseStats(enemyName: string): { hp: number; attack: number; defense: number } {
  // Base stats vary by enemy type
  // Bosses and larger enemies have higher base stats
  // These match the enemy templates from game.js
  const baseStats: Record<string, { hp: number; attack: number; defense: number }> = {
    'Kobold Warrior': { hp: 90, attack: 14, defense: 10 },
    'Baby Dragon': { hp: 120, attack: 18, defense: 12 },
    'Imp': { hp: 80, attack: 16, defense: 8 },
    'Lizardman': { hp: 110, attack: 16, defense: 11 },
    'Masked Orc': { hp: 130, attack: 18, defense: 13 },
    'Werewolf': { hp: 150, attack: 20, defense: 15 },
    'Skeleton Mage': { hp: 100, attack: 20, defense: 10 },
    'Witch': { hp: 120, attack: 22, defense: 12 },
    'Mimic': { hp: 140, attack: 19, defense: 14 },
    'Gryphon': { hp: 180, attack: 24, defense: 18 },
    'Minotaur': { hp: 200, attack: 26, defense: 20 },
    'Headless Horseman': { hp: 220, attack: 28, defense: 22 },
    'Adult Dragon': { hp: 300, attack: 35, defense: 28 },
    'Demon Lord': { hp: 500, attack: 50, defense: 40 },
    'Elder Dragon': { hp: 800, attack: 60, defense: 50 }
  };

  return baseStats[enemyName] || { hp: 100, attack: 15, defense: 10 }; // Default stats
}

/**
 * Calculate average party level
 * @param heroes - Array of heroes with level property
 * @returns Average level
 */
export function calculateAveragePartyLevel(heroes: Array<{ level: number }>): number {
  if (heroes.length === 0) return 1;
  const totalLevel = heroes.reduce((sum, hero) => sum + hero.level, 0);
  return totalLevel / heroes.length;
}

/**
 * Calculate average gear score
 * Calculates gear score from equipment (matches backend calculation)
 * @param heroes - Array of heroes with equipment
 * @returns Average gear score
 */
export function calculateAverageGearScore(heroes: Array<{ equipment?: any }>): number {
  if (heroes.length === 0) return 0;
  
  let totalGearScore = 0;
  
  heroes.forEach((hero) => {
    if (!hero.equipment) {
      return; // Skip heroes without equipment
    }
    
    let gearScore = 0;
    const EQUIPMENT_SLOTS = ['weapon', 'armor', 'accessory', 'shield', 'helm', 'cloak', 'gloves', 'ring1', 'ring2', 'boots'];
    
    EQUIPMENT_SLOTS.forEach((slot) => {
      const item = hero.equipment[slot];
      if (!item) return;
      
      // Base stats
      gearScore += (item.attack || 0) + (item.defense || 0) + (item.hp || 0);
      
      // Primary stats (weighted)
      gearScore += (item.intellect || 0) * 3;  // 1 Int = 3 gear score
      gearScore += (item.strength || 0) * 3;   // 1 Str = 3 gear score
      gearScore += (item.dexterity || 0) * 1.5; // 1 Dex = 1.5 gear score
      gearScore += (item.wisdom || 0) * 1.5;   // 1 Wis = 1.5 gear score
      gearScore += (item.stamina || 0) * 1;    // 1 Stamina = 1 gear score
      
      // Secondary stats (very powerful)
      if (item.secondaryStats) {
        gearScore += (item.secondaryStats.healingPower || 0) * 5;  // 1% healing = 5 gear score
        gearScore += (item.secondaryStats.spellDamage || 0) * 5;   // 1% spell dmg = 5 gear score
        gearScore += (item.secondaryStats.meleeDamage || 0) * 5;   // 1% melee dmg = 5 gear score
        gearScore += (item.secondaryStats.hpRegen || 0) * 10;      // 1 HP/sec = 10 gear score
        gearScore += (item.secondaryStats.damageReduction || 0) * 10; // 1% reduction = 10 gear score
        gearScore += (item.secondaryStats.critChance || 0) * 15;   // 1% crit = 15 gear score
      }
      
      // Special modifiers (legendary effects)
      if (item.specialModifier) {
        gearScore += 200; // Legendary modifier = 200 gear score
      }
    });
    
    totalGearScore += gearScore;
  });
  
  return totalGearScore / heroes.length;
}
