/**
 * Equipment Set Bonus System
 * Calculates and applies bonuses from equipped gear sets
 */

import { Item, Equipment } from '../types/Hero';

// Equipment Set Definitions - Named sets for each category
export const EQUIPMENT_SETS = {
  // TANK SETS
  tank: {
    'Guardian\'s Bulwark': {
      name: 'Guardian\'s Bulwark',
      category: 'tank',
      pieces: ['weapon', 'armor', 'shield', 'helm', 'boots'],
      bonuses: {
        2: { defense: 30, hp: 100, description: '+30 DEF, +100 HP' },
        3: { defense: 50, hp: 200, damageReduction: 0.05, description: '+50 DEF, +200 HP, +5% Damage Reduction' },
        4: { defense: 80, hp: 300, damageReduction: 0.10, hpRegen: 5, description: '+80 DEF, +300 HP, +10% Damage Reduction, +5 HP/sec' },
        5: { defense: 120, hp: 500, damageReduction: 0.15, hpRegen: 10, description: '+120 DEF, +500 HP, +15% Damage Reduction, +10 HP/sec' }
      }
    },
    'Warden\'s Fortress': {
      name: 'Warden\'s Fortress',
      category: 'tank',
      pieces: ['armor', 'shield', 'cloak', 'gloves', 'ring1'],
      bonuses: {
        2: { stamina: 15, hp: 150, description: '+15 Stamina, +150 HP' },
        3: { stamina: 25, hp: 250, hpRegen: 8, description: '+25 Stamina, +250 HP, +8 HP/sec' },
        4: { stamina: 40, hp: 400, hpRegen: 12, damageReduction: 0.08, description: '+40 Stamina, +400 HP, +12 HP/sec, +8% Damage Reduction' },
        5: { stamina: 60, hp: 600, hpRegen: 20, damageReduction: 0.12, description: '+60 Stamina, +600 HP, +20 HP/sec, +12% Damage Reduction' }
      }
    }
  },
  
  // HEALER SETS
  healer: {
    'Lifebinder\'s Grace': {
      name: 'Lifebinder\'s Grace',
      category: 'healer',
      pieces: ['weapon', 'armor', 'accessory', 'cloak', 'ring1'],
      bonuses: {
        2: { intellect: 20, healingPower: 15, description: '+20 Intellect, +15 Healing Power' },
        3: { intellect: 35, healingPower: 30, hpRegen: 10, description: '+35 Intellect, +30 Healing Power, +10 HP/sec' },
        4: { intellect: 55, healingPower: 50, hpRegen: 15, spellDamage: 0.10, description: '+55 Intellect, +50 Healing Power, +15 HP/sec, +10% Spell Damage' },
        5: { intellect: 80, healingPower: 75, hpRegen: 25, spellDamage: 0.15, description: '+80 Intellect, +75 Healing Power, +25 HP/sec, +15% Spell Damage' }
      }
    },
    'Divine Sanctuary': {
      name: 'Divine Sanctuary',
      category: 'healer',
      pieces: ['weapon', 'armor', 'helm', 'gloves', 'ring2'],
      bonuses: {
        2: { wisdom: 15, hp: 120, description: '+15 Wisdom, +120 HP' },
        3: { wisdom: 25, hp: 200, healingPower: 20, description: '+25 Wisdom, +200 HP, +20 Healing Power' },
        4: { wisdom: 40, hp: 320, healingPower: 35, hpRegen: 12, description: '+40 Wisdom, +320 HP, +35 Healing Power, +12 HP/sec' },
        5: { wisdom: 60, hp: 500, healingPower: 55, hpRegen: 20, description: '+60 Wisdom, +500 HP, +55 Healing Power, +20 HP/sec' }
      }
    }
  },
  
  // PHYSICAL DPS SETS
  physicalDps: {
    'Berserker\'s Wrath': {
      name: 'Berserker\'s Wrath',
      category: 'physicalDps',
      pieces: ['weapon', 'armor', 'gloves', 'boots', 'ring1'],
      bonuses: {
        2: { strength: 25, attack: 20, description: '+25 Strength, +20 Attack' },
        3: { strength: 40, attack: 35, meleeDamage: 0.10, description: '+40 Strength, +35 Attack, +10% Melee Damage' },
        4: { strength: 60, attack: 55, meleeDamage: 0.15, critChance: 0.05, description: '+60 Strength, +55 Attack, +15% Melee Damage, +5% Crit' },
        5: { strength: 85, attack: 80, meleeDamage: 0.20, critChance: 0.10, description: '+85 Strength, +80 Attack, +20% Melee Damage, +10% Crit' }
      }
    },
    'Assassin\'s Shadow': {
      name: 'Assassin\'s Shadow',
      category: 'physicalDps',
      pieces: ['weapon', 'armor', 'cloak', 'gloves', 'ring2'],
      bonuses: {
        2: { dexterity: 20, attack: 15, description: '+20 Dexterity, +15 Attack' },
        3: { dexterity: 35, attack: 30, critChance: 0.08, description: '+35 Dexterity, +30 Attack, +8% Crit' },
        4: { dexterity: 55, attack: 50, critChance: 0.12, meleeDamage: 0.12, description: '+55 Dexterity, +50 Attack, +12% Crit, +12% Melee Damage' },
        5: { dexterity: 80, attack: 75, critChance: 0.18, meleeDamage: 0.18, description: '+80 Dexterity, +75 Attack, +18% Crit, +18% Melee Damage' }
      }
    }
  },
  
  // CASTER DPS SETS
  casterDps: {
    'Archmage\'s Power': {
      name: 'Archmage\'s Power',
      category: 'casterDps',
      pieces: ['weapon', 'armor', 'accessory', 'helm', 'ring1'],
      bonuses: {
        2: { intellect: 25, spellDamage: 0.10, description: '+25 Intellect, +10% Spell Damage' },
        3: { intellect: 40, spellDamage: 0.15, attack: 20, description: '+40 Intellect, +15% Spell Damage, +20 Attack' },
        4: { intellect: 60, spellDamage: 0.20, attack: 35, critChance: 0.05, description: '+60 Intellect, +20% Spell Damage, +35 Attack, +5% Crit' },
        5: { intellect: 85, spellDamage: 0.25, attack: 55, critChance: 0.10, description: '+85 Intellect, +25% Spell Damage, +55 Attack, +10% Crit' }
      }
    },
    'Warlock\'s Corruption': {
      name: 'Warlock\'s Corruption',
      category: 'casterDps',
      pieces: ['weapon', 'armor', 'cloak', 'gloves', 'ring2'],
      bonuses: {
        2: { intellect: 20, attack: 15, description: '+20 Intellect, +15 Attack' },
        3: { intellect: 35, attack: 30, spellDamage: 0.12, description: '+35 Intellect, +30 Attack, +12% Spell Damage' },
        4: { intellect: 55, attack: 50, spellDamage: 0.18, hp: 200, description: '+55 Intellect, +50 Attack, +18% Spell Damage, +200 HP' },
        5: { intellect: 80, attack: 75, spellDamage: 0.25, hp: 350, description: '+80 Intellect, +75 Attack, +25% Spell Damage, +350 HP' }
      }
    }
  }
};

export interface SetBonuses {
  attack: number;
  defense: number;
  hp: number;
  intellect: number;
  strength: number;
  dexterity: number;
  wisdom: number;
  stamina: number;
  healingPower: number;
  spellDamage: number;
  meleeDamage: number;
  hpRegen: number;
  damageReduction: number;
  critChance: number;
}

/**
 * Calculate set bonuses for a hero based on equipped items
 */
export function calculateSetBonuses(
  equipment: Equipment | undefined,
  role: string
): SetBonuses {
  const bonuses: SetBonuses = {
    attack: 0,
    defense: 0,
    hp: 0,
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
    critChance: 0
  };
  
  if (!equipment) return bonuses;
  
  // Determine category
  const roleLower = role.toLowerCase();
  const tankRoles = ['guardian', 'paladin', 'warden', 'bloodknight', 'vanguard', 'brewmaster', 'crusader', 'knight'];
  const healerRoles = ['cleric', 'atoner', 'druid', 'lightbringer', 'shaman', 'mistweaver', 'chronomancer', 'bard', 'priest'];
  const meleeDpsRoles = ['berserker', 'crusader', 'assassin', 'reaper', 'bladedancer', 'monk', 'stormwarrior', 'hunter'];
  
  let categoryKey: keyof typeof EQUIPMENT_SETS = 'tank';
  if (tankRoles.includes(roleLower)) {
    categoryKey = 'tank';
  } else if (healerRoles.includes(roleLower)) {
    categoryKey = 'healer';
  } else if (meleeDpsRoles.includes(roleLower)) {
    categoryKey = 'physicalDps';
  } else {
    categoryKey = 'casterDps';
  }
  
  const setsForCategory = EQUIPMENT_SETS[categoryKey] || {};
  
  // Count pieces for each set
  const setCounts: Record<string, number> = {};
  
  Object.keys(setsForCategory).forEach(setName => {
    const set = setsForCategory[setName as keyof typeof setsForCategory];
    let pieceCount = 0;
    
    set.pieces.forEach(slot => {
      const item = equipment[slot];
      if (item && item.setName === setName) {
        pieceCount++;
      }
    });
    
    if (pieceCount > 0) {
      setCounts[setName] = pieceCount;
    }
  });
  
  // Apply bonuses from each set
  Object.keys(setCounts).forEach(setName => {
    const pieceCount = setCounts[setName];
    const set = setsForCategory[setName as keyof typeof setsForCategory];
    
    if (!set || !set.bonuses) return;
    
    // Find the highest bonus tier we qualify for
    let activeBonus = null;
    for (let tier = 5; tier >= 2; tier--) {
      if (pieceCount >= tier && set.bonuses[tier]) {
        activeBonus = set.bonuses[tier];
        break;
      }
    }
    
    if (activeBonus) {
      // Apply all bonuses from this set
      if (activeBonus.attack) bonuses.attack += activeBonus.attack;
      if (activeBonus.defense) bonuses.defense += activeBonus.defense;
      if (activeBonus.hp) bonuses.hp += activeBonus.hp;
      if (activeBonus.intellect) bonuses.intellect += activeBonus.intellect;
      if (activeBonus.strength) bonuses.strength += activeBonus.strength;
      if (activeBonus.dexterity) bonuses.dexterity += activeBonus.dexterity;
      if (activeBonus.wisdom) bonuses.wisdom += activeBonus.wisdom;
      if (activeBonus.stamina) bonuses.stamina += activeBonus.stamina;
      if (activeBonus.healingPower) bonuses.healingPower += activeBonus.healingPower;
      if (activeBonus.spellDamage) bonuses.spellDamage += activeBonus.spellDamage;
      if (activeBonus.meleeDamage) bonuses.meleeDamage += activeBonus.meleeDamage;
      if (activeBonus.hpRegen) bonuses.hpRegen += activeBonus.hpRegen;
      if (activeBonus.damageReduction) bonuses.damageReduction += activeBonus.damageReduction;
      if (activeBonus.critChance) bonuses.critChance += activeBonus.critChance;
    }
  });
  
  return bonuses;
}








