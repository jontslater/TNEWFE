# 🐉 Dragon Animation Combat Plan

**Goal:** Use ALL 10 dragon animations in combat!

---

## 📋 **ANIMATION USAGE:**

### **IDLE (7 frames)**
**When:** Default state, waiting for turn
**Usage:** Base animation when not attacking or hurt

### **ATTACK 1 (4 frames)**
**When:** Normal attacks (70% of attacks)
**Usage:** Standard melee/claw attack

### **ATTACK 2 (10 frames)**
**When:** Heavy attacks (20% of attacks)
**Usage:** Stronger melee attack, more dramatic

### **SPECIAL (12 frames)**
**When:** Critical hits or special abilities (10% of attacks)
**Usage:** Fire breath, tail swipe, or other special moves

### **HURT (4 frames)**
**When:** Taking damage
**Usage:** Flinch/recoil when hit

### **DEAD (3 frames)**
**When:** HP reaches 0
**Usage:** Death animation, then corpse stays

### **RISE (7 frames)**
**When:** Starting flight attack sequence
**Usage:** Transition: ground → air

### **FLIGHT (12 frames)**
**When:** During aerial attack
**Usage:** Hovering/flying (loops during flight)

### **LANDING (5 frames)**
**When:** Finishing flight attack sequence
**Usage:** Transition: air → ground

### **WALK (12 frames)**
**When:** Entering combat, repositioning
**Usage:** Could play when dragon first spawns

---

## 🎯 **COMBAT FLOW:**

### **Basic Combat Round:**
```
1. IDLE (waiting)
   ↓
2. ATTACK (pick variant):
   - 70%: ATTACK 1 (quick claw)
   - 20%: ATTACK 2 (heavy bite)
   - 10%: SPECIAL (fire breath)
   ↓
3. Return to IDLE
```

### **Special: Aerial Attack** (Rare)
```
1. IDLE
   ↓
2. RISE (take off)
   ↓
3. FLIGHT (hover and breathe fire)
   ↓
4. LANDING (return to ground)
   ↓
5. Back to IDLE
```

### **Taking Damage:**
```
IDLE/ATTACK → HURT → Return to previous
```

### **Death:**
```
ANY STATE → DEAD (stays dead)
```

### **Spawn:**
```
WALK (enter scene) → IDLE (ready for combat)
```

---

## 🎮 **IMPLEMENTATION PLAN:**

### **Phase 1: Update Animation Data** (5 min)
Add all 10 animations to `spriteAnimationData.ts` with correct frame counts

### **Phase 2: Basic Combat Animations** (10 min)
- Idle (default)
- Attack 1 (70%)
- Attack 2 (20%)
- Special (10%)
- Hurt (when damaged)
- Dead (when killed)

### **Phase 3: Advanced Sequences** (15 min)
- Walk on spawn
- Rise → Flight → Landing for aerial attacks
- Special abilities trigger flight sequence

### **Phase 4: Boss Mechanics** (10 min)
- At 75% HP: Aerial attack (Rise → Flight → Landing + AoE damage)
- At 50% HP: Special attack (ground fire breath)
- At 25% HP: Enrage (faster attacks, Attack 2 only)

---

## 🚀 **START WITH PHASE 1:**

Update `spriteAnimationData.ts` with ALL frame counts you provided!

**Ready to start?** 🐉


