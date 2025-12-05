# Exhaust Effects for Huge Knight Critical Hits

## ✅ Implementation Complete

Added exhaust effects that appear when tanks (Huge Knight sprite) land critical hits, but only for Gold and Platinum founder tiers.

## What Was Added

### 1. Exhaust Effects Utility (`src/utils/exhaustEffects.ts`)
- **`createExhaustEffect()`**: Creates and displays exhaust GIF effects
  - Accepts hero element, spell effect tier (gold/platinum), and exhaust type
  - Rotates GIF 90 degrees clockwise (from vertical to horizontal)
  - Applies spell effect filters (gold/platinum glow)
  - Positions exhaust at bottom center of hero sprite
  - Auto-removes after 2.5 seconds with fade out

- **`shouldShowExhaustEffect()`**: Checks if hero should show exhaust
  - Returns true only for tanks (Huge Knight sprite) with gold/platinum spell effect

### 2. Integration into Critical Hit System
- **File**: `src/pages/CleanBattlefieldSource.tsx`
- **Trigger**: When a tank lands a critical hit AND has gold/platinum spell effect
- **Timing**: Appears 200ms after attack animation (to sync with attack)

### 3. Exhaust GIF Files
- **Location**: `/public/Sprites/Heroes/HeroSprites/Huge Knight 2D Pixel Art/`
- **Files**:
  - `exhaust_01_preview.gif` - Used for Gold tier
  - `exhaust02_preview.gif` - Used for Platinum tier

## How It Works

1. **Tank Crits**: When a tank (guardian, paladin, warden, bloodknight, vanguard, brewmaster) lands a critical hit
2. **Check Tier**: System checks if hero has Gold or Platinum spell effect
3. **Create Effect**: If conditions met, exhaust GIF is created:
   - Rotated 90 degrees right (vertical → horizontal)
   - Positioned at bottom center of hero sprite
   - Gold uses `exhaust_01_preview.gif`
   - Platinum uses `exhaust02_preview.gif`
   - Spell effect filters applied (glow/color enhancement)
4. **Auto-Cleanup**: Effect fades out and is removed after 2.5 seconds

## Visual Details

- **Rotation**: GIFs are rotated 90 degrees clockwise (right) to align horizontally
- **Position**: Centered horizontally, positioned at bottom of hero sprite (behind feet)
- **Effects**: Gold/Platinum spell effect filters add glow and color enhancement
- **Animation**: GIF plays naturally (transparent background preserved)
- **Z-Index**: Appears above sprites but below scrolling combat text

## Testing

To test:
1. Create/select a tank hero (guardian, paladin, etc.)
2. Set spell effect to Gold or Platinum in Hero Dashboard
3. Trigger critical hits (or use test commands)
4. Watch for exhaust effect appearing at bottom of hero sprite on crits

## Files Modified

1. `src/utils/exhaustEffects.ts` - New file with exhaust effect logic
2. `src/pages/CleanBattlefieldSource.tsx` - Integrated exhaust effects into crit system

## Result

- ✅ Exhaust effects appear on tank crits
- ✅ Only for Gold and Platinum founder tiers
- ✅ GIFs rotated correctly (90deg right)
- ✅ Spell effects applied to exhaust
- ✅ Auto-cleanup after animation
- ✅ Positioned correctly at hero's bottom center
