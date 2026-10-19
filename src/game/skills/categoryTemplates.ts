import type { SkillCategory, SkillTemplate } from './types';

const UNLOCK_LEVELS = [5, 7, 9, 11, 13, 15, 17, 19, 21, 23];

function withUnlock(
  rows: Omit<SkillTemplate, 'unlockLevel' | 'maxPoints' | 'slot'>[]
): SkillTemplate[] {
  return rows.map((row, index) => ({
    ...row,
    slot: index + 1,
    unlockLevel: UNLOCK_LEVELS[index],
    maxPoints: 5,
  }));
}

/** Mirrors idleDnD-Backend `src/data/skills.js` templates (1-based slots). */
export const CATEGORY_SKILL_TEMPLATES: Record<SkillCategory, SkillTemplate[]> = {
  tank: withUnlock([
    { name: 'Fortitude', effect: 'stat_boost', stat: 'hp', baseValue: 5, description: 'Increases maximum HP' },
    { name: 'Iron Will', effect: 'defense_mult', baseValue: 3, description: 'Reduces damage taken' },
    { name: 'Shield Mastery', effect: 'stat_boost', stat: 'defense', baseValue: 4, description: 'Increases defense' },
    { name: 'Threat Generation', effect: 'stat_boost', stat: 'attack', baseValue: 2, description: 'Increases threat generation' },
    { name: 'Last Stand', effect: 'defense_mult', baseValue: 5, description: 'Massive damage reduction at low HP' },
    { name: 'Taunt Mastery', effect: 'cooldown_red', baseValue: 10, description: 'Reduces taunt cooldown' },
    { name: 'Armor Expertise', effect: 'stat_boost', stat: 'defense', baseValue: 6, description: 'Increases armor effectiveness' },
    { name: 'Guardian Stance', effect: 'defense_mult', baseValue: 4, description: 'Party-wide damage reduction' },
    { name: 'Unbreakable', effect: 'stat_boost', stat: 'hp', baseValue: 8, description: 'Massive HP increase' },
    { name: 'Protector', effect: 'defense_mult', baseValue: 6, description: 'Ultimate tanking skill' },
  ]),
  healer: withUnlock([
    { name: 'Healing Touch', effect: 'healing_mult', baseValue: 5, description: 'Increases healing done' },
    { name: 'Mana Efficiency', effect: 'cooldown_red', baseValue: 8, description: 'Reduces spell cooldowns' },
    { name: 'Divine Grace', effect: 'healing_mult', baseValue: 4, description: 'Increases healing power' },
    { name: 'Rapid Recovery', effect: 'speed_boost', baseValue: 10, description: 'Faster healing casts' },
    { name: 'Group Heal', effect: 'healing_mult', baseValue: 6, description: 'Increases AoE healing' },
    { name: 'Cleanse', effect: 'cooldown_red', baseValue: 12, description: 'Faster debuff removal' },
    { name: 'Overheal', effect: 'healing_mult', baseValue: 5, description: 'Overhealing creates shields' },
    { name: 'Resurrection Mastery', effect: 'cooldown_red', baseValue: 15, description: 'Faster resurrection' },
    { name: 'Divine Shield', effect: 'stat_boost', stat: 'defense', baseValue: 3, description: 'Protective aura' },
    { name: 'Master Healer', effect: 'healing_mult', baseValue: 8, description: 'Ultimate healing skill' },
  ]),
  dps: withUnlock([
    { name: 'Power Strike', effect: 'damage_mult', baseValue: 5, description: 'Increases damage dealt' },
    { name: 'Critical Hit', effect: 'crit_chance', baseValue: 3, description: 'Increases crit chance' },
    { name: 'Lethal Blow', effect: 'crit_damage', baseValue: 10, description: 'Increases crit damage' },
    { name: 'Combat Mastery', effect: 'stat_boost', stat: 'attack', baseValue: 4, description: 'Increases attack power' },
    { name: 'Fury', effect: 'speed_boost', baseValue: 8, description: 'Increases attack speed' },
    { name: 'Execution', effect: 'damage_mult', baseValue: 6, description: 'Bonus damage to low HP enemies' },
    { name: 'Precision', effect: 'crit_chance', baseValue: 5, description: 'Higher crit chance' },
    { name: 'Berserker Rage', effect: 'damage_mult', baseValue: 7, description: 'Massive damage increase' },
    { name: 'Bloodlust', effect: 'lifesteal', baseValue: 5, description: 'Lifesteal on damage' },
    { name: 'Master Assassin', effect: 'damage_mult', baseValue: 10, description: 'Ultimate DPS skill' },
  ]),
};
