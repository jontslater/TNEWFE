# Comprehensive Combat Function Audit

## Functions Called in resolveCombat()

### PHASE 1: Debuffs & Regeneration
1. **processDebuffs()** - ❌ Has setTimeout for death animation (line 82)
2. **processHpRegeneration()** - Need to check
3. **updateHeroBuffDurations()** - Need to check

### PHASE 2: Emergency Abilities  
4. **processEmergencyAbilities()** - ❌ Has setTimeout for Last Stand (line 79)

### PHASE 3: Healer Abilities
5. **processHealerAbilities()** - ❌ Has setTimeout for HoT ticks (lines 453, 492, 544)

### PHASE 4: Class Abilities
6. **forEach with setTimeout** - ❌ Multiple setTimeout calls for Taunt/Fade/Intercept (lines 177, 188, 195, 210)

### PHASE 5-8: Initiative & Action Building
7. **getCharacterStats()** - Need to check
8. **calculateSkillBonuses()** - Need to check
9. **calculateHeroDamage()** - Need to check
10. **applyHeroAbilities()** - Need to check
11. **processAoEAbilities()** - Need to check

### PHASE 9: Action Execution
12. **processEnemyAttack()** - ✅ Returns Promise, properly awaited
13. **createProjectile()** - ✅ Returns Promise
14. **callbacks.triggerAnimation()** - Need to check if blocking
15. **callbacks.triggerCombatText()** - Need to check if blocking

## Issues Found

### ❌ CRITICAL: Non-blocking setTimeout calls
These setTimeout calls are fire-and-forget and don't block execution:

1. **combatEngine.ts:177** - Taunt decay (8000ms)
2. **combatEngine.ts:188** - Intercept end (4000ms) 
3. **combatEngine.ts:195** - Threat recovery (5000ms)
4. **combatEngine.ts:210** - Fade recovery (8000ms)
5. **buffsDebuffs.ts:82** - Death animation flag clear
6. **emergencyAbilities.ts:79** - Last Stand end (10000ms)
7. **healerAbilities.ts:453** - HoT ticks (multiple, 3000ms each)
8. **healerAbilities.ts:492** - Totem pulses (multiple)
9. **healerAbilities.ts:544** - Essence Font ticks (multiple)

### ⚠️ Potential Issues
- Multiple setTimeout calls creating overlapping timers
- No cleanup if combat ends before timers fire
- Timers might trigger during next combat round

## Required Fixes

All setTimeout calls that affect combat state should either:
1. Be removed (if not needed)
2. Be made blocking/awaited
3. Be stored and cleared when combat ends
