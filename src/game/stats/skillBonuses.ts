import { ROLE_CONFIG } from '../../utils/fullCombatEngine';
import type { HeroStatInput, SkillStatBonuses } from './types';

/**
 * Skill tree bonuses (matches backend / combatUtils templates).
 */
export function calculateSkillBonuses(hero: HeroStatInput): SkillStatBonuses {
  const skills = hero.skills || {};
  const bonuses: SkillStatBonuses = {
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
    speedBoost: 0,
  };

  const skillTemplates: Record<string, { effect: string; stat?: string; baseValue: number }> = {
    guardian_skill_0: { effect: 'stat_boost', stat: 'hp', baseValue: 5 },
    guardian_skill_1: { effect: 'defense_mult', baseValue: 3 },
    guardian_skill_2: { effect: 'stat_boost', stat: 'defense', baseValue: 4 },
    guardian_skill_3: { effect: 'stat_boost', stat: 'attack', baseValue: 2 },
    guardian_skill_4: { effect: 'defense_mult', baseValue: 5 },
    guardian_skill_5: { effect: 'cooldown_red', baseValue: 10 },
    guardian_skill_6: { effect: 'stat_boost', stat: 'defense', baseValue: 6 },
    guardian_skill_7: { effect: 'defense_mult', baseValue: 4 },
    guardian_skill_8: { effect: 'stat_boost', stat: 'hp', baseValue: 8 },
    guardian_skill_9: { effect: 'defense_mult', baseValue: 6 },
    cleric_skill_0: { effect: 'healing_mult', baseValue: 5 },
    cleric_skill_1: { effect: 'cooldown_red', baseValue: 8 },
    cleric_skill_2: { effect: 'healing_mult', baseValue: 4 },
    cleric_skill_3: { effect: 'speed_boost', baseValue: 10 },
    cleric_skill_4: { effect: 'healing_mult', baseValue: 6 },
    cleric_skill_5: { effect: 'cooldown_red', baseValue: 12 },
    cleric_skill_6: { effect: 'healing_mult', baseValue: 5 },
    cleric_skill_7: { effect: 'cooldown_red', baseValue: 15 },
    cleric_skill_8: { effect: 'stat_boost', stat: 'defense', baseValue: 3 },
    cleric_skill_9: { effect: 'healing_mult', baseValue: 8 },
    berserker_skill_0: { effect: 'damage_mult', baseValue: 5 },
    berserker_skill_1: { effect: 'crit_chance', baseValue: 3 },
    berserker_skill_2: { effect: 'crit_damage', baseValue: 10 },
    berserker_skill_3: { effect: 'stat_boost', stat: 'attack', baseValue: 4 },
    berserker_skill_4: { effect: 'speed_boost', baseValue: 8 },
    berserker_skill_5: { effect: 'damage_mult', baseValue: 6 },
    berserker_skill_6: { effect: 'crit_chance', baseValue: 5 },
    berserker_skill_7: { effect: 'damage_mult', baseValue: 7 },
    berserker_skill_8: { effect: 'lifesteal', baseValue: 5 },
    berserker_skill_9: { effect: 'damage_mult', baseValue: 10 },
  };

  Object.entries(skills).forEach(([skillId, skillData]) => {
    const data = skillData as { points?: number };
    if (!data?.points) return;

    let skillDef = skillTemplates[skillId];

    if (!skillDef && skillId.includes('_skill_')) {
      const parts = skillId.split('_skill_');
      const className = parts[0];
      const skillIndex = parseInt(parts[1], 10);

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
          { effect: 'defense_mult', baseValue: 6 },
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
          { effect: 'healing_mult', baseValue: 8 },
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
          { effect: 'damage_mult', baseValue: 10 },
        ];
        skillDef = dpsSkills[skillIndex] || null;
      }
    }

    if (!skillDef) return;

    const value = skillDef.baseValue * data.points;

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
