/**
 * Upgrade Stat Options System
 * Generates random stat bonuses for item upgrades
 */

export type UpgradeStatType = 
  | 'attack' 
  | 'defense' 
  | 'hp' 
  | 'critChance' 
  | 'critDamage' 
  | 'healingPower'
  | 'spellDamage';

export interface UpgradeStatOption {
  type: UpgradeStatType;
  value: number; // Percentage bonus (e.g., 5 = 5%)
  displayName: string;
  description: string;
}

/**
 * Generate 4 random stat options for upgrading
 * Each option has different value ranges based on stat type
 */
export function generateUpgradeStatOptions(): UpgradeStatOption[] {
  const allOptions: UpgradeStatOption[] = [
    // Primary stats - higher percentages (5-10%)
    {
      type: 'attack',
      value: getRandomValue(5, 10),
      displayName: 'Attack',
      description: 'Increases damage dealt'
    },
    {
      type: 'defense',
      value: getRandomValue(5, 10),
      displayName: 'Defense',
      description: 'Reduces damage taken'
    },
    {
      type: 'hp',
      value: getRandomValue(5, 10),
      displayName: 'Health',
      description: 'Increases maximum HP'
    },
    // Secondary stats - lower percentages but more valuable (3-8%)
    {
      type: 'critChance',
      value: getRandomValue(3, 8),
      displayName: 'Crit Chance',
      description: 'Increases critical hit chance'
    },
    {
      type: 'critDamage',
      value: getRandomValue(5, 15),
      displayName: 'Crit Damage',
      description: 'Increases critical hit damage'
    },
    {
      type: 'healingPower',
      value: getRandomValue(5, 10),
      displayName: 'Healing Power',
      description: 'Increases healing effectiveness'
    },
    {
      type: 'spellDamage',
      value: getRandomValue(5, 10),
      displayName: 'Spell Damage',
      description: 'Increases spell/magic damage'
    }
  ];

  // Randomly select 4 unique options
  const selected: UpgradeStatOption[] = [];
  const available = [...allOptions];
  
  while (selected.length < 4 && available.length > 0) {
    const randomIndex = Math.floor(Math.random() * available.length);
    selected.push(available.splice(randomIndex, 1)[0]);
  }
  
  return selected;
}

/**
 * Get random integer between min and max (inclusive)
 */
function getRandomValue(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Calculate reroll cost based on current upgrade level
 * Higher levels cost more to reroll
 */
export function calculateRerollCost(currentUpgradeLevel: number, baseCost: number = 50): number {
  // Cost scales with upgrade level
  // Level 0: baseCost (50g)
  // Level 5: ~380g
  // Level 10: ~2,900g
  return Math.floor(baseCost * Math.pow(1.5, currentUpgradeLevel));
}

/**
 * Format stat option for display
 */
export function formatStatOption(option: UpgradeStatOption): string {
  return `+${option.value}% ${option.displayName}`;
}

/**
 * Get stat bonus icon/emoji for display
 */
export function getStatIcon(statType: UpgradeStatType): string {
  const icons: Record<UpgradeStatType, string> = {
    attack: '⚔️',
    defense: '🛡️',
    hp: '❤️',
    critChance: '🎯',
    critDamage: '💥',
    healingPower: '💚',
    spellDamage: '✨'
  };
  return icons[statType] || '⭐';
}
