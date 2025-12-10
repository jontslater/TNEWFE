import { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { foundersPackAPI } from '../api/client';
import HeroSpriteJS from '../components/HeroSpriteJS';

interface Founder {
  userId: string;
  username: string;
  heroName?: string;
  heroRole?: string;
  tier: string;
  purchaseDate: number;
  purchaseId: string;
}

export default function FoundersHallPage() {
  const [founders, setFounders] = useState<Founder[]>([]);
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState<any>(null);

  useEffect(() => {
    loadFounders();
  }, []);

  const loadFounders = async () => {
    try {
      setLoading(true);
      console.log('[FoundersHall] Loading founders...');
      const response = await foundersPackAPI.getFounders();
      console.log('[FoundersHall] API Response:', response);
      
      if (response.success) {
        const foundersList = response.founders || [];
        console.log(`[FoundersHall] Found ${foundersList.length} founders:`, foundersList);
        setFounders(foundersList);
        setResponse(response); // Store for debug display
        
        // Log debug info if available
        if ((response as any).debug) {
          console.log('[FoundersHall] Debug Info:', (response as any).debug);
        }
      } else {
        console.warn('[FoundersHall] API returned success: false', response);
        setResponse(response);
      }
    } catch (error: any) {
      console.error('[FoundersHall] Failed to load founders:', error);
      console.error('[FoundersHall] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getTierConfig = (tier: string) => {
    const configs: Record<string, { name: string; color: string; borderColor: string; bgGradient: string }> = {
      platinum: {
        name: 'Platinum Founder',
        color: 'from-yellow-600 to-amber-600',
        borderColor: 'border-yellow-600/30 hover:border-yellow-500/50',
        bgGradient: 'from-gray-800 to-gray-900'
      },
      gold: {
        name: 'Gold Founder',
        color: 'from-yellow-500 to-yellow-600',
        borderColor: 'border-yellow-500/30 hover:border-yellow-400/50',
        bgGradient: 'from-gray-800 to-gray-900'
      },
      silver: {
        name: 'Silver Founder',
        color: 'from-gray-400 to-gray-500',
        borderColor: 'border-gray-400/30 hover:border-gray-300/50',
        bgGradient: 'from-gray-800 to-gray-900'
      },
      bronze: {
        name: 'Bronze Founder',
        color: 'from-orange-600 to-orange-700',
        borderColor: 'border-orange-600/30 hover:border-orange-500/50',
        bgGradient: 'from-gray-800 to-gray-900'
      }
    };
    return configs[tier] || configs.bronze;
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 mb-4">
            🏛️ Founders Hall
          </h1>
          <p className="text-gray-400 text-lg">
            Honoring the early supporters who made this game possible
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
            <p className="text-gray-400 mt-4">Loading founders...</p>
          </div>
        ) : founders.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🏛️</div>
            <h2 className="text-2xl font-bold text-gray-300 mb-2">The Hall Awaits</h2>
            <p className="text-gray-500 mb-4">
              Be the first to join the Founders Hall by purchasing a Founder Pack!
            </p>
            {/* Debug info in development */}
            {process.env.NODE_ENV === 'development' && (response as any)?.debug && (
              <div className="mt-8 p-4 bg-gray-800 rounded-lg border border-gray-700 max-w-2xl mx-auto text-left">
                <h3 className="text-yellow-400 font-bold mb-2">Debug Info:</h3>
                <pre className="text-xs text-gray-400 overflow-auto">
                  {JSON.stringify((response as any).debug, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {founders.map((founder, index) => {
              const tierConfig = getTierConfig(founder.tier);
              const glowColor = founder.tier === 'platinum' ? 'rgba(234, 179, 8, 0.5)' : 
                               founder.tier === 'gold' ? 'rgba(234, 179, 8, 0.4)' :
                               founder.tier === 'silver' ? 'rgba(156, 163, 175, 0.3)' :
                               'rgba(234, 88, 12, 0.3)';
              const textColor = founder.tier === 'platinum' ? 'text-yellow-400' :
                               founder.tier === 'gold' ? 'text-yellow-300' :
                               founder.tier === 'silver' ? 'text-gray-300' :
                               'text-orange-400';
              
              const heroRole = founder.heroRole || 'berserker';
              
              return (
                <div
                  key={founder.purchaseId}
                  className={`bg-gradient-to-br ${tierConfig.bgGradient} rounded-lg p-6 border-2 ${tierConfig.borderColor} transition-all shadow-lg hover:shadow-xl`}
                >
                  {/* Statue Sprite */}
                  <div className="text-center mb-4 mt-4">
                    <div className="relative inline-block">
                      <div 
                        className="relative"
                        style={{
                          filter: 'grayscale(100%) contrast(1.2) brightness(0.9) sepia(20%)',
                        }}
                      >
                        <HeroSpriteJS
                          heroId={`founder-${founder.userId}`}
                          role={heroRole}
                          scale={2.5}
                          facing="right"
                          style={{ filter: 'none' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Founder Name with Number */}
                  <div className="text-center mb-3">
                    <h3 className={`text-xl font-bold ${textColor} mb-1 flex items-center justify-center gap-2`}>
                      <span className={`text-xs ${textColor} font-semibold`}>
                        #{index + 1}
                      </span>
                      <span>{founder.username}</span>
                    </h3>
                    {founder.heroName && founder.heroName !== founder.username && (
                      <p className="text-sm text-gray-400 italic">
                        "{founder.heroName}"
                      </p>
                    )}
                  </div>

                  {/* Tier Badge */}
                  <div className="flex justify-center mb-3">
                    <span className={`px-3 py-1 bg-gradient-to-r ${tierConfig.color} text-white text-xs font-bold rounded-full uppercase tracking-wide`}>
                      {tierConfig.name}
                    </span>
                  </div>

                  {/* Purchase Date */}
                  <div className="text-center">
                    <p className="text-xs text-gray-500">
                      Joined {formatDate(founder.purchaseDate)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
