import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useHero } from '../hooks/useHero';
import { skillsAPI } from '../api/client';
import { resolveHeroDocId } from '../utils/resolveHeroDocId';

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
}

export default function SkillsPage({ hero, heroId, userId }: SkillsPageProps) {
  const { user } = useAuth();
  const { hero: authHero } = useHero(user?.twitchId || null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillPoints, setSkillPoints] = useState(0);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    if (targetHeroId) {
      loadSkills();
    } else {
      setLoading(false);
      setError('Select a hero in the Player Portal to manage skills.');
    }
  }, [targetHeroId]);

  const loadSkills = async () => {
    if (!targetHeroId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await skillsAPI.getHeroSkills(targetHeroId);
      setSkills(data.skills || []);
      setSkillPoints(data.skillPoints || 0);
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
      setLoading(false);
    }
  };

  // Calculate expected skill points based on level (matches backend skills.js)
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

  // Calculate points spent in skills
  const pointsSpent = skills.reduce((sum, skill) => sum + (skill.points || 0), 0);
  
  // Calculate what they should have (total earned minus spent)
  const heroLevel = resolvedHero?.level || 0;
  const expectedTotal = calculateExpectedPoints(heroLevel);
  const shouldHavePoints = expectedTotal - pointsSpent;
  
  // Show button if they have fewer points than they should have
  const needsRetroactivePoints = heroLevel >= 6 && skillPoints < shouldHavePoints;

  const allocatePoint = async (skillId: string) => {
    if (!targetHeroId) return;
    
    try {
      setError(null);
      const result = await skillsAPI.allocateSkillPoint(targetHeroId, skillId);
      setSkillPoints(result.remainingPoints);
      await loadSkills();
    } catch (err: any) {
      const apiError = err.response?.data?.error;
      setError(apiError || err.message || 'Failed to allocate skill point');
    }
  };

  const resetSkills = async () => {
    if (!confirm('Reset all skills? This costs 500 tokens.')) return;
    if (!targetHeroId) return;
    
    try {
      await skillsAPI.resetSkills(targetHeroId, 500);
      await loadSkills();
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
        loadSkills();
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

  const unlockedSkills = skills.filter(s => (resolvedHero?.level || 0) >= s.unlockLevel);
  const lockedSkills = skills.filter(s => (resolvedHero?.level || 0) < s.unlockLevel);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-900 to-gray-800 rounded-lg p-6 border-2 border-indigo-600">
        <div className="flex justify-between items-center mb-4">
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
          <div className="flex gap-4 items-center">
            <div className="bg-gray-900/50 px-4 py-2 rounded-lg border border-indigo-600">
              <div className="text-xs text-gray-400 mb-1">Available Points</div>
              <div className="text-2xl font-bold text-blue-400">{skillPoints}</div>
            </div>
            <button
              onClick={resetSkills}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-semibold"
            >
              Reset (500 tokens)
            </button>
          </div>
        </div>
        
        {needsRetroactivePoints && (
          <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 mb-4">
            <div className="text-yellow-300 text-sm">
              ⚠️ You have {shouldHavePoints - skillPoints} missing skill points (Level {heroLevel} should have {expectedTotal} total, {shouldHavePoints} available after {pointsSpent} spent). 
              <button 
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

      {/* Unlocked Skills */}
      {unlockedSkills.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>✨</span>
            <span>Unlocked Skills ({unlockedSkills.length})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unlockedSkills.map((skill) => {
              const points = skill.points || 0;
              const isMaxed = points >= skill.maxPoints;
              const canAllocate = skillPoints > 0 && !isMaxed;
              const effectValue = skill.baseValue * points;
              
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
                    <div className={`px-2 py-1 rounded text-xs font-semibold ${
                      isMaxed ? 'bg-green-600 text-green-100' : 'bg-gray-700 text-gray-300'
                    }`}>
                      {points}/{skill.maxPoints}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-300 mb-3 min-h-[40px]">{skill.description}</p>
                  
                  <div className="mb-3 space-y-1">
                    <div className="text-xs text-gray-400">
                      Unlocks at level {skill.unlockLevel}
                    </div>
                    {points > 0 && (
                      <div className="text-sm font-semibold text-green-400">
                        Current Effect: +{effectValue}%
                      </div>
                    )}
                    {!isMaxed && (
                      <div className="text-xs text-blue-400">
                        Next point: +{skill.baseValue}%
                      </div>
                    )}
                  </div>
                  
                  {/* Progress bar */}
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
                  
                  <button
                    onClick={() => allocatePoint(skill.id)}
                    disabled={!canAllocate}
                    className={`w-full px-4 py-2 rounded-lg font-semibold transition-all ${
                      isMaxed
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : canAllocate
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white transform hover:scale-105'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isMaxed ? '✓ Maxed' : canAllocate ? 'Allocate Point' : 'No Points Available'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Locked Skills */}
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
                
                <div className="text-xs text-gray-500">
                  Unlocks at level {skill.unlockLevel}
                </div>
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
