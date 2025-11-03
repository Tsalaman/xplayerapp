import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import Badge from '../ui/Badge';
import Card from '../ui/Card';

interface AchievementProps {
  id: string;
  name: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  unlocked: boolean;
  xp?: number;
  style?: ViewStyle;
}

export default function Achievement({
  id,
  name,
  description,
  icon = 'trophy',
  unlocked,
  xp = 0,
  style,
}: AchievementProps) {
  return (
    <Card style={[styles.container, !unlocked && styles.locked, style]}>
      <View style={styles.header}>
        <View
          style={[
            styles.iconContainer,
            !unlocked && styles.iconContainerLocked,
          ]}
        >
          <Ionicons
            name={icon}
            size={32}
            color={unlocked ? theme.colors.accent : theme.colors.textSecondary}
          />
        </View>
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text
              style={[styles.name, !unlocked && styles.nameLocked]}
            >
              {name}
            </Text>
            {!unlocked && (
              <Ionicons
                name="lock-closed"
                size={16}
                color={theme.colors.textSecondary}
              />
            )}
          </View>
          {description && (
            <Text
              style={[styles.description, !unlocked && styles.descriptionLocked]}
            >
              {description}
            </Text>
          )}
          {xp > 0 && (
            <Badge
              label={`+${xp} XP`}
              variant="primary"
              size="sm"
              style={styles.xpBadge}
            />
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  locked: {
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerLocked: {
    backgroundColor: theme.colors.border,
  },
  info: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs / 2,
  },
  name: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  nameLocked: {
    color: theme.colors.textSecondary,
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    lineHeight: 20,
  },
  descriptionLocked: {
    opacity: 0.7,
  },
  xpBadge: {
    marginTop: theme.spacing.xs / 2,
  },
});

