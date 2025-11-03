import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import Dialog from './ui/Dialog';
import InputField from './ui/InputField';
import GradientButton from './ui/GradientButton';
import { t } from '../utils/i18n';

interface MatchResultModalProps {
  visible: boolean;
  matchId: string;
  participants: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function MatchResultModal({
  visible,
  matchId,
  participants,
  onClose,
  onSuccess,
}: MatchResultModalProps) {
  const { user } = useAuth();
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [selectedMvp, setSelectedMvp] = useState<string | null>(null);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const home = parseInt(homeScore);
    const away = parseInt(awayScore);

    if (isNaN(home) || isNaN(away)) {
      Alert.alert('Error', 'Please enter valid scores');
      return;
    }

    if (home < 0 || away < 0) {
      Alert.alert('Error', 'Scores cannot be negative');
      return;
    }

    setLoading(true);
    try {
      // Call RPC function to submit match result
      const { data, error } = await supabase.rpc('submit_match_result', {
        p_match_id: matchId,
        p_score_home: home,
        p_score_away: away,
        p_mvp_player_id: selectedMvp || null,
        p_comments: comments || null,
      });

      if (error) throw error;

      // Success!
      Alert.alert('Success', 'Match result submitted successfully!');
      
      // Reset form
      setHomeScore('');
      setAwayScore('');
      setSelectedMvp(null);
      setComments('');
      
      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error: any) {
      console.error('Error submitting match result:', error);
      Alert.alert('Error', error.message || 'Failed to submit match result. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateScore = (team: 'home' | 'away', increment: number) => {
    const currentValue = team === 'home' ? homeScore : awayScore;
    const newValue = Math.max(0, (parseInt(currentValue) || 0) + increment);
    if (team === 'home') {
      setHomeScore(newValue.toString());
    } else {
      setAwayScore(newValue.toString());
    }
  };

  return (
    <Dialog
      visible={visible}
      title="Submit Match Result"
      onClose={onClose}
      showCloseButton={!loading}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Score Section */}
          <Text style={styles.label}>Score</Text>
          
          <View style={styles.scoreContainer}>
            <View style={styles.teamScore}>
              <Text style={styles.teamLabel}>
                {participants[0]?.name || 'Home'}
              </Text>
              <View style={styles.scoreInputContainer}>
                <TouchableOpacity
                  style={styles.scoreButton}
                  onPress={() => updateScore('home', -1)}
                  disabled={loading}
                >
                  <Ionicons name="remove" size={20} color={theme.colors.error} />
                </TouchableOpacity>
                <TextInput
                  style={styles.scoreInput}
                  value={homeScore}
                  onChangeText={setHomeScore}
                  keyboardType="numeric"
                  placeholder="0"
                  textAlign="center"
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.scoreButton}
                  onPress={() => updateScore('home', 1)}
                  disabled={loading}
                >
                  <Ionicons name="add" size={20} color={theme.colors.mint} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.vsContainer}>
              <Text style={styles.vs}>VS</Text>
            </View>

            <View style={styles.teamScore}>
              <Text style={styles.teamLabel}>
                {participants[1]?.name || 'Away'}
              </Text>
              <View style={styles.scoreInputContainer}>
                <TouchableOpacity
                  style={styles.scoreButton}
                  onPress={() => updateScore('away', -1)}
                  disabled={loading}
                >
                  <Ionicons name="remove" size={20} color={theme.colors.error} />
                </TouchableOpacity>
                <TextInput
                  style={styles.scoreInput}
                  value={awayScore}
                  onChangeText={setAwayScore}
                  keyboardType="numeric"
                  placeholder="0"
                  textAlign="center"
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.scoreButton}
                  onPress={() => updateScore('away', 1)}
                  disabled={loading}
                >
                  <Ionicons name="add" size={20} color={theme.colors.mint} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* MVP Section */}
          {participants.length > 0 && (
            <View style={styles.mvpSection}>
              <Text style={styles.label}>MVP Player (Optional)</Text>
              <View style={styles.mvpContainer}>
                {participants.map((participant) => (
                  <TouchableOpacity
                    key={participant.id}
                    style={[
                      styles.mvpOption,
                      selectedMvp === participant.id && styles.mvpOptionSelected,
                    ]}
                    onPress={() =>
                      !loading &&
                      setSelectedMvp(
                        selectedMvp === participant.id ? null : participant.id
                      )
                    }
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.mvpText,
                        selectedMvp === participant.id && styles.mvpTextSelected,
                      ]}
                    >
                      {participant.name}
                    </Text>
                    {selectedMvp === participant.id && (
                      <Ionicons name="checkmark-circle" size={24} color={theme.colors.mint} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <InputField
              label="Comments (Optional)"
              placeholder="Add any comments about the match..."
              value={comments}
              onChangeText={setComments}
              multiline
              numberOfLines={4}
              editable={!loading}
              style={styles.commentsInput}
            />
          </View>

          {/* Submit Button */}
          <View style={styles.buttonContainer}>
            <GradientButton
              title={loading ? 'Submitting...' : 'Submit Result'}
              onPress={handleSubmit}
              disabled={loading}
            />
            {loading && (
              <ActivityIndicator
                size="small"
                color={theme.colors.mint}
                style={styles.loader}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    maxHeight: 600,
  },
  content: {
    padding: theme.spacing.md,
  },
  label: {
    ...theme.typography.h3,
    color: theme.colors.surface,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  teamScore: {
    flex: 1,
    alignItems: 'center',
  },
  teamLabel: {
    ...theme.typography.body,
    color: theme.colors.surface,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
    fontWeight: '600',
  },
  scoreInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  scoreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.navyDark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.mint + '40',
  },
  scoreInput: {
    width: 70,
    height: 56,
    borderWidth: 2,
    borderColor: theme.colors.mint + '60',
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.navyDark,
    ...theme.typography.h1,
    color: theme.colors.mint,
    fontWeight: '700',
  },
  vsContainer: {
    paddingHorizontal: theme.spacing.md,
  },
  vs: {
    ...theme.typography.h2,
    color: theme.colors.mint,
    fontWeight: '700',
  },
  mvpSection: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  mvpContainer: {
    gap: theme.spacing.sm,
  },
  mvpOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.mint + '40',
    backgroundColor: theme.colors.navyDark,
  },
  mvpOptionSelected: {
    borderColor: theme.colors.mint,
    backgroundColor: theme.colors.mint + '20',
  },
  mvpText: {
    ...theme.typography.body,
    color: theme.colors.surface,
    fontWeight: '500',
  },
  mvpTextSelected: {
    color: theme.colors.mint,
    fontWeight: '700',
  },
  commentsSection: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  commentsInput: {
    backgroundColor: theme.colors.navyDark,
    borderColor: theme.colors.mint + '40',
    color: theme.colors.surface,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    marginTop: theme.spacing.lg,
  },
  loader: {
    marginTop: theme.spacing.sm,
  },
});
