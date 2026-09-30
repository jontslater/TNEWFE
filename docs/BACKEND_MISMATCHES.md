# Backend/Frontend Auth Mismatches

**Analysis Date**: 2026-09-30
**Backend Branch**: `jontslater/idleDnD-Backend@cursor/fix-critical-issues-3f3e`
**Frontend Branch**: `jontslater/TNEWFE@cursor/refactor-overlay-security-code-health-c08c`

## Summary

Analysis of all frontend API calls against backend route protection reveals **NO CRITICAL MISMATCHES**. All frontend calls use the correct credential type. However, there are some **documentation inconsistencies** to note.

---

## ✅ Verified Compatible Routes

### Browser Source / Overlay Routes

| Frontend Call | Backend Route | Expected Credential | Frontend Implementation | Status |
|---|---|---|---|---|
| `overlayAPI.syncBatch()` | POST `/api/overlay/sync` | `requireStreamerAccess` | ✅ `overlayClient` sends `X-Streamer-Key` | Compatible |
| `battlefieldAPI.registerHero()` | POST `/api/battlefields/register` | `requireAuth` | ✅ `apiClient` sends JWT | Compatible |
| `battlefieldAPI.getBattlefieldHeroes()` | GET `/api/battlefields/:battlefieldId/heroes` | Public | ✅ No auth required | Compatible |
| `battlefieldAPI.getBattlefieldState()` | GET `/api/battlefields/:battlefieldId/state` | Public | ✅ No auth required | Compatible |
| `overlayAPI.getChatActivity()` | GET `/api/chat/activity/:streamerId` | `requireStreamerAccess, optionalAuth` | ✅ `overlayClient` sends `X-Streamer-Key` | Compatible |

### Portal / Dashboard Routes

All portal routes use `apiClient` which sends JWT via `Authorization: Bearer` header. All verified as compatible with `requireAuth` + `requireOwnership` middleware patterns.

### Stream Settings Routes (Overlay Key Endpoints)

| Frontend Call | Backend Route | Middleware | Frontend Implementation | Status |
|---|---|---|---|---|
| `streamSettingsAPI.getOverlayKey()` | GET `/api/stream/settings/:twitchId/overlay-key` | `requireAuth` | ✅ `apiClient` sends JWT | Compatible |
| `streamSettingsAPI.regenerateOverlayKey()` | POST `/api/stream/settings/:twitchId/overlay-key/regenerate` | `requireAuth` | ✅ `apiClient` sends JWT | Compatible |
| `streamSettingsAPI.getSettings()` | GET `/api/stream/settings/:twitchId` | `requireAuth` | ✅ `apiClient` sends JWT | Compatible |
| `streamSettingsAPI.updateSettings()` | PUT `/api/stream/settings/:twitchId` | `requireAuth` | ✅ `apiClient` sends JWT | Compatible |
| `streamSettingsAPI.testChatUpdate()` | POST `/api/stream/settings/:twitchId/test` | `requireAuth` | ✅ `apiClient` sends JWT | Compatible |

**Note**: Backend overlay key endpoints exist and match frontend expectations. Routes verify ownership via `req.user.twitchUserId !== twitchId` check inline (not using `requireOwnership` middleware, but equivalent).

---

## 📋 Documentation-Only Issues

### Issue 1: BACKEND_CALLS.md Stale "Known Gaps" Section

**Problem**: `docs/BACKEND_CALLS.md` lists overlay key endpoints as "Gap 1: Missing" but backend now implements them.

**Location**: `docs/BACKEND_CALLS.md` lines ~395-410

**Fix Required**: Remove "Known Backend Gaps" section or update to reflect current backend state.

**Impact**: Documentation confusion only; no runtime impact.

---

### Issue 2: Auth Coverage Gap Documentation Stale

**Problem**: `docs/BACKEND_CALLS.md` lists "Gap 2: Auth Middleware Coverage (Incomplete)" claiming only ~9/218 routes protected, but backend audit shows 176/220 routes protected with 44 whitelisted public routes and 0 unprotected.

**Location**: `docs/BACKEND_CALLS.md` lines ~410-420

**Fix Required**: Remove or update Gap 2 to reflect backend auth coverage is now complete.

**Impact**: Documentation confusion only; no runtime impact.

---

## 🔍 Edge Cases Verified

### Public Routes Without Auth
The following routes are called by frontend without credentials and are correctly marked as public on backend:

- GET `/api/battlefields/:battlefieldId/heroes` ✅
- GET `/api/battlefields/:battlefieldId/state` ✅
- GET `/api/heroes/create/cost-info` ✅
- GET `/api/guilds/` ✅
- GET `/api/auction/listings` ✅
- GET `/api/raids/` ✅
- POST `/api/auth/twitch` ✅
- POST `/api/auth/tiktok` ✅

All verified as public routes on backend (no middleware or whitelisted).

### Routes Requiring Internal Key
The following routes require `X-Internal-Key` and are **not called by frontend**:

- POST `/api/battlefields/:battlefieldId/combat/xp/accumulate` (backend service only)
- POST `/api/battlefields/:battlefieldId/combat/xp/flush` (backend service only)
- POST `/api/chat/join` (backend function call only, not HTTP)
- POST `/api/achievements/check` (backend service only)
- POST `/api/lootTokens/award` (backend service only)
- POST `/api/leaderboards/update` (backend service only)

✅ Frontend does not call any of these endpoints.

### Routes Requiring Admin Key
The following routes require `X-Admin-Key` and are **not called by frontend production code**:

- POST `/api/heroes/test/create` (test/debug only)
- POST `/api/heroes/:userId/admin/give-item` (admin tool only)
- POST `/api/purchases/set-founder` (admin tool only)
- POST `/api/purchases/remove-founder` (admin tool only)
- POST `/api/skills/:userId/reset` (admin tool only)
- POST `/api/achievements/:userId/unlock-all` (admin tool only)

✅ Frontend does not call any of these in normal operation. If admin tools are added later, they would need to prompt for admin key.

---

## 🎯 Recommendations

### Frontend Changes Required: None ✅

All frontend API calls use the correct credential type for their backend route's middleware requirements.

### Documentation Changes Required:

1. **Update `docs/BACKEND_CALLS.md`**:
   - Remove "Gap 1: Overlay Key Generation (Missing)" section
   - Remove or update "Gap 2: Auth Middleware Coverage" section
   - Add note that backend route protection audit shows 176/220 protected, 44 public, 0 unprotected

2. **Add Backend Integration Status**:
   - Document that backend PR #9 (cursor/fix-critical-issues-3f3e) is now integrated
   - All frontend calls verified compatible with backend auth middleware

---

## 🔐 Security Notes

### Credential Storage Verified

1. **User JWT**: Stored in `localStorage.auth_token` ✅
   - Sent by `apiClient` via `Authorization: Bearer` header
   - Cleared on 401/403 errors with redirect

2. **Streamer Key**: Stored in `sessionStorage.streamer_key` ✅
   - Sent by `overlayClient` via `X-Streamer-Key` header
   - No redirect on 401/403 (overlay context)

3. **Admin Key**: Not stored ❌
   - Would need to be injected for admin operations
   - Not currently used by frontend

### Token Refresh Strategy

**Current**: No token refresh implemented
- JWT expires after configured duration (backend JWT_SECRET)
- On expiry, user is redirected to home to re-login
- No automatic refresh or silent re-auth

**Recommendation**: Consider implementing refresh tokens for better UX (separate ticket).

---

## ✅ Conclusion

**No backend/frontend auth mismatches found.** All frontend API calls use the correct credential for their backend route's middleware requirements. Documentation updates are the only changes needed.

**Backend Integration Status**: ✅ Ready to merge
**Frontend Integration Status**: ✅ Ready to merge

The two PRs are fully compatible and can be deployed together without auth-related runtime errors.
