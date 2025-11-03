import { useState, useCallback, useEffect } from 'react';
import { Cursor } from '../utils/cursor';

interface UsePaginationOptions<T> {
  fetchPage: (cursor: Cursor, limit: number) => Promise<{
    data: T[];
    nextCursor: Cursor;
    hasMore: boolean;
  }>;
  limit?: number;
  initialData?: T[];
}

export function usePagination<T>(options: UsePaginationOptions<T>) {
  const { fetchPage, limit = 20, initialData = [] } = options;

  const [items, setItems] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<Cursor>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPage(null, limit);
      setItems(result.data);
      setNextCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch (err: any) {
      setError(err.message || 'Failed to load items');
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
      setItems(prev => [...prev, ...result.data]);
      setNextCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch (err: any) {
      setError(err.message || 'Failed to load more items');
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

