import { describe, expect, it } from 'vitest';
import {
  BATTLEFIELD_ENEMY_FACING,
  BATTLEFIELD_HERO_FACING,
  getSpriteContainerTransform,
  resolveEnemyFacingForSpriteOverride,
  resolveHeroFacingForSpriteOverride,
  shouldMirrorSpriteForFacing,
  shouldMirrorWithOverride,
} from './spriteFacing';
import { getHeroFacesLeft } from './spriteFacingConfig';
import { getEnemyFacesLeft } from './spriteFacingConfig';

describe('spriteFacing dragons', () => {
  it('wave dragons mirror to face left on battlefield', () => {
    expect(getEnemyFacesLeft('Dragon_1', 'Dragon Whelp')).toBe(false);
    expect(shouldMirrorSpriteForFacing('left', false)).toBe(true);
  });

  it('elder dragon sheet faces right; mirror on battlefield left', () => {
    expect(getEnemyFacesLeft('Elder Dragon', 'Elder Dragon')).toBe(false);
    expect(shouldMirrorSpriteForFacing('left', false)).toBe(true);
  });
});

describe('shouldMirrorSpriteForFacing', () => {
  it('mirrors native-left heroes toward screen-right', () => {
    expect(shouldMirrorSpriteForFacing('right', true)).toBe(true);
    expect(shouldMirrorSpriteForFacing('right', false)).toBe(false);
  });

  it('flip override inverts mirror', () => {
    expect(shouldMirrorWithOverride('right', false, true)).toBe(true);
    expect(shouldMirrorWithOverride('right', false, false)).toBe(false);
  });
});

describe('runtime override facing (live battlefield vs editor)', () => {
  it('uses canonical hero facing when a runtime override exists', () => {
    expect(resolveHeroFacingForSpriteOverride('left', true)).toBe(BATTLEFIELD_HERO_FACING);
    expect(resolveHeroFacingForSpriteOverride('left', false)).toBe('left');
  });

  it('uses canonical enemy facing when a runtime override exists', () => {
    expect(resolveEnemyFacingForSpriteOverride('right', true)).toBe(BATTLEFIELD_ENEMY_FACING);
    expect(resolveEnemyFacingForSpriteOverride('right', false)).toBe('right');
  });

  it('bard flip:true on live matches editor when override bypasses streamer pref', () => {
    const facesLeft = getHeroFacesLeft('bard');
    const editorTransform = getSpriteContainerTransform(3, BATTLEFIELD_HERO_FACING, facesLeft, {
      flip: true,
    });
    const liveBeforeFix = getSpriteContainerTransform(3, 'left', facesLeft, { flip: true });
    const liveAfterFix = getSpriteContainerTransform(
      3,
      resolveHeroFacingForSpriteOverride('left', true),
      facesLeft,
      { flip: true }
    );
    expect(liveAfterFix).toBe(editorTransform);
    expect(liveBeforeFix).not.toBe(editorTransform);
  });
});
