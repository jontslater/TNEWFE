import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { webChatAPI } from '../api/client';

export interface ChatMessage {
  id: string;
  channel: 'party' | 'world' | 'whisper';
  userId: string;
  username: string;
  heroId: string;
  heroName: string;
  heroRole: string;
  message: string;
  timestamp: number;
  partyId?: string;
  recipientId?: string; // For whispers
  recipientHeroId?: string; // For whispers
  recipientHeroName?: string; // For whispers
  deletedAt?: number;
  founderPackTier?: string | null; // 'bronze' | 'silver' | 'gold' | 'platinum' | null
}

interface UseChatOptions {
  channel: 'party' | 'world' | 'whisper';
  partyId?: string;
  recipientId?: string; // For whispers - recipient hero ID
  enabled?: boolean;
  heroId?: string; // Current user's hero ID (required for whispers)
}

export function useChat({ channel, partyId, recipientId, enabled = true, heroId }: UseChatOptions) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [sending, setSending] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);

  // Load message history
  const loadHistory = useCallback(async () => {
    if (!enabled || !user) return;

    try {
      // For whispers, only load history if we have a recipient and hero ID
      // Otherwise, we'll rely on WebSocket messages
      if (channel === 'whisper' && (!recipientId || !heroId)) {
        console.log('[useChat] Skipping whisper history load - no recipient or hero ID');
        setMessages([]);
        return;
      }
      
      const response = await webChatAPI.getHistory(channel, partyId, recipientId, heroId);
      if (response.success) {
        setMessages(response.messages || []);
      } else if (response.error === 'Firestore index required' && response.indexUrl) {
        // Show index creation link in console
        console.warn('[useChat] Firestore index required for chat history');
        console.warn('[useChat] Create index at:', response.indexUrl);
        // Still set empty messages so chat works, just without history
        setMessages([]);
      }
    } catch (error: any) {
      console.error('[useChat] Error loading history:', error);
      // If it's an index error with a URL, log it
      if (error.response?.data?.indexUrl) {
        console.warn('[useChat] Firestore index required. Create at:', error.response.data.indexUrl);
      }
      // Set empty messages so chat still works (real-time messages will still come through)
      setMessages([]);
    }
  }, [channel, partyId, recipientId, enabled, user]);

  // Connect to WebSocket for real-time updates (only once, not when channel changes)
  useEffect(() => {
    const twitchId = user?.twitchId || user?.id;
    if (!enabled || !twitchId) return;

    // Only create connection if we don't have one already
    if (wsRef.current) {
      return; // Keep existing connection
    }

    const connect = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const host = apiUrl.replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '');
        const wsUrl = `${protocol}//${host}/ws?twitchId=${twitchId}&type=overlay`;

        console.log(`[useChat] 🔌 Connecting to WebSocket: ${wsUrl}`);
        
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('[useChat] ✅ WebSocket connected');
          setConnected(true);
          reconnectAttempts.current = 0;
          wsRef.current = ws;
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'chat:message') {
              const message = data.message as ChatMessage;
              
              // Normalize IDs to strings for consistent comparison
              const currentHeroId = String(heroId || '');
              const normalizedMessageHeroId = String(message.heroId || '');
              const normalizedMessageRecipientHeroId = String(message.recipientHeroId || '');
              
              // Filter messages based on current channel
              let shouldAdd = false;
              
              // Special handling: whispers are always relevant if hero is involved, regardless of active channel
              if (message.channel === 'whisper' && currentHeroId) {
                // Accept all whispers where current hero is sender or recipient
                shouldAdd = normalizedMessageHeroId === currentHeroId || normalizedMessageRecipientHeroId === currentHeroId;
                
                if (shouldAdd) {
                  console.log('[useChat] Adding whisper message (regardless of channel):', {
                    messageId: message.id,
                    messageHeroId: normalizedMessageHeroId,
                    messageRecipientHeroId: normalizedMessageRecipientHeroId,
                    currentHeroId: currentHeroId,
                    currentChannel: channel,
                    activeRecipientId: recipientId ? String(recipientId) : null
                  });
                } else {
                  console.log('[useChat] Whisper message does not involve current hero:', {
                    messageId: message.id,
                    messageHeroId: normalizedMessageHeroId,
                    messageRecipientHeroId: normalizedMessageRecipientHeroId,
                    currentHeroId: currentHeroId
                  });
                }
              } else if (message.channel === channel) {
                // For non-whisper channels, only add if matching current channel
                if (channel === 'party') {
                  shouldAdd = message.partyId === partyId;
                } else {
                  shouldAdd = true; // world chat
                }
              }
              
              if (shouldAdd) {
                setMessages(prev => {
                  // Avoid duplicates
                  if (prev.some(m => m.id === message.id)) {
                    return prev;
                  }
                  return [...prev, message];
                });
              }
            } else if (data.type === 'chat:message:deleted') {
              setMessages(prev => prev.filter(m => m.id !== data.messageId));
            }
          } catch (error) {
            console.error('[useChat] Error parsing WebSocket message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('[useChat] WebSocket error:', error);
          setConnected(false);
        };

        ws.onclose = (event) => {
          console.log('[useChat] WebSocket closed:', event.code, event.reason);
          setConnected(false);
          wsRef.current = null;

          // Reconnect with exponential backoff
          if (event.code !== 1000 && event.code !== 1001) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
            reconnectAttempts.current++;
            console.log(`[useChat] Reconnecting in ${delay}ms...`);
            reconnectTimeoutRef.current = setTimeout(connect, delay);
          }
        };

      } catch (error) {
        console.error('[useChat] Error connecting WebSocket:', error);
        setConnected(false);
      }
    };

    connect();

    return () => {
      // Don't close on unmount if we're just changing channels
      // Only close if the component is actually unmounting or user changes
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      // Only close if user changes (not channel/party change)
      // We'll keep the connection alive for channel switches
    };
  }, [enabled, user?.twitchId, user?.id, channel, partyId, recipientId]); // Include channel, partyId, recipientId for filtering

  // Load history on mount and when channel/party/recipient changes
  useEffect(() => {
    loadHistory();
  }, [loadHistory, channel, partyId, recipientId]); // Reload when these change

  // Send message
  const sendMessage = useCallback(async (message: string) => {
    if (!user || !message.trim() || sending || !heroId) return;

    setSending(true);
    try {
      const userId = user.id || user.twitchId || '';
      
      console.log('[useChat] Sending message:', {
        channel,
        userId,
        heroId,
        recipientId,
        partyId,
        messageLength: message.length
      });
      
      const response = await webChatAPI.sendMessage(
        userId,
        heroId,
        channel,
        message,
        partyId,
        recipientId
      );

      if (response.success) {
        console.log('[useChat] Message sent successfully, waiting for WebSocket:', response.messageId);
        // Message will be added via WebSocket
        return true;
      } else {
        console.error('[useChat] Failed to send message:', response.error);
        return false;
      }
    } catch (error: any) {
      console.error('[useChat] Error sending message:', error);
      console.error('[useChat] Error details:', error.response?.data);
      return false;
    } finally {
      setSending(false);
    }
  }, [user, channel, partyId, recipientId, sending, heroId]);

  // Delete message
  const deleteMessage = useCallback(async (messageId: string) => {
    if (!user) return false;

    try {
      const userId = user.id || user.twitchId || '';
      const response = await webChatAPI.deleteMessage(messageId, userId);
      return response.success;
    } catch (error) {
      console.error('[useChat] Error deleting message:', error);
      return false;
    }
  }, [user]);

  return {
    messages,
    connected,
    sending,
    sendMessage,
    deleteMessage,
    loadHistory
  };
}
