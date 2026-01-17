import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { Typography, Spacing, BorderRadius } from '@/constants/typography';
import { useAuth } from '@/hooks/useAuth';
import { useCheckIn, formatDate, calculateHoursRemaining } from '@/hooks/useCheckIn';
import { useContacts } from '@/hooks/useContacts';

const WARNING_THRESHOLD_HOURS = 6;

export default function HomeScreen() {
  const { user } = useAuth();
  const { status, isLoading, isCheckingIn, checkIn, refreshStatus } = useCheckIn();
  const { contacts } = useContacts();
  const [showSuccess, setShowSuccess] = useState(false);

  const buttonScale = useSharedValue(1);
  const successOpacity = useSharedValue(0);

  const activeContacts = contacts.filter((c) => c.status === 'accepted');
  const hoursRemaining = calculateHoursRemaining(status?.nextDeadline ?? null);
  const isWarning = hoursRemaining !== null && hoursRemaining <= WARNING_THRESHOLD_HOURS;

  const handleCheckIn = async () => {
    try {
      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      // Button animation
      buttonScale.value = withSequence(
        withSpring(0.95, { damping: 10 }),
        withSpring(1, { damping: 10 })
      );

      await checkIn();

      // Success feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowSuccess(true);
      successOpacity.value = withSpring(1);

      // Hide success after 3 seconds
      setTimeout(() => {
        successOpacity.value = withSpring(0);
        setTimeout(() => setShowSuccess(false), 300);
      }, 3000);
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const successAnimatedStyle = useAnimatedStyle(() => ({
    opacity: successOpacity.value,
  }));

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const buttonColor = isWarning ? Colors.warning : Colors.primary;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Hallo, {user?.displayName || 'Nutzer'}!
          </Text>
          {status?.lastCheckIn && (
            <View style={styles.lastCheckInContainer}>
              <Text style={styles.lastCheckInLabel}>
                Dein letztes Lebenszeichen:
              </Text>
              <Text style={styles.lastCheckInTime}>
                {formatDate(status.lastCheckIn)}
              </Text>
            </View>
          )}
        </View>

        {/* Warning Banner */}
        {isWarning && !showSuccess && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningIcon}>&#x26A0;</Text>
            <Text style={styles.warningText}>Bitte melde dich bald!</Text>
          </View>
        )}

        {/* Check-in Button */}
        <View style={styles.buttonContainer}>
          {showSuccess ? (
            <Animated.View style={[styles.successContainer, successAnimatedStyle]}>
              <View style={styles.successCircle}>
                <Text style={styles.successIcon}>&#x2713;</Text>
              </View>
              <Text style={styles.successTitle}>Lebenszeichen gesendet!</Text>
              <Text style={styles.successTime}>
                {formatDate(status?.lastCheckIn ?? null)}
              </Text>
              <Text style={styles.successDeadline}>
                Nächste Frist: {formatDate(status?.nextDeadline ?? null)}
              </Text>
            </Animated.View>
          ) : (
            <>
              <Animated.View style={[styles.buttonWrapper, buttonAnimatedStyle]}>
                <Pressable
                  style={[styles.checkInButton, { backgroundColor: buttonColor }]}
                  onPress={handleCheckIn}
                  disabled={isCheckingIn}
                >
                  {isCheckingIn ? (
                    <ActivityIndicator size="large" color={Colors.white} />
                  ) : (
                    <>
                      <Text style={styles.checkmark}>&#x2713;</Text>
                      <Text style={styles.buttonText}>ALLES GUT</Text>
                    </>
                  )}
                </Pressable>
              </Animated.View>
              <Text style={styles.tapHint}>Tippe, um dich zu melden</Text>
            </>
          )}
        </View>

        {/* Status Card */}
        {!showSuccess && status?.nextDeadline && (
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusIcon}>&#x23F1;</Text>
              <View style={styles.statusInfo}>
                <Text style={styles.statusLabel}>Nächste Frist:</Text>
                <Text style={styles.statusValue}>
                  {formatDate(status.nextDeadline)}
                </Text>
                {hoursRemaining !== null && (
                  <Text
                    style={[
                      styles.statusRemaining,
                      isWarning && styles.statusRemainingWarning,
                    ]}
                  >
                    (noch {hoursRemaining} Stunden)
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Contacts Info */}
        {!showSuccess && (
          <View style={styles.contactsInfo}>
            <Text style={styles.contactsIcon}>&#x1F465;</Text>
            <Text style={styles.contactsText}>
              {activeContacts.length} Kontakte werden benachrichtigt
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
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    paddingTop: Spacing.lg,
    alignItems: 'center',
  },
  greeting: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  lastCheckInContainer: {
    alignItems: 'center',
  },
  lastCheckInLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  lastCheckInTime: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.warning,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  warningIcon: {
    fontSize: Typography.fontSize.lg,
  },
  warningText: {
    color: Colors.white,
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
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  checkmark: {
    fontSize: 48,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  buttonText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.white,
    letterSpacing: 1,
  },
  tapHint: {
    marginTop: Spacing.lg,
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  successContainer: {
    alignItems: 'center',
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  successIcon: {
    fontSize: 60,
    color: Colors.white,
  },
  successTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  successTime: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  successDeadline: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  statusCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  statusIcon: {
    fontSize: 24,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  statusValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  statusRemaining: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  statusRemainingWarning: {
    color: Colors.warning,
    fontWeight: '600',
  },
  contactsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  contactsIcon: {
    fontSize: 20,
  },
  contactsText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
});
