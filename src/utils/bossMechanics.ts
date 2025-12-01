/**
 * Boss Mechanics Execution Engine
 * Handles boss ability casting, cooldowns, targeting, and execution
 */

import {
  BossMechanic,
  BossPhase,
  CastInfo,
  MechanicCooldown,
  BossMechanicsState,
  MechanicType,
  MechanicTarget,
  AddSpawnDefinition
} from '../types/BossMechanics';

export interface Combatant {
  id: string;
  hp: number;
  maxHp: number;
  role?: string;
  isAlive: boolean;
  threat?: number; // Threat value for targeting
  damageDealt?: number; // For DPS targeting
  isTank?: boolean; // For tank targeting
}

/**
 * Get target for a mechanic based on targeting type
 */
export function getMechanicTarget(
  mechanic: BossMechanic,
  heroes: Combatant[],
  currentTankId?: string
): Combatant | Combatant[] | null {
  const aliveHeroes = heroes.filter(h => h.isAlive);

  if (aliveHeroes.length === 0) {
    return null;
  }

  switch (mechanic.target) {
    case 'all':
      return aliveHeroes;

    case 'tank':
      if (currentTankId) {
        const tank = aliveHeroes.find(h => h.id === currentTankId || h.isTank);
        return tank || aliveHeroes[0];
      }
      // Find tank by role
      const tank = aliveHeroes.find(h => 
        h.role?.toLowerCase().includes('tank') || 
        h.role?.toLowerCase().includes('guardian') ||
        h.role?.toLowerCase().includes('paladin') ||
        h.role?.toLowerCase().includes('warden') ||
        h.role?.toLowerCase().includes('bloodknight') ||
        h.role?.toLowerCase().includes('vanguard')
      );
      return tank || aliveHeroes[0];

    case 'lowest-hp':
      return aliveHeroes.reduce((lowest, hero) => 
        (hero.hp / hero.maxHp) < (lowest.hp / lowest.maxHp) ? hero : lowest
      );

    case 'highest-threat':
      return aliveHeroes.reduce((highest, hero) => 
        (hero.threat || 0) > (highest.threat || 0) ? hero : highest
      , aliveHeroes[0]);

    case 'highest-dps':
      return aliveHeroes.reduce((highest, hero) => 
        (hero.damageDealt || 0) > (highest.damageDealt || 0) ? hero : highest
      , aliveHeroes[0]);

    case 'healer':
      const healer = aliveHeroes.find(h => 
        h.role?.toLowerCase().includes('heal') ||
        h.role?.toLowerCase().includes('cleric') ||
        h.role?.toLowerCase().includes('druid') ||
        h.role?.toLowerCase().includes('spirit')
      );
      return healer || aliveHeroes[Math.floor(Math.random() * aliveHeroes.length)];

    case 'random':
    default:
      return aliveHeroes[Math.floor(Math.random() * aliveHeroes.length)];
  }
}

/**
 * Check if a mechanic is off cooldown
 */
export function isMechanicOffCooldown(
  mechanic: BossMechanic,
  state: BossMechanicsState,
  currentTime: number
): boolean {
  const cooldown = state.mechanicCooldowns.get(mechanic.name);
  if (!cooldown) {
    return true; // Never used, available
  }

  const timeSinceLastUse = currentTime - cooldown.lastUsed;
  return timeSinceLastUse >= cooldown.cooldown;
}

/**
 * Check if a mechanic is active in the current phase
 */
export function isMechanicActiveInPhase(
  mechanic: BossMechanic,
  currentPhase: number
): boolean {
  if (!mechanic.phases || mechanic.phases.length === 0) {
    return true; // No phase restriction, always active
  }
  return mechanic.phases.includes(currentPhase);
}

/**
 * Check if a mechanic should trigger based on HP threshold
 */
export function shouldTriggerMechanic(
  mechanic: BossMechanic,
  currentHpPercent: number,
  previousHpPercent: number
): boolean {
  if (!mechanic.triggerAt) {
    return false; // No trigger threshold
  }

  const thresholds = Array.isArray(mechanic.triggerAt) 
    ? mechanic.triggerAt 
    : [mechanic.triggerAt];

  // Check if we crossed any threshold
  for (const threshold of thresholds) {
    if (previousHpPercent > threshold && currentHpPercent <= threshold) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate damage for a mechanic
 */
export function calculateMechanicDamage(
  mechanic: BossMechanic,
  bossAttack: number,
  enrageMultiplier: number = 1.0
): number {
  if (mechanic.damage !== undefined) {
    return Math.floor(mechanic.damage * enrageMultiplier);
  }
  
  if (mechanic.damageMultiplier !== undefined) {
    return Math.floor(bossAttack * mechanic.damageMultiplier * enrageMultiplier);
  }

  // Default: use boss attack stat
  return Math.floor(bossAttack * enrageMultiplier);
}

/**
 * Create a new cast info
 */
export function createCastInfo(
  mechanic: BossMechanic,
  targetId: string | 'all',
  currentTime: number
): CastInfo {
  const castTime = mechanic.castTime || 0;
  
  return {
    mechanic,
    startTime: currentTime,
    endTime: currentTime + castTime,
    target: targetId,
    interrupted: false,
    progress: 0
  };
}

/**
 * Update cast progress
 */
export function updateCastProgress(
  cast: CastInfo,
  currentTime: number
): CastInfo {
  if (cast.interrupted) {
    return cast;
  }

  const elapsed = currentTime - cast.startTime;
  const totalTime = cast.endTime - cast.startTime;
  const progress = Math.min(1.0, Math.max(0, elapsed / totalTime));

  return {
    ...cast,
    progress
  };
}

/**
 * Check if a cast is complete
 */
export function isCastComplete(cast: CastInfo, currentTime: number): boolean {
  return cast.interrupted || currentTime >= cast.endTime;
}

/**
 * Interrupt a cast
 */
export function interruptCast(cast: CastInfo): CastInfo {
  return {
    ...cast,
    interrupted: true,
    progress: 0
  };
}

/**
 * Record mechanic usage (update cooldown)
 */
export function recordMechanicUsage(
  state: BossMechanicsState,
  mechanic: BossMechanic,
  currentTime: number
): BossMechanicsState {
  const newCooldowns = new Map(state.mechanicCooldowns);
  newCooldowns.set(mechanic.name, {
    mechanicName: mechanic.name,
    lastUsed: currentTime,
    cooldown: mechanic.cooldown
  });

  return {
    ...state,
    mechanicCooldowns: newCooldowns
  };
}

/**
 * Get available mechanics for current phase
 */
export function getAvailableMechanics(
  mechanics: BossMechanic[],
  state: BossMechanicsState,
  currentTime: number,
  currentHpPercent: number,
  previousHpPercent: number
): BossMechanic[] {
  const available = mechanics.filter(mechanic => {
    // Check if active in current phase
    if (!isMechanicActiveInPhase(mechanic, state.currentPhase)) {
      return false;
    }

    // Check if should trigger based on HP threshold (trigger-based mechanics)
    if (mechanic.triggerAt) {
      const shouldTrigger = shouldTriggerMechanic(mechanic, currentHpPercent, previousHpPercent);
      if (shouldTrigger) {
        return true; // Trigger-based mechanics bypass cooldown check
      }
      return false; // Not at trigger threshold yet
    }

    // For non-trigger mechanics, check cooldown
    if (!isMechanicOffCooldown(mechanic, state, currentTime)) {
      return false;
    }

    // No trigger threshold, available if off cooldown
    return true;
  });
  
  console.log(`[getAvailableMechanics] Found ${available.length} available mechanics out of ${mechanics.length} total`, {
    currentPhase: state.currentPhase,
    hpPercent: currentHpPercent,
    available: available.map(m => m.name)
  });
  
  return available;
}

/**
 * Initialize boss mechanics state
 */
export function initializeBossMechanicsState(): BossMechanicsState {
  return {
    currentPhase: 1,
    phaseTransitions: new Map(),
    activeCasts: [],
    mechanicCooldowns: new Map(),
    spawnedAdds: [],
    enrageActive: false,
    enrageDamageMultiplier: 1.0
  };
}
