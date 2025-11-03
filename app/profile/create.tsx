import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../constants/theme';
import { Sport } from '../../types';
import { Ionicons } from '@expo/vector-icons';

const SPORTS: Sport[] = ['football', 'basketball', 'tennis', 'padel'];

export default function CreateProfileScreen() {
  const [nickname, setNickname] = useState('');
  const [selectedSports, setSelectedSports] = useState<Sport[]>([]);
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [skillLevel, setSkillLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'professional' | ''>('');
  const { updateUser, user } = useAuth();
  const router = useRouter();

  const toggleSport = (sport: Sport) => {
    if (selectedSports.includes(sport)) {
      setSelectedSports(selectedSports.filter(s => s !== sport));
    } else {
      setSelectedSports([...selectedSports, sport]);
    }
  };

  const handleSave = async () => {
    if (!nickname.trim()) {
      Alert.alert('Error', 'Please enter a nickname');
      return;
    }

    if (selectedSports.length === 0) {
      Alert.alert('Error', 'Please select at least one sport');
      return;
    }

    try {
      await updateUser({
        nickname,
        sports: selectedSports,
        bio,
        location,
        skillLevel: skillLevel || undefined,
      });
      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to save profile');
    }
  };

  const getSportIcon = (sport: Sport) => {
    const icons: Record<Sport, string> = {
      football: 'football',
      basketball: 'basketball',
      tennis: 'tennisball',
      padel: 'trophy',
    };
    return icons[sport];
  };

  const getSportColor = (sport: Sport) => {
    return theme.sports[sport];
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Create Your Profile</Text>
        <Text style={styles.subtitle}>Tell us about yourself</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.section}>
          <Text style={styles.label}>Nickname *</Text>
          <TextInput
            style={styles.input}
            placeholder="Choose a nickname"
            placeholderTextColor={theme.colors.textSecondary}
            value={nickname}
            onChangeText={setNickname}
            maxLength={30}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Sports You Play *</Text>
          <View style={styles.sportsContainer}>
            {SPORTS.map((sport) => (
              <TouchableOpacity
                key={sport}
                style={[
                  styles.sportCard,
                  selectedSports.includes(sport) && styles.sportCardSelected,
                  { borderColor: getSportColor(sport) },
                  selectedSports.includes(sport) && { backgroundColor: getSportColor(sport) + '20' },
                ]}
                onPress={() => toggleSport(sport)}
              >
                <Ionicons
                  name={getSportIcon(sport) as any}
                  size={32}
                  color={selectedSports.includes(sport) ? getSportColor(sport) : theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.sportText,
                    selectedSports.includes(sport) && { color: getSportColor(sport), fontWeight: '600' },
                  ]}
                >
                  {sport.charAt(0).toUpperCase() + sport.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell us about yourself..."
            placeholderTextColor={theme.colors.textSecondary}
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
            maxLength={200}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            placeholder="City, Country"
            placeholderTextColor={theme.colors.textSecondary}
            value={location}
            onChangeText={setLocation}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Skill Level</Text>
          <View style={styles.skillLevelContainer}>
            {(['beginner', 'intermediate', 'advanced', 'professional'] as const).map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.skillLevelButton,
                  skillLevel === level && styles.skillLevelButtonSelected,
                ]}
                onPress={() => setSkillLevel(level)}
              >
                <Text
                  style={[
                    styles.skillLevelText,
                    skillLevel === level && styles.skillLevelTextSelected,
                  ]}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>Complete Profile</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  form: {
    width: '100%',
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    ...theme.typography.body,
    color: theme.colors.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  sportsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  sportCard: {
    width: '47%',
    aspectRatio: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sportCardSelected: {
    borderWidth: 3,
  },
  sportText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  skillLevelContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  skillLevelButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  skillLevelButtonSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  skillLevelText: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  skillLevelTextSelected: {
    color: theme.colors.surface,
    fontWeight: '600',
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  buttonText: {
    ...theme.typography.h3,
    color: theme.colors.surface,
  },
});

