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
        <h3 className="text-xl font-bold text-white mb-4">Members ({guild.members.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedMembers.map((member) => {
            const professionIcon = member.profession?.type === 'herbalism' ? '🌿' : 
                                  member.profession?.type === 'mining' ? '⛏️' : 
                                  member.profession?.type === 'enchanting' ? '✨' : null;
            
            return (
              <div 
                key={member.userId}
                className="bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-colors border border-gray-600"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <div className="text-lg">
                    {member.rank === 'leader' ? '👑' : member.rank === 'officer' ? '⭐' : '🗡️'}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="font-semibold text-white text-sm truncate">{member.username}</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={`px-2 py-0.5 rounded font-semibold ${getRoleBg(member.heroRole)} text-white`}>
                    {member.heroRole}
                  </span>
                  <span className="text-gray-400">Lv {member.heroLevel}</span>
                </div>
                
                {member.profession && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">
                      {professionIcon} {member.profession.type}
                    </span>
                    <span className="text-gray-400">Lv {member.profession.level}</span>
                  </div>
                )}
                
                <div className="text-xs text-gray-500 mt-2 text-right">
                  {formatNumber(member.contributionPoints)} pts
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
