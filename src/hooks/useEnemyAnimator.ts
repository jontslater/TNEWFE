import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { getEnemyAnimations } from "../utils/spriteAnimationData";
import { ENEMY_SPRITES, EnemyAnimationType } from "../utils/enemySpriteConfig";

export interface AnimationData {
  name: string;
  sheet: string;      // spriteSheet path
  frames: number;     // frameCount
  duration: number;   // duration in ms
  loop: boolean;      // whether animation loops
  frameWidth: number; // frameWidth from spriteAnimationData
  frameHeight: number; // frameHeight from spriteAnimationData
}

export interface UseEnemyAnimatorProps {
  enemyName: string;
  defaultAnimationName?: string;
}

export interface UseEnemyAnimatorReturn {
  currentAnimation: AnimationData | null;
  playAnimation: (name: string) => void;
  onComplete: () => void;
}

/**
 * Unified hook that manages animation state and handles attack variant selection.
 * Converts SpriteAnimationData to AnimationData format and handles all animation logic.
 */
export function useEnemyAnimator({
  enemyName,
  defaultAnimationName = "idle",
}: UseEnemyAnimatorProps): UseEnemyAnimatorReturn {
  // Get raw animations from spriteAnimationData
  const rawAnimations = getEnemyAnimations(enemyName);
  
  // Helper to convert SpriteAnimationData to AnimationData
  const convertAnimations = useCallback((raw: typeof rawAnimations): Record<string, AnimationData> => {
    if (!raw) return {};
    
    const converted: Record<string, AnimationData> = {};
    for (const [name, data] of Object.entries(raw)) {
      // Determine if animation should loop
      const loop = name === 'idle' || 
                   name === 'walk' || 
                   name === 'run' || 
                   name === 'move' || 
                   name === 'flying' ||
                   name === 'idleHuman';
      
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

  /**
   * Select attack variant based on enemy config
   * TEMPORARILY DISABLED: Focus on getting single "attack" animation working first
   */
  const selectAttackVariant = useCallback((name: string): string => {
    if (name !== 'attack') return name;
    
    // TEMPORARY: Always return 'attack' to focus on one animation
    // TODO: Re-enable variant selection after attack animation is fixed
    return 'attack';
    
    /* DISABLED FOR NOW
    const enemyConfig = ENEMY_SPRITES[enemyName];
    if (!enemyConfig) return 'attack';
    
    // Adult Dragon: Randomize between attack (13 frames) and attack2 (17 frames)
    if (enemyName === 'Adult Dragon') {
      return Math.random() < 0.5 ? 'attack' : 'attack2';
    }
    
    const availableAttacks: EnemyAnimationType[] = [];
    if (enemyConfig.animations?.attack) availableAttacks.push('attack');
    if (enemyConfig.animations?.attack2) availableAttacks.push('attack2');
    if (enemyConfig.animations?.attack3) availableAttacks.push('attack3');
    if (enemyConfig.animations?.strongAttack) availableAttacks.push('strongAttack');
    
    if (availableAttacks.length === 0) return 'attack';
    
    // Weighted selection: regular attacks more common, strongAttack rare (15% chance)
    const rand = Math.random();
    if (enemyConfig.animations?.strongAttack && rand < 0.15) {
      return 'strongAttack'; // 15% chance for strong attack
    }
    
    // Randomly select from available regular attacks (attack, attack2, attack3)
    const regularAttacks = availableAttacks.filter(a => a !== 'strongAttack');
    if (regularAttacks.length === 0) return 'attack';
    
    const selectedIndex = Math.floor(Math.random() * regularAttacks.length);
    const selected = regularAttacks[selectedIndex] || 'attack';
    
    console.log(`[useEnemyAnimator] Selected attack variant: "${selected}" for ${enemyName} (rand=${rand.toFixed(3)})`);
    return selected;
    */
  }, [enemyName]);

  const playAnimation = useCallback((name: string) => {
    // Select attack variant if needed
    const actualName = selectAttackVariant(name);
    
    const animation = animations[actualName];
    if (!animation) {
      console.warn(`[useEnemyAnimator] Animation "${actualName}" not found for ${enemyName}`);
      return;
    }

    // Interrupt rules: death blocks all, hurt interrupts non-death
    if (animationRef.current?.name === "death" && actualName !== "death") {
      return; // Don't interrupt death animation
    }
    
    if (animationRef.current?.name === "hurt" && actualName !== "death" && actualName !== "hurt") {
      return; // Don't interrupt hurt animation
    }

    animationRef.current = animation;
    setCurrentAnimation(animation);
    isPlayingRef.current = true;
  }, [selectAttackVariant, enemyName, animations]);

  const onComplete = useCallback(() => {
    isPlayingRef.current = false;
    
    // Auto-return to idle after non-looping animations (except death and idle itself)
    if (animationRef.current && animationRef.current.name !== "idle" && animationRef.current.name !== "death") {
      // Special case: Demon Lord should return to flying after hurt/attack/transition, not idle
      if (enemyName === 'Demon Lord' && animations['flying']) {
        // If transition just completed, switch to flying
        if (animationRef.current.name === 'transition') {
          const flyingAnimation = animations['flying'];
          setCurrentAnimation(flyingAnimation);
          animationRef.current = flyingAnimation;
        } else if (animationRef.current.name === 'hurt') {
          // After hurt animation, play transition first, then transition will complete to flying
          const transitionAnimation = animations['transition'];
          if (transitionAnimation) {
            setCurrentAnimation(transitionAnimation);
            animationRef.current = transitionAnimation;
          } else {
            // Fallback to flying if transition doesn't exist
            const flyingAnimation = animations['flying'];
            setCurrentAnimation(flyingAnimation);
            animationRef.current = flyingAnimation;
          }
        } else {
          // For other animations (attack), return to flying
          const flyingAnimation = animations['flying'];
          setCurrentAnimation(flyingAnimation);
          animationRef.current = flyingAnimation;
        }
      } else if (enemyName === 'Werewolf' && animations['transformation']) {
        // Special case: Werewolf transformation sequence
        if (animationRef.current.name === 'transformation') {
          // After transformation completes, switch to werewolf idle
          const idleAnimation = animations['idle'];
          if (idleAnimation) {
            setCurrentAnimation(idleAnimation);
            animationRef.current = idleAnimation;
          }
        } else if (animationRef.current.name === 'hurt' && animations['idle']) {
          // After hurt in werewolf form, return to werewolf idle
          const idleAnimation = animations['idle'];
          setCurrentAnimation(idleAnimation);
          animationRef.current = idleAnimation;
        } else {
          // For other animations, return to idle (or idleHuman if in human form)
          const idleAnimation = animations['idle'] || animations['idleHuman'] || defaultAnimation;
          if (idleAnimation) {
            setCurrentAnimation(idleAnimation);
            animationRef.current = idleAnimation;
          }
        }
      } else {
        const idleAnimation = animations['idle'] || defaultAnimation;
        if (idleAnimation) {
          setCurrentAnimation(idleAnimation);
          animationRef.current = idleAnimation;
        }
      }
    }
  }, [animations, defaultAnimation, enemyName]);

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
