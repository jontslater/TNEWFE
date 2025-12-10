export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

export function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

export function getRarityColor(rarity: string): string {
  const colors = {
    common: 'text-gray-400',
    uncommon: 'text-green-500',
    rare: 'text-blue-500',
    epic: 'text-purple-500',
    legendary: 'text-yellow-500',
    mythic: 'text-red-500'
  };
  return colors[rarity as keyof typeof colors] || 'text-gray-400';
}

export function getRarityHexColor(rarity: string): string {
  const colors = {
    common: '#9ca3af',
    uncommon: '#10b981',
    rare: '#3b82f6',
    epic: '#a855f7',
    legendary: '#f59e0b',
    mythic: '#ef4444' // Red for mythic
  };
  return colors[rarity as keyof typeof colors] || '#9ca3af';
}

export function getRarityBg(rarity: string): string {
  const colors = {
    common: 'bg-gray-600',
    uncommon: 'bg-green-600',
    rare: 'bg-blue-600',
    epic: 'bg-purple-600',
    legendary: 'bg-yellow-600',
    mythic: 'bg-red-600'
  };
  return colors[rarity as keyof typeof colors] || 'bg-gray-600';
}

export function getRoleColor(role: string): string {
  const roleType = role.toLowerCase();
  
  if (['guardian', 'paladin', 'warden', 'bloodknight', 'vanguard', 'monk'].includes(roleType)) {
    return 'text-tank';
  }
  if (['cleric', 'atoner', 'druid', 'lightbringer', 'spirit', 'mistweaver', 'chronomender'].includes(roleType)) {
    return 'text-healer';
  }
  return 'text-dps';
}

export function getRoleBg(role: string): string {
  const roleType = role.toLowerCase();
  
  if (['guardian', 'paladin', 'warden', 'bloodknight', 'vanguard', 'monk'].includes(roleType)) {
    return 'bg-tank';
  }
  if (['cleric', 'atoner', 'druid', 'lightbringer', 'spirit', 'mistweaver', 'chronomender'].includes(roleType)) {
    return 'bg-healer';
  }
  return 'bg-dps';
}

export function getItemScore(equipment: any): number {
  let score = 0;
  
  Object.values(equipment).forEach((item: any) => {
    if (item) {
      // Match backend calculation formula
      const baseScore = (item.attack || 0) + (item.defense || 0) + ((item.hp || 0) / 2);
      const rarityBonus = item.rarity === 'legendary' ? 1.5 : 
                          item.rarity === 'epic' ? 1.3 : 
                          item.rarity === 'rare' ? 1.1 : 1.0;
      const procBonus = (item.procEffects?.length || 0) * 50;
      score += Math.floor((baseScore * rarityBonus) + procBonus);
    }
  });
  
  return Math.floor(score);
}

/**
 * Calculate max sockets for an item based on rarity and slot
 * Matches backend logic in professions.js
 */
export function getMaxSockets(rarity: string, slot: string): number {
  const socketRules: Record<string, Record<string, number>> = {
    weapon: {
      common: 0,
      uncommon: 0,
      rare: 1,
      epic: 2,
      legendary: 2,
      mythic: 3
    },
    armor: {
      common: 0,
      uncommon: 0,
      rare: 1,
      epic: 2,
      legendary: 2,
      mythic: 3
    },
    accessory: {
      common: 0,
      uncommon: 0,
      rare: 1,
      epic: 1,
      legendary: 2,
      mythic: 2
    },
    shield: {
      common: 0,
      uncommon: 0,
      rare: 1,
      epic: 1,
      legendary: 2,
      mythic: 2
    },
    default: {
      common: 0,
      uncommon: 0,
      rare: 0,
      epic: 1,
      legendary: 1,
      mythic: 2
    }
  };
  
  const slotCategory = socketRules[slot] || socketRules.default;
  return slotCategory[rarity] || 0;
}

/**
 * Get gem color for display
 */
export function getGemColor(gemType: string): string {
  const colors: Record<string, string> = {
    ruby: '#ef4444',
    sapphire: '#3b82f6',
    emerald: '#10b981',
    diamond: '#fbbf24'
  };
  return colors[gemType] || '#9ca3af';
}
