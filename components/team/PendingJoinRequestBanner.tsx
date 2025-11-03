import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import { teamService } from '../../services/teams';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';

interface PendingJoinRequestBannerProps {
  teamId: string;
  onRequestApproved?: () => void;
}

/**
 * Pending Join Request Banner
 * - Shows banner if user has pending join request
 * - Updates in real-time via Supabase subscriptions
 */
export default function PendingJoinRequestBanner({
  teamId,
  onRequestApproved,
}: PendingJoinRequestBannerProps) {
  const { user } = useAuth();
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !teamId) return;

    checkPendingRequest();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('join_requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_join_requests',
          filter: `team_id=eq.${teamId}`,
        },
        () => {
          checkPendingRequest();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId, user]);

  const checkPendingRequest = async () => {
    if (!user || !teamId) return;

    try {
      const request = await teamService.getUserPendingRequest(teamId, user.id);
      setHasPendingRequest(!!request);
      
      if (request && request.status === 'approved' && onRequestApproved) {
        onRequestApproved();
      }
    } catch (error) {
      console.error('Error checking pending request:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !hasPendingRequest) return null;

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel="Join request pending"
      accessibilityLiveRegion="polite"
    >
      <LinearGradient
        colors={[theme.colors.mint + '20', theme.colors.navy + '20']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Ionicons name="time-outline" size={20} color={theme.colors.mint} />
          <Text style={styles.text}>Join Request Pending</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  gradient: {
    padding: theme.spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  text: {
    ...theme.typography.body,
    color: theme.colors.mint,
    fontWeight: '600',
  },
});

