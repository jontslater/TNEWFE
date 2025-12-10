# Final Execution Plan - Pre-Cleanup Push

**Date:** December 5, 2025 (Updated: January 2025)  
**Goal:** Complete all critical features before code/documentation cleanup  
**Critical Rule:** Verify each step - do not duplicate existing work

**📚 Key Reference Documents:**
- `MONETIZATION_GAP_ANALYSIS.md` - Detailed monetization opportunities, implementation plans, and balance considerations
- `SOCKETING_GEM_SYSTEM_DESIGN.md` - Complete socketing/gem system design, transferable sockets, profession balance
- `PLATINUM_TIER_AND_SOCKETING_SUMMARY.md` - Quick reference for Platinum tier features and socketing overview
- `DUNGEON_AND_RAID_CREATION_PLAN.md` - Dungeon and raid content creation plan

---

## 🎯 QUICK SUMMARY

**Total Phases:** 5  
**Total Steps:** 12  
**Estimated Time:** 3-4 weeks  
**Priority Order:** Monetization → Equipment → Combat → Token → Verification

### **Key Findings Before Starting:**
- ✅ DoT/HoT system EXISTS in `utils/combat/buffsDebuffs.ts` - may need connection
- ✅ Equipment upgrade APIs exist - UI partially implemented
- ✅ Reforge API exists - UI shows placeholder alerts
- ❌ Founders pack - No purchase system (badge images exist)
- ❌ Loot generation - Not implemented in browser source
- ❌ Token earning - Not implemented

### **Critical Reminder:**
**VERIFY FIRST, IMPLEMENT SECOND** - Many features are partially done. Check existing code before building new.

---

## 📋 VERIFICATION PROTOCOL

**Before starting ANY task:**
1. ✅ Check if feature already exists (code search)
2. ✅ Check if it's partially implemented (review code)
3. ✅ Check if it's just a placeholder (alerts, TODOs)
4. ✅ Verify backend API exists (if frontend needed)
5. ✅ Only implement what's truly missing

---

## 🎯 PHASE 1: MONETIZATION SETUP (Revenue Critical)

### **Step 1.1: Founders Pack Purchase Flow** ✅ COMPLETE
**Status:** ✅ Complete - Frontend and Backend API fully implemented (Stripe integration pending)

**Verification Results:**
- ✅ `FoundersPackPage.tsx` exists and is complete (lines 1-320)
- ✅ Route exists: `/founders-pack` in `App.tsx`
- ✅ Navigation link exists in `Navigation.tsx`
- ✅ Frontend API client exists: `foundersPackAPI.initiatePurchase()`
- ✅ **Backend API COMPLETE** - `src/routes/purchases.js` exists with all endpoints
- ✅ `POST /api/purchases/founders-pack` - Creates purchase record with pending status
- ✅ `POST /api/purchases/complete` - Completes purchase, grants benefits
- ✅ `GET /api/purchases/status/:purchaseId` - Gets purchase status
- ✅ Badge assignment - Sets `founderPackTier` and `founderPackTierLevel` on all user heroes
- ✅ Premium currency - Grants tokens to heroes
- ✅ Title assignment - Auto-unlocks "Founder" title

**Implementation Complete:**
1. ✅ `FoundersPackPage.tsx` component - All 4 tiers (Bronze $5, Silver $10, Gold $15, Platinum $25)
2. ✅ Backend routes - All purchase endpoints functional
3. ✅ Badge/tier assignment - Updates all user's heroes with founder pack benefits
4. ✅ Token granting - Premium currency added to hero accounts
5. ✅ Title unlock - Founder title automatically unlocked

**Remaining (Optional):**
- Stripe integration (user configuration needed)
- Payment processing flow (when Stripe keys configured)

**Estimated Time:** 2-3 days (without Stripe integration)  
**Dependencies:** Backend API for badge assignment  
**Skip if:** Purchase flow already exists

---

### **Step 1.2: Founders Pack Badge Display** ✅ COMPLETE
**Status:** ✅ Complete - Badge display fully implemented

**Verification Results:**
- ✅ AchievementsPanel displays badges - Badge selection UI with all 4 tiers (lines 133-265)
- ✅ Badge assignment works - `heroAPI.updateHeroById()` updates `founderBadge` field
- ✅ Badges show in browser source - Displayed next to hero name (lines 5577-5580, 6329-6332)
- ✅ Access control implemented - Tier-based access, admin override
- ✅ Badge images exist - `/Badges/FoundersBronze.png`, Silver, Gold, Platinum

**Tasks:**
1. Verify badge display in `AchievementsPanel.tsx`
   - Check if badge images are referenced
   - Verify badge selection UI works

2. Add badge display to hero profile:
   - Show badge next to hero name
   - Display in browser source (if applicable)

3. Create badge selection UI:
   - Allow users to choose which badge to display (if multiple)

**Estimated Time:** 1 day  
**Dependencies:** Badge assignment system (Step 1.1)  
**Skip if:** Badge display already works

---

### **Step 1.3: Payment Processing Setup (Stripe Placeholder)** ✅ COMPLETE
**Status:** ✅ Complete - Stripe placeholder structure created

**Verification Results:**
- ✅ `src/services/stripe.ts` created - Stripe service with placeholder implementation
- ✅ `src/components/StripeCheckout.tsx` created - Checkout component with placeholder UI
- ✅ Environment variable documented in README.md - `REACT_APP_STRIPE_PUBLISHABLE_KEY`
- ⚠️ Stripe SDK not installed - User needs to run `npm install @stripe/stripe-js` when ready

**Implementation:**
1. ✅ Stripe service file - Functions ready for uncommenting when keys are configured
2. ✅ Checkout component - Shows appropriate messages based on Stripe configuration
3. ✅ Environment documentation - Added to README.md
4. ✅ Integration points - Ready to connect to FoundersPackPage when Stripe is configured

**To Enable Stripe:**
1. Install SDK: `npm install @stripe/stripe-js`
2. Set environment variable: `REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...`
3. Uncomment code in `src/services/stripe.ts`
4. Update `FoundersPackPage.tsx` to use `StripeCheckout` component
5. Add backend webhook handler for Stripe payment confirmation

**Estimated Time:** 1 day  
**Dependencies:** None  
**Note:** This is just structure - actual Stripe setup is user's task

---

## 🎨 PHASE 1.3: FOUNDERS PACK COSMETICS (Required Features)

**Status:** ⚠️ Most features missing - must implement for pack promises

These features are promised in the founders pack tiers. See `FOUNDERS_PACK_FEATURE_AUDIT.md` for full breakdown.

---

### **Step 1.3.1: Name Colors**
**Status:** ✅ COMPLETE  
**Needed for:** All tiers (Bronze+)

**Tasks:**
1. ✅ Backend: Add `nameColor` field to Hero schema
2. ✅ Portal: Color picker UI (custom hex color) with Save button
3. ✅ Browser Source: Display custom color in name tags
4. ✅ Portal: Display custom color in name displays

**Estimated Time:** 2-3 days  
**Priority:** HIGH

---

### **Step 1.3.2: Name Frames**
**Status:** ✅ COMPLETE  
**Needed for:** Silver+ tiers

**Tasks:**
1. ✅ Design/create 4 frame variants (Bronze/Silver/Gold/Platinum) - CSS-based
2. ✅ Backend: Add `nameFrame` field to Hero schema
3. ✅ Browser Source: Render frame around name
4. ✅ Portal: Frame selection UI with live preview

**Estimated Time:** 3-4 days  
**Priority:** HIGH

---

### **Step 1.3.3: Aura Effects**
**Status:** ✅ COMPLETE  
**Needed for:** Gold+ tiers

**Tasks:**
1. ✅ Create aura particle effects (CSS-based with custom colors)
   - Bronze/Silver/Gold/Platinum auras
   - Custom color picker for auras
   - Holographic sparkle effect for Platinum
2. ✅ Backend: Add `auraEffect` field to Hero schema
3. ✅ Browser Source: Render aura around hero sprite (layered with shield/enrage)
4. ✅ Portal: Aura preview/selection UI with live preview

**Estimated Time:** 3-5 days  
**Priority:** HIGH

---

### **Step 1.3.4: Spell Effects**
**Status:** ✅ COMPLETE  
**Needed for:** All tiers (or higher tiers)

**Note:** Easier than gear-specific effects since sprites don't have targetable gear. Effects are visible during combat.

**Tasks:**
1. ✅ Create spell effect variants:
   - Projectile effects for ranged attacks (Bronze/Silver/Gold/Platinum)
   - Exhaust effects for tank crits (Gold/Platinum tiers)
   - Applied to all ranged heroes (mages, rangers, etc.)
2. ✅ Backend: Add `spellEffect` field to Hero schema
3. ✅ Browser Source: Apply effects to attacks/abilities
   - Projectile effects for ranged attacks
   - Exhaust effects on tank crits
   - Visual feedback during combat
4. ✅ Portal: Spell effect preview/selection UI with live preview

**Estimated Time:** 2-3 days  
**Priority:** HIGH (Easier than gear effects, more visible)

---

### **Step 1.3.4: Founder Statue** ✅ COMPLETE (Founders Hall)
**Status:** ✅ COMPLETE  
**Needed for:** Platinum tier only

**Implementation:**
- ✅ Created Founders Hall page (`FoundersHallPage.tsx`)
- ✅ Backend endpoint: `GET /api/purchases/founders` - Fetches all founders
- ✅ Displays all founders (all tiers) with tier highlighting
- ✅ Uses hero sprites styled as statues (grayscale filter)
- ✅ Shows founder name, tier badge, purchase date
- ✅ Sorted by tier (Platinum → Gold → Silver → Bronze) then by date

**Note:** Changed from battlefield statues to dedicated Founders Hall page to avoid battlefield clutter

**Estimated Time:** ✅ Complete (2-3 days)  
**Priority:** MEDIUM

---

### **Step 1.3.5: Chat Badge**
**Status:** ❌ Not Implemented  
**Needed for:** Platinum tier

**Tasks:**
1. Determine chat system (Twitch extension vs web chat)
2. Implement badge display in chosen system

**Estimated Time:** 1-2 days  
**Priority:** LOW

---

### **Step 1.3.6: Founder Title**
**Status:** ✅ COMPLETE  

**Tasks:**
1. ✅ Add "Founder" title display with tier-based coloring
2. ✅ Title selection UI in HeroDashboard
3. ✅ Display in browser source and portal

**Estimated Time:** 0.5 day  
**Priority:** HIGH

---

## 🔧 PHASE 2: EQUIPMENT MODIFICATIONS (Progression Critical)

### **Step 2.1: Equipment Upgrade UI**
**Status:** ✅ COMPLETE  

**Verification:**
- ✅ Upgrade UI fully implemented in InventoryManager
- ✅ Custom stat selection system (choose 2 of 4 random stats)
- ✅ Max upgrade level: +2 (each level allows 2 stat selections)
- ✅ Percentage-based upgrades (WoW-style: base + base × percent)
- ✅ Upgrades apply as percentage of hero's total accumulated stats
- ✅ Upgrade display shows selected stats and upgrade level (+1, +2)
- ✅ Backend API connected and working

**Implementation Details:**
- ✅ `UpgradeModal.tsx` component created
- ✅ Random stat options generation (4 stats, pick 2)
- ✅ Reroll functionality (free)
- ✅ Upgrade buttons in InventoryManager (equipped and inventory)
- ✅ Cost calculation based on rarity and level
- ✅ Upgrade stats stored in `item.upgradeStats` array
- ✅ Role-based stat scaling implemented
- ✅ Upgrades apply to hero's total stats (base + equipment), not item base stats

**Estimated Time:** 1-2 days  
**Status:** ✅ COMPLETE

---

### **Step 2.2: Equipment Reforge UI** ✅ COMPLETE
**Status:** ✅ Complete - Reforge modal and buttons added to InventoryManager

**Verification:**
- [ ] Check `StorePage.tsx` - reforge button shows alert
- [ ] Verify API `heroAPI.reforgeItem()` exists and works

**Current State Found:**
- `StorePage.tsx` line 342: `alert('Select a rare+ item from your inventory or equipment to reforge!')`
- API exists: `heroAPI.reforgeItem(userId, itemId)`

**Tasks:**
1. Create reforge modal:
   - Item selection (rare+ items only)
   - Show current stats
   - Show reforge cost (500g per StorePage)
   - Confirm button

2. Connect API:
   - Replace alert with modal
   - Connect to `heroAPI.reforgeItem()`
   - Show success/error feedback
   - Refresh item data after reforge

3. Add to InventoryManager:
   - Add "Reforge" button to rare+ items
   - Highlight reforgeable items

**Estimated Time:** 1 day  
**Skip if:** Reforge UI already exists

---

### **Step 2.3: Socketing & Gem System** ⚠️ IN PROGRESS
**Status:** ⚠️ Phase 1 & 2 Complete - Backend APIs and Frontend UI implemented, Browser Source integration in progress

**Verification:**
- [ ] Check if socketing backend API exists
- [ ] Check if gem insertion API exists
- [ ] Check `ProfessionsPage.tsx` - mentions socketing
- [ ] Check if mining profession has gem gathering

**Verification Results:**
- ✅ Checked `E:\IdleDnD-Backend\src\routes\professions.js` - No socketing endpoints
- ✅ Checked `E:\IdleDnD-Backend\src\services\commandHandler.js` - No `!socket` or `!gem` commands
- ✅ `ProfessionsPage.tsx` mentions socketing (lines 127-131) but it's just documentation
- ❌ **Backend API does NOT exist** - Socketing is mentioned but not implemented

**Current State:**
- Mining profession can create armor upgrades and weapon sharpening
- No socket creation system
- No gem insertion system
- No gem gathering/creation system

**Tasks (If Implemented):**
1. **Backend Required:**
   - Create socketing API: `POST /api/professions/:userId/socket` - Add socket to item
   - Create gem insertion API: `POST /api/professions/:userId/gem` - Insert gem into socket
   - Add gem gathering to mining profession (Ruby, Sapphire, Emerald, Diamond)
   - Add `sockets` array to Item schema
   - Add `gems` array to sockets

2. **Frontend (After Backend):**
   - Socket slot display on items (show empty sockets)
   - Gem selection modal (from inventory)
   - Socket creation UI (mining profession)

**Recommendation:**
- **Defer this feature** - Socketing is not critical for MVP
- Can be added later as enhancement
- Current mining upgrades system is functional alternative

**Estimated Time:** 3-5 days (full implementation from scratch)  
**Priority:** LOW (Nice-to-have, not critical)  
**Status:** ❌ Not implemented - Documented but backend missing

---

## 🎨 PHASE 1.3: FOUNDERS PACK COSMETICS (Required Features)

### **Step 1.3.1: Name Colors** ✅ COMPLETE
**Status:** ✅ COMPLETE  
**Needed for:** All tiers (Bronze+)

**Verification:**
- [ ] Check if name color system exists
- [ ] Check if hero name display supports custom colors

**Tasks:**
1. Add `nameColor` field to Hero schema (backend)
2. Create color picker UI in portal:
   - Allow founders to select custom hex color
   - Show color preview
   - Save to hero profile
3. Display custom color in browser source:
   - Apply color to hero name tags
   - Override default name color
4. Display custom color in web portal:
   - Apply to hero name displays
   - Show in leaderboards

**Estimated Time:** 2-3 days  
**Priority:** HIGH (All tiers require this)

---

### **Step 1.3.2: Name Frames** ✅ COMPLETE
**Status:** ✅ COMPLETE  
**Needed for:** Silver+ tiers

**Tasks:**
1. Design/create frame assets:
   - Bronze frame variant
   - Silver frame variant
   - Gold frame variant
   - Platinum frame variant
2. Add `nameFrame` field to Hero schema (backend)
3. Create frame rendering system:
   - Display frame around name in browser source
   - Display frame in web portal
   - Frame selection UI
4. Frame selection UI in portal:
   - Show available frames
   - Preview frame with name
   - Save selection

**Estimated Time:** 3-4 days  
**Priority:** HIGH (Silver+ tiers require this)

---

### **Step 1.3.3: Aura Effects** ✅ COMPLETE
**Status:** ✅ COMPLETE  
**Needed for:** Gold+ tiers

**Tasks:**
1. Design/create aura particle effects:
   - Gold aura variant (for Gold tier)
   - Purple aura variant (for Platinum tier)
   - Animated particle system (CSS/Canvas)
2. Add `auraEffect` field to Hero schema (backend)
3. Render aura in browser source:
   - Display aura around hero sprite
   - Animated particle effects
   - Performance optimized
4. Aura preview/selection UI in portal:
   - Show aura preview
   - Enable/disable aura
   - Save selection

**Estimated Time:** 3-5 days  
**Priority:** HIGH (Gold+ tiers require this)

---

### **Step 1.3.4: Founder Statue**
**Status:** ❌ Not Implemented  
**Needed for:** Platinum tier only

**Tasks:**
1. Design/create statue sprite:
   - Statue design matching game aesthetic
   - Plinth/base sprite
   - Text rendering for founder name
2. Add statue placement system (backend):
   - Track statue location on battlefield
   - Store founder name/date
3. Render statue in browser source:
   - Display on battlefield
   - Show founder name
   - Placed in visible location
4. Optional: Statue customization UI:
   - Choose placement location
   - Custom message/inscription

**Estimated Time:** 2-3 days  
**Priority:** MEDIUM (Platinum tier only)

---

### **Step 1.3.5: Chat Badge**
**Status:** ❌ Not Implemented  
**Needed for:** Platinum tier

**Tasks:**
1. Determine chat system:
   - Check if Twitch extension exists
   - Check if web chat exists
   - Determine badge display method
2. Implement badge display:
   - Display badge in chat messages
   - Or display in web chat UI
   - Badge icon next to username

**Estimated Time:** 1-2 days  
**Priority:** LOW (Platinum tier only, depends on chat system)

---

### **Step 1.3.6: Badge Display Enhancement**
**Status:** ⚠️ Partial (Images exist, display needs work)

**Tasks:**
1. Display badge in browser source:
   - Show badge icon next to hero name
   - Small badge icon above nameplate
2. Display badge in achievements panel:
   - Show founder badge in badge section
   - Badge selection UI
3. Display badge in portal:
   - Show badge in hero profile
   - Badge next to name in portal

**Estimated Time:** 1 day  
**Priority:** HIGH (All tiers require this)

---

### **Step 1.3.7: Founder Title**
**Status:** ⚠️ Partial (Title system exists, need to add "Founder" title)

**Tasks:**
1. Add "Founder" title to achievements system:
   - Create founder title achievement
   - Auto-unlock on purchase
2. Display in title selection:
   - Show in AchievementsPanel
   - Allow selection/equip
3. Auto-assign on purchase:
   - Backend: Auto-unlock title
   - Set as active title if none selected

**Estimated Time:** 0.5 day  
**Priority:** HIGH (All tiers require this)

---

## ⚔️ PHASE 3: COMBAT DEPTH (Browser Source)

### **Step 3.1: Verify DoT/HoT System Status** ✅ VERIFIED
**Status:** ✅ Complete - DoT system is implemented in combat loop, HoT handled via HP regen

**VERIFICATION COMPLETE:**
- ✅ **FOUND:** `utils/combat/buffsDebuffs.ts` - Full DoT/HoT system exists
- ✅ **FOUND:** `AnimationTestPage.tsx` has DoT/HoT tick logic
- ❓ **UNKNOWN:** Is it connected to `CleanBattlefieldSource.tsx`?

**Current State Found:**
- DoT system exists: `processDebuffs()` function handles DoT ticks
- HoT system exists: Healing over time processing exists
- `COMBAT_SYSTEM_AUDIT.md` confirms implementation
- `BROWSER_SOURCE_CURRENT_STATUS.md` says missing - suggests not connected

**Tasks:**
1. **VERIFY FIRST:**
   - Check if `CleanBattlefieldSource.tsx` imports `utils/combat/buffsDebuffs.ts`
   - Test in browser - do DoTs actually work in production?
   - Check combat loop - is `processDebuffs()` called?

2. **If NOT connected (most likely):**
   - Import `processDebuffs` into CleanBattlefieldSource
   - Add DoT/HoT tick system to combat loop (every 2s)
   - Verify SCT display works for DoT/HoT
   - Test with actual debuffs/buffs

3. **If already connected:**
   - Mark as complete
   - Update documentation
   - Move to next step

**Estimated Time:** 0.5-1 day (verification), 1-2 days (if connecting needed)  
**Priority:** HIGH - Combat depth critical

---

### **Step 3.2: Verify Debuff System Status** ✅ VERIFIED
**Status:** ✅ Complete - Debuffs (Stunned, Weakened, Cursed) are implemented and working

**Verification:**
- [ ] Check if `debuffSystem.ts` is used in CleanBattlefieldSource
- [ ] Test if debuffs (Stunned, Weakened, Cursed) actually work
- [ ] Check if debuff application happens

**Current State Found:**
- `debuffSystem.ts` exists in utils
- `BROWSER_SOURCE_CURRENT_STATUS.md` says debuffs missing
- Need to verify if connected

**Tasks:**
1. **Same as Step 3.1:**
   - Verify what's actually working
   - Connect or implement as needed

**Estimated Time:** 1-2 days  
**Priority:** HIGH

---

### **Step 3.3: Loot Generation System** ✅ VERIFIED
**Status:** ✅ Complete - Loot generation, auto-equip, and auto-sell fully implemented

**Verification:**
- [ ] Check if loot drops from enemy defeats
- [ ] Check if auto-equip logic exists
- [ ] Check if auto-sell logic exists

**Tasks:**
1. Create loot generation function:
   - Generate loot on enemy defeat
   - Rarity based on difficulty/wave
   - Class-appropriate items

2. Implement auto-equip:
   - Compare new item to current
   - Equip if better
   - Move old item to inventory

3. Implement auto-sell:
   - Sell replaced gear for gold
   - Or gift to same-class heroes

4. Add loot SCT:
   - Show rarity and slot
   - Display above hero sprite

**Estimated Time:** 2-3 days  
**Priority:** HIGH - Progression feedback critical

---

## 💎 PHASE 4: TOKEN SYSTEM

### **Step 4.1: Token Earning System** ✅ VERIFIED
**Status:** ✅ Complete - Tokens earned from achievements and quest rewards (no passive earning system)

**Verification:**
- [ ] Check if tokens accumulate passively
- [ ] Check if `!claim` command exists
- [ ] Check backend for token earning logic

**Tasks:**
1. **Verify backend:**
   - Check if token earning API exists
   - Check if `lastTokenClaim` tracking exists
   - If backend ready, connect frontend

2. **If backend exists:**
   - Add token display to hero dashboard
   - Add pending tokens display
   - Add "Claim Tokens" button
   - Connect to `!claim` command handler

3. **If backend missing:**
   - Document requirements
   - Create placeholder UI

**Estimated Time:** 1-2 days (if backend exists)  
**Priority:** MEDIUM

---

## 📊 PHASE 5: VIEWER BUFF VERIFICATION

### **Step 5.1: Verify Viewer Buff System** ✅ COMPLETE
**Status:** ✅ Complete - Viewer bonuses calculated and loot bonus now applied to loot generation

**Verification:**
- [ ] Test if 1-hour rolling window works correctly
- [ ] Check if loot quality bonus is applied
- [ ] Verify viewer count tracking

**Current State Found:**
- `CleanBattlefieldSource.tsx` has `calculateViewerBonuses()`
- Active chatter count tracked via WebSocket
- Missing loot quality bonus per audit

**Tasks:**
1. **Test and verify:**
   - Test viewer buff calculations
   - Verify 1-hour window (may be backend)
   - Check if bonuses actually apply

2. **Add missing loot bonus:**
   - Add loot quality bonus calculation
   - Apply to loot generation

3. **Improve display:**
   - Make viewer bonuses more visible
   - Show active chatter count prominently

**Estimated Time:** 0.5-1 day  
**Priority:** LOW (system mostly works)

---

## ✅ EXECUTION CHECKLIST

### **Before Starting:**
- [ ] Read this entire plan
- [ ] Understand verification protocol
- [ ] Set up development environment
- [ ] Have backend API documentation ready

### **For Each Step:**
- [ ] **VERIFY FIRST** - Check if already done
- [ ] **CHECK PARTIAL** - See what exists
- [ ] **IMPLEMENT GAPS** - Only what's missing
- [ ] **TEST** - Verify it works
- [ ] **DOCUMENT** - Update status

### **Daily Progress:**
- [ ] Check off completed steps
- [ ] Update "Status" column
- [ ] Note any blockers
- [ ] Update time estimates

---

## 📅 RECOMMENDED TIMELINE

### **Week 1: Monetization Setup**
- Day 1-2: Founders Pack Purchase Flow (Step 1.1)
- Day 3: Badge Display (Step 1.2)
- Day 4: Stripe Placeholder (Step 1.3)
- Day 5: Testing & Polish

### **Week 2: Equipment Modifications**
- Day 1-2: Upgrade UI (Step 2.1)
- Day 3: Reforge UI (Step 2.2)
- Day 4-5: Socketing Investigation (Step 2.3)

### **Week 3: Combat Depth**
- Day 1-2: DoT/HoT Verification & Connection (Step 3.1)
- Day 3: Debuff Verification (Step 3.2)
- Day 4-5: Loot System (Step 3.3)

### **Week 4: Polish & Token System**
- Day 1-2: Token Earning (Step 4.1)
- Day 3: Viewer Buff Verification (Step 5.1)
- Day 4-5: Testing, Bug Fixes, Documentation

---

## 🚨 CRITICAL REMINDERS

1. **DO NOT DUPLICATE WORK** - Verify first!
2. **CHECK EXISTING CODE** - Many features partially exist
3. **BACKEND FIRST** - Verify APIs before frontend
4. **TEST AS YOU GO** - Don't leave bugs for cleanup
5. **DOCUMENT CHANGES** - Note what was found vs. implemented

---

## ⚔️ COMBAT BALANCE FIXES (Additional Work)

### **Combat Balance Improvements**
**Status:** ✅ COMPLETE  
**Date:** December 2025

**Issues Fixed:**
1. ✅ **Minimum Damage Cap Reduction**
   - **Before:** All heroes took minimum 25% of base damage (even with high defense)
   - **After:** Tanks take 10% minimum, others take 15% minimum
   - **Impact:** High-defense tanks (120k+ HP) now take significantly less damage

2. ✅ **Improved Threat System for Low-HP Tanks**
   - **Before:** Tanks had 20x base threat regardless of HP
   - **After:** Tanks below 50% HP get 5x additional threat multiplier (100x total vs 20x)
   - **Impact:** Enemies prioritize attacking tanks when they're below 50% HP (protecting them from focus fire)

3. ✅ **Better Defense Scaling for Tanks**
   - **Before:** All heroes use same defense formula (1/250 divisor)
   - **After:** Tanks use 1/200 divisor (others still use 1/250)
   - **Impact:** Tanks reach 50% damage reduction at 200 defense (vs 250 for others), making defense more effective

**Files Modified:**
- `src/pages/CleanBattlefieldSource.tsx`:
  - Updated minimum damage calculation
  - Enhanced `getThreatWeight()` function
  - Improved defense scaling for tanks

**Result:** Tanks are now significantly more survivable, especially at higher difficulty levels (120%+).

---

## 📝 NOTES SECTION

**Use this space to track:**
- Features found that were already implemented
- Blockers encountered
- Time adjustments
- Additional tasks discovered

**Recent Completions:**
- ✅ Phase 1.3 Cosmetics (Name Colors, Frames, Auras, Spell Effects, Founder Title)
- ✅ Phase 2.1 Equipment Upgrade UI (Custom stat selection system)
- ✅ Combat Balance Fixes (Tank survivability improvements)
- ✅ Store Page Token Purchases - Hero Selection (Fixed "hero not found" error)
- ✅ Queue Code Modal - Removed Auto-Popup (Now only shows at bottom)
- ✅ Queue Code Generation - Randomized 4-letter codes (uppercase letters)
- ✅ Unified Browser Source Legacy - Removed from browser source tab
- ✅ Expand Storage - Moved to Inventory Page (15 slots option, 750g)
- ✅ Founder Badge Restrictions - Access control implemented (needs troubleshooting)

---

## 🔧 PHASE 6: CRITICAL FIXES & POLISH (December 6, 2025)

### **Step 6.1: Achievement Seeding Issue** ✅ VERIFIED
**Status:** ✅ Complete - Achievements are code-based, not seeded

**Investigation Results:**
- ✅ Achievements are defined in `E:\IdleDnD-Backend\src\data\achievements.js` (44 achievements with pop culture references)
- ✅ Updated all achievement titles to match pop culture/gaming/internet culture theme
- ✅ Removed "Genocide" achievement as requested
- ✅ Backend endpoint `GET /api/achievements` returns achievements array directly from code
- ✅ No seeding to Firebase needed - achievements are returned from backend code
- ✅ Frontend calls `achievementAPI.getAllAchievements()` correctly in AchievementsPanel

**Solution:**
- Achievements are NOT seeded to a database - they're returned from backend code
- If achievements not showing, check:
  1. Backend server is running
  2. API endpoint is accessible (test with `GET /api/achievements`)
  3. Browser console for API errors
  4. Network tab to verify API calls succeed

**Verification Script Created:**
- `E:\IdleDnD-Backend\scripts\verify-achievements.js` - Test script to verify achievements data

**If achievements still not showing:**
- Check backend logs for errors
- Verify CORS settings allow frontend to call API
- Test API endpoint directly: `curl http://localhost:3001/api/achievements`

**Estimated Time:** 0.5-1 day (investigation complete)  
**Priority:** HIGH  
**Status:** ✅ Verified - No seeding needed, achievements return from code

---

### **Step 6.2: Founder Access Control Bug** ✅ FIXED
**Status:** ✅ Complete - Fixed strict access control for founder features

**Problem:**
- User "tehchno" can access founder badges/features
- Admin check might be too broad or missing proper validation
- Need to verify admin checks and founder pack purchase tracking

**Investigation Tasks:**
1. Check where admin access is granted (currently `user?.twitchUsername?.toLowerCase() === 'theneverendingwar'`)
2. Verify if "tehchno" is somehow matching admin check
3. Check if `founderPackTier` field is being set incorrectly
4. Verify founder badge access logic in `AchievementsPanel.tsx`
5. Check if admin override is too permissive
6. Verify backend purchase tracking system

**Files to Check/Modify:**
- `E:\IdleDnD-Web\src\components\AchievementsPanel.tsx` (line 27 - admin check)
- All components that check `isAdmin` flag
- Backend purchase/assignment logic
- Hero schema - verify `founderPackTier` field tracking

**Debug Steps:**
1. Log user object when checking admin status
2. Verify `user.twitchUsername` value for "tehchno"
3. Check if `hero.founderPackTier` is set incorrectly
4. Verify badge access logic respects purchase status
5. Remove or restrict admin override for founder features

**Fix Requirements:**
- Admin check should ONLY be for 'theneverendingwar' (exact match, case-insensitive)
- Founder features should ONLY be accessible if `hero.founderPackTier` is set AND matches tier
- Remove admin override from founder badge selection (or make it explicit test-only mode)

**Estimated Time:** 1-2 hours  
**Priority:** CRITICAL (Security/Revenue Issue)

---

### **Step 6.3: Dungeon System Build-Out** ✅ COMPLETE
**Status:** ✅ Complete - Basic dungeon system functional

**Goal:** Copy idle adventure mechanics and add dungeon monsters array

**What's Done:**
1. ✅ Created `dungeonEnemyGeneration.ts` utility - Maps dungeon enemy types to templates
2. ✅ Added dungeon setup useEffect - Fetches heroes and generates room enemies (similar to raid)
3. ✅ Added dungeon mode rendering - Reuses combat display with dungeon header
4. ✅ Integrated with existing combat loop - Uses same combat engine as idle adventure
5. ✅ Added room progression logic - Advances to next room when enemies cleared
6. ✅ Added dungeon completion - Marks dungeon complete when final room cleared
7. ✅ Fixed hero/enemy positioning - Now uses same `getHeroPosition()`/`getEnemyPosition()` as idle mode (bottom placement)
8. ✅ Fixed dungeon enemy sprite mapping - Added `enemyType` field to map numbered enemies (e.g., "Skeleton 1", "Skeleton 2") to correct sprite animations ("Skeleton Mage")
9. ✅ Removed bottom status panel - Removed "In Combat / Room X/5" status panel from dungeon mode
10. ✅ Adjusted hero/enemy vertical position - Moved all heroes and enemies down ~35px (~1/3 inch) in idle, dungeon, and raid modes
11. ✅ Fixed queue status overlay position - Moved to bottom-right corner of browser source
12. ✅ Fixed enemy overflow issue - Increased right margin buffer (100px → 150px) and reduced max spacing (250px → 200px) to prevent enemies from bleeding off screen edge

**What's Remaining (Optional Enhancements):**
1. ⚠️ Loot distribution - Grant dungeon rewards on completion (basic XP/gold already works)
2. ⚠️ Room transition animations - Smooth transitions between rooms (fade works)
3. ⚠️ Backend integration - Verify dungeon instance data includes room definitions

**Files Created/Modified:**
- ✅ `E:\IdleDnD-Web\src\utils\dungeonEnemyGeneration.ts` - NEW (dungeon enemy generation)
- ✅ `E:\IdleDnD-Web\src\pages\CleanBattlefieldSource.tsx` - Added dungeon setup, rendering, and room progression

**Implementation Details:**
- Dungeon mode reuses idle adventure combat mechanics
- Room progression updates Firebase `currentRoom` field
- Dungeon completion marks instance status as 'completed'
- Enemies generated from dungeon room definitions in instance data
- Enemy sprite mapping: Display names (e.g., "Skeleton 1") separate from sprite types (e.g., "Skeleton Mage") via `enemyType` field
- Queue status displays in bottom-right corner when hero is queued for dungeon/raid
- All positioning unified: Heroes and enemies use same positioning functions across idle/dungeon/raid modes

**Next Steps (Optional):**
1. Test with real dungeon instances from backend
2. Verify dungeon instance data includes `rooms` array with enemy definitions
3. Add dungeon-specific reward distribution on completion

**Estimated Time:** ✅ Complete (enhancements optional)  
**Priority:** MEDIUM  
**Status:** ✅ Basic dungeon system functional

---

---

## 🔧 PHASE 7: BUG FIXES & IMPROVEMENTS (December 6, 2025)

### **Step 7.1: Reforge Item Endpoint** ✅ FIXED
**Status:** ✅ Fixed - Changed to use hero.id instead of userId, added fallback lookup

**Problem:**
- `POST /api/heroes/:userId/reforge-item` returns 404
- Frontend calls `heroAPI.reforgeItem(userId, itemId)` but endpoint doesn't exist

**Fix Needed:**
- Check backend route for reforge-item endpoint
- Add endpoint if missing or fix route path

---

### **Step 7.2: Token Purchase Error** ✅ FIXED
**Status:** ✅ Fixed - Added validation for rarityData and added missing rarities (uncommon, artifact)

**Problem:**
- `POST /api/heroes/:userId/purchase/tokens` returns 500
- Error: `Cannot read properties of undefined (reading 'color')` at line 597 in heroes.js
- Missing property access on undefined object

**Fix Needed:**
- Fix line 597 in `E:\IdleDnD-Backend\src\routes\heroes.js`
- Add null/undefined checks for color property access

---

### **Step 7.3: Remove Achievements from Toolbar** ✅ COMPLETE
**Status:** ✅ Complete - Removed achievements link from Navigation.tsx

**Note:** User confirmed it's already removed from toolbar in the image provided.

---

### **Step 7.4: Gold Shop Items to Inventory** ✅ COMPLETE
**Status:** ✅ Complete - Gold shop items now go to inventory with hero selection and quantity support

**Requirements:**
- Allow hero selection when purchasing from gold shop
- Allow purchasing multiple quantities
- Items should appear in selected hero's inventory
- Not just equipped, but added to inventory array

**Tasks:**
1. Add hero selection modal to gold shop purchases
2. Add quantity selector for gold shop items
3. Update backend to add items to hero.inventory array instead of auto-equipping
4. Update frontend to show inventory count and allow multiple purchases

---

### **Step 7.5: Leaderboards User Rankings** ✅ FIXED
**Status:** ✅ Fixed - Added userId parameter validation in leaderboards route

**Problem:**
- `GET /api/leaderboards/user/:heroId` returns 400 Bad Request
- Error in LeaderboardsPage when calling `getUserRankings()`

**Fix Needed:**
- Check backend leaderboards route for user endpoint
- Verify heroId parameter validation
- Fix 400 error response

### **Step 7.6: Show Applied Upgrades in Apply Modal** ✅ COMPLETE
**Status:** ✅ Complete - Apply modal now displays existing upgrades/enchantments on equipment

---

### **Step 7.7: Store Purchases to Inventory** ✅ COMPLETE
**Status:** ✅ Complete - All store purchases now add items to hero inventory

**Implementation:**
- ✅ **Token Shop**: Items added to inventory array (already working)
- ✅ **Gold Shop**: Items added to inventory array (updated in Step 7.4)
- ✅ **Quantity Support**: Both shops now support purchasing multiple quantities (1-100)
- ✅ **Hero Selection**: Both shops allow selecting which hero receives items
- ✅ **Inventory Display**: Items appear in hero's inventory immediately after purchase

---

### **Step 7.8: Mythic Rarity Implementation** ✅ COMPLETE
**Status:** ✅ Complete - Mythic rarity available in token shop and raid/dungeon loot

**Implementation:**
- ✅ **Token Shop Mythic**: Available for purchase (10,000 tokens) with 3.5x stat multiplier
- ✅ **Raid/Dungeon Mythic**: Drops from raids/dungeons with 4.0x stat multiplier (stronger than token shop)
- ✅ **Rarity Balance**: Token shop mythic is slightly weaker to incentivize raid/dungeon participation
- ✅ **Drop Rate**: Mythic has 0.1% base drop chance, increased with boss/wave/viewer bonuses

**Implementation:**
- Added display of `appliedUpgrades` array in apply modal
- Shows upgrade names (e.g., "Steel Reinforcement") from recipe lookup
- Displays with orange indicator (⚙️) for visual clarity
- Helps users see which slots already have upgrades before applying new ones

---

## 🚨 URGENT FIXES

### **Fix: Raids Page Using Hardcoded Data Instead of Backend** ✅ COMPLETE
**Status:** ✅ Complete - Backend route now returns raids from data file

**Problem:**
- Raids page was showing hardcoded/mock raids instead of pulling from backend
- `/api/raids` endpoint was querying Firestore `raids` collection, but raids are static data in `raids.js`
- Users couldn't sign up for raids because the raid IDs didn't match between frontend and backend
- Backend was returning only 3 manually-created raids from Firestore instead of all 13 raids from `raids.js`

**Fix:**
- Updated `E:\IdleDnD-Backend\src\routes\raids.js` GET `/` route to return raids from `../data/raids.js` instead of querying Firestore
- Maps raid difficulty to type (normal→daily, heroic→weekly, mythic→monthly) for filtering
- Returns all raid metadata needed for frontend display and signup
- Added console logging to debug raid loading
- Frontend now only shows raids that are actually available from backend (no hardcoded data)

**Files Modified:**
- `E:\IdleDnD-Backend\src\routes\raids.js` - GET `/api/raids` route

**Note:** Backend server must be restarted for changes to take effect. The route now returns all 13 raids from `raids.js` (corrupted_temple, bandit_stronghold, haunted_crypt, dragons_lair, demon_fortress, titans_keep, shadowlands, elemental_plane, void_citadel, celestial_sanctum, elder_dragon_normal, elder_dragon_heroic, elder_dragon_mythic).

---

### **Fix: WebSocket Random Disconnections** ✅ COMPLETE
**Status:** ✅ Complete - Improved ping/pong handling and error logging

**Problem:**
- WebSocket clients were randomly disconnecting and reconnecting
- Logs showed frequent connect/disconnect cycles
- Potential issues with ping/pong keepalive mechanism

**Fix:**
- **Frontend (`useWebSocket.ts`):**
  - Added explicit handling for JSON ping/pong messages (fallback for browsers)
  - Improved error logging on disconnect (now logs close code and reason)
  - Added check to avoid reconnecting on clean closes (code 1000, 1001)
  - Better handling of binary ping frames
  
- **Backend (`rooms.js`):**
  - Enhanced ping/pong message handling in `handleMessage`
  - Mark connection as alive when receiving pong responses
  - Improved disconnect logging (now logs close code and reason)
  - Better error tracking for debugging

**Files Modified:**
- `E:\IdleDnD-Web\src\hooks\useWebSocket.ts` - Added ping/pong handling and better error logging
- `E:\IdleDnD-Backend\src\websocket\rooms.js` - Enhanced message handling and logging

**Note:** Browser WebSockets should automatically handle native ping/pong frames, but this adds explicit JSON-based ping/pong as a fallback and improves debugging. The enhanced logging will help identify if disconnects are due to network issues, timeouts, or other causes.

**Note on "Room is now empty" log:** This log message is purely informational - it appears when all WebSocket clients for a Twitch ID disconnect. It does NOT cause disconnections. It's just logging that the room is now empty (all clients disconnected). The disconnect happens first, then the room cleanup logs this message.

---

### **Fix: Round All Damage and Healing Values** ✅ COMPLETE
**Status:** ✅ Complete - All damage/healing calculations now use Math.round()

**Problem:**
- Damage and healing values were showing decimal values like 3000.0000004
- Floating point precision errors causing display issues

**Fix:**
- Changed all `Math.floor()` to `Math.round()` for damage/healing calculations
- Added `Math.round()` to all HP/shield values when stored
- Applied rounding to: damage calculations, healing amounts, HP updates, shield updates, DoT damage, overheal calculations
- All SCT displays now show rounded values

**Files Modified:**
- `E:\IdleDnD-Web\src\pages\CleanBattlefieldSource.tsx` - Added rounding throughout combat system

---

### **Fix: Healer Resurrection Ability** ✅ COMPLETE
**Status:** ✅ Complete - Healers now use resurrection when no one needs healing

**Problem:**
- Healers were not using resurrection ability on dead heroes
- Only auto-resurrection after 60 seconds existed, no healer-based resurrection

**Fix:**
- Added resurrection logic for healers: when no injured allies need healing, healers target dead heroes
- Created `executeResurrect()` function to handle resurrection action
- Resurrects heroes with 50% max HP
- Clears debuffs and shield on resurrection
- Shows "✨ RESURRECTED" SCT message
- Added resurrection action type to combat action system

**Files Modified:**
- `E:\IdleDnD-Web\src\pages\CleanBattlefieldSource.tsx` - Added resurrection targeting and execution

---

**This is the LAST PUSH before cleanup - make it count!** 🚀

---

## 💰 PHASE 8: NEW MONETIZATION OPPORTUNITIES (January 2025)

**Goal:** Implement additional monetization features identified in MONETIZATION_GAP_ANALYSIS.md

**📋 Reference Document:** See `MONETIZATION_GAP_ANALYSIS.md` for detailed analysis, implementation details, and balance considerations.

---

### **Step 8.1: Founder Pack Earning Boosts** ⭐⭐⭐ HIGH PRIORITY
**Status:** ✅ PARTIALLY COMPLETE (Gold bonuses implemented, token bonuses pending)  
**Priority:** HIGH - Adds ongoing value to founder pack purchase

**Goal:** Add ongoing gold/token earning rate multipliers based on founder pack tier

**📋 Reference:** See `MONETIZATION_GAP_ANALYSIS.md` - Priority 1 section for detailed implementation code and balance considerations

**Implementation:**
1. **Backend:**
   - ✅ Add founder tier multipliers to gold calculation (in browser source combat)
   - ⚠️ Add founder tier bonuses to token earning rates (pending - token earning system not yet implemented)
   - ✅ Update combat system to check `hero.founderPackTier`

2. **Boost Tiers:**
   - Bronze Founder ($5): +10% gold, +0.5 tokens/hour
   - Silver Founder ($10): +20% gold, +1.0 tokens/hour
   - Gold Founder ($15): +30% gold, +1.5 tokens/hour
   - Platinum Founder ($25): +50% gold, +2.0 tokens/hour

3. **Frontend:**
   - ✅ Display boost info in hero dashboard
   - ✅ Gold bonuses applied in combat (browser source)
   - ⚠️ Token earning bonuses (pending implementation of token earning system)

**Files Modified:**
- ✅ `E:\IdleDnD-Web\src\pages\CleanBattlefieldSource.tsx` - Added founder gold multipliers to combat victory rewards
- ✅ `E:\IdleDnD-Web\src\components\HeroDashboard.tsx` - Display founder pack benefits in UI
- ✅ `E:\IdleDnD-Web\src\pages\CleanBattlefieldSource.tsx` - Added `founderPackTier` to Hero interface

**What's Done:**
- ✅ Gold earning from enemy kills: `enemy.xp / 10` base rate
- ✅ Founder pack gold multipliers applied: Bronze +10%, Silver +20%, Gold +30%, Platinum +50%
- ✅ Gold SCT display shows earned gold (with bonus if founder)
- ✅ HeroDashboard displays founder pack benefits
- ✅ Token earning bonuses implemented in `!claim` command:
  - Base rate: 2.5 tokens/hour
  - Bronze Founder: +0.5 tokens/hour (3.0 total)
  - Silver Founder: +1.0 tokens/hour (3.5 total)
  - Gold Founder: +1.5 tokens/hour (4.0 total)
  - Platinum Founder: +2.0 tokens/hour (4.5 total)
- ✅ Claim message shows founder tier bonus rate
- ✅ Max claim cap scales with boosted rate (24 hours worth)

**What's Remaining:**
- ✅ All features complete!

**Estimated Time:** ✅ Gold bonuses complete (1 day), Token bonuses pending token system implementation  
**Revenue Potential:** HIGH - Increases founder pack value proposition

---

### **Step 8.2: Hero Slot Expansion** ⭐⭐⭐ HIGH PRIORITY
**Status:** ✅ COMPLETE  
**Priority:** HIGH - High player value, natural progression

**Goal:** Allow players to unlock additional hero slots with tokens

**📋 Reference:** See `MONETIZATION_GAP_ANALYSIS.md` - Priority 2 section for implementation details and unlock costs

**Implementation:**
1. **Backend:**
   - ✅ Created `getUserSlotsUnlocked()` helper function (stores in `users` collection)
   - ✅ Updated hero creation to check `slotsUnlocked` instead of hard limit
   - ✅ Created unlock endpoint: `POST /api/heroes/:userId/unlock-slot`
   - ✅ Created slot info endpoint: `GET /api/heroes/:userId/slots`
   - ✅ Changed free tier from 10 to 3 heroes (DEFAULT_SLOTS_UNLOCKED = 3)

2. **Unlock Costs:**
   - Slot 4-6: 500 tokens each
   - Slot 7-10: 1,000 tokens each
   - Slot 11-15: 2,000 tokens each
   - Slot 16-20: 5,000 tokens each

3. **Frontend:**
   - ✅ Added "Hero Slot Expansion" section in Store page
   - ✅ Shows current slots (e.g., "2 / 3" heroes)
   - ✅ Shows unlock cost for next slot
   - ✅ Purchase button unlocks next slot
   - ✅ Auto-refreshes after unlock

**Files Modified:**
- ✅ `E:\IdleDnD-Backend\src\routes\heroes.js` - Added slot unlock system, helper functions, endpoints
- ✅ `E:\IdleDnD-Web\src\pages\StorePage.tsx` - Added hero slot unlock UI section
- ✅ `E:\IdleDnD-Web\src\api\client.ts` - Added `getSlotInfo()` and `unlockHeroSlot()` API functions

**What Changed:**
- Users now get 5 free hero slots (updated from 3, down from original 10)
- Users can unlock additional slots with tokens (tiered pricing)
- Hero creation validates against `slotsUnlocked` instead of hard limit
- New users collection stores `slotsUnlocked` field (default: 5)
- Unlock costs adjusted: Slots 6-8 (500t), 9-12 (1000t), 13-17 (2000t), 18-20 (5000t)

**Estimated Time:** ✅ Complete (1 day)  
**Revenue Potential:** HIGH - Players who want multiple heroes will pay

---

### **Step 8.3: Inventory Expansion (Token Option)** ⭐⭐ MEDIUM PRIORITY
**Status:** ✅ COMPLETE  
**Priority:** MEDIUM - Convenience feature

**Goal:** Add token payment option for inventory expansion (alongside existing gold option)

**📋 Reference:** See `MONETIZATION_GAP_ANALYSIS.md` - Priority 3 section for token pricing and implementation

**Implementation:**
1. **Backend:** ✅ COMPLETE
   - ✅ Updated `expandStorage` endpoint to accept `currency` parameter ('gold' or 'tokens')
   - ✅ Token cost: 50 tokens for 15 slots (vs 750g for gold) - Balanced at ~1 token per slot
   - ✅ Validates currency type and sufficient funds
   - ✅ Returns appropriate currency remaining after purchase

2. **Frontend:** ✅ COMPLETE
   - ✅ Added two buttons: Gold (750g) and Tokens (100t)
   - ✅ Both buttons show cost clearly
   - ✅ Validation for sufficient funds before purchase
   - ✅ Confirmation dialog shows remaining currency

**Files Modified:**
- ✅ `E:\IdleDnD-Backend\src\routes\heroes.js` - Updated expandStorage endpoint with currency support
- ✅ `E:\IdleDnD-Web\src\components\InventoryManager.tsx` - Added dual payment option UI
- ✅ `E:\IdleDnD-Web\src\api\client.ts` - Updated expandStorage API call to support currency parameter

**Estimated Time:** ✅ Complete (1 day)  
**Revenue Potential:** MEDIUM - Convenience for players who want to expand quickly

---

### **Step 8.4: Token & Gold Packs** ⭐⭐⭐ HIGH PRIORITY
**Status:** ❌ Not Implemented  
**Priority:** HIGH - Immediate revenue generation for sprite development

**Goal:** Direct currency purchase packs (real money) - Standard gacha pricing model

**Pricing Strategy:**
- **Impulse Buy Pack:** 100 tokens + 1,000g = $0.99 (low barrier, high conversion)
- **Starter Pack:** 500 tokens + 5,000g = $4.99 (standard entry point)
- **Value Pack:** 1,500 tokens + 15,000g = $9.99 (better value per token)
- **Premium Pack:** 5,000 tokens + 50,000g = $24.99 (best value, whales)

**Token Value:** ~$0.01 per token (consistent across all packs)
**Gold Bonus:** Included as value-add (not primary currency)

**Why This Pricing:**
- $0.99 removes purchase friction (impulse buy territory)
- $4.99 is standard gacha entry point (proven conversion)
- Tiered pricing encourages upsell to higher packs
- Consistent token value maintains economy balance

**Implementation:**
- Add token purchase packs to Store page
- Connect Stripe payment processing
- Backend endpoint: `POST /api/purchases/token-pack`
- Grant tokens and gold to selected hero

**Estimated Time:** 1-2 days  
**Revenue Potential:** HIGH - Immediate revenue, funds sprite development

---

## 🎨 PHASE 1.3: FOUNDERS PACK COSMETICS (Remaining Features)

### **Step 1.3.4: Founders Hall Page** ✅ COMPLETE
**Status:** ✅ COMPLETE  
**Needed for:** Platinum tier only ($25)

**What It Is:**
- A dedicated "Founders Hall" page displaying statues of all Platinum tier founders
- Prestigious gallery/hall of fame for early supporters
- Better than battlefield placement (no visual clutter, more organized)

**Implementation:**
1. **Backend:** ✅ COMPLETE
   - ✅ Created endpoint: `GET /api/purchases/founders`
   - ✅ Fetches all completed Platinum founder pack purchases
   - ✅ Returns founder data: username, hero name, tier, purchase date
   - ✅ Sorted by purchase date (most recent first)

2. **Frontend:** ✅ COMPLETE
   - ✅ Created `FoundersHallPage.tsx` component
   - ✅ Statue gallery layout (responsive grid: 1-4 columns)
   - ✅ Displays founder name, hero name, tier badge, purchase date
   - ✅ Statue icon with golden glow effect
   - ✅ Empty state when no founders yet
   - ✅ Added route: `/founders-hall`
   - ✅ Added navigation link: "🏛️ Founders Hall"

3. **Design:** ✅ COMPLETE
   - ✅ Statue emoji (🗿) with golden drop-shadow effect
   - ✅ Platinum tier styling (gold/amber gradient borders)
   - ✅ Elegant hall aesthetic with gradient backgrounds
   - ✅ Hover effects and shadows

**Files Created/Modified:**
- ✅ `E:\IdleDnD-Backend\src\routes\purchases.js` - Added GET `/api/purchases/founders` endpoint
- ✅ `E:\IdleDnD-Web\src\pages\FoundersHallPage.tsx` - NEW (Founders Hall page component)
- ✅ `E:\IdleDnD-Web\src\App.tsx` - Added route
- ✅ `E:\IdleDnD-Web\src\components\Navigation.tsx` - Added navigation link
- ✅ `E:\IdleDnD-Web\src\api\client.ts` - Added `getFounders()` method to foundersPackAPI

**Estimated Time:** ✅ Complete (2-3 days)  
**Priority:** MEDIUM (Platinum tier only)

---

### **Step 1.3.5: Chat Badge** ❌ Not Implemented
**Status:** ❌ Not Implemented  
**Needed for:** Platinum tier ($25)

**What It Is:**
- Badge icon next to username in chat
- Shows "Platinum Founder" status
- Visible to other players in chat

**Implementation:**
1. **Determine Chat System:**
   - Check if Twitch extension exists
   - Check if web chat exists
   - Determine badge display method

2. **Implement Badge Display:**
   - Display badge in chat messages
   - Or display in web chat UI
   - Badge icon next to username

**Estimated Time:** 1-2 days  
**Priority:** LOW (Platinum tier only, depends on chat system)

---

## ⛏️ PHASE 2.3: SOCKETING & GEM SYSTEM (Now Prioritized)

### **Step 2.3: Socketing & Gem System** ⭐⭐ NOW PRIORITIZED
**Status:** ✅ COMPLETE - All features implemented including stacking, display, and recipe  
**Priority:** MEDIUM-HIGH - User requested implementation

**Goal:** Implement WoW-style socketing system with gems, socket bonuses, and profession integration

**📋 Reference Document:** See `SOCKETING_GEM_SYSTEM_DESIGN.md` for:
- Complete system design and architecture
- Gem types, stats, and socket bonuses
- Transferable socket items (auction house integration)
- Profession balance considerations
- Implementation checklist
- User experience flow
- Commands and API endpoints

**Key Features:**
1. **Gems (4 Types):**
   - Ruby (Red) - Offensive stats (Attack, Crit)
   - Sapphire (Blue) - Defensive stats (Defense, Damage Reduction)
   - Emerald (Green) - Hybrid stats (Attack + Defense)
   - Diamond (Yellow) - Special stats (XP, Gold, Token gain)

2. **Socket System (Transferable):**
   - Miners craft "Gem Socket" items (transferable, can be sold on auction house)
   - Socket items applied to gear (consumes item, adds socket)
   - Socket count based on gear rarity (Rare: 1, Epic: 2, Legendary: 2-3, Mythic: 3)
   - Gear must show max socket capacity (e.g., "Sockets: 0/2")
   - Socket creation cost: 5 Mithril + 2 Adamantite + 500g

3. **Socket Bonuses (WoW-Style):**
   - 2 Red gems: +5% Attack
   - 2 Blue gems: +5% Defense
   - 2 Green gems: +3% All Stats
   - 2 Yellow gems: +10% XP Gain
   - Mixed combinations provide hybrid bonuses
   - 3-socket bonuses for Mythic gear

4. **Gem Gathering:**
   - 5% chance to find gem while mining
   - Gem rarity based on mining level
   - Gems stored in Mining profession materials

**Implementation Progress:**
1. **Phase 1: Backend Foundation** ✅ COMPLETE
   - ✅ Updated Item schema (added `sockets` array, `maxSockets` field)
   - ✅ Added gem materials to Mining profession
   - ✅ Added "Gem Socket" recipe to Mining profession (creates transferable item)
   - ✅ Created socket application API (`POST /api/professions/:userId/apply-socket`)
   - ✅ Created gem insertion/removal APIs (`POST /api/professions/:userId/gem`, `POST /api/professions/:userId/remove-gem`)
   - ✅ Implemented socket bonus calculation
   - ✅ Socket items and gems can be listed on auction house
   - ✅ Auto-gather gems during mining (5% chance in combat)
   - ✅ **BUG FIXED:** Backend validation now accepts both crafted socket items (`recipeKey: 'gem_socket'`) and `type: 'socket'` items (from test scripts)

2. **Phase 2: Frontend UI** ✅ COMPLETE
   - ✅ Display max sockets on gear (using `getMaxSockets()` utility)
   - ✅ Display current sockets on items (socket circles in UI)
   - ✅ Socket item crafting UI (Mining profession)
   - ✅ Socket application UI (refactored to "Use" button flow - click "Use" on socket item, select target gear)
   - ✅ Gem insertion modal (refactored to "Use" button flow - click "Use" on gem, select socket)
   - ✅ Gem removal UI (click socket circle to remove gem)
   - ✅ Socket bonus display (in item tooltips)
   - ✅ Restyled inventory cards to fit all buttons
   - ✅ Added dedicated sections for Socket Items and Gems in inventory

3. **Phase 3: Browser Source Integration** ✅ COMPLETE
   - ✅ Calculate gem stats in combat (`calculateHeroStats` function)
   - ✅ Apply socket bonuses
   - ✅ Include in hero stat calculations (flat bonuses for ATK/DEF/HP, percentages for crit/reduction)

**Files to Create/Modify:**
- `E:\IdleDnD-Backend\src\routes\professions.js` - Add socket/gem endpoints, socket item recipe
- `E:\IdleDnD-Backend\src\services\gearService.js` - Update Item schema (sockets, maxSockets)
- `E:\IdleDnD-Backend\src\routes\auction.js` - Ensure inventory items can be listed
- `E:\IdleDnD-Web\src\components\InventoryManager.tsx` - Socket/gem UI, max socket display
- `E:\IdleDnD-Web\src\pages\CleanBattlefieldSource.tsx` - Gem stat calculation
- `E:\IdleDnD-Web\src\pages\AuctionHousePage.tsx` - Fix inventory item listing

**📋 Design Documents:**
- `SOCKETING_GEM_SYSTEM_DESIGN.md` - Complete system design, implementation plan, balance considerations

**Estimated Time:** 5-8 days (full implementation)  
**Actual Time:** ~3-4 days (completed faster than estimated)

**Current Status:**
- ✅ Backend APIs fully functional
- ✅ Frontend UI complete with "Use" button flow
- ✅ Browser source integration complete
- ✅ Stacking implemented (socket items and gems stack up to 10)
- ✅ Socket display on equipment cards (empty sockets and gem stats shown)
- ✅ Gem socket recipe added to Mining profession (level 50+, 5 Mithril + 2 Adamantite + 500g)
- ✅ Inventory counting includes all items (socket items, gems, etc.)
- ✅ All bugs fixed - Backend validation accepts both crafted socket items and test items

**Dependencies:**
- ✅ Auction House supports inventory items (Step 9.1 complete)
- ✅ Socket items and gems are tradeable on auction house

**Profession Balance:**
- Mining is becoming too important (sockets, gems, upgrades)
- Need to buff Enchanting and Herbalism (see design doc for proposals)

**Note:** This replaces the previous "deferred" status. User wants to implement this system.

**Updated Design (Transferable Sockets):**
- Sockets are now **transferable items** crafted by miners
- Miners craft "Gem Socket" items (goes to inventory)
- Socket items can be sold on auction house
- Players apply socket items to gear (consumes item, adds socket)
- Gear must show max socket capacity (e.g., "Sockets: 0/2")
- Gems are also transferable (can be sold on auction house)

**Profession Balance Concerns:**
- Mining is becoming too important (sockets, gems, upgrades)
- Need to buff Enchanting and Herbalism to stay competitive
- See `SOCKETING_GEM_SYSTEM_DESIGN.md` for balance proposals

---

## 🏪 PHASE 9: AUCTION HOUSE FIXES (January 2025)

### **Step 9.1: Auction House Inventory Support** ⚠️ CRITICAL FIX
**Status:** ✅ COMPLETE  
**Priority:** HIGH - Blocks socket/gem trading

**Date Completed:** January 2025

**Problem:**
- Auction house needed to support selling items from inventory
- Players needed ability to sell profession items, gems, socket items, consumables
- Socket/gem system requires auction house to work properly

**📋 Related:** This fix is required for `SOCKETING_GEM_SYSTEM_DESIGN.md` - socket items and gems must be tradeable on auction house

**Implementation:**
1. **Backend:**
   - ✅ Backend already supported inventory items (`POST /api/auction/list` checks inventory)
   - ✅ Items are properly removed from hero's inventory when listed
   - ✅ Backend validates item belongs to seller's inventory before listing

2. **Frontend:**
   - ✅ Updated `CreateListingModal` to show all inventory items from all heroes
   - ✅ Added hero selection dropdown (for users with multiple heroes)
   - ✅ Added item type filtering (Gear, Consumables, Materials/Gems, Other)
   - ✅ Shows which hero owns each item
   - ✅ Properly passes hero ID (not user ID) when creating listings
   - ✅ Improved item display with type labels and hero ownership

3. **Validation:**
   - ✅ Cannot sell equipped items (must unequip first - items must be in inventory)
   - ✅ Can sell any item from inventory
   - ✅ Socket items and gems are sellable
   - ✅ Profession items are sellable
   - ✅ Consumables are sellable

**Files Modified:**
- ✅ `E:\IdleDnD-Web\src\pages\AuctionHousePage.tsx` - Enhanced with:
  - Hero ID prop support (loads specific hero's inventory)
  - Embedded mode support (for PlayerPortal integration)
  - Multi-hero support (when no heroId provided - standalone page)
  - Hero selection dropdown (for multi-hero mode)
  - Item type filtering (gear, consumables, materials, etc.)
  - Better item display with type labels
  - Proper hero ID passing for listings
- ✅ `E:\IdleDnD-Web\src\pages\PlayerPortal.tsx` - Added auction house tab:
  - New "Auction House" tab in navigation
  - Passes current hero ID to AuctionHousePage
  - Full-width layout for auction tab

**What Changed:**
- **Moved to PlayerPortal:** Auction house is now accessible as a tab in the player portal
- **Hero-specific inventory:** When accessed from PlayerPortal, loads the selected hero's inventory
- **Standalone mode:** Still works as standalone page at `/auction` (loads all heroes' inventories)
- Users can filter by item type (gear, consumables, materials, gems, etc.)
- Each item shows which hero owns it (in multi-hero mode)
- Listing creation uses correct hero ID (the one that owns the item)
- Backend already had full support for inventory items (no changes needed)

**Estimated Time:** ✅ Complete (1 day)  
**Priority:** HIGH - Now ready for socket/gem system implementation

---

## 📬 PHASE 10: SOCIAL SYSTEMS & TRADING (January 2025)

**Goal:** Implement mail system, in-browser chat, notifications, and trade system for player interaction

---

### **Step 10.1: Mail System** ⭐⭐ MEDIUM PRIORITY
**Status:** ❌ Not Implemented  
**Priority:** MEDIUM - Enables item trading and communication

**Goal:** Allow players to send items, gold, and messages to other players via mail

**Use Cases:**
- Send items to other players (gems, socket items, gear, consumables)
- Send gold/tokens to other players
- Send messages/notes with items
- Receive mail notifications
- Mail expiration (30 days) to prevent database bloat

**Implementation:**
1. **Backend:**
   - Create mail schema (sender, recipient, subject, message, items, gold, tokens, timestamp, read, expires)
   - `POST /api/mail/send` - Send mail to another player
   - `GET /api/mail/:userId` - Get all mail for user
   - `POST /api/mail/:mailId/read` - Mark mail as read
   - `POST /api/mail/:mailId/claim` - Claim items/gold from mail
   - `DELETE /api/mail/:mailId` - Delete mail
   - Auto-expire mail after 30 days

2. **Frontend:**
   - Mail inbox UI (list of received mail)
   - Compose mail UI (select recipient, attach items, add message)
   - Mail detail view (show items, claim button)
   - Mail notification badge (unread count)
   - Mail expiration warning (7 days remaining)

3. **Validation:**
   - Cannot send mail to yourself
   - Must have items in inventory to attach
   - Cannot send equipped items (must unequip first)
   - Mail storage limits (max 50 mail per user)

**Files to Create/Modify:**
- `E:\IdleDnD-Backend\src\routes\mail.js` - NEW (mail endpoints)
- `E:\IdleDnD-Backend\src\models\mail.js` - NEW (mail schema/model)
- `E:\IdleDnD-Web\src\pages\MailPage.tsx` - NEW (mail inbox UI)
- `E:\IdleDnD-Web\src\components\MailComposeModal.tsx` - NEW (compose mail UI)
- `E:\IdleDnD-Web\src\components\Navigation.tsx` - Add mail notification badge

**Estimated Time:** 3-4 days  
**Priority:** MEDIUM - Enables item trading and player communication

---

### **Step 10.1: Mail System** ⭐⭐ COMPLETE
**Status:** ✅ Complete - All features implemented including COD  
**Priority:** MEDIUM - Player item/currency exchange

**Goal:** Allow players to send items, gold, and tokens to other players via mail

**What's Complete:**
- ✅ Send mail with items, gold, tokens
- ✅ COD (Cash on Delivery) - recipient pays when claiming items
- ✅ Mail inbox UI (in sidebar under Party tab)
- ✅ Mail compose form with searchable recipients and items
- ✅ Mail detail view with claim functionality
- ✅ Mail expiration (30 days)
- ✅ Mail limits (max 50 per user)
- ✅ Item stacking in recipient inventory
- ✅ Auto-refresh and notification badge

**Implementation:**
1. **Backend:** ✅ COMPLETE
   - ✅ Mail schema (senderId, recipientId, items, gold, tokens, codAmount, expiresAt)
   - ✅ `POST /api/mail/send` - Send mail with attachments
   - ✅ `GET /api/mail/:userId` - Get user's mail
   - ✅ `POST /api/mail/:mailId/read` - Mark as read
   - ✅ `POST /api/mail/:mailId/claim` - Claim attachments (with COD payment)
   - ✅ `DELETE /api/mail/:mailId` - Delete mail

2. **Frontend:** ✅ COMPLETE
   - ✅ MailPanel component (in SocialSidebar)
   - ✅ MailComposeForm component (inline in sidebar)
   - ✅ MailDetailView component (inline in sidebar)
   - ✅ User search for recipients
   - ✅ Searchable item attachments
   - ✅ COD checkbox and amount input

**Files Created/Modified:**
- ✅ `E:\IdleDnD-Backend\src\routes\mail.js` - Mail endpoints (complete)
- ✅ `E:\IdleDnD-Web\src\components\MailPanel.tsx` - Mail inbox UI (complete)
- ✅ `E:\IdleDnD-Web\src\components\MailComposeForm.tsx` - Compose UI (complete)
- ✅ `E:\IdleDnD-Web\src\components\MailDetailView.tsx` - Detail view (complete)
- ✅ `E:\IdleDnD-Web\src\components\SocialSidebar.tsx` - Added Mail tab
- ✅ `E:\IdleDnD-Web\src\api\client.ts` - Mail API methods (complete)
- ✅ `E:\IdleDnD-Backend\firestore.indexes.json` - Mail query indexes

**Estimated Time:** ✅ Complete (3-4 days total)  
**Priority:** MEDIUM - Direct player trading alternative to auction house  
**Status:** ✅ All features implemented and working

---

### **Step 10.2: In-Browser Chat System** ⭐⭐ COMPLETE (Phase 1 & 2)
**Status:** ✅ Complete - Core features and moderation implemented  
**Priority:** MEDIUM - Player communication and engagement

**📋 Reference Document:** See `CHAT_SYSTEM_REQUIREMENTS.md` for complete feature list, implementation phases, API endpoints, WebSocket events, and data models.

**Goal:** Real-time chat system in web portal for players to communicate

**Channels:**
- Party chat (only visible to party members)
- World chat (visible to all users in browser source)

**Core Features:**
- Real-time messaging via WebSocket
- Message history and persistence
- User display (username, hero name, role, founder badges)
- Basic moderation (block, report, mute)
- Admin tools (ban, delete messages, view logs)

**Implementation Phases (See CHAT_SYSTEM_REQUIREMENTS.md):**
1. **Phase 1: MVP** - Basic messaging, party/world chat, WebSocket, history, basic UI
2. **Phase 2: Essential** - Block, report, rate limiting, message deletion, admin tools
3. **Phase 3: Enhanced UX** - Message editing, typing indicators, notifications, mute
4. **Phase 4: Moderation** - Profanity filter, spam detection, admin ban system, auto-moderation
5. **Phase 5: Advanced** - @mentions, message formatting, link previews, chat search

**Files to Create/Modify:**
- `E:\IdleDnD-Backend\src\websocket\chat.js` - NEW (chat WebSocket handler)
- `E:\IdleDnD-Backend\src\routes\chat.js` - Add web chat endpoints (separate from Twitch chat)
- `E:\IdleDnD-Web\src\components\ChatPanel.tsx` - NEW (chat UI component)
- `E:\IdleDnD-Web\src\hooks\useChat.ts` - NEW (chat WebSocket hook)
- `E:\IdleDnD-Web\src\components\SocialSidebar.tsx` - Integrate chat tab (already has placeholder)

**Estimated Time:** 3-4 days (MVP), 1-2 weeks (full implementation)  
**Priority:** MEDIUM - Player engagement and communication  
**Note:** Start with MVP (Phase 1) and iterate based on user feedback

---

### **Step 10.3: Notification System** ⭐⭐ MEDIUM PRIORITY
**Status:** ❌ Not Implemented  
**Priority:** MEDIUM - User experience improvement

**Goal:** Centralized notification system for mail, trades, achievements, etc.

**Notification Types:**
- Mail received
- Trade request received
- Trade accepted/rejected
- Achievement unlocked
- Quest completed
- Level up
- Item sold on auction house
- Bid won/lost on auction house

**Implementation:**
1. **Backend:**
   - Notification schema (userId, type, title, message, link, read, timestamp)
   - `GET /api/notifications/:userId` - Get all notifications
   - `POST /api/notifications/:notificationId/read` - Mark as read
   - `DELETE /api/notifications/:notificationId` - Delete notification
   - Auto-create notifications for events (mail, trades, achievements)

2. **Frontend:**
   - Notification bell icon in navigation (with unread count)
   - Notification dropdown panel
   - Notification list (grouped by type, sorted by time)
   - Mark all as read button
   - Notification sound (optional)
   - Toast notifications for real-time events

**Files to Create/Modify:**
- `E:\IdleDnD-Backend\src\routes\notifications.js` - NEW (notification endpoints)
- `E:\IdleDnD-Backend\src\models\notification.js` - NEW (notification schema)
- `E:\IdleDnD-Web\src\components\NotificationPanel.tsx` - NEW (notification UI)
- `E:\IdleDnD-Web\src\components\Navigation.tsx` - Add notification bell icon
- `E:\IdleDnD-Web\src\hooks\useNotifications.ts` - NEW (notification hook)

**Estimated Time:** 2-3 days  
**Priority:** MEDIUM - Improves user experience and engagement

---

### **Step 10.4: Trade System** ⭐⭐ MEDIUM PRIORITY
**Status:** ❌ Not Implemented  
**Priority:** MEDIUM - Direct player-to-player trading

**Goal:** Allow players to trade items and gold directly with each other

**Features:**
- Trade request (send to another player)
- Trade window (both players see items/gold being traded)
- Trade confirmation (both players must confirm)
- Trade cancellation (either player can cancel)
- Trade history (last 10 trades)

**Implementation:**
1. **Backend:**
   - Trade schema (initiator, recipient, items, gold, tokens, status, timestamp)
   - `POST /api/trade/request` - Send trade request
   - `POST /api/trade/:tradeId/accept` - Accept trade
   - `POST /api/trade/:tradeId/reject` - Reject trade
   - `POST /api/trade/:tradeId/confirm` - Confirm trade (both players)
   - `GET /api/trade/:userId` - Get active trades
   - Execute trade (swap items/gold when both confirm)

2. **Frontend:**
   - Trade request modal (select player, add items/gold)
   - Trade window (show both sides, confirmation buttons)
   - Trade notification (when trade request received)
   - Trade history UI

3. **Validation:**
   - Cannot trade with yourself
   - Must have items in inventory (not equipped)
   - Both players must confirm before trade executes
   - Trade timeout (5 minutes to accept/confirm)

**Files to Create/Modify:**
- `E:\IdleDnD-Backend\src\routes\trade.js` - NEW (trade endpoints)
- `E:\IdleDnD-Backend\src\models\trade.js` - NEW (trade schema)
- `E:\IdleDnD-Web\src\components\TradeWindow.tsx` - NEW (trade UI)
- `E:\IdleDnD-Web\src\components\TradeRequestModal.tsx` - NEW (trade request UI)
- `E:\IdleDnD-Web\src\hooks\useTrade.ts` - NEW (trade hook)

**Estimated Time:** 3-4 days  
**Priority:** MEDIUM - Direct player trading alternative to auction house

**Note:** Trade system complements auction house (instant trading vs. auction bidding)

---

### **Step 10.5: Party System** ⭐⭐ COMPLETE
**Status:** ✅ Complete - All features implemented including queue integration and matchmaking  
**Priority:** MEDIUM - Group formation for raids/dungeons

**Goal:** Allow players to form parties/groups to queue together for raids and dungeons

**What's Complete:**
- ✅ Create party (party leader)
- ✅ Invite players to party (by username/hero name via search)
- ✅ Accept/decline party invites (with UI display)
- ✅ Party member list (show all members with roles/levels)
- ✅ Party leader controls (kick members, transfer leadership)
- ✅ Party size limits (max 5 members for dungeons, max 20 for raids)
- ✅ Leave party (any member can leave)
- ✅ Auto-disband when leader leaves (or transfer leadership)
- ✅ Party composition display (tank/healer/DPS counts)
- ✅ Party panel in sidebar (SocialSidebar component)
- ✅ User search for invites (by Twitch username or hero name)
- ✅ Inline invite form (converted from modal to inline form in sidebar - matches mail compose UX)
- ✅ Invite from chat/whisper (3-dot menu and whisper interface)
- ✅ Invite when creating new party (auto-creates party if needed)
- ✅ Hero ID to user ID conversion in backend (fixes invite delivery)

**What's Remaining:**
- ⚠️ Party chat (see Step 10.2 - Chat System)
- ⚠️ WebSocket support for real-time party updates (optional enhancement)

**Implementation:**
1. **Backend:** ✅ COMPLETE
   - ✅ Party schema (leaderId, members[], status, createdAt, queueType, partyId)
   - ✅ `POST /api/parties/create` - Create new party
   - ✅ `POST /api/parties/:partyId/invite` - Invite player to party
   - ✅ `POST /api/parties/invites/:inviteId/accept` - Accept party invite
   - ✅ `POST /api/parties/invites/:inviteId/decline` - Decline party invite
   - ✅ `POST /api/parties/:partyId/leave` - Leave party
   - ✅ `POST /api/parties/:partyId/kick` - Kick member (leader only)
   - ✅ `POST /api/parties/:partyId/transfer` - Transfer leadership
   - ✅ `GET /api/parties/:userId` - Get user's current party
   - ✅ `GET /api/parties/invites/:userId` - Get pending invites
   - ✅ `GET /api/parties/search` - Search users by username/hero name
   - ✅ `POST /api/parties/:partyId/queue` - Queue entire party for dungeon/raid (COMPLETE)
   - ⚠️ WebSocket updates (real-time party changes) (Optional - polling works for now)

2. **Frontend:** ✅ MOSTLY COMPLETE
   - ✅ Party panel component (PartyPanel.tsx - shows current party members)
   - ✅ Party invite modal (PartyInviteModal.tsx - search players, send invite)
   - ✅ Party invite display (shows pending invites with accept/decline)
   - ✅ Party member list (with roles, levels, kick buttons for leader)
   - ✅ Leave party button
   - ✅ Party status indicator (in party, not in party)
   - ✅ Party composition display (tank/healer/DPS breakdown)
   - ✅ Party panel in sidebar (SocialSidebar component)
   - ✅ Queue as party button/modal (COMPLETE - PartyQueueModal.tsx)

3. **Integration:** ✅ COMPLETE
   - ✅ Connect to existing dungeon/raid queue system
   - ✅ Party members join queue together (all queued with partyId)
   - ✅ Matchmaking prioritizes complete parties, then incomplete parties + individuals
   - ✅ Party stays together through dungeon/raid (matched as group)
   - ✅ Party members spawn together in same instance
   - ✅ Matchmaking keeps party members together (Priority 1: complete parties, Priority 2: incomplete parties + individuals)

**Files Created/Modified:**
- ✅ `E:\IdleDnD-Backend\src\routes\parties.js` - Party endpoints (complete)
- ✅ `E:\IdleDnD-Web\src\components\PartyPanel.tsx` - Party UI (complete)
- ✅ `E:\IdleDnD-Web\src\components\PartyInviteForm.tsx` - Inline invite form (complete - replaced modal)
- ✅ `E:\IdleDnD-Web\src\components\SocialSidebar.tsx` - Party panel in sidebar (complete)
- ✅ `E:\IdleDnD-Web\src\components\ChatPanel.tsx` - Invite from chat/whisper (complete)
- ✅ `E:\IdleDnD-Web\src\api\client.ts` - Party API methods (complete)
- ✅ `E:\IdleDnD-Backend\src\routes\dungeon.js` - Matchmaking updated to handle parties (complete)
- ✅ `E:\IdleDnD-Backend\src\routes\raids.js` - Matchmaking updated to handle parties (complete)
- ✅ `E:\IdleDnD-Web\src\components\PartyQueueModal.tsx` - Queue selection modal (complete)
- ✅ `E:\IdleDnD-Backend\src\routes\parties.js` - Queue endpoint added, hero ID conversion (complete)

**Queue as Party Implementation Decision:**
**Recommended Approach:** Modal from sidebar "Queue as Party" button
- **Why:** Keeps party flow in one place (create → invite → queue)
- **How:** Click "Queue as Party" button in PartyPanel → Modal shows dungeon/raid options → Select type → Entire party joins queue
- **Alternative (Not Recommended):** Add queue option on raids/dungeons tab - splits party flow across multiple pages

**Estimated Time:** ✅ Complete (4-5 days total)  
**Priority:** MEDIUM - Improves group play experience for raids/dungeons  
**Status:** ✅ All features implemented and tested

---
