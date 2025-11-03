import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  ViewStyle,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { theme } from '../../constants/theme';
import haptic from '../../utils/haptic';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TABLET_WIDTH = 768;
const DESKTOP_WIDTH = 1024;

interface TabItem {
  name: string;
  route: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  badge?: number;
}

interface BottomTabBarProps {
  style?: ViewStyle;
}

/**
 * Enhanced BottomTabBar with:
 * - Scale animations on active state
 * - Opacity transitions
 * - Responsive design (tablet/desktop)
 * - Mint color scheme
 * - Increased spacing and rounded corners
 */
export default function BottomTabBar({ style }: BottomTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isTablet, setIsTablet] = useState(SCREEN_WIDTH >= TABLET_WIDTH);
  const [isDesktop, setIsDesktop] = useState(SCREEN_WIDTH >= DESKTOP_WIDTH);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setIsTablet(window.width >= TABLET_WIDTH);
      setIsDesktop(window.width >= DESKTOP_WIDTH);
    });

    return () => subscription?.remove();
  }, []);

  const TABS: TabItem[] = [
    { name: 'home', route: '/(tabs)/home', icon: 'home', label: 'Home' },
    { name: 'explore', route: '/(tabs)/explore', icon: 'compass', label: 'Explore' },
    { name: 'posts', route: '/(tabs)/posts', icon: 'chatbubbles', label: 'Chat' },
    { name: 'profile', route: '/(tabs)/profile', icon: 'person', label: 'Profile' },
  ];

  const isActive = (route: string) => {
    return pathname === route || pathname?.startsWith(route + '/');
  };

  const handleTabPress = (route: string) => {
    haptic.light();
    router.push(route as any);
  };

  if (isDesktop) {
    // Sidebar layout for desktop
    return (
      <View style={[styles.sidebar, style]}>
        {TABS.map((tab) => {
          const active = isActive(tab.route);
          return (
            <TabButton
              key={tab.name}
              tab={tab}
              active={active}
              onPress={() => handleTabPress(tab.route)}
              vertical={true}
            />
          );
        })}
      </View>
    );
  }

  return (
    <View style={[styles.container, isTablet && styles.containerTablet, style]}>
      {TABS.map((tab) => {
        const active = isActive(tab.route);
        return (
          <TabButton
            key={tab.name}
            tab={tab}
            active={active}
            onPress={() => handleTabPress(tab.route)}
            vertical={false}
          />
        );
      })}
    </View>
  );
}

interface TabButtonProps {
  tab: TabItem;
  active: boolean;
  onPress: () => void;
  vertical?: boolean;
}

function TabButton({ tab, active, onPress, vertical = false }: TabButtonProps) {
  const scaleAnim = useRef(new Animated.Value(active ? 1.1 : 1)).current;
  const opacityAnim = useRef(new Animated.Value(active ? 1 : 0.6)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: active ? 1.1 : 1,
        useNativeDriver: true,
        tension: 300,
        friction: 20,
      }),
      Animated.timing(opacityAnim, {
        toValue: active ? 1 : 0.6,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [active]);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.tab, vertical && styles.tabVertical]}
    >
      <Animated.View
        style={[
          styles.tabContent,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <Ionicons
          name={active ? tab.icon : (`${tab.icon}-outline` as any)}
          size={vertical ? 28 : 24}
          color={active ? theme.colors.mint : theme.colors.textSecondary}
        />
        {tab.badge && tab.badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {tab.badge > 99 ? '99+' : tab.badge}
            </Text>
          </View>
        )}
      </Animated.View>
      {!vertical && (
        <Text
          style={[
            styles.label,
            active && styles.labelActive,
          ]}
          numberOfLines={1}
        >
          {tab.label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    minHeight: 64,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.navy,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  containerTablet: {
    paddingHorizontal: theme.spacing.xl,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: theme.colors.surface,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    gap: theme.spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.navy,
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.xs / 2,
  },
  tabVertical: {
    flex: 0,
    width: '100%',
    paddingVertical: theme.spacing.md,
  },
  tabContent: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -12,
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xs / 2,
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  badgeText: {
    ...theme.typography.caption,
    color: theme.colors.surface,
    fontSize: 10,
    fontWeight: '700',
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  labelActive: {
    color: theme.colors.mint,
    fontWeight: '700',
  },
});

