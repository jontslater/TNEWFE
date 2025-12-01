/**
 * Level Up Effect Component
 * Displays a level-up animation sprite above a hero when they level up
 */

import { useEffect, useRef, useState } from 'react';
import { showScrollingCombatText } from '../utils/combatText';

interface LevelUpEffectProps {
  heroId: string;
  onComplete?: () => void;
}

const LevelUpEffect: React.FC<LevelUpEffectProps> = ({ heroId, onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const spriteRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);
  
  // Update ref when onComplete changes (but don't trigger re-render)
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Sprite sheet info - 10 frames arranged in 2 rows (5 frames per row)
  const SPRITE_SHEET = '/Sprites/levelup/pipo-mapeffect013a-front.png';
  const FRAME_WIDTH = 192; // Adjust based on actual sprite sheet - common sizes: 192, 256, 384
  const FRAME_HEIGHT = 192; // Adjust based on actual sprite sheet
  const FRAMES_PER_ROW = 5; // 5 frames per row
  const FRAMES = 10; // 10 frames total (2 rows x 5 columns)
  const DURATION = 2000; // 2 seconds total animation
  const FRAME_TIME = DURATION / FRAMES;

  useEffect(() => {
    if (!spriteRef.current || !containerRef.current) return;

    const sprite = spriteRef.current;
    const container = containerRef.current;

    // Find the hero sprite container (same as combat text positioning)
    let heroContainer: HTMLElement | null = null;
    
    // Try to find the hero container by ID
    heroContainer = document.querySelector(`#battle-hero-${heroId}`) as HTMLElement;
    
    if (!heroContainer) {
      // Fallback: try to find by data attribute
      heroContainer = document.querySelector(`[data-hero-id="${heroId}"]`) as HTMLElement;
    }

    if (!heroContainer) {
      console.warn(`LevelUpEffect: Hero container not found for ${heroId}`);
      return;
    }

    const heroRect = heroContainer.getBoundingClientRect();

    // Position at hero's feet (bottom of sprite container, lower)
    // Use fixed positioning to escape all containers
    container.style.position = 'fixed';
    container.style.left = `${heroRect.left + heroRect.width / 2 - FRAME_WIDTH / 2 + 12}px`; // Moved right a bit
    container.style.top = `${heroRect.bottom - FRAME_HEIGHT + 28}px`; // Position at feet, moved down a tiny bit more
    container.style.zIndex = '10001'; // Above combat text
    container.style.pointerEvents = 'none'; // Don't block clicks

    // Setup sprite sheet (2 rows x 5 columns = 10 frames total)
    // Sprite sheet dimensions: width = 5 * FRAME_WIDTH, height = 2 * FRAME_HEIGHT
    const sheetWidth = FRAME_WIDTH * FRAMES_PER_ROW;
    const sheetHeight = FRAME_HEIGHT * 2; // 2 rows
    
    // Set container size to show one frame
    container.style.width = `${FRAME_WIDTH}px`;
    container.style.height = `${FRAME_HEIGHT}px`;
    container.style.overflow = 'hidden'; // Clip to show only one frame
    
    // Set sprite element to full sheet size
    sprite.style.width = `${sheetWidth}px`;
    sprite.style.height = `${sheetHeight}px`;
    sprite.style.backgroundImage = `url(${SPRITE_SHEET})`;
    sprite.style.backgroundRepeat = 'no-repeat';
    sprite.style.backgroundSize = `${sheetWidth}px ${sheetHeight}px`;
    sprite.style.backgroundPosition = '0 0';
    sprite.style.imageRendering = 'pixelated';
    sprite.style.position = 'absolute';
    sprite.style.top = '0';
    sprite.style.left = '0';
    sprite.style.transition = 'none';
    sprite.style.setProperty("transition", "none", "important");
    sprite.style.transformOrigin = 'top left';
    
    // Verify sprite sheet loads
    const img = new Image();
    img.onload = () => {
      console.log(`✅ LevelUpEffect: Sprite sheet loaded - ${img.width}x${img.height}px`);
      console.log(`   Expected sheet size: ${sheetWidth}x${sheetHeight}px`);
    };
    img.onerror = () => {
      console.error(`❌ LevelUpEffect: Failed to load sprite sheet: ${SPRITE_SHEET}`);
    };
    img.src = SPRITE_SHEET;

    let start: number | null = null;
    let lastFrameIndex = -1;
    let lastFrameTime = 0;

    // Set initial frame (frame 0) immediately - ensures first frame shows right away
    const row0 = Math.floor(0 / FRAMES_PER_ROW);
    const col0 = 0 % FRAMES_PER_ROW;
    const bgX0 = -(col0 * FRAME_WIDTH);
    const bgY0 = -(row0 * FRAME_HEIGHT);
    sprite.style.setProperty("background-position", `${bgX0}px ${bgY0}px`, "important");
    lastFrameIndex = 0;
    void sprite.offsetWidth; // Force reflow
    
    // Show "LEVEL UP" SCT when animation starts
    showScrollingCombatText(`battle-hero-${heroId}`, 'LEVEL UP', 'levelup', true);

    const animate = (ts: number) => {
      if (!spriteRef.current || !containerRef.current) return;

      // Update position on each frame to follow hero (in case hero moves)
      const currentHeroRect = heroContainer?.getBoundingClientRect();
      if (currentHeroRect) {
        container.style.left = `${currentHeroRect.left + currentHeroRect.width / 2 - FRAME_WIDTH / 2 + 12}px`; // Moved right a bit
        container.style.top = `${currentHeroRect.bottom - FRAME_HEIGHT + 28}px`; // Moved down a tiny bit more
      }

      if (!start) {
        start = ts;
        lastFrameTime = ts;
      }

      const elapsed = ts - start;
      const delta = ts - lastFrameTime;

      // Debug: Log delta to see if it's reaching FRAME_TIME
      if (delta >= FRAME_TIME || lastFrameIndex === -1) {
        let frameIndex = Math.floor(elapsed / FRAME_TIME);

        // Clamp to valid frame range (non-looping animation)
        frameIndex = Math.min(frameIndex, FRAMES - 1);

        lastFrameTime = ts - (delta % FRAME_TIME);

        // Only update if frame changed (2x5 grid layout)
        if (frameIndex !== lastFrameIndex) {
          // Calculate row and column for 2x5 grid
          // Row 0: frames 0-4 (top row)
          // Row 1: frames 5-9 (bottom row)
          const row = Math.floor(frameIndex / FRAMES_PER_ROW);
          const col = frameIndex % FRAMES_PER_ROW;
          
          // Calculate background position for this frame
          const bgX = -(col * FRAME_WIDTH);
          const bgY = -(row * FRAME_HEIGHT);
          
          // Force discrete background position update with no interpolation (like HeroSpriteJS)
          // Remove all background-position properties first
          sprite.style.removeProperty("background-position");
          sprite.style.removeProperty("-webkit-background-position");
          sprite.style.removeProperty("-moz-background-position");
          sprite.style.removeProperty("-ms-background-position");
          sprite.style.removeProperty("-o-background-position");
          // Force reflow
          void sprite.offsetWidth;
          
          // Set background position to show the correct frame
          sprite.style.setProperty("background-position", `${bgX}px ${bgY}px`, "important");
          sprite.style.setProperty("transition", "none", "important");
          // Force reflow again to commit immediately
          void sprite.offsetWidth;
          
          // Debug: Log computed style to verify it's applied
          const computedBgPos = window.getComputedStyle(sprite).backgroundPosition;
          console.log(`   Applied bgPos: ${computedBgPos}`);
          
          lastFrameIndex = frameIndex;
        }
      }

      // Continue animating until we've shown all frames (non-looping)
      if (lastFrameIndex < FRAMES - 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete - all frames shown, hide immediately
        rafRef.current = null;
        setIsVisible(false);
        if (onCompleteRef.current) {
          onCompleteRef.current();
        }
      }
    };

    // Start animation loop
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [heroId]); // Remove onComplete from dependencies - use ref instead

  if (!isVisible) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        pointerEvents: 'none',
        overflow: 'hidden', // Clip to show only one frame at a time
        imageRendering: 'pixelated',
      }}
    >
      <div
        ref={spriteRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />
    </div>
  );
};

export default LevelUpEffect;
