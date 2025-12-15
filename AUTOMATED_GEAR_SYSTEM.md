# Automated Gear Distribution System

**Date:** December 10, 2025  
**Goal:** Fully automated gear distribution for idle game (no user interaction)

---

## Design Principles

1. **Fully Automated** - No modals, no user interaction
2. **Smart Distribution** - Find best hero for each item
3. **Respect Locks** - Never auto-sell/replace locked gear
4. **Silent Operation** - Works in background, logs for debugging

---

## Automated Gear Distribution Logic

### **Step 1: When Loot Drops**

```
1. Check if item is locked → Skip if locked
2. Find best hero for this item:
   a. Check current hero (who got the loot)
   b. Check all other heroes on battlefield
   c. Compare stats improvement for each hero
3. Decision:
   - If significantly better for current hero (>10%) → Auto-equip
   - If better for another hero (>10%) → Auto-gift
   - If not better for anyone → Auto-sell (if not epic+)
   - If epic+ and not better → Keep in inventory
```

### **Step 2: Comparison Logic**

```javascript
function shouldEquip(item, hero) {
  const currentItem = hero.equipment[item.slot];
  if (!currentItem) return true; // No item in slot
  
  const currentStats = currentItem.attack + currentItem.defense + currentItem.hp;
  const newStats = item.attack + item.defense + item.hp;
  
  // Consider role-specific stats
  const role = hero.role.toLowerCase();
  const isTank = ['guardian', 'paladin', 'warden', 'bloodknight', 'vanguard', 'brewmaster'].includes(role);
  const isHealer = ['cleric', 'atoner', 'druid', 'lightbringer', 'shaman', 'mistweaver', 'chronomancer'].includes(role);
  
  if (isTank) {
    // Tanks prioritize defense and HP
    const currentValue = (currentItem.defense * 2) + currentItem.hp;
    const newValue = (item.defense * 2) + item.hp;
    return newValue > currentValue * 1.1; // 10% improvement threshold
  } else if (isHealer) {
    // Healers prioritize HP and defense
    const currentValue = currentItem.hp + currentItem.defense;
    const newValue = item.hp + item.defense;
    return newValue > currentValue * 1.1;
  } else {
    // DPS prioritize attack
    const currentValue = (currentItem.attack * 2) + currentItem.defense + currentItem.hp;
    const newValue = (item.attack * 2) + item.defense + item.hp;
    return newValue > currentValue * 1.1;
  }
}
```

### **Step 3: Find Best Hero**

```javascript
function findBestHeroForItem(item, allHeroes, currentHeroId) {
  let bestHero = null;
  let bestImprovement = 0;
  
  for (const hero of allHeroes) {
    // Skip if hero doesn't exist or is dead
    if (!hero || hero.isDead) continue;
    
    // Check if item slot matches hero's role
    if (!isSlotValidForRole(item.slot, hero.role)) continue;
    
    // Calculate improvement
    const improvement = calculateImprovement(item, hero);
    
    if (improvement > bestImprovement) {
      bestImprovement = improvement;
      bestHero = hero;
    }
  }
  
  return { hero: bestHero, improvement: bestImprovement };
}
```

### **Step 4: Auto-Sell Threshold**

```javascript
function shouldAutoSell(item, bestImprovement) {
  // Never auto-sell locked items
  if (item.locked) return false;
  
  // Never auto-sell epic+ items (keep for potential future use)
  if (['epic', 'legendary', 'mythic'].includes(item.rarity)) return false;
  
  // Auto-sell if not better for anyone (improvement < 5%)
  return bestImprovement < 0.05;
}
```

---

## Implementation Plan

### **Phase 1: Gear Locking**
1. Add `locked: boolean` to equipment schema
2. Add lock/unlock API endpoints
3. Add lock/unlock UI in player portal (not browser source)
4. Update auto-sell/replace to skip locked items

### **Phase 2: Smart Auto-Distribution**
1. Implement `findBestHeroForItem()` function
2. Implement `shouldEquip()` with role-based logic
3. Update loot processing to use smart distribution
4. Add logging for debugging

### **Phase 3: Auto-Sell Logic**
1. Implement `shouldAutoSell()` function
2. Update loot processing to auto-sell when appropriate
3. Keep epic+ items in inventory even if not better

### **Phase 4: Verification**
1. Test with multiple heroes
2. Test role-specific distribution
3. Test locked gear protection
4. Verify no modals/interruptions

---

## Code Structure

```typescript
// In CleanBattlefieldSource.tsx

interface GearDecision {
  action: 'equip' | 'gift' | 'sell' | 'keep';
  targetHeroId?: string;
  reason: string;
}

function processLootAutomatically(
  loot: Item,
  currentHero: Hero,
  allHeroes: Hero[]
): GearDecision {
  // 1. Check if locked
  if (loot.locked) {
    return { action: 'keep', reason: 'Item is locked' };
  }
  
  // 2. Find best hero
  const { hero: bestHero, improvement } = findBestHeroForItem(loot, allHeroes, currentHero.id);
  
  // 3. Make decision
  if (bestHero && improvement > 0.1) {
    if (bestHero.id === currentHero.id) {
      return { action: 'equip', targetHeroId: currentHero.id, reason: `Better than current (${Math.round(improvement * 100)}% improvement)` };
    } else {
      return { action: 'gift', targetHeroId: bestHero.id, reason: `Better for ${bestHero.name} (${Math.round(improvement * 100)}% improvement)` };
    }
  }
  
  // 4. Auto-sell or keep
  if (shouldAutoSell(loot, improvement)) {
    return { action: 'sell', reason: 'Not better for anyone, auto-selling' };
  }
  
  return { action: 'keep', reason: 'Epic+ item, keeping in inventory' };
}
```

---

## Gear Locking Implementation

### **Backend Schema**
```javascript
// Equipment item structure
{
  name: "Sword of Power",
  slot: "weapon",
  attack: 100,
  defense: 50,
  hp: 200,
  rarity: "epic",
  locked: false  // NEW FIELD
}
```

### **API Endpoints**
```javascript
// Lock gear
POST /api/heroes/:heroId/equipment/:slot/lock
// Unlock gear
POST /api/heroes/:heroId/equipment/:slot/unlock
```

### **Auto-Sell/Replace Protection**
```javascript
// In loot processing
if (currentItem?.locked) {
  console.log(`[Loot] 🔒 Skipping ${currentItem.name} - item is locked`);
  return; // Don't replace locked items
}

// In auto-sell logic
if (item.locked) {
  console.log(`[Loot] 🔒 Skipping auto-sell of ${item.name} - item is locked`);
  return; // Don't auto-sell locked items
}
```

---

## Testing Checklist

- [ ] Loot auto-equips when better for current hero
- [ ] Loot auto-gifts when better for another hero
- [ ] Loot auto-sells when not better (common/rare only)
- [ ] Epic+ items kept in inventory even if not better
- [ ] Locked items never auto-sold
- [ ] Locked items never auto-replaced
- [ ] Role-specific stat prioritization works
- [ ] Multiple heroes handled correctly
- [ ] No modals or user interaction required
- [ ] All actions logged for debugging

---

## Questions Answered

**Q: Should we let people decide what to do with gear?**  
**A:** No - fully automated for idle game experience.

**Q: How do we decide who gets gear?**  
**A:** Smart algorithm finds best hero based on:
- Role-specific stat priorities (tanks = defense/HP, DPS = attack, healers = HP/defense)
- 10% improvement threshold
- Slot compatibility

**Q: What if it's not better than theirs?**  
**A:** 
- Check all other heroes
- If better for another hero → gift
- If not better for anyone → auto-sell (common/rare) or keep (epic+)
- If locked → always keep






