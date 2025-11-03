import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { ChatMessage } from '../../types';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showSender: boolean;
  senderAvatar?: string;
  senderName: string;
  formatTime: (timestamp: string) => string;
}

/**
 * Message Bubble Component with fade-in animation
 */
export default function MessageBubble({
  message,
  isOwn,
  showSender,
  senderAvatar,
  senderName,
  formatTime,
  isOnline = false,
}: MessageBubbleProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350, // 0.35s fade-in with easeInOutCubic equivalent
      useNativeDriver: true,
      easing: Animated.Easing.bezier(0.4, 0.0, 0.2, 1.0), // easeInOutCubic
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.messageContainer,
        isOwn ? styles.ownMessageContainer : styles.otherMessageContainer,
        { opacity: fadeAnim },
      ]}
    >
      {showSender && !isOwn && (
        <View style={styles.messageHeader}>
          <View style={styles.avatarContainer}>
            {senderAvatar ? (
              <Image source={{ uri: senderAvatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={16} color={theme.colors.textSecondary} />
              </View>
            )}
            {/* Presence indicator - green dot for online users */}
            {isOnline && <View style={styles.onlineIndicator} />}
          </View>
          <Text style={styles.senderName}>{senderName}</Text>
        </View>
      )}
      <View
        style={[
          styles.messageBubble,
          isOwn ? styles.ownMessageBubble : styles.otherMessageBubble,
        ]}
      >
        {/* Check if message is an image URL */}
        {message.text && message.text.startsWith('http') && (message.text.includes('.jpg') || message.text.includes('.png') || message.text.includes('.jpeg') || message.text.includes('storage')) ? (
          <Image
            source={{ uri: message.text }}
            style={styles.messageImage}
            resizeMode="cover"
          />
        ) : (
          <Text
            style={[
              styles.messageText,
              isOwn ? styles.ownMessageText : styles.otherMessageText,
            ]}
          >
            {message.text}
          </Text>
        )}
        <View style={styles.messageFooter}>
          <Text
            style={[
              styles.messageTime,
              isOwn ? styles.ownMessageTime : styles.otherMessageTime,
            ]}
          >
            {formatTime(message.createdAt)}
          </Text>
          {/* Read receipts */}
          {isOwn && (
            <View style={styles.readReceipts}>
              <Ionicons
                name="checkmark-done"
                size={14}
                color={theme.colors.mint} // Mint checkmarks when read
              />
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  messageContainer: {
    marginBottom: theme.spacing.md,
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: theme.spacing.xs,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  avatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981', // Green dot for online users
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  senderName: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.xl * 3, // rounded-3xl (48px)
  },
  ownMessageBubble: {
    backgroundColor: theme.colors.mint, // Mint bubble for sent messages
    borderBottomRightRadius: theme.borderRadius.md,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.mint,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  otherMessageBubble: {
    backgroundColor: theme.colors.surface, // White bubble for received messages
    borderBottomLeftRadius: theme.borderRadius.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  messageText: {
    ...theme.typography.body,
    marginBottom: theme.spacing.xs,
  },
  ownMessageText: {
    color: theme.colors.navy, // Navy text on mint bubble
  },
  otherMessageText: {
    color: theme.colors.text,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: theme.spacing.xs / 2,
  },
  messageTime: {
    ...theme.typography.caption,
    fontSize: 10,
  },
  ownMessageTime: {
    color: theme.colors.navy,
    opacity: 0.7,
  },
  otherMessageTime: {
    color: theme.colors.textSecondary,
  },
  readReceipts: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.xs,
  },
});
