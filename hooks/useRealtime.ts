import { useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeOptions {
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
}

/**
 * Hook to manage real-time subscriptions
 * @param channel The Supabase real-time channel
 * @param options Callback functions for different events
 */
export function useRealtime(
  channel: RealtimeChannel | null,
  options: UseRealtimeOptions = {}
) {
  const { onInsert, onUpdate, onDelete } = options;
  const channelRef = useRef<RealtimeChannel | null>(channel);

  useEffect(() => {
    channelRef.current = channel;
  }, [channel]);

  useEffect(() => {
    if (!channelRef.current) return;

    const unsubscribe = () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };

    return unsubscribe;
  }, []);

  return {
    unsubscribe: () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    },
  };
}

