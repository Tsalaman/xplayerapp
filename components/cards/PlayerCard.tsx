import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { t } from '../../utils/i18n';

interface PlayerCardProps {
  id: string;
  name: string;
  sport: string;
  skillLevel?: string;
  location?: string;
  bio?: string;
  distance?: string;
  rating?: number;
  onPress?: () => void;
  onFollow?: () => void;
  isFollowing?: boolean;
  style?: ViewStyle;
}

export default function PlayerCard({
  id,
  name,
  sport,
  skillLevel,
  location,
  bio,
  distance,
  rating,
  onPress,
  onFollow,
  isFollowing = false,
  style,
}: PlayerCardProps) {
  const router = useRouter();

  const getSportColor = (sport: string) => {
    return theme.sports[sport as keyof typeof theme.sports] || theme.colors.primary;
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/profile?id=${id}`);
    }
  };

  const handleFollow = () => {
    if (onFollow) {
      onFollow();
    }
  };

  return (
    <Card style={[styles.card, style]}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <View style={styles.header}>
          <Avatar name={name} size="lg" />
          <View style={styles.info}>
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
            {rating && (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color={theme.colors.accent} />
                <Text style={styles.rating}>{rating.toFixed(1)}</Text>
              </View>
            )}
          </View>
        </View>

        {bio && (
          <Text style={styles.bio} numberOfLines={2}>
            {bio}
          </Text>
        )}

        <View style={styles.footer}>
          {location && (
            <View style={styles.locationRow}>
              <Ionicons
                name="location"
                size={14}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.location}>{location}</Text>
            </View>
          )}
          {distance && (
            <Text style={styles.distance}>{distance} away</Text>
          )}
        </View>
      </TouchableOpacity>

      <Button
        title={isFollowing ? t('buttons.unfollow') : t('buttons.follow')}
        onPress={handleFollow}
        variant={isFollowing ? 'outline' : 'primary'}
        size="sm"
        style={styles.followButton}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  info: {
    flex: 1,
  },
  name: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs / 2,
  },
  sportBadge: {
    marginBottom: theme.spacing.xs / 2,
    marginTop: theme.spacing.xs,
  },
  skillLevel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs / 2,
    textTransform: 'capitalize',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs / 2,
  },
  rating: {
    ...theme.typography.caption,
    color: theme.colors.text,
    fontWeight: '600',
  },
  bio: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
    flexWrap: 'wrap',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  location: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  distance: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  followButton: {
    marginTop: theme.spacing.sm,
  },
});

