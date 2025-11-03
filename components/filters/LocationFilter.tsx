import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { t } from '../../utils/i18n';

interface LocationFilterProps {
  radius?: number;
  onRadiusChange: (radius: number) => void;
  useCurrentLocation?: boolean;
  onLocationToggle?: () => void;
  style?: ViewStyle;
}

const RADIUS_OPTIONS = [5, 10, 25, 50, 100]; // km

export default function LocationFilter({
  radius,
  onRadiusChange,
  useCurrentLocation = false,
  onLocationToggle,
  style,
}: LocationFilterProps) {
  const [customRadius, setCustomRadius] = useState<string>(
    radius && !RADIUS_OPTIONS.includes(radius) ? String(radius) : ''
  );

  const handleRadiusSelect = (value: number) => {
    setCustomRadius('');
    onRadiusChange(value);
  };

  const handleCustomRadius = () => {
    const num = parseInt(customRadius, 10);
    if (!isNaN(num) && num > 0) {
      onRadiusChange(num);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{t('filters.location')}</Text>

      <TouchableOpacity
        style={[
          styles.locationToggle,
          useCurrentLocation && styles.locationToggleActive,
        ]}
        onPress={onLocationToggle}
      >
        <Ionicons
          name={useCurrentLocation ? 'location' : 'location-outline'}
          size={20}
          color={useCurrentLocation ? theme.colors.primary : theme.colors.textSecondary}
        />
        <Text
          style={[
            styles.locationToggleText,
            useCurrentLocation && styles.locationToggleTextActive,
          ]}
        >
          {t('filters.useCurrentLocation')}
        </Text>
      </TouchableOpacity>

      <Text style={styles.subLabel}>{t('filters.radius')}</Text>
      <View style={styles.radiusOptions}>
        {RADIUS_OPTIONS.map((value) => (
          <TouchableOpacity
            key={value}
            style={[
              styles.radiusChip,
              radius === value && styles.radiusChipActive,
            ]}
            onPress={() => handleRadiusSelect(value)}
          >
            <Text
              style={[
                styles.radiusText,
                radius === value && styles.radiusTextActive,
              ]}
            >
              {value} km
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.customRadiusContainer}>
        <Input
          label={t('filters.customRadius')}
          value={customRadius}
          onChangeText={setCustomRadius}
          placeholder={t('filters.radiusPlaceholder')}
          keyboardType="numeric"
          rightIcon="checkmark-circle"
          onRightIconPress={handleCustomRadius}
          containerStyle={styles.customRadiusInput}
        />
      </View>
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
  locationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  locationToggleActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  locationToggleText: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  locationToggleTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  subLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  radiusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  radiusChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  radiusChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  radiusText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  radiusTextActive: {
    color: theme.colors.surface,
  },
  customRadiusContainer: {
    marginTop: theme.spacing.sm,
  },
  customRadiusInput: {
    marginBottom: 0,
  },
});

