import { useState, useCallback, useEffect } from 'react';
import useWebSocketStore from 'react-use-websocket';

export interface BrainEvent {
  type: string;
  timestamp: string;
  data: any;
}

export function useWebSocket() {
  const [events, setEvents] = useState<BrainEvent[]>([]);
  
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws/brain-activity`;
  
  const { lastJsonMessage, readyState } = useWebSocketStore<BrainEvent>(wsUrl, {
    shouldReconnect: () => true,
    reconnectInterval: 2000,
    reconnectAttempts: 10,
    share: true, // Allow multiple components to hook into the same stream
  });

  useEffect(() => {
    if (lastJsonMessage) {
      setEvents(prev => {
        const next = [lastJsonMessage, ...prev];
        return next.slice(0, 100);
      });
      window.dispatchEvent(new CustomEvent('neuro_ws_event', { detail: lastJsonMessage }));
    }
  }, [lastJsonMessage]);

  const isConnected = readyState === 1; // WebSocket.OPEN is 1

  return { events, isConnected };
}
