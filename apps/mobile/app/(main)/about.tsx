import { View, Text, StyleSheet, ScrollView, Linking, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Typography, Spacing, BorderRadius } from '@/constants/typography';
import { ListSection, ListRow } from '@/components';

export default function AboutScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={theme.primary} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Über Alles Gut</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {/* App Icon and Info */}
        <View style={styles.appInfo}>
          <View style={[styles.iconContainer, { backgroundColor: theme.primary }]}>
            <Ionicons name="heart" size={48} color="#FFFFFF" />
          </View>
          <Text style={[styles.appName, { color: theme.text }]}>Alles Gut</Text>
          <Text style={[styles.appVersion, { color: theme.textSecondary }]}>
            Version 1.0.0
          </Text>
        </View>

        {/* Description */}
        <View style={[styles.descriptionCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.description, { color: theme.text }]}>
            Alles Gut ist deine persönliche Sicherheits-App. Mit regelmäßigen Check-ins
            gibst du deinen Liebsten ein gutes Gefühl - und sie werden automatisch
            benachrichtigt, falls du dich nicht meldest.
          </Text>
        </View>

        {/* Features */}
        <ListSection title="Funktionen">
          <ListRow
            icon="shield-checkmark"
            iconColor="#34C759"
            title="Sichere Check-ins"
            subtitle="Einfaches Bestätigen mit einem Tap"
            showChevron={false}
          />
          <ListRow
            icon="people"
            iconColor="#007AFF"
            title="Notfallkontakte"
            subtitle="Bis zu 5 vertrauenswürdige Personen"
            showChevron={false}
          />
          <ListRow
            icon="lock-closed"
            iconColor="#5856D6"
            title="Ende-zu-Ende verschlüsselt"
            subtitle="Deine Daten bleiben privat"
            showChevron={false}
          />
          <ListRow
            icon="globe"
            iconColor="#FF9500"
            title="DSGVO-konform"
            subtitle="Made in Germany"
            showChevron={false}
          />
        </ListSection>

        {/* Links */}
        <ListSection title="Links">
          <ListRow
            icon="globe-outline"
            iconColor="#007AFF"
            title="Website"
            onPress={() => Linking.openURL('https://allesgut.app')}
          />
          <ListRow
            icon="document-text-outline"
            iconColor="#5856D6"
            title="Datenschutzerklärung"
            onPress={() => Linking.openURL('https://allesgut.app/datenschutz')}
          />
          <ListRow
            icon="document-outline"
            iconColor="#8E8E93"
            title="Nutzungsbedingungen"
            onPress={() => Linking.openURL('https://allesgut.app/agb')}
          />
        </ListSection>

        {/* Credits */}
        <View style={styles.credits}>
          <Text style={[styles.creditsText, { color: theme.textSecondary }]}>
            Mit ❤️ entwickelt in Deutschland
          </Text>
          <Text style={[styles.creditsText, { color: theme.textTertiary }]}>
            © 2024 Alles Gut
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  backButton: {
    padding: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  appName: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: 'bold',
  },
  appVersion: {
    fontSize: Typography.fontSize.base,
    marginTop: Spacing.xs,
  },
  descriptionCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: Typography.fontSize.base,
    lineHeight: Typography.lineHeight.base * 1.5,
    textAlign: 'center',
  },
  credits: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  creditsText: {
    fontSize: Typography.fontSize.sm,
    marginTop: Spacing.xs,
  },
});
