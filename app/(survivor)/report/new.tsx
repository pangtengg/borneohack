import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../../constants/colors';
import { useAuth } from '@/lib/auth/AuthContext';
import { useProfile } from '@/lib/auth/useProfile';
import { reportChat, ReportChatMessage } from '@/lib/api';
import { playBase64Audio } from '@/lib/audioPlayer';
import { createReport } from '@/lib/supabase';
import { EMERGENCY_PHRASES, Phrase } from '../../../constants/phrases';
import { getLanguageByCode } from '../../../constants/languages';
import { useAppStore } from '../../../lib/store';

const PHRASE_BTN_COLORS: Record<string, string> = {
  medical: Colors.danger,
  rescue: '#F6AD55',
  evacuation: Colors.info,
  children: '#B794F4',
};

export default function NewReportScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { targetLanguage } = useAppStore();
  const preferredLang = profile?.lang_speaking ?? profile?.lang_reading ?? targetLanguage ?? 'en';
  const langInfo = getLanguageByCode(preferredLang);

  const [messages, setMessages] = useState<ReportChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Start conversation with AI greeting
  useEffect(() => {
    if (messages.length === 0 && !loading) {
      setLoading(true);
      reportChat([], preferredLang)
        .then(({ reply }) => {
          setMessages([{ role: 'assistant', content: reply }]);
        })
        .catch((e) => {
          Alert.alert('Error', e instanceof Error ? e.message : 'Could not start report.');
        })
        .finally(() => setLoading(false));
    }
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;
    const trimmed = text.trim();
    setInput('');
    setSent(true);

    const userMsg: ReportChatMessage = { role: 'user', content: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);
    scrollToBottom();

    try {
      const { reply } = await reportChat(newMessages, preferredLang);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      scrollToBottom();

      // Check if report is complete
      const lower = reply.toLowerCase();
      if (lower.includes('report complete') || lower.includes('submitting to authorities')) {
        const qaPairs = extractQAPairs([...newMessages, { role: 'assistant', content: reply }]);
        const extracted = extractFromQAPairs(qaPairs);
        const userId = user?.id;
        if (userId) {
          const { error } = await createReport({
            user_id: userId,
            status: 'submitted',
            location_address: extracted.location,
            disaster_type: extracted.disasterType,
            severity: extracted.severity,
            people_affected: extracted.peopleAffected,
            injuries_critical: extracted.injuries,
            immediate_needs: extracted.immediateNeeds,
            qa_pairs: qaPairs,
            preferred_language: preferredLang,
          });
          if (error) console.warn('Report save error:', error);
        }
        Alert.alert('Report submitted', 'Your report has been sent to authorities.', [
          { text: 'OK', onPress: () => router.replace('/(survivor)/report') },
        ]);
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not send message.');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handlePhraseSelect = (phrase: Phrase) => {
    handleSend(phrase.text);
  };

  const handleSpeak = async (text: string) => {
    try {
      const res = await fetch(`${useAppStore.getState().serverUrl}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang: preferredLang }),
      });
      if (!res.ok) throw new Error('TTS failed');
      const { audioBase64 } = await res.json();
      await playBase64Audio(audioBase64);
    } catch {
      Alert.alert('Error', 'Could not play audio. Check server connection.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.chat}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={scrollToBottom}
      >
        {messages.map((m, i) => (
          <View key={i} style={[styles.bubble, m.role === 'user' ? styles.bubbleUser : styles.bubbleAi]}>
            <Text style={styles.bubbleText}>{m.content}</Text>
            {m.role === 'assistant' && (
              <TouchableOpacity style={styles.speakBtn} onPress={() => handleSpeak(m.content)}>
                <Text style={styles.speakIcon}>🔊</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        {loading && (
          <View style={[styles.bubble, styles.bubbleAi]}>
            <ActivityIndicator size="small" color={Colors.accent} />
          </View>
        )}
      </ScrollView>

      {/* Suggested phrases */}
      <View style={styles.phrasesRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.phrasesContent}>
          {EMERGENCY_PHRASES.slice(0, 8).map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[styles.phraseBtn, { borderColor: PHRASE_BTN_COLORS[p.category] ?? Colors.border }]}
              onPress={() => handlePhraseSelect(p)}
              disabled={loading}
            >
              <Text style={styles.phraseIcon}>{p.icon}</Text>
              <Text style={styles.phraseText} numberOfLines={1}>{p.text}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={`Type your answer (${langInfo.label})...`}
          placeholderTextColor={Colors.textMuted}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
          editable={!loading}
          onSubmitEditing={() => handleSend(input)}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
          onPress={() => handleSend(input)}
          disabled={!input.trim() || loading}
        >
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function extractQAPairs(messages: ReportChatMessage[]): Array<{ question: string; answer: string }> {
  const pairs: Array<{ question: string; answer: string }> = [];
  for (let i = 0; i < messages.length - 1; i += 2) {
    if (messages[i].role === 'assistant' && messages[i + 1]?.role === 'user') {
      pairs.push({ question: messages[i].content, answer: messages[i + 1].content });
    }
  }
  return pairs;
}

function extractFromQAPairs(pairs: Array<{ question: string; answer: string }>): {
  location?: string;
  disasterType?: string;
  severity?: number;
  peopleAffected?: number;
  injuries?: string;
  immediateNeeds?: string;
} {
  const result: { location?: string; disasterType?: string; severity?: number; peopleAffected?: number; injuries?: string; immediateNeeds?: string } = {};
  for (const { question, answer } of pairs) {
    const q = question.toLowerCase();
    if (q.includes('location') || q.includes('where are you') || q.includes('address')) result.location = answer.trim();
    else if (q.includes('disaster') || q.includes('what happened')) result.disasterType = answer.trim();
    else if (q.includes('severity') || q.includes('how severe')) {
      const n = parseInt(answer.replace(/\D/g, ''), 10);
      if (!isNaN(n)) result.severity = Math.min(5, Math.max(1, n));
    } else if (q.includes('people') || q.includes('how many')) {
      const n = parseInt(answer.replace(/\D/g, ''), 10);
      if (!isNaN(n)) result.peopleAffected = n;
    }
    else if (q.includes('injuries') || q.includes('injured')) result.injuries = answer.trim();
    else if (q.includes('immediate needs') || q.includes('what do you need')) result.immediateNeeds = answer.trim();
  }
  return result;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  chat: { flex: 1 },
  chatContent: { padding: 16, paddingBottom: 24 },
  bubble: {
    alignSelf: 'flex-start',
    maxWidth: '85%',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.accent,
  },
  bubbleAi: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  bubbleText: { color: Colors.textPrimary, fontSize: 15, lineHeight: 22 },
  speakBtn: { marginTop: 8 },
  speakIcon: { fontSize: 18 },
  phrasesRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
  },
  phrasesContent: { paddingHorizontal: 12, gap: 8, flexDirection: 'row' },
  phraseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
  },
  phraseIcon: { fontSize: 16 },
  phraseText: { color: Colors.textPrimary, fontSize: 12, fontWeight: '600', maxWidth: 120 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendText: { color: Colors.background, fontWeight: '700', fontSize: 14 },
});
