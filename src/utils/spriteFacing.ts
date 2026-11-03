/**
 * Battlefield facing rules (Jonathan):
 * - Heroes (left side) face RIGHT toward enemies.
 * - Enemies / bosses / dragons (right side) face LEFT toward heroes.
 *
 * Sprite sheets may natively face left or right (`facesLeft` in config).
 * Use these helpers for container mirror (scaleX) with transformOrigin bottom center.
 */

export type ScreenFacing = 'left' | 'right';

export const BATTLEFIELD_HERO_FACING: ScreenFacing = 'right';
export const BATTLEFIELD_ENEMY_FACING: ScreenFacing = 'left';

/** Default when a sheet was drawn facing the left side of the frame (no mirror). */
export const DEFAULT_NATIVE_FACES_LEFT = false;

/**
 * Whether the outer sprite container should apply scaleX(-1) so the character
 * looks toward `desiredFacing` given native sheet orientation.
 */
export function shouldMirrorSpriteForFacing(
  desiredFacing: ScreenFacing,
  facesLeft: boolean
): boolean {
  // Mirror only when native sheet faces left but we need screen-right (typical LuizMelo heroes).
  // Enemies facing battlefield-left use native orientation without extra mirror (see spriteFacing.test.ts).
  return facesLeft && desiredFacing === 'right';
}

export function getSpriteContainerTransform(
  scale: number,
  desiredFacing: ScreenFacing,
  facesLeft: boolean = DEFAULT_NATIVE_FACES_LEFT
): string {
  if (shouldMirrorSpriteForFacing(desiredFacing, facesLeft)) {
    return `scale(${scale}) scaleX(-1)`;
  }
  return `scale(${scale})`;
}

/** User/streamer preference overrides default battlefield facing per role or enemy name. */
export function resolveBattlefieldFacing(
  side: 'hero' | 'enemy',
  preference?: ScreenFacing | null
): ScreenFacing {
  if (preference === 'left' || preference === 'right') {
    return preference;
  }
  return side === 'hero' ? BATTLEFIELD_HERO_FACING : BATTLEFIELD_ENEMY_FACING;
}
