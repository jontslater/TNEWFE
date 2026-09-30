# Combat System Reassessment - Critical Issues

## Core Problem
Multiple combat rounds are executing simultaneously, causing:
- Spam attacks (damage numbers overlapping)
- Sprite shaking (rapid animation restarts)
- Overlapping actions (heroes and enemies acting at the same time)

## Root Causes

### 1. **Async IIFE Not Returned** (Critical)
```typescript
// fullCombatEngine.ts line 2112
async resolveCombat() {
  this.state.resolvingCombat = true;
  (async () => {  // ❌ IIFE not returned
    await resolveCombatSimple(...);
  })();
  // Function returns immediately here, flag is cleared too early
}
```

**Problem**: The async IIFE is fire-and-forget. The function returns immediately, allowing the next round to start before the previous one finishes.

### 2. **Multiple Entry Points Without Coordination**
- `startCombat()` → calls `resolveCombat()` (not awaited)
- `checkCombatVictory()` → calls `startCombat()` with setTimeout
- No strict sequential locking mechanism

### 3. **Race Condition with Flag**
The `resolvingCombat` flag is checked, but since `resolveCombat()` returns immediately, multiple calls can pass the check.

### 4. **State Sync Interval Interference**
The 1000ms interval in BrowserSourcePage might be causing rapid state updates that trigger re-renders during combat.

## Solution Architecture

### New Flow:
```
startCombat()
  → Check resolvingCombat flag (reject if true)
  → Set resolvingCombat = true
  → await resolveCombat()  ← Properly awaited
    → Execute all actions sequentially
    → onComplete callback
      → Set resolvingCombat = false
      → checkCombatVictory()
        → If enemies alive: setTimeout(() => startCombat(), delay)
        → If enemies dead: end combat
```

### Key Changes:
1. Remove async IIFE wrapper - make resolveCombat itself async
2. Properly await resolveCombat in startCombat
3. Add stricter guards to prevent overlapping
4. Ensure flag is only cleared after all async work completes
