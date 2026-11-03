/**
 * Shared hero stat math for battlefield overlay, player portal, raids, and backend porting.
 *
 * Port note: this module is self-contained aside from ROLE_CONFIG / set bonus tables.
 */

export * from './types';
export * from './skillBonuses';
export * from './computeHeroStats';
export * from './combatHelpers';
export * from './applyHeroCombatStats';

export { computeHeroStats as calculateHeroStats } from './computeHeroStats';
export { calculateHeroBaseDamage } from './heroBaseDamage';
