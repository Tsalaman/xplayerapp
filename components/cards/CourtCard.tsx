import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { t } from '../../utils/i18n';

interface CourtCardProps {
  id: string;
  name: string;
  sport: string;
  location: string;
  distance?: string;
  price?: string;
  rating?: number;
  facilities?: string[];
  onPress?: () => void;
  onBook?: () => void;
  style?: ViewStyle;
}

export default function CourtCard({
  id,
  name,
  sport,
  location,
  distance,
  price,
  rating,
  facilities,
  onPress,
  onBook,
  style,
}: CourtCardProps) {
  const router = useRouter();

  const getSportColor = (sport: string) => {
    return theme.sports[sport as keyof typeof theme.sports] || theme.colors.primary;
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/venues?id=${id}`);
    }
  };

  const handleBook = () => {
    if (onBook) {
      onBook();
    }
  };

  return (
    <Card style={[styles.card, style]}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="location" size={32} color={theme.colors.primary} />
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{name}</Text>
            <Badge
              label={t(`sports.${sport}`)}
              variant="primary"
              style={[styles.sportBadge, { backgroundColor: getSportColor(sport) }]}
            />
            <View style={styles.locationRow}>
              <Ionicons
                name="location"
                size={16}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.location}>{location}</Text>
            </View>
            {distance && (
              <Text style={styles.distance}>{distance} away</Text>
            )}
            {rating && (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color={theme.colors.accent} />
                <Text style={styles.rating}>{rating.toFixed(1)}</Text>
              </View>
            )}
            {facilities && facilities.length > 0 && (
              <View style={styles.facilities}>
                {facilities.slice(0, 3).map((facility, index) => (
                  <Badge
                    key={index}
                    label={facility}
                    variant="default"
                    size="sm"
                    style={styles.facilityBadge}
                  />
                ))}
              </View>
            )}
            {price && (
              <Text style={styles.price}>{price}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>

      <Button
        title="Book"
        onPress={handleBook}
        variant="primary"
        size="sm"
        style={styles.bookButton}
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
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs / 2,
  },
  location: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  distance: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs / 2,
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
  facilities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  facilityBadge: {
    marginBottom: 0,
  },
  price: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: '600',
    marginTop: theme.spacing.sm,
  },
  bookButton: {
    marginTop: theme.spacing.sm,
  },
});

