import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../contexts/AuthContext';
import { theme } from '../../../constants/theme';
import { teamService } from '../../../services/teams';
import { Team } from '../../../types';
import { Ionicons } from '@expo/vector-icons';

interface InviteInfo {
  team: Team;
  invite: {
    id: string;
    expiresAt?: string;
    maxUses: number;
    usesCount: number;
    invitedUserId?: string;
  };
}

export default function InviteAcceptanceScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (token) {
      loadInviteInfo();
    }
  }, [token]);

  const loadInviteInfo = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const info = await teamService.getInviteInfo(token);
      setInviteInfo(info);
      
      // Check if user is already a member
      if (user) {
        const team = await teamService.getTeam(info.team.id);
        if (team?.members.some(m => m.userId === user.id)) {
          setJoined(true);
        }
      }
      
      // Check if invite is expired
      if (info.invite.expiresAt && new Date(info.invite.expiresAt) < new Date()) {
        Alert.alert('Invite Expired', 'This invite has expired. Please request a new invite.');
      }
      
      // Check if invite has reached max uses
      if (info.invite.usesCount >= info.invite.maxUses) {
        Alert.alert('Invite Used', 'This invite has already been used. Please request a new invite.');
      }
      
      // Check if invite is for specific user
      if (info.invite.invitedUserId && user && info.invite.invitedUserId !== user.id) {
        Alert.alert('Invalid Invite', 'This invite is for a different user.');
      }
    } catch (error: any) {
      console.error('Error loading invite info:', error);
      Alert.alert('Error', error.message || 'Failed to load invite information', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async () => {
    if (!token || !user || !inviteInfo) return;

    setJoining(true);
    try {
      // Use RPC join_team with invite token
      await teamService.joinTeam(token);
      
      setJoined(true);
      
      Alert.alert(
        'Success!',
        `You joined ${inviteInfo.team.name}!`,
        [
          {
            text: 'OK',
            onPress: () => router.replace(`/team/manage?id=${inviteInfo.team.id}`),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error joining team:', error);
      Alert.alert('Error', error.message || 'Failed to join team');
    } finally {
      setJoining(false);
    }
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

  const isInviteValid = () => {
    if (!inviteInfo) return false;
    
    // Check expiration
    if (inviteInfo.invite.expiresAt && new Date(inviteInfo.invite.expiresAt) < new Date()) {
      return false;
    }
    
    // Check max uses
    if (inviteInfo.invite.usesCount >= inviteInfo.invite.maxUses) {
      return false;
    }
    
    // Check if invite is for specific user
    if (inviteInfo.invite.invitedUserId && user && inviteInfo.invite.invitedUserId !== user.id) {
      return false;
    }
    
    return true;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading invite...</Text>
        </View>
      </View>
    );
  }

  if (!inviteInfo) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={theme.colors.error} />
          <Text style={styles.errorText}>Invite not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isValid = isInviteValid();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButtonIcon}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Team Invitation</Text>
      </View>

      <View style={styles.inviteCard}>
        <View style={styles.iconContainer}>
          <View style={[styles.sportBadge, { backgroundColor: getSportColor(inviteInfo.team.sport) }]}>
            <Ionicons
              name={getSportIcon(inviteInfo.team.sport) as any}
              size={48}
              color={theme.colors.surface}
            />
          </View>
        </View>

        <Text style={styles.title}>You were invited to join</Text>
        <Text style={styles.teamName}>{inviteInfo.team.name}</Text>

        <View style={styles.teamDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="person" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.detailText}>Owner: {inviteInfo.team.ownerNickname}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name={getSportIcon(inviteInfo.team.sport) as any} size={16} color={theme.colors.textSecondary} />
            <Text style={styles.detailText}>Sport: {inviteInfo.team.sport.charAt(0).toUpperCase() + inviteInfo.team.sport.slice(1)}</Text>
          </View>
          {inviteInfo.team.location && (
            <View style={styles.detailRow}>
              <Ionicons name="location" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.detailText}>{inviteInfo.team.location}</Text>
            </View>
          )}
          {inviteInfo.team.description && (
            <Text style={styles.description}>{inviteInfo.team.description}</Text>
          )}
        </View>

        {inviteInfo.invite.expiresAt && (
          <View style={styles.expiryInfo}>
            <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.expiryText}>
              Expires: {new Date(inviteInfo.invite.expiresAt).toLocaleDateString()}
            </Text>
          </View>
        )}

        {!isValid && !joined && (
          <View style={styles.warningContainer}>
            <Ionicons name="warning" size={20} color={theme.colors.warning} />
            <Text style={styles.warningText}>
              {inviteInfo.invite.expiresAt && new Date(inviteInfo.invite.expiresAt) < new Date()
                ? 'This invite has expired.'
                : inviteInfo.invite.usesCount >= inviteInfo.invite.maxUses
                ? 'This invite has already been used.'
                : 'This invite is invalid.'}
            </Text>
          </View>
        )}

        {joined && (
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
            <Text style={styles.successText}>You're already a member of this team!</Text>
            <TouchableOpacity
              style={styles.viewTeamButton}
              onPress={() => router.replace(`/team/manage?id=${inviteInfo.team.id}`)}
            >
              <Text style={styles.viewTeamButtonText}>View Team</Text>
            </TouchableOpacity>
          </View>
        )}

        {!user && (
          <View style={styles.loginPrompt}>
            <Ionicons name="log-in" size={20} color={theme.colors.primary} />
            <Text style={styles.loginText}>Please log in to join this team</Text>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>
          </View>
        )}

        {user && !joined && isValid && (
          <TouchableOpacity
            style={[styles.joinButton, joining && styles.joinButtonDisabled]}
            onPress={handleJoinTeam}
            disabled={joining || !isValid}
          >
            {joining ? (
              <ActivityIndicator size="small" color={theme.colors.surface} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.surface} />
                <Text style={styles.joinButtonText}>Join Team</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  errorText: {
    ...theme.typography.h3,
    color: theme.colors.error,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  backButtonIcon: {
    marginRight: theme.spacing.md,
  },
  headerTitle: {
    ...theme.typography.h1,
    color: theme.colors.text,
  },
  inviteCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    marginBottom: theme.spacing.lg,
  },
  sportBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  teamName: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  teamDetails: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  detailText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  expiryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
  },
  expiryText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.warning + '20',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    width: '100%',
  },
  warningText: {
    ...theme.typography.body,
    color: theme.colors.warning,
    flex: 1,
  },
  successContainer: {
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
    width: '100%',
  },
  successText: {
    ...theme.typography.body,
    color: theme.colors.success,
    fontWeight: '600',
    textAlign: 'center',
  },
  viewTeamButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  viewTeamButtonText: {
    ...theme.typography.body,
    color: theme.colors.surface,
    fontWeight: '600',
  },
  loginPrompt: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    width: '100%',
  },
  loginText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
  },
  loginButtonText: {
    ...theme.typography.body,
    color: theme.colors.surface,
    fontWeight: '600',
  },
  joinButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
    minWidth: 200,
    justifyContent: 'center',
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    ...theme.typography.h3,
    color: theme.colors.surface,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
  },
  backButtonText: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

