/**
 * Buffs and Debuffs Processing
 * Handles all buff/debuff logic including DoT, debuff application, and buff duration updates
 */

import { Hero, Enemy, Debuff } from './types';
import { DEBUFFS } from '../fullCombatEngine';
import { CombatCallbacks } from './types';
import { BUFF_TYPES } from '../buffSystem';
import { applyHealing, absorbShieldDamage } from './healing';
import { heroElementId } from './enemyAttacks';

/**
 * ID resolution helper - match DOM element IDs
 */
function enemyElementId(enemy: Enemy | { id: any }): string {
  return `battle-enemy-${enemy.id}`;
}

/**
 * Process all debuffs (DoT damage, expiration, etc.)
 */
export function processDebuffs(
  heroes: Hero[] | Map<string, Hero>,
  enemies: Enemy[],
  now: number,
  callbacks: CombatCallbacks,
  applyEnemyDamage: (enemy: Enemy, damage: number) => { died: boolean; actualDamage: number },
  getHeroSpriteType: (role: string) => string,
  getEnemySpriteType: (name: string) => string,
  getAnimationDuration: (spriteType: string, animation: string) => number
): void {
  const heroesArray = Array.isArray(heroes) ? heroes : Array.from(heroes.values());

  // Process hero debuffs
  heroesArray.forEach((hero) => {
    if (!hero || !hero.activeDebuffs || hero.isDead) return;

    Object.keys(hero.activeDebuffs).forEach(debuffKey => {
      const debuff = hero.activeDebuffs![debuffKey];
      if (!debuff) return;

      // Check if expired
      if (now >= debuff.expiresAt) {
        delete hero.activeDebuffs![debuffKey];
        const debuffName = DEBUFFS[debuffKey]?.name || debuffKey;
        callbacks.log('system', `${hero.username} is no longer ${debuffName}`);
        return;
      }

      // Apply damage over time effects
      if (DEBUFFS[debuffKey]?.effect === 'damageOverTime') {
        if (!debuff.lastTick || now - debuff.lastTick >= (DEBUFFS[debuffKey].tickRate || 2000)) {
          // Use debuff's stored value if it exists (for dynamic DoTs), otherwise use DEBUFFS value
          const baseDotDamage = debuff.value !== undefined ? debuff.value : (DEBUFFS[debuffKey].value || 0);
          const dotDamage = baseDotDamage;

          if (dotDamage > 0) {
            // CRITICAL: Apply shield absorption first, then remaining damage to HP
            // This ensures shields are depleted before health is affected
            const shieldResult = absorbShieldDamage(hero, dotDamage);
            const remainingDotDamage = shieldResult.remainingDamage;
            
            if (shieldResult.absorbed > 0) {
              callbacks.log('combat', `💙 ${hero.username}'s shield absorbs ${Math.floor(shieldResult.absorbed)} DoT damage!`);
            }
            
            hero.hp = Math.max(0, hero.hp - remainingDotDamage);
            if (hero.hp < 0) {
              hero.hp = 0; // Explicitly set to 0 if negative (matches Electron app)
            }
            hero.hp = Math.floor(hero.hp); // CRITICAL: Floor HP to ensure integer
            debuff.lastTick = now;

            // Show DoT damage SCT (matches Electron app line 9810)
            if (callbacks.triggerCombatText) {
              callbacks.triggerCombatText(hero.username, dotDamage, 'dot', true);
            }

            callbacks.log('damage', `${DEBUFFS[debuffKey].icon} ${hero.username} takes ${Math.floor(dotDamage)} damage from ${DEBUFFS[debuffKey].name}`);

            // CRITICAL: Match Electron app - check hp <= 0, then set hp = 0 and isDead = true
            if (hero.hp <= 0 && !hero.isDead) {
              hero.hp = 0; // Explicitly set to 0 (matches Electron app)
              hero.isDead = true;
              hero.deathTime = now;
              hero.deathAnimationPlaying = true;
              hero.activeDebuffs = {};
              // Use proper hero ID format for death animation - match sprite container ID format
              // Use heroElementId for consistent ID resolution
              const formattedHeroId = heroElementId(hero);
              callbacks.triggerAnimation(formattedHeroId, 'death', true);
              callbacks.log('death', `💀 ${hero.username} has been defeated by ${DEBUFFS[debuffKey].name}! (resurrect in 60s)`);

              // Track death in combat metrics (matches Electron app line 11925)
              if (callbacks.trackDeath) {
                callbacks.trackDeath();
              }

              // Clear flag after death animation completes
              const heroSpriteType = getHeroSpriteType(hero.role);
              const deathDuration = getAnimationDuration(heroSpriteType, 'death');
              setTimeout(() => {
                hero.deathAnimationPlaying = false;
              }, deathDuration + 1000);
            }
          } else {
            debuff.lastTick = now; // Update tick even if no damage
          }
        }
      }
    });
  });

  // Process enemy debuffs
  enemies.forEach((enemy) => {
    if (!enemy || !enemy.activeDebuffs || enemy.isDead) return;

    Object.keys(enemy.activeDebuffs).forEach(debuffKey => {
      const debuff = enemy.activeDebuffs![debuffKey];
      if (!debuff) return;

      // Check if expired
      if (now >= debuff.expiresAt) {
        delete enemy.activeDebuffs![debuffKey];
        const debuffName = DEBUFFS[debuffKey]?.name || debuffKey;
        callbacks.log('system', `${enemy.name} is no longer ${debuffName}`);
        return;
      }

      // Apply damage over time effects
      const debuffDef = DEBUFFS[debuffKey];
      const isEnchantmentDebuff = ['fire', 'poisoned'].includes(debuffKey);
      const tickRate = debuffDef?.tickRate || 2000; // Default 2s

      if (debuffDef?.effect === 'damageOverTime' || isEnchantmentDebuff) {
        // CRITICAL: Only tick if enough time has passed since last tick
        // This prevents multiple ticks if processDebuffs is called multiple times per round
        const timeSinceLastTick = debuff.lastTick ? (now - debuff.lastTick) : tickRate;
        
        // Debug logging for debuff ticks
        if (!debuff.lastTick || timeSinceLastTick >= tickRate) {
          // Use debuff's stored value if it exists (for dynamic DoTs), otherwise use DEBUFFS value
          const baseDotDamage = debuff.value !== undefined ? debuff.value : (debuffDef?.value || 0);
          const dotDamage = baseDotDamage;

          if (dotDamage > 0) {
            // CRITICAL: Set lastTick BEFORE applying damage to prevent duplicate ticks
            // This ensures that even if processDebuffs is called again immediately, it won't tick again
            debuff.lastTick = now;
            
            const result = applyEnemyDamage(enemy, dotDamage);
            const enemyDied = result.died;
            const actualDamage = result.actualDamage;

            // Show DoT damage SCT on enemy (matches Electron app line 9883)
            if (callbacks.triggerCombatText && actualDamage > 0) {
              callbacks.triggerCombatText(enemyElementId(enemy), actualDamage, 'dot', false);
            }

            const debuffName = debuffDef?.name || debuffKey;
            const debuffIcon = debuffDef?.icon || '🔥';
            callbacks.log('damage', `${debuffIcon} ${enemy.name} takes ${Math.floor(actualDamage)} ${debuffName} damage`);

            if (enemyDied) {
              if (enemy.isBoss) {
                callbacks.log('success', `🏆 ${enemy.name} has been defeated!`);
              } else {
                callbacks.log('success', `${enemy.name} is defeated!`);
              }
            }
            callbacks.updateEnemyHealthBar();
          } else {
            debuff.lastTick = now; // Update tick even if no damage
          }
        }
      }
    });
  });

  // Process Stagger DoT (Brewmaster passive)
  heroesArray.forEach((hero) => {
    if (!hero || hero.isDead) return;
    if (hero.staggerDoT && hero.staggerDoT > 0) {
      if (!hero.staggerLastTick) hero.staggerLastTick = now;

      if (now - hero.staggerLastTick >= 2000) {
        const staggerPerTick = Math.ceil(hero.staggerDoT / 4);
        const actualStaggerDamage = Math.min(staggerPerTick, hero.staggerDoT);

        // CRITICAL: Apply shield absorption first, then remaining damage to HP
        // This ensures shields are depleted before health is affected
        const shieldResult = absorbShieldDamage(hero, actualStaggerDamage);
        const remainingStaggerDamage = shieldResult.remainingDamage;
        
        if (shieldResult.absorbed > 0) {
          callbacks.log('combat', `💙 ${hero.username}'s shield absorbs ${Math.floor(shieldResult.absorbed)} Stagger damage!`);
        }
        
        hero.hp = Math.max(0, hero.hp - remainingStaggerDamage);
        if (hero.hp < 0) {
          hero.hp = 0; // Explicitly set to 0 if negative (matches Electron app)
        }
        hero.hp = Math.floor(hero.hp); // CRITICAL: Floor HP to ensure integer
        hero.staggerDoT = Math.max(0, hero.staggerDoT - actualStaggerDamage);
        hero.staggerLastTick = now;

        if (actualStaggerDamage > 0) {
          callbacks.log('damage', `🍺 ${hero.username} takes ${Math.floor(actualStaggerDamage)} staggered damage`);
        }

        // Clear stagger when depleted
        if (hero.staggerDoT <= 0) {
          hero.staggerDoT = 0;
          hero.staggerLastTick = 0;
        }

        // CRITICAL: Match Electron app - check hp <= 0, then set hp = 0 and isDead = true
        if (hero.hp <= 0 && !hero.isDead) {
          hero.hp = 0; // Explicitly set to 0 (matches Electron app)
          hero.isDead = true;
          hero.deathTime = now;
          hero.deathAnimationPlaying = true;
          hero.activeDebuffs = {};
          // Use proper hero ID format for death animation - match sprite container ID format
          // Use heroElementId for consistent ID resolution
          const formattedHeroId = heroElementId(hero);
          callbacks.triggerAnimation(formattedHeroId, 'death', true);
          callbacks.log('death', `💀 ${hero.username} has been defeated by Stagger! (resurrect in 60s)`);

          // Track death in combat metrics (matches Electron app line 11925)
          if (callbacks.trackDeath) {
            callbacks.trackDeath();
          }

          const heroSpriteType = getHeroSpriteType(hero.role);
          const deathDuration = getAnimationDuration(heroSpriteType, 'death');
          setTimeout(() => {
            hero.deathAnimationPlaying = false;
          }, deathDuration + 1000);
        }
      }
    }
  });
}

/**
 * Calculate debuff resistance chance
 */
export function getDebuffResistance(target: Hero | Enemy): number {
  // For heroes
  if ((target as Hero).role) {
    const hero = target as Hero;
    // Base resistance from defense (1% per 5 defense)
    const defenseResist = Math.min(0.3, (hero.defense || 0) / 500);
    // Level resistance (1% per 2 levels)
    const levelResist = Math.min(0.25, (hero.level || 0) / 200);
    // Gear score resistance (simplified)
    let gearScore = 0;
    if (hero.equipment) {
      Object.values(hero.equipment).forEach((item: any) => {
        if (item) {
          gearScore += (item.attack || 0) + (item.defense || 0) + (item.hp || 0);
        }
      });
    }
    const gearResist = Math.min(0.2, gearScore / 5000);

    return Math.min(0.7, defenseResist + levelResist + gearResist); // Max 70% resistance
  }
  // For enemies
  else {
    const enemy = target as Enemy;
    // Enemies have base 10% resistance, bosses have 25%
    return enemy.isBoss ? 0.25 : 0.10;
  }
}

/**
 * Apply debuff to target
 */
export function applyDebuff(
  target: Hero | Enemy,
  debuffKey: string,
  appliedBy: string,
  value?: number,
  callbacks?: CombatCallbacks
): boolean {
  const debuff = DEBUFFS[debuffKey];
  if (!debuff) return false;

  // Check resistance
  const resistance = getDebuffResistance(target);
  if (Math.random() < resistance) {
    const targetName = (target as Hero).username || (target as Enemy).name || 'Enemy';
    if (callbacks) {
      callbacks.log('combat', `✨ ${targetName} resists ${debuff.name}!`);
    }
    return false; // Resisted!
  }

  const now = Date.now();

  if (!target.activeDebuffs) {
    target.activeDebuffs = {};
  }

  // Apply or refresh debuff
  const debuffData: Debuff = {
    expiresAt: now + debuff.duration,
    appliedBy: appliedBy,
    lastTick: now
  };

  // If a value is passed (for dynamic DoTs), store it
  if (value !== undefined) {
    debuffData.value = value;
  }

  target.activeDebuffs[debuffKey] = debuffData;

  const targetName = (target as Hero).username || (target as Enemy).name || 'Enemy';
  if (callbacks) {
    callbacks.log('combat', `${debuff.icon} ${targetName} is ${debuff.name}!`);
  }

  return true;
}

/**
 * Process HP Regeneration from armor enchantments and HoT buffs
 * Ticks every 2 seconds (matches DoT tick rate) and heals heroes
 * Excess healing converts to shields (matches RaidBrowserSourcePage behavior)
 */
export function processHpRegeneration(
  heroes: Hero[] | Map<string, Hero>,
  now: number,
  callbacks: CombatCallbacks
): void {
  const heroesArray = Array.isArray(heroes) ? heroes : Array.from(heroes.values());
  const tickRate = 2000; // 2 seconds (matches DoT tick rate)

  heroesArray.forEach((hero) => {
    if (!hero || hero.isDead || hero.hp <= 0) return;
    if (!hero.activeBuffs) return;

    let totalHealing = 0;
    const hotTickRate = 2000; // 2 seconds

    // Process all HoT buffs (including hpRegen and any buffs with healOverTime effect)
    Object.keys(hero.activeBuffs).forEach(buffKey => {
      const buff = hero.activeBuffs![buffKey];
      if (!buff) return;

      // Check if this is an HoT buff
      // hpRegen is always an HoT, or check if buff has healOverTime effect in BUFF_TYPES
      let isHotBuff = false;
      if (buffKey === 'hpRegen') {
        isHotBuff = true;
      } else {
        // Check if buff name matches a BUFF_TYPES entry with healOverTime effect
        const buffDef = Object.values(BUFF_TYPES).find(b => b.name === buff.name);
        if (buffDef?.effect === 'healOverTime') {
          isHotBuff = true;
        } else if (buff.name?.toLowerCase().includes('regen') || 
                   buff.name?.toLowerCase().includes('rejuvenation')) {
          // Fallback: check name for common HoT indicators
          isHotBuff = true;
        }
      }

      if (!isHotBuff) return;

      // Initialize lastTickTime if not exists
      if (!(buff as any).lastTickTime) {
        (buff as any).lastTickTime = now - hotTickRate;
      }

      const timeSinceLastTick = now - (buff as any).lastTickTime;

      if (timeSinceLastTick >= hotTickRate) {
        // Get healing amount - handle both number and function types
        let hotHealing = 0;
        if (typeof buff.value === 'function') {
          hotHealing = buff.value(hero);
        } else {
          hotHealing = buff.value || 0;
        }

        if (hotHealing > 0) {
          totalHealing += hotHealing;
        }

        // Update lastTickTime
        (buff as any).lastTickTime = now;
        if (buff.lastUpdateTime !== undefined) {
          buff.lastUpdateTime = now;
        }
      }
    });

    // Apply HoT healing with shield conversion for excess
    // CRITICAL: Use applyHealing to ensure HP is filled first, then shields from overheal
    if (totalHealing > 0) {
      // Get current shield amount before healing (for logging)
      const currentShieldAmount = typeof hero.shield === 'number' 
        ? hero.shield 
        : (hero.shield?.amount || 0);
      
      // Use applyHealing to properly fill HP first, then create shields from overheal
      const { actualHeal, overhealAmount } = applyHealing(hero, totalHealing, now, true);

      // Show green combat text for HoT (heal-hot type)
      if (callbacks.triggerCombatText) {
        const heroId = hero.id || hero.username || hero.name || hero.characterName;
        callbacks.triggerCombatText(heroId, totalHealing, 'heal-hot', true);
      }

      const shieldGained = typeof hero.shield === 'object' && hero.shield?.amount 
        ? hero.shield.amount - currentShieldAmount 
        : 0;
      callbacks.log('heal', `💚 ${hero.username} regenerates ${Math.floor(actualHeal)} HP${shieldGained > 0 ? ` (${Math.floor(shieldGained)} converted to shield)` : ''}`);
    }
  });
}

/**
 * Update hero buff durations (only ticks down during combat)
 */
export function updateHeroBuffDurations(heroes: Hero[] | Map<string, Hero>, now: number): void {
  const heroesArray = Array.isArray(heroes) ? heroes : Array.from(heroes.values());

  heroesArray.forEach((hero) => {
    if (!hero || !hero.activeBuffs) return;

    Object.keys(hero.activeBuffs).forEach(buffKey => {
      const buff = hero.activeBuffs![buffKey];
      if (!buff) return;

      // Skip HP regen buff - it has infinite duration
      if (buffKey === 'hpRegen') return;

      // Update duration based on time since last update
      const timeSinceLastUpdate = now - (buff.lastUpdateTime || now);
      buff.remainingDuration -= timeSinceLastUpdate;
      buff.lastUpdateTime = now;

      // Remove expired buffs
      if (buff.remainingDuration <= 0) {
        delete hero.activeBuffs![buffKey];
      }
    });
  });
}
