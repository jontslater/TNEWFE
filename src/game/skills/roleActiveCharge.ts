import { applyCooldownReduction } from './computeSkillModifiers';
import { resolveActiveAbility } from './activeAbilities';

export const ROLE_ACTIVE_READY_AT = 'roleActiveReadyAt';
export const ROLE_ACTIVE_DURATION_MS = 'roleActiveDurationMs';

export interface RoleActiveCooldowns {
  roleActiveReadyAt?: number;
  roleActiveDurationMs?: number;
}

export function getEffectiveAbilityCooldownMs(
  baseCooldownMs: number,
  cooldownReductionPercent: number
): number {
  return applyCooldownReduction(baseCooldownMs, cooldownReductionPercent);
}

/** progress 0..1; ready when progress >= 1 */
export function getRoleActiveChargeProgress(
  cooldowns: RoleActiveCooldowns | null | undefined,
  durationMs: number,
  now: number
): { progress: number; ready: boolean } {
  const readyAt = cooldowns?.roleActiveReadyAt ?? 0;
  const duration = cooldowns?.roleActiveDurationMs ?? durationMs;
  if (!duration || duration <= 0) {
    return { progress: 1, ready: true };
  }
  if (readyAt <= 0 || now >= readyAt) {
    return { progress: 1, ready: true };
  }
  const remaining = readyAt - now;
  const progress = 1 - Math.min(1, Math.max(0, remaining / duration));
  return { progress, ready: false };
}

export function beginRoleActiveCooldown(
  cooldowns: RoleActiveCooldowns | null | undefined,
  durationMs: number,
  now: number
): RoleActiveCooldowns {
  return {
    ...cooldowns,
    roleActiveReadyAt: now + durationMs,
    roleActiveDurationMs: durationMs,
  };
}

export function resolveDurationForHero(
  className: string,
  cooldownReductionPercent: number
): number {
  const ability = resolveActiveAbility(className);
  return getEffectiveAbilityCooldownMs(ability.cooldownMs, cooldownReductionPercent);
}
