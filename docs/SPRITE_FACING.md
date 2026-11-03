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
- `/battlefield-facing` — **full battlefield sprite gallery**: every playable class on a shared baseline (left) and all enemy types (right), plus Elder Dragon boss positioning
- `/animation-test` — interactive combat sandbox (spawn heroes/enemies for manual QA)
- `/enemy-animation-test` — all standard enemies cycling animations
- `/dragon-test` — four dragons using battlefield enemy facing

Regenerate hero feet / height metrics:

```bash
node scripts/generate-hero-sprite-layout.mjs
```

Capture QA screenshots:

```bash
node scripts/capture-battlefield-sprite-qa.mjs before   # stash old sprite code first, or compare tags
node scripts/capture-battlefield-sprite-qa.mjs after
```
