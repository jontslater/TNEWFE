/**
 * Enemy Scaling System (re-exports canonical math from src/game/stats).
 * Kept for legacy imports (AnimationTestPage, docs).
 */

import {
  getPackSizeReduction,
  type ScalingResult,
  type ScaledEnemyStats,
} from '../game/stats/enemyCombatScaling';

export {
  COMBAT_BALANCE,
  calculateAverageGearScore,
  calculateAveragePartyLevel,
  calculateEnemyScaling,
  computeLegacyIdleEnemyHp,
  estimateCombatRoundsToKill,
  estimateHeroHitsToKill,
  getDifficultyScalingFromHeroes,
  getPackSizeReduction,
  mitigateDamageVsEnemyDefense,
  scaleEnemyForCombat,
  type ContentTier,
  type EnemyScaleOptions,
  type ScalingFactors,
  type ScalingResult,
  type ScaledEnemyStats,
} from '../game/stats/enemyCombatScaling';

/** @deprecated use ScaledEnemyStats */
export type { ScaledEnemyStats as ScaledStats } from '../game/stats/enemyCombatScaling';

/**
 * Get base stats for an enemy type
 * Different enemy types have different base stats
 * @param enemyName - Name of the enemy
 * @returns Base stats for the enemy
 */
export function getEnemyBaseStats(enemyName: string): { hp: number; attack: number; defense: number } {
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
    'Elder Dragon': { hp: 800, attack: 60, defense: 50 },
  };

  return baseStats[enemyName] || { hp: 100, attack: 15, defense: 10 };
}

/** Back-compat wrapper for dev tools / animation test page */
export function scaleEnemyStats(
  baseStats: { hp: number; attack: number; defense: number },
  scaling: ScalingResult,
  packSize: number = 1,
  hpMultiplier: number = 1.2,
  attackMultiplier: number = 1.1,
  defenseMultiplier: number = 0.9
): ScaledEnemyStats {
  const packReduction = getPackSizeReduction(packSize);
  const hp = Math.floor(baseStats.hp * scaling.multiplier * hpMultiplier * packReduction);
  return {
    hp,
    maxHp: hp,
    attack: Math.floor(baseStats.attack * scaling.multiplier * attackMultiplier * packReduction),
    defense: Math.floor(baseStats.defense * scaling.multiplier * defenseMultiplier * packReduction),
  };
}
