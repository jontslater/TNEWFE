# Vertical slice — “live soon”

**Definition:** The **minimum playable idle loop** a **stranger** can complete in **one reasonable session** on the **web player portal**, backed by the real API, with a clear reason to **come back**.

This is **not** the full MMO wishlist; it is the smallest shippable loop that proves TNEW is a game people can play, not only configure.

## The slice (end-to-end)

1. **Account** — Land on the site, understand what the game is, **sign in** (existing auth flow, e.g. Twitch-linked player identity as implemented).
2. **Hero** — **Create or select** a hero; see core stats and that the hero is “yours” (persisted server-side).
3. **Progress (fight / idle)** — Engage the main progression path that works **without** constant manual clicking: combat/activity/dungeon/raid as **currently wired to the backend**, with feedback that progress is happening (XP, drops, instances, or equivalent visible gains — exact variant is whatever is stable on production/staging).
4. **Reward** — Receive **at least one concrete reward** tied to that session (gear, currency, quest completion, login reward, etc.) that **persists** after refresh.
5. **Return** — Close the tab and **come back** later; hero and rewards **load correctly** (same account).

**Idle expectation:** Routine **quests** should not require manual claim spam if the backend supports auto-complete/auto-claim; the UI should not fight that design.

## Explicitly later phases (not required to call this slice “done”)

| Phase | What | Why later |
|--------|------|------------|
| **Desktop / Steam** | Installed client, Steamworks | Packaging and distribution; not blocking web proof. |
| **OBS / shared save** | One backend, browser source for stream, shared progression story | Great for Jonathan’s streams; separate from first stranger-complete loop. |
| **Co-op** | Join codes, friends | Social layer after solo loop is trusted. |
| **Blender / authored 3D·2D pipeline** | Blender MCP, custom asset pipeline | **Phase 2** — see `docs/AGENT_STUDIO.md`; do not block shipping the web idle loop. |

## Acceptance checks

### Automated (this repo)

Run on every agent round before merge:

```bash
npm install
npm test
npm run lint
npm run build
```

Optional stricter compile pass:

```bash
npm run build:check
```

Sprite integrity (part of `build`):

```bash
npm run sprites:check
```

### Manual (human gate — Jonathan or delegate)

Use **staging or production** as appropriate; record notes in the agent round or playtest log.

- [ ] **Cold start:** Open `/` → understand value prop within ~30 seconds (copy/layout sanity).
- [ ] **Sign in** works; no infinite spinner; token/session behaves as expected on refresh.
- [ ] **Hero:** Create or select hero; dashboard shows consistent data after navigation and refresh.
- [ ] **One session arc:** In one sitting, complete the progression + reward path chosen for the slice (e.g. enter an activity and finish or idle through to a visible reward).
- [ ] **Persistence:** Hard refresh; hero and inventory/progress still correct.
- [ ] **Return visit:** New browser session same day or next; data still correct.
- [ ] **Skills (if in slice):** Allocating points does not **flash full-page loading** on every click (see open PR **#15** draft flow).
- [ ] **Battlefield / clean overlay (if in slice):** Stream-facing view does not show **broken hero facing** vs editor parity (see open PR **#19**).

### Backend companion

- API URL, auth, and Firestore/data contracts must match **idleDnD-Backend** deployment. Failures here are **not** fixed by frontend hacks; track backend issues in that repo or in the round brief.

## “Done” for v1 launch narrative

The slice is **done** when a new player can truthfully say: *I signed in, picked a hero, played/idle-progressed, got a reward that stuck, and when I came back it was still there* — with CI green on merged code and Jonathan (or owner) signing off on **manual** checks above.

---

*Update this file when the minimum path changes (e.g. when a feature is cut or promoted into the slice).*
