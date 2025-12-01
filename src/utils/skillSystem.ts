/**
 * Skill System
 * Handles skill trees, skill points, and skill bonuses
 * Matches Electron app implementation
 */

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  effect: 'stat_boost' | 'damage_mult' | 'healing_mult' | 'defense_mult' | 'crit_chance' | 'crit_damage' | 'cooldown_red' | 'lifesteal' | 'speed_boost';
  stat?: 'attack' | 'defense' | 'hp'; // For stat_boost effect
  baseValue: number; // Base value per skill point
  maxPoints: number; // Maximum points that can be allocated (usually 5)
}

export interface SkillData {
  points: number; // Number of points allocated to this skill
}

export interface SkillBonuses {
  attack: number;
  defense: number;
  hp: number;
  damageMultiplier: number; // Percentage bonus
  healingMultiplier: number; // Percentage bonus
  defenseMultiplier: number; // Percentage bonus
  critChance: number; // Percentage bonus
  critDamage: number; // Percentage bonus
  cooldownReduction: number; // Percentage reduction
  lifesteal: number; // Percentage
  speedBoost: number; // Percentage
}

/**
 * Get skill tree for a class
 * Each class has 10 skills (skill_0 through skill_9)
 * Skills are categorized by class type (tank, healer, dps)
 */
export function getSkillTree(className: string, category: 'tank' | 'healer' | 'dps'): SkillDefinition[] {
  const skillNames = [
    'Fortitude', 'Shield Mastery', 'Defensive Stance', 'Combat Training', 'Iron Will',
    'Tactical Expertise', 'Guardian\'s Resolve', 'Protective Aura', 'Vitality', 'Unbreakable'
  ];
  
  if (category === 'tank') {
    return [
      { id: `${className}_skill_0`, name: skillNames[0], description: 'Increases HP', effect: 'stat_boost', stat: 'hp', baseValue: 5, maxPoints: 5 },
      { id: `${className}_skill_1`, name: skillNames[1], description: 'Increases Defense %', effect: 'defense_mult', baseValue: 3, maxPoints: 5 },
      { id: `${className}_skill_2`, name: skillNames[2], description: 'Increases Defense', effect: 'stat_boost', stat: 'defense', baseValue: 4, maxPoints: 5 },
      { id: `${className}_skill_3`, name: skillNames[3], description: 'Increases Attack', effect: 'stat_boost', stat: 'attack', baseValue: 2, maxPoints: 5 },
      { id: `${className}_skill_4`, name: skillNames[4], description: 'Increases Defense %', effect: 'defense_mult', baseValue: 5, maxPoints: 5 },
      { id: `${className}_skill_5`, name: skillNames[5], description: 'Reduces Cooldowns', effect: 'cooldown_red', baseValue: 10, maxPoints: 5 },
      { id: `${className}_skill_6`, name: skillNames[6], description: 'Increases Defense', effect: 'stat_boost', stat: 'defense', baseValue: 6, maxPoints: 5 },
      { id: `${className}_skill_7`, name: skillNames[7], description: 'Increases Defense %', effect: 'defense_mult', baseValue: 4, maxPoints: 5 },
      { id: `${className}_skill_8`, name: skillNames[8], description: 'Increases HP', effect: 'stat_boost', stat: 'hp', baseValue: 8, maxPoints: 5 },
      { id: `${className}_skill_9`, name: skillNames[9], description: 'Increases Defense %', effect: 'defense_mult', baseValue: 6, maxPoints: 5 }
    ];
  } else if (category === 'healer') {
    return [
      { id: `${className}_skill_0`, name: 'Healing Power', description: 'Increases Healing %', effect: 'healing_mult', baseValue: 5, maxPoints: 5 },
      { id: `${className}_skill_1`, name: 'Swift Recovery', description: 'Reduces Cooldowns', effect: 'cooldown_red', baseValue: 8, maxPoints: 5 },
      { id: `${className}_skill_2`, name: 'Enhanced Healing', description: 'Increases Healing %', effect: 'healing_mult', baseValue: 4, maxPoints: 5 },
      { id: `${className}_skill_3`, name: 'Quick Cast', description: 'Increases Speed', effect: 'speed_boost', baseValue: 10, maxPoints: 5 },
      { id: `${className}_skill_4`, name: 'Divine Touch', description: 'Increases Healing %', effect: 'healing_mult', baseValue: 6, maxPoints: 5 },
      { id: `${className}_skill_5`, name: 'Rapid Response', description: 'Reduces Cooldowns', effect: 'cooldown_red', baseValue: 12, maxPoints: 5 },
      { id: `${className}_skill_6`, name: 'Master Healer', description: 'Increases Healing %', effect: 'healing_mult', baseValue: 5, maxPoints: 5 },
      { id: `${className}_skill_7`, name: 'Efficient Casting', description: 'Reduces Cooldowns', effect: 'cooldown_red', baseValue: 15, maxPoints: 5 },
      { id: `${className}_skill_8`, name: 'Protective Aura', description: 'Increases Defense', effect: 'stat_boost', stat: 'defense', baseValue: 3, maxPoints: 5 },
      { id: `${className}_skill_9`, name: 'Divine Grace', description: 'Increases Healing %', effect: 'healing_mult', baseValue: 8, maxPoints: 5 }
    ];
  } else {
    // DPS skills
    return [
      { id: `${className}_skill_0`, name: 'Power Strike', description: 'Increases Damage %', effect: 'damage_mult', baseValue: 5, maxPoints: 5 },
      { id: `${className}_skill_1`, name: 'Critical Eye', description: 'Increases Crit Chance', effect: 'crit_chance', baseValue: 3, maxPoints: 5 },
      { id: `${className}_skill_2`, name: 'Lethal Blow', description: 'Increases Crit Damage', effect: 'crit_damage', baseValue: 10, maxPoints: 5 },
      { id: `${className}_skill_3`, name: 'Combat Mastery', description: 'Increases Attack', effect: 'stat_boost', stat: 'attack', baseValue: 4, maxPoints: 5 },
      { id: `${className}_skill_4`, name: 'Swift Strikes', description: 'Increases Speed', effect: 'speed_boost', baseValue: 8, maxPoints: 5 },
      { id: `${className}_skill_5`, name: 'Devastating Blow', description: 'Increases Damage %', effect: 'damage_mult', baseValue: 6, maxPoints: 5 },
      { id: `${className}_skill_6`, name: 'Precision', description: 'Increases Crit Chance', effect: 'crit_chance', baseValue: 5, maxPoints: 5 },
      { id: `${className}_skill_7`, name: 'Brutal Force', description: 'Increases Damage %', effect: 'damage_mult', baseValue: 7, maxPoints: 5 },
      { id: `${className}_skill_8`, name: 'Bloodthirst', description: 'Increases Lifesteal', effect: 'lifesteal', baseValue: 5, maxPoints: 5 },
      { id: `${className}_skill_9`, name: 'Annihilation', description: 'Increases Damage %', effect: 'damage_mult', baseValue: 10, maxPoints: 5 }
    ];
  }
}

/**
 * Calculate skill bonuses from allocated skills
 * @param hero - Hero with skills property
 * @param category - Hero category (tank, healer, dps)
 * @returns Skill bonuses object
 */
export function calculateSkillBonuses(
  hero: { skills?: Record<string, SkillData>; role: string },
  category: 'tank' | 'healer' | 'dps'
): SkillBonuses {
  const skills = hero.skills || {};
  const bonuses: SkillBonuses = {
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
  
  const skillTree = getSkillTree(hero.role, category);
  
  // Apply all allocated skills
  Object.entries(skills).forEach(([skillId, skillData]) => {
    if (!skillData || !skillData.points) return;
    
    // Find skill definition
    const skillDef = skillTree.find(s => s.id === skillId);
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
 * Get total skill points allocated
 */
export function getTotalSkillPoints(skills: Record<string, SkillData> | undefined): number {
  if (!skills) return 0;
  return Object.values(skills).reduce((sum, skill) => sum + (skill.points || 0), 0);
}

/**
 * Get available skill points (earned from level-ups)
 * Typically 1 skill point per level
 */
export function getAvailableSkillPoints(level: number, totalAllocated: number): number {
  // Skill points earned = level (1 per level)
  const totalEarned = level;
  return Math.max(0, totalEarned - totalAllocated);
}








