# Store Page & Reroll Button Fixes

## ✅ Fixed Issues

### 1. Reroll Button Not Firing
**Problem:** Reroll button wasn't working because it required `onReroll` prop and gold check.

**Solution:**
- Removed `onReroll` prop requirement
- Made reroll free (just regenerates options locally)
- Removed gold cost check from reroll button
- Button now works immediately on click

**File:** `src/components/UpgradeModal.tsx`
- Simplified `handleReroll` function (no async, no backend call)
- Removed gold cost validation
- Button is always enabled (unless upgrading)

### 2. Store Page "Hero Not Found" Error
**Problem:** Store page was using single `hero` from `useHero`, but users can have multiple heroes. Purchase was failing with "hero not found".

**Solution:**
- Updated store page to fetch all heroes using `heroes` array from `useHero` hook
- Added hero selection modal for gold shop purchases
- Shows all heroes with their gold/token amounts
- User selects which hero should receive the purchase
- Passes hero document ID to purchase API (not Twitch user ID)

**File:** `src/pages/StorePage.tsx`
- Changed from `hero` to `heroes` array
- Added `handleGoldPurchaseClick` function to show modal
- Added `selectedGoldItem` state for hero selection modal
- Added hero selection modal UI
- Updated currency display to show totals across all heroes
- Updated purchase logic to use hero document ID

**Changes:**
- Gold shop items now show hero selection modal (if multiple heroes)
- Single hero: purchases directly
- Multiple heroes: shows selection modal
- Each hero card shows: name, level, role, gold amount, can afford status

## 🎯 User Experience

### Before:
- Reroll button didn't work
- Store purchases failed with "hero not found"
- Couldn't choose which hero gets the boost

### After:
- ✅ Reroll button works instantly (free, no gold cost)
- ✅ Store shows all heroes and lets you pick which one gets the item
- ✅ Purchases work correctly for any hero
- ✅ Shows total gold/tokens across all heroes at top

## 📝 Notes

- Reroll is now **free** (just regenerates options client-side)
- Gold cost shown was informational - we could add reroll cost later if desired
- Hero selection modal only shows if user has 2+ heroes
- Single hero users: purchase works directly (no modal)
