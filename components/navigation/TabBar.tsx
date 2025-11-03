import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { useRouter, usePathname } from 'expo-router';
import { t } from '../../utils/i18n';

interface TabItem {
  name: string;
  route: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  badge?: number;
}

const TABS: TabItem[] = [
  { name: 'home', route: '/(tabs)/home', icon: 'home', label: t('nav.home') },
  { name: 'explore', route: '/(tabs)/explore', icon: 'search', label: t('nav.explore') },
  { name: 'matches', route: '/(tabs)/matches', icon: 'basketball', label: t('nav.matches') },
  { name: 'posts', route: '/(tabs)/posts', icon: 'newspaper', label: t('nav.posts') },
  { name: 'profile', route: '/(tabs)/profile', icon: 'person', label: t('nav.profile') },
];

interface TabBarProps {
  style?: ViewStyle;
}

export default function TabBar({ style }: TabBarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (route: string) => {
    return pathname === route || pathname?.startsWith(route + '/');
  };

  return (
    <View style={[styles.container, style]}>
      {TABS.map((tab) => {
        const active = isActive(tab.route);
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={() => router.push(tab.route as any)}
            activeOpacity={0.7}
          >
            <View style={styles.tabContent}>
              <Ionicons
                name={active ? tab.icon : (`${tab.icon}-outline` as any)}
                size={24}
                color={active ? theme.colors.mint : theme.colors.textSecondary}
              />
              {tab.badge && tab.badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.label,
                active && styles.labelActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xs,
  },
  tabContent: {
    position: 'relative',
    marginBottom: theme.spacing.xs / 2,
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
    fontSize: 10,
    fontWeight: '500',
  },
  labelActive: {
    color: theme.colors.mint,
    fontWeight: '700',
  },
});

