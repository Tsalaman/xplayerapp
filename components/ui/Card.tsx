import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../../constants/theme';
import FadeUp from '../animations/FadeUp';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  animated?: boolean;
  delay?: number;
}

export default function Card({
  children,
  variant = 'default',
  padding = 'md',
  style,
  animated = true,
  delay = 0,
}: CardProps) {
  const cardContent = (
    <View style={[styles.card, styles[variant], styles[`padding${padding.charAt(0).toUpperCase() + padding.slice(1)}`], style]}>
      {children}
    </View>
  );

  if (animated) {
    return (
      <FadeUp duration={350} delay={delay}>
        {cardContent}
      </FadeUp>
    );
  }

  return cardContent;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
  },
  default: {
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  outlined: {
    borderWidth: 2,
    borderColor: theme.colors.navy,
  },
  paddingNone: {
    padding: 0,
  },
  paddingSm: {
    padding: theme.spacing.sm,
  },
  paddingMd: {
    padding: theme.spacing.md,
  },
  paddingLg: {
    padding: theme.spacing.lg,
  },
});

