import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useHero } from '../hooks/useHero';
import { useGuild } from '../hooks/useGuild';
import { raidAPI } from '../api/client';
import { Raid, WorldBoss } from '../types/Raid';
import HeroDashboard from '../components/HeroDashboard';
import ProfessionPanel from '../components/ProfessionPanel';
import GuildPanel from '../components/GuildPanel';
import RaidBrowser from '../components/RaidBrowser';
import { loginWithTwitch } from '../utils/twitchOAuth';
import logo from '../Logos/TheNeverEndingWarLogo.png';

export default function HomePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const { hero, loading: heroLoading, refetch: refetchHero } = useHero(user?.twitchId || null);
  const { guild, loading: guildLoading } = useGuild(user?.id || null);
  const [raids, setRaids] = useState<Raid[]>([]);
  const [worldBoss, setWorldBoss] = useState<WorldBoss | null>(null);
  const [activeTab, setActiveTab] = useState<'hero' | 'profession' | 'guild' | 'raids'>('hero');

  useEffect(() => {
    if (isAuthenticated) {
      loadRaids();
      loadWorldBoss();
    }
  }, [isAuthenticated]);

  const loadRaids = async () => {
    try {
      const data = await raidAPI.getRaids();
      setRaids(data);
    } catch (err) {
      console.error('Failed to load raids', err);
    }
  };

  const loadWorldBoss = async () => {
    try {
      const data = await raidAPI.getWorldBoss();
      setWorldBoss(data);
    } catch (err) {
      console.error('Failed to load world boss', err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <img 
            src={logo} 
            alt="The Never Ending War" 
            className="w-96 mx-auto mb-8"
          />
          <h1 className="text-5xl font-bold text-white mb-4">Welcome to The Never Ending War</h1>
          <p className="text-xl text-gray-400 mb-8">Your Epic RPG Adventure Awaits</p>
          <button 
            onClick={loginWithTwitch}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-4 rounded-lg text-lg transition-colors"
          >
            Login with Twitch
          </button>
        </div>
      </div>
    );
  }

  if (heroLoading || guildLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  if (!hero) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="absolute top-4 right-4">
            <button 
              onClick={logout}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
            >
              Logout
            </button>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">No Hero Found</h2>
          <p className="text-gray-400 mb-6">Join the game in the Electron app first!</p>
          <p className="text-sm text-gray-500">Use !join [class] in Twitch or TikTok chat</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">The Never Ending War - Player Portal</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-300">Welcome, {user?.twitchUsername}</span>
            <button 
              onClick={logout}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4">
          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab('hero')}
              className={`px-6 py-4 font-semibold transition-colors border-b-2 ${
                activeTab === 'hero'
                  ? 'text-blue-400 border-blue-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              Hero
            </button>
            <button
              onClick={() => setActiveTab('profession')}
              className={`px-6 py-4 font-semibold transition-colors border-b-2 ${
                activeTab === 'profession'
                  ? 'text-green-400 border-green-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              Profession
            </button>
            <button
              onClick={() => setActiveTab('guild')}
              className={`px-6 py-4 font-semibold transition-colors border-b-2 ${
                activeTab === 'guild'
                  ? 'text-purple-400 border-purple-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              Guild
            </button>
            <button
              onClick={() => setActiveTab('raids')}
              className={`px-6 py-4 font-semibold transition-colors border-b-2 ${
                activeTab === 'raids'
                  ? 'text-red-400 border-red-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              Raids
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === 'hero' && <HeroDashboard hero={hero} />}
        {activeTab === 'profession' && <ProfessionPanel hero={hero} onUpdate={refetchHero} />}
        {activeTab === 'guild' && <GuildPanel guild={guild} />}
        {activeTab === 'raids' && <RaidBrowser />}
      </main>
    </div>
  );
}
