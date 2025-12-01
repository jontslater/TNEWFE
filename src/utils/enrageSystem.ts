/**
 * Enrage System
 * Handles soft enrage (gradual damage increase) and hard enrage (instant wipe)
 */

export interface EnrageConfig {
  softEnrage?: {
    startTime: number; // When soft enrage starts (milliseconds into fight)
    damageIncreasePerSecond: number; // Damage multiplier increase per second
    maxMultiplier: number; // Maximum damage multiplier
  };
  hardEnrage?: {
    timer: number; // Time until hard enrage (milliseconds)
    wipeMessage: string; // Message to display on wipe
  };
}

export interface EnrageState {
  active: boolean;
  startTime?: number;
  damageMultiplier: number;
  hardEnrageTriggered: boolean;
}

/**
 * Initialize enrage state
 */
export function initializeEnrageState(): EnrageState {
  return {
    active: false,
    damageMultiplier: 1.0,
    hardEnrageTriggered: false
  };
}

/**
 * Check if soft enrage should activate
 */
export function checkSoftEnrage(
  config: EnrageConfig,
  fightStartTime: number,
  currentTime: number
): boolean {
  if (!config.softEnrage) return false;
  
  const fightDuration = currentTime - fightStartTime;
  return fightDuration >= config.softEnrage.startTime;
}

/**
 * Calculate soft enrage damage multiplier
 */
export function calculateSoftEnrageMultiplier(
  config: EnrageConfig,
  fightStartTime: number,
  currentTime: number
): number {
  if (!config.softEnrage) return 1.0;
  
  const fightDuration = currentTime - fightStartTime;
  if (fightDuration < config.softEnrage.startTime) {
    return 1.0;
  }

  const enrageDuration = fightDuration - config.softEnrage.startTime;
  const multiplier = 1.0 + (config.softEnrage.damageIncreasePerSecond * enrageDuration / 1000);
  
  return Math.min(multiplier, config.softEnrage.maxMultiplier);
}

/**
 * Check if hard enrage should trigger
 */
export function checkHardEnrage(
  config: EnrageConfig,
  fightStartTime: number,
  currentTime: number
): boolean {
  if (!config.hardEnrage) return false;
  
  const fightDuration = currentTime - fightStartTime;
  return fightDuration >= config.hardEnrage.timer;
}

/**
 * Update enrage state
 */
export function updateEnrageState(
  state: EnrageState,
  config: EnrageConfig,
  fightStartTime: number,
  currentTime: number
): EnrageState {
  // Check hard enrage first
  if (!state.hardEnrageTriggered && checkHardEnrage(config, fightStartTime, currentTime)) {
    return {
      ...state,
      active: true,
      hardEnrageTriggered: true,
      damageMultiplier: 999.0 // Instant wipe damage
    };
  }

  // Check soft enrage
  if (checkSoftEnrage(config, fightStartTime, currentTime)) {
    const multiplier = calculateSoftEnrageMultiplier(config, fightStartTime, currentTime);
    return {
      ...state,
      active: true,
      startTime: state.startTime || currentTime,
      damageMultiplier: multiplier
    };
  }

  return state;
}

/**
 * Get enrage warning message
 */
export function getEnrageWarning(
  config: EnrageConfig,
  fightStartTime: number,
  currentTime: number
): string | null {
  if (!config.hardEnrage) return null;
  
  const fightDuration = currentTime - fightStartTime;
  const timeUntilEnrage = config.hardEnrage.timer - fightDuration;
  
  if (timeUntilEnrage <= 0) {
    return null; // Already enraged
  }
  
  // Warn at 30s, 15s, 10s, 5s, and 1s
  const warningThresholds = [30000, 15000, 10000, 5000, 1000];
  for (const threshold of warningThresholds) {
    if (timeUntilEnrage <= threshold && timeUntilEnrage > threshold - 1000) {
      const seconds = Math.ceil(timeUntilEnrage / 1000);
      return `${seconds} seconds until ENRAGE!`;
    }
  }
  
  return null;
}

/**
 * Apply enrage damage multiplier to damage
 */
export function applyEnrageDamage(
  baseDamage: number,
  enrageMultiplier: number
): number {
  return Math.floor(baseDamage * enrageMultiplier);
}



