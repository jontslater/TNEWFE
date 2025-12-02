/**
 * Damage Calculation Helpers
 * Handles all damage calculation logic including stat scaling, crits, and bonuses
 */

import { Hero, Enemy, ViewerBonuses } from './types';
import { ROLE_CONFIG } from '../fullCombatEngine';
import { calculateSkillBonuses } from '../fullCombatEngine';

/**
 * Calculate base hero damage with all stat scaling
 */
export function calculateHeroDamage(
  hero: Hero,
  bonuses: ViewerBonuses,
  getCharacterStats: (hero: Hero) => any,
  calculateSkillBonuses: (hero: Hero) => any
): number {
  let baseDamage = hero.attack + Math.floor(Math.random() * (hero.attack * 0.3));

  // Apply primary stat scaling based on class type
  const isMeleeRole = ['berserker', 'crusader', 'assassin', 'reaper', 'bladedancer', 'monk', 'stormwarrior', 'hunter'].includes(hero.role);
  const isRangedCasterRole = ['mage', 'warlock', 'necromancer', 'ranger', 'shadowpriest', 'mooncaller', 'stormcaller', 'frostmage', 'firemage', 'dragonsorcerer'].includes(hero.role);
  const category = ROLE_CONFIG[hero.role]?.category || 'dps';

  if (isMeleeRole) {
    // Melee DPS: Strength adds 1% damage per point (CAPPED at 100 strength)
    const cappedStrength = Math.min(hero.strength || 0, 100);
    const strengthBonus = 1 + (cappedStrength * 0.01);
    // Dexterity adds 0.5% damage per point (CAPPED at 50 dex)
    const cappedDex = Math.min(hero.dexterity || 0, 50);
    const dexterityBonus = 1 + (cappedDex * 0.005);
    baseDamage *= strengthBonus * dexterityBonus;

    // Apply +Melee Damage% from gear (CAPPED at 30%)
    if (hero.meleeDamage) {
      const cappedMeleeDmg = Math.min(hero.meleeDamage, 30);
      baseDamage *= (1 + (cappedMeleeDmg * 0.01));
    }
  } else if (isRangedCasterRole) {
    // Ranged/Caster DPS: Intellect adds 1% damage per point (CAPPED at 100 intellect)
    const cappedInt = Math.min(hero.intellect || 0, 100);
    const intellectBonus = 1 + (cappedInt * 0.01);
    baseDamage *= intellectBonus;

    // Wisdom adds 0.5% damage per point for casters (CAPPED at 50 wisdom)
    const cappedWis = Math.min(hero.wisdom || 0, 50);
    const wisdomBonus = 1 + (cappedWis * 0.005);
    baseDamage *= wisdomBonus;

    // Apply +Spell Damage% from gear (CAPPED at 30%)
    if (hero.spellDamage) {
      const cappedSpellDmg = Math.min(hero.spellDamage, 30);
      baseDamage *= (1 + (cappedSpellDmg * 0.01));
    }

    // Apply Arcane Empowerment spell damage buff
    if (hero.activeBuffs?.spellDamageMultiplier && hero.activeBuffs.spellDamageMultiplier.remainingDuration > 0) {
      baseDamage *= hero.activeBuffs.spellDamageMultiplier.value;
    }
  } else if (category === 'tank') {
    // Tanks: Strength adds 0.5% damage per point (CAPPED at 100)
    const cappedStrength = Math.min(hero.strength || 0, 100);
    const strengthBonus = 1 + (cappedStrength * 0.005);
    baseDamage *= strengthBonus;
  }

  // Check for attack reduction debuffs
  if (hero.activeDebuffs?.weaken) {
    baseDamage *= 0.7; // 30% reduction
  }

  // Apply skill bonuses
  const heroSkillBonuses = calculateSkillBonuses(hero);
  if (heroSkillBonuses.damageMultiplier > 0) {
    baseDamage *= (1 + heroSkillBonuses.damageMultiplier / 100);
  }

  // Apply active buffs (e.g., Battle Hymn from Bard)
  if (hero.activeBuffs?.attackMultiplier && hero.activeBuffs.attackMultiplier.remainingDuration > 0) {
    baseDamage *= hero.activeBuffs.attackMultiplier.value;
  }

  // Apply guild perks (combat bonus) - placeholder
  if (hero.guildId) {
    baseDamage *= 1.05; // 5% guild combat bonus (placeholder)
  }

  // Check for skill-based crit chance
  if (heroSkillBonuses.critChance > 0 && Math.random() < (heroSkillBonuses.critChance / 100)) {
    const critMultiplier = 2.0 + (heroSkillBonuses.critDamage / 100);
    baseDamage *= critMultiplier;
  }

  let heroDamage = baseDamage * bonuses.damageMultiplier;

  // SANITY CAP: Prevent absurdly high damage (use a reasonable cap)
  // Max 3x enemy HP per hit (will be calculated later with actual enemy)
  // For now, just apply a general cap of 100,000 damage
  if (heroDamage > 100000) {
    heroDamage = 100000;
  }

  return Math.floor(heroDamage);
}

/**
 * Apply damage to enemy with defense calculation
 */
export function applyEnemyDamage(enemy: Enemy, damage: number): { died: boolean; actualDamage: number } {
  if (!enemy || enemy.isDead || enemy.hp <= 0) {
    return { died: false, actualDamage: 0 };
  }

  // Percentage-based damage reduction with minimum damage guarantee
  const enemyDefense = enemy.defense || 0;
  // Formula: damage / (1 + defense / 250)
  // This means: 250 defense = 50% reduction, 500 defense = 66% reduction
  // Minimum 25% of original damage always gets through
  const damageAfterDefense = damage / (1 + enemyDefense / 250);
  const minDamage = Math.max(1, damage * 0.25); // At least 25% of damage
  const actualDamage = Math.max(minDamage, Math.floor(damageAfterDefense));

  enemy.hp -= actualDamage;

  // Clamp HP to 0 (prevent negative) and ensure it's an integer
  // Match Electron app: explicitly set to 0 if negative, then floor
  if (enemy.hp < 0) {
    enemy.hp = 0; // Electron app line 14887-14888
  }
  // Ensure HP is an integer (prevent floating point precision issues)
  enemy.hp = Math.max(0, Math.floor(enemy.hp));

  // CRITICAL: Only mark as dead if HP is EXACTLY 0, never if HP > 0
  // This prevents premature death detection when HP is still above zero
  const died = enemy.hp === 0 && !enemy.isDead;
  if (died) {
    // Double-check HP is actually 0 before marking as dead
    if (enemy.hp === 0) {
      enemy.isDead = true;
      // Clear debuffs on death
      enemy.activeDebuffs = {};
    }
  }
  
  // CRITICAL: Ensure isDead matches HP state (auto-correct inconsistencies)
  // If isDead is true but HP > 0, correct the state (enemy should not be dead)
  if (enemy.isDead && enemy.hp > 0) {
    enemy.isDead = false; // Auto-correct: HP > 0 means not dead
  }
  
  // CRITICAL: Only mark as dead if HP is EXACTLY 0 (never if HP > 0)
  // This prevents marking enemies as dead when they still have HP
  if (!enemy.isDead && enemy.hp === 0) {
    enemy.isDead = true;
    enemy.activeDebuffs = {};
  }

  return { died, actualDamage };
}
