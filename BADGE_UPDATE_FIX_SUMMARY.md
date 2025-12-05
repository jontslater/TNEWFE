# Badge Update 404 Error - Fix Summary

**Error:** 
```
3001/api/heroes/BVLjZQcGYX1jawVyHSd6:1  
Failed to load resource: the server responded with a status of 404 (Not Found)
HeroDashboard.tsx:85 Failed to update badge: AxiosError
```

---

## 🔍 Problem Analysis

The error URL `/api/heroes/BVLjZQcGYX1jawVyHSd6` shows a **hero document ID**, but `updateHero` expects a **user ID** (Twitch ID).

The API endpoint is: `PUT /api/heroes/${userId}`

---

## ✅ Fix Applied

Changed the code to use `user?.twitchId || user?.id` instead of just `user.id` to ensure we're using the correct user identifier that the backend expects.

**Updated Files:**
1. `src/components/HeroDashboard.tsx` - `handleBadgeChange` function
2. `src/components/AchievementsPanel.tsx` - Badge selection handlers

---

## 🎯 Expected Behavior

- Uses Twitch ID (`user?.twitchId`) as the primary identifier
- Falls back to `user?.id` if Twitch ID is not available
- Matches the pattern used elsewhere in the codebase

---

## ⚠️ If Issue Persists

If the 404 error continues after this fix, possible causes:

1. **Backend Route Mismatch**: The backend might expect a different route structure
   - Check if backend uses `/api/heroes/twitch/${userId}` (like `getHero` does)
   - Or if it needs hero document ID instead

2. **Backend Not Updated**: Backend might not have the `founderBadge` field support yet
   - Backend needs to accept `founderBadge` in the update payload
   - Backend needs to save it to the hero document

3. **User ID Format**: The Twitch ID format might not match what backend expects

**Next Steps if Error Continues:**
- Check backend route handlers for hero updates
- Verify backend accepts `founderBadge` field
- Check backend logs for more detailed error message
- Consider using hero document ID if backend requires it

---

**Status:** Fix applied - ready for testing. If error persists, check backend route structure.
