import {
  getEnemySpriteViewportPx,
  isElderDragonType,
  isRaidWaveDragonType,
} from './spriteDisplayScale';

export interface SpriteFrameLayout {
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
}

/** Measured alpha bbox top (px) on 256×256 Dragon_* sheets */
export function getRaidWaveDragonContentTop(animationName: string): number {
  const key = animationName.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (key.includes('special')) return 0;
  if (key.includes('landing')) return 40;
  if (key.includes('flight')) return 109;
  if (key.includes('rise')) return 146;
  if (key.includes('death') || key.includes('dead')) return 176;
  if (key.includes('walk')) return 172;
  if (key.includes('attack')) return 167;
  if (key.includes('hurt')) return 167;
  return 167;
}

/** Measured alpha bbox on Elder Dragon idleBattle frames (725×445) */
const ELDER_DRAGON_CONTENT_TOP = 56;

function defaultFrameLayout(
  frameWidth: number,
  frameHeight: number,
  viewportPx: number
): SpriteFrameLayout {
  const scaleX = frameWidth > viewportPx ? viewportPx / frameWidth : 1;
  const scaleY = frameHeight > viewportPx ? viewportPx / frameHeight : 1;
  return {
    scaleX,
    scaleY,
    offsetX: (viewportPx - frameWidth * scaleX) / 2,
    offsetY: viewportPx - frameHeight * scaleY,
  };
}

/**
 * Fit the full frame into the logical viewport, then pan up so visible art (alpha bbox)
 * fills the box. Keeps scale ≤ 1 and feet aligned to the viewport floor.
 */
export function computeEnemySpriteFrameLayout(
  frameWidth: number,
  frameHeight: number,
  options: {
    enemyType?: string;
    enemyName?: string;
    animationName?: string;
    /** Editor card previews: fit full frame with feet on floor (no bbox pan) */
    editorCardPreview?: boolean;
  }
): SpriteFrameLayout {
  const { enemyType, enemyName, animationName = 'idle', editorCardPreview } = options;
  const viewportPx = getEnemySpriteViewportPx({ enemyType, enemyName });

  if (editorCardPreview) {
    return defaultFrameLayout(frameWidth, frameHeight, viewportPx);
  }

  if (isRaidWaveDragonType(enemyType, enemyName)) {
    const contentTop = getRaidWaveDragonContentTop(animationName);
    const scaleX = viewportPx / frameWidth;
    const scaleY = viewportPx / frameHeight;
    return {
      scaleX,
      scaleY,
      offsetX: (viewportPx - frameWidth * scaleX) / 2,
      offsetY: -contentTop * scaleY,
    };
  }

  if (isElderDragonType(enemyType, enemyName)) {
    const scaleX = viewportPx / frameWidth;
    const scaleY = viewportPx / frameHeight;
    return {
      scaleX,
      scaleY,
      offsetX: (viewportPx - frameWidth * scaleX) / 2,
      offsetY: -ELDER_DRAGON_CONTENT_TOP * scaleY,
    };
  }

  return defaultFrameLayout(frameWidth, frameHeight, viewportPx);
}
