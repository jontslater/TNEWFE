# Backend API Calls Reference

This document lists all backend endpoints called by the frontend, organized by credential type.

**Last Updated**: After streamer key auth implementation

---

## Credential Types

1. **JWT (User Authentication)**: `Authorization: Bearer <token>`
   - Used for: Portal actions, user-specific operations
   - Sent by: `apiClient` instance
   - Token stored in: `localStorage.auth_token`

2. **Streamer Key (Overlay Authentication)**: `X-Streamer-Key: <overlayKey>`
   - Used for: Browser source/overlay operations
   - Sent by: `overlayClient` instance
   - Key stored in: `sessionStorage.streamer_key`

3. **Admin Key (Admin Operations)**: `X-Admin-Key: <adminKey>`
   - Used for: Admin/debug routes
   - Sent by: Manual header addition
   - Key from: Environment variable

---

## Auth API (Public - No Auth Required)

### POST `/api/auth/twitch`
- **Credential**: None (public login endpoint)
- **Purpose**: Initiate Twitch OAuth flow
- **Returns**: Redirect URL or JWT token

### POST `/api/auth/tiktok`
- **Credential**: None (public login endpoint)
- **Purpose**: Initiate TikTok OAuth flow
- **Returns**: Redirect URL or JWT token

---

## Hero API (JWT Required)

### GET `/api/heroes/user/:userId`
- **Credential**: JWT
- **Purpose**: Fetch user's heroes
- **File**: `src/api/client.ts` - `heroAPI.getHeroesByUserId()`

### GET `/api/heroes/:userId`
- **Credential**: JWT
- **Purpose**: Get single hero by user ID
- **File**: `src/api/client.ts` - `heroAPI.getHero()`

### POST `/api/heroes`
- **Credential**: JWT
- **Purpose**: Create new hero
- **File**: `src/api/client.ts` - `heroAPI.createHero()`

### PUT `/api/heroes/:userId`
- **Credential**: JWT
- **Purpose**: Update hero
- **File**: `src/api/client.ts` - `heroAPI.updateHero()`

### DELETE `/api/heroes/:heroId`
- **Credential**: JWT
- **Purpose**: Delete hero
- **File**: `src/api/client.ts` - `heroAPI.deleteHero()`

### POST `/api/heroes/:userId/pin`
- **Credential**: JWT
- **Purpose**: Pin hero as active
- **File**: `src/api/client.ts` - `heroAPI.pinHero()`

### GET `/api/heroes/create/cost-info`
- **Credential**: JWT
- **Purpose**: Get hero creation cost
- **File**: `src/api/client.ts` - `heroAPI.getHeroCreationCostInfo()`

### POST `/api/heroes/:userId/claim-idle-rewards`
- **Credential**: JWT
- **Purpose**: Claim idle token rewards
- **File**: `src/api/client.ts` - `heroAPI.claimIdleRewards()`

---

## Battlefield API (JWT or Streamer Key)

### POST `/api/battlefields/register`
- **Credential**: JWT (owner's token) OR Streamer Key
- **Purpose**: Register hero to battlefield
- **File**: `src/api/client.ts` - `battlefieldAPI.registerHero()`
- **Note**: Backend accepts either credential (owner can register, overlay can display)

### POST `/api/battlefields/unregister`
- **Credential**: JWT
- **Purpose**: Unregister hero from battlefield
- **File**: `src/api/client.ts` - `battlefieldAPI.unregisterHero()`

---

## Overlay API (Streamer Key Required)

### POST `/api/overlay/sync`
- **Credential**: Streamer Key (`X-Streamer-Key`)
- **Purpose**: Batch sync hero stats/equipment/inventory
- **File**: `src/api/client.ts` - `overlayAPI.syncBatch()`
- **Uses**: `overlayClient` instance

### GET `/api/chat/activity/:streamerId`
- **Credential**: Streamer Key OR JWT
- **Purpose**: Get chat activity for smooth boost curve
- **File**: `src/api/client.ts` - `overlayAPI.getChatActivity()`
- **Uses**: `overlayClient` instance

---

## Stream Settings API (JWT Required)

### GET `/api/stream/settings/:twitchId`
- **Credential**: JWT (streamer's own token)
- **Purpose**: Get stream settings (chat updates, overlay key)
- **File**: `src/api/client.ts` - `streamSettingsAPI.getSettings()`

### PUT `/api/stream/settings/:twitchId`
- **Credential**: JWT (streamer's own token)
- **Purpose**: Update stream settings
- **File**: `src/api/client.ts` - `streamSettingsAPI.updateSettings()`

### POST `/api/stream/settings/:twitchId/test`
- **Credential**: JWT (streamer's own token)
- **Purpose**: Send test chat update message
- **File**: `src/api/client.ts` - `streamSettingsAPI.testChatUpdate()`

### GET `/api/stream/settings/:twitchId/overlay-key`
- **Credential**: JWT (streamer's own token)
- **Purpose**: Get or generate overlay key
- **File**: `src/api/client.ts` - `streamSettingsAPI.getOverlayKey()`
- **Status**: ⚠️ Backend endpoint not yet implemented (Gap 1)

### POST `/api/stream/settings/:twitchId/overlay-key/regenerate`
- **Credential**: JWT (streamer's own token)
- **Purpose**: Regenerate overlay key
- **File**: `src/api/client.ts` - `streamSettingsAPI.regenerateOverlayKey()`
- **Status**: ⚠️ Backend endpoint not yet implemented (Gap 1)

---

## Guild API (JWT Required)

### GET `/api/guilds/:guildId`
- **Credential**: JWT
- **Purpose**: Get guild details
- **File**: `src/api/client.ts` - `guildAPI.getGuild()`

### POST `/api/guilds`
- **Credential**: JWT
- **Purpose**: Create new guild
- **File**: `src/api/client.ts` - `guildAPI.createGuild()`

### POST `/api/guilds/:guildId/join`
- **Credential**: JWT
- **Purpose**: Join guild
- **File**: `src/api/client.ts` - `guildAPI.joinGuild()`

### POST `/api/guilds/:guildId/leave`
- **Credential**: JWT
- **Purpose**: Leave guild
- **File**: `src/api/client.ts` - `guildAPI.leaveGuild()`

### POST `/api/guilds/:guildId/invite`
- **Credential**: JWT
- **Purpose**: Invite player to guild
- **File**: `src/api/client.ts` - `guildAPI.inviteToGuild()`

### POST `/api/guilds/:guildId/kick`
- **Credential**: JWT
- **Purpose**: Kick member from guild
- **File**: `src/api/client.ts` - `guildAPI.kickFromGuild()`

### POST `/api/guilds/:guildId/promote`
- **Credential**: JWT
- **Purpose**: Promote member to officer/leader
- **File**: `src/api/client.ts` - `guildAPI.promoteMember()`

### POST `/api/guilds/:guildId/demote`
- **Credential**: JWT
- **Purpose**: Demote officer to member
- **File**: `src/api/client.ts` - `guildAPI.demoteMember()`

### GET `/api/guilds/search`
- **Credential**: JWT
- **Purpose**: Search for guilds
- **File**: `src/api/client.ts` - `guildAPI.searchGuilds()`

### POST `/api/guilds/:guildId/message`
- **Credential**: JWT
- **Purpose**: Send guild chat message
- **File**: `src/api/client.ts` - `guildAPI.sendMessage()`

### POST `/api/guilds/:guildId/apply`
- **Credential**: JWT
- **Purpose**: Apply to join guild
- **File**: `src/api/client.ts` - `enhancedGuildAPI.applyToGuild()`

### POST `/api/guilds/:guildId/applications/:applicationId/accept`
- **Credential**: JWT
- **Purpose**: Accept guild application
- **File**: `src/api/client.ts` - `enhancedGuildAPI.acceptApplication()`

### POST `/api/guilds/:guildId/applications/:applicationId/reject`
- **Credential**: JWT
- **Purpose**: Reject guild application
- **File**: `src/api/client.ts` - `enhancedGuildAPI.rejectApplication()`

---

## Raid API (JWT Required)

### GET `/api/raids`
- **Credential**: JWT
- **Purpose**: Get available raids
- **File**: `src/api/client.ts` - `raidAPI.getRaids()`

### GET `/api/raids/:userId/available`
- **Credential**: JWT
- **Purpose**: Get raids available for user
- **File**: `src/api/client.ts` - `raidAPI.getAvailableRaids()`

### POST `/api/raids/:raidId/start`
- **Credential**: JWT
- **Purpose**: Start raid instance
- **File**: `src/api/client.ts` - `raidAPI.startRaid()`

### POST `/api/raids/:raidId/simulate`
- **Credential**: JWT
- **Purpose**: Simulate raid completion
- **File**: `src/api/client.ts` - `raidAPI.simulateRaid()`

### POST `/api/guild/:guildId/raids`
- **Credential**: JWT
- **Purpose**: Create guild raid
- **File**: `src/api/client.ts` - `raidAPI.createGuildRaid()`

### POST `/api/raids/guild/:raidId/cancel`
- **Credential**: JWT
- **Purpose**: Cancel guild raid
- **File**: `src/api/client.ts` - `raidAPI.cancelGuildRaid()`

---

## Quest API (JWT Required)

### GET `/api/quests/available/:userId`
- **Credential**: JWT
- **Purpose**: Get available quests for user
- **File**: `src/api/client.ts` - `questAPI.getAvailableQuests()`

### POST `/api/quests/:questId/accept`
- **Credential**: JWT
- **Purpose**: Accept quest
- **File**: `src/api/client.ts` - `questAPI.acceptQuest()`

### POST `/api/quests/:questId/complete`
- **Credential**: JWT
- **Purpose**: Complete quest
- **File**: `src/api/client.ts` - `questAPI.completeQuest()`

---

## Auction House API (JWT Required)

### GET `/api/auction/search`
- **Credential**: JWT
- **Purpose**: Search auction listings
- **File**: `src/api/client.ts` - `auctionHouseAPI.searchAuctions()`

### POST `/api/auction/list`
- **Credential**: JWT
- **Purpose**: List item for auction
- **File**: `src/api/client.ts` - `auctionHouseAPI.createListing()`

### POST `/api/auction/:auctionId/bid`
- **Credential**: JWT
- **Purpose**: Bid on auction
- **File**: `src/api/client.ts` - `auctionHouseAPI.placeBid()`

### POST `/api/auction/:auctionId/buyout`
- **Credential**: JWT
- **Purpose**: Buyout auction immediately
- **File**: `src/api/client.ts` - `auctionHouseAPI.buyoutAuction()`

### DELETE `/api/auction/:auctionId`
- **Credential**: JWT
- **Purpose**: Cancel auction listing
- **File**: `src/api/client.ts` - `auctionHouseAPI.cancelListing()`

### POST `/api/auction/:auctionId/claim`
- **Credential**: JWT
- **Purpose**: Claim sold/expired auction
- **File**: `src/api/client.ts` - `auctionHouseAPI.claimAuction()`

---

## Mail API (JWT Required)

### GET `/api/mail/:userId`
- **Credential**: JWT
- **Purpose**: Get user's mail
- **File**: `src/api/client.ts` - `mailAPI.getMail()`

### POST `/api/mail/send`
- **Credential**: JWT
- **Purpose**: Send mail message
- **File**: `src/api/client.ts` - `mailAPI.sendMail()`

### POST `/api/mail/:mailId/claim`
- **Credential**: JWT
- **Purpose**: Claim mail attachments
- **File**: `src/api/client.ts` - `mailAPI.claimAttachments()`

### DELETE `/api/mail/:mailId`
- **Credential**: JWT
- **Purpose**: Delete mail
- **File**: `src/api/client.ts` - `mailAPI.deleteMail()`

---

## Purchase API (JWT Required)

### POST `/api/purchases/create-checkout-session`
- **Credential**: JWT
- **Purpose**: Create Stripe checkout session
- **File**: `src/services/stripe.ts` - `createCheckoutSession()`

### GET `/api/purchases/status/:purchaseId`
- **Credential**: JWT
- **Purpose**: Get purchase status
- **File**: `src/pages/PurchaseSuccessPage.tsx`

### GET `/api/purchases/:purchaseId/details`
- **Credential**: JWT
- **Purpose**: Get purchase details
- **File**: `src/pages/PurchaseHistoryPage.tsx`

---

## Founders Pack API (JWT Required)

### GET `/api/founders/packs`
- **Credential**: JWT
- **Purpose**: Get available founder packs
- **File**: `src/api/client.ts` - `foundersPackAPI.getFoundersPacks()`

### POST `/api/founders/purchase`
- **Credential**: JWT
- **Purpose**: Purchase founders pack
- **File**: `src/api/client.ts` - `foundersPackAPI.purchaseFoundersPack()`

### GET `/api/founders/history/:userId`
- **Credential**: JWT
- **Purpose**: Get purchase history
- **File**: `src/api/client.ts` - `foundersPackAPI.getPurchaseHistory()`

---

## Shop API (JWT Required)

### POST `/api/purchases/gold-shop`
- **Credential**: JWT
- **Purpose**: Purchase item with gold
- **File**: `src/api/client.ts` - `shopAPI.purchaseGoldShopItem()`

### POST `/api/purchases/token-shop`
- **Credential**: JWT
- **Purpose**: Purchase item with tokens
- **File**: `src/api/client.ts` - `shopAPI.purchaseTokenShopItem()`

---

## Achievement API (JWT Required)

### GET `/api/achievements/:userId`
- **Credential**: JWT
- **Purpose**: Get user achievements
- **File**: `src/api/client.ts` - `achievementAPI.getAchievements()`

### POST `/api/achievements/update/:userId`
- **Credential**: JWT
- **Purpose**: Update achievement progress
- **File**: `src/api/client.ts` - `achievementAPI.updateAchievement()`

### POST `/api/achievements/:userId/set-title`
- **Credential**: JWT
- **Purpose**: Set active achievement title
- **File**: `src/api/client.ts` - `achievementAPI.setActiveTitle()`

---

## Known Backend Gaps

### Gap 1: Overlay Key Generation (Missing)
**Endpoints not yet implemented:**
- `GET /api/stream/settings/:twitchId/overlay-key`
- `POST /api/stream/settings/:twitchId/overlay-key/regenerate`

**Impact**: Frontend cannot generate browser source URLs with `?streamerKey=` until backend implements these endpoints.

**Frontend Status**: ✅ Ready (UI implemented, waiting for backend)

### Gap 2: Auth Middleware Coverage (Incomplete)
**Status**: Auth middleware only applied to ~9 of ~218 backend routes

**Impact**: Most mutation routes lack auth protection, allowing cross-user exploits.

**Required**: Apply `requireAuth` and ownership checks to all mutation routes (hero updates, guild ops, mail, auction, purchases).

---

## Security Notes

1. **Never send user JWT to overlay/browser source**
   - Browser sources run in OBS (untrusted environment)
   - Use `?streamerKey=` in URL, stored in `sessionStorage.streamer_key`
   - `overlayClient` sends `X-Streamer-Key` header

2. **JWT stored in localStorage**
   - Key: `auth_token`
   - Sent automatically by `apiClient` via interceptor
   - Cleared on 401/403 errors

3. **Streamer Key stored in sessionStorage**
   - Key: `streamer_key`
   - Sent automatically by `overlayClient` via interceptor
   - Falls back to JWT if no streamer key available

4. **Admin operations require separate key**
   - Not yet widely used in frontend
   - Would be injected via environment variable

---

## Frontend API Client Instances

### `apiClient` (JWT)
- **File**: `src/api/client.ts`
- **Auth**: Automatic `Authorization: Bearer` header
- **Redirects**: On 401/403 → clears token → redirects to home
- **Used by**: All portal/user-facing API calls

### `overlayClient` (Streamer Key)
- **File**: `src/api/client.ts`
- **Auth**: Automatic `X-Streamer-Key` header (fallback to JWT)
- **No redirects**: Browser source context, no navigation
- **Used by**: Overlay sync, chat activity calls
