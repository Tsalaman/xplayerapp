import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../../constants/theme';
import { Tournament, TournamentResult } from '../../types';
import { tournamentService } from '../../services/api';
import { tournamentParticipationService } from '../../services/tournamentParticipation';
import { Ionicons } from '@expo/vector-icons';

export default function TournamentResultsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [results, setResults] = useState<TournamentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [tournamentData, resultsData] = await Promise.all([
        tournamentService.getTournament(id),
        tournamentParticipationService.getTournamentResults(id),
      ]);
      setTournament(tournamentData);
      setResults(resultsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return { name: 'trophy', color: theme.colors.accent };
      case 2:
        return { name: 'medal', color: theme.colors.textSecondary };
      case 3:
        return { name: 'medal', color: theme.colors.secondary };
      default:
        return { name: 'ellipse', color: theme.colors.textSecondary };
    }
  };

  const getPositionText = (position: number) => {
    switch (position) {
      case 1:
        return '1st Place';
      case 2:
        return '2nd Place';
      case 3:
        return '3rd Place';
      default:
        return `${position}th Place`;
    }
  };

  const renderResult = ({ item }: { item: TournamentResult }) => {
    const positionIcon = getPositionIcon(item.position);
    
    return (
      <View style={styles.resultCard}>
        <View style={styles.positionContainer}>
          <Ionicons name={positionIcon.name as any} size={32} color={positionIcon.color} />
          <Text style={styles.positionNumber}>#{item.position}</Text>
        </View>
        <View style={styles.resultInfo}>
          <Text style={styles.resultTitle}>{getPositionText(item.position)}</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{item.points}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{item.wins}-{item.losses}-{item.draws}</Text>
              <Text style={styles.statLabel}>W-L-D</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{item.goalsFor}-{item.goalsAgainst}</Text>
              <Text style={styles.statLabel}>Goals</Text>
            </View>
          </View>
          {item.prize && (
            <View style={styles.prizeContainer}>
              <Ionicons name="trophy" size={16} color={theme.colors.accent} />
              <Text style={styles.prizeText}>{item.prize}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {tournament ? `Results: ${tournament.title}` : 'Tournament Results'}
        </Text>
      </View>

      {results.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="trophy-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={styles.emptyText}>Results not available yet</Text>
          <Text style={styles.emptySubtext}>
            Results will be updated after the tournament ends
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderResult}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    marginRight: theme.spacing.md,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.primary,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: theme.spacing.lg,
  },
  resultCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  positionContainer: {
    alignItems: 'center',
    marginRight: theme.spacing.md,
    width: 60,
  },
  positionNumber: {
    ...theme.typography.h3,
    color: theme.colors.text,
    fontWeight: 'bold',
    marginTop: theme.spacing.xs,
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  stat: {
    alignItems: 'flex-start',
  },
  statValue: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  prizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.accent + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
    alignSelf: 'flex-start',
  },
  prizeText: {
    ...theme.typography.body,
    color: theme.colors.accent,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xxl,
  },
  emptyText: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptySubtext: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

