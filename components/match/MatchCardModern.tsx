import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import GradientButton from '../ui/GradientButton';

interface MatchCardModernProps {
  id: string;
  sport: string;
  date: string;
  time: string;
  location: string;
  slots: number;
  currentPlayers: number;
  level?: string;
  distance?: number;
  skillMatch?: number;
  onPress?: () => void;
}

export default function MatchCardModern({
  id,
  sport,
  date,
  time,
  location,
  slots,
  currentPlayers,
  level,
  distance,
  skillMatch,
  onPress,
}: MatchCardModernProps) {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const getSportIcon = (sport: string) => {
    const icons: Record<string, string> = {
      football: 'football',
      basketball: 'basketball',
      tennis: 'tennisball',
      padel: 'trophy',
    };
    return icons[sport] || 'ellipse';
  };

  const getSportColor = (sport: string) => {
    return theme.sports[sport as keyof typeof theme.sports] || theme.colors.mint;
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/matches/${id}/index`);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <LinearGradient
          colors={[theme.colors.navy, theme.colors.navyDark]}
          style={styles.card}
        >
          {/* Sport Icon with Mint Glass Circle */}
          <View style={styles.sportIconContainer}>
            <View style={[styles.glassCircle, { backgroundColor: theme.colors.mint + '20' }]}>
              <Ionicons
                name={getSportIcon(sport) as any}
                size={32}
                color={theme.colors.mint}
              />
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.sportText}>{sport.toUpperCase()}</Text>
              {level && (
                <View style={styles.levelBadge}>
                  <Text style={styles.levelText}>{level}</Text>
                </View>
              )}
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={16} color={theme.colors.mint} />
              <Text style={styles.infoText}>{date} • {time}</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color={theme.colors.mint} />
              <Text style={styles.infoText} numberOfLines={1}>{location}</Text>
              {distance && (
                <Text style={styles.distanceText}> • {distance}km</Text>
              )}
            </View>

            <View style={styles.playersRow}>
              <Ionicons name="people-outline" size={16} color={theme.colors.mint} />
              <Text style={styles.playersText}>
                {currentPlayers} / {slots} players
              </Text>
            </View>

            {skillMatch !== undefined && (
              <View style={styles.matchRow}>
                <Ionicons name="star" size={16} color={theme.colors.mint} />
                <Text style={styles.matchText}>
                  {skillMatch}% skill match
                </Text>
              </View>
            )}
          </View>

          {/* Join Button */}
          <View style={styles.buttonContainer}>
            <GradientButton
              title="Join Game →"
              onPress={handlePress}
              style={styles.joinButton}
            />
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    shadowColor: theme.colors.mint,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  sportIconContainer: {
    position: 'absolute',
    top: theme.spacing.lg,
    right: theme.spacing.lg,
  },
  glassCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.mint + '40',
    backdropFilter: 'blur(10px)',
  },
  content: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  sportText: {
    ...theme.typography.h4,
    color: theme.colors.mint,
    fontWeight: '700',
  },
  levelBadge: {
    backgroundColor: theme.colors.mint + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.mint,
  },
  levelText: {
    ...theme.typography.caption,
    color: theme.colors.mint,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    ...theme.typography.body,
    color: theme.colors.surface,
    flex: 1,
  },
  distanceText: {
    ...theme.typography.caption,
    color: theme.colors.mint,
    fontWeight: '600',
  },
  playersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  playersText: {
    ...theme.typography.body,
    color: theme.colors.surface,
    fontWeight: '600',
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  matchText: {
    ...theme.typography.body,
    color: theme.colors.mint,
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: theme.spacing.md,
  },
  joinButton: {
    width: '100%',
  },
});

