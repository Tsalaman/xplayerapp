import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationsContext';
import { theme } from '../../constants/theme';
import XPlayerLogo from '../XPlayerLogo';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  // Don't show layout for auth/onboarding screens
  const hideLayout = pathname?.startsWith('/(auth)') || 
                     pathname?.startsWith('/onboarding') ||
                     pathname === '/';

  if (hideLayout) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.navy, theme.colors.mint]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* TopBar */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.logoContainer}
              onPress={() => router.push('/(tabs)/home')}
            >
              <XPlayerLogo 
                size={32} 
                color={theme.colors.navy}
                showText={true}
                textColor={theme.colors.mint}
              />
            </TouchableOpacity>

            <View style={styles.topBarActions}>
              {/* Notifications */}
              <TouchableOpacity
                style={styles.notificationButton}
                onPress={() => router.push('/(tabs)/notifications')}
              >
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color={theme.colors.surface}
                />
                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Profile */}
              <TouchableOpacity
                style={styles.profileButton}
                onPress={() => router.push('/(tabs)/profile')}
              >
                {user?.profilePicture ? (
                  <View style={styles.avatarContainer}>
                    {/* You can add Image component here */}
                    <Text style={styles.avatarText}>
                      {user.nickname?.[0]?.toUpperCase() || 'U'}
                    </Text>
                  </View>
                ) : (
                  <Ionicons
                    name="person-circle-outline"
                    size={28}
                    color={theme.colors.surface}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  gradient: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  safeArea: {
    backgroundColor: 'transparent',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    minHeight: 56,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  logoText: {
    ...theme.typography.h3,
    color: theme.colors.surface,
    fontWeight: '700',
  },
  topBarActions: {
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
    top: 0,
    right: 0,
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
    backgroundColor: theme.colors.mintLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  avatarText: {
    ...theme.typography.body,
    color: theme.colors.surface,
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});

