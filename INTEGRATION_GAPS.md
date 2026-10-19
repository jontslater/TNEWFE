# Backend Integration Gaps

This document tracks missing endpoints or functionality in the backend that prevents full integration with the frontend.

**Last Updated**: After auditing backend PR #9 branch `cursor/fix-critical-issues-3f3e`

---

## Status: ⚠️ 2 CRITICAL GAPS IDENTIFIED

The backend PR #9 integration is **INCOMPLETE**. Two critical items are missing:

1. **Streamer key generation/fetching** (overlayKey)
2. **Auth middleware applied to most routes** (only ~9 of ~218 routes protected)

The backend agent is currently fixing both issues.

---

## Gap 1: Streamer Key Generation (overlayKey) - ⚠️ MISSING

### Current State
- **Backend PR #9 branch audited**: `cursor/fix-critical-issues-3f3e`
- **Finding**: `src/routes/streamSettings.js` exists but does NOT generate or store `overlayKey`
- **Impact**: `X-Streamer-Key` auth flow CANNOT work yet

### What's Missing
The backend needs endpoints to:
1. **Generate overlayKey** when streamer first accesses Browser Source tab
2. **Fetch overlayKey** for authenticated streamer (protected by their JWT)
3. **Regenerate overlayKey** if leaked (with confirmation)
4. **Store overlayKey** in `streamerSettings` collection (Firestore)

### Expected Backend Endpoints (PENDING)
```
GET  /api/stream/settings/:twitchId/overlay-key
POST /api/stream/settings/:twitchId/overlay-key/regenerate
```

**Auth**: Protected by `requireAuth` + `requireOwnership` (streamer's own JWT)  
**Response**: `{ overlayKey: "abc123..." }`

### Frontend Impact
- Frontend `BrowserSourceTab` component CANNOT fetch overlay key yet
- Overlay URL generation blocked (no key to include in `?streamerKey=...`)
- `overlayClient` X-Streamer-Key header will be empty until backend provides key

### Workaround
**NONE** - This is a hard dependency. Frontend cannot proceed without backend fix.

---

## Gap 2: Auth Middleware Coverage - ⚠️ INCOMPLETE

### Current State
- **Audit result**: Auth middleware applied to only ~9 of ~218 backend routes
- **Finding**: Most mutating routes (hero updates, guild ops, mail, auction) are NOT protected
- **Impact**: Cross-user exploits still possible, security vulnerabilities remain open

### Routes Still Lacking Auth (Partial List)
Based on backend PR #9 audit:
- Most `/api/heroes/:userId/*` mutation routes
- `/api/guilds/*` operations (create, invite, promote, kick)
- `/api/mail/*` operations (send, claim attachments)
- `/api/auction/*` operations (bid, cancel, claim)
- `/api/purchases/*` routes (gold shop, token shop)

### Expected Backend Fix (IN PROGRESS)
The backend agent is:
1. Adding `requireAuth` to all mutation routes
2. Adding `requireOwnership` to hero/guild/resource-specific routes
3. Adding `requireAdmin` to destructive/debug routes
4. Adding `requireStreamerAccess` to overlay/chat activity routes

### Frontend Impact
- Frontend sends `Authorization: Bearer <token>` headers (already implemented)
- Frontend will see 401/403 errors on unprotected routes (as intended)
- **CANNOT VERIFY** until backend deploys auth on all routes

---

## Integration Testing Status

### Auth Testing Checklist

#### JWT Flow
- [ ] **UNVERIFIED**: User can log in via Twitch OAuth (backend `/api/auth/twitch` exists)
- [ ] **UNVERIFIED**: Backend returns valid JWT in response
- [ ] ✅ **VERIFIED**: Frontend stores JWT in `localStorage.auth_token`
- [ ] ✅ **VERIFIED**: API client includes `Authorization: Bearer <token>` header
- [ ] **UNVERIFIED**: Invalid/expired JWT triggers 401 → clears token → redirects to home
- [ ] **UNVERIFIED**: Missing JWT on protected routes returns 401

#### Streamer Key Flow
- [ ] **BLOCKED**: Streamer cannot view overlay key (backend endpoint missing)
- [ ] **BLOCKED**: Overlay URL generation blocked (no key to include)
- [ ] **BLOCKED**: Overlay cannot send `X-Streamer-Key` header (no key available)
- [ ] **BLOCKED**: Backend cannot validate streamer key (`overlayKey` not stored)
- [ ] **BLOCKED**: Regenerate key not implemented (backend endpoint missing)

#### Ownership Validation
- [ ] **UNVERIFIED**: User can only modify their own hero (`requireOwnership` not on all routes)
- [ ] **UNVERIFIED**: Cross-user hero modification returns 403 (auth not applied yet)
- [ ] **UNVERIFIED**: Admin operations require `X-Admin-Key` header

---

## What Frontend HAS Done (Optimistic Implementation)

### API Client Infrastructure ✅
- **overlayClient**: Separate axios instance for browser-source routes
- **X-Streamer-Key header**: Reads from `sessionStorage.streamer_key` (when available)
- **JWT fallback**: Uses `Authorization: Bearer` if no streamer key
- **overlayAPI**: Methods for `syncBatch()` and `getChatActivity()`

### Auth Header Coverage ✅
All API calls use shared `apiClient` or `overlayClient`:
- `heroAPI.*` → uses `apiClient` (sends JWT)
- `overlayAPI.*` → uses `overlayClient` (sends streamer key OR JWT)
- `authAPI.*` → uses `apiClient` (no auth needed for login)

### Integration Hooks ✅
- `useChatActivity`: Uses `overlayAPI.getChatActivity()` with backend smooth curve
- `useOverlaySync`: Uses `overlayAPI.syncBatch()` with idempotent batchId

---

## What Backend MUST Do (Pending)

### 1. Streamer Key Generation (HIGH PRIORITY)
**File**: `src/routes/streamSettings.js`

Add endpoints:
```javascript
// GET /api/stream/settings/:twitchId/overlay-key
// Protected by requireAuth + requireOwnership
router.get('/:twitchId/overlay-key', requireAuth, requireOwnership, async (req, res) => {
  const { twitchId } = req.params;
  
  // Get or generate overlayKey
  let settingsDoc = await db.collection('streamerSettings').doc(twitchId).get();
  let overlayKey;
  
  if (settingsDoc.exists && settingsDoc.data().overlayKey) {
    overlayKey = settingsDoc.data().overlayKey;
  } else {
    // Generate new key: random 32-char hex
    overlayKey = crypto.randomBytes(16).toString('hex');
    await db.collection('streamerSettings').doc(twitchId).set({
      overlayKey,
      generatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }
  
  res.json({ overlayKey });
});

// POST /api/stream/settings/:twitchId/overlay-key/regenerate
// Protected by requireAuth + requireOwnership
router.post('/:twitchId/overlay-key/regenerate', requireAuth, requireOwnership, async (req, res) => {
  const { twitchId } = req.params;
  
  // Generate new key
  const overlayKey = crypto.randomBytes(16).toString('hex');
  await db.collection('streamerSettings').doc(twitchId).set({
    overlayKey,
    regeneratedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  
  res.json({ overlayKey });
});
```

### 2. Apply Auth Middleware to All Routes (HIGH PRIORITY)
**Files**: `src/routes/*.js` (all route files)

Apply to:
- All `PUT`, `POST`, `DELETE` routes → `requireAuth`
- Hero-specific routes → `requireAuth` + `requireOwnership`
- Guild/mail/auction resource routes → `requireAuth` + resource ownership checks
- Admin/test routes → `requireAdmin`
- Overlay/chat activity routes → `requireStreamerAccess`

---

## Timeline

### Backend Agent (Current Work)
- **Status**: Fixing streamer key generation + auth coverage
- **ETA**: Unknown (backend agent autonomous)

### Frontend Readiness
- **Status**: Optimistically implemented, waiting for backend
- **Blocker**: Cannot test or verify until backend deploys fixes

### Integration Testing
- **Status**: BLOCKED until backend fixes are deployed
- **Checklist**: See `MANUAL_TEST_CHECKLIST.md` (most items unverified)

---

## Conclusion

**Frontend is READY** - All API calls use correct clients and headers.  
**Backend is INCOMPLETE** - Missing streamer key endpoints and auth on most routes.  
**Integration is BLOCKED** - Cannot verify or test until backend fixes are deployed.

The frontend has done everything possible in advance. We wait for backend PR #9 to be completed.
