import { describe, expect, it } from 'vitest';
import {
  computeEnemySpriteFrameLayout,
  getRaidWaveDragonContentTop,
} from './spriteEnemyFrameLayout';

describe('spriteEnemyFrameLayout', () => {
  it('uses flight content band for raid wave dragons', () => {
    expect(getRaidWaveDragonContentTop('flight')).toBe(109);
    const layout = computeEnemySpriteFrameLayout(256, 256, {
      enemyType: 'Dragon_1',
      animationName: 'flight',
    });
    expect(layout.scaleY).toBeCloseTo(96 / 256, 5);
    expect(layout.offsetY).toBeCloseTo(-109 * (96 / 256), 5);
  });

  it('fits idle dragon content into the viewport height', () => {
    const layout = computeEnemySpriteFrameLayout(256, 256, {
      enemyType: 'Dragon_2',
      animationName: 'idle',
    });
    expect(layout.scaleY).toBeCloseTo(96 / 256, 5);
    expect(layout.offsetY).toBeCloseTo(-167 * (96 / 256), 5);
  });
});
