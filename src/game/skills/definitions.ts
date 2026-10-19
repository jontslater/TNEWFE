import {
  getSkillDefinitions,
  type SkillDefinitionRecord,
} from './skillDefinitionsLoader';
import { getClassCategory } from './classRegistry';

const SKILL_ID_RE = /^(.+)_skill_(\d+)$/;

export function parseSkillId(skillId: string): { className: string; slot: number } | null {
  const match = skillId.match(SKILL_ID_RE);
  if (!match) return null;
  const slot = parseInt(match[2], 10);
  if (slot < 1 || slot > 10) return null;
  return { className: match[1].toLowerCase(), slot };
}

export function getCanonicalSkillById(skillId: string): SkillDefinitionRecord | undefined {
  return getSkillDefinitions().skills.find((s) => s.id === skillId);
}

/** @deprecated alias for combat code */
export function getSkillTemplateForId(skillId: string): SkillDefinitionRecord | null {
  return getCanonicalSkillById(skillId) ?? null;
}

export function getSkillsForClass(className: string): SkillDefinitionRecord[] {
  const cls = className.toLowerCase();
  return getSkillDefinitions().skills.filter((s) => s.class === cls);
}

export function formatSkillEffectTotal(skill: SkillDefinitionRecord, points: number): string {
  const total = skill.baseValuePerRank * points;
  if (skill.effect === 'stat_boost' && skill.stat) {
    return `+${total}% ${skill.stat}`;
  }
  if (skill.effect === 'hp_percent_max') {
    return `+${total}% max HP`;
  }
  if (skill.effect === 'cooldown_red') {
    return `−${total}% cooldown`;
  }
  if (skill.effect === 'double_heal_proc') {
    return `${total}% double-heal proc`;
  }
  return `+${total}%`;
}

export function formatSkillNextPoint(skill: SkillDefinitionRecord): string {
  return formatSkillEffectTotal(skill, 1).replace(/^\+/, '+');
}

export { getClassCategory };
