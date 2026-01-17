import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { AuthContext, useAuthProvider } from '@/hooks/useAuth';
import { Colors } from '@/constants/colors';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const auth = useAuthProvider();

  useEffect(() => {
    if (!auth.isLoading) {
      SplashScreen.hideAsync();
    }
  }, [auth.isLoading]);

  if (auth.isLoading) {
    return null;
  }

  return (
    <AuthContext.Provider value={auth}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(main)" options={{ headerShown: false }} />
      </Stack>
    </AuthContext.Provider>
  );
}
