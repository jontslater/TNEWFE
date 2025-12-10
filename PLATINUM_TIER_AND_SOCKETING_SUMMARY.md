# Platinum Tier Features & Socketing System Summary

**Date:** January 2025

---

## 🏆 Platinum Tier Founder Pack Features ($25)

The Platinum tier is the highest founder pack tier and includes all lower tier benefits plus exclusive features:

### **✅ Already Implemented:**
1. **Name Colors** - Custom hex color picker
2. **Name Frames** - Platinum frame variant
3. **Aura Effects** - Holographic sparkle effect (Platinum-specific)
4. **Spell Effects** - Enhanced projectile effects with exhaust effects for tanks
5. **Founder Title** - "Platinum Founder" title with tier-based coloring
6. **Badge** - Platinum Founder badge display
7. **250 Tokens** - Premium currency grant

### **❌ Not Yet Implemented:**

#### **1. Founder Statue** (2-3 days)
**What It Is:**
- A permanent statue on the battlefield displaying the founder's name
- Visual monument to early supporters
- Only visible to Platinum tier founders

**Implementation:**
- Create statue sprite asset (or reuse existing sprite)
- Backend: Statue placement system (track location, store founder name/date)
- Browser Source: Render statue on battlefield with founder name
- Portal: Statue placement UI (choose location)

**Priority:** MEDIUM (Platinum tier only)

---

#### **2. Chat Badge** (1-2 days)
**What It Is:**
- Badge icon next to username in chat
- Shows "Platinum Founder" status
- Visible to other players in chat

**Implementation:**
- Determine chat system (Twitch extension vs web chat)
- Display badge in chat messages or web chat UI
- Badge icon next to username

**Priority:** LOW (Platinum tier only, depends on chat system)

---

## 💎 Socketing & Gem System Overview

### **What It Is:**
A WoW-style socketing system where players can:
- Add socket slots to gear via Mining profession
- Insert gems into sockets for stat bonuses
- Earn socket bonuses for matching gem colors/types
- Gather gems while mining (5% drop rate)

### **Why It's Cool:**
1. **Strategic Depth:** Players must plan gem combinations for socket bonuses
2. **Progression Path:** Mining profession becomes more valuable
3. **Customization:** Players can optimize gear for their playstyle
4. **Balance:** Modest stat boosts that don't break game balance
5. **WoW Nostalgia:** Familiar system that players understand

---

## 🎮 How It Works

### **Step 1: Gather Gems**
- Choose Mining profession
- Use `!mine` command to gather ore
- 5% chance to also find a gem (Ruby, Sapphire, Emerald, or Diamond)
- Gem rarity based on mining level (higher level = better gems)

### **Step 2: Craft Socket Item**
- Reach Mining level 50
- Gather materials: 5 Mithril + 2 Adamantite
- Pay 500g (one-time cost when crafting socket item)
- Use `!craft gem_socket` command or Portal UI
- Creates "Gem Socket" item in inventory
- **Socket item can be sold on auction house** (transferable)

### **Step 3: Apply Socket to Gear**
- Have socket item in inventory (crafted or bought from auction house)
- Check gear max sockets (e.g., "Sockets: 0/2" for Epic gear)
- Use `!apply-socket [slot]` command or Portal UI
- Select socket item and gear to apply to
- Socket item is consumed, socket added to gear
- **No additional gold cost** - You already paid when crafting/purchasing the socket item

### **Step 4: Insert Gem**
- Have gem in inventory (gathered or bought from auction house)
- Use `!gem [slot] [gem-type]` command or Portal UI
- Select socket to insert gem
- Gem stats apply to hero immediately

### **Step 5: Socket Bonuses**
- **2 Red gems:** +5% Attack
- **2 Blue gems:** +5% Defense
- **2 Green gems:** +3% All Stats
- **2 Yellow gems:** +10% XP Gain
- **Mixed combinations:** Hybrid bonuses (see design doc)

---

## 📊 Socket Slots Per Gear

**Weapons & Armor (Chest):**
- Rare: 1 socket
- Epic: 2 sockets
- Legendary: 2 sockets
- Mythic: 3 sockets

**Accessories & Shield:**
- Rare: 1 socket
- Epic: 1 socket
- Legendary: 2 sockets
- Mythic: 2 sockets

**Secondary Slots (Helm, Cloak, Gloves, Boots, Rings):**
- Epic: 1 socket
- Legendary: 1 socket
- Mythic: 2 sockets

**Note:** Common/Uncommon gear has no sockets (early game).

---

## 💎 Gem Types & Stats

### **Ruby (Red) - Offensive**
- Common: +5 Attack
- Uncommon: +10 Attack
- Rare: +15 Attack, +2% Crit Chance
- Epic: +25 Attack, +5% Crit Chance
- Legendary: +40 Attack, +8% Crit Chance, +5% Crit Damage

### **Sapphire (Blue) - Defensive**
- Common: +5 Defense
- Uncommon: +10 Defense
- Rare: +15 Defense, +2% Damage Reduction
- Epic: +25 Defense, +5% Damage Reduction
- Legendary: +40 Defense, +8% Damage Reduction, +5% Max HP

### **Emerald (Green) - Hybrid**
- Common: +3 Attack, +3 Defense
- Uncommon: +6 Attack, +6 Defense
- Rare: +10 Attack, +10 Defense, +1% All Stats
- Epic: +18 Attack, +18 Defense, +3% All Stats
- Legendary: +30 Attack, +30 Defense, +5% All Stats

### **Diamond (Yellow) - Special**
- Common: +5% XP Gain
- Uncommon: +10% XP Gain
- Rare: +15% XP Gain, +2% Gold Gain
- Epic: +25% XP Gain, +5% Gold Gain
- Legendary: +40% XP Gain, +10% Gold Gain, +5% Token Gain

---

## 🎁 Socket Bonus Examples

**2-Socket Item (Epic Weapon):**
- 2 Red gems: +5% Attack bonus
- 2 Blue gems: +5% Defense bonus
- 1 Red + 1 Blue: +3% Attack, +3% Defense

**3-Socket Item (Mythic Weapon):**
- 3 Red gems: +10% Attack, +5% Crit Chance
- 2 Red + 1 Blue: +8% Attack, +5% Defense
- 1 Red + 1 Blue + 1 Green: +5% Attack, +5% Defense, +5% All Stats

**Note:** Socket bonuses are **additive** with gem stats and apply per item.

---

## ⚖️ Balance Considerations

### **Why It's Balanced:**
1. **Modest Stats:** Gems provide small but meaningful stat boosts
2. **Rare Gems:** Higher rarity gems are very rare (2-5% at high levels)
3. **Material Cost:** Socket creation requires rare materials (5 Mithril + 2 Adamantite) + 500g crafting cost
4. **Level Gate:** Requires Mining level 50+ to create sockets
5. **No Additional Cost:** Once socket item is crafted/purchased, applying to gear is free (players already paid for the socket item)

### **Example Balance Check:**
- Level 50 hero with 500 base attack
- 2 Legendary Rubies: +80 Attack (16% increase)
- Socket bonus (2 Red): +5% Attack = +25 attack
- **Total:** +105 attack (21% increase)
- **This is significant but not game-breaking**

---

## 📋 Implementation Status

**Design:** ✅ Complete (see `SOCKETING_GEM_SYSTEM_DESIGN.md`)  
**Backend:** ❌ Not started  
**Frontend:** ❌ Not started  
**Browser Source:** ❌ Not started  

**Estimated Time:** 5-8 days (full implementation)

**Priority:** MEDIUM-HIGH (User requested implementation)

---

## 🎯 Next Steps

1. **Review Design:** Check `SOCKETING_GEM_SYSTEM_DESIGN.md` for full details
2. **Backend First:** Implement socket/gem APIs and data structures
3. **Frontend UI:** Create socket/gem management interface
4. **Browser Source:** Integrate gem stats into combat calculations
5. **Testing:** Balance test gem stats and socket bonuses

---

**Document Version:** 1.0  
**Last Updated:** January 2025
