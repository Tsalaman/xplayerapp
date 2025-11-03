import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../constants/theme';
import { TeamWithMembers, TeamMember } from '../../types';
import { teamService } from '../../services/teams';
import { Ionicons } from '@expo/vector-icons';
import { generateInviteLink } from '../../utils/qrCode';
import QRCode from 'react-native-qrcode-svg';

export default function ManageTeamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [team, setTeam] = useState<TeamWithMembers | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showMemberMenu, setShowMemberMenu] = useState(false);

  useEffect(() => {
    loadTeam();
  }, [id]);

  const loadTeam = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const teamData = await teamService.getTeam(id);
      setTeam(teamData);
    } catch (error: any) {
      console.error('Error loading team:', error);
      Alert.alert('Error', error.message || 'Failed to load team');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const openMemberMenu = (member: TeamMember) => {
    setSelectedMember(member);
    setShowMemberMenu(true);
  };

  const closeMemberMenu = () => {
    setSelectedMember(null);
    setShowMemberMenu(false);
  };

  const handleRemoveMember = () => {
    if (!id || !selectedMember) return;

    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${selectedMember.userNickname} from the team?`,
      [
        { text: 'Cancel', style: 'cancel', onPress: closeMemberMenu },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await teamService.removeMember(id, selectedMember.id);
              closeMemberMenu();
              await loadTeam();
              Alert.alert('Success', 'Member removed');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove member');
            }
          },
        },
      ]
    );
  };

  const handlePromoteToCaptain = () => {
    if (!id || !selectedMember) return;

    Alert.alert(
      'Promote to Captain',
      `Promote ${selectedMember.userNickname} to captain?`,
      [
        { text: 'Cancel', style: 'cancel', onPress: closeMemberMenu },
        {
          text: 'Promote',
          onPress: async () => {
            try {
              await teamService.updateMemberRole(id, selectedMember.id, 'captain');
              closeMemberMenu();
              await loadTeam();
              Alert.alert('Success', 'Member promoted to captain');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to promote member');
            }
          },
        },
      ]
    );
  };

  const handleDemoteToPlayer = () => {
    if (!id || !selectedMember) return;

    Alert.alert(
      'Demote to Player',
      `Demote ${selectedMember.userNickname} to player?`,
      [
        { text: 'Cancel', style: 'cancel', onPress: closeMemberMenu },
        {
          text: 'Demote',
          onPress: async () => {
            try {
              await teamService.updateMemberRole(id, selectedMember.id, 'player');
              closeMemberMenu();
              await loadTeam();
              Alert.alert('Success', 'Member demoted to player');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to demote member');
            }
          },
        },
      ]
    );
  };

  const handleTransferOwnership = () => {
    if (!id || !selectedMember) return;

    Alert.alert(
      'Transfer Ownership',
      `Transfer team ownership to ${selectedMember.userNickname}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel', onPress: closeMemberMenu },
        {
          text: 'Transfer',
          style: 'destructive',
          onPress: async () => {
            try {
              await teamService.transferOwnership(id, selectedMember.id);
              closeMemberMenu();
              await loadTeam();
              Alert.alert('Success', 'Ownership transferred', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to transfer ownership');
            }
          },
        },
      ]
    );
  };

  const handleCreateInvite = async () => {
    if (!team || !user) return;

    try {
      // Create invite with default 7-day expiration and one-time use
      const invite = await teamService.createTeamInvite(team.id, {
        // Default: expires in 7 days, max uses = 1
      });

      const inviteLink = generateInviteLink(invite.inviteToken);
      
      Alert.alert(
        'Invite Created',
        `Invite created successfully!\n\nThis invite expires in 7 days and can be used once.\n\nShare this link with others: ${inviteLink}`,
        [
          { text: 'OK', style: 'cancel' },
          {
            text: 'Share Link',
            onPress: () => handleShareInviteToken(invite.inviteToken),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create invite');
    }
  };

  const handleShareInviteToken = async (inviteToken: string) => {
    if (!team) return;
    const inviteLink = generateInviteLink(inviteToken);
    try {
      await Share.share({
        message: `You've been invited to join "${team.name}" on SportsMatch!\n\nClick here to join: ${inviteLink}\n\nOr open the app and paste this invite code: ${inviteToken}`,
        title: `Invite to ${team.name}`,
      });
    } catch (error: any) {
      console.error('Error sharing:', error);
    }
  };

  const handleShareInvite = async () => {
    if (!team?.inviteCode) return;

    const inviteLink = generateInviteLink(team.inviteCode);
    try {
      await Share.share({
        message: `Join my team "${team.name}" on SportsMatch!\n\nInvite code: ${team.inviteCode}\n\nOr click: ${inviteLink}`,
        title: `Join ${team.name}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleDeleteTeam = () => {
    if (!id || !user) return;

    Alert.alert(
      'Delete Team',
      'Are you sure you want to delete this team? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await teamService.deleteTeam(id, user.id);
              Alert.alert('Success', 'Team deleted', [
                { text: 'OK', onPress: () => router.replace('/(tabs)/profile') },
              ]);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete team');
            }
          },
        },
      ]
    );
  };

  const getSportColor = (sport: string) => {
    return theme.sports[sport as keyof typeof theme.sports] || theme.colors.primary;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return theme.colors.primary;
      case 'captain':
        return theme.colors.secondary;
      default:
        return theme.colors.textSecondary;
    }
  };

  const currentMember = team?.members.find(m => m.userId === user?.id);
  const isOwner = currentMember?.role === 'owner';
  const isCaptain = currentMember?.role === 'owner' || currentMember?.role === 'captain';

  // Sort members by role: OWNER, CAPTAINS, PLAYERS
  const sortedMembers = team?.members ? [...team.members].sort((a, b) => {
    const roleOrder: Record<string, number> = { owner: 0, captain: 1, player: 2 };
    return roleOrder[a.role] - roleOrder[b.role];
  }) : [];

  // Check if user can manage a specific member
  const canManageMember = (member: TeamMember): boolean => {
    if (!isCaptain) return false;
    if (member.role === 'owner') return false; // Cannot manage owner
    if (member.userId === user?.id) return false; // Cannot manage yourself
    if (isOwner) return true; // Owner can manage anyone (except owner)
    // Captain can only manage players
    if (isCaptain && member.role === 'player') return true;
    return false;
  };

  // Check if user can promote/demote a specific member
  const canPromoteDemote = (member: TeamMember): boolean => {
    if (!isOwner) return false; // Only owner can promote/demote
    if (member.role === 'owner') return false; // Cannot change owner
    if (member.userId === user?.id) return false; // Cannot change yourself
    return true;
  };

  // Check if user can remove a specific member
  const canRemoveMember = (member: TeamMember): boolean => {
    if (!isCaptain) return false;
    if (member.role === 'owner') return false; // Cannot remove owner
    if (member.userId === user?.id) return false; // Cannot remove yourself
    if (isOwner) return true; // Owner can remove anyone (except owner)
    // Captain can only remove players
    if (isCaptain && member.role === 'player') return true;
    return false;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!team) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Team not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{team.name}</Text>
      </View>

      {/* Team Info */}
      <View style={styles.section}>
        <View style={styles.teamHeader}>
          <View style={[styles.sportBadge, { backgroundColor: getSportColor(team.sport) }]}>
            <Text style={styles.sportBadgeText}>
              {team.sport.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.teamInfo}>
            <Text style={styles.teamName}>{team.name}</Text>
            <Text style={styles.teamMeta}>
              {team.memberCount} / {team.maxPlayers} players
            </Text>
          </View>
          <View style={[styles.publicBadge, !team.isPublic && styles.privateBadge]}>
            <Ionicons
              name={team.isPublic ? 'globe' : 'lock-closed'}
              size={16}
              color={theme.colors.surface}
            />
            <Text style={styles.publicBadgeText}>
              {team.isPublic ? 'Public' : 'Private'}
            </Text>
          </View>
        </View>

        {team.description && (
          <Text style={styles.description}>{team.description}</Text>
        )}
        {team.location && (
          <View style={styles.metaRow}>
            <Ionicons name="location" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.metaText}>{team.location}</Text>
          </View>
        )}
      </View>

      {/* Invite Section */}
      {!team.isPublic && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invite Players</Text>
          
          {/* Team Invite Code (for backward compatibility) */}
          {team.inviteCode && (
            <>
              <Text style={styles.label}>Team Invite Code:</Text>
              <Text style={styles.inviteCode}>{team.inviteCode}</Text>
            </>
          )}

          {/* Create New Invite Token Button */}
          {isCaptain && (
            <TouchableOpacity
              style={[styles.inviteButton, styles.createInviteButton]}
              onPress={handleCreateInvite}
            >
              <Ionicons name="add-circle" size={20} color={theme.colors.surface} />
              <Text style={styles.inviteButtonText}>Create New Invite</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.inviteButtons}>
            {team.inviteCode && (
              <>
                <TouchableOpacity
                  style={[styles.inviteButton, styles.qrButton]}
                  onPress={() => setShowQR(!showQR)}
                >
                  <Ionicons name="qr-code" size={20} color={theme.colors.surface} />
                  <Text style={styles.inviteButtonText}>
                    {showQR ? 'Hide QR Code' : 'Show QR Code'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.inviteButton, styles.shareButton]}
                  onPress={handleShareInvite}
                >
                  <Ionicons name="share" size={20} color={theme.colors.surface} />
                  <Text style={styles.inviteButtonText}>Share Code</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {showQR && team.inviteCode && (
            <View style={styles.qrContainer}>
              <QRCode
                value={generateInviteLink(team.inviteCode)}
                size={200}
                color={theme.colors.text}
                backgroundColor={theme.colors.surface}
              />
            </View>
          )}
        </View>
      )}

      {/* Members Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Team Roster</Text>
        
        {/* Owner Section */}
        {sortedMembers.filter(m => m.role === 'owner').length > 0 && (
          <>
            <Text style={styles.roleSectionTitle}>OWNER</Text>
            {sortedMembers.filter(m => m.role === 'owner').map((member) => (
              <View key={member.id} style={styles.memberCard}>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.userNickname}</Text>
                  <View style={[styles.roleBadge, { backgroundColor: getRoleColor(member.role) }]}>
                    <Text style={styles.roleText}>
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </Text>
                  </View>
                </View>
                {isOwner && member.userId !== user?.id && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => openMemberMenu(member)}
                  >
                    <Ionicons name="ellipsis-vertical" size={20} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </>
        )}

        {/* Captains Section */}
        {sortedMembers.filter(m => m.role === 'captain').length > 0 && (
          <>
            <Text style={styles.roleSectionTitle}>CAPTAINS</Text>
            {sortedMembers.filter(m => m.role === 'captain').map((member) => (
              <View key={member.id} style={styles.memberCard}>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.userNickname}</Text>
                  <View style={[styles.roleBadge, { backgroundColor: getRoleColor(member.role) }]}>
                    <Text style={styles.roleText}>
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </Text>
                  </View>
                </View>
                {canManageMember(member) && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => openMemberMenu(member)}
                  >
                    <Ionicons name="ellipsis-vertical" size={20} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </>
        )}

        {/* Players Section */}
        {sortedMembers.filter(m => m.role === 'player').length > 0 && (
          <>
            <Text style={styles.roleSectionTitle}>PLAYERS</Text>
            {sortedMembers.filter(m => m.role === 'player').map((member) => (
              <View key={member.id} style={styles.memberCard}>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.userNickname}</Text>
                  <View style={[styles.roleBadge, { backgroundColor: getRoleColor(member.role) }]}>
                    <Text style={styles.roleText}>
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </Text>
                  </View>
                </View>
                {canManageMember(member) && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => openMemberMenu(member)}
                  >
                    <Ionicons name="ellipsis-vertical" size={20} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </>
        )}

        {team.memberCount < team.maxPlayers && !team.isPublic && (
          <Text style={styles.inviteHint}>
            Share the invite code or QR code to add more players
          </Text>
        )}
      </View>

      {/* Owner Actions */}
      {isOwner && (
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.actionButtonLarge, styles.deleteButton]}
            onPress={handleDeleteTeam}
          >
            <Ionicons name="trash" size={20} color={theme.colors.error} />
            <Text style={styles.deleteButtonText}>Delete Team</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Member Options Menu */}
      <Modal
        visible={showMemberMenu}
        transparent={true}
        animationType="slide"
        onRequestClose={closeMemberMenu}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeMemberMenu}
        >
          <View style={styles.memberMenu}>
            {selectedMember && (
              <>
                <Text style={styles.memberMenuTitle}>{selectedMember.userNickname}</Text>
                <Text style={styles.memberMenuRole}>
                  {selectedMember.role.charAt(0).toUpperCase() + selectedMember.role.slice(1)}
                </Text>
                
                {/* Owner actions */}
                {canPromoteDemote(selectedMember) && (
                  <>
                    {selectedMember.role === 'player' && (
                      <TouchableOpacity
                        style={styles.menuItem}
                        onPress={handlePromoteToCaptain}
                      >
                        <Ionicons name="star" size={20} color={theme.colors.primary} />
                        <Text style={styles.menuItemText}>Promote to Captain</Text>
                      </TouchableOpacity>
                    )}
                    {selectedMember.role === 'captain' && (
                      <TouchableOpacity
                        style={styles.menuItem}
                        onPress={handleDemoteToPlayer}
                      >
                        <Ionicons name="star-outline" size={20} color={theme.colors.primary} />
                        <Text style={styles.menuItemText}>Demote to Player</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
                {/* Transfer ownership (owner only, on non-owner members) */}
                {isOwner && selectedMember.role !== 'owner' && selectedMember.userId !== user?.id && (
                  <TouchableOpacity
                    style={[styles.menuItem, styles.transferOwnershipItem]}
                    onPress={handleTransferOwnership}
                  >
                    <Ionicons name="hand-left" size={20} color={theme.colors.secondary} />
                    <Text style={[styles.menuItemText, styles.transferOwnershipText]}>Transfer Ownership</Text>
                  </TouchableOpacity>
                )}
                {canRemoveMember(selectedMember) && (
                  <TouchableOpacity
                    style={[styles.menuItem, styles.removeItem]}
                    onPress={handleRemoveMember}
                  >
                    <Ionicons name="person-remove" size={20} color={theme.colors.error} />
                    <Text style={[styles.menuItemText, styles.removeText]}>Remove from Team</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.menuItem, styles.cancelItem]}
                  onPress={closeMemberMenu}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
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
    backgroundColor: theme.colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.error,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  backButton: {
    marginRight: theme.spacing.md,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.primary,
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sportBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  sportBadgeText: {
    ...theme.typography.h2,
    color: theme.colors.surface,
    fontWeight: 'bold',
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  teamMeta: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  publicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.xs,
  },
  privateBadge: {
    backgroundColor: theme.colors.textSecondary,
  },
  publicBadgeText: {
    ...theme.typography.caption,
    color: theme.colors.surface,
    fontWeight: '600',
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  metaText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  label: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    fontWeight: '600',
  },
  inviteCode: {
    ...theme.typography.h2,
    color: theme.colors.primary,
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: theme.spacing.md,
    fontFamily: 'monospace',
  },
  inviteButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  createInviteButton: {
    backgroundColor: theme.colors.secondary,
    marginBottom: theme.spacing.md,
  },
  inviteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  qrButton: {
    backgroundColor: theme.colors.primary,
  },
  shareButton: {
    backgroundColor: theme.colors.secondary,
  },
  inviteButtonText: {
    ...theme.typography.body,
    color: theme.colors.surface,
    fontWeight: '600',
  },
  qrContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
  },
  memberCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  memberName: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
  },
  roleBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  roleText: {
    ...theme.typography.caption,
    color: theme.colors.surface,
    fontWeight: '600',
  },
  memberActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    padding: theme.spacing.xs,
  },
  inviteHint: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  actionButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  deleteButton: {
    backgroundColor: theme.colors.error + '20',
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  deleteButtonText: {
    ...theme.typography.body,
    color: theme.colors.error,
    fontWeight: '600',
  },
  roleSectionTitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontWeight: '700',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    fontSize: 12,
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  memberMenu: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  memberMenuTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  memberMenuRole: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  menuItemText: {
    ...theme.typography.body,
    color: theme.colors.text,
    flex: 1,
  },
  transferOwnershipItem: {
    backgroundColor: theme.colors.secondary + '20',
    borderWidth: 1,
    borderColor: theme.colors.secondary,
  },
  transferOwnershipText: {
    color: theme.colors.secondary,
    fontWeight: '600',
  },
  removeItem: {
    backgroundColor: theme.colors.error + '20',
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  removeText: {
    color: theme.colors.error,
    fontWeight: '600',
  },
  cancelItem: {
    backgroundColor: 'transparent',
    marginTop: theme.spacing.sm,
  },
  cancelText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

