import { useState, useEffect } from 'react';
import { partyAPI } from '../api/client';

interface PartyInviteFormProps {
  partyId: string;
  inviterId: string;
  onClose: () => void;
  onInvited?: () => void;
}

interface SearchResult {
  userId: string;
  twitchUserId?: string;
  username: string;
  heroId: string;
  heroName: string;
  heroRole: string;
  heroLevel: number;
}

interface GroupedUser {
  userId: string;
  twitchUserId?: string;
  username: string;
  heroes: SearchResult[];
}

export default function PartyInviteForm({ partyId, inviterId, onClose, onInvited }: PartyInviteFormProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [groupedUsers, setGroupedUsers] = useState<GroupedUser[]>([]);
  const [selectedHero, setSelectedHero] = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);

  // Search for users when search term changes (debounced)
  useEffect(() => {
    if (!searchTerm.trim() || searchTerm.length < 2) {
      setSearchResults([]);
      setGroupedUsers([]);
      setSelectedHero(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await partyAPI.searchUsers(searchTerm);
        if (response.success && response.matches) {
          setSearchResults(response.matches);
          
          // Group results by username/userId
          const grouped: Record<string, GroupedUser> = {};
          response.matches.forEach((result) => {
            const key = result.userId || result.twitchUserId || result.username;
            if (!grouped[key]) {
              grouped[key] = {
                userId: result.userId,
                twitchUserId: result.twitchUserId,
                username: result.username,
                heroes: []
              };
            }
            grouped[key].heroes.push(result);
          });
          
          setGroupedUsers(Object.values(grouped));
          
          // Auto-select if only one hero
          if (response.matches.length === 1) {
            setSelectedHero(response.matches[0]);
          }
        } else {
          setSearchResults([]);
          setGroupedUsers([]);
        }
      } catch (error: any) {
        console.error('Failed to search users:', error);
        setSearchResults([]);
        setGroupedUsers([]);
      } finally {
        setSearching(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSelectHero = (hero: SearchResult) => {
    setSelectedHero(hero);
  };

  const handleSend = async () => {
    if (!selectedHero) {
      alert('Please select a hero to invite');
      return;
    }

    setSending(true);
    try {
      // Use twitchUserId if available, otherwise userId
      const inviteeUserId = selectedHero.twitchUserId || selectedHero.userId;
      await partyAPI.invitePlayer(
        partyId,
        inviterId,
        inviteeUserId,
        selectedHero.username,
        selectedHero.heroId,
        selectedHero.heroName,
        selectedHero.heroRole,
        selectedHero.heroLevel
      );
      if (onInvited) onInvited();
      // Reset form
      setSearchTerm('');
      setSelectedHero(null);
      setSearchResults([]);
      setGroupedUsers([]);
      onClose();
    } catch (error: any) {
      console.error('Failed to send invite:', error);
      alert(error.response?.data?.error || 'Failed to send invite');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-bold text-white">Invite Player</h4>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
          title="Close"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3">
        {/* Search Input */}
        <div>
          <label className="block text-sm text-gray-300 mb-1">Search by Username or Hero Name</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
            placeholder="Type username or hero name..."
            autoFocus
          />
          {searching && (
            <p className="text-xs text-gray-500 mt-1">Searching...</p>
          )}
        </div>

        {/* Search Results */}
        {searchTerm.length >= 2 && !searching && groupedUsers.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto bg-gray-700 rounded border border-gray-600">
            {groupedUsers.map((userGroup) => (
              <div key={userGroup.userId || userGroup.username} className="border-b border-gray-600 last:border-b-0">
                <div className="px-3 py-2 bg-gray-800 text-white text-sm font-semibold">
                  {userGroup.username}
                </div>
                <div className="divide-y divide-gray-600">
                  {userGroup.heroes.map((hero, index) => (
                    <button
                      key={`${hero.userId}-${hero.heroId}-${index}`}
                      onClick={() => handleSelectHero(hero)}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-600 transition-colors ${
                        selectedHero?.heroId === hero.heroId && selectedHero?.userId === hero.userId
                          ? 'bg-blue-900/30 border-l-2 border-blue-500'
                          : ''
                      }`}
                    >
                      <div className="text-white text-sm font-semibold">{hero.heroName}</div>
                      <div className="text-xs text-gray-400">
                        {hero.heroRole} Lv{hero.heroLevel}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {searchTerm.length >= 2 && !searching && groupedUsers.length === 0 && (
          <div className="text-center py-4 text-gray-400 text-sm">
            No users found matching "{searchTerm}"
          </div>
        )}

        {/* Selected Hero Info */}
        {selectedHero && (
          <div className="p-4 bg-gray-700 rounded border border-amber-400">
            <div className="text-sm font-semibold text-white mb-1">
              Selected Hero:
            </div>
            <div className="text-sm text-amber-300 font-semibold">
              {selectedHero.heroName}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              User: {selectedHero.username} • {selectedHero.heroRole} • Level {selectedHero.heroLevel}
            </div>
          </div>
        )}

        {/* Helper Text */}
        {searchTerm.length < 2 && (
          <div className="text-xs text-gray-500 mt-2">
            💡 Tip: Search by username or hero name. If a user has multiple heroes, you can select which one to invite.
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleSend}
            disabled={sending || !selectedHero}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? 'Sending...' : 'Send Invite'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}





