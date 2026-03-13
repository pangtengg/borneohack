import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../../constants/colors';
import { getBroadcasts } from '@/lib/supabase';

export type BroadcastItem = {
  id: string;
  title: string;
  summary: string;
  body: string;
  sender: string;
  createdAt: string;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function BroadcastListScreen() {
  const router = useRouter();
  const [broadcasts, setBroadcasts] = useState<BroadcastItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBroadcasts = async () => {
    try {
      const data = await getBroadcasts();
      setBroadcasts(
        (data ?? []).map((row: { id: string; title: string; summary: string; body: string; sender: string; created_at: string }) => ({
          id: row.id,
          title: row.title,
          summary: row.summary ?? '',
          body: row.body ?? '',
          sender: row.sender ?? 'Authorities',
          createdAt: row.created_at,
        }))
      );
    } catch {
      setBroadcasts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadBroadcasts(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadBroadcasts();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Loading broadcasts...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={broadcasts}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.accent]} />
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📡</Text>
          <Text style={styles.emptyTitle}>No broadcasts yet</Text>
          <Text style={styles.emptyDesc}>Authorities will post emergency updates here.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push(`/broadcast/${item.id}`)}
          activeOpacity={0.7}
        >
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.summary} numberOfLines={2}>{item.summary}</Text>
          <Text style={styles.meta}>
            {item.sender} · {formatDate(item.createdAt)}
          </Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: Colors.textSecondary, fontSize: 14 },
  list: { padding: 16, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' },
  emptyDesc: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center', paddingHorizontal: 24 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 12,
  },
  title: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  summary: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: 8 },
  meta: { color: Colors.textMuted, fontSize: 12 },
});
