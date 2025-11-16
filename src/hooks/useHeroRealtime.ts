import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { Hero } from '../types/Hero';
import { heroAPI } from '../api/client';

/**
 * Real-time hero hook - automatically updates when data changes in Firebase
 */
export function useHeroRealtime(userId: string | null) {
  const [hero, setHero] = useState<Hero | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setHero(null);
      return;
    }

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      doc(db, 'heroes', userId),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const heroData = { id: docSnapshot.id, ...docSnapshot.data() } as Hero;
          setHero(heroData);
          setError(null);
        } else {
          setHero(null);
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

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [userId]);

  const updateHero = async (updates: Partial<Hero>) => {
    if (!userId) return;
    
    try {
      // Update via API - Firestore listener will automatically update the UI
      await heroAPI.updateHero(userId, updates);
    } catch (err) {
      setError('Failed to update hero');
      console.error(err);
    }
  };

  return { hero, loading, error, updateHero };
}
