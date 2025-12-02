/**
 * Main Combat Engine Orchestrator
 * Ties together all combat modules to run full combat resolution
 * This is the main entry point for combat processing
 */

import { CombatState, Hero, Enemy, CombatCallbacks, ViewerBonuses, Combatant, DamageAction } from './types';
import { ROLE_CONFIG } from '../fullCombatEngine';
import { calculateInitiative } from './initiative';
import { processEmergencyAbilities } from './emergencyAbilities';
import { processHealerAbilities, processAutoHeal } from './healerAbilities';
import { applyHeroAbilities, applyAtonement } from './heroAbilities';
import { processAoEAbilities, calculateAoEDamage, calculateChainLightning } from './aoeAbilities';
import { processDebuffs, updateHeroBuffDurations, processHpRegeneration } from './buffsDebuffs';
import { calculateHeroDamage } from './damageCalculation';
import { processShields, processShields as checkShields, applyHealing } from './healing';
import { processEnemyAttack, clearActiveEnemyAttacks, getActiveEnemyAttacksCount } from './enemyAttacks';
import { getEnemySpriteType } from '../animationDurations';
import { getAnimationDuration, getHeroSpriteType } from '../animationDurations';
import { testLog } from '../testLogging';

/**
 * Main combat resolution function
 * Orchestrates all combat modules to run a single combat round
 */
export function resolveCombat(
  state: CombatState,
  now: number,
  callbacks: CombatCallbacks,
  getCharacterStats: (hero: Hero) => any,
  calculateSkillBonuses: (hero: Hero) => any,
  applyEnemyDamage: (enemy: Enemy, damage: number) => { died: boolean; actualDamage: number },
  getHeroSpriteType: (role: string) => string,
  getEnemySpriteType: (name: string) => string,
  getAnimationDuration: (spriteType: string, animation: string) => number,
  checkCombatVictory: () => void
): void {
  testLog('Combat', 'Resolve Round', 'Starting combat round resolution');
  
  // CRITICAL: Always clear active enemy attacks at the start of each combat round
  // This ensures enemies can attack once per round and prevents stale entries from previous rounds
  // Even if there are attacks still in progress, we must clear to allow new attacks
  // Any in-flight projectiles will be cancelled by the check in enemyAttacks.ts
  const beforeClear = getActiveEnemyAttacksCount();
  if (beforeClear > 0) {
    testLog('Combat', 'Resolve Round', `WARNING: ${beforeClear} attacks still in progress from previous round. Clearing to start new round.`);
  }
  clearActiveEnemyAttacks();
  
  const heroes = Array.isArray(state.heroes) ? state.heroes : Array.from(state.heroes.values());
  const enemies = state.currentEnemies || [];
  
  testLog('Combat', 'Resolve Round', `Processing round with ${heroes.length} heroes and ${enemies.length} enemies`);

  // Get viewer bonuses
  const viewerCount = state.viewerCount || 0;
  const bonuses: ViewerBonuses = {
    damageMultiplier: 1 + (viewerCount * 0.01),  // 1% per viewer
    healingMultiplier: 1 + (viewerCount * 0.01), // 1% per viewer
    defenseMultiplier: 1 + (viewerCount * 0.005), // 0.5% per viewer
    difficultyModifier: state.difficultyModifier || 1.0
  };

  // ============================================
  // PHASE 1: Process Debuffs (DoT damage)
  // ============================================
  processDebuffs(
    state.heroes,
    enemies,
    now,
    callbacks,
    applyEnemyDamage,
    getHeroSpriteType,
    getEnemySpriteType,
    getAnimationDuration
  );

  // ============================================
  // PHASE 2: Update Buff Durations
  // ============================================
  updateHeroBuffDurations(state.heroes, now);

  // ============================================
  // PHASE 2.5: Process HP Regeneration (HoT from equipment/buffs)
  // ============================================
  processHpRegeneration(state.heroes, now, callbacks);

  // ============================================
  // PHASE 3: Process Shields (expiry)
  // ============================================
  processShields(state.heroes, now);

  // ============================================
  // PHASE 4: Emergency Abilities (Last Stand, Shield Wall, Divine Shield, etc.)
  // ============================================
  processEmergencyAbilities(state.heroes, now, callbacks);

  // ============================================
  // PHASE 5: Healer Abilities (Group Heal, Instant Heal, Combat Res, etc.)
  // ============================================
  heroes.forEach(healer => {
    if (!healer || healer.hp <= 0 || healer.isDead) return;

    const category = ROLE_CONFIG[healer.role]?.category || 'dps';
    if (category === 'healer') {
      processHealerAbilities(
        healer,
        state.heroes,
        enemies,
        now,
        bonuses,
        callbacks,
        calculateSkillBonuses
      );
    }
  });

  // ============================================
  // PHASE 6: Calculate Initiative
  // ============================================
  const combatants = calculateInitiative(
    state.heroes,
    enemies,
    getCharacterStats
  );

  // Sort by initiative (highest first)
  combatants.sort((a, b) => b.initiative - a.initiative);

  // Store initiative order for display
  state.initiativeOrder = combatants.map(c => ({
    type: c.type,
    name: c.type === 'hero' ? c.username! : c.enemy!.name,
    initiative: c.initiative,
    dexterity: c.type === 'hero' ? (c.hero!.dexterity || 0) : (c.dexterity || 0),
    isDead: c.type === 'hero' 
      ? (c.hero!.isDead || c.hero!.hp <= 0)
      : (c.enemy!.isDead || c.enemy!.hp <= 0)
  }));

  // ============================================
  // PHASE 7: Process Hero Actions (in initiative order)
  // ============================================
  const heroCombatants = combatants.filter(c => c.type === 'hero');
  const damageActions: DamageAction[] = [];
  const healers: Array<{username: string; hero: Hero}> = [];

  // CRITICAL: Deduplicate heroes by username to prevent duplicate attacks
  const processedHeroes = new Set<string>();
  const uniqueHeroCombatants = heroCombatants.filter(combatant => {
    const username = combatant.username!;
    if (processedHeroes.has(username)) {
      return false;
    }
    processedHeroes.add(username);
    return true;
  });

  uniqueHeroCombatants.forEach((combatant, idx) => {
    const hero = combatant.hero!;
    const username = combatant.username!;

    if (!hero || hero.hp <= 0 || hero.isDead) {
      return;
    }

    // Check if stunned
    if (hero.activeDebuffs?.stunned) {
      callbacks.log('combat', `💫 ${username} is stunned and cannot act!`);
      return;
    }

    const category = ROLE_CONFIG[hero.role]?.category || 'dps';

    // Healers - process auto-heal first, then attack if not needed
    if (category === 'healer') {
      healers.push({ username, hero });

      // Check if healing is needed
      let needsHealing = false;
      heroes.forEach(h => {
        if (h && h.hp > 0 && !h.isDead && h.hp < h.maxHp * 0.7) {
          needsHealing = true;
        }
      });

      // If healing needed, do auto-heal instead of attack
      if (needsHealing) {
        processAutoHeal(hero, state.heroes, now, bonuses, callbacks, calculateSkillBonuses);
        return; // Skip attack this turn
      }
    }

    // Calculate base damage
    const baseDamage = calculateHeroDamage(
      hero,
      bonuses,
      getCharacterStats,
      calculateSkillBonuses
    );

    // Apply hero abilities
    const abilityResult = applyHeroAbilities(
      hero,
      baseDamage,
      enemies,
      now,
      bonuses,
      callbacks,
      calculateSkillBonuses
    );

    // Check for AoE abilities
    const aoeResult = processAoEAbilities(
      hero,
      enemies,
      abilityResult.modifiedDamage,
      now,
      callbacks
    );

    // Determine if this is AoE
    const isAoE = aoeResult.isAoE || abilityResult.isAoE;

    // Apply Atonement healing if applicable
    if (abilityResult.atonementHeal && abilityResult.atonementTarget) {
      applyAtonement(
        hero,
        abilityResult.modifiedDamage,
        state.heroes,
        now,
        callbacks
      );
    }

    // Apply Holy Strike party healing if applicable
    if (abilityResult.holyStrikeHealing) {
      heroes.forEach(h => {
        if (!h || h.hp <= 0 || h.isDead || h.hp >= h.maxHp) return;

        const partyHeal = Math.floor(abilityResult.holyStrikeHealing! / heroes.length);
        // CRITICAL: Use applyHealing to ensure HP is filled first, then shields from overheal
        const { actualHeal, overhealAmount } = applyHealing(h, partyHeal, now, true);
        
        if (!hero.stats) hero.stats = { totalDamage: 0, totalHealing: 0, damageBlocked: 0 };
        hero.stats.totalHealing += actualHeal;

        callbacks.triggerHealAnimation(h.username);
      });

      callbacks.log('heal', `💚 ${username}'s Holy Strike heals party for ${Math.floor(abilityResult.holyStrikeHealing!)} total HP!`);
    }

    // Smart target selection for multi-enemy encounters
    let targetEnemy: Enemy | null = null;

    if (isAoE) {
      // AoE abilities don't need a specific target
      targetEnemy = null;
    } else {
      // Filter out dead enemies before target selection
      const aliveEnemies = enemies.filter(e => !e.isDead && e.hp > 0);
      
      if (aliveEnemies.length === 0) {
        // No alive enemies - skip this action
        return;
      } else if (aliveEnemies.length === 1) {
        // Single alive enemy - everyone attacks it
        targetEnemy = aliveEnemies[0];
      } else {
        // Multiple enemies - spread attacks
        // Tanks and 50% of DPS focus primary (first) enemy
        // Other DPS target lowest HP enemy
        if (category === 'tank' || Math.random() < 0.5) {
          targetEnemy = aliveEnemies[0]; // Primary target
        } else {
          // Find lowest HP enemy
          let lowestHpEnemy = aliveEnemies[0];
          let lowestHpPercent = 1.0;

          aliveEnemies.forEach(enemy => {
            const hpPercent = enemy.hp / enemy.maxHp;
            if (hpPercent < lowestHpPercent) {
              lowestHpPercent = hpPercent;
              lowestHpEnemy = enemy;
            }
          });

          targetEnemy = lowestHpEnemy;
        }
      }
    }

    const finalDamage = abilityResult.modifiedDamage || baseDamage;
    
    damageActions.push({
      username,
      damage: finalDamage,
      role: hero.role,
      isAoE: isAoE,
      aoeMultiplier: aoeResult.aoeMultiplier || 1.0,
      hero,
      chainLightning: aoeResult.chainLightning || abilityResult.chainLightning,
      stormChain: aoeResult.stormChain || abilityResult.stormChain,
      targetEnemy: targetEnemy,
      initiative: combatant.initiative
    });
  });

  // ============================================
  // PHASE 8: Build Enemy Actions with Initiative
  // ============================================
  interface EnemyAction {
    type: 'enemy';
    enemy: Enemy;
    enemyIndex: number;
    initiative: number;
  }
  
  const enemyActions: EnemyAction[] = [];
  const enemyCombatants = combatants.filter(c => c.type === 'enemy');
  
  // CRITICAL: Deduplicate enemies by ID to prevent duplicate attacks (same as heroes)
  const processedEnemies = new Set<string>();
  const uniqueEnemyCombatants = enemyCombatants.filter(combatant => {
    const enemy = combatant.enemy!;
    if (!enemy) return false;
    const enemyId = enemy.id || enemy.name;
    if (processedEnemies.has(enemyId)) {
      return false;
    }
    processedEnemies.add(enemyId);
    return true;
  });
  
  uniqueEnemyCombatants.forEach(combatant => {
    const enemy = combatant.enemy!;
    if (!enemy || enemy.isDead || enemy.hp <= 0) return;
    
    enemyActions.push({
      type: 'enemy',
      enemy: enemy,
      enemyIndex: enemies.indexOf(enemy),
      initiative: combatant.initiative
    });
  });

  // ============================================
  // PHASE 9: Combine and Sort All Actions by Initiative
  // ============================================
  interface AllAction {
    type: 'hero' | 'enemy';
    initiative: number;
    heroAction?: DamageAction;
    enemyAction?: EnemyAction;
  }
  
  const allActions: AllAction[] = [
    ...damageActions.map(action => ({ type: 'hero' as const, initiative: action.initiative!, heroAction: action })),
    ...enemyActions.map(action => ({ type: 'enemy' as const, initiative: action.initiative, enemyAction: action }))
  ];
  
  // Sort all actions by initiative (highest first) - ensures proper turn order
  allActions.sort((a, b) => b.initiative - a.initiative);

  // ============================================
  // PHASE 10: Execute All Actions in Initiative Order
  // ============================================
  // Match Electron app: Fixed 1500ms delay between actions (game.js line 14726)
  // Process all actions synchronously within each action, animations trigger immediately
  let delay = 0;
  const ACTION_DELAY = 1500; // Fixed delay between actions (matches Electron app)
  
  allActions.forEach((allAction, index) => {
    // Capture delay for this specific action (CRITICAL: capture before incrementing)
    const actionDelay = delay;
    
    // Handle enemy actions
    if (allAction.type === 'enemy') {
      const enemyAction = allAction.enemyAction!;
      const enemy = enemyAction.enemy;
      
      if (!enemy || enemy.isDead || enemy.hp <= 0) {
        // Still increment delay even if enemy is skipped
        delay += ACTION_DELAY;
        return;
      }
      
      // Process enemy attack after delay (matches Electron app)
      setTimeout(() => {
        // CRITICAL: Double-check enemy and heroes are still valid before processing attack
        // This prevents attacks on dead heroes or processing after combat has ended
        if (!enemy || enemy.isDead || enemy.hp <= 0) {
          testLog('Enemy', 'Attack', `${enemy?.name || 'Unknown'} skipped - enemy is dead or invalid`);
          return;
        }
        
        // Verify at least one hero is alive
        const heroesArray = Array.isArray(state.heroes) ? state.heroes : Array.from(state.heroes.values());
        const aliveHeroes = heroesArray.filter(h => h && h.hp > 0 && !h.isDead);
        if (aliveHeroes.length === 0) {
          testLog('Enemy', 'Attack', `${enemy.name} skipped - no alive heroes`);
          return;
        }
        
        const enemyId = enemy.id || enemy.name;
        testLog('Enemy', 'Attack', `Scheduling attack for ${enemy.name} (${enemyId}) after ${actionDelay}ms delay`);
        processEnemyAttack(
          enemy,
          state.heroes,
          now,
          bonuses,
          callbacks,
          calculateSkillBonuses,
          applyEnemyDamage,
          getEnemySpriteType,
          getAnimationDuration
        );
      }, actionDelay);
      
      delay += ACTION_DELAY;
      return;
    }
    
    // Handle hero actions
    const action = allAction.heroAction!;
    const hero = action.hero;
    const username = action.username;

    if (!hero || hero.hp <= 0 || hero.isDead) {
      // Still increment delay even if hero is skipped
      delay += ACTION_DELAY;
      return;
    }

    setTimeout(() => {
      // CRITICAL: Double-check hero is still alive before executing action
      // Hero may have died between scheduling and execution
      if (!hero || hero.hp <= 0 || hero.isDead) {
        return; // Hero is dead, skip action
      }
      
      // Match Electron app: Trigger BOTH attack AND damage animations BEFORE applying damage (line 14690-14692)
      const entityId = hero.id || hero.username || username;
      
      if (action.isAoE) {
        // AoE damage
        // Match Electron app: Trigger attack animation FIRST (line 14500, 14523, 14554)
        callbacks.triggerAnimation(entityId, 'attack', true);
        
        // Track damage
        if (!hero.stats) hero.stats = { totalDamage: 0, totalHealing: 0, damageBlocked: 0 };
        hero.stats.totalDamage += action.damage;

        if (action.chainLightning) {
          // Stormcaller Chain Lightning (line 14498-14520)
          const chainDamage = calculateChainLightning(action.damage, enemies, true);
          chainDamage.forEach(({ enemy, damage }, idx) => {
            if (enemy.isDead || enemy.hp <= 0) return;
            const chainDamageAmount = idx === 0 ? damage * 1.8 : damage * 0.9;
            const result = applyEnemyDamage(enemy, chainDamageAmount);
            callbacks.triggerAnimation(String(enemy.id), 'hurt', false);
            if (callbacks.triggerCombatText && result.actualDamage > 0) {
              callbacks.triggerCombatText(String(enemy.id), result.actualDamage, 'damage', false);
            }
            if (result.died) {
              callbacks.triggerAnimation(String(enemy.id), 'death', false);
              callbacks.log('success', `${enemy.name} is defeated!`);
            }
          });
          callbacks.log('damage', `⛈️ ${username} Chain Lightning hits ${chainDamage.length} enemies!`);
        } else if (action.stormChain) {
          // Storm Warrior Chain Lightning (line 14521-14551)
          enemies.forEach((enemy, idx) => {
            if (enemy.isDead || enemy.hp <= 0) return;
            const chainDamageAmount = idx === 0 ? action.damage * 1.5 : (idx <= 2 ? action.damage * 0.75 : 0);
            if (chainDamageAmount === 0) return;
            const result = applyEnemyDamage(enemy, chainDamageAmount);
            callbacks.triggerAnimation(String(enemy.id), 'hurt', false);
            if (callbacks.triggerCombatText && result.actualDamage > 0) {
              callbacks.triggerCombatText(String(enemy.id), result.actualDamage, 'damage', false);
            }
            if (result.died) {
              callbacks.triggerAnimation(String(enemy.id), 'death', false);
              callbacks.log('success', `${enemy.name} is defeated!`);
            }
          });
          callbacks.log('damage', `⚡ ${username} Chain Lightning hits enemies!`);
        } else {
          // Standard AoE (Whirlwind, Dragon Breath, etc.) (line 14552-14605)
          enemies.forEach((enemy) => {
            if (enemy.isDead || enemy.hp <= 0) return;
            const aoeDamage = action.damage * action.aoeMultiplier;
            const result = applyEnemyDamage(enemy, aoeDamage);
            callbacks.triggerAnimation(String(enemy.id), 'hurt', false);
            if (callbacks.triggerCombatText && result.actualDamage > 0) {
              callbacks.triggerCombatText(String(enemy.id), result.actualDamage, action.isCrit ? 'crit' : 'damage', false);
            }
            if (result.died) {
              callbacks.triggerAnimation(String(enemy.id), 'death', false);
              callbacks.log('success', `${enemy.name} is defeated!`);
            }
          });
          callbacks.log('damage', `${username} AoE hits ${enemies.filter(e => !e.isDead && e.hp > 0).length} enemies for ${Math.floor(action.damage * action.aoeMultiplier)} each!`);
        }
        // Close isAoE block - health bar update happens after each action
        callbacks.updateEnemyHealthBar();
      } else {
        // Single target damage (line 14607-14722)
        let targetEnemy = action.targetEnemy;
        
        // CRITICAL: Verify target enemy still exists in current enemy list
        // Enemies may be replaced between action scheduling and execution
        if (targetEnemy && enemies.length > 0) {
          const currentEnemy = enemies.find(e => e.id === targetEnemy!.id);
          if (currentEnemy) {
            targetEnemy = currentEnemy; // Use current enemy reference
          }
        }
        
        // CRITICAL: Filter out dead enemies and verify target is alive
        // Use fresh filter to get current alive enemies list
        const currentAliveEnemies = enemies.filter(e => !e.isDead && e.hp > 0);
        
        if (!targetEnemy || targetEnemy.isDead || targetEnemy.hp <= 0) {
          // Target died or was replaced, skip
          // Also check if any alive enemies exist - if not, combat may have ended
          if (currentAliveEnemies.length === 0) {
            return; // No alive enemies, combat ended
          }
          return;
        }
        
        // CRITICAL: Verify targetEnemy is in the alive enemies list
        // This ensures we're not attacking a dead enemy that wasn't filtered properly
        const isTargetAlive = currentAliveEnemies.some(e => e.id === targetEnemy!.id);
        if (!isTargetAlive) {
          return; // Target is not in alive enemies list, skip
        }

        // Match Electron app: Trigger BOTH animations BEFORE applying damage (line 14690-14692)
        callbacks.triggerAnimation(entityId, 'attack', true);
        callbacks.triggerAnimation(String(targetEnemy.id), 'hurt', false);
        
        // Track damage
        if (!hero.stats) hero.stats = { totalDamage: 0, totalHealing: 0, damageBlocked: 0 };
        hero.stats.totalDamage += action.damage;

        // Apply damage (line 14695)
        const result = applyEnemyDamage(targetEnemy, action.damage);
        
        // Show combat text (line 14706-14710)
        if (callbacks.triggerCombatText && result.actualDamage > 0) {
          callbacks.triggerCombatText(String(targetEnemy.id), result.actualDamage, action.isCrit ? 'crit' : 'damage', false);
        }

        if (result.died) {
          callbacks.triggerAnimation(String(targetEnemy.id), 'death', false);
          callbacks.log('success', `${targetEnemy.name} is defeated!`);
        } else {
          callbacks.log('damage', `${username} hits ${targetEnemy.name} for ${Math.floor(result.actualDamage)} damage`);
        }
        
        // Match Electron app: Update health bar after EACH action (line 14724)
        callbacks.updateEnemyHealthBar();
      }
    }, actionDelay); // Use captured delay, not the incremented one
    
    delay += ACTION_DELAY;
  });

  // ============================================
  // PHASE 11: Wait for All Actions to Complete, Then Check Victory
  // ============================================
  // Match Electron app: Fixed delay = allActions.length * 1500 + 500 (game.js line 14731-14738)
  const victoryCheckDelay = allActions.length * ACTION_DELAY + 500;
  
  setTimeout(() => {
    // Always call checkCombatVictory - it will handle victory or continuing combat
    // CRITICAL: checkCombatVictory() must be called even when enemies are alive
    // so it can call startCombat() again to continue the loop
    // It will also filter dead enemies internally
    checkCombatVictory();
    
    // Update UI after checking victory
    callbacks.updateEnemyHealthBar();
    callbacks.updateHeroUI();
  }, victoryCheckDelay);
  
  // Also update UI immediately (for responsiveness)
  callbacks.updateEnemyHealthBar();
  callbacks.updateHeroUI();
}

/**
 * Start combat - initialize combat state
 */
export function startCombat(
  state: CombatState,
  heroes: Hero[] | Map<string, Hero>,
  enemies: Enemy[],
  callbacks: CombatCallbacks
): void {
  state.heroes = heroes;
  state.currentEnemies = enemies;
  state.combatAnimationActive = true;

  // Ensure callbacks.log exists before calling it
  if (callbacks && typeof callbacks.log === 'function') {
    callbacks.log('combat', 'Combat started!');
  }
  
  if (callbacks && typeof callbacks.updateHeroUI === 'function') {
    callbacks.updateHeroUI();
  }
}

/**
 * Process a single combat tick
 */
export function processCombatTick(
  state: CombatState,
  callbacks: CombatCallbacks,
  getCharacterStats: (hero: Hero) => any,
  calculateSkillBonuses: (hero: Hero) => any,
  applyEnemyDamage: (enemy: Enemy, damage: number) => { died: boolean; actualDamage: number },
  getHeroSpriteType: (role: string) => string,
  getEnemySpriteType: (name: string) => string,
  getAnimationDuration: (spriteType: string, animation: string) => number,
  checkCombatVictory: () => void
): void {
  if (state.isPaused) {
    return;
  }

  const now = Date.now();

  // Run combat resolution
  resolveCombat(
    state,
    now,
    callbacks,
    getCharacterStats,
    calculateSkillBonuses,
    applyEnemyDamage,
    getHeroSpriteType,
    getEnemySpriteType,
    getAnimationDuration,
    checkCombatVictory
  );
}
