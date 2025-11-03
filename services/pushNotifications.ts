import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

/**
 * Push Notifications Service
 * Handles device registration and push notification setup
 */

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register device for push notifications
 */
export async function registerForPushNotificationsAsync(userId: string): Promise<string | null> {
  // Check if running on physical device
  if (!Device.isDevice) {
    console.warn('Push notifications only work on physical devices');
    return null;
  }

  try {
    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return null;
    }

    // Get push token
    // Note: projectId should be set in app.json or use Constants.expoConfig.extra.projectId
    // For Expo projects, use Constants from expo-constants
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID || undefined, // Optional if using EAS
    });

    const token = tokenData.data;

    // Save token to Supabase
    if (userId && token) {
      await savePushToken(userId, token);
      // Also save to users.push_token for compatibility
      await supabase
        .from('users')
        .update({ push_token: token })
        .eq('id', userId);
    }

    // Configure Android channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#5CE1E6',
      });
    }

    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Save push token to Supabase
 */
async function savePushToken(userId: string, token: string) {
  try {
    // Check if token already exists
    const { data: existingToken } = await supabase
      .from('user_push_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('token', token)
      .single();

    if (!existingToken) {
      // Insert new token
      await supabase.from('user_push_tokens').insert({
        user_id: userId,
        token,
        platform: Platform.OS,
        device_name: Device.deviceName || 'Unknown',
      });
    } else {
      // Update existing token
      await supabase
        .from('user_push_tokens')
        .update({
          updated_at: new Date().toISOString(),
          platform: Platform.OS,
          device_name: Device.deviceName || 'Unknown',
        })
        .eq('user_id', userId)
        .eq('token', token);
    }
  } catch (error) {
    console.error('Error saving push token:', error);
  }
}

/**
 * Remove push token when user logs out
 */
export async function removePushToken(userId: string, token: string) {
  try {
    await supabase
      .from('user_push_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('token', token);
  } catch (error) {
    console.error('Error removing push token:', error);
  }
}

/**
 * Schedule local notification
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: any,
  trigger?: Notifications.NotificationTriggerInput
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
      badge: 1,
    },
    trigger: trigger || null, // null = immediate
  });
}

/**
 * Cancel all notifications
 */
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get notification permissions status
 */
export async function getNotificationPermissions(): Promise<Notifications.NotificationPermissionsStatus> {
  return await Notifications.getPermissionsAsync();
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<Notifications.NotificationPermissionsStatus> {
  return await Notifications.requestPermissionsAsync();
}

