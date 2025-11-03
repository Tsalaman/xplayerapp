import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import XPlayerLogo from '../../components/XPlayerLogo';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { t } from '../../utils/i18n';

const steps = [
  {
    title: 'Welcome to XPlayer',
    description: 'Connect with athletes and find your next match',
    icon: 'people',
  },
  {
    title: 'Create Your Profile',
    description: 'Add your sports, skill level, and preferences',
    icon: 'person',
  },
  {
    title: 'Find Matches',
    description: 'Discover players looking for teammates or opponents',
    icon: 'search',
  },
  {
    title: 'Join Teams',
    description: 'Create or join teams to play together',
    icon: 'people',
  },
  {
    title: 'Track Your Progress',
    description: 'See your stats, achievements, and level up',
    icon: 'trophy',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.push('/(auth)/login');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    router.push('/(auth)/login');
  };

  const current = steps[currentStep];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.logoContainer}>
          <XPlayerLogo size={80} color={theme.colors.primary} />
        </View>

        <Card style={styles.stepCard}>
          <View style={styles.iconContainer}>
            <Ionicons name={current.icon as any} size={64} color={theme.colors.primary} />
          </View>
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.description}>{current.description}</Text>
        </Card>

        <View style={styles.progress}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                currentStep === index && styles.progressDotActive,
                currentStep > index && styles.progressDotCompleted,
              ]}
            />
          ))}
        </View>

        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>
            {currentStep + 1} / {steps.length}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {currentStep > 0 && (
          <Button
            title={t('common.back')}
            onPress={handlePrevious}
            variant="outline"
            style={styles.backButton}
          />
        )}
        <Button
          title={currentStep === steps.length - 1 ? t('buttons.signup') : t('common.next')}
          onPress={handleNext}
          variant="primary"
          style={styles.nextButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'flex-end',
    marginBottom: theme.spacing.lg,
  },
  skipButton: {
    padding: theme.spacing.sm,
  },
  skipText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  stepCard: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  progressDotActive: {
    backgroundColor: theme.colors.primary,
    width: 24,
  },
  progressDotCompleted: {
    backgroundColor: theme.colors.success,
  },
  stepIndicator: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  stepText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
});

