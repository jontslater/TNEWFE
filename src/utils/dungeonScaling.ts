/**
 * Dungeon Scaling System
 * Scales dungeon difficulty by party size and average item score
 */

export interface ScalingFactors {
  hpMultiplier: number;
  damageMultiplier: number;
  defenseMultiplier: number;
  rewardMultiplier: number;
}

export interface PartyMember {
  level: number;
  itemScore: number;
}

/**
 * Calculate average item score
 */
export function calculateAverageItemScore(party: PartyMember[]): number {
  if (party.length === 0) return 0;
  const total = party.reduce((sum, member) => sum + member.itemScore, 0);
  return Math.floor(total / party.length);
}

/**
 * Calculate average level
 */
export function calculateAverageLevel(party: PartyMember[]): number {
  if (party.length === 0) return 1;
  const total = party.reduce((sum, member) => sum + member.level, 0);
  return Math.floor(total / party.length);
}

/**
 * Calculate scaling factors for party size
 */
export function calculatePartySizeScaling(
  partySize: number,
  basePartySize: number = 3
): ScalingFactors {
  // Scale based on party size
  // Solo (1 player): 0.5x HP, 0.5x damage, 0.5x rewards
  // Small (2 players): 0.75x HP, 0.75x damage, 0.75x rewards
  // Normal (3-4 players): 1.0x (base)
  // Large (5 players): 1.25x HP, 1.25x damage, 1.25x rewards
  // Very Large (6+ players): 1.5x HP, 1.5x damage, 1.5x rewards

  let hpMultiplier = 1.0;
  let damageMultiplier = 1.0;
  let rewardMultiplier = 1.0;

  if (partySize === 1) {
    hpMultiplier = 0.5;
    damageMultiplier = 0.5;
    rewardMultiplier = 0.5;
  } else if (partySize === 2) {
    hpMultiplier = 0.75;
    damageMultiplier = 0.75;
    rewardMultiplier = 0.75;
  } else if (partySize >= 3 && partySize <= 4) {
    hpMultiplier = 1.0;
    damageMultiplier = 1.0;
    rewardMultiplier = 1.0;
  } else if (partySize === 5) {
    hpMultiplier = 1.25;
    damageMultiplier = 1.25;
    rewardMultiplier = 1.25;
  } else if (partySize >= 6) {
    hpMultiplier = 1.5;
    damageMultiplier = 1.5;
    rewardMultiplier = 1.5;
  }

  return {
    hpMultiplier,
    damageMultiplier,
    defenseMultiplier: 1.0, // Defense doesn't scale with party size
    rewardMultiplier
  };
}

/**
 * Calculate scaling factors for item score
 */
export function calculateItemScoreScaling(
  averageItemScore: number,
  baseItemScore: number = 500
): ScalingFactors {
  // Scale based on how much higher/lower the party's item score is
  // If party is 2x base item score, enemies are 1.5x stronger
  // If party is 0.5x base item score, enemies are 0.75x weaker

  const ratio = averageItemScore / baseItemScore;
  
  // Clamp ratio between 0.5 and 2.0
  const clampedRatio = Math.max(0.5, Math.min(2.0, ratio));
  
  // Scale factors (more gradual scaling)
  const hpMultiplier = 0.75 + (clampedRatio - 0.5) * 0.5; // 0.75 to 1.5
  const damageMultiplier = 0.75 + (clampedRatio - 0.5) * 0.5; // 0.75 to 1.5
  const defenseMultiplier = 0.9 + (clampedRatio - 0.5) * 0.2; // 0.9 to 1.1
  const rewardMultiplier = 0.8 + (clampedRatio - 0.5) * 0.4; // 0.8 to 1.4

  return {
    hpMultiplier,
    damageMultiplier,
    defenseMultiplier,
    rewardMultiplier
  };
}

/**
 * Calculate combined scaling factors
 */
export function calculateDungeonScaling(
  party: PartyMember[],
  basePartySize: number = 3,
  baseItemScore: number = 500
): ScalingFactors {
  const partySize = party.length;
  const averageItemScore = calculateAverageItemScore(party);

  const partyScaling = calculatePartySizeScaling(partySize, basePartySize);
  const itemScoreScaling = calculateItemScoreScaling(averageItemScore, baseItemScore);

  // Combine scaling factors (multiplicative)
  return {
    hpMultiplier: partyScaling.hpMultiplier * itemScoreScaling.hpMultiplier,
    damageMultiplier: partyScaling.damageMultiplier * itemScoreScaling.damageMultiplier,
    defenseMultiplier: partyScaling.defenseMultiplier * itemScoreScaling.defenseMultiplier,
    rewardMultiplier: partyScaling.rewardMultiplier * itemScoreScaling.rewardMultiplier
  };
}

/**
 * Scale enemy stats
 */
export function scaleEnemyStats(
  baseHp: number,
  baseAttack: number,
  baseDefense: number,
  scaling: ScalingFactors
): { hp: number; attack: number; defense: number } {
  return {
    hp: Math.floor(baseHp * scaling.hpMultiplier),
    attack: Math.floor(baseAttack * scaling.damageMultiplier),
    defense: Math.floor(baseDefense * scaling.defenseMultiplier)
  };
}

/**
 * Scale rewards
 */
export function scaleRewards(
  baseGold: number,
  baseTokens: number,
  baseExperience: number,
  scaling: ScalingFactors
): { gold: number; tokens: number; experience: number } {
  return {
    gold: Math.floor(baseGold * scaling.rewardMultiplier),
    tokens: Math.floor(baseTokens * scaling.rewardMultiplier),
    experience: Math.floor(baseExperience * scaling.rewardMultiplier)
  };
}



