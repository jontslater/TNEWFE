/**
 * Pure utility functions for combat calculations
 * Stateless helper functions extracted from fullCombatEngine.ts
 */

import { Hero, Enemy, ROLE_CONFIG, EQUIPMENT_SLOTS, TANK_EQUIPMENT_SLOTS } from './fullCombatEngine';
import { calculateSetBonuses } from './setBonuses';

/**
 * Get viewer bonuses based on viewer count
 */
export function getViewerBonuses(viewerCount: number = 0) {
  return {
    damageMultiplier: 1 + (viewerCount * 0.01),  // 1% per viewer
    healingMultiplier: 1 + (viewerCount * 0.01), // 1% per viewer
    defenseMultiplier: 1 + (viewerCount * 0.005), // 0.5% per viewer
  };
}

/**
 * Calculate skill bonuses for a hero
 */
export function calculateSkillBonuses(hero: Hero) {
  const skills = hero.skills || {};
  const bonuses = {
    attack: 0,
    defense: 0,
    hp: 0,
    damageMultiplier: 0,
    healingMultiplier: 0,
    defenseMultiplier: 0,
    critChance: 0,
    critDamage: 0,
    cooldownReduction: 0,
    lifesteal: 0,
    speedBoost: 0
  };
  
  // Skill templates (simplified - matches backend structure)
  const skillTemplates: Record<string, { effect: string; stat?: string; baseValue: number }> = {
    // Tank skills
    'guardian_skill_0': { effect: 'stat_boost', stat: 'hp', baseValue: 5 },
    'guardian_skill_1': { effect: 'defense_mult', baseValue: 3 },
    'guardian_skill_2': { effect: 'stat_boost', stat: 'defense', baseValue: 4 },
    'guardian_skill_3': { effect: 'stat_boost', stat: 'attack', baseValue: 2 },
    'guardian_skill_4': { effect: 'defense_mult', baseValue: 5 },
    'guardian_skill_5': { effect: 'cooldown_red', baseValue: 10 },
    'guardian_skill_6': { effect: 'stat_boost', stat: 'defense', baseValue: 6 },
    'guardian_skill_7': { effect: 'defense_mult', baseValue: 4 },
    'guardian_skill_8': { effect: 'stat_boost', stat: 'hp', baseValue: 8 },
    'guardian_skill_9': { effect: 'defense_mult', baseValue: 6 },
    // Healer skills
    'cleric_skill_0': { effect: 'healing_mult', baseValue: 5 },
    'cleric_skill_1': { effect: 'cooldown_red', baseValue: 8 },
    'cleric_skill_2': { effect: 'healing_mult', baseValue: 4 },
    'cleric_skill_3': { effect: 'speed_boost', baseValue: 10 },
    'cleric_skill_4': { effect: 'healing_mult', baseValue: 6 },
    'cleric_skill_5': { effect: 'cooldown_red', baseValue: 12 },
    'cleric_skill_6': { effect: 'healing_mult', baseValue: 5 },
    'cleric_skill_7': { effect: 'cooldown_red', baseValue: 15 },
    'cleric_skill_8': { effect: 'stat_boost', stat: 'defense', baseValue: 3 },
    'cleric_skill_9': { effect: 'healing_mult', baseValue: 8 },
    // DPS skills
    'berserker_skill_0': { effect: 'damage_mult', baseValue: 5 },
    'berserker_skill_1': { effect: 'crit_chance', baseValue: 3 },
    'berserker_skill_2': { effect: 'crit_damage', baseValue: 10 },
    'berserker_skill_3': { effect: 'stat_boost', stat: 'attack', baseValue: 4 },
    'berserker_skill_4': { effect: 'speed_boost', baseValue: 8 },
    'berserker_skill_5': { effect: 'damage_mult', baseValue: 6 },
    'berserker_skill_6': { effect: 'crit_chance', baseValue: 5 },
    'berserker_skill_7': { effect: 'damage_mult', baseValue: 7 },
    'berserker_skill_8': { effect: 'lifesteal', baseValue: 5 },
    'berserker_skill_9': { effect: 'damage_mult', baseValue: 10 }
  };
  
  // Apply all skills (generic pattern matching for all classes)
  Object.entries(skills).forEach(([skillId, skillData]: [string, any]) => {
    if (!skillData || !skillData.points) return;
    
    // Try to find skill template by exact match or pattern
    let skillDef = skillTemplates[skillId];
    
    // If not found, try pattern matching (class_skill_N)
    if (!skillDef && skillId.includes('_skill_')) {
      const parts = skillId.split('_skill_');
      const className = parts[0];
      const skillIndex = parseInt(parts[1]);
      
      // Use generic templates based on class category
      const category = ROLE_CONFIG[className]?.category || 'dps';
      if (category === 'tank') {
        const tankSkills = [
          { effect: 'stat_boost', stat: 'hp', baseValue: 5 },
          { effect: 'defense_mult', baseValue: 3 },
          { effect: 'stat_boost', stat: 'defense', baseValue: 4 },
          { effect: 'stat_boost', stat: 'attack', baseValue: 2 },
          { effect: 'defense_mult', baseValue: 5 },
          { effect: 'cooldown_red', baseValue: 10 },
          { effect: 'stat_boost', stat: 'defense', baseValue: 6 },
          { effect: 'defense_mult', baseValue: 4 },
          { effect: 'stat_boost', stat: 'hp', baseValue: 8 },
          { effect: 'defense_mult', baseValue: 6 }
        ];
        skillDef = tankSkills[skillIndex] || null;
      } else if (category === 'healer') {
        const healerSkills = [
          { effect: 'healing_mult', baseValue: 5 },
          { effect: 'cooldown_red', baseValue: 8 },
          { effect: 'healing_mult', baseValue: 4 },
          { effect: 'speed_boost', baseValue: 10 },
          { effect: 'healing_mult', baseValue: 6 },
          { effect: 'cooldown_red', baseValue: 12 },
          { effect: 'healing_mult', baseValue: 5 },
          { effect: 'cooldown_red', baseValue: 15 },
          { effect: 'stat_boost', stat: 'defense', baseValue: 3 },
          { effect: 'healing_mult', baseValue: 8 }
        ];
        skillDef = healerSkills[skillIndex] || null;
      } else {
        const dpsSkills = [
          { effect: 'damage_mult', baseValue: 5 },
          { effect: 'crit_chance', baseValue: 3 },
          { effect: 'crit_damage', baseValue: 10 },
          { effect: 'stat_boost', stat: 'attack', baseValue: 4 },
          { effect: 'speed_boost', baseValue: 8 },
          { effect: 'damage_mult', baseValue: 6 },
          { effect: 'crit_chance', baseValue: 5 },
          { effect: 'damage_mult', baseValue: 7 },
          { effect: 'lifesteal', baseValue: 5 },
          { effect: 'damage_mult', baseValue: 10 }
        ];
        skillDef = dpsSkills[skillIndex] || null;
      }
    }
    
    if (!skillDef) return;
    
    const value = skillDef.baseValue * skillData.points;
    
    switch (skillDef.effect) {
      case 'stat_boost':
        if (skillDef.stat === 'attack') bonuses.attack += value;
        else if (skillDef.stat === 'defense') bonuses.defense += value;
        else if (skillDef.stat === 'hp') bonuses.hp += value;
        break;
      case 'damage_mult':
        bonuses.damageMultiplier += value;
        break;
      case 'healing_mult':
        bonuses.healingMultiplier += value;
        break;
      case 'defense_mult':
        bonuses.defenseMultiplier += value;
        break;
      case 'crit_chance':
        bonuses.critChance += value;
        break;
      case 'crit_damage':
        bonuses.critDamage += value;
        break;
      case 'cooldown_red':
        bonuses.cooldownReduction += value;
        break;
      case 'lifesteal':
        bonuses.lifesteal += value;
        break;
      case 'speed_boost':
        bonuses.speedBoost += value;
        break;
    }
  });
  
  return bonuses;
}

/**
 * Get character stats including equipment bonuses
 */
export function getCharacterStats(hero: Hero) {
  const config = ROLE_CONFIG[hero.role];
  if (!config) {
    return {
      attack: hero.attack || 0,
      defense: hero.defense || 0,
      maxHp: hero.maxHp || 0,
      intellect: hero.intellect || 0,
      strength: hero.strength || 0,
      dexterity: hero.dexterity || 0,
      wisdom: hero.wisdom || 0,
      stamina: hero.stamina || 0,
      // Secondary stats should only come from equipment, not stored on hero
      healingPower: 0,
      spellDamage: 0,
      meleeDamage: 0,
      hpRegen: 0,
      damageReduction: 0,
      critChance: 0
    };
  }

  // Calculate skill bonuses first
  const skillBonuses = calculateSkillBonuses(hero);

  let stats: any = {
    attack: config.baseAttack + ((hero.level - 1) * config.attackPerLevel),
    defense: config.baseDefense + ((hero.level - 1) * config.defensePerLevel),
    maxHp: config.baseHp + ((hero.level - 1) * config.hpPerLevel),
    intellect: hero.intellect || 0,
    strength: hero.strength || 0,
    dexterity: hero.dexterity || 0,
    wisdom: hero.wisdom || 0,
    stamina: hero.stamina || 0,
    // Secondary stats should only come from equipment, not stored on hero
    healingPower: 0,
    spellDamage: 0,
    meleeDamage: 0,
    hpRegen: 0,
    damageReduction: 0,
    critChance: hero.critChance || 0
  };

  // Add equipment bonuses if available
  if (hero.equipment) {
    const category = config.category;
    const slots = category === 'tank' ? TANK_EQUIPMENT_SLOTS : EQUIPMENT_SLOTS;

    for (const slot of slots) {
      if (hero.equipment[slot]) {
        const item = hero.equipment[slot];
        stats.attack += item.attack || 0;
        stats.defense += item.defense || 0;
        stats.maxHp += item.hp || 0;
        stats.intellect += item.intellect || 0;
        stats.strength += item.strength || 0;
        stats.dexterity += item.dexterity || 0;
        stats.wisdom += item.wisdom || 0;
        stats.stamina += item.stamina || 0;
        
        if (item.secondaryStats) {
          stats.healingPower += item.secondaryStats.healingPower || 0;
          stats.spellDamage += item.secondaryStats.spellDamage || 0;
          // Melee damage will be filtered for healers after equipment loop
          stats.meleeDamage += item.secondaryStats.meleeDamage || 0;
          stats.hpRegen += item.secondaryStats.hpRegen || 0;
          stats.damageReduction += item.secondaryStats.damageReduction || 0;
          stats.critChance += item.secondaryStats.critChance || 0;
        }
        
      }
    }
  }

  // Apply prestige slot core stat bonuses (cores are attached to slots, not items)
  if (hero.prestigeSlotCores) {
    Object.entries(hero.prestigeSlotCores).forEach(([slot, core]: [string, any]) => {
      if (core && core.statBonus) {
        stats.attack += core.statBonus.attack || 0;
        stats.defense += core.statBonus.defense || 0;
        stats.maxHp += core.statBonus.hp || 0;
      }
    });
  }

  // Apply set bonuses from equipped gear
  const setBonuses = calculateSetBonuses(hero.equipment, hero.role || '');
  stats.attack += setBonuses.attack || 0;
  stats.defense += setBonuses.defense || 0;
  stats.maxHp += setBonuses.hp || 0;
  stats.intellect += setBonuses.intellect || 0;
  stats.strength += setBonuses.strength || 0;
  stats.dexterity += setBonuses.dexterity || 0;
  stats.wisdom += setBonuses.wisdom || 0;
  stats.stamina += setBonuses.stamina || 0;
  stats.healingPower += setBonuses.healingPower || 0;
  stats.spellDamage += setBonuses.spellDamage || 0;
  
  // FILTER: Healers don't use melee damage - convert to spell damage instead
  // This ensures healers benefit from equipment that might have melee damage
  const isHealerRole = ['cleric', 'atoner', 'druid', 'lightbringer', 'shaman', 'mistweaver', 'chronomancer', 'bard'].includes((hero.role || '').toLowerCase());
  if (isHealerRole) {
    // Convert all melee damage to spell damage for healers (they use spell power)
    stats.spellDamage += stats.meleeDamage + (setBonuses.meleeDamage || 0);
    stats.meleeDamage = 0; // Set to 0 for healers
  } else {
    stats.meleeDamage += setBonuses.meleeDamage || 0;
  }
  
  stats.hpRegen += setBonuses.hpRegen || 0;
  stats.damageReduction += setBonuses.damageReduction || 0;
  stats.critChance += setBonuses.critChance || 0;

  // Cap total crit chance at 35%
  stats.critChance = Math.min(stats.critChance || 0, 0.35);

  // Apply stamina to HP (1 stamina = 10 HP)
  stats.maxHp += (stats.stamina || 0) * 10;

  // Apply skill stat bonuses (flat values)
  stats.attack += skillBonuses.attack;
  stats.defense += skillBonuses.defense;
  stats.maxHp += skillBonuses.hp;

  // Apply prestige stat boosts (flat values, additive)
  if (hero.prestigeBoosts && hero.prestigeBoosts.statBoost) {
    stats.attack += hero.prestigeBoosts.statBoost.attack || 0;
    stats.defense += hero.prestigeBoosts.statBoost.defense || 0;
    stats.maxHp += hero.prestigeBoosts.statBoost.hp || 0;
  }

  // Store skill bonuses for use in combat
  stats.skillBonuses = skillBonuses;

  return stats;
}

/**
 * Calculate debuff resistance chance
 */
export function getDebuffResistance(target: Hero | Enemy): number {
  // For heroes
  if ((target as Hero).role) {
    const hero = target as Hero;
    // Base resistance from defense (1% per 5 defense)
    const defenseResist = Math.min(0.3, (hero.defense || 0) / 500);
    // Level resistance (1% per 2 levels)
    const levelResist = Math.min(0.25, (hero.level || 0) / 200);
    // Gear score resistance (1% per 50 gear score)
    let gearScore = 0;
    if (hero.equipment) {
      Object.values(hero.equipment).forEach((item: any) => {
        if (item) {
          gearScore += (item.attack || 0) + (item.defense || 0) + (item.hp || 0);
        }
      });
    }
    const gearResist = Math.min(0.2, gearScore / 5000);
    
    return Math.min(0.7, defenseResist + levelResist + gearResist); // Max 70% resistance
  } 
  // For enemies
  else {
    const enemy = target as Enemy;
    // Enemies have base 10% resistance, bosses have 25%
    return enemy.isBoss ? 0.25 : 0.10;
  }
}
