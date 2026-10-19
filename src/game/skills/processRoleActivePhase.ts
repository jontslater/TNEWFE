import type { Hero, Enemy, CombatCallbacks } from '../../utils/combat/types';
import { resolveActiveAbility } from './activeAbilities';
import { tryFireRoleActiveAbility } from './roleActiveCombat';

/**
 * Browser-source unified combat: fire role-active abilities when charge is ready.
 */
export function processRoleActivePhase(
  heroes: Hero[],
  enemies: Enemy[],
  now: number,
  callbacks: CombatCallbacks
): void {
  heroes.forEach((hero) => {
    if (!hero || hero.isDead || hero.hp <= 0) return;

    const result = tryFireRoleActiveAbility(
      {
        id: hero.id,
        username: hero.username,
        role: hero.role,
        hp: hero.hp,
        maxHp: hero.maxHp,
        attack: hero.attack,
        isDead: hero.isDead,
        cooldowns: hero.cooldowns as unknown as Record<string, number | undefined>,
        critChance: hero.critChance,
        skills: hero.skills,
      },
      heroes.map((h) => ({
        id: h.id,
        username: h.username,
        role: h.role,
        hp: h.hp,
        maxHp: h.maxHp,
        attack: h.attack,
        isDead: h.isDead,
        cooldowns: h.cooldowns as unknown as Record<string, number | undefined>,
        skills: h.skills,
      })),
      enemies,
      now
    );
    if (!result) return;

    hero.cooldowns = { ...hero.cooldowns, ...result.casterCooldowns };
    const ability = resolveActiveAbility(hero.role);
    callbacks.log('combat', `⚡ ${hero.username} uses ${result.abilityName}!`);

    if (result.selfDamageReductionUntil) {
      if (!hero.activeBuffs) hero.activeBuffs = {};
      (hero.activeBuffs as Record<string, unknown>).roleActiveShield = {
        active: true,
        expiresAt: result.selfDamageReductionUntil,
        drFraction: result.selfDamageReductionFraction ?? 0.5,
      };
      (hero as { tauntExpiry?: number }).tauntExpiry = result.tauntUntil;
    }

    if (result.healsByHeroId) {
      heroes.forEach((h) => {
        const amt = result.healsByHeroId![h.id];
        if (!amt || h.isDead || h.hp <= 0) return;
        h.hp = Math.min(h.maxHp, h.hp + amt);
        callbacks.triggerHealAnimation?.(h.username);
      });
    }

    if (result.burstDamage) {
      const enemy = enemies.find((e) => e.id === result.burstDamage!.targetId);
      if (enemy) {
        enemy.hp = Math.max(0, enemy.hp - result.burstDamage!.damage);
        callbacks.log(
          'damage',
          `💥 ${hero.username} ${result.abilityName} hits for ${result.burstDamage!.damage}${
            result.burstDamage!.isCrit ? ' CRIT' : ''
          }`
        );
      }
    }

    if (result.chainLightning) {
      const targets = enemies.filter((e) => e.hp > 0).slice(0, 3);
      const atk = hero.attack || 0;
      targets.forEach((t, i) => {
        const mult = i === 0 ? 1 : i === 1 ? 0.8 : 0.6;
        t.hp = Math.max(0, t.hp - Math.floor(atk * mult));
      });
    }

    if (result.whirlwind) {
      const dmg = Math.floor((hero.attack || 0) * 0.7);
      enemies.forEach((e) => {
        if (e.hp > 0) e.hp = Math.max(0, e.hp - dmg);
      });
    }
  });
}
