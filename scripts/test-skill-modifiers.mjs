/** Lightweight checks for bundled skill defs and modifier caps (no TS runner required). */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const dir = dirname(fileURLToPath(import.meta.url));
const defs = JSON.parse(
  readFileSync(join(dir, '../src/game/skills/data/skillDefinitions.json'), 'utf8')
);

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(defs.version === 1, 'skillDefinitions version');
assert(defs.caps.critChancePercent === 75, 'crit cap 75%');
assert(defs.caps.damageReductionPercent === 75, 'DR cap 75%');
assert(defs.caps.cooldownReductionPercent === 40, 'CDR cap 40%');

const divineGraceSkill = defs.skills.find((s) => s.id === 'cleric_skill_3');
assert(divineGraceSkill && divineGraceSkill.effect === 'double_heal_proc', 'cleric Divine Grace skill');
assert(divineGraceSkill.maxPoints === 5, 'max rank 5');
assert(divineGraceSkill.baseValuePerRank === 6, '6% double-heal per rank');

const skillIdRe = /^(.+)_skill_(\d+)$/;
const m = 'guardian_skill_10'.match(skillIdRe);
assert(m && m[2] === '10', '1-based skill id parse');

assert(defs.activeAbilities.byRole.tank.id === 'shieldWall', 'tank role active shieldWall');

console.log('test-skill-modifiers: OK');
