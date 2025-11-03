import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../../constants/theme';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Badge({
  label,
  variant = 'default',
  size = 'md',
  style,
  textStyle,
}: BadgeProps) {
  return (
    <View style={[styles.badge, styles[variant], styles[size], style]}>
      <Text style={[styles.text, styles[`${variant}Text`], styles[`${size}Text`], textStyle]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  // Variants
  default: {
    backgroundColor: theme.colors.border,
  },
  primary: {
    backgroundColor: theme.colors.primary + '20',
  },
  success: {
    backgroundColor: theme.colors.success + '20',
  },
  warning: {
    backgroundColor: theme.colors.warning + '20',
  },
  error: {
    backgroundColor: theme.colors.error + '20',
  },
  info: {
    backgroundColor: theme.colors.info + '20',
  },
  // Sizes
  sm: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
  },
  md: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  lg: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  // Text styles
  text: {
    ...theme.typography.caption,
    fontWeight: '600',
  },
  defaultText: {
    color: theme.colors.text,
  },
  primaryText: {
    color: theme.colors.primary,
  },
  successText: {
    color: theme.colors.success,
  },
  warningText: {
    color: theme.colors.warning,
  },
  errorText: {
    color: theme.colors.error,
  },
  infoText: {
    color: theme.colors.info,
  },
  smText: {
    fontSize: 10,
    lineHeight: 12,
  },
  mdText: {
    ...theme.typography.caption,
  },
  lgText: {
    ...theme.typography.body,
  },
});

