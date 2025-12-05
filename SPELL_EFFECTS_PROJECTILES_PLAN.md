# Spell Effects on Projectiles - Implementation Plan

## Overview
Add spell effect visual enhancements to projectiles for heroes with founder pack tiers. This enhances the visual impact of ranged attacks (pyromancer, wizard, baby dragon, skeleton mage) with special effects based on founder pack tier.

## Current State

### ✅ Already Implemented:
- Projectile system exists (`src/utils/projectiles.ts`)
- Hero projectiles supported (Wizard, Pyromancer)
- Element-based filters (fire, frost, arcane) already in place
- Projectile assets exist for:
  - Pyromancer: `Fire_projectile.png`
  - Wizard: `Projectile.png`
  - Baby Dragon: `projectile.png`, `projectile_diagonal.png`
  - Skeleton Mage: `projectile.png`

### ❌ Needs Implementation:
- Spell effect field on Hero type
- Spell effect filters for projectiles
- UI for selecting spell effects
- Application of spell effects during projectile creation

---

## Implementation Steps

### Step 1: Add Spell Effect Field to Hero Type
**File:** `src/types/Hero.ts`

Add to Hero interface:
```typescript
spellEffect?: string; // 'bronze' | 'silver' | 'gold' | 'platinum' | null
```

### Step 2: Create Spell Effect Utility
**File:** `src/utils/spellEffects.ts` (new file)

Create utility functions to get spell effect filters:
- Bronze: Subtle glow
- Silver: Enhanced glow
- Gold: Enhanced glow + particle trail
- Platinum: Enhanced glow + particle trail + holographic sparkles

### Step 3: Update Projectile System
**File:** `src/utils/projectiles.ts`

Enhance `createProjectile` function to:
- Accept `spellEffect` parameter
- Apply spell effect filters to projectile sprite element
- Layer spell effects on top of existing element filters

### Step 4: Apply Spell Effects in Combat
**File:** `src/utils/fullCombatEngine.ts` (or wherever hero projectiles are created)

When creating hero projectiles:
- Check hero's `spellEffect` field
- Pass spell effect to `createProjectile` function
- Apply visual enhancements

### Step 5: Add Spell Effect Selection UI
**File:** `src/components/HeroDashboard.tsx`

Add spell effect selection dropdown:
- Show available spell effects (based on founder pack tier)
- Preview effect on projectile
- Save selection to Firebase

### Step 6: Display in Browser Source
**File:** `src/pages/CleanBattlefieldSource.tsx`

Ensure `spellEffect` field is loaded from Firebase and passed to projectile creation.

---

## Spell Effect Visuals

### Bronze Spell Effect
- Subtle glow around projectile
- Slight size increase
- Bronze-tinted drop-shadow

### Silver Spell Effect
- Enhanced glow around projectile
- Moderate size increase
- Silver-tinted drop-shadow + trail

### Gold Spell Effect
- Enhanced glow + particle trail
- Larger size increase
- Gold-tinted drop-shadow + animated trail particles
- Pulsing glow effect

### Platinum Spell Effect
- Enhanced glow + particle trail + sparkles
- Largest size increase
- Platinum/purple-tinted drop-shadow
- Animated trail particles
- Twinkling sparkles around projectile
- Holographic shimmer effect

---

## Technical Details

### Filter Combinations
Spell effects will be layered on top of existing element filters:
- Base element filter (fire/frost/arcane) - from existing system
- Spell effect filter - new enhancement
- Combined using CSS filter property (multiple filters can be combined)

### Performance Considerations
- Spell effects use CSS filters (hardware accelerated)
- Particle effects should be subtle (not too many)
- Effects only apply during projectile flight (1.2 seconds)
- No impact on idle performance

---

## Files to Modify/Create

1. **New Files:**
   - `src/utils/spellEffects.ts` - Spell effect filter utilities

2. **Modified Files:**
   - `src/types/Hero.ts` - Add spellEffect field
   - `src/utils/projectiles.ts` - Add spell effect support
   - `src/utils/fullCombatEngine.ts` - Apply spell effects to hero projectiles
   - `src/components/HeroDashboard.tsx` - Add spell effect selection UI
   - `src/pages/CleanBattlefieldSource.tsx` - Load and use spellEffect field

---

## Next Steps

1. Start with Hero type update
2. Create spell effect utility
3. Update projectile system
4. Apply in combat
5. Add UI

Let's start with Step 1: Adding the spellEffect field to the Hero type!
