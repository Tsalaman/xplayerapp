import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

/**
 * OnboardingGuard - Checks if user has completed onboarding
 * Redirects to /onboarding/profile if not completed
 */
export default function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, session, loading } = useAuth();
  const [checking, setChecking] = useState(true);

  // Paths that don't require onboarding check
  const publicPaths = [
    '/',
    '/(auth)/splash',
    '/(auth)/welcome',
    '/(auth)/onboarding',
    '/(auth)/login',
    '/(auth)/signup',
    '/(auth)/password-reset',
    '/onboarding/profile',
    '/onboarding/sports',
  ];

  useEffect(() => {
    checkOnboarding();
  }, [user, session, pathname]);

  const checkOnboarding = async () => {
    // If no session, don't redirect
    if (!session?.user) {
      setChecking(false);
      return;
    }

    // Skip check for public/auth/onboarding paths
    if (publicPaths.some((path) => pathname?.startsWith(path))) {
      setChecking(false);
      return;
    }

    try {
      // Check if user profile exists and has completed onboarding
      const { data, error } = await supabase
        .from('users')
        .select('onboarding_completed, nickname, sports')
        .eq('id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned (user doesn't have profile yet)
        console.error('Error checking onboarding:', error.message);
        setChecking(false);
        return;
      }

      // If no profile or onboarding not completed, redirect
      if (!data || !data.onboarding_completed) {
        // Check if user has nickname and sports (heuristic for completion)
        const hasProfile = data?.nickname && data?.nickname.trim() !== '' && 
                          data?.sports && Array.isArray(data.sports) && data.sports.length > 0;

        if (!hasProfile) {
          router.replace('/onboarding/profile');
          return;
        }
      }

      setChecking(false);
    } catch (error: any) {
      console.error('Error in onboarding check:', error);
      setChecking(false);
    }
  };

  // Show loading while checking
  if (checking || loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
});

