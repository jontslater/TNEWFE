import { getSkillDefinitions } from './skillDefinitionsLoader';
import { getClassCategory } from './classRegistry';
import type { SkillCategory } from './types';

export type BackendActiveAbility = {
  id: string;
  name: string;
  role: SkillCategory;
  cooldownMs: number;
  effect: Record<string, unknown>;
};

export type ActiveAbilityKind =
  | 'shield_wall'
  | 'group_heal'
  | 'burst_strike'
  | 'chain_lightning'
  | 'whirlwind';

const KIND_BY_ID: Record<string, ActiveAbilityKind> = {
  shieldWall: 'shield_wall',
  groupHeal: 'group_heal',
  burstStrike: 'burst_strike',
  chainLightning: 'chain_lightning',
  whirlwind: 'whirlwind',
};

export function abilityKindFromId(id: string): ActiveAbilityKind {
  return KIND_BY_ID[id] ?? 'burst_strike';
}

/** Every hero resolves an active ability (class override or role default). */
export function resolveActiveAbility(className: string): BackendActiveAbility {
  const key = className.toLowerCase();
  const defs = getSkillDefinitions();
  const resolved =
    defs.activeAbilities.resolvedByClass[key as keyof typeof defs.activeAbilities.resolvedByClass];
  if (resolved) return resolved as BackendActiveAbility;
  const category = getClassCategory(key);
  return defs.activeAbilities.byRole[category] as BackendActiveAbility;
}

export function roleCategoryColor(category: SkillCategory): string {
  switch (category) {
    case 'tank':
      return '#3b82f6';
    case 'healer':
      return '#34d399';
    default:
      return '#f87171';
  }
}
