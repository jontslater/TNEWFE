import { critDamageMultiplier, computeSkillModifiers } from './computeSkillModifiers';
import { resolveActiveAbility, abilityKindFromId } from './activeAbilities';
import { beginRoleActiveCooldown, resolveDurationForHero } from './roleActiveCharge';
import type { ActiveAbilityKind } from './activeAbilities';

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
  casterCooldowns: Record<string, number>;
  healsByHeroId?: Record<string, number>;
  burstDamage?: { targetId: string; damage: number; isCrit: boolean };
  chainLightning?: boolean;
  whirlwind?: boolean;
  selfDamageReductionUntil?: number;
  selfDamageReductionFraction?: number;
  tauntUntil?: number;
}

export function tryFireRoleActiveAbility(
  hero: MinimalCombatHero,
  allies: MinimalCombatHero[],
  enemies: MinimalEnemy[],
  now: number
): RoleActiveFireResult | null {
  if (hero.isDead || hero.hp <= 0) return null;

  const ability = resolveActiveAbility(hero.role);
  const kind = abilityKindFromId(ability.id);
  const mods = computeSkillModifiers(hero);
  const durationMs = resolveDurationForHero(hero.role, mods.cooldownReduction);
  const readyAt = hero.cooldowns?.roleActiveReadyAt ?? 0;
  if (readyAt > 0 && now < readyAt) return null;

  const nextCooldowns = beginRoleActiveCooldown(hero.cooldowns, durationMs, now);
  const base: RoleActiveFireResult = {
    abilityName: ability.name,
    kind,
    casterCooldowns: {
      roleActiveReadyAt: nextCooldowns.roleActiveReadyAt!,
      roleActiveDurationMs: nextCooldowns.roleActiveDurationMs!,
    },
  };

  const effect = ability.effect;

  switch (kind) {
    case 'shield_wall': {
      const drPct = Number(effect.damageReductionPercent ?? 50);
      const dur = Number(effect.durationMs ?? 6000);
      return {
        ...base,
        selfDamageReductionUntil: now + dur,
        selfDamageReductionFraction: drPct / 100,
        tauntUntil: effect.taunt ? now + 5000 : undefined,
      };
    }
    case 'group_heal': {
      const frac = Number(effect.healPercentOfCasterMaxHp ?? 25) / 100;
      const mult =
        effect.scalesWithHealingMultiplier !== false
          ? 1 + mods.healingMultiplier / 100
          : 1;
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
      const atkMult = Number(effect.attackDamagePercent ?? 300) / 100;
      let damage = Math.floor((hero.attack || 0) * atkMult * (1 + mods.damageMultiplier / 100));
      const baseCrit = 0.05 + (hero.critChance || 0);
      const skillCrit = mods.critChance / 100;
      const critChance = Math.min(0.75, baseCrit + skillCrit);
      const isCrit = effect.canCrit !== false && Math.random() < critChance;
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
