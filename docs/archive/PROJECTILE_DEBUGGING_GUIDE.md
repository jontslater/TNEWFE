# Projectile Debugging Guide

## Current Implementation Status

### ✅ Projectiles Are Configured For:
- **All Ranged Heroes:**
  - mage, warlock, firemage, frostmage, dragonsorcerer
  - ranger, shadowpriest, mooncaller, stormcaller
  - necromancer
  - All healers (cleric, atoner, druid, lightbringer, shaman, mistweaver, chronomancer, bard)

### ✅ Projectile Creation Logic:
1. **Location**: `RaidBrowserSourcePage.tsx` (lines 2205-2321)
2. **Function**: `createProjectile()` in `src/utils/projectiles.ts`
3. **Spell Effects**: Applied via `hero.spellEffect` parameter

## How Projectiles Work

### Projectile Creation Flow:
1. Hero attacks → `usesProjectile` check (line 1899)
2. If ranged hero → play `rangedAttack` animation (line 2162)
3. Wait 300ms → create projectile (line 2205)
4. Projectile travels from hero center to enemy center
5. On hit → enemy plays `hurt` animation (line 2223)

### Spell Effects Applied:
- **Filter**: Applied via `getSpellEffectFilter(spellEffect)` (line 157)
- **Scale**: Projectile size multiplier based on tier (lines 158-160)
- **Animation**: Gold/Platinum get CSS animations (lines 280-300)

### Visual Configuration:
- **Start Position**: Center of attacker sprite (line 132-133)
- **End Position**: Center of target sprite (line 136-137)
- **Z-Index**: 150 (line 169) - should be above sprites
- **Animation**: Frame-by-frame animation from sprite sheet (line 244)

## Potential Issues to Check

### 1. Projectiles Not Visible
**Check:**
- Is `battlefieldContainer` being found correctly? (lines 72-126)
- Is z-index correct? (should be 150, line 169)
- Are elements (`currentHeroElement`, `currentEnemyElement`) found? (lines 2169-2174)
- Is `usesProjectile` correctly detecting ranged heroes? (line 1899)

### 2. Spell Effects Not Showing
**Check:**
- Is `hero.spellEffect` being loaded from Firebase? (line 2321)
- Is `getSpellEffectFilter()` returning correct filters? (line 157)
- Are filters being applied to sprite element? (lines 275-278)
- Are CSS animations loading for gold/platinum? (see `index.css`)

### 3. Projectiles Not Originating from Caster
**Check:**
- Is `currentHeroElement` the correct element? (line 2169)
- Is start position calculated correctly? (lines 132-133)
- Is projectile positioned at sprite center? (line 167)

### 4. Projectiles Not Hitting Target
**Check:**
- Is `currentEnemyElement` the correct element? (lines 2172-2174)
- Is end position calculated correctly? (lines 136-137)
- Is projectile animation completing? (lines 296-336)

## Debug Steps

### Step 1: Verify Projectile Creation
Add console.log in `RaidBrowserSourcePage.tsx`:
```typescript
console.log('🎯 Creating projectile:', {
  hero: hero.name,
  role: hero.role,
  usesProjectile,
  heroElement: !!currentHeroElement,
  enemyElement: !!currentEnemyElement,
  spellEffect: hero.spellEffect
});
```

### Step 2: Verify Battlefield Container
In `projectiles.ts`, check if container is found:
```typescript
console.log('🎯 Battlefield container:', {
  found: !!battlefieldContainer,
  className: battlefieldContainer?.className,
  width: battlefieldContainer?.getBoundingClientRect().width
});
```

### Step 3: Verify Spell Effects
In `projectiles.ts`, check filter application:
```typescript
console.log('🎯 Spell effect:', {
  spellEffect,
  filter: spellEffectData?.filter,
  scale: spellEffectData?.scale
});
```

### Step 4: Check Console for Errors
Look for:
- "No mapping found for role" (line 1105)
- "Battlefield container not found" (line 69)
- "Missing DOM elements" warnings

## Next Steps

1. **Test in Browser**: Open browser console and watch for projectile creation logs
2. **Check Element Positions**: Verify hero and enemy elements are visible and positioned correctly
3. **Verify Spell Effects**: Ensure `hero.spellEffect` is loaded from Firebase
4. **Check Animation**: Ensure projectile sprite sheet is loading correctly

## Files to Review

- `src/pages/RaidBrowserSourcePage.tsx` (lines 1896-2321) - Projectile creation trigger
- `src/utils/projectiles.ts` - Projectile creation logic
- `src/utils/spellEffects.ts` - Spell effect filters
- `src/index.css` - CSS animations for gold/platinum

