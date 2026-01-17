import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Typography, Spacing } from '@/constants/typography';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
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
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isPaused, setIsPaused] = useState(user?.isPaused ?? false);
  const [reminderEnabled, setReminderEnabled] = useState(user?.reminderEnabled ?? true);

  const currentInterval = CHECK_IN_INTERVALS[user?.checkInIntervalHours ?? 48];

  const handleTogglePause = async (value: boolean) => {
    setIsPaused(value);
    try {
      await api.updateProfile({ isPaused: value });
      await refreshUser();
    } catch {
      setIsPaused(!value);
      Alert.alert('Fehler', 'Einstellung konnte nicht gespeichert werden.');
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
            iconColor="#8E8E93"
            title="Pausieren"
            subtitle="Für Urlaub oder Reisen"
            switchValue={isPaused}
            onSwitchChange={handleTogglePause}
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
            iconColor={notificationsEnabled ? '#34C759' : '#FF3B30'}
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
              iconColor={isDndBypassed ? '#34C759' : '#FF9500'}
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
            iconColor="#34C759"
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
