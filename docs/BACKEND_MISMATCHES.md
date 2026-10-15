# Backend/Frontend Auth Mismatches - CORRECTED

**Analysis Date**: 2026-10-15
**Backend Branch**: `jontslater/idleDnD-Backend@cursor/fix-critical-issues-3f3e`
**Frontend Branch**: `jontslater/TNEWFE@cursor/refactor-overlay-security-code-health-c08c`

---

## Summary

**Previous claim of "0 mismatches" was INCORRECT.** Systematic review reveals:

1. **Overlay-called routes requiring user JWT** (will 401 in OBS until backend accepts streamer key)
2. **Missing backend routes** (frontend calls non-existent endpoints)
3. **All raw fetch() calls replaced with overlayClient** ✅

---

## ❌ CRITICAL: Overlay Routes Requiring User JWT

These routes are called by the overlay (browser source in OBS) which only has a streamer key, but backend requires `requireAuth` (user JWT). **These will 401 until backend is updated to accept streamer key for these operations.**

### Quest Sync Route

| Method | Path | Backend Middleware | Frontend File:Line | Status |
|--------|------|-------------------|-------------------|--------|
| POST | `/api/quests/update-batch-all` | `requireAuth` | `src/pages/CleanBattlefieldSource.tsx:6768` | ❌ **WILL 401** |
| POST | `/api/quests/update-batch-all` | `requireAuth` | `src/overlay/syncManager.ts:156` | ❌ **WILL 401** |

**Impact**: Quest progress tracking in overlay will fail. Heroes' wave/kill/gather quest progress won't sync to backend.

**Backend Fix Required**: Add `requireStreamerAccess` middleware or modify `requireAuth` to accept streamer key for this route.

**Verification**: Backend audit shows route exists at `src/routes/quests.js:391` with `requireAuth` only.

---

## ❌ CRITICAL: Missing Backend Routes

These routes are called by frontend but **do not exist** on backend. Calls will 404.

### Scheduled Raids Routes (NOT IMPLEMENTED)

| Method | Path | Frontend File:Line | Backend Status |
|--------|------|-------------------|----------------|
| GET | `/api/raids/scheduled/battlefield/:battlefieldId` | `src/pages/CleanBattlefieldSource.tsx:658` | ❌ **DOES NOT EXIST** |
| POST | `/api/raids/scheduled/:id/start` | `src/pages/CleanBattlefieldSource.tsx:693` | ❌ **DOES NOT EXIST** |
| POST | `/api/raids/scheduled/:id/start` | `src/pages/CleanBattlefieldSource.tsx:725` | ❌ **DOES NOT EXIST** |

**Impact**: Scheduled raid auto-start feature completely non-functional.

**Backend Fix Required**: Implement scheduled raids system or remove frontend code.

**Verification**: Backend `src/routes/raids.js` has no routes matching `/scheduled/*` pattern.

### Raid Simulation Route (NOT IMPLEMENTED)

| Method | Path | Frontend File:Line | Backend Status |
|--------|------|-------------------|----------------|
| POST | `/api/raids/:raidId/simulate` | `src/pages/CleanBattlefieldSource.tsx:687` | ❌ **DOES NOT EXIST** |
| POST | `/api/raids/:raidId/simulate` | `src/pages/CleanBattlefieldSource.tsx:722` | ❌ **DOES NOT EXIST** |

**Impact**: Instant raid simulation (reduced rewards) non-functional.

**Backend Fix Required**: Implement raid simulation endpoint or remove frontend code.

**Verification**: Backend `src/routes/raids.js` has `/api/raids/:raidId/start` (line 390) but no `/simulate` variant.

---

## ✅ Working Overlay Routes (Public Access)

These routes are called by overlay and work correctly (no auth required).

| Method | Path | Backend Middleware | Frontend File:Line | Status |
|--------|------|-------------------|-------------------|--------|
| GET | `/api/dungeon/:dungeonId` | Public | `src/pages/CleanBattlefieldSource.tsx:6301` | ✅ Works |
| GET | `/api/dungeon/:dungeonId` | Public | `src/utils/dungeonEnemyGeneration.ts:173` | ✅ Works |
| GET | `/api/raids/:raidId` | Public | `src/pages/CleanBattlefieldSource.tsx:6314` | ✅ Works |

**Note**: Backend route audit confirms these are public (no middleware or whitelisted).

---

## 🔧 Frontend Fixes Applied

### All Raw fetch() Calls Replaced ✅

**Before**: 10 raw `fetch()` calls with no authentication headers
**After**: All replaced with `overlayClient` (sends X-Streamer-Key)

| File | fetch() Count Before | overlayClient Count After |
|------|---------------------|---------------------------|
| `src/pages/CleanBattlefieldSource.tsx` | 8 | 8 |
| `src/overlay/syncManager.ts` | 1 | 1 |
| `src/utils/dungeonEnemyGeneration.ts` | 1 | 1 |
| **Total** | **10** | **10** |

### Path Corrections

- Fixed `/api/dungeons/:id` → `/api/dungeon/:id` (singular, matches backend)

### Lint Enforcement

- Added `scripts/check-fetch.js` to scan for raw fetch() patterns
- Wired into `npm run lint` - fails if any raw fetch() found
- Prevents future regressions

---

## 📋 Action Items for Backend Agent

### Priority 1: Enable Overlay Quest Sync

**Route**: `POST /api/quests/update-batch-all`
**Current**: `requireAuth` only
**Required**: Accept either `requireAuth` OR `requireStreamerAccess`

```javascript
// Change from:
router.post('/update-batch-all', requireAuth, async (req, res) => { ... });

// To:
router.post('/update-batch-all', [optionalAuth, requireStreamerAccess], async (req, res) => {
  // Use req.user if JWT present, or verify streamer key
  // Validate that updates are for heroes in the streamer's battlefield
  ...
});
```

**Validation Required**: Ensure overlay can only update quest progress for heroes in the streamer's active battlefield (prevent cross-streamer exploits).

### Priority 2: Implement or Remove Scheduled Raids

**Option A**: Implement scheduled raids system
- Add routes:
  - `GET /api/raids/scheduled/battlefield/:battlefieldId`
  - `POST /api/raids/scheduled/:id/start`
  - `POST /api/raids/:raidId/simulate`
- Add scheduling logic, participant tracking, auto-start timers

**Option B**: Remove frontend code
- Delete scheduled raids check logic in CleanBattlefieldSource.tsx (~100 lines)
- Feature was never functional anyway

### Priority 3: Document Route Auth Requirements

Update backend route audit to explicitly flag routes that **should** accept streamer key but currently don't.

---

## 🔐 Security Considerations

### Streamer Key Validation for Quest Sync

When adding streamer key support to quest sync:

1. **Verify hero ownership**: Confirm updated heroes belong to streamer's battlefield
2. **Rate limiting**: Overlay syncs every 5 minutes - add rate limit per streamer key
3. **Scope restriction**: Only allow quest updates, not direct rewards or level-ups

### Current Overlay Attack Surface

With current changes:
- ✅ No raw fetch() calls (all go through overlayClient with X-Streamer-Key)
- ✅ Public routes work correctly (dungeon/raid definitions)
- ❌ Quest sync will 401 (fails safely - no exploit possible)
- ❌ Scheduled raids will 404 (fails safely - feature just doesn't work)

**Conclusion**: Current state is secure but partially non-functional. Quest sync and scheduled raids need backend updates to work.

---

## ✅ Verification Steps Completed

1. ✅ Scanned all src files for `fetch(/api/` patterns - all replaced
2. ✅ Verified every route path against backend `src/routes/*.js`  
3. ✅ Cross-checked middleware requirements from `ROUTE_PROTECTION_AUDIT.md`
4. ✅ Added lint enforcement to prevent future regressions
5. ✅ Tested build passes with all changes

---

## 📊 Final Status

| Category | Count | Status |
|----------|-------|--------|
| Raw fetch() calls | 0 | ✅ All replaced |
| Routes needing streamer key support | 1 | ❌ Quest sync |
| Missing backend routes | 3 | ❌ Scheduled raids + simulate |
| Working overlay routes | 3 | ✅ Dungeon + raid fetch |
| Lint enforcement | 1 | ✅ check-fetch.js |

**Integration Status**: 
- ✅ Frontend ready (all calls use proper auth clients)
- ❌ Backend needs updates (quest sync + scheduled raids)
- ✅ No auth exploits possible (failures are safe 401/404)

**Recommendation**: Deploy frontend now. Quest sync and scheduled raids will fail gracefully until backend implements support.
