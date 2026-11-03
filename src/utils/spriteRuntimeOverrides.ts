/**
 * Global runtime sprite overrides (Firestore config/spriteOverrides via API).
 * Layer on top of facesLeft + default battlefield facing.
 */
export type SpriteRuntimeOverride = {
  /** When true, invert mirror vs facesLeft + facing default */
  flip?: boolean;
  /** Multiplier on display scale (1 = unchanged) */
  scaleMultiplier?: number;
  /** Nudge in logical viewport px before outer scale; positive = down */
  offsetY?: number;
};

export type SpriteOverridesDocument = {
  heroes: Record<string, SpriteRuntimeOverride>;
  enemies: Record<string, SpriteRuntimeOverride>;
  updatedAt?: number | null;
  updatedBy?: string | null;
};

export const EMPTY_SPRITE_OVERRIDES: SpriteOverridesDocument = {
  heroes: {},
  enemies: {},
  updatedAt: null,
  updatedBy: null,
};

export function normalizeSpriteOverrideEntry(
  raw?: SpriteRuntimeOverride | null
): SpriteRuntimeOverride | undefined {
  if (!raw) return undefined;
  const out: SpriteRuntimeOverride = {};
  if (raw.flip === true) out.flip = true;
  if (
    typeof raw.scaleMultiplier === 'number' &&
    Number.isFinite(raw.scaleMultiplier) &&
    raw.scaleMultiplier !== 1
  ) {
    out.scaleMultiplier = raw.scaleMultiplier;
  }
  if (
    typeof raw.offsetY === 'number' &&
    Number.isFinite(raw.offsetY) &&
    raw.offsetY !== 0
  ) {
    out.offsetY = raw.offsetY;
  }
  return Object.keys(out).length ? out : undefined;
}

export function mergeSpriteOverrideEntry(
  base: SpriteRuntimeOverride | undefined,
  patch: Partial<SpriteRuntimeOverride>
): SpriteRuntimeOverride | undefined {
  const merged: SpriteRuntimeOverride = { ...(base || {}) };
  if (patch.flip === true) merged.flip = true;
  else if (patch.flip === false) delete merged.flip;
  if (patch.scaleMultiplier !== undefined) {
    if (patch.scaleMultiplier === 1) delete merged.scaleMultiplier;
    else merged.scaleMultiplier = patch.scaleMultiplier;
  }
  if (patch.offsetY !== undefined) {
    if (patch.offsetY === 0) delete merged.offsetY;
    else merged.offsetY = patch.offsetY;
  }
  return normalizeSpriteOverrideEntry(merged);
}

export function buildExportPayload(
  heroes: Record<string, SpriteRuntimeOverride>,
  enemies: Record<string, SpriteRuntimeOverride>
): SpriteOverridesDocument {
  const h: Record<string, SpriteRuntimeOverride> = {};
  const e: Record<string, SpriteRuntimeOverride> = {};
  for (const [k, v] of Object.entries(heroes)) {
    const n = normalizeSpriteOverrideEntry(v);
    if (n) h[k] = n;
  }
  for (const [k, v] of Object.entries(enemies)) {
    const n = normalizeSpriteOverrideEntry(v);
    if (n) e[k] = n;
  }
  return { heroes: h, enemies: e };
}
