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

const mergedStale = mergeHeroesAfterRoleActive(prev, outcome);
assert(mergedStale[0].stats?.totalDamage === 50, 'without live snapshot, keep prev stats (no double)');

const live = [
  {
    id: 'a',
    hp: 90,
    stats: { totalDamage: 80, totalHealing: 12, damageBlocked: 0 },
    cooldowns: { roleActiveReadyAt: 999 },
  },
];
const mergedLive = mergeHeroesAfterRoleActive(prev, outcome, live);
assert(mergedLive[0].stats?.totalDamage === 80, 'live snapshot credits ability damage once');
assert(mergedLive[0].stats?.totalHealing === 12, 'live snapshot credits ability heals once');
assert(mergedLive[0].stats?.totalDamage !== 200, 'outcome inflated stats are ignored');

console.log('test-role-active-stats-merge: OK');
