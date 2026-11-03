/**
 * Hero progression — max XP curve, multi-level ups, skill points.
 * Matches idleDnD-Backend `src/utils/levelUpHelper.js` and `src/data/skills.js`.
 */

export const MAX_HERO_LEVEL = 100;
export const FIRST_SKILL_POINT_LEVEL = 6;
export const SKILL_POINT_LEVEL_STEP = 2;

/** Polynomial max XP per level (WoW-style). Level 1 → 100 XP. */
export function calculateMaxXp(level: number): number {
  if (level <= 1) return 100;
  return Math.floor(40 * level * level + 300 * level - 240);
}

/** Total skill points earned from level 1 through `level` (not minus spent). */
export function totalSkillPointsEarnedForLevel(level: number): number {
  if (level < FIRST_SKILL_POINT_LEVEL) return 0;
  const capped = Math.min(level, MAX_HERO_LEVEL);
  let count = 0;
  for (let l = FIRST_SKILL_POINT_LEVEL; l <= capped; l += SKILL_POINT_LEVEL_STEP) {
    count++;
  }
  return count;
}

/** Skill points gained when rising from oldLevel to newLevel (exclusive old, inclusive new). */
export function skillPointsGainedBetweenLevels(oldLevel: number, newLevel: number): number {
  if (newLevel <= oldLevel) return 0;
  return (
    totalSkillPointsEarnedForLevel(newLevel) - totalSkillPointsEarnedForLevel(oldLevel)
  );
}

export interface LevelUpResult {
  level: number;
  xp: number;
  maxXp: number;
  levelsGained: number;
  leveledUp: boolean;
  skillPointsGained: number;
}

/**
 * Apply XP and consume level-ups up to MAX_HERO_LEVEL.
 * Does not mutate stats — callers recalculate via computeHeroStats / backend ROLE_CONFIG.
 */
export function processLevelUps(
  currentLevel: number,
  newXp: number,
  currentMaxXp?: number,
  maxLevel: number = MAX_HERO_LEVEL
): LevelUpResult {
  let level = currentLevel || 1;
  let xp = newXp;
  let maxXp = currentMaxXp ?? calculateMaxXp(level);
  let levelsGained = 0;

  if (level >= maxLevel) {
    xp = Math.min(xp, calculateMaxXp(maxLevel));
    return {
      level: maxLevel,
      xp,
      maxXp: calculateMaxXp(maxLevel),
      levelsGained: 0,
      leveledUp: false,
      skillPointsGained: 0,
    };
  }

  while (xp >= maxXp && level < maxLevel) {
    const prevLevel = level;
    level++;
    levelsGained++;
    xp -= maxXp;
    maxXp = calculateMaxXp(level);
    if (level >= maxLevel && xp > maxXp) {
      xp = Math.min(xp, maxXp);
      break;
    }
  }

  const skillPointsGained =
    levelsGained > 0
      ? skillPointsGainedBetweenLevels(currentLevel, level)
      : 0;

  return {
    level,
    xp,
    maxXp,
    levelsGained,
    leveledUp: levelsGained > 0,
    skillPointsGained,
  };
}

/** Cumulative XP required to reach `targetLevel` from level 1 (sum of maxXp for levels 1..targetLevel-1). */
export function cumulativeXpToReachLevel(targetLevel: number): number {
  let total = 0;
  for (let l = 1; l < targetLevel; l++) {
    total += calculateMaxXp(l);
  }
  return total;
}

/** Legacy linear max XP used in several UI fallbacks before consolidation. */
export function legacyLinearMaxXp(level: number): number {
  return 100 + (level || 1) * 10;
}
