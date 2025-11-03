import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import Badge from '../ui/Badge';
import { t } from '../../utils/i18n';

interface LiveTimerProps {
  startTime?: Date;
  isLive?: boolean;
  onTimeUpdate?: (elapsed: number) => void;
  style?: ViewStyle;
}

export default function LiveTimer({
  startTime,
  isLive = true,
  onTimeUpdate,
  style,
}: LiveTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isLive || !startTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      setElapsed(diff);
      if (onTimeUpdate) {
        onTimeUpdate(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isLive, startTime, onTimeUpdate]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, style]}>
      {isLive && (
        <Badge
          label={t('match.live')}
          variant="primary"
          style={[styles.liveBadge, { backgroundColor: theme.colors.error }]}
        >
          <View style={styles.liveIndicator}>
            <View style={[styles.liveDot, { backgroundColor: theme.colors.surface }]} />
          </View>
        </Badge>
      )}
      <Text style={styles.time}>{formatTime(elapsed)}</Text>
      {!isLive && (
        <Ionicons
          name="pause"
          size={16}
          color={theme.colors.textSecondary}
          style={styles.pauseIcon}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  liveBadge: {
    marginBottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.surface,
  },
  time: {
    ...theme.typography.h3,
    color: theme.colors.text,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  pauseIcon: {
    marginLeft: theme.spacing.xs / 2,
  },
});

