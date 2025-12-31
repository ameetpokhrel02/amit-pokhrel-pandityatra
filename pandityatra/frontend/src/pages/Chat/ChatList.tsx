import React, { useState, useEffect } from 'react';
import { MessageCircle, Search, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';

interface ChatPreview {
  id: number;
  room_id: number;
  pandit: {
    id: number;
    user: {
      username: string;
      full_name: string;
      profile_pic_url: string;
    };
    rating: number;
  };
  booking: {
    id: number;
    service: string;
    booking_date: string;
  };
  last_message?: {
    content: string;
    timestamp: string;
    sender: string;
  };
  unread_count: number;
}

export const ChatList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const response = await api.get('/api/chat/rooms/');
      setChats(response.data);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredChats = chats.filter((chat) =>
    chat.pandit.user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4">
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-4">
          <MessageCircle size={28} />
          Messages
        </h1>

        {/* Search Bar */}
        <div className="relative">
          <Search size={20} className="absolute left-3 top-3 text-gray-300" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white text-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading chats...</p>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6">
            <MessageCircle size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-semibold">No messages yet</p>
            <p className="text-sm">Book a pandit to start chatting!</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredChats.map((chat) => (
              <div
                key={chat.room_id}
                onClick={() => navigate(`/chat/${chat.room_id}`)}
                className="p-4 hover:bg-gray-100 border-b border-gray-100 cursor-pointer transition"
              >
                <div className="flex items-center gap-3">
                  {/* Pandit Avatar */}
                  <img
                    src={chat.pandit.user.profile_pic_url || '/default-avatar.jpg'}
                    alt={chat.pandit.user.full_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-gray-900">
                        {chat.pandit.user.full_name}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {chat.last_message && new Date(chat.last_message.timestamp).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      ⭐ {chat.pandit.rating?.toFixed(1)} • {chat.booking.service}
                    </p>

                    {chat.last_message && (
                      <p className="text-sm text-gray-600 truncate">
                        {chat.last_message.sender === user?.username ? 'You: ' : ''}
                        {chat.last_message.content}
                      </p>
                    )}
                  </div>

                  {/* Unread Badge */}
                  {chat.unread_count > 0 && (
                    <div className="bg-orange-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                      {chat.unread_count > 9 ? '9+' : chat.unread_count}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Action Button */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <button
          onClick={() => navigate('/bookings')}
          className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition font-semibold"
        >
          <Plus size={20} />
          New Booking
        </button>
      </div>
    </div>
  );
};

export default ChatList;
