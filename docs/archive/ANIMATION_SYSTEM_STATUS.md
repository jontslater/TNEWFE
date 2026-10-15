# Animation System Status - Detailed Summary

## What We're Doing

### Overall Goal
We're implementing a JavaScript-driven sprite animation system using `requestAnimationFrame` (rAF) to replace CSS-based animations. This provides:
- **Frame-perfect control** over sprite animations
- **No flickering** during transitions
- **Discrete frame steps** (no smooth scrolling/interpolation)
- **Consistent behavior** across all animation types (attack, hurt, idle, death, etc.)

### Architecture Overview

#### 1. **SpriteAnimator Component** (`src/components/SpriteAnimator.tsx`)
- **Purpose**: Pure rAF-driven sprite animator that handles frame-by-frame updates
- **How it works**:
  - Uses `requestAnimationFrame` to update `background-position` at discrete frame intervals
  - Calculates frame index: `Math.floor((elapsed / duration) * frameCount)`
  - Only updates DOM when frame actually changes (prevents scrolling)
  - Uses `setProperty` with `important` to prevent CSS interpolation
  - Forces reflow with `offsetWidth` to commit changes immediately
- **Key Features**:
  - Fixed 48x48 frame size for all sprites
  - Supports looping and non-looping animations
  - `onComplete` callback for non-looping animations
  - Same logic for ALL animation types (attack, hurt, idle, death, etc.)

#### 2. **useEnemyAnimator Hook** (`src/hooks/useEnemyAnimator.ts`)
- **Purpose**: Manages animation state and auto-return-to-idle logic
- **How it works**:
  - Tracks `currentAnimation` state
  - Handles interrupt rules (death blocks all, hurt interrupts non-death)
  - Auto-returns to idle after non-looping animations complete
  - Uses `setTimeout` as backup for auto-return (SpriteAnimator's `onComplete` is primary)
- **Key Features**:
  - Prevents animation interruptions (e.g., idle won't interrupt hurt)
  - Manages looping vs non-looping state
  - Provides `playAnimation` method for external control

#### 3. **EnemySpriteJS Component** (`src/components/EnemySpriteJS.tsx`)
- **Purpose**: React component that wraps SpriteAnimator and useEnemyAnimator
- **How it works**:
  - Uses `getEnemyAnimations` to retrieve animation data for enemy type
  - Exposes `playAnimation` via `useImperativeHandle` for parent components
  - Determines if animation should loop based on animation name
  - Handles auto-return to idle via `onComplete` callback
- **Key Features**:
  - Backward compatible API (same interface as old EnemySprite)
  - Handles enemy facing (left/right) with CSS transforms
  - Scales sprites 2.5x for display

#### 4. **Animation Data** (`src/utils/spriteAnimationData.ts`)
- **Purpose**: Centralized animation data for all enemies
- **Structure**:
  ```typescript
  {
    frameCount: number,      // Number of frames in sprite sheet
    frameWidth: 48,          // Always 48px
    frameHeight: 48,         // Always 48px
    duration: number,        // Total animation duration in ms
    spriteSheet: string      // Path to sprite sheet image
  }
  ```
- **Key Features**:
  - All sprites are 48x48 pixels
  - Horizontal sprite sheets (frames side-by-side)
  - Case-insensitive enemy type matching
  - Supports all animation variants (attack, attack2, attack3, strongAttack, hurt, death, etc.)

#### 5. **Attack Variant Selection** (`src/pages/BrowserSourcePage.tsx`)
- **Purpose**: Randomly selects attack animation variant for enemies with multiple attacks
- **How it works**:
  - Checks available attacks from `ENEMY_SPRITES` config
  - 15% chance for `strongAttack` (if available)
  - 85% chance for regular attacks (`attack`, `attack2`, `attack3`) - randomly selected
  - Logs selection for debugging
- **Example**: Kobold Warrior has `attack`, `attack2`, `attack3`, and `strongAttack` - randomly picks one

#### 6. **Combat Integration** (`src/pages/BrowserSourcePage.tsx`)
- **Purpose**: Connects combat engine callbacks to animation system
- **How it works**:
  - Listens to `combatEngine.onAnimation` callbacks
  - Resolves enemy ID from various formats (`battle-enemy-{id}`, `enemy-{id}`, etc.)
  - Calls `setEnemyAnimation` which uses refs to trigger animations
  - Handles special cases (Werewolf transformation, Demon Lord flying)

---

## What's Working ✅

### 1. **Animation System Core**
- ✅ **SpriteAnimator** correctly calculates and displays frames
- ✅ **Frame updates** only happen when frame index changes (no scrolling)
- ✅ **CSS interpolation prevented** with `setProperty` and `important`
- ✅ **Immediate reflow** ensures changes commit before next paint
- ✅ **All animations use same logic** (attack, hurt, idle, death all work identically)

### 2. **Animation Variants**
- ✅ **Attack variant selection** working correctly
  - Randomly selects from `attack`, `attack2`, `attack3`
  - 15% chance for `strongAttack`
  - Logs show correct selection: `Selected: attack3 (rand=0.509)`, `Selected: attack2 (rand=0.203)`
- ✅ **Multiple attack animations** properly defined in animation data
- ✅ **Animation data lookup** correctly maps enemy types to animation keys

### 3. **Animation State Management**
- ✅ **Auto-return to idle** working for non-looping animations
- ✅ **Interrupt rules** working (death blocks all, hurt interrupts non-death)
- ✅ **Looping animations** correctly identified (idle, walk, run, move, flying, idleHuman)
- ✅ **Animation completion** handled via `onComplete` callback

### 4. **Hurt Animations**
- ✅ **Hurt animations** play correctly without flickering
- ✅ **Hurt → idle transition** smooth (no flicker)
- ✅ **Multiple hurt triggers** handled (rapid retrigger prevention)
- ✅ **Frame stepping** discrete and correct

### 5. **Idle Animations**
- ✅ **Idle animations** loop correctly
- ✅ **Idle visible** when no other animation playing
- ✅ **Idle doesn't interrupt** hurt/attack animations

### 6. **Combat Integration**
- ✅ **Animation callbacks** received from combat engine
- ✅ **Enemy ID resolution** working (handles various ID formats)
- ✅ **Ref-based animation triggering** working
- ✅ **Special enemy states** handled (Werewolf, Demon Lord)

---

## What's Not Working ❌

### 1. **Attack Animation Scrolling** (PRIMARY ISSUE)
**Problem**: Attack animations are still "scrolling" (smooth interpolation) instead of discrete frame steps

**Symptoms**:
- Attack animations appear to smoothly slide between frames
- Hurt animations work correctly (discrete steps)
- Idle animations work correctly (discrete steps)
- Only attack animations have this issue

**Why This Is Strange**:
- All animations use **identical logic** in `SpriteAnimator`
- Same frame calculation: `Math.floor((elapsed / duration) * frameCount)`
- Same DOM update logic: only update when `frameIndex !== lastFrameIndex`
- Same CSS safeguards: `setProperty` with `important`, `transition: none`

**Possible Causes**:
1. **Attack animations being interrupted/restarted** - If attack animation is restarted mid-play, the frame calculation resets, causing smooth interpolation
2. **Multiple attack callbacks** - If attack animation is triggered multiple times rapidly, the animation might restart before completing
3. **Timing issue** - Attack animations might have different timing characteristics that cause the frame calculation to be off
4. **Animation data issue** - Attack animation durations or frame counts might be incorrect

**Evidence from Logs**:
- Attack animations are being selected correctly (`attack2`, `attack3`)
- Animation is being triggered: `[useEnemyAnimator] Playing animation: "attack3", loop: false, frames: 6, duration: 720ms`
- But the visual result is scrolling instead of discrete steps

**Next Steps to Debug**:
1. Add frame-by-frame logging in `SpriteAnimator` to see if frames are updating correctly
2. Check if attack animation is being restarted/interrupted
3. Verify attack animation data (frameCount, duration) matches actual sprite sheets
4. Compare attack animation timing with hurt animation timing (hurt works, attack doesn't)

### 2. **Duplicate Attack Logs** (MINOR ISSUE)
**Problem**: Hero attack actions are being logged twice

**Symptoms**:
```
combatEngine.ts:623 ⚔️ [ATTACK] tehchno (vanguard) attacking - AoE: false, Target: Kobold Warrior
combatEngine.ts:623 ⚔️ [ATTACK] tehchno (vanguard) attacking - AoE: false, Target: Kobold Warrior
```

**Possible Causes**:
1. **Action added twice** - Same action might be added to `damageActions` array twice
2. **Deduplication not working** - The deduplication logic might not be catching duplicates
3. **scheduleAction called twice** - The `scheduleAction` callback might be executed twice

**Impact**: 
- **Low** - This is just a logging issue, doesn't affect functionality
- But it suggests the action might be processed twice, which could cause other issues

**Next Steps**:
1. Check if deduplication key is unique enough (`hero-${username}`)
2. Add logging to see if action is added to array twice
3. Check if `scheduleAction` is being called multiple times

### 3. **selectedTypes Mismatch** (CONFIGURATION ISSUE)
**Problem**: `selectedEnemyTypes` in UI shows "Adult Dragon" and "Demon Lord", but debug mode forces "Kobold Warrior"

**Symptoms**:
- Debug output shows: `selectedTypes: ["Adult Dragon", "Demon Lord"]`
- But actual enemy in combat: `"Kobold Warrior"`
- Debug mode is active: `debugEnemy: "Kobold Warrior"`

**Impact**:
- **Low** - Doesn't cause animation issues
- But can be confusing during debugging
- Might cause issues if enemy filtering is used

**Solution**:
- Clear `selectedEnemyTypes` in localStorage, OR
- Update `selectedEnemyTypes` to match debug mode enemy

---

## Technical Details

### Frame Calculation
```typescript
// Calculate which frame to show based on elapsed time
const elapsed = timestamp - startTime;
let frameIndex = Math.floor((elapsed / duration) * frameCount);

// Only update DOM if frame actually changed
if (frameIndex !== lastFrameIndex && spriteRef.current) {
  lastFrameIndex = frameIndex;
  const x = -(frameIndex * frameWidth);
  
  // Remove old position, set new position with important
  spriteRef.current.style.removeProperty('background-position');
  spriteRef.current.style.setProperty('background-position', `${x}px 0px`, 'important');
  spriteRef.current.style.setProperty('transition', 'none', 'important');
  
  // Force reflow to commit change
  void spriteRef.current.offsetWidth;
}
```

### Animation Data Example (Kobold Warrior)
```typescript
kobold: {
  idle: {
    frameCount: 6,
    frameWidth: 48,
    frameHeight: 48,
    duration: 720,  // 720ms total
    spriteSheet: "/Sprites/KoboldWarrior/with_outline/IDLE.png"
  },
  attack: {
    frameCount: 5,
    frameWidth: 48,
    frameHeight: 48,
    duration: 600,  // 600ms total = 120ms per frame
    spriteSheet: "/Sprites/KoboldWarrior/with_outline/ATTACK 1.png"
  },
  attack2: {
    frameCount: 5,
    frameWidth: 48,
    frameHeight: 48,
    duration: 600,
    spriteSheet: "/Sprites/KoboldWarrior/with_outline/ATTACK 2.png"
  },
  attack3: {
    frameCount: 6,
    frameWidth: 48,
    frameHeight: 48,
    duration: 720,  // 720ms total = 120ms per frame
    spriteSheet: "/Sprites/KoboldWarrior/with_outline/ATTACK 3.png"
  },
  strongAttack: {
    frameCount: 12,
    frameWidth: 48,
    frameHeight: 48,
    duration: 1440,  // 1440ms total = 120ms per frame
    spriteSheet: "/Sprites/KoboldWarrior/with_outline/STRONG ATTACK.png"
  },
  hurt: {
    frameCount: 4,
    frameWidth: 48,
    frameHeight: 48,
    duration: 400,  // 400ms total = 100ms per frame
    spriteSheet: "/Sprites/KoboldWarrior/with_outline/HURT.png"
  }
}
```

### Animation Flow
1. **Combat Engine** triggers action → calls `callbacks.triggerAnimation(entityId, 'attack', false)`
2. **BrowserSourcePage** receives callback → calls `setEnemyAnimation(enemyId, 'attack', enemyName)`
3. **setEnemyAnimation** selects attack variant → calls `ref.current.playAnimation('attack2')`
4. **EnemySpriteJS** receives call → calls `useEnemyAnimator.playAnimation('attack2', false)`
5. **useEnemyAnimator** updates state → sets `currentAnimation = 'attack2'`
6. **EnemySpriteJS** passes data → `<SpriteAnimator animationData={attack2Data} shouldLoop={false} />`
7. **SpriteAnimator** starts rAF loop → calculates frames and updates `background-position`
8. **Animation completes** → `onComplete` callback → returns to idle

---

## Current Status Summary

### ✅ Working Well
- Hurt animations (discrete frame steps, no flicker)
- Idle animations (looping correctly)
- Attack variant selection (random, weighted correctly)
- Animation state management (interrupts, auto-return)
- Combat integration (callbacks, ID resolution)

### ❌ Needs Fixing
- **Attack animation scrolling** (primary issue - animations interpolate instead of stepping)
- Duplicate attack logs (minor - logging issue)
- selectedTypes mismatch (configuration - not critical)

### 🔍 Under Investigation
- Why attack animations scroll when hurt/idle work correctly
- Why same logic produces different results for attack vs hurt
- Whether attack animations are being interrupted/restarted

---

## Next Steps

1. **Debug attack animation scrolling**:
   - Add detailed frame-by-frame logging
   - Check if attack animation is being restarted
   - Verify attack animation data matches sprite sheets
   - Compare attack vs hurt animation timing

2. **Fix duplicate attack logs**:
   - Improve deduplication logic
   - Add logging to track action addition
   - Check if `scheduleAction` is called multiple times

3. **Clean up configuration**:
   - Sync `selectedEnemyTypes` with debug mode
   - Or clear `selectedEnemyTypes` when debug mode is active
