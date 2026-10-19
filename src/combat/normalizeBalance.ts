import type { BalancePayload } from './balanceLoader';
import bundled from './data/balance.json';

function isBundledShape(data: unknown): data is BalancePayload {
  const d = data as Record<string, unknown>;
  return Boolean(d?.levelCurve && d?.heroRoles && d?.combat && d?.gear);
}

/** Map GET /api/balance (backend export) into bundled FE shape; null if unrecognized. */
export function normalizeRemoteBalance(raw: unknown): BalancePayload | null {
  if (!raw || typeof raw !== 'object') return null;
  if (isBundledShape(raw)) return raw as BalancePayload;

  const d = raw as Record<string, unknown>;
  if (!d.roleBaseStats || !d.gear) return null;

  const roleBase = d.roleBaseStats as Record<string, Record<string, number>>;
  const gear = d.gear as Record<string, unknown>;
  const caps = (d.combatCaps as Record<string, number>) || {};

  const critMap = (gear.setCritPercent as Record<string, number>) || {};
  const critBonusFullSet: Record<string, number> = {};
  for (const [k, v] of Object.entries(critMap)) {
    critBonusFullSet[k] = typeof v === 'number' && v > 1 ? v / 100 : v;
  }

  const gPerLevel = 0.1;
  const normalized: BalancePayload = {
    ...bundled,
    version: typeof d.version === 'number' ? d.version : bundled.version,
    levelCurve: {
      gPerLevel,
      xpToNextCoefficient:
        typeof d.xpLevelCoefficient === 'number'
          ? d.xpLevelCoefficient
          : bundled.levelCurve.xpToNextCoefficient,
      xpToNextExponent: bundled.levelCurve.xpToNextExponent,
    },
    combat: {
      ...bundled.combat,
      damageReductionCap: caps.damageReduction ?? bundled.combat.damageReductionCap,
      critChanceCap: caps.critChance ?? bundled.combat.critChanceCap,
      critMultiplier: caps.critMultiplier ?? bundled.combat.critMultiplier,
    },
    chat: {
      percentPerActiveChatter: 0.02,
      damageHealCap: caps.chatDamageHealBonusCap ?? bundled.chat.damageHealCap,
      lootWeightPercentPerChatter: bundled.chat.lootWeightPercentPerChatter,
      lootWeightCap: caps.chatLootRarityBonusCap ?? bundled.chat.lootWeightCap,
    },
    heroRoles: {
      tank: {
        hp: roleBase.tank?.hp ?? bundled.heroRoles.tank.hp,
        atk: roleBase.tank?.atk ?? bundled.heroRoles.tank.atk,
        spellPower: roleBase.tank?.spellPower ?? 0,
        armor: roleBase.tank?.armor ?? bundled.heroRoles.tank.armor,
        crit: roleBase.tank?.crit ?? bundled.heroRoles.tank.crit,
      },
      healer: {
        hp: roleBase.healer?.hp ?? bundled.heroRoles.healer.hp,
        atk: roleBase.healer?.atk ?? bundled.heroRoles.healer.atk,
        spellPower: roleBase.healer?.spellPower ?? bundled.heroRoles.healer.spellPower,
        armor: roleBase.healer?.armor ?? bundled.heroRoles.healer.armor,
        crit: roleBase.healer?.crit ?? bundled.heroRoles.healer.crit,
      },
      dps: {
        hp: roleBase.dps?.hp ?? bundled.heroRoles.dps.hp,
        atk: roleBase.dps?.atk ?? bundled.heroRoles.dps.atk,
        spellPower: roleBase.dps?.spellPower ?? 0,
        armor: roleBase.dps?.armor ?? bundled.heroRoles.dps.armor,
        crit: roleBase.dps?.crit ?? bundled.heroRoles.dps.crit,
      },
    },
    gear: {
      setFraction: (gear.budgetFraction as number) ?? bundled.gear.setFraction,
      R: (gear.rarityR as BalancePayload['gear']['R']) ?? bundled.gear.R,
      critBonusFullSet: { ...bundled.gear.critBonusFullSet, ...critBonusFullSet },
    },
  };

  if (d.activeAbilities && typeof d.activeAbilities === 'object') {
    (normalized as BalancePayload & { activeAbilities?: unknown }).activeAbilities = d.activeAbilities;
  }

  return normalized;
}
