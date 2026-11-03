/**
 * Pure utility functions for combat calculations
 * Stateless helper functions extracted from fullCombatEngine.ts
 */

import { Hero, Enemy } from './fullCombatEngine';

import { computeHeroDebuffResistance } from '../game/economy/gearScore';

export { calculateSkillBonuses, computeHeroStats, getCharacterStats } from '../game/stats';

/**
 * Get viewer bonuses based on viewer count
 */
export function getViewerBonuses(viewerCount: number = 0) {
  return {
    damageMultiplier: 1 + viewerCount * 0.01,
    healingMultiplier: 1 + viewerCount * 0.01,
    defenseMultiplier: 1 + viewerCount * 0.005,
  };
}

/**
 * Calculate debuff resistance chance
 */
export function getDebuffResistance(target: Hero | Enemy): number {
  if ((target as Hero).role) {
    return computeHeroDebuffResistance(target as Hero);
  }

  const enemy = target as Enemy;
  return enemy.isBoss ? 0.25 : 0.1;
}
