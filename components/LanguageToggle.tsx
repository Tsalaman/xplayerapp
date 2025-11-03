import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { getLocale, setLocale, type Locale } from '../utils/i18n';

type LanguageToggleVariant = 'inline' | 'card' | 'minimal';

interface LanguageToggleProps {
  variant?: LanguageToggleVariant;
  style?: any;
}

const languages: { code: Locale; name: string; flag: string }[] = [
  { code: 'el', name: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
];

export default function LanguageToggle({ variant = 'inline', style }: LanguageToggleProps) {
  const [currentLocale, setCurrentLocale] = useState<Locale>(getLocale());
  const [showModal, setShowModal] = useState(false);

  const handleLanguageChange = (locale: Locale) => {
    setLocale(locale);
    setCurrentLocale(locale);
    setShowModal(false);
  };

  const currentLanguage = languages.find((lang) => lang.code === currentLocale) || languages[0];

  // Inline variant - For topbar (globe icon + text)
  if (variant === 'inline') {
    return (
      <>
        <TouchableOpacity
          style={[styles.inlineContainer, style]}
          onPress={() => setShowModal(true)}
        >
          <Ionicons name="language" size={20} color={theme.colors.primary} />
          <Text style={styles.inlineText}>{currentLanguage.name}</Text>
          <Ionicons name="chevron-down" size={16} color={theme.colors.textSecondary} />
        </TouchableOpacity>
        <Modal
          visible={showModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowModal(false)}
          >
            <View style={styles.modalContent}>
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.modalItem,
                    currentLocale === lang.code && styles.modalItemSelected,
                  ]}
                  onPress={() => handleLanguageChange(lang.code)}
                >
                  <Text style={styles.modalItemFlag}>{lang.flag}</Text>
                  <Text
                    style={[
                      styles.modalItemText,
                      currentLocale === lang.code && styles.modalItemTextSelected,
                    ]}
                  >
                    {lang.name}
                  </Text>
                  {currentLocale === lang.code && (
                    <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </>
    );
  }

  // Card variant - For settings (expandable card)
  if (variant === 'card') {
    return (
      <TouchableOpacity
        style={[styles.cardContainer, style]}
        onPress={() => setShowModal(true)}
      >
        <View style={styles.cardHeader}>
          <Ionicons name="language" size={24} color={theme.colors.primary} />
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>Language</Text>
            <Text style={styles.cardSubtitle}>{currentLanguage.name}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </View>
        <Modal
          visible={showModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowModal(false)}
          >
            <View style={[styles.modalContent, styles.cardModal]}>
              <Text style={styles.modalTitle}>Select Language</Text>
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.modalItem,
                    styles.cardModalItem,
                    currentLocale === lang.code && styles.modalItemSelected,
                  ]}
                  onPress={() => handleLanguageChange(lang.code)}
                >
                  <Text style={styles.modalItemFlag}>{lang.flag}</Text>
                  <Text
                    style={[
                      styles.modalItemText,
                      currentLocale === lang.code && styles.modalItemTextSelected,
                    ]}
                  >
                    {lang.name}
                  </Text>
                  {currentLocale === lang.code && (
                    <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </TouchableOpacity>
    );
  }

  // Minimal variant - For compact spaces (flag only)
  return (
    <>
      <TouchableOpacity
        style={[styles.minimalContainer, style]}
        onPress={() => setShowModal(true)}
      >
        <Text style={styles.minimalFlag}>{currentLanguage.flag}</Text>
      </TouchableOpacity>
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowModal(false)}
        >
          <View style={styles.modalContent}>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.modalItem,
                  currentLocale === lang.code && styles.modalItemSelected,
                ]}
                onPress={() => handleLanguageChange(lang.code)}
              >
                <Text style={styles.modalItemFlag}>{lang.flag}</Text>
                <Text
                  style={[
                    styles.modalItemText,
                    currentLocale === lang.code && styles.modalItemTextSelected,
                  ]}
                >
                  {lang.name}
                </Text>
                {currentLocale === lang.code && (
                  <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Inline variant
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  inlineText: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  // Card variant
  cardContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs / 2,
  },
  cardSubtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  // Minimal variant
  minimalContainer: {
    padding: theme.spacing.xs,
  },
  minimalFlag: {
    fontSize: 24,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    minWidth: 200,
    maxWidth: 300,
  },
  cardModal: {
    padding: theme.spacing.xl,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.xs,
    gap: theme.spacing.md,
  },
  cardModalItem: {
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalItemSelected: {
    backgroundColor: theme.colors.primary + '10',
    borderColor: theme.colors.primary,
  },
  modalItemFlag: {
    fontSize: 24,
  },
  modalItemText: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.text,
  },
  modalItemTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  modalCloseButton: {
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.md,
  },
  modalCloseText: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

