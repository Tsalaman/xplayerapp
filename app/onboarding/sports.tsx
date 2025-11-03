import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/api';
import { theme } from '../../constants/theme';
import { Sport } from '../../types';
import ProgressBar from '../../components/ui/ProgressBar';
import GradientButton from '../../components/ui/GradientButton';
import SuccessModal from '../../components/ui/SuccessModal';
import XPlayerLogo from '../../components/XPlayerLogo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_DATA_KEY = '@onboarding_profile_data';
const SPORTS: { value: Sport; label: string; icon: string; color: string }[] = [
  { value: 'football', label: 'Football', icon: 'football', color: theme.sports.football },
  { value: 'basketball', label: 'Basketball', icon: 'basketball', color: theme.sports.basketball },
  { value: 'tennis', label: 'Tennis', icon: 'tennisball', color: theme.sports.tennis },
  { value: 'padel', label: 'Padel', icon: 'barbell', color: theme.sports.padel },
];

const SKILL_LEVELS: { value: 'beginner' | 'intermediate' | 'advanced' | 'professional'; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'professional', label: 'Pro' },
];

export default function SportsSetupScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [selectedSports, setSelectedSports] = useState<Sport[]>([]);
  const [skillLevel, setSkillLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'professional' | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedData, setSavedData] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Load saved profile data from previous step
  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    try {
      const saved = await AsyncStorage.getItem(ONBOARDING_DATA_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        setSavedData(data);
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  };

  const toggleSport = (sport: Sport) => {
    setSelectedSports((prev) =>
      prev.includes(sport)
        ? prev.filter((s) => s !== sport)
        : [...prev, sport]
    );
  };

  const handleFinish = async () => {
    if (selectedSports.length === 0) {
      Alert.alert('Validation', 'Please select at least one sport');
      return;
    }

    if (!skillLevel) {
      Alert.alert('Validation', 'Please select your skill level');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not found');
      return;
    }

    setLoading(true);
    try {
      // Combine all profile data
      const profileData = {
        nickname: savedData?.nickname || '',
        bio: savedData?.bio || '',
        location: savedData?.location || '',
        latitude: savedData?.latitude,
        longitude: savedData?.longitude,
        sports: selectedSports,
        skill_level: skillLevel,
        profile_picture: savedData?.profilePicture || '',
      };

      // Create/update user profile
      await userService.createUserProfile(user.id, profileData);

      // Update auth context
      await updateUser({
        nickname: profileData.nickname,
        bio: profileData.bio,
        location: profileData.location,
        sports: selectedSports,
        skillLevel: skillLevel,
        profilePicture: profileData.profile_picture,
        latitude: profileData.latitude,
        longitude: profileData.longitude,
      });

      // Clear saved data
      await AsyncStorage.removeItem(ONBOARDING_DATA_KEY);

      // Show success modal
      setShowSuccessModal(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to complete setup');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Setup',
      'You can select sports and skill level later. Continue to the app?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          onPress: async () => {
            try {
              if (savedData && user) {
                await userService.createUserProfile(user.id, {
                  nickname: savedData.nickname || '',
                  bio: savedData.bio || '',
                  location: savedData.location || '',
                });
              }
              await AsyncStorage.removeItem(ONBOARDING_DATA_KEY);
              router.replace('/(tabs)/home');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to save profile');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ProgressBar current={3} total={3} />
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <XPlayerLogo size={64} color={theme.colors.primary} />
          </View>

          <Text style={styles.title}>Διάλεξε τα αθλήματα που παίζεις</Text>
          <Text style={styles.subtitle}>
            και το επίπεδό σου για κάθε ένα 🎯
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sports</Text>
            <View style={styles.sportsGrid}>
              {SPORTS.map((sport) => {
                const isSelected = selectedSports.includes(sport.value);
                return (
                  <TouchableOpacity
                    key={sport.value}
                    style={[
                      styles.sportCard,
                      isSelected && styles.sportCardSelected,
                      isSelected && { borderColor: sport.color },
                    ]}
                    onPress={() => toggleSport(sport.value)}
                  >
                    <View
                      style={[
                        styles.sportIconContainer,
                        isSelected && { backgroundColor: sport.color + '20' },
                      ]}
                    >
                      <Ionicons
                        name={sport.icon as any}
                        size={32}
                        color={isSelected ? sport.color : theme.colors.textSecondary}
                      />
                    </View>
                    <Text
                      style={[
                        styles.sportLabel,
                        isSelected && { color: sport.color, fontWeight: '600' },
                      ]}
                    >
                      {sport.label}
                    </Text>
                    {isSelected && (
                      <View style={[styles.checkBadge, { backgroundColor: sport.color }]}>
                        <Ionicons name="checkmark" size={16} color={theme.colors.surface} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skill Level</Text>
            <View style={styles.skillLevelContainer}>
              {SKILL_LEVELS.map((level) => {
                const isSelected = skillLevel === level.value;
                return (
                  <TouchableOpacity
                    key={level.value}
                    style={[
                      styles.skillLevelButton,
                      isSelected && styles.skillLevelButtonSelected,
                    ]}
                    onPress={() => setSkillLevel(level.value)}
                  >
                    <Text
                      style={[
                        styles.skillLevelText,
                        isSelected && styles.skillLevelTextSelected,
                      ]}
                    >
                      {level.label}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={theme.colors.primary}
                        style={styles.checkIcon}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <GradientButton
          title="Finish Setup"
          onPress={handleFinish}
          loading={loading}
          disabled={selectedSports.length === 0 || !skillLevel}
        />
      </View>

      <SuccessModal
        visible={showSuccessModal}
        title="Welcome to XPlayer! 🎉"
        message="Your profile has been created successfully. You're all set to find matches and connect with athletes!"
        onClose={() => setShowSuccessModal(false)}
        onContinue={() => {
          setShowSuccessModal(false);
          router.replace('/(tabs)/home');
        }}
      />
    </View>
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
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  sportCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    alignItems: 'center',
    position: 'relative',
  },
  sportCardSelected: {
    borderWidth: 2,
    backgroundColor: theme.colors.surface,
  },
  sportIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.border + '40',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sportLabel: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '500',
  },
  checkBadge: {
    position: 'absolute',
    top: theme.spacing.xs,
    right: theme.spacing.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skillLevelContainer: {
    gap: theme.spacing.sm,
  },
  skillLevelButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skillLevelButtonSelected: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    backgroundColor: theme.colors.primary + '10',
  },
  skillLevelText: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  skillLevelTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  checkIcon: {
    marginLeft: theme.spacing.sm,
  },
  footer: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
});

