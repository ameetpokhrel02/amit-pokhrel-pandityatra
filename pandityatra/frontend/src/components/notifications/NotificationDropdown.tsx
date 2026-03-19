import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  BellOff, 
  Check, 
  CheckCheck, 
  Trash2, 
  Calendar,
  CreditCard,
  Clock,
  AlertCircle,
  MessageCircle,
  Video,
  Settings,
  User
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface NotificationDropdownProps {
  trigger?: React.ReactNode;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ trigger }) => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    permission,
    loading,
    requestPermission,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'inbox' | 'general'>('inbox');

  // Filter notifications by type
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'inbox') {
      return ['booking', 'payment', 'puja', 'message', 'video'].includes(notification.type);
    }
    return ['system', 'reminder', 'update'].includes(notification.type);
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-green-500" />;
      case 'puja':
        return <span className="text-orange-500 text-sm">🕉️</span>;
      case 'reminder':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'system':
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
      case 'message':
        return <MessageCircle className="w-4 h-4 text-purple-500" />;
      case 'video':
        return <Video className="w-4 h-4 text-red-500" />;
      default:
        return <Bell className="w-4 h-4 text-orange-500" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      booking: { label: 'Booking', className: 'bg-blue-100 text-blue-700' },
      payment: { label: 'Payment', className: 'bg-green-100 text-green-700' },
      puja: { label: 'Puja Room', className: 'bg-orange-100 text-orange-700' },
      reminder: { label: 'Reminder', className: 'bg-amber-100 text-amber-700' },
      system: { label: 'System', className: 'bg-gray-100 text-gray-700' },
      message: { label: 'Message', className: 'bg-purple-100 text-purple-700' },
      video: { label: 'Video', className: 'bg-red-100 text-red-700' },
    };
    return badges[type] || { label: type, className: 'bg-gray-100 text-gray-700' };
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
        )}
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-[380px] max-w-[95vw] p-0 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Notifications</h2>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          {/* Tabs */}
          <div className="flex items-center gap-4 mt-3">
            <button
              onClick={() => setFilter('inbox')}
              className={`flex items-center gap-1.5 text-sm font-medium pb-2 border-b-2 transition-colors ${
                filter === 'inbox'
                  ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              Inbox
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilter('general')}
              className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                filter === 'general'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              General
            </button>
            <div className="flex-1" />
            <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <Settings className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            </button>
          </div>
        </div>

        {/* Permission Request */}
        {!permission.granted && !permission.denied && (
          <div className="mx-4 my-3 p-3 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-xl">
            <p className="text-xs text-orange-800 mb-2">
              Enable notifications to stay updated on bookings
            </p>
            <Button
              size="sm"
              onClick={requestPermission}
              className="w-full h-8 text-xs bg-orange-500 hover:bg-orange-600 text-white rounded-lg"
            >
              <Bell className="w-3 h-3 mr-1.5" />
              Turn on Notifications
            </Button>
          </div>
        )}

        {/* Notification List */}
        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-orange-500 border-t-transparent"></div>
              <p className="text-xs text-gray-400 dark:text-gray-500">Loading...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
                <BellOff className="w-6 h-6 text-gray-300" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">All caught up!</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                No notifications in {filter === 'inbox' ? 'your inbox' : 'general'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredNotifications.map((notification) => {
                const badge = getTypeBadge(notification.type);
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800/60 cursor-pointer transition-all ${
                      !notification.is_read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3">
                      {/* Avatar/Icon */}
                      <div className="flex-shrink-0">
                        <Avatar className="w-10 h-10 border-2 border-white dark:border-gray-700 shadow-sm">
                          <AvatarImage src={(notification as any).sender_avatar} />
                          <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white text-sm">
                            {getTypeIcon(notification.type)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-sm font-semibold leading-tight ${
                              !notification.is_read ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {notification.title}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                          </div>
                          
                          {/* Unread indicator */}
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        
                        {/* Meta info */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400 dark:text-gray-500">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </span>
                            <span className="text-gray-300 dark:text-gray-600">•</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${badge.className}`}>
                              {badge.label}
                            </span>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            {!notification.is_read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="p-1 hover:bg-blue-100 rounded-md text-blue-500 transition-colors"
                                title="Mark as read"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="p-1 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md text-gray-300 dark:text-gray-500 hover:text-red-500 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Action buttons for specific notification types */}
                        {notification.type === 'booking' && (notification as any).status === 'pending' && (
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs px-3 rounded-lg"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Handle decline
                              }}
                            >
                              Decline
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 text-xs px-3 bg-blue-600 hover:bg-blue-700 rounded-lg"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Handle accept
                              }}
                            >
                              Accept
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {filteredNotifications.length > 0 && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40">
            <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-1">
              View all notifications
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationDropdown;
