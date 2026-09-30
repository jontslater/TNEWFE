# Phase 1.2: Badge Display Enhancement - Step by Step

**Date:** December 5, 2025  
**Status:** 🔄 In Progress

---

## ✅ What We're Doing

**Goal:** Display Founders Pack badges in:
1. Achievements Panel (badge selection UI)
2. Hero Profile/Portal (next to hero name)
3. Browser Source (next to hero name tags)

---

## 📋 Step-by-Step Plan

### **Step 1: Verify Current State** ✅
- [x] Badge images exist: `/public/Badges/FoundersBronze.png`, etc.
- [ ] Check Hero type for badge field
- [ ] Check AchievementsPanel for badge display
- [ ] Check browser source for hero name display locations

### **Step 2: Add Badge Field to Hero Type**
- [ ] Add `founderBadge?: string` to Hero interface
- [ ] Add `activeBadge?: string` to Hero interface (if multiple badges)

### **Step 3: Create Badge Selection UI in AchievementsPanel**
- [ ] Load user's badges from founders pack API
- [ ] Display available badges
- [ ] Allow selection/activation
- [ ] Save selection to hero

### **Step 4: Display Badge in Portal/Profile**
- [ ] Show badge icon next to hero name in PlayerPortal
- [ ] Show badge in hero profile section

### **Step 5: Display Badge in Browser Source**
- [ ] Find hero name tag rendering in CleanBattlefieldSource
- [ ] Add badge icon next to hero name
- [ ] Position badge appropriately

---

## 🔍 Current Findings

- ✅ Badge images exist: 4 founder badges
- ❌ No badge field in Hero type
- ❌ No badge display in AchievementsPanel
- ❌ No badge display in browser source

---

Let's start with Step 1 verification!

