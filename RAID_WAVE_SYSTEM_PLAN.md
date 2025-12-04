# 🐉 RAID WAVE SYSTEM - Complete Implementation Plan

**Goal:** Add trash mob waves before raid boss, using dragon 1/2/3 sprites

---

## 📋 **PLAN OVERVIEW**

### **Phase 1: Dragon Sprite Setup** (15 min)
1. Verify dragon 1, 2, 3 sprite sheets exist
2. Add dragon 1, 2, 3 to ENEMY_TEMPLATES
3. Set facing direction (right - toward heroes)
4. Test dragon sprites render

### **Phase 2: Wave Enemy Generation** (20 min)
1. Create wave enemy templates for each raid
2. Map waves to enemy types (Wave 1: dragon 1, Wave 2: dragon 2, etc.)
3. Generate enemies based on current wave
4. Scale difficulty based on raid difficulty (normal/heroic/mythic)

### **Phase 3: Wave Progression** (15 min)
1. Start at wave 0 (trash mobs)
2. When all enemies dead → increment wave
3. Spawn next wave enemies
4. Wave 4 → spawn boss
5. Boss defeated → raid complete

### **Phase 4: Boss Scaling** (5 min)
1. Increase Elder Dragon scale from 4.0 → 12.0
2. Adjust positioning if needed
3. Test boss visibility

### **Phase 5: Backend Integration** (10 min)
1. Sync wave progression to Firebase
2. All participants see same wave
3. Update instance.currentWave
4. Track wave completion

---

## 🎯 **DETAILED STEPS**

### **STEP 1: Add Dragon Sprites to Enemy Templates**

**File:** `E:\IdleDnD-Web\src\utils\enemyGeneration.ts`

**Add to ENEMY_TEMPLATES:**
```typescript
{
  name: 'Dragon Whelp',      // dragon 1
  level: 40,
  baseHp: 8000,
  baseAttack: 150,
  baseDefense: 80,
  xp: 800
},
{
  name: 'Dragon Guardian',   // dragon 2
  level: 42,
  baseHp: 10000,
  baseAttack: 180,
  baseDefense: 100,
  xp: 1000
},
{
  name: 'Dragon Sentinel',   // dragon 3
  level: 44,
  baseHp: 12000,
  baseAttack: 200,
  baseDefense: 120,
  xp: 1200
}
```

**Mark as RAID-ONLY (exclude from idle):**
```typescript
const RAID_ONLY_BOSSES = [
  'Elder Dragon', 
  'Adult Dragon',
  'Dragon Whelp',    // NEW
  'Dragon Guardian',  // NEW
  'Dragon Sentinel'   // NEW
];
```

---

### **STEP 2: Create Wave Enemy Data for Raids**

**File:** `E:\IdleDnD-Backend\src\data\raidWaveData.js` (NEW)

```javascript
// Wave configuration for each raid
export const RAID_WAVE_DATA = {
  elder_dragon_normal: {
    waves: [
      { wave: 1, enemies: ['Dragon Whelp', 'Dragon Whelp'], count: 2 },
      { wave: 2, enemies: ['Dragon Whelp', 'Dragon Guardian'], count: 2 },
      { wave: 3, enemies: ['Dragon Guardian', 'Dragon Guardian'], count: 2 },
      { wave: 4, enemies: ['Dragon Guardian', 'Dragon Sentinel'], count: 2 },
      { wave: 5, boss: 'Elder Dragon' } // Final wave = boss
    ]
  },
  elder_dragon_heroic: {
    waves: [
      { wave: 1, enemies: ['Dragon Whelp', 'Dragon Guardian'], count: 2 },
      { wave: 2, enemies: ['Dragon Guardian', 'Dragon Guardian'], count: 2 },
      { wave: 3, enemies: ['Dragon Guardian', 'Dragon Sentinel'], count: 2 },
      { wave: 4, enemies: ['Dragon Sentinel', 'Dragon Sentinel'], count: 2 },
      { wave: 5, boss: 'Elder Dragon' }
    ]
  },
  elder_dragon_mythic: {
    waves: [
      { wave: 1, enemies: ['Dragon Guardian', 'Dragon Sentinel'], count: 2 },
      { wave: 2, enemies: ['Dragon Sentinel', 'Dragon Sentinel'], count: 2 },
      { wave: 3, enemies: ['Dragon Sentinel', 'Dragon Sentinel', 'Dragon Guardian'], count: 3 },
      { wave: 4, enemies: ['Dragon Sentinel', 'Dragon Sentinel', 'Dragon Sentinel'], count: 3 },
      { wave: 5, boss: 'Elder Dragon' }
    ]
  }
};
```

---

### **STEP 3: Update Frontend Wave Logic**

**File:** `E:\IdleDnD-Web\src\pages\CleanBattlefieldSource.tsx`

**In raid mode setup useEffect:**

```typescript
// Determine what to show based on current wave
const currentWave = instanceData.currentWave || 0;
const totalWaves = instanceData.waves || 5;

let raidEnemies: Enemy[] = [];

// WAVE 1-4: Trash mobs
if (currentWave < totalWaves - 1) {
  // Get wave enemies from instance data
  const waveEnemyData = instanceData.waveEnemies?.[currentWave] || [];
  
  raidEnemies = waveEnemyData.map((enemyName: string, index: number) => ({
    id: `wave-enemy-${currentWave}-${index}`,
    name: enemyName,
    level: instanceData.boss.level - 5, // 5 levels below boss
    hp: 5000, // Trash mob HP
    maxHp: 5000,
    attack: 100,
    defense: 50,
    xp: 500,
    isBoss: false,
    isDead: false,
    shield: 0
  }));
  
  console.log(`[Raid] Wave ${currentWave + 1}/${totalWaves}: ${raidEnemies.length} trash mobs`);
}
// WAVE 5 (Final): Boss
else {
  raidEnemies = [raidBoss];
  console.log(`[Raid] Final wave: BOSS - ${raidBoss.name}`);
}
```

---

### **STEP 4: Wave Progression on Victory**

**Add to victory check:**

```typescript
// When all enemies defeated
if (allEnemiesDead && gameMode === 'raid') {
  console.log('[Raid] ✅ Wave complete!');
  
  const currentWave = instanceData.currentWave || 0;
  const totalWaves = instanceData.waves || 5;
  
  // If not final wave, increment and spawn next wave
  if (currentWave < totalWaves - 1) {
    console.log(`[Raid] Moving to wave ${currentWave + 2}...`);
    
    // Update wave in Firebase
    const instanceRef = doc(db, 'raidInstances', currentInstanceId);
    updateDoc(instanceRef, {
      currentWave: currentWave + 1
    });
    
    // instanceData will update via Firebase listener, triggering new wave spawn
  } 
  // Final wave complete - raid victory!
  else {
    console.log('[Raid] 🎉 RAID COMPLETE!');
    // Handle victory, loot, return to idle
  }
}
```

---

### **STEP 5: Boss Scaling**

**Update Elder Dragon scale:**

```typescript
<EnemySpriteJS
  ref={getEnemySpriteRef(raidBoss.id)}
  enemyId={raidBoss.id}
  enemyType="adult dragon"
  enemyName={raidBoss.name}
  facing="right"
  scale={12.0} // 3x larger than current (4.0 → 12.0)
/>
```

---

### **STEP 6: Backend Wave Data in Instance**

**When creating raid instance, add wave enemy data:**

```javascript
// In queueService.js - when creating raid instance
const instance = {
  // ... existing fields ...
  currentWave: 0,
  waves: 5,
  waveEnemies: [
    ['Dragon Whelp', 'Dragon Whelp'],           // Wave 1
    ['Dragon Whelp', 'Dragon Guardian'],        // Wave 2
    ['Dragon Guardian', 'Dragon Guardian'],     // Wave 3
    ['Dragon Guardian', 'Dragon Sentinel'],     // Wave 4
    // Wave 5 = boss (no enemies array)
  ],
  boss: { /* boss data */ }
};
```

---

## 📊 **IMPLEMENTATION ORDER**

**Do these in order:**

1. ✅ **Add dragon sprites to enemy templates** (Step 1)
   - Add Dragon Whelp, Guardian, Sentinel
   - Mark as raid-only
   - Test sprites render

2. ✅ **Increase boss scale to 12.0** (Step 5)
   - Quick visual change
   - Test boss size

3. ✅ **Add wave enemy logic to frontend** (Step 3)
   - Check currentWave
   - Show trash mobs or boss
   - Test switching between waves

4. ✅ **Add wave progression** (Step 4)
   - Increment wave on victory
   - Sync to Firebase
   - Test progression

5. ✅ **Add backend wave data** (Step 6)
   - Create waveEnemies array in instance
   - Backend generates wave enemies
   - Test full flow

---

## 🎯 **EXPECTED RESULT**

**Raid Flow:**
```
Wave 1: 2x Dragon Whelp → Kill them → Next wave
Wave 2: 1x Whelp, 1x Guardian → Kill them → Next wave
Wave 3: 2x Dragon Guardian → Kill them → Next wave
Wave 4: 1x Guardian, 1x Sentinel → Kill them → Next wave
Wave 5: ELDER DRAGON (HUGE!) → Kill it → Victory!
```

---

## ⏱️ **TIME ESTIMATE**

- Step 1: 10 min (add sprites)
- Step 5: 5 min (boss scale)
- Step 3: 15 min (wave logic)
- Step 4: 10 min (progression)
- Step 6: 15 min (backend)

**Total: ~55 minutes**

---

## 🚀 **READY TO START?**

**Let's do Step 1 first: Add dragon sprites!**

Shall I proceed? 🐉


