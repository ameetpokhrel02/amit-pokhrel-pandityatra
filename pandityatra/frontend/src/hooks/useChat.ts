import { useState, useCallback, useEffect, useRef } from 'react';
import { api } from '@/services/api';

export interface ChatMessageType {
  id?: string;
  content: string;
  sender: 'user' | 'ai' | 'pandit';
  timestamp: string;
  mode?: 'guide' | 'interaction';
}

export interface UseChat {
  messages: ChatMessageType[];
  isLoading: boolean;
  error: string | null;
  mode: 'guide' | 'interaction';
  sendMessage: (content: string) => Promise<void>;
  setMode: (mode: 'guide' | 'interaction') => void;
  clearMessages: () => void;
  connectWebSocket: (bookingId: string, token: string) => void;
  disconnectWebSocket: () => void;
  isConnected: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

export function useChat(bookingId?: string): UseChat {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'guide' | 'interaction'>('guide');
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-detect mode based on bookingId
  useEffect(() => {
    if (bookingId) {
      setMode('interaction');
    } else {
      setMode('guide');
    }
  }, [bookingId]);

  // Connect WebSocket for interaction mode
  const connectWebSocket = useCallback((bkId: string, token: string) => {
    if (!bkId || !token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/puja/${bkId}/`;

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('Puja chat connected');
        setIsConnected(true);
        setError(null);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'message_history') {
            setMessages(data.messages || []);
          } else if (data.type === 'message') {
            const messageData = data.data;
            setMessages((prev) => [
              ...prev,
              {
                id: messageData.id?.toString(),
                content: messageData.content,
                sender: messageData.sender === 'pandit' ? 'pandit' : 'user',
                timestamp: messageData.timestamp,
                mode: 'interaction',
              },
            ]);
          } else if (data.type === 'user_joined') {
            console.log(`${data.username} joined the puja`);
          } else if (data.type === 'user_left') {
            console.log(`${data.username} left the puja`);
          }
        } catch (parseError) {
          console.error('Error parsing WebSocket message:', parseError);
        }
      };

      wsRef.current.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError('Connection error');
        setIsConnected(false);
      };

      wsRef.current.onclose = () => {
        console.log('Puja chat disconnected');
        setIsConnected(false);
        // Try to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          if (wsRef.current === null) {
            connectWebSocket(bkId, token);
          }
        }, 3000);
      };
    } catch (err) {
      console.error('Error creating WebSocket:', err);
      setError('Failed to connect');
    }
  }, []);

  // Disconnect WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    setIsConnected(false);
  }, []);

  // Send message (guide or interaction mode)
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      setIsLoading(true);
      setError(null);

      try {
        if (mode === 'guide') {
          // Quick Chat API call (Groq AI)
          const response = await api.post('/chat/quick-chat/', {
            message: content,
          });

          const aiMessage: ChatMessageType = {
            id: Date.now().toString(),
            content: response.data.reply || response.data.response,
            sender: 'ai',
            timestamp: new Date().toISOString(),
            mode: 'guide',
          };

          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              content,
              sender: 'user',
              timestamp: new Date().toISOString(),
              mode: 'guide',
            },
            aiMessage,
          ]);
        } else if (mode === 'interaction' && wsRef.current?.readyState === WebSocket.OPEN) {
          // WebSocket message
          wsRef.current.send(
            JSON.stringify({
              content,
              message_type: 'TEXT',
            })
          );

          // Add user message optimistically
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              content,
              sender: 'user',
              timestamp: new Date().toISOString(),
              mode: 'interaction',
            },
          ]);
        } else {
          setError('Not connected to puja');
        }
      } catch (err: any) {
        const errorMsg = err?.response?.data?.error || err?.message || 'Failed to send message';
        setError(errorMsg);
        console.error('Error sending message:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [mode]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    error,
    mode,
    sendMessage,
    setMode,
    clearMessages,
    connectWebSocket,
    disconnectWebSocket,
    isConnected,
  };
}
