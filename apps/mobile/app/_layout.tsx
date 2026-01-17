import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { AuthContext, useAuthProvider } from '@/hooks/useAuth';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { registerForPushNotifications, setupNotificationChannels } from '@/services/notifications';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function RootLayoutInner() {
  const auth = useAuthProvider();
  const { theme, isDark } = useTheme();

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

  if (auth.isLoading) {
    return null;
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
