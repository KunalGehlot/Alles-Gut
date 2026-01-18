import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Typography, Spacing, BorderRadius } from '@/constants/typography';
import { useAuth } from '@/hooks/useAuth';
import { useCheckIn, formatDate, calculateHoursRemaining } from '@/hooks/useCheckIn';
import { useContacts } from '@/hooks/useContacts';
import { GlassCard } from '@/components';

const WARNING_THRESHOLD_HOURS = 6;

export default function HomeScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { status, isLoading, isCheckingIn, checkIn, refreshStatus, error: checkInError } = useCheckIn();
  const { contacts } = useContacts();
  const [showSuccess, setShowSuccess] = useState(false);

  const buttonScale = useSharedValue(1);
  const successOpacity = useSharedValue(0);

  const activeContacts = contacts.filter((c) => c.status === 'accepted');
  const hoursRemaining = calculateHoursRemaining(status?.nextDeadline ?? null);
  const isWarning = hoursRemaining !== null && hoursRemaining <= WARNING_THRESHOLD_HOURS;
  const isPaused = status?.isPaused ?? false;

  const handleCheckIn = async () => {
    if (isPaused) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      buttonScale.value = withSequence(
        withSpring(0.92, { damping: 10 }),
        withSpring(1, { damping: 10 })
      );

      await checkIn();

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowSuccess(true);
      successOpacity.value = withSpring(1);

      setTimeout(() => {
        successOpacity.value = withSpring(0);
        setTimeout(() => setShowSuccess(false), 300);
      }, 3000);
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Fehler',
        error instanceof Error ? error.message : 'Check-in fehlgeschlagen. Bitte versuche es erneut.'
      );
    }
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const successAnimatedStyle = useAnimatedStyle(() => ({
    opacity: successOpacity.value,
  }));

  // Refresh status when screen gains focus (e.g., returning from Settings)
  useFocusEffect(
    useCallback(() => {
      refreshStatus();
    }, [refreshStatus])
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // Show error state with retry option
  if (checkInError && !status) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <Ionicons name="warning-outline" size={48} color={theme.danger} />
          <Text style={[styles.greeting, { color: theme.text, marginTop: 16 }]}>
            Verbindungsfehler
          </Text>
          <Text style={[styles.lastCheckIn, { color: theme.textSecondary, textAlign: 'center', marginHorizontal: 32 }]}>
            {checkInError}
          </Text>
          <Pressable
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={refreshStatus}
          >
            <Text style={styles.retryButtonText}>Erneut versuchen</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const buttonColor = isPaused
    ? theme.textTertiary
    : isWarning
      ? theme.warning
      : theme.primary;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: theme.text }]}>
            Hallo, {user?.displayName || 'Nutzer'}!
          </Text>
          {status?.lastCheckIn && (
            <Text style={[styles.lastCheckIn, { color: theme.textSecondary }]}>
              Letztes Lebenszeichen: {formatDate(status.lastCheckIn)}
            </Text>
          )}
        </View>

        {/* Warning/Paused Banner */}
        {isPaused && !showSuccess && (
          <View style={[styles.banner, { backgroundColor: theme.textSecondary }]}>
            <Ionicons name="pause-circle" size={20} color="#FFFFFF" />
            <Text style={styles.bannerText}>Check-in ist pausiert</Text>
          </View>
        )}
        {isWarning && !isPaused && !showSuccess && (
          <View style={[styles.banner, { backgroundColor: theme.warning }]}>
            <Ionicons name="warning" size={20} color="#FFFFFF" />
            <Text style={styles.bannerText}>Bitte melde dich bald!</Text>
          </View>
        )}

        {/* Check-in Button */}
        <View style={styles.buttonContainer}>
          {showSuccess ? (
            <Animated.View style={[styles.successContainer, successAnimatedStyle]}>
              <View style={[styles.successCircle, { backgroundColor: theme.success }]}>
                <Ionicons name="checkmark" size={64} color="#FFFFFF" />
              </View>
              <Text style={[styles.successTitle, { color: theme.text }]}>
                Lebenszeichen gesendet!
              </Text>
              <Text style={[styles.successTime, { color: theme.text }]}>
                {formatDate(status?.lastCheckIn ?? null)}
              </Text>
              <Text style={[styles.successDeadline, { color: theme.textSecondary }]}>
                Nächste Frist: {formatDate(status?.nextDeadline ?? null)}
              </Text>
            </Animated.View>
          ) : (
            <>
              <Animated.View style={[styles.buttonWrapper, buttonAnimatedStyle]}>
                <Pressable
                  style={[styles.checkInButton, { backgroundColor: buttonColor }]}
                  onPress={handleCheckIn}
                  disabled={isCheckingIn || isPaused}
                >
                  {isCheckingIn ? (
                    <ActivityIndicator size="large" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons
                        name={isPaused ? 'pause' : 'checkmark'}
                        size={52}
                        color="#FFFFFF"
                      />
                      <Text style={styles.buttonText}>
                        {isPaused ? 'PAUSIERT' : 'ALLES GUT'}
                      </Text>
                    </>
                  )}
                </Pressable>
              </Animated.View>
              {!isPaused && (
                <Text style={[styles.tapHint, { color: theme.textSecondary }]}>
                  Tippe, um dich zu melden
                </Text>
              )}
            </>
          )}
        </View>

        {/* Status Card */}
        {!showSuccess && status?.nextDeadline && !isPaused && (
          <View style={[styles.statusCard, { backgroundColor: theme.surface }]}>
            <View style={styles.statusRow}>
              <Ionicons name="time-outline" size={24} color={theme.textSecondary} />
              <View style={styles.statusInfo}>
                <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>
                  Nächste Frist
                </Text>
                <Text style={[styles.statusValue, { color: theme.text }]}>
                  {formatDate(status.nextDeadline)}
                </Text>
                {hoursRemaining !== null && (
                  <Text
                    style={[
                      styles.statusRemaining,
                      { color: isWarning ? theme.warning : theme.textSecondary },
                    ]}
                  >
                    noch {hoursRemaining} Stunden
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Contacts Info */}
        {!showSuccess && (
          <View style={styles.contactsInfo}>
            <Ionicons name="people" size={18} color={theme.textSecondary} />
            <Text style={[styles.contactsText, { color: theme.textSecondary }]}>
              {activeContacts.length === 0
                ? 'Keine Kontakte hinzugefügt'
                : `${activeContacts.length} ${activeContacts.length === 1 ? 'Kontakt wird' : 'Kontakte werden'
                } benachrichtigt`}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  header: {
    paddingTop: Spacing.lg,
    alignItems: 'center',
  },
  greeting: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  lastCheckIn: {
    fontSize: Typography.fontSize.base,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonWrapper: {
    alignItems: 'center',
  },
  checkInButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  buttonText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginTop: Spacing.xs,
  },
  tapHint: {
    marginTop: Spacing.lg,
    fontSize: Typography.fontSize.base,
  },
  successContainer: {
    alignItems: 'center',
  },
  successCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  successTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  successTime: {
    fontSize: Typography.fontSize.lg,
    marginBottom: Spacing.lg,
  },
  successDeadline: {
    fontSize: Typography.fontSize.base,
  },
  statusCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.xs,
  },
  statusValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
  },
  statusRemaining: {
    fontSize: Typography.fontSize.sm,
    marginTop: Spacing.xs,
    fontWeight: '500',
  },
  contactsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  contactsText: {
    fontSize: Typography.fontSize.base,
  },
  retryButton: {
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
  },
});
