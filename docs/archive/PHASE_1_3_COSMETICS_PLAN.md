# Phase 1.3: Founders Pack Cosmetics - Missing Features Plan

**Date:** December 5, 2025  
**Status:** Features identified, need implementation  
**Source:** Founders Pack Feature Audit

---

## 🎯 Overview

The Founders Pack promises several cosmetic features that don't exist yet. These need to be implemented to fulfill pack promises.

**See:** `FOUNDERS_PACK_FEATURE_AUDIT.md` for full feature breakdown

---

## ✅ WHAT WE HAVE

- ✅ Badge images (all 4 tiers)
- ✅ Title system (need to add "Founder" title)
- ✅ Token shop (just need to award tokens)
- ✅ AchievementsPanel (badge display needs enhancement)

---

## ❌ WHAT WE NEED

### **1. Name Colors** ❌
**Tiers:** All (Bronze+)  
**Priority:** HIGH

**Implementation:**
- Backend: Add `nameColor` field to Hero schema
- Portal: Color picker UI
- Browser Source: Display custom color in name tags
- Portal: Display custom color in name displays

**Time:** 2-3 days

---

### **2. Name Frames** ❌
**Tiers:** Silver+  
**Priority:** HIGH

**Implementation:**
- Design/create 4 frame variants
- Backend: Add `nameFrame` field to Hero schema
- Browser Source: Render frame around name
- Portal: Frame selection UI

**Time:** 3-4 days

---

### **3. Aura Effects** ❌
**Tiers:** Gold+  
**Priority:** HIGH

**Implementation:**
- Create aura particle effects (CSS/Canvas)
- Backend: Add `auraEffect` field to Hero schema
- Browser Source: Render aura around hero sprite
- Portal: Aura preview/selection UI

**Time:** 3-5 days

---

### **4. Founder Statue** ❌
**Tiers:** Platinum only  
**Priority:** MEDIUM

**Implementation:**
- Create statue sprite
- Backend: Statue placement system
- Browser Source: Render statue on battlefield
- Display founder name on statue

**Time:** 2-3 days

---

### **5. Chat Badge** ❌
**Tiers:** Platinum only  
**Priority:** LOW

**Implementation:**
- Determine chat system (Twitch extension vs web chat)
- Implement badge display in chosen system

**Time:** 1-2 days

---

### **6. Badge Display Enhancement** ⚠️
**Tiers:** All  
**Priority:** HIGH

**Implementation:**
- Display badge in browser source name tags
- Display badge in achievements panel
- Display badge in portal hero profile

**Time:** 1 day

---

### **7. Founder Title** ⚠️
**Tiers:** All  
**Priority:** HIGH

**Implementation:**
- Add "Founder" title to achievements system
- Auto-unlock on purchase
- Display in title selection

**Time:** 0.5 day

---

## 📋 ADD TO EXECUTION PLAN

Add these as **Phase 1.3** in `FINAL_EXECUTION_PLAN.md`:

- Step 1.3.1: Name Colors (2-3 days)
- Step 1.3.2: Name Frames (3-4 days)
- Step 1.3.3: Aura Effects (3-5 days)
- Step 1.3.4: Founder Statue (2-3 days)
- Step 1.3.5: Chat Badge (1-2 days)
- Step 1.3.6: Badge Display Enhancement (1 day)
- Step 1.3.7: Founder Title (0.5 day)

**Total Time:** ~13-19 days for all cosmetic features

---

## 🎨 ASSET REQUIREMENTS

### Name Frames
- Bronze frame sprite/image
- Silver frame sprite/image
- Gold frame sprite/image
- Platinum frame sprite/image

### Aura Effects
- Gold aura particle effect
- Purple aura particle effect
- Animated particle system

### Founder Statue
- Statue sprite
- Plinth/base sprite
- Text rendering system

---

**All features need to be implemented to fulfill Founders Pack promises!**

