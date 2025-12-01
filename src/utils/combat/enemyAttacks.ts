/**
 * Enemy Attack Processing
 * Handles all enemy attack logic:
 * - Threat-based targeting
 * - Damage calculation
 * - Defensive abilities (Last Stand, Iron Skin, Divine Shield, Evasion, Shield Wall)
 * - Intercept mechanics
 * - Debuff application
 * - Bloodlust double attacks
 * - Shield absorption
 * - Thorns reflection
 * 
 * DEBUG MODE: Disable hero damage during enemy animation testing
 * Settings are controlled via the debug UI at /browser-source/debug
 * Reads from localStorage: 'enemyDebugSettings'
 */
import { Hero, Enemy, CombatCallbacks, ViewerBonuses } from './types';
import { ROLE_CONFIG } from '../fullCombatEngine';
import { applyDebuff } from './buffsDebuffs';
import { absorbShieldDamage } from './healing';
import { hasEmergencyAbility } from './emergencyAbilities';
import { testLog } from '../testLogging';

/**
 * DEBUG MODE: Disable hero damage during enemy animation testing
 * Settings are controlled via the debug UI at /browser-source/debug
 * Reads from localStorage: 'enemyDebugSettings'
 */
function getDebugDisableHeroDamage(): boolean {
  try {
    const saved = localStorage.getItem('enemyDebugSettings');
    if (saved) {
      const settings = JSON.parse(saved);
      return settings.disableHeroDamage === true; // Only disable if explicitly set to true
    }
  } catch (e) {
    // Failed to read debug settings
  }
  return false; // Default to false - hero damage is ENABLED by default
}
import { ENEMY_SPRITES } from '../enemySpriteConfig';
import { createProjectile } from '../projectiles';

// Track active enemy attacks to prevent duplicates (e.g., multiple projectiles from same enemy)
// This Set is cleared at the start of each combat round to allow enemies to attack again
const activeEnemyAttacks = new Set<string>();

/**
 * Clear active enemy attacks tracking - called at the start of each combat round
 * This ensures enemies can attack once per round
 */
export function clearActiveEnemyAttacks() {
  const count = activeEnemyAttacks.size;
  activeEnemyAttacks.clear();
  if (count > 0) {
    testLog('Enemy', 'Attack Tracking', `Cleared ${count} entries from activeEnemyAttacks (some attacks may have been in progress)`);
  }
}

/**
 * Get count of active enemy attacks (for debugging)
 */
export function getActiveEnemyAttacksCount(): number {
  return activeEnemyAttacks.size;
}

/**
 * ID resolution helpers - match DOM element IDs
 * DOM uses: battle-enemy-<id> and battle-hero-<id>
 */
function enemyElementId(enemy: Enemy | { id: any }): string {
  return `battle-enemy-${enemy.id}`;
}

export function heroElementId(heroOrTarget: Hero | { hero: Hero; username: string } | string | { id?: any; username?: any; name?: any; characterName?: any }): string {
  // Handle different input types
  if (typeof heroOrTarget === 'string') {
    // If already in battle-hero- format, return as-is
    if (heroOrTarget.startsWith('battle-hero-')) {
      return heroOrTarget;
    }
    // Otherwise prepend battle-hero- prefix
    return `battle-hero-${heroOrTarget}`;
  }
  
  let heroId: string = '';
  
  if ('hero' in heroOrTarget) {
    // Target object with hero property
    // CRITICAL: Match sprite container ID format: hero.id || hero.name || hero.characterName
    // This ensures the animation callback can find the hero correctly
    // Sprite container uses: id={`battle-hero-${heroId}`} where heroId = hero.id || hero.name || hero.characterName
    const hero = heroOrTarget.hero;
    heroId = hero.id || hero.name || hero.characterName || hero.username || heroOrTarget.username || '';
  } else {
    // Direct hero object or object with id/name/characterName properties
    if ('id' in heroOrTarget || 'name' in heroOrTarget || 'characterName' in heroOrTarget) {
      // Object with id/name/characterName (e.g., { id: '...', username: '...' })
      const obj = heroOrTarget as { id?: any; name?: any; characterName?: any; username?: any };
      heroId = obj.id || obj.name || obj.characterName || obj.username || '';
    } else {
      // Direct hero object
      const hero = heroOrTarget as Hero;
      heroId = hero.id || hero.name || hero.characterName || hero.username || '';
    }
  }
  
  // Return in battle-hero-{id} format to match DOM element IDs
  if (heroId && !heroId.startsWith('battle-hero-')) {
    return `battle-hero-${heroId}`;
  }
  
  return heroId || '';
}

/**
 * Process a single enemy attack
 */
export function processEnemyAttack(
  enemy: Enemy,
  heroes: Hero[] | Map<string, Hero>,
  now: number,
  bonuses: ViewerBonuses,
  callbacks: CombatCallbacks,
  calculateSkillBonuses: (hero: Hero) => any,
  applyEnemyDamage: (enemy: Enemy, damage: number) => { died: boolean; actualDamage: number },
  getEnemySpriteType: (name: string) => string,
  getAnimationDuration: (spriteType: string, animation: string) => number
): Promise<void> {
  // CRITICAL: Prevent duplicate attacks from the same enemy
  // Use enemy.id as the key to track active attacks (must be consistent with combatEngine.ts deduplication)
  const enemyId = enemy.id || enemy.name;
  
  // Double-check: if already in Set, skip immediately
  if (activeEnemyAttacks.has(enemyId)) {
    testLog('Enemy', 'Attack', `${enemy.name} (${enemyId}) already attacking, skipping duplicate`);
    return Promise.resolve();
  }
  
  // Add to Set BEFORE any async operations to prevent race conditions
  activeEnemyAttacks.add(enemyId);
  testLog('Enemy', 'Attack', `${enemy.name} (${enemyId}) starting attack - added to activeEnemyAttacks`);
  
  // Cleanup function to remove from active attacks
  const cleanup = () => {
    activeEnemyAttacks.delete(enemyId);
  };
  
  if (!enemy || enemy.isDead || enemy.hp <= 0) {
    cleanup();
    return Promise.resolve();
  }
  
  // CRITICAL: Verify at least one hero is alive before processing attack
  // This prevents attacks when all heroes are dead (waiting for resurrection)
  const heroesArray = Array.isArray(heroes) ? heroes : Array.from(heroes.values());
  const aliveHeroes = heroesArray.filter(h => h && h.hp > 0 && !h.isDead);
  
  if (aliveHeroes.length === 0) {
    cleanup();
    return Promise.resolve();
  }
  
  let enemyDamage = enemy.attack + Math.floor(Math.random() * (enemy.attack * 0.2));

  // Check for enemy debuffs affecting attack
  if (enemy.activeDebuffs?.weaken) {
    enemyDamage *= 0.7; // 30% reduction
  }

  // Apply difficulty modifier to base enemy damage
  // Difficulty < 100% reduces damage, > 100% increases damage
  const difficultyModifier = bonuses.difficultyModifier || 1.0;
  enemyDamage = Math.floor(enemyDamage * difficultyModifier);

  // ENEMY ABILITIES (Difficulty > 100%)
  let isCrit = false;
  let isBloodlust = false;

  // Note: difficultyModifier already applied to base damage above
  if (enemy.abilities && difficultyModifier > 1.0) {
    if (enemy.abilities.critChance && Math.random() < enemy.abilities.critChance) {
      isCrit = true;
      enemyDamage *= 2.0;
      callbacks.log('combat', `💥 ${enemy.name} CRITICAL STRIKE!`);
    }

    if (enemy.abilities.enrageActive && now < (enemy.abilities.enrageExpiry || 0)) {
      enemyDamage *= 1.4;
      if (!isCrit) {
        callbacks.log('combat', `⚔️💥 ${enemy.name} is ENRAGED! (+40% damage)`);
      }
    } else if (enemy.abilities.enrageActive && now >= (enemy.abilities.enrageExpiry || 0)) {
      enemy.abilities.enrageActive = false;
    }

    const timeSinceLastBloodlust = now - (enemy.abilities.lastBloodlustCheck || 0);
    if (enemy.abilities.bloodlustChance && 
        timeSinceLastBloodlust > 5000 &&
        Math.random() < enemy.abilities.bloodlustChance) {
      isBloodlust = true;
      enemy.abilities.lastBloodlustCheck = now;
      callbacks.log('combat', `🩸 ${enemy.name} BLOODLUST! (attacking twice!)`);
    }
  }

  // Categorize alive heroes for targeting
  const aliveTanks: Array<{username: string; hero: Hero}> = [];
  const aliveDPS: Array<{username: string; hero: Hero}> = [];
  const aliveHealers: Array<{username: string; hero: Hero}> = [];

  heroesArray.forEach(hero => {
    // CRITICAL: Double-check hero is alive and not dead (handles resurrection edge cases)
    if (!hero || hero.hp <= 0 || hero.isDead || !hero.hp) return;

    const category = ROLE_CONFIG[hero.role]?.category || 'dps';
    if (category === 'tank') {
      aliveTanks.push({ username: hero.username, hero });
    } else if (category === 'healer') {
      aliveHealers.push({ username: hero.username, hero });
    } else {
      aliveDPS.push({ username: hero.username, hero });
    }
  });

  // Determine target based on threat
  const weightedTargets: Array<{username: string; hero: Hero; threat: number}> = [];
  aliveTanks.forEach(tank => {
    const threat = (tank.hero.activeThreatMod || 1.0) * 20;
    weightedTargets.push({ ...tank, threat });
  });
  aliveDPS.forEach(dps => {
    const threat = (dps.hero.activeThreatMod || 1.0) * 1;
    weightedTargets.push({ ...dps, threat });
  });
  aliveHealers.forEach(healer => {
    const threat = (healer.hero.activeThreatMod || 1.0) * 0.3;
    weightedTargets.push({ ...healer, threat });
  });

  const totalThreat = weightedTargets.reduce((sum, t) => sum + t.threat, 0);
  let target: {username: string; hero: Hero} | null = null;
  
  if (totalThreat > 0) {
    const rand = Math.random() * totalThreat;
    let cumulative = 0;
    for (const tgt of weightedTargets) {
      cumulative += tgt.threat;
      if (rand <= cumulative) {
        target = tgt;
        break;
      }
    }
  }

  if (!target) {
    const allAlive = [...aliveTanks, ...aliveDPS, ...aliveHealers];
    if (allAlive.length > 0) {
      target = allAlive[0];
    }
  }

  if (!target) {
    cleanup();
    return Promise.resolve(); // No valid target
  }

  let category = ROLE_CONFIG[target.hero.role]?.category || 'dps';

  // Check for INTERCEPT
  if (category !== 'tank') {
    let interceptingTank: {username: string; hero: Hero} | null = null;
    heroesArray.forEach(hero => {
      const heroCategory = ROLE_CONFIG[hero.role]?.category || 'dps';
      if (heroCategory === 'tank' && 
          hero.hp > 0 && 
          !hero.isDead &&
          hero.classAbilityState?.interceptActive &&
          now < (hero.classAbilityState.interceptExpiry || 0)) {
        interceptingTank = { username: hero.username, hero };
      }
    });

    if (interceptingTank) {
      callbacks.log('combat', `🛡️ ${interceptingTank.username} INTERCEPTS the attack on ${target.username}!`);
      target = interceptingTank;
      category = 'tank';
    }
  }

  // Calculate effective defense
  let effectiveDefense = category === 'tank' 
    ? target.hero.defense * bonuses.defenseMultiplier 
    : target.hero.defense;

  if (target.hero.activeBuffs?.defenseMultiplier && target.hero.activeBuffs.defenseMultiplier.remainingDuration > 0) {
    effectiveDefense = Math.floor(effectiveDefense * target.hero.activeBuffs.defenseMultiplier.value);
  }

  // Apply skill defense multipliers
  const skillBonuses = calculateSkillBonuses(target.hero);
  if (skillBonuses.defenseMultiplier > 0) {
    effectiveDefense = Math.floor(effectiveDefense * (1 + skillBonuses.defenseMultiplier / 100));
  }

  // Check for debuffs/buffs
  let damageMultiplier = 1.0;
  if (target.hero.activeDebuffs?.vulnerable) {
    damageMultiplier = 1.4;
  }

  // Check defensive abilities
  const ironSkinActive = category === 'tank' && target.hero.activeProcBuffs?.ironSkin && now < (target.hero.activeProcBuffs.ironSkin || 0);
  const lastStandActive = category === 'tank' && target.hero.lastStandActive === true;
  const divineShieldActive = hasEmergencyAbility(target.hero, 'divineShield', now);
  const evasionActive = hasEmergencyAbility(target.hero, 'evasion', now) && Math.random() < 0.5;

  // Check for Shield Wall (Guardian party-wide buff)
  let shieldWallActive = false;
  heroesArray.forEach(hero => {
    if (hero && hero.role === 'guardian' && hasEmergencyAbility(hero, 'shieldWall', now)) {
      shieldWallActive = true;
    }
  });

  // Divine Shield = full immunity
  if (divineShieldActive) {
    callbacks.log('combat', `✨ ${target.username} is IMMUNE! (Divine Shield)`);
    return Promise.resolve();
  }

  // Evasion = dodge
  if (evasionActive) {
    callbacks.log('combat', `⚡ ${target.username} DODGES ${enemy.name}'s attack!`);
    return Promise.resolve();
  }

  // Simple enemy attack flow:
  // 1. Enemy animates attack (or projectile if available)
  // 2. If projectile, create moving projectile element
  // 3. Target animates hurt when projectile hits (or immediately for melee)
  // 4. Apply damage immediately
  // 5. Show combat text
  
  // Check if enemy has projectile animations (Baby Dragon, Witch, etc.)
  const enemyConfig = ENEMY_SPRITES[enemy.name];
  const hasProjectile = enemyConfig?.animations?.projectile || enemyConfig?.animations?.projectileDiagonal;
  
  if (hasProjectile) {
    // CRITICAL: Enemy should animate "attack", not "projectile"
    // The projectile is a separate visual element that moves from enemy to target
    callbacks.triggerAnimation(enemyElementId(enemy), 'attack', false);
    
    // Get projectile type for the separate projectile element
    // Prefer horizontal projectile over diagonal
    const projectileType = enemyConfig.animations.projectile ? 'projectile' : 'projectileDiagonal';
    
    // Calculate delay for projectile launch (synchronize with attack animation)
    // Projectile should fire when the attack animation reaches the launch frame
    // Typically this is around 50-60% through the attack animation
    const spriteType = getEnemySpriteType(enemy.name);
    const attackDuration = getAnimationDuration(spriteType, 'attack', enemy.name, enemyConfig);
    // For Baby Dragon (720ms attack per animationDurations.ts, but 1080ms in spriteAnimationData.ts)
    // For Skeleton Mage (1080ms attack per animationDurations.ts, but 1620ms in spriteAnimationData.ts)
    // Use 50% of attack duration to match the visual launch frame
    const projectileLaunchDelay = Math.floor(attackDuration * 0.5);
    
    // Create moving projectile from attacker to target
    // Find attacker and target DOM elements
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const attackerElement = document.getElementById(`battle-enemy-${enemy.id}`);
        const targetElement = document.getElementById(`battle-hero-${target.hero.id || target.username}`);
        
        if (attackerElement && targetElement) {
          // CRITICAL: Keep enemy in activeEnemyAttacks during projectile flight
          // Only remove when projectile hits and damage is applied
          // This prevents multiple projectiles from the same enemy in the same round
          createProjectile(
            attackerElement,
            targetElement,
            enemy.name, // Pass enemy name to get animation data
            projectileType, // projectileType for enemies
            () => {
              // When projectile reaches target, trigger hurt and apply damage
              callbacks.triggerAnimation(heroElementId(target), 'hurt', true);
              
              applyEnemyDamageToHero(
                target!,
                enemy,
                enemyDamage,
                effectiveDefense,
                damageMultiplier,
                {
                  ironSkinActive,
                  lastStandActive,
                  shieldWallActive,
                  isCrit,
                  isBloodlust: false, // Don't trigger bloodlust here - handle it separately
                  now
                },
                heroesArray,
                bonuses,
                callbacks,
                calculateSkillBonuses,
                applyEnemyDamage,
                getEnemySpriteType,
                getAnimationDuration
              );
              
              // CRITICAL: Clean up attack tracking when projectile hits and damage is applied
              // This prevents duplicate attacks from being processed while projectile is in flight
              // The enemy stays in activeEnemyAttacks during flight to prevent multiple projectiles
              cleanup();
            }
          ).then(() => {
            // After first attack completes, handle bloodlust if applicable
            if (isBloodlust && enemy.abilities && !enemy.isDead && enemy.hp > 0 && !target.hero.isDead && target.hero.hp > 0) {
              return handleBloodlustAttack(
                target,
                enemy,
                enemyDamage,
                effectiveDefense,
                damageMultiplier,
                {
                  ironSkinActive,
                  lastStandActive,
                  shieldWallActive,
                  now
                },
                heroesArray,
                bonuses,
                callbacks,
                calculateSkillBonuses,
                applyEnemyDamage,
                getEnemySpriteType,
                getAnimationDuration
              );
            }
            return Promise.resolve();
          }).then(() => {
            // Cleanup already called in projectile onComplete callback when damage is applied
            // Only resolve here - don't call cleanup again
            resolve();
          });
        } else {
          // Fallback: apply damage immediately if elements not found
          callbacks.triggerAnimation(heroElementId(target), 'hurt', true);
          applyEnemyDamageToHero(
            target!,
            enemy,
            enemyDamage,
            effectiveDefense,
            damageMultiplier,
            {
              ironSkinActive,
              lastStandActive,
              shieldWallActive,
              isCrit,
              isBloodlust: false, // Don't trigger bloodlust here - handle it separately
              now
            },
            heroesArray,
            bonuses,
            callbacks,
            calculateSkillBonuses,
            applyEnemyDamage,
            getEnemySpriteType,
            getAnimationDuration
          );
          
          // Handle bloodlust for fallback case
          if (isBloodlust && enemy.abilities && !enemy.isDead && enemy.hp > 0 && !target.hero.isDead && target.hero.hp > 0) {
            handleBloodlustAttack(
              target,
              enemy,
              enemyDamage,
              effectiveDefense,
              damageMultiplier,
              {
                ironSkinActive,
                lastStandActive,
                shieldWallActive,
                now
              },
              heroesArray,
              bonuses,
              callbacks,
              calculateSkillBonuses,
              applyEnemyDamage,
              getEnemySpriteType,
              getAnimationDuration
            ).then(() => {
              cleanup();
              resolve();
            });
          } else {
            cleanup();
            resolve();
          }
        }
      }, 100); // Small delay to ensure DOM elements exist
    });
  } else {
    // Regular melee attack - immediate damage
    callbacks.triggerAnimation(enemyElementId(enemy), 'attack', false);
    
    // Apply damage immediately
    applyEnemyDamageToHero(
      target!,
      enemy,
      enemyDamage,
      effectiveDefense,
      damageMultiplier,
      {
        ironSkinActive,
        lastStandActive,
        shieldWallActive,
        isCrit,
        isBloodlust: false, // Don't trigger bloodlust here - handle it separately
        now
      },
      heroesArray,
      callbacks,
      calculateSkillBonuses,
      applyEnemyDamage,
      getEnemySpriteType,
      getAnimationDuration
    );
    
    // Wait for attack animation to complete before resolving
    const spriteType = getEnemySpriteType(enemy.name);
    const attackDuration = getAnimationDuration(spriteType, 'attack');
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        // After first attack completes, handle bloodlust if applicable
        if (isBloodlust && enemy.abilities && !enemy.isDead && enemy.hp > 0 && !target.hero.isDead && target.hero.hp > 0) {
          handleBloodlustAttack(
            target,
            enemy,
            enemyDamage,
            effectiveDefense,
            damageMultiplier,
            {
              ironSkinActive,
              lastStandActive,
              shieldWallActive,
              now
            },
            heroesArray,
            bonuses,
            callbacks,
            calculateSkillBonuses,
            applyEnemyDamage,
            getEnemySpriteType,
            getAnimationDuration
          ).then(() => {
            cleanup();
            resolve();
          });
        } else {
          cleanup();
          resolve();
        }
      }, attackDuration);
    });
  }
  
  // NOTE: Damage is already applied above in the if/else blocks
  // No need to apply again here - this was causing double damage!
}

/**
 * Apply enemy damage to hero (helper function)
 */
function applyEnemyDamageToHero(
  target: {username: string; hero: Hero},
  enemy: Enemy,
  enemyDamage: number,
  effectiveDefense: number,
  damageMultiplier: number,
  options: {
    ironSkinActive: boolean;
    lastStandActive: boolean;
    shieldWallActive: boolean;
    isCrit: boolean;
    isBloodlust: boolean;
    now: number;
  },
  heroesArray: Hero[],
  bonuses: ViewerBonuses,
  callbacks: CombatCallbacks,
  calculateSkillBonuses: (hero: Hero) => any,
  applyEnemyDamage: (enemy: Enemy, damage: number) => { died: boolean; actualDamage: number },
  getEnemySpriteType: (name: string) => string,
  getAnimationDuration: (spriteType: string, animation: string) => number
): void {
  const { ironSkinActive, lastStandActive, shieldWallActive, isCrit, isBloodlust, now } = options;
  const category = ROLE_CONFIG[target.hero.role]?.category || 'dps';

  let actualDamage = Math.max(1, enemyDamage - effectiveDefense);
  actualDamage = Math.floor(actualDamage * damageMultiplier);

  // Apply skill defense multipliers (additional damage reduction)
  const targetSkillBonuses = calculateSkillBonuses(target.hero);
  if (targetSkillBonuses.defenseMultiplier > 0) {
    actualDamage = Math.floor(actualDamage / (1 + targetSkillBonuses.defenseMultiplier / 100));
  }

  // Apply armor enchantment thorns effects BEFORE damage reductions
  if (target.hero.enchantedItems && target.hero.equipment) {
    const equipment = target.hero.equipment;
    const armorSlots = ['armor', 'helm', 'cloak', 'gloves', 'boots', 'shield'];

    armorSlots.forEach(slot => {
      const item = equipment[slot];
      if (!item) return;

      const itemEnchantments = target.hero.enchantedItems!.find((ei: any) => ei.itemId === item.id);
      if (!itemEnchantments || !itemEnchantments.enchantments) return;

      itemEnchantments.enchantments.forEach((ench: any) => {
        const value = (ench.baseValue || 5) * (ench.level || 1);

        if (ench.type === 'thorns_armor') {
          // Reflect damage back to attacker
          const thornsDamage = Math.floor(actualDamage * (value / 100));
          const result = applyEnemyDamage(enemy, thornsDamage);
          callbacks.triggerAnimation(enemyElementId(enemy), 'hurt', false);
          callbacks.log('damage', `🌿 ${target.username}'s Thorns Armor reflects ${Math.floor(result.actualDamage)} damage to ${enemy.name}!`);
          if (result.died) {
            callbacks.log('success', `${enemy.name} is defeated!`);
          }
        } else if (ench.type === 'frozen_armor') {
          // Slow the attacker
          if (!enemy.activeDebuffs) enemy.activeDebuffs = {};
          enemy.activeDebuffs.slowed = {
            expiresAt: now + 3000, // 3 seconds
            appliedBy: target.username,
            value: value // Slow percentage
          };
          callbacks.log('combat', `❄️ ${target.username}'s Frozen Armor slows ${enemy.name}!`);
        }
      });
    });
  }

  // Apply damage reductions
  if (lastStandActive) {
    actualDamage = Math.floor(actualDamage * 0.25);
    callbacks.log('combat', `🛡️💥 ${target.username} LAST STAND absorbs massive damage!`);
  } else if (ironSkinActive) {
    actualDamage = Math.floor(actualDamage * 0.5);
    callbacks.log('combat', `💎 ${target.username} IRON SKIN blocks damage!`);
  }

  if (shieldWallActive) {
    actualDamage = Math.floor(actualDamage * 0.7);
  }

  // Apply debuff chance
  const debuffChance = enemy.isBoss ? 0.4 : 0.2;
  if (Math.random() < debuffChance) {
    const debuffOptions = ['bleed', 'cursed', 'weaken'];
    if (enemy.isBoss && Math.random() < 0.3) {
      debuffOptions.push('stunned');
    }
    const debuffChoice = debuffOptions[Math.floor(Math.random() * debuffOptions.length)];
    applyDebuff(target.hero, debuffChoice, enemy.name, undefined, callbacks);
  }

  // Track big hits for Shield Guardian
  if (target.hero.role === 'guardian' && actualDamage >= target.hero.maxHp * 0.4) {
    target.hero.lastBigHit = now;
  }

  actualDamage = Math.max(3, actualDamage);

  // Damage cap
  const maxDamagePerHit = Math.floor(target.hero.maxHp * 0.35);
  if (actualDamage > maxDamagePerHit) {
    actualDamage = maxDamagePerHit;
  }

  // Apply inverse difficulty scaling to hero damage taken
  // Difficulty < 100% (0.5) → heroes take 2x damage (harder)
  // Difficulty 100% (1.0) → heroes take 1x damage (normal)
  // Difficulty > 100% (1.5) → heroes take 0.67x damage (easier)
  // This is applied AFTER all other damage reductions but BEFORE shield absorption
  const difficultyModifier = bonuses.difficultyModifier || 1.0;
  if (difficultyModifier > 0) {
    actualDamage = Math.floor(actualDamage / difficultyModifier);
  }

  // DEBUG MODE: Disable hero damage during enemy animation testing
  const DEBUG_DISABLE_HERO_DAMAGE = getDebugDisableHeroDamage();
  if (DEBUG_DISABLE_HERO_DAMAGE) {
    // Still show combat text and animations, but don't reduce HP
    // Use consistent ID resolution helper to match DOM element format
    const heroId = heroElementId(target);
    if (callbacks.triggerCombatText) {
      callbacks.triggerCombatText(heroId, actualDamage, isCrit ? 'crit' : 'damage', true);
    }
    if (callbacks.triggerAnimation) {
      callbacks.triggerAnimation(heroId, 'hurt', true);
    }
    return; // Exit early without applying damage
  }

  // Shield absorption
  const shieldResult = absorbShieldDamage(target.hero, actualDamage);
  actualDamage = shieldResult.remainingDamage;

  if (shieldResult.absorbed > 0) {
    callbacks.log('combat', `💙 ${target.username}'s shield absorbs ${Math.floor(shieldResult.absorbed)} damage!`);
  }

  // Apply damage
  // CRITICAL: Match Electron app - explicitly set HP to 0 if it goes below 0
  if (target.hero.role === 'brewmaster') {
    const immediateDamage = Math.floor(actualDamage * 0.4);
    const staggeredDamage = actualDamage - immediateDamage;
    target.hero.hp = Math.max(0, target.hero.hp - immediateDamage); // Clamp to 0 minimum
    if (target.hero.hp < 0) {
      target.hero.hp = 0; // Explicitly set to 0 if negative (matches Electron app line 11922)
    }
    target.hero.hp = Math.floor(target.hero.hp); // CRITICAL: Floor HP to ensure integer
    if (!target.hero.staggerDoT) target.hero.staggerDoT = 0;
    target.hero.staggerDoT += staggeredDamage;
    callbacks.log('combat', `🍺 ${target.username} staggers ${Math.floor(staggeredDamage)} damage over 8s`);
  } else {
    target.hero.hp = Math.max(0, target.hero.hp - actualDamage); // Clamp to 0 minimum
    if (target.hero.hp < 0) {
      target.hero.hp = 0; // Explicitly set to 0 if negative (matches Electron app line 11922)
    }
    target.hero.hp = Math.floor(target.hero.hp); // CRITICAL: Floor HP to ensure integer
  }

  // Use consistent ID resolution helper
  const heroId = heroElementId(target);
  callbacks.triggerAnimation(heroId, 'hurt', true);
  
  // Show combat text - use same ID resolution to match sprite container ID
  if (callbacks.triggerCombatText && actualDamage > 0) {
    callbacks.triggerCombatText(heroId, actualDamage, isCrit ? 'crit' : 'damage', true);
  }

  // Warden thorns
  if (target.hero.role === 'warden' && actualDamage > 0) {
    const thornsDamage = Math.floor(actualDamage * 0.35);
    const result = applyEnemyDamage(enemy, thornsDamage);
    callbacks.triggerAnimation(enemyElementId(enemy), 'hurt', false);
    if (callbacks.triggerCombatText && result.actualDamage > 0) {
      callbacks.triggerCombatText(enemyElementId(enemy), result.actualDamage, 'damage', false);
    }
    callbacks.log('damage', `🌿 ${target.username}'s Thorns reflects ${Math.floor(result.actualDamage)} damage to ${enemy.name}!`);
    if (result.died) {
      callbacks.log('success', `${enemy.name} is defeated!`);
    }
    if (!target.hero.stats) target.hero.stats = { totalDamage: 0, totalHealing: 0, damageBlocked: 0 };
    target.hero.stats.totalDamage += result.actualDamage;
  }

  // Log damage
  if (isCrit) {
    callbacks.log('combat', `💥 ${enemy.name} CRITICAL STRIKE hits ${target.username} for ${Math.floor(actualDamage)} damage!`);
  } else {
    callbacks.log('combat', `${enemy.name} hits ${target.username} for ${Math.floor(actualDamage)} damage`);
  }

  // Don't reset enemy animation to idle here - let the auto-return timeout handle it
  // This prevents interrupting hurt animations that are currently playing
  // The animation will return to idle after the hurt animation completes

  // Check for hero death (matches Electron app line 11921-11923)
  // CRITICAL: Match Electron app exactly - check hp <= 0, then set hp = 0 and isDead = true
  if (target.hero.hp <= 0 && !target.hero.isDead) {
    // Match Electron app: explicitly set HP to 0 before marking as dead
    target.hero.hp = 0; // Electron app line 11922
    target.hero.isDead = true; // Electron app line 11923
    target.hero.deathTime = Date.now();
    target.hero.activeDebuffs = {};
    const heroId = heroElementId(target);
    
    callbacks.triggerAnimation(heroId, 'death', true);
    callbacks.log('death', `💀 ${target.username} has been defeated! (resurrect in 60s)`);
    target.hero.deathAnimationPlaying = true;
    
    // Track death in combat metrics (matches Electron app line 11925)
    if (callbacks.trackDeath) {
      callbacks.trackDeath();
    }
  } else if (target.hero.isDead || target.hero.hp <= 0) {
    // Hero is already dead - skip further processing
    // This prevents dead heroes from being attacked
    return;
  }

}

/**
 * Handle bloodlust double attack - separate function to properly await it
 */
async function handleBloodlustAttack(
  target: {username: string; hero: Hero},
  enemy: Enemy,
  baseEnemyDamage: number,
  effectiveDefense: number,
  damageMultiplier: number,
  options: {
    ironSkinActive: boolean;
    lastStandActive: boolean;
    shieldWallActive: boolean;
    now: number;
  },
  heroesArray: Hero[],
  bonuses: ViewerBonuses,
  callbacks: CombatCallbacks,
  calculateSkillBonuses: (hero: Hero) => any,
  applyEnemyDamage: (enemy: Enemy, damage: number) => { died: boolean; actualDamage: number },
  getEnemySpriteType: (name: string) => string,
  getAnimationDuration: (spriteType: string, animation: string) => number
): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      // Double-check enemy and target are still alive
      if (enemy.isDead || enemy.hp <= 0 || target.hero.isDead || target.hero.hp <= 0) {
        resolve();
        return;
      }

      const { ironSkinActive, lastStandActive, shieldWallActive, now } = options;

      // Second attack with new damage roll
      let bloodlustDamage = enemy.attack + Math.floor(Math.random() * (enemy.attack * 0.2));
      if (enemy.activeDebuffs?.weaken) {
        bloodlustDamage *= 0.7;
      }
      
      // Apply difficulty modifier to bloodlust damage (same as main attack)
      const difficultyModifier = bonuses.difficultyModifier || 1.0;
      bloodlustDamage = Math.floor(bloodlustDamage * difficultyModifier);
      
      if (enemy.abilities!.enrageActive && Date.now() < (enemy.abilities!.enrageExpiry || 0)) {
        bloodlustDamage *= 1.4;
      }

      let bloodlustActualDamage = Math.max(1, bloodlustDamage - effectiveDefense);
      bloodlustActualDamage = Math.floor(bloodlustActualDamage * damageMultiplier);

      const maxDamagePerHit = Math.floor(target.hero.maxHp * 0.35);
      if (bloodlustActualDamage > maxDamagePerHit) {
        bloodlustActualDamage = maxDamagePerHit;
      }

      if (lastStandActive) {
        bloodlustActualDamage = Math.floor(bloodlustActualDamage * 0.25);
      } else if (ironSkinActive) {
        bloodlustActualDamage = Math.floor(bloodlustActualDamage * 0.5);
      }
      if (shieldWallActive) {
        bloodlustActualDamage = Math.floor(bloodlustActualDamage * 0.7);
      }

      // Apply inverse difficulty scaling to hero damage taken (same as main attack)
      if (difficultyModifier > 0) {
        bloodlustActualDamage = Math.floor(bloodlustActualDamage / difficultyModifier);
      }

      // Shield absorption for bloodlust
      const bloodlustShieldResult = absorbShieldDamage(target.hero, bloodlustActualDamage);
      bloodlustActualDamage = bloodlustShieldResult.remainingDamage;

      // CRITICAL: Match Electron app - explicitly set HP to 0 if it goes below 0
      if (target.hero.role === 'brewmaster') {
        const immediateDamage = Math.floor(bloodlustActualDamage * 0.4);
        const staggeredDamage = bloodlustActualDamage - immediateDamage;
        target.hero.hp = Math.max(0, target.hero.hp - immediateDamage);
        if (target.hero.hp < 0) {
          target.hero.hp = 0; // Explicitly set to 0 if negative (matches Electron app)
        }
        target.hero.hp = Math.floor(target.hero.hp); // CRITICAL: Floor HP to ensure integer
        if (!target.hero.staggerDoT) target.hero.staggerDoT = 0;
        target.hero.staggerDoT += staggeredDamage;
      } else {
        target.hero.hp = Math.max(0, target.hero.hp - bloodlustActualDamage);
        if (target.hero.hp < 0) {
          target.hero.hp = 0; // Explicitly set to 0 if negative (matches Electron app)
        }
        target.hero.hp = Math.floor(target.hero.hp); // CRITICAL: Floor HP to ensure integer
      }

      const heroId = heroElementId(target);
      callbacks.triggerAnimation(heroId, 'hurt', true);
      callbacks.log('combat', `🩸 ${enemy.name} BLOODLUST hits ${target.username} again for ${Math.floor(bloodlustActualDamage)} damage!`);

      // Show combat text for bloodlust
      if (callbacks.triggerCombatText && bloodlustActualDamage > 0) {
        callbacks.triggerCombatText(heroId, bloodlustActualDamage, 'damage', false);
      }
      
      // CRITICAL: Check for death after flooring HP - use <= 0 to catch floating point edge cases
      if (target.hero.hp <= 0 && !target.hero.isDead) {
        target.hero.isDead = true;
        target.hero.deathTime = Date.now();
        target.hero.activeDebuffs = {};
        
        // CRITICAL: Use consistent ID resolution - match the sprite container ID format
        // Sprite container uses: hero.id || hero.name || hero.characterName
        const heroIdForAnimation = target.hero.id || target.hero.name || target.hero.characterName || target.username;
        const heroIdForDeath = heroElementId({ id: heroIdForAnimation, username: target.username });
        
        callbacks.triggerAnimation(heroIdForDeath, 'death', true);
        callbacks.log('death', `💀 ${target.username} has been defeated! (resurrect in 60s)`);
        target.hero.deathAnimationPlaying = true;
        
        if (callbacks.trackDeath) {
          callbacks.trackDeath();
        }
      }

      resolve();
    }, 1000); // 1 second delay between attacks for bloodlust
  });
}
