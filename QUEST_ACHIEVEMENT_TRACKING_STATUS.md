# Quest & Achievement Tracking Status in CleanBattlefieldSource

## ✅ Quest Tracking - IMPLEMENTED

### What's Being Tracked:

1. **Damage Dealt** (`dealDamage`)
   - Tracked every time a hero attacks and deals damage
   - Location: Line 2705

2. **Healing Done** (`healAmount`)
   - Tracked every time a healer heals a target
   - Location: Line 2421

3. **Enemy Kills** (`kill`)
   - Tracked when heroes defeat enemies
   - Location: Line 2849

4. **Boss Kills** (`defeatBosses`)
   - Tracked separately when bosses are defeated
   - Location: Line 2853

5. **Wave Completion** (`completeWaves`)
   - Tracked when waves are completed
   - Location: Line 3796

### How It Works:

1. **Local Accumulation**
   - Quest progress is stored locally in `questProgressRef`
   - Accumulates counts for each hero and tracking key
   - Prevents excessive API calls

2. **Batch Sync to Backend**
   - Synced every 60 seconds (or when interval triggers)
   - Sends updates for all heroes in batch to `/api/quests/update-batch-all`
   - Backend filters by active quests (daily/weekly/monthly)

3. **Quest Completion Notifications**
   - When backend returns completed quests, shows SCT message
   - Displays "Quest Complete!" above hero sprite
   - Location: Lines 4254-4270

## ⚠️ Achievement Tracking - BACKEND HANDLED

Achievements are **not explicitly tracked** in CleanBattlefieldSource because:

1. **Achievements are unlocked server-side** when:
   - Quest progress reaches thresholds
   - Stats reach milestone values
   - Backend checks achievement conditions on progress updates

2. **Quest progress sync triggers achievement checks**:
   - When quest progress is synced to backend, the backend can check for achievement unlocks
   - Achievements are typically milestone-based (e.g., "Kill 1000 enemies", "Deal 100k damage")

3. **Achievement status is loaded from Firebase**:
   - Hero's achievement progress is loaded when hero data is fetched
   - Displayed in AchievementsPanel component

## 📝 Notes:

- Quest tracking keys match backend expectations:
  - `dealDamage` - cumulative damage dealt
  - `healAmount` - cumulative healing done
  - `kill` - enemy kill count
  - `defeatBosses` - boss kill count
  - `completeWaves` - wave completion count

- All tracking uses hero document ID (`hero.id`), not Twitch user ID
- Progress is synced for all three quest types (daily/weekly/monthly) simultaneously
- Backend filters by which quest types are actually active

## 🎯 Summary:

✅ **Quests**: Fully tracked from CleanBattlefieldSource  
⚠️ **Achievements**: Handled by backend when quest/stats reach thresholds (no explicit tracking needed in frontend)
