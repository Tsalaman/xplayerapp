import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  withGradient?: boolean;
  withShadowGlow?: boolean;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
  withGradient = false,
  withShadowGlow = false,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const buttonContent = (
    <>
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor(variant)} />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text style={[styles.text, styles[`${variant}Text`], styles[`${size}Text`], textStyle]}>
            {title}
          </Text>
        </>
      )}
    </>
  );

  // CTA Button with gradient and shadow glow
  if (withGradient && variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[
          styles.button,
          styles.rounded2xl,
          withShadowGlow && styles.shadowGlow,
          isDisabled && styles.disabled,
          style,
        ]}
      >
        <LinearGradient
          colors={[theme.colors.navy, theme.colors.mint]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientButton, styles[size]]}
        >
          {buttonContent}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[variant],
        styles[size],
        styles.rounded2xl,
        withShadowGlow && styles.shadowGlow,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {buttonContent}
    </TouchableOpacity>
  );
}

function getTextColor(variant: ButtonVariant): string {
  switch (variant) {
    case 'primary':
      return theme.colors.surface;
    case 'secondary':
      return theme.colors.surface;
    case 'outline':
      return theme.colors.primary;
    case 'ghost':
      return theme.colors.primary;
    case 'danger':
      return theme.colors.surface;
    default:
      return theme.colors.surface;
  }
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  rounded2xl: {
    borderRadius: theme.borderRadius.xl * 2, // rounded-2xl equivalent
  },
  shadowGlow: {
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.mint,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    borderRadius: theme.borderRadius.xl * 2,
  },
  // Variants
  primary: {
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: theme.colors.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: theme.colors.error,
  },
  // Sizes
  sm: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: 36,
  },
  md: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    minHeight: 48,
  },
  lg: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    minHeight: 56,
  },
  // Text styles
  text: {
    ...theme.typography.body,
    fontWeight: '600',
  },
  primaryText: {
    color: theme.colors.surface,
  },
  secondaryText: {
    color: theme.colors.surface,
  },
  outlineText: {
    color: theme.colors.primary,
  },
  ghostText: {
    color: theme.colors.primary,
  },
  dangerText: {
    color: theme.colors.surface,
  },
  smText: {
    ...theme.typography.caption,
  },
  mdText: {
    ...theme.typography.body,
  },
  lgText: {
    ...theme.typography.h3,
  },
  disabled: {
    opacity: 0.6,
  },
});

