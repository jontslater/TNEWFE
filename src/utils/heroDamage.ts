/**
 * Hero Damage Calculation
 * Calculates base damage for heroes based on their class type
 * Casters use Intellect/Wisdom/Spell Power, Melee uses Attack/Strength
 */

import { calculateEquipmentBonuses } from './equipmentBonuses';
import { calculateSetBonuses } from './setBonuses';

// Hero interface for damage calculation (matches TestHero structure)
interface HeroForDamage {
  role: string;
  attack?: number;
  intellect?: number;
  wisdom?: number;
  strength?: number;
  equipment?: any;
}

// Caster DPS roles (use spell power)
const CASTER_DPS_ROLES = ['mage', 'warlock', 'necromancer', 'ranger', 'shadowpriest', 'mooncaller', 'stormcaller', 'frostmage', 'firemage', 'dragonsorcerer'];

/**
 * Calculate base damage for a hero
 * Casters use Intellect/Wisdom for spell power, Melee uses Attack/Strength
 */
export function calculateHeroBaseDamage(hero: HeroForDamage): number {
  const roleLower = hero.role.toLowerCase();
  const isCaster = CASTER_DPS_ROLES.includes(roleLower);
  
  // Get equipment bonuses
  const equipmentBonuses = calculateEquipmentBonuses(hero.equipment);
  
  // Get set bonuses
  const setBonuses = calculateSetBonuses(hero.equipment, hero.role);
  
  if (isCaster) {
    // Casters use Intellect + Wisdom for spell power
    // Base spell power = Intellect * 1.0 + Wisdom * 0.5
    const totalIntellect = (hero.intellect || 0) + (setBonuses.intellect || 0);
    const totalWisdom = (hero.wisdom || 0) + (setBonuses.wisdom || 0);
    
    // Calculate spell power (Intellect is primary, Wisdom is secondary)
    let spellPower = totalIntellect * 1.0 + totalWisdom * 0.5;
    
    // Add base attack as a fallback (casters still have some attack from gear)
    spellPower += (hero.attack || 0) * 0.3; // 30% of attack contributes to spell power
    
    // Apply spell damage multiplier from equipment and sets
    const spellDamageMultiplier = 1 + (equipmentBonuses.spellDamage || 0) + (setBonuses.spellDamage || 0);
    spellPower *= spellDamageMultiplier;
    
    // Minimum spell power (fallback)
    return Math.max(50, Math.floor(spellPower));
  } else {
    // Melee DPS and Tanks use Attack + Strength
    const totalAttack = (hero.attack || 0) + (setBonuses.attack || 0);
    const totalStrength = (hero.strength || 0) + (setBonuses.strength || 0);
    
    // Calculate physical damage (Attack is primary, Strength adds bonus)
    let physicalDamage = totalAttack + (totalStrength * 0.5); // Strength adds 50% of its value as damage
    
    // Apply melee damage multiplier from equipment and sets
    const meleeDamageMultiplier = 1 + (equipmentBonuses.meleeDamage || 0) + (setBonuses.meleeDamage || 0);
    physicalDamage *= meleeDamageMultiplier;
    
    // Minimum damage (fallback)
    return Math.max(50, Math.floor(physicalDamage));
  }
}
