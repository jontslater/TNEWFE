import { useState, useEffect, useRef } from 'react';
import { useChat, ChatMessage } from '../hooks/useChat';
import { useAuth } from '../hooks/useAuth';
import { Hero } from '../types/Hero';
import { webChatAPI, partyAPI, guildAPI } from '../api/client';
import { getFilterSettings, saveFilterSettings, shouldFilterMessage, FilterSettings, MaturityLevel } from '../utils/contentFilter';
import '../utils/testContentFilter'; // Load test utilities

interface ChatPanelProps {
  hero: Hero | null;
  partyId?: string;
  partyLeaderId?: string; // To check if current user can invite
  guildId?: string; // Current user's guild ID
  onPartyUpdate?: () => void; // Callback to refresh party data
  whisperRequest?: { heroId: string; heroName: string } | null; // Request to start whisper
  onWhisperRequestHandled?: () => void; // Callback when whisper is handled
}

export default function ChatPanel({ hero, partyId, partyLeaderId, guildId, onPartyUpdate, whisperRequest, onWhisperRequestHandled }: ChatPanelProps) {
  const { user } = useAuth();
  const [activeChannel, setActiveChannel] = useState<'party' | 'world' | 'whisper' | 'guild'>('world');
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
  const [selectedConversation, setSelectedConversation] = useState<{ heroId: string; heroName: string } | null>(null); // Selected whisper conversation
  
  // Admin check
  const isAdmin = user?.twitchUsername?.toLowerCase() === 'theneverendingwar';

  // Determine if user is in a party and is the leader
  const isInParty = !!partyId;
  const isInGuild = !!guildId;
  const userId = user?.twitchId || user?.id || '';
  
  // Debug logging for guild chat
  if (guildId) {
    console.log('[ChatPanel] Guild chat available:', { guildId, isInGuild });
  }
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
  const currentGuildId = activeChannel === 'guild' ? guildId : undefined;
  const currentRecipientHeroId = activeChannel === 'whisper' ? activeWhisperRecipient?.heroId : undefined;
  
  // Debug logging for whisper recipient
  useEffect(() => {
    if (activeChannel === 'whisper') {
      console.log('[ChatPanel] Whisper channel active, recipient:', {
        activeWhisperRecipient,
        currentRecipientHeroId,
        heroId: hero?.id
      });
    }
  }, [activeChannel, activeWhisperRecipient, currentRecipientHeroId, hero?.id]);

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
    guildId: currentGuildId,
    recipientId: currentRecipientHeroId,
    enabled: true,
    heroId: hero?.id
  });

  // Handle starting a whisper from user menu or search
  const handleStartWhisper = (heroId: string, heroName: string) => {
    console.log('[ChatPanel] Starting whisper with:', { heroId, heroName });
    // Use hero ID for hero-to-hero messaging
    setActiveWhisperRecipient({ heroId, heroName });
    setActiveChannel('whisper');
    setShowUserMenu(null);
    // Clear search when starting a whisper
    setWhisperSearch('');
    setWhisperSearchResults([]);
    console.log('[ChatPanel] Whisper started, channel set to whisper, recipient:', { heroId, heroName });
  };

  // Handle whisper request from external component (e.g., GuildPanel)
  // Use a ref to track if we've processed this request to avoid re-processing
  const processedWhisperRequestRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (whisperRequest && whisperRequest.heroId && whisperRequest.heroName) {
      // Check if we've already processed this request
      const requestKey = `${whisperRequest.heroId}-${whisperRequest.heroName}`;
      if (processedWhisperRequestRef.current === requestKey) {
        console.log('[ChatPanel] Already processed this whisper request, skipping');
        return;
      }
      
      console.log('[ChatPanel] Handling whisper request:', whisperRequest);
      processedWhisperRequestRef.current = requestKey;
      
      // Store the request values to avoid stale closure
      const requestHeroId = whisperRequest.heroId;
      const requestHeroName = whisperRequest.heroName;
      
      // Use a delay to ensure SocialSidebar has switched to chat section and ChatPanel is mounted
      const timer = setTimeout(() => {
        console.log('[ChatPanel] Executing whisper request after delay');
        // Use the same handleStartWhisper function that works from chat messages
        handleStartWhisper(requestHeroId, requestHeroName);
        
        // Clear the request after processing - delay to ensure state updates are applied
        // Don't clear immediately to prevent any race conditions
        if (onWhisperRequestHandled) {
          setTimeout(() => {
            console.log('[ChatPanel] Clearing whisper request');
            onWhisperRequestHandled();
            // Reset the processed ref after clearing
            processedWhisperRequestRef.current = null;
          }, 1000); // Longer delay to ensure state is fully set and stable
        }
      }, 200); // Delay to ensure component is fully mounted and chat section is active
      return () => clearTimeout(timer);
    } else {
      // Reset processed ref when whisperRequest is cleared
      processedWhisperRequestRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [whisperRequest]);

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

  // Auto-select whisper recipient when receiving a whisper message
  // This runs when:
  // 1. User switches to whisper channel and there's a recent whisper
  // 2. A new whisper arrives and no recipient is selected
  // 3. A new whisper arrives from someone different than the currently selected recipient
  useEffect(() => {
    if (!hero?.id) return;
    
    const currentHeroId = String(hero.id);
    
    // Find all whispers involving this hero, sorted by most recent
    const relevantWhispers = messages
      .filter(m => {
        if (m.channel !== 'whisper' || m.deletedAt) return false;
        const messageHeroId = String(m.heroId || '');
        const messageRecipientHeroId = String(m.recipientHeroId || '');
        return messageHeroId === currentHeroId || messageRecipientHeroId === currentHeroId;
      })
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    
    if (relevantWhispers.length === 0) return;
    
    const mostRecentWhisper = relevantWhispers[0];
    const messageHeroId = String(mostRecentWhisper.heroId || '');
    const messageRecipientHeroId = String(mostRecentWhisper.recipientHeroId || '');
    
    // Determine the other party (sender or recipient)
    const otherHeroId = messageHeroId === currentHeroId ? messageRecipientHeroId : messageHeroId;
    const otherHeroName = messageHeroId === currentHeroId 
      ? (mostRecentWhisper.recipientHeroName || 'Unknown')
      : (mostRecentWhisper.heroName || 'Unknown');
    
    if (!otherHeroId || otherHeroId === currentHeroId) return;
    
    // Auto-select if:
    // 1. No recipient is selected and we're on whisper channel (or just switched to it)
    // 2. We're on whisper channel and the most recent whisper is from someone different
    const shouldAutoSelect = 
      (!activeWhisperRecipient && !skipAutoSelect) ||
      (activeChannel === 'whisper' && activeWhisperRecipient && 
       String(activeWhisperRecipient.heroId) !== otherHeroId && 
       !skipAutoSelect &&
       // Only auto-select if the most recent whisper is very recent (within last 30 seconds)
       (Date.now() - (mostRecentWhisper.timestamp || 0)) < 30000);
    
    if (shouldAutoSelect) {
      console.log('[ChatPanel] Auto-selecting whisper recipient:', {
        otherHeroId,
        otherHeroName,
        messageId: mostRecentWhisper.id,
        reason: !activeWhisperRecipient ? 'no recipient selected' : 'new whisper from different user'
      });
      setActiveWhisperRecipient({ heroId: otherHeroId, heroName: otherHeroName });
      // If we're not on whisper channel, switch to it
      if (activeChannel !== 'whisper') {
        setActiveChannel('whisper');
      }
    }
  }, [messages, activeChannel, hero?.id, activeWhisperRecipient, skipAutoSelect]);

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

  // Get color for the entire role (legacy, used for hero name)
  const getRoleColor = (role: string) => {
    const roleLower = role.toLowerCase();
    if (['guardian', 'paladin', 'warden', 'bloodknight', 'vanguard', 'brewmaster'].includes(roleLower)) {
      return 'text-blue-400'; // Tank
    } else if (['cleric', 'atoner', 'druid', 'lightbringer', 'shaman', 'mistweaver', 'chronomancer', 'bard'].includes(roleLower)) {
      return 'text-green-400'; // Healer
    }
    return 'text-red-400'; // DPS
  };

  // Get class-specific color for individual class names in chat
  const getClassColor = (role: string): string => {
    const roleLower = role.toLowerCase();
    
    // Tanks - various shades of blue/cyan
    const tankColors: Record<string, string> = {
      guardian: 'text-blue-300',      // Light blue
      paladin: 'text-cyan-300',       // Cyan
      warden: 'text-teal-300',        // Teal
      bloodknight: 'text-red-400',    // Red (blood theme)
      vanguard: 'text-indigo-300',    // Indigo
      brewmaster: 'text-amber-400',   // Amber (brew theme)
    };
    
    // Healers - various shades of green/emerald
    const healerColors: Record<string, string> = {
      cleric: 'text-green-300',       // Light green
      atoner: 'text-emerald-300',     // Emerald
      druid: 'text-lime-400',         // Lime
      lightbringer: 'text-yellow-300', // Yellow (light theme)
      shaman: 'text-purple-300',      // Purple (spirit theme)
      mistweaver: 'text-sky-300',     // Sky blue (mist theme)
      chronomancer: 'text-violet-300', // Violet (time theme)
      bard: 'text-pink-300',          // Pink (music theme)
    };
    
    // DPS - various shades of red/orange/yellow
    const dpsColors: Record<string, string> = {
      berserker: 'text-red-500',      // Bright red
      crusader: 'text-orange-400',     // Orange
      assassin: 'text-gray-400',       // Gray (stealth theme)
      reaper: 'text-slate-400',        // Slate (death theme)
      bladedancer: 'text-fuchsia-400', // Fuchsia
      monk: 'text-yellow-400',        // Yellow
      stormwarrior: 'text-blue-400',  // Blue (storm theme)
      hunter: 'text-green-500',        // Green (nature theme)
      mage: 'text-purple-400',         // Purple (magic theme)
      warlock: 'text-purple-600',      // Dark purple (dark magic)
      ranger: 'text-emerald-400',      // Emerald (nature theme)
      shadowpriest: 'text-indigo-400', // Indigo (shadow theme)
      mooncaller: 'text-blue-200',    // Light blue (moon theme)
      stormcaller: 'text-cyan-400',   // Cyan (storm theme)
      dragonsorcerer: 'text-red-600', // Dark red (dragon theme)
    };
    
    // Check all color maps
    if (tankColors[roleLower]) return tankColors[roleLower];
    if (healerColors[roleLower]) return healerColors[roleLower];
    if (dpsColors[roleLower]) return dpsColors[roleLower];
    
    // Default fallback
    return 'text-gray-300';
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

    // Filter messages by current channel, party, guild, blocked users, and content
  const filteredMessages = messages.filter(m => {
    if (m.deletedAt) return false;
    
    // Special case: whispers should be visible when on whisper channel, even if not from active recipient
    // This ensures recipients can see whispers sent to them
    if (m.channel === 'whisper' && activeChannel === 'whisper') {
      // Will be handled in the whisper-specific filtering below
    } else if (m.channel !== activeChannel) {
      return false;
    }
    if (activeChannel === 'party' && m.partyId !== partyId) return false;
    if (activeChannel === 'guild') {
      // Normalize guildIds to strings for comparison
      const messageGuildId = String(m.guildId || '');
      const currentGuildId = String(guildId || '');
      if (messageGuildId !== currentGuildId) {
        console.log('[ChatPanel] Filtering out guild message (guildId mismatch):', {
          messageId: m.id,
          messageGuildId,
          currentGuildId,
          messageChannel: m.channel,
          activeChannel
        });
        return false;
      }
    }
    if (activeChannel === 'whisper') {
      // For whispers, filter based on selected conversation
      // Normalize IDs to strings for consistent comparison
      const currentHeroId = String(hero?.id || '');
      const messageHeroId = String(m.heroId || '');
      const messageRecipientHeroId = String(m.recipientHeroId || '');
      
      // If no current hero, filter out
      if (!currentHeroId) {
        return false;
      }
      
      // Check if this message involves the current hero
      const involvesCurrentHero = messageHeroId === currentHeroId || messageRecipientHeroId === currentHeroId;
      if (!involvesCurrentHero) {
        return false;
      }
      
      // If no conversation selected, don't show any messages (user needs to select a conversation)
      if (!selectedConversation) {
        return false;
      }
      
      // Filter to only show messages from the selected conversation
      // A conversation is between currentHeroId and selectedConversation.heroId
      const selectedHeroId = String(selectedConversation.heroId);
      const isFromSelectedConversation = 
        (messageHeroId === currentHeroId && messageRecipientHeroId === selectedHeroId) ||
        (messageHeroId === selectedHeroId && messageRecipientHeroId === currentHeroId);
      
      return isFromSelectedConversation;
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

  // Group whispers into conversations for the conversation list
  const whisperConversations = (() => {
    if (!hero?.id || activeChannel !== 'whisper') return [];
    
    const currentHeroId = String(hero.id);
    const conversationMap = new Map<string, {
      heroId: string;
      heroName: string;
      heroRole?: string;
      heroLevel?: number;
      lastMessage: ChatMessage;
      unreadCount: number;
    }>();
    
    // Find all whispers involving current hero
    messages
      .filter(m => {
        if (m.channel !== 'whisper' || m.deletedAt) return false;
        const messageHeroId = String(m.heroId || '');
        const messageRecipientHeroId = String(m.recipientHeroId || '');
        return messageHeroId === currentHeroId || messageRecipientHeroId === currentHeroId;
      })
      .forEach(m => {
        const messageHeroId = String(m.heroId || '');
        const messageRecipientHeroId = String(m.recipientHeroId || '');
        
        // Determine the other participant
        const otherHeroId = messageHeroId === currentHeroId ? messageRecipientHeroId : messageHeroId;
        const otherHeroName = messageHeroId === currentHeroId 
          ? (m.recipientHeroName || 'Unknown')
          : (m.heroName || 'Unknown');
        
        if (!otherHeroId || otherHeroId === currentHeroId) return;
        
        const existing = conversationMap.get(otherHeroId);
        if (!existing || (m.timestamp || 0) > (existing.lastMessage.timestamp || 0)) {
          conversationMap.set(otherHeroId, {
            heroId: otherHeroId,
            heroName: otherHeroName,
            heroRole: m.heroRole,
            heroLevel: m.heroLevel,
            lastMessage: m,
            unreadCount: 0 // Could implement unread tracking later
          });
        }
      });
    
    // Sort by most recent message
    return Array.from(conversationMap.values())
      .sort((a, b) => (b.lastMessage.timestamp || 0) - (a.lastMessage.timestamp || 0));
  })();

  // Auto-select conversation when switching to whisper channel or receiving a new whisper
  useEffect(() => {
    if (activeChannel === 'whisper' && whisperConversations.length > 0) {
      // If no conversation selected, select the most recent one
      if (!selectedConversation) {
        const mostRecent = whisperConversations[0];
        setSelectedConversation({ heroId: mostRecent.heroId, heroName: mostRecent.heroName });
        setActiveWhisperRecipient({ heroId: mostRecent.heroId, heroName: mostRecent.heroName });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChannel, whisperConversations.length, selectedConversation]);

  // Sync selectedConversation with activeWhisperRecipient when starting a new whisper
  useEffect(() => {
    if (activeWhisperRecipient && activeChannel === 'whisper') {
      // Check if this is a new conversation or existing one
      const existingConversation = whisperConversations.find(
        c => c.heroId === activeWhisperRecipient.heroId
      );
      
      if (!existingConversation) {
        // New conversation - add it to selected
        setSelectedConversation({
          heroId: activeWhisperRecipient.heroId,
          heroName: activeWhisperRecipient.heroName
        });
      } else if (selectedConversation?.heroId !== activeWhisperRecipient.heroId) {
        // Switch to existing conversation
        setSelectedConversation({
          heroId: activeWhisperRecipient.heroId,
          heroName: activeWhisperRecipient.heroName
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWhisperRecipient, activeChannel, whisperConversations]);

  return (
    <div className="bg-gray-800 rounded-lg p-5 border border-gray-700 flex flex-col h-[700px]">
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
            if (isInGuild) {
              setActiveChannel('guild');
            }
          }}
          onMouseDown={(e) => {
            e.preventDefault(); // Prevent focus which can cause scroll
          }}
          disabled={!isInGuild}
          title={!isInGuild ? 'Join a guild to use guild chat' : 'Guild chat'}
          className={`flex-1 px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
            !isInGuild
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
              : activeChannel === 'guild'
              ? 'bg-orange-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          🛡️ Guild
        </button>
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

      {/* Whisper Conversations List and Selection */}
      {activeChannel === 'whisper' && (
        <div className="flex gap-3 mb-3 flex-1 min-h-0 overflow-hidden">
          {/* Conversation List */}
          <div className="flex-1 bg-gray-900 rounded p-3 flex flex-col">
            <div className="text-sm text-gray-300 mb-3 px-1 font-semibold">Conversations</div>
            <div className="flex-1 overflow-y-auto space-y-1.5">
              {whisperConversations.length === 0 ? (
                <div className="text-xs text-gray-500 px-2 py-4 text-center">
                  No conversations yet
                </div>
              ) : (
                whisperConversations.map((conv) => {
                  const isSelected = selectedConversation?.heroId === conv.heroId;
                  const lastMessagePreview = conv.lastMessage.message.substring(0, 30) + (conv.lastMessage.message.length > 30 ? '...' : '');
                  const lastMessageTime = conv.lastMessage.timestamp ? new Date(conv.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                  
                  return (
                    <button
                      key={conv.heroId}
                      onClick={() => {
                        setSelectedConversation({ heroId: conv.heroId, heroName: conv.heroName });
                        setActiveWhisperRecipient({ heroId: conv.heroId, heroName: conv.heroName });
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded transition-colors ${
                        isSelected 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                      }`}
                    >
                      <div className="font-semibold text-sm truncate mb-1">{conv.heroName}</div>
                      <div className={`text-xs truncate mb-1 ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>
                        {lastMessagePreview}
                      </div>
                      <div className={`text-xs ${isSelected ? 'text-blue-200' : 'text-gray-500'}`}>
                        {lastMessageTime}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            <button
              onClick={() => {
                setActiveWhisperRecipient(null);
                setSelectedConversation(null);
                setWhisperSearch('');
                setWhisperSearchResults([]);
              }}
              className="mt-3 w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors font-semibold"
            >
              + New Whisper
            </button>
          </div>

          {/* Conversation View / New Whisper Form - Only show when no conversation selected */}
          {!selectedConversation && !activeWhisperRecipient && (
            <div className="flex-1 bg-gray-900 rounded p-4 min-w-0 flex flex-col">
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
            </div>
          )}
        </div>
      )}

      {/* Legacy Whisper Recipient Selection - Hidden now, using conversation view above */}
      {false && activeChannel === 'whisper' && (
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
            {activeChannel === 'whisper' && !selectedConversation 
              ? 'Select a conversation from the list to view messages'
              : activeChannel === 'whisper'
              ? `No messages with ${selectedConversation?.heroName} yet. Start the conversation!`
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
                    <span className="font-semibold text-sm text-white">
                      {msg.heroName} lvl {msg.heroLevel || 1}{' '}
                      <span className={getClassColor(msg.heroRole)}>{msg.heroRole}</span>
                    </span>
                    <span className="text-xs text-gray-600 ml-2">
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
          onChange={(e) => {
            // Only update state, no expensive operations here
            setMessageInput(e.target.value);
          }}
          placeholder={
            activeChannel === 'party' ? 'Type party message...' :
            activeChannel === 'guild' ? 'Type guild message...' :
            activeChannel === 'whisper' ? (activeWhisperRecipient ? `Type message to ${activeWhisperRecipient.heroName}...` : 'Select a user to whisper...') :
            'Type world message...'
          }
          disabled={sending || !connected || (activeChannel === 'whisper' && !activeWhisperRecipient) || (activeChannel === 'guild' && !guildId)}
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
