export interface Raid {
  id: string;
  type: 'daily' | 'weekly' | 'monthly';
  difficulty: 'normal' | 'heroic' | 'mythic';
  suggestedItemScore: number;
  boss: RaidBoss;
  rewards: RaidRewards;
  maxParticipants: number;
  duration: number; // minutes
  schedule: {
    startsAt: Date;
    endsAt: Date;
  };
  signups: RaidSignup[];
  status: 'upcoming' | 'active' | 'completed';
}

export interface RaidBoss {
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  mechanics: string[];
  sprite?: string;
}

export interface RaidRewards {
  gold: number;
  tokens: number;
  guaranteedLoot: 'epic' | 'legendary';
  xpBonus: number;
}

export interface RaidSignup {
  guildId: string;
  guildName: string;
  participants: RaidParticipant[];
  signedUpAt: Date;
  signedUpBy: string;
}

export interface RaidParticipant {
  userId: string;
  username: string;
  heroLevel: number;
  heroRole: string;
  itemScore: number;
}

export interface WorldBoss {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  mechanics: string[];
  scheduledTime: Date;
  duration: number; // minutes
  rewards: RaidRewards;
  participants: WorldBossParticipant[];
  status: 'upcoming' | 'active' | 'completed';
  results?: WorldBossResults;
}

export interface WorldBossParticipant {
  userId: string;
  username: string;
  heroLevel: number;
  heroRole: string;
  damageDealt: number;
  healingDone: number;
}

export interface WorldBossResults {
  winners: WorldBossParticipant[];
  totalDamage: number;
  duration: number;
  completedAt: Date;
}
