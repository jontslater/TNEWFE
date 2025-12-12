import {
  forwardRef,
  Ref,
  CSSProperties,
  useImperativeHandle,
  useEffect,
  useRef,
} from "react";
import { useEnemyAnimator } from "../hooks/useEnemyAnimator";

export interface EnemySpriteJSHandle {
  playAnimation: (animation: string) => void;
  setSpriteImage: (url: string) => void;
  getCurrentAnimation: () => string;
}

interface EnemySpriteJSProps {
  enemyId: string;
  enemyType: string;
  enemyName: string;
  className?: string;
  facing?: "left" | "right";
  style?: CSSProperties;
  scale?: number;
  isTransformed?: boolean; // For Werewolf: true if transformed to werewolf form
}

const VIEWPORT = 48; // Fixed logical 48×48 (feet anchor viewport)

const EnemySpriteJS = forwardRef<EnemySpriteJSHandle, EnemySpriteJSProps>(
  function EnemySpriteJS(props, ref: Ref<EnemySpriteJSHandle | null>) {
    const {
      enemyId,
      enemyType,
      enemyName,
      className,
      facing = "left",
      style,
      scale = 2.5,
      isTransformed = false,
    } = props;
    
    // Goblin sprites need visible overflow to show full death animations
    const isGoblin = enemyType === 'Goblin' || enemyType === 'Goblin Chief' || 
                     enemyName === 'Goblin' || enemyName?.startsWith('Goblin');

    // For Werewolf, use human form (idleHuman) if not transformed, werewolf form (idle) if transformed
    // For Elder Dragon, use idleBattle instead of idle
    const getDefaultAnimation = () => {
      if ((enemyName === 'Werewolf' || enemyType === 'Werewolf')) {
        return isTransformed ? "idle" : "idleHuman";
      }
      if ((enemyName === 'Elder Dragon' || enemyType === 'Elder Dragon')) {
        return "idleBattle";
      }
      return "idle";
    };

    const defaultAnim = getDefaultAnimation();
    // Use enemyType for sprite lookup (not enemyName, which may have numbers like "Goblin 1")
    const { currentAnimation, playAnimation, onComplete } = useEnemyAnimator({
      enemyName: enemyType || enemyName, // Prefer enemyType for sprite lookup
      defaultAnimationName: defaultAnim,
    });
    
    // Update animation when transformation state changes (for Werewolf)
    // Only update if we're in an idle state and the transformation state doesn't match
    useEffect(() => {
      if ((enemyName === 'Werewolf' || enemyType === 'Werewolf')) {
        const targetAnim = isTransformed ? 'idle' : 'idleHuman';
        const currentAnimName = currentAnimation?.name;
        
        // Only update if:
        // 1. We're currently in an idle animation (not attacking/hurt/transforming)
        // 2. The current animation doesn't match the target (transformed state)
        // 3. We're not currently playing a non-looping animation
        if ((currentAnimName === 'idle' || currentAnimName === 'idleHuman') && 
            currentAnimName !== targetAnim) {
          playAnimation(targetAnim);
        }
      }
    }, [isTransformed, enemyName, enemyType, currentAnimation?.name, playAnimation]);

    // REMOVED: Elder Dragon idle → idleBattle switching (caused glitch)
    // Default is already set to 'idleBattle' above, no need to switch!

    const spriteRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number | null>(null);
    const deathAnimationPlayedRef = useRef<boolean>(false); // Track if death animation has been played
    
    // Reset death animation ref when enemyId changes (new enemy instance)
    useEffect(() => {
      deathAnimationPlayedRef.current = false;
      console.log(`[EnemySpriteJS] Reset death animation ref for new enemy ${enemyId}`);
    }, [enemyId]);

    // Wrapper to track death animation
    const playAnimationWithTracking = (name: string) => {
      // If death animation has already been completed, don't restart it
      // But allow it to play the first time (don't set the ref until it completes)
      if (name === 'death' && deathAnimationPlayedRef.current) {
        console.log(`[EnemySpriteJS] Death animation already completed for ${enemyId}, skipping restart`);
        return;
      }
      
      // Don't set deathAnimationPlayedRef here - wait until animation completes
      // This allows the animation to actually start playing
      if (name === 'death') {
        console.log(`[EnemySpriteJS] Starting death animation for ${enemyId}`);
      }
      
      playAnimation(name);
    };

    // External API
    useImperativeHandle(
      ref,
      () => ({
        playAnimation: playAnimationWithTracking,
        setSpriteImage: () => {},
        getCurrentAnimation: () => currentAnimation?.name || "idle",
      }),
      [currentAnimation, playAnimation]
    );

    // Animation loop
    useEffect(() => {
      if (!currentAnimation || !spriteRef.current) return;

      // CRITICAL: If this is a death animation that has already completed, don't restart it
      // But allow it to start playing the first time (ref is set after completion)
      if (currentAnimation.name === 'death' && deathAnimationPlayedRef.current) {
        // Only skip if we're trying to restart a completed death animation
        // Check if we're already on the last frame to determine if it's a restart
        console.log(`[EnemySpriteJS] Death animation already completed for ${enemyId}, preventing restart`);
        return;
      }

      // cancel old rAF
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      const {
        frames,
        duration,
        sheet,
        frameWidth,
        frameHeight,
        loop,
        name: animName,
      } = currentAnimation;

      const el = spriteRef.current;

      // Check if this is using individual frame files (like Dragon - Fully Animated or Goblin sprites)
      // Individual frames have paths like:
      // - "/Sprites/enemies/Dragon - Fully Animated/Idle/001.png" (Elder Dragon format)
      // - "/Sprites/enemies/GoblinUnderling/idle/idle_0000.png" (Goblin format with _0000)
      // - "/Sprites/enemies/Cultistpriest/cultist_priest_idle_1.png" (Cultist format with _1)
      const isIndividualFrames = sheet.includes('/001.png') || 
                                 sheet.includes('/01.png') || 
                                 sheet.includes('_0000.png') || 
                                 sheet.includes('_0001.png') ||
                                 sheet.includes('_1.png') ||
                                 sheet.includes('_2.png');
      
      // Helper to get frame path for individual frames
      const getFramePath = (frameIndex: number): string => {
        if (!isIndividualFrames) return sheet;
        
        // Check for Cultist format: path/cultist_priest_idle_1.png (underscore + single digit)
        const cultistMatch = sheet.match(/^(.+\/)([^\/]+)_(\d)\.png$/);
        if (cultistMatch) {
          const [, basePath, prefix, startNum] = cultistMatch;
          const frameNum = frameIndex + 1; // Cultist uses 1-based indexing
          return `${basePath}${prefix}_${frameNum}.png`;
        }
        
        // Check for Goblin format: path/idle/idle_0000.png (underscore + 4 digits)
        const goblinMatch = sheet.match(/^(.+\/)([^\/]+)_(\d{4})\.png$/);
        if (goblinMatch) {
          const [, dirPath, baseName, firstFrameNum] = goblinMatch;
          const frameNum = frameIndex.toString().padStart(4, '0');
          return `${dirPath}${baseName}_${frameNum}.png`;
        }
        
        // Check for Elder Dragon format: path/Idle/001.png (just numbers)
        const dragonMatch = sheet.match(/^(.+\/)(\d+)\.png$/);
        if (dragonMatch) {
          const [, dirPath, firstFrameNum] = dragonMatch;
          // Determine padding based on first frame number length
          // "001" = 3 digits, "01" = 2 digits
          const padding = firstFrameNum.length;
          const frameNum = (frameIndex + 1).toString().padStart(padding, '0');
          return `${dirPath}${frameNum}.png`;
        }
        
        // Fallback: return original sheet
        return sheet;
      };
      
      // Real sprite sheet size (only used for sprite sheets, not individual frames)
      const sheetWidth = isIndividualFrames ? frameWidth : frameWidth * frames;

      //
      // 🧠 SCALE DOWN LARGER ANIMATIONS TO FIT VIEWPORT
      //
      // If animation is larger than 48×48, scale it down to fit
      // Attack (148×96) needs to be scaled down to fit in 48×48 viewport
      // Use separate scaleX and scaleY to fill viewport without squishing
      //
      const scaleX = frameWidth > VIEWPORT ? VIEWPORT / frameWidth : 1;
      const scaleY = frameHeight > VIEWPORT ? VIEWPORT / frameHeight : 1;
      // Use separate scales to fill viewport (may cause slight distortion but prevents squishing)
      // For most animations, scaleX and scaleY will be the same (square viewport)

      // Calculate scaled dimensions for positioning
      const scaledFrameWidth = frameWidth * scaleX;
      const scaledFrameHeight = frameHeight * scaleY;

      //
      // 🧠 FEET-ANCHOR OFFSET (after scaling)
      //
      // We want the FEET to align at the bottom of the 48px viewport.
      //
      // After scaling, calculate offsets to center and align feet
      // For wider animations, center horizontally; for taller, align feet at bottom
      //
      const offsetY = VIEWPORT - scaledFrameHeight; // align feet at bottom (negative for larger anims)
      const offsetX = (VIEWPORT - scaledFrameWidth) / 2; // center horizontally

      //
      // RESET STYLES
      //
      // Use actual (unscaled) dimensions for the element
      // The transform scale will handle the visual scaling
      if (isIndividualFrames) {
        // For individual frames, element size is just one frame
        el.style.width = `${frameWidth}px`;
        el.style.height = `${frameHeight}px`;
      } else {
        // For sprite sheets, element size is full sheet width
        el.style.width = `${sheetWidth}px`;
        el.style.height = `${frameHeight}px`;
      }
      el.style.left = `${offsetX}px`;
      el.style.top = `${offsetY}px`;
      
      // Clip the sprite element to the viewport to prevent frame flicker
      el.style.clipPath = `inset(0)`;
      el.style.overflow = "hidden";
      el.style.transition = "none";
      el.style.animation = "none";
      el.style.setProperty("transition", "none", "important");
      el.style.setProperty("animation", "none", "important");
      el.style.position = "absolute";
      el.style.willChange = "transform"; // Optimize for transform changes
      
      // Animation timing
      let start: number | null = null;
      let lastIndex = -1;
      let lastFrameTime = 0;

      const frameTime = duration / frames;
      
      // Special case: Werewolf transformation starts from frame 1 (skip frame 0 which is already transformed)
      const isTransformation = animName === 'transformation' && enemyName === 'Werewolf';
      const startFrame = isTransformation ? 1 : 0;
      const effectiveFrames = isTransformation ? frames - 1 : frames; // Use frames 1-7 instead of 0-7
      
      // Set initial frame immediately for ALL animations
      // This ensures animations start visible right away and prevents flicker
      const initialScaleX = frameWidth > VIEWPORT ? VIEWPORT / frameWidth : 1;
      const initialScaleY = frameHeight > VIEWPORT ? VIEWPORT / frameHeight : 1;
      
      // Define animate function first so it can be called from Promise callbacks
      const animate = (ts: number) => {
        if (!spriteRef.current) return;

        // For death animations that have completed, stop the animation loop
        // This prevents infinite loops after completion but allows the animation to play once
        if (animName === 'death' && deathAnimationPlayedRef.current) {
          rafRef.current = null; // Stop the animation loop
          return; // Don't continue animating
        }

        if (currentAnimation.name !== animName) return;

        if (!start) {
          start = ts;
          lastFrameTime = ts;
        }

        const elapsed = ts - start;
        const delta = ts - lastFrameTime;

        // Only update frame if enough time has passed (prevents sliding/interpolation)
        if (delta >= frameTime) {
          let index = Math.floor(elapsed / frameTime);

          if (loop) {
            // For looping animations, wrap the index
            index = index % frames;
          } else {
            // For non-looping, clamp to last frame
            // For transformation, adjust to use frames 1-7 (skip frame 0)
            if (isTransformation) {
              index = Math.min(index, effectiveFrames - 1) + startFrame; // Add startFrame offset
            } else {
              index = Math.min(index, frames - 1);
            }
          }
          
          lastFrameTime = ts - (delta % frameTime); // Preserve timing accuracy

          if (index !== lastIndex) {
            // Calculate scale for this animation (recalculate to ensure consistency)
            const animScaleX = frameWidth > VIEWPORT ? VIEWPORT / frameWidth : 1;
            const animScaleY = frameHeight > VIEWPORT ? VIEWPORT / frameHeight : 1;
            
            if (isIndividualFrames) {
              // For individual frames, use canvas to draw the frame
              const canvas = (el as any).__canvas as HTMLCanvasElement;
              const ctx = (el as any).__ctx as CanvasRenderingContext2D;
              const loadedFrames = (el as any).__loadedFrames as HTMLImageElement[];
              
              if (canvas && ctx && loadedFrames && loadedFrames[index]) {
                // Check if image is valid and loaded before drawing
                const img = loadedFrames[index];
                if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
                  ctx.clearRect(0, 0, frameWidth, frameHeight);
                  ctx.drawImage(img, 0, 0, frameWidth, frameHeight);
                  // Canvas is already displayed at scaled size, so no additional transform needed
                  // The container scale(3.0) will handle the final scaling
                  el.style.setProperty("transform", "none", "important");
                }
              }
            } else {
              // For sprite sheets, translate to the correct frame
              // CRITICAL: Translate by actual frameWidth (unscaled)
              // Transform order: scaleX() scaleY() translateX() applies translateX first (unscaled), then scales
              const x = -(index * frameWidth);
              
              // CRITICAL: Force discrete transform update with no interpolation
              // Remove any existing transform first to prevent interpolation
              el.style.removeProperty("transform");
              el.style.removeProperty("-webkit-transform");
              el.style.removeProperty("-moz-transform");
              el.style.removeProperty("-ms-transform");
              el.style.removeProperty("-o-transform");
              // Force reflow
              void el.offsetWidth;
              // Now set the new transform with separate scaleX and scaleY
              el.style.transition = "none";
              el.style.setProperty("transition", "none", "important");
              el.style.setProperty("transform", `scaleX(${animScaleX}) scaleY(${animScaleY}) translateX(${x}px)`, "important");
            }
            el.style.transformOrigin = "top left";
            // Force reflow again to commit transform immediately
            void el.offsetWidth;
            lastIndex = index;
          }
        }

        // Continue animation
        // For looping animations, always continue
        // For non-looping, continue until we reach the last frame
        if (loop) {
          // Looping animations (idle, walk, run, etc.) always continue
          rafRef.current = requestAnimationFrame(animate);
        } else {
          // Non-looping animations stop at the last frame
          if (lastIndex < frames - 1) {
            rafRef.current = requestAnimationFrame(animate);
          } else {
            rafRef.current = null;
            // For death animations, stay on last frame and don't call onComplete (prevents transition back to idle)
            if (animName === 'death') {
              // Death animation stays on last frame - ensure we're displaying it
              // Make sure we're displaying the last frame
              if (isIndividualFrames) {
                // Force display last frame for individual frame animations
                const canvas = (el as any).__canvas as HTMLCanvasElement;
                const ctx = (el as any).__ctx as CanvasRenderingContext2D;
                const loadedFrames = (el as any).__loadedFrames as HTMLImageElement[];
                if (canvas && ctx && loadedFrames && loadedFrames[frames - 1]) {
                  const lastImg = loadedFrames[frames - 1];
                  if (lastImg.complete && lastImg.naturalWidth > 0 && lastImg.naturalHeight > 0) {
                    ctx.clearRect(0, 0, frameWidth, frameHeight);
                    ctx.drawImage(lastImg, 0, 0, frameWidth, frameHeight);
                  }
                }
              } else {
                // For sprite sheets, ensure we're on the last frame
                const animScaleX = frameWidth > VIEWPORT ? VIEWPORT / frameWidth : 1;
                const animScaleY = frameHeight > VIEWPORT ? VIEWPORT / frameHeight : 1;
                const lastFrameX = -((frames - 1) * frameWidth);
                el.style.setProperty("transform", `scaleX(${animScaleX}) scaleY(${animScaleY}) translateX(${lastFrameX}px)`, "important");
              }
              
              // Mark death animation as complete to prevent restart
              deathAnimationPlayedRef.current = true;
              console.log(`[EnemySpriteJS] ✅ Death animation completed for ${enemyId} - locked on last frame`);
              lastIndex = frames - 1; // Ensure lastIndex is at final frame
              return; // Stop animation loop completely
            }
            onComplete();
          }
        }
      };
      
      // For individual frames, use canvas with preloading
      if (isIndividualFrames) {
        // Preload all frame images
        const imagePromises: Promise<HTMLImageElement>[] = [];
        const loadedImages: HTMLImageElement[] = [];
        
        for (let i = 0; i < frames; i++) {
          const framePath = getFramePath(i);
          const img = new Image();
          const promise = new Promise<HTMLImageElement>((resolve, reject) => {
            img.onload = () => resolve(img);
            img.onerror = () => {
              console.warn(`[EnemySpriteJS] Failed to load frame ${i}: ${framePath}`);
              resolve(img); // Continue even if one frame fails
            };
            img.src = framePath;
          });
          imagePromises.push(promise);
          loadedImages.push(img);
        }
        
        // Wait for all images to load before starting animation
        Promise.all(imagePromises).then((images) => {
          // Create canvas element if it doesn't exist
          let canvas = (el as any).__canvas as HTMLCanvasElement;
          let ctx = (el as any).__ctx as CanvasRenderingContext2D;
          
          if (!canvas) {
            canvas = document.createElement('canvas');
            // Canvas should match the actual frame size for proper rendering
            canvas.width = frameWidth;
            canvas.height = frameHeight;
            // Canvas display size should be scaled to fit VIEWPORT (48px)
            // The canvas is frameWidth x frameHeight internally, but we display it at the scaled size
            // Then the transform on the sprite element scales it further if needed, and container scales final
            const canvasDisplayScaleX = frameWidth > VIEWPORT ? VIEWPORT / frameWidth : 1;
            const canvasDisplayScaleY = frameHeight > VIEWPORT ? VIEWPORT / frameHeight : 1;
            canvas.style.width = `${frameWidth * canvasDisplayScaleX}px`;
            canvas.style.height = `${frameHeight * canvasDisplayScaleY}px`;
            canvas.style.position = 'absolute';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.imageRendering = 'pixelated';
            canvas.style.imageRendering = '-moz-crisp-edges';
            canvas.style.imageRendering = 'crisp-edges';
            el.appendChild(canvas);
            ctx = canvas.getContext('2d', { 
              willReadFrequently: false,
              alpha: true 
            })!;
            // Disable image smoothing for crisp pixel art
            ctx.imageSmoothingEnabled = false;
            (el as any).__canvas = canvas;
            (el as any).__ctx = ctx;
          }
          
          // Update canvas size if frame dimensions changed
          if (canvas.width !== frameWidth || canvas.height !== frameHeight) {
            canvas.width = frameWidth;
            canvas.height = frameHeight;
            // Update display size to match scaled size
            const canvasDisplayScaleX = frameWidth > VIEWPORT ? VIEWPORT / frameWidth : 1;
            const canvasDisplayScaleY = frameHeight > VIEWPORT ? VIEWPORT / frameHeight : 1;
            canvas.style.width = `${frameWidth * canvasDisplayScaleX}px`;
            canvas.style.height = `${frameHeight * canvasDisplayScaleY}px`;
          }
          
          // Store loaded images for quick access during animation
          (el as any).__loadedFrames = images;
          
          // Draw initial frame - draw at full size, canvas display is already scaled
          const initialImg = images[startFrame];
          if (initialImg && initialImg.complete && initialImg.naturalWidth > 0 && initialImg.naturalHeight > 0) {
            ctx.clearRect(0, 0, frameWidth, frameHeight);
            ctx.drawImage(initialImg, 0, 0, frameWidth, frameHeight);
          }
          
          // Canvas is already displayed at scaled size, so no additional transform needed
          // The container scale(3.0) will handle the final scaling
          el.style.setProperty("transform", "none", "important");
          el.style.transformOrigin = "top left";
          lastIndex = startFrame;
          
          // Force reflows to ensure browser has processed the canvas
          void el.offsetWidth;
          void el.offsetHeight;
          
          // Start animation after preload
          rafRef.current = requestAnimationFrame(animate);
        });
        
        // Return early - animation will start after preload completes
        return;
      } else {
        // For sprite sheets, use the full sheet and translate to the correct frame
        el.style.backgroundImage = `url(${encodeURI(sheet)})`;
        el.style.backgroundRepeat = "no-repeat";
        el.style.backgroundPosition = "0 0";
        el.style.backgroundSize = `${sheetWidth}px ${frameHeight}px`;
        const initialX = -(startFrame * frameWidth);
        el.style.setProperty("transform", `scaleX(${initialScaleX}) scaleY(${initialScaleY}) translateX(${initialX}px)`, "important");
        el.style.transformOrigin = "top left";
        lastIndex = startFrame;
        
        // Force reflows to ensure browser has processed the background image and transform
        void el.offsetWidth;
        void el.offsetHeight;
        
        // Start animation for sprite sheets
        rafRef.current = requestAnimationFrame(animate);
      }

      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }, [currentAnimation, onComplete]);

    //
    // VIEWPORT — FIXED 48×48 for ALL animations (feet anchor)
    //
    return (
      <div
        id={`battle-enemy-${enemyId}`}
        className={`enemy-sprite-container ${className || ""}`}
        data-enemy-type={enemyType}
        data-enemy-id={enemyId}
        style={{
          ...style,
          width: `${VIEWPORT}px`,
          height: `${VIEWPORT}px`,
          overflow: isGoblin ? "visible" : "hidden", // Goblins need visible for death animations, others use hidden
          position: "relative",
          transform:
            facing === "left"
              ? `scale(${scale}) scaleX(-1)`
              : `scale(${scale})`,
          transformOrigin: "bottom center", // FEET anchor
          imageRendering: "pixelated",
        }}
      >
        <div
          ref={spriteRef}
          id={`enemy-sprite-${enemyId}`}
          className="enemy-sprite"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: `${VIEWPORT}px`, // Clip to viewport width
            height: `${VIEWPORT}px`, // Clip to viewport height
            transition: "none",
            animation: "none",
            backgroundRepeat: "no-repeat",
            imageRendering: "pixelated",
            overflow: isGoblin ? "visible" : "hidden", // Goblins need visible for death animations, others use hidden
          }}
        />
      </div>
    );
  }
);

EnemySpriteJS.displayName = "EnemySpriteJS";

export default EnemySpriteJS;
