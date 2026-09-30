/**
 * Group Boost Indicator
 * 
 * Displays active chat activity boosts and group state.
 * Chat activity boosts group stats - this surfaces that clearly to players.
 */

interface GroupBoostIndicatorProps {
  chatActivityLevel?: number; // 0-100, how active chat is
  activeBoosts?: {
    attack?: number;
    defense?: number;
    healing?: number;
  };
  groupSize?: number;
  enemyStrength?: number; // Relative strength indicator
}

export default function GroupBoostIndicator({
  chatActivityLevel = 0,
  activeBoosts = {},
  groupSize = 0,
  enemyStrength = 100,
}: GroupBoostIndicatorProps) {
  // Determine chat activity level display
  const getChatActivityDisplay = (level: number) => {
    if (level >= 75) return { label: 'Very Active', color: 'text-green-400', icon: '🔥' };
    if (level >= 50) return { label: 'Active', color: 'text-blue-400', icon: '💬' };
    if (level >= 25) return { label: 'Moderate', color: 'text-yellow-400', icon: '📢' };
    return { label: 'Quiet', color: 'text-gray-400', icon: '💤' };
  };

  const chatDisplay = getChatActivityDisplay(chatActivityLevel);

  // Determine enemy strength display
  const getEnemyStrengthDisplay = (strength: number) => {
    if (strength >= 150) return { label: 'Overwhelming', color: 'text-red-500', icon: '💀' };
    if (strength >= 120) return { label: 'Dangerous', color: 'text-orange-500', icon: '⚠️' };
    if (strength >= 100) return { label: 'Challenging', color: 'text-yellow-400', icon: '⚔️' };
    if (strength >= 80) return { label: 'Balanced', color: 'text-green-400', icon: '⚖️' };
    return { label: 'Easy', color: 'text-blue-400', icon: '✓' };
  };

  const enemyDisplay = getEnemyStrengthDisplay(enemyStrength);

  const hasBoosts = Object.keys(activeBoosts).length > 0;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-white">Group Status</h3>
        <span className="text-sm text-gray-400">{groupSize} players</span>
      </div>

      {/* Chat Activity Level */}
      <div className="bg-gray-900 rounded p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{chatDisplay.icon}</span>
            <div>
              <div className="text-xs text-gray-400">Chat Activity</div>
              <div className={`text-sm font-bold ${chatDisplay.color}`}>
                {chatDisplay.label}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{chatActivityLevel}%</div>
          </div>
        </div>
        
        {/* Activity bar */}
        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${
              chatActivityLevel >= 75 ? 'bg-green-500' :
              chatActivityLevel >= 50 ? 'bg-blue-500' :
              chatActivityLevel >= 25 ? 'bg-yellow-500' :
              'bg-gray-500'
            }`}
            style={{ width: `${chatActivityLevel}%` }}
          />
        </div>
      </div>

      {/* Active Boosts */}
      {hasBoosts && (
        <div className="bg-gradient-to-r from-purple-900 to-blue-900 rounded p-3 border border-purple-500">
          <div className="text-xs text-purple-300 mb-2 flex items-center gap-1">
            <span>✨</span>
            <span>Chat Boosts Active</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {activeBoosts.attack && (
              <div className="text-center">
                <div className="text-xs text-gray-300">Attack</div>
                <div className="text-lg font-bold text-red-400">+{activeBoosts.attack}%</div>
              </div>
            )}
            {activeBoosts.defense && (
              <div className="text-center">
                <div className="text-xs text-gray-300">Defense</div>
                <div className="text-lg font-bold text-blue-400">+{activeBoosts.defense}%</div>
              </div>
            )}
            {activeBoosts.healing && (
              <div className="text-center">
                <div className="text-xs text-gray-300">Healing</div>
                <div className="text-lg font-bold text-green-400">+{activeBoosts.healing}%</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enemy Strength */}
      <div className="bg-gray-900 rounded p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{enemyDisplay.icon}</span>
            <div>
              <div className="text-xs text-gray-400">Enemy Strength</div>
              <div className={`text-sm font-bold ${enemyDisplay.color}`}>
                {enemyDisplay.label}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-white">{enemyStrength}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
