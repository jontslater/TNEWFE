import { describe, expect, it } from 'vitest';
import { applyHeroCombatStats } from './applyHeroCombatStats';
import { computeHeroStats } from './computeHeroStats';
import {
  applyRewardBonus,
  applyStatDamageReduction,
  getCritDamageMultiplier,
} from './combatHelpers';

describe('computeHeroStats', () => {
  it('includes gem damage reduction, crit damage, and reward bonuses', () => {
    const hero = {
      role: 'berserker',
      level: 10,
      equipment: {
        weapon: {
          attack: 20,
          sockets: [
            {
              gem: {
                stats: {
                  damageReduction: 10,
                  critDamage: 15,
                  xpGain: 20,
                  goldGain: 25,
                },
              },
            },
          ],
          socketBonuses: {
            xpGain: 5,
            goldGain: 5,
          },
        },
      },
      skills: {
        berserker_skill_2: { points: 1 },
      },
    };

    const stats = computeHeroStats(hero);
    expect(stats.damageReduction).toBeGreaterThanOrEqual(10);
    expect(stats.critDamageBonus).toBeGreaterThanOrEqual(25);
    expect(stats.rewardBonuses.xpGain).toBe(25);
    expect(stats.rewardBonuses.goldGain).toBe(30);
  });

  it('recalculates gem stats after level-up (no equipment early-exit)', () => {
    const hero = {
      role: 'guardian',
      level: 5,
      hp: 400,
      equipment: {
        armor: {
          defense: 5,
          sockets: [{ gem: { stats: { maxHp: 50, xpGain: 10 } } }],
        },
      },
    };

    const leveled = applyHeroCombatStats({ ...hero, level: 6 });
    expect(leveled.maxHp).toBeGreaterThan(applyHeroCombatStats({ ...hero, level: 5 }).maxHp);
    expect(leveled.xpGain).toBe(10);
  });
});

describe('combatHelpers', () => {
  it('applies crit damage bonus on top of 2x base', () => {
    expect(getCritDamageMultiplier(0)).toBe(2);
    expect(getCritDamageMultiplier(10)).toBeCloseTo(2.1);
  });

  it('applies flat damage reduction percentage', () => {
    expect(applyStatDamageReduction(100, 20)).toBe(80);
  });

  it('applies reward bonus percentage', () => {
    expect(applyRewardBonus(100, 25)).toBe(125);
  });
});
