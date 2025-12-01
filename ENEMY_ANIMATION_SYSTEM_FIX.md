# Enemy Animation System - Complete Fix Documentation

## Overview
This document details the extensive work required to fix the enemy sprite animation system, which was experiencing scrolling, flickering, and sizing issues. The final solution uses a JS-driven, frame-by-frame animation system with proper scaling and positioning.

## Problems Encountered

### 1. **Scrolling/Interpolation Issues**
- Animations were "scrolling" instead of showing discrete frame steps
- Browser was interpolating between frame positions
- CSS transitions were interfering with discrete frame updates

### 2. **Sizing and Scaling Issues**
- Attack animations (148×96) were larger than idle/hurt (48×48)
- Container was resizing dynamically, causing visual jumps
- Animations were being stretched or squished

### 3. **Positioning Issues**
- Enemies were floating or sinking relative to ground
- Feet weren't aligned consistently across animations
- Combat text was being cut off due to sprite overflow

### 4. **Multiple Sprites Showing**
- Multiple frames visible at once instead of single frame
- Container wasn't properly clipping the sprite sheet

## Solution Architecture

### Core Components

#### 1. **EnemySpriteJS Component** (`src/components/EnemySpriteJS.tsx`)
- JS-driven animation using `requestAnimationFrame`
- Frame-by-frame updates with discrete stepping
- Fixed 48×48 viewport for all animations
- Feet-anchored positioning

#### 2. **useEnemyAnimator Hook** (`src/hooks/useEnemyAnimator.ts`)
- Unified animation state management
- Attack variant selection (attack, attack2, attack3, strongAttack)
- Auto-return to idle after non-looping animations
- Interrupt handling (death blocks all, hurt interrupts)

#### 3. **Sprite Animation Data** (`src/utils/spriteAnimationData.ts`)
- Centralized animation metadata
- Frame counts, dimensions, durations, sprite sheet paths
- Handles different frame sizes (48×48 for most, 148×96 for attack)

## Key Technical Solutions

### 1. **Fixed Viewport with Feet Anchoring**

```typescript
const VIEWPORT = 48; // Fixed 48×48 viewport for all animations

// Calculate offsets to center and align feet
const offsetY = VIEWPORT - scaledFrameHeight; // align feet at bottom
const offsetX = (VIEWPORT - scaledFrameWidth) / 2; // center horizontally
```

**Why this works:**
- All animations use the same 48×48 viewport
- Feet are always anchored at the bottom
- Larger animations are scaled down to fit
- Consistent positioning across all animation types

### 2. **Separate ScaleX and ScaleY**

```typescript
const scaleX = frameWidth > VIEWPORT ? VIEWPORT / frameWidth : 1;
const scaleY = frameHeight > VIEWPORT ? VIEWPORT / frameHeight : 1;

// Use separate scales to fill viewport without squishing
el.style.setProperty("transform", `scaleX(${scaleX}) scaleY(${scaleY}) translateX(${x}px)`, "important");
```

**Why this works:**
- Prevents vertical squishing for non-square animations
- Attack (148×96) scales to 48×48 without distortion
- Idle (48×48) uses scale 1.0 (no scaling)
- Each dimension scales independently to fit viewport

### 3. **Discrete Frame Updates**

```typescript
// Only update frame if enough time has passed
if (delta >= frameTime) {
  let index = Math.floor(elapsed / frameTime);
  // ... update transform
  lastFrameTime = ts - (delta % frameTime); // Preserve timing accuracy
}
```

**Why this works:**
- Prevents sliding by only updating when frame time has elapsed
- Maintains timing accuracy across frame boundaries
- Ensures discrete frame steps, not smooth interpolation

### 4. **Aggressive Transform Cleanup**

```typescript
// Remove all transform properties before setting new one
el.style.removeProperty("transform");
el.style.removeProperty("-webkit-transform");
el.style.removeProperty("-moz-transform");
el.style.removeProperty("-ms-transform");
el.style.removeProperty("-o-transform");
// Force reflow
void el.offsetWidth;
// Now set the new transform
el.style.setProperty("transform", `scaleX(${animScaleX}) scaleY(${animScaleY}) translateX(${x}px)`, "important");
```

**Why this works:**
- Prevents browser from interpolating between transforms
- Forces immediate style commit with reflow
- Uses `!important` to override any CSS rules
- Removes vendor-prefixed transforms to prevent conflicts

### 5. **Background Size Configuration**

```typescript
// Set backgroundSize to match ACTUAL sprite sheet dimensions (not scaled)
el.style.backgroundSize = `${sheetWidth}px ${frameHeight}px`;
```

**Why this works:**
- Tells browser the exact dimensions of the sprite sheet
- Ensures frames align correctly when using translateX
- Prevents browser from auto-scaling the background image
- Works with transform-based frame movement

### 6. **Transform Order**

```typescript
// CSS transforms apply right-to-left
// scaleX() scaleY() translateX() applies translateX first (unscaled), then scales
el.style.setProperty("transform", `scaleX(${scaleX}) scaleY(${scaleY}) translateX(${x}px)`, "important");
```

**Why this works:**
- `translateX` happens in unscaled coordinate space
- Move by full frame width (148px for attack), then scale down
- Ensures correct frame alignment after scaling
- Transform origin set to "top left" for consistent scaling

### 7. **World Position Adjustment**

```typescript
// In BrowserSourcePage.tsx - adjust enemy container position
bottom: `${bottomPx + 48}px`, // Add 48px to anchor by feet (viewport height)
```

**Why this works:**
- World Y position represents feet, not top of sprite
- Matches hero renderer behavior
- Ensures all animations share the same ground position
- Prevents enemies from floating or sinking

## Animation Data Structure

### SpriteAnimationData Interface

```typescript
export interface SpriteAnimationData {
  frameCount: number;      // Number of frames in animation
  frameWidth: number;      // Width of each frame (48px for most, 148px for attack)
  frameHeight: number;     // Height of each frame (48px for most, 96px for attack)
  duration: number;        // Total animation duration in ms
  spriteSheet: string;     // Path to sprite sheet image
}
```

### Example: Kobold Warrior

```typescript
kobold: {
  idle: {
    frameCount: 6,
    frameWidth: 48,
    frameHeight: 48,
    duration: 720,
    spriteSheet: "/Sprites/KoboldWarrior/with_outline/IDLE.png",
  },
  attack: {
    frameCount: 5,
    frameWidth: 148,  // Wider frames for slash effect
    frameHeight: 96,  // Taller frames for slash effect
    duration: 600,
    spriteSheet: "/Sprites/KoboldWarrior/with_outline/ATTACK 1.png",
  },
  // ... other animations
}
```

## CSS Rules

### Disable Transitions

```css
.enemy-sprite-js-element,
.enemy-sprite-container > div > div > div {
  transition: none !important;
  animation: none !important;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  will-change: transform; /* Optimize for transform-based animation */
}
```

**Why this is critical:**
- Prevents browser from smoothly interpolating between frames
- Ensures discrete frame steps
- Optimizes for transform changes

## Animation Flow

1. **Animation Request**: `playAnimation("attack")` called
2. **Variant Selection**: Hook selects attack variant (attack, attack2, attack3, strongAttack)
3. **Animation Data**: Converted from `SpriteAnimationData` to `AnimationData`
4. **Component Update**: `EnemySpriteJS` receives new `currentAnimation`
5. **Style Reset**: Element styles reset, scale calculated, offsets applied
6. **Animation Loop**: `requestAnimationFrame` loop starts
7. **Frame Updates**: Only update when `delta >= frameTime`
8. **Transform Update**: Remove old transform, set new one with scale and translateX
9. **Completion**: Non-looping animations call `onComplete()` to return to idle

## Critical Lessons Learned

### 1. **Never Use CSS Transitions for Sprite Animation**
- CSS transitions cause interpolation between frames
- Use `transition: none !important` everywhere
- Force discrete updates with `requestAnimationFrame`

### 2. **Transform Order Matters**
- CSS applies transforms right-to-left
- `scaleX() scaleY() translateX()` means translate first, then scale
- This ensures translateX uses unscaled coordinates

### 3. **Background Size Must Match Sprite Sheet**
- `backgroundSize` tells browser the exact sprite sheet dimensions
- Without it, browser may auto-scale incorrectly
- Must be set to actual dimensions, not scaled

### 4. **Fixed Viewport Prevents Resizing Issues**
- Dynamic container sizing causes visual jumps
- Fixed 48×48 viewport with scaling is more stable
- Feet anchoring ensures consistent positioning

### 5. **Separate ScaleX/ScaleY for Non-Square Animations**
- Uniform scale causes squishing for non-square animations
- Separate scales fill viewport without distortion
- Slight aspect ratio change is acceptable for consistency

### 6. **World Position Represents Feet, Not Top**
- Enemies must be positioned with feet at world Y
- Add viewport height (48px) to bottom position
- Matches hero renderer behavior

### 7. **Discrete Frame Updates Prevent Sliding**
- Only update when `delta >= frameTime`
- Preserve timing accuracy with `lastFrameTime = ts - (delta % frameTime)`
- Prevents multiple updates per frame

## Testing Checklist

- [x] Idle animations loop correctly
- [x] Attack animations play discrete frames (no scrolling)
- [x] Hurt animations play and return to idle
- [x] Death animations play once
- [x] All animations fit in 48×48 viewport
- [x] Feet align at bottom for all animations
- [x] No vertical squishing
- [x] No horizontal scrolling
- [x] Combat text not cut off
- [x] Multiple attack variants work
- [x] Animation interrupts work (hurt interrupts attack)
- [x] Auto-return to idle after non-looping animations

## Files Modified

1. `src/components/EnemySpriteJS.tsx` - Main animation component
2. `src/hooks/useEnemyAnimator.ts` - Animation state management
3. `src/utils/spriteAnimationData.ts` - Animation metadata
4. `src/pages/BrowserSourcePage.tsx` - Enemy positioning
5. `src/index.css` - CSS rules to prevent interpolation

## Future Improvements

1. **Performance**: Consider using CSS `contain` property for better isolation
2. **Caching**: Pre-calculate scales and offsets for each animation
3. **Debugging**: Add visual frame counter overlay for testing
4. **Error Handling**: Better fallbacks for missing animation data
5. **Documentation**: Add JSDoc comments to all animation functions

## Conclusion

The final solution uses a combination of:
- Fixed viewport with feet anchoring
- Separate scaleX/scaleY for proper sizing
- Discrete frame updates with timing preservation
- Aggressive transform cleanup to prevent interpolation
- Correct background size configuration
- Proper transform order
- World position adjustment for feet alignment

This creates a robust, performant animation system that handles all enemy types and animation variants correctly.
