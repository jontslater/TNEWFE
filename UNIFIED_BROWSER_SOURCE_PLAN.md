# Unified Browser Source - Development Plan

## Current Status ✅

### ✅ Phase 1: Foundation (COMPLETE)
- [x] Created `UnifiedBrowserSource.tsx` component
- [x] Basic structure with mode system (`idle`, `dungeon`, `raid`)
- [x] Firebase integration for hero/enemy data
- [x] Combat engine initialization
- [x] Automatic adventure loop
- [x] Automatic combat start

## Next Steps 🚧

### Phase 2: Idle Adventure Mode (Foundation)
- [ ] Add hero sprite rendering
- [ ] Add enemy sprite rendering
- [ ] Add HP bars and overhead UI
- [ ] Add buff/debuff displays
- [ ] Add scrolling combat text
- [ ] Add sprite positioning/layout

### Phase 3: Mode Transition System
- [ ] Create mode transition state machine
- [ ] Add transition animations/fade effects
- [ ] Implement idle → dungeon transition
- [ ] Implement dungeon → raid transition
- [ ] Implement raid → idle transition

### Phase 4: Dungeon Mode
- [ ] Dungeon encounter structure
- [ ] Room progression system
- [ ] Dungeon-specific UI
- [ ] Boss encounters

### Phase 5: Raid Mode
- [ ] Raid instance structure
- [ ] Multi-phase encounters
- [ ] Raid-specific UI
- [ ] Phase transitions

## Architecture

```
UnifiedBrowserSource
├── GameMode: 'idle' | 'dungeon' | 'raid'
├── Combat Engine: FullCombatEngine
├── State Management:
│   ├── Heroes (from Firebase)
│   ├── Enemies (from Firebase/Combat Engine)
│   └── Local Combat State (HP, buffs, debuffs)
└── Mode Handlers:
    ├── IdleMode (current)
    ├── DungeonMode (future)
    └── RaidMode (future)
```

## Key Principles

1. **Automatic Everything** - No UI controls, everything starts automatically
2. **Smooth Transitions** - Visual effects between mode changes
3. **Clean State** - Simple, predictable state management
4. **Modular Design** - Easy to add new modes

## File Structure

```
src/pages/
├── UnifiedBrowserSource.tsx (main component)
├── modes/
│   ├── IdleMode.tsx (idle adventure mode)
│   ├── DungeonMode.tsx (dungeon mode)
│   └── RaidMode.tsx (raid mode)
└── transitions/
    ├── ModeTransition.tsx (transition effects)
    └── TransitionManager.ts (transition logic)
```

## Getting Started

1. The unified browser source is ready to use
2. Add routing in `App.tsx`:
   ```tsx
   <Route path="/unified-browser-source" element={<UnifiedBrowserSource />} />
   ```
3. Start building out idle mode features
4. Add mode transitions when ready


