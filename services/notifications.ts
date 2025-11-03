import { supabase } from './supabase';
import { Notification, NotificationType, PaginatedResponse } from '../types';
import { Cursor, getNotificationCursorFields, createNotificationCursor } from '../utils/cursor';
import { RealtimeChannel } from '@supabase/supabase-js';

// Re-export the register function for compatibility
export { registerForPushNotificationsAsync } from './pushNotifications';

export const notificationsService = {
  /**
   * Get user's notifications with cursor pagination
   * ORDER BY created_at DESC, id ASC
   */
  getNotificationsPaginated: async (
    userId: string,
    limit: number = 20,
    cursor: Cursor = null,
    type?: NotificationType,
    unreadOnly: boolean = false
  ): Promise<PaginatedResponse<Notification>> => {
    // Get cursor fields if cursor exists
    let cursorCreatedAt: string | null = null;
    let cursorId: string | null = null;
    
    if (cursor) {
      const cursorFields = getNotificationCursorFields(cursor);
      if (cursorFields) {
        cursorCreatedAt = cursorFields.created_at;
        cursorId = cursorFields.id;
      }
    }

    // Call RPC function for cursor pagination
    const { data, error } = await supabase.rpc('get_notifications_paginated', {
      user_id_filter: userId,
      cursor_created_at: cursorCreatedAt,
      cursor_id: cursorId,
      type_filter: type || null,
      unread_only: unreadOnly,
      limit_count: limit + 1, // Get one extra to check if there's more
    });

    if (error) throw error;

    const notifications = data ? data.map(mapNotificationFromDb) : [];
    const hasMore = notifications.length > limit;
    const notificationsToReturn = hasMore ? notifications.slice(0, limit) : notifications;

    // Generate next cursor from last item
    const nextCursor = notificationsToReturn.length > 0
      ? createNotificationCursor(
          notificationsToReturn[notificationsToReturn.length - 1].createdAt,
          notificationsToReturn[notificationsToReturn.length - 1].id
        )
      : null;

    return {
      data: notificationsToReturn,
      nextCursor,
      hasMore,
    };
  },

  /**
   * Get unread notifications count
   */
  getUnreadCount: async (userId: string): Promise<number> => {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
    return count || 0;
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (notificationId: string, userId: string): Promise<Notification> => {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return mapNotificationFromDb(data);
  },

  /**
   * Mark multiple notifications as read
   */
  markMultipleAsRead: async (notificationIds: string[], userId: string): Promise<void> => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', notificationIds)
      .eq('user_id', userId);

    if (error) throw error;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (userId: string): Promise<void> => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
  },

  /**
   * Delete notification
   */
  deleteNotification: async (notificationId: string, userId: string): Promise<void> => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  /**
   * Create notification (for system-generated notifications)
   */
  createNotification: async (
    notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt' | 'read'> & { read?: boolean }
  ): Promise<Notification> => {
    const dbData = {
      user_id: notification.userId,
      type: notification.type,
      message: notification.message,
      link: notification.link || null,
      read: notification.read || false,
      metadata: notification.metadata || null,
    };

    const { data, error } = await supabase
      .from('notifications')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;
    return mapNotificationFromDb(data);
  },

  /**
   * Subscribe to real-time notifications
   */
  subscribeToNotifications: (
    userId: string,
    onInsert: (notification: Notification) => void,
    onUpdate: (notification: Notification) => void,
    onDelete: (notificationId: string) => void
  ): RealtimeChannel => {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notification = mapNotificationFromDb(payload.new);
          onInsert(notification);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notification = mapNotificationFromDb(payload.new);
          onUpdate(notification);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          onDelete(payload.old.id);
        }
      )
      .subscribe();

    return channel;
  },
};

/**
 * Map database notification to Notification type
 */
function mapNotificationFromDb(dbNotification: any): Notification {
  return {
    id: dbNotification.id,
    userId: dbNotification.user_id,
    type: dbNotification.type,
    message: dbNotification.message,
    link: dbNotification.link || undefined,
    read: dbNotification.read,
    metadata: dbNotification.metadata || undefined,
    createdAt: dbNotification.created_at,
    updatedAt: dbNotification.updated_at,
  };
}
