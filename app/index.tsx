import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';
import { useAuth } from '@/lib/auth/AuthContext';
import { useProfile } from '@/lib/auth/useProfile';

export default function IndexScreen() {
  const { session, loading: authLoading } = useAuth();
  const { role, loading: profileLoading } = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      router.replace('/auth' as any);
      return;
    }
    if (profileLoading) return;
    if (role === 'authority') {
      router.replace('/(authority)' as any);
    } else {
      router.replace('/(survivor)/(tabs)' as any);
    }
  }, [session, authLoading, role, profileLoading, router]);

  return (
    <View style={styles.splash}>
      <ActivityIndicator size="large" color={Colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
