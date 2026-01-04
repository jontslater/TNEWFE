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
      
      // Log each hero's data structure for debugging
      console.log('[useHero] Loaded heroes:', list.length);
      list.forEach((hero, index) => {
        console.log(`[useHero] Hero ${index + 1}:`, {
          id: hero.id,
          name: hero.name,
          role: hero.role,
          level: hero.level,
          twitchUserId: (hero as any).twitchUserId,
          twitchId: (hero as any).twitchId,
          hasStats: !!hero.stats,
          hasEquipment: !!hero.equipment,
          keys: Object.keys(hero).slice(0, 20) // First 20 keys
        });
      });
      
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
      
      // Try to restore previously selected hero from localStorage
      const storageKey = `selectedHeroId_${userId}`;
      const savedHeroId = localStorage.getItem(storageKey);
      const savedHero = savedHeroId ? list.find(h => h.id === savedHeroId) : null;
      
      // Use saved hero if it exists, otherwise default to first hero
      const selectedHero = savedHero || (list.length > 0 ? list[0] : null);
      
      // Validate selected hero has required fields
      if (selectedHero) {
        const missingFields: string[] = [];
        if (!selectedHero.id) missingFields.push('id');
        if (!selectedHero.name) missingFields.push('name');
        if (!selectedHero.role) missingFields.push('role');
        if (selectedHero.level === undefined || selectedHero.level === null) missingFields.push('level');
        
        if (missingFields.length > 0) {
          console.error('[useHero] ⚠️ Selected hero is missing required fields:', {
            heroId: selectedHero.id,
            missingFields,
            heroData: selectedHero
          });
          setError(`Hero data incomplete: missing ${missingFields.join(', ')}`);
        } else {
          console.log('[useHero] ✅ Selected hero is valid:', {
            id: selectedHero.id,
            name: selectedHero.name,
            role: selectedHero.role,
            level: selectedHero.level
          });
        }
      }
      
      setHero(selectedHero);
      setError(null);
    } catch (err) {
      setError('Failed to load heroes');
      console.error('[useHero] ❌ Error loading heroes:', err);
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
      // Ensure the selected hero ID is still persisted
      const storageKey = `selectedHeroId_${userId}`;
      localStorage.setItem(storageKey, updated.id);
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
    
    // Persist selection to localStorage
    if (userId && found) {
      const storageKey = `selectedHeroId_${userId}`;
      localStorage.setItem(storageKey, heroId);
    }
  };

  return { hero, heroes, loading, error, refetch: loadHeroes, updateHero, deleteHero, selectHero };
}
