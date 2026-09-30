# Upgrade System Fix - Hero Stats vs Item Stats

## Issue
Upgrades were being calculated as percentages of the **item's base stats**, not the **hero's total accumulated stats**. This meant:
- Upgrading armor with "+10% Attack" when armor has 0 attack = 0 bonus
- Upgrades should be percentages of the hero's total stats (base + all equipment)

## Fix

### Before (Wrong):
- Upgrades calculated as: `itemBaseAttack * percentage / 100`
- If item has 0 attack, upgrade gives 0 bonus
- Example: Armor with 0 attack + 10% upgrade = 0 bonus

### After (Correct):
- Upgrades calculated as: `heroTotalAttack * percentage / 100`
- Upgrade gives meaningful bonus based on hero's total stats
- Example: Hero with 100 total attack + 10% upgrade = +10 attack bonus

## Implementation

The calculation now works in two phases:

1. **First Pass:** Add all equipment base stats to hero's base stats
   - Calculate hero's total accumulated stats (base + all equipment)

2. **Second Pass:** Apply upgrades as percentages of hero's total stats
   - Store pre-upgrade totals
   - Apply each upgrade as percentage of hero's total (not item's base)

## Code Changes

**File:** `src/pages/CleanBattlefieldSource.tsx` - `calculateHeroStats` function

```typescript
// First pass: Add all equipment stats
Object.values(equipment).forEach((item: any) => {
  stats.attack += item.attack || 0;
  stats.defense += item.defense || 0;
  // ... etc
});

// Store pre-upgrade totals
const preUpgradeStats = {
  attack: stats.attack,
  defense: stats.defense,
  // ... etc
};

// Second pass: Apply upgrades as % of hero's total stats
Object.values(equipment).forEach((item: any) => {
  item.upgradeStats.forEach((upgrade: any) => {
    upgrade.selectedStats.forEach((selectedStat: any) => {
      // Now uses preUpgradeStats.attack (hero's total) instead of item.attack
      stats.attack += Math.floor(preUpgradeStats.attack * statValue / 100);
    });
  });
});
```

## Result

Now when you upgrade with "+10% Attack":
- **Before:** 10% of item's attack (0 if armor) = 0 bonus
- **After:** 10% of hero's total attack (e.g., 100) = +10 attack bonus

Upgrades now always provide meaningful bonuses based on the hero's total stats!

