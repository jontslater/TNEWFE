import { CATEGORY_SKILL_TEMPLATES } from './categoryTemplates';
import { getClassCategory } from './classRegistry';
import type { SkillDefinition, SkillTemplate } from './types';

const SKILL_ID_RE = /^(.+)_skill_(\d+)$/;

export function parseSkillId(skillId: string): { className: string; slot: number } | null {
  const match = skillId.match(SKILL_ID_RE);
  if (!match) return null;
  const slot = parseInt(match[2], 10);
  if (slot < 1 || slot > 10) return null;
  return { className: match[1].toLowerCase(), slot };
}

export function getSkillTemplateForId(skillId: string): SkillTemplate | null {
  const parsed = parseSkillId(skillId);
  if (!parsed) return null;
  const category = getClassCategory(parsed.className);
  const templates = CATEGORY_SKILL_TEMPLATES[category];
  return templates[parsed.slot - 1] ?? null;
}

export function buildSkillDefinition(className: string, template: SkillTemplate): SkillDefinition {
  const cls = className.toLowerCase();
  return {
    ...template,
    id: `${cls}_skill_${template.slot}`,
    class: cls,
    category: getClassCategory(cls),
  };
}

export function getSkillsForClass(className: string): SkillDefinition[] {
  const cls = className.toLowerCase();
  const category = getClassCategory(cls);
  return CATEGORY_SKILL_TEMPLATES[category].map((t) => buildSkillDefinition(cls, t));
}

/** All class keys that have skill trees */
const ALL_CLASSES = [
  'guardian', 'paladin', 'warden', 'bloodknight', 'vanguard', 'brewmaster',
  'cleric', 'atoner', 'druid', 'lightbringer', 'shaman', 'mistweaver', 'chronomancer', 'bard',
  'berserker', 'crusader', 'assassin', 'reaper', 'bladedancer', 'monk', 'stormwarrior',
  'hunter', 'mage', 'warlock', 'ranger', 'shadowpriest', 'mooncaller', 'stormcaller', 'dragonsorcerer',
];

export function getCanonicalSkillCatalog(): SkillDefinition[] {
  return ALL_CLASSES.flatMap((cls) => getSkillsForClass(cls));
}

export function formatSkillEffectTotal(template: SkillTemplate, points: number): string {
  const total = template.baseValue * points;
  if (template.effect === 'stat_boost') {
    return `+${total}% ${template.stat ?? 'stat'}`;
  }
  if (template.effect === 'cooldown_red') {
    return `−${total}% cooldown`;
  }
  return `+${total}%`;
}
