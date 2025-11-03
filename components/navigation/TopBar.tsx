import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  ViewStyle,
  PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationsContext';
import { theme } from '../../constants/theme';
import XPlayerLogo from '../XPlayerLogo';
import haptic from '../../utils/haptic';

interface TopBarProps {
  scrollY?: Animated.Value;
  scrollThreshold?: number;
  style?: ViewStyle;
}

/**
 * TopBar with scroll-based gradient transition
 * Changes from transparent to navy→mint gradient on scroll
 * Includes blur effect and notification badge with pulse animation
 */
export default function TopBar({
  scrollY,
  scrollThreshold = 50,
  style,
}: TopBarProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const [isScrolled, setIsScrolled] = useState(false);
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const badgeScaleAnim = useRef(new Animated.Value(1)).current;
  const previousUnreadCount = useRef(unreadCount);
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Detect right swipe gesture (> 50px horizontal movement)
        return Math.abs(gestureState.dx) > 50 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        // Right swipe (positive dx) = go back
        if (gestureState.dx > 50 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy)) {
          haptic.light();
          router.back();
        }
      },
    })
  ).current;

  // Listen to scroll position
  useEffect(() => {
    if (!scrollY) return;

    const listenerId = scrollY.addListener(({ value }) => {
      const shouldBeScrolled = value > scrollThreshold;
      if (shouldBeScrolled !== isScrolled) {
        setIsScrolled(shouldBeScrolled);
        Animated.timing(opacityAnim, {
          toValue: shouldBeScrolled ? 1 : 0,
          duration: 400,
          useNativeDriver: false,
        }).start();
      }
    });

    return () => {
      scrollY.removeListener(listenerId);
    };
  }, [scrollY, scrollThreshold, isScrolled, opacityAnim]);

  // Pulse animation for notification badge when new notification arrives
  useEffect(() => {
    if (unreadCount > previousUnreadCount.current) {
      // New notification arrived
      Animated.sequence([
        Animated.timing(badgeScaleAnim, {
          toValue: 1.3,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(badgeScaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
    previousUnreadCount.current = unreadCount;
  }, [unreadCount]);

  const handleNotificationPress = () => {
    haptic.light();
    router.push('/(tabs)/notifications');
  };

  const handleProfilePress = () => {
    haptic.light();
    router.push('/(tabs)/profile');
  };

  const handleLogoPress = () => {
    haptic.light();
    router.push('/(tabs)/home');
  };

  return (
    <SafeAreaView style={[styles.safeArea, style]} edges={['top']}>
      <View style={styles.container} {...panResponder.panHandlers}>
        {/* Gradient Background - Animated on scroll */}
        {isScrolled && (
          <Animated.View
            style={[
              styles.gradientContainer,
              {
                opacity: opacityAnim,
              },
            ]}
          >
            <LinearGradient
              colors={[theme.colors.navy, theme.colors.mint]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>
        )}

        {/* Semi-transparent overlay for blur effect */}
        {isScrolled && (
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              {
                opacity: opacityAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.3],
                }),
                backgroundColor: theme.colors.navy,
              },
            ]}
            pointerEvents="none"
          />
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Logo */}
          <TouchableOpacity
            style={styles.logoContainer}
            onPress={handleLogoPress}
            activeOpacity={0.7}
          >
            <XPlayerLogo
              size={32}
              color={isScrolled ? theme.colors.navy : theme.colors.navy}
              showText={true}
              textColor={isScrolled ? theme.colors.surface : theme.colors.navy}
            />
          </TouchableOpacity>

          {/* Actions */}
          <View style={styles.actions}>
            {/* Notifications */}
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={handleNotificationPress}
              activeOpacity={0.7}
            >
              <Ionicons
                name={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
                size={24}
                color={isScrolled ? theme.colors.surface : theme.colors.navy}
              />
              {unreadCount > 0 && (
                <Animated.View
                  style={[
                    styles.badge,
                    {
                      transform: [{ scale: badgeScaleAnim }],
                    },
                  ]}
                  accessible={true}
                  accessibilityRole="text"
                  accessibilityLabel={`${unreadCount} unread notifications`}
                  accessibilityLiveRegion="polite"
                >
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </Animated.View>
              )}
            </TouchableOpacity>

            {/* Profile */}
            <TouchableOpacity
              style={styles.profileButton}
              onPress={handleProfilePress}
              activeOpacity={0.7}
            >
              {user?.profilePicture ? (
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>
                    {user.nickname?.[0]?.toUpperCase() || 'U'}
                  </Text>
                </View>
              ) : (
                <Ionicons
                  name="person-circle-outline"
                  size={28}
                  color={isScrolled ? theme.colors.surface : theme.colors.navy}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: 'transparent',
    zIndex: 1000,
  },
  container: {
    position: 'relative',
    minHeight: 56,
    overflow: 'hidden',
  },
  gradientContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: 56,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  notificationButton: {
    position: 'relative',
    padding: theme.spacing.xs,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: theme.colors.navy,
  },
  badgeText: {
    color: theme.colors.surface,
    fontSize: 10,
    fontWeight: 'bold',
  },
  profileButton: {
    padding: theme.spacing.xs,
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.mint,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  avatarText: {
    ...theme.typography.body,
    color: theme.colors.navy,
    fontWeight: '600',
    fontSize: 14,
  },
});

