# CRITICAL Combat System Issues Found

## 🚨 Issue #1: Duplicate Debuff Processing
**Problem**: Debuffs are being processed in TWO places simultaneously:
1. In `resolveCombat()` - calls `processDebuffs()` once per round
2. In `fullCombatEngine.ts` - `setInterval` calls `processDebuffsDuringCombat()` every 2 seconds

**Result**: DoT damage applied multiple times, causing spam

**Fix**: Remove one of them. Since resolveCombat processes debuffs at the start of each round, we should disable the interval during active combat rounds.

## 🚨 Issue #2: Multiple Non-Blocking setTimeout Calls
**Problem**: Many setTimeout calls are fire-and-forget and don't block execution:

1. Class ability timers (Taunt/Fade/Intercept decay)
2. Emergency ability timers (Last Stand end)
3. Healer ability timers (HoT ticks)
4. Death animation flag clearing

**Result**: These timers continue running even after combat ends, can trigger during next round

**Fix**: Store timer IDs and clear them when combat ends, OR make them blocking

## 🚨 Issue #3: setInterval for Debuff Ticking
**Problem**: `startDebuffTickInterval()` creates an interval that runs every 2 seconds, even during active combat resolution

**Result**: Overlapping debuff processing with resolveCombat's debuff processing

**Fix**: Disable interval during active combat rounds, OR remove debuff processing from resolveCombat

## Recommended Fix Strategy

1. **Disable debuff interval during active combat rounds**
   - Pause interval when `resolvingCombat` flag is true
   - Resume after round completes

2. **Store and clear all setTimeout timers**
   - Keep track of all active timers
   - Clear them when combat ends or round starts

3. **Ensure sequential execution**
   - All combat state changes should happen synchronously
   - Only animation delays should use setTimeout (and be awaited)
