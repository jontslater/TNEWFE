/**
 * Test Helper Functions
 * Functions to trigger specific game mechanics for testing
 */

import { Hero, Enemy, CombatState } from './combat/types';
import { FullCombatEngine } from './fullCombatEngine';
import { generateEnemiesForCombat } from './enemyGeneration';
import { applyDebuff } from './combat/buffsDebuffs';
import { applyHealing, applyShield } from './combat/healing';
import { DEBUFFS, ROLE_CONFIG } from './fullCombatEngine';
import { testLog } from './testLogging';
import { heroElementId } from './combat/enemyAttacks';

/**
 * Test helper interface - provides access to combat engine and state
 */
export interface TestHelperContext {
  combatEngine: FullCombatEngine | null;
  getHeroes: () => Hero[] | FullCombatHero[];
  getEnemies: () => Enemy[] | FullCombatEnemy[];
  getState: () => CombatState | FullCombatState;
}

let testHelperContext: TestHelperContext | null = null;

/**
 * Set the test helper context (called from BrowserSourcePage)
 */
export function setTestHelperContext(context: TestHelperContext) {
  testHelperContext = context;
}

/**
 * Get the test helper context
 */
export function getContext(): TestHelperContext {
  if (!testHelperContext) {
    throw new Error('Test helper context not set. Call setTestHelperContext first.');
  }
  return testHelperContext;
}

/**
 * Spawn a specific enemy type
 */
export function spawnEnemy(enemyName: string, isBoss: boolean = false): Enemy[] {
  try {
    const context = getContext();
    testLog('Enemy', 'Spawn', `Spawning ${enemyName}${isBoss ? ' (BOSS)' : ''}`);
    
    if (!context.combatEngine) {
      testLog('Enemy', 'Spawn', 'Combat engine not available');
      console.error('[Test Helpers] Combat engine not available');
      return [];
    }
    
    const heroes = context.getHeroes();
    
    // Ensure heroes is an array (handle Map or array)
    const heroesArray = Array.isArray(heroes) ? heroes : Array.from(heroes.values());
    
    if (heroesArray.length === 0) {
      testLog('Enemy', 'Spawn', 'No heroes available, cannot spawn enemy');
      console.warn('[Test Helpers] No heroes available, cannot spawn enemy');
      return [];
    }

    // Generate enemies using the enemy generation system
    // generateEnemiesForCombat expects: heroes array, waveCount, difficultyModifier
    const enemies = generateEnemiesForCombat(heroesArray, 1, 1.0);
    
    // Use the combat engine's encounterEnemy method if available, otherwise set directly
    const state = context.getState();
    (state as any).currentEnemies = enemies;
    
    // Trigger combat start
    context.combatEngine.startCombat();
    
    testLog('Enemy', 'Spawn', `Spawned ${enemies.length} enemy/enemies`);
    return enemies;
  } catch (error) {
    console.error('[Test Helpers] Error spawning enemy:', error);
    testLog('Enemy', 'Spawn', `Error: ${error}`);
    return [];
  }
}

/**
 * Spawn a boss enemy
 */
export function spawnBoss(): Enemy[] {
  return spawnEnemy('', true);
}

/**
 * Spawn a pack of 2-3 enemies
 */
export function spawnPack(packSize: number = 2): Enemy[] {
  try {
    const context = getContext();
    testLog('Enemy', 'Spawn Pack', `Spawning pack of ${packSize} enemies`);
    
    if (!context.combatEngine) {
      console.error('[Test Helpers] Combat engine not available');
      return [];
    }
    
    const heroes = context.getHeroes();
    
    // Ensure heroes is an array (handle Map or array)
    const heroesArray = Array.isArray(heroes) ? heroes : Array.from(heroes.values());
    
    if (heroesArray.length === 0) {
      console.warn('[Test Helpers] No heroes available');
      return [];
    }

    // Generate enemies using the enemy generation system
    // generateEnemiesForCombat expects: heroes array, waveCount, difficultyModifier
    // The function handles pack size internally based on waveCount, but we want a specific pack size
    // So we'll generate enemies and adjust the pack size
    // First, generate with a high waveCount to encourage pack spawning
    let enemies = generateEnemiesForCombat(heroesArray, packSize >= 3 ? 51 : packSize >= 2 ? 26 : 1, 1.0);
    
    // If we got fewer enemies than requested, generate more
    while (enemies.length < packSize) {
      const additional = generateEnemiesForCombat(heroesArray, 1, 1.0);
      enemies.push(...additional.slice(0, packSize - enemies.length));
      // Safety break to prevent infinite loop
      if (enemies.length >= packSize) break;
    }
    
    // Trim to desired pack size if we got more
    if (enemies.length > packSize) {
      enemies = enemies.slice(0, packSize);
    }
    
    const state = context.getState();
    (state as any).currentEnemies = enemies;
    context.combatEngine.startCombat();
    
    testLog('Enemy', 'Spawn Pack', `Spawned ${enemies.length} enemies`);
    return enemies;
  } catch (error) {
    console.error('[Test Helpers] Error spawning pack:', error);
    testLog('Enemy', 'Spawn Pack', `Error: ${error}`);
    return [];
  }
}

/**
 * Kill all enemies
 */
export function killAllEnemies(): void {
  try {
    const context = getContext();
    testLog('Combat', 'Kill All Enemies', 'Killing all enemies');
    
    const enemies = context.getEnemies();
    enemies.forEach(enemy => {
      enemy.hp = 0;
      enemy.isDead = true;
    });
    
    testLog('Combat', 'Kill All Enemies', `Killed ${enemies.length} enemies`);
  } catch (error) {
    console.error('[Test Helpers] Error killing enemies:', error);
    testLog('Combat', 'Kill All Enemies', `Error: ${error}`);
  }
}

/**
 * Set hero HP to a specific percentage
 */
export function setHeroHp(heroId: string, hpPercent: number): void {
  try {
    const context = getContext();
    const heroes = context.getHeroes();
    const hero = heroes.find(h => (h.id || h.username || h.name || h.characterName) === heroId);
    
    if (!hero) {
      testLog('Combat', 'Set Hero HP', `Hero not found: ${heroId}`);
      console.warn(`[Test Helpers] Hero not found: ${heroId}`);
      return;
    }
    
    const newHp = Math.floor((hero.maxHp * hpPercent) / 100);
    const oldHp = hero.hp;
    hero.hp = Math.max(0, Math.min(newHp, hero.maxHp));
    
    // If HP dropped to 0, trigger death
    if (hero.hp === 0 && oldHp > 0 && !hero.isDead) {
      hero.isDead = true;
      hero.deathTime = Date.now();
      hero.deathAnimationPlaying = true;
      hero.activeDebuffs = {}; // Clear debuffs on death
      
      // Trigger death animation
      if (context.combatEngine) {
        const formattedHeroId = heroElementId(hero);
        context.combatEngine.triggerAnimationForTest(formattedHeroId, 'death', true);
        testLog('Death', 'Hero Death', `Hero ${heroId} died from HP reduction - triggered death animation`);
      }
    } else if (hero.hp > 0 && hero.isDead) {
      // If HP is above 0 but hero is marked as dead, resurrect
      hero.isDead = false;
      hero.deathTime = undefined;
      hero.deathAnimationPlaying = false;
      
      // Trigger idle animation
      if (context.combatEngine) {
        const formattedHeroId = heroElementId(hero);
        context.combatEngine.triggerAnimationForTest(formattedHeroId, 'idle', true);
        testLog('Resurrection', 'Auto Resurrect', `Hero ${heroId} resurrected from HP increase`);
      }
    } else {
      hero.isDead = hero.hp === 0;
    }
    
    testLog('Combat', 'Set Hero HP', `${heroId}: ${hero.hp}/${hero.maxHp} (${hpPercent}%)`);
  } catch (error) {
    console.error('[Test Helpers] Error setting hero HP:', error);
    testLog('Combat', 'Set Hero HP', `Error: ${error}`);
  }
}

/**
 * Kill a hero
 */
export function killHero(heroId: string): void {
  try {
    const context = getContext();
    testLog('Death', 'Kill Hero', `Killing hero: ${heroId}`);
    
    const heroes = context.getHeroes();
    const hero = heroes.find(h => (h.id || h.username || h.name || h.characterName) === heroId);
    
    if (!hero) {
      testLog('Death', 'Kill Hero', `Hero not found: ${heroId}`);
      console.warn(`[Test Helpers] Hero not found: ${heroId}`);
      return;
    }
    
    // Set HP to 0 and mark as dead
    hero.hp = 0;
    hero.isDead = true;
    hero.deathTime = Date.now();
    hero.deathAnimationPlaying = true;
    hero.activeDebuffs = {}; // Clear debuffs on death
    
    // Trigger death animation using the correct hero ID format
    if (context.combatEngine) {
      const formattedHeroId = heroElementId(hero);
      context.combatEngine.triggerAnimationForTest(formattedHeroId, 'death', true);
      testLog('Death', 'Kill Hero', `Triggered death animation for ${formattedHeroId}`);
    } else {
      testLog('Death', 'Kill Hero', `WARNING: Combat engine not available, cannot trigger death animation`);
    }
    
    testLog('Death', 'Kill Hero', `Killed hero: ${heroId} (HP: ${hero.hp}, isDead: ${hero.isDead})`);
  } catch (error) {
    console.error('[Test Helpers] Error killing hero:', error);
    testLog('Death', 'Kill Hero', `Error: ${error}`);
  }
}

/**
 * Resurrect a hero
 */
export function resurrectHero(heroId: string): void {
  try {
    const context = getContext();
    testLog('Resurrection', 'Resurrect Hero', `Resurrecting hero: ${heroId}`);
    
    const heroes = context.getHeroes();
    const hero = heroes.find(h => (h.id || h.username || h.name || h.characterName) === heroId);
    
    if (!hero) {
      testLog('Resurrection', 'Resurrect Hero', `Hero not found: ${heroId}`);
      console.warn(`[Test Helpers] Hero not found: ${heroId}`);
      return;
    }
    
    hero.hp = Math.floor(hero.maxHp * 0.5); // Resurrect at 50% HP
    hero.isDead = false;
    hero.deathTime = undefined;
    hero.deathAnimationPlaying = false;
    hero.activeDebuffs = {};
    
    // Trigger idle animation
    if (context.combatEngine) {
      const formattedHeroId = heroElementId(hero);
      context.combatEngine.triggerAnimationForTest(formattedHeroId, 'idle', true);
      testLog('Resurrection', 'Resurrect Hero', `Triggered idle animation for ${formattedHeroId}`);
    }
    
    testLog('Resurrection', 'Resurrect Hero', `Resurrected hero: ${heroId} (HP: ${hero.hp}/${hero.maxHp})`);
  } catch (error) {
    console.error('[Test Helpers] Error resurrecting hero:', error);
    testLog('Resurrection', 'Resurrect Hero', `Error: ${error}`);
  }
}

/**
 * Level up a hero
 */
export function levelUpHero(heroId: string): void {
  const context = getContext();
  testLog('Leveling', 'Level Up', `Leveling up hero: ${heroId}`);
  
  const heroes = context.getHeroes();
  const hero = heroes.find(h => (h.id || h.username) === heroId);
  
  if (hero) {
    hero.level = (hero.level || 1) + 1;
    // Recalculate stats based on new level
    const roleConfig = ROLE_CONFIG[hero.role];
    if (roleConfig) {
      hero.maxHp = roleConfig.baseHp + (roleConfig.hpPerLevel * (hero.level - 1));
      hero.attack = roleConfig.baseAttack + (roleConfig.attackPerLevel * (hero.level - 1));
      hero.defense = roleConfig.baseDefense + (roleConfig.defensePerLevel * (hero.level - 1));
      hero.hp = hero.maxHp; // Full heal on level up
    }
  }
}

/**
 * Give gold/tokens to a hero
 */
export function giveGold(heroId: string, amount: number): void {
  const context = getContext();
  testLog('Loot', 'Give Gold', `Giving ${amount} gold to ${heroId}`);
  
  const heroes = context.getHeroes();
  const hero = heroes.find(h => (h.id || h.username) === heroId);
  
  if (hero) {
    hero.gold = (hero.gold || 0) + amount;
  }
}

/**
 * Apply a debuff to a hero
 */
export function applyDebuffToHero(heroId: string, debuffType: keyof typeof DEBUFFS): void {
  const context = getContext();
  testLog('Debuffs', 'Apply Debuff', `Applying ${debuffType} to ${heroId}`);
  
  const heroes = context.getHeroes();
  const hero = heroes.find(h => (h.id || h.username) === heroId);
  
  if (!hero) {
    return;
  }
  
  const debuffDef = DEBUFFS[debuffType];
  if (!debuffDef) {
    testLog('Debuffs', 'Apply Debuff', `Unknown debuff type: ${debuffType}`);
    return;
  }
  
  applyDebuff(
    hero,
    debuffType,
    'Test',
    {
      log: () => {},
      triggerAnimation: () => {},
      triggerHealAnimation: () => {},
      updateEnemyHealthBar: () => {},
      updateHeroUI: () => {}
    }
  );
}

/**
 * Apply a debuff to an enemy
 */
export function applyDebuffToEnemy(enemyId: string, debuffType: keyof typeof DEBUFFS): void {
  const context = getContext();
  testLog('Debuffs', 'Apply Debuff', `Applying ${debuffType} to enemy ${enemyId}`);
  
  const enemies = context.getEnemies();
  const enemy = enemies.find(e => e.id === enemyId);
  
  if (!enemy) {
    return;
  }
  
  const debuffDef = DEBUFFS[debuffType];
  if (!debuffDef) {
    return;
  }
  
  if (!enemy.activeDebuffs) {
    enemy.activeDebuffs = {};
  }
  
  enemy.activeDebuffs[debuffType] = {
    expiresAt: Date.now() + debuffDef.duration,
    appliedBy: 'Test',
    lastTick: Date.now()
  };
}

/**
 * Clear all debuffs from a hero
 */
export function clearHeroDebuffs(heroId: string): void {
  const context = getContext();
  testLog('Debuffs', 'Clear Debuffs', `Clearing debuffs from ${heroId}`);
  
  const heroes = context.getHeroes();
  const hero = heroes.find(h => (h.id || h.username) === heroId);
  
  if (hero) {
    hero.activeDebuffs = {};
  }
}

/**
 * Clear all debuffs from all heroes
 */
export function clearAllDebuffs(): void {
  const context = getContext();
  testLog('Debuffs', 'Clear All Debuffs', 'Clearing all debuffs');
  
  const heroes = context.getHeroes();
  heroes.forEach(hero => {
    if (hero.activeDebuffs) {
      hero.activeDebuffs = {};
    }
  });
  
  const enemies = context.getEnemies();
  enemies.forEach(enemy => {
    if (enemy.activeDebuffs) {
      enemy.activeDebuffs = {};
    }
  });
}

/**
 * Heal a hero by a specific amount
 */
export function healHero(heroId: string, amount: number): void {
  const context = getContext();
  testLog('Healing', 'Heal Hero', `Healing ${heroId} for ${amount} HP`);
  
  const heroes = context.getHeroes();
  const hero = heroes.find(h => (h.id || h.username) === heroId);
  
  if (hero) {
    applyHealing(hero, amount, {
      log: () => {},
      triggerAnimation: () => {},
      triggerHealAnimation: () => {},
      updateEnemyHealthBar: () => {},
      updateHeroUI: () => {}
    });
  }
}

/**
 * Give a shield to a hero
 */
export function giveShield(heroId: string, amount: number, duration: number = 10000): void {
  const context = getContext();
  testLog('Shields', 'Give Shield', `Giving ${amount} shield to ${heroId} for ${duration}ms`);
  
  const heroes = context.getHeroes();
  const hero = heroes.find(h => (h.id || h.username) === heroId);
  
  if (hero) {
    applyShield(hero, amount, duration, 'Test');
  }
}

/**
 * Clear shields from a hero
 */
export function clearShields(heroId: string): void {
  const context = getContext();
  testLog('Shields', 'Clear Shields', `Clearing shields from ${heroId}`);
  
  const heroes = context.getHeroes();
  const hero = heroes.find(h => (h.id || h.username) === heroId);
  
  if (hero) {
    hero.shield = undefined;
  }
}

/**
 * Force next combat round
 */
export function forceCombatRound(): void {
  const context = getContext();
  testLog('Combat', 'Force Round', 'Forcing next combat round');
  
  if (context.combatEngine) {
    // Access the resolveCombat method if available
    // This might need to be exposed from FullCombatEngine
    context.combatEngine.startCombat();
  }
}

/**
 * Start combat
 */
export function startCombat(): void {
  const context = getContext();
  testLog('Combat', 'Start Combat', 'Starting combat');
  
  if (context.combatEngine) {
    context.combatEngine.startCombat();
  }
}

/**
 * Stop combat
 */
export function stopCombat(): void {
  try {
    const context = getContext();
    testLog('Combat', 'Stop Combat', 'Stopping combat');
    
    if (!context.combatEngine) {
      testLog('Combat', 'Stop Combat', 'Combat engine not available');
      console.error('[Test Helpers] Combat engine not available');
      return;
    }
    
    // Stop both combat and adventure loops
    context.combatEngine.stopCombat();
    context.combatEngine.stopAdventure();
    
    testLog('Combat', 'Stop Combat', 'Combat and adventure loops stopped');
    console.log('[Test Helpers] Combat and adventure loops stopped');
  } catch (error) {
    console.error('[Test Helpers] Error stopping combat:', error);
    testLog('Combat', 'Stop Combat', `Error: ${error}`);
  }
}

/**
 * Trigger enemy encounter
 */
export function triggerEnemyEncounter(isBoss: boolean = false): void {
  const context = getContext();
  testLog('Adventure', 'Enemy Encounter', `Triggering ${isBoss ? 'boss' : 'normal'} encounter`);
  
  if (context.combatEngine) {
    // Access adventure engine if available
    // This might need to be exposed from FullCombatEngine
    const state = context.getState();
    if (state.currentEnemies && state.currentEnemies.length === 0) {
      spawnEnemy('', isBoss);
    }
  }
}

/**
 * Trigger treasure find
 */
export function triggerTreasureFind(): void {
  const context = getContext();
  testLog('Adventure', 'Treasure Find', 'Triggering treasure find');
  
  // This would need to be implemented in adventureEngine
  // For now, just log
}

/**
 * Trigger peaceful travel
 */
export function triggerPeacefulTravel(): void {
  const context = getContext();
  testLog('Adventure', 'Peaceful Travel', 'Triggering peaceful travel');
  
  // This would need to be implemented in adventureEngine
  // For now, just log
}

/**
 * Trigger gathering
 */
export function triggerGathering(): void {
  const context = getContext();
  testLog('Adventure', 'Gathering', 'Triggering gathering');
  
  // This would need to be implemented in adventureEngine
  // For now, just log
}

/**
 * Reset all cooldowns for a hero
 */
export function resetCooldowns(heroId: string): void {
  const context = getContext();
  testLog('Abilities', 'Reset Cooldowns', `Resetting cooldowns for ${heroId}`);
  
  const heroes = context.getHeroes();
  const hero = heroes.find(h => (h.id || h.username) === heroId);
  
  if (hero && hero.cooldowns) {
    Object.keys(hero.cooldowns).forEach(key => {
      (hero.cooldowns as any)[key] = 0;
    });
  }
}
