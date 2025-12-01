/**
 * Damage Meter System
 * Tracks DPS, healing, and damage taken for combat analytics
 */

export interface DamageEntry {
  heroId: string;
  heroName: string;
  damage: number;
  healing: number;
  damageTaken: number;
  timestamp: number;
}

export interface DamageMeterData {
  heroId: string;
  heroName: string;
  totalDamage: number;
  totalHealing: number;
  totalDamageTaken: number;
  dps: number; // Damage per second
  hps: number; // Healing per second
  fightDuration: number; // milliseconds
  damagePercent: number; // Percentage of total damage
  healingPercent: number; // Percentage of total healing
}

export interface DamageMeterState {
  entries: DamageEntry[];
  fightStartTime: number;
  fightEndTime: number | null;
}

/**
 * Initialize damage meter state
 */
export function initializeDamageMeterState(): DamageMeterState {
  return {
    entries: [],
    fightStartTime: Date.now(),
    fightEndTime: null
  };
}

/**
 * Record damage dealt
 */
export function recordDamage(
  state: DamageMeterState,
  heroId: string,
  heroName: string,
  damage: number
): DamageMeterState {
  return {
    ...state,
    entries: [
      ...state.entries,
      {
        heroId,
        heroName,
        damage,
        healing: 0,
        damageTaken: 0,
        timestamp: Date.now()
      }
    ]
  };
}

/**
 * Record healing
 */
export function recordHealing(
  state: DamageMeterState,
  heroId: string,
  heroName: string,
  healing: number
): DamageMeterState {
  return {
    ...state,
    entries: [
      ...state.entries,
      {
        heroId,
        heroName,
        damage: 0,
        healing,
        damageTaken: 0,
        timestamp: Date.now()
      }
    ]
  };
}

/**
 * Record damage taken
 */
export function recordDamageTaken(
  state: DamageMeterState,
  heroId: string,
  heroName: string,
  damageTaken: number
): DamageMeterState {
  return {
    ...state,
    entries: [
      ...state.entries,
      {
        heroId,
        heroName,
        damage: 0,
        healing: 0,
        damageTaken,
        timestamp: Date.now()
      }
    ]
  };
}

/**
 * End fight and finalize meter
 */
export function endFight(state: DamageMeterState): DamageMeterState {
  return {
    ...state,
    fightEndTime: Date.now()
  };
}

/**
 * Calculate damage meter data for all heroes
 */
export function calculateDamageMeters(
  state: DamageMeterState
): DamageMeterData[] {
  const fightDuration = (state.fightEndTime || Date.now()) - state.fightStartTime;
  const fightDurationSeconds = Math.max(1, fightDuration / 1000);

  // Aggregate by hero
  const heroData = new Map<string, {
    heroId: string;
    heroName: string;
    totalDamage: number;
    totalHealing: number;
    totalDamageTaken: number;
  }>();

  for (const entry of state.entries) {
    const existing = heroData.get(entry.heroId) || {
      heroId: entry.heroId,
      heroName: entry.heroName,
      totalDamage: 0,
      totalHealing: 0,
      totalDamageTaken: 0
    };

    existing.totalDamage += entry.damage;
    existing.totalHealing += entry.healing;
    existing.totalDamageTaken += entry.damageTaken;

    heroData.set(entry.heroId, existing);
  }

  // Calculate totals
  let totalDamage = 0;
  let totalHealing = 0;

  for (const data of heroData.values()) {
    totalDamage += data.totalDamage;
    totalHealing += data.totalHealing;
  }

  // Create meter data
  const meters: DamageMeterData[] = [];

  for (const data of heroData.values()) {
    const dps = data.totalDamage / fightDurationSeconds;
    const hps = data.totalHealing / fightDurationSeconds;
    const damagePercent = totalDamage > 0 ? (data.totalDamage / totalDamage) * 100 : 0;
    const healingPercent = totalHealing > 0 ? (data.totalHealing / totalHealing) * 100 : 0;

    meters.push({
      heroId: data.heroId,
      heroName: data.heroName,
      totalDamage: data.totalDamage,
      totalHealing: data.totalHealing,
      totalDamageTaken: data.totalDamageTaken,
      dps,
      hps,
      fightDuration,
      damagePercent,
      healingPercent
    });
  }

  // Sort by total damage (descending)
  meters.sort((a, b) => b.totalDamage - a.totalDamage);

  return meters;
}

/**
 * Get top DPS heroes
 */
export function getTopDPS(
  meters: DamageMeterData[],
  count: number = 5
): DamageMeterData[] {
  return [...meters]
    .sort((a, b) => b.dps - a.dps)
    .slice(0, count);
}

/**
 * Get top healers
 */
export function getTopHealers(
  meters: DamageMeterData[],
  count: number = 5
): DamageMeterData[] {
  return [...meters]
    .filter(m => m.totalHealing > 0)
    .sort((a, b) => b.hps - a.hps)
    .slice(0, count);
}



