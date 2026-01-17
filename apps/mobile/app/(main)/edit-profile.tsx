import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Typography, Spacing, BorderRadius } from '@/constants/typography';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { ListSection, ListRow, Button } from '@/components';

const CHECK_IN_INTERVALS = [
  { value: 24, label: 'Alle 24 Stunden', description: 'Täglicher Check-in' },
  { value: 48, label: 'Alle 48 Stunden', description: 'Jeden zweiten Tag' },
  { value: 72, label: 'Alle 72 Stunden', description: 'Alle drei Tage' },
  { value: 168, label: 'Einmal pro Woche', description: 'Wöchentlicher Check-in' },
];

export default function EditProfileScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, refreshUser } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [selectedInterval, setSelectedInterval] = useState(
    user?.checkInIntervalHours ?? 48
  );
  const [isSaving, setIsSaving] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Sync state when user data becomes available or changes
  useEffect(() => {
    if (user && !initialLoaded) {
      setDisplayName(user.displayName ?? '');
      setSelectedInterval(user.checkInIntervalHours ?? 48);
      setInitialLoaded(true);
    }
  }, [user, initialLoaded]);

  const hasChanges =
    displayName !== (user?.displayName ?? '') ||
    selectedInterval !== (user?.checkInIntervalHours ?? 48);

  const isValid = displayName.trim().length >= 2;

  const handleSave = async () => {
    if (!isValid) {
      Alert.alert('Fehler', 'Der Name muss mindestens 2 Zeichen lang sein.');
      return;
    }

    setIsSaving(true);
    try {
      await api.updateProfile({
        displayName: displayName.trim(),
        checkInIntervalHours: selectedInterval,
      });
      await refreshUser();
      router.back();
    } catch {
      Alert.alert('Fehler', 'Profil konnte nicht gespeichert werden.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(
        'Änderungen verwerfen?',
        'Du hast ungespeicherte Änderungen. Möchtest du wirklich zurückgehen?',
        [
          { text: 'Abbrechen', style: 'cancel' },
          { text: 'Verwerfen', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={theme.primary} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Profil bearbeiten</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Display Name */}
        <ListSection title="Anzeigename">
          <View style={[styles.inputContainer, { backgroundColor: theme.surface }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Dein Name"
              placeholderTextColor={theme.textTertiary}
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={50}
            />
          </View>
        </ListSection>
        <Text style={[styles.hint, { color: theme.textSecondary }]}>
          Dieser Name wird deinen Kontakten angezeigt.
        </Text>

        {/* Check-in Interval */}
        <ListSection
          title="Check-in Intervall"
          footer="Nach Ablauf des Intervalls + 6 Stunden Karenzzeit werden deine Kontakte benachrichtigt."
        >
          {CHECK_IN_INTERVALS.map((interval) => (
            <ListRow
              key={interval.value}
              title={interval.label}
              subtitle={interval.description}
              showChevron={false}
              onPress={() => setSelectedInterval(interval.value)}
              icon={
                selectedInterval === interval.value
                  ? 'checkmark-circle'
                  : 'ellipse-outline'
              }
              iconColor={
                selectedInterval === interval.value ? theme.primary : theme.textTertiary
              }
            />
          ))}
        </ListSection>

        {/* Save Button */}
        <View style={styles.saveContainer}>
          <Button
            title={isSaving ? 'Wird gespeichert...' : 'Speichern'}
            onPress={handleSave}
            disabled={!hasChanges || !isValid || isSaving}
            fullWidth
          />
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
  inputContainer: {
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  input: {
    fontSize: Typography.fontSize.base,
    minHeight: 24,
  },
  hint: {
    fontSize: Typography.fontSize.sm,
    marginTop: Spacing.sm,
    marginLeft: Spacing.lg,
  },
  saveContainer: {
    marginTop: Spacing.xl,
  },
});
