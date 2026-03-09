import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/colors';
import { initializeDialectStore } from '../lib/dialectStorage';
import { AuthProvider, useAuth } from '../lib/authContext';
import { useLocationTracking } from '../lib/useLocationTracking';

// Only tracks location when authenticated
function LocationTracker() {
  useLocationTracking();
  return null;
}

// Auth guard — redirects unauthenticated users to /auth, authenticated away from it
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!user && !inAuthGroup) {
      // Not logged in → go to auth screen
      router.replace('/auth');
    } else if (user && inAuthGroup) {
      // Already logged in → go to app
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <>
      {user && <LocationTracker />}
      {children}
    </>
  );
}

function RootLayoutNav() {
  return (
    <AuthGuard>
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        <StatusBar style="light" backgroundColor={Colors.background} />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: Colors.background },
            headerTintColor: Colors.textPrimary,
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: Colors.background },
            headerShadowVisible: false,
          }}
        >
          {/* Auth screen — no header, no tabs */}
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          {/* Main app with tabs */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </View>
    </AuthGuard>
  );
}

export default function RootLayout() {
  useEffect(() => {
    initializeDialectStore();
  }, []);

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}