/**
 * Loot Generation System
 * Generates class-specific equipment items when enemies are defeated
 * Supports: Tanks, Healers, Melee DPS, Ranged DPS, Caster DPS
 */

import { Item } from '../types/Hero';

// Loot rarity drop chances
const LOOT_RARITIES = {
  common: { dropChance: 0.60, statMultiplier: 1.0, color: '#9ca3af' },
  uncommon: { dropChance: 0.25, statMultiplier: 1.3, color: '#10b981' },
  rare: { dropChance: 0.10, statMultiplier: 1.6, color: '#3b82f6' },
  epic: { dropChance: 0.04, statMultiplier: 2.0, color: '#a855f7' },
  legendary: { dropChance: 0.01, statMultiplier: 2.5, color: '#f59e0b' },
  mythic: { dropChance: 0.001, statMultiplier: 4.0, color: '#ef4444' } // Red color for mythic
};

// Equipment slots by category
const EQUIPMENT_SLOTS = ['weapon', 'armor', 'accessory', 'helm', 'cloak', 'gloves', 'ring1', 'ring2', 'boots'];
const TANK_EQUIPMENT_SLOTS = ['weapon', 'armor', 'accessory', 'shield', 'helm', 'cloak', 'gloves', 'ring1', 'ring2', 'boots'];

// Melee DPS roles (physical)
const MELEE_DPS_ROLES = ['berserker', 'crusader', 'assassin', 'reaper', 'bladedancer', 'monk', 'stormwarrior', 'hunter'];

// Caster DPS roles (spell-based)
const CASTER_DPS_ROLES = ['mage', 'warlock', 'necromancer', 'ranger', 'shadowpriest', 'mooncaller', 'stormcaller', 'frostmage', 'firemage', 'dragonsorcerer'];

// Loot templates by category with proper stats
const LOOT_TEMPLATES = {
  tank: {
    weapon: { name: 'Sword', attack: 3, defense: 2, hp: 6 },
    armor: { name: 'Plate Armor', attack: 0, defense: 7, hp: 24 },
    accessory: { name: 'Trinket', attack: 0, defense: 3, hp: 9 },
    shield: { name: 'Shield', attack: 0, defense: 9, hp: 18 },
    helm: { name: 'Helm', attack: 0, defense: 5, hp: 15 },
    cloak: { name: 'Cloak', attack: 0, defense: 4, hp: 12 },
    gloves: { name: 'Gauntlets', attack: 2, defense: 3, hp: 9 },
    ring1: { name: 'Ring', attack: 0, defense: 2, hp: 6 },
    ring2: { name: 'Ring', attack: 0, defense: 2, hp: 6 },
    boots: { name: 'Boots', attack: 0, defense: 3, hp: 9 }
  },
  healer: {
    weapon: { name: 'Staff', attack: 2, defense: 1, hp: 6 },
    armor: { name: 'Cloth Robes', attack: 1, defense: 3, hp: 9 },
    accessory: { name: 'Talisman', attack: 1, defense: 2, hp: 12 },
    helm: { name: 'Hood', attack: 1, defense: 2, hp: 6 },
    cloak: { name: 'Mantle', attack: 1, defense: 2, hp: 6 },
    gloves: { name: 'Gloves', attack: 1, defense: 1, hp: 6 },
    ring1: { name: 'Ring', attack: 1, defense: 1, hp: 3 },
    ring2: { name: 'Ring', attack: 1, defense: 1, hp: 3 },
    boots: { name: 'Sandals', attack: 0, defense: 1, hp: 6 }
  },
  meleeDps: {
    weapon: { name: 'Blade', attack: 7, defense: 0, hp: 0 },
    armor: { name: 'Leather Armor', attack: 3, defense: 2, hp: 6 },
    accessory: { name: 'Amulet', attack: 5, defense: 1, hp: 3 },
    helm: { name: 'Helmet', attack: 2, defense: 1, hp: 3 },
    cloak: { name: 'Cloak', attack: 2, defense: 1, hp: 3 },
    gloves: { name: 'Gloves', attack: 3, defense: 0, hp: 3 },
    ring1: { name: 'Ring', attack: 3, defense: 0, hp: 0 },
    ring2: { name: 'Ring', attack: 3, defense: 0, hp: 0 },
    boots: { name: 'Boots', attack: 2, defense: 1, hp: 3 }
  },
  casterDps: {
    weapon: { name: 'Wand', attack: 2, defense: 0, hp: 0 }, // Low attack, uses spell power
    armor: { name: 'Robe', attack: 1, defense: 1, hp: 3 },
    accessory: { name: 'Orb', attack: 1, defense: 0, hp: 0 },
    helm: { name: 'Crown', attack: 1, defense: 0, hp: 2 },
    cloak: { name: 'Mantle', attack: 1, defense: 1, hp: 2 },
    gloves: { name: 'Gloves', attack: 1, defense: 0, hp: 2 },
    ring1: { name: 'Ring', attack: 1, defense: 0, hp: 0 },
    ring2: { name: 'Ring', attack: 1, defense: 0, hp: 0 },
    boots: { name: 'Boots', attack: 0, defense: 1, hp: 2 }
  }
};

// Equipment Sets - Named sets with bonuses
const EQUIPMENT_SETS = {
  tank: {
    'Guardian\'s Bulwark': {
      pieces: ['weapon', 'armor', 'shield', 'helm', 'boots']
    },
    'Warden\'s Fortress': {
      pieces: ['armor', 'shield', 'cloak', 'gloves', 'ring1']
    }
  },
  healer: {
    'Lifebinder\'s Grace': {
      pieces: ['weapon', 'armor', 'accessory', 'cloak', 'ring1']
    },
    'Divine Sanctuary': {
      pieces: ['weapon', 'armor', 'helm', 'gloves', 'ring2']
    }
  },
  physicalDps: {
    'Berserker\'s Wrath': {
      pieces: ['weapon', 'armor', 'gloves', 'boots', 'ring1']
    },
    'Assassin\'s Shadow': {
      pieces: ['weapon', 'armor', 'cloak', 'gloves', 'ring2']
    }
  },
  casterDps: {
    'Archmage\'s Power': {
      pieces: ['weapon', 'armor', 'accessory', 'helm', 'ring1']
    },
    'Warlock\'s Corruption': {
      pieces: ['weapon', 'armor', 'cloak', 'gloves', 'ring2']
    }
  }
};

/**
 * Get hero category from role
 * Returns: 'tank', 'healer', 'meleeDps', or 'casterDps'
 */
function getHeroCategory(role: string): 'tank' | 'healer' | 'meleeDps' | 'casterDps' {
  const roleLower = role.toLowerCase();
  
  // Tank roles
  const tankRoles = ['guardian', 'paladin', 'warden', 'bloodknight', 'vanguard', 'brewmaster', 'crusader', 'knight'];
  if (tankRoles.includes(roleLower)) return 'tank';
  
  // Healer roles
  const healerRoles = ['cleric', 'atoner', 'druid', 'lightbringer', 'shaman', 'mistweaver', 'chronomancer', 'bard', 'priest'];
  if (healerRoles.includes(roleLower)) return 'healer';
  
  // Caster DPS roles
  if (CASTER_DPS_ROLES.includes(roleLower)) return 'casterDps';
  
  // Default to melee DPS (includes melee roles)
  return 'meleeDps';
}

export interface GenerateLootOptions {
  enemyLevel?: number;
  waveCount?: number;
  isBoss?: boolean;
  forceSetPiece?: boolean;
  viewerLootBonus?: number; // Viewer bonus multiplier (0-0.3, max 30%)
  isRaidOrDungeon?: boolean; // If true, use stronger mythic (4.0x) instead of token shop mythic (3.5x)
}

/**
 * Generate a loot item for a hero role
 */
export function generateLoot(
  role: string,
  options: GenerateLootOptions = {}
): Item | null {
  const { enemyLevel = 1, waveCount = 0, isBoss = false, forceSetPiece = false, viewerLootBonus = 0, isRaidOrDungeon = false } = options;
  
  // Get category (tank, healer, meleeDps, casterDps)
  const category = getHeroCategory(role);
  
  // Determine rarity
  const rand = Math.random();
  let rarity: keyof typeof LOOT_RARITIES = 'common';
  let cumulativeChance = 0;
  
  // Boss bonus: +20% better loot quality
  const bossBonus = isBoss ? 0.2 : 0;
  const waveBoost = Math.min(0.3, waveCount / 100); // Up to 30% boost
  // Viewer bonus: +0.2% per chatter, max 30% (from viewer bonus calculation)
  const viewerBonus = Math.min(0.3, viewerLootBonus || 0);
  const totalBonus = bossBonus + waveBoost + viewerBonus;
  
  // Adjust rarity chances with bonuses
  const adjustedRarities: Record<string, number> = {};
  for (const [rarityName, rarityData] of Object.entries(LOOT_RARITIES)) {
    adjustedRarities[rarityName] = rarityData.dropChance;
  }
  
  if (totalBonus > 0) {
    // Mythic can drop from raids/dungeons with high bonuses
    adjustedRarities.mythic += totalBonus * 0.05; // Small chance for mythic
    adjustedRarities.legendary += totalBonus * 0.25;
    adjustedRarities.epic += totalBonus * 0.3;
    adjustedRarities.rare += totalBonus * 0.2;
    adjustedRarities.uncommon += totalBonus * 0.1;
    adjustedRarities.common -= totalBonus * 0.9;
    adjustedRarities.common = Math.max(0.1, adjustedRarities.common);
  }
  
  // Normalize probabilities
  const total = Object.values(adjustedRarities).reduce((a, b) => a + b, 0);
  for (const key in adjustedRarities) {
    adjustedRarities[key] /= total;
  }
  
  // Select rarity
  for (const [rarityName, dropChance] of Object.entries(adjustedRarities)) {
    cumulativeChance += dropChance;
    if (rand <= cumulativeChance) {
      rarity = rarityName as keyof typeof LOOT_RARITIES;
      break;
    }
  }
  
  // Force rare+ for set pieces
  if (forceSetPiece && rarity === 'common') {
    rarity = 'rare';
  }
  
  // Get available slots
  const availableSlots = category === 'tank' ? TANK_EQUIPMENT_SLOTS : EQUIPMENT_SLOTS;
  const slot = availableSlots[Math.floor(Math.random() * availableSlots.length)] as Item['slot'];
  
  // Get template
  const template = LOOT_TEMPLATES[category][slot];
  if (!template) return null;
  
  // Calculate stats with rarity multiplier and level scaling
  let rarityData = LOOT_RARITIES[rarity];
  
  // Mythic from raids/dungeons is stronger (4.0x) than token shop mythic (3.5x)
  if (rarity === 'mythic' && isRaidOrDungeon) {
    rarityData = { ...rarityData, statMultiplier: 4.0 }; // Stronger raid/dungeon mythic
  }
  
  const levelMultiplier = 1 + (enemyLevel * 0.08);
  const totalMultiplier = levelMultiplier * rarityData.statMultiplier;
  
  const item: Item = {
    id: `loot-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name: template.name,
    slot: slot,
    rarity: rarity,
    attack: Math.floor(template.attack * totalMultiplier),
    defense: Math.floor(template.defense * totalMultiplier),
    hp: Math.floor(template.hp * totalMultiplier),
    color: rarityData.color
  };
  
  // Add primary stats based on category
  const primaryStatBase = Math.floor(2 + (rarityData.statMultiplier * Math.min(totalMultiplier, 3)));
  
  if (category === 'tank') {
    item.strength = Math.floor(primaryStatBase * 0.7);
    item.stamina = Math.floor(primaryStatBase * 1.3); // Tanks get more Stamina (HP)
  } else if (category === 'healer') {
    item.intellect = primaryStatBase; // Healers get Intellect
  } else if (category === 'meleeDps') {
    item.strength = primaryStatBase; // Melee DPS get Strength
    item.dexterity = Math.floor(primaryStatBase * 0.5); // Some Dexterity
  } else if (category === 'casterDps') {
    item.intellect = primaryStatBase; // Caster DPS get Intellect
    item.wisdom = Math.floor(primaryStatBase * 0.5); // Some Wisdom
  }
  
  // Add secondary stats for rare+ items
  if (rarity !== 'common' && rarity !== 'uncommon') {
    item.secondaryStats = {};
    
    const secondaryBase = rarityData.statMultiplier * Math.min(totalMultiplier, 3);
    
    if (category === 'tank') {
      item.secondaryStats.hpRegen = Math.min(Math.floor(2 + (secondaryBase * 1.5)), 20);
      if (rarity === 'epic' || rarity === 'legendary') {
        item.secondaryStats.damageReduction = Math.min(0.02 + (secondaryBase * 0.01), 0.15);
      }
    } else if (category === 'healer') {
      item.secondaryStats.healingPower = Math.min(Math.floor(3 + (secondaryBase * 2)), 30);
      // Healers also benefit from spell damage (for their offensive spells)
      if (rarity === 'epic' || rarity === 'legendary' || rarity === 'mythic') {
        item.secondaryStats.spellDamage = Math.min(Math.floor(2 + (secondaryBase * 1.5)) / 100, 0.20);
      }
      if (rarity === 'epic' || rarity === 'legendary') {
        item.secondaryStats.hpRegen = Math.min(Math.floor(2 + secondaryBase), 15);
      }
    } else if (category === 'meleeDps') {
      item.secondaryStats.meleeDamage = Math.min(Math.floor(3 + (secondaryBase * 2)), 30);
      if (rarity === 'legendary') {
        item.secondaryStats.critChance = Math.min((1 + secondaryBase) / 100, 0.05);
      }
    } else if (category === 'casterDps') {
      item.secondaryStats.spellDamage = Math.min(Math.floor(3 + (secondaryBase * 2)) / 100, 0.30);
      if (rarity === 'legendary') {
        item.secondaryStats.critChance = Math.min((1 + secondaryBase) / 100, 0.05);
      }
    }
  }
  
  // Assign set name for rare+ items from bosses/raids (or if forced)
  const canDropSetPiece = isBoss || forceSetPiece;
  if (rarity !== 'common' && canDropSetPiece) {
    // Determine set category key
    let setCategoryKey: keyof typeof EQUIPMENT_SETS = category;
    if (category === 'meleeDps') {
      setCategoryKey = 'physicalDps';
    } else if (category === 'casterDps') {
      setCategoryKey = 'casterDps';
    }
    
    const setsForCategory = EQUIPMENT_SETS[setCategoryKey] || {};
    const setNames = Object.keys(setsForCategory);
    
    if (setNames.length > 0) {
      // Randomly assign a set name
      const randomSet = setNames[Math.floor(Math.random() * setNames.length)];
      const set = setsForCategory[randomSet as keyof typeof setsForCategory];
      
      // Check if this slot is part of the set
      if (set && set.pieces.includes(slot)) {
        item.setName = randomSet;
      }
    }
  }
  
  // Add proc effects for rare+ items
  if (rarity !== 'common' && rarity !== 'uncommon') {
    const numProcs = rarity === 'legendary' ? 3 : rarity === 'epic' ? 2 : 1;
    const procs: any[] = [];
    
    // Define available procs by category
    const PROC_POOL: Record<string, any[]> = {
      tank: [
        { name: 'Thorns', effect: 'reflectDamage', chance: 0.20, value: 0.20, description: 'Reflect 20% damage' },
        { name: 'Fortified', effect: 'defenseBoost', chance: 0.15, value: 0.10, description: '+10% defense for 5s' },
        { name: 'Enduring', effect: 'healOnHit', chance: 0.10, value: 5, description: 'Heal 5 HP when hit' },
        { name: 'Bulwark', effect: 'damageReduction', chance: 0.12, value: 0.15, description: '-15% damage taken' }
      ],
      healer: [
        { name: 'Blessed', effect: 'healingBoost', chance: 0.15, value: 0.30, description: '+30% healing' },
        { name: 'Rejuvenating', effect: 'hpRegenBoost', chance: 0.20, value: 3, description: '+3 HP regen' },
        { name: 'Radiant', effect: 'groupHealBoost', chance: 0.08, value: 10, description: '+10 HP to group heal' }
      ],
      meleeDps: [
        { name: 'Vicious', effect: 'damageBoost', chance: 0.15, value: 0.12, description: '+12% damage' },
        { name: 'Brutal', effect: 'executeDamage', chance: 0.12, value: 0.25, description: '+25% vs <30% HP' },
        { name: 'Vampiric', effect: 'lifesteal', chance: 0.10, value: 0.10, description: '10% lifesteal' },
        { name: 'Swift', effect: 'extraAttack', chance: 0.10, value: 1, description: 'Extra attack' },
        { name: 'Deadly', effect: 'critChance', chance: 0.20, value: 0.15, description: '15% crit chance' }
      ],
      casterDps: [
        { name: 'Vicious', effect: 'damageBoost', chance: 0.15, value: 0.12, description: '+12% spell damage' },
        { name: 'Arcane', effect: 'spellPower', chance: 0.12, value: 0.15, description: '+15% spell power' },
        { name: 'Vampiric', effect: 'lifesteal', chance: 0.08, value: 0.08, description: '8% spell lifesteal' },
        { name: 'Deadly', effect: 'critChance', chance: 0.20, value: 0.15, description: '15% crit chance' }
      ]
    };
    
    const procPool = PROC_POOL[category] || [];
    const availableProcs = [...procPool]; // Copy to avoid mutations
    
    for (let i = 0; i < numProcs && availableProcs.length > 0; i++) {
      const procIndex = Math.floor(Math.random() * availableProcs.length);
      procs.push(availableProcs[procIndex]);
      availableProcs.splice(procIndex, 1); // Remove to prevent duplicates
    }
    
    if (procs.length > 0) {
      item.procEffects = procs;
    }
  }
  
  return item;
}

/**
 * Calculate item power score (for auto-equip comparison)
 * Accounts for primary stats, secondary stats, and rarity
 */
export function calculateItemPower(item: Item): number {
  if (!item) return 0;
  
  // Base stats
  let basePower = item.attack + item.defense + item.hp;
  
  // Primary stats (weighted)
  basePower += (item.strength || 0) * 2;
  basePower += (item.intellect || 0) * 2;
  basePower += (item.dexterity || 0) * 1.5;
  basePower += (item.wisdom || 0) * 1.5;
  basePower += (item.stamina || 0) * 3; // Stamina is valuable (HP)
  
  // Secondary stats (weighted)
  let secondaryPower = 0;
  if (item.secondaryStats) {
    secondaryPower += (item.secondaryStats.hpRegen || 0) * 10;
    secondaryPower += (item.secondaryStats.damageReduction || 0) * 1000;
    secondaryPower += (item.secondaryStats.critChance || 0) * 1500; // Crit chance is valuable
    secondaryPower += (item.secondaryStats.healingPower || 0) * 5;
    secondaryPower += (item.secondaryStats.spellDamage || 0) * 500;
    secondaryPower += (item.secondaryStats.meleeDamage || 0) * 500;
  }
  
  // Set bonus value (having a set name is valuable)
  const setBonus = item.setName ? 50 : 0;
  
  // Rarity multiplier
  const rarityMultiplier = {
    common: 1.0,
    uncommon: 1.3,
    rare: 1.6,
    epic: 2.0,
    legendary: 2.5
  }[item.rarity] || 1.0;
  
  return (basePower + secondaryPower + setBonus) * rarityMultiplier;
}

/**
 * Check if new item is better than current item
 */
export function isItemBetter(newItem: Item, currentItem: Item | undefined): boolean {
  if (!currentItem) return true;
  return calculateItemPower(newItem) > calculateItemPower(currentItem);
}
