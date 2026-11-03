/**
 * Shared combat mitigation math (defense, crit multiplier lives in combatHelpers).
 */

/** Minimum fraction of pre-mitigation damage that always applies (25%). */
export const MIN_DAMAGE_THROUGH_PERCENT = 0.25;

/** Defense constant — 250 defense ≈ 50% mitigation in the hyperbolic formula. */
export const DEFENSE_MITIGATION_CONSTANT = 250;

/**
 * Percentage-based armor: damage / (1 + defense / 250), floored with 25% minimum.
 */
export function applyDefenseMitigation(damage: number, defense: number = 0): number {
  if (damage <= 0) return 0;
  const damageAfterDefense = damage / (1 + defense / DEFENSE_MITIGATION_CONSTANT);
  const minDamage = Math.max(1, damage * MIN_DAMAGE_THROUGH_PERCENT);
  return Math.max(minDamage, Math.floor(damageAfterDefense));
}
