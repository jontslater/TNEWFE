/**
 * Interrupt System
 * Handles interrupting boss casts in idle game (auto-interrupts based on DPS/abilities)
 */

import { CastInfo } from '../types/BossMechanics';

export interface InterruptAttempt {
  heroId: string;
  interruptChance: number; // 0-1
  timestamp: number;
}

export interface InterruptState {
  activeInterrupts: Map<string, InterruptAttempt[]>; // castId -> interrupt attempts
}

/**
 * Initialize interrupt state
 */
export function initializeInterruptState(): InterruptState {
  return {
    activeInterrupts: new Map()
  };
}

/**
 * Calculate interrupt chance based on damage dealt
 */
export function calculateInterruptChanceFromDamage(
  damage: number,
  baseChance: number = 0.1 // 10% base chance per attack
): number {
  // Higher damage = higher interrupt chance (capped at 50%)
  const damageBonus = Math.min(0.4, damage / 1000); // 1% per 25 damage, max 40%
  return Math.min(0.5, baseChance + damageBonus);
}

/**
 * Calculate interrupt chance for specific interrupt abilities
 */
export function calculateInterruptChanceForAbility(
  abilityName: string,
  baseChance: number = 0.8 // 80% for interrupt abilities
): number {
  // Some abilities have guaranteed interrupts
  const guaranteedInterrupts = ['interrupt', 'silence', 'stun'];
  if (guaranteedInterrupts.some(name => abilityName.toLowerCase().includes(name))) {
    return 1.0;
  }

  return baseChance;
}

/**
 * Attempt to interrupt a cast
 */
export function attemptInterrupt(
  state: InterruptState,
  castId: string,
  heroId: string,
  interruptChance: number
): { success: boolean; newState: InterruptState } {
  const roll = Math.random();
  const success = roll < interruptChance;

  const newInterrupts = new Map(state.activeInterrupts);
  const attempts = newInterrupts.get(castId) || [];
  
  attempts.push({
    heroId,
    interruptChance,
    timestamp: Date.now()
  });

  newInterrupts.set(castId, attempts);

  return {
    success,
    newState: {
      activeInterrupts: newInterrupts
    }
  };
}

/**
 * Check if cast should be interrupted (auto-interrupt logic)
 */
export function shouldAutoInterrupt(
  cast: CastInfo,
  totalDamageDealt: number, // Total damage dealt during cast
  interruptAttempts: InterruptAttempt[]
): boolean {
  if (!cast.mechanic.interruptible) {
    return false;
  }

  // If any interrupt attempt succeeded
  for (const attempt of interruptAttempts) {
    const roll = Math.random();
    if (roll < attempt.interruptChance) {
      return true;
    }
  }

  // Auto-interrupt based on total damage (high DPS = more likely to interrupt)
  const damageThreshold = cast.mechanic.castTime ? cast.mechanic.castTime * 10 : 5000;
  if (totalDamageDealt >= damageThreshold) {
    const interruptChance = Math.min(0.8, totalDamageDealt / (damageThreshold * 2));
    return Math.random() < interruptChance;
  }

  return false;
}

/**
 * Clean up interrupt state for completed/interrupted casts
 */
export function cleanupInterrupts(
  state: InterruptState,
  castId: string
): InterruptState {
  const newInterrupts = new Map(state.activeInterrupts);
  newInterrupts.delete(castId);

  return {
    activeInterrupts: newInterrupts
  };
}



