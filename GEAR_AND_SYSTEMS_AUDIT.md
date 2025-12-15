# Gear & Systems Audit - Browser Source

**Date:** December 10, 2025  
**Goal:** Ensure all systems are properly tracked and displayed in browser source

---

## Current Status

### ✅ **Implemented**

1. **Quest Tracking**
   - `trackQuest()` function exists
   - Tracks: `dealDamage`, `healAmount`, `kill`, `completeWaves`
   - Batches sync to backend
   - Location: `CleanBattlefieldSource.tsx` lines 1704-1750

2. **Set Bonuses**
   - `calculateSetBonuses()` function exists
   - Applied to stats in `calculateHeroStats()`
   - Location: `CleanBattlefieldSource.tsx` lines 5825-5842

3. **Skills**
   - Skills loaded from hero data
   - `calculateSkillBonuses()` function exists
   - Location: `CleanBattlefieldSource.tsx` lines 5522-5560

4. **Auto-Sell Logic**
   - Exists in loot processing
   - Location: `CleanBattlefieldSource.tsx` line 4720

---

## ❌ **Missing / Needs Verification**

### 1. **Quest Tracking Completeness**
- [ ] Verify all quest types are tracked:
  - [ ] `dealDamage` ✅
  - [ ] `healAmount` ✅
  - [ ] `kill` ✅
  - [ ] `completeWaves` ✅
  - [ ] `gather` (professions) ❓
  - [ ] `craft` (professions) ❓
  - [ ] `useItem` ❓
  - [ ] `completeDungeon` ❓
  - [ ] `completeRaid` ❓

### 2. **Automatic Gathering**
- [ ] Check if gathering happens automatically
- [ ] Verify gathering is tracked for quests
- [ ] Check if gathering resources are displayed
- [ ] Verify profession XP is tracked

### 3. **Gear Upgrades in Browser**
- [ ] Verify gear upgrades work in real-time
- [ ] Check if upgrade UI exists in browser source
- [ ] Verify upgrade stats are immediately reflected
- [ ] Check if upgrade costs are calculated correctly

### 4. **Gear Locking Feature** ⭐ NEW
- [ ] Add `locked` field to equipment schema
- [ ] Add lock/unlock UI in player portal
- [ ] Prevent auto-sell of locked gear
- [ ] Prevent auto-replace of locked gear
- [ ] Show lock icon in browser source

### 5. **Gear Distribution Logic** ⭐ NEW
- [ ] Review current auto-sell/gift logic
- [ ] Decide: Manual vs Auto
- [ ] If manual: Add UI for gear decisions
- [ ] If auto: Improve distribution algorithm
- [ ] Add "pass to another hero" logic

---

## Recommendations

### **Gear Locking**
**Implementation:**
1. Add `locked: boolean` to equipment items
2. Add lock/unlock button in equipment UI
3. Skip locked items in auto-sell/replace logic
4. Show lock icon (🔒) in browser source

### **Gear Distribution Strategy**

**Option 1: Manual (Recommended)**
- Player decides what to do with each item
- UI shows: "Keep", "Sell", "Gift to Hero X", "Pass"
- More control, better UX
- Prevents accidental loss of good gear

**Option 2: Smart Auto**
- Auto-equip if better
- Auto-sell if worse (and not locked)
- Auto-gift to other heroes if better for them
- Pass to next hero if current hero doesn't need it
- Less control, but faster

**Option 3: Hybrid**
- Auto-equip if significantly better (>10% improvement)
- Manual decision for close calls
- Auto-sell only common/rare items
- Manual for epic/legendary/mythic

**Recommendation:** **Option 1 (Manual)** for launch, add Option 3 (Hybrid) as a setting later.

---

## Implementation Plan

### Phase 1: Verification
1. ✅ Verify quest tracking works for all types
2. ✅ Check gathering system
3. ✅ Test gear upgrades in browser
4. ✅ Verify skills are applied

### Phase 2: Gear Locking
1. Add `locked` field to equipment
2. Add lock/unlock API endpoints
3. Add UI in player portal
4. Update auto-sell/replace logic
5. Show lock icon in browser

### Phase 3: Gear Distribution
1. Review current auto-sell logic
2. Implement chosen strategy (Manual/Hybrid)
3. Add UI for gear decisions
4. Test distribution logic

---

## Questions to Answer

1. **Gear Distribution:** Manual vs Auto vs Hybrid?
2. **Gear Locking:** Should locked gear be visible in browser source?
3. **Gathering:** Is automatic gathering already implemented?
4. **Gear Upgrades:** Do they work in real-time in browser source?






