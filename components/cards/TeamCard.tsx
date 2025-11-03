import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { t } from '../../utils/i18n';
import { supabase } from '../../services/supabase';

interface TeamCardProps {
  id: string;
  name: string;
  sport: string;
  members: number;
  description?: string;
  isPrivate?: boolean;
  privacy?: 'public' | 'private';
  avatarUrl?: string;
  onPress?: () => void;
  onJoin?: () => void;
  style?: ViewStyle;
}

export default function TeamCard({
  id,
  name,
  sport,
  members,
  description,
  isPrivate = false,
  privacy,
  avatarUrl,
  onPress,
  onJoin,
  style,
}: TeamCardProps) {
  const router = useRouter();
  const isPrivateTeam = isPrivate || privacy === 'private';

  const getSportColor = (sport: string) => {
    return theme.sports[sport as keyof typeof theme.sports] || theme.colors.mint;
  };

  // Get avatar URL from Supabase Storage
  const getAvatarUrl = () => {
    if (avatarUrl) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(avatarUrl);
      return data.publicUrl;
    }
    return null;
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/team/manage?id=${id}`);
    }
  };

  const handleJoin = () => {
    if (onJoin) {
      onJoin();
    } else {
      router.push(`/team/join?id=${id}`);
    }
  };

  const avatarPublicUrl = getAvatarUrl();

  return (
    <Card style={[styles.card, style]}>
      {/* Gradient Header - 135deg from navy to mint */}
      <LinearGradient
        colors={[theme.colors.navy, theme.colors.mint]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        <TouchableOpacity onPress={handlePress} activeOpacity={0.8} style={styles.headerTouchable}>
          <View style={styles.header}>
            {/* Avatar or Icon */}
            <View style={styles.avatarContainer}>
              {avatarPublicUrl ? (
                <Image source={{ uri: avatarPublicUrl }} style={styles.avatar} />
              ) : (
                <Ionicons name="people" size={32} color={theme.colors.surface} />
              )}
            </View>
            <View style={styles.info}>
              <View style={styles.titleRow}>
                <Text style={styles.name} numberOfLines={1}>{name}</Text>
                {isPrivateTeam && (
                  <View style={styles.privateBadge}>
                    <Ionicons
                      name="lock-closed"
                      size={14}
                      color={theme.colors.mint}
                    />
                    <Text style={styles.privateLabel}>Private Team</Text>
                  </View>
                )}
              </View>
              <Badge
                label={t(`sports.${sport}`)}
                variant="primary"
                style={[styles.sportBadge, { backgroundColor: getSportColor(sport) }]}
              />
              {description && (
                <Text style={styles.description} numberOfLines={2}>
                  {description}
                </Text>
              )}
              <View style={styles.meta}>
                <Ionicons name="people" size={16} color={theme.colors.surface} />
                <Text style={styles.members}>
                  {members} {t('team.members')}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </LinearGradient>

      <Button
        title={t('buttons.join')}
        onPress={handleJoin}
        variant="primary"
        size="sm"
        style={styles.joinButton}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    borderRadius: theme.borderRadius.xl,
  },
  gradientHeader: {
    padding: theme.spacing.md,
  },
  headerTouchable: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.surface + '40',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  info: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs / 2,
    flexWrap: 'wrap',
  },
  name: {
    ...theme.typography.h3,
    color: theme.colors.surface,
    fontWeight: '700',
  },
  privateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.mint + '20',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  privateLabel: {
    ...theme.typography.caption,
    color: theme.colors.mint,
    fontSize: 10,
    fontWeight: '600',
  },
  sportBadge: {
    marginBottom: theme.spacing.xs / 2,
    marginTop: theme.spacing.xs,
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.surface + 'DD',
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
    lineHeight: 20,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs / 2,
  },
  members: {
    ...theme.typography.caption,
    color: theme.colors.surface + 'CC',
  },
  joinButton: {
    marginTop: theme.spacing.sm,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
});

