# 🎯 Raid Mode Refactor - Progress Update

**Goal:** Make raid mode look and work EXACTLY like idle adventure

---

## ✅ **COMPLETED** (Steps 1, 2, 5)

### **Step 1: Hero Positioning** ✅
- ✅ Raid heroes now use `getHeroPosition()` (same as idle)
- ✅ Tanks in front row, DPS/healers in back row
- ✅ Same spacing and layout

### **Step 2: Boss Positioning** ✅  
- ✅ Raid boss uses `getEnemyPosition()` (same as idle)
- ✅ Centered on right side
- ✅ Larger scale (4.0) for boss

### **Step 5: Animations & SCT** ✅
- ✅ Hero sprites with full animations (attack, hurt, death)
- ✅ Boss sprite with animations
- ✅ Shield glow effect
- ✅ Enrage effect
- ✅ HP bars with smooth transitions
- ✅ Death skull emoji
- ✅ SCT messages (all types)

---

## 🔄 **IN PROGRESS** (Steps 3, 4)

### **Step 3: Wave Enemies** 
**Status:** TODO

**Plan:**
- Add `currentEnemies` array to instance data
- Before boss, spawn wave enemies (trash mobs)
- Use same enemy rendering as idle
- When wave cleared, spawn next wave
- Final wave = boss

### **Step 4: Boss Mechanics**
**Status:** TODO

**Plan:**
- HP threshold triggers (75%, 50%, 25%)
- Special abilities:
  - Fire Breath (AoE damage)
  - Tail Swipe (knockback)
  - Summon Adds (spawn minions)
  - Enrage (damage boost)
- Mechanic indicators (visual warnings)

---

## 🎯 **NEXT STEPS**

### **Quick Win: Test Current State**

**What Works Now:**
- ✅ Raid mode displays heroes (same as idle)
- ✅ Raid mode displays boss (same as idle)
- ✅ Sprites, HP bars, animations all work
- ✅ Smooth fade transitions
- ⚠️ Combat runs (simplified version)

**Test It:**
```bash
node create-test-raid-instance.js
```

Then refresh browser - should look exactly like idle adventure!

---

### **Option A: Wire Up Full Combat System** (30 min)

**Current State:**
- Raid uses simplified `raidCombatRound` (basic damage only)
- Idle uses full `startCombatRound` (abilities, healing, resurrection, etc.)

**Solution:**
Instead of two separate systems, make ONE system work for both!

**Steps:**
1. Remove simplified `raidCombatRound`
2. Make `startCombatRound` check `gameMode`
3. If raid mode:
   - Use `instanceData.participants` as heroes
   - Use `instanceData.boss` as enemy
4. Trigger combat in raid mode

**Result:**
- Raids get full combat system (abilities, healing, buffs, etc.)
- Healers actually heal!
- Tanks use taunt!
- DPS use abilities!
- Same combat as idle adventure!

---

### **Option B: Add Wave System** (1 hour)

**Add enemies before boss:**
```typescript
const raidEnemies = [];

// If still on trash waves, show wave enemies
if (instanceData.currentWave < instanceData.waves) {
  // Generate wave enemies
  raidEnemies.push(...instanceData.currentEnemies);
}

// If final wave or boss wave, show boss
if (instanceData.currentWave === instanceData.waves || instanceData.showBoss) {
  raidEnemies.push(raidBoss);
}
```

**Wave progression:**
- Wave 1-4: Trash mobs (2-3 enemies)
- Wave 5: Boss

---

### **Option C: Add Boss Mechanics** (2 hours)

**HP Threshold Mechanics:**
```typescript
// In raid combat, check boss HP %
const bossHpPercent = boss.hp / boss.maxHp;

if (bossHpPercent <= 0.75 && !boss.phase2Triggered) {
  // PHASE 2: Fire Breath!
  triggerBossMechanic('fireBreath');
  boss.phase2Triggered = true;
}

if (bossHpPercent <= 0.50 && !boss.phase3Triggered) {
  // PHASE 3: Summon Adds!
  spawnAddEnemies(2);
  boss.phase3Triggered = true;
}

if (bossHpPercent <= 0.25 && !boss.phase4Triggered) {
  // PHASE 4: ENRAGE!
  boss.attack *= 2;
  boss.phase4Triggered = true;
  addSCT('ENRAGED!', bossX, bossY, 'crit');
}
```

---

## 🎮 **RECOMMENDATION**

**Start with Option A** (wire up full combat) because:
1. ✅ Gives full combat system to raids (abilities, healing, etc.)
2. ✅ Reuses existing code (no duplication)
3. ✅ Quick win (~30 minutes)
4. ✅ Makes raids feel complete

**Then add Option B** (waves) and Option C** (mechanics) for polish!

---

## 📊 **Overall Status**

**Raid Mode:**
- Visual: 95% complete ✅
- Combat: 60% complete (simplified version works)
- Waves: 0% complete
- Mechanics: 0% complete

**What's Working:**
- Mode switching with fade transitions
- Hero/boss positioning and rendering
- HP bars and animations
- SCT messages
- Basic combat (damage only)

**What's Missing:**
- Full combat system (abilities, healing, buffs)
- Wave enemies before boss
- Boss mechanics (abilities, phases)
- Loot distribution
- Victory/defeat screens

---

**Ready to wire up full combat?** 🚀
