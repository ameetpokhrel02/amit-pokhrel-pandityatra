import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import panditLogo from '@/assets/images/PanditYatralogo.png';

interface ChatMessage {
  id: number;
  sender: {
    id: number;
    username: string;
    full_name: string;
  };
  content: string;
  timestamp: string;
  is_read: boolean;
}

interface ChatRoom {
  id: number;
  pandit: {
    id: number;
    user: {
      full_name: string;
      profile_pic_url?: string;
    };
    expertise: string;
    rating: number;
  };
  customer: {
    id: number;
    full_name: string;
  };
  last_message: string;
  unread_count: number;
}

const FloatingChatWidget: React.FC = () => {
  const { token, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle scroll to show/hide widget
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolling(true);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 1000);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch chat rooms if authenticated
  useEffect(() => {
    if (!token || !user) return;

    const fetchChatRooms = async () => {
      try {
        const response = await api.get('/chat/rooms/');
        setChatRooms(response.data);
      } catch (error) {
        console.error('Error fetching chat rooms:', error);
      }
    };

    if (isOpen) {
      fetchChatRooms();
    }
  }, [token, user, isOpen]);

  // WebSocket connection for real-time chat
  useEffect(() => {
    if (!selectedRoom || !token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/chat/${selectedRoom.id}/`;

    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('Chat connected');
      setIsTyping(false);
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'message_history') {
        setMessages(data.messages);
      } else {
        setMessages((prev) => [...prev, data]);
      }
      setIsTyping(false);
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      wsRef.current?.close();
    };
  }, [selectedRoom, token]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !wsRef.current) return;

    wsRef.current.send(
      JSON.stringify({
        type: 'message',
        message_type: 'TEXT',
        content: newMessage,
      })
    );

    setNewMessage('');
    setIsTyping(true);
  };

  if (!token || !user) {
    return null; // Don't show widget for non-authenticated users
  }

  const unreadCount = chatRooms.reduce((sum, room) => sum + room.unread_count, 0);

  return (
    <>
      {/* Always Floating Chat Bubble - Bottom Right */}
      <div className="fixed bottom-6 right-6 z-40">
        {/* Floating Bubble Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative group transition-all duration-300 ${
            isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'
          }`}
        >
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-orange-500 rounded-full blur-lg opacity-75 group-hover:opacity-100 transition-opacity"></div>

            {/* Main bubble */}
            <div className="relative bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full p-4 shadow-lg group-hover:shadow-2xl transition-all duration-200 cursor-pointer hover:scale-110">
              <div className="flex items-center justify-center">
                <MessageSquare className="h-6 w-6" />
              </div>

              {/* Unread badge */}
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-7 w-7 flex items-center justify-center animate-pulse border-2 border-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>

            {/* Floating text on hover */}
            <div className="absolute bottom-full right-0 mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
              <div className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
                Need help? Chat with us! 💬
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Chat Widget Modal - Popup style */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[32rem] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header with Logo */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={panditLogo}
                alt="PanditYatra"
                className="h-8 w-8 object-contain"
              />
              <div>
                <h3 className="font-bold text-lg">PanditYatra</h3>
                <p className="text-xs text-orange-100">Chat with Pandits</p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                setSelectedRoom(null);
              }}
              className="hover:bg-orange-700 p-1 rounded-full transition-colors"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {!selectedRoom ? (
              // Chat Rooms List
              <div className="flex-1 overflow-y-auto">
                {chatRooms.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                    <div className="mb-4">
                      <MessageCircle className="h-12 w-12 text-gray-300 mx-auto" />
                    </div>
                    <p className="text-gray-600 font-semibold mb-2">No Active Conversations</p>
                    <p className="text-sm text-gray-500 mb-4">
                      Book a pandit to start chatting with them about your puja requirements.
                    </p>
                    <div className="text-4xl">🙏</div>
                  </div>
                ) : (
                  <div className="divide-y">
                    {chatRooms.map((room) => (
                      <button
                        key={room.id}
                        onClick={() => setSelectedRoom(room)}
                        className="w-full p-4 hover:bg-orange-50 transition-colors text-left hover:shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative flex-shrink-0">
                            {room.pandit.user.profile_pic_url ? (
                              <img
                                src={room.pandit.user.profile_pic_url}
                                alt={room.pandit.user.full_name}
                                className="h-12 w-12 rounded-full object-cover border-2 border-orange-200"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-200 to-orange-300 flex items-center justify-center border-2 border-orange-300">
                                <MessageCircle className="h-6 w-6 text-orange-500" />
                              </div>
                            )}
                            {room.unread_count > 0 && (
                              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center border-2 border-white">
                                {room.unread_count > 9 ? '9+' : room.unread_count}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <h4 className="font-semibold text-sm text-gray-900 truncate">
                                  {room.pandit.user.full_name}
                                </h4>
                                <p className="text-xs text-gray-500 truncate">
                                  {room.pandit.expertise}
                                </p>
                              </div>
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full flex-shrink-0">
                                ⭐ {room.pandit.rating.toFixed(1)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 truncate mt-1">
                              {room.last_message || 'Start conversation...'}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Pandit Info Bar */}
                <div className="border-b p-3 bg-gradient-to-r from-orange-50 to-orange-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {selectedRoom.pandit.user.profile_pic_url ? (
                      <img
                        src={selectedRoom.pandit.user.profile_pic_url}
                        alt={selectedRoom.pandit.user.full_name}
                        className="h-10 w-10 rounded-full object-cover border-2 border-orange-300"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-200 to-orange-300 flex items-center justify-center border-2 border-orange-300">
                        <MessageCircle className="h-5 w-5 text-orange-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">
                        {selectedRoom.pandit.user.full_name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {selectedRoom.pandit.expertise} • ⭐ {selectedRoom.pandit.rating.toFixed(1)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedRoom(null)}
                    className="text-orange-500 hover:text-orange-700 p-1 hover:bg-orange-100 rounded transition-colors"
                    aria-label="Back to conversations"
                  >
                    ←
                  </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-gray-500 text-sm">Start your conversation!</p>
                        <p className="text-gray-400 text-xs mt-1">Be respectful and ask about puja details</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.sender.id === user.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-2xl text-sm break-words ${
                            msg.sender.id === user.id
                              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-br-none'
                              : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none shadow-sm'
                          }`}
                        >
                          <p>{msg.content}</p>
                          <span className={`text-xs opacity-70 mt-1 block ${
                            msg.sender.id === user.id ? 'text-orange-100' : 'text-gray-500'
                          }`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                  {isTyping && (
                    <div className="flex gap-1 items-center justify-start">
                      <div className="flex gap-1 bg-white px-4 py-2 rounded-2xl shadow-sm">
                        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: '0.1s' }}
                        ></div>
                        <div
                          className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: '0.2s' }}
                        ></div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="border-t p-3 bg-white flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type message..."
                    className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-full p-2 transition-all hover:shadow-lg"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingChatWidget;
