import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../constants/theme';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { t } from '../../utils/i18n';
import { profileService } from '../../services/profileService';
import { matchesService } from '../../services/matches';
import ProgressBar from '../../components/ui/ProgressBar';

export default function AnalyticsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user]);

  const loadAnalytics = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Load profile for XP and level
      const profileData = await profileService.getProfile(user.id);
      setProfile(profileData);

      // Load match stats
      const matchStats = await matchesService.getMatchStats(user.id);
      
      // Calculate win rate
      const winRate = matchStats.totalMatches > 0
        ? (matchStats.wins / matchStats.totalMatches) * 100
        : 0;

      // Calculate level and XP
      const currentLevel = profileData.level || 1;
      const currentXp = profileData.xp || 0;
      const nextLevelXp = currentLevel * 1000;

      setStats({
        totalMatches: matchStats.totalMatches,
        wins: matchStats.wins,
        losses: matchStats.losses,
        draws: matchStats.draws,
        winRate,
        level: currentLevel,
        xp: currentXp,
        nextLevelXp,
        bySport: matchStats.bySport,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSportColor = (sport: string) => {
    return theme.sports[sport as keyof typeof theme.sports] || theme.colors.mint;
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.mint} />
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.errorText}>No data available</Text>
      </View>
    );
  }

  const progressPercentage = stats.nextLevelXp > 0
    ? (stats.xp / stats.nextLevelXp) * 100
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('nav.analytics')}</Text>
        <View style={styles.placeholder} />
      </View>

      <Card style={styles.overviewCard}>
        <View style={styles.overviewHeader}>
          <View>
            <Text style={styles.overviewLabel}>{t('profile.level')}</Text>
            <Text style={styles.overviewValue}>{stats.level}</Text>
          </View>
          <Badge
            label={`${stats.xp} ${t('profile.xp')}`}
            variant="primary"
            style={styles.xpBadge}
          />
        </View>
        <ProgressBar
          current={stats.xp}
          total={stats.nextLevelXp}
        />
        <Text style={styles.progressText}>
          {stats.nextLevelXp - stats.xp} XP until next level
        </Text>
      </Card>

      <Card style={styles.statsCard}>
        <Text style={styles.sectionTitle}>{t('profile.stats')}</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalMatches}</Text>
            <Text style={styles.statLabel}>{t('match.title')}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.success }]}>
              {stats.wins}
            </Text>
            <Text style={styles.statLabel}>{t('team.wins')}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.error }]}>
              {stats.losses}
            </Text>
            <Text style={styles.statLabel}>{t('team.losses')}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.winRate.toFixed(1)}%</Text>
            <Text style={styles.statLabel}>{t('team.winRate')}</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.sportsCard}>
        <Text style={styles.sectionTitle}>Performance by Sport</Text>
        {Object.entries(stats.bySport || {}).map(([sport, sportStat]: [string, any]) => (
          <View key={sport} style={[styles.sportStatRow]}>
            <View style={styles.sportHeader}>
              <View
                style={[
                  styles.sportBadgeContainer,
                  { backgroundColor: getSportColor(sport) },
                ]}
              >
                <Badge
                  label={t(`sports.${sport}`)}
                  variant="primary"
                  style={styles.sportBadge}
                />
              </View>
              <Text style={styles.sportMatches}>
                {sportStat.wins + sportStat.losses + sportStat.draws} matches
              </Text>
            </View>
            <View style={styles.sportStats}>
              <View style={styles.sportStatItem}>
                <Text style={[styles.sportStatValue, { color: theme.colors.success }]}>
                  {sportStat.wins}
                </Text>
                <Text style={styles.sportStatLabel}>W</Text>
              </View>
              <View style={styles.sportStatItem}>
                <Text style={[styles.sportStatValue, { color: theme.colors.error }]}>
                  {sportStat.losses}
                </Text>
                <Text style={styles.sportStatLabel}>L</Text>
              </View>
              {sportStat.draws > 0 && (
                <View style={styles.sportStatItem}>
                  <Text style={[styles.sportStatValue, { color: theme.colors.textSecondary }]}>
                    {sportStat.draws}
                  </Text>
                  <Text style={styles.sportStatLabel}>D</Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Light gray background (XPlayer palette)
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.error,
    textAlign: 'center',
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
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  overviewLabel: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs / 2,
  },
  overviewValue: {
    ...theme.typography.h1,
    color: theme.colors.text,
  },
  xpBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  progressText: {
    ...theme.typography.caption,
    color: theme.colors.mint,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    fontWeight: '600',
  },
  statsCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  statItem: {
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
  ratingCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  ratingContainer: {
    alignItems: 'center',
  },
  ratingValue: {
    ...theme.typography.h1,
    fontSize: 48,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  goalsCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  goalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  goalItem: {
    alignItems: 'center',
  },
  goalValue: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  goalLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  sportsCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  sportStatRow: {
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
  sportBadgeContainer: {
    marginBottom: 0,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  sportBadge: {
    marginBottom: 0,
  },
  sportMatches: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  sportStats: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  sportStatItem: {
    alignItems: 'center',
  },
  sportStatValue: {
    ...theme.typography.h3,
    marginBottom: theme.spacing.xs / 2,
  },
  sportStatLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
});
