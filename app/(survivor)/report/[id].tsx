import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../../constants/colors';
import { useProfile } from '@/lib/auth/useProfile';
import { getReportById } from '@/lib/supabase';
import { playBase64Audio } from '@/lib/audioPlayer';
import { speakText } from '@/lib/api';
import { getLanguageByCode } from '../../../constants/languages';
import { useAppStore } from '../../../lib/store';

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useProfile();
  const preferredLang = profile?.lang_reading ?? profile?.lang_speaking ?? 'en';
  const langInfo = getLanguageByCode(preferredLang);

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      getReportById(id).then((r) => {
        setReport(r);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [id]);

  const handleSpeak = async (text: string, index: number) => {
    try {
      setPlayingIndex(index);
      const { audioBase64 } = await speakText(text, preferredLang);
      await playBase64Audio(audioBase64);
    } catch {
      Alert.alert('Error', 'Could not play audio. Check server connection.');
    } finally {
      setPlayingIndex(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Report not found.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const qaPairs = (report.qa_pairs || []) as Array<{ question: string; answer: string }>;
  const createdAt = report.created_at
    ? new Date(report.created_at).toLocaleDateString(langInfo.code === 'en' ? 'en-US' : undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.date}>{createdAt}</Text>
        <Text style={styles.langHint}>Display: {langInfo.flag} {langInfo.label}</Text>
      </View>

      {qaPairs.length === 0 ? (
        <Text style={styles.emptyText}>No Q&A recorded.</Text>
      ) : (
        qaPairs.map((pair, i) => (
          <View key={i} style={styles.qaCard}>
            <View style={styles.qRow}>
              <Text style={styles.qLabel}>Q{i + 1}</Text>
              <Text style={styles.qText}>{pair.question}</Text>
              <TouchableOpacity
                style={styles.speakBtn}
                onPress={() => handleSpeak(pair.question, i * 2)}
                disabled={playingIndex !== null}
              >
                <Text style={styles.speakIcon}>
                  {playingIndex === i * 2 ? '⏳' : '🔊'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.aRow}>
              <Text style={styles.aLabel}>A</Text>
              <Text style={styles.aText}>{pair.answer}</Text>
              <TouchableOpacity
                style={styles.speakBtn}
                onPress={() => handleSpeak(pair.answer, i * 2 + 1)}
                disabled={playingIndex !== null}
              >
                <Text style={styles.speakIcon}>
                  {playingIndex === i * 2 + 1 ? '⏳' : '🔊'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  errorText: { color: Colors.textSecondary, marginBottom: 16 },
  backBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backBtnText: { color: Colors.background, fontWeight: '700' },
  header: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  date: { color: Colors.textSecondary, fontSize: 14 },
  langHint: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
  emptyText: { color: Colors.textMuted, fontStyle: 'italic' },
  qaCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 14,
  },
  qRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  qLabel: {
    color: Colors.accent,
    fontWeight: '700',
    fontSize: 12,
    width: 24,
  },
  qText: { flex: 1, color: Colors.textPrimary, fontSize: 14, lineHeight: 20 },
  aRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 10 },
  aLabel: {
    color: Colors.success,
    fontWeight: '700',
    fontSize: 12,
    width: 24,
  },
  aText: { flex: 1, color: Colors.textSecondary, fontSize: 14, lineHeight: 20 },
  speakBtn: { padding: 4 },
  speakIcon: { fontSize: 18 },
});
