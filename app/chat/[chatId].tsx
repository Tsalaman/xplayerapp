import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { ChatMessage } from '../../types';
import { chatService } from '../../services/chat';
import { useChatPagination } from '../../hooks/useChatPagination';
import { Cursor } from '../../utils/cursor';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { Ionicons } from '@expo/vector-icons';
import MessageBubble from '../../components/chat/MessageBubble';
import MessageComposer from '../../components/chat/MessageComposer';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import haptic from '../../utils/haptic';
import { Vibration } from 'react-native';

export default function ChatScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const presenceChannelRef = useRef<any>(null);
  const loadMoreTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasMarkedAsReadRef = useRef(false);

  const {
    items: messages,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    loadInitial,
  } = useChatPagination({
    fetchPage: async (cursor: Cursor, limit: number) => {
      if (!chatId) {
        throw new Error('Chat ID is required');
      }
      const result = await chatService.getChatMessagesPaginated(chatId, limit, cursor);
      return {
        data: result.data,
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      };
    },
    limit: 20,
  });

  const [localMessages, setLocalMessages] = useState<ChatMessage[]>(messages);

  // Sync pagination messages with local state
  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  // Set up real-time subscription
  useEffect(() => {
    if (!chatId) return;

    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          // Map the new message
          const newMessage: ChatMessage = {
            id: payload.new.id,
            chatId: payload.new.chat_id,
            senderId: payload.new.sender_id,
            senderNickname: payload.new.sender_nickname,
            senderAvatar: payload.new.sender_avatar || undefined,
            text: payload.new.text,
            createdAt: payload.new.created_at,
          };

          // Add to messages list (append to end since newest messages go at bottom)
          setLocalMessages((prev) => {
            // Check if message already exists
            if (prev.find((m) => m.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });

          // Smooth scroll to bottom when new message arrives
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 350); // 0.35s timing with smooth behavior
        }
      )
      .subscribe();

    setSubscription(channel);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  // Load initial messages when component mounts
  useEffect(() => {
    if (chatId && localMessages.length === 0 && !loading) {
      loadInitial();
    }
  }, [chatId]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (localMessages.length > 0 && !loading) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 200);
    }
  }, [localMessages.length, loading]);

  const handleSend = async () => {
    if (!user || !chatId || !messageText.trim() || sending) return;

    const text = messageText.trim();
    setMessageText('');
    setSending(true);

    // Clear typing status
    if (presenceChannelRef.current) {
      presenceChannelRef.current.track({
        user_id: user.id,
        user_nickname: user.nickname,
        typing: false,
        online_at: new Date().toISOString(),
      });
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    try {
      haptic.light();
      await chatService.sendMessage(
        chatId,
        user.id,
        user.nickname,
        user.profilePicture,
        text
      );
      // Sound feedback on send
      if (Platform.OS === 'android') {
        Vibration.vibrate(15);
      }
      // Message will be added via real-time subscription
    } catch (error: any) {
      console.error('Error sending message:', error);
      // Restore message text on error
      setMessageText(text);
    } finally {
      setSending(false);
    }
  };

  const handleLoadMore = () => {
    // For chat, we load more when scrolling to top (to get older messages)
    // onEndReached fires at bottom, so we'll use onScroll instead
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset } = event.nativeEvent;
    const scrollPosition = contentOffset.y;
    
    // If scrolled near top (within 300px), load more older messages
    // Note: scrollPosition is 0 at top, increases as you scroll down
    // For loading older messages, we check if near top (low scrollPosition)
    if (scrollPosition < 300 && hasMore && !loading) {
      // Debounce to prevent multiple calls
      if (loadMoreTimeoutRef.current) {
        clearTimeout(loadMoreTimeoutRef.current);
      }
      loadMoreTimeoutRef.current = setTimeout(() => {
        loadMore();
        loadMoreTimeoutRef.current = null;
      }, 300);
    }
  };

  // Mark messages as read when screen opens
  useEffect(() => {
    if (!chatId || !user || hasMarkedAsReadRef.current) return;
    
    // Mark all messages in this chat as read
    supabase
      .from('chat_messages')
      .update({ status: 'read' })
      .eq('chat_id', chatId)
      .neq('sender_id', user.id)
      .then(() => {
        hasMarkedAsReadRef.current = true;
      });
  }, [chatId, user]);

  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  // Setup typing indicator with presence
  useEffect(() => {
    if (!chatId || !user) return;

    const channel = supabase.channel(`chat-presence:${chatId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const typingUserIds = new Set<string>();
        const onlineUserIds = new Set<string>();
        
        Object.values(state).forEach((presences: any[]) => {
          presences.forEach((presence: any) => {
            if (presence.user_id !== user.id) {
              if (presence.typing) {
                typingUserIds.add(presence.user_id);
              }
              if (presence.online) {
                onlineUserIds.add(presence.user_id);
              }
            }
          });
        });
        
        setTypingUsers(typingUserIds);
        setOnlineUsers(onlineUserIds);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }: any) => {
        // User joined
        const joinedUserIds = new Set<string>();
        newPresences.forEach((presence: any) => {
          if (presence.user_id !== user.id && presence.typing) {
            joinedUserIds.add(presence.user_id);
          }
        });
        setTypingUsers((prev) => {
          const updated = new Set(prev);
          joinedUserIds.forEach((id) => updated.add(id));
          return updated;
        });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }: any) => {
        // User left
        const leftUserIds = new Set<string>();
        leftPresences.forEach((presence: any) => {
          leftUserIds.add(presence.user_id);
        });
        setTypingUsers((prev) => {
          const updated = new Set(prev);
          leftUserIds.forEach((id) => updated.delete(id));
          return updated;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track user presence with online status
          await channel.track({
            user_id: user.id,
            user_nickname: user.nickname,
            typing: false,
            online: true, // Online status
            online_at: new Date().toISOString(),
          });
        }
      });

    presenceChannelRef.current = channel;

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [chatId, user]);

  // Handle typing indicator
  const handleTextChange = (text: string) => {
    setMessageText(text);
    
    if (!presenceChannelRef.current || !user) return;
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set typing status
    if (text.trim().length > 0) {
      presenceChannelRef.current.track({
        user_id: user.id,
        user_nickname: user.nickname,
        typing: true,
        online_at: new Date().toISOString(),
      });
    } else {
      presenceChannelRef.current.track({
        user_id: user.id,
        user_nickname: user.nickname,
        typing: false,
        online_at: new Date().toISOString(),
      });
    }
    
    // Clear typing status after 3 seconds of no typing
    typingTimeoutRef.current = setTimeout(() => {
      if (presenceChannelRef.current && user) {
        presenceChannelRef.current.track({
          user_id: user.id,
          user_nickname: user.nickname,
          typing: false,
          online_at: new Date().toISOString(),
        });
      }
    }, 3000);
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (loadMoreTimeoutRef.current) {
        clearTimeout(loadMoreTimeoutRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Now';
    if (minutes < 60) return `${minutes}m ago`;
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Group messages by sender (show sender name only when sender changes)
  const shouldShowSender = (currentMessage: ChatMessage, previousMessage: ChatMessage | null): boolean => {
    if (!previousMessage) return true;
    if (currentMessage.senderId !== previousMessage.senderId) return true;
    
    // Also show if more than 5 minutes passed
    const timeDiff = new Date(currentMessage.createdAt).getTime() - new Date(previousMessage.createdAt).getTime();
    return timeDiff > 5 * 60 * 1000; // 5 minutes
  };

  // Format date for dividers (Today, Yesterday)
  const formatDateDivider = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (messageDate.getTime() === today.getTime()) return 'Today';
    if (messageDate.getTime() === yesterday.getTime()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  };

  // Check if should show date divider
  const shouldShowDateDivider = (currentMessage: ChatMessage, previousMessage: ChatMessage | null): boolean => {
    if (!previousMessage) return true;
    const currentDate = new Date(currentMessage.createdAt);
    const previousDate = new Date(previousMessage.createdAt);
    return currentDate.toDateString() !== previousDate.toDateString();
  };

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isOwnMessage = item.senderId === user?.id;
    const previousMessage = index > 0 ? localMessages[index - 1] : null;
    const showSender = !isOwnMessage && shouldShowSender(item, previousMessage);
    const showDateDivider = shouldShowDateDivider(item, previousMessage);

    return (
      <>
        {showDateDivider && (
          <View style={styles.dateDivider}>
            <View style={styles.dateDividerLine} />
            <Text style={styles.dateDividerText}>{formatDateDivider(item.createdAt)}</Text>
            <View style={styles.dateDividerLine} />
          </View>
        )}
        <MessageBubble
          message={item}
          isOwn={isOwnMessage}
          showSender={showSender}
          senderAvatar={item.senderAvatar}
          senderName={item.senderNickname}
          formatTime={formatTime}
          isOnline={onlineUsers.has(item.senderId)}
        />
      </>
    );
  };

  const renderTypingIndicator = () => {
    if (typingUsers.size === 0) return null;
    
    const typingUserNames = Array.from(typingUsers)
      .map((userId) => {
        // Find user nickname from messages
        const userMessage = localMessages.find((m) => m.senderId === userId);
        return userMessage?.senderNickname || 'Someone';
      })
      .join(', ');
    
    return (
      <View style={styles.typingIndicator}>
        <Text style={styles.typingText}>{typingUserNames} {typingUsers.size === 1 ? 'is' : 'are'} typing...</Text>
      </View>
    );
  };

  const renderHeader = () => {
    if (!loading || localMessages.length > 0) return null;
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };

  const renderFooter = () => {
    if (!loading || localMessages.length === 0) return null;
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Chat Header with Gradient and Blur */}
      <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
        <LinearGradient
          colors={[theme.colors.navy, theme.colors.mint]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerBlur}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.surface} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Chat</Text>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>
      </SafeAreaView>

      <View style={styles.messagesContainer}>
        <FlatList
          ref={flatListRef}
          data={localMessages}
          renderItem={({ item, index }) => renderMessage({ item, index })}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          inverted={false}
          onScroll={handleScroll}
          scrollEventThrottle={400}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={() => (
            <>
              {renderFooter()}
              {renderTypingIndicator()}
            </>
          )}
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            // Load more when reaching bottom (newer messages)
            // This shouldn't happen with normal chat flow, but handle it
          }}
          onEndReachedThreshold={0.1}
        />
      </View>

      <MessageComposer
        chatId={chatId || ''}
        userId={user?.id || ''}
        userNickname={user?.nickname || 'Anonymous'}
        userAvatar={user?.profilePicture}
        onTextChange={handleTextChange}
        onMessageSent={() => {
          // Scroll to bottom after sending
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 350);
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Light gray background (XPlayer palette)
  },
  dateDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  dateDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dateDividerText: {
    ...theme.typography.caption,
    color: theme.colors.mint, // Mint underline for date dividers
    marginHorizontal: theme.spacing.md,
    fontWeight: '600',
    textTransform: 'uppercase',
    fontSize: 11,
    letterSpacing: 0.5,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.mint,
    paddingBottom: 2,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  headerSafeArea: {
    backgroundColor: 'transparent',
  },
  headerGradient: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  headerBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Simulate blur with semi-transparent overlay
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.surface,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  typingIndicator: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    alignItems: 'flex-start',
  },
  typingText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  dateDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  dateDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dateDividerText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginHorizontal: theme.spacing.md,
    fontWeight: '600',
    textTransform: 'uppercase',
    fontSize: 11,
    letterSpacing: 0.5,
  },
});

