import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { getHeroAnimations } from "../utils/spriteAnimationData";

export interface AnimationData {
  name: string;
  sheet: string;      // spriteSheet path
  frames: number;     // frameCount
  duration: number;   // duration in ms
  loop: boolean;      // whether animation loops
  frameWidth: number; // frameWidth from spriteAnimationData
  frameHeight: number; // frameHeight from spriteAnimationData
}

export interface UseHeroAnimatorProps {
  role: string;
  defaultAnimationName?: string;
}

export interface UseHeroAnimatorReturn {
  currentAnimation: AnimationData | null;
  playAnimation: (name: string) => void;
  onComplete: () => void;
}

/**
 * Unified hook that manages hero animation state.
 * Converts SpriteAnimationData to AnimationData format and handles all animation logic.
 */
export function useHeroAnimator({
  role,
  defaultAnimationName = "idle",
}: UseHeroAnimatorProps): UseHeroAnimatorReturn {
  // Get raw animations from spriteAnimationData
  const rawAnimations = getHeroAnimations(role);
  
  // Helper to convert SpriteAnimationData to AnimationData
  const convertAnimations = useCallback((raw: typeof rawAnimations): Record<string, AnimationData> => {
    if (!raw) return {};
    
    const converted: Record<string, AnimationData> = {};
    for (const [name, data] of Object.entries(raw)) {
      // Determine if animation should loop (idle, walk, and run loop for continuous movement)
      const loop = name === 'idle' || name === 'walk' || name === 'run';
      
      converted[name] = {
        name,
        sheet: data.spriteSheet,
        frames: data.frameCount,
        duration: data.duration,
        loop,
        frameWidth: data.frameWidth,
        frameHeight: data.frameHeight,
      };
    }
    return converted;
  }, []);
  
  // Convert animations - initialize synchronously if possible
  const animations = useMemo(() => convertAnimations(rawAnimations), [rawAnimations, convertAnimations]);
  
  // Get default animation
  const defaultAnimation = animations[defaultAnimationName] || 
                           animations['idle'] || 
                           Object.values(animations)[0] || 
                           null;

  const [currentAnimation, setCurrentAnimation] = useState<AnimationData | null>(defaultAnimation);
  const animationRef = useRef<AnimationData | null>(defaultAnimation);
  const isPlayingRef = useRef(false);
  
  // Update animation ref when animations change
  useEffect(() => {
    if (defaultAnimation && !currentAnimation) {
      setCurrentAnimation(defaultAnimation);
      animationRef.current = defaultAnimation;
    }
  }, [defaultAnimation, currentAnimation]);

  const playAnimation = useCallback((name: string) => {
    const animation = animations[name];
    if (!animation) {
      return;
    }

    // Interrupt rules: death blocks all, hurt interrupts non-death
    if (animationRef.current?.name === "death" && name !== "death") {
      return;
    }
    
    if (animationRef.current?.name === "hurt" && name !== "death" && name !== "hurt") {
      return;
    }

    animationRef.current = animation;
    setCurrentAnimation(animation);
    isPlayingRef.current = true;
  }, [role, animations]);

  const onComplete = useCallback(() => {
    isPlayingRef.current = false;
    
    // Auto-return to idle after non-looping animations (except death and idle itself)
    if (animationRef.current && animationRef.current.name !== "idle" && animationRef.current.name !== "death") {
      const idleAnimation = animations['idle'] || defaultAnimation;
      if (idleAnimation) {
        setCurrentAnimation(idleAnimation);
        animationRef.current = idleAnimation;
      }
    }
  }, [animations, defaultAnimation]);

  // Update animationRef when currentAnimation changes
  useEffect(() => {
    if (currentAnimation) {
      animationRef.current = currentAnimation;
    }
  }, [currentAnimation]);

  return {
    currentAnimation,
    playAnimation,
    onComplete,
  };
}
