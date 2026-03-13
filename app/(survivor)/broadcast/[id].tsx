import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '../../../constants/colors';
import { getBroadcastById } from '@/lib/supabase';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function BroadcastDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [broadcast, setBroadcast] = useState<{ title: string; body: string; sender: string; created_at: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    getBroadcastById(id).then((data) => {
      setBroadcast(data ? { title: data.title, body: data.body, sender: data.sender ?? 'Authorities', created_at: data.created_at } : null);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }
  if (!broadcast) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Broadcast not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{broadcast.title}</Text>
      <Text style={styles.meta}>{broadcast.sender} · {formatDate(broadcast.created_at)}</Text>
      <Text style={styles.body}>{broadcast.body}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { color: Colors.textSecondary },
  title: { color: Colors.textPrimary, fontSize: 20, fontWeight: '700', marginBottom: 8 },
  meta: { color: Colors.textMuted, fontSize: 13, marginBottom: 20 },
  body: { color: Colors.textSecondary, fontSize: 15, lineHeight: 24 },
});
