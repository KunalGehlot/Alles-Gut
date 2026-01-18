import React, { useState, useCallback, useEffect } from 'react';
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
  withRepeat,
  withTiming,
  Easing,
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
  const breathingScale = useSharedValue(1);

  const activeContacts = contacts.filter((c) => c.status === 'accepted');
  const hoursRemaining = calculateHoursRemaining(status?.nextDeadline ?? null);
  const isWarning = hoursRemaining !== null && hoursRemaining <= WARNING_THRESHOLD_HOURS;
  // Use user.isPaused as primary source (updated immediately from settings),
  // fall back to status.isPaused for initial load
  const isPaused = user?.isPaused ?? status?.isPaused ?? false;

  // Start breathing animation on mount
  useEffect(() => {
    if (!isPaused && !showSuccess) {
      breathingScale.value = withRepeat(
        withTiming(1.05, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
        }),
        -1, // infinite repeat
        true // reverse
      );
    } else {
      breathingScale.value = withTiming(1, { duration: 300 });
    }
  }, [isPaused, showSuccess]);

  const handleCheckIn = async () => {
    // if (isPaused) return; // Allow check-in to unpause/verify

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
    transform: [{ scale: buttonScale.value * breathingScale.value }],
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
    ? theme.primary // Allow interaction
    : isWarning
      ? theme.warning
      : theme.primary;

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Guten Morgen', icon: 'sunny-outline' as const };
    if (hour < 18) return { text: 'Guten Tag', icon: 'partly-sunny-outline' as const };
    return { text: 'Guten Abend', icon: 'moon-outline' as const };
  };

  const greeting = getGreeting();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* Time-based Greeting */}
        <View style={styles.timeGreeting}>
          <Ionicons name={greeting.icon} size={20} color={theme.textSecondary} />
          <Text style={[styles.timeGreetingText, { color: theme.textSecondary }]}>
            {greeting.text}
          </Text>
        </View>

        {/* Main Heading */}
        <View style={styles.header}>
          <Text style={[styles.mainHeading, { color: theme.text }]}>
            Wie geht's dir?
          </Text>
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
              {/* Ready for Check-in Button */}
              {!isPaused && (
                <View style={[styles.readyButton, { backgroundColor: theme.surface }]}>
                  <Text style={[styles.readyButtonText, { color: theme.textSecondary }]}>
                    Bereit für Check-In
                  </Text>
                </View>
              )}

              <Animated.View style={[styles.buttonWrapper, buttonAnimatedStyle]}>
                <Pressable
                  style={[styles.checkInButton, { backgroundColor: buttonColor }]}
                  onPress={handleCheckIn}
                  disabled={isCheckingIn} // Enable even if paused
                >
                  {isCheckingIn ? (
                    <ActivityIndicator size="large" color="#FFFFFF" />
                  ) : (
                    <>
                      <View style={[styles.checkmarkCircle, { borderColor: theme.background }]}>
                        <Ionicons
                          name={'checkmark'}
                          size={64}
                          color={theme.background}
                        />
                      </View>
                      <Text style={styles.buttonText}>
                        {isPaused ? 'ALLES GUT' : 'ALLES GUT'}
                      </Text>
                    </>
                  )}
                </Pressable>
              </Animated.View>
              {!isPaused && (
                <Text style={[styles.tapHint, { color: theme.textSecondary }]}>
                  Ein Tap genügt, um alle zu beruhigen.
                </Text>
              )}
            </>
          )}
        </View>

        {/* Info Cards */}
        {!showSuccess && (
          <View style={styles.infoCardsContainer}>
            {/* Last Check-in Card */}
            <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
              <View style={[styles.iconCircle, { backgroundColor: theme.background }]}>
                <Ionicons name="time-outline" size={20} color={theme.primary} />
              </View>
              <View style={styles.infoCardContent}>
                <Text style={[styles.infoCardLabel, { color: theme.textSecondary }]}>
                  Letzter Check-In
                </Text>
                <Text style={[styles.infoCardValue, { color: theme.text }]}>
                  {status?.lastCheckIn ? formatDate(status.lastCheckIn).split(',')[0] : 'Noch kein Check-In'}
                </Text>
              </View>
            </View>

            {/* Contacts Card */}
            <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
              <View style={[styles.iconCircle, { backgroundColor: theme.background }]}>
                <Ionicons name="people" size={20} color={theme.primary} />
              </View>
              <View style={styles.infoCardContent}>
                <Text style={[styles.infoCardLabel, { color: theme.textSecondary }]}>
                  Kontakte
                </Text>
                <Text style={[styles.infoCardValue, { color: theme.text }]}>
                  {activeContacts.length === 0 ? 'Keine' : activeContacts.length.toString()}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Warning notification */}
        {!showSuccess && hoursRemaining !== null && hoursRemaining <= WARNING_THRESHOLD_HOURS && !isPaused && (
          <Text style={[styles.warningNotification, { color: theme.textSecondary }]}>
            Benachrichtigung nach 48 Stunden ohne Check-In
          </Text>
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
  timeGreeting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingTop: Spacing.md,
  },
  timeGreetingText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
  },
  header: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  mainHeading: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: '700',
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
  readyButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.lg,
  },
  readyButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
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
  checkmarkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
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
  infoCardsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  infoCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCardContent: {
    flex: 1,
  },
  infoCardLabel: {
    fontSize: Typography.fontSize.xs,
    marginBottom: Spacing.xs,
  },
  infoCardValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
  },
  warningNotification: {
    fontSize: Typography.fontSize.xs,
    textAlign: 'center',
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
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
