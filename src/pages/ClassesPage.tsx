import Navigation from '../components/Navigation';
import { CLASS_DATA, getClassesByRole } from '../data/classData';

export default function ClassesPage() {
  const { tanks, healers, dps } = getClassesByRole();

  const renderClassCard = (classInfo: typeof CLASS_DATA[0]) => (
    <div
      key={classInfo.key}
      className="bg-gray-800 rounded-lg p-6 border-2 border-gray-700 hover:border-purple-500 transition-all duration-300 transform hover:scale-105"
      style={{ borderColor: classInfo.color + '40' }}
    >
      <div className="flex items-center space-x-3 mb-4">
        <span className="text-4xl">{classInfo.icon}</span>
        <div>
          <h3 className="text-xl font-bold" style={{ color: classInfo.color }}>
            {classInfo.displayName}
          </h3>
          <div className="text-sm text-gray-400">{classInfo.description}</div>
        </div>
      </div>

      {/* Base Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4 bg-gray-900 rounded p-3">
        <div className="text-center">
          <div className="text-xs text-gray-500">HP</div>
          <div className="text-green-400 font-bold">{classInfo.baseHp}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500">Attack</div>
          <div className="text-red-400 font-bold">{classInfo.baseAttack}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500">Defense</div>
          <div className="text-blue-400 font-bold">{classInfo.baseDefense}</div>
        </div>
      </div>

      {/* Unique Ability */}
      <div className="bg-gray-900 rounded p-3 mb-3">
        <div className="text-sm font-semibold text-purple-400 mb-1">
          {classInfo.ability.name}
        </div>
        <div className="text-xs text-gray-500 mb-2">
          {classInfo.ability.type}
          {classInfo.ability.cooldown && ` • ${classInfo.ability.cooldown}`}
        </div>
        <div className="text-sm text-gray-300">{classInfo.ability.effect}</div>
        {classInfo.ability.trigger && (
          <div className="text-xs text-gray-500 mt-1">
            Trigger: {classInfo.ability.trigger}
          </div>
        )}
      </div>

      {/* Playstyle */}
      <div className="text-xs text-gray-400 italic">
        {classInfo.playstyle}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900">
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Choose Your Class</h1>
          <p className="text-xl text-gray-400">
            28 unique classes across 3 roles. Master your playstyle.
          </p>
        </div>

        {/* Tanks Section */}
        <div className="mb-16">
          <div className="flex items-center space-x-3 mb-6">
            <div className="text-4xl">🛡️</div>
            <div>
              <h2 className="text-3xl font-bold text-blue-400">Tanks</h2>
              <p className="text-gray-400">Protectors who absorb damage and keep the party alive</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tanks.map(renderClassCard)}
          </div>
        </div>

        {/* Healers Section */}
        <div className="mb-16">
          <div className="flex items-center space-x-3 mb-6">
            <div className="text-4xl">💚</div>
            <div>
              <h2 className="text-3xl font-bold text-green-400">Healers</h2>
              <p className="text-gray-400">Life-savers who keep heroes fighting through restoration</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {healers.map(renderClassCard)}
          </div>
        </div>

        {/* DPS Section */}
        <div className="mb-16">
          <div className="flex items-center space-x-3 mb-6">
            <div className="text-4xl">⚔️</div>
            <div>
              <h2 className="text-3xl font-bold text-red-400">Damage Dealers</h2>
              <p className="text-gray-400">Damage specialists who eliminate enemies quickly</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dps.map(renderClassCard)}
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-purple-900 to-blue-900 rounded-lg p-12 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">Ready to Choose Your Path?</h3>
          <p className="text-gray-300 mb-6">Join the game and select your class with !join [class] in chat</p>
          <button
            onClick={() => window.open('https://twitch.tv/theneverendingwar', '_blank')}
            className="bg-white hover:bg-gray-100 text-purple-900 px-8 py-3 rounded-lg font-bold transition-colors"
          >
            Watch on Twitch
          </button>
        </div>
      </div>
    </div>
  );
}
