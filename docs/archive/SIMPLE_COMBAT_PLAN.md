# Simple Combat System - Step-by-Step Build Plan

## ✅ Phase 1: Foundation (DONE)
- ✅ Basic types (SimpleHero, SimpleEnemy, SimpleCombatState)
- ✅ Simple combat engine class
- ✅ Basic attack/damage calculation
- ✅ Death detection
- ✅ Animation callbacks
- ✅ Combat text callbacks

## 📋 Phase 2: Core Combat Loop (Next)
- [ ] Turn order/initiative system
- [ ] Hero ability system (basic)
- [ ] Enemy targeting logic
- [ ] Health bar updates

## 📋 Phase 3: Polish
- [ ] Healing abilities
- [ ] Buffs/debuffs (simplified)
- [ ] Victory/defeat handling
- [ ] Rewards/XP

## 📋 Phase 4: Advanced Features
- [ ] Wave progression
- [ ] Special abilities
- [ ] Boss mechanics

## Current Structure

```
simpleCombatEngine.ts
├── Types (SimpleHero, SimpleEnemy, SimpleCombatState)
├── SimpleCombatEngine class
│   ├── Basic attack logic
│   ├── Death detection
│   ├── Combat loop
│   └── Animation/combat text callbacks
```

## How to Use

```typescript
// Create engine
const engine = new SimpleCombatEngine({
  heroes: [...],
  enemies: [...],
  inCombat: false,
  round: 0
});

// Set up callbacks
engine.onAnimation((entityId, animation, isHero) => {
  // Handle animation
});

engine.onCombatText((entityId, amount, type, isHero) => {
  // Handle combat text
});

// Start combat
engine.startCombat();

// Stop combat
engine.stopCombat();
```

## Next Steps

1. Test the basic combat loop works
2. Add turn order/initiative
3. Add hero abilities
4. Integrate into UnifiedBrowserSource
5. Build features incrementally


