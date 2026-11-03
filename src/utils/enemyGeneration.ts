/**
 * Enemy Generation Utility
 * Generates enemies locally based on hero levels (scaled like the main game)
 * Extracted from IdleDnD/game.js encounterEnemy() function
 */

import { Hero, Enemy } from './combat/types';
import {
  getDifficultyScalingFromHeroes,
  scaleEnemyForCombat,
} from '../game/stats/enemyCombatScaling';
import type { HeroStatInput } from '../game/stats/types';

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

function heroesAsStatInput(heroes: Hero[]): HeroStatInput[] {
  return heroes.map((h) => ({
    role: h.role || 'berserker',
    level: h.level || 1,
    equipment: h.equipment as HeroStatInput['equipment'],
    skills: h.skills as HeroStatInput['skills'],
  }));
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

  const statHeroes = heroesAsStatInput(heroes);
  const scaling = getDifficultyScalingFromHeroes(statHeroes, waveCount, difficultyModifier);
  
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
    return [
      generateSingleEnemy(
        ENEMY_TEMPLATES[0],
        statHeroes,
        waveCount,
        difficultyModifier,
        1,
        0,
        scaling.multiplier,
        scaling.avgLevel
      ),
    ];
  }
  
  // Pack scaling: reduce per-enemy stats for packs (handled inside scaleEnemyForCombat)
  
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
    
    const enemy = generateSingleEnemy(
      enemyTemplate,
      statHeroes,
      waveCount,
      difficultyModifier,
      packSize,
      i,
      scaling.multiplier,
      scaling.avgLevel
    );
    enemies.push(enemy);
  }
  
  
  return enemies;
}

/**
 * Generate a single enemy from a template
 */
function generateSingleEnemy(
  template: typeof ENEMY_TEMPLATES[0],
  referenceHeroes: HeroStatInput[],
  waveCount: number,
  difficultyModifier: number,
  packSize: number,
  slotIndex: number,
  scalingMultiplier: number,
  avgLevel: number
): Enemy {
  const scaled = scaleEnemyForCombat(
    {
      hp: template.baseHp,
      attack: template.baseAttack,
      defense: template.baseDefense || 0,
    },
    {
      packSize,
      isBoss: template.isBoss || false,
      referenceHeroes,
      waveCount,
      difficultyModifier,
      contentTier: 'idle',
    }
  );

  const enemyId = `enemy-${Date.now()}-${slotIndex}`;
  const xpMultiplier = Math.min(scalingMultiplier * 0.2, 8);

  return {
    id: enemyId,
    name: template.name,
    enemyType: template.type,
    level: Math.max(1, Math.floor(avgLevel)),
    hp: scaled.hp,
    maxHp: scaled.maxHp,
    attack: scaled.attack,
    defense: scaled.defense,
    isDead: false,
    isBoss: template.isBoss || false,
    xp: Math.floor(template.xp * Math.max(1, xpMultiplier)),
    activeDebuffs: {},
    abilities: {},
  };
}
