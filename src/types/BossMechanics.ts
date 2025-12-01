/**
 * Boss Mechanics Type Definitions
 * Defines types for boss abilities, phases, and mechanics execution
 */

export type MechanicType = 'cast' | 'instant' | 'channel' | 'aoe' | 'adds' | 'defensive' | 'tank-buster' | 'enrage' | 'environmental';
export type MechanicTarget = 'random' | 'tank' | 'lowest-hp' | 'highest-threat' | 'all' | 'highest-dps' | 'healer';

export interface BossMechanic {
  name: string;
  description?: string;
  type: MechanicType;
  castTime?: number; // milliseconds, required for 'cast' and 'channel' types
  channelDuration?: number; // milliseconds, for 'channel' type
  interruptible?: boolean; // Can be interrupted by players
  target: MechanicTarget;
  damage?: number; // Base damage value
  damageMultiplier?: number; // Multiplier of boss attack stat
  healing?: number; // For healing mechanics (rare)
  cooldown: number; // Cooldown in milliseconds
  phases?: number[]; // Which phases this mechanic is active (1-based)
  triggerAt?: number | number[]; // HP threshold(s) to trigger (0.0-1.0)
  adds?: AddSpawnDefinition; // For 'adds' type mechanics
  aoeRadius?: number; // For AoE mechanics
  aoeShape?: 'circle' | 'rectangle' | 'line'; // Shape of AoE
  debuff?: DebuffDefinition; // Debuff to apply
  buff?: BuffDefinition; // Buff to apply to boss
  enrageDamageIncrease?: number; // For enrage mechanics
  positionRequirement?: PositionRequirement; // For position-based mechanics
}

export interface AddSpawnDefinition {
  type: string; // Enemy type name
  count: number;
  spawnAt?: number; // HP threshold to spawn
  level?: number; // Add level (defaults to boss level - 5)
  hp?: number; // Add HP (defaults to calculated from level)
  attack?: number; // Add attack (defaults to calculated from level)
  defense?: number; // Add defense (defaults to calculated from level)
}

export interface DebuffDefinition {
  type: string;
  duration: number; // milliseconds
  stacks?: number; // Max stacks
  damage?: number; // Damage per tick
  tickInterval?: number; // Damage tick interval in milliseconds
}

export interface BuffDefinition {
  type: string;
  duration: number; // milliseconds
  attackIncrease?: number;
  defenseIncrease?: number;
  damageReduction?: number; // Percentage (0-1)
}

export interface PositionRequirement {
  type: 'safe-zone' | 'spread' | 'stack';
  radius?: number; // For spread/stack mechanics
}

export interface BossPhase {
  hpThreshold: number; // HP percentage (1.0 = 100%, 0.75 = 75%, etc.)
  mechanics: string[]; // Names of mechanics active in this phase
  adds?: AddSpawnDefinition;
  enrageTimer?: number; // Enrage timer in milliseconds (if phase has enrage)
}

export interface CastInfo {
  mechanic: BossMechanic;
  startTime: number; // Timestamp when cast started
  endTime: number; // Timestamp when cast will complete
  target?: string; // Target ID (hero or 'all')
  interrupted: boolean;
  progress: number; // 0-1, cast progress
}

export interface MechanicCooldown {
  mechanicName: string;
  lastUsed: number; // Timestamp
  cooldown: number; // Cooldown duration
}

export interface BossMechanicsState {
  currentPhase: number;
  phaseTransitions: Map<number, number>; // Phase number -> timestamp when entered
  activeCasts: CastInfo[];
  mechanicCooldowns: Map<string, MechanicCooldown>;
  spawnedAdds: string[]; // IDs of spawned adds
  enrageActive: boolean;
  enrageStartTime?: number;
  enrageDamageMultiplier: number; // Current enrage damage multiplier
}



