# Dungeon & Raid Browser Testing Guide

This document outlines how to test dungeons and raids in the browser source.

## Test URL
```
http://localhost:3000/clean-battlefield?battlefieldId=twitch:1087777297&darkMode=true
```

## What to Test

### 1. **Dungeon System**

#### Available Dungeons
Check which dungeons are available:
- Normal Dungeons (5 players: 1 tank, 1 healer, 3 DPS)
- Heroic Dungeons (5 players: 1 tank, 1 healer, 3 DPS)
- Mythic Dungeons (5 players: 1 tank, 1 healer, 3 DPS)

#### Queue System
- [ ] Can queue for normal dungeon
- [ ] Can queue for heroic dungeon
- [ ] Can queue for mythic dungeon
- [ ] Queue shows correct requirements (level, gear score)
- [ ] Queue shows role requirements
- [ ] Queue status updates correctly

#### Matchmaking
- [ ] Matches 5 players correctly (1 tank, 1 healer, 3 DPS)
- [ ] Matches players within level range
- [ ] Matches players with appropriate gear scores
- [ ] Party members stay together when queuing as party

#### Instance & Combat
- [ ] Instance creates correctly
- [ ] All 5 players appear in instance
- [ ] Enemies spawn correctly
- [ ] Combat mechanics work
- [ ] Room progression works
- [ ] Rewards distribute correctly

#### Sprite Check
- [ ] All hero classes have sprites
- [ ] Enemy sprites display correctly
- [ ] Animations work (idle, attack, defend, death)

---

### 2. **Raid System**

#### Available Raids
Check which raids are available:
- Normal Raids (10 players: 2 tanks, 2-3 healers, 5-6 DPS)
- Heroic Raids (10 players: 2 tanks, 2-3 healers, 5-6 DPS)
- Mythic Raids (10 players: 2 tanks, 2-3 healers, 5-6 DPS)

#### Queue System
- [ ] Can queue for normal raid
- [ ] Can queue for heroic raid
- [ ] Can queue for mythic raid
- [ ] Queue shows correct requirements
- [ ] Queue shows role requirements
- [ ] Queue status updates correctly

#### Matchmaking
- [ ] Matches 10 players correctly (2 tanks, 2-3 healers, 5-6 DPS)
- [ ] Matches players within level range
- [ ] Matches players with appropriate gear scores

#### Instance & Combat
- [ ] Instance creates correctly
- [ ] All 10 players appear in instance
- [ ] Boss spawns correctly
- [ ] Boss mechanics work (phases, abilities)
- [ ] Rewards distribute correctly

#### Sprite Check
- [ ] All hero classes have sprites
- [ ] Boss sprites display correctly
- [ ] Animations work

---

### 3. **Party Integration**

#### Party Queue
- [ ] Party can queue together for dungeons
- [ ] Party can queue together for raids
- [ ] Party members stay together in instance
- [ ] Incomplete parties can fill with individuals

#### Party Invites
- [ ] Can invite players to party from chat
- [ ] Can invite players to party from whisper
- [ ] Invited players can join party
- [ ] Party leader can queue party

---

### 4. **Browser Source Display**

#### Visual Verification
- [ ] All players visible in dungeons
- [ ] All players visible in raids
- [ ] Enemies/bosses render correctly
- [ ] Combat animations visible
- [ ] Health bars display correctly
- [ ] Damage numbers show
- [ ] Victory/defeat states display

#### Performance
- [ ] No lag with 5 players (dungeon)
- [ ] No lag with 10 players (raid)
- [ ] Animations smooth
- [ ] No visual glitches

---

## Testing Checklist

### Pre-Test Setup
1. [ ] Backend is running (localhost:3001)
2. [ ] Frontend is running (localhost:3000)
3. [ ] Browser source URL is accessible
4. [ ] At least 5 heroes exist for dungeon testing
5. [ ] At least 10 heroes exist for raid testing

### Dungeon Testing
- [ ] Test normal dungeon queue
- [ ] Test heroic dungeon queue
- [ ] Test mythic dungeon queue
- [ ] Test matchmaking
- [ ] Test instance creation
- [ ] Test combat
- [ ] Test rewards
- [ ] Check sprite availability

### Raid Testing
- [ ] Test normal raid queue
- [ ] Test heroic raid queue
- [ ] Test mythic raid queue
- [ ] Test matchmaking
- [ ] Test instance creation
- [ ] Test boss mechanics
- [ ] Test rewards
- [ ] Check sprite availability

### Party Testing
- [ ] Test party queue for dungeon
- [ ] Test party queue for raid
- [ ] Test party invites
- [ ] Test staying together in instance

### Browser Source Testing
- [ ] Visual verification of all players
- [ ] Visual verification of enemies/bosses
- [ ] Animation verification
- [ ] Performance check

---

## Known Issues to Check

1. **Sprite Availability**
   - Some classes may not have sprites yet
   - Note which classes are missing sprites
   - Decide which dungeons/raids to launch with based on sprite availability

2. **Queue System**
   - Check if queue actually matches players
   - Verify role requirements are enforced
   - Check if queue times out correctly

3. **Instance Creation**
   - Verify instances create correctly
   - Check if all players appear in instance
   - Verify room progression works

4. **Combat System**
   - Check if combat starts correctly
   - Verify damage calculations
   - Check if victory/defeat states work

5. **Rewards**
   - Verify rewards distribute correctly
   - Check if XP is granted
   - Check if loot drops correctly

---

## Test Results Template

### Dungeon Test Results

**Normal Dungeon:**
- Queue: ✅ / ❌
- Matchmaking: ✅ / ❌
- Instance: ✅ / ❌
- Combat: ✅ / ❌
- Rewards: ✅ / ❌
- Sprites: ✅ / ❌ (Note missing sprites)

**Heroic Dungeon:**
- Queue: ✅ / ❌
- Matchmaking: ✅ / ❌
- Instance: ✅ / ❌
- Combat: ✅ / ❌
- Rewards: ✅ / ❌
- Sprites: ✅ / ❌ (Note missing sprites)

**Mythic Dungeon:**
- Queue: ✅ / ❌
- Matchmaking: ✅ / ❌
- Instance: ✅ / ❌
- Combat: ✅ / ❌
- Rewards: ✅ / ❌
- Sprites: ✅ / ❌ (Note missing sprites)

### Raid Test Results

**Normal Raid:**
- Queue: ✅ / ❌
- Matchmaking: ✅ / ❌
- Instance: ✅ / ❌
- Boss Mechanics: ✅ / ❌
- Rewards: ✅ / ❌
- Sprites: ✅ / ❌ (Note missing sprites)

**Heroic Raid:**
- Queue: ✅ / ❌
- Matchmaking: ✅ / ❌
- Instance: ✅ / ❌
- Boss Mechanics: ✅ / ❌
- Rewards: ✅ / ❌
- Sprites: ✅ / ❌ (Note missing sprites)

**Mythic Raid:**
- Queue: ✅ / ❌
- Matchmaking: ✅ / ❌
- Instance: ✅ / ❌
- Boss Mechanics: ✅ / ❌
- Rewards: ✅ / ❌
- Sprites: ✅ / ❌ (Note missing sprites)

### Sprite Availability

**Classes with Sprites:**
- List classes that have sprites

**Classes Missing Sprites:**
- List classes that need sprites

**Recommendation:**
- Which dungeons/raids to launch with
- Which to defer until sprites are ready







