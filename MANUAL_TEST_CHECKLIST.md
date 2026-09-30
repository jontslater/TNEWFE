# Manual Test Checklist for PR #3

Live-session testing checklist for OBS overlay, stream switching, rare drops, chat boost, and sync failure recovery.

---

## Pre-Test Setup

### Backend Requirements
- [ ] Backend PR #9 (`cursor/fix-critical-issues-3f3e`) deployed and running
- [ ] Environment variables set:
  - `JWT_SECRET` (for JWT signing)
  - `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` (for OAuth)
  - `ADMIN_KEY` (optional, for admin routes)
- [ ] Backend accessible at `http://localhost:3001` (or configured `VITE_API_URL`)

### Frontend Requirements
- [ ] Frontend built: `npm run build`
- [ ] Dev server running: `npm run dev`
- [ ] OBS Studio installed and configured
- [ ] At least 2 Twitch accounts for multi-stream testing

---

## Test Suite 1: Authentication & JWT Flow

### 1.1 Login with Twitch
- [ ] Click "Login with Twitch" on homepage
- [ ] Redirected to Twitch OAuth page
- [ ] Accept permissions
- [ ] Redirected back to `/auth/callback`
- [ ] **Verify**: Token stored in `localStorage.auth_token`
- [ ] **Verify**: Redirected to `/portal` (or `/create-hero` if no heroes)
- [ ] **Verify**: API calls include `Authorization: Bearer <token>` header (check Network tab)

### 1.2 Invalid/Expired JWT
- [ ] Manually edit `localStorage.auth_token` to an invalid value
- [ ] Reload page or make an API call (e.g. view inventory)
- [ ] **Verify**: 401 error triggers token clear
- [ ] **Verify**: Redirect to home page with error message
- [ ] **Verify**: Must re-login to access portal

### 1.3 Cross-User Protection
- [ ] Log in as User A
- [ ] Note User A's hero ID (e.g. `heroA123`)
- [ ] Open browser console
- [ ] Attempt direct API call to modify User B's hero: 
  ```js
  fetch('http://localhost:3001/api/heroes/userB/heroB456', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ gold: 999999 })
  })
  ```
- [ ] **Verify**: 403 Forbidden error
- [ ] **Verify**: Console error: "You can only modify your own resources"

---

## Test Suite 2: OBS Overlay & Streamer Keys

### 2.1 Generate Overlay URL
- [ ] Log in to portal
- [ ] Navigate to "Browser Source" tab
- [ ] **Verify**: Overlay URL displayed with `?streamerKey=<key>` parameter
- [ ] Copy URL to clipboard
- [ ] **Verify**: URL format: `/browser-source?streamerKey=abc123&battlefieldId=twitch:username`

### 2.2 OBS Browser Source Setup
- [ ] Open OBS Studio
- [ ] Add Browser Source
- [ ] Paste overlay URL
- [ ] Set width: 1920, height: 1080
- [ ] **Verify**: Heroes appear on left side
- [ ] **Verify**: Transparent background (no black/white bg)
- [ ] **Verify**: Hero sprites animate (idle/attack/hit animations)

### 2.3 Streamer Key Validation
- [ ] In browser console (on overlay page), check:
  ```js
  sessionStorage.getItem('streamer_key')
  ```
- [ ] **Verify**: Key matches URL parameter
- [ ] **Verify**: API calls to `/api/chat/activity` include `X-Streamer-Key` header (Network tab)
- [ ] Manually corrupt streamer key in sessionStorage
- [ ] Refresh overlay
- [ ] **Verify**: API calls return 403 errors
- [ ] **Verify**: Overlay shows "Auth error" in console (but doesn't redirect)

---

## Test Suite 3: Stream Switching & Battlefield Invariant

### 3.1 Single Stream Per Player (Portal View)
- [ ] Log in as User A
- [ ] View StreamStatusBanner component in portal
- [ ] **Verify**: Shows current stream: `twitch:userA`
- [ ] Open second browser tab (User A still logged in)
- [ ] Join a different stream (manually update `currentBattlefieldId` via Firestore)
- [ ] **Verify**: StreamStatusBanner updates to show new stream
- [ ] **Verify**: Warning message: "Your hero switched to twitch:newStream"

### 3.2 Cross-Stream Join (Backend Atomicity)
- [ ] User A joins `twitch:streamA`
- [ ] User A attempts to join `twitch:streamB` (via chat command or portal)
- [ ] **Verify**: Backend removes hero from `streamA` before adding to `streamB`
- [ ] **Verify**: Hero appears in ONLY ONE battlefield at a time
- [ ] **Verify**: No duplicate hero entries across multiple streams

### 3.3 OBS Overlay Stream Switching
- [ ] OBS showing overlay for `twitch:streamA`
- [ ] User joins `twitch:streamB` (different stream)
- [ ] **Verify**: Hero disappears from `streamA` overlay
- [ ] **Verify**: Hero does NOT appear on `streamB` overlay (different streamerKey)
- [ ] Open second OBS with `streamB` overlay
- [ ] **Verify**: Hero now appears on `streamB` overlay

---

## Test Suite 4: Rare Drop Announcements

### 4.1 Rare Drop Visual
- [ ] Set up OBS with overlay
- [ ] Trigger rare drop (mythic raid or manual loot generation)
- [ ] **Verify**: Animated overlay card appears center-screen
- [ ] **Verify**: Card shows:
  - Rarity name (RARE/EPIC/LEGENDARY/MYTHIC)
  - Rarity emoji (🔵/🟣/🟡/🔴)
  - Hero name
  - Item name
  - Rarity-specific colors and glow
- [ ] **Verify**: Card auto-hides after 5 seconds

### 4.2 Multiple Rare Drops
- [ ] Trigger multiple rare drops in quick succession (2-3 items)
- [ ] **Verify**: Only ONE announcement shown at a time (no overlap)
- [ ] **Verify**: Latest drop replaces previous announcement
- [ ] **Verify**: No visual glitches or stuck announcements

### 4.3 Common/Uncommon Drops (No Announcement)
- [ ] Trigger common or uncommon drops
- [ ] **Verify**: NO announcement card shown
- [ ] **Verify**: Only SCT (scrolling combat text) shows loot

---

## Test Suite 5: Chat Activity & Group Boost

### 5.1 Chat Boost Display (Portal)
- [ ] Log in to portal
- [ ] View GroupBoostIndicator component
- [ ] **Verify**: Shows "0 chatters" initially
- [ ] **Verify**: Shows "0% boost" with inactive state
- [ ] Have 5 users chat in stream (or mock via backend)
- [ ] Wait 30 seconds for poll refresh
- [ ] **Verify**: Chatter count updates to 5
- [ ] **Verify**: Boost percentage updates (smooth curve: ~11% for 5 users)

### 5.2 Smooth Boost Curve (Backend Formula)
- [ ] Backend uses formula: `bonus = 0.5 * (users / (users + 20))`
- [ ] Test with different chatter counts:
  - 0 users: 0% boost
  - 3 users: ~6.5% boost
  - 10 users: ~16.7% boost
  - 20 users: ~25% boost (half-point)
  - 50 users: ~35.7% boost
- [ ] **Verify**: Frontend displays match backend calculations
- [ ] **Verify**: No stepped tiers (old system) - smooth curve only

### 5.3 Overlay Group Boost Display
- [ ] Open OBS overlay
- [ ] GroupBoostIndicator should show in corner (if integrated)
- [ ] **Verify**: Shows same chatter count and boost as portal
- [ ] **Verify**: Updates every 30 seconds (poll interval)

---

## Test Suite 6: Overlay Sync Failure & Recovery

### 6.1 Normal Sync Flow
- [ ] Kill an enemy in overlay (gain XP and gold)
- [ ] Wait 60 seconds (sync interval)
- [ ] **Verify**: Console log: "Batch synced: 1 heroes, 0 skipped"
- [ ] Check Firestore hero document
- [ ] **Verify**: XP and gold updated in database

### 6.2 Network Failure Recovery
- [ ] Open browser DevTools → Network tab
- [ ] Set network throttling to "Offline"
- [ ] Kill an enemy (gain XP/gold)
- [ ] Wait 60 seconds for sync attempt
- [ ] **Verify**: Console error: "Batch sync failed"
- [ ] **Verify**: Changes marked as "failed" (retry on next sync)
- [ ] Re-enable network
- [ ] Wait 60 seconds
- [ ] **Verify**: Retry succeeds, changes synced

### 6.3 Idempotent Batch Replay
- [ ] Capture a successful sync batchId from console (e.g. `batch-1234567890-abc`)
- [ ] Manually replay same batchId via API:
  ```js
  fetch('http://localhost:3001/api/overlay/sync', {
    method: 'POST',
    headers: {
      'X-Streamer-Key': sessionStorage.getItem('streamer_key'),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      batchId: 'batch-1234567890-abc',
      updates: [{ heroId: 'hero123', stats: { xp: 100, gold: 50 } }]
    })
  })
  ```
- [ ] **Verify**: Response: `{ duplicate: true }` (batch already processed)
- [ ] **Verify**: XP/gold NOT double-applied in database

### 6.4 Page Close/Refresh Flush
- [ ] Kill an enemy (gain XP/gold)
- [ ] Immediately close browser tab (before 60s sync)
- [ ] **Verify**: `sendBeacon` or `keepalive` fetch fires on page unload
- [ ] Check Firestore
- [ ] **Verify**: Changes saved despite immediate close

---

## Test Suite 7: Loot Drop Rates (Backend Alignment)

### 7.1 Trash/Elite Farming (No Epics/Legendaries)
- [ ] Farm trash mobs for 10 minutes (idle mode)
- [ ] **Verify**: NO epic or legendary drops
- [ ] **Verify**: Only common, uncommon, rare drops

### 7.2 Mythic Raid Legendary Rate
- [ ] Run mythic raid (or simulate 10 boss kills)
- [ ] **Verify**: ~1-2 legendary drops expected (15% rate)
- [ ] **Verify**: Drop rate matches backend DROP_RATES config

### 7.3 Drop Simulation Script Comparison
- [ ] Run frontend: `npx tsx scripts/simulate-drops.ts`
- [ ] Run backend: `node scripts/simulate-drops.js`
- [ ] **Verify**: Output tables are IDENTICAL
- [ ] **Verify**: Expected legendary drops per hour match

---

## Test Suite 8: TypeScript & Build Health

### 8.1 TypeScript Compilation
- [ ] Run: `npx tsc --noEmit`
- [ ] **Verify**: ~850 errors (down from ~1,257 before cleanup)
- [ ] **Verify**: No NEW errors introduced by integration changes
- [ ] **Verify**: Remaining errors are pre-existing (strictNullChecks violations)

### 8.2 Lint Status
- [ ] Run: `npm run lint`
- [ ] **Verify**: Warnings only, no ERRORS
- [ ] **Verify**: AnimatedSprite.tsx error pre-existing (conditional useEffect)
- [ ] **Verify**: No new lint errors from integration

### 8.3 Production Build
- [ ] Run: `npm run build`
- [ ] **Verify**: Build succeeds
- [ ] **Verify**: Main bundle ~428 KB (acceptable size)
- [ ] **Verify**: CleanBattlefieldSource chunk ~178 KB (lazy-loaded)

---

## Test Suite 9: Component Extraction (CleanBattlefieldSource)

### 9.1 Types Extracted
- [ ] Check `src/types/overlay.ts` exists
- [ ] **Verify**: Contains `OverlayHero`, `OverlayEnemy`, `CombatAction`, `SCTEntry`, `RareLootAnnouncement`
- [ ] Check `CleanBattlefieldSource.tsx` imports these types
- [ ] **Verify**: No behavior changes (overlay renders identically)

### 9.2 Future Extraction (Not Yet Done)
- [ ] Hooks to extract: combat loop, adventure loop, SCT state, sprite refs
- [ ] Components to extract: BossHealthBar, WaveAnnouncement, HeroOverlayUnit, EnemyOverlayUnit
- [ ] Utility functions: calculateGearScore, getDifficultyScaling
- [ ] **Note**: Deferred to follow-up PR (incremental extraction)

---

## Regression Testing

### 10.1 Core Gameplay (Sanity Check)
- [ ] Hero can attack enemies
- [ ] Hero gains XP on kill
- [ ] Hero levels up (1→2, 2→3)
- [ ] Loot drops appear in inventory
- [ ] Equipment can be equipped/unequipped
- [ ] Gold updates on loot sales

### 10.2 Overlay Rendering
- [ ] Hero sprites render correctly
- [ ] Enemy sprites render correctly
- [ ] HP bars update in real-time
- [ ] SCT (scrolling combat text) animates correctly
- [ ] Boss health bar appears for boss enemies

### 10.3 Portal UI
- [ ] All tabs load without errors (Inventory, Skills, Guild, etc.)
- [ ] StreamStatusBanner shows current stream
- [ ] GroupBoostIndicator shows chat activity
- [ ] Browser Source tab generates valid overlay URL

---

## Success Criteria

✅ **All test suites pass without critical failures**  
✅ **JWT authentication works end-to-end**  
✅ **Streamer keys validate correctly**  
✅ **Overlay sync uses batch endpoint with retry/idempotency**  
✅ **Chat boost uses smooth curve from backend**  
✅ **Rare drop announcements display correctly**  
✅ **Loot rates match backend simulation**  
✅ **Build, lint, and tsc pass (or show expected pre-existing errors)**  
✅ **No regressions in core gameplay or overlay rendering**

---

## Known Issues (Expected)

- ~850 TypeScript errors (pre-existing, mostly strictNullChecks violations)
- AnimatedSprite.tsx conditional useEffect error (pre-existing)
- Loot generation still uses old bonus system (needs refactor to use lootConfig DROP_RATES)
- Component extraction incomplete (types done, hooks/components deferred)

---

## Next Steps After Testing

1. Fix any critical failures found during manual testing
2. Complete component extraction from CleanBattlefieldSource (hooks → components)
3. Refactor lootGeneration.ts to USE lootConfig DROP_RATES (not just simulate)
4. Continue TypeScript cleanup (enable strictNullChecks by category)
5. Deploy to staging for user acceptance testing
