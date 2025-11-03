import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../../contexts/AuthContext';
import { theme } from '../../../constants/theme';
import { supabase } from '../../../services/supabase';
import { haptic } from '../../../utils/haptics';
import { createFadeUpAnimation } from '../../../utils/animations';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Avatar from '../../../components/ui/Avatar';
import GradientButton from '../../../components/ui/GradientButton';
import SkeletonLoader from '../../../components/ui/SkeletonLoader';

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'information-circle-outline' },
  { id: 'players', label: 'Players', icon: 'people-outline' },
  { id: 'details', label: 'Details', icon: 'list-outline' },
];

export default function MatchDetailScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [match, setMatch] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [joining, setJoining] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [cardAnim] = useState(new Animated.Value(0));
  const underlineAnim = useRef(
    TABS.reduce(
      (acc, tab, index) => {
        acc[tab.id] = new Animated.Value(index === 0 ? 1 : 0);
        return acc;
      },
      {} as Record<string, Animated.Value>
    )
  ).current;

  useEffect(() => {
    loadMatch();
    if (activeTab === 'players') {
      loadPlayers();
    }
  }, [matchId, activeTab]);

  useEffect(() => {
    // Fade-up animation on tab change
    cardAnim.setValue(0);
    createFadeUpAnimation(cardAnim, 150).start();
    haptic.selection();
  }, [activeTab]);

  useEffect(() => {
    // Animate tab underline
    TABS.forEach((tab) => {
      Animated.timing(underlineAnim[tab.id], {
        toValue: tab.id === activeTab ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    });

    // Fade-in content
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  const loadMatch = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();

      if (error) throw error;
      setMatch(data);
    } catch (error) {
      console.error('Error loading match:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('match_players')
        .select('*, user:users(id, nickname, profile_picture)')
        .eq('match_id', matchId);

      if (error) throw error;

      const playersData = data?.map((mp: any) => ({
        id: mp.user_id,
        nickname: mp.user?.nickname || 'Unknown',
        avatar: mp.user?.profile_picture || undefined,
        joinedAt: mp.joined_at,
      })) || [];

      setPlayers(playersData);
    } catch (error) {
      console.error('Error loading players:', error);
    }
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    switch (activeTab) {
      case 'overview':
        return (
          <Animated.View style={{ opacity: fadeAnim }}>
            <Card style={styles.card}>
              <View style={styles.overviewHeader}>
                <Badge
                  label={match?.sport || 'Sport'}
                  variant="primary"
                  style={[styles.sportBadge, { backgroundColor: theme.colors.mint }]}
                />
                <Text style={styles.matchTitle}>Match Details</Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={20} color={theme.colors.navy} />
                <Text style={styles.infoText}>
                  {match?.date} at {match?.time}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={20} color={theme.colors.navy} />
                <Text style={styles.infoText}>{match?.location}</Text>
              </View>

              {match?.court && (
                <View style={styles.infoRow}>
                  <Ionicons name="basketball-outline" size={20} color={theme.colors.navy} />
                  <Text style={styles.infoText}>{match.court}</Text>
                </View>
              )}

              {match?.description && (
                <View style={styles.descriptionContainer}>
                  <Text style={styles.descriptionLabel}>Description</Text>
                  <Text style={styles.descriptionText}>{match.description}</Text>
                </View>
              )}
            </Card>
          </Animated.View>
        );

      case 'players':
        const isUserJoined = user && players.some((p) => p.id === user.id);
        const isFull = players.length >= (match?.slots || 2);
        const canJoin = user && !isUserJoined && !isFull && !joining;

        return (
          <Animated.View style={{ opacity: fadeAnim }}>
            <Card style={styles.card}>
              <View style={styles.playersHeader}>
                <Text style={styles.playersTitle}>
                  Players ({players.length} / {match?.slots || 2})
                </Text>
                {isFull && (
                  <View style={styles.fullBadge}>
                    <Ionicons name="lock-closed" size={16} color={theme.colors.error} />
                    <Text style={styles.fullText}>Full</Text>
                  </View>
                )}
              </View>

              {players.length === 0 ? (
                <View style={styles.emptyPlayers}>
                  <Ionicons name="people-outline" size={48} color={theme.colors.textSecondary} />
                  <Text style={styles.emptyPlayersText}>No players joined yet</Text>
                </View>
              ) : (
                <View style={styles.playersList}>
                  {players.map((player) => {
                    const isCurrentUser = user && player.id === user.id;
                    return (
                      <View
                        key={player.id}
                        style={[
                          styles.playerRow,
                          isCurrentUser && styles.playerRowCurrent,
                        ]}
                      >
                        <Avatar
                          name={player.nickname}
                          size="md"
                          source={player.avatar ? { uri: player.avatar } : undefined}
                        />
                        <View style={styles.playerInfo}>
                          <View style={styles.playerNameRow}>
                            <Text style={styles.playerName}>{player.nickname}</Text>
                            {isCurrentUser && (
                              <Badge
                                label="You"
                                variant="primary"
                                style={styles.youBadge}
                              />
                            )}
                          </View>
                          <Text style={styles.playerJoined}>
                            Joined {new Date(player.joinedAt).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Join Team Button */}
              {canJoin && (
                <GradientButton
                  title={joining ? 'Joining...' : 'Join Team'}
                  onPress={async () => {
                    if (!user || joining) return;

                    setJoining(true);
                    try {
                      // Check if match is still open
                      if (match?.status !== 'open') {
                        alert('This match is no longer open for joining');
                        return;
                      }

                      // Check if slots are still available
                      const { count } = await supabase
                        .from('match_players')
                        .select('*', { count: 'exact', head: true })
                        .eq('match_id', matchId);

                      if (count !== null && count >= (match?.slots || 2)) {
                        alert('This match is now full');
                        await loadPlayers();
                        return;
                      }

                      // Join match
                      const { error } = await supabase
                        .from('match_players')
                        .insert([{ match_id: matchId, user_id: user.id }]);

                      if (error) {
                        if (error.code === '23505') {
                          // Unique constraint violation - already joined
                          haptic.error();
                          alert('You have already joined this match');
                        } else {
                          throw error;
                        }
                      } else {
                        // Success - reload players
                        haptic.success();
                        await loadPlayers();
                      }
                    } catch (error: any) {
                      console.error('Error joining match:', error);
                      alert(error.message || 'Failed to join match. Please try again.');
                    } finally {
                      setJoining(false);
                    }
                  }}
                  disabled={joining}
                  style={styles.joinButton}
                />
              )}

              {/* Already Joined Message */}
              {isUserJoined && (
                <View style={styles.alreadyJoined}>
                  <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
                  <Text style={styles.alreadyJoinedText}>You've joined this match</Text>
                </View>
              )}

              {/* Full Message */}
              {isFull && !isUserJoined && user && (
                <View style={styles.fullMessage}>
                  <Ionicons name="lock-closed" size={24} color={theme.colors.textSecondary} />
                  <Text style={styles.fullMessageText}>
                    This match is full. No more slots available.
                  </Text>
                </View>
              )}
            </Card>
          </Animated.View>
        );

      case 'details':
        return (
          <Animated.View style={{ opacity: fadeAnim }}>
            <Card style={styles.card}>
              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Skill Level</Text>
                  <Text style={styles.detailValue}>{match?.level || 'Any'}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <Badge
                    label={match?.status || 'open'}
                    variant="primary"
                    style={styles.statusBadge}
                  />
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Privacy</Text>
                  <Text style={styles.detailValue}>
                    {match?.is_private ? 'Private' : 'Public'}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Created</Text>
                  <Text style={styles.detailValue}>
                    {new Date(match?.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </Card>
          </Animated.View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.navy, theme.colors.navyDark]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.surface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Match Details</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Sticky Tabs */}
        <View style={styles.tabsContainer}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={styles.tab}
              onPress={() => {
                haptic.selection();
                setActiveTab(tab.id);
              }}
            >
              <Ionicons
                name={tab.icon as any}
                size={20}
                color={activeTab === tab.id ? theme.colors.mint : theme.colors.textSecondary}
                style={styles.tabIcon}
              />
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === tab.id && styles.tabLabelActive,
                ]}
              >
                {tab.label}
              </Text>
              <Animated.View
                style={[
                  styles.tabUnderline,
                  {
                    opacity: underlineAnim[tab.id],
                    transform: [
                      {
                        scaleX: underlineAnim[tab.id].interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 1],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {loading ? (
          <SkeletonLoader variant="card" />
        ) : (
          <Animated.View
            style={{
              opacity: cardAnim,
              transform: [
                {
                  translateY: cardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            }}
          >
            {renderTabContent()}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.surface,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.navyLight,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    position: 'relative',
    gap: theme.spacing.xs,
  },
  tabIcon: {
    marginRight: theme.spacing.xs,
  },
  tabLabel: {
    ...theme.typography.bodyMedium,
    color: theme.colors.textSecondary,
  },
  tabLabelActive: {
    color: theme.colors.mint,
    fontWeight: '600',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: theme.colors.mint,
    borderRadius: theme.borderRadius.sm,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.lg,
  },
  card: {
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  loadingContainer: {
    padding: theme.spacing.xxl,
    alignItems: 'center',
  },
  overviewHeader: {
    marginBottom: theme.spacing.lg,
  },
  sportBadge: {
    marginBottom: theme.spacing.md,
  },
  matchTitle: {
    ...theme.typography.h2,
    color: theme.colors.navy,
    marginBottom: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  infoText: {
    ...theme.typography.body,
    color: theme.colors.navy,
  },
  descriptionContainer: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  descriptionLabel: {
    ...theme.typography.bodyMedium,
    color: theme.colors.navy,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  descriptionText: {
    ...theme.typography.body,
    color: theme.colors.text,
    lineHeight: 24,
  },
  playersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  playersTitle: {
    ...theme.typography.h3,
    color: theme.colors.navy,
    fontWeight: '700',
  },
  fullBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.error + '20',
  },
  fullText: {
    ...theme.typography.caption,
    color: theme.colors.error,
    fontWeight: '600',
  },
  emptyPlayers: {
    alignItems: 'center',
    padding: theme.spacing.xxl,
  },
  emptyPlayersText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  playersList: {
    gap: theme.spacing.md,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  playerRowCurrent: {
    backgroundColor: theme.colors.mint + '15',
    borderWidth: 1,
    borderColor: theme.colors.mint + '40',
  },
  playerInfo: {
    flex: 1,
  },
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs / 2,
  },
  playerName: {
    ...theme.typography.body,
    color: theme.colors.navy,
    fontWeight: '600',
  },
  youBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  playerJoined: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  joinButton: {
    marginTop: theme.spacing.lg,
  },
  alreadyJoined: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.success + '15',
    borderWidth: 1,
    borderColor: theme.colors.success + '40',
  },
  alreadyJoinedText: {
    ...theme.typography.body,
    color: theme.colors.success,
    fontWeight: '600',
  },
  fullMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.textSecondary + '15',
    borderWidth: 1,
    borderColor: theme.colors.textSecondary + '40',
  },
  fullMessageText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.lg,
  },
  detailItem: {
    width: '48%',
  },
  detailLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  detailValue: {
    ...theme.typography.body,
    color: theme.colors.navy,
    fontWeight: '600',
  },
  statusBadge: {
    marginTop: theme.spacing.xs,
  },
});

