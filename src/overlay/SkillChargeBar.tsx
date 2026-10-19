import React, { useEffect, useState } from 'react';
import { computeSkillModifiers } from '../game/skills/computeSkillModifiers';
import { resolveActiveAbility, roleCategoryColor } from '../game/skills/activeAbilities';
import {
  getRoleActiveChargeProgress,
  resolveDurationForHero,
} from '../game/skills/roleActiveCharge';
import { subscribeSkillChargeTicker, getSkillChargeNow } from './skillChargeTicker';

export interface SkillChargeBarProps {
  heroRole: string;
  cooldowns?: Record<string, number | undefined>;
  skills?: Record<string, { points?: number }>;
  /** Cosmetic charge bar variant id (e.g. `flame` from charge_flame). */
  chargeBarVariant?: string;
}

export const SkillChargeBar: React.FC<SkillChargeBarProps> = ({
  heroRole,
  cooldowns,
  skills,
  chargeBarVariant,
}) => {
  const ability = resolveActiveAbility(heroRole);
  const category = ability.role;
  const fillColor = roleCategoryColor(category);

  const [, setTick] = useState(0);
  useEffect(() => subscribeSkillChargeTicker(() => setTick((t) => t + 1)), []);

  const mods = computeSkillModifiers({ role: heroRole, skills });
  const durationMs = resolveDurationForHero(heroRole, mods.cooldownReduction);
  const now = getSkillChargeNow();
  const { progress, ready } = getRoleActiveChargeProgress(cooldowns, durationMs, now);
  const widthPct = Math.round(progress * 100);

  const flameStyle =
    chargeBarVariant === 'flame'
      ? {
          background: 'linear-gradient(90deg, #f97316 0%, #ef4444 100%)',
          boxShadow: ready ? '0 0 8px #f97316' : undefined,
        }
      : {
          backgroundColor: fillColor,
          boxShadow: ready ? `0 0 8px ${fillColor}` : undefined,
        };

  return (
    <div
      style={{
        width: '120px',
        height: '4px',
        marginBottom: '2px',
        backgroundColor: 'rgba(0,0,0,0.85)',
        border: '1px solid rgba(30,30,30,0.95)',
        borderRadius: '2px',
        overflow: 'hidden',
        transform: 'translateY(-40px)',
        boxShadow: ready
          ? chargeBarVariant === 'flame'
            ? '0 0 6px #f97316'
            : `0 0 6px ${fillColor}`
          : undefined,
      }}
      title={ability.name}
    >
      <div
        style={{
          width: `${widthPct}%`,
          height: '100%',
          transition: 'width 0.2s linear',
          ...flameStyle,
        }}
      />
    </div>
  );
};
