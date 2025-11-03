import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { theme } from '../../constants/theme';

interface MatchChartProps {
  data: {
    matches: number[];
    labels: string[];
    wins: number[];
    losses: number[];
  };
  type?: 'bar' | 'line' | 'pie';
}

const screenWidth = Dimensions.get('window').width;

export default function MatchChart({ data, type = 'bar' }: MatchChartProps) {
  if (type === 'bar') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Matches Played</Text>
        <BarChart
          data={{
            labels: data.labels,
            datasets: [
              {
                data: data.matches,
              },
            ],
          }}
          width={screenWidth - 48}
          height={220}
          chartConfig={{
            backgroundColor: theme.colors.surface,
            backgroundGradientFrom: theme.colors.surface,
            backgroundGradientTo: theme.colors.surface,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(26, 47, 77, ${opacity})`, // navy
            labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: theme.colors.navy,
            },
          }}
          style={styles.chart}
          yAxisLabel=""
          yAxisSuffix=""
          showValuesOnTopOfBars
        />
      </View>
    );
  }

  if (type === 'line') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Win Rate Over Time</Text>
        <LineChart
          data={{
            labels: data.labels,
            datasets: [
              {
                data: data.wins,
                color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, // success
                strokeWidth: 2,
              },
              {
                data: data.losses,
                color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`, // error
                strokeWidth: 2,
              },
            ],
          }}
          width={screenWidth - 48}
          height={220}
          chartConfig={{
            backgroundColor: theme.colors.surface,
            backgroundGradientFrom: theme.colors.surface,
            backgroundGradientTo: theme.colors.surface,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(26, 47, 77, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          style={styles.chart}
          bezier
        />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    ...theme.typography.h4,
    color: theme.colors.navy,
    marginBottom: theme.spacing.md,
  },
  chart: {
    marginVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
  },
});

