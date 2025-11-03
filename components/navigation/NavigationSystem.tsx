import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, usePathname, useSegments } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import TopBar from './TopBar';
import BottomTabBar from './BottomTabBar';
import FloatingActionButton from './FloatingActionButton';
import { theme } from '../../constants/theme';

interface NavigationSystemProps {
  children: React.ReactNode;
}

const NAVIGATION_STORAGE_KEY = '@navigation:lastActivePage';

/**
 * Navigation System Component
 * - Manages navigation state persistence
 * - Handles automatic navigation after login
 * - Provides TopBar, BottomTabBar, and FloatingActionButton
 */
export default function NavigationSystem({ children }: NavigationSystemProps) {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const { user } = useAuth();
  const [lastActivePage, setLastActivePage] = useLocalStorage<string>(
    NAVIGATION_STORAGE_KEY,
    '/(tabs)/home'
  );
  const [isInitialized, setIsInitialized] = useState(false);
  const hasNavigatedRef = useRef(false);

  // Persist navigation state
  useEffect(() => {
    if (pathname && !pathname.startsWith('/(auth)') && !pathname.startsWith('/onboarding')) {
      setLastActivePage(pathname);
    }
  }, [pathname, setLastActivePage]);

  // Initialize on mount
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Auto-navigate to last active page after login (only once)
  useEffect(() => {
    if (!user || !isInitialized || hasNavigatedRef.current) return;

    // Only auto-navigate if we're on the index/root page
    if (pathname === '/' || pathname === '/(tabs)' || segments.length === 0) {
      const targetPage = lastActivePage || '/(tabs)/home';
      if (pathname !== targetPage) {
        hasNavigatedRef.current = true;
        router.replace(targetPage as any);
      }
    }
  }, [user, lastActivePage, pathname, segments, router, isInitialized]);

  // Don't show navigation for auth/onboarding screens
  const hideNavigation =
    pathname?.startsWith('/(auth)') ||
    pathname?.startsWith('/onboarding') ||
    pathname === '/';

  if (hideNavigation) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      {/* TopBar - Always visible on main screens */}
      <TopBar />

      {/* Content */}
      <View style={styles.content}>{children}</View>

      {/* BottomTabBar - Only on tab screens */}
      {pathname?.startsWith('/(tabs)') && <BottomTabBar />}

      {/* FloatingActionButton - Only on main tab screens */}
      {pathname?.startsWith('/(tabs)') && pathname !== '/(tabs)/profile' && (
        <FloatingActionButton />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
});

