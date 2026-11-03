# LuizMelo class sprite integration report

## Download status

All five CC0 packs were downloaded successfully via itch.io’s free purchase flow (Playwright automation in `scripts/luizmelo/download-packs.mjs`). Vendor trees are under `scripts/luizmelo/vendor/` (not committed; regenerate with `npm run sprites:luizmelo:download`).

| Pack | itch.io | Status |
|------|---------|--------|
| Hero Knight | https://luizmelo.itch.io/hero-knight | OK |
| Medieval Warrior Pack | https://luizmelo.itch.io/medieval-warrior-pack | OK |
| Martial Hero | https://luizmelo.itch.io/martial-hero | OK |
| Huntress | https://luizmelo.itch.io/huntress | OK |
| Wizard Pack | https://luizmelo.itch.io/wizard-pack | OK |

## Class → body mapping

| Class | Sprite source | Notes |
|-------|---------------|-------|
| guardian, paladin, warden | Huge Knight (unchanged) | Heavy plate tanks |
| vanguard | LuizMelo Hero Knight (base) | Agile knight |
| bloodknight | Hero Knight **red palette variant** | `bloodknight-red` |
| brewmaster | Medieval Warrior (base) | Stout warrior silhouette |
| berserker, crusader, stormwarrior | Dwarf Warrior (unchanged) | |
| monk | Martial Hero (base) | |
| bladedancer | Martial Hero **emerald** variant | |
| assassin | Martial Hero **shadow** variant | |
| reaper | Martial Hero **crimson** variant | |
| hunter | Huntress (base) | |
| firemage, warlock, necromancer, shadowpriest, dragonsorcerer | Pyromancer (unchanged) | |
| mage | LuizMelo Wizard (base) | |
| frostmage | Wizard **frost** tint | |
| stormcaller | Wizard **storm** tint | |
| mooncaller | Wizard **moon** tint | |
| ranger | Huntress (base) | Same rig as hunter; ranged identity via gameplay |
| cleric, atoner, lightbringer, mistweaver | Wizard **holy/gold** tint + v2 projectile | |
| druid, shaman, chronomancer | Wizard v2.0 (unchanged) | |
| bard | Wizard **bard purple** tint + v2 projectile | **Commission candidate** — no lute/performance set in CC0 packs |

## Frame slicing

Hero animations now derive **frame width = sheet width ÷ frame count** and **frame height = sheet height** using baked metrics from `scripts/luizmelo/build-hero-sprites.mjs` → `src/utils/heroSpriteSheetMetrics.generated.ts`, applied in `createHeroAnimations()` in `spriteAnimationData.ts`. `HeroSpriteJS` scales uniformly to the 48px viewport so on-screen height stays consistent.

**Wizard idle:** itch.io lists 4 idle frames; the shipped sheet is 1386×190 and divides evenly at **6×231px** (matching run/attack frame width). Build uses 6 idle frames; see `packDefinitions.json` note.

## Palette swaps

Recolors are **committed PNGs** produced by `scripts/luizmelo/build-hero-sprites.mjs` (not runtime CSS filters).

## Manual files (only if downloads fail)

If itch.io download automation breaks, place extracted folders under `scripts/luizmelo/vendor/`:

- `Hero Knight/Sprites/` — Idle.png, Run.png, Attack1.png, Take Hit.png, Death.png
- `Medieval Warrior Pack/` — Idle.png, Run.png, Attack1.png, Hit.png, Death.png
- `Martial Hero/Sprites/` — Idle.png, Run.png, Attack1.png, Take Hit.png, Death.png
- `Huntress/Sprites/` — Idle.png, Run.png, Attack1.png, Attack2.png, Take hit.png, Death.png
- `Wizard Pack/` — Idle.png, Run.png, Attack1.png, Attack2.png, Hit.png, Death.png

Then run `npm run sprites:luizmelo:build`.
