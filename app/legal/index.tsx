import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import Card from '../../components/ui/Card';
import { t } from '../../utils/i18n';

export default function LegalScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Legal</Text>
        <View style={styles.placeholder} />
      </View>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Terms of Service</Text>
        <Text style={styles.text}>
          Last updated: December 1, 2024
        </Text>
        <Text style={styles.text}>
          Welcome to XPlayer. By using our service, you agree to comply with and be bound by the following terms and conditions.
        </Text>
        <Text style={styles.heading}>1. Acceptance of Terms</Text>
        <Text style={styles.text}>
          By accessing and using XPlayer, you accept and agree to be bound by the terms and provision of this agreement.
        </Text>
        <Text style={styles.heading}>2. Use License</Text>
        <Text style={styles.text}>
          Permission is granted to temporarily use XPlayer for personal, non-commercial purposes only.
        </Text>
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Privacy Policy</Text>
        <Text style={styles.text}>
          Last updated: December 1, 2024
        </Text>
        <Text style={styles.text}>
          Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information.
        </Text>
        <Text style={styles.heading}>Information We Collect</Text>
        <Text style={styles.text}>
          We collect information you provide directly to us, such as when you create an account, make a reservation, or contact us.
        </Text>
        <Text style={styles.heading}>How We Use Your Information</Text>
        <Text style={styles.text}>
          We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.
        </Text>
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Contact Us</Text>
        <Text style={styles.text}>
          If you have any questions about these legal documents, please contact us at:
        </Text>
        <Text style={styles.contactInfo}>Email: support@xplayer.app</Text>
        <Text style={styles.contactInfo}>Website: www.xplayer.app</Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
    paddingTop: theme.spacing.xl + 20,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  sectionCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  heading: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  text: {
    ...theme.typography.body,
    color: theme.colors.text,
    lineHeight: 24,
    marginBottom: theme.spacing.md,
  },
  contactInfo: {
    ...theme.typography.body,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
});
