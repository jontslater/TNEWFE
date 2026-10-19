import { critDamageMultiplier, computeSkillModifiers } from './computeSkillModifiers';
import { resolveActiveAbility, type ActiveAbilityKind } from './activeAbilities';
import { beginRoleActiveCooldown, resolveDurationForHero } from './roleActiveCharge';

export interface MinimalCombatHero {
  id: string;
  name?: string;
  username?: string;
  role: string;
  hp: number;
  maxHp: number;
  attack?: number;
  isDead?: boolean;
  cooldowns?: Record<string, number | undefined>;
  activeBuffs?: Record<string, unknown>;
  tauntExpiry?: number;
  critChance?: number;
  skills?: Record<string, { points?: number }> | null;
}

export interface MinimalEnemy {
  id: string;
  hp: number;
  maxHp?: number;
}

export interface RoleActiveFireResult {
  abilityName: string;
  kind: ActiveAbilityKind;
  /** Updated cooldown fields for the caster */
  casterCooldowns: Record<string, number>;
  /** Heal amounts per hero id */
  healsByHeroId?: Record<string, number>;
  /** Single-target burst damage */
  burstDamage?: { targetId: string; damage: number; isCrit: boolean };
  /** AoE flags for overlay action queue */
  chainLightning?: boolean;
  whirlwind?: boolean;
  /** Tank self DR buff until timestamp */
  selfDamageReductionUntil?: number;
  selfDamageReductionFraction?: number;
  tauntUntil?: number;
}

function displayName(hero: MinimalCombatHero): string {
  return hero.name || hero.username || hero.role;
}

export function tryFireRoleActiveAbility(
  hero: MinimalCombatHero,
  allies: MinimalCombatHero[],
  enemies: MinimalEnemy[],
  now: number
): RoleActiveFireResult | null {
  if (hero.isDead || hero.hp <= 0) return null;

  const ability = resolveActiveAbility(hero.role);
  const mods = computeSkillModifiers(hero);
  const durationMs = resolveDurationForHero(hero.role, mods.cooldownReduction);
  const readyAt = hero.cooldowns?.roleActiveReadyAt ?? 0;
  if (readyAt > 0 && now < readyAt) return null;

  const nextCooldowns = beginRoleActiveCooldown(hero.cooldowns, durationMs, now);
  const base: RoleActiveFireResult = {
    abilityName: ability.name,
    kind: ability.kind,
    casterCooldowns: {
      roleActiveReadyAt: nextCooldowns.roleActiveReadyAt!,
      roleActiveDurationMs: nextCooldowns.roleActiveDurationMs!,
    },
  };

  switch (ability.kind) {
    case 'shield_wall': {
      const dr = ability.damageReductionFraction ?? 0.5;
      const dur = ability.damageReductionDurationMs ?? 6_000;
      return {
        ...base,
        selfDamageReductionUntil: now + dur,
        selfDamageReductionFraction: dr,
        tauntUntil: now + 5_000,
      };
    }
    case 'group_heal': {
      const frac = ability.healFractionOfCasterMaxHp ?? 0.25;
      const mult = 1 + mods.healingMultiplier / 100;
      const perAlly = Math.floor(hero.maxHp * frac * mult);
      const heals: Record<string, number> = {};
      allies.forEach((h) => {
        if (!h || h.isDead || h.hp <= 0) return;
        heals[h.id] = perAlly;
      });
      return { ...base, healsByHeroId: heals };
    }
    case 'burst_strike': {
      const target = enemies.find((e) => e.hp > 0);
      if (!target) return base;
      const mult = ability.attackDamageMultiplier ?? 3;
      let damage = Math.floor((hero.attack || 0) * mult * (1 + mods.damageMultiplier / 100));
      const baseCrit = 0.05 + (hero.critChance || 0);
      const skillCrit = mods.critChance / 100;
      const critChance = Math.min(0.35, baseCrit + skillCrit);
      const isCrit = Math.random() < critChance;
      if (isCrit) {
        damage = Math.floor(damage * critDamageMultiplier(mods.critDamage));
      }
      return {
        ...base,
        burstDamage: { targetId: target.id, damage, isCrit },
      };
    }
    case 'chain_lightning':
      return { ...base, chainLightning: true };
    case 'whirlwind':
      return { ...base, whirlwind: true };
    default:
      return base;
  }
}

export function applyRoleActiveHeal(
  hero: MinimalCombatHero,
  amount: number
): MinimalCombatHero {
  const maxHp = hero.maxHp || 1;
  const newHp = Math.min(maxHp, hero.hp + amount);
  return { ...hero, hp: newHp };
}
