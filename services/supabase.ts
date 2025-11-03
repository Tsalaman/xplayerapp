import { createClient } from '@supabase/supabase-js';

// TODO: Replace these with your Supabase project credentials
// Get them from: https://app.supabase.com/project/_/settings/api
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Database types
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          nickname: string | null;
          sports: string[] | null;
          bio: string | null;
          location: string | null;
          skill_level: string | null;
          profile_picture: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          nickname?: string | null;
          sports?: string[] | null;
          bio?: string | null;
          location?: string | null;
          skill_level?: string | null;
          profile_picture?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          nickname?: string | null;
          sports?: string[] | null;
          bio?: string | null;
          location?: string | null;
          skill_level?: string | null;
          profile_picture?: string | null;
          created_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          user_nickname: string;
          type: 'teammate' | 'opponent';
          sport: 'football' | 'basketball' | 'tennis' | 'padel';
          title: string;
          description: string;
          location: string | null;
          date: string | null;
          time: string | null;
          status: 'open' | 'closed';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          user_nickname: string;
          type: 'teammate' | 'opponent';
          sport: 'football' | 'basketball' | 'tennis' | 'padel';
          title: string;
          description: string;
          location?: string | null;
          date?: string | null;
          time?: string | null;
          status?: 'open' | 'closed';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          user_nickname?: string;
          type?: 'teammate' | 'opponent';
          sport?: 'football' | 'basketball' | 'tennis' | 'padel';
          title?: string;
          description?: string;
          location?: string | null;
          date?: string | null;
          time?: string | null;
          status?: 'open' | 'closed';
          created_at?: string;
        };
      };
      tournaments: {
        Row: {
          id: string;
          title: string;
          description: string;
          sport: 'football' | 'basketball' | 'tennis' | 'padel';
          location: string;
          start_date: string;
          end_date: string;
          registration_deadline: string;
          max_participants: number | null;
          entry_fee: number | null;
          prize: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          sport: 'football' | 'basketball' | 'tennis' | 'padel';
          location: string;
          start_date: string;
          end_date: string;
          registration_deadline: string;
          max_participants?: number | null;
          entry_fee?: number | null;
          prize?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          sport?: 'football' | 'basketball' | 'tennis' | 'padel';
          location?: string;
          start_date?: string;
          end_date?: string;
          registration_deadline?: string;
          max_participants?: number | null;
          entry_fee?: number | null;
          prize?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
    };
  };
};

