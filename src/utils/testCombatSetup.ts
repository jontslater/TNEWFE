/**
 * Test Combat Setup Utility
 * Creates a test combat scenario with 1 tank, 1 DPS, 1 healer, and enemies
 */

import { Hero, Enemy } from './combat/types';
import { generateEnemiesForCombat } from './enemyGeneration';

/**
 * Create test heroes for combat testing
 */
export function createTestHeroes(): Hero[] {
  const now = Date.now();
  
  // 1 Tank - Guardian
  const tank: Hero = {
    id: 'test-tank-1',
    username: 'TestGuardian',
    name: 'TestGuardian',
    characterName: 'TestGuardian', // Add characterName for compatibility
    role: 'guardian',
    level: 10,
    hp: 550, // baseHp (220) + (hpPerLevel * level) = 220 + (35 * 10) = 570, but let's use 550 for testing
    maxHp: 570,
    attack: 28, // baseAttack (8) + (attackPerLevel * level) = 8 + (2 * 10) = 28
    defense: 78, // baseDefense (18) + (defensePerLevel * level) = 18 + (6 * 10) = 78
    isDead: false,
    activeBuffs: {},
    activeDebuffs: {},
    activeProcBuffs: {},
    cooldowns: {
      classAbility: 0,
      classAbilityPrimary: 0,
      classAbilitySecondary: 0,
      procBuff: 0,
      lastStand: 0,
      groupHeal: 0,
      instantHeal: 0,
      debuffEnemy: 0,
      combatRes: 0
    },
    classAbilityState: {
      comboCount: 0,
      elementRotation: 0,
      eclipseForm: 'solar',
      eclipseTimer: now,
      petActive: false,
      petExpiry: 0,
      enrageActive: false,
      enrageExpiry: 0,
      hpSnapshot: {}
    },
    activeThreatMod: 1.0,
    stats: {
      totalDamage: 0,
      totalHealing: 0,
      damageBlocked: 0
    }
  };

  // 1 DPS - Berserker
  const dps: Hero = {
    id: 'test-dps-1',
    username: 'TestBerserker',
    name: 'TestBerserker',
    characterName: 'TestBerserker', // Add characterName for compatibility
    role: 'berserker',
    level: 10,
    hp: 330, // baseHp (130) + (hpPerLevel * level) = 130 + (20 * 10) = 330
    maxHp: 330,
    attack: 66, // baseAttack (16) + (attackPerLevel * level) = 16 + (5 * 10) = 66
    defense: 15, // baseDefense (5) + (defensePerLevel * level) = 5 + (1 * 10) = 15
    isDead: false,
    activeBuffs: {},
    activeDebuffs: {},
    activeProcBuffs: {},
    cooldowns: {
      classAbility: 0,
      classAbilityPrimary: 0,
      classAbilitySecondary: 0,
      procBuff: 0,
      lastStand: 0,
      groupHeal: 0,
      instantHeal: 0,
      debuffEnemy: 0,
      combatRes: 0
    },
    classAbilityState: {
      comboCount: 0,
      elementRotation: 0,
      eclipseForm: 'solar',
      eclipseTimer: now,
      petActive: false,
      petExpiry: 0,
      enrageActive: false,
      enrageExpiry: 0,
      hpSnapshot: {}
    },
    activeThreatMod: 1.0,
    stats: {
      totalDamage: 0,
      totalHealing: 0,
      damageBlocked: 0
    }
  };

  // 1 Healer - Cleric
  const healer: Hero = {
    id: 'test-healer-1',
    username: 'TestCleric',
    name: 'TestCleric',
    characterName: 'TestCleric', // Add characterName for compatibility
    role: 'cleric',
    level: 10,
    hp: 275, // baseHp (115) + (hpPerLevel * level) = 115 + (16 * 10) = 275
    maxHp: 275,
    attack: 16, // baseAttack (6) + (attackPerLevel * level) = 6 + (1 * 10) = 16
    defense: 29, // baseDefense (9) + (defensePerLevel * level) = 9 + (2 * 10) = 29
    isDead: false,
    activeBuffs: {},
    activeDebuffs: {},
    activeProcBuffs: {},
    cooldowns: {
      classAbility: 0,
      classAbilityPrimary: 0,
      classAbilitySecondary: 0,
      procBuff: 0,
      lastStand: 0,
      groupHeal: 0,
      instantHeal: 0,
      debuffEnemy: 0,
      combatRes: 0
    },
    classAbilityState: {
      comboCount: 0,
      elementRotation: 0,
      eclipseForm: 'solar',
      eclipseTimer: now,
      petActive: false,
      petExpiry: 0,
      enrageActive: false,
      enrageExpiry: 0,
      hpSnapshot: {}
    },
    activeThreatMod: 1.0,
    stats: {
      totalDamage: 0,
      totalHealing: 0,
      damageBlocked: 0
    }
  };

  return [tank, dps, healer];
}

/**
 * Generate test enemies for combat
 */
export function createTestEnemies(heroes: Hero[]): Enemy[] {
  // Generate enemies based on hero levels
  const enemies = generateEnemiesForCombat(heroes, 1, 1.0);
  
  // If no enemies generated, create a default one
  if (enemies.length === 0) {
    const now = Date.now();
    return [{
      id: `test-enemy-${now}`,
      name: 'Kobold Warrior',
      type: 'Kobold Warrior',
      level: 1,
      hp: 90,
      maxHp: 90,
      attack: 14,
      defense: 10,
      xp: 18,
      isBoss: false,
      isDead: false,
      activeDebuffs: {},
      abilities: {}
    }];
  }
  
  return enemies;
}

/**
 * Setup test combat scenario
 * Returns heroes and enemies ready for combat
 */
export function setupTestCombat(): { heroes: Hero[]; enemies: Enemy[] } {
  const heroes = createTestHeroes();
  const enemies = createTestEnemies(heroes);
  
  console.log('🎮 Test Combat Setup:', {
    heroes: heroes.map(h => `${h.name} (${h.role}, Lv${h.level})`),
    enemies: enemies.map(e => `${e.name} (Lv${e.level})`)
  });
  
  return { heroes, enemies };
}
