# Unified Browser Source

A clean, fresh browser source designed for smooth transitions between game modes.

## Current State

✅ **Idle Adventure Mode** - Fully functional
- Automatically starts when heroes are loaded
- Adventure loop runs continuously
- Combat starts automatically when enemies appear
- Smooth combat continuation

🚧 **Coming Soon**
- Dungeon Mode
- Raid Mode
- Mode Transitions

## Architecture

### Game Modes
- `idle` - Default adventure mode with continuous combat waves
- `dungeon` - Structured dungeon encounters (to be implemented)
- `raid` - Multi-phase raid encounters (to be implemented)

### Key Features
1. **Automatic Combat** - No UI controls, combat starts immediately
2. **Clean State Management** - Simple, predictable state flow
3. **Mode Transitions** - Structured for smooth transitions between modes
4. **Real-time Updates** - Uses Firebase and WebSocket for live data

## Usage

The component automatically:
1. Loads heroes from Firebase battlefield state
2. Initializes combat engine when heroes are available
3. Starts adventure loop immediately
4. Begins combat when enemies spawn
5. Continues combat automatically after each wave

No manual intervention needed - everything runs automatically!

## Next Steps

1. Add dungeon mode structure
2. Add raid mode structure
3. Implement mode transition logic
4. Add visual transition effects

