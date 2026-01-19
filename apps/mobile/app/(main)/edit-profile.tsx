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
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { Typography, Spacing, BorderRadius } from '@/constants/typography';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { ListSection, ListRow, Button } from '@/components';

export default function EditProfileScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();

  // Check-in intervals with translations
  const CHECK_IN_INTERVALS = [
    { value: 24, label: t('settings.every24Hours'), description: t('settings.dailyCheckIn') },
    { value: 48, label: t('settings.every48Hours'), description: t('settings.everyOtherDay') },
    { value: 72, label: t('settings.every72Hours'), description: t('settings.every3Days') },
    { value: 168, label: t('settings.everyWeek'), description: t('settings.weeklyCheckIn') },
  ];

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
      Alert.alert(t('common.error'), t('validation.nameTooShort'));
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
      Alert.alert(t('common.error'), t('errors.profileSaveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(
        t('settings.discardChanges'),
        t('settings.discardChangesMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('common.discard'), style: 'destructive', onPress: () => router.back() },
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
        <Text style={[styles.title, { color: theme.text }]}>{t('settings.editProfile')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Display Name */}
        <ListSection title={t('settings.displayName')}>
          <View style={[styles.inputContainer, { backgroundColor: theme.surface }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder={t('settings.yourName')}
              placeholderTextColor={theme.textTertiary}
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={50}
            />
          </View>
        </ListSection>
        <Text style={[styles.hint, { color: theme.textSecondary }]}>
          {t('settings.displayNameHint')}
        </Text>

        {/* Check-in Interval */}
        <ListSection
          title={t('settings.checkInInterval')}
          footer={t('settings.intervalFooter')}
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
            title={isSaving ? t('common.saving') : t('common.save')}
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
