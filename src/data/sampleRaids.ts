/**
 * Sample Raid Data for Frontend
 * Simplified version of backend raids for testing
 */

import { RaidData } from '../utils/raidSystem';

export const SAMPLE_RAIDS: RaidData[] = [
  {
    id: 'corrupted_temple',
    name: 'Corrupted Temple',
    difficulty: 'normal',
    minLevel: 15,
    minItemScore: 500,
    minPlayers: 3,
    maxPlayers: 5,
    waves: 3,
    description: 'A once-holy temple now twisted by dark magic. Cleanse the corruption and face the Corrupted High Priest.',
    boss: {
      name: 'Corrupted High Priest',
      hp: 50000,
      attack: 80,
      defense: 40,
      level: 22,
      mechanics: [
        {
          name: 'Shadow Bolt',
          description: 'Channels dark energy to strike a random player for heavy damage',
          type: 'single-target',
          cooldown: 8000
        },
        {
          name: 'Corrupting Aura',
          description: 'At 50% HP, pulses damage to all players every 5 seconds',
          type: 'aoe',
          triggerAt: 0.5
        },
        {
          name: 'Summon Cultists',
          description: 'At 75% and 25% HP, summons 2 cultist adds',
          type: 'adds',
          triggerAt: [0.75, 0.25]
        }
      ]
    },
    rewards: {
      gold: 500,
      tokens: 10,
      experience: 2000,
      guaranteedLoot: ['weapon', 'armor']
    },
    estimatedDuration: 180000
  },
  {
    id: 'bandit_stronghold',
    name: 'Bandit Stronghold',
    difficulty: 'normal',
    minLevel: 15,
    minItemScore: 500,
    minPlayers: 3,
    maxPlayers: 5,
    waves: 4,
    description: 'Infiltrate the bandit fortress and eliminate their ruthless leader.',
    boss: {
      name: 'Bandit King',
      hp: 45000,
      attack: 90,
      defense: 30,
      level: 23,
      mechanics: [
        {
          name: 'Dual Strike',
          description: 'Attacks twice in rapid succession on the tank',
          type: 'tank-buster',
          cooldown: 12000
        },
        {
          name: 'Smoke Bomb',
          description: 'Becomes evasive, dodging 50% of attacks for 10 seconds',
          type: 'defensive',
          cooldown: 30000
        },
        {
          name: 'Call Reinforcements',
          description: 'Summons 3 bandit archers at 60% HP',
          type: 'adds',
          triggerAt: 0.6
        }
      ]
    },
    rewards: {
      gold: 550,
      tokens: 12,
      experience: 2200,
      guaranteedLoot: ['weapon', 'accessory']
    },
    estimatedDuration: 240000
  },
  {
    id: 'dragons_lair',
    name: "Dragon's Lair",
    difficulty: 'heroic',
    minLevel: 30,
    minItemScore: 1500,
    minPlayers: 5,
    maxPlayers: 8,
    waves: 5,
    description: 'Face an ancient dragon in its lair. Beware its fiery breath and powerful claws.',
    boss: {
      name: 'Ancient Dragon',
      hp: 150000,
      attack: 150,
      defense: 80,
      level: 40,
      mechanics: [
        {
          name: 'Fire Breath',
          description: 'Breathes fire in a cone, dealing massive damage to all players in front',
          type: 'aoe',
          cooldown: 15000
        },
        {
          name: 'Tail Swipe',
          description: 'Sweeps tail, knocking back and damaging players behind',
          type: 'aoe',
          cooldown: 20000
        },
        {
          name: 'Dragon Roar',
          description: 'At 50% HP, roars and summons 2 dragon whelps',
          type: 'adds',
          triggerAt: 0.5
        },
        {
          name: 'Enrage',
          description: 'At 25% HP, attack speed increases by 50%',
          type: 'mechanic',
          triggerAt: 0.25
        }
      ]
    },
    rewards: {
      gold: 1500,
      tokens: 30,
      experience: 5000,
      guaranteedLoot: ['weapon', 'armor', 'accessory']
    },
    estimatedDuration: 600000
  },
  {
    id: 'elder_dragon_normal',
    name: 'Elder Dragon\'s Lair',
    difficulty: 'normal',
    minLevel: 20,
    minItemScore: 800,
    minPlayers: 4,
    maxPlayers: 6,
    waves: 4,
    description: 'Face the Elder Dragon in its ancient lair. A formidable foe even for experienced adventurers.',
    boss: {
      name: 'Elder Dragon',
      hp: 80000,
      attack: 120,
      defense: 60,
      level: 28,
      mechanics: [
        {
          name: 'Dragon Breath',
          description: 'Breathes fire in a cone, dealing heavy damage to all players in front',
          type: 'aoe',
          cooldown: 12000
        },
        {
          name: 'Tail Swipe',
          description: 'Sweeps tail, knocking back and damaging players behind',
          type: 'aoe',
          cooldown: 15000
        },
        {
          name: 'Summon Whelps',
          description: 'At 60% HP, summons 2 dragon whelps',
          type: 'adds',
          triggerAt: 0.6
        },
        {
          name: 'Enrage',
          description: 'At 30% HP, attack speed increases by 40%',
          type: 'mechanic',
          triggerAt: 0.3
        }
      ]
    },
    rewards: {
      gold: 800,
      tokens: 15,
      experience: 3000,
      guaranteedLoot: ['weapon', 'armor']
    },
    estimatedDuration: 300000
  },
  {
    id: 'elder_dragon_heroic',
    name: 'Elder Dragon\'s Lair',
    difficulty: 'heroic',
    minLevel: 35,
    minItemScore: 2000,
    minPlayers: 5,
    maxPlayers: 8,
    waves: 5,
    description: 'Face the Elder Dragon at its full power. Only the strongest heroes dare challenge this ancient beast.',
    boss: {
      name: 'Elder Dragon',
      hp: 200000,
      attack: 200,
      defense: 100,
      level: 45,
      mechanics: [
        {
          name: 'Inferno Breath',
          description: 'Breathes devastating fire in a wide cone, dealing massive damage',
          type: 'aoe',
          cooldown: 10000
        },
        {
          name: 'Crushing Tail',
          description: 'Sweeps tail with immense force, dealing heavy damage and stunning players',
          type: 'aoe',
          cooldown: 12000
        },
        {
          name: 'Dragon Flight',
          description: 'Takes to the air, becoming immune to melee attacks for 8 seconds',
          type: 'defensive',
          cooldown: 25000
        },
        {
          name: 'Summon Whelp Pack',
          description: 'At 70% and 40% HP, summons 3 dragon whelps',
          type: 'adds',
          triggerAt: [0.7, 0.4]
        },
        {
          name: 'Fury of the Ancients',
          description: 'At 25% HP, attack speed increases by 60% and all attacks deal 25% more damage',
          type: 'mechanic',
          triggerAt: 0.25
        }
      ]
    },
    rewards: {
      gold: 2000,
      tokens: 40,
      experience: 8000,
      guaranteedLoot: ['weapon', 'armor', 'accessory']
    },
    estimatedDuration: 600000
  },
  {
    id: 'elder_dragon_mythic',
    name: 'Elder Dragon\'s Lair',
    difficulty: 'mythic',
    minLevel: 50,
    minItemScore: 3500,
    minPlayers: 6,
    maxPlayers: 10,
    waves: 6,
    description: 'Face the Elder Dragon at its absolute peak. The ultimate test of strength and coordination.',
    boss: {
      name: 'Elder Dragon',
      hp: 500000,
      attack: 350,
      defense: 180,
      level: 60,
      mechanics: [
        {
          name: 'Apocalypse Breath',
          description: 'Channels devastating fire that covers the entire battlefield, dealing massive damage',
          type: 'aoe',
          cooldown: 8000
        },
        {
          name: 'Worldbreaker Tail',
          description: 'Sweeps tail with cataclysmic force, dealing extreme damage and applying a debuff',
          type: 'aoe',
          cooldown: 10000
        },
        {
          name: 'Ancient Flight',
          description: 'Takes to the air, becoming immune to all attacks and raining fire for 10 seconds',
          type: 'defensive',
          cooldown: 20000
        },
        {
          name: 'Dragon Horde',
          description: 'At 80%, 60%, and 30% HP, summons 4 dragon whelps',
          type: 'adds',
          triggerAt: [0.8, 0.6, 0.3]
        },
        {
          name: 'Primordial Rage',
          description: 'At 20% HP, attack speed doubles, all attacks deal 50% more damage, and gains damage reduction',
          type: 'mechanic',
          triggerAt: 0.2
        },
        {
          name: 'Dragon\'s Wrath',
          description: 'Every 15 seconds, marks a random player for a devastating single-target attack',
          type: 'single-target',
          cooldown: 15000
        }
      ]
    },
    rewards: {
      gold: 5000,
      tokens: 100,
      experience: 20000,
      guaranteedLoot: ['weapon', 'armor', 'accessory', 'ring']
    },
    estimatedDuration: 900000
  }
];

export function getRaidById(raidId: string): RaidData | null {
  return SAMPLE_RAIDS.find(raid => raid.id === raidId) || null;
}

export function getRaidsByDifficulty(difficulty: 'normal' | 'heroic' | 'mythic'): RaidData[] {
  return SAMPLE_RAIDS.filter(raid => raid.difficulty === difficulty);
}
