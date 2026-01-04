export interface Guild {
  id: string;
  name: string;
  createdBy: string; // Hero ID who created the guild
  createdByHeroName?: string; // Hero name for display
  level: number;
  gold: number;
  maxMembers: number;
  memberIds?: string[]; // Array of hero IDs
  members?: GuildMember[];
  joinMode?: 'open' | 'approval'; // Join mode: 'open' = auto-join, 'approval' = requires approval
  pendingApplications?: Array<{
    heroId: string;
    heroName: string;
    heroRole?: string;
    heroLevel?: number;
    appliedAt: any; // Firestore Timestamp
    message?: string;
  }>;
  perks?: GuildPerks;
  craftingStations?: CraftingStation[];
  createdAt: number;
}

export interface GuildMember {
  userId: string; // Hero ID
  twitchUserId?: string; // User's Twitch ID for party invites
  username: string;
  rank: 'leader' | 'officer' | 'member';
  contributionPoints: number;
  joinedAt: number;
  heroLevel: number;
  heroRole: string;
  profession?: {
    type: 'herbalism' | 'mining' | 'enchanting';
    level: number;
  };
}

export interface GuildPerks {
  craftingBonus?: number;
  gatherBonus?: number;
  combatBonus?: number;
}

export interface CraftingStation {
  id: string;
  type: 'herbalism_lab' | 'forge' | 'enchanting_tower';
  level: number;
  bonusQuality: number;
}

export interface GuildBank {
  gold: number;
  materials: {
    herbs?: {
      common: number;
      uncommon: number;
      rare: number;
      epic: number;
    };
    ore?: {
      iron: number;
      steel: number;
      mithril: number;
      adamantite: number;
    };
    essence?: number;
  };
}
