import { supabase } from './supabase';
import { Match, Sport } from '../types';
import { PaginatedResponse } from './api';
import { Cursor, getMatchCursorFields, createMatchCursor } from '../utils/cursor';

export const matchesService = {
  /**
   * Get user's past matches with cursor pagination
   * ORDER BY match_date DESC, id ASC
   */
  getMatchesPaginated: async (
    userId: string,
    limit: number = 20,
    cursor: Cursor = null,
    sport?: Sport,
    teamName?: string
  ): Promise<PaginatedResponse<Match>> => {
    // Get cursor fields if cursor exists
    let cursorMatchDate: string | null = null;
    let cursorMatchId: string | null = null;
    
    if (cursor) {
      const cursorFields = getMatchCursorFields(cursor);
      if (cursorFields) {
        cursorMatchDate = cursorFields.match_date;
        cursorMatchId = cursorFields.match_id;
      }
    }

    // Call RPC function for cursor pagination
    const { data, error } = await supabase.rpc('get_matches_paginated', {
      user_id_filter: userId,
      cursor_match_date: cursorMatchDate,
      cursor_match_id: cursorMatchId,
      sport_filter: sport || null,
      team_filter: teamName || null,
      limit_count: limit + 1, // Get one extra to check if there's more
    });

    if (error) throw error;

    const matches = data ? data.map(mapMatchFromDb) : [];
    const hasMore = matches.length > limit;
    const matchesToReturn = hasMore ? matches.slice(0, limit) : matches;

    // Generate next cursor from last item
    const nextCursor = matchesToReturn.length > 0
      ? createMatchCursor(
          matchesToReturn[matchesToReturn.length - 1].matchDate,
          matchesToReturn[matchesToReturn.length - 1].id
        )
      : null;

    return {
      data: matchesToReturn,
      nextCursor,
      hasMore,
    };
  },

  /**
   * Get a single match by ID
   */
  getMatch: async (matchId: string, userId: string): Promise<Match | null> => {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data ? mapMatchFromDb(data) : null;
  },

  /**
   * Create a new match
   */
  createMatch: async (match: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>): Promise<Match> => {
    const dbData = {
      user_id: match.userId,
      sport: match.sport,
      match_date: match.matchDate,
      team_name: match.teamName || null,
      opponent_team_name: match.opponentTeamName || null,
      player_names: match.playerNames || null,
      opponent_names: match.opponentNames || null,
      user_score: match.userScore,
      opponent_score: match.opponentScore,
      result: match.result,
      venue: match.venue || null,
      notes: match.notes || null,
    };

    const { data, error } = await supabase
      .from('matches')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;
    return mapMatchFromDb(data);
  },

  /**
   * Update a match
   */
  updateMatch: async (
    matchId: string,
    userId: string,
    updates: Partial<Omit<Match, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<Match> => {
    const dbData: any = {};
    if (updates.sport !== undefined) dbData.sport = updates.sport;
    if (updates.matchDate !== undefined) dbData.match_date = updates.matchDate;
    if (updates.teamName !== undefined) dbData.team_name = updates.teamName;
    if (updates.opponentTeamName !== undefined) dbData.opponent_team_name = updates.opponentTeamName;
    if (updates.playerNames !== undefined) dbData.player_names = updates.playerNames;
    if (updates.opponentNames !== undefined) dbData.opponent_names = updates.opponentNames;
    if (updates.userScore !== undefined) dbData.user_score = updates.userScore;
    if (updates.opponentScore !== undefined) dbData.opponent_score = updates.opponentScore;
    if (updates.result !== undefined) dbData.result = updates.result;
    if (updates.venue !== undefined) dbData.venue = updates.venue;
    if (updates.notes !== undefined) dbData.notes = updates.notes;

    const { data, error } = await supabase
      .from('matches')
      .update(dbData)
      .eq('id', matchId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return mapMatchFromDb(data);
  },

  /**
   * Delete a match
   */
  deleteMatch: async (matchId: string, userId: string): Promise<void> => {
    const { error } = await supabase
      .from('matches')
      .delete()
      .eq('id', matchId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  /**
   * Get user's match statistics
   */
  getMatchStats: async (userId: string): Promise<{
    totalMatches: number;
    wins: number;
    losses: number;
    draws: number;
    bySport: Record<Sport, { wins: number; losses: number; draws: number }>;
  }> => {
    const { data, error } = await supabase
      .from('matches')
      .select('sport, result')
      .eq('user_id', userId)
      .lt('match_date', new Date().toISOString());

    if (error) throw error;

    const stats = {
      totalMatches: data?.length || 0,
      wins: 0,
      losses: 0,
      draws: 0,
      bySport: {} as Record<Sport, { wins: number; losses: number; draws: number }>,
    };

    data?.forEach((match) => {
      if (match.result === 'win') stats.wins++;
      else if (match.result === 'loss') stats.losses++;
      else if (match.result === 'draw') stats.draws++;

      const sport = match.sport as Sport;
      if (!stats.bySport[sport]) {
        stats.bySport[sport] = { wins: 0, losses: 0, draws: 0 };
      }
      if (match.result === 'win') stats.bySport[sport].wins++;
      else if (match.result === 'loss') stats.bySport[sport].losses++;
      else if (match.result === 'draw') stats.bySport[sport].draws++;
    });

    return stats;
  },
};

/**
 * Map database match to Match type
 */
function mapMatchFromDb(dbMatch: any): Match {
  return {
    id: dbMatch.id,
    userId: dbMatch.user_id,
    sport: dbMatch.sport,
    matchDate: dbMatch.match_date,
    teamName: dbMatch.team_name || undefined,
    opponentTeamName: dbMatch.opponent_team_name || undefined,
    playerNames: dbMatch.player_names || undefined,
    opponentNames: dbMatch.opponent_names || undefined,
    userScore: dbMatch.user_score,
    opponentScore: dbMatch.opponent_score,
    result: dbMatch.result,
    venue: dbMatch.venue || undefined,
    notes: dbMatch.notes || undefined,
    createdAt: dbMatch.created_at,
    updatedAt: dbMatch.updated_at,
  };
}

