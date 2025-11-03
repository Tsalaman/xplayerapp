import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { t } from '../../utils/i18n';

// Mock groups
const mockGroups = [
  {
    id: '1',
    name: 'Athens Football Club',
    description: 'Local football enthusiasts',
    sport: 'football',
    members: 45,
    private: false,
  },
  {
    id: '2',
    name: 'Basketball Stars',
    description: 'Competitive basketball players',
    sport: 'basketball',
    members: 32,
    private: true,
  },
  {
    id: '3',
    name: 'Tennis Lovers',
    description: 'Casual tennis players',
    sport: 'tennis',
    members: 28,
    private: false,
  },
];

export default function GroupsScreen() {
  const router = useRouter();
  const [groups, setGroups] = useState(mockGroups);

  const getSportColor = (sport: string) => {
    return theme.sports[sport as keyof typeof theme.sports] || theme.colors.primary;
  };

  const handleJoinGroup = (groupId: string) => {
    Alert.alert('Success', 'You joined the group!');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Groups</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/team/create')}
        >
          <Ionicons name="add" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={groups}
        renderItem={({ item }) => (
          <Card style={styles.groupCard}>
            <View style={styles.groupHeader}>
              <View style={styles.groupIcon}>
                <Ionicons name="people" size={32} color={theme.colors.primary} />
              </View>
              <View style={styles.groupInfo}>
                <View style={styles.groupTitleRow}>
                  <Text style={styles.groupName}>{item.name}</Text>
                  {item.private && (
                    <Ionicons
                      name="lock-closed"
                      size={16}
                      color={theme.colors.textSecondary}
                    />
                  )}
                </View>
                <Badge
                  label={t(`sports.${item.sport}`)}
                  variant="primary"
                  style={[
                    styles.sportBadge,
                    { backgroundColor: getSportColor(item.sport) },
                  ]}
                />
                <Text style={styles.groupDescription}>{item.description}</Text>
                <View style={styles.groupMeta}>
                  <Ionicons name="people" size={16} color={theme.colors.textSecondary} />
                  <Text style={styles.memberCount}>
                    {item.members} {t('team.members')}
                  </Text>
                </View>
              </View>
            </View>
            <Button
              title={t('buttons.join')}
              onPress={() => handleJoinGroup(item.id)}
              variant="primary"
              size="sm"
              style={styles.joinButton}
            />
          </Card>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>No groups found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl + 20,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
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
  createButton: {
    padding: theme.spacing.xs,
  },
  listContent: {
    padding: theme.spacing.lg,
  },
  groupCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  groupHeader: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  groupIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupInfo: {
    flex: 1,
  },
  groupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  groupName: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  sportBadge: {
    marginBottom: theme.spacing.xs / 2,
    marginTop: theme.spacing.xs,
  },
  groupDescription: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    lineHeight: 20,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs / 2,
  },
  memberCount: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  joinButton: {
    marginTop: theme.spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    padding: theme.spacing.xxl,
    marginTop: theme.spacing.xxl,
  },
  emptyText: {
    ...theme.typography.h3,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.lg,
  },
});
