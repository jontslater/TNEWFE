import {
  EQUIPMENT_SLOTS,
  ROLE_CONFIG,
  TANK_EQUIPMENT_SLOTS,
} from '../../utils/fullCombatEngine';
import { calculateSetBonuses } from '../../utils/setBonuses';
import { calculateSkillBonuses } from './skillBonuses';
import type { ComputedHeroStats, HeroStatInput } from './types';

const HEALER_ROLES = [
  'cleric',
  'atoner',
  'druid',
  'lightbringer',
  'shaman',
  'mistweaver',
  'chronomancer',
  'bard',
];

function emptyComputed(partial: Partial<ComputedHeroStats> = {}): ComputedHeroStats {
  return {
    attack: 0,
    defense: 0,
    maxHp: 0,
    intellect: 0,
    strength: 0,
    dexterity: 0,
    wisdom: 0,
    stamina: 0,
    healingPower: 0,
    spellDamage: 0,
    meleeDamage: 0,
    hpRegen: 0,
    damageReduction: 0,
    critChance: 0,
    critDamageBonus: 0,
    rewardBonuses: { xpGain: 0, goldGain: 0, tokenGain: 0 },
    damageMultiplier: 0,
    healingMultiplier: 0,
    defenseMultiplier: 0,
    skillBonuses: {
      attack: 0,
      defense: 0,
      hp: 0,
      damageMultiplier: 0,
      healingMultiplier: 0,
      defenseMultiplier: 0,
      critChance: 0,
      critDamage: 0,
      cooldownReduction: 0,
      lifesteal: 0,
      speedBoost: 0,
    },
    ...partial,
  };
}

/**
 * Canonical hero stat calculation: base level stats, gear, sets, gems, sockets,
 * upgrades, appliedUpgrades, skills, and prestige bonuses.
 */
export function computeHeroStats(hero: HeroStatInput): ComputedHeroStats {
  const config = ROLE_CONFIG[hero.role];
  const skillBonuses = calculateSkillBonuses(hero);
  let critDamageBonus = skillBonuses.critDamage;

  if (!config) {
    return emptyComputed({
      attack: hero.attack || 0,
      defense: hero.defense || 0,
      maxHp: hero.maxHp || 0,
      intellect: hero.intellect || 0,
      strength: hero.strength || 0,
      dexterity: hero.dexterity || 0,
      wisdom: hero.wisdom || 0,
      stamina: hero.stamina || 0,
      critChance: hero.critChance || 0,
      skillBonuses,
      damageMultiplier: skillBonuses.damageMultiplier,
      healingMultiplier: skillBonuses.healingMultiplier,
      defenseMultiplier: skillBonuses.defenseMultiplier,
    });
  }

  const stats = {
    attack: config.baseAttack + (hero.level - 1) * config.attackPerLevel,
    defense: config.baseDefense + (hero.level - 1) * config.defensePerLevel,
    maxHp: config.baseHp + (hero.level - 1) * config.hpPerLevel,
    intellect: hero.intellect || 0,
    strength: hero.strength || 0,
    dexterity: hero.dexterity || 0,
    wisdom: hero.wisdom || 0,
    stamina: hero.stamina || 0,
    healingPower: 0,
    spellDamage: 0,
    meleeDamage: 0,
    hpRegen: 0,
    damageReduction: 0,
    critChance: hero.critChance || 0,
  };

  const category = config.category;
  const slots = category === 'tank' ? TANK_EQUIPMENT_SLOTS : EQUIPMENT_SLOTS;

  if (hero.equipment) {
    for (const slot of slots) {
      const item = hero.equipment[slot] as Record<string, unknown> | undefined;
      if (!item) continue;

      stats.attack += (item.attack as number) || 0;
      stats.defense += (item.defense as number) || 0;
      stats.maxHp += (item.hp as number) || 0;
      stats.intellect += (item.intellect as number) || 0;
      stats.strength += (item.strength as number) || 0;
      stats.dexterity += (item.dexterity as number) || 0;
      stats.wisdom += (item.wisdom as number) || 0;
      stats.stamina += (item.stamina as number) || 0;

      const secondaryStats = item.secondaryStats as Record<string, number> | undefined;
      if (secondaryStats) {
        stats.healingPower += secondaryStats.healingPower || 0;
        stats.spellDamage += secondaryStats.spellDamage || 0;
        stats.meleeDamage += secondaryStats.meleeDamage || 0;
        stats.hpRegen += secondaryStats.hpRegen || 0;
        stats.damageReduction += secondaryStats.damageReduction || 0;
        stats.critChance += secondaryStats.critChance || 0;
      }
    }
  }

  if (hero.prestigeSlotCores) {
    Object.values(hero.prestigeSlotCores).forEach((core) => {
      if (core?.statBonus) {
        stats.attack += core.statBonus.attack || 0;
        stats.defense += core.statBonus.defense || 0;
        stats.maxHp += core.statBonus.hp || 0;
      }
    });
  }

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

  const isHealerRole = HEALER_ROLES.includes((hero.role || '').toLowerCase());
  if (isHealerRole) {
    stats.spellDamage += stats.meleeDamage + (setBonuses.meleeDamage || 0);
    stats.meleeDamage = 0;
  } else {
    stats.meleeDamage += setBonuses.meleeDamage || 0;
  }

  stats.hpRegen += setBonuses.hpRegen || 0;
  stats.damageReduction += setBonuses.damageReduction || 0;
  stats.critChance += setBonuses.critChance || 0;

  const preUpgradeStats = {
    attack: stats.attack,
    defense: stats.defense,
    maxHp: stats.maxHp,
    critChance: stats.critChance,
    healingPower: stats.healingPower,
    spellDamage: stats.spellDamage,
  };

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
    tokenGain: 0,
  };

  const socketBonusStats = {
    attack: 0,
    defense: 0,
    allStats: 0,
    xpGain: 0,
    goldGain: 0,
    critChance: 0,
    damageReduction: 0,
  };

  if (hero.equipment) {
    for (const slot of slots) {
      const item = hero.equipment[slot] as Record<string, unknown> | undefined;
      if (!item?.sockets || !Array.isArray(item.sockets)) continue;

      (item.sockets as Array<{ gem?: { stats?: Record<string, number> } }>).forEach((socket) => {
        const gemStat = socket.gem?.stats;
        if (!gemStat) return;
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
      });

      const socketBonuses = item.socketBonuses as Record<string, number> | undefined;
      if (socketBonuses) {
        socketBonusStats.attack += socketBonuses.attack || 0;
        socketBonusStats.defense += socketBonuses.defense || 0;
        socketBonusStats.allStats += socketBonuses.allStats || 0;
        socketBonusStats.xpGain += socketBonuses.xpGain || 0;
        socketBonusStats.goldGain += socketBonuses.goldGain || 0;
        socketBonusStats.critChance += socketBonuses.critChance || 0;
        socketBonusStats.damageReduction += socketBonuses.damageReduction || 0;
      }
    }
  }

  stats.attack += gemStats.attack;
  stats.defense += gemStats.defense;
  stats.maxHp += gemStats.maxHp;
  stats.critChance += gemStats.critChance / 100;
  stats.damageReduction += gemStats.damageReduction;
  critDamageBonus += gemStats.critDamage;

  if (gemStats.allStats > 0) {
    stats.attack += Math.floor((stats.attack * gemStats.allStats) / 100);
    stats.defense += Math.floor((stats.defense * gemStats.allStats) / 100);
    stats.maxHp += Math.floor((stats.maxHp * gemStats.allStats) / 100);
  }

  if (socketBonusStats.attack > 0) {
    stats.attack += Math.floor((stats.attack * socketBonusStats.attack) / 100);
  }
  if (socketBonusStats.defense > 0) {
    stats.defense += Math.floor((stats.defense * socketBonusStats.defense) / 100);
  }
  if (socketBonusStats.allStats > 0) {
    stats.attack += Math.floor((stats.attack * socketBonusStats.allStats) / 100);
    stats.defense += Math.floor((stats.defense * socketBonusStats.allStats) / 100);
    stats.maxHp += Math.floor((stats.maxHp * socketBonusStats.allStats) / 100);
  }
  stats.critChance += socketBonusStats.critChance / 100;
  stats.damageReduction += socketBonusStats.damageReduction;

  if (hero.equipment) {
    for (const slot of slots) {
      const item = hero.equipment[slot] as Record<string, unknown> | undefined;
      if (!item?.appliedUpgrades || !Array.isArray(item.appliedUpgrades)) continue;

      (item.appliedUpgrades as Array<{ bonus?: Record<string, number> }>).forEach((appliedUpgrade) => {
        if (appliedUpgrade.bonus) {
          stats.attack += appliedUpgrade.bonus.attack || 0;
          stats.defense += appliedUpgrade.bonus.defense || 0;
          stats.maxHp += appliedUpgrade.bonus.hp || 0;
        }
      });
    }
  }

  if (hero.equipment) {
    for (const slot of slots) {
      const item = hero.equipment[slot] as Record<string, unknown> | undefined;
      if (!item?.upgradeStats || !Array.isArray(item.upgradeStats)) continue;

      (item.upgradeStats as Array<{ selectedStats?: Array<{ type: string; value?: number }> }>).forEach(
        (upgrade) => {
          upgrade.selectedStats?.forEach((selectedStat) => {
            const statType = selectedStat.type;
            const statValue = selectedStat.value || 0;

            switch (statType) {
              case 'attack':
                stats.attack += Math.floor((preUpgradeStats.attack * statValue) / 100);
                break;
              case 'defense':
                stats.defense += Math.floor((preUpgradeStats.defense * statValue) / 100);
                break;
              case 'hp':
                stats.maxHp += Math.floor((preUpgradeStats.maxHp * statValue) / 100);
                break;
              case 'critChance':
                stats.critChance += statValue / 100;
                break;
              case 'critDamage':
                critDamageBonus += statValue;
                break;
              case 'healingPower':
                stats.healingPower += Math.floor((preUpgradeStats.healingPower * statValue) / 100);
                break;
              case 'spellDamage':
                stats.spellDamage += Math.floor((preUpgradeStats.spellDamage * statValue) / 100);
                break;
            }
          });
        },
      );
    }
  }

  stats.critChance = Math.min(stats.critChance || 0, 0.35);

  stats.maxHp += (stats.stamina || 0) * 10;

  stats.attack += skillBonuses.attack;
  stats.defense += skillBonuses.defense;
  stats.maxHp += skillBonuses.hp;
  stats.critChance += skillBonuses.critChance / 100;

  if (skillBonuses.defenseMultiplier > 0) {
    stats.defense = Math.floor(stats.defense * (1 + skillBonuses.defenseMultiplier / 100));
  }

  if (hero.prestigeBoosts?.statBoost) {
    stats.attack += hero.prestigeBoosts.statBoost.attack || 0;
    stats.defense += hero.prestigeBoosts.statBoost.defense || 0;
    stats.maxHp += hero.prestigeBoosts.statBoost.hp || 0;
  }

  const rewardBonuses = {
    xpGain: gemStats.xpGain + socketBonusStats.xpGain,
    goldGain: gemStats.goldGain + socketBonusStats.goldGain,
    tokenGain: gemStats.tokenGain,
  };

  return {
    ...stats,
    critDamageBonus,
    rewardBonuses,
    damageMultiplier: skillBonuses.damageMultiplier,
    healingMultiplier: skillBonuses.healingMultiplier,
    defenseMultiplier: skillBonuses.defenseMultiplier,
    skillBonuses,
  };
}

/** Alias used by combat utilities and dashboard */
export function getCharacterStats(hero: HeroStatInput): ComputedHeroStats & { skillBonuses: ComputedHeroStats['skillBonuses'] } {
  return computeHeroStats(hero);
}
