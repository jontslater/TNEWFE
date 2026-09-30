# 🐉 Wiring Dragon_1 Animations

**Plan to use all 10 animations in combat!**

---

## 📋 **STEP 1: Attack Variants**

**Current:** Only uses "attack" animation  
**Goal:** Randomly pick attack/attack2/special

**Where to change:** Enemy attack execution code

**Logic:**
```typescript
// When dragon attacks
const attackRoll = Math.random();
let attackAnim = 'attack';

if (attackRoll < 0.10) {
  attackAnim = 'special';  // 10% chance - fire breath
} else if (attackRoll < 0.30) {
  attackAnim = 'attack2';  // 20% chance - heavy attack
} else {
  attackAnim = 'attack';   // 70% chance - normal attack
}

enemyRef.playAnimation(attackAnim);
```

---

## 📋 **STEP 2: Walk on Spawn**

**Goal:** Play walk animation when dragon first appears

**Logic:**
```typescript
// When enemy spawns
useEffect(() => {
  if (enemy.name.includes('Dragon')) {
    enemyRef.playAnimation('walk');
    setTimeout(() => {
      enemyRef.playAnimation('idle');
    }, 2160); // Walk duration
  }
}, [enemy.id]);
```

---

## 📋 **STEP 3: Aerial Attack Sequence**

**Goal:** Rise → Flight → Landing for special attacks

**Logic:**
```typescript
// When dragon uses special attack
const playAerialAttack = async () => {
  await enemyRef.playAnimation('rise');    // 7 frames, 1260ms
  await enemyRef.playAnimation('flight');  // 12 frames, 2160ms
  // Deal damage here
  await enemyRef.playAnimation('landing'); // 5 frames, 900ms
  enemyRef.playAnimation('idle');          // Back to idle
};
```

---

## 🎯 **IMPLEMENTATION ORDER:**

1. **Find enemy attack code** (where `enemyRef.playAnimation('attack')` is called)
2. **Add attack variant logic** (pick attack/attack2/special)
3. **Test attack variants work**
4. **Add walk on spawn** (nice to have)
5. **Add aerial sequence** (advanced)

---

**Starting with Step 1: Find enemy attack code!**


