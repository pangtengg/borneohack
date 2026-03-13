import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../../constants/colors';
import { useAuth } from '@/lib/auth/AuthContext';
import { useProfile } from '@/lib/auth/useProfile';
import {
  getConversationMessages,
  sendMessage,
  subscribeToMessages,
  getConversationById,
} from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

interface ChatMessage {
  id: string;
  content: string;
  role: 'survivor' | 'authority';
  created_at: string;
}

const DUMMY_MESSAGES: Record<string, ChatMessage[]> = {
  'dummy-1': [
    { id: 'd1', content: 'Hello, this is Disaster Response. We received your report. Are you safe?', role: 'authority', created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: 'd2', content: 'Yes, I am with 3 others. We need water and shelter.', role: 'survivor', created_at: new Date(Date.now() - 3500000).toISOString() },
    { id: 'd3', content: 'Noted. Relief team is en route to your location. ETA 45 minutes. Stay where you are.', role: 'authority', created_at: new Date(Date.now() - 3400000).toISOString() },
  ],
  'dummy-2': [
    { id: 'd4', content: 'Medical assistance required. One person injured.', role: 'authority', created_at: new Date(Date.now() - 7200000).toISOString() },
    { id: 'd5', content: 'Understood. Describe the injury if possible.', role: 'authority', created_at: new Date(Date.now() - 7100000).toISOString() },
  ],
  'dummy-3': [
    { id: 'd6', content: 'Evacuation order for Sector B. Please proceed to the nearest shelter.', role: 'authority', created_at: new Date(Date.now() - 86400000).toISOString() },
  ],
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export default function ConvoChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [convo, setConvo] = useState<{ survivor_id: string } | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const isDummy = id?.startsWith('dummy-');
  const isSurvivor = profile?.role !== 'authority';

  useEffect(() => {
    if (!id) return;

    if (isDummy) {
      setMessages(DUMMY_MESSAGES[id] ?? []);
      setConvo({ survivor_id: 'dummy' });
      setLoading(false);
      return;
    }

    let mounted = true;
    const load = async () => {
      const c = await getConversationById(id);
      if (!mounted) return;
      setConvo(c);

      const msgs = await getConversationMessages(id);
      if (!mounted) return;
      setMessages(msgs as ChatMessage[]);
      setLoading(false);
    };
    load();

    const channel = subscribeToMessages(id, (payload) => {
      if (!mounted) return;
      const inserted = (payload as { new?: ChatMessage }).new;
      if (inserted) setMessages((prev) => [...prev, inserted]);
    });

    return () => {
      mounted = false;
      channel.unsubscribe();
    };
  }, [id, isDummy]);

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || !user?.id || isDummy) return;

    setInput('');
    const newMsg: ChatMessage = {
      id: 'temp-' + Date.now(),
      content: trimmed,
      role: isSurvivor ? 'survivor' : 'authority',
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMsg]);
    scrollToBottom();

    try {
      const sent = await sendMessage(id, user.id, trimmed, newMsg.role);
      if (sent) {
        setMessages((prev) =>
          prev.map((m) => (m.id === newMsg.id ? { ...m, id: sent.id } : m))
        );
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== newMsg.id));
        Alert.alert('Error', 'Could not send message.');
      }
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.id !== newMsg.id));
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not send.');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.chat}
        contentContainerStyle={styles.chatContent}
      >
        {messages.map((m) => (
          <View
            key={m.id}
            style={[
              styles.bubble,
              m.role === (isSurvivor ? 'survivor' : 'authority')
                ? styles.bubbleMe
                : styles.bubbleThem,
            ]}
          >
            <Text style={styles.bubbleText}>{m.content}</Text>
            <Text style={styles.bubbleTime}>{formatTime(m.created_at)}</Text>
          </View>
        ))}
      </ScrollView>

      {!isDummy && (
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={Colors.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim()}
          >
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>
      )}

      {isDummy && (
        <View style={styles.dummyHint}>
          <Text style={styles.dummyHintText}>
            Demo conversation. Real chats appear when an authority starts a conversation with you.
          </Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: Colors.textSecondary, fontSize: 14 },
  chat: { flex: 1 },
  chatContent: { padding: 16, paddingBottom: 24 },
  bubble: {
    alignSelf: 'flex-start',
    maxWidth: '85%',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
  },
  bubbleMe: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.accent,
  },
  bubbleThem: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  bubbleText: { color: Colors.textPrimary, fontSize: 15, lineHeight: 22 },
  bubbleTime: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 4,
  },
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
  dummyHint: {
    padding: 16,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  dummyHintText: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
});
