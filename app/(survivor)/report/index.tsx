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
import { useT } from '@/lib/i18n';

type ReportRow = {
  id: string;
  disaster_type?: string;
  location_address?: string;
  severity?: number;
  status?: string;
  created_at?: string;
  immediate_needs?: string;
  description?: string;
};

const STATUS_COLORS: Record<string, string> = {
  submitted: Colors.accent,
  acknowledged: Colors.info,
  responding: '#F6AD55',
  resolved: Colors.success,
  draft: Colors.textMuted,
};

function generateTitle(r: ReportRow): string {
  const parts: string[] = [];
  if (r.disaster_type) parts.push(r.disaster_type.charAt(0).toUpperCase() + r.disaster_type.slice(1));
  if (r.location_address) {
    const short = r.location_address.length > 30 ? r.location_address.slice(0, 30) + '…' : r.location_address;
    parts.push(`at ${short}`);
  }
  if (parts.length > 0) return parts.join(' ');
  return 'Emergency Report';
}

function generateSnippet(r: ReportRow): string {
  if (r.immediate_needs) return `Needs: ${r.immediate_needs}`;
  if (r.description) return r.description.slice(0, 80);
  const severity = r.severity ? `Severity ${r.severity}/5` : '';
  const status = r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : '';
  return [severity, status].filter(Boolean).join(' · ') || 'Report submitted';
}

function formatDate(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  if (diffMs < 86400000) return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  if (diffMs < 172800000) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatDateFull(iso: string | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ReportListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const t = useT();
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

  const renderItem = ({ item }: { item: ReportRow }) => {
    const title = generateTitle(item);
    const snippet = generateSnippet(item);
    const statusColor = STATUS_COLORS[item.status ?? 'draft'] ?? Colors.textMuted;
    const isUnread = item.status === 'submitted' || item.status === 'acknowledged';

    return (
      <TouchableOpacity
        style={[styles.card, isUnread && styles.cardUnread]}
        onPress={() => router.push(`/(survivor)/report/${item.id}` as any)}
        activeOpacity={0.7}
      >
        {/* Left indicator dot */}
        <View style={[styles.dot, { backgroundColor: statusColor }]} />

        <View style={styles.cardBody}>
          {/* Top row: title + date */}
          <View style={styles.cardTopRow}>
            <Text style={[styles.cardTitle, isUnread && styles.cardTitleBold]} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
          </View>

          {/* Snippet */}
          <Text style={styles.cardSnippet} numberOfLines={2}>{snippet}</Text>

          {/* Footer: status badge + full date */}
          <View style={styles.cardFooter}>
            <View style={[styles.badge, { backgroundColor: `${statusColor}22` }]}>
              <Text style={[styles.badgeText, { color: statusColor }]}>
                {(item.status ?? 'draft').toUpperCase()}
              </Text>
            </View>
            <Text style={styles.cardDateFull}>{formatDateFull(item.created_at)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>{t('report.loading')}</Text>
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
            <Text style={styles.emptyTitle}>{t('report.empty')}</Text>
            <Text style={styles.emptyDesc}>{t('report.empty.desc')}</Text>
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
  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100 },

  // Email-inbox card
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardUnread: {
    borderColor: Colors.accent,
    borderLeftWidth: 0,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
    marginRight: 12,
  },
  cardBody: { flex: 1, minWidth: 0 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: '500', flex: 1, marginRight: 8 },
  cardTitleBold: { fontWeight: '700' },
  cardDate: { color: Colors.textMuted, fontSize: 11, flexShrink: 0 },
  cardSnippet: { color: Colors.textSecondary, fontSize: 13, lineHeight: 18, marginBottom: 8 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  cardDateFull: { color: Colors.textMuted, fontSize: 10 },

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
