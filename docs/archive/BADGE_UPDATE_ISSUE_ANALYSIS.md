# Badge Update 404 Error Analysis

**Error:**
```
3001/api/heroes/BVLjZQcGYX1jawVyHSd6:1  
Failed to load resource: the server responded with a status of 404 (Not Found)
HeroDashboard.tsx:85 Failed to update badge: AxiosError
```

---

## 🔍 Analysis

The error URL shows: `/api/heroes/BVLjZQcGYX1jawVyHSd6`

This looks like a **hero document ID**, not a user ID. But `updateHero` expects a `userId` parameter.

Looking at the API:
- `updateHero(userId: string, updates: Partial<Hero>)` calls `PUT /api/heroes/${userId}`
- The backend endpoint expects a user ID (Twitch ID), not a hero document ID

---

## ✅ Fix Applied

Changed from using `user.id` to using `user?.twitchId || user?.id` to ensure we use the Twitch user ID, which is what the backend expects.

**Files Updated:**
1. `src/components/HeroDashboard.tsx` - `handleBadgeChange` function
2. `src/components/AchievementsPanel.tsx` - Badge selection onClick handlers

---

## 🎯 Expected Behavior

- Uses Twitch ID (`user?.twitchId`) as primary identifier
- Falls back to `user?.id` if Twitch ID not available
- Matches pattern used elsewhere (e.g., `deleteHero` uses `user?.twitchId || user?.id`)

---

## ⚠️ If Issue Persists

If the 404 error continues, the backend might:
1. Expect a different endpoint structure
2. Need hero document ID instead of user ID
3. Have a different route for updating hero fields

Check the backend route structure and adjust accordingly.

---

**Status:** Fix applied, ready for testing

