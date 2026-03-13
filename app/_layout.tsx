import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useEffect } from 'react';
import { Colors } from '../constants/colors';
import { initializeDialectStore } from '@/lib/dialectStorage';
import { AuthProvider } from '@/lib/auth/AuthContext';

export default function RootLayout() {
  useEffect(() => {
    initializeDialectStore();
  }, []);

  return (
    <AuthProvider>
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
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="(survivor)" options={{ headerShown: false }} />
          <Stack.Screen name="(authority)" options={{ headerShown: false }} />
        </Stack>
      </View>
    </AuthProvider>
  );
}
