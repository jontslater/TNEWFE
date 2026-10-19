import { getClassCategory } from './classRegistry';
import { resolveActiveAbility } from './activeAbilities';
import { computeSkillModifiers } from './computeSkillModifiers';
import {
  tryFireRoleActiveAbility,
  initializeRoleActiveCooldownIfNeeded,
  type MinimalCombatHero,
  type MinimalEnemy,
  type RoleActiveFireResult,
} from './roleActiveCombat';

export interface AbilityAnnouncementPayload {
  abilityName: string;
  heroName: string;
  category: 'tank' | 'healer' | 'dps';
}

export interface OverlayRoleActiveHooks {
  onBurstDamage?: (
    caster: MinimalCombatHero,
    targetId: string,
    damage: number,
    isCrit: boolean
  ) => void;
  onChainLightning?: (caster: MinimalCombatHero, enemyIds: string[], damages: number[]) => void;
  onWhirlwind?: (caster: MinimalCombatHero, damages: Record<string, number>) => void;
  onGroupHeal?: (caster: MinimalCombatHero, healsByHeroId: Record<string, number>) => void;
}

export interface OverlayRoleActiveOutcome {
  heroes: MinimalCombatHero[];
  enemies: MinimalEnemy[];
  announcements: AbilityAnnouncementPayload[];
  changed: boolean;
}

export function processOverlayRoleActiveCharges<H extends MinimalCombatHero, E extends MinimalEnemy>(
  heroes: H[],
  enemies: E[],
  now: number,
  hooks?: OverlayRoleActiveHooks
): OverlayRoleActiveOutcome {
  const announcements: AbilityAnnouncementPayload[] = [];
  let nextHeroes = heroes;
  let nextEnemies = enemies;
  let changed = false;

  for (let idx = 0; idx < heroes.length; idx++) {
    const hero = nextHeroes[idx];
    if (hero.isDead || hero.hp <= 0) continue;

    const initCd = initializeRoleActiveCooldownIfNeeded(hero, now);
    if (initCd) {
      nextHeroes = [...nextHeroes];
      nextHeroes[idx] = {
        ...nextHeroes[idx],
        cooldowns: { ...nextHeroes[idx].cooldowns, ...initCd },
      };
      changed = true;
      continue;
    }

    const result = tryFireRoleActiveAbility(hero, nextHeroes, nextEnemies, now);
    if (!result || !result.abilityName) continue;

    const ability = resolveActiveAbility(hero.role);
    const heroName = hero.name || hero.username || hero.role;
    announcements.push({
      abilityName: result.abilityName,
      heroName,
      category: ability.role,
    });

    nextHeroes = [...nextHeroes];
    let updated: H = {
      ...nextHeroes[idx],
      cooldowns: { ...nextHeroes[idx].cooldowns, ...result.casterCooldowns },
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
      const casterMods = computeSkillModifiers(hero);
      const heals: Record<string, number> = {};
      Object.entries(result.healsByHeroId).forEach(([id, amt]) => {
        let healAmt = amt;
        if (
          casterMods.divineGraceProcPercent > 0 &&
          Math.random() < casterMods.divineGraceProcPercent / 100
        ) {
          healAmt *= 2;
        }
        heals[id] = healAmt;
      });
      if (hooks?.onGroupHeal) {
        hooks.onGroupHeal(hero, heals);
      } else {
        nextHeroes = nextHeroes.map((h) => {
          const amt = heals[h.id];
          if (!amt) return h;
          const maxHp = h.maxHp || 1;
          return { ...h, hp: Math.min(maxHp, h.hp + amt) };
        });
      }
    }

    if (result.burstDamage) {
      if (hooks?.onBurstDamage) {
        hooks.onBurstDamage(
          hero,
          result.burstDamage.targetId,
          result.burstDamage.damage,
          result.burstDamage.isCrit
        );
      } else {
        nextEnemies = [...nextEnemies];
        const ei = nextEnemies.findIndex((e) => e.id === result.burstDamage!.targetId);
        if (ei >= 0) {
          nextEnemies[ei] = {
            ...nextEnemies[ei],
            hp: Math.max(0, nextEnemies[ei].hp - result.burstDamage!.damage),
          };
        }
      }
    }

    if (result.chainLightning) {
      const targets = nextEnemies.filter((e) => e.hp > 0).slice(0, 3);
      const atk = hero.attack || 0;
      const ids: string[] = [];
      const damages: number[] = [];
      targets.forEach((t, i) => {
        const mult = i === 0 ? 1 : i === 1 ? 0.8 : 0.6;
        ids.push(t.id);
        damages.push(Math.floor(atk * mult));
      });
      if (hooks?.onChainLightning) {
        hooks.onChainLightning(hero, ids, damages);
      } else {
        nextEnemies = [...nextEnemies];
        ids.forEach((id, i) => {
          const ei = nextEnemies.findIndex((e) => e.id === id);
          if (ei >= 0) {
            nextEnemies[ei] = {
              ...nextEnemies[ei],
              hp: Math.max(0, nextEnemies[ei].hp - damages[i]),
            };
          }
        });
      }
    }

    if (result.whirlwind) {
      const dmg = Math.floor((hero.attack || 0) * 0.7);
      if (hooks?.onWhirlwind) {
        const map: Record<string, number> = {};
        nextEnemies.forEach((e) => {
          if (e.hp > 0) map[e.id] = dmg;
        });
        hooks.onWhirlwind(hero, map);
      } else {
        nextEnemies = [...nextEnemies];
        nextEnemies = nextEnemies.map((e) =>
          e.hp > 0 ? { ...e, hp: Math.max(0, e.hp - dmg) } : e
        );
      }
    }

    nextHeroes[idx] = updated;
    changed = true;
  }

  if (!changed && announcements.length === 0) {
    return { heroes, enemies, announcements, changed: false };
  }

  return { heroes: nextHeroes, enemies: nextEnemies, announcements, changed: true };
}

export function getHeroRoleCategory(className: string): 'tank' | 'healer' | 'dps' {
  return getClassCategory(className);
}
