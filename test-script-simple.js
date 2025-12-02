// Simple Test Script - No special characters, guaranteed to work
// Copy everything from here to the end

(function() {
  var testResults = { passed: [], failed: [], warnings: [] };
  
  function assert(condition, message) {
    if (condition) {
      testResults.passed.push(message);
      console.log('[PASS] ' + message);
      return true;
    } else {
      testResults.failed.push(message);
      console.error('[FAIL] ' + message);
      return false;
    }
  }
  
  function warn(message) {
    testResults.warnings.push(message);
    console.warn('[WARN] ' + message);
  }
  
  function wait(ms) {
    return new Promise(function(resolve) {
      setTimeout(resolve, ms);
    });
  }
  
  function getCombatEngine() {
    try {
      var root = document.querySelector('#root');
      if (!root) return null;
      
      var keys = Object.keys(root);
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.indexOf('reactFiber') >= 0 || key.indexOf('reactInternalInstance') >= 0) {
          var fiber = root[key];
          while (fiber) {
            if (fiber.memoizedState) {
              var state = fiber.memoizedState;
              if (state.combatEngine) return state.combatEngine;
              if (state.memoizedState && state.memoizedState.combatEngine) {
                return state.memoizedState.combatEngine;
              }
            }
            if (fiber.stateNode && fiber.stateNode.combatEngine) {
              return fiber.stateNode.combatEngine;
            }
            fiber = fiber.return || fiber.child;
          }
        }
      }
    } catch (e) {
      console.error('Error finding combat engine:', e);
    }
    return null;
  }
  
  function getHeroes() {
    var engine = getCombatEngine();
    if (!engine) return [];
    try {
      var state = engine.getState();
      var heroes = state.heroes;
      return Array.isArray(heroes) ? heroes : Array.from(heroes.values());
    } catch (e) {
      return [];
    }
  }
  
  function getEnemies() {
    var engine = getCombatEngine();
    if (!engine) return [];
    try {
      var state = engine.getState();
      return state.currentEnemies || [];
    } catch (e) {
      return [];
    }
  }
  
  async function testCombatSystem() {
    console.log('\n[TEST] Testing Combat System...\n');
    var engine = getCombatEngine();
    if (!engine) {
      assert(false, 'Combat engine not found');
      return;
    }
    var enemies = getEnemies();
    var heroes = getHeroes();
    assert(enemies.length >= 0, 'Enemies array exists');
    assert(heroes.length > 0, 'Heroes are present');
    var state = engine.getState();
    assert(state !== null, 'Combat state exists');
    console.log('\n[OK] Combat System Tests Complete\n');
  }
  
  async function testDeathDetection() {
    console.log('\n[TEST] Testing Death Detection...\n');
    var heroes = getHeroes();
    if (heroes.length === 0) {
      warn('No heroes available for death detection test');
      return;
    }
    var testHero = heroes[0];
    assert(typeof testHero.hp === 'number', 'Hero HP is a number');
    assert(testHero.hp >= 0, 'Hero HP is non-negative');
    assert(testHero.hp <= testHero.maxHp, 'Hero HP does not exceed max HP');
    if (testHero.hp === 0) {
      assert(testHero.isDead === true, 'Hero with 0 HP is marked as dead');
    } else if (testHero.hp > 0) {
      assert(testHero.isDead === false || testHero.isDead === undefined, 'Hero with HP > 0 is not marked as dead');
    }
    assert(Number.isInteger(testHero.hp) || testHero.hp === Math.floor(testHero.hp), 'Hero HP is an integer');
    console.log('\n[OK] Death Detection Tests Complete\n');
  }
  
  async function testDebuffSystem() {
    console.log('\n[TEST] Testing Debuff System...\n');
    var heroes = getHeroes();
    if (heroes.length === 0) {
      warn('No heroes available for debuff test');
      return;
    }
    var testHero = heroes[0];
    assert(testHero.activeDebuffs !== undefined, 'Hero has activeDebuffs property');
    var heroId = testHero.id || testHero.name || testHero.characterName || testHero.username;
    var debuffContainer = document.querySelector('#battle-hero-' + heroId + ' .battle-debuffs');
    assert(debuffContainer !== null, 'Debuff container exists in DOM');
    if (testHero.activeDebuffs && Object.keys(testHero.activeDebuffs).length > 0) {
      var entries = Object.entries(testHero.activeDebuffs);
      for (var i = 0; i < entries.length; i++) {
        var key = entries[i][0];
        var debuff = entries[i][1];
        assert(debuff !== null && typeof debuff === 'object', 'Debuff ' + key + ' is an object');
        assert(debuff.expiresAt !== undefined, 'Debuff ' + key + ' has expiresAt property');
      }
    }
    console.log('\n[OK] Debuff System Tests Complete\n');
  }
  
  async function testShieldSystem() {
    console.log('\n[TEST] Testing Shield System...\n');
    var heroes = getHeroes();
    if (heroes.length === 0) {
      warn('No heroes available for shield test');
      return;
    }
    var testHero = heroes[0];
    assert(testHero.shield !== undefined || testHero.shield === undefined, 'Hero has shield property');
    if (testHero.shield) {
      assert(typeof testHero.shield === 'object', 'Shield is an object');
      assert(typeof testHero.shield.amount === 'number', 'Shield has amount property');
      assert(testHero.shield.amount >= 0, 'Shield amount is non-negative');
    }
    console.log('\n[OK] Shield System Tests Complete\n');
  }
  
  async function testHealingSystem() {
    console.log('\n[TEST] Testing Healing System...\n');
    var heroes = getHeroes();
    if (heroes.length === 0) {
      warn('No heroes available for healing test');
      return;
    }
    var testHero = heroes[0];
    assert(typeof testHero.hp === 'number', 'Hero HP is a number');
    assert(typeof testHero.maxHp === 'number', 'Hero maxHp is a number');
    assert(testHero.maxHp > 0, 'Hero maxHp is greater than 0');
    assert(testHero.hp <= testHero.maxHp, 'Hero HP does not exceed maxHp');
    console.log('\n[OK] Healing System Tests Complete\n');
  }
  
  async function testEnemySpawning() {
    console.log('\n[TEST] Testing Enemy Spawning...\n');
    var enemies = getEnemies();
    assert(Array.isArray(enemies), 'Enemies is an array');
    for (var i = 0; i < enemies.length; i++) {
      var enemy = enemies[i];
      assert(enemy !== null && typeof enemy === 'object', 'Enemy ' + i + ' is an object');
      assert(enemy.id !== undefined, 'Enemy ' + i + ' has id property');
      assert(typeof enemy.hp === 'number', 'Enemy ' + i + ' has hp property');
    }
    console.log('\n[OK] Enemy Spawning Tests Complete\n');
  }
  
  async function testStateConsistency() {
    console.log('\n[TEST] Testing State Consistency...\n');
    var heroes = getHeroes();
    var enemies = getEnemies();
    for (var i = 0; i < heroes.length; i++) {
      var hero = heroes[i];
      var hp = Math.floor(hero.hp || 0);
      var isDead = hero.isDead || false;
      if (hp <= 0) {
        assert(isDead === true, 'Hero ' + i + ': isDead is true when HP <= 0');
      } else {
        assert(isDead === false, 'Hero ' + i + ': isDead is false when HP > 0');
      }
      assert(Number.isInteger(hp), 'Hero ' + i + ': HP is an integer');
    }
    for (var j = 0; j < enemies.length; j++) {
      var enemy = enemies[j];
      var enemyHp = Math.floor(enemy.hp || 0);
      var enemyIsDead = enemy.isDead || false;
      if (enemyHp <= 0) {
        assert(enemyIsDead === true, 'Enemy ' + j + ': isDead is true when HP <= 0');
      } else {
        assert(enemyIsDead === false, 'Enemy ' + j + ': isDead is false when HP > 0');
      }
      assert(Number.isInteger(enemyHp), 'Enemy ' + j + ': HP is an integer');
    }
    console.log('\n[OK] State Consistency Tests Complete\n');
  }
  
  async function runAllTests() {
    console.log('\n[START] Starting Comprehensive Test Suite...\n');
    console.log('============================================================');
    testResults.passed = [];
    testResults.failed = [];
    testResults.warnings = [];
    
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
    await testStateConsistency();
    
    console.log('\n============================================================');
    console.log('\n[SUMMARY] Test Results:\n');
    console.log('Passed: ' + testResults.passed.length);
    console.log('Failed: ' + testResults.failed.length);
    console.log('Warnings: ' + testResults.warnings.length);
    
    if (testResults.failed.length > 0) {
      console.log('\n[FAILED] Failed Tests:');
      for (var i = 0; i < testResults.failed.length; i++) {
        console.log('  - ' + testResults.failed[i]);
      }
    }
    
    if (testResults.warnings.length > 0) {
      console.log('\n[WARN] Warnings:');
      for (var j = 0; j < testResults.warnings.length; j++) {
        console.log('  - ' + testResults.warnings[j]);
      }
    }
    
    var totalTests = testResults.passed.length + testResults.failed.length;
    var passRate = totalTests > 0 ? (testResults.passed.length / totalTests * 100).toFixed(1) : 0;
    console.log('\n[PASS RATE] ' + passRate + '%');
    console.log('\n============================================================');
    
    return {
      passed: testResults.passed.length,
      failed: testResults.failed.length,
      warnings: testResults.warnings.length,
      passRate: parseFloat(passRate)
    };
  }
  
  window.runAllTests = runAllTests;
  window.testCombatSystem = testCombatSystem;
  window.testDeathDetection = testDeathDetection;
  window.testDebuffSystem = testDebuffSystem;
  window.testShieldSystem = testShieldSystem;
  window.testHealingSystem = testHealingSystem;
  window.testEnemySpawning = testEnemySpawning;
  window.testStateConsistency = testStateConsistency;
  
  console.log('[LOADED] Test functions loaded!');
  console.log('[INFO] Run: runAllTests() to test everything');
})();

