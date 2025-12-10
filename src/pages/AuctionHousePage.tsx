import React, { useState, useEffect } from 'react';
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

interface AuctionHousePageProps {
  heroId?: string; // Optional hero ID - if provided, uses that hero's inventory
}

export default function AuctionHousePage({ heroId }: AuctionHousePageProps = {}) {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [myBids, setMyBids] = useState<Listing[]>([]);
  const [activeTab, setActiveTab] = useState<'browse' | 'my-listings' | 'my-bids'>('browse');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);
  const [heroes, setHeroes] = useState<any[]>([]);
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(heroId || null);
  const [filters, setFilters] = useState({
    rarity: 'all',
    itemType: 'all',
    minPrice: '',
    maxPrice: '',
    currency: 'all'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'price' | 'time' | 'rarity'>('time');

  useEffect(() => {
    if (user?.id) {
      loadData(heroId);
    }
  }, [user, activeTab, heroId, showCreateModal]);

  // Update selectedHeroId when heroId prop changes
  useEffect(() => {
    if (heroId) {
      setSelectedHeroId(heroId);
    }
  }, [heroId]);

  const loadData = async (providedHeroId?: string) => {
    try {
      setLoading(true);
      
      const currentHeroId = providedHeroId || heroId || selectedHeroId;
      
      // Always load user's heroes for filtering own listings in Browse tab
      if (currentHeroId) {
        try {
          const hero = await heroAPI.getHeroById(currentHeroId);
          if (hero) {
            setHeroes([hero]);
            setSelectedHeroId(hero.id);
          }
        } catch (err) {
          console.error('Failed to load hero:', err);
        }
      } else if (user && activeTab === 'browse') {
        // Load all heroes for this user if no heroId provided (for filtering own listings)
        try {
          const userHeroes = await heroAPI.getHeroesByTwitchId(user.twitchId || user.id);
          setHeroes(userHeroes || []);
        } catch (err) {
          console.error('Failed to load user heroes:', err);
        }
      }
      
      if (activeTab === 'browse') {
        // Only send filters that have actual values (not 'all' or empty)
        const activeFilters: any = {};
        if (filters.rarity && filters.rarity !== 'all') activeFilters.rarity = filters.rarity;
        if (filters.currency && filters.currency !== 'all') activeFilters.currency = filters.currency;
        if (filters.itemType && filters.itemType !== 'all') activeFilters.itemType = filters.itemType;
        if (filters.minPrice) activeFilters.minPrice = filters.minPrice;
        if (filters.maxPrice) activeFilters.maxPrice = filters.maxPrice;
        
        const data = await auctionAPI.getListings(activeFilters);
        console.log('Loaded listings:', data?.length || 0);
        setListings(data || []);
      } else if (activeTab === 'my-listings') {
        // Use twitchId for querying listings (backend will find all heroes for this user)
        const data = await auctionAPI.getMyListings(user!.twitchId || user!.id);
        setMyListings(data);
      } else if (activeTab === 'my-bids') {
        const data = await auctionAPI.getMyBids(user!.id);
        setMyBids(data);
      }
      
      // Load inventory when needed (for create modal or my-listings tab)
      if (showCreateModal || activeTab === 'my-listings' || activeTab === 'browse') {
        const heroIdToUse = currentHeroId || selectedHeroId;
        
        if (heroIdToUse) {
          try {
            const hero = await heroAPI.getHeroById(heroIdToUse);
            if (hero) {
              const heroInventory: any[] = (hero.inventory || []).map((item: any) => ({
                ...item,
                heroId: hero.id,
                heroName: hero.name
              }));
              setInventory(heroInventory);
              // Don't overwrite heroes if already loaded above
              if (heroes.length === 0) {
                setHeroes([hero]);
              }
              setSelectedHeroId(hero.id);
            }
          } catch (err) {
            console.error('Failed to load hero inventory:', err);
          }
        } else if (!currentHeroId && user) {
          // Load all heroes for this user if no heroId provided (standalone page)
          try {
            const userHeroes = await heroAPI.getHeroesByTwitchId(user.twitchId || user.id);
            // Don't overwrite heroes if already loaded above
            if (heroes.length === 0) {
              setHeroes(userHeroes || []);
            }
            
            // Combine all inventories with hero info
            const combinedInventory: any[] = [];
            userHeroes?.forEach((hero: any) => {
              (hero.inventory || []).forEach((item: any) => {
                combinedInventory.push({
                  ...item,
                  heroId: hero.id,
                  heroName: hero.name
                });
              });
            });
            setInventory(combinedInventory);
            
            // Set first hero as selected if none selected
            if (!selectedHeroId && userHeroes && userHeroes.length > 0) {
              setSelectedHeroId(userHeroes[0].id);
            }
          } catch (err) {
            console.error('Failed to load user heroes/inventory:', err);
          }
        }
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
      await loadData(heroId);
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
      await loadData(heroId);
      alert('Item purchased successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to buyout');
    }
  };

  const handleCancelListing = async (listingId: string) => {
    if (!confirm('Cancel this listing? The item will be returned to your inventory, but the listing fee will NOT be refunded.')) return;
    
    try {
      // Use hero ID for cancellation (backend expects sellerId which is hero ID)
      const listing = myListings.find(l => l.id === listingId);
      if (listing) {
        await auctionAPI.cancelListing(listingId, listing.sellerId);
      } else {
        // Fallback to current hero ID
        await auctionAPI.cancelListing(listingId, heroId || user!.id);
      }
      await loadData(heroId);
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
  
  const getRarityBgColor = (rarity: string) => {
    switch (rarity?.toLowerCase()) {
      case 'legendary': return 'bg-yellow-500';
      case 'epic': return 'bg-purple-500';
      case 'rare': return 'bg-blue-500';
      case 'uncommon': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTimeRemaining = (expiresAt: any): string => {
    if (!expiresAt) return 'Unknown';
    
    try {
      // Handle Firestore Timestamp
      let expiryTime: number;
      if (expiresAt?.toMillis) {
        expiryTime = expiresAt.toMillis();
      } else if (expiresAt?.seconds) {
        expiryTime = expiresAt.seconds * 1000;
      } else if (expiresAt?._seconds) {
        expiryTime = expiresAt._seconds * 1000 + (expiresAt._nanoseconds || 0) / 1000000;
      } else if (typeof expiresAt === 'number') {
        expiryTime = expiresAt;
      } else if (expiresAt instanceof Date) {
        expiryTime = expiresAt.getTime();
      } else {
        return 'Unknown';
      }
      
      const now = Date.now();
      const remaining = expiryTime - now;
      
      if (remaining <= 0) return 'Expired';
      
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else if (minutes > 0) {
        return `${minutes}m`;
      } else {
        return 'Less than 1m';
      }
    } catch (error) {
      console.error('Error calculating time remaining:', error, expiresAt);
      return 'Unknown';
    }
  };

  // Helper function to get item type category
  const getItemCategory = (item: any): string => {
    if (!item) return 'other';
    if (item.slot) return 'gear';
    if (item.type === 'potion' || item.type === 'buff' || item.name?.toLowerCase().includes('potion') || 
        item.name?.toLowerCase().includes('scroll') || item.name?.toLowerCase().includes('boost')) {
      return 'consumable';
    }
    if (item.name?.toLowerCase().includes('gem') || item.name?.toLowerCase().includes('socket') || 
        item.type?.includes('material')) {
      return 'material';
    }
    return 'other';
  };

  let currentListings = activeTab === 'browse' ? listings : activeTab === 'my-listings' ? myListings : myBids;
  
  // Apply filters for Browse tab
  if (activeTab === 'browse') {
    // Filter out user's own listings - check if sellerId matches any of user's heroes
    const userHeroIds = heroes.map((h: any) => h.id);
    currentListings = currentListings.filter(listing => {
      return !userHeroIds.includes(listing.sellerId);
    });
    
    // Item type/category filter
    if (filters.itemType !== 'all') {
      currentListings = currentListings.filter(listing => {
        const category = getItemCategory(listing.item);
        return category === filters.itemType;
      });
    }
    
    // Rarity filter
    if (filters.rarity !== 'all') {
      currentListings = currentListings.filter(listing => {
        return (listing.item?.rarity || 'common').toLowerCase() === filters.rarity.toLowerCase();
      });
    }
    
    // Currency filter
    if (filters.currency !== 'all') {
      currentListings = currentListings.filter(listing => listing.currency === filters.currency);
    }
    
    // Price filters
    if (filters.minPrice) {
      const min = Number(filters.minPrice);
      currentListings = currentListings.filter(listing => 
        (listing.highestBid || listing.startingPrice) >= min
      );
    }
    if (filters.maxPrice) {
      const max = Number(filters.maxPrice);
      currentListings = currentListings.filter(listing => 
        (listing.highestBid || listing.startingPrice) <= max
      );
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      currentListings = currentListings.filter(listing => {
        const itemName = (listing.item?.name || '').toLowerCase();
        const sellerName = (listing.sellerUsername || '').toLowerCase();
        return itemName.includes(query) || sellerName.includes(query);
      });
    }
  }
  
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
    <div className={heroId ? 'w-full' : 'container mx-auto px-4 py-8 max-w-7xl'}>
      {!heroId && (
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Auction House</h1>
            <p className="text-gray-400">Buy and sell items with other players!</p>
          </div>
          <button
            onClick={() => {
              setShowCreateModal(true);
              loadData(heroId);
            }}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
          >
            Create Listing
          </button>
        </div>
      )}
      {heroId && (
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Auction House</h1>
            <p className="text-gray-400 text-sm">Buy and sell items with other players!</p>
          </div>
          <button
            onClick={() => {
              setShowCreateModal(true);
              loadData(heroId);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm"
          >
            Create Listing
          </button>
        </div>
      )}

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
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mb-6 space-y-4">
          {/* Search Bar */}
          <div>
            <label className="block text-gray-400 mb-2 text-sm font-semibold">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by item name or seller..."
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
            />
          </div>

          {/* Category Tabs (WoW-style) */}
          <div>
            <label className="block text-gray-400 mb-2 text-sm font-semibold">Category</label>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'all', label: 'All Items' },
                { value: 'gear', label: '⚔️ Gear' },
                { value: 'consumable', label: '🧪 Consumables' },
                { value: 'material', label: '💎 Materials/Gems' }
              ].map(category => (
                <button
                  key={category.value}
                  onClick={() => setFilters({ ...filters, itemType: category.value as any })}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                    filters.itemType === category.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* Other Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-gray-400 mb-2 text-sm">Rarity</label>
              <select
                value={filters.rarity}
                onChange={(e) => setFilters({ ...filters, rarity: e.target.value })}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
              >
                <option value="all">All Rarities</option>
                <option value="common">⚪ Common</option>
                <option value="uncommon">🟢 Uncommon</option>
                <option value="rare">🔵 Rare</option>
                <option value="epic">🟣 Epic</option>
                <option value="legendary">🟡 Legendary</option>
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
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => {
                setFilters({ rarity: 'all', itemType: 'all', currency: 'all', minPrice: '', maxPrice: '' });
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm"
            >
              Clear Filters
            </button>
            <button
              onClick={() => loadData(heroId)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
            >
              Refresh
            </button>
          </div>
        </div>
      )}

      {/* Listings List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-xl">Loading listings...</div>
        </div>
      ) : sortedListings.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-xl">No listings found</div>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 bg-gray-900 border-b border-gray-700 text-sm font-semibold text-gray-300">
            <div className="col-span-3">Item</div>
            <div className="col-span-2">Seller</div>
            <div className="col-span-1 text-right">Current Bid</div>
            <div className="col-span-1 text-right">Buyout</div>
            <div className="col-span-1 text-center">Bids</div>
            <div className="col-span-2 text-center">Time Left</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          
          {/* Table Body */}
          <div className="divide-y divide-gray-700">
            {sortedListings.map((listing) => {
              const isMyListing = activeTab === 'my-listings' || heroes.some((h: any) => h.id === listing.sellerId);
              const isMyBid = listing.highestBidder === user?.id;
              const rarityColor = getRarityColor(listing.item?.rarity);
              
              return (
                <div
                  key={listing.id}
                  className={`grid grid-cols-12 gap-4 p-4 hover:bg-gray-750 transition-colors ${
                    listing.status === 'active' ? '' : 'opacity-60'
                  }`}
                >
                  {/* Item Name & Rarity */}
                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-1 h-10 rounded ${
                        listing.status === 'active' 
                          ? getRarityBgColor(listing.item?.rarity)
                          : 'bg-gray-700'
                      }`}></div>
                      <div>
                        <div className="font-semibold text-white">
                          {listing.item?.name || 'Unknown Item'}
                          {listing.quantity > 1 && (
                            <span className="ml-2 text-sm text-blue-400 font-normal">({listing.quantity}x)</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 capitalize">
                          {listing.item?.rarity || 'Common'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Seller */}
                  <div className="col-span-2 flex items-center">
                    <span className="text-white text-sm">{listing.sellerUsername}</span>
                  </div>
                  
                  {/* Current Bid */}
                  <div className="col-span-1 text-right flex items-center justify-end">
                    <span className="text-yellow-400 font-semibold text-sm">
                      {formatNumber(listing.highestBid || listing.startingPrice)} {listing.currency}
                    </span>
                  </div>
                  
                  {/* Buyout */}
                  <div className="col-span-1 text-right flex items-center justify-end">
                    {listing.buyoutPrice ? (
                      <span className="text-green-400 font-semibold text-sm">
                        {formatNumber(listing.buyoutPrice)} {listing.currency}
                      </span>
                    ) : (
                      <span className="text-gray-500 text-sm">-</span>
                    )}
                  </div>
                  
                  {/* Bids */}
                  <div className="col-span-1 text-center flex items-center justify-center">
                    <span className="text-white text-sm">{listing.bids?.length || 0}</span>
                  </div>
                  
                  {/* Time Left */}
                  <div className="col-span-2 text-center flex items-center justify-center">
                    {listing.status === 'active' ? (
                      <span className="text-orange-400 text-sm">{getTimeRemaining(listing.expiresAt)}</span>
                    ) : (
                      <span className="text-gray-500 text-sm capitalize">{listing.status}</span>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="col-span-2 text-right flex items-center justify-end gap-2">
                    {listing.status === 'active' && (
                      <>
                        {isMyListing && activeTab === 'my-listings' ? (
                          <button
                            onClick={() => handleCancelListing(listing.id)}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-semibold"
                          >
                            Cancel
                          </button>
                        ) : !isMyListing ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const minBid = (listing.highestBid || listing.startingPrice) + 1;
                                const amount = prompt(`Enter bid amount (minimum: ${minBid}):`, minBid.toString());
                                if (amount) handleBid(listing.id, Number(amount));
                              }}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-semibold"
                            >
                              Bid
                            </button>
                            {listing.buyoutPrice && (
                              <button
                                onClick={() => handleBuyout(listing.id)}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold"
                              >
                                Buy
                              </button>
                            )}
                          </div>
                        ) : null}
                        {isMyBid && !isMyListing && (
                          <span className="text-blue-400 text-xs font-semibold">Your Bid</span>
                        )}
                      </>
                    )}
                    {listing.status !== 'active' && (
                      <span className="text-gray-500 text-xs">
                        {listing.status === 'sold' ? 'Sold' : listing.status === 'expired' ? 'Expired' : 'Cancelled'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showCreateModal && (
        <CreateListingModal
          inventory={inventory}
          heroes={heroes}
          selectedHeroId={selectedHeroId}
          onSelectedHeroChange={setSelectedHeroId}
          onClose={() => {
            setShowCreateModal(false);
            loadData(heroId); // Pass heroId to refresh data
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

function CreateListingModal({ inventory = [], heroes = [], selectedHeroId = null, onSelectedHeroChange = () => {}, onClose, userId, username }: any) {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [startingPrice, setStartingPrice] = useState('');
  const [buyoutPrice, setBuyoutPrice] = useState('');
  const [currency, setCurrency] = useState<'gold' | 'tokens'>('gold');
  const [duration, setDuration] = useState<'12' | '24' | '48'>('24');
  const [loading, setLoading] = useState(false);
  const [itemTypeFilter, setItemTypeFilter] = useState<'all' | 'gear' | 'consumable' | 'material' | 'other'>('all');

  // Filter inventory based on selected hero and item type
  const filteredInventory = (inventory || []).filter((item: any) => {
    // Filter by hero if one is selected
    if (selectedHeroId && item.heroId !== selectedHeroId) {
      return false;
    }
    
    // Filter by item type
    if (itemTypeFilter !== 'all') {
      if (itemTypeFilter === 'gear' && !item.slot) return false;
      if (itemTypeFilter === 'consumable' && item.type !== 'potion' && item.type !== 'buff' && !item.name?.toLowerCase().includes('potion')) return false;
      if (itemTypeFilter === 'material' && !item.type?.includes('material') && !item.name?.toLowerCase().includes('gem') && !item.name?.toLowerCase().includes('socket')) return false;
    }
    
    return true;
  });

  const getItemTypeLabel = (item: any) => {
    if (item.slot) return 'Gear';
    if (item.type === 'potion' || item.name?.toLowerCase().includes('potion')) return 'Consumable';
    if (item.type === 'buff' || item.name?.toLowerCase().includes('scroll') || item.name?.toLowerCase().includes('boost')) return 'Consumable';
    if (item.name?.toLowerCase().includes('gem') || item.name?.toLowerCase().includes('socket') || item.type?.includes('material')) return 'Material';
    return 'Other';
  };

  // Check if an item is stackable (consumables, materials, gems)
  const isStackable = (item: any) => {
    const typeLabel = getItemTypeLabel(item);
    return typeLabel === 'Consumable' || typeLabel === 'Material' || !item.slot;
  };

  // Generate a unique key for grouping stackable items
  const getStackKey = (item: any) => {
    // For gear: unique per item (name + rarity + slot + stats)
    if (item.slot) {
      return `${item.name}-${item.rarity}-${item.slot}-${item.id}`;
    }
    // For stackables: group by name + rarity + type
    return `${item.name}-${item.rarity || 'common'}-${getItemTypeLabel(item)}`;
  };

  // Group inventory items by stack key (WoW-style)
  const groupedInventory = React.useMemo(() => {
    const groups = new Map<string, any[]>();
    
    filteredInventory.forEach((item: any) => {
      const key = getStackKey(item);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    });

    // Convert to array with quantity information
    return Array.from(groups.entries()).map(([key, items]) => {
      const firstItem = items[0];
      const isStacked = isStackable(firstItem) && items.length > 1;
      
      return {
        ...firstItem,
        stackKey: key,
        quantity: items.length,
        allItems: items, // Keep all items for quantity selection
        displayName: isStacked ? `${firstItem.name} (${items.length}x)` : firstItem.name
      };
    });
  }, [filteredInventory]);

  // Calculate vendor sell price (estimated based on rarity and type)
  const getVendorSellPrice = (item: any): number => {
    // Base prices by rarity
    const rarityMultipliers: Record<string, number> = {
      common: 1,
      uncommon: 5,
      rare: 20,
      epic: 100,
      legendary: 500
    };
    
    const basePrice = rarityMultipliers[item.rarity || 'common'] || 1;
    
    // Adjust by item type
    if (item.slot) {
      // Gear: higher value
      return basePrice * 10;
    } else if (getItemTypeLabel(item) === 'Consumable') {
      // Consumables: moderate value
      return basePrice * 2;
    } else {
      // Materials: lower value
      return basePrice;
    }
  };

  // Calculate listing fee (WoW-style: % of vendor price based on duration)
  const calculateListingFee = (item: any, quantity: number = 1): number => {
    const vendorPrice = getVendorSellPrice(item);
    const durationMultipliers: Record<string, number> = {
      '12': 0.15,  // 15% for 12 hours
      '24': 0.30,  // 30% for 24 hours
      '48': 0.60   // 60% for 48 hours
    };
    
    const multiplier = durationMultipliers[duration] || 0.30;
    const feePerItem = Math.max(1, Math.floor(vendorPrice * multiplier));
    
    return feePerItem * quantity;
  };

  // Reset quantity when item changes
  React.useEffect(() => {
    setSelectedQuantity(1); // Always reset to 1 when item changes
  }, [selectedItem]);

  const handleCreate = async () => {
    if (!selectedItem || !startingPrice) {
      alert('Please select an item and set a starting price');
      return;
    }

    if (selectedQuantity < 1 || selectedQuantity > (selectedItem.quantity || 1)) {
      alert(`Invalid quantity. Available: ${selectedItem.quantity || 1}`);
      return;
    }

    // Use the hero ID that owns the item (not the user ID)
    const sellerHeroId = selectedItem.heroId || selectedHeroId || userId;
    
    // Get hero name for sellerUsername (fallback to username if hero not found)
    const sellerHero = heroes.find((h: any) => h.id === sellerHeroId);
    const sellerHeroName = sellerHero?.name || selectedItem.heroName || username;

    try {
      setLoading(true);
      await auctionAPI.createListing(
        sellerHeroId, // Use hero ID, not user ID
        sellerHeroName, // Use hero name, fallback to username
        selectedItem,
        Number(startingPrice),
        buyoutPrice ? Number(buyoutPrice) : undefined,
        currency,
        selectedQuantity,
        duration
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
        
        {/* Hero Selection (if multiple heroes) */}
        {heroes && heroes.length > 1 && (
          <div className="mb-4">
            <label className="block text-gray-400 mb-2">Select Hero</label>
            <select
              value={selectedHeroId || ''}
              onChange={(e) => {
                onSelectedHeroChange(e.target.value);
                setSelectedItem(null); // Clear selected item when changing hero
              }}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value="">All Heroes</option>
              {heroes.map((hero: any) => (
                <option key={hero.id} value={hero.id}>
                  {hero.name} (Level {hero.level || 1})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Item Type Filter */}
        <div className="mb-4">
          <label className="block text-gray-400 mb-2">Filter by Type</label>
          <select
            value={itemTypeFilter}
            onChange={(e) => {
              setItemTypeFilter(e.target.value as any);
              setSelectedItem(null); // Clear selected item when changing filter
            }}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
          >
            <option value="all">All Items ({groupedInventory.length})</option>
            <option value="gear">Gear Only</option>
            <option value="consumable">Consumables</option>
            <option value="material">Materials/Gems</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Item Selection */}
        <div className="mb-4">
          <label className="block text-gray-400 mb-2">Select Item</label>
          {filteredInventory.length === 0 ? (
            <div className="p-4 bg-gray-700 rounded-lg text-gray-400 text-center">
              {selectedHeroId 
                ? 'No items in this hero\'s inventory'
                : itemTypeFilter !== 'all'
                  ? `No ${itemTypeFilter} items found`
                  : 'No items in inventory'}
            </div>
          ) : (
            <select
              value={selectedItem?.stackKey || ''}
              onChange={(e) => {
                const item = groupedInventory.find((i: any) => i.stackKey === e.target.value);
                if (item) {
                  setSelectedItem(item);
                  setSelectedQuantity(1); // Reset quantity when changing item
                }
              }}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value="">Select an item...</option>
              {groupedInventory.map((item: any) => {
                const typeLabel = getItemTypeLabel(item);
                const heroLabel = heroes && heroes.length > 1 ? ` [${item.heroName || 'Unknown'}]` : '';
                const quantityLabel = item.quantity > 1 ? ` (${item.quantity}x)` : '';
                return (
                  <option key={item.stackKey} value={item.stackKey}>
                    {item.displayName} ({item.rarity || 'common'}) - {typeLabel}{quantityLabel}{heroLabel}
                  </option>
                );
              })}
            </select>
          )}
        </div>

        {/* Selected Item Info */}
        {selectedItem && (
          <div className="mb-4 p-3 bg-gray-700 rounded-lg border border-gray-600">
            <div className="text-white font-semibold">{selectedItem.displayName || selectedItem.name}</div>
            <div className="text-sm text-gray-400">
              Type: {getItemTypeLabel(selectedItem)} • Rarity: {selectedItem.rarity || 'common'}
              {selectedItem.heroName && ` • From: ${selectedItem.heroName}`}
            </div>
            {selectedItem.slot && (
              <div className="text-xs text-gray-500 mt-1">Slot: {selectedItem.slot}</div>
            )}
            {selectedItem.quantity > 1 && (
              <div className="text-xs text-blue-400 mt-1">Available: {selectedItem.quantity} items</div>
            )}
          </div>
        )}

        {/* Quantity Selector (for stackable items) */}
        {selectedItem && isStackable(selectedItem) && selectedItem.quantity > 1 && (
          <div className="mb-4">
            <label className="block text-gray-400 mb-2">Quantity to List</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                disabled={selectedQuantity <= 1}
                className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                -
              </button>
              <input
                type="number"
                value={selectedQuantity}
                onChange={(e) => {
                  const qty = Math.max(1, Math.min(selectedItem.quantity, parseInt(e.target.value) || 1));
                  setSelectedQuantity(qty);
                }}
                min="1"
                max={selectedItem.quantity}
                className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-center"
              />
              <button
                onClick={() => setSelectedQuantity(Math.min(selectedItem.quantity, selectedQuantity + 1))}
                disabled={selectedQuantity >= selectedItem.quantity}
                className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                +
              </button>
              <span className="text-gray-400 text-sm">/ {selectedItem.quantity}</span>
            </div>
          </div>
        )}

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
          <label className="block text-gray-400 mb-2">Duration</label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value as any)}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
          >
            <option value="12">12 Hours (15% deposit)</option>
            <option value="24">24 Hours (30% deposit)</option>
            <option value="48">48 Hours (60% deposit)</option>
          </select>
        </div>

        {/* Listing Fee Display */}
        {selectedItem && startingPrice && (
          <div className="mb-4 p-3 bg-gray-900 rounded-lg border border-gray-700">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Listing Fee (Deposit):</span>
              <span className="text-yellow-400 font-semibold">
                {calculateListingFee(selectedItem, selectedQuantity).toLocaleString()} {currency}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Based on vendor price × {duration === '12' ? '15%' : duration === '24' ? '30%' : '60%'} × {selectedQuantity} item{selectedQuantity > 1 ? 's' : ''}
            </div>
            <div className="text-xs text-blue-400 mt-2">
              💡 Deposit is refunded if the auction sells, forfeited if it doesn't
            </div>
          </div>
        )}

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
