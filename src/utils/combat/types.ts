/**
 * Shared types and interfaces for the combat engine
 */

import { ROLE_CONFIG } from '../fullCombatEngine';

export interface CombatState {
  heroes: Hero[] | Map<string, Hero>;
  currentEnemies: Enemy[];
  isPaused: boolean;
  viewerCount?: number;
  difficultyModifier?: number;
  combatAnimationActive?: boolean;
  initiativeOrder?: InitiativeEntry[];
  combatMetrics?: any;
  currentCombatWave?: number;
  maxCombatWaves?: number;
}

export interface Hero {
  id?: string;
  username: string;
  role: string;
  level: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  isDead?: boolean;
  activeDebuffs?: Record<string, Debuff>;
  activeBuffs?: Record<string, Buff>;
  activeProcBuffs?: Record<string, number>;
  cooldowns?: Cooldowns;
  classAbilityState?: ClassAbilityState;
  equipment?: Record<string, any>;
  enchantedItems?: any[];
  skills?: Record<string, any>;
  stats?: Stats;
  lastStandActive?: boolean;
  lastBigHit?: number;
  shield?: Shield;
  staggerDoT?: number;
  staggerLastTick?: number;
  deathTime?: number;
  deathAnimationPlaying?: boolean;
  activeThreatMod?: number;
  strength?: number;
  dexterity?: number;
  intellect?: number;
  wisdom?: number;
  stamina?: number;
  healingPower?: number;
  meleeDamage?: number;
  spellDamage?: number;
  critChance?: number;
  guildId?: string;
  lastCommandTime?: number;
  restedXp?: RestedXP;
  xp?: number;
  maxXp?: number;
  gold?: number;
}

export interface Enemy {
  id: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  isDead: boolean;
  isBoss?: boolean;
  isRaid?: boolean;
  isWorldBoss?: boolean;
  isAnimated?: boolean;
  xp: number;
  abilities?: EnemyAbilities;
  activeDebuffs?: Record<string, Debuff>;
  initiative?: number;
}

export interface EnemyAbilities {
  critChance?: number;
  enrageActive?: boolean;
  enrageExpiry?: number;
  bloodlustActive?: boolean;
  bloodlustExpiry?: number;
}

export interface Debuff {
  expiresAt: number;
  appliedBy: string;
  lastTick?: number;
  value?: number;
}

export interface Buff {
  value: number | ((hero: Hero) => number);
  remainingDuration: number;
  name: string;
  lastUpdateTime: number;
}

export interface Shield {
  amount: number;
  expiresAt: number;
  source: string;
}

export interface Cooldowns {
  classAbility: number;
  classAbilityPrimary: number;
  classAbilitySecondary: number;
  procBuff: number;
  lastStand: number;
  groupHeal: number;
  instantHeal: number;
  debuffEnemy: number;
  combatRes: number;
  dispel?: number;
}

export interface ClassAbilityState {
  comboCount?: number;
  elementRotation?: number;
  eclipseForm?: 'solar' | 'lunar';
  eclipseTimer?: number;
  petActive?: boolean;
  petExpiry?: number;
  beaconTarget?: string;
  atonementActive?: boolean;
  enrageActive?: boolean;
  enrageExpiry?: number;
  evasionActive?: boolean;
  evasionExpiry?: number;
  bloodDrainActive?: boolean;
  bloodDrainExpiry?: number;
  shieldWallActive?: boolean;
  shieldWallExpiry?: number;
  divineShieldActive?: boolean;
  divineShieldExpiry?: number;
  hpSnapshot?: Record<string, HpSnapshot[]>;
  enlargeActive?: boolean;
  enlargeExpiry?: number;
  holyStrikeHealing?: number;
  chainLightning?: boolean;
  stormChain?: boolean;
  interceptActive?: boolean;
  interceptExpiry?: number;
}

export interface HpSnapshot {
  time: number;
  hp: number;
}

export interface Stats {
  totalDamage: number;
  totalHealing: number;
  damageBlocked: number;
}

export interface RestedXP {
  hoursRemaining: number;
  totalConsumed: number;
  lastUpdated: number;
}

export interface Combatant {
  type: 'hero' | 'enemy';
  username?: string;
  hero?: Hero;
  enemy?: Enemy;
  initiative: number;
  dexterity?: number;
}

export interface InitiativeEntry {
  type: 'hero' | 'enemy';
  name: string;
  initiative: number;
  dexterity: number;
  isDead: boolean;
}

export interface DamageAction {
  username: string;
  damage: number;
  role: string;
  isAoE: boolean;
  aoeMultiplier: number;
  hero: Hero;
  chainLightning?: boolean;
  stormChain?: boolean;
  targetEnemy?: Enemy | null;
  initiative: number;
}

export interface EnemyAction {
  type: 'enemy';
  enemy: Enemy;
  enemyIndex: number;
  initiative: number;
}

export interface CombatCallbacks {
  trackDeath?: () => void; // Callback to track death in combat metrics
  log: (type: string, message: string, username?: string) => void;
  triggerAnimation: (id: string, animation: string, isHero: boolean) => void;
  triggerAttackAnimation?: (username: string, isHero: boolean) => void;
  triggerDamageAnimation?: (id: string, isHero: boolean) => void;
  triggerHealAnimation: (username: string) => void;
  triggerCombatText?: (id: string, amount: number, type: 'damage' | 'crit' | 'heal' | 'heal-hot' | 'dot', isHero: boolean) => void;
  updateEnemyHealthBar: () => void;
  updateHeroUI: () => void;
}

export interface ViewerBonuses {
  damageMultiplier: number;
  healingMultiplier: number;
  defenseMultiplier: number;
}
