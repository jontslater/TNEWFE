import { describe, it, expect } from 'vitest';
import { getCombatRoleFromClass } from './combatRole';

describe('getCombatRoleFromClass', () => {
  it('maps tanks', () => {
    expect(getCombatRoleFromClass('guardian')).toBe('tank');
  });

  it('maps healers', () => {
    expect(getCombatRoleFromClass('cleric')).toBe('healer');
  });

  it('defaults to dps', () => {
    expect(getCombatRoleFromClass('berserker')).toBe('dps');
    expect(getCombatRoleFromClass(undefined)).toBe('dps');
  });
});
