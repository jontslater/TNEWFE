/**
 * Role classification utilities for overlay
 * Pure functions for determining hero roles and categories
 */

export const isTankRole = (role: string): boolean => {
  const tankRoles = ['guardian', 'paladin', 'warden', 'bloodknight', 'vanguard', 'brewmaster'];
  return tankRoles.includes(role.toLowerCase());
};

export const isHealerRole = (role: string): boolean => {
  const healerRoles = ['cleric', 'atoner', 'druid', 'lightbringer', 'shaman', 'mistweaver', 'chronomancer', 'bard'];
  return healerRoles.includes(role.toLowerCase());
};

export const isDpsRole = (role: string): boolean => {
  return !isTankRole(role) && !isHealerRole(role);
};

export const isMeleeRole = (role: string): boolean => {
  const meleeRoles = ['berserker', 'crusader', 'assassin', 'reaper', 'bladedancer', 'monk', 'stormwarrior', 'hunter'];
  return meleeRoles.includes(role.toLowerCase());
};

export const isCasterRole = (role: string): boolean => {
  const casterRoles = ['mage', 'warlock', 'elementalist', 'necromancer', 'sorcerer', 'pyromancer', 'ranger', 'shadowpriest', 'mooncaller', 'stormcaller', 'firemage', 'frostmage', 'dragonsorcerer'];
  return casterRoles.includes(role.toLowerCase());
};

export const isEvasionClass = (role: string): boolean => {
  const evasionClasses = ['assassin', 'monk', 'bladedancer', 'hunter'];
  return evasionClasses.includes(role.toLowerCase());
};

export const normalizeRole = (role: string): 'tank' | 'healer' | 'dps' => {
  if (!role) return 'dps';
  const roleLower = role.toLowerCase();
  if (isTankRole(roleLower)) return 'tank';
  if (isHealerRole(roleLower)) return 'healer';
  return 'dps';
};
