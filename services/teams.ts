import { supabase } from './supabase';
import { Team, TeamMember, TeamWithMembers, Sport } from '../types';
import { Cursor, encodeCursor, decodeCursor, createTimestampCursor, getTimestampFromCursor } from '../utils/cursor';

// ==================== TEAMS ====================

export interface CreateTeamData {
  name: string;
  sport: Sport;
  maxPlayers: number;
  isPublic: boolean;
  description?: string;
  location?: string;
}

function mapTeamFromDb(dbTeam: any): Team {
  return {
    id: dbTeam.id,
    name: dbTeam.name,
    sport: dbTeam.sport,
    maxPlayers: dbTeam.max_players,
    ownerId: dbTeam.owner_id,
    ownerNickname: dbTeam.owner_nickname,
    isPublic: dbTeam.is_public,
    description: dbTeam.description || undefined,
    location: dbTeam.location || undefined,
    inviteCode: dbTeam.invite_code || undefined,
    createdAt: dbTeam.created_at,
    updatedAt: dbTeam.updated_at,
  };
}

function mapTeamMemberFromDb(dbMember: any): TeamMember {
  return {
    id: dbMember.id,
    teamId: dbMember.team_id,
    userId: dbMember.user_id,
    userNickname: dbMember.user_nickname,
    role: dbMember.role,
    joinedAt: dbMember.joined_at,
  };
}

export const teamService = {
  // Create team via RPC
  createTeam: async (teamData: CreateTeamData, userId: string, userNickname: string): Promise<Team> => {
    const { data, error } = await supabase.rpc('create_team', {
      team_name: teamData.name,
      team_sport: teamData.sport,
      team_max_players: teamData.maxPlayers,
      team_is_public: teamData.isPublic,
      team_description: teamData.description || null,
      team_location: teamData.location || null,
    });

    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Failed to create team');

    // Map RPC response to Team
    const teamData_rpc = data[0];
    return {
      id: teamData_rpc.team_id,
      name: teamData_rpc.name,
      sport: teamData_rpc.sport,
      maxPlayers: teamData_rpc.max_players,
      ownerId: teamData_rpc.owner_id,
      ownerNickname: teamData_rpc.owner_nickname,
      isPublic: teamData_rpc.is_public,
      description: teamData_rpc.description || undefined,
      location: teamData_rpc.location || undefined,
      inviteCode: teamData_rpc.invite_code || undefined,
      createdAt: teamData_rpc.created_at,
      updatedAt: teamData_rpc.created_at, // Will be updated on edit
    };
  },

  // Get team by ID with members
  getTeam: async (teamId: string): Promise<TeamWithMembers | null> => {
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();

    if (teamError) throw teamError;
    if (!teamData) return null;

    const { data: membersData, error: membersError } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)
      .order('role', { ascending: true })
      .order('joined_at', { ascending: true });

    if (membersError) throw membersError;

    const team = mapTeamFromDb(teamData);
    const members = membersData ? membersData.map(mapTeamMemberFromDb) : [];

    return {
      ...team,
      members,
      memberCount: members.length,
    };
  },

  // Get teams by user
  getUserTeams: async (userId: string): Promise<Team[]> => {
    const { data, error } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId);

    if (error) throw error;

    const teamIds = data ? data.map(t => t.team_id) : [];
    
    if (teamIds.length === 0) return [];

    const { data: teamsData, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .in('id', teamIds)
      .order('updated_at', { ascending: false });

    if (teamsError) throw teamsError;
    return teamsData ? teamsData.map(mapTeamFromDb) : [];
  },

  // Get public teams
  getPublicTeams: async (sport?: Sport): Promise<Team[]> => {
    let query = supabase
      .from('teams')
      .select('*')
      .eq('is_public', true);

    if (sport) {
      query = query.eq('sport', sport);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ? data.map(mapTeamFromDb) : [];
  },

  // Get teams feed (public teams + private teams user is member of) with cursor pagination
  getTeamsFeedPaginated: async (
    limit: number = 20,
    cursor: Cursor = null,
    sport?: Sport,
    userId?: string,
    searchQuery?: string
  ): Promise<{ data: Team[]; nextCursor: Cursor; hasMore: boolean }> => {
    // Get cursor fields if cursor exists
    let cursorCreatedAt: string | null = null;
    let cursorId: string | null = null;
    
    if (cursor) {
      const cursorData = decodeCursor(cursor);
      if (cursorData.created_at && cursorData.id) {
        cursorCreatedAt = cursorData.created_at;
        cursorId = cursorData.id;
      }
    }

    // Call RPC function for cursor pagination
    const { data, error } = await supabase.rpc('get_teams_feed_paginated', {
      user_id_filter: userId || null,
      cursor_created_at: cursorCreatedAt,
      cursor_id: cursorId,
      sport_filter: sport || null,
      search_query: searchQuery || null,
      limit_count: limit + 1, // Get one extra to check if there's more
    });

    if (error) throw error;

    const teams = data ? data.map((teamData: any) => ({
      ...mapTeamFromDb(teamData),
      memberCount: Number(teamData.member_count || 0),
      isMember: teamData.is_member || false,
    })) : [];
    
    const hasMore = teams.length > limit;
    const teamsToReturn = hasMore ? teams.slice(0, limit) : teams;

    // Generate next cursor from last item {created_at, id}
    const nextCursor = teamsToReturn.length > 0
      ? encodeCursor({
          created_at: teamsToReturn[teamsToReturn.length - 1].createdAt,
          id: teamsToReturn[teamsToReturn.length - 1].id,
        })
      : null;

    return {
      data: teamsToReturn,
      nextCursor,
      hasMore,
    };
  },

  // Get public teams with cursor pagination (backward compatibility)
  getPublicTeamsPaginated: async (
    limit: number = 20,
    cursor: Cursor = null,
    sport?: Sport
  ): Promise<{ data: Team[]; nextCursor: Cursor; hasMore: boolean }> => {
    return teamService.getTeamsFeedPaginated(limit, cursor, sport);
  },

  // Join team via RPC (by invite code/token or direct for public teams)
  joinTeam: async (inviteToken?: string, teamId?: string): Promise<TeamMember> => {
    const { data, error } = await supabase.rpc('join_team', {
      target_team_id: teamId || null,
      invite_token_param: inviteToken || null,
    });

    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Failed to join team');

    const memberData = data[0];
    return {
      id: memberData.member_id,
      teamId: memberData.team_id,
      userId: memberData.user_id,
      userNickname: memberData.user_nickname,
      role: memberData.role,
      joinedAt: memberData.joined_at,
    };
  },

  // Join team by invite code (backward compatibility)
  joinTeamByInvite: async (inviteCode: string, userId: string, userNickname: string): Promise<Team> => {
    // Use RPC join_team with invite token
    const member = await teamService.joinTeam(inviteCode);
    
    // Get team data
    const team = await teamService.getTeam(member.teamId);
    if (!team) throw new Error('Team not found after joining');
    
    // Convert TeamWithMembers to Team
    return {
      id: team.id,
      name: team.name,
      sport: team.sport,
      maxPlayers: team.maxPlayers,
      ownerId: team.ownerId,
      ownerNickname: team.ownerNickname,
      isPublic: team.isPublic,
      description: team.description,
      location: team.location,
      inviteCode: team.inviteCode,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    };
  },

  // Join public team
  joinPublicTeam: async (teamId: string, userId: string, userNickname: string): Promise<Team> => {
    // Check if team is public
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .eq('is_public', true)
      .single();

    if (teamError) throw teamError;
    if (!teamData) throw new Error('Team not found or not public');

    // Check if team is full
    const { data: membersData } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', teamId);

    const currentCount = membersData ? membersData.length : 0;
    if (currentCount >= teamData.max_players) {
      throw new Error('Team is full');
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .single();

    if (existingMember) {
      throw new Error('You are already a member of this team');
    }

    // Add user to team
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: userId,
        user_nickname: userNickname,
        role: 'player',
      });

    if (memberError) throw memberError;
    return mapTeamFromDb(teamData);
  },

  // Update team
  updateTeam: async (teamId: string, updates: Partial<CreateTeamData>, userId: string): Promise<Team> => {
    // Check if user is owner
    const { data: teamData, error: checkError } = await supabase
      .from('teams')
      .select('owner_id')
      .eq('id', teamId)
      .single();

    if (checkError) throw checkError;
    if (teamData.owner_id !== userId) {
      throw new Error('Only team owner can update the team');
    }

    const dbData: any = {};
    if (updates.name !== undefined) dbData.name = updates.name;
    if (updates.sport !== undefined) dbData.sport = updates.sport;
    if (updates.maxPlayers !== undefined) dbData.max_players = updates.maxPlayers;
    if (updates.isPublic !== undefined) dbData.is_public = updates.isPublic;
    if (updates.description !== undefined) dbData.description = updates.description;
    if (updates.location !== undefined) dbData.location = updates.location;

    const { data, error } = await supabase
      .from('teams')
      .update(dbData)
      .eq('id', teamId)
      .select()
      .single();

    if (error) throw error;
    return mapTeamFromDb(data);
  },

  // Remove member from team via RPC
  removeMember: async (teamId: string, memberId: string): Promise<void> => {
    const { data, error } = await supabase.rpc('remove_member', {
      target_team_id: teamId,
      target_member_id: memberId,
    });

    if (error) throw error;
    if (!data) throw new Error('Failed to remove member');
  },

  // Update member role via RPC
  updateMemberRole: async (teamId: string, memberId: string, role: 'captain' | 'player'): Promise<void> => {
    const { data, error } = await supabase.rpc('update_member_role', {
      target_team_id: teamId,
      target_member_id: memberId,
      new_role: role,
    });

    if (error) throw error;
    if (!data) throw new Error('Failed to update member role');
  },

  // Transfer ownership via RPC
  transferOwnership: async (teamId: string, newOwnerMemberId: string): Promise<void> => {
    const { data, error } = await supabase.rpc('transfer_ownership', {
      target_team_id: teamId,
      new_owner_member_id: newOwnerMemberId,
    });

    if (error) throw error;
    if (!data) throw new Error('Failed to transfer ownership');
  },

  // Leave team via RPC
  leaveTeam: async (teamId: string): Promise<void> => {
    const { data, error } = await supabase.rpc('leave_team', {
      target_team_id: teamId,
    });

    if (error) throw error;
    if (!data) throw new Error('Failed to leave team');
  },

  // Create team invite via RPC
  createTeamInvite: async (
    teamId: string,
    options?: {
      invitedUserId?: string;
      invitedEmail?: string;
      expiresAt?: string;
      maxUses?: number;
    }
  ): Promise<{
    id: string;
    teamId: string;
    inviteToken: string;
    invitedUserId?: string;
    invitedEmail?: string;
    expiresAt?: string;
    maxUses: number;
    createdAt: string;
  }> => {
    const { data, error } = await supabase.rpc('create_team_invite', {
      target_team_id: teamId,
      invited_user_id_param: options?.invitedUserId || null,
      invited_email_param: options?.invitedEmail || null,
      expires_at_param: options?.expiresAt || null,
      max_uses_param: options?.maxUses || 1,
    });

    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Failed to create invite');

    const inviteData = data[0];
    return {
      id: inviteData.invite_id,
      teamId: inviteData.team_id,
      inviteToken: inviteData.invite_token,
      invitedUserId: inviteData.invited_user_id || undefined,
      invitedEmail: inviteData.invited_email || undefined,
      expiresAt: inviteData.expires_at || undefined,
      maxUses: inviteData.max_uses || 1,
      createdAt: inviteData.created_at,
    };
  },

  // Get invite info by token (for invite acceptance screen)
  getInviteInfo: async (inviteToken: string): Promise<{
    team: Team;
    invite: {
      id: string;
      expiresAt?: string;
      maxUses: number;
      usesCount: number;
      invitedUserId?: string;
    };
  }> => {
    // Get invite info from team_invites table with team data
    const { data: inviteData, error: inviteError } = await supabase
      .from('team_invites')
      .select(`
        id,
        expires_at,
        max_uses,
        uses_count,
        invited_user_id,
        teams (
          id,
          name,
          sport,
          max_players,
          owner_id,
          owner_nickname,
          is_public,
          description,
          location,
          invite_code,
          created_at,
          updated_at
        )
      `)
      .eq('invite_token', inviteToken)
      .single();

    if (inviteError) {
      if (inviteError.code === 'PGRST116') {
        throw new Error('Invite not found');
      }
      throw inviteError;
    }
    if (!inviteData || !inviteData.teams) throw new Error('Invite not found');

    const team = mapTeamFromDb(inviteData.teams);
    
    return {
      team,
      invite: {
        id: inviteData.id,
        expiresAt: inviteData.expires_at || undefined,
        maxUses: inviteData.max_uses || 1,
        usesCount: inviteData.uses_count || 0,
        invitedUserId: inviteData.invited_user_id || undefined,
      },
    };
  },

  // Delete team
  deleteTeam: async (teamId: string, userId: string): Promise<void> => {
    // Check if user is owner
    const { data: teamData } = await supabase
      .from('teams')
      .select('owner_id')
      .eq('id', teamId)
      .single();

    if (teamData?.owner_id !== userId) {
      throw new Error('Only team owner can delete the team');
    }

    // Delete team (cascade will delete members)
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId);

    if (error) throw error;
  },

  // Get teams (all teams)
  getTeams: async (): Promise<Team[]> => {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ? data.map(mapTeamFromDb) : [];
  },

  // Get team messages
  getTeamMessages: async (teamId: string) => {
    const { data, error } = await supabase
      .from('team_messages')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Send team message
  sendTeamMessage: async (
    teamId: string,
    senderId: string,
    senderNickname: string,
    text: string
  ) => {
    const { data, error } = await supabase
      .from('team_messages')
      .insert({
        team_id: teamId,
        sender_id: senderId,
        sender_nickname: senderNickname,
        text: text.trim(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Join team (simplified version for compatibility)
  joinTeamSimple: async (teamId: string, userId: string) => {
    const { data, error } = await supabase
      .from('team_members')
      .insert([{ team_id: teamId, user_id: userId, role: 'Member' }]);

    if (error) throw error;
    return data;
  },

  // Request to join team (for private teams or teams requiring approval)
  requestToJoin: async (teamId: string, userId?: string) => {
    const { data, error } = await supabase.rpc('request_to_join', {
      p_team_id: teamId,
      p_user_id: userId || null,
    });

    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Failed to create join request');

    return {
      id: data[0].request_id,
      teamId: data[0].team_id,
      userId: data[0].user_id,
      status: data[0].status,
      createdAt: data[0].created_at,
    };
  },

  // Approve join request (for team owners/captains/admins)
  approveJoinRequest: async (requestId: string) => {
    const { data, error } = await supabase.rpc('approve_join_request', {
      p_request_id: requestId,
    });

    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Failed to approve join request');

    return {
      memberId: data[0].member_id,
      teamId: data[0].team_id,
      userId: data[0].user_id,
    };
  },

  // Get pending join requests for a team
  getPendingJoinRequests: async (teamId: string) => {
    const { data, error } = await supabase
      .from('team_join_requests')
      .select('*')
      .eq('team_id', teamId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get user's pending join request for a team
  getUserPendingRequest: async (teamId: string, userId: string) => {
    const { data, error } = await supabase
      .from('team_join_requests')
      .select('*')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },
};

