import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, onSnapshot, DocumentSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { Hero } from '../types/Hero';
import { PlayerQuestProgress } from '../types/Quest';

/**
 * Consolidated hero listener hook
 * Provides hero data, quest progress, and unclaimed quest count from a single Firestore listener
 * This replaces separate listeners in Navigation, QuestTracker, and useHeroRealtime
 */
export function useHeroListener(userId: string | null) {
  const [hero, setHero] = useState<Hero | null>(null);
  const [questProgress, setQuestProgress] = useState<PlayerQuestProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const listenerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setHero(null);
      setQuestProgress(null);
      return;
    }

    // Set up single consolidated real-time listener
    const unsubscribe = onSnapshot(
      doc(db, 'heroes', userId),
      (docSnapshot: DocumentSnapshot) => {
        if (docSnapshot.exists()) {
          const heroData = { id: docSnapshot.id, ...docSnapshot.data() } as Hero;
          setHero(heroData);
          setQuestProgress(heroData.questProgress || null);
          setError(null);
        } else {
          setHero(null);
          setQuestProgress(null);
          setError('Hero not found');
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to hero updates:', err);
        setError('Failed to load hero');
        setLoading(false);
      }
    );

    listenerRef.current = unsubscribe;

    // Cleanup listener on unmount
    return () => {
      if (listenerRef.current) {
        listenerRef.current();
        listenerRef.current = null;
      }
    };
  }, [userId]);

  // Calculate unclaimed quest count (used by Navigation)
  const getUnclaimedQuestCount = useCallback((dailyQuests: any, weeklyQuests: any, monthlyQuests: any): number => {
    if (!questProgress) return 0;

    let count = 0;

    // Count unclaimed daily quests
    if (dailyQuests?.quests) {
      dailyQuests.quests.forEach((q: any) => {
        const progress = questProgress.daily?.[q.id];
        if (progress?.completed && !progress?.claimedAt) count++;
      });
    }

    // Count unclaimed weekly quests
    if (weeklyQuests?.quests) {
      weeklyQuests.quests.forEach((q: any) => {
        const progress = questProgress.weekly?.[q.id];
        if (progress?.completed && !progress?.claimedAt) count++;
      });
    }

    // Count unclaimed monthly quests
    if (monthlyQuests?.quests) {
      monthlyQuests.quests.forEach((q: any) => {
        const progress = questProgress.monthly?.[q.id];
        if (progress?.completed && !progress?.claimedAt) count++;
      });
    }

    // Check completion bonuses
    if (dailyQuests?.quests && dailyQuests.quests.every((q: any) => questProgress.daily?.[q.id]?.completed) && !questProgress.dailyBonusClaimed) {
      count++;
    }
    if (weeklyQuests?.quests && weeklyQuests.quests.every((q: any) => questProgress.weekly?.[q.id]?.completed) && !questProgress.weeklyBonusClaimed) {
      count++;
    }
    if (monthlyQuests?.quests && monthlyQuests.quests.every((q: any) => questProgress.monthly?.[q.id]?.completed) && !questProgress.monthlyBonusClaimed) {
      count++;
    }

    return count;
  }, [questProgress]);

  return { 
    hero, 
    questProgress,
    loading, 
    error, 
    getUnclaimedQuestCount
  };
}
