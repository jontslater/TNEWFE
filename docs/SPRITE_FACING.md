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
| `HeroSpriteJS` / `EnemySpriteJS` | Apply container transform with `transformOrigin: bottom center` (feet anchor) |
| `CleanBattlefieldSource` | Passes desired facing via `getFacingDirection(..., 'hero' \| 'enemy')` |

Native sheet orientation is audited with:

```bash
node scripts/audit-sprite-facing.mjs
```

Manual overrides for enemies are documented in `spriteFacingConfig.ts` (historical Animation Test QA).

## Preview routes

- `/class-sprites` — all hero classes (facing right)
- `/battlefield-facing` — heroes left + sample enemies/dragons
- `/dragon-test` — four dragons using battlefield enemy facing

Capture screenshots:

```bash
node scripts/luizmelo/capture-class-gallery.mjs
node scripts/luizmelo/capture-battlefield-facing.mjs
```
