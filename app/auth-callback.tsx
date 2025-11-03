import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../services/supabase';
import { theme } from '../constants/theme';

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState('Checking authentication...');

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const checkSession = async () => {
      try {
        // Try to get session immediately
        let attempts = 0;
        const maxAttempts = 5;
        
        const checkSessionWithRetry = async (): Promise<void> => {
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Session error:', error);
            if (mounted) {
              setStatus('Authentication failed. Redirecting...');
              setTimeout(() => router.replace('/(auth)/login'), 1000);
            }
            return;
          }

          if (session?.user) {
            if (mounted) {
              setStatus('Authentication successful! Redirecting...');
              setTimeout(() => router.replace('/(tabs)/home'), 500);
            }
            return;
          }

          // No session yet, retry if we haven't exceeded max attempts
          attempts++;
          if (attempts < maxAttempts && mounted) {
            setStatus(`Checking authentication... (${attempts}/${maxAttempts})`);
            setTimeout(checkSessionWithRetry, 1000);
          } else if (mounted) {
            // No session after max attempts
            setStatus('No session found. Redirecting...');
            setTimeout(() => router.replace('/(auth)/login'), 1000);
          }
        };

        // Start checking
        checkSessionWithRetry();

        // Timeout after 10 seconds
        timeoutId = setTimeout(() => {
          if (mounted) {
            setStatus('Timeout. Redirecting...');
            router.replace('/(auth)/login');
          }
        }, 10000);

      } catch (error) {
        console.error('Auth callback error:', error);
        if (mounted) {
          setStatus('Error occurred. Redirecting...');
          setTimeout(() => router.replace('/(auth)/login'), 1000);
        }
      }
    };

    checkSession();

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.statusText}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  statusText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
});

