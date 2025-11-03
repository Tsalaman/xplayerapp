import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../constants/theme';
import { Tournament, TournamentParticipant } from '../../types';
import { tournamentService } from '../../services/api';
import { tournamentParticipationService } from '../../services/tournamentParticipation';
import { Ionicons } from '@expo/vector-icons';

export default function TournamentDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participant, setParticipant] = useState<TournamentParticipant | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadTournament();
  }, [id]);

  const loadTournament = async () => {
    if (!id || typeof id !== 'string') return;
    
    setLoading(true);
    try {
      const [tournamentData, participantsData] = await Promise.all([
        tournamentService.getTournament(id),
        tournamentParticipationService.getParticipants(id),
      ]);
      
      setTournament(tournamentData);
      
      // Check if user is already registered
      if (user && tournamentData) {
        const userParticipant = participantsData.find(
          p => p.participantType === 'user' && p.userId === user.id
        );
        setParticipant(userParticipant || null);
      }
    } catch (error) {
      console.error('Error loading tournament:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to register');
      return;
    }
    if (!tournament) return;

    const isPastDeadline = new Date(tournament.registrationDeadline) < new Date();
    if (isPastDeadline) {
      Alert.alert('Error', 'Registration deadline has passed');
      return;
    }

    setRegistering(true);
    try {
      const registration = await tournamentParticipationService.registerUser(
        tournament.id,
        user.id,
        user.nickname || 'Anonymous'
      );

      if (registration.paymentStatus === 'pending' && tournament.entryFee && tournament.entryFee > 0) {
        // Show payment screen
        Alert.alert(
          'Payment Required',
          `Entry fee: $${tournament.entryFee}\n\nProceed to payment?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Pay Now',
              onPress: () => handlePayment(registration.id),
            },
          ]
        );
      } else {
        Alert.alert('Success', 'Registration confirmed!');
        await loadTournament();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to register');
    } finally {
      setRegistering(false);
    }
  };

  const handlePayment = async (participantId: string) => {
    if (!tournament) return;

    // Simulate payment (in production, integrate with payment gateway)
    Alert.alert(
      'Payment',
      'Payment processing...\n\n(Simulated payment - in production, this would integrate with Stripe/PayPal/etc.)',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Payment',
          onPress: async () => {
            try {
              // In production, this would be called after successful payment
              await tournamentParticipationService.confirmPayment(
                participantId,
                'card', // or 'paypal', 'app_store', etc.
                `tx_${Date.now()}` // Mock transaction ID
              );
              Alert.alert('Success', 'Payment confirmed! You are now registered.');
              await loadTournament();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Payment confirmation failed');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  if (!tournament) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Tournament not found</Text>
        </View>
      </View>
    );
  }

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.tournamentHeader}>
        <View style={[styles.sportBadge, { backgroundColor: getSportColor(tournament.sport) }]}>
          <Ionicons name={getSportIcon(tournament.sport) as any} size={48} color={theme.colors.surface} />
        </View>
        <View style={styles.tournamentInfo}>
          <Text style={styles.tournamentTitle}>{tournament.title}</Text>
          <Text style={styles.tournamentSport}>{tournament.sport.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{tournament.description}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Tournament Details</Text>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={24} color={theme.colors.primary} />
          <Text style={styles.detailText}>{tournament.location}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={24} color={theme.colors.primary} />
          <Text style={styles.detailText}>
            {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
          </Text>
        </View>
        {tournament.maxParticipants && (
          <View style={styles.detailRow}>
            <Ionicons name="people" size={24} color={theme.colors.primary} />
            <Text style={styles.detailText}>Max Participants: {tournament.maxParticipants}</Text>
          </View>
        )}
        {tournament.entryFee && (
          <View style={styles.detailRow}>
            <Ionicons name="cash" size={24} color={theme.colors.primary} />
            <Text style={styles.detailText}>Entry Fee: ${tournament.entryFee}</Text>
          </View>
        )}
        {tournament.prize && (
          <View style={styles.detailRow}>
            <Ionicons name="trophy" size={24} color={theme.colors.accent} />
            <Text style={[styles.detailText, styles.prizeText]}>Prize: {tournament.prize}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Ionicons name="time" size={24} color={theme.colors.warning} />
          <Text style={styles.detailText}>
            Registration Deadline: {new Date(tournament.registrationDeadline).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Participants Count */}
      <View style={styles.card}>
        <View style={styles.participantsHeader}>
          <Ionicons name="people" size={24} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Participants</Text>
        </View>
        <TouchableOpacity
          style={styles.viewParticipantsButton}
          onPress={() => router.push(`/tournament/participants?id=${tournament.id}`)}
        >
          <Text style={styles.participantsText}>
            View all participants
          </Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.viewResultsButton}
          onPress={() => router.push(`/tournament/results?id=${tournament.id}`)}
        >
          <Ionicons name="trophy" size={20} color={theme.colors.accent} />
          <Text style={styles.resultsText}>View Results</Text>
        </TouchableOpacity>
      </View>

      {/* Registration Button */}
      {participant ? (
        <View style={styles.card}>
          <View style={styles.registrationStatus}>
            <Ionicons 
              name={participant.confirmed ? "checkmark-circle" : "time"} 
              size={32} 
              color={participant.confirmed ? theme.colors.success : theme.colors.warning} 
            />
            <View style={styles.registrationInfo}>
              <Text style={styles.registrationStatusText}>
                {participant.confirmed ? 'Registered & Confirmed' : 'Registration Pending Payment'}
              </Text>
              {participant.paymentStatus === 'pending' && tournament.entryFee && tournament.entryFee > 0 && (
                <Text style={styles.paymentHint}>
                  Payment required: ${tournament.entryFee}
                </Text>
              )}
            </View>
          </View>
          {participant.paymentStatus === 'pending' && tournament.entryFee && tournament.entryFee > 0 && (
            <TouchableOpacity
              style={styles.payButton}
              onPress={() => handlePayment(participant.id)}
            >
              <Ionicons name="card" size={20} color={theme.colors.surface} />
              <Text style={styles.payButtonText}>Complete Payment</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.registerButton, registering && styles.registerButtonDisabled]}
          onPress={handleRegister}
          disabled={registering || !tournament.isActive}
        >
          {registering ? (
            <ActivityIndicator size="small" color={theme.colors.surface} />
          ) : (
            <>
              <Ionicons name="person-add" size={20} color={theme.colors.surface} />
              <Text style={styles.registerButtonText}>
                {tournament.entryFee && tournament.entryFee > 0
                  ? `Register & Pay $${tournament.entryFee}`
                  : 'Register for Tournament'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {!tournament.isActive && (
        <View style={styles.inactiveBadge}>
          <Text style={styles.inactiveText}>Tournament is no longer active</Text>
        </View>
      )}
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
    marginBottom: theme.spacing.md,
  },
  tournamentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  sportBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tournamentInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  tournamentTitle: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  tournamentSport: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  detailText: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  prizeText: {
    color: theme.colors.accent,
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  registerButtonText: {
    ...theme.typography.h3,
    color: theme.colors.surface,
    marginLeft: theme.spacing.sm,
  },
  inactiveBadge: {
    backgroundColor: theme.colors.error + '20',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
    alignItems: 'center',
  },
  inactiveText: {
    ...theme.typography.body,
    color: theme.colors.error,
    fontWeight: '600',
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    ...theme.typography.h3,
    color: theme.colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  viewParticipantsButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  participantsText: {
    ...theme.typography.body,
    color: theme.colors.primary,
  },
  registrationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  registrationInfo: {
    flex: 1,
  },
  registrationStatusText: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  paymentHint: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  payButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  payButtonText: {
    ...theme.typography.body,
    color: theme.colors.surface,
    fontWeight: '600',
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  viewResultsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  resultsText: {
    ...theme.typography.body,
    color: theme.colors.accent,
    fontWeight: '600',
  },
});

