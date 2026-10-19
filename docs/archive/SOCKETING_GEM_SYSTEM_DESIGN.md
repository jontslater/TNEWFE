# Socketing & Gem System Design

**Date:** January 2025  
**Goal:** Implement WoW-style socketing system with gems, socket bonuses, and profession integration  
**Status:** Design Phase

---

## 🎯 Overview

Implement a socketing system similar to World of Warcraft where:
- Gear can have socket slots (added via Mining profession)
- Gems can be inserted into sockets (gathered via Mining profession)
- Socket bonuses reward matching gem colors/types
- Stats from gems apply to hero in browser source combat

---

## 💎 Gem System Design

### **Gem Types (4 Colors)**

**1. Ruby (Red) - Offensive Stats**
- **Common Ruby:** +5 Attack
- **Uncommon Ruby:** +10 Attack
- **Rare Ruby:** +15 Attack, +2% Crit Chance
- **Epic Ruby:** +25 Attack, +5% Crit Chance
- **Legendary Ruby:** +40 Attack, +8% Crit Chance, +5% Crit Damage

**2. Sapphire (Blue) - Defensive Stats**
- **Common Sapphire:** +5 Defense
- **Uncommon Sapphire:** +10 Defense
- **Rare Sapphire:** +15 Defense, +2% Damage Reduction
- **Epic Sapphire:** +25 Defense, +5% Damage Reduction
- **Legendary Sapphire:** +40 Defense, +8% Damage Reduction, +5% Max HP

**3. Emerald (Green) - Hybrid Stats**
- **Common Emerald:** +3 Attack, +3 Defense
- **Uncommon Emerald:** +6 Attack, +6 Defense
- **Rare Emerald:** +10 Attack, +10 Defense, +1% All Stats
- **Epic Emerald:** +18 Attack, +18 Defense, +3% All Stats
- **Legendary Emerald:** +30 Attack, +30 Defense, +5% All Stats

**4. Diamond (Yellow) - Special Stats**
- **Common Diamond:** +5% XP Gain
- **Uncommon Diamond:** +10% XP Gain
- **Rare Diamond:** +15% XP Gain, +2% Gold Gain
- **Epic Diamond:** +25% XP Gain, +5% Gold Gain
- **Legendary Diamond:** +40% XP Gain, +10% Gold Gain, +5% Token Gain

---

## ⚙️ Socket System Design

### **Socket Slots Per Gear**

**Weapons:**
- Common: 0 sockets
- Uncommon: 0 sockets
- Rare: 1 socket
- Epic: 2 sockets
- Legendary: 2 sockets
- Mythic: 3 sockets

**Armor (Chest):**
- Common: 0 sockets
- Uncommon: 0 sockets
- Rare: 1 socket
- Epic: 2 sockets
- Legendary: 2 sockets
- Mythic: 3 sockets

**Accessories:**
- Common: 0 sockets
- Uncommon: 0 sockets
- Rare: 1 socket
- Epic: 1 socket
- Legendary: 2 sockets
- Mythic: 2 sockets

**Shield (Tanks only):**
- Common: 0 sockets
- Uncommon: 0 sockets
- Rare: 1 socket
- Epic: 1 socket
- Legendary: 2 sockets
- Mythic: 2 sockets

**Secondary Slots (Helm, Cloak, Gloves, Boots, Rings):**
- Common: 0 sockets
- Uncommon: 0 sockets
- Rare: 0 sockets
- Epic: 1 socket
- Legendary: 1 socket
- Mythic: 2 sockets

**Note:** Sockets are added via Mining profession as **transferable items** that can be sold on the auction house. Players craft "Gem Socket" items, then apply them to gear.

**Max Sockets Display:**
- Gear must show max socket capacity (e.g., "Sockets: 0/2" for Epic gear)
- Players know how many sockets can be added before purchasing
- Display in item tooltip and inventory

---

## 🎁 Socket Bonuses (WoW-Style)

### **Bonus System**

**2-Socket Bonus:**
- 2 Red (Ruby): +5% Attack
- 2 Blue (Sapphire): +5% Defense
- 2 Green (Emerald): +3% All Stats
- 2 Yellow (Diamond): +10% XP Gain
- 1 Red + 1 Blue: +3% Attack, +3% Defense
- 1 Red + 1 Green: +5% Attack, +2% All Stats
- 1 Blue + 1 Green: +5% Defense, +2% All Stats
- 1 Red + 1 Yellow: +5% Attack, +5% XP Gain
- 1 Blue + 1 Yellow: +5% Defense, +5% XP Gain
- 1 Green + 1 Yellow: +3% All Stats, +5% XP Gain

**3-Socket Bonus (Mythic gear only):**
- 3 Red: +10% Attack, +5% Crit Chance
- 3 Blue: +10% Defense, +5% Damage Reduction
- 3 Green: +8% All Stats
- 3 Yellow: +20% XP Gain, +10% Gold Gain
- 2 Red + 1 Blue: +8% Attack, +5% Defense
- 2 Blue + 1 Red: +8% Defense, +5% Attack
- 2 Red + 1 Green: +10% Attack, +3% All Stats
- 2 Blue + 1 Green: +10% Defense, +3% All Stats
- 1 Red + 1 Blue + 1 Green: +5% Attack, +5% Defense, +5% All Stats
- Any + Yellow: +10% XP Gain (in addition to other bonuses)

**Bonus Calculation:**
- Socket bonuses are **additive** with gem stats
- Bonuses apply to hero's total stats (base + equipment + gems + bonuses)
- Bonuses are calculated per item (not across all gear)

---

## ⛏️ Mining Profession Integration

### **Gem Gathering**

**Current State:**
- Mining profession exists
- `ProfessionsPage.tsx` mentions gems (Ruby, Sapphire, Emerald, Diamond)
- 5% chance for rare gems while mining (mentioned in page)
- **Backend does NOT implement gem gathering yet**

**Implementation Needed:**

1. **Add Gem Materials to Mining:**
```javascript
// In hero.profession.materials
materials: {
  ore: {
    iron: 0,
    steel: 0,
    mithril: 0,
    adamantite: 0
  },
  gems: {  // NEW
    ruby: {
      common: 0,
      uncommon: 0,
      rare: 0,
      epic: 0,
      legendary: 0
    },
    sapphire: { /* same structure */ },
    emerald: { /* same structure */ },
    diamond: { /* same structure */ }
  }
}
```

2. **Gem Gathering Rates:**
- While mining ore: 5% chance to also find a gem
- Gem rarity based on mining level:
  - Level 1-25: 70% Common, 25% Uncommon, 5% Rare
  - Level 26-50: 50% Common, 30% Uncommon, 15% Rare, 5% Epic
  - Level 51-75: 30% Common, 35% Uncommon, 25% Rare, 8% Epic, 2% Legendary
  - Level 76-100: 20% Common, 30% Uncommon, 30% Rare, 15% Epic, 5% Legendary

3. **Socket Item Crafting Recipe:**
- **Craft "Gem Socket" Item** (Mining profession)
  - Requires: 5 Mithril + 2 Adamantite
  - Mining Level: 50+
  - Cost: 500g (paid when crafting socket item)
  - Creates "Gem Socket" item in inventory (transferable)
  - **Applying socket to gear is FREE** (player already paid when crafting socket item)

---

## 🗄️ Data Structure

### **Item Schema Update**

```typescript
interface Item {
  // ... existing fields ...
  
  // Socket system
  sockets?: Socket[];  // Array of socket slots
  maxSockets?: number; // Max sockets for this rarity
}

interface Socket {
  id: string;          // Unique socket ID
  gem?: Gem;           // Inserted gem (if any)
  socketType?: 'red' | 'blue' | 'green' | 'yellow' | 'prismatic'; // Socket color (optional - can be any color)
}

interface Gem {
  id: string;
  type: 'ruby' | 'sapphire' | 'emerald' | 'diamond';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  stats: {
    attack?: number;
    defense?: number;
    critChance?: number;
    critDamage?: number;
    damageReduction?: number;
    maxHp?: number;
    allStats?: number;
    xpGain?: number;
    goldGain?: number;
    tokenGain?: number;
  };
}
```

---

## 🔧 Implementation Plan

### **Phase 1: Backend Foundation (2-3 days)**

1. **Update Item Schema:**
   - Add `sockets` array to Item schema
   - Add `maxSockets` based on rarity
   - Add gem data structure

2. **Mining Profession - Gem Gathering:**
   - Add gem materials to mining profession
   - Implement gem drop logic (5% chance while mining)
   - Add gem rarity distribution based on mining level

3. **Socket Item Crafting (Mining Profession):**
   - `POST /api/professions/:userId/craft` (existing endpoint, add socket recipe)
   - Recipe: "Gem Socket" - Requires Mining level 50+, 5 Mithril + 2 Adamantite, 500g
   - Creates "Gem Socket" item in inventory (transferable, can be sold on auction house)
   - Socket item is a profession item that can be applied to gear

4. **Socket Application API:**
   - `POST /api/professions/:userId/apply-socket`
   - Parameters: `heroId`, `itemId`, `socketItemId`, `slot` (equipment slot)
   - Requirements: Socket item in inventory, gear has available socket slots
   - **No gold cost** - Player already paid when crafting socket item
   - Applies socket to gear (consumes socket item), updates gear with new socket

5. **Gem Insertion API:**
   - `POST /api/professions/:userId/gem`
   - Parameters: `heroId`, `itemId`, `socketId`, `gemId`
   - Requirements: Gem in inventory, socket exists and empty
   - Inserts gem into socket, removes gem from inventory

6. **Gem Removal API:**
   - `POST /api/professions/:userId/remove-gem`
   - Parameters: `heroId`, `itemId`, `socketId`
   - Removes gem from socket, returns gem to inventory

7. **Socket Bonus Calculation:**
   - Function to calculate socket bonuses per item
   - Returns bonus stats based on gem combination

8. **Auction House Integration:**
   - Socket items can be listed on auction house (like other profession items)
   - Gems can be listed on auction house (like other profession items)
   - Players can buy sockets/gems from other players

---

### **Phase 2: Frontend UI (2-3 days)**

1. **Socket Display in Inventory:**
   - Show socket slots on items (empty sockets as gray circles)
   - Show inserted gems (colored circles with gem icon)
   - Display socket count (e.g., "2/3 sockets")

2. **Socket Item Crafting UI:**
   - Show requirements (mining level 50+, 5 Mithril + 2 Adamantite, 500g)
   - Craft "Gem Socket" item (goes to inventory)
   - Socket item can be sold on auction house
   - **Note:** Applying socket to gear is FREE (no additional gold cost)

3. **Socket Application UI:**
   - Show max sockets on gear (e.g., "Sockets: 0/2" for Epic gear)
   - Select socket item from inventory
   - Select gear to apply socket to
   - Confirm application (consumes socket item, adds socket to gear)
   - **No gold cost** - Player already paid when crafting socket item

4. **Gem Insertion Modal:**
   - Show available gems from inventory
   - Select socket to insert gem
   - Preview stat changes
   - Confirm insertion

5. **Gem Removal UI:**
   - Click gem in socket to remove
   - Confirm removal (returns gem to inventory)

6. **Socket Bonus Display:**
   - Show active socket bonuses on item tooltip
   - Display bonus stats clearly

---

### **Phase 3: Browser Source Integration (1-2 days)**

1. **Gem Stat Calculation:**
   - Calculate total gem stats from all equipped items
   - Calculate socket bonuses from all equipped items
   - Apply to hero stats in combat

2. **Stat Display:**
   - Show gem stats in hero stat calculation
   - Include socket bonuses in total stats
   - Display in combat engine

3. **Visual Feedback (Optional):**
   - Gem glow effect on items with gems
   - Socket bonus indicator

---

## 📊 Balance Considerations

### **Gem Stat Values**

**Why These Values:**
- Gems provide **modest** stat boosts (not overpowered)
- Socket bonuses reward **strategic gem placement**
- Higher rarity gems = better stats, but still balanced
- Socket bonuses are **additive** (not multiplicative) to prevent power creep

**Example Balance Check:**
- Legendary Ruby: +40 Attack, +8% Crit Chance, +5% Crit Damage
- For a level 50 hero with 500 base attack: +40 = 8% increase
- Socket bonus (2 Red): +5% Attack = +25 attack
- **Total from 2 Legendary Rubies + bonus:** +105 attack (21% increase)
- **This is significant but not game-breaking**

### **Socket Availability**

**Why These Limits:**
- Common/Uncommon: No sockets (early game, no gems needed)
- Rare: 1 socket (introduction to gem system)
- Epic: 2 sockets (socket bonuses become relevant)
- Legendary: 2-3 sockets (end-game optimization)
- Mythic: 3 sockets (maximum customization)

**Balance:**
- Players must invest in Mining profession to create sockets
- Socket item crafting has material cost (5 Mithril + 2 Adamantite) + 500g
- **Applying socket to gear is FREE** (no additional gold cost - player already paid when crafting)
- Gems are rare (5% drop rate while mining)
- Higher rarity gems are very rare (2-5% at high levels)

---

## 🎮 User Experience Flow

### **Step 1: Gather Gems**
1. Choose Mining profession
2. Use `!mine` command to gather ore
3. 5% chance to also find a gem
4. Gem rarity based on mining level
5. Gems go to inventory (can be sold on auction house)

### **Step 2: Craft Socket Item**
1. Reach Mining level 50
2. Gather materials: 5 Mithril + 2 Adamantite
3. Pay 500g (one-time cost when crafting socket item)
4. Use `!craft gem_socket` command or Portal UI
5. Creates "Gem Socket" item in inventory
6. **Socket item can be sold on auction house** (transferable)
7. **Note:** Applying socket to gear is FREE (no additional gold cost)

### **Step 3: Apply Socket to Gear**
1. Have socket item in inventory (crafted or bought from auction house)
2. Check gear max sockets (e.g., "Sockets: 0/2" for Epic gear)
3. Use `!apply-socket [slot]` command or Portal UI
4. Select socket item and gear to apply to
5. Socket item is consumed, socket added to gear

### **Step 4: Insert Gem**
1. Have gem in inventory (gathered or bought from auction house)
2. Use `!gem [slot] [gem-type]` command or Portal UI
3. Select socket to insert gem
4. Gem stats apply to hero immediately

### **Step 5: Optimize**
1. Plan gem combinations for socket bonuses
2. Mix gem colors for hybrid bonuses
3. Replace gems as better ones are found
4. Maximize socket bonuses across all gear
5. Buy/sell sockets and gems on auction house

---

## 🔄 Commands (Twitch Chat)

```
!mine - Gather ore (5% chance for gem)
!craft gem_socket - Craft Gem Socket item (requires Mining 50+, materials, 500g)
!apply-socket [slot] - Apply socket item to gear (consumes socket item)
!gem [slot] [type] - Insert gem into socket (e.g., !gem weapon ruby)
!remove-gem [slot] [socket-number] - Remove gem from socket
!gems - View all gems in inventory
!sockets - View socket status on all equipped items
```

**Auction House:**
- Socket items can be listed and sold
- Gems can be listed and sold
- Players can buy sockets/gems from other players

---

## 📝 Implementation Checklist

### **Backend:**
- [ ] Add `sockets` array to Item schema
- [ ] Add `maxSockets` calculation based on rarity
- [ ] Add gem materials to Mining profession
- [ ] Implement gem drop logic (5% chance, rarity based on level)
- [ ] Add "Gem Socket" recipe to Mining profession crafting
- [ ] Create socket application API endpoint (apply socket item to gear)
- [ ] Create gem insertion API endpoint
- [ ] Create gem removal API endpoint
- [ ] Implement socket bonus calculation function
- [ ] Add gem stat calculation to hero stats
- [ ] Update combat engine to include gem stats
- [ ] Ensure socket items and gems can be listed on auction house

### **Frontend:**
- [ ] Display max sockets on gear (e.g., "Sockets: 0/2")
- [ ] Display current sockets on items in inventory
- [ ] Show inserted gems visually
- [ ] Create socket item crafting UI (Mining profession)
- [ ] Create socket application UI (apply socket item to gear)
- [ ] Create gem insertion modal
- [ ] Create gem removal UI
- [ ] Display socket bonuses on item tooltips
- [ ] Show gem stats in hero stat display
- [ ] Ensure socket items and gems appear in auction house listing

### **Browser Source:**
- [ ] Calculate gem stats from all equipped items
- [ ] Calculate socket bonuses from all equipped items
- [ ] Apply gem stats to hero in combat
- [ ] Include gem stats in stat calculations
- [ ] (Optional) Visual gem glow effects

### **Testing:**
- [ ] Test gem gathering rates
- [ ] Test socket item crafting (materials, cost, level requirements)
- [ ] Test socket item application to gear
- [ ] Test max socket limits (can't exceed max for rarity)
- [ ] Test socket/gem auction house listing
- [ ] Test gem insertion/removal
- [ ] Test socket bonus calculations
- [ ] Test gem stats in combat
- [ ] Balance test (gem stats not overpowered)

---

## 🎯 Success Criteria

1. ✅ Players can gather gems via Mining profession
2. ✅ Players can create sockets on gear (Mining level 50+)
3. ✅ Players can insert/remove gems from sockets
4. ✅ Gem stats apply to hero in browser source combat
5. ✅ Socket bonuses reward strategic gem placement
6. ✅ System is balanced (not overpowered)
7. ✅ UI is intuitive and clear
8. ✅ Commands work in Twitch chat

---

## 💡 Future Enhancements (Optional)

1. **Prismatic Sockets:**
   - Special socket type that accepts any gem color
   - Requires rare material to create
   - Allows flexible gem combinations

2. **Gem Cutting:**
   - Upgrade gem rarity (combine 3 common → 1 uncommon)
   - Requires Mining profession
   - Adds progression path for gems

3. **Gem Sets:**
   - Set bonuses for using specific gem combinations across all gear
   - Example: "3 Red + 3 Blue = +10% All Stats"

4. **Unique Gems:**
   - Legendary-only gems with special effects
   - Example: "Gem of Life" - +5% lifesteal
   - Very rare drop (0.1% chance)

---

---

## ⚖️ Profession Balance Considerations

### **Current Concern:**
Mining profession is becoming too important (sockets, gems, upgrades). Enchanting and Herbalism need buffs to stay competitive.

### **Proposed Balance Changes:**

#### **Enchanting Buffs:**
1. **Enhanced Enchantment Effects:**
   - Increase enchantment proc rates (currently 50% → 75% for rare+)
   - Add new enchantments:
     - **Berserker's Rage:** +20% attack when HP < 30%
     - **Guardian's Shield:** +30% defense when HP < 50%
     - **Vampiric Strike:** 10% lifesteal (up from 5%)
     - **Frost Armor:** 15% chance to freeze attacker (up from 10%)

2. **Rune Improvements:**
   - Increase rune duration (20min → 30min)
   - Add new runes:
     - **Rune of Swiftness:** +50% combat speed (new)
     - **Rune of Fortune:** +50% gold gain (new)

3. **Disenchanting Value:**
   - Increase essence from disenchanting (2x current values)
   - Higher rarity = exponentially more essence

#### **Herbalism Buffs:**
1. **Elixir Improvements:**
   - Increase elixir duration (15-30min → 30-60min)
   - Increase stat bonuses (+10-30% → +15-40%)
   - Add new elixirs:
     - **Elixir of Precision:** +15% crit chance, +10% crit damage
     - **Elixir of Resilience:** +20% debuff resistance, +10% status effect duration reduction

2. **Flask Improvements:**
   - Increase flask duration (60min → 120min)
   - Add new flasks:
     - **Flask of the Warrior:** +30% attack, +15% crit chance
     - **Flask of the Protector:** +30% defense, +20% max HP

3. **Gathering Rates:**
   - Increase gathering chance (40% → 50% while traveling)
   - Higher chance for rare herbs at higher levels

#### **Mining (Keep Current):**
- Socket creation (new feature - balanced by material cost)
- Gem gathering (5% chance - rare)
- Armor/weapon upgrades (existing - keep as is)

### **Balance Goal:**
- **Mining:** Long-term progression (sockets, gems, upgrades)
- **Enchanting:** Combat effectiveness (proc effects, runes)
- **Herbalism:** Temporary power spikes (elixirs, flasks)

Each profession should feel valuable and distinct.

---

**Document Version:** 1.1  
**Last Updated:** January 2025  
**Status:** Updated with transferable sockets and profession balance considerations
