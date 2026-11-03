import { useCallback, useEffect, useState } from 'react';
import { spriteOverridesAPI } from '../api/client';
import {
  EMPTY_SPRITE_OVERRIDES,
  type SpriteOverridesDocument,
} from '../utils/spriteRuntimeOverrides';

const REFRESH_MS = 90_000;

export function useSpriteRuntimeOverrides() {
  const [overrides, setOverrides] = useState<SpriteOverridesDocument>(EMPTY_SPRITE_OVERRIDES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const data = await spriteOverridesAPI.get();
      setOverrides({
        heroes: data.heroes || {},
        enemies: data.enemies || {},
        updatedAt: data.updatedAt ?? null,
        updatedBy: data.updatedBy ?? null,
      });
      setError(null);
    } catch (e) {
      console.warn('[spriteOverrides] load failed', e);
      setError('Could not load sprite overrides');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
    const id = window.setInterval(reload, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [reload]);

  return { overrides, loading, error, reload, setOverrides };
}
