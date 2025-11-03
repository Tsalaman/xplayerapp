import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import XPlayerLogo from '../../components/XPlayerLogo';
import Button from '../../components/ui/Button';
import { t } from '../../utils/i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const features = [
  {
    icon: 'people',
    title: t('app.tagline'),
    description: t('match.lookingForTeammates'),
  },
  {
    icon: 'trophy',
    title: 'Tournaments',
    description: 'Join or create tournaments',
  },
  {
    icon: 'chatbubbles',
    title: 'Connect',
    description: 'Chat with players and teams',
  },
  {
    icon: 'location',
    title: 'Find Courts',
    description: 'Discover nearby venues',
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentPage(page);
  };

  const handleSkip = () => {
    router.push('/(auth)/login');
  };

  const handleGetStarted = () => {
    router.push('/(auth)/login');
  };

  const handleNext = () => {
    if (currentPage < features.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (currentPage + 1) * SCREEN_WIDTH,
        animated: true,
      });
    } else {
      handleGetStarted();
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {features.map((feature, index) => (
          <View key={index} style={[styles.page, { width: SCREEN_WIDTH }]}>
            <View style={styles.content}>
              <XPlayerLogo size={120} color={theme.colors.primary} />
              <View style={styles.iconContainer}>
                <Ionicons name={feature.icon as any} size={64} color={theme.colors.primary} />
              </View>
              <Text style={styles.title}>{feature.title}</Text>
              <Text style={styles.description}>{feature.description}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {features.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentPage === index && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <View style={styles.actions}>
          {currentPage > 0 && (
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          )}
          <Button
            title={currentPage === features.length - 1 ? t('buttons.signup') : t('common.next')}
            onPress={handleNext}
            variant="primary"
            style={styles.nextButton}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  page: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  iconContainer: {
    marginVertical: theme.spacing.xl,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
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
  footer: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  dotActive: {
    backgroundColor: theme.colors.primary,
    width: 24,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  skipButton: {
    padding: theme.spacing.md,
  },
  skipText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  nextButton: {
    flex: 1,
  },
});

