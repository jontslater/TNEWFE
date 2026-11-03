/**
 * Loot rarity tables — shared by loot generation and drop simulators.
 */

export type LootRarityKey =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'mythic';

export interface LootRarityDefinition {
  dropChance: number;
  statMultiplier: number;
  color: string;
}

export const LOOT_RARITIES: Record<LootRarityKey, LootRarityDefinition> = {
  common: { dropChance: 0.6, statMultiplier: 1.0, color: '#9ca3af' },
  uncommon: { dropChance: 0.25, statMultiplier: 1.3, color: '#10b981' },
  rare: { dropChance: 0.1, statMultiplier: 1.6, color: '#3b82f6' },
  epic: { dropChance: 0.04, statMultiplier: 2.0, color: '#a855f7' },
  legendary: { dropChance: 0.01, statMultiplier: 2.5, color: '#f59e0b' },
  mythic: { dropChance: 0.001, statMultiplier: 4.0, color: '#ef4444' },
};

/** Simplified weights used by legacy fullCombatEngine loot stub (no mythic). */
export const LEGACY_ENGINE_LOOT_WEIGHTS: Array<{ rarity: LootRarityKey; weight: number }> = [
  { rarity: 'common', weight: 0.5 },
  { rarity: 'uncommon', weight: 0.3 },
  { rarity: 'rare', weight: 0.15 },
  { rarity: 'epic', weight: 0.04 },
  { rarity: 'legendary', weight: 0.01 },
];

/** Backend queue requirement gear score (rarity-only — not combat scaling score). */
export const QUEUE_RARITY_GEAR_VALUES: Record<string, number> = {
  common: 10,
  uncommon: 25,
  rare: 50,
  epic: 100,
  legendary: 200,
  mythic: 400,
};
