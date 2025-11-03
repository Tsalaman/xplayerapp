import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../../constants/theme';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
  style?: ViewStyle;
}

export default function ProgressIndicator({
  currentStep,
  totalSteps,
  labels,
  style,
}: ProgressIndicatorProps) {
  const percentage = (currentStep / totalSteps) * 100;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${percentage}%` },
          ]}
        />
      </View>
      {labels && labels.length > 0 ? (
        <View style={styles.labels}>
          {labels.map((label, index) => (
            <View key={index} style={styles.labelContainer}>
              <View
                style={[
                  styles.stepDot,
                  index < currentStep && styles.stepDotCompleted,
                  index === currentStep && styles.stepDotActive,
                ]}
              />
              {label && (
                <Text
                  style={[
                    styles.labelText,
                    index === currentStep && styles.labelTextActive,
                  ]}
                >
                  {label}
                </Text>
              )}
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.stepText}>
          Step {currentStep} of {totalSteps}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  labelContainer: {
    alignItems: 'center',
    flex: 1,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.border,
    marginBottom: theme.spacing.xs / 2,
  },
  stepDotCompleted: {
    backgroundColor: theme.colors.primary,
  },
  stepDotActive: {
    backgroundColor: theme.colors.primary,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  labelText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontSize: 10,
    textAlign: 'center',
  },
  labelTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  stepText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

