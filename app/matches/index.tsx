import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { Match, Sport } from '../../types';
import { matchesService } from '../../services/matches';
import { Ionicons } from '@expo/vector-icons';
import { usePagination } from '../../hooks/usePagination';
import { Cursor } from '../../utils/cursor';
import { useAuth } from '../../contexts/AuthContext';

export default function MatchesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  const { items: matches, loading, error, hasMore, loadMore, refresh } = usePagination({
    fetchPage: async (cursor: Cursor, limit: number) => {
      if (!user) {
        throw new Error('User not authenticated');
      }
      const result = await matchesService.getMatchesPaginated(
        user.id,
        limit,
        cursor,
        selectedSport || undefined,
        selectedTeam || undefined
      );
      return {
        data: result.data,
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      };
    },
    limit: 20,
  });

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadMore();
    }
  };

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };

  const getSportColor = (sport: Sport) => {
    return theme.sports[sport] || theme.colors.primary;
  };

  const getSportIcon = (sport: Sport) => {
    const icons: Record<Sport, string> = {
      football: 'football',
      basketball: 'basketball',
      tennis: 'tennisball',
      padel: 'trophy',
    };
    return icons[sport] || 'ellipse';
  };

  const getResultBadgeColor = (result: 'win' | 'loss' | 'draw') => {
    switch (result) {
      case 'win':
        return theme.colors.success;
      case 'loss':
        return theme.colors.error;
      case 'draw':
        return theme.colors.warning;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getResultText = (result: 'win' | 'loss' | 'draw') => {
    switch (result) {
      case 'win':
        return 'Win';
      case 'loss':
        return 'Loss';
      case 'draw':
        return 'Draw';
      default:
        return '';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderMatch = ({ item }: { item: Match }) => (
    <TouchableOpacity style={styles.matchCard}>
      <View style={styles.matchHeader}>
        <View style={[styles.sportBadge, { backgroundColor: getSportColor(item.sport) }]}>
          <Ionicons name={getSportIcon(item.sport) as any} size={24} color={theme.colors.surface} />
        </View>
        <View style={styles.matchInfo}>
          <Text style={styles.matchDate}>{formatDate(item.matchDate)}</Text>
          {item.venue && (
            <View style={styles.venueInfo}>
              <Ionicons name="location" size={12} color={theme.colors.textSecondary} />
              <Text style={styles.venueText}>{item.venue}</Text>
            </View>
          )}
        </View>
        <View style={[styles.resultBadge, { backgroundColor: getResultBadgeColor(item.result) }]}>
          <Text style={styles.resultText}>{getResultText(item.result)}</Text>
        </View>
      </View>

      <View style={styles.scoreContainer}>
        <View style={styles.scoreSection}>
          <Text style={styles.scoreLabel}>
            {item.teamName || item.playerNames?.join(', ') || 'You'}
          </Text>
          <Text style={styles.scoreValue}>{item.userScore}</Text>
        </View>
        <Text style={styles.vsText}>vs</Text>
        <View style={styles.scoreSection}>
          <Text style={styles.scoreLabel}>
            {item.opponentTeamName || item.opponentNames?.join(', ') || 'Opponent'}
          </Text>
          <Text style={styles.scoreValue}>{item.opponentScore}</Text>
        </View>
      </View>

      {item.notes && (
        <Text style={styles.matchNotes} numberOfLines={2}>
          {item.notes}
        </Text>
      )}
    </TouchableOpacity>
  );

  const sports: Sport[] = ['football', 'basketball', 'tennis', 'padel'];

  return (
    <View style={styles.container}>
      {/* Filter Section */}
      <View style={styles.filterSection}>
        <View style={styles.sportFilters}>
          <TouchableOpacity
            style={[styles.filterChip, !selectedSport && styles.filterChipActive]}
            onPress={() => setSelectedSport(null)}
          >
            <Text style={[styles.filterChipText, !selectedSport && styles.filterChipTextActive]}>
              All Sports
            </Text>
          </TouchableOpacity>
          {sports.map((sport) => (
            <TouchableOpacity
              key={sport}
              style={[
                styles.filterChip,
                selectedSport === sport && styles.filterChipActive,
                selectedSport === sport && { backgroundColor: getSportColor(sport) },
              ]}
              onPress={() => setSelectedSport(selectedSport === sport ? null : sport)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedSport === sport && styles.filterChipTextActive,
                ]}
              >
                {sport.charAt(0).toUpperCase() + sport.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={matches}
        renderItem={renderMatch}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="trophy-outline" size={64} color={theme.colors.textSecondary} />
              <Text style={styles.emptyText}>No past matches yet</Text>
              <Text style={styles.emptySubtext}>
                Your match history will appear here once you start playing
              </Text>
            </View>
          ) : null
        }
        ListErrorComponent={
          error ? (
            <View style={styles.errorState}>
              <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={refresh}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  filterSection: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sportFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  filterChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    ...theme.typography.caption,
    color: theme.colors.text,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: theme.colors.surface,
    fontWeight: '600',
  },
  listContent: {
    padding: theme.spacing.lg,
  },
  matchCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sportBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  matchInfo: {
    flex: 1,
  },
  matchDate: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  venueInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  venueText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  resultBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  resultText: {
    ...theme.typography.caption,
    color: theme.colors.surface,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  scoreSection: {
    alignItems: 'center',
    flex: 1,
  },
  scoreLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  scoreValue: {
    ...theme.typography.h1,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  vsText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginHorizontal: theme.spacing.md,
  },
  matchNotes: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    padding: theme.spacing.xxl,
    marginTop: theme.spacing.xxl,
  },
  emptyText: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  emptySubtext: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  errorState: {
    alignItems: 'center',
    padding: theme.spacing.xxl,
    marginTop: theme.spacing.xxl,
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.error,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
  },
  retryButtonText: {
    ...theme.typography.body,
    color: theme.colors.surface,
    fontWeight: '600',
  },
  footerLoader: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
});

