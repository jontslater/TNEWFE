/**
 * Positioning utilities for overlay sprites
 * Pure functions for calculating hero and enemy positions
 */

import type { OverlayHero } from '../types/overlay';

export interface Position {
  left: string;
  top: string;
}

/**
 * Unified enemy positioning function - works consistently across idle, raid, and dungeon modes
 */
export const getEnemyPosition = (
  index: number,
  total: number,
  isBoss: boolean = false,
  enemyType?: string,
  gameMode?: string,
  heroes?: OverlayHero[]
): Position => {
  const screenWidth = 1920;
  const screenHeight = 1080;
  
  const heroZoneEnd = screenWidth * 0.6; // 1152px
  const leftMargin = 150;
  const rightMargin = 150;
  
  const idleModeOffset = gameMode === 'idle' ? 150 : 0;
  
  const enemyStartX = heroZoneEnd + leftMargin + idleModeOffset;
  const maxX = screenWidth - rightMargin;
  
  const availableEnemyWidth = maxX - enemyStartX;
  
  const spacing = total > 1 ? availableEnemyWidth / (total - 1) : 0;
  const x = enemyStartX + (index * spacing);
  
  const minX = enemyStartX;
  const clampedX = Math.max(minX, Math.min(x, maxX));
  
  const spriteHeight = 240;
  const buffer = 20;
  
  let y: number;
  
  if (isBoss) {
    const isCorruptedHighPriest = enemyType === 'Corrupted High Priest';
    
    if (gameMode === 'dungeon') {
      const downOffset = 140 + 144;
      y = screenHeight - spriteHeight - buffer + downOffset;
    } else if (gameMode === 'idle') {
      const downOffset = 96;
      y = screenHeight - spriteHeight - buffer + downOffset;
    } else {
      const downOffset = isCorruptedHighPriest ? 96 : 192;
      y = screenHeight - spriteHeight - buffer + downOffset;
    }
    
    const bossLeftOffset = 200;
    const bossX = enemyStartX + bossLeftOffset;
    
    const minBossX = heroZoneEnd + leftMargin;
    const safeBossX = Math.max(bossX, minBossX);
    
    const clampedBossX = Math.min(safeBossX, screenWidth - rightMargin);
    
    return {
      left: `${clampedBossX}px`,
      top: `${y}px`
    };
  }
  
  const isCultist = enemyType === 'Cultist';
  
  if (gameMode === 'idle') {
    const downOffset = 96;
    y = screenHeight - spriteHeight - buffer + downOffset;
  } else {
    const downOffset = isCultist ? 192 : (gameMode === 'dungeon' ? 140 : 96);
    y = screenHeight - spriteHeight - buffer + downOffset;
  }
  
  return {
    left: `${clampedX}px`,
    top: `${y}px`
  };
};

/**
 * Get hero position (dungeon-specific, prevents clipping with 2 heroes)
 */
export const getDungeonHeroPosition = (hero: OverlayHero, index: number, allHeroes: OverlayHero[]): Position => {
  const screenWidth = 1920;
  const screenHeight = 1080;
  const heroCount = allHeroes.length;
  
  const startX = 100;
  const endX = screenWidth * 0.6 - 200;
  const availableWidth = endX - startX;
  
  const spacing = heroCount > 1 ? availableWidth / (heroCount - 1) : 0;
  const x = startX + (index * spacing);
  
  const spriteHeight = 240;
  const buffer = 20;
  const downOffset = 96;
  const y = screenHeight - spriteHeight - buffer + downOffset;
  
  return {
    left: `${x}px`,
    top: `${y}px`
  };
};
