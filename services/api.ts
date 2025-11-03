import { supabase } from './supabase';
import { User, Post, Tournament, Sport } from '../types';
import { Cursor, getTimestampFromCursor, createTimestampCursor } from '../utils/cursor';

// ==================== AUTHENTICATION ====================

export const authService = {
  signup: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined, // Disable email confirmation for now
      },
    });

    if (error) {
      // Better error messages
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        throw new Error('This email is already registered. Please login instead.');
      } else if (error.message.includes('rate limit') || error.message.includes('security purposes')) {
        throw new Error('Too many signup attempts. Please wait a minute and try again.');
      } else if (error.message.includes('invalid email')) {
        throw new Error('Please enter a valid email address.');
      } else if (error.message.includes('password')) {
        throw new Error('Password must be at least 6 characters long.');
      }
      throw error;
    }

    // Create user profile after signup
    // Note: We'll create the profile in the profile creation screen
    // This way the user can complete their profile with nickname, sports, etc.
    // For now, just return - profile will be created when user completes profile

    return data;
  },

  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Better error messages
      if (error.message.includes('Invalid login credentials') || error.message.includes('invalid')) {
        throw new Error('Invalid email or password. Please check your credentials.');
      } else if (error.message.includes('rate limit') || error.message.includes('security purposes')) {
        throw new Error('Too many login attempts. Please wait a minute and try again.');
      } else if (error.message.includes('Email not confirmed')) {
        throw new Error('Please verify your email address first.');
      }
      throw error;
    }
    return data;
  },

  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },
};

// ==================== USERS ====================

export const userService = {
  getUser: async (userId: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data ? mapUserFromDb(data) : null;
  },

  updateUser: async (userId: string, userData: Partial<User>) => {
    const dbData: any = {};
    if (userData.nickname !== undefined) dbData.nickname = userData.nickname;
    if (userData.sports !== undefined) dbData.sports = userData.sports;
    if (userData.bio !== undefined) dbData.bio = userData.bio;
    if (userData.location !== undefined) dbData.location = userData.location;
    if (userData.skillLevel !== undefined) dbData.skill_level = userData.skillLevel;
    if (userData.profilePicture !== undefined) dbData.profile_picture = userData.profilePicture;
    if (userData.latitude !== undefined) dbData.latitude = userData.latitude;
    if (userData.longitude !== undefined) dbData.longitude = userData.longitude;
    if (userData.last_location_ts !== undefined) dbData.last_location_ts = userData.last_location_ts;
    if (userData.locationPrivacy !== undefined) dbData.location_privacy = userData.locationPrivacy;

    // First check if user profile exists
    const existing = await userService.getUser(userId);
    
    if (!existing) {
      // Profile doesn't exist, create it
      // Get email from auth user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: authUser?.email || '',
          ...dbData,
        })
        .select()
        .single();

      if (error) throw error;
      return mapUserFromDb(data);
    } else {
      // Profile exists, update it
      const { data, error } = await supabase
        .from('users')
        .update(dbData)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return mapUserFromDb(data);
    }
  },

  /**
   * Create user profile during onboarding
   */
  createUserProfile: async (userId: string, data: {
    nickname?: string;
    bio?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    sports?: string[];
    skill_level?: 'beginner' | 'intermediate' | 'advanced' | 'professional';
    profile_picture?: string;
  }) => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    const updateData: any = {};

    if (data.nickname) updateData.nickname = data.nickname;
    if (data.bio) updateData.bio = data.bio;
    if (data.location) updateData.location = data.location;
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;
    if (data.sports) updateData.sports = data.sports;
    if (data.skill_level) updateData.skill_level = data.skill_level;
    if (data.profile_picture) updateData.profile_picture = data.profile_picture;

    // Mark onboarding as completed if user has nickname and sports
    if (data.nickname && data.sports && data.sports.length > 0) {
      updateData.onboarding_completed = true;
    }

    // Check if profile exists, if not create it
    const existing = await userService.getUser(userId);
    
    if (!existing) {
      // Create new profile
      const { data: newData, error } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: authUser?.email || '',
          ...updateData,
        })
        .select()
        .single();

      if (error) throw error;
      return mapUserFromDb(newData);
    } else {
      // Update existing profile
      const { data: updatedData, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return mapUserFromDb(updatedData);
    }
  },

  /**
   * Upload avatar to Supabase Storage
   */
  uploadAvatar: async (file: any, userId: string): Promise<string> => {
    const fileExt = file.uri.split('.').pop() || 'jpg';
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    // Convert file to blob if needed
    const response = await fetch(file.uri);
    const blob = await response.blob();

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, blob, { 
        upsert: true,
        contentType: `image/${fileExt}`,
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  },
};

// ==================== POSTS ====================

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: Cursor;
  hasMore: boolean;
}

export const postService = {
  getPosts: async (): Promise<Post[]> => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ? data.map(mapPostFromDb) : [];
  },

  getPostsPaginated: async (
    limit: number = 20,
    cursor: Cursor = null,
    sport?: Sport
  ): Promise<PaginatedResponse<Post>> => {
    let query = supabase
      .from('posts')
      .select('*')
      .eq('status', 'open');

    // Apply cursor filter
    if (cursor) {
      const timestamp = getTimestampFromCursor(cursor);
      if (timestamp) {
        query = query.lt('created_at', timestamp);
      }
    }

    // Apply sport filter
    if (sport) {
      query = query.eq('sport', sport);
    }

    // Order and limit
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit + 1); // Get one extra to check if there's more

    if (error) throw error;

    const posts = data ? data.map(mapPostFromDb) : [];
    const hasMore = posts.length > limit;
    const postsToReturn = hasMore ? posts.slice(0, limit) : posts;

    // Generate next cursor from last item
    const nextCursor = postsToReturn.length > 0
      ? createTimestampCursor(postsToReturn[postsToReturn.length - 1].createdAt)
      : null;

    return {
      data: postsToReturn,
      nextCursor,
      hasMore,
    };
  },

  getPost: async (postId: string): Promise<Post | null> => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (error) throw error;
    return data ? mapPostFromDb(data) : null;
  },

  createPost: async (post: Omit<Post, 'id' | 'createdAt'>): Promise<Post> => {
    const dbData = {
      user_id: post.userId,
      user_nickname: post.userNickname,
      type: post.type,
      sport: post.sport,
      title: post.title,
      description: post.description,
      location: post.location || null,
      date: post.date || null,
      time: post.time || null,
      status: post.status,
    };

    const { data, error } = await supabase
      .from('posts')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;
    return mapPostFromDb(data);
  },

  updatePost: async (postId: string, updates: Partial<Post>) => {
    const dbData: any = {};
    if (updates.title) dbData.title = updates.title;
    if (updates.description) dbData.description = updates.description;
    if (updates.location) dbData.location = updates.location;
    if (updates.status) dbData.status = updates.status;

    const { data, error } = await supabase
      .from('posts')
      .update(dbData)
      .eq('id', postId)
      .select()
      .single();

    if (error) throw error;
    return mapPostFromDb(data);
  },

  deletePost: async (postId: string, userId: string) => {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', userId);

    if (error) throw error;
  },
};

// ==================== TOURNAMENTS ====================

export const tournamentService = {
  getTournaments: async (activeOnly: boolean = true): Promise<Tournament[]> => {
    let query = supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data ? data.map(mapTournamentFromDb) : [];
  },

  getTournamentsPaginated: async (
    limit: number = 20,
    cursor: Cursor = null,
    activeOnly: boolean = false,
    sport?: Sport
  ): Promise<PaginatedResponse<Tournament>> => {
    let query = supabase.from('tournaments').select('*');

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    // Apply sport filter
    if (sport) {
      query = query.eq('sport', sport);
    }

    // Apply cursor filter
    if (cursor) {
      const timestamp = getTimestampFromCursor(cursor);
      if (timestamp) {
        query = query.lt('start_date', timestamp);
      }
    }

    // Order and limit
    const { data, error } = await query
      .order('start_date', { ascending: false })
      .limit(limit + 1); // Get one extra to check if there's more

    if (error) throw error;

    const tournaments = data ? data.map(mapTournamentFromDb) : [];
    const hasMore = tournaments.length > limit;
    const tournamentsToReturn = hasMore ? tournaments.slice(0, limit) : tournaments;

    // Generate next cursor from last item
    const nextCursor = tournamentsToReturn.length > 0
      ? createTimestampCursor(tournamentsToReturn[tournamentsToReturn.length - 1].startDate)
      : null;

    return {
      data: tournamentsToReturn,
      nextCursor,
      hasMore,
    };
  },

  getTournament: async (tournamentId: string): Promise<Tournament | null> => {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

    if (error) throw error;
    return data ? mapTournamentFromDb(data) : null;
  },

  createTournament: async (tournament: Omit<Tournament, 'id' | 'createdAt'>): Promise<Tournament> => {
    const dbData = {
      title: tournament.title,
      description: tournament.description,
      sport: tournament.sport,
      location: tournament.location,
      start_date: tournament.startDate,
      end_date: tournament.endDate,
      registration_deadline: tournament.registrationDeadline,
      max_participants: tournament.maxParticipants || null,
      entry_fee: tournament.entryFee || null,
      prize: tournament.prize || null,
      is_active: tournament.isActive,
    };

    const { data, error } = await supabase
      .from('tournaments')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;
    return mapTournamentFromDb(data);
  },
};

// ==================== HELPERS ====================

function mapUserFromDb(dbUser: any): User {
  return {
    id: dbUser.id,
    email: dbUser.email,
    nickname: dbUser.nickname || '',
    sports: (dbUser.sports as string[]) || [],
    bio: dbUser.bio || undefined,
    location: dbUser.location || undefined,
    skillLevel: dbUser.skill_level as any,
    profilePicture: dbUser.profile_picture || undefined,
    latitude: dbUser.latitude || undefined,
    longitude: dbUser.longitude || undefined,
    last_location_ts: dbUser.last_location_ts || undefined,
    locationPrivacy: dbUser.location_privacy as any || undefined,
  };
}

function mapPostFromDb(dbPost: any): Post {
  return {
    id: dbPost.id,
    userId: dbPost.user_id,
    userNickname: dbPost.user_nickname,
    type: dbPost.type,
    sport: dbPost.sport,
    title: dbPost.title,
    description: dbPost.description,
    location: dbPost.location || undefined,
    date: dbPost.date || undefined,
    time: dbPost.time || undefined,
    createdAt: dbPost.created_at,
    status: dbPost.status,
  };
}

function mapTournamentFromDb(dbTournament: any): Tournament {
  return {
    id: dbTournament.id,
    title: dbTournament.title,
    description: dbTournament.description,
    sport: dbTournament.sport,
    location: dbTournament.location,
    startDate: dbTournament.start_date,
    endDate: dbTournament.end_date,
    registrationDeadline: dbTournament.registration_deadline,
    maxParticipants: dbTournament.max_participants || undefined,
    entryFee: dbTournament.entry_fee || undefined,
    prize: dbTournament.prize || undefined,
    createdAt: dbTournament.created_at,
    isActive: dbTournament.is_active,
  };
}

