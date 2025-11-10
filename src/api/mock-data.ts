import { Hero } from '../types/Hero';
import { Guild } from '../types/Guild';
import { Raid, WorldBoss } from '../types/Raid';

// Mock Hero Data
export const mockHero: Hero = {
  name: 'PlayerOne',
  role: 'berserker',
  level: 24,
  hp: 3081,
  maxHp: 3990,
  xp: 450,
  maxXp: 500,
  attack: 285,
  defense: 145,
  gold: 1250,
  tokens: 45,
  totalIdleTokens: 120,
  lastTokenClaim: Date.now() - 3600000, // 1 hour ago
  lastCommandTime: Date.now() - 600000, // 10 min ago
  equipment: {
    weapon: {
      name: 'Epic Sword of Power',
      slot: 'weapon',
      rarity: 'epic',
      attack: 120,
      defense: 20,
      hp: 50,
      color: '#a855f7'
    },
    armor: {
      name: 'Rare Platemail',
      slot: 'armor',
      rarity: 'rare',
      attack: 10,
      defense: 80,
      hp: 150,
      color: '#3b82f6'
    },
    accessory: {
      name: 'Uncommon Ring of Might',
      slot: 'accessory',
      rarity: 'uncommon',
      attack: 25,
      defense: 15,
      hp: 30,
      color: '#10b981'
    },
    shield: null
  },
  stats: {
    totalDamage: 15420,
    totalHealing: 0,
    damageBlocked: 3250
  },
  isDead: false,
  deathTime: null,
  potions: {
    health: 3
  },
  activeBuffs: {
    attackBonus: {
      value: 0.20,
      remainingDuration: 720000, // 12 minutes
      name: 'Strength Elixir II',
      lastUpdateTime: Date.now(),
      persistsThroughDeath: false
    }
  },
  profession: {
    type: 'herbalism',
    level: 15,
    xp: 234,
    maxXp: 300,
    materials: {
      herbs: {
        common: 45,
        uncommon: 12,
        rare: 3,
        epic: 0
      }
    },
    inventory: [
      { item: 'health_elixir_basic', quantity: 3, tier: 1, name: 'Basic Health Elixir' },
      { item: 'strength_elixir_advanced', quantity: 1, tier: 2, name: 'Advanced Strength Elixir' }
    ],
    totalGathered: 287,
    totalCrafted: 18,
    lastGatherTime: Date.now() - 300000
  },
  joinedAt: Date.now() - 86400000 * 5 // 5 days ago
};

// Mock Guild Data
export const mockGuild: Guild = {
  id: 'guild-123',
  name: 'Epic Raiders',
  createdBy: 'GuildLeader',
  level: 8,
  gold: 125000,
  maxMembers: 30,
  members: [
    {
      userId: 'user1',
      username: 'GuildLeader',
      rank: 'leader',
      contributionPoints: 5000,
      joinedAt: Date.now() - 86400000 * 30,
      heroLevel: 32,
      heroRole: 'paladin'
    },
    {
      userId: 'user2',
      username: 'OfficerOne',
      rank: 'officer',
      contributionPoints: 3500,
      joinedAt: Date.now() - 86400000 * 25,
      heroLevel: 28,
      heroRole: 'cleric'
    },
    {
      userId: 'user3',
      username: 'PlayerOne',
      rank: 'member',
      contributionPoints: 1200,
      joinedAt: Date.now() - 86400000 * 5,
      heroLevel: 24,
      heroRole: 'berserker'
    },
    {
      userId: 'user4',
      username: 'TankMaster',
      rank: 'member',
      contributionPoints: 2100,
      joinedAt: Date.now() - 86400000 * 15,
      heroLevel: 26,
      heroRole: 'guardian'
    },
    {
      userId: 'user5',
      username: 'HealBot',
      rank: 'member',
      contributionPoints: 1850,
      joinedAt: Date.now() - 86400000 * 12,
      heroLevel: 25,
      heroRole: 'druid'
    }
  ],
  perks: {
    craftingBonus: 0.15,
    gatherBonus: 0.10,
    combatBonus: 0.05
  },
  craftingStations: [
    {
      id: 'station1',
      type: 'herbalism_lab',
      level: 3,
      bonusQuality: 0.15
    }
  ],
  createdAt: Date.now() - 86400000 * 30
};

// Mock Raids
export const mockRaids: Raid[] = [
  {
    id: 'raid-daily-1',
    type: 'daily',
    difficulty: 'normal',
    suggestedItemScore: 500,
    boss: {
      name: 'Goblin Warlord',
      hp: 50000,
      maxHp: 50000,
      attack: 150,
      mechanics: ['Cleave', 'War Cry', 'Summon Adds']
    },
    rewards: {
      gold: 500,
      tokens: 10,
      guaranteedLoot: 'epic',
      xpBonus: 1000
    },
    maxParticipants: 10,
    duration: 15,
    schedule: {
      startsAt: new Date(Date.now() + 3600000), // 1 hour from now
      endsAt: new Date(Date.now() + 3600000 + 900000) // 15 min duration
    },
    signups: [],
    status: 'upcoming'
  },
  {
    id: 'raid-weekly-1',
    type: 'weekly',
    difficulty: 'heroic',
    suggestedItemScore: 1200,
    boss: {
      name: 'Ancient Lich',
      hp: 250000,
      maxHp: 250000,
      attack: 300,
      mechanics: ['Death Coil', 'Soul Drain', 'Phylactery Shield', 'Summon Skeletons']
    },
    rewards: {
      gold: 2500,
      tokens: 50,
      guaranteedLoot: 'legendary',
      xpBonus: 5000
    },
    maxParticipants: 20,
    duration: 30,
    schedule: {
      startsAt: new Date(Date.now() + 86400000 * 2), // 2 days from now
      endsAt: new Date(Date.now() + 86400000 * 2 + 1800000)
    },
    signups: [
      {
        guildId: 'guild-123',
        guildName: 'Epic Raiders',
        participants: [
          {
            userId: 'user1',
            username: 'GuildLeader',
            heroLevel: 32,
            heroRole: 'paladin',
            itemScore: 1450
          },
          {
            userId: 'user2',
            username: 'OfficerOne',
            heroLevel: 28,
            heroRole: 'cleric',
            itemScore: 1100
          }
        ],
        signedUpAt: new Date(Date.now() - 3600000),
        signedUpBy: 'GuildLeader'
      }
    ],
    status: 'upcoming'
  },
  {
    id: 'raid-monthly-1',
    type: 'monthly',
    difficulty: 'mythic',
    suggestedItemScore: 2500,
    boss: {
      name: 'Void Emperor',
      hp: 1000000,
      maxHp: 1000000,
      attack: 500,
      mechanics: ['Void Collapse', 'Reality Tear', 'Dark Portal', 'Cosmic Storm', 'Phase Shift']
    },
    rewards: {
      gold: 10000,
      tokens: 200,
      guaranteedLoot: 'legendary',
      xpBonus: 20000
    },
    maxParticipants: 40,
    duration: 60,
    schedule: {
      startsAt: new Date(Date.now() + 86400000 * 10), // 10 days from now
      endsAt: new Date(Date.now() + 86400000 * 10 + 3600000)
    },
    signups: [],
    status: 'upcoming'
  }
];

// Mock World Boss
export const mockWorldBoss: WorldBoss = {
  id: 'worldboss-1',
  name: 'Ancient Dragon Aspect',
  hp: 5000000,
  maxHp: 5000000,
  attack: 750,
  mechanics: ['Dragon Breath', 'Tail Swipe', 'Wing Buffet', 'Meteor Storm', 'Enrage at 20%'],
  scheduledTime: new Date(Date.now() + 86400000 * 3), // 3 days from now (Sunday)
  duration: 120, // 2 hours
  rewards: {
    gold: 50000,
    tokens: 500,
    guaranteedLoot: 'legendary',
    xpBonus: 50000
  },
  participants: [
    {
      userId: 'user1',
      username: 'GuildLeader',
      heroLevel: 32,
      heroRole: 'paladin',
      damageDealt: 0,
      healingDone: 0
    },
    {
      userId: 'user3',
      username: 'PlayerOne',
      heroLevel: 24,
      heroRole: 'berserker',
      damageDealt: 0,
      healingDone: 0
    }
  ],
  status: 'upcoming'
};

// Herbalism Recipes (from game.js for reference)
export const HERBALISM_RECIPES = {
  health_elixir_basic: { name: 'Basic Health Elixir', tier: 1, cost: { common: 5 }, effect: '+10% HP (15min)' },
  strength_elixir_basic: { name: 'Basic Strength Elixir', tier: 1, cost: { common: 5, uncommon: 1 }, effect: '+10% ATK (15min)' },
  defense_elixir_basic: { name: 'Basic Defense Elixir', tier: 1, cost: { common: 5, uncommon: 1 }, effect: '+10% DEF (15min)' },
  health_elixir_advanced: { name: 'Advanced Health Elixir', tier: 2, cost: { common: 10, uncommon: 5, rare: 1 }, effect: '+20% HP (20min)' },
  strength_elixir_advanced: { name: 'Advanced Strength Elixir', tier: 2, cost: { common: 10, uncommon: 5, rare: 1 }, effect: '+20% ATK (20min)' },
  defense_elixir_advanced: { name: 'Advanced Defense Elixir', tier: 2, cost: { common: 10, uncommon: 5, rare: 1 }, effect: '+20% DEF (20min)' },
  haste_elixir: { name: 'Haste Elixir', tier: 2, cost: { uncommon: 8, rare: 2 }, effect: '+25% Combat Speed (20min)' },
  health_elixir_superior: { name: 'Superior Health Elixir', tier: 3, cost: { uncommon: 15, rare: 5, epic: 1 }, effect: '+30% HP (30min)' },
  strength_elixir_superior: { name: 'Superior Strength Elixir', tier: 3, cost: { uncommon: 15, rare: 5, epic: 1 }, effect: '+30% ATK (30min)' },
  clarity_elixir: { name: 'Clarity Elixir', tier: 3, cost: { uncommon: 10, rare: 5 }, effect: '+40% XP (30min)' },
  flask_of_titan: { name: 'Flask of the Titan', tier: 4, cost: { rare: 10, epic: 3 }, effect: '+25% HP (60min, death-proof)' },
  flask_of_power: { name: 'Flask of Power', tier: 4, cost: { rare: 10, epic: 3 }, effect: '+15% All Stats (60min, death-proof)' }
};
