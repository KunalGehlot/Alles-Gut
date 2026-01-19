import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { Typography, Spacing, BorderRadius } from '@/constants/typography';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components';

type ContactType = 'email' | 'phone';
type Step = 'select-method' | 'enter-contact';

export default function RegisterScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { requestCode } = useAuth();
  const [step, setStep] = useState<Step>('select-method');
  const [contactType, setContactType] = useState<ContactType>('email');
  const [contactInfo, setContactInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectMethod = (type: ContactType) => {
    setContactType(type);
    setStep('enter-contact');
  };

  const handleRequestCode = async () => {
    if (!contactInfo.trim()) {
      setError(t('validation.emailRequired'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await requestCode({ contactInfo: contactInfo.trim(), contactType });
      router.push({
        pathname: '/(auth)/verify',
        params: { contactInfo: contactInfo.trim(), contactType },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'enter-contact') {
      setStep('select-method');
      setContactInfo('');
      setError(null);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)/welcome');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={theme.primary} />
          </Pressable>
        </View>

        {step === 'select-method' ? (
          <View style={styles.content}>
            <Text style={[styles.title, { color: theme.text }]}>
              {t('auth.howToRegister')}
            </Text>

            <View style={styles.optionsContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.optionButton,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  pressed && { borderColor: theme.primary },
                ]}
                onPress={() => handleSelectMethod('email')}
              >
                <View style={[styles.optionIcon, { backgroundColor: theme.primary }]}>
                  <Ionicons name="mail" size={24} color="#FFFFFF" />
                </View>
                <Text style={[styles.optionText, { color: theme.text }]}>
                  {t('auth.withEmail')}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
              </Pressable>

              <Pressable
                style={[
                  styles.optionButton,
                  { backgroundColor: theme.surface, borderColor: theme.border, opacity: 0.5 },
                ]}
                disabled
              >
                <View style={[styles.optionIcon, { backgroundColor: theme.textSecondary }]}>
                  <Ionicons name="phone-portrait" size={24} color="#FFFFFF" />
                </View>
                <Text style={[styles.optionText, { color: theme.textSecondary }]}>
                  {t('auth.withPhone')} (soon)
                </Text>
              </Pressable>
            </View>

            <View style={[styles.infoBox, { backgroundColor: theme.surfaceSecondary }]}>
              <Ionicons name="information-circle" size={20} color={theme.textSecondary} />
              <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                {t('auth.sendCodeInfo')}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.content}>
            <Text style={[styles.title, { color: theme.text }]}>
              {t('auth.enterEmail')}
            </Text>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.surface,
                  borderColor: error ? theme.danger : theme.border,
                  color: theme.text,
                },
              ]}
              placeholder="max.mustermann@email.de"
              placeholderTextColor={theme.textTertiary}
              value={contactInfo}
              onChangeText={(text) => {
                setContactInfo(text);
                setError(null);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoFocus
            />

            {error && (
              <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
            )}

            <Button
              title={isLoading ? t('common.loading') : t('auth.requestCode')}
              onPress={handleRequestCode}
              disabled={isLoading}
              loading={isLoading}
              fullWidth
              size="large"
            />

            <View style={[styles.privacyNote, { backgroundColor: theme.surfaceSecondary }]}>
              <Ionicons name="lock-closed" size={18} color={theme.textSecondary} />
              <Text style={[styles.privacyText, { color: theme.textSecondary }]}>
                {t('auth.emailPrivacyNote')}
              </Text>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  backButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '600',
    marginBottom: Spacing.xl,
  },
  optionsContainer: {
    gap: Spacing.md,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.xl,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    lineHeight: Typography.lineHeight.base * 1.4,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.fontSize.lg,
    marginBottom: Spacing.lg,
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.xl,
  },
  privacyText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.lineHeight.sm * 1.4,
  },
});
