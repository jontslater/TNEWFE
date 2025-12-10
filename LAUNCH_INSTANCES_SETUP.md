# Launch Instances Setup ✅

**Date:** January 2025  
**Status:** Limited to 1 Dungeon + 1 Raid for Launch

---

## ✅ **WHAT WE'VE DONE**

### **1. Limited Available Instances**
- ✅ **Dungeon Endpoint** (`/api/dungeon/available/:userId`) - Only returns `goblin_cave`
- ✅ **Raid Endpoint** (`/api/raids/available/:userId`) - Only returns `corrupted_temple`
- ✅ **Solo Dungeon Auto-Start** - Goblin Cave starts immediately (no queue needed)

### **2. Selected Instances**

#### **Goblin Cave (Dungeon)**
- **Type:** Solo
- **Level:** 10+
- **Item Score:** 200+
- **Rooms:** 3
  - Room 1: Cave Entrance (3 Goblins, Level 10)
  - Room 2: Main Chamber (5 Goblins, Level 12)
  - Room 3: Goblin Chief's Lair (1 Goblin Chief, Level 15, Boss)
- **Rewards:** 200g, 5 tokens, 500 XP, guaranteed weapon

#### **Corrupted Temple (Raid)**
- **Type:** Group Raid
- **Level:** 15+
- **Item Score:** 500+
- **Players:** 3-5 (1 tank, 1 healer, 1-3 DPS)
- **Waves:** 3
- **Boss:** Corrupted High Priest
- **Boss Mechanics:**
  - **Shadow Bolt** - Channels dark energy, strikes random player (150 damage, 8s cooldown)
  - **Corrupting Aura** - At 50% HP, pulses damage to all players every 5s (80 damage)
  - **Summon Cultists** - At 75% and 25% HP, summons 2 cultist adds
- **Rewards:** 500g, 10 tokens, 2000 XP, guaranteed weapon/armor

---

## ⚠️ **WHAT NEEDS TESTING**

### **A. Goblin Cave (Solo Dungeon)**

#### **Critical Tests:**
1. **Queue/Start:**
   - [ ] Queueing for Goblin Cave starts instance immediately (no matchmaking)
   - [ ] Instance creates correctly
   - [ ] Player spawns in dungeon

2. **Room Progression:**
   - [ ] Room 1 loads (3 Goblins)
   - [ ] Room 2 loads after Room 1 cleared (5 Goblins)
   - [ ] Room 3 loads after Room 2 cleared (Goblin Chief boss)

3. **Combat:**
   - [ ] Enemies spawn correctly
   - [ ] Combat works (damage, healing, death)
   - [ ] Room progression works (advance when enemies cleared)

4. **Rewards:**
   - [ ] XP granted (500 XP)
   - [ ] Gold granted (200g)
   - [ ] Loot drops (guaranteed weapon)
   - [ ] Returns to idle mode

5. **Browser Source:**
   - [ ] Dungeon mode renders correctly
   - [ ] Player visible
   - [ ] Enemies visible
   - [ ] Room progression visible

---

### **B. Corrupted Temple (Group Raid)**

#### **Critical Tests:**
1. **Queue/Matchmaking:**
   - [ ] Can queue for Corrupted Temple
   - [ ] Matchmaking works (3-5 players: 1 tank, 1 healer, 1-3 DPS)
   - [ ] All players spawn together

2. **Wave Progression:**
   - [ ] Wave 1: Trash mobs
   - [ ] Wave 2: Trash mobs
   - [ ] Wave 3: Boss (Corrupted High Priest)

3. **Boss Mechanics (CRITICAL):**
   - [ ] **Shadow Bolt** - Triggers every 8 seconds, hits random player for 150 damage
   - [ ] **Corrupting Aura** - Activates at 50% HP, pulses 80 damage every 5s to all players
   - [ ] **Summon Cultists** - Spawns 2 cultists at 75% HP
   - [ ] **Summon Cultists** - Spawns 2 cultists at 25% HP
   - [ ] Phase transitions work correctly

4. **Combat:**
   - [ ] All players can participate
   - [ ] Tank threat/aggro works
   - [ ] Healer healing works
   - [ ] DPS damage works
   - [ ] Adds spawn at correct HP thresholds
   - [ ] Death/resurrection works

5. **Rewards:**
   - [ ] XP granted to all players (2000 XP)
   - [ ] Gold granted to all players (500g)
   - [ ] Loot drops (guaranteed weapon/armor)
   - [ ] Rewards distributed to all players

6. **Browser Source:**
   - [ ] Raid mode renders correctly
   - [ ] All players visible (3-5 players)
   - [ ] Boss visible
   - [ ] Adds visible when spawned
   - [ ] Boss mechanics visible (Shadow Bolt, Aura)

---

## 🔍 **POTENTIAL ISSUES TO CHECK**

### **1. Boss Mechanics Execution**
- ⚠️ Boss mechanics are defined in backend but may not be fully executed in `CleanBattlefieldSource.tsx`
- `RaidBrowserSourcePage.tsx` has boss mechanics, but we're using `CleanBattlefieldSource.tsx`
- **Action:** Test and verify boss mechanics work, add if missing

### **2. Adds Spawning**
- ⚠️ Adds spawning at HP thresholds may not be implemented
- **Action:** Test and verify adds spawn at 75% and 25% HP

### **3. Phase Transitions**
- ⚠️ Phase transitions may not trigger correctly
- **Action:** Test and verify phases change at correct HP thresholds

### **4. Solo Dungeon Queue**
- ✅ Fixed: Solo dungeons now start immediately
- **Action:** Test to verify it works

---

## 🧪 **TESTING PROCEDURE**

### **Step 1: Test Goblin Cave**
1. Create hero (Level 10+, 200+ item score)
2. Queue for Goblin Cave
3. Verify instance starts immediately (no queue)
4. Complete all 3 rooms
5. Verify rewards granted
6. Check browser source

### **Step 2: Test Corrupted Temple**
1. Create 3-5 heroes (Level 15+, 500+ item score, mix of roles)
2. Queue for Corrupted Temple
3. Verify matchmaking works
4. Verify all players spawn together
5. Complete all 3 waves
6. **CRITICAL:** Watch for boss mechanics:
   - Shadow Bolt every 8 seconds
   - Corrupting Aura at 50% HP
   - Cultists spawn at 75% and 25% HP
7. Verify rewards distributed
8. Check browser source

---

## 📝 **FILES MODIFIED**

1. **`E:\IdleDnD-Backend\src\routes\dungeon.js`**
   - Limited `/available/:userId` to only return `goblin_cave`
   - Added solo dungeon auto-start logic in `/queue` endpoint

2. **`E:\IdleDnD-Backend\src\routes\raids.js`**
   - Limited `/available/:userId` to only return `corrupted_temple`

3. **`E:\IdleDnD-Web\src\api\client.ts`**
   - Added optional `dungeonId` parameter to `joinQueue` (for future use)

---

## 🎯 **NEXT STEPS**

1. **Test Goblin Cave** - Verify solo dungeon works
2. **Test Corrupted Temple** - Verify raid works
3. **Test Boss Mechanics** - Verify Shadow Bolt, Aura, Adds spawn
4. **Fix Any Issues** - Add missing mechanics if needed
5. **Launch!** 🚀

---

**Status:** ✅ Setup complete, ready for testing!

