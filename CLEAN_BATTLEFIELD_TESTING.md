# Clean Battlefield Source - Testing Guide

## ✅ Step 1: Display Heroes ONLY

**What was built:**
- Brand new component: `CleanBattlefieldSource.tsx`
- Only displays heroes (nothing else)
- Transparent background (OBS ready)
- Auto-positioning (heroes on left side)

---

## 🧪 **Test Step 1**

### **Setup:**
1. Make sure frontend dev server is running
2. Make sure backend is running
3. Have at least one hero on a battlefield

### **Test URL:**
```
http://localhost:5173/clean-battlefield?battlefieldId=twitch:1087777297
```

**Replace `1087777297` with your actual Twitch user ID!**

### **What You Should See:**

**Top-left corner debug info:**
```
Battlefield: twitch:1087777297
Heroes: 2
```

**Hero display (left side):**
```
┌─────────────────────┐
│ theneverendingwar   │
│     (Lv 66)         │
├─────────────────────┤
│ ████████░░  80/100  │ ← HP bar (green if > 50%)
├─────────────────────┤
│        🛡️           │ ← Role icon (placeholder)
│      guardian       │
└─────────────────────┘

(If second hero exists, shows below first one)
```

### **Background:**
- ✅ Should be transparent (checkerboard pattern in browser)
- ✅ Perfect for OBS chroma key

---

## ✅ **Checklist**

Test each item:
- [ ] Page loads without errors
- [ ] Debug info shows correct battlefield ID
- [ ] Debug info shows correct hero count
- [ ] Each hero shows:
  - [ ] Name and level
  - [ ] HP bar (correct color based on HP %)
  - [ ] HP numbers (current / max)
  - [ ] Role icon
  - [ ] Role name
- [ ] Heroes positioned on left side
- [ ] Multiple heroes stack vertically
- [ ] Background is transparent
- [ ] No console errors

---

## 🐛 **If Something's Wrong**

### **"No heroes on this battlefield" shows:**
**Check:**
1. Battlefield ID in URL matches hero's `currentBattlefieldId` in Firebase
2. Hero exists in Firebase with correct `currentBattlefieldId`
3. Use numeric format: `twitch:1087777297` (not username!)

**Fix:**
- Type `!join` in Twitch chat to set `currentBattlefieldId`
- Or check Firebase Console to see what battlefield ID heroes have

### **Console errors about Firebase:**
**Check:**
- Firebase initialized correctly?
- Check browser console for Firebase errors
- Verify Firebase config in `firebase.ts`

### **Heroes don't appear:**
**Check:**
- Backend running?
- Firebase rules allow reads?
- Network tab shows Firebase requests?

---

## 📊 **Expected Console Output**

```
[Firebase] Initializing Firebase...
[Firebase] ✅ Firestore initialized
[CleanBattlefield] Loading heroes for battlefield: twitch:1087777297
[CleanBattlefield] Loaded 2 heroes: ["theneverendingwar", "tehchno"]
```

---

## 🎯 **Success Criteria**

✅ **Step 1 Complete When:**
- Heroes load from Firebase
- Heroes display on left side
- HP bars show correct values
- Names and levels correct
- Background transparent
- No errors in console

---

## 🚀 **Next Steps After Step 1**

Once Step 1 works perfectly:

**Step 2:** Add actual hero sprites (replace icon placeholders)
**Step 3:** Add enemy sprites (right side)
**Step 4:** Add local adventure loop
**Step 5:** Add combat system
**Step 6:** Add animations
**Step 7:** Continue incrementally...

---

## 📝 **Testing Notes**

**Browser to use:** Chrome/Edge (best for OBS browser source)

**OBS Testing:**
1. After confirming it works in browser
2. Add Browser Source in OBS
3. URL: `http://localhost:5173/clean-battlefield?battlefieldId=twitch:YOUR_ID`
4. Width: 1920
5. Height: 1080
6. ✅ Check "Shutdown source when not visible"
7. ✅ Check "Refresh browser when scene becomes active"

**Expected in OBS:**
- Heroes visible
- Transparent background (no black/white)
- Smooth display
- Updates when heroes join/leave

---

## ✅ **Ready to Test!**

**Test URL (update with your Twitch ID):**
```
http://localhost:5173/clean-battlefield?battlefieldId=twitch:1087777297
```

1. Open in browser
2. Check console logs
3. Verify heroes appear
4. Report back with results!

**What do you see?** Share:
- Screenshot or description
- Console logs
- Any errors

Let me know and we'll proceed to Step 2! 🎯



