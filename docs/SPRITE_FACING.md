# Sprite battlefield facing

## Rule

- **Heroes** (left side): face **right** toward enemies.
- **Enemies / bosses / dragons** (right side): face **left** toward heroes.

## Implementation

| Piece | Role |
|-------|------|
| `src/utils/spriteFacing.ts` | Shared helpers: `BATTLEFIELD_HERO_FACING`, `BATTLEFIELD_ENEMY_FACING`, `shouldMirrorSpriteForFacing`, `getSpriteContainerTransform`, `resolveBattlefieldFacing` |
| `src/utils/spriteFacingConfig.ts` | Per-enemy `ENEMY_NATIVE_FACES_LEFT`; `getHeroFacesLeft` / `getEnemyFacesLeft` |
| `src/utils/spriteConfig.ts` + `luizmeloHeroSpriteConfig.ts` | Optional `facesLeft` on hero entries (LuizMelo packs set from pack map) |
| `HeroSpriteJS` / `EnemySpriteJS` | Apply container scale on outer box; mirror via inner wrapper (`scaleX(-1)`). Enemy sprite sheets use viewport-sized `background-position` framing (PR #8 dragon layout). |
| `ClassSpriteGalleryPage` | `BATTLEFIELD_HERO_FACING` + `freezeIdleFrame` (idle frame 0 for screenshots) |

Per-class native facing uses `HERO_FACES_LEFT_OVERRIDES` (LuizMelo bodies) and `HERO_NATIVE_FACES_LEFT` (legacy rigs). Regenerate overrides with gallery QA:

```bash
node scripts/verify-hero-gallery-transform.mjs
node scripts/audit-sprite-facing.mjs
```

Native sheet orientation is audited with:

```bash
node scripts/audit-sprite-facing.mjs
```

Manual overrides for enemies are documented in `spriteFacingConfig.ts` (historical Animation Test QA).

## Preview routes

- `/class-sprites` — all hero classes in a grid (facing right, idle frame 0)
- `/battlefield-facing` — **sprite override editor**: responsive card grid (Heroes / Enemies / Bosses) with preview box, Flip/Scale/Y controls, sticky Save/Export toolbar, and a **Battlefield preview** strip below for lineup QA
- `/animation-test` — interactive combat sandbox (spawn heroes/enemies for manual QA)
- `/enemy-animation-test` — all standard enemies cycling animations
- `/dragon-test` — four dragons using battlefield enemy facing

## Global runtime overrides (editor)

Firestore document: **`config/spriteOverrides`** (via backend).

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/config/sprite-overrides` | Public |
| PUT | `/api/config/sprite-overrides` | JWT + admin (`theneverendingwar`, `tehchno`, or `SPRITE_OVERRIDE_ADMIN_LOGINS`) |

Each entry (hero role or enemy type key):

- `flip?: boolean` — XOR mirror on top of `facesLeft` + battlefield facing
- `scaleMultiplier?: number` — multiply display scale (0.25–3)
- `offsetY?: number` — nudge feet in logical px (−48…48)

Editor: **`/battlefield-facing`** (Save / Export JSON). Live **`CleanBattlefieldSource`** polls overrides ~every 90s.

Regenerate hero feet metrics: `node scripts/generate-hero-sprite-layout.mjs`

Capture QA screenshots:

```bash
node scripts/capture-battlefield-sprite-qa.mjs before   # stash old sprite code first, or compare tags
node scripts/capture-battlefield-sprite-qa.mjs after
```
