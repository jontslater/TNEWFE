/**
 * Shared combat/progression balance (mirrors idleDnD-Backend data/balance.json).
 */
import { ROLE_CONFIG } from '../utils/fullCombatEngine';
import { getClassCategory } from '../game/skills/classRegistry';
import { getBalancePayload } from './balanceLoader';

export { getBalancePayload } from './balanceLoader';

export type RoleCategory = 'tank' | 'healer' | 'dps';
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

const RARITY_ORDER: ItemRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

function cfg() {
  return getBalancePayload();
}

export function gLevel(level: number): number {
  const L = Math.max(1, Math.floor(level));
  return 1 + cfg().levelCurve.gPerLevel * (L - 1);
}

export function xpToNextLevel(level: number): number {
  const L = Math.max(1, Math.floor(level));
  const c = cfg().levelCurve;
  return Math.floor(c.xpToNextCoefficient * gLevel(L) * Math.pow(L, c.xpToNextExponent));
}

/** Apply XP and return { level, xp, maxXp, levelsGained }. */
export function applyXpWithLevelUps(
  level: number,
  xp: number,
  maxLevel = 100
): { level: number; xp: number; maxXp: number; levelsGained: number } {
  let L = level;
  let remaining = xp;
  let gained = 0;
  while (L < maxLevel) {
    const need = xpToNextLevel(L);
    if (remaining < need) {
      return { level: L, xp: remaining, maxXp: need, levelsGained: gained };
    }
    remaining -= need;
    L += 1;
    gained += 1;
  }
  return { level: L, xp: remaining, maxXp: xpToNextLevel(L), levelsGained: gained };
}

export function chatDamageHealMultiplier(activeChatters: number): number {
  const c = cfg().chat;
  return 1 + Math.min(c.damageHealCap, activeChatters * c.percentPerActiveChatter);
}

export function chatLootWeightBonus(activeChatters: number): number {
  const c = cfg().chat;
  return Math.min(c.lootWeightCap, activeChatters * c.lootWeightPercentPerChatter);
}

export function damageReduction(armor: number, attackerLevel: number): number {
  const k = cfg().combat.armorConstantK;
  const cap = cfg().combat.damageReductionCap;
  const g = gLevel(attackerLevel);
  return Math.min(cap, armor / (armor + k * g));
}

export function rollVariance(): number {
  const { damageVarianceMin, damageVarianceMax } = cfg().combat;
  return damageVarianceMin + Math.random() * (damageVarianceMax - damageVarianceMin);
}

export function critDamageMultiplier(skillCritDamagePercent = 0): number {
  return cfg().combat.critMultiplier + Math.max(0, skillCritDamagePercent) / 100;
}

export function capCritChance(chance: number): number {
  return Math.min(cfg().combat.critChanceCap, Math.max(0, chance));
}

export function computeHitDamage(params: {
  attack: number;
  attackerLevel: number;
  targetArmor: number;
  abilityMult?: number;
  chatMult?: number;
  isCrit?: boolean;
  skillCritDamagePercent?: number;
}): number {
  const dr = damageReduction(params.targetArmor, params.attackerLevel);
  let dmg =
    params.attack *
    (params.abilityMult ?? 1) *
    (params.chatMult ?? 1) *
    (1 - dr) *
    rollVariance();
  if (params.isCrit) {
    dmg *= critDamageMultiplier(params.skillCritDamagePercent ?? 0);
  }
  return Math.max(0, Math.floor(dmg));
}

export function computeHealAmount(spellPower: number, chatMult = 1, isCrit = false): number {
  let amt = spellPower * cfg().combat.healMultiplier * chatMult;
  if (isCrit) amt *= cfg().combat.critMultiplier;
  return Math.floor(amt);
}

export function computeDamageTaken(rawDamage: number, heroArmor: number, attackerLevel: number): number {
  const dr = damageReduction(heroArmor, attackerLevel);
  return Math.max(0, Math.floor(rawDamage * (1 - dr) * rollVariance()));
}

/** Extra damage reduction from tank DR skills (percent), capped at balance DR cap (75%). */
export function applySkillDamageReductionPercent(
  damageAfterArmor: number,
  skillDefenseMultiplierPercent = 0
): number {
  const cap = cfg().combat.damageReductionCap;
  const extra = Math.min(cap, Math.max(0, skillDefenseMultiplierPercent) / 100);
  return Math.max(0, Math.floor(damageAfterArmor * (1 - extra)));
}

function classRatioMultipliers(className: string): { hp: number; atk: number; armor: number } {
  const key = className.toLowerCase();
  const self = ROLE_CONFIG[key];
  if (!self?.category) return { hp: 1, atk: 1, armor: 1 };

  const cat = self.category as RoleCategory;
  const peers = Object.entries(ROLE_CONFIG).filter(([, v]) => v.category === cat);
  const avgHp = peers.reduce((s, [, v]) => s + (v.baseHp || 1), 0) / peers.length;
  const avgAtk = peers.reduce((s, [, v]) => s + (v.baseAttack || 1), 0) / peers.length;
  const avgDef = peers.reduce((s, [, v]) => s + (v.baseDefense || 1), 0) / peers.length;
  const clamp = cfg().classRatioClamp;

  const clampRatio = (r: number) => Math.min(clamp.max, Math.max(clamp.min, r));
  return {
    hp: clampRatio((self.baseHp || avgHp) / avgHp),
    atk: clampRatio((self.baseAttack || avgAtk) / avgAtk),
    armor: clampRatio((self.baseDefense || avgDef) / avgDef),
  };
}

function rarityIndex(r: string): number {
  const i = RARITY_ORDER.indexOf(r.toLowerCase() as ItemRarity);
  return i >= 0 ? i : 0;
}

export function inferGearRarityAndIlvl(hero: {
  level: number;
  equipment?: Record<string, { rarity?: string; itemLevel?: number; level?: number } | null> | null;
}): { rarity: ItemRarity; ilvl: number } {
  const slots = Object.values(hero.equipment || {}).filter(Boolean) as Array<{
    rarity?: string;
    itemLevel?: number;
    level?: number;
  }>;
  if (slots.length === 0) {
    return { rarity: 'common', ilvl: hero.level || 1 };
  }
  let rSum = 0;
  let ilvlSum = 0;
  slots.forEach((item) => {
    rSum += rarityIndex(item.rarity || 'common');
    ilvlSum += item.itemLevel ?? item.level ?? hero.level ?? 1;
  });
  const avgIdx = Math.round(rSum / slots.length);
  return {
    rarity: RARITY_ORDER[Math.min(RARITY_ORDER.length - 1, avgIdx)],
    ilvl: Math.max(1, Math.floor(ilvlSum / slots.length)),
  };
}

export interface BalanceHeroCombatStats {
  attack: number;
  armor: number;
  maxHp: number;
  spellPower: number;
  critChance: number;
  hpRegen: number;
  swingIntervalMs: number;
}

export function computeHeroBalanceStats(hero: {
  role: string;
  level: number;
  equipment?: Record<string, unknown> | null;
}): BalanceHeroCombatStats {
  const level = Math.max(1, hero.level || 1);
  const category = getClassCategory(hero.role) as RoleCategory;
  const base = cfg().heroRoles[category];
  const ratios = classRatioMultipliers(hero.role);
  const { rarity, ilvl } = inferGearRarityAndIlvl({
    level,
    equipment: hero.equipment as Record<string, { rarity?: string; itemLevel?: number; level?: number } | null>,
  });
  const R = cfg().gear.R[rarity] ?? 1;
  const f = cfg().gear.setFraction;
  const gL = gLevel(level);
  const gI = gLevel(ilvl);

  const hp = Math.floor((base.hp * gL + f * R * base.hp * gI) * ratios.hp);
  const atk = Math.floor((base.atk * gL + f * R * base.atk * gI) * ratios.atk);
  const armor = Math.floor((base.armor * gL + f * R * base.armor * gI) * ratios.armor);
  const spellPower =
    category === 'healer'
      ? Math.floor((base.spellPower * gL + f * R * base.spellPower * gI) * ratios.atk)
      : 0;
  const gearCrit = cfg().gear.critBonusFullSet[rarity] ?? 0;
  const critChance = capCritChance(base.crit + gearCrit);

  return {
    attack: atk,
    armor,
    maxHp: hp,
    spellPower,
    critChance,
    hpRegen: 0,
    swingIntervalMs: cfg().combat.swingIntervalMs,
  };
}

export function waveTierMultiplier(wave: number): number {
  const c = cfg().combat;
  const tiers = Math.floor(Math.max(0, wave) / 10);
  return 1 + Math.min(c.waveTierCap, tiers * c.waveTierPercentPer10Waves);
}

export function idleKillXp(level: number, kind: 'normal' | 'elite' | 'boss' = 'normal'): number {
  const e = cfg().enemies;
  let xp = e.xpPerKill * gLevel(level);
  if (kind === 'elite') xp *= e.xpEliteMultiplier;
  if (kind === 'boss') xp *= e.xpBossMultiplier;
  return Math.floor(xp);
}

export function idleKillGold(level: number, difficulty = 1): number {
  return Math.floor(cfg().enemies.goldPerKill * gLevel(level) * difficulty);
}

export interface BalanceEnemyTemplate {
  hp: number;
  maxHp: number;
  attack: number;
  armor: number;
  level: number;
  xp: number;
  gold: number;
  isBoss?: boolean;
  bossKind?: 'dungeon' | 'raid';
  fightStartMs?: number;
  aoeNextMs?: number;
}

export function buildNormalEnemies(
  level: number,
  packSize: 1 | 2 | 3,
  waveMultiplier = 1
): BalanceEnemyTemplate[] {
  const n = cfg().enemies.normal;
  const g = gLevel(level);
  const packScale = cfg().enemies.packScale as Record<string, number>;
  const ps = packScale[String(packSize)] ?? 1;
  const hp = Math.floor(n.hp * g * ps * waveMultiplier);
  const atk = Math.floor(n.atk * g * waveMultiplier);
  const armor = Math.floor(n.armor * g);
  return Array.from({ length: packSize }, () => ({
    hp,
    maxHp: hp,
    attack: atk,
    armor,
    level,
    xp: idleKillXp(level, 'normal'),
    gold: idleKillGold(level),
  }));
}

export function buildDungeonBoss(level: number, partySize = 5, waveMultiplier = 1): BalanceEnemyTemplate {
  const n = cfg().enemies.normal;
  const b = cfg().enemies.dungeonBoss;
  const g = gLevel(level);
  const hp = Math.floor(n.hp * g * b.hp * waveMultiplier);
  const atk = Math.floor(n.atk * g * b.atk * waveMultiplier);
  const armor = Math.floor(n.armor * g * b.armor);
  return {
    hp,
    maxHp: hp,
    attack: atk,
    armor,
    level,
    xp: idleKillXp(level, 'boss'),
    gold: idleKillGold(level, 2),
    isBoss: true,
    bossKind: 'dungeon',
    aoeNextMs: b.aoeCooldownSec * 1000,
  };
}

export function buildRaidBoss(level: number, partySize = 5, waveMultiplier = 1): BalanceEnemyTemplate {
  const n = cfg().enemies.normal;
  const b = cfg().enemies.raidBoss;
  const g = gLevel(level);
  const partyScale = Math.max(5, partySize) / 5;
  const hp = Math.floor(n.hp * g * b.hp * partyScale * waveMultiplier);
  const atk = Math.floor(n.atk * g * b.atk * waveMultiplier);
  const armor = Math.floor(n.armor * g * b.armor);
  return {
    hp,
    maxHp: hp,
    attack: atk,
    armor,
    level,
    xp: idleKillXp(level, 'boss') * 3,
    gold: idleKillGold(level, 3),
    isBoss: true,
    bossKind: 'raid',
    aoeNextMs: b.aoeCooldownSec * 1000,
    fightStartMs: Date.now(),
  };
}

export function raidBossEnrageMultiplier(fightStartMs: number, nowMs: number): number {
  const b = cfg().enemies.raidBoss;
  const elapsedSec = (nowMs - fightStartMs) / 1000;
  if (elapsedSec <= b.enrageAfterSec) return 1;
  const extra = (elapsedSec - b.enrageAfterSec) / 10;
  return 1 + b.enrageAtkPer10Sec * extra;
}

export function getSwingIntervalMs(): number {
  return cfg().combat.swingIntervalMs;
}

export function getTrashDropChance(): number {
  return cfg().loot.trashDropChance;
}

export function getEliteDropChance(): number {
  return cfg().loot.eliteDropChance;
}

/** Legacy adapter for modules still importing BALANCE.enemy.* from balanceConfig */
export const balanceEnemyApi = {
  hpScaling: (level: number, difficulty = 1) =>
    Math.floor(cfg().enemies.normal.hp * gLevel(level) * difficulty),
  attackScaling: (level: number, difficulty = 1) =>
    Math.floor(cfg().enemies.normal.atk * gLevel(level) * difficulty),
  defenseScaling: (level: number, difficulty = 1) =>
    Math.floor(cfg().enemies.normal.armor * gLevel(level) * difficulty),
  xpScaling: (level: number, difficulty = 1) => Math.floor(idleKillXp(level) * difficulty),
  goldScaling: (level: number, difficulty = 1) => idleKillGold(level, difficulty),
};
