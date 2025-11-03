import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { NotificationsProvider } from '../contexts/NotificationsContext';
import { StatusBar } from 'expo-status-bar';
import OnboardingGuard from '../components/layouts/OnboardingGuard';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';

// Configure notification handler globally
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function RootLayout() {
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Setup notification listeners at root level
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Root notification received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Root notification response:', response);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return (
    <AuthProvider>
      <NotificationsProvider>
        <OnboardingGuard>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)/splash" />
        <Stack.Screen name="(auth)/welcome" />
        <Stack.Screen name="(auth)/onboarding" />
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/signup" />
        <Stack.Screen name="(auth)/password-reset" />
        <Stack.Screen name="onboarding/profile" />
        <Stack.Screen name="onboarding/sports" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="profile/create" />
        <Stack.Screen name="profile/edit" />
        <Stack.Screen name="post/create" />
        <Stack.Screen name="post/details" />
        <Stack.Screen name="tournament/details" />
        <Stack.Screen name="chat/[chatId]" />
        <Stack.Screen name="team/invite/[token]" />
        <Stack.Screen name="match/create" />
        <Stack.Screen name="matches/swipe" />
        <Stack.Screen name="matches/[matchId]/live" />
        <Stack.Screen name="matches/[matchId]/review" />
        <Stack.Screen name="search/index" />
        <Stack.Screen name="calendar/index" />
        <Stack.Screen name="profile/analytics" />
        <Stack.Screen name="groups/index" />
        <Stack.Screen name="settings/index" />
        <Stack.Screen name="legal/index" />
        <Stack.Screen name="admin/index" />
        <Stack.Screen name="[...not-found]" />
          </Stack>
        </OnboardingGuard>
      </NotificationsProvider>
    </AuthProvider>
  );
}
