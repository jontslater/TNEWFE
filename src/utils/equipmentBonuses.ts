/**
 * Equipment Bonuses System
 * Calculates and applies bonuses from equipment (secondary stats, proc effects, etc.)
 */

import { Equipment } from '../types/Hero';

export interface EquipmentBonuses {
  hpRegen: number; // HP per second
  damageReduction: number; // Percentage (0.0 to 1.0)
  critChance: number; // Percentage (0.0 to 1.0)
  healingPower: number; // Percentage bonus
  spellDamage: number; // Percentage bonus
  meleeDamage: number; // Percentage bonus
}

/**
 * Calculate total equipment bonuses from all equipped items
 * @param equipment - Hero's equipment
 * @returns Combined bonuses from all equipment
 */
export function calculateEquipmentBonuses(equipment: Equipment | undefined): EquipmentBonuses {
  const bonuses: EquipmentBonuses = {
    hpRegen: 0,
    damageReduction: 0,
    critChance: 0,
    healingPower: 0,
    spellDamage: 0,
    meleeDamage: 0
  };
  
  if (!equipment) return bonuses;
  
  const EQUIPMENT_SLOTS = ['weapon', 'armor', 'accessory', 'shield', 'helm', 'cloak', 'gloves', 'ring1', 'ring2', 'boots'];
  
  EQUIPMENT_SLOTS.forEach(slot => {
    const item = equipment[slot];
    if (!item?.secondaryStats) return;
    
    const stats = item.secondaryStats;
    
    // Accumulate all secondary stats
    if (stats.hpRegen) bonuses.hpRegen += stats.hpRegen;
    if (stats.damageReduction) bonuses.damageReduction += stats.damageReduction;
    if (stats.critChance) bonuses.critChance += stats.critChance;
    if (stats.healingPower) bonuses.healingPower += stats.healingPower;
    if (stats.spellDamage) bonuses.spellDamage += stats.spellDamage;
    if (stats.meleeDamage) bonuses.meleeDamage += stats.meleeDamage;
  });
  
  // Cap damage reduction at 75% (can't reduce damage below 25%)
  bonuses.damageReduction = Math.min(bonuses.damageReduction, 0.75);
  
  // Convert crit chance from percentage to decimal (e.g., 15% = 0.15)
  bonuses.critChance = bonuses.critChance / 100;
  
  return bonuses;
}

/**
 * Get total HP regeneration from equipment
 * @param equipment - Hero's equipment
 * @returns Total HP per second regeneration
 */
export function getEquipmentHpRegen(equipment: Equipment | undefined): number {
  if (!equipment) return 0;
  
  let totalHpRegen = 0;
  const EQUIPMENT_SLOTS = ['weapon', 'armor', 'accessory', 'shield', 'helm', 'cloak', 'gloves', 'ring1', 'ring2', 'boots'];
  
  EQUIPMENT_SLOTS.forEach(slot => {
    const item = equipment[slot];
    if (item?.secondaryStats?.hpRegen) {
      totalHpRegen += item.secondaryStats.hpRegen;
    }
  });
  
  return totalHpRegen;
}













