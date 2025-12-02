import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import PlayerPortal from './pages/PlayerPortal';
import ClassesPage from './pages/ClassesPage';
import ProfessionsPage from './pages/ProfessionsPage';
import RaidsInfoPage from './pages/RaidsInfoPage';
import StorePage from './pages/StorePage';
import QuestsPage from './pages/QuestsPage';
import CreateHeroPage from './pages/CreateHeroPage';
import AuthCallback from './pages/AuthCallback';
import CombatDemo from './pages/CombatDemo';
import SkillsPage from './pages/SkillsPage';
import AuctionHousePage from './pages/AuctionHousePage';
import BrowserSourcePage from './pages/BrowserSourcePage';
import BrowserSourceConfigPage from './pages/BrowserSourceConfigPage';
import CleanBattlefieldSource from './pages/CleanBattlefieldSource';
import EnemyDebugPage from './pages/EnemyDebugPage';
import EnemyAnimationTestPage from './pages/EnemyAnimationTestPage';
import AnimationTestPage from './pages/AnimationTestPage';
import AchievementsPage from './pages/AchievementsPage';
import LeaderboardsPage from './pages/LeaderboardsPage';
import GuildManagementPage from './pages/GuildManagementPage';
import DungeonFinderPage from './pages/DungeonFinderPage';
import EnchantingPage from './pages/EnchantingPage';
import GuildRaidSignupPage from './pages/GuildRaidSignupPage';
import InstanceViewerPage from './pages/InstanceViewerPage';
import RaidBrowserSourcePage from './pages/RaidBrowserSourcePage';
import UnifiedBrowserSource from './pages/UnifiedBrowserSource';
// Old UnifiedBrowserSourcePage kept for reference but route now uses new component
// import UnifiedBrowserSourcePage from './pages/UnifiedBrowserSourcePage';
import LoginRewardModal from './components/LoginRewardModal';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/portal" element={<PlayerPortal />} />
        <Route path="/classes" element={<ClassesPage />} />
        <Route path="/professions" element={<ProfessionsPage />} />
        <Route path="/raids" element={<RaidsInfoPage />} />
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
        <Route path="/achievements" element={<AchievementsPage />} />
        <Route path="/leaderboards" element={<LeaderboardsPage />} />
        <Route path="/guild" element={<GuildManagementPage />} />
        <Route path="/dungeon-finder" element={<DungeonFinderPage />} />
        <Route path="/enchanting" element={<EnchantingPage />} />
        <Route path="/raids/guild-signup/:raidId" element={<GuildRaidSignupPage />} />
        <Route path="/instance/view" element={<InstanceViewerPage />} />
        <Route path="/browser-source/raid/:instanceId" element={<RaidBrowserSourcePage />} />
      </Routes>
    </Router>
  );
}

export default App;
