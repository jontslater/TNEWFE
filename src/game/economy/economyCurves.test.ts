import { describe, expect, it } from 'vitest';
import {
  calculateMaxXp,
  cumulativeXpToReachLevel,
  legacyLinearMaxXp,
  totalSkillPointsEarnedForLevel,
} from './progression';
import {
  calculateGoldFromKill,
  resolveEnemyXp,
  sumGoldFromEnemies,
  TRAVEL_XP_PER_TICK,
} from './rewards';

describe('economy curves (before/after)', () => {
  it('prints XP-to-level and gold income table for PR documentation', () => {
    const levels = [1, 5, 10, 20, 30, 50, 100];
    const rows: string[] = [];
    rows.push(
      '| Level | Legacy maxXp (wrong) | Polynomial maxXp | Cumulative XP to reach | Skill pts earned | Gold/kill (enemy xp=level×10) |'
    );
    rows.push('| --- | --- | --- | --- | --- | --- |');

    for (const level of levels) {
      const enemyXp = resolveEnemyXp({ level });
      rows.push(
        `| ${level} | ${legacyLinearMaxXp(level).toLocaleString()} | ${calculateMaxXp(level).toLocaleString()} | ${cumulativeXpToReachLevel(level).toLocaleString()} | ${totalSkillPointsEarnedForLevel(level)} | ${calculateGoldFromKill(enemyXp)} |`
      );
    }

    const sampleWave = [
      { level: 12, xp: 120 },
      { level: 12, xp: 120 },
      { level: 14, xp: 140 },
    ];
    const waveGold = sumGoldFromEnemies(sampleWave);
    rows.push('');
    rows.push(`Sample 3-mob wave gold (after): **${waveGold}g** (was same formula; legacy UI maxXp inflated level-up speed).`);
    rows.push(`Travel tick XP: **${TRAVEL_XP_PER_TICK}** per peaceful travel (unchanged).`);

    // eslint-disable-next-line no-console -- intentional table for sim:economy / PR
    console.log('\n' + rows.join('\n') + '\n');

    expect(calculateMaxXp(10)).toBeGreaterThan(legacyLinearMaxXp(10));
    expect(waveGold).toBe(38);
  });
});
