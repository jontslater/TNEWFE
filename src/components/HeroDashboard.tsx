import { Hero } from '../types/Hero';
import { formatNumber, getRarityColor, getRarityBg, getRoleBg, formatTime, getItemScore } from '../utils/format';

interface HeroDashboardProps {
  hero: Hero;
}

export default function HeroDashboard({ hero }: HeroDashboardProps) {
  const hpPercent = (hero.hp / hero.maxHp) * 100;
  const xpPercent = (hero.xp / hero.maxXp) * 100;
  const itemScore = getItemScore(hero.equipment);

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 shadow-lg border border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center text-4xl">
              {hero.isDead ? '💀' : '⚔️'}
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">{hero.name}</h2>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`px-3 py-1 rounded text-sm font-semibold ${getRoleBg(hero.role)} text-white`}>
                  {hero.role}
                </span>
                <span className="text-gray-400">Level {hero.level}</span>
                <span className="text-gray-400">•</span>
                <span className="text-yellow-500">⚡ {itemScore} Item Score</span>
              </div>
            </div>
          </div>
          
          <div className="text-right space-y-2">
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-500">{formatNumber(hero.gold)}</div>
                <div className="text-xs text-gray-400">Gold</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{hero.tokens}</div>
                <div className="text-xs text-gray-400">Tokens</div>
              </div>
            </div>
          </div>
        </div>

        {/* HP Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">HP</span>
            <span className="text-white">{formatNumber(hero.hp)} / {formatNumber(hero.maxHp)}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${hero.isDead ? 'bg-gray-500' : 'bg-red-600'}`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        {/* XP Bar */}
        <div className="mt-2">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">XP</span>
            <span className="text-white">{hero.xp} / {hero.maxXp}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-gray-400 text-sm mb-1">Attack</div>
          <div className="text-2xl font-bold text-red-400">{hero.attack}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-gray-400 text-sm mb-1">Defense</div>
          <div className="text-2xl font-bold text-blue-400">{hero.defense}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-gray-400 text-sm mb-1">Max HP</div>
          <div className="text-2xl font-bold text-green-400">{formatNumber(hero.maxHp)}</div>
        </div>
      </div>

      {/* Equipment */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">Equipment</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(hero.equipment).map(([slot, item]) => (
            <div key={slot} className="bg-gray-700 rounded-lg p-4 border-2 border-gray-600">
              <div className="text-sm text-gray-400 mb-2 capitalize">{slot}</div>
              {item ? (
                <>
                  <div className={`font-semibold ${getRarityColor(item.rarity)}`}>
                    {item.name}
                  </div>
                  <div className="mt-2 space-y-1 text-sm">
                    {item.attack > 0 && <div className="text-red-400">+{item.attack} ATK</div>}
                    {item.defense > 0 && <div className="text-blue-400">+{item.defense} DEF</div>}
                    {item.hp > 0 && <div className="text-green-400">+{item.hp} HP</div>}
                  </div>
                </>
              ) : (
                <div className="text-gray-500 italic">Empty</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Active Buffs */}
      {Object.keys(hero.activeBuffs).length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Active Buffs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(hero.activeBuffs).map(([key, buff]) => (
              <div key={key} className="bg-green-900/30 border border-green-600 rounded-lg p-4">
                <div className="font-semibold text-green-400">{buff.name}</div>
                <div className="text-sm text-gray-300 mt-1">
                  +{Math.floor(buff.value * 100)}% {key.replace('Bonus', '')}
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  {formatTime(buff.remainingDuration)} combat time left
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">Combat Stats</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-gray-400 text-sm mb-1">Total Damage</div>
            <div className="text-xl font-bold text-red-400">{formatNumber(hero.stats.totalDamage)}</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm mb-1">Total Healing</div>
            <div className="text-xl font-bold text-green-400">{formatNumber(hero.stats.totalHealing)}</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm mb-1">Damage Blocked</div>
            <div className="text-xl font-bold text-blue-400">{formatNumber(hero.stats.damageBlocked)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
