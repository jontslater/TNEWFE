/** Base crit multiplier before crit damage bonuses (200% damage) */
export const BASE_CRIT_MULTIPLIER = 2;

/** Max percent of incoming damage that can be removed by flat damage reduction stats */
export const MAX_DAMAGE_REDUCTION_PERCENT = 75;

/**
 * Crit damage bonus is expressed in percentage points added to the base 200% crit (10 → 2.1×).
 */
export function getCritDamageMultiplier(critDamageBonusPercent: number): number {
  return BASE_CRIT_MULTIPLIER + (critDamageBonusPercent || 0) / 100;
}

/**
 * Apply flat damage reduction from gear/gems (values are percentage points, e.g. 15 = 15%).
 */
export function applyStatDamageReduction(damage: number, damageReductionPercent: number): number {
  if (!damageReductionPercent || damageReductionPercent <= 0) {
    return damage;
  }
  const reduction = Math.min(MAX_DAMAGE_REDUCTION_PERCENT, damageReductionPercent) / 100;
  return Math.max(1, Math.floor(damage * (1 - reduction)));
}

/** Apply gem/socket XP or gold gain bonuses (percentage points). */
export function applyRewardBonus(baseAmount: number, bonusPercent: number): number {
  if (!bonusPercent || bonusPercent <= 0) {
    return baseAmount;
  }
  return Math.floor(baseAmount * (1 + bonusPercent / 100));
}
