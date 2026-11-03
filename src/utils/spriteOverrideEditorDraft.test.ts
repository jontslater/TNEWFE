import { describe, expect, it, vi } from 'vitest';
import {
  clearSpriteOverrideEditorDraft,
  loadSpriteOverrideEditorDraft,
  saveSpriteOverrideEditorDraft,
  SPRITE_OVERRIDE_EDITOR_DRAFT_KEY,
} from './spriteOverrideEditorDraft';

function mockStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
  };
}

describe('spriteOverrideEditorDraft', () => {
  it('round-trips draft through storage', () => {
    const storage = mockStorage();
    saveSpriteOverrideEditorDraft(
      { mage: { flip: true } },
      { Goblin: { offsetY: 4 } },
      storage
    );
    const loaded = loadSpriteOverrideEditorDraft(storage);
    expect(loaded?.heroes.mage).toEqual({ flip: true });
    expect(loaded?.enemies.Goblin).toEqual({ offsetY: 4 });
    expect(loaded?.savedAt).toEqual(expect.any(Number));
  });

  it('returns null for invalid json', () => {
    const storage = mockStorage();
    storage.setItem(SPRITE_OVERRIDE_EDITOR_DRAFT_KEY, '{not json');
    expect(loadSpriteOverrideEditorDraft(storage)).toBeNull();
  });

  it('clears draft', () => {
    const storage = mockStorage();
    saveSpriteOverrideEditorDraft({}, {}, storage);
    clearSpriteOverrideEditorDraft(storage);
    expect(loadSpriteOverrideEditorDraft(storage)).toBeNull();
  });
});
