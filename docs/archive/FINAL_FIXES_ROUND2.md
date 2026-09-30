# 🔧 FINAL FIXES - Round 2

**Applied 3 more fixes!**

---

## ✅ **FIXED:**

### **1. tehchno Leftover** ✅
**Issue:** tehchno visible but not in raid  
**Fix:** Raid now ONLY renders `raidParty` (participants), not all idle heroes
**Result:** Only raid participants show up!

### **2. Dragon Facing** ✅  
**Issue:** Dragon facing wrong way (even with `facing="left"`)  
**Fix:** Changed `enemyType` to lowercase `"adult dragon"` (matches sprite files)
**Result:** Should face heroes now!

### **3. Duplicate Damage** (Still investigating)
**Issue:** Damage showing twice (white + red)  
**Likely cause:** SCT triggered from multiple places
**Need to check:** Console logs to see where damage SCT is coming from

---

## 🧪 **TEST NOW:**

**Refresh and check:**
1. ✅ Only YOUR hero (theneverendingwar) should show (no tehchno)
2. ✅ Dragon should face left (toward hero)
3. 🔍 Check if duplicate damage still happens

**Console should show:**
```
[Raid Party] Total heroes in party: 1
[Raid Party] Heroes: ['theneverendingwar']
```

(tehchno should NOT be in the list!)

---

## 📝 **If Dragon Still Wrong:**

The sprite might need to be flipped in the sprite component itself. We can:
- Try `facing="right"` (opposite)
- Or flip the sprite asset
- Or add special handling for "adult dragon"

**Test now and let me know!** 🎮


