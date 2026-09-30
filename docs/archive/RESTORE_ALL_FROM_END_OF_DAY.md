# Complete Restoration Plan - From End of Day (f03c505)

## Files That Need Restoring:

### Deleted Files (D):
1. `src/components/AchievementsPanel.tsx`
2. `src/components/GuildRaidsPanel.tsx`  
3. `src/pages/InteractiveRaidViewer.tsx`

### Modified Files (M) - Check if your work is missing:
- `src/pages/CleanBattlefieldSource.tsx` ⚠️ **CRITICAL** - Your layout changes!
- `src/api/client.ts`
- `src/components/GuildPanel.tsx`
- `src/components/HeroDashboard.tsx`
- `src/hooks/useActiveInstanceListener.ts`
- `src/index.css`
- Many others...

## Commands to Restore Everything:

### Option A: Restore Just the 3 Deleted Files (Start Here)

```powershell
git checkout f03c505 -- src/components/AchievementsPanel.tsx
git checkout f03c505 -- src/components/GuildRaidsPanel.tsx
git checkout f03c505 -- src/pages/InteractiveRaidViewer.tsx
```

### Option B: Check CleanBattlefieldSource.tsx Differences First

```powershell
git diff f03c505 HEAD -- src/pages/CleanBattlefieldSource.tsx --stat
```

This shows: `X files changed, Y insertions(+), Z deletions(-)`

If Z (deletions) is large, your work might be missing!

### Option C: Restore CleanBattlefieldSource.tsx (If your layout is missing)

```powershell
git checkout f03c505 -- src/pages/CleanBattlefieldSource.tsx
```

This restores your end-of-day version with all your layout changes.

---

**Run Option A first, then Option B to check if CleanBattlefieldSource.tsx needs restoring!**

