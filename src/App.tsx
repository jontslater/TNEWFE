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
      </Routes>
    </Router>
  );
}

export default App;
