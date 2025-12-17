import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { CLASS_DATA, getClassesByRole } from '../data/classData';
import { heroAPI } from '../api/client';
import Navigation from '../components/Navigation';

export default function CreateHeroPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'tokens' | 'payment' | null>(null);
  const [costInfo, setCostInfo] = useState<{
    heroCount: number;
    maxHeroes: number;
    canCreateMore: boolean;
    cost: { tokens: number; price: number };
    availableTokens: number;
    canAffordWithTokens: boolean;
  } | null>(null);
  const [loadingCostInfo, setLoadingCostInfo] = useState(true);
  const { tanks, healers, dps } = getClassesByRole();

  // Load cost info on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      loadCostInfo();
    }
  }, [isAuthenticated, user]);

  const loadCostInfo = async () => {
    if (!user) return;
    try {
      setLoadingCostInfo(true);
      const info = await heroAPI.getHeroCreationCostInfo(user.twitchId, user.tiktokId);
      setCostInfo(info);
      
      // Auto-select payment method if under 10 heroes (free) or if can afford with tokens
      if (info.heroCount < 10) {
        setPaymentMethod(null); // First 10 heroes are free
      } else if (info.canAffordWithTokens) {
        setPaymentMethod('tokens'); // Default to tokens if affordable
      } else {
        setPaymentMethod('payment'); // Default to payment if can't afford tokens
      }
    } catch (err) {
      console.error('Error loading cost info:', err);
    } finally {
      setLoadingCostInfo(false);
    }
  };

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

    // Validate payment method for heroes 11+
    if (costInfo && costInfo.heroCount >= 10) {
      if (!paymentMethod) {
        alert('Please select a payment method');
        return;
      }
      
      if (paymentMethod === 'tokens' && !costInfo.canAffordWithTokens) {
        alert(`Insufficient tokens. Required: ${costInfo.cost.tokens}, Available: ${costInfo.availableTokens}`);
        return;
      }
    }

    setCreating(true);
    try {
      const result = await heroAPI.createHero(
        selectedClass,
        user.twitchId,
        user.tiktokId,
        costInfo && costInfo.heroCount >= 10 ? paymentMethod || undefined : undefined,
        user.twitchUsername
      );

      // Hero created successfully, redirect to portal
      navigate('/portal');
    } catch (err: any) {
      console.error('Error creating hero:', err);
      const errorMessage = err.response?.data?.error || 'Failed to create hero';
      alert(errorMessage);
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
        <div className="flex items-start space-x-3 mb-3">
          <span className="text-3xl">{classInfo.icon}</span>
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-1" style={{ color: classInfo.color }}>
              {classInfo.displayName}
            </h3>
            <div className="text-sm text-gray-300 mb-2">{classInfo.description}</div>
            {classInfo.ability && (
              <div className="text-xs text-gray-400 space-y-1">
                <div>
                  <span className="font-semibold text-purple-400">Ability:</span> {classInfo.ability.name}
                </div>
                <div className="text-gray-500">{classInfo.ability.effect}</div>
                {classInfo.playstyle && (
                  <div className="text-gray-500 italic mt-1">💡 {classInfo.playstyle}</div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs bg-gray-900 rounded p-2 mt-3">
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
          
          {/* Hero Count and Cost Info */}
          {!loadingCostInfo && costInfo && (
            <div className="mt-4 mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700 max-w-md mx-auto">
              <div className="text-lg font-semibold text-white mb-2">
                Heroes: {costInfo.heroCount} / {costInfo.maxHeroes}
              </div>
              {costInfo.heroCount < 10 ? (
                <div className="text-green-400 font-semibold">
                  {costInfo.heroCount === 0 
                    ? 'First 10 heroes are FREE! 🎉' 
                    : `${10 - costInfo.heroCount} free hero${10 - costInfo.heroCount === 1 ? '' : 'es'} remaining!`}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-sm text-gray-300">
                    Cost for next hero (Hero #{costInfo.heroCount + 1}):
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <div className={`px-3 py-1 rounded ${costInfo.canAffordWithTokens ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                      💰 {costInfo.cost.tokens} Tokens
                    </div>
                    <div className="text-gray-500">or</div>
                    <div className="px-3 py-1 rounded bg-blue-900 text-blue-300">
                      💳 ${costInfo.cost.price}
                    </div>
                  </div>
                  {costInfo.heroCount >= costInfo.maxHeroes && (
                    <div className="text-red-400 font-semibold mt-2">
                      Maximum hero limit reached!
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Payment Method Selection (for heroes 11+) */}
          {!loadingCostInfo && costInfo && costInfo.heroCount >= 10 && costInfo.canCreateMore && selectedClass && (
            <div className="mt-4 mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700 max-w-md mx-auto">
              <div className="text-sm font-semibold text-white mb-3">Payment Method:</div>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setPaymentMethod('tokens')}
                  disabled={!costInfo.canAffordWithTokens}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                    paymentMethod === 'tokens'
                      ? 'bg-green-600 text-white ring-2 ring-green-400'
                      : costInfo.canAffordWithTokens
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
                  }`}
                >
                  💰 {costInfo.cost.tokens} Tokens
                  {!costInfo.canAffordWithTokens && (
                    <div className="text-xs text-red-400 mt-1">Insufficient</div>
                  )}
                </button>
                <button
                  onClick={() => setPaymentMethod('payment')}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                    paymentMethod === 'payment'
                      ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  💳 ${costInfo.cost.price}
                </button>
              </div>
              {costInfo.availableTokens > 0 && (
                <div className="text-xs text-gray-400 mt-2 text-center">
                  Available tokens: {costInfo.availableTokens}
                </div>
              )}
            </div>
          )}

          {selectedClass && (
            <div className="mt-6">
              <button
                onClick={handleCreateHero}
                disabled={creating || (costInfo && !costInfo.canCreateMore) || (costInfo && costInfo.heroCount >= 10 && !paymentMethod)}
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
