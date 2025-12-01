/**
 * Add Spawning System
 * Handles spawning of additional enemies (adds) during boss fights
 */

import { AddSpawnDefinition } from '../types/BossMechanics';

export interface SpawnedAdd {
  id: string;
  name: string;
  type: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  level: number;
  spawnedAt: number; // Timestamp
  bossId: string; // ID of boss that spawned this add
}

/**
 * Calculate add stats from definition
 */
export function calculateAddStats(
  definition: AddSpawnDefinition,
  bossLevel: number,
  bossHp: number,
  bossAttack: number,
  bossDefense: number
): { hp: number; attack: number; defense: number; level: number } {
  const level = definition.level || Math.max(1, bossLevel - 5);
  
  // Calculate HP (defaults to ~10% of boss HP, or specified value)
  const hp = definition.hp || Math.max(100, Math.floor(bossHp * 0.1));
  
  // Calculate attack (defaults to ~50% of boss attack, or specified value)
  const attack = definition.attack || Math.max(10, Math.floor(bossAttack * 0.5));
  
  // Calculate defense (defaults to ~50% of boss defense, or specified value)
  const defense = definition.defense || Math.max(5, Math.floor(bossDefense * 0.5));
  
  return { hp, attack, defense, level };
}

/**
 * Generate add ID
 */
export function generateAddId(bossId: string, addType: string, index: number): string {
  return `add-${bossId}-${addType}-${index}-${Date.now()}`;
}

/**
 * Create spawned add from definition
 */
export function createSpawnedAdd(
  definition: AddSpawnDefinition,
  bossId: string,
  bossLevel: number,
  bossHp: number,
  bossAttack: number,
  bossDefense: number,
  index: number
): SpawnedAdd {
  const stats = calculateAddStats(definition, bossLevel, bossHp, bossAttack, bossDefense);
  const id = generateAddId(bossId, definition.type, index);
  
  return {
    id,
    name: `${definition.type} ${index + 1}`,
    type: definition.type,
    hp: stats.hp,
    maxHp: stats.hp,
    attack: stats.attack,
    defense: stats.defense,
    level: stats.level,
    spawnedAt: Date.now(),
    bossId
  };
}

/**
 * Spawn adds from definition
 */
export function spawnAdds(
  definition: AddSpawnDefinition,
  bossId: string,
  bossLevel: number,
  bossHp: number,
  bossAttack: number,
  bossDefense: number
): SpawnedAdd[] {
  const adds: SpawnedAdd[] = [];
  
  for (let i = 0; i < definition.count; i++) {
    const add = createSpawnedAdd(
      definition,
      bossId,
      bossLevel,
      bossHp,
      bossAttack,
      bossDefense,
      i
    );
    adds.push(add);
  }
  
  return adds;
}

/**
 * Check if adds should be cleaned up (when boss dies)
 */
export function shouldCleanupAdds(
  adds: SpawnedAdd[],
  bossId: string,
  bossHp: number
): boolean {
  return bossHp <= 0;
}

/**
 * Get add spawn message
 */
export function getAddSpawnMessage(
  definition: AddSpawnDefinition,
  bossName: string
): string {
  return `${bossName} summons ${definition.count} ${definition.type}${definition.count > 1 ? 's' : ''}!`;
}



