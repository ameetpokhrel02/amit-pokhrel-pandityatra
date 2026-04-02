import React, { useEffect, useState, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Send, User, Clock, Search, Loader } from 'lucide-react';
import api from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { WS_BASE_URL } from '@/lib/helper';

interface ChatRoom {
  id: number;
  user: {
    id: number;
    full_name: string;
    profile_picture?: string;
  };
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
  is_pre_booking: boolean;
  booking?: {
    id: number;
    service_name: string;
    status: string;
  };
}

interface Message {
  id: number;
  content: string;
  sender: 'user' | 'pandit';
  sender_name: string;
  timestamp: string;
  is_read: boolean;
}

const PanditMessages: React.FC = () => {
  const { token } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isInitialLoadRef = useRef(true);
  const previousMessageCountRef = useRef(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch chat rooms
  useEffect(() => {
    fetchChatRooms();
  }, []);

  // Connect WebSocket when room is selected
  useEffect(() => {
    if (selectedRoom && token) {
      isInitialLoadRef.current = true;
      previousMessageCountRef.current = 0;
      connectWebSocket(selectedRoom.id);
      fetchMessages(selectedRoom.id);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [selectedRoom, token]);

  // Auto-scroll chat window to latest messages.
  useEffect(() => {
    if (!selectedRoom) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const isInitialLoad = isInitialLoadRef.current;
    const hasNewMessage = messages.length > previousMessageCountRef.current;

    if (isInitialLoad || hasNewMessage) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: isInitialLoad ? 'auto' : 'smooth',
      });
      isInitialLoadRef.current = false;
    }

    previousMessageCountRef.current = messages.length;
  }, [messages, selectedRoom]);

  const fetchChatRooms = async () => {
    try {
      const response = await api.get('/chat/rooms/');
      setChatRooms(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to fetch chat rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (roomId: number) => {
    try {
      const response = await api.get(`/chat/rooms/${roomId}/messages/`);
      setMessages(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const connectWebSocket = (roomId: number) => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const wsBaseUrl = WS_BASE_URL;
    const wsUrl = `${wsBaseUrl}/ws/chat/${roomId}/?token=${encodeURIComponent(token || '')}`;

    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'message') {
          const messageData = data.data;
          setMessages((prev) => {
            // Deduplicate if the message was already added optimistically
            const isDuplicate = prev.some(m => 
              m.id === messageData.id || 
              (m.id < 0 && m.content === messageData.content)
            );
            
            if (isDuplicate) {
              // Replace optimistic message with the real one from server
              return prev.map(m => 
                (m.id < 0 && m.content === messageData.content) ? messageData : m
              );
            }
            return [...prev, messageData];
          });

          // Update chat room's last message
          setChatRooms((prev) =>
            prev.map((room) =>
              room.id === selectedRoom?.id
                ? { ...room, last_message: messageData.content, last_message_time: messageData.timestamp }
                : room
            )
          );
        } else if (data.type === 'message_history') {
          setMessages(data.messages || []);
        }
      } catch {
        // Silent catch
      }
    };

    wsRef.current.onerror = () => {
      setIsConnected(false);
    };

    wsRef.current.onclose = () => {
      setIsConnected(false);
      if (wsRef.current === null) return;

      const delay = Math.min(1000 * 2 ** reconnectAttemptsRef.current, 30000);
      reconnectAttemptsRef.current += 1;
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket(roomId);
      }, delay);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear immediately for snappiness

    // Create optimistic message
    const optimisticMessage: Message = {
      id: -Date.now(),
      content: messageContent,
      sender: 'pandit',
      sender_name: 'You',
      timestamp: new Date().toISOString(),
      is_read: true
    };

    // Add optimistically
    setMessages(prev => [...prev, optimisticMessage]);

    setSendingMessage(true);
    try {
      // Try WebSocket first
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'message',
            content: messageContent,
          })
        );
      } else {
        // Fallback to HTTP
        const response = await api.post(`/chat/rooms/${selectedRoom.id}/messages/`, {
          content: messageContent,
        });

        // Replace optimistic message with real response if available
        if (response.data) {
          setMessages(prev => prev.map(m => m.id === optimisticMessage.id ? response.data : m));
        } else {
          fetchMessages(selectedRoom.id);
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
      setNewMessage(messageContent); // Restore content
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const filteredRooms = chatRooms.filter((room) =>
    room.user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return timestamp;
    }
  };

  return (
    <DashboardLayout userRole="pandit">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
          <p className="text-muted-foreground">Chat with your customers and respond to inquiries.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-220px)]">
          {/* Chat List */}
          <Card className="md:col-span-1 flex flex-col border-orange-100 overflow-hidden bg-white shadow-none">
            <CardHeader className="pb-3 bg-orange-50/30">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white border-orange-200 focus:ring-orange-500 h-9 text-sm"
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              <div className="h-full overflow-y-auto custom-scrollbar">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                  </div>
                ) : filteredRooms.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">No results</p>
                  </div>
                ) : (
                  <div className="divide-y divide-orange-50">
                    {filteredRooms.map((room) => (
                      <div
                        key={room.id}
                        className={`p-4 cursor-pointer transition-all duration-200 ${
                          selectedRoom?.id === room.id 
                            ? 'bg-orange-50 border-r-4 border-orange-500 shadow-inner' 
                            : 'hover:bg-orange-50/50'
                        }`}
                        onClick={() => setSelectedRoom(room)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <Avatar className="h-11 w-11 border-2 border-white shadow-sm">
                              <AvatarImage src={room.user?.profile_picture} />
                              <AvatarFallback className="bg-orange-100 text-orange-600 font-bold">
                                {room.user?.full_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            {room.unread_count > 0 && (
                              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-[10px] font-bold text-white border-2 border-white shadow-sm">
                                {room.unread_count}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className={cn(
                                "font-bold text-sm truncate",
                                room.unread_count > 0 ? "text-orange-950" : "text-gray-900"
                              )}>
                                {room.user?.full_name}
                              </p>
                            </div>
                            <p className="text-[11px] text-orange-600/70 truncate uppercase tracking-wider font-semibold mt-0.5">
                              {room.booking?.service_name || 'Inquiry'}
                            </p>
                            {room.last_message && (
                              <p className={cn(
                                "text-xs truncate mt-1",
                                room.unread_count > 0 ? "text-gray-900 font-semibold" : "text-gray-500"
                              )}>
                                {room.last_message}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
 
          {/* Chat Window */}
          <Card className="md:col-span-3 flex flex-col border-orange-100 overflow-hidden relative bg-white shadow-none">
            {!isConnected && selectedRoom && (
              <div className="absolute top-0 left-0 right-0 z-10 bg-yellow-50/90 backdrop-blur-sm border-b border-yellow-100 px-4 py-1.5 flex items-center justify-center gap-2">
                <Loader className="h-3 w-3 animate-spin text-yellow-600" />
                <span className="text-[11px] font-medium text-yellow-700 uppercase tracking-widest">Reconnecting divine link...</span>
              </div>
            )}
 
            {selectedRoom ? (
              <>
                <CardHeader className="border-b py-4 bg-white z-20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border-2 border-orange-100">
                        <AvatarImage src={selectedRoom.user?.profile_picture} />
                        <AvatarFallback className="bg-orange-100 text-orange-600 font-bold text-lg">
                          {selectedRoom.user?.full_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-xl font-bold text-orange-950">{selectedRoom.user?.full_name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] uppercase border-orange-200 text-orange-700 bg-orange-50">
                            {selectedRoom.is_pre_booking ? 'Consultation' : 'Active Booking'}
                          </Badge>
                          <span className="text-xs text-muted-foreground font-medium">
                            • Customer
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden flex flex-col bg-white">
                  <div 
                    ref={scrollContainerRef}
                    className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar"
                    style={{ overflowAnchor: 'none' }}
                  >
                    <div className="space-y-6">
                      {messages.map((message, idx) => (
                        <div
                          key={message.id || idx}
                          className={`flex ${message.sender === 'pandit' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={cn(
                              "max-w-[75%] rounded-2xl px-5 py-3 relative group",
                              message.sender === 'pandit'
                                ? 'bg-orange-600 text-white rounded-tr-none'
                                : 'bg-white text-gray-800 border-l-4 border-orange-500 rounded-tl-none'
                            )}
                          >
                            <p className="text-[14px] leading-relaxed font-medium">{message.content}</p>
                            <div
                              className={cn(
                                "text-[10px] mt-2 flex items-center gap-1 font-bold uppercase tracking-tight opacity-70",
                                message.sender === 'pandit' ? 'text-orange-100' : 'text-gray-400'
                              )}
                            >
                              <Clock className="h-3 w-3" />
                              {formatTime(message.timestamp)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 bg-white border-t border-orange-50">
                    <div className="flex gap-3 max-w-4xl mx-auto items-end">
                      <div className="flex-1 relative">
                        <Input
                          placeholder="Type your message with devotion..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          disabled={sendingMessage}
                          className="pr-12 bg-orange-50/30 border-orange-100 focus:border-orange-500 focus:ring-0 rounded-2xl py-6 text-sm transition-all"
                        />
                      </div>
                      <Button 
                        onClick={sendMessage} 
                        disabled={sendingMessage || !newMessage.trim()}
                        className="h-12 w-12 rounded-full bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-600/20 active:scale-95 transition-all p-0 flex items-center justify-center shrink-0"
                      >
                        <Send className="h-5 w-5" />
                      </Button>
                    </div>
                    <p className="text-[9px] text-center text-gray-400 mt-2.5 font-bold uppercase tracking-widest opacity-60">
                      Messages are encrypted and private
                    </p>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center bg-orange-50/10">
                <div className="text-center space-y-4 max-w-sm">
                  <div className="h-24 w-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto shadow-inner ring-4 ring-orange-50">
                    <MessageCircle className="h-12 w-12 text-orange-500 opacity-60" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-orange-900">Your Spiritual Inbox</h3>
                    <p className="text-sm text-gray-600 leading-relaxed font-medium">
                      Select a conversation on the left to provide guidance to your devotees.
                    </p>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PanditMessages;
