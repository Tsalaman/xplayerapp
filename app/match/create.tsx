import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { haptic } from '../../utils/haptics';
import { createFadeUpAnimation } from '../../utils/animations';
import Card from '../../components/ui/Card';
import GradientButton from '../../components/ui/GradientButton';
import ProgressBar from '../../components/ui/ProgressBar';
import AnimatedContinueButton from '../../components/ui/AnimatedContinueButton';
import SkeletonLoader from '../../components/ui/SkeletonLoader';

const STEPS = [
  { id: 1, title: 'Sport', key: 'sport' },
  { id: 2, title: 'Date & Time', key: 'datetime' },
  { id: 3, title: 'Location', key: 'location' },
  { id: 4, title: 'Court', key: 'court' },
  { id: 5, title: 'Players', key: 'players' },
  { id: 6, title: 'Details', key: 'details' },
];

export default function CreateMatchScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const cardAnim = useRef(new Animated.Value(0)).current;
  
  // Form data
  const [sport, setSport] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [court, setCourt] = useState<string>('');
  const [slots, setSlots] = useState<number>(2);
  const [level, setLevel] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    // Initial fade-up animation
    setInitializing(false);
    createFadeUpAnimation(cardAnim).start();
  }, []);

  useEffect(() => {
    // Animate card on step change
    cardAnim.setValue(0);
    createFadeUpAnimation(cardAnim, 100).start();
    haptic.selection();
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      haptic.medium();
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      haptic.light();
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!sport || !date || !time || !location || !user?.id) {
      haptic.warning();
      alert('Please fill in all required fields');
      return;
    }

    haptic.medium();

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('matches')
        .insert([
          {
            sport,
            date,
            time,
            location,
            court: court || null,
            slots: slots || 2,
            level: level || null,
            description: description || null,
            is_private: isPrivate,
            creator_id: user.id,
            status: 'open',
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (data) {
        // Success! Redirect to match details
        haptic.success();
        router.replace(`/matches/${data.id}/index`);
      }
    } catch (error: any) {
      console.error('Error creating match:', error);
      haptic.error();
      alert(error.message || 'Failed to create match. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Sport
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Select Sport</Text>
            <View style={styles.sportGrid}>
              {['football', 'basketball', 'tennis', 'padel'].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.sportCard,
                    sport === s && styles.sportCardSelected,
                  ]}
                  onPress={() => setSport(s)}
                >
                  <LinearGradient
                    colors={
                      sport === s
                        ? [theme.colors.mint, theme.colors.primary]
                        : [theme.colors.navy, theme.colors.navyDark]
                    }
                    style={styles.sportGradient}
                  >
                    <Ionicons
                      name={
                        s === 'football'
                          ? 'football'
                          : s === 'basketball'
                          ? 'basketball'
                          : s === 'tennis'
                          ? 'tennisball'
                          : 'trophy'
                      }
                      size={32}
                      color={theme.colors.surface}
                    />
                    <Text style={styles.sportText}>{s}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 1: // Date & Time
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Date & Time</Text>
            <TextInput
              style={styles.input}
              placeholder="Date (YYYY-MM-DD)"
              placeholderTextColor={theme.colors.textSecondary}
              value={date}
              onChangeText={setDate}
            />
            <TextInput
              style={styles.input}
              placeholder="Time (HH:MM)"
              placeholderTextColor={theme.colors.textSecondary}
              value={time}
              onChangeText={setTime}
            />
          </View>
        );

      case 2: // Location
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Location</Text>
            <TextInput
              style={styles.input}
              placeholder="Location"
              placeholderTextColor={theme.colors.textSecondary}
              value={location}
              onChangeText={setLocation}
            />
          </View>
        );

      case 3: // Court
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Court</Text>
            <TextInput
              style={styles.input}
              placeholder="Court name (optional)"
              placeholderTextColor={theme.colors.textSecondary}
              value={court}
              onChangeText={setCourt}
            />
          </View>
        );

      case 4: // Players
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Number of Players</Text>
            <TextInput
              style={styles.input}
              placeholder="Slots"
              placeholderTextColor={theme.colors.textSecondary}
              value={slots.toString()}
              onChangeText={(text) => setSlots(parseInt(text) || 2)}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Skill Level (beginner/intermediate/advanced)"
              placeholderTextColor={theme.colors.textSecondary}
              value={level}
              onChangeText={setLevel}
            />
          </View>
        );

      case 5: // Details
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (optional)"
              placeholderTextColor={theme.colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => setIsPrivate(!isPrivate)}
            >
              <Ionicons
                name={isPrivate ? 'checkbox' : 'checkbox-outline'}
                size={24}
                color={theme.colors.mint}
              />
              <Text style={styles.checkboxText}>Private Match</Text>
            </TouchableOpacity>
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
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={theme.colors.surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Match</Text>
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
        {initializing ? (
          <SkeletonLoader variant="card" />
        ) : (
          <Animated.View
            style={{
              opacity: cardAnim,
              transform: [
                {
                  translateY: cardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            }}
          >
            <Card style={styles.card} variant="elevated">
              {renderStepContent()}
            </Card>
          </Animated.View>
        )}
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
            loading={loading}
          />
        ) : (
          <GradientButton
            title="Create Match"
            onPress={handleSubmit}
            style={styles.submitButton}
            loading={loading}
          />
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
    paddingHorizontal: theme.spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: theme.spacing.md,
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.surface,
    fontWeight: '700',
  },
  placeholder: {
    width: 24,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  card: {
    padding: theme.spacing.xl,
  },
  stepContent: {
    gap: theme.spacing.md,
  },
  stepTitle: {
    ...theme.typography.h3,
    color: theme.colors.navy,
    marginBottom: theme.spacing.md,
  },
  sportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  sportCard: {
    width: '48%',
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  sportCardSelected: {
    borderWidth: 2,
    borderColor: theme.colors.mint,
  },
  sportGradient: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    gap: theme.spacing.sm,
    minHeight: 100,
    justifyContent: 'center',
  },
  sportText: {
    ...theme.typography.body,
    color: theme.colors.surface,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  input: {
    ...theme.typography.body,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    color: theme.colors.navy,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  checkboxText: {
    ...theme.typography.body,
    color: theme.colors.navy,
  },
  progressContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.navy,
  },
  stepsDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.navyLight,
    borderWidth: 2,
    borderColor: theme.colors.mint,
    opacity: 0.5,
  },
  dotFilled: {
    backgroundColor: theme.colors.mint,
    opacity: 1,
    borderColor: theme.colors.mint,
  },
  dotCurrent: {
    width: 24,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.mint,
    opacity: 1,
    borderColor: theme.colors.mint,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    backgroundColor: theme.colors.navy,
    borderTopWidth: 1,
    borderTopColor: theme.colors.navyLight,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
  },
  backButtonText: {
    ...theme.typography.body,
    color: theme.colors.mint,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
});

