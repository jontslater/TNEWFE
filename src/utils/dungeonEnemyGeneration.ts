/**
 * Dungeon Enemy Generation Utility
 * Generates enemies for dungeon rooms based on dungeon definitions
 * Maps dungeon enemy types to existing enemy templates or creates new ones
 */

import { Enemy } from './combat/types';

// Map dungeon enemy type names to existing enemy template types
const DUNGEON_ENEMY_MAP: Record<string, string> = {
  // Goblins
  'Goblin': 'Kobold Warrior', // Use Kobold as Goblin equivalent
  'Goblin Chief': 'Masked Orc', // Use Orc as Goblin Chief equivalent
  
  // Undead
  'Skeleton': 'Skeleton Mage', // Use existing Skeleton Mage
  'Skeleton Warrior': 'Skeleton Mage', // Use Skeleton Mage for now
  'Skeleton Mage': 'Skeleton Mage', // Exact match
  'Lich': 'Witch', // Use Witch as Lich equivalent (can upgrade later)
  
  // Demons
  'Imp': 'Imp', // Exact match
  'Demon': 'Imp', // Use Imp as Demon (can add Demon template later)
  'Demon Lord': 'Demon Lord', // Should exist in templates
  
  // Other dungeon-specific (add more as needed)
  'Gryphon': 'Gryphon',
  'Minotaur': 'Minotaur',
  'Werewolf': 'Werewolf',
  'Mimic': 'Mimic'
};

// Get base stats for a dungeon enemy type
function getDungeonEnemyBaseStats(enemyType: string, level: number): {
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
  xp: number;
} {
  // Map to existing enemy template base stats, scaled by level
  const mappedType = DUNGEON_ENEMY_MAP[enemyType] || enemyType;
  
  // Base stats per level (similar to existing enemy templates)
  const levelMultiplier = 1 + (level * 0.15);
  
  // Default base stats (can be customized per type)
  const baseStats = {
    baseHp: Math.floor(80 * levelMultiplier),
    baseAttack: Math.floor(12 * levelMultiplier),
    baseDefense: Math.floor(8 * levelMultiplier),
    xp: Math.floor(15 * level)
  };
  
  // Type-specific adjustments
  switch (enemyType.toLowerCase()) {
    case 'goblin':
    case 'goblin chief':
      baseStats.baseHp = Math.floor(100 * levelMultiplier);
      baseStats.baseAttack = Math.floor(15 * levelMultiplier);
      break;
    case 'skeleton':
    case 'skeleton warrior':
      baseStats.baseHp = Math.floor(120 * levelMultiplier);
      baseStats.baseAttack = Math.floor(18 * levelMultiplier);
      break;
    case 'skeleton mage':
      baseStats.baseHp = Math.floor(100 * levelMultiplier);
      baseStats.baseAttack = Math.floor(22 * levelMultiplier); // Higher attack for mages
      break;
    case 'lich':
      baseStats.baseHp = Math.floor(300 * levelMultiplier);
      baseStats.baseAttack = Math.floor(30 * levelMultiplier);
      break;
    case 'imp':
      baseStats.baseHp = Math.floor(90 * levelMultiplier);
      baseStats.baseAttack = Math.floor(16 * levelMultiplier);
      break;
    case 'demon':
      baseStats.baseHp = Math.floor(150 * levelMultiplier);
      baseStats.baseAttack = Math.floor(25 * levelMultiplier);
      break;
    case 'demon lord':
      baseStats.baseHp = Math.floor(500 * levelMultiplier);
      baseStats.baseAttack = Math.floor(40 * levelMultiplier);
      break;
  }
  
  return baseStats;
}

/**
 * Generate enemies for a dungeon room
 * @param roomEnemies - Array of enemy definitions from dungeon room (e.g., [{ type: 'Goblin', count: 3, level: 10 }])
 * @param heroes - Array of heroes in the dungeon (for scaling)
 * @param difficultyModifier - Difficulty multiplier (default 1.0)
 */
export function generateDungeonEnemies(
  roomEnemies: Array<{ type: string; count: number; level: number; isBoss?: boolean }>,
  heroes: any[],
  difficultyModifier: number = 1.0
): Enemy[] {
  const generatedEnemies: Enemy[] = [];
  
  // Calculate average hero level for scaling adjustments
  const avgHeroLevel = heroes.length > 0 
    ? Math.floor(heroes.reduce((sum, h) => sum + (h.level || 1), 0) / heroes.length)
    : 10;
  
  roomEnemies.forEach((enemyDef) => {
    const { type, count, level, isBoss } = enemyDef;
    const enemyLevel = level || avgHeroLevel;
    
    // Get base stats for this enemy type
    const baseStats = getDungeonEnemyBaseStats(type, enemyLevel);
    
    // Get mapped sprite type for animation lookup
    const mappedSpriteType = DUNGEON_ENEMY_MAP[type] || type;
    
    // Generate count number of this enemy type
    for (let i = 0; i < count; i++) {
      // Apply difficulty modifier
      const hp = Math.floor(baseStats.baseHp * difficultyModifier);
      const attack = Math.floor(baseStats.baseAttack * difficultyModifier);
      const defense = Math.floor(baseStats.baseDefense * difficultyModifier);
      
      // Bosses get 1.5x HP boost
      const finalHp = isBoss ? Math.floor(hp * 1.5) : hp;
      
      const enemy: Enemy = {
        id: `dungeon-${type}-${Date.now()}-${i}`,
        name: count > 1 ? `${type} ${i + 1}` : type, // Display name (can have numbers)
        enemyType: mappedSpriteType, // Sprite type for animation lookup (e.g., "Skeleton Mage")
        level: enemyLevel,
        hp: finalHp,
        maxHp: finalHp,
        attack: attack,
        defense: defense,
        xp: isBoss ? Math.floor(baseStats.xp * 1.5) : baseStats.xp,
        isBoss: isBoss || false
      };
      
      generatedEnemies.push(enemy);
    }
  });
  
  console.log(`[Dungeon] Generated ${generatedEnemies.length} enemies for room:`, 
    roomEnemies.map(e => `${e.count}x ${e.type}`).join(', '));
  
  return generatedEnemies;
}

/**
 * Get dungeon room definition from dungeon data
 * @param dungeonId - ID of the dungeon (e.g., 'gungeon_cave')
 * @param roomIndex - Index of the room (0-based)
 */
export async function getDungeonRoom(
  dungeonId: string,
  roomIndex: number
): Promise<{ id: string; name: string; enemies: any[]; isBoss: boolean } | null> {
  try {
    // Import dungeon data (backend has it, frontend needs access)
    const { DUNGEONS } = await import('../api/client').catch(() => 
      // Fallback: try to get from backend API
      fetch(`/api/dungeons/${dungeonId}`).then(r => r.json()).then(d => ({ DUNGEONS: { [dungeonId]: d } }))
    );
    
    const dungeon = DUNGEONS?.[dungeonId];
    if (!dungeon || !dungeon.rooms || roomIndex >= dungeon.rooms.length) {
      return null;
    }
    
    return dungeon.rooms[roomIndex];
  } catch (error) {
    console.error('[Dungeon] Failed to get dungeon room:', error);
    return null;
  }
}
