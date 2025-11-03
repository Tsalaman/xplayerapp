import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../constants/theme';
import { supabase } from '../../services/supabase';
import { chatService } from '../../services/chat';
import MatchCardModern from '../../components/match/MatchCardModern';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { t } from '../../utils/i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Match {
  id: string;
  sport: string;
  date: string;
  time: string;
  location: string;
  slots: number;
  level?: string;
  creator_id: string;
  creator?: {
    nickname: string;
    profile_picture?: string;
  };
}

export default function SwipeMatchScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const swiperRef = React.useRef<any>(null);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*, creator:users!creator_id(nickname, profile_picture)')
        .eq('status', 'open')
        .eq('is_private', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const matchesData = (data || []).map((match: any) => ({
        id: match.id,
        sport: match.sport,
        date: match.date,
        time: match.time,
        location: match.location,
        slots: match.slots,
        level: match.level,
        creator_id: match.creator_id,
        creator: match.creator,
      }));

      setMatches(matchesData);
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSwipedRight = async (index: number) => {
    const match = matches[index];
    if (!match || !user) return;

    try {
      // Create match request in matches table
      const { data: existingMatch, error: checkError } = await supabase
        .from('matches')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .or(`user1_id.eq.${match.creator_id},user2_id.eq.${match.creator_id}`)
        .eq('status', 'pending')
        .single();

      if (existingMatch && !checkError) {
        // Match already exists - check if both users swiped
        const isMutualMatch = 
          (existingMatch.user1_id === user.id && existingMatch.user2_id === match.creator_id) ||
          (existingMatch.user1_id === match.creator_id && existingMatch.user2_id === user.id);

        if (isMutualMatch) {
          // Both users swiped right - update to 'matched'
          await supabase
            .from('matches')
            .update({ status: 'matched' })
            .eq('id', existingMatch.id);

          // Create notification for both users
          await supabase.from('notifications').insert([
            {
              user_id: user.id,
              message: `You matched with ${match.creator?.nickname || 'someone'}!`,
              type: 'match_result',
              link: `/matches/${existingMatch.id}`,
            },
            {
              user_id: match.creator_id,
              message: `You matched with ${user.nickname || 'someone'}!`,
              type: 'match_result',
              link: `/matches/${existingMatch.id}`,
            },
          ]);
        } else {
          // Create notification for match creator
          await supabase.from('notifications').insert([
            {
              user_id: match.creator_id,
              message: `${user.nickname || 'Someone'} wants to match with you!`,
              type: 'match_result',
              link: `/matches/${match.id}`,
            },
          ]);
        }
      } else {
        // Create new match request
        const { data: newMatch, error: insertError } = await supabase
          .from('matches')
          .insert([
            {
              user1_id: user.id,
              user2_id: match.creator_id,
              status: 'pending',
            },
          ])
          .select()
          .single();

        if (!insertError && newMatch) {
          // Create notification
          await supabase.from('notifications').insert([
            {
              user_id: match.creator_id,
              message: `New match request from ${user.nickname || 'someone'}!`,
              type: 'match_result',
              link: `/matches/${newMatch.id}`,
            },
          ]);
        }
      }

      // Create chat with match creator
      await chatService.getOrCreateChat(user.id, match.creator_id);
      
      // Navigate to match details or chat
      router.push(`/matches/${match.id}/index`);
    } catch (error) {
      console.error('Error creating match:', error);
    }
  };

  const onSwipedLeft = (index: number) => {
    // Just move to next match
  };

  const renderCard = (match: Match, index: number) => {
    if (!match) return null;

    // Calculate skill match %
    const skillMatch = user?.skillLevel === match.level ? 100 : user?.skillLevel && match.level ? 75 : 50;

    // Calculate distance (mock for now - would use location service)
    const distance = Math.floor(Math.random() * 10) + 1;

    return (
      <MatchCardModern
        id={match.id}
        sport={match.sport}
        date={match.date}
        time={match.time}
        location={match.location}
        slots={match.slots}
        currentPlayers={0} // TODO: Fetch from match_players count
        level={match.level}
        distance={distance}
        skillMatch={skillMatch}
      />
    );
  };

  const renderOverlay = (swipeDirection: string) => {
    if (swipeDirection === 'RIGHT') {
      return (
        <View style={styles.likeOverlay}>
          <Ionicons name="checkmark-circle" size={80} color={theme.colors.success} />
          <Text style={styles.overlayText}>MATCHED!</Text>
        </View>
      );
    }
    if (swipeDirection === 'LEFT') {
      return (
        <View style={styles.passOverlay}>
          <Ionicons name="close-circle" size={80} color={theme.colors.error} />
          <Text style={styles.overlayText}>PASS</Text>
        </View>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <LinearGradient
        colors={[theme.colors.navy, theme.colors.navyDark]}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.mint} />
        </View>
      </LinearGradient>
    );
  }

  if (matches.length === 0) {
    return (
      <LinearGradient
        colors={[theme.colors.navy, theme.colors.navyDark]}
        style={styles.container}
      >
        <View style={styles.emptyContainer}>
          <Card style={styles.emptyCard}>
            <Ionicons name="football-outline" size={64} color={theme.colors.mint} />
            <Text style={styles.emptyText}>No matches available</Text>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </Card>
        </View>
      </LinearGradient>
    );
  }

  const getSportColor = (sport: string) => {
    return theme.sports[sport as keyof typeof theme.sports] || theme.colors.mint;
  };

  return (
    <LinearGradient
      colors={[theme.colors.navy, theme.colors.navyDark]}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={theme.colors.surface} />
        </TouchableOpacity>
        <Text style={styles.title}>Discover Matches</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.swiperContainer}>
        <Swiper
          ref={swiperRef}
          cards={matches}
          renderCard={renderCard}
          onSwipedRight={onSwipedRight}
          onSwipedLeft={onSwipedLeft}
          cardIndex={0}
          stackSize={3}
          stackSeparation={8}
          animateCardOpacity
          animateOverlayLabelsOpacity
          overlayLabels={{
            left: {
              title: 'NOPE',
              style: {
                label: {
                  backgroundColor: theme.colors.error,
                  color: theme.colors.surface,
                  fontSize: 24,
                  fontWeight: 'bold',
                },
              },
            },
            right: {
              title: 'MATCH!',
              style: {
                label: {
                  backgroundColor: theme.colors.success,
                  color: theme.colors.surface,
                  fontSize: 24,
                  fontWeight: 'bold',
                },
              },
            },
          }}
          cardVerticalMargin={0}
          cardHorizontalMargin={24}
          infinite={false}
          backgroundColor="transparent"
          showSecondCard
        />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.passButton]}
          onPress={() => swiperRef.current?.swipeLeft()}
        >
          <Ionicons name="close" size={32} color={theme.colors.error} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.likeButton]}
          onPress={() => swiperRef.current?.swipeRight()}
        >
          <Ionicons name="heart" size={32} color={theme.colors.success} />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl + 20,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.surface,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  swiperContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.xl,
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.mint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  passButton: {
    borderWidth: 2,
    borderColor: theme.colors.error,
  },
  likeButton: {
    borderWidth: 2,
    borderColor: theme.colors.success,
  },
  emptyCard: {
    width: SCREEN_WIDTH - 48,
    height: 400,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    ...theme.typography.h3,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  backButton: {
    backgroundColor: theme.colors.mint,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    marginTop: theme.spacing.md,
  },
  backButtonText: {
    ...theme.typography.body,
    color: theme.colors.navy,
    fontWeight: '600',
  },
  likeOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -50,
    marginTop: -50,
    alignItems: 'center',
  },
  passOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -50,
    marginTop: -50,
    alignItems: 'center',
  },
  overlayText: {
    ...theme.typography.h1,
    color: theme.colors.surface,
    fontWeight: '900',
    marginTop: theme.spacing.sm,
  },
});

