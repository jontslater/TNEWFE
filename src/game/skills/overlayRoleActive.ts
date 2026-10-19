import { getClassCategory } from './classRegistry';
import { resolveActiveAbility } from './activeAbilities';
import { tryFireRoleActiveAbility, type MinimalCombatHero, type MinimalEnemy } from './roleActiveCombat';

export interface AbilityAnnouncementPayload {
  abilityName: string;
  heroName: string;
  category: 'tank' | 'healer' | 'dps';
}

export interface OverlayRoleActiveOutcome {
  heroes: MinimalCombatHero[];
  enemies: MinimalEnemy[];
  announcements: AbilityAnnouncementPayload[];
}

export function processOverlayRoleActiveCharges<H extends MinimalCombatHero, E extends MinimalEnemy>(
  heroes: H[],
  enemies: E[],
  now: number
): { heroes: H[]; enemies: E[]; announcements: AbilityAnnouncementPayload[] } {
  const announcements: AbilityAnnouncementPayload[] = [];
  let nextHeroes = [...heroes];
  let nextEnemies = [...enemies];

  nextHeroes.forEach((hero, idx) => {
    if (hero.isDead || hero.hp <= 0) return;
    const result = tryFireRoleActiveAbility(hero, nextHeroes, nextEnemies, now);
    if (!result) return;

    const ability = resolveActiveAbility(hero.role);
    const heroName = hero.name || hero.username || hero.role;
    announcements.push({
      abilityName: result.abilityName,
      heroName,
      category: ability.category,
    });

    let updated: H = {
      ...hero,
      cooldowns: { ...hero.cooldowns, ...result.casterCooldowns },
    };

    if (result.selfDamageReductionUntil) {
      updated = {
        ...updated,
        activeBuffs: {
          ...updated.activeBuffs,
          roleActiveShield: {
            active: true,
            expiresAt: result.selfDamageReductionUntil,
            drFraction: result.selfDamageReductionFraction ?? 0.5,
          },
        },
        tauntExpiry: result.tauntUntil,
      };
    }

    if (result.healsByHeroId) {
      nextHeroes = nextHeroes.map((h) => {
        const amt = result.healsByHeroId![h.id];
        if (!amt) return h;
        const maxHp = h.maxHp || 1;
        return { ...h, hp: Math.min(maxHp, h.hp + amt) };
      });
    }

    if (result.burstDamage) {
      nextEnemies = nextEnemies.map((e) => {
        if (e.id !== result.burstDamage!.targetId) return e;
        return { ...e, hp: Math.max(0, e.hp - result.burstDamage!.damage) };
      });
    }

    if (result.chainLightning) {
      const targets = nextEnemies.filter((e) => e.hp > 0).slice(0, 3);
      const atk = hero.attack || 0;
      targets.forEach((t, i) => {
        const mult = i === 0 ? 1 : i === 1 ? 0.8 : 0.6;
        const dmg = Math.floor(atk * mult);
        const ei = nextEnemies.findIndex((e) => e.id === t.id);
        if (ei >= 0) {
          nextEnemies[ei] = { ...nextEnemies[ei], hp: Math.max(0, nextEnemies[ei].hp - dmg) };
        }
      });
    }

    if (result.whirlwind) {
      const atk = hero.attack || 0;
      const dmg = Math.floor(atk * 0.7);
      nextEnemies = nextEnemies.map((e) =>
        e.hp > 0 ? { ...e, hp: Math.max(0, e.hp - dmg) } : e
      );
    }

    nextHeroes[idx] = updated;
  });

  return { heroes: nextHeroes, enemies: nextEnemies, announcements };
}

export function getHeroRoleCategory(className: string): 'tank' | 'healer' | 'dps' {
  return getClassCategory(className);
}
