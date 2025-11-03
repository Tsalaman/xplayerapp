import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import Card from '../ui/Card';

interface StatItem {
  label: string;
  value1: string | number;
  value2: string | number;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface MatchStatsProps {
  stats: StatItem[];
  team1Name: string;
  team2Name: string;
  style?: ViewStyle;
}

export default function MatchStats({
  stats,
  team1Name,
  team2Name,
  style,
}: MatchStatsProps) {
  return (
    <Card style={[styles.container, style]}>
      <Text style={styles.title}>Match Statistics</Text>
      {stats.map((stat, index) => (
        <View key={index} style={styles.statRow}>
          <View style={styles.statHeader}>
            {stat.icon && (
              <Ionicons
                name={stat.icon}
                size={18}
                color={theme.colors.textSecondary}
                style={styles.statIcon}
              />
            )}
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
          <View style={styles.statValues}>
            <View style={styles.statValue}>
              <Text style={styles.statValueText}>{stat.value1}</Text>
            </View>
            <View style={styles.statBar}>
              <View
                style={[
                  styles.statBarFill,
                  styles.statBarLeft,
                  {
                    width: `${
                      Number(stat.value1) /
                      (Number(stat.value1) + Number(stat.value2)) *
                      100
                    }%`,
                  },
                ]}
              />
            </View>
            <View style={styles.statValue}>
              <Text style={styles.statValueText}>{stat.value2}</Text>
            </View>
          </View>
        </View>
      ))}
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
    fontWeight: '700',
    marginBottom: theme.spacing.lg,
  },
  statRow: {
    marginBottom: theme.spacing.md,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  statIcon: {
    marginRight: theme.spacing.xs,
  },
  statLabel: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  statValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  statValue: {
    minWidth: 40,
    alignItems: 'center',
  },
  statValueText: {
    ...theme.typography.h3,
    color: theme.colors.text,
    fontWeight: '700',
  },
  statBar: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  statBarFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  statBarLeft: {
    left: 0,
  },
});

