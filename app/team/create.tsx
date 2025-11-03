import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../constants/theme';
import { Sport } from '../../types';
import { teamService } from '../../services/teams';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/ui/Card';
import GradientButton from '../../components/ui/GradientButton';
import ProgressBar from '../../components/ui/ProgressBar';
import Button from '../../components/ui/Button';
import haptic from '../../utils/haptic';

const SPORTS: Sport[] = ['football', 'basketball', 'tennis', 'padel'];

const STEPS = [
  { id: 1, title: 'Basic Info', key: 'basic' },
  { id: 2, title: 'Details', key: 'details' },
  { id: 3, title: 'Review', key: 'review' },
];

export default function CreateTeamScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [name, setName] = useState('');
  const [selectedSport, setSelectedSport] = useState<Sport | ''>('');
  const [maxPlayers, setMaxPlayers] = useState('11');
  const [isPublic, setIsPublic] = useState(false);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const getSportColor = (sport: Sport) => {
    return theme.sports[sport] || theme.colors.mint;
  };

  const handleNext = () => {
    haptic.light();
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    haptic.light();
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a team name');
      return;
    }
    if (!selectedSport) {
      Alert.alert('Error', 'Please select a sport');
      return;
    }
    const maxPlayersNum = parseInt(maxPlayers);
    if (!maxPlayersNum || maxPlayersNum < 2) {
      Alert.alert('Error', 'Please enter a valid number of players (min 2)');
      return;
    }
    if (!user) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    haptic.medium();
    setLoading(true);
    try {
      const newTeam = await teamService.createTeam(
        {
          name: name.trim(),
          sport: selectedSport as Sport,
          maxPlayers: maxPlayersNum,
          isPublic,
          description: description.trim() || undefined,
          location: location.trim() || undefined,
        },
        user.id,
        user.nickname || 'Anonymous'
      );

      haptic.medium();
      router.replace(`/team/manage?id=${newTeam.id}`);
    } catch (error: any) {
      console.error('Error creating team:', error);
      Alert.alert('Error', error.message || 'Failed to create team');
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Team Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Champions FC"
              placeholderTextColor={theme.colors.textSecondary}
              value={name}
              onChangeText={setName}
              maxLength={50}
            />

            <Text style={styles.stepTitle}>Sport *</Text>
            <View style={styles.sportsContainer}>
              {SPORTS.map((sport) => (
                <TouchableOpacity
                  key={sport}
                  onPress={() => {
                    haptic.light();
                    setSelectedSport(sport);
                  }}
                  style={[
                    styles.sportButton,
                    selectedSport === sport && { backgroundColor: getSportColor(sport) },
                    selectedSport === sport && styles.sportButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.sportText,
                      selectedSport === sport && { color: theme.colors.surface },
                    ]}
                  >
                    {sport.charAt(0).toUpperCase() + sport.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.stepTitle}>Max Players *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 11"
              placeholderTextColor={theme.colors.textSecondary}
              value={maxPlayers}
              onChangeText={setMaxPlayers}
              keyboardType="numeric"
            />
          </View>
        );

      case 1: // Details
        return (
          <View style={styles.stepContent}>
            <View style={styles.switchContainer}>
              <View style={styles.switchLabelContainer}>
                <Ionicons 
                  name={isPublic ? "globe" : "lock-closed"} 
                  size={20} 
                  color={theme.colors.mint} 
                />
                <Text style={styles.switchLabel}>
                  {isPublic ? 'Public Team' : 'Private Team'}
                </Text>
              </View>
              <Switch
                value={isPublic}
                onValueChange={(value) => {
                  haptic.light();
                  setIsPublic(value);
                }}
                trackColor={{ false: theme.colors.border, true: theme.colors.mint }}
                thumbColor={theme.colors.surface}
              />
            </View>
            <Text style={styles.switchDescription}>
              {isPublic
                ? 'Anyone can find and join this team'
                : 'Only users with invite code can join'}
            </Text>

            <Text style={styles.stepTitle}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell us about your team..."
              placeholderTextColor={theme.colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
            />

            <Text style={styles.stepTitle}>Location</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Athens, Greece"
              placeholderTextColor={theme.colors.textSecondary}
              value={location}
              onChangeText={setLocation}
              maxLength={100}
            />
          </View>
        );

      case 2: // Review Step
        return (
          <View style={styles.stepContent}>
            <Text style={styles.reviewTitle}>Review Your Team</Text>
            
            <View style={styles.reviewSection}>
              <Text style={styles.reviewLabel}>Team Name</Text>
              <Text style={styles.reviewValue}>{name || '—'}</Text>
            </View>

            <View style={styles.reviewSection}>
              <Text style={styles.reviewLabel}>Sport</Text>
              <Text style={styles.reviewValue}>
                {selectedSport ? selectedSport.charAt(0).toUpperCase() + selectedSport.slice(1) : '—'}
              </Text>
            </View>

            <View style={styles.reviewSection}>
              <Text style={styles.reviewLabel}>Max Players</Text>
              <Text style={styles.reviewValue}>{maxPlayers || '—'}</Text>
            </View>

            <View style={styles.reviewSection}>
              <Text style={styles.reviewLabel}>Privacy</Text>
              <View style={styles.reviewBadge}>
                <Ionicons 
                  name={isPublic ? "globe" : "lock-closed"} 
                  size={16} 
                  color={theme.colors.mint} 
                />
                <Text style={styles.reviewBadgeText}>
                  {isPublic ? 'Public' : 'Private'}
                </Text>
              </View>
            </View>

            {description && (
              <View style={styles.reviewSection}>
                <Text style={styles.reviewLabel}>Description</Text>
                <Text style={styles.reviewValue}>{description}</Text>
              </View>
            )}

            {location && (
              <View style={styles.reviewSection}>
                <Text style={styles.reviewLabel}>Location</Text>
                <Text style={styles.reviewValue}>{location}</Text>
              </View>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <LinearGradient
      colors={[theme.colors.navy, theme.colors.navyDark]}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={24} color={theme.colors.surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Team</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.progressContainer}>
        <ProgressBar current={currentStep + 1} total={STEPS.length} />
        <View style={styles.stepsDots}>
          {STEPS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index < currentStep && styles.dotFilled,
                index === currentStep && styles.dotCurrent,
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView style={styles.content}>
        <Card style={styles.card} variant="elevated">
          {renderStepContent()}
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        {currentStep > 0 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handlePrevious}
          >
            <Ionicons name="arrow-back" size={20} color={theme.colors.mint} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        
        {currentStep < STEPS.length - 1 ? (
          <GradientButton
            title="Continue →"
            onPress={handleNext}
            style={styles.nextButton}
            disabled={!name.trim() || !selectedSport}
          />
        ) : (
          <View style={styles.submitContainer}>
            <ProgressBar 
              current={loading ? 100 : 0} 
              total={100} 
              style={styles.mintProgressBar}
            />
            <Button
              title="Create Team"
              onPress={handleSubmit}
              variant="primary"
              size="lg"
              loading={loading}
              withGradient={true}
              withShadowGlow={true}
              style={styles.submitButton}
            />
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    paddingTop: Platform.OS === 'ios' ? theme.spacing.xl * 2 : theme.spacing.lg,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.surface,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  stepsDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.surface + '40',
  },
  dotFilled: {
    backgroundColor: theme.colors.mint,
  },
  dotCurrent: {
    backgroundColor: theme.colors.mint,
    width: 24,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  card: {
    padding: theme.spacing.lg,
  },
  stepContent: {
    gap: theme.spacing.lg,
  },
  stepTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
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
    gap: theme.spacing.sm,
  },
  sportButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  sportButtonSelected: {
    borderWidth: 3,
    borderColor: theme.colors.mint,
  },
  sportText: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  switchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  switchLabel: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
  },
  switchDescription: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  reviewTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    fontWeight: '700',
  },
  reviewSection: {
    marginBottom: theme.spacing.lg,
  },
  reviewLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  reviewValue: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
  },
  reviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.mint + '20',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignSelf: 'flex-start',
  },
  reviewBadgeText: {
    ...theme.typography.body,
    color: theme.colors.mint,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? theme.spacing.xl * 2 : theme.spacing.lg,
    gap: theme.spacing.md,
  },
  nextButton: {
    flex: 1,
  },
  submitContainer: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  mintProgressBar: {
    marginBottom: theme.spacing.xs,
  },
  submitButton: {
    flex: 1,
  },
  backButtonText: {
    ...theme.typography.body,
    color: theme.colors.mint,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },
});
