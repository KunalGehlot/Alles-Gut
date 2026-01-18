import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Typography, Spacing } from '@/constants/typography';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useBiometric } from '@/hooks/useBiometric';
import { api } from '@/services/api';
import { ListSection, ListRow, Button } from '@/components';

const CHECK_IN_INTERVALS: Record<number, string> = {
  24: 'Alle 24 Stunden',
  48: 'Alle 48 Stunden',
  72: 'Alle 72 Stunden',
  168: 'Einmal pro Woche',
};

export default function SettingsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, logout, refreshUser } = useAuth();
  const { isEnabled: notificationsEnabled, isDndBypassed, registerNotifications, requestDndBypass } = useNotifications();
  const { hasHardware, isEnrolled, biometricType, isAppLockEnabled, setAppLockEnabled } = useBiometric();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isPaused, setIsPaused] = useState(user?.isPaused ?? false);
  const [pausedUntil, setPausedUntil] = useState(user?.pausedUntil ?? null);
  const [reminderEnabled, setReminderEnabled] = useState(user?.reminderEnabled ?? true);

  // Compute biometric label based on type
  const biometricLabel = biometricType === 'faceid'
    ? 'Face ID'
    : biometricType === 'touchid'
      ? 'Touch ID'
      : 'Fingerabdruck';

  // Keep local state in sync with user object changes
  useEffect(() => {
    setIsPaused(user?.isPaused ?? false);
    setPausedUntil(user?.pausedUntil ?? null);
  }, [user?.isPaused, user?.pausedUntil]);

  useEffect(() => {
    setReminderEnabled(user?.reminderEnabled ?? true);
  }, [user?.reminderEnabled]);

  const currentInterval = CHECK_IN_INTERVALS[user?.checkInIntervalHours ?? 48];

  const handlePause = async () => {
    Alert.alert(
      '24h Pause',
      'Möchtest du die Check-ins für 24 Stunden pausieren? Danach musst du dich wieder melden.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Pausieren',
          onPress: async () => {
            try {
              setIsPaused(true); // Optimistic
              const updatedUser = await api.updateProfile({ isPaused: true });
              setPausedUntil(updatedUser.pausedUntil);
              await refreshUser();
            } catch (error: any) {
              setIsPaused(false);
              Alert.alert('Fehler', error.message || 'Pause konnte nicht aktiviert werden.');
            }
          }
        }
      ]
    );
  };

  const handleResume = async () => {
    try {
      setIsPaused(false); // Optimistic
      setPausedUntil(null);
      await api.updateProfile({ isPaused: false });
      await refreshUser();
      Alert.alert('Willkommen zurück', 'Deine Pause wurde beendet.');
    } catch {
      setIsPaused(true);
      Alert.alert('Fehler', 'Pause konnte nicht beendet werden.');
    }
  };

  const handleToggleReminder = async (value: boolean) => {
    setReminderEnabled(value);
    try {
      await api.updateProfile({ reminderEnabled: value });
      await refreshUser();
    } catch {
      setReminderEnabled(!value);
      Alert.alert('Fehler', 'Einstellung konnte nicht gespeichert werden.');
    }
  };

  const handleExportData = async () => {
    try {
      const data = await api.exportData();
      Alert.alert(
        'Daten exportiert',
        'Deine Daten wurden erfolgreich exportiert.',
        [
          {
            text: 'Details anzeigen',
            onPress: () => {
              Alert.alert(
                'Exportierte Daten',
                JSON.stringify(data, null, 2).slice(0, 1000) + '...'
              );
            },
          },
          { text: 'OK' },
        ]
      );
    } catch {
      Alert.alert('Fehler', 'Daten konnten nicht exportiert werden.');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Konto löschen',
      'Möchtest du dein Konto wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden. Alle deine Daten werden unwiderruflich gelöscht.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Konto löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteAccount();
              await logout();
              router.replace('/(auth)/welcome');
            } catch {
              Alert.alert('Fehler', 'Konto konnte nicht gelöscht werden.');
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      // Navigate directly to welcome screen to avoid redirect race condition
      router.replace('/(auth)/welcome');
    } catch {
      Alert.alert('Fehler', 'Abmeldung fehlgeschlagen.');
      setIsLoggingOut(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Einstellungen</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <ListSection title="Profil">
          <ListRow
            icon="person"
            iconColor="#007AFF"
            title="Anzeigename"
            value={user?.displayName}
            onPress={() => router.push('/(main)/edit-profile')}
          />
        </ListSection>

        {/* Check-in Section */}
        <ListSection
          title="Check-in"
          footer={
            isPaused
              ? '⚠️ Check-in ist pausiert. Du erhältst keine Erinnerungen und deine Kontakte werden nicht benachrichtigt.'
              : undefined
          }
        >
          <ListRow
            icon="time"
            iconColor="#FF9500"
            title="Intervall"
            value={currentInterval}
            onPress={() => router.push('/(main)/edit-profile')}
          />
          <ListRow
            icon="pause-circle"
            iconColor={isPaused ? theme.warning : "#8E8E93"}
            title={isPaused ? "Pause aktiv" : "24h Pause"}
            subtitle={
              isPaused && pausedUntil
                ? `Endet ${new Date(pausedUntil).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} ${new Date(pausedUntil).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`
                : "Für 24 Stunden keine Check-ins"
            }
            value={isPaused ? "Beenden" : undefined}
            onPress={isPaused ? handleResume : handlePause}
          />
        </ListSection>

        {/* Notifications Section */}
        <ListSection
          title="Benachrichtigungen"
          footer={
            !notificationsEnabled
              ? '⚠️ Benachrichtigungen sind deaktiviert. Aktiviere sie in den Einstellungen, um Notfall-Benachrichtigungen zu erhalten.'
              : Platform.OS === 'android' && !isDndBypassed
                ? '⚠️ Kritische Benachrichtigungen können "Nicht stören" nicht umgehen. Aktiviere diese Berechtigung für maximale Zuverlässigkeit.'
                : 'Benachrichtigungen sind aktiviert. Du wirst bei Notfällen benachrichtigt.'
          }
        >
          <ListRow
            icon="notifications"
            iconColor={notificationsEnabled ? theme.success : theme.danger}
            title="Push-Benachrichtigungen"
            value={notificationsEnabled ? 'Aktiviert' : 'Deaktiviert'}
            onPress={() => {
              if (!notificationsEnabled) {
                registerNotifications();
              } else {
                Linking.openSettings();
              }
            }}
          />
          {Platform.OS === 'android' && (
            <ListRow
              icon="volume-high"
              iconColor={isDndBypassed ? theme.success : theme.warning}
              title="Kritische Benachrichtigungen"
              subtitle='"Nicht stören" umgehen'
              value={isDndBypassed ? 'Aktiviert' : 'Deaktiviert'}
              onPress={() => {
                if (!isDndBypassed) {
                  requestDndBypass();
                } else {
                  Linking.openSettings();
                }
              }}
            />
          )}
          <ListRow
            icon="alarm"
            iconColor="#FF9500"
            title="Erinnerungen"
            subtitle="Vor Ablauf der Check-in-Frist"
            switchValue={reminderEnabled}
            onSwitchChange={handleToggleReminder}
          />
        </ListSection>

        {/* Security Section - Biometric Lock */}
        {hasHardware && isEnrolled && (
          <ListSection
            title="Sicherheit"
            footer="Schütze die App mit biometrischer Authentifizierung"
          >
            <ListRow
              icon="finger-print"
              iconColor="#5856D6"
              title={`Mit ${biometricLabel} sperren`}
              switchValue={isAppLockEnabled}
              onSwitchChange={setAppLockEnabled}
            />
          </ListSection>
        )}

        {/* Privacy Section */}
        <ListSection title="Datenschutz">
          <ListRow
            icon="document-text"
            iconColor="#5856D6"
            title="Datenschutzerklärung"
            onPress={() => Linking.openURL('https://allesgut.app/datenschutz')}
          />
          <ListRow
            icon="download"
            iconColor={theme.success}
            title="Meine Daten exportieren"
            onPress={handleExportData}
          />
          <ListRow
            icon="trash"
            iconColor="#FF3B30"
            title="Konto löschen"
            destructive
            onPress={handleDeleteAccount}
          />
        </ListSection>

        {/* App Section */}
        <ListSection title="App">
          <ListRow
            icon="information-circle"
            iconColor="#007AFF"
            title="Über Alles Gut"
            onPress={() => router.push('/(main)/about')}
          />
          <ListRow
            icon="document"
            iconColor="#8E8E93"
            title="Impressum"
            onPress={() => Linking.openURL('https://allesgut.app/impressum')}
          />
        </ListSection>

        {/* Logout */}
        <View style={styles.logoutContainer}>
          <Button
            title={isLoggingOut ? 'Wird abgemeldet...' : 'Abmelden'}
            variant="secondary"
            onPress={handleLogout}
            disabled={isLoggingOut}
            fullWidth
          />
        </View>

        <Text style={[styles.version, { color: theme.textSecondary }]}>
          Version 1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120,
  },
  logoutContainer: {
    marginTop: Spacing.xl,
  },
  version: {
    textAlign: 'center',
    fontSize: Typography.fontSize.sm,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
});
