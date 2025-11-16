export interface QuestObjective {
  type: 'kill' | 'defeatBosses' | 'completeWaves' | 'craft' | 'gather' | 'use' | 
        'raid' | 'worldBoss' | 'completeDailies' | 'completeWeeklies' | 
        'reachLevel' | 'dealDamage' | 'healAmount' | 'blockDamage' | 'surviveBosses' | 'itemScore';
  target: number;
  specific: string | null;
}

export interface QuestMaterial {
  type: 'herbs' | 'ore' | 'essence';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic';
  amount: number;
}

export interface QuestRewards {
  gold: number;
  xp: number;
  tokens: number;
  materials?: QuestMaterial[];
  items?: any[]; // Can type this more specifically later
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  category: 'combat' | 'profession' | 'social' | 'meta';
  objective: QuestObjective;
  rewards: QuestRewards;
}

export interface QuestSet {
  id: string;
  type: 'daily' | 'weekly' | 'monthly';
  resetTime: any; // Firestore Timestamp
  activeUntil: any; // Firestore Timestamp
  quests: Quest[];
  completionBonus: QuestRewards;
  createdAt?: any;
  updatedAt?: any;
}

export interface QuestProgress {
  current: number;
  completed: boolean;
  claimedAt: any | null; // Firestore Timestamp or null
}

export interface PlayerQuestProgress {
  daily: { [questId: string]: QuestProgress };
  weekly: { [questId: string]: QuestProgress };
  monthly: { [questId: string]: QuestProgress };
  lastDailyReset: any; // Firestore Timestamp
  lastWeeklyReset: any;
  lastMonthlyReset: any;
  dailiesCompletedThisWeek: number;
  dailiesCompletedThisMonth: number;
  weekliesCompletedThisMonth: number;
  dailyBonusClaimed: boolean;
  weeklyBonusClaimed: boolean;
  monthlyBonusClaimed: boolean;
}

export interface QuestWithProgress extends Quest {
  progress?: QuestProgress;
}
