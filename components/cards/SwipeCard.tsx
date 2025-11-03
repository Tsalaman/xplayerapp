import React, { useRef } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder, ViewStyle } from 'react-native';
import { Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';
import { t } from '../../utils/i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SwipeCardProps {
  id: string;
  name: string;
  sport: string;
  skillLevel?: string;
  location?: string;
  bio?: string;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  style?: ViewStyle;
}

export default function SwipeCard({
  id,
  name,
  sport,
  skillLevel,
  location,
  bio,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  style,
}: SwipeCardProps) {
  const pan = useRef(new Animated.ValueXY()).current;

  const getSportColor = (sport: string) => {
    return theme.sports[sport as keyof typeof theme.sports] || theme.colors.primary;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        pan.setValue({ x: gestureState.dx, y: gestureState.dy });
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx, vx } = gestureState;
        const SWIPE_THRESHOLD = 120;
        const VELOCITY_THRESHOLD = 0.5;

        if (Math.abs(dx) > SWIPE_THRESHOLD || Math.abs(vx) > VELOCITY_THRESHOLD) {
          if (dx > 0 || vx > 0) {
            // Swipe right (like)
            if (onSwipeRight) {
              Animated.timing(pan, {
                toValue: { x: SCREEN_WIDTH, y: 0 },
                duration: 300,
                useNativeDriver: false,
              }).start(() => {
                onSwipeRight();
                pan.setValue({ x: 0, y: 0 });
              });
            }
          } else {
            // Swipe left (pass)
            if (onSwipeLeft) {
              Animated.timing(pan, {
                toValue: { x: -SCREEN_WIDTH, y: 0 },
                duration: 300,
                useNativeDriver: false,
              }).start(() => {
                onSwipeLeft();
                pan.setValue({ x: 0, y: 0 });
              });
            }
          }
        } else {
          // Return to center
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const rotateZ = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-15deg', '0deg', '15deg'],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { rotateZ },
          ],
        },
        style,
      ]}
      {...panResponder.panHandlers}
    >
      <Card style={styles.card}>
        <Avatar name={name} size="xl" style={styles.avatar} />
        <Text style={styles.name}>{name}</Text>
        <Badge
          label={t(`sports.${sport}`)}
          variant="primary"
          style={[styles.sportBadge, { backgroundColor: getSportColor(sport) }]}
        />
        {skillLevel && (
          <Text style={styles.skillLevel}>
            {t(`profile.${skillLevel}`)}
          </Text>
        )}
        {location && (
          <View style={styles.locationRow}>
            <Ionicons
              name="location"
              size={16}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.location}>{location}</Text>
          </View>
        )}
        {bio && (
          <Text style={styles.bio} numberOfLines={3}>
            {bio}
          </Text>
        )}
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '90%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  card: {
    width: '100%',
    alignItems: 'center',
    padding: theme.spacing.xl,
    minHeight: 500,
  },
  avatar: {
    marginBottom: theme.spacing.lg,
  },
  name: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  sportBadge: {
    marginBottom: theme.spacing.md,
  },
  skillLevel: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    textTransform: 'capitalize',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  location: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  bio: {
    ...theme.typography.body,
    color: theme.colors.text,
    textAlign: 'center',
    lineHeight: 24,
  },
});

