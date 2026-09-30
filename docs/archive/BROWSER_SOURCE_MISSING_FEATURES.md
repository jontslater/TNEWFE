# Unified Browser Source - Missing Features

Based on `COMPLETE_FEATURE_INVENTORY.md` and comparison with other browser source pages.

## ✅ Already Implemented
- Core combat loop
- DoT/HoT processing
- Hero/enemy damage and death
- Wave progression
- Loot drops
- Auto-shop
- Gathering (herbalism/mining) - backend logic exists
- Skills system - data exists, needs UI
- Difficulty tracking - data exists, needs better UI
- Viewer count - data exists, needs display

## ❌ Missing Features

### High Priority (Visible UI Elements)
1. **Quest Progress Tracking Integration**
   - Track kills, damage, healing, blocking during combat
   - Display quest progress in UI
   - Show quest completion notifications

2. **Wave Counter Display**
   - Show current wave number prominently
   - Boss wave indicator
   - Auto-rest wave indicator

3. **Difficulty Indicator**
   - Color-coded difficulty percentage
   - Visual indicator of current difficulty

4. **Viewer Benefits Display**
   - Show damage/healing/defense bonuses from viewers
   - Display viewer count impact

5. **Level-Up Handling in Travel XP**
   - Currently grants XP but doesn't check for level-up
   - Needs level-up processing and notification

6. **Gathering Display/Notifications**
   - Show when materials are gathered
   - Display material counts
   - Show profession level

7. **Gold/Token Balance Display**
   - Show hero gold and token balances
   - Update in real-time

8. **NPC Encounter Display**
   - Show NPC during travel/treasure events
   - Display NPC type (Alchemist, Blacksmith, Enchanter)

### Medium Priority (Information Displays)
9. **Leaderboards Display**
   - Top 3 tanks (damage blocked)
   - Top 3 healers (healing done)
   - Top 3 DPS (damage dealt)

10. **Rested XP Display**
    - Show rested XP amount
    - Display when rested XP is being consumed
    - Show 150% XP bonus indicator

11. **Skills System Display**
    - Show skill points available
    - Display allocated skills
    - Show skill bonuses

12. **Profession Display**
    - Show profession type and level
    - Display material counts
    - Show gathering status

13. **Equipment Sets Display**
    - Show set pieces equipped
    - Display active set bonuses
    - Show set completion progress

14. **Auto-Buy Status Indicator**
    - Show when heroes are auto-buying
    - Display what was purchased

### Low Priority (Nice to Have)
15. **Achievement Notifications**
    - Show when achievements are unlocked
    - Display achievement progress

16. **Combat Log Enhancements**
    - Better formatting
    - Filter options
    - Search functionality

## Implementation Order

1. **Phase 1: Core UI Elements** (Most Visible)
   - Wave counter display
   - Difficulty indicator
   - Boss/auto-rest indicators
   - Gold/token balance

2. **Phase 2: Combat Integration**
   - Quest progress tracking
   - Level-up handling in travel XP
   - Gathering notifications

3. **Phase 3: Information Displays**
   - Viewer benefits
   - Leaderboards
   - Rested XP
   - Skills/Profession/Equipment sets

4. **Phase 4: Polish**
   - NPC encounter display
   - Auto-buy status
   - Achievement notifications
