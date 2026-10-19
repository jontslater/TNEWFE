/** Sanity checks for src/combat/balance.ts constants (bundled JSON). */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const dir = dirname(fileURLToPath(import.meta.url));
const json = JSON.parse(readFileSync(join(dir, '../src/combat/data/balance.json'), 'utf8'));

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const g = (L) => 1 + json.levelCurve.gPerLevel * (L - 1);
const xp = (L) => Math.floor(json.levelCurve.xpToNextCoefficient * g(L) * L ** json.levelCurve.xpToNextExponent);

assert(json.levelCurve.xpToNextCoefficient === 60, 'XP coefficient 60 (Jonathan)');
assert(xp(1) === 60, `L1 xp need ${xp(1)}`);
assert(xp(10) === Math.floor(60 * g(10) * 10 ** 1.13), 'L10 xp formula');
assert(json.combat.critChanceCap === 0.35, 'crit cap 35%');
assert(json.combat.damageReductionCap === 0.75, 'DR cap 75%');
assert(json.loot.trashDropChance === 0.08, '8% trash drop');
assert(json.combat.swingIntervalMs === 2000, '2s swing');
assert(json.roleAbilities.shieldWall.partyDamageReduction === 0.2, 'shield wall party -20%');

const dr = (ar, L) => Math.min(0.75, ar / (ar + json.combat.armorConstantK * g(L)));
assert(Math.abs(dr(300, 1) - 0.428) < 0.02, 'tank DR ~43% at L1');

console.log('test-balance: OK', { xp10: xp(10), xp25: xp(25), drL1tank: dr(300, 1).toFixed(3) });
