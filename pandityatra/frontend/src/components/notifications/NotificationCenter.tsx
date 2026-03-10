import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  BellOff, 
  Check, 
  CheckCheck, 
  Trash2, 
  X,
  Calendar,
  CreditCard,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose
}) => {
  const {
    notifications,
    unreadCount,
    permission,
    loading,
    requestPermission,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getNotificationIcon,
    getNotificationColor
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = notifications.filter(notification => 
    filter === 'all' || !notification.is_read
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <Calendar className="w-4 h-4" />;
      case 'payment':
        return <CreditCard className="w-4 h-4" />;
      case 'puja':
        return <span className="text-orange-500 text-sm">🕉️</span>;
      case 'reminder':
        return <Clock className="w-4 h-4" />;
      case 'system':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Sidebar Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 z-[70] h-full w-full max-w-md bg-white shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <Bell className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
                  {unreadCount > 0 && (
                    <p className="text-sm text-orange-600 font-medium">
                      You have {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Permission Request */}
              {!permission.granted && !permission.denied && (
                <div className="m-6 p-4 bg-orange-50 border border-orange-100 rounded-xl">
                  <p className="text-sm text-orange-800 mb-3">
                    Don't miss out! Enable notifications to stay updated on your sacred bookings.
                  </p>
                  <Button
                    size="sm"
                    onClick={requestPermission}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Turn on Notifications
                  </Button>
                </div>
              )}

              {/* Controls */}
              <div className="px-6 py-4 flex items-center justify-between bg-gray-50/50">
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      filter === 'all' 
                      ? 'bg-gray-900 text-white font-medium' 
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter('unread')}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      filter === 'unread' 
                      ? 'bg-orange-600 text-white font-medium' 
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    Unread
                  </button>
                </div>

                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-primary hover:text-primary/80 text-xs font-semibold"
                  >
                    <CheckCheck className="w-3 h-3 mr-1" />
                    Mark all as read
                  </Button>
                )}
              </div>

              <div className="divide-y divide-gray-100">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                    <p className="text-sm text-gray-500">Fetching notifications...</p>
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 px-10 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <BellOff className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Quiet for now</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {filter === 'unread' 
                        ? "You've read all your notifications. Great job!" 
                        : "When you receive notifications, they'll appear here."}
                    </p>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-5 hover:bg-orange-50/30 cursor-pointer transition-all border-l-4 ${
                        !notification.is_read ? 'bg-orange-50/50 border-orange-500' : 'border-transparent'
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex gap-4">
                        <div className={`mt-1 p-2.5 rounded-xl bg-${getNotificationColor(notification.type) === 'orange' ? 'orange' : 'orange'}-100 flex-shrink-0`}>
                          {getTypeIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`text-sm font-bold truncate ${
                              !notification.is_read ? 'text-gray-900' : 'text-gray-600'
                            }`}>
                              {notification.title}
                            </h4>
                            {!notification.is_read && (
                              <div className="w-2.5 h-2.5 bg-orange-500 rounded-full ring-4 ring-orange-100 mt-1 flex-shrink-0" />
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </div>
                            
                            <div className="flex gap-2">
                              {!notification.is_read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                  className="p-1 hover:bg-orange-100 rounded-md text-orange-600 transition-colors"
                                  title="Mark as read"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                                className="p-1 hover:bg-red-50 rounded-md text-gray-400 hover:text-red-600 transition-colors"
                                title="Delete notification"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer shadow/fade */}
            <div className="h-6 bg-gradient-to-t from-gray-50/50 to-transparent flex-shrink-0" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationCenter;