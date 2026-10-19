import { getClassCategory } from './classRegistry';
import type { SkillCategory } from './types';

export type ActiveAbilityKind =
  | 'shield_wall'
  | 'group_heal'
  | 'burst_strike'
  | 'chain_lightning'
  | 'whirlwind';

export interface ActiveAbilityDefinition {
  id: string;
  name: string;
  kind: ActiveAbilityKind;
  cooldownMs: number;
  /** Unified charge-bar storage key on hero.cooldowns */
  chargeKey: 'roleActive';
  category: SkillCategory;
  /** Shield Wall: DR fraction on self (0.5 = 50%) */
  damageReductionFraction?: number;
  damageReductionDurationMs?: number;
  /** Group Heal: fraction of healer max HP per ally */
  healFractionOfCasterMaxHp?: number;
  /** Burst Strike: attack multiplier (3 = 300%) */
  attackDamageMultiplier?: number;
}

const ROLE_ACTIVE: Record<SkillCategory, ActiveAbilityDefinition> = {
  tank: {
    id: 'role_tank_shield_wall',
    name: 'Shield Wall',
    kind: 'shield_wall',
    cooldownMs: 45_000,
    chargeKey: 'roleActive',
    category: 'tank',
    damageReductionFraction: 0.5,
    damageReductionDurationMs: 6_000,
  },
  healer: {
    id: 'role_healer_group_heal',
    name: 'Group Heal',
    kind: 'group_heal',
    cooldownMs: 30_000,
    chargeKey: 'roleActive',
    category: 'healer',
    healFractionOfCasterMaxHp: 0.25,
  },
  dps: {
    id: 'role_dps_burst_strike',
    name: 'Burst Strike',
    kind: 'burst_strike',
    cooldownMs: 20_000,
    chargeKey: 'roleActive',
    category: 'dps',
    attackDamageMultiplier: 3,
  },
};

/** Class-specific overrides (same charge bar; different ability behavior / timing). */
const CLASS_ACTIVE_OVERRIDES: Partial<Record<string, ActiveAbilityDefinition>> = {
  guardian: ROLE_ACTIVE.tank,
  cleric: ROLE_ACTIVE.healer,
  shaman: {
    id: 'class_shaman_chain_lightning',
    name: 'Chain Lightning',
    kind: 'chain_lightning',
    cooldownMs: 15_000,
    chargeKey: 'roleActive',
    category: 'healer',
  },
  berserker: {
    id: 'class_berserker_whirlwind',
    name: 'Whirlwind',
    kind: 'whirlwind',
    cooldownMs: 20_000,
    chargeKey: 'roleActive',
    category: 'dps',
  },
};

/** Every hero resolves an active ability (role default or class override). */
export function resolveActiveAbility(className: string): ActiveAbilityDefinition {
  const key = className.toLowerCase();
  const override = CLASS_ACTIVE_OVERRIDES[key];
  if (override) return override;
  const category = getClassCategory(key);
  return ROLE_ACTIVE[category];
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
