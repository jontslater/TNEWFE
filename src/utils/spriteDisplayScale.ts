/** Logical sprite viewport (feet anchor) in px before CSS scale */
export const SPRITE_VIEWPORT_PX = 48;

/** Taller logical box for 256×256 dragon cells with heavy top alpha padding */
export const RAID_WAVE_DRAGON_VIEWPORT_PX = 96;

/** Elder boss frames (725×445) — keep 48px box at 10× ≈ 480px on screen */
export const ELDER_DRAGON_VIEWPORT_PX = 48;

/** Standard mobs/heroes: ~144px on-screen (48 × 3) */
export const SPRITE_DISPLAY_SCALE = 3;

/** Raid wave dragons: 96px viewport × 3 ≈ 288px on screen (same target as former 48×6) */
export const RAID_WAVE_DRAGON_SCALE = 3;

/** Elder Dragon raid boss: per-frame 725×445 — dominant boss read (~480px viewport box) */
export const ELDER_DRAGON_BOSS_SCALE = 10;

export const SPRITE_TARGET_SCREEN_HEIGHT_PX = SPRITE_VIEWPORT_PX * SPRITE_DISPLAY_SCALE;

const RAID_WAVE_TYPES = new Set(['Dragon_1', 'Dragon_2', 'Dragon_3']);
const RAID_WAVE_NAMES = new Set(['Dragon Whelp', 'Dragon Guardian', 'Dragon Sentinel']);

export function isRaidWaveDragonType(enemyType?: string, enemyName?: string): boolean {
  if (enemyType && RAID_WAVE_TYPES.has(enemyType)) return true;
  if (enemyName && RAID_WAVE_NAMES.has(enemyName)) return true;
  if (enemyName?.startsWith('Dragon Whelp')) return true;
  if (enemyName?.startsWith('Dragon Guardian')) return true;
  if (enemyName?.startsWith('Dragon Sentinel')) return true;
  return false;
}

export function isElderDragonType(enemyType?: string, enemyName?: string): boolean {
  return enemyType === 'Elder Dragon' || enemyName === 'Elder Dragon';
}

export function getEnemySpriteViewportPx(options?: {
  enemyType?: string;
  enemyName?: string;
}): number {
  const { enemyType, enemyName } = options ?? {};
  if (isElderDragonType(enemyType, enemyName)) {
    return ELDER_DRAGON_VIEWPORT_PX;
  }
  if (isRaidWaveDragonType(enemyType, enemyName)) {
    return RAID_WAVE_DRAGON_VIEWPORT_PX;
  }
  return SPRITE_VIEWPORT_PX;
}

export function getBattlefieldSpriteScale(options?: {
  isBoss?: boolean;
  enemyType?: string;
  enemyName?: string;
}): number {
  const { enemyType, enemyName } = options ?? {};

  if (isElderDragonType(enemyType, enemyName)) {
    return ELDER_DRAGON_BOSS_SCALE;
  }
  if (isRaidWaveDragonType(enemyType, enemyName)) {
    return RAID_WAVE_DRAGON_SCALE;
  }

  return SPRITE_DISPLAY_SCALE;
}

/** Re-export for legacy Electron parity (standard mob scale) */
export const SPRITE_SCALE_FACTOR = SPRITE_DISPLAY_SCALE;
