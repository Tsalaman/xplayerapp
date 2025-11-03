import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../constants/theme';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { t } from '../../utils/i18n';
import { profileService } from '../../services/profileService';
import ProgressBar from '../../components/ui/ProgressBar';
import AchievementsList from '../../components/profile/AchievementsList';

export default function StatsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [xpGainAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadStats();
  }, [user]);

  const loadStats = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const statsData = await profileService.getStats(user.id);
      
      // Calculate XP bonus (+25 XP per win)
      const xpBonus = statsData.wins * 25;
      const profile = await profileService.getProfile(user.id);
      
      // Check if level up
      const currentLevel = profile.level || 1;
      const currentXp = profile.xp || 0;
      const nextLevelXp = (currentLevel * 1000) || 1000;
      const newXp = currentXp + xpBonus;
      
      let newLevel = currentLevel;
      if (newXp > nextLevelXp) {
        newLevel = currentLevel + 1;
        // Show level up animation
        Animated.sequence([
          Animated.timing(xpGainAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(xpGainAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start();
      }
      
      setStats({
        ...statsData,
        xp: newXp,
        level: newLevel,
        nextLevelXp: newLevel * 1000,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock detailed stats (fallback)
  const detailedStats = stats || {
  overall: {
    matchesPlayed: 24,
    wins: 16,
    losses: 6,
    draws: 2,
    winRate: 66.7,
    goalsFor: 45,
    goalsAgainst: 32,
    averageRating: 4.5,
  },
  sports: {
    football: {
      matches: 15,
      wins: 10,
      losses: 4,
      draws: 1,
      winRate: 66.7,
      goalsFor: 28,
      goalsAgainst: 18,
    },
    basketball: {
      matches: 6,
      wins: 4,
      losses: 2,
      draws: 0,
      winRate: 66.7,
      pointsFor: 342,
      pointsAgainst: 298,
    },
    tennis: {
      matches: 3,
      wins: 2,
      losses: 1,
      draws: 0,
      winRate: 66.7,
      setsWon: 5,
      setsLost: 3,
    },
  },
  achievements: [
    { id: '1', name: 'First Win', icon: 'trophy', unlocked: true },
    { id: '2', name: '10 Matches', icon: 'checkmark-circle', unlocked: true },
    { id: '3', name: 'Undefeated Week', icon: 'shield', unlocked: false },
    { id: '4', name: 'Top Scorer', icon: 'star', unlocked: true },
  ],
};

  const getSportColor = (sport: string) => {
    return theme.sports[sport as keyof typeof theme.sports] || theme.colors.mint;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.mint} />
      </View>
    );
  }

  const scaleAnim = xpGainAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.navy} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('nav.stats')}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* XP Gain Toast */}
      <Animated.View
        style={[
          styles.xpToast,
          {
            opacity: xpGainAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.xpToastText}>Level Up! 🎉</Text>
      </Animated.View>

      <Card style={styles.overviewCard}>
        <Text style={styles.sectionTitle}>Overall Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{detailedStats.overall.matchesPlayed}</Text>
            <Text style={styles.statLabel}>Matches</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: theme.colors.success }]}>
              {detailedStats.overall.wins}
            </Text>
            <Text style={styles.statLabel}>{t('team.wins')}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: theme.colors.error }]}>
              {detailedStats.overall.losses}
            </Text>
            <Text style={styles.statLabel}>{t('team.losses')}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{detailedStats.overall.winRate}%</Text>
            <Text style={styles.statLabel}>{t('team.winRate')}</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.sportsCard}>
        <Text style={styles.sectionTitle}>Performance by Sport</Text>
        {Object.entries(detailedStats.sports).map(([sport, stats]) => (
          <View key={sport} style={styles.sportStatContainer}>
            <View style={styles.sportHeader}>
              <Badge
                label={t(`sports.${sport}`)}
                variant="primary"
                style={[styles.sportBadge, { backgroundColor: getSportColor(sport) }]}
              />
              <Text style={styles.sportMatches}>{stats.matches} matches</Text>
            </View>
            <View style={styles.sportStatsGrid}>
              <View style={styles.sportStatItem}>
                <Ionicons name="trophy" size={20} color={theme.colors.success} />
                <Text style={styles.sportStatValue}>{stats.wins}</Text>
                <Text style={styles.sportStatLabel}>W</Text>
              </View>
              <View style={styles.sportStatItem}>
                <Ionicons name="close-circle" size={20} color={theme.colors.error} />
                <Text style={styles.sportStatValue}>{stats.losses}</Text>
                <Text style={styles.sportStatLabel}>L</Text>
              </View>
              {stats.draws > 0 && (
                <View style={styles.sportStatItem}>
                  <Ionicons name="remove-circle" size={20} color={theme.colors.textSecondary} />
                  <Text style={styles.sportStatValue}>{stats.draws}</Text>
                  <Text style={styles.sportStatLabel}>D</Text>
                </View>
              )}
              <View style={styles.sportStatItem}>
                <Ionicons name="trending-up" size={20} color={theme.colors.mint} />
                <Text style={styles.sportStatValue}>{stats.winRate}%</Text>
                <Text style={styles.sportStatLabel}>Win Rate</Text>
              </View>
            </View>
            {sport === 'football' && (
              <View style={styles.goalsRow}>
                <Text style={styles.goalText}>
                  Goals: {stats.goalsFor} / {stats.goalsAgainst}
                </Text>
              </View>
            )}
            {sport === 'basketball' && (
              <View style={styles.goalsRow}>
                <Text style={styles.goalText}>
                  Points: {stats.pointsFor} / {stats.pointsAgainst}
                </Text>
              </View>
            )}
            {sport === 'tennis' && (
              <View style={styles.goalsRow}>
                <Text style={styles.goalText}>
                  Sets: {stats.setsWon} / {stats.setsLost}
                </Text>
              </View>
            )}
          </View>
        ))}
      </Card>

      <Card style={styles.achievementsCard}>
        <Text style={styles.sectionTitle}>{t('profile.achievements')}</Text>
        <AchievementsList userId={user?.id || ''} />
      </Card>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
    paddingTop: theme.spacing.xl + 20,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  overviewCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  statBox: {
    width: '48%',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
  },
  statValue: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  sportsCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  sportStatContainer: {
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sportBadge: {
    marginBottom: 0,
  },
  sportMatches: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  sportStatsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    flexWrap: 'wrap',
  },
  sportStatItem: {
    flex: 1,
    minWidth: '22%',
    alignItems: 'center',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
  },
  sportStatValue: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginTop: theme.spacing.xs / 2,
    marginBottom: theme.spacing.xs / 2,
  },
  sportStatLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  goalsRow: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  goalText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  achievementsCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  achievementItem: {
    width: '48%',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    position: 'relative',
  },
  achievementItemLocked: {
    opacity: 0.5,
  },
  achievementIcon: {
    marginBottom: theme.spacing.sm,
  },
  achievementIconLocked: {
    opacity: 0.5,
  },
  achievementName: {
    ...theme.typography.body,
    color: theme.colors.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  achievementNameLocked: {
    color: theme.colors.textSecondary,
  },
  lockIcon: {
    position: 'absolute',
    top: theme.spacing.xs,
    right: theme.spacing.xs,
  },
});
