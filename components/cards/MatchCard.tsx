import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';
import { t } from '../../utils/i18n';
import { Post, Tournament } from '../../types';

interface MatchCardProps {
  item: Post | Tournament;
  onPress?: () => void;
  style?: ViewStyle;
  showQuickActions?: boolean;
}

export default function MatchCard({
  item,
  onPress,
  style,
  showQuickActions = true,
}: MatchCardProps) {
  const router = useRouter();

  const getSportColor = (sport: string) => {
    return theme.sports[sport as keyof typeof theme.sports] || theme.colors.primary;
  };

  const getSportIcon = (sport: string) => {
    const icons: Record<string, string> = {
      football: 'football',
      basketball: 'basketball',
      tennis: 'tennisball',
      padel: 'trophy',
    };
    return icons[sport] || 'ellipse';
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if ('type' in item) {
      // Post
      router.push(`/post/details?id=${item.id}`);
    } else {
      // Tournament
      router.push(`/tournament/details?id=${item.id}`);
    }
  };

  const isPost = 'type' in item;
  const sport = isPost ? item.sport : item.sport;
  const title = isPost ? item.title : item.title;

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <Card style={[styles.card, style]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.sportBadge,
                { backgroundColor: getSportColor(sport) },
              ]}
            >
              <Ionicons
                name={getSportIcon(sport) as any}
                size={20}
                color={theme.colors.surface}
              />
            </View>
            <Badge
              label={t(`sports.${sport}`)}
              variant="primary"
              style={styles.sportBadgeText}
            />
          </View>
          {isPost && 'type' in item && (
            <View
              style={[
                styles.typeBadge,
                item.type === 'teammate' && styles.typeBadgeTeammate,
              ]}
            >
              <Text style={styles.typeBadgeText}>
                {item.type === 'teammate' ? t('match.lookingForTeammates') : t('match.lookingForOpponents')}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        {isPost && 'description' in item && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.footer}>
          {isPost && 'userNickname' in item && (
            <View style={styles.userInfo}>
              <Avatar name={item.userNickname} size="sm" />
              <Text style={styles.userName}>{item.userNickname}</Text>
            </View>
          )}
          {isPost && 'location' in item && item.location && (
            <View style={styles.locationRow}>
              <Ionicons
                name="location"
                size={14}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.location}>{item.location}</Text>
            </View>
          )}
          {isPost && 'date' in item && item.date && (
            <View style={styles.dateRow}>
              <Ionicons
                name="calendar"
                size={14}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.date}>{item.date}</Text>
            </View>
          )}
        </View>

        {showQuickActions && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push(`/post/details?id=${item.id}`)}
            >
              <Ionicons
                name="chatbubble-outline"
                size={18}
                color={theme.colors.primary}
              />
              <Text style={styles.actionText}>{t('buttons.join')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push(`/chat?userId=${isPost && 'userId' in item ? item.userId : ''}`)}
            >
              <Ionicons
                name="mail-outline"
                size={18}
                color={theme.colors.primary}
              />
              <Text style={styles.actionText}>{t('buttons.send')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  sportBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sportBadgeText: {
    marginBottom: 0,
  },
  typeBadge: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  typeBadgeTeammate: {
    backgroundColor: theme.colors.primary,
  },
  typeBadgeText: {
    ...theme.typography.caption,
    color: theme.colors.surface,
    fontWeight: '600',
    fontSize: 10,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  userName: {
    ...theme.typography.caption,
    color: theme.colors.text,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  location: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  date: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    padding: theme.spacing.sm,
  },
  actionText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

