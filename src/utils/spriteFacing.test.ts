import { describe, expect, it } from 'vitest';
import { shouldMirrorSpriteForFacing } from './spriteFacing';
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
});
