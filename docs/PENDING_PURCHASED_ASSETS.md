# Purchased assets awaiting import (Jonathan’s machine)

These packs are **already licensed/purchased** but the zip files live on another machine. **Do not commit the zips** until they are copied into the paths below. No automated download is attempted from this repo.

## Elementals: Water Priestess FULL — **chierit** (CC BY 4.0)

| | |
|--|--|
| **Author** | chierit |
| **Credit line** | **chierit** (required under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)) |
| **License** | CC BY 4.0 — commercial use OK with attribution; follow pack terms for redistribution |
| **Planned drop path** | `public/Sprites/Heroes/HeroSprites/chierit/Water Priestess/` (exact subfolders TBD from zip layout) |
| **Build hook (future)** | Add pack definition + metrics script entry alongside `scripts/luizmelo/` when sheets are known |

### Class mapping (reserved)

| Class | Current (interim) | Target when files land |
|-------|-------------------|-------------------------|
| **mistweaver** | LuizMelo Wizard **wizard-holy** + v2 projectile | **Water Priestess** (primary fit — water/mist healer) |
| **tidecaller** | *(class not in repo yet)* | **Water Priestess** or palette variant (if tidecaller is added) |

Wire-up checklist for follow-up PR:

1. Extract zip into the drop path above.
2. Measure frame counts / sheet sizes; extend sprite metrics (same approach as LuizMelo build or PR #5 hero slicing).
3. Point `mistweaver` in `src/utils/luizmeloHeroSpriteConfig.ts` (or successor config) at chierit paths; remove holy-wizard interim entry.
4. Confirm `CREDITS-ASSETS.md` attribution line remains visible in-game or docs.

---

## Oak Woods — **brullov** (commercial OK, no redistribution)

| | |
|--|--|
| **Author** | brullov |
| **Use** | Environment / background tile set (not hero bodies) |
| **License** | Commercial use OK; **do not redistribute** raw tiles outside the game (per purchase terms) |
| **Planned drop path** | `public/Sprites/Environments/Oak Woods/` (or `public/Backgrounds/OakWoods/` — finalize on import) |

No class sprite mapping — integrate when Jonathan provides files (battlefield/raid background layers, parallax, etc.).

---

## Git / rebase note

Rebase branch `cursor/luizmelo-class-sprites-ced0` onto **`main` after [PR #5](https://github.com/jontslater/TNEWFE/pull/5)** (*Fix sprite slicing, display scale…*) **merges**, so hero/enemy frame derivation matches the sprite-fix work. As of last check, PR #5 was still **open** — rebase deferred until merge.
