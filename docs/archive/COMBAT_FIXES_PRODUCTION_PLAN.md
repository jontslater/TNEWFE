# Comprehensive Combat Fixes & Production Setup Plan

## React-Specific Issues (Electron → Browser Migration)

**Critical Context**: The Electron app used pure DOM manipulation, while the browser source uses React + DOM manipulation. This creates timing and synchronization issues:

1. **React State vs DOM Manipulation**: React updates state asynchronously, which can conflict with manual DOM changes
2. **Animation Timing**: React state may not flush to DOM immediately, causing animation triggers to fail
3. **Combat Loop Race Conditions**: React batching can cause rounds to overlap or processing flags to not reset correctly
4. **Ref Management**: Sprite refs can be lost, causing animation calls to fail silently
5. **Combat Text Throttling**: Too-aggressive throttling can hide feedback
6. **State Sync Delays**: localStorage settings may not propagate fast enough

**All fixes must account for React's async nature and use proper synchronization techniques.**

## Phase 1: Critical Combat System Fixes

### 1.1 Dead Entity Filtering & Targeting
**Issue**: Heroes and enemies continue to attack dead targets, dead heroes continue to act

**Root Causes**:
- Dead entities not properly filtered before target selection
- `isDead` flag not consistently checked before actions
- Dead heroes not filtered from initiative calculation
- Dead enemies not removed from target selection

**Files to Fix**:
- `src/utils/combat/combatEngine.ts` - Hero target selection
- `src/utils/combat/enemyAttacks.ts` - Enemy target selection
- `src/utils/combat/initiative.ts` - Initiative calculation filtering
- `src/utils/fullCombatEngine.ts` - Combat state filtering

**Fixes**:
1. Filter dead entities BEFORE target selection in `combatEngine.ts`
2. Filter dead heroes from initiative calculation in `initiative.ts`
3. Filter dead enemies from hero target selection
4. Filter dead heroes from enemy target selection
5. Add defensive checks: `if (target.isDead || target.hp <= 0) return;` before all actions

### 1.2 Hero Death Animation
**Issue**: Heroes don't play death animation when they die

**Root Causes**:
- Death animation trigger may use incorrect hero ID format
- Death animation may be blocked by other animation states
- `deathAnimationPlaying` flag may not be set correctly
- **React-specific**: Animation state may not flush to DOM immediately
- **React-specific**: Sprite refs may be lost or not yet mounted
- **React-specific**: React batching may delay animation state updates

**Files to Fix**:
- `src/utils/combat/enemyAttacks.ts` - Hero death triggers
- `src/utils/combat/buffsDebuffs.ts` - DoT/Stagger death triggers
- `src/utils/fullCombatEngine.ts` - Death detection and animation
- `src/pages/BrowserSourcePage.tsx` - Animation state management and ref handling

**Fixes**:
1. Verify `heroElementId()` returns correct format: `battle-hero-{id}`
2. Ensure death animation triggers immediately when `hp <= 0 && !isDead`
3. Set `deathAnimationPlaying = true` before triggering animation
4. **React Fix**: Use `flushSync()` or `setTimeout(0)` to force React to flush state before DOM manipulation
5. **React Fix**: Verify sprite ref exists before triggering animation: `if (!heroSpriteRefs.current.get(heroId)?.current) return;`
6. **React Fix**: Use direct DOM manipulation as fallback if ref is missing: `document.getElementById(`battle-hero-${heroId}`)?.classList.add('animate-death')`
7. Prevent other animations from overriding death animation
8. Add defensive checks for ref existence before animation calls

### 1.3 Enemy Death at HP > 0
**Issue**: Enemies die when their HP is above 0

**Root Causes**:
- Death detection may check `isDead` flag before checking HP
- HP may not be properly floored/clamped
- Multiple damage sources may cause HP to go negative without detection

**Files to Fix**:
- `src/utils/combat/damageCalculation.ts` - Enemy damage application
- `src/utils/fullCombatEngine.ts` - Local applyEnemyDamage
- `src/utils/combat/combatEngine.ts` - Enemy damage in combat rounds

**Fixes**:
1. Ensure HP is always `Math.floor()` after damage
2. Ensure death check is `hp <= 0` (not just `hp === 0`)
3. Set `isDead = true` immediately when `hp <= 0`
4. Add validation: if `isDead && hp > 0`, correct the state
5. Ensure all damage paths use consistent death detection

### 1.4 Combat Round Continuation
**Issue**: Next round doesn't start when enemy dies mid-combat

**Root Causes**:
- `checkCombatVictory()` may not be called after enemy death
- Combat may be waiting for all actions to complete before checking
- `resolvingCombat` flag may prevent next round from starting

**Files to Fix**:
- `src/utils/fullCombatEngine.ts` - `checkCombatVictory()` and combat loop
- `src/utils/combat/combatEngine.ts` - Round completion callbacks

**Fixes**:
1. Ensure `checkCombatVictory()` is called after each combat round completes
2. If enemies still alive, call `startCombat()` to continue loop
3. Clear `resolvingCombat` flag only after victory check
4. Don't wait for death animations to complete before starting next round (unless all enemies dead)

### 1.5 Next Wave Spawning
**Issue**: Next wave doesn't spawn automatically when all enemies die

**Root Causes**:
- `encounterEnemy()` may not be called after victory
- Adventure loop may not be running
- Safety checks may prevent spawning

**Files to Fix**:
- `src/utils/fullCombatEngine.ts` - `checkCombatVictory()` victory path
- `src/utils/adventureEngine.ts` - Wave spawning logic

**Fixes**:
1. Verify `encounterEnemy()` is called in victory path (already fixed, verify it works)
2. Ensure adventure loop is running before spawning
3. Remove dead enemies from array before spawning new ones
4. Add delay for death animations before spawning next wave

### 1.6 Enemy Projectile Duplication
**Issue**: Multiple projectiles fire per turn

**Root Causes**:
- `activeEnemyAttacks` Set may be cleared too early
- Projectile cleanup may happen before projectile hits
- Multiple calls to `processEnemyAttack()` for same enemy

**Files to Fix**:
- `src/utils/combat/enemyAttacks.ts` - Projectile creation and cleanup
- `src/utils/combat/combatEngine.ts` - `activeEnemyAttacks` clearing

**Fixes**:
1. Keep enemy in `activeEnemyAttacks` during projectile flight
2. Only remove from Set when projectile hits and damage is applied
3. Add guard to prevent duplicate `processEnemyAttack()` calls
4. Verify `clearActiveEnemyAttacks()` is only called at start of new round

### 1.7 Enemy Duplicate Attack Animations
**Issue**: Attack animation plays multiple times per round

**Root Causes**:
- Animation may be triggered multiple times for same attack
- Animation state may not be properly tracked
- Multiple attack processing paths
- **React-specific**: React state updates may not flush before next animation trigger
- **React-specific**: Animation state may be batched, causing multiple triggers to see same state

**Files to Fix**:
- `src/utils/combat/enemyAttacks.ts` - Animation triggers
- `src/pages/BrowserSourcePage.tsx` - Animation state management

**Fixes**:
1. Ensure animation is only triggered once per attack
2. Track animation state in `useRef` to avoid React batching: `const attackAnimationRef = useRef<Set<string>>(new Set())`
3. Add guard: `if (attackAnimationRef.current.has(enemyId)) return;`
4. **React Fix**: Use `flushSync()` or direct DOM manipulation for animation triggers
5. **React Fix**: Clear animation state after animation completes (use animation end event)
6. Verify sprite ref exists before triggering: `if (!enemySpriteRefs.current.get(enemyId)?.current) return;`

### 1.8 Combat Stopping
**Issue**: Combat doesn't properly stop when all heroes or all enemies are defeated

**Root Causes**:
- `stopCombat()` may not be called in all defeat scenarios
- Intervals may not be cleared
- Flags may not be reset

**Files to Fix**:
- `src/utils/fullCombatEngine.ts` - `checkCombatVictory()` and `stopCombat()`

**Fixes**:
1. Ensure `stopCombat()` is called when all heroes die
2. Ensure `stopCombat()` is called when all enemies die (after rewards)
3. Clear all intervals: `combatInterval`, `adventureInterval`, `debuffTickInterval`, `resurrectionCheckInterval`
4. Reset all flags: `inCombat`, `isCombatStarting`, `resolvingCombat`
5. Clear `currentEnemies` array when combat ends

## Phase 2: Production Mode Setup

### 2.1 Remove Test/Debug UI
**Files to Modify**:
- `src/pages/BrowserSourcePage.tsx` - Conditionally render TestPanel

**Changes**:
1. Add environment check: `const isDevelopment = import.meta.env.MODE === 'development';`
2. Only render `<TestPanel>` if `isDevelopment === true`
3. Only call `setTestHelperContext` if `isDevelopment === true`
4. Remove test helper context setup in production builds

### 2.2 Remove Console Logs
**Files to Clean**:
- All files in `src/utils/combat/`
- `src/utils/fullCombatEngine.ts`
- `src/pages/BrowserSourcePage.tsx`
- `src/hooks/useBattlefieldListener.ts` - Remove battlefield listener warnings

**Changes**:
1. Remove all `console.log`, `console.warn`, `console.error` calls
2. Keep only critical error logging (wrap in `if (import.meta.env.MODE === 'development')`)
3. Remove `testLog` calls (or make them no-op in production)
4. **Battlefield Listener**: Remove or silence warnings about missing battlefield docs (these are expected during initial load)
   - Remove: `⚠️ Battlefield doc does not exist yet for {battlefieldId}`
   - Remove: `⚠️ No battlefield doc found for {battlefieldId}, enemies will be empty`
   - Remove: `🔄 State changed - updating with new heroes` (or make dev-only)
   - Keep only critical errors (wrapped in dev check)

### 2.3 Production Build Configuration
**Files to Check**:
- `vite.config.ts` or `package.json` - Build configuration
- Environment variables

**Recommendation**: Use environment-based feature flags
- Create `.env.production` file with `VITE_NODE_ENV=production`
- Use `import.meta.env.MODE === 'production'` for runtime checks
- Vite automatically handles minification and optimization in production builds
- Source maps can be disabled in production via `vite.config.ts`

**Changes**:
1. Ensure production build uses minification (automatic with Vite)
2. Disable source maps in production: `build: { sourcemap: false }`
3. Set `NODE_ENV=production` for production builds (automatic with `vite build`)
4. Optimize bundle size (automatic with Vite)
5. Add `.env.production` file if needed for production-specific config

### 2.4 Disable Development Features
**Features to Disable**:
- Hot module reload (HMR) - automatic in production
- React DevTools - automatic in production
- Test helpers and utilities
- Debug flags in localStorage

**Recommendation**: Use environment checks for all debug features
- Check `import.meta.env.MODE === 'production'` before accessing debug features
- Debug flags in localStorage should be ignored in production (no-op)
- Keep error boundaries but make them less verbose in production

**Changes**:
1. Check for `localStorage` debug flags and ignore in production (return defaults, don't read/write)
2. Disable any dev-only API endpoints (check environment before calling)
3. Keep error boundaries but only log to console in development
4. Wrap all debug feature access in environment checks

## Phase 1.9: React-Specific Fixes

### 1.9.1 Animation State Synchronization
**Issue**: React state updates may not flush to DOM before animation triggers

**Files to Fix**:
- `src/pages/BrowserSourcePage.tsx` - Animation state management
- `src/utils/fullCombatEngine.ts` - Animation trigger callbacks

**Fixes**:
1. Use `flushSync()` from `react-dom` for critical animation state updates
2. Use direct DOM manipulation as fallback: `element.classList.add('animate-attack')`
3. Verify refs exist before triggering animations
4. Add animation end event listeners to clear animation state
5. Use `setTimeout(0)` to force React to flush state before DOM manipulation if needed

### 1.9.2 Sprite Ref Management
**Issue**: Sprite refs can be lost, causing animation calls to fail silently

**Files to Fix**:
- `src/pages/BrowserSourcePage.tsx` - Ref creation and management

**Fixes**:
1. Add defensive checks: `if (!heroSpriteRefs.current.get(heroId)?.current) { /* fallback */ }`
2. Use direct DOM query as fallback: `document.getElementById(`battle-hero-${heroId}`)`
3. Clean up refs when entities are removed
4. Verify refs are created before combat starts
5. Add logging (dev only) when refs are missing

### 1.9.3 Combat Text Throttling
**Issue**: Too-aggressive throttling can hide feedback for some attacks

**Files to Fix**:
- `src/pages/BrowserSourcePage.tsx` - Combat text throttling logic

**Fixes**:
1. Review `combatTextThrottleRef` throttling logic
2. Reduce throttle time if too aggressive (currently per-entity basis)
3. Ensure unique keys for each combat event (don't reuse same key)
4. Add fallback: if throttled, queue the text for later display
5. Test with rapid attacks to ensure all damage numbers show

### 1.9.4 localStorage State Sync
**Issue**: Debug settings in localStorage may not propagate fast enough

**Files to Fix**:
- `src/pages/BrowserSourcePage.tsx` - Debug settings interval
- All files that read from localStorage

**Fixes**:
1. Check localStorage at start of each combat round, not just on interval
2. Use `useEffect` to watch for localStorage changes
3. Invalidate cached settings when localStorage changes
4. For production: Ignore localStorage debug flags entirely

### 1.9.5 React Batching & Race Conditions
**Issue**: React batching can cause state updates to be delayed, leading to race conditions

**Files to Fix**:
- `src/utils/fullCombatEngine.ts` - Combat state management
- `src/pages/BrowserSourcePage.tsx` - State sync logic

**Fixes**:
1. Use `useRef` for flags that need immediate updates: `isCombatProcessingRef`
2. Use `flushSync()` for critical state updates that must happen before next action
3. Add guards using refs, not state: `if (isCombatProcessingRef.current) return;`
4. Use `setTimeout(0)` to break out of React batching when needed
5. Ensure all combat flags are in refs, not state, for immediate checks

## Phase 3: State Management & Cleanup

### 3.1 Combat State Consistency
**Issues**:
- HP and `isDead` may become inconsistent
- Flags may not be cleared properly

**Fixes**:
1. Add validation function: `validateCombatState()`
2. Run validation after each combat round
3. Auto-correct inconsistencies: if `isDead && hp > 0`, set `isDead = false`
4. Auto-correct: if `!isDead && hp <= 0`, set `isDead = true` and trigger death

### 3.2 Interval Cleanup
**Issues**:
- Intervals may not be cleared on combat stop
- Memory leaks from uncleared intervals

**Fixes**:
1. Track all intervals in a Set: `private activeIntervals = new Set<NodeJS.Timeout>()`
2. Clear all intervals in `stopCombat()`
3. Add cleanup in component unmount
4. Verify no intervals remain after combat ends

### 3.3 Race Condition Prevention
**Issues**:
- Multiple combat rounds may overlap
- `resolvingCombat` flag may not prevent all race conditions

**Fixes**:
1. Add queue system for combat actions
2. Ensure `resolvingCombat` is checked at all entry points
3. Add timeout to prevent stuck `resolvingCombat` flag
4. Log when race conditions are detected (dev only)

### 2.5 Error Handling in Production
**Recommendation**: Silent failures with graceful degradation
- Don't show technical errors to users (no console logs)
- Log critical errors to a service if available (optional - can add later)
- Show user-friendly messages only for recoverable errors
- Fail silently for non-critical errors (e.g., missing battlefield doc is expected)

**Changes**:
1. Wrap all error logging in `if (import.meta.env.MODE === 'development')`
2. Remove user-facing error messages for expected scenarios (missing battlefield doc)
3. Keep error boundaries but make them silent in production
4. Add optional error reporting service integration (can be added later if needed)

## Phase 4: Testing & Verification

### 4.1 Unit Tests for Critical Functions
**Tests to Add**:
1. `validateCombatState()` - State consistency
2. `filterDeadEntities()` - Dead entity filtering
3. `checkCombatVictory()` - Victory/defeat detection
4. `stopCombat()` - Cleanup verification

### 4.2 Integration Tests
**Scenarios to Test**:
1. Enemy dies mid-combat → next round starts
2. All enemies die → next wave spawns
3. All heroes die → combat stops
4. Hero dies → death animation plays
5. Enemy dies → death animation plays
6. Dead hero resurrects → combat resumes

### 4.3 Production Build Verification
**Checks**:
1. TestPanel not visible in production build
2. No console logs in production
3. Bundle size is reasonable
4. Performance is acceptable
5. No memory leaks during extended play

## Implementation Order

1. **Phase 1.1** - Dead Entity Filtering (Critical - blocks other fixes)
2. **Phase 1.9.5** - React Batching & Race Conditions (Critical - affects all combat logic)
3. **Phase 1.9.2** - Sprite Ref Management (Critical - affects all animations)
4. **Phase 1.2** - Hero Death Animation (with React fixes)
5. **Phase 1.3** - Enemy Death at HP > 0
6. **Phase 1.4** - Combat Round Continuation (with React fixes)
7. **Phase 1.5** - Next Wave Spawning (verify existing fix)
8. **Phase 1.6** - Enemy Projectile Duplication
9. **Phase 1.7** - Enemy Duplicate Attack Animations (with React fixes)
10. **Phase 1.8** - Combat Stopping
11. **Phase 1.9.1** - Animation State Synchronization
12. **Phase 1.9.3** - Combat Text Throttling
13. **Phase 1.9.4** - localStorage State Sync
14. **Phase 2** - Production Mode Setup
15. **Phase 3** - State Management & Cleanup
16. **Phase 4** - Testing & Verification

## Success Criteria

- ✅ Dead entities are never targeted or act
- ✅ Death animations play correctly for heroes and enemies (React state syncs properly)
- ✅ Enemies only die when HP <= 0
- ✅ Combat rounds continue automatically when enemies die mid-combat (no React batching delays)
- ✅ Next wave spawns automatically after victory
- ✅ Only one projectile per enemy per turn
- ✅ Attack animations play once per attack (no duplicate triggers from React batching)
- ✅ Combat stops properly when all heroes or all enemies are defeated
- ✅ Sprite refs are always available when needed (no silent failures)
- ✅ Combat text shows for all attacks (throttling not too aggressive)
- ✅ No race conditions from React batching or async state updates
- ✅ No test/debug UI in production (TestPanel hidden)
- ✅ No console logs in production (only critical errors in dev mode)
- ✅ Battlefield listener warnings removed/silenced
- ✅ No memory leaks

## Production Mode Decisions

Based on user feedback:
1. **Test Panel**: Only visible in development builds (1c)
2. **Console Logging**: Keep only critical errors, wrapped in dev checks (2b)
3. **Build Configuration**: Use Vite's built-in production mode with environment checks (recommendation)
4. **Debug Features**: Use environment checks to disable all debug features in production (recommendation)
5. **Error Handling**: Silent failures with graceful degradation, no user-facing technical errors (recommendation)
