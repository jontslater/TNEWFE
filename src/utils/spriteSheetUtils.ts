import { getStripSheetDimensions } from './spriteSheetDimensions.generated';

export interface StripAnimLike {
  frameCount: number;
  frameWidth: number;
  frameHeight: number;
  duration: number;
  spriteSheet: string;
}

const INDIVIDUAL_FRAME_MARKERS = ['/001.png', '/01.png', '_0000.png', '_0001.png'];

export function isIndividualFrameSequence(spriteSheet: string): boolean {
  return (
    INDIVIDUAL_FRAME_MARKERS.some((m) => spriteSheet.includes(m)) ||
    /\/[^/]+_\d\.png$/.test(spriteSheet)
  );
}

/**
 * Apply measured strip dimensions from spriteSheetDimensions.generated.ts
 */
export function applyStripDimensions<T extends StripAnimLike>(anim: T): T {
  if (isIndividualFrameSequence(anim.spriteSheet)) {
    return anim;
  }
  try {
    const dims = getStripSheetDimensions(anim.spriteSheet, anim.frameCount);
    return {
      ...anim,
      frameWidth: dims.frameWidth,
      frameHeight: dims.frameHeight,
      frameCount: dims.frameCount,
    };
  } catch {
    return anim;
  }
}

export function hydrateAnimationCatalog(
  catalog: Record<string, Record<string, StripAnimLike>>
): void {
  for (const group of Object.values(catalog)) {
    for (const [name, anim] of Object.entries(group)) {
      group[name] = applyStripDimensions(anim);
    }
  }
}
