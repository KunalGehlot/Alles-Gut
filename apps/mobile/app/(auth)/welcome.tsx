import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Typography, Spacing } from '@/constants/typography';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>AG</Text>
          </View>
          <Text style={styles.appName}>Alles Gut</Text>
          <Text style={styles.tagline}>Dein digitales Lebenszeichen</Text>
        </View>

        <View style={styles.buttonContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={styles.primaryButtonText}>Jetzt starten</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push('/(auth)/register?mode=login')}
          >
            <Text style={styles.secondaryButtonText}>
              Bereits registriert? Anmelden
            </Text>
          </Pressable>
        </View>

        <View style={styles.privacyContainer}>
          <Text style={styles.privacyIcon}>&#x1F512;</Text>
          <Text style={styles.privacyText}>Deine Daten bleiben privat</Text>
          <Text style={styles.privacySubtext}>
            DSGVO-konform · Ende-zu-Ende verschlüsselt
          </Text>
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
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  logoText: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: 'bold',
    color: Colors.white,
  },
  appName: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  tagline: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textSecondary,
  },
  buttonContainer: {
    gap: Spacing.md,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.base,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  privacyContainer: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  privacyIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  privacyText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  privacySubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
});
