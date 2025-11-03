import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { Tournament } from '../../types';
import { tournamentService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function TournamentsScreen() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      const tournamentsData = await tournamentService.getTournaments(true);
      setTournaments(tournamentsData); // Already sorted by newest first
    } catch (error) {
      console.error('Error loading tournaments:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTournaments();
    setRefreshing(false);
  };

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

  const renderTournament = ({ item }: { item: Tournament }) => (
    <TouchableOpacity
      style={styles.tournamentCard}
      onPress={() => router.push(`/tournament/details?id=${item.id}`)}
    >
      <View style={styles.tournamentHeader}>
        <View style={[styles.sportBadge, { backgroundColor: getSportColor(item.sport) }]}>
          <Ionicons name={getSportIcon(item.sport) as any} size={24} color={theme.colors.surface} />
        </View>
        <View style={styles.tournamentInfo}>
          <Text style={styles.tournamentTitle}>{item.title}</Text>
          <Text style={styles.tournamentSport}>{item.sport.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.tournamentDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.tournamentDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.detailText}>{item.location}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.detailText}>
            {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
          </Text>
        </View>
        {item.entryFee && (
          <View style={styles.detailRow}>
            <Ionicons name="cash" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.detailText}>Entry: ${item.entryFee}</Text>
          </View>
        )}
        {item.prize && (
          <View style={styles.detailRow}>
            <Ionicons name="trophy" size={16} color={theme.colors.accent} />
            <Text style={[styles.detailText, styles.prizeText]}>Prize: {item.prize}</Text>
          </View>
        )}
      </View>

      <View style={styles.tournamentFooter}>
        <Text style={styles.registrationDeadline}>
          Registration deadline: {new Date(item.registrationDeadline).toLocaleDateString()}
        </Text>
        <View style={styles.activeBadge}>
          <Text style={styles.activeBadgeText}>Active</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={tournaments}
        renderItem={renderTournament}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>No active tournaments</Text>
            <Text style={styles.emptySubtext}>Check back soon for upcoming events!</Text>
          </View>
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
  listContent: {
    padding: theme.spacing.lg,
  },
  tournamentCard: {
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
  tournamentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sportBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tournamentInfo: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  tournamentTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  tournamentSport: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 1,
  },
  tournamentDescription: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  tournamentDetails: {
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  detailText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  prizeText: {
    color: theme.colors.accent,
    fontWeight: '600',
  },
  tournamentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  registrationDeadline: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  activeBadge: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  activeBadgeText: {
    ...theme.typography.caption,
    color: theme.colors.surface,
    fontWeight: '600',
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
});

