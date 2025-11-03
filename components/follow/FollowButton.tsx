import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { followService } from '../../services/follows';
import { theme } from '../../constants/theme';
import GradientButton from '../ui/GradientButton';

interface FollowButtonProps {
  userId: string;
  variant?: 'default' | 'gradient' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  onFollowChange?: (isFollowing: boolean) => void;
}

export default function FollowButton({
  userId,
  variant = 'default',
  size = 'md',
  onFollowChange,
}: FollowButtonProps) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkFollowStatus();
  }, [userId]);

  const checkFollowStatus = async () => {
    if (!user || !userId || user.id === userId) {
      setChecking(false);
      return;
    }

    try {
      const following = await followService.isFollowing(userId);
      setIsFollowing(following);
    } catch (error) {
      console.error('Error checking follow status:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!user || !userId || user.id === userId || loading) return;

    setLoading(true);
    try {
      if (isFollowing) {
        await followService.unfollowUser(userId);
        setIsFollowing(false);
        onFollowChange?.(false);
      } else {
        await followService.followUser(userId);
        setIsFollowing(true);
        onFollowChange?.(true);
      }
    } catch (error: any) {
      console.error('Error toggling follow:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.id === userId) return null;

  if (checking) {
    return (
      <TouchableOpacity style={[styles.button, styles[size]]} disabled>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </TouchableOpacity>
    );
  }

  if (variant === 'gradient') {
    return (
      <GradientButton
        title={isFollowing ? 'Following' : 'Follow'}
        onPress={handleToggleFollow}
        loading={loading}
        disabled={loading}
      />
    );
  }

  if (variant === 'outline') {
    return (
      <TouchableOpacity
        style={[
          styles.outlineButton,
          styles[size],
          isFollowing && styles.outlineButtonFollowing,
          loading && styles.disabled,
        ]}
        onPress={handleToggleFollow}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={isFollowing ? theme.colors.primary : theme.colors.navy}
          />
        ) : (
          <>
            <Ionicons
              name={isFollowing ? 'checkmark' : 'add'}
              size={16}
              color={isFollowing ? theme.colors.primary : theme.colors.navy}
            />
            <Text
              style={[
                styles.outlineButtonText,
                isFollowing && styles.outlineButtonTextFollowing,
              ]}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[size],
        isFollowing && styles.buttonFollowing,
        loading && styles.disabled,
      ]}
      onPress={handleToggleFollow}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isFollowing ? theme.colors.surface : theme.colors.primary}
        />
      ) : (
        <>
          <Ionicons
            name={isFollowing ? 'checkmark' : 'person-add'}
            size={16}
            color={isFollowing ? theme.colors.surface : theme.colors.primary}
          />
          <Text
            style={[
              styles.buttonText,
              isFollowing && styles.buttonTextFollowing,
            ]}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
    minWidth: 100,
  },
  sm: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: 32,
  },
  md: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    minHeight: 40,
  },
  lg: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    minHeight: 48,
  },
  buttonFollowing: {
    backgroundColor: theme.colors.navy,
  },
  buttonText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.surface,
    fontWeight: '600',
  },
  buttonTextFollowing: {
    color: theme.colors.surface,
  },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.navy,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
    minWidth: 100,
  },
  outlineButtonFollowing: {
    borderColor: theme.colors.primary,
  },
  outlineButtonText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.navy,
    fontWeight: '600',
  },
  outlineButtonTextFollowing: {
    color: theme.colors.primary,
  },
  disabled: {
    opacity: 0.6,
  },
});

