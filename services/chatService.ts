import { supabase } from './supabase';
import { Chat, ChatMessage } from '../types';
import { PaginatedResponse } from './api';
import { Cursor, getChatMessageCursorFields, createChatMessageCursor } from '../utils/cursor';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Enhanced Chat Service with real-time subscriptions
 */
export const chatService = {
  /**
   * Get or create a chat between two users
   */
  getOrCreateChat: async (userId1: string, userId2: string): Promise<Chat> => {
    const { data, error } = await supabase.rpc('get_or_create_chat', {
      user_id_1: userId1,
      user_id_2: userId2,
    });

    if (error) throw error;

    // Fetch the chat details
    const { data: chatData, error: fetchError } = await supabase
      .from('chats')
      .select('*')
      .eq('id', data)
      .single();

    if (fetchError) throw fetchError;
    return mapChatFromDb(chatData);
  },

  /**
   * Get chat messages with cursor pagination
   */
  getChatMessagesPaginated: async (
    chatId: string,
    limit: number = 20,
    cursor: Cursor = null
  ): Promise<PaginatedResponse<ChatMessage>> => {
    let cursorCreatedAt: string | null = null;
    let cursorId: string | null = null;

    if (cursor) {
      const cursorFields = getChatMessageCursorFields(cursor);
      if (cursorFields) {
        cursorCreatedAt = cursorFields.created_at;
        cursorId = cursorFields.id;
      }
    }

    const { data, error } = await supabase.rpc('get_chat_messages_paginated', {
      p_chat_id: chatId,
      cursor_created_at: cursorCreatedAt,
      cursor_id: cursorId,
      limit_count: limit + 1,
    });

    if (error) throw error;

    const messages = data ? data.map(mapChatMessageFromDb) : [];
    const hasMore = messages.length > limit;
    const messagesToReturn = hasMore ? messages.slice(0, limit) : messages;

    const nextCursor = messagesToReturn.length > 0
      ? createChatMessageCursor(
          messagesToReturn[messagesToReturn.length - 1].createdAt,
          messagesToReturn[messagesToReturn.length - 1].id
        )
      : null;

    return {
      data: messagesToReturn,
      nextCursor,
      hasMore,
    };
  },

  /**
   * Get all messages (for initial load)
   */
  getMessages: async (chatId: string, limit: number = 50): Promise<ChatMessage[]> => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true }) // Ascending for chat display
      .limit(limit);

    if (error) throw error;
    return data ? data.map(mapChatMessageFromDb) : [];
  },

  /**
   * Get conversations for a user
   */
  getConversations: async (userId: string) => {
    const { data, error } = await supabase
      .from('chats')
      .select('*, chat_participants(user_id)')
      .contains('participant_ids', [userId]);

    if (error) throw error;
    return data || [];
  },

  /**
   * Send a message to a chat
   */
  sendMessage: async (
    chatId: string,
    senderId: string,
    senderNickname: string,
    senderAvatar: string | undefined,
    text: string
  ): Promise<ChatMessage> => {
    const dbData = {
      chat_id: chatId,
      sender_id: senderId,
      sender_nickname: senderNickname,
      sender_avatar: senderAvatar || null,
      text: text.trim(),
    };

    const { data, error } = await supabase
      .from('chat_messages')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;
    return mapChatMessageFromDb(data);
  },

  /**
   * Subscribe to chat messages (real-time)
   */
  subscribeToChat: (
    chatId: string,
    onInsert: (message: ChatMessage) => void,
    onUpdate?: (message: ChatMessage) => void,
    onDelete?: (messageId: string) => void
  ): RealtimeChannel => {
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
          const message = mapChatMessageFromDb(payload.new);
          onInsert(message);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          if (onUpdate) {
            const message = mapChatMessageFromDb(payload.new);
            onUpdate(message);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          if (onDelete) {
            onDelete(payload.old.id);
          }
        }
      )
      .subscribe();

    return channel;
  },

  /**
   * Subscribe to typing indicators (presence)
   */
  subscribeToTyping: (
    chatId: string,
    userId: string,
    onTypingChange: (typingUsers: string[]) => void
  ): RealtimeChannel => {
    const channel = supabase
      .channel(`chat:${chatId}:presence`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const typingUsers = Object.values(state)
          .flat()
          .filter((presence: any) => presence.typing && presence.user_id !== userId)
          .map((presence: any) => presence.user_nickname || presence.user_id);
        onTypingChange(typingUsers);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        const typingUsers = newPresences
          .filter((presence: any) => presence.typing && presence.user_id !== userId)
          .map((presence: any) => presence.user_nickname || presence.user_id);
        onTypingChange(typingUsers);
      })
      .on('presence', { event: 'leave' }, () => {
        const state = channel.presenceState();
        const typingUsers = Object.values(state)
          .flat()
          .filter((presence: any) => presence.typing && presence.user_id !== userId)
          .map((presence: any) => presence.user_nickname || presence.user_id);
        onTypingChange(typingUsers);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId,
            typing: false,
            online_at: new Date().toISOString(),
          });
        }
      });

    return channel;
  },

  /**
   * Update typing status
   */
  setTyping: async (channel: RealtimeChannel, userId: string, userNickname: string, typing: boolean) => {
    await channel.track({
      user_id: userId,
      user_nickname: userNickname,
      typing,
      online_at: new Date().toISOString(),
    });
  },
};

/**
 * Map database chat to Chat type
 */
function mapChatFromDb(dbChat: any): Chat {
  return {
    id: dbChat.id,
    participantIds: dbChat.participant_ids || [],
    createdAt: dbChat.created_at,
    updatedAt: dbChat.updated_at || dbChat.created_at,
  };
}

/**
 * Map database chat message to ChatMessage type
 */
function mapChatMessageFromDb(dbMessage: any): ChatMessage {
  return {
    id: dbMessage.id,
    chatId: dbMessage.chat_id,
    senderId: dbMessage.sender_id,
    senderNickname: dbMessage.sender_nickname,
    senderAvatar: dbMessage.sender_avatar || undefined,
    text: dbMessage.text,
    createdAt: dbMessage.created_at,
  };
}

