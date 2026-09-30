# Combat System Audit - Implementation Status

## ✅ IMPLEMENTED FEATURES

### Core Combat Mechanics
- [x] **Turn-based combat with initiative** - `combatEngine.ts` uses initiative calculation
- [x] **Initiative system** - Heroes and enemies roll initiative, actions processed in order
- [x] **Damage calculation** - `combat/damageCalculation.ts` handles all damage formulas
- [x] **Critical hits** - Crit chance and crit damage multipliers
- [x] **Defense/armor** - Damage reduction based on defense stat
- [x] **Combat text (SCT)** - Floating damage/healing numbers above sprites
- [x] **Combat logging** - All actions logged to console/UI

### Damage Over Time (DoT)
- [x] **DoT system** - `combat/buffsDebuffs.ts` processes DoTs every 2 seconds
- [x] **Poison DoT** - 5 damage every 2 seconds for 12 seconds
- [x] **Corruption DoT** - Dynamic damage based on source
- [x] **Bleed DoT** - 3 damage every 2 seconds for 10 seconds
- [x] **Stagger DoT** - Brewmaster passive, 4 ticks over 8 seconds
- [x] **Enchantment DoTs** - Fire and Poison enchantments apply DoT
- [x] **DoT tick interval** - Runs every 2 seconds during combat
- [x] **DoT combat text** - Shows `-X` damage with dot styling
- [x] **DoT expiration** - Debuffs expire after duration

### Healing System
- [x] **Instant healing** - Healers heal heroes below 30% HP
- [x] **Group healing** - Healers heal entire party when average HP < 70%
- [x] **Healing calculation** - Includes intellect, healing power, skill bonuses
- [x] **Overheal shields** - Excess healing converts to temporary shields
- [x] **Shield system** - Shields absorb damage, expire after 30s
- [x] **Shield expiry** - Expired shields convert to healing
- [x] **Healing combat text** - Shows `+X` healing with heal styling

### Heal Over Time (HoT)
- [x] **Rejuvenation (Druid)** - 15% max HP over 12 seconds (4 targets when 3+ injured)
- [x] **Healing Totems (Shaman)** - 8% max HP every 3 seconds for 15 seconds (when 4+ injured)
- [x] **Essence Font (Mistweaver)** - 12% max HP/sec for 6 seconds (when party avg < 60%)
- [x] **Prayer of Mending (Cleric)** - Bounces to 5 injured allies
- [x] **Healing Melody (Bard)** - Heals all party members
- [x] **Beacon of Light (Lightbringer)** - 40% of all heals go to tank (passive)
- [x] **HoT combat text** - Shows `+X` with `heal-hot` styling (lighter green, smaller)

### Buffs & Debuffs
- [x] **Debuff system** - `combat/buffsDebuffs.ts` handles all debuffs
- [x] **Weaken** - 30% attack reduction for 10 seconds
- [x] **Vulnerable** - 40% defense reduction for 8 seconds
- [x] **Stunned** - Skip turn for 3 seconds
- [x] **Cursed** - 50% healing reduction for 8 seconds
- [x] **Debuff resistance** - Heroes and enemies can resist debuffs
- [x] **Debuff expiration** - Debuffs expire after duration
- [x] **Buff system** - Buffs tracked with remaining duration
- [x] **Buff duration updates** - Buffs tick down during combat only

### Healer Abilities
- [x] **Group Heal** - When party average HP < 70%
- [x] **Instant Heal** - When any hero < 30% HP
- [x] **Combat Resurrection** - Cleric, Lightbringer, Shaman can res dead heroes
- [x] **Dispel** - Removes debuffs from most debuffed hero
- [x] **Chronomender Rewind** - Restores HP from snapshot
- [x] **Prayer of Mending (Cleric)** - Bounces healing to 5 allies
- [x] **Rejuvenation (Druid)** - HoT on 4 targets
- [x] **Healing Totems (Shaman)** - Pulses healing every 3s
- [x] **Essence Font (Mistweaver)** - Channels healing over 6s
- [x] **Battle Hymn (Bard)** - Buffs all party members
- [x] **Healing Melody (Bard)** - Heals all party members
- [x] **Beacon of Light (Lightbringer)** - Passive tank healing

### Class Abilities
- [x] **Tank abilities** - Taunt, Last Stand, etc.
- [x] **DPS abilities** - Various class-specific abilities
- [x] **Healer abilities** - All healer-specific abilities implemented
- [x] **Cooldown system** - All abilities have cooldowns
- [x] **Proc buffs** - Various proc-based buffs

### Emergency Abilities
- [x] **Last Stand** - Tanks use when < 20% HP
- [x] **Emergency heals** - Healers prioritize low HP heroes
- [x] **Emergency taunts** - Tanks taunt when healer is targeted

### AoE Abilities
- [x] **AoE damage** - Heroes can hit multiple enemies
- [x] **Chain Lightning** - Mage ability chains between enemies
- [x] **AoE calculations** - Proper damage distribution

### Enemy Combat
- [x] **Enemy attacks** - Enemies attack heroes
- [x] **Enemy abilities** - Special enemy abilities
- [x] **Enemy projectiles** - Animated projectiles (Baby Dragon, etc.)
- [x] **Enemy debuffs** - Enemies can apply debuffs to heroes
- [x] **Enemy DoTs** - Enemies can apply DoT effects

### Animation System
- [x] **Sprite animations** - Idle, attack, hurt, death animations
- [x] **Animation callbacks** - Combat engine triggers animations
- [x] **Projectile animations** - Animated projectiles travel from attacker to target
- [x] **Combat text animations** - Floating text with proper styling

## ⚠️ POTENTIALLY MISSING / NEEDS VERIFICATION

### HP Regeneration
- [x] **HP Regen from armor enchantments** - ✅ Implemented: `regeneration_armor` enchantment creates `activeBuffs.hpRegen`
- [ ] **HP Regen ticking** - ⚠️ MISSING: HP regen buff exists but is NOT processed during combat
- [ ] **HP Regen combat text** - ⚠️ MISSING: No SCT for HP regen ticks

### Buff/Debuff Display
- [ ] **Visual buff indicators** - Need to verify if buffs show on hero sprites
- [ ] **Visual debuff indicators** - Need to verify if debuffs show on hero/enemy sprites
- [ ] **Shield visual indicator** - Need to verify if shields show visually

### Combat Text Types
- [x] **Damage** - ✅ Implemented
- [x] **Critical** - ✅ Implemented
- [x] **Heal** - ✅ Implemented
- [x] **Heal-Hot** - ✅ Implemented
- [x] **DoT** - ✅ Implemented

### Combat Flow
- [x] **No duplicate combat loops** - Verified: Single combat loop in `fullCombatEngine.ts`
- [x] **Turn-based initiative** - Verified: Actions processed in initiative order
- [x] **Combat victory check** - Verified: Checks for victory after each round
- [x] **Combat pause/resume** - Verified: Pause system in place

## 🔍 NEEDS INVESTIGATION

### HP Regen System
**Status:** Need to check if HP regen from armor enchantments is implemented

**Expected Behavior:**
- Armor with `regeneration_armor` enchantment should grant `hpRegen` stat
- HP regen should tick every 1-2 seconds during combat
- HP regen should show SCT with `heal-hot` type
- HP regen should be capped (e.g., max 10 HP/sec)

**Where to Check:**
- `fullCombatEngine.ts` - Look for `hpRegen` processing
- `combat/buffsDebuffs.ts` - Check if HP regen is processed
- `combat/healing.ts` - Check if HP regen is handled
- Armor enchantment application logic

### Buff/Debuff Visual Indicators
**Status:** Need to verify if buffs/debuffs show visual indicators on sprites

**Expected Behavior:**
- Buffs should show icons/indicators above hero sprites
- Debuffs should show icons/indicators above hero/enemy sprites
- Shield should show visual indicator (e.g., blue bar or glow)

**Where to Check:**
- `BrowserSourcePage.tsx` - Look for buff/debuff display components
- `updateBuffDebuffDisplay.ts` - Check if this updates visual indicators

### Combat Text Positioning
**Status:** Recently fixed, but need to verify all types work correctly

**Expected Behavior:**
- Damage text appears above sprites
- Healing text appears above sprites
- DoT text appears above sprites
- HoT text appears above sprites
- Text should not overlap or clip

## 📋 IMPLEMENTATION CHECKLIST

### Critical (Must Have)
- [x] Turn-based combat with initiative
- [x] Damage calculation
- [x] DoT system
- [x] Healing system
- [x] HoT system
- [x] Buffs/Debuffs
- [x] Combat text
- [ ] **HP Regen ticking** - ⚠️ MISSING: Buff exists but not processed

### Important (Should Have)
- [x] Shields
- [x] Combat resurrection
- [x] Class abilities
- [x] Emergency abilities
- [x] AoE abilities
- [ ] **Visual buff/debuff indicators** - NEEDS VERIFICATION
- [ ] **Visual shield indicator** - NEEDS VERIFICATION

### Nice to Have
- [x] Projectile animations
- [x] Animation system
- [ ] **HP Regen SCT** - NEEDS VERIFICATION

## 🎯 NEXT STEPS

1. **Implement HP Regen Ticking** ⚠️ CRITICAL
   - HP regen buff is created but NOT processed during combat
   - Need to add HP regen processing in `processDebuffs` or create separate function
   - Should tick every 1-2 seconds (match DoT tick rate)
   - Should show SCT with `heal-hot` type
   - Should cap at max HP
   - Location: `combat/buffsDebuffs.ts` or `fullCombatEngine.ts`

2. **Verify Visual Indicators**
   - Check `updateBuffDebuffDisplay.ts`
   - Verify buff/debuff icons show on sprites
   - Verify shield visual indicator

3. **Test All Combat Features**
   - Test DoT ticking (poison, bleed, corruption)
   - Test HoT ticking (rejuvenation, totems, essence font)
   - Test healing (instant, group, overheal shields)
   - Test buffs/debuffs (application, expiration, resistance)
   - Test combat text (all types, positioning)

4. **Documentation**
   - Document HP regen system (if implemented)
   - Document visual indicator system
   - Create combat feature test checklist

## 📝 NOTES

- **DoT/HoT Tick Rate:** Currently set to 2 seconds (matches DoT `tickRate`)
- **Combat Loop:** Single loop in `fullCombatEngine.ts`, no duplicates
- **Initiative:** Calculated per round, actions processed in order
- **Combat Text:** All types implemented (damage, crit, heal, heal-hot, dot)
- **Healer Abilities:** All major healer abilities implemented
- **Shields:** Overheal shields implemented, need to verify visual indicator
