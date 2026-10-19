/**
 * Integration smoke test: skill modifiers + one hit through shared balance math
 * and modular damage helper (mirrors overlay crit/DR rules).
 */
import { computeSkillModifiers } from '../src/game/skills/computeSkillModifiers';
import {
  applySkillDamageReductionPercent,
  capCritChance,
  computeHitDamage,
} from '../src/combat/balance';
import { calculateHeroDamage } from '../src/utils/combat/damageCalculation';
import type { Hero } from '../src/utils/combat/types';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const tankHero = {
  role: 'guardian',
  skills: {
    guardian_skill_2: { points: 5 },
    guardian_skill_10: { points: 5 },
  },
};

const mods = computeSkillModifiers(tankHero);
assert(mods.defenseMultiplier > 0, 'tank DR skills increase defenseMultiplier');
assert(mods.defenseMultiplier <= 75, 'DR capped at 75%');

const drApplied = applySkillDamageReductionPercent(1000, mods.defenseMultiplier);
assert(drApplied < 1000, 'skill DR reduces damage after armor step');
assert(drApplied >= 250, 'DR capped — at least 25% damage at 75% cap');

const dpsMods = computeSkillModifiers({
  role: 'berserker',
  skills: { berserker_skill_2: { points: 5 } },
});

const dpsHero: Hero = {
  id: 't1',
  username: 't',
  role: 'berserker',
  level: 25,
  hp: 500,
  maxHp: 500,
  attack: 200,
  defense: 50,
  critChance: capCritChance(0.05 + dpsMods.critChance / 100),
  skills: { berserker_skill_2: { points: 5 } },
  isDead: false,
};

const bonuses = { damageMultiplier: 1, healingMultiplier: 1, defenseMultiplier: 1, difficultyModifier: 1 };
const skillBonuses = () => ({ damageMultiplier: 0, critChance: 0, critDamage: 0, defenseMultiplier: 0 });
const stats = () => ({ attack: dpsHero.attack, defense: dpsHero.defense });

let critRolls = 0;
for (let i = 0; i < 200; i++) {
  const dmg = calculateHeroDamage(dpsHero, bonuses, stats, skillBonuses);
  if (dmg > dpsHero.attack! * 1.4) critRolls++;
}
assert(critRolls > 0, 'modular calculateHeroDamage produces crit-sized hits');

const hit = computeHitDamage({
  attack: dpsHero.attack!,
  attackerLevel: 25,
  targetArmor: 150,
  chatMult: 1.05,
  isCrit: false,
});
assert(hit > 0 && hit < dpsHero.attack! * 2, 'balance computeHitDamage in plausible range');

console.log('test-skill-combat: OK', {
  tankDr: mods.defenseMultiplier,
  afterSkillDr: drApplied,
  sampleHit: hit,
});
