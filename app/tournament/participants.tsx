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
import { TournamentParticipant } from '../../types';
import { tournamentParticipationService } from '../../services/tournamentParticipation';
import { Ionicons } from '@expo/vector-icons';

export default function TournamentParticipantsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [participants, setParticipants] = useState<TournamentParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadParticipants();
  }, [id]);

  const loadParticipants = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await tournamentParticipationService.getParticipants(id);
      setParticipants(data);
    } catch (error) {
      console.error('Error loading participants:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadParticipants();
    setRefreshing(false);
  };

  const renderParticipant = ({ item }: { item: TournamentParticipant }) => (
    <View style={styles.participantCard}>
      <View style={styles.participantInfo}>
        <View style={styles.participantIcon}>
          <Ionicons
            name={item.participantType === 'team' ? 'people' : 'person'}
            size={24}
            color={theme.colors.primary}
          />
        </View>
        <View style={styles.participantDetails}>
          <Text style={styles.participantName}>{item.participantName}</Text>
          <Text style={styles.participantType}>
            {item.participantType === 'team' ? 'Team' : 'Individual'}
          </Text>
        </View>
      </View>
      <View style={styles.statusBadge}>
        {item.confirmed ? (
          <View style={[styles.badge, styles.confirmedBadge]}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
            <Text style={styles.badgeText}>Confirmed</Text>
          </View>
        ) : (
          <View style={[styles.badge, styles.pendingBadge]}>
            <Ionicons name="time" size={16} color={theme.colors.warning} />
            <Text style={styles.badgeText}>Pending</Text>
          </View>
        )}
        {item.paymentStatus === 'paid' && (
          <View style={[styles.badge, styles.paidBadge]}>
            <Ionicons name="card" size={16} color={theme.colors.success} />
            <Text style={styles.badgeText}>Paid</Text>
          </View>
        )}
      </View>
    </View>
  );

  const confirmedCount = participants.filter(p => p.confirmed).length;
  const pendingCount = participants.filter(p => !p.confirmed).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Participants</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{participants.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: theme.colors.success }]}>
            {confirmedCount}
          </Text>
          <Text style={styles.statLabel}>Confirmed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: theme.colors.warning }]}>
            {pendingCount}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={participants}
          renderItem={renderParticipant}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color={theme.colors.textSecondary} />
              <Text style={styles.emptyText}>No participants yet</Text>
            </View>
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
  },
  statsContainer: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  statNumber: {
    ...theme.typography.h1,
    color: theme.colors.primary,
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: theme.spacing.lg,
  },
  participantCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  participantIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  participantDetails: {
    flex: 1,
  },
  participantName: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  participantType: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.xs,
  },
  confirmedBadge: {
    backgroundColor: theme.colors.success + '20',
  },
  pendingBadge: {
    backgroundColor: theme.colors.warning + '20',
  },
  paidBadge: {
    backgroundColor: theme.colors.success + '20',
  },
  badgeText: {
    ...theme.typography.caption,
    color: theme.colors.text,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: theme.spacing.xxl,
    marginTop: theme.spacing.xxl,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
});

