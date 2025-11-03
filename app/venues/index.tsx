import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { Venue, Sport } from '../../types';
import { useNearbyVenues } from '../../hooks/useNearbyVenues';
import { Ionicons } from '@expo/vector-icons';

const SPORTS: Sport[] = ['football', 'basketball', 'tennis', 'padel'];
const RADIUS_OPTIONS = [5, 10, 25, 50]; // in km

export default function VenuesScreen() {
  const [selectedSport, setSelectedSport] = useState<Sport | undefined>();
  const [radius, setRadius] = useState(10);
  const router = useRouter();

  const { nearbyVenues, loading, error, searchNearby, loadMore, hasMore, location } = useNearbyVenues({
    radiusKm: radius,
    sport: selectedSport,
    autoRefresh: false, // Manual refresh only
    limit: 20,
  });

  useEffect(() => {
    // Refresh when sport filter changes
    if (location.latitude && location.longitude) {
      searchNearby();
    }
  }, [selectedSport, radius]);

  const formatDistance = (km?: number) => {
    if (!km) return '';
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)}km`;
  };

  const getSportColor = (sport: Sport) => {
    return theme.sports[sport] || theme.colors.primary;
  };

  const formatRating = (rating: number, count: number) => {
    if (count === 0) return 'No ratings';
    return `${rating.toFixed(1)} (${count} ${count === 1 ? 'review' : 'reviews'})`;
  };

  const renderVenue = ({ item }: { item: Venue }) => (
    <TouchableOpacity
      style={styles.venueCard}
      onPress={() => router.push(`/venues/details?id=${item.id}`)}
    >
      <View style={styles.venueHeader}>
        <View style={[styles.sportBadge, { backgroundColor: getSportColor(item.sport) }]}>
          <Text style={styles.sportBadgeText}>
            {item.sport.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.venueInfo}>
          <Text style={styles.venueName}>{item.name}</Text>
          <Text style={styles.venueAddress}>{item.address}</Text>
        </View>
        <View style={[styles.publicBadge, !item.isPublic && styles.privateBadge]}>
          <Ionicons
            name={item.isPublic ? 'globe' : 'lock-closed'}
            size={14}
            color={theme.colors.surface}
          />
        </View>
      </View>

      {/* Distance Display */}
      {item.distanceKm !== undefined && (
        <View style={styles.distanceContainer}>
          <Ionicons name="location" size={14} color={theme.colors.primary} />
          <Text style={styles.distanceText}>{formatDistance(item.distanceKm)}</Text>
        </View>
      )}

      {item.description && (
        <Text style={styles.venueDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.venueFooter}>
        {item.rating > 0 && (
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color={theme.colors.accent} />
            <Text style={styles.ratingText}>
              {formatRating(item.rating, item.ratingCount)}
            </Text>
          </View>
        )}
        {item.pricePerHour && (
          <View style={styles.priceContainer}>
            <Ionicons name="cash" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.priceText}>${item.pricePerHour}/hour</Text>
          </View>
        )}
        {item.allowsBooking && (
          <View style={styles.bookingBadge}>
            <Ionicons name="calendar" size={16} color={theme.colors.primary} />
            <Text style={styles.bookingText}>Bookable</Text>
          </View>
        )}
      </View>

      {item.amenities && item.amenities.length > 0 && (
        <View style={styles.amenitiesContainer}>
          {item.amenities.slice(0, 3).map((amenity, index) => (
            <View key={index} style={styles.amenityBadge}>
              <Text style={styles.amenityText}>{amenity}</Text>
            </View>
          ))}
          {item.amenities.length > 3 && (
            <Text style={styles.moreAmenities}>+{item.amenities.length - 3} more</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Venues</Text>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {/* Radius Filter */}
          <View style={styles.radiusSection}>
            <Text style={styles.filterLabel}>Radius:</Text>
            <View style={styles.radiusButtons}>
              {RADIUS_OPTIONS.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.radiusButton, radius === r && styles.radiusButtonActive]}
                  onPress={() => setRadius(r)}
                >
                  <Text
                    style={[
                      styles.radiusButtonText,
                      radius === r && styles.radiusButtonTextActive,
                    ]}
                  >
                    {r} km
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sport Filter */}
          <View style={styles.sportSection}>
            <Text style={styles.filterLabel}>Sport:</Text>
            <TouchableOpacity
              style={[styles.filterChip, !selectedSport && styles.filterChipActive]}
              onPress={() => setSelectedSport(undefined)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  !selectedSport && styles.filterChipTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {SPORTS.map((sport) => (
              <TouchableOpacity
                key={sport}
                style={[
                  styles.filterChip,
                  selectedSport === sport && styles.filterChipActive,
                  selectedSport === sport && { backgroundColor: getSportColor(sport) },
                ]}
                onPress={() => setSelectedSport(sport === selectedSport ? undefined : sport)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedSport === sport && styles.filterChipTextActive,
                  ]}
                >
                  {sport.charAt(0).toUpperCase() + sport.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          {!location.latitude && (
            <Text style={styles.errorSubtext}>
              Please enable location services to find nearby venues.
            </Text>
          )}
        </View>
      )}

      {/* Empty State for No Location */}
      {!location.latitude || !location.longitude ? (
        <View style={styles.emptyState}>
          <Ionicons name="location-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={styles.emptyText}>Location not available</Text>
          <Text style={styles.emptySubtext}>
            Please enable location services and update your location in Profile.
          </Text>
        </View>
      ) : (
        <>
          {loading && nearbyVenues.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <FlatList
              data={nearbyVenues}
              renderItem={renderVenue}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={loading && nearbyVenues.length > 0} onRefresh={searchNearby} />
              }
              onEndReached={() => {
                if (hasMore && !loading) {
                  loadMore();
                }
              }}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                loading && hasMore ? (
                  <View style={styles.footerLoader}>
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  </View>
                ) : null
              }
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="location-outline" size={64} color={theme.colors.textSecondary} />
                  <Text style={styles.emptyText}>No venues found</Text>
                  <Text style={styles.emptySubtext}>
                    Try increasing the radius or changing the sport filter.
                  </Text>
                </View>
              }
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    marginRight: theme.spacing.md,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.primary,
  },
  filtersContainer: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  radiusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  sportSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  filterLabel: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
    marginRight: theme.spacing.sm,
  },
  radiusButtons: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  radiusButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  radiusButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  radiusButtonText: {
    ...theme.typography.caption,
    color: theme.colors.text,
    fontWeight: '600',
  },
  radiusButtonTextActive: {
    color: theme.colors.surface,
  },
  filterChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background,
    marginHorizontal: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: theme.colors.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: theme.spacing.lg,
  },
  venueCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  venueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sportBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  sportBadgeText: {
    ...theme.typography.h2,
    color: theme.colors.surface,
    fontWeight: 'bold',
  },
  venueInfo: {
    flex: 1,
  },
  venueName: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  venueAddress: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  distanceText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  publicBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  privateBadge: {
    backgroundColor: theme.colors.textSecondary,
  },
  venueDescription: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  venueFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  ratingText: {
    ...theme.typography.caption,
    color: theme.colors.text,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  priceText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  bookingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.xs,
  },
  bookingText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    alignItems: 'center',
  },
  amenityBadge: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  amenityText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  moreAmenities: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    padding: theme.spacing.xxl,
    marginTop: theme.spacing.xxl,
  },
  emptyText: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptySubtext: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.error + '20',
    padding: theme.spacing.md,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.error,
    flex: 1,
  },
  errorSubtext: {
    ...theme.typography.caption,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
  footerLoader: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
});

