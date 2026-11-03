/**
 * Enemy combat scaling — idle/dungeon/raid HP & damage tuned to hero output.
 * Keeps normal mobs at ~3–6 effective hits per on-level hero; bosses take much longer.
 */

import { averageCombatGearScore, computeCombatGearScore } from '../economy/gearScore';
import { computeHeroStats } from './computeHeroStats';
import type { HeroStatInput } from './types';

export const COMBAT_BALANCE = {
  /** Cap idle adventure level used for enemy scaling (matches battlefield spawn) */
  idleLevelCap: 30,
  /** Target effective hits from one hero before mitigation variance */
  normalHitsMin: 3,
  normalHitsTarget: 4.5,
  normalHitsMax: 6,
  /** Multiplier on hit target for boss templates / boss waves */
  bossHitsMultiplier: 3.5,
  templateHpMultiplier: 1.2,
  attackMultiplier: 1.1,
  defenseMultiplier: 0.9,
  /** Level scaling for attack/defense curve (HP uses TTK targeting) */
  levelMultiplierPerLevel: 0.06,
  gearScoreDivisor: 1000,
  waveDivisor: 100,
} as const;

export interface ScalingFactors {
  avgLevel: number;
  partySize: number;
  avgGearScore: number;
  waveCount: number;
  difficultyModifier?: number;
}

export interface ScalingResult {
  multiplier: number;
  levelMultiplier: number;
  partySizeMultiplier: number;
  gearScoreMultiplier: number;
  waveMultiplier: number;
  difficultyModifier: number;
  avgLevel: number;
  partySize: number;
  avgGearScore: number;
  waveCount: number;
}

export interface ScaledEnemyStats {
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
}

export type ContentTier = 'idle' | 'dungeon' | 'raid';

export interface EnemyScaleOptions {
  packSize: number;
  isBoss: boolean;
  isBossWave?: boolean;
  referenceHeroes: HeroStatInput[];
  waveCount: number;
  difficultyModifier?: number;
  contentTier?: ContentTier;
  /** Extra multiplier for dungeon/raid difficulty tier */
  tierMultiplier?: number;
}

export function calculateAveragePartyLevel(heroes: Array<{ level: number }>): number {
  if (heroes.length === 0) return 1;
  return heroes.reduce((sum, h) => sum + h.level, 0) / heroes.length;
}

export function calculateAverageGearScore(heroes: HeroStatInput[]): number {
  return averageCombatGearScore(heroes);
}

export { computeCombatGearScore as calculateCombatGearScore };

export function calculateEnemyScaling(factors: ScalingFactors): ScalingResult {
  const {
    avgLevel,
    partySize,
    avgGearScore,
    waveCount,
    difficultyModifier = 1.0,
  } = factors;

  const levelMultiplier = 1 + avgLevel * COMBAT_BALANCE.levelMultiplierPerLevel;

  let partySizeMultiplier: number;
  if (partySize <= 5) {
    partySizeMultiplier = 1 + (partySize - 1) * 0.08;
  } else if (partySize <= 10) {
    partySizeMultiplier = 1 + 4 * 0.08 + (partySize - 5) * 0.12;
  } else {
    partySizeMultiplier = 1 + 4 * 0.08 + 5 * 0.12 + (partySize - 10) * 0.15;
  }

  const gearScoreMultiplier = 1 + avgGearScore / COMBAT_BALANCE.gearScoreDivisor;
  const waveMultiplier = 1 + waveCount / COMBAT_BALANCE.waveDivisor;

  let totalMultiplier =
    levelMultiplier * partySizeMultiplier * gearScoreMultiplier * waveMultiplier;
  totalMultiplier *= difficultyModifier;

  return {
    multiplier: totalMultiplier,
    levelMultiplier,
    partySizeMultiplier,
    gearScoreMultiplier,
    waveMultiplier,
    difficultyModifier,
    avgLevel,
    partySize,
    avgGearScore: Math.floor(avgGearScore),
    waveCount,
  };
}

export function getDifficultyScalingFromHeroes(
  heroes: HeroStatInput[],
  waveCount = 1,
  difficultyModifier = 1.0
): ScalingResult {
  const cappedLevel = (level: number) =>
    Math.min(level, COMBAT_BALANCE.idleLevelCap);
  const avgLevel =
    heroes.length === 0
      ? 1
      : heroes.reduce((sum, h) => sum + cappedLevel(h.level), 0) / heroes.length;

  return calculateEnemyScaling({
    avgLevel,
    partySize: Math.max(1, heroes.length),
    avgGearScore: calculateAverageGearScore(heroes),
    waveCount,
    difficultyModifier,
  });
}

/** Matches battlefield / damageCalculation enemy mitigation */
export function mitigateDamageVsEnemyDefense(rawDamage: number, enemyDefense: number): number {
  const damageAfterDefense = rawDamage / (1 + enemyDefense / 250);
  const minDamage = Math.max(1, rawDamage * 0.25);
  return Math.max(minDamage, Math.floor(damageAfterDefense));
}

export function getPackSizeReduction(packSize: number): number {
  if (packSize === 1) return 1.0;
  if (packSize === 2) return 0.6;
  return 0.45;
}

function averageReferenceDamagePerHit(heroes: HeroStatInput[]): number {
  if (heroes.length === 0) return 50;
  const total = heroes.reduce((sum, h) => sum + estimateIdleHeroDamagePerHit(h), 0);
  return Math.max(1, total / heroes.length);
}

/**
 * Mirrors CleanBattlefieldSource melee/caster damage (without crit procs).
 * Used so enemy HP tracks actual idle combat output, not the simplified base-damage helper.
 */
export function estimateIdleHeroDamagePerHit(hero: HeroStatInput): number {
  const stats = computeHeroStats(hero);
  const role = hero.role.toLowerCase();
  let baseDamage = stats.attack;

  const meleeRoles = [
    'berserker',
    'crusader',
    'assassin',
    'reaper',
    'bladedancer',
    'monk',
    'stormwarrior',
    'hunter',
  ];
  const casterRoles = [
    'mage',
    'warlock',
    'elementalist',
    'necromancer',
    'sorcerer',
    'pyromancer',
    'ranger',
    'shadowpriest',
    'mooncaller',
    'stormcaller',
    'firemage',
    'frostmage',
    'dragonsorcerer',
  ];
  const healerRoles = [
    'cleric',
    'atoner',
    'druid',
    'lightbringer',
    'shaman',
    'mistweaver',
    'chronomancer',
    'bard',
  ];
  const tankRoles = [
    'guardian',
    'paladin',
    'warden',
    'bloodknight',
    'vanguard',
    'brewmaster',
  ];

  if (meleeRoles.includes(role)) {
    baseDamage *= 1 + Math.min(stats.strength, 100) * 0.01;
    baseDamage *= 1 + Math.min(stats.dexterity, 50) * 0.005;
    baseDamage *= 1 + Math.min(stats.meleeDamage, 30) * 0.01;
  } else if (casterRoles.includes(role) || healerRoles.includes(role)) {
    baseDamage *= 1 + Math.min(stats.intellect, 100) * 0.01;
    baseDamage *= 1 + Math.min(stats.wisdom, 50) * 0.005;
    baseDamage *= 1 + Math.min(stats.spellDamage, 30) * 0.01;
  } else if (tankRoles.includes(role)) {
    baseDamage *= 1 + Math.min(stats.strength, 100) * 0.005;
  }

  if (stats.damageMultiplier > 0) {
    baseDamage *= 1 + stats.damageMultiplier / 100;
  }

  return Math.max(1, Math.floor(baseDamage));
}

function tierMultiplierFor(options: EnemyScaleOptions): number {
  if (options.tierMultiplier != null) return options.tierMultiplier;
  if (options.contentTier === 'dungeon') return 1.15;
  if (options.contentTier === 'raid') return 1.35;
  return 1;
}

/** Legacy idle HP (pre-balance) — for regression tables only */
export function computeLegacyIdleEnemyHp(
  baseHp: number,
  scalingMultiplier: number,
  packReduction: number
): number {
  return Math.max(1, Math.floor(baseHp * scalingMultiplier * COMBAT_BALANCE.templateHpMultiplier * packReduction));
}

export function scaleEnemyForCombat(
  base: { hp: number; attack: number; defense: number },
  options: EnemyScaleOptions
): ScaledEnemyStats {
  const cappedHeroes = options.referenceHeroes.map((h) => ({
    ...h,
    level: Math.min(h.level, COMBAT_BALANCE.idleLevelCap),
  }));

  const scaling = getDifficultyScalingFromHeroes(
    cappedHeroes,
    options.waveCount,
    options.difficultyModifier ?? 1.0
  );
  const packReduction = getPackSizeReduction(options.packSize);
  const partySize = Math.max(1, cappedHeroes.length);

  const attack = Math.floor(
    base.attack * scaling.multiplier * COMBAT_BALANCE.attackMultiplier * packReduction
  );
  const defense = Math.floor(
    base.defense * scaling.multiplier * COMBAT_BALANCE.defenseMultiplier * packReduction
  );

  const templateHp = Math.floor(
    base.hp * scaling.multiplier * COMBAT_BALANCE.templateHpMultiplier * packReduction
  );

  const refDamage = averageReferenceDamagePerHit(cappedHeroes);
  let hitsTarget = COMBAT_BALANCE.normalHitsTarget;
  if (options.isBoss || options.isBossWave) {
    hitsTarget *= COMBAT_BALANCE.bossHitsMultiplier;
  }

  const mitigated = mitigateDamageVsEnemyDefense(refDamage, defense);
  const tierMult = tierMultiplierFor(options);
  const minHitsHp = Math.floor(
    mitigated * COMBAT_BALANCE.normalHitsMin * partySize * tierMult
  );
  const ttkHp = Math.floor(mitigated * hitsTarget * partySize * tierMult);

  const hp = Math.max(templateHp, ttkHp, minHitsHp);

  return {
    hp,
    maxHp: hp,
    attack,
    defense,
  };
}

export function estimateHeroHitsToKill(
  enemyHp: number,
  enemyDefense: number,
  heroDamagePerHit: number
): number {
  const perHit = mitigateDamageVsEnemyDefense(heroDamagePerHit, enemyDefense);
  if (perHit <= 0) return Infinity;
  return enemyHp / perHit;
}

/** Rounds until one enemy dies when each hero attacks once per round (idle combat) */
export function estimateCombatRoundsToKill(
  enemyHp: number,
  enemyDefense: number,
  heroes: HeroStatInput[]
): number {
  if (heroes.length === 0) return Infinity;
  const damagePerRound = heroes.reduce((sum, h) => {
    const raw = estimateIdleHeroDamagePerHit(h);
    return sum + mitigateDamageVsEnemyDefense(raw, enemyDefense);
  }, 0);
  if (damagePerRound <= 0) return Infinity;
  return enemyHp / damagePerRound;
}
