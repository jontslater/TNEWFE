# Browser Source Feature Implementation Plan

**Date:** December 2, 2025  
**Current Status:** Core Combat Complete (Steps 1-13)

---

## ✅ What We HAVE Implemented (Steps 1-13)

### Core Systems
1. ✅ Hero display from Firebase
2. ✅ Enemy display and spawning
3. ✅ Local adventure loop (5s tick)
4. ✅ Initiative-based combat
5. ✅ Sprite animations (attack, hurt, death, idle)
6. ✅ Hero resurrection (60s timer)
7. ✅ Party wipe recovery (resurrect all, lower difficulty)
8. ✅ XP and leveling system
9. ✅ Healer mechanics (heal lowest HP ally)
10. ✅ Overheal → Shield conversion
11. ✅ Full SCT system (damage, heal, XP, level up, HP regen)
12. ✅ Shield system with blue glow
13. ✅ Gear stat loading (attack, defense, HP, all secondary stats)
14. ✅ Proper damage formulas (intellect, strength, spell/melee damage)
15. ✅ Defense mitigation (damage / (1 + def / 250))
16. ✅ HP regeneration from gear
17. ✅ Firebase sync (every 60s)

---

## ❌ What We're MISSING

### Critical Missing Features

#### 0. Threat-Based Targeting (PRIORITY 1) ⚠️ CRITICAL!
**Status:** ❌ NOT IMPLEMENTED
- ❌ Enemies attack RANDOM heroes (completely wrong!)
- ❌ Should use threat-based weighted targeting

**What's Missing:**
```typescript
// Current (WRONG):
const target = aliveHeroes[random()]; // Random targeting!

// Should be (CORRECT):
Threat weights:
- Tanks: 20x threat
- DPS: 1x threat  
- Healers: 0.3x threat

// Example party:
Tank (20) + DPS (1) + Healer (0.3) = 21.3 total
Tank chance: 20 / 21.3 = 94% ✅
Healer chance: 0.3 / 21.3 = 1.4% ✅
```

**Impact:** Tanks don't tank! Healers die constantly! Combat feels wrong!

---

#### 1. Skill Bonuses (PRIORITY 1)
**Status:** ⚠️ PARTIALLY IMPLEMENTED
- ✅ Skills loaded from Firebase (`data.skills`)
- ❌ NOT calculating skill bonuses
- ❌ NOT applying to combat

**What's Missing:**
```typescript
// Skills grant bonuses per point:
// - Attack/Defense/HP boosts
// - Damage/Healing multipliers
// - Crit chance/damage
// - Cooldown reduction
// - And more...

// Example: Guardian with 5 points in skill_0:
skillBonus = { hp: +25 } // +5 HP per point

// Need to apply these to stats and combat!
```

**From stats.ts:**
- `calculateSkillBonuses(hero)` function exists
- Returns flat stat bonuses and multipliers
- Must be applied to base stats
- Must be used in damage/healing formulas

**Impact:** Heroes missing 10-50% of their power from skills!

---

#### 2. Enemy Scaling (PRIORITY 1)
**Status:** ⚠️ PARTIALLY IMPLEMENTED
- ✅ Uses `generateEnemiesForCombat` with difficulty modifier
- ❌ NOT using gear score multiplier
- ❌ NOT scaling with hero equipment strength

**What's Missing:**
```typescript
// Current: Scales by level and difficulty only
// Missing: Gear score multiplier

const avgGearScore = calculateAverageGearScore(heroes);
const gearMultiplier = 1 + (avgGearScore / 1000);
enemyStats *= gearMultiplier;

// Example: 500 gear score = 1.5x enemy stats
```

**Impact:** Heroes with good gear will find combat too easy!

---

#### 3. Difficulty System (PRIORITY 1)
**Status:** ⚠️ PARTIALLY IMPLEMENTED
- ✅ Lowers on party wipe (-10%, min 40%)
- ❌ Does NOT increase on wins
- ❌ Wrong range (should be 40%-150%, not 40%-100%)
- ❌ No loot bonus above 100%

**What's Missing:**
```typescript
// On victory (no deaths):
difficultyModifier = Math.min(1.5, difficultyModifier + 0.05);

// Loot bonus above 100%:
if (difficultyModifier > 1.0) {
  lootQuality += (difficultyModifier - 1.0) * 0.6; // +6% per 10%
  // 150% = +30% better loot!
}
```

**Impact:** No challenge increase, no loot bonuses!

---

#### 4. Auto-Buy System (PRIORITY 2)
**Status:** ❌ NOT IMPLEMENTED

**What's Missing:**
- `!auto` command toggle
- Auto-buy during treasure/NPC encounters
- Auto-buy health potions when low stock
- Auto-buy buffs when gold available
- Persistence of autoBuy flag

**Impact:** Heroes don't auto-consume buffs/potions!

---

#### 5. Gathering System (PRIORITY 2)
**Status:** ❌ NOT IMPLEMENTED

**What's Missing:**
- Herbalism gathering during travel/treasure
- Mining gathering during travel/treasure  
- Enchanting essence from enemy defeats
- Profession XP gains
- Material accumulation
- Display gathered materials

**Impact:** No profession progression during adventure!

---

#### 6. Quest Progress Tracking (PRIORITY 2)
**Status:** ❌ NOT IMPLEMENTED

**What's Missing:**
- Track kills, healing, damage, blocking
- Update quest progress in Firebase
- Quest completion detection
- Quest completion SCT/notifications

**Impact:** Quests don't progress from browser source combat!

---

#### 6. Viewer Bonuses (PRIORITY 3)
**Status:** ❌ NOT IMPLEMENTED

**What's Missing:**
- Viewer count tracking
- +1% damage/healing per viewer
- +0.5% defense per viewer
- Loot quality bonus (up to +30%)
- Display viewer count and bonuses

**Impact:** No community engagement benefits!

---

#### 7. Class Abilities (PRIORITY 3)
**Status:** ❌ NOT IMPLEMENTED

**What's Missing:**
- 28 unique class abilities
- Cooldown tracking
- Emergency abilities (Last Stand, Group Heal, etc.)
- Proc buffs (Iron Skin, Divine Grace, Critical Strike)
- AoE abilities

**Impact:** Combat is simpler, less strategic!

---

#### 8. DoT/HoT System (PRIORITY 3)
**Status:** ❌ NOT IMPLEMENTED

**What's Missing:**
- Damage over Time ticking
- Heal over Time ticking
- DoT/HoT from abilities and debuffs
- DoT/HoT SCT display

**Impact:** Missing depth from periodic effects!

---

#### 9. Debuff System (PRIORITY 3)
**Status:** ❌ NOT IMPLEMENTED

**What's Missing:**
- Enemy debuffs (Bleeding, Cursed, Stunned, Weakened)
- Hero debuffs on enemies (Vulnerable, Poisoned, Weakened)
- Debuff resistance calculations
- Debuff duration tracking
- Visual debuff indicators

**Impact:** No status effects in combat!

---

#### 10. Proc Effects from Gear (PRIORITY 3)
**Status:** ❌ NOT IMPLEMENTED

**What's Missing:**
- Crit procs (20% chance, 2x damage)
- Swift procs (10% chance, extra attack)
- Vicious procs (15% chance, +12% damage)
- Thorns procs (20% damage reflection)
- Blessed procs (+15% healing)
- And more...

**Impact:** Legendary gear doesn't have special effects!

---

#### 11. Token System (PRIORITY 4)
**Status:** ❌ NOT IMPLEMENTED

**What's Missing:**
- Idle token earning (2-3/hour)
- Token accumulation during adventure
- Sync tokens to Firebase

**Impact:** No passive token generation!

---

#### 12. Rested XP (PRIORITY 4)
**Status:** ❌ NOT IMPLEMENTED

**What's Missing:**
- Rested XP accumulation (offline time)
- 150% XP bonus while rested
- Rested XP consumption
- Active viewer detection

**Impact:** No offline progression bonus!

---

#### 13. NPC Encounters (PRIORITY 4)
**Status:** ❌ NOT IMPLEMENTED

**What's Missing:**
- NPC spawns during treasure/travel
- Auto-buy from NPCs
- NPC visual display

**Impact:** No merchant encounters!

---

#### 14. Travel XP (PRIORITY 4)
**Status:** ❌ NOT IMPLEMENTED

**What's Missing:**
- +3 XP during peaceful travel
- Separate from combat XP

**Impact:** Missing small XP gains between fights!

---

## 📊 Priority Implementation Plan

### Phase A: Fix Critical Scaling Issues (HIGH PRIORITY)
**Time Estimate:** 2-3 hours

1. **Implement Threat-Based Targeting** ⚠️ CRITICAL!
   - Add threat weights (Tanks 20x, DPS 1x, Healers 0.3x)
   - Weighted random targeting
   - Enemies target highest threat
   - Test that tanks actually tank!

2. **Implement Skill Bonuses**
   - Add `calculateSkillBonuses()` function
   - Apply flat stat bonuses (attack, defense, HP)
   - Apply multipliers to damage/healing
   - Test with real hero skills from Firebase
   - Display skill bonuses in console

3. **Add Gear Score Calculation**
   - Calculate average party gear score
   - Apply gear multiplier to enemies (1 + score / 1000)
   - Display gear score in debug panel

4. **Fix Difficulty System**
   - Increase difficulty on clean wins (+5%)
   - Max difficulty: 150% (not 100%)
   - Add loot quality bonus above 100%
   - Track consecutive wins vs wipes
   - Better console logging

5. **Verify Enemy Scaling**
   - Confirm level scaling working
   - Confirm party size scaling
   - Confirm wave scaling
   - Test with different gear scores

**Result:** Heroes at full power, proper challenge scaling, better rewards at high difficulty!

---

### Phase B: Add Progression Features (MEDIUM PRIORITY)
**Time Estimate:** 3-4 hours

5. **Auto-Buy System**
   - Add `autoBuy` flag to hero state
   - Auto-buy during treasure encounters
   - Auto-buy health potions (priority)
   - Auto-buy buffs (if gold available)
   - Sync autoBuy to Firebase

6. **Gathering System**
   - Add profession check (herbalism, mining, enchanting)
   - Gather materials during travel (30% chance)
   - Gather materials during treasure (50% chance)
   - Gain profession XP from gathering
   - Sync materials to Firebase
   - Display gathering in console

7. **Quest Progress Tracking**
   - Track kills per combat
   - Track healing done
   - Track damage dealt
   - Track damage blocked (tanks)
   - Sync quest progress to Firebase
   - Quest completion notifications

8. **Travel XP**
   - Grant +3 XP during peaceful travel
   - Sync to Firebase

**Result:** Full progression system with auto-buy and gathering!

---

### Phase C: Add Combat Depth (MEDIUM-LOW PRIORITY)
**Time Estimate:** 4-6 hours

8. **Critical Hits**
   - Roll for crits based on critChance stat
   - 2x damage on crit
   - Yellow "CRIT!" SCT
   - More exciting combat visuals

9. **DoT/HoT System**
   - Track active DoTs/HoTs
   - Tick every 2 seconds
   - Apply damage/healing
   - Purple/light green SCT
   - Duration tracking

10. **Basic Debuffs**
    - Bleeding (from enemy attacks)
    - Weakened (from abilities)
    - Visual indicators
    - Duration tracking

11. **Proc Effects** (subset)
    - Swift (extra attack)
    - Vicious (+damage)
    - Blessed (+healing)
    - Check gear for procs
    - Roll proc chances

**Result:** More engaging, varied combat!

---

### Phase D: Add Social Features (LOW PRIORITY)
**Time Estimate:** 2-3 hours

12. **Viewer Bonuses**
    - Track viewer count (mock or real Twitch API)
    - Apply damage/healing bonuses
    - Apply loot quality bonus
    - Display in UI

13. **Token Earning**
    - Calculate idle time
    - Grant tokens (2-3/hour)
    - Sync to Firebase

14. **Rested XP**
    - Track offline time
    - Grant rested XP
    - Apply 150% XP bonus
    - Consume rested XP

**Result:** Community engagement and offline rewards!

---

### Phase E: Advanced Features (FUTURE)
**Time Estimate:** 6-10 hours

15. **Full Class Abilities**
    - 28 unique class abilities
    - Cooldown tracking
    - Emergency abilities
    - AoE abilities

16. **NPC Encounters**
    - Spawn NPCs during events
    - Visual NPC display
    - Auto-buy interactions

17. **Full Debuff System**
    - All debuff types
    - Debuff resistance
    - Visual indicators

18. **Raid/Dungeon Switching**
    - Detect raid vs adventure
    - Server-synced enemies for raids
    - Raid-specific mechanics

**Result:** Full feature parity with Electron app!

---

## 🎯 Recommended Next Steps

### Option A: Fix Scaling First (Recommended)
**Focus:** Phase A (2-3 hours)
- Enemy scaling with gear score
- Difficulty increases on wins (40%-150%)
- Loot bonus above 100%
- Proper challenge curve

**Why:** Current combat might be too easy/hard without proper scaling!

### Option B: Add Progression Features
**Focus:** Phase B (3-4 hours)
- Auto-buy
- Gathering
- Quest tracking
- Full progression

**Why:** Makes the game feel complete for progression!

### Option C: Take a Break
**Focus:** Test what we have
- Verify all Step 1-13 features work
- Test with real heroes and gear
- Identify any bugs

**Why:** We've built a LOT - testing is important!

---

## 📈 What Would You Like to Do?

**I recommend Option A (Fix Scaling)** because:
- Most impactful for gameplay balance
- Quick to implement
- Makes combat feel right
- Enables proper testing of other features

**Your call!** 🎯
