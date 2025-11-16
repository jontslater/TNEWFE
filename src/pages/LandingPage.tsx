import { useNavigate } from 'react-router-dom';
import { loginWithTwitch } from '../utils/twitchOAuth';
import Navigation from '../components/Navigation';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-blue-500 to-purple-500 animate-pulse"></div>
        </div>

        {/* Navigation */}
        <div className="relative z-10">
          <Navigation />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 py-20 text-center">
          <h1 className="text-7xl font-bold text-white mb-6 drop-shadow-2xl">
            The Never Ending War
          </h1>
          <p className="text-2xl text-gray-300 mb-4">
            An Idle Twitch-Integrated MMORPG
          </p>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Join the battle. Choose your class. Master your profession. 
            Raid epic bosses. All while your hero fights 24/7.
          </p>

          <div className="flex gap-4 justify-center">
            <button
              onClick={loginWithTwitch}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-xl px-12 py-4 rounded-lg font-bold transition-all transform hover:scale-105 shadow-2xl"
            >
              Start Your Journey
            </button>
            <button
              onClick={() => navigate('/classes')}
              className="bg-gray-800 hover:bg-gray-700 text-white text-xl px-12 py-4 rounded-lg font-bold transition-colors"
            >
              View Classes
            </button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-white text-center mb-12">
          Epic MMO Features
        </h2>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {/* Feature 1 */}
          <div className="bg-gray-800 rounded-lg p-8 border-2 border-purple-600 hover:border-blue-500 transition-colors">
            <div className="text-5xl mb-4">⚔️</div>
            <h3 className="text-2xl font-bold text-white mb-4">12 Unique Classes</h3>
            <p className="text-gray-400">
              From Blood Knights to Spirit Healers. Each class has unique abilities, 
              playstyles, and roles. Choose your path to glory.
            </p>
            <button
              onClick={() => navigate('/classes')}
              className="mt-4 text-purple-400 hover:text-purple-300 font-semibold"
            >
              Explore Classes →
            </button>
          </div>

          {/* Feature 2 */}
          <div className="bg-gray-800 rounded-lg p-8 border-2 border-purple-600 hover:border-blue-500 transition-colors">
            <div className="text-5xl mb-4">🔨</div>
            <h3 className="text-2xl font-bold text-white mb-4">Master Professions</h3>
            <p className="text-gray-400">
              Herbalism, Mining, and Enchanting. Gather resources, craft powerful items, 
              and dominate the economy.
            </p>
            <button
              onClick={() => navigate('/professions')}
              className="mt-4 text-purple-400 hover:text-purple-300 font-semibold"
            >
              Learn Crafting →
            </button>
          </div>

          {/* Feature 3 */}
          <div className="bg-gray-800 rounded-lg p-8 border-2 border-purple-600 hover:border-blue-500 transition-colors">
            <div className="text-5xl mb-4">🏰</div>
            <h3 className="text-2xl font-bold text-white mb-4">Epic Raids</h3>
            <p className="text-gray-400">
              Form guilds, tackle raid bosses, and compete in world boss events. 
              Coordinate with your party for legendary loot.
            </p>
            <button
              onClick={() => navigate('/raids')}
              className="mt-4 text-purple-400 hover:text-purple-300 font-semibold"
            >
              View Raids →
            </button>
          </div>
        </div>

        {/* Additional Features */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-purple-900 to-gray-900 rounded-lg p-8">
            <h3 className="text-2xl font-bold text-white mb-4">🎮 Twitch Integration</h3>
            <ul className="text-gray-300 space-y-2">
              <li>• Command your hero through Twitch chat</li>
              <li>• Purchase items with Bits</li>
              <li>• Real-time combat updates</li>
              <li>• Community-driven gameplay</li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-blue-900 to-gray-900 rounded-lg p-8">
            <h3 className="text-2xl font-bold text-white mb-4">⚡ Idle Progression</h3>
            <ul className="text-gray-300 space-y-2">
              <li>• Your hero fights 24/7 automatically</li>
              <li>• Claim idle rewards anytime</li>
              <li>• Adaptive difficulty system</li>
              <li>• Never miss progress</li>
            </ul>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-900 to-blue-900 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold text-white mb-6">
            Ready to Join the War?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Your legend awaits. Login with Twitch and start your adventure.
          </p>
          <button
            onClick={loginWithTwitch}
            className="bg-white hover:bg-gray-100 text-purple-900 text-xl px-12 py-4 rounded-lg font-bold transition-colors"
          >
            Login with Twitch
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 py-8 border-t border-gray-800">
        <div className="container mx-auto px-4 text-center text-gray-500">
          <p>© 2025 The Never Ending War. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
