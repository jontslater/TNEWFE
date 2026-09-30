# Restore Files from Commit 4155d1a

## The Situation:
- Files exist but are untracked
- Commit `c0b3136` deleted them
- Commit `4155d1a` has them with full content
- We need to restore from `4155d1a`

## Commands to Run (One at a time):

### Step 1: Restore AchievementsPanel.tsx

```powershell
git checkout 4155d1a -- src/components/AchievementsPanel.tsx
```

### Step 2: Restore GuildRaidsPanel.tsx

```powershell
git checkout 4155d1a -- src/components/GuildRaidsPanel.tsx
```

### Step 3: Restore InteractiveRaidViewer.tsx

```powershell
git checkout 4155d1a -- src/pages/InteractiveRaidViewer.tsx
```

### Step 4: Verify they're now tracked

```powershell
git status
```

You should see them as "Changes to be committed" (staged for commit).

### Step 5: Check file sizes (make sure they're not empty)

```powershell
(Get-Item src\components\AchievementsPanel.tsx).Length
(Get-Item src\components\GuildRaidsPanel.tsx).Length
(Get-Item src\pages\InteractiveRaidViewer.tsx).Length
```

All should show numbers > 0 (file sizes in bytes).

---

**Run Step 1 first and tell me what happens!**

