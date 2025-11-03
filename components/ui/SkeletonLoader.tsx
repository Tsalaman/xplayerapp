import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import Skeleton from './Skeleton';

interface SkeletonLoaderProps {
  variant?: 'card' | 'list' | 'matchCard' | 'playerRow';
  count?: number;
}

export default function SkeletonLoader({
  variant = 'card',
  count = 1,
}: SkeletonLoaderProps) {
  const renderCard = () => (
    <View style={styles.card}>
      <Skeleton width="60%" height={24} />
      <View style={styles.cardSpacer} />
      <Skeleton width="100%" height={16} />
      <View style={styles.cardSpacer} />
      <Skeleton width="80%" height={16} />
      <View style={styles.cardSpacer} />
      <Skeleton width="100%" height={120} borderRadius={theme.borderRadius.md} />
    </View>
  );

  const renderList = () => (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.listItem}>
          <Skeleton width={48} height={48} borderRadius={24} />
          <View style={styles.listItemContent}>
            <Skeleton width="70%" height={18} />
            <View style={styles.listItemSpacer} />
            <Skeleton width="50%" height={14} />
          </View>
        </View>
      ))}
    </View>
  );

  const renderMatchCard = () => (
    <View style={styles.matchCard}>
      <View style={styles.matchCardHeader}>
        <Skeleton width={64} height={64} borderRadius={32} />
        <View style={styles.matchCardHeaderContent}>
          <Skeleton width="60%" height={20} />
          <View style={styles.matchCardHeaderSpacer} />
          <Skeleton width="40%" height={16} />
        </View>
      </View>
      <View style={styles.matchCardSpacer} />
      <Skeleton width="100%" height={16} />
      <View style={styles.matchCardSpacer} />
      <Skeleton width="80%" height={16} />
      <View style={styles.matchCardSpacer} />
      <Skeleton width="100%" height={48} borderRadius={theme.borderRadius.full} />
    </View>
  );

  const renderPlayerRow = () => (
    <View style={styles.playerRow}>
      <Skeleton width={48} height={48} borderRadius={24} />
      <View style={styles.playerRowContent}>
        <Skeleton width="50%" height={18} />
        <View style={styles.playerRowSpacer} />
        <Skeleton width="30%" height={14} />
      </View>
    </View>
  );

  switch (variant) {
    case 'card':
      return (
        <>
          {Array.from({ length: count }).map((_, index) => (
            <View key={index} style={styles.container}>
              {renderCard()}
            </View>
          ))}
        </>
      );
    case 'list':
      return renderList();
    case 'matchCard':
      return (
        <>
          {Array.from({ length: count }).map((_, index) => (
            <View key={index} style={styles.container}>
              {renderMatchCard()}
            </View>
          ))}
        </>
      );
    case 'playerRow':
      return (
        <>
          {Array.from({ length: count }).map((_, index) => (
            <View key={index} style={styles.container}>
              {renderPlayerRow()}
            </View>
          ))}
        </>
      );
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  card: {
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.navyDark,
    borderRadius: theme.borderRadius.lg,
  },
  cardSpacer: {
    height: theme.spacing.md,
  },
  list: {
    gap: theme.spacing.md,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
  },
  listItemContent: {
    flex: 1,
  },
  listItemSpacer: {
    height: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  matchCard: {
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.navyDark,
    borderRadius: theme.borderRadius.lg,
  },
  matchCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  matchCardHeaderContent: {
    flex: 1,
  },
  matchCardHeaderSpacer: {
    height: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  matchCardSpacer: {
    height: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
  },
  playerRowContent: {
    flex: 1,
  },
  playerRowSpacer: {
    height: theme.spacing.xs,
    marginTop: theme.spacing.xs / 2,
  },
});

