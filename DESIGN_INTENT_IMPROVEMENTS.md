# Design Intent Improvements

This document tracks the UI/UX improvements made to align with the owner's design vision for "Idle World of Warcraft on Twitch."

## Core Game Concept

The game is an auto-battler where players join ONE stream at a time. Joining a new stream removes them from any previous stream. Chat activity boosts group stats, and rare loot drops should feel special.

## Implemented Improvements

### 1. Stream Status & Switching (`StreamStatusBanner.tsx`)

**Problem**: Players weren't clear about which stream they were active on, or that joining a new stream removes them from the previous one.

**Solution**:
- Clear banner showing current stream (e.g., "Currently Active On: streamer_name's Stream")
- Prominent transition notification when switching streams with warning that they've been removed from previous stream
- Graceful handling when not active on any stream

**Usage**: Add to PlayerPortal and any relevant dashboards:
```tsx
<StreamStatusBanner 
  currentBattlefieldId={hero?.currentBattlefieldId}
  heroName={hero?.name}
  onStreamChange={(newStreamId) => {
    // Optional: handle stream change notifications
  }}
/>
```

### 2. Group & Chat Activity Display (`GroupBoostIndicator.tsx`)

**Problem**: Chat activity boosts weren't visible to players. The connection between chat engagement and group power wasn't clear.

**Solution**:
- Visual indicator for chat activity level (Quiet → Moderate → Active → Very Active)
- Clear display of active chat boosts (Attack %, Defense %, Healing %)
- Group size display
- Enemy strength indicator relative to group power
- Color-coded danger levels

**Usage**: Add to portal dashboard and overlay:
```tsx
<GroupBoostIndicator 
  chatActivityLevel={75} // 0-100
  activeBoosts={{ attack: 10, defense: 5, healing: 15 }}
  groupSize={12}
  enemyStrength={120} // 100 = balanced, >100 = dangerous
/>
```

### 3. Rarity Visual System (`rarityDisplay.ts`)

**Problem**: High-end loot is meant to be rare, but rarity wasn't communicated clearly enough. Rare drops didn't feel special.

**Solution**:
- Consistent color scheme and visual treatment for all rarities:
  - Common: Gray ⚪
  - Uncommon: Green 🟢
  - Rare: Blue 🔵
  - Epic: Purple 🟣
  - Legendary: Gold 🟡
  - Mythic: Red 🔴
- Glow effects for higher rarities
- Special loot drop announcements in overlay for Rare+ items
- Utility functions for consistent styling across components

**API**:
```typescript
import { getRarityStyle, getRarityClasses, createLootDropAnnouncement } from '../utils/rarityDisplay';

// Get full style object
const style = getRarityStyle('legendary');
// { color, bgColor, borderColor, glowColor, label, emoji }

// Get Tailwind classes
const classes = getRarityClasses('epic');
// 'text-purple-400 border-purple-600 bg-purple-900/30'

// Create overlay announcement (returns HTML for rare+ only)
const announcement = createLootDropAnnouncement('Sword of Doom', 'legendary', 'HeroName');
```

## Integration Points

### Backend Requirements

The following backend changes would enhance these features:

1. **Chat Activity Tracking**: Backend should track chat message frequency per stream and expose as a metric
2. **Dynamic Boost Calculation**: Server-side calculation of chat activity → stat boost multipliers
3. **Loot Drop Events**: Emit events when rare+ loot drops for overlay announcement system
4. **Stream Membership**: Enforce one-stream-at-a-time rule server-side when heroes join battles

### Overlay Integration

To add to `CleanBattlefieldSource.tsx`:

```typescript
// Add to state
const [chatActivityLevel, setChatActivityLevel] = useState(0);
const [groupBoosts, setGroupBoosts] = useState({});

// Listen for chat activity metrics from backend
// (Implementation depends on backend API)

// Display in overlay
<GroupBoostIndicator 
  chatActivityLevel={chatActivityLevel}
  activeBoosts={groupBoosts}
  groupSize={heroes.length}
  enemyStrength={calculateEnemyStrength(enemies, heroes)}
/>

// Show rare drop announcements
// When loot drops:
if (rarity === 'rare' || rarity === 'epic' || rarity === 'legendary' || rarity === 'mythic') {
  const announcement = createLootDropAnnouncement(item.name, rarity, hero.name);
  // Display announcement in overlay (see addSCT function pattern)
}
```

## Future Extensions: Twitch Bits & Subs

The rarity system includes a hook point for future Twitch benefits:

```typescript
function applyBenefitRarityBoost(
  baseRarity: ItemRarity,
  userBenefits?: {
    subscriberTier?: number; // 0 = none, 1 = Prime/T1, 2 = T2, 3 = T3
    bitsCheered?: number;
    founderTier?: string;
  }
): ItemRarity
```

**Planned Benefits** (not yet implemented):
- **Subscribers**: Small chance to upgrade loot rarity (e.g., T3 subs: 5% rare → epic)
- **Bits Milestones**: Bonus loot rolls at certain thresholds (100, 500, 1000, 5000 bits)
- **Founder Tiers**: Permanent slight rarity boost multiplier

**Integration When Ready**:
1. Backend tracks Twitch subscription status and bits cheered
2. Pass user benefits object to `applyBenefitRarityBoost()` in loot generation
3. Display subscriber benefits in UI (crown icons, special badges)
4. Add "Sub Benefits" section to store/FAQ

**Code Changes Needed**:
- Update backend to query Twitch API for sub/bits status
- Store subscriber tier in hero/user document
- Pass benefits object through loot generation pipeline
- Add UI elements to show active benefits

## Testing Checklist

- [ ] Stream banner shows correct stream name
- [ ] Transition notification appears when switching streams
- [ ] Group boost indicator updates in real-time
- [ ] Chat activity level reflects actual chat engagement
- [ ] Rare+ loot drops show special announcements
- [ ] Rarity colors are consistent across all tooltips
- [ ] Overlay displays group boost indicator
- [ ] Stream changes are handled gracefully (no errors)

## Notes

- These components are presentation-only and don't implement backend logic
- Backend must enforce one-stream-per-hero rule
- Chat activity metrics need to be exposed via API or Firestore
- Loot rarity should be determined server-side (client shows results)
- Bits/subs integration requires Twitch OAuth scopes and EventSub webhooks
