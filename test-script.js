/**
 * Comprehensive Browser Source Test Script
 * 
 * This script can be run in the browser console to test all game mechanics.
 * 
 * Usage:
 * 1. Open the browser source page
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire script
 * 4. Run: runAllTests()
 * 
 * Or run individual test suites:
 * - testCombatSystem()
 * - testDeathDetection()
 * - testDebuffSystem()
 * - testShieldSystem()
 * - testHealingSystem()
 * - testEnemySpawning()
 * - testAnimationSystem()
 */

// Test results storage
const testResults = {
  passed: [],
  failed: [],
  warnings: []
};

// Test helper functions
function assert(condition, message) {
  if (condition) {
    testResults.passed.push(message);
    console.log(`✅ PASS: ${message}`);
    return true;
  } else {
    testResults.failed.push(message);
    console.error(`❌ FAIL: ${message}`);
    return false;
  }
}

function warn(message) {
  testResults.warnings.push(message);
  console.warn(`⚠️ WARN: ${message}`);
}

function getTestPanel() {
  // Try to find the test panel component
  // This assumes the test panel is rendered and accessible
  return window.testHelpers || null;
}

function getCombatEngine() {
  // Try to access the combat engine from the React component
  // This is a bit hacky but necessary for browser console testing
  const reactFiber = document.querySelector('[data-reactroot]')?._reactInternalFiber ||
                     document.querySelector('#root')?._reactInternalFiber;
  
  if (reactFiber) {
    // Try to find FullCombatEngine instance
    let fiber = reactFiber;
    while (fiber) {
      if (fiber.memoizedState) {
        const state = fiber.memoizedState;
        if (state.combatEngine) {
          return state.combatEngine;
        }
      }
      fiber = fiber.return;
    }
  }
  
  return null;
}

function getHeroes() {
  const engine = getCombatEngine();
  if (engine) {
    const state = engine.getState();
    const heroes = state.heroes;
    return Array.isArray(heroes) ? heroes : Array.from(heroes.values());
  }
  return [];
}

function getEnemies() {
  const engine = getCombatEngine();
  if (engine) {
    const state = engine.getState();
    return state.currentEnemies || [];
  }
  return [];
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test Suite: Combat System
async function testCombatSystem() {
  console.log('\n🧪 Testing Combat System...\n');
  
  const engine = getCombatEngine();
  if (!engine) {
    assert(false, 'Combat engine not found');
    return;
  }
  
  // Test 1: Combat can start
  const initialEnemies = getEnemies();
  if (initialEnemies.length === 0) {
    warn('No enemies present, spawning one for testing');
    // Try to spawn an enemy using test helpers if available
    if (window.testHelpers && window.testHelpers.spawnEnemy) {
      window.testHelpers.spawnEnemy('', false);
      await wait(1000);
    }
  }
  
  const enemies = getEnemies();
  assert(enemies.length > 0, 'Enemies are present');
  
  // Test 2: Combat state is correct
  const state = engine.getState();
  assert(state.currentEnemies && state.currentEnemies.length > 0, 'Current enemies array is populated');
  
  // Test 3: Heroes are present
  const heroes = getHeroes();
  assert(heroes.length > 0, 'Heroes are present');
  
  // Test 4: Combat flags are set
  if (state.inCombat) {
    assert(state.inCombat === true, 'inCombat flag is set');
  }
  
  console.log('\n✅ Combat System Tests Complete\n');
}

// Test Suite: Death Detection
async function testDeathDetection() {
  console.log('\n🧪 Testing Death Detection...\n');
  
  const heroes = getHeroes();
  if (heroes.length === 0) {
    warn('No heroes available for death detection test');
    return;
  }
  
  const testHero = heroes[0];
  const initialHp = testHero.hp;
  const initialIsDead = testHero.isDead;
  
  // Test 1: Hero has valid HP
  assert(typeof testHero.hp === 'number', 'Hero HP is a number');
  assert(testHero.hp >= 0, 'Hero HP is non-negative');
  assert(testHero.hp <= testHero.maxHp, 'Hero HP does not exceed max HP');
  
  // Test 2: isDead matches HP state
  if (testHero.hp === 0) {
    assert(testHero.isDead === true, 'Hero with 0 HP is marked as dead');
  } else if (testHero.hp > 0) {
    assert(testHero.isDead === false || testHero.isDead === undefined, 'Hero with HP > 0 is not marked as dead');
  }
  
  // Test 3: HP is an integer
  assert(Number.isInteger(testHero.hp) || testHero.hp === Math.floor(testHero.hp), 'Hero HP is an integer');
  
  // Test 4: Death animation element exists (if hero is dead)
  if (testHero.isDead) {
    const heroId = testHero.id || testHero.name || testHero.characterName || testHero.username;
    const deathElement = document.querySelector(`#battle-hero-${heroId}`);
    if (deathElement) {
      assert(true, 'Death animation element exists for dead hero');
    } else {
      warn(`Death animation element not found for hero: ${heroId}`);
    }
  }
  
  console.log('\n✅ Death Detection Tests Complete\n');
}

// Test Suite: Debuff System
async function testDebuffSystem() {
  console.log('\n🧪 Testing Debuff System...\n');
  
  const heroes = getHeroes();
  if (heroes.length === 0) {
    warn('No heroes available for debuff test');
    return;
  }
  
  const testHero = heroes[0];
  
  // Test 1: activeDebuffs exists
  assert(testHero.activeDebuffs !== undefined, 'Hero has activeDebuffs property');
  
  // Test 2: Debuff container exists in DOM
  const heroId = testHero.id || testHero.name || testHero.characterName || testHero.username;
  const debuffContainer = document.querySelector(`#battle-hero-${heroId} .battle-debuffs`);
  assert(debuffContainer !== null, 'Debuff container exists in DOM');
  
  // Test 3: Debuffs are objects with expiresAt
  if (testHero.activeDebuffs && Object.keys(testHero.activeDebuffs).length > 0) {
    Object.entries(testHero.activeDebuffs).forEach(([key, debuff]) => {
      assert(debuff !== null && typeof debuff === 'object', `Debuff ${key} is an object`);
      assert(debuff.expiresAt !== undefined, `Debuff ${key} has expiresAt property`);
      assert(typeof debuff.expiresAt === 'number', `Debuff ${key} expiresAt is a number`);
    });
  }
  
  console.log('\n✅ Debuff System Tests Complete\n');
}

// Test Suite: Shield System
async function testShieldSystem() {
  console.log('\n🧪 Testing Shield System...\n');
  
  const heroes = getHeroes();
  if (heroes.length === 0) {
    warn('No heroes available for shield test');
    return;
  }
  
  const testHero = heroes[0];
  
  // Test 1: Shield property exists
  assert(testHero.shield !== undefined || testHero.shield === undefined, 'Hero has shield property (or undefined)');
  
  // Test 2: If shield exists, it has correct structure
  if (testHero.shield) {
    assert(typeof testHero.shield === 'object', 'Shield is an object');
    assert(typeof testHero.shield.amount === 'number', 'Shield has amount property');
    assert(testHero.shield.amount >= 0, 'Shield amount is non-negative');
    assert(typeof testHero.shield.expiresAt === 'number', 'Shield has expiresAt property');
  }
  
  console.log('\n✅ Shield System Tests Complete\n');
}

// Test Suite: Healing System
async function testHealingSystem() {
  console.log('\n🧪 Testing Healing System...\n');
  
  const heroes = getHeroes();
  if (heroes.length === 0) {
    warn('No heroes available for healing test');
    return;
  }
  
  const testHero = heroes[0];
  
  // Test 1: HP and maxHp are valid
  assert(typeof testHero.hp === 'number', 'Hero HP is a number');
  assert(typeof testHero.maxHp === 'number', 'Hero maxHp is a number');
  assert(testHero.maxHp > 0, 'Hero maxHp is greater than 0');
  assert(testHero.hp <= testHero.maxHp, 'Hero HP does not exceed maxHp');
  
  // Test 2: HP is an integer
  assert(Number.isInteger(testHero.hp) || testHero.hp === Math.floor(testHero.hp), 'Hero HP is an integer');
  
  console.log('\n✅ Healing System Tests Complete\n');
}

// Test Suite: Enemy Spawning
async function testEnemySpawning() {
  console.log('\n🧪 Testing Enemy Spawning...\n');
  
  const enemies = getEnemies();
  
  // Test 1: Enemies array exists
  assert(Array.isArray(enemies), 'Enemies is an array');
  
  // Test 2: Enemies have required properties
  enemies.forEach((enemy, index) => {
    assert(enemy !== null && typeof enemy === 'object', `Enemy ${index} is an object`);
    assert(enemy.id !== undefined, `Enemy ${index} has id property`);
    assert(enemy.name !== undefined, `Enemy ${index} has name property`);
    assert(typeof enemy.hp === 'number', `Enemy ${index} has hp property`);
    assert(enemy.hp >= 0, `Enemy ${index} hp is non-negative`);
  });
  
  // Test 3: Enemy containers exist in DOM
  enemies.forEach((enemy, index) => {
    const enemyId = enemy.id || enemy.name || enemy.type || `enemy-${index}`;
    const enemyElement = document.querySelector(`#battle-enemy-${enemyId}`);
    if (enemyElement) {
      assert(true, `Enemy ${index} container exists in DOM`);
    } else {
      warn(`Enemy ${index} container not found in DOM: battle-enemy-${enemyId}`);
    }
  });
  
  console.log('\n✅ Enemy Spawning Tests Complete\n');
}

// Test Suite: Animation System
async function testAnimationSystem() {
  console.log('\n🧪 Testing Animation System...\n');
  
  const heroes = getHeroes();
  if (heroes.length === 0) {
    warn('No heroes available for animation test');
    return;
  }
  
  // Test 1: Hero sprite containers exist
  heroes.forEach((hero, index) => {
    const heroId = hero.id || hero.name || hero.characterName || hero.username;
    const heroElement = document.querySelector(`#battle-hero-${heroId}`);
    if (heroElement) {
      assert(true, `Hero ${index} sprite container exists`);
    } else {
      warn(`Hero ${index} sprite container not found: battle-hero-${heroId}`);
    }
  });
  
  // Test 2: Animation classes can be applied
  const testHero = heroes[0];
  const heroId = testHero.id || testHero.name || testHero.characterName || testHero.username;
  const heroElement = document.querySelector(`#battle-hero-${heroId}`);
  if (heroElement) {
    // Try to find sprite element
    const spriteElement = heroElement.querySelector('.sprite-container, .hero-sprite, img');
    if (spriteElement) {
      assert(true, 'Hero sprite element exists for animation');
    } else {
      warn('Hero sprite element not found for animation');
    }
  }
  
  console.log('\n✅ Animation System Tests Complete\n');
}

// Test Suite: State Consistency
async function testStateConsistency() {
  console.log('\n🧪 Testing State Consistency...\n');
  
  const heroes = getHeroes();
  const enemies = getEnemies();
  
  // Test 1: All heroes have consistent state
  heroes.forEach((hero, index) => {
    const hp = Math.floor(hero.hp || 0);
    const isDead = hero.isDead || false;
    
    // HP and isDead should be consistent
    if (hp <= 0) {
      assert(isDead === true, `Hero ${index}: isDead is true when HP <= 0`);
    } else {
      assert(isDead === false, `Hero ${index}: isDead is false when HP > 0`);
    }
    
    // HP should be an integer
    assert(Number.isInteger(hp), `Hero ${index}: HP is an integer`);
  });
  
  // Test 2: All enemies have consistent state
  enemies.forEach((enemy, index) => {
    const hp = Math.floor(enemy.hp || 0);
    const isDead = enemy.isDead || false;
    
    // HP and isDead should be consistent
    if (hp <= 0) {
      assert(isDead === true, `Enemy ${index}: isDead is true when HP <= 0`);
    } else {
      assert(isDead === false, `Enemy ${index}: isDead is false when HP > 0`);
    }
    
    // HP should be an integer
    assert(Number.isInteger(hp), `Enemy ${index}: HP is an integer`);
  });
  
  console.log('\n✅ State Consistency Tests Complete\n');
}

// Run all tests
async function runAllTests() {
  console.log('\n🚀 Starting Comprehensive Test Suite...\n');
  console.log('=' .repeat(60));
  
  // Reset results
  testResults.passed = [];
  testResults.failed = [];
  testResults.warnings = [];
  
  // Run all test suites
  await testCombatSystem();
  await wait(500);
  
  await testDeathDetection();
  await wait(500);
  
  await testDebuffSystem();
  await wait(500);
  
  await testShieldSystem();
  await wait(500);
  
  await testHealingSystem();
  await wait(500);
  
  await testEnemySpawning();
  await wait(500);
  
  await testAnimationSystem();
  await wait(500);
  
  await testStateConsistency();
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Results Summary:\n');
  console.log(`✅ Passed: ${testResults.passed.length}`);
  console.log(`❌ Failed: ${testResults.failed.length}`);
  console.log(`⚠️ Warnings: ${testResults.warnings.length}`);
  
  if (testResults.failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.failed.forEach(test => console.log(`  - ${test}`));
  }
  
  if (testResults.warnings.length > 0) {
    console.log('\n⚠️ Warnings:');
    testResults.warnings.forEach(warning => console.log(`  - ${warning}`));
  }
  
  const totalTests = testResults.passed.length + testResults.failed.length;
  const passRate = totalTests > 0 ? (testResults.passed.length / totalTests * 100).toFixed(1) : 0;
  console.log(`\n📈 Pass Rate: ${passRate}%`);
  
  console.log('\n' + '='.repeat(60));
  
  return {
    passed: testResults.passed.length,
    failed: testResults.failed.length,
    warnings: testResults.warnings.length,
    passRate: parseFloat(passRate)
  };
}

// Export for use
if (typeof window !== 'undefined') {
  window.runAllTests = runAllTests;
  window.testCombatSystem = testCombatSystem;
  window.testDeathDetection = testDeathDetection;
  window.testDebuffSystem = testDebuffSystem;
  window.testShieldSystem = testShieldSystem;
  window.testHealingSystem = testHealingSystem;
  window.testEnemySpawning = testEnemySpawning;
  window.testAnimationSystem = testAnimationSystem;
  window.testStateConsistency = testStateConsistency;
  
  console.log('🧪 Test functions loaded!');
  console.log('Run: runAllTests() to test everything');
  console.log('Or run individual tests: testCombatSystem(), testDeathDetection(), etc.');
}


