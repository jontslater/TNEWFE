# Backend/Frontend Mismatches

> **Firestore composite indexes:** Deploy only from **`jontslater/idleDnD-Backend`** (`firebase.json` + `firestore.indexes.json`). This frontend repo does not ship index definitions — avoid deploying a duplicate `firestore.indexes.json` from TNEWFE so index sets do not conflict.

**Skills / role-active abilities:** Frontend uses `src/game/skills/` (category templates mirror backend `skills.js` until `GET /api/skills/definitions` ships). Role defaults: Shield Wall / Group Heal / Burst Strike; class overrides: guardian, cleric, shaman, berserker. Assumption: backend defs will match `activeAbilities.ts` cooldowns and effect fields.

**Updated**: 2026-10-19  
**Backend branch**: `jontslater/idleDnD-Backend@cursor/fix-critical-issues-3f3e`  
**Frontend branch**: `jontslater/TNEWFE@cursor/refactor-overlay-security-code-health-c08c`

---

## Summary

| Area | Status |
|------|--------|
| Raw `fetch(/api/...)` in `src/` | ✅ Replaced with `apiClient` / `overlayClient` (`scripts/check-fetch.js`) |
| Chat queue REST (`/api/queues/*`) | ✅ Matches backend `docs/QUEUE_API.md` (`src/api/queueApi.ts`, `src/utils/queueSnapshot.ts`) |
| Scheduled guild raids (overlay polling) | ✅ **Disabled** (`FEATURES.scheduledRaids = false`) — code kept in `src/overlay/scheduledGuildRaids.ts` |
| Instance detection (overlay) | ✅ Listens on `battlefieldId` + unified statuses (`src/constants/instanceStatus.ts`) |
| Firestore rules (overlay reads) | ✅ `raidInstances`, `dungeonInstances`, `battlefieldQueues` read-only in `firestore.rules` — **owner must confirm deployed rules** |

---

## Queue REST API (portal `src/api/queueApi.ts`)

Aligned with backend `docs/QUEUE_API.md`:

| Method | Path | Request | Notes |
|--------|------|---------|--------|
| GET | `/api/queues/:twitchId` | — | `launchAt` epoch ms in JSON; doc id `twitch:{id}` |
| POST | `/api/queues` | `{ twitchId, type, queueKey }` | Not `contentId` |
| POST | `/api/queues/:queueId/join` | `{ heroId }` | `:queueId` = doc id `twitch:{streamerTwitchId}` (not internal `queueKey`) |
| POST | `/api/queues/:queueId/leave` | — | JWT only |

**Portal surfaces API `error` / `message` text** (role full, in a run on another stream, queue closed).

**Firestore:** overlay instance listener uses `battlefieldId` + `status in [...]` — indexes live in backend `firestore.indexes.json` (see note at top).

---

## Overlay-called routes that require user JWT today (will 401 with streamer key only)

Pass this list to the backend agent to add `requireStreamerAccess` (or equivalent) for the streamer’s battlefield.

| Method | Path | File:Line | Backend middleware (today) |
|--------|------|-----------|----------------------------|
| POST | `/api/quests/update-batch-all` | `src/pages/CleanBattlefieldSource.tsx` (quest sync `useEffect`) | `requireAuth` |
| POST | `/api/quests/update-batch-all` | `src/overlay/syncManager.ts` (~156) | `requireAuth` |

**Note:** Overlay uses `overlayClient` (sends `X-Streamer-Key` only). Quest sync fails safely until backend accepts streamer key for heroes on that battlefield.

---

## Routes called when `FEATURES.scheduledRaids` is enabled (default **off**)

Not polled in production. Implemented in `src/overlay/scheduledGuildRaids.ts` for future guild scheduled raids.

| Method | Path | Backend status |
|--------|------|----------------|
| GET | `/api/raids/scheduled/battlefield/:battlefieldId` | ❌ Not on backend (`MISSING_BACKEND_ROUTES.md`) |
| POST | `/api/raids/scheduled/:id/start` | ❌ Not on backend |
| POST | `/api/raids/:raidId/simulate` | ❌ Not on backend |

Enable with `FEATURES.scheduledRaids = true` in `src/config/features.ts` after backend implements routes.

---

## Portal routes fixed or gated

| Client method | Previous issue | Frontend fix |
|---------------|----------------|--------------|
| `raidAPI.simulateRaid` | POST `/api/raids/:id/simulate` missing | Gated by `FEATURES.raidSimulate` (default false) |
| `raidAPI.signupForWorldBoss` | POST `/api/worldboss/signup` unreachable | Uses `GET /api/worldboss/active` + `POST /api/worldboss/:bossId/join` |
| `raidAPI.joinRaid` / `leaveRaid` | No such routes | `joinRaid` → `signupForRaid`; `leaveRaid` throws (use `queueAPI.leaveQueue`) |
| `raidAPI.joinQueue` / `joinRaidQueue` | Legacy LFG `POST /api/raids/queue/:raidId/join` | Unchanged — still valid for raid-id LFG, **not** chat battlefield queue |
| Chat battlefield queue | N/A | **`queueAPI`** (`src/api/queueApi.ts`) + `StreamQueuePanel` |

---

## Overlay public reads (work with streamer key or no auth)

| Method | Path | File:Line |
|--------|------|-----------|
| GET | `/api/dungeon/:dungeonId` | `CleanBattlefieldSource.tsx` (loot guaranteedLoot) |
| GET | `/api/raids/:raidId` | `CleanBattlefieldSource.tsx` (loot guaranteedLoot) |
| GET | `/api/dungeon/:dungeonId` | `src/utils/dungeonEnemyGeneration.ts` (~173) |

Firestore (no HTTP): `battlefieldQueues/{battlefieldId}`, `raidInstances`, `dungeonInstances` — overlay listeners in `useBattlefieldQueueFirestore.ts`, `useActiveInstanceListener.ts`.

---

## Firestore rules

`firestore.rules` in this repo now allows **read-only** client access to:

- `raidInstances/{instanceId}`
- `dungeonInstances/{instanceId}`
- `battlefieldQueues/{battlefieldId}`
- `dungeonQueue/{entryId}` (legacy)

**Owner action:** Confirm which rules file is deployed to Firebase (may live only in backend or another project).

---

## Integration status

- ✅ Frontend: no raw API `fetch()`; overlay queue strip + instance detection by `battlefieldId`; scheduled raids behind flag; portal queue join/leave module.
- ⏳ Backend: queue REST routes + instance field fixes + quest sync streamer key (per backend PR #9).
- ❌ Not claiming full integration verified until queue REST and chat-launched instance shape are live on backend.
