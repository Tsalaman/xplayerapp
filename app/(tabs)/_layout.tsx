import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../../contexts/NotificationsContext';
import { useRouter } from 'expo-router';
import MainLayout from '../../components/layouts/MainLayout';

function NotificationBadge({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const { unreadCount } = useNotifications();
  const router = useRouter();

  return (
    <MainLayout>
      <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.mint,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        headerShown: false, // Hide header, using MainLayout TopBar instead
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Create',
          tabBarIcon: ({ color, size }) => (
            <View style={styles.createButton}>
              <LinearGradient
                colors={[theme.colors.navy, theme.colors.mint]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.createGradient}
              >
                <Ionicons name="add" size={24} color={theme.colors.surface} />
              </LinearGradient>
            </View>
          ),
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              onPress={() => router.push('/post/create')}
              style={styles.createTabButton}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="posts"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      {/* Hide these from tab bar but keep them accessible */}
      <Tabs.Screen
        name="tournaments"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="teams"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null, // Hide from tab bar (accessible via TopBar)
        }}
      />
      </Tabs>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  badgeText: {
    color: theme.colors.surface,
    fontSize: 10,
    fontWeight: 'bold',
  },
  createButton: {
    borderRadius: 20,
    overflow: 'hidden',
    width: 40,
    height: 40,
  },
  createGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createTabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

