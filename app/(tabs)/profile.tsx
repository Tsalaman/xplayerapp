import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '../../hooks/useLocation';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { loc, refresh } = useLocation(false); // No auto-watch on profile screen
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const handleUpdateLocation = async () => {
    setUpdatingLocation(true);
    try {
      await refresh();
      Alert.alert('Success', 'Location updated successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update location');
    } finally {
      setUpdatingLocation(false);
    }
  };

  const { updateUser } = useAuth();

  const formatTimeAgo = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const handlePrivacyChange = async (privacy: 'exact' | 'coarse' | 'hidden') => {
    try {
      await updateUser({ locationPrivacy: privacy });
      Alert.alert('Success', 'Privacy setting updated!');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update privacy setting');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  if (!user) {
    return null;
  }

  const getSportColor = (sport: string) => {
    return theme.sports[sport as keyof typeof theme.sports] || theme.colors.primary;
  };

  const getSportIcon = (sport: string) => {
    const icons: Record<string, string> = {
      football: 'football',
      basketball: 'basketball',
      tennis: 'tennisball',
      padel: 'trophy',
    };
    return icons[sport] || 'ellipse';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={48} color={theme.colors.mint} />
          </View>
        </View>
        <Text style={styles.nickname}>{user.nickname || 'No nickname'}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sports</Text>
        </View>
        {user.sports && user.sports.length > 0 ? (
          <View style={styles.sportsContainer}>
            {user.sports.map((sport) => (
              <View
                key={sport}
                style={[
                  styles.sportBadge,
                  { backgroundColor: getSportColor(sport) },
                ]}
              >
                <Ionicons
                  name={getSportIcon(sport) as any}
                  size={20}
                  color={theme.colors.surface}
                />
                <Text style={styles.sportText}>
                  {sport.charAt(0).toUpperCase() + sport.slice(1)}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No sports selected</Text>
        )}
      </View>

      {user.bio && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>
      )}

      {user.location && (
        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Ionicons name="location" size={20} color={theme.colors.primary} />
            <Text style={styles.infoText}>{user.location}</Text>
          </View>
        </View>
      )}

      {user.skillLevel && (
        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Ionicons name="star" size={20} color={theme.colors.accent} />
            <Text style={styles.infoText}>
              Skill Level: {user.skillLevel.charAt(0).toUpperCase() + user.skillLevel.slice(1)}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location Services</Text>
        <View style={styles.locationInfo}>
          <View style={styles.locationRow}>
            <Ionicons 
              name={loc.permissionGranted ? "location" : "location-outline"} 
              size={20} 
              color={loc.permissionGranted ? theme.colors.success : theme.colors.textSecondary} 
            />
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationStatus}>
                {loc.permissionGranted ? 'Location enabled' : 'Location disabled'}
              </Text>
              {loc.timestamp && (
                <Text style={styles.locationTime}>
                  Last updated: {formatTimeAgo(loc.timestamp)}
                </Text>
              )}
              {loc.latitude && loc.longitude && (
                <Text style={styles.locationCoords}>
                  {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                </Text>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={[styles.updateLocationButton, updatingLocation && styles.updateLocationButtonDisabled]}
            onPress={handleUpdateLocation}
            disabled={updatingLocation}
          >
            {updatingLocation ? (
              <ActivityIndicator size="small" color={theme.colors.surface} />
            ) : (
              <>
                <Ionicons name="refresh" size={16} color={theme.colors.surface} />
                <Text style={styles.updateLocationText}>Update Location</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        {loc.error && (
          <Text style={styles.errorText}>
            {loc.error === 'permission-denied' 
              ? 'Location permission denied. Please enable in settings.'
              : loc.error}
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location Privacy</Text>
        <View style={styles.privacyContainer}>
          <Text style={styles.privacyDescription}>
            Choose how others see your location
          </Text>
          <TouchableOpacity
            style={[
              styles.privacyOption,
              user.locationPrivacy === 'exact' && styles.privacyOptionSelected,
            ]}
            onPress={() => handlePrivacyChange('exact')}
          >
            <Ionicons 
              name="location" 
              size={20} 
              color={user.locationPrivacy === 'exact' ? theme.colors.primary : theme.colors.textSecondary} 
            />
            <View style={styles.privacyTextContainer}>
              <Text style={[
                styles.privacyOptionText,
                user.locationPrivacy === 'exact' && styles.privacyOptionTextSelected,
              ]}>
                Exact Location
              </Text>
              <Text style={styles.privacyOptionSubtext}>
                Show precise coordinates (for finding nearby players)
              </Text>
            </View>
            {user.locationPrivacy === 'exact' && (
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.privacyOption,
              user.locationPrivacy === 'coarse' && styles.privacyOptionSelected,
            ]}
            onPress={() => handlePrivacyChange('coarse')}
          >
            <Ionicons 
              name="location-outline" 
              size={20} 
              color={user.locationPrivacy === 'coarse' ? theme.colors.primary : theme.colors.textSecondary} 
            />
            <View style={styles.privacyTextContainer}>
              <Text style={[
                styles.privacyOptionText,
                user.locationPrivacy === 'coarse' && styles.privacyOptionTextSelected,
              ]}>
                Coarse Location (City Only)
              </Text>
              <Text style={styles.privacyOptionSubtext}>
                Show only city/region (more private)
              </Text>
            </View>
            {user.locationPrivacy === 'coarse' && (
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.privacyOption,
              user.locationPrivacy === 'hidden' && styles.privacyOptionSelected,
            ]}
            onPress={() => handlePrivacyChange('hidden')}
          >
            <Ionicons 
              name="eye-off-outline" 
              size={20} 
              color={user.locationPrivacy === 'hidden' ? theme.colors.primary : theme.colors.textSecondary} 
            />
            <View style={styles.privacyTextContainer}>
              <Text style={[
                styles.privacyOptionText,
                user.locationPrivacy === 'hidden' && styles.privacyOptionTextSelected,
              ]}>
                Hidden
              </Text>
              <Text style={styles.privacyOptionSubtext}>
                Don't share location with others
              </Text>
            </View>
            {user.locationPrivacy === 'hidden' && (
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.editButton}
        onPress={() => setEditModalVisible(true)}
      >
        <LinearGradient
          colors={[theme.colors.navy, theme.colors.mint]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.editButtonGradient}
        >
          <Ionicons name="create-outline" size={20} color={theme.colors.surface} />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      <EditProfileModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onUpdate={() => {
          // Refresh profile data if needed
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  avatarContainer: {
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.mint + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nickname: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  email: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  sectionHeader: {
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  sportsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.xs,
  },
  sportText: {
    ...theme.typography.body,
    color: theme.colors.surface,
    marginLeft: theme.spacing.xs,
    fontWeight: '600',
  },
  bio: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  editButton: {
    borderRadius: theme.borderRadius.md,
    height: 56,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.mint,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  editButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  editButtonText: {
    ...theme.typography.h3,
    color: theme.colors.surface,
    marginLeft: theme.spacing.sm,
  },
  logoutButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.error,
    marginBottom: theme.spacing.xl,
  },
  logoutButtonText: {
    ...theme.typography.h3,
    color: theme.colors.error,
    marginLeft: theme.spacing.sm,
  },
  locationInfo: {
    marginTop: theme.spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  locationTextContainer: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  locationStatus: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  locationTime: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  locationCoords: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontFamily: 'monospace',
  },
  updateLocationButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  updateLocationButtonDisabled: {
    opacity: 0.6,
  },
  updateLocationText: {
    ...theme.typography.body,
    color: theme.colors.surface,
    fontWeight: '600',
  },
  errorText: {
    ...theme.typography.caption,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
  privacyContainer: {
    marginTop: theme.spacing.sm,
  },
  privacyDescription: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  privacyOptionSelected: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    backgroundColor: theme.colors.primary + '10',
  },
  privacyTextContainer: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  privacyOptionText: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  privacyOptionTextSelected: {
    color: theme.colors.primary,
  },
  privacyOptionSubtext: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
});

