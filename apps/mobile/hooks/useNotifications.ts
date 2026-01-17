import { useEffect, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  registerForPushNotifications,
  areNotificationsEnabled,
  checkDndPermission,
  requestDndPermission,
  addNotificationResponseListener,
  addNotificationReceivedListener,
} from '@/services/notifications';
import type { NotificationResponse, Notification } from 'expo-notifications';

interface UseNotificationsReturn {
  pushToken: string | null;
  isEnabled: boolean;
  isDndBypassed: boolean;
  isLoading: boolean;
  registerNotifications: () => Promise<void>;
  requestDndBypass: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isDndBypassed, setIsDndBypassed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkPermissions = useCallback(async () => {
    const enabled = await areNotificationsEnabled();
    const dndBypassed = await checkDndPermission();
    setIsEnabled(enabled);
    setIsDndBypassed(dndBypassed);
  }, []);

  const registerNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await registerForPushNotifications();
      setPushToken(token);
      await checkPermissions();
    } finally {
      setIsLoading(false);
    }
  }, [checkPermissions]);

  const requestDndBypass = useCallback(async () => {
    await requestDndPermission();
  }, []);

  // Initialize on mount
  useEffect(() => {
    registerNotifications();
  }, [registerNotifications]);

  // Re-check permissions when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkPermissions();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [checkPermissions]);

  // Set up notification listeners
  useEffect(() => {
    // Handle notification taps
    const responseSubscription = addNotificationResponseListener(
      (response: NotificationResponse) => {
        const data = response.notification.request.content.data;
        console.log('Notification tapped:', data);

        // Handle different notification types
        if (data?.type === 'alert') {
          // User tapped on an emergency alert
          // Could navigate to a specific screen here
        }
      }
    );

    // Handle notifications received while app is in foreground
    const receivedSubscription = addNotificationReceivedListener(
      (notification: Notification) => {
        console.log('Notification received:', notification);
      }
    );

    return () => {
      responseSubscription.remove();
      receivedSubscription.remove();
    };
  }, []);

  return {
    pushToken,
    isEnabled,
    isDndBypassed,
    isLoading,
    registerNotifications,
    requestDndBypass,
  };
}
