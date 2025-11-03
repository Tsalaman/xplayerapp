import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../constants/theme';
import XPlayerLogo from '../../components/XPlayerLogo';

export default function SplashScreen() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      // Check authentication state and navigate
      if (!user) {
        router.replace('/(auth)/welcome');
      } else if (!user.nickname) {
        router.replace('/profile/create');
      } else {
        router.replace('/(tabs)/home');
      }
    }, 2000); // Show splash for 2 seconds

    return () => clearTimeout(timer);
  }, [user, router]);

  return (
    <View style={styles.container}>
      <XPlayerLogo size={120} color={theme.colors.primary} />
      <ActivityIndicator
        size="large"
        color={theme.colors.primary}
        style={styles.loader}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    marginTop: theme.spacing.xl,
  },
});

