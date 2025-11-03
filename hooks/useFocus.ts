import { useEffect, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Hook that runs callback when screen comes into focus
 * @param callback Function to run on focus
 * @param deps Dependencies array (optional)
 */
export function useFocus(callback: () => void, deps: any[] = []) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback, ...deps]);

  useFocusEffect(
    useCallback(() => {
      callbackRef.current();
    }, [])
  );
}

