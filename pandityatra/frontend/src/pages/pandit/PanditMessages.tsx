import React, { useEffect, useState, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Send, User, Clock, Search } from 'lucide-react';
import api from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch chat rooms
  useEffect(() => {
    fetchChatRooms();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Connect WebSocket when room is selected
  useEffect(() => {
    if (selectedRoom && token) {
      connectWebSocket(selectedRoom.id);
      fetchMessages(selectedRoom.id);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [selectedRoom, token]);

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

    const wsBaseUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
    const wsUrl = `${wsBaseUrl}/ws/chat/${roomId}/?token=${encodeURIComponent(token || '')}`;

    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'message') {
          const messageData = data.data;
          setMessages((prev) => [
            ...prev,
            {
              id: messageData.id,
              content: messageData.content,
              sender: messageData.sender,
              sender_name: messageData.sender_name,
              timestamp: messageData.timestamp,
              is_read: true,
            },
          ]);
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
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket disconnected');
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom) return;

    setSendingMessage(true);
    try {
      // Try WebSocket first
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'message',
            content: newMessage,
          })
        );
      } else {
        // Fallback to HTTP
        await api.post(`/chat/rooms/${selectedRoom.id}/messages/`, {
          content: newMessage,
        });
        // Refresh messages
        fetchMessages(selectedRoom.id);
      }
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-220px)]">
          {/* Chat List */}
          <Card className="md:col-span-1 flex flex-col">
            <CardHeader className="pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              <div className="h-full overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-muted-foreground">Loading...</div>
                ) : filteredRooms.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No conversations yet</p>
                    <p className="text-sm">When users message you, they'll appear here</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredRooms.map((room) => (
                      <div
                        key={room.id}
                        className={`p-4 cursor-pointer hover:bg-accent transition-colors ${
                          selectedRoom?.id === room.id ? 'bg-accent' : ''
                        }`}
                        onClick={() => setSelectedRoom(room)}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={room.user.profile_picture} />
                            <AvatarFallback>
                              <User className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium truncate">{room.user.full_name}</p>
                              {room.unread_count > 0 && (
                                <Badge variant="default" className="ml-2 bg-primary">
                                  {room.unread_count}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {room.is_pre_booking ? (
                                <Badge variant="outline" className="text-xs">Pre-booking</Badge>
                              ) : room.booking ? (
                                <Badge variant="secondary" className="text-xs">
                                  {room.booking.service_name}
                                </Badge>
                              ) : null}
                            </div>
                            {room.last_message && (
                              <p className="text-sm text-muted-foreground truncate mt-1">
                                {room.last_message}
                              </p>
                            )}
                            {room.last_message_time && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <Clock className="h-3 w-3" />
                                {formatTime(room.last_message_time)}
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
          <Card className="md:col-span-2 flex flex-col">
            {selectedRoom ? (
              <>
                <CardHeader className="border-b pb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedRoom.user.profile_picture} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{selectedRoom.user.full_name}</CardTitle>
                      <div className="flex items-center gap-2">
                        {selectedRoom.is_pre_booking ? (
                          <Badge variant="outline" className="text-xs">Pre-booking Inquiry</Badge>
                        ) : selectedRoom.booking ? (
                          <Badge variant="secondary" className="text-xs">
                            Booking: {selectedRoom.booking.service_name}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
                  <div className="flex-1 p-4 overflow-y-auto">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender === 'pandit' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              message.sender === 'pandit'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                message.sender === 'pandit' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                              }`}
                            >
                              {formatTime(message.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={sendingMessage}
                      />
                      <Button onClick={sendMessage} disabled={sendingMessage || !newMessage.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium">Select a conversation</h3>
                  <p className="text-sm">Choose a conversation from the list to start chatting</p>
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
