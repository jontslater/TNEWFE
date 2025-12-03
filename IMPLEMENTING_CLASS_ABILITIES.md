# Implementing Class Abilities - Quick Reference

**Current:** 5 abilities implemented  
**Target:** 15 total (10 more to add)  
**Status:** In progress...

---

## ✅ **ALREADY IMPLEMENTED** (5)

1. ✅ **Last Stand** (Tanks) - 75% DR when <10% HP
2. ✅ **Iron Skin** (Tanks) - 30% chance for 50% DR  
3. ✅ **Divine Grace** (Healers) - 30% chance for 2x heal
4. ✅ **Critical Strike** (DPS) - 30% chance for guaranteed crit
5. ✅ **Enrage** (Berserker) - +40% damage vs low HP, visual effect

---

## 🚧 **IN PROGRESS** (10)

### **Threat Manipulation**
1. **Taunt** (Paladin)
   - Trigger: Auto every 15s
   - Effect: 10x threat for 5s
   - Forces enemies to target tank
   - **Status:** ⚠️ Threat system updated, need trigger

2. **Fade** (Shadow Priest/Assassin)
   - Trigger: Auto every 15s
   - Effect: 0.1x threat for 5s
   - Reduces enemy aggro
   - **Status:** ⚠️ Threat system updated, need trigger

### **Healing Abilities**
3. **Group Heal** (Cleric)
   - Trigger: 2+ heroes below 50% HP
   - Effect: Heal all allies for 30% max HP
   - Cooldown: 30s
   - **Status:** ❌ Need to implement

4. **Tranquility** (Druid)
   - Trigger: Any ally below 40% HP
   - Effect: HoT on all allies (heal over time)
   - Duration: 12s (4 ticks × 3s)
   - **Status:** ❌ Need to implement

### **AoE Damage**
5. **Chain Lightning** (Shaman/Stormcaller)
   - Trigger: 2+ enemies alive
   - Effect: Damage 2-3 enemies
   - Jumps between targets
   - **Status:** ❌ Need to implement

6. **Whirlwind** (Berserker/Bladedancer)
   - Trigger: 2+ enemies alive
   - Effect: Hit all enemies for 70% damage
   - Visual: Spinning attack
   - **Status:** ❌ Need to implement

### **Lifesteal & Finishing**
7. **Bloodthirst** (Blood Knight)
   - Trigger: Auto on attacks
   - Effect: Heal for 20% of damage dealt
   - **Status:** ❌ Need to implement

8. **Execute** (Vanguard/Reaper)
   - Trigger: Enemy <20% HP
   - Effect: Guaranteed kill if damage > 15% of enemy HP
   - **Status:** ❌ Need to implement

### **Defensive Abilities**
9. **Shield Wall** (Guardian)
   - Trigger: 2+ heroes below 60% HP
   - Effect: 30% DR for all allies for 10s
   - Cooldown: 45s
   - **Status:** ❌ Need to implement

10. **Evasion** (Assassin/Monk)
    - Trigger: Passive
    - Effect: 15% chance to dodge attacks
    - **Status:** ❌ Need to implement

---

## 📋 **Implementation Order**

### **Phase 1: Quick Wins** (30 min)
1. Taunt trigger (auto every 15s)
2. Fade trigger (auto every 15s)
3. Evasion (passive dodge chance)

### **Phase 2: Emergency Abilities** (45 min)
4. Group Heal (heal all when multiple injured)
5. Shield Wall (team DR when party hurt)

### **Phase 3: AoE Damage** (1 hour)
6. Chain Lightning (multi-target)
7. Whirlwind (hit all enemies)

### **Phase 4: Advanced** (45 min)
8. Bloodthirst (lifesteal)
9. Execute (finishing move)
10. Tranquility (HoT on all)

---

**Total Time:** ~3 hours for all 10!

**Starting with Phase 1 NOW!** 🚀

