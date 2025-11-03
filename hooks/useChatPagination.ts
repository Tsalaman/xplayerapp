import { useState, useCallback, useEffect } from 'react';
import { Cursor } from '../utils/cursor';
import { ChatMessage } from '../types';

interface UseChatPaginationOptions {
  fetchPage: (cursor: Cursor, limit: number) => Promise<{
    data: ChatMessage[];
    nextCursor: Cursor;
    hasMore: boolean;
  }>;
  limit?: number;
}

/**
 * Custom pagination hook for chat messages
 * - Messages are ordered oldest to newest (for display)
 * - Loading more prepends older messages to the beginning
 * - New messages are appended to the end via real-time updates
 */
export function useChatPagination(options: UseChatPaginationOptions) {
  const { fetchPage, limit = 20 } = options;

  const [items, setItems] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<Cursor>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPage(null, limit);
      // Messages come in DESC order (newest first), reverse for display (oldest first)
      const reversed = result.data.reverse();
      setItems(reversed);
      setNextCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch (err: any) {
      setError(err.message || 'Failed to load messages');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [fetchPage, limit]);

  // Auto-load initial data
  useEffect(() => {
    if (items.length === 0 && !loading) {
      loadInitial();
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !nextCursor) return;

    setLoading(true);
    setError(null);
    try {
      const result = await fetchPage(nextCursor, limit);
      // Messages come in DESC order (newest first), reverse for display (oldest first)
      // Prepend older messages to the beginning of the list
      const reversed = result.data.reverse();
      setItems(prev => [...reversed, ...prev]);
      setNextCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch (err: any) {
      setError(err.message || 'Failed to load more messages');
    } finally {
      setLoading(false);
    }
  }, [fetchPage, limit, loading, hasMore, nextCursor]);

  const refresh = useCallback(async () => {
    setItems([]);
    setNextCursor(null);
    setHasMore(true);
    await loadInitial();
  }, [loadInitial]);

  return {
    items,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    loadInitial,
  };
}

