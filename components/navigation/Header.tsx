import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import { t } from '../../utils/i18n';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: {
    icon?: keyof typeof Ionicons.glyphMap;
    label?: string;
    onPress?: () => void;
  };
  showAvatar?: boolean;
  avatarName?: string;
  badge?: string | number;
  style?: ViewStyle;
}

export default function Header({
  title,
  subtitle,
  showBack = false,
  rightAction,
  showAvatar = false,
  avatarName,
  badge,
  style,
}: HeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(tabs)/home');
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.colors.text}
            />
          </TouchableOpacity>
        )}
        {showAvatar && avatarName && (
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile')}
            style={styles.avatarContainer}
          >
            <Avatar name={avatarName} size="md" />
            {badge !== undefined && (
              <View style={styles.badgeContainer}>
                <Badge
                  label={String(badge)}
                  variant="primary"
                  size="sm"
                  style={styles.badge}
                />
              </View>
            )}
          </TouchableOpacity>
        )}
        {(title || subtitle) && (
          <View style={styles.titleContainer}>
            {title && (
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
            )}
            {subtitle && (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>
        )}
      </View>

      {rightAction && (
        <TouchableOpacity
          onPress={rightAction.onPress}
          style={styles.rightButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {rightAction.icon && (
            <Ionicons
              name={rightAction.icon}
              size={24}
              color={theme.colors.primary}
            />
          )}
          {rightAction.label && (
            <Text style={styles.rightLabel}>{rightAction.label}</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    minHeight: 56,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.sm,
  },
  backButton: {
    padding: theme.spacing.xs,
    marginLeft: -theme.spacing.xs,
  },
  avatarContainer: {
    position: 'relative',
  },
  badgeContainer: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  badge: {
    marginBottom: 0,
  },
  titleContainer: {
    flex: 1,
    marginLeft: theme.spacing.xs,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text,
    fontWeight: '700',
  },
  subtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs / 4,
  },
  rightButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    padding: theme.spacing.xs,
    marginRight: -theme.spacing.xs,
  },
  rightLabel: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

