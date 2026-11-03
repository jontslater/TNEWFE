# Giant dragon boss sprite audit

## Primary asset: **Elder Dragon** (`Dragon - Fully Animated`)

This is the large raid final boss. It is **not** a horizontal sprite sheet; each animation is a **folder of full-size PNG frames** (one file per frame).

| Item | Value |
|------|--------|
| **Root path** | `public/Sprites/enemies/Dragon - Fully Animated/` |
| **Example frame** | `Idle Battle/001.png` (default combat idle) |
| **Frame size** | **725 × 445 px** (every sampled frame; verified on disk) |
| **Layout** | Per-animation subdirectory; frames named `001.png` … (Hurt uses `01.png` … `62.png`) |
| **Animation key** | `elderDragon` in `src/utils/spriteAnimationData.ts` |
| **Enemy type string** | `'Elder Dragon'` → `getEnemyAnimationKey()` |

### Configured animations (`spriteAnimationData.ts`)

| Animation | Frame files | `frameCount` | Notes |
|-----------|-------------|--------------|--------|
| `idle` | `Idle/` | 161 | Ambient idle |
| `idleBattle` | `Idle Battle/` | 140 | **Default** in `EnemySpriteJS` for Elder Dragon |
| `attack` | `Attack 1/` | 161 | |
| `attack2` | `Attack 2/` | 202 | On-disk count matches |
| `hurt` | `Hurt/` | 62 | Entry sheet: `Hurt/01.png` |
| `death` | `Death/` | 301 | Long cinematic death |
| `walking` | `Walking/` | 161 | |
| `projectile` | Pyromancer fire sheet | 6 | Placeholder projectile art |

Frame metrics in config: `frameWidth: 725`, `frameHeight: 445`. Durations are total clip length at ~60 FPS (e.g. idle 2680 ms ÷ 161 frames).

### Runtime rendering

- **`EnemySpriteJS`** detects Elder-style paths (`…/001.png` or `…/01.png`), loads **individual PNGs** into a canvas, and scales each **725×445** frame down to the 48px logical viewport, then applies the outer `scale` prop.
- **Raid / clean battlefield:** bosses use **`scale={12.0}`** and a **1200px-wide** container for tail overflow (`CleanBattlefieldSource.tsx`).
- **Default animation:** `idleBattle` (not `idle`).
- **Projectile scaling** special-cased in `projectiles.ts` for `'Elder Dragon'`.

### Boss / raid wiring

| Integration | Status |
|-------------|--------|
| Raid definitions | `src/data/sampleRaids.ts` — `elder_dragon_normal`, `_heroic`, `_mythic`; boss name **`Elder Dragon`** |
| Wave trash | `Dragon Whelp` / `Guardian` / `Sentinel` → types **`Dragon_1` / `Dragon_2` / `Dragon_3`** (see below); stats in `CleanBattlefieldSource.tsx` ~1160 |
| Idle adventure | **Excluded** — `RAID_ONLY_BOSSES` in `enemyGeneration.ts` |
| Aerial fly-by attacks | **Not** on Elder Dragon — only on **`Dragon_1/2/3`** wave dragons (`CleanBattlefieldSource.tsx` ~5068) |
| Test UI | `AnimationTestPage` Elder Dragon raid buttons; **`/dragon-test`** (Dragon_1 + Elder Dragon preview) |

### Render health (manual check)

On **`/dragon-test`**, after **~140 PNGs** preload for `idleBattle`, the boss draws to a **725×445 canvas** scaled through the 48px viewport at **`scale={12}`** (same as raid bosses). Screenshots: `docs/screenshots/dragon-boss/`.

**Caveats**

- **Preload latency:** first paint waits for all frames in the active animation to load (140+ network requests for `idleBattle`).
- **Viewport clipping:** `EnemySpriteJS` keeps a **48×48** logical box with **`overflow: hidden`** on the inner sprite layer; at 12× scale most of the dragon is painted outside that box. Raid UI wraps bosses in a **1200px `overflow: visible`** container (`CleanBattlefieldSource.tsx`), but clipping may still affect how much of the tail/wings show unless the sprite component allows visible overflow for large bosses (similar to goblin death anims).
- Very large frame counts (death **301** frames) mean long death animations in combat.
- `public/Sprites/enemies/ElderDragon.png` is a **legacy static PNG** and is **not referenced** anywhere in TS/TSX (unused).

---

## Secondary assets: **raid wave dragons** (`Dragon_1` / `Dragon_2` / `Dragon_3`)

Smaller strip-based dragons used as **Elder Dragon raid adds**, not the final boss.

| Item | Value |
|------|--------|
| **Paths** | `public/Sprites/enemies/Dragon_1/` (also `Dragon_2`, `Dragon_3`) |
| **Layout** | **Horizontal strips** — e.g. `Idle.png` **1792×256** = **7 × 256px** frames |
| **Config** | `dragon1` / `dragon2` / `dragon3` in `spriteAnimationData.ts`, **`frameWidth: 256`**, **`frameHeight: 256`** |
| **Extra anims** | `rise`, `flight`, `landing`, `special` — used for **aerial attack sequence** in raids |
| **Test page** | `/dragon-test` — documented as working in `RAID_DRAGON_STATUS.md` |

Example verified strip sizes (`Dragon_1`):

- `Idle.png`: 1792×256 → 7 frames @ 256px  
- `Hurt.png`: 1024×256 → 4 frames @ 256px  
- `Flight.png`: 3072×256 → 12 frames @ 256px  

---

## Other “dragon” enemies (not the giant raid boss)

| Name | Asset | Role |
|------|--------|------|
| **Adult Dragon** | `EnemySprites/Dragon 2D Pixel Art v1.2/` | Idle-world **boss** (smaller than Elder) |
| **Baby Dragon** | `EnemySprites/Baby Dragon 2D Pixel Art/` | Trash + hero projectile source |
| **Dragon Sorcerer** | Pyromancer hero sprites | Player class, not a boss |

---

## Screenshots

Captured from `/dragon-test` (see PR):

- `docs/screenshots/dragon-boss/elder-dragon-idle-battle.png` — Elder Dragon raid boss  
- `docs/screenshots/dragon-boss/dragon-whelp-dragon1.png` — Dragon_1 wave enemy  
