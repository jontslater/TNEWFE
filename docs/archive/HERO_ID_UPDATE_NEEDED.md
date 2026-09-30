# Hero-Specific Updates Should Use Hero ID, Not User ID

**Issue:** We're using user ID for hero-specific updates, but heroes have their own document IDs and can have different badges/titles/achievements.

---

## 🔍 The Problem

1. **Each hero has its own document ID** (e.g., `BVLjZQcGYX1jawVyHSd6`)
2. **Hero-specific data** (badges, titles, achievements, guild) is stored ON THE HERO, not the user
3. **Multiple heroes per user** - each hero can have different badges/titles
4. **Current code uses user ID** for updates, which is wrong

---

## ✅ Current State

**Correct:**
- `getHeroAchievements(heroId)` - Uses hero ID ✅
- `setActiveTitle(heroId, title)` - Uses hero ID ✅

**Wrong:**
- `updateHero(userId, updates)` - Uses user ID ❌
- Badge updates use `user?.twitchId || user?.id` ❌

---

## 🎯 Solution

We need to:

1. **Update badge code to use `hero.id`** instead of user ID
2. **Create/use an API endpoint that accepts hero ID** for updates
3. **Ensure all hero-specific updates use hero document ID**

---

## 📋 Hero Document Structure

From Firebase:
```
heroes/{heroDocumentId}/
  - id: "BVLjZQcGYX1jawVyHSd6" (internal hero ID)
  - activeBadge: "/Badges/FoundersPlatinum.png"
  - badges: ["/Badges/FoundersPlatinum.png", ...]
  - activeTitle: "Platinum Founder"
  - achievements: [...]
  - guildId: ...
```

Each hero is a separate document with its own ID!

---

**Next:** Fix badge update to use `hero.id` instead of user ID

