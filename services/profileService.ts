import { supabase } from './supabase';

/**
 * Profile Service
 * Handles all profile-related operations
 */
export const profileService = {
  /**
   * Get user profile
   */
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: any) {
    const { error } = await supabase
      .from('user_profiles')
      .update(data)
      .eq('id', userId);

    if (error) throw error;
  },

  /**
   * Get user achievements
   */
  async getAchievements(userId: string) {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('*, achievements(*)')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  },

  /**
   * Get user stats from match results
   */
  async getStats(userId: string) {
    const { data, error } = await supabase
      .from('match_results')
      .select('*')
      .or(`player1_id.eq.${userId},player2_id.eq.${userId}`);

    if (error) throw error;
    
    const matches = data || [];
    const wins = matches.filter(m => 
      (m.player1_id === userId && m.player1_score > m.player2_score) ||
      (m.player2_id === userId && m.player2_score > m.player1_score)
    ).length;
    
    const losses = matches.filter(m => 
      (m.player1_id === userId && m.player1_score < m.player2_score) ||
      (m.player2_id === userId && m.player2_score < m.player1_score)
    ).length;
    
    const winRate = matches.length > 0 ? (wins / matches.length) * 100 : 0;
    
    return {
      matches: matches.length,
      wins,
      losses,
      winRate,
      xp: wins * 25, // +25 XP per win
    };
  },
};

