import type { Hero, Enemy, CombatCallbacks } from '../../utils/combat/types';
import {
  processOverlayRoleActiveCharges,
  type OverlayRoleActiveHooks,
} from './overlayRoleActive';

/**
 * Browser-source unified combat: fire role-active abilities when charge is ready.
 * Uses the same SCT/animation hooks as the overlay strip when callbacks are provided.
 */
export function processRoleActivePhase(
  heroes: Hero[],
  enemies: Enemy[],
  now: number,
  callbacks: CombatCallbacks
): void {
  const hooks: OverlayRoleActiveHooks = {
    onBurstDamage: (caster, targetId, damage, isCrit) => {
      callbacks.log(
        'damage',
        `💥 ${caster.username || caster.name} hits for ${damage}${isCrit ? ' CRIT' : ''}`
      );
      const enemy = enemies.find((e) => e.id === targetId);
      if (enemy) {
        enemy.hp = Math.max(0, enemy.hp - damage);
        callbacks.triggerAnimation?.(targetId, 'hurt', false);
        callbacks.triggerCombatText?.(targetId, damage, isCrit ? 'crit' : 'damage', false);
        if (enemy.hp <= 0 && !enemy.isDead) {
          enemy.isDead = true;
          callbacks.triggerAnimation?.(targetId, 'death', false);
          callbacks.trackDeath?.();
          callbacks.log('kill', `${caster.name || caster.username} defeated ${enemy.name || 'Enemy'}`);
          callbacks.log('combat', `☠️ ${enemy.name || 'Enemy'} defeated by ${caster.name || caster.username}`);
        }
      }
      const casterHero = heroes.find((h) => h.id === caster.id);
      if (casterHero?.stats) {
        casterHero.stats.totalDamage = (casterHero.stats.totalDamage || 0) + damage;
      }
    },
    onChainLightning: (caster, ids, damages) => {
      ids.forEach((id, i) => hooks.onBurstDamage?.(caster, id, damages[i], false));
    },
    onWhirlwind: (caster, damages) => {
      Object.entries(damages).forEach(([id, dmg]) =>
        hooks.onBurstDamage?.(caster, id, dmg, false)
      );
    },
    onGroupHeal: (caster, healsByHeroId) => {
      heroes.forEach((h) => {
        const amt = healsByHeroId[h.id];
        if (!amt || h.isDead || h.hp <= 0) return;
        h.hp = Math.min(h.maxHp, h.hp + amt);
        callbacks.triggerHealAnimation?.(h.username);
        callbacks.triggerCombatText?.(h.id, amt, 'heal', true);
        if (h.stats) {
          h.stats.totalHealing = (h.stats.totalHealing || 0) + amt;
        }
      });
      callbacks.log('heal', `✨ ${caster.username || caster.name} Group Heal!`);
    },
  };

  const outcome = processOverlayRoleActiveCharges(
    heroes as Parameters<typeof processOverlayRoleActiveCharges>[0],
    enemies as Parameters<typeof processOverlayRoleActiveCharges>[1],
    now,
    hooks
  );
  outcome.announcements.forEach((a) => {
    callbacks.log('combat', `⚡ ${a.heroName} uses ${a.abilityName}!`);
  });

  if (!outcome.changed) return;

  outcome.heroes.forEach((minimal) => {
    const h = heroes.find((hero) => hero.id === minimal.id);
    if (!h) return;
    h.cooldowns = minimal.cooldowns as unknown as Hero['cooldowns'];
    h.activeBuffs = minimal.activeBuffs as Hero['activeBuffs'];
    if ((minimal as { tauntExpiry?: number }).tauntExpiry) {
      (h as { tauntExpiry?: number }).tauntExpiry = (minimal as { tauntExpiry?: number }).tauntExpiry;
    }
  });

  outcome.enemies.forEach((e, i) => {
    if (enemies[i]?.id === e.id) {
      enemies[i].hp = e.hp;
    }
  });
}
