import {
  getBattlefieldSpriteScale,
  getEnemySpriteViewportPx,
  isRaidWaveDragonType,
} from './spriteDisplayScale';

export interface BattlefieldEnemyPosition {
  left: string;
  top: string;
}

/** Vertical lift (px) for raid wave dragons so flight reads above the ground line */
export const RAID_WAVE_DRAGON_FLY_LIFT_PX = 220;
/** Raid wave UI stacks name/HP above the sprite anchor — lift feet to match battlefield */
export const RAID_WAVE_DRAGON_UI_OVERHEAD_PX = 72;

/**
 * Unified enemy positioning — shared by CleanBattlefieldSource and dragon QA previews.
 */
export function getBattlefieldEnemyPosition(
  index: number,
  total: number,
  isBoss: boolean = false,
  enemyType?: string,
  gameMode: 'idle' | 'dungeon' | 'raid' = 'idle'
): BattlefieldEnemyPosition {
  const screenWidth = 1920;
  const screenHeight = 1080;

  const heroZoneEnd = screenWidth * 0.6;
  const leftMargin = 150;
  const rightMargin = 150;
  const idleModeOffset = gameMode === 'idle' ? 150 : 0;

  const enemyStartX = heroZoneEnd + leftMargin + idleModeOffset;
  const maxX = screenWidth - rightMargin;
  const availableEnemyWidth = maxX - enemyStartX;
  const spacing = total > 1 ? availableEnemyWidth / (total - 1) : 0;
  const x = enemyStartX + index * spacing;
  const clampedX = Math.max(enemyStartX, Math.min(x, maxX));

  const scale = getBattlefieldSpriteScale({
    isBoss,
    enemyType,
    enemyName: enemyType,
  });
  const viewportPx = getEnemySpriteViewportPx({ enemyType, enemyName: enemyType });
  const spriteHeight = viewportPx * scale;
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
    const clampedBossX = Math.min(Math.max(bossX, minBossX), screenWidth - rightMargin);

    return {
      left: `${clampedBossX}px`,
      top: `${y}px`,
    };
  }

  const isCultist = enemyType === 'Cultist';

  if (gameMode === 'idle') {
    const downOffset = 96;
    y = screenHeight - spriteHeight - buffer + downOffset;
  } else {
    const downOffset = isCultist ? 192 : gameMode === 'dungeon' ? 140 : 96;
    y = screenHeight - spriteHeight - buffer + downOffset;
  }

  if (gameMode === 'raid' && isRaidWaveDragonType(enemyType)) {
    y -= RAID_WAVE_DRAGON_FLY_LIFT_PX + RAID_WAVE_DRAGON_UI_OVERHEAD_PX;
  }

  return {
    left: `${clampedX}px`,
    top: `${y}px`,
  };
}
