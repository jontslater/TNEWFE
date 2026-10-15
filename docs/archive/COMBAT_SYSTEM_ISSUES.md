# Combat System Issues Analysis

## Critical Problems Identified

### 1. **Async IIFE Not Being Awaited**
- In `fullCombatEngine.ts` line 2112, `resolveCombat()` creates an async IIFE but doesn't return or await it
- This means `resolveCombat()` completes immediately, allowing multiple rounds to start
- The `resolvingCombat` flag gets cleared before actions actually complete

### 2. **Multiple Entry Points for Combat Rounds**
- `startCombat()` → calls `resolveCombat()` without await
- `checkCombatVictory()` → calls `startCombat()` with setTimeout(100ms)
- This creates a chain where rounds can overlap

### 3. **Race Conditions**
- `resolvingCombat` flag is checked but the async function completes too quickly
- Multiple `setTimeout` calls can queue up multiple rounds
- State sync interval (1000ms) might interfere with combat state

### 4. **Unclear Flow**
```
startCombat() 
  → resolveCombat() (async, not awaited)
    → async IIFE inside (not returned)
      → resolveCombatSimple() (awaited)
        → onComplete callback
          → checkCombatVictory()
            → setTimeout(() => startCombat(), 100)
              → LOOP BACK
```

## Solution Strategy

1. **Make resolveCombat() properly async and awaited**
2. **Ensure strict sequential execution**
3. **Remove redundant async IIFE wrapper**
4. **Add proper guards to prevent overlapping**
5. **Simplify the flow**
