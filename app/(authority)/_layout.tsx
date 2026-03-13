import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth/AuthContext';
import { useEffect } from 'react';

export default function AuthorityLayout() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/auth');
    }
  }, [session, loading, router]);

  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: 'Authority Dashboard' }} />
    </Stack>
  );
}
