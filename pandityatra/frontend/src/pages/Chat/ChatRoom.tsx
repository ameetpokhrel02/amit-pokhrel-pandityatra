import React, { useState, useEffect, useRef } from 'react';
import { Send, Phone, Video, MoreVertical, Smile, Paperclip } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

interface Message {
  id: number;
  sender: string;
  sender_id: number;
  content: string;
  content_ne?: string;
  message_type: string;
  timestamp: string;
  is_read: boolean;
}

interface ChatRoomProps {
  roomId: number;
  pandit?: {
    id: number;
    user: {
      username: string;
      full_name: string;
      profile_pic_url: string;
    };
    expertise: string[];
    rating: number;
  };
  booking?: {
    id: number;
    service: string;
    booking_date: string;
  };
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ roomId, pandit, booking }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [language, setLanguage] = useState<'en' | 'ne'>('en');
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Connect to WebSocket
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/chat/${roomId}/`;

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('Chat connected');
      setIsConnected(true);
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'message_history') {
        setMessages(data.messages);
      } else if (data.type === 'chat_message' || !data.type) {
        // New message received
        setMessages((prev) => [...prev, data]);
      }
    };

    ws.current.onclose = () => {
      console.log('Chat disconnected');
      setIsConnected(false);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [roomId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim() || !ws.current) return;

    const messageData = {
      type: 'TEXT',
      content: newMessage,
      content_ne: language === 'ne' ? newMessage : null,
    };

    ws.current.send(JSON.stringify(messageData));
    setNewMessage('');
  };

  const isCurrentUserMessage = (senderId: number) => user?.id === senderId;

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Pandit Logo/Avatar */}
            {pandit && (
              <>
                <img
                  src={pandit.user.profile_pic_url || '/default-avatar.jpg'}
                  alt={pandit.user.full_name}
                  className="w-12 h-12 rounded-full border-2 border-white object-cover"
                />
                <div>
                  <h2 className="font-bold text-lg">{pandit.user.full_name}</h2>
                  <p className="text-sm text-orange-100">
                    ⭐ {pandit.rating?.toFixed(1)} • {pandit.expertise?.join(', ')}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-orange-700 rounded-full transition">
              <Phone size={20} />
            </button>
            <button className="p-2 hover:bg-orange-700 rounded-full transition">
              <Video size={20} />
            </button>
            <button className="p-2 hover:bg-orange-700 rounded-full transition">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>

        {/* Connection Status & Booking Info */}
        {booking && (
          <div className="mt-2 text-sm bg-orange-700 bg-opacity-50 p-2 rounded">
            📅 {booking.service} • {format(new Date(booking.booking_date), 'MMM dd, yyyy')}
          </div>
        )}
        <div className="mt-2 text-xs flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-300' : 'bg-red-300'}`}></span>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No messages yet. Start a conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${isCurrentUserMessage(msg.sender_id) ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  isCurrentUserMessage(msg.sender_id)
                    ? 'bg-orange-500 text-white rounded-br-none'
                    : 'bg-gray-300 text-gray-800 rounded-bl-none'
                }`}
              >
                <p className="font-semibold text-sm mb-1">{msg.sender}</p>
                <p className="text-sm">{msg.content}</p>
                {msg.content_ne && language === 'ne' && (
                  <p className="text-xs mt-1 opacity-80">{msg.content_ne}</p>
                )}
                <p className="text-xs mt-1 opacity-70">
                  {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white p-4 space-y-3">
        {/* Language Toggle */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => setLanguage('en')}
            className={`px-3 py-1 text-sm rounded ${
              language === 'en'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLanguage('ne')}
            className={`px-3 py-1 text-sm rounded ${
              language === 'ne'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            नेपाली
          </button>
        </div>

        {/* Message Input */}
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-500 hover:text-orange-500 transition">
            <Smile size={20} />
          </button>
          <button className="p-2 text-gray-500 hover:text-orange-500 transition">
            <Paperclip size={20} />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={language === 'ne' ? 'संदेश लेख्नुहोस्...' : 'Type a message...'}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || !isConnected}
            className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-400 transition"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
