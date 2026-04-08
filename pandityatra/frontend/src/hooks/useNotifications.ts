import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import apiClient from '@/lib/api-client';

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'booking' | 'payment' | 'puja' | 'system' | 'reminder' | 'review';
  is_read: boolean;
  created_at: string;
  booking_id?: number;
  action_url?: string;
}

export interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

export const useNotifications = () => {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [permission, setPermission] = useState<NotificationPermission>({
    granted: false,
    denied: false,
    default: true
  });
  const [loading, setLoading] = useState(false);
  const [authFailed, setAuthFailed] = useState(false);

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Check browser notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      const currentPermission = Notification.permission;
      setPermission({
        granted: currentPermission === 'granted',
        denied: currentPermission === 'denied',
        default: currentPermission === 'default'
      });
    }
  }, []);

  useEffect(() => {
    // Reset auth failure flag when token changes (e.g. relogin/refresh)
    setAuthFailed(false);
  }, [token]);

  const registerPushSubscription = useCallback(async () => {
    if (!token || !('serviceWorker' in navigator) || !('PushManager' in window)) return;

    try {
      const sw = await navigator.serviceWorker.ready;
      const existing = await sw.pushManager.getSubscription();

      let subscription = existing;
      if (!subscription) {
        let vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
        if (!vapidPublicKey) {
          const keyResp = await apiClient.get('/notifications/push-vapid-key/');
          vapidPublicKey = keyResp?.data?.vapid_public_key;
        }

        if (!vapidPublicKey) {
          return;
        }

        subscription = await sw.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
      }

      const subscriptionJson = subscription.toJSON();
      await apiClient.post('/notifications/push-tokens/', {
        token: subscription.endpoint,
        device_type: 'web',
        endpoint: subscription.endpoint,
        subscription: subscriptionJson,
      });
    } catch {
      // Push registration is optional/silent
    }
  }, [token]);

  const fetchNotifications = useCallback(async () => {
    if (!token || authFailed) return;
    
    try {
      setLoading(true);
      const response = await apiClient.get('/notifications/');
      const notificationData = response.data.results || response.data;
      
      setNotifications(notificationData);
      setUnreadCount(notificationData.filter((n: Notification) => !n.is_read).length);
    } catch (error: any) {
      if (error.response?.status === 401) {
         setAuthFailed(true);
      }
    } finally {
      setLoading(false);
    }
  }, [token, authFailed]);

  // Fetch notifications when user is authenticated
  useEffect(() => {
    if (user && token && !authFailed) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user, token, authFailed, fetchNotifications]);

  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      setPermission({ granted: true, denied: false, default: false });
      return true;
    }

    if (Notification.permission === 'denied') {
      setPermission({ granted: false, denied: true, default: false });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      const granted = result === 'granted';
      
      setPermission({
        granted,
        denied: result === 'denied',
        default: result === 'default'
      });

      if (granted) {
        await registerPushSubscription();
      }

      return granted;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (permission.granted && user && token && !authFailed) {
      registerPushSubscription();
    }
  }, [permission.granted, user, token, authFailed, registerPushSubscription]);

  const showBrowserNotification = (notification: Notification) => {
    if (!permission.granted) return;

    const browserNotification = new Notification(notification.title, {
      body: notification.message,
      icon: '/icon-192x192.png', // PWA icon
      badge: '/icon-192x192.png',
      tag: `notification-${notification.id}`,
      requireInteraction: notification.type === 'booking' || notification.type === 'puja'
    });

    browserNotification.onclick = () => {
      window.focus();
      if (notification.action_url) {
        window.location.href = notification.action_url;
      }
      browserNotification.close();
    };

    // Auto-close after 10 seconds for non-critical notifications
    if (notification.type !== 'booking' && notification.type !== 'puja') {
      setTimeout(() => {
        browserNotification.close();
      }, 10000);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await apiClient.patch(`/notifications/${notificationId}/`, {
        is_read: true
      });

      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // Silent fail
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.post('/notifications/mark-all-read/');
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      
      setUnreadCount(0);
    } catch {
      // Silent fail
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      await apiClient.delete(`/notifications/${notificationId}/`);
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Update unread count if the deleted notification was unread
      const deletedNotification = notifications.find(n => n.id === notificationId);
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch {
      // Silent fail
    }
  };

  // Simulate real-time notifications (in production, use WebSocket)
  const simulateRealTimeNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Show browser notification if permission granted
    if (permission.granted) {
      showBrowserNotification(notification);
    }
  }, [permission.granted]);

  // WebSocket connection for real-time notifications (placeholder)
  useEffect(() => {
    if (!user || !token) return;

    // In a real implementation, you would connect to a WebSocket here
    // For now, we'll use polling as implemented above
    
    // Example WebSocket setup:
    // const ws = new WebSocket(`ws://localhost:8000/ws/notifications/${user.id}/`);
    // ws.onmessage = (event) => {
    //   const notification = JSON.parse(event.data);
    //   simulateRealTimeNotification(notification);
    // };
    // return () => ws.close();
  }, [user, token, simulateRealTimeNotification]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return '📅';
      case 'payment':
        return '💳';
      case 'puja':
        return '🕉️';
      case 'reminder':
        return '⏰';
      case 'system':
        return '🔔';
      case 'review':
        return '⭐';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'booking':
        return 'blue';
      case 'payment':
        return 'green';
      case 'puja':
        return 'orange';
      case 'reminder':
        return 'yellow';
      case 'system':
        return 'gray';
      case 'review':
        return 'purple';
      default:
        return 'blue';
    }
  };

  return {
    notifications,
    unreadCount,
    permission,
    loading,
    fetchNotifications,
    requestPermission,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    simulateRealTimeNotification,
    getNotificationIcon,
    getNotificationColor
  };
};