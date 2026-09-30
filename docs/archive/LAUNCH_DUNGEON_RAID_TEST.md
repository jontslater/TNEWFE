# Launch Dungeon & Raid Testing Plan

**Date:** January 2025  
**Goal:** Verify the two launch instances work perfectly

---

## 🎯 **LAUNCH INSTANCES**

### **1. Goblin Cave (Dungeon)**
- **Type:** Solo
- **Level:** 10+
- **Item Score:** 200+
- **Rooms:** 3 (Entrance → Main Chamber → Goblin Chief)
- **Rewards:** 200g, 5 tokens, 500 XP, guaranteed weapon

### **2. Corrupted Temple (Raid)**
- **Type:** Group Raid
- **Level:** 15+
- **Item Score:** 500+
- **Players:** 3-5 (1 tank, 1 healer, 1-3 DPS)
- **Waves:** 3
- **Boss:** Corrupted High Priest
- **Rewards:** 500g, 10 tokens, 2000 XP, guaranteed weapon/armor

---

## 🧪 **TESTING CHECKLIST**

### **A. Goblin Cave (Solo Dungeon)**

#### **1. Queue System:**
- [ ] Can queue for Goblin Cave (solo)
- [ ] Queue shows correct requirements (Level 10+, 200+ item score)
- [ ] Queue status updates correctly
- [ ] Can leave queue

#### **2. Instance Creation:**
- [ ] Instance creates immediately (solo, no matchmaking needed)
- [ ] Player spawns in dungeon
- [ ] All 3 rooms load correctly

#### **3. Room Progression:**
- [ ] Room 1: Entrance (3 Goblins, Level 10)
- [ ] Room 2: Main Chamber (5 Goblins, Level 12)
- [ ] Room 3: Goblin Chief's Lair (1 Goblin Chief, Level 15, Boss)

#### **4. Combat:**
- [ ] Enemies spawn correctly in each room
- [ ] Combat mechanics work (damage, healing, death)
- [ ] Room progression works (advance when enemies cleared)
- [ ] Final room completion marks dungeon complete

#### **5. Rewards:**
- [ ] XP granted on completion (500 XP)
- [ ] Gold granted on completion (200g)
- [ ] Loot drops correctly (guaranteed weapon)
- [ ] Instance closes after completion
- [ ] Returns to idle mode

#### **6. Browser Source:**
- [ ] Dungeon mode renders correctly
- [ ] Player visible
- [ ] Enemies visible and positioned correctly
- [ ] Room progression visible
- [ ] Combat animations work

---

### **B. Corrupted Temple (Group Raid)**

#### **1. Queue System:**
- [ ] Can queue for Corrupted Temple
- [ ] Queue shows correct requirements (Level 15+, 500+ item score)
- [ ] Queue shows role requirements (1 tank, 1 healer, 1-3 DPS)
- [ ] Queue status updates correctly (waiting, matched, in progress)
- [ ] Can leave queue

#### **2. Matchmaking:**
- [ ] Matches 3-5 players correctly (1 tank, 1 healer, 1-3 DPS)
- [ ] Matches players within level range
- [ ] Matches players with appropriate gear scores
- [ ] Party members stay together when queuing as party
- [ ] Incomplete parties can fill with individuals

#### **3. Instance Creation:**
- [ ] Instance creates correctly when match found
- [ ] All players spawn in same instance
- [ ] All 3 waves load correctly

#### **4. Wave Progression:**
- [ ] Wave 1: Trash mobs
- [ ] Wave 2: Trash mobs + adds
- [ ] Wave 3: Boss (Corrupted High Priest)

#### **5. Boss Mechanics:**
- [ ] **Shadow Bolt** - Channels dark energy, strikes random player (150 damage, 8s cooldown)
- [ ] **Corrupting Aura** - At 50% HP, pulses damage to all players every 5s (80 damage)
- [ ] **Summon Cultists** - At 75% and 25% HP, summons 2 cultist adds
- [ ] Phase transitions work correctly

#### **6. Combat:**
- [ ] All players can participate in combat
- [ ] Tank threat/aggro works correctly
- [ ] Healer healing works correctly
- [ ] DPS damage works correctly
- [ ] Boss abilities trigger correctly
- [ ] Adds spawn at correct HP thresholds
- [ ] Death/resurrection works

#### **7. Rewards:**
- [ ] XP granted on completion (2000 XP)
- [ ] Gold granted on completion (500g)
- [ ] Loot drops correctly (guaranteed weapon/armor)
- [ ] Rewards distributed to all players
- [ ] Instance closes after completion

#### **8. Browser Source:**
- [ ] Raid mode renders correctly
- [ ] All players visible (3-5 players)
- [ ] Boss visible and positioned correctly
- [ ] Adds visible when spawned
- [ ] Boss mechanics visible (Shadow Bolt, Corrupting Aura)
- [ ] Combat animations work

---

## 🚨 **CRITICAL BUGS TO CHECK**

### **Must Fix:**
- [ ] Instance creation failures
- [ ] Matchmaking failures
- [ ] Boss mechanics not triggering
- [ ] Adds not spawning
- [ ] Rewards not distributed
- [ ] Players not spawning together

### **Should Fix:**
- [ ] Visual glitches in browser source
- [ ] Combat animation issues
- [ ] UI/UX issues

---

## 📋 **TESTING PROCEDURE**

### **Step 1: Test Goblin Cave (Solo)**
1. Create a hero (Level 10+, 200+ item score)
2. Queue for Goblin Cave
3. Verify instance creates immediately
4. Complete all 3 rooms
5. Verify rewards granted
6. Check browser source display

### **Step 2: Test Corrupted Temple (Group)**
1. Create 3-5 heroes (Level 15+, 500+ item score, mix of roles)
2. Queue for Corrupted Temple (individually or as party)
3. Verify matchmaking works
4. Verify all players spawn together
5. Complete all 3 waves
6. Verify boss mechanics trigger:
   - Shadow Bolt at various HP thresholds
   - Corrupting Aura at 50% HP
   - Cultists spawn at 75% and 25% HP
7. Verify rewards distributed to all players
8. Check browser source display

### **Step 3: Test Edge Cases**
1. Player disconnects during dungeon/raid
2. Player leaves dungeon/raid
3. All players die (instance fails)
4. Queue timeout

---

## 🎯 **SUCCESS CRITERIA**

### **Goblin Cave:**
- ✅ Solo queue works
- ✅ All 3 rooms complete
- ✅ Rewards granted
- ✅ Browser source displays correctly

### **Corrupted Temple:**
- ✅ Matchmaking works (3-5 players)
- ✅ All waves complete
- ✅ Boss mechanics work (Shadow Bolt, Aura, Adds)
- ✅ Rewards distributed to all players
- ✅ Browser source displays correctly

---

## 📝 **NOTES**

- **Goblin Cave** is solo, so no matchmaking needed - should be instant
- **Corrupted Temple** requires matchmaking - may take time to find players
- Boss mechanics are the most critical to test
- Browser source display is important for streamers

---

**Once both work perfectly, we're ready to launch! 🚀**







