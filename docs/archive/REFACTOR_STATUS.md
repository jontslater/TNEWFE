# Ref-Based Animation Refactor - Status

## ✅ Completed

1. **New EnemySprite Component** (`src/components/EnemySprite.tsx`)
   - Uses `forwardRef` and `useImperativeHandle`
   - Exposes `playAnimation()` and `setSpriteImage()` methods
   - Restarts animations by toggling classes (no cloning)

2. **BrowserSourcePage Integration Started**
   - Added `enemySpriteRefs` map
   - Added `getOrCreateEnemyRef()` helper
   - Updated enemy rendering to use new component with refs

## 🔄 Remaining Work

### 1. Update CSS to Use `anim-*` Classes

Replace `data-animation` selectors with class-based selectors:

**Current:**
```css
.kobold-sprite-container[data-animation="hurt"] .kobold-sprite {
  animation: koboldHurtFrames 0.4s steps(4) 1 forwards !important;
}
```

**New (explicit properties):**
```css
.enemy-sprite-container.anim-hurt .kobold-sprite {
  animation-name: koboldHurtFrames;
  animation-duration: var(--anim-duration-hurt);
  animation-iteration-count: 1;
  animation-timing-function: steps(4);
  animation-fill-mode: forwards !important;
  transition: none !important;
}

.enemy-sprite-container {
  --anim-duration-idle: 1.8s;
  --anim-duration-attack: 0.6s;
  --anim-duration-hurt: 0.4s;
  --anim-duration-death: 1s;
}
```

### 2. Replace `setEnemyAnimation` Function

The current function (lines 236-566 in BrowserSourcePage.tsx) needs to be replaced with a ref-based version:

**Key changes:**
- Remove all DOM cloning logic
- Use `ref.current.playAnimation()` instead
- Use `ref.current.setSpriteImage()` to change sprite sheets
- Keep the auto-return to idle logic but trigger via ref

See the provided ref-based version in the original message.

### 3. Add Combat Timing Debug Helpers

Add to `combatEngine.ts`:

```typescript
const ACTION_DELAY = 1500;

function scheduleAction(actionFn: () => void, delayFromStart: number, label?: string) {
  const scheduledAt = Date.now() + delayFromStart;
  console.debug(`[Combat] scheduling ${label ?? 'action'} to run in ${delayFromStart}ms (scheduledAt ${scheduledAt})`);
  setTimeout(() => {
    console.debug(`[Combat] executing ${label ?? 'action'} at ${Date.now()} (should be ~${scheduledAt})`);
    actionFn();
  }, delayFromStart);
}
```

## Next Steps

1. Test the new EnemySprite component is rendering correctly
2. Update CSS with explicit animation properties
3. Replace setEnemyAnimation function
4. Add timing debug helpers
5. Test animations work correctly
6. Verify no scrolling/interpolation issues

## Notes

- The new approach eliminates DOM cloning, which should fix React re-render conflicts
- Explicit animation properties should prevent CSS interpolation issues
- Ref-based API keeps React in control while allowing direct animation triggers
