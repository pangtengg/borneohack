import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '@/lib/auth/AuthContext';
import { Colors } from '../../constants/colors';
import {
  getAuthorityBroadcasts,
  createBroadcast,
  updateBroadcast,
  deleteBroadcast,
} from '@/lib/supabase';

type BroadcastRow = {
  id: string;
  title: string;
  summary: string;
  body: string;
  sender: string | null;
  created_at: string;
};

export default function AuthorityDashboardScreen() {
  const { user, signOut } = useAuth();
  const [broadcasts, setBroadcasts] = useState<BroadcastRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', summary: '', body: '', sender: 'Disaster Response Authority' });

  const loadBroadcasts = async () => {
    if (!user?.id) return;
    try {
      const data = await getAuthorityBroadcasts(user.id);
      setBroadcasts(data ?? []);
    } catch {
      setBroadcasts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBroadcasts();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    loadBroadcasts();
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ title: '', summary: '', body: '', sender: 'Disaster Response Authority' });
    setModalVisible(true);
  };

  const openEdit = (b: BroadcastRow) => {
    setEditingId(b.id);
    setForm({
      title: b.title,
      summary: b.summary,
      body: b.body,
      sender: b.sender ?? 'Disaster Response Authority',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.summary.trim() || !form.body.trim()) {
      Alert.alert('Validation', 'Title, summary, and body are required.');
      return;
    }
    if (!user?.id) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateBroadcast(editingId, {
          title: form.title.trim(),
          summary: form.summary.trim(),
          body: form.body.trim(),
          sender: form.sender.trim(),
        });
      } else {
        await createBroadcast({
          title: form.title.trim(),
          summary: form.summary.trim(),
          body: form.body.trim(),
          sender: form.sender.trim(),
          authority_id: user.id,
        });
      }
      setModalVisible(false);
      loadBroadcasts();
    } catch (e) {
      Alert.alert('Error', (e as Error).message ?? 'Failed to save broadcast');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Broadcast',
      'Are you sure you want to delete this broadcast?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBroadcast(id);
              loadBroadcasts();
            } catch {
              Alert.alert('Error', 'Failed to delete broadcast');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.accent]} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Incoming Reports</Text>
        <Text style={styles.subtitle}>View reports, add notes, update status</Text>
      </View>

      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>No reports yet.</Text>
        <Text style={styles.placeholderHint}>
          WhatsApp-like report list coming soon. Pending / Responding / Resolved.
        </Text>
      </View>

      <View style={styles.broadcastSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Broadcasts</Text>
          <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
            <Text style={styles.addBtnText}>+ New</Text>
          </TouchableOpacity>
        </View>
        {broadcasts.length === 0 ? (
          <View style={styles.emptyBroadcasts}>
            <Text style={styles.emptyText}>No broadcasts yet. Tap + New to create one.</Text>
          </View>
        ) : (
          broadcasts.map((b) => (
            <View key={b.id} style={styles.broadcastCard}>
              <Text style={styles.broadcastTitle} numberOfLines={1}>
                {b.title}
              </Text>
              <Text style={styles.broadcastSummary} numberOfLines={2}>
                {b.summary}
              </Text>
              <View style={styles.broadcastActions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(b)}>
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(b.id)}>
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      <TouchableOpacity style={styles.signOutBtn} onPress={() => signOut()}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingId ? 'Edit Broadcast' : 'New Broadcast'}</Text>
            <TextInput
              style={styles.input}
              placeholder="Title"
              placeholderTextColor={Colors.textMuted}
              value={form.title}
              onChangeText={(t) => setForm((f) => ({ ...f, title: t }))}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Summary (short)"
              placeholderTextColor={Colors.textMuted}
              value={form.summary}
              onChangeText={(t) => setForm((f) => ({ ...f, summary: t }))}
              multiline
              numberOfLines={2}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Full body"
              placeholderTextColor={Colors.textMuted}
              value={form.body}
              onChangeText={(t) => setForm((f) => ({ ...f, body: t }))}
              multiline
              numberOfLines={6}
            />
            <TextInput
              style={styles.input}
              placeholder="Sender (e.g. Disaster Response Authority)"
              placeholderTextColor={Colors.textMuted}
              value={form.sender}
              onChangeText={(t) => setForm((f) => ({ ...f, sender: t }))}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: Colors.textSecondary, fontSize: 14 },
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
  broadcastSection: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' },
  addBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  emptyBroadcasts: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 20,
  },
  emptyText: { color: Colors.textMuted, fontSize: 14 },
  broadcastCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 12,
  },
  broadcastTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  broadcastSummary: { color: Colors.textSecondary, fontSize: 14, marginBottom: 12 },
  broadcastActions: { flexDirection: 'row', gap: 12 },
  editBtn: { paddingVertical: 6 },
  editBtnText: { color: Colors.accent, fontSize: 14, fontWeight: '600' },
  deleteBtn: { paddingVertical: 6 },
  deleteBtnText: { color: Colors.danger, fontSize: 14, fontWeight: '600' },
  signOutBtn: {
    backgroundColor: Colors.danger,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signOutText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: '700', marginBottom: 20 },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: Colors.border,
    alignItems: 'center',
  },
  cancelBtnText: { color: Colors.textSecondary, fontWeight: '600' },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: Colors.accent,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '600' },
});
