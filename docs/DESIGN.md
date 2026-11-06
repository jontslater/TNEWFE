# TNEW — Product design (source of truth)

This document is the **north star** for *The Never Ending War* (TNEW) as of November 2026. Code and briefs should align here; deeper system specs may live in other `docs/` files.

## Fantasy & tone

- **Setting:** Fantasy war / RPG — heroes, guilds, raids, and an endless conflict the player pushes forward over time.
- **Feel:** Respect the audience: readable UI, honest progression, no “AI slop” hero art (see Art rules).

## Core loop (idle-first)

- Players **drop in and out**; progression is **idle-friendly**: short sessions, visible gains, reasons to return.
- **Quests** should behave as **idle mechanics**: auto-complete and auto-claim where possible so the player is not babysitting UI clicks for routine progress.
- Combat and battlefield views (including stream overlays) are part of the **presentation and feedback layer** for that loop, not a separate mini-game mandate for v1.

## Platforms

| Phase | Platforms | Notes |
|--------|-----------|--------|
| **Live soon (v1)** | Web (React/Vite player portal + Vercel) | Primary surface for strangers and daily play. |
| **Later** | Desktop (e.g. Steam), OBS browser source, shared backend/save | Single build + one save model for co-presence; **not** part of the immediate live slice. |

**Backend:** Separate service (e.g. [idleDnD-Backend](https://github.com/jontslater/idleDnD-Backend) on Railway). The frontend talks to it over HTTPS with JWT-backed API calls (`VITE_API_URL`). See `src/api/client.ts`.

## Art & content rules

- **Do not ship AI-generated hero art** as production character art — community sensitivity is real.
- **Prefer licensed or hand-made sprites** (e.g. curated packs, documented in repo docs such as `docs/LUIZMELO_SPRITE_REPORT.md`).
- Cosmetic and legal work stays explicit and documented; large “GAP” refactors belong in tracked rounds, not silent scope creep.

## Co-op & social vision (not v1 gate)

- **Join codes**, **Steam friends**, and **shared sessions** are **directional** — valuable after the solo idle loop is crisp and shippable.
- **One backend / one save** for stream + eventual co-op is the long-term anchor; implementation waits until the web idle loop is proven.

## Product ownership

- **Owner / feel:** Jonathan — final call on pacing, rewards, and playtests.
- **Agents:** Execute briefs, keep tests green, propose; they do not replace playtests.

## Out of scope for v1 “live soon”

- Steam / Electron / native desktop packaging.
- Blender MCP pipelines, custom 3D/2D asset authoring at scale — **Phase 2** (see `docs/VERTICAL_SLICE.md` and `docs/AGENT_STUDIO.md`).
- Mandatory co-op or join-code flows before the solo vertical slice is done.

---

*When this doc and reality diverge, update this file first, then the vertical slice and agent briefs.*
