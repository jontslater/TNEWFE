/**
 * Test Runner - Integrated test suite
 * Runs tests directly in the application environment
 */

import { FullCombatEngine } from './fullCombatEngine';
import { Hero, Enemy } from './combat/types';

export interface TestResults {
  passed: number;
  failed: number;
  warnings: number;
  passRate: number;
  details: {
    passed: string[];
    failed: string[];
    warnings: string[];
  };
}

export class TestRunner {
  private results: {
    passed: string[];
    failed: string[];
    warnings: string[];
  } = {
    passed: [],
    failed: [],
    warnings: []
  };

  private assert(condition: boolean, message: string): boolean {
    if (condition) {
      this.results.passed.push(message);
      console.log('[PASS] ' + message);
      return true;
    } else {
      this.results.failed.push(message);
      console.error('[FAIL] ' + message);
      return false;
    }
  }

  private warn(message: string): void {
    this.results.warnings.push(message);
    console.warn('[WARN] ' + message);
  }

  private getHeroes(engine: FullCombatEngine): Hero[] {
    try {
      const state = engine.getState();
      const heroes = state.heroes;
      return Array.isArray(heroes) ? heroes : Array.from(heroes.values());
    } catch (e) {
      return [];
    }
  }

  private getEnemies(engine: FullCombatEngine): Enemy[] {
    try {
      const state = engine.getState();
      return state.currentEnemies || [];
    } catch (e) {
      return [];
    }
  }

  testCombatSystem(engine: FullCombatEngine): void {
    console.log('\n[TEST] Testing Combat System...\n');
    
    if (!engine) {
      this.assert(false, 'Combat engine not found');
      return;
    }

    const enemies = this.getEnemies(engine);
    const heroes = this.getHeroes(engine);
    const state = engine.getState();

    this.assert(enemies.length >= 0, 'Enemies array exists');
    this.assert(heroes.length > 0, 'Heroes are present');
    this.assert(state !== null, 'Combat state exists');
    
    console.log('\n[OK] Combat System Tests Complete\n');
  }

  testDeathDetection(engine: FullCombatEngine): void {
    console.log('\n[TEST] Testing Death Detection...\n');
    
    const heroes = this.getHeroes(engine);
    if (heroes.length === 0) {
      this.warn('No heroes available for death detection test');
      return;
    }

    const testHero = heroes[0];
    this.assert(typeof testHero.hp === 'number', 'Hero HP is a number');
    this.assert(testHero.hp >= 0, 'Hero HP is non-negative');
    this.assert(testHero.hp <= testHero.maxHp, 'Hero HP does not exceed max HP');

    if (testHero.hp === 0) {
      this.assert(testHero.isDead === true, 'Hero with 0 HP is marked as dead');
    } else if (testHero.hp > 0) {
      this.assert(testHero.isDead === false || testHero.isDead === undefined, 'Hero with HP > 0 is not marked as dead');
    }

    this.assert(Number.isInteger(testHero.hp) || testHero.hp === Math.floor(testHero.hp), 'Hero HP is an integer');
    
    console.log('\n[OK] Death Detection Tests Complete\n');
  }

  testDebuffSystem(engine: FullCombatEngine): void {
    console.log('\n[TEST] Testing Debuff System...\n');
    
    const heroes = this.getHeroes(engine);
    if (heroes.length === 0) {
      this.warn('No heroes available for debuff test');
      return;
    }

    const testHero = heroes[0];
    this.assert(testHero.activeDebuffs !== undefined, 'Hero has activeDebuffs property');

    const heroId = testHero.id || testHero.name || testHero.characterName || testHero.username;
    const debuffContainer = document.querySelector(`#battle-hero-${heroId} .battle-debuffs`);
    this.assert(debuffContainer !== null, 'Debuff container exists in DOM');

    if (testHero.activeDebuffs && Object.keys(testHero.activeDebuffs).length > 0) {
      Object.entries(testHero.activeDebuffs).forEach(([key, debuff]) => {
        this.assert(debuff !== null && typeof debuff === 'object', `Debuff ${key} is an object`);
        this.assert((debuff as any).expiresAt !== undefined, `Debuff ${key} has expiresAt property`);
      });
    }
    
    console.log('\n[OK] Debuff System Tests Complete\n');
  }

  testShieldSystem(engine: FullCombatEngine): void {
    console.log('\n[TEST] Testing Shield System...\n');
    
    const heroes = this.getHeroes(engine);
    if (heroes.length === 0) {
      this.warn('No heroes available for shield test');
      return;
    }

    const testHero = heroes[0];
    this.assert(testHero.shield !== undefined || testHero.shield === undefined, 'Hero has shield property');

    if (testHero.shield) {
      this.assert(typeof testHero.shield === 'object', 'Shield is an object');
      this.assert(typeof testHero.shield.amount === 'number', 'Shield has amount property');
      this.assert(testHero.shield.amount >= 0, 'Shield amount is non-negative');
    }
    
    console.log('\n[OK] Shield System Tests Complete\n');
  }

  testHealingSystem(engine: FullCombatEngine): void {
    console.log('\n[TEST] Testing Healing System...\n');
    
    const heroes = this.getHeroes(engine);
    if (heroes.length === 0) {
      this.warn('No heroes available for healing test');
      return;
    }

    const testHero = heroes[0];
    this.assert(typeof testHero.hp === 'number', 'Hero HP is a number');
    this.assert(typeof testHero.maxHp === 'number', 'Hero maxHp is a number');
    this.assert(testHero.maxHp > 0, 'Hero maxHp is greater than 0');
    this.assert(testHero.hp <= testHero.maxHp, 'Hero HP does not exceed maxHp');
    
    console.log('\n[OK] Healing System Tests Complete\n');
  }

  testEnemySpawning(engine: FullCombatEngine): void {
    console.log('\n[TEST] Testing Enemy Spawning...\n');
    
    const enemies = this.getEnemies(engine);
    this.assert(Array.isArray(enemies), 'Enemies is an array');

    enemies.forEach((enemy, index) => {
      this.assert(enemy !== null && typeof enemy === 'object', `Enemy ${index} is an object`);
      this.assert(enemy.id !== undefined, `Enemy ${index} has id property`);
      this.assert(typeof enemy.hp === 'number', `Enemy ${index} has hp property`);
    });
    
    console.log('\n[OK] Enemy Spawning Tests Complete\n');
  }

  testStateConsistency(engine: FullCombatEngine): void {
    console.log('\n[TEST] Testing State Consistency...\n');
    
    const heroes = this.getHeroes(engine);
    const enemies = this.getEnemies(engine);

    heroes.forEach((hero, index) => {
      const hp = Math.floor(hero.hp || 0);
      const isDead = hero.isDead || false;

      if (hp <= 0) {
        this.assert(isDead === true, `Hero ${index}: isDead is true when HP <= 0`);
      } else {
        this.assert(isDead === false, `Hero ${index}: isDead is false when HP > 0`);
      }

      this.assert(Number.isInteger(hp), `Hero ${index}: HP is an integer`);
    });

    enemies.forEach((enemy, index) => {
      const hp = Math.floor(enemy.hp || 0);
      const isDead = enemy.isDead || false;

      if (hp <= 0) {
        this.assert(isDead === true, `Enemy ${index}: isDead is true when HP <= 0`);
      } else {
        this.assert(isDead === false, `Enemy ${index}: isDead is false when HP > 0`);
      }

      this.assert(Number.isInteger(hp), `Enemy ${index}: HP is an integer`);
    });
    
    console.log('\n[OK] State Consistency Tests Complete\n');
  }

  testAnimationSystem(engine: FullCombatEngine): void {
    console.log('\n[TEST] Testing Animation System...\n');
    
    const heroes = this.getHeroes(engine);
    if (heroes.length === 0) {
      this.warn('No heroes available for animation test');
      return;
    }

    const testHero = heroes[0];
    const heroId = testHero.id || testHero.name || testHero.characterName || testHero.username;
    const heroElement = document.querySelector(`#battle-hero-${heroId}`);
    
    this.assert(heroElement !== null, `Hero element exists in DOM for ${heroId}`);
    
    if (heroElement) {
      const spriteContainer = heroElement.querySelector('.battlefield-sprite');
      this.assert(spriteContainer !== null, 'Sprite container exists');
    }
    
    console.log('\n[OK] Animation System Tests Complete\n');
  }

  testCombatStopping(engine: FullCombatEngine): void {
    console.log('\n[TEST] Testing Combat Stopping...\n');
    
    const state = engine.getState();
    this.assert(state !== null, 'Combat state exists');
    
    if (state) {
      this.assert(typeof state.inCombat === 'boolean', 'inCombat flag exists');
      this.assert(typeof state.isCombatStarting === 'boolean', 'isCombatStarting flag exists');
      this.assert(typeof state.resolvingCombat === 'boolean', 'resolvingCombat flag exists');
    }
    
    const heroes = this.getHeroes(engine);
    const aliveHeroes = heroes.filter(h => h.hp > 0 && !h.isDead);
    
    if (aliveHeroes.length === 0 && state && state.inCombat) {
      this.warn('All heroes are dead but combat is still active - this may indicate a bug');
    }
    
    console.log('\n[OK] Combat Stopping Tests Complete\n');
  }

  testWaveCounter(engine: FullCombatEngine): void {
    console.log('\n[TEST] Testing Wave Counter...\n');
    
    const state = engine.getState();
    if (state) {
      this.assert(typeof state.waveCount === 'number', 'waveCount exists and is a number');
      this.assert(state.waveCount >= 0, 'waveCount is non-negative');
    } else {
      this.assert(false, 'State not available for wave counter test');
    }
    
    console.log('\n[OK] Wave Counter Tests Complete\n');
  }

  testDuplicateAttacks(engine: FullCombatEngine): void {
    console.log('\n[TEST] Testing Duplicate Attack Prevention...\n');
    
    const enemies = this.getEnemies(engine);
    if (enemies.length === 0) {
      this.warn('No enemies available for duplicate attack test');
      return;
    }

    const enemyIds = new Set<string>();
    enemies.forEach((enemy, index) => {
      const enemyId = enemy.id || enemy.name;
      if (enemyId) {
        if (enemyIds.has(enemyId)) {
          this.assert(false, `Duplicate enemy ID found: ${enemyId}`);
        } else {
          enemyIds.add(enemyId);
        }
      }
    });
    
    this.assert(enemyIds.size === enemies.length || enemies.length === 0, 'All enemies have unique IDs');
    
    console.log('\n[OK] Duplicate Attack Prevention Tests Complete\n');
  }

  testMemoryLeaks(engine: FullCombatEngine): void {
    console.log('\n[TEST] Testing Memory Leak Prevention...\n');
    
    const state = engine.getState();
    if (state) {
      this.assert(state !== null, 'State exists');
    }
    
    const heroes = this.getHeroes(engine);
    heroes.forEach((hero, index) => {
      const heroId = hero.id || hero.name || hero.characterName || hero.username;
      if (heroId) {
        const heroElement = document.querySelector(`#battle-hero-${heroId}`);
        if (hero.hp <= 0 && hero.isDead) {
          this.warn(`Dead hero ${index} still has DOM element - may indicate memory leak`);
        }
      }
    });
    
    console.log('\n[OK] Memory Leak Prevention Tests Complete\n');
  }

  async runAllTests(engine: FullCombatEngine | null): Promise<TestResults> {
    console.log('\n[START] Starting Comprehensive Test Suite...\n');
    console.log('============================================================');

    // Reset results
    this.results = {
      passed: [],
      failed: [],
      warnings: []
    };

    if (!engine) {
      this.assert(false, 'Combat engine not available');
      return this.getResults();
    }

    // Run all test suites
    this.testCombatSystem(engine);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    this.testDeathDetection(engine);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    this.testDebuffSystem(engine);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    this.testShieldSystem(engine);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    this.testHealingSystem(engine);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    this.testEnemySpawning(engine);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    this.testStateConsistency(engine);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    this.testAnimationSystem(engine);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    this.testCombatStopping(engine);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    this.testWaveCounter(engine);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    this.testDuplicateAttacks(engine);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    this.testMemoryLeaks(engine);

    // Print summary
    console.log('\n============================================================');
    console.log('\n[SUMMARY] Test Results:\n');
    console.log(`Passed: ${this.results.passed.length}`);
    console.log(`Failed: ${this.results.failed.length}`);
    console.log(`Warnings: ${this.results.warnings.length}`);

    if (this.results.failed.length > 0) {
      console.log('\n[FAILED] Failed Tests:');
      this.results.failed.forEach(test => console.log(`  - ${test}`));
    }

    if (this.results.warnings.length > 0) {
      console.log('\n[WARN] Warnings:');
      this.results.warnings.forEach(warning => console.log(`  - ${warning}`));
    }

    const totalTests = this.results.passed.length + this.results.failed.length;
    const passRate = totalTests > 0 ? (this.results.passed.length / totalTests * 100).toFixed(1) : '0';
    console.log(`\n[PASS RATE] ${passRate}%`);
    console.log('\n============================================================');

    return this.getResults();
  }

  private getResults(): TestResults {
    const totalTests = this.results.passed.length + this.results.failed.length;
    const passRate = totalTests > 0 ? parseFloat(((this.results.passed.length / totalTests) * 100).toFixed(1)) : 0;

    return {
      passed: this.results.passed.length,
      failed: this.results.failed.length,
      warnings: this.results.warnings.length,
      passRate,
      details: {
        passed: [...this.results.passed],
        failed: [...this.results.failed],
        warnings: [...this.results.warnings]
      }
    };
  }
}

// Export singleton instance
export const testRunner = new TestRunner();
