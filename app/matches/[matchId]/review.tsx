import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import { theme } from '../../../constants/theme';
import { supabase } from '../../../services/supabase';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Avatar from '../../../components/ui/Avatar';
import { t } from '../../../utils/i18n';

const RATING_TAGS = [
  { id: 'skillful', label: 'Skillful', icon: 'star' },
  { id: 'friendly', label: 'Friendly', icon: 'heart' },
  { id: 'competitive', label: 'Competitive', icon: 'trophy' },
  { id: 'punctual', label: 'Punctual', icon: 'time' },
  { id: 'communicative', label: 'Communicative', icon: 'chatbubbles' },
];

export default function PostMatchReviewScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [ratings, setRatings] = useState<Record<string, { stars: number; tags: string[] }>>({});

  const [participants, setParticipants] = useState<any[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(true);

  useEffect(() => {
    if (matchId) {
      loadParticipants();
    }
  }, [matchId]);

  const loadParticipants = async () => {
    try {
      setLoadingParticipants(true);
      const { data, error } = await supabase
        .from('match_players')
        .select('*, user:users(id, nickname, profile_picture)')
        .eq('match_id', matchId);

      if (error) throw error;

      const participantsData = data
        ?.map((mp: any) => ({
          id: mp.user_id,
          name: mp.user?.nickname || 'Unknown',
        }))
        .filter((p: any) => p.id !== user?.id) || []; // Exclude current user

      setParticipants(participantsData);
    } catch (error) {
      console.error('Error loading participants:', error);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const updateRating = (playerId: string, stars: number) => {
    setRatings((prev) => ({
      ...prev,
      [playerId]: { ...prev[playerId], stars, tags: prev[playerId]?.tags || [] },
    }));
  };

  const toggleTag = (playerId: string, tagId: string) => {
    setRatings((prev) => {
      const currentTags = prev[playerId]?.tags || [];
      const newTags = currentTags.includes(tagId)
        ? currentTags.filter((t) => t !== tagId)
        : [...currentTags, tagId];
      return {
        ...prev,
        [playerId]: { ...prev[playerId], stars: prev[playerId]?.stars || 0, tags: newTags },
      };
    });
  };

  const handleSubmit = () => {
    // Submit reviews
    Alert.alert(t('success.success'), 'Reviews submitted successfully!', [
      { text: t('common.done'), onPress: () => router.back() },
    ]);
  };

  const renderStars = (playerId: string, currentRating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => updateRating(playerId, star)}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= currentRating ? 'star' : 'star-outline'}
              size={32}
              color={star <= currentRating ? theme.colors.accent : theme.colors.border}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('matchResult.ratePlayers')}</Text>
        <View style={styles.placeholder} />
      </View>

      <Text style={styles.subtitle}>
        Rate your match experience with each player
      </Text>

      {participants.map((participant) => {
        const rating = ratings[participant.id] || { stars: 0, tags: [] };
        return (
          <Card key={participant.id} style={styles.playerCard}>
            <View style={styles.playerHeader}>
              <Avatar name={participant.name} size="lg" />
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{participant.name}</Text>
                <Text style={styles.ratingText}>
                  {rating.stars > 0 ? `${rating.stars}/5` : t('matchResult.review')}
                </Text>
              </View>
            </View>

            <View style={styles.ratingSection}>
              <Text style={styles.sectionLabel}>{t('matchResult.review')}</Text>
              {renderStars(participant.id, rating.stars)}
            </View>

            <View style={styles.tagsSection}>
              <Text style={styles.sectionLabel}>{t('matchResult.tags')}</Text>
              <View style={styles.tagsContainer}>
                {RATING_TAGS.map((tag) => (
                  <TouchableOpacity
                    key={tag.id}
                    style={[
                      styles.tag,
                      rating.tags.includes(tag.id) && styles.tagSelected,
                    ]}
                    onPress={() => toggleTag(participant.id, tag.id)}
                  >
                    <Ionicons
                      name={tag.icon as any}
                      size={16}
                      color={
                        rating.tags.includes(tag.id)
                          ? theme.colors.primary
                          : theme.colors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.tagText,
                        rating.tags.includes(tag.id) && styles.tagTextSelected,
                      ]}
                    >
                      {tag.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Card>
        );
      })}

      <Button
        title={t('common.done')}
        onPress={handleSubmit}
        variant="primary"
        style={styles.submitButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
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
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 24,
  },
  playerCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs / 2,
  },
  ratingText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  ratingSection: {
    marginBottom: theme.spacing.lg,
  },
  sectionLabel: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  starButton: {
    padding: theme.spacing.xs,
  },
  tagsSection: {
    marginTop: theme.spacing.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.xs,
  },
  tagSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '20',
  },
  tagText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  tagTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  submitButton: {
    marginTop: theme.spacing.md,
  },
});

