# Combat System Fixes Applied

## ✅ Fix #1: Disabled Duplicate Debuff Processing
**Problem**: Debuffs were being processed in TWO places:
- `resolveCombat()` Phase 1: `processDebuffs()` called once per round
- `fullCombatEngine.ts`: `setInterval` running every 2 seconds calling `processDebuffsDuringCombat()`

**Result**: DoT damage was applied multiple times, causing spam

**Fix Applied**: 
- Disabled `startDebuffTickInterval()` call in `startCombat()`
- Commented out the setInterval in `startDebuffTickInterval()` method

**Impact**: Debuffs now only processed once per combat round in `resolveCombat()` Phase 1

## ⚠️ Remaining Issues to Address

### Issue #2: Fire-and-Forget setTimeout Calls
Multiple setTimeout calls that don't block execution:

1. **Class Abilities (combatEngine.ts)**:
   - Line 177: Taunt decay (8000ms)
   - Line 188: Intercept end (4000ms)
   - Line 195: Threat recovery (5000ms)
   - Line 210: Fade recovery (8000ms)

2. **Emergency Abilities (emergencyAbilities.ts)**:
   - Line 79: Last Stand end (10000ms)

3. **Death Animation Flags (buffsDebuffs.ts)**:
   - Line 82: Hero death animation flag clear
   - Line 192: Enemy death animation flag clear

4. **Healer Abilities (healerAbilities.ts)**:
   - Line 453: HoT ticks (multiple, 3000ms each)
   - Line 492: Totem pulses (multiple)
   - Line 544: Essence Font ticks (multiple)

**Recommendation**: These are mostly OK as they're cleanup/debounce timers, but they should be stored and cleared when combat ends to prevent triggering during next round.

## Next Steps

1. ✅ Fix #1 Applied - Debuff interval disabled
2. ⏭️ Test combat system to see if spam is reduced
3. ⏭️ If still issues, track and clear all setTimeout timers when combat ends
4. ⏭️ Review all async functions to ensure proper awaiting

## Testing Checklist

- [ ] DoT damage applies once per round (not multiple times)
- [ ] No overlapping combat rounds
- [ ] No spam attacks
- [ ] Sprites don't shake/flicker
- [ ] Sequential action execution
