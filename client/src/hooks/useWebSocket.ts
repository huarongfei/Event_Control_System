// WebSocket Hook
import { useEffect, useState, useRef } from 'react';
import { message } from 'antd';

interface UseWebSocketOptions {
  onMessage?: (data: any) => void;
  onError?: (error: Event) => void;
  onClose?: () => void;
  reconnect?: boolean;
  reconnectInterval?: number;
}

export const useWebSocket = (
  path: string,
  options: UseWebSocketOptions = {}
) => {
  const {
    onMessage,
    onError,
    onClose,
    reconnect = true,
    reconnectInterval = 3000,
  } = options;

  const [data, setData] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = () => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';
    const fullUrl = `${wsUrl}${path}`;

    try {
      wsRef.current = new WebSocket(fullUrl);

      wsRef.current.onopen = () => {
        setConnected(true);
        console.log('WebSocket connected:', fullUrl);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const parsedData = JSON.parse(event.data);
          setData(parsedData);
          onMessage?.(parsedData);
        } catch (error) {
          setData(event.data);
          onMessage?.(event.data);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnected(false);
        onError?.(error);
      };

      wsRef.current.onclose = () => {
        setConnected(false);
        console.log('WebSocket disconnected');
        onClose?.();

        // Reconnect logic
        if (reconnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect...');
            connect();
          }, reconnectInterval);
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      message.error('WebSocket连接失败');
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
  };

  const sendMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      message.warning('WebSocket未连接');
    }
  };

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [path]);

  return {
    data,
    connected,
    sendMessage,
    disconnect,
  };
};
