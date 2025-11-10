import { Guild } from '../types/Guild';
import { formatNumber, getRoleBg } from '../utils/format';

interface GuildPanelProps {
  guild: Guild | null;
}

export default function GuildPanel({ guild }: GuildPanelProps) {
  if (!guild) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
        <h3 className="text-xl font-bold text-white mb-4">No Guild</h3>
        <p className="text-gray-400 mb-4">You're not in a guild yet!</p>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition-colors">
          Find a Guild
        </button>
      </div>
    );
  }

  const sortedMembers = [...guild.members].sort((a, b) => {
    const rankOrder = { leader: 0, officer: 1, member: 2 };
    return rankOrder[a.rank] - rankOrder[b.rank] || b.contributionPoints - a.contributionPoints;
  });

  return (
    <div className="space-y-6">
      {/* Guild Header */}
      <div className="bg-gradient-to-br from-purple-900 to-gray-800 rounded-lg p-6 shadow-lg border border-purple-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">{guild.name}</h2>
            <div className="text-purple-400 mt-1">Level {guild.level} Guild</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Guild Gold</div>
            <div className="text-2xl font-bold text-yellow-500">{formatNumber(guild.gold)}</div>
          </div>
        </div>
        
        <div className="mt-4 flex items-center space-x-6 text-sm">
          <div>
            <span className="text-gray-400">Members: </span>
            <span className="text-white font-semibold">{guild.members.length} / {guild.maxMembers}</span>
          </div>
          <div>
            <span className="text-gray-400">Founded by: </span>
            <span className="text-purple-400 font-semibold">{guild.createdBy}</span>
          </div>
        </div>
      </div>

      {/* Guild Perks */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">Guild Perks</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {guild.perks.craftingBonus && (
            <div className="bg-green-900/30 border border-green-600 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">⚗️</div>
              <div className="text-sm text-gray-300">Crafting Bonus</div>
              <div className="text-xl font-bold text-green-400">+{guild.perks.craftingBonus * 100}%</div>
            </div>
          )}
          {guild.perks.gatherBonus && (
            <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">🌿</div>
              <div className="text-sm text-gray-300">Gathering Bonus</div>
              <div className="text-xl font-bold text-blue-400">+{guild.perks.gatherBonus * 100}%</div>
            </div>
          )}
          {guild.perks.combatBonus && (
            <div className="bg-red-900/30 border border-red-600 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">⚔️</div>
              <div className="text-sm text-gray-300">Combat Bonus</div>
              <div className="text-xl font-bold text-red-400">+{guild.perks.combatBonus * 100}%</div>
            </div>
          )}
        </div>
      </div>

      {/* Crafting Stations */}
      {guild.craftingStations.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Crafting Stations</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {guild.craftingStations.map((station) => (
              <div key={station.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <div className="font-semibold text-white capitalize">
                  {station.type.replace(/_/g, ' ')}
                </div>
                <div className="text-sm text-gray-400 mt-1">Level {station.level}</div>
                <div className="text-sm text-green-400 mt-2">
                  +{station.bonusQuality * 100}% Quality
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">Members</h3>
        <div className="space-y-2">
          {sortedMembers.map((member) => (
            <div 
              key={member.userId}
              className="bg-gray-700 rounded-lg p-4 flex items-center justify-between hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="text-2xl">
                  {member.rank === 'leader' ? '👑' : member.rank === 'officer' ? '⭐' : '🗡️'}
                </div>
                <div>
                  <div className="font-semibold text-white">{member.username}</div>
                  <div className="flex items-center space-x-2 mt-1 text-sm">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getRoleBg(member.heroRole)} text-white`}>
                      {member.heroRole}
                    </span>
                    <span className="text-gray-400">Lv {member.heroLevel}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Contribution</div>
                <div className="font-semibold text-purple-400">{formatNumber(member.contributionPoints)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
