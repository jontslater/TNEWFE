import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useHero } from '../hooks/useHero';
import { skillsAPI } from '../api/client';
import { resolveHeroDocId } from '../utils/resolveHeroDocId';
import {
  buildSkillAllocationPlan,
  canDecrementDraftSkill,
  canIncrementDraftSkill,
  computeDraftRemainingPoints,
  countPendingAllocations,
  hasSkillDraftChanges,
  skillPointsMapFromSkills,
  type SkillPointsById,
} from '../utils/skillDraft';

interface Skill {
  id: string;
  name: string;
  description: string;
  unlockLevel: number;
  effect: string;
  baseValue: number;
  maxPoints: number;
  points?: number;
  unlockedAt?: number | null;
}

interface SkillsPageProps {
  hero?: any;
  /** Firestore hero document id (not Twitch user id) */
  heroId?: string;
  /** @deprecated use heroId — kept for call sites passing user.id from JWT */
  userId?: string;
  onDraftDirtyChange?: (dirty: boolean) => void;
}

export default function SkillsPage({ hero, heroId, userId, onDraftDirtyChange }: SkillsPageProps) {
  const { user } = useAuth();
  const { hero: authHero } = useHero(user?.twitchId || null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [baselineSkillPoints, setBaselineSkillPoints] = useState(0);
  const [baselinePointsBySkillId, setBaselinePointsBySkillId] = useState<SkillPointsById>({});
  const [draftPointsBySkillId, setDraftPointsBySkillId] = useState<SkillPointsById>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedHero = hero ?? authHero;
  const targetHeroId = useMemo(
    () =>
      resolveHeroDocId({
        hero: resolvedHero,
        explicitHeroId: heroId ?? userId,
        twitchUserId: user?.twitchId,
        authHeroId: user?.id,
      }),
    [resolvedHero, heroId, userId, user?.twitchId, user?.id]
  );

  const draftRemainingPoints = useMemo(
    () =>
      computeDraftRemainingPoints(
        baselineSkillPoints,
        baselinePointsBySkillId,
        draftPointsBySkillId
      ),
    [baselineSkillPoints, baselinePointsBySkillId, draftPointsBySkillId]
  );

  const pendingAllocations = useMemo(
    () => countPendingAllocations(baselinePointsBySkillId, draftPointsBySkillId),
    [baselinePointsBySkillId, draftPointsBySkillId]
  );

  const hasUnsavedChanges = useMemo(
    () => hasSkillDraftChanges(baselinePointsBySkillId, draftPointsBySkillId),
    [baselinePointsBySkillId, draftPointsBySkillId]
  );

  useEffect(() => {
    onDraftDirtyChange?.(hasUnsavedChanges);
  }, [hasUnsavedChanges, onDraftDirtyChange]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [hasUnsavedChanges]);

  const applyServerSkills = useCallback((data: { skills?: Skill[]; skillPoints?: number }) => {
    const list = data.skills || [];
    const map = skillPointsMapFromSkills(list);
    setSkills(list);
    setBaselineSkillPoints(data.skillPoints || 0);
    setBaselinePointsBySkillId(map);
    setDraftPointsBySkillId({ ...map });
  }, []);

  const loadSkills = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!targetHeroId) return;

      try {
        if (!options?.silent) {
          setLoading(true);
        }
        setError(null);
        const data = await skillsAPI.getHeroSkills(targetHeroId);
        applyServerSkills(data);
      } catch (err: any) {
        const status = err.response?.status;
        const apiError = err.response?.data?.error;
        if (status === 404) {
          setError(
            apiError ||
              'Hero not found for skills. Re-select your hero in the Portal or log in again.'
          );
        } else {
          setError(apiError || err.message || 'Failed to load skills');
        }
      } finally {
        if (!options?.silent) {
          setLoading(false);
        }
      }
    },
    [targetHeroId, applyServerSkills]
  );

  useEffect(() => {
    if (targetHeroId) {
      loadSkills();
    } else {
      setLoading(false);
      setError('Select a hero in the Player Portal to manage skills.');
    }
  }, [targetHeroId, loadSkills]);

  const calculateExpectedPoints = (level: number) => {
    const FIRST = 6;
    const MAX = 100;
    if (level < FIRST) return 0;
    let count = 0;
    for (let l = FIRST; l <= Math.min(level, MAX); l += 2) {
      count++;
    }
    return count;
  };

  const pointsSpent = useMemo(
    () => Object.values(baselinePointsBySkillId).reduce((sum, n) => sum + n, 0),
    [baselinePointsBySkillId]
  );

  const heroLevel = resolvedHero?.level || 0;
  const expectedTotal = calculateExpectedPoints(heroLevel);
  const shouldHavePoints = expectedTotal - pointsSpent;
  const needsRetroactivePoints = heroLevel >= 6 && baselineSkillPoints < shouldHavePoints;

  const incrementDraftPoint = (skillId: string, maxPoints: number) => {
    if (!canIncrementDraftSkill(skillId, maxPoints, draftPointsBySkillId, draftRemainingPoints)) {
      return;
    }
    setDraftPointsBySkillId((prev) => ({
      ...prev,
      [skillId]: (prev[skillId] || 0) + 1,
    }));
    setError(null);
  };

  const decrementDraftPoint = (skillId: string) => {
    if (!canDecrementDraftSkill(skillId, baselinePointsBySkillId, draftPointsBySkillId)) {
      return;
    }
    setDraftPointsBySkillId((prev) => ({
      ...prev,
      [skillId]: (prev[skillId] || 0) - 1,
    }));
    setError(null);
  };

  const cancelDraft = () => {
    setDraftPointsBySkillId({ ...baselinePointsBySkillId });
    setError(null);
  };

  const saveDraft = async () => {
    if (!targetHeroId || !hasUnsavedChanges) return;

    let plan: ReturnType<typeof buildSkillAllocationPlan>;
    try {
      plan = buildSkillAllocationPlan(baselinePointsBySkillId, draftPointsBySkillId);
    } catch (err: any) {
      setError(err.message || 'Invalid skill draft');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await skillsAPI.allocateSkillPointsBatch(targetHeroId, plan);
      await loadSkills({ silent: true });
    } catch (err: any) {
      const apiError = err.response?.data?.error;
      setError(apiError || err.message || 'Failed to save skill allocations');
      await loadSkills({ silent: true });
    } finally {
      setSaving(false);
    }
  };

  const resetSkills = async () => {
    if (hasUnsavedChanges) {
      if (
        !window.confirm(
          'You have unsaved draft changes that will be discarded. Continue with paid skill reset?'
        )
      ) {
        return;
      }
    }
    if (!confirm('Reset all skills? This costs 500 tokens.')) return;
    if (!targetHeroId) return;

    try {
      await skillsAPI.resetSkills(targetHeroId, 500);
      await loadSkills({ silent: true });
    } catch (err: any) {
      const apiError = err.response?.data?.error;
      setError(apiError || err.message || 'Failed to reset skills');
    }
  };

  const handleRetroactivePoints = async () => {
    if (!targetHeroId) {
      alert('No hero ID available');
      return;
    }

    try {
      const data = await skillsAPI.addRetroactivePoints(targetHeroId);
      if (data.success) {
        if (data.newPoints !== undefined) {
          alert(`✅ ${data.message}\nPrevious: ${data.previousPoints} points\nNew: ${data.newPoints} points`);
        } else {
          alert(`ℹ️ ${data.message}`);
        }
        await loadSkills({ silent: true });
      } else {
        alert(data.error || 'Failed to add retroactive skill points');
      }
    } catch (err: any) {
      console.error('Error adding retroactive points:', err);
      alert(err.response?.data?.error || 'Failed to add retroactive skill points');
    }
  };

  if (loading) {
    return <div className="p-8">Loading skills...</div>;
  }

  const unlockedSkills = skills.filter((s) => (resolvedHero?.level || 0) >= s.unlockLevel);
  const lockedSkills = skills.filter((s) => (resolvedHero?.level || 0) < s.unlockLevel);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-indigo-900 to-gray-800 rounded-lg p-6 border-2 border-indigo-600">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-2">
              Skills
            </h1>
            {hero && (
              <div className="text-sm text-gray-400">
                {hero.role} - Level {hero.level}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="bg-gray-900/50 px-4 py-2 rounded-lg border border-indigo-600">
              <div className="text-xs text-gray-400 mb-1">Available Points</div>
              <div className="text-2xl font-bold text-blue-400">{draftRemainingPoints}</div>
              {hasUnsavedChanges && (
                <div className="text-xs text-amber-300 mt-1">
                  {pendingAllocations} pending · {baselineSkillPoints} saved on server
                </div>
              )}
            </div>
            {hasUnsavedChanges && (
              <>
                <button
                  type="button"
                  onClick={saveDraft}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-lg transition-colors font-semibold"
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
                <button
                  type="button"
                  onClick={cancelDraft}
                  disabled={saving}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 disabled:opacity-60 text-white rounded-lg transition-colors font-semibold"
                >
                  Reset draft
                </button>
              </>
            )}
            <button
              type="button"
              onClick={resetSkills}
              disabled={saving}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-lg transition-colors font-semibold"
            >
              Reset (500 tokens)
            </button>
          </div>
        </div>

        {hasUnsavedChanges && (
          <div className="bg-amber-900/30 border border-amber-500 rounded-lg p-3 mb-4 text-amber-100 text-sm">
            You have unsaved skill allocations. Use Save to apply ({pendingAllocations} point
            {pendingAllocations === 1 ? '' : 's'}), or Reset draft to undo local changes.
          </div>
        )}

        {needsRetroactivePoints && (
          <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 mb-4">
            <div className="text-yellow-300 text-sm">
              ⚠️ You have {shouldHavePoints - baselineSkillPoints} missing skill points (Level{' '}
              {heroLevel} should have {expectedTotal} total, {shouldHavePoints} available after{' '}
              {pointsSpent} spent).
              <button
                type="button"
                onClick={handleRetroactivePoints}
                className="ml-2 underline hover:text-yellow-200 font-semibold"
              >
                Click here to add retroactive skill points
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-900/50 border-2 border-red-600 rounded-lg p-4">
          <div className="text-red-300 font-semibold">Error</div>
          <div className="text-red-200">{error}</div>
        </div>
      )}

      {unlockedSkills.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>✨</span>
            <span>Unlocked Skills ({unlockedSkills.length})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unlockedSkills.map((skill) => {
              const savedPoints = baselinePointsBySkillId[skill.id] || 0;
              const points = draftPointsBySkillId[skill.id] ?? savedPoints;
              const isMaxed = points >= skill.maxPoints;
              const canAdd = canIncrementDraftSkill(
                skill.id,
                skill.maxPoints,
                draftPointsBySkillId,
                draftRemainingPoints
              );
              const canRemove = canDecrementDraftSkill(
                skill.id,
                baselinePointsBySkillId,
                draftPointsBySkillId
              );
              const effectValue = skill.baseValue * points;
              const pendingOnSkill = points - savedPoints;

              return (
                <div
                  key={skill.id}
                  className={`rounded-xl p-5 border-2 transition-all ${
                    points > 0
                      ? 'border-green-500 bg-gradient-to-br from-green-900/50 to-green-800/30 shadow-lg shadow-green-500/20'
                      : 'border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900 hover:border-indigo-500'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg text-white">{skill.name}</h3>
                    <div
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        isMaxed ? 'bg-green-600 text-green-100' : 'bg-gray-700 text-gray-300'
                      }`}
                    >
                      {points}/{skill.maxPoints}
                      {pendingOnSkill > 0 && (
                        <span className="text-amber-200 ml-1">(+{pendingOnSkill})</span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-gray-300 mb-3 min-h-[40px]">{skill.description}</p>

                  <div className="mb-3 space-y-1">
                    <div className="text-xs text-gray-400">Unlocks at level {skill.unlockLevel}</div>
                    {points > 0 && (
                      <div className="text-sm font-semibold text-green-400">
                        Current Effect: +{effectValue}%
                      </div>
                    )}
                    {!isMaxed && (
                      <div className="text-xs text-blue-400">Next point: +{skill.baseValue}%</div>
                    )}
                  </div>

                  <div className="mb-3">
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          isMaxed ? 'bg-green-500' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${(points / skill.maxPoints) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => decrementDraftPoint(skill.id)}
                      disabled={!canRemove || saving}
                      className={`flex-1 px-3 py-2 rounded-lg font-semibold transition-all ${
                        canRemove && !saving
                          ? 'bg-gray-600 hover:bg-gray-500 text-white'
                          : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      −
                    </button>
                    <button
                      type="button"
                      onClick={() => incrementDraftPoint(skill.id, skill.maxPoints)}
                      disabled={!canAdd || saving}
                      className={`flex-1 px-3 py-2 rounded-lg font-semibold transition-all ${
                        isMaxed
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : canAdd && !saving
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white transform hover:scale-105'
                          : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isMaxed ? 'Maxed' : '+'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {lockedSkills.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-400 mb-4 flex items-center gap-2">
            <span>🔒</span>
            <span>Locked Skills ({lockedSkills.length})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lockedSkills.map((skill) => (
              <div
                key={skill.id}
                className="rounded-xl p-5 border-2 border-gray-700 bg-gray-900/50 opacity-60"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-lg text-gray-500">{skill.name}</h3>
                  <div className="px-2 py-1 rounded text-xs font-semibold bg-gray-800 text-gray-500">
                    0/{skill.maxPoints}
                  </div>
                </div>

                <p className="text-sm text-gray-500 mb-3">{skill.description}</p>

                <div className="text-xs text-gray-500">Unlocks at level {skill.unlockLevel}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {skills.length === 0 && (
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
          <div className="text-gray-400">No skills available for this hero.</div>
        </div>
      )}
    </div>
  );
}
