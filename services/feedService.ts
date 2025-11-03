import { supabase } from './supabase';

/**
 * Feed Service
 * Handles all feed-related operations
 */
export const feedService = {
  /**
   * Get posts
   */
  async getPosts() {
    const { data, error } = await supabase
      .from('posts')
      .select('*, author:user_profiles(username, avatar_url)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Like a post
   */
  async likePost(postId: string, userId: string) {
    const { error } = await supabase
      .from('likes')
      .insert([{ post_id: postId, user_id: userId }]);

    if (error) throw error;
  },

  /**
   * Unlike a post
   */
  async unlikePost(postId: string, userId: string) {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  /**
   * Get likes count for a post
   */
  async getLikesCount(postId: string) {
    const { count, error } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    if (error) throw error;
    return count || 0;
  },

  /**
   * Check if user liked a post
   */
  async isLiked(postId: string, userId: string) {
    const { data, error } = await supabase
      .from('likes')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return !!data;
  },
};

