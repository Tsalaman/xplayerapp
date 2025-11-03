import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  ViewStyle,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface DialogProps {
  visible: boolean;
  title?: string;
  message?: string;
  children?: React.ReactNode;
  onClose: () => void;
  primaryAction?: {
    label: string;
    onPress: () => void;
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
  showCloseButton?: boolean;
  style?: ViewStyle;
}

export default function Dialog({
  visible,
  title,
  message,
  children,
  onClose,
  primaryAction,
  secondaryAction,
  showCloseButton = true,
  style,
}: DialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
=         <View style={[styles.dialogContainer, style]}>
              {/* Glassmorphism Background with Mint Tint */}
              <LinearGradient
                colors={[theme.colors.surface + 'F0', theme.colors.mint + '20']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.dialog}
              >
              {showCloseButton && (
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              )}
              {title && <Text style={styles.title}>{title}</Text>}
              {message && <Text style={styles.message}>{message}</Text>}
              {children && <View style={styles.content}>{children}</View>}
              {(primaryAction || secondaryAction) && (
                <View style={styles.actions}>
                  {secondaryAction && (
                    <TouchableOpacity
                      style={[styles.button, styles.secondaryButton]}
                      onPress={secondaryAction.onPress}
                    >
                      <Text style={styles.secondaryButtonText}>{secondaryAction.label}</Text>
                    </TouchableOpacity>
                  )}
                  {primaryAction && (
                    <TouchableOpacity
                      style={[styles.button, styles.primaryButton]}
                      onPress={primaryAction.onPress}
                    >
                      <Text style={styles.primaryButtonText}>{primaryAction.label}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              </LinearGradient>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  dialogContainer: {
    borderRadius: theme.borderRadius.xl * 2, // rounded-2xl
    overflow: 'hidden',
    minWidth: 280,
    maxWidth: '90%',
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.mint,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  dialog: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl * 2,
    ...Platform.select({
      ios: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
      },
      android: {
        backgroundColor: theme.colors.surface,
      },
    }),
  },
  closeButton: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    padding: theme.spacing.xs,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.surface,
    marginBottom: theme.spacing.md,
    paddingRight: theme.spacing.xl,
    fontWeight: '700',
  },
  message: {
    ...theme.typography.body,
    color: theme.colors.surface + 'CC',
    marginBottom: theme.spacing.lg,
  },
  content: {
    marginBottom: theme.spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  button: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    minWidth: 80,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    ...theme.typography.body,
    color: theme.colors.surface + 'CC',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: theme.colors.mint,
  },
  primaryButtonText: {
    ...theme.typography.body,
    color: theme.colors.navy,
    fontWeight: '700',
  },
});

