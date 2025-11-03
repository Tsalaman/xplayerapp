import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface InputFieldProps extends TextInputProps {
  label?: string;
  placeholder?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  variant?: 'default' | 'outlined' | 'filled';
}

export default function InputField({
  label,
  placeholder,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  labelStyle,
  variant = 'outlined',
  style,
  ...textInputProps
}: InputFieldProps) {
  const hasError = !!error;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, hasError && styles.labelError, labelStyle]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          styles[variant],
          hasError && styles.inputContainerError,
          textInputProps.editable === false && styles.inputContainerDisabled,
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={
              hasError
                ? theme.colors.error
                : variant === 'filled'
                  ? theme.colors.textSecondary
                  : theme.colors.navy
            }
            style={styles.leftIcon}
          />
        )}
        <TextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
            style,
          ]}
          placeholder={placeholder}
          placeholderTextColor={
            variant === 'filled'
              ? theme.colors.textSecondary
              : theme.colors.textSecondary
          }
          {...textInputProps}
        />
        {rightIcon && (
          <View style={styles.rightIconContainer}>
            <Ionicons
              name={rightIcon}
              size={20}
              color={
                hasError
                  ? theme.colors.error
                  : variant === 'filled'
                    ? theme.colors.textSecondary
                    : theme.colors.navy
              }
              onPress={onRightIconPress}
            />
          </View>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    ...theme.typography.bodyMedium,
    color: theme.colors.navy,
    marginBottom: theme.spacing.xs,
  },
  labelError: {
    color: theme.colors.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    borderRadius: theme.borderRadius.md,
  },
  default: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
  },
  outlined: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.navy,
    paddingHorizontal: theme.spacing.md,
  },
  filled: {
    backgroundColor: theme.colors.background,
    borderWidth: 0,
    paddingHorizontal: theme.spacing.md,
  },
  inputContainerError: {
    borderColor: theme.colors.error,
  },
  inputContainerDisabled: {
    backgroundColor: theme.colors.background,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.navy,
    paddingVertical: theme.spacing.md,
  },
  inputWithLeftIcon: {
    marginLeft: theme.spacing.sm,
  },
  inputWithRightIcon: {
    marginRight: theme.spacing.sm,
  },
  leftIcon: {
    marginRight: theme.spacing.xs,
  },
  rightIconContainer: {
    padding: theme.spacing.xs,
  },
  errorText: {
    ...theme.typography.caption,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
});

