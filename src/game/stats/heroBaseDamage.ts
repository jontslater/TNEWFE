/**
 * Hero Damage Calculation
 * Uses shared hero stats (gear, sets, gems, skills).
 */

import { computeHeroStats, type HeroStatInput } from './computeHeroStats';

const CASTER_DPS_ROLES = [
  'mage',
  'warlock',
  'necromancer',
  'ranger',
  'shadowpriest',
  'mooncaller',
  'stormcaller',
  'frostmage',
  'firemage',
  'dragonsorcerer',
];

export function calculateHeroBaseDamage(hero: HeroStatInput): number {
  const stats = computeHeroStats(hero);
  const roleLower = hero.role.toLowerCase();
  const isCaster = CASTER_DPS_ROLES.includes(roleLower);

  if (isCaster) {
    let spellPower = stats.intellect * 1.0 + stats.wisdom * 0.5;
    spellPower += stats.attack * 0.3;
    spellPower *= 1 + stats.spellDamage;
    return Math.max(50, Math.floor(spellPower));
  }

  let physicalDamage = stats.attack + stats.strength * 0.5;
  physicalDamage *= 1 + stats.meleeDamage;
  return Math.max(50, Math.floor(physicalDamage));
}
