# Attack Animation Flow - Detailed Explanation

## Overview
The attack animation uses a **transform-based frame-by-frame system** where we move a wide sprite sheet horizontally to show different frames. The sprite element is wider than the visible area, and we use `transform: translateX()` to shift it.

## Current Setup (4 frames, 600ms duration)

### 1. Animation Data
```typescript
attack: {
  frameCount: 4,           // 4 frames
  frameWidth: 48,           // Each frame is 48px wide
  frameHeight: 48,          // Each frame is 48px tall
  duration: 600,             // Total animation: 600ms
  spriteSheet: "/Sprites/KoboldWarrior/with_outline/ATTACK 1.png"
}
```
- **Frame duration**: 600ms ÷ 4 = **150ms per frame**
- **Sprite sheet width**: 4 × 48px = **192px** (calculated, not actual image width)

### 2. DOM Structure
```
<div class="enemy-sprite-container">          // Outer container
  <div style="transform: scale(2.5)">         // Scale container (2.5x zoom)
    <div style="overflow: hidden; width: 48px; height: 48px">  // Clipping wrapper (shows only 48px)
      <div ref={spriteRef} style="width: 192px; height: 48px; background-image: url(...)">  // Sprite element (full sprite sheet)
        // This element is 192px wide but only 48px is visible through the clipping wrapper
      </div>
    </div>
  </div>
</div>
```

### 3. How It Works

#### Step 1: Initial Setup (when animation starts)
```typescript
// Sprite element is set to full sprite sheet width
spriteRef.current.style.width = "192px";  // 4 frames × 48px
spriteRef.current.style.height = "48px";
spriteRef.current.style.backgroundImage = "url(/Sprites/.../ATTACK 1.png)";
spriteRef.current.style.backgroundSize = "192px 48px";  // Match sprite sheet dimensions
spriteRef.current.style.transform = "translateX(0px)";  // Start at frame 0
```

#### Step 2: Frame Updates (every 150ms)
```typescript
// For frame 0: translateX(0px)     → Shows frames 0-48px
// For frame 1: translateX(-48px)   → Shows frames 48-96px
// For frame 2: translateX(-96px)    → Shows frames 96-144px
// For frame 3: translateX(-144px)   → Shows frames 144-192px

const translateX = Math.round(-(frameIndex * 48));
spriteRef.current.style.transform = `translateX(${translateX}px)`;
```

#### Step 3: Timing
```typescript
// Uses setTimeout to schedule each frame
setTimeout(() => {
  updateToFrame(nextFrame);
}, 150);  // 150ms per frame
```

## The Scrolling Problem

### Why It's Scrolling Instead of Stepping

The animation is **smoothly interpolating** between frames instead of showing discrete steps. This happens when:

1. **Browser interpolation**: The browser is smoothing the transform between `setTimeout` calls
2. **Timing drift**: `setTimeout` isn't perfectly accurate, causing frames to overlap
3. **Transform not being applied synchronously**: The transform might be getting queued instead of applied immediately

### Current Anti-Interpolation Measures

We're already doing:
- ✅ `transition: none !important` - Disables CSS transitions
- ✅ `animation: none !important` - Disables CSS animations
- ✅ Removing all vendor-prefixed transforms before setting new one
- ✅ Using `translateX` instead of `translate3d`
- ✅ Setting transform with `!important` on all vendor prefixes
- ✅ Forcing reflows with `offsetWidth`

**But it's still scrolling**, which suggests the browser is still interpolating.

## Why Idle/Hurt/Death Work But Attack Doesn't

**Idle** (6 frames, 720ms, loops):
- ✅ Works perfectly with discrete steps
- Uses same transform system
- Same frame duration (120ms per frame)

**Hurt** (4 frames, 400ms, non-looping):
- ✅ Works perfectly with discrete steps
- Uses same transform system
- Similar frame duration (100ms per frame)

**Attack** (4 frames, 600ms, non-looping):
- ❌ Still scrolling/smooth
- Uses same transform system
- Similar frame duration (150ms per frame)

## Possible Causes

### 1. **Scale Transform Interference**
The scale container has `transform: scale(2.5)`. When combined with the sprite's `translateX`, the browser might be interpolating both transforms together.

### 2. **setTimeout Timing Issues**
`setTimeout` has ~4-16ms minimum delay and isn't frame-perfect. If frames are scheduled too close together, the browser might interpolate.

### 3. **Background-Size Mismatch**
We're using calculated width (192px) but the actual image is 740px. The browser might be scaling the background, causing misalignment.

### 4. **Frame Count Mismatch**
If the actual image has more/fewer frames than 4, the 48px-per-frame calculation will be wrong.

## Next Steps to Fix

### Option 1: Use `requestAnimationFrame` Instead of `setTimeout`
```typescript
// Instead of setTimeout, use rAF with frame-based timing
const animate = (timestamp: number) => {
  const elapsed = timestamp - startTime;
  const frameIndex = Math.floor(elapsed / frameDuration);
  updateToFrame(frameIndex);
  requestAnimationFrame(animate);
};
```

### Option 2: Verify Actual Frame Count
Load the image and count actual frames:
```typescript
const img = new Image();
img.onload = () => {
  const actualFrames = Math.floor(img.width / 48);
  console.log(`Actual frames: ${actualFrames}`);
};
```

### Option 3: Separate Scale from Transform
Move the scale transform to a different element or use CSS instead of inline styles.

### Option 4: Use `background-position` Instead of `transform`
Go back to `background-position` but ensure it's set synchronously without transitions.

## Current Code Flow

1. **Combat engine triggers attack** → `triggerAnimation('attack')`
2. **BrowserSourcePage receives callback** → `setEnemyAnimation('attack')`
3. **EnemySpriteJS ref called** → `ref.current.playAnimation('attack')`
4. **useEnemyAnimator hook** → `playAnimation('attack')` → `setCurrentAnimation(attackData)`
5. **EnemySpriteJS useEffect** → Detects `currentAnimation` change → Sets up sprite element
6. **updateToFrame(0)** → Called immediately
7. **setTimeout** → Schedules `updateToFrame(1)` after 150ms
8. **Repeat** → Until all 4 frames are shown

## Debug Checklist

- [ ] Check console logs for actual vs calculated frame counts
- [ ] Verify `translateX` values are correct (-0, -48, -96, -144)
- [ ] Check if `setTimeout` is being called on time
- [ ] Verify transform is being applied synchronously
- [ ] Check if scale transform is interfering
- [ ] Verify background-size matches sprite sheet width
