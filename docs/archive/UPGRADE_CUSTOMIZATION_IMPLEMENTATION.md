# Upgrade Customization System - Implementation Summary

## ✅ Completed Frontend Work

### 1. Stat Options Generation (`src/utils/upgradeStatOptions.ts`)
- ✅ Generate 4 random stat options from pool of 7 stat types
- ✅ Stat types: Attack, Defense, HP, Crit Chance, Crit Damage, Healing Power, Spell Damage
- ✅ Value ranges:
  - Primary stats (Attack, Defense, HP): 5-10%
  - Crit Chance: 3-8%
  - Crit Damage: 5-15%
  - Healing Power & Spell Damage: 5-10%
- ✅ Reroll cost calculation (scales with upgrade level)
- ✅ Stat icons and formatting helpers

### 2. New Upgrade Modal (`src/components/UpgradeModal.tsx`)
- ✅ Shows 4 random stat options in a 2x2 grid
- ✅ Player selects exactly 2 of 4 options
- ✅ Reroll button (costs gold, scales with level)
- ✅ Visual feedback for selected/unselected states
- ✅ Upgrade cost display
- ✅ Disabled state when max level reached

### 3. Item Interface Update (`src/types/Hero.ts`)
- ✅ Added `upgradeStats` array to Item interface:
  ```typescript
  upgradeStats?: Array<{
    level: number; // Which upgrade level (1-10)
    selectedStats: Array<{
      type: 'attack' | 'defense' | 'hp' | 'critChance' | 'critDamage' | 'healingPower' | 'spellDamage';
      value: number; // Percentage bonus
    }>;
  }>;
  ```

### 4. API Integration (`src/api/client.ts`)
- ✅ Updated `upgradeItem` signature to accept `selectedStats` array
- ✅ Changed from `levels: number` to `selectedStats: Array<{type, value}>`

### 5. UI Integration
- ✅ InventoryManager upgrade buttons disabled at max level (+10)
- ✅ PlayerPortal integration updated
- ✅ Modal shows "Max Level" when item is fully upgraded

## ⚠️ Backend Work Needed

### 1. API Endpoint Update (`/api/heroes/:userId/upgrade-item`)
**Current:** Accepts `{ itemId, levels }`  
**Needed:** Accept `{ itemId, selectedStats }`

**Request Body:**
```json
{
  "itemId": "item_123",
  "selectedStats": [
    { "type": "attack", "value": 7 },
    { "type": "critChance", "value": 5 }
  ]
}
```

**Backend should:**
1. Deduct upgrade cost (same formula as frontend)
2. Increment `item.upgradeLevel` by 1
3. Store selected stats in `item.upgradeStats` array:
   ```javascript
   upgradeStats: [{
     level: currentLevel + 1,
     selectedStats: [
       { type: "attack", value: 7 },
       { type: "critChance", value: 5 }
     ]
   }]
   ```
4. Return updated item and new gold amount

### 2. Reroll Endpoint (Optional - can be handled client-side)
**New Endpoint:** `/api/heroes/:userId/reroll-upgrade-options`

**Request Body:**
```json
{
  "itemId": "item_123"
}
```

**Backend should:**
1. Calculate reroll cost (same as frontend formula)
2. Deduct gold
3. Return success (frontend generates new options client-side)

**OR:** Just handle reroll client-side (deduct gold when upgrade happens with new selections)

### 3. Stat Calculation Updates
Need to apply upgrade stat bonuses when calculating hero stats:

**Current:** Apply `upgradeLevel * 5%` to all stats  
**New:** Apply selected stat bonuses from `upgradeStats` array

**Example calculation:**
```javascript
// For each upgrade level
item.upgradeStats.forEach(upgrade => {
  upgrade.selectedStats.forEach(stat => {
    if (stat.type === 'attack') {
      bonus.attack += (item.attack * stat.value / 100);
    }
    if (stat.type === 'critChance') {
      bonus.critChance += stat.value;
    }
    // etc.
  });
});
```

## 📋 Next Steps

1. **Backend API Update** - Update upgrade endpoint to accept and store selected stats
2. **Stat Calculation** - Update hero stat calculation to apply custom upgrade bonuses
3. **Item Display** - Show selected upgrade stats in item tooltips/cards
4. **Testing** - Test upgrade flow end-to-end

## 🎮 Player Experience

**How it works:**
1. Player clicks "Upgrade" on an item
2. Modal shows 4 random stat bonuses
3. Player can reroll for gold to get different options
4. Player selects 2 of the 4 options
5. Upgrades item - selected stats are permanently applied
6. Next upgrade level will show 4 new random options

**Benefits:**
- Customization: Players choose stats that fit their build
- Strategy: Meaningful choices each upgrade
- Replayability: Rerolling for better options
- Monetization: Gold sink through rerolls

## 💰 Cost Formulas

**Upgrade Cost:**
```
baseCost (100) * rarityMultiplier * (1.5 ^ currentLevel)
```

**Reroll Cost:**
```
baseCost (50) * (1.5 ^ currentLevel)
```

Costs scale exponentially, making higher-level upgrades and rerolls expensive.

