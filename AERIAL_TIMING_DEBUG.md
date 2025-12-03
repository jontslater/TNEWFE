# 🐉 Aerial Attack Timing Adjustment

**Current Sequence Timing:**

```
0ms:     Rise starts (7 frames, 1260ms)
1260ms:  Flight starts (12 frames, 2160ms)
3420ms:  Special starts (12 frames, 2160ms)
5580ms:  Flight back starts (12 frames, 2160ms)
7740ms:  Landing starts (5 frames, 900ms)
8640ms:  Idle starts
```

---

## 🔍 **GAPS TO CHECK:**

**Test each transition:**

1. **Rise → Flight**
   - Does Rise finish smoothly before Flight starts?
   - Gap? Overlap?

2. **Flight → Special**
   - Does Flight finish before Special?
   - Gap? Overlap?

3. **Special → Flight back**
   - Smooth transition?
   - Gap? Overlap?

4. **Flight back → Landing**
   - Does Flight finish before Landing?
   - Gap? Overlap?

5. **Landing → Idle**
   - Clean finish?
   - Gap? Overlap?

---

## 🔧 **ADJUSTMENT OPTIONS:**

**If there's a GAP (pause between animations):**
- Reduce the delay (start next animation earlier)
- Example: Change `3420` to `3200` (start 220ms earlier)

**If there's OVERLAP (next starts too early):**
- Increase the delay
- Example: Change `3420` to `3600` (start 180ms later)

---

## 🧪 **TEST:**

Use `/dragon-test` page:
1. Click "✨ SPECIAL (Full Sequence)"
2. Watch for gaps/overlaps
3. Tell me which transitions need adjustment

**Which transitions have gaps?** 🎯
