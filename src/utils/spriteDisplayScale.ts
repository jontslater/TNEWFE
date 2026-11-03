/** Logical sprite viewport (feet anchor) in px before CSS scale */
export const SPRITE_VIEWPORT_PX = 48;

/** Uniform on-screen height: viewport × display scale (144px at 1080p battlefield) */
export const SPRITE_DISPLAY_SCALE = 3;

export const SPRITE_TARGET_SCREEN_HEIGHT_PX = SPRITE_VIEWPORT_PX * SPRITE_DISPLAY_SCALE;

export function getBattlefieldSpriteScale(_options?: {
  isBoss?: boolean;
  enemyType?: string;
  enemyName?: string;
}): number {
  return SPRITE_DISPLAY_SCALE;
}

/** Re-export for legacy Electron parity */
export const SPRITE_SCALE_FACTOR = SPRITE_DISPLAY_SCALE;
