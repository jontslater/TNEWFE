# Testing Guide

## Quick Start

### Browser Console Testing

**IMPORTANT: Use `test-script-simple.js` (not `test-script.js`) to avoid syntax errors!**

1. **Open the browser source page** in your browser
2. **Open Developer Tools** (F12 or Right-click → Inspect)
3. **Go to the Console tab**
4. **Copy the entire contents of `test-script-simple.js`** (this version has no special characters)
5. **Paste it into the console and press Enter**
6. **Run the tests**: Type `runAllTests()` and press Enter

**Alternative: Load via fetch (if dev server running)**
```javascript
fetch('/test-script-simple.js').then(r=>r.text()).then(eval)
```
Then run: `runAllTests()`

### Individual Test Suites

You can also run individual test suites:

```javascript
// Test specific systems
testCombatSystem()        // Test combat mechanics
testDeathDetection()      // Test death detection
testDebuffSystem()        // Test debuff system
testShieldSystem()        // Test shield system
testHealingSystem()       // Test healing system
testEnemySpawning()       // Test enemy spawning
testAnimationSystem()     // Test animation system
testStateConsistency()    // Test state consistency
```

## Test Results

The test script will output:
- ✅ **Passed tests**: Tests that passed
- ❌ **Failed tests**: Tests that failed
- ⚠️ **Warnings**: Potential issues that don't fail the test

At the end, you'll get a summary with:
- Total passed/failed/warnings
- Pass rate percentage
- List of failed tests
- List of warnings

## What Gets Tested

### Combat System
- Combat engine is accessible
- Enemies are present
- Heroes are present
- Combat state is correct

### Death Detection
- HP is valid (number, non-negative, <= maxHp)
- isDead matches HP state
- HP is an integer
- Death animation elements exist

### Debuff System
- activeDebuffs property exists
- Debuff container exists in DOM
- Debuffs have correct structure (expiresAt, etc.)

### Shield System
- Shield property exists
- Shield has correct structure (amount, expiresAt)

### Healing System
- HP and maxHp are valid
- HP doesn't exceed maxHp
- HP is an integer

### Enemy Spawning
- Enemies array exists
- Enemies have required properties
- Enemy containers exist in DOM

### Animation System
- Hero sprite containers exist
- Animation elements are accessible

### State Consistency
- HP and isDead are consistent for all heroes
- HP and isDead are consistent for all enemies
- HP values are integers

## Troubleshooting

### "Combat engine not found"
- Make sure the browser source page is fully loaded
- Check that the combat engine has been initialized
- Try refreshing the page

### "No heroes available"
- Make sure heroes have joined the battlefield
- Check that the game is running
- Try using the test panel to spawn heroes

### "Element not found"
- Make sure the page has rendered
- Check that the element IDs match the expected format
- Verify the hero/enemy is actually rendered

## Integration with Test Panel

The test script works alongside the Test Panel:
1. Use Test Panel buttons to set up test scenarios
2. Run the test script to verify state
3. Use Test Panel to trigger actions
4. Run tests again to verify results

## Example Workflow

```javascript
// 1. Run initial tests
runAllTests()

// 2. Use test panel to spawn an enemy
// (Click "Spawn Enemy" button in Test Panel)

// 3. Wait a moment for combat to start
await new Promise(r => setTimeout(r, 2000))

// 4. Test combat system
testCombatSystem()

// 5. Kill a hero using test panel
// (Click "Kill Hero" button in Test Panel)

// 6. Test death detection
testDeathDetection()

// 7. Run full test suite again
runAllTests()
```

## Notes

- The test script is **non-destructive** - it only reads state, doesn't modify it
- Some tests may show warnings if elements aren't rendered yet (this is normal)
- The script works best when the game is in an active state (combat or adventure)
- For best results, run tests after using the Test Panel to set up scenarios
