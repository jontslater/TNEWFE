# 🐉 Dragon Sprite Shifting Issue

**Problem:** Animations are "shifting horizontally" instead of playing in place

**Cause:** Likely incorrect `frameWidth` in sprite animation data

---

## 🔍 **DIAGNOSIS:**

If Dragon_1 sprites are **horizontal strips** (all frames in one image):
- Image width = frameWidth × frameCount
- Example: 4 frames, 256px each = 1024px wide image

If `frameWidth` is wrong:
- Too small → Sprite shifts left (shows partial frames)
- Too large → Sprite shifts right (skips frames)

---

## 🧪 **TEST PLAN:**

**Use the animation test buttons to check each one:**

### **Animations to Test:**
1. **Idle** (7 frames) - Should loop smoothly
2. **Attack 1** (4 frames) - Quick swipe in place
3. **Attack 2** (10 frames) - Heavy bite in place
4. **Hurt** (4 frames) - Flinch in place (CURRENTLY SHIFTS!)
5. **Special** (12 frames) - Fire breath in place
6. **Walk** (12 frames) - Walking animation
7. **Rise** (7 frames) - Taking off
8. **Flight** (12 frames) - Hovering
9. **Landing** (5 frames) - Landing
10. **Dead** (3 frames) - Death in place

---

## 🔧 **CURRENT SETTINGS:**

All Dragon_1 animations:
- `frameWidth: 256`
- `frameHeight: 256`

**If images are different sizes, we need to adjust!**

---

## 📏 **TO FIX:**

**Option A:** Check actual image dimensions
- Open Hurt.png in image editor
- Check width and height
- Calculate: frameWidth = totalWidth / frameCount

**Option B:** Try different frame widths
- If shifting left: Increase frameWidth
- If shifting right: Decrease frameWidth

---

**Test each animation with the buttons and tell me which ones shift!** 🎮


