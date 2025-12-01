import { useState, useEffect } from 'react';
import { Hero } from '../types/Hero';
import { heroAPI } from '../api/client';

// NOTE: userId here is expected to be the Twitch user ID for the player,
// which the backend uses to find the correct hero document.
export function useHero(userId: string | null) {
  const [hero, setHero] = useState<Hero | null>(null);
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setHero(null);
      setHeroes([]);
      return;
    }

    loadHeroes();
  }, [userId]);

  const loadHeroes = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      // Load all heroes for this Twitch ID
      const list = await heroAPI.getHeroesByTwitchId(userId);
      // Sort: pinned first, then by level (descending), then by name
      list.sort((a, b) => {
        const aPinned = (a as any).pinned || false;
        const bPinned = (b as any).pinned || false;
        
        // Pinned heroes first
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        
        // Then by level (descending)
        const levelDiff = (b.level || 0) - (a.level || 0);
        if (levelDiff !== 0) return levelDiff;
        
        // Finally by name
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
      });
      setHeroes(list);
      // Default hero: most recently updated (backend returns newest first)
      setHero(list.length > 0 ? list[0] : null);
      setError(null);
    } catch (err) {
      setError('Failed to load heroes');
      console.error(err);
      setHeroes([]);
      setHero(null);
    } finally {
      setLoading(false);
    }
  };

  const updateHero = async (updates: Partial<Hero>) => {
    if (!userId || !hero) return;
    
    try {
      const updated = await heroAPI.updateHero(hero.id, updates);
      setHero(updated);
      // Also update it in the heroes list
      setHeroes(prev =>
        prev.map(h => (h.id === updated.id ? updated : h))
      );
    } catch (err) {
      setError('Failed to update hero');
      console.error(err);
    }
  };

  const deleteHero = async (heroId: string) => {
    try {
      try {
        await heroAPI.deleteHero(heroId);
      } catch (err: any) {
        // If the backend says 404, assume it was already deleted and still clean up local state
        const status = err?.response?.status;
        if (status && status !== 404) {
          throw err;
        }
      }
      setHeroes(prev => prev.filter(h => h.id !== heroId));
      setHero(prev => {
        if (!prev || prev.id !== heroId) return prev;
        const remaining = heroes.filter(h => h.id !== heroId);
        return remaining.length > 0 ? remaining[0] : null;
      });
    } catch (err) {
      setError('Failed to delete hero');
      console.error(err);
    }
  };

  // Allow callers to change the active hero from the list
  const selectHero = (heroId: string) => {
    const found = heroes.find(h => h.id === heroId) || null;
    setHero(found);
  };

  return { hero, heroes, loading, error, refetch: loadHeroes, updateHero, deleteHero, selectHero };
}
