/**
 * Smoke test: one enemy hit through modular enemyAttacks + unified fullCombatEngine.applyEnemyDamageToHero path.
 */
import { computeHeroBalanceStats, computeDamageTaken } from '../src/combat/balance';
import { computeSkillModifiers, toLegacySkillBonuses } from '../src/game/skills/computeSkillModifiers';
import { applyEnemyDamageToHero } from '../src/utils/combat/enemyAttacks';
import { processRoleActivePhase } from '../src/game/skills/processRoleActivePhase';
import type { Hero, Enemy } from '../src/utils/combat/types';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const gearedHero: Hero = {
  id: 'h1',
  username: 'Tanky',
  role: 'guardian',
  level: 20,
  hp: 800,
  maxHp: 800,
  attack: 50,
  defense: 120,
  isDead: false,
  equipment: {
    weapon: {
      id: 'w1',
      name: 'Sword',
      slot: 'weapon',
      rarity: 'rare',
      attack: 40,
      defense: 10,
      hp: 50,
      itemLevel: 20,
    },
    armor: {
      id: 'a1',
      name: 'Plate',
      slot: 'armor',
      rarity: 'epic',
      attack: 5,
      defense: 80,
      hp: 120,
      itemLevel: 20,
      upgradeLevel: 2,
    },
  },
  skills: { guardian_skill_2: { points: 5 } },
};

const bal = computeHeroBalanceStats(gearedHero);
assert(bal.attack > 50, 'geared hero attack includes item stats');
assert(bal.armor > 120, 'geared hero armor includes item stats');

const mods = computeSkillModifiers(gearedHero);
const skillBonuses = toLegacySkillBonuses(mods);
const enemy: Enemy = {
  id: 'e1',
  name: 'Goblin',
  hp: 500,
  maxHp: 500,
  attack: 60,
  level: 20,
  isDead: false,
};

const dmg = computeDamageTaken(60, bal.armor, 20, skillBonuses.defenseMultiplier);
assert(dmg > 0 && dmg < 60, 'combined DR reduces incoming damage');

let applied = 0;
const target = { username: gearedHero.username!, hero: gearedHero };
const callbacks = {
  log: () => {},
  triggerAnimation: () => {},
  triggerCombatText: () => {},
  updateEnemyHealthBar: () => {},
  updateHeroUI: () => {},
};
applyEnemyDamageToHero(
  target,
  enemy,
  60,
  bal.armor,
  1,
  {
    ironSkinActive: false,
    lastStandActive: false,
    shieldWallActive: false,
    isCrit: false,
    isBloodlust: false,
    now: Date.now(),
  },
  [gearedHero],
  { damageMultiplier: 1, healingMultiplier: 1, defenseMultiplier: 1, difficultyModifier: 1 },
  callbacks,
  () => skillBonuses,
  () => ({ died: false, actualDamage: 0 }),
  () => 'goblin',
  () => 500
);
applied = gearedHero.hp;
assert(gearedHero.hp < 800, 'modular enemyAttacks applies damage without throwing');

const healer: Hero = {
  ...gearedHero,
  id: 'h2',
  username: 'Heals',
  role: 'cleric',
  hp: 100,
  maxHp: 500,
  cooldowns: { roleActiveReadyAt: 0 },
};
const allies = [gearedHero, { ...healer, hp: 120, maxHp: 500 }];
processRoleActivePhase(allies, [enemy], Date.now(), {
  log: () => {},
  triggerHealAnimation: () => {},
  triggerCombatText: () => {},
});

console.log('test-combat-tick: OK', { balAtk: bal.attack, balArmor: bal.armor, hpAfter: applied });
