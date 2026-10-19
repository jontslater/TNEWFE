import { getBalanceCaps, getBundledSkillDefinitions } from './skillDefinitionsLoader';

const bundled = getBundledSkillDefinitions();

export const MAX_SKILL_RANK = bundled.skills[0]?.maxPoints ?? 5;

export function getSkillCaps() {
  return getBalanceCaps();
}

export const COOLDOWN_REDUCTION_CAP = bundled.caps.cooldownReductionPercent;
export const CRIT_CHANCE_CAP = bundled.caps.critChancePercent;
export const DAMAGE_REDUCTION_CAP = bundled.caps.damageReductionPercent;
