# Recovery Commands for Browser Source

## Current Situation
- ✅ 2 commits from yesterday (Dec 4) are saved locally
- ⚠️ Many uncommitted changes in working directory
- ⚠️ 3 files deleted from working directory (but exist in commits)
- ⚠️ Your changes to CleanBattlefieldSource.tsx are NOT committed yet

## Step-by-Step Recovery Commands

### 1. Check Current Status
```powershell
cd E:\IdleDnD-Web
git status
```

### 2. See What Files Were Changed
```powershell
git diff --name-status HEAD
```

### 3. See Your Uncommitted Changes to CleanBattlefieldSource.tsx
```powershell
git diff HEAD src/pages/CleanBattlefieldSource.tsx | Select-Object -First 50
```

### 4. DECISION POINT: Restore Deleted Files (Optional)
If you want to restore the 3 deleted files from the commit:
```powershell
git checkout HEAD -- src/components/AchievementsPanel.tsx src/components/GuildRaidsPanel.tsx src/pages/InteractiveRaidViewer.tsx
```

If you intentionally deleted them and want to keep them deleted, skip this step.

### 5. Save Your Current Changes (Commit Everything)
This will commit ALL your current changes including CleanBattlefieldSource.tsx:
```powershell
git add .
git commit -m "Save browser source changes from Dec 4 session"
```

### 6. Push Everything to Remote (Save to GitHub/Remote)
```powershell
git push origin main
```

This will push:
- The 2 commits from yesterday
- Your new commit with all current changes

### 7. Verify Everything is Saved
```powershell
git status
git log --oneline -5
```

## Quick Save Command (All-in-One)
If you want to save everything quickly:
```powershell
cd E:\IdleDnD-Web
git add .
git commit -m "Save browser source changes - preserve CleanBattlefieldSource work"
git push origin main
```

## Important Notes
- Your changes to CleanBattlefieldSource.tsx are safe in the working directory
- They just need to be committed
- The deleted files can be restored if needed, or kept deleted if that was intentional
- All your work will be safe once you commit and push

