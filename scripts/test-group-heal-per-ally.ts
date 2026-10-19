import { tryFireRoleActiveAbility } from '../src/game/skills/roleActiveCombat';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const now = Date.now();
const caster = {
  id: 'cleric-1',
  name: 'Cleric',
  role: 'cleric',
  hp: 200,
  maxHp: 500,
  attack: 10,
  cooldowns: { roleActiveReadyAt: 0 },
};
const tank = {
  id: 'tank-1',
  role: 'guardian',
  hp: 400,
  maxHp: 2000,
  isDead: false,
};
const allies = [caster, tank];
const enemies = [{ id: 'e1', hp: 100, maxHp: 100 }];

const result = tryFireRoleActiveAbility(caster, allies, enemies, now);
assert(result !== null && result.healsByHeroId, 'group heal fires');
const tankHeal = result!.healsByHeroId!['tank-1'];
assert(tankHeal === 500, `tank should get 25% of 2000 max HP (got ${tankHeal})`);

console.log('test-group-heal-per-ally: OK', { tankHeal });
