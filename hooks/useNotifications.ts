import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { notificationsService } from '../services/notifications';
import { Notification } from '../types';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Load initial notifications
  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);
    try {
      const [notificationsData, count] = await Promise.all([
        notificationsService.getNotificationsPaginated(user.id, 20, null),
        notificationsService.getUnreadCount(user.id),
      ]);

      setNotifications(notificationsData.data);
      setUnreadCount(count);
    } catch (err: any) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user?.id) return;

    const channel = notificationsService.subscribeToNotifications(
      user.id,
      (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        if (!notification.read) {
          setUnreadCount((prev) => prev + 1);
        }
      },
      (notification) => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? notification : n))
        );
        if (notification.read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      },
      (notificationId) => {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    );

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [user?.id]);

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!user?.id) return;
      try {
        await notificationsService.markAsRead(notificationId, user.id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err: any) {
        setError(err.message || 'Failed to mark as read');
      }
    },
    [user?.id]
  );

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;
    try {
      await notificationsService.markAllAsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err: any) {
      setError(err.message || 'Failed to mark all as read');
    }
  }, [user?.id]);

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      if (!user?.id) return;
      try {
        await notificationsService.deleteNotification(notificationId, user.id);
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        const notification = notifications.find((n) => n.id === notificationId);
        if (notification && !notification.read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } catch (err: any) {
        setError(err.message || 'Failed to delete notification');
      }
    },
    [user?.id, notifications]
  );

  return {
    notifications,
    unreadCount,
    loading,
    error,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}

