import { useState, useEffect, useRef } from 'react';
import { useChat, ChatMessage } from '../hooks/useChat';
import { useAuth } from '../hooks/useAuth';
import { Hero } from '../types/Hero';
import { webChatAPI, partyAPI } from '../api/client';
import { getFilterSettings, saveFilterSettings, shouldFilterMessage, FilterSettings, MaturityLevel } from '../utils/contentFilter';
import '../utils/testContentFilter'; // Load test utilities

interface ChatPanelProps {
  hero: Hero | null;
  partyId?: string;
  partyLeaderId?: string; // To check if current user can invite
  onPartyUpdate?: () => void; // Callback to refresh party data
}

export default function ChatPanel({ hero, partyId, partyLeaderId, onPartyUpdate }: ChatPanelProps) {
  const { user } = useAuth();
  const [activeChannel, setActiveChannel] = useState<'party' | 'world' | 'whisper'>('world');
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(new Set());
  const [showUserMenu, setShowUserMenu] = useState<string | null>(null); // Stores messageId of message with open menu
  const [showReportModal, setShowReportModal] = useState<{ userId: string; messageId?: string; userName: string } | null>(null);
  const [reportReason, setReportReason] = useState<'spam' | 'harassment' | 'inappropriate' | 'other'>('spam');
  const [filterSettings, setFilterSettings] = useState<FilterSettings>(getFilterSettings());
  const [showFilterSettings, setShowFilterSettings] = useState(false);
  const [activeWhisperRecipient, setActiveWhisperRecipient] = useState<{ heroId: string; heroName: string } | null>(null);
  const [whisperSearch, setWhisperSearch] = useState('');
  const [whisperSearchResults, setWhisperSearchResults] = useState<Array<{
    userId: string;
    username: string;
    heroId: string;
    heroName: string;
    heroRole: string;
    heroLevel: number;
  }>>([]);
  const [skipAutoSelect, setSkipAutoSelect] = useState(false); // Flag to prevent auto-select after manual clear
  
  // Admin check
  const isAdmin = user?.twitchUsername?.toLowerCase() === 'theneverendingwar';

  // Determine if user is in a party and is the leader
  const isInParty = !!partyId;
  const userId = user?.twitchId || user?.id || '';
  // Normalize IDs to strings for comparison
  const normalizedUserId = String(userId);
  const normalizedPartyLeaderId = partyLeaderId ? String(partyLeaderId) : null;
  const isPartyLeader = partyId && normalizedPartyLeaderId && normalizedPartyLeaderId === normalizedUserId;
  
  // Debug logging
  if (partyId && partyLeaderId) {
    console.log('[ChatPanel] Party invite check:', {
      partyId,
      partyLeaderId: normalizedPartyLeaderId,
      userId: normalizedUserId,
      isPartyLeader
    });
  }
  const currentPartyId = activeChannel === 'party' ? partyId : undefined;
  const currentRecipientHeroId = activeChannel === 'whisper' ? activeWhisperRecipient?.heroId : undefined;

  // Load blocked users
  useEffect(() => {
    const loadBlockedUsers = async () => {
      if (!user) return;
      
      try {
        const userId = user.id || user.twitchId || '';
        const response = await webChatAPI.getBlockedUsers(userId);
        if (response.success) {
          setBlockedUserIds(new Set(response.blockedUserIds || []));
        }
      } catch (error) {
        console.error('[ChatPanel] Error loading blocked users:', error);
      }
    };

    loadBlockedUsers();
  }, [user]);

  // Block/unblock user
  const handleBlockUser = async (blockedUserId: string) => {
    if (!user) return;
    
    try {
      const userId = user.id || user.twitchId || '';
      const response = await webChatAPI.blockUser(userId, blockedUserId);
      if (response.success) {
        setBlockedUserIds(prev => new Set([...prev, blockedUserId]));
        setShowUserMenu(null);
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to block user');
    }
  };

  const handleUnblockUser = async (blockedUserId: string) => {
    if (!user) return;
    
    try {
      const userId = user.id || user.twitchId || '';
      const response = await webChatAPI.unblockUser(userId, blockedUserId);
      if (response.success) {
        setBlockedUserIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(blockedUserId);
          return newSet;
        });
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to unblock user');
    }
  };

  // Report user/message
  const handleReport = async () => {
    if (!user || !showReportModal) return;
    
    try {
      const userId = user.id || user.twitchId || '';
      const response = await webChatAPI.reportUser(
        userId,
        showReportModal.userId,
        reportReason,
        showReportModal.messageId
      );
      
      if (response.success) {
        alert('Report submitted. Thank you for keeping the chat safe!');
        setShowReportModal(null);
        setReportReason('spam');
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to submit report');
    }
  };

  // Admin: Delete any message
  const handleAdminDeleteMessage = async (messageId: string) => {
    if (!user || !isAdmin) return;
    
    if (!confirm('Are you sure you want to delete this message?')) return;
    
    try {
      const userId = user.id || user.twitchId || '';
      const response = await webChatAPI.deleteMessageAdmin(messageId, userId);
      if (response.success) {
        // Message will be removed via WebSocket
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete message');
    }
  };

  const {
    messages,
    connected,
    sending,
    sendMessage,
    deleteMessage
  } = useChat({
    channel: activeChannel,
    partyId: currentPartyId,
    recipientId: currentRecipientHeroId,
    enabled: true,
    heroId: hero?.id
  });

  // Handle starting a whisper from user menu or search
  const handleStartWhisper = (heroId: string, heroName: string) => {
    // Use hero ID for hero-to-hero messaging
    setActiveWhisperRecipient({ heroId, heroName });
    setActiveChannel('whisper');
    setShowUserMenu(null);
    // Clear search when starting a whisper
    setWhisperSearch('');
    setWhisperSearchResults([]);
  };

  // Handle inviting user to party
  const handleInviteToParty = async (inviteeId: string, inviteeName: string, inviteeHeroId: string, inviteeHeroName: string, inviteeHeroRole: string, inviteeHeroLevel: number) => {
    if (!hero || !user) {
      alert('Hero and user information required');
      return;
    }

    try {
      const inviterId = userId;
      let currentPartyId = partyId;

      // If no party exists, create one first
      if (!currentPartyId) {
        const createResponse = await partyAPI.createParty(
          inviterId,
          user.twitchUsername || user.username || inviterId,
          hero.id,
          hero.name || 'Unknown',
          hero.role || 'berserker',
          hero.level || 1
        );

        if (!createResponse.success) {
          alert(createResponse.message || 'Failed to create party');
          return;
        }

        currentPartyId = createResponse.partyId;
        console.log('[ChatPanel] Created party for invite:', currentPartyId);
      } else {
        // If party exists, check if user is leader
        if (!isPartyLeader) {
          alert('Only the party leader can invite members');
          return;
        }
      }

      // Now send the invite
      const response = await partyAPI.invitePlayer(
        currentPartyId,
        inviterId,
        inviteeId,
        inviteeName,
        inviteeHeroId,
        inviteeHeroName,
        inviteeHeroRole,
        inviteeHeroLevel
      );

      if (response.success) {
        alert(`Invite sent to ${inviteeName}!`);
        setShowUserMenu(null);
        // Trigger party update to refresh party data
        if (onPartyUpdate) {
          onPartyUpdate();
        }
      } else {
        alert(response.message || 'Failed to send invite');
      }
    } catch (error: any) {
      console.error('Failed to invite player:', error);
      alert(error.response?.data?.error || 'Failed to send invite');
    }
  };

  // Search for users when whisperSearch changes
  useEffect(() => {
    const searchUsers = async () => {
      if (whisperSearch.trim().length < 2) {
        setWhisperSearchResults([]);
        return;
      }

      try {
        const response = await partyAPI.searchUsers(whisperSearch);
        if (response.success && response.matches) {
          setWhisperSearchResults(response.matches);
        } else {
          setWhisperSearchResults([]);
        }
      } catch (error) {
        console.error('Failed to search users:', error);
        setWhisperSearchResults([]);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [whisperSearch]);

  // Auto-select whisper recipient when receiving a whisper message (only if no recipient is selected and not manually cleared)
  useEffect(() => {
    if (activeChannel !== 'whisper' || !hero?.id || activeWhisperRecipient || skipAutoSelect) return;
    
    // Find the most recent whisper message that involves this hero
    const currentHeroId = String(hero.id);
    const mostRecentWhisper = messages
      .filter(m => {
        if (m.channel !== 'whisper' || m.deletedAt) return false;
        const messageHeroId = String(m.heroId || '');
        const messageRecipientHeroId = String(m.recipientHeroId || '');
        const involvesHero = messageHeroId === currentHeroId || messageRecipientHeroId === currentHeroId;
        return involvesHero;
      })
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))[0];
    
    if (mostRecentWhisper) {
      // Determine which hero is the other party (sender or recipient)
      const messageHeroId = String(mostRecentWhisper.heroId || '');
      const messageRecipientHeroId = String(mostRecentWhisper.recipientHeroId || '');
      
      // If current hero is the sender, the recipient is the other party
      // If current hero is the recipient, the sender is the other party
      const otherHeroId = messageHeroId === currentHeroId ? messageRecipientHeroId : messageHeroId;
      const otherHeroName = messageHeroId === currentHeroId 
        ? (mostRecentWhisper.recipientHeroName || 'Unknown')
        : (mostRecentWhisper.heroName || 'Unknown');
      
      if (otherHeroId && otherHeroId !== currentHeroId) {
        console.log('[ChatPanel] Auto-selecting whisper recipient:', {
          otherHeroId,
          otherHeroName,
          messageId: mostRecentWhisper.id
        });
        setActiveWhisperRecipient({ heroId: otherHeroId, heroName: otherHeroName });
      }
    }
  }, [messages, activeChannel, hero?.id, activeWhisperRecipient]);

  // Auto-scroll to bottom on new messages (but not when channel changes)
  const prevChannelRef = useRef(activeChannel);
  const prevMessagesLengthRef = useRef(messages.length);
  
  useEffect(() => {
    // Only auto-scroll if:
    // 1. Auto-scroll is enabled
    // 2. It's a new message (messages length increased), not a channel switch
    const isNewMessage = messages.length > prevMessagesLengthRef.current;
    const isChannelSwitch = prevChannelRef.current !== activeChannel;
    
    if (autoScroll && messagesEndRef.current && isNewMessage && !isChannelSwitch) {
      // Only scroll the chat container, not the page
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'nearest', // Don't scroll the page
        inline: 'nearest'
      });
    }
    
    prevChannelRef.current = activeChannel;
    prevMessagesLengthRef.current = messages.length;
  }, [messages, autoScroll, activeChannel]);

  // Detect manual scroll
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      setAutoScroll(isAtBottom);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || sending || !user) return;

    const success = await sendMessage(messageInput.trim());
    if (success) {
      setMessageInput('');
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) {
      return 'just now';
    } else if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    } else if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getRoleColor = (role: string) => {
    const roleLower = role.toLowerCase();
    if (['guardian', 'paladin', 'warden', 'bloodknight', 'vanguard', 'brewmaster'].includes(roleLower)) {
      return 'text-blue-400'; // Tank
    } else if (['cleric', 'atoner', 'druid', 'lightbringer', 'shaman', 'mistweaver', 'chronomancer', 'bard'].includes(roleLower)) {
      return 'text-green-400'; // Healer
    }
    return 'text-red-400'; // DPS
  };

  const getFounderBadgePath = (tier: string | null | undefined): string | null => {
    if (!tier) return null;
    const tierLower = tier.toLowerCase();
    const badgeMap: Record<string, string> = {
      'bronze': '/Badges/FoundersBronze.png',
      'silver': '/Badges/FoundersSilver.png',
      'gold': '/Badges/FoundersGold.png',
      'platinum': '/Badges/FoundersPlatinum.png'
    };
    return badgeMap[tierLower] || null;
  };

  const getFounderBadgeTitle = (tier: string | null | undefined): string => {
    if (!tier) return '';
    const tierLower = tier.toLowerCase();
    const titleMap: Record<string, string> = {
      'bronze': 'Bronze Founder',
      'silver': 'Silver Founder',
      'gold': 'Gold Founder',
      'platinum': 'Platinum Founder'
    };
    return titleMap[tierLower] || 'Founder';
  };

  // Filter messages by current channel, party, blocked users, and content
  const filteredMessages = messages.filter(m => {
    if (m.deletedAt) return false;
    if (m.channel !== activeChannel) return false;
    if (activeChannel === 'party' && m.partyId !== partyId) return false;
    if (activeChannel === 'whisper') {
      // For whispers, filter based on active recipient hero
      // Normalize IDs to strings for consistent comparison
      const currentHeroId = String(hero?.id || '');
      const messageHeroId = String(m.heroId || '');
      const messageRecipientHeroId = String(m.recipientHeroId || '');
      const activeRecipientHeroId = activeWhisperRecipient ? String(activeWhisperRecipient.heroId) : null;
      
      // If no active recipient selected, show all whispers involving current hero
      // This allows receiving whispers even when no recipient is selected
      if (!currentHeroId) {
        return false;
      }
      
      // Check if this message involves the current hero
      const involvesCurrentHero = messageHeroId === currentHeroId || messageRecipientHeroId === currentHeroId;
      if (!involvesCurrentHero) {
        return false;
      }
      
      // If no active recipient selected, show all whispers involving current hero
      if (!activeRecipientHeroId) {
        return true; // Show all whispers for current hero when no recipient selected
      }
      
      // If recipient is selected, only show messages with that specific recipient
      const isRelevant = (messageHeroId === currentHeroId && messageRecipientHeroId === activeRecipientHeroId) ||
                        (messageHeroId === activeRecipientHeroId && messageRecipientHeroId === currentHeroId);
      
      if (!isRelevant) {
        // Debug log for filtering out messages
        console.log('[ChatPanel] Filtering out whisper message:', {
          messageId: m.id,
          messageHeroId,
          messageRecipientHeroId,
          currentHeroId,
          activeRecipientHeroId,
          isRelevant
        });
        return false;
      }
    }
    // Filter blocked users
    if (blockedUserIds.has(m.userId)) return false;
    // Content filtering
    if (filterSettings.maturityFilter || filterSettings.blockedWordsFilter) {
      const filterResult = shouldFilterMessage(m.message, filterSettings);
      if (filterResult.filtered) return false;
    }
    return true;
  });

  return (
    <div className="bg-gray-800 rounded-lg p-5 border border-gray-700 flex flex-col h-[600px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-white">💬 Chat</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilterSettings(true)}
            className="text-xs text-gray-400 hover:text-gray-300 transition-colors px-2 py-1 rounded hover:bg-gray-700"
            title="Filter settings"
          >
            Filters
          </button>
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} title={connected ? 'Connected' : 'Disconnected'} />
          <span className="text-xs text-gray-400">{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      {/* Channel Tabs */}
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setActiveChannel('world');
          }}
          onMouseDown={(e) => {
            e.preventDefault(); // Prevent focus which can cause scroll
          }}
          className={`flex-1 px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
            activeChannel === 'world'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          🌍 World
        </button>
        {isInParty && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveChannel('party');
            }}
            onMouseDown={(e) => {
              e.preventDefault(); // Prevent focus which can cause scroll
            }}
            className={`flex-1 px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
              activeChannel === 'party'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            👥 Party
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setActiveChannel('whisper');
          }}
          onMouseDown={(e) => {
            e.preventDefault(); // Prevent focus which can cause scroll
          }}
          className={`flex-1 px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
            activeChannel === 'whisper'
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          💬 Whisper
        </button>
      </div>

      {/* Whisper Recipient Selection */}
      {activeChannel === 'whisper' && (
        <div className="bg-gray-900 rounded p-3 mb-3">
          {activeWhisperRecipient ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Whispering to:</div>
                  <div className="text-white font-semibold">{activeWhisperRecipient.heroName}</div>
                </div>
                <button
                  onClick={() => {
                    setSkipAutoSelect(true); // Prevent auto-select from re-selecting
                    setActiveWhisperRecipient(null);
                    setWhisperSearch('');
                    setWhisperSearchResults([]);
                    // Reset the flag after a short delay
                    setTimeout(() => setSkipAutoSelect(false), 1000);
                  }}
                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
                >
                  New Whisper
                </button>
              </div>
              <button
                onClick={async () => {
                  // Get recipient info from messages or search results
                  // For now, we'll need to find the recipient's info
                  // Since we only have heroId and heroName, we'll need to search or get from messages
                  const recipientMessage = messages.find(m => 
                    m.channel === 'whisper' && 
                    (m.heroId === activeWhisperRecipient.heroId || m.recipientHeroId === activeWhisperRecipient.heroId)
                  );
                  
                  // Try to get from search results first (most reliable - has user ID)
                  const searchResult = whisperSearchResults.find(r => r.heroId === activeWhisperRecipient.heroId);
                  if (searchResult) {
                    // Use twitchUserId if available, otherwise userId (both should be user IDs from search)
                    const inviteeUserId = searchResult.twitchUserId || searchResult.userId;
                    await handleInviteToParty(
                      inviteeUserId,
                      searchResult.username,
                      searchResult.heroId,
                      searchResult.heroName,
                      searchResult.heroRole,
                      searchResult.heroLevel
                    );
                  } else {
                    // Fallback: Use the hero ID - backend will look up the user ID
                    // This works because we have the heroId and the backend can fetch the user's Twitch ID from it
                    await handleInviteToParty(
                      activeWhisperRecipient.heroId, // Backend will detect this is a hero ID and convert it
                      activeWhisperRecipient.heroName,
                      activeWhisperRecipient.heroId,
                      activeWhisperRecipient.heroName,
                      'unknown', // Role not available from whisper recipient
                      1 // Level not available from whisper recipient
                    );
                  }
                }}
                className="w-full px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors font-semibold"
              >
                👥 Invite to Party
              </button>
            </div>
          ) : (
            <>
              <div className="mb-2">
                <label className="block text-xs text-gray-300 mb-1">Search for a user to whisper:</label>
                <input
                  type="text"
                  value={whisperSearch}
                  onChange={(e) => setWhisperSearch(e.target.value)}
                  placeholder="Search by username or hero name..."
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              {whisperSearch.trim().length > 0 && whisperSearchResults.length === 0 && (
                <div className="text-gray-500 text-xs mt-2">
                  No users found. Try a different search term.
                </div>
              )}
              {whisperSearchResults.length > 0 && (
                <div className="mt-2 bg-gray-700 rounded border border-gray-600 max-h-32 overflow-y-auto">
                  {whisperSearchResults.map((result, index) => (
                    <button
                      key={`${result.userId}-${result.heroId}-${index}`}
                      onClick={() => {
                        // Use hero ID for hero-to-hero messaging
                        handleStartWhisper(result.heroId, result.heroName || result.username);
                        setWhisperSearch('');
                        setWhisperSearchResults([]);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-600 transition-colors border-b border-gray-600 last:border-b-0"
                    >
                      <div className="text-white text-sm font-semibold">{result.username}</div>
                      <div className="text-xs text-gray-400">
                        {result.heroName} ({result.heroRole} Lv{result.heroLevel})
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <div className="text-gray-500 text-xs mt-2">
                Or select a user from chat and click "Whisper" to start a conversation.
              </div>
            </>
          )}
        </div>
      )}

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 bg-gray-900 rounded p-3 overflow-y-auto mb-3 space-y-2"
      >
        {filteredMessages.length === 0 ? (
          <div className="text-gray-500 text-sm text-center py-8">
            {activeChannel === 'whisper' && !activeWhisperRecipient 
              ? 'Select a user to start whispering'
              : activeChannel === 'whisper'
              ? `No messages with ${activeWhisperRecipient?.heroName} yet. Start the conversation!`
              : 'No messages yet. Be the first to say something!'}
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <div
              key={msg.id}
              className={`p-2 rounded ${
                msg.userId === (user?.id || user?.twitchUserId) ? 'bg-blue-900/30' : 'bg-gray-800/50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {/* Founder Badge - All Tiers */}
                    {(() => {
                      const badgePath = getFounderBadgePath(msg.founderPackTier);
                      const badgeTitle = getFounderBadgeTitle(msg.founderPackTier);
                      return badgePath ? (
                        <img
                          src={badgePath}
                          alt={badgeTitle}
                          className="w-4 h-4 object-contain"
                          title={badgeTitle}
                        />
                      ) : null;
                    })()}
                    <span className={`font-semibold text-sm ${getRoleColor(msg.heroRole)}`}>
                      {msg.heroName}
                    </span>
                    <span className="text-xs text-gray-500">({msg.heroRole})</span>
                    <span className="text-xs text-gray-600">
                      {formatTimestamp(msg.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-200 break-words">{msg.message}</p>
                </div>
                  <div className="flex items-center gap-1">
                  {/* User menu button (not own messages) */}
                  {msg.userId !== (user?.id || user?.twitchUserId) && (
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Use messageId instead of userId to ensure only one menu shows at a time
                          setShowUserMenu(showUserMenu === msg.id ? null : msg.id);
                        }}
                        className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-1"
                        title="User actions"
                      >
                        ⋮
                      </button>
                      {showUserMenu === msg.id && (
                        <div className="absolute right-0 top-6 bg-gray-800 border border-gray-600 rounded shadow-lg z-50 min-w-[120px]">
                          {blockedUserIds.has(msg.userId) ? (
                            <button
                              onClick={() => handleUnblockUser(msg.userId)}
                              className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-700 transition-colors"
                            >
                              Unblock User
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleStartWhisper(msg.heroId, msg.heroName)}
                                className="w-full text-left px-3 py-2 text-xs text-blue-400 hover:bg-gray-700 transition-colors"
                              >
                                💬 Whisper
                              </button>
                              <button
                                onClick={() => {
                                  // Ensure we use the user's Twitch ID, not hero ID
                                  // msg.userId should already be the Twitch user ID from the backend
                                  handleInviteToParty(
                                    msg.userId, // This should be Twitch user ID from backend
                                    msg.username,
                                    msg.heroId,
                                    msg.heroName,
                                    msg.heroRole,
                                    msg.heroLevel || 1
                                  );
                                }}
                                className="w-full text-left px-3 py-2 text-xs text-green-400 hover:bg-gray-700 transition-colors"
                              >
                                👥 Invite to Party
                              </button>
                              <button
                                onClick={() => {
                                  setShowReportModal({
                                    userId: msg.userId,
                                    messageId: msg.id,
                                    userName: msg.heroName
                                  });
                                  setShowUserMenu(null);
                                }}
                                className="w-full text-left px-3 py-2 text-xs text-orange-400 hover:bg-gray-700 transition-colors"
                              >
                                Report
                              </button>
                              <button
                                onClick={() => handleBlockUser(msg.userId)}
                                className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-gray-700 transition-colors"
                              >
                                Block User
                              </button>
                              {isAdmin && (
                                <>
                                  <div className="border-t border-gray-600 my-1"></div>
                                  <button
                                    onClick={async () => {
                                      if (!confirm(`Ban ${msg.heroName} from chat?`)) return;
                                      try {
                                        const userId = user?.id || user?.twitchId || '';
                                        const response = await webChatAPI.banUser(userId, msg.userId);
                                        if (response.success) {
                                          alert(response.message);
                                          setShowUserMenu(null);
                                        }
                                      } catch (error: any) {
                                        alert(error.response?.data?.error || 'Failed to ban user');
                                      }
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-gray-700 transition-colors"
                                  >
                                    🚫 Ban User (Admin)
                                  </button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Delete button (own messages or admin) */}
                  {(msg.userId === (user?.id || user?.twitchUserId) || isAdmin) && (
                    <button
                      onClick={() => {
                        if (isAdmin && msg.userId !== (user?.id || user?.twitchUserId)) {
                          handleAdminDeleteMessage(msg.id);
                        } else {
                          deleteMessage(msg.id);
                        }
                      }}
                      className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                      title={isAdmin ? 'Delete message (admin)' : 'Delete message'}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder={
            activeChannel === 'party' ? 'Type party message...' :
            activeChannel === 'whisper' ? (activeWhisperRecipient ? `Type message to ${activeWhisperRecipient.heroName}...` : 'Select a user to whisper...') :
            'Type world message...'
          }
          disabled={sending || !connected || (activeChannel === 'whisper' && !activeWhisperRecipient)}
          disabled={sending || !connected}
          maxLength={500}
          className="flex-1 bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={sending || !connected || !messageInput.trim() || (activeChannel === 'whisper' && !activeWhisperRecipient)}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
        >
          {sending ? '...' : 'Send'}
        </button>
      </form>

      {/* Character counter */}
      <div className="text-xs text-gray-500 mt-1 text-right">
        {messageInput.length} / 500
      </div>

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(null)}
        />
      )}

      {/* Filter Settings Modal */}
      {showFilterSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 backdrop-blur-sm" onClick={() => setShowFilterSettings(false)}>
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border-2 border-gray-600 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4">Chat Filter Settings</h3>
            
            <div className="space-y-4">
              {/* Maturity Filter Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-gray-300">Maturity Filter</label>
                <input
                  type="checkbox"
                  checked={filterSettings.maturityFilter}
                  onChange={(e) => {
                    const newSettings = { ...filterSettings, maturityFilter: e.target.checked };
                    setFilterSettings(newSettings);
                    saveFilterSettings(newSettings);
                  }}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
              </div>

              {/* Maturity Level */}
              {filterSettings.maturityFilter && (
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Maturity Level</label>
                  <select
                    value={filterSettings.maturityLevel}
                    onChange={(e) => {
                      const newSettings = { ...filterSettings, maturityLevel: e.target.value as MaturityLevel };
                      setFilterSettings(newSettings);
                      saveFilterSettings(newSettings);
                    }}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="none">None (Disabled)</option>
                    <option value="mild">Mild (Slurs Only)</option>
                    <option value="moderate">Moderate (Profanity)</option>
                    <option value="strict">Strict (All Inappropriate)</option>
                  </select>
                </div>
              )}

              {/* Blocked Words Filter Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-gray-300">Blocked Words Filter</label>
                <input
                  type="checkbox"
                  checked={filterSettings.blockedWordsFilter}
                  onChange={(e) => {
                    const newSettings = { ...filterSettings, blockedWordsFilter: e.target.checked };
                    setFilterSettings(newSettings);
                    saveFilterSettings(newSettings);
                  }}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
              </div>

              <div className="text-xs text-gray-400 mt-4 p-3 bg-gray-700/50 rounded">
                <strong>Note:</strong> Filters block messages containing:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Racial slurs and hate speech</li>
                  <li>Profanity (based on maturity level)</li>
                  <li>Other inappropriate content</li>
                </ul>
                Filtered messages are hidden from your view but still sent to the chat.
              </div>
            </div>

            <button
              onClick={() => setShowFilterSettings(false)}
              className="mt-6 w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setShowReportModal(null)}>
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border-2 border-gray-600 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4">Report User</h3>
            <p className="text-gray-300 mb-4">
              Reporting <span className="font-semibold">{showReportModal.userName}</span>
            </p>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-2">Reason</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value as any)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="spam">Spam</option>
                <option value="harassment">Harassment</option>
                <option value="inappropriate">Inappropriate Content</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReport}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold transition-colors"
              >
                Submit Report
              </button>
              <button
                onClick={() => setShowReportModal(null)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
