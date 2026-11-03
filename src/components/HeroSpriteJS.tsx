import {
  forwardRef,
  Ref,
  CSSProperties,
  useImperativeHandle,
  useEffect,
  useRef,
  useState,
} from "react";
import { useHeroAnimator } from "../hooks/useHeroAnimator";
import { SPRITE_DISPLAY_SCALE } from "../utils/spriteDisplayScale";
import {
  getSpriteContainerTransform,
  type ScreenFacing,
} from "../utils/spriteFacing";
import { getHeroFacesLeft } from "../utils/spriteFacingConfig";
import { computeHeroSpriteFrameLayout } from "../utils/spriteHeroFrameLayout";

export interface HeroSpriteJSHandle {
  playAnimation: (animation: string) => void;
  setSpriteImage: (url: string) => void;
  getCurrentAnimation: () => string;
  /** Hold strip on first frame (gallery / screenshots) */
  freezeIdleFrame: () => void;
}

interface HeroSpriteJSProps {
  heroId: string;
  role: string;
  className?: string;
  facing?: ScreenFacing;
  /** Override native sheet facing from config */
  facesLeft?: boolean;
  /** When true, idle stays on frame 0 (class gallery screenshots) */
  freezeIdleFrame?: boolean;
  style?: CSSProperties;
  scale?: number;
  shield?: number;
  enrageActive?: boolean;
  abilityEffect?: 'backstab' | 'deathStrike' | 'holyStrike' | null; // Temporary ability visual effect
}

const VIEWPORT = 48;

const HeroSpriteJS = forwardRef<HeroSpriteJSHandle, HeroSpriteJSProps>(
  function HeroSpriteJS(props, ref: Ref<HeroSpriteJSHandle | null>) {
    const {
      heroId,
      role,
      className,
      facing = "right",
      facesLeft: facesLeftProp,
      freezeIdleFrame = false,
      style,
      scale = SPRITE_DISPLAY_SCALE,
      shield = 0,
      enrageActive = false,
      abilityEffect = null,
    } = props;

    const { currentAnimation, playAnimation, onComplete } = useHeroAnimator({
      role: role,
      defaultAnimationName: "idle",
    });

    const spriteRef = useRef<HTMLDivElement>(null);
    const glowWrapperRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const freezeFrameRef = useRef(false);
    const [enrageScale, setEnrageScale] = useState(1.0);

    freezeFrameRef.current = freezeIdleFrame;

    const hasShield = shield > 0;

    // Animate enrage scale smoothly
    useEffect(() => {
      if (!containerRef.current) return;

      const targetScale = enrageActive ? 1.2 : 1.0;
      const duration = 800; // 0.8 seconds for smooth animation
      const startScale = enrageScale;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease-out function for smooth deceleration
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        const currentScale = startScale + (targetScale - startScale) * easeOut;
        setEnrageScale(currentScale);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setEnrageScale(targetScale);
        }
      };

      requestAnimationFrame(animate);
    }, [enrageActive]);

    const applyStripFrame = (
      el: HTMLDivElement,
      index: number,
      animScaleX: number,
      animScaleY: number,
      fw: number
    ) => {
      const x = -(index * fw);
      el.style.removeProperty("transform");
      void el.offsetWidth;
      el.style.setProperty(
        "transform",
        `scaleX(${animScaleX}) scaleY(${animScaleY}) translateX(${x}px)`,
        "important"
      );
      el.style.transformOrigin = "top left";
      void el.offsetWidth;
    };

    // External API
    useImperativeHandle(
      ref,
      () => ({
        playAnimation,
        setSpriteImage: () => {},
        getCurrentAnimation: () => currentAnimation?.name || "idle",
        freezeIdleFrame: () => {
          freezeFrameRef.current = true;
          if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
          }
          const el = spriteRef.current;
          if (!el || !currentAnimation) return;
          const frozen = computeHeroSpriteFrameLayout(
            currentAnimation.frameWidth,
            currentAnimation.frameHeight,
            role
          );
          applyStripFrame(
            el,
            0,
            frozen.scaleX,
            frozen.scaleY,
            currentAnimation.frameWidth
          );
        },
      }),
      [currentAnimation, playAnimation]
    );

    // Shield glow effect is now applied via wrapper div filter (see JSX below)
    // This allows the glow to extend beyond the clipped sprite while following the sprite's shape

    // Animation
    useEffect(() => {
      if (!currentAnimation || !spriteRef.current) return;

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

      // Real sprite sheet size
      const sheetWidth = frameWidth * frames;

      const {
        scaleX,
        scaleY,
        offsetX,
        offsetY,
      } = computeHeroSpriteFrameLayout(frameWidth, frameHeight, role);

      const scaledFrameWidth = frameWidth * scaleX;
      const scaledFrameHeight = frameHeight * scaleY;

      // Update glow wrapper position and size to match visible frame area
      // Clip to frame dimensions so filter only affects visible sprite, not full sheet width
      if (glowWrapperRef.current) {
        const glowWrapper = glowWrapperRef.current;
        glowWrapper.style.left = `${offsetX}px`;
        glowWrapper.style.top = `${offsetY}px`;
        glowWrapper.style.width = `${scaledFrameWidth}px`;
        glowWrapper.style.height = `${scaledFrameHeight}px`;
        // Clip wrapper to frame so filter only affects visible area
        glowWrapper.style.clipPath = `inset(0)`;
      }

      // Setup sprite element
      // Use actual (unscaled) dimensions for the element
      // The transform scale will handle the visual scaling
      el.style.width = `${sheetWidth}px`;
      el.style.height = `${frameHeight}px`;
      // Sprite is positioned at (0,0) relative to glow wrapper, which is positioned at offsetX/offsetY
      el.style.left = `0px`;
      el.style.top = `0px`;
      el.style.backgroundImage = `url(${encodeURI(sheet)})`;
      el.style.backgroundRepeat = "no-repeat";
      el.style.backgroundPosition = "0 0";
      // CRITICAL: Set backgroundSize to match ACTUAL sprite sheet dimensions
      el.style.backgroundSize = `${sheetWidth}px ${frameHeight}px`;
      el.style.transition = "none";
      el.style.animation = "none";
      el.style.setProperty("transition", "none", "important");
      el.style.setProperty("animation", "none", "important");
      // CRITICAL: Apply separate scaleX and scaleY to fill viewport without squishing
      // CSS transforms apply right-to-left, so scaleX() scaleY() translateX() applies translateX first, then scales
      el.style.setProperty("transform", `scaleX(${scaleX}) scaleY(${scaleY}) translateX(0px)`, "important");
      el.style.transformOrigin = "top left";
      el.style.position = "absolute";
      el.style.willChange = "transform"; // Optimize for transform changes

      let start: number | null = null;
      let lastIndex = -1;
      let lastFrameTime = 0;
      const frameTime = duration / frames;

      // Set initial frame (frame 0) immediately for all animations
      // This ensures animations start visible right away and prevents scrolling
      el.style.setProperty("transform", `scaleX(${scaleX}) scaleY(${scaleY}) translateX(0px)`, "important");
      lastIndex = 0; // Start at frame 0
      void el.offsetWidth; // Force reflow

      const animate = (ts: number) => {
        if (!spriteRef.current) return;
        if (currentAnimation.name !== animName) return;

        if (!start) {
          start = ts;
          lastFrameTime = ts;
        }

        const elapsed = ts - start;
        const delta = ts - lastFrameTime;

        if (delta >= frameTime) {
          let index = Math.floor(elapsed / frameTime);

          if (loop) {
            index = index % frames;
          } else {
            index = Math.min(index, frames - 1);
          }

          lastFrameTime = ts - (delta % frameTime);

          if (index !== lastIndex) {
            // Calculate scale for this animation (recalculate to ensure consistency)
            const animScaleX = scaleX;
            const animScaleY = scaleY;
            
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
            el.style.transformOrigin = "top left";
            // Force reflow again to commit transform immediately
            void el.offsetWidth;
            lastIndex = index;
          }
        }

        if (loop || lastIndex < frames - 1) {
          rafRef.current = requestAnimationFrame(animate);
        } else {
          rafRef.current = null;
          onComplete();
        }
      };

      rafRef.current = requestAnimationFrame(animate);
      if (freezeIdleFrame || freezeFrameRef.current) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }, [currentAnimation, onComplete, freezeIdleFrame, role]);

    // Calculate final scale with animated enrage multiplier
    const finalScale = scale * enrageScale;
    const nativeFacesLeft = facesLeftProp ?? getHeroFacesLeft(role);
    
    // Combat glow filter
    // Shield/enrage are handled by browser source wrapper
    const getCombatGlowFilter = () => {
      const filters = [];
      
      // Ability effects only - shield/enrage handled by browser source
      if (abilityEffect === 'backstab') {
        filters.push("drop-shadow(0 0 4px rgba(0, 0, 0, 0.9)) drop-shadow(0 0 8px rgba(139, 69, 19, 0.8)) brightness(1.2)");
      } else if (abilityEffect === 'deathStrike') {
        filters.push("drop-shadow(0 0 4px rgba(75, 0, 130, 0.9)) drop-shadow(0 0 8px rgba(138, 43, 226, 0.8)) brightness(1.3) hue-rotate(270deg)");
      } else if (abilityEffect === 'holyStrike') {
        filters.push("drop-shadow(0 0 4px rgba(255, 215, 0, 0.9)) drop-shadow(0 0 8px rgba(255, 255, 255, 0.8)) brightness(1.4) saturate(1.3)");
      }
      
      return filters.length > 0 ? filters.join(' ') : 'none';
    };

    return (
      <div
        ref={containerRef}
        id={`battle-hero-${heroId}`}
        className={`hero-sprite-container ${className || ""}`}
        data-hero-id={heroId}
        data-hero-role={role}
        style={{
          ...style,
          width: `${VIEWPORT}px`,
          height: `${VIEWPORT}px`,
          overflow: "visible", // Allow effects to extend beyond sprite bounds
          position: "relative",
          paddingBottom: hasShield ? "4px" : "0px", // Allow space for glow at bottom
          transform: getSpriteContainerTransform(
            finalScale,
            facing,
            nativeFacesLeft
          ),
          transformOrigin: "bottom center",
          imageRendering: "pixelated",
        }}
      >
        {/* Sprite with glow - wrapper allows glow and auras to extend */}
        <div
          ref={glowWrapperRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: `${VIEWPORT}px`,
            height: `${VIEWPORT}px`,
            overflow: "visible", // Allow glow and aura to extend beyond frame
            filter: getCombatGlowFilter(), // Combat effects (shield/enrage) - top layer
            pointerEvents: "none",
          }}
        >
          <div
            ref={spriteRef}
            id={`hero-sprite-${heroId}`}
            className={`hero-sprite ${enrageActive ? 'enrage-active' : ''}`}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: `${VIEWPORT}px`,
              height: `${VIEWPORT}px`,
              overflow: "hidden", // Clip sprite background to frame
              transition: "none",
              backgroundRepeat: "no-repeat",
              imageRendering: "pixelated",
              // Ability effect filters only - shield/enrage/aura handled by browser source wrapper
              filter: (() => {
                const filters = [];
                
                if (enrageActive) {
                  filters.push("hue-rotate(-5deg) saturate(1.15) brightness(1.05)");
                } else if (abilityEffect === 'backstab') {
                  filters.push("brightness(1.1) contrast(1.2)");
                } else if (abilityEffect === 'deathStrike') {
                  filters.push("brightness(1.2) contrast(1.3) saturate(1.4)");
                } else if (abilityEffect === 'holyStrike') {
                  filters.push("brightness(1.3) saturate(1.2) hue-rotate(10deg)");
                }
                
                return filters.length > 0 ? filters.join(' ') : 'none';
              })(),
            }}
          />
        </div>
      </div>
    );
  }
);

HeroSpriteJS.displayName = "HeroSpriteJS";

export default HeroSpriteJS;
