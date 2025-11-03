import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../../constants/theme';
import { Post } from '../../types';
import { postService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function PostDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [post, setPost] = useState<Post | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadPost();
  }, [id]);

  const loadPost = async () => {
    if (!id || typeof id !== 'string') return;
    
    try {
      const postData = await postService.getPost(id);
      setPost(postData);
    } catch (error) {
      console.error('Error loading post:', error);
    }
  };

  if (!post) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Post not found</Text>
        </View>
      </View>
    );
  }

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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.postHeader}>
        <View style={[styles.sportBadge, { backgroundColor: getSportColor(post.sport) }]}>
          <Ionicons name={getSportIcon(post.sport) as any} size={32} color={theme.colors.surface} />
        </View>
        <View style={styles.postInfo}>
          <Text style={styles.postNickname}>{post.userNickname}</Text>
          <Text style={styles.postType}>
            Looking for {post.type === 'teammate' ? 'Teammates' : 'Opponents'}
          </Text>
        </View>
        <View style={[styles.typeBadge, post.type === 'teammate' && styles.typeBadgeTeammate]}>
          <Text style={styles.typeBadgeText}>
            {post.type === 'teammate' ? 'Team' : 'Vs'}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{post.title}</Text>
        <Text style={styles.description}>{post.description}</Text>
      </View>

      {(post.location || post.date || post.time) && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Details</Text>
          {post.location && (
            <View style={styles.detailRow}>
              <Ionicons name="location" size={20} color={theme.colors.primary} />
              <Text style={styles.detailText}>{post.location}</Text>
            </View>
          )}
          {post.date && (
            <View style={styles.detailRow}>
              <Ionicons name="calendar" size={20} color={theme.colors.primary} />
              <Text style={styles.detailText}>{post.date}</Text>
            </View>
          )}
          {post.time && (
            <View style={styles.detailRow}>
              <Ionicons name="time" size={20} color={theme.colors.primary} />
              <Text style={styles.detailText}>{post.time}</Text>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity style={styles.contactButton}>
        <Ionicons name="chatbubble" size={20} color={theme.colors.surface} />
        <Text style={styles.contactButtonText}>Contact {post.userNickname}</Text>
      </TouchableOpacity>

      <Text style={styles.date}>
        Posted on {new Date(post.createdAt).toLocaleDateString()}
      </Text>
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
    marginBottom: theme.spacing.md,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  sportBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  postNickname: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  postType: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  typeBadge: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  typeBadgeTeammate: {
    backgroundColor: theme.colors.primary,
  },
  typeBadgeText: {
    ...theme.typography.body,
    color: theme.colors.surface,
    fontWeight: '600',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 24,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  detailText: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  contactButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  contactButtonText: {
    ...theme.typography.h3,
    color: theme.colors.surface,
    marginLeft: theme.spacing.sm,
  },
  date: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    ...theme.typography.h3,
    color: theme.colors.textSecondary,
  },
});

