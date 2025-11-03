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
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import { t } from '../../utils/i18n';

const searchCategories = [
  { id: 'players', label: t('search.players'), icon: 'people' },
  { id: 'teams', label: t('search.teams'), icon: 'people' },
  { id: 'matches', label: t('search.matches'), icon: 'football' },
  { id: 'courts', label: t('search.courts'), icon: 'location' },
];

// Mock search results
const mockPlayers = [
  { id: '1', name: 'Alex Smith', sport: 'football', location: 'Athens' },
  { id: '2', name: 'John Doe', sport: 'basketball', location: 'Thessaloniki' },
];

const mockTeams = [
  { id: '1', name: 'Athens FC', sport: 'football', members: 12 },
  { id: '2', name: 'Basketball Stars', sport: 'basketball', members: 8 },
];

const mockMatches = [
  { id: '1', title: 'Football Match', sport: 'football', location: 'Athens', date: '2024-12-15' },
  { id: '2', title: 'Basketball Game', sport: 'basketball', location: 'Thessaloniki', date: '2024-12-16' },
];

const mockCourts = [
  { id: '1', name: 'Athens Stadium', sport: 'football', location: 'Athens' },
  { id: '2', name: 'Basketball Arena', sport: 'basketball', location: 'Thessaloniki' },
];

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('players');
  const [results, setResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = () => {
    if (!query.trim()) return;

    setHasSearched(true);
    // Mock search - in production, call search service
    switch (selectedCategory) {
      case 'players':
        setResults(mockPlayers.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())));
        break;
      case 'teams':
        setResults(mockTeams.filter((t) => t.name.toLowerCase().includes(query.toLowerCase())));
        break;
      case 'matches':
        setResults(mockMatches.filter((m) => m.title.toLowerCase().includes(query.toLowerCase())));
        break;
      case 'courts':
        setResults(mockCourts.filter((c) => c.name.toLowerCase().includes(query.toLowerCase())));
        break;
      default:
        setResults([]);
    }
  };

  const getSportColor = (sport: string) => {
    return theme.sports[sport as keyof typeof theme.sports] || theme.colors.primary;
  };

  const renderPlayer = (player: any) => (
    <Card key={player.id} style={styles.resultCard}>
      <View style={styles.resultHeader}>
        <Avatar name={player.name} size="md" />
        <View style={styles.resultInfo}>
          <Text style={styles.resultName}>{player.name}</Text>
          <Badge
            label={t(`sports.${player.sport}`)}
            variant="primary"
            style={[styles.sportBadge, { backgroundColor: getSportColor(player.sport) }]}
          />
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color={theme.colors.textSecondary} />
            <Text style={styles.location}>{player.location}</Text>
          </View>
        </View>
        <Button
          title={t('buttons.viewProfile')}
          onPress={() => router.push(`/profile/${player.id}`)}
          variant="outline"
          size="sm"
        />
      </View>
    </Card>
  );

  const renderTeam = (team: any) => (
    <Card key={team.id} style={styles.resultCard}>
      <View style={styles.resultHeader}>
        <View style={styles.teamIcon}>
          <Ionicons name="people" size={32} color={theme.colors.primary} />
        </View>
        <View style={styles.resultInfo}>
          <Text style={styles.resultName}>{team.name}</Text>
          <Badge
            label={t(`sports.${team.sport}`)}
            variant="primary"
            style={[styles.sportBadge, { backgroundColor: getSportColor(team.sport) }]}
          />
          <Text style={styles.members}>{team.members} {t('team.members')}</Text>
        </View>
        <Button
          title={t('buttons.viewTeam')}
          onPress={() => router.push(`/team/manage?id=${team.id}`)}
          variant="outline"
          size="sm"
        />
      </View>
    </Card>
  );

  const renderMatch = (match: any) => (
    <Card key={match.id} style={styles.resultCard}>
      <View style={styles.resultHeader}>
        <Badge
          label={t(`sports.${match.sport}`)}
          variant="primary"
          style={[styles.sportBadgeLarge, { backgroundColor: getSportColor(match.sport) }]}
        />
        <View style={styles.resultInfo}>
          <Text style={styles.resultName}>{match.title}</Text>
          <View style={styles.matchInfo}>
            <Ionicons name="location" size={14} color={theme.colors.textSecondary} />
            <Text style={styles.location}>{match.location}</Text>
          </View>
          <View style={styles.matchInfo}>
            <Ionicons name="calendar" size={14} color={theme.colors.textSecondary} />
            <Text style={styles.date}>{match.date}</Text>
          </View>
        </View>
        <Button
          title={t('buttons.viewMatch')}
          onPress={() => router.push(`/post/details?id=${match.id}`)}
          variant="primary"
          size="sm"
        />
      </View>
    </Card>
  );

  const renderCourt = (court: any) => (
    <Card key={court.id} style={styles.resultCard}>
      <View style={styles.resultHeader}>
        <View style={styles.courtIcon}>
          <Ionicons name="location" size={32} color={theme.colors.primary} />
        </View>
        <View style={styles.resultInfo}>
          <Text style={styles.resultName}>{court.name}</Text>
          <Badge
            label={t(`sports.${court.sport}`)}
            variant="primary"
            style={[styles.sportBadge, { backgroundColor: getSportColor(court.sport) }]}
          />
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color={theme.colors.textSecondary} />
            <Text style={styles.location}>{court.location}</Text>
          </View>
        </View>
        <Button
          title="View"
          onPress={() => router.push(`/venues/${court.id}`)}
          variant="outline"
          size="sm"
        />
      </View>
    </Card>
  );

  const renderResults = () => {
    if (!hasSearched) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={styles.emptyText}>{t('search.title')}</Text>
          <Text style={styles.emptySubtext}>
            Enter a search query to find players, teams, matches, or courts
          </Text>
        </View>
      );
    }

    if (results.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="close-circle-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={styles.emptyText}>{t('search.noResults')}</Text>
        </View>
      );
    }

    return (
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsCount}>{results.length} results found</Text>
        {results.map((result) => {
          switch (selectedCategory) {
            case 'players':
              return renderPlayer(result);
            case 'teams':
              return renderTeam(result);
            case 'matches':
              return renderMatch(result);
            case 'courts':
              return renderCourt(result);
            default:
              return null;
          }
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('search.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchSection}>
        <Input
          placeholder={t('search.placeholder')}
          value={query}
          onChangeText={setQuery}
          leftIcon="search"
          rightIcon="close"
          onRightIconPress={() => setQuery('')}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          style={styles.searchInput}
        />
        <Button
          title={t('buttons.search')}
          onPress={handleSearch}
          variant="primary"
          style={styles.searchButton}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categories}
        contentContainerStyle={styles.categoriesContent}
      >
        {searchCategories.map((category) => (
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

      <ScrollView style={styles.results} contentContainerStyle={styles.resultsContent}>
        {renderResults()}
      </ScrollView>
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
  placeholder: {
    width: 40,
  },
  searchSection: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchInput: {
    marginBottom: theme.spacing.md,
  },
  searchButton: {
    width: '100%',
  },
  categories: {
    maxHeight: 60,
  },
  categoriesContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
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
    gap: theme.spacing.xs,
    marginRight: theme.spacing.sm,
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
  results: {
    flex: 1,
  },
  resultsContent: {
    padding: theme.spacing.lg,
  },
  resultsContainer: {
    gap: theme.spacing.md,
  },
  resultsCount: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  resultCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs / 2,
  },
  sportBadge: {
    marginBottom: theme.spacing.xs / 2,
  },
  sportBadgeLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs / 2,
  },
  location: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  matchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs / 2,
  },
  date: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  members: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs / 2,
  },
  teamIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  courtIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: theme.spacing.md,
  },
  emptySubtext: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
