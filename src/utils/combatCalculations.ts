/**
 * Combat Calculation Utilities
 * Simple damage and healing calculations for incremental feature development
 * This is separate from the full combat engine to avoid conflicts
 */

import { calculateDebuffDamageModifiers } from './debuffSystem';
import { calculateBuffModifiers } from './buffSystem';
import { calculateEquipmentBonuses } from './equipmentBonuses';

/**
 * Calculate damage after defense mitigation
 * Formula: damage / (1 + defense / 250)
 * Minimum 25% of original damage always gets through
 * 
 * @param damage - Base damage amount
 * @param defense - Target's defense stat
 * @param attackerDebuffs - Optional attacker debuffs (for damage reduction)
 * @param defenderDebuffs - Optional defender debuffs (for damage increase)
 * @param attackerBuffs - Optional attacker buffs (for attack increase)
 * @param defenderBuffs - Optional defender buffs (for defense increase, damage reduction)
 * @returns Actual damage dealt (after defense, with minimum guarantee)
 */
export function calculateDamage(
  damage: number, 
  defense: number = 0,
  attackerDebuffs?: Record<string, any>,
  defenderDebuffs?: Record<string, any>,
  attackerBuffs?: Record<string, any>,
  defenderBuffs?: Record<string, any>,
  attackerEquipment?: any,
  defenderEquipment?: any
): number {
  // Apply buff modifiers to base damage and defense
  let finalDamage = damage;
  let finalDefense = defense;
  
  // Apply equipment bonuses for attacker
  if (attackerEquipment) {
    const equipmentBonuses = calculateEquipmentBonuses(attackerEquipment);
    // Equipment bonuses like spellDamage, meleeDamage are applied at the ability level
    // Crit chance is handled in calculateDamageWithCrit
  }
  
  // Apply equipment bonuses for defender
  if (defenderEquipment) {
    const equipmentBonuses = calculateEquipmentBonuses(defenderEquipment);
    // Apply equipment-based damage reduction
    finalDamage *= (1 - equipmentBonuses.damageReduction);
  }
  
  if (attackerBuffs) {
    const buffMods = calculateBuffModifiers({ activeBuffs: attackerBuffs });
    finalDamage += buffMods.attackModifier; // Add flat attack increase
  }
  
  if (defenderBuffs) {
    const buffMods = calculateBuffModifiers({ activeBuffs: defenderBuffs });
    finalDefense += buffMods.defenseModifier; // Add flat defense increase
    // Apply damage reduction from buffs (e.g., Iron Skin)
    finalDamage *= (1 - buffMods.damageReduction);
  }
  
  // Apply debuff modifiers
  if (attackerDebuffs || defenderDebuffs) {
    const modifiers = calculateDebuffDamageModifiers(
      { activeDebuffs: attackerDebuffs },
      { activeDebuffs: defenderDebuffs }
    );
    finalDamage *= modifiers.damageMultiplier * modifiers.damageTakenMultiplier;
  }
  
  // Percentage-based damage reduction with minimum damage guarantee
  // Formula: damage / (1 + defense / 250)
  // This means: 250 defense = 50% reduction, 500 defense = 66% reduction
  // Minimum 25% of original damage always gets through
  const damageAfterDefense = finalDamage / (1 + finalDefense / 250);
  const minDamage = Math.max(1, finalDamage * 0.25); // At least 25% of damage
  const actualDamage = Math.max(minDamage, Math.floor(damageAfterDefense));
  
  return actualDamage;
}

/**
 * Calculate damage with critical hit chance
 * Checks for crit, applies 2.0x multiplier if crit occurs
 * 
 * @param baseDamage - Base damage amount (before crit)
 * @param critChance - Critical hit chance (0.0 to 1.0, e.g., 0.15 = 15%)
 * @param defense - Target's defense stat
 * @param attackerDebuffs - Optional attacker debuffs (for damage reduction)
 * @param defenderDebuffs - Optional defender debuffs (for damage increase)
 * @param attackerBuffs - Optional attacker buffs (for attack increase, crit chance increase)
 * @param defenderBuffs - Optional defender buffs (for defense increase, damage reduction)
 * @returns Object with actualDamage and isCrit flag
 */
export function calculateDamageWithCrit(
  baseDamage: number,
  critChance: number = 0,
  defense: number = 0,
  attackerDebuffs?: Record<string, any>,
  defenderDebuffs?: Record<string, any>,
  attackerBuffs?: Record<string, any>,
  defenderBuffs?: Record<string, any>,
  attackerEquipment?: any,
  defenderEquipment?: any
): { actualDamage: number; isCrit: boolean } {
  // Apply equipment crit chance bonus
  let finalCritChance = critChance;
  if (attackerEquipment) {
    const equipmentBonuses = calculateEquipmentBonuses(attackerEquipment);
    finalCritChance += equipmentBonuses.critChance;
  }
  
  // Apply buff modifiers to crit chance
  if (attackerBuffs) {
    const buffMods = calculateBuffModifiers({ activeBuffs: attackerBuffs });
    finalCritChance += buffMods.critChanceModifier;
    // Check for Critical Strike buff (guaranteed crit or increased chance)
    const critStrikeBuff = Object.values(attackerBuffs).find((b: any) => b.name === 'Critical Strike');
    if (critStrikeBuff) {
      // Critical Strike buff guarantees crit or significantly increases chance
      finalCritChance = Math.max(finalCritChance, 1.0); // Guaranteed crit
    }
  }
  
  // Check for critical hit
  let isCrit = false;
  let finalDamage = baseDamage;
  
  if (finalCritChance > 0 && Math.random() < finalCritChance) {
    isCrit = true;
    finalDamage *= 2.0; // 200% damage on crit
  }
  
  // Apply defense mitigation with buff/debuff modifiers and equipment
  const actualDamage = calculateDamage(finalDamage, defense, attackerDebuffs, defenderDebuffs, attackerBuffs, defenderBuffs, attackerEquipment, defenderEquipment);
  
  return { actualDamage, isCrit };
}

/**
 * Calculate healing amount
 * Applies buff modifiers (e.g., Divine Grace)
 * 
 * @param baseHealing - Base healing amount
 * @param healingBonus - Optional healing bonus multiplier (default: 1.0)
 * @param healerBuffs - Optional healer buffs (for healing increase)
 * @returns Actual healing amount
 */
export function calculateHealing(
  baseHealing: number, 
  healingBonus: number = 1.0,
  healerBuffs?: Record<string, any>
): number {
  let finalHealing = baseHealing * healingBonus;
  
  // Apply buff modifiers (e.g., Divine Grace)
  if (healerBuffs) {
    const buffMods = calculateBuffModifiers({ activeBuffs: healerBuffs });
    finalHealing *= buffMods.healingMultiplier;
  }
  
  return Math.floor(finalHealing);
}
