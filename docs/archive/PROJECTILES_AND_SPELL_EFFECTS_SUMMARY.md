# Projectiles and Spell Effects - Complete Implementation

## ✅ All Ranged Heroes Now Have Projectiles

### Heroes with Projectiles:
1. **Spellcasters:**
   - mage
   - warlock
   - firemage
   - frostmage
   - dragonsorcerer
   - ranger (✅ Added)
   - shadowpriest (✅ Added)
   - mooncaller (✅ Added)
   - stormcaller (✅ Added)

2. **Necromancers:**
   - necromancer

3. **Healers:**
   - cleric
   - atoner
   - druid
   - lightbringer
   - shaman
   - mistweaver
   - chronomancer
   - bard

## ✅ Spell Effects Applied to Hero Projectiles Only

### Implementation Details:
- **Hero Projectiles**: Spell effects applied via `spellEffect` parameter (founders only)
- **Enemy Projectiles**: No spell effects (enemies don't have founder tiers)
- **Filter Layering**: Spell effects layer on top of element filters (fire/frost/arcane)

### How It Works:
1. When a hero with a founder tier attacks with a projectile:
   - `createProjectile()` is called with `isHero: true` and `spellEffect: hero.spellEffect`
   - Spell effect filter is applied to the projectile sprite
   - Scale multiplier increases projectile size based on tier
   - Animations applied for gold/platinum tiers

2. When an enemy attacks with a projectile:
   - `createProjectile()` is called with `isHero: false` (default)
   - No `spellEffect` parameter passed
   - No spell effects applied (normal enemy projectile)

## ✅ Files Updated

1. **`src/utils/spriteAnimationData.ts`**
   - Added ranger, shadowpriest, mooncaller, stormcaller to `HERO_PROJECTILE_MAPPING`

2. **`src/pages/RaidBrowserSourcePage.tsx`**
   - Added ranger, shadowpriest, mooncaller, stormcaller to spellcasters list
   - Pass `hero.spellEffect` to `createProjectile()` for hero projectiles

3. **`src/utils/projectiles.ts`**
   - Added `spellEffect` parameter
   - Applied spell effect filters and scale multipliers
   - Combined with existing element filters

4. **`src/index.css`**
   - Added CSS animations for gold and platinum spell effects

5. **`src/components/HeroDashboard.tsx`**
   - Added spell effect selection UI

## 🎯 Result

- ✅ All ranged heroes now fire projectiles
- ✅ Spell effects only apply to hero projectiles (founders)
- ✅ Enemy projectiles remain unchanged
- ✅ Effects layer properly with element filters
- ✅ Scales and animations work correctly

