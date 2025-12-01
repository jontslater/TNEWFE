import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  Ref,
  CSSProperties,
} from 'react';
import { ENEMY_SPRITES, SPRITE_SCALE_FACTOR, getEnemySpriteImageClass, EnemyAnimationType } from '../utils/enemySpriteConfig';

type AnimationName = EnemyAnimationType | string;

export interface EnemySpriteHandle {
  playAnimation: (animation: AnimationName, options?: { frames?: number }) => Promise<void>;
  setSpriteImage: (url: string, backgroundSize?: string) => void;
}

interface Props {
  enemyId: string;
  enemyType: string;
  spriteUrl: string;
  frameWidth?: number; // px
  frameCount?: number;
  className?: string;
  facing?: 'left' | 'right';
  style?: CSSProperties;
}

const animationClassFor = (name: AnimationName) => `anim-${name}`;

const EnemySprite = forwardRef<EnemySpriteHandle, Props>(function EnemySprite(
  props,
  ref: Ref<EnemySpriteHandle | null>
) {
  const {
    enemyId,
    enemyType,
    spriteUrl,
    frameWidth = 48,
    frameCount = 6,
    className,
    facing = 'left',
    style,
  } = props;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const spriteRef = useRef<HTMLDivElement | null>(null);

  // Expose API to parent via ref
  useImperativeHandle(ref, () => ({
    playAnimation: (animation: AnimationName, options?: { frames?: number }) => {
      return new Promise<void>((resolve) => {
        const spriteEl = spriteRef.current;
        const root = rootRef.current;
        if (!spriteEl || !root) {
          console.debug(`[EnemySprite] missing elements for ${enemyId}`);
          resolve();
          return;
        }

        const animClass = animationClassFor(animation);
        const frames = options?.frames ?? frameCount;

        // Special case: Lizardman hurt animation starts from frame 2 (skip transparent first frame)
        // For other animations, start from frame 1 (0px 0px)
        const isLizardmanHurt = enemyType === 'Lizardman' && animation === 'hurt';
        const initialPosition = isLizardmanHurt ? '-48px 0px' : '0px 0px';

        // CRITICAL FIX: Stop current animation and lock to target frame BEFORE any class changes
        // This prevents the browser from showing an intermediate frame during transition
        // Step 1: Stop any running animation immediately (prevents idle from continuing)
        spriteEl.style.animation = 'none';
        spriteEl.style.transition = 'none';
        spriteEl.style.setProperty('transition', 'none', 'important');
        
        // Step 2: Set background-position to the first frame of the TARGET animation synchronously
        // This ensures the sprite shows the correct frame even before the animation class is applied
        spriteEl.style.backgroundPosition = initialPosition;
        
        // Step 3: Force immediate reflow to commit the background-position BEFORE removing classes
        // This is critical - the browser must paint the target frame before we change classes
        void spriteEl.offsetWidth;
        
        // Step 4: Now remove old animation classes (sprite is already showing target frame)
        Array.from(root.classList)
          .filter((c) => c.startsWith('anim-'))
          .forEach((c) => root.classList.remove(c));

        // Step 5: Force another reflow to ensure class removal is processed
        void spriteEl.offsetWidth;

        // Step 6: Add new animation class SYNCHRONOUSLY (not in RAF) to minimize delay
        // The sprite is already at the correct starting position, so this should be instant
        root.classList.add(animClass);
        
        // Step 7: Ensure background-position is still correct (defensive)
        spriteEl.style.backgroundPosition = initialPosition;
        void spriteEl.offsetWidth;

        // Compute duration from CSS var or fallback (moved outside RAF for synchronous execution)
        // The CSS below sets --anim-duration-<name> variables; we try to read them
        const computed = window.getComputedStyle(root);
        // Try to read a CSS variable (e.g. --anim-duration-hurt), else fallback
        const cssVarName = `--anim-duration-${animation}`;
        let durationMs = 0;
        const cssVar = computed.getPropertyValue(cssVarName).trim();
        if (cssVar) {
          // Expect something like "0.4s" or "400ms"
          if (cssVar.endsWith('ms')) durationMs = parseFloat(cssVar);
          else if (cssVar.endsWith('s')) durationMs = parseFloat(cssVar) * 1000;
        }
        // fallback durations for all animation types
        if (!durationMs) {
          // Core animations
          if (animation === 'idle') durationMs = 1800;
          else if (animation === 'hurt') durationMs = 400;
          else if (animation === 'death') durationMs = 1000;
          // Attack variants
          else if (animation === 'attack' || animation === 'attack1') durationMs = 600;
          else if (animation === 'attack2') durationMs = 600;
          else if (animation === 'attack3') durationMs = 720;
          else if (animation === 'strongAttack') durationMs = 1440;
          // Special animations
          else if (animation === 'transformation') durationMs = 960;
          else if (animation === 'idleHuman') durationMs = 1800;
          else if (animation === 'flying') durationMs = 480;
          else if (animation === 'transition') durationMs = 360;
          // Projectile animations
          else if (animation === 'projectile') durationMs = 720;
          else if (animation === 'projectileDiagonal') durationMs = 720;
          // Movement animations
          else if (animation === 'walk') durationMs = 1200;
          else if (animation === 'run') durationMs = 960;
          else if (animation === 'dash') durationMs = 840;
          else if (animation === 'jump') durationMs = 360;
          else if (animation === 'move') durationMs = 720;
          else if (animation === 'appear') durationMs = 1920;
          // Default fallback
          else durationMs = 500;
        }

        // Resolve after animation completes. If animation uses forwards (stay on last),
        // we still resolve after the duration.
        setTimeout(() => {
          // For 'idle' we keep it running, for others we may switch back to idle externally.
          resolve();
        }, durationMs + 30); // small buffer
      });
    },

    setSpriteImage: (url: string, backgroundSize?: string) => {
      const spriteEl = spriteRef.current;
      if (!spriteEl) return;
      spriteEl.style.backgroundImage = `url('${url}')`;
      if (backgroundSize) spriteEl.style.backgroundSize = backgroundSize;
      // ensure a fresh start
      spriteEl.style.backgroundPosition = '0px 0px';
      spriteEl.style.transition = 'none';
      spriteEl.style.setProperty('transition', 'none', 'important');
    },
  }));

  // set initial sprite on mount and start idle animation
  useEffect(() => {
    if (!spriteRef.current || !rootRef.current) return;
    const el = spriteRef.current;
    const root = rootRef.current;
    
    el.style.backgroundImage = `url('${spriteUrl}')`;
    // background size expected to be frameCount * frameWidth for width, frameHeight for height
    el.style.backgroundSize = `${frameCount * frameWidth}px auto`;
    el.style.backgroundPosition = '0px 0px';
    el.style.transition = 'none';
    el.style.setProperty('transition', 'none', 'important');
    
    // Start with idle animation on mount
    requestAnimationFrame(() => {
      if (root && el) {
        root.classList.add('anim-idle');
      }
    });
  }, [spriteUrl, frameCount, frameWidth]);

  const spriteConfig = ENEMY_SPRITES[enemyType];
  const spriteSize = spriteConfig?.spriteSize || frameWidth;
  const baseScale = SPRITE_SCALE_FACTOR;
  const extraScale = enemyType === 'Headless Horseman' ? 1.3 : 1.0;
  const scale = baseScale * extraScale;
  const scaleX = facing === 'left' ? -1 : 1;
  const imageClass = getEnemySpriteImageClass(enemyType);

  return (
    <div
      id={`battle-enemy-${enemyId}`}
      data-enemy-id={enemyId}
      data-enemy-type={enemyType}
      ref={rootRef}
      className={`sprite-container enemy-sprite-container ${imageClass}-container ${className ?? ''}`}
      style={{
        width: `${spriteSize * scale}px`,
        height: `${spriteSize * scale}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // Flip horizontally if facing left
        transform: `scale(${scale}) scaleX(${scaleX})`,
        transformOrigin: 'center center',
        ...style,
      }}
    >
      <div
        ref={spriteRef}
        className={`sprite-img ${imageClass}`}
        aria-hidden="true"
        style={{
          width: `${spriteSize}px`,
          height: `${spriteSize}px`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: '0px 0px',
          imageRendering: 'pixelated',
          marginBottom: '15px',
          flexShrink: '0',
          // defensive inline style so React writes it directly
          transition: 'none',
        }}
      />
    </div>
  );
});

export default EnemySprite;
