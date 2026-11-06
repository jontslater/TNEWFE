export type SkillPointsById = Record<string, number>;

export function sumAllocatedSkillPoints(pointsById: SkillPointsById): number {
  return Object.values(pointsById).reduce((sum, n) => sum + (n || 0), 0);
}

/** Remaining unspent points after pending draft allocations vs server baseline. */
export function computeDraftRemainingPoints(
  baselineAvailable: number,
  baselineBySkill: SkillPointsById,
  draftBySkill: SkillPointsById
): number {
  const pendingSpend =
    sumAllocatedSkillPoints(draftBySkill) - sumAllocatedSkillPoints(baselineBySkill);
  return baselineAvailable - pendingSpend;
}

export function countPendingAllocations(
  baselineBySkill: SkillPointsById,
  draftBySkill: SkillPointsById
): number {
  return sumAllocatedSkillPoints(draftBySkill) - sumAllocatedSkillPoints(baselineBySkill);
}

export function hasSkillDraftChanges(
  baselineBySkill: SkillPointsById,
  draftBySkill: SkillPointsById
): boolean {
  const ids = new Set([...Object.keys(baselineBySkill), ...Object.keys(draftBySkill)]);
  for (const id of ids) {
    if ((baselineBySkill[id] || 0) !== (draftBySkill[id] || 0)) return true;
  }
  return false;
}

/** Ordered list of single-point allocations to send on Save (increases only). */
export function buildSkillAllocationPlan(
  baselineBySkill: SkillPointsById,
  draftBySkill: SkillPointsById
): { skillId: string; count: number }[] {
  const ids = new Set([...Object.keys(baselineBySkill), ...Object.keys(draftBySkill)]);
  const plan: { skillId: string; count: number }[] = [];
  for (const skillId of ids) {
    const delta = (draftBySkill[skillId] || 0) - (baselineBySkill[skillId] || 0);
    if (delta < 0) {
      throw new Error(
        'Draft would remove saved skill points; use Reset (500 tokens) or cancel draft changes.'
      );
    }
    if (delta > 0) plan.push({ skillId, count: delta });
  }
  return plan;
}

export function skillPointsMapFromSkills(
  skills: Array<{ id: string; points?: number }>
): SkillPointsById {
  return Object.fromEntries(skills.map((s) => [s.id, s.points || 0]));
}

export function canIncrementDraftSkill(
  skillId: string,
  maxPoints: number,
  draftBySkill: SkillPointsById,
  draftRemaining: number
): boolean {
  if (draftRemaining <= 0) return false;
  return (draftBySkill[skillId] || 0) < maxPoints;
}

export function canDecrementDraftSkill(
  skillId: string,
  baselineBySkill: SkillPointsById,
  draftBySkill: SkillPointsById
): boolean {
  return (draftBySkill[skillId] || 0) > (baselineBySkill[skillId] || 0);
}
