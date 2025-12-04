# Dungeon/Raid Queue System - Code-Based (Jackbox Style!)

**Date:** December 3, 2025

---

## 🎯 **CODE SYSTEM (Like Jackbox Games!)**

**How it works:**
1. Streamer creates queue → Gets **4-letter code** (e.g., "DRAG")
2. Viewers use code to join → `!qdungeon DRAG`
3. Auto-validates gear score and role requirements
4. Launches when all roles filled

---

## 🎮 **Complete Command Flow**

### **1. List Available Content**

```bash
Viewer: !dungeons
→ "📜 Available Dungeons:
   1. Normal Dungeon (Lv 1-20, Gear Score 0+) - 5 players
   2. Heroic Dungeon (Lv 21-40, Gear Score 200+) - 5 players
   3. Mythic Dungeon (Lv 41+, Gear Score 500+) - 5 players"

Viewer: !raids
→ "📜 Available Raids:
   1. Dragon's Lair (Lv 30+, Gear Score 300+) - 10 players
   2. Demon Citadel (Lv 40+, Gear Score 500+) - 10 players
   3. Frozen Wastes (Lv 50+, Gear Score 700+) - 10 players"
```

### **2. Streamer Creates Queue**

```bash
Streamer: !dungeon 2
→ Creates Heroic Dungeon queue
→ Generates 4-letter code
→ Broadcasts:
  "🏰 theneverendingwar is forming a HEROIC DUNGEON party!
   📋 Room Code: HERO
   🎯 Requirements: Lv 21-40, Gear Score 200+
   👥 Roles: 1 Tank, 1 Healer, 3 DPS
   
   Type !qdungeon HERO to join!
   (0/5) - TANK: 0/1 | HEALER: 0/1 | DPS: 0/3"
```

### **3. Viewers Join with Code**

```bash
Viewer: !qdungeon HERO
→ Validates:
  ✅ Code is valid (HERO)
  ✅ Hero level 21-40 (meets requirement)
  ✅ Gear score 250 (meets 200+ requirement)
  ✅ Tank role needed (slot available)

→ Adds to queue:
  "✅ tehchno (Guardian Tank Lv27, GS 250) joined HERO! (1/5)
   TANK: 1/1 ✅ | HEALER: 0/1 ⚠️ | DPS: 0/3 ⚠️
   Still needed: 1 Healer, 3 DPS"
```

### **4. Gear Score Validation**

```bash
# If gear score too low:
Viewer: !qdungeon HERO
→ "⚠️ @user456 Your gear score is 150, but Heroic Dungeon requires 200+!
   Tip: Equip better gear or try Normal Dungeon (!dungeon 1)"

# If level too low:
→ "⚠️ @user789 Your hero is Lv15, but Heroic Dungeon requires Lv21+!
   Tip: Level up more or try Normal Dungeon!"
```

### **5. Role Blocking**

```bash
# If role slots are full:
Viewer (DPS): !qdungeon HERO
→ "⚠️ @user999 DPS slots are full! (3/3 ✅)
   Still needed: 1 Healer
   (If you have a healer hero, use !qjoin [number])"
```

### **6. Group Ready**

```bash
# When all roles filled:
→ "🎉 GROUP IS READY!
   TANK: 1/1 ✅ | HEALER: 1/1 ✅ | DPS: 3/3 ✅
   
   Party Members:
   🛡️ tehchno (Guardian Lv27)
   💚 user123 (Cleric Lv32)
   ⚔️ user456 (Berserker Lv25)
   ⚔️ user789 (Mage Lv28)
   ⚔️ user999 (Assassin Lv30)
   
   🏰 Heroic Dungeon launching in 10 seconds... Get ready! ⚔️"
```

---

## 🔢 **Code Generation**

### **Auto-Generated Codes:**

```javascript
// 4-letter memorable codes based on dungeon/raid type
const CODE_PREFIXES = {
  dungeon_normal: ['NORM', 'EASY', 'CAVE', 'CRYPT'],
  dungeon_heroic: ['HERO', 'HARD', 'EPIC', 'ELITE'],
  dungeon_mythic: ['MYTH', 'GODS', 'APEX', 'DOOM'],
  raid_dragons: ['DRAG', 'FIRE', 'WORM', 'WING'],
  raid_demon: ['DEMO', 'HELL', 'VOID', 'DARK'],
  raid_frozen: ['SNOW', 'COLD', 'FRZN', 'CHILL']
};

function generateQueueCode(type, difficulty) {
  const key = `${type}_${difficulty}`;
  const prefixes = CODE_PREFIXES[key] || ['GAME'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  return prefix;
}

// If duplicate, add number: HERO → HERO2 → HERO3
```

### **Code Validation:**

```javascript
// Check if code is valid and active
async function validateQueueCode(code) {
  const queuesSnapshot = await db.collection('battlefieldQueues')
    .where('code', '==', code.toUpperCase())
    .where('status', '==', 'open')
    .limit(1)
    .get();
  
  if (queuesSnapshot.empty) {
    return { 
      valid: false, 
      message: `Invalid or expired queue code: ${code}` 
    };
  }
  
  const queue = queuesSnapshot.docs[0].data();
  
  // Check if expired (30 min)
  if (queue.expiresAt.toMillis() < Date.now()) {
    return { 
      valid: false, 
      message: `Queue code ${code} has expired` 
    };
  }
  
  return { valid: true, queue, queueDoc: queuesSnapshot.docs[0] };
}
```

---

## 📊 **Gear Score Requirements**

### **Dungeons:**
```javascript
const DUNGEON_REQUIREMENTS = {
  normal: {
    minLevel: 1,
    maxLevel: 20,
    minGearScore: 0,
    description: "Normal Dungeon",
    duration: "~15 min",
    roles: { tank: 1, healer: 1, dps: 3 }
  },
  heroic: {
    minLevel: 21,
    maxLevel: 40,
    minGearScore: 200,
    description: "Heroic Dungeon",
    duration: "~25 min",
    roles: { tank: 1, healer: 1, dps: 3 }
  },
  mythic: {
    minLevel: 41,
    maxLevel: 100,
    minGearScore: 500,
    description: "Mythic Dungeon",
    duration: "~40 min",
    roles: { tank: 1, healer: 1, dps: 3 }
  }
};
```

### **Raids:**
```javascript
const RAID_REQUIREMENTS = {
  dragons_lair: {
    name: "Dragon's Lair",
    minLevel: 30,
    minGearScore: 300,
    players: 10,
    description: "Face the Elder Dragon",
    duration: "~45 min",
    roles: { tank: 2, healer: 2, dps: 6 }, // Flexible: 2T + 2-3H + 5-6DPS
    minHealers: 1 // REQUIRED: At least 1 healer
  },
  demon_citadel: {
    name: "Demon Citadel",
    minLevel: 40,
    minGearScore: 500,
    players: 10,
    description: "Assault the Demon Lord's fortress",
    duration: "~60 min",
    roles: { tank: 2, healer: 2, dps: 6 },
    minHealers: 1
  },
  frozen_wastes: {
    name: "Frozen Wastes",
    minLevel: 50,
    minGearScore: 700,
    players: 10,
    description: "Survive the frozen tundra",
    duration: "~60 min",
    roles: { tank: 2, healer: 3, dps: 5 },
    minHealers: 2 // Harder raid, needs more healing
  }
};
```

### **Gear Score Calculation:**
```javascript
function calculateGearScore(hero) {
  let totalScore = 0;
  const rarityValues = {
    common: 10,
    uncommon: 25,
    rare: 50,
    epic: 100,
    legendary: 200
  };
  
  // Sum all equipped items
  if (hero.equipment) {
    Object.values(hero.equipment).forEach(item => {
      if (item && item.rarity) {
        totalScore += rarityValues[item.rarity] || 0;
      }
    });
  }
  
  return totalScore;
}
```

---

## 🎯 **Your Answers Applied:**

### ✅ **1. Access Control: CODE SYSTEM!**
- Streamer gets code when creating queue
- Only people with code can join
- Natural access control (don't share code publicly = private)
- Share on stream = open to all viewers

### ✅ **2. Force Start: Roles MUST Be Filled**
- `!qstart` only works if all required roles are present
- Can't start 4/5 dungeon without healer
- Prevents wipes from bad composition

### ✅ **3. Raid Flexibility: Flexible Roles, BUT Minimum Healers**
- Can do 2T/2H/6DPS OR 2T/3H/5DPS
- **MUST have at least 1-2 healers** (depends on raid)
- Prevents impossible raids with no healing

### ✅ **4. One Queue at a Time**
- Only one active queue per battlefield
- If streamer tries to queue while one exists: "Already have an active queue for Heroic Dungeon (code: HERO). Use !qcancel first."

---

## 📋 **Updated Command Examples:**

```bash
# Streamer starts:
!dungeon 2
→ "🏰 Heroic Dungeon queue created!
   📋 Room Code: HERO
   Type !qdungeon HERO to join!
   Requirements: Lv21-40, Gear Score 200+
   Roles: (0/5) TANK: 0/1 | HEALER: 0/1 | DPS: 0/3"

# Viewer joins with code:
!qdungeon HERO
→ Validates code, level, gear score, role availability
→ "✅ tehchno (Guardian Tank Lv27, GS 250) joined HERO! (1/5)"

# Check status:
!qstatus
→ "📋 Queue HERO (Heroic Dungeon):
   (3/5) TANK: 1/1 ✅ | HEALER: 0/1 ⚠️ | DPS: 2/3 ⚠️
   Party: tehchno (Tank), user456 (DPS), user789 (DPS)
   Still needed: 1 Healer, 1 DPS"

# Invalid join attempts:
!qdungeon HERO
→ "⚠️ Gear score too low (150/200 required)"
→ "⚠️ Level too low (Lv15, need Lv21+)"
→ "⚠️ DPS slots full! Need: 1 Healer"
→ "⚠️ Invalid code: HERO (no active queue)"
```

---

## 🔧 **Implementation Details:**

### **Queue Structure:**
```javascript
{
  queueId: "dungeon_heroic_1733250123456",
  streamerId: "1087777297",
  streamerName: "theneverendingwar",
  battlefieldId: "twitch:1087777297",
  
  code: "HERO", // 4-letter code
  
  type: "dungeon", // or "raid"
  difficulty: "heroic",
  name: "Heroic Dungeon",
  
  requirements: {
    minLevel: 21,
    maxLevel: 40,
    minGearScore: 200,
    roles: {
      tank: { current: 1, required: 1, filled: true },
      healer: { current: 0, required: 1, filled: false },
      dps: { current: 2, required: 3, filled: false }
    },
    minHealers: 1 // For raids - MUST have at least this many
  },
  
  participants: [
    {
      userId: "146729989",
      heroId: "VjQrMq10rdy6EMDaXceV",
      username: "tehchno",
      heroName: "tehchno",
      role: "tank",
      class: "guardian",
      level: 27,
      gearScore: 250,
      joinedAt: timestamp
    }
  ],
  
  status: "open", // "open", "ready", "launching", "in_progress"
  isReady: false,
  
  createdAt: timestamp,
  expiresAt: timestamp, // 30 minutes
  launchAt: null
}
```

### **Code Generation:**
```javascript
function generateQueueCode(type, difficulty) {
  // Memorable 4-letter codes
  const prefixes = {
    dungeon_normal: ['CAVE', 'MAZE', 'TOMB', 'RUIN'],
    dungeon_heroic: ['HERO', 'EPIC', 'HARD', 'PEAK'],
    dungeon_mythic: ['MYTH', 'GODS', 'APEX', 'FATE'],
    raid_dragons_lair: ['DRAG', 'FIRE', 'WORM', 'CLAW'],
    raid_demon_citadel: ['DEMO', 'HELL', 'DOOM', 'VOID'],
    raid_frozen_wastes: ['SNOW', 'COLD', 'FRZN', 'CHILL']
  };
  
  const key = `${type}_${difficulty}`;
  const options = prefixes[key] || ['RAID'];
  const base = options[Math.floor(Math.random() * options.length)];
  
  // Check if code already in use
  const existing = await db.collection('battlefieldQueues')
    .where('code', '==', base)
    .where('status', '==', 'open')
    .get();
  
  if (!existing.empty) {
    // Add number: HERO → HER2 → HER3
    return base.slice(0, 3) + Math.floor(Math.random() * 10);
  }
  
  return base;
}
```

---

## 🎯 **Commands**

### **List Commands (Anyone):**
- `!dungeons` - List dungeons with numbers, levels, gear score requirements
- `!raids` - List raids with numbers, levels, gear score requirements

### **Queue Creation (Streamer Only):**
- `!dungeon [number]` - Create dungeon queue, get code
- `!raid [number]` - Create raid queue, get code
- Examples: `!dungeon 2`, `!raid 1`

### **Join Queue (Viewers):**
- `!qdungeon [code]` - Join dungeon queue with code
- `!qraid [code]` - Join raid queue with code
- `!qjoin [code] [hero#]` - Join with specific hero (from !heroes list)
- Examples: `!qdungeon HERO`, `!qraid DRAG`

### **Queue Management:**
- `!qstatus` - Show current queue status (anyone)
- `!qstatus [code]` - Show specific queue (if multiple exist)
- `!qstart` - Force launch (streamer only, requires all roles filled)
- `!qcancel` - Cancel queue (streamer only)
- `!qleave` - Leave queue
- `!qkick [username]` - Kick player (streamer only)

---

## ✅ **Validation Logic**

### **When Viewer Joins:**

```javascript
async function handleQDungeonCommand(hero, code, viewerUsername, viewerId) {
  // 1. Validate code
  const validation = await validateQueueCode(code);
  if (!validation.valid) {
    return { success: false, message: `@${viewerUsername} ${validation.message}` };
  }
  
  const queue = validation.queue;
  
  // 2. Check if dungeon queue (not raid)
  if (queue.type !== 'dungeon') {
    return { 
      success: false, 
      message: `@${viewerUsername} ${code} is a RAID queue! Use !qraid ${code} instead.` 
    };
  }
  
  // 3. Check if already in queue
  if (queue.participants.some(p => p.userId === viewerId)) {
    return { 
      success: false, 
      message: `@${viewerUsername} You're already in queue ${code}!` 
    };
  }
  
  // 4. Check level requirement
  if (hero.level < queue.requirements.minLevel || hero.level > queue.requirements.maxLevel) {
    return { 
      success: false, 
      message: `@${viewerUsername} Your hero is Lv${hero.level}, but ${queue.name} requires Lv${queue.requirements.minLevel}-${queue.requirements.maxLevel}!` 
    };
  }
  
  // 5. Check gear score requirement
  const gearScore = calculateGearScore(hero);
  if (gearScore < queue.requirements.minGearScore) {
    return { 
      success: false, 
      message: `@${viewerUsername} Your gear score is ${gearScore}, but ${queue.name} requires ${queue.requirements.minGearScore}+! Equip better gear!` 
    };
  }
  
  // 6. Detect role
  const heroRole = getHeroRole(hero.role);
  
  // 7. Check if role slot available
  const roleReq = queue.requirements.roles[heroRole];
  if (roleReq.current >= roleReq.required) {
    const needed = [];
    if (queue.requirements.roles.tank.current < queue.requirements.roles.tank.required) {
      needed.push(`${queue.requirements.roles.tank.required - queue.requirements.roles.tank.current} Tank`);
    }
    if (queue.requirements.roles.healer.current < queue.requirements.roles.healer.required) {
      needed.push(`${queue.requirements.roles.healer.required - queue.requirements.roles.healer.current} Healer`);
    }
    if (queue.requirements.roles.dps.current < queue.requirements.roles.dps.required) {
      needed.push(`${queue.requirements.roles.dps.required - queue.requirements.roles.dps.current} DPS`);
    }
    
    return { 
      success: false, 
      message: `@${viewerUsername} ${heroRole.toUpperCase()} slots are full! (${roleReq.current}/${roleReq.required} ✅) ${needed.length > 0 ? `Still needed: ${needed.join(', ')}` : 'Group is ready!'}` 
    };
  }
  
  // 8. Add to queue
  // ... (implementation continues)
}
```

---

## 🔒 **Access Control via Codes**

### **Natural Privacy:**
```bash
# Private queue (don't share code):
Streamer shows code on Discord/friends only
→ Only people who see the code can join
→ Natural access control

# Public queue (share on stream):
Streamer shows code on stream
→ Anyone watching can join
→ Open to all viewers
```

### **Additional Control (Optional):**
```bash
# Streamer can make queue "followers only":
!dungeon 2 followers
→ Code: HERO
→ Validates follower status via Twitch API before allowing join
→ "⚠️ @user This queue is for followers only!"
```

---

## 🚀 **Force Start Logic**

### **Streamer: !qstart**

```javascript
async function handleQStartCommand(viewerUsername, streamerId, battlefieldId) {
  // 1. Check authorization (must be streamer)
  const queue = await getActiveQueue(battlefieldId);
  if (!queue) {
    return { success: false, message: `@${viewerUsername} No active queue to start!` };
  }
  
  // 2. Validate all REQUIRED roles are filled
  const requirements = queue.requirements.roles;
  const missingRoles = [];
  
  if (requirements.tank.current < requirements.tank.required) {
    missingRoles.push(`${requirements.tank.required - requirements.tank.current} Tank`);
  }
  if (requirements.healer.current < requirements.healer.required) {
    missingRoles.push(`${requirements.healer.required - requirements.healer.required} Healer`);
  }
  if (requirements.dps.current < requirements.dps.required) {
    missingRoles.push(`${requirements.dps.required - requirements.dps.current} DPS`);
  }
  
  if (missingRoles.length > 0) {
    return { 
      success: false, 
      message: `@${viewerUsername} Cannot start! Missing required roles: ${missingRoles.join(', ')}. Current: (${queue.participants.length}/${getTotalRequired(requirements)})` 
    };
  }
  
  // 3. For raids, check minimum healers
  if (queue.type === 'raid') {
    const healerCount = requirements.healer.current;
    const minHealers = queue.requirements.minHealers || 1;
    
    if (healerCount < minHealers) {
      return {
        success: false,
        message: `@${viewerUsername} Cannot start raid! Need at least ${minHealers} healer${minHealers > 1 ? 's' : ''}, currently have ${healerCount}.`
      };
    }
  }
  
  // 4. All requirements met - launch!
  await launchInstance(battlefieldId, queue);
  
  return {
    success: true,
    message: `⚡ ${viewerUsername} is force-starting the ${queue.name}! Launching NOW!`
  };
}
```

---

## 🎨 **Example Full Flow**

```bash
# 1. Streamer creates queue:
theneverendingwar: !dungeon 2

→ "🏰 theneverendingwar created a HEROIC DUNGEON queue!
   📋 Room Code: HERO
   🎯 Requirements: Lv21-40, Gear Score 200+
   👥 Roles: 1 Tank, 1 Healer, 3 DPS
   ⏰ Expires in 30 minutes
   
   Type !qdungeon HERO to join!"

# 2. Viewers join:
tehchno: !qdungeon HERO
→ "✅ tehchno (Guardian Tank Lv27, GS 250) joined HERO! (1/5)
   TANK: 1/1 ✅ | HEALER: 0/1 ⚠️ | DPS: 0/3 ⚠️"

user123: !qdungeon HERO
→ "✅ user123 (Cleric Healer Lv32, GS 180) joined HERO! (2/5)
   TANK: 1/1 ✅ | HEALER: 1/1 ✅ | DPS: 0/3 ⚠️"

lowbie: !qdungeon HERO
→ "⚠️ lowbie Your gear score is 50, but Heroic Dungeon requires 200+!"

user456: !qdungeon HERO  # DPS
user789: !qdungeon HERO  # DPS
user999: !qdungeon HERO  # DPS

→ "🎉 GROUP IS READY! All roles filled! (5/5)
   TANK: 1/1 ✅ | HEALER: 1/1 ✅ | DPS: 3/3 ✅
   
   Party Roster:
   🛡️ tehchno (Guardian Lv27, GS 250)
   💚 user123 (Cleric Lv32, GS 180)
   ⚔️ user456 (Berserker Lv25, GS 220)
   ⚔️ user789 (Mage Lv28, GS 310)
   ⚔️ user999 (Assassin Lv30, GS 275)
   
   🏰 Heroic Dungeon launching in 10 seconds... ⚔️"

# 3. Auto-launch after 10 seconds
→ [Creates dungeon instance]
→ [Updates all hero locations to instance]
→ [Broadcasts to browser sources]
→ "⚔️ Dungeon started! Good luck heroes! 🗡️"
```

---

## 📊 **One Queue at a Time**

```bash
# If streamer tries to create second queue:
theneverendingwar: !raid 1

→ "⚠️ You already have an active queue: Heroic Dungeon (code: HERO, 3/5 players)
   Options:
   - Wait for it to fill and launch
   - Use !qcancel to cancel it
   - Use !qstart to force start (if roles are filled)"
```

---

## 🔧 **Implementation Checklist**

### **Backend:**
- [ ] Add dungeon/raid requirement data (levels, gear scores, roles)
- [ ] Implement `!dungeons` command (list with numbers)
- [ ] Implement `!raids` command (list with numbers)
- [ ] Implement `!dungeon [number]` (create queue, generate code, streamer only)
- [ ] Implement `!raid [number]` (create queue, generate code, streamer only)
- [ ] Implement `!qdungeon [code]` (join dungeon queue)
- [ ] Implement `!qraid [code]` (join raid queue)
- [ ] Implement code validation
- [ ] Implement gear score validation
- [ ] Implement level validation
- [ ] Implement role slot validation
- [ ] Implement minimum healer check for raids
- [ ] Implement `!qstatus` command
- [ ] Implement `!qstart` command (streamer only, requires filled roles)
- [ ] Implement `!qcancel` command (streamer only)
- [ ] Implement `!qleave` command
- [ ] Add one-queue-per-battlefield limit
- [ ] Add queue expiration (30 min)
- [ ] Create instance on launch
- [ ] WebSocket broadcasts for queue updates

### **Frontend (Clean Battlefield):**
- [ ] Listen for `queue_created` WebSocket event (show code on stream overlay?)
- [ ] Listen for `dungeon_launched` / `raid_launched` event
- [ ] Transition browser source to instance view

---

## 🎯 **Ready to Implement?**

This system:
- ✅ Uses **codes** (Jackbox style)
- ✅ Validates **gear score** and **level**
- ✅ Blocks joins when **roles are full**
- ✅ Requires **all roles filled** before !qstart
- ✅ Ensures **minimum healers** for raids (flexible comp otherwise)
- ✅ **One queue at a time** per battlefield
- ✅ **No extension needed** - all backend!

**Should I start implementing this?** 🚀


