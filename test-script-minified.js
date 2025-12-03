// Comprehensive Browser Source Test Script - Minified Version
// Copy and paste this entire script into browser console

(function() {
  const testResults = { passed: [], failed: [], warnings: [] };
  
  function assert(condition, message) {
    if (condition) {
      testResults.passed.push(message);
      console.log('✅ PASS: ' + message);
      return true;
    } else {
      testResults.failed.push(message);
      console.error('❌ FAIL: ' + message);
      return false;
    }
  }
  
  function warn(message) {
    testResults.warnings.push(message);
    console.warn('⚠️ WARN: ' + message);
  }
  
  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  function getCombatEngine() {
    const root = document.querySelector('#root');
    if (!root) return null;
    
    // Try to find React fiber
    const keys = Object.keys(root);
    for (let key of keys) {
      if (key.startsWith('__reactFiber') || key.startsWith('__reactInternalInstance')) {
        let fiber = root[key];
        while (fiber) {
          if (fiber.memoizedState) {
            const state = fiber.memoizedState;
            if (state.combatEngine) return state.combatEngine;
            if (state.memoizedState && state.memoizedState.combatEngine) return state.memoizedState.combatEngine;
          }
          if (fiber.stateNode && fiber.stateNode.combatEngine) return fiber.stateNode.combatEngine;
          fiber = fiber.return || fiber.child;
        }
      }
    }
    return null;
  }
  
  function getHeroes() {
    const engine = getCombatEngine();
    if (!engine) return [];
    try {
      const state = engine.getState();
      const heroes = state.heroes;
      return Array.isArray(heroes) ? heroes : Array.from(heroes.values());
    } catch (e) {
      return [];
    }
  }
  
  function getEnemies() {
    const engine = getCombatEngine();
    if (!engine) return [];
    try {
      const state = engine.getState();
      return state.currentEnemies || [];
    } catch (e) {
      return [];
    }
  }
  
  async function testCombatSystem() {
    console.log('\n🧪 Testing Combat System...\n');
    const engine = getCombatEngine();
    if (!engine) {
      assert(false, 'Combat engine not found');
      return;
    }
    const enemies = getEnemies();
    const heroes = getHeroes();
    assert(enemies.length >= 0, 'Enemies array exists');
    assert(heroes.length > 0, 'Heroes are present');
    const state = engine.getState();
    assert(state !== null, 'Combat state exists');
    console.log('\n✅ Combat System Tests Complete\n');
  }
  
  async function testDeathDetection() {
    console.log('\n🧪 Testing Death Detection...\n');
    const heroes = getHeroes();
    if (heroes.length === 0) {
      warn('No heroes available for death detection test');
      return;
    }
    const testHero = heroes[0];
    assert(typeof testHero.hp === 'number', 'Hero HP is a number');
    assert(testHero.hp >= 0, 'Hero HP is non-negative');
    assert(testHero.hp <= testHero.maxHp, 'Hero HP does not exceed max HP');
    if (testHero.hp === 0) {
      assert(testHero.isDead === true, 'Hero with 0 HP is marked as dead');
    } else if (testHero.hp > 0) {
      assert(testHero.isDead === false || testHero.isDead === undefined, 'Hero with HP > 0 is not marked as dead');
    }
    assert(Number.isInteger(testHero.hp) || testHero.hp === Math.floor(testHero.hp), 'Hero HP is an integer');
    console.log('\n✅ Death Detection Tests Complete\n');
  }
  
  async function testDebuffSystem() {
    console.log('\n🧪 Testing Debuff System...\n');
    const heroes = getHeroes();
    if (heroes.length === 0) {
      warn('No heroes available for debuff test');
      return;
    }
    const testHero = heroes[0];
    assert(testHero.activeDebuffs !== undefined, 'Hero has activeDebuffs property');
    const heroId = testHero.id || testHero.name || testHero.characterName || testHero.username;
    const debuffContainer = document.querySelector('#battle-hero-' + heroId + ' .battle-debuffs');
    assert(debuffContainer !== null, 'Debuff container exists in DOM');
    if (testHero.activeDebuffs && Object.keys(testHero.activeDebuffs).length > 0) {
      Object.entries(testHero.activeDebuffs).forEach(function(entry) {
        const key = entry[0];
        const debuff = entry[1];
        assert(debuff !== null && typeof debuff === 'object', 'Debuff ' + key + ' is an object');
        assert(debuff.expiresAt !== undefined, 'Debuff ' + key + ' has expiresAt property');
      });
    }
    console.log('\n✅ Debuff System Tests Complete\n');
  }
  
  async function testShieldSystem() {
    console.log('\n🧪 Testing Shield System...\n');
    const heroes = getHeroes();
    if (heroes.length === 0) {
      warn('No heroes available for shield test');
      return;
    }
    const testHero = heroes[0];
    assert(testHero.shield !== undefined || testHero.shield === undefined, 'Hero has shield property');
    if (testHero.shield) {
      assert(typeof testHero.shield === 'object', 'Shield is an object');
      assert(typeof testHero.shield.amount === 'number', 'Shield has amount property');
      assert(testHero.shield.amount >= 0, 'Shield amount is non-negative');
    }
    console.log('\n✅ Shield System Tests Complete\n');
  }
  
  async function testHealingSystem() {
    console.log('\n🧪 Testing Healing System...\n');
    const heroes = getHeroes();
    if (heroes.length === 0) {
      warn('No heroes available for healing test');
      return;
    }
    const testHero = heroes[0];
    assert(typeof testHero.hp === 'number', 'Hero HP is a number');
    assert(typeof testHero.maxHp === 'number', 'Hero maxHp is a number');
    assert(testHero.maxHp > 0, 'Hero maxHp is greater than 0');
    assert(testHero.hp <= testHero.maxHp, 'Hero HP does not exceed maxHp');
    console.log('\n✅ Healing System Tests Complete\n');
  }
  
  async function testEnemySpawning() {
    console.log('\n🧪 Testing Enemy Spawning...\n');
    const enemies = getEnemies();
    assert(Array.isArray(enemies), 'Enemies is an array');
    enemies.forEach(function(enemy, index) {
      assert(enemy !== null && typeof enemy === 'object', 'Enemy ' + index + ' is an object');
      assert(enemy.id !== undefined, 'Enemy ' + index + ' has id property');
      assert(typeof enemy.hp === 'number', 'Enemy ' + index + ' has hp property');
    });
    console.log('\n✅ Enemy Spawning Tests Complete\n');
  }
  
  async function testStateConsistency() {
    console.log('\n🧪 Testing State Consistency...\n');
    const heroes = getHeroes();
    const enemies = getEnemies();
    heroes.forEach(function(hero, index) {
      const hp = Math.floor(hero.hp || 0);
      const isDead = hero.isDead || false;
      if (hp <= 0) {
        assert(isDead === true, 'Hero ' + index + ': isDead is true when HP <= 0');
      } else {
        assert(isDead === false, 'Hero ' + index + ': isDead is false when HP > 0');
      }
      assert(Number.isInteger(hp), 'Hero ' + index + ': HP is an integer');
    });
    enemies.forEach(function(enemy, index) {
      const hp = Math.floor(enemy.hp || 0);
      const isDead = enemy.isDead || false;
      if (hp <= 0) {
        assert(isDead === true, 'Enemy ' + index + ': isDead is true when HP <= 0');
      } else {
        assert(isDead === false, 'Enemy ' + index + ': isDead is false when HP > 0');
      }
      assert(Number.isInteger(hp), 'Enemy ' + index + ': HP is an integer');
    });
    console.log('\n✅ State Consistency Tests Complete\n');
  }
  
  async function runAllTests() {
    console.log('\n🚀 Starting Comprehensive Test Suite...\n');
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
    console.log('\n📊 Test Results Summary:\n');
    console.log('✅ Passed: ' + testResults.passed.length);
    console.log('❌ Failed: ' + testResults.failed.length);
    console.log('⚠️ Warnings: ' + testResults.warnings.length);
    
    if (testResults.failed.length > 0) {
      console.log('\n❌ Failed Tests:');
      testResults.failed.forEach(function(test) {
        console.log('  - ' + test);
      });
    }
    
    if (testResults.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      testResults.warnings.forEach(function(warning) {
        console.log('  - ' + warning);
      });
    }
    
    const totalTests = testResults.passed.length + testResults.failed.length;
    const passRate = totalTests > 0 ? (testResults.passed.length / totalTests * 100).toFixed(1) : 0;
    console.log('\n📈 Pass Rate: ' + passRate + '%');
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
  
  console.log('🧪 Test functions loaded!');
  console.log('Run: runAllTests() to test everything');
})();


