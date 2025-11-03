import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../constants/theme';
import { useMatchmaking, NearbyUser } from '../../hooks/useMatchmaking';
import { Sport } from '../../types';
import { followService } from '../../services/follows';
import { Ionicons } from '@expo/vector-icons';

const SPORTS: Sport[] = ['football', 'basketball', 'tennis', 'padel'];
const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced', 'professional'] as const;

export default function NearbyScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedSport, setSelectedSport] = useState<Sport | undefined>();
  const [selectedSkill, setSelectedSkill] = useState<typeof SKILL_LEVELS[number] | undefined>();
  const [radius, setRadius] = useState(10);
  const [followingStates, setFollowingStates] = useState<{ [userId: string]: boolean }>({});

  const { nearbyUsers, loading, error, searchNearby, loadMore, hasMore, location } = useMatchmaking({
    radiusKm: radius,
    sport: selectedSport,
    skillLevel: selectedSkill,
    autoRefresh: false, // Manual refresh only
    limit: 20,
  });

  // Update following states from nearbyUsers when data changes
  useEffect(() => {
    if (nearbyUsers.length > 0) {
      const states: { [userId: string]: boolean } = {};
      nearbyUsers.forEach((u) => {
        if (u.isFollowing !== undefined) {
          states[u.id] = u.isFollowing;
        }
      });
      setFollowingStates((prev) => ({ ...prev, ...states }));
    }
  }, [nearbyUsers]);

  const getIsFollowing = (userId: string): boolean => {
    return followingStates[userId] ?? nearbyUsers.find((u) => u.id === userId)?.isFollowing ?? false;
  };

  const handleFollow = useCallback(async (userId: string, userNickname: string) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to follow users');
      return;
    }

    const isCurrentlyFollowing = getIsFollowing(userId);
    
    try {
      if (isCurrentlyFollowing) {
        // Unfollow
        await followService.unfollowUser(userId);
        setFollowingStates((prev) => ({ ...prev, [userId]: false }));
      } else {
        // Follow
        await followService.followUser(userId);
        setFollowingStates((prev) => ({ ...prev, [userId]: true }));
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update follow status');
    }
  }, [user, followingStates, nearbyUsers]);

  const formatDistance = (km: number) => {
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)}km`;
  };

  const getSportColor = (sport: Sport) => {
    return theme.sports[sport] || theme.colors.primary;
  };

  if (!location.latitude || !location.longitude) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Nearby Players</Text>
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="location-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={styles.emptyText}>Location not available</Text>
          <Text style={styles.emptySubtext}>
            Please enable location services and update your location in Profile.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Nearby Players</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading && !hasMore} onRefresh={searchNearby} />
        }
        onScrollEndDrag={(e) => {
          // Trigger loadMore when scrolled near bottom
          const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
          const paddingToBottom = 400;
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
            if (hasMore && !loading) {
              loadMore();
            }
          }
        }}
        scrollEventThrottle={400}
      >
        {/* Filters */}
        <View style={styles.filtersSection}>
          <Text style={styles.sectionTitle}>Filters</Text>
          
          {/* Radius */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Radius: {radius}km</Text>
            <View style={styles.radiusButtons}>
              {[5, 10, 20, 50].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.radiusButton,
                    radius === r && styles.radiusButtonActive,
                  ]}
                  onPress={() => setRadius(r)}
                >
                  <Text
                    style={[
                      styles.radiusButtonText,
                      radius === r && styles.radiusButtonTextActive,
                    ]}
                  >
                    {r}km
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sport Filter */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Sport</Text>
            <View style={styles.sportFilters}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  !selectedSport && styles.filterChipActive,
                ]}
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
                    selectedSport === sport && {
                      backgroundColor: getSportColor(sport),
                    },
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
          </View>

          {/* Skill Filter */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Skill Level</Text>
            <View style={styles.skillFilters}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  !selectedSkill && styles.filterChipActive,
                ]}
                onPress={() => setSelectedSkill(undefined)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    !selectedSkill && styles.filterChipTextActive,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              {SKILL_LEVELS.map((skill) => (
                <TouchableOpacity
                  key={skill}
                  style={[
                    styles.filterChip,
                    selectedSkill === skill && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedSkill(skill === selectedSkill ? undefined : skill)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedSkill === skill && styles.filterChipTextActive,
                    ]}
                  >
                    {skill.charAt(0).toUpperCase() + skill.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Results */}
        <View style={styles.resultsSection}>
          <View style={styles.resultsHeader}>
            <Text style={styles.sectionTitle}>
              {nearbyUsers.length} player{nearbyUsers.length !== 1 ? 's' : ''} nearby
            </Text>
            {loading && <ActivityIndicator size="small" color={theme.colors.primary} />}
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={24} color={theme.colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {!loading && nearbyUsers.length === 0 && !error && (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color={theme.colors.textSecondary} />
              <Text style={styles.emptyText}>No players found</Text>
              <Text style={styles.emptySubtext}>
                Try increasing the radius or changing filters.
              </Text>
            </View>
          )}

          {nearbyUsers.map((user) => (
            <TouchableOpacity
              key={user.id}
              style={styles.userCard}
              onPress={() => {
                // Navigate to user profile or contact
              }}
            >
              <View style={styles.userCardHeader}>
                <View style={styles.userInfo}>
                  <Text style={styles.userNickname}>{user.nickname}</Text>
                  <View style={styles.userMeta}>
                    <Ionicons name="location" size={14} color={theme.colors.textSecondary} />
                    <Text style={styles.userDistance}>{formatDistance(user.distanceKm)}</Text>
                    {user.skillLevel && (
                      <>
                        <Text style={styles.userMetaSeparator}>•</Text>
                        <Text style={styles.userSkill}>{user.skillLevel}</Text>
                      </>
                    )}
                  </View>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[
                      styles.followButton,
                      getIsFollowing(user.id) && styles.followingButton,
                    ]}
                    onPress={() => handleFollow(user.id, user.nickname)}
                    disabled={loading}
                  >
                    <Ionicons
                      name={getIsFollowing(user.id) ? "checkmark-circle" : "person-add"}
                      size={16}
                      color={getIsFollowing(user.id) ? theme.colors.surface : theme.colors.primary}
                    />
                    <Text
                      style={[
                        styles.followButtonText,
                        getIsFollowing(user.id) && styles.followingButtonText,
                      ]}
                    >
                      {getIsFollowing(user.id) ? 'Following' : 'Follow'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      // Invite to team action
                      Alert.alert('Invite to Team', `Invite ${user.nickname} to join a team?`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Select Team', onPress: () => {
                          // TODO: Show team selection modal
                          router.push('/(tabs)/teams');
                        }},
                      ]);
                    }}
                  >
                    <Ionicons name="people" size={18} color={theme.colors.secondary} />
                  </TouchableOpacity>
                </View>
              </View>

              {user.sports && user.sports.length > 0 && (
                <View style={styles.sportsContainer}>
                  {user.sports.map((sport) => (
                    <View
                      key={sport}
                      style={[
                        styles.sportBadge,
                        { backgroundColor: getSportColor(sport) },
                      ]}
                    >
                      <Text style={styles.sportBadgeText}>
                        {sport.charAt(0).toUpperCase() + sport.slice(1)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {user.bio && (
                <Text style={styles.userBio} numberOfLines={2}>
                  {user.bio}
                </Text>
              )}
            </TouchableOpacity>
          ))}
          
          {/* Load More Button */}
          {hasMore && (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={loadMore}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={theme.colors.surface} />
              ) : (
                <>
                  <Text style={styles.loadMoreText}>Load More</Text>
                  <Ionicons name="chevron-down" size={20} color={theme.colors.surface} />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
  },
  filtersSection: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  filterGroup: {
    marginBottom: theme.spacing.md,
  },
  filterLabel: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  radiusButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  radiusButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  radiusButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  radiusButtonText: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  radiusButtonTextActive: {
    color: theme.colors.surface,
    fontWeight: '600',
  },
  sportFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  skillFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  filterChip: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background,
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
  },
  filterChipTextActive: {
    color: theme.colors.surface,
    fontWeight: '600',
  },
  resultsSection: {
    padding: theme.spacing.md,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  userCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  userCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  userInfo: {
    flex: 1,
  },
  userNickname: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  userDistance: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  userMetaSeparator: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  userSkill: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
  },
  sportsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  sportBadge: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  sportBadgeText: {
    ...theme.typography.caption,
    color: theme.colors.surface,
    fontWeight: '600',
  },
  userBio: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
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
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.error,
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.lg,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    alignItems: 'center',
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  followingButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  followButtonText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  followingButtonText: {
    color: theme.colors.surface,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  loadMoreButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  loadMoreText: {
    ...theme.typography.body,
    color: theme.colors.surface,
    fontWeight: '600',
  },
});

