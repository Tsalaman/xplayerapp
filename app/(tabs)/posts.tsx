import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { Post } from '../../types';
import { postService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { usePagination } from '../../hooks/usePagination';
import { Cursor } from '../../utils/cursor';

export default function PostsScreen() {
  const router = useRouter();

  const { items: posts, loading, error, hasMore, loadMore, refresh } = usePagination({
    fetchPage: async (cursor: Cursor, limit: number) => {
      const result = await postService.getPostsPaginated(limit, cursor);
      return {
        data: result.data,
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      };
    },
    limit: 20,
  });

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadMore();
    }
  };

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
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

  const renderPost = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={styles.postCard}
      onPress={() => router.push(`/post/details?id=${item.id}`)}
    >
      <View style={styles.postHeader}>
        <View style={[styles.sportBadge, { backgroundColor: getSportColor(item.sport) }]}>
          <Ionicons name={getSportIcon(item.sport) as any} size={20} color={theme.colors.surface} />
        </View>
        <View style={styles.postInfo}>
          <Text style={styles.postNickname}>{item.userNickname}</Text>
          <Text style={styles.postType}>
            Looking for {item.type === 'teammate' ? 'Teammates' : 'Opponents'}
          </Text>
        </View>
        <View style={[styles.typeBadge, item.type === 'teammate' && styles.typeBadgeTeammate]}>
          <Text style={styles.typeBadgeText}>
            {item.type === 'teammate' ? 'Team' : 'Vs'}
          </Text>
        </View>
      </View>
      <Text style={styles.postTitle}>{item.title}</Text>
      <Text style={styles.postDescription} numberOfLines={3}>
        {item.description}
      </Text>
      {item.location && (
        <View style={styles.metaInfo}>
          <Ionicons name="location" size={14} color={theme.colors.textSecondary} />
          <Text style={styles.metaText}>{item.location}</Text>
        </View>
      )}
      <Text style={styles.postDate}>
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={64} color={theme.colors.textSecondary} />
              <Text style={styles.emptyText}>No posts yet</Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push('/post/create')}
              >
                <Text style={styles.createButtonText}>Create First Post</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/post/create')}
      >
        <Ionicons name="add" size={28} color={theme.colors.surface} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    padding: theme.spacing.lg,
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
  sportBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  metaText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  postDate: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    padding: theme.spacing.xxl,
    marginTop: theme.spacing.xxl,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  createButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
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
  footerLoader: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
});

