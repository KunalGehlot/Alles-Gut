import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { useLocale } from '@/contexts/LocaleContext';
import { SUPPORTED_LANGUAGES } from '@/locales';
import { Typography, Spacing } from '@/constants/typography';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useBiometric } from '@/hooks/useBiometric';
import { api } from '@/services/api';
import { ListSection, ListRow, Button, LanguageSelector } from '@/components';

export default function SettingsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { user, logout, refreshUser } = useAuth();
  const { isEnabled: notificationsEnabled, isDndBypassed, registerNotifications, requestDndBypass } = useNotifications();
  const { hasHardware, isEnrolled, biometricType, isAppLockEnabled, setAppLockEnabled } = useBiometric();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isPaused, setIsPaused] = useState(user?.isPaused ?? false);
  const [pausedUntil, setPausedUntil] = useState(user?.pausedUntil ?? null);
  const [reminderEnabled, setReminderEnabled] = useState(user?.reminderEnabled ?? true);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  // Get current language display name
  const currentLanguage = SUPPORTED_LANGUAGES[locale]?.nativeName ?? locale;

  // Compute biometric label based on type
  const biometricLabel = biometricType === 'faceid'
    ? 'Face ID'
    : biometricType === 'touchid'
      ? 'Touch ID'
      : t('biometric.fingerprint');

  // Check-in intervals with translations
  const CHECK_IN_INTERVALS: Record<number, string> = {
    24: t('settings.every24Hours'),
    48: t('settings.every48Hours'),
    72: t('settings.every72Hours'),
    168: t('settings.everyWeek'),
  };

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
      t('settings.pause24h'),
      t('settings.pauseConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.pause'),
          onPress: async () => {
            try {
              setIsPaused(true); // Optimistic
              const updatedUser = await api.updateProfile({ isPaused: true });
              setPausedUntil(updatedUser.pausedUntil);
              await refreshUser();
            } catch (error: any) {
              setIsPaused(false);
              Alert.alert(t('common.error'), error.message || t('errors.pauseFailed'));
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
      Alert.alert(t('settings.welcomeBack'), t('settings.pauseEnded'));
    } catch {
      setIsPaused(true);
      Alert.alert(t('common.error'), t('errors.resumeFailed'));
    }
  };

  const handleToggleReminder = async (value: boolean) => {
    setReminderEnabled(value);
    try {
      await api.updateProfile({ reminderEnabled: value });
      await refreshUser();
    } catch {
      setReminderEnabled(!value);
      Alert.alert(t('common.error'), t('errors.settingSaveFailed'));
    }
  };

  const handleExportData = async () => {
    try {
      const data = await api.exportData();
      Alert.alert(
        t('settings.dataExported'),
        t('settings.dataExportedSuccess'),
        [
          {
            text: t('settings.showDetails'),
            onPress: () => {
              Alert.alert(
                t('settings.exportedData'),
                JSON.stringify(data, null, 2).slice(0, 1000) + '...'
              );
            },
          },
          { text: t('common.ok') },
        ]
      );
    } catch {
      Alert.alert(t('common.error'), t('errors.exportFailed'));
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('settings.deleteAccount'),
      t('settings.deleteAccountConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.deleteAccount'),
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteAccount();
              await logout();
              router.replace('/(auth)/welcome');
            } catch {
              Alert.alert(t('common.error'), t('errors.deleteAccountFailed'));
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
      Alert.alert(t('common.error'), t('errors.logoutFailed'));
      setIsLoggingOut(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>{t('settings.title')}</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <ListSection title={t('settings.profile')}>
          <ListRow
            icon="person"
            iconColor="#007AFF"
            title={t('settings.displayName')}
            value={user?.displayName}
            onPress={() => router.push('/(main)/edit-profile')}
          />
        </ListSection>

        {/* Check-in Section */}
        <ListSection
          title={t('settings.checkIn')}
          footer={
            isPaused
              ? t('settings.pausedWarning')
              : undefined
          }
        >
          <ListRow
            icon="time"
            iconColor="#FF9500"
            title={t('settings.interval')}
            value={currentInterval}
            onPress={() => router.push('/(main)/edit-profile')}
          />
          <ListRow
            icon="pause-circle"
            iconColor={isPaused ? theme.warning : "#8E8E93"}
            title={isPaused ? t('settings.pauseActive') : t('settings.pause24h')}
            subtitle={
              isPaused && pausedUntil
                ? t('settings.pauseEndsAt', { date: new Date(pausedUntil).toLocaleDateString(), time: new Date(pausedUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })
                : t('settings.noCheckInsFor24h')
            }
            value={isPaused ? t('settings.endPause') : undefined}
            onPress={isPaused ? handleResume : handlePause}
          />
        </ListSection>

        {/* Notifications Section */}
        <ListSection
          title={t('settings.notifications')}
          footer={
            !notificationsEnabled
              ? t('settings.notificationsDisabledWarning')
              : Platform.OS === 'android' && !isDndBypassed
                ? t('settings.dndBypassWarning')
                : t('settings.notificationsEnabled')
          }
        >
          <ListRow
            icon="notifications"
            iconColor={notificationsEnabled ? theme.success : theme.danger}
            title={t('settings.pushNotifications')}
            value={notificationsEnabled ? t('common.enabled') : t('common.disabled')}
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
              title={t('settings.criticalNotifications')}
              subtitle={t('settings.bypassDnd')}
              value={isDndBypassed ? t('common.enabled') : t('common.disabled')}
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
            title={t('settings.reminders')}
            subtitle={t('settings.beforeDeadline')}
            switchValue={reminderEnabled}
            onSwitchChange={handleToggleReminder}
          />
        </ListSection>

        {/* Security Section - Biometric Lock */}
        {hasHardware && isEnrolled && (
          <ListSection
            title={t('settings.security')}
            footer={t('settings.biometricFooter')}
          >
            <ListRow
              icon="finger-print"
              iconColor="#5856D6"
              title={t('settings.lockWith', { type: biometricLabel })}
              switchValue={isAppLockEnabled}
              onSwitchChange={setAppLockEnabled}
            />
          </ListSection>
        )}

        {/* Privacy Section */}
        <ListSection title={t('settings.privacy')}>
          <ListRow
            icon="document-text"
            iconColor="#5856D6"
            title={t('settings.privacyPolicy')}
            onPress={() => Linking.openURL('https://alles-gut.app/datenschutz')}
          />
          <ListRow
            icon="download"
            iconColor={theme.success}
            title={t('settings.exportMyData')}
            onPress={handleExportData}
          />
          <ListRow
            icon="trash"
            iconColor="#FF3B30"
            title={t('settings.deleteAccount')}
            destructive
            onPress={handleDeleteAccount}
          />
        </ListSection>

        {/* App Section */}
        <ListSection title={t('settings.app')}>
          <ListRow
            icon="language"
            iconColor="#34C759"
            title={t('settings.language')}
            value={currentLanguage}
            onPress={() => setShowLanguageSelector(true)}
          />
          <ListRow
            icon="information-circle"
            iconColor="#007AFF"
            title={t('about.title')}
            onPress={() => router.push('/(main)/about')}
          />
          <ListRow
            icon="document"
            iconColor="#8E8E93"
            title={t('settings.imprint')}
            onPress={() => Linking.openURL('https://alles-gut.app/impressum')}
          />
        </ListSection>

        {/* Logout */}
        <View style={styles.logoutContainer}>
          <Button
            title={isLoggingOut ? t('settings.loggingOut') : t('settings.logout')}
            variant="secondary"
            onPress={handleLogout}
            disabled={isLoggingOut}
            fullWidth
          />
        </View>

        <Text style={[styles.version, { color: theme.textSecondary }]}>
          {t('settings.version', { version: '1.0.0' })}
        </Text>
      </ScrollView>

      {/* Language Selector Modal */}
      <LanguageSelector
        visible={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
      />
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
