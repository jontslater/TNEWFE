/**
 * Pure utility functions for combat calculations
 * Stateless helper functions extracted from fullCombatEngine.ts
 */

import { Hero, Enemy } from './fullCombatEngine';

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
    const hero = target as Hero;
    const defenseResist = Math.min(0.3, (hero.defense || 0) / 500);
    const levelResist = Math.min(0.25, (hero.level || 0) / 200);
    let gearScore = 0;
    if (hero.equipment) {
      Object.values(hero.equipment).forEach((item: any) => {
        if (item) {
          gearScore += (item.attack || 0) + (item.defense || 0) + (item.hp || 0);
        }
      });
    }
    const gearResist = Math.min(0.2, gearScore / 5000);

    return Math.min(0.7, defenseResist + levelResist + gearResist);
  }

  const enemy = target as Enemy;
  return enemy.isBoss ? 0.25 : 0.1;
}
