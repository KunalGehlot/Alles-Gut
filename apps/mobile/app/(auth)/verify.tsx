import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/colors';
import { Typography, Spacing, BorderRadius } from '@/constants/typography';
import { useAuth } from '@/hooks/useAuth';

const CODE_LENGTH = 6;

export default function VerifyScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { contactInfo, contactType } = useLocalSearchParams<{
    contactInfo: string;
    contactType: 'email' | 'phone';
  }>();
  const { verify, requestCode } = useAuth();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleCodeChange = async (text: string) => {
    // Only allow digits
    const digits = text.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(digits);
    setError(null);

    // Auto-submit when complete
    if (digits.length === CODE_LENGTH) {
      await handleVerify(digits);
    }
  };

  const handleVerify = async (codeToVerify: string) => {
    if (!contactInfo) return;

    setIsLoading(true);
    setError(null);

    try {
      const { isNewUser } = await verify({
        contactInfo,
        code: codeToVerify,
      });

      if (isNewUser) {
        router.replace('/(auth)/setup-name');
      } else {
        // Navigate to root - index.tsx will redirect to (main) since user is authenticated
        router.replace('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.invalidCode'));
      setCode('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!contactInfo || resendCooldown > 0) return;

    setIsResending(true);
    setError(null);

    try {
      await requestCode({ contactInfo, contactType: contactType || 'email' });
      setResendCooldown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(auth)/register')} style={styles.backButton}>
          <Text style={styles.backText}>&#x2190;</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{t('auth.enterCode')}</Text>
        <Text style={styles.subtitle}>{t('auth.codeSentTo')}</Text>
        <Text style={styles.contactInfo}>{contactInfo}</Text>

        <View style={styles.codeContainer}>
          {Array.from({ length: CODE_LENGTH }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.codeBox,
                index < code.length && styles.codeBoxFilled,
                error && styles.codeBoxError,
              ]}
            >
              <Text style={styles.codeDigit}>{code[index] || ''}</Text>
            </View>
          ))}
        </View>

        {/* Hidden input for keyboard with iOS SMS autofill */}
        <TextInput
          ref={inputRef}
          style={styles.hiddenInput}
          value={code}
          onChangeText={handleCodeChange}
          keyboardType="number-pad"
          maxLength={CODE_LENGTH}
          autoFocus
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        {isLoading && (
          <ActivityIndicator
            color={Colors.primary}
            style={styles.loader}
            size="large"
          />
        )}

        <Pressable
          style={styles.resendButton}
          onPress={handleResend}
          disabled={resendCooldown > 0 || isResending}
        >
          {isResending ? (
            <ActivityIndicator color={Colors.primary} size="small" />
          ) : (
            <Text
              style={[
                styles.resendText,
                resendCooldown > 0 && styles.resendTextDisabled,
              ]}
            >
              {resendCooldown > 0
                ? t('auth.resendCodeCountdown', { seconds: resendCooldown })
                : t('auth.resendCode')}
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    color: Colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  contactInfo: {
    fontSize: Typography.fontSize.lg,
    color: Colors.text,
    fontWeight: '500',
    marginBottom: Spacing.xl,
  },
  codeContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  codeBox: {
    width: 48,
    height: 56,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeBoxFilled: {
    borderColor: Colors.primary,
  },
  codeBoxError: {
    borderColor: Colors.danger,
  },
  codeDigit: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '600',
    color: Colors.text,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
  errorText: {
    color: Colors.danger,
    fontSize: Typography.fontSize.base,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  loader: {
    marginVertical: Spacing.lg,
  },
  resendButton: {
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  resendText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.base,
  },
  resendTextDisabled: {
    color: Colors.textSecondary,
  },
});
