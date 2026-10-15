# Command System Audit & Dungeon/Raid Queue Design

**Date:** December 3, 2025

---

## ✅ **Current Available Commands**

### **Core Commands (No Hero Required)**
- `!join [class]` - Join battlefield (creates hero if needed)
- `!join [number]` - Join with specific hero from !heroes list
- `!classes` - List all available classes
- `!help` / `!commands` - Show help
- `!heroes` - List all your characters

### **Hero Commands (Requires !join First)**
- `!stats` - Show hero stats
- `!gear` - Show equipped gear
- `!shop` - Show shop items
- `!buy [item]` - Buy from shop
- `!use [item]` - Use consumable
- `!auto` - Toggle auto-buy mode
- `!claim` - Claim idle rewards
- `!tokens` - Show token balance
- `!leave` - Leave battlefield (all heroes)
- `!leave [number]` - Leave specific hero from !heroes list
- `!rejoin` - Rejoin with current hero
- `!rejoin [class]` - Switch class and rejoin
- `!rejoin [number]` - Rejoin with specific hero
- `!switch [class]` - Switch class (stays on battlefield)

### **Combat Commands** (Legacy - Not Used in Browser Source)
- `!attack` - Attack enemy
- `!heal` - Heal ally
- `!cast` - Cast spell
- `!defend` - Defensive stance
- `!rest` - Rest to heal
- `!dispel` - Remove debuff

### **Profession Commands**
- `!profession` - Show profession info
- `!gather` / `!herbs` - Gather materials
- `!recipes` - Show crafting recipes
- `!craft [item]` - Craft item
- `!elixirs` - Show available elixirs

### **Progression Commands**
- `!quest` / `!quests` - Show quest progress
- `!skills` - Show skill points and allocation
- `!leaderboard` / `!rank` - Show rankings

### **Admin Commands (Streamer Only)**
- `!level [username] [level]` - Set hero level
- `!grantlegendary` / `!grantlegendaries` - Grant legendary items
- `!push` / `!pushfirebase` - Force Firebase sync
- `!sync` / `!syncfirebase` - Sync state

### **Existing Queue Systems**

#### **Dungeon Queue (Web UI):**
- Join via website `/dungeon-finder` page
- Matchmaking: 1 tank + 1 healer + 3 DPS
- Auto-matches when group is full

#### **Raid Queue (Web UI):**
- Join via guild signup page `/raids/guild-signup/:raidId`
- Tracks participants and roles
- Manual start by raid leader

---

## 🎯 **NEW FEATURE: Streamer-Initiated Queue System**

### **Design Goals:**
1. Streamer can queue for dungeon/raid from Twitch chat
2. Viewers can join with simple command
3. Auto-forms group when enough people join
4. Launches dungeon/raid instance automatically

### **Proposed Commands:**

#### **Option 1: Separate Commands (Clearest)**
```
Streamer:
  !qdungeon [difficulty]    → Queue for dungeon (normal/heroic/mythic)
  !qraid [raidName]         → Queue for specific raid
  !qstart                   → Force start with current group
  !qcancel                  → Cancel queue

Viewers:
  !qjoin                    → Join streamer's active queue
  !qjoin [number]           → Join with specific hero
  !qleave                   → Leave queue
```

**Pros:** Very clear what each command does  
**Cons:** More commands to remember

#### **Option 2: Unified Queue Command (Simpler)**
```
Streamer:
  !queue dungeon [difficulty]   → Queue for dungeon
  !queue raid [raidName]        → Queue for raid
  !queue start                  → Force start
  !queue cancel                 → Cancel queue
  !queue status                 → Show queue status

Viewers:
  !qjoin                        → Join active queue
  !qjoin [number]               → Join with specific hero
  !qleave                       → Leave queue
```

**Pros:** Single command system, extensible  
**Cons:** Slightly more typing for streamers

#### **Option 3: Simple Toggle (Easiest)**
```
Streamer:
  !dungeon                  → Queue for normal dungeon
  !dungeon heroic           → Queue for heroic dungeon
  !dungeon mythic           → Queue for mythic dungeon
  !raid [name]              → Queue for specific raid
  !start                    → Force start queue
  !cancelqueue              → Cancel queue

Viewers:
  !join                     → Join active queue (auto-detects)
                              OR join battlefield if no queue
  !joinqueue                → Explicitly join queue
  !leave                    → Leave queue/battlefield
```

**Pros:** Shortest commands, least typing  
**Cons:** !join becomes overloaded (battlefield vs queue)

---

## 💡 **Recommendation: Option 2 (Unified Queue)**

**Why:**
- Clear separation between streamer queue management and viewer joining
- Extensible (can add more queue types later)
- Not too complex
- Doesn't overload existing commands

### **Implementation:**

#### **Backend Changes:**

1. **Add queue management to `commandHandler.js`:**
```javascript
case 'queue':
  return await handleQueueCommand(hero, args, viewerUsername, viewerId, streamerUsername, battlefieldId);
```

2. **Create `handleQueueCommand` function:**
- Streamer only: `!queue dungeon [difficulty]`, `!queue raid [name]`
- Create queue entry in Firebase
- Broadcast to chat: "Queue open for Normal Dungeon! Type !qjoin to join!"
- Track participants and roles
- Auto-match when group is full (1T + 1H + 3DPS)

3. **Add `!qjoin` and `!qleave` commands:**
- Viewers join with their active hero
- Check role composition
- Notify when group is ready
- Auto-launch instance when full

#### **Queue Storage Structure:**
```javascript
// Firebase: battlefieldQueues/{battlefieldId}
{
  streamerId: "123456",
  streamerName: "theneverendingwar",
  type: "dungeon", // or "raid"
  dungeonDifficulty: "normal", // or "heroic", "mythic"
  raidName: "Dragon's Lair", // if type === "raid"
  status: "open", // "open", "starting", "in_progress", "completed"
  participants: [
    { userId, heroId, username, role, itemScore, joinedAt }
  ],
  roleRequirements: {
    tank: { current: 1, required: 1 },
    healer: { current: 1, required: 1 },
    dps: { current: 2, required: 3 }
  },
  createdAt: timestamp,
  expiresAt: timestamp // 30 minutes
}
```

#### **Flow:**

1. **Streamer queues:**
   ```
   !queue dungeon heroic
   → Creates battlefieldQueues/twitch:123456
   → Broadcasts: "🏰 theneverendingwar is queuing for Heroic Dungeon! Type !qjoin to join the party!"
   ```

2. **Viewers join:**
   ```
   tehchno: !qjoin
   → Adds tehchno to queue
   → Broadcasts: "tehchno (Monk DPS Lv27) joined the queue! (2/5)"
   ```

3. **Group fills:**
   ```
   → Auto-checks role composition
   → 1T + 1H + 3DPS = READY!
   → Broadcasts: "🎉 Group is ready! Dungeon starting in 10 seconds..."
   → Creates dungeon instance
   → Launches all participants into instance
   ```

4. **Dungeon runs:**
   ```
   → Browser source switches to dungeon view
   → Progress through rooms
   → Fight boss
   → Get loot
   → Return to battlefield
   ```

---

## 🔧 **Implementation Checklist**

### **Backend:**
- [ ] Add `handleQueueCommand` to commandHandler.js
- [ ] Add `handleQJoinCommand` to commandHandler.js
- [ ] Add `handleQLeaveCommand` to commandHandler.js
- [ ] Create `battlefieldQueues` collection structure
- [ ] Implement auto-matchmaking logic
- [ ] Add queue expiration (30 min timeout)
- [ ] Broadcast queue updates via WebSocket

### **Frontend (Extension - Optional):**
- [ ] Show queue status overlay
- [ ] Display party composition
- [ ] Countdown timer when group is ready
- [ ] Notification when queue pops

### **Frontend (Clean Battlefield):**
- [ ] Listen for queue_ready WebSocket event
- [ ] Transition to dungeon view
- [ ] Load dungeon instance data
- [ ] Return to battlefield after completion

---

## 🎮 **Alternative: Streamer-Only Group (No Queue)**

If you want **streamer to form group manually** instead of matchmaking:

```
Streamer:
  !dungeon invite         → Opens party for viewers to join
  !raid [name] invite     → Opens raid party
  
Viewers:
  !joinparty             → Join streamer's open party
  !leaveparty            → Leave party

Streamer:
  !startdungeon          → Start dungeon with current party
  !startraid             → Start raid with current party
```

**Pros:** 
- More control for streamer
- Can start with any group size
- No matchmaking wait

**Cons:**
- Manual group formation
- Streamer has to manage roster

---

## 📊 **Which Approach Do You Prefer?**

1. **Unified Queue** (`!queue dungeon`, `!qjoin`) - Clearest
2. **Simple Commands** (`!dungeon`, `!qjoin`) - Shortest
3. **Manual Party** (`!dungeon invite`, `!joinparty`) - Most control

**My Recommendation:** **Option 1 (Unified Queue)** for clarity and extensibility!

What do you think? 🎯


