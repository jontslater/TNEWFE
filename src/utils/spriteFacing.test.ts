import { describe, expect, it } from 'vitest';
import { shouldMirrorSpriteForFacing } from './spriteFacing';
import { getEnemyFacesLeft } from './spriteFacingConfig';

describe('spriteFacing dragons', () => {
  it('wave dragons face left on battlefield without erroneous mirror', () => {
    expect(getEnemyFacesLeft('Dragon_1', 'Dragon Whelp')).toBe(false);
    expect(shouldMirrorSpriteForFacing('left', false)).toBe(false);
  });

  it('elder dragon native-left sheet faces left without mirror', () => {
    expect(getEnemyFacesLeft('Elder Dragon', 'Elder Dragon')).toBe(true);
    expect(shouldMirrorSpriteForFacing('left', true)).toBe(false);
  });
});
