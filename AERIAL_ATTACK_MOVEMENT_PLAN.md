# 🐉 Aerial Attack Movement - Implementation Plan

**Goal:** Dragon flies to hero, breathes fire, returns to position

---

## 🎯 **SEQUENCE:**

```
1. RISE (at original position)
   ↓
2. FLIGHT + MOVE toward hero (smooth translation)
   ↓
3. SPECIAL at hero position (fire breath)
   ↓
4. FLIP facing (turn around)
   ↓
5. FLIGHT + MOVE back to original position
   ↓
6. FLIP facing back (face hero again)
   ↓
7. LANDING (at original position)
   ↓
8. IDLE (back to normal)
```

---

## 🔧 **IMPLEMENTATION:**

### **Step 1: Store original position**
```typescript
const originalPosition = {
  x: enemyElement.style.left,
  y: enemyElement.style.top
};
```

### **Step 2: Get hero position**
```typescript
const heroElement = document.querySelector(`[data-hero-id="${targetHeroId}"]`);
const heroRect = heroElement.getBoundingClientRect();
const targetX = heroRect.left;
const targetY = heroRect.top;
```

### **Step 3: Animate movement**
```typescript
// Rise at original position
enemyRef.playAnimation('rise');

// After rise, move toward hero while in flight
setTimeout(() => {
  enemyRef.playAnimation('flight');
  enemyElement.style.transition = 'all 2s ease-in-out';
  enemyElement.style.left = `${targetX}px`;
  enemyElement.style.top = `${targetY - 100}px`; // Fly above hero
}, 1260);

// At hero, breathe fire
setTimeout(() => {
  enemyRef.playAnimation('special');
}, 3420);

// Turn back and return
setTimeout(() => {
  enemyElement.style.transform = 'scaleX(-1)'; // Flip
  enemyRef.playAnimation('flight');
  enemyElement.style.left = originalPosition.x;
  enemyElement.style.top = originalPosition.y;
}, 5580);

// Land at original position
setTimeout(() => {
  enemyElement.style.transform = 'scaleX(1)'; // Flip back
  enemyRef.playAnimation('landing');
}, 7740);

// Back to idle
setTimeout(() => {
  enemyRef.playAnimation('idle');
}, 8640);
```

---

## ⏱️ **TIMING:**

- Rise: 1260ms
- Flight to hero: 2160ms
- Special: 2160ms
- Flight back: 2160ms
- Landing: 900ms
- **Total: ~8.6 seconds**

---

## 🎯 **THIS WILL LOOK EPIC!**

Dragon literally flies across the screen to breathe fire at the hero!

**Ready to implement?** 🚀
