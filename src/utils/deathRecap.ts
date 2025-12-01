/**
 * Death Recap System
 * Tracks damage sources leading up to death
 */

export interface DeathRecapEntry {
  source: string; // Source name (enemy or ability)
  damage: number;
  damageType: 'physical' | 'magic' | 'dot' | 'environmental';
  timestamp: number;
  abilityName?: string; // If from a specific ability
}

export interface DeathRecap {
  heroId: string;
  heroName: string;
  deathTime: number;
  entries: DeathRecapEntry[];
  totalDamage: number;
  killingBlow: DeathRecapEntry | null;
}

export interface DeathRecapState {
  damageHistory: Map<string, DeathRecapEntry[]>; // heroId -> entries
  historyWindow: number; // milliseconds to track (default: 10 seconds)
}

/**
 * Initialize death recap state
 */
export function initializeDeathRecapState(historyWindow: number = 10000): DeathRecapState {
  return {
    damageHistory: new Map(),
    historyWindow
  };
}

/**
 * Record damage for death recap
 */
export function recordDamageForRecap(
  state: DeathRecapState,
  heroId: string,
  source: string,
  damage: number,
  damageType: 'physical' | 'magic' | 'dot' | 'environmental' = 'physical',
  abilityName?: string
): DeathRecapState {
  const now = Date.now();
  const entries = state.damageHistory.get(heroId) || [];

  // Add new entry
  const newEntry: DeathRecapEntry = {
    source,
    damage,
    damageType,
    timestamp: now,
    abilityName
  };

  // Remove old entries outside window
  const cutoffTime = now - state.historyWindow;
  const filteredEntries = entries.filter(e => e.timestamp >= cutoffTime);

  // Add new entry
  filteredEntries.push(newEntry);

  const newHistory = new Map(state.damageHistory);
  newHistory.set(heroId, filteredEntries);

  return {
    ...state,
    damageHistory: newHistory
  };
}

/**
 * Generate death recap when hero dies
 */
export function generateDeathRecap(
  state: DeathRecapState,
  heroId: string,
  heroName: string,
  deathTime: number
): DeathRecap | null {
  const entries = state.damageHistory.get(heroId) || [];

  if (entries.length === 0) {
    return null;
  }

  // Filter to entries within history window
  const cutoffTime = deathTime - state.historyWindow;
  const relevantEntries = entries.filter(e => e.timestamp >= cutoffTime);

  if (relevantEntries.length === 0) {
    return null;
  }

  // Sort by timestamp (most recent first)
  relevantEntries.sort((a, b) => b.timestamp - a.timestamp);

  // Calculate total damage
  const totalDamage = relevantEntries.reduce((sum, e) => sum + e.damage, 0);

  // Find killing blow (last entry)
  const killingBlow = relevantEntries[0] || null;

  return {
    heroId,
    heroName,
    deathTime,
    entries: relevantEntries,
    totalDamage,
    killingBlow
  };
}

/**
 * Clear death recap history for a hero
 */
export function clearDeathRecap(
  state: DeathRecapState,
  heroId: string
): DeathRecapState {
  const newHistory = new Map(state.damageHistory);
  newHistory.delete(heroId);

  return {
    ...state,
    damageHistory: newHistory
  };
}

/**
 * Get damage breakdown by source
 */
export function getDamageBreakdown(recap: DeathRecap): Map<string, number> {
  const breakdown = new Map<string, number>();

  for (const entry of recap.entries) {
    const key = entry.abilityName || entry.source;
    const current = breakdown.get(key) || 0;
    breakdown.set(key, current + entry.damage);
  }

  return breakdown;
}



