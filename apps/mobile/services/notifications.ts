import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Linking, Alert } from 'react-native';
import { api } from './api';

// Critical alert channel ID for Android
const CRITICAL_CHANNEL_ID = 'emergency-alerts';
const DEFAULT_CHANNEL_ID = 'default';
const isExpoGo = Constants.appOwnership === 'expo';

// Check if push notifications are supported (not in Expo Go on Android)
const isPushSupported = !(isExpoGo && Platform.OS === 'android');

// Configure how notifications are displayed when app is in foreground
// Only set up if push notifications are supported
if (isPushSupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
    }),
  });
}
const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function getProjectId(): string | null {
  const projectId =
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
    process.env.EAS_PROJECT_ID ||
    (Constants.expoConfig?.extra as any)?.eas?.projectId ||
    (Constants.expoConfig as any)?.projectId ||
    (Constants as any).easConfig?.projectId;

  if (!projectId || typeof projectId !== 'string' || !UUID_REGEX.test(projectId)) {
    return null;
  }

  return projectId;
}

/**
 * Set up notification channels for Android
 * Creates a high-priority channel that bypasses Do Not Disturb
 */
export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android' || !isPushSupported) return;

  // Create the critical/emergency alert channel
  await Notifications.setNotificationChannelAsync(CRITICAL_CHANNEL_ID, {
    name: 'Notfall-Benachrichtigungen',
    description: 'Wichtige Benachrichtigungen wenn ein Kontakt sich nicht meldet',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 500, 250, 500, 250, 500],
    lightColor: '#FF0000',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: true, // Bypass Do Not Disturb
    sound: 'default', // Use system default sound
    enableLights: true,
    enableVibrate: true,
  });

  // Create the default channel for regular notifications
  await Notifications.setNotificationChannelAsync(DEFAULT_CHANNEL_ID, {
    name: 'Allgemeine Benachrichtigungen',
    description: 'Erinnerungen und allgemeine Benachrichtigungen',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#2D7D46',
    sound: 'default',
  });
}

/**
 * Check if DND override permission is granted on Android
 */
export async function checkDndPermission(): Promise<boolean> {
  if (Platform.OS !== 'android' || !isPushSupported) return true;

  // On Android 6+, we need ACCESS_NOTIFICATION_POLICY permission
  // This is automatically requested by Expo when notifications are set up
  // But the user needs to grant it in system settings
  const channels = await Notifications.getNotificationChannelsAsync();
  const criticalChannel = channels.find(c => c.id === CRITICAL_CHANNEL_ID);

  // Check if the channel exists and has bypassDnd enabled
  return criticalChannel?.bypassDnd === true;
}

/**
 * Request DND override permission from the user
 * This opens the system settings page where the user can grant permission
 */
export async function requestDndPermission(): Promise<void> {
  if (Platform.OS !== 'android') return;

  Alert.alert(
    'Kritische Benachrichtigungen',
    'Damit du im Notfall auch bei "Nicht stören" benachrichtigt wirst, musst du der App diese Berechtigung erteilen.',
    [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Einstellungen öffnen',
        onPress: () => {
          // Open Android notification settings
          Linking.openSettings();
        },
      },
    ]
  );
}

/**
 * Register for push notifications and get the Expo push token
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Check if we're on a physical device
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Expo Go on Android cannot deliver remote push notifications; use a dev build instead
  if (!isPushSupported) {
    console.warn('Push notifications not supported in Expo Go on Android. Use a development build for push notifications.');
    return null;
  }

  const projectId = getProjectId();
  if (!projectId) {
    console.warn(
      'Skipping push token fetch: missing EAS project ID. Set expo.extra.eas.projectId or EXPO_PUBLIC_EAS_PROJECT_ID.'
    );
    return null;
  }

  // Set up notification channels first
  await setupNotificationChannels();

  // Check current permission status
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permission if not already granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        // Request critical alerts for iOS (requires entitlement from Apple)
        allowCriticalAlerts: true,
      },
      android: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

  try {
    // Get the Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    const token = tokenData.data;
    console.log('Expo push token:', token);

    // Register the token with our backend
    await api.registerPushToken(token);

    return token;
  } catch (error) {
    console.error('Failed to get push token:', error);
    return null;
  }
}

/**
 * Check if push notifications are enabled
 */
export async function areNotificationsEnabled(): Promise<boolean> {
  if (!isPushSupported) return false;
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

/**
 * Get the current push token if one exists
 */
export async function getCurrentPushToken(): Promise<string | null> {
  if (!isPushSupported) {
    return null;
  }

  const projectId = getProjectId();
  if (!projectId) {
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    return tokenData.data;
  } catch {
    return null;
  }
}

/**
 * Schedule a local notification (for testing)
 */
export async function scheduleTestNotification(): Promise<void> {
  if (!isPushSupported) {
    console.warn('Local notifications not supported in Expo Go on Android');
    return;
  }
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Test Benachrichtigung',
      body: 'Dies ist eine Test-Benachrichtigung von Alles Gut.',
      sound: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
    },
    trigger: {
      seconds: 2,
      channelId: CRITICAL_CHANNEL_ID,
    },
  });
}

// No-op subscription for when notifications aren't supported
const noOpSubscription: Notifications.EventSubscription = {
  remove: () => { },
};

/**
 * Add a listener for notification responses (when user taps a notification)
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.EventSubscription {
  if (!isPushSupported) return noOpSubscription;
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Add a listener for notifications received while app is in foreground
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.EventSubscription {
  if (!isPushSupported) return noOpSubscription;
  return Notifications.addNotificationReceivedListener(callback);
}
