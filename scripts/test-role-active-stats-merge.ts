import { mergeHeroesAfterRoleActive } from '../src/overlay/roleActiveHeroMerge';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const prev = [
  {
    id: 'a',
    hp: 100,
    stats: { totalDamage: 50, totalHealing: 0, damageBlocked: 0 },
    cooldowns: {},
  },
];
const outcome = [
  {
    id: 'a',
    hp: 90,
    stats: { totalDamage: 200, totalHealing: 0, damageBlocked: 0 },
    cooldowns: { roleActiveReadyAt: 999 },
  },
];

const merged = mergeHeroesAfterRoleActive(prev, outcome);
assert(merged[0].hp === 90, 'hp from outcome');
assert(merged[0].stats?.totalDamage === 50, 'stats not doubled from outcome');
assert(merged[0].cooldowns?.roleActiveReadyAt === 999, 'cooldowns merged');

console.log('test-role-active-stats-merge: OK');
