import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { ChatMessage } from '../types';

/**
 * Real-time messaging hook
 * Subscribes to chat messages and updates state automatically
 */
export function useChatRealtime(chatId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

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
          const newMessage: ChatMessage = {
            id: payload.new.id,
            chatId: payload.new.chat_id,
            senderId: payload.new.sender_id,
            senderNickname: payload.new.sender_nickname,
            senderAvatar: payload.new.sender_avatar || undefined,
            text: payload.new.text,
            createdAt: payload.new.created_at,
          };

          setMessages((prev) => {
            // Check if message already exists
            if (prev.find((m) => m.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  return { messages, setMessages };
}

