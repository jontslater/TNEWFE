# Phase 1.2: Badge Display - Next Steps

**Status:** Ready to start implementation

---

## ✅ What We Found

### **What Exists:**
- ✅ Badge images: `/public/Badges/FoundersBronze.png`, Silver, Gold, Platinum
- ✅ Founders Pack page with badge previews
- ✅ Achievement system infrastructure

### **What's Missing:**
- ❌ Hero type has no badge field
- ❌ AchievementsPanel has no badge display
- ❌ Browser source doesn't show badges next to hero names
- ❌ Portal doesn't show badges

---

## 📋 Implementation Plan

### **Step 1: Add Badge Field to Hero Type** (5 min)
- Add `founderBadge?: string` to Hero interface
- Stores badge path (e.g., "/Badges/FoundersGold.png")

### **Step 2: Create Badge Selection UI** (1-2 hours)
- Add badge section to AchievementsPanel
- Load user's founder pack status
- Show available badges
- Allow selection
- Save to hero

### **Step 3: Display Badge in Portal** (30 min)
- Show badge icon next to hero name in PlayerPortal

### **Step 4: Display Badge in Browser Source** (1 hour)
- Find hero name rendering location
- Add badge icon next to hero name tags
- Position appropriately

---

## 🎯 Next Action

**Start with Step 1: Add badge field to Hero type**

This is the foundation - everything else depends on it!

**Ready to proceed?** Let's add the badge field to the Hero type first.

