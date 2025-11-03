import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import Button from '../ui/Button';
import { t } from '../../utils/i18n';

interface DateRangeFilterProps {
  startDate?: Date;
  endDate?: Date;
  onDateChange: (startDate?: Date, endDate?: Date) => void;
  style?: ViewStyle;
}

export default function DateRangeFilter({
  startDate,
  endDate,
  onDateChange,
  style,
}: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date | undefined>(startDate);
  const [tempEndDate, setTempEndDate] = useState<Date | undefined>(endDate);

  const formatDate = (date?: Date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleClear = () => {
    setTempStartDate(undefined);
    setTempEndDate(undefined);
    onDateChange(undefined, undefined);
    setIsOpen(false);
  };

  const handleApply = () => {
    onDateChange(tempStartDate, tempEndDate);
    setIsOpen(false);
  };

  const hasSelection = startDate || endDate;

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[styles.filterButton, hasSelection && styles.filterButtonActive]}
        onPress={() => setIsOpen(true)}
      >
        <Ionicons
          name="calendar"
          size={20}
          color={hasSelection ? theme.colors.primary : theme.colors.textSecondary}
        />
        <Text
          style={[
            styles.filterText,
            hasSelection && styles.filterTextActive,
          ]}
        >
          {hasSelection
            ? `${formatDate(startDate)} - ${formatDate(endDate)}`
            : t('filters.dateRange')}
        </Text>
        {hasSelection && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={18} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('filters.selectDateRange')}</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.datePickerContainer}>
              {/* For React Native, you'd use a proper date picker library */}
              <Text style={styles.placeholder}>
                {t('filters.datePickerPlaceholder')}
              </Text>
            </View>

            <View style={styles.modalActions}>
              <Button
                title={t('buttons.clear')}
                onPress={handleClear}
                variant="outline"
                style={styles.actionButton}
              />
              <Button
                title={t('buttons.apply')}
                onPress={handleApply}
                variant="primary"
                style={styles.actionButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  filterButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  filterText: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  filterTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  clearButton: {
    padding: theme.spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    paddingBottom: theme.spacing.lg,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  datePickerContainer: {
    padding: theme.spacing.lg,
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});

