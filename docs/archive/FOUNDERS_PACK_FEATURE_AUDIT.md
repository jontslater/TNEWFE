# Founders Pack Feature Audit

**Date:** December 5, 2025  
**Purpose:** Identify which pack features exist vs. need implementation

---

## 📊 Feature Status by Pack Tier

### **BRONZE FOUNDER ($5)**
| Feature | Status | Notes |
|---------|--------|-------|
| Bronze Founder Badge | ✅ **EXISTS** | Badge images in `/public/Badges/` |
| Exclusive "Founder" Title | ⚠️ **PARTIAL** | Title system exists, need to add "Founder" title |
| 25 Premium Tokens | ✅ **EXISTS** | Token shop exists, just need to award |
| Unique Name Color | ❌ **MISSING** | Not implemented - add to plan |
| Discord Founder Role | ✅ **META** | External feature (Discord setup) |
| Early Access to New Features | ✅ **META** | Not a code feature |

### **SILVER FOUNDER ($10)**
| Feature | Status | Notes |
|---------|--------|-------|
| Silver Founder Badge | ✅ **EXISTS** | Badge images in `/public/Badges/` |
| Exclusive "Founder" Title | ⚠️ **PARTIAL** | Title system exists, need to add "Founder" title |
| 75 Premium Tokens | ✅ **EXISTS** | Token shop exists, just need to award |
| Unique Name Color | ❌ **MISSING** | Not implemented - add to plan |
| Exclusive Name Frame | ❌ **MISSING** | Not implemented - add to plan |
| Discord Founder Role | ✅ **META** | External feature (Discord setup) |
| Early Access to New Features | ✅ **META** | Not a code feature |

### **GOLD FOUNDER ($15)**
| Feature | Status | Notes |
|---------|--------|-------|
| Gold Founder Badge | ✅ **EXISTS** | Badge images in `/public/Badges/` |
| Exclusive "Founder" Title | ⚠️ **PARTIAL** | Title system exists, need to add "Founder" title |
| 150 Premium Tokens | ✅ **EXISTS** | Token shop exists, just need to award |
| Unique Name Color | ❌ **MISSING** | Not implemented - add to plan |
| Exclusive Name Frame | ❌ **MISSING** | Not implemented - add to plan |
| Exclusive Aura Effect | ❌ **MISSING** | Not implemented - add to plan |
| Exclusive Spell Effects | ❌ **MISSING** | Not implemented - add to plan (easier than gear effects) |
| Discord Founder Role | ✅ **META** | External feature (Discord setup) |
| Early Access to New Features | ✅ **META** | Not a code feature |
| Early Art Previews | ✅ **META** | Not a code feature |

### **PLATINUM FOUNDER ($25)**
| Feature | Status | Notes |
|---------|--------|-------|
| Platinum Founder Badge | ✅ **EXISTS** | Badge images in `/public/Badges/` |
| Exclusive "Founder" Title | ⚠️ **PARTIAL** | Title system exists, need to add "Founder" title |
| 250 Premium Tokens | ✅ **EXISTS** | Token shop exists, just need to award |
| Unique Name Color | ❌ **MISSING** | Not implemented - add to plan |
| Exclusive Name Frame | ❌ **MISSING** | Not implemented - add to plan |
| Exclusive Aura Effect | ❌ **MISSING** | Not implemented - add to plan |
| Founder Statue in Game | ❌ **MISSING** | Not implemented - add to plan |
| Discord Founder Role | ✅ **META** | External feature (Discord setup) |
| Early Access to New Features | ✅ **META** | Not a code feature |
| Early Art Previews | ✅ **META** | Not a code feature |
| Exclusive Founder Chat Badge | ❌ **MISSING** | Not implemented - add to plan |

---

## 🎯 Missing Features to Implement

### **HIGH PRIORITY (Pack Features)**

#### 1. **Name Colors** ❌
**Status:** Not Implemented  
**Needed for:** All tiers (Bronze+)  
**Requirements:**
- Add `nameColor` field to Hero/User model
- Display custom color in browser source
- Display custom color in web portal
- Allow founders to set custom hex color
- Color picker UI in portal

**Implementation:**
- Backend: Add field to schema
- Frontend: Display color in hero name tags
- Browser Source: Apply color to name display
- Portal: Color customization UI

---

#### 2. **Name Frames** ❌
**Status:** Not Implemented  
**Needed for:** Silver+ tiers  
**Requirements:**
- Add `nameFrame` field to Hero/User model
- Create frame images/assets
- Display frame around name in browser source
- Display frame in web portal
- Frame selection UI

**Implementation:**
- Create frame sprites/images (4 variants for tiers)
- Backend: Add field to schema
- Frontend: Display frame around name
- Browser Source: Render frame in nameplate
- Portal: Frame selection UI

---

#### 3. **Aura Effects** ❌
**Status:** Not Implemented  
**Needed for:** Gold+ tiers  
**Requirements:**
- Add `auraEffect` field to Hero/User model
- Create aura particle effects
- Display aura around hero sprite
- Aura selection/activation UI

**Implementation:**
- Create aura particle system (CSS/Canvas)
- Aura variants (gold, purple, etc.)
- Backend: Add field to schema
- Browser Source: Render aura around sprite
- Portal: Aura preview/selection UI

---

#### 4. **Spell Effects** ❌
**Status:** Not Implemented  
**Needed for:** All tiers (or higher tiers)  
**Requirements:**
- Add `spellEffect` field to Hero/User model
- Create spell effect variants (fireball, shockwave, etc.)
- Apply effects to attacks/abilities during combat
- Effect selection UI

**Implementation:**
- Create spell effect variants:
  - Special fireball effects (for casters)
  - Special shockwave effects (for melee)
  - Lightning/ice/fire variations
- Backend: Add field to schema
- Browser Source: Apply effects to combat animations
- Portal: Effect preview/selection UI

**Note:** Much easier than gear-specific effects since sprites don't have targetable gear. Effects are visible during combat.

---

#### 4. **Spell Effects** ❌
**Status:** Not Implemented  
**Needed for:** Gold+ tiers  
**Requirements:**
- Add `spellEffect` field to Hero/User model
- Create spell effect variants (fireball, shockwave, etc.)
- Apply effects to attacks/abilities during combat
- Effect selection UI

**Implementation:**
- Create spell effect variants:
  - Special fireball effects (for casters)
  - Special shockwave effects (for melee)
  - Lightning/ice/fire variations
- Backend: Add field to schema
- Browser Source: Apply effects to combat animations
- Portal: Effect preview/selection UI

**Note:** Much easier than gear-specific effects since sprites don't have targetable gear. Effects are visible during combat.

---

#### 5. **Founder Statue** ❌
**Status:** Not Implemented  
**Needed for:** Platinum tier only  
**Requirements:**
- Create statue sprite/asset
- Add statue to battlefield
- Display founder name on statue
- Statue placement system

**Implementation:**
- Design/create statue sprite
- Backend: Track statue placement
- Browser Source: Render statue on battlefield
- Portal: Statue customization UI (optional)

---

#### 5. **Chat Badge** ❌
**Status:** Not Implemented  
**Needed for:** Platinum tier  
**Requirements:**
- Display badge in Twitch chat (via extension/bot)
- Or display badge in web chat (if exists)

**Implementation:**
- Backend: Track badge assignment
- Extension/Bot: Display badge in chat messages
- Or: Add chat badge to web chat UI

---

### **MEDIUM PRIORITY (Supporting Features)**

#### 6. **Founder Title**
**Status:** ⚠️ Partial (Title system exists)  
**Needed for:** All tiers  
**Requirements:**
- Add "Founder" title to achievements system
- Auto-assign on purchase
- Display in title selection

**Implementation:**
- Add "Founder" achievement/title to database
- Auto-unlock on founders pack purchase
- Display in AchievementsPanel

---

#### 7. **Badge Display System**
**Status:** ⚠️ Partial (Images exist, display needs work)  
**Needed for:** All tiers  
**Requirements:**
- Display badge in browser source
- Display badge in achievements panel
- Display badge next to name in portal

**Implementation:**
- Browser Source: Show badge icon next to name
- AchievementsPanel: Display founder badge
- Portal: Badge display in hero profile

---

## 📋 Implementation Plan Addition

These features need to be added to `FINAL_EXECUTION_PLAN.md`:

### **NEW PHASE: Cosmetics System (Phase 1.3)**

#### **Step 1.3.1: Name Colors**
- Add `nameColor` field to Hero schema
- Create color picker UI in portal
- Display custom color in browser source name tags
- Display custom color in web portal
- **Time:** 2-3 days

#### **Step 1.3.2: Name Frames**
- Design/create 4 frame variants (Bronze/Silver/Gold/Platinum)
- Add `nameFrame` field to Hero schema
- Create frame rendering system
- Display frame in browser source nameplates
- Display frame in web portal
- Frame selection UI
- **Time:** 3-4 days

#### **Step 1.3.3: Aura Effects**
- Design/create aura particle effects (CSS/Canvas)
- Create 2-3 aura variants for Gold/Platinum
- Add `auraEffect` field to Hero schema
- Render aura around hero sprite in browser source
- Aura preview/selection UI in portal
- **Time:** 3-5 days

#### **Step 1.3.4: Founder Statue**
- Design/create statue sprite
- Add statue placement system
- Render statue on battlefield in browser source
- Display founder name on statue
- **Time:** 2-3 days

#### **Step 1.3.5: Chat Badge**
- Determine chat system (Twitch extension vs web chat)
- Implement badge display in chosen system
- **Time:** 1-2 days (depends on chat system)

#### **Step 1.3.6: Badge Display Enhancement**
- Display badge in browser source name tags
- Display badge in achievements panel
- Display badge in portal hero profile
- **Time:** 1 day

---

## 🎨 Asset Requirements

### **Name Frames**
- Bronze frame image/sprite
- Silver frame image/sprite  
- Gold frame image/sprite
- Platinum frame image/sprite
- Must work with name display system

### **Aura Effects**
- Gold aura particle effect
- Purple aura particle effect (platinum)
- Animated particle system
- Must render around hero sprite

### **Founder Statue**
- Statue sprite (platinum tier)
- Plinth/base sprite
- Text rendering for founder name
- Must fit battlefield aesthetic

---

## ✅ What Already Works

- ✅ Badge images exist (all 4 tiers)
- ✅ Title system exists (just need to add "Founder" title)
- ✅ Token shop exists (just need to award tokens)
- ✅ AchievementsPanel exists (badge display needs enhancement)

---

## 🚨 Critical Notes

1. **Keep features in pack promises** - We listed them, so we should implement them
2. **Prioritize by tier** - Bronze features first, then Silver, etc.
3. **Cosmetic system foundation** - These features will be the base for future cosmetics
4. **Browser Source is key** - Most visual features need to show in browser source

---

**All missing features need to be added to the execution plan as Phase 1.3 or Phase 3 (Cosmetics System).**
