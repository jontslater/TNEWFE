/**
 * CBS combat smoke: set bonuses from exported gear-set-bonuses + getCharacterStats path.
 */
import gearSets from '../src/gear/data/gear-set-bonuses.json';
import { calculateBackendSetBonuses } from '../src/gear/setBonusEngine';
import { getCombatSetHookModifiers } from '../src/gear/combatSetHooks';
import { getCharacterStats } from '../src/utils/combatUtils';
import { assignHeroIdsToKills, killsForBattlefieldLootRoll } from '../src/overlay/syncLootKills';
import { computeDamageTaken } from '../src/combat/balance';
import { computeSkillModifiers } from '../src/game/skills/computeSkillModifiers';
import type { Equipment } from '../src/types/Hero';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(Array.isArray(gearSets) && gearSets.length === 36, 'gear-set-bonuses has 36 sets');

const tankSet = gearSets.find((s) => s.id === 'dungeon_t1_tank') as {
  id: string;
  slots: string[];
};
const healerSet = gearSets.find((s) => s.id === 'dungeon_t1_healer') as { id: string; slots: string[] };
const meleeSet = gearSets.find((s) => s.id === 'dungeon_t1_melee') as { id: string; slots: string[] };

function equipPieces(set: { id: string; slots: string[] }, count: number): Equipment {
  const equipment: Equipment = {};
  for (const slot of set.slots.slice(0, count)) {
    (equipment as Record<string, unknown>)[slot] = {
      setId: set.id,
      name: 'Piece',
      slot,
      rarity: 'rare',
      attack: 1,
      defense: 1,
      hp: 1,
    };
  }
  return equipment;
}

const tank4 = equipPieces(tankSet, 4);
const tankHooks = getCombatSetHookModifiers(tank4);
assert(tankHooks.shieldWallPartyDrBonus === 0.05, 'tank 4pc party DR hook');
assert(tankHooks.shieldWallCooldownMsDelta === -5000, 'tank 2pc shield wall CDR hook');

const healer2 = equipPieces(healerSet, 2);
const healerHooks = getCombatSetHookModifiers(healer2);
assert(healerHooks.groupHealBonusFraction === 0.1, 'healer 2pc group heal +10%');

const melee2 = equipPieces(meleeSet, 2);
const meleeHooks = getCombatSetHookModifiers(melee2);
assert(meleeHooks.burstStrikeCritBonus === 0.1, 'melee 2pc burst crit +10%');

const setBonuses = calculateBackendSetBonuses(tank4, 'guardian');
assert(setBonuses.damageReduction === 0, 'hook DR not on permanent stat sheet');

const hero = {
  id: 'h1',
  name: 'Smoke',
  role: 'guardian',
  level: 10,
  hp: 200,
  maxHp: 200,
  attack: 20,
  defense: 30,
  equipment: tank4,
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
