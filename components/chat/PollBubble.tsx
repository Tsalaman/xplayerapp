import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface PollBubbleProps {
  pollId: string;
  question: string;
  options: PollOption[];
  chatId: string;
}

/**
 * Poll Bubble Component
 * - Displays poll question and options
 * - Real-time vote updates via Supabase subscriptions
 * - User can vote on options
 */
export default function PollBubble({
  pollId,
  question,
  options: initialOptions,
  chatId,
}: PollBubbleProps) {
  const { user } = useAuth();
  const [options, setOptions] = useState<PollOption[]>(initialOptions);
  const [userVote, setUserVote] = useState<string | null>(null);

  // Subscribe to real-time poll vote updates
  useEffect(() => {
    if (!pollId) return;

    const channel = supabase
      .channel(`poll_votes:${pollId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'poll_votes',
          filter: `poll_id=eq.${pollId}`,
        },
        async () => {
          // Refresh poll votes
          const { data, error } = await supabase
            .from('poll_votes')
            .select('option_id')
            .eq('poll_id', pollId);

          if (error) {
            console.error('Error fetching poll votes:', error);
            return;
          }

          // Count votes per option
          const voteCounts: Record<string, number> = {};
          data?.forEach((vote) => {
            voteCounts[vote.option_id] = (voteCounts[vote.option_id] || 0) + 1;
          });

          // Update options with vote counts
          setOptions((prev) =>
            prev.map((opt) => ({
              ...opt,
              votes: voteCounts[opt.id] || 0,
            }))
          );

          // Check if user has voted
          if (user) {
            const { data: userVoteData } = await supabase
              .from('poll_votes')
              .select('option_id')
              .eq('poll_id', pollId)
              .eq('user_id', user.id)
              .single();

            setUserVote(userVoteData?.option_id || null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pollId, user]);

  // Load user's vote on mount
  useEffect(() => {
    if (!user || !pollId) return;

    supabase
      .from('poll_votes')
      .select('option_id')
      .eq('poll_id', pollId)
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setUserVote(data.option_id);
        }
      });
  }, [pollId, user]);

  const handleVote = async (optionId: string) => {
    if (!user || userVote) return; // Can't vote twice

    try {
      await supabase.from('poll_votes').insert({
        poll_id: pollId,
        user_id: user.id,
        option_id: optionId,
      });

      setUserVote(optionId);
    } catch (error) {
      console.error('Error voting on poll:', error);
    }
  };

  const totalVotes = options.reduce((sum, opt) => sum + opt.votes, 0);

  return (
    <View style={styles.container}>
      <View style={styles.pollHeader}>
        <Ionicons name="stats-chart" size={20} color={theme.colors.mint} />
        <Text style={styles.question}>{question}</Text>
      </View>

      {options.map((option) => {
        const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
        const isSelected = userVote === option.id;

        return (
          <TouchableOpacity
            key={option.id}
            style={[styles.option, isSelected && styles.optionSelected]}
            onPress={() => handleVote(option.id)}
            disabled={!!userVote}
          >
            <View style={styles.optionContent}>
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                {option.text}
              </Text>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.mint} />
              )}
            </View>
            {totalVotes > 0 && (
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${percentage}%`,
                      backgroundColor: isSelected ? theme.colors.mint : theme.colors.border,
                    },
                  ]}
                />
              </View>
            )}
            <Text style={styles.voteCount}>
              {option.votes} {option.votes === 1 ? 'vote' : 'votes'}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl * 3, // rounded-3xl
    padding: theme.spacing.md,
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
  pollHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  question: {
    ...theme.typography.h3,
    color: theme.colors.text,
    fontWeight: '700',
    flex: 1,
  },
  option: {
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  optionSelected: {
    borderColor: theme.colors.mint,
    borderWidth: 2,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  optionText: {
    ...theme.typography.body,
    color: theme.colors.text,
    flex: 1,
  },
  optionTextSelected: {
    color: theme.colors.mint,
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
    marginBottom: theme.spacing.xs / 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.borderRadius.full,
  },
  voteCount: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontSize: 10,
  },
});

