import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { notificationsService } from '../services/notifications';
import { Notification } from '../types';
import { useAuth } from './AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';
import { scheduleLocalNotification } from '../services/pushNotifications';

interface NotificationsContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  subscribeToNotifications: (onNewNotification: (notification: Notification) => void) => void;
  unsubscribe: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const onNewNotificationRef = useRef<((notification: Notification) => void) | null>(null);

  const refreshUnreadCount = async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    try {
      const count = await notificationsService.getUnreadCount(user.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  useEffect(() => {
    if (user) {
      refreshUnreadCount();
    } else {
      setUnreadCount(0);
    }
  }, [user]);

  // Setup notification listeners
  useEffect(() => {
    // Handle notifications received while app is in foreground
    const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
      refreshUnreadCount();
    });

    // Handle user tapping on notification
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification response:', response);
      const data = response.notification.request.content.data;
      // Navigate to link if available
      if (data?.link) {
        // Navigation will be handled by the specific screen
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  const subscribeToNotifications = (onNewNotification: (notification: Notification) => void) => {
    if (!user) return;

    // Store callback
    onNewNotificationRef.current = onNewNotification;

    // Unsubscribe from previous subscription if exists
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    // Subscribe to real-time notifications
    const channel = notificationsService.subscribeToNotifications(
      user.id,
      (notification) => {
        // New notification inserted
        onNewNotification(notification);
        refreshUnreadCount();
        // Show local notification if app is in foreground or background
        scheduleLocalNotification(
          'XPlayer',
          notification.message,
          { 
            notificationId: notification.id,
            link: notification.link 
          }
        );
      },
      (notification) => {
        // Notification updated (e.g., marked as read)
        refreshUnreadCount();
      },
      (notificationId) => {
        // Notification deleted
        refreshUnreadCount();
      }
    );

    subscriptionRef.current = channel;
  };

  const unsubscribe = () => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
    onNewNotificationRef.current = null;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <NotificationsContext.Provider
      value={{
        unreadCount,
        refreshUnreadCount,
        subscribeToNotifications,
        unsubscribe,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}

