# Clean Battlefield - Mode Switching System

**Date:** December 3, 2025

---

## 🎯 **Goal**

Seamlessly switch between:
- **Idle Adventure** (default) - Auto-combat on battlefield
- **Dungeon Mode** - 5-player instanced dungeon
- **Raid Mode** - 6-10 player instanced raid
- **Back to Idle** - Return when instance completes

---

## 📊 **Mode Detection**

### **How to Know Which Mode:**

Check hero's `currentInstanceId` field:

```javascript
if (hero.currentInstanceId && hero.currentInstanceType === 'dungeon') {
  // DUNGEON MODE
  // Load dungeon instance
  // Display dungeon UI
} else if (hero.currentInstanceId && hero.currentInstanceType === 'raid') {
  // RAID MODE
  // Load raid instance
  // Display raid UI
} else {
  // IDLE ADVENTURE MODE (default)
  // Continue battlefield combat
}
```

---

## 🔄 **Mode Switching Flow**

### **1. Idle → Dungeon/Raid**

**Trigger:** Queue fills and launches

```
Backend:
  1. Creates instance in Firebase (dungeonInstances/raid_123)
  2. Updates all participants' heroes:
     - currentInstanceId = "raid_123"
     - currentInstanceType = "raid"
     - currentBattlefieldId = DELETED (leaves battlefield)
  3. Broadcasts: { type: 'instance_launched', instanceId: 'raid_123' }

Frontend:
  1. Firebase listener detects hero.currentInstanceId changed
  2. Mode switches from 'idle' → 'raid'
  3. Loads raid instance data
  4. Stops adventure loop
  5. Displays raid UI
```

### **2. Dungeon/Raid → Idle**

**Trigger:** Instance completes (boss defeated OR party wipes)

```
Backend:
  1. Updates instance status = 'completed'
  2. Updates all participants' heroes:
     - currentInstanceId = DELETED
     - currentInstanceType = DELETED
     - currentBattlefieldId = "twitch:123456" (returns to battlefield)
  3. Distributes loot and XP
  4. Broadcasts: { type: 'instance_completed', instanceId: 'raid_123' }

Frontend:
  1. Firebase listener detects hero.currentInstanceId = null
  2. Mode switches from 'raid' → 'idle'
  3. Unloads raid instance
  4. Resumes adventure loop
  5. Returns to battlefield display
```

---

## 🏗️ **Implementation Structure**

### **State Management:**

```typescript
const [gameMode, setGameMode] = useState<'idle' | 'dungeon' | 'raid'>('idle');
const [currentInstanceId, setCurrentInstanceId] = useState<string | null>(null);
const [instanceData, setInstanceData] = useState<any>(null);
```

### **Mode Detection useEffect:**

```typescript
useEffect(() => {
  if (heroes.length === 0) return;
  
  // Check if any hero is in an instance
  const heroInInstance = heroes.find(h => h.currentInstanceId);
  
  if (heroInInstance) {
    const instanceType = heroInInstance.currentInstanceType;
    const instanceId = heroInInstance.currentInstanceId;
    
    console.log(`[Mode] Switching to ${instanceType} mode:`, instanceId);
    
    setGameMode(instanceType as 'dungeon' | 'raid');
    setCurrentInstanceId(instanceId);
    
    // Load instance data
    loadInstance(instanceType, instanceId);
  } else {
    // No instances - idle mode
    if (gameMode !== 'idle') {
      console.log('[Mode] Returning to idle adventure mode');
      setGameMode('idle');
      setCurrentInstanceId(null);
      setInstanceData(null);
    }
  }
}, [heroes]);
```

### **Load Instance Function:**

```typescript
const loadInstance = async (type: 'dungeon' | 'raid', instanceId: string) => {
  try {
    const collection = type === 'dungeon' ? 'dungeonInstances' : 'raidInstances';
    const instanceRef = doc(db, collection, instanceId);
    
    // Listen for real-time updates
    onSnapshot(instanceRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setInstanceData({ id: snapshot.id, ...data });
        
        // Check if completed
        if (data.status === 'completed') {
          console.log('[Mode] Instance completed, returning to idle...');
          // Mode will auto-switch via heroes useEffect when currentInstanceId is cleared
        }
      }
    });
  } catch (error) {
    console.error('[Mode] Failed to load instance:', error);
  }
};
```

---

## 🎮 **Rendering Logic**

```typescript
return (
  <div className="battlefield">
    {gameMode === 'idle' && (
      <>
        {/* Idle Adventure Mode */}
        {/* Show heroes on left */}
        {/* Show enemies on right */}
        {/* Adventure loop running */}
      </>
    )}
    
    {gameMode === 'dungeon' && instanceData && (
      <>
        {/* Dungeon Mode */}
        {/* Show dungeon room */}
        {/* Show party */}
        {/* Show dungeon enemies */}
        {/* Room progression */}
      </>
    )}
    
    {gameMode === 'raid' && instanceData && (
      <>
        {/* Raid Mode */}
        {/* Show raid boss */}
        {/* Show full party */}
        {/* Show raid mechanics */}
        {/* Phase indicators */}
      </>
    )}
  </div>
);
```

---

## ⚙️ **Adventure Loop Management**

```typescript
// Pause adventure loop when entering instance
useEffect(() => {
  if (gameMode !== 'idle') {
    console.log('[Adventure] Pausing - in instance mode');
    if (adventureIntervalRef.current) {
      clearInterval(adventureIntervalRef.current);
      adventureIntervalRef.current = null;
    }
  }
}, [gameMode]);

// Resume when returning to idle
useEffect(() => {
  if (gameMode === 'idle' && allHeroes.length > 0) {
    if (!adventureIntervalRef.current) {
      console.log('[Adventure] Resuming - returned to idle');
      // Restart adventure loop
      startAdventureLoop();
    }
  }
}, [gameMode, allHeroes.length]);
```

---

## 🎯 **Implementation Checklist**

- [ ] Add `gameMode` state ('idle' | 'dungeon' | 'raid')
- [ ] Add `currentInstanceId` and `instanceData` state
- [ ] Add mode detection useEffect (watches hero.currentInstanceId)
- [ ] Add instance loader function
- [ ] Add instance Firebase listener (real-time updates)
- [ ] Pause adventure loop when entering instance
- [ ] Resume adventure loop when returning to idle
- [ ] Add conditional rendering based on gameMode
- [ ] Add dungeon UI components
- [ ] Add raid UI components
- [ ] Add transition effects (fade in/out)
- [ ] Test idle → dungeon → idle flow
- [ ] Test idle → raid → idle flow

---

## 🚀 **Start with Basic Mode Switching**

First, let's just add the mode detection and logging - no UI changes yet.
Then we can add dungeon/raid display components step by step.

**Ready to implement?** 🎯


