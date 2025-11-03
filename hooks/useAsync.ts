import { useState, useCallback, useEffect } from 'react';

interface UseAsyncOptions {
  immediate?: boolean;
}

interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to handle async operations with loading and error states
 * @param asyncFunction The async function to execute
 * @param options Options for immediate execution
 * @returns Object with execute function, data, loading, and error states
 */
export function useAsync<T, Args extends any[] = []>(
  asyncFunction: (...args: Args) => Promise<T>,
  options: UseAsyncOptions = { immediate: false }
) {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: Args) => {
      setState({ data: null, loading: true, error: null });
      try {
        const data = await asyncFunction(...args);
        setState({ data, loading: false, error: null });
        return data;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setState({ data: null, loading: false, error: err });
        throw error;
      }
    },
    [asyncFunction]
  );

  useEffect(() => {
    if (options.immediate) {
      execute();
    }
  }, []);

  return {
    ...state,
    execute,
    reset: useCallback(() => {
      setState({ data: null, loading: false, error: null });
    }, []),
  };
}

