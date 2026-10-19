/**
 * CBS combat smoke: set bonuses from exported gear-set-bonuses + getCharacterStats path.
 */
import gearSets from '../src/gear/data/gear-set-bonuses.json';
import { calculateBackendSetBonuses } from '../src/gear/setBonusEngine';
import { getCharacterStats } from '../src/utils/combatUtils';
import { assignHeroIdsToKills, killsForBattlefieldLootRoll } from '../src/overlay/syncLootKills';
import { computeDamageTaken } from '../src/combat/balance';
import { computeSkillModifiers } from '../src/game/skills/computeSkillModifiers';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(Array.isArray(gearSets) && gearSets.length === 36, 'gear-set-bonuses has 36 sets');

const sampleSet = gearSets[0] as { id: string; slots: string[] };
const equipment: Record<string, unknown> = {};
for (const slot of sampleSet.slots.slice(0, 2)) {
  equipment[slot] = { setId: sampleSet.id, name: 'Piece', slot, rarity: 'rare', attack: 1, defense: 1, hp: 1 };
}
const setBonuses = calculateBackendSetBonuses(equipment as any, 'guardian');
assert(setBonuses.defense + setBonuses.attack + setBonuses.hp >= 0, 'set bonus engine runs');

const hero = {
  id: 'h1',
  name: 'Smoke',
  role: 'guardian',
  level: 10,
  hp: 200,
  maxHp: 200,
  attack: 20,
  defense: 30,
  equipment: equipment as any,
};
const stats = getCharacterStats(hero as any);
assert(stats.maxHp > 200, 'getCharacterStats includes gear/set contributions');

const kills = assignHeroIdsToKills(
  [{ level: 5, isBoss: true }, { level: 5, isElite: true }],
  ['h1', 'h2']
);
const rollKills = killsForBattlefieldLootRoll(kills);
assert(rollKills.length === 1 && rollKills[0].kind === 'elite', 'boss kinds stripped for loot/roll');

const mods = computeSkillModifiers(hero as any);
const dmg = computeDamageTaken(80, stats.defense || 30, 10, mods.defenseMultiplier);
assert(dmg > 0 && dmg < 80, 'CBS DR path via computeDamageTaken');

console.log('test-cbs-combat-smoke: OK', { sets: gearSets.length, rollKills: rollKills.length, dmg });
