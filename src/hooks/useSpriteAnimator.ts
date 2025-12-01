import { useRef, useEffect, useCallback, useImperativeHandle, Ref } from 'react';
import { getAnimationData, getSpriteConfig, AnimationData } from '../utils/spriteAnimationData';

export interface SpriteAnimatorHandle {
  playAnimation: (name: string) => void;
  setSpriteImage: (url: string) => void;
  getCurrentAnimation: () => string;
}

// Internal handle for the hook
interface InternalHandle {
  playAnimation: (name: string) => void;
  setSpriteImage: (url: string) => void;
  getCurrentAnimation: () => string;
}

interface UseSpriteAnimatorOptions {
  enemyType: string;
  initialAnimation?: string;
  onAnimationComplete?: (animationName: string) => void;
}

export function useSpriteAnimator(
  options: UseSpriteAnimatorOptions,
  ref?: Ref<SpriteAnimatorHandle | null>
) {
  const { enemyType, initialAnimation = 'idle', onAnimationComplete } = options;
  
  const spriteRef = useRef<HTMLDivElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const currentAnim = useRef<string>(initialAnimation);
  const currentFrame = useRef<number>(0);
  const elapsed = useRef<number>(0);
  const spriteConfig = useRef<ReturnType<typeof getSpriteConfig>>(null);
  const currentAnimData = useRef<AnimationData | null>(null);
  const backgroundImageUrl = useRef<string>('');

  // Initialize sprite config
  useEffect(() => {
    spriteConfig.current = getSpriteConfig(enemyType);
    if (spriteConfig.current && spriteRef.current) {
      const animData = getAnimationData(enemyType, initialAnimation);
      if (animData) {
        currentAnimData.current = animData;
        backgroundImageUrl.current = animData.spritePath;
        
        // CRITICAL FIX: Set element size and background-size based on animation frame dimensions
        // This prevents zoom issues by ensuring consistent sizing
        const frameWidth = spriteConfig.current.frameWidth;
        const frameHeight = spriteConfig.current.frameHeight;
        const totalSheetWidth = animData.frames * frameWidth;
        
        spriteRef.current.style.width = `${frameWidth}px`;
        spriteRef.current.style.height = `${frameHeight}px`;
        spriteRef.current.style.backgroundImage = `url('${animData.spritePath}')`;
        spriteRef.current.style.backgroundSize = `${totalSheetWidth}px auto`;
        spriteRef.current.style.backgroundPosition = '0px 0px';
        spriteRef.current.style.transition = 'none';
        spriteRef.current.style.setProperty('transition', 'none', 'important');
        spriteRef.current.style.willChange = 'background-position';
      }
    }
  }, [enemyType, initialAnimation]);

  const playAnimation = useCallback((name: string) => {
    const animData = getAnimationData(enemyType, name);
    if (!animData || !spriteRef.current || !spriteConfig.current) {
      return;
    }

    // Reset animation state
    currentAnim.current = name;
    currentAnimData.current = animData;
    currentFrame.current = 0;
    elapsed.current = 0;

    // If switching to a different animation, update sprite sheet and element size
    if (animData.spritePath !== backgroundImageUrl.current) {
      backgroundImageUrl.current = animData.spritePath;
      spriteRef.current.style.backgroundImage = `url('${animData.spritePath}')`;
      
      // Update background-size to match new sprite sheet
      const totalSheetWidth = animData.frames * spriteConfig.current.frameWidth;
      spriteRef.current.style.backgroundSize = `${totalSheetWidth}px auto`;
      
      // FIX: Update element size to match frame dimensions (prevents zoom effect)
      // This ensures idle, attack, hurt all appear the same size
      spriteRef.current.style.width = `${spriteConfig.current.frameWidth}px`;
      spriteRef.current.style.height = `${spriteConfig.current.frameHeight}px`;
    }

    // CRITICAL: Set initial frame position immediately with no transitions (prevents flicker and scrolling)
    spriteRef.current.style.transition = 'none';
    spriteRef.current.style.setProperty('transition', 'none', 'important');
    spriteRef.current.style.willChange = 'background-position';
    
    // Calculate exact pixel position for frame 0
    const x = -(currentFrame.current * spriteConfig.current.frameWidth);
    
    // Use setProperty with important to override any CSS
    spriteRef.current.style.setProperty('background-position', `${x}px 0px`, 'important');
    
    // Force immediate reflow to commit the change
    void spriteRef.current.offsetWidth;
  }, [enemyType]);

  const setSpriteImage = useCallback((url: string) => {
    if (spriteRef.current) {
      backgroundImageUrl.current = url;
      spriteRef.current.style.backgroundImage = `url('${url}')`;
    }
  }, []);

  const animate = useCallback((timestamp: number) => {
    if (!spriteRef.current || !spriteConfig.current || !currentAnimData.current) {
      requestRef.current = requestAnimationFrame(animate);
      return;
    }

    // Initialize elapsed time on first frame
    if (!elapsed.current) elapsed.current = timestamp;

    const delta = timestamp - elapsed.current;
    const frameDuration = 1000 / currentAnimData.current.fps;

    // CRITICAL FIX: Only update position when we actually advance to the next frame
    // This prevents scrolling/sliding by ensuring we only change position on frame boundaries
    if (delta >= frameDuration) {
      elapsed.current = timestamp;
      currentFrame.current++;

      // Check if animation finished
      if (currentFrame.current >= currentAnimData.current.frames) {
        if (currentAnimData.current.loop) {
          // Loop back to start
          currentFrame.current = 0;
        } else {
          // Non-looping animation finished
          const finishedAnim = currentAnim.current;
          
          // Auto-return to idle (except for death)
          if (finishedAnim !== 'death') {
            const idleData = getAnimationData(enemyType, 'idle');
            if (idleData) {
              currentAnim.current = 'idle';
              currentAnimData.current = idleData;
              currentFrame.current = 0;
              
              // Update sprite sheet and size if needed
              if (idleData.spritePath !== backgroundImageUrl.current && spriteRef.current) {
                backgroundImageUrl.current = idleData.spritePath;
                spriteRef.current.style.backgroundImage = `url('${idleData.spritePath}')`;
                const totalSheetWidth = idleData.frames * spriteConfig.current.frameWidth;
                spriteRef.current.style.backgroundSize = `${totalSheetWidth}px auto`;
                
                // FIX: Update element size to match frame dimensions (prevents zoom effect)
                spriteRef.current.style.width = `${spriteConfig.current.frameWidth}px`;
                spriteRef.current.style.height = `${spriteConfig.current.frameHeight}px`;
              }
            }
          } else {
            // Death animation - stay on last frame
            currentFrame.current = currentAnimData.current.frames - 1;
          }

          // Call completion callback
          if (onAnimationComplete) {
            onAnimationComplete(finishedAnim);
          }
        }
      }

      // CRITICAL: Only update background position when we advance frames (not every rAF tick)
      // Disable all transitions and use will-change for performance
      spriteRef.current.style.transition = 'none';
      spriteRef.current.style.setProperty('transition', 'none', 'important');
      spriteRef.current.style.willChange = 'background-position';
      
      // Calculate exact pixel position for current frame (must be exact frame boundary)
      const x = -(currentFrame.current * spriteConfig.current.frameWidth);
      
      // Use setProperty with important to override any CSS that might cause interpolation
      spriteRef.current.style.setProperty('background-position', `${x}px 0px`, 'important');
      
      // Force immediate reflow to commit the change before next paint
      void spriteRef.current.offsetWidth;
    }

    // Continue animation loop
    requestRef.current = requestAnimationFrame(animate);
  }, [enemyType, onAnimationComplete]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [animate]);

  // Expose API via ref (if provided)
  useImperativeHandle(ref, (): SpriteAnimatorHandle => ({
    playAnimation,
    setSpriteImage,
    getCurrentAnimation: () => currentAnim.current,
  }), [playAnimation, setSpriteImage]);

  return {
    spriteRef,
    playAnimation,
    getCurrentAnimation: () => currentAnim.current,
  };
}
