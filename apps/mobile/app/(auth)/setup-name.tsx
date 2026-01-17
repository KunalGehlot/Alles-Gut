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
import { Colors } from '@/constants/colors';
import { Typography, Spacing, BorderRadius } from '@/constants/typography';

export default function SetupNameScreen() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleContinue = () => {
    const name = displayName.trim();
    if (!name) {
      setError('Bitte gib einen Namen ein.');
      return;
    }
    if (name.length < 2) {
      setError('Der Name muss mindestens 2 Zeichen lang sein.');
      return;
    }

    router.push({
      pathname: '/(auth)/setup-interval',
      params: { displayName: name },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>&#x2190;</Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>
            Wie sollen dich deine Kontakte sehen?
          </Text>

          <TextInput
            style={[styles.input, error && styles.inputError]}
            placeholder="Max"
            placeholderTextColor={Colors.textSecondary}
            value={displayName}
            onChangeText={(text) => {
              setDisplayName(text);
              setError(null);
            }}
            autoCapitalize="words"
            autoFocus
            maxLength={50}
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>&#x2139;</Text>
            <Text style={styles.infoText}>
              Du kannst einen Spitznamen oder deinen echten Namen verwenden.
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleContinue}
            >
              <Text style={styles.primaryButtonText}>Weiter</Text>
            </Pressable>
          </View>
        </View>
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
    lineHeight: Typography.lineHeight['2xl'],
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.fontSize.xl,
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
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
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: Spacing.xl,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.8,
  },
});
