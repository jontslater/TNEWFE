# Comprehensive Browser Source Test Plan

## Test Categories

### 1. Combat System
- [ ] **Combat Start/Stop**
  - Start combat with enemies
  - Stop combat mid-fight
  - Combat stops when all heroes die
  - Combat stops when all enemies die
  
- [ ] **Hero Actions**
  - Heroes attack enemies
  - Heroes use abilities
  - Heroes target alive enemies only
  - Heroes skip turn when stunned
  - Heroes skip turn when on cooldown
  
- [ ] **Enemy Actions**
  - Enemies attack heroes
  - Enemies use projectiles (if applicable)
  - Enemies attack only once per round
  - Enemies don't attack dead heroes
  - Enemies stop attacking when dead
  
- [ ] **Death Detection**
  - Heroes die at 0 HP
  - Heroes show death animation at 0 HP
  - Enemies die at 0 HP
  - Enemies show death animation at 0 HP
  - Death animations play correctly
  - No attacks on dead entities
  
- [ ] **Combat Rounds**
  - Rounds process sequentially
  - No overlapping rounds
  - Turn order based on initiative
  - All heroes get a turn
  - All enemies get a turn

### 2. Damage & Healing
- [ ] **Damage Application**
  - Damage reduces HP correctly
  - Damage affects shields first, then HP
  - Shields absorb damage correctly
  - Shields expire after duration
  - Critical hits deal extra damage
  - Defense reduces damage
  
- [ ] **Healing Application**
  - Healing fills HP first
  - Overheal converts to shields
  - Healing doesn't exceed max HP
  - HoT (Heal over Time) works correctly
  
- [ ] **Shield System**
  - Shields absorb damage
  - Shields expire after duration
  - Shields clear when depleted
  - Multiple shields stack correctly

### 3. Debuffs & Buffs
- [ ] **Debuff Application**
  - Debuffs apply to heroes
  - Debuffs apply to enemies
  - Debuff icons display correctly
  - Debuff timers count down
  - Debuffs expire correctly
  - DoT (Damage over Time) applies damage
  - Stagger DoT applies damage
  
- [ ] **Buff Application**
  - Buffs apply to heroes
  - Buff icons display correctly
  - Buff timers count down
  - Buffs expire correctly
  - HoT (Heal over Time) applies healing
  
- [ ] **Debuff/Buff Display**
  - Debuffs show above hero/enemy name
  - Buffs show above hero/enemy name
  - Icons display correctly
  - Timers update correctly
  - Multiple debuffs stack correctly

### 4. Enemy Spawning
- [ ] **Enemy Generation**
  - Enemies spawn at correct level
  - Enemies scale with party level
  - Boss enemies spawn correctly
  - Pack enemies spawn correctly
  - No duplicate enemies in same wave
  
- [ ] **Wave System**
  - Wave counter increments correctly
  - Wave counter only increments on new enemy
  - Waves continue after victory
  - New enemies spawn after victory

### 5. Animation System
- [ ] **Hero Animations**
  - Idle animation plays
  - Attack animation plays
  - Hurt animation plays
  - Death animation plays
  - Heal animation plays
  - Animations don't overlap incorrectly
  
- [ ] **Enemy Animations**
  - Idle animation plays
  - Attack animation plays
  - Hurt animation plays
  - Death animation plays
  - Projectile animations play
  
- [ ] **Animation Transitions**
  - Animations return to idle after action
  - Death animations don't get interrupted
  - Animations don't get stuck

### 6. UI Display
- [ ] **Health Bars**
  - HP bars update correctly
  - Shield bars display correctly
  - HP bars show correct percentages
  - Health bars update in real-time
  
- [ ] **Combat Text (SCT)**
  - Damage numbers show
  - Healing numbers show
  - Critical hit indicators show
  - SCT scrolls correctly
  - SCT doesn't overlap
  
- [ ] **Information Display**
  - Wave counter shows
  - Difficulty indicator shows
  - Gold/token balance shows
  - Quest progress shows
  - Level-up notifications show

### 7. Adventure Loop
- [ ] **Adventure States**
  - Adventure loop runs when not in combat
  - Combat interrupts adventure loop
  - Adventure loop resumes after combat
  
- [ ] **Encounters**
  - Enemy encounters trigger
  - Treasure finds trigger
  - Peaceful travel triggers
  - Gathering events trigger
  - No encounters during combat

### 8. Test Panel Functions
- [ ] **Spawn Functions**
  - Spawn Enemy works
  - Spawn Boss works
  - Spawn Pack works
  - Kill All Enemies works
  
- [ ] **Hero Functions**
  - Set Hero HP works
  - Kill Hero works
  - Resurrect Hero works
  - Level Up Hero works
  - Give Gold works
  
- [ ] **Debuff Functions**
  - Apply Debuff to Hero works
  - Apply Debuff to Enemy works
  - Clear Hero Debuffs works
  - Clear All Debuffs works
  
- [ ] **Healing Functions**
  - Heal Hero works
  - Give Shield works
  - Clear Shields works
  
- [ ] **Combat Functions**
  - Start Combat works
  - Stop Combat works
  - Force Combat Round works

### 9. Edge Cases
- [ ] **Zero HP Handling**
  - Heroes at 0 HP are dead
  - Enemies at 0 HP are dead
  - No negative HP
  - HP is always an integer
  
- [ ] **State Consistency**
  - isDead matches HP state
  - HP matches visual display
  - Debuffs match activeDebuffs
  - Buffs match activeBuffs
  
- [ ] **Race Conditions**
  - No duplicate attacks
  - No overlapping combat rounds
  - No state corruption
  - Proper cleanup on combat end

### 10. Performance
- [ ] **Memory Leaks**
  - No memory leaks in combat loop
  - Intervals are cleared properly
  - Event listeners are cleaned up
  - No orphaned DOM elements
  
- [ ] **Performance**
  - Combat runs smoothly
  - No frame drops
  - Animations are smooth
  - UI updates are responsive

## Testing Instructions

1. Open the browser source page
2. Open the Test Panel (should be visible on the page)
3. Enable logging for the category you're testing
4. Use the test buttons to trigger mechanics
5. Observe the behavior and check the console logs
6. Verify visual feedback matches expected behavior
7. Check for errors in the console

## Known Issues to Watch For

1. **Debuff Display**: Sometimes debuffs don't show - check ID resolution
2. **Death Animation**: Heroes may not show death animation - check ID format
3. **Duplicate Attacks**: Enemies may attack multiple times - check activeEnemyAttacks
4. **Combat Not Stopping**: Combat may continue after all heroes die - check checkCombatVictory
5. **Wave Counter**: May increment incorrectly - check adventureTick vs encounterEnemy

## Test Results Template

```
Test: [Test Name]
Status: [PASS/FAIL]
Notes: [Any observations]
Errors: [Any errors encountered]
```
