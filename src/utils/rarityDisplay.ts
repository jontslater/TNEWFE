/**
 * Rarity Display Utilities
 * 
 * Consistent visual treatment for item rarity across the UI.
 * High-end loot is meant to be rare - make it feel special!
 */

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface RarityStyle {
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  label: string;
  emoji: string;
}

/**
 * Get visual styling for an item rarity
 */
export function getRarityStyle(rarity: ItemRarity): RarityStyle {
  const styles: Record<ItemRarity, RarityStyle> = {
    common: {
      color: '#9ca3af',
      bgColor: '#374151',
      borderColor: '#4b5563',
      glowColor: 'rgba(156, 163, 175, 0.3)',
      label: 'Common',
      emoji: '⚪',
    },
    uncommon: {
      color: '#4ade80',
      bgColor: '#065f46',
      borderColor: '#10b981',
      glowColor: 'rgba(74, 222, 128, 0.4)',
      label: 'Uncommon',
      emoji: '🟢',
    },
    rare: {
      color: '#60a5fa',
      bgColor: '#1e3a8a',
      borderColor: '#3b82f6',
      glowColor: 'rgba(96, 165, 250, 0.5)',
      label: 'Rare',
      emoji: '🔵',
    },
    epic: {
      color: '#a78bfa',
      bgColor: '#4c1d95',
      borderColor: '#8b5cf6',
      glowColor: 'rgba(167, 139, 250, 0.6)',
      label: 'Epic',
      emoji: '🟣',
    },
    legendary: {
      color: '#fbbf24',
      bgColor: '#78350f',
      borderColor: '#f59e0b',
      glowColor: 'rgba(251, 191, 36, 0.7)',
      label: 'Legendary',
      emoji: '🟡',
    },
    mythic: {
      color: '#f87171',
      bgColor: '#7f1d1d',
      borderColor: '#ef4444',
      glowColor: 'rgba(248, 113, 113, 0.8)',
      label: 'Mythic',
      emoji: '🔴',
    },
  };

  return styles[rarity] || styles.common;
}

/**
 * Create a loot drop announcement message for overlay
 * Returns HTML string for special rare+ drop announcements
 */
export function createLootDropAnnouncement(
  itemName: string,
  rarity: ItemRarity,
  heroName: string
): string | null {
  // Only announce rare and above
  if (!['rare', 'epic', 'legendary', 'mythic'].includes(rarity)) {
    return null;
  }

  const style = getRarityStyle(rarity);
  
  return `
    <div style="
      background: linear-gradient(135deg, ${style.bgColor}ee, #000000cc);
      border: 2px solid ${style.borderColor};
      border-radius: 12px;
      padding: 16px 24px;
      box-shadow: 0 0 30px ${style.glowColor}, inset 0 0 20px ${style.glowColor};
      animation: fadeInOut 4s ease-in-out;
    ">
      <div style="
        font-size: 24px;
        font-weight: bold;
        color: ${style.color};
        text-shadow: 0 0 10px ${style.glowColor};
        margin-bottom: 8px;
      ">
        ${style.emoji} ${style.label.toUpperCase()} DROP! ${style.emoji}
      </div>
      <div style="
        font-size: 18px;
        color: white;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
      ">
        ${heroName} looted: <span style="color: ${style.color};">${itemName}</span>
      </div>
    </div>
  `;
}

/**
 * Get Tailwind classes for rarity styling (for React components)
 */
export function getRarityClasses(rarity: ItemRarity): string {
  const classMap: Record<ItemRarity, string> = {
    common: 'text-gray-400 border-gray-600 bg-gray-800',
    uncommon: 'text-green-400 border-green-600 bg-green-900/30',
    rare: 'text-blue-400 border-blue-600 bg-blue-900/30',
    epic: 'text-purple-400 border-purple-600 bg-purple-900/30',
    legendary: 'text-yellow-400 border-yellow-600 bg-yellow-900/30',
    mythic: 'text-red-400 border-red-600 bg-red-900/30',
  };

  return classMap[rarity] || classMap.common;
}

/**
 * Hook point for future Twitch Bits/Subs benefits
 * 
 * This function can be extended to apply rarity boost multipliers based on:
 * - Twitch subscriber status (sub tiers: Prime, T1, T2, T3)
 * - Bits cheered in channel
 * - Founder pack tier
 * 
 * @param baseRarity - The base item rarity from drop table
 * @param userBenefits - Optional benefits object (to be implemented)
 * @returns Potentially upgraded rarity
 */
export function applyBenefitRarityBoost(
  baseRarity: ItemRarity,
  userBenefits?: {
    subscriberTier?: number; // 0 = none, 1 = Prime/T1, 2 = T2, 3 = T3
    bitsCheered?: number;
    founderTier?: string;
  }
): ItemRarity {
  // TODO: Implement rarity boost logic when Twitch Bits/Subs are added
  // Example logic (not implemented yet):
  // - T3 sub: 5% chance to upgrade rarity by one tier
  // - Bits milestones: Bonus rolls on loot tables
  // - Founder tiers: Permanent slight rarity boost
  
  return baseRarity; // No boost for now
}
