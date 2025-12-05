# Badge Update Fix - 404 Error Resolution

**Issue:** `Failed to load resource: the server responded with a status of 404 (Not Found)` when updating badge

**Error URL:** `/api/heroes/BVLjZQcGYX1jawVyHSd6`

---

## 🔍 Root Cause

The `updateHero` API expects a **user ID** (Twitch ID), but we were using `user.id` which might not be the correct identifier. The backend needs the Twitch user ID to update the hero.

---

## ✅ Fix Applied

Changed from:
```typescript
await heroAPI.updateHero(user.id, { founderBadge: badgePath });
```

To:
```typescript
const userId = user?.twitchId || user?.id;
await heroAPI.updateHero(userId, { founderBadge: badgePath });
```

This matches the pattern used elsewhere in the codebase (e.g., in `deleteHero`).

---

## 📝 Files Updated

1. **`src/components/HeroDashboard.tsx`**
   - Fixed `handleBadgeChange` to use `user?.twitchId || user?.id`

2. **`src/components/AchievementsPanel.tsx`**
   - Fixed badge selection to use `user?.twitchId || user?.id`

---

## 🔧 Additional Notes

- The `updateHero` API endpoint is: `PUT /api/heroes/${userId}`
- It expects the user's Twitch ID (or user ID) to identify which hero to update
- The backend then updates the active hero for that user

---

**The fix should resolve the 404 error!**
