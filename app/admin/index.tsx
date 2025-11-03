import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../constants/theme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { t } from '../../utils/i18n';

export default function AdminPanelScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // In production, check if user is admin
  const isAdmin = true; // Mock admin check

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Admin Panel</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.unauthorized}>
          <Ionicons name="lock-closed" size={64} color={theme.colors.error} />
          <Text style={styles.unauthorizedText}>Unauthorized Access</Text>
          <Text style={styles.unauthorizedSubtext}>
            You do not have permission to access this page.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Admin Panel</Text>
        <View style={styles.placeholder} />
      </View>

      <Card style={styles.statsCard}>
        <Text style={styles.sectionTitle}>Dashboard Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>1,234</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>567</Text>
            <Text style={styles.statLabel}>Active Matches</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>89</Text>
            <Text style={styles.statLabel}>Teams</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Reports</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.actionsCard}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <Button
          title="User Management"
          onPress={() => Alert.alert('Coming Soon', 'User management feature coming soon')}
          variant="primary"
          style={styles.actionButton}
        />
        <Button
          title="Content Moderation"
          onPress={() => Alert.alert('Coming Soon', 'Content moderation feature coming soon')}
          variant="outline"
          style={styles.actionButton}
        />
        <Button
          title="Analytics Overview"
          onPress={() => Alert.alert('Coming Soon', 'Analytics feature coming soon')}
          variant="outline"
          style={styles.actionButton}
        />
        <Button
          title="System Settings"
          onPress={() => Alert.alert('Coming Soon', 'System settings feature coming soon')}
          variant="outline"
          style={styles.actionButton}
        />
      </Card>
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
  statsCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
  },
  statValue: {
    ...theme.typography.h1,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  actionsCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  actionButton: {
    marginBottom: theme.spacing.md,
  },
  unauthorized: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xxl,
  },
  unauthorizedText: {
    ...theme.typography.h2,
    color: theme.colors.error,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  unauthorizedSubtext: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
