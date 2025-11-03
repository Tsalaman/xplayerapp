import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import Badge from '../ui/Badge';
import { t } from '../../utils/i18n';

interface SportFilterProps {
  selectedSports: string[];
  onToggle: (sport: string) => void;
  style?: ViewStyle;
}

const SPORTS = ['football', 'basketball', 'tennis', 'padel'];

const getSportIcon = (sport: string): keyof typeof Ionicons.glyphMap => {
  const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
    football: 'football',
    basketball: 'basketball',
    tennis: 'tennisball',
    padel: 'trophy',
  };
  return icons[sport] || 'ellipse';
};

export default function SportFilter({
  selectedSports,
  onToggle,
  style,
}: SportFilterProps) {
  const getSportColor = (sport: string) => {
    return theme.sports[sport as keyof typeof theme.sports] || theme.colors.primary;
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{t('filters.sport')}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {SPORTS.map((sport) => {
          const isSelected = selectedSports.includes(sport);
          return (
            <TouchableOpacity
              key={sport}
              onPress={() => onToggle(sport)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.sportChip,
                  isSelected && {
                    backgroundColor: getSportColor(sport),
                  },
                  !isSelected && styles.sportChipUnselected,
                ]}
              >
                <Ionicons
                  name={getSportIcon(sport)}
                  size={20}
                  color={isSelected ? theme.colors.surface : theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.sportText,
                    isSelected && styles.sportTextSelected,
                  ]}
                >
                  {t(`sports.${sport}`)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  scrollContent: {
    gap: theme.spacing.md,
    paddingRight: theme.spacing.lg,
  },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.xs,
    marginRight: theme.spacing.sm,
  },
  sportChipUnselected: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sportText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  sportTextSelected: {
    color: theme.colors.surface,
  },
});

