import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/api';
import { theme } from '../../constants/theme';
import ProgressBar from '../../components/ui/ProgressBar';
import GradientButton from '../../components/ui/GradientButton';
import XPlayerLogo from '../../components/XPlayerLogo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_DATA_KEY = '@onboarding_profile_data';

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load saved data on mount
  React.useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    try {
      const saved = await AsyncStorage.getItem(ONBOARDING_DATA_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        setNickname(data.nickname || '');
        setBio(data.bio || '');
        setLocation(data.location || '');
        setImageUri(data.imageUri || null);
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  };

  const saveData = async () => {
    try {
      await AsyncStorage.setItem(
        ONBOARDING_DATA_KEY,
        JSON.stringify({
          nickname,
          bio,
          location,
          imageUri,
        })
      );
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  // Auto-save on change
  React.useEffect(() => {
    saveData();
  }, [nickname, bio, location, imageUri]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission', 'Permission to access camera roll is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleNext = async () => {
    if (!nickname.trim()) {
      Alert.alert('Validation', 'Please enter your nickname');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not found');
      return;
    }

    setLoading(true);
    try {
      let uploadedImageUrl: string | undefined;

      // Upload image if exists
      if (imageUri) {
        try {
          uploadedImageUrl = await userService.uploadAvatar(
            { uri: imageUri },
            user.id
          );
        } catch (error: any) {
          console.error('Image upload error:', error);
          // Continue without image if upload fails
        }
      }

      // Save profile data (will be completed in next step)
      await AsyncStorage.setItem(
        ONBOARDING_DATA_KEY,
        JSON.stringify({
          nickname,
          bio,
          location,
          imageUri,
          profilePicture: uploadedImageUrl,
        })
      );

      // Navigate to sports selection
      router.push('/onboarding/sports');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Setup',
      'You can complete your profile later. Continue to the app?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          onPress: () => {
            router.replace('/(tabs)/home');
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ProgressBar current={1} total={3} />
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <XPlayerLogo size={64} color={theme.colors.primary} />
          </View>

          <Text style={styles.title}>Καλώς ήρθες στο XPlayer!</Text>
          <Text style={styles.subtitle}>
            Φτιάξε το προφίλ σου για να σε γνωρίσουν οι άλλοι αθλητές 👇
          </Text>

          <View style={styles.photoContainer}>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={pickImage}
            >
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.photo} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons
                    name="camera-outline"
                    size={40}
                    color={theme.colors.textSecondary}
                  />
                  <Text style={styles.photoText}>Add Photo</Text>
                </View>
              )}
              <View style={styles.editIcon}>
                <Ionicons
                  name="pencil"
                  size={16}
                  color={theme.colors.surface}
                />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons
                name="person-outline"
                size={20}
                color={theme.colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Full Name (nickname)"
                placeholderTextColor={theme.colors.textSecondary}
                value={nickname}
                onChangeText={setNickname}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons
                name="text-outline"
                size={20}
                color={theme.colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, styles.bioInput]}
                placeholder="Bio (short description)"
                placeholderTextColor={theme.colors.textSecondary}
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={3}
                maxLength={150}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons
                name="location-outline"
                size={20}
                color={theme.colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Location (city, area)"
                placeholderTextColor={theme.colors.textSecondary}
                value={location}
                onChangeText={setLocation}
                autoCapitalize="words"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <GradientButton
          title="Next"
          onPress={handleNext}
          loading={loading}
          disabled={!nickname.trim()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.lg,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  skipButton: {
    alignSelf: 'flex-end',
    padding: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  skipText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 24,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  photoButton: {
    position: 'relative',
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.surface,
    borderWidth: 3,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.surface,
  },
  form: {
    gap: theme.spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    minHeight: 56,
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.text,
    paddingVertical: theme.spacing.md,
  },
  bioInput: {
    minHeight: 80,
    paddingTop: theme.spacing.md,
  },
  footer: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
});

