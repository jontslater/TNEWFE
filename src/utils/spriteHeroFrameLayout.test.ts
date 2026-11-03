import { describe, expect, it } from 'vitest';
import { computeHeroSpriteFrameLayout } from './spriteHeroFrameLayout';
import { HERO_IDLE_LAYOUT } from './heroSpriteLayout.generated';
import { SPRITE_VIEWPORT_PX } from './spriteDisplayScale';

describe('computeHeroSpriteFrameLayout', () => {
  it('anchors measured feet to the viewport floor', () => {
    const frameHeight = 231;
    const layout = computeHeroSpriteFrameLayout(231, frameHeight, 'mage');
    const idle = HERO_IDLE_LAYOUT.mage;
    const feetY = layout.offsetY + (idle.contentBottom + 1) * layout.scaleY;
    expect(feetY).toBeCloseTo(SPRITE_VIEWPORT_PX, 4);
  });

  it('uses shared target height for tall LuizMelo frames', () => {
    const knight = computeHeroSpriteFrameLayout(180, 180, 'vanguard');
    const wizard = computeHeroSpriteFrameLayout(231, 231, 'mage');
    const knightBody = knight.scaleY * 180;
    const wizardBody = wizard.scaleY * 231;
    expect(knightBody).toBeLessThanOrEqual(48);
    expect(wizardBody).toBeLessThanOrEqual(48);
    expect(Math.abs(knight.scaleY - wizard.scaleY)).toBeLessThan(0.15);
  });
});
