# Testing Quick Reference Guide

## How to Test

1. **Open Browser Source**: Navigate to the unified browser source page
2. **Open Test Panel**: The test panel should be visible (if not, check the page)
3. **Enable Logging**: Check the logging boxes for the categories you want to test
4. **Use Test Buttons**: Click buttons to trigger specific mechanics
5. **Observe Behavior**: Watch the game and check console logs

## Critical Systems to Test First

### 1. Combat Loop (Most Critical)
**Test Steps:**
1. Click "Spawn Enemy" or "Spawn Pack"
2. Watch combat start automatically
3. Observe heroes and enemies taking turns
4. Verify no duplicate attacks
5. Verify combat stops when all enemies die
6. Verify combat stops when all heroes die

**What to Look For:**
- ✅ Heroes attack once per round
- ✅ Enemies attack once per round
- ✅ No duplicate projectiles
- ✅ Combat stops correctly
- ✅ Wave counter increments only on new enemy

**Common Issues:**
- ❌ Enemies attacking multiple times → Check `activeEnemyAttacks` Set
- ❌ Combat not stopping → Check `checkCombatVictory` logic
- ❌ Wave counter incrementing incorrectly → Check `adventureTick` vs `encounterEnemy`

### 2. Death Detection (Critical)
**Test Steps:**
1. Click "Kill Hero" on a hero
2. Verify death animation plays
3. Verify hero HP shows 0
4. Verify hero is marked as dead
5. Verify enemies stop attacking dead hero

**What to Look For:**
- ✅ Death animation plays immediately
- ✅ HP bar shows 0
- ✅ Hero is marked `isDead = true`
- ✅ No attacks on dead hero
- ✅ Hero doesn't participate in combat

**Common Issues:**
- ❌ No death animation → Check `heroElementId` ID resolution
- ❌ Hero still attacking when dead → Check filtering in `resolveCombat`
- ❌ HP not exactly 0 → Check `Math.floor()` usage

### 3. Debuff Display (Known Issue)
**Test Steps:**
1. Click "Apply Debuff" on a hero
2. Verify debuff icon appears above hero name
3. Verify debuff timer counts down
4. Verify debuff expires correctly

**What to Look For:**
- ✅ Debuff icon displays
- ✅ Debuff timer shows correct time
- ✅ Multiple debuffs stack correctly
- ✅ Debuffs clear when expired

**Common Issues:**
- ❌ Debuffs not showing → Check ID resolution in `updateHeroDebuffDisplay`
- ❌ Debuffs showing on wrong hero → Check hero ID matching
- ❌ Debuffs not updating → Check sync interval (1000ms)

### 4. Shield System
**Test Steps:**
1. Click "Give Shield" on a hero
2. Verify shield bar appears
3. Have enemy attack the hero
4. Verify shield absorbs damage first
5. Verify HP only takes damage after shield depleted

**What to Look For:**
- ✅ Shield bar displays
- ✅ Shield absorbs damage
- ✅ HP only damaged after shield depleted
- ✅ Shield expires after duration
- ✅ Shield clears when depleted

**Common Issues:**
- ❌ Shield not absorbing damage → Check `absorbShieldDamage` in `enemyAttacks`
- ❌ Shield not expiring → Check `checkShieldExpiry` logic
- ❌ Shield not clearing → Check shield clearing in `absorbShieldDamage`

### 5. Healing System
**Test Steps:**
1. Reduce hero HP to 50%
2. Click "Heal Hero"
3. Verify HP increases
4. Verify overheal converts to shield
5. Verify HP doesn't exceed max HP

**What to Look For:**
- ✅ HP increases correctly
- ✅ Overheal creates shield
- ✅ HP doesn't exceed max HP
- ✅ Healing SCT displays

**Common Issues:**
- ❌ HP exceeds max HP → Check `applyHealing` logic
- ❌ Overheal not creating shield → Check `applyHealing` shield conversion
- ❌ No healing SCT → Check `triggerCombatText` calls

## Test Panel Button Reference

### Combat Section
- **Spawn Enemy**: Spawns a single enemy and starts combat
- **Spawn Boss**: Spawns a boss enemy
- **Spawn Pack**: Spawns 2-3 enemies
- **Kill All Enemies**: Sets all enemies to 0 HP
- **Start Combat**: Manually starts combat
- **Stop Combat**: Stops combat and adventure loops
- **Force Combat Round**: Forces next combat round

### Heroes Section
- **Set Hero HP**: Set hero HP to a percentage (0-100%)
- **Kill Hero**: Set hero HP to 0 and trigger death
- **Resurrect Hero**: Resurrect a dead hero at 50% HP
- **Level Up Hero**: Level up a hero
- **Give Gold**: Give gold to a hero

### Debuffs Section
- **Apply Debuff to Hero**: Apply a debuff to a hero
- **Apply Debuff to Enemy**: Apply a debuff to an enemy
- **Clear Hero Debuffs**: Clear all debuffs from a hero
- **Clear All Debuffs**: Clear all debuffs from all entities

### Healing Section
- **Heal Hero**: Heal a hero by a specific amount
- **Give Shield**: Give a shield to a hero
- **Clear Shields**: Clear shields from a hero

## Logging Categories

Enable these in the Test Panel to see detailed logs:

- **Combat**: Combat round processing, start/stop
- **Enemy**: Enemy attacks, spawning
- **Death**: Hero/enemy death events
- **Healing**: Healing application, shield absorption
- **Debuffs**: Debuff application, DoT damage
- **Resurrection**: Hero resurrection events

## Common Error Patterns

### "heroes.reduce is not a function"
- **Cause**: Heroes is a Map, not an array
- **Fix**: Convert to array: `Array.isArray(heroes) ? heroes : Array.from(heroes.values())`

### "Container not found for hero"
- **Cause**: Hero ID mismatch between rendering and debuff display
- **Fix**: Check ID resolution priority matches rendering

### "Cannot disconnect from server"
- **Cause**: Trying to disconnect already disconnected client
- **Fix**: Wrap `disconnect()` in `.catch()` handler

### "Unhandled Promise Rejection"
- **Cause**: Promise rejection not caught
- **Fix**: Add `.catch()` handler to all promises

## Testing Checklist

Use this checklist when testing:

- [ ] Combat starts correctly
- [ ] Combat stops correctly
- [ ] Heroes attack enemies
- [ ] Enemies attack heroes
- [ ] No duplicate attacks
- [ ] Death animations play
- [ ] Debuffs display correctly
- [ ] Buffs display correctly
- [ ] Shields absorb damage
- [ ] Healing works correctly
- [ ] HP never goes negative
- [ ] HP is always an integer
- [ ] isDead matches HP state
- [ ] Wave counter increments correctly
- [ ] No memory leaks
- [ ] No console errors

## Debug Tips

1. **Enable All Logging**: Check all logging boxes to see everything
2. **Watch Console**: Keep console open to catch errors
3. **Test One Thing at a Time**: Don't test multiple things simultaneously
4. **Use Test Panel**: Use test panel buttons instead of waiting for natural events
5. **Check State**: Use browser dev tools to inspect game state
6. **Clear State**: Refresh page to reset state if things get weird

## Reporting Issues

When reporting an issue, include:
1. **What you were testing**: Which mechanic/button
2. **Expected behavior**: What should have happened
3. **Actual behavior**: What actually happened
4. **Console errors**: Any errors in the console
5. **Steps to reproduce**: Exact steps to trigger the issue
6. **Screenshots**: If applicable
