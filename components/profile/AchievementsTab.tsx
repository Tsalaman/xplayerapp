import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import { profileService } from '../../services/profileService';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import haptic from '../../utils/haptic';

/**
 * Achievements Tab Component
 * - Fetch from user_achievements
 * - Unlock animation when progress == target
 * - XP toast on unlock
 * - Update profile XP
 */
export default function AchievementsTab() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [sparkleAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (user) {
      loadAchievements();
      subscribeToAchievements();
    }
  }, [user]);

  const loadAchievements = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await profileService.getAchievements(user.id);
      
      // Process achievements
      const processed = data.map((ua: any) => {
        const achievement = ua.achievements;
        const progress = ua.progress || 0;
        const target = achievement?.target || 1;
        const isUnlocked = ua.unlocked || progress >= target;

        // Check if should unlock now
        if (!ua.unlocked && progress >= target) {
          unlockAchievement(ua.id, achievement);
        }

        return {
          id: ua.id,
          achievementId: achievement?.id,
          name: achievement?.name || 'Achievement',
          description: achievement?.description || '',
          icon: achievement?.icon || 'trophy',
          xp: achievement?.xp || 0,
          progress,
          target,
          unlocked: isUnlocked,
          unlockedAt: ua.unlocked_at,
        };
      });

      setAchievements(processed);
      
      // Track unlocked IDs for animations
      const unlocked = new Set<string>();
      processed.forEach((a: any) => {
        if (a.unlocked) {
          unlocked.add(a.id);
        }
      });
      setUnlockedIds(unlocked);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToAchievements = () => {
    if (!user) return;

    const channel = supabase
      .channel('achievements_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_achievements',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Check if unlocked
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
      const profile = await profileService.getProfile(user!.id);
      const newXp = (profile.xp || 0) + (achievement.xp || 0);
      
      await profileService.updateProfile(user!.id, {
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

      haptic.medium();
      
      // Show XP toast (would need react-native-toast-message)
      // toast.success(`+${achievement.xp} XP unlocked!`);
    } catch (error) {
      console.error('Error unlocking achievement:', error);
    }
  };

  const getIconColor = (achievement: any) => {
    return achievement.unlocked ? theme.colors.mint : theme.colors.textSecondary;
  };

  const getProgressColor = (progress: number, target: number) => {
    const percentage = (progress / target) * 100;
    if (percentage >= 100) return theme.colors.success;
    if (percentage >= 50) return theme.colors.warning;
    return theme.colors.mint;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.mint} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {achievements.map((achievement) => {
        const progressPercentage = Math.min((achievement.progress / achievement.target) * 100, 100);
        const isUnlocked = achievement.unlocked;

        return (
          <View
            key={achievement.id}
            style={[
              styles.achievementCard,
              isUnlocked && styles.achievementCardUnlocked,
            ]}
          >
            {isUnlocked && (
              <Animated.View
                style={[
                  styles.sparkleContainer,
                  {
                    opacity: sparkleAnim,
                    transform: [
                      {
                        scale: sparkleAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1.2],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Ionicons name="sparkles" size={24} color={theme.colors.mint} />
              </Animated.View>
            )}

            <View style={styles.achievementHeader}>
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: getIconColor(achievement) + '20',
                  },
                ]}
              >
                <Ionicons
                  name={achievement.icon as any}
                  size={32}
                  color={getIconColor(achievement)}
                />
              </View>
              <View style={styles.achievementInfo}>
                <Text style={[styles.achievementName, !isUnlocked && styles.achievementNameLocked]}>
                  {achievement.name}
                </Text>
                <Text style={styles.achievementDescription}>
                  {achievement.description}
                </Text>
              </View>
              {isUnlocked && (
                <View style={styles.unlockedBadge}>
                  <Ionicons name="checkmark-circle" size={24} color={theme.colors.mint} />
                </View>
              )}
            </View>

            {/* Progress Bar */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressText}>
                  {achievement.progress} / {achievement.target}
                </Text>
                {isUnlocked && (
                  <Text style={styles.xpText}>+{achievement.xp} XP</Text>
                )}
              </View>
              <View style={styles.progressBarContainer}>
                <LinearGradient
                  colors={[theme.colors.mint, theme.colors.surface]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${progressPercentage}%`,
                      backgroundColor: isUnlocked
                        ? theme.colors.success
                        : getProgressColor(achievement.progress, achievement.target),
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: theme.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  achievementCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  achievementCardUnlocked: {
    borderColor: theme.colors.mint,
    borderWidth: 2,
    backgroundColor: theme.colors.mint + '05',
  },
  sparkleContainer: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    zIndex: 10,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    ...theme.typography.h3,
    color: theme.colors.navy,
    fontWeight: '700',
    marginBottom: theme.spacing.xs / 2,
  },
  achievementNameLocked: {
    color: theme.colors.textSecondary,
    opacity: 0.6,
  },
  achievementDescription: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  unlockedBadge: {
    marginLeft: theme.spacing.sm,
  },
  progressSection: {
    marginTop: theme.spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  progressText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  xpText: {
    ...theme.typography.caption,
    color: theme.colors.mint,
    fontWeight: '700',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: theme.borderRadius.full,
  },
});

