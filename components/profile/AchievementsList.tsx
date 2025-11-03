import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { profileService } from '../../services/profileService';
import { supabase } from '../../services/supabase';

interface AchievementsListProps {
  userId: string;
}

/**
 * Achievements List Component
 * - Fetches from user_achievements
 * - Shows unlock animation when progress == target
 */
export default function AchievementsList({ userId }: AchievementsListProps) {
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [sparkleAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (userId) {
      loadAchievements();
      subscribeToAchievements();
    }
  }, [userId]);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const data = await profileService.getAchievements(userId);
      
      const processed = data.map((ua: any) => {
        const achievement = ua.achievements;
        const progress = ua.progress || 0;
        const target = achievement?.target || 1;
        const isUnlocked = ua.unlocked || progress >= target;

        // Auto-unlock if progress >= target
        if (!ua.unlocked && progress >= target) {
          unlockAchievement(ua.id, achievement);
        }

        return {
          id: ua.id,
          achievementId: achievement?.id,
          name: achievement?.name || 'Achievement',
          icon: achievement?.icon || 'trophy',
          xp: achievement?.xp || 0,
          progress,
          target,
          unlocked: isUnlocked,
        };
      });

      setAchievements(processed);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToAchievements = () => {
    if (!userId) return;

    const channel = supabase
      .channel('achievements_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_achievements',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new.unlocked && !payload.old.unlocked) {
            // New unlock!
            unlockAchievement(payload.new.id, payload.new);
          }
          loadAchievements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const unlockAchievement = async (userAchievementId: string, achievement: any) => {
    try {
      // Update unlocked status
      await supabase
        .from('user_achievements')
        .update({
          unlocked: true,
          unlocked_at: new Date().toISOString(),
        })
        .eq('id', userAchievementId);

      // Add XP to profile
      const profile = await profileService.getProfile(userId);
      const newXp = (profile.xp || 0) + (achievement.xp || 0);
      
      await profileService.updateProfile(userId, {
        xp: newXp,
      });

      // Trigger unlock animation
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error) {
      console.error('Error unlocking achievement:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={theme.colors.mint} />
      </View>
    );
  }

  return (
    <View style={styles.achievementsGrid}>
      {achievements.map((achievement) => (
        <View
          key={achievement.id}
          style={[
            styles.achievementItem,
            !achievement.unlocked && styles.achievementItemLocked,
          ]}
        >
          {achievement.unlocked && (
            <Animated.View
              style={[
                styles.sparkleContainer,
                {
                  opacity: sparkleAnim,
                },
              ]}
            >
              <Ionicons name="sparkles" size={20} color={theme.colors.mint} />
            </Animated.View>
          )}
          <View
            style={[
              styles.achievementIcon,
              !achievement.unlocked && styles.achievementIconLocked,
            ]}
          >
            <Ionicons
              name={achievement.icon as any}
              size={32}
              color={
                achievement.unlocked
                  ? theme.colors.mint
                  : theme.colors.textSecondary
              }
            />
          </View>
          <Text
            style={[
              styles.achievementName,
              !achievement.unlocked && styles.achievementNameLocked,
            ]}
          >
            {achievement.name}
          </Text>
          {!achievement.unlocked && (
            <Ionicons
              name="lock-closed"
              size={16}
              color={theme.colors.textSecondary}
              style={styles.lockIcon}
            />
          )}
          {achievement.unlocked && achievement.xp > 0 && (
            <Text style={styles.xpText}>+{achievement.xp} XP</Text>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  achievementItem: {
    width: '48%',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    position: 'relative',
  },
  achievementItemLocked: {
    opacity: 0.5,
  },
  sparkleContainer: {
    position: 'absolute',
    top: theme.spacing.xs,
    right: theme.spacing.xs,
    zIndex: 10,
  },
  achievementIcon: {
    marginBottom: theme.spacing.sm,
  },
  achievementIconLocked: {
    opacity: 0.5,
  },
  achievementName: {
    ...theme.typography.body,
    color: theme.colors.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  achievementNameLocked: {
    color: theme.colors.textSecondary,
  },
  lockIcon: {
    position: 'absolute',
    top: theme.spacing.xs,
    right: theme.spacing.xs,
  },
  xpText: {
    ...theme.typography.caption,
    color: theme.colors.mint,
    marginTop: theme.spacing.xs / 2,
    fontWeight: '700',
  },
  loadingContainer: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
});

