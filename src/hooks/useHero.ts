import { useState, useEffect } from 'react';
import { Hero } from '../types/Hero';
import { heroAPI } from '../api/client';

export function useHero(userId: string | null) {
  const [hero, setHero] = useState<Hero | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    loadHero();
  }, [userId]);

  const loadHero = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const data = await heroAPI.getHero(userId);
      setHero(data);
      setError(null);
    } catch (err) {
      setError('Failed to load hero');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateHero = async (updates: Partial<Hero>) => {
    if (!userId) return;
    
    try {
      const updated = await heroAPI.updateHero(userId, updates);
      setHero(updated);
    } catch (err) {
      setError('Failed to update hero');
      console.error(err);
    }
  };

  return { hero, loading, error, refetch: loadHero, updateHero };
}
