import {
  COOLDOWN_REDUCTION_CAP,
  CRIT_CHANCE_CAP,
  DAMAGE_REDUCTION_CAP,
  DIVINE_GRACE_PROC_PER_RANK,
  MAX_SKILL_RANK,
} from './caps';
import { getSkillTemplateForId, parseSkillId } from './definitions';
import { getClassCategory } from './classRegistry';
import type {
  ComputedSkillModifiers,
  HeroSkillAllocation,
  LegacySkillBonuses,
} from './types';

export function clampSkillRank(points: unknown): number {
  const n = typeof points === 'number' ? points : parseInt(String(points ?? 0), 10);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(MAX_SKILL_RANK, n);
}

export function applyCooldownReduction(baseMs: number, cooldownReductionPercent: number): number {
  const cdr = Math.min(COOLDOWN_REDUCTION_CAP, Math.max(0, cooldownReductionPercent));
  return Math.max(0, Math.floor(baseMs * (1 - cdr / 100)));
}

export function critDamageMultiplier(critDamagePercent: number): number {
  return 2 + Math.max(0, critDamagePercent) / 100;
}

export function computeSkillModifiers(
  hero: {
    role?: string;
    skills?: Record<string, HeroSkillAllocation> | null;
  },
  _defs?: unknown
): ComputedSkillModifiers {
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
    const rank = clampSkillRank(data?.points);
    if (rank <= 0) return;

    const template = getSkillTemplateForId(skillId);
    if (!template) return;

    const parsed = parseSkillId(skillId);
    if (parsed && role && parsed.className !== role) {
      return;
    }

    const value = template.baseValue * rank;

    switch (template.effect) {
      case 'stat_boost':
        if (template.stat === 'attack') raw.statAttackPercent += value;
        else if (template.stat === 'defense') raw.statDefensePercent += value;
        else if (template.stat === 'hp') raw.statHpPercent += value;
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
      default:
        break;
    }

    if (template.slot === 3 && template.name === 'Divine Grace') {
      raw.divineGraceProcPercent += rank * DIVINE_GRACE_PROC_PER_RANK;
    }
  });

  raw.critChance = Math.min(CRIT_CHANCE_CAP, raw.critChance);
  raw.cooldownReduction = Math.min(COOLDOWN_REDUCTION_CAP, raw.cooldownReduction);
  raw.defenseMultiplier = Math.min(DAMAGE_REDUCTION_CAP, raw.defenseMultiplier);
  raw.divineGraceProcPercent = Math.min(30, raw.divineGraceProcPercent);

  return raw;
}

/** Map to the legacy combat bonus object (percents in the same units as before). */
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
