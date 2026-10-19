# Combat System Implementation Plan

## Overview
This plan outlines the implementation of missing combat features identified in the combat system audit.

## Priority Levels
- **P0 (Critical)**: Core functionality that must work for combat to be complete
- **P1 (High)**: Important features that significantly enhance gameplay
- **P2 (Medium)**: Nice-to-have features that improve UX
- **P3 (Low)**: Polish features that can be added later

---

## Phase 1: HP Regeneration System (P0 - Critical)

### 1.1 Add HP Regen Processing Function
**File:** `src/utils/combat/buffsDebuffs.ts`  
**Status:** ⚠️ MISSING

**Implementation:**
- Create new function `processHpRegeneration()` that:
  - Iterates through all alive heroes
  - Checks for `activeBuffs.hpRegen` buff
  - Ticks every 1-2 seconds (match DoT tick rate)
  - Heals hero by `buff.value` amount
  - Caps healing at `maxHp`
  - Shows SCT with `heal-hot` type
  - Tracks last tick time to prevent double-ticking

**Code Structure:**
```typescript
export function processHpRegeneration(
  heroes: Hero[] | Map<string, Hero>,
  now: number,
  callbacks: CombatCallbacks
): void {
  const heroesArray = Array.isArray(heroes) ? heroes : Array.from(heroes.values());
  const tickRate = 2000; // 2 seconds (matches DoT tick rate)

  heroesArray.forEach((hero) => {
    if (!hero || hero.isDead || hero.hp <= 0) return;
    if (!hero.activeBuffs?.hpRegen) return;

    const hpRegenBuff = hero.activeBuffs.hpRegen;
    
    // Initialize lastTick if not exists
    if (!hpRegenBuff.lastTick) {
      hpRegenBuff.lastTick = now;
      return;
    }

    // Check if enough time has passed
    if (now - hpRegenBuff.lastTick >= tickRate) {
      const regenAmount = hpRegenBuff.value || 0;
      
      if (regenAmount > 0) {
        const hpBefore = hero.hp;
        hero.hp = Math.min(hero.hp + regenAmount, hero.maxHp);
        const actualHeal = hero.hp - hpBefore;
        
        hpRegenBuff.lastTick = now;

        if (actualHeal > 0) {
          // Show SCT with heal-hot type
          if (callbacks.triggerCombatText) {
            callbacks.triggerCombatText(hero.username, actualHeal, 'heal-hot', true);
          }
          
          callbacks.log('heal', `💚 ${hero.username} regenerates ${Math.floor(actualHeal)} HP`);
        }
      } else {
        hpRegenBuff.lastTick = now; // Update tick even if no healing
      }
    }
  });
}
```

### 1.2 Integrate HP Regen into Combat Loop
**File:** `src/utils/combatEngine.ts`  
**Status:** ⚠️ MISSING

**Implementation:**
- Import `processHpRegeneration` from `buffsDebuffs.ts`
- Call `processHpRegeneration()` in Phase 1 (after `processDebuffs`)
- Ensure it runs every 2 seconds during combat

**Code Location:**
```typescript
// In resolveCombat function, after processDebuffs:
processDebuffs(...);
processHpRegeneration(state.heroes, now, callbacks); // ADD THIS
updateHeroBuffDurations(state.heroes, now);
```

### 1.3 Integrate HP Regen into DoT/HoT Tick Interval
**File:** `src/utils/fullCombatEngine.ts`  
**Status:** ⚠️ MISSING

**Implementation:**
- Update `processDebuffsDuringCombat()` to also call `processHpRegeneration()`
- Ensure HP regen ticks every 2 seconds alongside DoTs/HoTs

**Code Location:**
```typescript
// In processDebuffsDuringCombat method:
private processDebuffsDuringCombat(now: number) {
  // ... existing processDebuffs call ...
  processDebuffs(...);
  
  // ADD THIS:
  processHpRegeneration(
    this.state.heroes,
    now,
    {
      log: (type: string, message: string) => this.log(type, message),
      triggerCombatText: (entityId: string, amount: number, type: 'damage' | 'crit' | 'heal' | 'heal-hot' | 'dot', isHero: boolean) =>
        this.triggerCombatText(entityId, amount, type, isHero)
    }
  );
}
```

### 1.4 Add HP Regen to Hero Interface
**File:** `src/utils/fullCombatEngine.ts` or `src/utils/combat/types.ts`  
**Status:** ✅ Already exists (hpRegen in stats)

**Verification:**
- Confirm `Hero` interface has `hpRegen` in stats
- Confirm `activeBuffs.hpRegen` structure matches implementation

---

## Phase 2: Visual Buff/Debuff Indicators (P1 - High)

### 2.1 Verify Current Buff/Debuff Display
**File:** `src/utils/updateBuffDebuffDisplay.ts`  
**Status:** ✅ IMPLEMENTED - Needs verification/testing

**Current Implementation:**
- `updateHeroBuffDisplay()` - Updates hero buff icons
- `updateHeroDebuffDisplay()` - Updates hero debuff icons
- `updateEnemyDebuffDisplay()` - Updates enemy debuff icons
- Called every 500ms from `BrowserSourcePage.tsx`
- Uses `.battle-buffs` and `.battle-debuffs` DOM elements

**Tasks:**
1. ✅ Verify buff/debuff display functions exist
2. ⚠️ Test in browser to confirm visual display works
3. ⚠️ Verify icons appear above/below sprites correctly
4. ⚠️ Verify icons update when buffs/debuffs change
5. ⚠️ Verify tooltips show buff/debuff names

**If Issues Found:**
- Fix positioning if icons overlap with health bars
- Ensure icons update reactively
- Add missing buff/debuff icons
- Improve styling if needed

### 2.2 Test Buff/Debuff Display
**File:** `src/pages/BrowserSourcePage.tsx`  
**Status:** ✅ INTEGRATED - Needs testing

**Verification Steps:**
1. Apply buff to hero (e.g., Battle Hymn from Bard)
2. Apply debuff to hero (e.g., Poison from enemy)
3. Verify icons appear in `.battle-buffs` and `.battle-debuffs` elements
4. Verify icons update when buffs/debuffs expire
5. Test with multiple buffs/debuffs simultaneously

---

## Phase 3: Visual Shield Indicator (P1 - High)

### 3.1 Verify Current Shield Display
**File:** `src/pages/BrowserSourcePage.tsx`  
**Status:** ⚠️ NEEDS VERIFICATION

**Tasks:**
1. Check if shields show visual indicator (blue bar, glow, etc.)
2. Verify if shield amount is displayed
3. Test shield visual when hero has shield

**If Missing, Implement:**
- Add shield bar/indicator above health bar
- Show shield amount visually
- Update shield indicator when shield changes
- Style appropriately (blue/purple for shields)

### 3.2 Shield Display Component
**File:** `src/components/ShieldDisplay.tsx` (NEW) or integrate into existing health bar  
**Status:** ⚠️ MAY BE MISSING

**Implementation:**
- Create shield indicator that:
  - Shows above health bar
  - Displays shield amount as blue/purple bar
  - Updates when `hero.shield` changes
  - Hides when shield is 0 or expired

**Code Structure:**
```typescript
interface ShieldDisplayProps {
  hero: Hero;
}

export function ShieldDisplay({ hero }: ShieldDisplayProps) {
  if (!hero.shield || hero.shield.amount <= 0) return null;
  
  const shieldPercent = (hero.shield.amount / hero.maxHp) * 100;
  
  return (
    <div className="shield-bar" style={{
      position: 'absolute',
      top: '-12px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '96px',
      height: '4px',
      backgroundColor: 'rgba(100, 150, 255, 0.3)',
      borderRadius: '2px',
      overflow: 'hidden'
    }}>
      <div style={{
        width: `${Math.min(shieldPercent, 100)}%`,
        height: '100%',
        backgroundColor: '#6495ed',
        transition: 'width 0.3s ease'
      }} />
    </div>
  );
}
```

### 3.3 Integrate Shield Display into Battlefield
**File:** `src/pages/BrowserSourcePage.tsx`  
**Status:** ⚠️ NEEDS VERIFICATION

**Implementation:**
- Add `ShieldDisplay` component to hero rendering
- Position above health bar
- Ensure it updates when shield changes

---

## Phase 4: Testing & Verification (P0 - Critical)

### 4.1 Test HP Regeneration
**Tasks:**
1. Equip hero with `regeneration_armor` enchantment
2. Enter combat
3. Verify HP regen ticks every 2 seconds
4. Verify SCT shows `+X` with `heal-hot` styling
5. Verify HP increases (capped at maxHp)
6. Verify HP regen stops when hero dies

### 4.2 Test Buff/Debuff Display
**Tasks:**
1. Apply buff to hero (e.g., Battle Hymn)
2. Apply debuff to hero (e.g., Poison)
3. Verify icons appear above sprite
4. Verify icons update when buffs/debuffs expire
5. Verify tooltips show buff/debuff names

### 4.3 Test Shield Display
**Tasks:**
1. Create shield on hero (overheal or ability)
2. Verify shield bar appears above health bar
3. Verify shield bar updates when shield changes
4. Verify shield bar disappears when shield expires

### 4.4 Integration Testing
**Tasks:**
1. Test all features together in combat
2. Verify no performance issues
3. Verify no visual glitches
4. Verify combat text positioning works with new elements
5. Test with multiple heroes/enemies

---

## Implementation Order

### Week 1: HP Regeneration (P0)
1. Day 1-2: Implement `processHpRegeneration()` function
2. Day 3: Integrate into combat loop
3. Day 4: Integrate into DoT/HoT tick interval
4. Day 5: Testing and bug fixes

### Week 2: Visual Indicators (P1)
1. Day 1: Test buff/debuff display (already implemented)
2. Day 2: Verify/implement shield display
3. Day 3: Integration and positioning fixes
4. Day 4-5: Testing and polish

### Week 3: Testing & Polish (P0)
1. Day 1-2: Comprehensive testing
2. Day 3: Bug fixes
3. Day 4: Performance optimization
4. Day 5: Documentation and final review

---

## Files to Create/Modify

### New Files
- `src/utils/combat/hpRegeneration.ts` (optional - if we want to separate HP regen logic)
- `src/components/BuffDebuffDisplay.tsx` (if missing)
- `src/components/ShieldDisplay.tsx` (if missing)

### Files to Modify
- `src/utils/combat/buffsDebuffs.ts` - Add `processHpRegeneration()` function
- `src/utils/combatEngine.ts` - Call `processHpRegeneration()` in combat loop
- `src/utils/fullCombatEngine.ts` - Call `processHpRegeneration()` in tick interval
- `src/pages/BrowserSourcePage.tsx` - Add shield display component
- `src/utils/updateBuffDebuffDisplay.ts` - Test/verify buff/debuff display (already implemented)

---

## Success Criteria

### HP Regeneration
- [x] HP regen buff created from `regeneration_armor` enchantment
- [ ] HP regen ticks every 2 seconds during combat
- [ ] HP regen shows SCT with `heal-hot` type
- [ ] HP regen caps at maxHp
- [ ] HP regen stops when hero dies

### Visual Indicators
- [x] Buff/debuff display functions exist ✅
- [ ] Buff icons appear above hero sprites (NEEDS TESTING)
- [ ] Debuff icons appear above hero/enemy sprites (NEEDS TESTING)
- [ ] Icons update when buffs/debuffs change (NEEDS TESTING)
- [ ] Tooltips show buff/debuff names (NEEDS TESTING)
- [ ] Shield bar appears above health bar (NEEDS IMPLEMENTATION)
- [ ] Shield bar updates when shield changes (NEEDS IMPLEMENTATION)

### Integration
- [ ] All features work together without conflicts
- [ ] No performance degradation
- [ ] Visual elements don't overlap or clip
- [ ] Combat text positioning works correctly

---

## Notes

- HP regen should tick at the same rate as DoTs (2 seconds) for consistency
- Visual indicators should be positioned to not overlap with health bars or combat text
- Shield display should be subtle but visible
- Buff/debuff icons should be small but readable
- All visual elements should update reactively when state changes

---

## Risk Assessment

### Low Risk
- HP regen implementation (straightforward logic)
- Shield display (simple visual component)

### Medium Risk
- Buff/debuff display (may need to handle many icons)
- Integration with existing UI (positioning conflicts)

### Mitigation
- Test incrementally (one feature at a time)
- Use React state for reactive updates
- Position elements carefully to avoid overlaps
- Test with many buffs/debuffs to ensure performance
