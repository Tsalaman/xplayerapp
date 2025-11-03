import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import { Post } from '../../types';
import { postService } from '../../services/api';
import { feedService } from '../../services/feedService';
import { usePagination } from '../../hooks/usePagination';
import { Cursor } from '../../utils/cursor';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import { t } from '../../utils/i18n';
import FloatingActionButton from '../../components/feed/FloatingActionButton';

export default function FeedScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [likes, setLikes] = useState<Record<string, boolean>>({});
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

  // Real-time subscription for likes/comments
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('feed_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes',
        },
        () => {
          refresh();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
        },
        () => {
          refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refresh]);

  // Load likes status
  useEffect(() => {
    if (!user || !posts.length) return;
    
    Promise.all(
      posts.map(async (post) => {
        const isLiked = await feedService.isLiked(post.id, user.id);
        return { postId: post.id, isLiked };
      })
    ).then((results) => {
      const likesMap: Record<string, boolean> = {};
      results.forEach(({ postId, isLiked }) => {
        likesMap[postId] = isLiked;
      });
      setLikes(likesMap);
    });
  }, [posts, user]);

  const handleLike = async (postId: string) => {
    if (!user) return;
    
    const isLiked = likes[postId];
    try {
      if (isLiked) {
        await feedService.unlikePost(postId, user.id);
      } else {
        await feedService.likePost(postId, user.id);
      }
      setLikes((prev) => ({ ...prev, [postId]: !isLiked }));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
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

  const formatTime = (timestamp: string) => {
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const diff = now - then;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const renderFeedItem = ({ item }: { item: Post }) => {
    const isTeammate = item.type === 'teammate';
    return (
      <Card style={styles.feedItem} variant="elevated">
        <View style={styles.feedHeader}>
          <View style={[styles.sportIconContainer, { backgroundColor: getSportColor(item.sport) + '20' }]}>
            <Ionicons 
              name={getSportIcon(item.sport) as any} 
              size={24} 
              color={getSportColor(item.sport)} 
            />
          </View>
          <View style={styles.feedInfo}>
            <Text style={styles.userName}>{item.userNickname}</Text>
            <View style={styles.feedMeta}>
              <Badge
                label={isTeammate ? 'Looking for Teammates' : 'Looking for Opponents'}
                variant="primary"
                style={[
                  styles.typeBadge,
                  { backgroundColor: isTeammate ? theme.colors.primary : theme.colors.secondary }
                ]}
              />
              <Text style={styles.timestamp}>{formatTime(item.createdAt)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.feedContent}>
          <Text style={styles.postTitle}>{item.title}</Text>
          <Text style={styles.contentText} numberOfLines={3}>
            {item.description}
          </Text>
          {item.location && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.locationText}>{item.location}</Text>
            </View>
          )}
          {item.date && (
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.dateText}>{item.date}</Text>
            </View>
          )}
        </View>

        <View style={styles.feedActions}>
          <TouchableOpacity
            style={styles.joinButton}
            onPress={() => router.push(`/post/details?id=${item.id}`)}
          >
            <LinearGradient
              colors={[theme.colors.navy, theme.colors.mint]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.joinButtonGradient}
            >
              <Text style={styles.joinButtonText}>
                {isTeammate ? 'Join Team' : 'Challenge'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.likeButton}
            onPress={() => handleLike(item.id)}
          >
            <Ionicons
              name={likes[item.id] ? 'heart' : 'heart-outline'}
              size={20}
              color={likes[item.id] ? theme.colors.error : theme.colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.messageButton}
            onPress={() => router.push(`/post/details?id=${item.id}`)}
          >
            <Ionicons name="chatbubble-outline" size={20} color={theme.colors.navy} />
            <Text style={styles.actionText}>Message</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  const renderFooter = () => {
    if (!loading || !hasMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadMore();
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderFeedItem}
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
              <Ionicons name="newspaper-outline" size={64} color={theme.colors.textSecondary} />
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
      
      {/* Floating Action Button */}
      <FloatingActionButton />
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
  feedItem: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  sportIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedInfo: {
    flex: 1,
  },
  userName: {
    ...theme.typography.h4,
    color: theme.colors.navy,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  feedMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  typeBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  timestamp: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  feedContent: {
    marginBottom: theme.spacing.md,
  },
  postTitle: {
    ...theme.typography.h3,
    color: theme.colors.navy,
    marginBottom: theme.spacing.sm,
  },
  contentText: {
    ...theme.typography.body,
    color: theme.colors.text,
    lineHeight: 24,
    marginBottom: theme.spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  locationText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  dateText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  feedActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  joinButton: {
    flex: 1,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.mint,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  joinButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  joinButtonText: {
    ...theme.typography.body,
    color: theme.colors.surface,
    fontWeight: '700',
  },
  likeButton: {
    padding: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  actionText: {
    ...theme.typography.caption,
    color: theme.colors.navy,
    marginLeft: theme.spacing.xs,
  },
  footerLoader: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
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
    backgroundColor: theme.colors.navy,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
  },
  createButtonText: {
    ...theme.typography.body,
    color: theme.colors.surface,
    fontWeight: '600',
  },
});

