import { useState, useCallback, useEffect, useRef } from 'react';
import api, { publicApi } from '@/lib/api-client';

import { useCart } from './useCart';

export interface ChatProductType {
  id: number;
  name: string;
  price: number;
  image: string | null;
}

export interface ChatPanditType {
  id: number;
  name: string;
  language?: string;
  expertise?: string;
  rating?: number;
  experience_years?: number;
  is_available?: boolean;
  profile_pic?: string | null;
}

export interface ChatBookingType {
  id: number;
  status: string;
  service_name?: string;
  booking_date?: string;
  booking_time?: string;
  pandit_name?: string;
  payment_status?: boolean;
}

export interface ChatActionType {
  type: 'ADD_TO_CART' | 'SWITCH_MODE';
  product?: {
    id: number | string;
    title: string;
    price: number;
    image?: string;
  };
  quantity?: number;
  bookingId?: string;
  panditName?: string;
}

export interface ChatMessageType {
  id?: string;
  content: string;
  sender: 'user' | 'ai' | 'pandit';
  timestamp: string;
  mode?: 'guide' | 'interaction';
  products?: ChatProductType[];
  pandits?: ChatPanditType[];
  bookings?: ChatBookingType[];
  actions?: ChatActionType[];
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
  bookingId?: string;
  panditId?: string;
  panditName?: string;
  panditProfilePic?: string;
  switchMode: (id: string, name?: string) => void;
  initiateChat: (pId: string, pName?: string, pProfilePic?: string) => Promise<void>;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

export function useChat(initialBookingId?: string): UseChat {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'guide' | 'interaction'>('guide');
  const [isConnected, setIsConnected] = useState(false);
  const [currentBookingId, setCurrentBookingId] = useState<string | undefined>(initialBookingId);
  const [currentPanditId, setCurrentPanditId] = useState<string | undefined>(undefined);
  const [currentPanditName, setCurrentPanditName] = useState<string | undefined>(undefined);
  const [currentPanditProfilePic, setCurrentPanditProfilePic] = useState<string | undefined>(undefined);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { addItem } = useCart();

  // Auto-detect mode based on bookingId
  useEffect(() => {
    if (initialBookingId) {
      setCurrentBookingId(initialBookingId);
      setMode('interaction');
    }
  }, [initialBookingId]);

  const switchMode = useCallback((id: string, name?: string) => {
    setCurrentBookingId(id);
    setCurrentPanditName(name);
    setMode('interaction');
    setMessages([]); // Clear AI chat when switching to real-time? Or keep it? User might want context.
  }, []);

  const initiateChat = useCallback(async (pId: string, pName?: string, pProfilePic?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/chat/rooms/initiate/', { pandit_id: pId });
      const room = response.data;
      setCurrentBookingId(room.id.toString());
      setCurrentPanditId(pId);
      setCurrentPanditName(pName || room.pandit?.user?.full_name);
      setCurrentPanditProfilePic(pProfilePic || room.pandit?.user?.profile_pic);
      setMode('interaction');
      setMessages([]);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to initiate chat');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Connect WebSocket for interaction mode
  const connectWebSocket = useCallback((bkId: string, token: string) => {
    if (!bkId || !token) return;

    // Use backend WebSocket URL - not frontend's host
    const wsBaseUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
    // Pass JWT token as query parameter for authentication
    const wsUrl = `${wsBaseUrl}/ws/chat/${bkId}/?token=${encodeURIComponent(token)}`;

    console.log('Connecting to WebSocket:', wsUrl.replace(/token=.*/, 'token=***'));

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
          let response;
          try {
            response = await publicApi.post('/ai/chat/', {
              message: content,
            });
          } catch {
            // Backward compatibility fallback
            response = await publicApi.post('/chat/quick-chat/', {
              message: content,
            });
          }

          const actions = response.data.actions || [];
          
          // Agentic execution of actions (e.g., auto-add to cart)
          actions.forEach((action: ChatActionType) => {
            if (action.type === 'ADD_TO_CART' && action.product) {
              addItem(action.product, action.quantity || 1);
            }
            // We don't auto-switch mode without user click, but we'll show a button
          });

          const aiMessage: ChatMessageType = {
            id: Date.now().toString(),
            content: response.data.reply || response.data.response,
            sender: 'ai',
            timestamp: new Date().toISOString(),
            mode: 'guide',
            products: response.data.products || [],
            pandits: response.data.pandits || response.data.cards?.pandits || [],
            bookings: response.data.bookings || response.data.cards?.bookings || [],
            actions: actions,
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
        } else if (mode === 'interaction') {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
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
          } else if (currentBookingId) {
            // Fallback: Send via HTTP API if WebSocket not connected
            try {
              await api.post(`/chat/rooms/${currentBookingId}/messages/`, {
                content,
                message_type: 'TEXT',
              });
              
              // Add user message
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
            } catch (httpErr: any) {
              setError('Failed to send message. Please try again.');
            }
          } else {
            setError('Chat connection not established');
          }
        } else {
          setError('Chat not ready');
        }
      } catch (err: any) {
        const errorMsg = err?.response?.data?.error || err?.message || 'Failed to send message';
        setError(errorMsg);
        console.error('Error sending message:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [mode, addItem]
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
    bookingId: currentBookingId,
    panditId: currentPanditId,
    panditName: currentPanditName,
    panditProfilePic: currentPanditProfilePic,
    switchMode,
    initiateChat
  } as any;
}
