/**
 * Enemy Spawning System
 * Handles random encounters, pack sizes, and enemy variety
 */

export const ENEMY_TYPES = [
  'Kobold Warrior',
  'Baby Dragon',
  'Imp',
  'Lizardman',
  'Masked Orc',
  'Werewolf',
  'Skeleton Mage',
  'Witch',
  'Mimic',
  'Gryphon',
  'Minotaur',
  'Headless Horseman',
  'Adult Dragon',
  'Demon Lord'
];

export interface SpawnedEnemy {
  name: string;
  id: string;
}

export interface EnemyPack {
  enemies: SpawnedEnemy[];
  packSize: number;
}

/**
 * Check if a random encounter should occur (40% chance)
 * @returns true if encounter should occur
 */
export function shouldSpawnEncounter(): boolean {
  return Math.random() < 0.4; // 40% chance
}

/**
 * Determine pack size (1-3 enemies)
 * @returns Pack size (1, 2, or 3)
 */
export function getPackSize(): number {
  const roll = Math.random();
  if (roll < 0.5) {
    return 1; // 50% chance for 1 enemy
  } else if (roll < 0.85) {
    return 2; // 35% chance for 2 enemies
  } else {
    return 3; // 15% chance for 3 enemies
  }
}

/**
 * Get a random enemy type
 * @param excludeTypes - Enemy types to exclude from selection
 * @returns Random enemy type name
 */
export function getRandomEnemyType(excludeTypes: string[] = []): string {
  const availableTypes = ENEMY_TYPES.filter(type => !excludeTypes.includes(type));
  if (availableTypes.length === 0) {
    // If all types are excluded, fall back to all types
    return ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
  }
  return availableTypes[Math.floor(Math.random() * availableTypes.length)];
}

/**
 * Generate an enemy pack with variety logic
 * 70% chance for different enemy types in the pack
 * @param packSize - Number of enemies in the pack (1-3)
 * @returns Array of enemy names
 */
export function generateEnemyPack(packSize: number = 1): string[] {
  const enemies: string[] = [];
  const useVariety = Math.random() < 0.7; // 70% chance for variety
  
  // First enemy is always random
  enemies.push(getRandomEnemyType());
  
  // For packs of 2 or 3, decide on variety
  if (packSize > 1) {
    if (useVariety) {
      // Different enemy types
      for (let i = 1; i < packSize; i++) {
        enemies.push(getRandomEnemyType(enemies));
      }
    } else {
      // Same enemy type (30% chance)
      const firstEnemy = enemies[0];
      for (let i = 1; i < packSize; i++) {
        enemies.push(firstEnemy);
      }
    }
  }
  
  return enemies;
}

/**
 * Spawn a random encounter
 * @returns Enemy pack or null if no encounter
 */
export function spawnRandomEncounter(): EnemyPack | null {
  if (!shouldSpawnEncounter()) {
    return null; // No encounter this time
  }
  
  const packSize = getPackSize();
  const enemyNames = generateEnemyPack(packSize);
  
  // Generate unique IDs for each enemy
  const enemies: SpawnedEnemy[] = enemyNames.map((name, index) => ({
    name,
    id: `enemy-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`
  }));
  
  return {
    enemies,
    packSize
  };
}














