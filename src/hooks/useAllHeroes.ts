import { useState, useEffect } from 'react';
import { Hero } from '../types/Hero';
import { heroAPI } from '../api/client';

export function useAllHeroes(enabled: boolean) {
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setHeroes([]);
      setLoading(false);
      return;
    }
    loadAllHeroes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const loadAllHeroes = async () => {
    if (!enabled) return;
    try {
      setLoading(true);
      const list = await heroAPI.getAllHeroes();
      // Sort alphabetically by name, then by role
      list.sort((a, b) => {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        const roleA = (a.role || '').toLowerCase();
        const roleB = (b.role || '').toLowerCase();
        if (roleA < roleB) return -1;
        if (roleA > roleB) return 1;
        return 0;
      });
      setHeroes(list);
      setError(null);
    } catch (err) {
      setError('Failed to load all heroes');
      console.error(err);
      setHeroes([]);
    } finally {
      setLoading(false);
    }
  };

  return { heroes, loading, error, refetch: loadAllHeroes };
}
