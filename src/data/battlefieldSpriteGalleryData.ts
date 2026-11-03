/** Playable hero class ids (sprite / role keys) */
export const PLAYABLE_HERO_CLASSES = [
  'guardian',
  'paladin',
  'warden',
  'bloodknight',
  'vanguard',
  'brewmaster',
  'cleric',
  'atoner',
  'druid',
  'lightbringer',
  'shaman',
  'mistweaver',
  'chronomancer',
  'bard',
  'berserker',
  'crusader',
  'assassin',
  'reaper',
  'bladedancer',
  'monk',
  'stormwarrior',
  'hunter',
  'mage',
  'warlock',
  'ranger',
  'shadowpriest',
  'mooncaller',
  'stormcaller',
  'frostmage',
  'firemage',
  'dragonsorcerer',
  'necromancer',
] as const;

export type PlayableHeroClass = (typeof PLAYABLE_HERO_CLASSES)[number];

/** Enemy display names used in animation registry / battlefield */
export const BATTLEFIELD_GALLERY_ENEMIES = [
  { enemyType: 'Kobold Warrior', enemyName: 'Kobold Warrior', label: 'Kobold', isBoss: false },
  { enemyType: 'Baby Dragon', enemyName: 'Baby Dragon', label: 'Baby Dragon', isBoss: false },
  { enemyType: 'Imp', enemyName: 'Imp', label: 'Imp', isBoss: false },
  { enemyType: 'Lizardman', enemyName: 'Lizardman', label: 'Lizardman', isBoss: false },
  { enemyType: 'Masked Orc', enemyName: 'Masked Orc', label: 'Masked Orc', isBoss: false },
  { enemyType: 'Werewolf', enemyName: 'Werewolf', label: 'Werewolf', isBoss: false },
  { enemyType: 'Skeleton Mage', enemyName: 'Skeleton Mage', label: 'Skeleton Mage', isBoss: false },
  { enemyType: 'Witch', enemyName: 'Witch', label: 'Witch', isBoss: false },
  { enemyType: 'Mimic', enemyName: 'Mimic', label: 'Mimic', isBoss: false },
  { enemyType: 'Gryphon', enemyName: 'Gryphon', label: 'Gryphon', isBoss: false },
  { enemyType: 'Minotaur', enemyName: 'Minotaur', label: 'Minotaur', isBoss: false },
  { enemyType: 'Headless Horseman', enemyName: 'Headless Horseman', label: 'Headless Horseman', isBoss: false },
  { enemyType: 'Adult Dragon', enemyName: 'Adult Dragon', label: 'Adult Dragon', isBoss: false },
  { enemyType: 'Demon Lord', enemyName: 'Demon Lord', label: 'Demon Lord', isBoss: true },
  { enemyType: 'Goblin', enemyName: 'Goblin', label: 'Goblin', isBoss: false },
  { enemyType: 'Goblin Chief', enemyName: 'Goblin Chief', label: 'Goblin Chief', isBoss: true },
  { enemyType: 'Corrupted High Priest', enemyName: 'Corrupted High Priest', label: 'Corrupted Priest', isBoss: true },
  { enemyType: 'Cultist', enemyName: 'Cultist', label: 'Cultist', isBoss: false },
  { enemyType: 'Dragon_1', enemyName: 'Dragon Whelp', label: 'Dragon Whelp', isBoss: false },
  { enemyType: 'Dragon_2', enemyName: 'Dragon Guardian', label: 'Dragon Guardian', isBoss: false },
  { enemyType: 'Dragon_3', enemyName: 'Dragon Sentinel', label: 'Dragon Sentinel', isBoss: false },
  { enemyType: 'Elder Dragon', enemyName: 'Elder Dragon', label: 'Elder Dragon', isBoss: true },
] as const;

export const GALLERY_STANDARD_ENEMIES = BATTLEFIELD_GALLERY_ENEMIES.filter((e) => !e.isBoss);

export const GALLERY_BOSS_ENEMIES = BATTLEFIELD_GALLERY_ENEMIES.filter((e) => e.isBoss);

export const STRIP_PREVIEW_HEROES = [
  'vanguard',
  'mage',
  'bard',
  'berserker',
  'hunter',
  'cleric',
  'monk',
  'paladin',
] as const;

export const STRIP_PREVIEW_ENEMIES = [
  { enemyType: 'Kobold Warrior', enemyName: 'Kobold Warrior', label: 'Kobold', isBoss: false as const },
  { enemyType: 'Masked Orc', enemyName: 'Masked Orc', label: 'Orc', isBoss: false as const },
  { enemyType: 'Imp', enemyName: 'Imp', label: 'Imp', isBoss: false as const },
  { enemyType: 'Dragon_1', enemyName: 'Dragon Whelp', label: 'Whelp', isBoss: false as const },
  { enemyType: 'Elder Dragon', enemyName: 'Elder Dragon', label: 'Elder', isBoss: true as const },
];
