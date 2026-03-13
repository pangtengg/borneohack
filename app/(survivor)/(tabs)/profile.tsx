import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Colors } from '../../../constants/colors';
import { SUPPORTED_LANGUAGES } from '../../../constants/languages';
import { useAuth } from '@/lib/auth/AuthContext';
import { useProfile } from '@/lib/auth/useProfile';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';

export default function ProfileScreen() {
  const { user } = useAuth();
  const { profile } = useProfile();

  const [displayName, setDisplayName] = useState('');
  const [langReading, setLangReading] = useState('en');
  const [langSpeaking, setLangSpeaking] = useState('en');
  const [langListening, setLangListening] = useState('en');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? '');
      setLangReading(profile.lang_reading ?? 'en');
      setLangSpeaking(profile.lang_speaking ?? 'en');
      setLangListening(profile.lang_listening ?? 'en');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('survivor_profiles')
        .upsert(
          {
            id: user.id,
            display_name: displayName.trim() || 'Survivor',
            lang_reading: langReading,
            lang_speaking: langSpeaking,
            lang_listening: langListening,
          },
          { onConflict: 'id' }
        );
      if (error) throw error;
      const lang = SUPPORTED_LANGUAGES.find((l) => l.code === langReading) ?? SUPPORTED_LANGUAGES[0];
      useAppStore.getState().setMyLanguage(langReading, lang.label, lang.flag);
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (e) {
      const err = e as { message?: string };
      const msg = err?.message ?? (e instanceof Error ? e.message : 'Could not save profile.');
      console.error('[Profile save]', err);
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>PROFILE</Text>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Display name</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Your name or nickname"
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      <Text style={styles.sectionTitle}>PREFERRED LANGUAGES</Text>
      <View style={styles.langSection}>
        {(['Reading', 'Speaking', 'Listening'] as const).map((label, i) => {
          const key = label.toLowerCase() as 'reading' | 'speaking' | 'listening';
          const value = key === 'reading' ? langReading : key === 'speaking' ? langSpeaking : langListening;
          const setter = key === 'reading' ? setLangReading : key === 'speaking' ? setLangSpeaking : setLangListening;
          return (
            <View key={key} style={styles.langRow}>
              <Text style={styles.inputLabel}>{label}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.langScroll}>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <TouchableOpacity key={lang.code} style={[styles.langChip, value === lang.code && styles.langChipActive]} onPress={() => setter(lang.code)}>
                    <Text style={styles.langFlag}>{lang.flag}</Text>
                    <Text style={[styles.langText, value === lang.code && { color: Colors.accent }]}>{lang.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          );
        })}
      </View>

      <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save profile'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, gap: 20, paddingBottom: 40 },
  sectionTitle: { color: Colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  inputGroup: { gap: 12 },
  inputLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  langSection: { gap: 12 },
  langRow: { gap: 8 },
  langScroll: { flexDirection: 'row', gap: 8 },
  langChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  langChipActive: { borderColor: Colors.accent, backgroundColor: `${Colors.accent}22` },
  langFlag: { fontSize: 18 },
  langText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  saveBtn: { backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: Colors.background, fontSize: 16, fontWeight: '700' },
});
