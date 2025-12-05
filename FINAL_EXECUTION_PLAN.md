# Final Execution Plan - Pre-Cleanup Push

**Date:** December 5, 2025  
**Goal:** Complete all critical features before code/documentation cleanup  
**Critical Rule:** Verify each step - do not duplicate existing work

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

### **Step 1.1: Founders Pack Purchase Flow**
**Status:** ❌ Not Implemented (Badge images exist, no purchase system)

**Verification Needed:**
- [ ] Check for existing purchase pages/components
- [ ] Verify badge assignment API exists in backend
- [ ] Check title assignment system
- [ ] Verify user/payment data structure

**Tasks:**
1. Create `FoundersPackPage.tsx` component
   - Display pack tiers (Bronze $15, Silver $20, Gold $25, Platinum $30)
   - Show badge previews (images in `public/Badges/`)
   - Show included items (title, badge, premium currency, etc.)
   - **Payment processing placeholder** - Show "Coming Soon" or mock checkout
   - Store purchase intent in database (pending payment status)

2. Add route in `App.tsx`
   - `/founders-pack` route

3. Create purchase API endpoints (backend, but define interface):
   - `POST /api/purchases/founders-pack` - Initiate purchase
   - `GET /api/purchases/status/:purchaseId` - Check payment status
   - When Stripe ready: `POST /api/purchases/complete` - Complete purchase

4. Badge assignment system:
   - Add badge field to Hero/User model (if not exists)
   - Create API endpoint to assign badge after purchase
   - Update achievements system to display badge

5. Add navigation link:
   - Add "Founders Pack" to Navigation component

**Estimated Time:** 2-3 days (without Stripe integration)  
**Dependencies:** Backend API for badge assignment  
**Skip if:** Purchase flow already exists

---

### **Step 1.2: Founders Pack Badge Display**
**Status:** ✅ COMPLETE

**Verification Needed:**
- [ ] Check if AchievementsPanel displays badges
- [ ] Verify badge assignment works
- [ ] Check if badges show in browser source

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

### **Step 1.3: Payment Processing Setup (Stripe Placeholder)**
**Status:** ❌ Not Set Up (User needs to configure Stripe)

**Tasks:**
1. Install Stripe SDK (don't configure keys yet):
   - `npm install @stripe/stripe-js`

2. Create Stripe service file:
   - `src/services/stripe.ts` - Stripe client initialization
   - Use environment variables for keys (not set yet)

3. Create checkout component:
   - `src/components/StripeCheckout.tsx` - Checkout form
   - Shows "Payment processing coming soon" message
   - Structure ready for Stripe integration

4. Add environment variables template:
   - `.env.example` - Add `REACT_APP_STRIPE_PUBLISHABLE_KEY=`
   - Document in README

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

### **Step 1.3.4: Founder Statue**
**Status:** ❌ Not Implemented  
**Needed for:** Platinum tier only

**Tasks:**
1. Create statue sprite asset
2. Backend: Statue placement system
3. Browser Source: Render statue on battlefield
4. Display founder name on statue

**Estimated Time:** 2-3 days  
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

### **Step 2.2: Equipment Reforge UI**
**Status:** ⚠️ Partial (API exists, UI has placeholder alert)

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

### **Step 2.3: Socketing & Gem System**
**Status:** ❓ Unknown (Mentioned in docs, need to verify)

**Verification:**
- [ ] Check if socketing backend API exists
- [ ] Check if gem insertion API exists
- [ ] Check `ProfessionsPage.tsx` - mentions socketing
- [ ] Check if mining profession has gem gathering

**Current State Found:**
- `ProfessionsPage.tsx` mentions socketing in Mining profession
- Commands mentioned: `!socket [slot]`, `!gem [slot] [type]`

**Tasks:**
1. **Verify backend:**
   - Check if socketing API endpoints exist
   - Check if gem insertion API exists
   - If not, document needed endpoints

2. **If backend exists, create UI:**
   - Socket slot display on items
   - Gem selection modal
   - Socket creation UI (if profession-based)

3. **If backend missing:**
   - Document requirements for backend team
   - Create placeholder UI with "Coming Soon"

**Estimated Time:** 1-2 days (if backend exists), or 0.5 days (documentation)  
**Skip if:** Socketing system fully implemented

---

## 🎨 PHASE 1.3: FOUNDERS PACK COSMETICS (Required Features)

### **Step 1.3.1: Name Colors**
**Status:** ❌ Not Implemented  
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

### **Step 1.3.2: Name Frames**
**Status:** ❌ Not Implemented  
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

### **Step 1.3.3: Aura Effects**
**Status:** ❌ Not Implemented  
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

### **Step 3.1: Verify DoT/HoT System Status**
**Status:** ⚠️ EXISTS BUT NEEDS VERIFICATION (System found in utils, may not be connected)

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

### **Step 3.2: Verify Debuff System Status**
**Status:** ⚠️ Conflicting Information

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

### **Step 3.3: Loot Generation System**
**Status:** ❌ Missing (Confirmed in audit)

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

### **Step 4.1: Token Earning System**
**Status:** ❌ Missing (Confirmed in audit)

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

### **Step 5.1: Verify Viewer Buff System**
**Status:** ⚠️ Implemented but may be incomplete

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

---

**This is the LAST PUSH before cleanup - make it count!** 🚀
