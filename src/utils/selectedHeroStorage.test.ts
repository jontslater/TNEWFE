import { describe, it, expect, beforeEach } from 'vitest';
import {
  getSelectedHeroStorageKey,
  getStoredSelectedHeroId,
  resolveSelectedHero,
} from './selectedHeroStorage';

function createStorageMock(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
  };
}

describe('selectedHeroStorage', () => {
  beforeEach(() => {
    (globalThis as typeof globalThis & { localStorage: Storage }).localStorage = createStorageMock();
  });

  it('builds storage key from Twitch user id', () => {
    expect(getSelectedHeroStorageKey('12345')).toBe('selectedHeroId_12345');
  });

  it('returns stored hero doc id', () => {
    localStorage.setItem(getSelectedHeroStorageKey('twitch-1'), 'hero-doc-abc');
    expect(getStoredSelectedHeroId('twitch-1')).toBe('hero-doc-abc');
    expect(getStoredSelectedHeroId(null)).toBeNull();
  });

  it('resolveSelectedHero prefers saved id when present in list', () => {
    const heroes = [
      { id: 'a', name: 'First' },
      { id: 'b', name: 'Second' },
    ];
    localStorage.setItem(getSelectedHeroStorageKey('u1'), 'b');
    expect(resolveSelectedHero(heroes, 'u1')?.id).toBe('b');
  });

  it('resolveSelectedHero falls back to first hero', () => {
    const heroes = [{ id: 'a', name: 'First' }];
    expect(resolveSelectedHero(heroes, 'u1')?.id).toBe('a');
  });
});
