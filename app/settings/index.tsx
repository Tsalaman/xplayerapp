import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../constants/theme';
import Card from '../../components/ui/Card';
import LanguageToggle from '../../components/LanguageToggle';
import { t } from '../../utils/i18n';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [locationEnabled, setLocationEnabled] = React.useState(true);

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/splash');
  };

  const settingsSections = [
    {
      title: 'Account',
      items: [
        {
          icon: 'person-outline',
          label: t('profile.edit'),
          onPress: () => router.push('/profile/edit'),
          showArrow: true,
        },
        {
          icon: 'stats-chart-outline',
          label: t('nav.stats'),
          onPress: () => router.push('/profile/analytics'),
          showArrow: true,
        },
        {
          icon: 'images-outline',
          label: t('profile.gallery'),
          onPress: () => router.push('/profile/gallery'),
          showArrow: true,
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: 'language-outline',
          label: 'Language',
          component: <LanguageToggle variant="inline" />,
        },
        {
          icon: 'notifications-outline',
          label: 'Notifications',
          rightComponent: (
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            />
          ),
        },
        {
          icon: 'location-outline',
          label: 'Location Services',
          rightComponent: (
            <Switch
              value={locationEnabled}
              onValueChange={setLocationEnabled}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            />
          ),
        },
      ],
    },
    {
      title: 'About',
      items: [
        {
          icon: 'information-circle-outline',
          label: 'Terms & Privacy',
          onPress: () => router.push('/legal'),
          showArrow: true,
        },
        {
          icon: 'help-circle-outline',
          label: 'Help & Support',
          onPress: () => {},
          showArrow: true,
        },
        {
          icon: 'star-outline',
          label: 'Rate App',
          onPress: () => {},
          showArrow: true,
        },
      ],
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('nav.settings')}</Text>
        <View style={styles.placeholder} />
      </View>

      {settingsSections.map((section, sectionIndex) => (
        <Card key={sectionIndex} style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.items.map((item, itemIndex) => (
            <View key={itemIndex}>
              {item.onPress ? (
                <TouchableOpacity
                  style={styles.settingsItem}
                  onPress={item.onPress}
                >
                  <View style={styles.itemLeft}>
                    <Ionicons
                      name={item.icon as any}
                      size={24}
                      color={theme.colors.textSecondary}
                      style={styles.itemIcon}
                    />
                    <Text style={styles.itemLabel}>{item.label}</Text>
                  </View>
                  {item.showArrow && (
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={theme.colors.textSecondary}
                    />
                  )}
                  {item.rightComponent}
                </TouchableOpacity>
              ) : (
                <View style={styles.settingsItem}>
                  <View style={styles.itemLeft}>
                    <Ionicons
                      name={item.icon as any}
                      size={24}
                      color={theme.colors.textSecondary}
                      style={styles.itemIcon}
                    />
                    <Text style={styles.itemLabel}>{item.label}</Text>
                  </View>
                  {item.component || item.rightComponent}
                </View>
              )}
              {itemIndex < section.items.length - 1 && (
                <View style={styles.separator} />
              )}
            </View>
          ))}
        </Card>
      ))}

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={24} color={theme.colors.error} />
        <Text style={styles.logoutText}>{t('buttons.logout')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
    paddingTop: theme.spacing.xl + 20,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  sectionCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    fontWeight: '600',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    marginRight: theme.spacing.md,
  },
  itemLabel: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: theme.spacing.md + 24,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.error,
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  logoutText: {
    ...theme.typography.h3,
    color: theme.colors.error,
  },
});
