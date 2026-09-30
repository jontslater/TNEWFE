/**
 * Stats calculation utilities for overlay
 * Pure functions for calculating hero/enemy stats, gear scores, and bonuses
 */

import type { OverlayHero } from '../types/overlay';

export const getThreatWeight = (hero: OverlayHero): number => {
  const roleWeights: Record<string, number> = {
    guardian: 5.0,
    paladin: 4.5,
    warden: 4.0,
    bloodknight: 4.0,
    vanguard: 4.5,
    brewmaster: 4.0
  };
  
  return roleWeights[hero.role?.toLowerCase()] || 1.0;
};

export const calculateGearScore = (hero: OverlayHero): number => {
  if (!hero.equipment) return 0;
  
  const slots = ['weapon', 'armor', 'accessory', 'helm', 'cloak', 'gloves', 'ring1', 'ring2', 'shield'];
  let totalScore = 0;
  
  slots.forEach(slot => {
    const item = (hero.equipment as any)?.[slot];
    if (!item) return;
    
    const baseScore = (item.attack || 0) + (item.defense || 0) + (item.hp || 0) * 0.5;
    const rarityMult: Record<string, number> = {
      common: 1,
      uncommon: 1.2,
      rare: 1.5,
      epic: 2,
      legendary: 3,
      mythic: 4
    };
    
    const mult = rarityMult[item.rarity?.toLowerCase()] || 1;
    totalScore += baseScore * mult;
  });
  
  return Math.floor(totalScore);
};

export const calculateAverageGearScore = (heroes: OverlayHero[]): number => {
  if (heroes.length === 0) return 0;
  const total = heroes.reduce((sum, hero) => sum + calculateGearScore(hero), 0);
  return Math.floor(total / heroes.length);
};

export const getFounderGoldMultiplier = (founderPackTier: string | null | undefined): number => {
  if (!founderPackTier) return 1.0;
  
  const tierMultipliers: Record<string, number> = {
    bronze: 1.05,
    silver: 1.10,
    gold: 1.15,
    platinum: 1.20,
    diamond: 1.25
  };
  
  return tierMultipliers[founderPackTier.toLowerCase()] || 1.0;
};

export const calculateMaxXp = (level: number): number => {
  const baseXp = 100;
  return Math.floor(baseXp * Math.pow(level, 1.5));
};

export const calculateItemPower = (item: any): number => {
  if (!item) return 0;
  
  const baseValue = (item.attack || 0) + (item.defense || 0) + (item.hp || 0) * 0.5;
  const rarityMult: Record<string, number> = {
    common: 1,
    uncommon: 1.2,
    rare: 1.5,
    epic: 2.0,
    legendary: 3.0,
    mythic: 4.0
  };
  
  return baseValue * (rarityMult[item.rarity?.toLowerCase()] || 1);
};

export const calculateItemImprovement = (
  newItem: any,
  currentItem: any | null,
  hero: OverlayHero,
  heroEquipment: any
): number => {
  const newPower = calculateItemPower(newItem);
  const oldPower = currentItem ? calculateItemPower(currentItem) : 0;
  
  if (oldPower === 0) return newPower > 0 ? 1.0 : 0;
  
  const role = hero.role?.toLowerCase() || '';
  const isTank = ['guardian', 'paladin', 'warden', 'bloodknight', 'vanguard', 'brewmaster'].includes(role);
  const isHealer = ['cleric', 'atoner', 'druid', 'lightbringer', 'shaman', 'mistweaver', 'chronomancer', 'bard'].includes(role);
  const isCaster = ['mage', 'warlock', 'necromancer', 'ranger', 'shadowpriest', 'mooncaller', 'stormcaller', 'frostmage', 'firemage', 'dragonsorcerer'].includes(role);
  
  let newScore = 0;
  let oldScore = 0;
  
  if (isTank) {
    newScore = (newItem.defense || 0) * 2 + (newItem.hp || 0) + (newItem.attack || 0) * 0.5;
    oldScore = currentItem ? (currentItem.defense || 0) * 2 + (currentItem.hp || 0) + (currentItem.attack || 0) * 0.5 : 0;
  } else if (isHealer) {
    newScore = (newItem.spellPower || newItem.attack || 0) * 1.5 + (newItem.defense || 0) + (newItem.hp || 0) * 0.8;
    oldScore = currentItem ? (currentItem.spellPower || currentItem.attack || 0) * 1.5 + (currentItem.defense || 0) + (currentItem.hp || 0) * 0.8 : 0;
  } else if (isCaster) {
    newScore = (newItem.spellPower || newItem.attack || 0) * 2 + (newItem.defense || 0) * 0.5 + (newItem.hp || 0) * 0.5;
    oldScore = currentItem ? (currentItem.spellPower || currentItem.attack || 0) * 2 + (currentItem.defense || 0) * 0.5 + (currentItem.hp || 0) * 0.5 : 0;
  } else {
    newScore = (newItem.attack || 0) * 2 + (newItem.defense || 0) + (newItem.hp || 0) * 0.5;
    oldScore = currentItem ? (currentItem.attack || 0) * 2 + (currentItem.defense || 0) + (currentItem.hp || 0) * 0.5 : 0;
  }
  
  if (oldScore === 0) return newScore > 0 ? 1.0 : 0;
  return (newScore - oldScore) / oldScore;
};
