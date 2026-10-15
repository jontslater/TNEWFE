# Dungeon/Raid Queue System - Complete Design

**Date:** December 3, 2025

---

## 🎯 **Core Concept**

Streamer queues → Viewers join → Auto-launch when roles are filled

---

## 📊 **Role Requirements**

### **Dungeons (5-player):**
```
Normal/Heroic/Mythic:
  - 1 Tank (REQUIRED)
  - 1 Healer (REQUIRED)
  - 3 DPS (REQUIRED)
  
Total: 5 players
```

### **Raids (10-player):**
```
Standard Composition:
  - 2 Tanks (REQUIRED)
  - 2-3 Healers (FLEXIBLE)
  - 5-6 DPS (FLEXIBLE)
  
Total: 10 players minimum

Alternative (Streamer can choose):
  - 2T + 2H + 6DPS (balanced)
  - 2T + 3H + 5DPS (safe)
  - 1T + 2H + 7DPS (speedrun - if streamer allows)
```

---

## 🔐 **Access Control Options**

### **Option A: Battlefield Only (Strictest)**
```
Requirements:
  - Hero must be on streamer's battlefield (!join first)
  - Only active participants can queue
  
Pros:
  - Ensures everyone is already engaged
  - Easy to verify (check currentBattlefieldId)
  - No randoms from other channels

Cons:
  - Viewers must !join first
  - Extra step before queueing
```

### **Option B: Any Viewer (Most Accessible)**
```
Requirements:
  - Hero exists (created via !join at any time)
  - No need to be on battlefield currently
  
Pros:
  - Easy access for anyone
  - No pre-join required
  - More potential participants

Cons:
  - Could get randoms from other channels
  - Harder to manage who's "active"
```

### **Option C: Battlefield + Open Slots (Hybrid - RECOMMENDED)**
```
Phase 1 (First 5 minutes):
  - Only heroes on battlefield can queue
  - Prioritizes active participants
  
Phase 2 (After 5 min if not full):
  - Opens to any viewer with a hero
  - Fills remaining slots
  - Ensures queue doesn't stall
  
Pros:
  - Rewards active participants
  - Fallback prevents queue failure
  - Best of both worlds

Cons:
  - Slightly more complex
```

### **Option D: Streamer Choice (Most Flexible)**
```
Streamer can specify when queuing:

!dungeon 1 open      → Anyone can join
!dungeon 1 party     → Only battlefield heroes
!dungeon 1 viewers   → Only followers/subs (requires Twitch API)

Viewers use same command:
!qdungeon            → Join if eligible
```

---

## 💡 **RECOMMENDED APPROACH: Option C (Hybrid)**

**Why:**
- Prioritizes active battlefield participants
- Falls back to open access if queue is slow
- Balances engagement with accessibility
- No streamer micromanagement needed

---

## 🎮 **Complete Command Flow**

### **1. List Available Content**

```bash
Viewer: !dungeons
→ Shows:
  1. Normal Dungeon (Lv 1-20) - 5 players (1T, 1H, 3DPS)
  2. Heroic Dungeon (Lv 21-40) - 5 players (1T, 1H, 3DPS)
  3. Mythic Dungeon (Lv 41+) - 5 players (1T, 1H, 3DPS)

Viewer: !raids
→ Shows:
  1. Dragon's Lair (Lv 30+) - 10 players (2T, 2H, 6DPS)
  2. Demon Citadel (Lv 40+) - 10 players (2T, 3H, 5DPS)
  3. Frozen Wastes (Lv 50+) - 10 players (2T, 2H, 6DPS)
```

### **2. Streamer Starts Queue**

```bash
Streamer: !dungeon 2
→ Creates queue for Heroic Dungeon
→ Broadcasts:
  "🏰 theneverendingwar is forming a party for Heroic Dungeon! (Lv 21-40)
   Type !qdungeon to join!
   Roles needed: 1 Tank, 1 Healer, 3 DPS
   Status: (0/5) - TANK: 0/1, HEALER: 0/1, DPS: 0/3"
```

### **3. Viewers Join**

```bash
Viewer1 (Tank): !qdungeon
→ "tehchno (Guardian Tank Lv27) joined! (1/5) ✅ TANK: 1/1, HEALER: 0/1, DPS: 0/3"

Viewer2 (Healer): !qdungeon
→ "user123 (Cleric Healer Lv32) joined! (2/5) ✅ TANK: 1/1 ✅ HEALER: 1/1, DPS: 0/3"

Viewer3 (DPS): !qdungeon
→ "user456 (Berserker DPS Lv25) joined! (3/5) ✅ TANK: 1/1 ✅ HEALER: 1/1, DPS: 1/3"

Viewer4 (DPS): !qdungeon
→ "user789 (Mage DPS Lv28) joined! (4/5) ✅ TANK: 1/1 ✅ HEALER: 1/1, DPS: 2/3"

Viewer5 (DPS): !qdungeon
→ "user999 (Assassin DPS Lv30) joined! (5/5) 🎉 GROUP IS READY!"
→ "🏰 Heroic Dungeon launching in 10 seconds... Get ready!"
```

### **4. Role Blocking**

```bash
# If composition is full for a role:
Viewer6 (DPS): !qdungeon
→ "⚠️ user1000 (Berserker DPS), the DPS slots are full! (3/3)
   Still needed: None - Group launching soon!"

# Or if trying to join wrong role:
→ Shows current needs clearly
```

### **5. Queue Status**

```bash
Anyone: !qstatus
→ Shows:
  "📋 Heroic Dungeon Queue Status:
   Progress: (3/5)
   ✅ TANK: 1/1 (tehchno - Guardian Lv27)
   ✅ HEALER: 1/1 (user123 - Cleric Lv32)
   ⚠️ DPS: 1/3 (user456 - Berserker Lv25)
   Type !qdungeon to join!"
```

### **6. Streamer Controls**

```bash
# Force start (even if not full):
Streamer: !qstart
→ "⚡ theneverendingwar is force-starting with current group (4/5)!"
→ Launches with current composition

# Cancel queue:
Streamer: !qcancel
→ "❌ theneverendingwar cancelled the queue. Better luck next time!"
→ All participants removed

# Kick player:
Streamer: !qkick username
→ Removes specific player from queue
```

---

## 🔒 **Access Control Implementation**

### **Phase-Based Access (Hybrid):**

```javascript
const queueConfig = {
  dungeonId: "heroic",
  status: "open",
  phase: 1, // 1 = battlefield only, 2 = open to all
  phaseStartTime: Date.now(),
  participants: [],
  requirements: {
    tank: { current: 0, required: 1 },
    healer: { current: 0, required: 1 },
    dps: { current: 0, required: 3 }
  }
};

// Phase logic:
if (Date.now() - phaseStartTime < 5 * 60 * 1000) {
  // Phase 1 (first 5 min): Battlefield only
  if (!hero.currentBattlefieldId || hero.currentBattlefieldId !== battlefieldId) {
    return "⚠️ @user Only active battlefield participants can join right now! (Use !join first)";
  }
} else {
  // Phase 2 (after 5 min): Open to anyone
  // No restriction - just need a hero
}
```

---

## 🎲 **Alternative: Streamer Choice on Queue Creation**

```bash
# Default (battlefield only):
!dungeon 2
→ Only battlefield heroes can join

# Open to all:
!dungeon 2 open
→ Anyone with a hero can join

# Followers only (future - requires Twitch API):
!dungeon 2 followers
→ Only followers can join
```

---

## 📝 **Queue Storage Structure**

```javascript
// Firebase: battlefieldQueues/{battlefieldId}
{
  queueId: "dungeon_heroic_1733250123456",
  streamerId: "1087777297",
  streamerName: "theneverendingwar",
  battlefieldId: "twitch:1087777297",
  
  type: "dungeon", // or "raid"
  dungeonId: "heroic", // or raidId
  dungeonName: "Heroic Dungeon",
  minLevel: 21,
  maxLevel: 40,
  
  status: "open", // "open", "ready", "launching", "in_progress"
  phase: 1, // 1 = battlefield only, 2 = open
  phaseStartTime: timestamp,
  
  accessControl: "hybrid", // "battlefield", "open", "hybrid"
  
  participants: [
    {
      userId: "146729989",
      heroId: "VjQrMq10rdy6EMDaXceV",
      username: "tehchno",
      heroName: "tehchno",
      role: "tank", // tank, healer, dps
      class: "guardian",
      level: 27,
      itemScore: 450,
      joinedAt: timestamp
    }
  ],
  
  requirements: {
    tank: { current: 1, required: 1, filled: true },
    healer: { current: 0, required: 1, filled: false },
    dps: { current: 0, required: 3, filled: false }
  },
  
  isReady: false, // All requirements met
  
  createdAt: timestamp,
  expiresAt: timestamp, // 30 minutes
  launchAt: null // Set when ready, launches after 10s countdown
}
```

---

## 🚀 **Implementation Steps**

### **Backend Commands:**

1. ✅ Add to `commandHandler.js`:
   - `!dungeons` - List dungeons
   - `!raids` - List raids
   - `!dungeon [number]` - Start dungeon queue (streamer only)
   - `!raid [number]` - Start raid queue (streamer only)
   - `!qdungeon` - Join dungeon queue
   - `!qraid` - Join raid queue
   - `!qstatus` - Show queue status
   - `!qstart` - Force start (streamer only)
   - `!qcancel` - Cancel queue (streamer only)
   - `!qleave` - Leave queue
   - `!qkick [username]` - Kick from queue (streamer only)

2. ✅ Create queue management service:
   - Track active queues per battlefield
   - Validate role composition
   - Check access control (phase-based or streamer choice)
   - Auto-launch when ready
   - WebSocket broadcasts for queue updates

3. ✅ Instance creation:
   - Create dungeon/raid instance in Firebase
   - Assign all participants
   - Broadcast instance ID to browser sources
   - Switch browser sources to instance view

---

## 📱 **Extension Enhancement (Optional)**

**Not required**, but would be nice:
- Queue status overlay on stream
- Role composition progress bars
- Countdown timer when group is ready
- "QUEUE POP!" notification

**Can work without extension** - all backend + chat!

---

## 🎨 **Chat Messages Examples**

### **Queue Start:**
```
🏰 theneverendingwar is forming a party for Heroic Dungeon! (Lv 21-40)
Type !qdungeon to join! We need:
✅ TANK: 0/1
✅ HEALER: 0/1  
✅ DPS: 0/3
⏰ Queue expires in 30 minutes
```

### **Player Joins:**
```
✅ tehchno (Guardian Tank Lv27) joined the party! (1/5)
TANK: 1/1 ✅ | HEALER: 0/1 ⚠️ | DPS: 0/3 ⚠️
Still needed: 1 Healer, 3 DPS
```

### **Role Full:**
```
⚠️ user456 (Berserker DPS Lv25), sorry! DPS slots are full. (3/3 ✅)
Still needed: 1 Healer
```

### **Group Ready:**
```
🎉 GROUP IS READY! All roles filled!
TANK: 1/1 ✅ | HEALER: 1/1 ✅ | DPS: 3/3 ✅
🏰 Heroic Dungeon launching in 10 seconds...
Participants: tehchno, user123, user456, user789, user999
```

### **Auto-Launch:**
```
⚔️ Dungeon starting NOW! Good luck heroes! 🗡️
```

---

## 🔐 **Access Control Recommendation**

### **Hybrid Phase System (Best Balance):**

```javascript
Phase 1 (0-5 min): Battlefield Priority
  - Only heroes on battlefield can join
  - Rewards active participants
  - Message: "⚠️ @user Queue is currently for battlefield heroes only. Use !join first!"

Phase 2 (5+ min): Open Access
  - Any viewer with a hero can join
  - Prevents queue from stalling
  - Message: "✅ @user joined the party!"

Phase Transition Message:
  "⏰ Queue opened to all viewers! Type !qdungeon to join! (2/5)"
```

### **Alternative: Streamer Flag:**

```bash
# Strict (battlefield only):
!dungeon 2

# Open (anyone):
!dungeon 2 open

# Viewers see:
"🏰 Queue for Heroic Dungeon (Open to all viewers!)"
vs
"🏰 Queue for Heroic Dungeon (Battlefield heroes only)"
```

---

## 🎯 **Role Detection**

### **Auto-Detect from Hero Class:**

```javascript
const ROLE_CATEGORIES = {
  tank: ['guardian', 'paladin', 'warden', 'bloodknight', 'vanguard', 'brewmaster'],
  healer: ['cleric', 'atoner', 'druid', 'lightbringer', 'shaman', 'mistweaver', 'chronomancer', 'bard'],
  dps: ['berserker', 'crusader', 'assassin', 'reaper', 'bladedancer', 'monk', 
        'stormwarrior', 'hunter', 'mage', 'warlock', 'necromancer', 'ranger',
        'shadowpriest', 'mooncaller', 'stormcaller', 'frostmage', 'firemage', 'dragonsorcerer']
};

function getHeroRole(heroClass) {
  if (ROLE_CATEGORIES.tank.includes(heroClass)) return 'tank';
  if (ROLE_CATEGORIES.healer.includes(heroClass)) return 'healer';
  return 'dps';
}
```

### **Join Logic:**

```javascript
async function handleQJoinDungeon(hero, viewerUsername, viewerId, battlefieldId) {
  // Get active queue for this battlefield
  const queueDoc = await db.collection('battlefieldQueues')
    .doc(battlefieldId)
    .get();
  
  if (!queueDoc.exists) {
    return { 
      success: false, 
      message: `@${viewerUsername} No active queue! The streamer needs to use !dungeon [number] first.` 
    };
  }
  
  const queue = queueDoc.data();
  
  // Check if it's a dungeon queue
  if (queue.type !== 'dungeon') {
    return { 
      success: false, 
      message: `@${viewerUsername} Use !qraid to join the raid queue!` 
    };
  }
  
  // Check access control
  const now = Date.now();
  const queueAge = now - queue.phaseStartTime;
  const inPhase1 = queueAge < 5 * 60 * 1000; // First 5 minutes
  
  if (inPhase1 && queue.accessControl === 'hybrid') {
    // Phase 1: Battlefield only
    if (!hero.currentBattlefieldId || hero.currentBattlefieldId !== battlefieldId) {
      return {
        success: false,
        message: `@${viewerUsername} Queue is currently for battlefield heroes only! Use !join first, or wait ${Math.ceil((5 * 60 - queueAge / 1000) / 60)} more minutes.`
      };
    }
  }
  
  // Check if already in queue
  if (queue.participants.some(p => p.userId === viewerId)) {
    return {
      success: false,
      message: `@${viewerUsername} You're already in the queue!`
    };
  }
  
  // Detect hero role
  const heroRole = getHeroRole(hero.role);
  
  // Check if role is full
  if (queue.requirements[heroRole].current >= queue.requirements[heroRole].required) {
    const needed = [];
    if (queue.requirements.tank.current < queue.requirements.tank.required) needed.push('Tank');
    if (queue.requirements.healer.current < queue.requirements.healer.required) needed.push('Healer');
    if (queue.requirements.dps.current < queue.requirements.dps.required) needed.push(`${queue.requirements.dps.required - queue.requirements.dps.current} DPS`);
    
    return {
      success: false,
      message: `@${viewerUsername} Sorry, ${heroRole.toUpperCase()} slots are full! (${queue.requirements[heroRole].current}/${queue.requirements[heroRole].required}) ${needed.length > 0 ? `Still needed: ${needed.join(', ')}` : ''}`
    };
  }
  
  // Add to queue
  const participant = {
    userId: viewerId,
    heroId: hero.id,
    username: viewerUsername,
    heroName: hero.name || viewerUsername,
    role: heroRole,
    class: hero.role,
    level: hero.level,
    itemScore: calculateItemScore(hero),
    joinedAt: admin.firestore.Timestamp.now()
  };
  
  queue.participants.push(participant);
  queue.requirements[heroRole].current++;
  queue.requirements[heroRole].filled = queue.requirements[heroRole].current >= queue.requirements[heroRole].required;
  
  // Check if all roles are filled
  const allFilled = Object.values(queue.requirements).every(req => req.filled);
  queue.isReady = allFilled;
  
  // Save to Firebase
  await db.collection('battlefieldQueues').doc(battlefieldId).set(queue);
  
  // Broadcast update
  const { broadcastToRoom } = await import('../websocket/server.js');
  
  // Build status string
  const tankStatus = queue.requirements.tank.filled ? '✅' : '⚠️';
  const healerStatus = queue.requirements.healer.filled ? '✅' : '⚠️';
  const dpsStatus = queue.requirements.dps.filled ? '✅' : '⚠️';
  
  const statusMsg = `TANK: ${queue.requirements.tank.current}/${queue.requirements.tank.required} ${tankStatus} | HEALER: ${queue.requirements.healer.current}/${queue.requirements.healer.required} ${healerStatus} | DPS: ${queue.requirements.dps.current}/${queue.requirements.dps.required} ${dpsStatus}`;
  
  const totalCount = queue.participants.length;
  const totalRequired = Object.values(queue.requirements).reduce((sum, req) => sum + req.required, 0);
  
  let message = `✅ ${viewerUsername} (${hero.role.charAt(0).toUpperCase() + hero.role.slice(1)} ${heroRole.toUpperCase()} Lv${hero.level}) joined! (${totalCount}/${totalRequired})\n${statusMsg}`;
  
  if (allFilled) {
    message += `\n🎉 GROUP IS READY! All roles filled!`;
    
    // Set launch timer (10 seconds)
    queue.launchAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 10000));
    await db.collection('battlefieldQueues').doc(battlefieldId).set(queue);
    
    // Schedule auto-launch
    setTimeout(async () => {
      await launchDungeonInstance(battlefieldId, queue);
    }, 10000);
    
    message += `\n🏰 ${queue.dungeonName} launching in 10 seconds...`;
  } else {
    // Show what's still needed
    const needed = [];
    if (!queue.requirements.tank.filled) needed.push(`${queue.requirements.tank.required - queue.requirements.tank.current} Tank`);
    if (!queue.requirements.healer.filled) needed.push(`${queue.requirements.healer.required - queue.requirements.healer.current} Healer`);
    if (!queue.requirements.dps.filled) needed.push(`${queue.requirements.dps.required - queue.requirements.dps.current} DPS`);
    
    message += `\nStill needed: ${needed.join(', ')}`;
  }
  
  broadcastToRoom(queue.streamerId, {
    type: 'queue_update',
    queue,
    message
  });
  
  return { success: true, message };
}
```

---

## 🎮 **Instance Launch**

```javascript
async function launchDungeonInstance(battlefieldId, queue) {
  console.log('[Queue] Launching dungeon instance...');
  
  // Create dungeon instance
  const instanceId = `dungeon_${queue.dungeonId}_${Date.now()}`;
  
  const instance = {
    id: instanceId,
    type: 'dungeon',
    dungeonType: queue.dungeonId,
    difficulty: queue.dungeonId,
    participants: queue.participants,
    status: 'in_progress',
    currentRoom: 0,
    totalRooms: 5,
    startedAt: admin.firestore.Timestamp.now(),
    createdBy: queue.streamerId
  };
  
  // Save instance
  await db.collection('dungeonInstances').doc(instanceId).set(instance);
  
  // Update hero locations (move to instance)
  const batch = db.batch();
  queue.participants.forEach(p => {
    const heroRef = db.collection('heroes').doc(p.heroId);
    batch.update(heroRef, {
      currentInstanceId: instanceId,
      currentInstanceType: 'dungeon',
      currentBattlefieldId: admin.firestore.FieldValue.delete() // Leave battlefield
    });
  });
  await batch.commit();
  
  // Broadcast to all participants' browser sources
  const { broadcastToRoom } = await import('../websocket/server.js');
  broadcastToRoom(queue.streamerId, {
    type: 'dungeon_launched',
    instanceId,
    dungeonType: queue.dungeonId,
    participants: queue.participants
  });
  
  // Clear queue
  await db.collection('battlefieldQueues').doc(battlefieldId).delete();
  
  console.log(`[Queue] ✅ Launched dungeon ${instanceId} with ${queue.participants.length} participants`);
}
```

---

## 📋 **Implementation Checklist**

- [ ] Add dungeon/raid list data (difficulty, level requirements, role requirements)
- [ ] Implement `!dungeons` command
- [ ] Implement `!raids` command  
- [ ] Implement `!dungeon [number]` (streamer only, creates queue)
- [ ] Implement `!raid [number]` (streamer only, creates queue)
- [ ] Implement `!qdungeon` (viewers join dungeon queue)
- [ ] Implement `!qraid` (viewers join raid queue)
- [ ] Implement `!qstatus` (show queue status)
- [ ] Implement `!qstart` (streamer force start)
- [ ] Implement `!qcancel` (streamer cancel)
- [ ] Implement `!qleave` (leave queue)
- [ ] Add role validation logic
- [ ] Add access control (phase-based or streamer choice)
- [ ] Add auto-launch when roles filled
- [ ] Add WebSocket broadcasts for queue updates
- [ ] Create dungeon instance on launch
- [ ] Update browser source to listen for instance launch

---

## ❓ **Questions for You:**

1. **Access Control:** Hybrid (battlefield first 5 min, then open) OR streamer choice (!dungeon 2 open)?
2. **Raid Roles:** Fixed (2T/2H/6DPS) OR flexible based on raid type?
3. **Force Start:** Allow streamer to start with missing roles (e.g., 4/5 players)?
4. **Queue Timeout:** 30 minutes good? Or shorter/longer?
5. **Multiple Queues:** Can streamer queue for both dungeon AND raid at same time? (Probably not?)

**Let me know your preferences and I'll implement it!** 🚀


