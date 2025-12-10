import { useEffect, useRef, useState } from 'react';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export function useWebSocket(twitchId: string | null, onMessage?: (message: WebSocketMessage) => void) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const onMessageRef = useRef(onMessage);

  // Keep the callback ref up to date without causing reconnects
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!twitchId) {
      console.log(`[useWebSocket] No twitchId provided, skipping connection. twitchId: ${twitchId}`);
      return;
    }

    console.log(`[useWebSocket] Setting up WebSocket connection for twitchId: ${twitchId}`);

    const connect = () => {
      try {
        // Determine WebSocket URL
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const host = apiUrl.replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '');
        const wsUrl = `${protocol}//${host}/ws?twitchId=${twitchId}&type=overlay`;

        console.log(`[useWebSocket] 🔌 Connecting to WebSocket: ${wsUrl}`);
        
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('✅ WebSocket connected');
          setConnected(true);
          reconnectAttempts.current = 0;
          wsRef.current = ws;
          
          // Set up client-side ping to keep connection alive (every 25 seconds)
          // This is in addition to server-side keepalive
          const pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              try {
                ws.send(JSON.stringify({ type: 'ping' }));
              } catch (error) {
                console.error('[useWebSocket] Error sending ping:', error);
                clearInterval(pingInterval);
              }
            } else {
              clearInterval(pingInterval);
            }
          }, 25000); // 25 seconds (slightly less than server's 30s keepalive)
          
          // Store interval ID on the WebSocket for cleanup
          (ws as any).pingInterval = pingInterval;
        };

        ws.onmessage = (event) => {
          try {
            // Handle binary ping frames (browser WebSocket auto-responds, but log for debugging)
            if (event.data instanceof Blob || event.data instanceof ArrayBuffer) {
              console.log('[useWebSocket] Received binary frame (ping/pong)');
              return;
            }
            
            const message = JSON.parse(event.data);
            
            // Handle JSON ping/pong messages
            if (message.type === 'ping') {
              console.log('[useWebSocket] Received ping, sending pong');
              ws.send(JSON.stringify({ type: 'pong' }));
              return;
            }
            
            if (message.type === 'pong') {
              console.log('[useWebSocket] Received pong');
              return;
            }
            
            console.log('📨 WebSocket message received:', message);
            if (onMessageRef.current) {
              onMessageRef.current(message);
            }
          } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
        };

        ws.onclose = (event) => {
          console.log(`🔌 WebSocket disconnected (code: ${event.code}, reason: ${event.reason || 'none'}, wasClean: ${event.wasClean})`);
          setConnected(false);
          
          // Clear ping interval if it exists
          if ((ws as any).pingInterval) {
            clearInterval((ws as any).pingInterval);
          }
          
          wsRef.current = null;

          // Don't reconnect if it was a clean close (user-initiated or intentional)
          if (event.code === 1000 || event.code === 1001) {
            console.log('[useWebSocket] Clean close, not reconnecting');
            return;
          }

          // Attempt to reconnect with exponential backoff
          if (reconnectAttempts.current < 5) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
            console.log(`🔄 Reconnecting in ${delay}ms... (attempt ${reconnectAttempts.current + 1})`);
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttempts.current++;
              connect();
            }, delay);
          } else {
            console.error('❌ Max reconnection attempts reached');
          }
        };
      } catch (error) {
        console.error('❌ WebSocket connection error:', error);
      }
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [twitchId]); // Only depend on twitchId, not onMessage

  const sendMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  };

  return { connected, sendMessage };
}
