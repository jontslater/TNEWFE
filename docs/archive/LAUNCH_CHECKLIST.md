# Launch Checklist - Pre-Launch Testing & Implementation

**Date:** January 2025  
**Goal:** Complete all critical features and test core systems before launch

---

## 🎯 PENDING IMPLEMENTATION ITEMS

### **HIGH PRIORITY (Do First)**

#### **1. Token Purchase System (Step 8.4)** ⭐⭐⭐
**Status:** ❌ Not Implemented  
**Priority:** HIGH - Immediate revenue generation

**What to Implement:**
- [ ] Create token pack configurations (4 tiers: $0.99, $4.99, $9.99, $24.99)
- [ ] Add token purchase UI to Store page
- [ ] Create backend endpoint: `POST /api/purchases/token-pack`
- [ ] Connect Stripe payment processing
- [ ] Grant tokens and gold to selected hero
- [ ] Test payment flow end-to-end

**Estimated Time:** 1-2 days  
**Revenue Impact:** $30-1,700/month (depending on player count)

---

### **MEDIUM PRIORITY (Nice to Have)**

#### **2. Notification System (Step 10.3)** ⭐⭐
**Status:** ❌ Not Implemented  
**Priority:** MEDIUM - User experience improvement

**What to Implement:**
- [ ] Notification schema (userId, type, title, message, link, read, timestamp)
- [ ] Backend endpoints: GET, POST (mark read), DELETE
- [ ] Notification bell icon in navigation (with unread count)
- [ ] Notification dropdown panel
- [ ] Auto-create notifications for events (mail, trades, achievements)
- [ ] Toast notifications for real-time events

**Estimated Time:** 2-3 days  
**Note:** Can be added post-launch if needed

---

#### **3. Trade System (Step 10.4)** ⭐⭐
**Status:** ❌ Not Implemented  
**Priority:** MEDIUM - Direct player trading

**What to Implement:**
- [ ] Trade schema (initiator, recipient, items, gold, tokens, status)
- [ ] Trade request/accept/reject/confirm endpoints
- [ ] Trade window UI (show both sides, confirmation buttons)
- [ ] Trade validation (cannot trade with yourself, must have items)
- [ ] Trade timeout (5 minutes)

**Estimated Time:** 3-4 days  
**Note:** Mail system already provides trading alternative - can defer

---

### **LOW PRIORITY (Optional)**

#### **4. Chat Badge (Step 1.3.5)** ⭐
**Status:** ❌ Not Implemented  
**Priority:** LOW - Platinum tier only

**What to Implement:**
- [ ] Determine chat system (web chat exists - use that)
- [ ] Display founder badge next to username in chat
- [ ] Show "Platinum Founder" status

**Estimated Time:** 1-2 days  
**Note:** Low priority, can be added post-launch

---

## 🧪 PRE-LAUNCH TESTING CHECKLIST

### **CRITICAL: Dungeon & Raid Testing** ⚠️

#### **Dungeon System Testing**

**Basic Functionality:**
- [ ] **Queue System:**
  - [ ] Can queue for normal dungeon (5 players)
  - [ ] Can queue for heroic dungeon (5 players)
  - [ ] Can queue for mythic dungeon (5 players)
  - [ ] Queue shows correct requirements (level, gear score)
  - [ ] Queue shows role requirements (1 tank, 1 healer, 3 DPS)
  - [ ] Queue status updates correctly (waiting, matched, in progress)

- [ ] **Matchmaking:**
  - [ ] Matches 5 players correctly (1 tank, 1 healer, 3 DPS)
  - [ ] Matches players within level range
  - [ ] Matches players with appropriate gear scores
  - [ ] Party members stay together when queuing as party
  - [ ] Incomplete parties can fill with individuals

- [ ] **Dungeon Instance:**
  - [ ] Instance creates correctly when match found
  - [ ] All 5 players spawn in same instance
  - [ ] Dungeon rooms load correctly (5 rooms per dungeon)
  - [ ] Room progression works (advance to next room when enemies cleared)
  - [ ] Final room completion marks dungeon complete

- [ ] **Combat:**
  - [ ] Enemies spawn correctly in each room
  - [ ] Enemy types match room definitions
  - [ ] Combat mechanics work (damage, healing, abilities)
  - [ ] Death/resurrection works
  - [ ] All 5 players can participate in combat

- [ ] **Rewards:**
  - [ ] XP granted on completion
  - [ ] Gold granted on completion
  - [ ] Loot drops correctly (appropriate rarity for dungeon difficulty)
  - [ ] Rewards distributed to all players
  - [ ] Instance closes after completion

- [ ] **Edge Cases:**
  - [ ] Player disconnects during dungeon (handles gracefully)
  - [ ] Player leaves dungeon (instance continues with remaining players)
  - [ ] All players die (instance fails, no rewards)
  - [ ] Queue timeout (removes from queue after timeout)
  - [ ] Multiple dungeons running simultaneously

---

#### **Raid System Testing**

**Basic Functionality:**
- [ ] **Queue System:**
  - [ ] Can queue for normal raid (10 players)
  - [ ] Can queue for heroic raid (10 players)
  - [ ] Can queue for mythic raid (10 players)
  - [ ] Queue shows correct requirements (level, gear score)
  - [ ] Queue shows role requirements (2 tanks, 2-3 healers, 5-6 DPS)
  - [ ] Queue status updates correctly

- [ ] **Matchmaking:**
  - [ ] Matches 10 players correctly (2 tanks, 2-3 healers, 5-6 DPS)
  - [ ] Flexible role matching works (can use 1-2 tanks, 1-3 healers)
  - [ ] Matches players within level range
  - [ ] Matches players with appropriate gear scores
  - [ ] Party members stay together when queuing as party
  - [ ] Large parties (5-10 players) can queue together

- [ ] **Raid Instance:**
  - [ ] Instance creates correctly when match found
  - [ ] All 10 players spawn in same instance
  - [ ] Boss spawns correctly
  - [ ] Boss mechanics work (phases, abilities, enrage)
  - [ ] Raid completion works (boss defeat)

- [ ] **Combat:**
  - [ ] Boss combat mechanics work
  - [ ] Tank threat/aggro works correctly
  - [ ] Healer healing works correctly
  - [ ] DPS damage works correctly
  - [ ] Boss abilities/mechanics trigger correctly
  - [ ] Death/resurrection works
  - [ ] All 10 players can participate

- [ ] **Rewards:**
  - [ ] XP granted on completion
  - [ ] Gold granted on completion
  - [ ] Loot drops correctly (appropriate rarity for raid difficulty)
  - [ ] Rewards distributed to all players
  - [ ] Instance closes after completion

- [ ] **Edge Cases:**
  - [ ] Player disconnects during raid (handles gracefully)
  - [ ] Player leaves raid (instance continues)
  - [ ] All players die (raid fails, no rewards)
  - [ ] Queue timeout
  - [ ] Multiple raids running simultaneously

---

#### **Party System Integration Testing**

- [ ] **Party Queue:**
  - [ ] Party leader can queue entire party for dungeon
  - [ ] Party leader can queue entire party for raid
  - [ ] All party members join queue together
  - [ ] Party stays together through matchmaking
  - [ ] Party members spawn together in instance

- [ ] **Party Invites:**
  - [ ] Can invite players to party from chat
  - [ ] Can invite players to party from whisper
  - [ ] Can invite players to party from party panel
  - [ ] Invites show correct hero information
  - [ ] Accept/decline works correctly

---

#### **Browser Source Testing**

- [ ] **Dungeon Display:**
  - [ ] Dungeon mode renders correctly in browser source
  - [ ] All 5 players visible
  - [ ] Enemies visible and positioned correctly
  - [ ] Room progression visible
  - [ ] Combat animations work

- [ ] **Raid Display:**
  - [ ] Raid mode renders correctly in browser source
  - [ ] All 10 players visible
  - [ ] Boss visible and positioned correctly
  - [ ] Boss mechanics visible
  - [ ] Combat animations work

---

### **GENERAL SYSTEM TESTING**

#### **Core Systems:**
- [ ] **Authentication:**
  - [ ] Twitch login works
  - [ ] User session persists
  - [ ] Logout works

- [ ] **Hero System:**
  - [ ] Hero creation works
  - [ ] Hero selection works
  - [ ] Hero stats display correctly
  - [ ] Multiple heroes per user works

- [ ] **Combat System:**
  - [ ] Idle adventure combat works
  - [ ] Enemy spawning works
  - [ ] Damage/healing calculations correct
  - [ ] Death/resurrection works
  - [ ] Loot drops work

- [ ] **Inventory System:**
  - [ ] Items can be equipped
  - [ ] Items can be unequipped
  - [ ] Inventory expansion works
  - [ ] Item stacking works

- [ ] **Store System:**
  - [ ] Token shop purchases work
  - [ ] Gold shop purchases work
  - [ ] Hero slot expansion works
  - [ ] Items added to inventory correctly

- [ ] **Mail System:**
  - [ ] Can send mail with items
  - [ ] Can send mail with gold/tokens
  - [ ] COD (Cash on Delivery) works
  - [ ] Mail claims work
  - [ ] Mail expiration works (30 days)

- [ ] **Chat System:**
  - [ ] World chat works
  - [ ] Whisper chat works
  - [ ] Party chat works
  - [ ] Message history loads
  - [ ] Founder badges display in chat

- [ ] **Party System:**
  - [ ] Can create party
  - [ ] Can invite players
  - [ ] Can accept/decline invites
  - [ ] Can leave party
  - [ ] Party leader can kick members

---

## 📋 TESTING PROCEDURE

### **Phase 1: Unit Testing (Individual Systems)**
1. Test each system independently
2. Verify API endpoints work
3. Check database operations
4. Validate data flow

### **Phase 2: Integration Testing (Systems Together)**
1. Test party → queue → dungeon flow
2. Test mail → claim → inventory flow
3. Test chat → invite → party flow
4. Test store → purchase → inventory flow

### **Phase 3: End-to-End Testing (Full User Flows)**
1. Create hero → Queue for dungeon → Complete dungeon → Get rewards
2. Create party → Invite players → Queue for raid → Complete raid → Get rewards
3. Send mail → Receive mail → Claim items → Use items
4. Purchase tokens → Buy equipment → Equip gear → Test in combat

### **Phase 4: Stress Testing (Load & Edge Cases)**
1. Multiple simultaneous dungeons/raids
2. Large number of players in queue
3. Rapid party creation/invites
4. High mail volume
5. Concurrent chat messages

---

## 🚨 CRITICAL BUGS TO FIX BEFORE LAUNCH

### **Must Fix:**
- [ ] Any crashes or errors in dungeon/raid system
- [ ] Matchmaking failures
- [ ] Instance creation failures
- [ ] Reward distribution failures
- [ ] Payment processing failures
- [ ] Data loss bugs

### **Should Fix:**
- [ ] UI/UX issues that confuse users
- [ ] Performance issues (lag, slow loading)
- [ ] Display bugs (missing text, broken layouts)
- [ ] Minor calculation errors

### **Nice to Fix:**
- [ ] Typos in text
- [ ] Minor visual polish
- [ ] Optional features

---

## ✅ LAUNCH READINESS CRITERIA

### **Must Have:**
- [ ] Token purchase system implemented and tested
- [ ] Dungeon system fully tested and working
- [ ] Raid system fully tested and working
- [ ] Party system integrated with dungeons/raids
- [ ] Mail system working
- [ ] Chat system working
- [ ] Payment processing working (Stripe)
- [ ] No critical bugs

### **Should Have:**
- [ ] Notification system (can add post-launch)
- [ ] Trade system (mail provides alternative)
- [ ] Chat badge (low priority)

---

## 📅 RECOMMENDED TESTING SCHEDULE

### **Week 1: Implementation**
- Day 1-2: Token purchase system
- Day 3-4: Testing and bug fixes
- Day 5: Documentation

### **Week 2: Testing**
- Day 1-2: Dungeon system testing
- Day 3-4: Raid system testing
- Day 5: Integration testing

### **Week 3: Polish & Launch Prep**
- Day 1-2: Bug fixes from testing
- Day 3: Final end-to-end testing
- Day 4: Launch preparation
- Day 5: LAUNCH 🚀

---

## 🎯 PRIORITY ORDER

1. **Token Purchase System** (HIGH - Revenue)
2. **Dungeon Testing** (CRITICAL - Core feature)
3. **Raid Testing** (CRITICAL - Core feature)
4. **Party Integration Testing** (HIGH - Group play)
5. **General System Testing** (MEDIUM - Polish)
6. **Notification System** (LOW - Can defer)
7. **Trade System** (LOW - Mail provides alternative)
8. **Chat Badge** (LOW - Cosmetic)

---

## 📝 NOTES

- Focus on dungeon/raid testing first - these are core features
- Token purchases can be implemented quickly (1-2 days)
- Other features can be added post-launch if needed
- Test with real players if possible (beta test group)
