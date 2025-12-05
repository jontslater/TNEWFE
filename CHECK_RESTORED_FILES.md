# Check if Files Are Actually Restored

## Step 1: Check if files exist

Run this to see if files are there:

```powershell
dir src\components\AchievementsPanel.tsx
dir src\components\GuildRaidsPanel.tsx
dir src\pages\InteractiveRaidViewer.tsx
```

## Step 2: Check file sizes (should NOT be 0)

```powershell
Get-Item src\components\AchievementsPanel.tsx | Select-Object Name, Length
Get-Item src\components\GuildRaidsPanel.tsx | Select-Object Name, Length
Get-Item src\pages\InteractiveRaidViewer.tsx | Select-Object Name, Length
```

They should have Length > 0. If any are 0 bytes, they're empty.

## Step 3: Check what git thinks

```powershell
git status --short | findstr /i "Achievement\|GuildRaid\|InteractiveRaid"
```

## Step 4: See if they're in the commit

```powershell
git ls-tree HEAD --name-only | findstr /i "Achievement\|GuildRaid\|InteractiveRaid"
```

If they DON'T show up, they're not tracked by git yet (which is fine if you just restored them).

## Step 5: Compare with the commit where they existed

```powershell
git show 4155d1a:src/components/AchievementsPanel.tsx | Select-Object -First 5
```

This should show the first 5 lines from that commit. If it errors, the file wasn't in that commit.

---

**Run Step 1 first and tell me what you see!**
