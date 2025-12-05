# Custom Aura Color Implementation

## ✅ Implementation Complete

Founders can now customize the color of their aura effects, similar to how name colors work.

## What Was Added

### 1. Hero Type Update
- Added `auraColor?: string;` field to `Hero` interface
- Allows custom hex color (e.g., "#FF5733") to override tier default color

### 2. Aura Effects Utility Update
- Updated `getAuraFilter()` to accept optional `customColor` parameter
- Uses custom color if provided, otherwise uses tier default color
- Converts hex color to rgba for drop-shadow filters

### 3. Hero Dashboard UI
- Added "Aura Color Picker" section (only shown when aura effect is selected)
- Color picker input (visual color selector)
- Hex code text input
- "Save" button (only saves on click, not on drag/release)
- "Reset to default tier color" button
- Shows default tier color if no custom color is set

### 4. Browser Source Updates
- `CleanBattlefieldSource.tsx` now loads `auraColor` from Firebase
- Aura filters are applied with custom color when available
- Works in both idle and raid modes

## How It Works

1. **Select Aura Tier**: User selects bronze/silver/gold/platinum aura effect
2. **Choose Custom Color**: Color picker appears, user can select any color
3. **Save**: Color is saved to Firebase (`hero.auraColor`)
4. **Display**: Aura glow uses custom color instead of tier default
5. **Reset**: User can reset to default tier color anytime

## Default Colors (if no custom color)
- **Bronze**: `#CD7F32`
- **Silver**: `#C0C0C0`
- **Gold**: `#FFD700`
- **Platinum**: `#E5E4E2`

## Files Modified

1. `src/types/Hero.ts` - Added `auraColor` field
2. `src/utils/auraEffects.ts` - Updated `getAuraFilter()` to support custom colors
3. `src/components/HeroDashboard.tsx` - Added color picker UI and handler
4. `src/pages/CleanBattlefieldSource.tsx` - Loads and applies custom aura colors

## Testing

To test:
1. Go to Hero Dashboard
2. Select an aura effect (bronze/silver/gold/platinum)
3. Use the color picker to choose a custom color
4. Click "Save"
5. Check browser source to see custom colored aura glow

## Result

- ✅ Founders can customize aura colors
- ✅ Default tier colors still work if no custom color is set
- ✅ Color picker matches name color picker UI/UX
- ✅ Custom colors work in browser source
- ✅ Preview shows custom color in real-time
