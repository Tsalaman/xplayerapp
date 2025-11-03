import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import Card from './ui/Card';
import Badge from './ui/Badge';
import Avatar from './ui/Avatar';
import { t } from '../utils/i18n';

interface MatchCardProps {
  id: string;
  title: string;
  sport: string;
  location?: string;
  date?: string;
  time?: string;
  participants?: Array<{ id: string; name: string; avatar?: string }>;
  status?: 'pending' | 'live' | 'completed';
  onPress?: () => void;
  style?: any;
}

export default function MatchCard({
  id,
  title,
  sport,
  location,
  date,
  time,
  participants = [],
  status = 'pending',
  onPress,
  style,
}: MatchCardProps) {
  const getSportColor = (sport: string) => {
    return theme.sports[sport as keyof typeof theme.sports] || theme.colors.primary;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('el-GR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={[styles.card, style]}>
        <View style={styles.header}>
          <Badge
            label={t(`sports.${sport}`)}
            variant="primary"
            style={[styles.sportBadge, { backgroundColor: getSportColor(sport) }]}
          />
          {status === 'live' && (
            <Badge label="LIVE" variant="error" style={styles.statusBadge} />
          )}
          {status === 'completed' && (
            <Badge label={t('match.completed')} variant="default" style={styles.statusBadge} />
          )}
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        {date && (
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.infoText}>{formatDate(date)}</Text>
            {time && (
              <>
                <Text style={styles.separator}> • </Text>
                <Text style={styles.infoText}>{time}</Text>
              </>
            )}
          </View>
        )}

        {location && (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.infoText}>{location}</Text>
          </View>
        )}

        {participants.length > 0 && (
          <View style={styles.participantsRow}>
            <View style={styles.participantsAvatars}>
              {participants.slice(0, 3).map((participant, index) => (
                <Avatar
                  key={participant.id}
                  name={participant.name}
                  size="sm"
                  style={[styles.avatar, { marginLeft: index > 0 ? -8 : 0 }]}
                />
              ))}
            </View>
            <Text style={styles.participantsText}>
              {participants.length === 1
                ? participants[0].name
                : `${participants.length} ${t('match.participants')}`}
            </Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sportBadge: {
    marginBottom: 0,
  },
  statusBadge: {
    marginBottom: 0,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  infoText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  separator: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  participantsAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  participantsText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
});

