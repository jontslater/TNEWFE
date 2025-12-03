# Clean Battlefield - Dungeon/Raid Integration Plan

**Date:** December 3, 2025  
**Approach:** Step-by-step like Clean Battlefield build yesterday

---

## ✅ **What We Have:**

### **Already Built:**
- ✅ Clean Battlefield (idle adventure) - 4600 lines, WORKING!
- ✅ RaidBrowserSourcePage (raid combat) - Exists, server-authoritative
- ✅ Raid System utilities (`raidSystem.ts`) - Boss mechanics, waves, scaling
- ✅ Queue system (Jackbox-style codes) - JUST BUILT!
- ✅ Mode detection (`useActiveInstanceListener`) - JUST ADDED!
- ✅ Mode switching UI (placeholder) - JUST ADDED!

### **What's Missing:**
- ❌ Actual dungeon/raid combat in Clean Battlefield
- ❌ Use existing raid combat logic
- ❌ Instance completion handling
- ❌ Return to idle after completion

---

## 🎯 **THE PLAN - Step-by-Step**

### **Step 1: Display Raid Party in Raid Mode** (30 min)
**Goal:** Show all participants with health bars

**Tasks:**
- Use existing HeroSpriteJS component
- Position party members on left side
- Show HP bars from instance data
- Real-time HP updates

**Files:**
- `CleanBattlefieldSource.tsx` - Raid mode rendering

**Success:** See all raid participants with sprites and HP

---

### **Step 2: Display Raid Boss** (30 min)
**Goal:** Show raid boss with HP bar and mechanics

**Tasks:**
- Use existing EnemySpriteJS component
- Position boss on right side
- Show boss HP bar
- Display boss name and level

**Files:**
- `CleanBattlefieldSource.tsx` - Boss rendering

**Success:** See raid boss sprite with HP

---

### **Step 3: Implement Raid Combat Loop** (1 hour)
**Goal:** Use existing raid combat logic

**Tasks:**
- Import combat logic from RaidBrowserSourcePage
- Heroes attack boss
- Boss uses mechanics
- Damage syncs to Firebase (server-authoritative)
- Combat text shows damage/healing

**Files:**
- `CleanBattlefieldSource.tsx` - Raid combat
- Reuse code from `RaidBrowserSourcePage.tsx`

**Success:** Combat works, HP updates, boss takes damage

---

### **Step 4: Raid Wave System** (30 min)
**Goal:** Progress through waves before boss

**Tasks:**
- Spawn trash mobs for waves 1-N
- Combat each wave
- Progress to next wave after victory
- Final wave spawns boss

**Files:**
- `CleanBattlefieldSource.tsx` - Wave progression

**Success:** Waves progress, boss appears on final wave

---

### **Step 5: Boss Mechanics** (1 hour)
**Goal:** Bosses use special abilities

**Tasks:**
- Trigger mechanics at HP thresholds
- Cooldown tracking
- AoE damage
- Add spawning
- Visual indicators

**Files:**
- `CleanBattlefieldSource.tsx` - Mechanics
- `raidSystem.ts` - Utilities (already exists)

**Success:** Boss uses abilities, mechanics trigger

---

### **Step 6: Raid Completion** (30 min)
**Goal:** Detect victory/defeat, return to idle

**Tasks:**
- Detect boss death → Victory
- Detect party wipe → Defeat
- Distribute loot and XP
- Clear currentInstanceId
- Return to idle mode automatically

**Files:**
- `CleanBattlefieldSource.tsx` - Completion logic
- Backend - Instance status updates

**Success:** Raid completes, returns to idle adventure

---

### **Step 7: Dungeon System** (1-2 hours)
**Goal:** Similar to raids but with room progression

**Tasks:**
- Copy raid combat logic
- Adapt for dungeons (5 rooms instead of waves)
- Room-by-room progression
- Final room = boss

**Files:**
- `CleanBattlefieldSource.tsx` - Dungeon mode

**Success:** Dungeons work like mini-raids

---

## 📊 **Current Status**

### ✅ **Infrastructure Ready:**
- Mode switching ✅
- Queue system ✅
- Instance detection ✅
- Firebase listeners ✅
- Placeholder UI ✅

### ⏳ **Need to Build:**
- Raid combat integration
- Boss mechanics
- Wave/room progression
- Completion handling
- Dungeon combat

---

## 🚀 **TODAY'S PLAN**

### **Session 1: Raid Foundation** (2-3 hours)
1. ✅ Step 1: Display raid party
2. ✅ Step 2: Display raid boss
3. ✅ Step 3: Implement raid combat loop

**Goal:** Basic raid combat working

### **Session 2: Boss Mechanics** (1-2 hours)
4. ✅ Step 4: Wave system
5. ✅ Step 5: Boss mechanics

**Goal:** Full raid experience

### **Session 3: Completion & Dungeons** (1-2 hours)
6. ✅ Step 6: Raid completion
7. ✅ Step 7: Dungeon system

**Goal:** Complete dungeon/raid integration

---

## 🎯 **Start with Step 1?**

**Step 1: Display Raid Party**
- Show all participants from `instanceData.participants`
- Use existing HeroSpriteJS component
- Position on left side
- HP bars from instance data

**This builds on what we did yesterday!** Same step-by-step approach! 🚀

**Ready to start?**
