// app/(survivor)/convo/index.tsx — WhatsApp-style conversation list
import React, { useState, useEffect, useCallback } from 'react';
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
import { getSurvivorConversations } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

type ConvoRow = {
  id: string;
  authority_id: string;
  created_at?: string;
  updated_at?: string;
  lastMessage?: string;
  authorityName?: string;
  isDummy?: boolean;
};

const DUMMY_CONVOS: ConvoRow[] = [
  {
    id: 'dummy-1',
    authority_id: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    lastMessage: 'We are dispatching a rescue team to your area. Please stay safe.',
    authorityName: 'Disaster Response Team A',
    isDummy: true,
  },
  {
    id: 'dummy-2',
    authority_id: '',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
    lastMessage: 'Evacuation point: Stadium. Follow the signs.',
    authorityName: 'Emergency Coordinator',
    isDummy: true,
  },
  {
    id: 'dummy-3',
    authority_id: '',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
    lastMessage: 'Medical supplies are on the way. ETA 30 minutes.',
    authorityName: 'Medical Support Unit',
    isDummy: true,
  },
];

function formatTime(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000) return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  if (diff < 172800000) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function ConvoListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [convos, setConvos] = useState<ConvoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadConvos = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await getSurvivorConversations(user.id);
      const enriched: ConvoRow[] = [];
      for (const c of data as ConvoRow[]) {
        const { data: lastMsg } = await supabase
          .from('conversation_messages')
          .select('content')
          .eq('conversation_id', c.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        const { data: authProfile } = await supabase
          .from('authority_profiles')
          .select('full_name, service_name')
          .eq('id', c.authority_id)
          .single();
        enriched.push({
          ...c,
          lastMessage: lastMsg?.content ?? 'No messages yet',
          authorityName: authProfile?.service_name || authProfile?.full_name || 'Authority',
        });
      }
      setConvos([...enriched, ...DUMMY_CONVOS]);
    } catch {
      setConvos(DUMMY_CONVOS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadConvos();
  }, [loadConvos]);

  const onRefresh = () => {
    setRefreshing(true);
    loadConvos();
  };

  const renderItem = ({ item }: { item: ConvoRow }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(survivor)/convo/${item.id}` as any)}
      activeOpacity={0.8}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>📡</Text>
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardName} numberOfLines={1}>{item.authorityName ?? 'Authority'}</Text>
          <Text style={styles.cardTime}>{formatTime(item.updated_at)}</Text>
        </View>
        <Text style={styles.cardPreview} numberOfLines={2}>
          {item.lastMessage ?? 'No messages yet'}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Loading conversations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={convos}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptyDesc}>
              Authorities will start chats with you. Check back later.
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.accent]} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: Colors.textSecondary, fontSize: 14 },
  list: { padding: 16, paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 24 },
  cardContent: { flex: 1, minWidth: 0 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardName: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', flex: 1 },
  cardTime: { color: Colors.textMuted, fontSize: 11 },
  cardPreview: { color: Colors.textSecondary, fontSize: 13 },
  chevron: { color: Colors.textMuted, fontSize: 20, marginLeft: 8 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' },
  emptyDesc: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center', paddingHorizontal: 24 },
});
