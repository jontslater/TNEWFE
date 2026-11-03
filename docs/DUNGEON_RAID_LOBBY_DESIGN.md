# Dungeon & Raid Lobby UX — Design

**Status:** Frontend implemented (Nov 2025) · Backend additions documented below  
**Scope:** Single Clean Battlefield overlay (idle + dungeon + raid), portal-first LFG, chat limited to `!join`, `!hero`, `!auto`, `!leave`.

## Problems found (audit)

| Area | Issue | Impact |
|------|--------|--------|
| **Raid LFG API** | Portal sent `heroName`, `heroLevel`, `heroRole` (class id) instead of `heroId` + `role` (`tank`/`healer`/`dps`) | Raid queue joins failed or never matchmade |
| **RaidBrowser** | On “auto start”, showed **mock** `CombatInterface` with fake party | Players thought raid ran in-portal; real combat is on `/clean-battlefield` |
| **Scheduled raids** | “Join” linked to deprecated `/browser-source/raid/:id` | Broken OBS URL; instance transition uses Firestore + Clean Battlefield |
| **Queue identity** | Dungeon status used `user.id` inconsistently vs `twitchId` | Missed queue state in header badge |
| **Streamer parties** | `battlefieldQueues` only via chat (`queueService.js`); no HTTP routes | Portal could not open/join Jackbox-style lobbies without new API |
| **Lobby visibility** | Dungeon / raid / streamer queue state split across tabs | Hard to see “where am I?” or leave quickly |

## Target experience

1. **One overlay:** `/clean-battlefield?battlefieldId=twitch:{streamerId}` auto-switches idle → dungeon → raid via `useActiveInstanceListener`.
2. **Portal Activity Lobby:** One panel on Raids, Dungeon, and Browser Source tabs — phase label, one-click LFG, auto-queue toggles (localStorage), streamer party code + countdown when roles fill.
3. **Chat minimal:** Viewers use `!join` on a channel to set `currentBattlefieldId`; everything else (LFG, streamer events, world boss signup) on the site.
4. **Auto-start:** Global LFG matchmaking when roles filled (backend). Streamer lobbies set `launchAt` + 10s when `isReady` (backend `queueService.joinQueue`).

## Frontend architecture

```
PlayerPortal
  ActivityLobbyPanel  ← usePlayerActivityLobby
    ├─ dungeonAPI (global LFG)
    ├─ raidAPI (fixed payload)
    ├─ Firestore battlefieldQueues/{battlefieldId}
    └─ useActiveInstanceListener(twitchId)
  RaidBrowser (fixed join + overlay CTA)
  DungeonFinderTab (unchanged flow, fixed userId)
  StreamerEventPanel (Browser Source tab)
```

**New modules**

- `src/utils/combatRole.ts` — class → tank/healer/dps  
- `src/utils/activityQueuePreferences.ts` — auto-queue prefs  
- `src/utils/battlefieldUrls.ts` — Clean Battlefield links  
- `src/hooks/usePlayerActivityLobby.ts` — unified polling + Firestore lobby  
- `src/components/ActivityLobbyPanel.tsx` — player UX  
- `src/components/StreamerEventPanel.tsx` — streamer open lobby actions  

## Backend changes required (idleDnD-Backend)

Deploy these on `main` (Railway auto-deploy). Frontend calls them via `battlefieldQueueAPI` and degrades with a clear message until live.

### 1. Create streamer lobby

```
POST /api/battlefields/:battlefieldId/queue
Body: {
  streamerId: string,
  streamerName: string,
  type: 'dungeon' | 'raid',
  instanceId: string   // e.g. normal | heroic | elder_dragon_normal
}
```

Implementation: wrap `createQueue(battlefieldId, streamerId, streamerName, type, instanceId)` from `src/services/queueService.js`.

### 2. Join lobby by code (portal one-click)

```
POST /api/battlefields/queue/join
Body: {
  code: string,
  heroId: string,
  userId: string,      // twitch user id
  username: string
}
```

Implementation: load hero from `heroes/{heroId}`, call `joinQueue(code, hero, username, userId)`.

Validate hero is on the queue’s battlefield when `accessMode === 'battlefield'` (recommended default).

### 3. Leave streamer lobby

```
POST /api/battlefields/queue/leave
Body: { userId: string }
```

Implementation: `leaveQueue(userId, username)`.

### 4. Optional: launch tick

If not already running server-side, a cron/worker should call `launchInstance` when `status === 'ready'` and `launchAt <= now` (Firestore `battlefieldQueues`).

### 5. Raid queue (already fixed on frontend)

Existing route unchanged:

```
POST /api/raids/queue/:raidId/join
{ userId, heroId, role, itemScore? }
```

## Chat command surface (product)

| Command | Purpose |
|---------|---------|
| `!join` | Join streamer battlefield / create or select hero |
| `!hero` | List/switch heroes |
| `!auto` | Toggle auto gear / skill spending |
| `!leave` | Leave battlefield |

Dungeon/raid/world-boss listing and queue codes → **Player Portal** (Activity Lobby + Raids/Dungeon tabs).

## Testing checklist

- [ ] Portal → Raids → Join queue (network tab shows `heroId` + `role`)  
- [ ] Five matching roles → instance in Firestore → Clean Battlefield switches to raid  
- [ ] Activity Lobby shows dungeon queue role counts and leave button  
- [ ] Auto-queue toggle joins once when enabled  
- [ ] Streamer → Browser Source → Open dungeon party (after backend deploy) → viewers see code + countdown  
- [ ] `npm run test` + `npm run build:check`  

## Out of scope (this PR)

- Mobile layout (parallel agent)  
- Economy / rewards (parallel agent)  
- Boss mechanic execution in combat engine  
- Removing legacy `/browser-source/*` routes (still redirect for old OBS links)
