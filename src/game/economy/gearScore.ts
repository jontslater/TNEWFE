/**
 * Gear scoring — combat scaling vs UI item score vs queue rarity score.
 */

import type { HeroStatInput } from '../stats/types';
import { QUEUE_RARITY_GEAR_VALUES } from './lootTables';

const COMBAT_EQUIPMENT_SLOTS = [
  'weapon',
  'armor',
  'accessory',
  'shield',
  'helm',
  'cloak',
  'gloves',
  'ring1',
  'ring2',
  'boots',
] as const;

/** Stat-weighted score for enemy difficulty / debuff resist (matches enemyCombatScaling). */
export function computeCombatGearScore(hero: HeroStatInput): number {
  if (!hero.equipment) return 0;
  let gearScore = 0;
  for (const slot of COMBAT_EQUIPMENT_SLOTS) {
    const item = hero.equipment[slot] as Record<string, unknown> | undefined;
    if (!item) continue;
    gearScore += (Number(item.attack) || 0) + (Number(item.defense) || 0) + (Number(item.hp) || 0);
    gearScore += (Number(item.intellect) || 0) * 3;
    gearScore += (Number(item.strength) || 0) * 3;
    gearScore += (Number(item.dexterity) || 0) * 1.5;
    gearScore += (Number(item.wisdom) || 0) * 1.5;
    gearScore += Number(item.stamina) || 0;
    const secondary = item.secondaryStats as Record<string, number> | undefined;
    if (secondary) {
      gearScore += (secondary.healingPower || 0) * 5;
      gearScore += (secondary.spellDamage || 0) * 5;
      gearScore += (secondary.meleeDamage || 0) * 5;
      gearScore += (secondary.hpRegen || 0) * 10;
      gearScore += (secondary.damageReduction || 0) * 10;
      gearScore += (secondary.critChance || 0) * 15;
    }
    if (item.specialModifier || item.rarity === 'legendary') {
      gearScore += 200;
    }
  }
  return gearScore;
}

export function averageCombatGearScore(heroes: HeroStatInput[]): number {
  if (heroes.length === 0) return 0;
  return heroes.reduce((sum, h) => sum + computeCombatGearScore(h), 0) / heroes.length;
}

/** Backend queueService calculateGearScore — rarity slots only. */
export function computeQueueGearScore(hero: { equipment?: Record<string, { rarity?: string }> }): number {
  if (!hero.equipment) return 0;
  let total = 0;
  for (const item of Object.values(hero.equipment)) {
    if (item?.rarity) {
      total += QUEUE_RARITY_GEAR_VALUES[item.rarity] ?? 0;
    }
  }
  return total;
}

/** Debuff application resist for heroes (0–0.7). */
export function computeHeroDebuffResistance(hero: HeroStatInput & { defense?: number; level?: number }): number {
  const defenseResist = Math.min(0.3, (hero.defense || 0) / 500);
  const levelResist = Math.min(0.25, (hero.level || 0) / 200);
  const gearResist = Math.min(0.2, computeCombatGearScore(hero) / 5000);
  return Math.min(0.7, defenseResist + levelResist + gearResist);
}
