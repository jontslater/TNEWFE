/**
 * Enemy Generation Utility
 * Generates enemies locally based on hero levels (scaled like the main game)
 * Extracted from IdleDnD/game.js encounterEnemy() function
 * 
 * BALANCE: Uses linear scaling from balanceConfig instead of quadratic
 */

import { Hero, Enemy } from './combat/types';
import { BALANCE } from '../config/balanceConfig';

/**
 * DEBUG MODE: Enable only ONE enemy at a time for testing
 * Settings are controlled via the debug UI at /browser-source/debug
 * Reads from localStorage: 'enemyDebugSettings'
 * 
 * Complete list of all 14 enemies (in order):
 * 1. Kobold Warrior (Level 1)
 * 2. Baby Dragon (Level 2)
 * 3. Imp (Level 3)
 * 4. Lizardman (Level 4)
 * 5. Masked Orc (Level 5)
 * 6. Werewolf (Level 8)
 * 7. Skeleton Mage (Level 10)
 * 8. Witch (Level 12)
 * 9. Mimic (Level 14)
 * 10. Gryphon (Level 18)
 * 11. Minotaur (Level 22)
 * 12. Headless Horseman (Level 26)
 * 13. Adult Dragon (Level 35, Boss)
 * 14. Demon Lord (Level 40, Boss)
 */
function getDebugEnabledEnemy(): string | null {
  try {
    const saved = localStorage.getItem('enemyDebugSettings');
    if (saved) {
      const settings = JSON.parse(saved);
      return settings.enabledEnemy || null;
    }
  } catch (e) {
    // Failed to read debug settings
  }
  return null;
}

// Enemy templates matching game.js
const ENEMY_TEMPLATES = [
  // TIER 1 - Early Game (Levels 1-5)
  { 
    name: 'Kobold Warrior', 
    baseHp: 90, 
    baseAttack: 14,
    baseDefense: 10,
    xp: 18, 
    isBoss: false, 
    level: 1,
    type: 'Kobold Warrior'
  },
  {
    name: 'Baby Dragon',
    baseHp: 120,
    baseAttack: 18,
    baseDefense: 12,
    xp: 25,
    isBoss: false,
    level: 2,
    type: 'Baby Dragon'
  },
  {
    name: 'Imp',
    baseHp: 100,
    baseAttack: 20,
    baseDefense: 14,
    xp: 22,
    isBoss: false,
    level: 3,
    type: 'Imp'
  },
  {
    name: 'Lizardman',
    baseHp: 140,
    baseAttack: 22,
    baseDefense: 15,
    xp: 28,
    isBoss: false,
    level: 4,
    type: 'Lizardman'
  },
  {
    name: 'Masked Orc',
    baseHp: 160,
    baseAttack: 24,
    baseDefense: 16,
    xp: 32,
    isBoss: false,
    level: 5,
    type: 'Masked Orc'
  },
  // TIER 2 - Mid Game (Levels 6-15)
  {
    name: 'Werewolf',
    baseHp: 200,
    baseAttack: 32,
    baseDefense: 22,
    xp: 45,
    isBoss: false,
    level: 8,
    type: 'Werewolf'
  },
  {
    name: 'Skeleton Mage',
    baseHp: 180,
    baseAttack: 35,
    baseDefense: 21,
    xp: 50,
    isBoss: false,
    level: 10,
    type: 'Skeleton Mage'
  },
  {
    name: 'Witch',
    baseHp: 190,
    baseAttack: 38,
    baseDefense: 23,
    xp: 55,
    isBoss: false,
    level: 12,
    type: 'Witch'
  },
  {
    name: 'Mimic',
    baseHp: 220,
    baseAttack: 40,
    baseDefense: 28,
    xp: 60,
    isBoss: false,
    level: 14,
    type: 'Mimic'
  },
  // TIER 3 - Late Game (Levels 16-30)
  {
    name: 'Gryphon',
    baseHp: 280,
    baseAttack: 48,
    baseDefense: 33,
    xp: 80,
    isBoss: false,
    level: 18,
    type: 'Gryphon'
  },
  {
    name: 'Minotaur',
    baseHp: 350,
    baseAttack: 55,
    baseDefense: 38,
    xp: 100,
    isBoss: false,
    level: 22,
    type: 'Minotaur'
  },
  {
    name: 'Headless Horseman',
    baseHp: 400,
    baseAttack: 60,
    baseDefense: 42,
    xp: 120,
    isBoss: false,
    level: 26,
    type: 'Headless Horseman'
  },
  // TIER 4 - End Game (Levels 31+)
  // RAID DRAGONS - Wave enemies for Elder Dragon raid
  {
    name: 'Dragon Whelp',
    baseHp: 8000,
    baseAttack: 150,
    baseDefense: 80,
    xp: 800,
    isBoss: false,
    level: 40,
    type: 'Dragon_1' // Maps to Dragon_1 sprite folder
  },
  {
    name: 'Dragon Guardian',
    baseHp: 10000,
    baseAttack: 180,
    baseDefense: 100,
    xp: 1000,
    isBoss: false,
    level: 42,
    type: 'Dragon_2' // Maps to Dragon_2 sprite folder
  },
  {
    name: 'Dragon Sentinel',
    baseHp: 12000,
    baseAttack: 200,
    baseDefense: 120,
    xp: 1200,
    isBoss: false,
    level: 44,
    type: 'Dragon_3' // Maps to Dragon_3 sprite folder
  },
  {
    name: 'Adult Dragon',
    baseHp: 600,
    baseAttack: 80,
    baseDefense: 56,
    xp: 200,
    isBoss: true,
    level: 35,
    type: 'Adult Dragon'
  },
  {
    name: 'Demon Lord',
    baseHp: 800,
    baseAttack: 100,
    baseDefense: 70,
    xp: 300,
    isBoss: true,
    level: 40,
    type: 'Demon Lord'
  }
];

/**
 * Calculate average party level
 * Extracted from IdleDnD/game.js:getAveragePartyLevel()
 */
function getAveragePartyLevel(heroes: Hero[]): number {
  if (!heroes || heroes.length === 0) return 1;
  
  const totalLevel = heroes.reduce((sum, hero) => sum + (hero.level || 1), 0);
  return totalLevel / heroes.length;
}

/**
 * Calculate gear score for a hero
 * Extracted from IdleDnD/game.js:getAverageGearScore()
 */
function calculateGearScore(hero: Hero): number {
  let gearScore = 0;
  
  if (!hero.equipment) return gearScore;
  
  // Calculate gear score from all equipped items
  Object.values(hero.equipment).forEach((item: any) => {
    if (!item) return;
    
    // Base stats
    gearScore += (item.attack || 0) + (item.defense || 0) + (item.hp || 0);
    gearScore += (item.intellect || 0) * 3;  // 1 Int = 3 gear score
    gearScore += (item.strength || 0) * 3;   // 1 Str = 3 gear score
    gearScore += (item.dexterity || 0) * 1.5; // 1 Dex = 1.5 gear score
    gearScore += (item.wisdom || 0) * 1.5;   // 1 Wis = 1.5 gear score
    gearScore += (item.stamina || 0) * 1;    // 1 Stamina = 1 gear score
    
    // Secondary stats
    if (item.secondaryStats) {
      gearScore += (item.secondaryStats.healingPower || 0) * 5;
      gearScore += (item.secondaryStats.spellDamage || 0) * 5;
      gearScore += (item.secondaryStats.meleeDamage || 0) * 5;
      gearScore += (item.secondaryStats.hpRegen || 0) * 10;
      gearScore += (item.secondaryStats.damageReduction || 0) * 10;
      gearScore += (item.secondaryStats.critChance || 0) * 15;
    }
    
    // Legendary modifier
    if (item.rarity === 'legendary') {
      gearScore += 200;
    }
  });
  
  return gearScore;
}

/**
 * Get average gear score for party
 * Extracted from IdleDnD/game.js:getAverageGearScore()
 */
function getAverageGearScore(heroes: Hero[]): number {
  if (!heroes || heroes.length === 0) return 0;
  
  const totalGearScore = heroes.reduce((sum, hero) => sum + calculateGearScore(hero), 0);
  return totalGearScore / heroes.length;
}

/**
 * Get difficulty scaling based on hero levels, party size, gear score
 * Extracted from IdleDnD/game.js:getDifficultyScaling() (lines 10310-10355)
 */
function getDifficultyScaling(heroes: Hero[], waveCount: number = 1, difficultyModifier: number = 1.0): {
  avgLevel: number;
  multiplier: number;
  partySize: number;
  avgGearScore: number;
  waveCount: number;
  difficultyMod: number;
} {
  const avgLevel = getAveragePartyLevel(heroes);
  const partySize = heroes.length;
  const avgGearScore = getAverageGearScore(heroes);
  
  // Level multiplier: 1 + (avgLevel * 0.04)
  // Reduced from 0.12 to 0.04 for better balance (67% reduction)
  // This makes leveling slower and more of a grind, especially at higher levels
  const levelMultiplier = 1 + (avgLevel * 0.04);
  
  // Party size multiplier: More aggressive scaling for large parties
  // Matches Electron app (lines 10320-10330)
  let partySizeMultiplier: number;
  if (partySize <= 5) {
    // Small parties: 8% per hero beyond first
    partySizeMultiplier = 1 + ((partySize - 1) * 0.08);
  } else if (partySize <= 10) {
    // Medium parties: 12% per hero beyond first
    // 5 heroes = 1.32x, then +12% each
    partySizeMultiplier = 1 + (4 * 0.08) + ((partySize - 5) * 0.12);
  } else {
    // Large parties (10+): 15% per hero beyond first
    partySizeMultiplier = 1 + (4 * 0.08) + (5 * 0.12) + ((partySize - 10) * 0.15);
  }
  
  // Gear score multiplier: 1% per 10 gear score (1 + avgGearScore / 1000)
  const gearMultiplier = 1 + (avgGearScore / 1000);
  
  // Wave multiplier: 1% per 10 waves (1 + waveCount / 100)
  const waveMultiplier = 1 + (waveCount / 100);
  
  // Combined multiplier
  let totalMultiplier = levelMultiplier * partySizeMultiplier * gearMultiplier * waveMultiplier;
  
  // Apply difficulty modifier
  totalMultiplier *= difficultyModifier;
  
  return {
    avgLevel,
    multiplier: totalMultiplier,
    partySize,
    avgGearScore: Math.floor(avgGearScore),
    waveCount,
    difficultyMod: difficultyModifier
  };
}

/**
 * Generate enemies based on hero levels
 * Extracted from IdleDnD/game.js:encounterEnemy()
 */
export function generateEnemiesForCombat(
  heroes: Hero[],
  waveCount: number = 1,
  difficultyModifier: number = 1.0
): Enemy[] {
  if (!heroes || heroes.length === 0) {
    return [];
  }
  
  const scaling = getDifficultyScaling(heroes, waveCount, difficultyModifier);
  
  // Determine pack size based on wave
  let packSize = 1;
  const packRoll = Math.random();
  
  if (waveCount >= 51) {
    if (packRoll < 0.2) packSize = 3;
    else if (packRoll < 0.7) packSize = 2;
  } else if (waveCount >= 26) {
    if (packRoll < 0.1) packSize = 3;
    else if (packRoll < 0.5) packSize = 2;
  } else if (waveCount >= 11) {
    if (packRoll < 0.3) packSize = 2;
  }
  
  // Pick appropriate enemies for party level
  let availableEnemies = ENEMY_TEMPLATES.filter(e => scaling.avgLevel >= e.level - 1);
  
  // EXCLUDE RAID-ONLY BOSSES and DUNGEON-ONLY ENEMIES from idle mode
  const RAID_ONLY_BOSSES = [
    'Elder Dragon', 
    'Adult Dragon',
    'Dragon Whelp',     // Raid wave enemy
    'Dragon Guardian',  // Raid wave enemy
    'Dragon Sentinel'   // Raid wave enemy
  ];
  const DUNGEON_ONLY_ENEMIES = [
    'Goblin Chief'  // Dungeon-only boss, should not appear in idle mode
  ];
  availableEnemies = availableEnemies.filter(e => 
    !RAID_ONLY_BOSSES.includes(e.name) && 
    !DUNGEON_ONLY_ENEMIES.includes(e.name)
  );
  
  // DEBUG MODE: If debug enemy is set, only allow that enemy
  const DEBUG_ENABLED_ENEMY = getDebugEnabledEnemy();
  if (DEBUG_ENABLED_ENEMY !== null) {
    const debugEnemy = ENEMY_TEMPLATES.find(e => e.name === DEBUG_ENABLED_ENEMY);
    if (debugEnemy) {
      availableEnemies = [debugEnemy];
    }
  }
  
  if (availableEnemies.length === 0) {
    // Fallback to first enemy if none available
    return [generateSingleEnemy(ENEMY_TEMPLATES[0], scaling, 1.0, 0)];
  }
  
  // Pack scaling: reduce per-enemy stats for packs
  const packScaling = packSize === 1 ? 1.0 : packSize === 2 ? 0.6 : 0.45;
  
  const enemies: Enemy[] = [];
  
  for (let i = 0; i < packSize; i++) {
    // For variety: 70% chance to pick a different enemy than the previous one (if pack size > 1)
    let enemyTemplate;
    if (packSize > 1 && i > 0 && Math.random() < 0.7) {
      const previousEnemyName = enemies[i - 1].name;
      const differentEnemies = availableEnemies.filter(e => e.name !== previousEnemyName);
      if (differentEnemies.length > 0) {
        enemyTemplate = differentEnemies[Math.floor(Math.random() * differentEnemies.length)];
      } else {
        enemyTemplate = availableEnemies[Math.floor(Math.random() * availableEnemies.length)];
      }
    } else {
      enemyTemplate = availableEnemies[Math.floor(Math.random() * availableEnemies.length)];
    }
    
    const enemy = generateSingleEnemy(enemyTemplate, scaling, packScaling, i);
    enemies.push(enemy);
  }
  
  
  return enemies;
}

/**
 * Generate a single enemy from a template
 */
function generateSingleEnemy(
  template: typeof ENEMY_TEMPLATES[0],
  scaling: { avgLevel: number; multiplier: number },
  packScaling: number,
  slotIndex: number
): Enemy {
  // FIXED: hpMultiplier should be based on scaling.multiplier, but NOT multiplied by it again
  // The hpMultiplier already accounts for difficulty scaling
  // For HP: base * (1.2 * difficultyMultiplier) * packScaling
  // For Attack/Defense: base * scaling.multiplier * (additional multipliers) * packScaling
  
  const difficultyMultiplier = scaling.multiplier > 1.0 
    ? 1.0 + ((scaling.multiplier - 1.0) * 0.8)
    : 1.0;
  
  // HP multiplier: 1.2x base, then scaled by difficulty (but NOT by scaling.multiplier again)
  const hpMultiplier = 1.2 * difficultyMultiplier;
  
  // Attack multiplier: 1.1x base, then additional scaling based on difficulty
  const attackMultiplier = 1.1 * (1.0 + ((scaling.multiplier - 1.0) * 0.4));
  
  // Defense multiplier: 0.9x base, then additional scaling based on difficulty
  const defenseMultiplier = 0.9 + ((scaling.multiplier - 1.0) * 0.6);
  
  const enemyId = `enemy-${Date.now()}-${slotIndex}`;
  
  // NEW BALANCE: Use linear scaling formulas from balanceConfig
  // Difficulty factor: 1.0 = normal, 1.5 = elite, 2.0 = boss
  const difficulty = template.isBoss ? 2.0 : 1.0;
  const level = Math.max(1, Math.floor(scaling.avgLevel));
  
  // Apply balance formulas (linear, not quadratic)
  const finalHp = BALANCE.enemy.hpScaling(level, difficulty * packScaling);
  const finalAttack = BALANCE.enemy.attackScaling(level, difficulty * packScaling * attackMultiplier);
  const finalDefense = BALANCE.enemy.defenseScaling(level, difficulty * packScaling * defenseMultiplier);
  const finalXp = BALANCE.enemy.xpScaling(level, difficulty);
  const finalGold = BALANCE.enemy.goldScaling(level, difficulty);
  
  return {
    id: enemyId,
    name: template.name,
    enemyType: template.type,
    level: level,
    hp: finalHp,
    maxHp: finalHp,
    attack: finalAttack,
    defense: finalDefense,
    isDead: false,
    isBoss: template.isBoss || false,
    xp: finalXp,
    gold: finalGold,
    activeDebuffs: {},
    abilities: {}
  };
}
