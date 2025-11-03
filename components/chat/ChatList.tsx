import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import Card from '../ui/Card';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import { t } from '../../utils/i18n';

interface ChatListItem {
  id: string;
  name: string;
  lastMessage?: string;
  timestamp?: string;
  unreadCount?: number;
  isOnline?: boolean;
  avatar?: string;
}

interface ChatListProps {
  chats: ChatListItem[];
  onChatPress?: (chatId: string) => void;
  style?: ViewStyle;
}

export default function ChatList({
  chats,
  onChatPress,
  style,
}: ChatListProps) {
  const router = useRouter();

  const handleChatPress = (chatId: string) => {
    if (onChatPress) {
      onChatPress(chatId);
    } else {
      router.push(`/chat?userId=${chatId}`);
    }
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (days === 1) {
      return t('chat.yesterday');
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const renderChatItem = ({ item }: { item: ChatListItem }) => (
    <TouchableOpacity
      onPress={() => handleChatPress(item.id)}
      activeOpacity={0.8}
    >
      <Card style={styles.chatItem}>
        <View style={styles.chatContent}>
          <View style={styles.avatarContainer}>
            <Avatar name={item.name} size="md" />
            {item.isOnline && (
              <View style={styles.onlineIndicator} />
            )}
          </View>
          <View style={styles.chatInfo}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatName} numberOfLines={1}>
                {item.name}
              </Text>
              {item.timestamp && (
                <Text style={styles.timestamp}>
                  {formatTimestamp(item.timestamp)}
                </Text>
              )}
            </View>
            {item.lastMessage && (
              <Text style={styles.lastMessage} numberOfLines={2}>
                {item.lastMessage}
              </Text>
            )}
          </View>
          {item.unreadCount && item.unreadCount > 0 && (
            <Badge
              label={item.unreadCount > 99 ? '99+' : String(item.unreadCount)}
              variant="primary"
              style={styles.unreadBadge}
            />
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={chats}
      keyExtractor={(item) => item.id}
      renderItem={renderChatItem}
      style={[styles.container, style]}
      contentContainerStyle={styles.contentContainer}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.md,
  },
  chatItem: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  chatContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.colors.success,
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs / 2,
  },
  chatName: {
    ...theme.typography.h3,
    color: theme.colors.text,
    fontWeight: '600',
    flex: 1,
  },
  timestamp: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontSize: 11,
  },
  lastMessage: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  unreadBadge: {
    marginBottom: 0,
  },
});

