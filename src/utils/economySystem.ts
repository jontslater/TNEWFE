/**
 * Economy System Utilities
 * Handles gold and token calculations, earning rates, and shop prices
 */

// Gold earning rates
export const GOLD_RATES = {
  PER_KILL_MULTIPLIER: 0.1, // enemy.xp / 10
  TREASURE_MIN: 2,
  TREASURE_MAX: 7,
} as const;

// Token earning rates (for monetization balance)
export const TOKEN_RATES = {
  ACTIVE_PER_HOUR: 2, // Active viewers (command in last 60 min)
  IDLE_PER_HOUR: 1, // Idle viewers
  MAX_ACCUMULATION_HOURS: 24, // Max hours to accumulate
  ACTIVE_THRESHOLD_MS: 60 * 60 * 1000, // 60 minutes
} as const;

// Shop prices (balanced for monetization)
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
      TOKEN_BOOST_STD: 100, // +50% idle token rate, 7 days
      TOKEN_BOOST_PREM: 250, // +100% idle token rate, 7 days
    },
    CONVENIENCE: {
      INVENTORY_EXPANSION: 200, // +50 slots
      BANK_EXPANSION: 300, // +100 slots
      AUTO_SALVAGE: 500, // Permanent auto-sell common gear
    },
  },
} as const;

/**
 * Calculate gold earned from enemy kill
 * Formula: floor(enemy.xp / 10)
 */
export function calculateGoldFromKill(enemyXp: number): number {
  return Math.floor(enemyXp * GOLD_RATES.PER_KILL_MULTIPLIER);
}

/**
 * Calculate treasure gold (random event)
 * Returns 2-7 gold
 */
export function calculateTreasureGold(): number {
  const min = GOLD_RATES.TREASURE_MIN;
  const max = GOLD_RATES.TREASURE_MAX;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Calculate idle tokens for a hero
 * Returns tokens earned, hours since last claim, and active status
 */
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

  // Cap at 24 hours
  const cappedHours = Math.min(hoursSinceLastClaim, TOKEN_RATES.MAX_ACCUMULATION_HOURS);

  // Check if active viewer (command within last 60 minutes)
  const timeSinceLastCommand = lastCommandTime
    ? now - lastCommandTime
    : timeSinceLastClaim;
  const isActive = timeSinceLastCommand < TOKEN_RATES.ACTIVE_THRESHOLD_MS;

  // Active viewers get 2 tokens/hour, idle get 1 token/hour
  const tokensPerHour = isActive ? TOKEN_RATES.ACTIVE_PER_HOUR : TOKEN_RATES.IDLE_PER_HOUR;

  // Calculate total tokens (can be fractional, will be floored when claimed)
  const tokensEarned = cappedHours * tokensPerHour;

  return {
    tokens: Math.floor(tokensEarned),
    hours: cappedHours,
    isActive,
    timeUntilNextToken: (1 / tokensPerHour) - (hoursSinceLastClaim % (1 / tokensPerHour)),
  };
}

/**
 * Format gold amount with commas
 */
export function formatGold(amount: number): string {
  return `${amount.toLocaleString()}g`;
}

/**
 * Format token amount
 */
export function formatTokens(amount: number): string {
  return `${amount.toLocaleString()}t`;
}

/**
 * Format time duration (hours, minutes)
 */
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












