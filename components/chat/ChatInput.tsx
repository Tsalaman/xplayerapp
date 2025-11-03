import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface ChatInputProps {
  placeholder?: string;
  onSend: (message: string) => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function ChatInput({
  placeholder = 'Type a message...',
  onSend,
  disabled = false,
  style,
}: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: any) => {
    // Handle Enter key on some platforms if needed
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.attachButton}
          onPress={() => {
            // Handle attachment
          }}
          disabled={disabled}
        >
          <Ionicons
            name="attach"
            size={24}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={1000}
          editable={!disabled}
          onKeyPress={handleKeyPress}
        />
        {message.trim() ? (
          <TouchableOpacity
            style={[styles.sendButton, disabled && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={disabled}
          >
            <Ionicons
              name="send"
              size={24}
              color={disabled ? theme.colors.textSecondary : theme.colors.primary}
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.emojiButton}
            onPress={() => {
              // Handle emoji picker
            }}
            disabled={disabled}
          >
            <Ionicons
              name="happy"
              size={24}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  attachButton: {
    padding: theme.spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.text,
    maxHeight: 100,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
  },
  sendButton: {
    padding: theme.spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  emojiButton: {
    padding: theme.spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

