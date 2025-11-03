import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { Post, Tournament } from '../../types';
import { postService, tournamentService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { t } from '../../utils/i18n';
import XPlayerLogo from '../../components/XPlayerLogo';

export default function HomeScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [postsData, tournamentsData] = await Promise.all([
        postService.getPosts(),
        tournamentService.getTournaments(true),
      ]);
      
      // Show latest 5 posts
      setPosts(postsData.slice(0, 5));
      
      // Show latest 3 active tournaments
      setTournaments(tournamentsData.slice(0, 3));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getSportColor = (sport: string) => {
    return theme.sports[sport as keyof typeof theme.sports] || theme.colors.primary;
  };

  const getSportIcon = (sport: string) => {
    const icons: Record<string, string> = {
      football: 'football',
      basketball: 'basketball',
      tennis: 'tennisball',
      padel: 'trophy',
    };
    return icons[sport] || 'ellipse';
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <XPlayerLogo 
          size={64} 
          color={theme.colors.navy}
          showText={true}
          textColor={theme.colors.mint}
          style={styles.logo} 
        />
        <Text style={styles.headerSubtitle}>{t('app.subtitle')}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('nav.tournaments')}</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/tournaments')}>
            <Text style={styles.seeAll}>{t('common.more')}</Text>
          </TouchableOpacity>
        </View>

        {tournaments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={48} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>{t('common.noResults')}</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {tournaments.map((tournament) => (
              <TouchableOpacity
                key={tournament.id}
                style={styles.tournamentCard}
                onPress={() => router.push(`/tournament/details?id=${tournament.id}`)}
              >
                <View style={[styles.sportBadge, { backgroundColor: getSportColor(tournament.sport) }]}>
                  <Ionicons name={getSportIcon(tournament.sport) as any} size={20} color={theme.colors.surface} />
                </View>
                <Text style={styles.tournamentTitle} numberOfLines={2}>
                  {tournament.title}
                </Text>
                <Text style={styles.tournamentSport}>{tournament.sport}</Text>
                <Text style={styles.tournamentDate}>
                  {new Date(tournament.startDate).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('nav.posts')}</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/posts')}>
            <Text style={styles.seeAll}>{t('common.more')}</Text>
          </TouchableOpacity>
        </View>

        {posts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>{t('common.noResults')}</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/post/create')}
            >
              <Text style={styles.createButtonText}>{t('buttons.createPost')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          posts.map((post) => (
            <TouchableOpacity
              key={post.id}
              style={styles.postCard}
              onPress={() => router.push(`/post/details?id=${post.id}`)}
            >
              <View style={styles.postHeader}>
                <View style={[styles.sportBadge, { backgroundColor: getSportColor(post.sport) }]}>
                  <Ionicons name={getSportIcon(post.sport) as any} size={16} color={theme.colors.surface} />
                </View>
                <View style={styles.postInfo}>
                  <Text style={styles.postNickname}>{post.userNickname}</Text>
                  <Text style={styles.postType}>
                    {post.type === 'teammate' ? t('match.lookingForTeammates') : t('match.lookingForOpponents')}
                  </Text>
                </View>
                <View style={[styles.typeBadge, post.type === 'teammate' && styles.typeBadgeTeammate]}>
                  <Text style={styles.typeBadgeText}>
                    {post.type === 'teammate' ? t('match.title') : 'Vs'}
                  </Text>
                </View>
              </View>
              <Text style={styles.postTitle}>{post.title}</Text>
              <Text style={styles.postDescription} numberOfLines={2}>
                {post.description}
              </Text>
              <Text style={styles.postDate}>
                {new Date(post.createdAt).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/post/create')}
      >
        <Ionicons name="add" size={28} color={theme.colors.surface} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl + 20,
    paddingBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  logo: {
    marginBottom: theme.spacing.sm,
  },
  headerTitle: {
    ...theme.typography.h1,
    color: theme.colors.surface,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    ...theme.typography.body,
    color: theme.colors.surface + 'CC',
  },
  section: {
    padding: theme.spacing.lg,
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
  tournamentCard: {
    width: 200,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginRight: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sportBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  tournamentTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  tournamentSport: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
    marginBottom: theme.spacing.xs,
  },
  tournamentDate: {
    ...theme.typography.caption,
    color: theme.colors.primary,
  },
  postCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  postInfo: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  postNickname: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
  },
  postType: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  typeBadge: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  typeBadgeTeammate: {
    backgroundColor: theme.colors.primary,
  },
  typeBadgeText: {
    ...theme.typography.caption,
    color: theme.colors.surface,
    fontWeight: '600',
  },
  postTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  postDescription: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  postDate: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  createButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
  },
  createButtonText: {
    ...theme.typography.body,
    color: theme.colors.surface,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: theme.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

