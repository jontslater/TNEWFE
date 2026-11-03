/**
 * Economy System Utilities
 * Handles gold and token calculations, earning rates, and shop prices.
 *
 * Implementation lives in `src/game/economy` — this file re-exports for legacy imports.
 */

export {
  calculateGoldFromKill,
  calculateGoldFromEnemy,
  calculateTreasureGold,
  GOLD_RATES,
  getFounderGoldMultiplier,
  FOUNDER_GOLD_MULTIPLIERS,
  sumGoldFromEnemies,
  sumXpFromEnemies,
  resolveEnemyXp,
  TRAVEL_XP_PER_TICK,
} from '../game/economy/rewards';

export { GOLD_SHOP_ITEMS } from '../game/economy/shop';

// Token earning rates (for monetization balance)
export const TOKEN_RATES = {
  ACTIVE_PER_HOUR: 2,
  IDLE_PER_HOUR: 1,
  MAX_ACCUMULATION_HOURS: 24,
  ACTIVE_THRESHOLD_MS: 60 * 60 * 1000,
} as const;

// Shop prices (token shop — separate from gold !auto shop)
export const SHOP_PRICES = {
  GOLD: {
    HEALTH_POTION: 10,
    XP_BOOST_SCROLL: 25,
    SHARPENING_STONE: 15,
    ARMOR_POLISH: 15,
  },
  TOKEN: {
    GEAR: {
      COMMON: 50,
      RARE: 200,
      EPIC: 600,
      LEGENDARY: 2500,
      MYTHIC: 10000,
    },
    BOOSTS: {
      XP_1H: 50,
      XP_3H: 120,
      XP_8H: 280,
      XP_24H: 750,
      GOLD_1H: 30,
      GOLD_3H: 75,
      GOLD_8H: 180,
      GOLD_24H: 450,
      TOKEN_BOOST_STD: 100,
      TOKEN_BOOST_PREM: 250,
    },
    CONVENIENCE: {
      INVENTORY_EXPANSION: 200,
      BANK_EXPANSION: 300,
      AUTO_SALVAGE: 500,
    },
  },
} as const;

export interface IdleTokenInfo {
  tokens: number;
  hours: number;
  isActive: boolean;
  timeUntilNextToken: number;
}

export function calculateIdleTokens(
  lastTokenClaim: number | undefined,
  lastCommandTime: number | undefined
): IdleTokenInfo {
  if (!lastTokenClaim) {
    return {
      tokens: 0,
      hours: 0,
      isActive: false,
      timeUntilNextToken: 0,
    };
  }

  const now = Date.now();
  const timeSinceLastClaim = now - lastTokenClaim;
  const hoursSinceLastClaim = timeSinceLastClaim / (1000 * 60 * 60);
  const cappedHours = Math.min(hoursSinceLastClaim, TOKEN_RATES.MAX_ACCUMULATION_HOURS);
  const timeSinceLastCommand = lastCommandTime
    ? now - lastCommandTime
    : timeSinceLastClaim;
  const isActive = timeSinceLastCommand < TOKEN_RATES.ACTIVE_THRESHOLD_MS;
  const tokensPerHour = isActive ? TOKEN_RATES.ACTIVE_PER_HOUR : TOKEN_RATES.IDLE_PER_HOUR;
  const tokensEarned = cappedHours * tokensPerHour;

  return {
    tokens: Math.floor(tokensEarned),
    hours: cappedHours,
    isActive,
    timeUntilNextToken: 1 / tokensPerHour - (hoursSinceLastClaim % (1 / tokensPerHour)),
  };
}

export function formatGold(amount: number): string {
  return `${amount.toLocaleString()}g`;
}

export function formatTokens(amount: number): string {
  return `${amount.toLocaleString()}t`;
}

export function formatIdleTime(hours: number): string {
  if (hours < 1) {
    const minutes = Math.floor(hours * 60);
    return `${minutes}m`;
  }
  const wholeHours = Math.floor(hours);
  const minutes = Math.floor((hours - wholeHours) * 60);
  if (minutes > 0) {
    return `${wholeHours}h ${minutes}m`;
  }
  return `${wholeHours}h`;
}
