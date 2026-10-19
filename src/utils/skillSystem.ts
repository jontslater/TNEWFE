/**
 * @deprecated Use `src/game/skills/` — thin re-exports for test/viewer pages.
 */
import {
  getSkillsForClass,
  formatSkillEffectTotal,
  formatSkillNextPoint,
} from '../game/skills/definitions';
import { getBundledSkillDefinitions } from '../game/skills/skillDefinitionsLoader';
import { computeLegacySkillBonuses } from '../game/skills/computeSkillModifiers';
import { getClassCategory } from '../game/skills/classRegistry';
import type { SkillDefinitionRecord } from '../game/skills/skillDefinitionsLoader';

export type SkillDefinition = SkillDefinitionRecord & {
  baseValue: number;
  effect: SkillDefinitionRecord['effect'];
};

export interface SkillData {
  points: number;
}

export type SkillBonuses = ReturnType<typeof computeLegacySkillBonuses>;

function toLegacyDef(skill: SkillDefinitionRecord): SkillDefinition {
  return {
    ...skill,
    baseValue: skill.baseValuePerRank,
    effect: skill.effect as SkillDefinition['effect'],
  };
}

export function getSkillTree(className: string, category?: 'tank' | 'healer' | 'dps'): SkillDefinition[] {
  const cat = category ?? getClassCategory(className);
  return getSkillsForClass(className).map(toLegacyDef);
}

export function calculateSkillBonuses(
  hero: { skills?: Record<string, SkillData>; role: string },
  _category?: 'tank' | 'healer' | 'dps'
): SkillBonuses {
  return computeLegacySkillBonuses(hero);
}

export function calculateSkillPoints(level: number): number {
  const f = getBundledSkillDefinitions().skillPointFormula;
  if (level < f.firstPointLevel) return 0;
  let count = 0;
  for (let l = f.firstPointLevel; l <= Math.min(level, f.maxLevel); l += f.interval) {
    count++;
  }
  return count;
}

export function getTotalSkillPoints(level: number): number {
  return calculateSkillPoints(level);
}

export function getAvailableSkillPoints(
  level: number,
  skills: Record<string, SkillData>
): number {
  const spent = Object.values(skills || {}).reduce((s, sk) => s + (sk.points || 0), 0);
  return calculateSkillPoints(level) - spent;
}

export { formatSkillEffectTotal, formatSkillNextPoint };
