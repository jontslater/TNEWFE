export interface Guild {
  id: string;
  name: string;
  createdBy: string;
  level: number;
  gold: number;
  maxMembers: number;
  members: GuildMember[];
  perks: GuildPerks;
  craftingStations: CraftingStation[];
  createdAt: number;
}

export interface GuildMember {
  userId: string;
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
