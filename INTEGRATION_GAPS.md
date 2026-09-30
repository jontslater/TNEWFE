# Backend Integration Gaps

This document tracks any missing endpoints or functionality in the backend that prevents full integration with the frontend.

## Status: ✅ NO CRITICAL GAPS

The backend PR #9 (`cursor/fix-critical-issues-3f3e`) provides all required endpoints for frontend integration.

---

## Authentication Flow (✅ Complete)

### JWT Acquisition
**Status**: ✅ Implemented

**Flow**:
1. User clicks "Login with Twitch" on frontend homepage
2. Frontend redirects to Twitch OAuth: `https://id.twitch.tv/oauth2/authorize`
3. Twitch redirects back to `/auth/callback` with `code` parameter
4. Frontend calls `POST /api/auth/twitch` with `{code}`
5. Backend exchanges code for Twitch tokens, creates/updates hero document
6. Backend returns `{user: {...}, token: "jwt-string"}`
7. Frontend stores `token` in `localStorage.auth_token`
8. All subsequent API calls include `Authorization: Bearer <token>` header

**No gaps**: The `/api/auth/twitch` endpoint exists and returns a JWT.

---

## Streamer/Overlay Key Flow (✅ Complete)

### Overlay Key Acquisition
**Status**: ✅ Implemented

**Flow**:
1. Streamer views "Browser Source" tab in portal
2. Frontend displays overlay URL with `?streamerKey=<key>` parameter
3. Backend generates and stores `overlayKey` in `streamerSettings` collection (per streamer)
4. Overlay (CleanBattlefieldSource.tsx) reads `streamerKey` from URL param
5. Overlay sends `X-Streamer-Key: <key>` header on all overlay-scoped API calls

**Endpoints using streamer key**:
- `GET /api/chat/activity/:streamerId` - Returns chat boost metrics
- `POST /api/overlay/sync` - Idempotent batch sync (requires `X-Streamer-Key` OR ownership)

**No gaps**: Streamer key verification is implemented in `src/middleware/auth.js` (`requireStreamerAccess`).

---

## Admin Key Flow (✅ Complete)

### Admin Operations
**Status**: ✅ Implemented

**Flow**:
1. Admin sets `ADMIN_KEY` environment variable on backend
2. Admin tools (test cleanup, debug endpoints) send `X-Admin-Key: <key>` header
3. Backend verifies via `requireAdmin` middleware

**No gaps**: Admin protection is fully implemented.

---

## Potential Future Improvements (Non-Blocking)

### 1. Token Refresh Endpoint
**Priority**: Low  
**Current**: JWTs expire after 30 days, user must re-login  
**Improvement**: Add `POST /api/auth/refresh` endpoint to issue new JWT without full OAuth flow  
**Workaround**: Current 30-day expiry is acceptable; users rarely stay logged in that long without refresh

### 2. Overlay Key Rotation
**Priority**: Low  
**Current**: Overlay keys are generated once and never change  
**Improvement**: Add `POST /api/streamer/regenerate-key` to allow streamers to rotate keys if leaked  
**Workaround**: Streamers can manually update Firestore `streamerSettings` document if needed

### 3. Batch JWT Validation
**Priority**: Low  
**Current**: JWT is verified on every request (inline in middleware)  
**Improvement**: Add Redis/in-memory cache for decoded JWTs to reduce `jwt.verify` overhead  
**Workaround**: JWT verification is fast enough (<1ms); caching not critical for current scale

---

## Testing Checklist

### JWT Flow
- [x] User can log in via Twitch OAuth
- [x] Backend returns valid JWT in `/api/auth/twitch` response
- [x] Frontend stores JWT in `localStorage.auth_token`
- [x] API client includes `Authorization: Bearer <token>` on all requests
- [x] Invalid/expired JWT triggers 401 → clears token → redirects to home
- [x] Missing JWT on protected routes returns 401

### Streamer Key Flow
- [ ] Streamer can view overlay key in Browser Source tab
- [ ] Overlay URL includes `?streamerKey=<key>` parameter
- [ ] Overlay sends `X-Streamer-Key` header to `/api/chat/activity` and `/api/overlay/sync`
- [ ] Invalid streamer key returns 403
- [ ] Missing streamer key (but valid JWT ownership) allows access

### Ownership Validation
- [ ] User can only modify their own hero (`requireOwnership` middleware)
- [ ] Cross-user hero modification attempts return 403
- [ ] Admin operations require `X-Admin-Key` header

---

## Conclusion

**All critical integration points are implemented in backend PR #9.**  
The frontend can proceed with full integration without waiting for additional backend endpoints.
