/** Map hero class id to LFG combat role (tank / healer / dps). */
const TANK_CLASSES = new Set([
  'guardian',
  'paladin',
  'warden',
  'bloodknight',
  'vanguard',
  'brewmaster',
]);

const HEALER_CLASSES = new Set([
  'cleric',
  'atoner',
  'druid',
  'lightbringer',
  'shaman',
  'mistweaver',
  'chronomancer',
]);

export type CombatRole = 'tank' | 'healer' | 'dps';

export function getCombatRoleFromClass(classId: string | undefined | null): CombatRole {
  const role = (classId || '').toLowerCase();
  if (TANK_CLASSES.has(role)) return 'tank';
  if (HEALER_CLASSES.has(role)) return 'healer';
  return 'dps';
}
