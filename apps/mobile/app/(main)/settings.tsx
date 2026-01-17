import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Typography, Spacing, BorderRadius } from '@/constants/typography';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';

const CHECK_IN_INTERVALS = [
  { value: 24, label: 'Alle 24 Stunden' },
  { value: 48, label: 'Alle 48 Stunden' },
  { value: 72, label: 'Alle 72 Stunden' },
  { value: 168, label: 'Einmal pro Woche' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isPaused, setIsPaused] = useState(user?.isPaused ?? false);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [emailBackupEnabled, setEmailBackupEnabled] = useState(true);

  const currentInterval = CHECK_IN_INTERVALS.find(
    (i) => i.value === user?.checkInIntervalHours
  ) || CHECK_IN_INTERVALS[1];

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

  const handleExportData = async () => {
    try {
      const data = await api.exportData();
      Alert.alert(
        'Daten exportiert',
        `Deine Daten wurden exportiert:\n\n${JSON.stringify(data, null, 2).slice(0, 500)}...`
      );
    } catch {
      Alert.alert('Fehler', 'Daten konnten nicht exportiert werden.');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Konto löschen',
      'Möchtest du dein Konto wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteAccount();
              router.replace('/');
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
      router.replace('/');
    } catch {
      Alert.alert('Fehler', 'Abmeldung fehlgeschlagen.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://allesgut.app/datenschutz');
  };

  const openImprint = () => {
    Linking.openURL('https://allesgut.app/impressum');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Einstellungen</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <Text style={styles.sectionTitle}>PROFIL</Text>
        <View style={styles.section}>
          <Pressable style={styles.settingRow}>
            <View style={styles.settingIcon}>
              <Text style={styles.iconText}>&#x1F464;</Text>
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Anzeigename</Text>
              <Text style={styles.settingValue}>{user?.displayName}</Text>
            </View>
            <Text style={styles.chevron}>&#x203A;</Text>
          </Pressable>
        </View>

        {/* Check-in Section */}
        <Text style={styles.sectionTitle}>CHECK-IN</Text>
        <View style={styles.section}>
          <Pressable style={styles.settingRow}>
            <View style={styles.settingIcon}>
              <Text style={styles.iconText}>&#x23F1;</Text>
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Intervall</Text>
              <Text style={styles.settingValue}>{currentInterval.label}</Text>
            </View>
            <Text style={styles.chevron}>&#x203A;</Text>
          </Pressable>

          <View style={styles.divider} />

          <View style={styles.settingRowSwitch}>
            <View style={styles.settingIcon}>
              <Text style={styles.iconText}>&#x23F8;</Text>
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Pausieren</Text>
              <Text style={styles.settingSubtitle}>Für Urlaub/Reisen</Text>
            </View>
            <Switch
              value={isPaused}
              onValueChange={handleTogglePause}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={Colors.white}
            />
          </View>
        </View>

        {isPaused && (
          <View style={styles.pauseWarning}>
            <Text style={styles.pauseWarningText}>
              &#x26A0; Check-in ist pausiert. Du erhältst keine Erinnerungen und deine Kontakte werden nicht benachrichtigt.
            </Text>
          </View>
        )}

        {/* Notifications Section */}
        <Text style={styles.sectionTitle}>BENACHRICHTIGUNGEN</Text>
        <View style={styles.section}>
          <View style={styles.settingRowSwitch}>
            <View style={styles.settingIcon}>
              <Text style={styles.iconText}>&#x1F514;</Text>
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Erinnerungen</Text>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={setReminderEnabled}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={Colors.white}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRowSwitch}>
            <View style={styles.settingIcon}>
              <Text style={styles.iconText}>&#x1F4E7;</Text>
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>E-Mail-Backup</Text>
            </View>
            <Switch
              value={emailBackupEnabled}
              onValueChange={setEmailBackupEnabled}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={Colors.white}
            />
          </View>
        </View>

        {/* Privacy Section */}
        <Text style={styles.sectionTitle}>DATENSCHUTZ</Text>
        <View style={styles.section}>
          <Pressable style={styles.settingRow} onPress={openPrivacyPolicy}>
            <View style={styles.settingIcon}>
              <Text style={styles.iconText}>&#x1F4C4;</Text>
            </View>
            <Text style={styles.settingLabel}>Datenschutzerklärung</Text>
            <Text style={styles.chevron}>&#x203A;</Text>
          </Pressable>

          <View style={styles.divider} />

          <Pressable style={styles.settingRow} onPress={handleExportData}>
            <View style={styles.settingIcon}>
              <Text style={styles.iconText}>&#x1F4E5;</Text>
            </View>
            <Text style={styles.settingLabel}>Meine Daten exportieren</Text>
            <Text style={styles.chevron}>&#x203A;</Text>
          </Pressable>

          <View style={styles.divider} />

          <Pressable style={styles.settingRow} onPress={handleDeleteAccount}>
            <View style={styles.settingIcon}>
              <Text style={styles.iconText}>&#x1F5D1;</Text>
            </View>
            <Text style={[styles.settingLabel, styles.dangerText]}>
              Konto löschen
            </Text>
            <Text style={styles.chevron}>&#x203A;</Text>
          </Pressable>
        </View>

        {/* App Section */}
        <Text style={styles.sectionTitle}>APP</Text>
        <View style={styles.section}>
          <Pressable style={styles.settingRow}>
            <View style={styles.settingIcon}>
              <Text style={styles.iconText}>&#x2139;</Text>
            </View>
            <Text style={styles.settingLabel}>Über Alles Gut</Text>
            <Text style={styles.chevron}>&#x203A;</Text>
          </Pressable>

          <View style={styles.divider} />

          <Pressable style={styles.settingRow} onPress={openImprint}>
            <View style={styles.settingIcon}>
              <Text style={styles.iconText}>&#x1F4DD;</Text>
            </View>
            <Text style={styles.settingLabel}>Impressum</Text>
            <Text style={styles.chevron}>&#x203A;</Text>
          </Pressable>
        </View>

        {/* Logout Button */}
        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          <Text style={styles.logoutText}>
            {isLoggingOut ? 'Wird abgemeldet...' : 'Abmelden'}
          </Text>
        </Pressable>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  settingRowSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  settingIcon: {
    width: 32,
    alignItems: 'center',
  },
  iconText: {
    fontSize: 20,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  settingValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  settingSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  chevron: {
    fontSize: Typography.fontSize.xl,
    color: Colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 56,
  },
  dangerText: {
    color: Colors.danger,
  },
  pauseWarning: {
    backgroundColor: Colors.warning + '20',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  pauseWarningText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.warning,
    lineHeight: Typography.lineHeight.sm,
  },
  logoutButton: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logoutText: {
    fontSize: Typography.fontSize.base,
    color: Colors.danger,
    fontWeight: '500',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  version: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
});
