import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '../../constants/theme';
import { teamService } from '../../services/teams';
import { supabase } from '../../services/supabase';
import Card from '../ui/Card';

interface TeamStats {
  wins: number;
  losses: number;
  rating: number;
  matches_played: number;
}

interface TeamStatisticsProps {
  teamId: string;
}

/**
 * Team Statistics Component
 * - Fetches team_stats from Supabase
 * - Displays wins, losses, rating
 * - Real-time updates via Supabase subscriptions
 */
export default function TeamStatistics({ teamId }: TeamStatisticsProps) {
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('team_stats')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_stats',
          filter: `team_id=eq.${teamId}`,
        },
        () => {
          loadStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId]);

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('team_stats')
        .select('*')
        .eq('team_id', teamId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned (team stats not created yet)
        console.error('Error loading team stats:', error);
        setStats({
          wins: 0,
          losses: 0,
          rating: 0,
          matches_played: 0,
        });
      } else if (data) {
        setStats({
          wins: data.wins || 0,
          losses: data.losses || 0,
          rating: data.rating || 0,
          matches_played: data.matches_played || 0,
        });
      } else {
        // No stats yet
        setStats({
          wins: 0,
          losses: 0,
          rating: 0,
          matches_played: 0,
        });
      }
    } catch (error) {
      console.error('Error loading team stats:', error);
      setStats({
        wins: 0,
        losses: 0,
        rating: 0,
        matches_played: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card style={styles.container}>
        <ActivityIndicator size="small" color={theme.colors.mint} />
      </Card>
    );
  }

  if (!stats) return null;

  const winRate = stats.matches_played > 0
    ? ((stats.wins / stats.matches_played) * 100).toFixed(1)
    : '0.0';

  return (
    <Card style={styles.container}>
      <Text style={styles.title}>Team Statistics</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.wins}</Text>
          <Text style={styles.statLabel}>Wins</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.losses}</Text>
          <Text style={styles.statLabel}>Losses</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{winRate}%</Text>
          <Text style={styles.statLabel}>Win Rate</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.rating.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>

      {/* Simple progress bar for win rate visualization */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${parseFloat(winRate)}%`,
                backgroundColor: theme.colors.mint,
              },
            ]}
          />
        </View>
        <Text style={styles.progressLabel}>
          {stats.matches_played} matches played
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
  },
  statValue: {
    ...theme.typography.h2,
    color: theme.colors.mint,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  progressContainer: {
    marginTop: theme.spacing.md,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
    marginBottom: theme.spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: theme.borderRadius.full,
  },
  progressLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

