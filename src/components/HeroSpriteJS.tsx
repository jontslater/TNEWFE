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

export interface HeroSpriteJSHandle {
  playAnimation: (animation: string) => void;
  setSpriteImage: (url: string) => void;
  getCurrentAnimation: () => string;
}

interface HeroSpriteJSProps {
  heroId: string;
  role: string;
  className?: string;
  facing?: "left" | "right";
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
      style,
      scale = 2.5,
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
    const [enrageScale, setEnrageScale] = useState(1.0);

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

    // External API
    useImperativeHandle(
      ref,
      () => ({
        playAnimation,
        setSpriteImage: () => {},
        getCurrentAnimation: () => currentAnimation?.name || "idle",
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

      // Scale to fit 48x48
      const scaleX = frameWidth > VIEWPORT ? VIEWPORT / frameWidth : 1;
      const scaleY = frameHeight > VIEWPORT ? VIEWPORT / frameHeight : 1;

      // Calculate scaled dimensions for positioning
      const scaledFrameWidth = frameWidth * scaleX;
      const scaledFrameHeight = frameHeight * scaleY;

      // FEET-ANCHOR OFFSET (after scaling)
      // Adjust offsetY based on sprite role - Dwarf Warrior sprites may need different alignment
      const isDwarfWarrior = ['berserker', 'crusader', 'assassin', 'reaper', 'bladedancer', 'monk', 'stormwarrior', 'hunter'].includes(role.toLowerCase());
      const verticalOffset = isDwarfWarrior ? 5 : 0; // Move Dwarf Warrior sprites down slightly to align with others
      const offsetY = VIEWPORT - scaledFrameHeight + verticalOffset; // align feet at bottom
      const offsetX = (VIEWPORT - scaledFrameWidth) / 2; // center horizontally

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
      const initialScaleX = frameWidth > VIEWPORT ? VIEWPORT / frameWidth : 1;
      const initialScaleY = frameHeight > VIEWPORT ? VIEWPORT / frameHeight : 1;
      el.style.setProperty("transform", `scaleX(${initialScaleX}) scaleY(${initialScaleY}) translateX(0px)`, "important");
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
            const animScaleX = frameWidth > VIEWPORT ? VIEWPORT / frameWidth : 1;
            const animScaleY = frameHeight > VIEWPORT ? VIEWPORT / frameHeight : 1;
            
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

      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }, [currentAnimation, onComplete]);

    // Calculate final scale with animated enrage multiplier
    const finalScale = scale * enrageScale;

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
          overflow: "hidden", // Prevent sprite from sliding outside viewport
          position: "relative",
          paddingBottom: hasShield ? "4px" : "0px", // Allow space for glow at bottom
          transform:
            facing === "left"
              ? `scale(${finalScale}) scaleX(-1)`
              : `scale(${finalScale})`,
          transformOrigin: "bottom center",
          imageRendering: "pixelated",
        }}
      >
        {/* Sprite with glow - wrapper clips to frame and allows glow to extend */}
        <div
          ref={glowWrapperRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: `${VIEWPORT}px`,
            height: `${VIEWPORT}px`,
            overflow: "visible", // Allow glow to extend beyond frame
            filter: hasShield 
              ? "drop-shadow(0 0 2px rgba(100, 150, 255, 0.8)) drop-shadow(0 0 4px rgba(100, 150, 255, 0.6)) drop-shadow(0 0 6px rgba(100, 150, 255, 0.4))" 
              : enrageActive
              ? "drop-shadow(0 0 3px rgba(220, 38, 38, 0.6)) drop-shadow(0 0 6px rgba(220, 38, 38, 0.4))"
              : abilityEffect === 'backstab'
              ? "drop-shadow(0 0 4px rgba(0, 0, 0, 0.9)) drop-shadow(0 0 8px rgba(139, 69, 19, 0.8)) brightness(1.2)"
              : abilityEffect === 'deathStrike'
              ? "drop-shadow(0 0 4px rgba(75, 0, 130, 0.9)) drop-shadow(0 0 8px rgba(138, 43, 226, 0.8)) brightness(1.3) hue-rotate(270deg)"
              : abilityEffect === 'holyStrike'
              ? "drop-shadow(0 0 4px rgba(255, 215, 0, 0.9)) drop-shadow(0 0 8px rgba(255, 255, 255, 0.8)) brightness(1.4) saturate(1.3)"
              : "none",
            pointerEvents: "none",
            contain: "layout style paint", // Contain filter effects to wrapper bounds for better performance
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
              overflow: "hidden", // Clip sprite background to frame
              transition: "none",
              animation: "none",
              backgroundRepeat: "no-repeat",
              imageRendering: "pixelated",
              filter: enrageActive 
                ? "hue-rotate(-5deg) saturate(1.15) brightness(1.05)" 
                : abilityEffect === 'backstab'
                ? "brightness(1.1) contrast(1.2)"
                : abilityEffect === 'deathStrike'
                ? "brightness(1.2) contrast(1.3) saturate(1.4)"
                : abilityEffect === 'holyStrike'
                ? "brightness(1.3) saturate(1.2) hue-rotate(10deg)"
                : "none",
            }}
          />
        </div>
      </div>
    );
  }
);

HeroSpriteJS.displayName = "HeroSpriteJS";

export default HeroSpriteJS;
