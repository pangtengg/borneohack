import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '@/lib/auth/AuthContext';
import { Colors } from '../../constants/colors';

export default function AuthorityDashboardScreen() {
  const { signOut } = useAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Incoming Reports</Text>
        <Text style={styles.subtitle}>View reports, add notes, update status</Text>
      </View>

      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>No reports yet.</Text>
        <Text style={styles.placeholderHint}>WhatsApp-like report list coming soon. Pending / Responding / Resolved.</Text>
      </View>

      <TouchableOpacity style={styles.signOutBtn} onPress={() => signOut()}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 20, gap: 4 },
  title: { color: Colors.textPrimary, fontSize: 22, fontWeight: '700' },
  subtitle: { color: Colors.textSecondary, fontSize: 14 },
  placeholder: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  placeholderText: { color: Colors.textMuted, fontSize: 16 },
  placeholderHint: { color: Colors.textMuted, fontSize: 12, textAlign: 'center' },
  signOutBtn: {
    backgroundColor: Colors.danger,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signOutText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
