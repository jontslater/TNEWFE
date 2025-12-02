# Browser Source Rebuild Plan - MMO Architecture

## 🎯 **Goal**

Build a browser source that works **exactly like the Electron app** but as an MMO where:
- All players on a battlefield see the SAME enemies
- All players fight TOGETHER
- Everything syncs through Firebase/backend
- Supports idle adventure, dungeons, and raids

---

## 📊 **Architecture Understanding**

### **Electron App (Single Player)**
```
Local Client:
  ├─ game.js (20,000 lines) - All game logic
  ├─ gameState object - Local state
  ├─ Adventure loop - Runs locally
  ├─ Enemy spawning - Generates locally
  ├─ Combat - Processes locally
  └─ Firebase sync - Saves results to Firebase
```

### **Browser Source (MMO)**
```
Backend (Server-Authoritative):
  ├─ Battlefield Manager - Manages each battlefield
  ├─ Adventure loops - One per active battlefield
  ├─ Enemy spawning - Writes to Firebase
  ├─ Combat validation - Validates results
  └─ Reward distribution - Grants XP/loot

Firebase (Source of Truth):
  ├─ battlefields/{id}/enemies - Current enemies
  ├─ battlefields/{id}/inCombat - Combat state
  ├─ battlefields/{id}/waveCount - Wave progression
  ├─ heroes/{id}/currentBattlefieldId - Hero location
  └─ heroes/{id}/* - Hero stats

Frontend (Display Only):
  ├─ React components - Render battlefield
  ├─ Firebase listeners - Real-time updates
  ├─ Local combat simulation - Instant feedback
  ├─ WebSocket - Real-time events
  └─ Periodic sync - Validate with backend
```

---

## 🏗️ **Implementation Phases**

### **Phase 1: Backend Battlefield Manager** ⏳

**Purpose:** Server-side adventure loop that spawns enemies for all battlefields

**Components:**
1. **Battlefield Manager Service** (`src/services/battlefieldManager.js`)
   - Tracks active battlefields
   - Runs adventure tick every 5s per battlefield
   - Spawns enemies to Firebase
   - Manages battlefield lifecycle

2. **Enemy Generation Service** (`src/services/enemyGeneration.js`)
   - Port from frontend `enemyGeneration.ts`
   - Generate enemies based on party strength
   - Write to Firebase
   - All scaling formulas

3. **Battlefield Routes** (enhance `src/routes/battlefields.js`)
   - `GET /api/battlefields/:id/state` - Full battlefield state
   - `POST /api/battlefields/:id/action` - Process combat actions
   - `POST /api/battlefields/:id/combat/complete` - Complete combat, grant rewards

**Testing:**
- Start backend
- Have hero join battlefield
- Verify backend spawns enemies to Firebase every 5s
- Verify enemies appear in Firebase Console
- Verify wave progression

---

### **Phase 2: Frontend Firebase Integration** ⏳

**Purpose:** Frontend displays enemies from Firebase, all players see same state

**Components:**
1. **useBattlefieldState Hook** (enhance existing)
   - Listen to `battlefields/{id}/enemies`
   - Listen to `battlefields/{id}/inCombat`
   - Listen to `battlefields/{id}/waveCount`
   - Real-time updates

2. **Enemy Display Component**
   - Render enemies from Firebase
   - Show HP bars
   - Show animations
   - Position sprites

3. **Hero Display Component**
   - Render all heroes on battlefield
   - Show HP bars
   - Show buffs/debuffs
   - Position sprites

**Testing:**
- Load browser source
- Verify enemies appear when backend spawns them
- Verify multiple clients see same enemies
- Verify real-time updates work

---

### **Phase 3: Local Combat Simulation** ⏳

**Purpose:** Combat runs locally for instant feedback, syncs to backend for validation

**Components:**
1. **Local Combat Engine**
   - Runs combat locally (like Electron app)
   - Updates local state immediately
   - Shows animations instantly
   - Calculates damage locally

2. **Combat Sync Service**
   - Syncs local combat state to backend every 5-10s
   - Backend validates results
   - If mismatch, backend wins (anti-cheat)
   - Updates Firebase with authoritative state

3. **Combat Actions**
   - Heroes auto-attack every 2s (local)
   - Damage shown immediately (local)
   - Results validated by backend (server)
   - Firebase updated with final state (shared)

**Testing:**
- Start combat locally
- Verify damage calculations match Electron app
- Verify multiple clients see same HP changes
- Verify backend validates results

---

### **Phase 4: Mode Transitions** ⏳

**Purpose:** Seamlessly transition between idle, dungeon, raid modes

**Components:**
1. **Mode State Machine**
   - Current mode: `idle` | `dungeon` | `raid`
   - Transition logic
   - State cleanup on transition

2. **Dungeon Mode**
   - Room progression
   - Dungeon-specific enemies
   - Boss encounters
   - Loot distribution

3. **Raid Mode**
   - Multi-phase bosses
   - Raid mechanics
   - Coordinated gameplay
   - Raid rewards

**Testing:**
- Test idle → dungeon transition
- Test dungeon → raid transition
- Test raid → idle return
- Verify state cleanup

---

### **Phase 5: Full Feature Parity** ⏳

**Purpose:** Match ALL Electron app features

**Features:**
- ✅ 31 classes with abilities
- ✅ Skills system (10 skills per class)
- ✅ Equipment system (10 slots, 4 rarities)
- ✅ Professions (herbalism, mining, enchanting)
- ✅ Quests (daily, weekly, monthly)
- ✅ Guilds and raids
- ✅ Auto-buy system
- ✅ Resurrection system
- ✅ Adaptive difficulty
- ✅ Viewer bonuses
- ✅ All combat mechanics

**Testing:**
- Test each feature systematically
- Compare to Electron app behavior
- Verify 1:1 parity

---

## 📋 **Detailed Component Plan**

### **Backend: Battlefield Manager**

```javascript
// src/services/battlefieldManager.js

class BattlefieldManager {
  constructor() {
    this.activeBattlefields = new Map();
    this.initialize();
  }

  async initialize() {
    // Find all battlefields with heroes
    const heroesSnapshot = await db.collection('heroes')
      .where('currentBattlefieldId', '!=', null)
      .get();

    const battlefieldIds = new Set();
    heroesSnapshot.docs.forEach(doc => {
      const hero = doc.data();
      if (hero.currentBattlefieldId && hero.currentBattlefieldId !== 'world') {
        battlefieldIds.add(hero.currentBattlefieldId);
      }
    });

    // Start adventure loop for each
    for (const battlefieldId of battlefieldIds) {
      this.startBattlefield(battlefieldId);
    }
  }

  startBattlefield(battlefieldId) {
    if (this.activeBattlefields.has(battlefieldId)) return;

    const intervalId = setInterval(() => {
      this.adventureTick(battlefieldId);
    }, 5000);

    this.activeBattlefields.set(battlefieldId, {
      intervalId,
      lastTick: Date.now()
    });

    // First tick immediately
    this.adventureTick(battlefieldId);
  }

  async adventureTick(battlefieldId) {
    // Get battlefield state
    const battlefieldRef = db.collection('battlefields').doc(battlefieldId);
    const doc = await battlefieldRef.get();
    const battlefield = doc.exists() ? doc.data() : {};

    // Skip if in combat
    if (battlefield.inCombat) return;

    // Get heroes on battlefield
    const heroesSnapshot = await db.collection('heroes')
      .where('currentBattlefieldId', '==', battlefieldId)
      .get();

    const heroes = heroesSnapshot.docs.map(d => ({id: d.id, ...d.data()}));

    if (heroes.length === 0) {
      this.stopBattlefield(battlefieldId);
      return;
    }

    // Increment wave
    const waveCount = (battlefield.waveCount || 0) + 1;

    // Boss every 10 waves
    if (waveCount % 10 === 0) {
      await this.spawnEnemies(battlefieldId, heroes, waveCount, true);
      return;
    }

    // Auto-rest every 5 waves (non-boss)
    if (waveCount % 5 === 0) {
      await battlefieldRef.set({
        waveCount,
        lastEncounter: 'rest',
        lastUpdate: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      return;
    }

    // Random encounter
    const rand = Math.random();
    if (rand < 0.4) {
      // COMBAT (40%)
      await this.spawnEnemies(battlefieldId, heroes, waveCount, false);
    } else if (rand < 0.7) {
      // TREASURE (30%)
      await battlefieldRef.set({
        waveCount,
        lastEncounter: 'treasure',
        lastUpdate: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } else {
      // TRAVEL (30%)
      // Grant travel XP to all heroes
      const batch = db.batch();
      heroes.forEach(hero => {
        const heroRef = db.collection('heroes').doc(hero.id);
        batch.update(heroRef, {
          xp: (hero.xp || 0) + 3,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });
      await batch.commit();

      await battlefieldRef.set({
        waveCount,
        lastEncounter: 'travel',
        lastUpdate: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }
  }

  async spawnEnemies(battlefieldId, heroes, waveCount, isBoss) {
    // Generate enemies (port logic from frontend)
    const enemies = generateEnemiesForCombat(heroes, waveCount);

    if (isBoss && enemies.length > 0) {
      enemies[0].isBoss = true;
      enemies[0].hp = Math.floor(enemies[0].hp * 1.5);
      enemies[0].maxHp = Math.floor(enemies[0].maxHp * 1.5);
    }

    // Write to Firebase
    await db.collection('battlefields').doc(battlefieldId).set({
      enemies,
      inCombat: true,
      waveCount,
      combatStartTime: admin.firestore.FieldValue.serverTimestamp(),
      lastUpdate: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Broadcast
    const twitchId = battlefieldId.replace('twitch:', '');
    broadcastToRoom(twitchId, {
      type: 'enemies_spawned',
      enemies,
      wave: waveCount,
      isBoss
    });
  }

  stopBattlefield(battlefieldId) {
    const data = this.activeBattlefields.get(battlefieldId);
    if (data) {
      clearInterval(data.intervalId);
      this.activeBattlefields.delete(battlefieldId);
    }
  }
}
```

---

### **Frontend: Display Only**

```typescript
// UnifiedBrowserSource.tsx

export default function UnifiedBrowserSource() {
  // Get battlefield ID from URL
  const battlefieldId = getBattlefieldId();

  // Firebase listeners
  const { enemies } = useBattlefieldEnemies(battlefieldId);
  const { heroes } = useBattlefieldHeroes(battlefieldId);
  const { waveCount, inCombat } = useBattlefieldState(battlefieldId);

  // Local combat simulation (for instant feedback)
  const { localHp, localBuffs } = useLocalCombat(heroes, enemies);

  return (
    <div className="battlefield">
      {/* Heroes */}
      {heroes.map(hero => (
        <HeroSprite
          key={hero.id}
          hero={hero}
          hp={localHp[hero.id] ?? hero.hp}  // Local first, Firebase fallback
          buffs={localBuffs[hero.id] ?? hero.activeBuffs}
        />
      ))}

      {/* Enemies (from Firebase - server spawned) */}
      {enemies.map(enemy => (
        <EnemySprite
          key={enemy.id}
          enemy={enemy}
          hp={enemy.hp}  // Server-authoritative
        />
      ))}
    </div>
  );
}
```

---

## 🔄 **Complete MMO Flow**

### **1. Hero Joins Battlefield**
```
User types: !join
  ↓
Backend: Add hero to Firebase
  heroes/{heroId}/currentBattlefieldId = "twitch:123456"
  ↓
Backend: Ensure battlefield manager running for this battlefield
  BattlefieldManager.startBattlefield("twitch:123456")
  ↓
All clients: See hero appear (Firebase listener)
```

### **2. Backend Spawns Enemies (Every 5s)**
```
Battlefield Manager adventure tick:
  ↓
Check: In combat? → No
  ↓
Random roll: 0.35 (< 0.4) → COMBAT!
  ↓
Generate enemies:
  - Get heroes from Firebase
  - Calculate party level: 10
  - Calculate gear score: 300
  - Generate: 1 Werewolf (640 HP, 105 ATK)
  ↓
Write to Firebase:
  battlefields/twitch:123456/enemies = [Werewolf]
  battlefields/twitch:123456/inCombat = true
  battlefields/twitch:123456/waveCount = 5
  ↓
Broadcast WebSocket:
  { type: 'enemies_spawned', enemies: [...], wave: 5 }
  ↓
All clients: See Werewolf appear (Firebase listener + WebSocket)
```

### **3. Combat Runs on Clients (Local Simulation)**
```
Client A, B, C all run combat locally:
  ↓
Every 2 seconds:
  - Calculate hero attacks
  - Apply damage locally
  - Show animations immediately
  - Update local HP state
  ↓
Every 5 seconds:
  - Sync local state to backend
  - Backend validates (anti-cheat)
  - Backend updates Firebase
  - Clients receive authoritative state
```

### **4. Combat Complete**
```
Backend monitors Firebase enemies:
  ↓
Detects all enemies HP ≤ 0
  ↓
Backend:
  - Clear enemies from Firebase
  - Set inCombat = false
  - Grant XP to all heroes (batch update)
  - Grant loot to heroes
  - Update Firebase
  ↓
All clients:
  - Enemies disappear
  - XP/loot messages
  - Next adventure tick begins
```

---

## 📋 **Phase 1: Backend Battlefield Manager (START HERE)**

### **Step 1.1: Create Battlefield Manager Service**

**File:** `E:\IdleDnD-Backend\src\services\battlefieldManager.js`

**Features:**
- [x] Track active battlefields
- [x] Start/stop adventure loops
- [x] Adventure tick every 5s
- [x] Enemy spawning
- [x] Wave progression
- [x] Random encounters (40/30/30)

**Code:** ~300 lines (see architecture doc)

### **Step 1.2: Port Enemy Generation to Backend**

**File:** `E:\IdleDnD-Backend\src\services\enemyGeneration.js`

**Features:**
- [x] 14 enemy types
- [x] Scaling formulas
- [x] Pack size logic
- [x] Boss mechanics

**Code:** Port from `E:\IdleDnD-Web\src\utils\enemyGeneration.ts`

### **Step 1.3: Initialize Battlefield Manager on Server Start**

**File:** `E:\IdleDnD-Backend\src\index.js`

**Changes:**
```javascript
// After app.listen()
const { BattlefieldManager } = require('./services/battlefieldManager');
const battlefieldManager = new BattlefieldManager();
await battlefieldManager.initialize();

console.log('✅ Battlefield Manager initialized');
```

### **Step 1.4: Hook into !join Command**

**File:** `E:\IdleDnD-Backend\src\routes\chat.js`

**Changes:**
```javascript
// After hero joins
const { BattlefieldManager } = require('../services/battlefieldManager');
const manager = BattlefieldManager.getInstance();
await manager.ensureBattlefieldActive(battlefieldId);
```

### **Testing Phase 1:**
```
✅ Backend starts battlefield manager
✅ Hero joins → battlefield starts
✅ Enemies spawn every 5s
✅ Firebase shows enemies
✅ Wave count increments
✅ Boss spawns wave 10
✅ Auto-rest wave 5
```

---

## 📋 **Phase 2: Frontend Display (AFTER Phase 1)**

### **Step 2.1: Clean Frontend Component**

**File:** `E:\IdleDnD-Web\src\pages\UnifiedBrowserSource.tsx`

**Simplify to:**
```typescript
// DISPLAY ONLY - No local enemy generation
const displayEnemies = useFirebaseEnemies(battlefieldId);
const displayHeroes = useFirebaseHeroes(battlefieldId);

// Local combat (for animations/instant feedback)
const combatEngine = useLocalCombat(displayHeroes, displayEnemies);

// Render
return (
  <Battlefield>
    <Heroes heroes={displayHeroes} />
    <Enemies enemies={displayEnemies} />
  </Battlefield>
);
```

### **Step 2.2: Firebase Listeners**

**Features:**
- Listen to `battlefields/{id}/enemies`
- Listen to `battlefields/{id}/waveCount`
- Listen to `battlefields/{id}/inCombat`
- Real-time updates

### **Testing Phase 2:**
```
✅ Frontend shows enemies from Firebase
✅ Multiple clients see same enemies
✅ Real-time synchronization works
✅ Heroes appear/disappear correctly
```

---

## 📋 **Phase 3: Combat Simulation (AFTER Phase 2)**

### **Step 3.1: Local Combat Engine**

Port combat logic from Electron app:
- Initiative system
- Damage calculation
- Healing calculation
- Buff/debuff processing
- Animation triggers

**Run locally for instant feedback**

### **Step 3.2: Backend Combat Validation**

**File:** `E:\IdleDnD-Backend\src\routes\battlefields.js`

```javascript
// POST /api/battlefields/:id/combat/sync
// Receives: Local combat state from client
// Validates: Damage calculations, HP values
// Updates: Firebase with authoritative state
```

### **Testing Phase 3:**
```
✅ Combat runs smoothly on client
✅ Damage calculations match Electron app
✅ Backend validates results
✅ Cheating prevented
```

---

## 📊 **Key Architectural Principles**

1. **Server-Authoritative for Game State**
   - Backend spawns enemies
   - Backend grants rewards
   - Backend validates combat results

2. **Client-Side for User Experience**
   - Local combat simulation
   - Instant animations
   - Smooth gameplay

3. **Firebase as Source of Truth**
   - All important state in Firebase
   - All clients sync to Firebase
   - Backend writes, clients read

4. **Hybrid Combat Model**
   - Combat runs locally (fast)
   - Results validated by backend (secure)
   - Best of both worlds

---

## 🧪 **Testing Strategy**

### **After Each Phase:**
1. Unit test new components
2. Integration test with existing system
3. Load test with multiple clients
4. Compare to Electron app behavior

### **Final Testing:**
1. 10+ heroes on same battlefield
2. Multiple battlefields simultaneously
3. Dungeon transitions
4. Raid transitions
5. 24-hour stress test

---

## 🎯 **Success Criteria**

Browser source must:
- ✅ Work exactly like Electron app
- ✅ Support multiple players on same battlefield
- ✅ Sync all state through Firebase
- ✅ Handle idle/dungeon/raid modes
- ✅ Run smoothly with 20+ heroes
- ✅ Prevent cheating/exploits
- ✅ Scale to 100+ simultaneous battlefields

---

## 🚀 **Next Steps**

**Ready to start?** I'll begin with:

1. **Create battlefieldManager.js** (backend)
2. **Port enemyGeneration to backend**
3. **Initialize on server start**
4. **Test enemy spawning to Firebase**

Once Phase 1 works, we'll move to Phase 2!

**Should I start building Phase 1?** 🎯
