# Restore EVERYTHING from f03c505 (End of Day State)

## Strategy: Restore All Modified Files

From the diff, these files were modified between f03c505 and HEAD:

### Source Code Files:
1. src/App.tsx
2. src/api/client.ts
3. src/components/GuildPanel.tsx
4. src/components/HeroDashboard.tsx
5. src/hooks/useActiveInstanceListener.ts
6. src/index.css
7. src/pages/AnimationTestPage.tsx
8. src/pages/GuildPage.tsx
9. src/pages/GuildRaidSignupPage.tsx
10. src/pages/PlayerPortal.tsx
11. src/utils/adventureEngine.ts
12. src/utils/economySystem.ts
13. src/utils/enemySpawning.ts
14. src/utils/equipmentBonuses.ts
15. src/utils/fullCombatEngine.ts
16. src/utils/raidSystem.ts
17. src/utils/setBonuses.ts
18. src/utils/skillSystem.ts

### Already Restored:
- ✅ src/pages/CleanBattlefieldSource.tsx
- ✅ src/components/AchievementsPanel.tsx
- ✅ src/components/GuildRaidsPanel.tsx
- ✅ src/pages/InteractiveRaidViewer.tsx

## Commands to Restore Everything:

### Option 1: Restore All Modified Files at Once

```powershell
git checkout f03c505 -- src/App.tsx src/api/client.ts src/components/GuildPanel.tsx src/components/HeroDashboard.tsx src/hooks/useActiveInstanceListener.ts src/index.css src/pages/AnimationTestPage.tsx src/pages/GuildPage.tsx src/pages/GuildRaidSignupPage.tsx src/pages/PlayerPortal.tsx src/utils/adventureEngine.ts src/utils/economySystem.ts src/utils/enemySpawning.ts src/utils/equipmentBonuses.ts src/utils/fullCombatEngine.ts src/utils/raidSystem.ts src/utils/setBonuses.ts src/utils/skillSystem.ts
```

### Option 2: Restore All Source Files in Each Directory

```powershell
git checkout f03c505 -- src/App.tsx
git checkout f03c505 -- src/api/client.ts
git checkout f03c505 -- src/components/GuildPanel.tsx
git checkout f03c505 -- src/components/HeroDashboard.tsx
git checkout f03c505 -- src/hooks/useActiveInstanceListener.ts
git checkout f03c505 -- src/index.css
git checkout f03c505 -- src/pages/AnimationTestPage.tsx
git checkout f03c505 -- src/pages/GuildPage.tsx
git checkout f03c505 -- src/pages/GuildRaidSignupPage.tsx
git checkout f03c505 -- src/pages/PlayerPortal.tsx
git checkout f03c505 -- src/utils/adventureEngine.ts
git checkout f03c505 -- src/utils/economySystem.ts
git checkout f03c505 -- src/utils/enemySpawning.ts
git checkout f03c505 -- src/utils/equipmentBonuses.ts
git checkout f03c505 -- src/utils/fullCombatEngine.ts
git checkout f03c505 -- src/utils/raidSystem.ts
git checkout f03c505 -- src/utils/setBonuses.ts
git checkout f03c505 -- src/utils/skillSystem.ts
```

---

**Let's restore all of them!**

