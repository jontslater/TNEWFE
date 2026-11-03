/**
 * Gold / XP reward helpers — single source for idle combat payouts and travel XP.
 */

export const GOLD_RATES = {
  PER_KILL_DIVISOR: 10,
  TREASURE_MIN: 2,
  TREASURE_MAX: 7,
} as const;

/** XP granted during peaceful travel ticks (adventure engine). */
export const TRAVEL_XP_PER_TICK = 3;

/** Default enemy XP when template has no xp field. */
export function defaultEnemyXp(enemyLevel: number): number {
  return enemyLevel * 10;
}

export function resolveEnemyXp(enemy: { xp?: number; level?: number }): number {
  if (enemy.xp != null && enemy.xp > 0) return enemy.xp;
  return defaultEnemyXp(enemy.level || 1);
}

/** Gold from one kill — matches backend idle formula floor(enemyXp / 10). */
export function calculateGoldFromKill(enemyXp: number): number {
  return Math.floor(enemyXp / GOLD_RATES.PER_KILL_DIVISOR);
}

export function calculateGoldFromEnemy(enemy: { xp?: number; level?: number }): number {
  return calculateGoldFromKill(resolveEnemyXp(enemy));
}

export function calculateTreasureGold(): number {
  const min = GOLD_RATES.TREASURE_MIN;
  const max = GOLD_RATES.TREASURE_MAX;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Sum gold from a list of defeated enemies. */
export function sumGoldFromEnemies(
  enemies: Array<{ xp?: number; level?: number }>
): number {
  return enemies.reduce((sum, e) => sum + calculateGoldFromEnemy(e), 0);
}

/** Sum base XP from enemies (optional difficulty multiplier applied by caller). */
export function sumXpFromEnemies(
  enemies: Array<{ xp?: number; level?: number }>
): number {
  return enemies.reduce((sum, e) => sum + resolveEnemyXp(e), 0);
}

/** Founder pack gold multipliers (battlefield overlay). */
export const FOUNDER_GOLD_MULTIPLIERS: Record<string, number> = {
  bronze: 1.1,
  silver: 1.2,
  gold: 1.3,
  platinum: 1.5,
};

export function getFounderGoldMultiplier(tier: string | null | undefined): number {
  if (!tier) return 1;
  return FOUNDER_GOLD_MULTIPLIERS[tier.toLowerCase()] ?? 1;
}
