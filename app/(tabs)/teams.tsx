import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../constants/theme';
import { Team } from '../../types';
import { teamService } from '../../services/teams';
import { Ionicons } from '@expo/vector-icons';
import { usePagination } from '../../hooks/usePagination';
import { Cursor } from '../../utils/cursor';

export default function TeamsScreen() {
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [selectedSport, setSelectedSport] = useState<'football' | 'basketball' | 'tennis' | 'padel' | undefined>();
  const [activeTab, setActiveTab] = useState<'my' | 'public'>('my');
  const [inviteCodeInput, setInviteCodeInput] = useState<{ [key: string]: string }>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [joinLoading, setJoinLoading] = useState<{ [key: string]: boolean }>({});
  const { user } = useAuth();
  const router = useRouter();

  // Teams feed with cursor pagination (public + private teams user is member of)
  const { items: publicTeams, loading, error, hasMore, loadMore, refresh } = usePagination({
    fetchPage: async (cursor: Cursor, limit: number) => {
      const result = await teamService.getTeamsFeedPaginated(
        limit,
        cursor,
        selectedSport,
        user?.id,
        searchQuery.trim() || undefined
      );
      return {
        data: result.data,
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      };
    },
    limit: 20,
  });

  useEffect(() => {
    loadMyTeams();
  }, [user]);

  useEffect(() => {
    // Refresh public teams when sport filter or search changes
    if (activeTab === 'public') {
      refresh();
    }
  }, [selectedSport, searchQuery]);

  const loadMyTeams = async () => {
    if (!user) return;
    try {
      const myTeamsData = await teamService.getUserTeams(user.id);
      setMyTeams(myTeamsData);
    } catch (error) {
      console.error('Error loading my teams:', error);
    }
  };

  const onRefresh = async () => {
    if (activeTab === 'my') {
      await loadMyTeams();
    } else {
      await refresh();
    }
  };

      const handleJoinPublicTeam = async (teamId: string) => {
        if (!user) {
          Alert.alert('Error', 'You must be logged in');
          return;
        }

        setJoinLoading({ ...joinLoading, [teamId]: true });
        try {
          // Use RPC join_team with team_id for public teams
          await teamService.joinTeam(undefined, teamId);
          
          // Update UI immediately - refresh will update the data
          await loadMyTeams();
          await refresh();
        } catch (error: any) {
          Alert.alert('Error', error.message || 'Failed to join team');
        } finally {
          setJoinLoading({ ...joinLoading, [teamId]: false });
        }
      };

      const handleLeaveTeam = async (teamId: string) => {
        if (!user) {
          Alert.alert('Error', 'You must be logged in');
          return;
        }

        Alert.alert(
          'Leave Team',
          'Are you sure you want to leave this team?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Leave',
              style: 'destructive',
              onPress: async () => {
                setJoinLoading({ ...joinLoading, [teamId]: true });
                try {
                  // Use RPC leave_team
                  await teamService.leaveTeam(teamId);
                  await loadMyTeams();
                  await refresh();
                } catch (error: any) {
                  Alert.alert('Error', error.message || 'Failed to leave team');
                } finally {
                  setJoinLoading({ ...joinLoading, [teamId]: false });
                }
              },
            },
          ]
        );
      };

      const handleJoinPrivateTeam = async (teamId: string) => {
        const inviteCode = inviteCodeInput[teamId]?.trim().toUpperCase();
        if (!inviteCode) {
          Alert.alert('Error', 'Please enter an invite code or token');
          return;
        }
        if (!user) {
          Alert.alert('Error', 'You must be logged in');
          return;
        }

        setJoinLoading({ ...joinLoading, [teamId]: true });
        try {
          // Use RPC join_team with invite token
          await teamService.joinTeam(inviteCode);
          
          setInviteCodeInput({ ...inviteCodeInput, [teamId]: '' });
          await loadMyTeams();
          await refresh();
        } catch (error: any) {
          Alert.alert('Error', error.message || 'Failed to join team');
        } finally {
          setJoinLoading({ ...joinLoading, [teamId]: false });
        }
      };

  const getSportColor = (sport: string) => {
    return theme.sports[sport as keyof typeof theme.sports] || theme.colors.primary;
  };

  const renderTeam = ({ item }: { item: Team }) => (
    <TouchableOpacity
      style={styles.teamCard}
      onPress={() => router.push(`/team/manage?id=${item.id}`)}
    >
      <View style={styles.teamHeader}>
        <View style={[styles.sportBadge, { backgroundColor: getSportColor(item.sport) }]}>
          <Text style={styles.sportBadgeText}>
            {item.sport.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.teamInfo}>
          <Text style={styles.teamName}>{item.name}</Text>
          <Text style={styles.teamOwner}>by {item.ownerNickname}</Text>
        </View>
        <View style={[styles.publicBadge, !item.isPublic && styles.privateBadge]}>
          <Ionicons
            name={item.isPublic ? 'globe' : 'lock-closed'}
            size={14}
            color={theme.colors.surface}
          />
        </View>
      </View>

      {item.description && (
        <Text style={styles.teamDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.teamFooter}>
        <View style={styles.footerRow}>
          <Ionicons name="people" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.footerText}>
            {item.memberCount ?? 0}/{item.maxPlayers} members
          </Text>
        </View>
        {item.location && (
          <View style={styles.footerRow}>
            <Ionicons name="location" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.footerText}>{item.location}</Text>
          </View>
        )}
      </View>

      {activeTab === 'public' && (
        <>
          {item.isMember ? (
            <View style={styles.joinedContainer}>
              <View style={styles.joinedBadge}>
                <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                <Text style={styles.joinedText}>Joined</Text>
              </View>
              <TouchableOpacity
                style={styles.leaveButton}
                onPress={() => handleLeaveTeam(item.id)}
                disabled={joinLoading[item.id]}
              >
                {joinLoading[item.id] ? (
                  <ActivityIndicator size="small" color={theme.colors.error} />
                ) : (
                  <Text style={styles.leaveButtonText}>Leave</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : item.isPublic ? (
            <TouchableOpacity
              style={styles.joinButton}
              onPress={() => handleJoinPublicTeam(item.id)}
              disabled={joinLoading[item.id]}
            >
              {joinLoading[item.id] ? (
                <ActivityIndicator size="small" color={theme.colors.surface} />
              ) : (
                <Text style={styles.joinButtonText}>Join</Text>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.privateTeamActions}>
              <TextInput
                style={styles.inviteCodeInput}
                placeholder="Invite code"
                placeholderTextColor={theme.colors.textSecondary}
                value={inviteCodeInput[item.id] || ''}
                onChangeText={(text) => setInviteCodeInput({ ...inviteCodeInput, [item.id]: text })}
                autoCapitalize="characters"
                maxLength={8}
              />
              <TouchableOpacity
                style={[styles.joinButton, styles.joinButtonPrivate]}
                onPress={() => handleJoinPrivateTeam(item.id)}
                disabled={joinLoading[item.id]}
              >
                {joinLoading[item.id] ? (
                  <ActivityIndicator size="small" color={theme.colors.surface} />
                ) : (
                  <>
                    <Ionicons name="lock-closed" size={16} color={theme.colors.surface} />
                    <Text style={styles.joinButtonText}>Join</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </TouchableOpacity>
  );

  const currentTeams = activeTab === 'my' ? myTeams : publicTeams;

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my' && styles.tabActive]}
          onPress={() => setActiveTab('my')}
        >
          <Text style={[styles.tabText, activeTab === 'my' && styles.tabTextActive]}>
            My Teams ({myTeams.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'public' && styles.tabActive]}
          onPress={() => setActiveTab('public')}
        >
          <Text style={[styles.tabText, activeTab === 'public' && styles.tabTextActive]}>
            Public Teams ({publicTeams.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sport Filter and Search for Public Teams */}
      {activeTab === 'public' && (
        <>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by team name..."
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.filterChip, !selectedSport && styles.filterChipActive]}
                onPress={() => setSelectedSport(undefined)}
              >
                <Text style={[styles.filterChipText, !selectedSport && styles.filterChipTextActive]}>
                  All Sports
                </Text>
              </TouchableOpacity>
              {['football', 'basketball', 'tennis', 'padel'].map((sport) => (
                <TouchableOpacity
                  key={sport}
                  style={[
                    styles.filterChip,
                    selectedSport === sport && styles.filterChipActive,
                    selectedSport === sport && { backgroundColor: theme.sports[sport as keyof typeof theme.sports] },
                  ]}
                  onPress={() => setSelectedSport(sport === selectedSport ? undefined : sport as any)}
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
            </ScrollView>
          </View>
        </>
      )}

      {activeTab === 'my' ? (
        <FlatList
          data={myTeams}
          renderItem={renderTeam}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color={theme.colors.textSecondary} />
              <Text style={styles.emptyText}>No teams yet</Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push('/team/create')}
              >
                <Text style={styles.createButtonText}>Create Team</Text>
              </TouchableOpacity>
            </View>
          }
        />
      ) : (
        <FlatList
          data={publicTeams}
          renderItem={renderTeam}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={loading && !hasMore} onRefresh={onRefresh} />
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
              <Ionicons name="people-outline" size={64} color={theme.colors.textSecondary} />
              <Text style={styles.emptyText}>No public teams</Text>
              {selectedSport && (
                <Text style={styles.emptySubtext}>Try selecting a different sport</Text>
              )}
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/team/create')}
      >
        <Ionicons name="add" size={28} color={theme.colors.surface} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: theme.colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: theme.spacing.lg,
  },
  teamCard: {
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
  teamHeader: {
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
  teamInfo: {
    flex: 1,
  },
  teamName: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  teamOwner: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
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
  teamDescription: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  teamFooter: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  footerText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  joinButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    alignItems: 'center',
  },
  joinButtonText: {
    ...theme.typography.body,
    color: theme.colors.surface,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: theme.spacing.xxl,
    marginTop: theme.spacing.xxl,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  createButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  createButtonText: {
    ...theme.typography.body,
    color: theme.colors.surface,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: theme.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  filterContainer: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
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
  privateTeamActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  inviteCodeInput: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.sm,
    ...theme.typography.body,
    color: theme.colors.text,
    fontFamily: 'monospace',
    letterSpacing: 2,
    textAlign: 'center',
  },
  joinButtonPrivate: {
    paddingHorizontal: theme.spacing.md,
  },
  footerLoader: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  emptySubtext: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.text,
    paddingVertical: theme.spacing.sm,
  },
  clearButton: {
    padding: theme.spacing.xs,
  },
  joinedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
  },
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.success + '20',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  joinedText: {
    ...theme.typography.body,
    color: theme.colors.success,
    fontWeight: '600',
  },
  leaveButton: {
    backgroundColor: theme.colors.error + '20',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  leaveButtonText: {
    ...theme.typography.body,
    color: theme.colors.error,
    fontWeight: '600',
  },
});

