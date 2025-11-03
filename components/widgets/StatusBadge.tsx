import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import Badge from '../ui/Badge';

type StatusType = 'online' | 'offline' | 'in-game' | 'away';

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  style?: ViewStyle;
}

export default function StatusBadge({
  status,
  size = 'md',
  showLabel = false,
  style,
}: StatusBadgeProps) {
  const getIcon = () => {
    switch (status) {
      case 'online':
        return 'radio-button-on';
      case 'offline':
        return 'radio-button-off';
      case 'in-game':
        return 'play-circle';
      case 'away':
        return 'time';
      default:
        return 'radio-button-off';
    }
  };

  const getColor = () => {
    switch (status) {
      case 'online':
        return theme.colors.success;
      case 'offline':
        return theme.colors.textSecondary;
      case 'in-game':
        return theme.colors.primary;
      case 'away':
        return theme.colors.warning;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'offline':
        return 'Offline';
      case 'in-game':
        return 'In Game';
      case 'away':
        return 'Away';
      default:
        return 'Unknown';
    }
  };

  const sizeMap = {
    sm: 8,
    md: 12,
    lg: 16,
  };

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.indicator, { backgroundColor: getColor() }]}>
        <Ionicons
          name={getIcon() as any}
          size={sizeMap[size]}
          color={theme.colors.surface}
        />
      </View>
      {showLabel && (
        <Text style={styles.label}>{getLabel()}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  indicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
});

