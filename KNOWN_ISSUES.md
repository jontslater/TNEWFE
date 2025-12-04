# Known Issues

## 🐛 Tank Sprite !leave Display Bug

### **Issue**
When using `!leave` with a tank sprite hero, the sprite doesn't disappear from display until page refresh.

**Affected:**
- Tank roles: Guardian, Paladin, Warden, Bloodknight, Vanguard, Brewmaster
- Only affects visual display (hero IS removed from Firebase correctly)
- Refresh shows correct state

**Not Affected:**
- Melee DPS sprites: Berserker, Monk, etc. (work correctly)
- Backend logic (works correctly)
- Persistence (works correctly)

### **Reproduction Steps**
1. Join with tank hero: `!join 2` (where hero 2 is a tank)
2. Type: `!leave`
3. ❌ Hero sprite stays visible
4. Refresh page (F5)
5. ✅ Hero correctly gone

### **Workaround**
- Press F5 after `!leave` with tank hero
- Or switch to different hero: `!join 1`
- Backend state is correct - just visual display issue

### **Root Cause**
Unknown - likely related to:
- Tank sprite rendering/caching
- Huge-knight-sprite class handling
- Animation refs not clearing properly
- Combat engine not updating tank sprites

### **Priority**
**Low** - Doesn't affect gameplay, just requires refresh

### **Future Fix**
- Investigate sprite ref cleanup for tank roles
- Check if huge-knight-sprite class has different rendering behavior
- Add forced sprite removal on !leave regardless of role

---

## ✅ Fixed Issues

### Heroes Not Persisting Through Reload ✅
**Status:** FIXED
- Changed battlefield ID format to numeric
- Auto-converts username to numeric
- Heroes persist correctly

### Heroes Not Removed From Old Battlefield ✅
**Status:** FIXED  
- Broadcasts removal to old battlefield
- Uses numeric Twitch ID (no lookup needed)
- Removes all user's other heroes from all battlefields

### 404 Error Spam ✅
**Status:** FIXED
- Auto-removes deleted heroes from combat engine
- Stops sync attempts for non-existent heroes
- Clear warning messages

### localStorage Pollution ✅
**Status:** FIXED
- Auto-cleans old format keys on mount
- Auto-clears removedHeroIds for heroes in Firebase
- Consistent state management



