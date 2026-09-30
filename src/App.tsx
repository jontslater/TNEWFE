import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';

// Critical routes - loaded immediately (landing, auth)
import LandingPage from './pages/LandingPage';
import AuthCallback from './pages/AuthCallback';

// All other routes - lazy loaded for code splitting
const PlayerPortal = lazy(() => import('./pages/PlayerPortal'));
const ClassesPage = lazy(() => import('./pages/ClassesPage'));
const ProfessionsPage = lazy(() => import('./pages/ProfessionsPage'));
const RaidsInfoPage = lazy(() => import('./pages/RaidsInfoPage'));
const StorePage = lazy(() => import('./pages/StorePage'));
const QuestsPage = lazy(() => import('./pages/QuestsPage'));
const CreateHeroPage = lazy(() => import('./pages/CreateHeroPage'));
const CombatDemo = lazy(() => import('./pages/CombatDemo'));
const SkillsPage = lazy(() => import('./pages/SkillsPage'));
const AuctionHousePage = lazy(() => import('./pages/AuctionHousePage'));
const BrowserSourcePage = lazy(() => import('./pages/BrowserSourcePage'));
const BrowserSourceConfigPage = lazy(() => import('./pages/BrowserSourceConfigPage'));
const CleanBattlefieldSource = lazy(() => import('./pages/CleanBattlefieldSource'));
const EnemyDebugPage = lazy(() => import('./pages/EnemyDebugPage'));
const EnemyAnimationTestPage = lazy(() => import('./pages/EnemyAnimationTestPage'));
const AnimationTestPage = lazy(() => import('./pages/AnimationTestPage'));
const DragonAnimationTest = lazy(() => import('./pages/DragonAnimationTest'));
const AchievementsPage = lazy(() => import('./pages/AchievementsPage'));
const LeaderboardsPage = lazy(() => import('./pages/LeaderboardsPage'));
const GuildManagementPage = lazy(() => import('./pages/GuildManagementPage'));
const DungeonFinderPage = lazy(() => import('./pages/DungeonFinderPage'));
const EnchantingPage = lazy(() => import('./pages/EnchantingPage'));
const GuildRaidSignupPage = lazy(() => import('./pages/GuildRaidSignupPage'));
const InteractiveRaidViewer = lazy(() => import('./pages/InteractiveRaidViewer'));
const InstanceViewerPage = lazy(() => import('./pages/InstanceViewerPage'));
const RaidBrowserSourcePage = lazy(() => import('./pages/RaidBrowserSourcePage'));
const UnifiedBrowserSource = lazy(() => import('./pages/UnifiedBrowserSource'));
const FoundersPackPage = lazy(() => import('./pages/FoundersPackPage'));
const FoundersHallPage = lazy(() => import('./pages/FoundersHallPage'));
const MailPage = lazy(() => import('./pages/MailPage'));
const ReportIssuePage = lazy(() => import('./pages/ReportIssuePage'));
const ReportsViewPage = lazy(() => import('./pages/ReportsViewPage'));
const PurchaseSuccessPage = lazy(() => import('./pages/PurchaseSuccessPage'));
const PurchaseCancelPage = lazy(() => import('./pages/PurchaseCancelPage'));
const PurchaseHistoryPage = lazy(() => import('./pages/PurchaseHistoryPage'));
const FAQPage = lazy(() => import('./pages/FAQPage'));

// Loading component for Suspense
function PageLoader() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#1a1a2e',
      color: '#ffffff',
      fontSize: '1.5rem',
    }}>
      Loading...
    </div>
  );
}

function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/portal" element={<PlayerPortal />} />
        <Route path="/classes" element={<ClassesPage />} />
        <Route path="/professions" element={<ProfessionsPage />} />
        <Route path="/raids" element={<RaidsInfoPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/store" element={<StorePage />} />
        <Route path="/quests" element={<QuestsPage />} />
        <Route path="/create-hero" element={<CreateHeroPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/tiktok/callback" element={<AuthCallback />} />
        <Route path="/combat-demo" element={<CombatDemo />} />
        <Route path="/skills" element={<SkillsPage />} />
        <Route path="/auction" element={<AuctionHousePage />} />
        <Route path="/browser-source" element={<BrowserSourcePage />} />
        <Route path="/browser-source-unified" element={<UnifiedBrowserSource />} />
        <Route path="/clean-battlefield" element={<CleanBattlefieldSource />} />
        <Route path="/unified" element={<UnifiedBrowserSource />} />
        <Route path="/browser-source/debug-view" element={<BrowserSourcePage />} />
        <Route path="/browser-source/config" element={<BrowserSourceConfigPage />} />
        <Route path="/browser-source/debug" element={<EnemyDebugPage />} />
        <Route path="/enemy-animation-test" element={<EnemyAnimationTestPage />} />
        <Route path="/animation-test" element={<AnimationTestPage />} />
        <Route path="/dragon-test" element={<DragonAnimationTest />} />
        <Route path="/achievements" element={<AchievementsPage />} />
        <Route path="/leaderboards" element={<LeaderboardsPage />} />
        <Route path="/guild" element={<GuildManagementPage />} />
        <Route path="/dungeon-finder" element={<DungeonFinderPage />} />
        <Route path="/enchanting" element={<EnchantingPage />} />
        <Route path="/raids/guild-signup/:raidId" element={<GuildRaidSignupPage />} />
        <Route path="/raid-viewer/:instanceId" element={<InteractiveRaidViewer />} />
        <Route path="/instance/view" element={<InstanceViewerPage />} />
        <Route path="/browser-source/raid/:instanceId" element={<RaidBrowserSourcePage />} />
        <Route path="/founders-pack" element={<FoundersPackPage />} />
        <Route path="/founders-hall" element={<FoundersHallPage />} />
        <Route path="/mail" element={<MailPage />} />
        <Route path="/report-issue" element={<ReportIssuePage />} />
        <Route path="/reports" element={<ReportsViewPage />} />
        <Route path="/purchases/success" element={<PurchaseSuccessPage />} />
        <Route path="/purchases/cancel" element={<PurchaseCancelPage />} />
        <Route path="/purchases/history" element={<PurchaseHistoryPage />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
