import Navigation from '../components/Navigation';

export default function RaidsInfoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-red-900 to-gray-900">
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Epic Raids & World Bosses</h1>
          <p className="text-xl text-gray-400">
            Coordinate with your guild to tackle challenging encounters for legendary rewards
          </p>
        </div>

        {/* Raid System Overview */}
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 mb-12">
          <h2 className="text-3xl font-bold text-white mb-6">Raid System</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Daily Raids */}
            <div className="bg-gradient-to-br from-blue-900 to-gray-900 rounded-lg p-6 border-2 border-blue-600">
              <div className="text-2xl font-bold text-blue-400 mb-2">⏰ Daily Raids</div>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• Resets every 24 hours</li>
                <li>• 5-10 players recommended</li>
                <li>• 20-30 minute duration</li>
                <li>• Good for farming gear and gold</li>
                <li>• Epic loot guaranteed</li>
              </ul>
            </div>

            {/* Weekly Raids */}
            <div className="bg-gradient-to-br from-purple-900 to-gray-900 rounded-lg p-6 border-2 border-purple-600">
              <div className="text-2xl font-bold text-purple-400 mb-2">📅 Weekly Raids</div>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• Resets every week</li>
                <li>• 10-15 players recommended</li>
                <li>• 45-60 minute duration</li>
                <li>• Challenging mechanics</li>
                <li>• Legendary loot possible</li>
              </ul>
            </div>

            {/* Monthly Raids */}
            <div className="bg-gradient-to-br from-yellow-900 to-gray-900 rounded-lg p-6 border-2 border-yellow-600">
              <div className="text-2xl font-bold text-yellow-400 mb-2">🏆 Monthly Raids</div>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• Resets monthly</li>
                <li>• 20+ players recommended</li>
                <li>• 60-90 minute duration</li>
                <li>• Extreme difficulty</li>
                <li>• Best loot in game</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Difficulty Tiers */}
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 mb-12">
          <h2 className="text-3xl font-bold text-white mb-6">Difficulty Tiers</h2>
          
          <div className="space-y-4">
            <div className="bg-green-900/30 border-2 border-green-600 rounded-lg p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-2xl font-bold text-green-400">Normal</h3>
                <span className="text-sm text-gray-400">Recommended Item Score: 50+</span>
              </div>
              <p className="text-gray-300">
                Entry-level raiding. Learn mechanics and get comfortable with your class. 
                Great for new guilds and casual players. Guaranteed epic loot.
              </p>
            </div>

            <div className="bg-blue-900/30 border-2 border-blue-600 rounded-lg p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-2xl font-bold text-blue-400">Heroic</h3>
                <span className="text-sm text-gray-400">Recommended Item Score: 150+</span>
              </div>
              <p className="text-gray-300">
                Increased damage and additional mechanics. Requires coordination and 
                proper class composition. Guaranteed legendary loot possible.
              </p>
            </div>

            <div className="bg-purple-900/30 border-2 border-purple-600 rounded-lg p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-2xl font-bold text-purple-400">Mythic</h3>
                <span className="text-sm text-gray-400">Recommended Item Score: 250+</span>
              </div>
              <p className="text-gray-300">
                The ultimate challenge. Complex mechanics, tight DPS checks, and requires 
                perfect execution. Best rewards in the game. Only the strongest guilds succeed.
              </p>
            </div>
          </div>
        </div>

        {/* World Boss */}
        <div className="bg-gradient-to-br from-red-900 to-gray-800 rounded-lg p-8 border-2 border-red-600 mb-12">
          <div className="flex items-center space-x-4 mb-6">
            <span className="text-5xl">🌍</span>
            <div>
              <h2 className="text-3xl font-bold text-red-400">World Boss Events</h2>
              <p className="text-gray-300">Server-wide events with massive rewards</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-900/50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-3">Event Details</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Scheduled events announced in advance</li>
                <li>• Entire server participates (unlimited players)</li>
                <li>• Massive boss with millions of HP</li>
                <li>• Time-limited encounter (30-60 minutes)</li>
                <li>• Leaderboards for damage/healing</li>
              </ul>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-3">Rewards</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• 🏆 Top DPS: Legendary weapon</li>
                <li>• 💚 Top Healer: Legendary trinket</li>
                <li>• 🛡️ Top Tank: Legendary armor</li>
                <li>• 💰 All Participants: Gold + Tokens</li>
                <li>• 🎁 Random legendary drops</li>
              </ul>
            </div>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="text-sm font-semibold text-red-400 mb-2">Strategy Tips:</div>
            <div className="text-gray-300 text-sm">
              Bring your best gear, use consumables, coordinate with other players in chat. 
              The boss has unique mechanics that require adaptation. Some world bosses are immune 
              to certain effects or gain power over time. Communication is key!
            </div>
          </div>
        </div>

        {/* Guild Coordination */}
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 mb-12">
          <h2 className="text-3xl font-bold text-white mb-6">Guild Coordination</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-bold text-purple-400 mb-3">Why Guilds Matter</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Guilds sign up as a group for raids</li>
                <li>• Share resources through guild bank</li>
                <li>• Guild perks boost all members</li>
                <li>• Coordinate class composition (need tanks/healers/DPS)</li>
                <li>• Share crafting stations for bonus quality</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-purple-400 mb-3">Raid Composition</h3>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="bg-blue-900/30 rounded p-3">
                  <span className="font-semibold text-blue-400">10-Player Raid:</span><br />
                  2 Tanks, 2-3 Healers, 5-6 DPS
                </div>
                <div className="bg-purple-900/30 rounded p-3">
                  <span className="font-semibold text-purple-400">20-Player Raid:</span><br />
                  2-3 Tanks, 4-5 Healers, 12-14 DPS
                </div>
                <div className="bg-red-900/30 rounded p-3">
                  <span className="font-semibold text-red-400">World Boss:</span><br />
                  All roles welcome! More players = faster kill
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How to Participate */}
        <div className="bg-gradient-to-br from-gray-800 to-purple-900 rounded-lg p-8 border border-purple-600">
          <h2 className="text-3xl font-bold text-white mb-6">How to Participate</h2>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0">
                1
              </div>
              <div>
                <div className="font-bold text-white mb-1">Join a Guild</div>
                <div className="text-gray-300">Form or join a guild with other players using !guild commands in chat</div>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0">
                2
              </div>
              <div>
                <div className="font-bold text-white mb-1">Check Raid Schedule</div>
                <div className="text-gray-300">View available raids in your Player Portal or announcements in stream</div>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0">
                3
              </div>
              <div>
                <div className="font-bold text-white mb-1">Sign Up Your Guild</div>
                <div className="text-gray-300">Guild leader uses raid signup in Portal or !raid signup command</div>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0">
                4
              </div>
              <div>
                <div className="font-bold text-white mb-1">Prepare for Battle</div>
                <div className="text-gray-300">Stock up on consumables, repair gear, and be online when raid starts</div>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0">
                5
              </div>
              <div>
                <div className="font-bold text-white mb-1">Defeat the Boss</div>
                <div className="text-gray-300">Work together, follow mechanics, and claim your legendary loot!</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
