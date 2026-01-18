import { useEffect, useState, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { AuthContext, useAuthProvider } from '@/hooks/useAuth';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { useBiometric } from '@/hooks/useBiometric';
import { LockScreen } from '@/components';
import { registerForPushNotifications, setupNotificationChannels } from '@/services/notifications';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function RootLayoutInner() {
  const auth = useAuthProvider();
  const { theme, isDark } = useTheme();
  const { isAppLockEnabled, authenticate, biometricType, isLoading: isBiometricLoading } = useBiometric();
  const [isLocked, setIsLocked] = useState(false);
  const appState = useRef(AppState.currentState);
  const hasInitializedLock = useRef(false);

  useEffect(() => {
    if (!auth.isLoading) {
      SplashScreen.hideAsync();
    }
  }, [auth.isLoading]);

  // Register for push notifications when user is authenticated
  useEffect(() => {
    if (auth.isAuthenticated) {
      // Set up notification channels first
      setupNotificationChannels().then(() => {
        // Then register for push notifications
        registerForPushNotifications().catch(console.error);
      });
    }
  }, [auth.isAuthenticated]);

  // Initial lock check when app starts (if authenticated and lock enabled)
  useEffect(() => {
    if (!isBiometricLoading && !hasInitializedLock.current && auth.isAuthenticated && isAppLockEnabled) {
      hasInitializedLock.current = true;
      setIsLocked(true);
    }
  }, [isBiometricLoading, auth.isAuthenticated, isAppLockEnabled]);

  // Lock app when returning from background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      // Only lock when coming back to foreground from background
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        isAppLockEnabled &&
        auth.isAuthenticated
      ) {
        setIsLocked(true);
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isAppLockEnabled, auth.isAuthenticated]);

  const handleUnlock = useCallback(async () => {
    const success = await authenticate();
    if (success) {
      setIsLocked(false);
    }
  }, [authenticate]);

  if (auth.isLoading) {
    return null;
  }

  // Show lock screen when locked (only for authenticated users)
  if (isLocked && auth.isAuthenticated) {
    return (
      <ThemeProvider>
        <LockScreen onUnlock={handleUnlock} biometricType={biometricType} />
      </ThemeProvider>
    );
  }

  return (
    <AuthContext.Provider value={auth}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(main)" options={{ headerShown: false }} />
      </Stack>
    </AuthContext.Provider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutInner />
    </ThemeProvider>
  );
}
