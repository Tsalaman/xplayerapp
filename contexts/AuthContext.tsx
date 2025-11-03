import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { User, AuthContextType } from '../types';
import { authService, userService } from '../services/api';
import { supabase } from '../services/supabase';
import { registerForPushNotificationsAsync, removePushToken } from '../services/pushNotifications';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const pushTokenRef = useRef<string | null>(null);

  useEffect(() => {
    loadUser();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUser = async () => {
    try {
      const authUser = await authService.getCurrentUser();
      if (authUser) {
        await loadUserProfile(authUser.id);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async (userId: string) => {
    try {
      const userProfile = await userService.getUser(userId);
      if (userProfile) {
        setUser(userProfile);
        // Register for push notifications after user profile is loaded
        const token = await registerForPushNotificationsAsync(userId);
        if (token) {
          pushTokenRef.current = token;
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { user: authUser } = await authService.login(email, password);
      if (authUser) {
        await loadUserProfile(authUser.id);
      }
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      const { user: authUser } = await authService.signup(email, password);
      if (authUser) {
        // Profile already created in authService.signup
        const userProfile = await userService.getUser(authUser.id);
        if (userProfile) {
          setUser(userProfile);
        }
      }
    } catch (error: any) {
      throw new Error(error.message || 'Signup failed');
    }
  };

  const logout = async () => {
    try {
      // Remove push token before logging out
      if (user && pushTokenRef.current) {
        await removePushToken(user.id, pushTokenRef.current);
        pushTokenRef.current = null;
      }
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (!user) return;
    
    try {
      const updatedUser = await userService.updateUser(user.id, userData);
      setUser(updatedUser);
    } catch (error: any) {
      console.error('Error updating user:', error);
      throw new Error(error.message || 'Failed to update profile');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'xplayer://password-reset',
      });
    } catch (error: any) {
      console.error('Error resetting password:', error);
      throw new Error(error.message || 'Failed to reset password');
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, login, signup, logout, updateUser, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

// Export loading state if needed
export const useAuthLoading = () => {
  const [loading, setLoading] = useState(true);
  // This can be extended if needed
  return loading;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

