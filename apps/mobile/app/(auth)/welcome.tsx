import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { Typography, Spacing, BorderRadius } from '@/constants/typography';
import { Button } from '@/components';

export default function WelcomeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={[styles.logoCircle, { backgroundColor: theme.primary }]}>
            <Ionicons name="heart" size={48} color="#FFFFFF" />
          </View>
          <Text style={[styles.appName, { color: theme.text }]}>{t('app.name')}</Text>
          <Text style={[styles.tagline, { color: theme.textSecondary }]}>
            {t('app.tagline')}
          </Text>
        </View>

        <View style={styles.featuresContainer}>
          <View style={styles.featureRow}>
            <View style={[styles.featureIcon, { backgroundColor: theme.surfaceSecondary }]}>
              <Ionicons name="shield-checkmark" size={20} color={theme.primary} />
            </View>
            <Text style={[styles.featureText, { color: theme.text }]}>
              {t('privacy.regularCheckIns')}
            </Text>
          </View>
          <View style={styles.featureRow}>
            <View style={[styles.featureIcon, { backgroundColor: theme.surfaceSecondary }]}>
              <Ionicons name="people" size={20} color={theme.primary} />
            </View>
            <Text style={[styles.featureText, { color: theme.text }]}>
              {t('privacy.upToContacts')}
            </Text>
          </View>
          <View style={styles.featureRow}>
            <View style={[styles.featureIcon, { backgroundColor: theme.surfaceSecondary }]}>
              <Ionicons name="lock-closed" size={20} color={theme.primary} />
            </View>
            <Text style={[styles.featureText, { color: theme.text }]}>
              {t('privacy.endToEndEncrypted')}
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title={t('auth.getStarted')}
            onPress={() => router.push('/(auth)/register')}
            size="large"
            fullWidth
          />
          <Button
            title={t('auth.alreadyRegistered')}
            variant="ghost"
            onPress={() => router.push('/(auth)/register?mode=login')}
            fullWidth
          />
        </View>

        <View style={styles.privacyContainer}>
          <Ionicons name="shield" size={18} color={theme.textSecondary} />
          <Text style={[styles.privacyText, { color: theme.textSecondary }]}>
            {t('privacy.gdprCompliant')} · {t('privacy.madeInGermany')}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'space-between',
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: Spacing['2xl'],
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  appName: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  tagline: {
    fontSize: Typography.fontSize.lg,
  },
  featuresContainer: {
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: Typography.fontSize.base,
    flex: 1,
  },
  buttonContainer: {
    gap: Spacing.md,
  },
  privacyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  privacyText: {
    fontSize: Typography.fontSize.sm,
  },
});
