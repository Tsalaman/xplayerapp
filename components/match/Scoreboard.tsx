import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../../constants/theme';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { t } from '../../utils/i18n';

interface ScoreboardProps {
  team1Name: string;
  team1Score: number;
  team2Name: string;
  team2Score: number;
  sport: string;
  period?: string;
  timeRemaining?: string;
  style?: ViewStyle;
}

export default function Scoreboard({
  team1Name,
  team1Score,
  team2Name,
  team2Score,
  sport,
  period,
  timeRemaining,
  style,
}: ScoreboardProps) {
  const getSportColor = (sport: string) => {
    return theme.sports[sport as keyof typeof theme.sports] || theme.colors.primary;
  };

  return (
    <Card style={[styles.container, style]}>
      <View style={styles.header}>
        <Badge
          label={t(`sports.${sport}`)}
          variant="primary"
          style={[styles.sportBadge, { backgroundColor: getSportColor(sport) }]}
        />
        {period && (
          <Text style={styles.period}>{period}</Text>
        )}
        {timeRemaining && (
          <Text style={styles.time}>{timeRemaining}</Text>
        )}
      </View>

      <View style={styles.scoreContainer}>
        <View style={styles.team}>
          <Text style={styles.teamName} numberOfLines={1}>
            {team1Name}
          </Text>
          <Text style={[styles.score, team1Score > team2Score && styles.scoreLeading]}>
            {team1Score}
          </Text>
        </View>

        <View style={styles.separator}>
          <Text style={styles.separatorText}>-</Text>
        </View>

        <View style={styles.team}>
          <Text style={styles.teamName} numberOfLines={1}>
            {team2Name}
          </Text>
          <Text style={[styles.score, team2Score > team1Score && styles.scoreLeading]}>
            {team2Score}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  sportBadge: {
    marginBottom: 0,
  },
  period: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  time: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  team: {
    flex: 1,
    alignItems: 'center',
  },
  teamName: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
  },
  score: {
    ...theme.typography.h1,
    color: theme.colors.text,
    fontSize: 48,
    fontWeight: '800',
  },
  scoreLeading: {
    color: theme.colors.primary,
  },
  separator: {
    paddingHorizontal: theme.spacing.md,
  },
  separatorText: {
    ...theme.typography.h1,
    color: theme.colors.textSecondary,
    fontSize: 32,
    fontWeight: '300',
  },
});

