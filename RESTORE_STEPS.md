# Step-by-Step Restoration Guide

## Files We Need to Restore:
1. AchievementsPanel.tsx
2. GuildRaidsPanel.tsx  
3. InteractiveRaidViewer.tsx

## STEP 1: Check Current Status

Run this to see what git thinks about these files:

```powershell
git status src/components/AchievementsPanel.tsx src/components/GuildRaidsPanel.tsx src/pages/InteractiveRaidViewer.tsx
```

## STEP 2: Check What Commit Has Them

Check which commits modified these files:

```powershell
git log --oneline --all -- src/components/AchievementsPanel.tsx
```

```powershell
git log --oneline --all -- src/components/GuildRaidsPanel.tsx
```

```powershell
git log --oneline --all -- src/pages/InteractiveRaidViewer.tsx
```

## STEP 3: Restore Each File

### Option A: Restore from commit 4155d1a (if that's where they are)

```powershell
git checkout 4155d1a -- src/components/AchievementsPanel.tsx
```

```powershell
git checkout 4155d1a -- src/components/GuildRaidsPanel.tsx
```

```powershell
git checkout 4155d1a -- src/pages/InteractiveRaidViewer.tsx
```

### Option B: Extract directly from commit (if checkout doesn't work)

```powershell
git show 4155d1a:src/components/AchievementsPanel.tsx > src\components\AchievementsPanel.tsx
```

```powershell
git show 4155d1a:src/components/GuildRaidsPanel.tsx > src\components\GuildRaidsPanel.tsx
```

```powershell
git show 4155d1a:src/pages/InteractiveRaidViewer.tsx > src\pages\InteractiveRaidViewer.tsx
```

## STEP 4: Verify Files Were Created

Check file sizes (should be > 0):

```powershell
(Get-Item src\components\AchievementsPanel.tsx).Length
(Get-Item src\components\GuildRaidsPanel.tsx).Length
(Get-Item src\pages\InteractiveRaidViewer.tsx).Length
```

## STEP 5: Check Git Status Again

```powershell
git status
```

You should see the files listed.

---

**Start with STEP 1 and tell me what output you get!**
