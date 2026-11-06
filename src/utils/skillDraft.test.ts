import { describe, expect, it } from 'vitest';
import {
  buildSkillAllocationPlan,
  computeDraftRemainingPoints,
  countPendingAllocations,
  hasSkillDraftChanges,
} from './skillDraft';

describe('skillDraft', () => {
  const baseline = { a: 1, b: 0 };
  const draft = { a: 2, b: 1 };

  it('computes remaining and pending counts', () => {
    expect(countPendingAllocations(baseline, draft)).toBe(2);
    expect(computeDraftRemainingPoints(5, baseline, draft)).toBe(3);
  });

  it('detects draft changes', () => {
    expect(hasSkillDraftChanges(baseline, baseline)).toBe(false);
    expect(hasSkillDraftChanges(baseline, draft)).toBe(true);
  });

  it('builds allocation plan for increases only', () => {
    expect(buildSkillAllocationPlan(baseline, draft)).toEqual([
      { skillId: 'a', count: 1 },
      { skillId: 'b', count: 1 },
    ]);
  });

  it('rejects plan below saved baseline', () => {
    expect(() => buildSkillAllocationPlan({ a: 2 }, { a: 1 })).toThrow(/remove saved/);
  });
});
