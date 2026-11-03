import type { SpriteRuntimeOverride } from './spriteRuntimeOverrides';

export const SPRITE_OVERRIDE_EDITOR_DRAFT_KEY = 'spriteOverrideEditorDraft';

export type SpriteOverrideEditorDraft = {
  heroes: Record<string, SpriteRuntimeOverride>;
  enemies: Record<string, SpriteRuntimeOverride>;
  savedAt: number;
};

export function loadSpriteOverrideEditorDraft(
  storage: Pick<Storage, 'getItem'> = localStorage
): SpriteOverrideEditorDraft | null {
  const raw = storage.getItem(SPRITE_OVERRIDE_EDITOR_DRAFT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SpriteOverrideEditorDraft;
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.heroes || typeof parsed.heroes !== 'object') return null;
    if (!parsed.enemies || typeof parsed.enemies !== 'object') return null;
    return {
      heroes: parsed.heroes,
      enemies: parsed.enemies,
      savedAt: typeof parsed.savedAt === 'number' ? parsed.savedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export function saveSpriteOverrideEditorDraft(
  heroes: Record<string, SpriteRuntimeOverride>,
  enemies: Record<string, SpriteRuntimeOverride>,
  storage: Pick<Storage, 'setItem'> = localStorage
): void {
  const draft: SpriteOverrideEditorDraft = {
    heroes,
    enemies,
    savedAt: Date.now(),
  };
  storage.setItem(SPRITE_OVERRIDE_EDITOR_DRAFT_KEY, JSON.stringify(draft));
}

export function clearSpriteOverrideEditorDraft(
  storage: Pick<Storage, 'removeItem'> = localStorage
): void {
  storage.removeItem(SPRITE_OVERRIDE_EDITOR_DRAFT_KEY);
}
