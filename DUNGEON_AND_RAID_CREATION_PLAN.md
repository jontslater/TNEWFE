# Dungeon and Raid Creation Plan

**Date:** January 2025  
**Goal:** Create 3 new dungeons and 2 new raids to expand content variety  
**Current Status:**
- **Dungeons:** 3 existing (goblin_cave, ancient_catacombs, demon_ruins)
- **Raids:** 11 existing (normal/heroic/mythic tiers + Elder Dragon variants)

---

## 📊 Current Content Analysis

### Existing Dungeons
1. **goblin_cave** - Solo, Level 10+, Normal (3 rooms, Goblin theme)
2. **ancient_catacombs** - Group, Level 15+, Normal (4 rooms, Undead theme)
3. **demon_ruins** - Challenge, Level 20+, Heroic (3 rooms, Demon theme)

### Existing Raids (by Tier)
**Normal Tier (Level 15+):**
- Corrupted Temple, Bandit Stronghold, Haunted Crypt, Elder Dragon Normal

**Heroic Tier (Level 30+):**
- Dragon's Lair, Demon Fortress, Titan's Keep, Shadowlands, Elder Dragon Heroic

**Mythic Tier (Level 45+):**
- Elemental Plane, Void Citadel, Celestial Sanctum, Elder Dragon Mythic

### Gaps Identified
- **Dungeons:** Need variety in themes (forest, underwater, sky, etc.), more solo options, mid-level content (25-35)
- **Raids:** Could use more normal-tier variety, mid-tier heroic options (35-40)

---

## 🏰 NEW DUNGEONS (3 Total)

### Dungeon 1: Frostbite Caverns
**Theme:** Ice/Cold/Elemental  
**Type:** Solo/Group Hybrid  
**Difficulty:** Normal  
**Level Range:** 12-18

**Description:**  
"A treacherous ice cavern hidden beneath a frozen mountain. Rumors speak of a crystal guardian protecting ancient artifacts."

**Requirements:**
- Min Level: 12
- Min Item Score: 300
- Min Players: 1
- Max Players: 3 (optional solo)

**Room Structure (4 rooms):**
1. **Entrance Tunnel** - Ice Slimes (4x, Level 12)
2. **Frozen Hall** - Ice Elementals (3x, Level 13) + Frost Wolves (2x, Level 13)
3. **Crystal Grotto** - Mini-boss: Frost Guardian (1x, Level 15, isMiniBoss: true)
4. **Deep Freeze Chamber** - Boss: Crystal Frost Golem (1x, Level 18, isBoss: true)

**Enemy Mapping:**
- Ice Slime → Use existing sprite (Gryphon or create placeholder)
- Ice Elemental → Witch sprite (magical theme)
- Frost Wolf → Werewolf sprite (fits wolf theme)
- Frost Guardian → Minotaur sprite (guardian theme)
- Crystal Frost Golem → Adult Dragon sprite (large boss theme)

**Rewards:**
- Gold: 350
- Tokens: 8
- Experience: 800
- Guaranteed Loot: ['armor', 'accessory']

**Estimated Duration:** 180 seconds (3 minutes)

**Design Notes:**
- First dungeon with optional solo/group flexibility
- Introduces ice/cold theme (new enemy types)
- Good stepping stone between goblin_cave and ancient_catacombs
- Rewards focus on defense (armor) for survivability

---

### Dungeon 2: Sunken Temple
**Theme:** Underwater/Ancient/Aquatic  
**Type:** Group Required  
**Difficulty:** Heroic  
**Level Range:** 22-28

**Description:**  
"An ancient temple submerged beneath the waves. Only the brave and coordinated can navigate its flooded chambers and face the Leviathan's Wrath."

**Requirements:**
- Min Level: 22
- Min Item Score: 600
- Min Players: 3
- Max Players: 5

**Room Structure (5 rooms):**
1. **Tidal Entrance** - Sea Serpents (3x, Level 22)
2. **Corridor of Currents** - Murlocs (4x, Level 23) + Tentacle Horrors (2x, Level 23)
3. **Abyssal Chamber** - Mini-boss: Kraken Sentry (1x, Level 25, isMiniBoss: true)
4. **Depth's Descent** - Ancient Guardians (2x, Level 26) + Aqua Wisps (3x, Level 26)
5. **Leviathan's Throne** - Boss: Leviathan's Wrath (1x, Level 28, isBoss: true)

**Enemy Mapping:**
- Sea Serpent → Lizardman sprite (reptilian theme)
- Murloc → Kobold Warrior sprite (humanoid theme)
- Tentacle Horror → Mimic sprite (tentacle/creature theme)
- Kraken Sentry → Minotaur sprite (large guardian)
- Ancient Guardian → Headless Horseman sprite (undead/ancient theme)
- Aqua Wisp → Skeleton Mage sprite (magical/ethereal)
- Leviathan's Wrath → Adult Dragon sprite (massive boss)

**Rewards:**
- Gold: 850
- Tokens: 18
- Experience: 2500
- Guaranteed Loot: ['weapon', 'armor', 'accessory']

**Estimated Duration:** 360 seconds (6 minutes)

**Design Notes:**
- First underwater-themed content
- Longer dungeon (5 rooms) for heroic difficulty
- Introduces aquatic enemy types
- Requires coordination (group-only)
- Higher rewards for increased difficulty

---

### Dungeon 3: Sky Fortress
**Theme:** Sky/Floating/Magical  
**Type:** Challenge  
**Difficulty:** Heroic+  
**Level Range:** 28-35

**Description:**  
"A floating fortress suspended by ancient magic high above the clouds. Only masters of combat can reach its summit and challenge the Storm Lord."

**Requirements:**
- Min Level: 28
- Min Item Score: 900
- Min Players: 4
- Max Players: 6

**Room Structure (6 rooms):**
1. **Wind Landing** - Sky Riders (3x, Level 28)
2. **Cloud Bridge** - Storm Elementals (4x, Level 29)
3. **Tower Ascent** - Harpy Guardians (3x, Level 30) + Wind Wisps (2x, Level 30)
4. **Thunder Hall** - Mini-boss: Tempest Golem (1x, Level 32, isMiniBoss: true)
5. **Sky Forge** - Lightning Constructs (2x, Level 33) + Arcane Sentries (3x, Level 33)
6. **Storm Summit** - Boss: Storm Lord (1x, Level 35, isBoss: true)

**Enemy Mapping:**
- Sky Rider → Gryphon sprite (flying theme)
- Storm Elemental → Witch sprite (magical/elemental)
- Harpy Guardian → Werewolf sprite (winged creature theme)
- Wind Wisp → Skeleton Mage sprite (ethereal/magical)
- Tempest Golem → Minotaur sprite (large construct)
- Lightning Construct → Headless Horseman sprite (animated/construct)
- Arcane Sentry → Skeleton Mage sprite (magical sentry)
- Storm Lord → Adult Dragon sprite (powerful boss)

**Rewards:**
- Gold: 1200
- Tokens: 25
- Experience: 4000
- Guaranteed Loot: ['weapon', 'armor', 'accessory', 'shield']

**Estimated Duration:** 480 seconds (8 minutes)

**Design Notes:**
- Most challenging dungeon (highest level, most rooms)
- Floating/sky theme (unique setting)
- Introduces air/wind elemental enemies
- Requires max coordination (4-6 players)
- Best rewards of all dungeons
- Fills gap between demon_ruins (L20) and heroic raids (L30+)

---

## ⚔️ NEW RAIDS (2 Total)

### Raid 1: The Necromancer's Tower
**Theme:** Dark Magic/Undead/Summoning  
**Tier:** Normal (Upper-Mid)  
**Level Range:** 18-25

**Description:**  
"An ominous tower where a powerful necromancer conducts forbidden rituals. Stop his dark magic before he raises an undead army."

**Requirements:**
- Difficulty: Normal
- Min Level: 18
- Min Item Score: 700
- Min Players: 4
- Max Players: 6
- Waves: 4

**Boss: Arch-Necromancer Vex**
- HP: 65,000
- Attack: 100
- Defense: 50
- Level: 25

**Boss Mechanics:**
1. **Death Bolt** (Cast, 3s cast, interruptible)
   - Targets random player
   - Damage: 180 (1.8x multiplier)
   - Cooldown: 10s
   - Phases: All

2. **Raise Dead** (Adds)
   - Summons 2 skeleton warriors at 70% and 35% HP
   - Adds: Level 20, HP 6000, Attack 50, Defense 25
   - Phases: 2, 3, 4

3. **Life Drain Field** (AoE)
   - Creates zone that drains health from all players over 8 seconds
   - Damage: 20/sec (160 total)
   - Cooldown: 20s
   - Phases: 3, 4

4. **Bone Armor** (Defensive)
   - Becomes immune to damage for 5 seconds, summons 3 bone shards around him
   - Shards must be destroyed to break immunity
   - Cooldown: 35s
   - Phases: 2, 3, 4

5. **Mass Reanimation** (Phase Transition)
   - At 40% HP, raises all previously killed adds as stronger versions
   - Trigger: 0.4 HP threshold
   - Phases: 3, 4

**Phases:**
- Phase 1 (100% HP): Death Bolt only
- Phase 2 (70% HP): Death Bolt, Raise Dead (adds), Bone Armor
- Phase 3 (40% HP): Death Bolt, Life Drain Field, Bone Armor, Mass Reanimation
- Phase 4 (20% HP): All mechanics active

**Rewards:**
- Gold: 700
- Tokens: 14
- Experience: 2800
- Guaranteed Loot: ['weapon', 'armor']

**Estimated Duration:** 240 seconds (4 minutes)

**Design Notes:**
- Fills gap in normal-tier raids (between L15 and L20+ content)
- Undead/summoning theme (unique mechanics)
- Introduces immunity phases requiring coordination
- Good introduction to add management mechanics
- Accessible to mid-level players (L18+)

---

### Raid 2: The Clockwork Sanctum
**Theme:** Mechanical/Constructs/Steampunk  
**Tier:** Heroic (Upper-Mid)  
**Level Range:** 35-42

**Description:**  
"Enter a mechanical sanctum where time itself has been harnessed. Face the Master Artificer and his legion of clockwork constructs before his machines consume the realm."

**Requirements:**
- Difficulty: Heroic
- Min Level: 35
- Min Item Score: 2100
- Min Players: 5
- Max Players: 8
- Waves: 5

**Boss: Master Artificer Chronos**
- HP: 180,000
- Attack: 180
- Defense: 90
- Level: 42

**Boss Mechanics:**
1. **Time Lock** (Crowd Control)
   - Freezes 2 random players in time for 5 seconds (they cannot act but take 50% less damage)
   - Cast Time: 2s
   - Cooldown: 15s
   - Phases: All

2. **Gear Storm** (AoE)
   - Launches mechanical gears in all directions, dealing damage to all players
   - Damage: 120 (0.67x multiplier - AoE balanced)
   - Cooldown: 18s
   - Phases: All

3. **Summon Automatons** (Adds)
   - Summons 2 clockwork automatons every 30 seconds after 80% HP
   - Adds: Level 35, HP 8000, Attack 70, Defense 40
   - Adds explode when killed, dealing AoE damage
   - Phases: 2, 3, 4, 5

4. **Temporal Acceleration** (Buff)
   - At 60% HP, increases boss attack speed by 50% for 20 seconds
   - Can be dispelled by killing specific add spawn
   - Trigger: 0.6 HP threshold
   - Phases: 3, 4, 5

5. **Rewind** (Heal)
   - At 50% and 20% HP, rewinds time to restore 15% HP
   - Can be prevented by dealing enough damage during cast window (5s)
   - Trigger: [0.5, 0.2]
   - Phases: 3, 4, 5

6. **Clockwork Overload** (Enrage)
   - After 9 minutes, boss explodes, dealing instant-kill damage to all players
   - Timer: 540 seconds
   - Type: Enrage

**Phases:**
- Phase 1 (100% HP): Time Lock, Gear Storm
- Phase 2 (80% HP): Time Lock, Gear Storm, Summon Automatons
- Phase 3 (60% HP): All mechanics except Rewind
- Phase 4 (50% HP): All mechanics (first Rewind)
- Phase 5 (30% HP): All mechanics active (second Rewind at 20%)

**Rewards:**
- Gold: 1800
- Tokens: 38
- Experience: 9000
- Guaranteed Loot: ['weapon', 'armor', 'accessory']

**Estimated Duration:** 480 seconds (8 minutes)

**Design Notes:**
- Fills gap in heroic-tier raids (between L30 and L45+ content)
- Unique mechanical/steampunk theme
- Introduces time manipulation mechanics
- Add management with explosion mechanics
- Requires burst DPS for Rewind interrupts
- Tests coordination with multiple mechanics
- Good stepping stone to mythic content

---

## 💎 Loot Distribution Strategy

### Current Equipment Slots (Reference)
**Standard Slots (9):** weapon, armor, accessory, helm, cloak, gloves, ring1, ring2, boots  
**Tank Additional Slot:** shield (10 slots total for tanks)

### Current Loot System
- **Dungeons:** Currently only have `guaranteedLoot` array specifying end-of-dungeon rewards (e.g., `['weapon', 'armor']`)
- **Raids:** Have `guaranteedLoot` arrays and boss-specific legendary items
- **Gear Generation:** `gearService.js` exists with role-based templates and rarity system

### Required Implementation: Progressive Loot Distribution

#### **Dungeons - Loot Distribution Per Room**
Each room should have potential loot drops:
- **Trash Rooms (Early Rooms):** Common/Uncommon gear, focus on secondary slots (helm, cloak, gloves, boots, rings)
- **Mini-Boss Rooms:** Rare/Epic gear, primary slots (weapon, armor, accessory)
- **Final Boss Room:** Epic/Legendary gear, guaranteed slots from `guaranteedLoot` array

**Recommended Loot Per Dungeon:**

**Frostbite Caverns (4 rooms):**
- Room 1 (Entrance Tunnel): 1-2 items - helm, gloves (Common/Uncommon)
- Room 2 (Frozen Hall): 1-2 items - cloak, boots (Uncommon/Rare)
- Room 3 (Mini-Boss): 1-2 items - weapon, accessory (Rare/Epic)
- Room 4 (Boss): 2-3 items - Guaranteed: armor, accessory + random: weapon/helm/shield (Epic/Legendary)

**Sunken Temple (5 rooms):**
- Room 1 (Tidal Entrance): 1-2 items - gloves, boots (Uncommon/Rare)
- Room 2 (Corridor of Currents): 1-2 items - cloak, ring1 (Uncommon/Rare)
- Room 3 (Mini-Boss): 1-2 items - weapon, helm (Rare/Epic)
- Room 4 (Depth's Descent): 1-2 items - accessory, ring2 (Rare/Epic)
- Room 5 (Boss): 2-3 items - Guaranteed: weapon, armor, accessory + random slot (Epic/Legendary)

**Sky Fortress (6 rooms):**
- Room 1 (Wind Landing): 1 item - boots (Uncommon/Rare)
- Room 2 (Cloud Bridge): 1 item - cloak (Uncommon/Rare)
- Room 3 (Tower Ascent): 1-2 items - gloves, helm (Rare)
- Room 4 (Mini-Boss): 1-2 items - accessory, ring1 (Rare/Epic)
- Room 5 (Sky Forge): 1-2 items - weapon, ring2 (Epic)
- Room 6 (Boss): 3-4 items - Guaranteed: weapon, armor, accessory, shield + random slots (Epic/Legendary)

#### **Raids - Loot Distribution Per Wave/Boss**
- **Wave Enemies (Trash):** Small chance (10-15%) for Common/Uncommon items, secondary slots only
- **Boss Adds (if applicable):** 20-30% chance for Rare items, any slot
- **Boss Kill:** Guaranteed 2-3 items from `guaranteedLoot`, plus 1-2 random items, Epic/Legendary rarity

**Recommended Loot Per Raid:**

**Necromancer's Tower (4 waves + Boss):**
- Waves 1-3 (Trash): 5% chance per wave for 1 item (gloves/boots/cloak - Common/Uncommon)
- Wave 4 (Adds): 15% chance for 1 item (any secondary slot - Rare)
- Boss Kill: Guaranteed weapon, armor + 1 random item (helm/accessory/shield - Epic/Legendary)
- Total Expected: 2-3 items from waves, 3 guaranteed + 1 random from boss = ~6 items total

**Clockwork Sanctum (5 waves + Boss):**
- Waves 1-4 (Trash): 8% chance per wave for 1 item (secondary slots - Uncommon/Rare)
- Wave 5 (Adds): 20% chance for 1 item (any slot - Rare/Epic)
- Boss Kill: Guaranteed weapon, armor, accessory + 1-2 random items (any slot - Epic/Legendary)
- Total Expected: 2-4 items from waves, 4-5 from boss = ~6-9 items total

### Gear Type Priority by Room/Difficulty
**Primary Slots (High Priority):** weapon, armor, accessory, shield (tanks)
- Drop from: Mini-bosses, bosses, rare chests
- Rarity: Rare minimum, Epic/Legendary on bosses

**Secondary Slots (Medium Priority):** helm, cloak, gloves, boots
- Drop from: Trash packs, mini-bosses
- Rarity: Common/Uncommon from trash, Rare/Epic from mini-bosses

**Tertiary Slots (Low Priority):** ring1, ring2
- Drop from: Any source, lower priority
- Rarity: Any rarity, common drop source

### Implementation Checklist for Loot
- [ ] **Verify loot generation system** - Check `gearService.js` supports all equipment slots
- [ ] **Check current dungeon completion rewards** - Verify if loot currently drops or only XP/gold
- [ ] **Add room-level loot configuration** - Add `loot` field to each room definition with:
  - `guaranteedSlots`: Array of guaranteed slot types (e.g., `['helm', 'gloves']`)
  - `randomSlots`: Array of possible random slots (e.g., `['cloak', 'boots', 'ring1']`)
  - `rarityChances`: Rarity distribution for this room
  - `dropCount`: Number of items to drop (e.g., `{ min: 1, max: 2 }`)
- [ ] **Add wave-level loot configuration** - Add `loot` field to raid waves with similar structure
- [ ] **Implement progressive rarity scaling** - Early rooms/waves = lower rarity, later = higher
- [ ] **Add boss loot generation** - Use existing `generateRaidLoot()` for raids, create similar for dungeon bosses
- [ ] **Verify role-based loot distribution** - Ensure tanks can get shields, all roles get appropriate stats
- [ ] **Test loot drop rates** - Ensure not too many items (inventory bloat) or too few (unrewarding)
- [ ] **Check inventory capacity** - Verify heroes can receive all dropped items

### Loot Distribution Timing
- **During Combat:** Items should drop when enemies die (for trash) or room/wave completes
- **Room Completion:** Drop room loot when all enemies in room are defeated
- **Wave Completion:** Drop wave loot when all enemies in wave are defeated
- **Boss Kill:** Drop boss loot immediately when boss dies (largest rewards)

### Slot Coverage Goals
**Per Dungeon Run:** Ensure players can potentially get items for:
- 2-3 primary slots (weapon, armor, accessory/shield)
- 3-4 secondary slots (helm, cloak, gloves, boots)
- 1-2 rings (ring1, ring2)

**Per Raid Run:** Ensure players can potentially get items for:
- 2-3 primary slots (guaranteed from boss)
- 2-3 secondary slots (from waves/adds)
- 1-2 rings (distributed throughout)

---

## 📋 Implementation Checklist

### Phase 1: Data Structure Setup
- [ ] Add 3 new dungeon definitions to `E:\IdleDnD-Backend\src\data\dungeons.js`
  - [ ] frostbite_caverns
  - [ ] sunken_temple
  - [ ] sky_fortress
- [ ] Add 2 new raid definitions to `E:\IdleDnD-Backend\src\data\raids.js`
  - [ ] necromancer_tower
  - [ ] clockwork_sanctum
- [ ] Update enemy type mappings in `E:\IdleDnD-Web\src\utils\dungeonEnemyGeneration.ts`
  - [ ] Add mappings for new enemy types (Ice, Aquatic, Sky enemies)

### Phase 2: Frontend Integration
- [ ] Update dungeon finder UI to show new dungeons
- [ ] Update raid browser to show new raids
- [ ] Verify queue requirements match new content requirements
- [ ] Test dungeon instance creation with new dungeon IDs
- [ ] Test raid instance creation with new raid IDs

### Phase 3: Sprite/Visual Assets
- [ ] Identify existing sprites to use for new enemy types
- [ ] Document sprite mappings for new enemies
- [ ] Verify all new enemy types have working sprite animations
- [ ] Test enemy rendering in browser source

### Phase 4: Mechanics Implementation
- [ ] Implement special mechanics for Necromancer's Tower:
  - [ ] Bone Armor immunity phase
  - [ ] Mass Reanimation trigger
  - [ ] Life Drain Field AoE
- [ ] Implement special mechanics for Clockwork Sanctum:
  - [ ] Time Lock crowd control
  - [ ] Temporal Acceleration buff
  - [ ] Rewind heal (interruptible)
  - [ ] Automaton explosion on death
- [ ] Test mechanics in combat system
- [ ] Balance damage values and cooldowns
- [ ] **Implement loot distribution system:**
  - [ ] Create room-level loot drop handler for dungeons
  - [ ] Create wave-level loot drop handler for raids
  - [ ] Integrate with `gearService.js` for item generation
  - [ ] Add loot drop notifications/UI feedback when items drop
  - [ ] Verify items are added to hero inventory correctly
  - [ ] Test loot distribution across all slots (weapon, armor, accessory, shield, helm, cloak, gloves, ring1, ring2, boots)
  - [ ] Balance drop rates to ensure good coverage without inventory bloat

### Phase 5: Testing & Balancing
- [ ] Test all 3 dungeons from start to finish
- [ ] Test both raids with various group sizes
- [ ] Verify rewards are granted correctly (XP, gold, tokens)
- [ ] **Test loot distribution thoroughly:**
  - [ ] Verify loot drops from each room/wave as designed
  - [ ] Check that all equipment slots are dropping (weapon, armor, accessory, shield, helm, cloak, gloves, ring1, ring2, boots)
  - [ ] Verify role-appropriate loot (tanks get shields, stats match roles)
  - [ ] Test rarity distribution (Common → Legendary scaling)
  - [ ] Verify inventory can handle multiple drops
  - [ ] Check that guaranteed loot from bosses appears
- [ ] Check difficulty scaling vs. player levels
- [ ] Verify enemy positioning (no overflow)
- [ ] Test queue system with new content
- [ ] Verify browser source rendering

### Phase 6: Documentation & Polish
- [ ] Update dungeon descriptions in UI
- [ ] Add raid descriptions and mechanics tips
- [ ] Verify all tooltips and help text
- [ ] Update achievement/badge system if needed
- [ ] Document new enemy types in code comments

---

## 🎨 Enemy Type Mapping Reference

### New Enemy Types → Existing Sprites

**Frostbite Caverns:**
- Ice Slime → Gryphon (or placeholder sprite)
- Ice Elemental → Witch
- Frost Wolf → Werewolf
- Frost Guardian → Minotaur
- Crystal Frost Golem → Adult Dragon

**Sunken Temple:**
- Sea Serpent → Lizardman
- Murloc → Kobold Warrior
- Tentacle Horror → Mimic
- Kraken Sentry → Minotaur
- Ancient Guardian → Headless Horseman
- Aqua Wisp → Skeleton Mage
- Leviathan's Wrath → Adult Dragon

**Sky Fortress:**
- Sky Rider → Gryphon
- Storm Elemental → Witch
- Harpy Guardian → Werewolf
- Wind Wisp → Skeleton Mage
- Tempest Golem → Minotaur
- Lightning Construct → Headless Horseman
- Arcane Sentry → Skeleton Mage
- Storm Lord → Adult Dragon

**Raids:**
- Skeleton Warriors (Necromancer) → Skeleton Mage
- Bone Shards (Necromancer) → Use small sprite variant
- Clockwork Automatons (Artificer) → Headless Horseman (mechanical theme)

---

## 📊 Level Progression Reference

### Current Level Curve:
- **Level 10-15:** Solo/Guild content, first dungeon (goblin_cave)
- **Level 15-20:** Group dungeons, normal raids
- **Level 20-25:** Challenge dungeons, upper normal raids
- **Level 25-30:** Heroic raids
- **Level 30-35:** Upper heroic raids
- **Level 35-45:** Mythic raids
- **Level 45+:** End-game content

### New Content Integration:
- **Frostbite Caverns (L12-18):** Bridges L10 solo to L15 group content
- **Sunken Temple (L22-28):** Fills gap between demon_ruins (L20) and heroic raids (L30)
- **Sky Fortress (L28-35):** Direct bridge from heroic dungeons to heroic raids
- **Necromancer's Tower (L18-25):** Upper normal tier raid, fills L20-25 gap
- **Clockwork Sanctum (L35-42):** Upper heroic tier, bridge to mythic content

---

## ⚠️ Special Considerations

### Balance Notes:
- New dungeons should follow existing reward curves
- Raids should scale difficulty appropriately (adds, mechanics complexity)
- Ensure new content doesn't invalidate existing content
- Consider lockout timers if implementing weekly resets

### Technical Requirements:
- All new enemy types must map to existing sprites (no new assets needed initially)
- Mechanics should use existing combat system (buffs, debuffs, AoE, adds)
- New mechanics may require combat system extensions (time manipulation, immunity phases)
- Verify Firebase schema supports new dungeon/raid data

### Future Enhancements:
- Consider adding dungeon/raid-specific achievements
- Potential for themed loot sets matching dungeon themes
- Boss-specific titles/badges for completion
- Leaderboards for fastest completion times
- Difficulty modifiers (normal/heroic/mythic variants of dungeons)

---

## 🚀 Estimated Timeline

**Phase 1 (Data Structure):** 2-3 hours  
**Phase 2 (Frontend Integration):** 1-2 hours  
**Phase 3 (Sprite Mapping):** 1 hour  
**Phase 4 (Mechanics):** 4-6 hours (depending on complexity)  
**Phase 5 (Testing):** 3-4 hours  
**Phase 6 (Polish):** 1-2 hours  

**Total Estimated Time:** 12-18 hours (1.5-2.5 days)

---

## 📝 Notes

- All new content uses existing sprite assets (no art creation needed)
- Mechanics leverage existing combat system where possible
- New mechanics may need combat system extensions (document separately)
- Consider player feedback before finalizing difficulty/rewards
- Future: Add visual variety with custom sprites for new enemy types
- Future: Add voice lines or flavor text for boss encounters

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Status:** Ready for Implementation









