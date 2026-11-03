import { SPRITE_VIEWPORT_PX } from './spriteDisplayScale';
import { HERO_IDLE_LAYOUT } from './heroSpriteLayout.generated';
import type { SpriteFrameLayout } from './spriteEnemyFrameLayout';

/** Visible body height target inside the 48px feet-anchor box (before CSS scale) */
export const HERO_TARGET_CONTENT_HEIGHT_PX = 40;

/**
 * Fit hero strip frame into the logical viewport, anchor opaque feet to the floor,
 * and normalize visible body height across classes.
 */
export function computeHeroSpriteFrameLayout(
  frameWidth: number,
  frameHeight: number,
  role: string
): SpriteFrameLayout {
  const viewportPx = SPRITE_VIEWPORT_PX;
  const layoutKey = role.toLowerCase();
  const idleLayout = HERO_IDLE_LAYOUT[layoutKey];

  let scaleX =
    frameWidth > viewportPx || frameHeight > viewportPx
      ? viewportPx / Math.max(frameWidth, frameHeight)
      : 1;
  let scaleY = scaleX;

  const contentBottom = idleLayout?.contentBottom ?? frameHeight - 1;
  const contentTop = idleLayout?.contentTop ?? 0;
  const contentHeight = Math.max(1, contentBottom - contentTop + 1);

  const scaledBody = contentHeight * scaleY;
  if (scaledBody > HERO_TARGET_CONTENT_HEIGHT_PX) {
    const shrink = HERO_TARGET_CONTENT_HEIGHT_PX / scaledBody;
    scaleX *= shrink;
    scaleY *= shrink;
  }

  const offsetX = (viewportPx - frameWidth * scaleX) / 2;
  const offsetY = viewportPx - (contentBottom + 1) * scaleY;

  return { scaleX, scaleY, offsetX, offsetY };
}
