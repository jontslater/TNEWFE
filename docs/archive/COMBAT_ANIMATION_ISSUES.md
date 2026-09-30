# Combat Animation Issues - Problem Documentation

## Overview
This document tracks ongoing issues with enemy sprite animations during combat in the browser source page, particularly focusing on animation transitions, combat timing, and synchronization between the React UI and the combat engine.

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **React Router** for navigation
- **Firebase Firestore** for real-time data sync
- **CSS Animations** using `steps()` for sprite frame animation
- **DOM Manipulation** for direct sprite control (hybrid approach with React)

### Combat Engine Architecture
- **FullCombatEngine** (`fullCombatEngine.ts`) - Main combat loop manager
  - Handles start/stop combat
  - Manages combat state (`resolvingCombat`, `isCombatStarting` flags)
  - Coordinates callbacks for animations, combat text, and logs
  - Triggers adventure loop and combat rounds

- **CombatEngine** (`combatEngine.ts`) - Core combat logic
  - Resolves individual combat rounds
  - Calculates initiative order
  - Processes hero and enemy actions sequentially
  - Uses `ACTION_DELAY = 1500ms` between actions (matches Electron app)

### Animation System
- **Sprite Animations**: CSS-based using `background-position` and `steps()`
- **Sprite Config**: `ENEMY_SPRITES` object mapping enemy types to sprite paths
- **Animation Durations**: Calculated based on frame count and FPS
- **Direct DOM Manipulation**: Cloning elements to restart animations (matches Electron app approach)

## Problems Experienced

### 1. Sprite Disappearing/Vanishing
**Symptoms:**
- Enemy sprites (especially Kobold Warrior) invisible during idle
- Sprites only visible during animations (attack, hurt)
- Sprite disappears briefly when transitioning from hurt animation back to idle

**Root Cause:**
- `background-image` not being applied correctly on initial render
- React's `useEffect` in `EnemySprite` component may override manual DOM changes
- CSS specificity issues between inline styles and CSS classes
- When transitioning from hurt (ends at `-192px`) back to idle, the sprite position wasn't reset properly

**Attempted Solutions:**
1. ✅ Added default `background-image` to `.kobold-sprite` CSS class
2. ✅ Set `background-image` and `background-position` with `!important` in `EnemySprite` useEffect
3. ✅ Applied styles directly in JSX `style` prop for immediate application
4. ✅ Reset `background-position` to `0px 0px` before cloning sprite elements
5. ✅ Used `setProperty` with `'important'` flag to prevent React from overriding
6. ✅ Double `requestAnimationFrame` to ensure React has finished rendering before DOM manipulation
7. ⚠️ **Current Status**: Partially fixed - idle now works, but hurt→idle transition still has brief vanishing

### 2. Scrolling Animations (Not Stepping Through Frames)
**Symptoms:**
- Animations appear to "scroll" smoothly instead of stepping through frames
- Particularly noticeable on hurt and attack animations
- Animation doesn't play discrete frames - looks like a smooth transition

**Root Cause:**
- CSS `transition` property interfering with sprite frame animation
- `background-position` not being reset properly between animations
- Clone operation preserving old computed styles from previous animation

**Attempted Solutions:**
1. ✅ Added `transition: none !important` to sprite CSS classes
2. ✅ Set `transition: none` in inline styles when cloning
3. ✅ Reset `background-position` to `0px 0px` before and after cloning
4. ✅ Used `setProperty('transition', 'none', 'important')` on cloned elements
5. ✅ Added global CSS rule: `.sprite-container, .sprite-container *, .sprite-img { transition: none !important; }`
6. ⚠️ **Current Status**: Still occurring - animations still scroll instead of stepping

### 3. Enemy ID Mismatch
**Symptoms:**
- Console warnings: `Enemy BVLjZQcGYX1jawVyHSd6 not found exactly, using fallback element`
- Combat text and animations fail to find correct enemy elements
- Enemies regenerated mid-combat with new IDs

**Root Cause:**
- React regenerating enemy components with new IDs during combat
- Combat engine holding references to old enemy IDs
- Mismatch between `displayEnemies` state and combat engine's internal enemy list

**Attempted Solutions:**
1. ✅ Added `data-enemy-name` and `data-enemy-type` attributes to enemy containers
2. ✅ Implemented fallback lookup by enemy name when ID doesn't match
3. ✅ Added "last resort" fallback to use first available enemy if only one exists
4. ✅ Simplified `combatText.ts` lookup to use similar fallback strategy
5. ✅ **Current Status**: Fixed - fallback mechanism works, warnings are benign

### 4. Combat Timing - Actions Too Close Together
**Symptoms:**
- Damage appears to happen almost simultaneously
- Actions don't have proper 1500ms spacing
- Combat feels rushed/choppy

**Root Cause:**
- (Not yet fully diagnosed - may be callback timing or multiple rounds resolving simultaneously)

**Current Implementation:**
- `ACTION_DELAY = 1500ms` matches Electron app
- Each action scheduled with `setTimeout(action, actionDelay)`
- Delay captured before increment: `const actionDelay = delay; delay += ACTION_DELAY;`
- Victory check scheduled after all actions: `totalDelay = actions.length * ACTION_DELAY + 500`

**Attempted Solutions:**
- None yet - this is a newly identified issue

### 5. Duplicate Combat Rounds/Actions
**Symptoms:**
- Combat logs show attacks running twice
- `resolveCombat()` being called multiple times
- `startCombat()` called repeatedly

**Root Cause:**
- `resolveCombat()` and `startCombat()` not protected against re-entry
- Combat loop calling itself recursively without guards
- Victory check triggering new combat round while one is already resolving

**Attempted Solutions:**
1. ✅ Added `resolvingCombat` flag to `CombatState` interface
2. ✅ Guard in `resolveCombat()` to skip if `resolvingCombat === true`
3. ✅ Clear `resolvingCombat` after all actions complete
4. ✅ Added `isCombatStarting` flag to prevent duplicate `startCombat()` calls
5. ✅ **Current Status**: Fixed - guards prevent duplicate calls

## How Combat Loop Works

### Combat Flow (Electron App - game.js)
1. **Start Combat** (`startCombat()`)
   - Called when enemies present and heroes ready
   - Sets up combat interval (5 seconds between rounds)
   - First round executes immediately
   - Subsequent rounds execute every 5 seconds

2. **Resolve Combat Round** (`resolveCombat()`)
   - Calculates initiative order (reuses if same participants)
   - Creates action list: hero actions + enemy actions
   - Schedules each action with 1500ms delay between them:
     ```
     delay = 0
     action1: setTimeout(execute, 0ms)
     delay += 1500
     action2: setTimeout(execute, 1500ms)
     delay += 1500
     action3: setTimeout(execute, 3000ms)
     ...
     ```
   - After all actions complete: `setTimeout(checkCombatVictory, totalDelay + 500)`

3. **Check Victory** (`checkCombatVictory()`)
   - If enemies alive: call `startCombat()` to continue
   - If all enemies dead: end combat, distribute rewards

### Combat Flow (Web App - fullCombatEngine.ts)
**Similar structure but with React integration:**

1. **Start Combat**
   - Checks if combat already active (guard flag)
   - Sets up combat interval (5 seconds)
   - Calls `resolveCombat()` immediately for first round

2. **Resolve Combat**
   - Guard: Skip if `resolvingCombat === true`
   - Set `resolvingCombat = true`
   - Calculate initiative order
   - Process actions with 1500ms delays
   - After all actions: `setTimeout(() => { resolvingCombat = false; checkCombatVictory() })`

3. **Animation Callbacks**
   - `onAnimation(entityId, animation, isHero)` - triggers React state updates
   - `onCombatText(entityId, amount, type, isHero)` - displays scrolling damage numbers
   - `onLog(type, message)` - adds to combat log

### Key Differences from Electron
- **Electron**: Pure DOM manipulation, no React
- **Web**: Hybrid approach - React manages components, but we also do direct DOM manipulation
- **Electron**: Sprites cloned directly without React interference
- **Web**: Must coordinate between React state updates and direct DOM manipulation

## Animation System Details

### Sprite Animation Technique
**Note**: The Electron app uses **CSS-based sprite sheet animations** (not individual PNG frames as described in `IdleDnD/docs/Animation`). That document describes a Canvas/WebGL approach with individual PNG files, but the actual implementation uses sprite sheets.

1. **Sprite Sheets**: Single image with multiple frames horizontally
2. **CSS Animation**: Uses `steps()` function to jump between frames
   ```css
   animation: koboldHurtFrames 0.4s steps(4) 1 forwards;
   ```
   - `steps(4)`: 4 discrete frame jumps
   - `1 forwards`: Play once and stay on last frame
   - `background-position` animates from `0px 0px` to `-192px 0px`

3. **Animation Restart**: Clone element to force restart
   ```javascript
   const clone = spriteDiv.cloneNode(true);
   clone.style.backgroundImage = `url('${spritePath}')`;
   parent.replaceChild(clone, spriteDiv);
   ```

### Enemy Sprite Component (EnemySprite.tsx)
- React component that renders sprite `<div>`
- `useEffect` sets background-image, background-position, size
- Props: `enemyType`, `animation`, `facing`
- **Issue**: React's `useEffect` may override manual DOM changes from `setEnemyAnimation()`

### setEnemyAnimation() Function (BrowserSourcePage.tsx)
- Called by combat engine via `onAnimation` callback
- Updates React state: `setEnemyAnimations(prev => ({ ...prev, [enemyId]: animation }))`
- Then manipulates DOM directly (matches Electron approach):
  1. Find sprite element by ID/name
  2. Set `data-animation` attribute on container
  3. Get sprite path from `ENEMY_SPRITES` config
  4. Clone sprite div with new background-image
  5. Replace old div with clone

**Conflict**: React's `EnemySprite` component may re-render and replace our cloned element

## CSS Animation Rules

### Kobold Warrior Example
```css
/* Base sprite */
.kobold-sprite {
  width: 48px;
  height: 48px;
  background-size: 288px 48px;
  background-position: 0px 0px;
  background-image: url('/Sprites/KoboldWarrior/with_outline/IDLE.png');
}

/* Idle animation - loops infinitely */
.kobold-sprite-container[data-animation="idle"] .kobold-sprite {
  animation: koboldIdleCycle 1.8s steps(6) infinite;
}
@keyframes koboldIdleCycle {
  0% { background-position: 0px 0px; }
  100% { background-position: -288px 0px; }
}

/* Attack animation - plays once */
.kobold-sprite-container[data-animation="attack"] .kobold-sprite {
  animation: koboldAttackFrames 0.6s steps(5) 1;
}
@keyframes koboldAttackFrames {
  0% { background-position: 0px 0px; }
  100% { background-position: -240px 0px; }
}

/* Hurt animation - plays once, stays on last frame */
.kobold-sprite-container[data-animation="hurt"] .kobold-sprite {
  animation: koboldHurtFrames 0.4s steps(4) 1 forwards !important;
  transition: none !important;
}
@keyframes koboldHurtFrames {
  0% { background-position: 0px 0px; }
  100% { background-position: -192px 0px; }
}
```

### Critical CSS Rules
```css
/* Prevent transitions on all sprite elements */
.sprite-container,
.sprite-container *,
.sprite-img {
  transition: none !important;
}
```

## Current Animation State Management

### React State
- `enemyAnimations: Record<string, string>` - tracks current animation per enemy ID
- Updated via `setEnemyAnimations()` when combat engine triggers animation
- Read by `EnemySprite` component to set `animation` prop

### DOM State
- `data-animation` attribute on sprite container
- `background-image` inline style on sprite div
- `background-position` should be `0px 0px` at start of each animation

### Synchronization Issues
- React updates state → `EnemySprite` re-renders → may replace our cloned DOM element
- Direct DOM manipulation → clone/replace element → React may not know about it
- **Solution Attempt**: Double `requestAnimationFrame` to let React finish, then manipulate DOM

## Key Files

### Core Combat
- `E:\IdleDnD-Web\src\utils\fullCombatEngine.ts` - Combat loop manager
- `E:\IdleDnD-Web\src\utils\combatEngine.ts` - Round resolution logic
- `E:\IdleDnD-Web\src\utils\combat\enemyAttacks.ts` - Enemy attack processing

### UI/Animation
- `E:\IdleDnD-Web\src\pages\BrowserSourcePage.tsx` - Main React component, contains `setEnemyAnimation()`
- `E:\IdleDnD-Web\src\components\EnemySprite.tsx` - React sprite component
- `E:\IdleDnD-Web\src\utils\combatText.ts` - Scrolling damage numbers
- `E:\IdleDnD-Web\src\index.css` - Sprite animation CSS

### Config/Data
- `E:\IdleDnD-Web\src\utils\enemySpriteConfig.ts` - Enemy sprite paths and configs
- `E:\IdleDnD-Web\src\utils\animationDurations.ts` - Animation duration calculations

### Reference (Electron App)
- `E:\IdleDnD\game.js` - Original Electron implementation (lines 8020-8030 for sprite animation, 14720-14740 for combat timing)
- `E:\IdleDnD\docs\Animation` - Describes Canvas/PNG frame approach, but Electron app actually uses CSS sprite sheets
- `E:\IdleDnD\docs\COMBAT_SYSTEM.md` - Confirms Electron app uses CSS-based sprite sheet animations

## What We've Tried (Summary)

### For Scrolling Animation Issue:
1. ✅ Added `transition: none !important` to CSS
2. ✅ Set `transition: none` in inline styles
3. ✅ Reset `background-position` to `0px 0px` before cloning
4. ✅ Reset `background-position` on cloned element
5. ✅ Used `setProperty()` with `'important'` flag
6. ✅ Double `requestAnimationFrame` to wait for React
7. ✅ Reset position on original element before cloning
8. ❌ **Still not working** - animations still scroll

### For Vanishing Sprite Issue:
1. ✅ Added default background-image to CSS class
2. ✅ Set background-image with `!important` in useEffect
3. ✅ Applied styles in JSX style prop
4. ✅ Reset background-position on clone
5. ⚠️ **Partially fixed** - idle works, but hurt→idle transition still vanishes briefly

### For ID Mismatch:
1. ✅ Added data attributes for lookup
2. ✅ Implemented name-based fallback
3. ✅ Added single-enemy fallback
4. ✅ **Fixed** - fallbacks work correctly

### For Duplicate Rounds:
1. ✅ Added `resolvingCombat` guard flag
2. ✅ Added `isCombatStarting` guard flag
3. ✅ Clear flags after completion
4. ✅ **Fixed** - guards prevent duplicates

## Next Steps / Ideas to Try

### For Scrolling Animation:
1. **Check if CSS is actually being applied** - inspect computed styles in browser devtools
2. **Try removing all transitions at global level** - maybe something else is adding transitions
3. **Check if `steps()` is working correctly** - verify frame count matches sprite sheet
4. **Try setting `animation-timing-function: steps(4)` explicitly** instead of in shorthand
5. **Verify sprite sheet dimensions** - make sure background-size matches actual sprite sheet
6. **Check for conflicting CSS rules** - maybe another selector is overriding our styles

### For Combat Timing:
1. **Add debug logs** to track when each action is scheduled vs executed
2. **Check if multiple `resolveCombat()` calls are happening** despite guards
3. **Verify delay calculation** - ensure delays are cumulative, not all starting at 0
4. **Check callback timing** - maybe animations are triggering before damage is applied

### Alternative Approaches:
1. **Pure React approach** - Remove direct DOM manipulation, let React handle everything
   - Pros: No React/DOM conflicts
   - Cons: May not match Electron app behavior exactly
   
2. **Ref-based approach** - Use React refs to access DOM elements instead of `getElementById`
   - Pros: React-aware, won't be replaced by re-renders
   - Cons: More complex state management

3. **CSS-only animations** - Remove cloning, use CSS animation restart techniques
   - Pros: Simpler, no DOM manipulation
   - Cons: Harder to restart animations on demand

## Questions / Unknowns

1. **Why does Electron app work but web app doesn't?**
   - Electron doesn't have React re-rendering sprite components
   - Electron's DOM manipulation is simpler (no React interference)

2. **Is the scrolling actually from transitions or from something else?**
   - Need to verify in browser devtools that `transition: none` is actually applied
   - Could be a different CSS property causing smooth interpolation

3. **Should we abandon the hybrid approach?**
   - Pure React might be cleaner but may require more refactoring
   - Pure DOM manipulation might work better but loses React benefits

4. **Why does hurt animation scroll but idle doesn't?**
   - Idle animation loops, hurt plays once
   - Hurt uses `forwards` which stays on last frame
   - Maybe the transition happens when resetting from last frame back to first frame?

## Debugging Tips

### Check Computed Styles
```javascript
// In browser console
const sprite = document.querySelector('.kobold-sprite');
const computed = window.getComputedStyle(sprite);
console.log({
  backgroundPosition: computed.backgroundPosition,
  transition: computed.transition,
  animation: computed.animation,
  backgroundImage: computed.backgroundImage
});
```

### Monitor Animation State
- Check React DevTools for `enemyAnimations` state
- Check DOM inspector for `data-animation` attribute
- Watch console for animation callback logs

### Verify Timing
- Add `console.time()` and `console.timeEnd()` around animation changes
- Log delay values in combat engine
- Check if `requestAnimationFrame` callbacks are firing in correct order

## Related Issues / Context

- **Idle animation works** - So base sprite rendering is correct
- **Attack animation sometimes works** - So animation system is partially functional
- **Hurt animation scrolls** - So something about hurt specifically is broken
- **Electron app works perfectly** - So the approach is sound, just needs web adaptation

## Last Updated
- Date: Current session
- Focus: Scrolling animations and combat timing
- Status: In progress - scrolling animation still not fixed
