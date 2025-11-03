import { supabase } from './supabase';
import {
  TournamentParticipant,
  TournamentResult,
  UserStats,
  TeamStats,
} from '../types';

function mapParticipantFromDb(dbParticipant: any): TournamentParticipant {
  return {
    id: dbParticipant.id,
    tournamentId: dbParticipant.tournament_id,
    participantType: dbParticipant.participant_type,
    userId: dbParticipant.user_id || undefined,
    teamId: dbParticipant.team_id || undefined,
    participantName: dbParticipant.participant_name,
    paymentStatus: dbParticipant.payment_status,
    paymentMethod: dbParticipant.payment_method || undefined,
    paymentTransactionId: dbParticipant.payment_transaction_id || undefined,
    paymentAmount: dbParticipant.payment_amount ? parseFloat(dbParticipant.payment_amount) : undefined,
    paymentDate: dbParticipant.payment_date || undefined,
    confirmed: dbParticipant.confirmed,
    registrationDate: dbParticipant.registration_date,
  };
}

function mapResultFromDb(dbResult: any): TournamentResult {
  return {
    id: dbResult.id,
    tournamentId: dbResult.tournament_id,
    participantId: dbResult.participant_id,
    participantType: dbResult.participant_type,
    position: dbResult.position,
    points: dbResult.points,
    wins: dbResult.wins,
    losses: dbResult.losses,
    draws: dbResult.draws,
    goalsFor: dbResult.goals_for,
    goalsAgainst: dbResult.goals_against,
    prize: dbResult.prize || undefined,
    createdAt: dbResult.created_at,
    updatedAt: dbResult.updated_at,
  };
}

function mapUserStatsFromDb(dbStats: any): UserStats {
  return {
    id: dbStats.id,
    userId: dbStats.user_id,
    tournamentsPlayed: dbStats.tournaments_played,
    tournamentsWon: dbStats.tournaments_won,
    tournamentsRunnerUp: dbStats.tournaments_runner_up,
    totalWins: dbStats.total_wins,
    totalLosses: dbStats.total_losses,
    totalDraws: dbStats.total_draws,
    totalGoalsFor: dbStats.total_goals_for,
    totalGoalsAgainst: dbStats.total_goals_against,
    totalPoints: dbStats.total_points,
    updatedAt: dbStats.updated_at,
  };
}

function mapTeamStatsFromDb(dbStats: any): TeamStats {
  return {
    id: dbStats.id,
    teamId: dbStats.team_id,
    tournamentsPlayed: dbStats.tournaments_played,
    tournamentsWon: dbStats.tournaments_won,
    tournamentsRunnerUp: dbStats.tournaments_runner_up,
    totalWins: dbStats.total_wins,
    totalLosses: dbStats.total_losses,
    totalDraws: dbStats.total_draws,
    totalGoalsFor: dbStats.total_goals_for,
    totalGoalsAgainst: dbStats.total_goals_against,
    totalPoints: dbStats.total_points,
    updatedAt: dbStats.updated_at,
  };
}

export const tournamentParticipationService = {
  // Register for tournament (as user)
  registerUser: async (
    tournamentId: string,
    userId: string,
    userNickname: string
  ): Promise<TournamentParticipant> => {
    // Check if tournament exists and has entry fee
    const { data: tournament } = await supabase
      .from('tournaments')
      .select('entry_fee, max_participants')
      .eq('id', tournamentId)
      .single();

    if (!tournament) throw new Error('Tournament not found');

    // Check if already registered
    const { data: existing } = await supabase
      .from('tournament_participants')
      .select('id')
      .eq('tournament_id', tournamentId)
      .eq('user_id', userId)
      .eq('participant_type', 'user')
      .single();

    if (existing) {
      throw new Error('You are already registered for this tournament');
    }

    // Check if tournament is full
    const { data: participants } = await supabase
      .from('tournament_participants')
      .select('id')
      .eq('tournament_id', tournamentId)
      .eq('confirmed', true);

    const currentCount = participants ? participants.length : 0;
    if (tournament.max_participants && currentCount >= tournament.max_participants) {
      throw new Error('Tournament is full');
    }

    const { data, error } = await supabase
      .from('tournament_participants')
      .insert({
        tournament_id: tournamentId,
        participant_type: 'user',
        user_id: userId,
        participant_name: userNickname,
        payment_status: tournament.entry_fee && tournament.entry_fee > 0 ? 'pending' : 'paid',
        payment_amount: tournament.entry_fee || 0,
        confirmed: tournament.entry_fee === null || tournament.entry_fee === 0,
      })
      .select()
      .single();

    if (error) throw error;
    return mapParticipantFromDb(data);
  },

  // Register for tournament (as team)
  registerTeam: async (
    tournamentId: string,
    teamId: string,
    teamName: string
  ): Promise<TournamentParticipant> => {
    // Check if tournament exists and has entry fee
    const { data: tournament } = await supabase
      .from('tournaments')
      .select('entry_fee, max_participants')
      .eq('id', tournamentId)
      .single();

    if (!tournament) throw new Error('Tournament not found');

    // Check if already registered
    const { data: existing } = await supabase
      .from('tournament_participants')
      .select('id')
      .eq('tournament_id', tournamentId)
      .eq('team_id', teamId)
      .eq('participant_type', 'team')
      .single();

    if (existing) {
      throw new Error('Team is already registered for this tournament');
    }

    // Check if tournament is full
    const { data: participants } = await supabase
      .from('tournament_participants')
      .select('id')
      .eq('tournament_id', tournamentId)
      .eq('confirmed', true);

    const currentCount = participants ? participants.length : 0;
    if (tournament.max_participants && currentCount >= tournament.max_participants) {
      throw new Error('Tournament is full');
    }

    const { data, error } = await supabase
      .from('tournament_participants')
      .insert({
        tournament_id: tournamentId,
        participant_type: 'team',
        team_id: teamId,
        participant_name: teamName,
        payment_status: tournament.entry_fee && tournament.entry_fee > 0 ? 'pending' : 'paid',
        payment_amount: tournament.entry_fee || 0,
        confirmed: tournament.entry_fee === null || tournament.entry_fee === 0,
      })
      .select()
      .single();

    if (error) throw error;
    return mapParticipantFromDb(data);
  },

  // Confirm payment and participation
  confirmPayment: async (
    participantId: string,
    paymentMethod: string,
    transactionId: string
  ): Promise<TournamentParticipant> => {
    const { data: participant } = await supabase
      .from('tournament_participants')
      .select('payment_amount')
      .eq('id', participantId)
      .single();

    if (!participant) throw new Error('Registration not found');

    const { data, error } = await supabase
      .from('tournament_participants')
      .update({
        payment_status: 'paid',
        payment_method: paymentMethod,
        payment_transaction_id: transactionId,
        payment_date: new Date().toISOString(),
        confirmed: true,
      })
      .eq('id', participantId)
      .select()
      .single();

    if (error) throw error;
    return mapParticipantFromDb(data);
  },

  // Get tournament participants
  getParticipants: async (tournamentId: string): Promise<TournamentParticipant[]> => {
    const { data, error } = await supabase
      .from('tournament_participants')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('registration_date', { ascending: true });

    if (error) throw error;
    return data ? data.map(mapParticipantFromDb) : [];
  },

  // Get user's tournament registrations
  getUserRegistrations: async (userId: string): Promise<TournamentParticipant[]> => {
    const { data, error } = await supabase
      .from('tournament_participants')
      .select('*')
      .eq('user_id', userId)
      .eq('participant_type', 'user')
      .order('registration_date', { ascending: false });

    if (error) throw error;
    return data ? data.map(mapParticipantFromDb) : [];
  },

  // Get tournament results
  getTournamentResults: async (tournamentId: string): Promise<TournamentResult[]> => {
    const { data, error } = await supabase
      .from('tournament_results')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('position', { ascending: true });

    if (error) throw error;
    return data ? data.map(mapResultFromDb) : [];
  },

  // Get user stats
  getUserStats: async (userId: string): Promise<UserStats | null> => {
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data ? mapUserStatsFromDb(data) : null;
  },

  // Get team stats
  getTeamStats: async (teamId: string): Promise<TeamStats | null> => {
    const { data, error } = await supabase
      .from('team_stats')
      .select('*')
      .eq('team_id', teamId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? mapTeamStatsFromDb(data) : null;
  },
};

