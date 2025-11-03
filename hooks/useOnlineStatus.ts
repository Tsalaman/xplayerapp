import { useState, useEffect } from 'react';

/**
 * Hook to track online/offline status
 * Uses Expo's built-in networking capabilities
 * Note: For more advanced features, install @react-native-community/netinfo
 * @returns Object with isOnline boolean and network type
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [networkType, setNetworkType] = useState<string | null>(null);

  useEffect(() => {
    // Simple implementation - assumes online by default
    // For production, consider using @react-native-community/netinfo
    // or expo-network if available
    let isMounted = true;

    const checkConnection = async () => {
      try {
        // Basic connectivity check
        const response = await fetch('https://www.google.com', {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-store',
        });
        if (isMounted) {
          setIsOnline(true);
          setNetworkType('unknown');
        }
      } catch (error) {
        if (isMounted) {
          setIsOnline(false);
          setNetworkType(null);
        }
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30s

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return { isOnline, networkType };
}

