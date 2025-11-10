import { Raid, WorldBoss } from '../types/Raid';
import { formatNumber } from '../utils/format';

interface RaidBrowserProps {
  raids: Raid[];
  worldBoss: WorldBoss | null;
}

export default function RaidBrowser({ raids, worldBoss }: RaidBrowserProps) {
  const getDifficultyColor = (difficulty: string) => {
    return {
      normal: 'text-green-400 bg-green-900/30 border-green-600',
      heroic: 'text-blue-400 bg-blue-900/30 border-blue-600',
      mythic: 'text-purple-400 bg-purple-900/30 border-purple-600'
    }[difficulty] || 'text-gray-400 bg-gray-900/30 border-gray-600';
  };

  const getTypeColor = (type: string) => {
    return {
      daily: 'bg-blue-600',
      weekly: 'bg-purple-600',
      monthly: 'bg-yellow-600'
    }[type] || 'bg-gray-600';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* World Boss */}
      {worldBoss && (
        <div className="bg-gradient-to-br from-red-900 to-gray-800 rounded-lg p-6 shadow-lg border-2 border-red-600">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-red-400 font-semibold mb-1">🌍 WORLD BOSS EVENT</div>
              <h2 className="text-3xl font-bold text-white">{worldBoss.name}</h2>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Participants</div>
              <div className="text-2xl font-bold text-white">{worldBoss.participants.length}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-900/50 rounded p-3">
              <div className="text-xs text-gray-400">Boss HP</div>
              <div className="text-lg font-bold text-red-400">{formatNumber(worldBoss.maxHp)}</div>
            </div>
            <div className="bg-gray-900/50 rounded p-3">
              <div className="text-xs text-gray-400">Gold Reward</div>
              <div className="text-lg font-bold text-yellow-400">{formatNumber(worldBoss.rewards.gold)}</div>
            </div>
            <div className="bg-gray-900/50 rounded p-3">
              <div className="text-xs text-gray-400">Token Reward</div>
              <div className="text-lg font-bold text-blue-400">{worldBoss.rewards.tokens}</div>
            </div>
            <div className="bg-gray-900/50 rounded p-3">
              <div className="text-xs text-gray-400">Duration</div>
              <div className="text-lg font-bold text-white">{worldBoss.duration} min</div>
            </div>
          </div>

          <div className="text-sm text-gray-300 mb-4">
            <strong>Scheduled:</strong> {formatDate(worldBoss.scheduledTime)}
          </div>

          <button className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-colors">
            Sign Up for World Boss
          </button>
        </div>
      )}

      {/* Raid List */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-2xl font-bold text-white mb-6">Available Raids</h3>
        
        <div className="space-y-4">
          {raids.map((raid) => (
            <div 
              key={raid.id}
              className={`bg-gray-700 rounded-lg p-6 border-2 hover:border-blue-500 transition-colors ${getDifficultyColor(raid.difficulty)}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded text-sm font-semibold uppercase ${getTypeColor(raid.type)} text-white`}>
                    {raid.type}
                  </span>
                  <h4 className="text-xl font-bold text-white">{raid.boss.name}</h4>
                </div>
                <div className={`px-3 py-1 rounded text-sm font-semibold capitalize ${getDifficultyColor(raid.difficulty)}`}>
                  {raid.difficulty}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4 text-sm">
                <div>
                  <div className="text-gray-400">Boss HP</div>
                  <div className="font-semibold text-white">{formatNumber(raid.boss.maxHp)}</div>
                </div>
                <div>
                  <div className="text-gray-400">Gold</div>
                  <div className="font-semibold text-yellow-400">{formatNumber(raid.rewards.gold)}</div>
                </div>
                <div>
                  <div className="text-gray-400">Tokens</div>
                  <div className="font-semibold text-blue-400">{raid.rewards.tokens}</div>
                </div>
                <div>
                  <div className="text-gray-400">Duration</div>
                  <div className="font-semibold text-white">{raid.duration} min</div>
                </div>
                <div>
                  <div className="text-gray-400">Signups</div>
                  <div className="font-semibold text-white">{raid.signups.length} guilds</div>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-xs text-gray-400 mb-1">Boss Mechanics</div>
                <div className="flex flex-wrap gap-2">
                  {raid.boss.mechanics.map((mechanic, idx) => (
                    <span key={idx} className="text-xs bg-gray-600 px-2 py-1 rounded text-gray-300">
                      {mechanic}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  Starts: {formatDate(raid.schedule.startsAt)}
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition-colors">
                  Sign Up Guild
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
