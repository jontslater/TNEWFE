import { describe, expect, it } from 'vitest';
import {
  COMBAT_BALANCE,
  computeLegacyIdleEnemyHp,
  estimateCombatRoundsToKill,
  estimateHeroHitsToKill,
  estimateIdleHeroDamagePerHit,
  getDifficultyScalingFromHeroes,
  getPackSizeReduction,
  scaleEnemyForCombat,
} from './enemyCombatScaling';
import type { HeroStatInput } from './types';

function makeHero(level: number, role = 'berserker', gearAttack = 0): HeroStatInput {
  return {
    role,
    level,
    equipment:
      gearAttack > 0
        ? {
            weapon: { attack: gearAttack, defense: gearAttack / 2, hp: gearAttack * 2 },
          }
        : undefined,
  };
}

function makeParty(level: number, size: number, gearAttack = 0): HeroStatInput[] {
  return Array.from({ length: size }, (_, i) =>
    makeHero(level, i % 2 === 0 ? 'berserker' : 'mage', gearAttack)
  );
}

describe('enemyCombatScaling', () => {
  it('targets ~3–6 mitigated hits per hero for idle mobs with gear', () => {
    const heroes = makeParty(10, 1, 40);
    const base = { hp: 200, attack: 32, defense: 22 };
    const scaled = scaleEnemyForCombat(base, {
      packSize: 1,
      isBoss: false,
      referenceHeroes: heroes,
      waveCount: 5,
      contentTier: 'idle',
    });
    const heroDamage = estimateIdleHeroDamagePerHit(heroes[0]);
    const hits = estimateHeroHitsToKill(scaled.hp, scaled.defense, heroDamage);
    expect(hits).toBeGreaterThanOrEqual(COMBAT_BALANCE.normalHitsMin);
    expect(hits).toBeLessThanOrEqual(COMBAT_BALANCE.normalHitsMax + 1);
  });

  it('increases HP with party size so rounds-to-kill stay idle-friendly', () => {
    const solo = scaleEnemyForCombat(
      { hp: 200, attack: 32, defense: 22 },
      {
        packSize: 1,
        isBoss: false,
        referenceHeroes: makeParty(15, 1, 60),
        waveCount: 10,
      }
    );
    const party = scaleEnemyForCombat(
      { hp: 200, attack: 32, defense: 22 },
      {
        packSize: 1,
        isBoss: false,
        referenceHeroes: makeParty(15, 5, 60),
        waveCount: 10,
      }
    );
    expect(party.hp).toBeGreaterThan(solo.hp * 3);

    const soloRounds = estimateCombatRoundsToKill(
      solo.hp,
      solo.defense,
      makeParty(15, 1, 60)
    );
    const partyRounds = estimateCombatRoundsToKill(
      party.hp,
      party.defense,
      makeParty(15, 5, 60)
    );
    expect(Math.abs(partyRounds - soloRounds)).toBeLessThan(2.5);
  });

  it('bosses require substantially more hits than trash', () => {
    const heroes = makeParty(20, 3, 80);
    const trash = scaleEnemyForCombat(
      { hp: 350, attack: 55, defense: 38 },
      { packSize: 1, isBoss: false, referenceHeroes: heroes, waveCount: 20 }
    );
    const boss = scaleEnemyForCombat(
      { hp: 350, attack: 55, defense: 38 },
      { packSize: 1, isBoss: true, referenceHeroes: heroes, waveCount: 20 }
    );
    const dmg = estimateIdleHeroDamagePerHit(heroes[0]);
    const trashHits = estimateHeroHitsToKill(trash.hp, trash.defense, dmg);
    const bossHits = estimateHeroHitsToKill(boss.hp, boss.defense, dmg);
    expect(bossHits).toBeGreaterThan(trashHits * 2.5);
  });

  it('prints before/after TTK table for documentation', () => {
    const scenarios = [
      { label: 'Lv5 solo naked', level: 5, party: 1, gear: 0, wave: 1 },
      { label: 'Lv10 solo geared', level: 10, party: 1, gear: 40, wave: 5 },
      { label: 'Lv20 party×5 geared', level: 20, party: 5, gear: 100, wave: 25 },
      { label: 'Lv30 solo geared', level: 30, party: 1, gear: 150, wave: 50 },
    ];
    const base = { hp: 200, attack: 32, defense: 22 };
    const rows: string[] = [];
    rows.push('| Scenario | Before (hero hits) | After (hero hits) | Before (rounds) | After (rounds) |');
    rows.push('| --- | --- | --- | --- | --- |');

    for (const s of scenarios) {
      const heroes = makeParty(s.level, s.party, s.gear);
      const scaling = getDifficultyScalingFromHeroes(heroes, s.wave, 1);
      const pack = getPackSizeReduction(1);
      const legacyHp = computeLegacyIdleEnemyHp(base.hp, scaling.multiplier, pack);
      const legacyDef = Math.floor(
        base.defense * scaling.multiplier * COMBAT_BALANCE.defenseMultiplier
      );
      const scaled = scaleEnemyForCombat(base, {
        packSize: 1,
        isBoss: false,
        referenceHeroes: heroes,
        waveCount: s.wave,
      });
      const dmg = estimateIdleHeroDamagePerHit(heroes[0]);
      const beforeHits = estimateHeroHitsToKill(legacyHp, legacyDef, dmg);
      const afterHits = estimateHeroHitsToKill(scaled.hp, scaled.defense, dmg);
      const beforeRounds = estimateCombatRoundsToKill(legacyHp, legacyDef, heroes);
      const afterRounds = estimateCombatRoundsToKill(scaled.hp, scaled.defense, heroes);
      rows.push(
        `| ${s.label} | ${beforeHits.toFixed(1)} | ${afterHits.toFixed(1)} | ${beforeRounds.toFixed(1)} | ${afterRounds.toFixed(1)} |`
      );
    }

    // eslint-disable-next-line no-console -- intentional table for test output / PR docs
    console.log('\n' + rows.join('\n') + '\n');
    expect(rows.length).toBeGreaterThan(2);
  });
});
