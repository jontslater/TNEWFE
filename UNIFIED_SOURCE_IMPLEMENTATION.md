# Unified Browser Source - Implementation Plan

**Goal:** ONE browser source URL that auto-switches between Idle/Dungeon/Raid  
**Time:** 3-4 hours  
**Complexity:** HIGH  
**Priority:** CRITICAL for streamer UX

---

## 🎯 **THE VISION**

### **Streamer Setup:**
```
OBS Browser Source: /browser-source/unified?battlefieldId=twitch:username&viewers=100

→ Automatically shows:
  - Idle Adventure (when hero idle)
  - Dungeon Combat (when hero in dungeon)
  - Raid Combat (when hero in raid)
  - Transitions smoothly between all modes
```

**ONE URL. ZERO SCENE SWITCHING. SEAMLESS.** ✨

---

## 🏗️ **ARCHITECTURE**

### **Component Structure:**
```typescript
UnifiedBrowserSource.tsx
├─ Hero Status Detection (polls every 5s)
├─ Mode State Management (idle | dungeon | raid)
└─ Conditional Rendering:
    ├─ IdleAdventureMode (CleanBattlefieldSource logic)
    ├─ DungeonMode (Server combat, dungeon enemies)
    └─ RaidMode (Server combat, raid boss)
```

---

## 📋 **IMPLEMENTATION STEPS**

### **Step 1: Create UnifiedBrowserSource.tsx** (30 min)
```typescript
const [mode, setMode] = useState<'idle' | 'dungeon' | 'raid'>('idle');
const [dungeonId, setDungeonId] = useState<string | null>(null);
const [raidId, setRaidId] = useState<string | null>(null);

// Poll hero status every 5s
useEffect(() => {
  const checkHeroStatus = async () => {
    const hero = await heroAPI.getHero(heroId);
    
    if (hero.currentRaid) {
      setMode('raid');
      setRaidId(hero.currentRaid);
    } else if (hero.currentDungeon) {
      setMode('dungeon');
      setDungeonId(hero.currentDungeon);
    } else {
      setMode('idle');
    }
  };
  
  const interval = setInterval(checkHeroStatus, 5000);
  checkHeroStatus(); // Initial check
  
  return () => clearInterval(interval);
}, [heroId]);
```

### **Step 2: Extract Idle Combat** (1 hour)
- Copy CleanBattlefieldSource combat logic
- Make it a reusable component: `<IdleAdventureCombat />`
- Keep ALL features we built today
- Props: heroes, viewerCount, battlefieldId

### **Step 3: Integrate Raid Combat** (1 hour)
- Use RaidBrowserSourcePage logic
- Make it a component: `<RaidCombat />`
- Server-authoritative enemies
- Props: raidId, heroes

### **Step 4: Add Dungeon Combat** (1 hour)
- Similar to raid combat
- Server enemies (from dungeon data)
- Make it a component: `<DungeonCombat />`
- Props: dungeonId, heroes

### **Step 5: Transition Logic** (30 min)
```typescript
// When mode changes:
useEffect(() => {
  console.log(`[Mode] Switching to ${mode} mode`);
  
  // Stop previous mode's combat
  stopCurrentCombat();
  
  // Show transition message
  setTransitionText(`Entering ${mode}...`);
  
  // Start new mode after delay
  setTimeout(() => {
    setTransitionText(null);
    startNewModeCombat();
  }, 1000);
}, [mode]);
```

---

## 🎮 **MODE COMPARISON**

| Feature | Idle Adventure | Dungeon | Raid |
|---------|----------------|---------|------|
| **Enemy Source** | Local generation | Server (dungeon data) | Server (raid boss) |
| **Combat** | Client-side | Server-authoritative | Server-authoritative |
| **Loot** | Auto-generated | Dungeon-specific | Raid-tier loot |
| **Duration** | Infinite | 30-60 min | 1-2 hours |
| **Players** | 1-5 (battlefield) | 5 (party) | 10-20 (raid) |
| **Difficulty** | Adaptive | Fixed tiers | Heroic/Mythic |

---

## 🔄 **TRANSITION FLOW**

### **Idle → Dungeon:**
```
[Hero uses !dungeon command]
→ Backend: hero.currentDungeon = 'dungeon-123'
→ Unified Source polls status
→ Detects currentDungeon
→ [Mode] Switching to dungeon mode
→ Shows: "Entering Dungeon..."
→ Stops idle adventure loop
→ Loads dungeon enemies from server
→ Starts dungeon combat
```

### **Dungeon → Idle:**
```
[Dungeon complete]
→ Backend: hero.currentDungeon = null
→ Unified Source polls status
→ Detects no dungeon
→ [Mode] Switching to idle mode
→ Shows: "Returning to Adventure..."
→ Stops dungeon combat
→ Resumes idle adventure loop
→ Spawns local enemies
```

### **Idle → Raid → Idle:**
```
Same flow, but with currentRaid instead of currentDungeon
```

---

## ⚠️ **CHALLENGES**

### **1. Multiple Combat Systems**
- Idle uses local combat loop
- Dungeon/Raid uses server combat
- Need to cleanly switch between them

### **2. State Management**
- Hero stats sync
- Enemy data source
- Combat state transitions
- Loot distribution

### **3. Performance**
- Polling every 5s for mode detection
- Multiple Firebase listeners
- Combat engine cleanup

---

## 🎯 **ESTIMATED TIME**

| Task | Time |
|------|------|
| Create UnifiedBrowserSource shell | 30 min |
| Extract idle combat to component | 1 hour |
| Integrate raid combat | 1 hour |
| Add dungeon combat | 1 hour |
| Transition logic | 30 min |
| Testing & debugging | 1 hour |
| **TOTAL** | **~5 hours** |

---

## 🚀 **PRIORITY**

**This is CRITICAL for launch!**

Streamers need:
- ✅ One URL (easy setup)
- ✅ Auto-transitions (no manual switching)
- ✅ Support all content (idle, dungeons, raids)

**Without this:** Streamers need 3 different OBS sources and manual switching ❌  
**With this:** One source, zero effort ✅

---

## 💡 **RECOMMENDATION**

### **Today's Progress: INCREDIBLE** 🎊
- Built 26+ features
- ~85% complete
- Fully playable idle adventure

### **Next Session: Unified Source** 🎯
- Fresh start (not tired!)
- 5 hours of focused work
- Complete the vision

**OR continue now if you have energy!** 💪

---

**Want to:**
1. **Stop here** (epic session, tackle unified source next time)
2. **Continue** (build unified source NOW, another 5 hours)
3. **Quick fix** (just fix the stuck loop, revisit unified later)

**Your call!** 🤔✨




