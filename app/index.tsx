import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Colors } from '../constants/colors';
import { useAuth } from '../lib/auth/AuthContext';
import { useProfile } from '../lib/auth/useProfile';

export default function IndexScreen() {
  const { session, loading: authLoading, signOut } = useAuth();
  const { role, loading: profileLoading } = useProfile();

  if (authLoading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Initializing Auth...</Text>
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/auth" />;
  }

  if (profileLoading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Loading Profile...</Text>
        <TouchableOpacity onPress={() => signOut()} style={styles.errorBtn}>
          <Text style={styles.errorText}>Reset Session</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (role === 'authority') {
    return <Redirect href="/(authority)" />;
  }

  return <Redirect href="/(survivor)/(tabs)" />;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 14,
    letterSpacing: 1,
  },
  errorBtn: {
    marginTop: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 12,
  },
});
