import React, { useEffect, useState } from 'react';
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
import { useAuth } from '@/lib/auth/AuthContext';
import { getUserReports } from '@/lib/supabase';

type ReportRow = {
  id: string;
  disaster_type?: string;
  location_address?: string;
  severity?: number;
  status?: string;
  created_at?: string;
};

function formatDate(iso: string | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ReportListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReports = async () => {
    if (!user?.id) return;
    try {
      const data = await getUserReports(user.id);
      setReports((data ?? []) as ReportRow[]);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const renderItem = ({ item }: { item: ReportRow }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(survivor)/report/${item.id}` as any)}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardType}>{item.disaster_type ?? 'Report'}</Text>
        <View style={[styles.badge, { backgroundColor: `${Colors.accent}22` }]}>
          <Text style={styles.badgeText}>{item.status ?? 'draft'}</Text>
        </View>
      </View>
      <Text style={styles.cardLocation} numberOfLines={1}>
        {item.location_address || 'No location'}
      </Text>
      <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Loading reports...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No reports yet</Text>
            <Text style={styles.emptyDesc}>
              Tap the + button to create your first disaster report with AI guidance.
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.accent]} />
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(survivor)/report/new' as any)}
        activeOpacity={0.9}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: Colors.textSecondary, fontSize: 14 },
  list: { padding: 20, paddingBottom: 100 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardType: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: Colors.accent, fontSize: 11, fontWeight: '600' },
  cardLocation: { color: Colors.textSecondary, fontSize: 13, marginBottom: 4 },
  cardDate: { color: Colors.textMuted, fontSize: 11 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' },
  emptyDesc: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center', paddingHorizontal: 24 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: { color: Colors.background, fontSize: 28, fontWeight: '300', marginTop: -2 },
});
