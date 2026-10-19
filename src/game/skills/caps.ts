import { getBundledSkillDefinitions } from './skillDefinitionsLoader';
import { getBalancePayload } from '../../combat/balanceLoader';

const bundled = getBundledSkillDefinitions();
const balance = getBalancePayload();

export const MAX_SKILL_RANK = bundled.skills[0]?.maxPoints ?? 5;

export function getSkillCaps() {
  return bundled.caps;
}

export const COOLDOWN_REDUCTION_CAP = bundled.caps.cooldownReductionPercent;
/** Total crit chance cap (combat balance plan: 35%). */
export const CRIT_CHANCE_CAP = balance.combat.critChanceCap * 100;
export const DAMAGE_REDUCTION_CAP = balance.combat.damageReductionCap * 100;
