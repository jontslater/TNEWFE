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
    legendary: 'text-yellow-500'
  };
  return colors[rarity as keyof typeof colors] || 'text-gray-400';
}

export function getRarityBg(rarity: string): string {
  const colors = {
    common: 'bg-gray-600',
    uncommon: 'bg-green-600',
    rare: 'bg-blue-600',
    epic: 'bg-purple-600',
    legendary: 'bg-yellow-600'
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
