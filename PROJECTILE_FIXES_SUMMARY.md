# Projectile Duplication Fixes - Summary

## Issues Fixed

### 1. Multiple Projectiles Firing
**Problem**: Enemies were sometimes firing multiple projectiles per attack.

**Root Causes**:
- Race condition during `setTimeout` delay window
- New combat rounds clearing `activeEnemyAttacks` while projectiles were still in flight
- No tracking of pending projectiles during the delay

**Solution**:
- Added `pendingProjectiles` Set to track projectiles scheduled but not yet created
- Check if projectile is already pending before scheduling
- Check if enemy is still in `activeEnemyAttacks` before creating projectile
- Verify target and enemy are still alive before creating projectile

### 2. Ghost Projectiles
**Problem**: Projectiles were created even when target was dead or enemy died, creating "ghost" projectiles that never hit.

**Solution**:
- Check target/enemy alive status BEFORE creating projectile (not just in onComplete)
- Cancel projectile creation if enemy is no longer in `activeEnemyAttacks` (new round started)
- Cancel projectile creation if target/enemy died during the setTimeout delay
- Show MISS SCT when target dies before projectile hits

### 3. Missing MISS SCT for Evasion/Dodge
**Problem**: When heroes evaded attacks, no visual feedback was shown.

**Solution**:
- Added 'miss' type to CombatTextType
- Updated combat text display to show "MISS" in yellow/gold
- Added MISS SCT for evasion/dodge
- Added MISS SCT for Divine Shield (immunity)
- Added MISS SCT when target dies before projectile hits

## Code Changes

### Files Modified

1. **`src/utils/combat/enemyAttacks.ts`**:
   - Added `pendingProjectiles` Set for tracking
   - Added checks before projectile creation
   - Added MISS SCT triggers for evasion/immunity/death
   - Updated cleanup logic to handle pending projectiles
   - Added validation checks in setTimeout callback

2. **`src/utils/combatText.ts`**:
   - Added 'miss' type to CombatTextType
   - Updated display logic to show "MISS" text
   - Added styling for MISS (yellow/gold)
   - Updated skip logic to allow MISS with 0 damage

3. **`src/utils/combat/types.ts`**:
   - Updated `triggerCombatText` type to include 'miss'

## How It Works Now

### Projectile Creation Flow

1. **Enemy Attack Starts**:
   - Enemy added to `activeEnemyAttacks` Set immediately
   - Check if projectile already pending → skip if yes
   - Check target/enemy alive → skip if dead
   - Mark projectile as pending → add to `pendingProjectiles` Set

2. **Projectile Launch Delay**:
   - `setTimeout` delays projectile creation to sync with attack animation
   - During delay, check if:
     - Enemy still in `activeEnemyAttacks` (new round didn't start)
     - Target still alive
     - Enemy still alive
   - If any check fails → cancel projectile, cleanup, resolve

3. **Projectile Creation**:
   - Create projectile element
   - Projectile flies to target (1.2 seconds)

4. **Projectile Hit**:
   - Check target/enemy still alive
   - Apply damage if both alive
   - Show MISS SCT if target died
   - Clean up tracking

### MISS SCT Triggers

- **Evasion**: Hero dodges attack (50% chance when evasion active)
- **Divine Shield**: Hero is immune to damage
- **Target Died**: Projectile hits but target already dead

## Testing Checklist

- [ ] Only one projectile per enemy attack
- [ ] No projectiles when target is dead
- [ ] No projectiles when enemy is dead
- [ ] No projectiles when new round starts
- [ ] MISS SCT shows for evasion
- [ ] MISS SCT shows for Divine Shield
- [ ] MISS SCT shows when target dies before projectile hits
- [ ] Projectile tracking cleaned up properly

## Key Improvements

1. **Prevention over Detection**: We prevent duplicate projectiles before they're created, not after
2. **Multiple Validation Points**: Checks at every stage (before scheduling, before creating, before hitting)
3. **Visual Feedback**: Users see MISS when attacks are dodged or miss
4. **Proper Cleanup**: All tracking Sets are cleared properly on all code paths

