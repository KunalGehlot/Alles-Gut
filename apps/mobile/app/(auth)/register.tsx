import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Typography, Spacing, BorderRadius } from '@/constants/typography';
import { useAuth } from '@/hooks/useAuth';

type ContactType = 'email' | 'phone';
type Step = 'select-method' | 'enter-contact';

export default function RegisterScreen() {
  const router = useRouter();
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
      setError('Bitte gib deine E-Mail-Adresse ein.');
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
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'enter-contact') {
      setStep('select-method');
      setContactInfo('');
      setError(null);
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backText}>&#x2190;</Text>
          </Pressable>
        </View>

        {step === 'select-method' ? (
          <View style={styles.content}>
            <Text style={styles.title}>
              Wie möchtest du dich registrieren?
            </Text>

            <View style={styles.optionsContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.optionButton,
                  pressed && styles.optionPressed,
                ]}
                onPress={() => handleSelectMethod('email')}
              >
                <Text style={styles.optionIcon}>&#x2709;</Text>
                <Text style={styles.optionText}>Mit E-Mail</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.optionButton,
                  styles.optionDisabled,
                ]}
                disabled
              >
                <Text style={styles.optionIcon}>&#x1F4F1;</Text>
                <Text style={styles.optionTextDisabled}>
                  Mit Handynummer (bald verfügbar)
                </Text>
              </Pressable>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoIcon}>&#x2139;</Text>
              <Text style={styles.infoText}>
                Wir senden dir einen Bestätigungscode. Kein Passwort nötig.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.content}>
            <Text style={styles.title}>Deine E-Mail-Adresse</Text>

            <TextInput
              style={[styles.input, error && styles.inputError]}
              placeholder="max.mustermann@email.de"
              placeholderTextColor={Colors.textSecondary}
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

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
                isLoading && styles.buttonDisabled,
              ]}
              onPress={handleRequestCode}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.primaryButtonText}>Code anfordern</Text>
              )}
            </Pressable>

            <View style={styles.privacyNote}>
              <Text style={styles.privacyIcon}>&#x1F512;</Text>
              <Text style={styles.privacyText}>
                Deine E-Mail wird verschlüsselt gespeichert und nur für die
                Anmeldung und Notfall-Benachrichtigungen verwendet.
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
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backButton: {
    padding: Spacing.sm,
  },
  backText: {
    fontSize: Typography.fontSize['2xl'],
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
  },
  optionsContainer: {
    gap: Spacing.md,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  optionPressed: {
    backgroundColor: Colors.background,
    borderColor: Colors.primary,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionIcon: {
    fontSize: 24,
  },
  optionText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  optionTextDisabled: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textSecondary,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  infoIcon: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textSecondary,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.base,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  errorText: {
    color: Colors.danger,
    fontSize: Typography.fontSize.sm,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  privacyIcon: {
    fontSize: Typography.fontSize.lg,
  },
  privacyText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.sm,
  },
});
