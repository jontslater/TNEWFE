/**
 * Raid System Utility
 * Handles raid wave progression, boss mechanics, and rewards
 */

export interface RaidBossMechanic {
  name: string;
  description: string;
  type: 'single-target' | 'aoe' | 'adds' | 'tank-buster' | 'defensive' | 'heal' | 'pull' | 'mechanic' | 'debuff' | 'enrage';
  cooldown?: number;
  triggerAt?: number | number[]; // HP percentage (0.0 to 1.0)
  permanent?: boolean;
  timer?: number; // For enrage timers
}

export interface RaidBoss {
  name: string;
  hp: number;
  attack: number;
  defense: number;
  level: number;
  mechanics: RaidBossMechanic[];
}

export interface RaidData {
  id: string;
  name: string;
  difficulty: 'normal' | 'heroic' | 'mythic';
  minLevel: number;
  minItemScore: number;
  minPlayers: number;
  maxPlayers: number;
  waves: number;
  description: string;
  boss: RaidBoss;
  rewards: {
    gold: number;
    tokens: number;
    experience: number;
    guaranteedLoot: string[];
  };
  estimatedDuration: number;
}

export interface RaidInstance {
  raidId: string;
  currentWave: number;
  maxWaves: number;
  bossHp: number;
  bossMaxHp: number;
  bossMechanicsTriggered: Set<string>; // Track which mechanics have been triggered
  mechanicCooldowns: Map<string, number>; // Track mechanic cooldowns
  startTime: number;
  enrageTimer?: number; // For enrage mechanics
}

/**
 * Check if a boss mechanic should trigger based on HP threshold
 */
export function shouldTriggerMechanic(
  mechanic: RaidBossMechanic,
  currentHp: number,
  maxHp: number,
  alreadyTriggered: Set<string>
): boolean {
  if (!mechanic.triggerAt) return false;
  if (alreadyTriggered.has(mechanic.name)) return false;
  
  const hpPercent = currentHp / maxHp;
  const triggers = Array.isArray(mechanic.triggerAt) ? mechanic.triggerAt : [mechanic.triggerAt];
  
  return triggers.some(trigger => {
    // Trigger when HP drops below the threshold
    return hpPercent <= trigger;
  });
}

/**
 * Check if a mechanic is off cooldown
 */
export function isMechanicOffCooldown(
  mechanic: RaidBossMechanic,
  mechanicCooldowns: Map<string, number>,
  currentTime: number
): boolean {
  if (!mechanic.cooldown) return true; // No cooldown means always available
  
  const lastUsed = mechanicCooldowns.get(mechanic.name);
  if (!lastUsed) return true; // Never used, so available
  
  return (currentTime - lastUsed) >= mechanic.cooldown;
}

/**
 * Calculate raid enemy scaling based on difficulty and wave
 */
export function calculateRaidEnemyStats(
  baseHp: number,
  baseAttack: number,
  baseDefense: number,
  difficulty: 'normal' | 'heroic' | 'mythic',
  waveNumber: number,
  totalWaves: number
): { hp: number; attack: number; defense: number } {
  // Difficulty multipliers
  const difficultyMultipliers = {
    normal: 1.0,
    heroic: 1.5,
    mythic: 2.5
  };
  
  const difficultyMultiplier = difficultyMultipliers[difficulty];
  
  // Wave scaling (later waves are stronger)
  const waveMultiplier = 1 + ((waveNumber - 1) / totalWaves) * 0.3; // 0-30% increase per wave
  
  return {
    hp: Math.floor(baseHp * difficultyMultiplier * waveMultiplier),
    attack: Math.floor(baseAttack * difficultyMultiplier * waveMultiplier),
    defense: Math.floor(baseDefense * difficultyMultiplier * waveMultiplier)
  };
}

/**
 * Calculate boss stats with difficulty scaling
 */
export function calculateBossStats(
  boss: RaidBoss,
  difficulty: 'normal' | 'heroic' | 'mythic'
): { hp: number; attack: number; defense: number } {
  const difficultyMultipliers = {
    normal: 1.0,
    heroic: 1.8,
    mythic: 3.0
  };
  
  const multiplier = difficultyMultipliers[difficulty];
  
  return {
    hp: Math.floor(boss.hp * multiplier),
    attack: Math.floor(boss.attack * multiplier),
    defense: Math.floor(boss.defense * multiplier)
  };
}

/**
 * Generate raid wave enemies
 * Returns enemy types and counts for a specific wave
 */
export function generateRaidWaveEnemies(
  waveNumber: number,
  totalWaves: number,
  difficulty: 'normal' | 'heroic' | 'mythic'
): Array<{ name: string; count: number }> {
  // Enemy pool for raid waves
  const enemyPool = [
    { name: 'Goblin', weight: 3 },
    { name: 'Orc', weight: 2 },
    { name: 'Skeleton', weight: 2 },
    { name: 'Imp', weight: 2 },
    { name: 'Witch', weight: 1 },
    { name: 'Mage', weight: 1 }
  ];
  
  // Heroic and Mythic add more dangerous enemies
  if (difficulty === 'heroic' || difficulty === 'mythic') {
    enemyPool.push(
      { name: 'Demon', weight: 1 },
      { name: 'Dragon', weight: 0.5 }
    );
  }
  
  // Calculate enemy count (scales with wave)
  const baseCount = 2 + Math.floor(waveNumber / 2);
  const enemyCount = Math.min(baseCount, 5); // Cap at 5 enemies per wave
  
  // Select random enemies based on weights
  const selectedEnemies: Array<{ name: string; count: number }> = [];
  const totalWeight = enemyPool.reduce((sum, e) => sum + e.weight, 0);
  
  for (let i = 0; i < enemyCount; i++) {
    let random = Math.random() * totalWeight;
    for (const enemy of enemyPool) {
      random -= enemy.weight;
      if (random <= 0) {
        const existing = selectedEnemies.find(e => e.name === enemy.name);
        if (existing) {
          existing.count++;
        } else {
          selectedEnemies.push({ name: enemy.name, count: 1 });
        }
        break;
      }
    }
  }
  
  return selectedEnemies;
}

/**
 * Calculate raid rewards
 */
export function calculateRaidRewards(
  raidData: RaidData,
  participants: number
): {
  gold: number;
  tokens: number;
  experience: number;
  lootCount: number;
} {
  // Base rewards scaled by participant count (more players = slightly more rewards per player)
  const participantBonus = 1 + (participants - raidData.minPlayers) * 0.1; // 10% bonus per extra player
  
  return {
    gold: Math.floor(raidData.rewards.gold * participantBonus),
    tokens: Math.floor(raidData.rewards.tokens * participantBonus),
    experience: Math.floor(raidData.rewards.experience * participantBonus),
    lootCount: 2 + Math.floor(participants / 2) // 2-4 guaranteed loot pieces
  };
}









