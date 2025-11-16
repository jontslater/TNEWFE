import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { CLASS_DATA, getClassesByRole } from '../data/classData';
import Navigation from '../components/Navigation';

export default function CreateHeroPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const { tanks, healers, dps } = getClassesByRole();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Login Required</h2>
          <p className="text-gray-400">Please login to create a hero</p>
        </div>
      </div>
    );
  }

  const handleCreateHero = async () => {
    if (!selectedClass || !user) return;

    setCreating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/heroes/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          class: selectedClass,
          twitchUserId: user.twitchId,
          tiktokUserId: user.tiktokId
        })
      });

      if (response.ok) {
        // Hero created successfully, redirect to portal
        navigate('/portal');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create hero');
        setCreating(false);
      }
    } catch (err) {
      console.error('Error creating hero:', err);
      alert('Failed to create hero');
      setCreating(false);
    }
  };

  const renderClassCard = (classInfo: typeof CLASS_DATA[0]) => {
    const isSelected = selectedClass === classInfo.key;

    return (
      <div
        key={classInfo.key}
        onClick={() => setSelectedClass(classInfo.key)}
        className={`bg-gray-800 rounded-lg p-6 border-2 cursor-pointer transition-all transform hover:scale-105 ${
          isSelected 
            ? 'border-purple-500 ring-2 ring-purple-500' 
            : 'border-gray-700 hover:border-purple-400'
        }`}
        style={{ borderColor: isSelected ? classInfo.color : undefined }}
      >
        <div className="flex items-center space-x-3 mb-3">
          <span className="text-3xl">{classInfo.icon}</span>
          <div>
            <h3 className="text-lg font-bold" style={{ color: classInfo.color }}>
              {classInfo.displayName}
            </h3>
            <div className="text-xs text-gray-400">{classInfo.description}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs bg-gray-900 rounded p-2">
          <div className="text-center">
            <div className="text-gray-500">HP</div>
            <div className="text-green-400 font-bold">{classInfo.baseHp}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-500">ATK</div>
            <div className="text-red-400 font-bold">{classInfo.baseAttack}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-500">DEF</div>
            <div className="text-blue-400 font-bold">{classInfo.baseDefense}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900">
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Create Your Hero</h1>
          <p className="text-xl text-gray-400 mb-2">
            Choose your class to begin your adventure
          </p>
          {selectedClass && (
            <div className="mt-6">
              <button
                onClick={handleCreateHero}
                disabled={creating}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-xl px-12 py-4 rounded-lg font-bold transition-all transform hover:scale-105 shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating Hero...' : `Create ${CLASS_DATA.find(c => c.key === selectedClass)?.displayName}`}
              </button>
            </div>
          )}
        </div>

        {/* Tanks */}
        <div className="mb-12">
          <div className="flex items-center space-x-3 mb-6">
            <div className="text-4xl">🛡️</div>
            <h2 className="text-3xl font-bold text-blue-400">Tanks</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tanks.map(renderClassCard)}
          </div>
        </div>

        {/* Healers */}
        <div className="mb-12">
          <div className="flex items-center space-x-3 mb-6">
            <div className="text-4xl">💚</div>
            <h2 className="text-3xl font-bold text-green-400">Healers</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {healers.map(renderClassCard)}
          </div>
        </div>

        {/* DPS */}
        <div className="mb-12">
          <div className="flex items-center space-x-3 mb-6">
            <div className="text-4xl">⚔️</div>
            <h2 className="text-3xl font-bold text-red-400">Damage Dealers</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dps.map(renderClassCard)}
          </div>
        </div>
      </div>
    </div>
  );
}
