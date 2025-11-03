import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../../contexts/AuthContext';
import { theme } from '../../../constants/theme';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Avatar from '../../../components/ui/Avatar';
import Button from '../../../components/ui/Button';
import { t } from '../../../utils/i18n';
import { supabase } from '../../../services/supabase';

export default function LiveMatchScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState<any>(null);
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [subscription, setSubscription] = useState<any>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const homePulseAnim = useRef(new Animated.Value(1)).current;
  const awayPulseAnim = useRef(new Animated.Value(1)).current;
  const previousScoreRef = useRef({ home: 0, away: 0 });

  useEffect(() => {
    loadMatch();
    setupRealtimeSubscription();
    setupSound();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [matchId]);

  useEffect(() => {
    // Check if score changed and play sound + pulse animation
    if (
      score.home !== previousScoreRef.current.home ||
      score.away !== previousScoreRef.current.away
    ) {
      playScoreSound();
      
      // Pulse animation for leading team
      if (score.home > score.away) {
        pulseAnimation(homePulseAnim);
      } else if (score.away > score.home) {
        pulseAnimation(awayPulseAnim);
      }
      
      previousScoreRef.current = { ...score };
    }
  }, [score]);

  const loadMatch = async () => {
    setLoading(true);
    try {
      // Fetch match from Supabase
      const { data: matchData, error } = await supabase
        .from('matches')
        .select('*, creator:users!creator_id(id, nickname, profile_picture)')
        .eq('id', matchId)
        .single();

      if (error) throw error;

      if (matchData) {
        // Fetch participants (match_players)
        const { data: playersData } = await supabase
          .from('match_players')
          .select('*, user:users(id, nickname, profile_picture)')
          .eq('match_id', matchId);

        const participants = playersData?.map((mp: any) => ({
          id: mp.user_id,
          name: mp.user?.nickname || 'Unknown',
          score: mp.user_id === matchData.creator_id ? score.home : score.away,
        })) || [
          { id: matchData.creator_id, name: matchData.creator?.nickname || 'Creator', score: score.home },
        ];

        setMatch({
          id: matchData.id,
          title: `${matchData.sport.charAt(0).toUpperCase() + matchData.sport.slice(1)} Match`,
          sport: matchData.sport,
          date: matchData.date || matchData.created_at,
          location: matchData.location || 'Location TBD',
          participants,
          status: matchData.status || 'live',
          score_home: matchData.score_home || 0,
          score_away: matchData.score_away || 0,
        });

        // Set initial score from database
        if (matchData.score_home !== undefined && matchData.score_away !== undefined) {
          setScore({
            home: matchData.score_home || 0,
            away: matchData.score_away || 0,
          });
        }
      }
    } catch (error) {
      console.error('Error loading match:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupSound = async () => {
    try {
      const { sound: soundObject } = await Audio.Sound.createAsync(
        { uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav' }, // You can replace with your sound file
        { shouldPlay: false }
      );
      setSound(soundObject);
    } catch (error) {
      console.log('Error loading sound:', error);
    }
  };

  const playScoreSound = async () => {
    try {
      if (sound) {
        await sound.replayAsync();
      }
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  };

  const pulseAnimation = (animValue: Animated.Value) => {
    Animated.sequence([
      Animated.timing(animValue, {
        toValue: 1.2,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(animValue, {
        toValue: 1,
        duration: 200,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`match:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
          filter: `id=eq.${matchId}`,
        },
        (payload) => {
          // Update match data in real-time
          setMatch(payload.new);
          
          // Update score from payload if available
          if (payload.new.score_home !== undefined && payload.new.score_away !== undefined) {
            setScore({
              home: payload.new.score_home || 0,
              away: payload.new.score_away || 0,
            });
          }
        }
      )
      .subscribe();

    setSubscription(channel);
  };

  const updateScore = async (team: 'home' | 'away', increment: number) => {
    const newScore = {
      ...score,
      [team]: Math.max(0, score[team] + increment),
    };
    
    setScore(newScore);
    
    // Update score in Supabase
    try {
      const updateData: any = {};
      if (team === 'home') {
        updateData.score_home = newScore.home;
      } else {
        updateData.score_away = newScore.away;
      }
      
      const { error } = await supabase
        .from('matches')
        .update(updateData)
        .eq('id', matchId);
      
      if (error) {
        console.error('Error updating score:', error);
        // Revert score on error
        setScore(score);
      }
    } catch (error) {
      console.error('Error updating score:', error);
      setScore(score);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!match) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{t('errors.notFound')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Badge label="LIVE" variant="error" />
          <Text style={styles.headerTitle}>{match.title}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <Card style={styles.scoreCard}>
        <View style={styles.scoreContainer}>
          <Animated.View
            style={[
              styles.teamContainer,
              { transform: [{ scale: homePulseAnim }] },
              score.home > score.away && styles.leadingTeam,
            ]}
          >
            <Text style={styles.teamName}>{match.participants[0]?.name || 'Team A'}</Text>
            <LinearGradient
              colors={
                score.home > score.away
                  ? [theme.colors.mint, theme.colors.mintDark]
                  : [theme.colors.surface, theme.colors.background]
              }
              style={styles.scoreGradient}
            >
              <Text style={[styles.score, score.home > score.away && styles.scoreLeading]}>
                {score.home}
              </Text>
            </LinearGradient>
            <View style={styles.scoreButtons}>
              <TouchableOpacity
                style={styles.scoreButton}
                onPress={() => updateScore('home', 1)}
              >
                <Ionicons name="add" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.scoreButton}
                onPress={() => updateScore('home', -1)}
              >
                <Ionicons name="remove" size={20} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          <View style={styles.vsContainer}>
            <Text style={styles.vs}>VS</Text>
          </View>

          <Animated.View
            style={[
              styles.teamContainer,
              { transform: [{ scale: awayPulseAnim }] },
              score.away > score.home && styles.leadingTeam,
            ]}
          >
            <Text style={styles.teamName}>{match.participants[1]?.name || 'Team B'}</Text>
            <LinearGradient
              colors={
                score.away > score.home
                  ? [theme.colors.mint, theme.colors.mintDark]
                  : [theme.colors.surface, theme.colors.background]
              }
              style={styles.scoreGradient}
            >
              <Text style={[styles.score, score.away > score.home && styles.scoreLeading]}>
                {score.away}
              </Text>
            </LinearGradient>
            <View style={styles.scoreButtons}>
              <TouchableOpacity
                style={styles.scoreButton}
                onPress={() => updateScore('away', 1)}
              >
                <Ionicons name="add" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.scoreButton}
                onPress={() => updateScore('away', -1)}
              >
                <Ionicons name="remove" size={20} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Card>

      <Card style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={20} color={theme.colors.textSecondary} />
          <Text style={styles.infoText}>
            {new Date(match.date).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={20} color={theme.colors.textSecondary} />
          <Text style={styles.infoText}>{match.location}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="football-outline" size={20} color={theme.colors.textSecondary} />
          <Text style={styles.infoText}>{t(`sports.${match.sport}`)}</Text>
        </View>
      </Card>

      <Card style={styles.participantsCard}>
        <Text style={styles.sectionTitle}>{t('match.participants')}</Text>
        {match.participants?.map((participant: any, index: number) => (
          <View key={index} style={styles.participantRow}>
            <Avatar name={participant.name} size="md" />
            <View style={styles.participantInfo}>
              <Text style={styles.participantName}>{participant.name}</Text>
              <Text style={styles.participantScore}>
                Score: {participant.score || 0}
              </Text>
            </View>
          </View>
        ))}
      </Card>

      <Button
        title={t('matchResult.submit')}
        onPress={() => router.push(`/matches/${matchId}/review`)}
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
    marginBottom: theme.spacing.lg,
    paddingTop: theme.spacing.xl + 20,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
  },
  placeholder: {
    width: 40,
  },
  scoreCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.xl,
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  teamContainer: {
    alignItems: 'center',
    flex: 1,
  },
  leadingTeam: {
    opacity: 1,
  },
  teamName: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  scoreGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.mint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  score: {
    ...theme.typography.h1,
    fontSize: 48,
    color: theme.colors.navy,
    fontWeight: 'bold',
  },
  scoreLeading: {
    color: theme.colors.navy,
    fontWeight: '900',
  },
  scoreButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  scoreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  vsContainer: {
    paddingHorizontal: theme.spacing.lg,
  },
  vs: {
    ...theme.typography.h2,
    color: theme.colors.textSecondary,
  },
  infoCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  participantsCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: theme.spacing.xs / 2,
  },
  participantScore: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  submitButton: {
    marginTop: theme.spacing.md,
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.error,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
});

