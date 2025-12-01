# Quick Test Script - Easy Copy/Paste

## Method 1: Use the Minified Script (Recommended)

1. Open `test-script-minified.js` in a text editor
2. Copy the ENTIRE file (Ctrl+A, Ctrl+C)
3. Open browser console (F12)
4. Paste into console (Ctrl+V)
5. Press Enter
6. Type: `runAllTests()`

## Method 2: Load from File (If Dev Server Running)

If your dev server is running on localhost:3000, you can load it directly:

```javascript
// Paste this in console:
var script = document.createElement('script');
script.src = 'http://localhost:3000/test-script-minified.js';
document.body.appendChild(script);
```

Then wait a moment and run: `runAllTests()`

## Method 3: One-Line Loader

If you have the file accessible, use this one-liner:

```javascript
fetch('http://localhost:3000/test-script-minified.js').then(r=>r.text()).then(eval);
```

Then run: `runAllTests()`

## Troubleshooting Syntax Errors

If you get "Invalid or unexpected token" errors:

1. **Make sure you copy the ENTIRE file** - don't miss any characters
2. **Use the minified version** (`test-script-minified.js`) - it avoids template literals
3. **Check your browser console encoding** - some browsers have issues with special characters
4. **Try pasting in smaller chunks** - if the file is too large, paste it in sections

## Alternative: Manual Testing

If the script still doesn't work, you can test manually using the Test Panel:

1. Open the browser source page
2. Use the Test Panel buttons to trigger mechanics
3. Check the console for logs
4. Verify behavior matches expectations

## Quick Test Commands (After Script Loads)

```javascript
runAllTests()              // Run everything
testCombatSystem()         // Test combat
testDeathDetection()       // Test death
testDebuffSystem()         // Test debuffs
testShieldSystem()         // Test shields
testHealingSystem()        // Test healing
testEnemySpawning()        // Test enemies
testStateConsistency()     // Test state
```
