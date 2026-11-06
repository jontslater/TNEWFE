# AI agent game studio — TNEW frontend workflow

How we run **parallel agent rounds** on **jontslater/TNEWFE** (and coordinate with **idleDnD-Backend**) without sacrificing quality or tests.

## Principles

1. **Design docs first** — `docs/DESIGN.md`, `docs/VERTICAL_SLICE.md`, and the active round brief under `docs/briefs/` are the contract.
2. **Test-gated merges** — Green CI locally before push; **never weaken or delete tests** to go green.
3. **Lanes** — Frontend agents own this repo; backend agents own Railway/API. Touch both only when the brief says so, and split PRs when possible.
4. **Human playtest seat** — Jonathan (or delegate) owns feel, pacing, and manual acceptance from `docs/VERTICAL_SLICE.md`. Agents ship code; humans ship judgment.

## Lane ownership

| Lane | Repository | Typical work |
|------|------------|----------------|
| **FE** | TNEWFE | React pages, API client, battlefield/overlay UX, vitest, sprites check |
| **Backend** | idleDnD-Backend | Auth, hero/progress persistence, quest automation, instance APIs |

**Integration:** FE uses `VITE_API_URL` → axios `apiClient` (`src/api/client.ts`). Contract changes need coordinated PRs or a brief that names both sides.

## Test gate (run before every push / merge)

```bash
npm install
npm test
npm run lint
npm run build
```

Stricter TypeScript + build:

```bash
npm run build:check
```

Failure policy: **fix the code or the test data**, not the assertion, unless the assertion is objectively wrong — then fix in agreement with the brief and note it in the PR.

## Parallel branch rules

- Branch from latest `main` (fetch if needed): `cursor/<descriptive-name>-1eae` (or project convention).
- **One concern per branch** when possible — easier review and CI.
- **Do not merge** another open PR’s branch into yours without explicit brief instruction; **rebase onto `main`** to stay current.
- Open PRs with a **summary**, **test plan**, and **checklist** for Jonathan.

## Brief template (for `docs/briefs/ROUND-NNN.md`)

Use this structure for each round:

1. **Goal** — One sentence tied to `docs/VERTICAL_SLICE.md`.
2. **Scope in** — Bullets: files/areas allowed.
3. **Scope out** — Bullets: what is forbidden this round (e.g. no Steam, no new AI art).
4. **Dependencies** — Open PRs, backend flags, env vars.
5. **Tasks** — Checklist for agents (FE vs BE).
6. **Definition of done** — Commands run, manual checks, owner sign-off.
7. **Risks** — Migrations, cache, breaking API changes.

## Blender & authored art — Phase 2 (not blocking)

**Blender MCP** and a structured **3D/2D authoring path** are **Phase 2** enrichment for a more playable desktop/streaming experience. They are **out of scope** for proving the **web idle vertical slice**.

When Phase 2 starts:

- Add/adjust a dedicated brief (e.g. `docs/briefs/ROUND-0XX-blender-pipeline.md`).
- Keep **licensed/hand-made** or procedural-offline workflows aligned with `docs/DESIGN.md` art rules.
- Do **not** block shipping idle loop fixes on Blender infrastructure.

---

*Process owner: Jonathan. Agents: follow the active round brief and keep this file updated if gates change.*
