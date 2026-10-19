import { COOLDOWN_REDUCTION_CAP, CRIT_CHANCE_CAP, DAMAGE_REDUCTION_CAP, MAX_SKILL_RANK } from './caps';
import { critDamageMultiplier as balanceCritMult } from '../../combat/balance';
import { getCanonicalSkillById, parseSkillId } from './definitions';
import type {
  ComputedSkillModifiers,
  HeroSkillAllocation,
  LegacySkillBonuses,
} from './types';

export function clampSkillRank(points: unknown, maxPoints = MAX_SKILL_RANK): number {
  const n = typeof points === 'number' ? points : parseInt(String(points ?? 0), 10);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(maxPoints, n);
}

export function applyCooldownReduction(baseMs: number, cooldownReductionPercent: number): number {
  const cdr = Math.min(COOLDOWN_REDUCTION_CAP, Math.max(0, cooldownReductionPercent));
  return Math.max(0, Math.floor(baseMs * (1 - cdr / 100)));
}

export function critDamageMultiplier(critDamagePercent: number): number {
  return balanceCritMult(critDamagePercent);
}

/** Matches overlay swift proc: 10% base chance, scales with speed_boost skill, capped at 50%. */
export function rollSwiftExtraAttack(speedBoostPercent: number): boolean {
  const swiftChance = Math.min(0.5, 0.1 * (1 + Math.max(0, speedBoostPercent) / 100));
  return Math.random() < swiftChance;
}

export function computeSkillModifiers(hero: {
  role?: string;
  skills?: Record<string, HeroSkillAllocation> | null;
}): ComputedSkillModifiers {
  const skills = hero.skills ?? {};
  const role = hero.role?.toLowerCase() ?? '';

  const raw: ComputedSkillModifiers = {
    damageMultiplier: 0,
    healingMultiplier: 0,
    defenseMultiplier: 0,
    critChance: 0,
    critDamage: 0,
    cooldownReduction: 0,
    lifesteal: 0,
    speedBoost: 0,
    statAttackPercent: 0,
    statDefensePercent: 0,
    statHpPercent: 0,
    divineGraceProcPercent: 0,
  };

  Object.entries(skills).forEach(([skillId, data]) => {
    const def = getCanonicalSkillById(skillId);
    if (!def) return;

    const parsed = parseSkillId(skillId);
    if (parsed && role && parsed.className !== role) return;

    const rank = clampSkillRank(data?.points, def.maxPoints);
    if (rank <= 0) return;

    const value = def.baseValuePerRank * rank;

    switch (def.effect) {
      case 'stat_boost':
        if (def.stat === 'attack') raw.statAttackPercent += value;
        else if (def.stat === 'defense') raw.statDefensePercent += value;
        else if (def.stat === 'hp') raw.statHpPercent += value;
        break;
      case 'hp_percent_max':
        raw.statHpPercent += value;
        break;
      case 'damage_mult':
        raw.damageMultiplier += value;
        break;
      case 'healing_mult':
        raw.healingMultiplier += value;
        break;
      case 'defense_mult':
        raw.defenseMultiplier += value;
        break;
      case 'crit_chance':
        raw.critChance += value;
        break;
      case 'crit_damage':
        raw.critDamage += value;
        break;
      case 'cooldown_red':
        raw.cooldownReduction += value;
        break;
      case 'lifesteal':
        raw.lifesteal += value;
        break;
      case 'speed_boost':
        raw.speedBoost += value;
        break;
      case 'double_heal_proc':
        raw.divineGraceProcPercent += value;
        break;
      default:
        break;
    }
  });

  raw.critChance = Math.min(CRIT_CHANCE_CAP, raw.critChance);
  raw.cooldownReduction = Math.min(COOLDOWN_REDUCTION_CAP, raw.cooldownReduction);
  raw.defenseMultiplier = Math.min(DAMAGE_REDUCTION_CAP, raw.defenseMultiplier);
  raw.divineGraceProcPercent = Math.min(30, raw.divineGraceProcPercent);

  return raw;
}

export function toLegacySkillBonuses(mods: ComputedSkillModifiers): LegacySkillBonuses {
  return {
    attack: 0,
    defense: 0,
    hp: 0,
    damageMultiplier: mods.damageMultiplier,
    healingMultiplier: mods.healingMultiplier,
    defenseMultiplier: mods.defenseMultiplier,
    critChance: mods.critChance,
    critDamage: mods.critDamage,
    cooldownReduction: mods.cooldownReduction,
    lifesteal: mods.lifesteal,
    speedBoost: mods.speedBoost,
    divineGraceProcPercent: mods.divineGraceProcPercent,
  };
}

export function computeLegacySkillBonuses(
  hero: { role?: string; skills?: Record<string, HeroSkillAllocation> | null }
): LegacySkillBonuses {
  return toLegacySkillBonuses(computeSkillModifiers(hero));
}
