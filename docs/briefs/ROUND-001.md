# Agent round 001 — Vertical slice acceleration

**Status:** Active  
**Goal:** Move the **“live soon” vertical slice** (`docs/VERTICAL_SLICE.md`) forward with the **smallest** FE work — prefer **merge/finish existing PRs** over duplicate implementations.

## Context

- **Product:** `docs/DESIGN.md`
- **Slice criteria:** `docs/VERTICAL_SLICE.md`
- **Workflow:** `docs/AGENT_STUDIO.md`

## Already-open PRs (do not duplicate)

These PRs **already map** to slice-quality work. **Prefer merging/finishing them** over starting parallel implementations.

| PR | Branch (approx.) | Fit to slice |
|----|------------------|----------------|
| **[#15](https://github.com/jontslater/TNEWFE/pull/15)** | `cursor/skill-draft-allocation-1dd4` | **Skills UX:** Draft allocate points **without full-page reload** per click; Save/Reset; tests (`skillDraft`). Matches idle + portal polish for the slice checklist. |
| **[#19](https://github.com/jontslater/TNEWFE/pull/19)** | `cursor/remove-combat-status-bar-c091` | **Battlefield/OBS-facing:** Remove distracting combat status overlay on clean battlefield; **fix hero facing** parity vs `/battlefield-facing` (e.g. chronomancer). Keeps stream/idle presentation trustworthy. |
| **[#3](https://github.com/jontslater/TNEWFE/pull/3)** *(draft)* | `cursor/refactor-overlay-security-code-health-c08c` | **GAP round:** Overlay auth, combat/loot correctness, large doc moves. **High scope** — treat as **separate** from the smallest slice path; review for **risk/merge order** rather than blocking #15/#19. |

### Round recommendation (FE)

1. **Primary:** **Merge/finish [PR #15](https://github.com/jontslater/TNEWFE/pull/15)** after review + green gates (`npm test`, `npm run lint`, `npm run build`).
2. **Primary:** **Merge/finish [PR #19](https://github.com/jontslater/TNEWFE/pull/19)** after review + green gates; run any PR-documented verification (e.g. `verify-battlefield-hero-facing` script if listed there).
3. **Secondary:** Revisit **[PR #3](https://github.com/jontslater/TNEWFE/pull/3)** when Jonathan wants the **full GAP** batch — not a prerequisite to calling **ROUND-001** successful if #15 and #19 land.

## Backend companion (if needed)

- **Skills:** PR #15 body references **idleDnD-Backend** validation (e.g. sequential `allocate` calls). If production still requires batch endpoints for scale, file a **backend brief** — optional for **correctness**, not for closing ROUND-001 FE.
- **Quests auto-complete/auto-claim:** Largely **server-driven**. If the portal still forces redundant manual steps, track as **ROUND-002** with explicit API contracts — **out of scope** for duplicating #15/#19 work in ROUND-001.

## Scope in (this round)

- Reviews, small fixes, and merge support for **#15** and **#19**.
- Doc alignment (this file, `DESIGN`, `VERTICAL_SLICE`, `AGENT_STUDIO`).
- Bugfixes that are **trivially** blocking the slice **and** not covered by #15/#19 / #3 — **only** with tests and Jonathan’s agreement in the PR.

## Scope out

- Steam / Electron / desktop client work.
- New AI-generated hero art or wholesale asset generation.
- Weakening/removing tests to pass CI.
- Blender MCP or new 3D pipelines (**Phase 2** per `docs/AGENT_STUDIO.md`).

## Definition of done

- [ ] **#15** merged or explicitly superseded with equivalent behavior and tests.
- [ ] **#19** merged or explicitly superseded with equivalent behavior and verification.
- [ ] `npm test`, `npm run lint`, `npm run build` green on `main` after merges.
- [ ] Jonathan (or delegate) runs **manual** checks in `docs/VERTICAL_SLICE.md` for skills + clean battlefield if those ship.

## Brief for the next parallel agent (copy-paste)

> **ROUND-001 FE:** Help merge **[PR #15](https://github.com/jontslater/TNEWFE/pull/15)** (skill draft UX) and **[PR #19](https://github.com/jontslater/TNEWFE/pull/19)** (clean battlefield facing + status bar removal). Run `npm test`, `npm run lint`, `npm run build`. Do not duplicate their work in new PRs. Do not merge **#3** unless Jonathan requests the full GAP scope. Backend changes only if a blocking API bug is found — coordinate idleDnD-Backend.

---

*End of ROUND-001 brief.*
