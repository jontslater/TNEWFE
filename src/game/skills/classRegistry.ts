import type { SkillCategory } from './types';

/** Class keys → combat category (matches backend `skills.js`). */
export const CLASS_CATEGORY: Record<string, SkillCategory> = {
  guardian: 'tank',
  paladin: 'tank',
  warden: 'tank',
  bloodknight: 'tank',
  vanguard: 'tank',
  brewmaster: 'tank',
  cleric: 'healer',
  atoner: 'healer',
  druid: 'healer',
  lightbringer: 'healer',
  shaman: 'healer',
  mistweaver: 'healer',
  chronomancer: 'healer',
  bard: 'healer',
  berserker: 'dps',
  crusader: 'dps',
  assassin: 'dps',
  reaper: 'dps',
  bladedancer: 'dps',
  monk: 'dps',
  stormwarrior: 'dps',
  hunter: 'dps',
  mage: 'dps',
  warlock: 'dps',
  ranger: 'dps',
  shadowpriest: 'dps',
  mooncaller: 'dps',
  stormcaller: 'dps',
  dragonsorcerer: 'dps',
};

export function getClassCategory(className: string): SkillCategory {
  return CLASS_CATEGORY[className.toLowerCase()] ?? 'dps';
}
