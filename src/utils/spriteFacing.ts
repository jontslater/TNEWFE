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
  return facesLeft !== (desiredFacing === 'left');
}

export function shouldMirrorWithOverride(
  desiredFacing: ScreenFacing,
  facesLeft: boolean,
  flipOverride?: boolean
): boolean {
  const base = shouldMirrorSpriteForFacing(desiredFacing, facesLeft);
  return flipOverride ? !base : base;
}

export function getSpriteContainerTransform(
  scale: number,
  desiredFacing: ScreenFacing,
  facesLeft: boolean = DEFAULT_NATIVE_FACES_LEFT,
  options?: { flip?: boolean; scaleMultiplier?: number }
): string {
  const flip = options?.flip === true;
  const scaleMult = options?.scaleMultiplier ?? 1;
  const finalScale = scale * scaleMult;
  if (shouldMirrorWithOverride(desiredFacing, facesLeft, flip)) {
    return `scale(${finalScale}) scaleX(-1)`;
  }
  return `scale(${finalScale})`;
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

/**
 * Global Firestore sprite overrides are authored in /battlefield-facing against
 * canonical battlefield facing. Streamer per-class prefs must not change mirror
 * math when an override exists, or saved flip/scale won't match live sprites.
 */
export function resolveHeroFacingForSpriteOverride(
  preference: ScreenFacing | null | undefined,
  hasRuntimeOverride: boolean
): ScreenFacing {
  if (hasRuntimeOverride) {
    return BATTLEFIELD_HERO_FACING;
  }
  return resolveBattlefieldFacing('hero', preference);
}

export function resolveEnemyFacingForSpriteOverride(
  preference: ScreenFacing | null | undefined,
  hasRuntimeOverride: boolean
): ScreenFacing {
  if (hasRuntimeOverride) {
    return BATTLEFIELD_ENEMY_FACING;
  }
  return resolveBattlefieldFacing('enemy', preference);
}
