import { supabase } from './supabase';

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
}

export const followService = {
  // Follow a user via RPC
  followUser: async (followingUserId: string): Promise<Follow> => {
    const { data, error } = await supabase.rpc('follow_user', {
      following_user_id: followingUserId,
    });

    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Failed to follow user');

    const followData = data[0];
    return {
      id: followData.follow_id,
      followerId: followData.follower_id,
      followingId: followData.following_id,
      createdAt: followData.created_at,
    };
  },

  // Unfollow a user via RPC
  unfollowUser: async (followingUserId: string): Promise<boolean> => {
    const { data, error } = await supabase.rpc('unfollow_user', {
      following_user_id: followingUserId,
    });

    if (error) throw error;
    return data === true;
  },

  // Check if current user is following another user
  isFollowing: async (followingUserId: string): Promise<boolean> => {
    const { data, error } = await supabase.rpc('is_following', {
      following_user_id: followingUserId,
    });

    if (error) throw error;
    return data === true;
  },

  // Get followers count for a user
  getFollowersCount: async (userId: string): Promise<number> => {
    const { count, error } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);

    if (error) throw error;
    return count || 0;
  },

  // Get following count for a user
  getFollowingCount: async (userId: string): Promise<number> => {
    const { count, error } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);

    if (error) throw error;
    return count || 0;
  },
};

