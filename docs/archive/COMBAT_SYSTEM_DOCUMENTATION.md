# Combat System Documentation - AnimationTestPage

## Overview
This document explains how the combat system works in `AnimationTestPage.tsx`, including all functions, their interactions, and the combat loop flow. This implementation is based on the IdleDnD combat engine architecture but simplified for browser source overlay animations.

---

## Key State Variables and Refs

### Refs (Mutable State)
- `isCombatProcessingRef` (Line 219): Boolean flag preventing multiple simultaneous combat rounds
- `combatStartedRef` (Line 181): Boolean flag tracking if combat has started (for initiative calculation)
- `combatInitiativeRef` (Line 180): Array storing initiative order for reuse across rounds
- `autoStartCombatTimeoutRef` (Line 187): Timeout reference for auto-start combat (prevents duplicates)
- `previousEnemyCountRef` (Line 1713): Tracks previous enemy count to detect new spawns

### State Variables
- `heroes`: Array of TestHero objects
- `enemies`: Array of TestEnemy objects
- `isAdventuring`: Boolean for adventure mode
- `isBrowserSource`: Boolean for browser source overlay mode

---

## Main Combat Functions

### 1. `processCombatRound()` (Line 3466)
**Purpose**: Main entry point for processing a full combat round

**Function Signature**:
```typescript
const processCombatRound = () => {
  // Guard checks
  // Initiative calculation/reuse
  // Sequential processing
}
```

**Flow**:
1. **Early Exit Checks**:
   - If `heroes.length === 0 || enemies.length === 0` → return
   - If `isCombatProcessingRef.current === true` → log warning and return

2. **Set Processing Flag**:
   - `isCombatProcessingRef.current = true` (prevents duplicate rounds)

3. **Calculate/Reuse Initiative**:
   - **New Combat** (`!combatStartedRef.current || combatInitiativeRef.current.length === 0`):
     - Calculate initiative: `calculateInitiative(heroes, enemies)`
     - Store in `combatInitiativeRef.current`
     - Set `combatStartedRef.current = true`
     - Clear enemy initiative: `setEnemies(prev => prev.map(e => ({ ...e, initiative: undefined })))`
   - **Continuing Combat**:
     - Reuse `combatInitiativeRef.current`
     - **Filter out dead combatants** (Line 3487-3495):
       ```typescript
       combatants = combatants.filter(c => {
         if (c.type === 'hero') {
           const hero = heroes.find(h => h.id === c.id);
           return hero && hero.hp > 0;
         } else {
           const enemy = enemies.find(e => e.id === c.id);
           return enemy && enemy.hp > 0;
         }
       });
       ```
     - Update initiative order display: `setInitiativeOrder(combatants)`

4. **Process Combatants Sequentially**:
   - Call `processCombatantsSequentially()` (async function, fire-and-forget)
   - Error handling with `.catch()` to reset flags on error

**Key Guards**:
- Single guard: `isCombatProcessingRef.current` check
- Flag set immediately to prevent race conditions
- Dead combatants filtered from initiative array

---

### 2. `processCombatantsSequentially()` (Line 3502)
**Purpose**: Processes each combatant in initiative order, one at a time, waiting for each animation to complete

**Function Signature**:
```typescript
const processCombatantsSequentially = async () => {
  const actedThisRound = new Set<string>();
  
  for (let index = 0; index < combatants.length; index++) {
    const combatant = combatants[index];
    // Check if already acted
    // Check if still alive
    // Mark as acted
    // Process action (await Promise)
  }
  
  // After all combatants: check continuation
}
```

**Flow**:
1. **Initialize Tracking**:
   - `actedThisRound = new Set<string>()` - Tracks which combatants have acted this round

2. **Loop Through Combatants**:
   - Iterate through `combatants` array (in initiative order)
   - For each combatant:
     
     a. **Skip if Already Acted** (Line 3507-3510):
        ```typescript
        if (actedThisRound.has(combatant.id)) {
          console.log(`⏭️ [Combat] Skipping ${combatant.type} ${combatant.id} - already acted`);
          continue;
        }
        ```
     
     b. **Check if Still Alive** (Line 3512-3526):
        ```typescript
        let isAlive = false;
        if (combatant.type === 'hero') {
          const hero = heroes.find(h => h.id === combatant.id);
          isAlive = hero !== undefined && hero.hp > 0;
        } else {
          const enemy = enemies.find(e => e.id === combatant.id);
          isAlive = enemy !== undefined && enemy.hp > 0;
        }
        
        if (!isAlive) {
          console.log(`⏭️ [Combat] Skipping ${combatant.type} ${combatant.id} - dead (hp <= 0 or not found)`);
          continue;
        }
        ```
        **CRITICAL**: This check prevents dead enemies from attacking. It uses fresh state from `heroes`/`enemies` arrays, not the stale `combatant` object.
     
     c. **Mark as Acted** (Line 3528-3530):
        ```typescript
        actedThisRound.add(combatant.id);
        console.log(`✅ [Combat] ${combatant.type} ${combatant.id} marked as acted`);
        ```

3. **Process Action** (wrapped in Promise):
   - Each action is wrapped in `new Promise<void>((resolve) => { ... })`
   - Promise resolves after animation completes (via `setTimeout`)
   - `await` ensures sequential processing

4. **After All Combatants Act** (Line 4402-4490):
   - Reset `isCombatProcessingRef.current = false` (Line 4404)
   - Check if combat should continue
   - Schedule next round or end combat

**Key Features**:
- Uses `await` to ensure sequential processing
- Each action wrapped in `Promise<void>` that resolves when complete
- `actedThisRound` Set prevents duplicate actions
- **Fresh state check** prevents dead enemies from attacking

---

### 3. Hero Attack Logic (Lines 3534-4080)
**Purpose**: Handles hero attacking an enemy

**Function Flow**:
```typescript
if (combatant.type === 'hero') {
  // 1. Get alive enemies
  const aliveEnemies = currentEnemies.filter(e => e.hp > 0);
  if (aliveEnemies.length === 0) {
    resolve();
    return;
  }
  
  // 2. Select random target
  const targetEnemy = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
  
  // 3. Get hero from state
  const hero = heroes.find(h => h.id === combatant.id);
  
  // 4. Check if hero is alive
  if (!hero || hero.hp <= 0) {
    console.log(`⏭️ [Combat] Hero ${combatant.id} is dead or doesn't exist, skipping attack`);
    resolve();
    return;
  }
  
  // 5. Check if stunned
  if (isStunned(hero)) {
    resolve();
    return;
  }
  
  // 6. Verify target still exists
  const latestTargetEnemy = latestEnemies.find(e => e.id === targetEnemy.id);
  if (!latestTargetEnemy || latestTargetEnemy.hp <= 0) {
    resolve();
    return;
  }
  
  // 7. Determine attack type (projectile vs melee)
  const usesProjectile = spellcasters.includes(hero.role.toLowerCase()) || 
                         healers.includes(hero.role.toLowerCase());
  
  // 8. Process attack (projectile or melee)
  if (usesProjectile) {
    // Projectile attack logic
  } else {
    // Melee attack logic
  }
}
```

**Melee Attack Flow** (Line 3993-4058):
1. **Play Attack Animation**:
   ```typescript
   const heroRef = heroRefs.current.get(hero.id);
   if (heroRef?.current) {
     console.log(`🎬 [Combat] Playing attack animation for ${hero.name} (${hero.id})`);
     heroRef.current.playAnimation('attack');
     console.log(`✅ [Combat] Attack animation triggered for ${hero.name}`);
   }
   ```

2. **Calculate Damage**:
   - Get base damage: `calculateHeroBaseDamage(hero)`
   - Apply class ability: `applyClassAbility(...)`
   - Calculate with crit: `calculateDamageWithCrit(...)`

3. **Apply Damage After Animation**:
   ```typescript
   const attackDuration = attackAnimation?.duration || 800;
   const damageDelay = attackDuration;
   
   setTimeout(() => {
     // Play hurt animation on enemy
     // Apply damage via setEnemies
     // Show combat text
   }, damageDelay);
   ```

**Projectile Attack Flow** (Line 3830-3992):
1. **Play Attack Animation**: Same as melee
2. **Fire Projectile** (after `attackDelay` = 400ms):
   ```typescript
   setTimeout(() => {
     createProjectile(
       heroElement,
       enemyElement,
       hero.role,
       elementType,
       () => {
         // On projectile hit:
         // - Play hurt animation
         // - Apply damage
         // - Show combat text
       }
     );
   }, attackDelay);
   ```

**Promise Resolution**:
- For melee: `totalWaitTime = attackDuration + 100`
- For projectile: `totalWaitTime = 400 + 1200 + 100` (delay + travel + hit)
- Promise resolves after `totalWaitTime` via `setTimeout(() => resolve(), totalWaitTime)`

---

### 4. Enemy Attack Logic (Lines 4080-4343)
**Purpose**: Handles enemy attacking a hero

**Function Flow**:
```typescript
else {
  // Enemy attacks random hero
  // 1. Get alive heroes
  const aliveHeroes = heroes.filter(h => h.hp > 0);
  if (aliveHeroes.length === 0) {
    resolve();
    return;
  }
  
  // 2. Select random target
  const targetHero = aliveHeroes[Math.floor(Math.random() * aliveHeroes.length)];
  
  // 3. Get enemy from state
  const enemy = enemies.find(e => e.id === combatant.id);
  
  // 4. Check if enemy is alive (CRITICAL CHECK)
  if (!enemy || enemy.hp <= 0) {
    console.log(`⏭️ [Combat] Enemy ${combatant.id} is dead or doesn't exist, skipping attack`);
    resolve();
    return;
  }
  
  // 5. Check if stunned
  if (isStunned(enemy)) {
    resolve();
    return;
  }
  
  // 6. Determine attack type
  const usesProjectile = projectileEnemies.includes(enemy.name);
  
  // 7. Process attack
}
```

**Melee Attack Flow** (Line 4216-4320):
1. **Play Attack Animation**:
   ```typescript
   const enemyRef = enemyRefs.current.get(enemy.id);
   if (enemyRef?.current) {
     console.log(`🎬 [Combat] Playing ${attackAnimationName} animation for ${enemy.name} (${enemy.id})`);
     enemyRef.current.playAnimation(attackAnimationName);
   }
   ```

2. **Calculate Damage**:
   - Base damage: `enemy.attack || 300`
   - Apply modifiers: `calculateDamage(...)`
   - Check Last Stand: `checkLastStand(...)`

3. **Apply Damage After Animation**:
   ```typescript
   const enemyAttackDuration = enemyAttackAnimation?.duration || 1200;
   const enemyDamageDelay = enemyAttackDuration;
   
   setTimeout(() => {
     // Re-check Last Stand (may have triggered during animation)
     // Play hurt animation on hero
     // Apply damage via setHeroes
     // Show combat text
   }, enemyDamageDelay);
   ```

**Projectile Attack Flow** (Line 4140-4215):
1. **Play Attack Animation**: Same as melee
2. **Fire Projectile** (after `projectileDelay` = 50% of animation):
   ```typescript
   const projectileDelay = Math.max(400, Math.floor(enemyAttackDuration * 0.5));
   
   setTimeout(() => {
     createProjectile(
       enemyElement,
       heroElement,
       enemy.name,
       'projectile',
       () => {
         // On projectile hit:
         // - Play hurt animation
         // - Apply damage
         // - Show combat text
       }
     );
   }, projectileDelay);
   ```

**Promise Resolution**:
- For melee: `totalWaitTime = enemyAttackDuration + 100`
- For projectile: `totalWaitTime = 400 + 1200 + 100`
- Promise resolves after `totalWaitTime` via `setTimeout(() => resolve(), totalWaitTime)`

---

### 5. Combat Continuation Logic (Lines 4402-4490)
**Purpose**: Schedules the next combat round after current round completes

**Function Flow**:
```typescript
// After all combatants have acted
isCombatProcessingRef.current = false; // Reset flag FIRST

setEnemies(currentEnemies => {
  const aliveEnemies = currentEnemies.filter(e => e.hp > 0);
  const aliveHeroes = heroes.filter(h => h.hp > 0);
  
  if (aliveEnemies.length === 0) {
    // All enemies defeated - spawn new enemies
    combatStartedRef.current = false;
    combatInitiativeRef.current = [];
    // Spawn logic...
    return [];
  } else if (aliveHeroes.length === 0) {
    // All heroes defeated
    combatStartedRef.current = false;
    combatInitiativeRef.current = [];
    return [];
  } else {
    // Continue combat - schedule next round
    setTimeout(() => {
      if (!isCombatProcessingRef.current && combatStartedRef.current) {
        const stillAliveEnemies = currentEnemies.filter(e => e.hp > 0);
        const stillAliveHeroes = heroes.filter(h => h.hp > 0);
        
        if (stillAliveEnemies.length > 0 && stillAliveHeroes.length > 0) {
          console.log('🔄 [Combat] Continuation: Starting next round...');
          processCombatRound();
        }
      }
    }, 1000); // 1 second delay between rounds
    return aliveEnemies;
  }
});
```

**Key Features**:
- Flag reset happens BEFORE scheduling (prevents race conditions)
- Simple `setTimeout` with 1 second delay (matches RaidBrowserSourcePage)
- Final check before starting next round ensures combatants are still alive

---

### 6. Auto-Start Combat Logic (Lines 755-811)
**Purpose**: Automatically starts combat when heroes and enemies are present

**Function Flow**:
```typescript
useEffect(() => {
  // Clear any pending timeout
  if (autoStartCombatTimeoutRef.current) {
    clearTimeout(autoStartCombatTimeoutRef.current);
    autoStartCombatTimeoutRef.current = null;
  }
  
  // Check conditions
  const shouldAutoStart = (isBrowserSource || isAdventuring) && 
                         heroes.length > 0 && 
                         enemies.length > 0 && 
                         !isCombatProcessingRef.current;
  
  if (shouldAutoStart) {
    const aliveHeroes = heroes.filter(h => h.hp > 0);
    const aliveEnemies = enemies.filter(e => e.hp > 0);
    
    const enemiesJustAdded = isAdventuring && enemies.length > previousEnemyCountRef.current;
    const combatNotStarted = !combatStartedRef.current;
    const shouldStart = (enemiesJustAdded || combatNotStarted) && 
                      aliveHeroes.length > 0 && 
                      aliveEnemies.length > 0;
    
    if (shouldStart) {
      autoStartCombatTimeoutRef.current = setTimeout(() => {
        // Final check before starting
        if (!isCombatProcessingRef.current && 
            !combatStartedRef.current &&
            heroes.length > 0 && 
            enemies.length > 0) {
          const stillAliveHeroes = heroes.filter(h => h.hp > 0);
          const stillAliveEnemies = enemies.filter(e => e.hp > 0);
          if (stillAliveHeroes.length > 0 && stillAliveEnemies.length > 0) {
            processCombatRound();
          }
        }
        autoStartCombatTimeoutRef.current = null;
      }, 1000); // 1 second delay
    }
  }
}, [heroes.length, enemies.length, isBrowserSource, isAdventuring, combatStartedRef.current]);
```

**Key Features**:
- Clears previous timeout before scheduling new one
- Checks both processing flag and combat started flag
- Only triggers for new combat (not continuation)

---

## Combat Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ Auto-Start useEffect (Line 755)                        │
│ - Checks: heroes, enemies, flags                        │
│ - Schedules: processCombatRound() after 1s              │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ processCombatRound() (Line 3466)                        │
│ 1. Check guard (isCombatProcessingRef)                 │
│ 2. Set isCombatProcessingRef = true                    │
│ 3. Calculate/reuse initiative                          │
│ 4. Filter dead combatants                              │
│ 5. Call processCombatantsSequentially()                  │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ processCombatantsSequentially() (Line 3502)             │
│ For each combatant in initiative order:                 │
│   ├─ Skip if already acted (actedThisRound.has)        │
│   ├─ Check if still alive (fresh state check)           │
│   ├─ Mark as acted (actedThisRound.add)                 │
│   ├─ If HERO:                                           │
│   │   └─ Hero Attack Logic (Line 3534)                 │
│   │      ├─ Melee: playAnimation → wait → damage        │
│   │      └─ Projectile: playAnimation → fire → damage   │
│   └─ If ENEMY:                                           │
│       └─ Enemy Attack Logic (Line 4080)                 │
│          ├─ Melee: playAnimation → wait → damage         │
│          └─ Projectile: playAnimation → fire → damage   │
│                                                          │
│ After all combatants act:                                │
│   └─ Reset flag → check continuation                    │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ Combat Continuation (Line 4402)                         │
│ - Reset isCombatProcessingRef = false                   │
│ - If enemies alive:                                      │
│   └─ Schedule next round (setTimeout 1000ms)            │
│ - If all enemies dead:                                   │
│   └─ Spawn new enemies, reset flags                     │
│ - If all heroes dead:                                    │
│   └─ Reset flags, end combat                            │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ Next Round Scheduled (Line 4470)                       │
│ - Check conditions                                       │
│ - Call processCombatRound() if valid                    │
└─────────────────────────────────────────────────────────┘
```

---

## Dead Enemy Prevention Logic

### Problem
Dead enemies may still be in the `combatants` array if they die during the round (from hero attacks). This can cause:
- Dead enemies trying to attack (no animation visible since they're removed from DOM)
- Multiple attacks appearing to happen

### Solution
**Three-Layer Protection**:

1. **Filter at Round Start** (Line 3487-3495):
   ```typescript
   combatants = combatants.filter(c => {
     if (c.type === 'hero') {
       const hero = heroes.find(h => h.id === c.id);
       return hero && hero.hp > 0;
     } else {
       const enemy = enemies.find(e => e.id === c.id);
       return enemy && enemy.hp > 0;
     }
   });
   ```
   - Filters dead combatants when reusing initiative
   - Uses fresh state from `heroes`/`enemies` arrays

2. **Check Before Processing** (Line 3512-3526):
   ```typescript
   let isAlive = false;
   if (combatant.type === 'hero') {
     const hero = heroes.find(h => h.id === combatant.id);
     isAlive = hero !== undefined && hero.hp > 0;
   } else {
     const enemy = enemies.find(e => e.id === combatant.id);
     isAlive = enemy !== undefined && enemy.hp > 0;
   }
   
   if (!isAlive) {
     console.log(`⏭️ [Combat] Skipping ${combatant.type} ${combatant.id} - dead (hp <= 0 or not found)`);
     continue;
   }
   ```
   - **CRITICAL**: Uses fresh state, not stale `combatant` object
   - Checks both existence and `hp > 0`
   - Prevents dead enemies from being processed

3. **Check Inside Action** (Line 4090-4095):
   ```typescript
   const enemy = enemies.find(e => e.id === combatant.id);
   
   if (!enemy || enemy.hp <= 0) {
     console.log(`⏭️ [Combat] Enemy ${combatant.id} is dead or doesn't exist, skipping attack`);
     resolve();
     return;
   }
   ```
   - Final safety check before processing enemy attack
   - Ensures enemy still exists and is alive

---

## Key Differences from IdleDnD Combat Engine

### IdleDnD Combat Engine (`combatEngine.ts`)
- **Phased Approach**: Processes in phases (debuffs, buffs, shields, emergency abilities, etc.)
- **Action Building**: Builds all actions first, then executes in initiative order
- **Fixed Delays**: Uses fixed 1500ms delay between actions
- **Dead Enemy Filtering**: Filters dead enemies when building `enemyActions` array (Line 304-306)

### AnimationTestPage Implementation
- **Sequential Processing**: Processes each combatant one at a time with `await`
- **Immediate Execution**: Actions execute immediately when processed
- **Dynamic Delays**: Uses animation durations for delays
- **Runtime Checks**: Checks if combatants are alive at multiple points

---

## Potential Issues and Fixes

### Issue 1: Dead Enemies Still Attacking
**Symptoms**: Hero takes damage from dead enemies (no animation visible)

**Root Cause**: Dead enemies still in `combatants` array, or stale state in Promise closure

**Fix Applied**:
- ✅ Filter dead combatants at round start (Line 3487-3495)
- ✅ Check if alive before processing (Line 3512-3526) - uses fresh state
- ✅ Check if alive inside action (Line 4090-4095) - final safety check

**If Still Occurring**:
- Check if `enemies` state is being updated correctly when enemies die
- Verify `setEnemies` is called when enemy HP reaches 0
- Check if Promise closure is capturing stale `enemies` array

### Issue 2: Multiple Combat Rounds Starting
**Symptoms**: Multiple "⚔️ [Combat] Starting combat round..." logs

**Root Cause**: Race condition with flag reset timing

**Fix Applied**:
- ✅ Reset flag immediately after round completes (Line 4404)
- ✅ Simple guard check (only `isCombatProcessingRef`)
- ✅ Removed `combatContinuationScheduledRef` complexity

### Issue 3: Hero Attack Animations Not Playing
**Symptoms**: Damage applied but no animation

**Root Cause**: Complex retry logic or ref not available

**Fix Applied**:
- ✅ Simplified to direct call (like RaidBrowserSourcePage)
- ✅ Direct: `heroRef.current.playAnimation('attack')`
- ✅ Removed retry logic

---

## Function Call Chain

```
Auto-Start useEffect
  └─> processCombatRound()
      └─> processCombatantsSequentially()
          ├─> Hero Attack Logic
          │   ├─> getHeroRef() / heroRefs.current.get()
          │   ├─> playAnimation('attack')
          │   ├─> calculateHeroBaseDamage()
          │   ├─> applyClassAbility()
          │   ├─> calculateDamageWithCrit()
          │   ├─> setTimeout() [damage application]
          │   ├─> setEnemies() [damage]
          │   └─> showScrollingCombatText()
          │
          └─> Enemy Attack Logic
              ├─> getEnemyRef() / enemyRefs.current.get()
              ├─> playAnimation('attack' | 'attack2')
              ├─> calculateDamage()
              ├─> checkLastStand()
              ├─> setTimeout() [damage application]
              ├─> setHeroes() [damage]
              └─> showScrollingCombatText()
          
          └─> Combat Continuation
              └─> setTimeout() → processCombatRound() [next round]
```

---

## Key Timing Delays

1. **Auto-Start Delay**: 1000ms (1 second)
2. **Combat Continuation Delay**: 1000ms (1 second)
3. **Hero Attack Delay** (projectile): 400ms
4. **Enemy Attack Delay** (projectile): 50% of animation duration
5. **Damage Application Delay** (melee): Full animation duration
6. **Projectile Travel Time**: 1200ms

---

## Debug Checklist

When investigating issues:
- [ ] Check console for "⏭️ [Combat] Skipping..." logs (should see dead enemies being skipped)
- [ ] Check console for "✅ [Combat] ... marked as acted" (should only see once per combatant per round)
- [ ] Check console for "⚔️ [Combat] Starting combat round..." (should only see once per round)
- [ ] Verify `actedThisRound` Set is working (add logging)
- [ ] Check if multiple `processCombatRound()` calls are happening
- [ ] Verify all Promise `resolve()` calls are being reached
- [ ] Check if state updates are causing re-renders mid-combat
- [ ] Verify hero/enemy refs are correct (not stale)
- [ ] Check if dead enemies are being filtered correctly at round start
- [ ] Verify fresh state checks are working (enemy.hp > 0 checks)

---

## Current Implementation Status

### ✅ Working
- Combat rounds start correctly
- Sequential processing with `await`
- Dead enemy filtering at round start
- Alive checks before processing
- Flag-based concurrency control
- Combat continuation
- **Dead enemy checks inside setTimeout callbacks** (prevents damage from dead enemies)

### ⚠️ Potential Issues
- **Dead enemies still attacking**: Added checks inside setTimeout callbacks to prevent this
- **Promise closure**: Using fresh state lookups (`enemies.find()`, `heroes.find()`) inside callbacks

### 🔍 Recent Fixes Applied
- **Dead Enemy Prevention**: Added checks inside `setTimeout` callbacks before applying damage:
  - Melee attacks: Check enemy alive before damage (Line 4283-4288)
  - Projectile attacks: Check enemy alive before firing (Line 4188-4193)
  - Projectile hit: Check both enemy and hero alive before damage (Line 4194-4204)
- This prevents dead enemies from applying damage even if they die during animation delays

---

## Notes

- The combat system uses a simplified version of the IdleDnD combat engine
- Sequential processing ensures animations play correctly
- Multiple checks prevent dead enemies from attacking
- Flag reset timing is critical to prevent race conditions
- Fresh state checks are essential when combatants can die mid-round
