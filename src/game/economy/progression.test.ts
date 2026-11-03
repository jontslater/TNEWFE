import { describe, expect, it } from 'vitest';
import {
  calculateMaxXp,
  processLevelUps,
  skillPointsGainedBetweenLevels,
  totalSkillPointsEarnedForLevel,
} from './progression';

describe('progression', () => {
  it('matches backend polynomial maxXp samples', () => {
    expect(calculateMaxXp(1)).toBe(100);
    expect(calculateMaxXp(10)).toBe(6760);
    expect(calculateMaxXp(100)).toBe(429760);
  });

  it('handles multi-level ups and skill points', () => {
    const startLevel = 5;
    const maxXp = calculateMaxXp(startLevel);
    const result = processLevelUps(startLevel, maxXp + calculateMaxXp(6) + 50, maxXp);
    expect(result.leveledUp).toBe(true);
    expect(result.level).toBeGreaterThan(startLevel);
    expect(result.skillPointsGained).toBe(
      skillPointsGainedBetweenLevels(startLevel, result.level)
    );
  });

  it('grants 48 skill points at level 100', () => {
    expect(totalSkillPointsEarnedForLevel(100)).toBe(48);
  });
});
