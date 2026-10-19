/**
 * Pure utility functions for combat calculations
 * Stateless helper functions extracted from fullCombatEngine.ts
 */

import { Hero, Enemy, ROLE_CONFIG, EQUIPMENT_SLOTS, TANK_EQUIPMENT_SLOTS } from './fullCombatEngine';
import { calculateSetBonuses } from './setBonuses';
import { computeSkillModifiers, toLegacySkillBonuses } from '../game/skills/computeSkillModifiers';
import { chatDamageHealMultiplier, computeHeroBalanceStats, capCritChance } from '../combat/balance';

/**
 * Get viewer bonuses based on viewer count
 */
export function getViewerBonuses(viewerCount: number = 0) {
  const chat = chatDamageHealMultiplier(viewerCount);
  return {
    damageMultiplier: chat,
    healingMultiplier: chat,
    defenseMultiplier: 1,
  };
}

/**
 * Calculate skill bonuses for a hero (canonical defs in `src/game/skills/`).
 */
export function calculateSkillBonuses(hero: Hero) {
  return toLegacySkillBonuses(computeSkillModifiers(hero));
}

/**
 * Get character stats including equipment bonuses
 */
export function getCharacterStats(hero: Hero) {
  const config = ROLE_CONFIG[hero.role];
  if (!config) {
    return {
      attack: hero.attack || 0,
      defense: hero.defense || 0,
      maxHp: hero.maxHp || 0,
      intellect: hero.intellect || 0,
      strength: hero.strength || 0,
      dexterity: hero.dexterity || 0,
      wisdom: hero.wisdom || 0,
      stamina: hero.stamina || 0,
      // Secondary stats should only come from equipment, not stored on hero
      healingPower: 0,
      spellDamage: 0,
      meleeDamage: 0,
      hpRegen: 0,
      damageReduction: 0,
      critChance: 0
    };
  }

  // Calculate skill bonuses first
  const skillBonuses = calculateSkillBonuses(hero);

  const stats: any = {
    attack: config.baseAttack + ((hero.level - 1) * config.attackPerLevel),
    defense: config.baseDefense + ((hero.level - 1) * config.defensePerLevel),
    maxHp: config.baseHp + ((hero.level - 1) * config.hpPerLevel),
    intellect: hero.intellect || 0,
    strength: hero.strength || 0,
    dexterity: hero.dexterity || 0,
    wisdom: hero.wisdom || 0,
    stamina: hero.stamina || 0,
    // Secondary stats should only come from equipment, not stored on hero
    healingPower: 0,
    spellDamage: 0,
    meleeDamage: 0,
    hpRegen: 0,
    damageReduction: 0,
    critChance: hero.critChance || 0
  };

  // Add equipment bonuses if available
  if (hero.equipment) {
    const category = config.category;
    const slots = category === 'tank' ? TANK_EQUIPMENT_SLOTS : EQUIPMENT_SLOTS;

    for (const slot of slots) {
      if (hero.equipment[slot]) {
        const item = hero.equipment[slot];
        stats.attack += item.attack || 0;
        stats.defense += item.defense || 0;
        stats.maxHp += item.hp || 0;
        stats.intellect += item.intellect || 0;
        stats.strength += item.strength || 0;
        stats.dexterity += item.dexterity || 0;
        stats.wisdom += item.wisdom || 0;
        stats.stamina += item.stamina || 0;
        
        if (item.secondaryStats) {
          stats.healingPower += item.secondaryStats.healingPower || 0;
          stats.spellDamage += item.secondaryStats.spellDamage || 0;
          // Melee damage will be filtered for healers after equipment loop
          stats.meleeDamage += item.secondaryStats.meleeDamage || 0;
          stats.hpRegen += item.secondaryStats.hpRegen || 0;
          stats.damageReduction += item.secondaryStats.damageReduction || 0;
          stats.critChance += item.secondaryStats.critChance || 0;
        }
        
      }
    }
  }

  // Apply prestige slot core stat bonuses (cores are attached to slots, not items)
  if (hero.prestigeSlotCores) {
    Object.entries(hero.prestigeSlotCores).forEach(([slot, core]: [string, any]) => {
      if (core && core.statBonus) {
        stats.attack += core.statBonus.attack || 0;
        stats.defense += core.statBonus.defense || 0;
        stats.maxHp += core.statBonus.hp || 0;
      }
    });
  }

  // Apply set bonuses from equipped gear
  const setBonuses = calculateSetBonuses(hero.equipment, hero.role || '');
  stats.attack += setBonuses.attack || 0;
  stats.defense += setBonuses.defense || 0;
  stats.maxHp += setBonuses.hp || 0;
  stats.intellect += setBonuses.intellect || 0;
  stats.strength += setBonuses.strength || 0;
  stats.dexterity += setBonuses.dexterity || 0;
  stats.wisdom += setBonuses.wisdom || 0;
  stats.stamina += setBonuses.stamina || 0;
  stats.healingPower += setBonuses.healingPower || 0;
  stats.spellDamage += setBonuses.spellDamage || 0;
  
  // FILTER: Healers don't use melee damage - convert to spell damage instead
  // This ensures healers benefit from equipment that might have melee damage
  const isHealerRole = ['cleric', 'atoner', 'druid', 'lightbringer', 'shaman', 'mistweaver', 'chronomancer', 'bard'].includes((hero.role || '').toLowerCase());
  if (isHealerRole) {
    // Convert all melee damage to spell damage for healers (they use spell power)
    stats.spellDamage += stats.meleeDamage + (setBonuses.meleeDamage || 0);
    stats.meleeDamage = 0; // Set to 0 for healers
  } else {
    stats.meleeDamage += setBonuses.meleeDamage || 0;
  }
  
  stats.hpRegen += setBonuses.hpRegen || 0;
  stats.damageReduction += setBonuses.damageReduction || 0;
  stats.critChance += setBonuses.critChance || 0;

  // Store pre-upgrade totals for upgrade calculations
  // Upgrades are percentages of the hero's TOTAL accumulated stats (base + equipment + set bonuses)
  const preUpgradeStats = {
    attack: stats.attack,
    defense: stats.defense,
    maxHp: stats.maxHp,
    critChance: stats.critChance,
    healingPower: stats.healingPower,
    spellDamage: stats.spellDamage
  };

  // Calculate gem stats from all equipped items
  const gemStats = {
    attack: 0,
    defense: 0,
    critChance: 0,
    critDamage: 0,
    damageReduction: 0,
    maxHp: 0,
    allStats: 0,
    xpGain: 0,
    goldGain: 0,
    tokenGain: 0
  };

  // Calculate socket bonuses from all equipped items
  const socketBonusStats = {
    attack: 0,
    defense: 0,
    allStats: 0,
    xpGain: 0,
    goldGain: 0,
    critChance: 0,
    damageReduction: 0
  };

  // Process gems and socket bonuses from equipment
  if (hero.equipment) {
    const category = config.category;
    const slots = category === 'tank' ? TANK_EQUIPMENT_SLOTS : EQUIPMENT_SLOTS;

    for (const slot of slots) {
      const item = hero.equipment[slot];
      if (!item) continue;

      // Add gem stats from sockets
      if (item.sockets && Array.isArray(item.sockets)) {
        item.sockets.forEach((socket: any) => {
          if (socket.gem && socket.gem.stats) {
            const gemStat = socket.gem.stats;
            gemStats.attack += gemStat.attack || 0;
            gemStats.defense += gemStat.defense || 0;
            gemStats.critChance += gemStat.critChance || 0;
            gemStats.critDamage += gemStat.critDamage || 0;
            gemStats.damageReduction += gemStat.damageReduction || 0;
            gemStats.maxHp += gemStat.maxHp || 0;
            gemStats.allStats += gemStat.allStats || 0;
            gemStats.xpGain += gemStat.xpGain || 0;
            gemStats.goldGain += gemStat.goldGain || 0;
            gemStats.tokenGain += gemStat.tokenGain || 0;
          }
        });

        // Add socket bonuses for this item
        if (item.socketBonuses) {
          socketBonusStats.attack += item.socketBonuses.attack || 0;
          socketBonusStats.defense += item.socketBonuses.defense || 0;
          socketBonusStats.allStats += item.socketBonuses.allStats || 0;
          socketBonusStats.xpGain += item.socketBonuses.xpGain || 0;
          socketBonusStats.goldGain += item.socketBonuses.goldGain || 0;
          socketBonusStats.critChance += item.socketBonuses.critChance || 0;
          socketBonusStats.damageReduction += item.socketBonuses.damageReduction || 0;
        }
      }
    }
  }

  // Apply gem stats (flat bonuses)
  stats.attack += gemStats.attack;
  stats.defense += gemStats.defense;
  stats.maxHp += gemStats.maxHp;
  stats.critChance += gemStats.critChance / 100; // Convert percentage to decimal
  stats.damageReduction += gemStats.damageReduction;

  // All stats bonus from gems (applied as percentage of current stats)
  if (gemStats.allStats > 0) {
    stats.attack += Math.floor(stats.attack * gemStats.allStats / 100);
    stats.defense += Math.floor(stats.defense * gemStats.allStats / 100);
    stats.maxHp += Math.floor(stats.maxHp * gemStats.allStats / 100);
  }

  // Apply socket bonuses (percentage bonuses)
  if (socketBonusStats.attack > 0) {
    stats.attack += Math.floor(stats.attack * socketBonusStats.attack / 100);
  }
  if (socketBonusStats.defense > 0) {
    stats.defense += Math.floor(stats.defense * socketBonusStats.defense / 100);
  }
  if (socketBonusStats.allStats > 0) {
    stats.attack += Math.floor(stats.attack * socketBonusStats.allStats / 100);
    stats.defense += Math.floor(stats.defense * socketBonusStats.allStats / 100);
    stats.maxHp += Math.floor(stats.maxHp * socketBonusStats.allStats / 100);
  }
  stats.critChance += socketBonusStats.critChance / 100; // Convert percentage to decimal
  stats.damageReduction += socketBonusStats.damageReduction;

  // Apply profession enchantments/upgrades (appliedUpgrades)
  // These are flat bonuses from Mining/Enchanting profession items (Fiery Weapon, Vampiric Touch, etc.)
  if (hero.equipment) {
    const category = config.category;
    const slots = category === 'tank' ? TANK_EQUIPMENT_SLOTS : EQUIPMENT_SLOTS;

    for (const slot of slots) {
      const item = hero.equipment[slot];
      if (!item || !item.appliedUpgrades || !Array.isArray(item.appliedUpgrades)) continue;

      item.appliedUpgrades.forEach((appliedUpgrade: any) => {
        if (appliedUpgrade.bonus) {
          // Apply flat bonuses from profession enchantments
          stats.attack += appliedUpgrade.bonus.attack || 0;
          stats.defense += appliedUpgrade.bonus.defense || 0;
          stats.maxHp += appliedUpgrade.bonus.hp || 0;
        }
      });
    }
  }

  // Apply upgrade bonuses (custom stat selection system)
  // Upgrades are percentages of the hero's TOTAL stats, not the item's base stats
  if (hero.equipment) {
    const category = config.category;
    const slots = category === 'tank' ? TANK_EQUIPMENT_SLOTS : EQUIPMENT_SLOTS;

    for (const slot of slots) {
      const item = hero.equipment[slot];
      if (!item || !item.upgradeStats || !Array.isArray(item.upgradeStats)) continue;

      item.upgradeStats.forEach((upgrade: any) => {
        if (upgrade.selectedStats && Array.isArray(upgrade.selectedStats)) {
          upgrade.selectedStats.forEach((selectedStat: any) => {
            const statType = selectedStat.type;
            const statValue = selectedStat.value || 0; // Percentage value

            switch (statType) {
              case 'attack':
                // Percentage of hero's total attack (base + all equipment)
                stats.attack += Math.floor(preUpgradeStats.attack * statValue / 100);
                break;
              case 'defense':
                // Percentage of hero's total defense (base + all equipment)
                stats.defense += Math.floor(preUpgradeStats.defense * statValue / 100);
                break;
              case 'hp':
                // Percentage of hero's total HP (base + all equipment)
                stats.maxHp += Math.floor(preUpgradeStats.maxHp * statValue / 100);
                break;
              case 'critChance':
                // Crit chance is in percentage points (flat bonus, not percentage of base)
                stats.critChance += statValue / 100; // Convert percentage to decimal
                break;
              case 'critDamage':
                // Crit damage is percentage points (flat bonus)
                // Could add to a separate critDamageMultiplier stat later
                // For now, treat as flat attack bonus (smaller since it's conditional)
                stats.attack += Math.floor(preUpgradeStats.attack * statValue / 200);
                break;
              case 'healingPower':
                // Percentage of hero's total healing power
                stats.healingPower += Math.floor(preUpgradeStats.healingPower * statValue / 100);
                break;
              case 'spellDamage':
                // Percentage of hero's total spell damage
                stats.spellDamage += Math.floor(preUpgradeStats.spellDamage * statValue / 100);
                break;
            }
          });
        }
      });
    }
  }

  const skillMods = computeSkillModifiers(hero);

  // Store skill bonuses for use in combat
  stats.skillBonuses = skillBonuses;

  const bal = computeHeroBalanceStats(hero);
  stats.attack = Math.floor(bal.attack * (1 + skillMods.statAttackPercent / 100));
  stats.defense = Math.floor(bal.armor * (1 + skillMods.statDefensePercent / 100));
  stats.armor = stats.defense;
  stats.maxHp = Math.floor(bal.maxHp * (1 + skillMods.statHpPercent / 100));
  stats.spellPower = bal.spellPower;
  stats.hpRegen = 0;
  stats.critChance = capCritChance(bal.critChance + skillBonuses.critChance / 100);

  return stats;
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
    // Gear score resistance (1% per 50 gear score)
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
