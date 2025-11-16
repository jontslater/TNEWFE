export interface ClassInfo {
  key: string;
  icon: string;
  displayName: string;
  category: 'tank' | 'healer' | 'dps';
  color: string;
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
  description: string;
  ability: {
    name: string;
    type: string;
    effect: string;
    trigger?: string;
    cooldown?: string;
  };
  playstyle: string;
}

export const CLASS_DATA: ClassInfo[] = [
  // TANKS
  {
    key: 'guardian',
    icon: '🛡️',
    displayName: 'Shield Guardian',
    category: 'tank',
    color: '#1e40af',
    baseHp: 220,
    baseAttack: 8,
    baseDefense: 18,
    description: 'Traditional protector with party-wide defense',
    ability: {
      name: 'Shield Wall',
      type: 'Active',
      effect: 'Creates a protective barrier reducing damage to all party members by 30% for 8 seconds',
      trigger: 'When taking damage above 40% of max HP',
      cooldown: '90 seconds'
    },
    playstyle: 'Best for encounters with heavy AoE damage or when party is undergeared'
  },
  {
    key: 'paladin',
    icon: '✨',
    displayName: 'Holy Defender',
    category: 'tank',
    color: '#f0e68c',
    baseHp: 200,
    baseAttack: 10,
    baseDefense: 16,
    description: 'Divine tank with self-cleansing',
    ability: {
      name: 'Divine Shield',
      type: 'Active',
      effect: 'Becomes immune to all damage and cleanses all debuffs for 5 seconds',
      trigger: 'When HP drops below 15%',
      cooldown: '120 seconds'
    },
    playstyle: 'Best against bosses with heavy debuffs or burst damage'
  },
  {
    key: 'warden',
    icon: '🌿',
    displayName: 'Wild Warden',
    category: 'tank',
    color: '#22543d',
    baseHp: 210,
    baseAttack: 9,
    baseDefense: 15,
    description: 'Nature tank with damage reflection',
    ability: {
      name: 'Thorns',
      type: 'Passive',
      effect: 'Reflects 35% of all damage taken back to attackers',
      trigger: 'Always active'
    },
    playstyle: 'Best in sustained fights where tank is taking constant damage'
  },
  {
    key: 'bloodknight',
    icon: '🩸',
    displayName: 'Blood Knight',
    category: 'tank',
    color: '#7f1d1d',
    baseHp: 205,
    baseAttack: 11,
    baseDefense: 14,
    description: 'Life-stealing tank with self-sustain',
    ability: {
      name: 'Blood Drain',
      type: 'Active',
      effect: 'Steals 50% of damage dealt back as HP for 10 seconds',
      trigger: 'When HP drops below 40%',
      cooldown: '60 seconds'
    },
    playstyle: 'Best when healers need to focus on party, tank can sustain self'
  },
  {
    key: 'vanguard',
    icon: '⚡',
    displayName: 'Agile Vanguard',
    category: 'tank',
    color: '#c7d2fe',
    baseHp: 190,
    baseAttack: 12,
    baseDefense: 15,
    description: 'Mobile tank with evasion',
    ability: {
      name: 'Evasion',
      type: 'Active',
      effect: '50% chance to dodge all attacks for 6 seconds',
      trigger: 'When HP drops below 30%',
      cooldown: '75 seconds'
    },
    playstyle: 'Best against fast-attacking enemies or multi-enemy encounters'
  },
  {
    key: 'brewmaster',
    icon: '🍺',
    displayName: 'Brewed Monk',
    category: 'tank',
    color: '#92400e',
    baseHp: 215,
    baseAttack: 8,
    baseDefense: 17,
    description: 'Stagger tank with delayed damage',
    ability: {
      name: 'Stagger',
      type: 'Passive',
      effect: 'All damage reduced by 40% immediately, remaining 60% taken over 8 seconds as DoT',
      trigger: 'Always active'
    },
    playstyle: 'Best for progression content, gives healers time to react'
  },

  // HEALERS
  {
    key: 'cleric',
    icon: '💚',
    displayName: 'Cleric',
    category: 'healer',
    color: '#10b981',
    baseHp: 105,
    baseAttack: 6,
    baseDefense: 8,
    description: 'Balanced healer with resurrection',
    ability: {
      name: 'Combat Resurrection',
      type: 'Active',
      effect: 'Resurrects a dead ally with 50% HP',
      trigger: 'When ally dies',
      cooldown: '180 seconds'
    },
    playstyle: 'Versatile healer for all content, essential for difficult encounters'
  },
  {
    key: 'atoner',
    icon: '⚖️',
    displayName: 'Atoner',
    category: 'healer',
    color: '#fbbf24',
    baseHp: 100,
    baseAttack: 8,
    baseDefense: 7,
    description: 'Offensive healer who heals through damage',
    ability: {
      name: 'Atonement',
      type: 'Passive',
      effect: '30% of damage dealt converts to healing on party members',
      trigger: 'Always active'
    },
    playstyle: 'High DPS healer, best with strong tank and when party is healthy'
  },
  {
    key: 'druid',
    icon: '🌱',
    displayName: 'Restoration Druid',
    category: 'healer',
    color: '#059669',
    baseHp: 95,
    baseAttack: 5,
    baseDefense: 6,
    description: 'HoT specialist with nature healing',
    ability: {
      name: 'Wild Growth',
      type: 'Active',
      effect: 'Heals all party members over 12 seconds',
      trigger: 'Auto-cast when multiple allies injured',
      cooldown: '45 seconds'
    },
    playstyle: 'Best for sustained AoE healing, excels in longer fights'
  },
  {
    key: 'lightbringer',
    icon: '☀️',
    displayName: 'Lightbringer',
    category: 'healer',
    color: '#fde047',
    baseHp: 110,
    baseAttack: 7,
    baseDefense: 9,
    description: 'Beacon healer with smart healing',
    ability: {
      name: 'Beacon of Light',
      type: 'Passive',
      effect: '40% of healing done to tank also heals the lowest HP ally',
      trigger: 'Always active'
    },
    playstyle: 'Efficient tank healer, excellent mana efficiency'
  },
  {
    key: 'shaman',
    icon: '🔱',
    displayName: 'Spirit Healer',
    category: 'healer',
    color: '#0891b2',
    baseHp: 100,
    baseAttack: 6,
    baseDefense: 7,
    description: 'Spiritual healer with chain heals',
    ability: {
      name: 'Chain Heal',
      type: 'Active',
      effect: 'Heals primary target and bounces to 3 other injured allies',
      trigger: 'Auto-cast on low HP ally',
      cooldown: '30 seconds'
    },
    playstyle: 'Best for spread damage healing, excellent in large groups'
  },
  {
    key: 'mistweaver',
    icon: '🌫️',
    displayName: 'Mistweaver',
    category: 'healer',
    color: '#6ee7b7',
    baseHp: 98,
    baseAttack: 7,
    baseDefense: 6,
    description: 'Mobile healer with channeled healing',
    ability: {
      name: 'Soothing Mist',
      type: 'Passive',
      effect: 'Continuously heals lowest HP ally for 1% max HP per second',
      trigger: 'Always active'
    },
    playstyle: 'Constant background healing, good for topping off party'
  },
  {
    key: 'chronomancer',
    icon: '⏰',
    displayName: 'Chronomender',
    category: 'healer',
    color: '#a78bfa',
    baseHp: 92,
    baseAttack: 5,
    baseDefense: 5,
    description: 'Time mage with HP rewind',
    ability: {
      name: 'Temporal Rewind',
      type: 'Active',
      effect: 'Restores all allies to their HP 8 seconds ago',
      trigger: 'When party takes heavy damage',
      cooldown: '150 seconds'
    },
    playstyle: 'Ultimate progression healer, can undo wipe mechanics'
  },
  {
    key: 'bard',
    icon: '🎵',
    displayName: 'Bard',
    category: 'healer',
    color: '#d97706',
    baseHp: 107,
    baseAttack: 7,
    baseDefense: 8,
    description: 'Support healer who buffs allies with musical magic',
    ability: {
      name: 'Battle Hymn',
      type: 'Active',
      effect: 'Buffs all party members with +15% attack and +10% defense (scales with intellect)',
      trigger: 'Every 45 seconds in combat',
      cooldown: '45 seconds'
    },
    playstyle: 'Best for party-wide buffs and sustained support, buffs scale with gear'
  },

  // DPS
  {
    key: 'berserker',
    icon: '⚔️',
    displayName: 'Berserker',
    category: 'dps',
    color: '#dc2626',
    baseHp: 130,
    baseAttack: 16,
    baseDefense: 5,
    description: 'Rage-fueled melee with execute damage',
    ability: {
      name: 'Enrage',
      type: 'Active',
      effect: '+50% attack damage for 12 seconds',
      trigger: 'When enemy drops below 30% HP',
      cooldown: '90 seconds'
    },
    playstyle: 'High burst DPS, excels at finishing low HP targets'
  },
  {
    key: 'crusader',
    icon: '🗡️',
    displayName: 'Crusader',
    category: 'dps',
    color: '#fcd34d',
    baseHp: 140,
    baseAttack: 15,
    baseDefense: 6,
    description: 'Holy warrior with smite damage',
    ability: {
      name: 'Divine Storm',
      type: 'Active',
      effect: 'Deals 200% weapon damage to all enemies',
      trigger: 'Every 8 attacks',
      cooldown: 'Proc-based'
    },
    playstyle: 'Strong AoE damage, excellent in multi-target fights'
  },
  {
    key: 'assassin',
    icon: '🗝️',
    displayName: 'Assassin',
    category: 'dps',
    color: '#4b5563',
    baseHp: 120,
    baseAttack: 18,
    baseDefense: 4,
    description: 'Stealth striker with critical hits',
    ability: {
      name: 'Backstab',
      type: 'Passive',
      effect: '25% chance to deal 300% critical damage',
      trigger: 'Always active'
    },
    playstyle: 'Highest single-target burst, RNG-based damage spikes'
  },
  {
    key: 'reaper',
    icon: '💀',
    displayName: 'Reaper',
    category: 'dps',
    color: '#1f2937',
    baseHp: 125,
    baseAttack: 16,
    baseDefense: 5,
    description: 'Death knight with DoT damage',
    ability: {
      name: 'Soul Harvest',
      type: 'Passive',
      effect: 'Attacks apply Soul Reap DoT (10 damage/second for 10 seconds)',
      trigger: 'Always active'
    },
    playstyle: 'Strong sustained DPS through damage over time'
  },
  {
    key: 'bladedancer',
    icon: '💃',
    displayName: 'Blade Dancer',
    category: 'dps',
    color: '#ec4899',
    baseHp: 122,
    baseAttack: 17,
    baseDefense: 4,
    description: 'Agile melee with quick strikes',
    ability: {
      name: 'Whirlwind',
      type: 'Active',
      effect: 'Hits all enemies for 150% damage',
      trigger: 'Every 6 attacks',
      cooldown: 'Proc-based'
    },
    playstyle: 'Consistent AoE pressure, good for cleave damage'
  },
  {
    key: 'monk',
    icon: '🥋',
    displayName: 'Chi Fighter',
    category: 'dps',
    color: '#f97316',
    baseHp: 128,
    baseAttack: 15,
    baseDefense: 5,
    description: 'Martial artist with combo attacks',
    ability: {
      name: 'Rising Sun Kick',
      type: 'Active',
      effect: 'Builds combo points, big finisher at 5 stacks',
      trigger: 'Every 5th attack',
      cooldown: 'Combo-based'
    },
    playstyle: 'Ramp-up damage, stronger in longer fights'
  },
  {
    key: 'stormwarrior',
    icon: '⚡',
    displayName: 'Storm Warrior',
    category: 'dps',
    color: '#0ea5e9',
    baseHp: 135,
    baseAttack: 14,
    baseDefense: 6,
    description: 'Lightning-infused warrior',
    ability: {
      name: 'Thunderstrike',
      type: 'Passive',
      effect: '20% chance to chain lightning to 2 additional targets',
      trigger: 'On attack'
    },
    playstyle: 'Good cleave damage with lightning procs'
  },
  {
    key: 'hunter',
    icon: '🏹',
    displayName: 'Beast Stalker',
    category: 'dps',
    color: '#84cc16',
    baseHp: 125,
    baseAttack: 16,
    baseDefense: 5,
    description: 'Pet master with ranged attacks',
    ability: {
      name: 'Call Pet',
      type: 'Active',
      effect: 'Summons pet that deals 30% of your attack as additional damage',
      trigger: 'Auto-summons in combat',
      cooldown: '60 seconds (pet lasts 30s)'
    },
    playstyle: 'Sustained damage through pet, good for solo content'
  },
  {
    key: 'mage',
    icon: '🔮',
    displayName: 'Elementalist',
    category: 'dps',
    color: '#7c3aed',
    baseHp: 115,
    baseAttack: 19,
    baseDefense: 3,
    description: 'Arcane caster with elemental rotation',
    ability: {
      name: 'Elemental Mastery',
      type: 'Passive',
      effect: 'Rotates elements (Fire/Frost/Arcane), each with unique effects',
      trigger: 'Changes every 4 attacks'
    },
    playstyle: 'Highest magic DPS, requires good positioning'
  },
  {
    key: 'warlock',
    icon: '😈',
    displayName: 'Warlock',
    category: 'dps',
    color: '#581c87',
    baseHp: 118,
    baseAttack: 18,
    baseDefense: 4,
    description: 'Demon summoner with shadow magic',
    ability: {
      name: 'Summon Demon',
      type: 'Active',
      effect: 'Summons demon dealing 35% of attack as shadow damage',
      trigger: 'Auto-summons',
      cooldown: '60 seconds (lasts 25s)'
    },
    playstyle: 'Strong DoT damage plus demon pet'
  },
  {
    key: 'ranger',
    icon: '🏹',
    displayName: 'Marksman',
    category: 'dps',
    color: '#065f46',
    baseHp: 122,
    baseAttack: 17,
    baseDefense: 5,
    description: 'Precision archer with aimed shots',
    ability: {
      name: 'Aimed Shot',
      type: 'Passive',
      effect: '15% chance to deal 250% critical damage',
      trigger: 'On attack'
    },
    playstyle: 'Consistent ranged DPS with crit burst'
  },
  {
    key: 'shadowpriest',
    icon: '🌑',
    displayName: 'Dark Oracle',
    category: 'dps',
    color: '#374151',
    baseHp: 120,
    baseAttack: 16,
    baseDefense: 4,
    description: 'Shadow caster with mind damage',
    ability: {
      name: 'Shadow Word: Death',
      type: 'Active',
      effect: 'Deals massive damage to targets below 20% HP',
      trigger: 'Execute range',
      cooldown: '30 seconds'
    },
    playstyle: 'Execute specialist, strong finisher'
  },
  {
    key: 'mooncaller',
    icon: '🌙',
    displayName: 'Mooncaller',
    category: 'dps',
    color: '#818cf8',
    baseHp: 117,
    baseAttack: 17,
    baseDefense: 4,
    description: 'Lunar/solar balance druid',
    ability: {
      name: 'Eclipse',
      type: 'Active',
      effect: 'Alternates Solar (burst) and Lunar (DoT) forms',
      trigger: 'Form-based rotation'
    },
    playstyle: 'Hybrid burst and sustained damage'
  },
  {
    key: 'stormcaller',
    icon: '⛈️',
    displayName: 'Stormcaller',
    category: 'dps',
    color: '#0284c7',
    baseHp: 120,
    baseAttack: 18,
    baseDefense: 4,
    description: 'Lightning mage with chain damage',
    ability: {
      name: 'Chain Lightning',
      type: 'Passive',
      effect: '30% chance to hit 3 additional targets with lightning',
      trigger: 'On attack'
    },
    playstyle: 'Excellent multi-target DPS'
  },
  {
    key: 'necromancer',
    icon: '💀',
    displayName: 'Necromancer',
    category: 'dps',
    color: '#6b2158',
    baseHp: 116,
    baseAttack: 17,
    baseDefense: 4,
    description: 'Death mage who raises undead minions',
    ability: {
      name: 'Raise Dead',
      type: 'Active',
      effect: 'Summons undead minion dealing 40% of attack as shadow damage',
      trigger: 'Auto-summons',
      cooldown: '70 seconds (lasts 30s)'
    },
    playstyle: 'Strong DoT damage plus undead pet'
  },
  {
    key: 'frostmage',
    icon: '❄️',
    displayName: 'Frost Invoker',
    category: 'dps',
    color: '#67e8f9',
    baseHp: 114,
    baseAttack: 19,
    baseDefense: 3,
    description: 'Frost specialist with slowing effects',
    ability: {
      name: 'Frost Mastery',
      type: 'Passive',
      effect: 'Attacks slow enemies and deal bonus frost damage',
      trigger: 'Always active'
    },
    playstyle: 'Controlled damage with utility, good for kiting'
  },
  {
    key: 'firemage',
    icon: '🔥',
    displayName: 'Pyroclast',
    category: 'dps',
    color: '#f97316',
    baseHp: 113,
    baseAttack: 20,
    baseDefense: 3,
    description: 'Fire specialist with explosive damage',
    ability: {
      name: 'Fire Mastery',
      type: 'Passive',
      effect: 'Attacks have a chance to ignite enemies with fire DoT',
      trigger: 'Always active'
    },
    playstyle: 'Highest fire burst damage, burn damage over time'
  },
  {
    key: 'dragonsorcerer',
    icon: '🐉',
    displayName: 'Draconic Sorcerer',
    category: 'dps',
    color: '#ea580c',
    baseHp: 112,
    baseAttack: 20,
    baseDefense: 3,
    description: 'Dragon magic caster with fire damage',
    ability: {
      name: 'Dragon Breath',
      type: 'Active',
      effect: 'Cone of fire dealing 250% damage to all enemies',
      trigger: 'Every 10 attacks',
      cooldown: 'Proc-based'
    },
    playstyle: 'Highest burst AoE, glass cannon'
  }
];

export const getClassesByRole = () => {
  const tanks = CLASS_DATA.filter(c => c.category === 'tank');
  const healers = CLASS_DATA.filter(c => c.category === 'healer');
  const dps = CLASS_DATA.filter(c => c.category === 'dps');
  
  return { tanks, healers, dps };
};
