import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { t } from '../../utils/i18n';

const categories = [
  { id: 'matches', label: t('nav.matches'), icon: 'football' },
  { id: 'players', label: t('nav.profile'), icon: 'people' },
  { id: 'teams', label: t('nav.teams'), icon: 'people' },
  { id: 'courts', label: t('nav.matches'), icon: 'location' },
];

const featuredMatches = [
  { id: '1', title: 'Football Match', sport: 'football', location: 'Athens', date: '2024-12-15' },
  { id: '2', title: 'Basketball Game', sport: 'basketball', location: 'Thessaloniki', date: '2024-12-16' },
  { id: '3', title: 'Tennis Tournament', sport: 'tennis', location: 'Patras', date: '2024-12-17' },
];

const nearbyPlayers = [
  { id: '1', name: 'Alex Smith', sport: 'football', distance: '2 km' },
  { id: '2', name: 'John Doe', sport: 'basketball', distance: '5 km' },
  { id: '3', name: 'Maria Garcia', sport: 'tennis', distance: '3 km' },
];

export default function ExploreScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('matches');

  const getSportColor = (sport: string) => {
    return theme.sports[sport as keyof typeof theme.sports] || theme.colors.primary;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('nav.explore')}</Text>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => router.push('/search')}
        >
          <Ionicons name="search" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && styles.categoryButtonSelected,
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Ionicons
              name={category.icon as any}
              size={20}
              color={
                selectedCategory === category.id
                  ? theme.colors.primary
                  : theme.colors.textSecondary
              }
            />
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category.id && styles.categoryTextSelected,
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Matches</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/matches')}>
            <Text style={styles.seeAll}>{t('common.more')}</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          horizontal
          data={featuredMatches}
          renderItem={({ item }) => (
            <Card style={styles.matchCard}>
              <Badge
                label={t(`sports.${item.sport}`)}
                variant="primary"
                style={[styles.sportBadge, { backgroundColor: getSportColor(item.sport) }]}
              />
              <Text style={styles.matchTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <View style={styles.matchInfo}>
                <Ionicons name="location" size={14} color={theme.colors.textSecondary} />
                <Text style={styles.matchLocation}>{item.location}</Text>
              </View>
              <View style={styles.matchInfo}>
                <Ionicons name="calendar" size={14} color={theme.colors.textSecondary} />
                <Text style={styles.matchDate}>{item.date}</Text>
              </View>
              <Button
                title={t('buttons.join')}
                onPress={() => router.push(`/matches/${item.id}/live`)}
                variant="primary"
                size="sm"
                style={styles.joinButton}
              />
            </Card>
          )}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.matchesList}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nearby Players</Text>
          <TouchableOpacity onPress={() => router.push('/matches/swipe')}>
            <Text style={styles.seeAll}>{t('common.more')}</Text>
          </TouchableOpacity>
        </View>
        {nearbyPlayers.map((player) => (
          <Card key={player.id} style={styles.playerCard}>
            <View style={styles.playerInfo}>
              <View style={styles.playerDetails}>
                <Text style={styles.playerName}>{player.name}</Text>
                <Text style={styles.playerSport}>{t(`sports.${player.sport}`)}</Text>
                <View style={styles.distanceRow}>
                  <Ionicons name="location" size={14} color={theme.colors.textSecondary} />
                  <Text style={styles.distance}>{player.distance} away</Text>
                </View>
              </View>
              <Button
                title={t('buttons.follow')}
                onPress={() => {}}
                variant="outline"
                size="sm"
              />
            </View>
          </Card>
        ))}
      </View>
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
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
  },
  searchButton: {
    padding: theme.spacing.xs,
  },
  categories: {
    marginBottom: theme.spacing.xl,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  categoryButtonSelected: {
    backgroundColor: theme.colors.primary + '20',
    borderColor: theme.colors.primary,
  },
  categoryText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  categoryTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
  },
  seeAll: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  matchesList: {
    paddingRight: theme.spacing.lg,
  },
  matchCard: {
    width: 200,
    padding: theme.spacing.md,
    marginRight: theme.spacing.md,
  },
  sportBadge: {
    marginBottom: theme.spacing.sm,
  },
  matchTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  matchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  matchLocation: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  matchDate: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  joinButton: {
    marginTop: theme.spacing.md,
  },
  playerCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  playerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs / 2,
  },
  playerSport: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs / 2,
    textTransform: 'capitalize',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  distance: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
});

