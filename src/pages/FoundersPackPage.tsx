import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { foundersPackAPI } from '../api/client';

interface PackTier {
  id: 'bronze' | 'silver' | 'gold' | 'platinum';
  name: string;
  price: number;
  badge: string;
  color: string;
  features: string[];
  premiumCurrency: number;
}

const PACK_TIERS: PackTier[] = [
  {
    id: 'bronze',
    name: 'Bronze Founder',
    price: 5,
    badge: '/Badges/FoundersBronze.png',
    color: 'from-orange-800 to-orange-900',
    premiumCurrency: 25,
    features: [
      'Bronze Founder Badge',
      'Exclusive "Founder" Title',
      '25 Premium Tokens',
      'Unique Name Color',
      'Discord Founder Role',
      'Early Access to New Features'
    ]
  },
  {
    id: 'silver',
    name: 'Silver Founder',
    price: 10,
    badge: '/Badges/FoundersSilver.png',
    color: 'from-gray-400 to-gray-600',
    premiumCurrency: 75,
    features: [
      'Silver Founder Badge',
      'Exclusive "Founder" Title',
      '75 Premium Tokens',
      'Unique Name Color',
      'Exclusive Name Frame',
      'Discord Founder Role',
      'Early Access to New Features'
    ]
  },
  {
    id: 'gold',
    name: 'Gold Founder',
    price: 15,
    badge: '/Badges/FoundersGold.png',
    color: 'from-yellow-500 to-yellow-600',
    premiumCurrency: 150,
    features: [
      'Gold Founder Badge',
      'Exclusive "Founder" Title',
      '150 Premium Tokens',
      'Unique Name Color',
      'Exclusive Name Frame',
      'Exclusive Aura Effect',
      'Exclusive Spell Effects',
      'Discord Founder Role',
      'Early Access to New Features',
      'Early Art Previews'
    ]
  },
  {
    id: 'platinum',
    name: 'Platinum Founder',
    price: 25,
    badge: '/Badges/FoundersPlatinum.png',
    color: 'from-purple-500 to-purple-700',
    premiumCurrency: 250,
    features: [
      'Platinum Founder Badge',
      'Exclusive "Founder" Title',
      '250 Premium Tokens',
      'Unique Name Color',
      'Exclusive Name Frame',
      'Exclusive Aura Effect',
      'Exclusive Spell Effects',
      'Founder Statue in Game',
      'Discord Founder Role',
      'Early Access to New Features',
      'Early Art Previews',
      'Exclusive Founder Chat Badge'
    ]
  }
];

export default function FoundersPackPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [selectedPack, setSelectedPack] = useState<PackTier | null>(null);
  const [processing, setProcessing] = useState(false);

  const handlePurchase = async (pack: PackTier) => {
    if (!isAuthenticated) {
      alert('Please log in to purchase a Founders Pack');
      navigate('/');
      return;
    }

    setSelectedPack(pack);
    setProcessing(true);

    try {
      const response = await foundersPackAPI.initiatePurchase(user!.id, pack.id);
      
      if (response.success) {
        // TODO: When Stripe is ready, redirect to checkout session
        // For now, show message that payment processing is pending
        alert(
          `Founders Pack Purchase Initiated!\n\n` +
          `Selected: ${pack.name}\n` +
          `Price: $${pack.price}\n\n` +
          `Payment processing integration is in progress.\n` +
          `Once Stripe is configured, you'll be redirected to complete payment.\n\n` +
          `Purchase ID: ${response.purchaseId}`
        );
        
        // When Stripe ready:
        // if (response.sessionId) {
        //   window.location.href = response.sessionId; // Stripe checkout URL
        // }
      } else {
        alert('Failed to initiate purchase. Please try again.');
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      alert(error.response?.data?.error || 'Failed to initiate purchase. Please try again.');
    } finally {
      setProcessing(false);
      setSelectedPack(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4 bg-gradient-to-r from-yellow-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Founders Pack
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Support the game's development and get exclusive rewards! Founder Pack funds go directly to artists and game development.
          </p>
          <div className="mt-4 text-yellow-400 font-semibold">
            ⭐ Limited Time Offer - Support Early Development ⭐
          </div>
        </div>

        {/* Pack Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {PACK_TIERS.map((pack) => (
            <div
              key={pack.id}
              className={`bg-gradient-to-br ${pack.color} rounded-xl p-6 border-4 border-white/20 shadow-2xl transform transition-all hover:scale-105 hover:shadow-purple-500/50 ${
                selectedPack?.id === pack.id ? 'ring-4 ring-yellow-400' : ''
              }`}
            >
              {/* Badge Preview */}
              <div className="flex justify-center mb-4">
                <img
                  src={pack.badge}
                  alt={`${pack.name} Badge`}
                  className="h-24 w-24 object-contain drop-shadow-lg"
                />
              </div>

              {/* Pack Name */}
              <h2 className="text-2xl font-bold text-white text-center mb-2">
                {pack.name}
              </h2>

              {/* Price */}
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-white">${pack.price}</div>
                <div className="text-sm text-white/80">One-time purchase</div>
              </div>

              {/* Features */}
              <div className="space-y-2 mb-6 min-h-[200px]">
                {pack.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start text-white text-sm">
                    <span className="text-yellow-300 mr-2">✓</span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              {/* Premium Currency Bonus */}
              <div className="bg-white/10 rounded-lg p-3 mb-4 text-center">
                <div className="text-yellow-300 font-bold text-lg">
                  +{pack.premiumCurrency} Premium Tokens
                </div>
              </div>

              {/* Purchase Button */}
              <button
                onClick={() => handlePurchase(pack)}
                disabled={processing}
                className={`w-full py-3 rounded-lg font-bold text-white transition-all ${
                  processing && selectedPack?.id === pack.id
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-white/20 hover:bg-white/30 transform hover:scale-105'
                }`}
              >
                {processing && selectedPack?.id === pack.id
                  ? 'Processing...'
                  : `Purchase ${pack.name}`}
              </button>
            </div>
          ))}
        </div>

        {/* Payment Notice */}
        <div className="bg-yellow-900/30 border-2 border-yellow-600 rounded-lg p-6 max-w-4xl mx-auto mb-8">
          <h3 className="text-2xl font-bold text-yellow-300 mb-3 text-center">
            💳 Payment Processing
          </h3>
          <p className="text-gray-300 text-center">
            Payment processing integration is in progress. Stripe setup is required before purchases can be completed.
            The purchase flow structure is ready and will be activated once payment processing is configured.
          </p>
        </div>

        {/* Benefits Section */}
        <div className="bg-gray-800/50 rounded-lg p-8 max-w-4xl mx-auto mb-8">
          <h3 className="text-3xl font-bold text-white mb-6 text-center">
            What You Get
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start">
                <span className="text-4xl mr-4">🎖️</span>
                <div>
                  <h4 className="text-xl font-bold text-white mb-1">Exclusive Badge</h4>
                  <p className="text-gray-300">Display your founder status with a unique badge next to your name in-game and on the leaderboards.</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-4xl mr-4">👑</span>
                <div>
                  <h4 className="text-xl font-bold text-white mb-1">Founder Title</h4>
                  <p className="text-gray-300">Equip the exclusive "Founder" title to show your early support for the game.</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-4xl mr-4">💎</span>
                <div>
                  <h4 className="text-xl font-bold text-white mb-1">Premium Currency</h4>
                  <p className="text-gray-300">Instant tokens to spend in the store on gear, cosmetics, and more!</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start">
                <span className="text-4xl mr-4">🎨</span>
                <div>
                  <h4 className="text-xl font-bold text-white mb-1">Visual Effects</h4>
                  <p className="text-gray-300">Unique name colors, frames, and aura effects to stand out in the community.</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-4xl mr-4">🚀</span>
                <div>
                  <h4 className="text-xl font-bold text-white mb-1">Early Access</h4>
                  <p className="text-gray-300">Get first access to new features, art previews, and exclusive content.</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-4xl mr-4">💬</span>
                <div>
                  <h4 className="text-xl font-bold text-white mb-1">Community Benefits</h4>
                  <p className="text-gray-300">Discord role, special chat badge, and recognition as a founder.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Support Message */}
        <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-lg p-8 max-w-4xl mx-auto text-center">
          <h3 className="text-2xl font-bold text-white mb-4">
            Support Game Development
          </h3>
          <p className="text-gray-300 text-lg mb-4">
            Founder Pack purchases directly fund:
          </p>
          <div className="grid md:grid-cols-3 gap-4 text-white">
            <div>
              <div className="text-3xl mb-2">🎨</div>
              <div className="font-semibold">Art Creation</div>
              <div className="text-sm text-gray-300">Commission new sprites, VFX, and animations</div>
            </div>
            <div>
              <div className="text-3xl mb-2">⚙️</div>
              <div className="font-semibold">Feature Development</div>
              <div className="text-sm text-gray-300">Build new systems and content</div>
            </div>
            <div>
              <div className="text-3xl mb-2">👥</div>
              <div className="font-semibold">Team Growth</div>
              <div className="text-sm text-gray-300">Hire artists and developers</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
