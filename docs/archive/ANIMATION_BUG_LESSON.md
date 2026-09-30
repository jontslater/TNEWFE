# Critical Animation Bug - Sprite Key Issue

**Date:** December 2, 2025  
**Severity:** CRITICAL - Breaks all animations  
**Status:** ✅ FIXED

---

## 🐛 The Bug

**Symptom:**
- Attack animations start but snap back to idle mid-animation
- First attack in combat works perfectly
- Second+ attacks interrupt and don't complete
- Enemy animations work fine, hero animations broken
- Not turn-based feeling

**Root Cause:**
```typescript
// BROKEN CODE:
const spriteKey = hero.isDead 
  ? `${hero.id}-dead` 
  : `${hero.id}-alive-${hero.hp}`; // ❌ INCLUDES HP!

<HeroSpriteJS key={spriteKey} />
```

**What Happens:**
1. Hero has 3000 HP → key: `hero-alive-3000`
2. Hero takes 500 damage → 2500 HP
3. Component re-renders
4. New key: `hero-alive-2500` ← KEY CHANGED!
5. React sees different key → REMOUNTS entire component
6. Sprite component recreates → All state lost
7. Animation INTERRUPTED mid-play! ❌

**Every damage tick remounted the sprite component!**

---

## ✅ The Fix

```typescript
// FIXED CODE:
const spriteKey = hero.isDead 
  ? `${hero.id}-dead` 
  : `${hero.id}-alive`; // ✅ NO HP!

<HeroSpriteJS key={spriteKey} />
```

**What Happens:**
1. Hero has 3000 HP → key: `hero-alive`
2. Hero takes 500 damage → 2500 HP
3. Component re-renders
4. Same key: `hero-alive` ← KEY UNCHANGED!
5. React keeps component instance
6. Sprite state preserved
7. Animation COMPLETES! ✅

**Component only remounts on death/resurrection!**

---

## 🎓 The Lesson

**NEVER include frequently-changing values in component keys for animated sprites:**

### ❌ BAD - Breaks Animations:
```typescript
key={`sprite-${hero.hp}`}           // Changes every damage
key={`sprite-${hero.shield}`}       // Changes every shield update  
key={`sprite-${hero.level}`}        // Changes on level up
key={`sprite-${animationState}`}    // Changes constantly
```

### ✅ GOOD - Preserves Animations:
```typescript
key={hero.id}                       // Stable ID
key={`${hero.id}-${hero.isDead}`}  // Only changes on death state
key={hero.isDead ? 'dead' : 'alive'} // Only changes on death/resurrection
```

---

## 🔍 Why Enemy Animations Worked

**Enemies don't have changing keys!**
```typescript
<EnemySpriteJS key={enemy.id} /> // Simple, stable key
```

Enemies take damage too, but their key doesn't change, so no remounting!

---

## 🛠️ How to Debug Similar Issues

**Symptoms:**
- Animations work first time, fail subsequent times
- Animations interrupt mid-play
- One entity type works, another doesn't
- State updates seem to break animations

**Check for:**
1. Component key includes changing values?
2. Component remounting unnecessarily?
3. React DevTools → Components → Check if component unmounts/remounts

**Fix:**
- Remove changing values from keys
- Use stable identifiers only
- Force remount only when intentional (death, etc.)

---

## 📊 Impact

**Before Fix:**
- Hero attacks: Broken (interrupted)
- Combat felt janky
- Visual feedback poor
- Turn-based flow broken

**After Fix:**
- Hero attacks: Perfect ✅
- Combat feels smooth ✅
- Visual feedback excellent ✅
- True turn-based feel ✅

---

## ⚠️ Remember This!

**If animations break in the future, CHECK THE KEYS FIRST!**

This bug wasted hours because it seems like a timing issue when it's actually a React rendering issue. The fix is simple but the diagnosis is hard.

**Golden Rule:** Sprite component keys should be as stable as possible. Only change them when you WANT to force a remount.




