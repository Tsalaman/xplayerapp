import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Animated,
  PanResponder,
} from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { Notification, NotificationType } from '../../types';
import { notificationsService } from '../../services/notifications';
import { Ionicons } from '@expo/vector-icons';
import { usePagination } from '../../hooks/usePagination';
import { Cursor } from '../../utils/cursor';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationsContext';
import { supabase } from '../../services/supabase';

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { unreadCount, refreshUnreadCount, subscribeToNotifications, unsubscribe } = useNotifications();
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [selectedType, setSelectedType] = useState<NotificationType | null>(null);

  const { items: notifications, loading, error, hasMore, loadMore, refresh } = usePagination({
    fetchPage: async (cursor: Cursor, limit: number) => {
      if (!user) {
        throw new Error('User not authenticated');
      }
      const result = await notificationsService.getNotificationsPaginated(
        user.id,
        limit,
        cursor,
        selectedType || undefined,
        showUnreadOnly
      );
      return {
        data: result.data,
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      };
    },
    limit: 20,
  });

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    // Subscribe using context
    subscribeToNotifications((notification) => {
      // New notification inserted - refresh feed
      refresh();
      // Optional: Show local notification
      // showLocalNotification(notification);
    });

    return () => {
      unsubscribe();
    };
  }, [user, refresh, subscribeToNotifications, unsubscribe]);

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadMore();
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    if (!user) return;
    try {
      await notificationsService.markAsRead(notificationId, user.id);
      // Update local state
      await refresh();
      await refreshUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    try {
      await notificationsService.markAllAsRead(user.id);
      await refresh();
      await refreshUnreadCount();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read if unread
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }

    // Navigate to link if available
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    const icons: Record<NotificationType, string> = {
      post_comment: 'chatbubble',
      post_like: 'heart',
      team_invite: 'people',
      team_request: 'person-add',
      tournament_registration: 'calendar',
      tournament_result: 'trophy',
      follow_request: 'person-add',
      follow_accepted: 'checkmark-circle',
      match_result: 'football',
      follow: 'person-add',
      invite: 'mail',
      role_change: 'star',
      kicked: 'person-remove',
      general: 'notifications',
    };
    return icons[type] || 'notifications';
  };

  const getNotificationColor = (type: NotificationType) => {
    const colors: Record<NotificationType, string> = {
      post_comment: theme.colors.info,
      post_like: theme.colors.error,
      team_invite: theme.colors.primary,
      team_request: theme.colors.secondary,
      tournament_registration: theme.colors.warning,
      tournament_result: theme.colors.accent,
      follow_request: theme.colors.secondary,
      follow_accepted: theme.colors.success,
      match_result: theme.colors.primary,
      follow: theme.colors.secondary,
      invite: theme.colors.primary,
      role_change: theme.colors.accent,
      kicked: theme.colors.error,
      general: theme.colors.textSecondary,
    };
    return colors[type] || theme.colors.primary;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const swipeAnim = useRef(new Animated.Value(0)).current;
    const panResponder = useRef(
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return Math.abs(gestureState.dx) > 10;
        },
        onPanResponderMove: (_, gestureState) => {
          // Only allow swiping left (negative dx)
          if (gestureState.dx < 0) {
            swipeAnim.setValue(gestureState.dx);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx < -100) {
            // Swipe left enough - mark as read
            Animated.timing(swipeAnim, {
              toValue: -200,
              duration: 200,
              useNativeDriver: false,
            }).start(() => {
              handleMarkAsRead(item.id);
              swipeAnim.setValue(0);
            });
          } else {
            // Snap back
            Animated.spring(swipeAnim, {
              toValue: 0,
              useNativeDriver: false,
            }).start();
          }
        },
      })
    ).current;

    return (
      <Animated.View
        style={[
          styles.notificationContainer,
          {
            transform: [{ translateX: swipeAnim }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={[
            styles.notificationCard,
            !item.read && styles.unreadCard,
          ]}
          onPress={() => handleNotificationPress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.notificationHeader}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: getNotificationColor(item.type) + '20' },
              ]}
            >
              <Ionicons
                name={getNotificationIcon(item.type) as any}
                size={24}
                color={getNotificationColor(item.type)}
              />
            </View>
            <View style={styles.notificationContent}>
              <Text style={[styles.notificationMessage, !item.read && styles.unreadText]}>
                {item.message}
              </Text>
              <Text style={styles.notificationTime}>{formatTimestamp(item.createdAt)}</Text>
            </View>
            {!item.read && (
              <View style={styles.unreadIndicator}>
                <View style={styles.unreadDot} />
              </View>
            )}
          </View>
          {item.read && (
            <View style={styles.swipeHint}>
              <Ionicons name="arrow-back" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.swipeHintText}>Swipe to mark as read</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };

  const notificationTypes: NotificationType[] = [
    'post_comment',
    'post_like',
    'team_invite',
    'team_request',
    'tournament_registration',
    'tournament_result',
    'follow_request',
    'follow_accepted',
    'match_result',
    'general',
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={handleMarkAllAsRead}
          >
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Section */}
      <View style={styles.filterSection}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            !showUnreadOnly && !selectedType && styles.filterChipActive,
          ]}
          onPress={() => {
            setShowUnreadOnly(false);
            setSelectedType(null);
            refresh();
          }}
        >
          <Text
            style={[
              styles.filterChipText,
              !showUnreadOnly && !selectedType && styles.filterChipTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, showUnreadOnly && styles.filterChipActive]}
          onPress={() => {
            setShowUnreadOnly(!showUnreadOnly);
            setSelectedType(null);
            refresh();
          }}
        >
          <Text
            style={[
              styles.filterChipText,
              showUnreadOnly && styles.filterChipTextActive,
            ]}
          >
            Unread ({unreadCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={64} color={theme.colors.textSecondary} />
              <Text style={styles.emptyText}>No notifications yet</Text>
              <Text style={styles.emptySubtext}>
                {showUnreadOnly
                  ? 'You have no unread notifications'
                  : 'You will receive notifications here'}
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Light gray background (XPlayer palette)
  },
  header: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingTop: theme.spacing.xl + 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  headerTitle: {
    ...theme.typography.h1,
    color: theme.colors.text,
  },
  badge: {
    backgroundColor: theme.colors.error,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    ...theme.typography.caption,
    color: theme.colors.surface,
    fontWeight: '700',
  },
  markAllButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  markAllText: {
    ...theme.typography.body,
    color: theme.colors.mint,
    fontWeight: '600',
  },
  filterSection: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  filterChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterChipActive: {
    backgroundColor: theme.colors.mint,
    borderColor: theme.colors.mint,
  },
  filterChipText: {
    ...theme.typography.caption,
    color: theme.colors.text,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: theme.colors.surface,
    fontWeight: '600',
  },
  listContent: {
    padding: theme.spacing.lg,
  },
  notificationContainer: {
    marginBottom: theme.spacing.md,
  },
  notificationCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.mint,
    backgroundColor: theme.colors.mint + '05',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  unreadText: {
    fontWeight: '600',
  },
  notificationTime: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  unreadIndicator: {
    marginLeft: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.mint,
  },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  swipeHintText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    padding: theme.spacing.xxl,
    marginTop: theme.spacing.xxl,
  },
  emptyText: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  emptySubtext: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
});

