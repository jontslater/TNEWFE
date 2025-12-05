# Dungeon/Raid Transition System - Implementation Plan

**Priority:** CRITICAL for full game functionality  
**Complexity:** HIGH - Multi-mode combat system  
**Time Estimate:** 3-4 hours  
**Status:** Not Started

---

## 🎯 **GOAL**

Enable browser source to seamlessly transition between:
1. **Idle Adventure** (local, client-side combat)
2. **Dungeon/Raid** (server-authoritative, queue-based)
3. **Back to Idle** (after completion)

---

## 📋 **SYSTEM ARCHITECTURE**

### **Current State:**
- ✅ `CleanBattlefieldSource.tsx` - Idle adventure (local combat)
- ✅ `RaidBrowserSourcePage.tsx` - Raid combat (server combat)
- ❌ **No transition system!** - Separate pages, can't switch

### **Desired State:**
- ✅ **Unified Browser Source** - Single page that handles both modes
- ✅ **Auto-Detection** - Checks hero's current mode (idle vs dungeon/raid)
- ✅ **Seamless Transition** - Switches combat systems automatically
- ✅ **Return to Idle** - Auto-returns after dungeon/raid complete

---

## 🏗️ **IMPLEMENTATION APPROACH**

### **Option A: Unified Source (Recommended)**
**Create new:** `UnifiedBrowserSource.tsx`

**Features:**
- Polls hero's `currentDungeon` / `currentRaid` status
- Renders idle adventure OR dungeon/raid based on status
- Uses appropriate combat engine for each mode
- Smooth transitions with loading states

**Pros:**
- Single URL for streamers
- Automatic mode switching
- Clean architecture

**Cons:**
- Need to build new unified component
- More complex state management

---

### **Option B: Route-Based (Simpler)**
**Keep existing:** Separate pages, use routing

**Features:**
- `/browser-source/idle` - Idle adventure
- `/browser-source/raid/:raidId` - Raid combat
- `/browser-source/dungeon/:dungeonId` - Dungeon combat
- Backend redirects OBS based on hero status

**Pros:**
- Use existing components
- Simpler implementation
- Clear separation

**Cons:**
- Streamers need to handle multiple URLs
- OBS scene switching required
- Less seamless

---

## 🔧 **OPTION A: Unified Source** (Detailed Plan)

### **Step 1: Detection System** (30 min)
```typescript
// Poll hero status every 5 seconds
useEffect(() => {
  const checkMode = async () => {
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
  
  const interval = setInterval(checkMode, 5000);
  return () => clearInterval(interval);
}, [heroId]);
```

### **Step 2: Mode-Based Rendering** (1 hour)
```typescript
// Conditional rendering based on mode
return (
  <div>
    {mode === 'idle' && (
      <IdleAdventureCombat 
        heroes={heroes} 
        viewerCount={viewerCount} 
      />
    )}
    
    {mode === 'raid' && (
      <RaidCombat 
        raidId={raidId} 
        heroes={heroes}
      />
    )}
    
    {mode === 'dungeon' && (
      <DungeonCombat 
        dungeonId={dungeonId}
        heroes={heroes}
      />
    )}
  </div>
);
```

### **Step 3: Extract Idle Combat** (1 hour)
- Move CleanBattlefieldSource combat logic to component
- Make it reusable
- Keep all features (DoTs, loot, abilities, etc.)

### **Step 4: Integrate Raid Combat** (1 hour)
- Use existing RaidBrowserSourcePage logic
- Adapt for unified source
- Server-authoritative combat
- Shared enemies

### **Step 5: Transition Logic** (30 min)
```typescript
// On mode change:
- Stop current combat loop
- Clear current enemies
- Reset combat state
- Start new mode's combat system
- Show transition message ("Entering Raid...")
```

---

## 🔧 **OPTION B: Route-Based** (Simpler Plan)

### **Step 1: Update Routes** (15 min)
```typescript
// App.tsx routes
<Route path="/browser-source/idle" element={<CleanBattlefieldSource />} />
<Route path="/browser-source/raid/:raidId" element={<RaidBrowserSourcePage />} />
<Route path="/browser-source/dungeon/:dungeonId" element={<DungeonBrowserSourcePage />} />
```

### **Step 2: Backend Queue Integration** (30 min)
- Hero joins queue via !raid or !dungeon command
- Backend sets `hero.currentRaid` or `hero.currentDungeon`
- Backend webhook/event notifies OBS to switch scenes

### **Step 3: OBS Scene Switching** (Streamer setup)
- Scene 1: Idle Adventure (idle URL)
- Scene 2: Raid (raid URL)
- Scene 3: Dungeon (dungeon URL)
- Switch triggered by backend event or StreamElements/StreamDeck

### **Step 4: Return to Idle** (15 min)
- After raid/dungeon complete, backend clears `currentRaid`/`currentDungeon`
- Backend event triggers OBS to switch back to idle scene

---

## 📊 **COMPARISON**

| Feature | Unified Source | Route-Based |
|---------|----------------|-------------|
| **Implementation Time** | 3-4 hours | 1 hour |
| **Streamer Setup** | Easy (1 URL) | Complex (multiple URLs) |
| **Transitions** | Seamless | Scene cuts |
| **Architecture** | Complex | Simple |
| **Maintenance** | Harder | Easier |
| **User Experience** | Better | Good enough |

---

## 💡 **MY RECOMMENDATION**

### **For MVP: Use Route-Based (Option B)**
- Faster to implement (1 hour vs 4 hours)
- Use existing pages (CleanBattlefieldSource, RaidBrowserSourcePage)
- Good enough for launch
- Can upgrade to Unified later

### **For Polish: Build Unified (Option A)**
- Better user experience
- Single URL for streamers
- Automatic transitions
- More professional

---

## 🚀 **IMMEDIATE ACTION PLAN**

### **Phase 1: Make What We Have Work** (1-2 hours)
1. ✅ CleanBattlefieldSource (idle adventure) - **DONE!**
2. ⚠️ RaidBrowserSourcePage (raid combat) - **Verify working**
3. ✅ Routes configured - **Check routing**
4. ⏳ Backend integration - **Test queue system**

### **Phase 2: Test Integration** (1 hour)
1. Hero in idle → Use `/browser-source/clean?battlefieldId=twitch:user`
2. Hero joins raid → Use `/browser-source/raid/:raidId`
3. Raid completes → Return to `/browser-source/clean`
4. Test queue → raid → idle flow

### **Phase 3: Optional Unified Source** (3-4 hours)
- Build after testing basic flow
- Only if seamless transitions are critical

---

## 🎯 **NEXT STEPS**

**Option 1:** Test existing raid page + routing (1 hour)  
**Option 2:** Build unified source from scratch (4 hours)  
**Option 3:** Hybrid - Enhance existing pages with auto-detection (2 hours)

---

**Which approach do you prefer?** 🤔

**My vote: Test existing system first, build unified if needed!** ✅




