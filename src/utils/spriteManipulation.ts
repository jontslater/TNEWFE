/**
 * Sprite Manipulation Utilities
 * Based on IdleDnD game.js sprite manipulation system
 */

export interface SpriteLayout {
  containerWidth?: number;
  containerHeight?: number;
  spriteWidth?: number;
  spriteHeight?: number;
  spriteScale?: number;
  spriteOffsetX?: number;
  spriteOffsetY?: number;
  facingDirection?: 'left' | 'right';
  battlefieldX?: number;
  battlefieldY?: number;
  hpBar?: {
    top: number;
    left: number;
    width?: number;
  };
  hpText?: {
    top: number;
    left: number;
  };
  buffOffsetY?: number;
  debuffOffsetY?: number;
}

/**
 * Apply sprite layout to a container element
 * Similar to applyLayoutToTestSprite from IdleDnD game.js
 */
export function applySpriteLayout(container: HTMLElement, layout: SpriteLayout): void {
  if (!container) return;

  // Apply container dimensions
  if (layout.containerWidth !== undefined) {
    container.style.width = `${layout.containerWidth}px`;
  }
  if (layout.containerHeight !== undefined) {
    container.style.height = `${layout.containerHeight}px`;
  }

  // Apply sprite image transform (scale + offset)
  const spriteImg = container.querySelector('.sprite-img') || 
                   container.querySelector('.kobold-sprite') || 
                   container.querySelector('.npc-sprite') ||
                   container.querySelector('.enemy-sprite .sprite-img') ||
                   container.querySelector('.sprite-container .sprite-img');

  if (spriteImg && spriteImg instanceof HTMLElement) {
    const scale = layout.spriteScale || 2.5;
    const offsetX = layout.spriteOffsetX || 0;
    const offsetY = layout.spriteOffsetY || 0;

    // Apply width and height if specified
    if (layout.spriteWidth !== undefined && layout.spriteWidth !== null) {
      spriteImg.style.setProperty('width', `${layout.spriteWidth}px`, 'important');
      spriteImg.style.setProperty('min-width', `${layout.spriteWidth}px`, 'important');
      spriteImg.style.setProperty('max-width', `${layout.spriteWidth}px`, 'important');
    } else {
      spriteImg.style.removeProperty('width');
      spriteImg.style.removeProperty('min-width');
      spriteImg.style.removeProperty('max-width');
    }

    if (layout.spriteHeight !== undefined && layout.spriteHeight !== null) {
      spriteImg.style.setProperty('height', `${layout.spriteHeight}px`, 'important');
      spriteImg.style.setProperty('min-height', `${layout.spriteHeight}px`, 'important');
      spriteImg.style.setProperty('max-height', `${layout.spriteHeight}px`, 'important');
    } else {
      spriteImg.style.removeProperty('height');
      spriteImg.style.removeProperty('min-height');
      spriteImg.style.removeProperty('max-height');
    }

    // Ensure transform-origin stays at center
    spriteImg.style.setProperty('transform-origin', 'center center', 'important');

    // Apply transform with facing direction
    const facingDirection = layout.facingDirection || 'right';
    if (facingDirection === 'left') {
      spriteImg.style.setProperty('transform', `translate(${offsetX}px, ${offsetY}px) scale(${scale}) scaleX(-1)`, 'important');
    } else {
      spriteImg.style.setProperty('transform', `translate(${offsetX}px, ${offsetY}px) scale(${scale})`, 'important');
    }
  }

  // Apply HP bar position
  if (layout.hpBar) {
    const hpBar = container.querySelector('.battle-sprite-hp-bar') || 
                  container.querySelector('.hp-bar');
    if (hpBar && hpBar instanceof HTMLElement) {
      hpBar.style.position = 'absolute';
      hpBar.style.top = `${layout.hpBar.top}px`;
      hpBar.style.left = `${layout.hpBar.left}px`;
      if (layout.hpBar.width !== undefined) {
        hpBar.style.width = `${layout.hpBar.width}px`;
      }
    }
  }

  // Apply HP text position
  if (layout.hpText) {
    const hpText = container.querySelector('.battle-sprite-hp-text') || 
                   container.querySelector('.hp-text');
    if (hpText && hpText instanceof HTMLElement) {
      hpText.style.position = 'absolute';
      hpText.style.top = `${layout.hpText.top}px`;
      hpText.style.left = `${layout.hpText.left}px`;
    }
  }
}

/**
 * Apply sprite transform (scale + offset, preserving facing direction)
 * Similar to applySpriteTransform from IdleDnD game.js
 */
export function applySpriteTransform(container: HTMLElement, layout: SpriteLayout): void {
  if (!container) return;

  const spriteImg = container.querySelector('.sprite-img') || 
                   container.querySelector('.kobold-sprite') || 
                   container.querySelector('.npc-sprite') ||
                   container.querySelector('.enemy-sprite .sprite-img') ||
                   container.querySelector('.sprite-container .sprite-img');

  if (!spriteImg || !(spriteImg instanceof HTMLElement)) return;

  const scale = layout.spriteScale || 2.5;
  const offsetX = layout.spriteOffsetX || 0;
  const offsetY = layout.spriteOffsetY || 0;
  const facingDirection = layout.facingDirection || 'right';

  // Apply width and height if specified
  if (layout.spriteWidth !== undefined && layout.spriteWidth !== null) {
    spriteImg.style.setProperty('width', `${layout.spriteWidth}px`, 'important');
    spriteImg.style.setProperty('min-width', `${layout.spriteWidth}px`, 'important');
    spriteImg.style.setProperty('max-width', `${layout.spriteWidth}px`, 'important');
  } else {
    spriteImg.style.removeProperty('width');
    spriteImg.style.removeProperty('min-width');
    spriteImg.style.removeProperty('max-width');
  }

  if (layout.spriteHeight !== undefined && layout.spriteHeight !== null) {
    spriteImg.style.setProperty('height', `${layout.spriteHeight}px`, 'important');
    spriteImg.style.setProperty('min-height', `${layout.spriteHeight}px`, 'important');
    spriteImg.style.setProperty('max-height', `${layout.spriteHeight}px`, 'important');
  } else {
    spriteImg.style.removeProperty('height');
    spriteImg.style.removeProperty('min-height');
    spriteImg.style.removeProperty('max-height');
  }

  // Ensure transform-origin stays at center
  spriteImg.style.setProperty('transform-origin', 'center center', 'important');

  // Apply transform with facing direction
  if (facingDirection === 'left') {
    spriteImg.style.setProperty('transform', `translate(${offsetX}px, ${offsetY}px) scale(${scale}) scaleX(-1)`, 'important');
  } else {
    spriteImg.style.setProperty('transform', `translate(${offsetX}px, ${offsetY}px) scale(${scale})`, 'important');
  }
}

/**
 * Load sprite layout from localStorage
 */
export function loadSpriteLayout(spriteKey: string): SpriteLayout | null {
  try {
    const saved = localStorage.getItem(`spriteLayout_${spriteKey}`);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    console.error(`Failed to load sprite layout for ${spriteKey}:`, e);
    return null;
  }
}

/**
 * Save sprite layout to localStorage
 */
export function saveSpriteLayout(spriteKey: string, layout: SpriteLayout): void {
  try {
    localStorage.setItem(`spriteLayout_${spriteKey}`, JSON.stringify(layout));
  } catch (e) {
    console.error(`Failed to save sprite layout for ${spriteKey}:`, e);
  }
}
