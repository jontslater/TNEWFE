/**
 * Backend porting entry point — import stat helpers without React overlay code.
 *
 * Example (Node): copy `src/game/stats` + `src/utils/setBonuses.ts` + ROLE_CONFIG from fullCombatEngine.
 */
export {
  applyHeroCombatStats,
  applyRewardBonus,
  applyStatDamageReduction,
  calculateHeroBaseDamage,
  calculateSkillBonuses,
  computeHeroStats,
  getCharacterStats,
  getCritDamageMultiplier,
} from './index';
export type { ComputedHeroStats, HeroStatInput, RewardStatBonuses, SkillStatBonuses } from './types';
