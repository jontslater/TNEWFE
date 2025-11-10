import { useState, useEffect } from 'react';
import { Guild } from '../types/Guild';
import { guildAPI } from '../api/client';

export function useGuild(userId: string | null) {
  const [guild, setGuild] = useState<Guild | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    loadGuild();
  }, [userId]);

  const loadGuild = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const data = await guildAPI.getMyGuild(userId);
      setGuild(data);
      setError(null);
    } catch (err) {
      setError('Failed to load guild');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return { guild, loading, error, refetch: loadGuild };
}
