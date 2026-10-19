/**
 * Dungeon Enemy Generation Utility
 * Generates enemies for dungeon rooms based on dungeon definitions
 * Maps dungeon enemy types to existing enemy templates or creates new ones
 * 
 * BALANCE: Uses linear scaling from balanceConfig
 */

import { Enemy } from './combat/types';
import { buildDungeonBoss, buildNormalEnemies, idleKillGold } from '../combat/balance';

// Map dungeon enemy type names to existing enemy template types
const DUNGEON_ENEMY_MAP: Record<string, string> = {
  // Goblins
  'Goblin': 'Goblin', // Use actual Goblin sprites
  'Goblin Chief': 'Goblin Chief', // Use actual Goblin Chief sprites
  
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

function getDungeonEnemyBaseStats(
  level: number,
  count: number,
  isBoss: boolean,
  partySize: number,
  difficultyModifier: number
): { baseHp: number; baseAttack: number; baseDefense: number; xp: number; gold: number } {
  if (isBoss) {
    const boss = buildDungeonBoss(level, partySize, difficultyModifier);
    return {
      baseHp: boss.hp,
      baseAttack: boss.attack,
      baseDefense: boss.armor,
      xp: boss.xp,
      gold: boss.gold,
    };
  }
  const packSize = (count >= 3 ? 3 : count >= 2 ? 2 : 1) as 1 | 2 | 3;
  const normal = buildNormalEnemies(level, packSize, difficultyModifier)[0];
  return {
    baseHp: normal.hp,
    baseAttack: normal.attack,
    baseDefense: normal.armor,
    xp: normal.xp,
    gold: normal.gold,
  };
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
    const baseStats = getDungeonEnemyBaseStats(
      enemyLevel,
      count,
      !!isBoss,
      heroes.length,
      difficultyModifier
    );
    
    // Get mapped sprite type for animation lookup
    const mappedSpriteType = DUNGEON_ENEMY_MAP[type] || type;
    
    // Generate count number of this enemy type
    for (let i = 0; i < count; i++) {
      // Apply difficulty modifier
      const finalHp = baseStats.baseHp;
      const attack = baseStats.baseAttack;
      const defense = baseStats.baseDefense;
      
      const enemy: Enemy = {
        id: `dungeon-${type}-${Date.now()}-${i}`,
        name: count > 1 ? `${type} ${i + 1}` : type, // Display name (can have numbers like "Goblin 1")
        enemyType: mappedSpriteType, // Sprite type for animation lookup - MUST match sprite config (e.g., "Goblin", "Goblin Chief")
        level: enemyLevel,
        hp: finalHp,
        maxHp: finalHp,
        attack: attack,
        defense: defense,
        xp: baseStats.xp,
        gold: baseStats.gold || idleKillGold(enemyLevel, isBoss ? 2 : 1),
        isBoss: isBoss || false,
        isDead: false // CRITICAL: Must match idle and raid enemy creation
      };
      
      // Debug: Log enemy sprite type mapping and stats
      console.log(`[Dungeon Enemy] Generated: name="${enemy.name}", enemyType="${enemy.enemyType}" (for sprite lookup)`);
      console.log(`[Dungeon Enemy] Stats: level=${enemy.level}, HP=${enemy.hp}/${enemy.maxHp}, ATK=${enemy.attack}, DEF=${enemy.defense}, isBoss=${enemy.isBoss}, difficulty=${(difficultyModifier * 100).toFixed(0)}%`);
      
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
    const { DUNGEONS } = await import('../api/client').catch(async () => {
      // Fallback: try to get from backend API
      // Note: Backend route is GET /api/dungeon/:dungeonId (singular), not /api/dungeons/:id
      const { overlayClient } = await import('../api/client');
      const response = await overlayClient.get(`/api/dungeon/${dungeonId}`);
      return { DUNGEONS: { [dungeonId]: response.data } };
    });
    
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
