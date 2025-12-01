/**
 * Threat/Aggro System
 * Simplified threat system for idle game - tanks generate more threat, bosses target highest threat
 */

export interface ThreatData {
  heroId: string;
  threat: number;
  lastUpdate: number;
}

export interface ThreatState {
  threats: Map<string, number>; // heroId -> threat value
  lastUpdate: Map<string, number>; // heroId -> timestamp
}

/**
 * Initialize threat state
 */
export function initializeThreatState(): ThreatState {
  return {
    threats: new Map(),
    lastUpdate: new Map()
  };
}

/**
 * Calculate threat from damage
 */
export function calculateThreatFromDamage(
  damage: number,
  isTank: boolean,
  threatMultiplier: number = 1.0
): number {
  const baseThreat = damage;
  const roleMultiplier = isTank ? 2.0 : 1.0; // Tanks generate 2x threat
  return Math.floor(baseThreat * roleMultiplier * threatMultiplier);
}

/**
 * Calculate threat from healing
 */
export function calculateThreatFromHealing(
  healing: number,
  isTank: boolean,
  threatMultiplier: number = 0.5 // Healing generates less threat
): number {
  const baseThreat = healing * 0.5; // Healing generates 50% threat of damage
  const roleMultiplier = isTank ? 1.5 : 1.0;
  return Math.floor(baseThreat * roleMultiplier * threatMultiplier);
}

/**
 * Add threat to a hero
 */
export function addThreat(
  state: ThreatState,
  heroId: string,
  threatAmount: number,
  currentTime: number
): ThreatState {
  const currentThreat = state.threats.get(heroId) || 0;
  const newThreats = new Map(state.threats);
  const newLastUpdate = new Map(state.lastUpdate);

  newThreats.set(heroId, currentThreat + threatAmount);
  newLastUpdate.set(heroId, currentTime);

  return {
    threats: newThreats,
    lastUpdate: newLastUpdate
  };
}

/**
 * Get hero with highest threat
 */
export function getHighestThreatHero(
  state: ThreatState,
  aliveHeroIds: string[]
): string | null {
  if (aliveHeroIds.length === 0) {
    return null;
  }

  let maxThreat = -1;
  let highestThreatHero: string | null = null;

  for (const heroId of aliveHeroIds) {
    const threat = state.threats.get(heroId) || 0;
    if (threat > maxThreat) {
      maxThreat = threat;
      highestThreatHero = heroId;
    }
  }

  return highestThreatHero;
}

/**
 * Reduce threat (for threat drops, taunts, etc.)
 */
export function reduceThreat(
  state: ThreatState,
  heroId: string,
  reductionPercent: number
): ThreatState {
  const currentThreat = state.threats.get(heroId) || 0;
  const newThreat = Math.floor(currentThreat * (1 - reductionPercent));
  
  const newThreats = new Map(state.threats);
  newThreats.set(heroId, newThreat);

  return {
    ...state,
    threats: newThreats
  };
}

/**
 * Reset threat for a hero
 */
export function resetThreat(
  state: ThreatState,
  heroId: string
): ThreatState {
  const newThreats = new Map(state.threats);
  newThreats.delete(heroId);

  const newLastUpdate = new Map(state.lastUpdate);
  newLastUpdate.delete(heroId);

  return {
    threats: newThreats,
    lastUpdate: newLastUpdate
  };
}

/**
 * Decay threat over time (optional - reduces threat gradually)
 */
export function decayThreat(
  state: ThreatState,
  decayRate: number, // Threat decay per second
  currentTime: number
): ThreatState {
  const newThreats = new Map();
  const newLastUpdate = new Map(state.lastUpdate);

  for (const [heroId, lastUpdate] of state.lastUpdate.entries()) {
    const timeSinceUpdate = (currentTime - lastUpdate) / 1000; // Convert to seconds
    const currentThreat = state.threats.get(heroId) || 0;
    const decayedThreat = Math.max(0, currentThreat - (decayRate * timeSinceUpdate));
    
    if (decayedThreat > 0) {
      newThreats.set(heroId, Math.floor(decayedThreat));
      newLastUpdate.set(heroId, lastUpdate);
    }
  }

  return {
    threats: newThreats,
    lastUpdate: newLastUpdate
  };
}

/**
 * Check if hero is a tank
 */
export function isTankRole(role: string): boolean {
  const roleLower = role.toLowerCase();
  return roleLower.includes('tank') ||
         roleLower.includes('guardian') ||
         roleLower.includes('paladin') ||
         roleLower.includes('warden') ||
         roleLower.includes('bloodknight') ||
         roleLower.includes('vanguard');
}



