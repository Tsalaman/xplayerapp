import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Image,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../constants/theme';
import { supabase } from '../../services/supabase';
import { chatService } from '../../services/chat';
import haptic from '../../utils/haptic';
import { Vibration } from 'react-native';

interface MessageComposerProps {
  chatId: string;
  userId: string;
  userNickname: string;
  userAvatar?: string;
  onMessageSent?: () => void;
  onTextChange?: (text: string) => void; // For typing indicator
}

/**
 * Message Composer Component
 * - Text input with gradient send button
 * - Image upload support
 * - Loading state with animation
 * - Haptic feedback on send
 */
export default function MessageComposer({
  chatId,
  userId,
  userNickname,
  userAvatar,
  onMessageSent,
  onTextChange,
}: MessageComposerProps) {
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const sendButtonScale = React.useRef(new Animated.Value(1)).current;

  const handleSend = async () => {
    if (!messageText.trim() || sending || uploading) return;

    haptic.light();
    setSending(true);

    // Animate send button
    Animated.sequence([
      Animated.timing(sendButtonScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(sendButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      await chatService.sendMessage(
        chatId,
        userId,
        userNickname,
        userAvatar,
        messageText.trim()
      );

      setMessageText('');
      
      // Sound feedback on send
      if (Platform.OS === 'android') {
        Vibration.vibrate(15);
      }

      if (onMessageSent) {
        onMessageSent();
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      Alert.alert('Error', error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission needed', 'Please grant access to your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) return;

      setUploading(true);
      haptic.medium();

      const imageUri = result.assets[0].uri;
      const fileName = `${chatId}/${Date.now()}.jpg`;
      
      // Convert URI to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat_attachments')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('chat_attachments')
        .getPublicUrl(uploadData.path);

      // Send message with image URL
      await chatService.sendMessage(
        chatId,
        userId,
        userNickname,
        userAvatar,
        urlData.publicUrl
      );

      if (onMessageSent) {
        onMessageSent();
      }

      haptic.medium();
    } catch (error: any) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.attachButton}
        onPress={handleImageUpload}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator size="small" color={theme.colors.mint} />
        ) : (
          <Ionicons name="attach" size={24} color={theme.colors.mint} />
        )}
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Type a message..."
        placeholderTextColor={theme.colors.textSecondary}
        value={messageText}
        onChangeText={(text) => {
          setMessageText(text);
          if (onTextChange) {
            onTextChange(text);
          }
        }}
        multiline
        maxLength={1000}
        editable={!sending && !uploading}
      />

      {messageText.trim() && (
        <Animated.View style={{ transform: [{ scale: sendButtonScale }] }}>
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSend}
            disabled={sending || uploading}
          >
            <LinearGradient
              colors={[theme.colors.mint, theme.colors.surface]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sendButtonGradient}
            >
              {sending ? (
                <ActivityIndicator size="small" color={theme.colors.navy} />
              ) : (
                <Ionicons name="send" size={20} color={theme.colors.navy} />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  attachButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  input: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.xl * 2, // rounded-2xl
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.mint,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

