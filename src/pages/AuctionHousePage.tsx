import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { auctionAPI, heroAPI } from '../api/client';
import { formatNumber } from '../utils/format';

interface Listing {
  id: string;
  sellerId: string;
  sellerUsername: string;
  item: any;
  startingPrice: number;
  buyoutPrice: number | null;
  currency: 'gold' | 'tokens';
  highestBid: number;
  highestBidder?: string;
  bidCount: number;
  status: 'active' | 'sold' | 'expired' | 'cancelled';
  expiresAt: any;
  createdAt: any;
}

export default function AuctionHousePage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [myBids, setMyBids] = useState<Listing[]>([]);
  const [activeTab, setActiveTab] = useState<'browse' | 'my-listings' | 'my-bids'>('browse');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    rarity: 'all',
    itemType: 'all',
    minPrice: '',
    maxPrice: '',
    currency: 'all'
  });
  const [sortBy, setSortBy] = useState<'price' | 'time' | 'rarity'>('time');

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'browse') {
        const data = await auctionAPI.getListings(filters);
        setListings(data);
      } else if (activeTab === 'my-listings') {
        const data = await auctionAPI.getMyListings(user!.id);
        setMyListings(data);
      } else if (activeTab === 'my-bids') {
        const data = await auctionAPI.getMyBids(user!.id);
        setMyBids(data);
      }
      
      if (showCreateModal || activeTab === 'my-listings') {
        const hero = await heroAPI.getHero(user!.id);
        setInventory(hero.inventory || []);
      }
    } catch (err) {
      console.error('Failed to load auction data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBid = async (listingId: string, amount: number) => {
    if (!user?.id) {
      alert('Please log in to place bids');
      return;
    }
    
    try {
      await auctionAPI.placeBid(listingId, user.id, user.display_name || user.login || 'Unknown', amount);
      await loadData();
      alert('Bid placed successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to place bid');
    }
  };

  const handleBuyout = async (listingId: string) => {
    if (!user?.id) {
      alert('Please log in to buy items');
      return;
    }
    
    if (!confirm('Buy this item instantly?')) return;
    
    try {
      await auctionAPI.buyout(listingId, user.id, user.display_name || user.login || 'Unknown');
      await loadData();
      alert('Item purchased successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to buyout');
    }
  };

  const handleCancelListing = async (listingId: string) => {
    if (!confirm('Cancel this listing? You will be charged a cancellation fee.')) return;
    
    try {
      await auctionAPI.cancelListing(listingId, user!.id);
      await loadData();
      alert('Listing cancelled');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to cancel listing');
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity?.toLowerCase()) {
      case 'legendary': return 'text-yellow-400 border-yellow-500';
      case 'epic': return 'text-purple-400 border-purple-500';
      case 'rare': return 'text-blue-400 border-blue-500';
      case 'uncommon': return 'text-green-400 border-green-500';
      default: return 'text-gray-400 border-gray-500';
    }
  };

  const getTimeRemaining = (expiresAt: any) => {
    if (!expiresAt) return 'Unknown';
    const expiry = expiresAt.toDate ? expiresAt.toDate() : new Date(expiresAt);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  const currentListings = activeTab === 'browse' ? listings : activeTab === 'my-listings' ? myListings : myBids;
  
  const sortedListings = [...currentListings].sort((a, b) => {
    if (sortBy === 'price') {
      return (b.highestBid || b.startingPrice) - (a.highestBid || a.startingPrice);
    }
    if (sortBy === 'rarity') {
      const rarityOrder = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
      const aRarity = rarityOrder[a.item?.rarity?.toLowerCase()] || 0;
      const bRarity = rarityOrder[b.item?.rarity?.toLowerCase()] || 0;
      return bRarity - aRarity;
    }
    // Sort by time remaining
    const aTime = a.expiresAt?.toDate?.()?.getTime() || 0;
    const bTime = b.expiresAt?.toDate?.()?.getTime() || 0;
    return aTime - bTime;
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Auction House</h1>
          <p className="text-gray-400">Buy and sell items with other players!</p>
        </div>
        <button
          onClick={() => {
            setShowCreateModal(true);
            loadData();
          }}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
        >
          Create Listing
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-gray-700">
        <TabButton active={activeTab === 'browse'} onClick={() => setActiveTab('browse')}>
          Browse ({listings.length})
        </TabButton>
        <TabButton active={activeTab === 'my-listings'} onClick={() => setActiveTab('my-listings')}>
          My Listings ({myListings.length})
        </TabButton>
        <TabButton active={activeTab === 'my-bids'} onClick={() => setActiveTab('my-bids')}>
          My Bids ({myBids.length})
        </TabButton>
      </div>

      {/* Filters (Browse Tab Only) */}
      {activeTab === 'browse' && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-gray-400 mb-2 text-sm">Rarity</label>
              <select
                value={filters.rarity}
                onChange={(e) => setFilters({ ...filters, rarity: e.target.value })}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
              >
                <option value="all">All Rarities</option>
                <option value="common">Common</option>
                <option value="uncommon">Uncommon</option>
                <option value="rare">Rare</option>
                <option value="epic">Epic</option>
                <option value="legendary">Legendary</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-400 mb-2 text-sm">Currency</label>
              <select
                value={filters.currency}
                onChange={(e) => setFilters({ ...filters, currency: e.target.value })}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
              >
                <option value="all">All</option>
                <option value="gold">Gold</option>
                <option value="tokens">Tokens</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-400 mb-2 text-sm">Min Price</label>
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                placeholder="Min"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2 text-sm">Max Price</label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                placeholder="Max"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-2 text-sm">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
              >
                <option value="time">Time Remaining</option>
                <option value="price">Price</option>
                <option value="rarity">Rarity</option>
              </select>
            </div>
          </div>
          <button
            onClick={loadData}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
          >
            Apply Filters
          </button>
        </div>
      )}

      {/* Listings Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-xl">Loading listings...</div>
        </div>
      ) : sortedListings.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-xl">No listings found</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedListings.map((listing) => {
            const isMyListing = listing.sellerId === user?.id;
            const isMyBid = listing.highestBidder === user?.id;
            const rarityColor = getRarityColor(listing.item?.rarity);
            
            return (
              <div
                key={listing.id}
                className={`bg-gray-800 rounded-lg p-4 border-2 transition-all hover:scale-105 ${
                  listing.status === 'active' ? rarityColor : 'border-gray-700'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="font-bold text-white text-lg mb-1">
                      {listing.item?.name || 'Unknown Item'}
                    </div>
                    <div className="text-sm text-gray-400 capitalize">
                      {listing.item?.rarity || 'Common'}
                    </div>
                  </div>
                  {listing.status === 'active' && (
                    <div className="text-xs text-green-400 bg-green-900/30 px-2 py-1 rounded">
                      Active
                    </div>
                  )}
                </div>

                <div className="mb-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Seller:</span>
                    <span className="text-white">{listing.sellerUsername}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Starting:</span>
                    <span className="text-white">
                      {formatNumber(listing.startingPrice)} {listing.currency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Current Bid:</span>
                    <span className="text-yellow-400 font-semibold">
                      {formatNumber(listing.highestBid || listing.startingPrice)} {listing.currency}
                    </span>
                  </div>
                  {listing.buyoutPrice && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Buyout:</span>
                      <span className="text-green-400 font-semibold">
                        {formatNumber(listing.buyoutPrice)} {listing.currency}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Bids:</span>
                    <span className="text-white">{listing.bidCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Time Left:</span>
                    <span className="text-orange-400">{getTimeRemaining(listing.expiresAt)}</span>
                  </div>
                </div>

                {listing.status === 'active' && (
                  <div className="space-y-2">
                    {!isMyListing && (
                      <>
                        <button
                          onClick={() => {
                            const minBid = (listing.highestBid || listing.startingPrice) + 1;
                            const amount = prompt(`Enter bid amount (minimum: ${minBid}):`, minBid.toString());
                            if (amount) handleBid(listing.id, Number(amount));
                          }}
                          className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
                        >
                          Place Bid
                        </button>
                        {listing.buyoutPrice && (
                          <button
                            onClick={() => handleBuyout(listing.id)}
                            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                          >
                            Buyout ({formatNumber(listing.buyoutPrice)} {listing.currency})
                          </button>
                        )}
                      </>
                    )}
                    {isMyListing && (
                      <button
                        onClick={() => handleCancelListing(listing.id)}
                        className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
                      >
                        Cancel Listing
                      </button>
                    )}
                    {isMyBid && !isMyListing && (
                      <div className="text-center text-sm text-blue-400 font-semibold">
                        You are the highest bidder!
                      </div>
                    )}
                  </div>
                )}

                {listing.status !== 'active' && (
                  <div className="text-center text-sm text-gray-500">
                    {listing.status === 'sold' ? 'Sold' : listing.status === 'expired' ? 'Expired' : 'Cancelled'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <CreateListingModal
          inventory={inventory}
          onClose={() => {
            setShowCreateModal(false);
            loadData();
          }}
          userId={user!.id}
          username={user!.display_name || user!.login || 'Unknown'}
        />
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 font-semibold transition-colors ${
        active
          ? 'border-b-2 border-blue-500 text-blue-400'
          : 'text-gray-400 hover:text-gray-300'
      }`}
    >
      {children}
    </button>
  );
}

function CreateListingModal({ inventory, onClose, userId, username }: any) {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [startingPrice, setStartingPrice] = useState('');
  const [buyoutPrice, setBuyoutPrice] = useState('');
  const [currency, setCurrency] = useState<'gold' | 'tokens'>('gold');
  const [duration, setDuration] = useState<'12' | '24' | '48'>('24');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!selectedItem || !startingPrice) {
      alert('Please select an item and set a starting price');
      return;
    }

    try {
      setLoading(true);
      await auctionAPI.createListing(
        userId,
        username,
        selectedItem,
        Number(startingPrice),
        buyoutPrice ? Number(buyoutPrice) : undefined,
        currency
      );
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">Create Listing</h2>
        
        <div className="mb-4">
          <label className="block text-gray-400 mb-2">Select Item</label>
          <select
            value={selectedItem?.id || ''}
            onChange={(e) => {
              const item = inventory.find((i: any) => i.id === e.target.value);
              setSelectedItem(item);
            }}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
          >
            <option value="">Select an item...</option>
            {inventory.map((item: any) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.rarity})
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-400 mb-2">Currency</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as 'gold' | 'tokens')}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
          >
            <option value="gold">Gold</option>
            <option value="tokens">Tokens</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-400 mb-2">Starting Price</label>
          <input
            type="number"
            value={startingPrice}
            onChange={(e) => setStartingPrice(e.target.value)}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            min="1"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-400 mb-2">Buyout Price (Optional)</label>
          <input
            type="number"
            value={buyoutPrice}
            onChange={(e) => setBuyoutPrice(e.target.value)}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            min="1"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-400 mb-2">Duration (Hours)</label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value as any)}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
          >
            <option value="12">12 Hours</option>
            <option value="24">24 Hours</option>
            <option value="48">48 Hours</option>
          </select>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleCreate}
            disabled={loading || !selectedItem || !startingPrice}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:bg-gray-600"
          >
            {loading ? 'Creating...' : 'Create Listing'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
