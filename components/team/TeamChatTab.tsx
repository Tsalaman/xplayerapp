import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../constants/theme';
import { teamService } from '../../services/teams';
import { supabase } from '../../services/supabase';
import { Vibration } from 'react-native';
import haptic from '../../utils/haptic';

interface TeamMessage {
  id: string;
  team_id: string;
  sender_id: string;
  sender_nickname: string;
  text: string;
  created_at: string;
}

interface TeamChatTabProps {
  teamId: string;
}

/**
 * Team Chat Tab Component
 * - Real-time team chat with Supabase subscriptions
 * - Scroll-to-bottom on new messages
 * - Sound feedback on send
 */
export default function TeamChatTab({ teamId }: TeamChatTabProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Load initial messages
  useEffect(() => {
    loadMessages();
  }, [teamId]);

  // Real-time subscription for team chat
  useEffect(() => {
    if (!teamId) return;

    const channel = supabase
      .channel('team_chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'team_messages',
          filter: `team_id=eq.${teamId}`,
        },
        (payload) => {
          const newMessage = payload.new as TeamMessage;
          setMessages((prev) => {
            // Check if message already exists
            if (prev.find((m) => m.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });

          // Scroll to bottom when new message arrives
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);

          // Sound feedback (vibration)
          if (newMessage.sender_id !== user?.id) {
            haptic.light();
            if (Platform.OS === 'android') {
              Vibration.vibrate(50);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId, user?.id]);

  const loadMessages = async () => {
    try {
      const data = await teamService.getTeamMessages(teamId);
      setMessages(data.reverse()); // Reverse to show oldest first
    } catch (error) {
      console.error('Error loading team messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !user || sending) return;

    setSending(true);
    haptic.medium();
    
    try {
      await teamService.sendTeamMessage(
        teamId,
        user.id,
        user.nickname || 'Anonymous',
        messageText
      );
      
      setMessageText('');
      
      // Sound feedback on send
      if (Platform.OS === 'android') {
        Vibration.vibrate(25);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: TeamMessage }) => {
    const isOwn = item.sender_id === user?.id;
    
    return (
      <View
        style={[
          styles.messageContainer,
          isOwn ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        {!isOwn && (
          <Text style={styles.senderName}>{item.sender_nickname}</Text>
        )}
        <View
          style={[
            styles.messageBubble,
            isOwn ? styles.ownBubble : styles.otherBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isOwn ? styles.ownMessageText : styles.otherMessageText,
            ]}
          >
            {item.text}
          </Text>
        </View>
        <Text style={styles.timestamp}>
          {new Date(item.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={theme.colors.textSecondary}
          value={messageText}
          onChangeText={setMessageText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!messageText.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!messageText.trim() || sending}
        >
          <Ionicons
            name="send"
            size={20}
            color={messageText.trim() && !sending ? theme.colors.surface : theme.colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: theme.spacing.md,
  },
  messageContainer: {
    marginBottom: theme.spacing.md,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  senderName: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs / 2,
    marginLeft: theme.spacing.sm,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
  },
  ownBubble: {
    backgroundColor: theme.colors.mint,
  },
  otherBubble: {
    backgroundColor: theme.colors.surface,
  },
  messageText: {
    ...theme.typography.body,
  },
  ownMessageText: {
    color: theme.colors.navy,
  },
  otherMessageText: {
    color: theme.colors.text,
  },
  timestamp: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontSize: 10,
    marginTop: theme.spacing.xs / 2,
    marginHorizontal: theme.spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    ...theme.typography.body,
    color: theme.colors.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.mint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.border,
    opacity: 0.5,
  },
});

