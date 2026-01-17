import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Typography, Spacing, BorderRadius } from '@/constants/typography';
import { useAuth } from '@/hooks/useAuth';

const INTERVALS = [
  { value: 24, label: 'Alle 24 Stunden', recommended: false },
  { value: 48, label: 'Alle 48 Stunden', recommended: true },
  { value: 72, label: 'Alle 72 Stunden', recommended: false },
  { value: 168, label: 'Einmal pro Woche', recommended: false },
];

export default function SetupIntervalScreen() {
  const router = useRouter();
  const { displayName } = useLocalSearchParams<{ displayName: string }>();
  const { updateProfile } = useAuth();
  const [selectedInterval, setSelectedInterval] = useState(48);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleComplete = async () => {
    if (!displayName) return;

    setIsLoading(true);
    setError(null);

    try {
      await updateProfile(displayName, selectedInterval);
      router.replace('/(main)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>&#x2190;</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Wie oft möchtest du dich melden?</Text>

        <View style={styles.optionsContainer}>
          {INTERVALS.map((interval) => (
            <Pressable
              key={interval.value}
              style={[
                styles.optionButton,
                selectedInterval === interval.value && styles.optionSelected,
              ]}
              onPress={() => setSelectedInterval(interval.value)}
            >
              <View style={styles.radioOuter}>
                {selectedInterval === interval.value && (
                  <View style={styles.radioInner} />
                )}
              </View>
              <Text
                style={[
                  styles.optionText,
                  selectedInterval === interval.value && styles.optionTextSelected,
                ]}
              >
                {interval.label}
                {interval.recommended && (
                  <Text style={styles.recommendedText}> (empfohlen)</Text>
                )}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>&#x2139;</Text>
          <Text style={styles.infoText}>
            Nach Ablauf dieser Zeit + 6 Stunden Karenzzeit werden deine Kontakte
            benachrichtigt.
          </Text>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.buttonContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handleComplete}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>Fertig</Text>
            )}
          </Pressable>
        </View>
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
  optionsContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  optionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  optionText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
  },
  optionTextSelected: {
    fontWeight: '500',
  },
  recommendedText: {
    color: Colors.textSecondary,
    fontWeight: 'normal',
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
  errorText: {
    color: Colors.danger,
    fontSize: Typography.fontSize.base,
    marginTop: Spacing.md,
    textAlign: 'center',
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
  buttonDisabled: {
    opacity: 0.6,
  },
});
