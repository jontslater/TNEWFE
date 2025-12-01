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

// Slot restrictions for crafted items
export const CRAFTED_ITEM_SLOTS = {
  weapon: ['weapon'],
  armor: ['armor', 'helm', 'cloak', 'gloves', 'boots', 'shield'],
  accessory: ['accessory', 'ring1', 'ring2'],
  all: ['weapon', 'armor', 'accessory', 'helm', 'cloak', 'gloves', 'ring1', 'ring2', 'boots', 'shield']
};

// Herbalism Recipes (from game.js for reference)
// Mining Recipes
export const MINING_RECIPES = {
  // Armor Upgrades
  iron_plating: {
    name: 'Iron Plating',
    tier: 1,
    minProfessionLevel: 1,
    cost: { ore: { iron: 10 } },
    description: '+5% Defense (Permanent)',
    effect: 'defenseBonus',
    value: 0.05,
    applicableSlots: CRAFTED_ITEM_SLOTS.armor
  },
  steel_reinforcement: {
    name: 'Steel Reinforcement',
    tier: 2,
    minProfessionLevel: 25,
    cost: { ore: { iron: 15, steel: 10 } },
    description: '+8% Defense, +3% HP (Permanent)',
    effect: 'defenseAndHpBonus',
    value: { defense: 0.08, hp: 0.03 },
    applicableSlots: CRAFTED_ITEM_SLOTS.armor
  },
  mithril_enhancement: {
    name: 'Mithril Enhancement',
    tier: 3,
    minProfessionLevel: 50,
    cost: { ore: { steel: 20, mithril: 10 } },
    description: '+12% Defense, +5% HP (Permanent)',
    effect: 'defenseAndHpBonus',
    value: { defense: 0.12, hp: 0.05 },
    applicableSlots: CRAFTED_ITEM_SLOTS.armor
  },
  adamantite_fortification: {
    name: 'Adamantite Fortification',
    tier: 4,
    minProfessionLevel: 75,
    cost: { ore: { mithril: 15, adamantite: 5 } },
    description: '+20% Defense, +10% HP (Permanent)',
    effect: 'defenseAndHpBonus',
    value: { defense: 0.20, hp: 0.10 },
    applicableSlots: CRAFTED_ITEM_SLOTS.armor
  },
  
  // Weapon Sharpening
  basic_whetstone: {
    name: 'Basic Whetstone',
    tier: 1,
    minProfessionLevel: 1,
    cost: { ore: { iron: 10 } },
    description: '+5% Attack (Permanent)',
    effect: 'attackBonus',
    value: 0.05,
    applicableSlots: CRAFTED_ITEM_SLOTS.weapon
  },
  refined_oil: {
    name: 'Refined Oil',
    tier: 2,
    minProfessionLevel: 25,
    cost: { ore: { iron: 15, steel: 10 } },
    description: '+8% Attack (Permanent)',
    effect: 'attackBonus',
    value: 0.08,
    applicableSlots: CRAFTED_ITEM_SLOTS.weapon
  },
  elemental_core: {
    name: 'Elemental Core',
    tier: 3,
    minProfessionLevel: 50,
    cost: { ore: { steel: 20, mithril: 10 } },
    description: '+12% Attack (Permanent)',
    effect: 'attackBonus',
    value: 0.12,
    applicableSlots: CRAFTED_ITEM_SLOTS.weapon
  },
  legendary_edge: {
    name: 'Legendary Edge',
    tier: 4,
    minProfessionLevel: 75,
    cost: { ore: { mithril: 15, adamantite: 5 } },
    description: '+20% Attack (Permanent)',
    effect: 'attackBonus',
    value: 0.20,
    applicableSlots: CRAFTED_ITEM_SLOTS.weapon
  }
};

// Enchanting Recipes
export const ENCHANTING_RECIPES = {
  fiery_weapon: {
    name: 'Fiery Weapon',
    tier: 1,
    minProfessionLevel: 1,
    cost: { essence: 50 },
    description: '10% chance: +50% fire damage (Permanent)',
    effect: 'fireProc',
    value: { chance: 0.10, damage: 0.50 },
    applicableSlots: CRAFTED_ITEM_SLOTS.weapon
  },
  frozen_armor: {
    name: 'Frozen Armor',
    tier: 1,
    minProfessionLevel: 10,
    cost: { essence: 75 },
    description: '15% chance: freeze attacker 3s (Permanent)',
    effect: 'freezeProc',
    value: { chance: 0.15, duration: 3 },
    applicableSlots: CRAFTED_ITEM_SLOTS.armor
  },
  vampiric_touch: {
    name: 'Vampiric Touch',
    tier: 2,
    minProfessionLevel: 25,
    cost: { essence: 150 },
    description: '5% Lifesteal on attacks (Permanent)',
    effect: 'lifesteal',
    value: 0.05,
    applicableSlots: CRAFTED_ITEM_SLOTS.weapon
  },
  thorns_nature: {
    name: 'Thorns of Nature',
    tier: 2,
    minProfessionLevel: 30,
    cost: { essence: 175 },
    description: 'Reflect 20% damage to attacker (Permanent)',
    effect: 'reflectDamage',
    value: 0.20,
    applicableSlots: CRAFTED_ITEM_SLOTS.armor
  },
  swiftness: {
    name: 'Swiftness',
    tier: 3,
    minProfessionLevel: 50,
    cost: { essence: 300 },
    description: 'Reduce all cooldowns by 10% (Permanent)',
    effect: 'cooldownReduction',
    value: 0.10,
    applicableSlots: CRAFTED_ITEM_SLOTS.all
  },
  resilience: {
    name: 'Resilience',
    tier: 3,
    minProfessionLevel: 55,
    cost: { essence: 350 },
    description: '+15% Debuff Resistance (Permanent)',
    effect: 'debuffResistance',
    value: 0.15,
    applicableSlots: CRAFTED_ITEM_SLOTS.all
  },
  
  // Temporary Runes (consumables, no slot restriction)
  rune_of_power: {
    name: 'Rune of Power',
    tier: 3,
    minProfessionLevel: 40,
    cost: { essence: 200 },
    description: '+30% Damage (20min combat)',
    effect: 'damageBonus',
    value: 0.30,
    duration: 1200000,
    applicableSlots: [] // Consumable, not applied to gear
  },
  rune_of_warding: {
    name: 'Rune of Warding',
    tier: 3,
    minProfessionLevel: 40,
    cost: { essence: 200 },
    description: '+30% Damage Reduction (20min combat)',
    effect: 'damageReduction',
    value: 0.30,
    duration: 1200000,
    applicableSlots: [] // Consumable, not applied to gear
  },
  rune_of_vitality: {
    name: 'Rune of Vitality',
    tier: 4,
    minProfessionLevel: 75,
    cost: { essence: 500 },
    description: 'Revive at 25% HP once (20min combat)',
    effect: 'cheatDeath',
    value: 0.25,
    duration: 1200000,
    applicableSlots: [] // Consumable, not applied to gear
  }
};

export const HERBALISM_RECIPES = {
  health_elixir_basic: {
    name: 'Basic Health Elixir',
    tier: 1,
    minProfessionLevel: 1,
    cost: { herbs: { common: 5 } },
    description: '+10% Max HP (15min combat)',
    effect: '+10% HP (15min)',
    applicableSlots: [] // Consumable, not applied to gear
  },
  strength_elixir_basic: {
    name: 'Basic Strength Elixir',
    tier: 1,
    minProfessionLevel: 5,
    cost: { herbs: { common: 5, uncommon: 1 } },
    description: '+10% Attack (15min combat)',
    effect: '+10% ATK (15min)',
    applicableSlots: [] // Consumable, not applied to gear
  },
  defense_elixir_basic: {
    name: 'Basic Defense Elixir',
    tier: 1,
    minProfessionLevel: 5,
    cost: { herbs: { common: 5, uncommon: 1 } },
    description: '+10% Defense (15min combat)',
    effect: '+10% DEF (15min)',
    applicableSlots: [] // Consumable, not applied to gear
  },
  health_elixir_advanced: {
    name: 'Advanced Health Elixir',
    tier: 2,
    minProfessionLevel: 20,
    cost: { herbs: { common: 10, uncommon: 5, rare: 1 } },
    description: '+20% Max HP (20min combat)',
    effect: '+20% HP (20min)',
    applicableSlots: [] // Consumable, not applied to gear
  },
  strength_elixir_advanced: {
    name: 'Advanced Strength Elixir',
    tier: 2,
    minProfessionLevel: 20,
    cost: { herbs: { common: 10, uncommon: 5, rare: 1 } },
    description: '+20% Attack (20min combat)',
    effect: '+20% ATK (20min)',
    applicableSlots: [] // Consumable, not applied to gear
  },
  defense_elixir_advanced: {
    name: 'Advanced Defense Elixir',
    tier: 2,
    minProfessionLevel: 20,
    cost: { herbs: { common: 10, uncommon: 5, rare: 1 } },
    description: '+20% Defense (20min combat)',
    effect: '+20% DEF (20min)',
    applicableSlots: [] // Consumable, not applied to gear
  },
  haste_elixir: {
    name: 'Haste Elixir',
    tier: 2,
    minProfessionLevel: 25,
    cost: { herbs: { uncommon: 8, rare: 2 } },
    description: '+25% Combat Speed (20min)',
    effect: '+25% Speed (20min)',
    applicableSlots: [] // Consumable, not applied to gear
  },
  health_elixir_superior: {
    name: 'Superior Health Elixir',
    tier: 3,
    minProfessionLevel: 50,
    cost: { herbs: { uncommon: 15, rare: 5, epic: 1 } },
    description: '+30% Max HP (30min combat)',
    effect: '+30% HP (30min)',
    applicableSlots: [] // Consumable, not applied to gear
  },
  strength_elixir_superior: {
    name: 'Superior Strength Elixir',
    tier: 3,
    minProfessionLevel: 50,
    cost: { herbs: { uncommon: 15, rare: 5, epic: 1 } },
    description: '+30% Attack (30min combat)',
    effect: '+30% ATK (30min)',
    applicableSlots: [] // Consumable, not applied to gear
  },
  clarity_elixir: {
    name: 'Clarity Elixir',
    tier: 3,
    minProfessionLevel: 50,
    cost: { herbs: { uncommon: 10, rare: 5 } },
    description: '+40% XP Gain (30min combat)',
    effect: '+40% XP (30min)',
    applicableSlots: [] // Consumable, not applied to gear
  },
  flask_of_titan: {
    name: 'Flask of the Titan',
    tier: 4,
    minProfessionLevel: 75,
    cost: { herbs: { rare: 10, epic: 3 } },
    description: '+25% Max HP (60min, death-proof)',
    effect: '+25% HP (60min, persists)',
    applicableSlots: [] // Consumable, not applied to gear
  },
  flask_of_power: {
    name: 'Flask of Power',
    tier: 4,
    minProfessionLevel: 75,
    cost: { herbs: { rare: 10, epic: 3 } },
    description: '+15% All Stats (60min, death-proof)',
    effect: '+15% All Stats (60min, persists)',
    applicableSlots: [] // Consumable, not applied to gear
  }
};
